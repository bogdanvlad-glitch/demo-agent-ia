// Animations and responsive navigation; works with GitHub Pages static hosting.
(() => {
  const nav = document.querySelector('.nav');
  if (nav) {
    const bar = nav.querySelector('.wrap');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mobile-menu-button';
    button.textContent = 'Menu ☰';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Afficher le menu de navigation');
    const menu = document.createElement('div');
    menu.className = 'mobile-menu';
    menu.id = 'mobile-menu';
    menu.hidden = true;
    const items = [
      ['Accueil', 'index.html'],
      ['Boutique', 'boutique.html'],
      ['Personnalisations', 'personnalisations.html'],
      ['Entreprises', 'entreprises.html'],
      ['FAQ', 'faq.html'],
      ['Contact', 'contact.html']
    ];
    const current = location.pathname.split('/').pop() || 'index.html';
    items.forEach(([label, href]) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      if (current === href) link.setAttribute('aria-current', 'page');
      menu.append(link);
    });
    button.setAttribute('aria-controls', menu.id);
    button.addEventListener('click', () => {
      menu.hidden = !menu.hidden;
      button.setAttribute('aria-expanded', String(!menu.hidden));
      button.textContent = menu.hidden ? 'Menu ☰' : 'Fermer ✕';
    });
    menu.addEventListener('click', e => { if (e.target.closest('a')) { menu.hidden = true; button.setAttribute('aria-expanded', 'false'); button.textContent = 'Menu ☰'; } });
    bar.append(button);
    nav.after(menu);
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }
  document.querySelectorAll('section, .card, .steps, .pro, .trust').forEach(el => {
    if (!el.hasAttribute('data-reveal') && !el.closest('[data-reveal]')) el.setAttribute('data-reveal', '');
  });
  const els = [...document.querySelectorAll('[data-reveal]')];
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const ob = new IntersectionObserver(entries => {
      entries.forEach(entry => { if(entry.isIntersecting) { entry.target.classList.add('is-visible'); ob.unobserve(entry.target); } });
    }, {threshold:.07,rootMargin:'0px 0px -30px 0px'});
    els.forEach(el => ob.observe(el));
  } else els.forEach(el => el.classList.add('is-visible'));
})();