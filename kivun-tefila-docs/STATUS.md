# כיוון תפילה — מצב (STATUS)

**מושהה עד ~מאי 2027.** גרסה יציבה: **4.0.1** (10.11.2026, `stability: stable`), Release `kivun-tefila-v4.0.1`.

- ענף: `כיוון-תפילה` ב-Hadabadra/Prayer-pointA. קוד: `kivun-tefila/`, בנייה: `kivun-tefila-build/` (`pack.py`), תיעוד: `kivun-tefila-docs/`.
- שחרור: דחיפה לענף עם גרסה חדשה ב-manifest וקובץ `kivun-tefila-<v>.otzplugin` תואם (CI בודק שם+CRC) → `kivun-release.yml` יוצר Release.
- חנות: `kivun-tefila-store.yml` ב-Hadabadra/madaei-hatanach (רץ כל 3 שעות, אפשר dispatch ידני).
- "מה חדש" בתוך התוסף: `index.html` (פרק "מה חדש"); היסטוריה: `CHANGELOG.md` בשורש הענף ו-README.

## issues
0 פתוחים. מה שנדחה — `kivun-tefila-docs/ROADMAP.md`.

## הנושאים הפתוחים
1. מפה אחת משותפת לכל התוספים (#23, #29) — ROADMAP.
2. מסך פנים המטוס בטיסה (#25) — ROADMAP.
3. נתוני מפות ממקורות חיצוניים בישראל (#41) — ממתין לאישור ורישיון.
4. `crash-report.js` 1.1.0 להעתיק למקור המשותף ב-Mikvaot.

## לקח (4.0.1)
אוצריא דוחה בהתקנה `searchDialogItems` שיש בו `resultsAction` בלי `openPluginOnSubmit: true` ("resultsAction requires openPluginOnSubmit"), למרות שהתיעוד לא מציין זאת. לבדוק כל שינוי ב-manifest בהתקנה אמיתית לפני שחרור.
