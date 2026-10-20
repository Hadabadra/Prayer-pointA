# כיוון תפילה 3.0.1 — גרסה יציבה ואחרונה לתקופה הקרובה (20.10.2026)

הוכרזה כגרסה יציבה ואחרונה לעת עתה. כל הגרסאות 2.6–2.9.7 מתועדות ב-PLAN-2.6.md וב-PLAN-2.8.md,
ובחלונית "מה חדש" שבהגדרות התוסף.

## פרסום
- קוד: Hadabadra/Prayer-pointA, ענף `כיוון-תפילה`. Release נוצר אוטומטית (kivun-release.yml) כשקובץ
  `kivun-tefila-X.otzplugin` ארוז ב-`kivun-tefila-build/pack.py` ושמור בשורש יחד עם הקוד.
- חנות: kivun-tefila-store.yml ב-Hadabadra/madaei-hatanach (כל 3 שעות, או Actions → Run workflow).
- החנות דוחה: font-family מקודד (חובה var(--font-main)), border-radius ב-px (חו## 3.0.1 — מה תוקן מעבר ל-3.0.0
- הורדת קובצי הנהרות והכבישים נכשלה (פורום, post 44795): getJ ב-index.html לא פתח את העטיפה {success,data}
  של network.fetchStream — עכשיו כמו bridge.js.
- הביקורים בכותל לא נשמרו אחרי רענון: kvGet/kvSet ב-kotel-full-ui.js פותחים עטיפות data/value ושומרים עותק
  ב-localStorage; kotel-visits.js טוען שוב אחרי plugin.boot.
- מעבר לתוסף "עינים למקרא" (com.chadbedera.madaeihatanach) מתחת לביקורים בכותל.
- לוח השנה של אוצריא: ב-SDK יש רק calendar.get* (קריאה). אין API להוספת אירוע — נוסף הסבר; נשאר קובץ .ics.
- #stPanel / #stTxt (תיבת בית הכנסת הקרוב) נמוכים יותר. בשער: "גרסה יציבה ואחרונה לתקופה הקרובה".
- 3.0.0 נשאר כ-Release בגיטהאב; אותו מספר לא ניתן לפרסם מחדש (אוצריא מעדכנת רק למספר גבוה יותר).

## פתוח (לא דחוף)
- הסרגל העליון גולש לשורה שנייה במסך 1366: אפשר לאחד את ארבעת כפתורי ההלכה לתפריט אחד.
- Release 2.9.5 ב-GitHub נדחה בחנות (גופן) — אפשר למחוק את עמוד ההוצאה.

0 (ערים לאורך הנהר).

## הגשר "אחת שאלתי" (Hadabadra/achat-shaalti)
- 1.0.5: העדכון מהמגש בוחר את ה-Release המסומן latest ב-GitHub. 1.0.4 הציע בטעות 3.9.1 — Release ישן
  ממספור קודם. כדאי לסמן את ה-Releases הישנים (v3.x, v2.0.0, v1.5–1.7, v0.0.x) כ-Pre-release ב-GitHub;
  לסשן של Claude אין הרשאה לערוך Releases.
