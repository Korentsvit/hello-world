/**
 * Shared helpers for the preview-only financing and programme-updates lanes.
 * Research-collaboration /api/enquiry keeps its own handler; it uses isProductionHost from here
 * so www cannot be switched on by copying environment variables.
 *
 * Activation hold (this candidate):
 *   - Host www.nwpharmatech.org or nwpharmatech.org always fails closed.
 *   - Any other host fails closed unless NWPT_CONVERSION_MODE is exactly "preview"
 *     and every required setting for that lane is present.
 * Removing either hold is a separate change after Filipp reviews a preview. Do not do it here.
 */

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};

export const str = (v) => (typeof v === "string" ? v.trim() : "");
export const oneLine = (s) => String(s).replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export function isProductionHost(request) {
  if (!request || !request.headers || typeof request.headers.get !== "function") return false;
  const raw = [request.headers.get("host"), request.headers.get("x-forwarded-host")].filter(Boolean).join(",");
  return raw.split(",").some((part) => {
    const host = part.trim().toLowerCase().replace(/:\d+$/, "");
    return host === "www.nwpharmatech.org" || host === "nwpharmatech.org";
  });
}

export function emailOk(email) {
  return !!email && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sha256hex(text) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function b64url(bytes) {
  const bin = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function b64urlDecode(s) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(String(s).replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function providerSettings(env) {
  const test = str(env.ENQUIRY_TEST_MODE) === "1";
  return {
    test,
    key: str(env.RESEND_API_KEY),
    siteKey: str(env.TURNSTILE_SITE_KEY),
    secret: str(env.TURNSTILE_SECRET_KEY),
    providerUrl: (test && str(env.ENQUIRY_PROVIDER_URL)) || "https://api.resend.com/emails",
    verifyUrl: (test && str(env.TURNSTILE_VERIFY_URL)) || "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    contactsUrl: ((test && str(env.UPDATES_CONTACTS_URL)) || "https://api.resend.com").replace(/\/$/, ""),
  };
}

/** Preview gate. `ready` is the lane's own secret check, already boolean. */
export function previewOpen(request, env, ready) {
  if (isProductionHost(request)) return false;
  if (str(env.NWPT_CONVERSION_MODE) !== "preview") return false;
  return !!ready;
}

export function statusBody(open, siteKey, version, lane, testMode) {
  return {
    configured: open,
    turnstileSiteKey: open ? siteKey : null,
    version,
    lane,
    testMode: open ? !!testMode : false,
    activation: open ? "preview" : "held",
  };
}

export async function verifyTurnstile(s, request, token, idem) {
  const body = new URLSearchParams({ secret: s.secret, response: token });
  if (idem) body.set("idempotency_key", idem);
  const ip = str(request.headers.get("CF-Connecting-IP"));
  if (ip) body.set("remoteip", ip);
  let verified;
  try {
    const r = await fetch(s.verifyUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    verified = await r.json();
  } catch {
    return { ok: false, status: 502, error: "The security check is temporarily unavailable. Please try again. Nothing has been sent." };
  }
  if (!verified || verified.success !== true) {
    return { ok: false, status: 400, error: "The security check could not be verified. Please complete it again. Nothing has been sent." };
  }
  return { ok: true };
}

export async function sendEmail(s, payload, idempotencyKey) {
  let res;
  try {
    res = await fetch(s.providerUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${s.key}`,
        "content-type": "application/json",
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, status: 502, id: "" };
  }
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  const id = data && typeof data.id === "string" ? data.id : "";
  return { ok: res.ok && !!id, status: res.status, id };
}

export async function signToken(secret, payload) {
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  return `${body}.${b64url(sig)}`;
}

export async function readToken(secret, token, purpose) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(parts[0])));
  let actual;
  try { actual = b64urlDecode(parts[1]); } catch { return null; }
  if (actual.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= actual[i] ^ expected[i];
  if (diff !== 0) return null;
  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0]))); } catch { return null; }
  if (!payload || payload.p !== purpose || !emailOk(payload.e)) return null;
  if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
  return payload;
}

export function htmlPage({ title, heading, paragraphs, actions = [], extra = "" }) {
  const body = paragraphs.map((p) => `<p>${p}</p>`).join("");
  const links = actions.map((a) => `<p><a href="${esc(a.href)}">${esc(a.label)}</a></p>`).join("");
  const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${esc(title)}</title>
  <style>
    body { margin: 0; background: #f8f8f7; color: #07111f; font: 1.05rem/1.5 "Segoe UI", system-ui, sans-serif; }
    main { max-width: 38rem; margin: 0 auto; padding: 2.5rem 1.25rem 3rem; }
    h1 { font-size: 1.6rem; line-height: 1.25; }
    a { color: #1767e8; }
    a:focus-visible, button:focus-visible { outline: 2px solid #1767e8; outline-offset: 3px; }
    button { font: inherit; padding: 0.75rem 1rem; background: #07111f; color: #fff; border: 0; border-radius: 10px; cursor: pointer; }
  </style>
</head>
<body>
  <main>
    <h1>${esc(heading)}</h1>
    ${body}
    ${extra}
    ${links}
  </main>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex",
      "referrer-policy": "no-referrer",
    },
  });
}

export function htmlError(heading, paragraph, status = 400) {
  const res = htmlPage({ title: heading, heading, paragraphs: [esc(paragraph)] });
  return new Response(res.body, { status, headers: res.headers });
}

const BANNED_KEYS = ["wallet", "walletaddress", "payment", "amount", "allocation", "txhash", "chainid", "seedphrase"];

export function bannedField(body) {
  if (!body || typeof body !== "object") return false;
  return Object.keys(body).some((k) => BANNED_KEYS.includes(k.toLowerCase()) && str(body[k]));
}

export async function readBody(request) {
  const len = Number(request.headers.get("content-length") || 0);
  if (len > 32768) return { error: json({ error: "The submission is too long. Nothing has been sent." }, 413) };
  const type = request.headers.get("content-type") || "";
  try {
    if (type.includes("application/json")) {
      const body = await request.json();
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { error: json({ error: "The submission could not be read. Nothing has been sent." }, 400) };
      }
      return { body };
    }
    if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
      const form = await request.formData();
      return { body: Object.fromEntries(form.entries()) };
    }
  } catch {
    return { error: json({ error: "The submission could not be read. Nothing has been sent." }, 400) };
  }
  return { error: json({ error: "Send the form as JSON or form data. Nothing has been sent." }, 415) };
}

export function idemOk(value) {
  return /^[A-Za-z0-9-]{16,64}$/.test(value);
}

export async function resendFetch(s, path, method, payload) {
  let res;
  try {
    res = await fetch(s.contactsUrl + path, {
      method,
      headers: {
        authorization: `Bearer ${s.key}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
  } catch {
    return { ok: false, status: 502, data: null };
  }
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  return { ok: res.ok, status: res.status, data };
}
