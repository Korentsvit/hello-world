/**
 * Programme-updates state on Resend: contact property `nwpt_updates` plus one topic.
 * pending — confirmation email accepted, not registered
 * confirmed — topic opt_in
 * unsubscribed — topic opt_out; a later confirm link does not opt in until the person posts again
 */
import { str, providerSettings, resendFetch } from "./lanes.js";

export function updatesSettings(env) {
  const base = providerSettings(env || {});
  const to = str(env.UPDATES_TO) || str(env.ENQUIRY_TO);
  const from = str(env.UPDATES_FROM) || str(env.ENQUIRY_FROM);
  const signing = str(env.UPDATES_SIGNING_SECRET);
  const topic = str(env.UPDATES_TOPIC_ID);
  const ready = !!(base.key && base.siteKey && base.secret && to && from && signing.length >= 16 && topic);
  return { ...base, to, from, signing, topic, ready };
}

export function statusOf(contact) {
  const props = contact && contact.properties;
  const raw = props && props.nwpt_updates;
  const value = str(typeof raw === "object" && raw ? raw.value : raw);
  if (value === "pending" || value === "confirmed" || value === "unsubscribed") return value;
  return "absent";
}

export function topicOf(data, topicId) {
  const list = Array.isArray(data) ? data : (data && (data.data || data.topics)) || [];
  const row = list.find((t) => t && (t.id === topicId || t.topic_id === topicId));
  if (!row) return "absent";
  return row.subscription === "opt_in" || row.subscription === "opt_out" ? row.subscription : "absent";
}

export async function setStatus(s, email, status, firstName) {
  const path = "/contacts/" + encodeURIComponent(email);
  const payload = { properties: { nwpt_updates: status } };
  if (firstName) payload.first_name = firstName;
  const patched = await resendFetch(s, path, "PATCH", payload);
  if (patched.ok) return { ok: true };
  if (patched.status === 404) {
    const created = await resendFetch(s, "/contacts", "POST", {
      email,
      unsubscribed: false,
      ...(firstName ? { first_name: firstName } : {}),
      properties: { nwpt_updates: status },
    });
    if (created.ok || created.status === 409) return { ok: true };
  }
  return { ok: false };
}

export async function setTopic(s, email, subscription) {
  const path = "/contacts/" + encodeURIComponent(email) + "/topics";
  const patched = await resendFetch(s, path, "PATCH", [{ id: s.topic, subscription }]);
  if (!patched.ok) return patched;
  // Resend topic updates can lag briefly on read-after-write.
  for (let i = 0; i < 6; i++) {
    if (i) await new Promise((r) => setTimeout(r, 250 * i));
    const check = await getTopics(s, email);
    if (topicOf(check.data, s.topic) === subscription) return { ok: true, status: patched.status, data: check.data };
  }
  return { ok: false, status: 502, data: null };
}

export async function getContact(s, email) {
  return resendFetch(s, "/contacts/" + encodeURIComponent(email), "GET");
}

export async function getTopics(s, email) {
  return resendFetch(s, "/contacts/" + encodeURIComponent(email) + "/topics", "GET");
}
