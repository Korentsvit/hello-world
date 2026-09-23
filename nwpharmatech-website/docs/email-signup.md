# Email sign-up (optional; absent from the public build by default)

- **Build:** `python3 build.py --with-signup`. This adds the newsroom form and copies `src/optional/signup/functions/` into `public/functions/`. Deploy from inside `public/` so Cloudflare Pages finds `functions/`.
- **Double opt-in:** the provider sends a confirmation email, and nobody is subscribed until they confirm. The provider adds an unsubscribe link to every email. The site stores no addresses.
- **Environment variables** (Cloudflare Pages secrets):
  - `SIGNUP_PROVIDER` = `buttondown` or `webhook`
  - `SIGNUP_API_KEY`
  - `SIGNUP_WEBHOOK` (for `webhook` only)
- **Truthful responses:**
  - 503 when not configured;
  - 400 for an invalid address;
  - 400 when the provider rejects the address ("may already be subscribed");
  - 502 on a provider outage or network failure ("Nothing was saved");
  - 200 only after the provider accepts the request, telling the person to confirm.
  - A hidden field catches bots without calling the provider.
- **Tests:** `node tools/test-signup.mjs` (7 cases, mocked provider). **Before enabling:**
  1. Check the adapter against the provider's current API documentation. The Buttondown request shape has not been checked against live documentation.
  2. Run a real end-to-end test on staging: confirmation email, confirm, unsubscribe, duplicate, invalid address and provider-down cases.
  3. Update the privacy notice with the provider as processor.
  4. Only then build production with `--with-signup`.
