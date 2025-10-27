import '../../public/js/exchange-rate.js';

const currencyNames = { usd: 'USDT', eur: 'Euro digital' };

// Rutinas sensibles que pasan a estar respaldadas por WebAssembly para
// evitar manipulaciones: conversión numérica, validación de montos,
// cálculo de totales y detección de tendencia.
const fallbackProtectedLogic = {
  toNumericValue(text) {
    if (typeof text !== 'string') return Number.NaN;
    const sanitized = text.replace(/[^0-9,.-]/g, '');
    if (!sanitized) return Number.NaN;

    const hasCommaDecimal = /,\d{1,2}$/.test(sanitized);
    const hasDotDecimal = /\.\d{1,2}$/.test(sanitized);

    let normalized = sanitized;

    if (hasCommaDecimal) {
      normalized = sanitized.replace(/\./g, '').replace(',', '.');
    } else if (hasDotDecimal) {
      normalized = sanitized.replace(/,/g, '');
    } else {
      normalized = sanitized.replace(/[.,]/g, '');
    }

    const value = parseFloat(normalized);
    return Number.isFinite(value) ? value : Number.NaN;
  },
  parseAmountInput(value) {
    if (typeof value !== 'string') return Number.NaN;
    const numeric = fallbackProtectedLogic.toNumericValue(value);
    return Number.isFinite(numeric) ? numeric : Number.NaN;
  },
  calculateTotal(amount, rate) {
    return Number.isFinite(amount) && Number.isFinite(rate) ? amount * rate : Number.NaN;
  },
  determineTrend(previous, current) {
    if (!Number.isFinite(current) || !Number.isFinite(previous)) {
      return 0;
    }
    if (current > previous) return 1;
    if (current < previous) return -1;
    return 0;
  }
};

let activeProtectedLogic = fallbackProtectedLogic;

async function ensureProtectedLogic() {
  const wasmReady = globalThis.__dolarhoyWasmReady__;
  if (!wasmReady || typeof wasmReady.then !== 'function') {
    return;
  }

  try {
    const wasm = await wasmReady;
    if (!wasm || typeof wasm.to_numeric_value !== 'function') {
      return;
    }

    activeProtectedLogic = {
      toNumericValue(text) {
        if (typeof text !== 'string') return Number.NaN;
        const result = wasm.to_numeric_value(text);
        return Number.isFinite(result) ? result : Number.NaN;
      },
      parseAmountInput(value) {
        if (typeof value !== 'string') return Number.NaN;
        const result = wasm.parse_amount_input(value);
        return Number.isFinite(result) ? result : Number.NaN;
      },
      calculateTotal(amount, rate) {
        const result = wasm.calculate_total(amount, rate);
        return Number.isFinite(result) ? result : Number.NaN;
      },
      determineTrend(previous, current) {
        const prev = Number.isFinite(previous) ? previous : Number.NaN;
        const curr = Number.isFinite(current) ? current : Number.NaN;
        const result = wasm.determine_trend(prev, curr);
        return Number.isFinite(result) ? Math.sign(result) : 0;
      }
    };
  } catch (error) {
    console.error('No fue posible activar la lógica protegida en WebAssembly:', error);
    activeProtectedLogic = fallbackProtectedLogic;
  }
}

function toNumericValue(text) {
  return activeProtectedLogic.toNumericValue(text);
}

function parseAmountInput(value) {
  return activeProtectedLogic.parseAmountInput(value);
}

function calculateTotal(amount, rate) {
  return activeProtectedLogic.calculateTotal(amount, rate);
}

function determineTrendDirection(previous, current) {
  const direction = Number(activeProtectedLogic.determineTrend(previous, current));
  if (Number.isNaN(direction)) return 0;
  if (direction > 0) return 1;
  if (direction < 0) return -1;
  return 0;
}

async function main() {
  const usdRateElement = document.getElementById('usd-rate');
  const eurRateElement = document.getElementById('eur-rate');
  const usdTrendElement = document.getElementById('usd-trend');
  const eurTrendElement = document.getElementById('eur-trend');
  const lastUpdateElement = document.getElementById('last-update');
  const statusMessage = document.getElementById('status-message');
  const sourceFrame = document.getElementById('exchange-source');
  const refreshButton = document.getElementById('refresh-button');
  const copyButtons = Array.from(document.querySelectorAll('.copy-button'));
  const calculatorOverlay = document.getElementById('calculator-overlay');
  const calculatorButton = document.getElementById('calculator-button');
  const calculatorCloseButton = document.getElementById('calculator-close');
  const currencyOptions = Array.from(document.querySelectorAll('[data-calc-currency]'));
  const calculatorAmountInput = document.getElementById('calculator-amount');
  const calculatorResultValue = document.getElementById('calculator-result-value');
  const calculatorRateInfo = document.getElementById('calculator-rate-info');
  const calculatorCopyButton = document.getElementById('calculator-copy');
  const calculatorCopyLabel = calculatorCopyButton?.querySelector('span') ?? null;
  const calculatorSelectedLabel = document.getElementById('calculator-selected-label');
  const calculatorSymbol = document.getElementById('calculator-symbol');

  const bolivarFormatter = new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const lastRates = { usd: null, eur: null };
  const latestNumericRates = { usd: null, eur: null };
  let pollingIntervalId = null;
  let calculatorCurrency = 'usd';
  let copyFeedbackTimeout = null;

  await ensureProtectedLogic();

  function formatDate(date) {
    return date.toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatTime(date) {
    return date.toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function updateClock() {
    const now = new Date();
    const dateElement = document.getElementById('current-date');
    const timeElement = document.getElementById('current-time');
    if (dateElement) dateElement.textContent = formatDate(now);
    if (timeElement) timeElement.textContent = formatTime(now);
  }

  function formatBolivares(value) {
    return Number.isFinite(value) ? bolivarFormatter.format(value) : '—';
  }

  function getExchangeRateUtils() {
    const utils = globalThis.__exchangeRateUtils__;
    if (utils && typeof utils.getStoredExchangeRate === 'function') {
      return utils;
    }
    return null;
  }

  function getStoredRates() {
    try {
      const utils = getExchangeRateUtils();
      return utils ? utils.getStoredExchangeRate() : null;
    } catch (error) {
      console.error('No fue posible leer las tasas almacenadas:', error);
      return null;
    }
  }

  function getRateForCurrency(currency) {
    if (currency === 'usd' && typeof latestNumericRates.usd === 'number') {
      return latestNumericRates.usd;
    }
    if (currency === 'eur' && typeof latestNumericRates.eur === 'number') {
      return latestNumericRates.eur;
    }

    const stored = getStoredRates();
    if (!stored) return null;

    if (currency === 'usd' && typeof stored.USD_TO_BS === 'number' && stored.USD_TO_BS > 0) {
      return stored.USD_TO_BS;
    }

    if (
      currency === 'eur' &&
      typeof stored.USD_TO_BS === 'number' &&
      typeof stored.USD_TO_EUR === 'number' &&
      stored.USD_TO_BS > 0 &&
      stored.USD_TO_EUR > 0
    ) {
      return stored.USD_TO_BS / stored.USD_TO_EUR;
    }

    return null;
  }

  function updateCalculatorResult() {
    if (!calculatorAmountInput || !calculatorResultValue) return;

    calculatorCopyButton?.classList.remove('success');
    if (calculatorCopyLabel) {
      calculatorCopyLabel.textContent = 'Copiar monto en Bs.';
    }

    const rawValue = calculatorAmountInput.value.trim();
    if (!rawValue) {
      calculatorResultValue.textContent = 'Introduce un monto';
      calculatorCopyButton?.setAttribute('disabled', 'true');
      calculatorCopyButton?.setAttribute('aria-disabled', 'true');
      calculatorCopyButton?.classList.remove('success');
      delete calculatorResultValue.dataset.rawValue;
      return;
    }

    const amount = parseAmountInput(rawValue);
    if (!Number.isFinite(amount)) {
      calculatorResultValue.textContent = 'Introduce un monto válido';
      calculatorCopyButton?.setAttribute('disabled', 'true');
      calculatorCopyButton?.setAttribute('aria-disabled', 'true');
      calculatorCopyButton?.classList.remove('success');
      delete calculatorResultValue.dataset.rawValue;
      return;
    }

    const rate = getRateForCurrency(calculatorCurrency);
    if (!Number.isFinite(rate)) {
      calculatorResultValue.textContent = 'Esperando tasa disponible';
      calculatorCopyButton?.setAttribute('disabled', 'true');
      calculatorCopyButton?.setAttribute('aria-disabled', 'true');
      calculatorCopyButton?.classList.remove('success');
      delete calculatorResultValue.dataset.rawValue;
      return;
    }

    const total = calculateTotal(amount, rate);
    if (!Number.isFinite(total)) {
      calculatorResultValue.textContent = 'Error al calcular el monto';
      calculatorCopyButton?.setAttribute('disabled', 'true');
      calculatorCopyButton?.setAttribute('aria-disabled', 'true');
      calculatorCopyButton?.classList.remove('success');
      delete calculatorResultValue.dataset.rawValue;
      return;
    }

    calculatorResultValue.textContent = formatBolivares(total);
    calculatorResultValue.dataset.rawValue = total.toFixed(2);
    calculatorCopyButton?.removeAttribute('disabled');
    calculatorCopyButton?.removeAttribute('aria-disabled');
  }

  function updateCalculatorSummary() {
    if (!calculatorSelectedLabel || !calculatorSymbol || !calculatorRateInfo) return;
    const label = currencyNames[calculatorCurrency] || 'USDT';
    calculatorSelectedLabel.textContent = label;
    calculatorSymbol.textContent = calculatorCurrency === 'usd' ? 'USDT' : '€';

    const rate = getRateForCurrency(calculatorCurrency);
    if (Number.isFinite(rate)) {
      calculatorRateInfo.textContent = `1 ${label} = ${formatBolivares(rate)}`;
    } else {
      calculatorRateInfo.textContent = 'Esperando tasa actualizada…';
    }

    updateCalculatorResult();
  }

  function setCalculatorCurrency(currency) {
    calculatorCurrency = currencyNames[currency] ? currency : 'usd';
    currencyOptions.forEach((button) => {
      const value = button.getAttribute('data-calc-currency');
      const isActive = value === calculatorCurrency;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    updateCalculatorSummary();
  }

  function openCalculator() {
    if (!calculatorOverlay) return;
    calculatorOverlay.classList.add('visible');
    calculatorOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('calculator-open');
    updateCalculatorSummary();
    setTimeout(() => {
      calculatorAmountInput?.focus({ preventScroll: true });
    }, 60);
  }

  function closeCalculator() {
    if (!calculatorOverlay) return;
    calculatorOverlay.classList.remove('visible');
    calculatorOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('calculator-open');
    if (copyFeedbackTimeout) {
      clearTimeout(copyFeedbackTimeout);
      copyFeedbackTimeout = null;
    }
    calculatorCopyButton?.classList.remove('success');
    if (calculatorCopyLabel) {
      calculatorCopyLabel.textContent = 'Copiar monto en Bs.';
    }
  }

  function initialiseCalculatorWithStoredRates() {
    const stored = getStoredRates();
    if (stored) {
      if (typeof stored.USD_TO_BS === 'number' && stored.USD_TO_BS > 0 && typeof latestNumericRates.usd !== 'number') {
        latestNumericRates.usd = stored.USD_TO_BS;
      }
      if (
        typeof stored.USD_TO_BS === 'number' &&
        typeof stored.USD_TO_EUR === 'number' &&
        stored.USD_TO_BS > 0 &&
        stored.USD_TO_EUR > 0 &&
        typeof latestNumericRates.eur !== 'number'
      ) {
        latestNumericRates.eur = stored.USD_TO_BS / stored.USD_TO_EUR;
      }
    }
    setCalculatorCurrency(calculatorCurrency);
  }

  function parseLastUpdate(text) {
    if (!text) return 'Sin datos disponibles';
    const separatorIndex = text.indexOf(':');
    return separatorIndex >= 0 ? text.slice(separatorIndex + 1).trim() : text;
  }

  function updateTrend(currency, trendElement, numericValue) {
    if (!trendElement) return;
    if (!Number.isFinite(numericValue)) {
      trendElement.textContent = '—';
      trendElement.className = 'trend-indicator steady';
      lastRates[currency] = null;
      return;
    }

    const previous = typeof lastRates[currency] === 'number' ? lastRates[currency] : Number.NaN;
    const direction = determineTrendDirection(previous, numericValue);
    let trendClass = 'steady';
    let trendSymbol = '→';

    if (direction > 0) {
      trendClass = 'up';
      trendSymbol = '↑';
    } else if (direction < 0) {
      trendClass = 'down';
      trendSymbol = '↓';
    }

    trendElement.textContent = trendSymbol;
    trendElement.className = `trend-indicator ${trendClass}`;
    lastRates[currency] = numericValue;
  }

  function updateRateDisplay(currency, valueElement, trendElement, rawText) {
    if (!valueElement) return;
    const cleanText = rawText.replace(/\s*VES$/i, '').trim();
    valueElement.textContent = `${cleanText} VES`;
    const numericValue = toNumericValue(cleanText);
    updateTrend(currency, trendElement, numericValue);
    if (typeof numericValue === 'number' && Number.isFinite(numericValue)) {
      latestNumericRates[currency] = numericValue;
    } else {
      latestNumericRates[currency] = null;
    }
    updateCalculatorSummary();
  }

  function readRatesFromSource() {
    try {
      const doc = sourceFrame?.contentDocument || sourceFrame?.contentWindow?.document;
      if (!doc) return;

      const usdText = doc.getElementById('usdt-ves')?.textContent?.trim();
      const eurText = doc.getElementById('eur-ves')?.textContent?.trim();
      const lastText = doc.getElementById('last-updated')?.textContent?.trim();

      let hasFreshData = false;

      if (usdText && usdText !== '-') {
        updateRateDisplay('usd', usdRateElement, usdTrendElement, usdText);
        hasFreshData = true;
      }

      if (eurText && eurText !== '-') {
        updateRateDisplay('eur', eurRateElement, eurTrendElement, eurText);
        hasFreshData = true;
      }

      if (lastText) {
        const normalized = lastText.toLowerCase();
        if (normalized.includes('última actualización')) {
          lastUpdateElement.textContent = parseLastUpdate(lastText);
        } else {
          lastUpdateElement.textContent = lastText;
        }
      }

      if (hasFreshData) {
        statusMessage.textContent = 'Datos sincronizados automáticamente cada pocos segundos.';
      }
    } catch (error) {
      console.error('Error al leer las tasas desde la fuente:', error);
      statusMessage.textContent = 'No se pudieron leer los datos. Reintentando…';
    }
  }

  function startReadingSource() {
    try {
      readRatesFromSource();
      if (!pollingIntervalId) {
        statusMessage.textContent = 'Sincronizando datos con tasadecambio.html…';
        pollingIntervalId = setInterval(readRatesFromSource, 8000);
      }
    } catch (error) {
      console.error('No fue posible leer las tasas:', error);
      statusMessage.textContent = 'Error al conectar con tasadecambio.html. Intentando nuevamente…';
      setTimeout(startReadingSource, 5000);
    }
  }

  refreshButton?.addEventListener('click', () => {
    statusMessage.textContent = 'Actualizando manualmente…';
    readRatesFromSource();
  });

  calculatorButton?.addEventListener('click', openCalculator);
  calculatorCloseButton?.addEventListener('click', closeCalculator);

  calculatorOverlay?.addEventListener('click', (event) => {
    if (event.target === calculatorOverlay) {
      closeCalculator();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && calculatorOverlay?.classList.contains('visible')) {
      closeCalculator();
    }
  });

  currencyOptions.forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-calc-currency');
      if (value) {
        setCalculatorCurrency(value);
      }
    });
  });

  calculatorAmountInput?.addEventListener('input', (event) => {
    const target = event.target;
    if (target && typeof target.value === 'string') {
      const sanitized = target.value.replace(/[^0-9.,]/g, '');
      if (sanitized !== target.value) {
        target.value = sanitized;
      }
    }
    updateCalculatorResult();
  });

  calculatorAmountInput?.addEventListener('focus', (event) => {
    if (event.target && typeof event.target.select === 'function') {
      event.target.select();
    }
  });

  calculatorCopyButton?.addEventListener('click', async () => {
    if (calculatorCopyButton.hasAttribute('disabled')) return;
    const text = calculatorResultValue?.textContent?.trim();
    const raw = calculatorResultValue?.dataset?.rawValue;
    if (!text || !raw) return;
    try {
      await navigator.clipboard.writeText(text);
      calculatorCopyButton.classList.add('success');
      if (calculatorCopyLabel) {
        calculatorCopyLabel.textContent = 'Copiado';
      }
      if (copyFeedbackTimeout) {
        clearTimeout(copyFeedbackTimeout);
      }
      copyFeedbackTimeout = setTimeout(() => {
        calculatorCopyButton.classList.remove('success');
        if (calculatorCopyLabel) {
          calculatorCopyLabel.textContent = 'Copiar monto en Bs.';
        }
      }, 1500);
    } catch (error) {
      console.error('No fue posible copiar el monto de la calculadora:', error);
    }
  });

  copyButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const targetId = button.getAttribute('data-target');
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;

      const text = target.textContent?.trim();
      if (!text) return;

      try {
        await navigator.clipboard.writeText(text);
        button.classList.add('copied');
        setTimeout(() => button.classList.remove('copied'), 1200);
      } catch (error) {
        console.error('No fue posible copiar el monto:', error);
      }
    });
  });

  initialiseCalculatorWithStoredRates();
  sourceFrame?.addEventListener('load', startReadingSource);
  updateClock();
  setInterval(updateClock, 1000);
}

const startDolarHoy = () => {
  main().catch((error) => {
    console.error('Error al inicializar la vista de Dólar Hoy:', error);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startDolarHoy);
} else {
  startDolarHoy();
}
