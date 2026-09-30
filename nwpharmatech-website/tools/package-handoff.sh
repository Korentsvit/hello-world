#!/bin/sh
# Package the module handoff for the live-site team from the committed tree: integration/, the handoff documents,
# the module screenshots and the test results. No staging site, navigation or restricted material.
# Usage: tools/package-handoff.sh <output-dir>
set -e
OUT="$1"
REPO=$(git rev-parse --show-toplevel)
C=$(git rev-parse HEAD); S=$(git rev-parse --short HEAD)
TMP=$(mktemp -d); SRC="$TMP/src"; DST="$TMP/nwpt-modules-handoff"
mkdir -p "$SRC" "$DST/docs" "$DST/screenshots"
git -C "$REPO" archive --format=tar HEAD:nwpharmatech-website | tar -x -C "$SRC"
cp -R "$SRC/integration" "$DST/integration"
for f in integration.md leadership-reconciliation.md changelog-handoff.md test-results.md; do cp "$SRC/docs/$f" "$DST/docs/"; done
cp "$SRC"/docs/qa/screenshots/module-*.png "$DST/screenshots/"
cp "$SRC/docs/qa/integration-report.json" "$DST/docs/"
printf "Commit: %s\nPackage: module handoff for the live-site team\nPackaged: %s\nContents: integration/ and handoff documents from the commit above.\nNot deployed. GitHub: not pushed (awaiting repository access).\n" "$C" "$(date -u +%FT%TZ)" > "$DST/COMMIT.txt"
(cd "$TMP" && zip -qr "$OUT/nwpt-modules-handoff-$S.zip" nwpt-modules-handoff)
rm -rf "$TMP"
echo "$OUT/nwpt-modules-handoff-$S.zip"
