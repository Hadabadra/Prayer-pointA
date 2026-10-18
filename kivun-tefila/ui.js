/* כיוון תפילה 2.3.0 — תוספות ממשק: "עוד" בטלפון, ספינר, מצב לא מקוון, הדפסה/PDF, אודות וקיצור דרך, נגישות */
(function () {
  const $ = id => document.getElementById(id), O = window.Otzaria;
  const HOME = "https://github.com/e0548433917-gif/otzaria/tree/%D7%9B%D7%99%D7%95%D7%95%D7%9F-%D7%AA%D7%A4%D7%99%D7%9C%D7%94";
  const bar = $("bar");

  /* גובה הפס נמדד, כדי שהחלוניות הצדדיות והמפה במסך מלא יתחילו מתחתיו */
  const setH = () => document.documentElement.style.setProperty("--bar-h", bar.offsetHeight + "px");
  setH();
  try { new ResizeObserver(setH).observe(bar) } catch (e) { addEventListener("resize", setH) }

  /* נגישות: הודעות מוקראות, ו-Esc סוגר גם הלכות, טיסה ומניינים */
  ["txt", "loc", "stMsg", "fbMsg", "satUrl", "minMsg"].forEach(i => { const e = $(i); if (e) e.setAttribute("aria-live", "polite") });
  addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    [["bHal", "hal"], ["bFly", "fly"], ["bMin", "minyan"]].forEach(([b, p]) => { if ($(p) && !$(p).hidden) pop(b, p, false) });
  });

  /* טלפון: כפתורים משניים מאחורי "עוד" (CSS מסתיר אותם רק במסך צר) */
  ["bHal", "bMin", "bFly", "bPrint", "bHelp", "bSet", "bLang", "bFb", "meth"].forEach(i => { const e = $(i); if (e) e.classList.add("sec") });
  const more = document.createElement("button");
  more.id = "bMore"; more.type = "button"; more.textContent = "⋯"; more.title = "עוד"; more.setAttribute("aria-expanded", "false"); more.setAttribute("aria-label", "עוד פעולות");
  more.onclick = () => { const o = bar.classList.toggle("more"); more.setAttribute("aria-expanded", String(o)) };
  bar.appendChild(more);

  /* ספינר בזמן איתור מיקום */
  const on = $("bOn"), txt = $("txt");
  let busyT = 0;
  const idle = () => { on.classList.remove("busy"); clearTimeout(busyT) };
  on.addEventListener("click", () => { on.classList.add("busy"); clearTimeout(busyT); busyT = setTimeout(idle, 12000) });
  new MutationObserver(() => { if (on.classList.contains("busy") && !txt.textContent.startsWith("מאתר")) idle() }).observe(txt, { childList: true, characterData: true, subtree: true });

  /* מצב לא מקוון: מיקום משוער דורש רשת */
  let off = false;
  async function chk() {
    off = navigator.onLine === false;
    if (O) { try { const r = await O.call("app.getConnectivity"); const d = r && (r.data || r); if (d) off = !!(d.isOfflineMode || d.isOnline === false) } catch (e) {} }
    on.title = off ? "אין חיבור לאינטרנט: מיקום משוער אינו זמין" : "";
  }
  chk(); addEventListener("online", chk); addEventListener("offline", chk);
  on.addEventListener("click", e => {
    if (!off) return;
    e.stopImmediatePropagation(); e.preventDefault(); idle();
    txt.textContent = "אין חיבור לאינטרנט (או שאוצריא במצב לא מקוון), ולכן מיקום משוער אינו זמין. אפשר לבחור עיר מהרשימה, לחפש רחוב או להזין קואורדינטות.";
  }, true);

  /* הדפסה / ייצוא PDF דרך אוצריא, עם נפילה להדפסת הדפדפן */
  window.printNow = async function () {
    const pdf = window.__pdf; window.__pdf = false;
    const o = { pageSize: "a4", orientation: "portrait", marginMm: 12, printBackgrounds: true };
    if (O) {
      try {
        if (pdf) { await O.call("ui.exportPdf", Object.assign({ fileName: "כיוון-תפילה.pdf" }, o)); return }
        await O.call("ui.print", Object.assign({ jobName: "כיוון תפילה" }, o)); return;
      } catch (e) { if (pdf) throw e }
    }
    window.print();
  };

  /* אודות, קיצור דרך וייצוא PDF — בתוך ההגדרות */
  const set = $("set");
  if (set) {
    const d = document.createElement("details");
    d.className = "sd"; d.id = "about";
    d.innerHTML = '<summary><b>אודות וכלים</b></summary>'
      + '<p>כיוון תפילה <span id="aboutVer"></span> · שיח רינה-עמודי שש</p>'
      + '<div class="row"><button id="bHome" type="button">דף התוסף ב-GitHub</button><button id="bShortcut" type="button">צור קיצור דרך בשולחן העבודה</button><button id="bPdf" type="button">ייצוא דף כיוון ל-PDF</button></div>'
      + '<p id="aboutMsg" aria-live="polite" style="min-height:1.2em"></p>';
    set.appendChild(d);
    try { $("aboutVer").textContent = VER } catch (e) {}
    const msg = t => { $("aboutMsg").textContent = t };
    $("bHome").onclick = () => {
      const fail = () => { try { copyText(HOME) } catch (e) {} msg("הכתובת הועתקה ללוח: " + HOME) };
      (O ? O.call("app.openUrl", { url: HOME }) : Promise.reject()).then(r => { if (r && r.success === false) fail() }).catch(fail);
    };
    if (/Android|iPhone|iPad/i.test(navigator.userAgent) || !O) $("bShortcut").hidden = true;
    $("bShortcut").onclick = () => {
      O.call("shortcut.create", { label: "כיוון תפילה" })
        .then(r => { const v = r && (r.data !== undefined ? r.data : r); msg(v && v.created ? "קיצור הדרך נוצר בשולחן העבודה." : "הפעולה בוטלה.") })
        .catch(() => msg("יצירת קיצור דרך אינה נתמכת במערכת הזו."));
    };
    $("bPdf").onclick = () => {
      if (typeof pos === "undefined" || !pos) { msg("בחר קודם מיקום."); return }
      window.__pdf = true; printSheet();
    };
  }

  /* פתיחת חלקי התוסף דרך מסך הספרייה של אוצריא (library.setProviderBooks + library.providerBook.openRequested) */
  const AUTH = "שיח רינה-עמודי שש";
  const PARTS = [
    { id: 1, title: "כיוון תפילה: חוגה וכיוון לירושלים", author: AUTH },
    { id: 2, title: "כיוון תפילה: הלכות כיוון התפילה", author: AUTH },
    { id: 3, title: "כיוון תפילה: מצב טיסה", author: AUTH },
    { id: 4, title: "כיוון תפילה: מניינים קרובים", author: AUTH },
    { id: 5, title: "כיוון תפילה: מפת הרחובות סביבי", author: AUTH },
    { id: 6, title: "כיוון תפילה: הדפסת דף כיוון", author: AUTH }
  ];
  const openP = (b, p) => { if ($(p).hidden) $(b).click() };
  const ACT = {
    1: () => scrollTo(0, 0),
    2: () => openP("bHal", "hal"),
    3: () => openP("bFly", "fly"),
    4: () => openP("bMin", "minyan"),
    5: () => { $("mapMode").value = "street"; $("mapMode").dispatchEvent(new Event("change")); $("map").scrollIntoView() },
    6: () => { if (typeof pos !== "undefined" && pos) printSheet(); else txt.textContent = "בחר קודם מיקום כדי להדפיס דף כיוון." }
  };
  if (O) {
    O.on("library.providerBook.openRequested", e => { (ACT[e && e.id] || ACT[1])() });
    O.call("library.setProviderBooks", { provider: "kivun-tefila", books: PARTS }).catch(() => {});
  }

  /* איזה יום היום: תאריך עברי מלוח השנה של אוצריא */
  const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  function heb(n, geresh) {
    const U = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"], T = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"], H = ["", "ק", "ר", "ש", "ת"];
    let o = "", h = Math.floor(n / 100) % 10 * 100;
    for (let x = h; x >= 400; x -= 400) o += "ת"; h %= 400; o += H[h / 100] || "";
    let r = n % 100; if (r === 15) o += "טו"; else if (r === 16) o += "טז"; else o += T[Math.floor(r / 10)] + U[r % 10];
    if (!geresh) return o;
    return o.length > 1 ? o.slice(0, -1) + "״" + o.slice(-1) : o + "׳";
  }
  async function today() {
    if (!O) return;
    try {
      const r = await O.call("calendar.getJewishDate"), j = r && (r.data || r);
      if (!j || !j.day) return;
      const g = new Date(j.gregorian), dow = isFinite(g) ? "יום " + DAYS[g.getDay()] + " · " : "";
      let t = dow + heb(j.day, true) + " ב" + j.monthName + " " + heb(j.year % 1000, true);
      if (j.isShabbat && j.parasha) t += " · פרשת " + j.parasha;
      let c = $("today");
      if (!c) { c = document.createElement("p"); c.id = "today"; c.className = "chip"; c.style.margin = ".2rem 0"; const l = $("loc"); l.parentNode.insertBefore(c, l) }
      c.textContent = t;
    } catch (e) {}
  }
  today(); setInterval(today, 3600000);
})();
