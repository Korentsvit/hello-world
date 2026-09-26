/**
 * Cloudflare Pages Function: POST /api/subscribe
 *
 * Deliberately fails closed until both provider credentials are present.
 * Keep BUTTONDOWN_API_KEY and TURNSTILE_SECRET_KEY in Pages environment
 * variables; never put them in the repository or client-side code.
 */

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS
  });
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function readInput(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await request.json();
    } catch {
      return null;
    }
  }

  try {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  } catch {
    return null;
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return json({ error: "Method not allowed. Use POST." }, 405);
  }

  const input = await readInput(request);
  if (!input || typeof input !== "object") {
    return json({ error: "Send the form fields as JSON or form data." }, 400);
  }

  const email = text(input.email || input.email_address).toLowerCase();
  const name = text(input.name);
  const consent = input.consent === true || ["yes", "on", "true", "1"].includes(text(input.consent).toLowerCase());
  const turnstileToken = text(input["cf-turnstile-response"] || input.turnstileToken || input.turnstile_token);

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Enter a valid email address." }, 400);
  }
  if (name.length > 100) {
    return json({ error: "Name must be 100 characters or fewer." }, 400);
  }
  if (!consent) {
    return json({ error: "Please confirm that you want to receive programme news." }, 400);
  }

  const buttondownKey = text(env.BUTTONDOWN_API_KEY);
  const turnstileSecret = text(env.TURNSTILE_SECRET_KEY);

  // Never claim success while either side of the protected integration is absent.
  if (!buttondownKey || !turnstileSecret) {
    return json({ error: "Email registration is not configured yet. Please try again later." }, 503);
  }
  if (!turnstileToken) {
    return json({ error: "Complete the security check and try again." }, 400);
  }

  const verifyBody = new URLSearchParams({
    secret: turnstileSecret,
    response: turnstileToken
  });
  const clientIp = text(request.headers.get("CF-Connecting-IP"));
  if (clientIp) verifyBody.set("remoteip", clientIp);

  let turnstileResult;
  try {
    const verifyResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: verifyBody
    });
    turnstileResult = await verifyResponse.json();
  } catch {
    return json({ error: "The security check is temporarily unavailable. Please try again." }, 502);
  }

  if (!turnstileResult || turnstileResult.success !== true) {
    return json({ error: "The security check could not be verified. Please try again." }, 400);
  }

  const subscriber = {
    email_address: email,
    // Explicitly preserve Buttondown's double-opt-in state.
    type: "unactivated"
  };
  if (name) subscriber.metadata = { name };
  if (clientIp) subscriber.ip_address = clientIp;

  // Optional: pin subscribers to a named newsletter when Pages env provides an id.
  const listId = text(env.BUTTONDOWN_LIST_ID || env.BUTTONDOWN_NEWSLETTER_ID);
  if (listId) {
    subscriber.metadata = Object.assign({}, subscriber.metadata || {}, { list_id: listId });
  }

  let buttondownResponse;
  try {
    buttondownResponse = await fetch("https://api.buttondown.com/v1/subscribers", {
      method: "POST",
      headers: {
        "authorization": `Token ${buttondownKey}`,
        "content-type": "application/json",
        "x-buttondown-collision-behavior": "add"
      },
      body: JSON.stringify(subscriber)
    });
  } catch {
    return json({ error: "The email service is temporarily unavailable. Please try again." }, 502);
  }

  if (!buttondownResponse.ok) {
    if (buttondownResponse.status === 429) {
      return json({ error: "The email service is busy. Please try again later." }, 503);
    }
    if (buttondownResponse.status >= 400 && buttondownResponse.status < 500) {
      return json({ error: "This email could not be registered. Check the address or try again later." }, 400);
    }
    return json({ error: "The email service could not accept the registration. Please try again." }, 502);
  }

  return json({
    ok: true,
    message: "Check your inbox to confirm your subscription to programme news."
  }, 202);
}
