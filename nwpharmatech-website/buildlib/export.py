"""Integration package for the live website: one importable module per public component.

build.py calls export_modules() with the freshly built public/ tree. Each module is the content of a page's
<main> (or one section of it) taken from that tree, never the site header, footer, navigation, notice bar,
staging banner or skip link, and is written to integration/modules/<id>/:

    fragment.html   the markup, wrapped in <div class="nwpt-module" data-nwpt-module="<id>" lang="en-GB">;
                    every class carries the nwpt- prefix and every internal link is written from routes.json
    module.css      the rules of src/assets/css/site.css that the fragment uses, scoped under .nwpt-module
    module.js       only where the fragment needs behaviour (evidence filters, opening a named <details>)
    manifest.json   facts, references, downloads, anchors, links, dependencies, redirects, CSP needs,
                    publication blockers, optional assets
    preview.html    the module on its own under a strict CSP, for review (noindex)

Shared files: routes.json (page id -> path on the live site; override in src/integration-routes.json),
downloads/ and assets/ (exactly the files the modules link to), content/ (public-safe parts of content/)
and README.md. Nothing here replaces the live site: the live-site bots import each module individually
(docs/integration.md). The output is deterministic: the same input gives the same bytes.

MODULES lists the module ids; build.py checks that integration/modules/ holds each of them.
"""
from html import escape, unescape
from pathlib import Path
import copy
import hashlib
import json
import re
import shutil
import textwrap

from buildlib.content import ALLOWED_PROD, Content, ContentError
from buildlib.render import Renderer

PREFIX = "nwpt-"
WRAPPER = "nwpt-module"
# Every module.css selector starts here. Each :not(#id) always matches (the wrapper never carries those ids) and
# adds the weight of one id, so live rules written for the page's content area, such as "#content h2" or
# ".entry-content a", do not override a property the module sets. !important and inline styles still do.
SCOPE = f".{WRAPPER}:not(#{PREFIX}a):not(#{PREFIX}b)"
# A live page path: extensionless, no trailing slash (except "/"), nothing _redirects reads as a pattern
ROUTE_RE = re.compile(r"/(?:[A-Za-z0-9._~%-]+(?:/[A-Za-z0-9._~%-]+)*)?")
BASE_RE = re.compile(r"/(?:[A-Za-z0-9._~%-]+/)*")
REDIRECT_CODES = (301, 302, 307, 308)

# id, title, source page, section id (None: the whole <main>), elements left out (attribute, value, why), and
# links to pages outside the package that must be checked on the live site before the module is published
# (id, page, anchor, what the live target must give; review items of that page whose text contains
# review_match still apply while the link keeps the staging route, that is while it points at the staging page)
MODULE_SPECS = (
    {"id": "study-hub", "title": "Study hub: progress and evidence", "page": "study.html"},
    {"id": "phase-1", "title": "Phase 1 study", "page": "phase-1.html"},
    {"id": "formulation", "title": "Formulation explanation", "page": "science.html", "section": "formulation",
     "drop": [("class", "q-num", "The 'Question 2' label numbers the question within the staging science page.")]},
    {"id": "evidence-library", "title": "Evidence library", "page": "evidence.html"},
    {"id": "family-guide", "title": "Guide for young people and families", "page": "families.html",
     "depends": [{"id": "urgent-help", "page": "faq", "anchor": "urgent-help", "review_match": "crisis-line",
                  "needs": "a live page that gives urgent help by country: emergency numbers and crisis lines for "
                           "the United Kingdom, Ireland and the United States, checked immediately before launch"}]},
    {"id": "newsroom", "title": "Newsroom", "page": "newsroom.html",
     "drop": [("id", "signup", "Optional email sign-up: not part of the module. It stays off until a live provider "
                               "test is recorded (docs/email-signup.md) and its import is agreed separately.")]},
)
MODULES = [s["id"] for s in MODULE_SPECS]

# Site chrome that must never reach a module (it belongs to the live site, or to staging only)
CHROME = {"site-header", "site-footer", "site-nav", "mobile-nav", "nav-toggle", "notice-bar", "env-banner",
          "env-restricted", "skip-link", "subnav"}
# Fields of content/ that are internal notes, never exported
INTERNAL = {"review", "notes", "note", "location", "results_review", "verification_needed", "by"}
CONTENT_FILES = ("facts", "references", "study", "documents", "services", "reports", "updates", "sources")

TAG_RE = re.compile(r"<!--.*?-->|<(/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\"[^\"]*\"|'[^']*'|[^'\">])*)>", re.S)
ATTR_RE = re.compile(r"([^\s\"'>/=]+)(?:\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|([^\s\"'>]+)))?")
QUOTED_ATTR_RE = re.compile(r'(\s)([a-zA-Z][a-zA-Z0-9:-]*)="([^"]*)"')
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
SCHEME_RE = re.compile(r"^(?:[a-zA-Z][a-zA-Z0-9+.\-]*:|//)")
TBC_RE = re.compile(r"\[TBC:[^\]]*\]")
FACT_MARK = re.compile("\ue000([^\ue001]+)\ue001")


class ExportError(ContentError):
    """A module cannot be exported safely; the build fails and installs nothing."""
    def __init__(self, msg):
        super().__init__("integration export: " + msg)


# ---------- HTML ----------
class _El:
    __slots__ = ("tag", "attrs", "start", "open_end", "close_start", "end")

    def __init__(self, tag, attrs, start, open_end):
        self.tag, self.attrs, self.start, self.open_end = tag, attrs, start, open_end
        self.close_start = self.end = None

    def classes(self):
        return self.attrs.get("class", "").split()


def _attrs(text):
    out = {}
    for m in ATTR_RE.finditer(text):
        val = next((g for g in m.group(2, 3, 4) if g is not None), "")
        out.setdefault(m.group(1).lower(), unescape(val))
    return out


def elements(s):
    """Every element of an HTML string with its offsets, in document order (the build's own output is
    well formed: every non-void element is closed)."""
    out, stack = [], []
    for m in TAG_RE.finditer(s):
        if m.group(0).startswith("<!--"):
            continue
        tag = m.group(2).lower()
        if m.group(1):
            for i in range(len(stack) - 1, -1, -1):
                if stack[i].tag == tag:
                    for e in stack[i:]:
                        e.close_start, e.end = m.start(), m.end() if e is stack[i] else m.start()
                    del stack[i:]
                    break
            continue
        e = _El(tag, _attrs(m.group(3)), m.start(), m.end())
        out.append(e)
        if tag in VOID or m.group(3).rstrip().endswith("/"):
            e.close_start = e.end = m.end()
        else:
            stack.append(e)
    for e in stack:
        e.close_start = e.end = len(s)
    return out


def _region(page_html, section, where):
    """The content of <main>, or the outer HTML of the element with id=section, re-indented from column 0."""
    els = elements(page_html)
    if section:
        e = next((x for x in els if x.attrs.get("id") == section), None)
        if not e:
            raise ExportError(f"{where}: no element with id '{section}'")
        indent = page_html[page_html.rfind("\n", 0, e.start) + 1:e.start]
        text = (indent if not indent.strip() else "") + page_html[e.start:e.end]
    else:
        e = next((x for x in els if x.tag == "main"), None)
        if not e:
            raise ExportError(f"{where}: no <main> element")
        text = page_html[e.open_end:e.close_start]
    lines = text.split("\n")
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return textwrap.dedent("\n".join(line.rstrip() for line in lines))


def _drop(s, rules):
    """Remove the elements matching (attribute, value, why) rules. Returns (html, [why])."""
    spans, why = [], []
    for e in elements(s):
        for attr, value, reason in rules:
            hit = value in e.classes() if attr == "class" else e.attrs.get(attr) == value
            if hit and not any(a <= e.start < b for a, b in spans):
                spans.append((e.start, e.end))
                if reason not in why:
                    why.append(reason)
    for a, b in sorted(spans, reverse=True):
        line_start = s.rfind("\n", 0, a) + 1
        if not s[line_start:a].strip():   # the element starts its line: take the line with it
            a = line_start
            b = b + 1 if s[b:b + 1] == "\n" else b
        s = s[:a] + s[b:]
    return s, why


def _rewrite_attrs(s, fn):
    """Rewrite double-quoted attribute values of every start tag: fn(tag, name, value) -> value."""
    def tag_sub(m):
        if m.group(0).startswith("<!--") or m.group(1):
            return m.group(0)
        tag = m.group(2).lower()
        rest = QUOTED_ATTR_RE.sub(lambda a: f'{a.group(1)}{a.group(2)}="{fn(tag, a.group(2).lower(), a.group(3))}"', m.group(3))
        return f"<{m.group(2)}{rest}>"
    return TAG_RE.sub(tag_sub, s)


# ---------- CSS ----------
def _outside_strings(sel, fn):
    parts = re.split(r"(\"[^\"]*\"|'[^']*')", sel)
    return "".join(p if i % 2 else fn(p) for i, p in enumerate(parts))


def _split_selectors(prelude):
    out, depth, cur = [], 0, ""
    for ch in prelude:
        if ch in "([":
            depth += 1
        elif ch in ")]":
            depth -= 1
        if ch == "," and depth == 0:
            out.append(cur.strip())
            cur = ""
        else:
            cur += ch
    return out + [cur.strip()] if cur.strip() else out


def _selector_parts(sel):
    """(classes, ids, element types) a selector refers to."""
    s = re.sub(r"\"[^\"]*\"|'[^']*'|\[[^\]]*\]", "", sel)
    classes = re.findall(r"\.(-?[_a-zA-Z][\w-]*)", s)
    ids = re.findall(r"#(-?[_a-zA-Z][\w-]*)", s)
    s = re.sub(r"[.#]-?[_a-zA-Z][\w-]*", "", s)
    s = re.sub(r"::?-?[_a-zA-Z][\w-]*", "", s)
    return classes, ids, [t.lower() for t in re.findall(r"[a-zA-Z][\w-]*", s)]


def _css_blocks(text, where="site.css"):
    """[(prelude, declarations)] for style rules and at-rules such as @font-face, and [(prelude, [...])] for
    @media and @supports. Statement at-rules (@charset, @import) come back with declarations None."""
    out, i, n = [], 0, len(text)
    while True:
        j = text.find("{", i)
        semi = text.find(";", i)
        if text[i:].lstrip().startswith("@") and semi != -1 and (j == -1 or semi < j):
            out.append((" ".join(text[i:semi].split()), None))
            i = semi + 1
            continue
        if j == -1:
            if text[i:].strip():
                raise ExportError(f"{where}: cannot read {text[i:i + 60].strip()!r}")
            return out
        prelude = " ".join(text[i:j].split())
        depth, k = 1, j + 1
        while depth:
            if k >= n:
                raise ExportError(f"{where}: unbalanced braces after {prelude!r}")
            c = text[k]
            if c in "\"'":
                k = text.index(c, k + 1)
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
            k += 1
        body = text[j + 1:k - 1]
        out.append((prelude, _css_blocks(body, where) if prelude.startswith(("@media", "@supports")) else " ".join(body.split())))
        i = k


def _rename_vars(decls):
    return re.sub(r"(?<![\w-])--([A-Za-z][\w-]*)", r"--" + PREFIX + r"\1", decls)


def module_css(site_css, classes, ids, tags, module_id):
    """The rules of site.css that can apply to the fragment, scoped under SCOPE (.nwpt-module): classes renamed
    with the nwpt- prefix, :root custom properties (renamed --nwpt-*) moved onto the wrapper, html/body rules
    applied to the wrapper itself and element rules re-scoped under it. @font-face is never exported.
    The site's base link rule also underlines links explicitly: the site relies on the browser default, which a
    live reset such as "a { text-decoration: none }" would remove, leaving colour alone to mark links in text."""
    root_vars = {}
    known = set(tags) | {"html", "body"}

    def keep(sel):
        c, i, t = _selector_parts(sel)
        return all(x in classes for x in c) and all(x in ids for x in i) and all(x in known for x in t)

    def scope(sel):
        sel = _outside_strings(sel, lambda p: re.sub(r"\.(-?[_a-zA-Z][\w-]*)", lambda m: "." + PREFIX + m.group(1), p))
        m = re.match(r"(?:html|body)(?![\w-])", sel)
        return SCOPE + sel[m.end():] if m else f"{SCOPE} {sel}"

    def walk(items):
        out = []
        for prelude, body in items:
            if prelude.startswith(("@font-face", "@page", "@charset")):   # fonts and pages belong to the live site
                continue
            if prelude.startswith("@"):
                if not prelude.startswith(("@media", "@supports")):
                    raise ExportError(f"site.css: {prelude} cannot be scoped to a module")
                inner = walk(body)
                if inner:
                    out.append((prelude, inner))
            elif prelude == ":root":
                for d in body.split(";"):
                    name, _, value = d.partition(":")
                    if name.strip():
                        root_vars[name.strip()] = value.strip()
            else:
                sels = [scope(s) for s in _split_selectors(prelude) if keep(s)]
                if sels and "url(" in body:
                    raise ExportError(f"site.css: '{prelude}' loads a file with url(); module styles cannot carry it")
                if prelude == "a" and "text-decoration" not in body:
                    body = body.rstrip().rstrip(";") + "; text-decoration-line: underline;"
                    underlined.append(prelude)
                if sels:
                    out.append((", ".join(dict.fromkeys(sels)), _rename_vars(body)))
        return out

    underlined = []
    rules = walk(_css_blocks(re.sub(r"/\*.*?\*/", "", site_css, flags=re.S)))
    if "a" in tags and not underlined:
        raise ExportError("site.css: no base 'a { ... }' rule to carry the explicit link underline")

    def emit(items, ind=""):
        lines = []
        for prelude, body in items:
            if isinstance(body, list):
                lines += [f"{ind}{prelude} {{"] + emit(body, ind + "  ") + [ind + "}"]
            else:
                lines.append(f"{ind}{prelude} {{ {body} }}")
        return lines

    body = "\n".join(emit(rules))
    used, todo = set(), set(re.findall(r"var\(\s*--" + PREFIX + r"([\w-]+)", body))
    while todo:   # custom properties the kept rules use, and those they refer to
        v = todo.pop()
        used.add(v)
        todo |= set(re.findall(r"var\(\s*--([\w-]+)", root_vars.get("--" + v, ""))) - used
    missing = sorted(v for v in used if "--" + v not in root_vars)
    if missing:
        raise ExportError(f"site.css: custom properties used but not defined in :root: {missing}")
    props = "; ".join(f"--{PREFIX}{n[2:]}: {_rename_vars(v)}" for n, v in root_vars.items() if n[2:] in used)
    head = (f'/* NWPharmaTech integration module "{module_id}": styles generated by build.py from\n'
            f"   src/assets/css/site.css. Only the rules this module uses; every selector starts with .{WRAPPER}\n"
            f"   and every class carries the {PREFIX} prefix, so nothing here can style the rest of the page.\n"
            f"   {SCOPE[len(WRAPPER) + 1:]} always matches the wrapper and adds the weight of two ids, so\n"
            "   the live page's own content-area rules (#content h2, .entry-content a) do not override what the module\n"
            "   sets; !important and inline styles still do. Do not edit: change site.css or the content and rebuild. */\n")
    return head + (f"{SCOPE} {{ {props}; }}\n" if props else "") + body + "\n"


# ---------- JavaScript ----------
JS_FILTERS = """
      // Evidence filters. Without JavaScript every section is shown, grouped by topic.
      var bar = root.querySelector(".nwpt-filters");
      if (bar) {
        bar.hidden = false;
        var status = root.querySelector(".nwpt-filter-status");
        var sections = root.querySelectorAll(".nwpt-lib-section");
        var apply = function (btn) {
          var f = btn.getAttribute("data-filter");
          bar.querySelectorAll("button[data-filter]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
          var shown = 0;
          sections.forEach(function (s) {
            var on = f === "all" || s.getAttribute("data-section") === f;
            s.hidden = !on;
            if (on) shown += s.querySelectorAll(".nwpt-study-card").length;
          });
          if (status) status.textContent = "Showing " + shown + (shown === 1 ? " source" : " sources") + (f === "all" ? "" : " in " + btn.firstChild.textContent.trim());
        };
        bar.addEventListener("click", function (e) {
          var btn = e.target.closest("button[data-filter]");
          if (btn && bar.contains(btn)) apply(btn);
        });
        // A link to a card in a topic the filter hides shows every topic again, so the page can move to the card.
        var reveal = function (hash) {
          var id;
          try { id = decodeURIComponent(hash.slice(1)); } catch (err) { return false; }
          var el = id && document.getElementById(id);
          var s = el && root.contains(el) ? el.closest(".nwpt-lib-section") : null;
          var all = bar.querySelector('button[data-filter="all"]');
          if (!s || !s.hidden || !all) return false;
          apply(all);
          return el;
        };
        root.addEventListener("click", function (e) {
          var a = e.target.closest('a[href^="#"]');
          if (a && root.contains(a)) reveal(a.getAttribute("href"));   // before the browser follows the link
        });
        window.addEventListener("hashchange", function () {
          var el = reveal(location.hash);   // a link from elsewhere on the page: the browser found nothing to show
          if (el) el.scrollIntoView();
        });
      }
"""
JS_DETAILS = """
      // Open a collapsed item when the address names it (for example /page#item-id).
      var openTarget = function () {
        var id;
        try { id = decodeURIComponent(location.hash.slice(1)); } catch (err) { return; }
        var el = id && document.getElementById(id);
        if (el && el.tagName === "DETAILS" && root.contains(el)) {
          el.open = true;
          var s = el.querySelector("summary");
          if (s) s.focus();
        }
      };
      openTarget();
      window.addEventListener("hashchange", openTarget);
"""


def module_js(module_id, parts):
    return (f'// NWPharmaTech integration module "{module_id}". Generated by build.py from src/assets/js/site.js; do not edit.\n'
            f'// Acts only inside [data-nwpt-module="{module_id}"]; loaded as a file, so the page needs no inline script.\n'
            '(function () {\n  "use strict";\n  var init = function () {\n'
            f'    document.querySelectorAll(\'[data-nwpt-module="{module_id}"]\').forEach(function (root) {{\n'
            '      if (root.hasAttribute("data-nwpt-ready")) return;\n      root.setAttribute("data-nwpt-ready", "");'
            + "".join(parts) +
            '    });\n  };\n  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);\n'
            '  else init();\n})();\n')


# ---------- routes and content ----------
def staging_route(name):
    return "/" if name == "index.html" else "/" + name[:-5]


def _overrides(root):
    """src/integration-routes.json, if present: {"pages": {...}, "downloads", "assets", "confirmed_dependencies"}."""
    src = root / "src" / "integration-routes.json"
    if not src.exists():
        return {}
    try:
        over = json.loads(src.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise ExportError(f"{src.name}: {e}")
    unknown = sorted(set(over) - {"_doc", "pages", "downloads", "assets", "confirmed_dependencies"})
    if unknown:
        raise ExportError(f"{src.name}: unknown keys {unknown}")
    return over


def load_routes(root, page_names):
    """Page id -> path on the live site. Defaults to the staging routes; src/integration-routes.json (same
    shape as integration/routes.json, any subset) overrides them so every fragment link changes in one place.
    A live path must be one Cloudflare Pages serves without redirecting it: extensionless, no trailing slash."""
    routes = {"pages": {n[:-5]: staging_route(n) for n in sorted(page_names)}, "downloads": "/downloads/", "assets": "/assets/"}
    over = _overrides(root)
    for pid, path in over.get("pages", {}).items():
        if pid not in routes["pages"]:
            raise ExportError(f"integration-routes.json: unknown page id '{pid}'")
        routes["pages"][pid] = path
    for k in ("downloads", "assets"):
        routes[k] = over.get(k, routes[k])
    live = {}
    for pid, path in routes["pages"].items():
        if not isinstance(path, str) or not path.startswith("/") or path.endswith(".html") or "#" in path:
            raise ExportError(f"route for '{pid}' must be an extensionless path starting with / (got {path!r}); "
                              "Cloudflare Pages answers /x.html with a 308 to /x")
        if path != "/" and path.endswith("/"):
            raise ExportError(f"route for '{pid}' must not end with / (got {path!r}); Cloudflare Pages redirects "
                              "between /x and /x/ itself, so a redirect rule to /x/ can loop")
        if not ROUTE_RE.fullmatch(path):
            raise ExportError(f"route for '{pid}' must be a plain path: letters, digits and . _ ~ % - between single "
                              f"slashes (got {path!r}); _redirects reads :name and * as patterns")
        if path in live:
            raise ExportError(f"routes for '{live[path]}' and '{pid}' are both {path}")
        live[path] = pid
    for k in ("downloads", "assets"):
        if not (isinstance(routes[k], str) and BASE_RE.fullmatch(routes[k])):
            raise ExportError(f"route '{k}' must start and end with / (got {routes[k]!r})")
    return routes


def load_confirmed(root):
    """Checks recorded in src/integration-routes.json -> confirmed_dependencies: {dependency id: {"href": the live
    link that was checked, "record": who checked what, and when}}. Only a person responsible for the live site
    records one; a confirmation counts only while the link still has the href that was checked."""
    conf = _overrides(root).get("confirmed_dependencies", {})
    known = {d["id"] for s in MODULE_SPECS for d in s.get("depends", [])}
    for k, v in conf.items():
        if k not in known:
            raise ExportError(f"integration-routes.json: confirmed_dependencies: unknown dependency '{k}' (known: {sorted(known)})")
        if not (isinstance(v, dict) and isinstance(v.get("href"), str) and isinstance(v.get("record"), str) and v["record"].strip()):
            raise ExportError(f"integration-routes.json: confirmed_dependencies.{k} must be "
                              '{"href": "<the live link checked>", "record": "<who checked what, and when>"}')
    return conf


def check_redirects(live_routes, rules):
    """The rules build.py's load_redirects applies to src/redirects.txt, applied to every redirect the manifests
    ask the live site to add: no rule may shadow a live page (its path, its .html or trailing-slash form, or
    /index.html), every target is a live page (optionally with a fragment), no target is itself redirected (a
    chain, or a loop), no path has two rules, and the status is a redirect."""
    routes = set(live_routes)
    shadowed = routes | {r if r == "/" else r + ".html" for r in routes} | {r + "/" for r in routes if r != "/"} | {"/index.html"}
    sources = {}
    errs = []
    for mid, r in rules:
        sources.setdefault(r["from"], []).append((mid, r["to"]))
    for mid, r in rules:
        src, dst = r["from"], r["to"]
        if re.search(r"[*:]", src):
            errs.append(f"{mid}: redirect {src}: a pattern rule cannot be checked here; list each path")
        if src in shadowed:
            errs.append(f"{mid}: redirect {src} -> {dst} shadows a live page (Cloudflare Pages already serves or redirects {src})")
        if dst.split("#")[0] not in routes:
            errs.append(f"{mid}: redirect {src} -> {dst}: target is not a live page route")
        if dst.split("#")[0] in sources:
            errs.append(f"{mid}: redirect {src} -> {dst}: target is itself redirected (chain or loop)")
        if len({t for _, t in sources[src]}) > 1:
            errs.append(f"{mid}: redirect {src}: more than one rule for this path {sorted(sources[src])}")
        if r["status"] not in REDIRECT_CODES:
            errs.append(f"{mid}: redirect {src}: status {r['status']}")
    if errs:
        raise ExportError("redirects the live site would need are unsafe with these routes "
                          "(src/integration-routes.json):\n  " + "\n  ".join(dict.fromkeys(errs)))


def _public_only(o):
    if isinstance(o, dict):
        return {k: _public_only(v) for k, v in o.items() if k not in INTERNAL}
    if isinstance(o, list):
        return [_public_only(x) for x in o if not (isinstance(x, dict) and x.get("public") is False)]
    return o


EXPORT_DOCS = {
    "facts": "Public, confirmed facts only. 'verification' says how each value was checked and 'as_of' the date it "
             "applies to; 'source' is an id in sources.json.",
    "sources": "Only sources with a public citation label, or cited by an item in this export ('source' or "
               "'sources'). public_label null: the source is not citable publicly. Titles, locations and notes are "
               "internal and not exported.",
    "documents": "Public documents, with the published versions of each in 'history' (newest first). An empty "
                 "history means no version has been published yet.",
}


def _source_ids(o, out):
    """Every source id an exported item cites in a 'source' or 'sources' field."""
    if isinstance(o, dict):
        for k, v in o.items():
            if k in ("source", "sources"):
                out.update(x for x in (v if isinstance(v, list) else [v]) if isinstance(x, str))
            else:
                _source_ids(v, out)
    elif isinstance(o, list):
        for x in o:
            _source_ids(x, out)
    return out


def public_content(root):
    """The public-safe parts of the shared content model: public items only, internal fields removed, only
    published document versions, and only the sources that are citable or that an exported item cites.
    {{fact:id}} placeholders are replaced by the fact's value, so a consumer never sees template syntax.
    people.json is left out (no module shows profiles, and titles await management confirmation)."""
    c = root / "content"
    out = {}
    for name in CONTENT_FILES:
        data = json.loads((c / f"{name}.json").read_text(encoding="utf-8"))
        if name == "facts":
            data["facts"] = {k: v for k, v in data["facts"].items() if v.get("public") and v.get("verification") != "unconfirmed"}
        if name == "documents":
            for d in data["documents"]:
                d["history"] = [{k: v for k, v in h.items() if k != "status"}   # 'status' is an internal note
                                for h in d.get("history", []) if h.get("published") is True]
        if name == "sources":   # labels only; which ids are kept is decided once the other files are known
            data = {k: {"public_label": v.get("public_label")} for k, v in data.items() if k != "_doc"}
        data = _public_only({k: v for k, v in data.items() if k != "_doc"})
        out[name] = {"_doc": f"Public-safe export of content/{name}.json, generated by build.py; do not edit. "
                             + EXPORT_DOCS.get(name, "Public items only; internal fields removed.")
                             + " Schema: docs/content-schema.md.", **data}
    facts = out["facts"]["facts"]

    def expand(o, where):
        if isinstance(o, dict):
            return {k: expand(v, where) for k, v in o.items()}
        if isinstance(o, list):
            return [expand(x, where) for x in o]
        if not isinstance(o, str):
            return o

        def fact(m):
            if m.group(1) not in facts:
                raise ExportError(f"content/{where}.json: {m.group(0)} names a fact that is not public and confirmed")
            return facts[m.group(1)]["value"]
        o = re.sub(r"\{\{fact:([\w.-]+)\}\}", fact, o)
        if "{{" in o:
            raise ExportError(f"content/{where}.json: template token in exported text: {o[o.index('{{'):][:60]!r}")
        return o
    out = {name: expand(data, name) for name, data in out.items()}
    cited = set()
    for name, data in out.items():
        if name != "sources":
            _source_ids(data, cited)
    out["sources"] = {k: v for k, v in out["sources"].items() if k == "_doc" or v["public_label"] or k in cited}
    return out


class _AnyPdf(dict):
    """PDF manifest stand-in for the tracing render (labels are not read from it)."""
    def __missing__(self, key):
        return {"bytes": 1024, "pages": 1}

    def get(self, key, default=None):
        return self[key]

    def __bool__(self):
        return True


def _traced(content, root, name, page_names, section, drops):
    """Render the page body again with every fact value marked. Returns a Content copy holding what that
    render used, and the fact ids and [TBC] markers found in the module's part of the page (the build's own
    used_facts is per page, header and footer included)."""
    tc = copy.copy(content)
    tc.used_facts, tc.used_refs = {}, {}
    tc.fact = lambda fid, page, public=True: f"\ue000{fid}\ue001{Content.fact(tc, fid, page, public)}\ue002"
    text = (root / "src" / "pages" / name).read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    meta = dict((k.strip(), v.strip()) for k, _, v in (ln.partition(":") for ln in m.group(1).splitlines() if ln.strip()))
    body = re.sub(r"<!--optional:signup-->.*?<!--/optional-->", "", text[m.end():], flags=re.S)
    html = Renderer(tc, "staging", root, available=set(page_names), pdfs=_AnyPdf()).expand(body, name, meta)
    region = _region(f"<main>{html}</main>", section, f"src/pages/{name}")
    region, _ = _drop(region, drops)
    return tc, sorted(set(FACT_MARK.findall(region))), TBC_RE.findall(region)


# ---------- one module ----------
def _module(spec, root, content, public_dir, routes, page_names, site_css, redirects, site_links, confirmed):
    mid, name, section = spec["id"], spec["page"], spec.get("section")
    pid = name[:-5]
    where = f"public/{name}" + (f"#{section}" if section else "")
    page_html = (public_dir / name).read_text(encoding="utf-8")
    frag, dropped = _drop(_region(page_html, section, where), spec.get("drop", []))

    els = elements(frag)
    ids = [e.attrs["id"] for e in els if "id" in e.attrs]
    classes = {c for e in els for c in e.classes()}
    tags = {e.tag for e in els}
    if len(ids) != len(set(ids)):
        raise ExportError(f"{mid}: duplicate ids {sorted({i for i in ids if ids.count(i) > 1})}")
    if classes & CHROME:
        raise ExportError(f"{mid}: site chrome in the module ({sorted(classes & CHROME)})")
    if WRAPPER[len(PREFIX):] in classes:
        raise ExportError(f"{mid}: class '{WRAPPER[len(PREFIX):]}' would collide with the module wrapper once prefixed")
    bad = re.findall(r"<(script|style|link|meta|main|form)\b|\s(style|on[a-z]+)=|\[TBC", frag, re.I)
    if bad:
        raise ExportError(f"{mid}: inline script, style, event handler, form or review marker in the module: {bad[:5]}")

    by_route = {staging_route(n): n[:-5] for n in page_names}
    links = {"pages": {}, "downloads": set(), "assets": set(), "external": set()}

    def rewrite_url(raw):
        url = unescape(raw)
        if SCHEME_RE.match(url):
            links["external"].add(url)
            return raw
        path, hashmark, frag_id = url.partition("#")
        if not path:
            if frag_id in ids:
                return raw
            path = staging_route(name)   # an anchor elsewhere on the source page
        if path.startswith("/downloads/"):
            links["downloads"].add(path[len("/downloads/"):])
            return escape(routes["downloads"] + path[len("/downloads/"):])
        if path.startswith("/assets/"):
            links["assets"].add(path[len("/assets/"):])
            return escape(routes["assets"] + path[len("/assets/"):])
        target = by_route.get(path)
        if target is None:
            raise ExportError(f"{mid}: link to {url}, which is not a page, download or asset")
        if target == pid and hashmark and frag_id in ids:
            return escape("#" + frag_id)
        live = routes["pages"][target] + (hashmark + frag_id if hashmark else "")
        links["pages"].setdefault(target, set()).add(hashmark + frag_id if hashmark else "")
        return escape(live)

    seen = {"class": 0, "link": 0}

    def attr(tag, name_, value):
        if name_ == "class":
            seen["class"] += 1
            return " ".join(c if c.startswith(PREFIX) else PREFIX + c for c in value.split())
        if name_ in ("href", "src", "poster"):
            seen["link"] += 1
            return rewrite_url(value)
        return value

    body = _rewrite_attrs(frag, attr)
    # every class and link attribute went through the rewrite (one that is not double-quoted would not)
    if (seen["class"], seen["link"]) != (sum("class" in e.attrs for e in els), sum(a in e.attrs for e in els for a in ("href", "src", "poster"))):
        raise ExportError(f"{mid}: a class, href or src attribute in {where} is not double-quoted and cannot be rewritten")

    # behaviour: only what the fragment needs
    js_parts = []
    if "filters" in classes and re.search(r"<button[^>]*data-filter=", frag):
        js_parts.append(JS_FILTERS)
    if any(e.tag == "details" and "id" in e.attrs for e in els):
        js_parts.append(JS_DETAILS)
    js = module_js(mid, js_parts) if js_parts else None
    css = module_css(site_css, classes, set(ids), tags, mid)
    lang = content.ui.get("lang", "en-GB")
    route = routes["pages"][pid] + (f"#{section}" if section else "")
    fragment = (f'<!-- NWPharmaTech integration module "{mid}" ({spec["title"]}). Belongs at {route} on the live site.\n'
                f"     Generated by build.py from content/ and src/pages/{name}; do not edit by hand. Needs module.css"
                + (" and module.js" if js else "") + "; see manifest.json. -->\n"
                f'<div class="{WRAPPER}" data-nwpt-module="{mid}" lang="{lang}">\n'
                + textwrap.indent(body, "  ") + "\n</div>\n")

    # facts, references and blockers of this part of the page
    tc, fact_ids, tbc = _traced(content, root, name, page_names, section, spec.get("drop", []))
    ref_ids = sorted({r for r in re.findall(r'(?:href="[^"#]*#ref-|\sid="ref-)([a-z0-9\-]+)"', frag) if r in content.ref_ids})
    facts = []
    for fid in fact_ids:
        f = content.facts[fid]
        src = content.sources.get(f["source"]) or {}
        facts.append({"id": fid, "value": f["value"], "verification": f["verification"], "as_of": f["as_of"],
                      "source_label": src.get("public_label"),
                      "production_ready": f["verification"] in ALLOWED_PROD or bool(f.get("accept_for_production"))})
    refs = []
    for rid in ref_ids:
        r = next(x for x in content.refs["items"] if x["id"] == rid)
        refs.append({"id": rid, "short": r["short"], "verification": r["verification"],
                     "production_ready": r["verification"] in ALLOWED_PROD or bool(r.get("accept_for_production"))})
    # review items name the pages (and documents) they affect: "study.html, updates.html: ..."
    page_keys = {name, pid, staging_route(name)} | ({f"{name}#{section}"} if section else set())
    doc_titles = [d["title"].lower() for d in content.documents if d.get("file") and Path(d["file"]).name in links["downloads"]]

    def affects(where):
        return any(w in page_keys or any(t in w.lower() for t in doc_titles) for w in (x.strip() for x in where.split(",")))
    blockers = [f"{name}: {t}" for t in tbc]
    blockers += [b for b in content.review_items() if affects(b.split(": ", 1)[0])]
    for b in Content.production_blockers(tc):   # tc rendered this page only
        kind, bid = b.split(" ", 2)[:2]
        if (kind == "fact" and bid in fact_ids) or (kind == "reference" and bid in ref_ids):
            blockers.append(b)
    text = re.sub(r"<[^>]+>", " ", body)
    names = [p["name"] for p in content.people["people"] if p.get("public", True) and p["name"] in text]
    blockers += [b for b in content.leadership_blockers() if any(n in b for n in names)]
    if 'class="nwpt-dangling"' in body:
        blockers.append(f"{name}: links to a page that is not built")

    # pages outside this module that its links need on the live site; declared ones block publication until checked
    in_package = {s["page"][:-5]: s["id"] for s in MODULE_SPECS}
    deps = []
    for d in spec.get("depends", []):
        href = routes["pages"][d["page"]] + "#" + d["anchor"]
        if "#" + d["anchor"] not in links["pages"].get(d["page"], set()):
            raise ExportError(f"{mid}: dependency '{d['id']}' names {href}, which the module does not link to")
        rec = confirmed.get(d["id"])
        ok = bool(rec) and rec["href"] == href
        deps.append({"id": d["id"], "kind": "page outside the package", "page": d["page"], "links": [href],
                     "needs": d["needs"], "blocks_publication": not ok, "confirmed": rec["record"] if ok else None})
        if not ok:
            stale = f"; the recorded check was for {rec['href']}" if rec else ""
            blockers.append(f"dependency {d['id']}: {href} must reach {d['needs']}. Not confirmed on the live site{stale} "
                            "(record the check in src/integration-routes.json -> confirmed_dependencies and rebuild)")
        if routes["pages"][d["page"]] == staging_route(d["page"] + ".html"):   # still the staging page's route
            blockers += [b for b in content.review_items() if d["review_match"] in b
                         and f"{d['page']}.html" in [w.strip() for w in b.split(": ", 1)[0].split(",")]]
    declared = {(d["page"], "#" + d["anchor"]) for d in spec.get("depends", [])}
    for p in sorted(links["pages"]):
        hrefs = [routes["pages"][p] + fr for fr in sorted(links["pages"][p]) if (p, fr) not in declared]
        if hrefs and p != pid:
            other = in_package.get(p)
            deps.append({"id": other or p, "kind": "module" if other else "page outside the package", "page": p,
                         "links": hrefs,
                         "needs": f"module {other} imported first or at the same time, so these links and anchors resolve"
                         if other else f"a live page at {routes['pages'][p]} (set its path in src/integration-routes.json)",
                         "blocks_publication": False})
    optional = []
    for aid, a in sorted(content.assets.items()):
        if any(u.split()[0] in [name] + [f"{name}#{i}" for i in ids] for u in a.get("used_on", []) if u.strip()):
            if not (a.get("authorised") and a.get("caption_approved", True) and (root / "src" / a["file"]).exists()):
                optional.append({"asset": aid, "file": a["file"], "status": "not supplied or not authorised: the slot renders nothing",
                                 "fallback": a.get("fallback")})

    # redirects the live site needs so that published addresses reach this module. The staging route is required
    # (published material uses it); a short alias is optional and is skipped where the live site already has
    # something at that path. An alias that is now the page's own live path is not a redirect at all: left out.
    # export_modules() checks all of them together for shadowing, chains and loops.
    redir = []
    if routes["pages"][pid] != staging_route(name):
        redir.append({"from": staging_route(name), "to": routes["pages"][pid], "status": 301, "kind": "staging route",
                      "required": True, "why": "published material (PDFs, earlier staging links) uses the staging route"})
    for src, dst, code in redirects:
        path, hashmark, frag_id = dst.partition("#")
        if by_route.get(path) == pid and (frag_id in ids if (frag_id or section) else True) and src != routes["pages"][pid]:
            redir.append({"from": src, "to": routes["pages"][pid] + (hashmark + frag_id if hashmark else ""), "status": int(code),
                          "kind": "alias", "required": False,
                          "why": "short alias in src/redirects.txt; add it only if nothing on the live site already "
                                 "answers at this path (a page, file or redirect), otherwise skip it"})
    downloads = []
    for f in sorted(links["downloads"]):
        p = public_dir / "downloads" / f
        if not p.exists():
            raise ExportError(f"{mid}: links to downloads/{f}, which was not built")
        downloads.append({"file": f"downloads/{f}", "href": routes["downloads"] + f, "bytes": p.stat().st_size,
                          "sha256": hashlib.sha256(p.read_bytes()).hexdigest()})
    assets = []
    for f in sorted(links["assets"]):
        p = public_dir / "assets" / f
        if not p.exists():
            raise ExportError(f"{mid}: links to assets/{f}, which was not built")
        assets.append({"file": f"assets/{f}", "href": routes["assets"] + f, "bytes": p.stat().st_size,
                       "sha256": hashlib.sha256(p.read_bytes()).hexdigest()})

    files = {"fragment.html": fragment, "module.css": css}
    if js:
        files["module.js"] = js
    files["preview.html"] = _preview(spec, fragment, bool(js), lang)
    csp = {"script-src": ["'self'"] if js else [], "style-src": ["'self'"], "img-src": ["'self'"] if assets else [],
           "connect-src": [], "font-src": [], "frame-src": [],
           "detail": "No inline scripts, style attributes, event handlers, fonts or third-party requests. The live policy "
                   "can stay script-src 'self'; style-src 'self'. Links to other sites are ordinary links, not requests."}
    manifest = {
        "id": mid, "title": spec["title"],
        "source": {"page": name, "template": f"src/pages/{name}", "staging_route": staging_route(name) + (f"#{section}" if section else ""),
                   "part": f"section#{section}" if section else "the content of <main>"},
        "placement": {"live_route": route,
                      "where": (f"A section of the live {routes['pages'][pid]} page, in the page's main content."
                                if section else f"The main content of the live {routes['pages'][pid]} page, between the live header and footer."),
                      "first_heading": next((e.tag for e in els if re.fullmatch(r"h[1-6]", e.tag)), None),
                      # for the live page's <head> (a section module takes the host page's own)
                      "page_title": None if section else unescape(re.search(r"<title>(.*?)</title>", page_html, re.S).group(1)),
                      "page_description": None if section else unescape(re.search(r'<meta name="description" content="([^"]*)">', page_html).group(1))},
        "files": {k: {"bytes": len(v.encode("utf-8")), "sha256": hashlib.sha256(v.encode("utf-8")).hexdigest()} for k, v in files.items()},
        "left_out": dropped,
        "facts": facts, "references": refs, "downloads": downloads, "assets": assets,
        "anchors": {"ids": ids, "linked_from_site": sorted(i for i in ids if i in site_links.get(pid, set()))},
        "links": {"pages": [{"page": p, "href": routes["pages"][p] + fr} for p in sorted(links["pages"]) for fr in sorted(links["pages"][p])],
                  "external": sorted(links["external"])},
        "dependencies": deps,
        "redirects": redir,
        "javascript": ["evidence filters" if p is JS_FILTERS else "open a <details> named by the URL fragment" for p in js_parts],
        "csp": csp,
        "publication_blockers": blockers,
        "optional_assets": optional,
    }
    files["manifest.json"] = json.dumps(manifest, indent=1, ensure_ascii=False) + "\n"
    return manifest, files, links


def _preview(spec, fragment, has_js, lang):
    csp = "default-src 'none'; style-src 'self'; script-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'"
    return ("<!DOCTYPE html>\n"
            f'<html lang="{lang}">\n<head>\n  <meta charset="utf-8">\n'
            '  <meta name="viewport" content="width=device-width, initial-scale=1">\n'
            f'  <meta http-equiv="Content-Security-Policy" content="{csp}">\n'
            '  <meta name="robots" content="noindex, nofollow">\n'
            f'  <title>Module preview: {escape(spec["title"])}</title>\n'
            '  <link rel="icon" href="data:,">\n  <link rel="stylesheet" href="module.css">\n'
            + ('  <script src="module.js" defer></script>\n' if has_js else "") +
            "</head>\n<body>\n"
            f'<p>Integration preview of module "{spec["id"]}", for review only. Not a page of the website; links point to live-site paths.</p>\n'
            "<main>\n" + fragment + "</main>\n</body>\n</html>\n")


# ---------- entry point ----------
def export_modules(root, content, public_dir, out_dir):
    root, public_dir, out_dir = Path(root), Path(public_dir), Path(out_dir)
    page_names = sorted(p.name for p in (root / "src" / "pages").glob("*.html"))
    routes = load_routes(root, page_names)
    confirmed = load_confirmed(root)
    site_css = (root / "src" / "assets" / "css" / "site.css").read_text(encoding="utf-8")
    redirects = [tuple(ln.split()) for ln in (root / "src" / "redirects.txt").read_text(encoding="utf-8").splitlines()
                 if ln.strip() and not ln.lstrip().startswith("#") and len(ln.split()) == 3]
    # anchors other pages and redirects link to: page id -> {id}
    site_links = {}
    by_route = {staging_route(n): n[:-5] for n in page_names}
    for n in page_names:
        for path, frag_id in re.findall(r'href="(/[^"#]*)#([^"]+)"', (public_dir / n).read_text(encoding="utf-8")):
            if by_route.get(path) and by_route[path] != n[:-5]:
                site_links.setdefault(by_route[path], set()).add(unescape(frag_id))
    for _, dst, _ in redirects:
        path, _, frag_id = dst.partition("#")
        if frag_id and by_route.get(path):
            site_links.setdefault(by_route[path], set()).add(frag_id)

    built = [_module(spec, root, content, public_dir, routes, page_names, site_css, redirects, site_links, confirmed)
             for spec in MODULE_SPECS]
    check_redirects(routes["pages"].values(), [(m["id"], r) for m, _, _ in built for r in m["redirects"]])

    out_dir.mkdir(parents=True)
    summary = []
    needed = {"downloads": set(), "assets": set()}
    for spec, (manifest, files, links) in zip(MODULE_SPECS, built):
        d = out_dir / "modules" / spec["id"]
        d.mkdir(parents=True)
        for fname, text in files.items():
            (d / fname).write_text(text, encoding="utf-8")
        needed["downloads"] |= links["downloads"]
        needed["assets"] |= links["assets"]
        summary.append(manifest)
    for kind in ("downloads", "assets"):
        for f in sorted(needed[kind]):
            (out_dir / kind / f).parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(public_dir / kind / f, out_dir / kind / f)
    routes_doc = {"_doc": "Where each page lives on the live site, and the base paths of downloads and assets. Every "
                          "internal link in modules/*/fragment.html is written from this map. To change a path, set it in "
                          "src/integration-routes.json (same shape, any subset) and run python3 build.py.", **routes}
    (out_dir / "routes.json").write_text(json.dumps(routes_doc, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    (out_dir / "content").mkdir()
    for fname, data in public_content(root).items():
        (out_dir / "content" / f"{fname}.json").write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    (out_dir / "README.md").write_text(_readme(summary, routes, needed), encoding="utf-8")


def _readme(summary, routes, needed):
    rows = "".join(
        f"| `{m['id']}` | {m['title']} | `{m['placement']['live_route']}` | "
        f"{'yes' if 'module.js' in m['files'] else 'no'} | {', '.join('`' + d['file'] + '`' for d in m['downloads']) or 'none'} | "
        f"{len(m['publication_blockers'])} | {len(m['optional_assets'])} |\n" for m in summary)
    blockers = ""
    for m in summary:
        items = "".join(f"  - {b}\n" for b in m["publication_blockers"]) or "  - none\n"
        blockers += f"- **{m['id']}**\n{items}"
    optional = "".join(f"- `{m['id']}`: {o['asset']} ({o['file']})\n" for m in summary for o in m["optional_assets"]) or "- none\n"
    return f"""# NWPharmaTech integration package

Generated by `python3 build.py` (`buildlib/export.py`). **Nothing here replaces the live website automatically.**
The live-site bots import each module individually into the existing site, keeping the live header, footer,
brand assets and security configuration. Step-by-step instructions for each module: `docs/integration.md`.

| Module | Title | Live path | JavaScript | Downloads | Publication blockers | Optional assets missing |
|---|---|---|---|---|---|---|
{rows}
Each `modules/<id>/` folder holds `fragment.html` (the markup), `module.css` (styles scoped under `.nwpt-module`,
classes prefixed `nwpt-`), `module.js` where needed, `manifest.json` (facts, references, links, dependencies,
redirects, anchors, CSP needs, blockers) and `preview.html` (the module on its own under a strict CSP; open it over
HTTP, for review only).

Redirects in `manifest.json` → `redirects`: add every one with `"required": true`. An alias (`"required": false`)
is added only if nothing on the live site already answers at its path; otherwise skip it.

Shared files:
- `routes.json`: page id to live path. Downloads are linked under `{routes['downloads']}` and assets under `{routes['assets']}`.
  Change paths in `src/integration-routes.json` and rebuild; never edit the fragments by hand.
- `downloads/`: {', '.join('`' + f + '`' for f in sorted(needed['downloads'])) or 'none'}. Replace the live copies whenever they change (PDFs are regenerated and checked by the build when their facts change).
- `assets/`: {', '.join('`' + f + '`' for f in sorted(needed['assets'])) or 'none needed at present (an image appears here once it is supplied and authorised)'}.
- `content/`: the public-safe parts of the shared content model (public items only; internal notes, unpublished document versions and uncited source ids removed; fact placeholders replaced by their values). `people.json` is not included: no module shows profiles, and leadership titles await management confirmation.

## Publication blockers by module
These must be cleared before the module is published on the live site. They are content and approval items, and
live-site dependencies that must be checked first (`manifest.json` → `dependencies` with `"blocks_publication": true`),
listed in `manifest.json` → `publication_blockers`; the build report (`build/build-report.json`) lists the whole site's content blockers.

{blockers}
## Optional assets not yet supplied (never block publication)
{optional}"""
