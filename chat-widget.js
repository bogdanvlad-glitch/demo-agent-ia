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
  function addMsg(text, who) {
    const d = document.createElement('div');
    d.className = 'cw-msg ' + (who === 'user' ? 'cw-user' : 'cw-bot');
    d.textContent = text;
    body.appendChild(d); scroll();
  }
  function typing() {
    const d = document.createElement('div');
    d.className = 'cw-msg cw-bot';
    d.innerHTML = '<span class="cw-typing"><i></i><i></i><i></i></span>';
    body.appendChild(d); scroll();
    return d;
  }
  // ---------- Gemini uniquement ----------
  let busy = false;
  const history = [];
  async function send(raw) {
    const text = (raw || '').trim();
    if (!text || busy) return;
    input.value = '';
    sendBtn.disabled = true;
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
      addMsg(data.output, 'bot');
    } catch (error) {
      addMsg('Le service IA est momentanément indisponible. Réessayez dans quelques instants.', 'bot');
    } finally {
      indicator.remove();
      busy = false;
      input.focus();
    }
  }
})();
