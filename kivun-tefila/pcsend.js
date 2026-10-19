/* כיוון תפילה 2.6.0 — מיקודים שנשלחו על ידי משתמשים (משימה 9).
   אין מאגר פתוח ומלא של מיקודי ישראל (נתוני דואר ישראל אינם פתוחים), ולכן: מיקוד שלא נמצא אפשר לשלוח
   עם המיקום הנוכחי, כ-issue ציבורי דרך המתווך. postcodes-extra.yml אוסף אותם ל-kivun-tefila-data/postcodes-extra.json,
   והתוסף מוריד את הקובץ ושומר אותו מקומית. */
(function () {
  const $ = id => document.getElementById(id), O = window.Otzaria;
  const URL_X = "https://raw.githubusercontent.com/Hadabadra/Prayer-pointA/%D7%9B%D7%99%D7%95%D7%95%D7%9F-%D7%AA%D7%A4%D7%99%D7%9C%D7%94/kivun-tefila-data/postcodes-extra.json";
  const RELAY = "https://achat-relay.e0548433917.workers.dev";
  const dat = r => r && (r.data !== undefined ? r.data : r);
  let X = null;
  async function xLoad() {
    if (X) return X;
    try { const t = O ? dat(await O.call("fs.readFile", { path: "postcodes-extra.json" })) : localStorage.getItem("kivun-postcodes-extra.json"); const s = t && typeof t === "object" ? t.content : t; if (s) X = JSON.parse(s) } catch (e) {}
    try { const j = await getJ(URL_X); if (j && j.f) { X = j; const s = JSON.stringify(j); O ? O.call("fs.writeFile", { path: "postcodes-extra.json", content: s }).catch(() => {}) : localStorage.setItem("kivun-postcodes-extra.json", s) } } catch (e) {}
    return X;
  }
  setTimeout(xLoad, 4000);
  const orig = window.pcFind;
  if (typeof orig !== "function" || !$("pcGo")) return;
  async function find() {
    const raw = ($("pc").value || "").trim().toUpperCase(), z = raw.replace(/[^0-9A-Z]/g, "");
    const old = document.getElementById("pcSend"); if (old) old.remove();
    await orig();
    if (!/לא נמצא בטבלה/.test($("txt").textContent || "")) return;
    const x = await xLoad(), p = x && x.f && x.f[z];
    if (p) { $("city").value = ""; setPos([p[0], p[1]], "מיקוד " + raw + " (נשלח על ידי משתמשים)", null, false); return }
    /* שליחה: רק המיקוד והמיקום שנבחר כרגע (מעוגל), ובאישור המשתמש */
    if (typeof pos === "undefined" || !pos || z.length < 5) return;
    const b = document.createElement("button"); b.type = "button"; b.id = "pcSend";
    b.textContent = "המיקום הנוכחי הוא המיקוד הזה? שלח לשיפור הטבלה";
    b.onclick = async () => {
      if (!confirm(`לשלוח את המיקוד ${raw} עם המיקום ${pos[0].toFixed(4)}, ${pos[1].toFixed(4)}? הם יפורסמו ב-GitHub כדי לעדכן את הטבלה לכולם.`)) return;
      const body = `מיקוד: ${z}\nמיקום: ${pos[0].toFixed(4)},${pos[1].toFixed(4)}\nמקור: ${String(typeof src !== "undefined" ? src : "").slice(0, 80)}`;
      try { const P = ({ title: "[מיקוד] " + z, body, fingerprint: "pc-" + z, version: typeof VER !== "undefined" ? VER : "", kind: "postcode", plugin: "כיוון תפילה", repo: "otzaria" }); await (window.ktRelay ? ktRelay(P) : fetch(RELAY, { method: "POST", mode: "no-cors", body: JSON.stringify(P) })); b.textContent = "נשלח ✓ תודה" }
      catch (e) { b.textContent = "השליחה נכשלה (אין חיבור?)" }
      b.disabled = true;
    };
    $("txt").after(b);
  }
  $("pcGo").onclick = find;
  $("pc").onkeydown = e => { if (e.key === "Enter") find() };
})();
