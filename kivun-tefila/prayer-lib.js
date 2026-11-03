/* כיוון תפילה 3.7.0 — נוסח התפילה מספריית אוצריא (סעיף 8).
   כשסידורון אינו מותקן או אינו מחזיר תפילה (כמו סידורון 3.8 של המפתח, שאין בו עדיין
   מענה לבקשת "send-prayer"), חלון "תפילה" מציע לקרוא את הנוסח מסידור שבספריית אוצריא:
   library.findBooks → library.getBookToc → library.getBookContent עם section (כותרת מתוכן העניינים).
   ההרשאה library.content.read נוספה למניפסט. */
(function () {
  if (typeof O === "undefined" || !O) return;
  const K = "kivun-lib-siddur", strip = s => String(s || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|h\d)>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  const D = r => (r && typeof r === "object" && "data" in r) ? r.data : r;
  const PRAY = [["שחרית", /שחרית|ברכות השחר|פסוקי דזמרה/], ["מנחה", /מנחה/], ["ערבית", /ערבית|מעריב/]];
  const which = () => { try { const t = typeof zmanim === "function" ? null : null; } catch (e) {} const h = new Date().getHours(); return h < 12 ? 0 : h < 17 ? 1 : 2 };
  let books = null, pref = ""; try { pref = localStorage.getItem(K) || "" } catch (e) {}
  async function findSiddurs() {
    if (books) return books; books = [];
    for (const q of ["סידור", "סדור"]) { try { const l = D(await O.call("library.findBooks", { query: q, limit: 40 })) || []; for (const b of l) if (/^(סידור|סדור)/.test(b.title || "") && !books.some(x => x.title === b.title)) books.push(b) } catch (e) {} }
    return books;
  }
  async function readPrayer(book, pi) {
    const bid = book.bookId || book.title, toc = D(await O.call("library.getBookToc", { bookId: bid })) || [];
    const flat = []; (function walk(a, lv) { for (const e of a || []) { flat.push({ t: strip(e.text || e.title || ""), lv: e.level ?? lv }); walk(e.children, lv + 1) } })(toc, 1);
    const i = flat.findIndex(e => PRAY[pi][1].test(e.t)); if (i < 0) throw "toc";
    const next = flat.slice(i + 1).find(e => e.lv <= flat[i].lv && !PRAY[pi][1].test(e.t));
    let txt = ""; for (let k = 0; k < 8; k++) {
      const c = strip(D(await O.call("library.getBookContent", { bookId: bid, section: flat[i].t, offset: k * 5000, limit: 5000 })) || ""); if (!c) break; txt += (txt ? "\n" : "") + c;
      if (next && next.t && txt.indexOf(next.t, 20) > 0) { txt = txt.slice(0, txt.indexOf(next.t, 20)); break } if (c.length < 4900) break;
    }
    return { title: PRAY[pi][0] + " · " + book.title, text: txt.trim() };
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
      try { const r = await readPrayer(b, +ps.value); if (!r.text) throw 0; $("tfTitle").textContent = r.title; const t = $("tfText"); t.textContent = r.text }
      catch (e) { msg.textContent = "לא נמצאה התפילה בסידור הזה. נסו סידור אחר, או פתחו אותו בספרייה." }
    };
  }
  window.ktLib = { findSiddurs, readPrayer, PRAY, which, panel, get pref() { try { return localStorage.getItem(K) || "" } catch (e) { return "" } }, set pref(v) { try { localStorage.setItem(K, v) } catch (e) {} } }; /* 3.8.0: לסרגל חלון התפילה */
  const t = $("tfText"); if (!t) return;
  new MutationObserver(() => { if (/כדי להציג כאן תפילה/.test(t.textContent) && !t.querySelector(".libpr")) panel(t) }).observe(t, { childList: true });
})();
