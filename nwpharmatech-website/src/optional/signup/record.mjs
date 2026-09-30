// The live provider test record, content/signup-provider-test.json: written by tools/test-signup-live.mjs after
// every case has passed, and checked by buildlib/content.py (signup_provider_problem) before `build.py --with-signup`
// is allowed. Not deployed: the build copies only functions/.
//
// The digest is SHA-256 over provider, list, date, tested_by, function_sha256 and cases, serialised as compact JSON
// in a fixed order (cases sorted by name, each as [name, pass, observed]). The build recomputes it, so a record
// edited after the harness wrote it is refused. It is a checksum, not a signature: it shows that the fields have not
// changed since the digest was made, not who made it.
import crypto from "node:crypto";

export const HARNESS = "tools/test-signup-live.mjs";
export const CASES = ["invalid_address", "new_address", "confirmation_email", "repeat_address", "unsubscribe", "provider_outage"];

export const recordDigest = (r) => crypto.createHash("sha256").update(JSON.stringify([r.provider, r.list, r.date, r.tested_by, r.function_sha256,
  Object.keys(r.cases).sort().map((k) => [k, r.cases[k].pass, r.cases[k].observed])])).digest("hex");
