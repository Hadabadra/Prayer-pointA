/* גבולות עירוב — תוסף לאוצריא.
   נתונים: window.ERUV_DATA (data.js), נבנה ע"י eruv-build/build_data.py מאתר מוקד העירוב, באישורם.
   מבנה: שלוש רמות ניווט — כל הארץ ← עיר ← מפה (מציג עם הגדלה, סיבוב וייצוא). */
(function () {
  'use strict';
  const D = window.ERUV_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const hasOtz = typeof window.Otzaria !== 'undefined';
  const call = async (method, params) => {
    if (!hasOtz) return { success: false };
    try { return await Otzaria.call(method, params || {}); } catch (e) { return { success: false, error: e }; }
  };

  // ── אינדקסים ────────────────────────────────────────────────
  const mapById = new Map(D.maps.map(m => [m.id, m]));
  const byCity = new Map(D.cities.map(c => [c, { maps: [], areas: [] }]));
  D.maps.forEach(m => byCity.get(m.city).maps.push(m));
  D.areas.forEach(a => byCity.get(a.city).areas.push(a));
  const areasOfMap = id => D.areas.filter(a => a.maps.includes(id));
  const srcOf = (m, thumb) => m.user ? m.url : `maps/${m.id}${thumb ? '.t' : ''}.webp`;
  // מפה כללית של העיר — לשכונה שאין לה מפה משלה (למשל פרדס כץ במפת בני ברק)
  function generalMap(city) {
    const ms = (byCity.get(city) || { maps: [] }).maps.filter(m => !m.user);
    return ms.find(m => /כלל|השכונתיים|כל העיר|מפה כללית/.test(m.title)) || (ms.length === 1 ? ms[0] : null);
  }

  // ── מצב ושמירה ──────────────────────────────────────────────
  const state = { view: 'home', city: null, q: '', favs: [], recent: [] };
  async function loadPrefs() {
    for (const k of ['favs', 'recent']) {
      const r = await call('storage.get', { key: k });
      if (r && r.success && Array.isArray(r.data)) state[k] = r.data.filter(c => byCity.has(c));
    }
  }
  const savePref = k => call('storage.set', { key: k, value: state[k] });

  // ── ערכת צבעים מאוצריא ──────────────────────────────────────
  const kebab = s => s.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
  function applyTheme(t) {
    if (!t) return;
    const root = document.documentElement.style;
    const cs = t.colorScheme || {};
    Object.keys(cs).forEach(k => root.setProperty('--color-' + kebab(k), cs[k]));
    if (cs.primary) root.setProperty('--color-primary-subtle', hexA(cs.primary, .12));
    const ty = t.typography || {};
    if (ty.uiFontFamily) {
      root.setProperty('--font-ui', `'${ty.uiFontFamily}', system-ui, sans-serif`);
      root.setProperty('--font-main', `'${ty.uiFontFamily}', system-ui, sans-serif`);
    }
    document.documentElement.dataset.theme = t.mode === 'dark' ? 'dark' : 'light';
  }
  function hexA(hex, a) {
    const m = /^#?([0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex || '');
    if (!m) return hex;
    const v = m[1].slice(-6); // ‎#AARRGGBB או ‎#RRGGBB
    return `rgba(${parseInt(v.slice(0, 2), 16)}, ${parseInt(v.slice(2, 4), 16)}, ${parseInt(v.slice(4, 6), 16)}, ${a})`;
  }

  // ── עזרים ───────────────────────────────────────────────────
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s || '').replace(/[֑-ׇ"'׳״`’\-–,.()]/g, ' ').replace(/יי/g, 'י').replace(/וו/g, 'ו').replace(/\s+/g, ' ').trim();
  function hl(text, q) {
    const t = esc(text);
    if (!q) return t;
    const words = q.split(' ').filter(w => w.length > 1).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return words.length ? t.replace(new RegExp('(' + words.join('|') + ')', 'g'), '<mark>$1</mark>') : t;
  }
  const fmtPhone = p => {
    const d = p.replace(/\D/g, '');
    if (d.length === 10) return d.slice(0, 3) + '-' + d.slice(3);
    if (d.length === 9) return d.slice(0, 2) + '-' + d.slice(2);
    return p;
  };
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
  }
  async function copyPhone(p) {
    const v = fmtPhone(p);
    try { await navigator.clipboard.writeText(v); toast('המספר ' + v + ' הועתק'); }
    catch (e) { toast('טלפון: ' + v); }
  }
  const ICON = {
    phone: '<svg viewBox="0 0 24 24"><path d="M6.6 3.5l2.6.4 1.3 4-1.9 1.5a11 11 0 0 0 6 6l1.5-1.9 4 1.3.4 2.6c-.2 1.5-1.6 2.6-3.1 2.6A15.6 15.6 0 0 1 4 6.6C4 5.1 5.1 3.7 6.6 3.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    map: '<svg viewBox="0 0 24 24"><path d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4zM9 4v13M15 6.5v13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15 15l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    star: '★'
  };

  // ── כרטיס אחראי ─────────────────────────────────────────────
  function areaHTML(a, q, opts = {}) {
    let mapsChips = opts.noMaps ? '' : a.maps.map(id => {
      const m = mapById.get(id);
      return `<button class="chip map" data-open-map="${id}" title="פתיחת המפה">${ICON.map}${esc(m.title)}</button>`;
    }).join('');
    const own = (byCity.get(a.city) || { maps: [] }).maps.filter(m => m.user && m.area && norm(a.area).includes(norm(m.area)));
    if (!opts.noMaps) mapsChips += own.map(m => `<button class="chip map" data-open-map="${m.id}">${ICON.map}${esc(m.title)} (שלי)</button>`).join('');
    const gm = !opts.noMaps && !a.maps.length && !own.length && generalMap(a.city);
    if (gm) mapsChips += `<button class="chip map" data-open-map="${gm.id}" title="השכונה מסומנת במפה הכללית של העיר">${ICON.map}מפה כללית</button>`;
    const phones = a.phones.map(p => `<button class="chip" data-phone="${esc(p)}" title="העתקת המספר">${ICON.phone}${esc(fmtPhone(p))}</button>`).join('');
    return `<div class="area${opts.hl ? ' hl' : ''}">
      <span class="area-num">${esc(a.n || '•')}</span>
      <div class="area-body">
        <div class="area-title">${opts.withCity ? esc(a.city) + ' · ' : ''}${hl(a.area || 'כל השכונה', q)}</div>
        <div class="area-names">${a.names.length ? hl(a.names.join(' · '), q) : 'שם האחראי לא צוין'}</div>
        <div class="area-actions">${phones}${mapsChips}</div>
      </div></div>`;
  }
  function mapCardHTML(m) {
    return `<button class="map-card" data-open-map="${m.id}">
      <img src="${esc(srcOf(m, true))}" alt="" loading="lazy">
      <div class="meta"><strong>${esc(m.title)}</strong>${m.user ? '<span class="own">שלי</span>' : ''}<span>${areasOfMap(m.id).length || ''}${areasOfMap(m.id).length ? ' אחראים' : ''}</span></div>
    </button>`;
  }

  // ── סרגל הערים ──────────────────────────────────────────────
  function renderRail() {
    $('#cityCount').textContent = D.cities.length;
    const item = c => {
      const n = byCity.get(c);
      const on = !state.q.trim() && state.view === 'city' && state.city === c;
      return `<button class="rail-item${on ? ' on' : ''}" data-city="${esc(c)}">
        ${state.favs.includes(c) ? `<span class="star">${ICON.star}</span>` : ''}
        <span class="name">${esc(c)}</span><span class="badge">${n.maps.length || ''}</span></button>`;
    };
    const favs = state.favs.filter(c => byCity.has(c));
    $('#cityList').innerHTML = (favs.length ? favs.map(item).join('') + '<div class="rail-sep"></div>' : '') + D.cities.map(item).join('');
  }

  // ── מסכים ───────────────────────────────────────────────────
  function render() {
    renderRail();
    const main = $('#main');
    if (state.q.trim()) { $('#crumb').textContent = 'חיפוש'; main.innerHTML = searchView(); }
    else if (state.view === 'city') { $('#crumb').textContent = state.city; main.innerHTML = cityView(state.city); }
    else { $('#crumb').textContent = 'כל הארץ'; main.innerHTML = homeView(); }
    main.scrollTop = 0;
  }

  function homeView() {
    const card = c => {
      const n = byCity.get(c); const m = n.maps[0];
      const thumb = m ? `<div class="city-thumb" style="background-image:url('${esc(srcOf(m, true))}')"></div>`
        : `<div class="city-thumb empty">${ICON.phone}</div>`;
      const fav = state.favs.includes(c) ? `<span class="fav-pin">${ICON.star}</span>` : '';
      return `<button class="city-card" data-city="${esc(c)}">${fav}${thumb}
        <div class="city-meta"><strong>${esc(c)}</strong>
        <span>${n.maps.length ? n.maps.length + ' מפות' : 'אחראים בלבד'}${n.areas.length ? ' · ' + n.areas.length + ' שכונות' : ''}</span></div></button>`;
    };
    const recent = state.recent.filter(c => byCity.has(c)).slice(0, 4);
    return `<div class="wrap">
      <div class="hero"><div class="grow"><h2>גבולות העירובים השכונתיים</h2>
      <p>${D.maps.length} מפות ו־${D.areas.length} אחראים ב־${D.cities.length} ערים. בחרו עיר או חפשו שכונה, רחוב או שם רב.</p></div>
      <button class="btn tonal" data-add-map="">${ICON.map} הוספת מפה משלי</button></div>
      ${recent.length ? `<div class="section-title">נצפו לאחרונה</div><div class="city-grid">${recent.map(card).join('')}</div>` : ''}
      <div class="section-title">כל הערים</div>
      <div class="city-grid">${D.cities.map(card).join('')}</div>
      ${sourceCard()}</div>`;
  }

  function cityView(c) {
    const n = byCity.get(c);
    const fav = state.favs.includes(c);
    return `<div class="wrap">
      <div class="hero"><div class="grow"><h2>${esc(c)}</h2>
        <p>${n.maps.length ? n.maps.length + ' מפות עירוב' : 'אין עדיין מפה לעיר זו, אך יש אחראים מקומיים'}${n.areas.length ? ' · ' + n.areas.length + ' שכונות עם אחראי' : ''}</p></div>
        <button class="btn text" data-add-map="${esc(c)}">${ICON.map} הוספת מפה משלי</button>
        <button class="btn ${fav ? 'tonal' : 'text'}" data-fav="${esc(c)}">${ICON.star} ${fav ? 'במועדפים' : 'הוספה למועדפים'}</button>
      </div>
      ${n.maps.length ? `<div class="section-title">מפות</div><div class="map-grid">${n.maps.map(mapCardHTML).join('')}</div>` : ''}
      ${n.areas.length ? `<div class="section-title">אחראים לפי שכונה</div><div class="area-list">${n.areas.map(a => areaHTML(a, '')).join('')}</div>` : ''}
      ${sourceCard()}</div>`;
  }

  function searchView() {
    const q = norm(state.q);
    const words = q.split(' ').filter(Boolean);
    const match = s => { const t = norm(s); return words.every(w => t.includes(w)); };
    const cities = D.cities.filter(match);
    const maps = D.maps.filter(m => match(m.city + ' ' + m.title));
    const areas = D.areas.filter(a => match([a.city, a.area, a.names.join(' ')].join(' ')));
    if (!cities.length && !maps.length && !areas.length) {
      return `<div class="empty-state">${ICON.search}<strong>לא נמצא "${esc(state.q)}"</strong>
        אפשר לחפש שם עיר, שכונה, רחוב או שם האחראי. למקום שאינו ברשימה: מוקד העירוב, 054-8483320.</div>`;
    }
    const qh = state.q.trim();
    return `<div class="wrap">
      <div class="hero"><div class="grow"><h2>תוצאות עבור "${esc(qh)}"</h2>
      <p>${cities.length} ערים · ${maps.length} מפות · ${areas.length} אחראים</p></div></div>
      ${cities.length ? `<div class="section-title">ערים</div><div class="city-grid">${cities.map(c => {
        const n = byCity.get(c);
        return `<button class="city-card" data-city="${esc(c)}">${n.maps[0] ? `<div class="city-thumb" style="background-image:url('${esc(srcOf(n.maps[0], true))}')"></div>` : ''}
          <div class="city-meta"><strong>${hl(c, qh)}</strong><span>${n.maps.length} מפות · ${n.areas.length} שכונות</span></div></button>`;
      }).join('')}</div>` : ''}
      ${maps.length ? `<div class="section-title">מפות</div><div class="map-grid">${maps.map(m => mapCardHTML(m).replace(`<strong>${esc(m.title)}</strong>`, `<strong>${hl(m.city + ' · ' + m.title, qh)}</strong>`)).join('')}</div>` : ''}
      ${areas.length ? `<div class="section-title">אחראים</div><div class="area-list">${areas.slice(0, 120).map(a => areaHTML(a, qh, { withCity: true })).join('')}</div>` : ''}
    </div>`;
  }

  function sourceCard() {
    return `<div class="source-card"><div class="grow"><b>מקור:</b> ${esc(D.source.name)}, באישורם. ${esc(D.source.note)}
      עודכן ${esc(D.built)}.</div>
      <button class="btn text" data-url="${esc(D.source.site)}">לאתר המוקד</button>
      <button class="btn tonal" data-phone="${esc(D.source.phone)}">${ICON.phone} מענה הלכתי ${esc(D.source.phone)}</button></div>`;
  }

  // ── ניווט ───────────────────────────────────────────────────
  function goCity(c) {
    state.view = 'city'; state.city = c; state.q = ''; $('#q').value = '';
    state.recent = [c, ...state.recent.filter(x => x !== c)].slice(0, 8); savePref('recent');
    render();
  }
  function goHome() { state.view = 'home'; state.city = null; state.q = ''; $('#q').value = ''; render(); }
  function toggleFav(c) {
    state.favs = state.favs.includes(c) ? state.favs.filter(x => x !== c) : [...state.favs, c];
    savePref('favs'); render();
    toast(state.favs.includes(c) ? c + ' נוסף למועדפים' : c + ' הוסר מהמועדפים');
  }

  // ── מציג המפה: הזזה, הגדלה, סיבוב ──────────────────────────
  const V = { m: null, x: 0, y: 0, s: 1, r: 0, w: 0, h: 0, min: .05, max: 8 };
  const stage = $('#stage'), img = $('#vImg');
  function apply(anim) {
    stage.classList.toggle('anim', !!anim);
    img.style.transform = `translate(${V.x}px, ${V.y}px) scale(${V.s}) translate(${V.w / 2}px, ${V.h / 2}px) rotate(${V.r}deg) translate(${-V.w / 2}px, ${-V.h / 2}px)`;
    $('#vZoom').textContent = Math.round(V.s * 100) + '%';
  }
  function fit(anim) {
    const b = stage.getBoundingClientRect();
    const rw = V.r % 180 ? V.h : V.w, rh = V.r % 180 ? V.w : V.h;
    V.s = Math.min((b.width - 32) / rw, (b.height - 32) / rh);
    V.min = Math.min(V.s, 1) * .5;
    V.x = b.width / 2 - V.s * V.w / 2; V.y = b.height / 2 - V.s * V.h / 2;
    apply(anim);
  }
  function zoomAt(k, px, py, anim) {
    const ns = Math.max(V.min, Math.min(V.max, V.s * k)); k = ns / V.s;
    V.x = px - (px - V.x) * k; V.y = py - (py - V.y) * k; V.s = ns; apply(anim);
  }
  const center = () => { const b = stage.getBoundingClientRect(); return [b.width / 2, b.height / 2]; };

  function openMap(id) {
    const m = mapById.get(id); if (!m) return;
    V.m = m; V.r = 0; V.w = m.w; V.h = m.h;
    $('#vTitle').textContent = m.city + ' · ' + m.title;
    $('#vSub').textContent = m.user ? 'מפה שהוספת · להתמצאות בלבד' : 'מוקד העירוב · להתמצאות בלבד';
    const ar = areasOfMap(id);
    const side = $('#vSidePanel');
    side.innerHTML = `<h3>אחראים במפה זו</h3>` +
      (ar.length ? ar.map(a => areaHTML(a, '', { noMaps: true })).join('') : `<p class="area-names">לא שויכו אחראים למפה זו. בדף העיר ${esc(m.city)} יש רשימה מלאה.</p>`) +
      (m.user ? `<button class="btn text" data-del-map="${m.id}">הסרת המפה שהוספתי</button>` : `<button class="btn text" data-url="${esc(m.pageUrl)}">פתיחת הדף באתר המוקד</button>`);
    $('#viewer').classList.toggle('side-off', (!ar.length && !m.user) || innerWidth < 760);
    $('#vSide').classList.toggle('on', !$('#viewer').classList.contains('side-off'));
    $('#viewer').hidden = false;
    img.style.transform = ''; img.onload = () => { if (!V.w || m.user) { V.w = m.w = img.naturalWidth; V.h = m.h = img.naturalHeight; } fit(false); };
    img.removeAttribute('width'); img.removeAttribute('height');
    img.src = srcOf(m); if (m.w) { img.width = m.w; img.height = m.h; requestAnimationFrame(() => fit(false)); }
    const hint = $('#vHint'); hint.classList.remove('gone'); setTimeout(() => hint.classList.add('gone'), 3500);
    $('#vClose').focus();
  }
  function closeMap() { $('#viewer').hidden = true; $('#expMenu').hidden = true; img.removeAttribute('src'); }

  stage.addEventListener('wheel', e => {
    e.preventDefault();
    const b = stage.getBoundingClientRect();
    zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0018)), e.clientX - b.left, e.clientY - b.top);
  }, { passive: false });
  const ptrs = new Map(); let last = null, pinch = null;
  stage.addEventListener('pointerdown', e => {
    stage.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    stage.classList.add('drag'); last = [e.clientX, e.clientY];
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); }
  });
  stage.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptrs.size === 2 && pinch) {
      const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const r = stage.getBoundingClientRect();
      zoomAt(d / pinch, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top); pinch = d; return;
    }
    if (ptrs.size === 1 && last) { V.x += e.clientX - last[0]; V.y += e.clientY - last[1]; last = [e.clientX, e.clientY]; apply(); }
  });
  const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size) { stage.classList.remove('drag'); last = null; } };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  stage.addEventListener('dblclick', e => { const b = stage.getBoundingClientRect(); zoomAt(2.2, e.clientX - b.left, e.clientY - b.top, true); });
  new ResizeObserver(() => { if (!$('#viewer').hidden) fit(false); }).observe(stage);

  $('#vClose').onclick = closeMap;
  $('#vIn').onclick = () => zoomAt(1.4, ...center(), true);
  $('#vOut').onclick = () => zoomAt(1 / 1.4, ...center(), true);
  $('#vFit').onclick = () => fit(true);
  $('#vRot').onclick = () => { V.r = (V.r + 90) % 360; fit(true); };
  $('#vSide').onclick = () => { const v = $('#viewer'); v.classList.toggle('side-off'); $('#vSide').classList.toggle('on', !v.classList.contains('side-off')); };

  // ── ייצוא: PNG / JPG / הדפסה ─────────────────────────────────
  $('#vExp').onclick = e => { e.stopPropagation(); $('#expMenu').hidden = !$('#expMenu').hidden; };
  document.addEventListener('click', () => { $('#expMenu').hidden = true; });
  $('#expMenu').addEventListener('click', e => {
    const b = e.target.closest('[data-exp]'); if (!b) return;
    $('#expMenu').hidden = true;
    if (b.dataset.exp === 'print') printMap(); else exportImage(b.dataset.exp);
  });

  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function composeCanvas() {
    const m = V.m, W = img.naturalWidth || m.w, H = img.naturalHeight || m.h;
    const band = Math.round(W * .055), pad = Math.round(band * .3);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H + band;
    const g = cv.getContext('2d');
    g.fillStyle = cssVar('--color-surface') || 'white'; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = cssVar('--color-surface-container-high') || 'white'; g.fillRect(0, 0, W, band);
    const font = cssVar('--font-ui') || 'sans-serif';
    g.direction = 'rtl'; g.textAlign = 'right'; g.textBaseline = 'middle';
    g.fillStyle = cssVar('--color-on-surface') || 'black';
    g.font = `600 ${Math.round(band * .36)}px ${font}`;
    g.fillText(`גבולות עירוב · ${m.city} · ${m.title}`, W - pad, band * .36);
    g.fillStyle = cssVar('--color-on-surface-variant') || 'black';
    g.font = `400 ${Math.round(band * .22)}px ${font}`;
    g.fillText(`מקור: מוקד העירוב (${D.source.phone}). להתמצאות בלבד — יש לוודא מול האחראי המקומי לפני שבת.`, W - pad, band * .75);
    g.drawImage(img, 0, band, W, H);
    return cv;
  }
  async function exportImage(kind) {
    if (!img.complete) { toast('המפה עדיין נטענת'); return; }
    const type = kind === 'jpg' ? 'image/jpeg' : 'image/png';
    let blob = null;
    try { blob = await new Promise(r => composeCanvas().toBlob(r, type, .92)); } catch (e) { blob = null; }
    if (!blob) { toast('לא ניתן ליצור את קובץ התמונה'); return; }
    const name = `עירוב ${V.m.city} - ${V.m.title}`.replace(/[\\/:*?"<>|]/g, '');
    if (!hasOtz) { // מחוץ לאוצריא (בדיקה בדפדפן)
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name + '.' + kind; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000); return;
    }
    const begin = await call('fs.beginBinaryWrite', { purpose: 'user-file', expectedSize: blob.size });
    if (!begin.success) { toast('לא ניתן לשמור: אין הרשאת שמירת קבצים'); return; }
    try {
      const put = await fetch(begin.data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': type }, body: blob });
      if (!put.ok) throw new Error(put.status);
    } catch (e) { toast('השמירה נכשלה'); return; }
    const res = await call('fs.commitUserFileWrite', { writeToken: begin.data.writeToken, suggestedName: name, extension: kind, title: 'שמירת מפת העירוב' });
    if (res.success && res.data && !res.data.cancelled) toast('המפה נשמרה: ' + (res.data.name || name));
    else if (!res.success) toast('השמירה נכשלה');
  }
  function printMap() {
    const m = V.m, ps = $('#printSheet');
    ps.innerHTML = `<h1>גבולות עירוב · ${esc(m.city)} · ${esc(m.title)}</h1>
      <p>מקור: מוקד העירוב (${esc(D.source.phone)}). להתמצאות בלבד — יש לוודא מול האחראי המקומי לפני שבת.</p>
      <img src="${esc(srcOf(m))}" alt="">`;
    const go = () => {
      document.body.classList.add('printing');
      const done = () => { document.body.classList.remove('printing'); ps.innerHTML = ''; removeEventListener('afterprint', done); };
      addEventListener('afterprint', done); window.print(); setTimeout(done, 60000);
    };
    const pi = ps.querySelector('img'); pi.complete ? go() : (pi.onload = go);
  }

  // ── מפות שהמשתמש מוסיף (למשל מפה מקומית של פרדס כץ) ─────────
  // נשמרים רק ה-token של הקובץ ופרטי התיאור, ב-storage 'userMaps'. ה-URL נבנה מחדש בכל הפעלה.
  async function loadOwnMaps() {
    const r = await call('storage.get', { key: 'userMaps' });
    const list = r && r.success && Array.isArray(r.data) ? r.data : [];
    for (const u of list) {
      const f = await call('fs.resolveFileUrl', { token: u.token });
      if (!f.success) continue;
      attachOwn({ ...u, url: f.data.url });
    }
  }
  function attachOwn(u) {
    const m = { id: u.id, city: u.city, title: u.title, area: u.area || '', user: true, url: u.url, token: u.token, w: 0, h: 0 };
    if (!byCity.has(m.city)) { byCity.set(m.city, { maps: [], areas: [] }); D.cities.push(m.city); D.cities.sort((a, b) => a.localeCompare(b, 'he')); }
    byCity.get(m.city).maps.push(m); mapById.set(m.id, m); D.maps.push(m);
  }
  const ownList = () => D.maps.filter(m => m.user).map(({ id, city, title, area, token }) => ({ id, city, title, area, token }));
  async function addOwnMap(city) {
    if (!hasOtz) { toast('הוספת מפה זמינה בתוך אוצריא'); return; }
    const f = await call('fs.pickUserFile', { title: 'בחירת תמונת מפת עירוב', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] });
    if (!f.success) { toast('אין הרשאה לבחירת קובץ'); return; }
    if (f.data.cancelled) return;
    const base = (f.data.name || 'מפה').replace(/\.[^.]+$/, '');
    const ans = await ownMapDialog(city, base);
    if (!ans) return;
    const { title, area } = ans; city = ans.city;
    attachOwn({ id: 'u-' + Date.now().toString(36), city, title, area, token: f.data.token, url: f.data.url });
    await call('storage.set', { key: 'userMaps', value: ownList() });
    render(); toast('המפה נוספה ל' + city);
  }
  // דיאלוג בתוך הדף (prompt/confirm חוסמים באוצריא)
  function ownMapDialog(city, title) {
    return new Promise(res => {
      const sc = document.createElement('div'); sc.className = 'sheet-scrim';
      sc.innerHTML = `<form class="sheet" role="dialog"><h2>הוספת מפה משלי</h2>
        <p>המפה תישמר אצלך בלבד, ותופיע בעיר ובשכונה שתבחרי.</p>
        <label class="field"><span>עיר</span><input name="city" list="dlCities" required value="${esc(city || '')}"></label>
        <datalist id="dlCities">${D.cities.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
        <label class="field"><span>שם המפה</span><input name="title" required value="${esc(title)}"></label>
        <label class="field"><span>שכונה (לקישור לאחראים, לא חובה)</span><input name="area" placeholder="למשל: פרדס כץ"></label>
        <div class="sheet-actions"><button type="button" class="btn text" data-x>ביטול</button><button class="btn filled">הוספה</button></div></form>`;
      document.body.appendChild(sc);
      const f = sc.querySelector('form'); (city ? f.title : f.city).focus();
      const done = v => { sc.remove(); res(v); };
      sc.querySelector('[data-x]').onclick = () => done(null);
      sc.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); done(null); } });
      f.onsubmit = e => { e.preventDefault(); done({ city: f.city.value.trim(), title: f.title.value.trim(), area: f.area.value.trim() }); };
    });
  }
  async function delOwnMap(id) {
    const m = mapById.get(id); if (!m) return;
    const ok = await call('ui.showConfirm', { title: 'הסרת מפה', content: 'להסיר את "' + m.title + '" מהתוסף? הקובץ עצמו לא יימחק.' });
    if (ok.success && ok.data && !ok.data.confirmed) return;
    D.maps.splice(D.maps.indexOf(m), 1); mapById.delete(id);
    const c = byCity.get(m.city); c.maps.splice(c.maps.indexOf(m), 1);
    await call('storage.set', { key: 'userMaps', value: ownList() });
    closeMap(); render(); toast('המפה הוסרה');
  }

  // ── יומן שינויים ותגובות ─────────────────────────────────────
  const REPO = 'https://github.com/Hadabadra/Prayer-pointA';
  const CHANGELOG = [
    ['0.2.1', ['שליחת תגובה מתוך התוסף דרך אוצריא', 'יומן שינויים וקישור לתכנון המתעדכן בגיטהאב']],
    ['0.2.0', ['כפתור "מפה כללית" לשכונות בלי מפה משלהן (פרדס כץ, קרית הרצוג ועוד)', 'הוספת מפה משלי מהמחשב, עם קישור לשכונה ולאחראים']],
    ['0.1.0', ['66 מפות ו־206 אחראים מאת מוקד העירוב', 'חיפוש, מציג עם הגדלה וסיבוב, ייצוא לתמונה ולהדפסה, מועדפים']]
  ];
  async function sendFeedback() {
    const t = ($('#fbText').value || '').trim();
    if (!t) { $('#fbText').focus(); return; }
    const r = await call('feedback.report', { details: '[גבולות עירוב ' + VERSION + '] ' + t, reportType: 'feedback' });
    if (r.success && r.data === 'cancelled') return;
    if (r.success) { $('#fbText').value = ''; toast(r.data === 'queued' ? 'התגובה תישלח כשיהיה חיבור' : 'התגובה נשלחה, תודה!'); }
    else toast('השליחה זמינה בתוך אוצריא');
  }
  const VERSION = '0.2.1';

  // ── אודות ───────────────────────────────────────────────────
  function openInfo() {
    $('#infoBody').innerHTML = `
      <p>המפות ורשימת האחראים מאתר <b>מוקד העירוב</b>, באישורם. המוקד נותן מענה הלכתי בטלפון ${esc(D.source.phone)}.
      ${esc(D.source.note)} מטרת התוסף היא התמצאות בלבד, ולפני שבת יש לוודא מול האחראי המקומי שהעירוב תקין.</p>
      <div class="levels">
        <div class="level done"><span class="dot">1</span><div><b>מפות ואחראים</b>${D.maps.length} מפות ו־${D.areas.length} אחראים, בלי צורך באינטרנט.</div></div>
        <div class="level"><span class="dot">2</span><div><b>קווי עירוב על מפת רחובות</b>המרת המפות לקווים מדויקים, עם הגדלה עד רמת הבית.</div></div>
        <div class="level"><span class="dot">3</span><div><b>בדיקת כתובת</b>הקלדת כתובת, וסימון אם היא בתוך העירוב ובאיזה עירוב.</div></div>
        <div class="level"><span class="dot">4</span><div><b>עדכונים מהמוקד</b>משיכת שינויים ממוקד העירוב כשהאינטרנט זמין.</div></div>
      </div>
      <p>קיצורי מקשים: <b>/</b> חיפוש · במציג: <b>+ / -</b> הגדלה, <b>0</b> התאמה, <b>R</b> סיבוב, <b>Esc</b> סגירה.</p>
      <p>הנתונים עודכנו ב־${esc(D.built)}.</p>
      <h3 class="info-h">שליחת תגובה</h3>
      <textarea id="fbText" rows="3" placeholder="הערה, תיקון או שכונה חסרה — נשלח דרך אוצריא למפתחת"></textarea>
      <div class="sheet-actions"><button class="btn filled" id="fbSend">שליחה</button></div>
      <h3 class="info-h">יומן שינויים</h3>
      ${CHANGELOG.map(c => `<div class="cl"><b>${esc(c[0])}</b><ul>${c[1].map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}
      <p><button class="btn text" data-url="${REPO}/blob/%D7%92%D7%91%D7%95%D7%9C%D7%95%D7%AA-%D7%A2%D7%99%D7%A8%D7%95%D7%91/gvulot-eruv-docs/PLAN.md">התכנון המלא בגיטהאב (מתעדכן)</button>
      <button class="btn text" data-url="${REPO}/releases">כל הגרסאות</button></p>`;
    $('#fbSend').onclick = sendFeedback;
    $('#infoScrim').hidden = false; $('#infoClose').focus();
  }

  // ── אירועים כלליים ─────────────────────────────────────────
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-open-map],[data-city],[data-phone],[data-fav],[data-url],[data-add-map],[data-del-map]');
    if (!t) return;
    if (t.dataset.addMap !== undefined) addOwnMap(t.dataset.addMap);
    else if (t.dataset.delMap) delOwnMap(t.dataset.delMap);
    else if (t.dataset.openMap) openMap(t.dataset.openMap);
    else if (t.dataset.fav) toggleFav(t.dataset.fav);
    else if (t.dataset.city) goCity(t.dataset.city);
    else if (t.dataset.phone) copyPhone(t.dataset.phone);
    else if (t.dataset.url) call('app.openUrl', { url: t.dataset.url }).then(r => { if (!r.success && !hasOtz) open(t.dataset.url); });
  });
  let qT;
  $('#q').addEventListener('input', e => { clearTimeout(qT); qT = setTimeout(() => { state.q = e.target.value; render(); }, 120); });
  $('#q').addEventListener('keydown', e => {
    if (e.key === 'Enter') { const f = $('#main [data-city], #main [data-open-map]'); if (f) f.click(); }
    if (e.key === 'Escape') { e.target.value = ''; state.q = ''; render(); }
  });
  $('#btnHome').onclick = goHome;
  $('#btnInfo').onclick = openInfo;
  $('#infoClose').onclick = () => { $('#infoScrim').hidden = true; };
  $('#infoScrim').addEventListener('click', e => { if (e.target.id === 'infoScrim') e.target.hidden = true; });
  document.addEventListener('keydown', e => {
    const inField = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (!$('#viewer').hidden) {
      if (e.key === 'Escape') closeMap();
      else if (e.key === '+' || e.key === '=') zoomAt(1.4, ...center(), true);
      else if (e.key === '-') zoomAt(1 / 1.4, ...center(), true);
      else if (e.key === '0') fit(true);
      else if (e.key === 'r' || e.key === 'R' || e.key === 'ר') { V.r = (V.r + 90) % 360; fit(true); }
      return;
    }
    if (e.key === 'Escape' && !$('#infoScrim').hidden) { $('#infoScrim').hidden = true; return; }
    if (e.key === '/' && !inField) { e.preventDefault(); $('#q').focus(); }
  });

  // ── אתחול ───────────────────────────────────────────────────
  async function start(payload) {
    if (payload && payload.theme) applyTheme(payload.theme);
    else { const r = await call('app.getTheme'); if (r.success) applyTheme(r.data); }
    await loadPrefs();
    await loadOwnMaps();
    render();
    $('#q').focus();
  }
  if (hasOtz) {
    Otzaria.on('plugin.boot', start);
    Otzaria.on('theme.changed', applyTheme);
  } else {
    start(null);
  }
})();
