// Unit tests for the sign-up function with a mocked provider. Run: node tools/test-signup.mjs
import { onRequestPost } from "../src/optional/signup/functions/api/subscribe.js";
let pass = 0, fail = 0;
const t = async (name, env, form, mock, expectStatus, expectText) => {
  globalThis.fetch = mock;
  const fd = new FormData();
  for (const [k, v] of Object.entries(form)) fd.set(k, v);
  const req = new Request("https://x/api/subscribe", { method: "POST", body: fd, headers: { accept: "application/json" } });
  const res = await onRequestPost({ request: req, env });
  const body = await res.json();
  const ok = res.status === expectStatus && body.message.includes(expectText);
  ok ? pass++ : fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  -> ${res.status} ${body.message}`);
};
const env = { SIGNUP_PROVIDER: "buttondown", SIGNUP_API_KEY: "k" };
const okMock = async (url, init) => { if (!JSON.parse(init.body).email_address) throw new Error(); return new Response("{}", { status: 201 }); };
await t("unconfigured provider refuses", {}, { email: "a@b.org" }, okMock, 503, "not available");
await t("invalid email rejected before provider call", env, { email: "not-an-email" }, async () => { throw new Error("should not call"); }, 400, "valid email");
await t("success asks for confirmation (double opt-in)", env, { email: "a@example.org" }, okMock, 200, "confirm");
await t("provider rejects (e.g. duplicate) reported truthfully", env, { email: "a@example.org" }, async () => new Response("{}", { status: 400 }), 400, "may already be subscribed");
await t("provider outage reported, nothing saved", env, { email: "a@example.org" }, async () => new Response("", { status: 500 }), 502, "Nothing was saved");
await t("network failure reported, nothing saved", env, { email: "a@example.org" }, async () => { throw new Error("down"); }, 502, "Nothing was saved");
await t("honeypot filled: no provider call", env, { email: "a@example.org", website: "spam" }, async () => { throw new Error("should not call"); }, 200, "check your inbox");
console.log(`signup tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
