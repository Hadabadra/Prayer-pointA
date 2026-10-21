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
    const r = (s.__btn || s).getBoundingClientRect(), h = box.offsetHeight, below = innerHeight - r.bottom;
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
  /* 2.9.7: הרשימה הכפולה חזרה לפעמים — גם click ו-pointerdown נחסמים על <select>, ופתיחה במקלדת
     (רווח, Enter, F4, Alt+חץ למטה) פותחת את הרשימה של הדף ולא את החלון של Windows. ניווט בחיצים בתוך הרשימה. */
  const own = s => s && !s.multiple && !(s.size > 1) && !s.disabled && s.dataset.native == null;
  ["click", "dblclick"].forEach(t => document.addEventListener(t, e => { const s = e.target.closest && e.target.closest("select"); if (own(s)) e.preventDefault() }, true));
  document.addEventListener("keydown", e => {
    if (box) {
      const items = [...box.querySelectorAll("div[role=option]:not(.d)")], k = box.querySelector(".k") || box.querySelector(".s"); let i = items.indexOf(k);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); i = Math.max(0, Math.min(items.length - 1, i + (e.key === "ArrowDown" ? 1 : -1))); items.forEach(x => x.classList.remove("k")); if (items[i]) { items[i].classList.add("k"); items[i].scrollIntoView({ block: "nearest" }) } return }
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const t = box.querySelector(".k"); if (t) t.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true })); else close(); return }
      if (e.key === "Escape" || e.key === "Tab") { if (e.key === "Escape") e.preventDefault(); close() }
      return;
    }
    const s = e.target && e.target.tagName === "SELECT" ? e.target : null;
    if (own(s) && (e.key === " " || e.key === "Enter" || e.key === "F4" || (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp")))) { e.preventDefault(); open(s) }
  }, true);
  addEventListener("resize", close); addEventListener("blur", close);
  let opened = 0; const _o = open; open = s => { _o(s); opened = Date.now() };
  document.addEventListener("scroll", e => { if (box && !box.contains(e.target) && Date.now() - opened > 300) close() }, true);
})();
/* 3.1.0: דיווח (גרסה 3.0.4): במחשבים מסוימים הרשימות עדיין לא נבחרות בעכבר — החלון של Windows נפתח בכל זאת.
   הפתרון המלא: ה-<select> עצמו מוסתר ובמקומו כפתור שנראה כמו רשימה; העכבר אף פעם לא נוגע ב-<select>,
   ולכן החלון של Windows לא יכול להיפתח. ה-<select> נשאר המקור לערך ולאירועי change. */
(function () {
  const css = document.createElement("style");
  css.textContent = `.sfxb{display:inline-flex;align-items:center;justify-content:space-between;gap:.5em;text-align:start;min-width:6em;font:inherit;cursor:pointer}
  .sfxb[hidden]{display:none !important}.sfxb::after{content:"⌄";opacity:.7}.sfxp{position:absolute !important;opacity:0 !important;pointer-events:none !important;width:1px !important;height:1px !important;overflow:hidden !important}`;
  document.head.appendChild(css);
  const own = s => s && !s.multiple && !(s.size > 1) && s.dataset.native == null && !s.closest("#mapFullBar,.sfx");
  const list = [];
  function wrap(s) {
    if (s.__sfx || !own(s)) return; s.__sfx = 1;
    const b = document.createElement("button"); b.type = "button"; b.className = "sfxb"; b.setAttribute("aria-haspopup", "listbox");
    const lab = s.getAttribute("aria-label"); if (lab) b.setAttribute("aria-label", lab); if (s.title) b.title = s.title;
    s.__btn = b; s.after(b); s.classList.add("sfxp"); s.tabIndex = -1;
    b.onclick = e => { e.preventDefault(); if (s.disabled) return;
      /* פותחים את הרשימה של הדף (selfix) ליד הכפתור */
      s.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true })) };
    b.onkeydown = e => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); const i = Math.max(0, Math.min(s.options.length - 1, s.selectedIndex + (e.key === "ArrowDown" ? 1 : -1))); if (i !== s.selectedIndex) { s.selectedIndex = i; s.dispatchEvent(new Event("change", { bubbles: true })) } } };
    list.push([s, b]); sync(s, b);
  }
  function sync(s, b) {
    const o = s.options[s.selectedIndex]; const t = o ? (o.label || o.text) : ""; if (b.firstChild ? b.textContent !== t : t) b.textContent = t;
    b.hidden = s.hidden; b.style.display = s.style.display === "none" ? "none" : "";
    b.disabled = s.disabled;
  }
  const all = () => document.querySelectorAll("select").forEach(wrap);
  all(); new MutationObserver(all).observe(document.body, { childList: true, subtree: true });
  document.addEventListener("change", e => { const p = list.find(x => x[0] === e.target); if (p) sync(p[0], p[1]) }, true);
  setInterval(() => list.forEach(p => sync(p[0], p[1])), 400);
})();
