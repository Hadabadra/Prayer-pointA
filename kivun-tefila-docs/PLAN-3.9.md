# כיוון תפילה 3.9.0 — מפה משותפת 3.x, promo, אוצריא 0.9.98.3 (05.11.2026)

## היכן אוחזים
- [x] 0. בדיקת גישה (04.11): כתיבה ל-Prayer-pointA ✓ (push ענף access-check-2026-11-04 הצליח), קריאה ל-Mikvaot ✓, הפעלת workflow ב-madaei-hatanach ✓ (בדיקת dispatch עם ref לא קיים החזירה 422 ולא 403).
  - מחיקת ענף הבדיקה **נחסמה** בשרת המתווך של הסשן (push --delete ו-DELETE ב-API נדחו). יש למחוק ידנית: `access-check-2026-11-04` ב-Hadabadra/Prayer-pointA.
- [x] 1. מפה משותפת 3.1.0: v39.js — כפתור "מפה מאוחדת" (#ktUniBtn ליד "שכבות") → MapUI.mount במסך מלא, jerusalem:true, me=pos; סגירת המסך המלא סוגרת. world-basemap.js נטען רק בפתיחה. רחובות: STREET_CITIES/STREETS (Proxy) ממופים ל-EMB/st-NN.js. נבדק ב-Chrome ללא ממשק: אין שגיאות, רחובות + בתי כנסת + קו ירושלים.
- [x] 2. promo 1.4.0 + crash-report הועתקו (sync-shared.sh מעתיק עכשיו גם world-basemap.js); dlcountry.js לא שונה.
- [x] 3. 0.9.98.3: searchFieldActions — kivun-from-field (visibleWhen:nonEmptyText, עיר→בחירת עיר, אחרת חיפוש רחוב) ו-kivun-books-filter (providerBooksFilter); plugin.setRestoreState (mapMode + מפה מאוחדת פתוחה); הרשאה search.field_actions; minAppVersion 0.9.98.3. לא נכנס: newTab (0.9.99), persist/switch (אין לתוסף searchDialogItems).
- [x] 4. "מה חדש" 3.9.0 ב-index.html וב-README.
- [x] 5. kivun-tefila-3.9.0.otzplugin נארז ב-uv Python 3.12 (zlib רגיל), זהה לאריזת pack.py; ה-CI יוצר את kivun-tefila-v3.9.0; חנות דרך kivun-tefila-store.yml.

- [x] 6. שוחרר ובחנות (05.11): Release kivun-tefila-v3.9.0; kivun-tefila-store.yml (הרצה 41989388227) — "העדכון פורסם בחנות בגרסה 3.9.0" (3.8.1 ← 3.9.0).
  - בדיקת ה-CI שונתה (באישור המפתחת) מהשוואת בייטים להשוואת תוכן (שם קובץ + CRC + גודל): ה-zlib של ה-runner השתנה ואף 3.8.1 נכשל.

## פתוח
- מחיקה ידנית של הענף access-check-2026-11-04.
- PLAN-3.0 שלב 8: החלפת המנוע הישן במפה המאוחדת — רק אחרי בדיקה באוצריא (Prayer-pointA#23).

## החלטות
- **גרסת המפה:** במקור המשותף כבר יש 3.1.0 (תיקוני 3.0: ניתוק מאזינים כפולים, סרגל עט). נכנסת 3.1.0 — אותה מפה מאוחדת של 3.0 עם תיקונים.
- **גרסת promo:** במקור כבר 1.4.0 (מכילה את כל 1.2.0 + זיהוי מותקן גם כשהגשר כבוי). נכנסת 1.4.0.
- **שילוב המפה (לפי PLAN-3.0):** כפתור "מפה מאוחדת" שפותח את MapUI במסך מלא עם `jerusalem:true` ומיקום המשתמש. **שום מפה, כפתור או מצב קיים של כיוון תפילה לא הוסר.**
- 130 אזורי הרחובות המובנים של כיוון תפילה (st-NN.js) מוזנים גם למפה המאוחדת (בלי שכפול נתונים).
