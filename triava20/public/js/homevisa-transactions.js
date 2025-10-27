(function () {
  'use strict';

  const SAFE_DEFAULTS = {
    USD_TO_BS: 150,
    USD_TO_EUR: 0.94
  };

  const STATUS_LABELS = {
    pending: '<i class="fas fa-clock"></i> Pendiente',
    rejected: '<i class="fas fa-times"></i> Rechazado',
    cancelled: '<i class="fas fa-ban"></i> Cancelado',
    completed: '<i class="fas fa-check"></i> Completado',
    pending_verification: '<i class="fas fa-user-check"></i> Esperando verificación',
    processing: '<i class="fas fa-sync-alt"></i> Procesando',
    pending_refund: '<i class="fas fa-undo"></i> Reintegro pendiente'
  };

  const EXCHANGE_DIRECTORY_STORAGE_KEY = 'remeexExchangeDirectory';

  const FILTER_HANDLERS = {
    sent: (tx) => (tx.type || '').toLowerCase() === 'withdraw',
    received: (tx) => (tx.type || '').toLowerCase() === 'deposit',
    savings: (tx) => (tx.description || '').toLowerCase().includes('ahorro'),
    exchange: (tx) => (tx.description || '').toLowerCase().includes('intercambio'),
    services: (tx) => (tx.description || '').toLowerCase().includes('servicio')
  };

  function getGlobalExchangeDirectory() {
    const source = typeof window.REMEEX_EXCHANGE_USERS === 'object' && window.REMEEX_EXCHANGE_USERS;
    return source && !Array.isArray(source) ? source : null;
  }

  function loadExchangeDirectoryFromStorage() {
    try {
      const raw = localStorage.getItem(EXCHANGE_DIRECTORY_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
      return parsed;
    } catch (error) {
      console.warn('[HomeVisa] No se pudo cargar el directorio de intercambio desde almacenamiento', error);
      return null;
    }
  }

  function mergeDirectorySources(sources) {
    const merged = {};
    if (!Array.isArray(sources)) return merged;
    sources.forEach((source) => {
      if (!source || typeof source !== 'object') return;
      Object.entries(source).forEach(([email, detail]) => {
        if (!email) return;
        const normalizedDetail = detail && typeof detail === 'object' && !Array.isArray(detail) ? detail : {};
        merged[email] = Object.assign({}, merged[email] || {}, normalizedDetail);
      });
    });
    return merged;
  }

  function normalizeKey(value) {
    if (typeof value !== 'string') return '';
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function computeInitials(name, fallback = '') {
    if (typeof name !== 'string' || !name.trim()) {
      return fallback ? String(fallback).trim().toUpperCase().slice(0, 2) : '';
    }
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return fallback ? String(fallback).trim().toUpperCase().slice(0, 2) : '';
    }
    const first = parts[0].charAt(0);
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : parts[0].charAt(1) || '';
    const letters = (first + last).toUpperCase();
    return letters || (fallback ? String(fallback).trim().toUpperCase().slice(0, 2) : '');
  }

  function generateAvatarGradient(seed) {
    const input = typeof seed === 'string' && seed.trim() ? seed.trim() : 'remeex';
    let hash = 0;
    for (let index = 0; index < input.length; index += 1) {
      hash = (hash << 5) - hash + input.charCodeAt(index);
      hash |= 0; // Convert to 32bit integer
    }
    const hue = Math.abs(hash) % 360;
    const secondaryHue = (hue + 45) % 360;
    return `linear-gradient(135deg, hsl(${hue}, 72%, 62%), hsl(${secondaryHue}, 82%, 54%))`;
  }

  function normalizeAvatarSource(value) {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    return trimmed || '';
  }

  function escapeHTML(value) {
    if (value == null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') {
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    }
    const cleaned = value
      .replace(/[^0-9,.-]/g, '')
      .replace(/(,)(?=[0-9]{3}\b)/g, '')
      .replace(',', '.');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  }

  function formatCurrency(amount, currency) {
    const value = Number.isFinite(amount) ? amount : 0;
    if (currency === 'bs') {
      return 'Bs ' + value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (currency === 'eur') {
      return '€' + value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function normalizeCurrencyCode(currency, fallback = 'usd') {
    if (!currency) return fallback;
    const code = String(currency).trim().toLowerCase();
    if (!code) return fallback;

    if (['ves', 'vef', 'bs', 'bs.', 'bsf', 'bolivar', 'bolívares', 'bolivares'].includes(code)) {
      return 'bs';
    }
    if (['eur', 'euro', '€'].includes(code)) {
      return 'eur';
    }
    if (['usd', 'dolar', 'dólar', 'dolares', 'dólares', '$'].includes(code)) {
      return 'usd';
    }
    return fallback;
  }

  function formatDisplayDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const datePart = date.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const timePart = date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} ${timePart}`;
  }

  function getSafeRate(value, fallback) {
    const num = toNumber(value);
    return num > 0 ? num : fallback;
  }

  function getBankLogoSafe(bankId) {
    if (!bankId) return '';
    try {
      if (typeof window.getBankLogo === 'function') {
        return window.getBankLogo(bankId) || '';
      }
    } catch (error) {
      console.error('[HomeVisa] Error obteniendo logo de banco', error);
    }
    return '';
  }

  function sortTransactionsList(list) {
    if (!Array.isArray(list)) return list;
    return list.sort((a, b) => (b && b.timestamp ? b.timestamp : 0) - (a && a.timestamp ? a.timestamp : 0));
  }

  function getTransactionIdentifiers(transaction) {
    if (!transaction) return [];
    const identifiers = [];
    if (transaction.reference != null) identifiers.push(String(transaction.reference));
    if (transaction.id != null) identifiers.push(String(transaction.id));
    return identifiers;
  }

  function findTransactionIndexByIdentifiers(identifiers, transactions) {
    const list = Array.isArray(transactions) ? transactions : [];
    const ids = Array.isArray(identifiers) ? identifiers.filter(Boolean) : [];
    if (!ids.length) return -1;
    return list.findIndex((item) => {
      const itemIds = getTransactionIdentifiers(item);
      return itemIds.some((value) => ids.includes(value));
    });
  }

  function stableStringify(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    const type = typeof value;
    if (type !== 'object') {
      try {
        return JSON.stringify(value);
      } catch (error) {
        return String(value);
      }
    }
    if (Array.isArray(value)) {
      return '[' + value.map((entry) => stableStringify(entry)).join(',') + ']';
    }
    const keys = Object.keys(value).filter((key) => typeof value[key] !== 'function').sort();
    return '{' + keys.map((key) => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
  }

  function areTransactionsEqual(a, b) {
    return stableStringify(a) === stableStringify(b);
  }

  function areTransactionListsEqual(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let index = 0; index < a.length; index += 1) {
      if (!areTransactionsEqual(a[index], b[index])) return false;
    }
    return true;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const transactionsContainer = document.getElementById('recent-transactions');
    if (!transactionsContainer) return;

    const filterSelect = document.getElementById('transaction-filter');

    const config = window.CONFIG || {};
    const storageKeys = config.STORAGE_KEYS || {};
    const transactionsKey = storageKeys.TRANSACTIONS || 'remeexTransactions';
    const deviceKey = storageKeys.DEVICE_ID || 'remeexDeviceId';
    const transferDataKey = storageKeys.TRANSFER_DATA || 'remeexTransferData';
    const cardRechargeBackupKey = storageKeys.CARD_RECHARGE_BACKUP || 'remeexCardRechargeBackup';
    const pendingKey = 'remeexPendingTransactions';
    const frequentUsersKey = storageKeys.FREQUENT_USERS || 'remeexFrequentUsers';

    const usdToBs = getSafeRate(config.EXCHANGE_RATES && config.EXCHANGE_RATES.USD_TO_BS, SAFE_DEFAULTS.USD_TO_BS);
    const usdToEur = getSafeRate(config.EXCHANGE_RATES && config.EXCHANGE_RATES.USD_TO_EUR, SAFE_DEFAULTS.USD_TO_EUR);

    const state = loadStoredTransactions(transactionsKey, deviceKey);
    let activeFilter = (filterSelect && filterSelect.value) || 'all';
    const displayedRefs = new Set();
    let userDirectoryIndex = Object.create(null);
    let frequentUserIndex = buildFrequentUserIndex();
    let cachedUserProfile = null;
    let isMergingCardBackup = false;

    function refreshUserDirectoryIndex() {
      const combinedDirectory = mergeDirectorySources([
        config.USER_DETAILS || null,
        loadExchangeDirectoryFromStorage(),
        getGlobalExchangeDirectory()
      ]);
      userDirectoryIndex = buildUserDirectoryIndex(combinedDirectory);
    }

    refreshUserDirectoryIndex();

    const legacyAddTransaction = typeof window.addTransaction === 'function' ? window.addTransaction.bind(window) : null;
    const legacyUpdateRecentTransactions = typeof window.updateRecentTransactions === 'function'
      ? window.updateRecentTransactions.bind(window)
      : null;
    const legacySaveTransactionsData = typeof window.saveTransactionsData === 'function'
      ? window.saveTransactionsData.bind(window)
      : null;

    if (!state.deviceId) {
      const storedDeviceId = (window.currentUser && window.currentUser.deviceId) || localStorage.getItem(deviceKey);
      if (storedDeviceId) state.deviceId = storedDeviceId;
    }

    const mergedFromCardBackup = mergeCardRechargeBackup();
    if (mergedFromCardBackup) {
      sortTransactions();
      persistTransactions();
    }

    const mergedFromCurrentUser = mergeCurrentUserTransactions();
    if (mergedFromCurrentUser) {
      sortTransactions();
      persistTransactions();
    } else {
      syncCurrentUser();
    }

    const importedFromTransfer = importTransferData();
    const importedPending = importPendingTransactions();
    if (importedFromTransfer || importedPending) {
      sortTransactions();
      persistTransactions();
    }

    render();

    if (filterSelect) {
      filterSelect.addEventListener('change', function (event) {
        activeFilter = event.target.value;
        render();
      });
    }

    setupLegacyIntegration({
      legacyAddTransaction,
      legacyUpdateRecentTransactions,
      legacySaveTransactionsData
    });

    window.addEventListener('storage', handleStorageChange);

    function loadStoredTransactions(key, deviceKeyName) {
      const parseData = (raw) => {
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch (error) {
          console.error('[HomeVisa] No se pudo analizar el historial de transacciones', error);
          return null;
        }
      };

      const localData = parseData(localStorage.getItem(key));
      const sessionData = parseData(sessionStorage.getItem(key));
      const deviceId = localStorage.getItem(deviceKeyName) || sessionStorage.getItem(deviceKeyName) || null;
      let transactions = [];
      let storedDeviceId = deviceId;

      const source = Array.isArray(localData)
        ? localData
        : localData && Array.isArray(localData.transactions)
          ? localData.transactions
          : null;
      const fallback = Array.isArray(sessionData)
        ? sessionData
        : sessionData && Array.isArray(sessionData.transactions)
          ? sessionData.transactions
          : null;
      const base = source || fallback;

      if (base) {
        transactions = base.map((item) => normalizeTransaction(item)).filter(Boolean);
        sortTransactionsList(transactions);
        if (!storedDeviceId && localData && localData.deviceId) storedDeviceId = localData.deviceId;
        if (!storedDeviceId && sessionData && sessionData.deviceId) storedDeviceId = sessionData.deviceId;
      }

      return {
        transactions,
        deviceId: storedDeviceId
      };
    }

    function loadCardRechargeBackupEntries() {
      try {
        const raw = localStorage.getItem(cardRechargeBackupKey);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.transactions)) return parsed.transactions;
      } catch (error) {
        console.warn('[HomeVisa] No se pudo cargar el respaldo de recargas con tarjeta', error);
      }
      return [];
    }

    function persistCardRechargeBackup(entries) {
      if (!Array.isArray(entries)) return;
      const trimmed = entries.slice(0, 50);
      try {
        localStorage.setItem(cardRechargeBackupKey, JSON.stringify(trimmed));
      } catch (error) {
        console.error('[HomeVisa] No se pudo guardar el respaldo de recargas con tarjeta', error);
      }
    }

    function isCardRecharge(transaction) {
      if (!transaction) return false;
      const type = (transaction.type || '').toLowerCase();
      if (type && type !== 'deposit') return false;
      const method = (transaction.method || '').toLowerCase();
      if (method.includes('card') || method.includes('tarjeta')) return true;
      if (transaction.card) return true;
      const description = (transaction.description || '').toLowerCase();
      return description.includes('tarjeta');
    }

    function normalizeForCardBackup(transaction) {
      if (!transaction) return null;
      return {
        id: transaction.id || null,
        reference: transaction.reference || null,
        type: (transaction.type || 'deposit').toLowerCase(),
        status: transaction.status || 'completed',
        description: transaction.description || 'Recarga con tarjeta',
        amount: Number.isFinite(transaction.amount) ? transaction.amount : toNumber(transaction.amount),
        amountBs: Number.isFinite(transaction.amountBs) ? transaction.amountBs : toNumber(transaction.amountBs),
        amountEur: Number.isFinite(transaction.amountEur) ? transaction.amountEur : toNumber(transaction.amountEur),
        displayAmount: Number.isFinite(transaction.displayAmount)
          ? transaction.displayAmount
          : toNumber(transaction.displayAmount),
        displayCurrency: normalizeCurrencyCode(
          transaction.displayCurrency || transaction.originalCurrency || transaction.currency,
          'usd'
        ),
        originalAmount: Number.isFinite(transaction.originalAmount)
          ? transaction.originalAmount
          : toNumber(transaction.originalAmount),
        originalCurrency: normalizeCurrencyCode(transaction.originalCurrency || transaction.currency, 'usd'),
        timestamp: Number.isFinite(transaction.timestamp) ? transaction.timestamp : Date.now(),
        rawDate: transaction.rawDate || null,
        date: transaction.date || null,
        card: transaction.card || '',
        cardAmount: Number.isFinite(transaction.cardAmount) ? transaction.cardAmount : toNumber(transaction.cardAmount),
        method: transaction.method || '',
        bankName: transaction.bankName || '',
        bankLogo: transaction.bankLogo || '',
        destination: transaction.destination || ''
      };
    }

    function upsertCardRechargeBackup(transaction) {
      if (!isCardRecharge(transaction)) return;
      const prepared = normalizeForCardBackup(transaction);
      if (!prepared) return;

      const list = loadCardRechargeBackupEntries();
      const identifiers = getTransactionIdentifiers(prepared);
      let index = findTransactionIndexByIdentifiers(identifiers, list);
      if (index < 0 && Number.isFinite(prepared.timestamp)) {
        index = list.findIndex((entry) => {
          if (!entry) return false;
          const sameTimestamp = Number.isFinite(entry.timestamp) && entry.timestamp === prepared.timestamp;
          if (!sameTimestamp) return false;
          const sameAmount = Number.isFinite(entry.amount) && Number.isFinite(prepared.amount)
            ? entry.amount === prepared.amount
            : false;
          return sameAmount;
        });
      }

      if (index >= 0) {
        list[index] = Object.assign({}, list[index], prepared);
      } else {
        list.push(prepared);
        sortTransactionsList(list);
      }

      if (list.length > 50) {
        list.length = 50;
      }

      persistCardRechargeBackup(list);
    }

    function mergeCardRechargeBackup() {
      const backupEntries = loadCardRechargeBackupEntries();
      if (!backupEntries.length) return false;
      let changed = false;
      isMergingCardBackup = true;
      backupEntries.forEach((entry) => {
        if (registerTransaction(entry)) {
          changed = true;
        }
      });
      isMergingCardBackup = false;
      return changed;
    }

    function syncCardBackupFromState() {
      const cardEntries = state.transactions.filter((entry) => isCardRecharge(entry)).map((entry) => normalizeForCardBackup(entry));
      const sanitized = cardEntries.filter(Boolean);
      if (!sanitized.length) {
        try {
          localStorage.removeItem(cardRechargeBackupKey);
        } catch (error) {
          console.warn('[HomeVisa] No se pudo limpiar el respaldo de recargas con tarjeta', error);
        }
        return;
      }
      persistCardRechargeBackup(sanitized);
    }

    function normalizeTransaction(tx) {
      if (!tx) return null;
      const transaction = Object.assign({}, tx);
      transaction.id = transaction.id || transaction.reference || `tx-${Date.now()}`;
      transaction.reference = transaction.reference || transaction.id;
      transaction.type = String(transaction.type || 'withdraw').toLowerCase();
      transaction.status = transaction.status ? String(transaction.status).toLowerCase() : 'pending';
      transaction.description = transaction.description || (transaction.type === 'deposit' ? 'Recarga Remeex' : 'Retiro Remeex');
      transaction.amount = toNumber(transaction.amount);
      if (transaction.amountBs != null) transaction.amountBs = toNumber(transaction.amountBs);
      if (transaction.amountEur != null) transaction.amountEur = toNumber(transaction.amountEur);
      transaction.destination = transaction.destination || '';
      transaction.bankName = transaction.bankName || '';
      transaction.bankLogo = transaction.bankLogo || getBankLogoSafe(transaction.bankId);
      transaction.method = transaction.method ? String(transaction.method).toLowerCase() : '';

      const explicitCurrency = normalizeCurrencyCode(
        transaction.displayCurrency || transaction.originalCurrency || transaction.currency || transaction.amountCurrency,
        transaction.type === 'withdraw' && transaction.method && transaction.method !== 'international' ? 'bs' : 'usd'
      );

      let displayAmount = transaction.displayAmount != null ? toNumber(transaction.displayAmount) : null;
      if (!Number.isFinite(displayAmount) && transaction.originalAmount != null) {
        displayAmount = toNumber(transaction.originalAmount);
      }

      if (!Number.isFinite(displayAmount)) {
        if (explicitCurrency === 'bs' && transaction.amountBs != null) {
          displayAmount = transaction.amountBs;
        } else if (explicitCurrency === 'eur' && transaction.amountEur != null) {
          displayAmount = transaction.amountEur;
        } else if (transaction.amount != null) {
          displayAmount = transaction.amount;
        } else {
          displayAmount = 0;
        }
      }

      transaction.displayCurrency = explicitCurrency;
      transaction.displayAmount = toNumber(displayAmount);

      const hasOriginalAmount = Object.prototype.hasOwnProperty.call(transaction, 'originalAmount') && transaction.originalAmount != null;
      const normalizedOriginalAmount = hasOriginalAmount ? toNumber(transaction.originalAmount) : null;

      transaction.originalCurrency = normalizeCurrencyCode(transaction.originalCurrency || explicitCurrency, explicitCurrency);
      transaction.originalAmount = Number.isFinite(normalizedOriginalAmount)
        ? normalizedOriginalAmount
        : transaction.displayAmount;

      const timestamp = typeof transaction.timestamp === 'number' && Number.isFinite(transaction.timestamp)
        ? transaction.timestamp
        : Date.parse(transaction.rawDate || transaction.date) || Date.now();

      transaction.timestamp = timestamp;
      if (!transaction.rawDate) transaction.rawDate = new Date(timestamp).toISOString();
      if (!transaction.date) transaction.date = formatDisplayDate(new Date(timestamp));

      return transaction;
    }

    function hasTransaction(reference) {
      if (!reference) return false;
      if (typeof reference === 'object') {
        return findTransactionIndexByIdentifiers(getTransactionIdentifiers(reference), state.transactions) >= 0;
      }
      return findTransactionIndexByIdentifiers([String(reference)], state.transactions) >= 0;
    }

    function registerTransaction(tx) {
      const normalized = normalizeTransaction(tx);
      if (!normalized) return false;
      const identifiers = getTransactionIdentifiers(normalized);
      const existingIndex = findTransactionIndexByIdentifiers(identifiers, state.transactions);
      if (existingIndex >= 0) {
        const existing = state.transactions[existingIndex];
        if (areTransactionsEqual(existing, normalized)) return false;
        state.transactions[existingIndex] = normalized;
        if (!isMergingCardBackup) {
          upsertCardRechargeBackup(normalized);
        }
        return true;
      }
      state.transactions.push(normalized);
      if (!isMergingCardBackup) {
        upsertCardRechargeBackup(normalized);
      }
      return true;
    }

    function importPendingTransactions() {
      const raw = sessionStorage.getItem(pendingKey);
      if (!raw) return false;
      let changed = false;
      try {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((entry) => {
            const prepared = preparePendingTransaction(entry);
            if (prepared && registerTransaction(prepared)) {
              changed = true;
            }
          });
        }
      } catch (error) {
        console.error('[HomeVisa] No se pudieron procesar retiros pendientes', error);
      }
      sessionStorage.removeItem(pendingKey);
      if (changed) syncCurrentUser();
      return changed;
    }

    function importTransferData() {
      const raw = sessionStorage.getItem(transferDataKey);
      if (!raw) return false;
      let changed = false;
      try {
        const data = JSON.parse(raw);
        if (data && (data.amount || data.originalAmount || data.displayAmount)) {
          let reference = data.id || data.reference;

          if (!reference) {
            try {
              const pendingRaw = sessionStorage.getItem(pendingKey);
              if (pendingRaw) {
                const pendingList = JSON.parse(pendingRaw);
                if (Array.isArray(pendingList)) {
                  const match = pendingList.find((entry) => entry && (entry.id || entry.reference));
                  if (match) {
                    reference = match.id || match.reference;
                  }
                }
              }
            } catch (error) {
              console.error('[HomeVisa] Error al sincronizar referencia de transferencia', error);
            }
          }

          const prepared = preparePendingTransaction({
            id: reference,
            reference,
            amount: data.amount != null ? data.amount : data.originalAmount != null ? data.originalAmount : data.displayAmount,
            bankName: data.bankName || data.bancoDestino,
            bankLogo: data.bankLogo,
            destination: data.destination || data.bancoDestino,
            method: data.method || (data.bankName ? 'bank' : 'mobile'),
            status: data.status || 'pending',
            date: data.date,
            rawDate: data.rawDate,
            formattedDate: data.formattedDate
          });
          if (prepared && registerTransaction(prepared)) {
            changed = true;
          }
        }
      } catch (error) {
        console.error('[HomeVisa] Error al importar datos de transferencia', error);
      }
      sessionStorage.removeItem(transferDataKey);
      if (changed) syncCurrentUser();
      return changed;
    }

    function preparePendingTransaction(entry) {
      if (!entry) return null;
      const reference = entry.id || entry.reference || `RET-${Date.now()}`;
      const method = entry.method || '';
      const bankName = entry.bankName || '';
      const destination = entry.destination || '';
      const rawAmount = toNumber(entry.amount);
      const timestamp = typeof entry.timestamp === 'number' && Number.isFinite(entry.timestamp)
        ? entry.timestamp
        : Date.parse(entry.date || entry.rawDate || entry.formattedDate) || Date.now();

      const amountUsd = method === 'international' ? rawAmount : rawAmount / usdToBs;
      const amountBs = method === 'international' ? amountUsd * usdToBs : rawAmount;
      const amountEur = amountUsd * usdToEur;

      let description = entry.description || 'Retiro Remeex';
      if (!entry.description) {
        if (method === 'mobile') {
          description = 'Retiro a Pago Móvil';
        } else if (method === 'bank') {
          description = `Retiro a ${bankName || 'Banco'}`;
        } else if (method === 'international') {
          description = `Retiro Internacional${bankName ? ' - ' + bankName : ''}`;
        }
      }

      return {
        id: reference,
        reference,
        type: 'withdraw',
        status: entry.status || 'pending',
        method,
        description,
        amount: amountUsd,
        amountBs,
        amountEur,
        originalAmount: rawAmount,
        originalCurrency: method === 'international' ? 'usd' : 'bs',
        displayAmount: method === 'international' ? amountUsd : amountBs,
        displayCurrency: method === 'international' ? 'usd' : 'bs',
        destination,
        bankName,
        bankLogo: entry.bankLogo || getBankLogoSafe(entry.bankId),
        timestamp,
        rawDate: entry.date || entry.rawDate || new Date(timestamp).toISOString(),
        date: entry.formattedDate || formatDisplayDate(new Date(timestamp))
      };
    }

    function sortTransactions() {
      sortTransactionsList(state.transactions);
    }

    function syncCurrentUser() {
      if (!window.currentUser) window.currentUser = {};
      if (!Array.isArray(window.currentUser.transactions)) {
        window.currentUser.transactions = [];
      }
      window.currentUser.transactions = state.transactions.slice();
      if (state.deviceId && (!window.currentUser.deviceId || window.currentUser.deviceId !== state.deviceId)) {
        window.currentUser.deviceId = state.deviceId;
      }
    }

    function persistTransactions() {
      const currentDeviceId =
        state.deviceId ||
        (window.currentUser && window.currentUser.deviceId) ||
        localStorage.getItem(deviceKey) ||
        sessionStorage.getItem(deviceKey) ||
        null;

      if (currentDeviceId && state.deviceId !== currentDeviceId) {
        state.deviceId = currentDeviceId;
      }

      const payload = JSON.stringify({
        transactions: state.transactions,
        deviceId: state.deviceId || null
      });
      try {
        localStorage.setItem(transactionsKey, payload);
      } catch (error) {
        console.error('[HomeVisa] No se pudieron guardar las transacciones en localStorage', error);
      }
      try {
        sessionStorage.setItem(transactionsKey, payload);
      } catch (error) {
        console.error('[HomeVisa] No se pudieron guardar las transacciones en sessionStorage', error);
      }
      syncCurrentUser();
      syncCardBackupFromState();
    }

    function mergeCurrentUserTransactions() {
      if (!window.currentUser || !Array.isArray(window.currentUser.transactions)) return false;
      let changed = false;
      window.currentUser.transactions.forEach((transaction) => {
        if (registerTransaction(transaction)) {
          changed = true;
        }
      });
      return changed;
    }

    function syncFromCurrentUser(options = {}) {
      if (!window.currentUser || !Array.isArray(window.currentUser.transactions)) return false;
      const normalized = window.currentUser.transactions.map((entry) => normalizeTransaction(entry)).filter(Boolean);
      sortTransactionsList(normalized);

      const currentSorted = sortTransactionsList(state.transactions.slice());
      const changed = !areTransactionListsEqual(currentSorted, normalized);
      const shouldPersist = options.persist !== false;

      if (window.currentUser.deviceId && state.deviceId !== window.currentUser.deviceId) {
        state.deviceId = window.currentUser.deviceId;
      }

      if (changed) {
        state.transactions = normalized;
        if (shouldPersist) {
          persistTransactions();
        } else {
          syncCurrentUser();
        }
      } else if (shouldPersist && options.forcePersist) {
        persistTransactions();
      } else if (!shouldPersist) {
        syncCurrentUser();
      }

      return changed;
    }

    function applyTransactionsFromPayload(payload, options = {}) {
      if (!payload) return false;
      const entries = Array.isArray(payload) ? payload : payload.transactions;
      if (!Array.isArray(entries)) return false;

      const normalized = entries.map((item) => normalizeTransaction(item)).filter(Boolean);
      sortTransactionsList(normalized);

      if (payload.deviceId && state.deviceId !== payload.deviceId) {
        state.deviceId = payload.deviceId;
      }

      const currentSorted = sortTransactionsList(state.transactions.slice());
      const changed = !areTransactionListsEqual(currentSorted, normalized);

      if (changed) {
        state.transactions = normalized;
        syncCurrentUser();
        syncCardBackupFromState();
        if (options.render !== false) {
          render();
        }
      } else if (options.forceRender) {
        render();
      } else {
        syncCurrentUser();
      }

      return changed;
    }

    function handleStorageChange(event) {
      if (!event) return;

      if (event.key === transactionsKey) {
        if (!event.newValue) {
          applyTransactionsFromPayload({ transactions: [] }, { render: true, forceRender: true });
          return;
        }
        try {
          const parsed = JSON.parse(event.newValue);
          applyTransactionsFromPayload(parsed, { render: true });
        } catch (error) {
          console.error('[HomeVisa] Error sincronizando historial de transacciones', error);
        }
        return;
      }

      if (event.key === cardRechargeBackupKey) {
        const changed = mergeCardRechargeBackup();
        if (changed) {
          sortTransactions();
          persistTransactions();
        } else {
          syncCurrentUser();
        }
        render();
        return;
      }

      if (event.key === frequentUsersKey) {
        frequentUserIndex = buildFrequentUserIndex();
        render();
        return;
      }

      if (event.key === EXCHANGE_DIRECTORY_STORAGE_KEY) {
        refreshUserDirectoryIndex();
        render();
        return;
      }

      if (event.key === 'remeexProfilePhoto' || event.key === 'remeexUserData') {
        cachedUserProfile = null;
        render();
      }
    }

    function setupLegacyIntegration(legacy = {}) {
      const { legacyAddTransaction, legacyUpdateRecentTransactions, legacySaveTransactionsData } = legacy;

      if (legacySaveTransactionsData) {
        window.saveTransactionsData = function () {
          const result = legacySaveTransactionsData.apply(this, arguments);
          syncFromCurrentUser({ persist: false });
          render();
          return result;
        };
      } else if (typeof window.saveTransactionsData !== 'function') {
        window.saveTransactionsData = function () {
          persistTransactions();
          render();
        };
      }

      if (legacyAddTransaction) {
        window.addTransaction = function () {
          const result = legacyAddTransaction.apply(this, arguments);
          syncFromCurrentUser({ persist: false });
          render();
          return result;
        };
      } else {
        window.addTransaction = function (tx) {
          if (!tx) return;
          const changed = registerTransaction(tx);
          if (changed) {
            sortTransactions();
            persistTransactions();
          } else {
            syncCurrentUser();
          }
          render();
        };
      }

      if (legacyUpdateRecentTransactions) {
        window.updateRecentTransactions = function () {
          const result = legacyUpdateRecentTransactions.apply(this, arguments);
          syncFromCurrentUser({ persist: false });
          render();
          return result;
        };
      } else {
        window.updateRecentTransactions = function () {
          syncFromCurrentUser({ persist: false });
          render();
        };
      }
    }

    function loadFrequentUsersFromStorage() {
      try {
        const raw = localStorage.getItem(frequentUsersKey);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function buildFrequentUserIndex() {
      const index = Object.create(null);
      const list = loadFrequentUsersFromStorage();
      list.forEach((entry) => {
        if (!entry) return;
        const email = typeof entry.email === 'string' ? entry.email : '';
        const name = typeof entry.name === 'string' ? entry.name : '';
        if (email) {
          const normalizedEmail = normalizeKey(email);
          if (normalizedEmail) {
            index[normalizedEmail] = entry;
            const prefix = normalizedEmail.split('@')[0];
            if (prefix) index[prefix] = entry;
          }
        }
        if (name) {
          const normalizedName = normalizeKey(name);
          if (normalizedName) index[normalizedName] = entry;
        }
      });
      return index;
    }

    function buildUserDirectoryIndex(details) {
      const index = Object.create(null);
      if (!details || typeof details !== 'object') return index;
      Object.entries(details).forEach(([email, detail]) => {
        if (!email) return;
        const normalizedEmail = normalizeKey(email);
        if (normalizedEmail) {
          index[normalizedEmail] = detail;
          const prefix = normalizedEmail.split('@')[0];
          if (prefix) index[prefix] = detail;
        }
        if (detail && typeof detail.name === 'string' && detail.name.trim()) {
          const normalizedName = normalizeKey(detail.name);
          if (normalizedName) index[normalizedName] = detail;
        }
      });
      return index;
    }

    function findDetailInIndex(identifier, index) {
      if (!identifier || !index) return null;
      const key = normalizeKey(identifier);
      if (key && index[key]) return index[key];
      if (key && key.includes('@')) {
        const prefix = key.split('@')[0];
        if (prefix && index[prefix]) return index[prefix];
      }
      return null;
    }

    function findUserDetail(identifier) {
      return findDetailInIndex(identifier, userDirectoryIndex);
    }

    function findFrequentUser(identifier) {
      return findDetailInIndex(identifier, frequentUserIndex);
    }

    function getCurrentUserProfile() {
      if (cachedUserProfile) return cachedUserProfile;
      const profile = { name: '', photo: '' };
      if (window.currentUser && typeof window.currentUser === 'object') {
        if (typeof window.currentUser.name === 'string') profile.name = window.currentUser.name;
        if (typeof window.currentUser.photo === 'string') profile.photo = window.currentUser.photo;
      }
      if (!profile.photo) {
        try {
          profile.photo =
            localStorage.getItem('remeexProfilePhoto') ||
            sessionStorage.getItem('remeexProfilePhoto') ||
            '';
        } catch (error) {
          profile.photo = '';
        }
      }
      cachedUserProfile = profile;
      return profile;
    }

    function resolveCurrentUserAvatar() {
      const profile = getCurrentUserProfile();
      const displayName = profile.name || 'Tú';
      const source = normalizeAvatarSource(profile.photo);
      if (source) {
        return {
          type: 'image',
          src: source,
          alt: displayName,
          title: displayName
        };
      }
      const initials = computeInitials(displayName || 'Tú', 'Tú') || 'TU';
      return {
        type: 'initials',
        text: initials,
        gradient: generateAvatarGradient(displayName || 'Tú'),
        title: displayName
      };
    }

    function resolveAvatarFromDetail(detail, fallback) {
      if (!detail) return null;
      const displayName = (detail.name && String(detail.name)) || fallback || '';
      const source = normalizeAvatarSource(detail.avatar);
      if (source) {
        return {
          type: 'image',
          src: source,
          alt: displayName || 'Usuario Remeex',
          title: displayName
        };
      }
      const seed = displayName || fallback || 'Usuario Remeex';
      return {
        type: 'initials',
        text: computeInitials(seed, seed),
        gradient: generateAvatarGradient(seed),
        title: displayName
      };
    }

    function resolveAvatarFromUser(user, fallback) {
      if (!user) return null;
      const displayName = (user.name && String(user.name)) || fallback || (user.email && String(user.email)) || '';
      const source = normalizeAvatarSource(user.avatar);
      if (source) {
        return {
          type: 'image',
          src: source,
          alt: displayName || 'Usuario Remeex',
          title: displayName
        };
      }
      const seed = displayName || fallback || (user.email ? user.email.split('@')[0] : 'Usuario');
      return {
        type: 'initials',
        text: computeInitials(seed, seed),
        gradient: generateAvatarGradient(seed),
        title: displayName
      };
    }

    function pickTransactionLabel(transaction) {
      if (!transaction) return '';
      const candidates = [
        transaction.counterpartyName,
        transaction.partnerName,
        transaction.recipientName,
        transaction.senderName,
        transaction.destination,
        transaction.contactName,
        transaction.name
      ];
      for (const value of candidates) {
        if (typeof value === 'string' && value.trim()) return value.trim();
      }
      return '';
    }

    function resolveDirectAvatar(transaction) {
      const label = pickTransactionLabel(transaction);
      const imageFields = [
        'counterpartyAvatar',
        'partnerAvatar',
        'recipientAvatar',
        'senderAvatar',
        'destinationAvatar',
        'contactAvatar',
        'avatar',
        'photo',
        'profilePhoto',
        'userAvatar',
        'operatorAvatar'
      ];
      for (const field of imageFields) {
        const value = normalizeAvatarSource(transaction[field]);
        if (value) {
          return {
            type: 'image',
            src: value,
            alt: label || 'Usuario Remeex',
            title: label
          };
        }
      }
      const initialsFields = [
        'counterpartyInitials',
        'partnerInitials',
        'recipientInitials',
        'senderInitials',
        'avatarInitials'
      ];
      for (const field of initialsFields) {
        const value = typeof transaction[field] === 'string' ? transaction[field].trim() : '';
        if (value) {
          const seed = label || value;
          return {
            type: 'initials',
            text: value.slice(0, 3).toUpperCase(),
            gradient: generateAvatarGradient(seed),
            title: label
          };
        }
      }
      return null;
    }

    function extractCounterpartyIdentifier(transaction) {
      if (!transaction) return '';
      const fields = [
        transaction.counterpartyEmail,
        transaction.partnerEmail,
        transaction.recipientEmail,
        transaction.senderEmail,
        transaction.email,
        transaction.toEmail,
        transaction.fromEmail,
        transaction.destinationEmail,
        transaction.contactEmail
      ];
      for (const value of fields) {
        if (typeof value === 'string' && value.trim()) return value.trim();
      }
      if (typeof transaction.destination === 'string') {
        const destination = transaction.destination.trim();
        if (destination && destination.includes('@')) return destination;
      }
      const description = typeof transaction.description === 'string' ? transaction.description : '';
      const exchangeMatch = description.match(/intercambio\s+(?:enviado a|recibido de|con)\s+([a-z0-9._-]+)/i);
      if (exchangeMatch) return exchangeMatch[1];
      const transferMatch = description.match(/transferencia\s+(?:a|de)\s+([a-z0-9._-]+)/i);
      if (transferMatch) return transferMatch[1];
      return '';
    }

    function createAvatarFromIdentifier(identifier) {
      if (!identifier) return null;
      const base = identifier.includes('@') ? identifier.split('@')[0] : identifier;
      const title = identifier.includes('@') ? identifier : base;
      return {
        type: 'initials',
        text: computeInitials(base || identifier, base || identifier),
        gradient: generateAvatarGradient(identifier),
        title
      };
    }

    function createAvatarHTML(data) {
      if (!data) return '';
      if (data.type === 'image' && data.src) {
        const titleAttr = data.title ? ` title="${escapeHTML(data.title)}"` : '';
        return `<img src="${escapeHTML(data.src)}" alt="${escapeHTML(data.alt || data.title || 'Avatar')}" loading="lazy"${titleAttr}>`;
      }
      const text = data.text ? escapeHTML(String(data.text).toUpperCase().slice(0, 3)) : 'UR';
      const styleAttr = data.gradient ? ` style="background:${escapeHTML(data.gradient)};"` : '';
      const titleAttr = data.title ? ` title="${escapeHTML(data.title)}"` : '';
      return `<span class="transaction-avatar-initials"${styleAttr}${titleAttr}>${text}</span>`;
    }

    function resolveTransactionAvatar(transaction) {
      if (!transaction) return null;
      const description = typeof transaction.description === 'string' ? transaction.description : '';
      const normalizedDescription = description.toLowerCase();
      const type = (transaction.type || '').toLowerCase();

      const direct = resolveDirectAvatar(transaction);
      if (direct) return direct;

      const identifier = extractCounterpartyIdentifier(transaction);
      if (identifier) {
        const detail = findUserDetail(identifier);
        if (detail) {
          return resolveAvatarFromDetail(detail, identifier);
        }
        const frequent = findFrequentUser(identifier);
        if (frequent) {
          return resolveAvatarFromUser(frequent, identifier);
        }
        if (normalizedDescription.includes('intercambio')) {
          const fromIdentifier = createAvatarFromIdentifier(identifier);
          if (fromIdentifier) return fromIdentifier;
        }
      }

      if (type === 'withdraw' && !normalizedDescription.includes('intercambio')) {
        return resolveCurrentUserAvatar();
      }

      if (type === 'deposit' && normalizedDescription.includes('ahorro')) {
        return resolveCurrentUserAvatar();
      }

      if (!identifier && normalizedDescription.includes('intercambio')) {
        const label = pickTransactionLabel(transaction) || description.replace(/intercambio/gi, '').trim();
        if (label) {
          return {
            type: 'initials',
            text: computeInitials(label, label),
            gradient: generateAvatarGradient(label),
            title: label
          };
        }
      }

      return null;
    }

    function applyFilter(transactions) {
      if (activeFilter === 'all' || activeFilter === 'summary') return transactions;
      const handler = FILTER_HANDLERS[activeFilter];
      return handler ? transactions.filter(handler) : transactions;
    }

    function render() {
      refreshUserDirectoryIndex();
      frequentUserIndex = buildFrequentUserIndex();
      cachedUserProfile = null;
      transactionsContainer.innerHTML = '';
      displayedRefs.clear();

      const entries = applyFilter(state.transactions.slice());

      if (!entries.length) {
        const empty = document.createElement('div');
        empty.className = 'transaction-item no-transactions';
        empty.innerHTML = `
          <div class="transaction-icon" style="background: var(--neutral-300); color: var(--neutral-600);">
            <i class="fas fa-receipt"></i>
          </div>
          <div class="transaction-content">
            <div class="transaction-title">No hay transacciones recientes</div>
            <div class="transaction-details">
              <div class="transaction-date">
                <i class="far fa-calendar"></i>
                <span>Realice una recarga para ver su historial</span>
              </div>
            </div>
          </div>
        `;
        transactionsContainer.appendChild(empty);
        displayedRefs.add('no-tx');
        return;
      }

      entries.forEach((transaction, index) => {
        const reference = transaction.reference || transaction.id || `tx-${index}`;
        if (displayedRefs.has(reference)) return;
        const element = createTransactionElement(transaction);
        transactionsContainer.appendChild(element);
        displayedRefs.add(reference);
      });
    }

    function createTransactionElement(transaction) {
      const element = document.createElement('div');
      element.className = 'transaction-item';

      let iconClass = 'fas fa-arrow-right';
      let typeClass = transaction.type || '';
      let amountPrefix = '';

      if (transaction.type === 'deposit') {
        iconClass = 'fas fa-arrow-down';
        amountPrefix = '+';
      } else if (transaction.type === 'withdraw') {
        iconClass = 'fas fa-arrow-up';
        amountPrefix = '-';
      }

      if (transaction.status === 'pending' || transaction.type === 'pending') {
        iconClass = 'fas fa-clock';
        typeClass = 'pending';
        amountPrefix = transaction.type === 'withdraw' ? '-' : '+';
      } else if (transaction.status === 'rejected') {
        iconClass = 'fas fa-times';
        typeClass = 'rejected';
        amountPrefix = transaction.type === 'withdraw' ? '-' : '+';
      } else if (transaction.status === 'cancelled') {
        iconClass = 'fas fa-ban';
        typeClass = 'cancelled';
        amountPrefix = transaction.type === 'withdraw' ? '-' : '+';
      } else if (transaction.status === 'processing') {
        iconClass = 'fas fa-sync-alt';
        typeClass = 'processing';
      } else if (transaction.status === 'pending_verification') {
        iconClass = 'fas fa-user-check';
        typeClass = 'pending';
      }

      const description = escapeHTML(transaction.description || 'Transacción Remeex');
      const dateText = escapeHTML(transaction.date || formatDisplayDate(new Date(transaction.timestamp)));
      let resolvedCurrency = normalizeCurrencyCode(
        transaction.displayCurrency || transaction.originalCurrency || transaction.currency,
        transaction.type === 'withdraw' && transaction.method && transaction.method !== 'international' ? 'bs' : 'usd'
      );

      const originalCurrency = normalizeCurrencyCode(transaction.originalCurrency || resolvedCurrency, resolvedCurrency);
      const hasOriginalAmount =
        Object.prototype.hasOwnProperty.call(transaction, 'originalAmount') && transaction.originalAmount != null;

      let amountValue = Number.isFinite(transaction.displayAmount) ? transaction.displayAmount : null;

      if (transaction.type === 'withdraw') {
        const method = (transaction.method || '').toLowerCase();
        if (method === 'international') {
          resolvedCurrency = 'usd';
          if (!Number.isFinite(amountValue) && Number.isFinite(transaction.amount)) {
            amountValue = transaction.amount;
          }
        } else {
          const shouldUseLocalCurrency =
            resolvedCurrency === 'bs' ||
            ['bank', 'mobile', 'local', 'venezuela', 'pago_movil', 'pagomovil'].includes(method);

          if (shouldUseLocalCurrency) {
            resolvedCurrency = 'bs';
            if (!Number.isFinite(amountValue) && Number.isFinite(transaction.amountBs)) {
              amountValue = transaction.amountBs;
            }
            if (!Number.isFinite(amountValue) && hasOriginalAmount && Number.isFinite(transaction.originalAmount)) {
              amountValue = transaction.originalAmount;
            }
          } else if (!Number.isFinite(amountValue) && Number.isFinite(transaction.amount)) {
            amountValue = transaction.amount;
          }
        }
      } else if (hasOriginalAmount && Number.isFinite(transaction.originalAmount)) {
        amountValue = transaction.originalAmount;
        resolvedCurrency = originalCurrency;
      }

      if (!Number.isFinite(amountValue)) {
        if (resolvedCurrency === 'bs' && Number.isFinite(transaction.amountBs)) {
          amountValue = transaction.amountBs;
        } else if (resolvedCurrency === 'eur' && Number.isFinite(transaction.amountEur)) {
          amountValue = transaction.amountEur;
        } else {
          amountValue = transaction.amount;
        }
      }

      const amountText = `${amountPrefix}${formatCurrency(amountValue, resolvedCurrency)}`;

      let badgesHTML = '';
      const status = (transaction.status || '').toLowerCase();
      if (status && STATUS_LABELS[status]) {
        badgesHTML += `<span class="transaction-badge ${status}">${STATUS_LABELS[status]}</span>`;
        if (status === 'pending_verification' && window.currentUser && window.currentUser.name) {
          const firstName = escapeHTML(window.currentUser.name.split(' ')[0] || 'el usuario');
          badgesHTML += `<span class="transaction-badge validation">A la espera que ${firstName} valide su cuenta para habilitar retiros</span>`;
        }
      }

      const categories = [];

      if (transaction.card) {
        categories.push(`
          <div class="transaction-category">
            <i class="far fa-credit-card"></i>
            <span>Tarjeta ${escapeHTML(transaction.card)}</span>
          </div>
        `);
      }

      if (transaction.cardAmount) {
        categories.push(`
          <div class="transaction-category">
            <i class="fas fa-random"></i>
            <span>Mixto: ${formatCurrency(transaction.amount, 'usd')} Remeex y ${formatCurrency(transaction.cardAmount, 'usd')} tarjeta</span>
          </div>
        `);
      }

      if (transaction.reference) {
        categories.push(`
          <div class="transaction-category">
            <i class="fas fa-hashtag"></i>
            <span>Ref: ${escapeHTML(transaction.reference)}</span>
          </div>
        `);
      }

      if (transaction.destination) {
        categories.push(`
          <div class="transaction-category">
            <i class="far fa-user"></i>
            <span>Destino: ${escapeHTML(transaction.destination)}</span>
          </div>
        `);
      }

      const logo = transaction.bankLogo || (transaction.description && transaction.description.toLowerCase().includes('latinphone') ? 'latinphone' : '');
      if (logo && logo !== 'latinphone') {
        categories.push(`
          <div class="transaction-category">
            <img src="${escapeHTML(logo)}" alt="${escapeHTML(transaction.bankName || '')}" class="transaction-bank-logo">
            ${transaction.bankName && transaction.bankName !== 'Visa' && transaction.bankName !== 'Remeex Visa' ? `<span>${escapeHTML(transaction.bankName)}</span>` : ''}
          </div>
        `);
      } else if (logo === 'latinphone') {
        categories.push(`
          <div class="transaction-category">
            <img src="${escapeHTML(window.LATINPHONE_LOGO || '')}" alt="LatinPhone" class="transaction-bank-logo">
          </div>
        `);
      }

      const avatarData = resolveTransactionAvatar(transaction);
      const iconClasses = ['transaction-icon'];
      if (avatarData) {
        iconClasses.push('has-avatar');
      } else if (typeClass) {
        iconClasses.push(typeClass);
      }
      const iconClassAttr = iconClasses.map((value) => escapeHTML(value)).join(' ');
      let iconInner = `<i class="${escapeHTML(iconClass)}"></i>`;
      if (avatarData) {
        iconInner = createAvatarHTML(avatarData);
        if (typeClass) {
          iconInner += `<span class="transaction-avatar-indicator ${escapeHTML(typeClass)}"><i class="${escapeHTML(iconClass)}"></i></span>`;
        }
      }

      element.innerHTML = `
        <div class="${iconClassAttr}">
          ${iconInner}
        </div>
        <div class="transaction-content">
          <div class="transaction-title">${description}${badgesHTML}</div>
          <div class="transaction-details">
            <div class="transaction-date">
              <i class="far fa-calendar"></i>
              <span>${dateText}</span>
            </div>
            ${categories.join('')}
          </div>
        </div>
        <div class="transaction-amount ${escapeHTML(typeClass)}">
          ${amountText}
        </div>
      `;

      if (status === 'pending' && transaction.type === 'withdraw') {
        const badge = element.querySelector('.transaction-badge.pending');
        if (badge) {
          badge.addEventListener('click', function (event) {
            event.stopPropagation();
            const overlay = document.getElementById('withdrawals-overlay');
            if (overlay) overlay.style.display = 'flex';
            if (typeof window.updatePendingWithdrawalsList === 'function') {
              try { window.updatePendingWithdrawalsList(); } catch (error) { console.error(error); }
            }
          });
        }
      }

      return element;
    }
  });
})();
