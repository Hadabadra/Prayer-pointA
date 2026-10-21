/* כיוון תפילה — קווי טלפון נוספים (הצעת משתמש, 20.10.2026).
   כמו קו המניינים: מציגים את המספר עם העתקה בלבד. התוסף לא מחייג ולא שולח לקווים שום מידע. */
(function () {
  const LINES = {
    minyan: [{ t: "בדיקת מיקוד", n: "079-584-0000", x: "שלוחה 95", d: "קו טלפוני (איקול) לבירור מיקוד לפי כתובת. שימושי לזיהוי המיקום בתוסף לפי מיקוד." }],
    fly: [
      { t: "מידע טיסות", n: "079-580-5985", d: "קו טלפוני (איקול) למידע על טיסות: שעות המראה ונחיתה מעודכנות, לעדכון שעת הנחיתה במעקב." },
      { t: "נתב״ג – מידע המראות ונחיתות", n: "03-972-3333", d: "הקו הרשמי של נמל התעופה בן גוריון." }
    ]
  };
  function block(l) {
    const w = document.createElement("div"); w.className = "xline"; w.style.margin = ".6rem 0 .2rem";
    const h = document.createElement("p"); h.style.margin = "0"; h.innerHTML = "<b></b>"; h.firstChild.textContent = l.t;
    const num = document.createElement("p"); num.dir = "ltr"; num.style.cssText = "font-size:1.35rem;font-weight:700;text-align:center;margin:.25rem 0";
    num.textContent = l.n + (l.x ? "  ·  " : ""); if (l.x) { const s = document.createElement("span"); s.dir = "rtl"; s.style.fontSize = ".9rem"; s.textContent = l.x; num.appendChild(s) }
    const ds = document.createElement("p"); ds.style.cssText = "font-size:.85rem;margin:.1rem 0"; ds.textContent = l.d;
    const row = document.createElement("div"); row.className = "row"; const b = document.createElement("button"); b.type = "button"; b.textContent = "העתק מספר"; row.appendChild(b);
    const msg = document.createElement("p"); msg.style.cssText = "font-size:.85rem;min-height:1.1em;margin:.1rem 0"; msg.setAttribute("aria-live", "polite");
    b.onclick = () => (typeof copyText === "function" ? copyText(l.n.replace(/-/g, "")) : Promise.resolve(false))
      .then(ok => { msg.textContent = ok ? `המספר ${l.n} הועתק ללוח${l.x ? " (" + l.x + ")" : ""}.` : `ההעתקה לא הצליחה. המספר: ${l.n}${l.x ? ", " + l.x : ""}` });
    w.append(h, num, ds, row, msg); return w;
  }
  const mm = document.getElementById("minMsg");
  /* 3.1.0: קו בדיקת המיקוד עבר מ"מניינים" לשורת המיקוד (כפתור "מיקום / מיקוד ידני") */
  const pcb = document.getElementById("pcBox");
  if (pcb) LINES.minyan.forEach(l => {
    const w = document.createElement("span"); w.className = "pcline"; w.title = l.d;
    const t = document.createElement("small"); t.textContent = "☎ " + l.t + ": "; const nb = document.createElement("b"); nb.dir = "ltr"; nb.textContent = l.n;
    const x = document.createElement("small"); x.textContent = l.x ? " · " + l.x + " " : " ";
    const b = document.createElement("button"); b.type = "button"; b.textContent = "העתק";
    b.onclick = () => (typeof copyText === "function" ? copyText(l.n.replace(/-/g, "")) : Promise.resolve(false)).then(ok => { b.textContent = ok ? "הועתק ✓" : l.n; setTimeout(() => b.textContent = "העתק", 2500) });
    w.append(t, nb, x, b); pcb.appendChild(w) });
  else if (mm) { const f = document.createDocumentFragment(); LINES.minyan.forEach(l => f.appendChild(block(l))); mm.after(f) }
  const fo = document.getElementById("flyOut");
  if (fo) { const d = document.createElement("details"); d.style.margin = ".6rem 0";
    const s = document.createElement("summary"); s.textContent = "☎ טלפונים לטיסה (מידע טיסות, נתב״ג)"; d.appendChild(s);
    LINES.fly.forEach(l => d.appendChild(block(l)));
    const n = document.createElement("p"); n.style.cssText = "font-size:.8rem;color:var(--color-on-surface-dim)"; n.textContent = "הקווים הם שירות של אחרים. חיוג ישיר אינו נתמך בתוך אוצריא: מעתיקים ומחייגים מהטלפון.";
    d.appendChild(n); fo.before(d) }
})();
