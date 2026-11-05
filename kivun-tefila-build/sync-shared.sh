#!/usr/bin/env bash
# מעתיק מהמקור היחיד Hadabadra/Mikvaot/shared: המפה (map-core.js, map-ui.js), דיווח תקלות (crash-report.js) והמלצה (promo).
# מריצים לפני אריזה, ואז אורזים מחדש.
set -e
cd "$(dirname "$0")/.."
RAW="https://raw.githubusercontent.com/Hadabadra/Mikvaot/main/shared"
get() { mkdir -p "$(dirname "kivun-tefila/$2")"; curl -fsSL "$RAW/$1" -o "kivun-tefila/$2.tmp" && mv "kivun-tefila/$2.tmp" "kivun-tefila/$2"; }
get map-core/map-core.js map-core.js; get map-core/map-ui.js map-ui.js; get basemap/world-basemap.js world-basemap.js
get report/crash-report.js shared/report/crash-report.js
get promo/achat-promo.js shared/promo/achat-promo.js; get promo/achat-promo.css shared/promo/achat-promo.css
echo "סונכרן מ-Mikvaot/shared"
