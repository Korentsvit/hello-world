// Serve a built Cloudflare Pages project with Cloudflare's own runtime (`wrangler pages dev`, workerd).
// The project is served from inside its folder, as docs/deployment.md requires for deployment:
// Cloudflare Pages only runs functions/ from the directory wrangler is run in.
//   const srv = await serve("../public"); ... fetch(srv.base + "/study") ... srv.stop();
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const tools = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const freePort = () => new Promise((r) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });

export async function serve(dir, bindings = []) {
  const port = await freePort();
  const bin = path.join(tools, "node_modules/.bin/wrangler");
  const extra = bindings.flatMap((b) => ["--binding", b]);
  const proc = spawn(bin, ["pages", "dev", ".", "--port", String(port), "--ip", "127.0.0.1", "--compatibility-date", "2025-01-01", "--log-level", "error", ...extra],
    { cwd: path.resolve(dir), env: { ...process.env, WRANGLER_SEND_METRICS: "false", CI: "1", NO_COLOR: "1" }, stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  proc.stdout.on("data", (d) => (log += d));
  proc.stderr.on("data", (d) => (log += d));
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 120; i++) {
    try {
      await fetch(base + "/", { redirect: "manual" });
      return { base, proc, log: () => log, stop: () => proc.kill() };
    } catch { await new Promise((r) => setTimeout(r, 500)); }
  }
  proc.kill();
  throw new Error(`wrangler did not start for ${dir}:\n${log}`);
}

// Follow redirects one hop at a time; returns { chain: [{url, status, location}], final, body, loop }.
export async function walk(base, p, init = {}) {
  const chain = [];
  let url = new URL(p, base).href;
  for (let i = 0; i < 6; i++) {
    const r = await fetch(url, { redirect: "manual", ...init });
    const loc = r.headers.get("location");
    chain.push({ url: url.replace(base, ""), status: r.status, location: loc });
    if (![301, 302, 307, 308].includes(r.status) || !loc) return { chain, final: r, body: await r.text() };
    url = new URL(loc, url).href;
  }
  return { chain, final: null, body: "", loop: true };
}
