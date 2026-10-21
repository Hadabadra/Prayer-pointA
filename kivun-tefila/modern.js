/* כיוון תפילה 3.2.0 — עיצוב מחודש (נטען אחרון, אחרי v31.js)
   1. סמלים קוויים אחידים בסרגל העליון במקום אימוג'י, וקבוצות כפתורים עם מפרידים.
   2. "קריעה בכותל": הדפסה / PDF של נוסח הקריעה עם רקע הכותל.
   3. "עינים למקרא": כפתורים שפותחים חלק מסוים (בית המקדש, ארכיאולוגיה — הכותל הישן).
   4. הרחבת חלונית צד: החלונית הרחבה מונחת מעל הדף ואינה מכווצת את המפה והחוגה. */
(function () {
  const $ = id => document.getElementById(id);
  const bar = $("bar");
  if (!bar) return;

  /* ---------- 1. סמלים ---------- */
  const P = {
    bOn: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7"/>',
    bGps: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    bManT: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    bTfila: '<path d="M4 19V6a2 2 0 0 1 2-2h12v15H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h12"/><path d="M9 8h6M9 11h4"/>',
    bHal: '<path d="M12 3l8 4v2H4V7z"/><path d="M6 9v8M10 9v8M14 9v8M18 9v8M3 20h18"/>',
    bKotel: '<rect x="3" y="5" width="18" height="15" rx="1"/><path d="M3 10h18M3 15h18M9 5v5M15 5v5M6 10v5M12 10v5M18 10v5M9 15v5M15 15v5"/>',
    bKria: '<circle cx="6" cy="7" r="2.5"/><circle cx="6" cy="17" r="2.5"/><path d="M8 8.5L20 17M8 15.5L20 7"/>',
    bVis: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M9 15l2 2 4-4"/>',
    bZecher: '<path d="M12 3c-3 4 3 5 0 9"/><path d="M8 21h8l-1-6H9z"/><path d="M7 15h10"/>',
    bMin: '<path d="M3 21V10l9-6 9 6v11z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/><path d="M12 7.2l1.6 2.8h-3.2zM12 12.4l-1.6-2.8h3.2z"/>',
    bFly: '<path d="M10.5 21l1.5-1 0-5.5 8 2.5v-2l-8-5V4.5a1.5 1.5 0 0 0-3 0V10l-8 5v2l8-2.5V20l1.5 1"/>',
    bPrint: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    bHelp: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    bDl: '<path d="M12 4v11M7 10l5 5 5-5"/><path d="M4 19h16"/>',
    bSet: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    bFb: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    bMore: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
  };
  /* כפתורים שמוצגים כסמל בלבד (התיאור במעבר העכבר) */
  const ICONLY = new Set(["bVis", "bMin", "bPrint", "bDl", "bSet", "bFb", "bMore"]);
  const svg = d => '<svg class="bi" viewBox="0 0 24 24" width="1.15em" height="1.15em" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + d + "</svg>";
  /* האימוג'י שבראש הטקסט יורד; הטקסט נשאר כצומת טקסט כדי שהתרגום לאנגלית ימשיך לעבוד */
  const strip = b => { for (const n of [...b.childNodes]) if (n.nodeType === 3) n.textContent = n.textContent.replace(/^[\s✂✈🗓⬇⚙ⓘ⋯]+/u, "") };
  function deco(id) {
    const b = $(id); if (!b || !P[id]) return;
    if (b.querySelector(":scope > svg.bi")) return;
    if (ICONLY.has(id)) { if (!b.title) b.title = b.getAttribute("aria-label") || b.textContent.trim(); if (!b.getAttribute("aria-label")) b.setAttribute("aria-label", b.title); b.innerHTML = svg(P[id]); b.classList.add("ico"); return }
    b.querySelectorAll(":scope > svg").forEach(s => s.remove()); strip(b);
    if (!b.querySelector(":scope > .bl")) { const sp = document.createElement("span"); sp.className = "bl"; [...b.childNodes].forEach(n => sp.appendChild(n)); b.appendChild(sp) }
    if (!b.title) b.title = b.textContent.trim();
    b.insertAdjacentHTML("afterbegin", svg(P[id]));
  }
  Object.keys(P).forEach(deco);
  /* קוד אחר משנה לפעמים את textContent ומוחק את הסמל — מחזירים אותו */
  new MutationObserver(m => m.forEach(r => { const b = r.target.closest && r.target.closest("button"); if (b && P[b.id]) deco(b.id) }))
    .observe(bar, { childList: true, subtree: true });

  /* כותרת עם סמל מצפן */
  const ttl = bar.querySelector(":scope > strong");
  if (ttl && !ttl.querySelector("svg")) { ttl.classList.add("ttl"); ttl.insertAdjacentHTML("afterbegin", '<svg class="logo" viewBox="0 0 24 24" width="1.35em" height="1.35em" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 5.5l2.6 6.5L12 18.5 9.4 12z" fill="currentColor" fill-opacity=".9"/></svg>') }

  /* קבוצות: מיקום | תפילה והלכה | כלים | מערכת */
  const sep = after => { const e = $(after); if (!e || (e.nextElementSibling && e.nextElementSibling.classList.contains("bsep"))) return; const s = document.createElement("span"); s.className = "bsep"; s.setAttribute("aria-hidden", "true"); e.after(s) };
  ["methBtn", "bZecher", "bHelp"].forEach(sep);
  const spacer = document.createElement("span"); spacer.className = "bspc"; spacer.setAttribute("aria-hidden", "true");
  if ($("bDl")) $("bDl").before(spacer);

  /* ---------- 2. הדפסת נוסח הקריעה עם רקע הכותל ---------- */
  const kria = $("kria"), kb = $("kriaBody");
  if (kria && kb && !$("kriaPr")) {
    const row = document.createElement("div"); row.className = "kprt";
    const bp = document.createElement("button"), bf = document.createElement("button");
    bp.type = bf.type = "button"; bp.id = "kriaPr"; bf.id = "kriaPdf";
    bp.innerHTML = svg(P.bPrint) + "<span>הדפסת נוסח הקריעה</span>"; bf.innerHTML = "<span>PDF עם הרקע</span>";
    row.append(bp, bf);
    const at = kb.querySelector(".kvsrc"); if (at) at.after(row); else kb.appendChild(row);
    const go = pdf => {
      document.body.classList.add("printkria"); window.__pdf = !!pdf;
      Promise.resolve(typeof printNow === "function" ? printNow() : window.print()).catch(() => {})
        .finally(() => setTimeout(() => document.body.classList.remove("printkria"), 1500));
    };
    bp.onclick = () => go(false); bf.onclick = () => go(true);
  }

  /* ---------- 3. עינים למקרא — פתיחת חלק מסוים ---------- */
  const EYES = "com.chadbedera.madaeihatanach";
  const eyes = [...document.querySelectorAll("button")].find(b => /פתח את "עינים למקרא"/.test(b.textContent));
  if (eyes && !$("eyMik")) {
    const wrap = document.createElement("div"); wrap.className = "eyes";
    const mk = (id, label, section, title) => {
      const b = document.createElement("button"); b.type = "button"; b.id = id; b.textContent = label; b.title = title;
      b.onclick = () => {
        if (typeof O === "undefined" || !O) return;
        /* הפרמטר נקרא בעינים למקרא (Hadabadra/madaei-hatanach#173); גרסה שאינה מכירה אותו פותחת את דף הבית */
        O.call("plugin.openOther", { pluginId: EYES, param: { type: "open-section", section, from: "com.shiachrina.kivuntefila" } })
          .then(r => { if (r && r.success === false) throw 0 }).catch(() => eyes.click());
      };
      return b;
    };
    wrap.append(
      mk("eyMik", "בית המקדש", "temple-guide", "פתח בעינים למקרא את העמוד של בית המקדש"),
      mk("eyArch", "ארכיאולוגיה — הכותל הישן", "kotel-archaeology", "פתח בעינים למקרא את הארכיאולוגיה, עם תמונת הכותל הישן")
    );
    eyes.classList.add("eyMain"); eyes.after(wrap); wrap.prepend(eyes);
  }


  /* ---------- 5. מצב לילה (גובר על צבעי אוצריא; נשמר במחשב) ---------- */
  const root = document.documentElement, NK = "kivun-night";
  const nb = document.createElement("button"); nb.id = "bNight"; nb.type = "button"; nb.className = "ico";
  const moon = svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'), sun = svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>');
  function night(on, save) {
    root.classList.toggle("night", on); nb.innerHTML = on ? sun : moon;
    nb.title = on ? "מצב יום" : "מצב לילה"; nb.setAttribute("aria-label", nb.title); nb.setAttribute("aria-pressed", String(on));
    if (save) { try { localStorage.setItem(NK, on ? "1" : "0") } catch (e) {} try { if (typeof O !== "undefined" && O) O.call("storage.set", { key: NK, value: on ? "1" : "0" }).catch(() => {}) } catch (e) {} }
  }
  nb.onclick = () => night(!root.classList.contains("night"), true);
  let n0 = false; try { n0 = localStorage.getItem(NK) === "1" } catch (e) {}
  night(n0, false);
  try { if (typeof O !== "undefined" && O) O.call("storage.get", { key: NK }).then(r => { const v = r && (r.data !== undefined ? r.data : r); const x = v && v.value !== undefined ? v.value : v; if (x === "1" || x === "0") night(x === "1", false) }).catch(() => {}) } catch (e) {}
  if ($("bLang")) $("bLang").before(nb); else bar.appendChild(nb);

  /* ---------- 6. יום ותאריך עברי ברווח שבסרגל ---------- */
  const gem = n => { const L = [[400,"ת"],[300,"ש"],[200,"ר"],[100,"ק"],[90,"צ"],[80,"פ"],[70,"ע"],[60,"ס"],[50,"נ"],[40,"מ"],[30,"ל"],[20,"כ"],[10,"י"],[9,"ט"],[8,"ח"],[7,"ז"],[6,"ו"],[5,"ה"],[4,"ד"],[3,"ג"],[2,"ב"],[1,"א"]]; let r = ""; n %= 1000;
    for (const [v, c] of L) while (n >= v) { if (n === 15) { r += "טו"; n = 0; break } if (n === 16) { r += "טז"; n = 0; break } r += c; n -= v }
    return r.length > 1 ? r.slice(0, -1) + "״" + r.slice(-1) : r + "׳" };
  function today() {
    const d = new Date();
    try {
      const day = new Intl.DateTimeFormat("he", { weekday: "long" }).format(d);
      const pr = new Intl.DateTimeFormat("he-u-ca-hebrew", { day: "numeric", month: "long", year: "numeric" }).formatToParts(d);
      const g = t => (pr.find(x => x.type === t) || {}).value || "";
      const s = day + " · " + gem(+g("day")) + " " + g("month").replace(/^ב?/, "ב") + " " + gem(+g("year"));
      spacer.textContent = s; spacer.title = d.toLocaleDateString("he-IL");
    } catch (e) { spacer.textContent = "" }
  }
  spacer.classList.add("bdate"); today(); setInterval(today, 60000);

  /* ---------- 7. הודעות ארוכות לא נכנסות לכרטיס החוגה ---------- */
  const txt = $("txt"), main = document.querySelector("main");
  if (txt && main) {
    const note = document.createElement("div"); note.id = "mNote"; note.hidden = true; note.setAttribute("role", "status");
    const nt = document.createElement("span"), nx = document.createElement("button"); nx.type = "button"; nx.textContent = "✕"; nx.setAttribute("aria-label", "סגור את ההודעה"); nx.onclick = () => note.hidden = true;
    note.append(nt, nx); const pr = $("plRow"); (pr || main.firstChild).after(note);
    let last = txt.textContent, busy = false;
    new MutationObserver(() => {
      if (busy) return; const t = txt.textContent.trim();
      if (t.length > 90 || txt.querySelector("button")) {
        busy = true; nt.replaceChildren(...[...txt.childNodes].map(n => n)); note.hidden = false; txt.textContent = last; busy = false;
      } else last = txt.textContent;
    }).observe(txt, { childList: true, characterData: true, subtree: true });
  }
  /* ---------- 4. חלונית רחבה מונחת מעל הדף ---------- */
  document.querySelectorAll(".pop .wideb").forEach(b => {
    b.innerHTML = '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg>';
  });
})();
