/* map-files 1.0 — קובצי מפות מהמחשב לתוספי אוצריא (מקוואות · גבולות עירוב · טהרת כהנים · כיוון תפילה · עינים למקרא).
   המקור היחיד: Hadabadra/Mikvaot/shared/map-files. כל תוסף מעתיק את הקובץ בשלמותו.

   סוגים:
     שכבות (נקודות, קווים, שטחים): GeoJSON, TopoJSON, KML, KMZ, GPX, CSV (עמודות lat/lon).
     מפות רקע (אריחים): MBTiles (רסטר ווקטור), PMTiles v3, ‏sqlitedb של OsmAnd/RMaps/Locus, כל SQLite עם טבלת אריחים
       (כך נבדק גם mapsdata), ZIP עם תיקיות z/x/y. אריח וקטורי (MVT) מצויר כאן לתמונה.
     מפות Windows (‎C:\ProgramData\Maps): מזוהות, אבל הן מוצפנות ואי אפשר להציג אותן — מוצגת הודעה.
   קובץ גדול (גם יותר מ-1GB) נקרא בחלקים (HTTP Range) כשהשרת המקומי של אוצריא תומך בזה; אחרת נטען שלם עד 400MB.

   MapFiles.pick(call)                       → {kind:'vector', geojson, name} | {kind:'tiles', source, name} | null
   MapFiles.openUrl(url, name, size)         → אותו דבר, מכתובת
   source: { name, format, minzoom, maxzoom, bounds:[w,s,e,n], center:[lat,lon,z], tileType, getTile(z,x,y) → Promise<blobURL|null> } */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MapFiles = factory();
})(this, function () {
  'use strict';
  const MAX_WHOLE = 400 * 1024 * 1024;
  const EXTS = ['geojson', 'json', 'topojson', 'kml', 'kmz', 'gpx', 'csv', 'mbtiles', 'pmtiles', 'sqlitedb', 'sqlite', 'db', 'mapsdata', 'zip'];
  const td = new TextDecoder();

  /* ── קריאה בחלקים ── */
  async function reader(url, size) {
    try {
      const r = await fetch(url, { headers: { Range: 'bytes=0-15' } });
      if (r.status === 206) {
        const total = size || +((r.headers.get('Content-Range') || '').split('/')[1]) || 0;
        const cache = new Map();
        const read = async (off, len) => {
          const k = off + ':' + len;
          if (cache.has(k)) return cache.get(k);
          const rr = await fetch(url, { headers: { Range: `bytes=${off}-${off + len - 1}` } });
          const b = new Uint8Array(await rr.arrayBuffer());
          if (cache.size > 2000) cache.delete(cache.keys().next().value);
          cache.set(k, b);
          return b;
        };
        return { range: true, size: total, read };
      }
    } catch (e) { /* בלי Range — קוראים את כל הקובץ */ }
    if (size && size > MAX_WHOLE) throw new Error('הקובץ גדול מדי לטעינה מלאה (' + Math.round(size / 1048576) + 'MB), והשרת המקומי לא תומך בקריאה בחלקים');
    const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
    return { range: false, size: buf.length, read: async (off, len) => buf.subarray(off, off + len) };
  }

  async function inflate(bytes, fmt) {
    const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(fmt));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  const isGz = b => b[0] === 0x1f && b[1] === 0x8b;

  /* ── שכבות וקטוריות ── */
  function fc(features) { return { type: 'FeatureCollection', features }; }
  function parseKML(text) {
    const doc = new DOMParser().parseFromString(text, 'application/xml'), out = [];
    const coords = s => String(s || '').trim().split(/\s+/).map(t => t.split(',').map(Number)).filter(c => c.length >= 2 && !isNaN(c[0]) && !isNaN(c[1])).map(c => [c[0], c[1]]);
    for (const pm of doc.getElementsByTagName('Placemark')) {
      const name = (pm.getElementsByTagName('name')[0] || {}).textContent || '';
      const props = { name };
      for (const p of pm.getElementsByTagName('Point')) { const c = coords((p.getElementsByTagName('coordinates')[0] || {}).textContent)[0]; if (c) out.push({ type: 'Feature', properties: props, geometry: { type: 'Point', coordinates: c } }); }
      for (const l of pm.getElementsByTagName('LineString')) out.push({ type: 'Feature', properties: props, geometry: { type: 'LineString', coordinates: coords((l.getElementsByTagName('coordinates')[0] || {}).textContent) } });
      for (const pg of pm.getElementsByTagName('Polygon')) {
        const rings = [...pg.getElementsByTagName('LinearRing')].map(r => coords((r.getElementsByTagName('coordinates')[0] || {}).textContent));
        if (rings.length) out.push({ type: 'Feature', properties: props, geometry: { type: 'Polygon', coordinates: rings } });
      }
      for (const t of pm.getElementsByTagName('gx:Track')) {
        const cs = [...t.getElementsByTagName('gx:coord')].map(e => e.textContent.trim().split(/\s+/).map(Number)).map(c => [c[0], c[1]]);
        if (cs.length) out.push({ type: 'Feature', properties: props, geometry: { type: 'LineString', coordinates: cs } });
      }
    }
    return fc(out);
  }
  function parseGPX(text) {
    const doc = new DOMParser().parseFromString(text, 'application/xml'), out = [];
    const pt = e => [+e.getAttribute('lon'), +e.getAttribute('lat')];
    const nm = e => ((e.getElementsByTagName('name')[0] || {}).textContent || '');
    for (const w of doc.getElementsByTagName('wpt')) out.push({ type: 'Feature', properties: { name: nm(w) }, geometry: { type: 'Point', coordinates: pt(w) } });
    for (const t of doc.getElementsByTagName('trk')) for (const sg of t.getElementsByTagName('trkseg')) out.push({ type: 'Feature', properties: { name: nm(t) }, geometry: { type: 'LineString', coordinates: [...sg.getElementsByTagName('trkpt')].map(pt) } });
    for (const r of doc.getElementsByTagName('rte')) out.push({ type: 'Feature', properties: { name: nm(r) }, geometry: { type: 'LineString', coordinates: [...r.getElementsByTagName('rtept')].map(pt) } });
    return fc(out);
  }
  function parseCSV(text) {
    const rows = text.split(/\r?\n/).filter(l => l.trim()), sep = (rows[0].match(/\t/g) || []).length > (rows[0].match(/,/g) || []).length ? '\t' : ',';
    const split = l => { const o = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === sep && !q) { o.push(cur); cur = ''; } else cur += ch; } o.push(cur); return o.map(s => s.trim()); };
    const h = split(rows[0]).map(s => s.toLowerCase());
    const find = re => h.findIndex(x => re.test(x));
    const la = find(/^(lat|latitude|y|קו רוחב|רוחב)$/), lo = find(/^(lon|lng|long|longitude|x|קו אורך|אורך)$/), nm = find(/^(name|title|שם|תיאור)$/);
    if (la < 0 || lo < 0) throw new Error('בקובץ CSV צריכות להיות עמודות lat ו-lon');
    return fc(rows.slice(1).map(split).filter(r => !isNaN(+r[la]) && !isNaN(+r[lo]) && r[la] !== '').map(r => ({ type: 'Feature', properties: { name: nm >= 0 ? r[nm] : '' }, geometry: { type: 'Point', coordinates: [+r[lo], +r[la]] } })));
  }
  function topoToGeo(t) {
    const tr = t.transform, arcs = t.arcs.map(a => { let x = 0, y = 0; return a.map(p => tr ? (x += p[0], y += p[1], [x * tr.scale[0] + tr.translate[0], y * tr.scale[1] + tr.translate[1]]) : p); });
    const arc = i => (i < 0 ? arcs[~i].slice().reverse() : arcs[i]);
    const line = ids => ids.reduce((o, i, k) => o.concat(k ? arc(i).slice(1) : arc(i)), []);
    const pt = c => (tr ? [c[0] * tr.scale[0] + tr.translate[0], c[1] * tr.scale[1] + tr.translate[1]] : c);
    const geom = g => {
      switch (g.type) {
        case 'Point': return { type: 'Point', coordinates: pt(g.coordinates) };
        case 'MultiPoint': return { type: 'MultiPoint', coordinates: g.coordinates.map(pt) };
        case 'LineString': return { type: 'LineString', coordinates: line(g.arcs) };
        case 'MultiLineString': return { type: 'MultiLineString', coordinates: g.arcs.map(line) };
        case 'Polygon': return { type: 'Polygon', coordinates: g.arcs.map(line) };
        case 'MultiPolygon': return { type: 'MultiPolygon', coordinates: g.arcs.map(p => p.map(line)) };
        default: return null;
      }
    };
    const out = [];
    for (const o of Object.values(t.objects || {})) for (const g of (o.type === 'GeometryCollection' ? o.geometries : [o])) { const gg = geom(g); if (gg) out.push({ type: 'Feature', properties: g.properties || {}, geometry: gg }); }
    return fc(out);
  }
  function vectorFromText(text, ext) {
    const t = text.replace(/^\uFEFF/, '').trim();
    if (ext === 'gpx' || /^<\?xml[\s\S]{0,300}<gpx/.test(t) || /^<gpx/.test(t)) return parseGPX(t);
    if (ext === 'kml' || /<kml[\s>]/.test(t.slice(0, 500))) return parseKML(t);
    if (t[0] === '{' || t[0] === '[') {
      const j = JSON.parse(t);
      if (j.type === 'Topology') return topoToGeo(j);
      if (Array.isArray(j)) return fc(j.filter(x => x && x.lat != null).map(x => ({ type: 'Feature', properties: { name: x.name || x.title || '' }, geometry: { type: 'Point', coordinates: [+(x.lon != null ? x.lon : x.lng), +x.lat] } })));
      return j;
    }
    return parseCSV(t);
  }

  /* ── ZIP (KMZ, תיקיית אריחים) ── */
  async function zipIndex(rd) {
    const tail = Math.min(rd.size, 65557), b = await rd.read(rd.size - tail, tail);
    let e = -1; for (let i = b.length - 22; i >= 0; i--) if (b[i] === 0x50 && b[i + 1] === 0x4b && b[i + 2] === 5 && b[i + 3] === 6) { e = i; break; }
    if (e < 0) throw new Error('קובץ ZIP פגום');
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    let n = dv.getUint16(e + 10, true), cdSize = dv.getUint32(e + 12, true), cdOff = dv.getUint32(e + 16, true);
    if (cdOff === 0xffffffff || n === 0xffff) {   // ZIP64
      const l = await rd.read(rd.size - tail + e - 20, 20), ld = new DataView(l.buffer, l.byteOffset, 20);
      const z64 = Number(ld.getBigUint64(8, true)), r = await rd.read(z64, 56), rv = new DataView(r.buffer, r.byteOffset, 56);
      n = Number(rv.getBigUint64(32, true)); cdSize = Number(rv.getBigUint64(40, true)); cdOff = Number(rv.getBigUint64(48, true));
    }
    const cd = await rd.read(cdOff, cdSize), cv = new DataView(cd.buffer, cd.byteOffset, cd.byteLength), map = new Map();
    for (let p = 0, k = 0; k < n && p + 46 <= cd.length; k++) {
      const method = cv.getUint16(p + 10, true); let cs = cv.getUint32(p + 20, true), us = cv.getUint32(p + 24, true);
      const nl = cv.getUint16(p + 28, true), xl = cv.getUint16(p + 30, true), cl = cv.getUint16(p + 32, true); let off = cv.getUint32(p + 42, true);
      const name = td.decode(cd.subarray(p + 46, p + 46 + nl));
      if (off === 0xffffffff || cs === 0xffffffff || us === 0xffffffff) {
        for (let q = p + 46 + nl; q < p + 46 + nl + xl;) {
          const id = cv.getUint16(q, true), sz = cv.getUint16(q + 2, true); let r = q + 4;
          if (id === 1) { if (us === 0xffffffff) { us = Number(cv.getBigUint64(r, true)); r += 8; } if (cs === 0xffffffff) { cs = Number(cv.getBigUint64(r, true)); r += 8; } if (off === 0xffffffff) off = Number(cv.getBigUint64(r, true)); }
          q += 4 + sz;
        }
      }
      map.set(name.replace(/\\/g, '/'), { method, cs, off });
      p += 46 + nl + xl + cl;
    }
    const get = async name => {
      const en = map.get(name); if (!en) return null;
      const h = await rd.read(en.off, 30), hv = new DataView(h.buffer, h.byteOffset, 30);
      const data = await rd.read(en.off + 30 + hv.getUint16(26, true) + hv.getUint16(28, true), en.cs);
      return en.method === 8 ? inflate(data, 'deflate-raw') : data;
    };
    return { names: [...map.keys()], get };
  }

  /* ── PMTiles v3 ── */
  function varint(b, p) { let v = 0, s = 1; for (;;) { const x = b[p.i++]; v += (x & 0x7f) * s; if (x < 0x80) return v; s *= 128; } }
  function zxyToId(z, x, y) {
    let acc = 0; for (let t = 0; t < z; t++) acc += 4 ** t;
    const n = 2 ** z; let d = 0, rx, ry;
    for (let s = n / 2; s >= 1; s /= 2) {
      rx = (x & s) > 0 ? 1 : 0; ry = (y & s) > 0 ? 1 : 0; d += s * s * ((3 * rx) ^ ry);
      if (ry === 0) { if (rx === 1) { x = s - 1 - x; y = s - 1 - y; } const t = x; x = y; y = t; }
    }
    return acc + d;
  }
  async function pmtiles(rd, name) {
    const h = await rd.read(0, 127), v = new DataView(h.buffer, h.byteOffset, 127);
    const u64 = o => Number(v.getBigUint64(o, true));
    const H = { rootOff: u64(8), rootLen: u64(16), metaOff: u64(24), metaLen: u64(32), leafOff: u64(40), dataOff: u64(56),
      icomp: h[97], tcomp: h[98], ttype: h[99], minz: h[100], maxz: h[101],
      w: v.getInt32(102, true) / 1e7, s: v.getInt32(106, true) / 1e7, e: v.getInt32(110, true) / 1e7, n: v.getInt32(114, true) / 1e7,
      cz: h[118], clon: v.getInt32(119, true) / 1e7, clat: v.getInt32(123, true) / 1e7 };
    const dirs = new Map();
    const dir = async (off, len) => {
      const k = off + ':' + len; if (dirs.has(k)) return dirs.get(k);
      let b = await rd.read(off, len); if (H.icomp === 2) b = await inflate(b, 'gzip');
      const p = { i: 0 }, n = varint(b, p), E = [];
      let last = 0; for (let i = 0; i < n; i++) { last += varint(b, p); E.push({ id: last }); }
      for (const e of E) e.run = varint(b, p);
      for (const e of E) e.len = varint(b, p);
      for (let i = 0; i < n; i++) { const o = varint(b, p); E[i].off = o === 0 && i > 0 ? E[i - 1].off + E[i - 1].len : o - 1; }
      dirs.set(k, E); return E;
    };
    const find = (E, id) => { let lo = 0, hi = E.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1; if (E[m].id === id) return E[m]; if (E[m].id < id) lo = m + 1; else hi = m - 1; } if (hi >= 0) { const e = E[hi]; if (e.run === 0) return e; if (id - e.id < e.run) return e; } return null; };
    const getTile = async (z, x, y) => {
      const id = zxyToId(z, x, y); let off = H.rootOff, len = H.rootLen;
      for (let d = 0; d < 4; d++) {
        const e = find(await dir(off, len), id); if (!e) return null;
        if (e.run > 0) { let b = await rd.read(H.dataOff + e.off, e.len); if (H.tcomp === 2) b = await inflate(b, 'gzip'); return tileURL(b); }
        off = H.leafOff + e.off; len = e.len;
      }
      return null;
    };
    return { name, format: 'PMTiles', minzoom: H.minz, maxzoom: H.maxz, bounds: [H.w, H.s, H.e, H.n], center: [H.clat, H.clon, H.cz], tileType: ['', 'mvt', 'png', 'jpg', 'webp', 'avif'][H.ttype] || '', getTile };
  }

  /* ── SQLite (MBTiles, sqlitedb, mapsdata וכל טבלת אריחים) — קריאת עמודים בלי לטעון את הקובץ ── */
  async function sqlite(rd, name) {
    const h = await rd.read(0, 100), hv = new DataView(h.buffer, h.byteOffset, 100);
    let ps = hv.getUint16(16); if (ps === 1) ps = 65536;
    const U = ps - h[20];
    const pages = new Map();
    const page = async n => { if (pages.has(n)) return pages.get(n); const b = await rd.read((n - 1) * ps, ps); if (pages.size > 3000) pages.delete(pages.keys().next().value); pages.set(n, b); return b; };
    const vint = (b, p) => { let v = 0; for (let i = 0; i < 8; i++) { const x = b[p.i++]; v = v * 128 + (x & 0x7f); if (x < 0x80) return v; } return v * 256 + b[p.i++]; };
    const u32 = (b, o) => ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
    async function payload(b, p, P, isTable) {
      const X = isTable ? U - 35 : ((U - 12) * 64 / 255 | 0) - 23, M = ((U - 12) * 32 / 255 | 0) - 23;
      if (P <= X) return b.subarray(p, p + P);
      const K = M + (P - M) % (U - 4), L = K <= X ? K : M;
      const out = new Uint8Array(P); out.set(b.subarray(p, p + L)); let o = L, ov = u32(b, p + L);
      while (o < P && ov) { const pg = await page(ov); const n = Math.min(U - 4, P - o); out.set(pg.subarray(4, 4 + n), o); o += n; ov = u32(pg, 0); }
      return out;
    }
    function record(r) {
      const p = { i: 0 }, hs = vint(r, p), types = []; while (p.i < hs) types.push(vint(r, p));
      let o = hs; const vals = [];
      for (const t of types) {
        if (t === 0) vals.push(null);
        else if (t >= 1 && t <= 6) { const n = [0, 1, 2, 3, 4, 6, 8][t]; let v = 0; for (let i = 0; i < n; i++) v = v * 256 + r[o + i]; if (r[o] & 0x80) v -= 2 ** (8 * n); vals.push(v); o += n; }
        else if (t === 7) { vals.push(new DataView(r.buffer, r.byteOffset + o, 8).getFloat64(0)); o += 8; }
        else if (t === 8 || t === 9) vals.push(t - 8);
        else if (t >= 12) { const n = (t - (t % 2 ? 13 : 12)) / 2; const s = r.subarray(o, o + n); vals.push(t % 2 ? td.decode(s) : s); o += n; }
      }
      return vals;
    }
    async function scan(root, cb) {   // מעבר על כל השורות של טבלה (לטבלאות קטנות: sqlite_master, metadata)
      const st = [root];
      while (st.length) {
        const n = st.pop(), b = await page(n), base = n === 1 ? 100 : 0, type = b[base], cnt = (b[base + 3] << 8) | b[base + 4];
        const hdr = type === 5 || type === 2 ? 12 : 8;
        if (type === 5) { for (let i = 0; i < cnt; i++) st.push(u32(b, (b[base + hdr + i * 2] << 8) | b[base + hdr + i * 2 + 1])); st.push(u32(b, base + 8)); continue; }
        if (type !== 13) continue;
        for (let i = 0; i < cnt; i++) { const p = { i: (b[base + hdr + i * 2] << 8) | b[base + hdr + i * 2 + 1] }; const P = vint(b, p), rowid = vint(b, p); if (await cb(record(await payload(b, p.i, P, true)), rowid) === false) return; }
      }
    }
    async function byRowid(root, id) {
      let n = root;
      for (;;) {
        const b = await page(n), base = n === 1 ? 100 : 0, type = b[base], cnt = (b[base + 3] << 8) | b[base + 4];
        const cell = i => (b[base + (type === 5 ? 12 : 8) + i * 2] << 8) | b[base + (type === 5 ? 12 : 8) + i * 2 + 1];
        if (type === 5) {
          let next = u32(b, base + 8);
          for (let i = 0; i < cnt; i++) { const c = cell(i), p = { i: c + 4 }; if (id <= vint(b, p)) { next = u32(b, c); break; } }
          n = next; continue;
        }
        for (let i = 0; i < cnt; i++) { const p = { i: cell(i) }; const P = vint(b, p), rid = vint(b, p); if (rid === id) return record(await payload(b, p.i, P, true)); }
        return null;
      }
    }
    const cmp = (a, b) => { for (let i = 0; i < a.length; i++) { const x = a[i], y = b[i]; if (x === y) continue; if (x == null) return -1; if (y == null) return 1; return x < y ? -1 : 1; } return 0; };
    async function byIndex(root, key) {   // מחזיר את רשומת האינדקס הראשונה שמתחילה ב-key
      let n = root;
      for (;;) {
        const b = await page(n), base = n === 1 ? 100 : 0, type = b[base], cnt = (b[base + 3] << 8) | b[base + 4], hdr = type === 2 ? 12 : 8;
        const cell = i => (b[base + hdr + i * 2] << 8) | b[base + hdr + i * 2 + 1];
        if (type === 2) {
          let next = u32(b, base + 8);
          for (let i = 0; i < cnt; i++) {
            const c = cell(i), p = { i: c + 4 }, P = vint(b, p), r = record(await payload(b, p.i, P, false)), k = r.slice(0, key.length), d = cmp(key, k);
            if (d === 0) return r;
            if (d < 0) { next = u32(b, c); break; }
          }
          n = next; continue;
        }
        for (let i = 0; i < cnt; i++) { const p = { i: cell(i) }, P = vint(b, p), r = record(await payload(b, p.i, P, false)); if (cmp(key, r.slice(0, key.length)) === 0) return r; }
        return null;
      }
    }
    const master = [];
    await scan(1, r => { master.push({ type: r[0], name: r[1], tbl: r[2], root: r[3], sql: r[4] || '' }); });
    const cols = sql => { const m = sql.match(/\(([\s\S]*)\)/); if (!m) return []; let d = 0, cur = '', out = []; for (const ch of m[1]) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map(s => s.trim()).filter(s => !/^(primary|unique|constraint|foreign|check)\b/i.test(s)).map(s => { const nm = s.match(/^["`[]?([^"`\]\s]+)/)[1]; return { n: nm.toLowerCase(), pk: /integer\s+primary\s+key/i.test(s) }; }); };
    const T = nm => master.find(m => m.type === 'table' && m.name.toLowerCase() === nm);
    const idxFor = (tbl, want) => master.find(m => m.type === 'index' && m.tbl.toLowerCase() === tbl && m.root && (() => { const c = (m.sql.match(/\(([^)]*)\)/) || [, ''])[1].split(',').map(s => s.trim().replace(/["`\[\]]/g, '').toLowerCase().split(/\s/)[0]); return want.every((w, i) => c[i] === w); })());
    // autoindex של UNIQUE/PRIMARY KEY: אין לו sql, ומניחים שהוא לפי סדר העמודות שב-UNIQUE
    const autoIdx = (tbl, want) => { const t = T(tbl); if (!t) return null; const u = t.sql.match(/(?:unique|primary\s+key)\s*\(([^)]*)\)/i); if (!u) return null; const c = u[1].split(',').map(s => s.trim().replace(/["`\[\]]/g, '').toLowerCase()); if (!want.every((w, i) => c[i] === w)) return null; return master.find(m => m.type === 'index' && m.tbl.toLowerCase() === tbl && /^sqlite_autoindex/.test(m.name)); };
    const meta = {};
    const mt = T('metadata');
    if (mt) await scan(mt.root, r => { if (typeof r[0] === 'string') meta[r[0]] = r[1]; });
    let lookup = null, fmt = 'SQLite', zf = z => z, yf = (z, y) => (2 ** z) - 1 - y;
    const mk = async (tbl, zc, xc, yc, dc) => {
      const t = T(tbl), C = cols(t.sql), ci = n => C.findIndex(c => c.n === n), pkc = C.findIndex(c => c.pk);
      const ix = idxFor(tbl, [zc, xc, yc]) || autoIdx(tbl, [zc, xc, yc]) || idxFor(tbl, [xc, yc, zc]) || autoIdx(tbl, [xc, yc, zc]);
      if (!ix) return null;
      const order = idxFor(tbl, [zc, xc, yc]) || autoIdx(tbl, [zc, xc, yc]) ? 'zxy' : 'xyz';
      return async (z, x, y) => {
        const key = order === 'zxy' ? [z, x, y] : [x, y, z], r = await byIndex(ix.root, key); if (!r) return null;
        const row = await byRowid(t.root, r[r.length - 1]); if (!row) return null;
        return row[ci(dc)];
      };
    };
    if (T('tiles')) { fmt = 'MBTiles'; lookup = await mk('tiles', 'zoom_level', 'tile_column', 'tile_row', 'tile_data'); }
    if (!lookup && T('map') && T('images')) {   // MBTiles עם map + images
      fmt = 'MBTiles';
      const m = await mk('map', 'zoom_level', 'tile_column', 'tile_row', 'tile_id'), it = T('images'), IC = cols(it.sql), ix = idxFor('images', ['tile_id']) || autoIdx('images', ['tile_id']);
      if (m && ix) lookup = async (z, x, y) => { const id = await m(z, x, y); if (id == null) return null; const r = await byIndex(ix.root, [id]); if (!r) return null; const row = await byRowid(it.root, r[r.length - 1]); return row && row[IC.findIndex(c => c.n === 'tile_data')]; };
    }
    if (!lookup) {   // sqlitedb (OsmAnd / RMaps / Locus) ושאר טבלאות אריחים, כולל mapsdata
      for (const t of master.filter(m => m.type === 'table')) {
        const C = cols(t.sql).map(c => c.n), has = re => C.find(c => re.test(c));
        const z = has(/^(z|zoom|zoom_level|level|lod)$/), x = has(/^(x|col|column|tile_column|tilex)$/), y = has(/^(y|row|tile_row|tiley)$/), d = has(/^(image|tile|data|tile_data|blob|img|bytes)$/);
        if (!(z && x && y && d)) continue;
        const f = await mk(t.name.toLowerCase(), z, x, y, d); if (!f) continue;
        lookup = f; fmt = /\.sqlitedb$/i.test(name) ? 'sqlitedb' : /\.mapsdata$/i.test(name) ? 'mapsdata' : 'SQLite';
        const info = T('info'); let simple = false;
        if (info) await scan(info.root, r => { const C2 = cols(info.sql).map(c => c.n), ti = C2.indexOf('tilenumbering'); if (ti >= 0 && r[ti] === 'simple') simple = true; return false; });
        if (fmt === 'sqlitedb' && !simple) { zf = z2 => 17 - z2; }
        yf = (zz, yy) => yy;   // מספור XYZ (לא TMS)
        break;
      }
    }
    if (!lookup) throw new Error('בקובץ SQLite לא נמצאה טבלת אריחים מוכרת עם אינדקס (' + master.filter(m => m.type === 'table').map(m => m.name).slice(0, 6).join(', ') + ')');
    const b = String(meta.bounds || '-180,-85,180,85').split(',').map(Number), c = String(meta.center || '').split(',').map(Number);
    return { name: meta.name || name, format: fmt, minzoom: +meta.minzoom || 0, maxzoom: +meta.maxzoom || 19, bounds: b,
      center: c.length >= 2 && !isNaN(c[1]) ? [c[1], c[0], c[2] || 12] : [(b[1] + b[3]) / 2, (b[0] + b[2]) / 2, 10],
      tileType: meta.format || '', getTile: async (z, x, y) => { const v = await lookup(zf(z), x, yf(z, y)); return v && v.length ? tileURL(v) : null; } };
  }

  /* ── ZIP של אריחים z/x/y ── */
  async function zipTiles(rd, name) {
    const zi = await zipIndex(rd), map = new Map(); let minz = 99, maxz = 0;
    for (const n of zi.names) { const m = n.match(/(?:^|\/)(\d+)\/(\d+)\/(\d+)\.(png|jpe?g|webp|pbf|mvt)$/i); if (m) { map.set(m[1] + '/' + m[2] + '/' + m[3], n); minz = Math.min(minz, +m[1]); maxz = Math.max(maxz, +m[1]); } }
    if (!map.size) { const k = zi.names.find(n => /\.(kml|geojson|json|gpx)$/i.test(n)); if (k) return { vector: vectorFromText(td.decode(await zi.get(k)), k.split('.').pop().toLowerCase()) }; throw new Error('ב-ZIP אין אריחים (z/x/y) או קובץ KML/GeoJSON'); }
    return { name, format: 'ZIP', minzoom: minz, maxzoom: maxz, bounds: [-180, -85, 180, 85], center: null, tileType: '',
      getTile: async (z, x, y) => { const n = map.get(z + '/' + x + '/' + y); return n ? tileURL(await zi.get(n)) : null; } };
  }

  /* ── אריח → תמונה (כולל ציור אריח וקטורי MVT) ── */
  async function tileURL(b) {
    if (isGz(b)) b = await inflate(b, 'gzip');
    const t = b[0] === 0x89 && b[1] === 0x50 ? 'image/png' : b[0] === 0xff && b[1] === 0xd8 ? 'image/jpeg' : b[0] === 0x52 && b[8] === 0x57 ? 'image/webp' : b[0] === 0x47 && b[1] === 0x49 ? 'image/gif' : null;
    if (t) return URL.createObjectURL(new Blob([b], { type: t }));
    try { return await mvtToURL(b); } catch (e) { return null; }
  }
  function pbf(b) {
    let i = 0; const out = [];
    const v = () => { let r = 0, s = 1, x; do { x = b[i++]; r += (x & 0x7f) * s; s *= 128; } while (x >= 0x80); return r; };
    while (i < b.length) {
      const k = v(), f = Math.floor(k / 8), t = k & 7;
      if (t === 0) out.push([f, v()]); else if (t === 2) { const n = v(); out.push([f, b.subarray(i, i + n)]); i += n; } else if (t === 5) { out.push([f, new DataView(b.buffer, b.byteOffset + i, 4).getFloat32(0, true)]); i += 4; } else if (t === 1) { out.push([f, new DataView(b.buffer, b.byteOffset + i, 8).getFloat64(0, true)]); i += 8; } else break;
    }
    return out;
  }
  const packed = b => { const o = []; let i = 0; while (i < b.length) { let r = 0, s = 1, x; do { x = b[i++]; r += (x & 0x7f) * s; s *= 128; } while (x >= 0x80); o.push(r); } return o; };
  const STYLE = [   // [מבחן שם השכבה/מחלקה, מילוי, קו, עובי]
    [/water|ocean|lake|river|sea/, '#a9cdea', '#7fb0d8', 1], [/park|forest|wood|grass|landcover|green/, '#d6ead0', null, 0],
    [/landuse/, '#ece8de', null, 0], [/building/, '#dcd5cc', '#c8beb2', .5], [/transportation|road|street|highway/, null, '#ffffff', 2.2],
    [/rail/, null, '#999999', 1], [/boundary|admin/, null, '#9b8bb0', 1]];
  async function mvtToURL(b) {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    g.fillStyle = '#f2efe9'; g.fillRect(0, 0, S, S);
    const layers = pbf(b).filter(f => f[0] === 3).map(f => pbf(f[1]));
    const labels = [];
    const order = L => { const n = String((L.find(f => f[0] === 1) || [])[1] ? td.decode(L.find(f => f[0] === 1)[1]) : ''); const i = STYLE.findIndex(s => s[0].test(n)); return i < 0 ? 9 : [2, 1, 0, 3, 6, 5, 4][i] ?? i; };
    layers.sort((a, z) => order(a) - order(z));
    for (const L of layers) {
      const name = td.decode((L.find(f => f[0] === 1) || [, new Uint8Array()])[1]), ext = (L.find(f => f[0] === 5) || [, 4096])[1], k = S / ext;
      const keys = L.filter(f => f[0] === 3).map(f => td.decode(f[1])), vals = L.filter(f => f[0] === 4).map(f => { const p = pbf(f[1])[0]; return p ? (p[1] instanceof Uint8Array ? td.decode(p[1]) : p[1]) : ''; });
      const st = STYLE.find(s => s[0].test(name)) || [null, null, '#c9c0b0', .6];
      for (const F of L.filter(f => f[0] === 2).map(f => pbf(f[1]))) {
        const type = (F.find(f => f[0] === 3) || [, 0])[1], geo = packed((F.find(f => f[0] === 4) || [, new Uint8Array()])[1]);
        const tags = packed((F.find(f => f[0] === 2) || [, new Uint8Array()])[1]), props = {}; for (let i = 0; i + 1 < tags.length; i += 2) props[keys[tags[i]]] = vals[tags[i + 1]];
        g.beginPath(); let x = 0, y = 0;
        for (let i = 0; i < geo.length;) {
          const cmd = geo[i] & 7, cnt = geo[i++] >> 3;
          if (cmd === 7) { g.closePath(); continue; }
          for (let j = 0; j < cnt; j++) { const dx = geo[i++], dy = geo[i++]; x += (dx >> 1) ^ -(dx & 1); y += (dy >> 1) ^ -(dy & 1); if (cmd === 1) g.moveTo(x * k, y * k); else g.lineTo(x * k, y * k); if (type === 1 && (props.name || props['name:he'])) labels.push([x * k, y * k, props['name:he'] || props.name]); }
        }
        if (type === 3 && st[1]) { g.fillStyle = st[1]; g.fill(); }
        if (type === 2 || (type === 3 && st[2])) { if (st[2]) { g.strokeStyle = st[2]; g.lineWidth = type === 2 && /road|transport|street/.test(name) ? (/(motorway|trunk|primary)/.test(props.class || props.highway || '') ? 3.2 : 1.8) : st[3]; g.stroke(); } }
        if (type === 2 && /road|transport|street/.test(name) && (props.name || props['name:he']) && Math.random() < .15) { labels.push([x * k, y * k, props['name:he'] || props.name]); }
      }
    }
    g.font = '10px sans-serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = '#ffffff'; g.fillStyle = '#333333';
    for (const [x, y, t] of labels.slice(0, 24)) { if (x < 8 || y < 8 || x > S - 8 || y > S - 8) continue; g.strokeText(t, x, y); g.fillText(t, x, y); }
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    return URL.createObjectURL(blob);
  }

  /* ── פתיחה ── */
  async function openUrl(url, name, size) {
    const ext = String(name || '').split('.').pop().toLowerCase();
    const rd = await reader(url, size);
    const head = await rd.read(0, Math.min(rd.size || 16, 16)), magic = td.decode(head.subarray(0, 16));
    if (magic.startsWith('SQLite format 3')) return { kind: 'tiles', name, source: await sqlite(rd, name) };
    if (magic.startsWith('PMTiles')) return { kind: 'tiles', name, source: await pmtiles(rd, name) };
    if (head[0] === 0x50 && head[1] === 0x4b) {
      if (ext === 'kmz') { const zi = await zipIndex(rd), k = zi.names.find(n => /\.kml$/i.test(n)); if (!k) throw new Error('ב-KMZ אין קובץ KML'); return { kind: 'vector', name, geojson: parseKML(td.decode(await zi.get(k))) }; }
      const z = await zipTiles(rd, name); return z.vector ? { kind: 'vector', name, geojson: z.vector } : { kind: 'tiles', name, source: z };
    }
    if (rd.size > 80 * 1024 * 1024) throw new Error(windowsHint(name) || 'סוג הקובץ לא זוהה (אולי מוצפן)');
    let all = await rd.read(0, rd.size); if (isGz(all)) all = await inflate(all, 'gzip');
    const text = td.decode(all);
    if (/[\x00-\x08]/.test(text.slice(0, 2000))) throw new Error(windowsHint(name) || 'סוג הקובץ לא זוהה. הקובץ בינארי ולא מוכר — ייתכן שהוא מוצפן');
    return { kind: 'vector', name, geojson: vectorFromText(text, ext) };
  }
  function windowsHint(name) {
    if (/\.(mapsdata)$/i.test(name)) return 'קובץ mapsdata הזה אינו SQLite או ZIP פתוחים — כנראה הוא מוצפן או בפורמט סגור, ואי אפשר להציג אותו. אם יש לתוכנה ייצוא ל-MBTiles — אפשר לטעון את הייצוא.';
    if (/\.(tile|mpk|bin|dat)$/i.test(name)) return 'זה נראה כמו קובץ ממפות Windows (C:\\ProgramData\\Maps). המפות של Windows מוצפנות בפורמט סגור של מיקרוסופט, ואי אפשר להציג אותן מחוץ לאפליקציית המפות של Windows.';
    return '';
  }
  async function pick(call) {
    const r = await call('fs.pickUserFile', { title: 'בחירת קובץ מפות', extensions: EXTS });
    const d = r && (r.data || r); if (!d || d.cancelled || !d.url) return null;
    const res = await openUrl(d.url, d.name || '', d.size);
    res.token = d.token; return res;
  }
  /** טעינה חוזרת של קובץ שנבחר בעבר (אסימון שנשמר ב-storage) */
  async function reopen(call, token, name) {
    const r = await call('fs.resolveFileUrl', { token }); const d = r && (r.data || r); if (!d || !d.url) return null;
    const res = await openUrl(d.url, name || d.name || ''); res.token = token; return res;
  }

  /* ── עזרי הצגה: אריחים במפה (Web Mercator) ── */
  const tile2lon = (x, z) => x / 2 ** z * 360 - 180;
  const tile2lat = (y, z) => { const n = Math.PI - 2 * Math.PI * y / 2 ** z; return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); };
  const lon2tile = (lon, z) => Math.floor((lon + 180) / 360 * 2 ** z);
  const lat2tile = (lat, z) => Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * 2 ** z);
  /** SVG של האריחים הנראים. project(lat,lon)→[x,y]; corners = 4 פינות המסך כ-[lat,lon]; mpp = מטרים לפיקסל במסך.
      cache: Map של blobURL; onLoad נקרא כשאריח חדש מוכן (לציור מחדש). */
  function tilesSVG(src, project, corners, mpp, lat, cache, onLoad) {
    if (!src) return '';
    let z = Math.round(Math.log2(156543.03 * Math.cos(lat * Math.PI / 180) / Math.max(mpp, 1e-6)));
    const zs = Math.max(src.minzoom, Math.min(src.maxzoom, z));
    const las = corners.map(c => c[0]), los = corners.map(c => c[1]);
    const x0 = lon2tile(Math.min(...los), zs), x1 = lon2tile(Math.max(...los), zs), y0 = lat2tile(Math.min(85, Math.max(...las)), zs), y1 = lat2tile(Math.max(-85, Math.min(...las)), zs);
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > 120) return '';
    let s = '';
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      const k = zs + '/' + x + '/' + y, u = cache.get(k);
      if (u === undefined) { cache.set(k, null); src.getTile(zs, x, y).then(url => { cache.set(k, url || ''); if (url) onLoad(); }, () => cache.set(k, '')); continue; }
      if (!u) continue;
      const a = project(tile2lat(y, zs), tile2lon(x, zs)), b = project(tile2lat(y, zs), tile2lon(x + 1, zs)), c = project(tile2lat(y + 1, zs), tile2lon(x, zs));
      const m = [(b[0] - a[0]) / 256, (b[1] - a[1]) / 256, (c[0] - a[0]) / 256, (c[1] - a[1]) / 256, a[0], a[1]].map(n => n.toFixed(4)).join(' ');
      s += `<image href="${u}" width="257" height="257" transform="matrix(${m})" preserveAspectRatio="none"/>`;
    }
    return `<g class="mf-tiles">${s}</g>`;
  }

  /** מיקום מפות Windows (לזיהוי בלבד — הקבצים מוצפנים) */
  const WINDOWS_MAPS = ['C:\\ProgramData\\Maps', '%LOCALAPPDATA%\\Packages\\Microsoft.WindowsMaps_8wekyb3d8bbwe\\LocalState'];

  return { VERSION: '1.0.0', EXTS, pick, reopen, openUrl, tilesSVG, vectorFromText, parseKML, parseGPX, parseCSV, topoToGeo, zxyToId, WINDOWS_MAPS, windowsHint };
});
