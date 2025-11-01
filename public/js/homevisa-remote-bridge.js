(function () {
  'use strict';

  const COMMAND_KEY = 'homevisaRemoteCommands';
  const PROCESSED_KEY = 'homevisaRemoteProcessed';
  const BLOCK_STATE_KEY = 'homevisaManualBlockState';
  const MAX_PROCESSED = 120;

  const ACCOUNT_STORAGE_KEYS = [
    'visaRegistrationCompleted',
    'visaRegistrationTemp',
    'visaUserData',
    'remeexVerificationData',
    'remeexVerificationBanking',
    'remeexIdentityDetails',
    'remeexIdentityDocuments',
    'remeexProfilePhoto',
    'remeexDeviceId',
    'remeexBalance',
    'remeexSessionBalance',
    'remeexTransactions',
    'remeexBalanceHistory',
    'remeexBalanceTimeline',
    'remeexBalanceSnapshots',
    'remeexBalanceLog',
    'remeexAccountTier',
    'remeexPoints',
    'selectedRate',
    'selectedRateValue',
    'selectedRateUsdToEur',
    'selectedLatamCountry',
    'userFullName',
    'remeexSessionExchangeRate',
    'homevisaSessionMonitor',
    'forcedValidationAmountUsd',
    'validationDiscount',
    'pendingCommission',
    'discountExpiry',
    'discountUsed',
    BLOCK_STATE_KEY
  ];

  const EXCHANGE_HISTORY_KEY = 'remeexExchangeHistory';
  const TRANSACTIONS_KEY = 'remeexTransactions';
  const SESSION_BALANCE_KEY = 'remeexSessionBalance';
  const REMOTE_TRANSFER_EVENT = 'homevisa:remote-transfer';

  const RATE_LABELS = {
    bcv: 'BCV',
    usdt: 'USDT P2P',
    euroDigital: 'Euro Digital',
    dolarPromedio: 'Dólar Promedio',
    dolarBinance: 'Dólar Binance',
    exchange: 'Intercambio Remeex',
    personalizado: 'Tasa personalizada'
  };

  const BLOCK_MESSAGES = {
    general: 'Tu cuenta está bloqueada temporalmente por revisión manual. Contacta a soporte para reactivarla.',
    validation: 'Debes completar la validación con una recarga supervisada para reactivar todas las funciones.',
    security: 'Detectamos actividad inusual y protegimos tu cuenta. Comunícate con soporte para desbloquearla.',
    payments: 'Los pagos están temporalmente limitados mientras revisamos tus operaciones recientes.',
    withdrawals: 'Los retiros se habilitarán una vez completes la validación adicional solicitada.'
  };

  const CURRENCY_SYMBOLS = {
    usd: '$',
    ves: 'Bs',
    vef: 'Bs',
    bs: 'Bs',
    eur: '€'
  };

  const OVERLAY_STYLE_ID = 'homevisa-remote-overlay-styles';
  const OVERLAY_ID = 'homevisa-remote-overlay';

  let processedIds = new Set();
  let processing = false;
  let domReady = document.readyState !== 'loading';

  function onDomReady(callback) {
    if (domReady) {
      callback();
      return;
    }
    document.addEventListener('DOMContentLoaded', function handleReady() {
      document.removeEventListener('DOMContentLoaded', handleReady);
      domReady = true;
      callback();
    });
  }

  function safeParseJSON(value) {
    if (!value || typeof value !== 'string') return null;
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn('[HomeVisaRemote] JSON inválido en almacenamiento.', error);
      return null;
    }
  }

  function loadQueue() {
    const stored = safeParseJSON(localStorage.getItem(COMMAND_KEY));
    return Array.isArray(stored) ? stored : [];
  }

  function saveQueue(queue) {
    try {
      localStorage.setItem(COMMAND_KEY, JSON.stringify(queue));
    } catch (error) {
      console.warn('[HomeVisaRemote] No se pudo guardar la cola remota.', error);
    }
  }

  function loadProcessedList() {
    const stored = safeParseJSON(localStorage.getItem(PROCESSED_KEY));
    if (!Array.isArray(stored)) return [];
    return stored.filter((id) => typeof id === 'string');
  }

  function saveProcessedSet() {
    const list = Array.from(processedIds);
    while (list.length > MAX_PROCESSED) {
      list.shift();
    }
    try {
      localStorage.setItem(PROCESSED_KEY, JSON.stringify(list));
    } catch (error) {
      console.warn('[HomeVisaRemote] No se pudo guardar el historial de acciones procesadas.', error);
    }
    processedIds = new Set(list);
  }

  function toNumber(value) {
    if (Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;

      let normalized = trimmed.replace(/[\u202f\u00a0\s]/g, '');
      let sign = '';

      if (normalized.startsWith('-')) {
        sign = '-';
        normalized = normalized.slice(1);
      }

      normalized = normalized.replace(/-/g, '');
      normalized = normalized.replace(/[^0-9.,]/g, '');
      if (!normalized) return null;

      const lastComma = normalized.lastIndexOf(',');
      const lastDot = normalized.lastIndexOf('.');
      const decimalIndex = Math.max(lastComma, lastDot);

      let integerPart = normalized;
      let fractionalPart = '';

      if (decimalIndex !== -1) {
        integerPart = normalized.slice(0, decimalIndex);
        fractionalPart = normalized.slice(decimalIndex + 1);
      }

      integerPart = integerPart.replace(/[.,]/g, '');

      const sanitized = sign + integerPart + (fractionalPart ? `.${fractionalPart}` : '');

      if (!sanitized || sanitized === '-' || sanitized === '.' || sanitized === '-.') {
        return null;
      }

      const parsed = Number(sanitized);
      return Number.isFinite(parsed) ? parsed : null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function formatNumber(value, options) {
    if (!Number.isFinite(value)) return '0,00';
    const formatter = new Intl.NumberFormat('es-VE', Object.assign({
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }, options || {}));
    return formatter.format(value);
  }

  function formatCurrency(amount, currency) {
    const symbol = CURRENCY_SYMBOLS[(currency || '').toLowerCase()] || '$';
    return `${symbol} ${formatNumber(amount)}`;
  }

  function roundTo(value, decimals) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    const factor = Math.pow(10, Number.isFinite(decimals) ? Math.max(decimals, 0) : 2);
    return Math.round(numeric * factor) / factor;
  }

  function inferNameFromEmail(email) {
    if (typeof email !== 'string') return '';
    const trimmed = email.trim();
    if (!trimmed) return '';
    const base = trimmed.split('@')[0] || '';
    const normalized = base.replace(/[._-]+/g, ' ').trim();
    if (!normalized) return '';
    return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function formatDateTime(timestamp) {
    const date = timestamp ? new Date(timestamp) : new Date();
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return new Date().toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getStoredRates() {
    const rates = {
      usdToBs: null,
      usdToEur: null
    };

    const selectedRate = toNumber(localStorage.getItem('selectedRateValue'));
    if (Number.isFinite(selectedRate) && selectedRate > 0) {
      rates.usdToBs = selectedRate;
    }

    const sessionRateRaw = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('remeexSessionExchangeRate')) ||
      localStorage.getItem('remeexSessionExchangeRate');
    const parsedSession = safeParseJSON(sessionRateRaw);
    const numericSession = toNumber(sessionRateRaw);
    if (parsedSession && typeof parsedSession === 'object') {
      if (Number.isFinite(toNumber(parsedSession.USD_TO_BS)) && toNumber(parsedSession.USD_TO_BS) > 0) {
        rates.usdToBs = rates.usdToBs || toNumber(parsedSession.USD_TO_BS);
      }
      if (Number.isFinite(toNumber(parsedSession.USD_TO_EUR)) && toNumber(parsedSession.USD_TO_EUR) > 0) {
        rates.usdToEur = toNumber(parsedSession.USD_TO_EUR);
      }
    } else if (Number.isFinite(numericSession) && numericSession > 0) {
      rates.usdToBs = rates.usdToBs || numericSession;
    }

    const storedUsdToEur = toNumber(localStorage.getItem('selectedRateUsdToEur'));
    if (Number.isFinite(storedUsdToEur) && storedUsdToEur > 0) {
      rates.usdToEur = storedUsdToEur;
    }

    if (!Number.isFinite(rates.usdToBs) || rates.usdToBs <= 0) {
      rates.usdToBs = 36;
    }
    if (!Number.isFinite(rates.usdToEur) || rates.usdToEur <= 0) {
      rates.usdToEur = 0.93;
    }

    return rates;
  }

  function convertAmountToAll(amount, currency, rates) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return null;
    }
    const normalizedCurrency = (currency || 'usd').toLowerCase();
    let usdAmount = amount;
    if (normalizedCurrency === 'ves' || normalizedCurrency === 'bs') {
      usdAmount = rates.usdToBs > 0 ? amount / rates.usdToBs : null;
    } else if (normalizedCurrency === 'eur') {
      usdAmount = rates.usdToEur > 0 ? amount / rates.usdToEur : null;
    } else if (normalizedCurrency === 'usd' || normalizedCurrency === 'usdt') {
      usdAmount = amount;
    } else {
      usdAmount = amount;
    }

    if (!Number.isFinite(usdAmount) || usdAmount <= 0) {
      usdAmount = amount;
    }

    const bsAmount = rates.usdToBs * usdAmount;
    const eurAmount = rates.usdToEur * usdAmount;

    return {
      usd: usdAmount,
      bs: Number.isFinite(bsAmount) ? bsAmount : usdAmount * 36,
      eur: Number.isFinite(eurAmount) ? eurAmount : usdAmount * 0.93,
      usdt: usdAmount
    };
  }

  function loadBalanceState() {
    const stored = safeParseJSON(localStorage.getItem('remeexBalance')) ||
      safeParseJSON(typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_BALANCE_KEY) : null);
    if (stored && typeof stored === 'object') {
      return {
        usd: Number(stored.usd) || 0,
        bs: Number(stored.bs) || 0,
        eur: Number(stored.eur) || 0,
        usdt: Number(stored.usdt) || 0,
        deviceId: stored.deviceId || localStorage.getItem('remeexDeviceId') || ''
      };
    }
    return {
      usd: 0,
      bs: 0,
      eur: 0,
      usdt: 0,
      deviceId: localStorage.getItem('remeexDeviceId') || ''
    };
  }

  function saveBalanceState(balance) {
    if (!balance || typeof balance !== 'object') return balance;
    const payload = {
      usd: roundTo(balance.usd, 2),
      bs: roundTo(balance.bs, 2),
      eur: roundTo(balance.eur, 2),
      usdt: roundTo(balance.usdt, 2)
    };
    const deviceId = balance.deviceId || localStorage.getItem('remeexDeviceId') || '';
    if (deviceId) {
      payload.deviceId = deviceId;
    }
    safeSetLocalStorage('remeexBalance', JSON.stringify(payload));
    safeSetSessionStorage(SESSION_BALANCE_KEY, JSON.stringify(payload));
    return payload;
  }

  function loadExchangeHistoryList() {
    const stored = safeParseJSON(localStorage.getItem(EXCHANGE_HISTORY_KEY));
    return Array.isArray(stored) ? stored : [];
  }

  function saveExchangeHistoryList(list) {
    if (!Array.isArray(list)) return;
    safeSetLocalStorage(EXCHANGE_HISTORY_KEY, JSON.stringify(list));
  }

  function loadTransactionsList() {
    const stored = safeParseJSON(localStorage.getItem(TRANSACTIONS_KEY));
    if (Array.isArray(stored)) {
      return { list: stored, deviceId: null };
    }
    if (stored && typeof stored === 'object' && Array.isArray(stored.transactions)) {
      return { list: stored.transactions, deviceId: stored.deviceId || null };
    }
    return { list: [], deviceId: null };
  }

  function saveTransactionsList(list, deviceId) {
    if (!Array.isArray(list)) return;
    const payload = {
      transactions: list,
      deviceId: deviceId || localStorage.getItem('remeexDeviceId') || ''
    };
    safeSetLocalStorage(TRANSACTIONS_KEY, JSON.stringify(payload));
  }

  function dispatchRemoteTransferEvent(detail) {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    try {
      const event = new CustomEvent(REMOTE_TRANSFER_EVENT, { detail });
      window.dispatchEvent(event);
    } catch (error) {
      console.warn('[HomeVisaRemote] No se pudo despachar el evento de transferencia remota.', error);
    }
  }

  function buildTransferHistoryEntry(options) {
    const type = options.direction === 'send' ? 'send' : 'receive';
    const entry = {
      transferId: options.transferId,
      type,
      amount: roundTo(options.originalAmount, 2),
      currency: (options.originalCurrency || 'usd').toLowerCase(),
      note: options.note || '',
      status: options.status || 'completed',
      date: formatDateTime(options.createdAt)
    };
    if (type === 'send') {
      entry.toEmail = options.counterpartyEmail || '';
    } else {
      entry.fromEmail = options.counterpartyEmail || '';
    }
    if (options.counterpartyEmail) {
      entry.counterpartyEmail = options.counterpartyEmail;
    }
    if (options.counterpartyName) {
      entry.counterpartyName = options.counterpartyName;
    }
    return entry;
  }

  function buildTransferTransaction(options) {
    const type = options.direction === 'send' ? 'withdraw' : 'deposit';
    const descriptionBase = options.counterpartyName || inferNameFromEmail(options.counterpartyEmail);
    const description = type === 'withdraw'
      ? `Intercambio enviado a ${descriptionBase || options.counterpartyEmail || 'usuario'}`
      : `Intercambio recibido de ${descriptionBase || options.counterpartyEmail || 'usuario'}`;
    const record = {
      id: options.transferId,
      type,
      amount: roundTo(options.amounts.usd, 2),
      amountBs: roundTo(options.amounts.bs, 2),
      amountEur: roundTo(options.amounts.eur, 2),
      amountUsdt: roundTo(options.amounts.usdt, 2),
      date: formatDateTime(options.createdAt),
      description,
      status: options.status || 'completed',
      counterpartyEmail: options.counterpartyEmail || '',
      counterpartyName: options.counterpartyName || inferNameFromEmail(options.counterpartyEmail),
      remote: true,
      remoteCommandId: options.commandId || null,
      note: options.note || '',
      originalAmount: roundTo(options.originalAmount, 2),
      originalCurrency: (options.originalCurrency || 'usd').toLowerCase()
    };
    if (type === 'withdraw') {
      record.recipientEmail = options.counterpartyEmail || '';
    } else {
      record.senderEmail = options.counterpartyEmail || '';
    }
    return record;
  }

  function safeSetLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('[HomeVisaRemote] No se pudo guardar', key, error);
    }
  }

  function safeRemoveLocalStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('[HomeVisaRemote] No se pudo eliminar', key, error);
    }
  }

  function safeSetSessionStorage(key, value) {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn('[HomeVisaRemote] No se pudo guardar en sessionStorage', key, error);
    }
  }

  function safeRemoveSessionStorage(key) {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('[HomeVisaRemote] No se pudo eliminar de sessionStorage', key, error);
    }
  }

  function loadBlockState() {
    const stored = safeParseJSON(localStorage.getItem(BLOCK_STATE_KEY));
    if (!stored || typeof stored !== 'object') return null;
    return {
      active: stored.active !== false,
      type: stored.type || 'general',
      message: stored.message || '',
      title: stored.title || '',
      accent: stored.accent || '',
      timestamp: stored.timestamp || Date.now()
    };
  }

  function applyBlockState(state) {
    const apply = function () {
      const blockMsg = document.getElementById('balance-block-msg');
      if (blockMsg) {
        if (state && state.active) {
          const preset = BLOCK_MESSAGES[state.type] || BLOCK_MESSAGES.general;
          blockMsg.textContent = state.message || preset;
          blockMsg.style.display = 'block';
          blockMsg.dataset.remoteBlock = 'true';
        } else if (blockMsg.dataset.remoteBlock === 'true') {
          blockMsg.textContent = 'Saldo bloqueado temporalmente';
          blockMsg.style.display = '';
          delete blockMsg.dataset.remoteBlock;
        }
      }
      if (document.body) {
        document.body.classList.toggle('homevisa-remote-block', Boolean(state && state.active));
        if (state && state.active && state.type) {
          document.body.setAttribute('data-remote-block-type', state.type);
        } else {
          document.body.removeAttribute('data-remote-block-type');
        }
      }
    };

    onDomReady(apply);
  }

  function applyBalanceToDom(balance) {
    if (!balance || typeof balance !== 'object') return;
    const symbolEl = document.getElementById('main-currency-symbol');
    const valueEl = document.getElementById('main-balance-value');
    const usdEl = document.getElementById('usd-equivalent');
    const eurEl = document.getElementById('eur-equivalent');
    const usdtEl = document.getElementById('usdt-equivalent');

    if (symbolEl && valueEl) {
      const symbol = (symbolEl.textContent || '').trim();
      let amount = balance.usd;
      if (symbol === 'Bs') {
        amount = balance.bs;
      } else if (symbol === '€') {
        amount = balance.eur;
      }
      valueEl.textContent = Number.isFinite(amount) ? formatNumber(amount) : formatNumber(0);
    }

    if (usdEl) {
      usdEl.textContent = Number.isFinite(balance.usd)
        ? `≈ $${formatNumber(balance.usd)}`
        : '≈ $0.00';
    }

    if (eurEl) {
      eurEl.textContent = Number.isFinite(balance.eur)
        ? `≈ €${formatNumber(balance.eur)}`
        : '≈ €0.00';
    }

    if (usdtEl) {
      usdtEl.textContent = Number.isFinite(balance.usdt)
        ? `≈ ${formatNumber(balance.usdt, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
        : '≈ 0.00 USDT';
    }
  }

  function applyRateToDom(info) {
    const rateDisplay = document.getElementById('exchange-rate-display');
    if (!rateDisplay) return;
    const label = info.label || RATE_LABELS[info.key] || info.key || 'Tasa';
    const valueText = Number.isFinite(info.value) ? formatNumber(info.value) : '--';
    rateDisplay.textContent = `Tasa (${label}): ${valueText}`;
  }

  function ensureOverlayStyles() {
    if (document.getElementById(OVERLAY_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = OVERLAY_STYLE_ID;
    style.textContent = `
      .homevisa-remote-overlay {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(15, 23, 42, 0.78);
        backdrop-filter: blur(6px);
        z-index: 9999;
        padding: 1.5rem;
      }
      .homevisa-remote-overlay.is-visible {
        display: flex;
      }
      .homevisa-remote-overlay__card {
        position: relative;
        width: min(520px, 92vw);
        background: rgba(2, 6, 23, 0.92);
        border-radius: 20px;
        padding: 2.25rem 2rem 2rem;
        color: #e2e8f0;
        box-shadow: 0 30px 70px rgba(2, 6, 23, 0.65);
        border-top: 4px solid var(--remote-accent, #38bdf8);
      }
      .homevisa-remote-overlay__badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.75rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        font-weight: 700;
        color: #bae6fd;
      }
      .homevisa-remote-overlay__title {
        margin: 1rem 0 0.75rem;
        font-size: clamp(1.4rem, 4vw, 1.9rem);
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      .homevisa-remote-overlay__message {
        margin: 0 0 1.5rem;
        font-size: 1rem;
        line-height: 1.6;
        color: #cbd5f5;
      }
      .homevisa-remote-overlay__action {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        padding: 0.75rem 1.4rem;
        border-radius: 999px;
        background: linear-gradient(120deg, var(--remote-accent, #38bdf8), #2563eb);
        color: #0b1120;
        font-weight: 700;
        text-decoration: none;
        box-shadow: 0 18px 45px rgba(37, 99, 235, 0.45);
      }
      .homevisa-remote-overlay__close {
        position: absolute;
        top: 0.85rem;
        right: 0.9rem;
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 1.5rem;
        cursor: pointer;
      }
      body.homevisa-remote-overlay-open {
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureOverlayElement() {
    let overlay = document.getElementById(OVERLAY_ID);
    if (overlay) return overlay;
    ensureOverlayStyles();
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'homevisa-remote-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="homevisa-remote-overlay__card">
        <button type="button" class="homevisa-remote-overlay__close" aria-label="Cerrar mensaje">×</button>
        <div class="homevisa-remote-overlay__badge">Aviso HomeVisa</div>
        <h2 class="homevisa-remote-overlay__title"></h2>
        <p class="homevisa-remote-overlay__message"></p>
        <a href="#" class="homevisa-remote-overlay__action" style="display:none;">Entendido</a>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) {
        hideOverlay();
      }
    });
    const closeBtn = overlay.querySelector('.homevisa-remote-overlay__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        hideOverlay();
      });
    }

    return overlay;
  }

  function showOverlay(payload) {
    onDomReady(function () {
      const overlay = ensureOverlayElement();
      const card = overlay.querySelector('.homevisa-remote-overlay__card');
      const titleEl = overlay.querySelector('.homevisa-remote-overlay__title');
      const messageEl = overlay.querySelector('.homevisa-remote-overlay__message');
      const actionBtn = overlay.querySelector('.homevisa-remote-overlay__action');

      card.style.setProperty('--remote-accent', payload.accent || '#38bdf8');
      titleEl.textContent = payload.title || 'Mensaje importante';
      messageEl.textContent = payload.message || '';

      if (payload.button && payload.button.label) {
        actionBtn.textContent = payload.button.label;
        actionBtn.href = payload.button.href || '#';
        actionBtn.style.display = 'inline-flex';
      } else {
        actionBtn.textContent = 'Entendido';
        actionBtn.href = '#';
        actionBtn.style.display = payload.message ? 'inline-flex' : 'none';
      }

      overlay.classList.add('is-visible');
      document.body.classList.add('homevisa-remote-overlay-open');

      if (payload.autoCloseMs && Number.isFinite(payload.autoCloseMs)) {
        setTimeout(hideOverlay, Math.max(1200, payload.autoCloseMs));
      }
    });
    return true;
  }

  function hideOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
      overlay.classList.remove('is-visible');
    }
    if (document.body) {
      document.body.classList.remove('homevisa-remote-overlay-open');
    }
    return true;
  }

  function dispatchForcedValidationEvent(amount) {
    try {
      const target = typeof window !== 'undefined' ? window : document;
      if (!target || typeof CustomEvent !== 'function') return;
      const event = new CustomEvent('forcedValidationAmountChanged', { detail: { amount } });
      target.dispatchEvent(event);
    } catch (error) {
      console.warn('[HomeVisaRemote] No se pudo notificar el cambio de monto de validación.', error);
    }
  }

  function handleUpdateBalance(payload) {
    const current = safeParseJSON(localStorage.getItem('remeexBalance')) || {};
    const result = Object.assign({}, current);
    ['usd', 'bs', 'eur', 'usdt'].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        const numeric = toNumber(payload[field]);
        if (numeric !== null) {
          result[field] = numeric;
        }
      }
    });
    result.updatedAt = payload.timestamp || new Date().toISOString();
    safeSetLocalStorage('remeexBalance', JSON.stringify(result));
    safeSetSessionStorage('remeexSessionBalance', JSON.stringify(result));
    onDomReady(function () {
      applyBalanceToDom(result);
    });
    return true;
  }

  function handleUpdateRate(payload) {
    if (payload && typeof payload.key === 'string') {
      safeSetLocalStorage('selectedRate', payload.key);
    }
    if (payload && Object.prototype.hasOwnProperty.call(payload, 'value')) {
      const numeric = toNumber(payload.value);
      if (numeric !== null) {
        safeSetLocalStorage('selectedRateValue', String(numeric));
      } else {
        safeRemoveLocalStorage('selectedRateValue');
      }
    }
    if (payload && Object.prototype.hasOwnProperty.call(payload, 'usdToEur')) {
      const numeric = toNumber(payload.usdToEur);
      if (numeric !== null) {
        safeSetLocalStorage('selectedRateUsdToEur', String(numeric));
      } else {
        safeRemoveLocalStorage('selectedRateUsdToEur');
      }
    }

    onDomReady(function () {
      applyRateToDom({
        key: payload.key,
        value: toNumber(payload.value),
        label: payload.label
      });
    });
    return true;
  }

  function handleSetBlock(payload) {
    const active = payload && payload.active !== false;
    if (active) {
      const state = {
        active: true,
        type: payload.type || 'general',
        message: payload.message || BLOCK_MESSAGES[payload.type] || BLOCK_MESSAGES.general,
        title: payload.title || '',
        accent: payload.accent || '',
        timestamp: Date.now()
      };
      safeSetLocalStorage(BLOCK_STATE_KEY, JSON.stringify(state));
      applyBlockState(state);
    } else {
      safeRemoveLocalStorage(BLOCK_STATE_KEY);
      applyBlockState(null);
    }
    return true;
  }

  function handleWipeAccount(payload) {
    const keys = Array.isArray(payload && payload.keys) && payload.keys.length
      ? payload.keys
      : ACCOUNT_STORAGE_KEYS;
    keys.forEach((key) => {
      safeRemoveLocalStorage(key);
      safeRemoveSessionStorage(key);
    });
    applyBlockState(null);
    hideOverlay();
    return true;
  }

  function handleSetValidationAmount(payload) {
    const hasAmount = payload && Object.prototype.hasOwnProperty.call(payload, 'amount');
    const numeric = hasAmount ? toNumber(payload.amount) : null;
    if (Number.isFinite(numeric) && numeric > 0) {
      safeSetLocalStorage('forcedValidationAmountUsd', String(numeric));
      if (typeof window.setForcedValidationAmount === 'function') {
        window.setForcedValidationAmount(numeric);
      } else {
        dispatchForcedValidationEvent(numeric);
      }
    } else {
      safeRemoveLocalStorage('forcedValidationAmountUsd');
      if (typeof window.setForcedValidationAmount === 'function') {
        window.setForcedValidationAmount(null);
      } else {
        dispatchForcedValidationEvent(null);
      }
    }
    return true;
  }

  function handleSendFunds(payload, command) {
    const data = payload && typeof payload === 'object' ? payload : {};
    const rawDirection = typeof data.direction === 'string' ? data.direction.toLowerCase() : 'receive';
    const direction = rawDirection === 'send' || rawDirection === 'outgoing' ? 'send' : 'receive';
    const amount = toNumber(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return true;
    }

    const originalCurrency = (data.currency || 'usd').toLowerCase();
    const rates = getStoredRates();
    const convertedAmounts = convertAmountToAll(amount, originalCurrency, rates);
    if (!convertedAmounts) {
      return false;
    }

    const transferId = data.transferId || command?.id || `remote-${Date.now().toString(16)}`;
    const counterpartyEmail = typeof data.counterpartyEmail === 'string'
      ? data.counterpartyEmail.trim().toLowerCase()
      : '';
    const counterpartyName = data.counterpartyName || inferNameFromEmail(counterpartyEmail);
    const note = data.note || data.description || '';
    const status = data.status || 'completed';
    const createdAt = data.createdAt || command?.createdAt || new Date().toISOString();

    const balanceState = loadBalanceState();
    const delta = direction === 'send' ? -1 : 1;
    const updatedBalance = {
      usd: (Number(balanceState.usd) || 0) + delta * convertedAmounts.usd,
      bs: (Number(balanceState.bs) || 0) + delta * convertedAmounts.bs,
      eur: (Number(balanceState.eur) || 0) + delta * convertedAmounts.eur,
      usdt: (Number(balanceState.usdt) || 0) + delta * convertedAmounts.usdt,
      deviceId: balanceState.deviceId || localStorage.getItem('remeexDeviceId') || ''
    };
    const savedBalance = saveBalanceState(updatedBalance);
    onDomReady(function () {
      applyBalanceToDom(savedBalance);
    });

    const historyEntry = buildTransferHistoryEntry({
      transferId,
      direction,
      originalAmount: amount,
      originalCurrency,
      counterpartyEmail,
      counterpartyName,
      note,
      status,
      createdAt
    });

    const historyList = loadExchangeHistoryList();
    const historyIndex = historyList.findIndex((entry) => entry && entry.transferId === transferId);
    if (historyIndex >= 0) {
      historyList[historyIndex] = Object.assign({}, historyList[historyIndex], historyEntry);
    } else {
      historyList.unshift(historyEntry);
      while (historyList.length > 120) {
        historyList.pop();
      }
    }
    saveExchangeHistoryList(historyList);

    const transactionsState = loadTransactionsList();
    const transactionRecord = buildTransferTransaction({
      transferId,
      direction,
      amounts: convertedAmounts,
      counterpartyEmail,
      counterpartyName,
      note,
      status,
      createdAt,
      commandId: command?.id || null,
      originalAmount: amount,
      originalCurrency
    });
    const existingTransactionIndex = transactionsState.list.findIndex((tx) => {
      if (!tx || typeof tx !== 'object') return false;
      if (command && command.id && tx.remoteCommandId) {
        return tx.remoteCommandId === command.id;
      }
      return tx.id === transferId;
    });
    if (existingTransactionIndex >= 0) {
      transactionsState.list[existingTransactionIndex] = Object.assign({}, transactionsState.list[existingTransactionIndex], transactionRecord);
    } else {
      transactionsState.list.unshift(transactionRecord);
      while (transactionsState.list.length > 150) {
        transactionsState.list.pop();
      }
    }
    saveTransactionsList(transactionsState.list, transactionsState.deviceId);

    dispatchRemoteTransferEvent({
      commandId: command?.id || null,
      transferId,
      direction,
      originalAmount: amount,
      originalCurrency,
      counterpartyEmail,
      counterpartyName,
      note,
      status,
      createdAt,
      amounts: convertedAmounts,
      balance: savedBalance,
      historyEntry,
      transaction: transactionRecord
    });

    return true;
  }

  function executeCommand(command) {
    if (!command || typeof command !== 'object') {
      return true;
    }
    try {
      switch (command.type) {
        case 'update-balance':
          return handleUpdateBalance(command.payload || {});
        case 'update-rate':
          return handleUpdateRate(command.payload || {});
        case 'set-block':
          return handleSetBlock(command.payload || {});
        case 'wipe-account':
          return handleWipeAccount(command.payload || {});
        case 'set-validation-amount':
          return handleSetValidationAmount(command.payload || {});
        case 'show-overlay':
          return showOverlay(command.payload || {});
        case 'hide-overlay':
          return hideOverlay();
        case 'send-funds':
          return handleSendFunds(command.payload || {}, command);
        default:
          console.warn('[HomeVisaRemote] Acción remota desconocida:', command.type);
          return true;
      }
    } catch (error) {
      console.warn('[HomeVisaRemote] Error ejecutando acción remota', command.type, error);
      return false;
    }
  }

  function processQueue() {
    if (processing) return;
    processing = true;
    try {
      const queue = loadQueue();
      if (!queue.length) {
        return;
      }
      const pending = [];
      let changed = false;
      queue.forEach((command) => {
        if (!command || typeof command !== 'object' || !command.id) {
          changed = true;
          return;
        }
        if (processedIds.has(command.id)) {
          changed = true;
          return;
        }
        const executed = executeCommand(command);
        if (executed) {
          processedIds.add(command.id);
          changed = true;
        } else {
          pending.push(command);
        }
      });
      if (changed) {
        saveProcessedSet();
        saveQueue(pending);
      }
    } finally {
      processing = false;
    }
  }

  function init() {
    processedIds = new Set(loadProcessedList());
    onDomReady(function () {
      applyBlockState(loadBlockState());
    });
    processQueue();
  }

  window.addEventListener('storage', function (event) {
    if (event.key === COMMAND_KEY) {
      processQueue();
    }
    if (event.key === BLOCK_STATE_KEY) {
      onDomReady(function () {
        applyBlockState(loadBlockState());
      });
    }
  });

  if (domReady) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
