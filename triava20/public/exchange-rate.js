(function(window) {
  const STORAGE_KEY = 'latinphone_usdt_rate';
  const STORAGE_TTL = 30 * 60 * 1000; // 30 minutes
  const DEFAULT_RATE = 225;

  let pendingPromise = null;

  function isLocalStorageAvailable() {
    try {
      const testKey = '__rate_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (err) {
      return false;
    }
  }

  const canUseStorage = typeof window !== 'undefined' && isLocalStorageAvailable();

  function readStoredRate() {
    if (!canUseStorage) return null;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed.rate !== 'number' || !isFinite(parsed.rate) || parsed.rate <= 0) {
        return null;
      }
      return parsed;
    } catch (err) {
      console.warn('No se pudo leer la tasa almacenada:', err);
      return null;
    }
  }

  function writeStoredRate(rate) {
    if (!canUseStorage) return;
    try {
      const payload = {
        rate: Number(rate),
        updatedAt: Date.now()
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('No se pudo guardar la tasa en localStorage:', err);
    }
  }

  function shouldRefresh(stored) {
    if (!stored) return true;
    if (typeof stored.updatedAt !== 'number') return true;
    return Date.now() - stored.updatedAt > STORAGE_TTL;
  }

  async function fetchLatestRate() {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();
    const vesRate = Number(data?.rates?.VES);

    if (!vesRate || !isFinite(vesRate)) {
      throw new Error('Respuesta inválida para VES');
    }

    let eurUsd = NaN;

    try {
      const eurResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT');
      const eurData = await eurResponse.json();
      eurUsd = parseFloat(eurData?.price);
    } catch (err) {
      console.warn('Error obteniendo EUR/USDT:', err);
    }

    const usdtRate = vesRate + 105;
    return {
      usdt: usdtRate,
      eur: !isNaN(eurUsd) && eurUsd > 0 ? usdtRate * eurUsd : usdtRate
    };
  }

  function resolveRate({ forceRefresh } = {}) {
    if (!forceRefresh && pendingPromise) {
      return pendingPromise;
    }

    pendingPromise = (async () => {
      const stored = readStoredRate();

      if (!forceRefresh && stored && !shouldRefresh(stored)) {
        return stored.rate;
      }

      try {
        const latest = await fetchLatestRate();
        writeStoredRate(latest.usdt);
        return latest.usdt;
      } catch (err) {
        console.warn('No se pudo obtener la tasa más reciente:', err);
        if (stored) {
          return stored.rate;
        }
        return DEFAULT_RATE;
      }
    })();

    return pendingPromise;
  }

  window.loadExchangeRate = function(options = {}) {
    return resolveRate(options);
  };

  window.saveExchangeRate = function(rate) {
    if (typeof rate !== 'number' || !isFinite(rate) || rate <= 0) return;
    writeStoredRate(rate);
  };

  window.getStoredExchangeRate = function() {
    const stored = readStoredRate();
    return stored ? stored.rate : null;
  };
})(window);
