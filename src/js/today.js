/* מה מיוחד היום בברכת המזון — לפי הלוח העברי (Intl, בלי רשת). מחזיר רק את התוספות שבסידור, בלי פסיקה. */
(function (g) {
  const F = new Intl.DateTimeFormat("he-u-ca-hebrew-nu-latn", { day: "numeric", month: "long", year: "numeric" });
  function hd(d) { const p = F.formatToParts(d), get = t => (p.find(x => x.type === t) || {}).value; return { day: +get("day"), month: get("month"), year: get("year") }; }
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const M = m => String(m || "").replace(/[׳']/g, "").replace("חשון", "חשוון").replace("סיון", "סיוון");
  function info(date, diaspora) {
    const h = hd(date), m = M(h.month), d = h.day, names = [];
    let retzei = false, yaaleh = false, nisim = false;
    if (date.getDay() === 6) { names.push("שבת"); retzei = true; }
    const yt = (cond, name) => { if (cond) { names.push(name); yaaleh = true; } };
    yt(m === "תשרי" && (d === 1 || d === 2), "ראש השנה");
    yt(m === "תשרי" && d === 15 || (diaspora && m === "תשרי" && d === 16), "סוכות");
    yt(m === "תשרי" && d >= (diaspora ? 17 : 16) && d <= 21, "חול המועד סוכות");
    yt(m === "תשרי" && d === 22, diaspora ? "שמיני עצרת" : "שמיני עצרת – שמחת תורה");
    yt(diaspora && m === "תשרי" && d === 23, "שמחת תורה");
    yt(m === "ניסן" && (d === 15 || (diaspora && d === 16)), "פסח");
    yt(m === "ניסן" && d >= (diaspora ? 17 : 16) && d <= 20, "חול המועד פסח");
    yt(m === "ניסן" && (d === 21 || (diaspora && d === 22)), "שביעי של פסח");
    yt(m === "סיוון" && (d === 6 || (diaspora && d === 7)), "שבועות");
    if ((d === 30 || d === 1) && !(m === "תשרי" && d === 1)) { names.push("ראש חודש"); yaaleh = true; }
    for (let i = 0; i < 8; i++) { const x = hd(addDays(date, -i)); if (M(x.month) === "כסלו" && x.day === 25) { names.push("חנוכה – נר " + (i + 1)); nisim = true; break; } }
    if ((m === "אדר" || m === "אדר ב") && d === 14) { names.push("פורים (בערים שאינן מוקפות חומה)"); nisim = true; }
    if ((m === "אדר" || m === "אדר ב") && d === 15) { names.push("שושן פורים (בירושלים)"); nisim = true; }
    if (m === "אדר א" && d === 14) names.push("פורים קטן");
    if (m === "תשרי" && d === 10) names.push("יום הכיפורים");
    return { heb: d + " ב" + h.month, names, retzei, yaaleh, nisim, plain: !retzei && !yaaleh && !nisim };
  }
  g.SRDay = info;
  if (typeof module !== "undefined") module.exports = info;
})(typeof window !== "undefined" ? window : globalThis);
