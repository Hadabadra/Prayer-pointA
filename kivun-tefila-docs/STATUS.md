# כיוון תפילה — מצב (STATUS)

**מושהה.** גרסה יציבה: **4.0.1** (10.11.2026, `stability: stable`), Release `kivun-tefila-v4.0.1`.

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

## 4.1.0 — 16.11.2026 (סבב סיום 7/7)
- קריעה: kotel-full-ui.js — תוספת הב"ח (`.kvadd`), "ברוך דין אמת" (`.vsm`), מזמור עט כקישור; CSS קטן ב-index.html (`@media (max-width:40em)`).
- זכר לחורבן: kotel-full.js נבנה מחדש מהקובץ המורחב (`kivun-tefila-docs/זכר לחורבן - דור המלקטים (מורחב 16.11.2026).docx`) ב-kotel_docx.py (מצב חדש: "סימן תקס – …", נושאים "א] …"; רק שורות "שם (מקום)" — טקסט חופשי לא נכנס).
- ערכת סיום (`hb-final*.js`, whatsNew כבוי — יש כבר "מה חדש" משלו); author: Hadabadra.
- פרסום לחנות: kivun-tefila-store.yml ב-Hadabadra/madaei-hatanach (כל 3 שעות / dispatch).
