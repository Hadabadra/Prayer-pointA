/* רכיב משותף: המלצה על "אחת שאלתי" — גרסה 1.1.0
 * מקור יחיד: Hadabadra/Mikvaot shared/promo/ — כל תוסף מעתיק את שני הקבצים כמו שהם (ראו README.md).
 * אין לשנות את הקובץ בתוך תוסף; שינוי נעשה כאן, ומועתק לכל התוספים.
 * צבעים רק דרך אסימוני :root של אוצריא, מידות ב-em בלבד (achat-promo.css).
 */
(function (root) {
  "use strict";
  var VERSION = "1.1.0";
  var KEY = "achatPromo";                 /* מפתח ב-storage של התוסף */
  var WEEK = 7 * 24 * 3600 * 1000, DAY = 24 * 3600 * 1000;
  var DEF = {
    title: "אחת שאלתי",
    text: "רוצים ללמוד בלי להתפזר? 'אחת שאלתי' – הופך את המחשב לאוצריא ו-Word בלבד.",
    /* פוסט ההסבר והורדה של "אחת שאלתי" בפורום אוצריא (נושא 2777) */
    forumUrl: "https://otzaria.org/forum/topic/2777/%D7%9C%D7%94%D7%95%D7%A8%D7%93%D7%94-%D7%90%D7%97%D7%AA-%D7%A9%D7%90%D7%9C%D7%AA%D7%99-%D7%AA%D7%95%D7%9B%D7%A0%D7%AA-%D7%97%D7%A1%D7%99%D7%9E%D7%94-%D7%A7%D7%99%D7%95%D7%A1%D7%A7-%D7%9C%D7%9E%D7%97%D7%A9%D7%91-%D7%9C%D7%9C%D7%99%D7%9E%D7%95%D7%93-%D7%91%D7%9C%D7%91%D7%93/41",
    downloadUrl: "https://github.com/achat-shaalti/achat-shaalti/releases",
    author: "רובע היהודי"
  };
  var cfg = null, st = { show: true, first: 0, last: 0, opens: 0 }, loaded = false, online = null;

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
      + "a.btn.sec{background:#efe6da;color:#5a3d1e}ol{padding-inline-start:1.3em}small{color:#776c62}</style></head><body>"
      + "<h1>אחת שאלתי – ללמוד בלי להתפזר</h1><p><small>מאת " + esc(cfg.author) + "</small></p>"
      + '<div class="card"><p>"אחת שאלתי" הוא כלי חינמי למחשב (Windows) שהופך את המחשב לאוצריא ו-Word בלבד: מצב נעילה בסיסמה ששומר את המחשב בתוך אוצריא, עם Word ותוכנות תורניות שבוחרים — בלי הסחות דעת.</p>'
      + '<p><a class="btn" href="' + esc(cfg.downloadUrl) + '">להורדת קובץ ההתקנה ↗</a><a class="btn sec" href="' + esc(cfg.forumUrl) + '">להסבר המלא בפורום אוצריא ↗</a></p></div>'
      + '<div class="card"><b>איך מתקינים</b><ol><li>פותחים את הקובץ הזה במחשב מחובר לאינטרנט ולוחצים על "להורדת קובץ ההתקנה".</li><li>מעבירים את קובץ ההתקנה בדיסק און קי למחשב הלימוד.</li><li>מריצים אותו ופועלים לפי ההוראות.</li></ol></div>'
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
      ? '<button type="button" class="ap-btn ap-pri" data-ap="dl">להורדה ↗</button><button type="button" class="ap-btn" data-ap="forum">להסבר בפורום ↗</button>'
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
      if (due) AchatPromo.show();
      return due;
    },
    show: async function () {
      if (!cfg || document.querySelector(".ap-pop")) return;
      var on = await isOnline(), el = document.createElement("aside");
      el.className = "ap-pop"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", cfg.title);
      el.innerHTML = '<button type="button" class="ap-x" data-ap="close" aria-label="סגירה">✕</button>'
        + '<div class="ap-head">' + STAMP + '<b>' + esc(cfg.title) + '</b><span class="ap-tag">המלצה</span></div>'
        + '<p class="ap-text">' + esc(cfg.text) + '</p><p class="ap-by">מאת ' + esc(cfg.author) + '</p>'
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
      if (ab && !ab.dataset.wired) { ab.dataset.wired = "1"; ab.innerHTML = actions(await isOnline(), false); wire(ab); }
    },
    isEnabled: function () { return st.show !== false; },
    fileText: function () { return cfg ? fileText() : ""; },
    fileHtml: function () { return cfg ? fileHtml() : ""; }
  };
  root.AchatPromo = AchatPromo;
})(typeof window !== "undefined" ? window : this);
