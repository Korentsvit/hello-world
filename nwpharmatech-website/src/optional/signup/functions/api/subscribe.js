// Cloudflare Pages Function: POST /api/subscribe  (optional; included only with `build.py --with-signup`)
// Double opt-in: the provider sends the confirmation email; nobody is subscribed until they confirm.
// Unsubscribe links are added by the provider to every email. We store nothing ourselves.
//
// Environment:
//   SIGNUP_PROVIDER   "buttondown" (adapter below) or "webhook"
//   SIGNUP_API_KEY    provider API key (secret)
//   SIGNUP_WEBHOOK    for "webhook": URL that accepts {email} and performs double opt-in (contract: docs/email-signup.md)
// Each adapter is checked against the real provider, on a test list, with tools/test-signup-live.mjs before the
// form can be built (docs/email-signup.md).
//
// Outcomes are either definite (we know what happened and say so) or unconfirmed: the request may have
// reached the provider but we did not get an answer we can read (network failure, timeout, 5xx, a redirect,
// an unexpected reply). Then the sign-up may or may not have been recorded, and we say exactly that.
// Redirects are never followed: a followed redirect is re-sent elsewhere (a 302 as a GET without the address),
// so the answer that comes back would not be the provider's answer to this sign-up.

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const TIMEOUT_MS = 8000;              // for the provider's whole answer, body included
const ADDRESS_REJECTED = [400, 409, 422];

// The same words are used by the browser script (src/assets/js/site.js) and listed in docs/email-signup.md.
export const MESSAGES = {
  accepted: "Thank you. Please check your inbox and confirm your email address. You will not receive updates until you confirm.",
  invalid: "Please enter a valid email address.",
  unreadable: "We could not read the form. Please try again.",
  rejected: "We could not sign up that address. It may already be subscribed, or the provider may not accept it. If you already receive updates, there is nothing more to do.",
  refused: "Our email provider did not accept the sign-up. Please try again later.",
  unavailable: "Email sign-up is not available at the moment, and your address has not been passed to an email provider or stored. Please try again later.",
  unconfirmed: "We could not get confirmation that your sign-up was received, so it may or may not have been recorded. If an email arrives asking you to confirm your address, please follow the link in it. If none arrives, please try again later.",
  method: "Please use the sign-up form.",
};

const adapters = {
  buttondown: {
    configured: (env) => Boolean(env.SIGNUP_API_KEY),
    send: (email, env, signal) => fetch("https://api.buttondown.com/v1/subscribers", {
      method: "POST",
      signal,
      redirect: "manual",
      headers: { Authorization: `Token ${env.SIGNUP_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email_address: email, type: "unactivated" }),
    }),
    understood: (body) => Boolean(body.id),       // the created subscriber
  },
  webhook: {
    configured: (env) => Boolean(env.SIGNUP_API_KEY && env.SIGNUP_WEBHOOK),
    send: (email, env, signal) => fetch(env.SIGNUP_WEBHOOK, {
      method: "POST",
      signal,
      redirect: "manual",
      headers: { Authorization: `Bearer ${env.SIGNUP_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, double_opt_in: true }),
    }),
    understood: (body) => body.accepted === true,
  },
};

// Asks the provider. Returns [HTTP status, outcome].
async function ask(adapter, email, env) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await adapter.send(email, env, ctrl.signal);
    if (res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400)) return [502, "unconfirmed"];   // not followed
    if (ADDRESS_REJECTED.includes(res.status)) return [400, "rejected"];
    if (res.status >= 400 && res.status < 500) return [503, "refused"];   // e.g. wrong key, rate limit
    if (!res.ok) return [502, "unconfirmed"];                             // 5xx, or a status we do not expect
    const body = JSON.parse(await res.text());
    return body && adapter.understood(body) ? [200, "accepted"] : [502, "unconfirmed"];
  } catch {                                  // network failure, timeout, or a reply that is not JSON
    return [ctrl.signal.aborted ? 504 : 502, "unconfirmed"];
  } finally {
    clearTimeout(timer);
  }
}

function reply(request, status, outcome) {
  const message = MESSAGES[outcome];
  const wantsJson = (request.headers.get("accept") || "").includes("application/json");
  // Cloudflare Pages does not apply _headers to Function responses, so the page's own policy is set here.
  const headers = { "cache-control": "no-store", "x-robots-tag": "noindex", "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; style-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'" };
  if (wantsJson) return new Response(JSON.stringify({ ok: status < 300, outcome, message }), { status, headers: { ...headers, "content-type": "application/json" } });
  const html = `<!DOCTYPE html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Email updates</title><link rel="stylesheet" href="/assets/css/site.css"><main class="section"><div class="container prose"><h1>Email updates</h1><p>${message}</p><p><a href="/newsroom#signup">Back to the newsroom</a></p></div></main></html>`;
  return new Response(html, { status, headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
}

export async function onRequestPost({ request, env }) {
  const adapter = adapters[env.SIGNUP_PROVIDER];
  if (!adapter || !adapter.configured(env)) return reply(request, 503, "unavailable");
  let email = "", trap = "";
  try {
    const form = await request.formData();
    email = String(form.get("email") || "").trim();
    trap = String(form.get("website") || "");
  } catch {
    return reply(request, 400, "unreadable");
  }
  if (trap) return reply(request, 200, "accepted");   // bots get the ordinary answer; the provider is not called
  if (!EMAIL.test(email)) return reply(request, 400, "invalid");
  const [status, outcome] = await ask(adapter, email, env);
  return reply(request, status, outcome);
}

export async function onRequest({ request }) {
  return reply(request, 405, "method");
}
