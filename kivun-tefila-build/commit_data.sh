#!/usr/bin/env bash
# שומר חלק מהתוצאות באמצע ריצה ארוכה (משימה 11): commit + push לענף כיוון-תפילה.
# שימוש: commit_data.sh <תיקייה> <תיאור>   — רק ב-CI (GITHUB_ACTIONS=true).
set -u
dir="$1"; what="${2:-נתונים}"
[ "${GITHUB_ACTIONS:-}" = "true" ] || exit 0
git config user.name "Claude"; git config user.email "noreply@anthropic.com"
git add "$dir"
git diff --cached --quiet && exit 0
n="$(ls "$dir"/*.json 2>/dev/null | grep -v index.json | wc -l)"
git commit -q -m "כיוון תפילה: עדכון $what ($n קבצים) [skip ci]"
for i in 1 2 3; do
  git pull -q --rebase origin 'כיוון-תפילה' && git push -q origin HEAD:'כיוון-תפילה' && exit 0
  sleep 10
done
echo "שמירת ביניים נכשלה (תנסה שוב בשמירה הבאה)" >&2
exit 0
