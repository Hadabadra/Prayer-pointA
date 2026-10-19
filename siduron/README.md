# סידורון 3.7.2 — כפתור "כיוון תפילה" ושליחת התפילה

ענף זה מכיל עדכון לתוסף **סידורון** (`com.moshenahari.siduron`) של Y-PLONI, שנעשה באישורו:
כפתור מצפן בשורת הכלים העליונה שפותח את התוסף **כיוון תפילה** (`com.shiachrina.kivuntefila`).

## הורדה
- התוסף המעודכן: [com.moshenahari.siduron-3.7.2.otzplugin](com.moshenahari.siduron-3.7.2.otzplugin)
- כל השינויים מול 3.7.0 (כולל 3.7.2): [siduron-kivun-tefila.diff](siduron-kivun-tefila.diff)
- הקבצים ששונו בלבד: תיקיית [src](src)

## מה חדש ב-3.7.2
- כש"כיוון תפילה" מבקש (`plugin.page_opened` עם `param.type = "send-prayer"`), סידורון ממתין שהתפילה תיטען ושולח אותה בחזרה.
- כל שליחה חוזרת אחרי שנייה ושלוש עם אותו `id`, כדי שלא תלך לאיבוד בזמן טעינה.
- הקוד: הפורק `e0548433917-gif/siduron_plugin`, ענף `master`.

## מה השתנה (3.7.1)
- `index.html` — כפתור `#btn-kivun` (אייקון מצפן) ליד "זמני היום".
- `js/app.js` — `openKivunTefila()` קורא ל-`plugin.openOther`; הודעת שגיאה ברורה אם התוסף אינו מותקן או שההרשאה לא אושרה. `updateKivunButton()` מסתיר את הכפתור כש-`plugin.listInstalled` מראה שכיוון תפילה אינו מותקן.
- `css/style.css` — `.tool-btn[hidden]`.
- `manifest.json` — גרסה 3.7.1, הרשאה חדשה `plugin.open_other`, `minAppVersion` 0.9.98 (נדרש: `plugin.openOther` ו-`plugin.listInstalled` קיימים מ-0.9.97).

נבדק מול טבלאות הגרסאות וההרשאות של אוצריא (ענף dev) ונבדק בפועל באוצריא.
הערה: קישור `otzaria://open/plugin/...` אינו עובד מתוך דף תוסף — לכן נעשה שימוש ב-`plugin.openOther`.
