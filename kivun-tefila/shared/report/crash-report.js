/* דיווח תקלות אוטומטי לתוספי אוצריא — רכיב משותף (גרסה 1.1.0, 09.11.2026 — הצעה אחת בלבד בכל הפעלה, ו-setEnabled/isEnabled למתג בהגדרות; כמו לשון הקודש 2.7.0).
   המקור היחיד: Hadabadra/Mikvaot shared/report/. כל תוסף מעתיק את הקובץ כמו שהוא (tools/sync-shared.sh).
   מה עושה: תופס שגיאות JS שלא טופלו (error / unhandledrejection) ומציע למשתמש בהודעה קטנה לשלוח דיווח קריסה
   דרך מערכת הדיווחים של אוצריא (feedback.report, reportType: "crash"). אוצריא מציגה תמיד דיאלוג אישור — אין שליחה בלי הסכמה
   (כך ב-SDK, אי אפשר לעקוף). במצב לא מקוון אוצריא שומרת את הדיווח בתור ושולחת לבד כשיש חיבור.
   הדיווח מגיע לאתר אוצריא ← למייל המפתחת ← סקריפט שמעביר ל-GitHub issues (תווית "דיווח-משתמש").
   CrashReport.init({ call, plugin: 'מקוואות', version: '1.7.0' })  — אחרי שיש עטיפת call. */
(function (root) {
  'use strict';
  const KEY = 'crashReportOff', seen = new Set();
  let cfg = null, off = false, box = null, pending = null, offered = false;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // פרטים אישיים לא נשלחים: נתיבי משתמש מוסתרים
  const clean = s => String(s || '').replace(/[A-Za-z]:\\Users\\[^\\\s]+/g, 'C:\\Users\\…').replace(/\/(home|Users)\/[^\/\s]+/g, '/$1/…').slice(0, 1800);
  async function call(m, p) { try { const r = await cfg.call(m, p || {}); return r || {}; } catch (e) { return {}; } }
  function css() {
    if (document.getElementById('cr-css')) return;
    const st = document.createElement('style'); st.id = 'cr-css';
    st.textContent = `.cr-toast{position:fixed;inset-inline-start:1em;bottom:1em;z-index:9800;max-width:min(26em,calc(100vw - 2em));background:var(--color-surface-container-high,var(--color-surface));color:var(--color-on-surface);border-radius:var(--radius-lg,1em);box-shadow:0 .25em 1em var(--color-shadow,rgba(0,0,0,.25));padding:.8em 1em;font-family:var(--font-ui,inherit);font-size:.95em;line-height:1.45}
.cr-toast b{display:block;margin-bottom:.2em}.cr-toast small{display:block;opacity:.75;margin:.2em 0 .5em;word-break:break-word}
.cr-toast .cr-acts{display:flex;flex-wrap:wrap;gap:.4em}.cr-toast button{font:inherit;cursor:pointer;border:0;border-radius:var(--radius-pill,2em);padding:.35em .9em;background:var(--color-secondary-container,var(--color-surface-container-low));color:var(--color-on-secondary-container,inherit)}
.cr-toast button.cr-pri{background:var(--color-primary);color:var(--color-on-primary)}.cr-toast button.cr-link{background:transparent;text-decoration:underline;padding-inline:.3em}`;
    document.head.append(st);
  }
  function hide() { if (box) box.remove(); box = null; }
  function offer(kind, msg, stack) {
    if (off || !cfg || offered) return;   // 1.1.0: פעם אחת בהפעלה
    const sig = kind + ':' + String(msg).slice(0, 160); if (seen.has(sig)) return; seen.add(sig);
    pending = { kind, msg: clean(msg), stack: clean(stack) };
    if (box) return; offered = true;   // הודעה אחת בכל פעם
    css(); box = document.createElement('aside'); box.className = 'cr-toast'; box.setAttribute('role', 'alert');
    box.innerHTML = `<b>אירעה תקלה ב${esc(cfg.plugin)}</b><small>${esc(pending.msg)}</small><div class="cr-acts"><button class="cr-pri" data-cr="send">שליחת דיווח למפתח</button><button data-cr="close">לא עכשיו</button><button class="cr-link" data-cr="never">לא להציע שוב</button></div>`;
    box.addEventListener('click', async e => {
      const a = e.target.closest('[data-cr]'); if (!a) return; const k = a.dataset.cr;
      if (k === 'send') { hide(); await send(); }
      else if (k === 'close') hide();
      else if (k === 'never') { off = true; hide(); call('storage.set', { key: KEY, value: true }); }
    });
    document.body.append(box);
  }
  async function send(extra) {
    const p = pending || {}; let app = '';
    const i = await call('app.getInfo'); const d = i && (i.data || i); if (d && d.version) app = d.version;
    const details = [`[${cfg.plugin} ${cfg.version || ''}] דיווח קריסה אוטומטי`, `סוג: ${p.kind || 'error'}`, `הודעה: ${p.msg || ''}`,
      p.stack ? `מחסנית:\n${p.stack}` : '', `אוצריא: ${app || 'לא ידוע'} · ${navigator.userAgent.slice(0, 120)}`, extra || ''].filter(Boolean).join('\n');
    const r = await call('feedback.report', { details: details.slice(0, 4900), reportType: 'crash' });
    const st = r && (r.data !== undefined ? r.data : r);
    if (st === 'queued') call('ui.showMessage', { message: 'הדיווח נשמר וישלח כשיהיה חיבור לאינטרנט' });
    return st;
  }
  const CrashReport = {
    VERSION: '1.1.0',
    /* מתג בהגדרות התוסף: false = לא להציע דיווח (נשמר ב-storage) */
    setEnabled(v) { off = !v; hide(); if (cfg) call('storage.set', { key: KEY, value: !v }); },
    isEnabled: () => !off,
    ready: () => cfg ? call('storage.get', { key: KEY }).then(r => { const v = r && (r.data !== undefined ? r.data : r.value); off = v === true; return !off; }) : Promise.resolve(false),
    init(o) {
      cfg = Object.assign({ plugin: 'התוסף' }, o || {}); if (typeof cfg.call !== 'function') return CrashReport;
      call('storage.get', { key: KEY }).then(r => { const v = r && (r.data !== undefined ? r.data : r.value); if (v === true) off = true; });
      root.addEventListener('error', e => { if (e && e.message) offer('error', e.message + (e.filename ? ` (${String(e.filename).split('/').pop()}:${e.lineno})` : ''), e.error && e.error.stack); });
      root.addEventListener('unhandledrejection', e => { const r = e && e.reason; if (!r) return; offer('promise', r.message || String(r), r.stack); });
      return CrashReport;
    },
    report: (msg, stack) => offer('manual', msg, stack),   // תוסף יכול לדווח בעצמו על שגיאה שנתפסה
    send
  };
  root.CrashReport = CrashReport;
})(typeof window !== 'undefined' ? window : this);
