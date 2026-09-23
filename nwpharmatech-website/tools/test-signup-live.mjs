// Live test of the email sign-up against the real provider, on a TEST list only. Run by an operator; required
// before `build.py --with-signup` is allowed (docs/email-signup.md).
//
//   SIGNUP_LIVE_TEST=1 SIGNUP_PROVIDER=buttondown SIGNUP_API_KEY=<test-list key> \
//   SIGNUP_TEST_EMAIL=<an address not yet on the list, whose inbox you can read> node tools/test-signup-live.mjs
//   (for SIGNUP_PROVIDER=webhook, also SIGNUP_WEBHOOK=<url>)
//
// The provider is called through the site's own function (src/optional/signup/functions/api/subscribe.js), so
// the adapter, timeout and wording under test are the ones that will be deployed. What only a person can see
// (the confirmation email, the unsubscribe link, the provider's list) is asked at the keyboard. An outage is
// simulated by sending the function's provider request to a local address that refuses, fails, redirects or never
// answers.
// content/signup-provider-test.json is written only when every case has passed; otherwise nothing is written. The
// record carries a digest over its contents (src/optional/signup/record.mjs), which the build recomputes.
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { HARNESS, CASES, recordDigest } from "../src/optional/signup/record.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FUNCTION = path.join(root, "src/optional/signup/functions/api/subscribe.js");
const RECORD = path.join(root, "content/signup-provider-test.json");
const env = process.env;

const refuse = (why) => {
  console.error(`Refused: ${why}\nNo record was written (docs/email-signup.md).`);
  process.exit(2);
};
if (env.SIGNUP_LIVE_TEST !== "1") refuse("set SIGNUP_LIVE_TEST=1 to confirm that you mean to call the real provider, on a test list.");
const missing = ["SIGNUP_PROVIDER", "SIGNUP_API_KEY", "SIGNUP_TEST_EMAIL", ...(env.SIGNUP_PROVIDER === "webhook" ? ["SIGNUP_WEBHOOK"] : [])].filter((k) => !env[k]);
if (missing.length) refuse(`environment variables not set: ${missing.join(", ")}.`);
if (!process.stdin.isTTY) refuse("the questions must be answered at the keyboard by the person running the test.");

const { onRequestPost, MESSAGES } = await import(pathToFileURL(FUNCTION).href);
const fnEnv = { SIGNUP_PROVIDER: env.SIGNUP_PROVIDER, SIGNUP_API_KEY: env.SIGNUP_API_KEY, SIGNUP_WEBHOOK: env.SIGNUP_WEBHOOK };

// Every provider request the function makes goes through here; `divert` sends it somewhere else instead.
const realFetch = globalThis.fetch;
let divert = null, calls = 0;
globalThis.fetch = (url, init) => { calls++; return realFetch(divert || url, init); };

async function submit(email, override = {}) {
  const fd = new FormData();
  fd.set("email", email);
  const request = new Request("https://staging.example/api/subscribe", { method: "POST", body: fd, headers: { accept: "application/json" } });
  const before = calls, t0 = Date.now();
  const res = await onRequestPost({ request, env: { ...fnEnv, ...override } });
  const b = await res.json();
  return { status: res.status, outcome: b.outcome, message: b.message, calls: calls - before, seconds: (Date.now() - t0) / 1000 };
}
const said = (r) => `HTTP ${r.status}, outcome ${r.outcome}, ${r.calls} provider call${r.calls === 1 ? "" : "s"}`;
const definite = (r) => r.outcome === "accepted" || r.outcome === "rejected";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q) => (await rl.question(`${q} `)).trim();
const yes = async (q) => /^y(es)?$/i.test(await ask(`${q} [y/n]`));
const cases = {};
const record = (name, pass, observed) => {
  cases[name] = { pass: Boolean(pass), observed };
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}: ${observed}`);
};

console.log(`Live sign-up test: provider "${env.SIGNUP_PROVIDER}", test address ${env.SIGNUP_TEST_EMAIL}.
This subscribes, confirms and unsubscribes the test address, and sends one address at a reserved, undeliverable
domain (example.invalid). It takes a few minutes; you will be asked to check the inbox and the provider's list.\n`);
if ((await ask("Type TEST to confirm that this key is for a test list, not the live mailing list:")) !== "TEST") refuse("not confirmed as a test list.");
const list = await ask("Name of the test list or newsletter:");
const testedBy = await ask("Your name (recorded as tested_by):");
if (!list || !testedBy) refuse("the list name and your name are both recorded and are required.");
const addr = env.SIGNUP_TEST_EMAIL;

// 1. Invalid addresses: one refused by the function before any provider call, one the provider must decide.
const bad = await submit("not-an-address");
if (bad.outcome === "unavailable") refuse("the function reports sign-up as not configured: check SIGNUP_PROVIDER, SIGNUP_API_KEY and SIGNUP_WEBHOOK.");
const junk = `nwpt-signup-test-${Date.now()}@example.invalid`;
const junkR = await submit(junk);
record("invalid_address", bad.status === 400 && bad.outcome === "invalid" && bad.calls === 0 && definite(junkR),
  `not-an-address: ${said(bad)}; ${junk}: ${said(junkR)}`);

// 2. A new address: accepted, and the person is asked to confirm.
const fresh = await submit(addr);
record("new_address", fresh.status === 200 && fresh.outcome === "accepted" && fresh.calls === 1 && fresh.message === MESSAGES.accepted, said(fresh));

// 3. The confirmation email (double opt-in).
if (cases.new_address.pass) {
  console.log(`\nCheck the inbox for ${addr}, including its spam folder.`);
  const arrived = await yes("Did a confirmation email arrive?");
  const confirmed = arrived && await yes("Follow the link in it. Did the provider confirm the address?");
  record("confirmation_email", confirmed, `operator: email ${arrived ? "arrived" : "did not arrive"}${arrived ? `; its link ${confirmed ? "confirmed" : "did not confirm"} the address` : ""}`);
} else {
  record("confirmation_email", false, "not tested: new_address did not pass");
}

// 4. The same address again, now confirmed. The accepted message ("You will not receive updates until you confirm")
//    is false for a confirmed subscriber, so only the rejection ("It may already be subscribed ... If you already
//    receive updates, there is nothing more to do") can pass, and only if the provider's list is unchanged.
const again = await submit(addr);
console.log(`\nThe same address again, now confirmed. The site answered HTTP ${again.status}: "${again.message}"`);
let repeatOk = false, repeatSeen;
if (again.outcome === "rejected") {
  const unchanged = await yes("Check the provider's list: is the address there exactly once, and still confirmed (not reset to unconfirmed)?");
  const truthful = unchanged && await yes("Read the site's answer above as that subscriber would. Is everything it says true for them?");
  repeatOk = truthful;
  repeatSeen = `operator: ${!unchanged ? "the list changed (not listed once, or no longer confirmed)" : `address listed once and still confirmed; the message is ${truthful ? "true" : "not true"} for a confirmed subscriber`}`;
} else if (again.outcome === "accepted") {
  repeatSeen = "the site told a confirmed subscriber to confirm again, which is false (the provider must answer 400, 409 or 422 for an address already on the list)";
} else {
  repeatSeen = "not the rejection message, the only answer that is true for a confirmed subscriber";
}
record("repeat_address", repeatOk, `${said(again)}; ${repeatSeen}`);

// 5. Unsubscribe.
console.log(`\nSend an email to the test list from the provider (a test send is enough), open it at ${addr} and follow its unsubscribe link.`);
const unsubscribed = await yes("Did the link work, and does the provider now show the address as unsubscribed?");
record("unsubscribe", unsubscribed, `operator: ${unsubscribed ? "the unsubscribe link worked and the provider shows the address as unsubscribed" : "did not work"}`);
rl.close();

// 6. Provider outage, simulated: the same function and adapter, with the request sent to a closed port, a server
//    answering 503, a server that redirects (to an address that would accept) and a server that never answers;
//    then the real provider with a wrong key.
let followed = 0;
const local = http.createServer((req, res) => {
  if (req.url === "/down") { res.writeHead(503); res.end("Service unavailable"); }
  if (req.url === "/redirect") { res.writeHead(307, { location: "/moved" }); res.end(); }
  if (req.url === "/moved") { followed++; res.writeHead(200, { "content-type": "application/json" }); res.end('{"accepted":true,"id":"moved"}'); }
  // "/hang": never answers
});
await new Promise((r) => local.listen(0, "127.0.0.1", r));
const closed = await new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const outage = [], at = `http://127.0.0.1:${local.address().port}`;
for (const [name, url, status] of [["connection refused", `http://127.0.0.1:${closed}/`, 502], ["provider 503", `${at}/down`, 502], ["redirect", `${at}/redirect`, 502], ["no answer", `${at}/hang`, 504]]) {
  divert = url;
  const r = await submit(addr);
  divert = null;
  outage.push([r.status === status && r.outcome === "unconfirmed" && r.message === MESSAGES.unconfirmed && !followed,
    `${name}: ${r.status} ${r.outcome}${name === "redirect" ? `, ${followed ? "followed" : "not followed"}` : ""}${name === "no answer" ? ` after ${r.seconds.toFixed(1)} s` : ""}`]);
}
local.closeAllConnections();
local.close();
const wrongKey = await submit(addr, { SIGNUP_API_KEY: "nwpt-invalid-key-for-test" });
outage.push([wrongKey.outcome !== "accepted", `wrong key (real provider): ${wrongKey.status} ${wrongKey.outcome}`]);
record("provider_outage", outage.every(([ok]) => ok), outage.map(([, text]) => text).join("; "));

if (!CASES.every((c) => cases[c]?.pass === true)) {
  console.log("\nNot every case passed. content/signup-provider-test.json was not written, so --with-signup stays refused.");
  process.exit(1);
}
const out = { provider: env.SIGNUP_PROVIDER, list, date: new Date().toISOString().slice(0, 10), tested_by: testedBy,
  function_sha256: crypto.createHash("sha256").update(fs.readFileSync(FUNCTION)).digest("hex"), harness: HARNESS, cases };
out.digest = recordDigest(out);
fs.writeFileSync(RECORD, JSON.stringify(out, null, 2) + "\n");
console.log(`\nEvery case passed. Wrote ${path.relative(root, RECORD)}.
Next: python3 build.py --with-signup, then node tools/test-signup.mjs --browser (docs/email-signup.md).`);
