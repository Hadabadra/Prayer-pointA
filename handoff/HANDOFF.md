# מסירה: גשר 1.0.1 וצופה PDF+OCR 5.7.0 (20.10.2026)

השיחה שהכינה את זה לא הייתה מחוברת לריפו של e0548433917-gif, ולכן הכול כאן מוכן לדחיפה.
כל commit ו-push בשם Claude בלבד (Claude <noreply@anthropic.com>), לעולם לא בשם TziporaStern או צפורה שטרן.

## קבצים מוכנים בתיקייה הזו (20.10.2026)
- `OtzariaBridge-1.0.1.exe` — נבנה מקומית (dotnet publish win-x64, עם שני התוספים מוטמעים). **לא חתום** (החתימה רק ב-CI) ולא נבדק ב-Windows. לשחרור הרשמי עדיף שה-CI יבנה מחדש אחרי החלת ה-patch-ים.
- `com_chadbedera_pdfviewer-5_7_0.otzplugin` — הצופה 5.7.0.
- `kivun-tefila-2.6.0.otzplugin` — כבר שוחרר ופורסם בחנות (לעיון בלבד).

## מצב פרסום
- כיוון תפילה 2.6.0: פורסם בחנות ✅ ו-Release ✅.
- צופה PDF+OCR 5.7.0: **לא פורסם** — לא בגיט, לא ב-Release ולא בחנות.
- גשר 1.0.1: **לא פורסם** — לא בגיט ולא ב-Release.
- עינים למקרא: קישורי קבצי המוצר בענף links-hadabadra, ממתינים לאישור ב-issue #135.

## 1. גשר "אחת שאלתי" 1.0.1 — ריפו e0548433917-gif/achat-shaalti, ענף next
- `0001-…patch`: `bridge/LocationApi.cs` (`/sys/location`, `/location`, `/sys/location/settings`, `/feedback`), `bridge/PdfApi.cs` (`/pdf/handlers`, `/pdf/open`), שורות רישום ב-`bridge/Server.cs`, תיעוד ב-`docs/BRIDGE_API.md`, `docs/PDF-INTEGRATION-SPEC.md` (הצעות תשובה לסעיף 9), `docs/STATUS.md`.
- `0002-…patch`: גרסה 1.0.1 ב-csproj ובשני ה-manifest, וסעיף ב-CHANGELOG.md.
- נבנה בהצלחה (`dotnet build -c Release`). **לא נבדק ב-Windows.**
- `tools/check-prerelease.py`: "כל הסעיפים בוצעו".

```
git clone -b next https://github.com/e0548433917-gif/achat-shaalti && cd achat-shaalti
git config user.name Claude && git config user.email noreply@anthropic.com
git am --committer-date-is-author-date /path/to/0001-*.patch /path/to/0002-*.patch
git push origin next
```
שחרור (לפי docs/RELEASE.md): fast-forward של next ל-main ו-push; ה-CI יוצר תג v1.0.1 ומהדורה עם 4 קבצים. לחנות רק באישור.

## 2. צופה PDF+OCR 5.7.0 — ריפו e0548433917-gif/pdf-viewer
- `com_chadbedera_pdfviewer-5_7_0.otzplugin`: החבילה המלאה. ולידטור רשמי: 0 שגיאות, 0 אזהרות, 4 הערות עיצוב (היו כבר ב-5.6.3, ב-css/app.css).
- `viewer-5.7.0.patch`: ההבדל מ-5.6.3 (שהמפתחת העלתה ולא היה בגיט):
  - `js/app.js`: פתיחה מהספרייה (`library.providerBook.openRequested`) קוראת ל-`plugin.openSelf`, כדי לעבור ממסך הספרייה לתוסף; `focusSelf` קוראת ל-openSelf גם כשרשימת ההרשאות עוד לא ידועה.
  - `js/files.js`: `Fs.diskPath()` — נתיב בדיסק לקובץ מתיקייה שנוספה.
  - `js/openwith.js` (חדש) + שורה ב-`index.html`: "פתיחה בתוכנה אחרת…" בתפריט הפעולות, דרך `/pdf/handlers` ו-`/pdf/open` של הגשר 1.0.1.
  - גרסה 5.7.0 ב-manifest, `js/core.js`, `index.html`, ו-CHANGELOG.md.
- הגיט של הצופה לא מעודכן ל-5.6.3. הדרך: לפתוח את החבילה לתיקיית העבודה של הענף הנכון (לשאול את המפתחת אם לא ברור), **לשמור** קובצי הריפו שאינם בחבילה (README, docs, .github, רישיונות), commit "צופה 5.6.3 (מהחבילה)" ואחריו commit "5.7.0" — או פשוט חבילת 5.7.0 כ-commit אחד.
- אחר כך: Release עם החבילה, ופרסום לחנות דרך ה-workflow של הריפו (המפתחת ביקשה).

## 3. כיוון תפילה 2.6.0 — כבר בוצע
Release `kivun-tefila-v2.6.0` נוצר ופורסם לחנות ב-20.10.2026. פרטים ב-`kivun-tefila-docs/PLAN-2.6.md`.

## פרומפט לשיחה עם גישה לכל הריפו
```
קרא את handoff/HANDOFF.md בריפו Hadabadra/Prayer-pointA, ענף handoff-20-10, ובצע את סעיפים 1 ו-2 בדיוק כפי שכתוב:
החל את ה-patch-ים של הגשר על e0548433917-gif/achat-shaalti (next), דחוף, ושחרר 1.0.1 לפי docs/RELEASE.md (בלי חנות).
הכנס את צופה PDF+OCR 5.7.0 ל-e0548433917-gif/pdf-viewer, צור Release ופרסם לחנות.
כל commit בשם Claude בלבד. בסוף עדכן את handoff/HANDOFF.md במה שבוצע, ואשר.
```

## סטטוס ביצוע (20.10.2026, סשן עם גישה לריפו)

### סעיף 1 — גשר 1.0.1: **בוצע**
- שני ה-patch-ים הוחלו נקי (0001 ואז 0002) על `next` ונדחפו; כל ה-commit-ים בשם Claude <noreply@anthropic.com>.
- ל-`main` היה commit מיזוג של PR #80 שלא היה ב-`next`, ולכן fast-forward ישיר לא היה אפשרי. מוזג `main` ל-`next` (ללא שינוי תוכן, אומת ש-main לא מכיל תוכן ייחודי), ואז `main` קודם ב-fast-forward ל-`e494ee8`. בלי force.
- ה-CI יצר את התג `v1.0.1` (על `e494ee8`) ואת המהדורה, שאינה טיוטה: https://github.com/e0548433917-gif/achat-shaalti/releases/tag/v1.0.1
- קבצי המהדורה (5 קבצים מועלים, לא 4): `OtzariaBridge-Setup-1.0.1.exe`, `OtzariaBridge.exe`, `file-explorer.otzplugin`, `system-settings.otzplugin`, `SHA256SUMS.txt`.
- לא פורסם לחנות (כמתוכנן). `docs/STATUS.md` בריפו הגשר עודכן ב-`next`.
- `dotnet build` לא רץ בסשן הזה (אין dotnet); הבנייה נעשתה ב-CI. עדיין לא נבדק ב-Windows.
- שימו לב: GitHub מודיע שהריפו הועבר ל-`Hadabadra/achat-shaalti`. הדחיפות עברו דרך הכתובת הישנה.

### סעיף 2 — צופה PDF+OCR 5.7.0: **בוצע (פורסם)**
- הריפו: `Hadabadra/pdf-viewer` (הועבר מ-`e0548433917-gif`). נבחר `main`, כי כל התגים הקודמים והמהדורה 5.5.4 מצביעים עליו וה-workflow רץ רק ממנו.
- commit `b5cc5da`: החבילה (נשמרו README, docs, .github, build, icon, screenshots ורישיון pdf.js; נמחקו רק `css/style.css`, `vendor/pdf.js`, `vendor/pdf.worker.js`).
- ההתחברות לחנות נכשלה בהתחלה (סודות בריפו), ואחרי התיקון נכשל העדכון בגלל התגית "מראה תואם לאוצריא" (4 סטיות עיצוב ב-`css/app.css`).
- commit `9cbd8d7`: ערכי CSS קשיחים הוחלפו במשתני `:root` עם אותם ערכים (בלי שינוי חזותי מכוון, **לא נבדק באוצריא**); `font-family: inherit` בשלושה שדות הוחלף ב-`var(--font-ui)`. ולידטור רשמי: 0 שגיאות, 0 אזהרות, 0 הערות.
- ריצת ה-workflow על `9cbd8d7` הצליחה (39337726506), כולל שלב הפרסום לחנות. נוצרו התג `v5.7.0` ו-Release עם `com.chadbedera.pdfviewer-5.7.0.otzplugin`: https://github.com/Hadabadra/pdf-viewer/releases/tag/v5.7.0
- התגית "מראה תואם לאוצריא" הוסרה ידנית מהחנות לפני כן; אפשר להחזיר אותה בעמוד התוסף.
- החבילה 21.9MB, מעל הרף שה-workflow מזהיר עליו (16MB).
