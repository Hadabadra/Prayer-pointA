/* כיוון תפילה 2.8.5 — "הייתי בכותל": יומן ביקורים, תזכורת אחרי 30 יום, קובץ ללוח השנה, ופסוק בעמוד השער.
   הרקע: מי שלא ראה את מקום המקדש שלושים יום, כשרואה שוב — יש בזה דין קריעה (שולחן ערוך אורח חיים, סימן תקסא; הפירוט בכפתור "קריעה בכותל").
   התזכורת היא עזר בלבד ואינה פסק הלכה. */
(function () {
  /* ---- פסוק בעמוד השער ---- */
  const spT = document.getElementById("spT");
  if (spT && !document.getElementById("spVerse")) {
    const v = document.createElement("p"); v.id = "spVerse"; v.textContent = "אם אשכחך ירושלם תשכח ימיני (תהלים קלז, ה)";
    v.style.cssText = "font-size:1.05rem;font-weight:700;margin:.1rem 0 .4rem;opacity:.9"; spT.after(v);
  }

  const kr = document.querySelector("#kriaBody .kria, #kotelBody .kria"); if (!kr) return;
  const get = k => (window.kvGet ? window.kvGet(k) : Promise.resolve(null)), set = (k, v) => window.kvSet && window.kvSet(k, v);
  const DAY = 864e5, fmt = t => new Date(t).toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "numeric", year: "numeric" });
  let V = [], heb = {};

  const box = document.createElement("div"); box.style.cssText = "border-top:1px solid var(--color-outline);margin-top:.5rem;padding-top:.4rem";
  box.innerHTML = `<h3 style="margin:.2rem 0">הביקורים שלי בכותל</h3>
   <p id="kvSum" style="margin:.2rem 0"></p>
   <div class="row" style="flex-wrap:wrap;gap:.3rem"><button id="kvToday" type="button" style="font-weight:700">✔ הייתי בכותל היום</button>
    <label style="font-size:.85rem">תאריך אחר: <input id="kvDate" type="date"></label><button id="kvAdd" type="button">הוסף</button></div>
   <label style="display:block;margin:.35rem 0;font-size:.9rem"><input id="kvRem" type="checkbox"> תזכורת 30 יום אחרי הביקור האחרון (הודעת מערכת של אוצריא)</label>
   <div class="row" style="flex-wrap:wrap;gap:.3rem"><button id="kvCal" type="button">📅 שליחה ללוח השנה של אוצריא</button><button id="kvIcs" type="button">קובץ ליומן חיצוני (.ics)</button></div>
   <p id="kvMsg" style="font-size:.85rem;min-height:1.1em" aria-live="polite"></p>
   <details><summary style="font-size:.9rem">כל הביקורים</summary><ul id="kvList" style="margin:.2rem 0"></ul></details>
   <p><small>התזכורת עוזרת לזכור את ענין הקריעה כשעברו שלושים יום. מתי חייבים ומי פטור (למשל תושבי ירושלים) — ראו בכפתור "זכר לחורבן", ובשאלה מעשית יש לשאול רב.</small></p>`;
  kr.appendChild(box);
  /* 3.0.0: מעבר לתוסף "עינים למקרא" — תמונות והסברים על הכותל ובית המקדש */
  const em = document.createElement("div"); em.style.cssText = "border-top:1px solid var(--color-outline);margin-top:.5rem;padding-top:.4rem";
  em.innerHTML = '<h3 style="margin:.2rem 0">תמונות והסברים על הכותל ובית המקדש</h3><p style="font-size:.9rem;margin:.2rem 0">בתוסף "עינים למקרא" יש גלריות, מפות והסברים על הכותל, הר הבית ובית המקדש.</p>';
  const eb = document.createElement("button"); eb.type = "button"; eb.textContent = "🖼 פתח את \"עינים למקרא\"";
  eb.onclick = () => { if (typeof O !== "undefined" && O) O.call("plugin.openOther", { pluginId: "com.chadbedera.madaeihatanach" }).then(r => { if (r && r.success === false) throw 0 }).catch(() => { msg("לא ניתן לפתוח את \"עינים למקרא\". אם התוסף לא מותקן — אפשר להתקין אותו מחנות התוספים של אוצריא.") }); else msg("התוסף \"עינים למקרא\" זמין בחנות התוספים של אוצריא.") };
  em.appendChild(eb); kr.appendChild(em);
  const $k = id => document.getElementById(id), msg = t => { $k("kvMsg").textContent = t };

  function draw() {
    V.sort((a, b) => b - a); const last = V[0];
    if (!last) $k("kvSum").textContent = "עוד לא נרשם ביקור.";
    else { const d = Math.floor((Date.now() - last) / DAY), due = last + 30 * DAY;
      $k("kvSum").innerHTML = `הביקור האחרון: <b>${fmt(last)}</b> (${d === 0 ? "היום" : "לפני " + d + " ימים"}). ` + (d >= 30 ? "<b>עברו שלושים יום.</b>" : `שלושים יום ימלאו ב-${fmt(due)}.`) }
    const ul = $k("kvList"); ul.replaceChildren(...V.map((t, i) => { const li = document.createElement("li"), x = document.createElement("button"); li.textContent = fmt(t) + " ";
      x.type = "button"; x.textContent = "מחק"; x.style.fontSize = ".75rem"; x.onclick = () => { V.splice(i, 1); save(); draw(); schedule() }; li.appendChild(x); return li }));
  }
  let save = () => set("kivun-kotel-visits", V);
  function add(t) { t = new Date(new Date(t).toDateString()).getTime(); if (V.includes(t)) { msg("התאריך הזה כבר רשום."); return } V.push(t); save(); draw(); schedule(); msg("נרשם: " + fmt(t)) }

  async function schedule() {
    set("kivun-kotel-rem", heb.rem = $k("kvRem").checked);
    if (typeof O === "undefined" || !O) return;
    try { await O.call("notifications.cancel", { id: 7300 }) } catch (e) {}
    if (!heb.rem || !V[0]) return;
    const at = V[0] + 30 * DAY + 9 * 36e5; if (at < Date.now()) return;
    try {
      const r = await O.call("notifications.requestPermissions"); const g = r && (r.data || r); if (g && g.granted === false) { msg("אוצריא לא קיבלה הרשאה להודעות מערכת. התזכורת תוצג בתוך התוסף בפתיחה הבאה."); return }
      await O.call("notifications.scheduleSystem", { id: 7300, title: "כיוון תפילה · שלושים יום מהביקור בכותל", body: `הביקור האחרון היה ב-${fmt(V[0])}. לפני הביקור הבא אפשר לעיין בהלכות הקריעה בתוסף.`, scheduledTime: new Date(at).toISOString() });
      msg("התזכורת נקבעה ל-" + fmt(at) + ".");
    } catch (e) { msg("לא ניתן לקבוע הודעת מערכת כאן. התזכורת תוצג בתוך התוסף.") }
  }

  /* קובץ לוח שנה: אירוע ביום ה-30, עם התראה. נפתח ב-Outlook, Google Calendar וכל יומן */
  function ics() {
    if (!V[0]) { msg("רשמו קודם ביקור."); return }
    const d = new Date(V[0] + 30 * DAY), ymd = x => x.toISOString().slice(0, 10).replace(/-/g, ""), nx = new Date(+d + DAY);
    const txt = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Otzaria//Kivun Tefila//HE", "BEGIN:VEVENT", "UID:kotel-" + V[0] + "@kivun-tefila",
      "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z", "DTSTART;VALUE=DATE:" + ymd(d), "DTEND;VALUE=DATE:" + ymd(nx),
      "SUMMARY:שלושים יום מהביקור בכותל", "DESCRIPTION:הביקור האחרון: " + fmt(V[0]) + ". הלכות הקריעה בתוסף כיוון תפילה (דיני הכותל).",
      "BEGIN:VALARM", "TRIGGER:-PT15H", "ACTION:DISPLAY", "DESCRIPTION:שלושים יום מהביקור בכותל", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    saveFile(txt, "תזכורת-כותל", "ics", "text/calendar").then(ok => msg(ok ? "הקובץ נשמר. פתחו אותו כדי להוסיף את האירוע ללוח השנה." : "השמירה בוטלה."));
  }
  async function saveFile(text, name, ext, type) {
    const blob = new Blob([text], { type }), un = r => r && r.data !== undefined ? r.data : r;
    if (typeof O !== "undefined" && O) { let tok = null;
      try { const b = un(await O.call("fs.beginBinaryWrite", { purpose: "user-file", expectedSize: blob.size }));
        if (b && b.uploadUrl) { tok = b.writeToken; const put = await fetch(b.uploadUrl, { method: "PUT", headers: { "Content-Type": type }, body: blob }); if (!put.ok) throw 0;
          const c = un(await O.call("fs.commitUserFileWrite", { writeToken: tok, suggestedName: name, extension: ext, title: "שמירת תזכורת" })); tok = null; return !(c && c.cancelled) } }
      catch (e) { if (tok) O.call("fs.abortBinaryWrite", { writeToken: tok }).catch(() => {}) } }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name + "." + ext; document.body.appendChild(a); a.click(); a.remove(); return true;
  }

  $k("kvToday").onclick = () => add(Date.now());
  $k("kvAdd").onclick = () => { const v = $k("kvDate").value; if (!v) { msg("בחרו תאריך."); return } if (Date.parse(v) > Date.now()) { msg("התאריך בעתיד."); return } add(v + "T12:00") };
  $k("kvRem").onchange = schedule; $k("kvIcs").onclick = ics;
  /* 3.0.2: לוח השנה של אוצריא — publishedData.upsert מסוג calendar.event (כמו "ערך היום" בעינים למקרא).
     נשלחים: כל ביקור, ומועד "שלושים יום" אחרי הביקור האחרון. אחרי השליחה הראשונה מתעדכן לבד בכל שינוי. */
  const pad = n => String(n).padStart(2, "0"), isoD = t => { const d = new Date(t); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) };
  const startsAt = t => { const d = new Date(t), z = -d.getTimezoneOffset(); return isoD(t) + "T00:00:00" + (z >= 0 ? "+" : "-") + pad(Math.floor(Math.abs(z) / 60)) + ":" + pad(Math.abs(z) % 60) };
  async function calSync(manual) {
    if (typeof O === "undefined" || !O) { if (manual) msg("לוח השנה של אוצריא זמין רק בתוך אוצריא. אפשר להשתמש בקובץ ליומן חיצוני."); return }
    const items = V.slice(0, 30).map(t => ({ key: "kivun:kotel:visit:" + isoD(t), payload: { title: "ביקור בכותל", startsAt: startsAt(t), source: "כיוון תפילה", importance: "low", description: "ביקור בכותל המערבי — נרשם בתוסף כיוון תפילה." } }));
    if (V[0]) items.push({ key: "kivun:kotel:due", payload: { title: "שלושים יום מהביקור בכותל", startsAt: startsAt(V[0] + 30 * DAY), source: "כיוון תפילה", importance: "normal", description: "עברו שלושים יום מהביקור האחרון בכותל (" + fmt(V[0]) + "). הלכות הקריעה — בכפתור \"✂ קריעה\" בתוסף כיוון תפילה." } });
    const prev = (await get("kivun-kotel-calkeys")) || [], now = items.map(i => i.key);
    for (const k of prev) if (!now.includes(k)) await O.call("publishedData.remove", { type: "calendar.event", scope: "global", key: k }).catch(() => {});
    let ok = 0;
    for (const it of items) { const r = await O.call("publishedData.upsert", { type: "calendar.event", scope: "global", key: it.key, payload: it.payload }).catch(() => null); if (r && r.success !== false) ok++ }
    set("kivun-kotel-calkeys", now); set("kivun-kotel-cal", true);
    if (manual) msg(ok ? "נשלח ללוח השנה של אוצריא ✓ (" + ok + " פריטים). מעכשיו הלוח יתעדכן לבד בכל שינוי." : "השליחה ללוח השנה נכשלה. ייתכן שגרסת אוצריא אינה תומכת בזה; אפשר להשתמש בקובץ ליומן חיצוני.");
  }
  $k("kvCal").onclick = () => calSync(true);
  const save0 = save; save = () => { save0(); get("kivun-kotel-cal").then(on => { if (on) calSync(false) }) };

  /* 3.0.0: טוענים גם אחרי plugin.boot — לפניו storage של אוצריא עוד לא זמין, והרשימה נטענה ריקה */
  let loaded = false;
  const load = () => Promise.all([get("kivun-kotel-visits"), get("kivun-kotel-rem")]).then(([v, r]) => {
    const got = Array.isArray(v) ? v.filter(Number.isFinite) : [];
    if (loaded && !got.length) return; loaded = true;
    V = [...new Set(V.concat(got))]; $k("kvRem").checked = r !== false && r !== "false"; heb.rem = $k("kvRem").checked; draw();
    /* תזכורת בתוך התוסף: בפתיחה, אם עברו 30 יום מהביקור האחרון (פעם ביום) */
    if (heb.rem && V[0] && !heb.shown && Date.now() - V[0] >= 30 * DAY && (heb.shown = 1)) get("kivun-kotel-remshown").then(s => {
      const today = new Date().toDateString(); if (s === today) return; set("kivun-kotel-remshown", today);
      const t = `עברו ${Math.floor((Date.now() - V[0]) / DAY)} ימים מהביקור האחרון בכותל (${fmt(V[0])}). הלכות הקריעה — בחלונית "דיני הכותל".`;
      if (typeof O !== "undefined" && O) O.call("notifications.showInApp", { message: "🕍 " + t, type: "info" }).catch(() => {});
    });
  });
  load(); if (typeof O !== "undefined" && O) { try { O.on("plugin.boot", () => setTimeout(load, 50)) } catch (e) {} setTimeout(load, 1500) }
})();
