/**
 * Cloudflare Pages Function: /api/financing
 *
 * Exploratory programme-financing enquiries. Not an investment, payment, allocation, or wallet path.
 * Separate from /api/enquiry (research collaboration) and from /api/subscribe (programme news).
 *
 * Fails closed unless the host matches NWPT_CONVERSION_MODE and all of these are set:
 *   FINANCING_TO or ENQUIRY_TO
 *   FINANCING_FROM or ENQUIRY_FROM
 *   RESEND_API_KEY, TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY
 * www.nwpharmatech.org and nwpharmatech.org require NWPT_CONVERSION_MODE=production.
 * Any other host requires NWPT_CONVERSION_MODE=preview.
 * Test overrides (ENQUIRY_PROVIDER_URL, TURNSTILE_VERIFY_URL) apply only when ENQUIRY_TEST_MODE=1.
 * Do not set ENQUIRY_TEST_MODE on the production Pages project.
 */
import {
  str, oneLine, json, emailOk, sha256hex, previewOpen, statusBody, providerSettings,
  verifyTurnstile, sendEmail, bannedField, readBody, idemOk,
} from "./_lib/lanes.js";

const VERSION = "financing-1";
const LIMITS = { name: 100, organisation: 150, role: 100, message: 3000 };

function settings(env) {
  const base = providerSettings(env);
  const to = str(env.FINANCING_TO) || str(env.ENQUIRY_TO);
  const from = str(env.FINANCING_FROM) || str(env.ENQUIRY_FROM);
  const ready = !!(to && from && base.key && base.siteKey && base.secret);
  return { ...base, to, from, ready };
}

function notConfigured() {
  return json({ error: "Online financing enquiries are not set up yet. Nothing has been sent.", code: "not_configured" }, 503);
}

export async function onRequestGet({ request, env }) {
  const s = settings(env || {});
  const open = previewOpen(request, env || {}, s.ready);
  return json(statusBody(open, s.siteKey, VERSION, "financing", s.test, request));
}

export async function onRequestPost({ request, env }) {
  const s = settings(env || {});
  if (!previewOpen(request, env || {}, s.ready)) return notConfigured();

  const read = await readBody(request);
  if (read.error) return read.error;
  const body = read.body;
  if (bannedField(body)) {
    return json({ error: "This form cannot accept a wallet, payment, or allocation. Nothing has been sent." }, 400);
  }
  if (str(body.website)) return json({ error: "The enquiry could not be accepted. Nothing has been sent." }, 400);

  const input = {
    name: oneLine(str(body.name)),
    email: str(body.email).toLowerCase(),
    organisation: oneLine(str(body.organisation)),
    role: oneLine(str(body.role)),
    message: str(body.message),
  };
  const errors = [];
  if (!input.name || input.name.length > LIMITS.name) errors.push("Enter your name (up to 100 characters).");
  if (!emailOk(input.email)) errors.push("Enter a valid email address.");
  if (input.organisation.length > LIMITS.organisation) errors.push("Organisation must be 150 characters or fewer.");
  if (input.role.length > LIMITS.role) errors.push("Role must be 100 characters or fewer.");
  if (!input.message || input.message.length > LIMITS.message) errors.push("Enter a message (up to 3,000 characters).");
  if (body.confirmExploratory !== true && !["yes", "on", "true", "1"].includes(str(body.confirmExploratory).toLowerCase())) {
    errors.push("Confirm that this is an exploratory conversation, not an investment, payment, or wallet connection.");
  }
  const idem = str(body.idempotencyKey);
  if (!idemOk(idem)) errors.push("The enquiry could not be read. Reload the page and try again.");
  const tsToken = str(body.turnstileToken || body["cf-turnstile-response"]);
  if (!tsToken) errors.push("Complete the security check.");
  if (errors.length) return json({ error: errors.join(" "), sent: false }, 400);

  const turnstile = await verifyTurnstile(s, request, tsToken, idem);
  if (!turnstile.ok) return json({ error: turnstile.error, sent: false }, turnstile.status);

  const reference = "FIN-" + (await sha256hex(idem)).slice(0, 8).toUpperCase();
  const who = input.organisation || input.name;
  const lines = [
    "Programme financing enquiry from nwpharmatech.org",
    `Reference: ${reference}`,
    "Lane: financing",
    "",
    "This is an exploratory, non-binding conversation. It is not an offer, an allocation, a payment, or a wallet connection.",
    "The sender cannot invest, pay, or connect a wallet on the website.",
    "Programme updates were not required and were not collected as part of this enquiry.",
    "",
    "CONTACT DETAILS (provided by the visitor)",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Organisation: ${input.organisation || "(none given)"}`,
  ];
  if (input.role) lines.push(`Role: ${input.role}`);
  lines.push("", "MESSAGE (written by the visitor)", input.message, "", "Provider acceptance of this message is not proof that it reached an inbox.");

  const sent = await sendEmail(s, {
    from: s.from,
    to: [s.to],
    reply_to: input.email,
    subject: oneLine(`Programme financing enquiry — ${who}`).slice(0, 200),
    text: lines.join("\n"),
    tags: [{ name: "lane", value: "financing" }, { name: "site", value: "nwpharmatech" }],
    headers: { "X-NWPT-Lane": "financing", "X-NWPT-Reference": reference },
  }, `fin-${(await sha256hex(idem)).slice(0, 48)}`);

  if (sent.ok) {
    return json({
      ok: true,
      accepted: true,
      inboxConfirmed: false,
      reference,
      lane: "financing",
      message: "Our email service accepted your enquiry for delivery to the NWPharmaTech team. This confirms acceptance for delivery, not that it has reached an inbox. It does not mean you have invested, paid, subscribed, or been allocated anything.",
    }, 202);
  }
  if (sent.status === 409) return json({ error: "Your enquiry is still being processed. Wait a moment and try again; it will not be sent twice.", sent: false }, 409);
  if (sent.status === 429) return json({ error: "The email service is busy. Please try again shortly. Nothing further has been sent.", sent: false }, 503);
  return json({ error: "The email service did not accept the enquiry. Nothing has been sent. Please try again later.", sent: false }, 502);
}

export async function onRequest() {
  return json({ error: "Method not allowed." }, 405);
}
