#!/bin/sh
# Package the exact committed tree (git archive) plus COMMIT.txt into a zip.
# Usage: tools/package.sh <label> <output-dir>
set -e
LABEL="$1"; OUT="$2"
REPO=$(git rev-parse --show-toplevel)
C=$(git rev-parse HEAD); S=$(git rev-parse --short HEAD)
TMP=$(mktemp -d)
git -C "$REPO" archive --format=tar --prefix=nwpharmatech-website/ HEAD:nwpharmatech-website | tar -x -C "$TMP"
printf "Commit: %s\nIncrement: %s\nPackaged: %s\nContents: exact tree of the commit (git archive) plus this file.\nGitHub: not pushed (no repository access from the build session).\n" "$C" "$LABEL" "$(date -u +%FT%TZ)" > "$TMP/nwpharmatech-website/COMMIT.txt"
(cd "$TMP" && zip -qr "$OUT/nwpharmatech-website-$LABEL-$S.zip" nwpharmatech-website)
rm -rf "$TMP"
echo "$OUT/nwpharmatech-website-$LABEL-$S.zip"
