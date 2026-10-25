/* 3.3.1 — כותרת קבועה עם שם וכפתור סגירה לכל חלונית צד */
(function init() {
  if (document.readyState !== "complete") return addEventListener("load", init, { once: true });
  const P = [["set", "bSet", "הגדרות", "Settings"], ["dlp", "bDl", "הורדות", "Downloads"], ["hal", "bHal", "הלכות", "Halachot"], ["help", "bHelp", "זיהוי ידני", "Find direction"], ["fb", "bFb", "אודות והארות", "About & feedback"], ["minyan", "bMin", "מניינים", "Minyanim"], ["fly", "bFly", "טיסה", "Flight"], ["kotel", "bKotel", "דיני הכותל", "Kotel laws"], ["visits", "bVis", "הביקורים שלי בכותל", "My Kotel visits"]];
  const en = () => document.documentElement.lang === "en";
  const add = ([id, btn, he, enT]) => {
    const p = document.getElementById(id); if (!p || p.querySelector(":scope>.pnlHd")) return;
    p.querySelectorAll(":scope>h2,:scope>h3.ph,:scope>h3:first-child").forEach(h => h.hidden = true);
    const d0 = p.querySelector(":scope>details:first-of-type>summary"); if (d0 && /^\s*(הורדות|Downloads)\s*$/.test(d0.textContent)) d0.parentElement.open = true, d0.hidden = true;
    const hd = document.createElement("div"); hd.className = "pnlHd";
    const h = document.createElement("h2"); h.textContent = en() ? enT : he; h.dataset.he = he; h.dataset.en = enT;
    const x = document.createElement("button"); x.type = "button"; x.className = "pnlX"; x.setAttribute("aria-label", "סגור"); x.textContent = "✕";
    x.onclick = () => { const b = document.getElementById(btn); if (b && !p.hidden) b.click(); if (!p.hidden) p.hidden = true };
    hd.append(h, x); p.prepend(hd);
  };
  P.forEach(add);
  P.forEach(a => { const p = document.getElementById(a[0]); if (p) new MutationObserver(() => add(a)).observe(p, { childList: true, attributes: true, attributeFilter: ["hidden"] }) });
  new MutationObserver(() => document.querySelectorAll(".pnlHd h2").forEach(h => h.textContent = en() ? h.dataset.en : h.dataset.he)).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
