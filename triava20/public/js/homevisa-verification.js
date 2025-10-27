(() => {
  if (typeof window === 'undefined') {
    return;
  }

  const PROCESSING_TIMEOUT = 600000; // 10 minutes
  const STORAGE_KEY = 'remeexVerificationProcessing';
  const VERIFICATION_STATUS_KEY = 'remeexVerificationStatus';
  const VERIFICATION_COMPLETION_TIME_KEY = 'remeexVerificationCompletionTime';
  const VERIFICATION_TALLY_KEY = 'remeexVerificationFinalForm';
  const RAFFLE_OVERLAY_KEY = 'raffleOverlayShown';
  const WITHDRAWAL_VERIFICATION_REQUIRED_KEY = 'remeexWithdrawalVerificationRequired';
  const TEMP_BLOCK_START_KEY = 'remeexTempBlockStart';
  const TEMP_BLOCK_EXPIRATION_MS = 6 * 60 * 60 * 1000; // 6 hours
  const VERIFICATION_FALLBACK_EXPIRATION_MS = 11 * 60 * 60 * 1000; // 11 hours
  const BLOCKED_ACCOUNT_URL = 'cuentabloqueada.html';
  const BLOCKED_ACCOUNT_TOKEN_KEY = 'remeexBlockedAccessToken';
  const BLOCKED_ACCOUNT_TOKEN_VALUE = 'allowed';
  const BLOCKED_ACCOUNT_URL_PARAM = 'entryToken';
  const SKIP_RECHARGE_FLAG_KEY = 'remeexSkipRechargeOptionUsed';
  const VERIFICATION_BIOMETRIC_SKIP_KEY = 'remeexVerificationBiometricSkipped';

  const markBlockedAccountAccess = () => {
    const globalAccess = window.RemeexBlockedAccess;
    if (globalAccess && typeof globalAccess.markAllowed === 'function') {
      globalAccess.markAllowed();
      return;
    }

    try {
      window.sessionStorage.setItem(BLOCKED_ACCOUNT_TOKEN_KEY, BLOCKED_ACCOUNT_TOKEN_VALUE);
    } catch (error) {}
  };

  const buildBlockedAccountUrl = () => {
    const globalAccess = window.RemeexBlockedAccess;
    if (globalAccess && typeof globalAccess.buildUrl === 'function') {
      return globalAccess.buildUrl(BLOCKED_ACCOUNT_URL);
    }

    try {
      const url = new URL(BLOCKED_ACCOUNT_URL, window.location.href);
      url.searchParams.set(BLOCKED_ACCOUNT_URL_PARAM, BLOCKED_ACCOUNT_TOKEN_VALUE);
      return url.toString();
    } catch (error) {
      return `${BLOCKED_ACCOUNT_URL}?${BLOCKED_ACCOUNT_URL_PARAM}=${encodeURIComponent(BLOCKED_ACCOUNT_TOKEN_VALUE)}`;
    }
  };

  const redirectToBlockedAccount = () => {
    markBlockedAccountAccess();
    window.location.replace(buildBlockedAccountUrl());
  };
  const PROGRESS_MESSAGES = [
    'Estamos verificando la nitidez de tus documentos.',
    'Aplicando controles de seguridad avanzados.',
    'Confirmando que la información coincida con tu perfil.',
    'Ultimando detalles para aprobar tu verificación.'
  ];

  const VALIDATION_ACTION_TIMEOUT_MS = 20 * 60 * 1000;
  const SIGNATURE_OVERLAY_FLAG_KEY = 'homevisaSignatureMismatchOverlayHandled';
  const SUCCESS_STATUS_VISIBLE_DURATION = 5 * 60 * 1000; // 5 minutes

  const isVerificationExpired = () => {
    const now = Date.now();

    try {
      const tempBlockValue = window.localStorage.getItem(TEMP_BLOCK_START_KEY);
      const tempBlockTime = Number.parseInt(tempBlockValue, 10);
      if (!Number.isNaN(tempBlockTime) && tempBlockTime > 0) {
        if (now - tempBlockTime >= TEMP_BLOCK_EXPIRATION_MS) {
          return true;
        }
      }
    } catch (error) {
      // If localStorage is inaccessible, silently ignore and continue.
    }

    try {
      const completionValue = window.localStorage.getItem(VERIFICATION_COMPLETION_TIME_KEY);
      if (!completionValue) {
        return false;
      }

      const completionTime = Number.parseInt(completionValue, 10);
      if (Number.isNaN(completionTime)) {
        return false;
      }

      if (now - completionTime >= VERIFICATION_FALLBACK_EXPIRATION_MS) {
        return true;
      }
    } catch (error) {
      // If localStorage is inaccessible, silently ignore and continue.
    }

    return false;
  };

  if (isVerificationExpired()) {
    redirectToBlockedAccount();
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    if (!loginButton) {
      return;
    }

    loginButton.addEventListener('click', event => {
      if (!isVerificationExpired()) {
        return;
      }

      event.preventDefault();
      redirectToBlockedAccount();
    });
  });

  let progressInterval = null;
  let verificationState = null;
  let raffleOverlayShown = false;

  const getElement = id => document.getElementById(id);

  const processingBanner = getElement('status-processing-card');
  const requestSection = getElement('status-request-verification');
  const finalSection = getElement('status-final');
  const progressContainer = getElement('verification-progress-container');
  const progressBar = getElement('verification-progress-bar');
  const progressPercent = getElement('verification-progress-percent');
  const processingText = getElement('verification-processing-text');
  const verificationTitle = getElement('verification-processing-title');
  const statusCards = getElement('verification-status-cards');
  const finalHeading = getElement('verification-final-heading');
  const docLabel = getElement('status-documents-label');
  const idValidatedInfo = getElement('id-validated-info');
  const bankLabel = getElement('status-bank-label');
  const bankNameText = getElement('bank-name-text');
  const bankAccountText = getElement('bank-account-text');
  const bankLogoImg = getElement('bank-logo-mini');
  const signatureLabel = getElement('status-signature-label');
  const signatureBiometricLabel = getElement('signature-biometrics-label');
  const signatureBiometricItem = getElement('signature-biometrics-item');
  const signatureInfo = getElement('signature-mismatch-info');
  const signatureMismatchCard = getElement('status-signature-mismatch');
  const bankValidationCard = getElement('status-bank-validation');
  const documentsSuccessCard = getElement('status-documents');
  const bankSuccessCard = getElement('status-bank');
  const skipSummaryCard = getElement('status-skip-summary');
  const skipSummaryLabel = getElement('skip-summary-label');
  const skipSummaryMessage = getElement('skip-summary-message');
  const skipSummaryNote = getElement('skip-summary-note');
  const signatureMismatchOverlay = getElement('signature-mismatch-overlay');
  const signatureMismatchDescription = getElement('signature-mismatch-description');
  const signatureOverlayTitle = getElement('signature-mismatch-title');
  const signatureOverlayNote = signatureMismatchOverlay
    ? signatureMismatchOverlay.querySelector('.signature-overlay-note')
    : null;
  const DEFAULT_SIGNATURE_OVERLAY_TITLE = signatureOverlayTitle ? signatureOverlayTitle.textContent : '';
  const DEFAULT_SIGNATURE_OVERLAY_NOTE = signatureOverlayNote ? signatureOverlayNote.textContent : '';
  const signatureOverlayClose = getElement('signature-overlay-close');
  const signatureOverlayValidate = getElement('signature-overlay-validate');
  const signatureOverlayRetry = getElement('signature-overlay-retry');
  const finalStepText = getElement('final-step-text');
  const progressMusic = getElement('verificationProgressSound');
  const validationActionsContainer = getElement('validation-actions-container');
  const validationActionsToggle = getElement('validation-actions-toggle');
  const skipRechargeOverlay = getElement('skip-recharge-overlay');
  const skipRechargeClose = getElement('skip-recharge-close');
  const skipRechargeFeedback = getElement('skip-recharge-feedback');
  const skipRechargeFeedbackText = getElement('skip-recharge-feedback-text');
  const skipRechargeFeedbackClose = getElement('skip-recharge-feedback-close');
  const skipRechargeActions = getElement('skip-recharge-actions');
  const skipRechargeOption1 = getElement('skip-recharge-option-1');
  const skipRechargeOption2 = getElement('skip-recharge-option-2');
  const skipRechargeOption3 = getElement('skip-recharge-option-3');
  const skipRechargeModal = getElement('skip-recharge-modal');
  const skipRechargeContent = getElement('skip-recharge-content');
  if (progressMusic) {
    progressMusic.loop = true;
  }

  let isProgressMusicActive = false;
  let signatureOverlayHandled = false;
  let signatureOverlayPreviousFocus = null;
  let skipRechargeButton = null;
  let skipRechargePreviousFocus = null;
  let skipRechargeReturnFocus = null;
  let skipRechargeCanClose = false;

  let signatureCardDisabled = false;

  let inactivitySuppressionInterval = null;
  let inactivityModalObserver = null;
  const SIMULATED_ACTIVITY_INTERVAL = 10000;
  let successStatusVisibilityTimeout = null;
  let validationActionsTimer = null;

  const progressAudioTriggers = [
    { threshold: 3, element: getElement('verificationProgressAudio03'), played: false },
    { threshold: 75, element: getElement('verificationProgressAudio75'), played: false },
    { threshold: 91, element: getElement('verificationProgressAudio91'), played: false }
  ].filter(trigger => trigger.element);

  let currentProgressAudio = null;

  const PROGRESS_MUSIC_START_THRESHOLD = 1;

  const safeDisplay = (element, value) => {
    if (!element) return;
    element.style.display = value;
  };

  const setValidationActionsToggleVisibility = visible => {
    if (!validationActionsToggle) {
      return;
    }

    if (visible) {
      validationActionsToggle.removeAttribute('hidden');
    } else {
      validationActionsToggle.setAttribute('hidden', 'true');
    }
  };

  const updateValidationToggleText = collapsed => {
    if (!validationActionsToggle) {
      return;
    }

    validationActionsToggle.textContent = collapsed
      ? 'Ver más información'
      : 'Ocultar información';
  };

  const setValidationActionsCollapsed = collapsed => {
    if (!validationActionsContainer) {
      return;
    }

    validationActionsContainer.classList.toggle('is-collapsed', collapsed);
    validationActionsContainer.classList.toggle('is-expanded', !collapsed);
    validationActionsContainer.setAttribute('aria-hidden', collapsed ? 'true' : 'false');

    if (validationActionsToggle) {
      validationActionsToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      updateValidationToggleText(collapsed);
    }
  };

  const clearValidationActionsTimer = () => {
    if (validationActionsTimer) {
      window.clearTimeout(validationActionsTimer);
      validationActionsTimer = null;
    }
  };

  const startValidationActionsTimer = completionTime => {
    if (!validationActionsContainer || !validationActionsToggle) {
      return;
    }

    clearValidationActionsTimer();
    const baseTime = Number.isFinite(completionTime) ? completionTime : Date.now();
    const elapsed = Date.now() - baseTime;
    const remaining = VALIDATION_ACTION_TIMEOUT_MS - elapsed;

    if (remaining <= 0) {
      setValidationActionsCollapsed(true);
      if (typeof validationActionsToggle.focus === 'function') {
        validationActionsToggle.focus({ preventScroll: false });
      }
      return;
    }

    validationActionsTimer = window.setTimeout(() => {
      validationActionsTimer = null;
      setValidationActionsCollapsed(true);
      if (typeof validationActionsToggle.focus === 'function') {
        validationActionsToggle.focus({ preventScroll: false });
      }
    }, remaining);
  };

  const isPendingBankValidation = () => {
    return Boolean(
      verificationState &&
      verificationState.currentPhase === 'bank_validation'
    );
  };

  const focusFirstValidationAction = () => {
    if (!validationActionsContainer) {
      return;
    }

    const focusable = validationActionsContainer.querySelector(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );

    if (focusable && typeof focusable.focus === 'function') {
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {
          focusable.focus();
        });
        return;
      }

      focusable.focus();
    }
  };

  const handleValidationActionsToggle = event => {
    if (event) {
      event.preventDefault();
    }

    if (!validationActionsContainer) {
      return;
    }

    const isCollapsed = validationActionsContainer.classList.contains('is-collapsed');
    if (isCollapsed) {
      setValidationActionsCollapsed(false);
      if (isPendingBankValidation()) {
        startValidationActionsTimer();
      }
      focusFirstValidationAction();
      return;
    }

    setValidationActionsCollapsed(true);
    clearValidationActionsTimer();
  };

  const handleValidationActionsStateForFinalView = finalizationTime => {
    if (!validationActionsContainer || !validationActionsToggle) {
      return;
    }

    if (isPendingBankValidation()) {
      setValidationActionsToggleVisibility(true);
      clearValidationActionsTimer();
      setValidationActionsCollapsed(true);
      return;
    }

    clearValidationActionsTimer();
    setValidationActionsCollapsed(true);
    setValidationActionsToggleVisibility(false);
  };

  const resetValidationActionsForProcessing = () => {
    if (!validationActionsContainer || !validationActionsToggle) {
      return;
    }

    clearValidationActionsTimer();
    setValidationActionsCollapsed(true);
    setValidationActionsToggleVisibility(false);
  };

  const clearSuccessStatusVisibilityTimeout = () => {
    if (successStatusVisibilityTimeout) {
      window.clearTimeout(successStatusVisibilityTimeout);
      successStatusVisibilityTimeout = null;
    }
  };

  const showSuccessStatusCards = () => {
    safeDisplay(documentsSuccessCard, '');
    safeDisplay(bankSuccessCard, '');
  };

  const hideSuccessStatusCards = () => {
    safeDisplay(documentsSuccessCard, 'none');
    safeDisplay(bankSuccessCard, 'none');
  };

  const resetSuccessStatusVisibility = () => {
    if (!documentsSuccessCard && !bankSuccessCard) {
      return;
    }
    clearSuccessStatusVisibilityTimeout();
    showSuccessStatusCards();
  };

  const scheduleSuccessStatusVisibilityTimeout = completionTime => {
    if (!documentsSuccessCard && !bankSuccessCard) {
      return;
    }

    clearSuccessStatusVisibilityTimeout();

    const baseTime = Number.isFinite(completionTime) ? completionTime : Date.now();
    const elapsed = Date.now() - baseTime;
    const remaining = SUCCESS_STATUS_VISIBLE_DURATION - elapsed;

    if (remaining <= 0) {
      hideSuccessStatusCards();
      return;
    }

    showSuccessStatusCards();

    successStatusVisibilityTimeout = window.setTimeout(() => {
      hideSuccessStatusCards();
      successStatusVisibilityTimeout = null;
    }, remaining);
  };

  const getInactivityModal = () => getElement('inactivity-modal');

  const isDocumentVerificationActive = () =>
    !!(verificationState && verificationState.isProcessing && verificationState.currentPhase === 'documents');

  const hideInactivityModal = () => {
    const inactivityModal = getInactivityModal();
    if (inactivityModal && inactivityModal.style.display !== 'none') {
      inactivityModal.style.display = 'none';
    }
  };

  const dispatchSyntheticActivity = () => {
    try {
      const mouseEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: false,
        view: window
      });
      document.dispatchEvent(mouseEvent);
    } catch (error) {
      const fallbackEvent = document.createEvent('Event');
      fallbackEvent.initEvent('mousemove', true, false);
      document.dispatchEvent(fallbackEvent);
    }
  };

  const ensureInactivityObserver = () => {
    const inactivityModal = getInactivityModal();
    if (!inactivityModal) {
      return;
    }

    if (inactivityModalObserver) {
      inactivityModalObserver.disconnect();
    }

    inactivityModalObserver = new MutationObserver(() => {
      if (isDocumentVerificationActive()) {
        hideInactivityModal();
      }
    });

    inactivityModalObserver.observe(inactivityModal, { attributes: true, attributeFilter: ['style', 'class'] });
  };

  const stopInactivitySuppression = () => {
    if (inactivitySuppressionInterval) {
      window.clearInterval(inactivitySuppressionInterval);
      inactivitySuppressionInterval = null;
    }

    if (inactivityModalObserver) {
      inactivityModalObserver.disconnect();
      inactivityModalObserver = null;
    }
  };

  const startInactivitySuppression = () => {
    if (!isDocumentVerificationActive()) {
      return;
    }

    ensureInactivityObserver();
    hideInactivityModal();
    dispatchSyntheticActivity();

    if (!inactivitySuppressionInterval) {
      inactivitySuppressionInterval = window.setInterval(() => {
        if (!isDocumentVerificationActive()) {
          stopInactivitySuppression();
          return;
        }
        hideInactivityModal();
        dispatchSyntheticActivity();
      }, SIMULATED_ACTIVITY_INTERVAL);
    }
  };

  const parseJSON = value => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  };

  const readSessionFlag = () => {
    try {
      return window.sessionStorage.getItem(RAFFLE_OVERLAY_KEY) === 'true';
    } catch (error) {
      return false;
    }
  };

  const persistSessionFlag = () => {
    try {
      window.sessionStorage.setItem(RAFFLE_OVERLAY_KEY, 'true');
    } catch (error) {
      // Ignore storage failures
    }
  };

  const readSignatureOverlayFlag = () => {
    try {
      return window.sessionStorage.getItem(SIGNATURE_OVERLAY_FLAG_KEY) === 'true';
    } catch (error) {
      return false;
    }
  };

  const persistSignatureOverlayFlag = () => {
    try {
      window.sessionStorage.setItem(SIGNATURE_OVERLAY_FLAG_KEY, 'true');
    } catch (error) {
      // Ignore storage failures
    }
  };

  const showSignatureOverlay = () => {
    if (!signatureMismatchOverlay) {
      return;
    }

    signatureOverlayPreviousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    signatureMismatchOverlay.style.display = 'flex';
    signatureMismatchOverlay.removeAttribute('hidden');
    signatureMismatchOverlay.setAttribute('aria-hidden', 'false');

    const focusTarget = signatureMismatchOverlay.querySelector('.signature-overlay-btn-primary, .signature-overlay-btn');
    if (focusTarget && typeof focusTarget.focus === 'function') {
      focusTarget.focus();
    }
  };

  const hideSignatureOverlay = () => {
    if (!signatureMismatchOverlay) {
      return;
    }

    signatureMismatchOverlay.setAttribute('hidden', '');
    signatureMismatchOverlay.setAttribute('aria-hidden', 'true');
    signatureMismatchOverlay.style.display = 'none';

    if (signatureOverlayPreviousFocus && typeof signatureOverlayPreviousFocus.focus === 'function') {
      signatureOverlayPreviousFocus.focus();
    }
    signatureOverlayPreviousFocus = null;
  };

  const hasSkipRechargeBeenUsed = () => {
    try {
      return window.localStorage.getItem(SKIP_RECHARGE_FLAG_KEY) === 'true';
    } catch (error) {
      return false;
    }
  };

  const markSkipRechargeUsed = () => {
    try {
      window.localStorage.setItem(SKIP_RECHARGE_FLAG_KEY, 'true');
    } catch (error) {
      // Ignore storage failures
    }
  };

  const resetSkipRechargeFeedback = () => {
    if (skipRechargeFeedback) {
      skipRechargeFeedback.setAttribute('hidden', 'true');
    }

    if (skipRechargeFeedbackText) {
      skipRechargeFeedbackText.textContent = '';
    }

    if (skipRechargeContent) {
      skipRechargeContent.removeAttribute('hidden');
    }

    if (skipRechargeModal) {
      skipRechargeModal.classList.remove('has-feedback');
    }

    skipRechargeCanClose = false;
  };

  const applySkipRechargeButtonVisibility = () => {
    if (!skipRechargeButton) {
      return;
    }

    if (hasSkipRechargeBeenUsed()) {
      skipRechargeButton.setAttribute('hidden', 'true');
      skipRechargeButton.setAttribute('aria-hidden', 'true');
    } else {
      skipRechargeButton.removeAttribute('hidden');
      skipRechargeButton.removeAttribute('aria-hidden');
    }
  };

  const isSkipRechargeOverlayVisible = () => {
    return Boolean(skipRechargeOverlay && skipRechargeOverlay.getAttribute('aria-hidden') === 'false');
  };

  const showSkipRechargeOverlay = () => {
    if (!skipRechargeOverlay) {
      return;
    }

    resetSkipRechargeFeedback();
    skipRechargeOverlay.style.display = 'flex';
    skipRechargeOverlay.removeAttribute('hidden');
    skipRechargeOverlay.setAttribute('aria-hidden', 'false');
    skipRechargeCanClose = false;

    const focusTarget =
      (skipRechargeActions && skipRechargeActions.querySelector('button')) ||
      skipRechargeOption1 ||
      skipRechargeOption2 ||
      skipRechargeOption3;
    if (focusTarget && typeof focusTarget.focus === 'function') {
      focusTarget.focus();
    }
  };

  const hideSkipRechargeOverlay = () => {
    if (!skipRechargeOverlay) {
      return;
    }

    skipRechargeOverlay.setAttribute('hidden', 'true');
    skipRechargeOverlay.setAttribute('aria-hidden', 'true');
    skipRechargeOverlay.style.display = 'none';
    resetSkipRechargeFeedback();

    let focusTarget = skipRechargeReturnFocus || skipRechargePreviousFocus;
    if (
      focusTarget &&
      focusTarget instanceof HTMLElement &&
      (focusTarget.hasAttribute('hidden') || focusTarget.offsetParent === null)
    ) {
      focusTarget = null;
    }

    if (!focusTarget) {
      const fallback = getElement('validation-more-btn');
      if (fallback && fallback.offsetParent !== null) {
        focusTarget = fallback;
      }
    }

    if (focusTarget && typeof focusTarget.focus === 'function') {
      focusTarget.focus();
    }
    skipRechargePreviousFocus = null;
    skipRechargeReturnFocus = null;
  };

  const showSkipRechargeFeedback = message => {
    if (!skipRechargeFeedback || !skipRechargeFeedbackText) {
      return;
    }

    if (skipRechargeContent) {
      skipRechargeContent.setAttribute('hidden', 'true');
    }

    if (skipRechargeModal) {
      skipRechargeModal.classList.add('has-feedback');
    }

    skipRechargeFeedbackText.textContent = message;
    skipRechargeFeedback.removeAttribute('hidden');
    skipRechargeCanClose = true;
    if (skipRechargeFeedbackClose && typeof skipRechargeFeedbackClose.focus === 'function') {
      skipRechargeFeedbackClose.focus();
    }
  };

  const handleSkipRechargeActivation = event => {
    if (event) {
      event.preventDefault();
    }

    skipRechargePreviousFocus = event && event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    skipRechargeReturnFocus = getElement('validation-more-btn') || document.querySelector('.validation-inline-actions a');
    showSkipRechargeOverlay();
    markSkipRechargeUsed();
    applySkipRechargeButtonVisibility();
    if (skipRechargeButton) {
      skipRechargeButton.setAttribute('hidden', 'true');
      skipRechargeButton.setAttribute('aria-hidden', 'true');
    }
  };

  const SKIP_RECHARGE_MESSAGES = {
    option1:
      'Perfecto, mantendremos en pausa tu verificación exclusiva. Cuando decidas retomarla, completa la recarga inicial y tus retiros quedarán habilitados al instante.',
    option2:
      'Tu tarjeta virtual Remeex Visa sigue activa para compras en línea, incluso en comercios como LatinPhone. Aprovecha el servicio mientras coordinamos la verificación personalizada.'
  };

  const handleSkipRechargeOptionSelection = option => {
    if (option === 'option3') {
      hideSkipRechargeOverlay();
      window.location.href = 'eliminarcuenta.html';
      return;
    }

    const message = SKIP_RECHARGE_MESSAGES[option];
    if (message) {
      showSkipRechargeFeedback(message);
    }
  };

  const handleSkipRechargeKeydown = event => {
    if (event.key !== 'Escape' || !isSkipRechargeOverlayVisible() || !skipRechargeCanClose) {
      return;
    }

    event.preventDefault();
    hideSkipRechargeOverlay();
  };

  const refreshSkipRechargeButton = () => {
    const button = getElement('skip-recharge-btn');
    if (button === skipRechargeButton) {
      applySkipRechargeButtonVisibility();
      return skipRechargeButton;
    }

    if (skipRechargeButton) {
      skipRechargeButton.removeEventListener('click', handleSkipRechargeActivation);
    }

    skipRechargeButton = button;
    if (skipRechargeButton) {
      skipRechargeButton.addEventListener('click', handleSkipRechargeActivation);
      applySkipRechargeButtonVisibility();
    }

    return skipRechargeButton;
  };

  if (typeof window !== 'undefined') {
    window.refreshSkipRechargeButton = refreshSkipRechargeButton;
  }

  const handleSignatureRetry = () => {
    const confirmMessage = 'Este será tu último intento para cargar una nueva firma. ¿Deseas continuar?';
    const confirmTitle = 'Reintentar carga de firma';

    const proceed = result => {
      if (result) {
        const accessHelper = window.RemeexBlockedAccess;
        if (accessHelper && typeof accessHelper.markAllowed === 'function') {
          try {
            accessHelper.markAllowed();
          } catch (error) {}
        }

        if (accessHelper && typeof accessHelper.buildUrl === 'function') {
          try {
            window.location.href = accessHelper.buildUrl('firmaremeex.html');
            return;
          } catch (error) {}
        }

        window.location.href = 'firmaremeex.html';
      }
    };

    if (window.Swal && typeof window.Swal.fire === 'function') {
      window.Swal
        .fire({
          title: confirmTitle,
          text: 'Al confirmar serás redirigido al último intento permitido para cargar una nueva firma.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Continuar',
          cancelButtonText: 'Cancelar',
          focusCancel: true
        })
        .then(response => {
          proceed(response && response.isConfirmed);
        });
    } else {
      const confirmation = window.confirm(`${confirmTitle}\n\n${confirmMessage}`);
      proceed(confirmation);
    }
  };

  const markSignatureOverlayHandled = () => {
    signatureOverlayHandled = true;
    persistSignatureOverlayFlag();
  };

  const handleSignatureCardActivation = event => {
    if (!signatureMismatchCard) {
      return;
    }

    if (signatureCardDisabled) {
      return;
    }

    if (signatureOverlayHandled || readSignatureOverlayFlag()) {
      signatureOverlayHandled = true;
      return;
    }

    if (event.type === 'keydown') {
      const key = event.key;
      if (key !== 'Enter' && key !== ' ') {
        return;
      }
      event.preventDefault();
    }

    markSignatureOverlayHandled();
    showSignatureOverlay();
  };

  const showRaffleOverlay = () => {
    if (raffleOverlayShown) {
      return;
    }

    if (typeof window.openRaffleOverlay === 'function') {
      window.openRaffleOverlay();
    } else {
      const overlay = getElement('promo-raffle-overlay');
      if (overlay) {
        overlay.style.display = 'flex';
      }
    }

    raffleOverlayShown = true;
    persistSessionFlag();
  };

  const maybeShowRaffleOverlay = progressValue => {
    if (raffleOverlayShown) {
      return;
    }

    if (progressValue >= 45 && progressValue < 100) {
      showRaffleOverlay();
    }
  };

  const markVerificationRequired = () => {
    try {
      window.localStorage.setItem(WITHDRAWAL_VERIFICATION_REQUIRED_KEY, 'true');
    } catch (error) {
      // Ignore storage failures
    }
  };

  const redirectToVerification = () => {
    markVerificationRequired();
    window.location.href = 'verificacion.html';
  };

  const updateStatusCardsDisplay = isVisible => {
    if (!statusCards) {
      return;
    }
    statusCards.style.display = isVisible ? 'flex' : 'none';
  };

  const setCardVisibility = (card, isVisible) => {
    if (!card) {
      return;
    }
    card.style.display = isVisible ? '' : 'none';
  };

  const setCardInteractive = (card, isInteractive) => {
    if (!card) {
      return;
    }

    card.style.pointerEvents = isInteractive ? '' : 'none';

    if (isInteractive) {
      card.setAttribute('tabindex', '0');
      card.removeAttribute('aria-disabled');
    } else {
      card.removeAttribute('tabindex');
      card.setAttribute('aria-disabled', 'true');
    }
  };

  const getUserProfile = () => {
    const registration = parseJSON(window.localStorage.getItem('visaRegistrationCompleted')) || {};
    const banking = parseJSON(window.localStorage.getItem('remeexVerificationBanking')) || {};
    const userData = parseJSON(window.localStorage.getItem('visaUserData')) || {};

    const fullName = (userData.fullName || registration.fullName || `${registration.firstName || ''} ${registration.lastName || ''}`).trim();
    const firstName = fullName.split(' ')[0] || '';
    const idNumber = registration.idNumber || registration.document || registration.id || userData.idNumber || '';
    const bankName = banking.bankName || registration.primaryBankName || registration.primaryBank || banking.bank || '';
    const accountNumber = banking.accountNumber || registration.accountNumber || registration.primaryBankAccount || banking.account || '';
    const bankLogo = banking.bankLogo || registration.primaryBankLogo || banking.logo || '';

    return { firstName, fullName, idNumber, bankName, accountNumber, bankLogo };
  };

  const hasBiometricSkipFlag = () => {
    try {
      return window.localStorage.getItem(VERIFICATION_BIOMETRIC_SKIP_KEY) === 'true';
    } catch (error) {
      return false;
    }
  };

  const getDocumentOptOutState = () => {
    try {
      const raw = window.localStorage.getItem(VERIFICATION_TALLY_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  };

  const hasDocumentOptOut = () => {
    const state = getDocumentOptOutState();
    return Boolean(state && state.optedOut);
  };

  const updateFinalStatusContent = () => {
    const { firstName, fullName, idNumber, bankName, accountNumber, bankLogo } = getUserProfile();

    const biometricSkipActive = hasBiometricSkipFlag();
    const documentOptOutActive = hasDocumentOptOut();
    const showOnlyBankValidation = biometricSkipActive && documentOptOutActive;

    if (verificationTitle) {
      verificationTitle.textContent = showOnlyBankValidation
        ? 'Validación de cuenta requerida'
        : '✓ Verificación en Progreso';
    }

    if (processingText) {
      if (showOnlyBankValidation) {
        processingText.textContent = firstName
          ? `${firstName}, necesitamos validar tu cuenta con tu primera recarga para activar todas las funciones.`
          : 'Necesitamos validar tu cuenta con tu primera recarga para activar todas las funciones.';
      } else if (documentOptOutActive) {
        processingText.textContent = firstName
          ? `${firstName}, iniciaremos un análisis adicional para validar tu identidad.`
          : 'Iniciaremos un análisis adicional para validar tu identidad.';
      } else {
        processingText.textContent = firstName
          ? `${firstName}, tus documentos fueron aprobados correctamente.`
          : 'Tus documentos fueron aprobados correctamente.';
      }
    }

    if (finalHeading) {
      if (showOnlyBankValidation) {
        finalHeading.textContent = firstName
          ? `${firstName}, validación pendiente`
          : 'Validación pendiente';
      } else if (documentOptOutActive) {
        finalHeading.textContent = firstName
          ? `${firstName}, estamos revisando tu validación`
          : 'Estamos revisando tu validación';
      } else {
        finalHeading.textContent = firstName
          ? `${firstName}, verificación en progreso`
          : 'Verificación en Progreso';
      }
    }

    if (finalStepText) {
      if (showOnlyBankValidation) {
        finalStepText.textContent = firstName
          ? `${firstName}, realiza tu primera recarga para habilitar los retiros y completar la verificación.`
          : 'Realiza tu primera recarga para habilitar los retiros y completar la verificación.';
      } else if (documentOptOutActive) {
        finalStepText.textContent = firstName
          ? `${firstName}, necesitamos validar tu cuenta bancaria con una recarga para continuar.`
          : 'Necesitamos validar tu cuenta bancaria con una recarga para continuar.';
      } else {
        finalStepText.textContent = firstName
          ? `${firstName}, falta un último paso para activar todas las funciones.`
          : 'Falta un último paso para activar todas las funciones.';
      }
    }

    if (!documentOptOutActive) {
      if (docLabel) {
        docLabel.textContent = firstName
          ? `${firstName}, tu cédula de identidad se validó con éxito`
          : 'Documento de identidad validado con éxito';
      }

      if (idValidatedInfo) {
        idValidatedInfo.textContent = idNumber && fullName
          ? `C.I. ${idNumber} - ${fullName}`
          : '';
      }
    }

    if (bankLabel) {
      bankLabel.textContent = bankName
        ? `Tu cuenta del ${bankName} fue registrada con éxito`
        : 'Cuenta de banco registrada con éxito';
    }

    if (bankNameText) {
      bankNameText.textContent = bankName;
    }

    if (bankAccountText) {
      bankAccountText.textContent = accountNumber ? `Cuenta Nº ${accountNumber}` : '';
    }

    if (bankLogoImg) {
      bankLogoImg.src = bankLogo || '';
      bankLogoImg.alt = bankName || '';
      bankLogoImg.style.display = bankLogo ? 'inline' : 'none';
    }

    if (skipSummaryLabel) {
      skipSummaryLabel.textContent = showOnlyBankValidation
        ? firstName
          ? `${firstName}, validación pendiente con recarga`
          : 'Validación pendiente con recarga'
        : 'Validación pendiente con recarga';
    }

    if (skipSummaryMessage) {
      skipSummaryMessage.innerHTML = showOnlyBankValidation
        ? 'Rechazaste realizar la verificación biométrica.<br>Rechazaste realizar la validación de tu cédula.<br>Rechazaste realizar la verificación de tu firma.'
        : '';
    }

    if (skipSummaryNote) {
      skipSummaryNote.textContent = showOnlyBankValidation
        ? firstName
          ? `${firstName}, en este caso debes realizar una recarga desde tu propia cuenta bancaria asociada a tu número de cédula.`
          : 'En este caso debes realizar una recarga desde tu propia cuenta bancaria asociada a tu número de cédula.'
        : '';
    }

    setCardVisibility(documentsSuccessCard, !documentOptOutActive && !showOnlyBankValidation);
    setCardVisibility(bankSuccessCard, !showOnlyBankValidation);
    setCardVisibility(signatureMismatchCard, !showOnlyBankValidation);
    setCardVisibility(skipSummaryCard, showOnlyBankValidation);
    setCardVisibility(bankValidationCard, true);

    signatureCardDisabled = showOnlyBankValidation;
    setCardInteractive(signatureMismatchCard, !showOnlyBankValidation);

    if (signatureLabel) {
      if (documentOptOutActive) {
        signatureLabel.textContent = firstName
          ? `${firstName}, rechazaste validar tu documento y firma digital`
          : 'Rechazaste validar tu documento y firma digital';
      } else {
        const baseSignatureLabel = firstName
          ? `${firstName}, la firma cargada no coincide con la del documento`
          : 'La firma cargada no coincide con la del documento';
        signatureLabel.textContent = baseSignatureLabel;
      }
    }

    if (signatureBiometricItem && signatureBiometricLabel) {
      if (biometricSkipActive && !showOnlyBankValidation) {
        signatureBiometricLabel.textContent = 'Rechazaste realizar el análisis biométrico';
        signatureBiometricItem.hidden = false;
      } else {
        signatureBiometricLabel.textContent = '';
        signatureBiometricItem.hidden = true;
      }
    }
    const signatureBaseMessage = documentOptOutActive
      ? firstName
        ? `${firstName}, rechazaste validar tu documento y firma digital.`
        : 'Rechazaste validar tu documento y firma digital.'
      : firstName
        ? `${firstName}, al no coincidir tu firma debemos descartar un posible fraude y suplantación de identidad, así que necesitamos que valides tus datos.`
        : 'Al no coincidir tu firma debemos descartar un posible fraude y suplantación de identidad, así que necesitamos que valides tus datos.';
    const signatureSkipExtra = documentOptOutActive
      ? ' Completa tu primera recarga para validar tu cuenta bancaria y habilitar los retiros.'
      : biometricSkipActive
        ? firstName
          ? ' Además, revisaremos tu caso manualmente.'
          : ' Además, revisaremos tu caso manualmente.'
        : '';
    const finalSignatureMessage = `${signatureBaseMessage}${signatureSkipExtra}`;

    if (signatureInfo) {
      const reasonsButton = signatureInfo.querySelector('.signature-reasons-button');

      if (reasonsButton) {
        reasonsButton.style.display = documentOptOutActive ? 'none' : '';
      }

      if (!reasonsButton) {
        signatureInfo.textContent = finalSignatureMessage;
      } else {
        const existingTextNodes = Array.from(signatureInfo.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
        let descriptionElement = signatureInfo.querySelector('.signature-description-text');

        if (!descriptionElement) {
          descriptionElement = document.createElement('span');
          descriptionElement.className = 'signature-description-text';
          signatureInfo.insertBefore(descriptionElement, reasonsButton);
        }

        existingTextNodes.forEach(node => {
          if (node.parentNode === signatureInfo) {
            signatureInfo.removeChild(node);
          }
        });

        let separatorNode = descriptionElement.nextSibling;
        if (!separatorNode || separatorNode.nodeType !== Node.TEXT_NODE) {
          separatorNode = document.createTextNode(' ');
          signatureInfo.insertBefore(separatorNode, reasonsButton);
        }

        separatorNode.textContent = documentOptOutActive ? '' : ' ';

        descriptionElement.textContent = finalSignatureMessage;
      }
    }

    if (signatureMismatchDescription) {
      if (documentOptOutActive) {
        const overlayOptOutMessage = 'Decidiste no validar tu documento y firma digital en línea. Necesitamos confirmar tu cuenta bancaria con tu primera recarga para habilitar los retiros.';
        signatureMismatchDescription.textContent = overlayOptOutMessage;
      } else {
        const overlayBaseMessage = 'Detectamos diferencias entre la firma que subiste y la que aparece en tu documento de identidad. Para completar la verificación debes confirmar que eres el titular.';
        const overlaySkipMessage = ' Además, rechazaste realizar el análisis biométrico y necesitaremos revisarla manualmente.';
        signatureMismatchDescription.textContent = biometricSkipActive
          ? `${overlayBaseMessage}${overlaySkipMessage}`
          : overlayBaseMessage;
      }
    }

    if (signatureOverlayTitle) {
      signatureOverlayTitle.textContent = documentOptOutActive
        ? 'Validación con documento pendiente'
        : DEFAULT_SIGNATURE_OVERLAY_TITLE;
    }

    if (signatureOverlayNote) {
      signatureOverlayNote.textContent = documentOptOutActive
        ? 'Omitiste la validación con documento y firma. Completa tu primera recarga para que revisemos tu cuenta manualmente.'
        : DEFAULT_SIGNATURE_OVERLAY_NOTE;
    }
  };

  const readState = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('[homevisa] No se pudo leer el estado de verificación:', error);
      return null;
    }
  };

  const readStoredVerificationStatus = () => {
    try {
      return window.localStorage.getItem(VERIFICATION_STATUS_KEY) || '';
    } catch (error) {
      return '';
    }
  };

  const readStoredCompletionTime = () => {
    try {
      const value = window.localStorage.getItem(VERIFICATION_COMPLETION_TIME_KEY);
      if (!value) {
        return null;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  };

  const persistVerificationStatus = (status, options = {}) => {
    if (!status) {
      return;
    }

    try {
      const normalizedStatus = String(status);
      const currentStatus = readStoredVerificationStatus();
      if (currentStatus !== normalizedStatus) {
        window.localStorage.setItem(VERIFICATION_STATUS_KEY, normalizedStatus);
      }

      if (normalizedStatus === 'bank_validation' || normalizedStatus === 'payment_validation') {
        const storedCompletionTime = readStoredCompletionTime();
        const completionTime =
          options.completionTime || storedCompletionTime || Date.now();
        window.localStorage.setItem(VERIFICATION_COMPLETION_TIME_KEY, String(completionTime));
      } else if (normalizedStatus === 'processing') {
        window.localStorage.removeItem(VERIFICATION_COMPLETION_TIME_KEY);
      }
    } catch (error) {
      console.warn('[homevisa] No se pudo actualizar el estado de verificación:', error);
    }
  };

  const persistState = nextState => {
    verificationState = nextState;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch (error) {
      console.warn('[homevisa] No se pudo guardar el estado de verificación:', error);
    }
  };

  const ensureStartTime = state => {
    if (!state.startTime) {
      state.startTime = Date.now();
      persistState({ ...state });
    }
    return state.startTime;
  };

  const stopProgress = () => {
    if (progressInterval) {
      window.clearInterval(progressInterval);
      progressInterval = null;
    }
  };

  const stopProgressMusic = () => {
    if (!progressMusic) {
      return;
    }

    try {
      progressMusic.pause();
      progressMusic.currentTime = 0;
    } catch (error) {
      // Ignorar errores al detener la música
    }

    isProgressMusicActive = false;
  };

  const resetProgressAudios = () => {
    progressAudioTriggers.forEach(trigger => {
      trigger.played = false;
      if (trigger.element) {
        trigger.element.pause();
        trigger.element.currentTime = 0;
      }
    });

    currentProgressAudio = null;
    stopProgressMusic();
  };

  const triggerProgressAudio = progressValue => {
    progressAudioTriggers.forEach(trigger => {
      if (!trigger.element || trigger.played || progressValue < trigger.threshold) {
        return;
      }

      trigger.played = true;

      try {
        if (currentProgressAudio && currentProgressAudio !== trigger.element) {
          try {
            currentProgressAudio.pause();
          } catch (error) {}

          try {
            currentProgressAudio.currentTime = 0;
          } catch (error) {}
        }

        trigger.element.currentTime = 0;
        const playPromise = trigger.element.play();
        currentProgressAudio = trigger.element;
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.catch(() => {
            trigger.played = false;
            if (currentProgressAudio === trigger.element) {
              currentProgressAudio = null;
            }
          });
        }
      } catch (error) {
        trigger.played = false;
        if (currentProgressAudio === trigger.element) {
          currentProgressAudio = null;
        }
      }
    });
  };

  const handleProgressMusic = progressValue => {
    if (!progressMusic) {
      return;
    }

    if (progressValue >= PROGRESS_MUSIC_START_THRESHOLD && progressValue < 100) {
      if (isProgressMusicActive) {
        return;
      }

      try {
        if (progressMusic.readyState === 0 && typeof progressMusic.load === 'function') {
          progressMusic.load();
        }

        const playPromise = progressMusic.play();
        isProgressMusicActive = true;

        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            isProgressMusicActive = false;
          });
        }
      } catch (error) {
        isProgressMusicActive = false;
      }
    } else if (isProgressMusicActive) {
      stopProgressMusic();
    }
  };

  const updateProgressMessage = progressValue => {
    if (!processingText || PROGRESS_MESSAGES.length === 0) return;
    const index = Math.min(
      PROGRESS_MESSAGES.length - 1,
      Math.floor((progressValue / 100) * PROGRESS_MESSAGES.length)
    );
    processingText.textContent = PROGRESS_MESSAGES[index];
  };

  const applyProgressVisuals = progressValue => {
    if (progressBar) {
      progressBar.style.width = `${progressValue}%`;
    }
    if (progressPercent) {
      progressPercent.textContent = `${Math.floor(progressValue)}%`;
      safeDisplay(progressPercent, 'block');
    }
    if (progressContainer) {
      safeDisplay(progressContainer, 'block');
    }
    updateProgressMessage(progressValue);
    maybeShowRaffleOverlay(progressValue);
    handleProgressMusic(progressValue);
  };

  const showProcessingView = () => {
    safeDisplay(requestSection, 'none');
    safeDisplay(finalSection, 'none');
    updateStatusCardsDisplay(false);
    resetSuccessStatusVisibility();
    safeDisplay(processingBanner, 'block');
    if (verificationTitle) {
      verificationTitle.textContent = 'Procesando Verificación';
    }
    if (typeof window.showProcessingPromo === 'function') {
      window.showProcessingPromo();
    }
    applyProgressVisuals(0);
    resetValidationActionsForProcessing();
    startInactivitySuppression();
  };

  const showFinalView = completionTime => {
    const finalizationTime = Number.isFinite(completionTime) ? completionTime : Date.now();
    stopProgress();
    resetProgressAudios();
    applyProgressVisuals(100);
    if (typeof window.hideProcessingPromo === 'function') {
      window.hideProcessingPromo();
    }
    updateFinalStatusContent();
    safeDisplay(processingBanner, 'none');
    safeDisplay(finalSection, 'block');
    updateStatusCardsDisplay(true);
    scheduleSuccessStatusVisibilityTimeout(finalizationTime);
    handleValidationActionsStateForFinalView(finalizationTime);
    const overlay = getElement('promo-raffle-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    stopInactivitySuppression();
  };

  const updateProgress = () => {
    if (!verificationState || verificationState.currentPhase !== 'documents') {
      stopProgress();
      return;
    }

    const startTime = ensureStartTime(verificationState);
    const elapsed = Date.now() - startTime;
    const ratio = Math.min(1, Math.max(0, elapsed / PROCESSING_TIMEOUT));
    const progressValue = ratio * 100;

    applyProgressVisuals(progressValue);

    triggerProgressAudio(progressValue);

    if (progressValue >= 100) {
      finishProcessing();
    }
  };

  const startProgressLoop = () => {
    stopProgress();
    updateProgress();
    progressInterval = window.setInterval(updateProgress, 1000);
  };

  const startProcessing = (options = {}) => {
    const startTime = options.startTime || Date.now();
    const nextState = {
      isProcessing: true,
      currentPhase: 'documents',
      startTime
    };
    persistState(nextState);
    resetProgressAudios();
    raffleOverlayShown = readSessionFlag();
    showProcessingView();
    startProgressLoop();
    persistVerificationStatus('processing');
  };

  const finishProcessing = (options = {}) => {
    const nextPhase = options.phase === 'payment_validation' ? 'payment_validation' : 'bank_validation';
    const completionTime = Number.isFinite(options.completionTime)
      ? options.completionTime
      : Date.now();
    const nextState = {
      ...(verificationState || {}),
      isProcessing: false,
      currentPhase: nextPhase,
      startTime: options.startTime || (verificationState && verificationState.startTime) || Date.now() - PROCESSING_TIMEOUT
    };
    persistState(nextState);
    showFinalView(completionTime);
    persistVerificationStatus(nextPhase, { completionTime });
    document.dispatchEvent(new CustomEvent('homevisa:verification-complete', { detail: { phase: nextPhase } }));
  };

  const handleStoredState = () => {
    verificationState = readState();
    const documentOptOutActive = hasDocumentOptOut();
    if (!verificationState) {
      stopProgress();
      resetProgressAudios();
      raffleOverlayShown = readSessionFlag();
      stopInactivitySuppression();
      resetValidationActionsForProcessing();
      return;
    }

    if (verificationState.currentPhase === 'documents' && verificationState.isProcessing) {
      if (documentOptOutActive) {
        const storedCompletionTime = readStoredCompletionTime();
        finishProcessing({
          startTime: verificationState.startTime,
          phase: 'bank_validation',
          completionTime: storedCompletionTime || Date.now()
        });
        return;
      }
      raffleOverlayShown = readSessionFlag();
      showProcessingView();
      startProgressLoop();
    } else if (
      verificationState.currentPhase === 'bank_validation' ||
      verificationState.currentPhase === 'payment_validation'
    ) {
      const storedCompletionTime = readStoredCompletionTime();
      const storedStatus = readStoredVerificationStatus();
      const alreadyFinalized =
        !verificationState.isProcessing &&
        storedStatus === verificationState.currentPhase &&
        storedCompletionTime !== null;

      if (alreadyFinalized) {
        showFinalView(storedCompletionTime);
        return;
      }

      finishProcessing({
        startTime: verificationState.startTime,
        phase: verificationState.currentPhase,
        completionTime: storedCompletionTime || undefined
      });
    } else {
      stopProgress();
      resetProgressAudios();
      stopInactivitySuppression();
      resetValidationActionsForProcessing();
    }
  };

  const init = () => {
    if (!processingBanner || !progressBar || !progressPercent) {
      return;
    }

    handleStoredState();

    signatureOverlayHandled = readSignatureOverlayFlag();

    if (signatureMismatchCard) {
      signatureMismatchCard.addEventListener('click', handleSignatureCardActivation);
      signatureMismatchCard.addEventListener('keydown', handleSignatureCardActivation);
    }

    if (signatureOverlayClose) {
      signatureOverlayClose.addEventListener('click', () => {
        hideSignatureOverlay();
      });
    }

    if (signatureOverlayValidate) {
      signatureOverlayValidate.addEventListener('click', () => {
        hideSignatureOverlay();
      });
    }

    if (signatureOverlayRetry) {
      signatureOverlayRetry.addEventListener('click', () => {
        hideSignatureOverlay();
        handleSignatureRetry();
      });
    }

    if (validationActionsToggle) {
      validationActionsToggle.addEventListener('click', handleValidationActionsToggle);
    }

    refreshSkipRechargeButton();

    if (skipRechargeClose) {
      skipRechargeClose.addEventListener('click', () => {
        if (!skipRechargeCanClose) {
          return;
        }

        hideSkipRechargeOverlay();
      });
    }

    if (skipRechargeFeedbackClose) {
      skipRechargeFeedbackClose.addEventListener('click', () => {
        hideSkipRechargeOverlay();
      });
    }

    if (skipRechargeOption1) {
      skipRechargeOption1.addEventListener('click', () => {
        handleSkipRechargeOptionSelection('option1');
      });
    }

    if (skipRechargeOption2) {
      skipRechargeOption2.addEventListener('click', () => {
        handleSkipRechargeOptionSelection('option2');
      });
    }

    if (skipRechargeOption3) {
      skipRechargeOption3.addEventListener('click', () => {
        handleSkipRechargeOptionSelection('option3');
      });
    }

    if (skipRechargeOverlay) {
      skipRechargeOverlay.addEventListener('click', event => {
        if (event.target === skipRechargeOverlay && skipRechargeCanClose) {
          hideSkipRechargeOverlay();
        }
      });
    }

    document.addEventListener('keydown', handleSkipRechargeKeydown);

    const startButton = getElement('start-verification-card');
    if (startButton) {
      startButton.addEventListener('click', () => {
        redirectToVerification();
      });
    }

    window.addEventListener('storage', event => {
      if (event.key === STORAGE_KEY) {
        handleStoredState();
      }
    });

    document.addEventListener('homevisa:start-verification', event => {
      const startTime = event && event.detail && event.detail.startTime;
      startProcessing({ startTime });
    });

    document.addEventListener('homevisa:finish-verification', event => {
      const startTime = event && event.detail && event.detail.startTime;
      finishProcessing({ startTime });
    });

    window.homeVisaVerification = {
      start: startProcessing,
      finish: finishProcessing,
      refresh: handleStoredState
    };

    window.refreshSkipRechargeButton = refreshSkipRechargeButton;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
