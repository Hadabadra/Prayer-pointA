/* 3.3.0 — הסרגל העליון תמיד בשורה אחת: כפתורים שלא נכנסים עוברים לתפריט "עוד" (⋯) */
(function init() {
  if (!document.getElementById("bMore") && document.readyState !== "complete") return addEventListener("load", init, { once: true });
  const bar = document.getElementById("bar");
  const more = document.getElementById("bMore");
  if (!bar || !more) return;
  const KEEP = new Set(["bOn", "bMore", "bManT"]);
  const menu = document.createElement("div");
  menu.id = "ovfMenu"; menu.className = "pop"; menu.hidden = true; menu.setAttribute("role", "menu");
  document.body.appendChild(menu);

  const items = () => [...bar.children].filter(e => e.tagName === "BUTTON" && !KEEP.has(e.id) && !e.hidden && e.getAttribute("data-merged") !== "1");
  let busy = false;
  function fit() {
    if (busy) return; busy = true;
    const list = items();
    list.forEach(e => e.classList.remove("ovf"));
    more.classList.remove("need");
    if (bar.scrollWidth > bar.clientWidth + 1) {
      more.classList.add("need");
      const ORDER = ["bHelp", "bPrint", "bFb", "bDl", "bMin", "bFly", "bZecher", "bKria", "bKotel", "bVis", "bEyes", "bHal", "bPray", "bSid", "bTfila", "bGps", "bNight", "bLang", "methBtn", "bSet", "bFind", "bPcT"];
      const rank = e => { const i = ORDER.indexOf(e.id); return i < 0 ? 99 : i };
      const q = list.slice().sort((a, b) => rank(a) - rank(b));
      for (let i = 0; i < q.length && bar.scrollWidth > bar.clientWidth + 1; i++) q[i].classList.add("ovf");
    }
    if (!menu.hidden) build();
    busy = false;
  }
  function build() {
    menu.textContent = "";
    items().filter(e => e.classList.contains("ovf")).forEach(src => {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("role", "menuitem");
      b.innerHTML = src.innerHTML;
      const lbl = (src.querySelector(".bl") || {}).textContent || src.title || src.getAttribute("aria-label") || src.textContent;
      if (!src.querySelector(".bl")) { const s = document.createElement("span"); s.textContent = lbl; b.appendChild(s) }
      b.querySelectorAll(".bl").forEach(x => x.style.display = "inline");
      b.onclick = ev => { ev.stopPropagation(); close(); src.click() };
      menu.appendChild(b);
    });
    const r = more.getBoundingClientRect();
    menu.style.top = (r.bottom + 4) + "px";
    menu.style.insetInlineEnd = "auto";
    menu.style.left = Math.max(8, Math.min(r.left, innerWidth - menu.offsetWidth - 8)) + "px"; menu.style.right = "auto";
  }
  function close() { menu.hidden = true; more.setAttribute("aria-expanded", "false") }
  more.onclick = e => {
    e.stopPropagation(); bar.classList.remove("more");
    if (menu.hidden) { menu.hidden = false; build(); more.setAttribute("aria-expanded", "true"); const f = menu.querySelector("button"); if (f) f.focus() }
    else close();
  };
  document.addEventListener("click", e => { if (!menu.hidden && !menu.contains(e.target)) close() });
  addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { close(); more.focus() } });
  try { new ResizeObserver(fit).observe(bar) } catch (e) { addEventListener("resize", fit) }
  new MutationObserver(() => requestAnimationFrame(fit)).observe(bar, { childList: true, attributes: true, attributeFilter: ["hidden"], subtree: false });
  requestAnimationFrame(fit); setTimeout(fit, 600);
})();
