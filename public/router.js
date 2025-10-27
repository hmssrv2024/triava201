(function () {
  const overlay = document.createElement('div');
  overlay.id = 'spa-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = '#fff';
  overlay.style.zIndex = 10000;
  overlay.style.display = 'none';
  document.body.appendChild(overlay);

  async function navigate(path) {
    const res = await fetch(path);
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    overlay.innerHTML = '<div id="spa-close" class="transfer-close">×</div>' + doc.body.innerHTML;
    overlay.style.display = 'block';
    history.pushState({ path }, '', path);
    document.getElementById('spa-close').onclick = () => history.back();
  }

  document.addEventListener('click', function (e) {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (
      !href ||
      href === '/registro' ||
      link.dataset.router === 'bypass' ||
      href.startsWith('http') ||
      href.startsWith('#') ||
      link.target === '_blank'
    ) {
      return;
    }
    e.preventDefault();
    navigate(href);
  });

  window.addEventListener('popstate', function (e) {
    if (overlay.style.display === 'block') {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
    } else if (e.state && e.state.path) {
      navigate(e.state.path);
    }
  });

  const style = document.createElement('style');
  style.textContent = `#spa-close{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;background:var(--neutral-200,#eee);display:flex;align-items:center;justify-content:center;cursor:pointer;}`;
  document.head.appendChild(style);
})();
