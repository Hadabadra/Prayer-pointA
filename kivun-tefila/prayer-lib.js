/* כיוון תפילה 3.7.0 — נוסח התפילה מספריית אוצריא (סעיף 8).
   כשסידורון אינו מותקן או אינו מחזיר תפילה (כמו סידורון 3.8 של המפתח, שאין בו עדיין
   מענה לבקשת "send-prayer"), חלון "תפילה" מציע לקרוא את הנוסח מסידור שבספריית אוצריא:
   library.findBooks → library.getBookToc → library.getBookContent עם section (כותרת מתוכן העניינים).
   ההרשאה library.content.read נוספה למניפסט. */
(function () {
  if (typeof O === "undefined" || !O) return;
  const K = "kivun-lib-siddur", strip = s => String(s || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|h\d)>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  const D = r => (r && typeof r === "object" && "data" in r) ? r.data : r;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const PRAY = [["שחרית", /שחרית|ברכות השחר|פסוקי דזמרה/], ["מנחה", /מנחה/], ["ערבית", /ערבית|מעריב/]];
  const which = () => { try { const t = typeof zmanim === "function" ? null : null; } catch (e) {} const h = new Date().getHours(); return h < 12 ? 0 : h < 17 ? 1 : 2 };
  let books = null, pref = ""; try { pref = localStorage.getItem(K) || "" } catch (e) {}
  async function findSiddurs() {
    if (books) return books; books = [];
    for (const q of ["סידור", "סדור"]) { try { const l = D(await O.call("library.findBooks", { query: q, limit: 40 })) || []; for (const b of l) if (/^(סידור|סדור)/.test(b.title || "") && !books.some(x => x.title === b.title)) books.push(b) } catch (e) {} }
    return books;
  }
  /* 5.1: כל התפילה, ולא רק 5000 התווים הראשונים — קוראים כל תת-פרק בתוכן העניינים לחוד (section),
     חותכים בכותרת של הבא, ומחזירים גם רשימת פרקים לניווט מהיר */
  async function readPrayer(book, pi) {
    const bid = book.bookId || book.title, toc = D(await O.call("library.getBookToc", { bookId: bid })) || [];
    const flat = []; (function walk(a, lv) { for (const e of a || []) { flat.push({ t: strip(e.text || e.title || ""), lv: e.level ?? lv }); walk(e.children, lv + 1) } })(toc, 1);
    /* 5.2: לא ההתאמה הראשונה — כותרת שמתחילה בשם התפילה ("ערבית", "תפילת ערבית", "סדר מעריב") ובדרגה הגבוהה ביותר.
       WHY: בסידורים רבים "ערבית" מופיע קודם בתוך כותרת אחרת (למשל ספירת העומר אחרי ערבית), ואז לא נמצא כלום */
    const nm = PRAY[pi][0], head = new RegExp("^(סדר |תפילת |תפלת )?(" + (pi === 2 ? "ערבית|מעריב" : pi === 1 ? "מנחה" : "שחרית|ברכות השחר") + ")"), cand = [];
    flat.forEach((e, k) => { if (PRAY[pi][1].test(e.t)) cand.push({ k, sc: (head.test(e.t) ? 0 : 10) + e.lv }) });
    cand.sort((a, b) => a.sc - b.sc || a.k - b.k);
    if (!cand.length) throw "toc";
    const i = cand[0].k;
    let end = flat.findIndex((e, k) => k > i && e.lv <= flat[i].lv && !PRAY[pi][1].test(e.t)); if (end < 0) end = flat.length;
    const parts = flat.slice(i, end), secs = [];
    for (let k = 0; k < parts.length && k < 120; k++) {
      const e = parts[k], nxt = parts[k + 1] || flat[end];
      let txt = "";
      for (let r = 0; r < 6; r++) {
        const c = strip(D(await O.call("library.getBookContent", { bookId: bid, section: e.t, offset: r * 5000, limit: 5000 })) || "");
        if (!c || (r && txt.indexOf(c.slice(0, 200)) >= 0)) break;   // offset לא תמיד יחסי לפרק — לא לחזור על אותו טקסט
        txt += (txt ? "\n" : "") + c;
        if (nxt && nxt.t && txt.indexOf(nxt.t, e.t.length) > 0) break;
        if (c.length < 4900) break;
      }
      if (nxt && nxt.t) { const j = txt.indexOf(nxt.t, e.t.length); if (j > 0) txt = txt.slice(0, j); }
      txt = txt.replace(new RegExp("^\\s*" + e.t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*"), "").trim();
      if (txt || k === 0) secs.push({ t: e.t, text: txt });
    }
    return { title: PRAY[pi][0] + " · " + book.title, text: secs.map(x => x.t + "\n" + x.text).join("\n\n").trim(), secs };
  }
  /* תצוגה עם ניווט צדדי לפרקים */
  function show(r) {
    $("tfTitle").textContent = r.title; const t = $("tfText");
    if (!r.secs || r.secs.length < 2) { t.textContent = r.text; return }
    t.innerHTML = '<div class="pr-wrap"><nav class="pr-nav" aria-label="פרקי התפילה">' + r.secs.map((x, k) => `<button type="button" data-prs="${k}">${esc(x.t)}</button>`).join("") + '</nav><div class="pr-body">' +
      r.secs.map((x, k) => `<h4 id="prs${k}">${esc(x.t)}</h4><div class="pr-t">${esc(x.text)}</div>`).join("") + '</div></div>';
    t.querySelector(".pr-nav").onclick = e => { const b = e.target.closest("[data-prs]"); if (!b) return; t.querySelectorAll(".pr-nav .on").forEach(x => x.classList.remove("on")); b.classList.add("on"); const h = t.querySelector("#prs" + b.dataset.prs); if (h) h.scrollIntoView({ block: "start", behavior: "smooth" }) };
  }
  async function panel(x) {
    if (x.querySelector(".libpr")) return;
    const box = document.createElement("div"); box.className = "libpr"; box.innerHTML = '<p><b>או: הנוסח מספריית אוצריא</b></p><div class="row"><select class="lpB" aria-label="סידור"><option>מחפש סידורים…</option></select><select class="lpP" aria-label="תפילה">' + PRAY.map((p, i) => `<option value="${i}">${p[0]}</option>`).join("") + '</select><button type="button" class="lpGo">הצג</button></div><p class="lpM"><small></small></p>';
    x.appendChild(box); const bs = box.querySelector(".lpB"), ps = box.querySelector(".lpP"), msg = box.querySelector(".lpM small"); ps.value = String(which());
    const l = await findSiddurs();
    if (!l.length) { bs.innerHTML = "<option>לא נמצא סידור בספרייה</option>"; box.querySelector(".lpGo").disabled = true; return }
    bs.innerHTML = l.map((b, i) => `<option value="${i}">${esc(b.title)}</option>`).join(""); const pi = l.findIndex(b => b.title === pref); if (pi >= 0) bs.value = String(pi);
    box.querySelector(".lpGo").onclick = async () => {
      const b = l[+bs.value]; msg.textContent = "קורא מהספרייה…"; try { localStorage.setItem(K, b.title) } catch (e) {}
      try { const r = await readPrayer(b, +ps.value); if (!r.text) throw 0; show(r) }
      catch (e) { msg.textContent = "לא נמצאה התפילה בסידור הזה. נסו סידור אחר, או פתחו אותו בספרייה." }
    };
  }
  window.ktLib = { findSiddurs, readPrayer, show, PRAY, which, panel, get pref() { try { return localStorage.getItem(K) || "" } catch (e) { return "" } }, set pref(v) { try { localStorage.setItem(K, v) } catch (e) {} } }; /* 3.8.0: לסרגל חלון התפילה */
  const t = $("tfText"); if (!t) return;
  new MutationObserver(() => { if (/כדי להציג כאן תפילה/.test(t.textContent) && !t.querySelector(".libpr")) panel(t) }).observe(t, { childList: true });
})();
