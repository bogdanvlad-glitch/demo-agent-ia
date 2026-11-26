// Effet « liquid glass » sur le bouton Chat (démo Atelier Ourlet) (bibliothèque MIT @ybouane/liquidglass, WebGL).
// Si WebGL n'est pas disponible ou si l'effet échoue, le bouton garde son style normal.
import { LiquidGlass } from 'https://cdn.jsdelivr.net/npm/@ybouane/liquidglass@1.0.3/dist/index.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

async function start() {
  const btn = document.querySelector('.cw-launcher');
  if (!btn || reduce) return;
  try { await document.fonts.ready; } catch (e) {}
  btn.dataset.config = JSON.stringify({
    cornerRadius: 999, zRadius: 22, refraction: 0.75, blurAmount: 0.12, chromAberration: 0.06,
    edgeHighlight: 0.35, specular: 0.4, fresnel: 1, brightness: 0.32, saturation: 0.1,
    shadowOpacity: 0.28, shadowSpread: 14, shadowOffsetY: 6, button: true
  });
  try {
    const glass = await LiquidGlass.init({ root: document.body, glassElements: [btn] });
    btn.classList.add('cw-glass');
    // Le contenu derrière le bouton change quand on fait défiler la page : on redessine.
    // Texte clair quand le bouton passe au-dessus d'un fond sombre : on lit la couleur de fond derrière lui.
    const lum = c => { const m = c.match(/[\d.]+/g); if (!m || (m[3] !== undefined && +m[3] < 0.5)) return null;
      const [r, g, b] = m.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const contrast = () => {
      const r = btn.getBoundingClientRect();
      const under = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).filter(el => !btn.contains(el) && !el.closest('.cw-panel'));
      let L = null;
      for (const el of under) { if (el.tagName === 'IMG') { L = 0.4; break; } for (let n = el; n && L === null; n = n.parentElement) { const st = getComputedStyle(n); L = lum(st.backgroundColor); if (L === null && /gradient/.test(st.backgroundImage)) { const cs = st.backgroundImage.match(/rgba?\([^)]+\)/g) || []; const ls = cs.map(lum).filter(x => x !== null); if (ls.length) L = ls.reduce((a, b) => a + b) / ls.length; } } if (L !== null) break; }
      btn.classList.toggle('cw-glass-dark', L !== null && L < 0.25);
    };
    let pending = false;
    addEventListener('scroll', () => {
      if (pending) return; pending = true;
      requestAnimationFrame(() => { pending = false; glass.markChanged(); contrast(); });
    }, { passive: true });
    addEventListener('resize', contrast); contrast();
    window.__chatGlass = glass;
  } catch (e) {
    console.warn('Effet verre indisponible, style normal conservé.', e);
  }
}
if (document.readyState === 'complete') start(); else addEventListener('load', start);
