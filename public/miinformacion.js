(function () {
  'use strict';

  const RATE_LABELS = {
    bcv: 'BCV',
    usdt: 'USDT P2P',
    euroDigital: 'Euro Digital',
    dolarPromedio: 'Dólar Promedio',
    dolarBinance: 'Dólar Binance',
    exchange: 'Intercambio Remeex',
    personalizado: 'Tasa personalizada'
  };

  const RATE_DESCRIPTIONS = {
    bcv: 'Tasa oficial publicada por el Banco Central de Venezuela.',
    usdt: 'Referencia según cotización USDT P2P en Binance.',
    euroDigital: 'Conversión basada en el Euro digital Remeex.',
    dolarPromedio: 'Promedio ponderado entre las tasas disponibles.',
    dolarBinance: 'Precio USDT/USD obtenido directamente de Binance.',
    exchange: 'Tipo de cambio utilizado para operaciones entre usuarios Remeex.'
  };

  const STATUS_CLASS = {
    completed: 'completed',
    aprobado: 'completed',
    approved: 'completed',
    finalizado: 'completed',
    pending: 'pending',
    pendiente: 'pending',
    processing: 'pending',
    in_progress: 'pending',
    rejected: 'rejected',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    failed: 'cancelled'
  };

  const CURRENCY_LABELS = {
    usd: '$',
    ves: 'Bs',
    vef: 'Bs',
    bs: 'Bs',
    eur: '€'
  };

  function safeJSONParse(raw) {
    if (!raw || typeof raw !== 'string') return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn('[MiInformación] No se pudo analizar JSON almacenado.', error);
      return null;
    }
  }

  function loadRegistration() {
    return safeJSONParse(localStorage.getItem('visaRegistrationCompleted'));
  }

  function loadBalance() {
    return safeJSONParse(localStorage.getItem('remeexBalance'));
  }

  function loadTransactions() {
    const raw = safeJSONParse(localStorage.getItem('remeexTransactions'));
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.transactions)) return raw.transactions;
    return [];
  }

  function getRateInfo() {
    const key = localStorage.getItem('selectedRate');
    const valueRaw = localStorage.getItem('selectedRateValue');
    const usdToEurRaw = localStorage.getItem('selectedRateUsdToEur');
    const value = valueRaw ? Number(valueRaw) : null;
    const usdToEur = usdToEurRaw ? Number(usdToEurRaw) : null;
    return { key, value, usdToEur };
  }

  function formatNumber(value, options = {}) {
    if (!Number.isFinite(value)) return '--';
    const formatter = new Intl.NumberFormat('es-VE', Object.assign({
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }, options));
    return formatter.format(value);
  }

  function formatCurrency(amount, currency) {
    if (!Number.isFinite(amount)) return '--';
    const normalized = typeof currency === 'string' ? currency.trim().toLowerCase() : '';
    const symbol = CURRENCY_LABELS[normalized] || CURRENCY_LABELS.usd;
    return `${symbol} ${formatNumber(amount)}`;
  }

  function toNumber(value) {
    if (Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const normalized = value
        .replace(/[^0-9,.-]/g, '')
        .replace(/(,)(?=\d{3}\b)/g, '')
        .replace(',', '.');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return '--';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '--';
    const datePart = date.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const timePart = date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} ${timePart}`;
  }

  function resolveTimestamp(transaction) {
    if (!transaction || typeof transaction !== 'object') return null;
    const { timestamp, createdAt, updatedAt, date } = transaction;

    if (Number.isFinite(timestamp)) return timestamp;
    if (typeof timestamp === 'string') {
      const numeric = Number(timestamp);
      if (Number.isFinite(numeric)) return numeric;
      const parsed = Date.parse(timestamp);
      if (Number.isFinite(parsed)) return parsed;
    }

    const fallbackString = createdAt || updatedAt || date;
    if (typeof fallbackString === 'string') {
      const parsed = Date.parse(fallbackString);
      if (Number.isFinite(parsed)) return parsed;
    }

    return null;
  }

  function resolveAmount(transaction) {
    if (!transaction || typeof transaction !== 'object') return { amount: null, currency: 'usd' };
    const candidates = [
      { amount: transaction.displayAmount, currency: transaction.displayCurrency },
      { amount: transaction.amount, currency: transaction.currency || transaction.currencyCode || transaction.currency_type },
      { amount: transaction.total, currency: transaction.currency || transaction.currencyCode },
      { amount: transaction.amountUsd, currency: 'usd' },
      { amount: transaction.amountUSD, currency: 'usd' },
      { amount: transaction.amountBs, currency: 'bs' },
      { amount: transaction.amountVES, currency: 'bs' },
      { amount: transaction.amountEur, currency: 'eur' }
    ];

    for (const entry of candidates) {
      const value = toNumber(entry.amount);
      if (value !== null) {
        let currency = entry.currency;
        if (!currency) {
          if (entry === candidates[5] || entry === candidates[6]) currency = 'bs';
          else if (entry === candidates[7]) currency = 'eur';
          else currency = 'usd';
        }
        return { amount: value, currency };
      }
    }

    return { amount: null, currency: 'usd' };
  }

  function resolveStatus(transaction) {
    const status = (transaction?.status || transaction?.state || transaction?.current_status || '').toString().trim();
    if (!status) return { label: 'Sin estado', css: '' };
    const normalized = status.toLowerCase();
    return {
      label: status,
      css: STATUS_CLASS[normalized] || ''
    };
  }

  function formatRegistrationEntries(registration) {
    if (!registration || typeof registration !== 'object') return [];
    const entries = [];
    Object.keys(registration).sort().forEach((key) => {
      const value = registration[key];
      let displayValue;
      if (value === null || value === undefined || value === '') {
        displayValue = '—';
      } else if (typeof value === 'object') {
        displayValue = JSON.stringify(value, null, 2);
      } else {
        displayValue = String(value);
      }
      entries.push({ key, value: displayValue });
    });
    return entries;
  }

  function renderRegistration(registration) {
    const container = document.getElementById('registration-content');
    const badge = document.getElementById('registration-updated');
    if (!container || !badge) return;

    container.innerHTML = '';

    if (!registration) {
      badge.textContent = 'Sin datos';
      container.innerHTML = '<div class="empty-state">Aún no se ha completado un registro en este dispositivo.</div>';
      return;
    }

    badge.textContent = 'Sincronizado';

    const fragment = document.createDocumentFragment();
    formatRegistrationEntries(registration).forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'info-item';

      const label = document.createElement('span');
      label.className = 'info-label';
      label.textContent = entry.key;

      if (entry.value.includes('\n')) {
        const pre = document.createElement('pre');
        pre.className = 'info-value info-value-block';
        pre.textContent = entry.value;
        item.appendChild(label);
        item.appendChild(pre);
      } else {
        const value = document.createElement('span');
        value.className = 'info-value';
        value.textContent = entry.value;
        item.appendChild(label);
        item.appendChild(value);
      }

      fragment.appendChild(item);
    });

    container.appendChild(fragment);
  }

  function renderRate(rateInfo) {
    const nameEl = document.getElementById('rate-name');
    const valueEl = document.getElementById('rate-value');
    const descEl = document.getElementById('rate-description');
    const eurEl = document.getElementById('rate-eur');
    const badge = document.getElementById('rate-updated');
    if (!nameEl || !valueEl || !descEl || !eurEl || !badge) return;

    if (!rateInfo.key) {
      nameEl.textContent = 'Sin seleccionar';
      valueEl.textContent = '--';
      descEl.textContent = 'Selecciona una tasa en HomeVisa para verla aquí.';
      eurEl.textContent = 'Equivalencia USD → EUR: --';
      badge.textContent = 'Pendiente';
      return;
    }

    const label = RATE_LABELS[rateInfo.key] || rateInfo.key;
    nameEl.textContent = label;
    valueEl.textContent = rateInfo.value ? `${formatNumber(rateInfo.value)} Bs/USD` : '--';
    descEl.textContent = RATE_DESCRIPTIONS[rateInfo.key] || 'Tasa personalizada seleccionada por el usuario.';
    eurEl.textContent = rateInfo.usdToEur
      ? `Equivalencia USD → EUR: ${formatNumber(1 / rateInfo.usdToEur, { maximumFractionDigits: 4 })} USD = 1 €`
      : 'Equivalencia USD → EUR: --';
    badge.textContent = 'Sincronizada';
  }

  function renderBalance(balance) {
    const container = document.getElementById('balance-summary');
    const badge = document.getElementById('balance-updated');
    if (!container || !badge) return;

    container.innerHTML = '';

    if (!balance || typeof balance !== 'object') {
      badge.textContent = 'Sin datos';
      container.innerHTML = '<div class="empty-state">No hay saldo almacenado para mostrar.</div>';
      return;
    }

    const entries = [
      { label: 'Saldo en USD', value: formatCurrency(Number(balance.usd), 'usd') },
      { label: 'Saldo en Bs', value: formatCurrency(Number(balance.bs), 'bs') },
      { label: 'Saldo en EUR', value: formatCurrency(Number(balance.eur), 'eur') }
    ];

    entries.forEach((entry) => {
      const pill = document.createElement('div');
      pill.className = 'balance-pill';
      const title = document.createElement('h3');
      title.textContent = entry.label;
      const value = document.createElement('p');
      value.textContent = entry.value;
      pill.appendChild(title);
      pill.appendChild(value);
      container.appendChild(pill);
    });

    badge.textContent = 'Sincronizado';
  }

  function renderTransactions(transactions) {
    const body = document.getElementById('transactions-body');
    const empty = document.getElementById('transactions-empty');
    const badge = document.getElementById('transactions-updated');
    if (!body || !empty || !badge) return;

    body.innerHTML = '';

    if (!Array.isArray(transactions) || transactions.length === 0) {
      empty.hidden = false;
      badge.textContent = 'Sin datos';
      return;
    }

    empty.hidden = true;
    badge.textContent = `Mostrando ${Math.min(transactions.length, 25)} registros`;

    const sorted = transactions
      .slice(0)
      .sort((a, b) => (resolveTimestamp(b) || 0) - (resolveTimestamp(a) || 0))
      .slice(0, 25);

    sorted.forEach((transaction) => {
      const row = document.createElement('tr');

      const dateCell = document.createElement('td');
      dateCell.textContent = formatTimestamp(resolveTimestamp(transaction));

      const descriptionCell = document.createElement('td');
      const description = transaction?.description || transaction?.title || transaction?.concept || transaction?.notes || 'Sin descripción';
      descriptionCell.textContent = description;

      const typeCell = document.createElement('td');
      const type = transaction?.type || transaction?.category || transaction?.movementType || '—';
      typeCell.textContent = type;

      const amountCell = document.createElement('td');
      const amountInfo = resolveAmount(transaction);
      amountCell.textContent = formatCurrency(amountInfo.amount, amountInfo.currency);

      const statusCell = document.createElement('td');
      const statusInfo = resolveStatus(transaction);
      const statusSpan = document.createElement('span');
      statusSpan.className = ['status-pill', statusInfo.css].filter(Boolean).join(' ');
      statusSpan.textContent = statusInfo.label;
      statusCell.appendChild(statusSpan);

      row.appendChild(dateCell);
      row.appendChild(descriptionCell);
      row.appendChild(typeCell);
      row.appendChild(amountCell);
      row.appendChild(statusCell);

      body.appendChild(row);
    });
  }

  function refreshAll() {
    const registration = loadRegistration();
    const rate = getRateInfo();
    const balance = loadBalance();
    const transactions = loadTransactions();

    renderRegistration(registration);
    renderRate(rate);
    renderBalance(balance);
    renderTransactions(transactions);
  }

  let refreshTimeout = null;

  function scheduleRefresh(delay = 0) {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    refreshTimeout = setTimeout(refreshAll, delay);
  }

  document.addEventListener('DOMContentLoaded', function () {
    refreshAll();
    setInterval(refreshAll, 60000);
  });

  window.addEventListener('storage', function () {
    scheduleRefresh();
  });

  const watchedKeys = new Set([
    'visaRegistrationCompleted',
    'remeexBalance',
    'remeexTransactions',
    'selectedRate',
    'selectedRateValue',
    'selectedRateUsdToEur'
  ]);

  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    originalSetItem(key, value);
    if (watchedKeys.has(key)) {
      scheduleRefresh(10);
    }
  };

  const originalRemoveItem = localStorage.removeItem.bind(localStorage);
  localStorage.removeItem = function (key) {
    originalRemoveItem(key);
    if (watchedKeys.has(key)) {
      scheduleRefresh(10);
    }
  };
})();
