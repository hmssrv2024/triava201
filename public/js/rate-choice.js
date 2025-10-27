import { getExchangeRates } from './exchange-rates.js';

function format(value) {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function persistUsdToEur(value) {
  if (!Number.isFinite(value) || value <= 0) return;
  try {
    localStorage.setItem('selectedRateUsdToEur', String(value));
  } catch (e) {}
}

let currentRates = {};
let updateInterval;

async function refreshRates() {
  try {
    currentRates = await getExchangeRates();
    if (Number.isFinite(currentRates?.usdToEur) && currentRates.usdToEur > 0) {
      persistUsdToEur(currentRates.usdToEur);
    }
    const examples = {
      'dolarPromedio-example': currentRates.dolarPromedio,
      'bcv-example': currentRates.bcv,
      'usdt-example': currentRates.usdt,
      'dolarBinance-example': currentRates.dolarBinance,
      'euroDigital-example': currentRates.euroDigital
    };
    Object.entries(examples).forEach(([id, rate]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = format(rate * 100);
    });
    const values = {
      'dolarPromedio-value': currentRates.dolarPromedio,
      'bcv-value': currentRates.bcv,
      'usdt-value': currentRates.usdt,
      'dolarBinance-value': currentRates.dolarBinance,
      'euroDigital-value': currentRates.euroDigital
    };
    Object.entries(values).forEach(([id, rate]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = format(rate);
    });
    document.dispatchEvent(new CustomEvent('ratesLoaded', { detail: currentRates }));
  } catch (e) {}
}

function startUpdater(rate) {
  clearInterval(updateInterval);
  const dynamic = ['bcv', 'usdt', 'euroDigital', 'dolarPromedio'];
  if (!dynamic.includes(rate)) return;
  updateInterval = setInterval(async () => {
    try {
      currentRates = await getExchangeRates();
      const value = currentRates[rate];
      localStorage.setItem('selectedRateValue', value);
      if (Number.isFinite(currentRates?.usdToEur) && currentRates.usdToEur > 0) {
        persistUsdToEur(currentRates.usdToEur);
      }
      document.dispatchEvent(
        new CustomEvent('rateSelected', {
          detail: { rate, value, usdToEur: currentRates.usdToEur }
        })
      );
    } catch (e) {}
  }, 60000);
}

document.addEventListener('DOMContentLoaded', async () => {
  await refreshRates();

  const storedRate = localStorage.getItem('selectedRate');
  if (storedRate && currentRates[storedRate]) {
    localStorage.setItem('selectedRateValue', currentRates[storedRate]);
    if (Number.isFinite(currentRates?.usdToEur) && currentRates.usdToEur > 0) {
      persistUsdToEur(currentRates.usdToEur);
    }
    document.dispatchEvent(
      new CustomEvent('rateSelected', {
        detail: { rate: storedRate, value: currentRates[storedRate], usdToEur: currentRates.usdToEur }
      })
    );
    startUpdater(storedRate);
  }

  const overlay = document.getElementById('rate-choice-overlay');
  if (!overlay) return;

  const keepOverlayOpen = e => {
    if (overlay.style.display !== 'none' && !overlay.contains(e.target)) {
      overlay.style.display = 'flex';
    }
  };
  const preventClose = e => e.stopPropagation();

  if (storedRate) {
    overlay.style.display = 'none';
    return;
  }

  overlay.style.display = 'flex';
  document.addEventListener('click', keepOverlayOpen, true);
  overlay.addEventListener('click', preventClose);

    overlay.querySelectorAll('.rate-more-toggle').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const more = btn.closest('.rate-option').querySelector('.rate-more');

        // Close any other open sections and reset their buttons
        overlay.querySelectorAll('.rate-more.open').forEach(open => {
          if (open !== more) {
            open.classList.remove('open');
            const toggle = open.closest('.rate-option').querySelector('.rate-more-toggle');
            if (toggle) toggle.textContent = 'Ver más';
          }
        });

        const isOpen = more.classList.toggle('open');
        btn.textContent = isOpen ? 'Ver menos' : 'Ver más';
      });
    });

  overlay.querySelectorAll('.rate-option').forEach(opt => {
    opt.addEventListener('click', async () => {
      const rate = opt.dataset.rate;
      if (opt.dataset.disabled === 'true' || rate === 'bcv') {
        await Swal.fire({
          title: 'Tasa no disponible',
          text: 'La tasa BCV no está disponible temporalmente. Por favor elige otra opción.',
          icon: 'info',
          confirmButtonText: 'Entendido'
        });
        return;
      }
      const value = currentRates[rate] || 0;
      const text = '¿Deseas seleccionar esta tasa de cambio?';

      const result = await Swal.fire({
        title: 'Confirmar tasa',
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        try {
          localStorage.setItem('selectedRate', rate);
          localStorage.setItem('selectedRateValue', value);
          if (Number.isFinite(currentRates?.usdToEur) && currentRates.usdToEur > 0) {
            persistUsdToEur(currentRates.usdToEur);
          }
        } catch (e) {}
        overlay.style.display = 'none';
        document.removeEventListener('click', keepOverlayOpen, true);
        overlay.removeEventListener('click', preventClose);
        document.dispatchEvent(
          new CustomEvent('rateSelected', { detail: { rate, value, usdToEur: currentRates.usdToEur } })
        );
        startUpdater(rate);
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    });
  });
});

