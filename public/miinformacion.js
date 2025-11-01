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

  const REGISTRATION_SNAPSHOT_DESCRIPTORS = [
    { key: 'visaRegistrationCompleted', label: 'Registro completado', storage: 'localStorage' },
    { key: 'visaRegistrationTemp', label: 'Registro temporal (localStorage)', storage: 'localStorage' },
    { key: 'visaRegistrationTemp', label: 'Registro temporal (sessionStorage)', storage: 'sessionStorage' },
    { key: 'visaUserData', label: 'Credenciales y sesión', storage: 'localStorage' },
    { key: 'remeexVerificationData', label: 'Verificación de identidad', storage: 'localStorage' },
    { key: 'remeexVerificationBanking', label: 'Verificación bancaria', storage: 'localStorage' },
    { key: 'remeexIdentityDetails', label: 'Detalles de identidad', storage: 'localStorage' },
    { key: 'remeexIdentityDocuments', label: 'Documentos cargados', storage: 'localStorage' },
    { key: 'selectedLatamCountry', label: 'País seleccionado', storage: 'localStorage', forceString: true },
    { key: 'userFullName', label: 'Nombre almacenado', storage: 'localStorage', forceString: true },
    { key: 'remeexDeviceId', label: 'Identificador de dispositivo', storage: 'localStorage', forceString: true },
    { key: 'remeexSessionExchangeRate', label: 'Tasa de sesión (localStorage)', storage: 'localStorage' },
    { key: 'remeexSessionExchangeRate', label: 'Tasa de sesión (sessionStorage)', storage: 'sessionStorage' },
    { key: 'homevisaSessionMonitor', label: 'Monitor de sesión (HomeVisa)', storage: 'localStorage' }
  ];

  const SESSION_EVENT_LABELS = {
    login: 'Inicio de sesión',
    logout: 'Cierre de sesión',
    heartbeat: 'Actividad',
    seen: 'Actualización',
    status: 'Estado',
    focus: 'Recuperación de sesión',
    reconnect: 'Reconexión'
  };

  const BALANCE_HISTORY_KEYS = [
    'remeexBalanceHistory',
    'remeexBalanceTimeline',
    'remeexBalanceSnapshots',
    'remeexBalanceLog'
  ];

  const VALIDATION_AMOUNTS_BY_TIER = {
    'Estándar': 25,
    'Bronce': 30,
    'Platinum': 35,
    'Uranio Visa': 40,
    'Uranio Infinite': 45
  };

  function safeGetFromStorage(storage, key) {
    if (!storage || typeof storage.getItem !== 'function') return null;
    try {
      return storage.getItem(key);
    } catch (error) {
      console.warn('[MiInformación] No se pudo leer', key, 'del almacenamiento.', error);
      return null;
    }
  }

  function loadJSONFromStorage(storage, key) {
    const raw = safeGetFromStorage(storage, key);
    return safeJSONParse(raw);
  }

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

  function loadRegistrationTemp() {
    return (
      safeJSONParse(safeGetFromStorage(localStorage, 'visaRegistrationTemp')) ||
      safeJSONParse(safeGetFromStorage(sessionStorage, 'visaRegistrationTemp'))
    );
  }

  function loadUserData() {
    return safeJSONParse(safeGetFromStorage(localStorage, 'visaUserData'));
  }

  function loadVerificationData() {
    return safeJSONParse(safeGetFromStorage(localStorage, 'remeexVerificationData'));
  }

  function loadVerificationBanking() {
    return safeJSONParse(safeGetFromStorage(localStorage, 'remeexVerificationBanking'));
  }

  function loadSelectedCountry() {
    const stored = safeGetFromStorage(localStorage, 'selectedLatamCountry');
    return typeof stored === 'string' && stored.trim() ? stored.trim() : null;
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

  function loadSessionMonitor() {
    return safeJSONParse(safeGetFromStorage(localStorage, 'homevisaSessionMonitor'));
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

  function firstNumber(...values) {
    for (const value of values) {
      const numeric = toNumber(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
    return null;
  }

  function parseTimestampValue(value) {
    if (value === null || value === undefined) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.getTime();
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return null;
      if (value > 1e12) return value;
      if (value > 1e11) return value;
      if (value > 1e9) return value * 1000;
      if (value > 1e6) return value * 1000;
      return value * 1000;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const numeric = Number(trimmed);
      if (Number.isFinite(numeric)) {
        return parseTimestampValue(numeric);
      }
      const parsed = Date.parse(trimmed);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return null;
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return '--';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '--';
    const datePart = date.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const timePart = date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} ${timePart}`;
  }

  function formatDateMeta(value) {
    if (value === null || value === undefined || value === '') return '';
    const formatted = formatTimestamp(value);
    if (formatted !== '--') return formatted;
    if (typeof value === 'string') return value;
    if (Number.isFinite(value)) return String(value);
    return '';
  }

  function formatDateDetail(value) {
    if (value === null || value === undefined || value === '') return '—';
    const formatted = formatDateMeta(value);
    if (!formatted) {
      return typeof value === 'string' ? value : String(value);
    }
    if (typeof value === 'string' && formatted !== value) {
      return `${value} (${formatted})`;
    }
    if (Number.isFinite(value) && formatted !== String(value)) {
      return `${value} (${formatted})`;
    }
    return formatted;
  }

  function resolveTimestamp(transaction) {
    if (!transaction || typeof transaction !== 'object') return null;
    const candidates = [
      transaction.timestamp,
      transaction.date,
      transaction.createdAt,
      transaction.updatedAt,
      transaction.completedAt,
      transaction.processedAt,
      transaction.time
    ];

    for (const candidate of candidates) {
      const parsed = parseTimestampValue(candidate);
      if (parsed !== null) {
        return parsed;
      }
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

  function resolveExchangeRates(rateInfo, sessionRate) {
    const usdToBsCandidates = [
      rateInfo && Number.isFinite(rateInfo.value) ? rateInfo.value : null,
      sessionRate && sessionRate.USD_TO_BS,
      sessionRate && sessionRate.usdToBs,
      sessionRate && sessionRate.usd_bs,
      sessionRate && sessionRate.usdToBsRate
    ];
    const usdToEurCandidates = [
      rateInfo && Number.isFinite(rateInfo.usdToEur) ? rateInfo.usdToEur : null,
      sessionRate && sessionRate.USD_TO_EUR,
      sessionRate && sessionRate.usdToEur,
      sessionRate && sessionRate.usd_eur
    ];

    let usdToBs = firstNumber(...usdToBsCandidates);
    let usdToEur = firstNumber(...usdToEurCandidates);

    if (!Number.isFinite(usdToEur) && sessionRate) {
      const eurToUsd = firstNumber(sessionRate.EUR_TO_USD, sessionRate.eurToUsd, sessionRate.eur_usd);
      if (Number.isFinite(eurToUsd) && eurToUsd > 0) {
        usdToEur = 1 / eurToUsd;
      }
    }

    return {
      usdToBs: Number.isFinite(usdToBs) && usdToBs > 0 ? usdToBs : null,
      usdToEur: Number.isFinite(usdToEur) && usdToEur > 0 ? usdToEur : null
    };
  }

  function loadBalanceHistoryRecords() {
    const records = [];
    const storages = [localStorage, sessionStorage];
    BALANCE_HISTORY_KEYS.forEach((key) => {
      storages.forEach((storage) => {
        const raw = safeGetFromStorage(storage, key);
        if (!raw) return;
        const parsed = safeJSONParse(raw);
        if (!parsed) return;
        if (Array.isArray(parsed)) {
          parsed.forEach((entry) => records.push(entry));
          return;
        }
        if (Array.isArray(parsed.history)) {
          parsed.history.forEach((entry) => records.push(entry));
        }
        if (Array.isArray(parsed.entries)) {
          parsed.entries.forEach((entry) => records.push(entry));
        }
        if (Array.isArray(parsed.records)) {
          parsed.records.forEach((entry) => records.push(entry));
        }
        if (parsed.timeline && Array.isArray(parsed.timeline)) {
          parsed.timeline.forEach((entry) => records.push(entry));
        }
        if (typeof parsed === 'object') {
          Object.keys(parsed).forEach((nestedKey) => {
            const value = parsed[nestedKey];
            if (Array.isArray(value)) {
              value.forEach((entry) => records.push(entry));
            } else if (value && typeof value === 'object') {
              records.push(Object.assign({ sourceKey: nestedKey }, value));
            }
          });
        }
      });
    });
    return records;
  }

  function normalizeHistoryRecords(records, rates) {
    if (!Array.isArray(records)) return [];
    const normalized = [];
    records.forEach((record) => {
      if (!record || typeof record !== 'object') return;
      const timestampMs = parseTimestampValue(
        record.timestamp ||
          record.date ||
          record.createdAt ||
          record.updatedAt ||
          record.recordedAt ||
          record.time
      );
      let balanceUsd = firstNumber(
        record.balanceUsd,
        record.balanceUSD,
        record.balance_usd,
        record.usd,
        record.usdBalance,
        record.totalUsd,
        record.total_usd,
        record.amountUsd,
        record.usd_amount,
        record.balance && record.balance.usd
      );
      let balanceBs = firstNumber(
        record.balanceBs,
        record.balance_bs,
        record.bs,
        record.bsBalance,
        record.amountBs,
        record.balance && record.balance.bs
      );
      let balanceEur = firstNumber(
        record.balanceEur,
        record.balance_eur,
        record.eur,
        record.amountEur,
        record.balance && record.balance.eur
      );
      let deltaUsd = firstNumber(
        record.deltaUsd,
        record.changeUsd,
        record.delta_usd,
        record.change_usd,
        record.delta,
        record.change && record.change.usd,
        record.variationUsd
      );

      if (!Number.isFinite(balanceUsd)) {
        if (Number.isFinite(balanceBs) && Number.isFinite(rates.usdToBs) && rates.usdToBs > 0) {
          balanceUsd = balanceBs / rates.usdToBs;
        } else if (Number.isFinite(balanceEur) && Number.isFinite(rates.usdToEur) && rates.usdToEur > 0) {
          balanceUsd = balanceEur / rates.usdToEur;
        }
      }

      if (!Number.isFinite(balanceBs) && Number.isFinite(balanceUsd) && Number.isFinite(rates.usdToBs)) {
        balanceBs = balanceUsd * rates.usdToBs;
      }

      if (!Number.isFinite(balanceEur) && Number.isFinite(balanceUsd) && Number.isFinite(rates.usdToEur)) {
        balanceEur = balanceUsd * rates.usdToEur;
      }

      if (!Number.isFinite(balanceUsd)) return;

      normalized.push({
        timestampMs,
        balanceUsd,
        balanceBs: Number.isFinite(balanceBs) ? balanceBs : null,
        balanceEur: Number.isFinite(balanceEur) ? balanceEur : null,
        deltaUsd: Number.isFinite(deltaUsd) ? deltaUsd : null,
        note:
          record.note ||
          record.description ||
          record.label ||
          record.reason ||
          record.event ||
          record.status ||
          null,
        source: record.source || record.origin || record.type || record.kind || record.sourceKey || 'Registro',
        raw: record
      });
    });
    return normalized;
  }

  function inferTransactionDirection(transaction, amount) {
    if (!transaction || typeof transaction !== 'object') return 0;
    const status = (transaction.status || transaction.state || '').toString().toLowerCase();
    if (['rejected', 'cancelled', 'canceled', 'failed'].includes(status)) return 0;

    if (Number.isFinite(amount) && amount < 0) return -1;

    const directionField = (transaction.direction || transaction.flow || '').toString().toLowerCase();
    if (['out', 'outbound', 'debit'].includes(directionField)) return -1;
    if (['in', 'inbound', 'credit'].includes(directionField)) return 1;

    const type = (transaction.type || '').toString().toLowerCase();
    const description = (transaction.description || transaction.title || transaction.concept || '').toString().toLowerCase();
    const category = (transaction.category || transaction.kind || '').toString().toLowerCase();
    const combined = `${type} ${description} ${category}`;

    const positiveKeywords = [
      'deposit',
      'recarga',
      'recharge',
      'abono',
      'credit',
      'ingreso',
      'entrada',
      'transfer in',
      'transferencia recibida',
      'bono',
      'cashback',
      'refund',
      'reembolso',
      'donación recibida',
      'premio'
    ];
    const negativeKeywords = [
      'withdraw',
      'withdrawal',
      'retiro',
      'transfer out',
      'transferencia',
      'envio',
      'envío',
      'pago',
      'payment',
      'compra',
      'debit',
      'cobro',
      'salida',
      'donación',
      'comisión',
      'fee'
    ];

    if (positiveKeywords.some((keyword) => combined.includes(keyword))) return 1;
    if (negativeKeywords.some((keyword) => combined.includes(keyword))) return -1;

    return 1;
  }

  function computeTransactionDeltaUsd(transaction, rates) {
    if (!transaction || typeof transaction !== 'object') return null;
    const amountInfo = resolveAmount(transaction);
    if (!Number.isFinite(amountInfo.amount)) return null;

    const direction = inferTransactionDirection(transaction, amountInfo.amount);
    if (direction === 0) return 0;

    const currency = (amountInfo.currency || 'usd').toString().toLowerCase();
    let amountUsd;

    if (currency === 'usd') {
      amountUsd = amountInfo.amount;
    } else if (currency === 'bs' || currency === 'ves' || currency === 'vef') {
      const rate = firstNumber(
        transaction.rate,
        transaction.rateUsd,
        transaction.rateUSD,
        transaction.exchangeRate,
        transaction.exchange_rate,
        transaction.usdToBs,
        transaction.usd_bs,
        transaction.fxRate,
        transaction.bsPerUsd,
        transaction.rateBs,
        transaction.bolivarRate,
        rates.usdToBs
      );
      if (!Number.isFinite(rate) || rate <= 0) return null;
      amountUsd = amountInfo.amount / rate;
    } else if (currency === 'eur') {
      let usdToEur = firstNumber(
        transaction.usdToEur,
        transaction.rateUsdToEur,
        transaction.exchangeRate,
        transaction.exchange_rate,
        transaction.eurRate,
        transaction.fxRate,
        rates.usdToEur
      );
      if (!Number.isFinite(usdToEur) || usdToEur <= 0) {
        const eurToUsd = firstNumber(
          transaction.eurToUsd,
          transaction.rateEurToUsd,
          transaction.exchangeRateEurToUsd,
          transaction.fx
        );
        if (Number.isFinite(eurToUsd) && eurToUsd > 0) {
          usdToEur = 1 / eurToUsd;
        }
      }
      if (!Number.isFinite(usdToEur) || usdToEur <= 0) return null;
      amountUsd = amountInfo.amount / usdToEur;
    } else {
      amountUsd = amountInfo.amount;
    }

    if (!Number.isFinite(amountUsd)) return null;

    if (amountUsd < 0) return amountUsd;

    return direction * amountUsd;
  }

  function deriveBalanceHistoryFromTransactions(balance, transactions, rates) {
    const derived = [];
    if (!Array.isArray(transactions) || !transactions.length) return derived;
    const currentUsd = toNumber(balance?.usd);
    if (!Number.isFinite(currentUsd)) return derived;

    const entries = transactions
      .map((transaction) => {
        const timestampMs = resolveTimestamp(transaction);
        const deltaUsd = computeTransactionDeltaUsd(transaction, rates);
        return { transaction, timestampMs, deltaUsd };
      })
      .filter((entry) => Number.isFinite(entry.timestampMs) && entry.deltaUsd !== null && entry.deltaUsd !== 0);

    if (!entries.length) return derived;

    entries.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));

    let runningUsd = currentUsd;
    entries.forEach((entry) => {
      const record = {
        timestampMs: entry.timestampMs,
        balanceUsd: runningUsd,
        balanceBs: Number.isFinite(rates.usdToBs) ? runningUsd * rates.usdToBs : null,
        balanceEur: Number.isFinite(rates.usdToEur) ? runningUsd * rates.usdToEur : null,
        deltaUsd: entry.deltaUsd,
        note:
          entry.transaction.description ||
          entry.transaction.title ||
          entry.transaction.concept ||
          entry.transaction.type ||
          'Transacción',
        source: 'Transacción',
        raw: entry.transaction
      };
      derived.push(record);
      runningUsd -= entry.deltaUsd;
    });

    return derived;
  }

  function buildBalanceHistory(storedRecords, balance, transactions, rates) {
    const stored = normalizeHistoryRecords(storedRecords, rates);
    const derived = deriveBalanceHistoryFromTransactions(balance, transactions, rates);
    const combined = stored.concat(derived);
    if (!combined.length) return [];

    const seen = new Set();
    const deduped = [];
    combined.forEach((entry) => {
      if (!Number.isFinite(entry.balanceUsd)) return;
      const key = `${Number.isFinite(entry.timestampMs) ? entry.timestampMs : 'unknown'}|${Math.round(entry.balanceUsd * 100)}|${entry.source}`;
      if (seen.has(key)) return;
      seen.add(key);
      deduped.push(entry);
    });

    deduped.sort((a, b) => (a.timestampMs || 0) - (b.timestampMs || 0));
    const maxPoints = 200;
    return deduped.length > maxPoints ? deduped.slice(deduped.length - maxPoints) : deduped;
  }

  function computeHistoryStats(history) {
    if (!Array.isArray(history) || !history.length) return null;
    let minEntry = null;
    let maxEntry = null;
    let firstEntry = null;
    let lastEntry = null;
    let sum = 0;
    let count = 0;

    history.forEach((entry) => {
      if (!Number.isFinite(entry.balanceUsd)) return;
      sum += entry.balanceUsd;
      count += 1;
      if (!minEntry || entry.balanceUsd < minEntry.balanceUsd) minEntry = entry;
      if (!maxEntry || entry.balanceUsd > maxEntry.balanceUsd) maxEntry = entry;
      if (!firstEntry || (entry.timestampMs || Infinity) < (firstEntry.timestampMs || Infinity)) firstEntry = entry;
      if (!lastEntry || (entry.timestampMs || -Infinity) > (lastEntry.timestampMs || -Infinity)) lastEntry = entry;
    });

    if (!count) return null;

    const average = sum / count;
    const variation = Number.isFinite(lastEntry.balanceUsd) && Number.isFinite(firstEntry.balanceUsd)
      ? lastEntry.balanceUsd - firstEntry.balanceUsd
      : null;

    return {
      min: minEntry,
      max: maxEntry,
      first: firstEntry,
      last: lastEntry,
      average,
      count,
      variation
    };
  }

  function computeAccountTierFromBalance(balanceUsd) {
    if (!Number.isFinite(balanceUsd)) return 'Estándar';
    if (balanceUsd >= 5001) return 'Uranio Infinite';
    if (balanceUsd >= 2001) return 'Uranio Visa';
    if (balanceUsd >= 1001) return 'Platinum';
    if (balanceUsd >= 501) return 'Bronce';
    return 'Estándar';
  }

  function loadPoints() {
    const raw = safeGetFromStorage(localStorage, 'remeexPoints');
    const data = safeJSONParse(raw);
    const points = toNumber(data && data.points);
    return Number.isFinite(points) ? points : null;
  }

  function resolveValidationAmount(tier) {
    const forced = toNumber(safeGetFromStorage(localStorage, 'forcedValidationAmountUsd'));
    if (Number.isFinite(forced) && forced > 0) {
      return {
        usd: forced,
        base: forced,
        forced: true,
        bcvsurcharge: false,
        discountApplied: false,
        discountValue: 0,
        commission: null,
        selectedRate: safeGetFromStorage(localStorage, 'selectedRate') || ''
      };
    }

    const base = VALIDATION_AMOUNTS_BY_TIER[tier] || VALIDATION_AMOUNTS_BY_TIER['Estándar'];
    let amount = base;
    let bcvsurcharge = false;
    let discountApplied = false;
    let discountValue = 0;
    let commission = toNumber(safeGetFromStorage(localStorage, 'pendingCommission'));
    const selectedRate = (safeGetFromStorage(localStorage, 'selectedRate') || '').trim();

    if (selectedRate === 'bcv') {
      amount += 5;
      bcvsurcharge = true;
    }

    const discountRaw = parseInt(safeGetFromStorage(localStorage, 'validationDiscount') || '0', 10);
    const expiry = parseInt(safeGetFromStorage(localStorage, 'discountExpiry') || '0', 10);
    const used = safeGetFromStorage(localStorage, 'discountUsed') === 'true';
    if (
      discountRaw > 0 &&
      (!expiry || Date.now() < expiry) &&
      !used &&
      selectedRate !== 'bcv'
    ) {
      amount -= discountRaw;
      discountApplied = true;
      discountValue = discountRaw;
    }

    if (!Number.isFinite(commission) || commission <= 0 || commission >= 1) {
      commission = null;
    } else {
      amount *= 1 - commission;
    }

    return {
      usd: Math.max(amount, 0),
      base,
      forced: false,
      bcvsurcharge,
      discountApplied,
      discountValue,
      commission,
      selectedRate
    };
  }

  function resolveAccountInfo(balance, rates) {
    const balanceUsd = toNumber(balance?.usd);
    const balanceBs = toNumber(balance?.bs);
    const balanceEur = toNumber(balance?.eur);
    const storedTierRaw = safeGetFromStorage(localStorage, 'remeexAccountTier');
    const storedTier = typeof storedTierRaw === 'string' ? storedTierRaw.trim() : '';
    const computedTier = computeAccountTierFromBalance(balanceUsd);
    const tier = storedTier || computedTier;
    const validation = resolveValidationAmount(tier);
    const points = loadPoints();

    return {
      tier,
      tierSource: storedTier ? 'Nivel sincronizado' : 'Estimado según saldo',
      balanceUsd,
      balanceBs,
      balanceEur,
      validationUsd: Number.isFinite(validation.usd) ? validation.usd : null,
      validationBs:
        Number.isFinite(validation.usd) && Number.isFinite(rates.usdToBs)
          ? validation.usd * rates.usdToBs
          : null,
      validationEur:
        Number.isFinite(validation.usd) && Number.isFinite(rates.usdToEur)
          ? validation.usd * rates.usdToEur
          : null,
      validation,
      points,
      usdToBs: rates.usdToBs,
      usdToEur: rates.usdToEur
    };
  }

  function resolveAvatarSource(registration, userData, verification, banking, temp) {
    const candidates = [
      safeGetFromStorage(localStorage, 'remeexProfilePhoto'),
      registration?.profilePhoto,
      userData?.profilePhoto,
      verification?.profilePhoto,
      banking?.profilePhoto,
      temp?.profilePhoto
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed) {
          return trimmed;
        }
      }
    }

    return null;
  }

  function gatherProfileInfo(registration, userData, verification, banking, temp) {
    const countryCandidate =
      registration?.country ||
      registration?.countryCode ||
      userData?.country ||
      verification?.country ||
      verification?.countryCode ||
      banking?.country ||
      temp?.country ||
      temp?.countryCode ||
      loadSelectedCountry();

    const normalizeString = (value) =>
      typeof value === 'string' ? value.trim() : '';

    const fullNameCandidates = [
      registration?.fullName,
      verification?.fullName,
      userData?.fullName,
      temp?.fullName,
      banking?.fullName,
      [registration?.firstName, registration?.middleName, registration?.lastName].filter(Boolean).join(' '),
      [verification?.firstName, verification?.middleName, verification?.lastName].filter(Boolean).join(' '),
      [userData?.firstName, userData?.middleName, userData?.lastName].filter(Boolean).join(' '),
      [temp?.firstName, temp?.middleName, temp?.lastName].filter(Boolean).join(' '),
      [banking?.firstName, banking?.middleName, banking?.lastName].filter(Boolean).join(' ')
    ];

    const resolvedFullName = normalizeString(
      fullNameCandidates.find((entry) => normalizeString(entry)) || ''
    );

    const preferredName = normalizeString(
      registration?.preferredName ||
        verification?.preferredName ||
        userData?.preferredName ||
        temp?.preferredName ||
        banking?.preferredName ||
        registration?.firstName ||
        verification?.firstName ||
        userData?.firstName ||
        temp?.firstName ||
        banking?.firstName
    );

    const nickname = normalizeString(
      registration?.nickname ||
        verification?.nickname ||
        userData?.nickname ||
        temp?.nickname ||
        banking?.nickname
    );

    const email = normalizeString(
      registration?.email ||
        userData?.email ||
        verification?.email ||
        temp?.email ||
        banking?.email
    );

    const phone = normalizeString(
      registration?.phone ||
        registration?.phoneNumber ||
        verification?.phone ||
        verification?.phoneNumber ||
        userData?.phone ||
        userData?.phoneNumber ||
        temp?.phone ||
        temp?.phoneNumber ||
        banking?.phone ||
        banking?.phoneNumber
    );

    const gender = normalizeString(
      registration?.gender ||
        verification?.gender ||
        userData?.gender ||
        temp?.gender ||
        banking?.gender
    );

    const birthDate = normalizeString(
      registration?.birthDate ||
        verification?.birthDate ||
        userData?.birthDate ||
        temp?.birthDate ||
        banking?.birthDate
    );

    const documentType = normalizeString(
      registration?.documentType ||
        registration?.documentKind ||
        verification?.documentType ||
        verification?.documentKind ||
        userData?.documentType ||
        temp?.documentType ||
        banking?.documentType
    );

    const documentNumber = normalizeString(
      registration?.documentNumber ||
        registration?.documentId ||
        verification?.documentNumber ||
        verification?.documentId ||
        userData?.documentNumber ||
        userData?.documentId ||
        temp?.documentNumber ||
        temp?.documentId ||
        banking?.documentNumber ||
        banking?.documentId
    );

    const createdAt =
      registration?.completedAt ||
      registration?.createdAt ||
      userData?.completedAt ||
      userData?.createdAt ||
      verification?.completedAt ||
      verification?.createdAt ||
      temp?.completedAt ||
      banking?.completedAt ||
      banking?.createdAt ||
      null;

    const deviceId = normalizeString(safeGetFromStorage(localStorage, 'remeexDeviceId'));
    const sessionRate =
      loadJSONFromStorage(localStorage, 'remeexSessionExchangeRate') ||
      loadJSONFromStorage(sessionStorage, 'remeexSessionExchangeRate');

    const resolvedCountry = normalizeString(countryCandidate);
    const avatarSrc = resolveAvatarSource(registration, userData, verification, banking, temp);

    const fallbackForInitials = preferredName || resolvedFullName || email || 'Usuario Remeex';
    const initials = fallbackForInitials ? fallbackForInitials.charAt(0).toUpperCase() : 'U';

    return {
      avatarSrc,
      initials,
      fullName: resolvedFullName,
      preferredName,
      nickname,
      email,
      phone,
      gender,
      birthDate,
      documentType,
      documentNumber,
      country: resolvedCountry,
      createdAt,
      deviceId,
      sessionRate,
      sources: { registration, userData, verification, banking, temp }
    };
  }

  function collectRegistrationSnapshots() {
    return REGISTRATION_SNAPSHOT_DESCRIPTORS.map((descriptor) => {
      const storage = descriptor.storage === 'sessionStorage' ? sessionStorage : localStorage;
      const raw = safeGetFromStorage(storage, descriptor.key);
      const parsed = descriptor.forceString ? null : safeJSONParse(raw);
      return {
        key: descriptor.key,
        label: descriptor.label,
        storageName: descriptor.storage,
        raw,
        parsed,
        forceString: Boolean(descriptor.forceString)
      };
    });
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

  function renderRegistration(registration, hasOfficialRecord) {
    const container = document.getElementById('registration-content');
    const badge = document.getElementById('registration-updated');
    if (!container || !badge) return;

    container.innerHTML = '';

    if (!registration || Object.keys(registration).length === 0) {
      badge.textContent = 'Sin datos';
      container.innerHTML = '<div class="empty-state">Aún no se ha completado un registro en este dispositivo.</div>';
      return;
    }

    badge.textContent = hasOfficialRecord ? 'Sincronizado' : 'Datos parciales';

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

  function renderProfile(profile) {
    const avatarImg = document.getElementById('profile-avatar');
    const fallbackEl = document.getElementById('profile-avatar-fallback');
    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const metaEl = document.getElementById('profile-meta');
    const badge = document.getElementById('profile-updated');
    if (!avatarImg || !fallbackEl || !nameEl || !emailEl || !metaEl || !badge) return;

    metaEl.innerHTML = '';

    if (!profile) {
      avatarImg.removeAttribute('src');
      avatarImg.style.display = 'none';
      fallbackEl.textContent = 'U';
      fallbackEl.setAttribute('aria-hidden', 'false');
      nameEl.textContent = 'Usuario Remeex';
      emailEl.textContent = 'Sin correo sincronizado';
      badge.textContent = 'Sin datos';
      return;
    }

    const displayName = profile.preferredName || profile.fullName || 'Usuario Remeex';
    const displayEmail = profile.email || 'Sin correo sincronizado';
    nameEl.textContent = displayName;
    emailEl.textContent = displayEmail;

    if (profile.avatarSrc) {
      avatarImg.src = profile.avatarSrc;
      avatarImg.style.display = 'block';
      fallbackEl.textContent = '';
      fallbackEl.setAttribute('aria-hidden', 'true');
    } else {
      avatarImg.removeAttribute('src');
      avatarImg.style.display = 'none';
      fallbackEl.textContent = profile.initials || 'U';
      fallbackEl.setAttribute('aria-hidden', 'false');
    }

    const documentLabel = profile.documentNumber
      ? [profile.documentType, profile.documentNumber].filter(Boolean).join(' ')
      : profile.documentType || '—';

    const metaEntries = [
      { label: 'Nombre legal', value: profile.fullName || '—' },
      { label: 'Nombre preferido', value: profile.preferredName || profile.fullName || '—' },
      { label: 'Alias o nickname', value: profile.nickname || '—' },
      { label: 'Correo principal', value: profile.email || '—' },
      { label: 'Documento de identidad', value: documentLabel || '—' },
      { label: 'País de registro', value: profile.country || '—' },
      { label: 'Teléfono de contacto', value: profile.phone || '—' },
      { label: 'Fecha de nacimiento', value: formatDateDetail(profile.birthDate) },
      { label: 'Sexo / género', value: profile.gender || '—' },
      { label: 'ID de dispositivo', value: profile.deviceId || '—' },
      { label: 'Registro completado', value: formatDateDetail(profile.createdAt) }
    ];

    if (profile.sessionRate) {
      const sessionDisplay =
        typeof profile.sessionRate === 'object'
          ? JSON.stringify(profile.sessionRate, null, 2)
          : String(profile.sessionRate);
      metaEntries.push({ label: 'Contexto de tasa de sesión', value: sessionDisplay });
    }

    metaEntries.forEach((entry) => {
      if (entry.value === null || entry.value === undefined || entry.value === '') {
        entry.value = '—';
      }
      const item = document.createElement('div');
      item.className = 'meta-item';
      const label = document.createElement('span');
      label.className = 'meta-label';
      label.textContent = entry.label;
      const value = document.createElement('span');
      value.className = 'meta-value';
      value.textContent = entry.value;
      item.appendChild(label);
      item.appendChild(value);
      metaEl.appendChild(item);
    });

    const hasPrimaryData =
      Boolean(profile.avatarSrc) ||
      Boolean(profile.fullName) ||
      Boolean(profile.email) ||
      Boolean(profile.documentNumber) ||
      Boolean(profile.phone);

    badge.textContent = hasPrimaryData ? 'Sincronizado' : 'Datos parciales';
  }

  function renderRegistrationSnapshots(snapshots) {
    const container = document.getElementById('registration-snapshots');
    const badge = document.getElementById('registration-snapshots-badge');
    if (!container || !badge) return;

    container.innerHTML = '';

    if (!Array.isArray(snapshots) || snapshots.length === 0) {
      container.innerHTML = '<div class="empty-state">No se detectaron fuentes de datos de registro.</div>';
      badge.textContent = 'Sin datos';
      return;
    }

    let sourcesWithData = 0;

    snapshots.forEach((snapshot) => {
      const details = document.createElement('details');
      details.className = 'raw-entry';
      if (snapshot.key === 'visaRegistrationCompleted') {
        details.open = true;
      }

      const summary = document.createElement('summary');
      summary.textContent = snapshot.label;
      details.appendChild(summary);

      const meta = document.createElement('div');
      meta.className = 'raw-meta';
      meta.textContent = `Fuente: ${snapshot.storageName}`;
      details.appendChild(meta);

      if (snapshot.raw && snapshot.raw !== '') {
        sourcesWithData += 1;
        const pre = document.createElement('pre');
        pre.className = 'info-value info-value-block raw-json';
        if (snapshot.parsed && typeof snapshot.parsed === 'object') {
          pre.textContent = JSON.stringify(snapshot.parsed, null, 2);
        } else {
          pre.textContent = snapshot.raw;
        }
        details.appendChild(pre);
      } else {
        const empty = document.createElement('div');
        empty.className = 'raw-empty';
        empty.textContent = 'Sin datos almacenados para esta fuente.';
        details.appendChild(empty);
      }

      container.appendChild(details);
    });

    badge.textContent = `${sourcesWithData}/${snapshots.length} fuentes con datos`;
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

  function renderAccountLevel(accountInfo) {
    const tierEl = document.getElementById('account-level-tier');
    const summaryEl = document.getElementById('account-level-summary');
    const balanceEl = document.getElementById('account-level-balance');
    const pointsEl = document.getElementById('account-level-points');
    const usdEl = document.getElementById('account-validation-usd');
    const bsEl = document.getElementById('account-validation-bs');
    const eurEl = document.getElementById('account-validation-eur');
    const noteEl = document.getElementById('account-validation-note');
    if (!tierEl || !summaryEl || !balanceEl || !pointsEl || !usdEl || !bsEl || !eurEl || !noteEl) {
      return;
    }

    if (!accountInfo) {
      tierEl.textContent = 'Nivel no disponible';
      summaryEl.textContent = 'Sin datos sincronizados.';
      balanceEl.textContent = '--';
      pointsEl.textContent = '--';
      usdEl.textContent = '--';
      bsEl.textContent = '--';
      eurEl.textContent = '--';
      noteEl.textContent = 'Los montos de validación aparecerán cuando se detecte tu nivel.';
      return;
    }

    tierEl.textContent = accountInfo.tier ? `Nivel ${accountInfo.tier}` : 'Nivel no disponible';

    const summaryParts = [];
    if (accountInfo.tierSource) {
      summaryParts.push(accountInfo.tierSource);
    }
    const rateParts = [];
    if (Number.isFinite(accountInfo.usdToBs)) {
      rateParts.push(`1 USD = ${formatNumber(accountInfo.usdToBs)} Bs`);
    }
    if (Number.isFinite(accountInfo.usdToEur)) {
      rateParts.push(`1 USD = ${formatNumber(accountInfo.usdToEur, { maximumFractionDigits: 4 })} €`);
    }
    if (rateParts.length) {
      summaryParts.push(rateParts.join(' · '));
    }
    summaryEl.textContent = summaryParts.length ? summaryParts.join(' · ') : 'Sin datos sincronizados.';

    const balanceParts = [];
    if (Number.isFinite(accountInfo.balanceUsd)) {
      balanceParts.push(formatCurrency(accountInfo.balanceUsd, 'usd'));
    }
    if (Number.isFinite(accountInfo.balanceBs)) {
      balanceParts.push(formatCurrency(accountInfo.balanceBs, 'bs'));
    }
    if (Number.isFinite(accountInfo.balanceEur)) {
      balanceParts.push(formatCurrency(accountInfo.balanceEur, 'eur'));
    }
    balanceEl.textContent = balanceParts.length ? balanceParts.join(' · ') : '--';

    if (accountInfo.points !== null && accountInfo.points !== undefined) {
      pointsEl.textContent = `${formatNumber(accountInfo.points, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts`;
    } else {
      pointsEl.textContent = '—';
    }

    usdEl.textContent = Number.isFinite(accountInfo.validationUsd)
      ? formatCurrency(accountInfo.validationUsd, 'usd')
      : '--';
    bsEl.textContent = Number.isFinite(accountInfo.validationBs)
      ? formatCurrency(accountInfo.validationBs, 'bs')
      : '--';
    eurEl.textContent = Number.isFinite(accountInfo.validationEur)
      ? formatCurrency(accountInfo.validationEur, 'eur')
      : '--';

    const validation = accountInfo.validation || {};
    const noteParts = [];
    noteParts.push(`Monto base: ${formatCurrency(validation.base || VALIDATION_AMOUNTS_BY_TIER[accountInfo.tier] || 25, 'usd')}.`);
    if (validation.forced) {
      noteParts.push('Se aplica un monto de validación forzado manualmente.');
    }
    if (validation.bcvsurcharge) {
      noteParts.push('Incluye recargo de +5 USD por operar con la tasa BCV.');
    }
    if (validation.discountApplied && Number.isFinite(validation.discountValue)) {
      noteParts.push(`Descuento promocional aplicado: -${formatCurrency(validation.discountValue, 'usd')}.`);
    }
    if (Number.isFinite(validation.commission)) {
      const percentage = (validation.commission * 100).toFixed(1).replace(/\.0$/, '');
      noteParts.push(`Ajuste por comisión pendiente de ${percentage}%.`);
    }
    if (noteParts.length === 1) {
      noteParts.push('No se detectaron ajustes adicionales.');
    }
    noteEl.textContent = noteParts.join(' ');
  }

  function renderBalanceHistory(history) {
    const badge = document.getElementById('balance-history-badge');
    const statsContainer = document.getElementById('balance-history-stats');
    const tableWrapper = document.getElementById('balance-history-table-wrapper');
    const tableBody = document.getElementById('balance-history-body');
    const emptyState = document.getElementById('balance-history-empty');
    const hint = document.getElementById('balance-history-hint');
    if (!badge || !statsContainer || !tableWrapper || !tableBody || !emptyState || !hint) {
      return;
    }

    statsContainer.innerHTML = '';
    tableBody.innerHTML = '';

    if (!Array.isArray(history) || history.length === 0) {
      badge.textContent = 'Sin datos';
      emptyState.hidden = false;
      tableWrapper.hidden = true;
      hint.hidden = true;
      return;
    }

    badge.textContent = `${history.length} puntos`;
    emptyState.hidden = true;
    tableWrapper.hidden = false;
    hint.hidden = false;

    const latestEntry = history[history.length - 1];
    const latestLabel = latestEntry && Number.isFinite(latestEntry.timestampMs)
      ? formatTimestamp(latestEntry.timestampMs)
      : 'sin fecha';
    hint.textContent = `Último movimiento registrado: ${latestLabel}. Exporta los ${history.length} puntos para tus gráficos.`;

    const stats = computeHistoryStats(history);
    if (stats) {
      const statItems = [
        {
          label: 'Saldo máximo',
          value: formatCurrency(stats.max.balanceUsd, 'usd'),
          meta: stats.max.timestampMs ? formatTimestamp(stats.max.timestampMs) : '—'
        },
        {
          label: 'Saldo mínimo',
          value: formatCurrency(stats.min.balanceUsd, 'usd'),
          meta: stats.min.timestampMs ? formatTimestamp(stats.min.timestampMs) : '—'
        },
        {
          label: 'Variación total',
          value: stats.variation !== null ? formatCurrency(stats.variation, 'usd') : '--',
          meta: `${formatCurrency(stats.first.balanceUsd, 'usd')} → ${formatCurrency(stats.last.balanceUsd, 'usd')}`
        }
      ];
      if (Number.isFinite(stats.average)) {
        statItems.push({
          label: 'Saldo promedio',
          value: formatCurrency(stats.average, 'usd'),
          meta: `${stats.count} puntos analizados`
        });
      }
      statItems.forEach((item) => {
        const stat = document.createElement('div');
        stat.className = 'history-stat';
        const label = document.createElement('span');
        label.className = 'history-stat-label';
        label.textContent = item.label;
        const value = document.createElement('span');
        value.className = 'history-stat-value';
        value.textContent = item.value;
        const meta = document.createElement('span');
        meta.className = 'history-stat-meta';
        meta.textContent = item.meta;
        stat.appendChild(label);
        stat.appendChild(value);
        stat.appendChild(meta);
        statsContainer.appendChild(stat);
      });
    } else {
      const fallback = document.createElement('p');
      fallback.className = 'history-hint';
      fallback.textContent = 'Aún no hay suficientes datos para calcular máximos y mínimos.';
      statsContainer.appendChild(fallback);
    }

    history
      .slice()
      .sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0))
      .slice(0, 25)
      .forEach((entry) => {
        const row = document.createElement('tr');

        const dateCell = document.createElement('td');
        dateCell.textContent = Number.isFinite(entry.timestampMs) ? formatTimestamp(entry.timestampMs) : '—';
        row.appendChild(dateCell);

        const balanceCell = document.createElement('td');
        const usdLine = document.createElement('div');
        usdLine.textContent = formatCurrency(entry.balanceUsd, 'usd');
        balanceCell.appendChild(usdLine);
        if (Number.isFinite(entry.balanceBs)) {
          const bsLine = document.createElement('div');
          bsLine.className = 'history-balance-secondary';
          bsLine.textContent = formatCurrency(entry.balanceBs, 'bs');
          balanceCell.appendChild(bsLine);
        }
        if (Number.isFinite(entry.balanceEur)) {
          const eurLine = document.createElement('div');
          eurLine.className = 'history-balance-secondary';
          eurLine.textContent = formatCurrency(entry.balanceEur, 'eur');
          balanceCell.appendChild(eurLine);
        }
        row.appendChild(balanceCell);

        const deltaCell = document.createElement('td');
        if (Number.isFinite(entry.deltaUsd)) {
          deltaCell.textContent = formatCurrency(entry.deltaUsd, 'usd');
          if (entry.deltaUsd > 0) {
            deltaCell.classList.add('history-delta-positive');
          } else if (entry.deltaUsd < 0) {
            deltaCell.classList.add('history-delta-negative');
          }
        } else {
          deltaCell.textContent = '—';
        }
        row.appendChild(deltaCell);

        const detailCell = document.createElement('td');
        const detailParts = [];
        if (entry.note) detailParts.push(entry.note);
        if (entry.source) detailParts.push(`Fuente: ${entry.source}`);
        detailCell.textContent = detailParts.length ? detailParts.join(' · ') : '—';
        row.appendChild(detailCell);

        if (Number.isFinite(entry.timestampMs)) {
          row.dataset.timestamp = String(entry.timestampMs);
        }
        row.dataset.balanceUsd = String(entry.balanceUsd);
        tableBody.appendChild(row);
      });
  }

  function renderSessionMonitor(monitor) {
    const indicator = document.getElementById('session-monitor-indicator');
    const statusText = document.getElementById('session-monitor-status-text');
    const badge = document.getElementById('session-monitor-badge');
    const metaContainer = document.getElementById('session-monitor-meta');
    const historyWrapper = document.getElementById('session-monitor-history-wrapper');
    const historyBody = document.getElementById('session-monitor-history');
    const emptyState = document.getElementById('session-monitor-empty');
    if (!indicator || !statusText || !badge || !metaContainer || !historyWrapper || !historyBody || !emptyState) {
      return;
    }

    metaContainer.innerHTML = '';
    historyBody.innerHTML = '';

    const hasMonitor = monitor && typeof monitor === 'object';
    const isOnline = hasMonitor && monitor.isOnline === true;

    indicator.classList.toggle('online', Boolean(isOnline));
    indicator.classList.toggle('offline', !isOnline);
    statusText.textContent = hasMonitor
      ? isOnline
        ? 'En línea'
        : 'Desconectado'
      : 'Sin datos de sesión.';

    const badgeTimestamp = hasMonitor
      ? formatDateMeta(monitor.lastSeenAt || monitor.updatedAt || monitor.lastLoginAt)
      : '';
    if (!hasMonitor) {
      badge.textContent = 'Sin datos';
    } else if (isOnline) {
      badge.textContent = badgeTimestamp ? `Activo · ${badgeTimestamp}` : 'Activo';
    } else if (badgeTimestamp) {
      badge.textContent = `Actualizado ${badgeTimestamp}`;
    } else {
      badge.textContent = 'Actualizado';
    }

    if (!hasMonitor) {
      historyWrapper.hidden = true;
      emptyState.hidden = false;
      emptyState.textContent = 'No se ha registrado historial de inicio de sesión.';
      return;
    }

    const metaEntries = [];
    const user = monitor.user || {};
    const userParts = [];
    if (user.fullName) userParts.push(user.fullName);
    if (user.email) userParts.push(user.email);
    if (userParts.length) {
      metaEntries.push({ label: 'Usuario', value: userParts.join(' · ') });
    }

    const lastLogin = formatDateDetail(monitor.lastLoginAt || monitor.lastLogin || monitor.lastLoginTime);
    if (lastLogin && lastLogin !== '—') {
      metaEntries.push({ label: 'Último inicio de sesión', value: lastLogin });
    }

    const lastSeen = formatDateDetail(monitor.lastSeenAt || monitor.lastActivityAt || monitor.updatedAt);
    if (lastSeen && lastSeen !== '—') {
      metaEntries.push({ label: 'Última actividad', value: lastSeen });
    }

    const lastLogout = formatDateDetail(monitor.lastLogoutAt || monitor.lastLogout || monitor.lastOfflineAt);
    if (lastLogout && lastLogout !== '—') {
      metaEntries.push({ label: 'Último cierre de sesión', value: lastLogout });
    }

    const sessionId = monitor.currentSessionId || monitor.sessionId || monitor.lastSessionId;
    if (sessionId) {
      metaEntries.push({ label: 'ID de sesión', value: sessionId });
    }

    const deviceInfo = monitor.deviceInfo || {};
    const deviceParts = [];
    if (deviceInfo.platform) deviceParts.push(deviceInfo.platform);
    if (deviceInfo.language) deviceParts.push(deviceInfo.language);
    if (deviceInfo.userAgent) deviceParts.push(deviceInfo.userAgent);
    if (deviceParts.length) {
      metaEntries.push({ label: 'Dispositivo', value: deviceParts.join(' · ') });
    }

    const locationInfo = monitor.location || monitor.lastLocation;
    if (locationInfo) {
      if (typeof locationInfo === 'string') {
        metaEntries.push({ label: 'Ubicación', value: locationInfo });
      } else if (typeof locationInfo === 'object') {
        const locationParts = [];
        if (locationInfo.city) locationParts.push(locationInfo.city);
        if (locationInfo.region) locationParts.push(locationInfo.region);
        if (locationInfo.country) locationParts.push(locationInfo.country);
        if (locationInfo.ip) locationParts.push(`IP ${locationInfo.ip}`);
        if (locationParts.length) {
          metaEntries.push({ label: 'Ubicación', value: locationParts.join(' · ') });
        }
      }
    }

    if (metaEntries.length === 0) {
      const emptyMeta = document.createElement('div');
      emptyMeta.className = 'info-item';
      const label = document.createElement('span');
      label.className = 'info-label';
      label.textContent = 'Detalles de sesión';
      const value = document.createElement('span');
      value.className = 'info-value';
      value.textContent = 'Sin detalles adicionales disponibles.';
      emptyMeta.appendChild(label);
      emptyMeta.appendChild(value);
      metaContainer.appendChild(emptyMeta);
    } else {
      metaEntries.forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'info-item';
        const label = document.createElement('span');
        label.className = 'info-label';
        label.textContent = entry.label;
        const value = document.createElement('span');
        value.className = 'info-value';
        value.textContent = entry.value;
        item.appendChild(label);
        item.appendChild(value);
        metaContainer.appendChild(item);
      });
    }

    const history = Array.isArray(monitor.history) ? monitor.history.slice(0) : [];
    const mappedHistory = history
      .map((entry) => {
        const timestamp = entry?.at || entry?.timestamp || entry?.date || entry?.time;
        return {
          timestamp,
          type: entry?.type,
          label: SESSION_EVENT_LABELS[entry?.type] || entry?.label || entry?.type || 'Evento',
          reason: entry?.reason || entry?.message || entry?.detail || entry?.details,
          sessionId: entry?.sessionId || entry?.id || entry?.session,
          raw: entry
        };
      })
      .filter((entry) => entry.timestamp || entry.reason || entry.sessionId || entry.label);

    if (mappedHistory.length === 0) {
      historyWrapper.hidden = true;
      emptyState.hidden = false;
      emptyState.textContent = 'No se ha registrado historial de inicio de sesión.';
      return;
    }

    mappedHistory
      .sort((a, b) => {
        const aTime = Date.parse(a.timestamp) || 0;
        const bTime = Date.parse(b.timestamp) || 0;
        return bTime - aTime;
      })
      .slice(0, 15)
      .forEach((entry) => {
        const row = document.createElement('tr');

        const dateCell = document.createElement('td');
        dateCell.textContent = formatTimestamp(entry.timestamp);
        row.appendChild(dateCell);

        const typeCell = document.createElement('td');
        typeCell.textContent = entry.label;
        row.appendChild(typeCell);

        const detailCell = document.createElement('td');
        const details = [];
        if (entry.sessionId) {
          details.push(`Sesión ${entry.sessionId}`);
        }
        if (entry.reason) {
          details.push(entry.reason);
        }
        if (entry.raw && entry.raw.source) {
          details.push(entry.raw.source);
        }
        if (entry.raw && entry.raw.context) {
          details.push(entry.raw.context);
        }
        detailCell.textContent = details.length ? details.join(' · ') : '—';
        row.appendChild(detailCell);

        historyBody.appendChild(row);
      });

    historyWrapper.hidden = false;
    emptyState.hidden = true;
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
    const registrationTemp = loadRegistrationTemp();
    const userData = loadUserData();
    const verification = loadVerificationData();
    const banking = loadVerificationBanking();
    const rate = getRateInfo();
    const balance = loadBalance();
    const transactions = loadTransactions();
    const sessionMonitor = loadSessionMonitor();
    const balanceHistoryRecords = loadBalanceHistoryRecords();

    const combinedRegistration = Object.assign(
      {},
      registrationTemp && typeof registrationTemp === 'object' ? registrationTemp : {},
      userData && typeof userData === 'object' ? userData : {},
      verification && typeof verification === 'object' ? verification : {},
      banking && typeof banking === 'object' ? banking : {},
      registration && typeof registration === 'object' ? registration : {}
    );

    const profile = gatherProfileInfo(registration, userData, verification, banking, registrationTemp);
    const snapshots = collectRegistrationSnapshots();
    const exchangeRates = resolveExchangeRates(rate, profile.sessionRate);
    const accountInfo = resolveAccountInfo(balance, exchangeRates);
    const history = buildBalanceHistory(balanceHistoryRecords, balance, transactions, exchangeRates);

    renderProfile(profile);
    renderRegistration(combinedRegistration, Boolean(registration));
    renderRegistrationSnapshots(snapshots);
    renderRate(rate);
    renderBalance(balance);
    renderAccountLevel(accountInfo);
    renderBalanceHistory(history);
    renderSessionMonitor(sessionMonitor);
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
    'visaRegistrationTemp',
    'visaUserData',
    'remeexVerificationData',
    'remeexVerificationBanking',
    'remeexIdentityDetails',
    'remeexIdentityDocuments',
    'remeexProfilePhoto',
    'remeexDeviceId',
    'remeexBalance',
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
    'discountUsed'
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

  if (typeof sessionStorage !== 'undefined') {
    const originalSessionSetItem = sessionStorage.setItem ? sessionStorage.setItem.bind(sessionStorage) : null;
    if (originalSessionSetItem) {
      sessionStorage.setItem = function (key, value) {
        originalSessionSetItem(key, value);
        if (watchedKeys.has(key)) {
          scheduleRefresh(10);
        }
      };
    }

    const originalSessionRemoveItem = sessionStorage.removeItem ? sessionStorage.removeItem.bind(sessionStorage) : null;
    if (originalSessionRemoveItem) {
      sessionStorage.removeItem = function (key) {
        originalSessionRemoveItem(key);
        if (watchedKeys.has(key)) {
          scheduleRefresh(10);
        }
      };
    }
  }
})();
