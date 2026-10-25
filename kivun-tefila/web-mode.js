/* 3.3.2 — מצב דפדפן (בלי אוצריא): אין סידורון, לכן מסתירים את הורדתו,
   ובחלון "תפילה" אפשר להדביק טקסט תפילה או לטעון קובץ טקסט; הטקסט נשמר בדפדפן. */
(function init() {
  if (document.readyState !== "complete") return addEventListener("load", init, { once: true });
  if (typeof O !== "undefined" && O) return;
  const $ = i => document.getElementById(i);
  const sd = $("sidDl"); if (sd) { const it = sd.closest(".dlitem"); if (it) it.hidden = true; else sd.hidden = true }
  const tb = $("bTfila"); if (!tb) return;
  tb.title = "טקסט תפילה על רקע הכותל";
  const K = "kivun-web-prayer";
  const get = () => { try { return JSON.parse(localStorage.getItem(K) || "null") } catch (e) { return null } };
  const put = v => { try { v ? localStorage.setItem(K, JSON.stringify(v)) : localStorage.removeItem(K) } catch (e) {} };
  tb.addEventListener("click", e => {
    e.stopImmediatePropagation();
    const ov = $("tfila"), x = $("tfText"), saved = get();
    $("tfTitle").textContent = saved ? saved.title : "תפילה";
    x.innerHTML = "";
    if (saved && saved.text) {
      x.textContent = saved.text;
      const r = document.createElement("p"); r.className = "row";
      const ed = document.createElement("button"); ed.type = "button"; ed.textContent = "החלפת הטקסט";
      ed.onclick = () => { put(null); tb.click() }; r.append(ed); x.append(r);
    } else {
      x.innerHTML = '<p>בדפדפן אין חיבור לסידורון. אפשר להדביק כאן את נוסח התפילה (או לטעון קובץ טקסט), והוא יוצג על רקע הכותל וישמר בדפדפן הזה.</p>';
      const t = document.createElement("input"); t.placeholder = "שם התפילה (למשל: שחרית)"; t.style.width = "100%";
      const a = document.createElement("textarea"); a.rows = 8; a.style.width = "100%"; a.placeholder = "הדביקו כאן את נוסח התפילה";
      const f = document.createElement("input"); f.type = "file"; f.accept = ".txt,text/plain";
      f.onchange = () => { const fl = f.files[0]; if (!fl) return; fl.text().then(s => { a.value = s; if (!t.value) t.value = fl.name.replace(/\.[^.]+$/, "") }) };
      const ok = document.createElement("button"); ok.type = "button"; ok.textContent = "הצג";
      ok.onclick = () => { if (!a.value.trim()) return; put({ title: t.value.trim() || "תפילה", text: a.value }); tb.click() };
      const row = document.createElement("p"); row.className = "row"; row.append(f, ok);
      x.append(t, a, row);
    }
    const d = $("tfDir");
    if (typeof pos !== "undefined" && pos && typeof bearing === "function") { d.hidden = false; d.textContent = "הכיוון לירושלים: " + Math.round(bearing(pos, J)) + "°" } else d.hidden = true;
    ov.hidden = false; $("tfClose").focus();
  }, true);
})();
