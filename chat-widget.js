// Atelier Ourlet — chatbot Gemini, sans réponses programmées.
const CW_CONFIG = {
  brand: 'Atelier Ourlet',
  apiEndpoint: 'https://atelier-ourlet-chat.exacodeofficial.workers.dev/chat' // Endpoint public, sans clé secrète
};

(function () {
  const ICONS = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z"/></svg>',
    expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>',
    shrink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 4l-6 6M14 4v6h6M4 20l6-6M10 20v-6H4"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  // ---------- Construction de l'interface ----------
  const launcher = document.createElement('button');
  launcher.className = 'cw-launcher';
  launcher.type = 'button';
  launcher.setAttribute('aria-label', 'Ouvrir le chat');
  launcher.innerHTML = ICONS.chat + '<span>Chat</span>';

  const panel = document.createElement('div');
  panel.className = 'cw-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Assistant ' + CW_CONFIG.brand);
  panel.innerHTML = `
    <div class="cw-head">
      <span class="cw-brand">${CW_CONFIG.brand}</span>
      <div class="cw-tools">
        <button type="button" class="cw-expand" aria-label="Agrandir">${ICONS.expand}</button>
        <button type="button" class="cw-close" aria-label="Réduire le chat">${ICONS.minus}</button>
      </div>
    </div>
    <div class="cw-body" aria-live="polite">
      <div class="cw-welcome">
        <div>
          <p>Bonjour ! Envoyez-nous un petit message si on peut vous aider.</p>
          <p>Brodé à la main, livré chez vous. On est là pour vous !</p>
        </div>
        <div class="cw-polaroids" aria-hidden="true">
          <div class="cw-pol p1"><div class="g" data-type="sweat" data-color="#c7c9c4" data-motif="Léa"></div>Votre prénom sur un sweat</div>
          <div class="cw-pol p2"><div class="g" data-type="sweat" data-color="#2f5045" data-motif="♥" data-thread="#e9a27f"></div>Sweat avec motif</div>
        </div>
      </div>
    </div>
    <div class="cw-legal">Assistant de démonstration : il peut faire des erreurs. Atelier Ourlet est une marque fictive.</div>
    <form class="cw-form" autocomplete="off">
      <input type="text" placeholder="Posez une question…" aria-label="Votre message" maxlength="500">
      <button type="submit" aria-label="Envoyer" disabled>${ICONS.send}</button>
    </form>`;

  document.body.append(launcher, panel);
  if (window.renderGarments) window.renderGarments(panel);

  const body = panel.querySelector('.cw-body');
  const form = panel.querySelector('.cw-form');
  const input = form.querySelector('input');
  const sendBtn = form.querySelector('button');
  const expandBtn = panel.querySelector('.cw-expand');

  function open() {
    panel.hidden = false;
    launcher.classList.add('cw-hidden');
    setTimeout(() => input.focus(), 150);
  }
  function close() {
    panel.hidden = true;
    launcher.classList.remove('cw-hidden');
    launcher.focus();
  }
  launcher.addEventListener('click', open);
  panel.querySelector('.cw-close').addEventListener('click', close);
  expandBtn.addEventListener('click', () => {
    const big = panel.classList.toggle('cw-big');
    expandBtn.innerHTML = big ? ICONS.shrink : ICONS.expand;
    expandBtn.setAttribute('aria-label', big ? 'Rétrécir' : 'Agrandir');
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) close(); });
  document.querySelectorAll('[data-open-chat]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); open(); }));

  input.addEventListener('input', () => { sendBtn.disabled = !input.value.trim(); });
  form.addEventListener('submit', e => { e.preventDefault(); send(input.value); });

  // ---------- Affichage ----------
  function scroll() { body.scrollTop = body.scrollHeight; }
  // Affiche proprement le Markdown simple renvoyé par l'IA (**gras**, listes « * »).
  // Le texte est échappé AVANT la mise en forme : aucun HTML venant de l'IA n'est exécuté.
  function formatBot(text) {
    const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    return esc(text)
      .replace(/^\s*[*-]\s+/gm, '• ')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/\n{3,}/g, '\n\n');
  }
  function addMsg(text, who) {
    const d = document.createElement('div');
    d.className = 'cw-msg ' + (who === 'user' ? 'cw-user' : 'cw-bot');
    if (who === 'user') d.textContent = text;
    else d.innerHTML = formatBot(text);
    body.appendChild(d);
    if (who !== 'user') addProducts(text);
    scroll();
  }

  // ---------- Écriture progressive (effet « en train d'écrire ») ----------
  // La réponse arrive en entier, puis s'affiche mot par mot, comme si l'assistant tapait.
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function addBotTyped(text) {
    return new Promise(resolve => {
      const d = document.createElement('div');
      d.className = 'cw-msg cw-bot';
      body.appendChild(d);
      const finish = () => {
        d.innerHTML = formatBot(text);
        addProducts(text);
        scroll();
        resolve();
      };
      if (reduceMotion) return finish();
      const tokens = text.match(/\S+\s*/g) || [text];
      let i = 0, shown = '';
      (function step() {
        const n = Math.random() < 0.35 ? 2 : 1; // parfois deux mots d'un coup
        for (let k = 0; k < n && i < tokens.length; k++) shown += tokens[i++];
        const nearBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 60;
        // Pendant l'écriture, on masque les * pas encore refermés.
        d.innerHTML = formatBot(shown).replace(/\*/g, '');
        if (nearBottom) scroll();
        if (i < tokens.length) {
          const last = tokens[i - 1] || '';
          const pause = /[.!?:]\s*$/.test(last) ? 180 : /\n/.test(last) ? 140 : 0; // petite pause en fin de phrase
          setTimeout(step, 25 + Math.random() * 45 + pause);
        } else {
          finish();
        }
      })();
    });
  }

  // ---------- Visuels produits dans le chat ----------
  // Quand l'IA parle d'un article, on affiche sa carte (mêmes visuels que la boutique).
  const PRODUCTS = [
    { name: 'T-shirt brodé', price: 29, re: /\bt-?shirts?\b|\btee-?shirts?\b/, g: { type: 'tshirt', color: '#f0e4cf', motif: 'Noé' } },
    { name: 'Sweat brodé', price: 49, re: /\bsweats?(?:-shirts?)?\b(?!\s+a\s+capuche)|\bpulls?\b/, g: { type: 'sweat', color: '#c7c9c4', motif: 'Léa' } },
    { name: 'Hoodie brodé', price: 59, re: /\bhoodies?\b|\bcapuche\b/, g: { type: 'hoodie', color: '#2f5045', motif: '♥', thread: '#e9a27f' } },
    { name: 'Casquette brodée', price: 25, re: /\bcasquettes?\b/, g: { type: 'cap', color: '#b4532a', motif: '★', thread: '#f6f1e9' } },
    { name: 'Tote bag brodé', price: 19, re: /\btote(?:[ -]?bags?)?\b/, g: { type: 'tote', color: '#e6d6b8', motif: 'logo', thread: '#243d35' } },
    { name: 'Tablier brodé', price: 35, re: /\btabliers?\b/, g: { type: 'apron', color: '#7d9b82', motif: 'Chef', thread: '#f6f1e9' } }
  ];
  function addProducts(text) {
    const s = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const found = PRODUCTS
      .map(p => ({ p, at: s.search(p.re) }))
      .filter(x => x.at >= 0)
      .sort((a, b) => a.at - b.at)
      .map(x => x.p);
    if (!found.length) return;
    const row = document.createElement('div');
    row.className = 'cw-products';
    found.forEach(p => {
      const a = document.createElement('a');
      a.className = 'cw-prod';
      a.href = 'boutique.html';
      const g = document.createElement('div');
      g.className = 'g';
      g.dataset.type = p.g.type;
      g.dataset.color = p.g.color;
      g.dataset.motif = p.g.motif;
      if (p.g.thread) g.dataset.thread = p.g.thread;
      g.setAttribute('aria-label', p.name);
      const name = document.createElement('span');
      name.className = 'cw-prod-name';
      name.textContent = p.name;
      const price = document.createElement('span');
      price.className = 'cw-prod-price';
      price.textContent = p.price + ' €';
      a.append(g, name, price);
      row.appendChild(a);
    });
    body.appendChild(row);
    if (window.renderGarments) window.renderGarments(row);
  }
  function typing() {
    const d = document.createElement('div');
    d.className = 'cw-msg cw-bot';
    d.innerHTML = '<span class="cw-typing"><i></i><i></i><i></i></span>';
    body.appendChild(d); scroll();
    return d;
  }
  // ---------- Boutons de réponse (questions à choix) ----------
  // L'IA peut terminer son message par : [[choix: Option 1 | Option 2 | Option 3]]
  // La bulle retire cette ligne du texte et l'affiche en boutons cliquables.
  function parseChoices(text) {
    const re = /\[\[\s*choix\s*:\s*([^\]]+?)\s*\]\]/gi;
    let last = null, m;
    while ((m = re.exec(text))) last = m;
    const clean = text.replace(re, '').replace(/\s+$/, '');
    if (!last) return { clean, choices: [] };
    const choices = last[1].split('|').map(s => s.trim()).filter(s => s && s.length <= 40).slice(0, 4);
    return { clean, choices };
  }
  function showChoices(choices) {
    const row = document.createElement('div');
    row.className = 'cw-choices';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', 'Réponses suggérées');
    choices.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = c;
      b.addEventListener('click', () => send(c));
      row.appendChild(b);
    });
    body.appendChild(row);
    scroll();
  }

  // Boutons de départ, visibles dès l'ouverture (fonctionnent sans modifier le Worker)
  showChoices(['Voir les prix', 'Commande pour une équipe', 'Délais de livraison', 'Personnaliser un vêtement']);

  // ---------- Gemini uniquement ----------
  let busy = false;
  const history = [];
  async function send(raw) {
    const text = (raw || '').trim();
    if (!text || busy) return;
    input.value = '';
    sendBtn.disabled = true;
    body.querySelectorAll('.cw-choices').forEach(c => c.remove()); // les anciens choix disparaissent
    addMsg(text, 'user');
    busy = true;
    const indicator = typing();
    try {
      const messages = [...history, { role: 'user', text }].slice(-12);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 18000);
      let response;
      try {
        response = await fetch(CW_CONFIG.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeout);
      }
      const data = await response.json();
      if (!response.ok || !data.output || typeof data.output !== 'string') {
        throw new Error(data.error || 'Réponse indisponible');
      }
      history.push({ role: 'user', text }, { role: 'model', text: data.output });
      while (history.length > 12) history.shift();
      indicator.remove();
      const { clean, choices } = parseChoices(data.output);
      await addBotTyped(clean);
      if (choices.length) showChoices(choices);
    } catch (error) {
      addMsg('Le service IA est momentanément indisponible. Réessayez dans quelques instants.', 'bot');
    } finally {
      indicator.remove();
      busy = false;
      input.focus();
    }
  }
})();
