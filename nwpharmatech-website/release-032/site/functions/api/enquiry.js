/**
 * Cloudflare Pages Function: /api/enquiry — non-confidential research collaboration enquiries from /work-with-us.
 *
 * GET  -> { configured, turnstileSiteKey, version, testMode } so the page can say honestly whether it can send.
 * POST -> validates, verifies Turnstile, and hands the enquiry to the email service (Resend). It answers
 *         202 { ok, accepted, reference } only when the service accepts the message; that is acceptance for
 *         delivery, not confirmation that it reached an inbox.
 *
 * Fails closed until every setting is present (Pages > Settings > Environment variables):
 *   ENQUIRY_TO            accountable recipient address (plain variable)
 *   ENQUIRY_FROM          sender on a domain verified with the email service, e.g. "NWPharmaTech website <…>"
 *   RESEND_API_KEY        email service key (secret)
 *   TURNSTILE_SITE_KEY    Turnstile widget key (plain variable; public)
 *   TURNSTILE_SECRET_KEY  Turnstile secret (secret; same name as /api/subscribe)
 * The production hosts www.nwpharmatech.org and nwpharmatech.org stay unconfigured even when those
 * settings are present, including when NWPT_CONVERSION_MODE=production. That flag opens only
 * /api/financing and /api/subscribe. Switching research collaboration on is a separate change.
 * Test only (honoured only when ENQUIRY_TEST_MODE is "1"): ENQUIRY_PROVIDER_URL, TURNSTILE_VERIFY_URL.
 *
 * Company text in the email comes from ./_lib/wwu-cards.js (generated from the site's content), never from
 * the browser; the browser sends only card ids, action codes and the visitor's own text, which is labelled as
 * such. Nothing from the request body is logged.
 */
import { WWU } from "./_lib/wwu-cards.js";
import { isProductionHost } from "./_lib/lanes.js";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
const str = (v) => (typeof v === "string" ? v.trim() : "");
const oneLine = (s) => s.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ");
const LIMITS = { name: 100, organisation: 150, role: 100, email: 254, message: 3000, item: 1000, items: 20 };

function settings(env) {
  const test = str(env.ENQUIRY_TEST_MODE) === "1";
  const s = {
    to: str(env.ENQUIRY_TO), from: str(env.ENQUIRY_FROM), key: str(env.RESEND_API_KEY),
    siteKey: str(env.TURNSTILE_SITE_KEY), secret: str(env.TURNSTILE_SECRET_KEY), test,
    providerUrl: (test && str(env.ENQUIRY_PROVIDER_URL)) || "https://api.resend.com/emails",
    verifyUrl: (test && str(env.TURNSTILE_VERIFY_URL)) || "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  };
  s.configured = !!(s.to && s.from && s.key && s.siteKey && s.secret);
  return s;
}

async function sha256hex(text) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function compose(input, reference) {
  const L = [];
  L.push("Research collaboration enquiry from nwpharmatech.org/work-with-us", `Reference: ${reference}`, `Content version: ${WWU.version}`, "");
  L.push("CONTACT DETAILS (provided by the visitor)", `Name: ${input.name}`, `Email: ${input.email}`, `Institution or organisation: ${input.organisation}`);
  if (input.role) L.push(`Role: ${input.role}`);
  const focus = Object.entries(input.answers);
  if (focus.length) { L.push("", "VISITOR'S FOCUS (optional answers)"); for (const [q, v] of focus) L.push(`${q}: ${WWU.questions[q][v]}`); }
  L.push("", `AGENDA (${input.agenda.length} item${input.agenda.length === 1 ? "" : "s"})`);
  input.agenda.forEach((it, i) => {
    const c = WWU.cards[it.card];
    L.push("", `${i + 1}. ${WWU.actions[it.action]} [card ${it.card}]`);
    if (c.kind !== "Question for discussion") {
      L.push(`   NWPharmaTech public information (${c.kind}${c.unresolved ? "; status: unresolved" : ""}): "${c.question ? c.question + " " : ""}${c.text}"`);
      if (c.stage) L.push(`   ${c.stage}`);
      c.refs.forEach(([t, u]) => L.push(`   Source: ${t} — ${u}`));
    }
    L.push(`   Visitor question: ${it.text ? it.text.replace(/\n/g, "\n   ") : "(none added)"}`);
  });
  L.push("", "MESSAGE (written by the visitor)", input.message || "(none)");
  L.push("", "The visitor confirmed that the enquiry contains no confidential or unpublished information and no patient or health information.");
  return L.join("\n");
}

export async function onRequestGet({ request, env }) {
  // Production host stays held even if enquiry settings, or NWPT_CONVERSION_MODE=production, are present.
  // That mode opens financing and programme updates only. Switching this route on is a separate change.
  if (isProductionHost(request)) {
    return json({ configured: false, turnstileSiteKey: null, version: WWU.version, testMode: false });
  }
  const s = settings(env);
  return json({ configured: s.configured, turnstileSiteKey: s.configured ? s.siteKey : null, version: WWU.version, testMode: s.test });
}

export async function onRequestPost({ request, env }) {
  if (isProductionHost(request)) return json({ error: "Online enquiries are not set up yet.", code: "not_configured" }, 503);
  const s = settings(env);
  const len = Number(request.headers.get("content-length") || 0);
  if (len > 32768) return json({ error: "The enquiry is too long." }, 413);
  if (!(request.headers.get("content-type") || "").includes("application/json")) return json({ error: "Send the enquiry as JSON." }, 415);
  let body;
  try { body = await request.json(); } catch { return json({ error: "The enquiry could not be read." }, 400); }
  if (!body || typeof body !== "object") return json({ error: "The enquiry could not be read." }, 400);

  // Never claim acceptance while any part of the delivery route is missing.
  if (!s.configured) return json({ error: "Online enquiries are not set up yet.", code: "not_configured" }, 503);

  if (str(body.website)) return json({ error: "The enquiry could not be accepted." }, 400); // honeypot
  if (str(body.version) !== WWU.version) return json({ error: "This page has been updated. Reload it and try again; your agenda is kept in this tab.", code: "version" }, 409);

  const input = {
    name: oneLine(str(body.name)), email: str(body.email).toLowerCase(), organisation: oneLine(str(body.organisation)),
    role: oneLine(str(body.role)), message: str(body.message), answers: {}, agenda: [],
  };
  const errors = [];
  if (!input.name || input.name.length > LIMITS.name) errors.push("Enter your name (up to 100 characters).");
  if (!input.email || input.email.length > LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) errors.push("Enter a valid email address.");
  if (!input.organisation || input.organisation.length > LIMITS.organisation) errors.push("Enter your institution or organisation (up to 150 characters).");
  if (input.role.length > LIMITS.role) errors.push("Role must be 100 characters or fewer.");
  if (input.message.length > LIMITS.message) errors.push("The message must be 3,000 characters or fewer.");
  if (body.confirm !== true) errors.push("Confirm that your enquiry is non-confidential.");
  if (body.answers && typeof body.answers === "object") {
    for (const [q, v] of Object.entries(body.answers)) if (WWU.questions[q] && WWU.questions[q][v]) input.answers[q] = v;
  }
  const agenda = Array.isArray(body.agenda) ? body.agenda : [];
  if (agenda.length > LIMITS.items) errors.push("The agenda can have up to 20 items.");
  for (const it of agenda.slice(0, LIMITS.items)) {
    const c = it && WWU.cards[it.card];
    if (!c || !c.actions.includes(it.action)) { errors.push("The agenda contains an item that is no longer available. Reload the page."); break; }
    const text = str(it.text);
    if (text.length > LIMITS.item) { errors.push("Each question must be 1,000 characters or fewer."); break; }
    input.agenda.push({ card: it.card, action: it.action, text });
  }
  if (!input.agenda.length && !input.message) errors.push("Add cards to your agenda or write a message.");
  const idem = str(body.idempotencyKey);
  if (!/^[A-Za-z0-9-]{16,64}$/.test(idem)) errors.push("The enquiry could not be read. Reload the page and try again.");
  const tsToken = str(body.turnstileToken);
  if (!tsToken) errors.push("Complete the security check.");
  if (errors.length) return json({ error: errors.join(" ") }, 400);

  // Turnstile (idempotency_key lets a retried submission re-verify the same token)
  const verifyBody = new URLSearchParams({ secret: s.secret, response: tsToken, idempotency_key: idem });
  const ip = str(request.headers.get("CF-Connecting-IP"));
  if (ip) verifyBody.set("remoteip", ip);
  let verified;
  try {
    const r = await fetch(s.verifyUrl, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: verifyBody });
    verified = await r.json();
  } catch { return json({ error: "The security check is temporarily unavailable. Please try again." }, 502); }
  if (!verified || verified.success !== true) return json({ error: "The security check could not be verified. Please complete it again." }, 400);

  const reference = "WWU-" + (await sha256hex(idem)).slice(0, 8).toUpperCase();
  const email = {
    from: s.from, to: [s.to], reply_to: input.email,
    subject: oneLine(`Research collaboration enquiry — ${input.organisation}`).slice(0, 200),
    text: compose(input, reference),
    headers: { "X-NWPT-Enquiry-Reference": reference },
  };
  let res;
  try {
    res = await fetch(s.providerUrl, {
      method: "POST",
      headers: { authorization: `Bearer ${s.key}`, "content-type": "application/json", "idempotency-key": idem },
      body: JSON.stringify(email),
    });
  } catch { return json({ error: "The email service could not be reached. Please try again; resubmitting will not create a duplicate." }, 502); }
  let out = null;
  try { out = await res.json(); } catch { out = null; }
  if (res.ok && out && typeof out.id === "string" && out.id) {
    return json({ ok: true, accepted: true, reference,
      message: "Our email service accepted your enquiry for delivery to the NWPharmaTech team. This confirms acceptance, not that it has reached an inbox." }, 202);
  }
  if (res.status === 409) return json({ error: "Your enquiry is still being processed. Wait a moment and try again; it will not be sent twice." }, 409);
  if (res.status === 429) return json({ error: "The email service is busy. Please try again shortly." }, 503);
  return json({ error: "The email service did not accept the enquiry. Please try again later." }, 502);
}

export async function onRequest() {
  return json({ error: "Method not allowed." }, 405);
}
