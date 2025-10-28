
    window.addEventListener('DOMContentLoaded', function () {
      var body = document.body;
      if (body) body.style.display = 'none';
      if (window.transitionGuardian) {
        var params = new URLSearchParams(window.location.search);
        var token = params.get('token');
        var isValid = token && window.transitionGuardian.validateToken(token);
        if (!isValid) {
          var fromRegistro = sessionStorage.getItem('fromRegistro') === 'true';
          if (fromRegistro) {
            try {
              if (!localStorage.getItem('visaRegistrationCompleted')) {
                var backup = sessionStorage.getItem('visaRegistrationBackup');
                if (backup) {
                  localStorage.setItem('visaRegistrationCompleted', backup);
                  var reg = JSON.parse(backup);
                  var fullPhone = reg.phoneNumberFull || (reg.phonePrefix || '') + (reg.phoneNumber || '');
                  var loginData = {
                    email: reg.email,
                    password: reg.password,
                    securityCode: reg.verificationCode,
                    phoneNumber: fullPhone,
                    preferredName: reg.preferredName,
                    firstName: reg.firstName,
                    lastName: reg.lastName,
                    fullName: reg.fullName || ((reg.firstName || '') + ' ' + (reg.lastName || '')).trim(),
                    nickname: reg.nickname,
                    deviceId: reg.deviceId,
                    completed: true
                  };
                  localStorage.setItem('visaUserData', JSON.stringify(loginData));
                }
              }
            } catch(e){}
          }
          var validation = window.transitionGuardian.validateRecarga();
          if (validation && validation.error) {
            try { location.replace('registro.html'); } catch(e){ console.error('Redirección falló', e); }
            return;
          }
        } else {
          try { sessionStorage.removeItem('fromRegistro'); } catch(e){}
        }
      }
      if (body) body.style.display = '';
    });
    window.addEventListener('DOMContentLoaded', function () {
      var fromRetiro = sessionStorage.getItem('fromRetiroP2P') === 'true';
      if (fromRetiro) {
        sessionStorage.removeItem('fromRetiroP2P');
        var verifySection = document.getElementById('status-request-verification');
        if (verifySection) verifySection.style.display = 'block';
        var verifyNav = document.getElementById('verification-nav-btn');
        if (verifyNav) verifyNav.style.display = 'flex';
      }
    });
    window.addEventListener('DOMContentLoaded', function () {
      if(localStorage.getItem('withdrawalsDisabled') === 'true'){
        var overlay = document.getElementById('withdrawal-disabled-overlay');
        var countdownEl = document.getElementById('withdrawal-countdown');
        var closeBtn = document.getElementById('withdrawal-close');
        if (overlay && countdownEl) {
          overlay.style.display = 'flex';
          var time = 15;
          countdownEl.textContent = time;
          var interval = setInterval(function(){
            time--;
            countdownEl.textContent = time;
            if(time <= 0){
              clearInterval(interval);
              if(closeBtn) closeBtn.disabled = false;
            }
          },1000);
          if(closeBtn){
            closeBtn.addEventListener('click', function(){
              overlay.style.display = 'none';
              localStorage.removeItem('withdrawalsDisabled');
            });
          }
        } else {
          alert('Las funciones de retiro están inhabilitadas.');
        }
      }
    });
    document.documentElement.classList.add('is-loading');
    window.addEventListener('app-ready', function () {
      var overlay = document.getElementById('loading-overlay');
      document.documentElement.classList.remove('is-loading');
      if (overlay) overlay.style.display = 'none';
    });
    document.addEventListener('DOMContentLoaded', function () {
      function hideOverlay() {
        document.documentElement.classList.remove('is-loading');
        var overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'none';
      }

      window.addEventListener('app-ready', hideOverlay);
      setTimeout(hideOverlay, 5000);
    });
  if (typeof gsap === "undefined") {
   window.gsap = {
    to: function(t,v){if(v&&typeof v.onUpdate=="function"){v.onUpdate.call({progress:function(){return 1;}});}if(v&&typeof v.onComplete=="function"){v.onComplete();}},
    fromTo: function(t,f,to){if(to&&typeof to.onUpdate=="function"){to.onUpdate.call({progress:function(){return 1;}});}if(to&&typeof to.onComplete=="function"){to.onComplete();}}
   };
  }
  if (typeof confetti === "undefined") { window.confetti = function(){}; }
        document.addEventListener('DOMContentLoaded', function () {
          const carousel = document.querySelector('.virtual-card-carousel');
          if (!carousel) {
            return;
          }

          const track = carousel.querySelector('.virtual-card-track');
          const slides = Array.prototype.slice.call(carousel.querySelectorAll('.virtual-card-slide'));
          const prevBtn = carousel.querySelector('.virtual-card-prev');
          const nextBtn = carousel.querySelector('.virtual-card-next');
          const dots = Array.prototype.slice.call(carousel.querySelectorAll('.virtual-card-dot'));

          if (!track || !slides.length) {
            return;
          }

          let slideWidth = 0;

          function recalcSlideWidth(force) {
            const previousWidth = slideWidth;
            let width = carousel.offsetWidth;

            if (!width || force) {
              const activeSlide = slides[currentSlide] || slides[0];
              if (activeSlide) {
                const activeWidth = activeSlide.getBoundingClientRect().width || activeSlide.offsetWidth;
                if (activeWidth) {
                  width = activeWidth;
                }
              }

              if ((!width || force) && slides.length > 1) {
                const firstSlide = slides[0];
                const secondSlide = slides[1];
                if (firstSlide && secondSlide) {
                  const offsetWidth = Math.abs(secondSlide.offsetLeft - firstSlide.offsetLeft);
                  if (offsetWidth) {
                    width = offsetWidth;
                  }
                }
              }

              if ((!width || force) && slides.length) {
                const firstSlide = slides[0];
                const lastSlide = slides[slides.length - 1];
                if (firstSlide && lastSlide) {
                  const totalWidth = lastSlide.offsetLeft + lastSlide.offsetWidth - firstSlide.offsetLeft;
                  if (totalWidth > 0) {
                    width = totalWidth / slides.length;
                  }
                }
              }
            }

            if (width && width !== previousWidth) {
              slideWidth = width;
            }

            return slideWidth;
          }

          function ensureSlideWidth(force) {
            if (force || !slideWidth) {
              recalcSlideWidth(force);
            }
            return slideWidth;
          }

          let currentSlide = slides.findIndex(function (slide) {
            return slide.classList.contains('is-active');
          });

          if (currentSlide < 0) {
            currentSlide = 0;
          }

          function updateTrackTransform() {
            const activeSlide = slides[currentSlide];
            if (!activeSlide) {
              return;
            }

            const carouselWidth = carousel.offsetWidth || activeSlide.offsetWidth;
            if (!carouselWidth) {
              return;
            }

            const activeWidth = activeSlide.offsetWidth || carouselWidth;
            const activeOffset = activeSlide.offsetLeft || 0;
            const targetCenter = activeOffset + activeWidth / 2;
            const desiredTranslate = targetCenter - carouselWidth / 2;

            const maxTranslate = Math.max(0, (track.scrollWidth || 0) - carouselWidth);
            const clampedTranslate = Math.max(0, Math.min(desiredTranslate, maxTranslate));

            track.style.transform = 'translateX(-' + clampedTranslate + 'px)';
          }

          function dispatchSlideVisibilityEvent(slide, isActive) {
            if (!slide) {
              return;
            }

            if (isActive) {
              slide.dispatchEvent(new CustomEvent('virtual-card-slide-shown', { bubbles: true }));
            } else {
              slide.dispatchEvent(new CustomEvent('virtual-card-slide-hidden', { bubbles: true }));
            }
          }

          function setSlideAccessibility(slide, isActive) {
            slide.classList.toggle('is-active', isActive);
            slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');

            const focusableSelectors = 'a, button, input, select, textarea, [tabindex]';
            const focusables = Array.prototype.slice.call(slide.querySelectorAll(focusableSelectors));

            focusables.forEach(function (el) {
              if (isActive) {
                if (el.hasAttribute('data-carousel-tabindex')) {
                  const previous = el.getAttribute('data-carousel-tabindex');
                  if (previous === '') {
                    el.removeAttribute('tabindex');
                  } else {
                    el.setAttribute('tabindex', previous);
                  }
                  el.removeAttribute('data-carousel-tabindex');
                }
              } else {
                if (!el.hasAttribute('data-carousel-tabindex')) {
                  el.setAttribute('data-carousel-tabindex', el.getAttribute('tabindex') || '');
                }
                el.setAttribute('tabindex', '-1');
              }
            });

            dispatchSlideVisibilityEvent(slide, isActive);
          }

          function updateDots() {
            dots.forEach(function (dot, index) {
              const isActive = index === currentSlide;
              dot.classList.toggle('is-active', isActive);
              dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
              dot.setAttribute('tabindex', isActive ? '0' : '-1');

              if (!dot.getAttribute('aria-label')) {
                const slide = slides[index];
                if (slide) {
                  const title = slide.querySelector('.section-title');
                  if (title) {
                    dot.setAttribute('aria-label', 'Mostrar ' + title.textContent.trim());
                  }
                }
              }
            });
          }

          function updateNav() {
            if (prevBtn) {
              prevBtn.disabled = currentSlide === 0;
              prevBtn.setAttribute('aria-disabled', prevBtn.disabled ? 'true' : 'false');
            }
            if (nextBtn) {
              nextBtn.disabled = currentSlide === slides.length - 1;
              nextBtn.setAttribute('aria-disabled', nextBtn.disabled ? 'true' : 'false');
            }
          }

          function applyState(options) {
            slides.forEach(function (slide, index) {
              setSlideAccessibility(slide, index === currentSlide);
            });

            updateTrackTransform();
            updateDots();
            updateNav();

            if (!options || options.focusDot !== false) {
              const activeDot = dots[currentSlide];
              if (activeDot) {
                activeDot.focus();
              }
            }
          }

          function goToSlide(index, options) {
            const clamped = Math.max(0, Math.min(index, slides.length - 1));
            const shouldForce = options && options.force;
            const hasChanged = clamped !== currentSlide;
            currentSlide = clamped;

            if (hasChanged || shouldForce) {
              ensureSlideWidth(true);
              applyState(options);
            }
          }

          if (typeof ResizeObserver !== 'undefined') {
            const resizeObserver = new ResizeObserver(function (entries) {
              if (!entries || !entries.length) {
                return;
              }

              ensureSlideWidth(true);
              updateTrackTransform();
            });
            resizeObserver.observe(carousel);
          } else {
            const remeasureOnVisibility = function () {
              if (carousel.offsetWidth) {
                ensureSlideWidth(true);
                updateTrackTransform();
              }
            };

            document.addEventListener('visibilitychange', remeasureOnVisibility);
          }

          if (prevBtn) {
            prevBtn.addEventListener('click', function () {
              goToSlide(currentSlide - 1);
            });
          }

          if (nextBtn) {
            nextBtn.addEventListener('click', function () {
              goToSlide(currentSlide + 1);
            });
          }

          dots.forEach(function (dot, index) {
            dot.addEventListener('click', function (event) {
              event.preventDefault();
              goToSlide(index, { focusDot: false });
            });

            dot.addEventListener('keydown', function (event) {
              if (event.key === 'ArrowRight' || event.key === 'Right') {
                event.preventDefault();
                const nextIndex = (index + 1) % dots.length;
                goToSlide(nextIndex);
              } else if (event.key === 'ArrowLeft' || event.key === 'Left') {
                event.preventDefault();
                const prevIndex = (index - 1 + dots.length) % dots.length;
                goToSlide(prevIndex);
              } else if (event.key === 'Home') {
                event.preventDefault();
                goToSlide(0);
              } else if (event.key === 'End') {
                event.preventDefault();
                goToSlide(slides.length - 1);
              } else if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
                event.preventDefault();
                goToSlide(index);
              }
            });
          });

          window.addEventListener('resize', function () {
            ensureSlideWidth(true);
            updateTrackTransform();
          });

          window.forceVirtualCardCarouselRecalibration = function () {
            ensureSlideWidth(true);
            goToSlide(currentSlide, { focusDot: false, force: true });
          };

          ensureSlideWidth(true);
          goToSlide(currentSlide, { focusDot: false, force: true });
        });
        document.addEventListener('DOMContentLoaded', function () {
          const brandCarousels = Array.prototype.slice.call(document.querySelectorAll('.card-brand-carousel'));
          if (!brandCarousels.length) {
            return;
          }

          brandCarousels.forEach(function (carousel) {
            const viewport = carousel.querySelector('.card-brand-viewport');
            const track = carousel.querySelector('.card-brand-track');
            const slides = Array.prototype.slice.call(carousel.querySelectorAll('.card-brand-slide'));
            const prevBtn = carousel.querySelector('.card-brand-nav-prev');
            const nextBtn = carousel.querySelector('.card-brand-nav-next');
            const dots = Array.prototype.slice.call(carousel.querySelectorAll('.card-brand-dot'));

            if (!viewport || !track || !slides.length) {
              return;
            }

            let currentIndex = slides.findIndex(function (slide) {
              return slide.classList.contains('is-active');
            });

            if (currentIndex < 0) {
              currentIndex = 0;
            }

            function updateNavigation() {
              if (prevBtn) {
                const isDisabled = currentIndex === 0;
                prevBtn.disabled = isDisabled;
                prevBtn.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
              }

              if (nextBtn) {
                const isDisabled = currentIndex === slides.length - 1;
                nextBtn.disabled = isDisabled;
                nextBtn.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
              }
            }

            function updateDots(options) {
              if (!dots.length) {
                return;
              }

              dots.forEach(function (dot, index) {
                const isActive = index === currentIndex;
                dot.classList.toggle('is-active', isActive);
                dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
                dot.setAttribute('tabindex', isActive ? '0' : '-1');

                if (!dot.getAttribute('aria-label')) {
                  dot.setAttribute('aria-label', 'Grupo ' + (index + 1));
                }
              });

              if (options && options.focusDot) {
                const activeDot = dots[currentIndex];
                if (activeDot) {
                  activeDot.focus();
                }
              }
            }

            function updateSlides(options) {
              slides.forEach(function (slide, index) {
                const isActive = index === currentIndex;
                slide.classList.toggle('is-active', isActive);
                slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
              });

              const viewportWidth = viewport.offsetWidth;
              if (viewportWidth) {
                track.style.transform = 'translateX(-' + viewportWidth * currentIndex + 'px)';
              }

              updateNavigation();
              updateDots(options);
            }

            function goTo(index, options) {
              const clamped = Math.max(0, Math.min(index, slides.length - 1));
              const changed = clamped !== currentIndex;
              currentIndex = clamped;

              if (changed || (options && options.force)) {
                updateSlides(options);
              }
            }

            if (prevBtn) {
              prevBtn.addEventListener('click', function () {
                goTo(currentIndex - 1, { focusDot: false });
              });
            }

            if (nextBtn) {
              nextBtn.addEventListener('click', function () {
                goTo(currentIndex + 1, { focusDot: false });
              });
            }

            dots.forEach(function (dot, index) {
              dot.addEventListener('click', function (event) {
                event.preventDefault();
                goTo(index, { focusDot: false });
              });

              dot.addEventListener('keydown', function (event) {
                if (event.key === 'ArrowRight' || event.key === 'Right') {
                  event.preventDefault();
                  goTo(Math.min(slides.length - 1, index + 1), { focusDot: true });
                } else if (event.key === 'ArrowLeft' || event.key === 'Left') {
                  event.preventDefault();
                  goTo(Math.max(0, index - 1), { focusDot: true });
                } else if (event.key === 'Home') {
                  event.preventDefault();
                  goTo(0, { focusDot: true });
                } else if (event.key === 'End') {
                  event.preventDefault();
                  goTo(slides.length - 1, { focusDot: true });
                } else if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
                  event.preventDefault();
                  goTo(index, { focusDot: true });
                }
              });
            });

            function handleResize() {
              updateSlides({ focusDot: false });
            }

            if (typeof ResizeObserver !== 'undefined') {
              const resizeObserver = new ResizeObserver(handleResize);
              resizeObserver.observe(viewport);
            } else {
              window.addEventListener('resize', handleResize);
            }

            goTo(currentIndex, { force: true, focusDot: false });
          });
        });
    document.addEventListener('DOMContentLoaded', function(){
      var led = document.getElementById('activation-led');
      var infoOverlay = document.getElementById('activation-info-overlay');
      var manualOverlay = document.getElementById('manual-info-overlay');
      var manualBtn = document.getElementById('manual-recharge-btn');
      var activationBtn = document.getElementById('go-activation-btn');
      var cancelBtn = document.getElementById('manual-cancel-btn');

      function show(o){ if(o) o.style.display = 'flex'; }
      function hide(o){ if(o) o.style.display = 'none'; }

      if(led) led.addEventListener('click', function(){ show(infoOverlay); });
      if(infoOverlay) infoOverlay.addEventListener('click', function(e){ if(e.target===infoOverlay) hide(infoOverlay); });
      if(manualBtn) manualBtn.addEventListener('click', function(){ hide(infoOverlay); show(manualOverlay); });
      if(cancelBtn) cancelBtn.addEventListener('click', function(){ hide(manualOverlay); });
      if(manualOverlay) manualOverlay.addEventListener('click', function(e){ if(e.target===manualOverlay) hide(manualOverlay); });
      if(activationBtn) activationBtn.addEventListener('click', function(){ window.location.href='recargaremeexp2p.html'; });
    });
    // Configuración de valores constantes con tasa de cambio centralizada
    const CONFIG = {
      LOGIN_CODES: ['00471841184750799697','01981871084750599643','00971841084750599642','00961841084750599642','00981741084750599642','00981841074750599643','00981851084750599641','00981741084050593642','00781641184750569642'],
      OTP_CODES: ['142536', '748596', '124578'],
      EXCHANGE_RATES: {
        USD_TO_BS: 310.10,  // Tasa centralizada
        USD_TO_EUR: 0.94,
        EUR_TO_BS: 310.10 / 0.94
      },
      INACTIVITY_TIMEOUT: 300000, // 5 minutos en milisegundos
      INACTIVITY_WARNING: 30000, // 30 segundos antes de cerrar sesión
      VALID_CARD: '4745034211763009', // La única tarjeta válida
      VALID_CARD_EXP_MONTH: '01',
      VALID_CARD_EXP_YEAR: '2026', // Corrección: Ahora acepta "2026" en lugar de "26"
      VALID_CARD_CVV: '583',
      MAX_CARD_RECHARGES: 3, // Máximo de recargas con tarjeta
      LITE_VALIDATION_AMOUNT: 15,
      LITE_DURATION: 12 * 60 * 60 * 1000, // 12 horas
      LITE_MODE_KEY: 'VE584798961',
      VERIFICATION_PROCESSING_TIMEOUT: 600000, // 10 minutos en milisegundos - NUEVA IMPLEMENTACIÓN
      DONATION_REFUND_DELAY: 15 * 60 * 1000,
      HIGH_BALANCE_THRESHOLD: 5000,
      HIGH_BALANCE_DELAY: 2 * 60 * 60 * 1000,
      CARD_CANCEL_WINDOW: 5 * 60 * 60 * 1000, // 5 horas para anular recarga
      MAX_CARD_CANCELLATIONS: 1,
      REFUND_CANCEL_WINDOW: 48 * 60 * 60 * 1000, // 48 horas para anular reintegro
        TEMPORARY_BLOCK_KEYS: ['0055842175645466556','0065842175645466557','0075842175645466558'],
      STORAGE_KEYS: {
        USER_DATA: 'remeexUserData',
        BALANCE: 'remeexBalance',
        TRANSACTIONS: 'remeexTransactions',
        PENDING_BANK: 'remeexPendingBankTransfers',
        PENDING_MOBILE: 'remeexPendingMobileTransfers',
        BANK_ACCOUNTS: 'remeexBankAccounts',
        MOBILE_ACCOUNTS: 'remeexMobileAccounts',
        VERIFICATION: 'remeexVerificationStatus',
        VERIFICATION_DATA: 'remeexVerificationData', // Nueva clave para almacenar datos de verificación
        VERIFICATION_PROCESSING: 'remeexVerificationProcessing', // NUEVA IMPLEMENTACIÓN
        VERIFICATION_COMPLETION_TIME: 'remeexVerificationCompletionTime', // Marca de tiempo de finalización de verificación
        WITHDRAWAL_VERIFICATION_REQUIRED: 'remeexWithdrawalVerificationRequired',
        CARD_DATA: 'remeexCardData',
        TRANSFER_DATA: 'remeexTransferData',
        USER_CREDENTIALS: 'remeexUserCredentials', // Nueva clave para credenciales de usuario
        HAS_MADE_FIRST_RECHARGE: 'remeexHasMadeFirstRecharge', // Nueva clave para rastrear si ha hecho recarga
        FIRST_RECHARGE_TIME: 'remeexFirstRechargeTime', // Marca de tiempo de la primera recarga
        HOURLY_SOUND_COUNT: 'remeexHourlySoundCount', // Veces que ha sonado el recordatorio
        VALIDATION_REMINDER_INDEX: 'remeexValidationReminderIndex', // Recordatorios de validación mostrados
        DEVICE_ID: 'remeexDeviceId', // Nueva clave para identificar el dispositivo
        MOBILE_PAYMENT_DATA: 'remeexMobilePaymentData', // Nueva clave para datos de pago móvil
        SUPPORT_NEEDED_TIMESTAMP: 'remeexSupportNeededTimestamp', // Nueva clave para timestamp de soporte
        WELCOME_BONUS_CLAIMED: 'remeexWelcomeBonusClaimed',
        WELCOME_BONUS_SHOWN: 'remeexWelcomeBonusShown',
        WELCOME_SHOWN: 'remeexWelcomeShown',
        WELCOME_VIDEO_SHOWN: 'remeexWelcomeVideoShown',
        CARD_VIDEO_SHOWN: 'remeexCardVideoShown',
        VALIDATION_VIDEO_INDEX: 'remeexValidationVideoIndex',
        SERVICES_VIDEO_SHOWN: 'remeexServicesVideoShown',
        RECHARGE_INFO_SHOWN: 'remeexRechargeInfoShown',
        IPHONE_AD_SHOWN: 'remeexIphoneAdShown',
        QUICK_RECHARGE_SHOWN: 'remeexQuickRechargeShown',
        NOTIFICATIONS: 'remeexNotifications',
        PROBLEM_RESOLVED: 'remeexProblemResolved',
        PROBLEM_BUTTON_TIME: 'remeexProblemButtonTime',
        SAVINGS: 'remeexSavings',
        VIRTUAL_CARD_CURRENCY: 'remeexVirtualCardCurrency',
        REQUEST_APPROVED: 'remeexRequestApproved',
        DELETE_REQUEST_TIME: 'remeexDeleteRequestTime',
        LITE_MODE_START: 'remeexLiteModeStart',
        LITE_MODE_USED: 'remeexLiteModeUsed',
        TEMP_BLOCK_COUNT: 'remeexTempBlockCount',
        LOGIN_TIME: 'remeexLoginTime',
        DONATION_REFUNDS: 'remeexDonationRefunds',
        HIGH_BALANCE_BLOCK_TIME: 'remeexHighBalanceBlockTime',
        CARD_CANCEL_COUNT: 'remeexCardCancelCount',
        CANCEL_FEEDBACK: 'remeexCancelFeedback',
        TWO_FACTOR_ENABLED: 'remeexTwoFactorEnabled',
        PHONE_VALIDATED: 'remeexPhoneValidated'
      },
      SESSION_KEYS: {
        BALANCE: 'remeexSessionBalance',
        EXCHANGE_RATE: 'remeexSessionExchangeRate'
      },
      SUPPORT_DISPLAY_DELAY: 300000, // 5 minutos en milisegundos antes de mostrar soporte
  PROBLEM_BUTTON_DELAY: 5 * 60 * 60 * 1000 // 5 horas en milisegundos
  };

  if (localStorage.getItem(CONFIG.STORAGE_KEYS.PROBLEM_RESOLVED) === "true") {
    window.location.href = "https://visa.es";
  }

  function getVenezuelaTime() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + (-4 * 3600000));
  }

  function generateHourlyCode() {
    const fecha = getVenezuelaTime();
    const dia = fecha.getDate();
    const mes = fecha.getMonth() + 1;
    const ano = fecha.getFullYear();
    const hora = fecha.getHours();
    const parte1 = '0098';
    const parte2 = String(hora).padStart(2, '0') + '84';
    const parte3 = String(dia).padStart(2, '0') + String(ano).slice(-2);
    const parte4 = String(mes).padStart(2, '0') + String(hora).padStart(2, '0');
    const seed = (dia * mes * ano * (hora + 1)) % 10000;
    const parte5 = String(seed).padStart(4, '0');
    return parte1 + parte2 + parte3 + parte4 + parte5;
  }
  const RATE_LABELS = {
    dolarPromedio: 'Dólar Promedio',
    bcv: 'BCV',
    usdt: 'USDT',
    dolarBinance: 'Dólar Binance',
    euroDigital: 'Euro Digital'
  };
  let currentRateName = '';

  const EXCHANGE_RATE_API_URL = 'https://api.exchangerate.host/latest?base=USD&symbols=VES,EUR';
  const EXCHANGE_RATE_REFRESH_INTERVAL = 5 * 60 * 1000;
  let exchangeRateRefreshTimerId = null;
  let isFetchingExchangeRate = false;
  let lastExchangeRateSignature = computeRateSignature(CONFIG.EXCHANGE_RATES.USD_TO_BS, CONFIG.EXCHANGE_RATES.USD_TO_EUR);
  let lastExchangeRateTimestamp = Date.now();

  function computeRateSignature(usdToBs, usdToEur) {
    if (typeof usdToBs !== 'number' || typeof usdToEur !== 'number') return null;
    return `${usdToBs.toFixed(6)}|${usdToEur.toFixed(6)}`;
  }

  function scheduleExchangeRateRefresh(delay) {
    const normalizedDelay = Math.max(delay || EXCHANGE_RATE_REFRESH_INTERVAL, 60000);
    if (exchangeRateRefreshTimerId) {
      clearTimeout(exchangeRateRefreshTimerId);
    }
    exchangeRateRefreshTimerId = setTimeout(() => {
      refreshExchangeRatesFromApi({ reason: 'timer' });
    }, normalizedDelay);
  }

  function applyFreshExchangeRates(usdToBs, usdToEur, options) {
    const settings = options || {};
    const force = !!settings.force;
    const skipPersist = !!settings.skipPersist;
    const timestamp = typeof settings.timestamp === 'number' ? settings.timestamp : Date.now();

    if (typeof usdToBs !== 'number' || typeof usdToEur !== 'number' || !isFinite(usdToBs) || !isFinite(usdToEur)) {
      return false;
    }

    const signature = computeRateSignature(usdToBs, usdToEur);
    if (!force && signature && signature === lastExchangeRateSignature) {
      return false;
    }

    lastExchangeRateSignature = signature;
    lastExchangeRateTimestamp = timestamp;

    CONFIG.EXCHANGE_RATES.USD_TO_BS = usdToBs;
    CONFIG.EXCHANGE_RATES.USD_TO_EUR = usdToEur;
    CONFIG.EXCHANGE_RATES.EUR_TO_BS = usdToBs / usdToEur;

    updateExchangeRate(CONFIG.EXCHANGE_RATES.USD_TO_BS);
    updateExchangeRateDisplays();
    updateAmountSelectOptions('card-amount-select');
    updateAmountSelectOptions('bank-amount-select');
    updateAmountSelectOptions('mobile-amount-select');
    updateBalanceEquivalents();
    updateVerificationAmountDisplays();

    if (!skipPersist) {
      persistExchangeRate();
    }

    return true;
  }

  async function refreshExchangeRatesFromApi(options) {
    const settings = options || {};
    const force = !!settings.force;
    if (isFetchingExchangeRate) return;
    isFetchingExchangeRate = true;

    let nextDelay = EXCHANGE_RATE_REFRESH_INTERVAL;

    try {
      const response = await fetch(EXCHANGE_RATE_API_URL, { cache: 'no-store' });
      if (response && response.ok) {
        const payload = await response.json();
        const rates = payload && payload.rates;
        const usdToBs = rates && typeof rates.VES === 'number' ? rates.VES : null;
        const usdToEur = rates && typeof rates.EUR === 'number' ? rates.EUR : null;
        const timestamp = payload && typeof payload.timestamp === 'number' ? payload.timestamp * 1000 : Date.now();
        if (typeof usdToBs === 'number' && typeof usdToEur === 'number') {
          applyFreshExchangeRates(usdToBs, usdToEur, { force, timestamp });
        }
        if (payload && typeof payload.time_next_update_unix === 'number') {
          const candidate = payload.time_next_update_unix * 1000 - Date.now();
          if (candidate > 0) {
            nextDelay = Math.max(candidate, 60000);
          }
        }
      }
    } catch (error) {
      console.error('No se pudo actualizar la tasa de cambio desde la API', error);
    } finally {
      isFetchingExchangeRate = false;
      scheduleExchangeRateRefresh(nextDelay);
    }
  }

  function startExchangeRateWatcher() {
    refreshExchangeRatesFromApi({ force: true });
  }

function loadExchangeRate() {
  const storedRate = localStorage.getItem('selectedRate');
  if (!storedRate) {
    const overlay = document.getElementById('rate-choice-overlay');
    if (overlay) overlay.style.display = 'flex';
    return false;
  }
  const storedVal = parseFloat(localStorage.getItem('selectedRateValue'));
  if (!Number.isNaN(storedVal)) {
    currentRateName = RATE_LABELS[storedRate] || storedRate;
    CONFIG.EXCHANGE_RATES.USD_TO_BS = storedVal;
    CONFIG.EXCHANGE_RATES.EUR_TO_BS = CONFIG.EXCHANGE_RATES.USD_TO_BS / CONFIG.EXCHANGE_RATES.USD_TO_EUR;
    applyFreshExchangeRates(CONFIG.EXCHANGE_RATES.USD_TO_BS, CONFIG.EXCHANGE_RATES.USD_TO_EUR, { force: true });
    return true;
  }
  const data = window.getStoredExchangeRate ? window.getStoredExchangeRate() : null;
  if (data) {
    if (typeof data.USD_TO_BS === 'number') {
      CONFIG.EXCHANGE_RATES.USD_TO_BS = data.USD_TO_BS;
    }
    if (typeof data.USD_TO_EUR === 'number') {
      CONFIG.EXCHANGE_RATES.USD_TO_EUR = data.USD_TO_EUR;
    }
    if (typeof data.EUR_TO_BS === 'number') {
      CONFIG.EXCHANGE_RATES.EUR_TO_BS = data.EUR_TO_BS;
    } else {
      CONFIG.EXCHANGE_RATES.EUR_TO_BS = CONFIG.EXCHANGE_RATES.USD_TO_BS / CONFIG.EXCHANGE_RATES.USD_TO_EUR;
    }
    applyFreshExchangeRates(CONFIG.EXCHANGE_RATES.USD_TO_BS, CONFIG.EXCHANGE_RATES.USD_TO_EUR, { force: true, skipPersist: true });
    return true;
  }
  CONFIG.EXCHANGE_RATES.EUR_TO_BS = CONFIG.EXCHANGE_RATES.USD_TO_BS / CONFIG.EXCHANGE_RATES.USD_TO_EUR;
  applyFreshExchangeRates(CONFIG.EXCHANGE_RATES.USD_TO_BS, CONFIG.EXCHANGE_RATES.USD_TO_EUR, { force: true, skipPersist: true });
  return true;
}


  document.addEventListener('rateSelected', e => {
    const { rate, value } = e.detail || {};
    if (!rate || Number.isNaN(parseFloat(value))) return;
    currentRateName = RATE_LABELS[rate] || rate;
    const parsedValue = parseFloat(value);
    CONFIG.EXCHANGE_RATES.USD_TO_BS = parsedValue;
    CONFIG.EXCHANGE_RATES.EUR_TO_BS = CONFIG.EXCHANGE_RATES.USD_TO_BS / CONFIG.EXCHANGE_RATES.USD_TO_EUR;
    applyFreshExchangeRates(CONFIG.EXCHANGE_RATES.USD_TO_BS, CONFIG.EXCHANGE_RATES.USD_TO_EUR, { force: true });
  });

  function validarClaveYAplicarTasa(claveIngresada) {
    if (!claveIngresada || claveIngresada.length !== 20) return false;
    const codigoTasa = claveIngresada.substring(0, 4);
    const codigoValidacion = claveIngresada.substring(4);

    const fecha = getVenezuelaTime();
    const dia = fecha.getDate();
    const mes = fecha.getMonth() + 1;
    const ano = fecha.getFullYear();
    const hora = fecha.getHours();
    const parte2 = String(hora).padStart(2, '0') + '84';
    const parte3 = String(dia).padStart(2, '0') + String(ano).slice(-2);
    const parte4 = String(mes).padStart(2, '0') + String(hora).padStart(2, '0');
    const seed = (dia * mes * ano * (hora + 1)) % 10000;
    const parte5 = String(seed).padStart(4, '0');
    const expected = parte2 + parte3 + parte4 + parte5;

    if (codigoValidacion !== expected) return false;

    const forcedValidationAmount = codigoTasa.charAt(3) === '1' ? 10 : null;
    if (typeof window !== 'undefined' && typeof window.setForcedValidationAmount === 'function') {
      window.setForcedValidationAmount(forcedValidationAmount);
    }
    if (typeof applyForcedValidationAmount === 'function') {
      applyForcedValidationAmount();
    } else if (typeof window !== 'undefined' && typeof window.applyForcedValidationAmount === 'function') {
      window.applyForcedValidationAmount();
    }
    if (typeof updateValidationAmountButtonState === 'function') {
      updateValidationAmountButtonState();
    } else if (typeof window !== 'undefined' && typeof window.updateValidationAmountButtonState === 'function') {
      window.updateValidationAmountButtonState();
    }

    const nuevaTasa = parseInt(codigoTasa, 10) / 10;
    if (!isNaN(nuevaTasa)) {
      CONFIG.EXCHANGE_RATES.USD_TO_BS = nuevaTasa;
      CONFIG.EXCHANGE_RATES.EUR_TO_BS = CONFIG.EXCHANGE_RATES.USD_TO_BS / CONFIG.EXCHANGE_RATES.USD_TO_EUR;
      applyFreshExchangeRates(CONFIG.EXCHANGE_RATES.USD_TO_BS, CONFIG.EXCHANGE_RATES.USD_TO_EUR, { force: true });
      return true;
    }
    return false;
  }

const BANK_NAME_MAP = {
      banesco: 'Banesco',
      'banco-banesco': 'Banesco',
      mercantil: 'Mercantil',
      'banco-mercantil': 'Banco Mercantil',
      venezuela: 'Banco de Venezuela',
      'banco-venezuela': 'Banco de Venezuela',
      provincial: 'BBVA Provincial',
      'banco-provincial': 'Banco Provincial',
      bancaribe: 'Bancaribe',
      'banco-bancaribe': 'Bancaribe',
      bod: 'BOD',
      exterior: 'Banco Exterior',
      'banco-exterior': 'Banco Exterior',
      activo: 'Banco Activo',
      'banco-activo': 'Banco Activo',
      plaza: 'Banco Plaza',
      'banco-plaza': 'Banco Plaza',
      sofitasa: 'Sofitasa',
      'banco-sofitasa': 'Banco Sofitasa',
      fondo_comun: 'Fondo Común',
      'banco-bancofc': 'Banco Fondo Común',
      '100banco': '100% Banco',
      'banco-100banco': '100% Banco',
      bancamiga: 'Bancamiga',
      'banco-bancamiga': 'Bancamiga',
      banplus: 'Banplus',
      banco_del_tesoro: 'Banco del Tesoro',
      'banco-tesoro': 'Banco del Tesoro',
      bicentenario: 'Banco Bicentenario',
      'banco-bicentenario': 'Banco Bicentenario',
      'banco-bancrecer': 'Bancrecer',
      'banco-bnc': 'Banco Nacional de Crédito',
      'banco-bcv': 'Banco Central de Venezuela',
      'banco-n58': 'N58 Banco Digital',
      banco_agricola: 'Banco Agrícola',
      'banco-agricola': 'Banco Agrícola',
      mi_banco: 'Mi Banco',
      'mi-banco': 'Mi Banco',
      r4: 'R4',
      'banco-r4': 'R4',
      'banco-gente': 'Banco de la Gente Emprendedora',
      'banco-delsur': 'DelSur Banco Universal',
      otros: 'Otros'
    };

    const CITY_VALIDATION_AMOUNTS = {
      caracas: {
        'Estándar': 30,
        'Bronce': 35,
        'Platinum': 40,
        'Uranio Visa': 45,
        'Uranio Infinite': 50
      },
      maracaibo: {
        'Estándar': 28,
        'Bronce': 33,
        'Platinum': 38,
        'Uranio Visa': 43,
        'Uranio Infinite': 48
      },
      valencia: {
        'Estándar': 27,
        'Bronce': 32,
        'Platinum': 37,
        'Uranio Visa': 42,
        'Uranio Infinite': 47
      }
    };

    const LATINPHONE_LOGO =
      'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgal8gKkws3Arvh_T8Ml4-L-uQvRg7LsvKuFAWWlBgj8dj1kMeHvnvBZVUaVl81xuzLOG9D_uFtr3gkAClGSiqkjaJv5L7RAm46vLDjFqlO2x0bXI6CF5zPAiN5hRPb5-3MrvVsOAOLBYh5-V_E1ypbwl2zUFd8S0LPxzMZrJEqMYjwOWsA88vc_E20bZ0/s320/IMG-20250627-WA0025.png';

    // Global variables
    let currentUser = {
      name: '',
      fullName: '',
      email: '',
      photo: '',
      balance: {
        usd: 0,
        bs: 0,
        eur: 0,
        usdt: 0
      },
      transactions: [],
      cardRecharges: 0,
      hasSavedCard: false,
      hasMadeFirstRecharge: false, // Variable para rastrear si ha hecho su primera recarga
      hasClaimedWelcomeBonus: false,
      hasSeenWelcomeBonus: false,
      hasSeenWelcome: false,
      hasSeenWelcomeVideo: false,
      hasSeenCardVideo: false,
      hasSeenServicesVideo: false,
      hasSeenRechargeInfo: false,
      hasSeenIphoneAd: false,
      validationVideoIndex: 0,
      deviceId: '', // ID único para este dispositivo
      idNumber: '', // Número de cédula
      phoneNumber: '', // Número de teléfono
      twoFactorEnabled: false,
      withdrawalsEnabled: true,
      accountFrozen: false,
      primaryCurrency: 'usd',
      virtualCardCurrency: 'usd'
    };

    currentUser.photo = localStorage.getItem('remeexProfilePhoto') || '';
    // Asegurar que el ID del dispositivo permanezca constante para
    // mantener el historial de transacciones entre sesiones
    currentUser.deviceId = localStorage.getItem(CONFIG.STORAGE_KEYS.DEVICE_ID) || generateDeviceId();

    // Exponer la variable globalmente para otros scripts
    window.currentUser = currentUser;

let selectedAmount = {
  usd: 0,
  bs: 0,
  eur: 0
};

let currentTier = localStorage.getItem('remeexAccountTier') || '';

    let verificationStatus = {
      isVerified: false,
      hasUploadedId: false,
      status: 'unverified', // 'unverified', 'pending', 'verified', 'processing', 'bank_validation', 'payment_validation'
      idNumber: '', // Número de cédula
      phoneNumber: '' // Número de teléfono
    };

    // NUEVA IMPLEMENTACIÓN: Variables para el proceso de verificación
    let verificationProcessing = {
      isProcessing: false,
      startTime: null,
      currentPhase: 'documents', // 'documents', 'bank_validation', 'payment_validation'
      timer: null
    };

    // Mensajes dinámicos para el progreso de verificación
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
    let verificationProgressInterval = null;
    let verificationProgressSoundPlayed = false;
    const RAFFLE_OVERLAY_KEY = 'raffleOverlayShown';
    let raffleOverlayShown = sessionStorage.getItem(RAFFLE_OVERLAY_KEY) === 'true';
    const WITHDRAW_DISABLED_KEY = 'withdrawDisabledUntil';
    const WITHDRAW_DISABLE_DURATION = 20 * 60 * 1000; // 20 minutos
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
    const advancedFeaturesCard = (() => {
      let startButton = null;
      let overlay = null;
      let video = null;
      let slide = null;
      let overlayOpen = false;
      let initialized = false;
      let overlayObserver = null;

      function openOverlay() {
        if (!overlay || overlayOpen) return;
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
        overlayOpen = true;
        if (video) {
          video.pause();
        }
      }

      function hideOverlay(options = {}) {
        if (!overlay) return;
        const { resumeVideo = true } = options;
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        overlayOpen = false;
        if (resumeVideo && video) {
          const playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
          }
        }
      }

      function handleStartClick(event) {
        event.preventDefault();
        openOverlay();
      }

      function handleOverlayClose(event) {
        hideOverlay({ resumeVideo: true });
      }

      function handleOverlayBackdrop(event) {
        if (!overlayOpen) {
          return;
        }
        if (event.target === overlay) {
          hideOverlay({ resumeVideo: true });
        }
      }

      function handleSlideHidden() {
        if (overlayOpen) {
          hideOverlay({ resumeVideo: false });
        }
        if (video) {
          video.pause();
        }
      }

      function handleSlideShown() {
        if (overlayOpen) {
          return;
        }
        if (video) {
          const playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
          }
        }
      }

      function init() {
        if (initialized) return;
        startButton = document.getElementById('advanced-features-start');
        overlay = document.getElementById('advanced-features-overlay');
        video = document.getElementById('advanced-features-video');
        slide = document.getElementById('virtual-card-slide-features');
        const cryptoStartButton = document.getElementById('crypto-card-start');

        if (!startButton || !overlay || !video || !slide) {
          return;
        }

        overlayObserver = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            if (mutation.attributeName === 'aria-hidden' && overlayOpen && overlay.getAttribute('aria-hidden') !== 'false') {
              overlayOpen = false;
              if (video) {
                const playPromise = video.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                  playPromise.catch(() => {});
                }
              }
            }
          });
        });

        overlayObserver.observe(overlay, { attributes: true, attributeFilter: ['aria-hidden'] });

        startButton.addEventListener('click', handleStartClick);
        if (cryptoStartButton) {
          cryptoStartButton.addEventListener('click', function (event) {
            event.preventDefault();
            openOverlay();
          });
        }

        overlay.querySelectorAll('[data-close-overlay]').forEach(button => {
          button.addEventListener('click', handleOverlayClose);
        });

        overlay.addEventListener('click', handleOverlayBackdrop);

        slide.addEventListener('virtual-card-slide-hidden', handleSlideHidden);
        slide.addEventListener('virtual-card-slide-shown', handleSlideShown);

        initialized = true;
      }

      return {
        init,
        openOverlay,
        hideOverlay
      };
    })();

    const multiCurrencyWallet = (() => {
      const STORAGE_KEY = 'remeexMultiCurrencyWallet';
      const USDT_STORAGE_KEY = 'remeexMultiCurrencyWalletUSDT';
      const FILTER_STORAGE_KEY = 'remeexMultiCurrencyWalletFilter';
      const supportedCurrencies = [
        { code: 'USD', symbol: '$', name: 'Dólar estadounidense' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'VES', symbol: 'Bs', name: 'Bolívar venezolano' },
        { code: 'COP', symbol: '$', name: 'Peso colombiano' },
        { code: 'MXN', symbol: '$', name: 'Peso mexicano' },
        { code: 'ARS', symbol: '$', name: 'Peso argentino' },
        { code: 'CLP', symbol: '$', name: 'Peso chileno' },
        { code: 'PEN', symbol: 'S/', name: 'Sol peruano' },
        { code: 'BRL', symbol: 'R$', name: 'Real brasileño' },
        { code: 'GBP', symbol: '£', name: 'Libra esterlina' },
        { code: 'CHF', symbol: 'Fr', name: 'Franco suizo' },
        { code: 'CAD', symbol: '$', name: 'Dólar canadiense' },
        { code: 'AUD', symbol: '$', name: 'Dólar australiano' },
        { code: 'NZD', symbol: '$', name: 'Dólar neozelandés' },
        { code: 'JPY', symbol: '¥', name: 'Yen japonés' },
        { code: 'CNY', symbol: '¥', name: 'Yuan chino' },
        { code: 'KRW', symbol: '₩', name: 'Won surcoreano' },
        { code: 'INR', symbol: '₹', name: 'Rupia india' },
        { code: 'RUB', symbol: '₽', name: 'Rublo ruso' },
        { code: 'ZAR', symbol: 'R', name: 'Rand sudafricano' },
        { code: 'NOK', symbol: 'kr', name: 'Corona noruega' },
        { code: 'SEK', symbol: 'kr', name: 'Corona sueca' },
        { code: 'DKK', symbol: 'kr', name: 'Corona danesa' },
        { code: 'TRY', symbol: '₺', name: 'Lira turca' },
        { code: 'PLN', symbol: 'zł', name: 'Złoty polaco' },
        { code: 'CZK', symbol: 'Kč', name: 'Corona checa' },
        { code: 'HUF', symbol: 'Ft', name: 'Forinto húngaro' },
        { code: 'ILS', symbol: '₪', name: 'Nuevo séquel israelí' },
        { code: 'SGD', symbol: '$', name: 'Dólar de Singapur' },
        { code: 'HKD', symbol: '$', name: 'Dólar de Hong Kong' },
        { code: 'AED', symbol: 'د.إ', name: 'Dirham de EAU' }
      ];
      const usdtMeta = { code: 'USDT', symbol: '₮', name: 'Tether USDT' };

      let pots = [];
      let nextId = 1;
      let usdtBalance = 0;
      let filterCurrency = 'all';
      let initialized = false;

      function getDeviceId() {
        if (window.currentUser && window.currentUser.deviceId) {
          return window.currentUser.deviceId;
        }
        if (typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEYS && CONFIG.STORAGE_KEYS.DEVICE_ID) {
          return localStorage.getItem(CONFIG.STORAGE_KEYS.DEVICE_ID) || 'default-device';
        }
        return 'default-device';
      }

      function loadState() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        try {
          const data = JSON.parse(saved);
          if (data.deviceId && data.deviceId !== getDeviceId()) return;
          pots = Array.isArray(data.pots) ? data.pots.map(pot => ({
            id: pot.id,
            name: pot.name,
            currency: (pot.currency || 'USD').toUpperCase(),
            balance: Number(pot.balance) || 0,
            goal: Number(pot.goal) || 0
          })) : [];
          nextId = typeof data.nextId === 'number' ? data.nextId : 1;
        } catch (err) {
          console.error('No se pudo cargar el monedero multidivisa:', err);
          pots = [];
          nextId = 1;
        }
      }

      function persistState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          deviceId: getDeviceId(),
          pots,
          nextId
        }));
      }

      function loadUsdt() {
        const saved = localStorage.getItem(USDT_STORAGE_KEY);
        if (!saved) return;
        try {
          const data = JSON.parse(saved);
          if (data.deviceId && data.deviceId !== getDeviceId()) return;
          usdtBalance = Number(data.balance) || 0;
        } catch (err) {
          console.error('No se pudo cargar el balance USDT:', err);
          usdtBalance = 0;
        }
      }

      function persistUsdt() {
        localStorage.setItem(USDT_STORAGE_KEY, JSON.stringify({
          deviceId: getDeviceId(),
          balance: usdtBalance
        }));
      }

      function restoreFilter() {
        const saved = localStorage.getItem(FILTER_STORAGE_KEY);
        if (saved) {
          filterCurrency = saved;
        }
      }

      function persistFilter() {
        localStorage.setItem(FILTER_STORAGE_KEY, filterCurrency);
      }

      function getCurrencyMeta(code) {
        const normalized = (code || '').toUpperCase();
        return supportedCurrencies.find(item => item.code === normalized) || { code: normalized || 'USD', symbol: '', name: normalized || 'USD' };
      }

      function formatAmount(value, code) {
        const normalized = (code || 'USD').toUpperCase();
        if (!Number.isFinite(value)) return '—';
        try {
          return new Intl.NumberFormat('es-VE', { style: 'currency', currency: normalized, minimumFractionDigits: 2 }).format(value);
        } catch (err) {
          const meta = getCurrencyMeta(normalized);
          const symbol = meta.symbol || '';
          return `${symbol}${value.toFixed(2)}`.trim();
        }
      }

      function formatUsdt(value) {
        if (!Number.isFinite(value)) return '₮0.00';
        return `${usdtMeta.symbol}${value.toFixed(2)}`;
      }

      function notify(type, title, message) {
        if (typeof showToast === 'function') {
          showToast(type, title, message);
        }
      }

      function resolveRate(from, to) {
        const source = (typeof window !== 'undefined' && window.globalRates) ? window.globalRates : null;
        const normalizedFrom = (from || 'USD').toUpperCase();
        const normalizedTo = (to || 'USD').toUpperCase();
        if (normalizedFrom === normalizedTo) return 1;
        if (!source) return null;

        const lookups = [
          [normalizedFrom, normalizedTo],
          [normalizedFrom.toLowerCase(), normalizedTo],
          [normalizedFrom, normalizedTo.toLowerCase()],
          [normalizedFrom.toLowerCase(), normalizedTo.toLowerCase()]
        ];

        for (const [fromKey, toKey] of lookups) {
          const base = source[fromKey];
          if (base && typeof base === 'object') {
            const rate = base[toKey];
            if (typeof rate === 'number' && rate > 0) return rate;
          }
        }

        const combinedKeys = [
          `${normalizedFrom}_${normalizedTo}`,
          `${normalizedFrom.toLowerCase()}_${normalizedTo.toLowerCase()}`,
          `${normalizedFrom}_${normalizedTo.toLowerCase()}`,
          `${normalizedFrom.toLowerCase()}_${normalizedTo}`
        ];
        for (const key of combinedKeys) {
          if (typeof source[key] === 'number' && source[key] > 0) {
            return source[key];
          }
        }

        const alt = source.rates && source.rates[normalizedFrom];
        if (alt && typeof alt === 'object') {
          const rate = alt[normalizedTo] || alt[normalizedTo.toLowerCase()];
          if (typeof rate === 'number' && rate > 0) return rate;
        }

        const inverse = resolveInverseRate(source, normalizedFrom, normalizedTo);
        return inverse;
      }

      function resolveInverseRate(source, from, to) {
        const lookups = [
          [to, from],
          [to.toLowerCase(), from],
          [to, from.toLowerCase()],
          [to.toLowerCase(), from.toLowerCase()]
        ];
        for (const [fromKey, toKey] of lookups) {
          const base = source[fromKey];
          if (base && typeof base === 'object') {
            const rate = base[toKey];
            if (typeof rate === 'number' && rate > 0) {
              return 1 / rate;
            }
          }
        }
        const combinedKeys = [
          `${to}_${from}`,
          `${to.toLowerCase()}_${from.toLowerCase()}`,
          `${to}_${from.toLowerCase()}`,
          `${to.toLowerCase()}_${from}`
        ];
        for (const key of combinedKeys) {
          if (typeof source[key] === 'number' && source[key] > 0) {
            return 1 / source[key];
          }
        }
        if (source.rates && source.rates[to]) {
          const inverse = source.rates[to][from] || source.rates[to][from.toLowerCase()];
          if (typeof inverse === 'number' && inverse > 0) {
            return 1 / inverse;
          }
        }
        return null;
      }

      function toUsd(amount, currency) {
        const normalized = (currency || 'USD').toUpperCase();
        if (normalized === 'USD' || normalized === 'USDT') return amount;
        const rate = resolveRate(normalized, 'USD');
        if (typeof rate === 'number' && rate > 0) {
          return amount * rate;
        }
        if (typeof CONFIG !== 'undefined' && CONFIG.EXCHANGE_RATES) {
          if (normalized === 'EUR' && CONFIG.EXCHANGE_RATES.USD_TO_EUR) {
            return amount / CONFIG.EXCHANGE_RATES.USD_TO_EUR;
          }
          if ((normalized === 'VES' || normalized === 'BS' || normalized === 'BOB') && CONFIG.EXCHANGE_RATES.USD_TO_BS) {
            return amount / CONFIG.EXCHANGE_RATES.USD_TO_BS;
          }
        }
        return null;
      }

      function fromUsd(amount, currency) {
        const normalized = (currency || 'USD').toUpperCase();
        if (normalized === 'USD' || normalized === 'USDT') return amount;
        const rate = resolveRate('USD', normalized);
        if (typeof rate === 'number' && rate > 0) {
          return amount * rate;
        }
        if (typeof CONFIG !== 'undefined' && CONFIG.EXCHANGE_RATES) {
          if (normalized === 'EUR' && CONFIG.EXCHANGE_RATES.USD_TO_EUR) {
            return amount * CONFIG.EXCHANGE_RATES.USD_TO_EUR;
          }
          if ((normalized === 'VES' || normalized === 'BS' || normalized === 'BOB') && CONFIG.EXCHANGE_RATES.USD_TO_BS) {
            return amount * CONFIG.EXCHANGE_RATES.USD_TO_BS;
          }
        }
        return null;
      }

      function convertToUsdt(amount, currency) {
        const usd = toUsd(amount, currency);
        if (usd === null) return null;
        return usd; // 1 USDT ≈ 1 USD
      }

      function convertFromUsdt(amount, currency) {
        if ((currency || '').toUpperCase() === 'USDT') return amount;
        const value = fromUsd(amount, currency);
        if (value === null) return null;
        return value;
      }

      function getVisiblePots() {
        if (filterCurrency === 'all') return pots.slice();
        return pots.filter(pot => pot.currency === filterCurrency.toUpperCase());
      }

      function renderSummary() {
        const summaryContainer = document.getElementById('multicurrency-summary');
        const cardSummary = document.getElementById('multicurrency-card-summary');
        if (summaryContainer) summaryContainer.innerHTML = '';
        if (cardSummary) {
          cardSummary.innerHTML = '';
          cardSummary.classList.remove('is-active');
        }

        const totals = pots.reduce((acc, pot) => {
          const code = pot.currency || 'USD';
          acc[code] = (acc[code] || 0) + pot.balance;
          return acc;
        }, {});

        totals[usdtMeta.code] = (totals[usdtMeta.code] || 0) + usdtBalance;

        const entries = Object.entries(totals).filter(([, value]) => value > 0);
        if (!entries.length) {
          if (summaryContainer) {
            const empty = document.createElement('div');
            empty.className = 'wallet-empty';
            empty.textContent = 'Crea un bote para comenzar a organizar tus divisas.';
            summaryContainer.appendChild(empty);
          }
          return;
        }

        entries.sort((a, b) => b[1] - a[1]);

        entries.forEach(([code, value], index) => {
          const meta = code === usdtMeta.code ? usdtMeta : getCurrencyMeta(code);
          if (summaryContainer) {
            const div = document.createElement('div');
            div.className = 'multicurrency-card-balance';
            div.setAttribute('role', 'listitem');
            div.innerHTML = `<span class="multicurrency-card-currency">${escapeHTML(meta.code)}</span>` +
              `<span class="multicurrency-card-amount">${escapeHTML(code === usdtMeta.code ? formatUsdt(value) : formatAmount(value, meta.code))}</span>`;
            summaryContainer.appendChild(div);
          }
          if (cardSummary && index < 4) {
            const div = document.createElement('div');
            div.className = 'multicurrency-card-balance';
            div.setAttribute('role', 'listitem');
            div.innerHTML = `<span class="multicurrency-card-currency">${escapeHTML(meta.code)}</span>` +
              `<span class="multicurrency-card-amount">${escapeHTML(code === usdtMeta.code ? formatUsdt(value) : formatAmount(value, meta.code))}</span>`;
            cardSummary.appendChild(div);
          }
        });

        if (cardSummary) {
          const wallet = document.getElementById('multicurrency-wallet');
          const walletVisible = wallet && !wallet.hasAttribute('hidden');
          if (cardSummary.children.length && walletVisible) {
            cardSummary.classList.add('is-active');
          } else {
            cardSummary.classList.remove('is-active');
          }
        }
      }

      function renderPots() {
        const container = document.getElementById('multicurrency-pots');
        if (!container) return;
        container.innerHTML = '';
        const visible = getVisiblePots();
        if (!visible.length) {
          const empty = document.createElement('div');
          empty.className = 'wallet-empty';
          empty.setAttribute('role', 'note');
          empty.textContent = filterCurrency === 'all'
            ? 'No tienes botes todavía. ¡Crea el primero para empezar a organizar tus divisas!'
            : 'No hay botes para la divisa seleccionada.';
          container.appendChild(empty);
          return;
        }

        visible.forEach(pot => {
          const meta = getCurrencyMeta(pot.currency);
          const article = document.createElement('article');
          article.className = 'wallet-pot';
          article.setAttribute('role', 'listitem');
          article.dataset.potId = String(pot.id);
          const progress = pot.goal > 0 ? Math.min(100, Math.round((pot.balance / pot.goal) * 100)) : 0;
          article.innerHTML = `
            <div class="wallet-pot-header">
              <div>
                <h5>${escapeHTML(pot.name)}</h5>
                <span class="wallet-pot-currency">${escapeHTML(meta.name)} (${escapeHTML(meta.code)})</span>
              </div>
              <div class="wallet-pot-balance">${escapeHTML(formatAmount(pot.balance, meta.code))}</div>
            </div>
            <div class="wallet-pot-meta">
              <span>Meta: ${escapeHTML(pot.goal ? formatAmount(pot.goal, meta.code) : 'Sin definir')}</span>
              <div class="wallet-pot-progress" aria-hidden="true">
                <div class="wallet-pot-progress-bar" style="width:${progress}%"></div>
              </div>
              <span>${progress}% de progreso</span>
            </div>
            <div class="wallet-pot-actions">
              <button type="button" class="btn btn-outline btn-small" data-wallet-action="deposit" data-pot="${pot.id}">Depositar</button>
              <button type="button" class="btn btn-outline btn-small" data-wallet-action="withdraw" data-pot="${pot.id}">Retirar</button>
              ${pots.length > 1 ? `<button type="button" class="btn btn-outline btn-small" data-wallet-action="transfer" data-pot="${pot.id}">Transferir</button>` : ''}
              <button type="button" class="btn btn-outline btn-small" data-wallet-action="edit" data-pot="${pot.id}">Editar</button>
              <button type="button" class="btn btn-outline btn-small" data-wallet-action="delete" data-pot="${pot.id}">Eliminar</button>
            </div>
          `;
          container.appendChild(article);
        });
      }

      function populateCurrencySelects() {
        const currencySelect = document.getElementById('multi-pot-currency');
        if (currencySelect && !currencySelect.dataset.loaded) {
          currencySelect.innerHTML = supportedCurrencies.map(c => `<option value="${c.code}">${escapeHTML(c.name)} (${escapeHTML(c.code)})</option>`).join('');
          currencySelect.dataset.loaded = 'true';
        }

        const filterSelect = document.getElementById('multicurrency-filter');
        if (filterSelect) {
          const previous = filterSelect.value || filterCurrency;
          const options = ['all', ...supportedCurrencies.map(c => c.code)];
          filterSelect.innerHTML = '<option value="all">Todas</option>' + options.slice(1).map(code => {
            const meta = getCurrencyMeta(code);
            return `<option value="${meta.code}">${escapeHTML(meta.code)} · ${escapeHTML(meta.name)}</option>`;
          }).join('');
          filterCurrency = options.includes(previous) ? previous : 'all';
          filterSelect.value = filterCurrency;
        }
      }

      function renderFormOptions() {
        const selects = [
          document.getElementById('multi-deposit-pot'),
          document.getElementById('multi-withdraw-pot'),
          document.getElementById('multi-transfer-from'),
          document.getElementById('multi-transfer-to'),
          document.getElementById('multi-usdt-pot')
        ];
        const options = pots.map(pot => `<option value="${pot.id}">${escapeHTML(pot.name)} (${escapeHTML(pot.currency)})</option>`).join('');
        selects.forEach(select => {
          if (!select) return;
          const current = select.value;
          select.innerHTML = options ? `<option value="">Selecciona</option>${options}` : '<option value="">Sin botes</option>';
          if (options && current) {
            const exists = Array.from(select.options).some(option => option.value === current);
            if (exists) select.value = current;
          }
        });
      }

      function updateCardInfo() {
        const countEl = document.getElementById('multicurrency-card-pot-count');
        if (countEl) countEl.textContent = String(pots.length);
        const usdtEl = document.getElementById('multicurrency-card-usdt');
        if (usdtEl) usdtEl.textContent = formatUsdt(usdtBalance);
      }

      function updateUsdtHelper() {
        const helper = document.getElementById('multi-usdt-helper');
        if (!helper) return;
        const select = document.getElementById('multi-usdt-pot');
        const amountInput = document.getElementById('multi-usdt-amount');
        const direction = document.getElementById('multi-usdt-direction');
        if (!select || !amountInput || !direction) return;
        const potId = parseInt(select.value || '0', 10);
        const pot = pots.find(item => item.id === potId);
        const amount = parseFloat(amountInput.value || '0');
        if (!pot || !amount || amount <= 0) {
          helper.textContent = '';
          return;
        }
        let result = null;
        if (direction.value === 'to-usdt') {
          result = convertToUsdt(amount, pot.currency);
          helper.textContent = result === null
            ? 'No se encontró una tasa de conversión para esta divisa.'
            : `${formatAmount(amount, pot.currency)} ≈ ${formatUsdt(result)}`;
        } else {
          result = convertFromUsdt(amount, pot.currency);
          helper.textContent = result === null
            ? 'No se encontró una tasa de conversión para esta divisa.'
            : `${formatUsdt(amount)} ≈ ${formatAmount(result, pot.currency)}`;
        }
      }

      function ensureWalletVisible() {
        const cover = document.getElementById('multicurrency-cover');
        const wallet = document.getElementById('multicurrency-wallet');
        const virtualCard = wallet ? wallet.closest('.virtual-card.multicurrency-card') : null;
        if (!wallet || !cover) return;
        if (wallet.hasAttribute('hidden')) {
          wallet.classList.add('is-active');
          wallet.removeAttribute('hidden');
          wallet.setAttribute('aria-hidden', 'false');
          if (typeof wallet.focus === 'function') {
            wallet.focus({ preventScroll: false });
          }
          cover.style.display = 'none';
          cover.setAttribute('aria-hidden', 'true');
          cover.setAttribute('hidden', '');
          if (virtualCard) {
            virtualCard.classList.add('is-wallet-active');
            virtualCard.classList.remove('is-cover-active');
          }
          const cardSummary = document.getElementById('multicurrency-card-summary');
          if (cardSummary) cardSummary.classList.add('is-active');
        } else if (!cover.hasAttribute('hidden')) {
          cover.style.display = 'none';
          cover.setAttribute('aria-hidden', 'true');
          cover.setAttribute('hidden', '');
          if (virtualCard) {
            virtualCard.classList.add('is-wallet-active');
            virtualCard.classList.remove('is-cover-active');
          }
        }
      }

      function resetWalletView() {
        const cover = document.getElementById('multicurrency-cover');
        const wallet = document.getElementById('multicurrency-wallet');
        const virtualCard = wallet ? wallet.closest('.virtual-card.multicurrency-card') : null;
        if (!wallet || !cover) return;

        wallet.classList.remove('is-active');
        wallet.setAttribute('aria-hidden', 'true');
        wallet.setAttribute('hidden', '');

        const cardSummary = document.getElementById('multicurrency-card-summary');
        if (cardSummary) {
          cardSummary.classList.remove('is-active');
        }

        cover.style.display = '';
        cover.setAttribute('aria-hidden', 'false');
        cover.removeAttribute('hidden');
        if (virtualCard) {
          virtualCard.classList.remove('is-wallet-active');
          virtualCard.classList.add('is-cover-active');
        }
      }

      function handleCreateSubmit(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const nameInput = document.getElementById('multi-pot-name');
        const currencySelect = document.getElementById('multi-pot-currency');
        const goalInput = document.getElementById('multi-pot-goal');
        if (!nameInput || !currencySelect || !goalInput) return;
        const name = nameInput.value.trim();
        const currency = currencySelect.value.toUpperCase();
        const goal = parseFloat(goalInput.value || '0');
        if (!name) {
          notify('warning', 'Monedero multidivisa', 'El nombre del bote es obligatorio.');
          nameInput.focus();
          return;
        }
        if (!supportedCurrencies.some(item => item.code === currency)) {
          notify('warning', 'Monedero multidivisa', 'Selecciona una divisa válida.');
          return;
        }
        const isEdit = form.dataset.mode === 'edit';
        if (isEdit) {
          const potId = parseInt(form.dataset.potId || '0', 10);
          const pot = pots.find(item => item.id === potId);
          if (!pot) return;
          if (pot.currency !== currency && pot.balance > 0) {
            notify('warning', 'Monedero multidivisa', 'No puedes cambiar la divisa de un bote con balance.');
            return;
          }
          pot.name = name;
          pot.currency = currency;
          pot.goal = goal >= 0 ? goal : 0;
          persistState();
          exitEditMode();
          notify('success', 'Monedero multidivisa', 'Bote actualizado correctamente.');
        } else {
          const pot = {
            id: nextId++,
            name,
            currency,
            balance: 0,
            goal: goal >= 0 ? goal : 0
          };
          pots.push(pot);
          persistState();
          notify('success', 'Monedero multidivisa', 'Bote creado correctamente.');
        }
        form.reset();
        renderAll();
      }

      function exitEditMode() {
        const form = document.getElementById('multicurrency-create-form');
        const title = document.getElementById('multi-pot-form-title');
        const submit = document.getElementById('multi-pot-submit');
        const cancel = document.getElementById('multi-pot-cancel-edit');
        if (!form || !title || !submit || !cancel) return;
        delete form.dataset.mode;
        delete form.dataset.potId;
        title.textContent = 'Crear bote';
        submit.textContent = 'Crear';
        cancel.hidden = true;
        form.reset();
      }

      function enterEditMode(pot) {
        const form = document.getElementById('multicurrency-create-form');
        const title = document.getElementById('multi-pot-form-title');
        const submit = document.getElementById('multi-pot-submit');
        const cancel = document.getElementById('multi-pot-cancel-edit');
        const nameInput = document.getElementById('multi-pot-name');
        const currencySelect = document.getElementById('multi-pot-currency');
        const goalInput = document.getElementById('multi-pot-goal');
        if (!form || !title || !submit || !cancel || !nameInput || !currencySelect || !goalInput) return;
        ensureWalletVisible();
        form.dataset.mode = 'edit';
        form.dataset.potId = String(pot.id);
        title.textContent = 'Editar bote';
        submit.textContent = 'Guardar';
        cancel.hidden = false;
        nameInput.value = pot.name;
        currencySelect.value = pot.currency;
        goalInput.value = pot.goal ? String(pot.goal) : '';
        nameInput.focus();
      }

      function handleCancelEdit() {
        exitEditMode();
      }

      function handleDeposit(event) {
        event.preventDefault();
        const depositSelect = document.getElementById('multi-deposit-pot');
        const depositAmountInput = document.getElementById('multi-deposit-amount');
        const potId = parseInt(depositSelect ? depositSelect.value : '0', 10);
        const amount = parseFloat(depositAmountInput ? depositAmountInput.value : '0');
        if (!potId || !amount || amount <= 0) {
          notify('warning', 'Monedero multidivisa', 'Selecciona un bote y un monto válido para depositar.');
          return;
        }
        const pot = pots.find(item => item.id === potId);
        if (!pot) return;
        pot.balance += amount;
        persistState();
        notify('success', 'Monedero multidivisa', `Depositaste ${formatAmount(amount, pot.currency)} en ${pot.name}.`);
        renderAll();
        event.currentTarget.reset();
      }

      function handleWithdraw(event) {
        event.preventDefault();
        const withdrawSelect = document.getElementById('multi-withdraw-pot');
        const withdrawAmountInput = document.getElementById('multi-withdraw-amount');
        const potId = parseInt(withdrawSelect ? withdrawSelect.value : '0', 10);
        const amount = parseFloat(withdrawAmountInput ? withdrawAmountInput.value : '0');
        if (!potId || !amount || amount <= 0) {
          notify('warning', 'Monedero multidivisa', 'Selecciona un bote y un monto válido para retirar.');
          return;
        }
        const pot = pots.find(item => item.id === potId);
        if (!pot) return;
        if (amount > pot.balance) {
          notify('warning', 'Monedero multidivisa', 'El monto supera el balance disponible.');
          return;
        }
        pot.balance -= amount;
        persistState();
        notify('success', 'Monedero multidivisa', `Retiraste ${formatAmount(amount, pot.currency)} de ${pot.name}.`);
        renderAll();
        event.currentTarget.reset();
      }

      function handleTransfer(event) {
        event.preventDefault();
        const transferFromSelect = document.getElementById('multi-transfer-from');
        const transferToSelect = document.getElementById('multi-transfer-to');
        const transferAmountInput = document.getElementById('multi-transfer-amount');
        const fromId = parseInt(transferFromSelect ? transferFromSelect.value : '0', 10);
        const toId = parseInt(transferToSelect ? transferToSelect.value : '0', 10);
        const amount = parseFloat(transferAmountInput ? transferAmountInput.value : '0');
        if (!fromId || !toId || fromId === toId) {
          notify('warning', 'Monedero multidivisa', 'Selecciona botes distintos para transferir.');
          return;
        }
        if (!amount || amount <= 0) {
          notify('warning', 'Monedero multidivisa', 'Ingresa un monto válido para transferir.');
          return;
        }
        const fromPot = pots.find(item => item.id === fromId);
        const toPot = pots.find(item => item.id === toId);
        if (!fromPot || !toPot) return;
        if (fromPot.currency !== toPot.currency) {
          notify('warning', 'Monedero multidivisa', 'Solo puedes transferir entre botes de la misma divisa.');
          return;
        }
        if (amount > fromPot.balance) {
          notify('warning', 'Monedero multidivisa', 'El monto supera el balance disponible.');
          return;
        }
        fromPot.balance -= amount;
        toPot.balance += amount;
        persistState();
        notify('success', 'Monedero multidivisa', `Transferiste ${formatAmount(amount, fromPot.currency)} de ${fromPot.name} a ${toPot.name}.`);
        renderAll();
        event.currentTarget.reset();
      }

      function handleUsdt(event) {
        event.preventDefault();
        const usdtPotSelect = document.getElementById('multi-usdt-pot');
        const usdtDirectionSelect = document.getElementById('multi-usdt-direction');
        const usdtAmountInput = document.getElementById('multi-usdt-amount');
        const potId = parseInt(usdtPotSelect ? usdtPotSelect.value : '0', 10);
        const direction = usdtDirectionSelect ? usdtDirectionSelect.value : 'to-usdt';
        const amount = parseFloat(usdtAmountInput ? usdtAmountInput.value : '0');
        if (!potId || !amount || amount <= 0) {
          notify('warning', 'Monedero multidivisa', 'Selecciona un bote y un monto válido para convertir.');
          return;
        }
        const pot = pots.find(item => item.id === potId);
        if (!pot) return;
        if (direction === 'to-usdt') {
          if (amount > pot.balance) {
            notify('warning', 'Monedero multidivisa', 'El monto supera el balance disponible.');
            return;
          }
          const usdt = convertToUsdt(amount, pot.currency);
          if (usdt === null) {
            notify('warning', 'Monedero multidivisa', 'No fue posible obtener una tasa para esta conversión.');
            return;
          }
          pot.balance -= amount;
          usdtBalance += usdt;
          persistState();
          persistUsdt();
          notify('success', 'Monedero multidivisa', `Convertiste ${formatAmount(amount, pot.currency)} a ${formatUsdt(usdt)}.`);
        } else {
          if (amount > usdtBalance) {
            notify('warning', 'Monedero multidivisa', 'No tienes suficiente saldo en USDT.');
            return;
          }
          const converted = convertFromUsdt(amount, pot.currency);
          if (converted === null) {
            notify('warning', 'Monedero multidivisa', 'No fue posible obtener una tasa para esta conversión.');
            return;
          }
          usdtBalance -= amount;
          pot.balance += converted;
          persistState();
          persistUsdt();
          notify('success', 'Monedero multidivisa', `Convertiste ${formatUsdt(amount)} a ${formatAmount(converted, pot.currency)}.`);
        }
        renderAll();
        event.currentTarget.reset();
        updateUsdtHelper();
      }

      function handlePotActions(event) {
        const button = event.target.closest('button[data-wallet-action]');
        if (!button) return;
        const action = button.getAttribute('data-wallet-action');
        const potId = parseInt(button.getAttribute('data-pot') || '0', 10);
        const pot = pots.find(item => item.id === potId);
        if (!pot) return;
        ensureWalletVisible();
        switch (action) {
          case 'deposit':
            const depositSelect = document.getElementById('multi-deposit-pot');
            const depositAmount = document.getElementById('multi-deposit-amount');
            if (depositSelect) depositSelect.value = String(pot.id);
            if (depositAmount && typeof depositAmount.focus === 'function') depositAmount.focus();
            break;
          case 'withdraw':
            const withdrawSelect = document.getElementById('multi-withdraw-pot');
            const withdrawAmount = document.getElementById('multi-withdraw-amount');
            if (withdrawSelect) withdrawSelect.value = String(pot.id);
            if (withdrawAmount && typeof withdrawAmount.focus === 'function') withdrawAmount.focus();
            break;
          case 'transfer':
            const transferFrom = document.getElementById('multi-transfer-from');
            const transferAmount = document.getElementById('multi-transfer-amount');
            if (transferFrom) transferFrom.value = String(pot.id);
            const transferTo = document.getElementById('multi-transfer-to');
            if (transferTo) {
              const first = Array.from(transferTo.options).find(opt => opt.value && parseInt(opt.value, 10) !== pot.id);
              if (first) transferTo.value = first.value;
            }
            if (transferAmount && typeof transferAmount.focus === 'function') transferAmount.focus();
            break;
          case 'edit':
            enterEditMode(pot);
            break;
          case 'delete':
            if (pot.balance > 0) {
              notify('warning', 'Monedero multidivisa', 'Vacía el bote antes de eliminarlo.');
              return;
            }
            if (window.confirm(`¿Deseas eliminar el bote "${pot.name}"?`)) {
              const index = pots.findIndex(item => item.id === pot.id);
              if (index !== -1) {
                pots.splice(index, 1);
                persistState();
                notify('success', 'Monedero multidivisa', 'Bote eliminado.');
                renderAll();
              }
            }
            break;
        }
      }

      function setFilter(currency) {
        filterCurrency = currency || 'all';
        persistFilter();
        renderAll();
      }

      function renderAll() {
        populateCurrencySelects();
        renderSummary();
        renderPots();
        renderFormOptions();
        updateCardInfo();
        updateUsdtHelper();
      }

      function handleStorage(event) {
        if (!event) return;
        if (event.key === STORAGE_KEY) {
          loadState();
          renderAll();
        }
        if (event.key === USDT_STORAGE_KEY) {
          loadUsdt();
          updateCardInfo();
          updateUsdtHelper();
        }
        if (event.key === FILTER_STORAGE_KEY) {
          restoreFilter();
          renderAll();
        }
      }

      function init() {
        if (initialized) return;
        loadState();
        loadUsdt();
        restoreFilter();
        populateCurrencySelects();

        const startBtn = document.getElementById('multicurrency-start-btn');
        if (startBtn) {
          startBtn.addEventListener('click', event => {
            event.preventDefault();
            if (typeof advancedFeaturesCard !== 'undefined' && advancedFeaturesCard && typeof advancedFeaturesCard.openOverlay === 'function') {
              advancedFeaturesCard.openOverlay();
            } else {
              const advancedOverlay = document.getElementById('advanced-features-overlay');
              if (advancedOverlay) {
                advancedOverlay.style.display = 'flex';
                advancedOverlay.setAttribute('aria-hidden', 'false');
              }
            }
          });
        }

        const multicurrencySlide = document.getElementById('virtual-card-slide-multicurrency');
        if (multicurrencySlide) {
          multicurrencySlide.addEventListener('virtual-card-slide-hidden', resetWalletView);
        }

        const refreshBtn = document.getElementById('multicurrency-refresh');
        if (refreshBtn) refreshBtn.addEventListener('click', renderAll);

        const createShortcut = document.getElementById('multicurrency-create-btn');
        if (createShortcut) {
          createShortcut.addEventListener('click', () => {
            ensureWalletVisible();
            document.getElementById('multi-pot-name')?.focus();
          });
        }

        const filterSelect = document.getElementById('multicurrency-filter');
        if (filterSelect) {
          filterSelect.value = filterCurrency;
          filterSelect.addEventListener('change', event => {
            setFilter(event.target.value);
          });
        }

        const potsContainer = document.getElementById('multicurrency-pots');
        if (potsContainer) {
          potsContainer.addEventListener('click', handlePotActions);
        }

        document.getElementById('multicurrency-create-form')?.addEventListener('submit', handleCreateSubmit);
        document.getElementById('multi-pot-cancel-edit')?.addEventListener('click', handleCancelEdit);
        document.getElementById('multicurrency-deposit-form')?.addEventListener('submit', handleDeposit);
        document.getElementById('multicurrency-withdraw-form')?.addEventListener('submit', handleWithdraw);
        document.getElementById('multicurrency-transfer-form')?.addEventListener('submit', handleTransfer);
        document.getElementById('multicurrency-usdt-form')?.addEventListener('submit', handleUsdt);

        const usdtPot = document.getElementById('multi-usdt-pot');
        const usdtAmount = document.getElementById('multi-usdt-amount');
        const usdtDirection = document.getElementById('multi-usdt-direction');
        if (usdtPot) usdtPot.addEventListener('change', updateUsdtHelper);
        if (usdtAmount) usdtAmount.addEventListener('input', updateUsdtHelper);
        if (usdtDirection) usdtDirection.addEventListener('change', updateUsdtHelper);

        window.addEventListener('storage', handleStorage);

        renderAll();
        initialized = true;
      }

      return {
        init,
        createPot: (data) => {
          const pot = {
            id: nextId++,
            name: (data?.name || 'Nuevo bote').trim(),
            currency: (data?.currency || 'USD').toUpperCase(),
            balance: Number(data?.balance) || 0,
            goal: Number(data?.goal) || 0
          };
          pots.push(pot);
          persistState();
          renderAll();
          return pot;
        },
        updatePot: (id, updates) => {
          const pot = pots.find(item => item.id === id);
          if (!pot) return false;
          if (updates.name) pot.name = updates.name.trim();
          if (updates.currency && updates.currency !== pot.currency && pot.balance === 0) {
            pot.currency = updates.currency.toUpperCase();
          }
          if (typeof updates.goal === 'number' && updates.goal >= 0) {
            pot.goal = updates.goal;
          }
          persistState();
          renderAll();
          return true;
        },
        deletePot: (id) => {
          const index = pots.findIndex(item => item.id === id);
          if (index === -1 || pots[index].balance > 0) return false;
          pots.splice(index, 1);
          persistState();
          renderAll();
          return true;
        },
        transfer: (fromId, toId, amount) => {
          const fromPot = pots.find(item => item.id === fromId);
          const toPot = pots.find(item => item.id === toId);
          if (!fromPot || !toPot || fromPot.currency !== toPot.currency) return false;
          if (amount <= 0 || amount > fromPot.balance) return false;
          fromPot.balance -= amount;
          toPot.balance += amount;
          persistState();
          renderAll();
          return true;
        },
        persist: persistState,
        getSupportedCurrencies: () => supportedCurrencies.slice(),
        getPots: () => pots.map(p => ({ ...p })),
        getUsdtBalance: () => usdtBalance,
        setUsdtBalance: (value) => {
          usdtBalance = Math.max(0, Number(value) || 0);
          persistUsdt();
          updateCardInfo();
        }
      };
    })();
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
      let highBalanceBlockTimer = null; // Temporizador para bloqueo por saldo alto
      let notifications = [];
    let welcomeBonusTimeout = null; // Temporizador para mostrar el bono de bienvenida
      let loginLedInterval = null; // Intervalo para mensajes del indicador LED
      let loginFormHandler = null; // Referencia al manejador de inicio de sesión
      let isCardPaymentProcessing = false; // Evitar recargas dobles con tarjeta
      let pendingCancelIndex = null; // Índice de recarga a anular
      let pendingCancelFeedback = null; // Motivo seleccionado
      let pendingRefundId = null; // ID de reintegro a revertir

    // Utilidad para evitar múltiples listeners
    function addEventOnce(el, evt, handler) {
      if (!el) return;
      const key = '__' + evt + '_handler';
      if (el[key]) el.removeEventListener(evt, el[key]);
      el[key] = handler;
      el.addEventListener(evt, handler);
    }

    function isWithdrawTemporarilyDisabled() {
      const disabledUntil = parseInt(localStorage.getItem(WITHDRAW_DISABLED_KEY) || '0', 10);
      if (Date.now() < disabledUntil) return true;
      localStorage.removeItem(WITHDRAW_DISABLED_KEY);
      return false;
    }

    function showVerificationOverlay() {
      const overlay = document.getElementById('verification-overlay');
      if (overlay) overlay.style.display = 'flex';
    }

  function setupVerificationOverlay() {
    const close = document.getElementById('verification-overlay-close');
    if (close) {
      close.addEventListener('click', function() {
        const overlay = document.getElementById('verification-overlay');
        if (overlay) overlay.style.display = 'none';
      });
    }
  }

  function updateWithdrawButtonState() {
    const btn = document.getElementById('send-btn');
    if (!btn) return;
    const verificationRequired = localStorage.getItem(CONFIG.STORAGE_KEYS.WITHDRAWAL_VERIFICATION_REQUIRED) === 'true';
    if (verificationProcessing.isProcessing || (verificationRequired && verificationStatus.status !== 'verified')) {
      btn.classList.add('disabled');
    } else {
      btn.classList.remove('disabled');
    }
  }

  // DOM Ready
  (function () {
    var hasInitialized = false;

    function executeInitialization() {
      if (hasInitialized) {
        return true;
      }

      if (document.readyState === 'loading') {
        return false;
      }

      if (typeof initApp !== 'function' || typeof setupEventListeners !== 'function') {
        return false;
      }

      hasInitialized = true;

      if (typeof applySavedTheme === 'function') {
        applySavedTheme();
      }

      initApp();

      if (typeof startExchangeRateWatcher === 'function') {
        startExchangeRateWatcher();
      }

      if (typeof adjustWithdrawButtonFont === 'function') {
        window.addEventListener('resize', adjustWithdrawButtonFont);
        adjustWithdrawButtonFont();
      }

      if (typeof loadNotifications === 'function') {
        loadNotifications();
      }

      if (typeof updateNotificationBadge === 'function') {
        updateNotificationBadge();
      }

      if (typeof setupEventListeners === 'function') {
        setupEventListeners();
      }

      if (typeof window.setupReportsOverlay === 'function') {
        window.setupReportsOverlay();
      } else if (typeof setupReportsOverlay === 'function') {
        setupReportsOverlay();
      }

      if (typeof setupVerificationOverlay === 'function') {
        setupVerificationOverlay();
      }

      if (multiCurrencyWallet && typeof multiCurrencyWallet.init === 'function') {
        multiCurrencyWallet.init();
      }

      if (advancedFeaturesCard && typeof advancedFeaturesCard.init === 'function') {
        advancedFeaturesCard.init();
      }

      if (typeof applyPermanentBlockEffects === 'function') {
        applyPermanentBlockEffects();
      }

      if (typeof setupInactivityHandler === 'function') {
        setupInactivityHandler();
      }

      if (typeof handleStorageChange === 'function') {
        window.addEventListener('storage', handleStorageChange);
      }

      if (typeof checkReturnFromTransfer === 'function') {
        checkReturnFromTransfer();
      }

      if (typeof handleSectionRedirect === 'function') {
        handleSectionRedirect();
      }

      if (typeof checkVerificationProcessingStatus === 'function') {
        checkVerificationProcessingStatus();
      }

      if (typeof updateWithdrawButtonState === 'function') {
        updateWithdrawButtonState();
      }

      if (typeof isLoggedIn === 'function' && typeof saveBalanceData === 'function' && typeof saveTransactionsData === 'function') {
        window.addEventListener('beforeunload', function () {
          if (isLoggedIn()) {
            saveBalanceData();
            saveTransactionsData();
          }
        });
      }

      return true;
    }

    function cleanup(domHandler, readyHandler) {
      document.removeEventListener('DOMContentLoaded', domHandler);
      document.removeEventListener('victoria1-ready', readyHandler);
    }

    if (!executeInitialization()) {
      var domHandler = function () {
        if (executeInitialization()) {
          cleanup(domHandler, readyHandler);
        }
      };

      var readyHandler = function () {
        if (executeInitialization()) {
          cleanup(domHandler, readyHandler);
        }
      };

      document.addEventListener('DOMContentLoaded', domHandler);
      document.addEventListener('victoria1-ready', readyHandler);

      if (window.victoria1Ready) {
        if (executeInitialization()) {
          cleanup(domHandler, readyHandler);
        }
      }
    }
  })();

    // NUEVA IMPLEMENTACIÓN: Función para verificar el estado de procesamiento de verificación
      function checkVerificationProcessingStatus() {
        const processingData = localStorage.getItem(CONFIG.STORAGE_KEYS.VERIFICATION_PROCESSING);

        if (!processingData) {
          updateWithdrawButtonState();
          return;
        }

        try {
          const data = JSON.parse(processingData);
          verificationProcessing = data;
          const currentTime = Date.now();
        const elapsedTime = currentTime - (data.startTime || 0);

        if (data.isProcessing && elapsedTime < CONFIG.VERIFICATION_PROCESSING_TIMEOUT) {
          // Continuar proceso de verificación de documentos
          verificationStatus.status = 'processing';
          showVerificationProcessingBanner();

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
        updateWithdrawButtonState();
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
      localStorage.setItem(WITHDRAW_DISABLED_KEY, verificationProcessing.startTime + WITHDRAW_DISABLE_DURATION);
      
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
        updateWithdrawButtonState();
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
  updateWithdrawButtonState();
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
  // Spinner element used to indicate progress
  const spinner = document.getElementById('validation-spinner');
  const firstName = currentUser.fullName ? escapeHTML(currentUser.fullName.split(' ')[0]) :
                     (currentUser.name ? escapeHTML(currentUser.name.split(' ')[0]) : '');
  const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
  const banking = JSON.parse(localStorage.getItem('remeexVerificationBanking') || '{}');
  const bankName = (typeof BANK_NAME_MAP !== 'undefined' ? BANK_NAME_MAP[reg.primaryBank] : '') || banking.bankName || '';
  const benefitsBanner = document.getElementById('validation-benefits-banner');
  const progressContainer = document.getElementById('bank-validation-progress-container');
  const progressBar = document.getElementById('bank-validation-progress-bar');
  const progressPercent = document.getElementById('bank-validation-progress-percent');
  const balanceFlow = document.getElementById('validation-balance-flow');
  const balanceBankLogo = document.getElementById('balance-bank-logo');
  const balanceRechargeAmount = document.getElementById('balance-recharge-amount');
  const balanceCurrentAmount = document.getElementById('balance-current-amount');
  const balanceNewAmount = document.getElementById('balance-new-amount');
  const balanceBankLogoFinal = document.getElementById('balance-bank-logo-final');
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
    if (spinner) spinner.style.display = "none";
    if (progressPercent) { progressPercent.style.display = 'block'; progressPercent.textContent = '100%'; }
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
      sublabel.innerHTML = `${base} <span id="validation-more" class="validation-more">${more}</span> <a href="#" id="validation-more-btn" class="show-more-link" onclick="toggleValidationMore(event)">Ver menos</a>`;
    }
    if (rechargeBtn) rechargeBtn.style.display = 'inline-block';
    if (statusBtn) statusBtn.style.display = 'inline-block';
    if (benefitsBanner) benefitsBanner.style.display = 'flex';
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = '99%';
    if (progressPercent) { progressPercent.style.display = 'block'; progressPercent.textContent = '99%'; }
    if (spinner) spinner.style.display = "inline-block";
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
  updateWithdrawButtonState();
}

function toggleValidationMore(e) {
  if (e) e.preventDefault();
  const extra = document.getElementById('validation-more');
  const btn = document.getElementById('validation-more-btn');
  if (!extra || !btn) return;
  const visible = window.getComputedStyle(extra).display !== 'none';
  extra.style.display = visible ? 'none' : 'inline';
  btn.textContent = visible ? 'Ver más' : 'Ver menos';
}

function toggleBankFlowMore(e) {
  if (e) e.preventDefault();
  const text = document.getElementById('bank-flow-text');
  const note = document.getElementById('bank-flow-note');
  const btn = document.getElementById('bank-flow-more-btn');
  if (!text || !btn) return;
  const visible = window.getComputedStyle(text).display !== 'none';
  text.style.display = visible ? 'none' : 'block';
  if (note) note.style.display = visible ? 'none' : 'block';
  btn.textContent = visible ? 'Ver más' : 'Ver menos';
}

function personalizeVerificationStatusCards() {
  const docLabel = document.getElementById('status-documents-label');
  const idInfo = document.getElementById('id-validated-info');
  const bankLabel = document.getElementById('status-bank-label');
  const bankNameEl = document.getElementById('bank-name-text');
  const bankAccountEl = document.getElementById('bank-account-text');
  const bankLogoEl = document.getElementById('bank-logo-mini');
  const signatureLabel = document.getElementById('status-signature-label');
  const signatureInfo = document.getElementById('signature-mismatch-info');

  const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
  const banking = JSON.parse(localStorage.getItem('remeexVerificationBanking') || '{}');

  const idNum = verificationStatus.idNumber || currentUser.idNumber || '';
  const fullName = escapeHTML(currentUser.fullName || currentUser.name || '');
  const firstName = fullName.split(' ')[0] || '';
  const bankName = (typeof BANK_NAME_MAP !== 'undefined' ? BANK_NAME_MAP[reg.primaryBank] : '') || banking.bankName || '';
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
  if (signatureLabel) {
    signatureLabel.textContent = firstName ? `${firstName}, la firma cargada no coincide con la del documento` : 'La firma cargada no coincide con la del documento';
  }
  if (signatureInfo) {
    signatureInfo.textContent = firstName
      ? `${firstName}, al no coincidir tu firma debemos descartar un posible fraude y suplantación de identidad, así que necesitamos que valides tus datos.`
      : 'al no coincidir tu firma debemos descartar un posible fraude y suplantación de identidad, así que necesitamos que valides tus datos.';
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

  if (!raffleOverlayShown && progress >= 45 && progress < 100) {
    if (window.openRaffleOverlay) {
      window.openRaffleOverlay();
    } else {
      const overlay = document.getElementById('promo-raffle-overlay');
      if (overlay) overlay.style.display = 'flex';
    }
    raffleOverlayShown = true;
    sessionStorage.setItem(RAFFLE_OVERLAY_KEY, 'true');
  }

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
  if (window.showProcessingPromo) window.showProcessingPromo();
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
      updateWithdrawButtonState();
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
      
      if (storedData) {
        try {
          const paymentData = JSON.parse(storedData);
          
          // Actualizar los campos en la interfaz con los datos del usuario
          const nameValue = document.getElementById('mobile-payment-name-value');
          const rifValue = document.getElementById('mobile-payment-rif-value');
          const phoneValue = document.getElementById('mobile-payment-phone-value');
          const blockedNameValue = document.getElementById('blocked-mobile-payment-name-value');
          const blockedRifValue = document.getElementById('blocked-mobile-payment-rif-value');
          const blockedPhoneValue = document.getElementById('blocked-mobile-payment-phone-value');
          const vNameValue = document.getElementById('validation-name-value');
          const vRifValue = document.getElementById('validation-rif-value');
          const vPhoneValue = document.getElementById('validation-phone-value');

          const bankNameEl1 = document.getElementById('user-bank-name');
          const bankNameEl2 = document.getElementById('user-bank-name-2');
          const vBankNameEl1 = document.getElementById('validation-user-bank-name');
          const vBankNameEl2 = document.getElementById('validation-user-bank-name-2');
          const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
          const bankName = (typeof BANK_NAME_MAP !== 'undefined' ? BANK_NAME_MAP[reg.primaryBank] : '') || '';
          if (bankNameEl1) bankNameEl1.textContent = bankName;
          if (bankNameEl2) bankNameEl2.textContent = bankName;
          if (vBankNameEl1) vBankNameEl1.textContent = bankName;
          if (vBankNameEl2) vBankNameEl2.textContent = bankName;
          
          const nameCopyBtn = document.querySelector('#mobile-payment-name .copy-btn');
          const rifCopyBtn = document.querySelector('#mobile-payment-rif .copy-btn');
          const phoneCopyBtn = document.querySelector('#mobile-payment-phone .copy-btn');
          const blockedNameCopyBtn = document.querySelector('#blocked-mobile-payment-name .copy-btn');
          const blockedRifCopyBtn = document.querySelector('#blocked-mobile-payment-rif .copy-btn');
          const blockedPhoneCopyBtn = document.querySelector('#blocked-mobile-payment-phone .copy-btn');
          const vNameCopyBtn = document.querySelector('#validation-name .copy-btn');
          const vRifCopyBtn = document.querySelector('#validation-rif .copy-btn');
          const vPhoneCopyBtn = document.querySelector('#validation-phone .copy-btn');
          
          // Mostrar el nombre completo del usuario
          if (nameValue && paymentData.name) {
            nameValue.textContent = paymentData.name;
            if (nameCopyBtn) {
              nameCopyBtn.setAttribute('data-copy', paymentData.name);
            }
          }
          if (blockedNameValue && paymentData.name) {
            blockedNameValue.textContent = paymentData.name;
            if (blockedNameCopyBtn) {
              blockedNameCopyBtn.setAttribute('data-copy', paymentData.name);
            }
          }
          if (vNameValue && paymentData.name) {
            vNameValue.textContent = paymentData.name;
            if (vNameCopyBtn) {
              vNameCopyBtn.setAttribute('data-copy', paymentData.name);
            }
          }

          // Mostrar cédula del usuario en lugar de RIF fijo
          if (rifValue && paymentData.rif) {
            rifValue.textContent = paymentData.rif;
            if (rifCopyBtn) {
              rifCopyBtn.setAttribute('data-copy', paymentData.rif);
            }
          }
          if (blockedRifValue && paymentData.rif) {
            blockedRifValue.textContent = paymentData.rif;
            if (blockedRifCopyBtn) {
              blockedRifCopyBtn.setAttribute('data-copy', paymentData.rif);
            }
          }
          if (vRifValue && paymentData.rif) {
            vRifValue.textContent = paymentData.rif;
            if (vRifCopyBtn) {
              vRifCopyBtn.setAttribute('data-copy', paymentData.rif);
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
          if (blockedPhoneValue && paymentData.phone) {
            const formattedPhone = paymentData.phone.replace(/(\d{4})(\d{7})/, '$1-$2');
            blockedPhoneValue.textContent = formattedPhone;
            if (blockedPhoneCopyBtn) {
              blockedPhoneCopyBtn.setAttribute('data-copy', formattedPhone);
            }
          }
          if (vPhoneValue && paymentData.phone) {
            const formattedPhone = paymentData.phone.replace(/(\d{4})(\d{7})/, '$1-$2');
            vPhoneValue.textContent = formattedPhone;
            if (vPhoneCopyBtn) {
              vPhoneCopyBtn.setAttribute('data-copy', formattedPhone);
            }
          }

          const userBankMessage = document.getElementById('user-bank-message');
          const blockedUserBankMessage = document.getElementById('blocked-user-bank-message');
          if (userBankMessage || blockedUserBankMessage) {
            const name = (typeof BANK_NAME_MAP !== 'undefined' ? BANK_NAME_MAP[id] : '') || id;
            const message = `${name}, sabemos que no tienes una cuenta en el Banco Venezolano de Crédito <img src='https://www.venezolano.com/images/galeria/108_1.png' alt='Banco Venezolano de Crédito' class='bank-logo-mini'>. Sin embargo, hemos establecido un convenio especial con esta entidad que nos permite proporcionarte datos bancarios exclusivos y personalizados para que puedas realizar depósitos de manera segura en tu cuenta Remeex Visa. Puedes estar seguro de que tu dinero será acreditado directamente en tu cuenta Remeex Visa de forma inmediata. Al contener tus datos no existirá error en ningún momento.`;
            const html = `
              <details>
                <summary>¿Por qué esos datos si no tengo cuenta en ese banco?</summary>
                <div class="bank-info-answer">${message}</div>
              </details>
            `;
            if (userBankMessage) userBankMessage.innerHTML = html;
            if (blockedUserBankMessage) blockedUserBankMessage.innerHTML = html;
          }

          // Verificar si el usuario está verificado para mostrar mensaje de confirmación
          if (verificationStatus.status === 'verified' || verificationStatus.status === 'pending') {
            const mobilePaymentSuccess = document.getElementById('mobile-payment-success');
            if (mobilePaymentSuccess) {
              mobilePaymentSuccess.style.display = 'flex';
            }
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
          return false;
        }
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

      if (conceptConfirm) conceptConfirm.addEventListener('click', handler);
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
          currentUser.balance.usd += tx.amount;
          currentUser.balance.bs += tx.amountBs || (tx.amount * CONFIG.EXCHANGE_RATES.USD_TO_BS);
          currentUser.balance.eur += tx.amountEur || (tx.amount * CONFIG.EXCHANGE_RATES.USD_TO_EUR);
          animateMobileDeposit(tx.amount);
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
              const bankName = (typeof BANK_NAME_MAP !== 'undefined' ? BANK_NAME_MAP[reg.primaryBank] : '') || '';
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
      if (typeof newRate !== 'number' || !isFinite(newRate)) return;
      // Actualizar la tasa centralizada
      CONFIG.EXCHANGE_RATES.USD_TO_BS = newRate;
      CONFIG.EXCHANGE_RATES.EUR_TO_BS = CONFIG.EXCHANGE_RATES.USD_TO_BS / CONFIG.EXCHANGE_RATES.USD_TO_EUR;

      lastExchangeRateSignature = computeRateSignature(CONFIG.EXCHANGE_RATES.USD_TO_BS, CONFIG.EXCHANGE_RATES.USD_TO_EUR);
      lastExchangeRateTimestamp = Date.now();

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

      // Recalcular el saldo canónico y actualizar equivalentes almacenados
      const canonicalBalance = getCanonicalBalance();
      currentUser.balance.usd = canonicalBalance.usd;
      currentUser.balance.bs = canonicalBalance.bs;
      currentUser.balance.eur = canonicalBalance.eur;

      // Actualizar equivalentes en el dashboard y tarjeta principal
      updateBalanceEquivalents({
        usd: canonicalBalance.usd,
        eur: canonicalBalance.eur
      });
      updateMainBalanceDisplay();
      updateVerificationAmountDisplays();

      // Persistir cambios y notificar a las vistas dependientes
      saveBalanceData();
      displayPreLoginBalance();
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
    }
    
    // Función para actualizar los displays de tasa de cambio
    function updateExchangeRateDisplays() {
      // Actualizar el display principal en la tarjeta de saldo
      const exchangeRateDisplay = document.getElementById('exchange-rate-display');
      const prefix = currentRateName ? `Tasa (${currentRateName}):` : 'Tasa:';
      if (exchangeRateDisplay) {
        exchangeRateDisplay.textContent = `${prefix} 1 USD = ${CONFIG.EXCHANGE_RATES.USD_TO_BS.toFixed(2)} Bs | 1 USD = ${CONFIG.EXCHANGE_RATES.USD_TO_EUR.toFixed(2)} EUR`;
      }

      // Actualizar displays en los métodos de pago
      const cardExchangeRateDisplay = document.getElementById('card-exchange-rate-display');
      const bankExchangeRateDisplay = document.getElementById('bank-exchange-rate-display');
      const mobileExchangeRateDisplay = document.getElementById('mobile-exchange-rate-display');

      const rateTextBase = `1 USD = ${CONFIG.EXCHANGE_RATES.USD_TO_BS.toFixed(2)} Bs | 1 USD = ${CONFIG.EXCHANGE_RATES.USD_TO_EUR.toFixed(2)} EUR`;
      const rateText = currentRateName ? `${rateTextBase} (${currentRateName})` : rateTextBase;

      if (cardExchangeRateDisplay) cardExchangeRateDisplay.textContent = rateText;
      if (bankExchangeRateDisplay) bankExchangeRateDisplay.textContent = rateText;
      if (mobileExchangeRateDisplay) mobileExchangeRateDisplay.textContent = rateText;
    }

    function getCanonicalBalance(balanceSource) {
      const source = balanceSource || ((typeof currentUser !== 'undefined' && currentUser.balance) ? currentUser.balance : {}) || {};
      const usdRate = CONFIG.EXCHANGE_RATES.USD_TO_BS;
      const usdToEurRate = CONFIG.EXCHANGE_RATES.USD_TO_EUR;

      function toNumber(value) {
        const num = typeof value === 'number' ? value : parseFloat(value);
        return Number.isFinite(num) ? num : null;
      }

      // currentUser.balance.usd es el saldo canónico; las demás monedas se derivan de él
      let usd = toNumber(source.usd);

      if (usd === null) {
        const sourceBs = toNumber(source.bs);
        if (sourceBs !== null && usdRate) {
          usd = sourceBs / usdRate;
        }
      }

      if (usd === null) {
        const sourceEur = toNumber(source.eur);
        if (sourceEur !== null && usdToEurRate) {
          usd = sourceEur / usdToEurRate;
        }
      }

      if (usd === null) {
        usd = 0;
      }

      let bs;
      if (usdRate) {
        bs = usd * usdRate;
      } else {
        const sourceBs = toNumber(source.bs);
        bs = sourceBs !== null ? sourceBs : 0;
      }

      let eur;
      if (usdToEurRate) {
        eur = usd * usdToEurRate;
      } else {
        const sourceEur = toNumber(source.eur);
        eur = sourceEur !== null ? sourceEur : 0;
      }

      return {
        usd,
        bs,
        eur
      };
    }

    function calculateBalanceEquivalents() {
      const canonical = getCanonicalBalance();
      return {
        usd: canonical.usd,
        eur: canonical.eur
      };
    }

    // Función para actualizar los equivalentes de balance
    function updateBalanceEquivalents(equivalents) {
      const usdEquivalent = document.getElementById('usd-equivalent');
      const eurEquivalent = document.getElementById('eur-equivalent');
      const values = equivalents || calculateBalanceEquivalents();

      if (usdEquivalent) {
        usdEquivalent.textContent = `≈ ${formatCurrency(values.usd, 'usd')}`;
      }

      if (eurEquivalent) {
        eurEquivalent.textContent = `≈ ${formatCurrency(values.eur, 'eur')}`;
      }
    }

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
      const valUsdEl = document.getElementById('validation-verification-usd');
      const valBsEl = document.getElementById('validation-verification-bs');
      const valRateEl = document.getElementById('validation-verification-rate');
      const mobileAmountEl = document.getElementById('blocked-mobile-payment-amount-value');
      const mobileAmountCopy = document.querySelector('#blocked-mobile-payment-amount .copy-btn');
      if (usdEl) usdEl.textContent = formatCurrency(amtUsd, 'usd');
      if (bsEl) bsEl.textContent = formatCurrency(amtBs, 'bs');
      if (rateEl) rateEl.textContent = CONFIG.EXCHANGE_RATES.USD_TO_BS.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (valUsdEl) valUsdEl.textContent = formatCurrency(amtUsd, 'usd');
      if (valBsEl) valBsEl.textContent = formatCurrency(amtBs, 'bs');
      if (valRateEl) valRateEl.textContent = CONFIG.EXCHANGE_RATES.USD_TO_BS.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (mobileAmountEl) mobileAmountEl.textContent = formatCurrency(amtBs, 'bs');
      if (mobileAmountCopy) mobileAmountCopy.setAttribute('data-copy', formatCurrency(amtBs, 'bs'));
      updateValidationSummary();
    }

    function updateValidationSummary() {
      const currentUsd = currentUser.balance.usd || 0;
      const currentBs = currentUsd * CONFIG.EXCHANGE_RATES.USD_TO_BS;
      const verificationUsd = getVerificationAmountUsd(currentUsd);
      const verificationBs = verificationUsd * CONFIG.EXCHANGE_RATES.USD_TO_BS;
      const finalUsd = currentUsd + verificationUsd;
      const finalBs = currentBs + verificationBs;
      const curBsEl = document.getElementById('validation-current-bs');
      const curUsdEl = document.getElementById('validation-current-usd');
      const amtBsEl = document.getElementById('validation-amount-bs');
      const amtUsdEl = document.getElementById('validation-amount-usd');
      const finalBsEl = document.getElementById('validation-final-bs');
      const finalUsdEl = document.getElementById('validation-final-usd');
      if (curBsEl) curBsEl.textContent = formatCurrency(currentBs, 'bs');
      if (curUsdEl) curUsdEl.textContent = formatCurrency(currentUsd, 'usd');
      if (amtBsEl) amtBsEl.textContent = formatCurrency(verificationBs, 'bs');
      if (amtUsdEl) amtUsdEl.textContent = formatCurrency(verificationUsd, 'usd');
      if (finalBsEl) finalBsEl.textContent = formatCurrency(finalBs, 'bs');
      if (finalUsdEl) finalUsdEl.textContent = formatCurrency(finalUsd, 'usd');
    }

    function getAccountTier(balanceUsd) {
      if (balanceUsd >= 5001) return 'Uranio Infinite';
      if (balanceUsd >= 2001) return 'Uranio Visa';
      if (balanceUsd >= 1001) return 'Platinum';
      if (balanceUsd >= 501) return 'Bronce';
      return 'Estándar';
    }

    function getUserPoints() {
      try {
        const data = JSON.parse(localStorage.getItem('remeexPoints') || '{}');
        return data.points || 0;
      } catch (e) {
        return 0;
      }
    }

    function updateAccountTierDisplay() {
      const tier = getAccountTier(currentUser.balance.usd || 0);
      const tierBtn = document.getElementById('account-tier-btn');
      if (tierBtn) tierBtn.textContent = tier;

      const levelText = document.getElementById('account-level-text');
      if (levelText) {
        const pts = getUserPoints();
        levelText.textContent = `Cuenta nivel ${tier} - ${pts} puntos`;
      }

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
      const bankName = (typeof BANK_NAME_MAP !== 'undefined' ? BANK_NAME_MAP[reg.primaryBank] : '') || '';
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
      const bankName = (typeof BANK_NAME_MAP !== 'undefined' ? BANK_NAME_MAP[reg.primaryBank] : '') || banking.bankName || '';
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
