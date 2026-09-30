/**
 * GET or POST /api/subscribe?action=unsubscribe&token=
 * Opts the address out of the programme-updates topic and records nwpt_updates=unsubscribed.
 * Financing enquiries are one-off mail and are not affected.
 * POST also honours a mailbox one-click unsubscribe. The token is the authority.
 */
import { str, previewOpen, htmlPage, htmlError, readToken, esc } from "./lanes.js";
import { updatesSettings, topicOf, setStatus, setTopic, getTopics } from "./updates.js";

export async function onRequestGet(ctx) {
  return unsubscribe(ctx, false);
}

export async function onRequestPost(ctx) {
  return unsubscribe(ctx, true);
}

async function unsubscribe({ request, env }, asPost) {
  const s = updatesSettings(env || {});
  if (!previewOpen(request, env || {}, s.ready)) {
    return htmlError("Programme updates are not available", "Programme updates are not set up on this site. Nothing has been changed.", 503);
  }
  const token = str(new URL(request.url).searchParams.get("token"));
  const payload = await readToken(s.signing, token, "unsub");
  if (!payload) {
    return htmlError("This unsubscribe link is not valid", "The link is missing, expired, or does not match. Nothing has been changed.");
  }
  const recorded = await setStatus(s, payload.e, "unsubscribed");
  if (!recorded.ok) {
    return htmlError("Unsubscribe was not recorded", "The email service did not record the opt-out. You are not shown as unsubscribed.", 502);
  }
  const opted = await setTopic(s, payload.e, "opt_out");
  if (!opted.ok) {
    return htmlError("Unsubscribe was not recorded", "The email service did not record the opt-out. You are not shown as unsubscribed.", 502);
  }
  const check = await getTopics(s, payload.e);
  if (topicOf(check.data, s.topic) !== "opt_out") {
    return htmlError("Unsubscribe was not recorded", "The email service did not show this address as opted out. You are not shown as unsubscribed.", 502);
  }
  if (asPost) {
    return new Response("Unsubscribed\n", {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", "referrer-policy": "no-referrer" },
    });
  }
  const origin = new URL(request.url).origin;
  return htmlPage({
    title: "Programme updates stopped",
    heading: "Programme updates stopped",
    paragraphs: [
      `${esc(payload.e)} will not be sent programme updates.`,
      "The email service now shows this address as opted out of programme news. Later programme-update sends on that topic are not delivered to an opted-out address.",
      "This does not delete a financing enquiry. Financing messages are one-off mail, kept in the recipient mailbox, and are described in the privacy notice.",
    ],
    actions: [{ href: `${origin}/privacy.html`, label: "Privacy notice" }],
  });
}

export async function onRequest() {
  return htmlError("Method not allowed", "This unsubscribe page does not accept that method.", 405);
}
