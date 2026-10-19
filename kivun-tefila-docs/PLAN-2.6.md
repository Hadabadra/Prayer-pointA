# תוכנית לגרסה 2.6 (נכתבה ב-19.10.2026, אחרי 2.5.4)

מסמך העברה לשיחה הבאה. המפתחת יוצאת מהפרויקט לכחצי שנה, ולכן הכול כתוב כאן, ובסוף יש פרומפט מוכן.

## מצב נוכחי
- **הריפו עבר:** `e0548433917-gif/otzaria` נקרא עכשיו **`Hadabadra/Prayer-pointA`**. גם `madaei-hatanach` עבר ל-`Hadabadra/madaei-hatanach`.
  GitHub מפנה מהכתובות הישנות, אבל בקוד, בתיעוד ובמניפסט עדיין מופיעה הכתובת הישנה (ראו משימה 0).
- **ענף:** `כיוון-תפילה`. גרסה **2.5.4**, חבילה `kivun-tefila-2.5.4.otzplugin`, ו-Release עם סידורון 3.7.2 מצורף.
- **סידורון 3.7.2:** הקוד המלא נמצא ב-`siduron/src`. החבילה נבנית ממנו ב-`pack.py` ונבדקת ב-`kivun-release.yml`.
  הפורק `e0548433917-gif/siduron_plugin` לא עודכן, כי ל-Claude אין גישה אליו.
- **החנות:** הפרסום נעשה ב-`Hadabadra/madaei-hatanach/.github/workflows/kivun-tefila-store.yml`, כל 3 שעות.
  - **נכשל מאז 16.10:** "התחברות לחנות נכשלה: session ריק". צריך לעדכן את הסודות `OTZARIA_USER` ו-`OTZARIA_PASSWORD` ב-https://github.com/Hadabadra/madaei-hatanach/settings/secrets/actions. זו פעולה של המפתחת בלבד.
  - אחרי העדכון: Actions ← "כיוון תפילה — פרסום לחנות אוצריא" ← Run workflow.
  - בדיקת הוולידטור הרשמי על 2.5.4: 0 שגיאות, 0 אזהרות, 0 הערות עיצוב.
- **כבישים:** הריצה הראשונה של `build-roads.yml` (מ-19.10, 16:52 UTC) עדיין רצה. היא דוחפת את הקבצים רק בסוף.

## משימות

| # | משימה | סטטוס |
|---|-------|-------|
| 0 | עדכון כל הקישורים לשם החדש `Hadabadra/Prayer-pointA`: `manifest.json` (allowlist ו-homepage; להשאיר גם את הכתובת הישנה ב-allowlist), `names.js` (BASE/PAGE), `globe.js` (GEOX_URL), `extras.js` (DL_URL, DATA_URL, SID_URL), `ui.js` (HOME), README, `requests/*.md`, `build_roads.py` (UA), `kivun-tefila-store.yml` ב-madaei-hatanach (`repository:`), וקישורים בשאר הריפו של המפתחת | בוצע 20.10 (בריפו הזה; הכתובת הישנה נשארה ב-allowlist) |
| 1 | תמונת הכותל (נוסה ב-20.10 בציור — לא טוב מספיק, ממתין לצילום): ההארכה ב-2.5.2 (שכפול רצועות) נדחתה ובוטלה ב-2.5.4. הבקשה: להשלים רק את האזור שבו היו אנשים, לפי צילומים אחרים של הכותל, בלי לשכפל. דורש צילום מקור חופשי (ויקישיתוף, CC) של החלק התחתון בלי אנשים, או ציור ידני של הנדבכים התחתונים | פתוח |
| 2 | מצב תפילה על רקע הכותל | בוצע ב-2.5.4 |
| 3 | דיני הכותל בתוסף: מראי מקומות, ונושאים ושיטות מ"דור המלקטים" (סימנים תק"ס ותקס"א) | בוצע ב-2.5.4. הטיוטה המקורית: `kotel-dinim-DRAFT.md`. כדאי שרב יעבור |
| 4 | **גשר "אחת שאלתי"** (ריפו `madaei-hatanach`, ענף `כלי-מערכת`): (א) מיקום מ-Windows (Windows.Devices.Geolocation / Location API), (ב) שליחת הערות ל-GitHub דרך המתווך (achat-relay) מהגשר, כשהתוסף לא מורשה לכתובת. הממשק: `network.fetchStream` ל-`localhost` עם ההרשאה `network.localhost` | בוצע 20.10 בקוד: בגשר `LocationApi.cs` + `PdfApi.cs` (ריפו e0548433917-gif/achat-shaalti, next; אין ל-Claude הרשאת דחיפה — נמסר כ-patch). בתוסף: `bridge.js` (מיקום ומשוב דרך הגשר, בלי גשר כמו קודם; הרשאה `network.localhost`) |
| 5 | מיקום ברשת כמו תוספי מצפן בדפדפן: בתוך אוצריא `navigator.geolocation` נדחה (לכן קיים "מיקום משוער" לפי IP). פתרון אמין: דרך הגשר (משימה 4), או בקשה מאוצריא לאשר geolocation ב-WebView (`requests/issue-geolocation.md`) | חלק ממשימה 4 |
| 6 | הדפסה: תצוגה מקדימה לפני ההדפסה (חלון תצוגה בתוך התוסף, ואחריו `ui.print`), וייצוא ל-Word (קובץ .doc כ-HTML עם `application/msword`, דרך `fs.saveUserFile` אם קיים ב-SDK) | בוצע 20.10: `printprev.js` — תצוגה מקדימה לפני הדפסה/PDF, וייצוא ל-Word (.doc) דרך `fs.beginBinaryWrite`/`fs.commitUserFileWrite` (הרשאה `fs.user_files.write`) |
| 7 | יומן "מה חדש" בהגדרות: הגרסאות 2.1.2 עד 2.4.0 היו חסרות | בוצע ב-2.5.4 |
| 8 | חיפוש בתי כנסת (OpenStreetMap: `amenity=place_of_worship` + `religion=jewish`, דרך Overpass ושמירה מקומית כמו בכבישים). זמני תפילות מ"נדרים פלוס": דורש אישור כתובת באוצריא, לבקש באותה בקשה של ה-GPS | בוצע 20.10 (חלק OSM): `layers.js` — \"בתי כנסת קרובים\" בחיפוש (קובץ מדינה או Overpass סביב המיקום, עם שמירה מקומית), ו-`build_layers.py` + `build-layers.yml`. נדרים פלוס: לא בוצע, דורש כתובת API מאומתת ואישור באוצריא (נרשם ב-requests) |
| 9 | מיקודים בארץ: לבדוק מקור פתוח ומעודכן למיקודי ישראל (אין מקור פתוח מלא ידוע). אפשרות: טופס "שלח מיקוד" שנשלח כ-issue דרך המתווך, ומאגר שמתעדכן מה-issues | בוצע 20.10: אין מקור פתוח מלא (נתוני דואר ישראל סגורים). `pcsend.js` — מיקוד שלא נמצא נשלח עם המיקום הנוכחי (באישור) כ-issue \"[מיקוד]\"; `postcodes_extra.py` + `postcodes-extra.yml` אוספים מיקוד עם 2 דיווחים קרובים או תווית \"מיקוד-מאושר\". ה-workflow צריך לעבור ל-dev (משימה 12) |
| 10 | שכבות במפה: תחנות רכבת ומסילות, שדות תעופה, ימים ותבליט (OpenStreetMap: `railway=station`, `railway=rail`, `aeroway=aerodrome`), באותו מנגנון של `build_roads.py` (קובץ לכל מדינה) | בוצע 20.10: מסילות ראשיות, תחנות ושדות תעופה מקובצי `layers/<ISO3>.json` (הגדרה \"שכבות במפה\"). ימים כבר במפת היבשות; תבליט לא נוסף (אין מקור קטן מספיק) |
| 11 | `build-roads.yml`: להוסיף commit אחרי כל כמה מדינות, כדי שריצה ארוכה לא תאבד הכול | בוצע 20.10: `COMMIT_EVERY=10` + `kivun-tefila-build/commit_data.sh` (משמש גם לשכבות ולבתי כנסת) |
| 12 | הריצה החודשית של הכבישים: להעתיק את `build-roads.yml` לענף ברירת המחדל (`dev`), או להפעיל אותה מ-madaei-hatanach כמו החנות | פתוח |
| 13 | PR לאוצריא (`requests/pr-allowlist-relay.md`): לעדכן לכתובת החדשה ולהוסיף את כתובת נדרים פלוס, ולשלוח רק באישור המפתחת | ממתין |

## פרומפט לשיחה הבאה (כיוון תפילה 2.6)
```
ממשיכים בתוסף "כיוון תפילה": ריפו Hadabadra/Prayer-pointA, ענף כיוון-תפילה, תיקייה kivun-tefila.
קרא קודם את kivun-tefila-docs/PLAN-2.6.md ועבוד לפי הטבלה.
סדר: משימה 0 (כל הקישורים לשם החדש, בכל הריפו שלי, כולל kivun-tefila-store.yml ב-Hadabadra/madaei-hatanach),
ואחר כך 11, 6, 8, 10, 9, ובסוף 1.
commit ו-push אחרי כל שלב, בשם Claude בלבד. עדכן את היומן ב-PLAN-2.6.md, את "מה חדש" בהגדרות ואת ה-README.
אריזה דטרמיניסטית ב-kivun-tefila-build/pack.py, ובדיקה בוולידטור הרשמי (Otzaria/otzaria-plugin-validator, src/cli.js) עם 0 הערות עיצוב.
גרסה 2.6.0. בדיקות בסוף. אסור להחליף את הענף בכוח. ה-PR לאוצריא רק באישורי.
```

## פרומפט לשיחה נפרדת: הגשר של "אחת שאלתי"
```
בריפו Hadabadra/madaei-hatanach, ענף כלי-מערכת (קרא docs/STATUS.md), הוסף לגשר המקומי ל-Windows:
1. נקודת קצה GET /location: מיקום מ-Windows Location (Windows.Devices.Geolocation). מחזירה lat, lon, accuracy ומקור.
   אם השירות כבוי, מחזירה שגיאה ברורה עם הסבר איך להפעיל מיקום ב-Windows.
2. נקודת קצה POST /feedback: מעבירה הערה ל-https://achat-relay.e0548433917.workers.dev (אותו פורמט כמו בתוספים),
   כדי שתוספים שהכתובת לא אושרה להם באוצריא ישלחו דרך הגשר.
3. בתוספים (כיוון תפילה ואחרים): אם יש גשר (network.localhost), לנסות קודם אותו, ובלי גשר להמשיך כמו היום.
תעד ב-docs, commit ו-push בשם Claude בלבד. אל תארוז גרסה חדשה של אחת שאלתי; הכן את זה לאריזה הבאה,
ורשום ב-docs/STATUS.md מה נשאר לאריזה.
```

## יומן
- 19.10.2026: 2.5.4 (דיני הכותל, מצב תפילה על רקע הכותל, ביטול הארכת התמונה, השלמת היומן, 0 הערות עיצוב). המסמך נכתב.
- 20.10.2026: משימה 0 — כל הקישורים ל-Hadabadra/Prayer-pointA. פרסום לחנות עדיין נכשל (session ריק), ממתין לעדכון הסודות.
- 20.10.2026: משימה 11 — שמירת ביניים בכבישים כל 10 מדינות.
- 20.10.2026: משימה 6 — תצוגה מקדימה וייצוא ל-Word.
- 20.10.2026: משימות 8 ו-10 — בתי כנסת קרובים, תחנות רכבת ושדות תעופה בחיפוש, ושכבות במפה. הבנייה הראשונה (ISR) מופעלת מ-layers-request.txt.
- 20.10.2026: משימה 9 — שליחת מיקודים ואיסופם.
- 20.10.2026: משימה 4 — מיקום ומשוב דרך גשר אחת שאלתי (bridge.js). בגשר: POST /sys/location (לא GET — כל נקודות הגשר הן POST עם צימוד). החנות: הסודות תוקנו, 2.5.4 פורסם.
- 20.10.2026: משימה 1 — נוסה ציור נדבכים תחתונים; נראה מלאכותי (רשת אחידה) ולא נכלל. נדרש צילום חופשי של החלק התחתון בלי אנשים.
- 20.10.2026: **2.6.0** — נארז (pack.py), ולידטור רשמי: 0 שגיאות, 0 אזהרות, 0 הערות עיצוב.

## פרומפט מאוחד לשיחה הבאה (הכול בשיחה אחת)
```
ממשיכים בפרויקטים של אוצריא בחשבון GitHub Hadabadra. כל commit ו-push בשם Claude בלבד (Claude <noreply@anthropic.com>), לעולם לא בשם TziporaStern או צפורה שטרן.
קרא קודם את kivun-tefila-docs/PLAN-2.6.md בריפו Hadabadra/Prayer-pointA, ענף כיוון-תפילה, ועבוד לפי הסדר:

א. בדיקה ראשונה: הפעל את Action הפרסום לחנות (Hadabadra/madaei-hatanach, kivun-tefila-store.yml, Run workflow) ובדוק אם ההתחברות עובדת.
   אם עדיין "session ריק": עצור ותגיד לי בדיוק מה לבדוק (התחברות באתר otzaria.org עם סיסמה, לא דרך Google; ערכי הסודות OTZARIA_USER ו-OTZARIA_PASSWORD ב-https://github.com/Hadabadra/madaei-hatanach/settings/secrets/actions).
ב. משימה 0: כל הקישורים לשם החדש Hadabadra/Prayer-pointA ו-Hadabadra/madaei-hatanach, בכל הריפו שלי, כולל manifest.json (allowlist ו-homepage; השאר גם את הכתובת הישנה ב-allowlist), names.js, globe.js, extras.js, ui.js, README, requests/*.md ו-build_roads.py.
ג. משימות 11, 6, 8, 10, 9 ובסוף 1 מהטבלה ב-PLAN-2.6.md.
ד. הגשר של "אחת שאלתי" (Hadabadra/madaei-hatanach, ענף כלי-מערכת, קרא docs/STATUS.md):
   1. GET /location: מיקום מ-Windows Location (Windows.Devices.Geolocation): lat, lon, accuracy ומקור; אם השירות כבוי, שגיאה ברורה עם הסבר איך להפעיל.
   2. POST /feedback: מעביר הערה ל-https://achat-relay.e0548433917.workers.dev (אותו פורמט כמו בתוספים).
   3. בכיוון תפילה ובתוספים האחרים: אם יש גשר (network.localhost), לנסות אותו קודם (מיקום ומשוב), ובלי גשר להמשיך כמו היום.
   אל תארוז גרסה חדשה של אחת שאלתי; הכן לאריזה הבאה ורשום ב-docs/STATUS.md מה נשאר.
ה. כיוון תפילה 2.6.0: אריזה דטרמיניסטית (kivun-tefila-build/pack.py), ולידטור רשמי (Otzaria/otzaria-plugin-validator, src/cli.js) עם 0 הערות עיצוב, "מה חדש" בהגדרות וב-README, בדיקות בסוף, ווידוא שה-Release נוצר ושהפרסום לחנות עבר.
אחרי כל שלב: עדכן את היומן ב-PLAN-2.6.md, commit ו-push. אסור להחליף ענף בכוח. ה-PR לאוצריא רק באישורי.
בסוף: תעד הכול בגיט ובזיכרון, ואשר שאפשר למחוק את השיחה.
```
