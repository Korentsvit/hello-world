// Browser check for the conversion preview. Serves release-032/site and the Pages functions.
//   node test-conversion-browser.mjs
import { chromium } from "playwright-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { onRequestGet as finGet, onRequestPost as finPost, onRequest as finOther } from "../release-032/site/functions/api/financing.js";
import { onRequestGet as subGet, onRequestPost as subPost, onRequest as subOther } from "../release-032/site/functions/api/subscribe.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../release-032/site");
const shots = process.env.NWPT_SHOTS || "/tmp/nwpt-conversion-shots";
fs.mkdirSync(shots, { recursive: true });
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".woff2": "font/woff2" };
const CSP = "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self'";
const TS_STUB = `window.turnstile={render:function(sel,o){var p=document.createElement('p');p.textContent='Security check ready';document.querySelector(sel).appendChild(p);setTimeout(function(){o.callback('tok-ok')},20);return 'w1'},reset:function(){}};`;

let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "ok  " : "FAIL"}  ${name}${ok ? "" : "  --  " + String(detail).slice(0, 400)}`); };

// Resend returns each contact property as { value, type }, not as a bare string.
const asResend = (c) => ({ ...c, properties: Object.fromEntries(Object.entries(c.properties || {}).map(([k, v]) => [k, { value: v, type: "string" }])) });

function installMock() {
  const state = { contacts: new Map(), topics: new Map(), emails: [], verifySuccess: true };
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(String(url));
    const method = (init.method || "GET").toUpperCase();
    let body = null;
    if (typeof init.body === "string" && (init.body.startsWith("{") || init.body.startsWith("["))) body = JSON.parse(init.body);
    if (u.hostname === "turnstile.test") return Response.json({ success: state.verifySuccess });
    if (u.hostname === "resend.test" && u.pathname === "/emails") {
      state.emails.push(body);
      return Response.json({ id: "email_" + state.emails.length });
    }
    if (u.hostname !== "resend.test") return original(url, init);
    if (u.pathname === "/contacts" && method === "POST") {
      state.contacts.set(body.email, { email: body.email, unsubscribed: false, properties: { ...(body.properties || {}) } });
      if (!state.topics.has(body.email)) state.topics.set(body.email, {});
      return Response.json({ id: "c" });
    }
    const topicPath = u.pathname.match(/^\/contacts\/([^/]+)\/topics$/);
    const contactPath = u.pathname.match(/^\/contacts\/([^/]+)$/);
    if (topicPath) {
      const email = decodeURIComponent(topicPath[1]);
      if (!state.contacts.has(email)) return Response.json({ message: "missing" }, { status: 404 });
      const map = state.topics.get(email) || {};
      if (method === "GET") return Response.json({ data: Object.entries(map).map(([id, subscription]) => ({ id, subscription })) });
      // Resend takes a bare array here and rejects { topics: [...] } with 422.
      if (!Array.isArray(body)) return Response.json({ name: "validation_error", message: "Expected an array" }, { status: 422 });
      for (const row of body) map[row.id] = row.subscription;
      state.topics.set(email, map);
      return Response.json({ ok: true });
    }
    if (contactPath) {
      const email = decodeURIComponent(contactPath[1]);
      if (!state.contacts.has(email)) return Response.json({ message: "missing" }, { status: 404 });
      if (method === "PATCH") {
        const current = state.contacts.get(email);
        current.properties = { ...current.properties, ...(body.properties || {}) };
        return Response.json({ id: "c" });
      }
      return Response.json(asResend(state.contacts.get(email)));
    }
    return Response.json({ message: "unmocked" }, { status: 500 });
  };
  return { state, restore() { globalThis.fetch = original; } };
}

const routes = {
  "/api/financing": { GET: finGet, POST: finPost, OTHER: finOther },
  "/api/subscribe": { GET: subGet, POST: subPost, OTHER: subOther },
};

function start(env) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    if (url.pathname.startsWith("/functions") || url.pathname.includes("wwu-cards")) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const route = routes[url.pathname];
    if (route) {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (v) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
      const request = new Request(`http://${req.headers.host}${req.url}`, {
        method: req.method,
        headers,
        body: req.method === "GET" || req.method === "HEAD" ? undefined : Buffer.concat(chunks),
      });
      const fn = route[req.method] || route.OTHER;
      const response = await fn({ request, env });
      const out = Buffer.from(await response.arrayBuffer());
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(out);
      return;
    }
    let filePath = path.join(root, decodeURIComponent(url.pathname));
    if (url.pathname === "/") filePath = path.join(root, "index.html");
    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("Not found");
      return;
    }
    const headers = { "content-type": MIME[path.extname(filePath)] || "application/octet-stream" };
    if (url.pathname === "/contact.html") headers["content-security-policy"] = CSP;
    res.writeHead(200, headers);
    res.end(fs.readFileSync(filePath));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({
    server,
    base: `http://127.0.0.1:${server.address().port}`,
  })));
}

const browser = await chromium.launch({ executablePath: "/usr/local/bin/google-chrome", headless: true });

// Unconfigured: the production hold, email-first.
{
  const srv = await start({});
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await phone.newPage();
  const d = await desktop.newPage();
  await d.goto(srv.base + "/index.html", { waitUntil: "networkidle" });
  await d.locator(".conversion-lanes").scrollIntoViewIfNeeded();
  await d.locator(".conversion-lanes").screenshot({ path: path.join(shots, "homepage-lanes-desktop.png") });
  check("desktop homepage shows both labels and the security line", (await d.locator(".conversion-lanes").innerText()).includes("Express interest in programme financing") && (await d.locator(".conversion-lanes").innerText()).includes("Register for programme updates") && (await d.locator(".conversion-lanes").innerText()).includes("You cannot invest, pay, or connect a wallet on our website."));
  await p.goto(srv.base + "/funding-use.html", { waitUntil: "networkidle" });
  await p.locator("#next-title").scrollIntoViewIfNeeded();
  await p.locator("section[aria-labelledby='next-title']").screenshot({ path: path.join(shots, "funding-next-phone.png") });
  const next = await p.locator("section[aria-labelledby='next-title']").innerText();
  check("phone funding-use leads with financing and a separate updates link", next.indexOf("Express interest in programme financing") < next.indexOf("Register for programme updates") && next.includes("You cannot invest, pay, or connect a wallet on our website."));
  await p.goto(srv.base + "/contact.html", { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  await p.locator("#financing").scrollIntoViewIfNeeded();
  await p.locator("#financing").screenshot({ path: path.join(shots, "contact-financing-unconfigured-phone.png") });
  check("phone contact keeps the financing email route and says nothing was sent", (await p.locator("#financing").innerText()).includes("Email · Financing enquiry") && (await p.locator("#financing-availability").innerText()).includes("Nothing has been sent"));
  check("unconfigured contact does not show either form", await p.locator("#financing-form").isHidden() && await p.locator("#updates-register-form").isHidden());
  await p.goto(srv.base + "/science.html", { waitUntil: "networkidle" });
  await p.locator("#lane-continue").scrollIntoViewIfNeeded();
  await p.locator("section[aria-labelledby='lane-continue']").screenshot({ path: path.join(shots, "science-continue-phone.png") });
  const sci = await p.locator("section[aria-labelledby='lane-continue']").innerText();
  check("phone science continues in science, offers updates, and keeps financing as text", sci.includes("Continue in Science") && sci.includes("Register for programme updates") && sci.includes("Financing questions") && !(await p.locator("section[aria-labelledby='lane-continue'] a.btn-primary").count()));
  const leaked = await fetch(srv.base + "/functions/api/financing.js");
  check("function source is not served", leaked.status === 404 && (await leaked.text()) === "Not found");
  const api = await (await fetch(srv.base + "/api/financing")).json();
  check("served financing API is held", api.configured === false && api.activation === "held");
  await phone.close();
  await desktop.close();
  srv.server.close();
}

// Preview settings: forms, acceptance copy, confirm, unsubscribe.
const mock = installMock();
const previewEnv = {
  NWPT_CONVERSION_MODE: "preview",
  ENQUIRY_TEST_MODE: "1",
  ENQUIRY_TO: "filipp.preview@example.org",
  ENQUIRY_FROM: "NWPharmaTech website <website@example.org>",
  RESEND_API_KEY: "re_test",
  TURNSTILE_SITE_KEY: "site-key",
  TURNSTILE_SECRET_KEY: "turnstile-secret",
  UPDATES_SIGNING_SECRET: "preview-signing-secret-32",
  UPDATES_TOPIC_ID: "topic-programme-updates",
  ENQUIRY_PROVIDER_URL: "https://resend.test/emails",
  TURNSTILE_VERIFY_URL: "https://turnstile.test/siteverify",
  UPDATES_CONTACTS_URL: "https://resend.test",
};
{
  const srv = await start(previewEnv);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route("https://challenges.cloudflare.com/**", (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: TS_STUB }));
  await ctx.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await ctx.route("https://fonts.gstatic.com/**", (route) => route.fulfill({ status: 200, body: "" }));
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(srv.base + "/contact.html", { waitUntil: "networkidle" });
  await page.locator("#financing-form").waitFor({ state: "visible" });
  await page.locator("#updates-register-form").waitFor({ state: "visible" });
  check("preview shows both forms and keeps both email links", await page.locator("a[href='mailto:team@nwpharmatech.com?subject=Financing%20enquiry']").count() === 1 && await page.locator("a[href='mailto:team@nwpharmatech.com?subject=Programme%20updates']").count() === 1);
  check("updates form has no organisation field", await page.locator("#updates-register-form input[name=organisation]").count() === 0);
  check("financing form has no news-consent field", await page.locator("#financing-form input[name=consent]").count() === 0);
  await page.locator("#fin-name").fill("Ada Preview");
  await page.locator("#fin-email").fill("ada.preview@example.org");
  await page.locator("#fin-org").fill("Preview Lab");
  await page.locator("#fin-message").fill("Exploratory question about the programme financing conversation.");
  await page.locator("#fin-confirm").check();
  await page.locator("#financing-form button[type=submit]").click();
  await page.locator("#financing-result").waitFor({ state: "visible" });
  const finText = await page.locator("#financing-result").innerText();
  check("financing confirmation is acceptance, not an investment or an inbox proof", /acceptance for delivery/.test(finText) && /not that it has reached an inbox/.test(finText) && /does not mean you have invested/.test(finText));
  await page.locator("#financing-result").screenshot({ path: path.join(shots, "financing-acceptance.png") });
  await page.locator("#upd-email").fill("news.preview@example.org");
  await page.locator("#upd-name").fill("Nia Preview");
  await page.locator("#upd-consent").check();
  await page.locator("#updates-register-form button[type=submit]").click();
  await page.locator("#updates-result").waitFor({ state: "visible" });
  const updText = await page.locator("#updates-result").innerText();
  check("updates confirmation asks the person to confirm and does not claim registration", /not registered for programme updates until you confirm/.test(updText) && /not proof the message reached an inbox/.test(updText));
  await page.locator("#updates-result").screenshot({ path: path.join(shots, "updates-acceptance.png") });
  const visitor = mock.state.emails.find((m) => String(m.subject).startsWith("Confirm programme updates"));
  const unsubUrl = visitor.text.match(/https?:\/\/\S+action=unsubscribe&token=\S+/)[0];
  const confirmUrl = visitor.text.match(/https?:\/\/\S+action=confirm&token=\S+/)[0];
  await page.goto(confirmUrl);
  check("confirm page in the browser registers without investment language", /is now registered for occasional programme news/.test(await page.locator("h1").innerText()) || /Programme updates confirmed/.test(await page.locator("h1").innerText()));
  check("confirm page offers unsubscribe", (await page.getByRole("link", { name: "Unsubscribe from programme updates" }).count()) === 1);
  await page.screenshot({ path: path.join(shots, "updates-confirmed.png") });
  await page.goto(unsubUrl);
  check("unsubscribe page says programme updates will not be sent", /will not be sent programme updates/.test(await page.locator("main").innerText()));
  await page.screenshot({ path: path.join(shots, "updates-unsubscribed.png") });
  check("browser journey raised no page errors", errors.length === 0, errors.join(" | "));
  await ctx.close();
  srv.server.close();
}
mock.restore();
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
console.log("shots", shots);
if (fail) process.exit(1);
