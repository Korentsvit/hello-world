// Cloudflare Pages Function guarding the restricted staging project (defence in depth).
// Primary control: a Cloudflare Access application in front of this project's hostname.
// This middleware additionally verifies the Access JWT on every request and FAILS CLOSED:
// if ACCESS_TEAM_DOMAIN or ACCESS_AUD is not configured, or the token is missing/invalid,
// nothing is served.
//   ACCESS_TEAM_DOMAIN  e.g. "nwpharmatech.cloudflareaccess.com"
//   ACCESS_AUD          the Application Audience (AUD) tag of the Access application
let certCache = { keys: null, fetchedAt: 0 };

function b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function getKeys(team) {
  if (certCache.keys && Date.now() - certCache.fetchedAt < 3600_000) return certCache.keys;
  const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error("certs");
  certCache = { keys: (await res.json()).keys, fetchedAt: Date.now() };
  return certCache.keys;
}

async function verify(token, env) {
  const [h, p, sig] = token.split(".");
  if (!h || !p || !sig) return false;
  const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
  const jwk = (await getKeys(env.ACCESS_TEAM_DOMAIN)).find((k) => k.kid === header.kid);
  if (!jwk || header.alg !== "RS256") return false;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlToBytes(sig), new TextEncoder().encode(`${h}.${p}`));
  const now = Math.floor(Date.now() / 1000);
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  return ok && payload.exp > now && aud.includes(env.ACCESS_AUD) && payload.iss === `https://${env.ACCESS_TEAM_DOMAIN}`;
}

const deny = (status, msg) => new Response(msg, {
  status,
  headers: { "content-type": "text/plain", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
});

export async function onRequest(context) {
  const { request, env, next } = context;
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return deny(503, "Restricted area not configured.");
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) return deny(403, "Access denied.");
  try {
    if (!(await verify(token, env))) return deny(403, "Access denied.");
  } catch (e) {
    return deny(503, "Access verification unavailable.");
  }
  // Investment functions stay inactive: refuse any state-changing request.
  if (request.method !== "GET" && request.method !== "HEAD") return deny(405, "Inactive in staging.");
  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  out.headers.set("cache-control", "private, no-store");
  return out;
}
