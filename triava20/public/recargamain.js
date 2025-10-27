"use strict";
import { CONFIG, BANK_NAME_MAP, CITY_VALIDATION_AMOUNTS, LATINPHONE_LOGO, currentUser, verificationStatus, updateCurrentUser, updateVerificationStatus } from './recargastate.js';
CONFIG.EXCHANGE_RATES.FORCED_VALIDATION_USD = CONFIG.EXCHANGE_RATES.FORCED_VALIDATION_USD || null;
import { getVenezuelaTime, generateHourlyCode, addEventOnce, addUnifiedClick, escapeHTML, formatCurrency, getCurrentDate, getCurrentDateTime, getShortDate, getCurrentTime, getBankLogo } from './recargautils.js';
    (function() {
      const referrerPart = document.referrer
        ? document.referrer.split('/').pop().split(/[?#]/)[0].replace(/\.html$/, '')
        : '';
      const fromRegistro = sessionStorage.getItem('fromRegistro') === 'true';
      const isRegistered = !!localStorage.getItem('visaRegistrationCompleted');
      if (referrerPart !== 'registro' && !fromRegistro && !isRegistered) {
        window.location.replace('registro.html');
      } else {
        sessionStorage.removeItem('fromRegistro');
      }
    })();
if (typeof gsap === "undefined") {
 window.gsap = {
  to: function(t,v){if(v&&typeof v.onUpdate=="function"){v.onUpdate.call({progress:()=>1});}if(v&&typeof v.onComplete=="function"){v.onComplete();}},
  fromTo: function(t,f,to){if(to&&typeof to.onUpdate=="function"){to.onUpdate.call({progress:()=>1});}if(to&&typeof to.onComplete=="function"){to.onComplete();}}
 };
}
if (typeof confetti === "undefined") { window.confetti = function(){}; }

// Variables globales derivadas del antiguo recarga3.html
let verificationProcessing = {
  isProcessing: false,
  startTime: null,
  currentPhase: 'documents',
  timer: null
};
const verificationProgressMessages = [
  "Contactando con tu banco...",
  "Verificando cédula de identidad...",
  "Comprobando datos biométricos...",
  "Analizando historial financiero...",
  "Sincronizando con registros gubernamentales...",
  "Realizando comprobaciones adicionales...",
  "Confirmando datos proporcionados...",
  "Asegurando encriptación de información...",
  "Procesando validaciones finales...",
  "Casi listo, afinando detalles..."
];
const SECURITY_QUESTIONS = {
  mother_name: "¿Cuál es el nombre de soltera de tu madre?",
  pet_name: "¿Cuál fue el nombre de tu primera mascota?",
  school_name: "¿Cuál fue el nombre de tu escuela primaria?",
  best_friend: "¿Cuál es el nombre de tu mejor amigo de la infancia?",
  birth_city: "¿En qué ciudad naciste?"
};
let verificationProgressInterval = null;
let verificationProgressSoundPlayed = false;
let selectedPaymentMethod = 'card-payment';
let inactivityTimer = null;
let inactivityCountdown = null;
let inactivitySeconds = 30;
let activeUsersCount = 0;
let activationFlow = false;
let pendingTransactions = [];
let displayedTransactions = new Set();
let transactionFilter = 'all';
let savings = { pots: [], nextId: 1 };
let exchangeHistory = [];
let mobilePaymentTimer = null; // Temporizador para mostrar el mensaje de soporte
let welcomeVideoPlayer = null;
let welcomeVideoTimer = null;
let cardVideoPlayer = null;
let cardVideoTimer = null;
let validationVideoPlayer = null;
let validationVideoTimer = null;
let servicesVideoPlayer = null;
let servicesVideoTimer = null;
let hourlyRechargeTimer = null; // Temporizador para sonido tras primera recarga
let validationReminderTimer = null; // Temporizador para recordatorio de validación
let quickRechargeTimer = null; // Temporizador para recarga rápida
let selectedBalanceCurrency = 'bs';
let isBalanceHidden = false;
let tempBlockTimer = null; // Temporizador para bloqueo temporal
let notifications = [];
let welcomeBonusTimeout = null; // Temporizador para mostrar el bono de bienvenida
let loginLedInterval = null; // Intervalo para mensajes del indicador LED
let isCardPaymentProcessing = false; // Evitar recargas dobles con tarjeta
    // Cargar Tawk.to bajo demanda
    let tawkLoaded = false;
    let tawkVisibilityInterval = null; // evita multiples intervalos
    function loadTawkTo() {
      if (tawkLoaded) {
        ensureTawkToVisibility();
        if (window.Tawk_API) Tawk_API.maximize();
        return;
      }
      var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();

      // Configuración específica de Tawk.to si es necesario
      Tawk_API.onLoad = function(){
        const container = document.getElementById('tawkto-container');
        container.style.display = 'block';
        container.style.visibility = 'visible';
        console.log('Tawk.to cargado correctamente');
        if (window.Tawk_API) Tawk_API.maximize();
        ensureTawkToVisibility();
      };
      
      try {
        var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
        s1.async=true;
        s1.src='https://embed.tawk.to/67cca8c614b1ee191063c36a/default';
        s1.charset='UTF-8';
        s1.setAttribute('crossorigin','*');
        s1.setAttribute('importance', 'high'); // Prioridad alta
        s0.parentNode.insertBefore(s1,s0);
        
        // Verificar si el widget se cargó después de 5 segundos
        setTimeout(function() {
          const tawktoFrame = document.querySelector('iframe[title*="chat"]');
          if (!tawktoFrame) {
            console.log('Reintentando cargar Tawk.to...');
            loadTawkTo(); // Reintentar si no se cargó
          }
        }, 5000);
        tawkLoaded = true;
      } catch (e) {
        console.error('Error al cargar Tawk.to:', e);
      }
    }

    // Mantener el widget visible (conserva la función existente pero optimizada)
    function ensureTawkToVisibility() {
      if (!tawkLoaded) return;
      if (tawkVisibilityInterval) return; // ya existe un intervalo

      tawkVisibilityInterval = setInterval(function() {
        const tawktoFrame = document.querySelector('iframe[title*="chat"]');
        const tawktoContainer = document.getElementById('tawkto-container');

        if (tawktoFrame && tawktoContainer) {
          tawktoContainer.style.display = 'block';
          tawktoContainer.style.visibility = 'visible';
          tawktoContainer.style.zIndex = '9999';

          tawktoFrame.style.display = 'block';
          tawktoFrame.style.visibility = 'visible';
          tawktoFrame.style.zIndex = '9999';

          clearInterval(tawkVisibilityInterval);
          tawkVisibilityInterval = setInterval(function() {
            if (tawktoFrame.style.display !== 'block') {
              tawktoFrame.style.display = 'block';
              tawktoFrame.style.visibility = 'visible';
            }
          }, 3000);
        }
      }, 1000);
    }

    // La visibilidad se asegurará cuando se cargue el chat
    // Configuración de valores constantes con tasa de cambio centralizada

    // DOM Ready
document.addEventListener('DOMContentLoaded', function() {
      applySavedTheme();
      // Inicializar login de forma temprana
      setupLoginForm();
      // Configurar eventos mínimos antes de la inicialización
      setupPasswordToggles();
      setupSecurityFieldsToggle();
      // Iniciar aplicación de forma asíncrona para evitar bloqueos
      setTimeout(() => {
        try {
          initApp();
        } catch (error) {
          console.error('initApp failed to complete:', error);
        } finally {
          // Configurar escuchas de eventos principales
          setupEventListeners();
        }
      }, 0);
    });

    // Ejecutar lógica no crítica cuando la página haya cargado
    window.addEventListener('load', () => {
      // Ajustar tamaño del botón de retiro en caso de cambios de tamaño
      window.addEventListener('resize', adjustWithdrawButtonFont);
      adjustWithdrawButtonFont();

      // Cargar notificaciones guardadas
      loadNotifications();
      updateNotificationBadge();

      // Inactivity handler
      setupInactivityHandler();

      // Storage event listener para sincronizar múltiples pestañas
      window.addEventListener('storage', handleStorageChange);

      // Check for returning from transfer
      checkReturnFromTransfer();

      // Handle section redirects via query params
      handleSectionRedirect();

      // NUEVA IMPLEMENTACIÓN: Verificar estado de procesamiento de verificación
      checkVerificationProcessingStatus();

      // Asegurar persistencia de saldo y transacciones al actualizar
      window.addEventListener('beforeunload', () => {
        saveBalanceData();
        saveTransactionsData();
      });
    });

    // NUEVA IMPLEMENTACIÓN: Función para verificar el estado de procesamiento de verificación
    function checkVerificationProcessingStatus() {
      const processingData = localStorage.getItem(CONFIG.STORAGE_KEYS.VERIFICATION_PROCESSING);

      if (!processingData) return;

      try {
        const data = JSON.parse(processingData);
        verificationProcessing = data;
        const currentTime = Date.now();
        const elapsedTime = currentTime - (data.startTime || 0);

        if (data.isProcessing && elapsedTime < CONFIG.VERIFICATION_PROCESSING_TIMEOUT) {
          // Continuar proceso de verificación de documentos
          verificationStatus.status = 'processing';
          showVerificationProcessingBanner();
          // Asegurar que la sección correcta quede visible
          personalizeVerificationStatusCards();
          updateStatusCards();

          // Temporizador para pasar a validación bancaria
          const remainingTime = CONFIG.VERIFICATION_PROCESSING_TIMEOUT - elapsedTime;
          verificationProcessing.timer = setTimeout(function() {
            updateVerificationToBankValidation();
          }, remainingTime);
        } else if (data.isProcessing && elapsedTime >= CONFIG.VERIFICATION_PROCESSING_TIMEOUT) {
          // Tiempo cumplido, pasar a validación bancaria
          updateVerificationToBankValidation();
        } else {
          // Proceso ya está en otra fase
          if (data.currentPhase === 'bank_validation' || data.currentPhase === 'payment_validation') {
            verificationStatus.status = data.currentPhase;
            updateVerificationProcessingBanner();
            personalizeVerificationStatusCards();
            updateStatusCards();
          }
        }
      } catch (e) {
        console.error('Error parsing verification processing data:', e);
      }
    }

    // NUEVA IMPLEMENTACIÓN: Función para iniciar el proceso de verificación
    function startVerificationProcessing() {
      verificationProcessing = {
        isProcessing: true,
        startTime: new Date().getTime(),
        currentPhase: 'documents',
        timer: null
      };
      
      // Guardar en localStorage
      localStorage.setItem(CONFIG.STORAGE_KEYS.VERIFICATION_PROCESSING, JSON.stringify(verificationProcessing));
      
      // Cambiar el estado de verificación
      verificationStatus.status = 'processing';
      saveVerificationStatus();

      // Mostrar banner de procesamiento y comenzar el progreso con sonido
      showVerificationProcessingBanner();
      startVerificationProgress();
      updateStatusCards();
      
      // Configurar temporizador para cambiar a validación bancaria después de 10 minutos
      verificationProcessing.timer = setTimeout(function() {
        updateVerificationToBankValidation();
      }, CONFIG.VERIFICATION_PROCESSING_TIMEOUT);
    }

    // NUEVA IMPLEMENTACIÓN: Función para actualizar a validación bancaria
function updateVerificationToBankValidation() {
  verificationProcessing.currentPhase = 'bank_validation';
  verificationProcessing.isProcessing = false;
  if (verificationProcessing.timer) {
    clearTimeout(verificationProcessing.timer);
    verificationProcessing.timer = null;
  }
  verificationStatus.status = 'bank_validation';
  
  // Actualizar localStorage
  localStorage.setItem(CONFIG.STORAGE_KEYS.VERIFICATION_PROCESSING, JSON.stringify(verificationProcessing));
  saveVerificationStatus();
  
  // Actualizar el banner con animación
  const banner = document.getElementById('status-processing-card');
  if (banner) {
    // Añadir efecto de transición suave
    gsap.to(banner, {
      scale: 0.98,
      duration: 0.2,
      ease: "power2.in",
      onComplete: function() {
        updateVerificationProcessingBanner();
        gsap.to(banner, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });
        
        // Mostrar notificación de éxito
        setTimeout(() => {
          showToast('success', 'Documentos Aprobados', 'Sus documentos han sido verificados exitosamente. Complete el último paso para activar su cuenta.', 5000);
          addNotification('success', 'Documentos verificados', 'Sus documentos fueron aprobados.');
        }, 500);
      }
    });
  } else {
    updateVerificationProcessingBanner();
  }
  personalizeVerificationStatusCards();
  updateStatusCards();
}

    // NUEVA IMPLEMENTACIÓN: Función para mostrar el banner de procesamiento de verificación
    function showVerificationProcessingBanner() {
      const processingBanner = document.getElementById('status-processing-card');
      if (processingBanner) {
        processingBanner.style.display = 'block';
        updateVerificationProcessingBanner();
      }
    }

 // NUEVA IMPLEMENTACIÓN: Función para actualizar el contenido del banner de procesamiento
function updateVerificationProcessingBanner() {
  const title = document.getElementById('verification-processing-title');
  const text = document.getElementById('verification-processing-text');
  const note = document.getElementById('verification-note');
  const icon = document.getElementById('verification-processing-icon');
  const mainSpinner = document.getElementById('main-processing-spinner');
  const statusItems = document.getElementById('verification-status-cards');
  const firstName = currentUser.fullName ? escapeHTML(currentUser.fullName.split(' ')[0]) :
                     (currentUser.name ? escapeHTML(currentUser.name.split(' ')[0]) : '');

  // Ensure the phase matches the stored verification status
  let expectedPhase = null;
  if (verificationStatus.status === 'payment_validation') {
    expectedPhase = 'payment_validation';
  } else if (verificationStatus.status === 'bank_validation') {
    expectedPhase = 'bank_validation';
  } else if (verificationStatus.status === 'processing') {
    expectedPhase = 'documents';
  }

  if (expectedPhase && verificationProcessing.currentPhase !== expectedPhase) {
    verificationProcessing.currentPhase = expectedPhase;
    localStorage.setItem(CONFIG.STORAGE_KEYS.VERIFICATION_PROCESSING, JSON.stringify(verificationProcessing));
  }
  
  if (verificationProcessing.currentPhase === 'documents') {
    if (title) title.textContent = firstName ? `${firstName}, estamos verificando tus documentos` : 'Verificando Documentos';
    if (text) text.textContent = `${firstName ? firstName + ', ' : ''}estamos revisando tu documentación. Este proceso puede tardar unos minutos.`;
    if (note) note.textContent = 'Puedes cerrar sesión, no es necesario permanecer en línea. Puedes volver en cualquier momento.';
    if (icon) {
      icon.className = 'verification-processing-icon';
      icon.innerHTML = '<i class="fas fa-id-card"></i>';
    }
    startVerificationProgress();
    if (mainSpinner) mainSpinner.style.display = 'block';
    if (statusItems) statusItems.style.display = 'none';
  } else if (verificationProcessing.currentPhase === 'bank_validation') {
    if (title) title.textContent = '✓ Verificación en Progreso';
    if (text) text.textContent = `${firstName ? firstName + ', ' : ''}hemos completado la verificación de tus documentos. Falta un último paso para activar todas las funciones.`;
    if (note) note.textContent = `${firstName ? firstName + ', ' : ''}puedes cerrar sesión. No es necesario permanecer en línea y puedes volver en cualquier momento.`;
    const finalHeading = document.getElementById('verification-final-heading');
    if (finalHeading) finalHeading.textContent = `${firstName ? firstName + ', ' : ''}verificación en progreso`;
    if (icon) {
      icon.className = 'verification-processing-icon bank-phase';
      icon.innerHTML = '<i class="fas fa-shield-alt"></i>';
    }
      stopVerificationProgress();
      const progressContainer = document.getElementById("verification-progress-container");
      if (progressContainer) progressContainer.style.display = "none";
    if (mainSpinner) mainSpinner.style.display = 'none';
    if (statusItems) {
      statusItems.style.display = 'flex';

      if (statusItems) personalizeVerificationStatusCards();
      const finalText = document.getElementById('final-step-text');
      if (finalText) finalText.textContent = `${firstName ? firstName + ', ' : ''}te falta un último paso para activar todas las funciones.`;

      // Animar la aparición de los items de estado
      gsap.fromTo(statusItems.children, {
        opacity: 0,
        y: 20
      }, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.2,
        ease: "power2.out"
      });
    }
  } else if (verificationProcessing.currentPhase === 'payment_validation') {
    if (title) title.textContent = 'Pago Móvil en Verificación';
    if (text) text.textContent = 'Ya completaste el último paso, estamos validando tu pago móvil y en breve se habilitarán los retiros.';
    if (icon) {
      icon.className = 'verification-processing-icon bank-phase';
      icon.innerHTML = '<i class="fas fa-mobile-alt"></i>';
    }
    stopVerificationProgress();
    const progressContainer = document.getElementById("verification-progress-container");
    if (progressContainer) progressContainer.style.display = "none";
    if (mainSpinner) mainSpinner.style.display = 'none';
    if (statusItems) statusItems.style.display = 'flex';
    updateBankValidationStatusItem();
  }
}

function updateBankValidationStatusItem() {
  const label = document.querySelector('#status-bank-validation .status-label');
  const sublabel = document.querySelector('#status-bank-validation .status-sublabel');
  const rechargeBtn = document.getElementById('start-recharge');
  const statusBtn = document.getElementById('view-status');
  const firstName = currentUser.fullName ? escapeHTML(currentUser.fullName.split(' ')[0]) :
                     (currentUser.name ? escapeHTML(currentUser.name.split(' ')[0]) : '');
  const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
  const banking = JSON.parse(localStorage.getItem('remeexVerificationBanking') || '{}');
  const bankName = BANK_NAME_MAP[reg.primaryBank] || banking.bankName || '';
  const benefitsBanner = document.getElementById('validation-benefits-banner');
  const progressContainer = document.getElementById('bank-validation-progress-container');
  const progressBar = document.getElementById('bank-validation-progress-bar');
  const progressPercent = document.getElementById('bank-validation-progress-percent');
  // IDs ajustados para coincidir con homevisa.html
  const balanceFlow = document.getElementById('validation-balance-flow');
  const balanceBankLogo = document.getElementById('balance-bank-logo');
  const balanceBankLogoFinal = document.getElementById('balance-bank-logo-final');
  const balanceRechargeAmount = document.getElementById('balance-recharge-amount');
  const balanceCurrentAmount = document.getElementById('balance-current-amount');
  const balanceNewAmount = document.getElementById('balance-new-amount');
  const balanceWithdrawAmount = document.getElementById('balance-withdraw-amount');

  let requiredUsd = getVerificationAmountUsd(currentUser.balance.usd || 0);
  let requiredBs = requiredUsd * CONFIG.EXCHANGE_RATES.USD_TO_BS;
  updateVerificationAmountDisplays();

  if (verificationStatus.status === 'payment_validation') {
    if (label) label.textContent = 'Pago móvil en verificación';
    if (sublabel) sublabel.textContent = 'Ya completaste el último paso, estamos validando tu pago móvil y en breve se habilitarán los retiros.';
    if (rechargeBtn) rechargeBtn.style.display = 'none';
    if (statusBtn) statusBtn.style.display = 'none';
    if (benefitsBanner) benefitsBanner.style.display = 'none';
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = '100%';
    if (spinner) spinner.style.display = 'none';
    if (progressPercent) {
      progressPercent.style.display = 'block';
      progressPercent.textContent = '100%';
    }
    if (balanceFlow) balanceFlow.style.display = 'none';
  } else {
    if (label) label.textContent = 'Validación de datos de cuenta pendiente';
    if (sublabel) {
      const base = `${firstName ? '¡Hola, ' + firstName + '! ' : ''}Para completar la validación y habilitar los retiros, debes recargar ${formatCurrency(requiredUsd, 'usd')} (${formatCurrency(requiredBs, 'bs')}) desde tu cuenta registrada en bolívares. Esta recarga se sumará a tu saldo disponible.`;
      const exampleUsd = currentUser.balance.usd || 0;
      const afterUsd = exampleUsd + requiredUsd;
      const afterBs = afterUsd * CONFIG.EXCHANGE_RATES.USD_TO_BS;
      const rate = CONFIG.EXCHANGE_RATES.USD_TO_BS.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const more = `Por ejemplo, si actualmente tienes ${formatCurrency(exampleUsd, 'usd')}, luego de recargar tendrás ${formatCurrency(afterUsd, 'usd')} (${formatCurrency(afterBs, 'bs')} a tasa de ${rate} Bs). El monto de validación puede variar según tu saldo y se ajusta automáticamente para tu seguridad. Con este paso tu cuenta quedará 100% activa y lista para operar.`;
      let skipRechargeUsed = false;
      try {
        skipRechargeUsed = localStorage.getItem('remeexSkipRechargeOptionUsed') === 'true';
      } catch (error) {
        skipRechargeUsed = false;
      }

      const skipButtonHtml = skipRechargeUsed
        ? ''
        : '<button type="button" id="skip-recharge-btn" class="signature-reasons-button show-more-link skip-recharge-link">No quiero realizar la recarga</button>';

      sublabel.innerHTML = `${base} <span id="validation-more" class="validation-more">${more}</span> <span class="validation-inline-actions"><a href="#" id="validation-more-btn" class="show-more-link">Ver más</a>${skipButtonHtml ? ` ${skipButtonHtml}` : ''}</span>`;
      const moreBtn = document.getElementById('validation-more-btn');
      if (moreBtn) addUnifiedClick(moreBtn, toggleValidationMore);
      if (typeof window.refreshSkipRechargeButton === 'function') {
        window.refreshSkipRechargeButton();
      }
    }
    if (rechargeBtn) rechargeBtn.style.display = 'inline-block';
    if (statusBtn) statusBtn.style.display = 'inline-block';
    if (benefitsBanner) benefitsBanner.style.display = 'flex';
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = '95%';
    if (progressPercent) {
      progressPercent.style.display = 'block';
      progressPercent.textContent = '95%';
    }
    if (spinner) spinner.style.display = 'inline-block';
    if (balanceFlow) {
      const bankLogo = typeof getBankLogo === 'function' ? getBankLogo(reg.primaryBank) : '';
      if (balanceBankLogo) {
        balanceBankLogo.src = bankLogo;
        balanceBankLogo.alt = bankName;
        balanceBankLogo.style.display = bankLogo ? 'inline' : 'none';
      }
      if (balanceBankLogoFinal) {
        balanceBankLogoFinal.src = bankLogo;
        balanceBankLogoFinal.alt = bankName;
        balanceBankLogoFinal.style.display = bankLogo ? 'inline' : 'none';
      }
      const currentUsd = currentUser.balance.usd || 0;
      const currentBs = currentUsd * CONFIG.EXCHANGE_RATES.USD_TO_BS;
      const newBalanceUsd = currentUsd + requiredUsd;
      const newBalanceBs = newBalanceUsd * CONFIG.EXCHANGE_RATES.USD_TO_BS;
      if (balanceRechargeAmount) balanceRechargeAmount.innerHTML = `${formatCurrency(requiredUsd, 'usd')}<br>${formatCurrency(requiredBs, 'bs')}`;
      if (balanceCurrentAmount) balanceCurrentAmount.innerHTML = `${formatCurrency(currentUsd, 'usd')}<br>${formatCurrency(currentBs, 'bs')}`;
      if (balanceNewAmount) balanceNewAmount.innerHTML = `${formatCurrency(newBalanceUsd, 'usd')}<br>${formatCurrency(newBalanceBs, 'bs')}`;
      if (balanceWithdrawAmount) balanceWithdrawAmount.innerHTML = `${formatCurrency(newBalanceUsd, 'usd')}<br>${formatCurrency(newBalanceBs, 'bs')}`;
      balanceFlow.style.display = 'flex';
    }
  }
}

function updateVerificationToPaymentValidation() {
  verificationProcessing.currentPhase = 'payment_validation';
  verificationProcessing.isProcessing = false;
  if (verificationProcessing.timer) {
    clearTimeout(verificationProcessing.timer);
    verificationProcessing.timer = null;
  }
  verificationStatus.status = 'payment_validation';

  localStorage.setItem(CONFIG.STORAGE_KEYS.VERIFICATION_PROCESSING, JSON.stringify(verificationProcessing));
  saveVerificationStatus();
  updateBankValidationStatusItem();
  personalizeVerificationStatusCards();
  updateVerificationProcessingBanner();
  updateStatusCards();
}

function toggleValidationMore(e) {
  if (e) e.preventDefault();
  const extra = document.getElementById('validation-more');
  const btn = document.getElementById('validation-more-btn');
  if (!extra || !btn) return;
  const visible = extra.style.display === 'inline';
  extra.style.display = visible ? 'none' : 'inline';
  btn.textContent = visible ? 'Ver más' : 'Ver menos';
}

function personalizeVerificationStatusCards() {
  const docLabel = document.getElementById('status-documents-label');
  const idInfo = document.getElementById('id-validated-info');
  const bankLabel = document.getElementById('status-bank-label');
  const bankNameEl = document.getElementById('bank-name-text');
  const bankAccountEl = document.getElementById('bank-account-text');
  const bankLogoEl = document.getElementById('bank-logo-mini');

  const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
  const banking = JSON.parse(localStorage.getItem('remeexVerificationBanking') || '{}');

  const idNum = verificationStatus.idNumber || currentUser.idNumber || '';
  const fullName = escapeHTML(currentUser.fullName || currentUser.name || '');
  const firstName = fullName.split(' ')[0] || '';
  const bankName = BANK_NAME_MAP[reg.primaryBank] || banking.bankName || '';
  const accountNum = banking.accountNumber || '';
  const logoUrl = banking.bankLogo ||
                  reg.primaryBankLogo ||
                  getBankLogo(reg.primaryBank) ||
                  getBankLogo(banking.bankId || '');

  if (docLabel) docLabel.textContent = `${firstName ? firstName + ', ' : ''}tu cédula de identidad se validó con éxito`;
  if (idInfo) {
    idInfo.textContent = idNum && fullName ? `C.I. ${idNum} - ${fullName}` : '';
  }
  if (bankLabel) bankLabel.textContent = `Tu cuenta del ${bankName} fue registrada con éxito`;
  if (bankNameEl) bankNameEl.textContent = bankName;
  if (bankAccountEl) bankAccountEl.textContent = accountNum ? `Cuenta Nº ${accountNum}` : '';
  if (bankLogoEl) {
    bankLogoEl.src = logoUrl;
    bankLogoEl.alt = bankName;
    bankLogoEl.style.display = logoUrl ? 'inline' : 'none';
  }
}

function updateVerificationProgress() {
  const container = document.getElementById("verification-progress-container");
  const percentEl = document.getElementById("verification-progress-percent");
  const bar = document.getElementById("verification-progress-bar");
  const text = document.getElementById("verification-processing-text");

  if (!verificationProcessing.isProcessing || verificationProcessing.currentPhase !== "documents") {
    if (container) container.style.display = "none";
    if (percentEl) percentEl.style.display = "none";
    return;
  }

  if (container) container.style.display = "block";
  if (percentEl) percentEl.style.display = "block";
  const elapsed = new Date().getTime() - verificationProcessing.startTime;
  const total = CONFIG.VERIFICATION_PROCESSING_TIMEOUT;
  const progress = Math.min(100, (elapsed / total) * 100);
  if (bar) bar.style.width = progress + "%";
  if (percentEl) percentEl.textContent = Math.floor(progress) + "%";

  if (!verificationProgressSoundPlayed && Math.floor(progress) >= 1) {
    playVerificationProgressSound();
  }

  if (progress >= 100 && verificationProcessing.currentPhase === 'documents') {
    updateVerificationToBankValidation();
    return;
  }

  const msgIndex = Math.min(verificationProgressMessages.length - 1, Math.floor((elapsed / total) * verificationProgressMessages.length));
  const firstName = currentUser.fullName ? escapeHTML(currentUser.fullName.split(' ')[0]) : (currentUser.name ? escapeHTML(currentUser.name.split(' ')[0]) : '');
  const message = verificationProgressMessages[msgIndex];
  if (text) text.textContent = firstName ? `${firstName}, ${message}` : message;
}

function startVerificationProgress() {
  updateVerificationProgress();
  if (verificationProgressInterval) clearInterval(verificationProgressInterval);
  // Actualizar el progreso cada segundo para mostrar una barra de progreso
  // más fluida durante la verificación de documentos
  verificationProgressInterval = setInterval(updateVerificationProgress, 1000);
  verificationProgressSoundPlayed = false;
}

function stopVerificationProgress() {
  if (verificationProgressInterval) {
    clearInterval(verificationProgressInterval);
    verificationProgressInterval = null;
  }
  const progressAudio = document.getElementById('verificationProgressSound');
  if (progressAudio) {
    progressAudio.pause();
    progressAudio.currentTime = 0;
  }
  verificationProgressSoundPlayed = false;
}

function playVerificationProgressSound() {
  const progressAudio = document.getElementById('verificationProgressSound');
  if (progressAudio) {
    progressAudio.pause();
    progressAudio.currentTime = 0;
    const playPromise = progressAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          verificationProgressSoundPlayed = true;
        })
        .catch(err => {
          console.error('Audio playback failed:', err);
          verificationProgressSoundPlayed = false;
        });
    } else {
      verificationProgressSoundPlayed = true;
    }
  }
}

    // NUEVA IMPLEMENTACIÓN: Función para ocultar el banner de procesamiento
    function hideVerificationProcessingBanner(reset = false) {
      const processingBanner = document.getElementById('status-processing-card');
      if (processingBanner) {
        processingBanner.style.display = 'none';
      }

      stopVerificationProgress();
      // Limpiar el temporizador y los datos de procesamiento
      if (verificationProcessing.timer) {
        clearTimeout(verificationProcessing.timer);
        verificationProcessing.timer = null;
      }

      if (reset) {
        verificationProcessing = {
          isProcessing: false,
          startTime: null,
          currentPhase: 'documents',
          timer: null
        };

        localStorage.removeItem(CONFIG.STORAGE_KEYS.VERIFICATION_PROCESSING);
      }
      updateStatusCards();
    }
    
    // Función para generar un ID único para el dispositivo
    function generateDeviceId() {
      let deviceId = localStorage.getItem(CONFIG.STORAGE_KEYS.DEVICE_ID);
      if (!deviceId) {
        deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(CONFIG.STORAGE_KEYS.DEVICE_ID, deviceId);
      }
      return deviceId;
    }

    // Función para guardar datos de pago móvil en localStorage
    function saveMobilePaymentData() {
      // Usar los datos de verificación del usuario en lugar de datos fijos
      const mobilePaymentData = {
        name: currentUser.fullName || currentUser.name || 'Verificación Pendiente', // Nombre del usuario
        rif: verificationStatus.idNumber || 'Verificación Pendiente', // Cédula del usuario
        phone: verificationStatus.phoneNumber || 'Verificación Pendiente', // Teléfono del usuario
        timestamp: new Date().getTime()
      };
      
      localStorage.setItem(CONFIG.STORAGE_KEYS.MOBILE_PAYMENT_DATA, JSON.stringify(mobilePaymentData));
      
      // Establecer el temporizador para mostrar el mensaje de soporte
      if (mobilePaymentTimer) clearTimeout(mobilePaymentTimer);
      
      mobilePaymentTimer = setTimeout(function() {
        showSupportNeededMessage();
      }, CONFIG.SUPPORT_DISPLAY_DELAY);
      
      // Guardar timestamp para el mensaje de soporte
      localStorage.setItem(CONFIG.STORAGE_KEYS.SUPPORT_NEEDED_TIMESTAMP, new Date().getTime() + CONFIG.SUPPORT_DISPLAY_DELAY);
    }

    // Función para cargar datos de pago móvil desde localStorage
    function loadMobilePaymentData() {
      const storedData = localStorage.getItem(CONFIG.STORAGE_KEYS.MOBILE_PAYMENT_DATA);

      if (!storedData) {
        // Si no existen datos, guardarlos inmediatamente y recargar
        saveMobilePaymentData();
        return loadMobilePaymentData();
      }

      try {
        const paymentData = JSON.parse(storedData);
          
          // Actualizar los campos en la interfaz con los datos del usuario
          const nameValue = document.getElementById('mobile-payment-name-value');
          const rifValue = document.getElementById('mobile-payment-rif-value');
          const phoneValue = document.getElementById('mobile-payment-phone-value');

          const bankNameEl1 = document.getElementById('user-bank-name');
          const bankNameEl2 = document.getElementById('user-bank-name-2');
          const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
          const bankName = BANK_NAME_MAP[reg.primaryBank] || '';
          if (bankNameEl1) bankNameEl1.textContent = bankName;
          if (bankNameEl2) bankNameEl2.textContent = bankName;
          
          const nameCopyBtn = document.querySelector('#mobile-payment-name .copy-btn');
          const rifCopyBtn = document.querySelector('#mobile-payment-rif .copy-btn');
          const phoneCopyBtn = document.querySelector('#mobile-payment-phone .copy-btn');
          
          // Mostrar el nombre completo del usuario
          if (nameValue && paymentData.name) {
            nameValue.textContent = paymentData.name;
            if (nameCopyBtn) {
              nameCopyBtn.setAttribute('data-copy', paymentData.name);
            }
          }
          
          // Mostrar cédula del usuario en lugar de RIF fijo
          if (rifValue && paymentData.rif) {
            rifValue.textContent = paymentData.rif;
            if (rifCopyBtn) {
              rifCopyBtn.setAttribute('data-copy', paymentData.rif);
            }
          }
          
          // Mostrar teléfono del usuario en lugar de teléfono fijo
          if (phoneValue && paymentData.phone) {
            // Dar formato al número de teléfono: 0412-1234567
            const formattedPhone = paymentData.phone.replace(/(\d{4})(\d{7})/, '$1-$2');
            phoneValue.textContent = formattedPhone;
            if (phoneCopyBtn) {
              phoneCopyBtn.setAttribute('data-copy', formattedPhone);
            }
          }
          
          // Verificar que existan rif y teléfono para mostrar mensaje de confirmación
          const mobilePaymentSuccess = document.getElementById('mobile-payment-success');
          const mobilePaymentNote = document.getElementById('mobile-payment-note');
          if (paymentData.rif && paymentData.phone) {
            if (mobilePaymentSuccess) mobilePaymentSuccess.style.display = 'flex';
            if (mobilePaymentNote) mobilePaymentNote.style.display = 'block';
          } else {
            if (mobilePaymentSuccess) mobilePaymentSuccess.style.display = 'none';
            if (mobilePaymentNote) mobilePaymentNote.style.display = 'none';
            // Datos incompletos; guardarlos nuevamente
            saveMobilePaymentData();
            return loadMobilePaymentData();
          }

          // Verificar si es momento de mostrar el mensaje de soporte
          const supportNeededTimestamp = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.SUPPORT_NEEDED_TIMESTAMP) || '0');
          const currentTime = new Date().getTime();
          
          if (supportNeededTimestamp > 0 && currentTime >= supportNeededTimestamp) {
            showSupportNeededMessage();
          } else if (supportNeededTimestamp > currentTime) {
            // Restablecer el temporizador para mostrar el mensaje
            const remainingTime = supportNeededTimestamp - currentTime;
            if (mobilePaymentTimer) clearTimeout(mobilePaymentTimer);
            
            mobilePaymentTimer = setTimeout(function() {
              showSupportNeededMessage();
            }, remainingTime);
          }
          
          return true;
        } catch (e) {
          console.error('Error parsing mobile payment data:', e);
          // Si la data es inválida, volver a guardarla
          saveMobilePaymentData();
        }
        return false;
      }

    // Función para mostrar el mensaje de soporte necesario
    function showSupportNeededMessage() {
      const supportNeededContainer = document.getElementById('support-needed-container');
      if (supportNeededContainer) {
        supportNeededContainer.style.display = 'block';
      }
    }

    function showPartialRechargeOverlay(remainingUsd) {
      const overlay = document.getElementById('partial-recharge-overlay');
      const amtEl = document.getElementById('partial-recharge-amount');
      if (amtEl) amtEl.textContent = formatCurrency(remainingUsd, 'usd');
      if (overlay) overlay.style.display = 'flex';
    }

    // Función para reiniciar el estado de soporte necesario
    function resetSupportNeededState() {
      if (mobilePaymentTimer) {
        clearTimeout(mobilePaymentTimer);
        mobilePaymentTimer = null;
      }
      
      localStorage.removeItem(CONFIG.STORAGE_KEYS.SUPPORT_NEEDED_TIMESTAMP);
      
      const supportNeededContainer = document.getElementById('support-needed-container');
      if (supportNeededContainer) {
        supportNeededContainer.style.display = 'none';
      }
    }

    function checkActivationPayment() {
      const pending = localStorage.getItem('remeexPendingActivationPayment');
      if (!pending) return;
      try {
        const data = JSON.parse(pending);
        activationFlow = true;
        openRechargeTab('mobile-payment');
        const mobileAmountSelect = document.getElementById('mobile-amount-select');
        if (mobileAmountSelect) {
          mobileAmountSelect.value = String(data.amount);
          mobileAmountSelect.dispatchEvent(new Event('change'));
        }
        localStorage.removeItem('remeexPendingActivationPayment');
      } catch(e) {
        console.error('Error parsing activation payment data:', e);
      }
    }

    function checkPendingConcept() {
      const stored = localStorage.getItem('remeexPendingConcept');
      if (!stored) return;
      try {
        const info = JSON.parse(stored);
        const remaining = info.time - Date.now();
        if (remaining <= 0) {
          showConceptModalForReference(info.reference);
        } else {
          setTimeout(function(){ showConceptModalForReference(info.reference); }, remaining);
        }
      } catch(e) { console.error('Error parsing pending concept data', e); }
    }

    function showConceptModalForReference(reference) {
      const conceptModal = document.getElementById('concept-modal');
      const conceptInput = document.getElementById('concept-input-modal');
      const conceptError = document.getElementById('concept-modal-error');
      const conceptConfirm = document.getElementById('concept-modal-confirm');

      if (conceptInput) conceptInput.value = '';
      if (conceptError) conceptError.style.display = 'none';
      if (conceptModal) conceptModal.style.display = 'flex';

      function handler() {
        if (!conceptInput || !conceptInput.value.trim()) {
          if (conceptError) conceptError.style.display = 'block';
          return;
        }
        if (conceptModal) conceptModal.style.display = 'none';
        const conceptValue = conceptInput.value.trim();
        if (conceptConfirm) conceptConfirm.removeEventListener('click', handler);
        finalizeConcept(reference, conceptValue);
      }

      if (conceptConfirm) addEventOnce(conceptConfirm, 'click', handler);
    }

    function finalizeConcept(reference, conceptValue) {
      const tx = currentUser.transactions.find(t => t.reference === reference && t.status === 'pending');
      if (tx) {
        tx.concept = conceptValue;
        saveTransactionsData();
      }
      const pendingMobileTransfers = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PENDING_MOBILE) || '[]');
      const idx = pendingMobileTransfers.findIndex(t => t.reference === reference);
      if (idx > -1) {
        pendingMobileTransfers[idx].concept = conceptValue;
        localStorage.setItem(CONFIG.STORAGE_KEYS.PENDING_MOBILE, JSON.stringify(pendingMobileTransfers));
      }
      localStorage.removeItem('remeexPendingConcept');
      if (conceptValue !== '4454651') {
        const procModal = document.getElementById('transfer-processing-modal');
        if (procModal) procModal.style.display = 'none';
        rejectMobileTransfer(reference);
        const rejModal = document.getElementById('transfer-rejected-modal');
        if (rejModal) rejModal.style.display = 'flex';
      } else {
        if (tx) {
          tx.status = 'completed';
          let amounts = {
            usd: tx.amount,
            bs: tx.amountBs || (tx.amount * CONFIG.EXCHANGE_RATES.USD_TO_BS),
            eur: tx.amountEur || (tx.amount * CONFIG.EXCHANGE_RATES.USD_TO_EUR)
          };
          if (typeof applyPendingCommission === 'function') {
            amounts = applyPendingCommission(amounts);
          }
          tx.amount = amounts.usd;
          tx.amountBs = amounts.bs;
          tx.amountEur = amounts.eur;
          currentUser.balance.usd += amounts.usd;
          currentUser.balance.bs += amounts.bs;
          currentUser.balance.eur += amounts.eur;
          animateMobileDeposit(amounts.usd);
          saveBalanceData();
          saveTransactionsData();
          updateDashboardUI();

          const pmList = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PENDING_MOBILE) || '[]');
          const i = pmList.findIndex(t => t.reference === reference);
          if (i > -1) {
            pmList.splice(i, 1);
            localStorage.setItem(CONFIG.STORAGE_KEYS.PENDING_MOBILE, JSON.stringify(pmList));
          }

          const totalDeposits = currentUser.transactions
            .filter(t => t.description === 'Pago Móvil' && t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0);
          const requiredUsd = getVerificationAmountUsd(currentUser.balance.usd);
          const remaining = requiredUsd - totalDeposits;
          if (remaining > 0) {
            showPartialRechargeOverlay(remaining);
          } else {
            updateVerificationToPaymentValidation();
          }
        } else {
          updateVerificationToPaymentValidation();
        }
      }
    }

    function processDonationRefunds() {
      const data = localStorage.getItem(CONFIG.STORAGE_KEYS.DONATION_REFUNDS);
      if (!data) return;
      let parsed;
      try { parsed = JSON.parse(data); } catch(e) { return; }
      if (parsed.deviceId !== currentUser.deviceId) return;
      const now = Date.now();
      let updated = false;
      parsed.refunds = parsed.refunds || [];
      parsed.refunds.forEach(r => {
        if (!r.refunded && now - new Date(r.date).getTime() >= CONFIG.DONATION_REFUND_DELAY) {
          currentUser.balance.usd += r.amount;
          currentUser.balance.bs += r.amount * CONFIG.EXCHANGE_RATES.USD_TO_BS;
          currentUser.balance.eur += r.amount * CONFIG.EXCHANGE_RATES.USD_TO_EUR;
          addTransaction({
            type: 'deposit',
            amount: r.amount,
            amountBs: r.amount * CONFIG.EXCHANGE_RATES.USD_TO_BS,
            amountEur: r.amount * CONFIG.EXCHANGE_RATES.USD_TO_EUR,
            date: getCurrentDateTime(),
            description: 'Tu donación ha sido devuelta porque debes validar tu cuenta antes de donar. Valida tu cuenta y vuelve a intentarlo.',
            bankName: r.foundationName || '',
            bankLogo: r.foundationLogo || '',
            status: 'completed'
          });
          r.refunded = true;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.DONATION_REFUNDS, JSON.stringify(parsed));
        saveBalanceData();
        saveTransactionsData();
        updateDashboardUI();
      }
    }

    function handleActivationMobilePayment(referenceEl, receiptEl) {
      const amountToDisplay = {
        usd: selectedAmount.usd,
        bs: selectedAmount.bs,
        eur: selectedAmount.eur
      };

      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) loadingOverlay.style.display = 'flex';
      const progressBar = document.getElementById('progress-bar');
      const loadingText = document.getElementById('loading-text');

      if (progressBar && loadingText) {
        gsap.to(progressBar, {
          width: '100%',
          duration: 2,
          ease: 'power1.inOut',
          onUpdate: function() {
            const progress = Math.round(this.progress() * 100);
            if (progress < 30) {
              loadingText.textContent = "Subiendo comprobante...";
            } else if (progress < 70) {
              loadingText.textContent = "Verificando información...";
            } else {
              loadingText.textContent = "Registrando pago móvil...";
            }
          },
          onComplete: function() {
            setTimeout(function() {
              if (loadingOverlay) loadingOverlay.style.display = 'none';

              if (!currentUser.hasMadeFirstRecharge) {
                saveFirstRechargeStatus(true);
              }

              const referenceValue = referenceEl.value.trim();

              const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
              const bankName = BANK_NAME_MAP[reg.primaryBank] || '';
              const bankLogo = typeof getBankLogo === 'function' ? getBankLogo(reg.primaryBank) : '';

              addTransaction({
                type: 'deposit',
                amount: amountToDisplay.usd,
                amountBs: amountToDisplay.bs,
                amountEur: amountToDisplay.eur,
                date: getCurrentDateTime(),
                description: 'Pago Móvil',
                reference: referenceValue,
                concept: '',
                bankName: bankName,
                bankLogo: bankLogo,
                status: 'pending'
              });

              pendingTransactions = currentUser.transactions.filter(t => t.status === 'pending' && t.description === 'Pago Móvil');
              updatePendingTransactionsBadge();

              const pendingMobileTransfers = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PENDING_MOBILE) || '[]');
              pendingMobileTransfers.push({
                amount: amountToDisplay.usd,
                reference: referenceValue,
                concept: '',
                date: getCurrentDateTime()
              });
              localStorage.setItem(CONFIG.STORAGE_KEYS.PENDING_MOBILE, JSON.stringify(pendingMobileTransfers));

              resetAmountSelectors();

              const transferModal = document.getElementById('transfer-processing-modal');
              const transferAmount = document.getElementById('transfer-amount');
              const transferReference = document.getElementById('transfer-reference');

              if (transferModal) transferModal.style.display = 'flex';
              if (transferAmount) transferAmount.textContent = formatCurrency(amountToDisplay.usd, 'usd');
              if (transferReference) transferReference.textContent = referenceValue;

              checkBannersVisibility();

              if (referenceEl) referenceEl.value = '';
              if (receiptEl) receiptEl.value = '';

              const receiptPreview = document.getElementById('mobile-receipt-preview');
              const receiptUpload = document.getElementById('mobile-receipt-upload');

              if (receiptPreview) receiptPreview.style.display = 'none';
              if (receiptUpload) receiptUpload.style.display = 'block';

              localStorage.setItem('remeexPendingConcept', JSON.stringify({ reference: referenceValue, time: Date.now() + 120000 }));
              setTimeout(function(){ showConceptModalForReference(referenceValue); }, 120000);
              activationFlow = false;
            }, 500);
          }
        });
      }
    }


    // Verificar si regresa de transferencia y procesar la información
    function checkReturnFromTransfer() {
  const pendingJson = sessionStorage.getItem("remeexPendingTransactions");
  if (pendingJson) {
    try {
      const list = JSON.parse(pendingJson);
      list.forEach(tx => {
        if (!currentUser.transactions.some(t => t.reference === tx.id)) {
          const amountUsd = tx.method === "international" ? parseFloat(tx.amount) : parseFloat(tx.amount) / CONFIG.EXCHANGE_RATES.USD_TO_BS;
          addTransaction({
            type: "withdraw",
            reference: tx.id,
            amount: amountUsd,
            amountBs: amountUsd * CONFIG.EXCHANGE_RATES.USD_TO_BS,
            amountEur: amountUsd * CONFIG.EXCHANGE_RATES.USD_TO_EUR,
            date: getCurrentDateTime(),
            description: tx.method === "mobile" ? "Retiro a Pago Móvil" : (tx.method === "bank" ? `Retiro a ${tx.bankName}` : `Retiro Internacional - ${tx.bankName}`),
            status: "pending",
            destination: tx.destination,
            bankName: tx.bankName,
            bankLogo: tx.bankLogo
          });
        }
      });
    } catch(e) { console.error("Error processing pending transactions from session:", e); }
    sessionStorage.removeItem("remeexPendingTransactions");
  }
      let transferData = null;
      const rawTransfer = sessionStorage.getItem(CONFIG.STORAGE_KEYS.TRANSFER_DATA);
      if (rawTransfer) {
        try {
          transferData = JSON.parse(rawTransfer);
        } catch(e) {
          console.error('Error parsing transfer data from session:', e);
        }
      }
      
      if (transferData) {
        // Recuperar los datos de la transferencia
        console.log("Información de transferencia recuperada:", transferData);
        
        // Añadir transacción pendiente de retiro
        if (isLoggedIn() && transferData.amount && transferData.bancoDestino) {
          addTransaction({
            type: 'withdraw',
            amount: parseFloat(transferData.amount),
            amountBs: parseFloat(transferData.amount) * CONFIG.EXCHANGE_RATES.USD_TO_BS,
            amountEur: parseFloat(transferData.amount) * CONFIG.EXCHANGE_RATES.USD_TO_EUR,
            date: getCurrentDateTime(),
            timestamp: Date.now(),
            description: 'Retiro a ' + transferData.bancoDestino,
            status: 'pending',
            destination: transferData.bancoDestino,
            bankName: transferData.bancoDestino,
            bankLogo: transferData.bankLogo || ''
          });
          
          // Mostrar notificación
          setTimeout(() => {
            showToast('info', 'Transferencia en Proceso', 
                    'Su solicitud de retiro a ' + transferData.bancoDestino + 
                    ' por $' + transferData.amount + ' está siendo procesada.');
          }, 1000);
          
          // Guardar en localStorage para persistir la información
          const pendingWithdrawals = JSON.parse(localStorage.getItem('remeexPendingWithdrawals') || '[]');
          pendingWithdrawals.push({
            amount: parseFloat(transferData.amount),
            bancoDestino: transferData.bancoDestino,
            date: getCurrentDateTime()
          });
          localStorage.setItem('remeexPendingWithdrawals', JSON.stringify(pendingWithdrawals));
          
          // Limpiar datos de transferencia después de procesarlos
          sessionStorage.removeItem(CONFIG.STORAGE_KEYS.TRANSFER_DATA);
        }
      }
    }

  // Manejar redirecciones iniciales a secciones específicas
  function handleSectionRedirect() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('section') === 'mobile-payment') {
      const dashboard = document.getElementById('dashboard-container');
      const recharge = document.getElementById('recharge-container');
      if (dashboard) dashboard.style.display = 'none';
      if (recharge) recharge.style.display = 'block';

      document.querySelectorAll('.payment-method-tab').forEach(t => t.classList.remove('active'));
      const mobileTab = document.querySelector('.payment-method-tab[data-target="mobile-payment"]');
      if (mobileTab) mobileTab.classList.add('active');
      document.querySelectorAll('.payment-method-content').forEach(c => c.classList.remove('active'));
      const mobileContent = document.getElementById('mobile-payment');
      if (mobileContent) mobileContent.classList.add('active');

      updateSavedCardUI();
    }
  }

    // Función para actualizar la tasa de cambio y recalcular todos los montos
    function updateExchangeRate(newRate) {
      // Actualizar la tasa centralizada
      CONFIG.EXCHANGE_RATES.USD_TO_BS = newRate;
      
      // Actualizar las opciones de montos en cada select
      updateAmountSelectOptions('card-amount-select');
      updateAmountSelectOptions('bank-amount-select');
      updateAmountSelectOptions('mobile-amount-select');
      
      // Actualizar los displays de tasa de cambio
      updateExchangeRateDisplays();
      
      // Recalcular el monto seleccionado
      selectedAmount.bs = selectedAmount.usd * CONFIG.EXCHANGE_RATES.USD_TO_BS;
      selectedAmount.eur = selectedAmount.usd * CONFIG.EXCHANGE_RATES.USD_TO_EUR;
      
      // Actualizar el botón de pago
      updateSubmitButtonText();

      // Recalcular los equivalentes del usuario basados en su saldo en bolívares
      if (currentUser && currentUser.balance && typeof currentUser.balance.bs === 'number') {
        currentUser.balance.usd = currentUser.balance.bs / CONFIG.EXCHANGE_RATES.USD_TO_BS;
        const eurRate = CONFIG.EXCHANGE_RATES.EUR_TO_BS || (CONFIG.EXCHANGE_RATES.USD_TO_BS / CONFIG.EXCHANGE_RATES.USD_TO_EUR);
        currentUser.balance.eur = currentUser.balance.bs / eurRate;
      }

      // Actualizar equivalentes en el dashboard
      updateBalanceEquivalents();
      updateVerificationAmountDisplays();
    }
    
    // Función para actualizar las opciones de monto en los selects
    function updateAmountSelectOptions(selectId) {
      const select = document.getElementById(selectId);
      if (!select) return;
      
      // Guardar el valor seleccionado actualmente
      const currentValue = select.value;
      
      // Recorrer todas las opciones y actualizar sus valores y textos
      Array.from(select.options).forEach(option => {
        // Saltar la opción de placeholder
        if (!option.value || option.disabled) return;
        
        const usdValue = parseInt(option.value);
        const bsValue = Math.round(usdValue * CONFIG.EXCHANGE_RATES.USD_TO_BS);
        const eurValue = (usdValue * CONFIG.EXCHANGE_RATES.USD_TO_EUR).toFixed(1);
        
        // Actualizar los atributos data
        option.dataset.bs = bsValue;
        option.dataset.eur = eurValue;
        
        // Actualizar el texto mostrado
        const formattedBs = bsValue.toLocaleString('es-VE');
        const formattedUsd = usdValue.toLocaleString('es-VE');
        const formattedEur = parseFloat(eurValue).toLocaleString('es-VE');
        
        option.textContent = `$${formattedUsd} ≈ Bs ${formattedBs},00 ≈ €${formattedEur}`;
      });
      
      // Restaurar el valor seleccionado
      select.value = currentValue;
      
      // Actualizar el monto seleccionado si es el select actual
      if (selectId === 'card-amount-select' && selectedPaymentMethod === 'card-payment' ||
          selectId === 'bank-amount-select' && selectedPaymentMethod === 'bank-payment' ||
          selectId === 'mobile-amount-select' && selectedPaymentMethod === 'mobile-payment') {
        
        // Solo actualizar si hay una opción seleccionada
        if (select.value) {
          const option = select.options[select.selectedIndex];
          selectedAmount.usd = parseInt(option.value) || 0;
          selectedAmount.bs = parseInt(option.dataset.bs) || 0;
          selectedAmount.eur = parseFloat(option.dataset.eur) || 0;
          updateSubmitButtonText();
        }
      }
      applyForcedValidationAmount();
    }

    const FORCED_VALIDATION_OPTION_KEY = '__forcedValidationOption';
    const FORCED_VALIDATION_OPTION_MARKER = 'forcedGenerated';

    function applyForcedValidationAmount() {
      const forcedRaw = typeof getForcedValidationAmount === 'function'
        ? getForcedValidationAmount()
        : null;
      const forced = typeof forcedRaw === 'number' && Number.isFinite(forcedRaw) ? forcedRaw : null;
      const forcedValue = forced !== null ? String(forced) : null;

      function resolveRate(selectElement, dataKey, currentRate) {
        if (Number.isFinite(currentRate)) return currentRate;
        const sampleOption = Array.from(selectElement.options).find(option => {
          return option && option.value && option.dataset && option.dataset[dataKey];
        });
        if (!sampleOption) return null;
        const sampleUsd = parseFloat(sampleOption.value);
        const sampleValue = parseFloat(sampleOption.dataset[dataKey]);
        if (!Number.isFinite(sampleUsd) || sampleUsd === 0 || !Number.isFinite(sampleValue)) return null;
        return sampleValue / sampleUsd;
      }

      function createForcedOption(selectElement, forcedUsd) {
        const option = document.createElement('option');
        option.value = String(forcedUsd);

        const rates = (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.EXCHANGE_RATES)
          ? CONFIG.EXCHANGE_RATES
          : {};

        let usdToBs = resolveRate(selectElement, 'bs', Number(rates.USD_TO_BS));
        let usdToEur = resolveRate(selectElement, 'eur', Number(rates.USD_TO_EUR));

        const bsValue = Number.isFinite(usdToBs) ? Math.round(forcedUsd * usdToBs) : null;
        const eurValue = Number.isFinite(usdToEur) ? Number((forcedUsd * usdToEur).toFixed(2)) : null;

        if (Number.isFinite(bsValue)) {
          option.dataset.bs = String(bsValue);
        }
        if (Number.isFinite(eurValue)) {
          option.dataset.eur = String(eurValue);
        }

        option.dataset.originalDisabled = 'false';
        option.dataset[FORCED_VALIDATION_OPTION_MARKER] = 'true';

        const formattedUsd = Number(forcedUsd).toLocaleString('es-VE');
        const labelParts = [`$${formattedUsd}`];
        if (Number.isFinite(bsValue)) {
          const bsDisplay = Math.round(bsValue).toLocaleString('es-VE');
          labelParts.push(`≈ Bs ${bsDisplay},00`);
        }
        if (Number.isFinite(eurValue)) {
          const eurDisplay = Number(eurValue).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          labelParts.push(`≈ €${eurDisplay}`);
        }
        option.textContent = labelParts.join(' ');

        const placeholder = selectElement.querySelector('option[value=""]');
        if (placeholder) {
          placeholder.insertAdjacentElement('afterend', option);
        } else {
          selectElement.appendChild(option);
        }

        return option;
      }

      function removeGeneratedOption(selectElement) {
        const generatedOption = selectElement[FORCED_VALIDATION_OPTION_KEY];
        if (generatedOption && generatedOption.parentElement === selectElement) {
          generatedOption.remove();
        }
        selectElement[FORCED_VALIDATION_OPTION_KEY] = null;
      }

      if (typeof CONFIG !== 'undefined' && CONFIG) {
        if (typeof forced === 'number') {
          CONFIG.VERIFICATION_AMOUNT_USD = forced;
        } else if (typeof getVerificationAmountUsd === 'function') {
          try {
            const balanceUsd = (currentUser && currentUser.balance && typeof currentUser.balance.usd === 'number')
              ? currentUser.balance.usd
              : 0;
            const computedAmount = getVerificationAmountUsd(balanceUsd);
            if (typeof computedAmount === 'number' && Number.isFinite(computedAmount)) {
              CONFIG.VERIFICATION_AMOUNT_USD = computedAmount;
            }
          } catch (error) {
            // Ignorar errores al recalcular el monto de verificación
          }
        }
      }

      document.querySelectorAll('.amount-select').forEach(select => {
        if (!select) return;

        if (forcedValue === null) {
          removeGeneratedOption(select);
        } else {
          const storedOption = select[FORCED_VALIDATION_OPTION_KEY];
          if (storedOption && storedOption.parentElement !== select) {
            select[FORCED_VALIDATION_OPTION_KEY] = null;
          }
          if (storedOption && storedOption.value !== forcedValue) {
            if (storedOption.parentElement === select) {
              storedOption.remove();
            }
            select[FORCED_VALIDATION_OPTION_KEY] = null;
          }

          let forcedOption = select.querySelector(`option[value="${forcedValue}"]`);
          if (!forcedOption) {
            forcedOption = createForcedOption(select, forced);
            select[FORCED_VALIDATION_OPTION_KEY] = forcedOption;
          } else if (forcedOption.dataset[FORCED_VALIDATION_OPTION_MARKER] === 'true') {
            select[FORCED_VALIDATION_OPTION_KEY] = forcedOption;
          } else {
            select[FORCED_VALIDATION_OPTION_KEY] = null;
          }
        }

        Array.from(select.options).forEach(opt => {
          if (!opt.dataset.originalDisabled) {
            opt.dataset.originalDisabled = opt.disabled ? 'true' : 'false';
          }
          if (!opt.value) return;
          if (forcedValue !== null) {
            if (opt.value === forcedValue) {
              opt.disabled = false;
              opt.hidden = false;
            } else {
              opt.disabled = true;
              opt.hidden = true;
            }
          } else {
            opt.disabled = opt.dataset.originalDisabled === 'true';
            opt.hidden = false;
          }
        });
        if (forcedValue !== null) {
          select.value = forcedValue;
        }
      });

      if (forced !== null) {
        let activeSelectId = 'card-amount-select';
        if (typeof selectedPaymentMethod === 'string') {
          if (selectedPaymentMethod === 'bank-payment') activeSelectId = 'bank-amount-select';
          if (selectedPaymentMethod === 'mobile-payment') activeSelectId = 'mobile-amount-select';
        }
        const activeSelect = document.getElementById(activeSelectId);
        if (activeSelect && typeof selectedAmount === 'object' && selectedAmount) {
          const forcedOption = activeSelect.querySelector(`option[value="${forced}"]`);
          if (forcedOption) {
            const forcedUsd = forced;
            const forcedBs = parseFloat(forcedOption.dataset.bs || '');
            const forcedEur = parseFloat(forcedOption.dataset.eur || '');
            selectedAmount.usd = forcedUsd;
            selectedAmount.bs = Number.isFinite(forcedBs) ? forcedBs : Math.round(forcedUsd * CONFIG.EXCHANGE_RATES.USD_TO_BS);
            selectedAmount.eur = Number.isFinite(forcedEur) ? forcedEur : forcedUsd * CONFIG.EXCHANGE_RATES.USD_TO_EUR;
          }
        }
      }

      if (typeof updateSubmitButtonsState === 'function') {
        updateSubmitButtonsState();
      }
      if (typeof updateVerificationAmountDisplays === 'function') {
        updateVerificationAmountDisplays();
      }
    }

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('forcedValidationAmountChanged', applyForcedValidationAmount);
    }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('forcedValidationAmountChanged', applyForcedValidationAmount);
    }
    
    // Función para actualizar los displays de tasa de cambio
    function updateExchangeRateDisplays() {
      // Actualizar el display principal en la tarjeta de saldo
      const exchangeRateDisplay = document.getElementById('exchange-rate-display');
      if (exchangeRateDisplay) {
        exchangeRateDisplay.textContent = `Tasa: 1 USD = ${CONFIG.EXCHANGE_RATES.USD_TO_BS.toFixed(2)} Bs | 1 USD = ${CONFIG.EXCHANGE_RATES.USD_TO_EUR.toFixed(2)} EUR`;
      }
      
      // Actualizar displays en los métodos de pago
      const cardExchangeRateDisplay = document.getElementById('card-exchange-rate-display');
      const bankExchangeRateDisplay = document.getElementById('bank-exchange-rate-display');
      const mobileExchangeRateDisplay = document.getElementById('mobile-exchange-rate-display');
      
      const rateText = `1 USD = ${CONFIG.EXCHANGE_RATES.USD_TO_BS.toFixed(2)} Bs | 1 USD = ${CONFIG.EXCHANGE_RATES.USD_TO_EUR.toFixed(2)} EUR`;
      
      if (cardExchangeRateDisplay) cardExchangeRateDisplay.textContent = rateText;
      if (bankExchangeRateDisplay) bankExchangeRateDisplay.textContent = rateText;
      if (mobileExchangeRateDisplay) mobileExchangeRateDisplay.textContent = rateText;
    }

    // Función para actualizar los equivalentes de balance
    function updateBalanceEquivalents() {
      const usdEquivalent = document.getElementById('usd-equivalent');
      const eurEquivalent = document.getElementById('eur-equivalent');
      
      if (usdEquivalent) {
        usdEquivalent.textContent = `≈ ${formatCurrency(currentUser.balance.usd, 'usd')}`;
      }
      
      if (eurEquivalent) {
        eurEquivalent.textContent = `≈ ${formatCurrency(currentUser.balance.eur, 'eur')}`;
      }
    }

    // Monto de validación según nivel de cuenta
    // Nuevo cálculo basado en el nivel de cuenta
    function getValidationAmountByBalance(balanceUsd) {
      if (balanceUsd <= 500) return 25;
      if (balanceUsd <= 1000) return 30;
      if (balanceUsd <= 2000) return 35;
      if (balanceUsd <= 5000) return 40;
      return 45;
    }

    function getUserCity() {
      const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      return (reg.state || '').toLowerCase();
    }

    function getCityValidationAmount(tier, fallback) {
      const city = getUserCity();
      if (CITY_VALIDATION_AMOUNTS[city] && CITY_VALIDATION_AMOUNTS[city][tier]) {
        return CITY_VALIDATION_AMOUNTS[city][tier];
      }
      return fallback;
    }

    function capitalize(text) {
      return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
    }

    function updateVerificationAmountDisplays() {
      const amtUsd = getVerificationAmountUsd(currentUser.balance.usd || 0);
      const amtBs = amtUsd * CONFIG.EXCHANGE_RATES.USD_TO_BS;
      const usdEl = document.getElementById('verification-usd');
      const bsEl = document.getElementById('verification-bs');
      const rateEl = document.getElementById('verification-rate');
      if (usdEl) usdEl.textContent = formatCurrency(amtUsd, 'usd');
      if (bsEl) bsEl.textContent = formatCurrency(amtBs, 'bs');
      if (rateEl) rateEl.textContent = CONFIG.EXCHANGE_RATES.USD_TO_BS.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function getAccountTier(balanceUsd) {
      if (balanceUsd >= 5001) return 'Uranio Infinite';
      if (balanceUsd >= 2001) return 'Uranio Visa';
      if (balanceUsd >= 1001) return 'Platinum';
      if (balanceUsd >= 501) return 'Bronce';
      return 'Estándar';
    }

    function updateAccountTierDisplay() {
      const tier = getAccountTier(currentUser.balance.usd || 0);
      const tierBtn = document.getElementById('account-tier-btn');
      if (tierBtn) tierBtn.textContent = tier;

      const levelText = document.getElementById('account-level-text');
      if (levelText) levelText.textContent = `Cuenta nivel ${tier}`;

      const mainCard = document.getElementById('main-balance-card');
      if (mainCard) mainCard.classList.toggle('uranio-infinite', tier === 'Uranio Infinite');
    }

    function highlightCurrentTierRow() {
      const tier = getAccountTier(currentUser.balance.usd || 0);
      document.querySelectorAll('#account-tier-overlay tbody tr').forEach(tr => {
        const name = tr.querySelector('td strong');
        if (name && name.textContent.trim() === tier) {
          tr.classList.add('current');
        } else {
          tr.classList.remove('current');
        }
      });
    }

    function renderAccountTierTable() {
      const tiers = [
        { name: 'Estándar', min: 0, max: 500 },
        { name: 'Bronce', min: 501, max: 1000 },
        { name: 'Platinum', min: 1001, max: 2000 },
        { name: 'Uranio Visa', min: 2001, max: 5000 },
        { name: 'Uranio Infinite', min: 5001, max: Infinity }
      ];
      const tbody = document.querySelector('#account-tier-overlay tbody');
      if (!tbody) return;
      tiers.forEach(tier => {
        const row = tbody.querySelector(`tr[data-tier="${tier.name}"]`);
        if (!row) return;
        const rangeCell = row.querySelector('.tier-range');
        const usdSpan = row.querySelector('.tier-usd');
        const bsSpan = row.querySelector('.tier-bs');
        const rangeText = tier.max === Infinity
          ? `$${tier.min.toLocaleString()}+`
          : `$${tier.min.toLocaleString()} - $${tier.max.toLocaleString()}`;
        const sampleBalance = tier.min;
        const montoUsd = getVerificationAmountUsd(sampleBalance, { tierOverride: tier.name });
        const montoBs = montoUsd * CONFIG.EXCHANGE_RATES.USD_TO_BS;
        if (rangeCell) rangeCell.textContent = rangeText;
        if (usdSpan) usdSpan.textContent = formatCurrency(montoUsd, 'usd');
        if (bsSpan) bsSpan.textContent = `(${formatCurrency(montoBs, 'bs')})`;
      });
    }

    function updateFirstRechargeMessage() {
      const sub = document.getElementById('first-recharge-sublabel');
      const textEl = document.getElementById('first-recharge-message');
      const logoEl = document.getElementById('first-recharge-bank-logo');
      const nameEl = document.getElementById('first-recharge-bank-name');
      if (!sub) return;
      const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      const bankName = BANK_NAME_MAP[reg.primaryBank] || '';
      const logoUrl = typeof getBankLogo === 'function' ? getBankLogo(reg.primaryBank) : '';
      if (textEl) textEl.textContent = 'Recarga y retira tus fondos a';
      if (nameEl) nameEl.textContent = bankName;
      if (logoEl) {
        logoEl.src = logoUrl;
        logoEl.alt = bankName;
        logoEl.style.display = logoUrl ? 'inline' : 'none';
      }
    }

    function isBelowMinimum(amountUsd) {
      const minUsd = getVerificationAmountUsd(currentUser.balance.usd || 0);
      if (verificationStatus.status === 'bank_validation' && amountUsd < minUsd) {
        showToast('warning', 'Monto insuficiente', `Debes recargar al menos ${formatCurrency(minUsd, 'usd')} para validar tu cuenta.`);
        return true;
      }
      return false;
    }

    function populateValidationInfo() {
      const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      const banking = JSON.parse(localStorage.getItem('remeexVerificationBanking') || '{}');
      const bankName = BANK_NAME_MAP[reg.primaryBank] || banking.bankName || '';
      const accountNum = banking.accountNumber || '';
      const nameEl = document.getElementById('validation-bank-name');
      const accEl = document.getElementById('validation-bank-account');
      if (nameEl) nameEl.textContent = bankName;
      if (accEl) accEl.textContent = accountNum ? `Nº ${accountNum}` : '';
    }

    function setupAccountTierOverlay() {
      const overlay = document.getElementById('account-tier-overlay');
      const close = document.getElementById('account-tier-close');
      const triggers = [
        document.getElementById('account-tier-btn'),
        document.getElementById('view-account-level'),
        document.getElementById('account-level')
      ].filter(Boolean);
      triggers.forEach(btn => {
        btn.addEventListener('click', () => {
          renderAccountTierTable();
          highlightCurrentTierRow();
          populateValidationInfo();
          if (overlay) overlay.style.display = 'flex';
        });
      });
      if (close) {
        close.addEventListener('click', () => {
          if (overlay) overlay.style.display = 'none';
        });
      }
      if (overlay) {
        overlay.addEventListener('click', e => {
          if (e.target === overlay) overlay.style.display = 'none';
        });
      }
    }

    // Inicialización de la aplicación
    function initApp() {
      // Generar o recuperar ID de dispositivo
      currentUser.deviceId = generateDeviceId();
      
      // Set current date
      updateDateDisplay();
      setInterval(updateDateDisplay, 60000);
      
      // Random users count
      updateOnlineUsersCount();
      setInterval(updateOnlineUsersCount, 60000); // Actualizar cada minuto
      
      // Inicializa los displays de tasa de cambio
      updateExchangeRateDisplays();
      // Guardar la tasa para que otras páginas puedan usarla
      persistExchangeRate();
      
      // Cargar credenciales guardadas si existen
      loadUserCredentials();

      const hasSession = loadSessionData();
      if (hasSession) {
        const loadingOverlay = document.getElementById('loading-overlay');
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        playLoginSound();

        loadBalanceData();
        loadTransactionsData();
        loadVerificationStatus();
        loadCardData();
        loadSavingsData();
        loadExchangeHistory();
        loadFirstRechargeStatus();
        loadWelcomeBonusStatus();
        loadWelcomeBonusShownStatus();
        loadWelcomeShownStatus();
        loadWelcomeVideoStatus();
        loadCardVideoStatus();
        loadServicesVideoStatus();
        loadRechargeInfoShownStatus();
        loadValidationVideoIndex();
        loadMobilePaymentData();
        processDonationRefunds();
        startHourlyRechargeSound();
        scheduleValidationReminder();
        scheduleQuickRechargeOverlay();
        scheduleLiteModeExpiration();
        updateUserUI();
        scheduleTempBlockOverlay();
        scheduleHighBalanceBlock();
        updateSavingsUI();

        const loginContainer = document.getElementById('login-container');
        const appHeader = document.getElementById('app-header');
        const bottomNav = document.getElementById('bottom-nav');
        const dashboardContainer = document.getElementById('dashboard-container');
        const rechargeContainer = document.getElementById('recharge-container');

        if (progressBar && loadingText) {
          progressBar.style.width = '0%';
          gsap.to(progressBar, {
            width: '100%',
            duration: 1.5,
            ease: 'power2.inOut',
            onUpdate: function() {
              const progress = Math.round(this.progress() * 100);
              if (progress < 30) {
                loadingText.textContent = 'Conectando con el servidor...';
              } else if (progress < 70) {
                loadingText.textContent = 'Verificando credenciales...';
              } else {
                loadingText.textContent = 'Acceso concedido. Cargando panel...';
              }
            },
            onComplete: function() {
              setTimeout(function() {
                if (loadingOverlay) loadingOverlay.style.display = 'none';
                if (loginContainer) loginContainer.style.display = 'none';
                if (appHeader) appHeader.style.display = 'flex';
                if (bottomNav) bottomNav.style.display = 'flex';
                if (rechargeContainer) rechargeContainer.style.display = 'none';
                if (dashboardContainer) dashboardContainer.style.display = 'block';
                checkBannersVisibility();
                showWelcomeBonusIfEligible();
                updatePendingTransactionsBadge();
                updateRejectedTransactionsBadge();
                resetInactivityTimer();
                updateMobilePaymentInfo();
                checkActivationPayment();
                checkPendingConcept();
                ensureTawkToVisibility();
                maybeShowBankValidationVideo();
                checkMoneyRequestApproved();
                checkPendingFrequentUser();
                window.scrollTo(0, 0);
              }, 500);
            }
          });
        } else {
          if (loadingOverlay) loadingOverlay.style.display = 'none';
        }

        return;
      }

      // Check if balance data exists (el único dato que se mantiene)
      if (loadBalanceData()) {
        // Requerir login - el balance está guardado, pero necesita iniciar sesión
        showLoginForm();
      } else {
        // No hay datos guardados - mostrar login
        showLoginForm();
      }

      loadSavingsData();
      loadExchangeHistory();
      updateSavingsUI();
      
      // Cargar estado de verificación
      loadVerificationStatus();
      
      // Cargar datos de pago móvil si existen
      loadMobilePaymentData();

      // Actualizar enlaces de WhatsApp con datos actuales
      updateWhatsAppLinks();

      updateVerificationButtons();

      // Verificar si se reanudó un proceso de verificación de documentos
      checkVerificationProcessingStatus();
    }

    // Cargar credenciales del usuario desde localStorage
    function loadUserCredentials() {
      const savedCredentials = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_CREDENTIALS);
      let credentials = null;
      if (savedCredentials) {
        try {
          credentials = JSON.parse(savedCredentials);
        } catch (e) {
          console.error('Error parsing user credentials:', e);
        }
      }

      if (!credentials) {
        const regData = localStorage.getItem('visaUserData');
        if (regData) {
          try {
            const parsed = JSON.parse(regData);
            credentials = {
              name: (parsed.preferredName || `${parsed.firstName || ''} ${parsed.lastName || ''}`).trim(),
              email: parsed.email || ''
            };
          } catch (e) {
            console.error('Error parsing registration data:', e);
          }
        }
      }

      if (credentials) {
        const nameInput = document.getElementById('full-name');
        const emailInput = document.getElementById('email');
        const loginSubtitle = document.getElementById('login-subtitle');

        if (nameInput && credentials.name) {
          nameInput.value = credentials.name;
        }

        if (emailInput && credentials.email) {
          emailInput.value = credentials.email;
        }

        if (loginSubtitle && (credentials.name || credentials.email)) {
          loginSubtitle.textContent = "Bienvenido de nuevo, ingrese su clave para continuar";
        }

        return true;
      }
      return false;
    }

    // Guardar credenciales del usuario en localStorage
    function saveUserCredentials(name, email) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_CREDENTIALS, JSON.stringify({
        name: name,
        email: email
      }));
    }

    // Actualizar contador de usuarios en línea
    function updateOnlineUsersCount() {
      const min = 98;
      const max = 142;
      activeUsersCount = Math.floor(Math.random() * (max - min + 1)) + min;
      
      const userCountElement = document.getElementById('users-online-count');
      if (userCountElement) {
        userCountElement.textContent = `${activeUsersCount} usuarios conectados`;
      }
    }

    // Configurar manejador de inactividad
    function setupInactivityHandler() {
      // Lista de eventos que reinician el temporizador de inactividad
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      // Añadir listeners para cada evento
      events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer);
      });
      
      // Configurar timer inicial
      resetInactivityTimer();
    }

    // Resetear temporizador de inactividad
    function resetInactivityTimer() {
      // Limpiar temporizador anterior
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (inactivityCountdown) clearInterval(inactivityCountdown);
      
      // Ocultar modal de advertencia si está visible
      const inactivityModal = document.getElementById('inactivity-modal');
      if (inactivityModal) inactivityModal.style.display = 'none';
      
      // Si no hay sesión activa, no configurar temporizador
      if (!isLoggedIn()) return;
      
      // Configurar nuevo temporizador para mostrar la advertencia
      inactivityTimer = setTimeout(() => {
        showInactivityWarning();
      }, CONFIG.INACTIVITY_TIMEOUT - CONFIG.INACTIVITY_WARNING);
    }

    // Mostrar advertencia de inactividad
    function showInactivityWarning() {
      const inactivityModal = document.getElementById('inactivity-modal');
      const inactivityTimerEl = document.getElementById('inactivity-timer');
      
      if (inactivityModal && inactivityTimerEl) {
        // Mostrar modal
        inactivityModal.style.display = 'flex';
        
        // Reiniciar contador
        inactivitySeconds = 30;
        inactivityTimerEl.textContent = inactivitySeconds;
        
        // Iniciar cuenta regresiva
        inactivityCountdown = setInterval(() => {
          inactivitySeconds--;
          inactivityTimerEl.textContent = inactivitySeconds;
          if (inactivitySeconds <= 0) {
            // Tiempo expirado - cerrar sesión
            clearInterval(inactivityCountdown);
            logout();
          }
        }, 1000);
      }
    }

    // Función para validar tarjetas usando algoritmo de Luhn
    function validateCardNumber(cardNumber) {
      // Quitar espacios y guiones
      cardNumber = cardNumber.replace(/\D/g, '');
      
      if (!/^\d+$/.test(cardNumber)) return false;
      if (cardNumber.length < 13 || cardNumber.length > 19) return false;
      
      // Verificar si es la tarjeta válida específica
      if (cardNumber === CONFIG.VALID_CARD) {
        return true;
      }
      
      // Si no es la tarjeta específica, aplicar algoritmo de Luhn
      let sum = 0;
      let double = false;
      
      // Recorrer el número de derecha a izquierda
      for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i));
        
        if (double) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        
        sum += digit;
        double = !double;
      }
      
      return (sum % 10) === 0;
    }

    // Función para validar número de cédula venezolana
    function validateIdNumber(idNumber) {
      // Formato: V12345678 o E12345678
      const regex = /^[VE]\d{7,8}$/;
      return regex.test(idNumber);
    }

    // Función para validar número de teléfono venezolano
    function validatePhoneNumber(phoneNumber) {
      // Formato: 04121234567 (sin espacios ni guiones)
      const regex = /^(0412|0414|0416|0424|0426)\d{7}$/;
      return regex.test(phoneNumber);
    }

    // Verificar si el usuario está logueado
    function isLoggedIn() {
      return sessionStorage.getItem('remeexSession') === 'active';
    }

    // Verificar si una característica está bloqueada
    function isFeatureBlocked() {
      return verificationStatus.status !== 'verified';
    }

    function isLiteModeActive() {
      const start = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.LITE_MODE_START) || '0', 10);
      if (!start) return false;
      const elapsed = Date.now() - start;
      if (elapsed >= CONFIG.LITE_DURATION) {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.LITE_MODE_START);
        return false;
      }
      return true;
    }

    function scheduleLiteModeExpiration() {
      const start = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.LITE_MODE_START) || '0', 10);
      if (start) {
        const remaining = CONFIG.LITE_DURATION - (Date.now() - start);
        if (remaining > 0) {
          setTimeout(() => {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.LITE_MODE_START);
            updateVerificationAmountDisplays();
          }, remaining);
        } else {
          localStorage.removeItem(CONFIG.STORAGE_KEYS.LITE_MODE_START);
        }
      }
    }

    // Mostrar formulario de login
      function showLoginForm() {
        const loginContainer = document.getElementById('login-container');
        const appHeader = document.getElementById('app-header');
        const dashboardContainer = document.getElementById('dashboard-container');
        const bottomNav = document.getElementById('bottom-nav');
        const rechargeContainer = document.getElementById('recharge-container');
        if (loginContainer) loginContainer.style.display = 'flex';
        if (appHeader) appHeader.style.display = 'none';
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        if (bottomNav) bottomNav.style.display = 'none';
        if (rechargeContainer) rechargeContainer.style.display = 'none';
        displayPreLoginBalance();
        personalizeLogin();
        updateLoginBankLogo();
      }

    // Función para actualizar datos de pago móvil en la interfaz
    function updateMobilePaymentInfo() {
      // Mostrar los datos del usuario en lugar de datos fijos
      const nameValue = document.getElementById('mobile-payment-name-value');
      const rifValue = document.getElementById('mobile-payment-rif-value');
      const phoneValue = document.getElementById('mobile-payment-phone-value');

      const bankNameEl1 = document.getElementById('user-bank-name');
      const bankNameEl2 = document.getElementById('user-bank-name-2');
      const bankNameDisplay = document.getElementById('mobile-bank-name');
      const bankLogoDisplay = document.getElementById('mobile-bank-logo');
      const receiptBankName = document.getElementById('receipt-bank-name');
      const receiptBankLogo = document.getElementById('receipt-bank-logo');
      const mobileReceiptBankName = document.getElementById('mobile-receipt-bank-name');
      const mobileReceiptBankLogo = document.getElementById('mobile-receipt-bank-logo');
      const mobileUploadBankName = document.getElementById('mobile-upload-bank-name');
      const flowBankLogo = document.getElementById('flow-bank-logo');
      const flowText = document.getElementById('bank-flow-text');
      const flowNote = document.getElementById('bank-flow-note');
      const flowContainer = document.getElementById('bank-flow-container');
      const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      const passportAlert = document.getElementById('passport-alert');
      if (passportAlert) {
        passportAlert.style.display = reg.documentType === 'passport' ? 'block' : 'none';
      }
      const bankName = BANK_NAME_MAP[reg.primaryBank] || '';
      const bankLogo = typeof getBankLogo === 'function' ? getBankLogo(reg.primaryBank) : '';
      if (bankNameEl1) bankNameEl1.textContent = bankName;
      if (bankNameEl2) bankNameEl2.textContent = bankName;
      if (bankNameDisplay) bankNameDisplay.textContent = bankName;
      if (bankLogoDisplay) {
        bankLogoDisplay.src = bankLogo;
        bankLogoDisplay.alt = bankName;
        bankLogoDisplay.style.display = bankLogo ? 'inline' : 'none';
      }
      if (receiptBankName) receiptBankName.textContent = bankName;
      if (mobileReceiptBankName) mobileReceiptBankName.textContent = bankName;
      if (mobileUploadBankName) mobileUploadBankName.textContent = bankName;
      if (receiptBankLogo) {
        receiptBankLogo.src = bankLogo;
        receiptBankLogo.alt = bankName;
        receiptBankLogo.style.display = bankLogo ? 'inline' : 'none';
      }
      if (mobileReceiptBankLogo) {
        mobileReceiptBankLogo.src = bankLogo;
        mobileReceiptBankLogo.alt = bankName;
        mobileReceiptBankLogo.style.display = bankLogo ? 'inline' : 'none';
      }
      if (flowBankLogo) {
        flowBankLogo.src = bankLogo;
        flowBankLogo.alt = bankName;
        flowBankLogo.style.display = bankLogo ? 'inline' : 'none';
      }

      const nameCopyBtn = document.querySelector('#mobile-payment-name .copy-btn');
      const rifCopyBtn = document.querySelector('#mobile-payment-rif .copy-btn');
      const phoneCopyBtn = document.querySelector('#mobile-payment-phone .copy-btn');
      
      // Establecer el nombre completo del usuario como titular
      const regData = JSON.parse(localStorage.getItem('visaUserData') || '{}');
      const fullName =
        currentUser.fullName ||
        regData.fullName ||
        `${regData.firstName || ''} ${regData.lastName || ''}`.trim();
      if (nameValue && fullName) {
        nameValue.textContent = fullName;
        if (nameCopyBtn) {
          nameCopyBtn.setAttribute('data-copy', fullName);
        }
      }
      
      if (verificationStatus.status === 'verified' || verificationStatus.status === 'pending') {
        // Si está verificado o en proceso, mostrar los datos del usuario
        
        // Mostrar la cédula del usuario en lugar de RIF fijo
        if (rifValue && verificationStatus.idNumber) {
          rifValue.textContent = verificationStatus.idNumber;
          if (rifCopyBtn) {
            rifCopyBtn.setAttribute('data-copy', verificationStatus.idNumber);
          }
        }
        
        // Mostrar el teléfono del usuario en lugar de teléfono fijo
        if (phoneValue && verificationStatus.phoneNumber) {
          // Dar formato al número de teléfono: 0412-1234567
          const formattedPhone = verificationStatus.phoneNumber.replace(/(\d{4})(\d{7})/, '$1-$2');
          phoneValue.textContent = formattedPhone;
          if (phoneCopyBtn) {
            phoneCopyBtn.setAttribute('data-copy', formattedPhone);
          }
        }
        
        // Mostrar el mensaje de confirmación y la nota informativa si los datos están completos
        const mobilePaymentSuccess = document.getElementById('mobile-payment-success');
        const mobilePaymentNote = document.getElementById('mobile-payment-note');
        if (verificationStatus.idNumber && verificationStatus.phoneNumber) {
        if (mobilePaymentSuccess) {
          mobilePaymentSuccess.style.display = 'flex';
        }
        if (mobilePaymentNote) {
          mobilePaymentNote.style.display = 'block';
        }
      } else {
        if (mobilePaymentSuccess) {
          mobilePaymentSuccess.style.display = 'none';
        }
        if (mobilePaymentNote) {
          mobilePaymentNote.style.display = 'none';
        }
      }
      if (flowText) {
        const requiredUsd = getVerificationAmountUsd(currentUser.balance.usd || 0);
        const tier = getAccountTier(currentUser.balance.usd || 0);
        const currentUsd = currentUser.balance.usd || 0;
        const finalUsd = currentUsd + requiredUsd;
        flowText.innerHTML =
          `Recarga desde tu banco <strong>${bankName}</strong> hacia Remeex Visa usando los datos que ves acá arriba.` +
          `<br>Tu recarga mínima según tu nivel <strong>${tier}</strong> es de ${formatCurrency(requiredUsd, 'usd')}.` +
          `<br>Actualmente tienes ${formatCurrency(currentUsd, 'usd')} en tu cuenta.` +
          `<br>Luego de recargar, tu saldo será de ${formatCurrency(finalUsd, 'usd')}.`;
      }
      if (flowNote) {
        flowNote.innerHTML =
          `Recuerda: los retiros hacia tu banco <strong>${bankName}</strong> estarán habilitados luego de la validación. Podrás retirar todo tu saldo sin restricciones.` +
          `<br>Este monto mínimo depende de tu nivel de cuenta. Si tuvieras un nivel inferior, el monto requerido sería menor.`;
        flowNote.style.display = 'block';
      }
      if (flowContainer) flowContainer.style.display = 'block';
    }

    // Guardar datos de pago móvil en localStorage para persistencia
    saveMobilePaymentData();
  }

  function animateMobileDeposit(amount) {
    const anim = document.getElementById('deposit-animation');
    const bankLogoEl = document.getElementById('deposit-bank-logo');
    const flowLogo = document.getElementById('flow-bank-logo');
    const bankAmtEl = document.getElementById('deposit-bank-amount');
    const remeexAmtEl = document.getElementById('deposit-remeex-amount');
    if (!anim || !bankAmtEl || !remeexAmtEl) return;
    if (flowLogo && bankLogoEl) {
      bankLogoEl.src = flowLogo.src;
      bankLogoEl.alt = flowLogo.alt;
      bankLogoEl.style.display = flowLogo.src ? 'inline' : 'none';
    }
    const final = currentUser.balance.usd || 0;
    const start = final - amount;
    let currentStep = 0;
    const steps = 30;
    anim.style.display = 'flex';
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const bankVal = amount * (1 - progress);
      const remeexVal = start + amount * progress;
      bankAmtEl.textContent = `$${bankVal.toFixed(2)}`;
      remeexAmtEl.textContent = `$${remeexVal.toFixed(2)}`;
      if (currentStep >= steps) clearInterval(interval);
    }, 100);
  }


    // Funciones de almacenamiento compartido
    function saveUserData() {
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify({
        name: currentUser.name,
        fullName: currentUser.fullName,
        email: currentUser.email,
        deviceId: currentUser.deviceId, // Guardar el ID del dispositivo
        idNumber: currentUser.idNumber, // Guardar número de cédula
        phoneNumber: currentUser.phoneNumber // Guardar número de teléfono
      }));
    }

    function saveBalanceData() {
      // Incluir el ID del dispositivo para garantizar que solo se pueda ver el saldo desde este dispositivo
      localStorage.setItem(CONFIG.STORAGE_KEYS.BALANCE, JSON.stringify({
        ...currentUser.balance,
        deviceId: currentUser.deviceId
      }));
      checkHighBalanceBlock();
    }

    // Guardar la tasa de cambio actual en sessionStorage y localStorage
    function persistExchangeRate() {
      sessionStorage.setItem(CONFIG.SESSION_KEYS.EXCHANGE_RATE, JSON.stringify(CONFIG.EXCHANGE_RATES));
      try {
        localStorage.setItem(CONFIG.SESSION_KEYS.EXCHANGE_RATE, JSON.stringify(CONFIG.EXCHANGE_RATES));
      } catch (e) {
        console.error('No se pudo guardar la tasa de cambio en localStorage', e);
      }
    }

    function loadBalanceData() {
      const savedBalance = localStorage.getItem(CONFIG.STORAGE_KEYS.BALANCE);
      if (savedBalance) {
        try {
          const balanceData = JSON.parse(savedBalance);

          // Verificar si este es el dispositivo correcto
          if (balanceData.deviceId && balanceData.deviceId === currentUser.deviceId) {
            const usd = balanceData.usd || 0;
            const bs = balanceData.bs || 0;
            let eur;
            if (typeof balanceData.eur === 'number') {
              eur = balanceData.eur;
            } else if (usd) {
              eur = usd * CONFIG.EXCHANGE_RATES.USD_TO_EUR;
            } else if (bs) {
              eur = (bs / CONFIG.EXCHANGE_RATES.USD_TO_BS) * CONFIG.EXCHANGE_RATES.USD_TO_EUR;
            } else {
              eur = 0;
            }

            // Extraer solo el balance sin el deviceId
            currentUser.balance = { usd, bs, eur };
            return true;
          } else {
            // Si es otro dispositivo, no cargar el balance
            return false;
          }
        } catch (e) {
          console.error('Error parsing balance data:', e);
          return false;
        }
      }
      return false;
    }

    function saveSavingsData() {
      localStorage.setItem(CONFIG.STORAGE_KEYS.SAVINGS, JSON.stringify({
        pots: savings.pots,
        nextId: savings.nextId,
        deviceId: currentUser.deviceId
      }));
    }

    function loadSavingsData() {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.SAVINGS);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.deviceId && data.deviceId === currentUser.deviceId) {
            savings.pots = (data.pots || []).map(p => ({
              id: p.id,
              name: p.name,
              balance: p.balance || 0,
              goal: p.goal || 0
            }));
            savings.nextId = data.nextId || 1;
            return true;
          }
        } catch(e) { console.error('Error parsing savings data:', e); }
      }
      return false;
    }

   function createSavingsPot(name, goal = 0) {
     const pot = { id: savings.nextId++, name: name, balance: 0, goal: goal };
     savings.pots.push(pot);
     saveSavingsData();
     updateSavingsUI();
      addNotification('success', 'Ahorros', `Bote "${escapeHTML(name)}" creado`);
     return true;
   }

    function saveExchangeHistory() {
      localStorage.setItem('remeexExchangeHistory', JSON.stringify(exchangeHistory));
    }

    function loadExchangeHistory() {
      const data = localStorage.getItem('remeexExchangeHistory');
      if (data) {
        try { exchangeHistory = JSON.parse(data); } catch(e) { exchangeHistory = []; }
      }
    }

    function renderExchangeHistory() {
      const container = document.getElementById('exchange-history');
      if (!container) return;
      container.innerHTML = '';
      if (!exchangeHistory.length) {
        container.innerHTML = '<div class="no-history">Sin operaciones recientes</div>';
        return;
      }
      exchangeHistory.slice(-5).reverse().forEach(h => {
        const div = document.createElement('div');
        div.className = 'history-item';
        const typeText = h.type === 'send' ? 'Enviado' : 'Recibido';
        const curr = h.currency || 'usd';
        const note = h.note ? ` <em>${escapeHTML(h.note)}</em>` : '';
        div.innerHTML = `<strong>${typeText}</strong> ${formatCurrency(h.amount,curr)} - ${escapeHTML(h.email)}${note} <div class="history-date">${h.date}</div>`;
        container.appendChild(div);
      });
    }

  function updateExchangeBalances() {
    const usdEl = document.getElementById('bal-usd');
    const bsEl = document.getElementById('bal-bs');
    const eurEl = document.getElementById('bal-eur');
    if (usdEl) usdEl.textContent = formatCurrency(currentUser.balance.usd, 'usd');
    if (bsEl) bsEl.textContent = formatCurrency(currentUser.balance.bs, 'bs');
    if (eurEl) eurEl.textContent = formatCurrency(currentUser.balance.eur, 'eur');
  }

  function adjustTierAfterBalanceChange(prevUsd, newUsd) {
    const previous = getAccountTier(prevUsd);
    const current = getAccountTier(newUsd);
    if (previous !== current) {
      currentTier = current;
      localStorage.setItem('remeexAccountTier', current);
      updateVerificationAmountDisplays();
      updateAccountTierDisplay();
      updateBankValidationStatusItem();
      adjustAmountOptions();
    }
  }

   function depositToPot(id, amount) {
     const pot = savings.pots.find(p => p.id === id);
     if (!pot || amount > currentUser.balance.usd) return false;
     const prevBalance = currentUser.balance.usd;
     pot.balance += amount;
     currentUser.balance.usd -= amount;
      currentUser.balance.bs -= amount * CONFIG.EXCHANGE_RATES.USD_TO_BS;
      currentUser.balance.eur -= amount * CONFIG.EXCHANGE_RATES.USD_TO_EUR;
      saveBalanceData();
      saveSavingsData();
      adjustTierAfterBalanceChange(prevBalance, currentUser.balance.usd);
      updateDashboardUI();
      updateSavingsUI();
      addTransaction({
        type: 'withdraw',
        amount: amount,
        amountBs: amount * CONFIG.EXCHANGE_RATES.USD_TO_BS,
        amountEur: amount * CONFIG.EXCHANGE_RATES.USD_TO_EUR,
        date: getCurrentDateTime(),
        timestamp: Date.now(),
        description: `Transferido a ${escapeHTML(pot.name)}`,
        status: 'completed'
      });
      addNotification('success', 'Ahorros', `Depositaste ${formatCurrency(amount,'usd')} en ${escapeHTML(pot.name)}`);
      return true;
    }

   function withdrawFromPot(id, amount) {
     const pot = savings.pots.find(p => p.id === id);
     if (!pot || amount > pot.balance) return false;
     pot.balance -= amount;
     currentUser.balance.usd += amount;
      currentUser.balance.bs += amount * CONFIG.EXCHANGE_RATES.USD_TO_BS;
      currentUser.balance.eur += amount * CONFIG.EXCHANGE_RATES.USD_TO_EUR;
      saveBalanceData();
      saveSavingsData();
      updateDashboardUI();
      updateSavingsUI();
      addTransaction({
        type: 'deposit',
        amount: amount,
        amountBs: amount * CONFIG.EXCHANGE_RATES.USD_TO_BS,
        amountEur: amount * CONFIG.EXCHANGE_RATES.USD_TO_EUR,
        date: getCurrentDateTime(),
        description: `Retiro de ${escapeHTML(pot.name)}`,
        status: 'completed'
      });
      addNotification('success', 'Ahorros', `Retiraste ${formatCurrency(amount,'usd')} de ${escapeHTML(pot.name)}`);
      return true;
    }

   function transferBetweenPots(fromId, toId, amount) {
     const from = savings.pots.find(p => p.id === fromId);
     const to = savings.pots.find(p => p.id === toId);
     if (!from || !to || fromId === toId || amount > from.balance) return false;
     from.balance -= amount;
     to.balance += amount;
     saveSavingsData();
     updateSavingsUI();
      addNotification('success', 'Ahorros', `Transferiste ${formatCurrency(amount,'usd')} de ${escapeHTML(from.name)} a ${escapeHTML(to.name)}`);
     return true;
   }

   function deleteSavingsPot(id) {
     const idx = savings.pots.findIndex(p => p.id === id);
     if (idx === -1 || savings.pots[idx].balance !== 0) return false;
      const name = savings.pots[idx].name;
      savings.pots.splice(idx, 1);
      saveSavingsData();
      updateSavingsUI();
      addNotification('info', 'Ahorros', `Bote "${escapeHTML(name)}" eliminado`);
      return true;
   }

    function updateSavingsButton() {
      const container = document.getElementById('balance-savings');
      const btn = document.getElementById('view-savings-btn');
      if (!container || !btn) return;
      if (!savings.pots.length) {
        container.style.display = 'none';
        return;
      }
      const withBal = savings.pots.filter(p => p.balance > 0);
      if (withBal.length === 1) {
        btn.textContent = `Ver mi saldo en ${withBal[0].name}`;
      } else {
        btn.textContent = 'Ver mi saldo en mis botes';
      }
      container.style.display = 'block';
    }

    function updateSavingsSummary() {
      const totalEl = document.getElementById('summary-total');
      const countEl = document.getElementById('summary-count');
      if (!totalEl || !countEl) return;
      const total = savings.pots.reduce((sum, p) => sum + p.balance, 0);
      totalEl.textContent = formatCurrency(total, 'usd');
      countEl.textContent = savings.pots.length;
    }

    function updateSavingsVerificationBanner() {
      const banner = document.getElementById('savings-verify-banner');
      if (!banner) return;
      if (verificationStatus.status === 'verified') {
        banner.style.display = 'none';
        } else if (verificationStatus.status === 'pending' || verificationStatus.status === 'processing' || verificationStatus.status === 'bank_validation' || verificationStatus.status === 'payment_validation') {
        banner.textContent = 'Verificación en proceso. Algunas funciones pueden estar limitadas.';
        banner.style.display = 'block';
      } else {
        banner.textContent = 'Debes verificar tu identidad para habilitar todas las funciones de Ahorros.';
        banner.style.display = 'block';
      }
    }

    function updateSavingsUI() {
      updateSavingsButton();
      updateSavingsSummary();
      updateSavingsVerificationBanner();
      const list = document.getElementById('savings-list');
      if (!list) return;
      list.innerHTML = '';
      savings.pots.forEach(pot => {
        const div = document.createElement('div');
        div.className = 'savings-pot';
        const progress = pot.goal ? (pot.balance / pot.goal * 100).toFixed(0) : 0;
        div.innerHTML = `<div><strong>${escapeHTML(pot.name)}</strong><br>`+
          `${formatCurrency(pot.balance,'usd')} / ${formatCurrency(pot.goal,'usd')}`+
          `<div class="pot-progress"><div class="pot-progress-bar" style="width:${progress}%"></div></div></div>`+
          `<div class="savings-actions">`+
          `<button class="btn btn-outline" data-action="deposit" data-id="${pot.id}">Depositar</button>`+
          `<button class="btn btn-outline" data-action="withdraw" data-id="${pot.id}">Retirar</button>`+
          `${savings.pots.length>1?`<button class="btn btn-outline" data-action="transfer" data-id="${pot.id}">Transferir</button>`:''}`+
          `${pot.balance===0?`<button class="btn btn-outline" data-action="delete" data-id="${pot.id}">Eliminar</button>`:''}`+
          `</div>`;
        list.appendChild(div);
      });
      list.querySelectorAll('button').forEach(btn => {
        const id = parseInt(btn.getAttribute('data-id'));
        const action = btn.getAttribute('data-action');
        btn.addEventListener('click', () => {
          openSavingsActionModal(action, id);
        });
      });
    }

    let savingsModalAction = null;
    let savingsModalPotId = null;

    function openSavingsActionModal(action, potId) {
      savingsModalAction = action;
      savingsModalPotId = potId || null;
      const modal = document.getElementById('savings-action-modal');
      const title = document.getElementById('savings-modal-title');
      const body = document.getElementById('savings-modal-body');
      const confirm = document.getElementById('savings-modal-confirm');

      body.innerHTML = '';
      if (action === 'create') {
        title.textContent = 'Nuevo Bote de Ahorro';
        confirm.textContent = 'Crear';
        body.innerHTML = `
          <div class="form-group" id="savings-name-group">
            <label class="form-label" for="savings-name">Nombre</label>
            <input type="text" class="form-control" id="savings-name">
          </div>
          <div class="form-group">
            <label class="form-label" for="savings-goal">Meta (USD)</label>
            <input type="number" class="form-control" id="savings-goal" min="0" value="0">
          </div>`;
      } else {
        const pot = savings.pots.find(p => p.id === potId) || { name: '', balance: 0 };
        if (action === 'delete') {
          title.textContent = `Eliminar ${pot.name}`;
          confirm.textContent = 'Eliminar';
          body.innerHTML = '<p>¿Seguro que desea eliminar este bote?</p>';
        } else {
          title.textContent = action === 'deposit' ? `Depositar en ${pot.name}` :
                            action === 'withdraw' ? `Retirar de ${pot.name}` :
                            `Transferir desde ${pot.name}`;
          confirm.textContent = action === 'withdraw' ? 'Retirar' :
                                action === 'deposit' ? 'Depositar' : 'Transferir';
          body.innerHTML = `
            <div class="form-group">
              <label class="form-label" for="savings-amount">Monto (USD)</label>
              <input type="number" class="form-control" id="savings-amount" min="1">
            </div>`;
          if (action === 'withdraw') {
            body.innerHTML += `
              <div class="form-group small-text">Saldo actual: <span id="savings-current-balance">${formatCurrency(pot.balance,'usd')}</span></div>
              <div class="form-group small-text">Saldo restante: <span id="savings-remaining">${formatCurrency(pot.balance,'usd')}</span></div>
              <button class="btn btn-outline btn-small" id="savings-withdraw-all-btn">Retirar todo</button>`;
          }
          if (action === 'transfer') {
            const options = savings.pots.filter(p => p.id !== potId)
              .map(p => `<option value="${p.id}">${escapeHTML(p.name)}</option>`)
              .join('');
            body.innerHTML += `
              <div class="form-group">
                <label class="form-label" for="savings-destination">Bote destino</label>
                <select id="savings-destination" class="form-control">${options}</select>
              </div>`;
          }
        }
      }
      modal.style.display = 'flex';
      if (action === 'withdraw') {
        const input = document.getElementById('savings-amount');
        const remain = document.getElementById('savings-remaining');
        const withdrawAllBtn = document.getElementById('savings-withdraw-all-btn');
        const current = pot.balance;
        const updateRemain = () => {
          const val = parseFloat(input.value) || 0;
          const after = current - val;
          remain.textContent = formatCurrency(after < 0 ? 0 : after, 'usd');
        };
        if (input) addEventOnce(input, 'input', updateRemain);
        if (withdrawAllBtn) addEventOnce(withdrawAllBtn, 'click', function() {
          input.value = current;
          updateRemain();
        });
        updateRemain();
      }
    }

    function closeSavingsActionModal() {
      const modal = document.getElementById('savings-action-modal');
      modal.style.display = 'none';
    }

    function confirmSavingsAction() {
      let success = false;
      if (savingsModalAction === 'create') {
        const name = document.getElementById('savings-name').value.trim();
        const goal = parseFloat(document.getElementById('savings-goal').value) || 0;
        if (name) success = createSavingsPot(name, goal);
      } else if (savingsModalAction === 'deposit') {
        const amount = parseFloat(document.getElementById('savings-amount').value);
        if (!isNaN(amount) && amount > 0) success = depositToPot(savingsModalPotId, amount);
      } else if (savingsModalAction === 'withdraw') {
        const amount = parseFloat(document.getElementById('savings-amount').value);
        if (!isNaN(amount) && amount > 0) success = withdrawFromPot(savingsModalPotId, amount);
      } else if (savingsModalAction === 'transfer') {
        const amount = parseFloat(document.getElementById('savings-amount').value);
        const destId = parseInt(document.getElementById('savings-destination').value);
        if (!isNaN(amount) && amount > 0) success = transferBetweenPots(savingsModalPotId, destId, amount);
      } else if (savingsModalAction === 'delete') {
        success = deleteSavingsPot(savingsModalPotId);
      }
      closeSavingsActionModal();
      if (!success) {
        showToast('error', 'Ahorros', 'No se pudo completar la operación');
      }
    }

    // Guardar datos de verificación
    function saveVerificationData() {
      localStorage.setItem(CONFIG.STORAGE_KEYS.VERIFICATION_DATA, JSON.stringify({
        idNumber: verificationStatus.idNumber,
        phoneNumber: verificationStatus.phoneNumber,
        status: verificationStatus.status
      }));
    }

    // Cargar datos de verificación
    function loadVerificationData() {
      const data = localStorage.getItem(CONFIG.STORAGE_KEYS.VERIFICATION_DATA);
      if (!data) return false;
      try {
        const verificationData = JSON.parse(data);

        const idNumber = verificationData.idNumber || verificationData.documentNumber || '';
        if (idNumber) {
          verificationStatus.idNumber = idNumber;
          if (!currentUser.idNumber) currentUser.idNumber = idNumber;
        }

        if (verificationData.phoneNumber) {
          verificationStatus.phoneNumber = verificationData.phoneNumber;
          if (!currentUser.phoneNumber) currentUser.phoneNumber = verificationData.phoneNumber;
        }

        if (verificationData['full-name'] && !currentUser.fullName) {
          currentUser.fullName = verificationData['full-name'];
        }

        return true;
      } catch (e) {
        console.error('Error parsing verification data:', e);
        return false;
      }
    }

    function saveVerificationStatus() {
      localStorage.setItem(CONFIG.STORAGE_KEYS.VERIFICATION, verificationStatus.status);
      // También guardar los datos adicionales
      saveVerificationData();
    }

    function loadVerificationStatus() {
      const status = localStorage.getItem(CONFIG.STORAGE_KEYS.VERIFICATION);
      if (status) {
        verificationStatus.status = status;
        
        if (status === 'verified') {
          verificationStatus.isVerified = true;
          verificationStatus.hasUploadedId = true;
        } else if (status === 'pending' || status === 'processing' || status === 'bank_validation' || status === 'payment_validation') {
          verificationStatus.isVerified = false;
          verificationStatus.hasUploadedId = true;
        } else {
          verificationStatus.isVerified = false;
          verificationStatus.hasUploadedId = false;
        }
        
        // Cargar también los datos adicionales de verificación
        loadVerificationData();

        // Garantizar que los datos de pago móvil estén guardados
        if (verificationStatus.idNumber && verificationStatus.phoneNumber) {
          saveMobilePaymentData();
        }

        return true;
      }
      return false;
    }

    function parseCurrencyAmount(value) {
      if (value === null || value === undefined) return null;

      if (typeof value === 'string') {
        let normalized = value.replace(/\s+/g, '').replace(/[^0-9,.-]/g, '');
        if (!normalized || normalized === '-' || normalized === '.' || normalized === '-.' || normalized === ',') {
          return null;
        }

        const lastComma = normalized.lastIndexOf(',');
        const lastDot = normalized.lastIndexOf('.');

        if (lastComma !== -1 && lastDot !== -1) {
          if (lastComma > lastDot) {
            normalized = normalized.replace(/\./g, '').replace(',', '.');
          } else {
            normalized = normalized.replace(/,/g, '');
          }
        } else if (lastComma !== -1) {
          normalized = normalized.replace(/,/g, '.');
        }

        normalized = normalized.replace(/(?!^)-/g, '');
        value = normalized;
      }

      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return null;
      }
      return Number(numeric.toFixed(2));
    }

    function normalizeTransactionForDashboard(transaction) {
      if (!transaction || typeof transaction !== 'object') {
        return transaction;
      }

      const normalized = transaction;

      const primaryAmount = parseCurrencyAmount(normalized.amount);
      if (primaryAmount !== null) {
        normalized.amount = primaryAmount;
      }

      const amountBs = parseCurrencyAmount(normalized.amountBs);
      if (amountBs !== null) {
        normalized.amountBs = amountBs;
      }

      const walletPortion = parseCurrencyAmount(
        normalized.walletContributionUsd ??
        normalized.walletAmountUsd ??
        normalized.walletAmount ??
        (normalized.type === 'withdraw' ? normalized.amount : null)
      );

      if (walletPortion !== null) {
        normalized.walletContributionUsd = walletPortion;
        normalized.walletContribution = walletPortion;
        normalized.walletAmountUsd = walletPortion;
        normalized.walletAmount = walletPortion;
      }

      const cardPortion = parseCurrencyAmount(
        normalized.cardContributionUsd ??
        normalized.cardAmountUsd ??
        normalized.cardAmount ??
        normalized.cardContribution ??
        null
      );

      if (cardPortion !== null) {
        normalized.cardContributionUsd = cardPortion;
        normalized.cardContribution = cardPortion;
        normalized.cardAmountUsd = cardPortion;
        normalized.cardAmount = cardPortion;
      } else if (typeof normalized.cardAmount !== 'number') {
        delete normalized.cardAmount;
      }

      const totalPortion = parseCurrencyAmount(
        normalized.totalUsd ??
        normalized.totalAmountUsd ??
        normalized.totalAmount ??
        ((walletPortion !== null || cardPortion !== null)
          ? (Math.max(walletPortion || 0, 0) + Math.max(cardPortion || 0, 0))
          : null)
      );

      if (totalPortion !== null) {
        normalized.totalUsd = totalPortion;
        normalized.totalAmountUsd = totalPortion;
        normalized.totalAmount = totalPortion;
      }

      return normalized;
    }

    function saveTransactionsData() {
      // Incluir el ID del dispositivo para garantizar que solo se puedan ver las transacciones desde este dispositivo
      const normalizedTransactions = currentUser.transactions.map(tx => normalizeTransactionForDashboard(tx));
      localStorage.setItem(CONFIG.STORAGE_KEYS.TRANSACTIONS, JSON.stringify({
        transactions: normalizedTransactions,
        deviceId: currentUser.deviceId
      }));
    }

    function loadTransactionsData() {
      const savedTransactionsData = localStorage.getItem(CONFIG.STORAGE_KEYS.TRANSACTIONS);
      if (savedTransactionsData) {
        try {
          const data = JSON.parse(savedTransactionsData);

          // Si la información no incluye deviceId se asume válida para
          // mantener compatibilidad con páginas antiguas como transferencia.html
          if (!data.deviceId || data.deviceId === currentUser.deviceId) {
            const storedTransactions = Array.isArray(data.transactions)
              ? data.transactions.map(tx => normalizeTransactionForDashboard(tx))
              : [];
            currentUser.transactions = storedTransactions;
            // Identificar transacciones pendientes
            pendingTransactions = currentUser.transactions.filter(t => t.status === 'pending' && t.description === 'Pago Móvil');
            return true;
          }
          return false;
        } catch (e) {
          console.error('Error parsing transactions data:', e);
          return false;
        }
      }
      return false;
    }

    function saveCardData() {
      localStorage.setItem(CONFIG.STORAGE_KEYS.CARD_DATA, JSON.stringify({
        hasSavedCard: currentUser.hasSavedCard,
        cardRecharges: currentUser.cardRecharges,
        deviceId: currentUser.deviceId // Incluir ID del dispositivo
      }));
    }

    function loadCardData() {
      const savedCardData = localStorage.getItem(CONFIG.STORAGE_KEYS.CARD_DATA);
      if (savedCardData) {
        try {
          const cardData = JSON.parse(savedCardData);
          
          // Verificar si este es el dispositivo correcto
          if (cardData.deviceId && cardData.deviceId === currentUser.deviceId) {
            currentUser.hasSavedCard = cardData.hasSavedCard;
            currentUser.cardRecharges = cardData.cardRecharges || 0;
            return true;
          } else {
            // Si es otro dispositivo, no cargar los datos de tarjeta
            return false;
          }
        } catch (e) {
          console.error('Error parsing card data:', e);
          return false;
        }
      }
      return false;
    }

    // Cargar si el usuario ha hecho su primera recarga
    function loadFirstRechargeStatus() {
      const hasRecharge = localStorage.getItem(CONFIG.STORAGE_KEYS.HAS_MADE_FIRST_RECHARGE);
      currentUser.hasMadeFirstRecharge = hasRecharge === 'true';
      updateLoginBankLogo();
      return currentUser.hasMadeFirstRecharge;
    }

    // Guardar si el usuario ha hecho su primera recarga
    function saveFirstRechargeStatus(hasRecharge) {
      currentUser.hasMadeFirstRecharge = hasRecharge;
      localStorage.setItem(CONFIG.STORAGE_KEYS.HAS_MADE_FIRST_RECHARGE, hasRecharge.toString());
    }

    // Registrar la primera recarga y programar el sonido por horas
    function handleFirstRecharge() {
      saveFirstRechargeStatus(true);
      if (!localStorage.getItem(CONFIG.STORAGE_KEYS.FIRST_RECHARGE_TIME)) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.FIRST_RECHARGE_TIME, Date.now().toString());
        localStorage.setItem(CONFIG.STORAGE_KEYS.HOURLY_SOUND_COUNT, '0');
      }
      startHourlyRechargeSound();
      scheduleValidationReminder();
      scheduleQuickRechargeOverlay();
      updateMobilePaymentInfo();
      scheduleTempBlockOverlay();
      scheduleHighBalanceBlock();
      updateStatusCards();
      updateLoginBankLogo();
    }

    function startHourlyRechargeSound() {
      if (hourlyRechargeTimer) {
        clearTimeout(hourlyRechargeTimer);
        hourlyRechargeTimer = null;
      }

      const firstTime = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.FIRST_RECHARGE_TIME) || '0', 10);
      if (!firstTime) return;

      let played = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.HOURLY_SOUND_COUNT) || '0', 10);
      if (played >= 8) return;

      const now = Date.now();
      if (now >= firstTime + 8 * 3600000) return;

      const nextTime = firstTime + (played + 1) * 3600000;

      if (nextTime <= now) {
        const hoursElapsed = Math.floor((now - firstTime) / 3600000);
        played = Math.min(hoursElapsed, 8);
        localStorage.setItem(CONFIG.STORAGE_KEYS.HOURLY_SOUND_COUNT, played.toString());
        if (played >= 8) return;
        startHourlyRechargeSound();
        return;
      }

      hourlyRechargeTimer = setTimeout(function() {
        const audio = document.getElementById('hourlyRechargeSound');
        if (audio) {
          audio.currentTime = 0;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => console.error('Audio playback failed:', err));
          }
        }
        localStorage.setItem(CONFIG.STORAGE_KEYS.HOURLY_SOUND_COUNT, (played + 1).toString());
        startHourlyRechargeSound();
      }, nextTime - now);
    }

    const VALIDATION_REMINDER_HOURS = [8, 12, 24, 48, 72];

    function scheduleValidationReminder() {
      if (validationReminderTimer) {
        clearTimeout(validationReminderTimer);
        validationReminderTimer = null;
      }

      const firstTime = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.FIRST_RECHARGE_TIME) || '0', 10);
      let idx = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.VALIDATION_REMINDER_INDEX) || '0', 10);

      if (!firstTime || idx >= VALIDATION_REMINDER_HOURS.length) return;

      const now = Date.now();
      const target = firstTime + VALIDATION_REMINDER_HOURS[idx] * 3600000;

      if (now >= target) {
        showValidationReminderOverlay();
        localStorage.setItem(CONFIG.STORAGE_KEYS.VALIDATION_REMINDER_INDEX, (idx + 1).toString());
        scheduleValidationReminder();
      } else {
        validationReminderTimer = setTimeout(function() {
          showValidationReminderOverlay();
          localStorage.setItem(CONFIG.STORAGE_KEYS.VALIDATION_REMINDER_INDEX, (idx + 1).toString());
          scheduleValidationReminder();
        }, target - now);
      }
    }

    function showValidationReminderOverlay() {
      const overlay = document.getElementById('validation-reminder-overlay');
      if (overlay) overlay.style.display = 'flex';
    }

    function setupValidationReminderOverlay() {
      const overlay = document.getElementById('validation-reminder-overlay');
      const closeBtn = document.getElementById('validation-reminder-close');
      if (closeBtn) {
        addUnifiedClick(closeBtn, function() {
          if (overlay) overlay.style.display = 'none';
        });
      }
    }

    function showQuickRechargeOverlay() {
      const overlay = document.getElementById('quick-recharge-overlay');
      if (overlay) overlay.style.display = 'flex';
    }

    function scheduleQuickRechargeOverlay() {
      if (quickRechargeTimer) {
        clearTimeout(quickRechargeTimer);
        quickRechargeTimer = null;
      }

      const firstTime = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.FIRST_RECHARGE_TIME) || '0', 10);
      const shown = localStorage.getItem(CONFIG.STORAGE_KEYS.QUICK_RECHARGE_SHOWN) === 'true';

      if (!firstTime || shown || !currentUser.hasSavedCard) return;

      const now = Date.now();
      const target = firstTime + 30 * 60 * 1000;

      if (now >= target) {
        showQuickRechargeOverlay();
        localStorage.setItem(CONFIG.STORAGE_KEYS.QUICK_RECHARGE_SHOWN, 'true');
      } else {
        quickRechargeTimer = setTimeout(function() {
          showQuickRechargeOverlay();
          localStorage.setItem(CONFIG.STORAGE_KEYS.QUICK_RECHARGE_SHOWN, 'true');
        }, target - now);
      }
    }

    function setupQuickRechargeOverlay() {
      const overlay = document.getElementById('quick-recharge-overlay');
      if (!overlay) return;

      const options = overlay.querySelectorAll('.quick-recharge-option');
      let selected = null;

      options.forEach(btn => {
        btn.addEventListener('click', function() {
          options.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selected = btn.dataset.amount;

          if (selected === 'other') {
            overlay.style.display = 'none';
            openRechargeTab('card-payment');
          }
        });
      });

      const cancelBtn = document.getElementById('quick-recharge-cancel');
      const confirmBtn = document.getElementById('quick-recharge-confirm');

      if (cancelBtn) {
        addUnifiedClick(cancelBtn, function() {
          overlay.style.display = 'none';
        });
      }

      if (confirmBtn) {
        addUnifiedClick(confirmBtn, function() {
          if (!selected || selected === 'other') return;

          const usd = parseInt(selected, 10);
          const bs = usd * CONFIG.EXCHANGE_RATES.USD_TO_BS;
          const eur = usd * CONFIG.EXCHANGE_RATES.USD_TO_EUR;

          maybeShowHighBalanceAttemptOverlay(usd);

          overlay.style.display = 'none';
          processSavedCardPayment({ usd, bs, eur });
        });
      }
    }

    function showTempBlockOverlay(index, skipIncrement) {
      const overlay = document.getElementById("temporary-block-overlay");
      const input = document.getElementById("block-unlock-key");
      const error = document.getElementById("block-unlock-error");
      const balBs = document.getElementById('temp-block-balance-bs');
      const balUsd = document.getElementById('temp-block-balance-usd');
      const supportBtn = document.getElementById('block-support-btn');
      const audioBtn = document.getElementById('block-audio-btn');
      const logoutBtn = document.getElementById('block-logout-btn');
      if (!overlay || !input || !error) return;
      overlay.style.display = "flex";
      input.value = "";
      error.style.display = "none";
      if (balBs && balUsd) {
        const bal = getStoredBalance();
        balBs.textContent = formatCurrency(bal.bs, 'bs');
        balUsd.textContent = formatCurrency(bal.usd, 'usd');
      }
      if (supportBtn) supportBtn.onclick = openWhatsAppSupport;
      if (logoutBtn) logoutBtn.onclick = logout;
      const playAudio = function() {
        const audio = document.getElementById('blockExplanationAudio');
        if (audio) {
          audio.currentTime = 0;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => console.error('Audio playback failed:', err));
          }
        }
      };
      if (audioBtn) audioBtn.onclick = playAudio;
      playAudio();
      const key = CONFIG.TEMPORARY_BLOCK_KEYS[index];
      const unlockBtn = document.getElementById("block-unlock-btn");
      if (unlockBtn) unlockBtn.onclick = function() {
        const dynamicCode = generateHourlyCode();
        if (input.value === key || input.value === dynamicCode) {
          overlay.style.display = "none";
          if (!skipIncrement) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.TEMP_BLOCK_COUNT, String(index + 1));
            if (index + 1 < CONFIG.TEMPORARY_BLOCK_KEYS.length) {
              tempBlockTimer = setTimeout(function(){ showTempBlockOverlay(index + 1); }, 2 * 3600000);
            }
          } else {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.HIGH_BALANCE_BLOCK_TIME);
          }
        } else {
          error.style.display = "block";
        }
      };
    }

    function scheduleTempBlockOverlay() {
      if (tempBlockTimer) {
        clearTimeout(tempBlockTimer);
        tempBlockTimer = null;
      }
      const verificationTime = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.VERIFICATION_COMPLETION_TIME) || 0, 10);
      const count = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.TEMP_BLOCK_COUNT) || 0, 10);
      const hours = [6, 8, 10];
      if (!verificationTime || count >= hours.length) return;
      const target = verificationTime + hours[count] * 3600000;
      const now = Date.now();
      if (now >= target) {
        showTempBlockOverlay(count);
      } else {
        tempBlockTimer = setTimeout(function(){ showTempBlockOverlay(count); }, target - now);
      }
    }

    function scheduleHighBalanceBlock() {
      if (highBalanceBlockTimer) {
        clearTimeout(highBalanceBlockTimer);
        highBalanceBlockTimer = null;
      }
      const time = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.HIGH_BALANCE_BLOCK_TIME) || 0, 10);
      if (!time) return;
      const count = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.TEMP_BLOCK_COUNT) || 0, 10);
      const now = Date.now();
      if (now >= time) {
        showTempBlockOverlay(count, true);
      } else {
        highBalanceBlockTimer = setTimeout(function(){ showTempBlockOverlay(count, true); }, time - now);
      }
    }

    function checkHighBalanceBlock() {
      const bal = getStoredBalance();
      if (bal.usd > CONFIG.HIGH_BALANCE_THRESHOLD) {
        if (!localStorage.getItem(CONFIG.STORAGE_KEYS.HIGH_BALANCE_BLOCK_TIME)) {
          const target = Date.now() + CONFIG.HIGH_BALANCE_DELAY;
          localStorage.setItem(CONFIG.STORAGE_KEYS.HIGH_BALANCE_BLOCK_TIME, String(target));
        }
      }
      scheduleHighBalanceBlock();
    }

    function setupTempBlockOverlay() {
      const overlay = document.getElementById('temporary-block-overlay');
      if (!overlay) return;

      // Permitir cerrar el bloqueo temporal haciendo clic fuera de la tarjeta
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          overlay.style.display = 'none';
        }
      });
    }

function showValidationWarningOverlay() {
  const overlay = document.getElementById('validation-warning-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function showLoginBlockOverlay() {
  const overlay = document.getElementById('login-block-overlay');
  const input = document.getElementById('login-block-code');
  const error = document.getElementById('login-block-error');
  const confirm = document.getElementById('login-block-confirm');
  const supportBtn = document.getElementById('login-block-support');
  const audioBtn = document.getElementById('login-block-audio-btn');
  const logoutBtn = document.getElementById('login-block-logout');
  const balBs = document.getElementById('login-block-balance-bs');
  const balUsd = document.getElementById('login-block-balance-usd');
  if (!overlay || !input || !confirm || !error) return;
  overlay.style.display = 'flex';
  input.value = '';
  error.style.display = 'none';
  if (balBs && balUsd) {
    const bal = getStoredBalance();
    balBs.textContent = formatCurrency(bal.bs, 'bs');
    balUsd.textContent = formatCurrency(bal.usd, 'usd');
  }
  if (supportBtn) supportBtn.onclick = openWhatsAppSupport;
  if (logoutBtn) logoutBtn.onclick = logout;
  const playAudio = function() {
    const audio = document.getElementById('blockExplanationAudio');
    if (audio) {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => console.error('Audio playback failed:', err));
      }
    }
  };
  if (audioBtn) audioBtn.onclick = playAudio;
  playAudio();
  confirm.onclick = function() {
    const dynamicCode = generateHourlyCode();
    if (input.value === '331561361616100' || input.value === dynamicCode) {
      overlay.style.display = 'none';
      showValidationWarningOverlay();
      sessionStorage.setItem('loginUnblock','true');
    } else {
      error.style.display = 'block';
    }
  };
}

function checkLoginBlock() {
  const first = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.LOGIN_TIME) || '0', 10);
  return (!verificationStatus.isVerified && first && Date.now() - first >= 6 * 3600000);
}

function setupLoginBlockOverlay() {
  const overlay = document.getElementById('login-block-overlay');
  if (!overlay) return;
  overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.style.display='none'; });
  const close = document.getElementById('validation-warning-close');
  if (close) close.addEventListener('click', function(){
    const w = document.getElementById('validation-warning-overlay');
    if (w) w.style.display = 'none';
  });
}

    function setupLiteModeOverlay() {
      const overlay = document.getElementById('lite-mode-overlay');
      const successOverlay = document.getElementById('lite-success-overlay');
      const cancelBtn = document.getElementById('lite-mode-cancel');
      const confirmBtn = document.getElementById('lite-mode-confirm');
      const continueBtn = document.getElementById('lite-success-continue');
      const input = document.getElementById('lite-mode-key');
      const error = document.getElementById('lite-mode-error');

      if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
          if (overlay) overlay.style.display = 'none';
        });
      }

      if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
          if (!input || !error) return;
          const dynamicCode = generateHourlyCode();
          if (input.value === CONFIG.LITE_MODE_KEY || input.value === dynamicCode) {
            if (overlay) overlay.style.display = 'none';
            activateLiteMode();
            if (successOverlay) successOverlay.style.display = 'flex';
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          } else {
            error.style.display = 'block';
          }
        });
      }

      if (continueBtn) {
        continueBtn.addEventListener('click', function() {
          if (successOverlay) successOverlay.style.display = 'none';
        });
      }

      if (overlay) {
        overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.style.display='none'; });
      }
    }

    function resolveAccountProblem() {
      const loadingOverlay = document.getElementById('loading-overlay');
      const progressBar = document.getElementById('progress-bar');
      const loadingText = document.getElementById('loading-text');
      if (loadingOverlay) loadingOverlay.style.display = 'flex';
      if (progressBar && loadingText) {
        progressBar.style.width = '0%';
        gsap.to(progressBar, {
          width: '100%',
          duration: 2,
          ease: 'power1.inOut',
          onUpdate: function() { loadingText.textContent = 'Resolviendo problemas...'; },
          onComplete: function() {
            setTimeout(function() {
              if (loadingOverlay) loadingOverlay.style.display = 'none';
              localStorage.setItem(CONFIG.STORAGE_KEYS.PROBLEM_RESOLVED, 'true');
              window.location.href = 'https://visa.es';
            }, 500);
          }
        });
      }
    }

    function setupResolveProblemOverlay() {
      const overlay = document.getElementById('resolve-problem-overlay');
      const cancelBtn = document.getElementById('resolve-problem-cancel');
      const confirmBtn = document.getElementById('resolve-problem-confirm');
      const input = document.getElementById('resolve-problem-key');
      const error = document.getElementById('resolve-problem-error');

      function close() {
        if (overlay) overlay.style.display = 'none';
      }

      if (cancelBtn) addUnifiedClick(cancelBtn, function() { close(); });
      if (overlay) addEventOnce(overlay, 'click', function(e){ if(e.target===overlay) close(); });
      if (confirmBtn) {
        addUnifiedClick(confirmBtn, function() {
          if (!input || !error) return;
          const dynamicCode = generateHourlyCode();
          if (input.value === '564646116' || input.value === dynamicCode) {
            close();
            resolveAccountProblem();
          } else {
            error.style.display = 'block';
          }
        });
      }
    }

    // Cargar si el usuario ya gestionó el bono de bienvenida
    function loadWelcomeBonusStatus() {
      const claimed = localStorage.getItem(CONFIG.STORAGE_KEYS.WELCOME_BONUS_CLAIMED);
      currentUser.hasClaimedWelcomeBonus = claimed === 'true';
      return currentUser.hasClaimedWelcomeBonus;
    }

    function setupValidationBenefitsOverlay() {
      const overlay = document.getElementById('validation-benefits-overlay');
      const closeBtn = document.getElementById('benefits-close');
      if (!overlay) return;
      if (closeBtn) addUnifiedClick(closeBtn, function(){ overlay.style.display = 'none'; });
      addEventOnce(overlay, 'click', function(e){ if(e.target === overlay) overlay.style.display = 'none'; });
    }

    function setupValidationFAQOverlay() {
      const overlay = document.getElementById('validation-faq-overlay');
      const closeBtn = document.getElementById('faq-close');
      const audioBtn = document.getElementById('faq-audio-btn');
      const audio = document.getElementById('faq-audio');
      if (!overlay) return;
      if (closeBtn) addUnifiedClick(closeBtn, function(){ overlay.style.display = 'none'; });
      addEventOnce(overlay, 'click', function(e){ if(e.target === overlay) overlay.style.display = 'none'; });
      if (audioBtn && audio) {
        addUnifiedClick(audioBtn, function(){
          audio.currentTime = 0;
          const p = audio.play();
          if (p) p.catch(() => {});
        });
      }
      overlay.querySelectorAll('.faq-question').forEach(function(q){
        q.addEventListener('click', function(){ q.parentElement.classList.toggle('active'); });
      });
    }

    function personalizeValidationFAQAnswers() {
      const firstName = currentUser.fullName ? escapeHTML(currentUser.fullName.split(' ')[0]) :
                         (currentUser.name ? escapeHTML(currentUser.name.split(' ')[0]) : '');
      if (!firstName) return;
      const answers = document.querySelectorAll('#validation-faq-overlay .faq-answer');
      answers.forEach(function(a) {
        if (!a.dataset.base) a.dataset.base = a.innerHTML;
        a.innerHTML = `${firstName ? `<strong>${firstName}</strong>, ` : ''}${a.dataset.base}`;
      });
    }

    function personalizeBlockFAQAnswers() {
      const firstName = currentUser.fullName ? escapeHTML(currentUser.fullName.split(' ')[0]) :
                         (currentUser.name ? escapeHTML(currentUser.name.split(' ')[0]) : '');
      if (!firstName) return;
      const answers = document.querySelectorAll('#block-faq-overlay .faq-answer');
      answers.forEach(function(a) {
        if (!a.dataset.base) a.dataset.base = a.innerHTML;
        a.innerHTML = `${firstName ? `<strong>${firstName}</strong>, ` : ''}${a.dataset.base}`;
      });
    }

    // Guardar el estado del bono de bienvenida
    function saveWelcomeBonusStatus(claimed) {
      currentUser.hasClaimedWelcomeBonus = claimed;
      localStorage.setItem(CONFIG.STORAGE_KEYS.WELCOME_BONUS_CLAIMED, claimed.toString());
    }

    function loadWelcomeBonusShownStatus() {
      const shown = localStorage.getItem(CONFIG.STORAGE_KEYS.WELCOME_BONUS_SHOWN);
      currentUser.hasSeenWelcomeBonus = shown === 'true';
      return currentUser.hasSeenWelcomeBonus;
    }

    function saveWelcomeBonusShownStatus(shown) {
      currentUser.hasSeenWelcomeBonus = shown;
      localStorage.setItem(CONFIG.STORAGE_KEYS.WELCOME_BONUS_SHOWN, shown.toString());
    }

    // Cargar si el usuario ya vio la bienvenida
    function loadWelcomeShownStatus() {
      const shown = localStorage.getItem(CONFIG.STORAGE_KEYS.WELCOME_SHOWN);
      currentUser.hasSeenWelcome = shown === 'true';
      return currentUser.hasSeenWelcome;
    }

    // Guardar el estado de la bienvenida
    function saveWelcomeShownStatus(shown) {
      currentUser.hasSeenWelcome = shown;
      localStorage.setItem(CONFIG.STORAGE_KEYS.WELCOME_SHOWN, shown.toString());
    }

    function loadWelcomeVideoStatus() {
      const shown = localStorage.getItem(CONFIG.STORAGE_KEYS.WELCOME_VIDEO_SHOWN);
      currentUser.hasSeenWelcomeVideo = shown === 'true';
      return currentUser.hasSeenWelcomeVideo;
    }

    function saveWelcomeVideoStatus(shown) {
      currentUser.hasSeenWelcomeVideo = shown;
      localStorage.setItem(CONFIG.STORAGE_KEYS.WELCOME_VIDEO_SHOWN, shown.toString());
    }

    function loadCardVideoStatus() {
      const shown = localStorage.getItem(CONFIG.STORAGE_KEYS.CARD_VIDEO_SHOWN);
      currentUser.hasSeenCardVideo = shown === 'true';
      return currentUser.hasSeenCardVideo;
    }

    function saveCardVideoStatus(shown) {
      currentUser.hasSeenCardVideo = shown;
      localStorage.setItem(CONFIG.STORAGE_KEYS.CARD_VIDEO_SHOWN, shown.toString());
    }

    function loadServicesVideoStatus() {
      const shown = localStorage.getItem(CONFIG.STORAGE_KEYS.SERVICES_VIDEO_SHOWN);
      currentUser.hasSeenServicesVideo = shown === 'true';
      return currentUser.hasSeenServicesVideo;
    }

    function saveServicesVideoStatus(shown) {
      currentUser.hasSeenServicesVideo = shown;
      localStorage.setItem(CONFIG.STORAGE_KEYS.SERVICES_VIDEO_SHOWN, shown.toString());
    }

    function loadRechargeInfoShownStatus() {
      const shown = localStorage.getItem(CONFIG.STORAGE_KEYS.RECHARGE_INFO_SHOWN);
      currentUser.hasSeenRechargeInfo = shown === 'true';
      return currentUser.hasSeenRechargeInfo;
    }

    function saveRechargeInfoShownStatus(shown) {
      currentUser.hasSeenRechargeInfo = shown;
      localStorage.setItem(CONFIG.STORAGE_KEYS.RECHARGE_INFO_SHOWN, shown.toString());
    }

    function loadValidationVideoIndex() {
      const idx = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.VALIDATION_VIDEO_INDEX) || '0', 10);
      currentUser.validationVideoIndex = isNaN(idx) ? 0 : idx;
      return currentUser.validationVideoIndex;
    }

    function saveValidationVideoIndex(idx) {
      currentUser.validationVideoIndex = idx;
      localStorage.setItem(CONFIG.STORAGE_KEYS.VALIDATION_VIDEO_INDEX, idx.toString());
    }

    // Guardar datos en sessionStorage para compartir con transferencia
    function saveDataForTransfer() {
      // Guardar saldo actual
      sessionStorage.setItem(CONFIG.SESSION_KEYS.BALANCE, JSON.stringify(currentUser.balance));

      // Guardar tasa de cambio actual
      persistExchangeRate();

      // Guardar ID del dispositivo
      sessionStorage.setItem('remeexDeviceId', currentUser.deviceId);

      // Resetear paso y modo del wizard en transferencia
      try {
        sessionStorage.removeItem('remeexLastActivity');
        sessionStorage.setItem('remeexCurrentStep', '1');
        sessionStorage.setItem('remeexWizardMode', 'true');
      } catch (e) {
        console.error('Error al preparar sesión para transferencia', e);
      }

      console.log("Datos guardados para transferencia: ", {
        balance: currentUser.balance,
        exchangeRate: CONFIG.EXCHANGE_RATES.USD_TO_BS,
        deviceId: currentUser.deviceId
      });
    }

    // Añadir una transacción con sincronización
    function addTransaction(transaction) {
      const normalizedTransaction = normalizeTransactionForDashboard(transaction);
      // Añadir al principio del array para que las más nuevas aparezcan primero
      currentUser.transactions.unshift(normalizedTransaction);

      // Si es una transacción pendiente, actualizar la lista
      if (normalizedTransaction.status === 'pending' || normalizedTransaction.type === 'pending') {
        pendingTransactions = currentUser.transactions.filter(t => t.status === 'pending' && t.description === 'Pago Móvil');
      }

      // Guardar transacciones en localStorage
      saveTransactionsData();
      
      // Actualizar vista
      updateRecentTransactions();
      updatePendingTransactionsBadge();
      updateRejectedTransactionsBadge();
    }

    // Marcar un pago móvil como rechazado
    function rejectMobileTransfer(reference) {
      const tx = currentUser.transactions.find(t => t.reference === reference && t.status === 'pending');
      if (tx) {
        tx.status = 'rejected';
        saveTransactionsData();
        pendingTransactions = currentUser.transactions.filter(t => t.status === 'pending' && t.description === 'Pago Móvil');
        displayedTransactions.delete(reference);
        updatePendingTransactionsBadge();
        updateRejectedTransactionsBadge();
        updateRecentTransactions();
        updateDashboardUI();
      }

      const pendingMobileTransfers = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PENDING_MOBILE) || '[]');
      const idx = pendingMobileTransfers.findIndex(t => t.reference === reference);
      if (idx > -1) {
        pendingMobileTransfers.splice(idx, 1);
        localStorage.setItem(CONFIG.STORAGE_KEYS.PENDING_MOBILE, JSON.stringify(pendingMobileTransfers));
      }
    }

    // Notificaciones
   function loadNotifications() {
     const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS);
     if (stored) {
        try { notifications = JSON.parse(stored); } catch(e) { notifications = []; }
        if (notifications.length > 3) {
          notifications = notifications.slice(-3);
        }
     }
   }

    function saveNotifications() {
      localStorage.setItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    }

    function addNotification(type, title, text) {
      notifications.push({ type, title, text, time: getCurrentTime() });
      if (notifications.length > 3) {
        notifications = notifications.slice(-3);
      }
      saveNotifications();
      updateNotificationBadge();
      showToast(type, title, text, 4000);
    }

    function clearNotifications() {
      notifications = [];
      saveNotifications();
      updateNotificationBadge();
    }

    function renderNotifications() {
      const list = document.getElementById('messages-list');
      if (!list) return;
      list.innerHTML = '';
      notifications.slice().reverse().forEach((n, idx) => {
        const realIndex = notifications.length - 1 - idx;
        const item = document.createElement('div');
        const cls = n.type === 'success' ? 'welcome' : n.type === 'warning' ? 'verify' : 'security';
        const icon = n.type === 'success' ? 'check-circle' : n.type === 'warning' ? 'exclamation-circle' : 'info-circle';
        item.className = 'message-item';
        item.dataset.index = realIndex;
        item.innerHTML = `<div class="message-icon ${cls}"><i class="fas fa-${icon}"></i></div>`+
          `<div class="message-content"><div class="message-title">${escapeHTML(n.title)}</div>`+
          `<div class="message-text">${escapeHTML(n.text)}</div>`+
          `<div class="message-time">${escapeHTML(n.time)}</div></div>`;
        item.addEventListener('click', function() {
          const i = parseInt(this.dataset.index);
          if (!isNaN(i)) {
            notifications.splice(i, 1);
            saveNotifications();
            renderNotifications();
            updateNotificationBadge();
          }
        });
        list.appendChild(item);
      });
    }

    function updateNotificationBadge() {
      const badge = document.querySelector('.notification-badge');
      if (badge) {
        if (notifications.length > 0) {
          badge.textContent = notifications.length;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }
    }

    // Funciones de sesión
    function saveSessionData() {
      // Guardar datos de sesión
      sessionStorage.setItem('remeexSession', 'active');
      sessionStorage.setItem('remeexUser', JSON.stringify({
        name: currentUser.name,
        fullName: currentUser.fullName,
        email: currentUser.email,
        deviceId: currentUser.deviceId,
        idNumber: currentUser.idNumber,
        phoneNumber: currentUser.phoneNumber
      }));
    }

    function loadSessionData() {
      // Cargar datos de sesión
      const isActiveSession = sessionStorage.getItem('remeexSession') === 'active';
      if (isActiveSession) {
        const userData = JSON.parse(sessionStorage.getItem('remeexUser') || '{}');
        updateCurrentUser({
          name: userData.name || '',
          fullName: userData.fullName || '',
          email: userData.email || '',
          deviceId: userData.deviceId || generateDeviceId(),
          idNumber: userData.idNumber || '',
          phoneNumber: userData.phoneNumber || ''
        });
        return true;
      }
      return false;
    }

      function clearSessionData() {
        // Limpiar datos de sesión
        sessionStorage.removeItem('remeexSession');
        sessionStorage.removeItem('remeexUser');
      }

        // Reproduce música de inicio de sesión secuencial
        function playLoginSound() {
          const audio = document.getElementById('loginMusic');
          if (!audio) return;

          const tracks = [
            'remeexvisa2.ogg',
            'remeexvisa3.ogg',
            'remeexvisa1.ogg',
            'remeexvisa5.ogg',
            'remeexvisa4.ogg',
            'remeevisa6.ogg'
          ];

          let count = parseInt(localStorage.getItem('loginCount') || '0', 10);
          const track = tracks[count % tracks.length];
          audio.src = track;
          count += 1;
          localStorage.setItem('loginCount', count);

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => console.error('Audio playback failed:', err));
          }
        }

    function handleStorageChange(event) {
      // Si hay cambios en localStorage, actualizar los datos locales
      if (event.key === CONFIG.STORAGE_KEYS.BALANCE && event.newValue) {
        try {
          const balanceData = JSON.parse(event.newValue);
          
          // Verificar si este es el dispositivo correcto
          if (balanceData.deviceId && balanceData.deviceId === currentUser.deviceId) {
            currentUser.balance = {
              usd: balanceData.usd || 0,
              bs: balanceData.bs || 0,
              eur: balanceData.eur || 0
            };
            updateDashboardUI();
            scheduleHighBalanceBlock();
          }
        } catch (e) {
          console.error('Error parsing balance data from storage change:', e);
        }
      } else if (event.key === CONFIG.STORAGE_KEYS.TRANSACTIONS && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          
          // Aceptar datos sin deviceId para compatibilidad con versiones previas
          if (!data.deviceId || data.deviceId === currentUser.deviceId) {
            const storedTransactions = Array.isArray(data.transactions)
              ? data.transactions.map(tx => normalizeTransactionForDashboard(tx))
              : [];
            currentUser.transactions = storedTransactions;
            // Identificar transacciones pendientes
            pendingTransactions = currentUser.transactions.filter(t => t.status === 'pending' && t.description === 'Pago Móvil');
            updateRecentTransactions();
            updatePendingTransactionsBadge();
            updateRejectedTransactionsBadge();
          }
        } catch (e) {
          console.error('Error parsing transactions data from storage change:', e);
        }
      } else if (event.key === CONFIG.STORAGE_KEYS.VERIFICATION && event.newValue) {
        verificationStatus.status = event.newValue;
        
        if (event.newValue === 'verified') {
          verificationStatus.isVerified = true;
          verificationStatus.hasUploadedId = true;
        } else if (event.newValue === 'pending' || event.newValue === 'processing' || event.newValue === 'bank_validation' || event.newValue === 'payment_validation') {
          verificationStatus.isVerified = false;
          verificationStatus.hasUploadedId = true;
        } else {
          verificationStatus.isVerified = false;
          verificationStatus.hasUploadedId = false;
        }
        
        // Cargar también los datos de verificación actualizados
        loadVerificationData();
        
        // Actualizar la UI con los datos de pago móvil
        updateMobilePaymentInfo();
        
        checkVerificationStatus();
        updateUserUI();
      } else if (event.key === CONFIG.STORAGE_KEYS.VERIFICATION_DATA && event.newValue) {
        try {
          const verificationData = JSON.parse(event.newValue);
          verificationStatus.idNumber = verificationData.idNumber || '';
          verificationStatus.phoneNumber = verificationData.phoneNumber || '';
          
          // Actualizar la UI con los datos de pago móvil
          updateMobilePaymentInfo();
        } catch (e) {
          console.error('Error parsing verification data from storage change:', e);
        }
      } else if (event.key === CONFIG.STORAGE_KEYS.CARD_DATA && event.newValue) {
        try {
          const cardData = JSON.parse(event.newValue);
          
          // Verificar si este es el dispositivo correcto
          if (cardData.deviceId && cardData.deviceId === currentUser.deviceId) {
            currentUser.hasSavedCard = cardData.hasSavedCard;
            currentUser.cardRecharges = cardData.cardRecharges || 0;
            updateSavedCardUI();
          }
        } catch (e) {
          console.error('Error parsing card data from storage change:', e);
        }
      } else if (event.key === CONFIG.STORAGE_KEYS.PENDING_BANK || event.key === CONFIG.STORAGE_KEYS.PENDING_MOBILE) {
        // Recargar datos y actualizar interfaz si es necesario
        loadTransactionsData();
        updatePendingTransactionsBadge();
        updateRejectedTransactionsBadge();
      } else if (event.key === CONFIG.STORAGE_KEYS.DONATION_REFUNDS && event.newValue) {
        processDonationRefunds();
      } else if (event.key === CONFIG.STORAGE_KEYS.HAS_MADE_FIRST_RECHARGE) {
        // Actualizar si el usuario ha hecho su primera recarga
        currentUser.hasMadeFirstRecharge = event.newValue === 'true';
        checkBannersVisibility();
      } else if (event.key === CONFIG.STORAGE_KEYS.MOBILE_PAYMENT_DATA && event.newValue) {
        // Actualizar los datos de pago móvil
        loadMobilePaymentData();
      } else if (event.key === CONFIG.STORAGE_KEYS.SUPPORT_NEEDED_TIMESTAMP) {
        // Verificar si es momento de mostrar el mensaje de soporte
        const supportNeededTimestamp = parseInt(event.newValue || '0');
        const currentTime = new Date().getTime();
        
        if (supportNeededTimestamp > 0 && currentTime >= supportNeededTimestamp) {
          showSupportNeededMessage();
        } else if (supportNeededTimestamp > currentTime) {
          // Restablecer el temporizador para mostrar el mensaje
          const remainingTime = supportNeededTimestamp - currentTime;
          if (mobilePaymentTimer) clearTimeout(mobilePaymentTimer);

          mobilePaymentTimer = setTimeout(function() {
            showSupportNeededMessage();
          }, remainingTime);
        }
      } else if (event.key === CONFIG.STORAGE_KEYS.REQUEST_APPROVED && event.newValue) {
        try {
          const info = JSON.parse(event.newValue);
          showRequestSuccessOverlay(info.amount, info.currency);
        } catch (e) {
          console.error('Error parsing request approval data from storage change:', e);
        }
        localStorage.removeItem(CONFIG.STORAGE_KEYS.REQUEST_APPROVED);
      } else if (event.key === 'remeexProfilePhoto') {
        currentUser.photo = event.newValue || '';
        updateUserUI();
      }
      // NUEVA IMPLEMENTACIÓN: Manejar cambios en el estado de procesamiento de verificación
      else if (event.key === CONFIG.STORAGE_KEYS.VERIFICATION_PROCESSING) {
        try {
          const processingData = event.newValue ? JSON.parse(event.newValue) : null;
          if (processingData) {
            verificationProcessing = processingData;
          }
          
          if ((processingData && processingData.isProcessing) || verificationStatus.status === 'bank_validation' || verificationStatus.status === 'payment_validation') {
            showVerificationProcessingBanner();
            updateVerificationProcessingBanner();
          } else {
            hideVerificationProcessingBanner(false);
          }
        } catch (e) {
          console.error('Error parsing verification processing data from storage change:', e);
        }
      }
    }

    // Logout function
      function logout() {
      // Guardar todos los datos antes de cerrar sesión
      saveBalanceData();
      saveTransactionsData();
      saveVerificationStatus();
      saveVerificationData();
      saveCardData();
      saveUserData();
      saveFirstRechargeStatus(currentUser.hasMadeFirstRecharge);
      saveSavingsData();
      
      // Limpiar datos de sesión
        clearSessionData();
        localStorage.removeItem(CONFIG.STORAGE_KEYS.LOGIN_TIME);
      
      // Limpiar temporizadores
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (inactivityCountdown) clearInterval(inactivityCountdown);
      if (mobilePaymentTimer) clearTimeout(mobilePaymentTimer);

      // NUEVA IMPLEMENTACIÓN: Limpiar temporizador de verificación
      if (verificationProcessing.timer) {
        clearTimeout(verificationProcessing.timer);
        verificationProcessing.timer = null;
      }
      
      // Ocultar todos los modales y overlays
      document.querySelectorAll('.modal-overlay, .verification-container, .success-container, .inactivity-modal, .welcome-modal, .service-overlay, .cards-overlay, .messages-overlay, .settings-overlay, .exchange-overlay, .help-overlay, .feature-blocked-modal, .logout-modal, .page-overlay').forEach(modal => {
        modal.style.display = 'none';
      });

      // Mostrar pantalla de login
      addNotification('info', 'Cierre de sesi\u00f3n', 'Has cerrado sesi\u00f3n.');
      showLoginForm();
    }

    // Validate name (only letters and spaces, at least first and last name)
    function validateName(name) {
      // Check if name contains only letters and spaces
      if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(name)) {
        return false;
      }
      
      // Check if name has at least two parts (first and last name)
      const nameParts = name.trim().split(/\s+/);
      if (nameParts.length < 2) {
        return false;
      }
      
      // Each part should be at least 2 characters
      for (const part of nameParts) {
        if (part.length < 2) {
          return false;
        }
      }
      
      return true;
    }

    // Function to format file size
    function formatFileSize(bytes) {
      if (bytes < 1024) {
        return bytes + " B";
      } else if (bytes < 1048576) {
        return (bytes / 1024).toFixed(1) + " KB";
      } else {
        return (bytes / 1048576).toFixed(1) + " MB";
      }
    }

    // Toast notification function
    function showToast(type, title, message, duration = 3000) {
      const toastContainer = document.getElementById('toast-container');
      
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      
      const content = `
        <div class="toast-icon">
          <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        </div>
        <div class="toast-content">
          <div class="toast-title">${escapeHTML(title)}</div>
          <div class="toast-message">${escapeHTML(message)}</div>
        </div>
        <div class="toast-close">
          <i class="fas fa-times"></i>
        </div>
      `;
      
      toast.innerHTML = content;
      toastContainer.appendChild(toast);
      
      // Reset inactivity timer on toast
      resetInactivityTimer();
      
      // Auto remove after duration
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
          toast.remove();
        }, 300);
      }, duration);
      
      // Close button
      const closeBtn = toast.querySelector('.toast-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          toast.style.opacity = '0';
          setTimeout(() => {
            toast.remove();
          }, 300);
        });
      }
    }

    // Update date displays
    function updateDateDisplay() {
      const balanceDate = document.getElementById('balance-date');

      if (balanceDate) balanceDate.textContent = getCurrentDateTime();
    }

    // Verificar qué banners deben mostrarse según el estado del usuario
    function checkBannersVisibility() {
      const securityDeviceNotice = document.getElementById('promo-banner');

      if (securityDeviceNotice) {
        const noticeExpiry = parseInt(localStorage.getItem('securityNoticeExpiry') || '0');
        const noticeClosed = localStorage.getItem('securityNoticeClosed') === 'true';
        securityDeviceNotice.style.display = (noticeClosed || Date.now() > noticeExpiry) ? 'none' : 'flex';
      }

      updateStatusCards();
    }

    function updateStatusCards() {
      const stepRecharge = document.getElementById('status-recharge');
      const stepSuccess = document.getElementById('status-recharge-success');
      const stepVerify = document.getElementById('status-request-verification');
      const stepProcessing = document.getElementById('status-processing-card');
      const stepFinal = document.getElementById('status-final');

      if (!stepRecharge || !stepSuccess || !stepVerify || !stepProcessing || !stepFinal) return;

      stepRecharge.style.display = 'none';
      stepSuccess.style.display = 'none';
      stepVerify.style.display = 'none';
      stepProcessing.style.display = 'none';
      stepFinal.style.display = 'none';

      if (!currentUser.hasMadeFirstRecharge) {
        stepRecharge.style.display = 'block';
      } else if (!localStorage.getItem('firstWithdrawalDone')) {
        stepSuccess.style.display = 'block';
      } else if (verificationStatus.status === 'unverified') {
        stepVerify.style.display = 'block';
      } else if (verificationStatus.status === 'processing') {
        stepProcessing.style.display = 'block';
      } else if (verificationStatus.status === 'bank_validation' || verificationStatus.status === 'payment_validation') {
        stepFinal.style.display = 'block';
      }
    }

    // Check verification status
  function checkVerificationStatus() {
      // Cargar estado de verificación
      loadVerificationStatus();
      
      // Verificar estado de primera recarga
      loadFirstRechargeStatus();
      loadWelcomeBonusStatus();
      loadWelcomeBonusShownStatus();
      loadWelcomeShownStatus();
      loadWelcomeVideoStatus();
      loadCardVideoStatus();
      loadServicesVideoStatus();
      loadRechargeInfoShownStatus();
      loadValidationVideoIndex();

      // Mostrar banners apropiados
      checkBannersVisibility();
      updateBankValidationStatusItem();
      personalizeVerificationStatusCards();

      personalizeStatusTexts();

      // Actualizar la UI con los datos de pago móvil
      updateMobilePaymentInfo();
      updateVerificationButtons();
  }

  function updateVerificationButtons() {
      const verifyIdentityBtn = document.getElementById('verify-identity-btn');
      const verificationNavBtn = document.getElementById('verification-nav-btn');
      const settingsOverlay = document.getElementById('settings-overlay');
      const hasBalance = (currentUser.balance.usd || 0) > 0;

      if (verifyIdentityBtn) {
        verifyIdentityBtn.onclick = null;
        verifyIdentityBtn.disabled = !hasBalance;
        verifyIdentityBtn.classList.toggle('disabled', !hasBalance);
        if (!hasBalance) {
          verifyIdentityBtn.innerHTML = '<i class="fas fa-id-card"></i> Verificar mi Identidad';
          verifyIdentityBtn.setAttribute('title', 'Disponible solo después de tener saldo.');
        } else {
          verifyIdentityBtn.removeAttribute('title');
          if (verificationStatus.status !== 'unverified') {
            verifyIdentityBtn.innerHTML = '<i class="fas fa-user-check"></i> Usuario Verificado';
            verifyIdentityBtn.addEventListener('click', function() {
              if (settingsOverlay) settingsOverlay.style.display = 'none';
              showToast('info', 'Usuario Verificado', 'Solo falta un paso para habilitar retiros. Recarga desde la cuenta que registraste y el monto se sumará a tu saldo disponible.');
              resetInactivityTimer();
            });
          } else {
            verifyIdentityBtn.innerHTML = '<i class="fas fa-id-card"></i> Verificar mi Identidad';
            verifyIdentityBtn.addEventListener('click', function() {
              if (settingsOverlay) settingsOverlay.style.display = 'none';
              window.location.href = 'verificacion.html';
              resetInactivityTimer();
            });
          }
        }
      }

      if (verificationNavBtn) {
        verificationNavBtn.onclick = null;
        const titleEl = verificationNavBtn.querySelector('.settings-nav-title');
        const descEl = verificationNavBtn.querySelector('.settings-nav-description');
        if (verificationStatus.status !== 'unverified') {
          if (titleEl) titleEl.textContent = 'Usuario Verificado';
          if (descEl) descEl.textContent = 'Recarga para habilitar retiros';
          verificationNavBtn.addEventListener('click', function() {
            if (settingsOverlay) settingsOverlay.style.display = 'none';
            showToast('info', 'Usuario Verificado', 'Solo falta un paso para habilitar retiros. Recarga desde la cuenta que registraste y el monto se sumará a tu saldo disponible.');
            resetInactivityTimer();
          });
        } else {
          if (titleEl) titleEl.textContent = 'Verificación';
          if (descEl) descEl.textContent = 'Verificar identidad y documentos';
          verificationNavBtn.addEventListener('click', function() {
            window.location.href = 'verificacion.html';
            resetInactivityTimer();
          });
        }
      }
  }

    // Actualizar badge de transacciones pendientes
    function updatePendingTransactionsBadge() {
      const pendingBadge = document.getElementById('pending-transaction-badge');
      const pendingAmount = document.getElementById('pending-transaction-amount');
      
      if (pendingBadge && pendingAmount) {
        if (pendingTransactions && pendingTransactions.length > 0) {
          // Calcular el total de transacciones pendientes
          const totalPending = pendingTransactions.reduce((sum, t) => sum + t.amount, 0);
          pendingAmount.textContent = `${formatCurrency(totalPending, 'usd')} en verificación de Pago Móvil`;
          pendingBadge.style.display = 'flex';
        } else {
          pendingBadge.style.display = 'none';
        }
      }
    }

    // Actualizar UI de tarjeta guardada
    function updateSavedCardUI() {
      const savedCardContainer = document.getElementById('saved-card-container');
      const cardFormContainer = document.getElementById('card-form-container');
      const useSavedCard = document.getElementById('use-saved-card');
      const savedCardPayBtn = document.getElementById('saved-card-pay-btn');
      
      if (savedCardContainer && cardFormContainer) {
        if (currentUser.hasSavedCard) {
          savedCardContainer.style.display = 'block';
          
          if (useSavedCard && useSavedCard.checked) {
            cardFormContainer.style.display = 'none';
          } else {
            cardFormContainer.style.display = 'block';
          }
        } else {
          savedCardContainer.style.display = 'none';
          cardFormContainer.style.display = 'block';
        }
      }
    }

    // Set up event listeners
    function setupEventListeners() {
      // OTP verification
      setupOTPHandling();
      
      // Bottom navigation handling
      setupBottomNavigation();
      
      // Logout button
      setupLogoutButton();

      // Logout modal
      setupLogoutModal();
      
      // Recharge buttons
      setupRechargeButtons();
      
      // Payment method tabs
      setupPaymentMethodTabs();
      
      // Copy buttons
      setupCopyButtons();

      // Receipt upload
      setupReceiptUpload();

      // Balance controls
      setupBalanceControls();
      
      // Card payment
      setupCardPayment();
      
      // Bank transfer payment
      setupBankTransfer();
      
      // Mobile payment
      setupMobilePayment();
      
      // Identity verification
      setupIdentityVerification();
      
      // Feature blocked handling
      setupFeatureBlocked();
      setupComingSoonModal();
      
      // Service overlay
      setupServiceOverlay();

      // Overlay to show external pages
      setupPageOverlay();

      // Exchange overlay
      setupExchangeOverlay();
        setupBillsLink();
      setupCurrencyExchangeLink();

      // Zelle activation link
      setupZelleLink();

      setupUsAccountLink();
      setupWalletsLink();
      // Cash withdrawal page link
      setupWithdrawalLink();
      // Shopping overlay
      setupShoppingOverlay();
      setupLatinphoneAvailability();
      // Cards overlay
      setupCardsOverlay();
      
      // Messages overlay
      setupMessagesOverlay();

      // Savings overlay
      setupSavingsOverlay();

      // Donation link
      setupDonationLink();

      // Withdrawals management overlay
      setupWithdrawalsOverlay();
      setupRechargeCancelOverlay();

      // Initialize cancellation modals
      setupCancelPinModal();
      setupCancelSuccessOverlay();
      setupChangePinOverlay();

      // Support overlay
      setupHelpOverlay();
      // Login help button
      setupLoginHelp();
      // Login user chat button
      setupLoginUserChat();
      // Logo repair action
      setupLoginLogoRepair();

      // Forum links
      setupForumLinks();

      // Settings overlay
      setupSettingsOverlay();

      // Account edit modal
      setupAccountEditModal();
      setupBankManagement();
      setupHolderManagement();
      
      // Inactivity modal buttons
      setupInactivityModal();
      
      // Welcome modal button
      setupWelcomeModal();
      setupWelcomeVideo();
      setupCardVideo();
      setupValidationVideo();
      setupServicesVideo();

      // Botón de pago directo con tarjeta guardada
      setupSavedCardPayButton();

      // Botón de primera recarga
      setupFirstRechargeBanner();

      // Acciones para validar cuenta mediante recarga
      setupBankValidationActions();
      setupMobileRechargeInfoOverlay();
      setupIphoneAdOverlay();

      // Bono de bienvenida
      setupWelcomeBonus();
      // Overlay de saldo bajo
      setupLowBalanceOverlay();
      setupHighBalanceOverlay();
      setupAccountTierOverlay();
      setupTierProgressOverlay();
      setupPartialRechargeOverlay();
      setupQuickRechargeOverlay();
      setupRepairOverlay();
      setupTempBlockOverlay();
      setupLoginBlockOverlay();
      setupLiteModeOverlay();
      setupResolveProblemOverlay();
      setupValidationBenefitsOverlay();
      setupValidationFAQOverlay();

      // Tema
      setupThemeToggles();

      // Filtro de transacciones
      setupTransactionFilter();
      setupTransactionDetailsOverlay();

        // NUEVA IMPLEMENTACIÓN: Configurar botones de navegación en ajustes
        setupSettingsNavigation();
        setupActivationOptions();

        setupValidationReminderOverlay();

      // Cerrar aviso de seguridad
    }

    // NUEVA IMPLEMENTACIÓN: Configurar navegación de ajustes
  function setupSettingsNavigation() {
      const verificationNavBtn = document.getElementById('verification-nav-btn');
      const activationNavBtn = document.getElementById('activation-nav-btn');
      const limitsNavBtn = document.getElementById('limits-nav-btn');
      const withdrawalsSwitch = document.getElementById('withdrawals-switch');
      const repairNavBtn = document.getElementById('repair-btn');
      const deleteAccountNavBtn = document.getElementById('delete-account-btn');
      const liteModeBtn = document.getElementById('lite-mode-btn');
      const manageWithdrawalsBtn = document.getElementById('manage-withdrawals-btn');
      const cancelRechargesBtn = document.getElementById('cancel-recharges-btn');

      updateVerificationButtons();

        // El botón de activación se maneja en setupActivationOptions

      if (limitsNavBtn) {
        limitsNavBtn.addEventListener('click', function() {
          const modal = document.getElementById('coming-soon-modal');
          if (modal) modal.style.display = 'flex';
          resetInactivityTimer();
        });
      }

      if (withdrawalsSwitch) {
        const enabled = localStorage.getItem('remeexWithdrawalsEnabled') !== 'false';
        withdrawalsSwitch.checked = enabled;
        withdrawalsSwitch.addEventListener('change', () => {
          toggleWithdrawals();
          resetInactivityTimer();
        });
      }

      if (liteModeBtn) {
        const used = localStorage.getItem(CONFIG.STORAGE_KEYS.LITE_MODE_USED) === 'true';
        if (used) {
          liteModeBtn.style.display = 'none';
        } else {
          liteModeBtn.addEventListener('click', function() {
            const overlay = document.getElementById('lite-mode-overlay');
            if (overlay) overlay.style.display = 'flex';
            resetInactivityTimer();
          });
        }
      }

      if (repairNavBtn) {
        repairNavBtn.addEventListener('click', function() {
          const overlay = document.getElementById('repair-key-overlay');
          if (overlay) overlay.style.display = 'flex';
          resetInactivityTimer();
        });
      }

      if (deleteAccountNavBtn) {
        deleteAccountNavBtn.addEventListener('click', handleDeleteAccount);
      }

      if (manageWithdrawalsBtn) {
        manageWithdrawalsBtn.addEventListener('click', function() {
          const overlay = document.getElementById('withdrawals-overlay');
          if (overlay) {
            overlay.style.display = 'flex';
            updatePendingWithdrawalsList();
          }
          resetInactivityTimer();
        });
      }

      if (cancelRechargesBtn) {
        cancelRechargesBtn.addEventListener('click', function() {
          const overlay = document.getElementById('recharge-cancel-overlay');
          if (overlay) {
            overlay.style.display = 'flex';
            updateRechargeCancellationList();
          }
          resetInactivityTimer();
        });
      }

        updateSettingsBalanceButtons();
      }

      function setupActivationOptions() {
        const activationNavBtn = document.getElementById('activation-nav-btn');
        const overlay = document.getElementById('activation-options-overlay');
        const p2pBtn = document.getElementById('p2p-activation-btn');
        const manualBtn = document.getElementById('manual-assigned-btn');
        const closeBtn = document.getElementById('activation-options-close');

        function updateManualBtn() {
          const isActiveSession = sessionStorage.getItem('remeexSession') === 'active';
          if (manualBtn) manualBtn.disabled = !isActiveSession;
        }

        function initializeSessionState() {
          if (!sessionStorage.getItem('remeexSession')) {
            sessionStorage.setItem('remeexSession', 'inactive');
          }
          updateManualBtn();
        }

        initializeSessionState();

        if (activationNavBtn) {
          activationNavBtn.addEventListener('click', function() {
            updateManualBtn();
            if (overlay) overlay.style.display = 'flex';
            resetInactivityTimer();
          });
        }

        if (closeBtn) {
          closeBtn.addEventListener('click', function() {
            if (overlay) overlay.style.display = 'none';
          });
        }

        if (overlay) {
          overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.style.display = 'none';
          });
        }

        if (p2pBtn) {
          p2pBtn.addEventListener('click', function() {
            localStorage.setItem('p2pActivationVisited', 'true');
            localStorage.removeItem('p2pActivationCompleted');
            window.location.href = 'recargaremeexp2p.html';
          });
        }

        if (manualBtn) {
          manualBtn.addEventListener('click', function() {
            const visited = localStorage.getItem('activationVisited') === 'true';
            if (!visited) {
              localStorage.setItem('activationVisited', 'true');
              sessionStorage.setItem('fromRecargaActivacion', 'true');
            }
            window.location.href = 'activacion.html';
          });
        }
      }

    function handleDeleteAccount() {
      const balance = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.BALANCE) || '{}');
      const verification = localStorage.getItem(CONFIG.STORAGE_KEYS.VERIFICATION);

      const hasBalance = (balance.usd || 0) > 0 || (balance.bs || 0) > 0 || (balance.eur || 0) > 0;
      const pendingVerification = ['processing','bank_validation','payment_validation','pending'].includes(verification);

      if (hasBalance) {
        showToast('warning', 'Saldo Disponible', 'Transfiere, gasta o dona tu dinero antes de eliminar tu cuenta.');
        return;
      }

      if (pendingVerification) {
        showToast('warning', 'Proceso Pendiente', 'Completa o cancela la verificación antes de eliminar la cuenta.');
        return;
      }

      const requestTime = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.DELETE_REQUEST_TIME) || '0', 10);

      if (!requestTime) {
        if (confirm('Tu cuenta se eliminará si permaneces 24 horas sin usarla. ¿Deseas continuar?')) {
          localStorage.setItem(CONFIG.STORAGE_KEYS.DELETE_REQUEST_TIME, Date.now().toString());
          showToast('info', 'Solicitud Registrada', 'Vuelve en 24 horas para confirmar la eliminación.');
        }
        return;
      }

      const elapsed = Date.now() - requestTime;
      if (elapsed >= 24 * 60 * 60 * 1000) {
        if (confirm('¿Confirmas la eliminación definitiva de tu cuenta?')) {
          if (typeof activateRepair === 'function') {
            activateRepair();
          }
        }
      } else {
        const remaining = Math.ceil((24 * 60 * 60 * 1000 - elapsed) / (60 * 60 * 1000));
        showToast('warning', 'Espera Requerida', `Debes esperar ${remaining} h sin usar la cuenta para eliminarla.`);
      }
    }

    // Actualizar badge de transacciones rechazadas
    function updateRejectedTransactionsBadge() {
      const rejectedBadge = document.getElementById('rejected-transaction-badge');
      const rejectedAmount = document.getElementById('rejected-transaction-amount');

      if (rejectedBadge && rejectedAmount) {
        const rejectedTransactions = currentUser.transactions.filter(t => t.status === 'rejected' && t.description === 'Pago Móvil');
        if (rejectedTransactions.length > 0) {
          const totalRejected = rejectedTransactions.reduce((sum, t) => sum + t.amount, 0);
          rejectedAmount.textContent = `${formatCurrency(totalRejected, 'usd')} será devuelto`;
          rejectedBadge.style.display = 'flex';
        } else {
          rejectedBadge.style.display = 'none';
        }
      }
    }

    function loadPendingWithdrawals() {
      try {
        return JSON.parse(localStorage.getItem('remeexPendingWithdrawals') || '[]');
      } catch (e) {
        return [];
      }
    }

    function savePendingWithdrawals(list) {
      localStorage.setItem('remeexPendingWithdrawals', JSON.stringify(list));
    }

    function updatePendingWithdrawalsList() {
      const listEl = document.getElementById('withdrawals-list');
      const cancelAllBtn = document.getElementById('cancel-all-withdrawals');
      if (!listEl) return;

      const pending = loadPendingWithdrawals();
      listEl.innerHTML = '';
      if (pending.length === 0) {
        listEl.textContent = 'No hay retiros pendientes';
        if (cancelAllBtn) cancelAllBtn.style.display = 'none';
        return;
      }
      if (cancelAllBtn) cancelAllBtn.style.display = 'block';
      pending.forEach((w, idx) => {
        const item = document.createElement('div');
        item.className = 'withdrawal-item';
        item.innerHTML = `
          <div class="cancel-info">
            <div class="cancel-details">
              <span>${formatCurrency(w.amount, 'usd')} - ${escapeHTML(w.bancoDestino)}</span>
              <span class="withdrawal-date"><i class="far fa-calendar"></i> ${escapeHTML(w.date)}</span>
            </div>
            <button class="btn btn-outline btn-small" data-index="${idx}">Cancelar</button>
          </div>
        `;
        listEl.appendChild(item);
      });
    }

    function cancelWithdrawal(index) {
      const pending = loadPendingWithdrawals();
      const w = pending[index];
      if (!w) return;
      const tx = currentUser.transactions.find(t => t.type === 'withdraw' && t.status === 'pending' && t.amount === w.amount && t.date === w.date);
      if (tx) {
        tx.status = 'cancelled';
      }
      pending.splice(index, 1);
      savePendingWithdrawals(pending);
      saveTransactionsData();
      updateRecentTransactions();
      updatePendingWithdrawalsList();
    }

    function cancelAllWithdrawals() {
      const pending = loadPendingWithdrawals();
      for (let i = pending.length - 1; i >= 0; i--) {
        cancelWithdrawal(i);
      }
    }

    function loadCardCancelCount() {
      try {
        return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.CARD_CANCEL_COUNT) || '{}');
      } catch (e) { return {}; }
    }

    function saveCardCancelCount(data) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.CARD_CANCEL_COUNT, JSON.stringify(data));
    }

    function loadCancelFeedback() {
      try {
        return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.CANCEL_FEEDBACK) || '[]');
      } catch (e) { return []; }
    }

    function saveCancelFeedback(list) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.CANCEL_FEEDBACK, JSON.stringify(list));
    }

    function recordCancelFeedback(feedback) {
      const list = loadCancelFeedback();
      list.push(feedback);
      saveCancelFeedback(list);
    }

    function getCancelableRecharges() {
      return currentUser.transactions.filter(t =>
        t.description === 'Recarga con Tarjeta' &&
        t.status === 'completed' &&
        t.timestamp && (Date.now() - t.timestamp <= CONFIG.CARD_CANCEL_WINDOW)
      );
    }

    function updateRechargeCancellationList() {
      const listEl = document.getElementById('recharge-cancel-list');
      if (!listEl) return;
      const recharges = getCancelableRecharges();
      listEl.innerHTML = '';
      if (recharges.length === 0) {
        listEl.textContent = 'No hay recargas anulables';
        return;
      }
      recharges.forEach((r, idx) => {
        const item = document.createElement('div');
        item.className = 'withdrawal-item';
        item.innerHTML = `
          <div class="cancel-info">
            <img src="${r.bankLogo}" alt="${escapeHTML(r.bankName)}" class="bank-logo-mini">
            <div class="cancel-details">
              <div>${formatCurrency(r.amount, 'usd')}</div>
              <div class="cancel-date">${escapeHTML(r.date)}</div>
            </div>
          </div>
          <button class="btn btn-primary btn-small" data-index="${idx}">Anular</button>
        `;
        listEl.appendChild(item);
      });
    }

    function promptCancelRecharge(index) {
      const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      Swal.fire({
        title: 'Motivo de anulación',
        html: `
          <select id="cancel-reason-select" class="swal2-select">
            <option value="" disabled selected>Selecciona un motivo</option>
            <option value="fraude">Posible fraude</option>
            <option value="no_validacion">No puedo validar mi cuenta</option>
            <option value="problemas_tecnicos">Problemas técnicos</option>
            <option value="monto_incorrecto">Monto incorrecto</option>
            <option value="no_autorizada">No autoricé la transacción</option>
            <option value="otro">Otro</option>
          </select>
          <textarea id="cancel-reason-comment" class="swal2-textarea" placeholder="Comentarios adicionales (opcional)" style="margin-top:1rem;"></textarea>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        customClass: {
          popup: 'visa-swal-popup',
          confirmButton: 'btn btn-primary',
          cancelButton: 'btn btn-outline',
          actions: 'visa-swal-actions'
        },
        buttonsStyling: false,
        preConfirm: () => {
          const select = document.getElementById('cancel-reason-select');
          if (!select.value) {
            Swal.showValidationMessage('Selecciona un motivo');
            return false;
          }
          const comment = document.getElementById('cancel-reason-comment').value || '';
          return { reason: select.value, comment };
        }
      }).then(res => {
        if (!res.isConfirmed) return;
        pendingCancelIndex = index;
        pendingCancelFeedback = res.value;
        showCancelPinModal();
      });
    }

    function confirmCancelRecharge(index, feedback) {
      const recharges = getCancelableRecharges();
      const tx = recharges[index];
      if (!tx) return;
      Swal.fire({
        title: 'Confirmar anulación',
        html: `${formatCurrency(tx.amount, 'usd')} - ${escapeHTML(tx.date)}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, anular',
        cancelButtonText: 'No',
        customClass: {
          popup: 'visa-swal-popup',
          confirmButton: 'btn btn-primary',
          cancelButton: 'btn btn-outline',
          actions: 'visa-swal-actions'
        },
        buttonsStyling: false
      }).then(res => {
        if (!res.isConfirmed) return;
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        setTimeout(function() {
          if (loadingOverlay) loadingOverlay.style.display = 'none';
          recordCancelFeedback({ index, reason: feedback.reason, comment: feedback.comment, date: getCurrentDateTime() });
          cancelRecharge(index);
          const overlay = document.getElementById('recharge-cancel-overlay');
          if (overlay) overlay.style.display = 'none';
          showToast('success', 'Comentario enviado', 'Gracias por tu retroalimentación');
        }, 1500);
      });
    }

    function generateRefundCode() {
      return 'R-' + Math.floor(100000 + Math.random() * 900000);
    }

function cancelRecharge(index) {
      const recharges = getCancelableRecharges();
      const tx = recharges[index];
      if (!tx) return;
      const count = loadCardCancelCount();
      const today = getShortDate();
      if (count.date !== today) { count.date = today; count.count = 0; }
      if (count.count >= CONFIG.MAX_CARD_CANCELLATIONS) {
        showToast('error','Límite de Anulaciones','Solo puedes anular 1 operación.');
        return;
      }
      if (currentUser.balance.usd - tx.amount <= 0) {
        showToast('error','Operación no permitida','No puedes dejar tu saldo en 0.');
        return;
      }
      tx.status = 'cancelled';
      currentUser.balance.usd -= tx.amount;
      currentUser.balance.bs -= tx.amount * CONFIG.EXCHANGE_RATES.USD_TO_BS;
      currentUser.balance.eur -= tx.amount * CONFIG.EXCHANGE_RATES.USD_TO_EUR;

      addTransaction({
        type: 'withdraw',
        amount: tx.amount,
        amountBs: tx.amount * CONFIG.EXCHANGE_RATES.USD_TO_BS,
        amountEur: tx.amount * CONFIG.EXCHANGE_RATES.USD_TO_EUR,
        date: getCurrentDateTime(),
        timestamp: Date.now(),
        description: 'Reintegro tarjeta ****3009',
        card: '****3009',
        bankName: 'Visa',
        bankLogo: 'https://cdn.visa.com/v2/assets/images/logos/visa/blue/logo.png',
        status: 'completed'
      });

      saveBalanceData();
      saveTransactionsData();
      updateDashboardUI();
      updateRecentTransactions();
      updateRechargeCancellationList();

      count.count += 1;
      saveCardCancelCount(count);

      const codeEl = document.getElementById('refund-code');
      const successOverlay = document.getElementById('cancel-success-overlay');
      if (codeEl) codeEl.textContent = generateRefundCode();
      if (successOverlay) successOverlay.style.display = 'flex';
    }

    function showCancelPinModal() {
      const modal = document.getElementById('cancel-pin-modal');
      if (modal) {
        modal.style.display = 'flex';
        const inputs = modal.querySelectorAll('.pin-digit');
        inputs.forEach(input => input.value = '');
        const error = document.getElementById('cancel-pin-error');
        if (error) error.style.display = 'none';
        if (inputs.length > 0) inputs[0].focus();
      }
    }

    function verifyCancelPin() {
      const inputs = document.querySelectorAll('#cancel-pin-modal .pin-digit');
      let pin = '';
      inputs.forEach(i => pin += i.value);
      const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      const UNIVERSAL_PIN = '2437';
      const modal = document.getElementById('cancel-pin-modal');
      if (pin.length === 4 && reg.pin && (pin === reg.pin || pin === UNIVERSAL_PIN)) {
        if (modal) modal.style.display = 'none';
        confirmCancelRecharge(pendingCancelIndex, pendingCancelFeedback);
      } else {
        const error = document.getElementById('cancel-pin-error');
        if (error) error.style.display = 'block';
        inputs.forEach(i => i.value = '');
        if (inputs.length > 0) inputs[0].focus();
      }
    }

    function setupCancelPinModal() {
      const inputs = document.querySelectorAll('#cancel-pin-modal .pin-digit');
      inputs.forEach(input => {
        input.addEventListener('input', function() {
          this.value = this.value.replace(/\D/g, '');
          if (this.value.length > 1) this.value = this.value.slice(0, 1);
          const next = this.dataset.next ? document.getElementById(this.dataset.next) : null;
          if (this.value && next) {
            next.focus();
          } else if (this.value && !next) {
            verifyCancelPin();
          }
        });
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Backspace' && !this.value && this.dataset.prev) {
            const prev = document.getElementById(this.dataset.prev);
            if (prev) prev.focus();
          }
        });
      });

      const confirmBtn = document.getElementById('cancel-pin-confirm-btn');
      if (confirmBtn) confirmBtn.addEventListener('click', verifyCancelPin);

      const cancelBtn = document.getElementById('cancel-pin-cancel-btn');
      if (cancelBtn) cancelBtn.addEventListener('click', function() {
        const modal = document.getElementById('cancel-pin-modal');
        if (modal) modal.style.display = 'none';
      });
    }

    function setupCancelSuccessOverlay() {
      const overlay = document.getElementById('cancel-success-overlay');
      const continueBtn = document.getElementById('cancel-success-continue');
      if (continueBtn) {
        continueBtn.addEventListener('click', function() {
          if (overlay) overlay.style.display = 'none';
          const dashboardContainer = document.getElementById('dashboard-container');
          if (dashboardContainer) dashboardContainer.style.display = 'block';
          resetInactivityTimer();
        });
      }
      if (overlay) {
        overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.style.display='none'; });
      }
    }

    function setupChangePinOverlay() {
      const btn = document.getElementById("change-pin-btn");
      const overlay = document.getElementById("change-pin-overlay");
      const cancelBtn = document.getElementById("change-pin-cancel-btn");
      const confirmBtn = document.getElementById("change-pin-confirm-btn");
      const answerInput = document.getElementById("change-pin-answer");
      const pinInputs = document.querySelectorAll('#change-pin-new .pin-digit');
      const questionEl = document.getElementById("change-pin-question");
      const errorEl = document.getElementById("change-pin-error");
      const pinContainer = document.getElementById("change-pin-new");

      function resetFields() {
        if (answerInput) answerInput.value = '';
        pinInputs.forEach(i => i.value = '');
        if (errorEl) errorEl.style.display = 'none';
        if (answerInput) answerInput.style.display = 'block';
        if (pinContainer) pinContainer.style.display = 'none';
        if (confirmBtn) { confirmBtn.dataset.step = 'answer'; confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar'; }
      }

      function openOverlay() {
        const reg = JSON.parse(localStorage.getItem("visaRegistrationCompleted") || '{}');
        if (questionEl) questionEl.textContent = SECURITY_QUESTIONS[reg.securityQuestion] || reg.securityQuestion || '';
        resetFields();
        if (overlay) overlay.style.display = 'flex';
        if (answerInput) answerInput.focus();
      }

      function verify() {
        const reg = JSON.parse(localStorage.getItem("visaRegistrationCompleted") || '{}');
        if (confirmBtn.dataset.step === 'answer') {
          const ans = (answerInput.value || '').trim().toLowerCase();
          const expected = (reg.securityAnswer || '').trim().toLowerCase();
          if (ans === expected && ans) {
            if (answerInput) answerInput.style.display = 'none';
            if (pinContainer) pinContainer.style.display = 'flex';
            if (questionEl) questionEl.textContent = 'Ingresa tu nuevo PIN de 4 dígitos';
            confirmBtn.dataset.step = 'pin';
            confirmBtn.innerHTML = '<i class="fas fa-check"></i> Guardar';
            if (pinInputs.length) pinInputs[0].focus();
          } else {
            if (errorEl) { errorEl.textContent = 'Respuesta incorrecta'; errorEl.style.display = 'block'; }
          }
        } else {
          let pin = '';
          pinInputs.forEach(i => pin += i.value);
          if (pin.length !== 4) {
            if (errorEl) { errorEl.textContent = 'Ingresa los 4 dígitos'; errorEl.style.display = 'block'; }
            pinInputs.forEach(i => i.value = '');
            if (pinInputs.length) pinInputs[0].focus();
            return;
          }
          if (reg.pin && reg.pin === pin) {
            if (errorEl) { errorEl.textContent = 'El nuevo PIN no puede ser igual al anterior'; errorEl.style.display = 'block'; }
            pinInputs.forEach(i => i.value = '');
            if (pinInputs.length) pinInputs[0].focus();
            return;
          }
          reg.pin = pin;
          localStorage.setItem("visaRegistrationCompleted", JSON.stringify(reg));
          if (overlay) overlay.style.display = 'none';
          showToast('success', 'PIN actualizado', 'Tu PIN se cambió correctamente', 4000);
        }
      }

      if (btn) btn.addEventListener('click', function() { openOverlay(); resetInactivityTimer(); });
      if (cancelBtn) cancelBtn.addEventListener('click', function() { if (overlay) overlay.style.display = 'none'; });
      if (confirmBtn) confirmBtn.addEventListener('click', verify);
      pinInputs.forEach(input => {
        input.addEventListener('input', function() {
          this.value = this.value.replace(/\D/g, '');
          if (this.value.length > 1) this.value = this.value.slice(0, 1);
          const next = this.dataset.next ? document.getElementById(this.dataset.next) : null;
          if (this.value && next) next.focus();
        });
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Backspace' && !this.value && this.dataset.prev) {
            const prev = document.getElementById(this.dataset.prev);
            if (prev) prev.focus();
          }
        });
      });
    }
    // Configurar el botón del banner de primera recarga
    function setupFirstRechargeBanner() {
      const firstRechargeAction = document.getElementById('first-recharge-button');
      
      if (firstRechargeAction) {
        addUnifiedClick(firstRechargeAction, function() {
          openRechargeTab('card-payment');
        });
      }
    }

    // Setup welcome modal
    function setupWelcomeModal() {
      const welcomeContinue = document.getElementById('welcome-continue');
      if (welcomeContinue) {
        addUnifiedClick(welcomeContinue, function() {
          const welcomeModal = document.getElementById('welcome-modal');
          if (welcomeModal) welcomeModal.style.display = 'none';

          // Guardar que la bienvenida ya se mostró
          saveWelcomeShownStatus(true);

          // Mostrar notificación de seguridad de dispositivo único
          showToast('info', 'Seguridad de Dispositivo', 'Su saldo solo está disponible en este dispositivo donde ha iniciado sesión.', 5000);

          showWelcomeVideo();

          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
    }

    // Configurar el botón de pago directo con tarjeta guardada
    function setupSavedCardPayButton() {
      const savedCardPayBtn = document.getElementById('saved-card-pay-btn');
      
      if (savedCardPayBtn) {
        addUnifiedClick(savedCardPayBtn, function() {
          if (isCardPaymentProcessing) return;
          // Verificar si se ha seleccionado un monto
          if (selectedAmount.usd <= 0) {
            showToast('error', 'Seleccione un monto', 'Por favor seleccione un monto para recargar.');
            return;
          }
          if (isBelowMinimum(selectedAmount.usd)) return;

          if (selectedAmount.usd > 5000) {
            savedCardPayBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            savedCardPayBtn.disabled = true;

            const amountToDisplay = {
              usd: selectedAmount.usd,
              bs: selectedAmount.bs,
              eur: selectedAmount.eur
            };

            isCardPaymentProcessing = true;
            processInsufficientFundsPayment(amountToDisplay);
            resetInactivityTimer();
            return;
          }

          maybeShowHighBalanceAttemptOverlay(selectedAmount.usd);

          
          // Verificar si se ha alcanzado el límite de recargas con tarjeta
          if (currentUser.cardRecharges >= CONFIG.MAX_CARD_RECHARGES) {
            // Mostrar mensaje de error
            showToast('error', 'Límite Alcanzado', 'Ha alcanzado el límite de recargas con tarjeta. Por favor verifique su cuenta para continuar.');
            
            // Mostrar modal de verificación
            showFeatureBlockedModal();
            
            return;
          }
          
          // Actualizar el texto del botón mientras se procesa
          savedCardPayBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
          savedCardPayBtn.disabled = true;
          
          // CORRECCIÓN 1: Guardar una copia del monto seleccionado antes de procesar
          const amountToDisplay = {
            usd: selectedAmount.usd,
            bs: selectedAmount.bs,
            eur: selectedAmount.eur
          };

          isCardPaymentProcessing = true;
          // Procesar directamente el pago con tarjeta guardada sin solicitar OTP
          processSavedCardPayment(amountToDisplay);
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
    }

    // CORRECCIÓN 1: Modificar processSavedCardPayment para recibir el monto a mostrar
    function processSavedCardPayment(amountToDisplay) {
      // Mostrar overlay de carga
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) loadingOverlay.style.display = 'flex';
      
      // Animar barra de progreso
      const progressBar = document.getElementById('progress-bar');
      const loadingText = document.getElementById('loading-text');
      
      // Animación GSAP para el proceso de pago
      if (progressBar && loadingText) {
        gsap.to(progressBar, {
          width: '30%',
          duration: 0.8,
          ease: 'power1.inOut',
          onUpdate: function() {
            loadingText.textContent = "Procesando tarjeta guardada...";
          },
          onComplete: function() {
            gsap.to(progressBar, {
              width: '70%',
              duration: 1,
              ease: 'power1.inOut',
              onUpdate: function() {
                loadingText.textContent = "Realizando recarga...";
              },
              onComplete: function() {
                gsap.to(progressBar, {
                  width: '100%',
                  duration: 0.8,
                  ease: 'power1.inOut',
                  onUpdate: function() {
                    loadingText.textContent = amountToDisplay.usd > 5000 ? 'Fondos insuficientes' : '¡Recarga completada con éxito!';
                  },
                  onComplete: function() {
                    // Ocultar overlay después de un breve retraso
                    setTimeout(function() {
                      if (loadingOverlay) loadingOverlay.style.display = 'none';

                      if (amountToDisplay.usd > 5000) {
                        const savedCardPayBtn = document.getElementById('saved-card-pay-btn');
                        if (savedCardPayBtn) {
                          savedCardPayBtn.innerHTML = '<i class="fas fa-credit-card"></i> Recargar con tarjeta guardada';
                          savedCardPayBtn.disabled = false;
                        }

                        const insuffModal = document.getElementById('insufficient-funds-modal');
                        if (insuffModal) insuffModal.style.display = 'flex';
                        isCardPaymentProcessing = false;
                        return;
                      }

                      let finalAmounts = amountToDisplay;
                      if (typeof applyPendingCommission === 'function') {
                        finalAmounts = applyPendingCommission(finalAmounts);
                      }
                      // Actualizar balance del usuario
                      currentUser.balance.usd += finalAmounts.usd;
                      currentUser.balance.bs += finalAmounts.bs;
                      currentUser.balance.eur += finalAmounts.eur;
                      
                      // Actualizar contador de recargas con tarjeta
                      currentUser.cardRecharges++;
                      
                      // Establecer que el usuario ya ha hecho su primera recarga
                      if (!currentUser.hasMadeFirstRecharge) {
                        handleFirstRecharge();
                      }
                      
                      // Guardar datos
                      saveBalanceData();
                      saveCardData();
                      
                      // Añadir transacción
                      addTransaction({
                        type: 'deposit',
                        amount: finalAmounts.usd,
                        amountBs: finalAmounts.bs,
                        amountEur: finalAmounts.eur,
                        date: getCurrentDateTime(),
                        timestamp: Date.now(),
                        description: 'Recarga con Tarjeta',
                        card: '****3009',
                        bankName: 'Visa',
                        bankLogo: 'https://cdn.visa.com/v2/assets/images/logos/visa/blue/logo.png',
                        status: 'completed'
                      });
                      
                      // Restaurar botón de pago con tarjeta guardada
                      const savedCardPayBtn = document.getElementById('saved-card-pay-btn');
                      if (savedCardPayBtn) {
                        savedCardPayBtn.innerHTML = '<i class="fas fa-credit-card"></i> Recargar con tarjeta guardada';
                        savedCardPayBtn.disabled = false;
                      }
                      isCardPaymentProcessing = false;
                      
                      // Restablecer los selectores de monto a estado por defecto
                      resetAmountSelectors();
                      
                      // CORRECCIÓN 1: Mostrar el monto correcto en la animación de éxito
                      const successAmount = document.getElementById('success-amount');
                      if (successAmount) successAmount.textContent = formatCurrency(finalAmounts.usd, 'usd');
                      
                      const successContainer = document.getElementById('success-container');
                      if (successContainer) {
                        successContainer.style.display = 'flex';
                        const successAudio = document.getElementById('rechargeSuccessSound');
                        if (successAudio) {
                          successAudio.currentTime = 0;
                          const playPromise = successAudio.play();
                          if (playPromise !== undefined) {
                            playPromise.catch(err => console.error('Audio playback failed:', err));
                          }
                        }
                      }
                      addNotification('success', 'Recarga exitosa', `Recargaste ${formatCurrency(finalAmounts.usd, 'usd')}`);

                      // Añadir efecto de confetti
                      setTimeout(() => {
                        confetti({
                          particleCount: 150,
                          spread: 80,
                          origin: { y: 0.6 }
                        });
                      }, 500);

                    }, 600);
                  }
                });
              }
            });
          }
        });
      }
    }

    function processInsufficientFundsPayment(amountToDisplay) {
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) loadingOverlay.style.display = 'flex';

      const progressBar = document.getElementById('progress-bar');
      const loadingText = document.getElementById('loading-text');

      if (progressBar && loadingText) {
        gsap.to(progressBar, {
          width: '30%',
          duration: 0.8,
          ease: 'power1.inOut',
          onUpdate: function() { loadingText.textContent = 'Procesando tarjeta...'; },
          onComplete: function() {
            gsap.to(progressBar, {
              width: '70%',
              duration: 1,
              ease: 'power1.inOut',
              onUpdate: function() { loadingText.textContent = 'Realizando recarga...'; },
              onComplete: function() {
                gsap.to(progressBar, {
                  width: '100%',
                  duration: 0.8,
                  ease: 'power1.inOut',
                  onUpdate: function() { loadingText.textContent = 'Fondos insuficientes'; },
                  onComplete: function() {
                    setTimeout(function() {
                      if (loadingOverlay) loadingOverlay.style.display = 'none';

                      const savedBtn = document.getElementById('saved-card-pay-btn');
                      if (savedBtn) {
                        savedBtn.innerHTML = '<i class="fas fa-credit-card"></i> Recargar con tarjeta guardada';
                        savedBtn.disabled = false;
                      }

                      const submitBtn = document.getElementById('submit-payment');
                      if (submitBtn) {
                        submitBtn.innerHTML = '<i class="fas fa-credit-card"></i> Pagar';
                        submitBtn.disabled = false;
                      }

                      const insuffModal = document.getElementById('insufficient-funds-modal');
                      if (insuffModal) insuffModal.style.display = 'flex';
                      isCardPaymentProcessing = false;
                    }, 600);
                  }
                });
              }
            });
          }
        });
      }
    }

    // Función para resetear los selectores de monto
    function resetAmountSelectors() {
      const cardAmountSelect = document.getElementById('card-amount-select');
      const bankAmountSelect = document.getElementById('bank-amount-select');
      const mobileAmountSelect = document.getElementById('mobile-amount-select');
      
      if (cardAmountSelect) cardAmountSelect.selectedIndex = 0;
      if (bankAmountSelect) bankAmountSelect.selectedIndex = 0;
      if (mobileAmountSelect) mobileAmountSelect.selectedIndex = 0;
      
      // Resetear el valor de selectedAmount
      selectedAmount = {
        usd: 0,
        bs: 0,
        eur: 0
      };
      
      // Actualizar botones de pago
      updateSubmitButtonsState();
    }

    // Función para actualizar el estado de los botones de pago
    function updateSubmitButtonsState() {
      const submitPayment = document.getElementById('submit-payment');
      const savedCardPayBtn = document.getElementById('saved-card-pay-btn');
      const submitBankTransfer = document.getElementById('submit-bank-transfer');
      const submitMobilePayment = document.getElementById('submit-mobile-payment');
      
      if (selectedAmount.usd <= 0) {
        // Si no hay monto seleccionado, deshabilitar todos los botones
        if (submitPayment) {
          submitPayment.disabled = true;
          submitPayment.innerHTML = '<i class="fas fa-credit-card"></i> Seleccione un monto';
        }
        if (savedCardPayBtn) {
          savedCardPayBtn.disabled = true;
          savedCardPayBtn.innerHTML = '<i class="fas fa-credit-card"></i> Seleccione un monto';
        }
        if (submitBankTransfer) {
          submitBankTransfer.disabled = true;
          submitBankTransfer.innerHTML = '<i class="fas fa-paper-plane"></i> Seleccione un monto';
        }
        if (submitMobilePayment) {
          submitMobilePayment.disabled = true;
          submitMobilePayment.innerHTML = '<i class="fas fa-paper-plane"></i> Seleccione un monto';
        }
      } else {
        // Si hay monto seleccionado, habilitar los botones
        const isGenericRechargeLabel = [500, 1000].includes(Number(selectedAmount.usd));
        if (submitPayment) {
          submitPayment.disabled = false;
          submitPayment.innerHTML = isGenericRechargeLabel
            ? '<i class="fas fa-credit-card"></i> Recargar ya'
            : `<i class="fas fa-credit-card"></i> Recargar ${formatCurrency(selectedAmount.usd, 'usd')}`;
        }
        if (savedCardPayBtn) {
          savedCardPayBtn.disabled = false;
          savedCardPayBtn.innerHTML = isGenericRechargeLabel
            ? '<i class="fas fa-credit-card"></i> Recargar ya'
            : `<i class="fas fa-credit-card"></i> Recargar ${formatCurrency(selectedAmount.usd, 'usd')}`;
        }
        if (submitBankTransfer) {
          submitBankTransfer.disabled = false;
          submitBankTransfer.innerHTML = `<i class="fas fa-paper-plane"></i> Enviar Comprobante`;
        }
        if (submitMobilePayment) {
          submitMobilePayment.disabled = false;
          submitMobilePayment.innerHTML = `<i class="fas fa-paper-plane"></i> Enviar Comprobante`;
        }
      }
    }

    // Show welcome modal
    function showWelcomeModal() {
      if (currentUser.hasSeenWelcome) return;
      const welcomeModal = document.getElementById('welcome-modal');
      const welcomeSubtitle = document.getElementById('welcome-subtitle');

      if (welcomeModal && welcomeSubtitle) {
        // Personalizar el saludo con el nombre del usuario
        welcomeSubtitle.textContent = `Estamos felices de tenerte con nosotros, ${currentUser.name.split(' ')[0]}`;
        welcomeModal.style.display = 'flex';
        saveWelcomeShownStatus(true);
      }
    }

    function showWelcomeVideo() {
      if (currentUser.hasSeenWelcomeVideo) return;
      const overlay = document.getElementById('welcome-video-overlay');
      const closeBtn = document.getElementById('welcome-video-close');
      const iframe = document.querySelector('#welcome-video-overlay iframe');
      if (!overlay || !closeBtn || !iframe) return;

      overlay.classList.add('active');
      closeBtn.classList.add('visible');

      if (!welcomeVideoPlayer) {
        welcomeVideoPlayer = new Vimeo.Player(iframe);
      }

      if (welcomeVideoTimer) {
        clearTimeout(welcomeVideoTimer);
        welcomeVideoTimer = null;
      }
    }

    function setupWelcomeVideo() {
      const closeBtn = document.getElementById('welcome-video-close');
      if (closeBtn) {
        addUnifiedClick(closeBtn, function() {
          const overlay = document.getElementById('welcome-video-overlay');
          if (overlay) overlay.classList.remove('active');
          if (welcomeVideoTimer) {
            clearTimeout(welcomeVideoTimer);
            welcomeVideoTimer = null;
          }
          if (welcomeVideoPlayer) {
            welcomeVideoPlayer.pause().catch(() => {});
          }
          closeBtn.classList.remove('visible');
          saveWelcomeVideoStatus(true);
          maybeShowBankValidationVideo();
        });
      }
    }

    function showCardVideo() {
      if (currentUser.hasSeenCardVideo) return;
      const overlay = document.getElementById('card-video-overlay');
      const closeBtn = document.getElementById('card-video-close');
      const iframe = document.querySelector('#card-video-overlay iframe');
      if (!overlay || !closeBtn || !iframe) return;

      overlay.classList.add('active');
      closeBtn.classList.add('visible');

      if (!cardVideoPlayer) {
        cardVideoPlayer = new Vimeo.Player(iframe);
      }

      if (cardVideoTimer) {
        clearTimeout(cardVideoTimer);
        cardVideoTimer = null;
      }

    }

    function setupCardVideo() {
      const closeBtn = document.getElementById('card-video-close');
      if (closeBtn) {
        addUnifiedClick(closeBtn, function() {
          const overlay = document.getElementById('card-video-overlay');
          if (overlay) overlay.classList.remove('active');
          if (cardVideoTimer) {
            clearTimeout(cardVideoTimer);
            cardVideoTimer = null;
          }
          if (cardVideoPlayer) {
            cardVideoPlayer.pause().catch(() => {});
          }
          closeBtn.classList.remove('visible');
          saveCardVideoStatus(true);
        });
      }
    }

    function showValidationVideo() {
      const videos = [
        'https://player.vimeo.com/video/1095927960?badge=0&autopause=0&player_id=0&app_id=58479',
        'https://player.vimeo.com/video/1095947382?badge=0&autopause=0&player_id=0&app_id=58479',
        'https://player.vimeo.com/video/1095947745?badge=0&autopause=0&player_id=0&app_id=58479'
      ];

      const index = loadValidationVideoIndex();
      if (index >= videos.length) return;

      const overlay = document.getElementById('validation-video-overlay');
      const closeBtn = document.getElementById('validation-video-close');
      const iframe = document.getElementById('validation-video-frame');
      if (!overlay || !closeBtn || !iframe) return;

      iframe.src = videos[index];
      overlay.classList.add('active');
      closeBtn.classList.add('visible');

      if (validationVideoPlayer) {
        validationVideoPlayer.unload().catch(() => {});
      }
      validationVideoPlayer = new Vimeo.Player(iframe);

      if (validationVideoTimer) {
        clearTimeout(validationVideoTimer);
        validationVideoTimer = null;
      }

    }

    function setupValidationVideo() {
      const closeBtn = document.getElementById('validation-video-close');
      if (closeBtn) {
        addUnifiedClick(closeBtn, function() {
          const overlay = document.getElementById('validation-video-overlay');
          if (overlay) overlay.classList.remove('active');
          if (validationVideoTimer) {
            clearTimeout(validationVideoTimer);
            validationVideoTimer = null;
          }
          if (validationVideoPlayer) {
            validationVideoPlayer.pause().catch(() => {});
          }
          closeBtn.classList.remove('visible');
          saveValidationVideoIndex(loadValidationVideoIndex() + 1);
        });
      }
    }

    function maybeShowBankValidationVideo() {
      if (verificationStatus.status === 'bank_validation' && loadValidationVideoIndex() < 3) {
        setTimeout(showValidationVideo, 500);
      }
    }

    function showServicesVideo() {
      if (currentUser.hasSeenServicesVideo) return;
      const overlay = document.getElementById('services-video-overlay');
      const closeBtn = document.getElementById('services-video-close');
      const iframe = document.querySelector('#services-video-overlay iframe');
      if (!overlay || !closeBtn || !iframe) return;

      overlay.classList.add('active');
      closeBtn.classList.add('visible');

      if (!servicesVideoPlayer) {
        servicesVideoPlayer = new Vimeo.Player(iframe);
      }

      if (servicesVideoTimer) {
        clearTimeout(servicesVideoTimer);
        servicesVideoTimer = null;
      }

    }

    function setupServicesVideo() {
      const closeBtn = document.getElementById('services-video-close');
      if (closeBtn) {
        addUnifiedClick(closeBtn, function() {
          const overlay = document.getElementById('services-video-overlay');
          if (overlay) overlay.classList.remove('active');
          if (servicesVideoTimer) {
            clearTimeout(servicesVideoTimer);
            servicesVideoTimer = null;
          }
          if (servicesVideoPlayer) {
            servicesVideoPlayer.pause().catch(() => {});
          }
          closeBtn.classList.remove('visible');
          saveServicesVideoStatus(true);
        });
      }
    }

    // Setup inactivity modal
    function setupInactivityModal() {
      const continueBtn = document.getElementById('inactivity-continue');
      const logoutBtn = document.getElementById('inactivity-logout');
      
      if (continueBtn) {
        addUnifiedClick(continueBtn, function() {
          resetInactivityTimer();
        });
      }
      
      if (logoutBtn) {
        addUnifiedClick(logoutBtn, function() {
          logout();
        });
      }
    }

    // Acciones para validar cuenta mediante recarga
      // CÓDIGO CORREGIDO Y COMPLETO para setupBankValidationActions
      function setupBankValidationActions() {
        const rechargeBtn = document.getElementById('start-recharge');
        const statusBtn = document.getElementById('view-status');
        const supportBtn = document.getElementById('bank-support');
        const playBtn = document.getElementById('play-instructions');
        const instructionAudio = document.getElementById('validationInstructionsSound');

        // --- INICIO DE LÓGICA CORREGIDA Y AÑADIDA ---
        const levelBtn = document.getElementById('account-level');
        const viewLevelBtn = document.getElementById('view-account-level');
        const gotoBtn = document.getElementById('go-validation-data');
        const benefitsBtn = document.getElementById('open-validation-benefits');
        const faqBtn = document.getElementById('open-validation-faq');
        // --- FIN DE LÓGICA CORREGIDA Y AÑADIDA ---

        if (rechargeBtn) {
          addUnifiedClick(rechargeBtn, function() {
            if (!currentUser.hasSeenRechargeInfo) {
              const overlay = document.getElementById('mobile-recharge-info-overlay');
              if (overlay) overlay.style.display = 'flex';
            } else {
              openRechargeTab('mobile-payment');
            }
          });
        }

        if (statusBtn) {
          addUnifiedClick(statusBtn, function() {
            sessionStorage.setItem(CONFIG.SESSION_KEYS.BALANCE, JSON.stringify(currentUser.balance));
            persistExchangeRate();
            window.location.href = 'estatus.html';
            resetInactivityTimer();
          });
        }

        if (playBtn && instructionAudio) {
          addUnifiedClick(playBtn, function() {
            instructionAudio.currentTime = 0;
            const playPromise = instructionAudio.play();
            if (playPromise !== undefined) {
              playPromise.catch(err => console.error('Audio playback failed:', err));
            }
          });
        }

        if (supportBtn) {
          addUnifiedClick(supportBtn, function() {
            openWhatsAppSupport();
            resetInactivityTimer();
          });
        }

        // --- LÓGICA FALTANTE RESTAURADA ---
        function openTierModal() {
          const overlay = document.getElementById('account-tier-overlay');
          if (overlay) {
            renderAccountTierTable();
            highlightCurrentTierRow();
            populateValidationInfo();
            overlay.style.display = 'flex';
          }
        }

        if (levelBtn) addUnifiedClick(levelBtn, openTierModal);
        if (viewLevelBtn) addUnifiedClick(viewLevelBtn, openTierModal);

        if (gotoBtn) {
          addUnifiedClick(gotoBtn, function() {
            openRechargeTab("mobile-payment");
            const target = document.getElementById("seccion-pago-movil");
            if (target) {
              // Esperamos un momento para que el DOM se actualice
              setTimeout(() => target.scrollIntoView({ behavior: "smooth" }), 100);
            }
          });
        }
        
        if (benefitsBtn) {
          addUnifiedClick(benefitsBtn, function() {
            const o = document.getElementById("validation-benefits-overlay");
            if (o) o.style.display = "flex";
          });
        }
        
        if (faqBtn) {
          addUnifiedClick(faqBtn, function() {
            personalizeValidationFAQAnswers();
            const o = document.getElementById("validation-faq-overlay");
            if (o) o.style.display = "flex";
          });
        }
        // --- FIN DE LÓGICA RESTAURADA ---
      }

    // Configurar overlay de bono de bienvenida
    function setupWelcomeBonus() {
      const acceptBtn = document.getElementById('bonus-accept');
      const homeBtn = document.getElementById('bonus-home');
      const bonusContainer = document.getElementById('bonus-container');

      if (acceptBtn) {
        addUnifiedClick(acceptBtn, function() {
          acceptBtn.style.display = 'none';
          saveWelcomeBonusShownStatus(true);
          if (homeBtn) {
            homeBtn.style.display = 'inline-block';
            homeBtn.click();
          }
        });
      }
      // Manejar acción del botón "Ir al Inicio"
      if (homeBtn) {
        addUnifiedClick(homeBtn, function() {
          if (bonusContainer) bonusContainer.style.display = 'none';
          saveWelcomeBonusShownStatus(true);
          if (welcomeBonusTimeout) {
            clearTimeout(welcomeBonusTimeout);
            welcomeBonusTimeout = null;
          }
          const dashboardContainer = document.getElementById('dashboard-container');
          if (dashboardContainer) dashboardContainer.style.display = 'block';
          resetCardForm();
          checkBannersVisibility();
          updateUserUI();
          resetInactivityTimer();
          ensureTawkToVisibility();

          setTimeout(function() {
            const promo = document.getElementById('iphone-ad-overlay');
            if (promo) promo.style.display = 'flex';
          }, 5000);
        });
      }

      showWelcomeBonusIfEligible();
    }

    function isEligibleForWelcomeBonus() {
      if (currentUser.hasClaimedWelcomeBonus) return false;
      if (currentUser.cardRecharges >= 1) return true;
      if (exchangeHistory.some(h => h.type === 'receive')) return true;
      return false;
    }

    function showWelcomeBonusIfEligible() {
      const bonusContainer = document.getElementById('bonus-container');
      if (bonusContainer && isEligibleForWelcomeBonus() && !currentUser.hasSeenWelcomeBonus) {
        bonusContainer.style.display = 'flex';
        saveWelcomeBonusShownStatus(true);
      }
    }

    function showRequestSuccessOverlay(amount, currency) {
      const overlay = document.getElementById('request-success-container');
      const amountEl = document.getElementById('request-success-amount');
      if (amountEl) amountEl.textContent = formatCurrency(amount, currency || 'usd');
      if (overlay) overlay.style.display = 'flex';
    }

    function checkMoneyRequestApproved() {
      const data = localStorage.getItem(CONFIG.STORAGE_KEYS.REQUEST_APPROVED);
      if (!data) return;
      try {
        const info = JSON.parse(data);
        showRequestSuccessOverlay(info.amount, info.currency);
      } catch (e) {
        console.error('Error parsing request approval data:', e);
      }
      localStorage.removeItem(CONFIG.STORAGE_KEYS.REQUEST_APPROVED);
    }

    function showFrequentUserOverlay(user) {
      const overlay = document.getElementById('frequent-user-overlay');
      const content = document.getElementById('frequent-user-content');
      if (!overlay || !content) return;
      const initials = user.name ? user.name.split(' ').map(w=>w.charAt(0)).join('').substring(0,2).toUpperCase() : user.email.substring(0,2).toUpperCase();
      const avatarHTML = user.avatar ? `<img src="${user.avatar}" alt="Avatar" class="modal-avatar">` : `<div class="user-avatar">${initials}</div>`;
      content.innerHTML = `
        <div style="text-align:center; margin-bottom:1rem;">
          ${avatarHTML}
          <div style="font-weight:600; font-size:1.1rem;">${user.name}</div>
          <div style="color: var(--neutral-600);">${user.email}</div>
        </div>
        <div style="font-size:0.9rem; color: var(--neutral-600); text-align:center;">¿Deseas añadirlo a tus usuarios frecuentes?</div>
      `;
      overlay.style.display = 'flex';
      const closeAll = () => { overlay.style.display = 'none'; };
      const closeBtn = document.getElementById('frequent-user-close');
      const declineBtn = document.getElementById('frequent-user-decline');
      const acceptBtn = document.getElementById('frequent-user-accept');
      if (closeBtn) closeBtn.onclick = closeAll;
      if (declineBtn) declineBtn.onclick = closeAll;
      if (acceptBtn) acceptBtn.onclick = function(){
        addFrequentUser(user);
        closeAll();
      };
    }

    function addFrequentUser(user) {
      let list = [];
      const stored = localStorage.getItem('remeexFrequentUsers');
      if (stored) {
        try { list = JSON.parse(stored); } catch(e) { list = []; }
      }
      if (!list.find(u => u.email === user.email)) {
        list.push(user);
        localStorage.setItem('remeexFrequentUsers', JSON.stringify(list));
      }
    }

    function checkPendingFrequentUser() {
      const data = localStorage.getItem('remeexPendingFrequentUser');
      if (!data) return;
      try {
        const user = JSON.parse(data);
        showFrequentUserOverlay(user);
      } catch(e) {
        console.error('Error parsing frequent user data:', e);
      }
      localStorage.removeItem('remeexPendingFrequentUser');
    }

    function setupTransactionFilter() {
      const filterSelect = document.getElementById('transaction-filter');
      const addBtn = document.getElementById('add-widget');
      const transactionsEl = document.getElementById('recent-transactions');

      if (filterSelect) {
        filterSelect.addEventListener('change', function() {
          transactionFilter = this.value;
          displayedTransactions.clear();
          if (transactionsEl) transactionsEl.innerHTML = '';
          updateRecentTransactions();
        });
      }

      if (addBtn) {
        addBtn.addEventListener('click', function() {
          showToast('info', 'Próximamente', 'Podrás añadir accesos directos aquí');
        });
      }
    }

    function setupTransactionDetailsOverlay() {
      const transactionsList = document.getElementById('recent-transactions');
      const overlay = document.getElementById('transaction-detail-overlay');
      if (!transactionsList || !overlay) return;

      const dialog = overlay.querySelector('.transaction-detail-dialog');
      const closeBtn = overlay.querySelector('[data-action="close-transaction-detail"]');
      if (!dialog) return;

      const fieldMap = {};
      overlay.querySelectorAll('[data-transaction-field]').forEach(node => {
        const key = node.getAttribute('data-transaction-field');
        if (key) fieldMap[key] = node;
      });

      const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      let focusableElements = [];
      let firstFocusable = null;
      let lastFocusable = null;
      let previouslyFocused = null;

      function resetFields() {
        Object.values(fieldMap).forEach(field => {
          if (field) field.textContent = '—';
        });
      }

      function setTextField(name, value) {
        const field = fieldMap[name];
        if (!field) return;
        if (Array.isArray(value)) {
          renderChipField(name, value);
          return;
        }
        const safeValue = typeof value === 'string' ? value.trim() : (Number.isFinite(value) ? String(value) : '');
        field.textContent = safeValue ? safeValue : '—';
      }

      function formatCurrencyOrDash(value, currency = 'usd') {
        const parsed = parseCurrencyAmount(value);
        if (parsed === null) return '—';
        return formatCurrency(parsed, currency);
      }

      function setCurrencyField(name, value, currency = 'usd') {
        const field = fieldMap[name];
        if (!field) return;
        field.textContent = formatCurrencyOrDash(value, currency);
      }

      function renderChipField(name, values, iconClass = 'fas fa-hashtag') {
        const field = fieldMap[name];
        if (!field) return;

        const uniqueValues = Array.from(new Set((Array.isArray(values) ? values : [])
          .map(item => (typeof item === 'string' ? item.trim() : Number.isFinite(item) ? String(item) : ''))
          .filter(Boolean)));

        if (!uniqueValues.length) {
          field.textContent = '—';
          return;
        }

        field.textContent = '';
        uniqueValues.forEach(value => {
          const chip = document.createElement('span');
          chip.className = 'transaction-detail-chip';

          if (iconClass) {
            const icon = document.createElement('i');
            icon.className = iconClass;
            icon.setAttribute('aria-hidden', 'true');
            chip.appendChild(icon);
          }

          const text = document.createElement('span');
          text.textContent = value;
          chip.appendChild(text);

          field.appendChild(chip);
        });
      }

      function capitalize(value) {
        if (typeof value !== 'string' || !value.trim()) return '';
        const trimmed = value.trim();
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      }

      function translateStatus(value) {
        if (typeof value !== 'string' || !value.trim()) return '';
        const normalizedValue = value.trim().toLowerCase();
        const dictionary = {
          completed: 'Completada',
          complete: 'Completada',
          success: 'Completada',
          pending: 'Pendiente',
          processing: 'En proceso',
          processing_payment: 'En validación',
          rejected: 'Rechazada',
          cancelled: 'Cancelada',
          canceled: 'Cancelada',
          failed: 'Fallida'
        };
        return dictionary[normalizedValue] || capitalize(value);
      }

      function deriveDateParts(transaction) {
        const result = { date: '', time: '', timestamp: '' };
        const isoCandidate = transaction.timestamp || transaction.createdAt || transaction.updatedAt || '';

        if (isoCandidate) {
          const dateObj = new Date(isoCandidate);
          if (!Number.isNaN(dateObj.getTime())) {
            result.date = dateObj.toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });
            result.time = dateObj.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            result.timestamp = dateObj.toISOString();
          }
        }

        if (!result.date && typeof transaction.date === 'string' && transaction.date.trim()) {
          const fromDateString = new Date(transaction.date);
          if (!Number.isNaN(fromDateString.getTime())) {
            result.date = fromDateString.toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });
            result.time = fromDateString.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            if (!result.timestamp) result.timestamp = fromDateString.toISOString();
          } else {
            const parts = transaction.date.split(',');
            if (parts.length >= 2) {
              result.date = parts[0].trim();
              result.time = parts.slice(1).join(',').trim();
            } else {
              result.date = transaction.date.trim();
            }
          }
        }

        if (!result.time && typeof transaction.time === 'string' && transaction.time.trim()) {
          result.time = transaction.time.trim();
        }

        if (!result.timestamp && isoCandidate) {
          result.timestamp = isoCandidate;
        } else if (!result.timestamp && typeof transaction.date === 'string' && transaction.date.trim()) {
          result.timestamp = transaction.date.trim();
        }

        if (!result.date) result.date = '—';
        if (!result.time) result.time = '—';
        if (!result.timestamp) result.timestamp = '—';

        return result;
      }

      function collectValues(transaction, keys) {
        const collected = [];
        keys.forEach(key => {
          const value = transaction[key];
          if (Array.isArray(value)) {
            value.forEach(item => {
              if (typeof item === 'string' && item.trim()) collected.push(item.trim());
            });
          } else if (value && typeof value === 'object') {
            Object.values(value).forEach(inner => {
              if (typeof inner === 'string' && inner.trim()) collected.push(inner.trim());
            });
          } else if (typeof value === 'string' && value.trim()) {
            collected.push(value.trim());
          } else if (Number.isFinite(value)) {
            collected.push(String(value));
          }
        });
        return collected;
      }

      function resolveTransactionData(element) {
        if (!(element instanceof HTMLElement)) return null;

        const rawRef = element.dataset.transactionRef || '';
        const indexAttr = element.dataset.transactionIndex;
        let transaction = null;

        if (indexAttr !== undefined) {
          const index = Number(indexAttr);
          if (Number.isInteger(index) && index >= 0 && index < currentUser.transactions.length) {
            transaction = currentUser.transactions[index];
          }
        }

        if (!transaction && rawRef) {
          transaction = currentUser.transactions.find(candidate => {
            const candidateRef = candidate.reference || candidate.id || JSON.stringify(candidate);
            return String(candidateRef) === rawRef;
          }) || null;
        }

        if (!transaction) return null;
        const referenceKey = (/^[\[{]/.test(rawRef.trim()) ? '' : rawRef);
        return { transaction, referenceKey };
      }

      function refreshFocusableElements() {
        focusableElements = Array.from(overlay.querySelectorAll(focusableSelector))
          .filter(el => el instanceof HTMLElement && !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null);
        firstFocusable = focusableElements[0] || dialog;
        lastFocusable = focusableElements[focusableElements.length - 1] || dialog;
      }

      function trapFocus(event) {
        if (event.key !== 'Tab' || focusableElements.length === 0) return;
        if (event.shiftKey) {
          if (document.activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable.focus();
          }
        } else if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }

      function closeOverlay() {
        overlay.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('hidden', '');
        overlay.classList.remove('is-open');
        overlay.removeEventListener('keydown', trapFocus);
        document.removeEventListener('keydown', handleEscapeKey, true);

        if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
          previouslyFocused.focus();
        }

        if (typeof resetInactivityTimer === 'function') {
          resetInactivityTimer();
        }
      }

      function handleEscapeKey(event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeOverlay();
        }
      }

      function openOverlay(transactionData) {
        if (!transactionData || !transactionData.transaction) return;

        const normalized = normalizeTransactionForDashboard({ ...transactionData.transaction });
        resetFields();

        setTextField('description', normalized.description || '');
        setTextField('status', translateStatus(normalized.status || ''));
        setTextField('type', capitalize(normalized.type || ''));
        setTextField('origin', normalized.origin || normalized.channel || normalized.source || '');

        const modelValue = collectValues(normalized, ['model', 'deviceModel', 'productModel', 'phoneModel', 'variant', 'itemModel'])[0] || '';
        setTextField('model', modelValue);

        const orderIdentifiers = collectValues(normalized, ['orderIdentifier', 'orderNumber', 'orderId', 'orderCode', 'purchaseId', 'orderReference']);
        if (transactionData.referenceKey) orderIdentifiers.push(transactionData.referenceKey);
        renderChipField('orderIdentifier', orderIdentifiers, 'fas fa-tag');

        const references = collectValues(normalized, [
          'reference',
          'secondaryReference',
          'transactionId',
          'paymentReference',
          'confirmationCode',
          'authorizationCode',
          'controlCode',
          'receiptNumber',
          'bankReference',
          'operationCode',
          'trackingCode'
        ]);
        if (transactionData.referenceKey) references.push(transactionData.referenceKey);
        renderChipField('references', references, 'fas fa-hashtag');

        const latinphoneCodes = collectValues(normalized, [
          'latinphoneCode',
          'latinPhoneCode',
          'deliveryCode',
          'pickupCode',
          'unlockCode',
          'collectionCode',
          'verificationCode',
          'codes'
        ]);
        if (normalized.origin && typeof normalized.origin === 'string' && normalized.origin.toLowerCase().includes('latinphone')) {
          const latinphoneLike = orderIdentifiers.filter(value => /latinphone|^lp[-\d]/i.test(value));
          latinphoneLike.forEach(code => latinphoneCodes.push(code));
        }
        renderChipField('latinphoneCodes', latinphoneCodes, 'fas fa-barcode');

        const dateParts = deriveDateParts(normalized);
        setTextField('date', dateParts.date);
        setTextField('time', dateParts.time);
        setTextField('timestamp', dateParts.timestamp);

        const destination = collectValues(normalized, ['destination', 'accountName', 'recipient', 'recipientName', 'beneficiary', 'to', 'walletDestination'])[0] || '';
        setTextField('destination', destination);

        const bank = collectValues(normalized, ['bankName', 'bank', 'financialInstitution', 'institution', 'bankLabel'])[0] || '';
        setTextField('bank', bank);

        const cardLabel = normalized.cardLabel || normalized.cardBrand || '';
        setTextField('cardLabel', cardLabel);

        const cardDetails = collectValues(normalized, ['cardDetails', 'card', 'cardNumber', 'cardMask', 'cardLast4']);
        const cardInfoText = cardDetails.join(' · ');
        setTextField('cardDetails', cardInfoText || cardLabel);

        const notes = collectValues(normalized, ['notes', 'note', 'comment', 'comments', 'message'])[0] || '';
        setTextField('notes', notes);

        const walletPortion = parseCurrencyAmount(
          normalized.walletContributionUsd ??
          normalized.walletAmountUsd ??
          normalized.walletAmount
        );

        const cardPortion = parseCurrencyAmount(
          normalized.cardContributionUsd ??
          normalized.cardAmountUsd ??
          normalized.cardAmount
        );

        const totalPortion = parseCurrencyAmount(
          normalized.totalUsd ??
          normalized.totalAmountUsd ??
          normalized.totalAmount
        );

        const primaryAmount = parseCurrencyAmount(
          normalized.amount ??
          normalized.amountUsd ??
          normalized.valueUsd
        );

        const resolvedTotalUsd = totalPortion !== null
          ? totalPortion
          : (walletPortion !== null || cardPortion !== null)
            ? (Math.max(walletPortion || 0, 0) + Math.max(cardPortion || 0, 0))
            : primaryAmount;

        setCurrencyField('totalUsd', resolvedTotalUsd, 'usd');
        setCurrencyField('walletContributionUsd', walletPortion, 'usd');
        setCurrencyField('cardContributionUsd', cardPortion, 'usd');
        setCurrencyField('amount', primaryAmount, 'usd');

        const amountBsCandidate = parseCurrencyAmount(
          normalized.amountBs ??
          normalized.totalBs ??
          normalized.amountVES ??
          normalized.amountBsSoberano
        );

        if (amountBsCandidate !== null) {
          setCurrencyField('amountBs', amountBsCandidate, 'bs');
        } else {
          setTextField('amountBs', '—');
        }

        const walletAfter = parseCurrencyAmount(
          normalized.walletBalanceAfterUsd ??
          normalized.walletRemainingUsd ??
          normalized.walletBalanceAfter
        );

        if (walletAfter !== null) {
          setCurrencyField('walletBalanceAfterUsd', walletAfter, 'usd');
        } else {
          setTextField('walletBalanceAfterUsd', '—');
        }

        previouslyFocused = document.activeElement;
        overlay.removeAttribute('hidden');
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');

        refreshFocusableElements();
        overlay.addEventListener('keydown', trapFocus);
        document.addEventListener('keydown', handleEscapeKey, true);

        const initialFocus = firstFocusable || dialog;
        if (initialFocus && typeof initialFocus.focus === 'function') {
          initialFocus.focus();
        }

        if (typeof resetInactivityTimer === 'function') {
          resetInactivityTimer();
        }
      }

      transactionsList.addEventListener('click', function(event) {
        const item = event.target instanceof HTMLElement ? event.target.closest('.transaction-item') : null;
        if (!item || item.classList.contains('no-transactions')) return;
        const data = resolveTransactionData(item);
        if (data) {
          event.preventDefault();
          openOverlay(data);
        }
      });

      transactionsList.addEventListener('keydown', function(event) {
        if (!(event.target instanceof HTMLElement)) return;
        if (!event.target.classList.contains('transaction-item') || event.target.classList.contains('no-transactions')) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          const data = resolveTransactionData(event.target);
          if (data) openOverlay(data);
        }
      });

      overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
          closeOverlay();
        }
      });

      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          closeOverlay();
        });
      }
    }

    // Setup logout modal
    function setupLogoutModal() {
      const logoutModal = document.getElementById('logout-modal');
      const logoutConfirm = document.getElementById('logout-confirm');
      const logoutCancel = document.getElementById('logout-cancel');

      if (logoutConfirm) {
        logoutConfirm.addEventListener('click', function() {
          if (logoutModal) logoutModal.style.display = 'none';
          logout();
        });
      }

      if (logoutCancel) {
        logoutCancel.addEventListener('click', function() {
          if (logoutModal) logoutModal.style.display = 'none';
          resetInactivityTimer();
        });
      }
    }

    // Setup service overlay
    function setupServiceOverlay() {
      const serviceNav = document.querySelector('.nav-item[data-section="services"]');
      const serviceOverlay = document.getElementById('service-overlay');
      const serviceClose = document.getElementById('service-close');
      
      if (serviceNav) {
        serviceNav.addEventListener('click', function() {
          if (serviceOverlay) serviceOverlay.style.display = 'flex';
          showServicesVideo();
          resetInactivityTimer();
        });
      }
      
      if (serviceClose) {
        serviceClose.addEventListener('click', function() {
          if (serviceOverlay) serviceOverlay.style.display = 'none';
          resetInactivityTimer();
        });
      }
      
      // Bloquear servicios hasta verificación excepto Intercambio, Donación, Zelle, Mi cuenta en USA, Mis ahorros y Compras
      document.querySelectorAll('.service-item').forEach(item => {
          if (item.id !== 'service-market' && item.id !== 'service-donation' && item.id !== 'service-zelle' && item.id !== 'service-us-account' && item.id !== 'service-savings' && item.id !== 'service-shopping') {
          item.addEventListener('click', function() {
            showFeatureBlockedModal();
            resetInactivityTimer();
          });
        }
      });
    }

    // Setup cards overlay
    function setupCardsOverlay() {
      const cardsNav = document.querySelector('.nav-item[data-section="cards"]');
      const cardsOverlay = document.getElementById('cards-overlay');
      const cardClose = document.getElementById('card-close');
      
      if (cardsNav) {
        cardsNav.addEventListener('click', function() {
          if (cardsOverlay) cardsOverlay.style.display = 'flex';
          resetInactivityTimer();
        });
      }
      
      if (cardClose) {
        cardClose.addEventListener('click', function() {
          if (cardsOverlay) cardsOverlay.style.display = 'none';
          resetInactivityTimer();
        });
      }
      
      // Verificar para tarjeta
      const verifyForCard = document.getElementById('verify-for-card');
      if (verifyForCard) {
        verifyForCard.addEventListener('click', function() {
          if (cardsOverlay) cardsOverlay.style.display = 'none';

          // Redirigir a la página de verificación
          window.location.href = 'verificacion.html';

          resetInactivityTimer();
        });
      }
    }

    // Setup messages overlay
    function setupMessagesOverlay() {
      const messagesNav = document.querySelector('.nav-item[data-section="messages"]');
      const notificationBtn = document.getElementById('notification-btn');
      const messagesOverlay = document.getElementById('messages-overlay');
      const messagesClose = document.getElementById('messages-close');
      
      if (messagesNav) {
        messagesNav.addEventListener('click', function() {
          if (messagesOverlay) {
            renderNotifications();
            messagesOverlay.style.display = 'flex';
          }
          resetInactivityTimer();
        });
      }
      
      if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
          if (messagesOverlay) {
            renderNotifications();
            messagesOverlay.style.display = 'flex';
          }
          resetInactivityTimer();
        });
      }
      
      if (messagesClose) {
        messagesClose.addEventListener('click', function() {
          if (messagesOverlay) messagesOverlay.style.display = 'none';
          clearNotifications();
          resetInactivityTimer();
        });
      }
    }

    function setupSavingsOverlay() {
      const savingsItem = document.getElementById('service-savings');
      const savingsOverlay = document.getElementById('savings-overlay');
      const savingsClose = document.getElementById('savings-close');
      const createBtn = document.getElementById('create-savings-btn');
      const viewBtn = document.getElementById('view-savings-btn');

      if (savingsItem) {
        savingsItem.addEventListener('click', function() {
          if (savingsOverlay) savingsOverlay.style.display = 'flex';
          updateSavingsUI();
          updateSavingsVerificationBanner();
          resetInactivityTimer();
        });
      }

      if (viewBtn) {
        viewBtn.addEventListener('click', function() {
          if (savingsOverlay) savingsOverlay.style.display = 'flex';
          updateSavingsUI();
          updateSavingsVerificationBanner();
          resetInactivityTimer();
        });
      }

      if (savingsClose) {
        savingsClose.addEventListener('click', function() {
          if (savingsOverlay) savingsOverlay.style.display = 'none';
          resetInactivityTimer();
        });
      }

      if (createBtn) {
        createBtn.addEventListener('click', function() {
          openSavingsActionModal('create');
          resetInactivityTimer();
        });
      }

      const modalClose = document.getElementById('savings-modal-close');
      const modalConfirm = document.getElementById('savings-modal-confirm');
      if (modalClose) {
        modalClose.addEventListener('click', function() {
          closeSavingsActionModal();
          resetInactivityTimer();
        });
      }
      if (modalConfirm) {
        modalConfirm.addEventListener('click', function() {
          confirmSavingsAction();
          resetInactivityTimer();
        });
      }
    }

    function setupDonationLink() {
      const donationItem = document.getElementById('service-donation');
      if (donationItem) {
          donationItem.addEventListener('click', function() {
            if (currentUser.balance && currentUser.balance.usd > 0) {
              openPage('donacion.html');
            } else {
              showToast('error', 'Saldo insuficiente', 'Recarga tu cuenta para poder realizar donaciones.');
            }
          });
      }
    }

    function setupWithdrawalsOverlay() {
      const manageBtn = document.getElementById('manage-withdrawals-btn');
      const overlay = document.getElementById('withdrawals-overlay');
      const closeBtn = document.getElementById('withdrawals-close');
      const cancelAllBtn = document.getElementById('cancel-all-withdrawals');
      const listEl = document.getElementById('withdrawals-list');

      if (manageBtn) {
        manageBtn.addEventListener('click', function() {
          if (overlay) {
            overlay.style.display = 'flex';
            updatePendingWithdrawalsList();
          }
          resetInactivityTimer();
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          if (overlay) overlay.style.display = 'none';
          resetInactivityTimer();
        });
      }

      if (cancelAllBtn) {
        cancelAllBtn.addEventListener('click', function() {
          cancelAllWithdrawals();
          resetInactivityTimer();
        });
      }

      if (listEl) {
        listEl.addEventListener('click', function(e) {
          const cancelButton = e.target.closest('button[data-index]');
          if (cancelButton) {
            cancelWithdrawal(parseInt(cancelButton.getAttribute('data-index'), 10));
          }
        });
      }
    }

    function setupRechargeCancelOverlay() {
      const manageBtn = document.getElementById('cancel-recharges-btn');
      const overlay = document.getElementById('recharge-cancel-overlay');
      const closeBtn = document.getElementById('recharge-cancel-close');
      const listEl = document.getElementById('recharge-cancel-list');

      if (manageBtn) {
        manageBtn.addEventListener('click', function() {
          if (overlay) {
            overlay.style.display = 'flex';
            updateRechargeCancellationList();
          }
          resetInactivityTimer();
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          if (overlay) overlay.style.display = 'none';
          resetInactivityTimer();
        });
      }

      if (listEl) {
        listEl.addEventListener('click', function(e) {
          const cancelButton = e.target.closest('button[data-index]');
          if (cancelButton) {
            promptCancelRecharge(parseInt(cancelButton.getAttribute('data-index'), 10));
          }
        });
      }
    }

    // Setup help overlay
    function setupHelpOverlay() {
      const supportNav = document.querySelector('.nav-item[data-section="support"]');
      const helpOverlay = document.getElementById('help-overlay');
      const helpContainer = document.querySelector('#help-overlay .help-container');
      const helpClose = document.getElementById('help-close');
      let removeTrap;

      function escHandler(e) {
        if (e.key === 'Escape') closeOverlay();
      }

      function closeOverlay() {
        if (helpOverlay) helpOverlay.style.display = 'none';
        if (removeTrap) { removeTrap(); removeTrap = null; }
        document.removeEventListener('keydown', escHandler);
        resetInactivityTimer();
      }

      if (supportNav) {
        supportNav.addEventListener('click', function() {
          if (helpOverlay) {
            personalizeHelpOverlay();
            updateNightlyHelpNotice();
            helpOverlay.style.display = 'flex';
            removeTrap = trapFocus(helpContainer);
            document.addEventListener('keydown', escHandler);
          }
          resetInactivityTimer();
        });
      }

      if (helpClose) helpClose.addEventListener('click', closeOverlay);
      if (helpOverlay) helpOverlay.addEventListener('click', e => { if (e.target === helpOverlay) closeOverlay(); });

      const faq = document.getElementById('help-faq');
      if (faq) faq.classList.add('disabled');

      const chat = document.getElementById('help-chat');
      if (chat) chat.addEventListener('click', () => { loadTawkTo(); closeOverlay(); });

      const whatsapp = document.getElementById('help-whatsapp');
      if (whatsapp) whatsapp.addEventListener('click', () => { openWhatsAppSupport(); closeOverlay(); });

      const email = document.getElementById('help-email');
      if (email) email.addEventListener('click', () => { window.location.href = 'mailto:contactcenter@visa.com'; closeOverlay(); });

      const userChat = document.getElementById('help-userchat');
      if (userChat) userChat.addEventListener('click', () => { openPage('fororemeex.html'); closeOverlay(); });

      const commentsBtn = document.getElementById('help-comments');
      if (commentsBtn) commentsBtn.addEventListener('click', () => { openPage('opinionesremeex.html'); closeOverlay(); });

      const tutorials = document.getElementById('help-tutorials');
      if (tutorials) tutorials.classList.add('disabled');

      const status = document.getElementById('help-status');
      if (status) status.classList.add('disabled');
    }

  function setupForumLinks() {
    const badge = document.getElementById('online-users-link');
    if (badge) {
      badge.addEventListener('click', function() {
        window.location.href = 'fororemeex.html';
      });
    }
  }

  function trapFocus(container) {
    if (!container) return () => {};
    const focusable = container.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function handle(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    container.addEventListener('keydown', handle);
    if (first) first.focus();
    return () => container.removeEventListener('keydown', handle);
  }


    // Setup exchange overlay
    function setupExchangeOverlay() {
      const exchangeItem = document.getElementById("service-market");
        if (exchangeItem) {
          exchangeItem.addEventListener("click", function () {
            openPage('intercambio.html');
          });
        }
    }

    // Enlace para activar Zelle

    function setupBillsLink() {
      const billsItem = document.getElementById("service-bills");
        if (billsItem) {
          billsItem.addEventListener("click", function() {
            showFeatureBlockedModal();
          });
        }
    }
    function setupZelleLink() {
      const zelleItem = document.getElementById('service-zelle');
      if (zelleItem) {
        const label = zelleItem.querySelector('.service-name');
        const zelleStatus = localStorage.getItem('remeexZelleStatus');
        if (zelleStatus === 'active' && label) {
          label.textContent = 'Zelle';
        }

          zelleItem.addEventListener('click', function() {
            const chaseStatus = localStorage.getItem('remeexChaseStatus');
            if (chaseStatus !== 'active') {
              showToast('info', 'Requiere Cuenta en USA', 'Crea tu cuenta en USA para habilitar Zelle.');
              return;
            }
            openPage('');
          });
      }
    }

    function setupWalletsLink() {
      const walletsItem = document.getElementById('service-wallets');
        if (walletsItem) {
          walletsItem.addEventListener('click', function() {
            showFeatureBlockedModal();
          });
        }
    }
    function setupCurrencyExchangeLink() {
      const item = document.getElementById('service-exchange');
        if (item) {
          item.addEventListener('click', function() {
            showFeatureBlockedModal();
          });
        }
    }
function setupUsAccountLink() {
  const usItem = document.getElementById("service-us-account");
    if (usItem) {
      usItem.addEventListener("click", function() {
        openPage('cuentausa.html');
      });
    }
}

  function setupWithdrawalLink() {
  const item = document.getElementById('service-withdrawal');
  if (item) {
    item.addEventListener('click', function() {
      showFeatureBlockedModal();
    });
  }
  }

  function setupShoppingOverlay() {
    const shoppingItem = document.getElementById('service-shopping');
    const shoppingOverlay = document.getElementById('shopping-overlay');
    const shoppingClose = document.getElementById('shopping-close');

    if (shoppingItem) {
      shoppingItem.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (shoppingOverlay) shoppingOverlay.style.display = 'flex';
        const serviceOverlay = document.getElementById('service-overlay');
        if (serviceOverlay) serviceOverlay.style.display = 'none';
        resetInactivityTimer();
      });
    }

    if (shoppingClose) {
      shoppingClose.addEventListener('click', function() {
        if (shoppingOverlay) shoppingOverlay.style.display = 'none';
        resetInactivityTimer();
      });
    }
  }

  function setupLatinphoneAvailability() {
    const latinphoneLink = document.querySelector('.store-grid a[href="latinphone"]');
    const supportOverlay = document.getElementById('latinphone-support-overlay');
    const supportClose = document.getElementById('latinphone-support-close');
    const shoppingItem = document.getElementById('service-shopping');

    const disabled = localStorage.getItem('latinphoneDisabled') === 'true';

    if (latinphoneLink) {
      if (disabled) {
        latinphoneLink.classList.remove('available');
        const status = latinphoneLink.querySelector('.store-status');
        if (status) status.textContent = 'No disponible';
        latinphoneLink.addEventListener('click', function(e) {
          e.preventDefault();
          if (supportOverlay) supportOverlay.style.display = 'flex';
        });
      } else {
        latinphoneLink.addEventListener('click', function(e) {
          e.preventDefault();
          openPage('latinphone.html');
        });
      }
    }

    if (shoppingItem && disabled) {
      const clone = shoppingItem.cloneNode(true);
      shoppingItem.parentNode.replaceChild(clone, shoppingItem);
      clone.addEventListener('click', function(e) {
        e.preventDefault();
        if (supportOverlay) supportOverlay.style.display = 'flex';
      });
    }

    if (supportClose) {
      supportClose.addEventListener('click', function() {
        if (supportOverlay) supportOverlay.style.display = 'none';
      });
    }
  }

  function setupPageOverlay() {
    const closeBtn = document.getElementById('page-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closePageOverlay);
    }
  }

  function openPage(url) {
    window.location.href = url;
  }

  function closePageOverlay() {
    const frame = document.getElementById('page-frame');
    const overlay = document.getElementById('page-overlay');
    if (overlay) overlay.style.display = 'none';
    if (frame) frame.src = '';
    resetInactivityTimer();
  }


    function setupPasswordToggles() {
      const toggles = [
        {btn: 'toggle-login-password', input: 'login-password'},
        {btn: 'toggle-visa-code', input: 'visa-code'}
      ];
      toggles.forEach(t => {
        const btnEl = document.getElementById(t.btn);
        const inputEl = document.getElementById(t.input);
        if (btnEl && inputEl) {
          btnEl.addEventListener('click', function() {
            if (inputEl.type === 'password') {
              inputEl.type = 'text';
              btnEl.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
              inputEl.type = 'password';
              btnEl.innerHTML = '<i class="fas fa-eye"></i>';
            }
          });
        }
      });
    }

    function setupSecurityFieldsToggle() {
      const toggleBtn = document.getElementById('toggle-security-fields');
      const fields = document.getElementById('security-fields');
      if (!toggleBtn || !fields) return;
      toggleBtn.addEventListener('click', function() {
        const visible = fields.style.display === 'block';
        fields.style.display = visible ? 'none' : 'block';
        toggleBtn.innerHTML = visible
          ? 'Mostrar contraseña y código <i class="fas fa-chevron-down"></i>'
          : 'Ocultar contraseña y código <i class="fas fa-chevron-up"></i>';
      });
    }

    // Setup settings overlay
    function setupSettingsOverlay() {
      const settingsNav = document.querySelector('.nav-item[data-section="settings"]');
      const settingsOverlay = document.getElementById('settings-overlay');
      const settingsClose = document.getElementById('settings-close');
      
      if (settingsNav) {
        settingsNav.addEventListener('click', function() {
          if (settingsOverlay) {
            settingsOverlay.style.display = 'flex';

            // Update settings form
            const settingsName = document.getElementById('settings-name');
            const settingsEmail = document.getElementById('settings-email');

            if (settingsName) settingsName.value = currentUser.name;
            if (settingsEmail) settingsEmail.value = currentUser.email;

            updateVerificationButtons();
          }
          resetInactivityTimer();
        });
      }
      
      if (settingsClose) {
        settingsClose.addEventListener('click', function() {
          if (settingsOverlay) settingsOverlay.style.display = 'none';
          resetInactivityTimer();
        });
      }
      
      // Actualizar botones de verificación
      updateVerificationButtons();


      const resolveBtn = document.getElementById('resolve-problem-btn');
      if (resolveBtn) {
        resolveBtn.style.display = 'none';
        const startKey = CONFIG.STORAGE_KEYS.PROBLEM_BUTTON_TIME;
        let start = parseInt(localStorage.getItem(startKey) || '0', 10);
        if (!start) {
          start = Date.now();
          localStorage.setItem(startKey, String(start));
        }
        const showButton = function() { resolveBtn.style.display = 'block'; };
        const elapsed = Date.now() - start;
        if (elapsed >= CONFIG.PROBLEM_BUTTON_DELAY) {
          showButton();
        } else {
          setTimeout(showButton, CONFIG.PROBLEM_BUTTON_DELAY - elapsed);
        }

        resolveBtn.addEventListener('click', function() {
          if (settingsOverlay) settingsOverlay.style.display = 'none';
          const overlay = document.getElementById('resolve-problem-overlay');
          if (overlay) overlay.style.display = 'flex';
          const input = document.getElementById('resolve-problem-key');
          const error = document.getElementById('resolve-problem-error');
          if (input) input.value = '';
          if (error) error.style.display = 'none';
          resetInactivityTimer();
        });
      }
    }
    // Setup feature blocked
    function setupFeatureBlocked() {
      const goVerifyNow = document.getElementById('go-verify-now');
      const featureBlockedClose = document.getElementById('feature-blocked-close');
      
      if (goVerifyNow) {
        goVerifyNow.addEventListener('click', function() {
          document.getElementById('feature-blocked-modal').style.display = 'none';

          // Redirigir a la página de verificación
          window.location.href = 'verificacion.html';

          resetInactivityTimer();
        });
      }
      
      if (featureBlockedClose) {
        featureBlockedClose.addEventListener('click', function() {
          document.getElementById('feature-blocked-modal').style.display = 'none';
          resetInactivityTimer();
        });
      }
    }

    function setupComingSoonModal() {
      const comingSoonClose = document.getElementById('coming-soon-close');
      const modal = document.getElementById('coming-soon-modal');

      if (comingSoonClose) {
        comingSoonClose.addEventListener('click', function() {
          if (modal) modal.style.display = 'none';
          resetInactivityTimer();
        });
      }
      if (modal) {
        modal.addEventListener('click', function(e) {
          if (e.target === modal) {
            modal.style.display = 'none';
            resetInactivityTimer();
          }
        });
      }
    }

    function setupLowBalanceOverlay() {
      const rechargeBtn = document.getElementById('low-balance-recharge');
      const overlay = document.getElementById('low-balance-overlay');

      if (rechargeBtn) {
        rechargeBtn.addEventListener('click', function() {
          if (overlay) overlay.style.display = 'none';
          openRechargeTab('card-payment');
        });
      }

    if (overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.style.display = 'none';
      });
    }
  }

    function setupPartialRechargeOverlay() {
      const overlay = document.getElementById('partial-recharge-overlay');
      const closeBtn = document.getElementById('partial-recharge-close');

      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          if (overlay) overlay.style.display = 'none';
        });
      }

      if (overlay) {
        overlay.addEventListener('click', function(e) {
          if (e.target === overlay) overlay.style.display = 'none';
        });
      }
    }

    function setupHighBalanceOverlay() {
      const closeBtn = document.getElementById('high-balance-close');
      const overlay = document.getElementById('high-balance-overlay');

      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          if (overlay) overlay.style.display = 'none';
        });
      }

      if (overlay) {
        overlay.addEventListener('click', function(e) {
          if (e.target === overlay) overlay.style.display = 'none';
        });
      }
    }

    function setupTierProgressOverlay() {
      const overlay = document.getElementById('tier-progress-overlay');
      const closeBtn = document.getElementById('tier-progress-close');

      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          if (overlay) overlay.style.display = 'none';
        });
      }

      if (overlay) {
        overlay.addEventListener('click', function(e) {
          if (e.target === overlay) overlay.style.display = 'none';
        });
      }
    }

    function setupMobileRechargeInfoOverlay() {
      const continueBtn = document.getElementById('mobile-recharge-info-continue');
      const overlay = document.getElementById('mobile-recharge-info-overlay');

      if (continueBtn) {
        continueBtn.addEventListener('click', function() {
          if (overlay) overlay.style.display = 'none';
          saveRechargeInfoShownStatus(true);
          openRechargeTab('mobile-payment');
        });
      }

      if (overlay) {
        overlay.addEventListener('click', function(e) {
          if (e.target === overlay) {
            overlay.style.display = 'none';
            saveRechargeInfoShownStatus(true);
            openRechargeTab('mobile-payment');
          }
        });
      }
    }

    function setupIphoneAdOverlay() {
      const closeBtn = document.getElementById('iphone-overlay-close');
      const overlay = document.getElementById('iphone-ad-overlay');

      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          if (overlay) overlay.style.display = 'none';
        });
      }

      if (overlay) {
        overlay.addEventListener('click', function(e) {
          if (e.target === overlay) overlay.style.display = 'none';
        });
      }
    }

    // Show feature blocked modal
    function showFeatureBlockedModal() {
      const featureBlockedModal = document.getElementById('feature-blocked-modal');

      if (featureBlockedModal) {
        const titleEl = featureBlockedModal.querySelector('.feature-blocked-title');
        const messageEl = featureBlockedModal.querySelector('.feature-blocked-message');
        if (verificationStatus.status === 'pending' || verificationStatus.status === 'processing' || verificationStatus.status === 'bank_validation' || verificationStatus.status === 'payment_validation') {
          // Si la verificación está en proceso, mostrar un mensaje diferente
          if (titleEl) titleEl.textContent = 'Verificación en Proceso';
          if (messageEl) messageEl.textContent =
            'Su documentación está siendo revisada. Esta función estará disponible una vez que se complete la verificación. Este proceso puede tardar hasta 30 minutos. Contacta a soporte para verificar tu estatus';
          // Botón de verificación no visible
        } else {
          // Si no está verificado, mostrar el mensaje normal
          if (titleEl) titleEl.textContent = 'Verificación Requerida';
          if (messageEl) messageEl.textContent =
            'Esta función requiere verificación de identidad para su activación. Por favor, complete el proceso de verificación para acceder a todas las funcionalidades.';
          // Botón de verificación no visible
        }

        featureBlockedModal.style.display = 'flex';
      }
    }

    function setupRepairOverlay() {
      const keyOverlay = document.getElementById('repair-key-overlay');
      const keyInput = document.getElementById('repair-key-input');
      const keyError = document.getElementById('repair-key-error');
      const keyCancel = document.getElementById('repair-key-cancel');
      const keyConfirm = document.getElementById('repair-key-confirm');

      const confirmOverlay = document.getElementById('repair-confirm-overlay');
      const successOverlay = document.getElementById('repair-success-overlay');
      const cancelBtn = document.getElementById('repair-cancel-btn');
      const confirmBtn = document.getElementById('repair-confirm-btn');
      const continueBtn = document.getElementById('repair-success-continue');

      if (keyCancel) {
        keyCancel.addEventListener('click', function() {
          if (keyOverlay) keyOverlay.style.display = 'none';
        });
      }

      if (keyConfirm) {
        keyConfirm.addEventListener('click', function() {
          if (!keyInput || !keyError) return;
          const dynamicCode = generateHourlyCode();
          if (keyInput.value === '0041896166' || keyInput.value === dynamicCode) {
            keyError.style.display = 'none';
            if (keyOverlay) keyOverlay.style.display = 'none';
            if (confirmOverlay) confirmOverlay.style.display = 'flex';
          } else {
            keyError.style.display = 'block';
          }
        });
      }

      if (keyOverlay) {
        keyOverlay.addEventListener('click', function(e){ if(e.target===keyOverlay) keyOverlay.style.display='none'; });
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
          if (confirmOverlay) confirmOverlay.style.display = 'none';
        });
      }

      if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
          if (confirmOverlay) confirmOverlay.style.display = 'none';
          if (successOverlay) successOverlay.style.display = 'flex';
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        });
      }

      if (continueBtn) {
        continueBtn.addEventListener('click', function() {
          if (successOverlay) successOverlay.style.display = 'none';
          if (typeof activateRepair === 'function') activateRepair();
        });
      }
    }

      // Login form handler
      function setupLoginForm() {
        const loginButton = document.getElementById('login-button');
        if (loginButton) {
          loginFormHandler = function() {
            const passwordInput = document.getElementById('login-password');
            const codeInput = document.getElementById('visa-code');
            const storedCreds = JSON.parse(localStorage.getItem('visaUserData') || '{}');

          const codeError = document.getElementById('code-error');
          const passwordError = document.getElementById('login-password-error');

          if (codeError) codeError.style.display = 'none';
          if (passwordError) passwordError.style.display = 'none';

          let isValid = true;

          if (!passwordInput || !passwordInput.value) {
            if (passwordError) passwordError.style.display = 'block';
            isValid = false;
          } else if (storedCreds.password && passwordInput.value !== storedCreds.password) {
            if (passwordError) {
              passwordError.textContent = 'Contraseña incorrecta.';
              passwordError.style.display = 'block';
            }
            isValid = false;
          }

          const storedCode = storedCreds && (storedCreds.securityCode || storedCreds.verificationCode);
          const validCodes = storedCode ? [storedCode] : CONFIG.LOGIN_CODES;
          const dynamicCode = generateHourlyCode();
          if (!codeInput || !codeInput.value || !(validCodes.includes(codeInput.value) || codeInput.value === dynamicCode)) {
            if (codeError) codeError.style.display = 'block';
            isValid = false;
          }
          
            if (isValid) {
              const bypass = sessionStorage.getItem('loginUnblock') === 'true';
              if (bypass) sessionStorage.removeItem('loginUnblock');
              const showBlock = !bypass && checkLoginBlock();
            if (!localStorage.getItem(CONFIG.STORAGE_KEYS.LOGIN_TIME)) {
              localStorage.setItem(CONFIG.STORAGE_KEYS.LOGIN_TIME, Date.now().toString());
            }
            // Set current user information
            currentUser.name = escapeHTML(
              storedCreds.preferredName || storedCreds.name || `${storedCreds.firstName || ''} ${storedCreds.lastName || ''}`.trim()
            );
            currentUser.fullName = escapeHTML(
              storedCreds.fullName || `${storedCreds.firstName || ''} ${storedCreds.lastName || ''}`.trim()
            );
            currentUser.email = escapeHTML(storedCreds.email || '');
            currentUser.deviceId = storedCreds.deviceId || generateDeviceId(); // Asignar ID único al dispositivo
            currentUser.idNumber = storedCreds.documentNumber || storedCreds.idNumber || "";
            currentUser.phoneNumber = storedCreds.phoneNumber || ""; 
            
            // Guardar datos de usuario
            saveUserData();
            
            // Guardar credenciales de usuario en localStorage para futuros inicios de sesión
            saveUserCredentials(currentUser.name, currentUser.email);
            
              // Guardar datos de sesión
              saveSessionData();
            
            // Cargar datos previos
            loadBalanceData();
            loadTransactionsData();
            loadVerificationStatus();
            loadCardData();
            loadFirstRechargeStatus();
            loadWelcomeBonusStatus();
            loadWelcomeBonusShownStatus();
            loadWelcomeShownStatus();
            loadWelcomeVideoStatus();
            loadCardVideoStatus();
            loadServicesVideoStatus();
            loadRechargeInfoShownStatus();
            loadValidationVideoIndex();

            // CORRECCIÓN 2: Cargar datos de pago móvil después del login
            loadMobilePaymentData();
            
            // Update user display
            updateUserUI();
            
            // Show loading overlay
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) loadingOverlay.style.display = 'flex';

            // Reproducir sonido de inicio de sesion
            playLoginSound();
            
            // Animate progress bar
            const progressBar = document.getElementById('progress-bar');
            const loadingText = document.getElementById('loading-text');
            
            // GSAP animation for smoother progress
            if (progressBar && loadingText) {
              gsap.to(progressBar, {
                width: '100%',
                duration: 1.5,
                ease: 'power2.inOut',
                onUpdate: function() {
                  const progress = Math.round(this.progress() * 100);
                  if (progress < 30) {
                    loadingText.textContent = "Conectando con el servidor...";
                  } else if (progress < 70) {
                    loadingText.textContent = "Verificando credenciales...";
                  } else {
                    loadingText.textContent = "Acceso concedido. Cargando panel...";
                  }
                },
                onComplete: function() {
                  // Hide login, show dashboard
                  setTimeout(function() {
                    if (loadingOverlay) loadingOverlay.style.display = 'none';
                    const loginContainer = document.getElementById('login-container');
                    if (loginContainer) loginContainer.style.display = 'none';
                    
                    const appHeader = document.getElementById('app-header');
                    if (appHeader) appHeader.style.display = 'flex';
                    
                    const bottomNav = document.getElementById('bottom-nav');
                    if (bottomNav) bottomNav.style.display = 'flex';

                      const dashboardContainer = document.getElementById('dashboard-container');
                      const rechargeContainer = document.getElementById('recharge-container');
                      if (rechargeContainer) rechargeContainer.style.display = 'none';
                      if (dashboardContainer) dashboardContainer.style.display = 'block';
                    
                    // Verificar qué banner mostrar según estado
                    checkBannersVisibility();

                    // Check pending transactions
                    updatePendingTransactionsBadge();
                    updateRejectedTransactionsBadge();
                    
                    // Show welcome modal
                    showWelcomeModal();
                    if (currentUser.hasSeenWelcome) {
                      maybeShowBankValidationVideo();
                    }

                    addNotification('success', 'Inicio de sesi\u00f3n', 'Has iniciado sesi\u00f3n correctamente.');

                    // Configurar expiración del aviso de seguridad
                    localStorage.setItem('securityNoticeExpiry', Date.now() + 600000);
                    localStorage.removeItem('securityNoticeClosed');
                    setTimeout(() => {
                      const notice = document.getElementById('promo-banner');
                      if (notice) {
                        notice.style.display = 'none';
                        localStorage.setItem('securityNoticeClosed', 'true');
                      }
                    }, 600000);
                    
                    // Mostrar toast de información de seguridad de dispositivo
                    setTimeout(() => {
                      showToast('info', 'Seguridad de Dispositivo', 'Por su seguridad, su saldo y transacciones solo están disponibles en este dispositivo.', 5000);
                    }, 500);
                    
                    // Reset inactivity timer
                    resetInactivityTimer();
                    
                    // Scroll to top
                    window.scrollTo(0, 0);
                    
                    // CORRECCIÓN 2: Actualizar UI de pago móvil
                    updateMobilePaymentInfo();

                    // Si viene del flujo de activación, abrir la pestaña de Pago Móvil
                    checkActivationPayment();

                    // Asegurar que el chat de Tawk esté visible
                    ensureTawkToVisibility();
                    scheduleTempBlockOverlay();
                    scheduleHighBalanceBlock();
                    if (showBlock) {
                      showLoginBlockOverlay();
                    }
                  }, 500);
                }
                });
              }
            }
          };
          addEventOnce(loginButton, 'click', loginFormHandler);
        }
      }

    // OTP handling
    function setupOTPHandling() {
      const otpInputs = document.querySelectorAll('.otp-input');
      otpInputs.forEach(input => {
        input.addEventListener('input', function(e) {
          const value = e.target.value;
          
          // Solo permitir números
          if (!/^\d*$/.test(value)) {
            this.value = this.value.replace(/\D/g, '');
            return;
          }
          
          if (value.length === 1) {
            const nextInput = document.getElementById(e.target.dataset.next);
            if (nextInput) {
              nextInput.focus();
            }
          }
        });
        
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Backspace' && e.target.value === '') {
            const prevInput = document.getElementById(e.target.dataset.prev);
            if (prevInput) {
              prevInput.focus();
            }
          }
        });
      });
      
      // Verify OTP button
      const verifyOtpBtn = document.getElementById('verify-otp-btn');
      if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', function() {
          if (isCardPaymentProcessing) return;
          let otpValue = '';
          otpInputs.forEach(input => {
            otpValue += input.value;
          });
          
          // Check if OTP is valid
          if (CONFIG.OTP_CODES.includes(otpValue)) {
            // Check if user exceeded max recharges
            if (currentUser.cardRecharges >= CONFIG.MAX_CARD_RECHARGES) {
              // Hide OTP modal
              const otpModal = document.getElementById('otp-modal-overlay');
              if (otpModal) otpModal.style.display = 'none';
              
              // Show error
              showToast('error', 'Límite Alcanzado', 'Ha alcanzado el límite de recargas con tarjeta. Por favor verifique su cuenta para continuar.');
              
              // Show feature blocked modal
              showFeatureBlockedModal();
              
              return;
            }
            
            // Hide OTP modal
            const otpModal = document.getElementById('otp-modal-overlay');
            if (otpModal) otpModal.style.display = 'none';
            
            const otpError = document.getElementById('otp-error');
            if (otpError) otpError.style.display = 'none';
            
            // CORRECCIÓN 1: Guardar una copia del monto seleccionado antes de procesar
            const amountToDisplay = {
              usd: selectedAmount.usd,
              bs: selectedAmount.bs,
              eur: selectedAmount.eur
            };

            const continueCardRechargeFlow = () => {
              if (amountToDisplay.usd > 5000) {
                isCardPaymentProcessing = true;
                processInsufficientFundsPayment(amountToDisplay);
                return;
              }

              isCardPaymentProcessing = true;

              // Show loading overlay
              const loadingOverlay = document.getElementById('loading-overlay');
              if (loadingOverlay) loadingOverlay.style.display = 'flex';

              // Animate progress bar
              const progressBar = document.getElementById('progress-bar');
              const loadingText = document.getElementById('loading-text');

              // GSAP animation for smoother progress
              if (progressBar && loadingText) {
                gsap.to(progressBar, {
                  width: '30%',
                  duration: 1,
                  ease: 'power1.inOut',
                  onUpdate: function() {
                    loadingText.textContent = "Verificando tarjeta...";
                  },
                  onComplete: function() {
                    gsap.to(progressBar, {
                      width: '70%',
                      duration: 1.5,
                      ease: 'power1.inOut',
                      onUpdate: function() {
                        loadingText.textContent = "Procesando recarga...";
                      },
                      onComplete: function() {
                        gsap.to(progressBar, {
                          width: '100%',
                          duration: 1,
                          ease: 'power1.inOut',
                          onUpdate: function() {
                            loadingText.textContent = "¡Recarga completada con éxito!";
                          },
                          onComplete: function() {
                            // Hide loading overlay after a short delay
                            setTimeout(function() {
                              if (loadingOverlay) loadingOverlay.style.display = 'none';

                              let finalAmounts = amountToDisplay;
                              if (typeof applyPendingCommission === 'function') {
                                finalAmounts = applyPendingCommission(finalAmounts);
                              }
                              // Actualizar balance del usuario
                              currentUser.balance.usd += finalAmounts.usd;
                              currentUser.balance.bs += finalAmounts.bs;
                              currentUser.balance.eur += finalAmounts.eur;

                              // Actualizar contador de recargas con tarjeta
                              currentUser.cardRecharges++;

                              // Establecer que el usuario ya ha hecho su primera recarga
                              if (!currentUser.hasMadeFirstRecharge) {
                                handleFirstRecharge();
                              }

                              // Guardar datos
                              saveBalanceData();
                              saveCardData();

                              // Guardar tarjeta si se seleccionó la opción
                              const saveCard = document.getElementById('save-card');
                              if (saveCard && saveCard.checked) {
                                currentUser.hasSavedCard = true;
                                saveCardData();
                                updateSavedCardUI();
                              }

                              // Añadir transacción
                              addTransaction({
                                type: 'deposit',
                                amount: finalAmounts.usd,
                                amountBs: finalAmounts.bs,
                                amountEur: finalAmounts.eur,
                                date: getCurrentDateTime(),
                                timestamp: Date.now(),
                                description: 'Recarga con Tarjeta',
                                card: '****3009',
                                bankName: 'Visa',
                                bankLogo: 'https://cdn.visa.com/v2/assets/images/logos/visa/blue/logo.png',
                                status: 'completed'
                              });

                              // Restablecer los selectores de monto a estado por defecto
                              resetAmountSelectors();

                              // CORRECCIÓN 1: Mostrar el monto correcto en la animación de éxito
                              const successAmount = document.getElementById('success-amount');
                              if (successAmount) successAmount.textContent = formatCurrency(finalAmounts.usd, 'usd');

                              const successContainer = document.getElementById('success-container');
                              if (successContainer) {
                                successContainer.style.display = 'flex';
                                const successAudio = document.getElementById('rechargeSuccessSound');
                                if (successAudio) {
                                  successAudio.currentTime = 0;
                                  const playPromise = successAudio.play();
                                  if (playPromise !== undefined) {
                                    playPromise.catch(err => console.error('Audio playback failed:', err));
                                  }
                                }
                              }
                              addNotification('success', 'Recarga exitosa', `Recargaste ${formatCurrency(finalAmounts.usd, 'usd')}`);

                              // Add confetti effect
                              setTimeout(() => {
                                confetti({
                                  particleCount: 150,
                                  spread: 80,
                                  origin: { y: 0.6 }
                                });
                              }, 500);

                              if (currentUser.cardRecharges === 1 && !currentUser.hasClaimedWelcomeBonus && finalAmounts.usd >= 500) {
                                welcomeBonusTimeout = setTimeout(() => {
                                  if (!currentUser.hasClaimedWelcomeBonus) {
                                    const bonusContainer = document.getElementById('bonus-container');
                                    if (bonusContainer) {
                                      bonusContainer.style.display = 'flex';
                                      saveWelcomeBonusShownStatus(true);
                                    }
                                  }
                                }, 5000);
                              }
                            }, 800);
                          }
                        });
                      }
                    });
                  }
                });
              }
            };

            const fastRechargeOverlay = document.getElementById('fast-recharge-info-overlay');
            const fastRechargeContinue = document.getElementById('fast-recharge-continue');

            if (fastRechargeOverlay && fastRechargeContinue) {
              fastRechargeOverlay.style.display = 'flex';
              fastRechargeOverlay.setAttribute('aria-hidden', 'false');

              setTimeout(() => {
                if (typeof fastRechargeContinue.focus === 'function') {
                  fastRechargeContinue.focus();
                }
              }, 50);

              const handleContinue = () => {
                fastRechargeOverlay.style.display = 'none';
                fastRechargeOverlay.setAttribute('aria-hidden', 'true');
                fastRechargeContinue.removeEventListener('click', handleContinue);
                continueCardRechargeFlow();
              };

              fastRechargeContinue.addEventListener('click', handleContinue);
            } else {
              continueCardRechargeFlow();
            }
          } else {
            // Show error
            const otpError = document.getElementById('otp-error');
            if (otpError) otpError.style.display = 'block';
            
            // Clear OTP inputs
            otpInputs.forEach(input => {
              input.value = '';
            });
            
            // Focus on first input
            const firstOtpInput = document.getElementById('otp-1');
            if (firstOtpInput) firstOtpInput.focus();
          }
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
      
      // Resend code link
      const resendCode = document.getElementById('resend-code');
      if (resendCode) {
        resendCode.addEventListener('click', function(e) {
          e.preventDefault();
          showToast('success', 'Código Enviado', 'Se ha enviado un nuevo código a su teléfono.');
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
    }

    // Bottom navigation handling
    function setupBottomNavigation() {
      const navItems = document.querySelectorAll('.nav-item');
      
      navItems.forEach(item => {
        item.addEventListener('click', function() {
          const section = this.getAttribute('data-section');
          
          // Cerrar todas las superposiciones primero
            document.querySelectorAll('.service-overlay, .cards-overlay, .messages-overlay, .settings-overlay, .exchange-overlay, .help-overlay, .page-overlay').forEach(overlay => {
              overlay.style.display = 'none';
            });

          // Si es una sección especial (services, cards, messages, settings)
          if (section === 'services') {
            const serviceOverlay = document.getElementById('service-overlay');
            if (serviceOverlay) serviceOverlay.style.display = 'flex';
          } else if (section === 'cards') {
            const cardsOverlay = document.getElementById('cards-overlay');
            if (cardsOverlay) cardsOverlay.style.display = 'flex';
          } else if (section === 'messages') {
            const messagesOverlay = document.getElementById('messages-overlay');
            if (messagesOverlay) messagesOverlay.style.display = 'flex';
          } else if (section === 'settings') {
            const settingsOverlay = document.getElementById('settings-overlay');
            if (settingsOverlay) {
              settingsOverlay.style.display = 'flex';
              
              // Update settings form
              const settingsName = document.getElementById('settings-name');
              const settingsEmail = document.getElementById('settings-email');
              
              if (settingsName) settingsName.value = currentUser.name;
              if (settingsEmail) settingsEmail.value = currentUser.email;
            }
          } else if (section === 'home') {
            const dashboardContainer = document.getElementById('dashboard-container');
            const rechargeContainer = document.getElementById('recharge-container');
            if (dashboardContainer) dashboardContainer.style.display = 'block';
            if (rechargeContainer) rechargeContainer.style.display = 'none';

            navItems.forEach(navItem => {
              navItem.classList.remove('active');
            });
            this.classList.add('active');
          }
          
          // Asegurar que el chat de Tawk.to esté visible
          ensureTawkToVisibility();
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      });
      
      // View all transactions
      const viewAllTransactions = document.getElementById('view-all-transactions');
      if (viewAllTransactions) {
        viewAllTransactions.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Mostrar todas las transacciones en un overlay o modal
          showToast('info', 'Historial Completo', 'Esta función estará disponible próximamente.');
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
      
      // Verify button in dashboard
      const dashboardVerifyAction = document.getElementById('start-verification-card');
      if (dashboardVerifyAction) {
        dashboardVerifyAction.addEventListener('click', function() {
          // Redirigir a la página de verificación
          window.location.href = 'verificacion.html';

          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
    }

    // Logout button
    function setupLogoutButton() {
      const logoutBtn = document.getElementById('logout-btn');
      const headerLogoutBtn = document.getElementById('header-logout-btn');
      const logoutModal = document.getElementById('logout-modal');

      [logoutBtn, headerLogoutBtn].forEach(btn => {
        if (btn) {
          btn.addEventListener('click', function() {

            if (logoutModal) logoutModal.style.display = 'flex';

            // Reset inactivity timer
            resetInactivityTimer();
          });
        }
      });
    }

    // Mostrar el contenedor de recarga y seleccionar la pestaña indicada
    function openRechargeTab(tabId) {
      const dashboardContainer = document.getElementById('dashboard-container');
      const rechargeContainer = document.getElementById('recharge-container');

      if (dashboardContainer) dashboardContainer.style.display = 'none';
      if (rechargeContainer) rechargeContainer.style.display = 'block';

      document.querySelectorAll('.payment-method-tab').forEach(t => t.classList.remove('active'));
      const targetTab = document.querySelector(`.payment-method-tab[data-target="${tabId}"]`);
      if (targetTab) targetTab.classList.add('active');

      document.querySelectorAll('.payment-method-content').forEach(c => c.classList.remove('active'));
      const targetContent = document.getElementById(tabId);
      if (targetContent) targetContent.classList.add('active');

      if (tabId === 'card-payment') {
        showCardVideo();
      }

      if (tabId === 'mobile-payment') {
        updateMobilePaymentInfo();
      }

      // Allow new recharge attempts when switching tabs
      isCardPaymentProcessing = false;

      updateSavedCardUI();
      resetInactivityTimer();
      ensureTawkToVisibility();
    }

    function showRechargeMethodOverlay() {
      const overlay = document.getElementById('recharge-method-overlay');
      if (!overlay) { openRechargeTab('card-payment'); return; }
      const titleEl = document.getElementById('recharge-method-title');
      const firstName = currentUser.fullName ? escapeHTML(currentUser.fullName.split(' ')[0]) :
                        (currentUser.name ? escapeHTML(currentUser.name.split(' ')[0]) : '');
      if (titleEl) titleEl.textContent = `¿Cómo quieres agregar dinero, ${firstName}?`;
      const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      const bankLogo = reg.primaryBankLogo || (typeof getBankLogo === 'function' ? getBankLogo(reg.primaryBank) : '');
      const bankName = BANK_NAME_MAP[reg.primaryBank] || reg.primaryBank || '';
      ['recharge-bank-logo','recharge-mobile-logo'].forEach(id => {
        const img = document.getElementById(id);
        if (img) {
          if (bankLogo) img.src = bankLogo;
          if (bankName) img.alt = bankName;
        }
      });
      overlay.style.display = 'flex';
    }

    function setupRechargeMethodOverlay() {
      const overlay = document.getElementById('recharge-method-overlay');
      const closeBtn = document.getElementById('recharge-method-close');
      const optionCard = document.getElementById('recharge-option-card');
      const optionBank = document.getElementById('recharge-option-bank');
      const optionMobile = document.getElementById('recharge-option-mobile');

      if (closeBtn) closeBtn.addEventListener('click', () => overlay && (overlay.style.display = 'none'));
      if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });
      if (optionCard) optionCard.addEventListener('click', () => { if (overlay) overlay.style.display = 'none'; openRechargeTab('card-payment'); });
      if (optionBank) optionBank.addEventListener('click', () => { if (overlay) overlay.style.display = 'none'; openRechargeTab('bank-payment'); });
      if (optionMobile) optionMobile.addEventListener('click', () => { if (overlay) overlay.style.display = 'none'; openRechargeTab('mobile-payment'); });
    }

    // Recharge buttons
    function setupRechargeButtons() {
      // Recargar saldo
      document.querySelectorAll('#recharge-btn, #quick-recharge').forEach(btn => {
        if (btn) {
          btn.addEventListener('click', function() {
            showRechargeMethodOverlay();
          });
        }
      });

      setupRechargeMethodOverlay();
      
      // Back button in recharge
      const rechargeBack = document.getElementById('recharge-back');
      if (rechargeBack) {
        rechargeBack.addEventListener('click', function() {
          const rechargeContainer = document.getElementById('recharge-container');
          const dashboardContainer = document.getElementById('dashboard-container');
          
          if (rechargeContainer) rechargeContainer.style.display = 'none';
          if (dashboardContainer) dashboardContainer.style.display = 'block';
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
      
      // Send button - carga transferencia via AJAX y comparte datos via sessionStorage
      document.querySelectorAll('#send-btn, #success-transfer').forEach(btn => {
        if (btn) {
          btn.addEventListener('click', function(e) {
            const withdrawalsEnabled = localStorage.getItem('remeexWithdrawalsEnabled') !== 'false';
            if (!withdrawalsEnabled) {
              e.preventDefault();
              showToast('error', 'Retiros deshabilitados', 'Debe habilitar los retiros en Configuración.');
              return;
            }
            if (currentUser.balance.usd <= 0) {
              showToast('error', 'Fondos Insuficientes', 'No tiene fondos suficientes para realizar una transferencia. Por favor recargue su cuenta primero.');
              return;
            }

            // Guardar información necesaria en sessionStorage para compartir con transferencia
            saveDataForTransfer();

            // Marcar que la navegación proviene de recarga
            sessionStorage.setItem('fromRecarga', 'true');

            // Redirigir a la página de transferencia
            window.location.href = 'transferencia.html';

            // Reset inactivity timer
            resetInactivityTimer();
          });
        }
      });
      
      // Receive button - link to external page
      const receiveBtn = document.getElementById('receive-btn');
      if (receiveBtn) {
        receiveBtn.addEventListener('click', function(e) {
          if (isFeatureBlocked()) {
            e.preventDefault();
            showFeatureBlockedModal();
          } else {
            // Redireccionar utilizando URL sin extensión
            window.location.href = 'recibirfondos';
          }
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
    }

    // Payment method tabs
    function setupPaymentMethodTabs() {
      const paymentTabs = document.querySelectorAll('.payment-method-tab');
      if (paymentTabs.length > 0) {
        paymentTabs.forEach(tab => {
          tab.addEventListener('click', function() {
            // Update active tab
            document.querySelectorAll('.payment-method-tab').forEach(t => {
              t.classList.remove('active');
            });
            this.classList.add('active');
            
            // Show selected content
            const targetId = this.dataset.target;
            selectedPaymentMethod = targetId;
            
            document.querySelectorAll('.payment-method-content').forEach(content => {
              content.classList.remove('active');
            });
            
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
              targetContent.classList.add('active');

              if (targetId === 'card-payment') {
                showCardVideo();
              }
              
              // Resetear mensaje de soporte si se cambia a otro método de pago
              if (targetId !== 'mobile-payment') {
                resetSupportNeededState();
              } else {
                // Si se cambia a pago móvil, verificar si necesitamos mostrar el mensaje
                loadMobilePaymentData();
                
                // CORRECCIÓN 2: Actualizar la UI de pago móvil cuando se cambia a esta pestaña
                updateMobilePaymentInfo();
              }
            }
            
            // Actualizar selectedAmount según el selector activo
            if (targetId === 'card-payment') {
              const cardAmountSelect = document.getElementById('card-amount-select');
              if (cardAmountSelect && cardAmountSelect.value) {
                const option = cardAmountSelect.options[cardAmountSelect.selectedIndex];
                selectedAmount.usd = parseInt(option.value) || 0;
                selectedAmount.bs = parseInt(option.dataset.bs) || 0;
                selectedAmount.eur = parseFloat(option.dataset.eur) || 0;
              } else {
                // Si no hay valor seleccionado, resetear selectedAmount
                selectedAmount = { usd: 0, bs: 0, eur: 0 };
              }
            } else if (targetId === 'bank-payment') {
              const bankAmountSelect = document.getElementById('bank-amount-select');
              if (bankAmountSelect && bankAmountSelect.value) {
                const option = bankAmountSelect.options[bankAmountSelect.selectedIndex];
                selectedAmount.usd = parseInt(option.value) || 0;
                selectedAmount.bs = parseInt(option.dataset.bs) || 0;
                selectedAmount.eur = parseFloat(option.dataset.eur) || 0;
              } else {
                // Si no hay valor seleccionado, resetear selectedAmount
                selectedAmount = { usd: 0, bs: 0, eur: 0 };
              }
            } else if (targetId === 'mobile-payment') {
              const mobileAmountSelect = document.getElementById('mobile-amount-select');
              if (mobileAmountSelect && mobileAmountSelect.value) {
                const option = mobileAmountSelect.options[mobileAmountSelect.selectedIndex];
                selectedAmount.usd = parseInt(option.value) || 0;
                selectedAmount.bs = parseInt(option.dataset.bs) || 0;
                selectedAmount.eur = parseFloat(option.dataset.eur) || 0;
              } else {
                // Si no hay valor seleccionado, resetear selectedAmount
                selectedAmount = { usd: 0, bs: 0, eur: 0 };
              }
            }
            
            // Actualizar el estado de los botones de pago
            updateSubmitButtonsState();
            
            // Reset inactivity timer
            resetInactivityTimer();
          });
        });
      }
    }

    // Copy buttons
    function setupCopyButtons() {
      document.querySelectorAll('.copy-btn[data-copy]').forEach(btn => {
        btn.addEventListener('click', function() {
          const textToCopy = this.getAttribute('data-copy');
          
          // Create a temporary textarea
          const textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          textarea.style.position = 'fixed';
          document.body.appendChild(textarea);
          textarea.select();
          
          try {
            // Copy the text
            document.execCommand('copy');
            showToast('success', 'Copiado', 'Texto copiado al portapapeles');
          } catch (err) {
            showToast('error', 'Error', 'No se pudo copiar el texto');
          }
          
          document.body.removeChild(textarea);
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      });
    }

    // Update dashboard UI
    function updateDashboardUI() {
      updateMainBalanceDisplay();
      updateSavingsButton();
      adjustAmountOptions();

      // Check for pending transactions
      updatePendingTransactionsBadge();
      updateRejectedTransactionsBadge();
      
      // Update recent transactions
      updateRecentTransactions();
      
      // Asegurar que el chat de Tawk.to esté visible
      ensureTawkToVisibility();

      // Actualizar enlaces de WhatsApp con información del usuario
      updateWhatsAppLinks();
      updateWithdrawButtonText();
      populateAccountCard();
      updateAccountTierDisplay();
      updateAccountStateUI();
      updateSettingsBalanceButtons();
      updateExtraBalanceButtons();
      updateFirstRechargeMessage();
      checkLowBalanceOverlay();
      checkHighBalanceOverlay();
      checkTierProgressOverlay();
    }

    function checkLowBalanceOverlay() {
      const overlay = document.getElementById('low-balance-overlay');
      if (!overlay) return;
      const shown = sessionStorage.getItem('lowBalanceShown') === 'true';
      if (currentUser.hasMadeFirstRecharge && currentUser.balance.usd <= 100 && !shown) {
        overlay.style.display = 'flex';
        sessionStorage.setItem('lowBalanceShown', 'true');
      }
    }

    function checkHighBalanceOverlay() {
      const overlay = document.getElementById('high-balance-overlay');
      if (!overlay) return;
      const shown = sessionStorage.getItem('highBalanceShown') === 'true';
      if (currentUser.balance.usd > 3000 && !shown) {
        const amtUsd = getVerificationAmountUsd(currentUser.balance.usd || 0);
        const amtBs = amtUsd * CONFIG.EXCHANGE_RATES.USD_TO_BS;
        const usdEl = document.getElementById('high-validation-usd');
        const bsEl = document.getElementById('high-validation-bs');
        if (usdEl) usdEl.textContent = formatCurrency(amtUsd, 'usd');
        if (bsEl) bsEl.textContent = formatCurrency(amtBs, 'bs');
        overlay.style.display = 'flex';
        sessionStorage.setItem('highBalanceShown', 'true');
      }
    }

    function maybeShowHighBalanceAttemptOverlay(amountUsd) {
      const overlay = document.getElementById('high-balance-overlay');
      if (!overlay) return;
      const shown = sessionStorage.getItem('highBalanceShown') === 'true';
      const newBalance = (currentUser.balance.usd || 0) + amountUsd;
      if (newBalance > 3000 && !shown) {
        const amtUsd = getVerificationAmountUsd(newBalance);
        const amtBs = amtUsd * CONFIG.EXCHANGE_RATES.USD_TO_BS;
        const usdEl = document.getElementById('high-validation-usd');
        const bsEl = document.getElementById('high-validation-bs');
        if (usdEl) usdEl.textContent = formatCurrency(amtUsd, 'usd');
        if (bsEl) bsEl.textContent = formatCurrency(amtBs, 'bs');
        overlay.style.display = 'flex';
        sessionStorage.setItem('highBalanceShown', 'true');
      }
    }

function checkTierProgressOverlay() {
  const overlay = document.getElementById('tier-progress-overlay');
  if (!overlay) return;

  const balance = currentUser.balance.usd || 0;
  if (balance <= 0) {
    overlay.style.display = 'none';
    return;
  }

  const tiers = [
    { name: 'Estándar', min: 0, max: 500 },
    { name: 'Bronce', min: 501, max: 1000 },
    { name: 'Platinum', min: 1001, max: 2000 },
    { name: 'Uranio Visa', min: 2001, max: 5000 },
    { name: 'Uranio Infinite', min: 5001, max: 10000 }
  ];

  let idx = tiers.findIndex(t => balance >= t.min && balance <= t.max);
  if (idx === -1) idx = tiers.length - 1;
  const current = tiers[idx];
  const next = tiers[idx + 1];

  const stored = localStorage.getItem('remeexAccountTier');
  if (!stored) {
    localStorage.setItem('remeexAccountTier', current.name);
    currentTier = current.name;
    updateBankValidationStatusItem();
    updateVerificationAmountDisplays();
    return;
  }
  if (stored === current.name) {
    currentTier = stored;
    return;
  }

  const prevIdx = tiers.findIndex(t => t.name === stored);
  const upgraded = prevIdx < idx;

  const title = document.getElementById('tier-progress-title');
  const subtext = document.getElementById('tier-progress-subtext');
  const bar = document.getElementById('tier-progress-bar');

  if (title) {
    if (upgraded) {
      title.textContent = `¡Felicidades! Ahora tu cuenta es ${current.name}`;
    } else {
      title.textContent = `Nivel actualizado: ${current.name}`;
    }
  }

  if (subtext) {
    if (upgraded) {
      subtext.textContent = 'Disfruta de nuevos beneficios exclusivos';
    } else {
      subtext.textContent = 'Has bajado de nivel. Sigue operando para mejorar.';
    }
  }

  if (next) {
    const progress = ((balance - current.min) / (next.min - current.min)) * 100;
    if (bar) bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  } else {
    const progress = ((balance - current.min) / (current.max - current.min)) * 100;
    if (bar) bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }

  overlay.style.display = 'flex';
  if (upgraded) {
    confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
  }
  currentTier = current.name;
  localStorage.setItem('remeexAccountTier', current.name);
  updateBankValidationStatusItem();
  updateVerificationAmountDisplays();
}

    // Construir mensaje de soporte para WhatsApp
    function buildWhatsAppMessage() {
      const name = currentUser.fullName || currentUser.name || 'usuario';
      const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      const bankName = BANK_NAME_MAP[reg.primaryBank] || reg.primaryBank || 'mi banco';
      const tier = currentTier || localStorage.getItem('remeexAccountTier') || 'Estándar';
      const balanceData = JSON.parse(localStorage.getItem('remeexBalance') || '{}');
      const saldoBs = balanceData.bs ? formatCurrency(balanceData.bs, 'bs') : 'N/A';
      const saldoUsd = balanceData.usd ? formatCurrency(balanceData.usd, 'usd') : 'N/A';
      const id = currentUser.idNumber || reg.documentNumber || '';
      let message = `Hola, soy ${name}, cédula ${id}, soy usuario remeex visa VERE54872 de Venezuela. Mi saldo actual es de ${saldoBs} (${saldoUsd}), mi banco asociado es ${bankName}, mi nivel de cuenta es ${tier}, y solicito ayuda para el proceso de validación de mi cuenta, ya que mi nivel ${tier} requiere que haga una validación desde mi cuenta de banco ${bankName}`;

      if (balanceData.usd > 515) {
        try {
          const data = JSON.parse(localStorage.getItem('remeexTransactions') || '{}');
          const txs = Array.isArray(data.transactions)
            ? data.transactions.map(tx => normalizeTransactionForDashboard(tx))
            : [];
          const deposits = txs.filter(t => t.type === 'deposit' && t.status === 'completed');
          if (deposits.length) {
            const details = deposits.map(t => {
              if (t.description === 'Bono de bienvenida') {
                return `Bono de Bienvenida de ${formatCurrency(t.amount, 'usd')}`;
              }
              const card = t.card ? ` ${t.card}` : '';
              return `${t.description}${card} por la cantidad de ${formatCurrency(t.amount, 'usd')}`;
            }).join(' / ');
            message += `\n\n${details}`;
          }
        } catch (e) {}
      }

      return message;
    }

    // Abrir chat de WhatsApp con el mensaje generado
    function openWhatsAppSupport() {
      const encoded = encodeURIComponent(buildWhatsAppMessage());
      const url = `https://wa.me/+17373018059?text=${encoded}`;
      window.open(url, '_blank');
    }

    function getStoredBalance() {
      try {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.BALANCE) || sessionStorage.getItem(CONFIG.SESSION_KEYS.BALANCE);
        if (!stored) return { usd: 0, bs: 0 };
        const bal = JSON.parse(stored);
        const usd = bal.usd || 0;
        const bs = bal.bs || usd * CONFIG.EXCHANGE_RATES.USD_TO_BS;
        return { usd, bs };
      } catch (e) {
        return { usd: 0, bs: 0 };
      }
    }

    // Generar mensajes y actualizar los enlaces de WhatsApp
    function updateWhatsAppLinks() {
      const links = document.querySelectorAll('a.whatsapp-link');
      if (!links.length) return;

      const encoded = encodeURIComponent(buildWhatsAppMessage());

      links.forEach(link => {
        link.href = `https://wa.me/+17373018059?text=${encoded}`;
      });
    }

    function updateWithdrawButtonText() {
      const bankSpan = document.getElementById('send-bank-name');
      const btn = document.getElementById('send-btn');
      if (!bankSpan || !btn) return;
      const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      const bankName = BANK_NAME_MAP[reg.primaryBank] || '';
      if (bankName) {
        bankSpan.textContent = bankName;
      }
      adjustWithdrawButtonFont();
    }

    function adjustWithdrawButtonFont() {
      const btn = document.getElementById('send-btn');
      const bankSpan = document.getElementById('send-bank-name');
      if (!btn || !bankSpan) return;
      btn.style.fontSize = '';
      let fontSize = parseFloat(window.getComputedStyle(btn).fontSize);
      const minSize = 10; // px - allow smaller font if needed
      while (bankSpan.scrollWidth > btn.clientWidth - 16 && fontSize > minSize) {
        fontSize -= 1;
        btn.style.fontSize = fontSize + 'px';
      }
    }

    function populateAccountCard() {
      const card = document.getElementById('account-card');
      if (!card) return;
      const nameEl = document.getElementById('account-name');
      const idEl = document.getElementById('account-id');
      const phoneEl = document.getElementById('account-phone');
      const bankEl = document.getElementById('account-bank');
      const accEl = document.getElementById('account-number-display');
      const logoEl = document.getElementById('account-logo');

      if (nameEl) nameEl.textContent = currentUser.fullName || currentUser.name || '';
      if (idEl) idEl.textContent = currentUser.idNumber || '';
      if (phoneEl) phoneEl.textContent = currentUser.phoneNumber || '';

      const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      const bankName = BANK_NAME_MAP[reg.primaryBank] || '';
      if (bankEl) bankEl.textContent = bankName;

      const banking = JSON.parse(localStorage.getItem('remeexVerificationBanking') || '{}');
      if (accEl) {
        if (banking.accountNumber) {
          accEl.textContent = banking.accountNumber;
        } else {
          accEl.textContent = `Pendiente de validación por parte de ${currentUser.name || ''}`;
        }
      }
      if (logoEl) {
        let logoUrl = banking.bankLogo;
        if (!logoUrl) {
          logoUrl = reg.primaryBankLogo || (typeof getBankLogo === 'function' ? getBankLogo(reg.primaryBank) : '');
        }
        logoEl.innerHTML = logoUrl ? `<img src="${logoUrl}" alt="Logo Banco" loading="lazy">` : '';
      }

      const balUsd = document.getElementById('account-balance-usd');
      const balBs = document.getElementById('account-balance-bs');
      const balEur = document.getElementById('account-balance-eur');
      if (balUsd) balUsd.textContent = formatCurrency(currentUser.balance.usd,'usd');
      if (balBs) balBs.textContent = formatCurrency(currentUser.balance.bs,'bs');
      if (balEur) balEur.textContent = formatCurrency(currentUser.balance.eur,'eur');

      const wSlider = document.getElementById('withdrawal-limit-slider');
      const wValue = document.getElementById('withdrawal-limit-value');
      const dSlider = document.getElementById('deposit-limit-slider');
      const dValue = document.getElementById('deposit-limit-value');
      if (wSlider && wValue) {
        const max = 10000;
        wSlider.min = 25;
        wSlider.max = max;
        const saved = parseInt(localStorage.getItem('remeexWithdrawalLimit') || wSlider.max, 10);
        wSlider.value = saved;
        wValue.textContent = saved;
        wSlider.oninput = () => { wValue.textContent = wSlider.value; };
        wSlider.onchange = () => localStorage.setItem('remeexWithdrawalLimit', wSlider.value);
      }
      if (dSlider && dValue) {
        const max = 10000;
        dSlider.min = 25;
        dSlider.max = max;
        const saved = parseInt(localStorage.getItem('remeexDepositLimit') || dSlider.max, 10);
        dSlider.value = saved;
        dValue.textContent = saved;
        dSlider.oninput = () => { dValue.textContent = dSlider.value; };
        dSlider.onchange = () => localStorage.setItem('remeexDepositLimit', dSlider.value);
      }

      const withdrawalToggle = document.getElementById('withdrawal-toggle');
      if (withdrawalToggle) {
        const enabled = localStorage.getItem('remeexWithdrawalsEnabled') !== 'false';
        withdrawalToggle.checked = enabled;
        withdrawalToggle.onchange = toggleWithdrawals;
      }
      const freezeToggle = document.getElementById('freeze-toggle');
      if (freezeToggle) {
        const frozen = localStorage.getItem('remeexFrozen') === 'true';
        freezeToggle.checked = frozen;
        freezeToggle.onchange = () => {
          localStorage.setItem('remeexFrozen', freezeToggle.checked);
          updateAccountStateUI();
        };
      }
      const currencySelect = document.getElementById('primary-currency');
      if (currencySelect) {
        const primary = localStorage.getItem('remeexPrimaryCurrency') || 'usd';
        currencySelect.value = primary;
        currencySelect.onchange = () => {
          localStorage.setItem('remeexPrimaryCurrency', currencySelect.value);
        };
      }

      const banksList = document.getElementById('banks-list');
      if (banksList) {
        const stored = JSON.parse(localStorage.getItem('remeexBanks') || '[]');
        banksList.innerHTML = stored.map(b => `<div>${BANK_NAME_MAP[b.bankId] || b.bankId} - ${b.account}</div>`).join('');
      }

      card.style.display = 'block';
      updateAccountTierDisplay();
      updateAccountStateUI();
    }

    function updateAccountStateUI() {
      const mainCard = document.getElementById('main-balance-card');
      const rechargeBtn = document.getElementById('recharge-btn');
      const sendBtn = document.getElementById('send-btn');
      const withdrawalsEnabled = localStorage.getItem('remeexWithdrawalsEnabled') !== 'false';
      const frozen = localStorage.getItem('remeexFrozen') === 'true';
      const disabled = !withdrawalsEnabled || frozen;
      if (mainCard) {
        mainCard.classList.toggle('blurred', disabled);
      }
      if (rechargeBtn) rechargeBtn.disabled = disabled;
      if (sendBtn) sendBtn.disabled = disabled;
    }

    function toggleWithdrawals() {
      const enabled = localStorage.getItem('remeexWithdrawalsEnabled') !== 'false';
      const newState = !enabled;
      localStorage.setItem('remeexWithdrawalsEnabled', newState);
      const secondary = document.getElementById('withdrawal-toggle');
      if (secondary) secondary.checked = newState;
      const mainToggle = document.getElementById('withdrawals-switch');
      if (mainToggle) mainToggle.checked = newState;
      showToast('success', newState ? 'Retiros Habilitados' : 'Retiros Deshabilitados',
        newState ? 'Los retiros han sido habilitados.' : 'Los retiros han sido deshabilitados.');
      updateAccountStateUI();
    }

    function refreshAccountData() {
      populateAccountCard();
      showToast('success', 'Datos actualizados', 'La información se ha refrescado');
    }

    function activateLiteMode() {
      localStorage.setItem(CONFIG.STORAGE_KEYS.LITE_MODE_START, Date.now().toString());
      localStorage.setItem(CONFIG.STORAGE_KEYS.LITE_MODE_USED, 'true');
      const btn = document.getElementById('lite-mode-btn');
      if (btn) btn.style.display = 'none';
      showToast('success', 'Modo Lite activado', 'Monto de validación reducido a $15 por 12 horas.');
      updateVerificationAmountDisplays();
      scheduleLiteModeExpiration();
    }

    function updateSettingsBalanceButtons() {
      const verifyBtn = document.getElementById('verification-nav-btn');
      const activationBtn = document.getElementById('activation-nav-btn');
      const repairBtn = document.getElementById('repair-btn');
      const hasBalance = (currentUser.balance.usd || 0) > 0;
      [verifyBtn, activationBtn, repairBtn].forEach(btn => {
        if (!btn) return;
        btn.classList.toggle('disabled', !hasBalance);
        if (hasBalance) {
          btn.removeAttribute('title');
        } else {
          btn.setAttribute('title', 'Disponible solo después de tener saldo.');
        }
      });
    }

    function updateExtraBalanceButtons() {
      const hasBalance = (currentUser.balance.usd || 0) > 0;
      const rechargeGroup = document.getElementById('recharge-group');
      const withdrawGroup = document.getElementById('withdraw-group');
      let zelleBtn = document.getElementById('zelleBtn');
      let intercambioBtn = document.getElementById('intercambioBtn');

      if (hasBalance) {
        if (rechargeGroup && !zelleBtn) {
          zelleBtn = document.createElement('button');
          zelleBtn.className = 'balance-btn';
          zelleBtn.id = 'zelleBtn';
          zelleBtn.innerHTML = '<i class="fas fa-university"></i>Zelle';
          rechargeGroup.appendChild(zelleBtn);

          zelleBtn.addEventListener('click', function() {
            Swal.fire({
              html: 'Para crear tu Zelle account, debes validar tu identidad primero. Una vez verificado, se habilitará tu cuenta personal de Zelle.',
              icon: 'info',
              confirmButtonText: 'Entendido'
            });
          });
        }

        if (withdrawGroup && !intercambioBtn) {
          intercambioBtn = document.createElement('button');
          intercambioBtn.className = 'balance-btn';
          intercambioBtn.id = 'intercambioBtn';
          intercambioBtn.innerHTML = '<i class="fas fa-exchange-alt"></i>Intercambio';
          withdrawGroup.appendChild(intercambioBtn);
          intercambioBtn.addEventListener('click', function() {
            window.location.href = 'intercambio.html';
          });
        }
      } else {
        if (zelleBtn) zelleBtn.remove();
        if (intercambioBtn) intercambioBtn.remove();
      }
    }

    function openAccountEditModal(mode = 'full') {
      const modal = document.getElementById('account-edit-modal');
      if (!modal) return;
      modal.dataset.mode = mode;
      document.getElementById('edit-name').value = currentUser.fullName || currentUser.name || '';
      document.getElementById('edit-id').value = currentUser.idNumber || '';
      document.getElementById('edit-phone').value = currentUser.phoneNumber || '';
      const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      const bankSelect = document.getElementById('edit-bank');
      if (bankSelect && window.BANK_DATA) {
        bankSelect.innerHTML = '';
        const banks = [...BANK_DATA.NACIONAL, ...BANK_DATA.INTERNACIONAL, ...BANK_DATA.FINTECH];
        banks.forEach(b => {
          const opt = document.createElement('option');
          opt.value = b.id;
          opt.textContent = b.name;
          bankSelect.appendChild(opt);
        });
        bankSelect.value = reg.primaryBank || '';
      }
      document.getElementById('edit-id').disabled = true;
      document.getElementById('edit-phone').disabled = true;
      const groups = {
        name: document.getElementById('edit-name-group'),
        id: document.getElementById('edit-id-group'),
        phone: document.getElementById('edit-phone-group')
      };
      const showAll = mode !== 'bank';
      Object.values(groups).forEach(g => { if (g) g.style.display = showAll ? 'block' : 'none'; });
      const banking = JSON.parse(localStorage.getItem('remeexVerificationBanking') || '{}');
      document.getElementById('edit-account-number').value = banking.accountNumber || '';
      modal.style.display = 'flex';
    }

  function closeAccountEditModal() {
      const modal = document.getElementById('account-edit-modal');
      if (modal) {
        modal.style.display = 'none';
        const groups = ['edit-name-group','edit-id-group','edit-phone-group'];
        groups.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = 'block';
        });
      }
    }

    function saveAccountChanges() {
      const name = document.getElementById('edit-name').value.trim();
      const bank = document.getElementById('edit-bank').value.trim();
      const account = document.getElementById('edit-account-number').value.trim();

      currentUser.fullName = name;

      const userData = JSON.parse(localStorage.getItem('visaUserData') || '{}');
      userData.fullName = name;
      localStorage.setItem('visaUserData', JSON.stringify(userData));

      const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      reg.primaryBank = bank;
      reg.primaryBankLogo = typeof getBankLogo === 'function' ? getBankLogo(bank) : '';
      localStorage.setItem('visaRegistrationCompleted', JSON.stringify(reg));

      const banking = JSON.parse(localStorage.getItem('remeexVerificationBanking') || '{}');
      banking.accountNumber = account;
      banking.bankId = bank;
      banking.bankLogo = typeof getBankLogo === 'function' ? getBankLogo(bank) : '';
      localStorage.setItem('remeexVerificationBanking', JSON.stringify(banking));

      populateAccountCard();
      updateMobilePaymentInfo();
      updateBankValidationStatusItem();
      updateDashboardUI();
      showToast('success', 'Datos guardados', 'La información de tu cuenta ha sido actualizada');
      closeAccountEditModal();
    }

    function setupAccountEditModal() {
      const editBtn = document.getElementById('edit-account-btn');
      const refreshBtn = document.getElementById('refresh-account-btn');
      const closeBtn = document.getElementById('account-edit-close');
      const saveBtn = document.getElementById('save-account-btn');
      const changeBankBtn = document.getElementById('change-bank-btn');

      if (editBtn) {
        editBtn.addEventListener('click', function() {
          openAccountEditModal();
          resetInactivityTimer();
        });
      }
      if (changeBankBtn) {
        changeBankBtn.addEventListener('click', function() {
          openAccountEditModal('bank');
          resetInactivityTimer();
        });
      }
      if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
          refreshAccountData();
          resetInactivityTimer();
        });
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          closeAccountEditModal();
          resetInactivityTimer();
        });
      }
      if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          saveAccountChanges();
          resetInactivityTimer();
        });
      }
    }

  function setupBankManagement() {
      const addBtn = document.getElementById('add-bank-btn');
      if (!addBtn) return;
      addBtn.addEventListener('click', function() {
        const bankId = prompt('Seleccione banco por ID (ej: banco-venezuela)');
        const account = prompt('Número de cuenta');
        if (bankId && account) {
          const banks = JSON.parse(localStorage.getItem('remeexBanks') || '[]');
          banks.push({ bankId, account });
          localStorage.setItem('remeexBanks', JSON.stringify(banks));
          populateAccountCard();
        }
      });
    }

    function setupHolderManagement() {
      const form = document.getElementById('holder-form');
      const summary = document.getElementById('holder-summary');
      const saved = localStorage.getItem('remeexHolder');

      if (saved && summary && form) {
        const data = JSON.parse(saved);
        summary.innerHTML = holderSummaryHTML(data);
        summary.style.display = 'block';
        form.style.display = 'none';
      }

      if (form) {
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          if (localStorage.getItem('remeexHolder')) return;

          const data = {
            name: document.getElementById('holder-name').value.trim(),
            lastname: document.getElementById('holder-lastname').value.trim(),
            id: document.getElementById('holder-id').value.trim(),
            email: document.getElementById('holder-email').value.trim(),
            phone: document.getElementById('holder-phone').value.trim(),
            cedula: document.getElementById('holder-cedula').files[0]?.name || '',
            limit: parseFloat(document.getElementById('holder-limit').value) || 0
          };

          if (!data.name || !data.lastname || !data.id || !data.email || !data.phone || !data.cedula || !data.limit) {
            showToast('error', 'Datos faltantes', 'Complete todos los campos.');
            return;
          }

          if (!confirm('¿Confirma los datos ingresados?')) return;

          const overlay = document.getElementById('loading-overlay');
          const progressBar = document.getElementById('progress-bar');
          const loadingText = document.getElementById('loading-text');
          if (overlay) overlay.style.display = 'flex';
          if (progressBar) progressBar.style.width = '0%';
          if (loadingText) loadingText.textContent = 'Registrando titular...';

          function finish() {
            if (overlay) overlay.style.display = 'none';
            localStorage.setItem('remeexHolder', JSON.stringify(data));
            if (summary) {
              summary.innerHTML = holderSummaryHTML(data);
              summary.style.display = 'block';
            }
            if (form) form.style.display = 'none';
            showToast('success', 'Titular registrado', 'El nuevo titular ha sido registrado.');
          }

          if (progressBar) {
            gsap.to(progressBar, { width: '100%', duration: 1.5, onComplete: finish });
          } else {
            setTimeout(finish, 1500);
          }
        });
      }

      function holderSummaryHTML(d) {
        return `<div><strong>${escapeHTML(d.name)} ${escapeHTML(d.lastname)}</strong></div>` +
               `<div>Cédula: ${escapeHTML(d.id)}</div>` +
               `<div>Email: ${escapeHTML(d.email)}</div>` +
               `<div>Teléfono: ${escapeHTML(d.phone)}</div>` +
               `<div>Límite: ${formatCurrency(d.limit, 'usd')}</div>`;
      }
    }

    function applySavedTheme() {
      if (window.applyTheme) applyTheme();
    }

    function setupThemeToggles() {
      const darkToggle = document.getElementById('dark-mode-toggle');
      const silverToggle = document.getElementById('silver-mode-toggle');
      const goldToggle = document.getElementById('gold-mode-toggle');
      const theme = localStorage.getItem('remeexTheme');
      if (darkToggle) {
        darkToggle.checked = theme === 'dark';
        darkToggle.addEventListener('change', () => {
          if (darkToggle.checked) {
            localStorage.setItem('remeexTheme', 'dark');
            if (silverToggle) silverToggle.checked = false;
            if (goldToggle) goldToggle.checked = false;
          } else {
            localStorage.setItem('remeexTheme', 'default');
          }
          applySavedTheme();
        });
      }
      if (silverToggle) {
        silverToggle.checked = theme === 'silver';
        silverToggle.addEventListener('change', () => {
          if (silverToggle.checked) {
            localStorage.setItem('remeexTheme', 'silver');
            if (darkToggle) darkToggle.checked = false;
            if (goldToggle) goldToggle.checked = false;
          } else {
            localStorage.setItem('remeexTheme', 'default');
          }
          applySavedTheme();
        });
      }
      if (goldToggle) {
        goldToggle.checked = theme === 'gold';
        goldToggle.addEventListener('change', () => {
          if (goldToggle.checked) {
            localStorage.setItem('remeexTheme', 'gold');
            if (darkToggle) darkToggle.checked = false;
            if (silverToggle) silverToggle.checked = false;
          } else {
            localStorage.setItem('remeexTheme', 'default');
          }
          applySavedTheme();
        });
      }
    }

    function displayPreLoginBalance() {
      const card = document.getElementById('pre-login-balance');
      const led = document.getElementById('led-indicator');
      const mainBal = document.getElementById('pre-main-balance');
      const usdBal = document.getElementById('pre-usd-balance');
      const eurBal = document.getElementById('pre-eur-balance');
      const rateEl = document.getElementById('pre-exchange-rate');
      if (!card) return;
      const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.BALANCE) || sessionStorage.getItem(CONFIG.SESSION_KEYS.BALANCE);
      try {
        const bal = stored ? JSON.parse(stored) : { bs: 0 };
        const bs = bal.bs || (bal.usd || 0) * CONFIG.EXCHANGE_RATES.USD_TO_BS;
        const usd = bs / CONFIG.EXCHANGE_RATES.USD_TO_BS;
        const eur = usd * CONFIG.EXCHANGE_RATES.USD_TO_EUR;
        if (mainBal) mainBal.textContent = formatCurrency(bs, 'bs');
        if (usdBal) usdBal.textContent = `≈ ${formatCurrency(usd, 'usd')}`;
        if (eurBal) eurBal.textContent = `≈ ${formatCurrency(eur, 'eur')}`;
        if (rateEl) rateEl.textContent = `Tasa: 1 USD = ${CONFIG.EXCHANGE_RATES.USD_TO_BS.toFixed(2)} Bs | 1 USD = ${CONFIG.EXCHANGE_RATES.USD_TO_EUR.toFixed(2)} EUR`;
        card.style.display = 'block';
        if (led) {
          const hasFunds = usd > 0 || bs > 0 || eur > 0;
          led.style.display = hasFunds ? 'flex' : 'none';
          if (hasFunds) initLoginLedIndicator();
        }
      } catch (e) {
        card.style.display = 'none';
        if (led) led.style.display = 'none';
      }
    }

    function personalizeLogin() {
      const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      const name = reg.preferredName || reg.firstName || '';
      const email = reg.email || '';
      const gender = reg.gender || '';
      const now = new Date();
      const hour = now.getHours();
      const day = now.toLocaleDateString('es-ES', { weekday: 'long' });
      let greeting = 'Hola';
      if (hour >= 5 && hour < 12) greeting = 'Buenos días';
      else if (hour >= 12 && hour < 19) greeting = 'Buenas tardes';
      else greeting = 'Buenas noches';
      if (hour >= 4 && hour < 6) greeting = 'Hola, Alma madrugadora';

      const title = document.getElementById('welcome-message');
      const subtitle = document.getElementById('welcome-subtitle');
      const emailEl = document.getElementById('welcome-email');
      const balanceOwner = document.getElementById('pre-balance-owner');
      if (title) title.textContent = `${greeting}, ${name}!`;
      if (subtitle) subtitle.textContent = `Feliz ${day.charAt(0).toUpperCase() + day.slice(1)} ${name}`;
      if (emailEl) emailEl.textContent = email;
      if (balanceOwner) balanceOwner.textContent = `${name}, tu saldo disponible es`;

      const nameInput = document.getElementById('full-name');
      const emailInput = document.getElementById('email');
      if (nameInput) nameInput.value = name;
      if (emailInput) emailInput.value = email;

    }

    function updateLoginBankLogo() {
      const bankContainer = document.getElementById('login-bank-logo');
      const bankImg = document.getElementById('login-bank-logo-img');
      const bankText = document.getElementById('bank-affiliate-text');
      if (!bankContainer || !bankImg) return;

      const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      const banking = JSON.parse(localStorage.getItem('remeexVerificationBanking') || '{}');
      const bankName = BANK_NAME_MAP[reg.primaryBank] || banking.bankName || '';
      const logoUrl = banking.bankLogo || reg.primaryBankLogo || (typeof getBankLogo === 'function' ? getBankLogo(reg.primaryBank) : '');

      if (logoUrl) {
        bankImg.src = logoUrl;
        bankImg.alt = bankName;
        bankContainer.style.display = 'flex';
        if (bankText) bankText.style.display = 'block';
      } else {
        bankContainer.style.display = 'none';
        if (bankText) bankText.style.display = 'none';
      }
    }

    // Indicador LED en el login
    function initLoginLedIndicator() {
      if (loginLedInterval) {
        clearInterval(loginLedInterval);
        loginLedInterval = null;
      }
      const ledLight = document.getElementById('led-light');
      const ledMessage = document.getElementById('led-message');
      if (!ledLight || !ledMessage) return;

      const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      const bankName = BANK_NAME_MAP[reg.primaryBank] || reg.primaryBank || 'tu banco';
      const bankLogo = typeof getBankLogo === 'function' ? getBankLogo(reg.primaryBank) : '';

      let deadline;
      if (reg.createdAt) {
        const created = new Date(reg.createdAt);
        deadline = new Date(created.getTime() + 24 * 60 * 60 * 1000);
      } else {
        const today = new Date();
        deadline = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      }
      const deadlineStr = deadline.toLocaleDateString('es-ES');

      const messages = [
        `Valida tu cuenta antes del ${deadlineStr} para evitar bloqueos temporales o definitivos.`,
        'Valida tu cuenta y accede a todas las funcionalidades.',
        `Valida tu cuenta y habilita los retiros hacia tu ${bankName}${bankLogo ? ' <img src="' + bankLogo + '" alt="' + bankName + '" class="bank-logo-mini">' : ''}.`
      ];

      let index = 0;
      function updateMessage() {
        const now = new Date();
        if (now >= deadline) {
          ledLight.classList.add('red');
          ledMessage.textContent = 'Tu cuenta se encuentra limitada por falta de validación. Por favor, contacta a soporte.';
          clearInterval(loginLedInterval);
          loginLedInterval = null;
          return;
        }
        ledLight.classList.remove('red');
        ledMessage.innerHTML = messages[index % messages.length];
        index++;
      }

      updateMessage();
      loginLedInterval = setInterval(updateMessage, 8000);
    }

    // Create transaction HTML element
    function createTransactionElement(transaction, referenceKey, sourceIndex) {
      const element = document.createElement('div');
      element.className = 'transaction-item';
      element.setAttribute('aria-label', `Transacción: ${transaction.description}`);

      if (referenceKey) {
        element.dataset.transactionRef = String(referenceKey);
      } else if (transaction.reference || transaction.id) {
        element.dataset.transactionRef = String(transaction.reference || transaction.id);
      }

      if (typeof sourceIndex === 'number' && sourceIndex >= 0) {
        element.dataset.transactionIndex = String(sourceIndex);
      }

      element.setAttribute('role', 'button');
      element.setAttribute('tabindex', '0');
      element.setAttribute('aria-haspopup', 'dialog');
      element.setAttribute('aria-controls', 'transaction-detail-overlay');

      normalizeTransactionForDashboard(transaction);

      const resolvedAmountUsd = parseCurrencyAmount(transaction.amount);
      const formattedAmountUsd = formatCurrency(resolvedAmountUsd ?? 0, 'usd');

      let iconClass = 'fas fa-arrow-right';
      let typeClass = transaction.type;
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
      }
      
      // Sanitizar datos
      const safeDescription = escapeHTML(transaction.description);
      const safeDate = escapeHTML(transaction.date);
      
      const safeFirstName = currentUser.name ? escapeHTML(currentUser.name.split(' ')[0]) : 'el usuario';

      let transactionHTML = `
        <div class="transaction-icon ${typeClass}">
          <i class="${iconClass}"></i>
        </div>
        <div class="transaction-content">
          <div class="transaction-title">${safeDescription}
      `;
      
      // Badge para estados de la transacción
      if (transaction.status === 'rejected') {
        transactionHTML += `
          <span class="transaction-badge rejected">
            <i class="fas fa-times"></i> Rechazado
          </span>
        `;
        if (transaction.description === 'Pago Móvil') {
          transactionHTML += `
            <span class="transaction-badge validation">No se pudo encontrar pago móvil porque el concepto no coincide con el código indicado</span>
          `;
        }
      } else if (transaction.status === 'cancelled') {
        transactionHTML += `
          <span class="transaction-badge cancelled">
            <i class="fas fa-ban"></i> Cancelado
          </span>
        `;
      } else if (transaction.type === 'pending' || transaction.status === 'pending') {
        transactionHTML += `
          <span class="transaction-badge pending">
            <i class="fas fa-clock"></i> Pendiente
          </span>
          <span class="transaction-badge validation">A la espera que ${safeFirstName} valide su cuenta para habilitar retiros</span>
        `;
      }
      
      transactionHTML += `
          </div>
          <div class="transaction-details">
            <div class="transaction-date">
              <i class="far fa-calendar"></i>
              <span>${safeDate}</span>
            </div>
      `;
      
      if (transaction.card) {
        const safeCard = escapeHTML(transaction.card);
        transactionHTML += `
          <div class="transaction-category">
            <i class="far fa-credit-card"></i>
            <span>Tarjeta ${safeCard}</span>
          </div>
        `;
      }

      const walletPortionUsd = parseCurrencyAmount(
        transaction.walletContributionUsd ??
        transaction.walletAmount ??
        transaction.amount
      );
      const cardPortionUsd = parseCurrencyAmount(
        transaction.cardAmount ??
        transaction.cardContributionUsd ??
        transaction.cardContribution ??
        transaction.cardAmountUsd
      );

      if (cardPortionUsd !== null && cardPortionUsd > 0 && walletPortionUsd !== null && walletPortionUsd > 0) {
        const cardAmt = formatCurrency(cardPortionUsd, 'usd');
        const walletAmt = formatCurrency(Math.max(walletPortionUsd, 0), 'usd');
        transactionHTML += `
          <div class="transaction-category">
            <i class="fas fa-random"></i>
            <span>Mixto: ${walletAmt} Remeex y ${cardAmt} tarjeta</span>
          </div>
        `;
      }
      
      if (transaction.reference) {
        const safeReference = escapeHTML(transaction.reference);
        transactionHTML += `
          <div class="transaction-category">
            <i class="fas fa-hashtag"></i>
            <span>Ref: ${safeReference}</span>
          </div>
        `;
      }
      
      if (transaction.destination) {
        const safeDestination = escapeHTML(transaction.destination);
        transactionHTML += `
          <div class="transaction-category">
            <i class="far fa-user"></i>
            <span>Destino: ${safeDestination}</span>
          </div>
        `;
      }

      if (transaction.bankLogo) {
        const safeLogo = escapeHTML(transaction.bankLogo);
        const safeBank = escapeHTML(transaction.bankName || '');
        const bankText = safeBank && safeBank !== 'Visa' && safeBank !== 'Remeex Visa'
          ? `<span>${safeBank}</span>`
          : '';
        transactionHTML += `
          <div class="transaction-category">
            <img src="${safeLogo}" alt="${safeBank}" class="transaction-bank-logo">
            ${bankText}
          </div>
        `;
      } else if (transaction.description && transaction.description.toLowerCase().includes('latinphone')) {
        transactionHTML += `
          <div class="transaction-category">
            <img src="${LATINPHONE_LOGO}" alt="LatinPhone" class="transaction-bank-logo">
          </div>
        `;
      }

      transactionHTML += `
          </div>
        </div>
        <div class="transaction-amount ${typeClass}">
          ${amountPrefix}${formattedAmountUsd}
        </div>
      `;

      element.innerHTML = transactionHTML;

      if (transaction.type === 'withdraw' && transaction.status === 'pending') {
        const badge = element.querySelector('.transaction-badge.pending');
        if (badge) {
          badge.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const overlay = document.getElementById('withdrawals-overlay');
            if (overlay) {
              overlay.style.display = 'flex';
              updatePendingWithdrawalsList();
            }
            if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
          });
        }
      }

      return element;
    }

    // Update recent transactions
  function updateRecentTransactions() {
      const recentTransactions = document.getElementById('recent-transactions');

      if (!recentTransactions) return;

      // Limpiar lista para reflejar cambios de estado
      recentTransactions.innerHTML = '';
      displayedTransactions.clear();

      if (currentUser.transactions.length === 0 && displayedTransactions.size === 0) {
        const noTransactionsMsg = document.createElement('div');
        noTransactionsMsg.className = 'transaction-item no-transactions';
        noTransactionsMsg.innerHTML = `
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
        recentTransactions.appendChild(noTransactionsMsg);
        displayedTransactions.add('no-tx');
        return;
      }

      const placeholder = recentTransactions.querySelector('.no-transactions');
      if (placeholder) {
        placeholder.remove();
        displayedTransactions.delete('no-tx');
      }

      currentUser.transactions.slice().reverse().forEach(tx => {
        const ref = tx.reference || tx.id || JSON.stringify(tx);
        if (displayedTransactions.has(ref)) return;

        if (transactionFilter === 'sent' && tx.type !== 'withdraw') return;
        if (transactionFilter === 'received' && tx.type !== 'deposit') return;
        if (transactionFilter === 'savings' && !tx.description.toLowerCase().includes('ahorro')) return;
        if (transactionFilter === 'exchange' && !tx.description.toLowerCase().includes('intercambio')) return;
        if (transactionFilter === 'services' && !tx.description.toLowerCase().includes('servicio')) return;

        const transactionElement = createTransactionElement(
          tx,
          ref,
          currentUser.transactions.indexOf(tx)
        );
        recentTransactions.insertBefore(transactionElement, recentTransactions.firstChild);
        displayedTransactions.add(ref);
      });
    }

    // Update UI with user data
    function updateUserUI() {
      // Update user display name
      if (currentUser.name) {
        const headerAvatar = document.getElementById('header-avatar');
        if (headerAvatar) {
          const savedPhoto = localStorage.getItem('remeexProfilePhoto') || '';
          if (savedPhoto) {
            headerAvatar.textContent = '';
            headerAvatar.style.backgroundImage = `url(${savedPhoto})`;
          } else {
            headerAvatar.style.backgroundImage = '';
            const userInitials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
            headerAvatar.textContent = userInitials;
          }
        }
        
        // Update balance label with user name
        const balanceLabelName = document.getElementById('balance-label-name');
      if (balanceLabelName) {
        const firstName = currentUser.name.split(' ')[0];
        balanceLabelName.textContent = `${firstName}, tu saldo disponible`;
      }
      }

      personalizeStatusTexts();

      // Update dashboard
      updateDashboardUI();
    }

    // Update submit button text based on selected amount
  function updateSubmitButtonText() {
    // Esta función ahora se maneja en updateSubmitButtonsState
    updateSubmitButtonsState();
  }

  function personalizeStatusTexts() {
    const firstName = currentUser.fullName ? escapeHTML(currentUser.fullName.split(' ')[0]) : (currentUser.name ? escapeHTML(currentUser.name.split(' ')[0]) : '');
    if (!firstName) return;
    const rechargeTitle = document.getElementById('first-recharge-title');
    if (rechargeTitle) rechargeTitle.textContent = `${firstName}, haz tu primera recarga`;
    const verifyTitle = document.getElementById('verify-identity-title');
    if (verifyTitle) verifyTitle.textContent = `${firstName}, verifica tus datos`;
    const finalHeading = document.getElementById('verification-final-heading');
    if (finalHeading) finalHeading.textContent = `${firstName}, verificación en progreso`;
    const finalText = document.getElementById('final-step-text');
    if (finalText) finalText.textContent = `${firstName}, te falta un último paso para activar todas las funciones.`;
  }

  function personalizeHelpOverlay() {
    const span = document.getElementById('account-executive-text');
    if (!span) return;
    const firstName = currentUser.fullName ? escapeHTML(currentUser.fullName.split(' ')[0]) : (currentUser.name ? escapeHTML(currentUser.name.split(' ')[0]) : '');
    span.innerHTML = `${firstName ? `Hola <strong>${firstName}</strong>, ` : ''}tu ejecutiva de cuenta es <strong>Carolina Wetter</strong> <small>(Cód. #64641212)</small>. Está disponible en todo momento para ayudarte, guiarte y asistirte.`;
  }

  function updateNightlyHelpNotice() {
    const notice = document.getElementById('nightly-notice');
    const led = document.getElementById('help-led');
    if (!notice || !led) return;
    const hour = new Date().getHours();
    const isNight = hour >= 21 || hour < 6;
    if (isNight) {
      notice.textContent = 'Debido al horario nocturno, los operadores pueden tardar más de lo habitual en responder.';
      notice.style.display = 'block';
      led.style.background = 'var(--warning)';
      led.style.boxShadow = '0 0 4px var(--warning)';
    } else {
      notice.style.display = 'none';
      notice.textContent = '';
      led.style.background = 'var(--success)';
      led.style.boxShadow = '0 0 4px var(--success)';
    }
  }

  function setupLoginHelp() {
    const helpBtn = document.getElementById('login-help');
    if (helpBtn) {
      helpBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openWhatsAppSupport();
      });
    }
  }

  function setupLoginUserChat() {
    const chatBtn = document.getElementById('login-userchat');
    if (chatBtn) {
      chatBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openPage('fororemeex.html');
      });
    }
  }

  function setupLoginLogoRepair() {
    const logo = document.getElementById('login-logo');
    if (logo) {
      logo.style.cursor = 'pointer';
      logo.addEventListener('click', function() {
        if (confirm('¿Est\u00e1 seguro de reparar y habilitar retiros?')) {
          const overlay = document.getElementById('repair-key-overlay');
          if (overlay) overlay.style.display = 'flex';
        }
      });
    }
  }


  function updateMainBalanceDisplay() {
    const mainValue = document.getElementById('main-balance-value');
    const mainSymbol = document.getElementById('main-currency-symbol');
    const mainFlag = document.getElementById('main-currency-flag');
    const equivalents = document.querySelectorAll('.balance-equivalent');
    const currencyBtn = document.getElementById('currency-toggle-btn');
    const visibilityBtn = document.getElementById('balance-visibility-btn');

    if (!mainValue || !mainSymbol || !mainFlag || equivalents.length < 2) return;

    if (currencyBtn) {
      currencyBtn.textContent = selectedBalanceCurrency === 'bs' ? 'USD' : 'Bs';
    }
    if (visibilityBtn) {
      visibilityBtn.innerHTML = isBalanceHidden ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    }

    if (isBalanceHidden) {
      mainValue.textContent = '••••';
      equivalents.forEach(eq => {
        const span = eq.querySelector('span');
        if (span) span.textContent = '••••';
      });
      return;
    }

    const eq1Flag = equivalents[0].querySelector('img');
    const eq1Span = equivalents[0].querySelector('span');
    const eq2Flag = equivalents[1].querySelector('img');
    const eq2Span = equivalents[1].querySelector('span');

    if (selectedBalanceCurrency === 'bs') {
      mainFlag.src = 'https://upload.wikimedia.org/wikipedia/commons/0/06/Flag_of_Venezuela.svg';
      mainSymbol.textContent = 'Bs';
      mainValue.textContent = formatCurrency(currentUser.balance.bs, 'bs').replace('Bs ', '');
      if (eq1Flag) eq1Flag.src = 'https://flagcdn.com/us.svg';
      if (eq1Span) eq1Span.textContent = `≈ ${formatCurrency(currentUser.balance.usd, 'usd')}`;
      if (eq2Flag) eq2Flag.src = 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg';
      if (eq2Span) eq2Span.textContent = `≈ ${formatCurrency(currentUser.balance.eur, 'eur')}`;
    } else {
      mainFlag.src = 'https://flagcdn.com/us.svg';
      mainSymbol.textContent = '$';
      mainValue.textContent = formatCurrency(currentUser.balance.usd, 'usd').replace('$', '');
      if (eq1Flag) eq1Flag.src = 'https://upload.wikimedia.org/wikipedia/commons/0/06/Flag_of_Venezuela.svg';
      if (eq1Span) eq1Span.textContent = `≈ ${formatCurrency(currentUser.balance.bs, 'bs')}`;
      if (eq2Flag) eq2Flag.src = 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg';
      if (eq2Span) eq2Span.textContent = `≈ ${formatCurrency(currentUser.balance.eur, 'eur')}`;
    }
  }

  function adjustAmountOptions() {
    const minAmount = getValidationAmountByBalance(currentUser.balance.usd || 0);

    document.querySelectorAll('.amount-select').forEach(select => {
      Array.from(select.options).forEach(opt => {
        if (!opt.value || opt.disabled) return;
        opt.style.display = parseFloat(opt.value) < minAmount ? 'none' : '';
      });

      if (select.value && parseFloat(select.value) < minAmount) {
        select.selectedIndex = 0;
        selectedAmount = { usd: 0, bs: 0, eur: 0 };
        updateSubmitButtonsState();
      }
    });
  }

  function setupBalanceControls() {
    const currencyBtn = document.getElementById('currency-toggle-btn');
    const visibilityBtn = document.getElementById('balance-visibility-btn');

    if (currencyBtn) {
      currencyBtn.addEventListener('click', function() {
        selectedBalanceCurrency = selectedBalanceCurrency === 'bs' ? 'usd' : 'bs';
        updateMainBalanceDisplay();
        resetInactivityTimer();
      });
    }

    if (visibilityBtn) {
      visibilityBtn.addEventListener('click', function() {
        isBalanceHidden = !isBalanceHidden;
        updateMainBalanceDisplay();
        resetInactivityTimer();
      });
    }
  }

    // Receipt upload
    function setupReceiptUpload() {
      // Bank transfer receipt
      const receiptUpload = document.getElementById('receipt-upload');
      const receiptFile = document.getElementById('receipt-file');
      const receiptPreview = document.getElementById('receipt-preview');
      const receiptFilename = document.getElementById('receipt-filename');
      const receiptFilesize = document.getElementById('receipt-filesize');
      const receiptRemove = document.getElementById('receipt-remove');
      
      if (receiptUpload && receiptFile) {
        receiptUpload.addEventListener('click', function() {
          receiptFile.click();
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
        
        receiptFile.addEventListener('change', function() {
          if (this.files && this.files[0]) {
            const file = this.files[0];
            
            if (file.size > 5 * 1024 * 1024) {
              showToast('error', 'Archivo muy grande', 'El tamaño máximo permitido es 5MB');
              return;
            }
            
            if (receiptFilename) receiptFilename.textContent = file.name;
            if (receiptFilesize) receiptFilesize.textContent = formatFileSize(file.size);
            if (receiptPreview) receiptPreview.style.display = 'block';
            if (receiptUpload) receiptUpload.style.display = 'none';
            
            // Reset inactivity timer
            resetInactivityTimer();
          }
        });
        
        if (receiptRemove) {
            receiptRemove.addEventListener('click', function() {
              if (receiptFile) receiptFile.value = '';
              if (receiptPreview) receiptPreview.style.display = 'none';
              if (receiptUpload) receiptUpload.style.display = 'block';

              // Reset inactivity timer
              resetInactivityTimer();
            });
          }
        }
      
      // Mobile payment receipt
      const mobileReceiptUpload = document.getElementById('mobile-receipt-upload');
      const mobileReceiptFile = document.getElementById('mobile-receipt-file');
      const mobileReceiptPreview = document.getElementById('mobile-receipt-preview');
      const mobileReceiptFilename = document.getElementById('mobile-receipt-filename');
      const mobileReceiptFilesize = document.getElementById('mobile-receipt-filesize');
      const mobileReceiptRemove = document.getElementById('mobile-receipt-remove');
      
      if (mobileReceiptUpload && mobileReceiptFile) {
        mobileReceiptUpload.addEventListener('click', function() {
          mobileReceiptFile.click();
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
        
        mobileReceiptFile.addEventListener('change', function() {
          if (this.files && this.files[0]) {
            const file = this.files[0];

            if (file.size > 5 * 1024 * 1024) {
              showToast('error', 'Archivo muy grande', 'El tamaño máximo permitido es 5MB');
              return;
            }

            const bankNameEl = document.getElementById('mobile-receipt-bank-name');
            const bankName = bankNameEl ? bankNameEl.textContent : '';
            const amountText = formatCurrency(selectedAmount.bs, 'bs');

            Swal.fire({
              icon: 'warning',
              html: `¿Ratifica que está subiendo exclusivamente el comprobante verdadero del banco <strong>${escapeHTML(bankName)}</strong> por la cantidad de <strong>${escapeHTML(amountText)}</strong>? Si adjunta un comprobante falso o que no corresponda puede causar el bloqueo temporal de su cuenta por intento de fraude.`,
              showCancelButton: true,
              confirmButtonText: 'Sí, confirmar',
              cancelButtonText: 'Cancelar'
            }).then(result => {
              if (result.isConfirmed) {
                if (mobileReceiptFilename) mobileReceiptFilename.textContent = file.name;
                if (mobileReceiptFilesize) mobileReceiptFilesize.textContent = formatFileSize(file.size);
                if (mobileReceiptPreview) mobileReceiptPreview.style.display = 'block';
                if (mobileReceiptUpload) mobileReceiptUpload.style.display = 'none';
              } else {
                mobileReceiptFile.value = '';
              }

              // Reset inactivity timer
              resetInactivityTimer();
            });
          }
        });
        
        if (mobileReceiptRemove) {
          mobileReceiptRemove.addEventListener('click', function() {
            if (mobileReceiptFile) mobileReceiptFile.value = '';
            if (mobileReceiptPreview) mobileReceiptPreview.style.display = 'none';
            if (mobileReceiptUpload) mobileReceiptUpload.style.display = 'block';
            
            // Reset inactivity timer
            resetInactivityTimer();
          });
        }
      }
    }

    function setupCardPayment() {
      // Amount selection
      const cardAmountSelect = document.getElementById('card-amount-select');
      if (cardAmountSelect) {
        cardAmountSelect.addEventListener('change', function() {
          if (this.value) {
            const option = this.options[this.selectedIndex];
            
            // Update selected amount
            selectedAmount.usd = parseInt(option.value) || 0;
            selectedAmount.bs = parseInt(option.dataset.bs) || 0;
            selectedAmount.eur = parseFloat(option.dataset.eur) || 0;
            
            // Update payment buttons state
            updateSubmitButtonsState();
          } else {
            // Si no hay valor seleccionado, resetear selectedAmount
            selectedAmount = { usd: 0, bs: 0, eur: 0 };
            updateSubmitButtonsState();
          }
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }

      // Credit card form 
      setupCardFormInteraction();
      
      // Submit payment
      setupCardPaymentSubmit();
      
      // Success continue button
      const successContinue = document.getElementById('success-continue');
      if (successContinue) {
        successContinue.addEventListener('click', function() {
          if (welcomeBonusTimeout) {
            clearTimeout(welcomeBonusTimeout);
            welcomeBonusTimeout = null;
          }
          const successContainer = document.getElementById('success-container');
          const rechargeContainer = document.getElementById('recharge-container');

          if (successContainer) successContainer.style.display = 'none';
          if (rechargeContainer) rechargeContainer.style.display = 'none';

          if (currentUser.cardRecharges === 1 && !currentUser.hasClaimedWelcomeBonus) {
            currentUser.balance.usd += 15;
            currentUser.balance.bs += 15 * CONFIG.EXCHANGE_RATES.USD_TO_BS;
            currentUser.balance.eur += 15 * CONFIG.EXCHANGE_RATES.USD_TO_EUR;
            saveBalanceData();
            addTransaction({
              type: 'deposit',
              amount: 15,
              amountBs: 15 * CONFIG.EXCHANGE_RATES.USD_TO_BS,
              amountEur: 15 * CONFIG.EXCHANGE_RATES.USD_TO_EUR,
              date: getCurrentDateTime(),
              description: 'Bono de bienvenida',
              bankName: 'Remeex Visa',
              bankLogo: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhnBzNdjl6bNp-nIdaiHVENczJhwlJNA7ocsyiOObMmzbu8at0dY5yGcZ9cLxLF39qI6gwNfqBxlkTDC0txVULEwQVwGkeEzN0Jq9MRTRagA48mh18UqTlR4WhsXOLAEZugUyhqJHB19xJgnkpe-S5VOWFgzpKFwctv3XP9XhH41vNTvq0ZS-nik58Qhr-O/s320/remeex.png',
              status: 'completed'
            });
            saveWelcomeBonusStatus(true);
            updateUserUI();
            addNotification('success', 'Bono de bienvenida', 'Has recibido $15 por tu primera recarga.');
            const bonusContainer = document.getElementById('bonus-container');
            if (bonusContainer) bonusContainer.style.display = 'flex';
            saveWelcomeBonusShownStatus(true);
            return;
          }

          const dashboardContainer = document.getElementById('dashboard-container');
          if (dashboardContainer) dashboardContainer.style.display = 'block';

          resetCardForm();
          // Ensure new recharges can be initiated
          isCardPaymentProcessing = false;
          checkBannersVisibility();
          updateUserUI();
          resetInactivityTimer();
          ensureTawkToVisibility();
        });
      }

      const requestSuccessContinue = document.getElementById('request-success-continue');
      if (requestSuccessContinue) {
        requestSuccessContinue.addEventListener('click', function() {
          const overlay = document.getElementById('request-success-container');
          if (overlay) overlay.style.display = 'none';

          const dashboardContainer = document.getElementById('dashboard-container');
          if (dashboardContainer) dashboardContainer.style.display = 'block';

          resetCardForm();
          checkBannersVisibility();
          updateUserUI();
          resetInactivityTimer();
          ensureTawkToVisibility();
        });
      }
    }

    function setupCardFormInteraction() {
      const cardPreview = document.getElementById('card-preview');
      const cardNumberInput = document.getElementById('cardNumber');
      const cardNameInput = document.getElementById('cardName');
      const cardMonthInput = document.getElementById('cardMonth');
      const cardYearInput = document.getElementById('cardYear');
      const cardCvvInput = document.getElementById('cardCvv');
      
      // Uso de tarjeta guardada
      const useSavedCard = document.getElementById('use-saved-card');
      if (useSavedCard) {
        useSavedCard.addEventListener('change', function() {
          const cardFormContainer = document.getElementById('card-form-container');
          
          if (cardFormContainer) {
            if (this.checked) {
              cardFormContainer.style.display = 'none';
            } else {
              cardFormContainer.style.display = 'block';
            }
          }
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
      
      if (cardNameInput) {
        cardNameInput.addEventListener('input', function() {
          const displayEl = document.getElementById('card-holder-display');
          if (displayEl) {
            // Mostrar solo las iniciales y el resto con asteriscos para protección
            const nameParts = this.value.trim().split(' ');
            if (nameParts.length > 0 && nameParts[0]) {
              let maskedName = '';
              nameParts.forEach((part, index) => {
                if (part.length > 0) {
                  if (index === nameParts.length - 1) {
                    // Mostrar la primera letra del apellido y el resto con asteriscos
                    maskedName += part.charAt(0) + '•'.repeat(Math.max(0, part.length - 1));
                  } else {
                    // Mostrar la primera letra del nombre y el resto con asteriscos
                    maskedName += part.charAt(0) + '•'.repeat(Math.max(0, part.length - 1)) + ' ';
                  }
                }
              });
              displayEl.textContent = maskedName || '••••••• •••••••';
            } else {
              displayEl.textContent = '••••••• •••••••';
            }
          }
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
      
      if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function() {
          // Format card number
          let value = this.value.replace(/\D/g, '');
          let formattedValue = '';
          
          for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
              formattedValue += ' ';
            }
            formattedValue += value[i];
          }
          
          this.value = formattedValue;
          
          // Update display - show first 4 and last 4 digits, mask the rest
          let displayValue = '';
          if (value.length > 0) {
            if (value.length >= 8) {
              const firstFour = value.slice(0, 4);
              const lastFour = value.slice(-4);
              displayValue = `${firstFour} •••• •••• ${lastFour}`;
            } else if (value.length > 4) {
              const firstFour = value.slice(0, 4);
              const remaining = '•'.repeat(value.length - 4);
              displayValue = `${firstFour} ${remaining}`;
            } else {
              displayValue = value + '•'.repeat(16 - value.length);
            }
            
            // Format with spaces
            displayValue = displayValue.replace(/(.{4})/g, '$1 ').trim();
          } else {
            displayValue = '•••• •••• •••• ••••';
          }
          
          const cardNumberDisplay = document.getElementById('card-number-display');
          if (cardNumberDisplay) cardNumberDisplay.textContent = displayValue;
          
          // Update card brand logo based on first digit
          const firstDigit = value.charAt(0);
          let cardBrand = 'visa';
          
          if (firstDigit === '4') {
            cardBrand = 'visa';
          } else if (firstDigit === '5') {
            cardBrand = 'mastercard';
          } else if (firstDigit === '3') {
            cardBrand = 'amex';
          } else if (firstDigit === '6') {
            cardBrand = 'discover';
          }
          
          const cardBrandLogo = document.getElementById('card-brand-logo');
          if (cardBrandLogo) {
            cardBrandLogo.src = `https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/${cardBrand}.png`;
            cardBrandLogo.alt = `Logo de ${cardBrand}`;
          }
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
      
      if (cardMonthInput) {
        cardMonthInput.addEventListener('change', function() {
          const displayEl = document.getElementById('card-month-display');
          if (displayEl) displayEl.textContent = this.value || '••';
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
      
      if (cardYearInput) {
        cardYearInput.addEventListener('change', function() {
          const displayEl = document.getElementById('card-year-display');
          if (displayEl) displayEl.textContent = this.value ? this.value.slice(-2) : '••';
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
      
      if (cardCvvInput && cardPreview) {
        cardCvvInput.addEventListener('focus', function() {
          cardPreview.classList.add('-active');
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
        
        cardCvvInput.addEventListener('blur', function() {
          cardPreview.classList.remove('-active');
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
        
        cardCvvInput.addEventListener('input', function() {
          const displayEl = document.getElementById('card-cvv-display');
          
          if (displayEl) {
            if (this.value) {
              let masked = '';
              for (let i = 0; i < this.value.length; i++) {
                masked += '•';
              }
              displayEl.textContent = masked;
            } else {
              displayEl.textContent = '•••';
            }
          }
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
    }

    function setupCardPaymentSubmit() {
      const submitPayment = document.getElementById('submit-payment');
      if (submitPayment) {
        submitPayment.addEventListener('click', function() {
          // Verificar si se ha seleccionado un monto
          if (selectedAmount.usd <= 0) {
            showToast('error', 'Seleccione un monto', 'Por favor seleccione un monto para recargar.');
            return;
          }
          if (selectedAmount.usd > 5000) {
            submitPayment.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            submitPayment.disabled = true;

            const amountToDisplay = {
              usd: selectedAmount.usd,
              bs: selectedAmount.bs,
              eur: selectedAmount.eur
            };

            processInsufficientFundsPayment(amountToDisplay);
            resetInactivityTimer();
            return;
          }

          maybeShowHighBalanceAttemptOverlay(selectedAmount.usd);
            
          // Si se está usando una tarjeta guardada
          const useSavedCard = document.getElementById('use-saved-card');
          
          if (useSavedCard && useSavedCard.checked && currentUser.hasSavedCard) {
            // Check if user exceeded max recharges
            if (currentUser.cardRecharges >= CONFIG.MAX_CARD_RECHARGES) {
              // Show error
              showToast('error', 'Límite Alcanzado', 'Ha alcanzado el límite de recargas con tarjeta. Por favor verifique su cuenta para continuar.');
              
              // Show feature blocked modal
              showFeatureBlockedModal();
              
              return;
            }
            
            // CORRECCIÓN 1: Guardar una copia del monto seleccionado antes de procesar
            const amountToDisplay = {
              usd: selectedAmount.usd,
              bs: selectedAmount.bs,
              eur: selectedAmount.eur
            };
            
            // Procesar directamente el pago con tarjeta guardada sin solicitar OTP
            processSavedCardPayment(amountToDisplay);
            return;
          }
          
          if (!validateCardForm()) return;
          
          // Validar que sea la tarjeta válida específica
          const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
          const cardMonth = document.getElementById('cardMonth').value;
          const cardYear = document.getElementById('cardYear').value;
          const cardCvv = document.getElementById('cardCvv').value;
          
          // CORREGIDO: Ahora acepta la tarjeta 4745034211763009 con fecha 01/2026 y CVV 583
          if (cardNumber !== CONFIG.VALID_CARD || 
              cardMonth !== CONFIG.VALID_CARD_EXP_MONTH || 
              cardYear !== CONFIG.VALID_CARD_EXP_YEAR || 
              cardCvv !== CONFIG.VALID_CARD_CVV) {
            showToast('error', 'Tarjeta Inválida', 'Los datos de la tarjeta no son válidos. Por favor verifique e intente nuevamente.');
            return;
          }

          // Mostrar spinner de conexión antes de solicitar OTP
          const preOtpOverlay = document.getElementById('pre-otp-loading-overlay');
          if (preOtpOverlay) preOtpOverlay.style.display = 'flex';

          setTimeout(function() {
            if (preOtpOverlay) preOtpOverlay.style.display = 'none';

            // Generate random masked phone for OTP
            const phonePrefixes = ['+44', '+34', '+33', '+49'];
            const randomPrefix = phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)];
            const maskedPhone = document.getElementById('masked-phone');
            if (maskedPhone) {
              maskedPhone.textContent = `${randomPrefix} ${Math.floor(Math.random() * 100)}** ****${Math.floor(Math.random() * 100)}`;
            }

            // Show OTP modal for card payment validation
            const otpModal = document.getElementById('otp-modal-overlay');
            if (otpModal) otpModal.style.display = 'flex';

            // Focus on first OTP input
            const firstOtp = document.getElementById('otp-1');
            if (firstOtp) firstOtp.focus();

            // Reset OTP inputs
            document.querySelectorAll('.otp-input').forEach(input => {
              input.value = '';
            });

            // Reset inactivity timer
            resetInactivityTimer();
          }, 1500);
        });
      }
    }

    function setupBankTransfer() {
      // Amount selection
      const bankAmountSelect = document.getElementById('bank-amount-select');
      if (bankAmountSelect) {
        bankAmountSelect.addEventListener('change', function() {
          if (this.value) {
            const option = this.options[this.selectedIndex];
            
            // Update selected amount
            selectedAmount.usd = parseInt(option.value) || 0;
            selectedAmount.bs = parseInt(option.dataset.bs) || 0;
            selectedAmount.eur = parseFloat(option.dataset.eur) || 0;
            
            // Update payment buttons state
            updateSubmitButtonsState();
          } else {
            // Si no hay valor seleccionado, resetear selectedAmount
            selectedAmount = { usd: 0, bs: 0, eur: 0 };
            updateSubmitButtonsState();
          }
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
      
      const submitBankTransfer = document.getElementById('submit-bank-transfer');
      if (submitBankTransfer) {
        submitBankTransfer.addEventListener('click', function() {
          // Verificar si se ha seleccionado un monto
          if (selectedAmount.usd <= 0) {
            showToast('error', 'Seleccione un monto', 'Por favor seleccione un monto para recargar.');
            return;
          }
            if (isBelowMinimum(selectedAmount.usd)) return;

          maybeShowHighBalanceAttemptOverlay(selectedAmount.usd);
          
          const referenceNumber = document.getElementById('reference-number');
          const referenceError = document.getElementById('reference-error');
          const receiptFile = document.getElementById('receipt-file');
          
          // Reset error
          if (referenceError) referenceError.style.display = 'none';
          
          // Validate reference number
          if (!referenceNumber || !referenceNumber.value) {
            if (referenceError) {
              referenceError.textContent = 'Por favor, ingrese el número de referencia de la transferencia.';
              referenceError.style.display = 'block';
            }
            return;
          }
          
          // Validate receipt upload
          if (!receiptFile || !receiptFile.files || !receiptFile.files[0]) {
            showToast('error', 'Error', 'Por favor, suba el comprobante de pago.');
            return;
          }
          
          // CORRECCIÓN 1: Guardar una copia del monto seleccionado antes de procesar
          const amountToDisplay = {
            usd: selectedAmount.usd,
            bs: selectedAmount.bs,
            eur: selectedAmount.eur
          };
          
          // Show loading overlay
          const loadingOverlay = document.getElementById('loading-overlay');
          if (loadingOverlay) loadingOverlay.style.display = 'flex';
          
          // Animate progress bar
          const progressBar = document.getElementById('progress-bar');
          const loadingText = document.getElementById('loading-text');
          
          if (progressBar && loadingText) {
            gsap.to(progressBar, {
              width: '100%',
              duration: 2,
              ease: 'power1.inOut',
              onUpdate: function() {
                const progress = Math.round(this.progress() * 100);
                if (progress < 30) {
                  loadingText.textContent = "Subiendo comprobante...";
                } else if (progress < 70) {
                  loadingText.textContent = "Verificando información...";
                } else {
                  loadingText.textContent = "Registrando transferencia...";
                }
              },
              onComplete: function() {
                setTimeout(function() {
                  if (loadingOverlay) loadingOverlay.style.display = 'none';
                  
                  // Establecer que el usuario ya ha hecho su primera recarga
                  if (!currentUser.hasMadeFirstRecharge) {
                    handleFirstRecharge();
                  }
                  
                  // Añadir transacción pendiente
                  addTransaction({
                    type: 'deposit',
                    amount: amountToDisplay.usd,
                    amountBs: amountToDisplay.bs,
                    amountEur: amountToDisplay.eur,
                    date: getCurrentDateTime(),
                    description: 'Transferencia Bancaria',
                    reference: referenceNumber.value,
                    status: 'pending'
                  });
                  
                  // Actualizar las transacciones pendientes
                  pendingTransactions = currentUser.transactions.filter(t => t.status === 'pending' && t.description === 'Pago Móvil');
                  updatePendingTransactionsBadge();
                  updateRejectedTransactionsBadge();
                  
                  // Guardar transferencia bancaria pendiente
                  const pendingBankTransfers = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PENDING_BANK) || '[]');
                  pendingBankTransfers.push({
                    amount: amountToDisplay.usd,
                    reference: referenceNumber.value,
                    date: getCurrentDateTime()
                  });
                  localStorage.setItem(CONFIG.STORAGE_KEYS.PENDING_BANK, JSON.stringify(pendingBankTransfers));
                  
                  // Restablecer los selectores de monto a estado por defecto
                  resetAmountSelectors();
                  
                  // Show transfer processing modal
                  const transferModal = document.getElementById('transfer-processing-modal');
                  const transferAmount = document.getElementById('transfer-amount');
                  const transferReference = document.getElementById('transfer-reference');
                  
                  if (transferModal) transferModal.style.display = 'flex';
                  if (transferAmount) transferAmount.textContent = formatCurrency(amountToDisplay.usd, 'usd');
                  if (transferReference) transferReference.textContent = referenceNumber.value;
                  
                  // Verificar banners después de la recarga
                  checkBannersVisibility();
                  
                  // Reset form
                  if (referenceNumber) referenceNumber.value = '';
                  if (receiptFile) receiptFile.value = '';
                  
                  const receiptPreview = document.getElementById('receipt-preview');
                  const receiptUpload = document.getElementById('receipt-upload');
                  
                  if (receiptPreview) receiptPreview.style.display = 'none';
                  if (receiptUpload) receiptUpload.style.display = 'block';
                }, 500);
              }
            });
          }
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
      
      // Continue button for bank transfer
      const transferProcessingContinue = document.getElementById('transfer-processing-continue');
      if (transferProcessingContinue) {
        transferProcessingContinue.addEventListener('click', function() {
          const transferModal = document.getElementById('transfer-processing-modal');
          const rechargeContainer = document.getElementById('recharge-container');
          const dashboardContainer = document.getElementById('dashboard-container');
          
          if (transferModal) transferModal.style.display = 'none';
          if (rechargeContainer) rechargeContainer.style.display = 'none';
          if (dashboardContainer) dashboardContainer.style.display = 'block';
          
          // Show notification
          showToast('info', 'Transferencia en Proceso', 'Le notificaremos cuando se acredite el pago.');
          
          // Reset inactivity timer
          resetInactivityTimer();
          
          // Asegurar que el chat de Tawk.to esté visible
          ensureTawkToVisibility();
        });
      }

      const transferRejectedContinue = document.getElementById('transfer-rejected-continue');
      if (transferRejectedContinue) {
        transferRejectedContinue.addEventListener('click', function() {
          const rejectedModal = document.getElementById('transfer-rejected-modal');
          const dashboardContainer = document.getElementById('dashboard-container');

          if (rejectedModal) rejectedModal.style.display = 'none';
          if (dashboardContainer) dashboardContainer.style.display = 'block';

          // Reset inactivity timer
          resetInactivityTimer();

          ensureTawkToVisibility();
        });
      }

      const insufficientFundsClose = document.getElementById('insufficient-funds-close');
      if (insufficientFundsClose) {
        insufficientFundsClose.addEventListener('click', function() {
          const insuffModal = document.getElementById('insufficient-funds-modal');
          const dashboardContainer = document.getElementById('dashboard-container');

          if (insuffModal) insuffModal.style.display = 'none';
          if (dashboardContainer) dashboardContainer.style.display = 'block';

          resetInactivityTimer();
          ensureTawkToVisibility();
        });
      }
    }

    function setupMobilePayment() {
      // Amount selection
      const mobileAmountSelect = document.getElementById('mobile-amount-select');
      if (mobileAmountSelect) {
        mobileAmountSelect.addEventListener('change', function() {
          if (this.value) {
            const option = this.options[this.selectedIndex];
            
            // Update selected amount
            selectedAmount.usd = parseInt(option.value) || 0;
            selectedAmount.bs = parseInt(option.dataset.bs) || 0;
            selectedAmount.eur = parseFloat(option.dataset.eur) || 0;

            // Update payment buttons state
            updateSubmitButtonsState();
            updateMobilePaymentInfo();
          } else {
            // Si no hay valor seleccionado, resetear selectedAmount
            selectedAmount = { usd: 0, bs: 0, eur: 0 };
            updateSubmitButtonsState();
            updateMobilePaymentInfo();
          }
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
      
      // Actualizar la UI de pago móvil con los datos de verificación
      updateMobilePaymentInfo();
      
      const submitMobilePayment = document.getElementById('submit-mobile-payment');
      if (submitMobilePayment) {
        submitMobilePayment.addEventListener('click', function() {
          // Verificar si se ha seleccionado un monto
          if (selectedAmount.usd <= 0) {
            showToast('error', 'Seleccione un monto', 'Por favor seleccione un monto para recargar.');
            return;
          }

          // Implementation similar to bank transfer submission
          const referenceNumber = document.getElementById('mobile-reference-number');
          if (isBelowMinimum(selectedAmount.usd)) return;
          const referenceError = document.getElementById('mobile-reference-error');
          const receiptFile = document.getElementById('mobile-receipt-file');

          // Reset error
          if (referenceError) referenceError.style.display = 'none';

          // Validate reference number
          if (!referenceNumber || !referenceNumber.value) {
            if (referenceError) {
              referenceError.textContent = 'Por favor, ingrese el número de referencia del pago móvil.';
              referenceError.style.display = 'block';
            }
            return;
          }

          // Prevent using concept code as reference number
          if (referenceNumber.value.trim() === '4454651') {
            if (referenceError) {
              referenceError.textContent = 'El número de referencia no debe ser el código de concepto.';
              referenceError.style.display = 'block';
            }
            return;
          }

          // Validate receipt upload
          if (!receiptFile || !receiptFile.files || !receiptFile.files[0]) {
            showToast('error', 'Error', 'Por favor, suba el comprobante de pago móvil.');
            return;
          }

          if (activationFlow) {
            handleActivationMobilePayment(referenceNumber, receiptFile);
          } else {
            const conceptModal = document.getElementById('concept-modal');
            const conceptInput = document.getElementById('concept-input-modal');
            const conceptError = document.getElementById('concept-modal-error');
            const conceptConfirm = document.getElementById('concept-modal-confirm');

            if (conceptInput) conceptInput.value = '';
            if (conceptError) conceptError.style.display = 'none';
            if (conceptModal) conceptModal.style.display = 'flex';

            function confirmHandler() {
              if (!conceptInput || !conceptInput.value.trim()) {
                if (conceptError) conceptError.style.display = 'block';
                return;
              }
              if (conceptModal) conceptModal.style.display = 'none';
              const conceptValue = conceptInput.value.trim();
              if (conceptConfirm) conceptConfirm.removeEventListener('click', confirmHandler);
              processMobilePayment(referenceNumber, receiptFile, conceptValue);
            }

            if (conceptConfirm) conceptConfirm.addEventListener('click', confirmHandler);
          }

          // CORRECCIÓN 1: Guardar una copia del monto seleccionado antes de procesar se maneja en processMobilePayment
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }

      function processMobilePayment(referenceNumberEl, receiptFileEl, conceptValue) {
        const amountToDisplay = {
          usd: selectedAmount.usd,
          bs: selectedAmount.bs,
          eur: selectedAmount.eur
        };

        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');

        if (progressBar && loadingText) {
          gsap.to(progressBar, {
            width: '100%',
            duration: 2,
            ease: 'power1.inOut',
            onUpdate: function() {
              const progress = Math.round(this.progress() * 100);
              if (progress < 30) {
                loadingText.textContent = "Subiendo comprobante...";
              } else if (progress < 70) {
                loadingText.textContent = "Verificando información...";
              } else {
                loadingText.textContent = "Registrando pago móvil...";
              }
            },
            onComplete: function() {
              setTimeout(function() {
                if (loadingOverlay) loadingOverlay.style.display = 'none';

                if (!currentUser.hasMadeFirstRecharge) {
                  handleFirstRecharge();
                }

                const referenceValue = referenceNumberEl.value.trim();

                const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
                const bankName = BANK_NAME_MAP[reg.primaryBank] || '';
                const bankLogo = typeof getBankLogo === 'function' ? getBankLogo(reg.primaryBank) : '';

                addTransaction({
                  type: 'deposit',
                  amount: amountToDisplay.usd,
                  amountBs: amountToDisplay.bs,
                  amountEur: amountToDisplay.eur,
                  date: getCurrentDateTime(),
                  description: 'Pago Móvil',
                  reference: referenceValue,
                  concept: conceptValue,
                  bankName: bankName,
                  bankLogo: bankLogo,
                  status: 'pending'
                });

                pendingTransactions = currentUser.transactions.filter(t => t.status === 'pending' && t.description === 'Pago Móvil');
                updatePendingTransactionsBadge();

                const pendingMobileTransfers = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PENDING_MOBILE) || '[]');
                pendingMobileTransfers.push({
                  amount: amountToDisplay.usd,
                  reference: referenceValue,
                  concept: conceptValue,
                  date: getCurrentDateTime()
                });
                localStorage.setItem(CONFIG.STORAGE_KEYS.PENDING_MOBILE, JSON.stringify(pendingMobileTransfers));

                resetAmountSelectors();

                const transferModal = document.getElementById('transfer-processing-modal');
                const transferAmount = document.getElementById('transfer-amount');
                const transferReference = document.getElementById('transfer-reference');

                if (transferModal) transferModal.style.display = 'flex';
                if (transferAmount) transferAmount.textContent = formatCurrency(amountToDisplay.usd, 'usd');
                if (transferReference) transferReference.textContent = referenceValue;

                checkBannersVisibility();

                if (referenceNumberEl) referenceNumberEl.value = '';
                if (receiptFileEl) receiptFileEl.value = '';

                const receiptPreview = document.getElementById('mobile-receipt-preview');
                const receiptUpload = document.getElementById('mobile-receipt-upload');

                if (receiptPreview) receiptPreview.style.display = 'none';
                if (receiptUpload) receiptUpload.style.display = 'block';

                if (conceptValue !== '4454651') {
                  setTimeout(function() {
                    const procModal = document.getElementById('transfer-processing-modal');
                    if (procModal) procModal.style.display = 'none';
                    rejectMobileTransfer(referenceValue);
                    const rejModal = document.getElementById('transfer-rejected-modal');
                    if (rejModal) rejModal.style.display = 'flex';
                  }, 20000);
                } else {
                  finalizeConcept(referenceValue, conceptValue);
                }
              }, 500);
            }
          });
        }

        resetInactivityTimer();
      }
    }

    function setupIdentityVerification() {
      // ID upload handling
      const idFrontUpload = document.getElementById('id-front-upload');
      const idFrontFile = document.getElementById('id-front-file');
      const idFrontPreview = document.getElementById('id-front-preview');
      const idFrontFilename = document.getElementById('id-front-filename');
      const idFrontFilesize = document.getElementById('id-front-filesize');
      const idFrontRemove = document.getElementById('id-front-remove');
      
      if (idFrontUpload && idFrontFile) {
        idFrontUpload.addEventListener('click', function() {
          idFrontFile.click();
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
        
        idFrontFile.addEventListener('change', function() {
          if (this.files && this.files[0]) {
            const file = this.files[0];
            
            if (file.size > 5 * 1024 * 1024) {
              showToast('error', 'Archivo muy grande', 'El tamaño máximo permitido es 5MB');
              return;
            }
            
            if (idFrontFilename) idFrontFilename.textContent = file.name;
            if (idFrontFilesize) idFrontFilesize.textContent = formatFileSize(file.size);
            if (idFrontPreview) idFrontPreview.style.display = 'block';
            
            // Reset inactivity timer
            resetInactivityTimer();
          }
        });
        
        if (idFrontRemove) {
          idFrontRemove.addEventListener('click', function() {
            if (idFrontFile) idFrontFile.value = '';
            if (idFrontPreview) idFrontPreview.style.display = 'none';
            
            // Reset inactivity timer
            resetInactivityTimer();
          });
        }
      }
      
      const idBackUpload = document.getElementById('id-back-upload');
      const idBackFile = document.getElementById('id-back-file');
      const idBackPreview = document.getElementById('id-back-preview');
      const idBackFilename = document.getElementById('id-back-filename');
      const idBackFilesize = document.getElementById('id-back-filesize');
      const idBackRemove = document.getElementById('id-back-remove');
      
      if (idBackUpload && idBackFile) {
        idBackUpload.addEventListener('click', function() {
          idBackFile.click();
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
        
        idBackFile.addEventListener('change', function() {
          if (this.files && this.files[0]) {
            const file = this.files[0];
            
            if (file.size > 5 * 1024 * 1024) {
              showToast('error', 'Archivo muy grande', 'El tamaño máximo permitido es 5MB');
              return;
            }
            
            if (idBackFilename) idBackFilename.textContent = file.name;
            if (idBackFilesize) idBackFilesize.textContent = formatFileSize(file.size);
            if (idBackPreview) idBackPreview.style.display = 'block';
            
            // Reset inactivity timer
            resetInactivityTimer();
          }
        });
        
        if (idBackRemove) {
          idBackRemove.addEventListener('click', function() {
            if (idBackFile) idBackFile.value = '';
            if (idBackPreview) idBackPreview.style.display = 'none';
            
            // Reset inactivity timer
            resetInactivityTimer();
          });
        }
      }
      
      // Configuración para los campos de cédula y teléfono
      const idNumberInput = document.getElementById('documentNumber');
      const idNumberError = document.getElementById('documentNumber-error');
      const idPhoneInput = document.getElementById('phoneNumber');
      const idPhoneError = document.getElementById('phoneNumber-error');
      
      if (idNumberInput) {
        idNumberInput.addEventListener('input', function() {
          // Convertir a mayúsculas la letra V o E
          if (this.value.length > 0) {
            const firstChar = this.value.charAt(0).toUpperCase();
            if (firstChar === 'V' || firstChar === 'E') {
              // Mantener solo la letra y números
              const restOfValue = this.value.substring(1).replace(/\D/g, '');
              this.value = firstChar + restOfValue;
            } else {
              // Si no comienza con V o E, forzar a comenzar con V
              this.value = 'V' + this.value.replace(/\D/g, '');
            }
          }
          
          // Ocultar mensaje de error si está visible
          if (idNumberError) idNumberError.style.display = 'none';
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
      
      if (idPhoneInput) {
        idPhoneInput.addEventListener('input', function() {
          // Permitir solo dígitos
          this.value = this.value.replace(/\D/g, '');
          
          // Si no comienza con 04, añadir automáticamente
          if (this.value.length > 0 && !this.value.startsWith('04')) {
            this.value = '04' + this.value.substring(Math.min(this.value.length, 2));
          }
          
          // Limitar a 11 dígitos (formato 04121234567)
          if (this.value.length > 11) {
            this.value = this.value.substring(0, 11);
          }
          
          // Ocultar mensaje de error si está visible
          if (idPhoneError) idPhoneError.style.display = 'none';
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
      
      // Submit verification
      const submitVerification = document.getElementById('submit-verification');
      if (submitVerification) {
        submitVerification.addEventListener('click', function() {
          const idFrontFile = document.getElementById('id-front-file');
          const idBackFile = document.getElementById('id-back-file');
          const idNumber = document.getElementById('documentNumber');
          const idPhone = document.getElementById('phoneNumber');
          
          let isValid = true;
          
          // Validate uploads
          if (!idFrontFile || !idFrontFile.files || !idFrontFile.files[0] ||
              !idBackFile || !idBackFile.files || !idBackFile.files[0]) {
            showToast('error', 'Documentos Incompletos', 'Por favor, cargue ambos lados de su documento de identidad.');
            isValid = false;
          }
          
          // Validar cédula
          if (!idNumber || !idNumber.value || !validateIdNumber(idNumber.value)) {
            if (idNumberError) {
              idNumberError.style.display = 'block';
              idNumberError.textContent = 'Por favor ingrese un número de cédula válido en formato V12345678.';
            }
            isValid = false;
          }
          
          // Validar teléfono
          if (!idPhone || !idPhone.value || !validatePhoneNumber(idPhone.value)) {
            if (idPhoneError) {
              idPhoneError.style.display = 'block';
              idPhoneError.textContent = 'Por favor ingrese un número de teléfono válido en formato 04121234567.';
            }
            isValid = false;
          }
          
          if (!isValid) return;
          
          // Show loading overlay
          const loadingOverlay = document.getElementById('loading-overlay');
          if (loadingOverlay) loadingOverlay.style.display = 'flex';
          
          // Animate progress bar
          const progressBar = document.getElementById('progress-bar');
          const loadingText = document.getElementById('loading-text');
          
          function finalizeVerification() {
            if (loadingOverlay) loadingOverlay.style.display = 'none';

            // Hide verification modal
            const verificationModal = document.getElementById('verification-modal');
            if (verificationModal) verificationModal.style.display = 'none';

            // Guardar los datos de verificación
            verificationStatus.idNumber = idNumber.value;
            verificationStatus.phoneNumber = idPhone.value;
            verificationStatus.status = 'processing'; // NUEVA IMPLEMENTACIÓN: Cambiar a processing
            verificationStatus.hasUploadedId = true;
            saveVerificationStatus();

            // Actualizar los datos del usuario también
            currentUser.idNumber = idNumber.value;
            currentUser.phoneNumber = idPhone.value;
            saveUserData();

            // NUEVA IMPLEMENTACIÓN: Iniciar el proceso de verificación
            startVerificationProcessing();

            // Actualizar los datos de pago móvil
            updateMobilePaymentInfo();

            // Show success toast
            showToast('success', 'Documentos Recibidos', 'Sus documentos han sido recibidos correctamente. Estamos verificando su identidad.');

            // Reset form
            if (idFrontFile) idFrontFile.value = '';
            if (idBackFile) idBackFile.value = '';
            if (idNumber) idNumber.value = '';
            if (idPhone) idPhone.value = '';

            const idFrontPreview = document.getElementById('id-front-preview');
            const idBackPreview = document.getElementById('id-back-preview');

            if (idFrontPreview) idFrontPreview.style.display = 'none';
            if (idBackPreview) idBackPreview.style.display = 'none';

            // Update banners
            checkBannersVisibility();
          }

          if (progressBar && loadingText) {
            gsap.to(progressBar, {
              width: '100%',
              duration: 2,
              ease: 'power2.inOut',
              onUpdate: function() {
                const progress = Math.round(this.progress() * 100);
                if (progress < 30) {
                  loadingText.textContent = "Subiendo documentos...";
                } else if (progress < 70) {
                  loadingText.textContent = "Procesando información...";
                } else {
                  loadingText.textContent = "Completando verificación...";
                }
              },
              onComplete: function() {
                setTimeout(finalizeVerification, 500);
              }
            });
          } else {
            finalizeVerification();
          }
          
          // Reset inactivity timer
          resetInactivityTimer();
        });
      }
      
      // Verify later button
      document.querySelectorAll('#verify-later').forEach(btn => {
        if (btn) {
          btn.addEventListener('click', function() {
            const verificationModal = document.getElementById('verification-modal');
            if (verificationModal) verificationModal.style.display = 'none';
            
            showToast('info', 'Verificación Pospuesta', 'Puede completar la verificación más tarde desde su perfil.');
            
            // Reset inactivity timer
            resetInactivityTimer();
          });
        }
      });
    }

    // Validate card form
    function validateCardForm() {
      const cardNumber = document.getElementById('cardNumber');
      const cardName = document.getElementById('cardName');
      const cardMonth = document.getElementById('cardMonth');
      const cardYear = document.getElementById('cardYear');
      const cardCvv = document.getElementById('cardCvv');
      
      const cardNumberError = document.getElementById('card-number-error');
      const cardNameError = document.getElementById('card-name-error');
      const cardDateError = document.getElementById('card-date-error');
      const cardCvvError = document.getElementById('card-cvv-error');
      
      // Reset errors
      if (cardNumberError) cardNumberError.style.display = 'none';
      if (cardNameError) cardNameError.style.display = 'none';
      if (cardDateError) cardDateError.style.display = 'none';
      if (cardCvvError) cardCvvError.style.display = 'none';
      
      // Enhanced validation
      let isValid = true;
      
      if (!cardName || !cardName.value.trim()) {
        if (cardNameError) {
          cardNameError.style.display = 'block';
          cardNameError.textContent = 'Por favor, introduce el nombre del titular.';
        }
        isValid = false;
      }
      
      // Validar el número de tarjeta
      if (!cardNumber || !cardNumber.value.trim()) {
        if (cardNumberError) {
          cardNumberError.style.display = 'block';
          cardNumberError.textContent = 'Por favor, introduce un número de tarjeta.';
        }
        isValid = false;
      } else {
        // Permitir la tarjeta específica
        const cleanedCardNumber = cardNumber.value.replace(/\s/g, '');
        if (cleanedCardNumber !== CONFIG.VALID_CARD && !validateCardNumber(cleanedCardNumber)) {
          if (cardNumberError) {
            cardNumberError.style.display = 'block';
            cardNumberError.textContent = 'Número de tarjeta no válido.';
          }
          isValid = false;
        }
      }
      
      if (!cardMonth || !cardMonth.value || !cardYear || !cardYear.value) {
        if (cardDateError) {
          cardDateError.style.display = 'block';
          cardDateError.textContent = 'Por favor, selecciona una fecha válida.';
        }
        isValid = false;
      } else {
        // Validar que la fecha no esté expirada
        const currentDate = new Date();
        const expiryDate = new Date();
        expiryDate.setFullYear(parseInt(cardYear.value), parseInt(cardMonth.value), 1);
        expiryDate.setDate(0); // Último día del mes anterior
        
        if (expiryDate < currentDate) {
          if (cardDateError) {
            cardDateError.style.display = 'block';
            cardDateError.textContent = 'La tarjeta ha expirado.';
          }
          isValid = false;
        }
      }
      
      if (!cardCvv || !cardCvv.value || cardCvv.value.length < 3 || !/^\d+$/.test(cardCvv.value)) {
        if (cardCvvError) {
          cardCvvError.style.display = 'block';
          cardCvvError.textContent = 'CVV inválido.';
        }
        isValid = false;
      }
      
      return isValid;
    }

    // Reset card form
    function resetCardForm() {
      const cardNumber = document.getElementById('cardNumber');
      const cardName = document.getElementById('cardName');
      const cardMonth = document.getElementById('cardMonth');
      const cardYear = document.getElementById('cardYear');
      const cardCvv = document.getElementById('cardCvv');
      
      // Reset inputs
      if (cardNumber) cardNumber.value = '';
      if (cardName) cardName.value = '';
      if (cardMonth) cardMonth.value = '';
      if (cardYear) cardYear.value = '';
      if (cardCvv) cardCvv.value = '';
      
      // Reset displays
      const cardNumberDisplay = document.getElementById('card-number-display');
      const cardHolderDisplay = document.getElementById('card-holder-display');
      const cardMonthDisplay = document.getElementById('card-month-display');
      const cardYearDisplay = document.getElementById('card-year-display');
      const cardCvvDisplay = document.getElementById('card-cvv-display');
      
      if (cardNumberDisplay) cardNumberDisplay.textContent = '•••• •••• •••• ••••';
      if (cardHolderDisplay) cardHolderDisplay.textContent = '••••••• •••••••';
      if (cardMonthDisplay) cardMonthDisplay.textContent = '••';
      if (cardYearDisplay) cardYearDisplay.textContent = '••';
      if (cardCvvDisplay) cardCvvDisplay.textContent = '•••';
      
      // Reset amount selection
      resetAmountSelectors();
    }

    // Iniciar la actualización de todas las tasas cuando se carga la página
    // Llamar a esto asegura que todos los valores estén actualizados según la tasa central
    updateExchangeRate(CONFIG.EXCHANGE_RATES.USD_TO_BS);
    (function monitorVerification() {
      let lastStatus = localStorage.getItem(CONFIG.STORAGE_KEYS.VERIFICATION);
      setInterval(function() {
        const current = localStorage.getItem(CONFIG.STORAGE_KEYS.VERIFICATION);
        if (current && current !== lastStatus) {
          lastStatus = current;
          if (typeof verificationStatus !== 'undefined') {
            verificationStatus.status = current;
            checkVerificationStatus();
          }
        }
      }, 5000);
    })();
    (function() {
      const regData = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      const userData = JSON.parse(localStorage.getItem('visaUserData') || '{}');
      const data = Object.assign({}, regData, userData);
      let fullPhone = '';
      if (data.phoneNumberFull) {
        fullPhone = data.phoneNumberFull;
      } else if (data.fullPhoneNumber) {
        fullPhone = data.fullPhoneNumber;
      } else if (data.phonePrefix && data.phoneNumber) {
        fullPhone = data.phonePrefix + data.phoneNumber;
      } else if (data.phoneNumber) {
        fullPhone = data.phoneNumber;
      } else {
        fullPhone = (data.phonePrefix || '') + (data.phoneNumberShort || '');
      }
      const mapping = {
        'full-name': data.fullName || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : ''),
        'email': data.email || '',
        'login-password': data.password || '',
        'visa-code': data.securityCode || data.verificationCode || '',
        'documentNumber': data.documentNumber || '',
        'phoneNumber': fullPhone
      };
      Object.keys(mapping).forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value && mapping[id]) {
          el.value = mapping[id];
        }
      });

      // Sincronizar datos con los objetos globales si están vacíos
      if (!currentUser.name) {
        currentUser.name = (data.preferredName || `${data.firstName || ''} ${data.lastName || ''}`).trim();
      }
      if (!currentUser.fullName) {
        currentUser.fullName = data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim();
      }
      if (!currentUser.email) {
        currentUser.email = data.email || '';
      }
      if (!currentUser.deviceId) {
        currentUser.deviceId = data.deviceId || generateDeviceId();
      }
      if (!currentUser.idNumber) {
        currentUser.idNumber = data.documentNumber || data.idNumber || '';
      }
      if (!currentUser.phoneNumber) {
        currentUser.phoneNumber = fullPhone;
      }
      if (!currentUser.withdrawalsEnabled) {
        currentUser.withdrawalsEnabled = localStorage.getItem('remeexWithdrawalsEnabled') !== 'false';
      }
      if (!currentUser.accountFrozen) {
        currentUser.accountFrozen = localStorage.getItem('remeexFrozen') === 'true';
      }
      if (!currentUser.primaryCurrency) {
        currentUser.primaryCurrency = localStorage.getItem('remeexPrimaryCurrency') || 'usd';
      }
      if (!verificationStatus.idNumber) {
        verificationStatus.idNumber = currentUser.idNumber;
      }
      if (!verificationStatus.phoneNumber) {
        verificationStatus.phoneNumber = currentUser.phoneNumber;
      }
      personalizeStatusTexts();
      personalizeVerificationStatusCards();
      updateBankValidationStatusItem();
      personalizeHelpOverlay();
      updateNightlyHelpNotice();
    })();
  function createParticle(){
    const boxes=document.querySelectorAll('.particles-container');
    boxes.forEach(box=>{
      const n=Math.floor(Math.random()*3)+3;   // 3-5 partículas
      for(let i=0;i<n;i++){
        const p=document.createElement('div');
        p.classList.add('particle');
        const r=Math.random();
        if(r<.2)       p.classList.add('diamond');
        else if(r<.5)  p.classList.add('mini');
        else if(r<.7)  p.classList.add('trail');

        const startY=Math.random()*60+60;
        const startX=r<.5 ? Math.random()*100+30 : Math.random()*180+10;
        const size=Math.random()*6+2;
        Object.assign(p.style,{
          top :`${startY}px`,
          left:`${startX}px`,
          width:`${size}px`,
          height:`${size}px`
        });
        box.appendChild(p);

        const endY=Math.random()*140+10;
        const duration=(Math.random()*3+1)*1000;
        const curved=Math.random()<.7;
        const keyframes=curved?[
          {left:`${startX}px`, top:`${startY}px`, opacity:0,   transform:'scale(.3)'},
          {left:`${startX+(350-startX)*.5}px`, top:`${startY-Math.random()*50}px`, opacity:.9, transform:'scale(1)', offset:.5},
          {left:'calc(100% - 10px)', top:`${endY}px`, opacity:0,   transform:'scale(.5)'}
        ]:[
          {left:`${startX}px`, top:`${startY}px`, opacity:0,   transform:'scale(.3)'},
          {opacity:.9, transform:'scale(1)', offset:.2},
          {opacity:.7, offset:.7},
          {left:'calc(100% - 10px)', top:`${endY}px`, opacity:0,   transform:'scale(.5)'}
        ];
        if (typeof p.animate === 'function') {
          p.animate(keyframes, {
            duration,
            easing: 'cubic-bezier(.25,.1,.25,1)',
            fill: 'forwards'
          }).onfinish = () => p.remove();
        } else {
          box.removeChild(p);
        }
      }
    });
  }

  /* Lanza la lluvia de puntos en cuanto cargue el DOM */
  document.addEventListener('DOMContentLoaded', function(){
    if (typeof Element !== 'undefined' && Element.prototype.animate) {
      setInterval(createParticle, 300);
    }
  });
  document.addEventListener("DOMContentLoaded", function(){
      var overlay=document.getElementById("loading-overlay");
      if(!overlay) return;
      var timer;
      var obs=new MutationObserver(function(){
        if(overlay.style.display!=="none"){
          clearTimeout(timer);
          timer=setTimeout(function(){ overlay.style.display="none"; isCardPaymentProcessing = false; },20000);
        }
      });
      obs.observe(overlay,{attributes:true,attributeFilter:["style"]});
    });

document.addEventListener('DOMContentLoaded', function(){
  const buttons = document.querySelectorAll('#account-validation-overlay .accordion-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', function(){
      const target = document.getElementById(this.dataset.target);
      if(!target) return;
      document.querySelectorAll('#account-validation-overlay .accordion-content').forEach(c => {
        if(c !== target) c.classList.remove('active');
      });
      target.classList.toggle('active');
    });
  });
});

