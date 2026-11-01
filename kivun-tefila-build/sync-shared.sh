#!/usr/bin/env bash
# מפה משותפת 2.0 (Prayer-pointA#11): מעתיק את map-core.js ו-map-ui.js מהמקור היחיד, Hadabadra/Mikvaot/shared/map-core.
# כיוון תפילה משתמש מהם בתפריט השכבות (MapUI.layersButton, v36.js). מריצים לפני אריזה, ואז אורזים מחדש.
set -e
cd "$(dirname "$0")/.."
RAW="https://raw.githubusercontent.com/Hadabadra/Mikvaot/main/shared/map-core"
for f in map-core.js map-ui.js; do curl -fsSL "$RAW/$f" -o "kivun-tefila/$f.tmp" && mv "kivun-tefila/$f.tmp" "kivun-tefila/$f"; done
echo "סונכרן: map-core.js map-ui.js → kivun-tefila/"
