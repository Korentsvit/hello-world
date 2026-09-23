// Unit tests for the restricted project's Access guard (src/restricted-worker/_worker.js).
// A throwaway RSA key signs test tokens; the Access certificate endpoint is stubbed with its public key.
//   node test-access.mjs
import { webcrypto as crypto } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const worker = (await import(pathToFileURL(path.resolve(here, "../src/restricted-worker/_worker.js")).href)).default;
const TEAM = "nwpt-test.cloudflareaccess.com", AUD = "aud-test";
const env = { ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD, ASSETS: { fetch: async () => new Response("<html>page</html>", { status: 200, headers: { "content-type": "text/html" } }) } };

const b64u = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const { publicKey, privateKey } = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const jwk = { ...(await crypto.subtle.exportKey("jwk", publicKey)), kid: "k1", alg: "RS256", use: "sig" };
const other = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
let certFetches = 0;
globalThis.fetch = async (url) => {
  if (String(url) === `https://${TEAM}/cdn-cgi/access/certs`) { certFetches++; return new Response(JSON.stringify({ keys: [jwk] }), { status: 200 }); }
  throw new Error(`unexpected fetch ${url}`);
};
const now = Math.floor(Date.now() / 1000);
async function token({ header = {}, payload = {}, key = privateKey, alg = "RS256" } = {}) {
  const h = b64u(JSON.stringify({ alg, kid: "k1", typ: "JWT", ...header }));
  const p = b64u(JSON.stringify({ aud: [AUD], iss: `https://${TEAM}`, exp: now + 600, iat: now, email: "reviewer@example.org", ...payload }));
  const sig = alg === "none" ? "" : b64u(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${h}.${p}`)));
  return `${h}.${p}.${sig}`;
}
const call = (tok, init = {}, e = env) => worker.fetch(new Request("https://restricted.example/financing-structure", { ...init, headers: tok ? { "cf-access-jwt-assertion": tok } : {} }), e);

let pass = 0, fail = 0;
const check = async (name, resP, status, bodyTest) => {
  const res = await resP;
  const body = await res.text();
  const ok = res.status === status && (!bodyTest || bodyTest(body, res));
  ok ? pass++ : fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} -> ${res.status}`);
};
const noPage = (b) => !/<html/i.test(b);

await check("unconfigured: 503, nothing served", call(await token(), {}, { ASSETS: env.ASSETS }), 503, noPage);
await check("no token: 403", call(null), 403, noPage);
await check("valid token: page served, noindex and no-store headers", call(await token()), 200,
  (b, r) => /page/.test(b) && /noindex/.test(r.headers.get("x-robots-tag")) && /no-store/.test(r.headers.get("cache-control")));
await check("valid token, POST: 405 (functions inactive)", call(await token(), { method: "POST", body: "x" }), 405, noPage);
await check("wrong audience: 403", call(await token({ payload: { aud: ["someone-else"] } })), 403, noPage);
await check("expired: 403", call(await token({ payload: { exp: now - 5 } })), 403, noPage);
await check("wrong issuer: 403", call(await token({ payload: { iss: "https://evil.cloudflareaccess.com" } })), 403, noPage);
await check("alg none: 403", call(await token({ alg: "none" })), 403, noPage);
await check("signed with another key: 403", call(await token({ key: other.privateKey })), 403, noPage);
await check("unknown key id: 403", call(await token({ header: { kid: "k2" } })), 403, noPage);
const good = await token();
const [h, , sig] = good.split(".");
await check("tampered payload: 403", call(`${h}.${b64u(JSON.stringify({ aud: [AUD], iss: `https://${TEAM}`, exp: now + 600, email: "attacker@example.org" }))}.${sig}`), 403, noPage);
await check("malformed token: 403, nothing served", call("not-a-token"), 403, noPage);
console.log(`certificate fetches: ${certFetches} (cached after the first)`);
console.log(`access tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
