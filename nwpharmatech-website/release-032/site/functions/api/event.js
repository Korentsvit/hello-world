/**
 * Cloudflare Pages Function (a Worker): POST /api/event — first-party conversion events for the
 * Digital programme finance page (NWPT-055).
 *
 * Stores only: event name, page path, time (Analytics Engine records the write time; the server time is
 * also stored), campaign/cohort UTM tags, and a CTA/link identifier. Every field is checked against an
 * allowlist; unknown fields are ignored. Nothing is stored that contains "@", so an email address cannot be
 * persisted. The function never reads or stores IP address, user agent, location, cookies, wallet or health data.
 *
 * Storage: a Workers Analytics Engine binding named NWPT_EVENTS (set on the Pages project). Without the
 * binding nothing is stored and the endpoint answers 503. Cross-origin posts are refused.
 */
const EVENTS = new Set([
  "funding_digital_page_view", "architecture_section_view", "funding_use_click", "evidence_click",
  "desci_click", "programme_financing_cta_click", "conversation_cta_click", "faq_expand",
]);
const PAGES = new Set(["/funding/digital-programme-finance"]);
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
const LINK = /^[a-z0-9-]{1,32}(:[A-Za-z0-9/_.#-]{1,120})?$/;
const MAX_BYTES = 2048;
const HEADERS = { "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };

const reply = (status, body) => new Response(body ? JSON.stringify(body) : null, {
  status, headers: body ? { ...HEADERS, "content-type": "application/json; charset=utf-8" } : HEADERS,
});
// A tag that contains "@" is dropped whole (never stripped into something derived from an address).
const utmValue = (v) => (typeof v === "string" && !v.includes("@") ? v.slice(0, 100).replace(/[^\w .\-]/g, "").trim() : "");

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return reply(403, { error: "cross-origin" });
  const type = (request.headers.get("content-type") || "").toLowerCase();
  if (!/^(application\/json|text\/plain)\b/.test(type)) return reply(415, { error: "unsupported" });
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return reply(413, { error: "too large" });
  let body;
  try { body = JSON.parse(raw); } catch { return reply(400, { error: "invalid" }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return reply(400, { error: "invalid" });

  const event = typeof body.event === "string" ? body.event : "";
  const path = typeof body.path === "string" ? body.path : "";
  if (!EVENTS.has(event) || !PAGES.has(path)) return reply(400, { error: "invalid" });
  const link = typeof body.link === "string" && LINK.test(body.link) ? body.link : "";
  const utm = UTM.map((k) => utmValue(body[k]));
  const blobs = [event, path, link, ...utm];
  if (blobs.some((b) => b.includes("@"))) return reply(400, { error: "invalid" });

  const store = env && env.NWPT_EVENTS;
  if (!store || typeof store.writeDataPoint !== "function") return reply(503, { error: "not configured", stored: false });
  store.writeDataPoint({ indexes: [event], blobs, doubles: [Date.now()] });
  return reply(204);
}

export async function onRequest() {
  return reply(405, { error: "Method not allowed." });
}
