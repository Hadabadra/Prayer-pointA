/* כיוון תפילה 2.8 — בחלונית "דיני הכותל":
   1. כפתור "קריעה בכותל": נוסח הפסוקים שאומרים (גמרא מו"ק כו ע"א, כפי שמובא בקובץ) ונקודות קצרות מתוך הקובץ.
   2. "זכר לחורבן וקריעה — כל הנושאים": סיכום הנושאים והשיטות מהקובץ, שמות הפוסקים ומראי המקומות בלבד (בלי ציטוטים), עם חיפוש.
   3. כל מראה מקום (גם בתוכן הקיים של KOTEL_DINIM) נפתח בספריית אוצריא דרך openSrc (extras.js).
   התוסף אינו פוסק הלכה למעשה. */
(function () {
  const body = document.getElementById("kotelBody"); if (!body) return;
  const kBody = document.getElementById("kriaBody") || body, zBody = document.getElementById("zecherBody") || body;
  const F = window.KOTEL_FULL || [];

  /* ---- קיצורים → שם הספר בספרייה. q יכול להכיל כמה חלופות מופרדות ב-| ---- */
  const MAS = { 'מו"ק': "מועד קטן", 'ב"ב': "בבא בתרא", 'ב"ק': "בבא קמא", 'ב"מ': "בבא מציעא", "ברכות": "ברכות", "שבת": "שבת", 'ר"ה': "ראש השנה", "יבמות": "יבמות",
    "תענית": "תענית", "סוטה": "סוטה", "פסחים": "פסחים", "מגילה": "מגילה", "סנהדרין": "סנהדרין", "יומא": "יומא", "זבחים": "זבחים", "גיטין": "גיטין", "שבועות": "שבועות", "ע\"ז": "עבודה זרה", "עירובין": "עירובין" };
  const ON_SA = { 'מ"ב': "משנה ברורה", 'ביה"ל': "ביאור הלכה", 'שעה"צ': "שער הציון", 'מג"א': "מגן אברהם", 'ט"ז': 'ט"ז|טורי זהב', 'ב"י': "בית יוסף אורח חיים", 'ב"ח': 'ב"ח אורח חיים|בית חדש',
    'א"ר': "אליה רבה", 'פמ"ג': "פרי מגדים", 'ערוה"ש': "ערוך השולחן אורח חיים", "כה\"ח": "כף החיים" };
  const SA = new Set(["מחבר", 'רמ"א', 'שו"ע', "שולחן ערוך", 'ש"ע']);
  function resolve(name, ref, sa) {
    name = name.replace(/^(ו?עי'|וכ"כ|כ"כ|הו"ד|מראי מקומות)\s*[–-]?\s*/, "").trim();
    if (SA.has(name)) return /או"ח|אה"ע|יו"ד/.test(ref) ? ["שולחן ערוך", ref] : ["שולחן ערוך אורח חיים", (sa ? "סימן " + sa + " " : "") + ref];
    if (ON_SA[name]) return [ON_SA[name], (sa && !/סי'/.test(ref) ? "סימן " + sa + " " : "") + ref];
    if (name === "גמרא" || name === "גמ'" || name === "תלמוד בבלי") { for (const k in MAS) if (ref.includes(k)) return [MAS[k], ref.replace(/^.*?(דף|דפים)\s*/, "").replace(k, "").trim()]; return ["תלמוד בבלי", ref] }
    for (const k in MAS) if (name === k || name === MAS[k]) return [MAS[k], ref];
    if (/^רמב"ם$/.test(name)) { const m = ref.match(/^(הל'|הלכות)?\s*([^\s]+(?: [^\s]+)?)\s+(פרק.*)$/); return m ? ['רמב"ם הלכות ' + m[2] + "|" + m[2] + ' רמב"ם', m[3]] : ['רמב"ם', ref] }
    if (/^(רי"ף|רא"ש)$/.test(name)) { for (const k in MAS) if (ref.includes(k)) return [name + " " + MAS[k] + "|" + name, ref.replace(k, "").trim()]; }
    return [name, ref];
  }
  /* מראה מקום בנוסח "ספר, חלק, מקום" (התוכן הקיים): הכול חוץ מהחלק האחרון הוא שם הספר */
  function resolveLong(s) {
    s = s.replace(/\s*\(.*?\)\s*/g, " ").trim(); const parts = s.split(/,\s*/);
    if (parts[0] === "תלמוד בבלי" && parts[1]) { const m = parts[1].match(/^(.+?)\s+([^\s]+\s+ע["״]?[אב])$/); return m ? [m[1], m[2]] : [parts[1], ""] }
    if (parts.length < 2) return [s, ""];
    const r = parts.pop(); return [parts.join(" ").replace(/^רמב["״]ם הלכות/, 'רמב"ם הלכות'), r];
  }
  function link(label, q, r) {
    const b = document.createElement("button"); b.type = "button"; b.className = "src kfl"; b.textContent = label; b.dataset.q = q; b.dataset.r = r || "";
    b.title = "פתיחה בספריית אוצריא"; if (typeof O === "undefined" || !O) b.disabled = true;
    const k = q + "@" + (r || ""); if (SEEN.has(k)) b.classList.add("seen");
    b.onclick = () => { if (typeof openSrc === "function") openSrc(q, r); if (!SEEN.has(k)) { SEEN.add(k); kvSet("kivun-seen", [...SEEN].slice(-2000)) } document.querySelectorAll("button.kfl").forEach(x => { if (x.dataset.q + "@" + x.dataset.r === k) x.classList.add("seen") }) };
    return b;
  }

  /* ---- אחסון: מקורות שעיינתי בהם, חיפושים אחרונים ---- */
  const kvGet = async k => { try { let v = typeof O !== "undefined" && O ? await O.call("storage.get", { key: k }) : localStorage.getItem(k); v = v && v.data !== undefined ? v.data : v; return typeof v === "string" ? JSON.parse(v) : v } catch (e) { return null } };
  const kvSet = (k, v) => { try { const s = JSON.stringify(v); typeof O !== "undefined" && O ? O.call("storage.set", { key: k, value: s }).catch(() => {}) : localStorage.setItem(k, s) } catch (e) {} };
  window.kvGet = kvGet; window.kvSet = kvSet;
  const SEEN = new Set(); let RECENT = [];
  kvGet("kivun-seen").then(a => { if (Array.isArray(a)) { a.forEach(x => SEEN.add(x)); document.querySelectorAll("button.kfl").forEach(x => { if (SEEN.has(x.dataset.q + "@" + x.dataset.r)) x.classList.add("seen") }) } });
  kvGet("kivun-recent").then(a => { if (Array.isArray(a)) { RECENT = a; fillRecent() } });

  /* ---- סגנון ---- */
  const css = document.createElement("style");
  css.textContent = `button.kfl{background:none;border:0;padding:0 .1rem;color:var(--color-primary);text-decoration:underline dotted;cursor:pointer;font:inherit}
  button.kfl.seen::after{content:" ✓";font-size:.8em;color:var(--color-on-surface-dim)}
  .kfnav{display:flex;flex-wrap:wrap;gap:.25rem;margin:.3rem 0;max-height:9rem;overflow:auto}.kfnav button{font-size:.8rem;padding:.1rem .45rem;border-radius:999px}
  .kftools{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;margin:.2rem 0}
  button.kfl:disabled{color:inherit;text-decoration:none;cursor:default}
  .kfx{margin:.4rem 0}.kfx h4{margin:.5rem 0 .15rem;font-size:.95rem}.kfx p{margin:.1rem 0}.kfx p.h{font-weight:700;margin-top:.35rem}.kfx p.s{padding-inline-start:.8rem;font-size:.92rem}
  .kfx mark{background:var(--color-tertiary-container,#ffe58a);color:inherit}.kfq{width:100%;box-sizing:border-box;margin:.3rem 0}
  .kria{border:1px solid var(--color-outline);border-radius:10px;padding:.5rem .8rem;margin:.4rem 0}.kria .vs{font-size:1.15rem;font-weight:700;line-height:1.8;margin:.25rem 0}`;
  document.head.appendChild(css);

  /* ---- 3. מראי המקומות בתוכן הקיים נעשים לחיצים ---- */
  function linkify(li) {
    const t = li.textContent, i = t.lastIndexOf(" — "); if (i < 0) return;
    li.textContent = t.slice(0, i + 3);
    t.slice(i + 3).split(/;\s*/).forEach((part, k) => {
      if (k) li.append("; ");
      const j = part.lastIndexOf(" — "), lab = j < 0 ? part : part.slice(j + 3); if (j >= 0) li.append(part.slice(0, j + 3));
      if (/^(קריעה|זכר לחורבן).*נושאים/.test(lab)) { li.append(lab); return }
      const [q, r] = resolveLong(lab); li.append(link(lab, q, r));
    });
  }
  body.querySelectorAll("ul.kd li").forEach(li => { if (!li.querySelector("ul") && li.textContent.includes(" — ")) linkify(li) });

  /* ---- 1. קריעה בכותל ---- */
  const S61 = F.find(s => s.sa === "תקסא");
  const kr = document.createElement("div"); kr.className = "kria";
  /* 2.9.4: הפסוקים בניקוד ובטעמים — ישעיהו סד, ט–י, לפי "מקרא על פי המסורה" (CC-BY-SA) */
  const V = [["הרואה ערי יהודה בחורבנן", "עָרֵ֥י קׇדְשְׁךָ֖ הָי֣וּ מִדְבָּ֑ר"], ["ירושלים בחורבנה", "צִיּוֹן֙ מִדְבָּ֣ר הָיָ֔תָה יְרוּשָׁלַ֖͏ִם שְׁמָמָֽה׃"],
    ["בית המקדש בחורבנו", "בֵּ֧ית קׇדְשֵׁ֣נוּ וְתִפְאַרְתֵּ֗נוּ אֲשֶׁ֤ר הִֽלְל֙וּךָ֙ אֲבֹתֵ֔ינוּ הָיָ֖ה לִשְׂרֵ֣פַת אֵ֑שׁ וְכׇל־מַחֲמַדֵּ֖ינוּ הָיָ֥ה לְחׇרְבָּֽה׃"]];
  kr.innerHTML = "<h3 class='kvh'>מה אומרים בשעת הקריעה</h3>";
  V.forEach(([w, v]) => { const p = document.createElement("p"); p.className = "kvp"; p.innerHTML = "<small></small><span class='vs'></span>"; p.firstChild.textContent = w + ", אומר:"; p.lastChild.textContent = v; kr.appendChild(p) });
  const vs = document.createElement("p"); vs.className = "kvsrc"; vs.append(link("ישעיהו סד, ט–י", "ישעיהו", "סד ט"), " · ", link('גמרא, מו"ק כו ע"א', "מועד קטן", 'כו ע"א'), " · ", link('מעבר לשולחן ערוך — אורח חיים, סימן תקסא', "שולחן ערוך אורח חיים", "סימן תקסא")); kr.appendChild(vs);
  if (S61) {
    const h = document.createElement("h3"); h.style.margin = ".6rem 0 .2rem"; h.textContent = "בקצרה"; kr.appendChild(h);
    const ul = document.createElement("ul"); ul.className = "kd";
    const PICK = ["מקום הקריעה.", "בזמנינו.", "כותל המערבי.", "קריעת בגדו - סעיף ד'.", "זמני הקריעה.", "תושבי ירושלים - סעיף ה'.", "שבת."];
    for (const tp of S61.topics) { if (!PICK.includes(tp.t)) continue;
      const li = document.createElement("li"); li.className = "kd0"; li.textContent = tp.t.replace(/\.$/, ""); const sub = document.createElement("ul");
      tp.lines.filter(l => l[0] === "h").slice(0, 4).forEach(l => { const x = document.createElement("li"); x.textContent = l[1]; sub.appendChild(x) });
      li.appendChild(sub); ul.appendChild(li) }
    kr.appendChild(ul);
  }
  const kn = document.createElement("p"); kn.innerHTML = "<small>הנקודות מתוך החיבור \"דור המלקטים\". הפירוט, השיטות ומראי המקומות בכפתור \"זכר לחורבן\" שבסרגל העליון. התוסף אינו פוסק הלכה למעשה; לשאלה במקרה מסוים יש לפנות לרב מוסמך.</small>"; kr.appendChild(kn);
  kBody.appendChild(kr);

  /* ---- 2. כל הנושאים, עם חיפוש ---- */
  if (!F.length) return;
  const d = document.createElement("details"); d.className = "sd"; d.open = true;
  const sm = document.createElement("summary"); sm.innerHTML = "<b>זכר לחורבן וקריעה — כל הנושאים והמקורות</b>"; d.appendChild(sm);
  const q = document.createElement("input"); q.type = "search"; q.className = "kfq"; q.placeholder = "חיפוש: נושא, פוסק או מילה (למשל: נגיעה, שבת, מ\"ב)"; q.setAttribute("aria-label", "חיפוש בהלכות");
  const cnt = document.createElement("p"); cnt.style.cssText = "font-size:.85rem;margin:.1rem 0"; cnt.setAttribute("aria-live", "polite");
  const out = document.createElement("div"); out.className = "kfx";
  const nt = document.createElement("p"); nt.innerHTML = "<small>מתוך החיבור \"דור המלקטים\" (סימנים תק\"ס–תקס\"א). מוצגים שמות הפוסקים ומראי המקומות בלבד; לחיצה על מקור פותחת אותו בספריית אוצריא. התוסף אינו פוסק הלכה למעשה.</small>";
  const dl = document.createElement("datalist"); dl.id = "kfRecent"; q.setAttribute("list", "kfRecent");
  function fillRecent() { dl.replaceChildren(...RECENT.map(x => { const o = document.createElement("option"); o.value = x; return o })) }
  const tools = document.createElement("div"); tools.className = "kftools";
  const bOpen = document.createElement("button"), bClose = document.createElement("button"), bPr = document.createElement("button"), bPdf = document.createElement("button");
  bOpen.textContent = "פתח הכול"; bClose.textContent = "סגור הכול"; bPr.textContent = "🖨 הדפסת הפתוח"; bPdf.textContent = "PDF של הפתוח";
  [bOpen, bClose, bPr, bPdf].forEach(b => { b.type = "button"; tools.appendChild(b) });
  const nav = document.createElement("nav"); nav.className = "kfnav"; nav.setAttribute("aria-label", "ניווט בנושאים");
  d.append(nt, q, dl, tools, nav, cnt, out); zBody.appendChild(d);
  bOpen.onclick = () => out.querySelectorAll("details").forEach(x => { x.open = true; x.dispatchEvent(new Event("toggle")) });
  bClose.onclick = () => out.querySelectorAll("details").forEach(x => x.open = false);
  function printOpen(pdf) {
    const open = [...out.querySelectorAll("details[open]")]; if (!open.length) { cnt.textContent = "פתחו נושא אחד או יותר (או חפשו), ואז הדפיסו."; return }
    const ph = document.getElementById("printHead"); if (!ph) return;
    let h = "<h1>זכר לחורבן וקריעה</h1>" + (q.value.trim() ? `<p>חיפוש: <b>${esc(q.value.trim())}</b></p>` : "");
    for (const x of open) { h += `<h2>${esc(x.querySelector("summary").textContent)}</h2>`; x.querySelectorAll(":scope > p").forEach(p => h += `<p>${esc(p.textContent)}</p>`) }
    ph.innerHTML = h + "<p><small>מתוך החיבור \"דור המלקטים\" (סימנים תק\"ס–תקס\"א). שמות הפוסקים ומראי המקומות בלבד. התוסף אינו פוסק הלכה למעשה.</small></p>";
    document.body.classList.add("printfly"); window.__pdf = !!pdf;
    Promise.resolve(typeof printNow === "function" ? printNow() : window.print()).catch(() => {}).finally(() => setTimeout(() => document.body.classList.remove("printfly"), 1500));
  }
  bPr.onclick = () => printOpen(false); bPdf.onclick = () => printOpen(true);

  const esc = s => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  function line(l, sa, rx) {
    const p = document.createElement("p"); p.className = l[0];
    if (!l[2]) { p.innerHTML = rx ? esc(l[1]).replace(rx, "<mark>$&</mark>") : esc(l[1]); return p }
    let s = l[1], at = 0;
    for (const [n, r] of l[2]) {
      const tok = n + " (" + r + ")", i = s.indexOf(tok, at); if (i < 0) continue;
      if (i > at) p.append(s.slice(at, i));
      const [bq, br] = resolve(n, r, sa); p.append(link(tok, bq, br)); at = i + tok.length;
    }
    if (at < s.length) p.append(s.slice(at));
    if (rx) p.querySelectorAll("button").forEach(b => { if (rx.test(b.textContent)) b.style.background = "var(--color-tertiary-container,#ffe58a)"; rx.lastIndex = 0 });
    return p;
  }
  function render() {
    nav.replaceChildren(); let NAVN = 0;
    const w = q.value.trim(), rx = w ? new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g") : null; out.replaceChildren(); let hits = 0;
    for (const s of F) {
      const h = document.createElement("h3"); h.style.margin = ".6rem 0 .2rem"; h.textContent = s.siman + (s.sa === "תקס" ? " — זכר לחורבן" : " — קריעה על החורבן");
      /* 2.9.3: ניווט מחולק לפי סימן, עם קפיצה לראש הסימן */
      const ng = document.createElement("b"); ng.style.cssText = "display:block;width:100%;margin:.3rem 0 .1rem";
      const nj = document.createElement("button"); nj.type = "button"; nj.textContent = "⬇ " + h.textContent; nj.style.fontWeight = "700";
      nj.onclick = () => h.scrollIntoView({ behavior: "smooth", block: "start" }); ng.appendChild(nj); nav.appendChild(ng);
      let any = false; const box = document.createDocumentFragment();
      for (const tp of s.topics) {
        const ls = w ? tp.lines.filter(l => l[1].includes(w) || tp.t.includes(w)) : tp.lines; if (!ls.length) continue;
        any = true; hits += w ? ls.length : 0;
        const td = document.createElement("details"); td.open = !!w; td.id = "kft" + (NAVN++);
        const nb = document.createElement("button"); nb.type = "button"; nb.textContent = tp.t.replace(/\.$/, "").replace(/ - סעיף.*$/, ""); nb.title = s.siman;
        nb.onclick = () => { td.open = true; td.dispatchEvent(new Event("toggle")); td.scrollIntoView({ behavior: "smooth", block: "start" }) }; nav.appendChild(nb); const ts = document.createElement("summary"); ts.innerHTML = "<b></b>"; ts.firstChild.textContent = tp.t.replace(/\.$/, ""); td.appendChild(ts);
        const lazy = () => { if (td.dataset.f) return; td.dataset.f = 1; ls.forEach(l => td.appendChild(line(l, s.sa, rx))) };
        if (td.open) lazy(); else td.addEventListener("toggle", lazy);
        box.appendChild(td);
      }
      if (any) { out.append(h, box) }
    }
    cnt.textContent = w ? (hits ? `${hits} תוצאות` : "לא נמצאו תוצאות") : "";
  }
  let T = 0, T2 = 0; q.oninput = () => { clearTimeout(T); T = setTimeout(render, 200); clearTimeout(T2);
    T2 = setTimeout(() => { const v = q.value.trim(); if (v.length < 2) return; RECENT = [v, ...RECENT.filter(x => x !== v && !v.startsWith(x))].slice(0, 10); kvSet("kivun-recent", RECENT); fillRecent() }, 1500) };
  d.addEventListener("toggle", () => { if (d.open && !out.firstChild) render() }, { once: false });
  const zp = document.getElementById("zecher"); if (zp) new MutationObserver(() => { if (!zp.hidden && !out.firstChild) render() }).observe(zp, { attributes: true, attributeFilter: ["hidden"] });
})();
