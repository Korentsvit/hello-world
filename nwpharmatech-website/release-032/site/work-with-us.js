/*! NWPharmaTech — "Explore a research collaboration" workspace (/work-with-us).
 * Without JavaScript the page lists every card with its sources and points to the Contact page.
 * With it: optional focus questions highlight matching cards; card actions build an agenda that can be edited,
 * reordered and removed (sidebar on wide screens, a dialog drawer on phones); a dated, printable discussion brief;
 * a share link holding only content version, topic ids and card/action ids; and a non-confidential enquiry that
 * reports success only when /api/enquiry confirms acceptance.
 * Privacy: answers, agenda and questions stay in this tab (sessionStorage). They are never written to the URL.
 * Contact details are never stored. Visitor text is always inserted as text, never as markup.
 */
(function () {
  var dataEl = document.getElementById("wwu-data");
  if (!dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var CARDS = {}; D.cards.forEach(function (c) { CARDS[c.id] = c; });
  var KEY = "nwpt-wwu";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var live = document.getElementById("wwu-live");

  // ---------- helpers
  function el(tag, attrs) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") n.textContent = v;
      else if (k === "className") n.className = v;
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) { var ch = arguments[i]; if (ch === null || ch === undefined || ch === false) continue; n.appendChild(typeof ch === "string" ? document.createTextNode(ch) : ch); }
    return n;
  }
  function say(msg) { live.textContent = ""; setTimeout(function () { live.textContent = msg; }, 30); }
  function store() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable: the page still works */ } }
  function load() { try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function allTopics() { return D.topics.map(function (t) { return t.id; }); }
  function short(s, n) { return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; }
  function isPhone() { return window.matchMedia("(max-width: 899px)").matches; }

  // ---------- state
  var state = { answers: {}, topics: allTopics(), onlyMatches: false, agenda: [] };
  var saved = load();
  if (saved && saved.agenda) state = Object.assign(state, saved);
  var linkNotice = null;
  (function applyLink() {
    var h = location.hash.slice(1);
    if (!/(^|&)v=/.test(h)) return;
    var p = new URLSearchParams(h), known = allTopics();
    var t = (p.get("t") || "").split(",").filter(function (x) { return known.indexOf(x) >= 0; });
    var items = [], dropped = 0;
    (p.get("c") || "").split(",").filter(Boolean).forEach(function (pair) {
      var bits = pair.split("."), c = CARDS[bits[0]];
      if (!c || c.actions.indexOf(bits[1]) < 0) { dropped++; return; }
      if (items.some(function (x) { return x.card === c.id && x.action === bits[1]; })) return;
      items.push({ card: c.id, action: bits[1], text: c.kind === "discussion" ? c.text : "" });
    });
    state.topics = t.length ? t : known;
    state.agenda = items;
    linkNotice = "Opened a shared link: " + items.length + " card" + (items.length === 1 ? "" : "s") + " added to your agenda." +
      (p.get("v") !== D.version ? " The link was made for an earlier version of this page, so some cards may have changed." : "") +
      (dropped ? " " + dropped + " card" + (dropped === 1 ? " was" : "s were") + " no longer available." : "") +
      " Shared links never include answers or questions.";
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
    store();
  })();

  // ---------- reveal the enhanced workspace
  Array.prototype.forEach.call(document.querySelectorAll("[data-nojs]"), function (n) { n.remove(); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-js-only], .wwu-act"), function (n) { n.hidden = false; });
  document.documentElement.classList.add("wwu-enhanced");

  // ---------- focus questions and topics
  var form = document.getElementById("wwu-focus");
  var notes = document.getElementById("wwu-notes");
  var count = document.getElementById("wwu-count");
  var onlyBox = el("label", { className: "wwu-opt wwu-opt--only" }, el("input", { type: "checkbox", id: "wwu-only" }), " ", el("span", { text: "Only show cards that match my answers" }));
  form.querySelector(".wwu-focus__actions").prepend(onlyBox);
  var only = onlyBox.querySelector("input");
  function syncForm() {
    D.questions.forEach(function (q) {
      Array.prototype.forEach.call(form.querySelectorAll('input[name="' + q.id + '"]'), function (r) { r.checked = state.answers[q.id] === r.value; });
    });
    Array.prototype.forEach.call(form.querySelectorAll('input[name="topic"]'), function (b) { b.checked = state.topics.indexOf(b.value) >= 0; });
    only.checked = !!state.onlyMatches;
  }
  form.addEventListener("change", function (e) {
    var t = e.target;
    if (t.name === "topic") state.topics = Array.prototype.filter.call(form.querySelectorAll('input[name="topic"]'), function (b) { return b.checked; }).map(function (b) { return b.value; });
    else if (t.id === "wwu-only") state.onlyMatches = t.checked;
    else if (t.type === "radio") state.answers[t.name] = t.value;
    store(); applyFocus(true);
  });
  document.getElementById("wwu-clear-answers").addEventListener("click", function () {
    state.answers = {}; state.onlyMatches = false; syncForm(); store(); applyFocus(true); say("Answers cleared. All cards are shown.");
  });
  function answered() { return Object.keys(state.answers).filter(function (k) { return state.answers[k] && state.answers[k] !== "unsure"; }); }
  function matches(c) {
    var qs = answered();
    if (!qs.length) return false;
    return qs.every(function (q) { return !c.tags[q] || c.tags[q].indexOf(state.answers[q]) >= 0; }) &&
      qs.some(function (q) { return c.tags[q] && c.tags[q].indexOf(state.answers[q]) >= 0; });
  }
  function applyFocus(announce) {
    var qs = answered(), shown = 0, matched = 0;
    only.disabled = !qs.length;
    if (!qs.length) state.onlyMatches = false;
    D.topics.forEach(function (t) {
      var sec = document.getElementById("topic-" + t.id), visibleCards = 0;
      var on = state.topics.indexOf(t.id) >= 0;
      Array.prototype.forEach.call(sec.querySelectorAll("[data-card-id]"), function (li) {
        var c = CARDS[li.getAttribute("data-card-id")], m = matches(c);
        li.classList.toggle("is-match", m);
        li.querySelector(".wwu-card__match").hidden = !m;
        var show = on && (!state.onlyMatches || m || c.kind === "scope");
        li.hidden = !show;
        if (show) { visibleCards++; shown++; }
        if (m && on) matched++;
      });
      sec.hidden = !on || !visibleCards;
    });
    notes.textContent = "";
    Object.keys(state.answers).forEach(function (q) {
      var n = D.notes[q + ":" + state.answers[q]];
      if (n) notes.appendChild(el("p", { className: "wwu-note-item", text: n }));
    });
    var msg = shown + " card" + (shown === 1 ? "" : "s") + " shown" + (qs.length ? "; " + matched + " match your answers." : ".");
    if (!shown) msg = "No cards are shown. Choose at least one topic" + (state.onlyMatches ? " or show all cards." : ".");
    count.textContent = msg;
    if (announce) say(msg);
  }

  // ---------- agenda
  var targets = Array.prototype.slice.call(document.querySelectorAll("[data-agenda-target]"));
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-agenda-count]"));
  function findItem(card, action) { for (var i = 0; i < state.agenda.length; i++) if (state.agenda[i].card === card && state.agenda[i].action === action) return i; return -1; }
  function addItem(card, action) {
    var i = findItem(card, action), c = CARDS[card];
    if (i < 0) {
      state.agenda.push({ card: card, action: action, text: c.kind === "discussion" ? c.text : "" });
      i = state.agenda.length - 1; store(); renderAll();
      say("Added to your agenda: " + D.actions[action] + ". Item " + (i + 1) + " of " + state.agenda.length + ".");
    } else { focusItem(i); }
  }
  function focusItem(i) {
    if (isPhone()) openDrawer();
    var host = isPhone() ? "drawer" : "side";
    var ta = document.getElementById(host + "-q-" + i);
    if (ta) { ta.focus({ preventScroll: true }); ta.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); }
  }
  function move(i, d, host, which) {
    var j = i + d; if (j < 0 || j >= state.agenda.length) return;
    var x = state.agenda[i]; state.agenda[i] = state.agenda[j]; state.agenda[j] = x;
    store(); renderAll();
    say("Moved to position " + (j + 1) + " of " + state.agenda.length + ".");
    var b = document.querySelector('[data-agenda-target="' + host + '"] [data-index="' + j + '"] [data-tool="' + which + '"]');
    if (b && !b.disabled) b.focus(); else { b = document.querySelector('[data-agenda-target="' + host + '"] [data-index="' + j + '"] [data-tool="remove"]'); if (b) b.focus(); }
  }
  function removeItem(i, host) {
    var it = state.agenda.splice(i, 1)[0]; store(); renderAll();
    say("Removed: " + D.actions[it.action] + ". " + state.agenda.length + " item" + (state.agenda.length === 1 ? "" : "s") + " left.");
    var next = document.querySelector('[data-agenda-target="' + host + '"] [data-index="' + Math.min(i, state.agenda.length - 1) + '"] [data-tool="remove"]');
    (next || document.querySelector('[data-agenda-target="' + host + '"] .wwu-agenda__empty') || document.getElementById(host === "drawer" ? "wwu-drawer-title" : "agenda-title")).focus();
  }
  function renderAgenda(target) {
    var host = target.getAttribute("data-agenda-target");
    target.textContent = "";
    if (!state.agenda.length) {
      target.appendChild(el("p", { className: "wwu-agenda__empty", tabindex: "-1", text: "Nothing added yet. Use “Discuss this finding”, “Clarify this limitation” or “Ask about collaboration” on any card." }));
    } else {
      var ol = el("ol", { className: "wwu-agenda__list" });
      state.agenda.forEach(function (it, i) {
        var c = CARDS[it.card], id = host + "-q-" + i, n = state.agenda.length;
        var ta = el("textarea", { id: id, rows: "3", maxlength: "1000", className: "wwu-item__text",
          placeholder: c.kind === "discussion" ? "" : "Add your question (optional)" });
        ta.value = it.text;
        ta.addEventListener("input", function () {
          it.text = ta.value; store(); scheduleBrief();
          targets.forEach(function (t) { if (t !== target) { var twin = t.querySelector('[data-index="' + i + '"] textarea'); if (twin) twin.value = ta.value; } });
        });
        ol.appendChild(el("li", { className: "wwu-item", "data-index": String(i) },
          el("p", { className: "wwu-item__action" }, el("span", { className: "wwu-item__n", text: (i + 1) + "." }), " " + D.actions[it.action]),
          c.kind === "discussion" ? el("p", { className: "wwu-item__card", text: "Topic: " + topicTitle(c.topic) }) :
            el("p", { className: "wwu-item__card" }, el("span", { className: "wwu-item__who", text: "NWPharmaTech public information: " }), "“" + short((c.question ? c.question + " " : "") + c.text, 150) + "” ",
              el("a", { href: "#card-" + c.id, onclick: closeDrawerQuiet, text: "Show card" })),
          el("label", { for: id, className: "wwu-item__label", text: c.kind === "discussion" ? "Your question (suggested wording; edit freely, non-confidential)" : "Your question (optional, non-confidential)" }),
          ta,
          el("div", { className: "wwu-item__tools" },
            el("button", { type: "button", className: "wwu-tool", "data-tool": "up", disabled: i === 0, "aria-label": "Move item " + (i + 1) + " up", text: "Move up", onclick: function () { move(i, -1, host, "up"); } }),
            el("button", { type: "button", className: "wwu-tool", "data-tool": "down", disabled: i === n - 1, "aria-label": "Move item " + (i + 1) + " down", text: "Move down", onclick: function () { move(i, 1, host, "down"); } }),
            el("button", { type: "button", className: "wwu-tool wwu-tool--remove", "data-tool": "remove", "aria-label": "Remove item " + (i + 1) + ": " + D.actions[it.action], text: "Remove", onclick: function () { removeItem(i, host); } }))));
      });
      target.appendChild(ol);
    }
    target.appendChild(el("p", { className: "wwu-agenda__links" },
      el("a", { href: "#brief", onclick: closeDrawerQuiet, text: "Review brief" }), " · ",
      el("a", { href: "#enquiry", onclick: closeDrawerQuiet, text: enquiryLabel })));
    target.appendChild(el("p", { className: "wwu-agenda__privacy", text: "Your agenda and questions are kept in this browser tab only." }));
  }
  function topicTitle(id) { for (var i = 0; i < D.topics.length; i++) if (D.topics[i].id === id) return D.topics[i].title; return id; }
  function renderButtons() {
    Array.prototype.forEach.call(document.querySelectorAll(".wwu-act"), function (b) {
      var card = b.getAttribute("data-card"), action = b.getAttribute("data-action"), i = findItem(card, action);
      b.classList.toggle("is-added", i >= 0);
      b.textContent = i >= 0 ? "In your agenda: go to item " + (i + 1) : D.actions[action];
    });
  }
  function renderAll() {
    targets.forEach(renderAgenda);
    counters.forEach(function (c) { c.textContent = String(state.agenda.length); });
    renderButtons(); renderBrief(); renderReview();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".wwu-act");
    if (b) addItem(b.getAttribute("data-card"), b.getAttribute("data-action"));
  });

  // ---------- phone drawer (native modal dialog: focus contained, Escape closes, focus returns)
  var drawer = document.getElementById("wwu-drawer"), opener = document.getElementById("wwu-drawer-open");
  function openDrawer() { if (drawer.open) return; if (drawer.showModal) drawer.showModal(); else drawer.setAttribute("open", ""); document.getElementById("wwu-drawer-close").focus(); }
  function closeDrawerQuiet() { if (drawer.open) drawer.close(); }
  opener.addEventListener("click", openDrawer);
  document.getElementById("wwu-drawer-close").addEventListener("click", function () { drawer.close(); opener.focus(); });
  drawer.addEventListener("click", function (e) { if (e.target === drawer) { drawer.close(); opener.focus(); } });
  window.addEventListener("resize", function () { if (!isPhone() && drawer.open) drawer.close(); });

  // ---------- brief
  var briefHost = document.getElementById("wwu-brief"), briefTimer = null;
  function scheduleBrief() { clearTimeout(briefTimer); briefTimer = setTimeout(function () { renderBrief(); renderReview(); }, 250); }
  function today() { return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  function renderBrief() {
    briefHost.textContent = "";
    var art = el("article", { className: "wwu-brief", "aria-labelledby": "wwu-brief-title" },
      el("h3", { id: "wwu-brief-title", text: "Discussion brief — prepared from selected NWPT public information" }),
      el("p", { className: "wwu-brief__meta", text: "Prepared on " + today() + " · Content version " + D.version + " · Public information reviewed " + D.reviewed + " · " + D.canon + "work-with-us" }),
      el("p", { className: "wwu-brief__notice", text: "Text marked “NWPharmaTech public information” is quoted from the NWPharmaTech website. Text marked “Visitor question” was written by the person who prepared this brief. This brief is not a protocol, an offer or an agreement. It does not indicate an approved protocol, available study medicine, sponsorship, funding, or access to unpublished data." }));
    var qs = D.questions.filter(function (q) { return state.answers[q.id]; });
    if (qs.length) {
      var dl = el("dl", { className: "wwu-brief__focus" });
      qs.forEach(function (q) { var o = q.options.filter(function (x) { return x[0] === state.answers[q.id]; })[0]; dl.appendChild(el("div", null, el("dt", { text: q.label }), el("dd", { text: o ? o[1] : "" }))); });
      art.appendChild(el("p", { className: "wwu-brief__tag", text: "Visitor’s focus" })); art.appendChild(dl);
    }
    if (!state.agenda.length) {
      art.appendChild(el("p", { className: "wwu-brief__empty", text: "Your agenda is empty. Add cards from “Relevant public information” to build the brief." }));
      briefHost.appendChild(art); return;
    }
    var refs = [], refIndex = {};
    function refNo(s) { if (!(s.key in refIndex)) { refs.push(s); refIndex[s.key] = refs.length; } return refIndex[s.key]; }
    var ol = el("ol", { className: "wwu-brief__items" });
    state.agenda.forEach(function (it, i) {
      var c = CARDS[it.card], li = el("li", null, el("h4", { text: (i + 1) + ". " + D.actions[it.action] }));
      if (c.kind !== "discussion") {
        var nums = c.sources.map(refNo);
        li.appendChild(el("div", { className: "wwu-brief__company" },
          el("p", { className: "wwu-brief__tag", text: "NWPharmaTech public information · " + D.kinds[c.kind] + (c.status === "unresolved" ? " · Status: unresolved" : "") + " · " + topicTitle(c.topic) }),
          el("blockquote", null, (c.question ? c.question + " " : "") + c.text + (nums.length ? " [" + nums.join(", ") + "]" : "")),
          c.stage ? el("p", { className: "wwu-brief__stage", text: "Related stage: Stage " + c.stage.n + " · " + c.stage.short + " — stage work status: " + D.work[c.stage.work] + (c.status === "unresolved" ? ". The question itself remains unresolved." : ".") }) : null));
      } else {
        li.appendChild(el("p", { className: "wwu-brief__tag", text: "Topic: " + topicTitle(c.topic) }));
      }
      li.appendChild(el("div", { className: "wwu-brief__visitor" },
        el("p", { className: "wwu-brief__tag", text: "Visitor question" }),
        el("p", { text: it.text.trim() || "No question added." })));
      ol.appendChild(li);
    });
    art.appendChild(ol);
    if (refs.length) {
      art.appendChild(el("h4", { text: "References" }));
      var rl = el("ol", { className: "wwu-brief__refs" });
      refs.forEach(function (s) {
        var dates = s.dates.map(function (d) { return d[0] + ": " + d[1]; }).join("; ");
        var li = el("li", null, s.title + ". " + D.types[s.type] + ". " + dates + ". Limitations: " + s.limit + " ", el("br"),
          el("a", { href: s.url, text: s.url }));
        (s.original || []).forEach(function (o) { li.appendChild(el("br")); li.appendChild(document.createTextNode("Original source (" + o[0] + "): ")); li.appendChild(el("a", { href: o[1], rel: "external", text: o[1] })); });
        rl.appendChild(li);
      });
      art.appendChild(rl);
    }
    briefHost.appendChild(art);
  }
  document.getElementById("wwu-print").addEventListener("click", function () { renderBrief(); window.print(); });

  // ---------- share link: version, topics and card/action ids only
  function shareUrl() {
    var parts = ["v=" + encodeURIComponent(D.version)];
    if (state.topics.length !== D.topics.length) parts.push("t=" + state.topics.join(","));
    if (state.agenda.length) parts.push("c=" + state.agenda.map(function (it) { return it.card + "." + it.action; }).join(","));
    return location.origin + location.pathname + "#" + parts.join("&");
  }
  var shareStatus = document.getElementById("wwu-share-status");
  document.getElementById("wwu-share").addEventListener("click", function () {
    var url = shareUrl();
    var done = function () { shareStatus.textContent = "Link copied. It includes the selected topics and cards only, not your answers or questions."; };
    var fail = function () { shareStatus.textContent = ""; shareStatus.appendChild(document.createTextNode("Copy this link: ")); shareStatus.appendChild(el("input", { type: "text", readonly: true, value: url, className: "wwu-share-url", "aria-label": "Link to these topics and cards", onfocus: function (e) { e.target.select(); } })); };
    try { navigator.clipboard.writeText(url).then(done, fail); } catch (e) { fail(); }
  });

  // ---------- enquiry
  var enquiryLabel = "Contact about collaboration"; // becomes "Send enquiry" only once the API reports online enquiries configured
  var enq = document.getElementById("wwu-enquiry"), config = null, token = "", submitting = false, sent = false, ts = null;
  var nonce = (function () { try { var n = sessionStorage.getItem(KEY + "-nonce"); if (!n) { n = rand(); sessionStorage.setItem(KEY + "-nonce", n); } return n; } catch (e) { return rand(); } })();
  function rand() { var a = new Uint8Array(12); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
  function unavailable(reason) {
    enq.textContent = "";
    enq.appendChild(el("div", { className: "wwu-callout", role: "status" },
      el("p", { className: "wwu-callout__title", text: "Online enquiries are not available yet" }),
      el("p", { text: reason + " Nothing has been sent from this page. Your agenda and brief still work: you can print or save the brief, or copy a link to it." }),
      el("p", null, "To contact NWPharmaTech about a research collaboration, use the research collaboration route on the ", el("a", { href: "contact.html#research", text: "Contact page" }), ".")));
  }
  var fields = [
    ["name", "Your name", "text", "name", true, 100],
    ["email", "Email address", "email", "email", true, 254],
    ["organisation", "Institution or organisation", "text", "organization", true, 150],
    ["role", "Role (optional)", "text", "organization-title", false, 100]
  ];
  function renderForm() {
    enq.textContent = "";
    var errorBox = el("div", { className: "wwu-errors", id: "wwu-errors", tabindex: "-1", hidden: true });
    var f = el("form", { className: "wwu-form", id: "wwu-form", novalidate: true });
    f.appendChild(errorBox);
    f.appendChild(el("h3", { text: "Review what will be sent" }));
    f.appendChild(el("div", { id: "wwu-review", className: "wwu-review" }));
    f.appendChild(el("label", { className: "wwu-check" }, el("input", { type: "checkbox", id: "wwu-include-focus", checked: true, onchange: renderReview }), " Include my focus answers"));
    f.appendChild(el("h3", { text: "Your details" }));
    fields.forEach(function (x) {
      f.appendChild(el("div", { className: "wwu-field" },
        el("label", { for: "wwu-" + x[0], text: x[1] }),
        el("input", { id: "wwu-" + x[0], name: x[0], type: x[2], autocomplete: x[3], required: x[4], maxlength: String(x[5]), "aria-describedby": "wwu-" + x[0] + "-err" }),
        el("p", { className: "wwu-field__err", id: "wwu-" + x[0] + "-err" })));
    });
    f.appendChild(el("div", { className: "wwu-field" },
      el("label", { for: "wwu-message", text: "Message (optional, non-confidential)" }),
      el("textarea", { id: "wwu-message", name: "message", rows: "5", maxlength: "3000", "aria-describedby": "wwu-message-help wwu-message-err" }),
      el("p", { className: "wwu-field__help", id: "wwu-message-help", text: "Up to 3,000 characters. No confidential or unpublished information, patient information or health data. No files can be attached." }),
      el("p", { className: "wwu-field__err", id: "wwu-message-err" })));
    f.appendChild(el("div", { className: "wwu-field" },
      el("label", { className: "wwu-check" }, el("input", { type: "checkbox", id: "wwu-confirm", name: "confirm", required: true, "aria-describedby": "wwu-confirm-err" }),
        " My enquiry contains no confidential or unpublished information, and no patient or health information. I have read the ", el("a", { href: "privacy.html", text: "privacy notice" }), "."),
      el("p", { className: "wwu-field__err", id: "wwu-confirm-err" })));
    f.appendChild(el("input", { type: "text", name: "website", tabindex: "-1", autocomplete: "off", className: "wwu-hp", "aria-hidden": "true" }));
    f.appendChild(el("p", { className: "wwu-field__help wwu-processing", id: "wwu-processing" }, "Your enquiry is checked by Cloudflare Turnstile and sent by email through Resend to the NWPharmaTech team, with your email address as the reply-to. Nothing is stored on this website. See the ", el("a", { href: "privacy.html", text: "privacy notice" }), "."));
    f.appendChild(el("div", { id: "wwu-turnstile", className: "wwu-turnstile" }));
    f.appendChild(el("p", { className: "wwu-field__err", id: "wwu-turnstile-err" }));
    if (config && config.testMode) f.appendChild(el("p", { className: "wwu-callout", text: "Test mode: this preview uses test settings. Enquiries are not delivered to NWPharmaTech." }));
    f.appendChild(el("p", { className: "wwu-submit" }, el("button", { type: "submit", className: "wwu-btn", id: "wwu-submit", text: "Submit enquiry" })));
    f.appendChild(el("div", { id: "wwu-submit-status", className: "wwu-submit-status", role: "status" }));
    f.addEventListener("submit", submit);
    enq.appendChild(f);
    renderReview(); loadTurnstile();
  }
  function renderReview() {
    var r = document.getElementById("wwu-review"); if (!r) return;
    r.textContent = "";
    if (!state.agenda.length) r.appendChild(el("p", { text: "Your agenda is empty. You can still send a message, or add cards first." }));
    else {
      var ol = el("ol");
      state.agenda.forEach(function (it) {
        var c = CARDS[it.card];
        ol.appendChild(el("li", null, el("strong", { text: D.actions[it.action] + ": " }), c.kind === "discussion" ? "Topic: " + topicTitle(c.topic) : "“" + short(c.text, 110) + "”",
          el("br"), el("span", { className: "wwu-review__visitor", text: "Your question: " + (it.text.trim() || "none added") })));
      });
      r.appendChild(ol);
    }
    var inc = document.getElementById("wwu-include-focus");
    var qs = D.questions.filter(function (q) { return state.answers[q.id]; });
    if (qs.length && (!inc || inc.checked)) r.appendChild(el("p", { text: "Focus answers: " + qs.map(function (q) { var o = q.options.filter(function (x) { return x[0] === state.answers[q.id]; })[0]; return o ? o[1] : ""; }).join("; ") + "." }));
  }
  function loadTurnstile() {
    if (!config || !config.turnstileSiteKey) return;
    function render() { ts = window.turnstile.render("#wwu-turnstile", { sitekey: config.turnstileSiteKey, callback: function (t) { token = t; }, "expired-callback": function () { token = ""; }, "error-callback": function () { token = ""; } }); }
    if (window.turnstile) return render();
    var s = el("script", { src: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit", async: true });
    s.addEventListener("load", render);
    s.addEventListener("error", function () { var e = document.getElementById("wwu-turnstile-err"); if (e) e.textContent = "The security check could not load. Check your connection and reload the page. Nothing has been sent."; });
    document.head.appendChild(s);
  }
  function val(id) { var n = document.getElementById(id); return n ? n.value.trim() : ""; }
  function setErr(id, msg) { var n = document.getElementById(id + "-err"), inp = document.getElementById(id); if (n) n.textContent = msg || ""; if (inp) { if (msg) inp.setAttribute("aria-invalid", "true"); else inp.removeAttribute("aria-invalid"); } }
  function payload() {
    var inc = document.getElementById("wwu-include-focus");
    return { version: D.version,
      answers: inc && inc.checked ? state.answers : {},
      agenda: state.agenda.map(function (it) { return { card: it.card, action: it.action, text: it.text.trim() }; }),
      name: val("wwu-name"), email: val("wwu-email"), organisation: val("wwu-organisation"), role: val("wwu-role"),
      message: val("wwu-message"), confirm: document.getElementById("wwu-confirm").checked,
      website: document.querySelector('#wwu-form input[name="website"]').value };
  }
  function idemKey(p) {
    var s = JSON.stringify(p) + "|" + nonce;
    if (!(window.crypto && crypto.subtle)) return Promise.resolve(nonce + "-" + s.length);
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)).then(function (h) {
      return Array.prototype.map.call(new Uint8Array(h), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("").slice(0, 40);
    });
  }
  function submit(e) {
    e.preventDefault();
    if (submitting || sent) return;
    var p = payload(), errs = [];
    setErr("wwu-name", ""); setErr("wwu-email", ""); setErr("wwu-organisation", ""); setErr("wwu-confirm", ""); setErr("wwu-message", "");
    document.getElementById("wwu-turnstile-err").textContent = "";
    if (!p.name) { setErr("wwu-name", "Enter your name."); errs.push(["wwu-name", "Enter your name."]); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) { setErr("wwu-email", "Enter a valid email address."); errs.push(["wwu-email", "Enter a valid email address."]); }
    if (!p.organisation) { setErr("wwu-organisation", "Enter your institution or organisation."); errs.push(["wwu-organisation", "Enter your institution or organisation."]); }
    if (!p.agenda.length && !p.message) { setErr("wwu-message", "Add cards to your agenda or write a message."); errs.push(["wwu-message", "Add cards to your agenda or write a message."]); }
    if (!p.confirm) { setErr("wwu-confirm", "Confirm that your enquiry is non-confidential."); errs.push(["wwu-confirm", "Confirm that your enquiry is non-confidential."]); }
    if (config && config.turnstileSiteKey && !token) { document.getElementById("wwu-turnstile-err").textContent = "Complete the security check."; errs.push(["wwu-turnstile", "Complete the security check."]); }
    var box = document.getElementById("wwu-errors");
    if (errs.length) {
      box.textContent = ""; box.hidden = false;
      box.appendChild(el("p", { className: "wwu-errors__title", text: "Please check " + errs.length + " item" + (errs.length === 1 ? "" : "s") + ". Nothing has been sent." }));
      var ul = el("ul"); errs.forEach(function (x) { ul.appendChild(el("li", null, el("a", { href: "#" + x[0], text: x[1], onclick: function (ev) { ev.preventDefault(); var t = document.getElementById(x[0]); if (t) t.focus(); } }))); });
      box.appendChild(ul); box.focus(); return;
    }
    box.hidden = true;
    submitting = true;
    var btn = document.getElementById("wwu-submit"), status = document.getElementById("wwu-submit-status");
    btn.disabled = true; btn.setAttribute("aria-busy", "true"); btn.textContent = "Submitting…";
    status.className = "wwu-submit-status"; status.textContent = "Submitting your enquiry. Please wait.";
    var body = Object.assign({}, p);
    idemKey(p).then(function (key) {
      body.idempotencyKey = key; body.turnstileToken = token;
      var ctl = window.AbortController ? new AbortController() : null, timer = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
      return fetch("/api/enquiry", { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined, credentials: "same-origin" })
        .then(function (r) { clearTimeout(timer); return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j }; }); });
    }).then(function (res) {
      if (res.status === 202 && res.j && res.j.ok === true && res.j.accepted === true && res.j.reference) return success(res.j);
      failure(res.j && res.j.error ? res.j.error : "Your enquiry could not be submitted.", res.status === 503 && res.j && res.j.code === "not_configured");
    }).catch(function () {
      failure("We could not confirm that your enquiry was received. Please try again; submitting the same enquiry again will not create a duplicate.", false);
    });
  }
  function failure(msg, notConfigured) {
    submitting = false;
    if (notConfigured) return unavailable("Online enquiries have not been set up on this site yet.");
    var btn = document.getElementById("wwu-submit"), status = document.getElementById("wwu-submit-status");
    btn.disabled = false; btn.removeAttribute("aria-busy"); btn.textContent = "Submit enquiry";
    status.className = "wwu-submit-status is-error"; status.textContent = msg + " Nothing has been confirmed as sent.";
    if (ts !== null && window.turnstile) { window.turnstile.reset(ts); token = ""; }
  }
  function success(j) {
    submitting = false; sent = true;
    enq.textContent = "";
    var h = el("h3", { tabindex: "-1", text: "Enquiry submitted" });
    enq.appendChild(el("div", { className: "wwu-callout wwu-callout--ok", role: "status" }, h,
      el("p", null, "Reference ", el("strong", { text: j.reference }), "."),
      el("p", { text: j.message || "Our system accepted your enquiry for delivery to the NWPharmaTech team. We cannot confirm when it reaches their inbox." }),
      el("p", { text: "Your agenda and brief are still available on this page." }),
      el("button", { type: "button", className: "wwu-btn wwu-btn--quiet", text: "Prepare another enquiry", onclick: function () { sent = false; try { sessionStorage.removeItem(KEY + "-nonce"); } catch (e) {} nonce = rand(); renderForm(); } })));
    h.focus();
    say("Enquiry submitted. Reference " + j.reference + ".");
  }
  function initEnquiry() {
    enq.appendChild(el("p", { className: "wwu-help", role: "status", text: "Checking whether online enquiries are available…" }));
    fetch("/api/enquiry", { headers: { accept: "application/json" }, credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (c) {
        if (!c || !c.configured) return unavailable("Online enquiries have not been set up on this site yet.");
        config = c;
        enquiryLabel = "Send enquiry";
        document.querySelector("[data-enquiry-heading]").textContent = "Send a non-confidential enquiry";
        document.querySelector("[data-enquiry-step]").textContent = "Enquiry";
        renderAll(); renderForm();
      })
      .catch(function () { unavailable("The enquiry service could not be reached."); });
  }

  // ---------- start
  syncForm(); applyFocus(false); renderAll(); initEnquiry();
  if (linkNotice) { var n = el("p", { className: "wwu-callout", role: "status", text: linkNotice }); document.getElementById("information").insertBefore(n, document.getElementById("information").children[1]); }
})();
