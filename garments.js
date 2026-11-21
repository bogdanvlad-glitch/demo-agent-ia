// Illustrations SVG des vêtements (aucune image externe nécessaire).
// Usage : <div class="g" data-type="sweat" data-color="#c9b79c" data-motif="Léa"></div>
(function () {
  const shapes = {
    tshirt: '<path d="M62 30 L82 20 Q100 36 118 20 L138 30 L174 60 L154 86 L140 74 L140 180 L60 180 L60 74 L46 86 L26 60 Z"/>',
    sweat: '<path d="M64 28 L82 20 Q100 34 118 20 L136 28 Q162 40 170 72 L180 162 L156 166 L144 86 L144 176 L56 176 L56 86 L44 166 L20 162 L30 72 Q38 40 64 28 Z"/>' +
           '<rect x="56" y="170" width="88" height="10" rx="3" class="rib"/><rect x="20" y="158" width="24" height="9" rx="3" class="rib" transform="rotate(4 32 162)"/><rect x="156" y="158" width="24" height="9" rx="3" class="rib" transform="rotate(-4 168 162)"/>',
    hoodie: '<path d="M64 34 L80 26 Q78 6 100 4 Q122 6 120 26 L136 34 Q162 46 170 76 L180 162 L156 166 L144 90 L144 178 L56 178 L56 90 L44 166 L20 162 L30 76 Q38 46 64 34 Z"/>' +
            '<path d="M84 28 Q100 46 116 28" fill="none" stroke="rgba(0,0,0,.2)" stroke-width="3"/><rect x="74" y="128" width="52" height="30" rx="6" class="rib"/>',
    cap: '<path d="M38 124 Q38 58 100 54 Q162 58 162 124 Z"/><path d="M30 122 L170 122 Q192 128 172 138 L30 134 Q22 128 30 122 Z" class="rib"/><circle cx="100" cy="54" r="5" class="rib"/>',
    tote: '<path d="M74 70 Q74 24 100 24 Q126 24 126 70" fill="none" stroke-width="7" class="strap"/><rect x="48" y="66" width="104" height="116" rx="6"/>',
    apron: '<path d="M78 22 L122 22 L126 70 Q150 72 160 80 L148 182 L52 182 L40 80 Q50 72 74 70 Z"/><path d="M78 22 Q100 4 122 22" fill="none" stroke-width="5" class="strap"/><rect x="72" y="112" width="56" height="34" rx="5" class="rib"/>'
  };
  const motifY = { tshirt: 78, sweat: 78, hoodie: 82, cap: 98, tote: 118, apron: 92 };

  function render(root) {
  (root || document).querySelectorAll('.g[data-type]').forEach(el => {
    const type = el.dataset.type;
    const color = el.dataset.color || '#c9b79c';
    const motif = el.dataset.motif || '';
    const thread = el.dataset.thread || '#b4532a';
    const y = motifY[type] || 80;
    const motifSvg = motif === '♥'
      ? `<path d="M100 ${y + 12} C86 ${y} 88 ${y - 12} 100 ${y - 4} C112 ${y - 12} 114 ${y} 100 ${y + 12} Z" fill="${thread}"/>`
      : motif === '★'
        ? `<path d="M100 ${y - 13} L104 ${y - 3} L115 ${y - 3} L106 ${y + 4} L109 ${y + 14} L100 ${y + 8} L91 ${y + 14} L94 ${y + 4} L85 ${y - 3} L96 ${y - 3} Z" fill="${thread}"/>`
        : motif === 'logo'
          ? `<circle cx="100" cy="${y}" r="14" fill="none" stroke="${thread}" stroke-width="3.5"/><path d="M93 ${y} L100 ${y - 7} L107 ${y} L100 ${y + 7} Z" fill="${thread}"/>`
          : motif
            ? `<text x="100" y="${y + 6}" text-anchor="middle" font-family="Instrument Serif, Georgia, serif" font-style="italic" font-size="22" fill="${thread}">${motif}</text>`
            : '';
    el.innerHTML =
      `<svg viewBox="0 0 200 200" role="img" aria-label="${el.getAttribute('aria-label') || type}">` +
      `<g fill="${color}" stroke="rgba(0,0,0,.12)" stroke-width="1.5" stroke-linejoin="round">` +
      shapes[type].replace(/class="rib"/g, `fill="${color}" style="filter:brightness(.9)"`).replace(/class="strap"/g, `stroke="${color}"`) +
      `</g>${motifSvg}</svg>`;
  });
  }
  window.renderGarments = render;
  render(document);
})();
