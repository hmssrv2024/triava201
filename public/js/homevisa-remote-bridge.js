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
