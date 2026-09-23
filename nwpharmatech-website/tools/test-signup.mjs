// Tests for the optional email sign-up. Run: node tools/test-signup.mjs [--browser]
//   1. The Pages Function with a mocked provider: every definite and unconfirmed outcome, including a timeout,
//      a 5xx, a network failure and replies that cannot be read.
//   2. Static checks: no wording claims what we cannot know ("Nothing was saved"); the browser script and
//      docs/email-signup.md use the function's exact words.
//   3. --browser: the build gate, then the built form and function under Cloudflare's runtime (wrangler pages
//      dev) with a local mock provider, in Chromium with and without JavaScript. Tests a copy of public/ if it
//      was built with --with-signup; otherwise builds one in a temporary copy of the project with a fixture
//      provider record. The repository is not modified.
// No real provider is called (that is tools/test-signup-live.mjs). Exits non-zero on any failure.
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { onRequestPost, onRequest, MESSAGES } from "../src/optional/signup/functions/api/subscribe.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const AGREED = ["We could not get confirmation", "may or may not have been recorded"];
const FORBIDDEN = /nothing was saved/i;
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  ok ? pass++ : fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  -> ${detail}` : ""}`);
};

// ---------- 1. the function, with a mocked provider ----------
const bd = { SIGNUP_PROVIDER: "buttondown", SIGNUP_API_KEY: "k" };
const hook = { SIGNUP_PROVIDER: "webhook", SIGNUP_API_KEY: "k", SIGNUP_WEBHOOK: "https://hooks.example/subscribe" };
const reply = (status, body, type = "application/json") => async () => new Response(body, { status, headers: { "content-type": type } });
const hangs = (url, init) => new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(init.signal.reason)));
const bodyStalls = async (url, init) => new Response(new ReadableStream({
  start(c) { c.enqueue(new TextEncoder().encode('{"id":')); init.signal.addEventListener("abort", () => c.error(init.signal.reason)); },
}), { status: 201 });
const noCall = async () => { throw new Error("provider must not be called"); };
const realFetch = globalThis.fetch;

// Calls the function. The provider is `mock`; with fastTimer the 8 s timeout fires after 20 ms (the requested
// delay is still recorded and checked).
async function call(env, form, mock, { accept = "application/json", fastTimer = false } = {}) {
  const calls = [], delays = [];
  const realSetTimeout = globalThis.setTimeout;
  globalThis.fetch = async (url, init) => { calls.push({ url: String(url), init }); return mock(url, init); };
  globalThis.setTimeout = (fn, ms, ...a) => { delays.push(ms); return realSetTimeout(fn, fastTimer ? 20 : ms, ...a); };
  try {
    let req;
    if (typeof form === "string") {
      req = new Request("https://staging.example/api/subscribe", { method: "POST", body: form, headers: { accept, "content-type": "text/plain" } });
    } else {
      const fd = new FormData();
      for (const [k, v] of Object.entries(form)) fd.set(k, v);
      req = new Request("https://staging.example/api/subscribe", { method: "POST", body: fd, headers: { accept } });
    }
    const res = await onRequestPost({ request: req, env });
    const text = await res.text();
    return { res, text, body: accept.includes("json") ? JSON.parse(text) : null, calls, delays };
  } finally {
    globalThis.fetch = realFetch;
    globalThis.setTimeout = realSetTimeout;
  }
}

const messagesSeen = new Set(Object.values(MESSAGES));
async function t(name, env, form, mock, expect) {
  const r = await call(env, form, mock, expect);
  const b = r.body, problems = [];
  messagesSeen.add(b.message);
  if (r.res.status !== expect.status) problems.push(`status ${r.res.status}`);
  if (b.outcome !== expect.outcome) problems.push(`outcome ${b.outcome}`);
  if (b.message !== MESSAGES[expect.message || expect.outcome]) problems.push("unexpected message");
  if (b.ok !== expect.status < 300) problems.push("ok flag");
  if (r.calls.length !== expect.calls) problems.push(`${r.calls.length} provider calls`);
  if (expect.outcome === "unconfirmed" && !AGREED.every((p) => b.message.includes(p))) problems.push("not the agreed unconfirmed wording");
  if (FORBIDDEN.test(b.message)) problems.push("says nothing was saved");
  if (expect.more) problems.push(...expect.more(r).filter(Boolean));
  check(name, !problems.length, `${r.res.status} ${b.outcome}${problems.length ? `  [${problems.join("; ")}]` : ""}`);
  return r;
}

const a = { email: "a@example.org" };
console.log("Definite outcomes");
await t("unconfigured provider: 503, provider not called", {}, a, noCall, { status: 503, outcome: "unavailable", calls: 0 });
await t("webhook without its URL: 503, provider not called", { SIGNUP_PROVIDER: "webhook", SIGNUP_API_KEY: "k" }, a, noCall, { status: 503, outcome: "unavailable", calls: 0 });
await t("invalid address rejected before any provider call", bd, { email: "not-an-email" }, noCall, { status: 400, outcome: "invalid", calls: 0 });
await t("form that cannot be read: 400, provider not called", bd, "email=a@example.org", noCall, { status: 400, outcome: "unreadable", calls: 0 });
await t("hidden field filled (bot): ordinary answer, provider not called", bd, { ...a, website: "spam" }, noCall, { status: 200, outcome: "accepted", calls: 0 });
await t("Buttondown accepts (201 with the subscriber): 200, asks the person to confirm", bd, a, reply(201, '{"id":"sub_1","email_address":"a@example.org"}'), {
  status: 200, outcome: "accepted", calls: 1,
  more: (r) => {
    const c = r.calls[0], sent = JSON.parse(c.init.body);
    return [
      c.url !== "https://api.buttondown.com/v1/subscribers" && `url ${c.url}`,
      c.init.method !== "POST" && "method",
      c.init.headers.Authorization !== "Token k" && "authorisation header",
      (sent.email_address !== "a@example.org" || sent.type !== "unactivated") && `body ${c.init.body}`,
      !(c.init.signal instanceof AbortSignal) && "no abort signal passed to the provider request",
      !(r.delays[0] >= 5000 && r.delays[0] <= 10000) && `timeout ${r.delays[0]} ms (expected about 8 s)`,
      !r.body.message.includes("confirm") && "does not ask the person to confirm",
    ];
  },
});
await t("webhook accepts ({accepted: true}): 200", hook, a, reply(200, '{"accepted":true}'), {
  status: 200, outcome: "accepted", calls: 1,
  more: (r) => {
    const c = r.calls[0], sent = JSON.parse(c.init.body);
    return [c.url !== hook.SIGNUP_WEBHOOK && `url ${c.url}`, c.init.headers.Authorization !== "Bearer k" && "authorisation header",
      (sent.email !== "a@example.org" || sent.double_opt_in !== true) && `body ${c.init.body}`];
  },
});
for (const s of [400, 409, 422]) {
  await t(`provider rejects the address (${s}): truthful 400`, bd, a, reply(s, "{}"), { status: 400, outcome: "rejected", calls: 1 });
}
for (const s of [401, 403, 429]) {
  await t(`provider refuses the request (${s}): 503, did not accept`, bd, a, reply(s, "{}"), { status: 503, outcome: "refused", calls: 1 });
}

console.log("Unconfirmed outcomes (the sign-up may or may not have been recorded)");
for (const s of [500, 502, 503]) {
  await t(`provider ${s}: 502, unconfirmed`, bd, a, reply(s, ""), { status: 502, outcome: "unconfirmed", calls: 1 });
}
await t("network failure (fetch throws): 502, unconfirmed", bd, a, async () => { throw new TypeError("fetch failed"); }, { status: 502, outcome: "unconfirmed", calls: 1 });
await t("timeout, no answer: request aborted, 504, unconfirmed", bd, a, hangs, {
  status: 504, outcome: "unconfirmed", calls: 1, fastTimer: true,
  more: (r) => [!(r.delays[0] >= 5000 && r.delays[0] <= 10000) && `timeout ${r.delays[0]} ms (expected about 8 s)`,
    !r.calls[0]?.init.signal?.aborted && "provider request not aborted"],
});
await t("timeout while the answer is still arriving: 504, unconfirmed", bd, a, bodyStalls, { status: 504, outcome: "unconfirmed", calls: 1, fastTimer: true });
await t("malformed answer (2xx HTML page): 502, unconfirmed", bd, a, reply(200, "<html><body>Welcome</body></html>", "text/html"), { status: 502, outcome: "unconfirmed", calls: 1 });
await t("malformed answer (2xx, empty): 502, unconfirmed", bd, a, reply(200, ""), { status: 502, outcome: "unconfirmed", calls: 1 });
await t("malformed answer (Buttondown 2xx JSON without a subscriber): 502, unconfirmed", bd, a, reply(200, "{}"), { status: 502, outcome: "unconfirmed", calls: 1 });
await t("malformed answer (webhook 2xx without accepted: true): 502, unconfirmed", hook, a, reply(200, '{"ok":true}'), { status: 502, outcome: "unconfirmed", calls: 1 });
await t("unexpected status (302): 502, unconfirmed", bd, a, async () => new Response(null, { status: 302, headers: { location: "/" } }), { status: 502, outcome: "unconfirmed", calls: 1 });

console.log("Without JavaScript (HTML answers)");
for (const [name, mock, status, outcome] of [["accepted", reply(201, '{"id":"sub_1"}'), 200, "accepted"], ["network failure", async () => { throw new TypeError("fetch failed"); }, 502, "unconfirmed"]]) {
  const r = await call(bd, a, mock, { accept: "text/html" });
  const hrefs = [...r.text.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  check(`HTML answer, ${name}: ${status} page with the message and a link back to /newsroom#signup`,
    r.res.status === status && r.res.headers.get("content-type").startsWith("text/html") && r.text.includes(`<p>${MESSAGES[outcome]}</p>`)
      && hrefs.includes("/newsroom#signup") && !hrefs.some((h) => /\.html(#|$)/.test(h)) && !FORBIDDEN.test(r.text)
      && /default-src 'none'/.test(r.res.headers.get("content-security-policy") || "") && r.res.headers.get("cache-control") === "no-store",
    `${r.res.status} ${hrefs.join(" ")}`);
}
{
  const res = await onRequest({ request: new Request("https://staging.example/api/subscribe", { headers: { accept: "application/json" } }) });
  const b = await res.json();
  messagesSeen.add(b.message);
  check("other methods: 405", res.status === 405 && b.message === MESSAGES.method);
}

// ---------- 2. static checks ----------
console.log("Wording");
check("no message the function can return says 'Nothing was saved'", ![...messagesSeen].some((m) => FORBIDDEN.test(m)), [...messagesSeen].filter((m) => FORBIDDEN.test(m)).join(" | "));
check("the unconfirmed message uses the agreed wording", AGREED.every((p) => MESSAGES.unconfirmed.includes(p)));
const walkFiles = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walkFiles(path.join(d, e.name)) : [path.join(d, e.name)]);
const texts = [...walkFiles(path.join(root, "src")), ...walkFiles(path.join(root, "content"))].filter((f) => /\.(html|js|mjs|css|json|txt|md|svg)$/.test(f));
const saying = texts.filter((f) => FORBIDDEN.test(fs.readFileSync(f, "utf8"))).map((f) => path.relative(root, f));
check(`no source text says 'Nothing was saved' (${texts.length} files in src/ and content/)`, !saying.length, saying.join(", "));
const siteJs = fs.readFileSync(path.join(root, "src/assets/js/site.js"), "utf8");
check("site.js: no 'Nothing was saved'", !FORBIDDEN.test(siteJs));
check("site.js: a failed or unreadable request shows the function's unconfirmed wording, verbatim", siteJs.includes(`"${MESSAGES.unconfirmed}"`));
check("site.js: the invalid-address message matches the function's", siteJs.includes(`"${MESSAGES.invalid}"`));
check("site.js: never claims success on its own (no 'Thank you')", !/Thank you/i.test(siteJs));
const block = (fs.readFileSync(path.join(root, "src/pages/newsroom.html"), "utf8").match(/<!--optional:signup-->([\s\S]*?)<!--\/optional-->/) || [])[1] || "";
check("newsroom form: posts to /api/subscribe with a role=status live region",
  /<form class="signup" method="post" action="\/api\/subscribe"/.test(block) && /id="su-msg"[^>]*role="status"[^>]*aria-live="polite"/.test(block));
const doc = fs.readFileSync(path.join(root, "docs/email-signup.md"), "utf8");
const undocumented = Object.entries(MESSAGES).filter(([, m]) => !doc.includes(m)).map(([k]) => k);
check("docs/email-signup.md lists every message verbatim", !undocumented.length, undocumented.join(", "));

// ---------- 3. browser, under Cloudflare's runtime ----------
if (process.argv.includes("--browser")) await browserTests();
console.log(`signup tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

async function browserTests() {
  const { spawnSync } = await import("node:child_process");
  const http = await import("node:http");
  const { chromium } = await import("playwright-core");
  const { serve } = await import("./lib/cf-serve.mjs");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "signup-test-"));
  const hashTree = (d) => fs.existsSync(d) ? walkFiles(d).sort().map((f) => `${path.relative(d, f)} ${crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex")}`).join("\n") : "";
  let site = path.join(root, "public");
  let srv, provider, browser;
  try {
    if (fs.existsSync(path.join(site, "functions/api/subscribe.js"))) {
      console.log("Browser: testing a copy of public/ (built with --with-signup)");
      fs.cpSync(site, path.join(tmp, "public"), { recursive: true });
      site = path.join(tmp, "public");
    } else {
      console.log("Browser: build gate and a --with-signup build in a temporary copy of the project");
      const proj = path.join(tmp, "site");
      fs.cpSync(root, proj, { recursive: true, filter: (s) => !/[/\\](node_modules|\.git|\.wrangler|\.build-tmp-[^/\\]*|docs)$/.test(s) });
      if (fs.existsSync(path.join(root, "tools/node_modules"))) fs.symlinkSync(fs.realpathSync(path.join(root, "tools/node_modules")), path.join(proj, "tools/node_modules"));
      const record = path.join(proj, "content/signup-provider-test.json");
      fs.rmSync(record, { force: true });
      const build = () => spawnSync("python3", ["build.py", "--with-signup"], { cwd: proj, encoding: "utf8" });
      const refused = (name, must) => {
        const before = hashTree(path.join(proj, "public"));
        const p = build();
        check(`gate: ${name}: --with-signup refused, public/ unchanged`,
          p.status !== 0 && p.stderr.includes(must) && hashTree(path.join(proj, "public")) === before && !fs.existsSync(path.join(proj, "public/functions")),
          `exit ${p.status}: ${p.stderr.trim().split("\n")[0]}`);
      };
      refused("no provider test recorded", "--with-signup refused");
      fs.copyFileSync(path.join(proj, "content/signup-provider-test.example.json"), record);
      refused("the example record", "example file");
      const cases = ["new_address", "repeat_address", "invalid_address", "confirmation_email", "unsubscribe", "provider_outage"];
      fs.writeFileSync(record, JSON.stringify({ provider: "webhook", date: new Date().toISOString().slice(0, 10), tested_by: "tools/test-signup.mjs fixture (temporary copy; no provider was tested)",
        cases: Object.fromEntries(cases.map((c) => [c, { pass: true, observed: "fixture" }])) }));
      const p = build();
      check("gate: with a passed provider record the --with-signup build succeeds", p.status === 0 && fs.existsSync(path.join(proj, "public/functions/api/subscribe.js")), p.stderr.slice(-400));
      if (p.status !== 0) return;
      site = path.join(proj, "public");
    }

    // Mock provider (webhook contract). The address's first part picks the behaviour.
    const received = [];
    provider = http.createServer((req, res) => {
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", () => {
        let email = "";
        try { email = JSON.parse(data).email; } catch {}
        received.push(email);
        const send = (status, type, body) => { res.writeHead(status, { "content-type": type }); res.end(body); };
        const kind = email.split(/[+@]/)[0];
        if (kind === "accept") return send(200, "application/json", '{"accepted":true}');
        if (kind === "reject") return send(400, "application/json", '{"error":"already subscribed"}');
        if (kind === "down") return send(503, "text/plain", "Service unavailable");
        if (kind === "garbled") return send(200, "text/html", "<html><body>Welcome</body></html>");
        if (kind === "hang") return;   // never answers
        send(500, "text/plain", "unexpected");
      });
    });
    await new Promise((r) => provider.listen(0, "127.0.0.1", r));
    srv = await serve(site, ["SIGNUP_PROVIDER=webhook", "SIGNUP_API_KEY=test-key", `SIGNUP_WEBHOOK=http://127.0.0.1:${provider.address().port}/subscribe`]);
    const b = srv.base;

    {
      const fd = new FormData();
      fd.set("email", "accept+direct@example.org");
      const r = await fetch(b + "/api/subscribe", { method: "POST", body: fd, headers: { accept: "application/json" } });
      const d = await r.json().catch(() => ({}));
      check("runtime: the function runs under wrangler pages dev and reaches the provider", r.status === 200 && d.outcome === "accepted" && received.includes("accept+direct@example.org"), `${r.status} ${JSON.stringify(d)}`);
      const g = await fetch(b + "/api/subscribe", { headers: { accept: "application/json" } });
      check("runtime: GET /api/subscribe answers 405", g.status === 405);
    }

    browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
    const cspErrors = [];
    const watch = (page) => {
      page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) cspErrors.push(m.text()); });
      page.on("pageerror", (e) => cspErrors.push(String(e)));
    };
    const settled = (page, timeout = 20000) => page.waitForFunction(() => { const t = document.getElementById("su-msg").textContent; return t && t !== "Sending…"; }, null, { timeout });
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    // Submits by keyboard (Enter in the field) and returns the message shown.
    const submit = async (email, { route, width, during } = {}) => {
      const page = await ctx.newPage();
      watch(page);
      if (width) await page.setViewportSize({ width, height: 640 });
      if (route) await page.route("**/api/subscribe", route);
      const posts = [];
      page.on("request", (r) => { if (r.url().endsWith("/api/subscribe")) posts.push(r); });
      await page.goto(b + "/newsroom#signup");
      await page.focus("#su-email");
      await page.keyboard.type(email);
      await page.keyboard.press("Enter");
      const early = during ? await during(page) : null;
      await settled(page);
      const out = {
        text: await page.textContent("#su-msg"), posts: posts.length, early,
        focus: await page.evaluate(() => document.activeElement && document.activeElement.id),
        overflow: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      };
      await page.close();
      return out;
    };
    const same = (name, got, want, extra = true, detail = "") => check(name, got.text === want && extra, `${got.text}${detail ? ` | ${detail}` : ""}`);

    {
      const page = await ctx.newPage();
      await page.goto(b + "/newsroom");
      check("browser: the form has a role=status live region", await page.locator('form.signup #su-msg[role="status"][aria-live="polite"]').count() === 1);
      await page.close();
    }
    let r = await submit("accept+js@example.org");
    same("browser: provider accepted -> the confirmation request; focus stays in the field", r, MESSAGES.accepted, r.focus === "su-email", `focus ${r.focus}`);
    r = await submit("reject+js@example.org");
    same("browser: provider rejected the address -> truthful rejection", r, MESSAGES.rejected);
    r = await submit("down+js@example.org", { width: 320 });
    same("browser: provider 503 -> unconfirmed wording, no horizontal scroll at 320 px", r, MESSAGES.unconfirmed, !r.overflow);
    r = await submit("garbled+js@example.org");
    same("browser: provider reply cannot be read -> unconfirmed wording", r, MESSAGES.unconfirmed);
    const t0 = Date.now();
    r = await submit("hang+js@example.org", { during: async (page) => { await page.waitForTimeout(1000); return page.textContent("#su-msg"); } });
    same("browser: provider never answers -> 'Sending…' until the function times out, then unconfirmed", r, MESSAGES.unconfirmed,
      r.early === "Sending…" && Date.now() - t0 >= 7000, `after 1 s: ${r.early}; ${Math.round((Date.now() - t0) / 1000)} s`);
    for (const reason of ["failed", "internetdisconnected", "connectionreset"]) {
      r = await submit(`accept+abort-${reason}@example.org`, { route: (route) => route.abort(reason) });
      same(`browser: request fails in the browser (${reason}) -> unconfirmed wording`, r, MESSAGES.unconfirmed);
    }
    r = await submit("accept+cf502@example.org", { route: (route) => route.fulfill({ status: 502, contentType: "text/html", body: "<html><body>Bad gateway</body></html>" }) });
    same("browser: an HTML error page instead of an answer -> unconfirmed wording", r, MESSAGES.unconfirmed);
    r = await submit("accept+nomsg@example.org", { route: (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }) });
    same("browser: JSON without a message -> unconfirmed wording, never success", r, MESSAGES.unconfirmed);
    {
      const page = await ctx.newPage();
      watch(page);
      const posts = [];
      page.on("request", (q) => { if (q.url().endsWith("/api/subscribe")) posts.push(q); });
      await page.goto(b + "/newsroom#signup");
      await page.focus("#su-email");
      await page.keyboard.type("not-an-address");
      await page.keyboard.press("Enter");
      const st = await page.evaluate(() => ({ text: document.getElementById("su-msg").textContent, invalid: document.getElementById("su-email").getAttribute("aria-invalid"), focus: document.activeElement.id }));
      check("browser: invalid address -> message, aria-invalid, focus on the field, nothing sent",
        st.text === MESSAGES.invalid && st.invalid === "true" && st.focus === "su-email" && posts.length === 0, JSON.stringify(st));
      await page.close();
    }
    {
      // No answer at all (a connection that stays open): the page gives up after 20 s. The clock is simulated.
      const page = await ctx.newPage();
      watch(page);
      await page.clock.install();
      let held = null;
      const posts = [];
      await page.route("**/api/subscribe", (route) => { posts.push(route); held = route; });
      await page.goto(b + "/newsroom#signup");
      await page.focus("#su-email");
      await page.keyboard.type("accept+held@example.org");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => document.getElementById("su-msg").textContent === "Sending…");
      await page.keyboard.press("Enter");       // a second submission while waiting is ignored
      await page.clock.runFor(19000);
      const before = await page.textContent("#su-msg");
      await page.clock.runFor(2000);
      await settled(page, 5000).catch(() => {});
      const text = await page.textContent("#su-msg");
      check("browser: no answer within 20 s -> unconfirmed wording; 'Sending…' until then; one request only",
        text === MESSAGES.unconfirmed && before === "Sending…" && posts.length === 1, `${before} -> ${text}; ${posts.length} request(s)`);
      if (held) await held.abort().catch(() => {});
      await page.close();
    }
    await ctx.close();

    // Without JavaScript, by keyboard (Enter in the field, then Enter on the link back).
    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    for (const [email, status, outcome] of [["accept+nojs@example.org", 200, "accepted"], ["down+nojs@example.org", 502, "unconfirmed"]]) {
      const page = await noJs.newPage();
      watch(page);
      await page.goto(b + "/newsroom#signup");
      await page.focus("#su-email");
      await page.keyboard.type(email);
      const [resp] = await Promise.all([page.waitForResponse((r) => r.url().endsWith("/api/subscribe")), page.keyboard.press("Enter")]);
      await page.waitForURL("**/api/subscribe");
      const text = await page.textContent("main p");
      const back = await page.getAttribute("main a", "href");
      check(`browser without JavaScript: ${outcome} -> ${status} page with the message and a link back`,
        resp.status() === status && text === MESSAGES[outcome] && back === "/newsroom#signup", `${resp.status()} ${text} ${back}`);
      if (outcome === "accepted") {
        await page.focus("main a");
        const [nav] = await Promise.all([page.waitForResponse((r) => new URL(r.url()).pathname === "/newsroom"), page.keyboard.press("Enter")]);
        check("browser without JavaScript: the link back reaches /newsroom without a redirect", nav.status() === 200 && !nav.request().redirectedFrom(), nav.url());
      }
      await page.close();
    }
    await noJs.close();
    check("browser: no Content Security Policy violations or script errors", !cspErrors.length, cspErrors.slice(0, 3).join(" | "));
  } finally {
    if (browser) await browser.close();
    if (srv) srv.stop();
    if (provider) { provider.closeAllConnections(); provider.close(); }
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
