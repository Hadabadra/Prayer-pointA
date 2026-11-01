/* כיוון תפילה 3.6.0 — מפה משותפת 2.0 ותיקוני דיווחים (01.11.2026)
   1. שכבות (Prayer-pointA#11, #13, #16): כפתור "שכבות" צף על המפה, מתוך המאגר המשותף (map-ui.js, Hadabadra/Mikvaot/shared).
      שכבה של מקוואות / גבולות עירוב / עינים למקרא — שואלת ופותחת את התוסף ההוא באותו מקום; אם אינו מותקן — קישור לחנות.
      מחליף את שורת "שכבות:" של 3.5.4 (maplink.js), שהוסתרה מתחת לכפתורי הסיבוב.
   2. תוסף אחר שפותח את כיוון תפילה עם open-map — המיקום שהתקבל נקבע כאן.
   3. #15: החיפוש ראשון בסרגל, ו"מיקום ידני / מיקוד" כסמל בלבד (עם תיאור במעבר העכבר).
   4. #18: בחירת "מקומות שמורים" לא מזיזה את תיבת "מה לחפש" — היא נשארת ראשונה (בצד ימין).
   5. #14, #17: "ערכי המקדש" ליד הקישורים לעינים למקרא. */
(function init() {
  if (document.readyState !== "complete") return addEventListener("load", init, { once: true });
  const $ = id => document.getElementById(id), O = window.Otzaria, SELF = "com.shiachrina.kivuntefila";
  const online = () => navigator.onLine !== false;
  const openUrl = u => { if (O) O.call("app.openUrl", { url: u }).catch(() => {}); else try { open(u, "_blank", "noopener") } catch (e) {} };
  const call = (m, p) => O ? O.call(m, p) : Promise.resolve({ success: false });

  /* ---------- 1. שכבות ---------- */
  const old = $("mlRow"); if (old) old.remove();
  const tool = $("mapTool");
  if (tool && window.MapUI && MapUI.layersButton) {
    const box = MapUI.layersButton(tool, { self: SELF, call, openLink: openUrl, online: online(),
      getPos: () => { try { return typeof pos !== "undefined" && pos ? pos : null } catch (e) { return null } } });
    box.id = "mlLayers"; box.classList.add("ktLayers");
  }

  /* ---------- 2. פתיחה ממפה של תוסף אחר ---------- */
  if (window.MapUI && MapUI.onOpenMap) MapUI.onOpenMap(p => {
    if (!isFinite(p.lat) || !isFinite(p.lon) || (!p.lat && !p.lon)) return;
    const s = $("splash"); if (s) s.hidden = true;
    try { setPos([p.lat, p.lon], "מיקום מהמפה של תוסף אחר", null, false) } catch (e) {}
  });

  /* ---------- 3. #15: החיפוש ראשון, מיקום ידני כסמל ---------- */
  const bar = $("bar"), man = $("bManT"), sb = bar && bar.querySelector('button[aria-controls="plRow"]');
  if (bar && man && sb) {
    const on = $("bOn"); (on || man).after(sb); sb.after(man);
    man.classList.add("icoOnly"); man.title = "מיקום ידני: קואורדינטות או מיקוד"; man.setAttribute("aria-label", man.title);
    [...man.childNodes].forEach(n => { if (n.nodeType === 3 && n.textContent.trim()) { const sp = document.createElement("span"); sp.className = "bl"; sp.textContent = n.textContent; n.replaceWith(sp) } });
  }

  /* ---------- 4. #18: "מה לחפש" תמיד ראשון בשורה ---------- */
  const kind = $("nsKind"), row = $("plRow");
  if (kind && row) { const k = kind.parentNode === row ? kind : kind.parentNode; row.prepend(k) }

  /* ---------- 5. #14, #17: ערכי המקדש ---------- */
  const TEMPLE = "temple-encyclopedia", TEMPLE_STORE = "https://otzaria.org/plugins/6add35e32917198d739993b1";
  const openTemple = (msgEl) => call("plugin.openOther", { pluginId: TEMPLE }).then(r => { if (r && r.success === false) throw 0 })
    .catch(() => { if (msgEl) { msgEl.textContent = 'התוסף "ערכי המקדש" לא נפתח. אם אינו מותקן — אפשר להתקין מחנות התוספים. '; if (online()) { const b = document.createElement("button"); b.type = "button"; b.textContent = "לחנות"; b.onclick = () => openUrl(TEMPLE_STORE); msgEl.appendChild(b) } } else if (online()) openUrl(TEMPLE_STORE) });
  const menu = $("eyeMenu");
  if (menu && !$("eyTemple")) {
    const b = document.createElement("button"); b.type = "button"; b.id = "eyTemple"; b.setAttribute("role", "menuitem");
    b.textContent = "ערכי המקדש — אנציקלופדיה (תוסף נפרד)"; b.onclick = () => { menu.hidden = true; openTemple(null) };
    menu.appendChild(b);
  }
  const wrap = document.querySelector(".eyes");
  if (wrap && !$("eyTemple2")) {
    const b = document.createElement("button"); b.type = "button"; b.id = "eyTemple2"; b.textContent = "ערכי המקדש";
    b.title = "פתח את התוסף \"ערכי המקדש\" — כ-970 ערכים על בית המקדש";
    const m = document.createElement("small"); m.className = "eyMsg";
    b.onclick = () => openTemple(m); wrap.append(b, m);
  }
})();
/* 3.6.0 (#9): בבתי כנסת / תחנות רכבת / שדות תעופה — הרשימה הנפתחת בתיבת השם מציגה את התוצאות שנמצאו, לבחירה */
(function () {
  const res = document.getElementById("nsRes"), kind = document.getElementById("nsKind"), list = document.getElementById("nsList");
  if (!res || !kind || !list) return;
  new MutationObserver(() => {
    if (!/^(syn|rw|ap)$/.test(kind.value)) return;
    const names = [...new Set([...res.children].map(li => { const b = li.querySelector("button"); return (b ? b.textContent : li.textContent).trim() }).filter(Boolean))];
    list.replaceChildren(...names.slice(0, 300).map(n => { const o = document.createElement("option"); o.value = n; return o }));
  }).observe(res, { childList: true });
})();
