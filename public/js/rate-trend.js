(function () {
  function showTrend(newRate) {
    const last = parseFloat(localStorage.getItem('rateTrend.last'));
    const containers = ['rate-trend-icon', 'pre-rate-trend-icon']
      .map(id => document.getElementById(id))
      .filter(Boolean);

    containers.forEach(c => {
      c.innerHTML = '';
      c.removeAttribute('title');
      c.removeAttribute('aria-label');
    });

    if (isNaN(newRate)) return;

    if (!isNaN(last) && last !== newRate) {
      const up = newRate > last;
      const label = up ? 'Tasa subió' : 'Tasa bajó';
      containers.forEach(c => {
        const icon = document.createElement('i');
        icon.className = `fas fa-arrow-${up ? 'up' : 'down'} ${up ? 'rate-up' : 'rate-down'}`;
        c.appendChild(icon);
        c.setAttribute('title', label);
        c.setAttribute('aria-label', label);
      });
    }

    localStorage.setItem('rateTrend.last', String(newRate));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const stored = parseFloat(localStorage.getItem('selectedRateValue'));
    if (!isNaN(stored)) {
      showTrend(stored);
    }
  });

  document.addEventListener('rateSelected', e => {
    const value = parseFloat(e.detail && e.detail.value);
    if (!isNaN(value)) {
      showTrend(value);
    }
  });
})();

