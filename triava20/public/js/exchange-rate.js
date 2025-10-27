(function(global) {
  const KEY = 'remeexSessionExchangeRate';
  let latestRates = null;

  async function updateExchangeRate() {
    try {
      const res = await fetch('https://api.exchangerate.host/latest?base=EUR&symbols=USD,VES');
      const data = await res.json();
      let eurToUsd;
      let eurToBs;
      if (data && typeof data === 'object') {
        const rates = data.rates;
        if (rates && typeof rates === 'object') {
          eurToUsd = rates.USD;
          eurToBs = rates.VES;
        }
      }
      if (typeof eurToUsd === 'number' && typeof eurToBs === 'number') {
        const usdToEur = 1 / eurToUsd;
        const usdToBs = eurToBs / eurToUsd;
        latestRates = { USD_TO_BS: usdToBs, USD_TO_EUR: usdToEur };
        const serialized = JSON.stringify(latestRates);
        safeSetItem(global.sessionStorage, KEY, serialized);
        safeSetItem(global.localStorage, KEY, serialized);
      }
    } catch (e) {}
  }
  updateExchangeRate();

  function parse(val) {
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
  }

  function safeGetItem(storage, key) {
    if (!storage || typeof storage.getItem !== 'function') return null;
    try {
      return storage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeSetItem(storage, key, value) {
    if (!storage || typeof storage.setItem !== 'function') return;
    try {
      storage.setItem(key, value);
    } catch (e) {}
  }

  function getStoredExchangeRate() {
    const stored = safeGetItem(global.sessionStorage, KEY) || safeGetItem(global.localStorage, KEY);
    if (stored) {
      const data = parse(stored);
      if (typeof data === 'number') {
        return { USD_TO_BS: data, USD_TO_EUR: latestRates ? latestRates.USD_TO_EUR : undefined };
      }
      if (data && typeof data.USD_TO_BS === 'number') {
        return {
          USD_TO_BS: data.USD_TO_BS,
          USD_TO_EUR:
            typeof data.USD_TO_EUR === 'number'
              ? data.USD_TO_EUR
              : latestRates
              ? latestRates.USD_TO_EUR
              : undefined
        };
      }
      const num = parseFloat(stored);
      if (!isNaN(num)) {
        return { USD_TO_BS: num, USD_TO_EUR: latestRates ? latestRates.USD_TO_EUR : undefined };
      }
    }
    try {
      const raw = safeGetItem(global.localStorage, 'visaRegistrationCompleted') || '{}';
      const reg = JSON.parse(raw);
      const code = reg.verificationCode || reg.securityCode || '';
      if (code.length >= 4) {
        const rate = parseInt(code.substring(0, 4), 10) / 10;
        if (!isNaN(rate)) {
          return { USD_TO_BS: rate, USD_TO_EUR: latestRates ? latestRates.USD_TO_EUR : undefined };
        }
      }
    } catch (e) {}
    return latestRates;
  }

  function applyStoredExchangeRate(target) {
    if (!target) return;
    const data = getStoredExchangeRate();
    if (data) {
      if ('USD_TO_BS' in target && typeof data.USD_TO_BS === 'number') target.USD_TO_BS = data.USD_TO_BS;
      if ('USD_TO_EUR' in target && typeof data.USD_TO_EUR === 'number') target.USD_TO_EUR = data.USD_TO_EUR;
    }
  }

  const api = {
    updateExchangeRate,
    getStoredExchangeRate,
    applyStoredExchangeRate
  };

  global.__exchangeRateUtils__ = api;
  global.getStoredExchangeRate = api.getStoredExchangeRate;
  global.applyStoredExchangeRate = api.applyStoredExchangeRate;
})(typeof window !== 'undefined' ? window : globalThis);
