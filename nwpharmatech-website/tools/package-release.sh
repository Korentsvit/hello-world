#!/bin/sh
# Package the committed tree for review, in three ZIPs of under 25 MB each:
#   <label>-source-<sha>.zip       source, content, tools, docs and module package (screenshots left out)
#   <label>-deployable-<sha>.zip   public/ (Cloudflare Pages output) and restricted/ (separate project)
#   <label>-screenshots-<sha>.zip  docs/qa/screenshots as JPEG
# Usage: tools/package-release.sh <label> <output-dir>
set -e
LABEL="$1"; OUT="$(cd "$2" && pwd)"
REPO=$(git rev-parse --show-toplevel)
C=$(git rev-parse HEAD); S=$(git rev-parse --short HEAD)
TMP=$(mktemp -d)
git -C "$REPO" archive --format=tar --prefix=nwpharmatech-website/ HEAD:nwpharmatech-website | tar -x -C "$TMP"
W="$TMP/nwpharmatech-website"
note() { printf "Commit: %s\nPackage: %s (%s)\nPackaged: %s\nNot deployed. www.nwpharmatech.org unchanged. GitHub: not pushed.\n" "$C" "$LABEL" "$1" "$(date -u +%FT%TZ)"; }
note source > "$W/COMMIT.txt"
mkdir -p "$TMP/shots/screenshots"
node -e '
const sharp = require(process.argv[1] + "/node_modules/sharp"), fs = require("fs"), path = require("path");
const [src, dst] = process.argv.slice(2);
(async () => { for (const f of fs.readdirSync(src).filter((f) => f.endsWith(".png"))) {
  await sharp(path.join(src, f)).jpeg({ quality: 70 }).toFile(path.join(dst, f.replace(/\.png$/, ".jpg"))); } })();
' "$REPO/nwpharmatech-website/tools" "$W/docs/qa/screenshots" "$TMP/shots/screenshots"
rm -rf "$W/docs/qa/screenshots"
(cd "$TMP" && zip -qr "$OUT/$LABEL-source-$S.zip" nwpharmatech-website)
mkdir -p "$TMP/deploy/nwpharmatech-deployable"
cp -R "$W/public" "$TMP/deploy/nwpharmatech-deployable/public"
cp -R "$W/restricted" "$TMP/deploy/nwpharmatech-deployable/restricted"
note deployable > "$TMP/deploy/nwpharmatech-deployable/COMMIT.txt"
cat > "$TMP/deploy/nwpharmatech-deployable/README.txt" <<'EOF'
public/      Deploy to a Cloudflare Pages project of its own (for a preview, not the production project):
             npx wrangler pages deploy public --project-name <preview-project> --branch preview
             The staging build carries noindex and a staging banner on every page.
restricted/  A separate Pages project behind Cloudflare Access (see docs/deployment.md in the source ZIP).
             Never deploy it into the public project.
EOF
(cd "$TMP/deploy" && zip -qr "$OUT/$LABEL-deployable-$S.zip" nwpharmatech-deployable)
note screenshots > "$TMP/shots/COMMIT.txt"
(cd "$TMP/shots" && zip -qr "$OUT/$LABEL-screenshots-$S.zip" screenshots COMMIT.txt)
rm -rf "$TMP"
for f in source deployable screenshots; do
  z="$OUT/$LABEL-$f-$S.zip"; b=$(wc -c < "$z")
  [ "$b" -lt 26214400 ] || { echo "$z is $b bytes, over 25 MB" >&2; exit 1; }
  echo "$z $(( b / 1024 )) KB"
done
