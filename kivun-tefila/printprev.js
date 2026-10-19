/* כיוון תפילה 2.6.0 — תצוגה מקדימה לפני הדפסה, וייצוא ל-Word (משימה 6) */
(function () {
  const $ = id => document.getElementById(id), O = window.Otzaria;
  const unwrap = r => (r && r.data !== undefined ? r.data : r);
  const box = document.createElement("div");
  box.id = "pv"; box.hidden = true; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "תצוגה מקדימה להדפסה");
  box.innerHTML = '<div id="pvBar" class="row"><b>תצוגה מקדימה</b>'
    + '<button id="pvPrint" type="button">הדפסה</button><button id="pvPdf" type="button">ייצוא PDF</button>'
    + '<button id="pvWord" type="button">ייצוא ל-Word</button><button id="pvX" type="button" aria-label="סגור">סגור</button></div>'
    + '<p id="pvMsg" aria-live="polite"></p><div id="pvPage"></div>';
  document.body.appendChild(box);
  const msg = t => { $("pvMsg").textContent = t || "" };
  const close = () => { box.hidden = true; $("pvPage").innerHTML = ""; msg("") };

  /* SVG עם צבעים מחושבים (המפה משתמשת במשתני CSS שלא קיימים מחוץ לתוסף) */
  const PROPS = ["fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "opacity", "fill-opacity", "stroke-opacity", "font-size", "font-family", "font-weight", "text-anchor", "dominant-baseline"];
  function flatSvg(svg) {
    if (!svg) return null;
    const c = svg.cloneNode(true), a = svg.querySelectorAll("*"), b = c.querySelectorAll("*");
    a.forEach((el, i) => { const cs = getComputedStyle(el); b[i].setAttribute("style", PROPS.map(p => p + ":" + cs.getPropertyValue(p)).join(";")) });
    const vb = (svg.getAttribute("viewBox") || "0 0 400 320").split(/\s+/).map(Number);
    c.setAttribute("xmlns", "http://www.w3.org/2000/svg"); c.setAttribute("width", vb[2]); c.setAttribute("height", vb[3]);
    c.setAttribute("style", "background:" + getComputedStyle(document.body).backgroundColor);
    return { xml: new XMLSerializer().serializeToString(c), w: vb[2], h: vb[3] };
  }
  function toPng(f, scale) {
    return new Promise((ok, no) => {
      const img = new Image();
      img.onload = () => { const cv = document.createElement("canvas"); cv.width = f.w * scale; cv.height = f.h * scale; const g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height); ok(cv.toDataURL("image/png")) };
      img.onerror = no; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(f.xml);
    });
  }

  window.showPrintPreview = function () {
    const page = $("pvPage"); page.innerHTML = "";
    const h = document.createElement("div"); h.innerHTML = $("printHead").innerHTML; page.appendChild(h);
    const m = flatSvg($("map")); if (m) { const d = document.createElement("div"); d.className = "pvMap"; d.innerHTML = m.xml; page.appendChild(d) }
    box.hidden = false; $("pvPrint").focus();
  };
  $("pvX").onclick = close;
  box.addEventListener("keydown", e => { if (e.key === "Escape") close() });
  $("pvPrint").onclick = () => { close(); setTimeout(() => printNow().catch(() => { try { $("stMsg").textContent = "ההדפסה אינה זמינה כאן." } catch (e) {} }), 50) };
  $("pvPdf").onclick = () => { close(); window.__pdf = true; setTimeout(() => printNow().catch(() => { try { $("stMsg").textContent = "ייצוא PDF אינו זמין כאן." } catch (e) {} }), 50) };

  /* Word: קובץ .doc שהוא HTML (Word פותח אותו כמסמך), עם המפה כתמונה */
  async function saveFile(text, name, ext, type) {
    const blob = new Blob(["﻿" + text], { type });
    if (O) {
      let tok = null;
      try {
        const b = unwrap(await O.call("fs.beginBinaryWrite", { purpose: "user-file", expectedSize: blob.size }));
        if (b && b.uploadUrl) {
          tok = b.writeToken;
          const put = await fetch(b.uploadUrl, { method: "PUT", headers: { "Content-Type": type }, body: blob });
          if (!put.ok) throw new Error("upload " + put.status);
          const c = unwrap(await O.call("fs.commitUserFileWrite", { writeToken: tok, suggestedName: name, extension: ext, title: "שמירת דף כיוון" }));
          tok = null;
          return c && c.cancelled ? false : true;
        }
      } catch (e) { if (tok) O.call("fs.abortBinaryWrite", { writeToken: tok }).catch(() => {}) }
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name + "." + ext;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 1000);
    return true;
  }
  $("pvWord").onclick = async () => {
    msg("מכין קובץ…");
    let img = "";
    try { const m = flatSvg($("map")); if (m) img = '<p align="center"><img width="480" src="' + await toPng(m, 2) + '"></p>' } catch (e) {}
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>כיוון תפילה</title>'
      + '<style>body{direction:rtl;font-family:David,Arial;text-align:center}h1{font-size:20pt}.pbig{font-size:18pt;font-weight:bold}</style></head><body dir="rtl">'
      + $("printHead").innerHTML + img + "</body></html>";
    try { const r = await saveFile(html, "כיוון-תפילה", "doc", "application/msword"); msg(r === false ? "השמירה בוטלה." : "הקובץ נשמר.") }
    catch (e) { msg("השמירה לא הצליחה.") }
  };
})();
