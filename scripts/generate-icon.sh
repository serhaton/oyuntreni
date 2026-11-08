#!/bin/sh
# Renders assets/icon/app-icon.svg into the app icon and splash PNGs (macOS only:
# uses Quick Look and sips). iOS app icons must be 1024x1024 with no transparency.
#
#   npm run icon:generate
set -e
cd "$(dirname "$0")/.."
TMP=$(mktemp -d)
qlmanage -t -s 1024 -o "$TMP" assets/icon/app-icon.svg >/dev/null 2>&1
RENDER="$TMP/app-icon.svg.png"
# Flatten (drop the alpha channel) by going through JPEG, then back to PNG.
sips -s format jpeg -s formatOptions best "$RENDER" --out "$TMP/icon.jpg" >/dev/null
sips -s format png "$TMP/icon.jpg" --out assets/icon.png >/dev/null
sips -z 1024 1024 assets/icon.png >/dev/null
cp assets/icon.png assets/splash-icon.png
rm -rf "$TMP"
echo "Wrote assets/icon.png and assets/splash-icon.png"
