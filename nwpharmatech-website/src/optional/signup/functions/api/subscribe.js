// Cloudflare Pages Function: POST /api/subscribe  (optional; included only with `build.py --with-signup`)
// Double opt-in: the provider sends the confirmation email; nobody is subscribed until they confirm.
// Unsubscribe links are added by the provider to every email. We store nothing ourselves.
//
// Environment:
//   SIGNUP_PROVIDER   "buttondown" (adapter below) or "webhook"
//   SIGNUP_API_KEY    provider API key (secret)
//   SIGNUP_WEBHOOK    for "webhook": URL that accepts {email} and performs double opt-in
// VERIFY each adapter against the provider's current API documentation before enabling (docs/email-signup.md).

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

const adapters = {
  async buttondown(email, env) {
    return fetch("https://api.buttondown.com/v1/subscribers", {
      method: "POST",
      headers: { Authorization: `Token ${env.SIGNUP_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email_address: email, type: "unactivated" }),
    });
  },
  async webhook(email, env) {
    return fetch(env.SIGNUP_WEBHOOK, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.SIGNUP_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, double_opt_in: true }),
    });
  },
};

function reply(request, status, message) {
  const wantsJson = (request.headers.get("accept") || "").includes("application/json");
  const headers = { "cache-control": "no-store", "x-robots-tag": "noindex" };
  if (wantsJson) return new Response(JSON.stringify({ ok: status < 300, message }), { status, headers: { ...headers, "content-type": "application/json" } });
  const html = `<!DOCTYPE html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Email updates</title><link rel="stylesheet" href="/assets/css/site.css"><main class="section"><div class="container prose"><h1>Email updates</h1><p>${message}</p><p><a href="/newsroom.html#signup">Back to the newsroom</a></p></div></main></html>`;
  return new Response(html, { status, headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
}

export async function onRequestPost({ request, env }) {
  const adapter = adapters[env.SIGNUP_PROVIDER];
  if (!adapter || !env.SIGNUP_API_KEY) return reply(request, 503, "Email sign-up is not available at the moment. Nothing was saved.");
  let email = "", trap = "";
  try {
    const form = await request.formData();
    email = String(form.get("email") || "").trim();
    trap = String(form.get("website") || "");
  } catch {
    return reply(request, 400, "We could not read the form. Please try again.");
  }
  if (trap) return reply(request, 200, "Thank you. Please check your inbox to confirm your email address.");
  if (!EMAIL.test(email)) return reply(request, 400, "Please enter a valid email address.");
  let res;
  try {
    res = await adapter(email, env);
  } catch {
    return reply(request, 502, "We could not sign you up just now. Nothing was saved. Please try again later.");
  }
  if (res.ok) return reply(request, 200, "Thank you. Please check your inbox and confirm your email address. You will not receive updates until you confirm.");
  if (res.status === 400 || res.status === 409 || res.status === 422) {
    return reply(request, 400, "We could not sign up that address. It may already be subscribed, or the provider may not accept it. If you already receive updates, there is nothing more to do.");
  }
  return reply(request, 502, "We could not sign you up just now. Nothing was saved. Please try again later.");
}

export async function onRequest({ request }) {
  return reply(request, 405, "Please use the sign-up form.");
}
