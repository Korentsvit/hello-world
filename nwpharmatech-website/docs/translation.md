# Translation architecture (English first)

- Interface strings and navigation are in `content/ui/<locale>.json`. `python3 build.py --locale xx` builds with `ui/xx.json`. A production build refuses any locale other than English until this policy is met.
- Page content (`src/pages`) and structured content (`content/*.json`) are English. For a new language:
  1. Create `content/ui/<locale>.json`, a locale page tree (for example `src/pages-<locale>/`), and locale copies of the text fields in the content files. Keep IDs, sources and verification fields shared.
  2. Output to `public/<locale>/` and add `hreflang` links.
- **Clinical content must be translated by a qualified human translator, then reviewed by a clinician fluent in the language, then back-checked against the English source.** Machine-only translations of clinical content must not be published.
- Crisis numbers and service routes are region-specific. Do not translate them; replace them with verified local equivalents.
