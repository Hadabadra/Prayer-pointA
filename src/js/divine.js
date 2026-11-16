/* divine.js — הסתרת שמות הקודש בדף ה-PDF (ברכת המזון 2.1.0).
 * הספר מוצג כקובץ PDF מקורי, ולכן אי אפשר להחליף בו טקסט. במקום זה מציירים "מסכה" על הקנבס:
 * מלבן בצבע הנייר שנדגם מהדף, ועליו הכינוי שהמשתמש בחר (כמו בהגדרות התצוגה של אוצריא).
 * המיקום מחושב משכבת הטקסט של ה-PDF (getTextContent) — מקורב, לפי חלוקה יחסית של רוחב השורה.
 * פועל גם בהדפסה/שמירה כ-PDF (אותה פונקציה על קנבס ההדפסה). הקובץ שבתוסף עצמו לא משתנה.
 */
(function (g) {
  'use strict';
  var NQ = '[֑-ׇ]*';
  var HOLY = new RegExp('י' + NQ + 'ה' + NQ + 'ו' + NQ + 'ה' + NQ, 'g');
  var OTHER = new RegExp('(א' + NQ + 'ל' + NQ + 'ו?' + NQ + 'ה' + NQ + '(?=[י֑-ׇ]))|(צ' + NQ + 'ב' + NQ + 'א' + NQ + '(?=ו' + NQ + 'ת))', 'g');
  var SUB = { kufKuf: 'יקוק', hehApostrophe: "ה'", doubleYod: 'יי', daletDalet: 'ידוד' };
  var mode = { holy: 'asIs', other: 'asIs' };

  function plain(s) { return String(s || '').replace(/[֑-ׇ]/g, ''); }
  function otherSub(core) {
    var p = plain(core);
    if (p.indexOf('צבא') === 0) return 'צבק';
    return p.replace(/ה$/, 'ק');               // אלה→אלק, אלוה→אלוק (הסיומת נשארת מהדף)
  }

  /* הגדרה: 'otzaria' (ברירת מחדל) | 'asIs' | אחד ממפתחות SUB */
  async function load(pref) {
    if (pref && pref !== 'otzaria') { mode = { holy: pref, other: pref === 'asIs' ? 'asIs' : 'substitute' }; return mode; }
    try {
      var r = await g.Otzaria.call('app.getDivineNamesDisplay', {});
      var d = (r && r.data) || r || {};
      mode = { holy: d.holyName || 'asIs', other: d.otherNames || 'asIs' };
    } catch (e) { mode = { holy: 'asIs', other: 'asIs' }; }
    return mode;
  }
  function active() { return mode.holy !== 'asIs' || mode.other === 'substitute'; }

  function sample(ctx, x, y, k) {
    try { var d = ctx.getImageData(Math.max(0, x * k | 0), Math.max(0, y * k | 0), 1, 1).data; return 'rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')'; }
    catch (e) { return null; }
  }
  function darkest(ctx, x, y, w, h, k) {
    try {
      var d = ctx.getImageData(x * k | 0, y * k | 0, Math.max(1, w * k | 0), Math.max(1, h * k | 0)).data, best = 765, c = [0, 0, 0];
      for (var i = 0; i < d.length; i += 16) { var s = d[i] + d[i + 1] + d[i + 2]; if (s < best) { best = s; c = [d[i], d[i + 1], d[i + 2]]; } }
      return 'rgb(' + c.join(',') + ')';
    } catch (e) { return null; }
  }

  /* ctx: קנבס שכבר צויר (בקנה המידה של vp, אחרי setTransform של dpr); tc: getTextContent; vp: viewport */
  function mask(ctx, tc, vp, U, k) {
    k = k || 1;
    if (!active() || !tc || !tc.items) return 0;
    var n = 0;
    tc.items.forEach(function (it) {
      var s = it.str || ''; if (s.length < 2) return;
      var hits = [];
      if (mode.holy !== 'asIs') { HOLY.lastIndex = 0; var m; while ((m = HOLY.exec(s))) hits.push([m.index, m[0].length, SUB[mode.holy] || "ה'"]); }
      if (mode.other === 'substitute') { OTHER.lastIndex = 0; var o; while ((o = OTHER.exec(s))) hits.push([o.index, o[0].length, otherSub(o[0])]); }
      if (!hits.length) return;
      var t = U.transform(vp.transform, it.transform), fh = Math.hypot(t[2], t[3]) || 10;
      var W = (it.width || 0) * vp.scale, L = s.length, x0 = t[4], base = t[5];
      var rtl = it.dir !== 'ltr';
      hits.forEach(function (h) {
        var a = h[0] / L, b = (h[0] + h[1]) / L;
        var left = rtl ? x0 + W * (1 - b) : x0 + W * a, w = W * (b - a);
        var top = base - fh * 0.95, hh = fh * 1.25;
        var bg = sample(ctx, left - 2, top + hh / 2, k) || sample(ctx, left + w + 2, top + hh / 2, k);
        var fg = darkest(ctx, left, top, w, hh, k);
        ctx.save();
        ctx.fillStyle = bg || 'white'; ctx.fillRect(left - 1, top, w + 2, hh);
        ctx.fillStyle = fg || 'black'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.font = 'bold ' + (fh * 0.9).toFixed(1) + 'px FrankRuhlCLM, "Times New Roman", serif';
        ctx.direction = 'rtl'; ctx.fillText(h[2], left + w / 2, base, w * 1.4);
        ctx.restore(); n++;
      });
    });
    return n;
  }
  g.SRDivine = { load: load, mask: mask, active: active, mode: function () { return mode; } };
})(window);
