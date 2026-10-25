/* 3.3.1 — כותרת קבועה עם שם וכפתור סגירה לכל חלונית צד */
(function init() {
  if (document.readyState !== "complete") return addEventListener("load", init, { once: true });
  const P = [["set", "bSet", "הגדרות", "Settings"], ["dlp", "bDl", "הורדות", "Downloads"], ["hal", "bHal", "הלכות", "Halachot"], ["help", "bHelp", "זיהוי ידני", "Find direction"], ["fb", "bFb", "אודות והארות", "About & feedback"], ["minyan", "bMin", "מניינים", "Minyanim"], ["fly", "bFly", "טיסה", "Flight"], ["kotel", "bKotel", "דיני הכותל", "Kotel laws"], ["visits", "bVis", "הביקורים שלי בכותל", "My Kotel visits"]];
  const en = () => document.documentElement.lang === "en";
  P.forEach(([id, btn, he, enT]) => {
    const p = document.getElementById(id); if (!p || p.querySelector(":scope>.pnlHd")) return;
    if (p.querySelector(":scope>h2,:scope>h3.ph")) { const h = p.querySelector(":scope>h2,:scope>h3.ph"); h.remove() }
    const hd = document.createElement("div"); hd.className = "pnlHd";
    const h = document.createElement("h2"); h.textContent = en() ? enT : he; h.dataset.he = he; h.dataset.en = enT;
    const x = document.createElement("button"); x.type = "button"; x.className = "pnlX"; x.setAttribute("aria-label", "סגור"); x.textContent = "✕";
    x.onclick = () => { const b = document.getElementById(btn); if (b && !p.hidden) b.click(); if (!p.hidden) p.hidden = true };
    hd.append(h, x); p.prepend(hd);
  });
  new MutationObserver(() => document.querySelectorAll(".pnlHd h2").forEach(h => h.textContent = en() ? h.dataset.en : h.dataset.he)).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
