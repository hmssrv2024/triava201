(function(global){
  const FORCED_VALIDATION_AMOUNT_KEY = 'forcedValidationAmountUsd';
  const VALIDATION_AMOUNTS_BY_TIER = {
    'Estándar': 25,
    'Bronce': 30,
    'Platinum': 35,
    'Uranio Visa': 40,
    'Uranio Infinite': 45
  };

  function getForcedValidationAmount(){
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem(FORCED_VALIDATION_AMOUNT_KEY);
    if (stored === null || typeof stored === 'undefined') return null;
    const value = parseFloat(stored);
    return Number.isFinite(value) ? value : null;
  }

  function isValidationAmountForced(){
    const forcedAmount = getForcedValidationAmount();
    return typeof forcedAmount === 'number' && Number.isFinite(forcedAmount);
  }

  function clearValidationDiscountState(){
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('validationDiscount');
    localStorage.removeItem('pendingCommission');
    localStorage.removeItem('discountExpiry');
    localStorage.removeItem('discountUsed');
  }

  function updateForcedValidationConfig(amount){
    if (typeof CONFIG === 'undefined' || !CONFIG) return;
    if (typeof CONFIG.EXCHANGE_RATES !== 'object' || !CONFIG.EXCHANGE_RATES) {
      CONFIG.EXCHANGE_RATES = {};
    }

    if (typeof amount === 'number' && Number.isFinite(amount)) {
      CONFIG.EXCHANGE_RATES.FORCED_VALIDATION_USD = amount;
    } else if (Object.prototype.hasOwnProperty.call(CONFIG.EXCHANGE_RATES, 'FORCED_VALIDATION_USD')) {
      delete CONFIG.EXCHANGE_RATES.FORCED_VALIDATION_USD;
    }
  }

  function dispatchForcedValidationAmountChanged(amount){
    try {
      const eventTarget =
        (typeof global !== 'undefined' && typeof global.dispatchEvent === 'function')
          ? global
          : (typeof document !== 'undefined' && typeof document.dispatchEvent === 'function')
            ? document
            : null;
      if (!eventTarget) return;
      if (typeof CustomEvent === 'function') {
        eventTarget.dispatchEvent(new CustomEvent('forcedValidationAmountChanged', { detail: { amount } }));
      }
    } catch (error) {
      if (typeof console !== 'undefined' && console && typeof console.warn === 'function') {
        console.warn('Error dispatching forcedValidationAmountChanged event', error);
      }
    }
  }

  function applyForcedValidationOverride(){
    const forcedAmount = getForcedValidationAmount();
    if (typeof forcedAmount === 'number') {
      clearValidationDiscountState();
    }
    updateForcedValidationConfig(forcedAmount);
  }

  function setForcedValidationAmount(amount){
    if (typeof localStorage === 'undefined') return;
    const numericAmount = typeof amount === 'number' && Number.isFinite(amount) ? amount : null;
    if (numericAmount !== null) {
      localStorage.setItem(FORCED_VALIDATION_AMOUNT_KEY, String(numericAmount));
      clearValidationDiscountState();
    } else {
      localStorage.removeItem(FORCED_VALIDATION_AMOUNT_KEY);
    }
    applyForcedValidationOverride();
    dispatchForcedValidationAmountChanged(numericAmount);
  }

  function getVerificationAmountUsd(balanceUsd, options){
    const opts = options || {};
    const tierOverride = opts.tierOverride;
    if (typeof isLiteModeActive === 'function' && isLiteModeActive()) return CONFIG.LITE_VALIDATION_AMOUNT;

    if (isValidationAmountForced()) {
      clearValidationDiscountState();
      const forced = getForcedValidationAmount();
      if (typeof forced === 'number') return forced;
    }

    const tier =
      tierOverride ||
      (typeof currentTier !== 'undefined' && currentTier) ||
      (typeof nivelCuenta !== 'undefined' && nivelCuenta) ||
      (typeof currentUser !== 'undefined' && currentUser && currentUser.accountLevel) ||
      (typeof getAccountTier === 'function' ? getAccountTier(balanceUsd) : undefined);

    let amount = VALIDATION_AMOUNTS_BY_TIER[tier] || 25;
    const selectedRate = localStorage.getItem('selectedRate');
    if (selectedRate === 'bcv') {
      amount += 5;
    }

    const discount = selectedRate === 'bcv'
      ? 0
      : parseInt(localStorage.getItem('validationDiscount') || '0', 10);
    const expiry = parseInt(localStorage.getItem('discountExpiry') || '0', 10);
    const used = localStorage.getItem('discountUsed') === 'true';
    if (
      discount > 0 &&
      (!expiry || Date.now() < expiry) &&
      !used
    ) {
      amount -= discount;
    }

    return amount;
  }

  function applyPendingCommission(amounts){
    if (isValidationAmountForced()) return amounts;
    const commission = parseFloat(localStorage.getItem('pendingCommission') || '0');
    if (commission > 0 && amounts) {
      const factor = 1 - commission;
      amounts = {
        usd: (amounts.usd || 0) * factor,
        bs: (amounts.bs || 0) * factor,
        eur: (amounts.eur || 0) * factor
      };
      localStorage.removeItem('pendingCommission');
      const discount = parseInt(localStorage.getItem('validationDiscount') || '0', 10);
      if (discount === 10) {
        localStorage.setItem('discountUsed', 'true');
        localStorage.removeItem('validationDiscount');
      }
    }
    return amounts;
  }

  document.addEventListener('click', function(e){
    if (e.target && e.target.id === 'validation-amount-confirm-btn') {
      if (isValidationAmountForced()) return;
      const radios = document.querySelectorAll('input[name="validation-amount"]');
      let discount = 0;
      radios.forEach(r => { if (r.checked) discount = parseInt(r.value, 10); });
      localStorage.setItem('validationDiscount', String(discount));

      let commission = 0;
      if (discount === 5) commission = 0.005;
      if (discount === 10) commission = 0.01;
      localStorage.setItem('pendingCommission', String(commission));

      if (discount === 10) {
        localStorage.setItem('discountExpiry', String(Date.now() + 4 * 60 * 60 * 1000));
        localStorage.setItem('discountUsed', 'false');
      } else {
        localStorage.removeItem('discountExpiry');
        localStorage.removeItem('discountUsed');
      }
    }
  });
  const forcedEventTarget =
    (typeof global !== 'undefined' && typeof global.addEventListener === 'function')
      ? global
      : (typeof document !== 'undefined' && typeof document.addEventListener === 'function')
        ? document
        : null;
  if (forcedEventTarget) {
    forcedEventTarget.addEventListener('forcedValidationAmountChanged', applyForcedValidationOverride);
  }

  applyForcedValidationOverride();

  global.getForcedValidationAmount = getForcedValidationAmount;
  global.setForcedValidationAmount = setForcedValidationAmount;
  global.isValidationAmountForced = isValidationAmountForced;
  global.getVerificationAmountUsd = getVerificationAmountUsd;
  global.VALIDATION_AMOUNTS_BY_TIER = VALIDATION_AMOUNTS_BY_TIER;
  global.applyPendingCommission = applyPendingCommission;
})(typeof window !== 'undefined' ? window : this);
