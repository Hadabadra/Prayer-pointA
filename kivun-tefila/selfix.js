/* כיוון תפילה — רשימות בחירה שעובדות בעכבר בכל מחשב.
   בתוך אוצריא (WebView2 ב-Windows) הרשימה הנפתחת של <select> נפתחת לפעמים כחלון נפרד, והלחיצה בעכבר "עוברת" לדף שמתחת:
   הבחירה לא נקלטת, ובמקשים הרשימה נפתחת פעמיים. כאן מחליפים את הרשימה הנפתחת ברשימה של הדף עצמו.
   ה-<select> נשאר המקור לערך: המקלדת (חיצים, Enter, Tab) עובדת כרגיל, ובחירה בעכבר שולחת אירוע change רגיל. */
(function () {
  let box = null, cur = null;
  const css = document.createElement("style");
  css.textContent = `.sfx{position:fixed;z-index:99999;max-height:min(60vh,22rem);overflow:auto;background:var(--color-surface-container-highest,#fff);color:var(--color-on-surface,#000);
    border:1px solid var(--color-outline,#888);border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.25);padding:.2rem 0;font:inherit;min-width:8rem}
  .sfx div{padding:.35rem .8rem;cursor:pointer;white-space:nowrap}.sfx div:hover,.sfx div.k{background:var(--color-primary-container,#dde)}
  .sfx div.s{font-weight:700}.sfx div.d{opacity:.45;cursor:default}.sfx .g{font-size:.8em;opacity:.7;cursor:default;padding-top:.5rem}`;
  document.head.appendChild(css);
  function close() { if (box) { box.remove(); box = null } if (cur) { const s = cur; cur = null; try { s.focus({ preventScroll: true }) } catch (e) {} } }
  function pick(s, v) { close(); if (s.value === v) return; s.value = v; s.dispatchEvent(new Event("input", { bubbles: true })); s.dispatchEvent(new Event("change", { bubbles: true })) }
  function open(s) {
    close(); cur = s; box = document.createElement("div"); box.className = "sfx"; box.setAttribute("role", "listbox"); box.dir = getComputedStyle(s).direction;
    const add = (o) => { const d = document.createElement("div"); d.textContent = o.label || o.text; d.setAttribute("role", "option");
      if (o.disabled) d.className = "d"; else { if (o.value === s.value) d.className = "s"; d.onmousedown = e => { e.preventDefault(); e.stopPropagation(); pick(s, o.value) } }
      box.appendChild(d) };
    for (const c of s.children) { if (c.tagName === "OPTGROUP") { const g = document.createElement("div"); g.className = "g"; g.textContent = c.label; box.appendChild(g); for (const o of c.children) add(o) } else add(c) }
    document.body.appendChild(box);
    const r = s.getBoundingClientRect(), h = box.offsetHeight, below = innerHeight - r.bottom;
    box.style.minWidth = Math.max(r.width, 128) + "px";
    box.style.top = (below >= h || below >= r.top ? r.bottom + 2 : Math.max(4, r.top - h - 2)) + "px";
    const w = box.offsetWidth; box.style.left = Math.min(Math.max(4, box.dir === "rtl" ? r.right - w : r.left), innerWidth - w - 4) + "px";
    const sel = box.querySelector(".s"); if (sel) sel.scrollIntoView({ block: "nearest" });
  }
  document.addEventListener("mousedown", e => {
    const s = e.target.closest && e.target.closest("select");
    if (box && !box.contains(e.target)) { const was = cur; close(); if (s && s === was) { e.preventDefault(); return } }
    if (!s || s.multiple || s.size > 1 || s.disabled || s.dataset.native != null) return;
    e.preventDefault(); s.focus({ preventScroll: true }); open(s);
  }, true);
  document.addEventListener("keydown", e => { if (box && (e.key === "Escape" || e.key === "Tab")) { if (e.key === "Escape") e.preventDefault(); close() } }, true);
  addEventListener("resize", close); addEventListener("blur", close);
  document.addEventListener("scroll", e => { if (box && !box.contains(e.target)) close() }, true);
})();
