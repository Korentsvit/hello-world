"""Integration package for the live website: one importable module per public component.

build.py calls export_modules() with the freshly built public/ tree. Each module is the content of a page's
<main> (or one section of it) taken from that tree, never the site header, footer, navigation, notice bar,
staging banner or skip link, and is written to integration/modules/<id>/:

    fragment.html   the markup, wrapped in <div class="nwpt-module" data-nwpt-module="<id>" lang="en-GB">;
                    every class carries the nwpt- prefix and every internal link is written from routes.json
    module.css      the rules of src/assets/css/site.css that the fragment uses, scoped under .nwpt-module
    module.js       only where the fragment needs behaviour (evidence filters, opening a named <details>)
    manifest.json   facts, references, downloads, anchors, links, CSP needs, publication blockers, optional assets
    preview.html    the module on its own under a strict CSP, for review (noindex)

Shared files: routes.json (page id -> path on the live site; override in src/integration-routes.json),
downloads/ and assets/ (exactly the files the modules link to), content/ (public-safe parts of content/)
and README.md. Nothing here replaces the live site: the live-site bots import each module individually
(docs/integration.md). The output is deterministic: the same input gives the same bytes.
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

# id, title, source page, section id (None: the whole <main>), elements left out (attribute, value, why)
MODULES = (
    {"id": "study-hub", "title": "Study hub: progress and evidence", "page": "study.html"},
    {"id": "phase-1", "title": "Phase 1 study", "page": "phase-1.html"},
    {"id": "formulation", "title": "Formulation explanation", "page": "science.html", "section": "formulation",
     "drop": [("class", "q-num", "The 'Question 2' label numbers the question within the staging science page.")]},
    {"id": "evidence-library", "title": "Evidence library", "page": "evidence.html"},
    {"id": "family-guide", "title": "Guide for young people and families", "page": "families.html"},
    {"id": "newsroom", "title": "Newsroom", "page": "newsroom.html",
     "drop": [("id", "signup", "Optional email sign-up: not part of the module. It stays off until a live provider "
                               "test is recorded (docs/email-signup.md) and its import is agreed separately.")]},
)

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
    """The rules of site.css that can apply to the fragment, scoped under .nwpt-module: classes renamed with
    the nwpt- prefix, :root custom properties (renamed --nwpt-*) moved onto .nwpt-module, html/body rules
    applied to .nwpt-module itself and element rules re-scoped under it. @font-face is never exported."""
    root_vars = {}
    known = set(tags) | {"html", "body"}

    def keep(sel):
        c, i, t = _selector_parts(sel)
        return all(x in classes for x in c) and all(x in ids for x in i) and all(x in known for x in t)

    def scope(sel):
        sel = _outside_strings(sel, lambda p: re.sub(r"\.(-?[_a-zA-Z][\w-]*)", lambda m: "." + PREFIX + m.group(1), p))
        m = re.match(r"(?:html|body)(?![\w-])", sel)
        return "." + WRAPPER + sel[m.end():] if m else f".{WRAPPER} {sel}"

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
                if sels:
                    out.append((", ".join(dict.fromkeys(sels)), _rename_vars(body)))
        return out

    rules = walk(_css_blocks(re.sub(r"/\*.*?\*/", "", site_css, flags=re.S)))

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
            "   Do not edit: change site.css or the content and rebuild. */\n")
    return head + (f".{WRAPPER} {{ {props}; }}\n" if props else "") + body + "\n"


# ---------- JavaScript ----------
JS_FILTERS = """
      // Evidence filters. Without JavaScript every section is shown, grouped by topic.
      var bar = root.querySelector(".nwpt-filters");
      if (bar) {
        bar.hidden = false;
        var status = root.querySelector(".nwpt-filter-status");
        var sections = root.querySelectorAll(".nwpt-lib-section");
        bar.addEventListener("click", function (e) {
          var btn = e.target.closest("button[data-filter]");
          if (!btn || !bar.contains(btn)) return;
          var f = btn.getAttribute("data-filter");
          bar.querySelectorAll("button[data-filter]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
          var shown = 0;
          sections.forEach(function (s) {
            var on = f === "all" || s.getAttribute("data-section") === f;
            s.hidden = !on;
            if (on) shown += s.querySelectorAll(".nwpt-study-card").length;
          });
          if (status) status.textContent = "Showing " + shown + (shown === 1 ? " source" : " sources") + (f === "all" ? "" : " in " + btn.firstChild.textContent.trim());
        });
      }
"""
JS_DETAILS = """
      // Open a collapsed item when the address names it (for example /page#item-id).
      var openTarget = function () {
        var id = decodeURIComponent(location.hash.slice(1));
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


def load_routes(root, page_names):
    """Page id -> path on the live site. Defaults to the staging routes; src/integration-routes.json (same
    shape as integration/routes.json, any subset) overrides them so every fragment link changes in one place."""
    routes = {"pages": {n[:-5]: staging_route(n) for n in sorted(page_names)}, "downloads": "/downloads/", "assets": "/assets/"}
    src = root / "src" / "integration-routes.json"
    if src.exists():
        try:
            over = json.loads(src.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            raise ExportError(f"{src.name}: {e}")
        for pid, path in over.get("pages", {}).items():
            if pid not in routes["pages"]:
                raise ExportError(f"{src.name}: unknown page id '{pid}'")
            routes["pages"][pid] = path
        for k in ("downloads", "assets"):
            routes[k] = over.get(k, routes[k])
    for pid, path in routes["pages"].items():
        if not path.startswith("/") or path.endswith(".html") or "#" in path:
            raise ExportError(f"route for '{pid}' must be an extensionless path starting with / (got {path!r})")
    for k in ("downloads", "assets"):
        if not (routes[k].startswith("/") and routes[k].endswith("/")):
            raise ExportError(f"route '{k}' must start and end with / (got {routes[k]!r})")
    return routes


def _public_only(o):
    if isinstance(o, dict):
        return {k: _public_only(v) for k, v in o.items() if k not in INTERNAL}
    if isinstance(o, list):
        return [_public_only(x) for x in o if not (isinstance(x, dict) and x.get("public") is False)]
    return o


def public_content(root):
    """The public-safe parts of the shared content model: public items only, internal fields removed.
    people.json is left out (no module shows profiles, and titles await management confirmation)."""
    c = root / "content"
    out = {}
    for name in CONTENT_FILES:
        data = json.loads((c / f"{name}.json").read_text(encoding="utf-8"))
        if name == "facts":
            data["facts"] = {k: v for k, v in data["facts"].items() if v.get("public") and v.get("verification") != "unconfirmed"}
        if name == "sources":
            data = {"_doc": "Public citation labels only (null: not citable publicly). Titles, locations and notes are internal and not exported.",
                    **{k: {"public_label": v.get("public_label")} for k, v in data.items() if k != "_doc"}}
        out[name] = _public_only(data)
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
def _module(spec, root, content, public_dir, routes, page_names, site_css, redirects, site_links):
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
    optional = []
    for aid, a in sorted(content.assets.items()):
        if any(u.split()[0] in [name] + [f"{name}#{i}" for i in ids] for u in a.get("used_on", []) if u.strip()):
            if not (a.get("authorised") and a.get("caption_approved", True) and (root / "src" / a["file"]).exists()):
                optional.append({"asset": aid, "file": a["file"], "status": "not supplied or not authorised: the slot renders nothing",
                                 "fallback": a.get("fallback")})

    # redirects the live site needs so that published addresses reach this module
    redir = []
    if routes["pages"][pid] != staging_route(name):
        redir.append({"from": staging_route(name), "to": routes["pages"][pid], "status": 301,
                      "why": "published material (PDFs, earlier staging links) uses the staging route"})
    for src, dst, code in redirects:
        path, hashmark, frag_id = dst.partition("#")
        if by_route.get(path) == pid and (frag_id in ids if (frag_id or section) else True):
            redir.append({"from": src, "to": routes["pages"][pid] + (hashmark + frag_id if hashmark else ""), "status": int(code),
                          "why": "short alias in src/redirects.txt"})
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

    out_dir.mkdir(parents=True)
    summary = []
    needed = {"downloads": set(), "assets": set()}
    for spec in MODULES:
        manifest, files, links = _module(spec, root, content, public_dir, routes, page_names, site_css, redirects, site_links)
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
classes prefixed `nwpt-`), `module.js` where needed, `manifest.json` (facts, references, links, anchors, CSP needs,
blockers) and `preview.html` (the module on its own under a strict CSP; open it over HTTP, for review only).

Shared files:
- `routes.json`: page id to live path. Downloads are linked under `{routes['downloads']}` and assets under `{routes['assets']}`.
  Change paths in `src/integration-routes.json` and rebuild; never edit the fragments by hand.
- `downloads/`: {', '.join('`' + f + '`' for f in sorted(needed['downloads'])) or 'none'}. Replace the live copies whenever they change (PDFs are regenerated and checked by the build when their facts change).
- `assets/`: {', '.join('`' + f + '`' for f in sorted(needed['assets'])) or 'none needed at present (an image appears here once it is supplied and authorised)'}.
- `content/`: the public-safe parts of the shared content model (public items only; internal notes removed). `people.json` is not included: no module shows profiles, and leadership titles await management confirmation.

## Publication blockers by module
These must be cleared before the module is published on the live site. They are content and approval items, listed
in `manifest.json` → `publication_blockers`; the build report (`build/build-report.json`) lists the whole site's.

{blockers}
## Optional assets not yet supplied (never block publication)
{optional}"""
