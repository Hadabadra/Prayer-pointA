/* כיוון תפילה 3.7.0 — מצב טיסה והכדור:
   3. בטיסה כפתור ההדפסה הרגיל מדפיס את מפת הכדור + זמני הטיסה; כפתור ההדפסה והכדור הכפולים בלשונית הטיסה הוסרו.
   4. לחיצה על שורה בטבלאות הזמנים בטיסה מציגה על הכדור את המיקום המשוער באותה שעה.
   5. על הכדור: יום ולילה לפי השעה, מיקום השמש, וציור מטוס בכיוון הטיסה.
   6. הגדרה: כדור צבעוני (ים כחול, יבשה ירוקה) או חום-לבן (הקודם). */
(function () {
  const GK = "kivun-globe-color";
  let colorMode = "plain"; try { colorMode = localStorage.getItem(GK) || "plain" } catch (e) {}
  if (O) O.call("storage.get", { key: GK }).then(r => { const v = r && (r.value ?? (r.data && r.data.value)); if (v === "color" || v === "plain") { colorMode = v; sel.value = v; if (pos && $("mapMode").value === "globe") map() } }).catch(() => {});
  /* 6. ההגדרה */
  const sel = document.createElement("select"); sel.id = "globeColor"; sel.setAttribute("aria-label", "צבעי הכדור");
  sel.innerHTML = '<option value="plain">חום-לבן (רגיל)</option><option value="color">צבעוני: ים כחול ויבשה ירוקה</option>'; sel.value = colorMode;
  const row = document.createElement("div"); row.className = "setrow"; const lb = document.createElement("label"); lb.append("צבעי הכדור: ", sel); row.appendChild(lb);
  const setp = $("set"); if (setp) { const ref = setp.querySelector(".setrow"); ref ? ref.parentNode.insertBefore(row, ref) : setp.appendChild(row) }
  sel.onchange = () => { colorMode = sel.value; try { localStorage.setItem(GK, colorMode) } catch (e) {} if (O) O.call("storage.set", { key: GK, value: colorMode }).catch(() => {}); if (pos && $("mapMode").value === "globe") map() };

  /* מיקום השמש (הנקודה שהשמש בזניט מעליה) לרגע t — דיוק של עשירית מעלה בערך, מספיק לציור */
  function subSolar(t) {
    const d = t / 864e5 + 2440587.5 - 2451545, g = (357.529 + .98560028 * d) * R, q = 280.459 + .98564736 * d,
      L = (q + 1.915 * Math.sin(g) + .02 * Math.sin(2 * g)) * R, e = (23.439 - 3.6e-7 * d) * R,
      dec = Math.asin(Math.sin(e) * Math.sin(L)) / R, ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / R,
      gmst = (280.46061837 + 360.98564736629 * d) % 360;
    let lon = ra - gmst; lon = ((lon + 540) % 360) - 180; return [dec, lon];
  }
  const sunAlt = (s, q) => Math.sin(s[0] * R) * Math.sin(q[0] * R) + Math.cos(s[0] * R) * Math.cos(q[0] * R) * Math.cos((q[1] - s[1]) * R);
  const flyOn = () => typeof FLY !== "undefined" && FLY.on && FLY.A0;
  let pickT = null, lastPr = null, planeXY = null;

  if (typeof globeMap === "function") {
    const orig = globeMap;
    globeMap = function () {
      orig();
      const svg = $("map"), vb = svg.viewBox.baseVal, W = vb && vb.width || 400, Hh = vb && vb.height || 320, cx = (vb ? vb.x : 0) + W / 2, cy = (vb ? vb.y : 0) + Hh / 2;
      const m = gc(pos, J, .5), c0 = Math.max(-89, Math.min(89, m[0] + GL.dla)) * R, l0 = (m[1] + GL.dlo) * R, r = Math.min(W, Hh) * .45 * (typeof zoom === "number" ? zoom : 1);
      const pr = q => { const f = q[0] * R, l = q[1] * R - l0; return [cx + r * Math.cos(f) * Math.sin(l), cy - r * (Math.cos(c0) * Math.sin(f) - Math.sin(c0) * Math.cos(f) * Math.cos(l)), Math.sin(c0) * Math.sin(f) + Math.cos(c0) * Math.cos(f) * Math.cos(l) > 0] };
      const t = flyOn() && pickT != null ? pickT : Date.now(), S = subSolar(t);
      /* 6. צבעים */
      const kids = svg.children;
      if (colorMode === "color" && kids.length > 2) {
        kids[0].setAttribute("fill", "#3d7fc4"); kids[0].setAttribute("stroke", "#24578a");
        kids[1].setAttribute("stroke", "#9cc3ea"); kids[2].setAttribute("stroke", "#e9f3d4"); kids[2].setAttribute("stroke-width", "1.1");
      }
      /* 5. לילה: נקודות שקופות כהות בכל מקום שהשמש מתחת לאופק */
      let night = "", step = 4, dot = Math.max(1.6, r * step * R * .82);
      for (let la = -88; la <= 88; la += step) for (let lo = -180; lo < 180; lo += step) {
        const q = [la, lo]; if (sunAlt(S, q) >= 0) continue; const [x, y, v] = pr(q); if (v) night += `M${(x - dot).toFixed(1)},${y.toFixed(1)}a${dot.toFixed(1)},${dot.toFixed(1)} 0 1,0 ${(2 * dot).toFixed(1)},0a${dot.toFixed(1)},${dot.toFixed(1)} 0 1,0 ${(-2 * dot).toFixed(1)},0`;
      }
      let h = `<clipPath id="glClip"><circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}"/></clipPath><path d="${night}" fill="#0b1a33" fill-opacity=".38" clip-path="url(#glClip)" pointer-events="none"/>`;
      const sp = pr(S); if (sp[2]) h += `<g pointer-events="none"><circle cx="${sp[0].toFixed(1)}" cy="${sp[1].toFixed(1)}" r="7" fill="#ffc83d" stroke="#e08a00" stroke-width="1.5"/><text x="${sp[0].toFixed(1)}" y="${(sp[1] + 19).toFixed(1)}" text-anchor="middle" font-size="10" fill="var(--color-on-surface)">השמש</text></g>`;
      /* 5. המטוס בכיוון הטיסה (4: בשעה שנבחרה בטבלה) */
      if (flyOn()) {
        [...svg.querySelectorAll("text")].forEach(x => { if (x.textContent === "✈") x.remove() });
        const tt = Math.max(FLY.t0, Math.min(FLY.t1, t)), p = flyPos(tt), a = pr(p), b = pr(flyPos(Math.min(tt + 6e5, FLY.t1 + 6e5)) );
        lastPr = pr; planeXY = a[2] ? a : null;
        if (a[2]) {
          let ang = Math.atan2(b[1] - a[1], b[0] - a[0]) / R + 90; if (!isFinite(ang) || (b[0] === a[0] && b[1] === a[1])) ang = flyHead(tt);
          h += `<g transform="translate(${a[0].toFixed(1)},${a[1].toFixed(1)}) rotate(${ang.toFixed(1)})" pointer-events="none"><path d="M0,-11 L2,-4 L10,1 L10,3 L2,1 L1.5,7 L4,9 L4,10.5 L0,9.5 L-4,10.5 L-4,9 L-1.5,7 L-2,1 L-10,3 L-10,1 L-2,-4 Z" fill="var(--color-on-surface)" stroke="var(--color-surface)" stroke-width="1"/></g>`;
          if (pickT != null) h += `<text x="${a[0].toFixed(1)}" y="${(a[1] - 15).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--color-on-surface)" stroke="var(--color-surface)" stroke-width="3" paint-order="stroke">${flyTm(tt)}</text>`;
        }
      }
      svg.insertAdjacentHTML("beforeend", h);
    };
  }

  /* 4.0.0 (#30): גרירת המטוס על הכדור — המטוס זז לאורך המסלול והשעה מתעדכנת */
  (function () {
    let drag = false;
    const svgPt = e => { const svg = $("map"), m = svg.getScreenCTM(); if (!m) return null; const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(m.inverse()); return [q.x, q.y] };
    const onGlobe = e => flyOn() && $("mapMode") && $("mapMode").value === "globe" && e.target.closest && e.target.closest("#map");
    function nearestT(q) {
      if (!lastPr) return null; let best = null;
      for (let i = 0; i <= 300; i++) { const t = FLY.t0 + (FLY.t1 - FLY.t0) * i / 300, a = lastPr(flyPos(t)); if (!a[2]) continue; const d = Math.hypot(a[0] - q[0], a[1] - q[1]); if (!best || d < best[1]) best = [t, d] }
      return best && best[0];
    }
    document.addEventListener("pointerdown", e => {
      if (!onGlobe(e) || !planeXY) return; const q = svgPt(e); if (!q || Math.hypot(q[0] - planeXY[0], q[1] - planeXY[1]) > 16) return;
      drag = true; e.preventDefault(); e.stopImmediatePropagation(); try { $("map").setPointerCapture(e.pointerId) } catch (x) {}
    }, true);
    document.addEventListener("pointermove", e => {
      if (!drag) return; e.preventDefault(); e.stopImmediatePropagation(); const q = svgPt(e), t = q && nearestT(q); if (t == null) return;
      pickT = t; const out = $("flyOut"); if (out) out.querySelectorAll("tr.pick").forEach(x => x.classList.remove("pick"));
      const st = $("flyDragT"); if (st) st.textContent = "המטוס בשעה " + flyTm(t);
      map();
    }, true);
    const end = e => { if (!drag) return; drag = false; e.preventDefault(); e.stopImmediatePropagation() };
    document.addEventListener("pointerup", end, true); document.addEventListener("pointercancel", end, true);
  })();

  /* 4. לחיצה על שעה בטבלאות הטיסה */
  const out = $("flyOut");
  if (out) {
    out.addEventListener("click", e => {
      const tr = e.target.closest("tr"); if (!tr || !FLY.last) return;
      const tabs = [...out.querySelectorAll("table.halt")], ti = tabs.indexOf(tr.closest("table")), ri = [...tr.parentNode.children].indexOf(tr);
      const arr = ti === 0 && FLY.last.here.length ? FLY.last.here : FLY.last.route, ev = arr[ri]; if (!ev) return;
      pickT = ev[0]; const p = ev[2] || flyPos(pickT), m = gc(pos, J, .5); GL.dla = p[0] - m[0]; GL.dlo = p[1] - m[1];
      out.querySelectorAll("tr.pick").forEach(x => x.classList.remove("pick")); tr.classList.add("pick");
      $("mapMode").value = "globe"; map(); try { $("map").scrollIntoView({ block: "nearest", behavior: "smooth" }) } catch (x) {}
    });
    new MutationObserver(() => out.querySelectorAll("table.halt tr").forEach(x => { x.style.cursor = "pointer"; x.title = "הצג את המיקום המשוער באותה שעה על הכדור" })).observe(out, { childList: true });
  }
  const fs = $("flyStop"); if (fs) fs.addEventListener("click", () => { pickT = null });

  /* 3. הדפסה רגילה בטיסה: הכדור + זמני הטיסה */
  if (typeof printSheet === "function") {
    const ps = printSheet;
    printSheet = function (again) {
      if (!flyOn()) return ps(again);
      if ($("mapMode").value !== "globe") { $("mapMode").value = "globe"; map() }
      if (!flyPrintHead()) return ps(again);
      if (typeof showPrintPreview === "function") { window.__pdf = false; showPrintPreview(); return }
      printNow().catch(() => {});
    };
    const bp = $("bPrint"); if (bp) bp.onclick = () => printSheet();
  }
  const st = document.createElement("style");
  st.textContent = "#flyPrint,#flyGlobe{display:none !important}#flyOut table.halt tr:hover td{background:var(--color-surface-container-high)}#flyOut tr.pick td{background:var(--color-primary-container,var(--color-surface-container-highest));font-weight:700}";
  document.head.appendChild(st);
})();
