// Bulle de chat IA — démo.
// Mode par défaut : réponses scriptées (aucune clé API dans la page).
// Pour brancher une vraie IA : crée un workflow n8n (Chat Trigger + AI Agent),
// rends le chat public, puis colle l'URL du webhook ci-dessous.
const CW_CONFIG = {
  brand: 'Atelier Ourlet',
  n8nWebhookUrl: '', // Ancienne intégration n8n (optionnelle)
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

  const PRODUCTS = {
    't-shirt': 29, 'sweat': 49, 'hoodie': 59, 'casquette': 25, 'tote bag': 19, 'tablier': 35
  };
  const PRODUCT_WORDS = [
    ['hoodie', ['hoodie', 'capuche']],
    ['sweat', ['sweat', 'pull']],
    ['t-shirt', ['t-shirt', 'tshirt', 'tee', 'tee-shirt']],
    ['casquette', ['casquette', 'cap']],
    ['tote bag', ['tote', 'sac']],
    ['tablier', ['tablier']]
  ];

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
    <div class="cw-legal">Assistant de démonstration : il peut faire des erreurs. ${CW_CONFIG.brand} est une marque fictive. Si une API IA est activée, les messages sont transmis au prestataire d'IA pour générer les réponses. Aucun devis ni commande réelle.</div>
    <div class="cw-chips">
      <button type="button">Délais de livraison</button>
      <button type="button">Commande pour une équipe</button>
      <button type="button">Personnaliser un sweat</button>
      <button type="button">Combien ça coûte ?</button>
    </div>
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
  panel.querySelectorAll('.cw-chips button').forEach(b => b.addEventListener('click', () => send(b.textContent)));
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
  function addSummary(q) {
    const d = document.createElement('div');
    d.className = 'cw-summary';
    const rows = [
      ['Article', q.article], ['Quantité', q.quantite], ['Personnalisation', q.perso],
      ['Date souhaitée', q.date], ['Contact', q.nom], ['Email', q.email], ['Estimation', q.estimation]
    ];
    d.innerHTML = '<strong>Demande de devis structurée</strong><dl></dl>';
    const dl = d.querySelector('dl');
    rows.forEach(([k, v]) => {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      dl.append(dt, dd);
    });
    body.appendChild(d); scroll();
  }

  // ---------- Logique ----------
  let busy = false;
  let quote = null; // demande en cours (mode démonstration)
  const sessionId = 'demo-' + Math.random().toString(36).slice(2);
  const history = []; // Historique réduit, envoyé uniquement si un endpoint IA est configuré.

  async function send(raw) {
    const text = (raw || '').trim();
    if (!text || busy) return;
    input.value = ''; sendBtn.disabled = true;
    addMsg(text, 'user');
    busy = true;
    const t = typing();
    let answer;
    if (CW_CONFIG.apiEndpoint) {
      try {
        const nextHistory = [...history, { role: 'user', text }].slice(-12);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 18000);
        let response;
        try {
          response = await fetch(CW_CONFIG.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: nextHistory }),
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeout);
        }
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Service indisponible');
        if (!json.output || typeof json.output !== 'string') throw new Error('Réponse invalide');
        history.push({ role: 'user', text }, { role: 'model', text: json.output });
        while (history.length > 12) history.shift();
        answer = { text: json.output };
      } catch (err) {
        answer = { text: 'Le service IA est temporairement indisponible. Veuillez réessayer dans quelques instants. (Aucun message n’a été envoyé à l’atelier.)' };
      }
    } else if (CW_CONFIG.n8nWebhookUrl) {
      try {
        const r = await fetch(CW_CONFIG.n8nWebhookUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sendMessage', sessionId, chatInput: text })
        });
        const json = await r.json();
        answer = { text: json.output || json.text || 'Désolé, je n’ai pas compris.' };
      } catch (err) {
        answer = scripted(text);
      }
    } else {
      await new Promise(r => setTimeout(r, 550 + Math.random() * 500));
      answer = scripted(text);
    }
    t.remove();
    (Array.isArray(answer) ? answer : [answer]).forEach(a => {
      if (a.text) addMsg(a.text, 'bot');
      if (a.summary) addSummary(a.summary);
    });
    busy = false;
    input.focus();
  }

  const has = (s, words) => words.some(w => s.includes(w));
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function findProduct(s) {
    const hit = PRODUCT_WORDS.find(([, ws]) => has(s, ws));
    return hit ? hit[0] : null;
  }
  function discount(n) { return n >= 50 ? .2 : n >= 25 ? .15 : n >= 10 ? .1 : 0; }

  const STEPS = [
    { key: 'article', ask: 'Avec plaisir ! Quel article souhaitez-vous ? (t-shirt, sweat, hoodie, casquette, tote bag ou tablier)' },
    { key: 'quantite', ask: 'Combien de pièces vous faut-il ?' },
    { key: 'perso', ask: 'Quelle personnalisation : logo, prénom, texte ou dessin ? Et où (cœur, dos, manche) ?' },
    { key: 'date', ask: 'Pour quelle date en avez-vous besoin ?' },
    { key: 'nom', ask: 'À quel nom (et quelle entreprise ou équipe) dois-je préparer la demande ?' },
    { key: 'email', ask: 'Dernière question : votre adresse email pour recevoir la maquette et le devis ?' }
  ];

  function startQuote(prefill) {
    quote = { step: 0, data: {} };
    if (prefill) { quote.data.article = prefill; quote.step = 1; }
    return { text: prefill ? `Noté : ${prefill}. ${STEPS[1].ask}` : STEPS[0].ask };
  }

  function continueQuote(text, s) {
    if (has(s, ['annuler', 'stop', 'laisse tomber'])) {
      quote = null;
      return { text: 'Pas de souci, j’ai annulé la demande. Je reste là si vous avez une autre question.' };
    }
    const step = STEPS[quote.step];
    if (step.key === 'article') {
      const p = findProduct(s);
      if (!p) return { text: 'Je n’ai pas reconnu l’article. Choisissez parmi : t-shirt, sweat, hoodie, casquette, tote bag ou tablier.' };
      quote.data.article = p;
    } else if (step.key === 'quantite') {
      const n = parseInt(s.replace(/\D+/g, ' ').trim().split(' ')[0], 10);
      if (!n || n < 1) return { text: 'Pouvez-vous m’indiquer un nombre de pièces ? (par exemple : 30)' };
      if (n > 5000) return { text: 'Pour plus de 5 000 pièces, notre équipe vous recontactera directement. Pouvez-vous indiquer un nombre plus petit pour l’estimation ?' };
      quote.data.quantite = n;
    } else if (step.key === 'email') {
      const m = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
      if (!m) return { text: 'Cette adresse ne semble pas valide. Pouvez-vous vérifier ?' };
      quote.data.email = m[0];
    } else {
      quote.data[step.key] = text;
    }

    // Petit commentaire utile après la quantité
    let extra = '';
    if (step.key === 'quantite') {
      const d = discount(quote.data.quantite);
      extra = d ? `Bonne nouvelle : à partir de cette quantité, vous avez −${d * 100} % sur le prix unitaire. ` : '';
    }

    quote.step++;
    if (quote.step < STEPS.length) return { text: extra + STEPS[quote.step].ask };

    const q = quote.data;
    const unit = PRODUCTS[q.article];
    const total = Math.round(unit * q.quantite * (1 - discount(q.quantite)));
    const summary = {
      article: q.article, quantite: q.quantite + ' pièce' + (q.quantite > 1 ? 's' : ''), perso: q.perso,
      date: q.date, nom: q.nom, email: q.email,
      estimation: `≈ ${total.toLocaleString('fr-FR')} € TTC (indicatif, confirmé avec la maquette)`
    };
    quote = null;
    return [
      { text: 'Merci ! Voici le récapitulatif de votre demande :' },
      { summary },
      { text: 'Dans une vraie installation, cette demande arriverait directement dans la boîte mail de l’atelier, prête à traiter. (Démo : rien n’a été envoyé.)' }
    ];
  }

  function scripted(text) {
    const s = norm(text);
    if (quote) return continueQuote(text, s);

    if (has(s, ['equipe', 'entreprise', 'groupe', 'association', 'club', 'devis', 'logo', 'commande'])) {
      return [
        { text: 'Pour les équipes et entreprises, on brode dès 10 pièces avec des prix dégressifs (−10 % dès 10, −15 % dès 25, −20 % dès 50).' },
        startQuote(findProduct(s))
      ];
    }
    if (has(s, ['delai', 'livraison', 'quand', 'recevoir', 'rapide', 'express'])) {
      return { text: 'Comptez 7 jours ouvrés après validation de votre maquette. Besoin plus vite ? L’option express livre en 72 h (+15 €). La livraison est offerte dès 80 €.' };
    }
    if (has(s, ['prix', 'tarif', 'combien', 'cout', 'coute', 'cher'])) {
      return { text: 'Nos prix, broderie comprise :\n• T-shirt : 29 €\n• Sweat : 49 €\n• Hoodie : 59 €\n• Casquette : 25 €\n• Tote bag : 19 €\n• Tablier : 35 €\nPour une commande de groupe, tapez « devis » et je prépare une estimation.' };
    }
    if (has(s, ['personnalis', 'broder', 'brode', 'prenom', 'dessin', 'photo', 'animal', 'texte'])) {
      return { text: 'C’est simple : envoyez-nous un prénom, une photo ou un dessin. Notre graphiste prépare une maquette gratuite, vous la validez, puis on brode. Vous souhaitez démarrer une demande ? Tapez « devis ».' };
    }
    if (has(s, ['minimum', 'une seule', '1 piece', 'un seul'])) {
      return { text: 'On brode dès 1 pièce, sans minimum de commande.' };
    }
    if (has(s, ['lavage', 'laver', 'entretien', 'machine'])) {
      return { text: 'Lavez à 30 °C, à l’envers, et évitez le sèche-linge. La broderie tiendra des années.' };
    }
    if (has(s, ['retour', 'rembours', 'echange', 'taille'])) {
      return { text: 'Les pièces personnalisées ne sont pas reprises, sauf défaut de fabrication : dans ce cas, on refait la pièce gratuitement. Un guide des tailles est disponible sur chaque fiche produit.' };
    }
    if (has(s, ['bonjour', 'salut', 'hello', 'coucou', 'bonsoir'])) {
      return { text: 'Bonjour ! Je peux vous renseigner sur nos prix, nos délais, la personnalisation, ou préparer une demande de devis. Que puis-je faire pour vous ?' };
    }
    if (has(s, ['merci'])) {
      return { text: 'Avec plaisir ! Bonne journée.' };
    }
    const p = findProduct(s);
    if (p) {
      return { text: `Notre ${p} est à ${PRODUCTS[p]} €, broderie comprise. Vous voulez que je prépare une demande pour plusieurs pièces ? Tapez « devis ».` };
    }
    return { text: 'Je ne suis pas sûr de bien comprendre. Je peux vous aider sur les prix, les délais, la personnalisation ou une commande pour une équipe. Vous pouvez aussi écrire « devis ».' };
  }
})();
