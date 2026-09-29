// Conversion preview checks (financing enquiry and programme updates).
//   node test-conversion.mjs
// Direct function calls with a mock Resend and Turnstile. No production host is switched on.
// Static pages are checked for the two labels, the security line, lane separation, and the email fallback.
import { onRequestGet as finGet, onRequestPost as finPost, onRequest as finOther } from "../release-032/site/functions/api/financing.js";
import { onRequestGet as subGet, onRequestPost as subPost } from "../release-032/site/functions/api/subscribe.js";
import { onRequestGet as enqGet, onRequestPost as enqPost } from "../release-032/site/functions/api/enquiry.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../release-032/site");
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  ok ? pass++ : fail++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}${ok ? "" : "  --  " + String(detail).slice(0, 500)}`);
};

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

function installMock() {
  const state = {
    contacts: new Map(),
    topics: new Map(),
    emails: [],
    verifySuccess: true,
    failEmails: false,
  };
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(String(url));
    const method = (init.method || "GET").toUpperCase();
    let body = null;
    if (init.body && typeof init.body !== "string") body = init.body;
    else if (typeof init.body === "string" && (init.body.startsWith("{") || init.body.startsWith("["))) body = JSON.parse(init.body);
    else if (typeof init.body === "string") body = init.body;
    if (u.hostname === "turnstile.test") return Response.json({ success: state.verifySuccess });
    if (u.hostname === "resend.test" && u.pathname === "/emails") {
      if (state.failEmails) return Response.json({ message: "no" }, { status: 500 });
      const id = "email_" + (state.emails.length + 1);
      state.emails.push(body);
      return Response.json({ id });
    }
    if (u.hostname !== "resend.test") return original(url, init);
    if (u.pathname === "/contacts" && method === "POST") {
      const email = body.email;
      state.contacts.set(email, { email, unsubscribed: !!body.unsubscribed, properties: { ...(body.properties || {}) }, first_name: body.first_name || "" });
      if (!state.topics.has(email)) state.topics.set(email, {});
      return Response.json({ id: "contact_" + email });
    }
    const topicPath = u.pathname.match(/^\/contacts\/([^/]+)\/topics$/);
    const contactPath = u.pathname.match(/^\/contacts\/([^/]+)$/);
    if (topicPath) {
      const email = decodeURIComponent(topicPath[1]);
      if (!state.contacts.has(email)) return Response.json({ message: "missing" }, { status: 404 });
      const map = state.topics.get(email) || {};
      if (method === "GET") {
        return Response.json({ data: Object.entries(map).map(([id, subscription]) => ({ id, subscription })) });
      }
      const rows = Array.isArray(body) ? body : (body && body.topics) || [];
      for (const row of rows) map[row.id] = row.subscription;
      state.topics.set(email, map);
      return Response.json({ object: "contact_topics" });
    }
    if (contactPath) {
      const email = decodeURIComponent(contactPath[1]);
      if (method === "GET") {
        if (!state.contacts.has(email)) return Response.json({ message: "missing" }, { status: 404 });
        return Response.json(state.contacts.get(email));
      }
      if (method === "PATCH") {
        if (!state.contacts.has(email)) return Response.json({ message: "missing" }, { status: 404 });
        const current = state.contacts.get(email);
        current.properties = { ...current.properties, ...(body.properties || {}) };
        if (body.first_name) current.first_name = body.first_name;
        if (typeof body.unsubscribed === "boolean") current.unsubscribed = body.unsubscribed;
        return Response.json({ id: "contact_" + email });
      }
    }
    return Response.json({ message: "unmocked " + method + " " + u.pathname }, { status: 500 });
  };
  return { state, restore() { globalThis.fetch = original; } };
}

const req = (url, method, body) => new Request(url, {
  method,
  headers: { "content-type": "application/json", accept: "application/json", host: new URL(url).host },
  body: body === undefined ? undefined : JSON.stringify(body),
});

const finBody = (over = {}) => ({
  name: "Ada Preview",
  email: "ada.preview@example.org",
  organisation: "Preview Lab",
  message: "We would like an exploratory conversation about programme financing.",
  confirmExploratory: true,
  turnstileToken: "tok-ok",
  idempotencyKey: "financing-idem-key-0001",
  ...over,
});

const updBody = (over = {}) => ({
  email: "news.preview@example.org",
  name: "Nia Preview",
  consent: true,
  turnstileToken: "tok-ok",
  idempotencyKey: "updates-idem-key-00001",
  ...over,
});

// --- fail closed ---
{
  const g = await (await finGet({ request: req("http://127.0.0.1/api/financing", "GET"), env: {} })).json();
  check("financing GET without settings is held", g.configured === false && g.turnstileSiteKey === null && g.activation === "held" && g.lane === "financing");
  const p = await finPost({ request: req("http://127.0.0.1/api/financing", "POST", finBody()), env: {} });
  const pj = await p.json();
  check("financing POST without settings is 503", p.status === 503 && pj.code === "not_configured" && /Nothing has been sent/.test(pj.error));
  const keysOnly = { ...previewEnv, NWPT_CONVERSION_MODE: "" };
  const held = await finPost({ request: req("http://127.0.0.1/api/financing", "POST", finBody()), env: keysOnly });
  check("financing POST with secrets but without preview mode is 503", held.status === 503);
  const prod = await finPost({ request: req("https://www.nwpharmatech.org/api/financing", "POST", finBody()), env: previewEnv });
  check("financing POST on www is 503 even in preview mode", prod.status === 503 && (await prod.json()).code === "not_configured");
  const apex = await (await finGet({ request: req("https://nwpharmatech.org/api/financing", "GET"), env: previewEnv })).json();
  check("financing GET on the apex host is held", apex.configured === false && apex.turnstileSiteKey === null);
  const subHeld = await subPost({ request: req("http://127.0.0.1/api/subscribe", "POST", updBody()), env: keysOnly });
  check("updates POST with secrets but without preview mode is 503", subHeld.status === 503 && (await subHeld.json()).code === "not_configured");
  const subProd = await subGet({ request: req("https://www.nwpharmatech.org/api/subscribe", "GET"), env: previewEnv });
  const subProdJson = await subProd.json();
  check("updates GET on www is held and hides the site key", subProdJson.configured === false && subProdJson.turnstileSiteKey === null);
  const enqProd = await enqGet({ request: req("https://www.nwpharmatech.org/api/enquiry", "GET"), env: previewEnv });
  const enqProdJson = await enqProd.json();
  check("research enquiry GET on www stays unconfigured", enqProdJson.configured === false && enqProdJson.version === "wwu-1" && enqProdJson.turnstileSiteKey === null);
  const enqProdPost = await enqPost({ request: req("https://www.nwpharmatech.org/api/enquiry", "POST", {}), env: previewEnv });
  check("research enquiry POST on www is 503", enqProdPost.status === 503 && (await enqProdPost.json()).code === "not_configured");
  const enqLocal = await (await enqGet({ request: req("http://127.0.0.1/api/enquiry", "GET"), env: previewEnv })).json();
  check("research enquiry on a non-production host still reports configured when its own settings exist", enqLocal.configured === true && enqLocal.version === "wwu-1");
}

const mock = installMock();
try {
  const open = await (await finGet({ request: req("http://127.0.0.1/api/financing", "GET"), env: previewEnv })).json();
  check("preview financing GET is configured and returns only the site key", open.configured === true && open.turnstileSiteKey === "site-key" && open.activation === "preview" && !JSON.stringify(open).includes("re_test"));
  const other = await finOther({ request: req("http://127.0.0.1/api/financing", "PUT", {}) });
  check("financing PUT is 405", other.status === 405);

  const missingTs = await finPost({ request: req("http://127.0.0.1/api/financing", "POST", finBody({ turnstileToken: "" })), env: previewEnv });
  check("financing without Turnstile is 400 and sends no mail", missingTs.status === 400 && mock.state.emails.length === 0);

  mock.state.verifySuccess = false;
  const badTs = await finPost({ request: req("http://127.0.0.1/api/financing", "POST", finBody()), env: previewEnv });
  check("financing with a failed Turnstile check sends no mail", badTs.status === 400 && mock.state.emails.length === 0);
  mock.state.verifySuccess = true;

  const honey = await finPost({ request: req("http://127.0.0.1/api/financing", "POST", finBody({ website: "http://spam.example" })), env: previewEnv });
  check("financing honeypot is refused", honey.status === 400 && mock.state.emails.length === 0);
  const wallet = await finPost({ request: req("http://127.0.0.1/api/financing", "POST", finBody({ wallet: "0xabc" })), env: previewEnv });
  check("financing rejects a wallet field", wallet.status === 400 && /wallet/.test((await wallet.json()).error));
  const noConfirm = await finPost({ request: req("http://127.0.0.1/api/financing", "POST", finBody({ confirmExploratory: false })), env: previewEnv });
  check("financing requires the exploratory confirmation", noConfirm.status === 400);

  const sent = await finPost({ request: req("http://127.0.0.1/api/financing", "POST", finBody()), env: previewEnv });
  const sentJson = await sent.json();
  const mail = mock.state.emails[0];
  check("financing 202 is acceptance, not inbox proof, and not an investment", sent.status === 202 && sentJson.accepted === true && sentJson.inboxConfirmed === false && sentJson.lane === "financing" && /acceptance for delivery/.test(sentJson.message) && /not that it has reached an inbox/.test(sentJson.message) && /does not mean you have invested/.test(sentJson.message));
  check("financing mail uses the financing subject, tag, and recipient", mail && mail.subject === "Programme financing enquiry — Preview Lab" && mail.to[0] === "filipp.preview@example.org" && mail.reply_to === "ada.preview@example.org" && mail.tags.some((t) => t.name === "lane" && t.value === "financing") && /Lane: financing/.test(mail.text) && !/opt_in/.test(mail.text));
  check("financing does not create a programme-updates contact", mock.state.contacts.size === 0);

  const noConsent = await subPost({ request: req("http://127.0.0.1/api/subscribe", "POST", updBody({ consent: false })), env: previewEnv });
  check("updates refuses a missing news consent and does not require a financing field", noConsent.status === 400 && mock.state.contacts.size === 0);
  const before = mock.state.emails.length;
  const upd = await subPost({ request: req("http://127.0.0.1/api/subscribe", "POST", updBody()), env: previewEnv });
  const updJson = await upd.json();
  check("updates 202 does not claim registration or inbox delivery", upd.status === 202 && updJson.registered === false && updJson.inboxConfirmed === false && /not registered for programme updates until you confirm/.test(updJson.message) && /not proof the message reached an inbox/.test(updJson.message));
  const team = mock.state.emails.find((m) => m.subject.startsWith("Programme updates request — "));
  const visitor = mock.state.emails.find((m) => m.subject.startsWith("Confirm programme updates — "));
  check("updates notifies the team and the visitor separately", mock.state.emails.length === before + 2 && team.to[0] === "filipp.preview@example.org" && team.subject === "Programme updates request — news.preview@example.org" && visitor.to[0] === "news.preview@example.org");
  check("confirmation email contains a visible unsubscribe link", /Unsubscribe/.test(visitor.text) && /action=unsubscribe&token=/.test(visitor.text) && visitor.headers["List-Unsubscribe"].includes("action=unsubscribe&token="));
  check("request does not opt the topic in", (mock.state.topics.get("news.preview@example.org") || {})["topic-programme-updates"] !== "opt_in" && mock.state.contacts.get("news.preview@example.org").properties.nwpt_updates === "pending");

  const confirmUrl = visitor.text.match(/https?:\/\/\S+action=confirm&token=\S+/)[0];
  const unsubUrl = visitor.text.match(/https?:\/\/\S+action=unsubscribe&token=\S+/)[0];
  const confirmed = await subGet({ request: new Request(confirmUrl), env: previewEnv });
  const confirmedHtml = await confirmed.text();
  check("confirm page registers and does not claim inbox delivery or an investment", confirmed.status === 200 && /is now registered for occasional programme news/.test(confirmedHtml) && /not proof that any particular message reached an inbox/.test(confirmedHtml) && /You cannot invest, pay, or connect a wallet/.test(confirmedHtml) && mock.state.topics.get("news.preview@example.org")["topic-programme-updates"] === "opt_in");

  const stopped = await subGet({ request: new Request(unsubUrl), env: previewEnv });
  const stoppedHtml = await stopped.text();
  check("unsubscribe page opts the address out", stopped.status === 200 && /will not be sent programme updates/.test(stoppedHtml) && mock.state.topics.get("news.preview@example.org")["topic-programme-updates"] === "opt_out" && mock.state.contacts.get("news.preview@example.org").properties.nwpt_updates === "unsubscribed");

  const again = await subGet({ request: new Request(confirmUrl), env: previewEnv });
  const againHtml = await again.text();
  check("a confirm link after unsubscribe does not opt back in", /previously opted out/.test(againHtml) && !/is now registered/.test(againHtml) && mock.state.topics.get("news.preview@example.org")["topic-programme-updates"] === "opt_out");
  const rereg = await subPost({ request: new Request(confirmUrl, { method: "POST" }), env: previewEnv });
  check("an explicit register-again post opts back in", rereg.status === 200 && mock.state.topics.get("news.preview@example.org")["topic-programme-updates"] === "opt_in");

  const oneClick = await subPost({ request: new Request(unsubUrl, { method: "POST", body: "List-Unsubscribe=One-Click" }), env: previewEnv });
  check("one-click unsubscribe is honoured", oneClick.status === 200 && (await oneClick.text()).startsWith("Unsubscribed") && mock.state.topics.get("news.preview@example.org")["topic-programme-updates"] === "opt_out");

  const expired = await subGet({ request: new Request("http://127.0.0.1/api/subscribe?action=unsubscribe&token=aaaa.bbbb"), env: previewEnv });
  check("a bad unsubscribe token changes nothing", expired.status === 400 && mock.state.topics.get("news.preview@example.org")["topic-programme-updates"] === "opt_out");

  mock.state.failEmails = true;
  const failed = await finPost({ request: req("http://127.0.0.1/api/financing", "POST", finBody({ idempotencyKey: "financing-idem-key-0002", email: "other.preview@example.org" })), env: previewEnv });
  const failedJson = await failed.json();
  check("provider failure is not reported as acceptance", failed.status === 502 && failedJson.sent === false && !failedJson.accepted);
} finally {
  mock.restore();
}

const subscribeSrc = fs.readFileSync(path.join(root, "functions/api/subscribe.js"), "utf8");
check("live subscribe function does not call Buttondown", !/buttondown\.com/i.test(subscribeSrc));
check("function source guard still exists", fs.readFileSync(path.join(root, "functions/functions/[[path]].js"), "utf8").includes("Not found"));

function text(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}
const home = text("index.html");
const funding = text("funding-use.html");
const science = text("science.html");
const evidence = text("evidence.html");
const contact = text("contact.html");
const privacy = text("privacy.html").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
check("homepage has both CTAs beside the security line, outside the hero", home.includes(">Express interest in programme financing<") && home.includes(">Register for programme updates<") && home.includes("You cannot invest, pay, or connect a wallet on our website.") && home.indexOf("conversion-lanes") > home.indexOf("home-explore"));
check("funding-use leads with the financing button and a secondary updates link", /btn btn-primary" href="contact\.html#financing">Express interest in programme financing/.test(funding) && funding.includes(">Register for programme updates<") && funding.includes("You cannot invest, pay, or connect a wallet on our website."));
check("science keeps updates and a science continuation, with financing as a text link", science.includes(">Continue in Science<") && science.includes(">Register for programme updates<") && science.includes(">Financing questions<") && !/btn btn-primary" href="contact\.html#financing"/.test(science));
check("evidence keeps updates and a science continuation, with financing as a text link", evidence.includes(">Continue in Science<") && evidence.includes(">Register for programme updates<") && evidence.includes(">Financing questions<"));
check("contact keeps the email routes and the same action labels on the forms", contact.includes('href="mailto:team@nwpharmatech.com?subject=Programme%20updates"') && contact.includes('href="mailto:team@nwpharmatech.com?subject=Financing%20enquiry"') && contact.includes(">Register for programme updates<") && contact.includes(">Express interest in programme financing<") && contact.includes('href="work-with-us.html">Explore a research collaboration</a>'));
check("updates form is not a financing form", /id="updates-register-form"[\s\S]*action="\/api\/subscribe"/.test(contact) && !/id="updates-register-form"[\s\S]*name="organisation"/.test(contact.split('id="financing-form"')[0]));
check("financing form does not require programme updates", /id="financing-form"[\s\S]*action="\/api\/financing"/.test(contact) && !/id="financing-form"[\s\S]*name="consent"/.test(contact));
check("neither form collects health or wallet data", !/name="(wallet|diagnosis|symptom|health)"/.test(contact));
check("forms start hidden and say nothing was sent", contact.includes('id="financing-form" class="updates-form lane-form" method="post" action="/api/financing" hidden') && /Online form is not available on this site yet\. Nothing has been sent from this page/.test(contact));
check("privacy names controller, Resend, Turnstile, purpose, retention, and the production hold", /Controller/.test(privacy) && /Resend/.test(privacy) && /Cloudflare Turnstile/.test(privacy) && /not proof that the message reached an inbox/.test(privacy) && /opts that address out/.test(privacy) && /does not promise a fixed deletion time/.test(privacy) && /Copying those settings onto www\.nwpharmatech\.org does not switch the forms on/.test(privacy) && /Last updated: 26 September 2026\./.test(privacy));
check("privacy does not claim a counsel sign-off or a second email provider", /not a legal sign-off/.test(privacy) && !/Buttondown/.test(privacy));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
