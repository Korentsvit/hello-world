/**
 * Guard: never serve Pages Functions source as static files.
 * `wrangler pages deploy` already leaves the top-level functions/ directory out of the uploaded assets, but local
 * `wrangler pages dev` (and any deploy method that copied it as assets) would serve /functions/... as plain files.
 * This catch-all route answers every /functions and /functions/* request with 404 in every mode.
 */
export function onRequest() {
  return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });
}
