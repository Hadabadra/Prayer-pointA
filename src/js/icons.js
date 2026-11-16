/* אייקונים חד-גוניים בקו מתאר, בצבע הטקסט (בסגנון אוצריא) */
(function () {
  const P = {
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    resume: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    cup: '<path d="M5 4h14l-1.5 9a5.5 5.5 0 0 1-11 0z"/><path d="M12 18.5V21M8 21h8"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    right: '<path d="m9 6 6 6-6 6"/>', left: '<path d="m15 6-6 6 6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
    mark: '<path d="M6 3h12v18l-6-4-6 4z"/>', markon: '<path d="M6 3h12v18l-6-4-6 4z" fill="currentColor"/>',
    view: '<rect x="3" y="4" width="8" height="16" rx="1"/><rect x="13" y="4" width="8" height="16" rx="1"/>',
    more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    scroll: '<rect x="6" y="2" width="12" height="9" rx="1"/><rect x="6" y="13" width="12" height="9" rx="1"/>',
    page: '<rect x="6" y="3" width="12" height="18" rx="1"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    spread: '<path d="M12 5v15M12 5C9.5 3.5 6 3.5 3 4.5v15c3-1 6.5-1 9 .5 2.5-1.5 6-1.5 9-.5v-15c-3-1-6.5-1-9 .5z"/>',
    fitw: '<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>', fitp: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 8l3-3 3 3M9 16l3 3 3-3"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2"/>',
    forgot: '<path d="M12 3a9 9 0 1 0 9 9"/><path d="M21 3v6h-6"/><path d="M12 8v4l3 2"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    note: '<path d="M5 3h10l4 4v14H5z"/><path d="M9 12h6M9 16h6M15 3v4h4"/>',
    send: '<path d="M21 3 3 10l7 3 3 7z"/><path d="M10 13l11-10"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'
  };
  const fill = el => { if (el.firstChild) return; const p = P[el.dataset.i]; if (p) el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>"; };
  window.SRIcon = (name) => '<i class="oi" data-i="' + name + '">' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || "") + "</svg></i>";
  window.SRIcons = (root) => (root || document).querySelectorAll("i.oi").forEach(fill);
  document.addEventListener("DOMContentLoaded", () => window.SRIcons());
})();
