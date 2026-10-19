# מסירה ב': גשר 1.0.2, צופה PDF+OCR 5.8.0, כיוון תפילה 2.6.1 (20.10.2026, לילה)

לשיחה שהכינה את זה הייתה גישת כתיבה רק ל-Hadabadra/Prayer-pointA. לכן:
- **כיוון תפילה 2.6.1 כבר נדחף** לענף `כיוון-תפילה` (ה-CI יוצר Release `kivun-tefila-v2.6.1`). לחנות — רק באישור.
- **הגשר והצופה** מוכנים כאן כ-patch על `main` של כל ריפו, ויש לדחוף אותם משיחה עם גישה.

כל commit ו-push בשם Claude בלבד (Claude <noreply@anthropic.com>), לעולם לא בשם TziporaStern או צפורה שטרן.

## קבצים בתיקייה
| קובץ | מה |
|---|---|
| `achat-shaalti-1.0.2.patch` | גשר אחת שאלתי 1.0.2 + שני תוספי המערכת 1.0.2 (על `main` = v1.0.1) |
| `pdf-viewer-5.8.0.patch` | צופה PDF+OCR 5.8.0 (על `main` = 5.7.1) |
| `OtzariaBridge-1.0.2.exe` | בנייה מקומית (dotnet publish win-x64, התוספים מוטמעים). **לא חתום, לא נבדק ב-Windows.** לשחרור — ה-CI בונה מחדש |
| `system-settings.otzplugin`, `file-explorer.otzplugin` | תוספי המערכת 1.0.2 |
| `com_chadbedera_pdfviewer-5_8_0.otzplugin` | הצופה 5.8.0 |
| `kivun-tefila-2.6.1.otzplugin` | כיוון תפילה 2.6.1 (כבר בענף שלו) |

## מה נעשה
### גשר 1.0.2 (`Hadabadra/achat-shaalti`)
- `PdfAssoc.cs` — "פתח באמצעות" של Windows: רישום ב-HKCU (Applications, ProgId `OtzariaBridge.pdf`, OpenWithProgids, RegisteredApplications), אוטומטי בעלייה (`pdf.assoc=false` מבטל), הסרה ב-uninstall. `--open-pdf "<path>"` → תור ב-`%LOCALAPPDATA%\OtzariaBridge\pdf-inbox` → `otzaria://open/plugin/com.chadbedera.pdfviewer`. `/pdf/assoc/*`, `/pdf/inbox/list|ack`.
- חלון "בחירת תוכנה" — `SHOpenWithDialog` מחוט STA עם חלון בעלים בחזית (במקום rundll32 שנעלם אחרי כמה שניות). גם בסייר (`FsApi.cs`).
- `PdfOps.cs` — פעולות PDF בכל תוכנה שמותקנת במחשב: `/pdf/engines` מזהה Ghostscript (גם של PDF24), qpdf, MuPDF, PDFtk, Poppler, LibreOffice, Word ואת הפעולות של כל אחת; `/pdf/op/begin|chunk|run|read|end` עם `engine` לבחירה: compress, grayscale, pdfa, repair, protect, unlock, linearize, pdf2png, totext, office2pdf. ב-`PdfApi.cs` נוספו לפתיחה PDF-XChange, Nitro, PDF24, PDFsam, Edge, WPS.
- `CompassApi.cs` — `/sys/compass` מחיישן המצפן (רק במכשיר עם חיישן).
- דיווחים אוטומטיים #81–#92: קריסת הבדיקה העצמית לא נמסרת ב-`/diag/pending`; קריאת צינור אחרי פסק זמן מסומנת כנצפית (`HardLock.Call`).
- תוספי המערכת: "אודות" הציג 3.4.0 → 1.0.2; הוסר "מגרסה 3.0"; קישורים ל-Hadabadra/achat-shaalti.
- תיעוד: `CHANGELOG.md`, `docs/BRIDGE_API.md`, `docs/PDF-INTEGRATION-SPEC.md`.
- נבנה (`dotnet build` / `publish`) בהצלחה.

### צופה PDF+OCR 5.8.0 (`Hadabadra/pdf-viewer`)
- `B.versionLt` — המספור החדש של הגשר (1.x) חדש מ-3.x; לפני כן 1.0.1 נחשב "ישן" וחסם את כלי החיתוך ושאר היכולות. טקסטים "1.0.1 ומעלה", קישור הורדה Hadabadra/achat-shaalti.
- "פתח באמצעות": `B.startInbox`/`B.checkInbox`, `B.openDiskFile` (+`V.doc.diskPath`, כך שכל היכולות כולל "פתיחה בתוכנה אחרת" עובדות).
- `js/pdftools.js` — "כלי PDF" כמו ב-PDF24, בתפריט "פעולות נוספות" (פירוט ב-CHANGELOG ו-docs/KNOWLEDGE.md).
- תיעוד: `CHANGELOG.md`, "מה חדש" באודות, `docs/KNOWLEDGE.md`, manifest 5.8.0 ו-homepage חדש.

### כיוון תפילה 2.6.1 (נדחף)
- מיקום מהגשר אוטומטית בעלייה, ניסיון חוזר לגשר, צפון מ-`/sys/compass`. README ו-`kivun-tefila-docs/PLAN-2.6.md`.

## דחיפה (משיחה עם גישה ל-Hadabadra)
```
# גשר
git clone https://github.com/Hadabadra/achat-shaalti && cd achat-shaalti
git config user.name Claude && git config user.email noreply@anthropic.com
git am <path>/achat-shaalti-1.0.2.patch
git push origin main            # ה-CI בונה exe + התקנה ויוצר v1.0.2
cd ..
# צופה
git clone https://github.com/Hadabadra/pdf-viewer && cd pdf-viewer
git config user.name Claude && git config user.email noreply@anthropic.com
git am <path>/pdf-viewer-5.8.0.patch
git push origin main
```
את ה-patch-ים מורידים מהענף הזה: `git clone -b handoff-20-10 --depth 1 https://github.com/Hadabadra/Prayer-pointA` → `handoff/20-10-b/`.

## לבדוק ב-Windows
1. התקנת הגשר 1.0.2 → קליק ימני על PDF → "פתח באמצעות" → "צופה PDF+OCR (אוצריא)" → אוצריא נפתחת בתוסף עם הקובץ.
2. בצופה: "פתיחה בתוכנה אחרת…" → "בחירת תוכנה" — החלון נשאר.
3. "כלי PDF": חיבור, פיצול; בכלים המסומנים ⚙ — רשימת התוכנות שזוהו במחשב, ודחיסה/המרה בכל אחת.
4. כיוון תפילה: בלי עיר שמורה — מיקום מ-Windows מופיע לבד; הגשר מציג את התוסף כמחובר.

## מה לא אפשרי
- **צפון בלי חיישן:** במחשב בלי חיישן מצפן אין מקור לכיוון הצפון (גם תוספי דפדפן קוראים חיישן). נשארת החוגה ודרכי הזיהוי הידניות.

## בדיקת השלמה (כל הבקשות מהשיחה)
| בקשה | מצב |
|---|---|
| "גשר 3.1" בצופה → המספור החדש | ✅ 5.8.0 |
| "פתח באמצעות" ב-Windows ישירות לתוסף | ✅ גשר 1.0.2 + צופה 5.8.0 |
| חלון בחירת תוכנה נעלם ונסגר | ✅ גשר 1.0.2 |
| כל פונקציות הגשר זמינות בתוסף (היו חסומות בגלל מספר הגרסה) | ✅ 5.8.0 |
| בעיות בגיט של הגשר | ✅ כולן דיווחים אוטומטיים — שני המקורות תוקנו |
| כיוון תפילה מחובר לגשר, שולח מיקום וצפון | ✅ 2.6.1 נדחף (צפון רק עם חיישן) |
| הגדרות מערכת מציג "גשר 3" | ✅ 1.0.2 |
| כל פעולות PDF כמו PDF24, בכל תוכנה מותקנת | ✅ 5.8.0 + גשר 1.0.2 |
| תיעוד בגיט וביומני השינויים | ✅ CHANGELOG + docs בכל ריפו |
| דחיפה | כיוון תפילה ✅; גשר וצופה — מהתיקייה הזו (אין גישה לריפו שלהם בשיחה זו) |
