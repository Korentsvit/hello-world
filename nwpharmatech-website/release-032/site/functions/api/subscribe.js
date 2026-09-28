/**
 * Cloudflare Pages Function: /api/subscribe
 *
 * Programme updates only (news). Not a financing form, not an investment waitlist, and not a health form.
 * Double opt-in: POST asks Resend to accept a confirmation email. The address is not registered until
 * GET /api/subscribe?action=confirm records an opt-in on the programme-updates topic.
 * Unsubscribe is GET or POST /api/subscribe?action=unsubscribe. Both live on this file so Pages
 * does not have a subscribe.js file and a subscribe/ directory at the same time.
 *
 * Buttondown is not called. The older draft under src/optional/signup/ is reference only.
 *
 * Fails closed unless NWPT_CONVERSION_MODE=preview, the host is not www, and all of these are set:
 *   RESEND_API_KEY, TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY
 *   UPDATES_FROM or ENQUIRY_FROM, UPDATES_TO or ENQUIRY_TO
 *   UPDATES_SIGNING_SECRET (16+ characters), UPDATES_TOPIC_ID
 * The Resend contact property nwpt_updates must accept the values pending, confirmed, and unsubscribed.
 * Test URL overrides apply only when ENQUIRY_TEST_MODE=1.
 */
import {
  str, oneLine, json, emailOk, sha256hex, previewOpen, statusBody,
  verifyTurnstile, sendEmail, signToken, bannedField, readBody, idemOk,
} from "./_lib/lanes.js";
import { updatesSettings, statusOf, topicOf, setStatus, setTopic, getContact, getTopics } from "./_lib/updates.js";
import { onRequestGet as confirmGet, onRequestPost as confirmPost } from "./_lib/updates-confirm.js";
import { onRequestGet as unsubGet, onRequestPost as unsubPost } from "./_lib/updates-unsubscribe.js";

const VERSION = "updates-1";
const CONFIRM_MS = 7 * 24 * 60 * 60 * 1000;
const UNSUB_MS = 400 * 24 * 60 * 60 * 1000;

function notConfigured() {
  return json({ error: "Programme updates are not set up yet. Nothing has been sent.", code: "not_configured" }, 503);
}

export async function onRequestGet({ request, env }) {
  const action = new URL(request.url).searchParams.get("action");
  if (action === "confirm") return confirmGet({ request, env });
  if (action === "unsubscribe") return unsubGet({ request, env });
  const s = updatesSettings(env || {});
  const open = previewOpen(request, env || {}, s.ready);
  return json(statusBody(open, s.siteKey, VERSION, "updates", s.test));
}

export async function onRequestPost({ request, env }) {
  const action = new URL(request.url).searchParams.get("action");
  if (action === "confirm") return confirmPost({ request, env });
  if (action === "unsubscribe") return unsubPost({ request, env });
  const s = updatesSettings(env || {});
  if (!previewOpen(request, env || {}, s.ready)) return notConfigured();

  const read = await readBody(request);
  if (read.error) return read.error;
  const body = read.body;
  if (bannedField(body)) {
    return json({ error: "This form cannot accept a wallet, payment, or allocation. Nothing has been sent.", sent: false }, 400);
  }
  if (str(body.website)) return json({ error: "The request could not be accepted. Nothing has been sent.", sent: false }, 400);

  const email = str(body.email || body.email_address).toLowerCase();
  const name = oneLine(str(body.name));
  const consent = body.consent === true || ["yes", "on", "true", "1"].includes(str(body.consent).toLowerCase());
  const errors = [];
  if (!emailOk(email)) errors.push("Enter a valid email address.");
  if (name.length > 100) errors.push("Name must be 100 characters or fewer.");
  if (!consent) errors.push("Confirm that you want occasional programme news. This is not a financing enquiry.");
  const idem = str(body.idempotencyKey);
  if (!idemOk(idem)) errors.push("The request could not be read. Reload the page and try again.");
  const tsToken = str(body.turnstileToken || body["cf-turnstile-response"]);
  if (!tsToken) errors.push("Complete the security check.");
  if (errors.length) return json({ error: errors.join(" "), sent: false }, 400);

  const turnstile = await verifyTurnstile(s, request, tsToken, idem);
  if (!turnstile.ok) return json({ error: turnstile.error, sent: false }, turnstile.status);

  const loaded = await getContact(s, email);
  if (loaded.status !== 404 && !loaded.ok) {
    return json({ error: "The email service could not be reached. Nothing has been registered.", sent: false }, 502);
  }
  if (loaded.ok && loaded.data && loaded.data.unsubscribed === true) {
    return json({
      error: "This address is blocked from emails at the email service. Programme updates were not turned on. Nothing has been registered.",
      sent: false,
    }, 409);
  }
  const current = loaded.status === 404 ? "absent" : statusOf(loaded.data);
  if (current === "confirmed") {
    return json({
      ok: true,
      accepted: false,
      already: true,
      inboxConfirmed: false,
      lane: "updates",
      message: "This address is already registered for programme updates. You were not added again, and no new confirmation was required. This is news only, not a financing enquiry.",
    }, 200);
  }

  const topics = await getTopics(s, email);
  if (!topics.ok && topics.status !== 404) {
    return json({ error: "The email service could not be reached. Nothing has been registered.", sent: false }, 502);
  }
  if (current === "absent" && topicOf(topics.data, s.topic) === "opt_in") {
    await setStatus(s, email, "confirmed", name);
    return json({
      ok: true,
      accepted: false,
      already: true,
      inboxConfirmed: false,
      lane: "updates",
      message: "This address is already registered for programme updates. You were not added again, and no new confirmation was required. This is news only, not a financing enquiry.",
    }, 200);
  }

  const pending = await setStatus(s, email, "pending", name);
  if (!pending.ok) {
    return json({ error: "The email service did not accept the programme-updates record. Nothing has been registered.", sent: false }, 502);
  }
  const after = await getTopics(s, email);
  if (topicOf(after.data, s.topic) === "opt_in" || topicOf(topics.data, s.topic) === "opt_in") {
    const cleared = await setTopic(s, email, "opt_out");
    if (!cleared.ok) {
      return json({ error: "The email service did not accept the programme-updates record. Nothing has been registered.", sent: false }, 502);
    }
  }

  const origin = new URL(request.url).origin;
  const now = Date.now();
  const confirmTok = await signToken(s.signing, { e: email, p: "confirm", exp: now + CONFIRM_MS });
  const unsubTok = await signToken(s.signing, { e: email, p: "unsub", exp: now + UNSUB_MS });
  const confirmUrl = `${origin}/api/subscribe?action=confirm&token=${encodeURIComponent(confirmTok)}`;
  const unsubUrl = `${origin}/api/subscribe?action=unsubscribe&token=${encodeURIComponent(unsubTok)}`;
  const reference = "UPD-" + (await sha256hex(idem)).slice(0, 8).toUpperCase();
  const stamp = (await sha256hex("upd:" + idem)).slice(0, 40);

  const team = await sendEmail(s, {
    from: s.from,
    to: [s.to],
    reply_to: email,
    subject: oneLine(`Programme updates request — ${email}`).slice(0, 200),
    text: [
      "Programme updates request from nwpharmatech.org",
      `Reference: ${reference}`,
      "Lane: updates",
      "",
      "News only. This is not a financing enquiry, not an offer, and not a health-information form.",
      "The address is not registered until the person confirms from their own email.",
      "",
      `Email: ${email}`,
      `Name: ${name || "(none given)"}`,
      "",
      "Provider acceptance of this message is not proof that it reached an inbox.",
    ].join("\n"),
    tags: [{ name: "lane", value: "updates" }, { name: "site", value: "nwpharmatech" }],
    headers: { "X-NWPT-Lane": "updates", "X-NWPT-Reference": reference },
  }, `upd-team-${stamp}`);
  if (!team.ok) {
    return json({ error: "The email service did not accept the programme-updates request. You have not been registered.", sent: false }, team.status === 429 ? 503 : 502);
  }

  const visitor = await sendEmail(s, {
    from: s.from,
    to: [email],
    reply_to: s.to,
    subject: oneLine(`Confirm programme updates — ${email}`).slice(0, 200),
    text: [
      "Confirm programme updates",
      "",
      "You asked to receive occasional programme news from NWPharmaTech. You are not registered yet.",
      "",
      `Confirm: ${confirmUrl}`,
      "",
      "This is news only. It is not a financing enquiry, not an offer, and not a request for health information.",
      "You cannot invest, pay, or connect a wallet on our website.",
      "",
      "Unsubscribe (this stops programme updates to this address):",
      unsubUrl,
      "",
      "Acceptance by the email service is not proof that this message reached your inbox.",
    ].join("\n"),
    tags: [{ name: "lane", value: "updates" }, { name: "site", value: "nwpharmatech" }, { name: "kind", value: "confirm" }],
    headers: {
      "X-NWPT-Lane": "updates",
      "X-NWPT-Reference": reference,
      "List-Unsubscribe": `<${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  }, `upd-vis-${stamp}`);
  if (!visitor.ok) {
    return json({ error: "The email service did not accept the confirmation message. You have not been registered.", sent: false }, visitor.status === 429 ? 503 : 502);
  }

  return json({
    ok: true,
    accepted: true,
    inboxConfirmed: false,
    registered: false,
    reference,
    lane: "updates",
    message: "Our email service accepted a confirmation message for delivery to you. You are not registered for programme updates until you confirm from that email. Acceptance is not proof the message reached an inbox. This is news only, not a financing enquiry.",
  }, 202);
}

export async function onRequest() {
  return json({ error: "Method not allowed." }, 405);
}

