// Cloudflare Pages advanced-mode worker guarding the restricted staging project (defence in depth).
// Primary control: a Cloudflare Access application covering every hostname of this project (custom domain,
// <project>.pages.dev and preview deployments). This worker additionally verifies the Access JWT on every
// request and FAILS CLOSED: if ACCESS_TEAM_DOMAIN or ACCESS_AUD is not configured, or the token is
// missing or invalid, nothing is served.
// It is a _worker.js in the output folder, not a functions/ directory, because Cloudflare Pages uses a
// _worker.js wherever the deploy is run from; a functions/ directory is silently skipped when the deploy is
// run from another folder (see docs/deployment.md). _worker.js itself is never served as a file.
//   ACCESS_TEAM_DOMAIN  e.g. "nwpharmatech.cloudflareaccess.com"
//   ACCESS_AUD          the Application Audience (AUD) tag of the Access application; several tags may be given,
//                       separated by commas (for example one per Access application if hostnames are split)
const CERT_TTL_MS = 3600_000;      // cached keys are reused for an hour
const MIN_REFETCH_MS = 60_000;     // an unknown key id triggers at most one refetch a minute (key rotation)
let certCache = { keys: null, fetchedAt: 0 };

class Malformed extends Error {}

function b64urlToBytes(s) {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new Malformed("base64url");
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  let bin;
  try { bin = atob(s + pad); } catch { throw new Malformed("base64url"); }
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function parse(token) {
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((x) => !x)) throw new Malformed("parts");
  try {
    const [header, payload] = parts.slice(0, 2).map((x) => JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(b64urlToBytes(x))));
    if (!header || typeof header !== "object" || !payload || typeof payload !== "object") throw new Malformed("json");
    return { h: parts[0], p: parts[1], sig: b64urlToBytes(parts[2]), header, payload };
  } catch (e) {
    throw e instanceof Malformed ? e : new Malformed("json");
  }
}

// Throws (-> 503) only when the certificate endpoint cannot be reached and no usable keys are cached.
async function getKeys(team, { refresh = false } = {}) {
  const age = Date.now() - certCache.fetchedAt;
  if (certCache.keys && age < CERT_TTL_MS && !(refresh && age >= MIN_REFETCH_MS)) return certCache.keys;
  const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error("certs");
  const keys = (await res.json()).keys;
  if (!Array.isArray(keys)) throw new Error("certs");
  certCache = { keys, fetchedAt: Date.now() };
  return keys;
}

async function verify(token, env) {
  let t;
  try { t = parse(token); } catch { return false; }          // malformed: 403, not 503
  if (t.header.alg !== "RS256" || typeof t.header.kid !== "string") return false;
  let jwk = (await getKeys(env.ACCESS_TEAM_DOMAIN)).find((k) => k.kid === t.header.kid);
  if (!jwk) jwk = (await getKeys(env.ACCESS_TEAM_DOMAIN, { refresh: true })).find((k) => k.kid === t.header.kid);
  if (!jwk) return false;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, t.sig, new TextEncoder().encode(`${t.h}.${t.p}`));
  const now = Math.floor(Date.now() / 1000);
  const allowed = String(env.ACCESS_AUD).split(",").map((x) => x.trim()).filter(Boolean);
  const aud = Array.isArray(t.payload.aud) ? t.payload.aud : [t.payload.aud];
  return ok && typeof t.payload.exp === "number" && t.payload.exp > now && !(t.payload.nbf > now + 60)
    && aud.some((a) => allowed.includes(a)) && t.payload.iss === `https://${env.ACCESS_TEAM_DOMAIN}`;
}

const deny = (status, msg) => new Response(msg, {
  status,
  headers: { "content-type": "text/plain", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
});

// assets(request) serves the static file (env.ASSETS in Cloudflare Pages; a stub in tools/test-access.mjs).
async function handle(request, env, assets) {
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
  const res = await assets(request);
  const out = new Response(res.body, res);
  out.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  out.headers.set("cache-control", "private, no-store");
  out.headers.set("x-nwpt-guard", "verified");   // lets reviewers confirm the guard is deployed (docs/deployment.md)
  return out;
}

export default {
  fetch: (request, env) => handle(request, env, (r) => env.ASSETS.fetch(r)),
};
