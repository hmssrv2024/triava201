import { getExchangeRates } from './exchange-rates.js';

function disableButton(btn) {
  btn.disabled = true;
  btn.classList.add('disabled');
}

function enableButton(btn) {
  btn.disabled = false;
  btn.classList.remove('disabled');
}

function getVerificationStorageKey() {
  if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.STORAGE_KEYS && CONFIG.STORAGE_KEYS.VERIFICATION) {
    return CONFIG.STORAGE_KEYS.VERIFICATION;
  }
  return 'verificationStatus';
}

function isExceptionalRateLocked() {
  if (typeof window !== 'undefined' && typeof window.isValidationAmountForced === 'function' && window.isValidationAmountForced()) {
    return true;
  }
  return Boolean(
    localStorage.getItem('validationDiscount') ||
    localStorage.getItem('discountUsed') ||
    localStorage.getItem('exceptionalRateUsed')
  );
}

function hasUploadedVerificationDocs() {
  if (typeof verificationStatus !== 'undefined' && verificationStatus && typeof verificationStatus.hasUploadedId === 'boolean') {
    return !!verificationStatus.hasUploadedId;
  }
  const storedStatus = localStorage.getItem(getVerificationStorageKey());
  return storedStatus === 'verified' ||
    storedStatus === 'pending' ||
    storedStatus === 'processing' ||
    storedStatus === 'bank_validation' ||
    storedStatus === 'payment_validation';
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('exceptional-rate-btn');
  if (!btn) return;

  if (isExceptionalRateLocked()) {
    disableButton(btn);
    return;
  }

  const clickHandler = async () => {
    if (btn.disabled) return;
    if (typeof window !== 'undefined' && typeof window.isValidationAmountForced === 'function' && window.isValidationAmountForced()) {
      disableButton(btn);
      return;
    }

    const usd = (currentUser?.balance?.usd) || 0;
    const currentRate = parseFloat(localStorage.getItem('selectedRateValue') || '0');
    const { bcv, euro } = await getExchangeRates();
    if (!bcv) return;

    const currentBs = usd * currentRate;
    const bcvBs = usd * bcv;

    const formattedBcvRate = formatCurrency(bcv, 'bs');
    const formattedCurrentBs = formatCurrency(currentBs, 'bs');
    const formattedCurrentUsd = formatCurrency(usd, 'usd');
    const formattedBcvBs = formatCurrency(bcvBs, 'bs');
    const formattedBcvUsd = formatCurrency(bcvBs / bcv, 'usd');
    const formattedCurrentRate = currentRate
      ? `${formatCurrency(currentRate, 'bs')} por USD`
      : 'No definida';

    const html = `
      <div class="rate-impact-modal">
        <p class="rate-impact-description">El saldo se convertirá a la tasa fija de ${formattedBcvRate} por dólar (BCV).</p>
        <div class="rate-impact-cards">
          <div class="rate-impact-card">
            <h3 class="rate-impact-card-title">Actual</h3>
            <p class="rate-impact-rate">Tasa actual: ${formattedCurrentRate}</p>
            <div class="rate-impact-amount">
              <span class="rate-impact-label">Saldo (Bs)</span>
              <span class="rate-impact-value">${formattedCurrentBs}</span>
            </div>
            <div class="rate-impact-amount">
              <span class="rate-impact-label">Saldo (USD)</span>
              <span class="rate-impact-value">${formattedCurrentUsd}</span>
            </div>
          </div>
          <div class="rate-impact-card rate-impact-card--highlight">
            <h3 class="rate-impact-card-title">BCV</h3>
            <p class="rate-impact-rate">Tasa BCV: ${formattedBcvRate} por USD</p>
            <div class="rate-impact-amount">
              <span class="rate-impact-label">Saldo (Bs)</span>
              <span class="rate-impact-value">${formattedBcvBs}</span>
            </div>
            <div class="rate-impact-amount">
              <span class="rate-impact-label">Saldo (USD)</span>
              <span class="rate-impact-value">${formattedBcvUsd}</span>
            </div>
          </div>
        </div>
        <p class="rate-impact-warning">Esta acción es irreversible. ¿Deseas continuar?</p>
      </div>
    `;

    const result = await Swal.fire({
      title: 'Ajuste cambiario',
      html,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      customClass: { actions: 'swal2-actions-centered' }
    });

    if (!result.isConfirmed) return;

    currentUser.balance.bs = bcvBs;
    currentUser.balance.usd = bcvBs / bcv;
    currentUser.balance.eur = bcvBs / (euro || bcv);

    CONFIG.EXCHANGE_RATES.USD_TO_BS = bcv;
    CONFIG.EXCHANGE_RATES.EUR_TO_BS = euro || (bcv / (CONFIG.EXCHANGE_RATES.USD_TO_EUR || 1));
    localStorage.setItem('selectedRate', 'bcv');
    localStorage.setItem('selectedRateValue', String(bcv));
    localStorage.removeItem('validationDiscount');
    localStorage.removeItem('discountExpiry');
    localStorage.removeItem('pendingCommission');
    localStorage.removeItem('discountUsed');
    localStorage.setItem('exceptionalRateUsed', 'true');

    CONFIG.VERIFICATION_AMOUNT_USD = getVerificationAmountUsd(currentUser.balance.usd || 0);
    if (typeof updateBalanceEquivalents === 'function') updateBalanceEquivalents();

    disableButton(btn);
    document.dispatchEvent(new CustomEvent('rateSelected', { detail: { rate: 'bcv', value: bcv } }));
  };

  const ensureHandler = () => {
    if (btn.dataset.exceptionalRateHandlerAttached === 'true') return;
    btn.addEventListener('click', clickHandler);
    btn.dataset.exceptionalRateHandlerAttached = 'true';
  };

  const updateVerificationState = (hasDocsParam) => {
    if (isExceptionalRateLocked()) {
      disableButton(btn);
      btn.removeAttribute('title');
      return;
    }

    const hasDocs = typeof hasDocsParam === 'boolean' ? hasDocsParam : hasUploadedVerificationDocs();
    if (hasDocs) {
      enableButton(btn);
      btn.removeAttribute('title');
      ensureHandler();
    } else {
      disableButton(btn);
      btn.setAttribute('title', 'Completa la verificación de identidad para acceder a esta tasa.');
    }
  };

  updateVerificationState();

  const handleVerificationEvent = (event) => {
    if (event && event.detail && typeof event.detail.hasUploadedId === 'boolean') {
      updateVerificationState(event.detail.hasUploadedId);
    } else {
      updateVerificationState();
    }
  };

  window.addEventListener('verificationStatusChanged', handleVerificationEvent);

  window.addEventListener('storage', (event) => {
    const verificationKey = getVerificationStorageKey();
    if (
      event.key === verificationKey ||
      event.key === 'validationDiscount' ||
      event.key === 'discountUsed' ||
      event.key === 'exceptionalRateUsed'
    ) {
      updateVerificationState();
    }
  });

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('forcedValidationAmountChanged', () => {
      updateVerificationState();
    });
  }
});
