/**
 * GET  /api/subscribe?action=confirm&token=  — record programme-updates opt-in after the email link.
 * POST — same token, used only when the address had already unsubscribed and chooses to register again.
 */
import { str, previewOpen, htmlPage, htmlError, readToken, esc, signToken } from "./lanes.js";
import { updatesSettings, statusOf, topicOf, setStatus, setTopic, getContact, getTopics } from "./updates.js";

const UNSUB_MS = 400 * 24 * 60 * 60 * 1000;

function closed() {
  return htmlError("Programme updates are not available", "Programme updates are not set up on this site. Nothing has been changed.", 503);
}

async function recordOptIn(s, email) {
  const recorded = await setStatus(s, email, "confirmed");
  if (!recorded.ok) return htmlError("Programme updates were not confirmed", "The email service did not record the confirmation. You are not shown as registered.", 502);
  const opted = await setTopic(s, email, "opt_in");
  if (!opted.ok) return htmlError("Programme updates were not confirmed", "The email service did not record the confirmation. You are not shown as registered.", 502);
  const check = await getTopics(s, email);
  if (topicOf(check.data, s.topic) !== "opt_in") {
    return htmlError("Programme updates were not confirmed", "The email service did not show this address as opted in. You are not shown as registered.", 502);
  }
  return null;
}

function confirmedPage(origin, email, unsubToken) {
  return htmlPage({
    title: "Programme updates confirmed",
    heading: "Programme updates confirmed",
    paragraphs: [
      `${esc(email)} is now registered for occasional programme news.`,
      "This confirms the registration record with the email service. It is not proof that any particular message reached an inbox, and it is not an investment, a payment, or an enrolment.",
      "You cannot invest, pay, or connect a wallet on our website.",
    ],
    actions: [
      { href: `${origin}/api/subscribe?action=unsubscribe&token=${encodeURIComponent(unsubToken)}`, label: "Unsubscribe from programme updates" },
      { href: `${origin}/privacy.html`, label: "Privacy notice" },
    ],
  });
}

export async function onRequestGet({ request, env }) {
  const s = updatesSettings(env || {});
  if (!previewOpen(request, env || {}, s.ready)) return closed();
  const url = new URL(request.url);
  const token = str(url.searchParams.get("token"));
  const payload = await readToken(s.signing, token, "confirm");
  if (!payload) return htmlError("This confirmation link is not valid", "The link is missing, expired, or does not match. Nothing has been changed. You can request programme updates again from the Contact page.");

  const loaded = await getContact(s, payload.e);
  if (loaded.status === 404) return htmlError("This confirmation link is not valid", "No programme-updates record was found for this address. Nothing has been changed.", 404);
  if (!loaded.ok) return htmlError("Programme updates could not be confirmed", "The email service could not be reached. Nothing has been changed.", 502);
  if (loaded.data && loaded.data.unsubscribed === true) {
    return htmlError("Programme updates were not turned on", "This address is blocked from emails at the email service. Nothing has been changed.", 409);
  }

  const origin = url.origin;
  const state = statusOf(loaded.data);
  if (state === "confirmed") {
    return htmlPage({
      title: "Already registered for programme updates",
      heading: "Already registered for programme updates",
      paragraphs: [
        `${esc(payload.e)} is already registered for programme news. No new registration was made.`,
        "This is news only. It is not an investment, a payment, or a wallet connection.",
      ],
      actions: [
        { href: `${origin}/privacy.html`, label: "Privacy notice" },
        { href: `${origin}/contact.html#updates-enquiry`, label: "Contact" },
      ],
    });
  }
  if (state === "unsubscribed") {
    return htmlPage({
      title: "This address was unsubscribed",
      heading: "This address was unsubscribed",
      paragraphs: [
        `${esc(payload.e)} previously opted out of programme updates. Opening this page has not registered it again.`,
        "Programme updates are news only. Registering is not a financing enquiry, and you cannot invest, pay, or connect a wallet on our website.",
      ],
      extra: `<form method="post" action="${esc(origin + "/api/subscribe?action=confirm&token=" + encodeURIComponent(token))}"><button type="submit">Register again for programme updates</button></form>`,
    });
  }

  const failed = await recordOptIn(s, payload.e);
  if (failed) return failed;
  const unsubToken = await signToken(s.signing, { e: payload.e, p: "unsub", exp: Date.now() + UNSUB_MS });
  return confirmedPage(origin, payload.e, unsubToken);
}

export async function onRequestPost({ request, env }) {
  const s = updatesSettings(env || {});
  if (!previewOpen(request, env || {}, s.ready)) return closed();
  const url = new URL(request.url);
  const token = str(url.searchParams.get("token"));
  const payload = await readToken(s.signing, token, "confirm");
  if (!payload) return htmlError("This confirmation link is not valid", "The link is missing, expired, or does not match. Nothing has been changed.");
  const loaded = await getContact(s, payload.e);
  if (!loaded.ok) return htmlError("Programme updates could not be confirmed", "The email service could not be reached. Nothing has been changed.", loaded.status === 404 ? 404 : 502);
  if (loaded.data && loaded.data.unsubscribed === true) {
    return htmlError("Programme updates were not turned on", "This address is blocked from emails at the email service. Nothing has been changed.", 409);
  }
  const failed = await recordOptIn(s, payload.e);
  if (failed) return failed;
  const unsubToken = await signToken(s.signing, { e: payload.e, p: "unsub", exp: Date.now() + UNSUB_MS });
  return confirmedPage(url.origin, payload.e, unsubToken);
}

export async function onRequest() {
  return htmlError("Method not allowed", "This confirmation page does not accept that method.", 405);
}
