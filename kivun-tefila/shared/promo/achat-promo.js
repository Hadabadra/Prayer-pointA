/* רכיב משותף: המלצה על "אחת שאלתי" — גרסה 1.4.0
 * מקור יחיד: Hadabadra/Mikvaot shared/promo/ — כל תוסף מעתיק את שני הקבצים כמו שהם (ראו README.md).
 * אין לשנות את הקובץ בתוך תוסף; שינוי נעשה כאן, ומועתק לכל התוספים.
 * צבעים רק דרך אסימוני :root של אוצריא, מידות ב-em בלבד (achat-promo.css).
 */
(function (root) {
  "use strict";
  var VERSION = "1.4.0";
  var KEY = "achatPromo";                 /* מפתח ב-storage של התוסף */
  var WEEK = 7 * 24 * 3600 * 1000, DAY = 24 * 3600 * 1000;
  var DEF = {
    title: "אחת שאלתי",
    text: "מחשב לימוד לאוצריא, בלי הסחות ומפריעים: 'אחת שאלתי' הופכת מחשב רגיל לעמדת לימוד שבה אפשר להשתמש רק באוצריא ובתוכנות שהמנהל אישר.",
    /* פוסט ההסבר והורדה של "אחת שאלתי" בפורום אוצריא (נושא 2777) */
    forumUrl: "https://otzaria.org/forum/topic/2777/%D7%9C%D7%94%D7%95%D7%A8%D7%93%D7%94-%D7%90%D7%97%D7%AA-%D7%A9%D7%90%D7%9C%D7%AA%D7%99-%D7%AA%D7%95%D7%9B%D7%A0%D7%AA-%D7%97%D7%A1%D7%99%D7%9E%D7%94-%D7%A7%D7%99%D7%95%D7%A1%D7%A7-%D7%9C%D7%9E%D7%97%D7%A9%D7%91-%D7%9C%D7%9C%D7%99%D7%9E%D7%95%D7%93-%D7%91%D7%9C%D7%91%D7%93/41",
    downloadUrl: "https://github.com/achat-shaalti/achat-shaalti/releases",
    author: "חד בדרא, יאיר דניאל"
  };
  var cfg = null, st = { show: true, first: 0, last: 0, opens: 0 }, loaded = false, online = null, inst = null;
  /* 1.2.0: זיהוי "אחת שאלתי" מותקן — בדיקת /health של הגשר (127.0.0.1:47917-47921).
     עובד רק בתוסף עם הרשאת network.localhost ו-127.0.0.1/localhost ב-network.allowlist; אחרת "לא ידוע" ולא קורה כלום. */
  async function installed() {
    if (inst !== null) return inst;
    if (cfg.isInstalled) { try { return (inst = !!(await cfg.isInstalled())); } catch (e) { return (inst = false); } }
    var O = root.Otzaria, isIt = function (x) { return x && typeof x[Symbol.asyncIterator] === "function"; };
    if (!O || !O.call) return (inst = false);
    /* 1.4.0: מותקן אבל הגשר כבוי — מזהים לפי התוספים "סייר קבצים" / "הגדרות מערכת" שבאוצריא (plugin.listInstalled, הרשאת בסיס) */
    try { var L = await O.call("plugin.listInstalled"); var arr = L && (L.data || L); if (Array.isArray(arr) && arr.some(function (x) { return /סייר קבצים|הגדרות מערכת|אחת שאלתי|achat|otzaria-bridge|system-settings|file-explorer|chadbedera\.(fileexplorer|systemsettings)/i.test(String((x && (x.name + " " + x.pluginId)) || "")); })) return (inst = true); } catch (e) {}
    for (var p = 47917; p <= 47921; p++) {
      try {
        var it = O.call("network.fetchStream", { url: "http://127.0.0.1:" + p + "/health", method: "GET", headers: { "X-Otzaria-Bridge": "1" }, timeoutMs: 1200 });
        if (!isIt(it) && it && it.then) it = await it; if (!isIt(it) && it && isIt(it.data)) it = it.data; if (!isIt(it)) continue;
        var t = ""; for await (var c of it) { if (c && typeof c.body === "string" && c.type !== "response") t += c.body; }
        var j = JSON.parse(t); if (j && j.ok && j.data && j.data.name === "otzaria-bridge") return (inst = true);
      } catch (e) {}
    }
    return (inst = false);
  }
  /* 1.3.0–1.3.1: דף ההסבר = הפוסט הרשמי של יאיר דניאל בפורום (נושא 2777) בלי פסקת הפתיחה האישית; מקור: achat-shaalti docs/FORUM_POST_YAIR.md.
     שונו רק הקישורים: ההורדה מפנה לגרסה האחרונה, והמאגר לכתובת הארגון. */
  var POST_HTML = "<h1><b>אחת שאלתי - מחשב לימוד לאוצריא, בלי הסחות ומפריעים</b></h1><p><b>אחת שאלתי</b> היא תוכנה ל-Windows שהופכת מחשב רגיל ל<b>עמדת לימוד</b> שבה אפשר להשתמש <b>רק</b> באוצריא ולא בשום דבר אחר - בלי גלישה, בלי משחקים ובלי תוכנות אחרות. התוכנות היחידות שהמנהל אישר מראש הם אלו שיכולות להיפתח.</p><p>מתאימה ל:</p><ul><li><b>בית מדרש</b> — עמדות לימוד פנויות לכל מי שנכנס.</li><li><b>בית כנסת</b> — מחשב שנועד לספרייה התורנית ולא לשום דבר אחר.</li><li><b>בית</b> — מחשב לילד או לתלמיד, בלי צורך לפקח עליו כל הזמן (או לעצמך... אל תביאנו לא לידי נסיון ולא לידי בזיון...)</li></ul><hr><p>איך זה עובד?</p><ul><li>מורידים את התוכנה מהקישור הבא (הורדה ישירה)</li></ul><h3><b><a href=\"https://github.com/achat-shaalti/achat-shaalti/releases/latest\">אחת שאלתי - חסימת המחשב ללימוד בלבד</a></b></h3><ul><li>מפעילים = המתקין מתקין את הגשר, מגדיר הפעלה אוטומטית עם Windows, ופותח באוצריא את התקנת שני התוספים.</li><li>בפעם הראשונה כל תוסף מבקש אישור חיבור — מאשרים.</li></ul><hr><ul><li><b>ההתקנה מוסיפה לאוצריא שלושה חלקים שעובדים יחד:</b></li><li><b>הגשר</b> (OtzariaBridge.exe) — תוכנה קטנה שרצה ברקע, מאזינה <b>רק למחשב המקומי</b> ולא שולחת מידע החוצה. היא מפעילה את מצב הנעילה ונותנת לתוספים גישה לקבצים ולהגדרות.</li><li><b>תוסף &quot;סייר קבצים&quot;</b> — מנהל קבצים בתוך אוצריא.</li><li><b>תוסף &quot;הגדרות מערכת&quot;</b> — הגדרות Windows בתוך אוצריא, כולל שליטה במצב הנעילה.</li></ul><hr><h2><b>מצב נעילה</b></h2><ul><li>המחשב נעול לאוצריא במסך מלא, עם שורת תוכנות שאושרו ע&quot;י המנהל - בסרגל בצד + שעון מרחף בצד המסך.</li><li><b>רק</b> תוכנות שהמנהל אישר פתוחות לשימוש (למשל וורד, אוצריא, כתבי הקודש וכדו&#x27;).</li><li><b>תזמון נעילה</b> לפי שעות, עם כמה חלונות זמן ביום.</li><li><b>פתיחה זמנית</b> של המחשב בסיסמה נפרדת.</li><li><b>נעילה רגילה</b> חוסמת מקשים כמו Alt+Tab ומנהל המשימות, ומגבילה את סייר הקבצים לתיקיות מאושרות.</li><li><b>נעילה מוקשחת</b> (אופציונלית, מומלצת): רכיב שירות שרץ ברמת המערכת, שומר על ההגדרות מעריכה, מונע סגירה של הגשר ומגן גם בחשבון Windows אחר.</li><li><b>אימות דו-שלבי עם Windows Hello</b> לפעולות רגישות: ביטול נעילה, שינוי סיסמה, שינוי הגדרות ועוד.</li><li><b>הקשחת BIOS/UEFI</b>: ניסיון אוטומטי מתוך התוכנה, וכפתור הדרכה ידנית לכל היצרנים.</li><li>דיאלוגי &quot;פתיחת קובץ&quot; של Windows נאכפים באותה מדיניות תיקיות וסיומות.</li></ul><p><b>איך מפעילים?</b></p><ul><li>בוחרים <b>סיסמה</b> ושומרים <b>קוד שחזור</b> בהפעלה הראשונה.</li><li>שכחתם סיסמה? <b>קוד שחזור</b>, או <b>קיצור חירום: Ctrl + Alt + Shift + F12</b> (במחשבים רבים גם עם Fn).</li></ul><h2><b>שומר מסך</b></h2><p>כשהמחשב לא בשימוש, אפשר להגדיר שיהיה שומר מסך - עם  מלא אפשריות:</p><ul><li>פסוק</li><li>שעה ותאריך עברי</li><li>זמני היום</li><li>הקדשה לעילוי נשמה</li><li>כיתוב אישי (כמו שם בית הכנסת לדוגמא)</li><li>אפשר להשתמש בשומר המסך גם כתמונת מסך הנעילה של Windows.</li></ul><h2><b>תוספים:</b></h2><h3><b>תוסף &quot;הגדרות מערכת&quot;</b></h3><p>(הגדרות Windows מתוך אוצריא)</p><ul><li>מסך, שמע, חשמל וסוללה, שעה ותאריך;</li><li>מקלדת, עכבר, מדפסות, התקני USB, בלוטות׳;</li><li>Wi-Fi ומצב טיסה;</li><li><b>חיפוש הגדרה</b>, ותפריטים נפתחים (למשל זמני כיבוי מסך ושינה, ותוכנית צריכה);</li><li>לשוניות נוספות ללימוד ולנעילה: <b>תוכנות לימוד</b>, <b>מצב נעילה</b>, <b>נעילת סייר הקבצים</b>, <b>שומר מסך</b>, <b>אודות</b>.</li></ul><h3><b>תוסף &quot;סייר קבצים&quot;</b></h3><ul><li>סייר הקבצים בסגנון סייר הקבצים של ווידנוס - נותן את המראה המוכר - בתוך אוצריא</li><li>מצבי תצוגה שונים, חיפוש בקבצים ובתוכן הקבצים</li><li>צפייה ב-<b>PDF, Word, טקסט ותמונות</b>;</li><li>העתקה, העברה, מחיקה, שינוי שם, וסל מיחזור;</li><li>כשהנעילה (האפשרית, לא חובה) פעילה =  רק התיקיות שהמנהל אישר.</li></ul><h3><b>הגשר בשורת המשימות</b></h3><ul><li>אודות ועדכונים, יומן שינויים</li><li>דיווחים:אילו לוגים נשלחו מהתוכנה, עריכה והוספת תיאור ללוגים - לשליחה;</li><li><b>צימוד תוספים</b> — כל תוסף מבקש אישור בפעם הראשונה, ורק מה שאושר מתחבר;</li><li>התקנה/עדכון התוספים באוצריא ופתיחת תיקיית התוספים;</li><li><b>צילום מסך</b> (Ctrl+Shift+F11) ו<b>צילום אזור</b> (Ctrl+Shift+F12);</li><li>אייקון שקוף במחשב  ( - בדומה לסמל של וויפרי) סמל קטן ברקע בפינה (גודל ומיקום לבחירה);</li><li>ממשק בעברית ובאנגלית.</li></ul><p><b><a href=\"https://github.com/achat-shaalti/achat-shaalti\">מאגר הגיטאב של התוסף</a></b></p><hr><h3><b>כמה דברים שחשוב לדעת:</b></h3><p>אין הגנת תוכנה &quot;בלתי שבירה&quot;. מי שיש לו גישה פיזית למחשב, הרשאות מנהל ב-Windows וידע מתקדם יכול תיאורטית לעקוף כל הגנה שמבוססת על תוכנה בלבד.</p><p>לכן מומלץ:</p><ul><li>להגדיר למשתמש חשבון Windows <b>רגיל</b> (לא מנהל);</li><li>להפעיל <b>נעילה מוקשחת</b>;</li><li>להקשיח גם את ה-<b>BIOS/UEFI</b> (סיסמה, חסימת אתחול מ-USB);</li><li>לדרוש <b>Windows Hello</b> לפעולות רגישות.</li></ul><p>הנעילה הרגילה מגינה היטב מפני שימוש אקראי, אבל משתמש טכני ונחוש יכול למצוא דרכים לעקוף אותה. התוכנה נבדקה בפועל על כמה מחשבי Windows.</p><p><b>פרטים נוספים בספויילר:</b></p><p><b>רישיון:</b> <a href=\"https://github.com/achat-shaalti/achat-shaalti/blob/main/LICENSE\">PolyForm Noncommercial 1.0.0</a> — קוד פתוח לשימוש אישי ולא-מסחרי (גרסאות עד 3.7.0 תחת MIT).</p><p><b>קרדיטים:</b> חישוב זמני היום בשומר המסך משתמש בספריית <a href=\"https://www.nuget.org/packages/Zmanim\">Zmanim</a> (פורט של KosherJava) ברישיון LGPL-2.1.</p><p><b>פרטיות:</b> התקשורת של הגשר היא מקומית בלבד.</p><p><b>פיתוח:</b> חד בדרא, יאיר דניאל</p><p>תמונות יעלו עוד מעט בספויילר.</p><h2><b><a href=\"https://otzariausercontent.serveftp.com/forum/assets/uploads/files/1792606778786-achat-shaalti-demo-forum.mp4\">לחצו כאן לסרטון קצר (מעודכן) על התוכנה</a></b></h2><p>לעילוי נשמת הנערה הצדקנית <b>אסתר גיטה דינר בת רבי מיכאל שלום הלוי שיבדלט&quot;א</b> — תנצב&quot;ה.</p><p>הערות, באגים והצעות — יתקבלו בברכה כאן בשרשור</p>";
  var HAPPY = '<p class="ap-happy">אשריך! "אחת שאלתי" כבר מותקן במחשב הזה.</p>';

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  async function call(m, p) { try { var r = await cfg.call(m, p || {}); return r || { success: false }; } catch (e) { return { success: false }; } }
  async function load() {
    if (loaded) return st;
    var r = await call("storage.get", { key: KEY }), d = r && r.success ? r.data : null;
    if (typeof d === "string") try { d = JSON.parse(d); } catch (e) { d = null; }
    if (d && typeof d === "object") st = Object.assign(st, d);
    loaded = true; return st;
  }
  function save() { return call("storage.set", { key: KEY, value: st }); }
  async function isOnline() {
    if (cfg.isOnline) try { return !!(await cfg.isOnline()); } catch (e) { return false; }
    var r = await call("app.getConnectivity", {});
    return !(r.success && r.data && r.data.isOfflineMode); /* מוסתר רק במצב "ללא גישה לאינטרנט" של אוצריא */
  }
  async function openUrl(u) {
    var r = await call("app.openUrl", { url: u });
    if (!r || r.success === false) call("ui.showMessage", { message: "לא ניתן לפתוח את הקישור. הוא הועתק — אפשר להדביק בדפדפן." }), copy(u);
  }
  function copy(t) { try { navigator.clipboard.writeText(t); } catch (e) { var x = document.createElement("textarea"); x.value = t; document.body.appendChild(x); x.select(); try { document.execCommand("copy"); } catch (e2) {} x.remove(); } }

  /* 1.1.0: קובץ HTML קטן עם קישורים לחיצים והסבר מסודר, להעברה למחשב מחובר (fileText נשאר לתאימות) */
  function fileText() {
    var L = cfg.links || {}, nl = "\r\n";
    return ["אחת שאלתי – ללמוד בלי להתפזר", "", "הסבר: " + cfg.forumUrl, "הורדה: " + cfg.downloadUrl, "", "נשמר מתוך התוסף \"" + (cfg.plugin || "") + "\" לאוצריא." + (L.gh ? nl + "GitHub: " + L.gh : "") + (L.store ? nl + "חנות התוספים: " + L.store : "")].join(nl) + nl;
  }
  function fileHtml() {
    var L = cfg.links || {}, a = function (u, t) { return '<a href="' + esc(u) + '">' + esc(t) + "</a>"; };
    return '<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>אחת שאלתי – הסבר והורדה</title>'
      + "<style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:40em;margin:2em auto;padding:0 1em;line-height:1.7;color:#2b2622;background:#faf7f2}h1{font-size:1.6em;margin:.2em 0}"
      + ".card{background:#fff;border-radius:1em;padding:1.2em 1.4em;box-shadow:0 .2em 1em rgba(0,0,0,.08);margin:1em 0}a.btn{display:inline-block;margin:.3em 0 .3em .6em;padding:.6em 1.2em;border-radius:2em;background:#8a5a2b;color:#fff;text-decoration:none;font-weight:700}"
      + "a.btn.sec{background:#efe6da;color:#5a3d1e}ol,ul{padding-inline-start:1.3em}.post h1{font-size:1.4em}.post h2{font-size:1.2em;margin:1em 0 .3em}.post h3{font-size:1.05em;margin:.9em 0 .3em}.post hr{border:0;border-top:1px solid #e5dccf;margin:1em 0}li{margin:.25em 0}small{color:#776c62}</style></head><body>"
      + "<h1>אחת שאלתי – ללמוד בלי להתפזר</h1><p><small>מאת " + esc(cfg.author) + "</small></p>"
      + '<p><a class="btn" href="' + esc(cfg.downloadUrl) + '">להורדת קובץ ההתקנה ↗</a><a class="btn sec" href="' + esc(cfg.forumUrl) + '">לפוסט בפורום אוצריא ↗</a></p>'
      + '<div class="card post">' + POST_HTML + '</div>'
      + '<p><small>נשמר מתוך התוסף "' + esc(cfg.plugin || "") + '" לאוצריא' + (L.gh ? " · " + a(L.gh, "הורדת התוסף מ-GitHub") : "") + (L.store ? " · " + a(L.store, "בחנות התוספים של אוצריא") : "") + "</small></p></body></html>";
  }
  function saveFile() {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([fileHtml()], { type: "text/html;charset=utf-8" }));
    a.download = "אחת שאלתי - הסבר וקישורים להורדה.html"; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    call("ui.showMessage", { message: "הקובץ נשמר בתיקיית ההורדות. פתחו אותו במחשב מחובר — הקישורים לחיצים" });
  }
  var STAMP = '<svg class="ap-stamp" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.2" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="7.6" fill="none" stroke="currentColor" stroke-width=".8" stroke-dasharray="1.2 1.1"/><path d="M8.6 8.2h6.8M9.4 8.4l5.4 7.6M14.6 8.4c.5 2.2-.3 3.6-2 4.2M9.6 15.8c-.4-1.9.2-3.1 1.5-3.6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
  function actions(on, withNever) {
    return (on
      ? '<button type="button" class="ap-btn ap-pri" data-ap="dl">להורדה ↗</button><button type="button" class="ap-btn" data-ap="forum">להסבר בפורום ↗</button><button type="button" class="ap-btn" data-ap="file">שמור דף הסבר</button>'
      : '<button type="button" class="ap-btn ap-pri" data-ap="file">שמור דף הסבר וקישורים</button>')
      + (withNever ? '<button type="button" class="ap-link" data-ap="never">אל תציג שוב</button>' : "");
  }
  function wire(el, onClose) {
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-ap]"); if (!b) return; var a = b.getAttribute("data-ap");
      if (a === "dl") openUrl(cfg.downloadUrl);
      else if (a === "forum") openUrl(cfg.forumUrl);
      else if (a === "file") saveFile();
      else if (a === "never") { st.show = false; save(); if (onClose) onClose(); call("ui.showMessage", { message: "לא יוצג שוב. אפשר להחזיר בהגדרות ← \"הצג המלצות\"" }); }
      else if (a === "close" && onClose) onClose();
    });
  }

  var AchatPromo = {
    VERSION: VERSION,
    /* opts: { call, plugin, links:{gh,store}, isOnline?, forumUrl?, downloadUrl? } */
    init: function (opts) {
      cfg = Object.assign({}, DEF, opts || {});
      if (typeof cfg.call !== "function") throw new Error("AchatPromo: call חסר");
      load(); return AchatPromo;
    },
    /* לקרוא בפתיחת התוסף מתפריט הכלים (לא בכניסה מבחירת מילה). מציג לכל היותר פעם בשבוע, לא ביום הפתיחה הראשונה */
    maybeShow: async function () {
      if (!cfg) return false; await load(); var now = Date.now();
      st.opens = (st.opens || 0) + 1; if (!st.first) st.first = now;
      var due = st.show !== false && now - st.first >= DAY && st.opens >= 2 && now - (st.last || 0) >= WEEK && !document.querySelector(".ap-pop");
      if (due) st.last = now; save();
      if (due && await installed()) due = false;   /* 1.2.0: מותקן — לא מציקים בהמלצה */
      if (due) AchatPromo.show();
      return due;
    },
    show: async function () {
      if (!cfg || document.querySelector(".ap-pop")) return;
      var on = await isOnline(), has = await installed(), el = document.createElement("aside");
      el.className = "ap-pop"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", cfg.title);
      el.innerHTML = '<button type="button" class="ap-x" data-ap="close" aria-label="סגירה">✕</button>'
        + '<div class="ap-head">' + STAMP + '<b>' + esc(cfg.title) + '</b><span class="ap-tag">המלצה</span></div>'
        + (has ? HAPPY : '<p class="ap-text">' + esc(cfg.text) + '</p>') + '<p class="ap-by">מאת ' + esc(cfg.author) + '</p>'
        + (on ? "" : '<p class="ap-note">אוצריא במצב "ללא גישה לאינטרנט" — אפשר לשמור קובץ קצר עם ההסבר והקישורים ולהעבירו למחשב מחובר.</p>')
        + '<div class="ap-acts">' + actions(on, true) + '</div>';
      var close = function () { el.classList.add("ap-out"); setTimeout(function () { el.remove(); }, 220); document.removeEventListener("keydown", key); };
      var key = function (e) { if (e.key === "Escape") close(); };
      wire(el, close); document.addEventListener("keydown", key); document.body.appendChild(el);
    },
    /* שורה קבועה ב"אודות" (תמיד מוצגת, בלי תלות במתג). אחרי הצבת ה-HTML לקרוא AchatPromo.bind(container) */
    aboutHtml: function () {
      return '<section class="ap-about" data-ap-about>' + STAMP + '<div><b>' + esc(cfg ? cfg.title : DEF.title) + '</b> — ' + 'הופך את המחשב לאוצריא ו-Word בלבד, כדי ללמוד בלי להתפזר.' + '<div class="ap-acts" data-ap-acts></div></div></section>';
    },
    /* שורת מתג להגדרות: <label> עם checkbox id="ap-sw" */
    settingsHtml: function () {
      return '<label class="ap-set"><span>הצג המלצות<small>הודעה קטנה על "אחת שאלתי", לכל היותר פעם בשבוע</small></span><input type="checkbox" id="ap-sw"' + (st.show !== false ? " checked" : "") + '></label>';
    },
    bind: async function (container) {
      if (!cfg || !container) return; await load();
      var sw = container.querySelector("#ap-sw");
      if (sw) { sw.checked = st.show !== false; sw.onchange = function () { st.show = sw.checked; if (sw.checked) st.last = Date.now(); save(); }; }
      var ab = container.querySelector("[data-ap-acts]");
      if (ab && !ab.dataset.wired) { ab.dataset.wired = "1"; ab.innerHTML = (await installed() ? HAPPY : "") + actions(await isOnline(), false); wire(ab); }
    },
    isInstalled: function () { return cfg ? installed() : Promise.resolve(false); },
    isEnabled: function () { return st.show !== false; },
    fileText: function () { return cfg ? fileText() : ""; },
    fileHtml: function () { return cfg ? fileHtml() : ""; }
  };
  root.AchatPromo = AchatPromo;
})(typeof window !== "undefined" ? window : this);
