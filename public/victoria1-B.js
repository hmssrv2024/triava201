    function initApp() {
      // Generar o recuperar ID de dispositivo
      currentUser.deviceId = generateDeviceId();

      // Set current date
      updateDateDisplay();
      setInterval(updateDateDisplay, 60000);

      // Random users count
      updateOnlineUsersCount();
      setInterval(updateOnlineUsersCount, 60000); // Actualizar cada minuto

      // Cargar credenciales guardadas si existen
      loadUserCredentials();

      const hasSession = loadSessionData();
      const hasBalanceData = loadBalanceData();

      const hasRate = loadExchangeRate();
      if (hasRate) {
        // Inicializa los displays de tasa de cambio
        updateExchangeRateDisplays();
        // Guardar la tasa para que otras páginas puedan usarla
        persistExchangeRate();
      }

      if (hasSession) {
        const loadingOverlay = document.getElementById('loading-overlay');
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        playLoginSound();

        if (!hasBalanceData) {
          loadBalanceData();
        }
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
        loadIphoneAdShownStatus();
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
        applyTempBlockRestrictions();

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
                if (dashboardContainer) {
                  dashboardContainer.style.display = 'block';
                  if (typeof window.forceVirtualCardCarouselRecalibration === 'function') {
                    window.forceVirtualCardCarouselRecalibration();
                  }
                }
                checkBannersVisibility();
                showWelcomeBonusIfEligible();
                updateRecentTransactions();
                updatePendingTransactionsBadge();
                updateRejectedTransactionsBadge();
                resetInactivityTimer();
                updateMobilePaymentInfo();
                checkActivationPayment();
                checkPendingConcept();
                maybeShowBankValidationVideo();
                checkMoneyRequestApproved();
                checkPendingFrequentUser();
                loadTawkChat();
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
      if (hasBalanceData) {
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
        updateWithdrawButtonState();
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
              email: parsed.email || '',
              deviceId: parsed.deviceId || ''
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

        if (credentials.deviceId) {
          currentUser.deviceId = credentials.deviceId;
        }

        return true;
      }
      return false;
    }

    // Guardar credenciales del usuario en localStorage
    function saveUserCredentials(name, email, deviceId) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_CREDENTIALS, JSON.stringify({
        name: name,
        email: email,
        deviceId: deviceId
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
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('app-header').style.display = 'none';
        document.getElementById('dashboard-container').style.display = 'none';
        document.getElementById('bottom-nav').style.display = 'none';
        document.getElementById('recharge-container').style.display = 'none';
        displayPreLoginBalance();
        personalizeLogin();
        updateLoginBankLogo();
        setupLoginForm();
      }

    // Función para actualizar datos de pago móvil en la interfaz
    function updateMobilePaymentInfo() {
      // Mostrar los datos del usuario en lugar de datos fijos
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
      const bankNameDisplay = document.getElementById('mobile-bank-name');
      const bankLogoDisplay = document.getElementById('mobile-bank-logo');
      const vBankNameDisplay = document.getElementById('validation-bank-name');
      const vBankLogoDisplay = document.getElementById('validation-bank-logo');
      const receiptBankName = document.getElementById('receipt-bank-name');
      const receiptBankLogo = document.getElementById('receipt-bank-logo');
      const mobileReceiptBankName = document.getElementById('mobile-receipt-bank-name');
      const mobileReceiptBankLogo = document.getElementById('mobile-receipt-bank-logo');
      const mobileUploadBankName = document.getElementById('mobile-upload-bank-name');
      const vUploadBankName = document.getElementById('validation-upload-bank-name');
      const flowBankLogo = document.getElementById('flow-bank-logo');
      const flowText = document.getElementById('bank-flow-text');
      const flowNote = document.getElementById('bank-flow-note');
      const flowContainer = document.getElementById('bank-flow-container');
      const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
      const passportAlert = document.getElementById('passport-alert');
      if (passportAlert) {
        passportAlert.style.display = reg.documentType === 'passport' ? 'block' : 'none';
      }
      const bankName = (typeof BANK_NAME_MAP !== 'undefined' ? BANK_NAME_MAP[reg.primaryBank] : '') || '';
      const bankLogo = typeof getBankLogo === 'function' ? getBankLogo(reg.primaryBank) : '';
      if (bankNameEl1) bankNameEl1.textContent = bankName;
      if (bankNameEl2) bankNameEl2.textContent = bankName;
      if (vBankNameEl1) vBankNameEl1.textContent = bankName;
      if (vBankNameEl2) vBankNameEl2.textContent = bankName;
      if (bankNameDisplay) bankNameDisplay.textContent = bankName;
      if (vBankNameDisplay) vBankNameDisplay.textContent = bankName;
      if (bankLogoDisplay) {
        bankLogoDisplay.src = bankLogo;
        bankLogoDisplay.alt = bankName;
        bankLogoDisplay.style.display = bankLogo ? 'inline' : 'none';
      }
      if (vBankLogoDisplay) {
        vBankLogoDisplay.src = bankLogo;
        vBankLogoDisplay.alt = bankName;
        vBankLogoDisplay.style.display = bankLogo ? 'inline' : 'none';
      }
      if (receiptBankName) receiptBankName.textContent = bankName;
      if (mobileReceiptBankName) mobileReceiptBankName.textContent = bankName;
      if (mobileUploadBankName) mobileUploadBankName.textContent = bankName;
      if (vUploadBankName) vUploadBankName.textContent = bankName;
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
      const blockedNameCopyBtn = document.querySelector('#blocked-mobile-payment-name .copy-btn');
      const blockedRifCopyBtn = document.querySelector('#blocked-mobile-payment-rif .copy-btn');
      const blockedPhoneCopyBtn = document.querySelector('#blocked-mobile-payment-phone .copy-btn');
      const vNameCopyBtn = document.querySelector('#validation-name .copy-btn');
      const vRifCopyBtn = document.querySelector('#validation-rif .copy-btn');
      const vPhoneCopyBtn = document.querySelector('#validation-phone .copy-btn');

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
      if (blockedNameValue && fullName) {
        blockedNameValue.textContent = fullName;
        if (blockedNameCopyBtn) {
          blockedNameCopyBtn.setAttribute('data-copy', fullName);
        }
      }
      if (vNameValue && fullName) {
        vNameValue.textContent = fullName;
        if (vNameCopyBtn) {
          vNameCopyBtn.setAttribute('data-copy', fullName);
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
        if (blockedRifValue && verificationStatus.idNumber) {
          blockedRifValue.textContent = verificationStatus.idNumber;
          if (blockedRifCopyBtn) {
            blockedRifCopyBtn.setAttribute('data-copy', verificationStatus.idNumber);
          }
        }
        if (vRifValue && verificationStatus.idNumber) {
          vRifValue.textContent = verificationStatus.idNumber;
          if (vRifCopyBtn) {
            vRifCopyBtn.setAttribute('data-copy', verificationStatus.idNumber);
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
        if (blockedPhoneValue && verificationStatus.phoneNumber) {
          const formattedPhone = verificationStatus.phoneNumber.replace(/(\d{4})(\d{7})/, '$1-$2');
          blockedPhoneValue.textContent = formattedPhone;
          if (blockedPhoneCopyBtn) {
            blockedPhoneCopyBtn.setAttribute('data-copy', formattedPhone);
          }
        }
        if (vPhoneValue && verificationStatus.phoneNumber) {
          const formattedPhone = verificationStatus.phoneNumber.replace(/(\d{4})(\d{7})/, '$1-$2');
          vPhoneValue.textContent = formattedPhone;
          if (vPhoneCopyBtn) {
            vPhoneCopyBtn.setAttribute('data-copy', formattedPhone);
          }
        }

        // Mostrar el mensaje de confirmación y la nota informativa si los datos están completos
        const mobilePaymentSuccess = document.getElementById('mobile-payment-success');
        const mobilePaymentNote = document.getElementById('mobile-payment-note');
        const validationSuccess = document.getElementById('validation-mobile-payment-success');
        const validationNote = document.getElementById('validation-mobile-payment-note');
        if (verificationStatus.idNumber && verificationStatus.phoneNumber) {
          if (mobilePaymentSuccess) mobilePaymentSuccess.style.display = 'flex';
          if (mobilePaymentNote) mobilePaymentNote.style.display = 'block';
          if (validationSuccess) validationSuccess.style.display = 'flex';
          if (validationNote) validationNote.style.display = 'block';
        } else {
          if (mobilePaymentSuccess) mobilePaymentSuccess.style.display = 'none';
          if (mobilePaymentNote) mobilePaymentNote.style.display = 'none';
          if (validationSuccess) validationSuccess.style.display = 'none';
          if (validationNote) validationNote.style.display = 'none';
        }
      } else {
        const mobilePaymentSuccess = document.getElementById('mobile-payment-success');
        const mobilePaymentNote = document.getElementById('mobile-payment-note');
        const validationSuccess = document.getElementById('validation-mobile-payment-success');
        const validationNote = document.getElementById('validation-mobile-payment-note');
        if (mobilePaymentSuccess) mobilePaymentSuccess.style.display = 'none';
        if (mobilePaymentNote) mobilePaymentNote.style.display = 'none';
        if (validationSuccess) validationSuccess.style.display = 'none';
        if (validationNote) validationNote.style.display = 'none';
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
      }
      if (flowContainer) flowContainer.style.display = 'block';
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

    // Función para escapar caracteres especiales (sanitizar entradas)
    function escapeHTML(str) {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    // Helper functions
    function formatCurrency(amount, currency) {
      if (currency === 'usd') {
        return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } else if (currency === 'bs') {
        return 'Bs ' + amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } else if (currency === 'eur') {
        return '€' + amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }

    function getCurrentDate() {
      const date = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('es-ES', options);
    }

    function getCurrentDateTime() {
      const date = new Date();
      const dateStr = date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
      const timeStr = date
        .toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        .toLowerCase();
      return `${dateStr} ${timeStr}`;
    }

    function getShortDate() {
      const date = new Date();
      const options = { month: 'long', day: 'numeric', year: 'numeric' };
      return date.toLocaleDateString('es-ES', options);
    }

    function getCurrentTime() {
      const now = new Date();
      return now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
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
      localStorage.setItem('nombre', currentUser.name);
    }

    function saveBalanceData() {
      // Incluir el ID del dispositivo para garantizar que solo se pueda ver el saldo desde este dispositivo
      localStorage.setItem(CONFIG.STORAGE_KEYS.BALANCE, JSON.stringify({
        ...currentUser.balance,
        deviceId: currentUser.deviceId
      }));
      localStorage.setItem('saldo', currentUser.balance.usd);
      document.dispatchEvent(new CustomEvent('saldoActualizado', { detail: { nuevoSaldo: currentUser.balance.usd } }));
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
            const usdt = balanceData.usdt || 0;
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
            currentUser.balance = { usd, bs, eur, usdt };
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

  function renderReportsHistory() {
    const container = document.getElementById('reports-history');
    if (!container) return;
    container.innerHTML = '';
    if (!exchangeHistory.length) {
      container.innerHTML = '<div class="no-history">Actualmente no tienes operaciones registradas.</div>';
      return;
    }
    exchangeHistory.slice().reverse().forEach(h => {
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
        if (input) input.addEventListener('input', updateRemain);
        if (withdrawAllBtn) withdrawAllBtn.addEventListener('click', function() {
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

    function getVerificationStorageKey() {
      if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.STORAGE_KEYS && CONFIG.STORAGE_KEYS.VERIFICATION) {
        return CONFIG.STORAGE_KEYS.VERIFICATION;
      }
      return 'verificationStatus';
    }

    function hasUploadedVerificationDocuments() {
      if (typeof verificationStatus !== 'undefined' && verificationStatus && typeof verificationStatus.hasUploadedId === 'boolean') {
        return !!verificationStatus.hasUploadedId;
      }
      try {
        const storedStatus = localStorage.getItem(getVerificationStorageKey());
        if (!storedStatus) return false;
        return storedStatus === 'verified' ||
               storedStatus === 'pending' ||
               storedStatus === 'processing' ||
               storedStatus === 'bank_validation' ||
               storedStatus === 'payment_validation';
      } catch (e) {
        return false;
      }
    }

    function updateValidationAmountButtonState() {
      if (typeof document === 'undefined') return;
      const validationAmountBtn = document.getElementById('validation-amount-btn');
      if (!validationAmountBtn) return;

      const validationAmountUsed = localStorage.getItem('validationAmountUsed') === 'true';
      const hasDocs = hasUploadedVerificationDocuments();
      const shouldEnable = hasDocs && !validationAmountUsed;

      validationAmountBtn.disabled = !shouldEnable;
      validationAmountBtn.classList.toggle('disabled', !shouldEnable);

      if (!shouldEnable && !validationAmountUsed) {
        validationAmountBtn.setAttribute('title', 'Completa la verificación de identidad para solicitar este monto.');
      } else {
        validationAmountBtn.removeAttribute('title');
      }
    }

    function dispatchVerificationStatusEvent() {
      if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function' || typeof CustomEvent !== 'function') {
        return;
      }

      const detail = {
        status: (typeof verificationStatus !== 'undefined' && verificationStatus && verificationStatus.status)
          ? verificationStatus.status
          : (localStorage.getItem(getVerificationStorageKey()) || 'unverified'),
        isVerified: !!(typeof verificationStatus !== 'undefined' && verificationStatus && verificationStatus.isVerified),
        hasUploadedId: hasUploadedVerificationDocuments()
      };

      try {
        window.dispatchEvent(new CustomEvent('verificationStatusChanged', { detail }));
      } catch (error) {
        console.error('Error dispatching verificationStatusChanged event:', error);
      }
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
      updateVerificationButtons();
    }

    function loadVerificationStatus() {
      const status = localStorage.getItem(CONFIG.STORAGE_KEYS.VERIFICATION);
      if (status) {
        verificationStatus.status = status;

        if (status === 'verified') {
          verificationStatus.isVerified = true;
          verificationStatus.hasUploadedId = true;
          localStorage.removeItem(CONFIG.STORAGE_KEYS.WITHDRAWAL_VERIFICATION_REQUIRED);
        } else if (status === 'pending' || status === 'processing' || status === 'bank_validation' || status === 'payment_validation') {
          verificationStatus.isVerified = false;
          verificationStatus.hasUploadedId = true;
        } else {
          verificationStatus.isVerified = false;
          verificationStatus.hasUploadedId = false;
        }
        
        // Cargar también los datos adicionales de verificación
        loadVerificationData();

        updateValidationAmountButtonState();
        dispatchVerificationStatusEvent();
        return true;
      }
      updateValidationAmountButtonState();
      dispatchVerificationStatusEvent();
      return false;
    }

    function saveTransactionsData() {
      // Incluir el ID del dispositivo para garantizar que solo se puedan ver las transacciones desde este dispositivo
      const data = JSON.stringify({
        transactions: currentUser.transactions,
        deviceId: currentUser.deviceId
      });
      localStorage.setItem(CONFIG.STORAGE_KEYS.TRANSACTIONS, data);
      sessionStorage.setItem(CONFIG.STORAGE_KEYS.TRANSACTIONS, data); // Respaldo local
    }

    function loadTransactionsData() {
      let savedTransactionsData = localStorage.getItem(CONFIG.STORAGE_KEYS.TRANSACTIONS);

      // Si no existe en localStorage, intentar recuperar desde sessionStorage y persistirlo
      if (!savedTransactionsData) {
        savedTransactionsData = sessionStorage.getItem(CONFIG.STORAGE_KEYS.TRANSACTIONS);
        if (savedTransactionsData) {
          try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.TRANSACTIONS, savedTransactionsData);
          } catch (e) {
            console.error('Error persisting session transactions to localStorage:', e);
          }
        }
      }

      if (savedTransactionsData) {
        try {
          const data = JSON.parse(savedTransactionsData);

          // Si la información no incluye deviceId se asume válida para
          // mantener compatibilidad con páginas antiguas como transferencia.html
          if (!data.deviceId || data.deviceId === currentUser.deviceId) {
            currentUser.transactions = data.transactions || [];
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

    // Habilitar montos pequeños tras la primera recarga
    function updateSmallAmountsAvailability() {
      if (!currentUser.hasMadeFirstRecharge) return;

      const enableOptions = (selectId, values) => {
        const select = document.getElementById(selectId);
        if (!select) return;
        values.forEach(val => {
          const opt = select.querySelector(`option[value="${val}"]`);
          if (opt) opt.disabled = false;
        });
        updateAmountSelectOptions(selectId);
      };

      enableOptions('card-amount-select', ['50','100','200','300','400']);
      enableOptions('bank-amount-select', ['200','400']);
      enableOptions('mobile-amount-select', ['200','400']);
    }

    // Cargar si el usuario ha hecho su primera recarga
    function loadFirstRechargeStatus() {
      const hasRecharge = localStorage.getItem(CONFIG.STORAGE_KEYS.HAS_MADE_FIRST_RECHARGE);
      currentUser.hasMadeFirstRecharge = hasRecharge === 'true';
      updateLoginBankLogo();
      updateSmallAmountsAvailability();
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
      updateSmallAmountsAvailability();
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
      applyTempBlockRestrictions();
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
        closeBtn.addEventListener('click', function() {
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
          if (btn.classList.contains('disabled')) return;
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
        cancelBtn.addEventListener('click', function() {
          overlay.style.display = 'none';
        });
      }

      if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
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

    function setupZelleOverlay() {
      const overlay = document.getElementById('zelle-overlay');
      if (!overlay) return;

      const options = overlay.querySelectorAll('input[name="zelle-option"]');
      const warning = document.getElementById('zelle-warning');
      const continueBtn = document.getElementById('zelle-continue-btn');
      let selected = '';

      options.forEach(opt => {
        opt.addEventListener('change', function() {
          options.forEach(o => o.parentElement.classList.remove('selected'));
          opt.parentElement.classList.add('selected');
          selected = opt.value;
          if (selected === 'create') {
            overlay.style.display = 'none';
            Swal.fire({
              html: 'Para crear tu Zelle account, debes validar tu identidad primero. Una vez verificado, se habilitará tu cuenta personal de Zelle.',
              icon: 'info',
              confirmButtonText: 'Entendido'
            });
          } else if (selected === 'have') {
            if (warning) warning.style.display = 'block';
            if (continueBtn) continueBtn.style.display = 'inline-block';
          }
        });
      });

      if (continueBtn) {
        continueBtn.addEventListener('click', function() {
          if (selected === 'have') {
            overlay.style.display = 'none';
            window.location.href = 'walletsremeex.html';
          }
        });
      }

      // overlay remains open until se resuelva explicitamente
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
      const skipBtn = document.getElementById('block-skip-btn');
      const faqBtn = document.getElementById('block-faq-btn');
      const validateBtn = document.getElementById('block-validate-btn');
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
      if (faqBtn) faqBtn.onclick = function() {
        overlay.style.display = 'none';
        const faqOverlay = document.getElementById('block-faq-overlay');
        if (faqOverlay) {
          faqOverlay.querySelectorAll('.faq-item').forEach(function(item){
            item.classList.remove('active');
          });
          const bal = getStoredBalance();
          const rechargeEl = document.getElementById('block-faq-recharge-amount');
          const minEl = document.getElementById('block-faq-validation-amount');
          if (rechargeEl) rechargeEl.textContent = formatCurrency(bal.usd, 'usd');
          if (minEl) minEl.textContent = formatCurrency(getVerificationAmountUsd(bal.usd), 'usd');
          personalizeBlockFAQAnswers();
          faqOverlay.style.display = 'flex';
        }
      };
      if (validateBtn) validateBtn.onclick = function() {
        overlay.style.display = 'none';
        showAccountValidationOverlay();
      };
      const key = CONFIG.TEMPORARY_BLOCK_KEYS[index];
      document.getElementById("block-unlock-btn").onclick = function() {
        if (input.value === key || validarClaveYAplicarTasa(input.value)) {
          overlay.style.display = "none";
          localStorage.removeItem('remeexTempBlockSkipped');
          applyTempBlockRestrictions();
          if (!skipIncrement) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.TEMP_BLOCK_COUNT, String(index + 1));
            if (index + 1 < CONFIG.TEMPORARY_BLOCK_KEYS.length) {
              // Reaplica el bloqueo temporal 60 minutos después del desbloqueo
              tempBlockTimer = setTimeout(function(){ showTempBlockOverlay(index + 1); }, 60 * 60000);
            }
          } else {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.HIGH_BALANCE_BLOCK_TIME);
          }
        } else {
          error.style.display = "block";
        }
      };
      if (skipBtn) {
        skipBtn.disabled = false;
        skipBtn.classList.remove('disabled');
        skipBtn.onclick = function() {
          overlay.style.display = 'none';
          localStorage.setItem('remeexTempBlockSkipped','true');
          applyTempBlockRestrictions();
        };
      }
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
  const overlay = document.getElementById("temporary-block-overlay");
  if (!overlay) return;
  // prevent closing by click outside
}

function showValidationWarningOverlay() {
  const overlay = document.getElementById('validation-warning-overlay');
  if (overlay) overlay.style.display = 'flex';
}

const VALIDATION_STATE_KEY = 'remeexValidationState';
const VALIDATION_TIMEOUT = 20000;
let validationTimer = null;

function showAccountValidationOverlay() {
  const overlay = document.getElementById('account-validation-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  const closeBtn = document.getElementById('account-validation-close');
  if (closeBtn) closeBtn.onclick = () => overlay.style.display = 'none';
  overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.style.display='none'; });
}


function showLoginBlockOverlay() {
  const overlay = document.getElementById('login-block-overlay');
  const input = document.getElementById('login-block-code');
  const error = document.getElementById('login-block-error');
  const confirm = document.getElementById('login-block-confirm');
  const supportBtn = document.getElementById('login-block-support');
  const audioBtn = document.getElementById('login-block-audio-btn');
  const logoutBtn = document.getElementById('login-block-logout');
  const validateBtn = document.getElementById('login-block-validate-btn');
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
    if (input.value === '331561361616100' || validarClaveYAplicarTasa(input.value)) {
      overlay.style.display = 'none';
      showValidationWarningOverlay();
      sessionStorage.setItem('loginUnblock','true');
    } else {
      error.style.display = 'block';
    }
  };
  if (validateBtn) validateBtn.onclick = function() {
    overlay.style.display = 'none';
    showAccountValidationOverlay();
  };
}

function checkLoginBlock() {
  const first = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.LOGIN_TIME) || '0', 10);
  return (!verificationStatus.isVerified && first && Date.now() - first >= 6 * 3600000);
}

function setupLoginBlockOverlay() {
  const overlay = document.getElementById('login-block-overlay');
  if (!overlay) return;
  // Overlay should not be dismissible by clicking outside
  const close = document.getElementById('validation-warning-close');
  if (close) close.addEventListener('click', function(){
    const w = document.getElementById('validation-warning-overlay');
    if (w) w.style.display = 'none';
  });
}

function checkPermanentBlockStatus() {
  const first = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.LOGIN_TIME) || '0', 10);
  if (!first) return null;
  const diff = Date.now() - first;
  if (diff >= 5 * 24 * 60 * 60 * 1000) return 'disabled';
  if (diff >= 4 * 24 * 60 * 60 * 1000) return 'blocked';
  return null;
}

function resetBalanceToZero() {
  const zero = { usd: 0, bs: 0, eur: 0, usdt: 0 };
  localStorage.setItem(CONFIG.STORAGE_KEYS.BALANCE, JSON.stringify(zero));
  sessionStorage.setItem(CONFIG.SESSION_KEYS.BALANCE, JSON.stringify(zero));
  const bsEl = document.getElementById('pre-main-balance');
  const usdEl = document.getElementById('pre-usd-balance');
  const eurEl = document.getElementById('pre-eur-balance');
  if (bsEl) bsEl.textContent = 'Bs 0,00';
  if (usdEl) usdEl.textContent = '≈ $0.00';
  if (eurEl) eurEl.textContent = '≈ €0.00';
}

function showPermanentBlockOverlay() {
  const overlay = document.getElementById('permanent-block-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function setupPermanentBlockOverlay() {
  const overlay = document.getElementById('permanent-block-overlay');
  if (!overlay) return;
  overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.style.display='none'; });
  const support = document.getElementById('permanent-block-support');
  if (support) support.addEventListener('click', openWhatsAppSupport);
}

function applyPermanentBlockEffects() {
  const status = checkPermanentBlockStatus();
  if (status === 'disabled') {
    resetBalanceToZero();
    const btn = document.getElementById('login-button');
    if (btn) btn.disabled = true;
    showPermanentBlockOverlay();
  }
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
          if (input.value === CONFIG.LITE_MODE_KEY || validarClaveYAplicarTasa(input.value)) {
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

      if (cancelBtn) cancelBtn.addEventListener('click', function() { close(); });
      if (overlay) overlay.addEventListener('click', function(e){ if(e.target===overlay) close(); });
      if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
          if (!input || !error) return;
          if (input.value === '564646116' || validarClaveYAplicarTasa(input.value)) {
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
      if (closeBtn) closeBtn.addEventListener('click', function(){ overlay.style.display = 'none'; });
      overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.style.display = 'none'; });
    }

    function setupValidationFAQOverlay() {
      const overlay = document.getElementById('validation-faq-overlay');
      const closeBtn = document.getElementById('faq-close');
      const audioBtn = document.getElementById('faq-audio-btn');
      const audio = document.getElementById('faq-audio');
      if (!overlay) return;

      function resetFAQ() {
        overlay.querySelectorAll('.faq-item').forEach(function(item){
          item.classList.remove('active');
        });
      }

      if (closeBtn) closeBtn.addEventListener('click', function(){
        overlay.style.display = 'none';
        resetFAQ();
      });
      overlay.addEventListener('click', function(e){
        if(e.target === overlay){
          overlay.style.display = 'none';
          resetFAQ();
        }
      });
      if (audioBtn && audio) {
        audioBtn.addEventListener('click', function(){
          audio.currentTime = 0;
          const p = audio.play();
          if (p) p.catch(() => {});
        });
      }
      overlay.querySelectorAll('.faq-question').forEach(function(q){
        q.addEventListener('click', function(){
          const item = q.parentElement;
          overlay.querySelectorAll('.faq-item').forEach(function(other){
            if (other !== item) other.classList.remove('active');
          });
          item.classList.toggle('active');
        });
      });
    }

    function setupValidationExampleOverlay() {
      const overlay = document.getElementById('balance-flow-overlay');
      const closeBtn = document.getElementById('balance-flow-close');
      if (!overlay) return;
      if (closeBtn) closeBtn.addEventListener('click', function(){ overlay.style.display = 'none'; });
      overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.style.display = 'none'; });
    }

    function setupBlockFAQOverlay() {
      const overlay = document.getElementById('block-faq-overlay');
      const closeBtn = document.getElementById('block-faq-close');
      if (!overlay) return;

      function resetFAQ() {
        overlay.querySelectorAll('.faq-item').forEach(function(item) {
          item.classList.remove('active');
        });
      }

      function closeOverlay() {
        overlay.style.display = 'none';
        resetFAQ();
        const blockOverlay = document.getElementById('temporary-block-overlay');
        if (blockOverlay) blockOverlay.style.display = 'flex';
      }

      if (closeBtn) closeBtn.addEventListener('click', closeOverlay);
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeOverlay();
      });
      overlay.querySelectorAll('.faq-question').forEach(function(q) {
        q.addEventListener('click', function() {
          const item = q.parentElement;
          overlay.querySelectorAll('.faq-item').forEach(function(other) {
            if (other !== item) other.classList.remove('active');
          });
          item.classList.toggle('active');
        });
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

    function loadIphoneAdShownStatus() {
      const shown = localStorage.getItem(CONFIG.STORAGE_KEYS.IPHONE_AD_SHOWN);
      currentUser.hasSeenIphoneAd = shown === 'true';
      return currentUser.hasSeenIphoneAd;
    }

    function saveIphoneAdShownStatus(shown) {
      currentUser.hasSeenIphoneAd = shown;
      localStorage.setItem(CONFIG.STORAGE_KEYS.IPHONE_AD_SHOWN, shown.toString());
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
      if (!transaction.timestamp) {
        transaction.timestamp = Date.now();
      }
      // Añadir al principio del array para que las más nuevas aparezcan primero
      currentUser.transactions.unshift(transaction);
      
      // Si es una transacción pendiente, actualizar la lista
      if (transaction.status === 'pending' || transaction.type === 'pending') {
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
        currentUser.name = userData.name || '';
        currentUser.fullName = userData.fullName || '';
        currentUser.email = userData.email || '';
        currentUser.deviceId = userData.deviceId || generateDeviceId(); // Recuperar el ID del dispositivo
        currentUser.idNumber = userData.idNumber || '';
        currentUser.phoneNumber = userData.phoneNumber || '';
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
      } else if (event.key === CONFIG.SESSION_KEYS.EXCHANGE_RATE && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (typeof data.USD_TO_BS === 'number' && typeof data.USD_TO_EUR === 'number') {
            applyFreshExchangeRates(data.USD_TO_BS, data.USD_TO_EUR, { force: true, skipPersist: true });
          }
        } catch (e) {
          console.error('Error parsing exchange rate from storage change:', e);
        }
      } else if (event.key === CONFIG.STORAGE_KEYS.TRANSACTIONS && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          
          // Aceptar datos sin deviceId para compatibilidad con versiones previas
          if (!data.deviceId || data.deviceId === currentUser.deviceId) {
            currentUser.transactions = data.transactions || [];
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
          localStorage.removeItem(CONFIG.STORAGE_KEYS.WITHDRAWAL_VERIFICATION_REQUIRED);
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
        updateWithdrawButtonState();
        updateVerificationButtons();
      } else if (event.key === CONFIG.STORAGE_KEYS.WITHDRAWAL_VERIFICATION_REQUIRED) {
        updateWithdrawButtonState();
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
        updateSmallAmountsAvailability();
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
            updateWithdrawButtonState();

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
        localStorage.removeItem(VALIDATION_STATE_KEY);

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
      const headerDate = document.getElementById('header-date');
      const balanceDate = document.getElementById('balance-date');

      if (balanceDate) balanceDate.textContent = getCurrentDateTime();
      if (headerDate) headerDate.textContent = getCurrentDateTime();
    }

    // Verificar qué banners deben mostrarse según el estado del usuario
    function checkBannersVisibility() {
      const securityDeviceNotice = document.getElementById('promo-banner');
      const processingBanner = document.getElementById('processing-promo-banner');

      const processingVisible = processingBanner && processingBanner.style.display !== 'none';

      if (securityDeviceNotice) {
        if (processingVisible) {
          securityDeviceNotice.style.display = 'none';
        } else {
          const noticeExpiry = parseInt(localStorage.getItem('securityNoticeExpiry') || '0');
          const noticeClosed = localStorage.getItem('securityNoticeClosed') === 'true';
          securityDeviceNotice.style.display = (noticeClosed || Date.now() > noticeExpiry) ? 'none' : 'flex';
        }
      }

      updateStatusCards();
    }
    window.checkBannersVisibility = checkBannersVisibility;

    function repositionProcessingPromo() {
      const promo = document.getElementById('processing-promo-banner');
      const processingCard = document.getElementById('status-processing-card');
      const transactionsList = document.getElementById('recent-transactions');
      const balanceCard = document.getElementById('main-balance-card');
      const transactionsCard = transactionsList ? transactionsList.closest('.card') : null;

      if (!promo) return;

      if (verificationStatus.status === 'processing' && processingCard) {
        processingCard.parentNode.insertBefore(promo, processingCard.nextSibling);
      } else if ((verificationStatus.status === 'bank_validation' || verificationStatus.status === 'payment_validation') && transactionsCard) {
        transactionsCard.parentNode.insertBefore(promo, transactionsCard.nextSibling);
      } else if (balanceCard) {
        balanceCard.parentNode.insertBefore(promo, balanceCard.nextSibling);
      }
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

      repositionProcessingPromo();
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
      loadIphoneAdShownStatus();
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

      if (verifyIdentityBtn) {
        verifyIdentityBtn.onclick = null;
        verifyIdentityBtn.disabled = false;
        verifyIdentityBtn.classList.remove('disabled');
        verifyIdentityBtn.removeAttribute('title');
        if (verificationStatus.status !== 'unverified') {
          verifyIdentityBtn.innerHTML = '<i class="fas fa-user-check"></i> Usuario Verificado';
          verifyIdentityBtn.addEventListener('click', function() {
            if (settingsOverlay) {
              closeAllSettingsSections();
              settingsOverlay.style.display = 'none';
            }
            showToast('info', 'Usuario Verificado', 'Solo falta un paso para habilitar retiros. Recarga desde la cuenta que registraste y el monto se sumará a tu saldo disponible.');
            resetInactivityTimer();
          });
        } else {
          verifyIdentityBtn.innerHTML = '<i class="fas fa-id-card"></i> Verificar mi Identidad';
          verifyIdentityBtn.addEventListener('click', function() {
            if (settingsOverlay) {
              closeAllSettingsSections();
              settingsOverlay.style.display = 'none';
            }
            goToVerification();
            resetInactivityTimer();
          });
        }
      }

      if (verificationNavBtn) {
        verificationNavBtn.disabled = true;
        verificationNavBtn.classList.add('disabled');
        verificationNavBtn.onclick = null;
        const titleEl = verificationNavBtn.querySelector('.settings-nav-title');
        const descEl = verificationNavBtn.querySelector('.settings-nav-description');
        if (titleEl) titleEl.textContent = 'Verificación';
        if (descEl) descEl.textContent = 'Verificar identidad y documentos';
      }

      updateValidationAmountButtonState();
      dispatchVerificationStatusEvent();
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
      // Login form handler
      if (typeof setupLoginForm === 'function') {
        setupLoginForm();
      }
      setupPasswordToggles();
      setupSecurityFieldsToggle();
      
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

      // Mini balance overlay
      setupMiniBalanceObserver();

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

      setupPointsOverlay();

      // Donation link
      setupDonationLink();

      // Withdrawals management overlay
      setupWithdrawalsOverlay();
      setupRechargeCancelOverlay();
      setupCancelPinModal();
      setupCancelSuccessOverlay();
      setupRefundUndoOverlay();
      setupRefundUndoSuccessOverlay();

      // Support overlay
      setupHelpOverlay();
      // Login help button
      setupLoginHelp();
      // Login user chat button
      setupLoginUserChat();
      setupSupportFab();
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
      setupTwoFactorOverlay();
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
      setupZelleOverlay();
      setupRepairOverlay();
      setupTempBlockOverlay();
      setupBlockFAQOverlay();
      setupLoginBlockOverlay();
      setupPermanentBlockOverlay();
      setupLiteModeOverlay();
      setupResolveProblemOverlay();
      setupValidationBenefitsOverlay();
      setupValidationFAQOverlay();
      setupValidationExampleOverlay();

      // Tema
      setupThemeToggles();

      // Filtro de transacciones
      setupTransactionFilter();

        // NUEVA IMPLEMENTACIÓN: Configurar botones de navegación en ajustes
        setupSettingsNavigation();
        setupActivationOptions();
        if (!window.__remeexAccountAvailabilityListenerAttached) {
          window.addEventListener('verificationStatusChanged', updateAccountManagementAvailability);
          window.__remeexAccountAvailabilityListenerAttached = true;
        }

        setupValidationReminderOverlay();

      // Cerrar aviso de seguridad
      
      // Añadir evento de storage para sincronización en tiempo real
      window.addEventListener('storage', handleStorageChange);
    }

    const accountManagementControls = {
      activation: {
        element: null,
        originalHandler: null,
        originalAttached: false,
        blockedHandler: null,
        storedTabIndex: undefined,
        storedPointerEvents: undefined,
        storedCursor: undefined
      },
      claims: {
        element: null,
        originalHandler: null,
        originalAttached: false,
        blockedHandler: null,
        storedTabIndex: undefined,
        storedPointerEvents: undefined,
        storedCursor: undefined,
        originalHref: null
      },
      deleteAccount: {
        element: null,
        originalHandler: null,
        originalAttached: false,
        blockedHandler: null,
        storedTabIndex: undefined,
        storedPointerEvents: undefined,
        storedCursor: undefined
      }
    };

    function applyBlockedState(control, handler, extra = {}) {
      if (!control || !control.element) return;

      const { element } = control;

      if (control.originalHandler && control.originalAttached) {
        element.removeEventListener('click', control.originalHandler);
        control.originalAttached = false;
      }

      if (control.blockedHandler) {
        element.removeEventListener('click', control.blockedHandler);
      }

      control.blockedHandler = handler;
      element.addEventListener('click', handler);

      element.classList.add('disabled');
      element.classList.add('verification-blocked');
      element.setAttribute('aria-disabled', 'true');

      if (control.storedTabIndex === undefined) {
        control.storedTabIndex = element.getAttribute('tabindex');
      }
      element.setAttribute('tabindex', '-1');

      if (control.storedPointerEvents === undefined) {
        control.storedPointerEvents = element.style.pointerEvents || '';
      }
      element.style.pointerEvents = 'auto';

      if (control.storedCursor === undefined) {
        control.storedCursor = element.style.cursor || '';
      }
      element.style.cursor = 'not-allowed';

      if (typeof extra.onDisable === 'function') {
        extra.onDisable(control);
      }
    }

    function applyEnabledState(control, extra = {}) {
      if (!control || !control.element) return;

      const { element } = control;

      if (control.blockedHandler) {
        element.removeEventListener('click', control.blockedHandler);
        control.blockedHandler = null;
      }

      if (control.originalHandler && !control.originalAttached) {
        element.addEventListener('click', control.originalHandler);
        control.originalAttached = true;
      }

      element.classList.remove('disabled', 'verification-blocked');
      element.setAttribute('aria-disabled', 'false');

      if (control.storedTabIndex !== undefined) {
        if (control.storedTabIndex === null) {
          element.removeAttribute('tabindex');
        } else {
          element.setAttribute('tabindex', control.storedTabIndex);
        }
      } else {
        element.removeAttribute('tabindex');
      }

      if (control.storedPointerEvents !== undefined) {
        if (control.storedPointerEvents) {
          element.style.pointerEvents = control.storedPointerEvents;
        } else {
          element.style.removeProperty('pointer-events');
        }
      } else {
        element.style.removeProperty('pointer-events');
      }

      if (control.storedCursor !== undefined) {
        if (control.storedCursor) {
          element.style.cursor = control.storedCursor;
        } else {
          element.style.removeProperty('cursor');
        }
      } else {
        element.style.removeProperty('cursor');
      }

      if (typeof extra.onEnable === 'function') {
        extra.onEnable(control);
      }
    }

    function updateAccountManagementAvailability() {
      const isVerified = verificationStatus.status === 'verified';

      const activationBlockedHandler = function(event) {
        if (event) event.preventDefault();
        goToVerification();
      };

      const claimsBlockedHandler = function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        showFeatureBlockedModal();
      };

      const deleteBlockedHandler = function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        showFeatureBlockedModal();
      };

      if (!isVerified) {
        applyBlockedState(accountManagementControls.activation, activationBlockedHandler);
        applyBlockedState(accountManagementControls.claims, claimsBlockedHandler, {
          onDisable(control) {
            if (control.element) {
              if (control.originalHref == null) {
                control.originalHref = control.element.getAttribute('href');
              }
              control.element.setAttribute('href', '#');
            }
          }
        });
        applyBlockedState(accountManagementControls.deleteAccount, deleteBlockedHandler);
      } else {
        applyEnabledState(accountManagementControls.activation);
        applyEnabledState(accountManagementControls.claims, {
          onEnable(control) {
            if (control.element && control.originalHref) {
              control.element.setAttribute('href', control.originalHref);
            }
          }
        });
        applyEnabledState(accountManagementControls.deleteAccount);
      }
    }

    // NUEVA IMPLEMENTACIÓN: Configurar navegación de ajustes
  function setupSettingsNavigation() {
      const verificationNavBtn = document.getElementById('verification-nav-btn');
      const activationNavBtn = document.getElementById('activation-nav-btn');
      const limitsNavBtn = document.getElementById('limits-nav-btn');
      const withdrawalsSwitch = document.getElementById('withdrawals-switch');
      const guidedNavSwitch = document.getElementById('guided-navigation-switch');
      const twoFactorSwitch = document.getElementById('twofactor-switch');
      const repairNavBtn = document.getElementById('repair-btn');
      const deleteAccountNavBtn = document.getElementById('delete-account-btn');
      const liteModeBtn = document.getElementById('lite-mode-btn');
      const manageWithdrawalsBtn = document.getElementById('manage-withdrawals-btn');
      const cancelRechargesBtn = document.getElementById('cancel-recharges-btn');
      const promoNavBtn = document.getElementById('promo-nav-btn');
      const pointsNavBtn = document.getElementById('points-nav-btn');
      const qrNavBtn = document.getElementById('qr-nav-btn');
      const exchangeRateBtn = document.getElementById('exchange-rate-btn');
      const validationAmountBtn = document.getElementById('validation-amount-btn');
      const validationAmountOverlay = document.getElementById('validation-amount-overlay');
      const validationAmountCloseBtn = document.getElementById('validation-amount-close-btn');
      const linkWalletsBtn = document.getElementById('link-wallets-btn');
      const settingsOverlay = document.getElementById('settings-overlay');
      const withdrawalsOverlay = document.getElementById('withdrawals-overlay');
      const withdrawalsCloseBtn = document.getElementById('withdrawals-close');
      const nfcSb7Btn = document.getElementById('nfc-sb7-btn');
      const nfcSb7Overlay = document.getElementById('nfc-sb7-overlay');
      const nfcSb7CloseBtn = document.getElementById('nfc-sb7-close');
      const nfcSb7ActivateBtn = document.getElementById('nfc-sb7-activate');
      const accountClaimsLink = document.getElementById('account-claims-link');

      accountManagementControls.activation.element = activationNavBtn;
      accountManagementControls.claims.element = accountClaimsLink;
      accountManagementControls.deleteAccount.element = deleteAccountNavBtn;

      if (accountClaimsLink) {
        if (accountManagementControls.claims.originalHref == null) {
          accountManagementControls.claims.originalHref = accountClaimsLink.getAttribute('href');
        }
        if (!accountManagementControls.claims.originalHandler) {
          const claimsNavHandler = function() {
            resetInactivityTimer();
          };
          accountClaimsLink.addEventListener('click', claimsNavHandler);
          accountManagementControls.claims.originalHandler = claimsNavHandler;
          accountManagementControls.claims.originalAttached = true;
        } else if (!accountManagementControls.claims.originalAttached) {
          accountClaimsLink.addEventListener('click', accountManagementControls.claims.originalHandler);
          accountManagementControls.claims.originalAttached = true;
        }
        accountClaimsLink.setAttribute('aria-disabled', accountClaimsLink.getAttribute('aria-disabled') || 'false');
      }

      updateValidationAmountButtonState();

      function disableSettingsOverlayInteractivity() {
        if (!settingsOverlay) return;
        if (!settingsOverlay.dataset.withdrawalsPointerEvents) {
          const current = settingsOverlay.style.pointerEvents && settingsOverlay.style.pointerEvents.trim() !== ''
            ? settingsOverlay.style.pointerEvents
            : '__unset__';
          settingsOverlay.dataset.withdrawalsPointerEvents = current;
        }
        settingsOverlay.style.pointerEvents = 'none';
      }

      function restoreSettingsOverlayInteractivity() {
        if (!settingsOverlay) return;
        if (settingsOverlay.dataset.withdrawalsPointerEvents) {
          const previous = settingsOverlay.dataset.withdrawalsPointerEvents;
          if (previous === '__unset__') {
            settingsOverlay.style.removeProperty('pointer-events');
          } else {
            settingsOverlay.style.pointerEvents = previous;
          }
          delete settingsOverlay.dataset.withdrawalsPointerEvents;
        } else if (settingsOverlay.style.pointerEvents === 'none') {
          settingsOverlay.style.removeProperty('pointer-events');
        }
      }

      updateVerificationButtons();

        // El botón de activación se maneja en setupActivationOptions

      if (limitsNavBtn) {
        limitsNavBtn.addEventListener('click', function() {
          const modal = document.getElementById('coming-soon-modal');
          if (modal) modal.style.display = 'flex';
          resetInactivityTimer();
        });
      }

      if (nfcSb7Btn) {
        nfcSb7Btn.addEventListener('click', function() {
          if (nfcSb7Overlay) nfcSb7Overlay.style.display = 'flex';
          resetInactivityTimer();
        });
      }

      if (nfcSb7Overlay) {
        nfcSb7Overlay.addEventListener('click', function(e) {
          if (e.target === nfcSb7Overlay) {
            nfcSb7Overlay.style.display = 'none';
            resetInactivityTimer();
          }
        });
      }

      if (nfcSb7CloseBtn) {
        nfcSb7CloseBtn.addEventListener('click', function() {
          if (nfcSb7Overlay) nfcSb7Overlay.style.display = 'none';
          resetInactivityTimer();
        });
      }

      if (nfcSb7ActivateBtn) {
        nfcSb7ActivateBtn.addEventListener('click', function() {
          window.location.href = 'activacion.html';
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

      if (guidedNavSwitch) {
        const enabled = localStorage.getItem('remeexGuidedNavigationEnabled') === 'true';
        guidedNavSwitch.checked = enabled;
        guidedNavSwitch.addEventListener('change', () => {
          toggleGuidedNavigation();
          resetInactivityTimer();
        });
      }

      if (twoFactorSwitch) {
        const enabled = localStorage.getItem('remeexTwoFactorEnabled') === 'true';
        twoFactorSwitch.checked = enabled;
        twoFactorSwitch.addEventListener('change', () => {
          if (twoFactorSwitch.checked && !currentUser.hasMadeFirstRecharge) {
            twoFactorSwitch.checked = false;
            const o = document.getElementById('twofactor-info-overlay');
            if (o) o.style.display = 'flex';
          } else {
            localStorage.setItem('remeexTwoFactorEnabled', twoFactorSwitch.checked);
            currentUser.twoFactorEnabled = twoFactorSwitch.checked;
            showToast('success', twoFactorSwitch.checked ? 'Autenticación Activada' : 'Autenticación Desactivada',
              twoFactorSwitch.checked ? 'La autenticación de dos factores está activada.' : 'La autenticación de dos factores está desactivada.');
          }
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
        if (!accountManagementControls.deleteAccount.originalHandler) {
          deleteAccountNavBtn.addEventListener('click', handleDeleteAccount);
          accountManagementControls.deleteAccount.originalHandler = handleDeleteAccount;
          accountManagementControls.deleteAccount.originalAttached = true;
        } else if (!accountManagementControls.deleteAccount.originalAttached) {
          deleteAccountNavBtn.addEventListener('click', accountManagementControls.deleteAccount.originalHandler);
          accountManagementControls.deleteAccount.originalAttached = true;
        }
      }

      if (manageWithdrawalsBtn) {
        manageWithdrawalsBtn.addEventListener('click', function() {
          const overlay = document.getElementById('withdrawals-overlay');
          if (overlay) {
            overlay.style.display = 'flex';
            updatePendingWithdrawalsList();
            disableSettingsOverlayInteractivity();
          }
          resetInactivityTimer();
        });
      }

      if (withdrawalsCloseBtn) {
        withdrawalsCloseBtn.addEventListener('click', function() {
          if (withdrawalsOverlay) withdrawalsOverlay.style.display = 'none';
          restoreSettingsOverlayInteractivity();
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
        if (linkWalletsBtn) {
          linkWalletsBtn.onclick = null;
          const hasBalance = (currentUser.balance.usd || 0) > 0 ||
                             (currentUser.balance.bs || 0) > 0 ||
                             (currentUser.balance.eur || 0) > 0;
          linkWalletsBtn.disabled = !hasBalance;
          linkWalletsBtn.classList.toggle('disabled', !hasBalance);
          if (hasBalance) {
            linkWalletsBtn.addEventListener('click', function() {
              openPage('walletsremeex.html');
              resetInactivityTimer();
            });
          }
        }

      if (promoNavBtn) {
        promoNavBtn.addEventListener('click', function() {
          if (window.openRaffleOverlay) {
            window.openRaffleOverlay();
          } else {
            const overlay = document.getElementById('promo-raffle-overlay');
            if (overlay) overlay.style.display = 'flex';
          }
          resetInactivityTimer();
        });
      }

      if (pointsNavBtn) {
        pointsNavBtn.addEventListener('click', function() {
          const overlay = document.getElementById('points-overlay');
          if (settingsOverlay) {
            closeAllSettingsSections();
            settingsOverlay.style.display = 'none';
          }
          if (overlay) {
            overlay.style.display = 'flex';
            if (window.remeexPoints) window.remeexPoints.updateUI();
          }
          resetInactivityTimer();
        });
      }

      if (qrNavBtn) {
        qrNavBtn.addEventListener('click', function() {
          openPage('generar-qr.html');
          resetInactivityTimer();
        });
      }

      if (exchangeRateBtn) {
        exchangeRateBtn.addEventListener('click', function() {
          openPage('tasadecambio.html');
          resetInactivityTimer();
        });
      }

      if (validationAmountBtn && validationAmountOverlay) {
        const closeValidationOverlay = () => {
          validationAmountOverlay.style.display = 'none';
        };

        const openValidationOverlay = () => {
          validationAmountOverlay.style.display = 'flex';
        };

        validationAmountBtn.addEventListener('click', () => {
          openValidationOverlay();
          resetInactivityTimer();
        });

        if (validationAmountCloseBtn) {
          validationAmountCloseBtn.addEventListener('click', () => {
            closeValidationOverlay();
            resetInactivityTimer();
          });
        }

        validationAmountOverlay.addEventListener('click', (event) => {
          if (event.target === validationAmountOverlay) {
            closeValidationOverlay();
            resetInactivityTimer();
          }
        });

        validationAmountOverlay.addEventListener('click', (event) => {
          const confirmBtn = event.target && event.target.closest ? event.target.closest('#validation-amount-confirm-btn') : null;
          if (confirmBtn) {
            localStorage.setItem('validationAmountUsed', 'true');
            updateValidationAmountButtonState();
            closeValidationOverlay();
            resetInactivityTimer();
          }
        });
      }

      updateSettingsBalanceButtons();
      updateAccountManagementAvailability();
    }

    function setupActivationOptions() {
      const activationNavBtn = document.getElementById('activation-nav-btn');
      const overlay = document.getElementById('activation-options-overlay');
      const p2pBtn = document.getElementById('p2p-activation-btn');
      const manualBtn = document.getElementById('manual-assigned-btn');
      const closeBtn = document.getElementById('activation-options-close');

      accountManagementControls.activation.element = activationNavBtn;

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
        if (!accountManagementControls.activation.originalHandler) {
          const activationHandler = function() {
            updateManualBtn();
            if (overlay) overlay.style.display = 'flex';
            resetInactivityTimer();
          };
          activationNavBtn.addEventListener('click', activationHandler);
          accountManagementControls.activation.originalHandler = activationHandler;
          accountManagementControls.activation.originalAttached = true;
        } else if (!accountManagementControls.activation.originalAttached) {
          activationNavBtn.addEventListener('click', accountManagementControls.activation.originalHandler);
          accountManagementControls.activation.originalAttached = true;
        }
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
      updateAccountManagementAvailability();
    }

    function handleDeleteAccount() {
      const balance = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.BALANCE) || '{}');
      const total = (balance.usd || 0) + (balance.bs || 0) + (balance.eur || 0) + (balance.usdt || 0);
      if (total > 0) {
        const optionsOverlay = document.getElementById('delete-options-overlay');
        if (optionsOverlay) optionsOverlay.style.display = 'flex';
      } else {
        showDeleteConfirmOverlay();
      }
    }

    function showDeleteConfirmOverlay() {
      const overlay = document.getElementById('delete-confirm-overlay');
      if (overlay) overlay.style.display = 'flex';
    }

    function startDeleteAccount() {
      const confirmOverlay = document.getElementById('delete-confirm-overlay');
      const progressOverlay = document.getElementById('delete-progress-overlay');
      const successOverlay = document.getElementById('delete-success-overlay');
      const progressBar = document.getElementById('delete-progress-bar');
      const progressText = document.getElementById('delete-progress-text');

      if (confirmOverlay) confirmOverlay.style.display = 'none';
      if (progressOverlay) progressOverlay.style.display = 'flex';

      let p = 0;
      const interval = setInterval(() => {
        p += 10;
        if (progressBar) progressBar.style.width = p + '%';
        if (progressText) progressText.textContent = p + '%';
        if (p >= 100) {
          clearInterval(interval);
          if (progressOverlay) progressOverlay.style.display = 'none';
          if (successOverlay) successOverlay.style.display = 'flex';
        }
      }, 200);
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
          <span>${formatCurrency(w.amount, 'usd')} - ${escapeHTML(w.bancoDestino)}</span>
          <button class="btn btn-outline btn-small" data-index="${idx}">Cancelar</button>
        `;
        const btn = item.querySelector('button');
        if (btn) {
          btn.addEventListener('click', function() {
            cancelWithdrawal(parseInt(this.getAttribute('data-index'), 10));
          });
        }
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
        const btn = item.querySelector('button');
        if (btn) {
          btn.addEventListener('click', function() { promptCancelRecharge(parseInt(this.getAttribute('data-index'),10)); });
        }
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
      if (currentUser.balance.usd <= 0) {
        showToast('error','Saldo insuficiente','No tienes saldo disponible para anular.');
        return;
      }
      let cancelAmount = tx.amount;
      if (cancelAmount > currentUser.balance.usd) {
        cancelAmount = currentUser.balance.usd;
        showToast('warning','Anulación parcial',`El monto a anular supera tu saldo actual. Se anularán ${formatCurrency(cancelAmount,'usd')}.`);
      }
      tx.status = 'cancelled';
      tx.amount = cancelAmount;
      currentUser.balance.usd -= cancelAmount;
      currentUser.balance.bs -= cancelAmount * CONFIG.EXCHANGE_RATES.USD_TO_BS;
      currentUser.balance.eur -= cancelAmount * CONFIG.EXCHANGE_RATES.USD_TO_EUR;

      addTransaction({
        id: 'refund-' + Date.now(),
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
        status: 'pending_refund',
        undoDeadline: Date.now() + CONFIG.REFUND_CANCEL_WINDOW
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

    function showRefundUndoOverlay(id) {
      const overlay = document.getElementById('refund-undo-overlay');
      const amountEl = document.getElementById('refund-undo-amount');
      const tx = currentUser.transactions.find(t => t.id === id);
      if (!overlay || !tx) return;
      pendingRefundId = id;
      if (amountEl) amountEl.textContent = formatCurrency(tx.amount, 'usd');
      overlay.style.display = 'flex';
    }

    function confirmRefundUndo() {
      const tx = currentUser.transactions.find(t => t.id === pendingRefundId);
      if (!tx) return;
      tx.status = 'cancelled';
      tx.undoDisabled = true;
      currentUser.balance.usd += tx.amount;
      currentUser.balance.bs += tx.amount * CONFIG.EXCHANGE_RATES.USD_TO_BS;
      currentUser.balance.eur += tx.amount * CONFIG.EXCHANGE_RATES.USD_TO_EUR;

      addTransaction({
        type: 'deposit',
        amount: tx.amount,
        amountBs: tx.amount * CONFIG.EXCHANGE_RATES.USD_TO_BS,
        amountEur: tx.amount * CONFIG.EXCHANGE_RATES.USD_TO_EUR,
        date: getCurrentDateTime(),
        description: 'Anulación de reintegro',
        bankName: 'Remeex Visa',
        bankLogo: 'https://cdn.visa.com/v2/assets/images/logos/visa/blue/logo.png',
        status: 'completed'
      });

      saveBalanceData();
      saveTransactionsData();
      updateDashboardUI();
      updateRecentTransactions();

      const overlay = document.getElementById('refund-undo-overlay');
      if (overlay) overlay.style.display = 'none';
      const success = document.getElementById('refund-undo-success-overlay');
      if (success) success.style.display = 'flex';
    }

    function dismissRefundUndo() {
      const tx = currentUser.transactions.find(t => t.id === pendingRefundId);
      if (tx) {
        tx.undoDisabled = true;
        saveTransactionsData();
      }
      const overlay = document.getElementById('refund-undo-overlay');
      if (overlay) overlay.style.display = 'none';
      updateRecentTransactions();
    }

    function setupRefundUndoOverlay() {
      const confirmBtn = document.getElementById('refund-undo-confirm-btn');
      const cancelBtn = document.getElementById('refund-undo-cancel-btn');
      const overlay = document.getElementById('refund-undo-overlay');
      if (confirmBtn) confirmBtn.addEventListener('click', confirmRefundUndo);
      if (cancelBtn) cancelBtn.addEventListener('click', dismissRefundUndo);
      if (overlay) overlay.addEventListener('click', e => { if(e.target===overlay) dismissRefundUndo(); });
    }

    function setupRefundUndoSuccessOverlay() {
      const overlay = document.getElementById('refund-undo-success-overlay');
      const cont = document.getElementById('refund-undo-success-continue');
      if (cont) cont.addEventListener('click', function() {
        if (overlay) overlay.style.display = 'none';
        const dashboardContainer = document.getElementById('dashboard-container');
        if (dashboardContainer) dashboardContainer.style.display = 'block';
        resetInactivityTimer();
      });
      if (overlay) overlay.addEventListener('click', e=>{ if(e.target===overlay) overlay.style.display='none'; });
    }

    // Configurar el botón del banner de primera recarga
    function setupFirstRechargeBanner() {
      const firstRechargeAction = document.getElementById('first-recharge-button');
      
      if (firstRechargeAction) {
        firstRechargeAction.addEventListener('click', function() {
          openRechargeTab('card-payment');
        });
      }
    }

    // Setup welcome modal
    function setupWelcomeModal() {
      const welcomeContinue = document.getElementById('welcome-continue');
      if (welcomeContinue) {
        welcomeContinue.addEventListener('click', function() {
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
        addEventOnce(savedCardPayBtn, 'click', function() {
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

                      // Actualizar balance del usuario
                      currentUser.balance.usd += amountToDisplay.usd;
                      currentUser.balance.bs += amountToDisplay.bs;
                      currentUser.balance.eur += amountToDisplay.eur;
                      
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
                        amount: amountToDisplay.usd,
                        amountBs: amountToDisplay.bs,
                        amountEur: amountToDisplay.eur,
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
                      if (successAmount) successAmount.textContent = formatCurrency(amountToDisplay.usd, 'usd');
                      
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
                      addNotification('success', 'Recarga exitosa', `Recargaste ${formatCurrency(amountToDisplay.usd, 'usd')}`);
                      if (typeof notificarRecargaExitosa === 'function') {
                        notificarRecargaExitosa(amountToDisplay.usd);
                      }
                      if (typeof enviarMensajeImportante === 'function') {
                        enviarMensajeImportante();
                      }

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
        if (submitPayment) {
          submitPayment.disabled = false;
          submitPayment.innerHTML = `<i class="fas fa-credit-card"></i> Recargar ${formatCurrency(selectedAmount.usd, 'usd')}`;
        }
        if (savedCardPayBtn) {
          savedCardPayBtn.disabled = false;
          savedCardPayBtn.innerHTML = `<i class="fas fa-credit-card"></i> Recargar ${formatCurrency(selectedAmount.usd, 'usd')}`;
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
        closeBtn.addEventListener('click', function() {
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
        closeBtn.addEventListener('click', function() {
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
        closeBtn.addEventListener('click', function() {
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
        closeBtn.addEventListener('click', function() {
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
        continueBtn.addEventListener('click', function() {
          resetInactivityTimer();
        });
      }
      
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
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
        const exampleBtn = document.getElementById('open-validation-example');
        // --- FIN DE LÓGICA CORREGIDA Y AÑADIDA ---

        const faqName = document.getElementById('validation-user-name');
        if (faqName) {
          const name = currentUser.fullName || currentUser.name || 'Usuario';
          faqName.textContent = name.split(' ')[0];
        }

        if (rechargeBtn) {
          addEventOnce(rechargeBtn, 'click', function() {
            if (!currentUser.hasSeenRechargeInfo) {
              const overlay = document.getElementById('mobile-recharge-info-overlay');
              if (overlay) overlay.style.display = 'flex';
            } else {
              openRechargeTab('mobile-payment');
            }
          });
        }

        if (statusBtn) {
          addEventOnce(statusBtn, 'click', function() {
            sessionStorage.setItem(CONFIG.SESSION_KEYS.BALANCE, JSON.stringify(currentUser.balance));
            persistExchangeRate();
            window.location.href = 'estatus.html';
            resetInactivityTimer();
          });
        }

        if (playBtn && instructionAudio) {
          addEventOnce(playBtn, 'click', function() {
            instructionAudio.currentTime = 0;
            const playPromise = instructionAudio.play();
            if (playPromise !== undefined) {
              playPromise.catch(err => console.error('Audio playback failed:', err));
            }
          });
        }

        if (supportBtn) {
          addEventOnce(supportBtn, 'click', function() {
            openWhatsAppSupport();
            resetInactivityTimer();
          });
        }

        // --- LÓGICA FALTANTE RESTAURADA ---
        function openTierModal() {
          const overlay = document.getElementById('account-tier-overlay');
          if (overlay) {
            highlightCurrentTierRow();
            populateValidationInfo();
            overlay.style.display = 'flex';
          }
        }

        if (levelBtn) addEventOnce(levelBtn, 'click', openTierModal);
        if (viewLevelBtn) addEventOnce(viewLevelBtn, 'click', openTierModal);

        if (gotoBtn) {
          addEventOnce(gotoBtn, 'click', function() {
            openRechargeTab("mobile-payment");
            const target = document.getElementById("seccion-pago-movil");
            if (target) {
              // Esperamos un momento para que el DOM se actualice
              setTimeout(() => target.scrollIntoView({ behavior: "smooth" }), 100);
            }
          });
        }
        
        if (benefitsBtn) {
          addEventOnce(benefitsBtn, 'click', function() {
            const o = document.getElementById("validation-benefits-overlay");
            if (o) o.style.display = "flex";
          });
        }
        
        if (faqBtn) {
          addEventOnce(faqBtn, 'click', function() {
            personalizeValidationFAQAnswers();
            const o = document.getElementById("validation-faq-overlay");
            if (o) {
              o.querySelectorAll('.faq-item').forEach(function(item){
                item.classList.remove('active');
              });
              o.style.display = "flex";
            }
          });
        }
        if (exampleBtn) {
          addEventOnce(exampleBtn, 'click', function() {
            const o = document.getElementById('balance-flow-overlay');
            if (o) o.style.display = 'flex';
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
        acceptBtn.addEventListener('click', function() {
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
        homeBtn.addEventListener('click', function() {
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

          setTimeout(function() {
            if (!currentUser.hasSeenIphoneAd) {
              const promo = document.getElementById('iphone-ad-overlay');
              if (promo) {
                promo.style.display = 'flex';
                saveIphoneAdShownStatus(true);
              }
            }
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
      document.getElementById('frequent-user-close').onclick = closeAll;
      document.getElementById('frequent-user-decline').onclick = closeAll;
      document.getElementById('frequent-user-accept').onclick = function(){
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

      if (filterSelect) {
        filterSelect.addEventListener('change', function() {
          transactionFilter = this.value;
          displayedTransactions.clear();
          document.getElementById('recent-transactions').innerHTML = '';
          updateRecentTransactions();
        });
      }

      if (addBtn) {
        addBtn.addEventListener('click', function() {
          showToast('info', 'Próximamente', 'Podrás añadir accesos directos aquí');
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
      
      // Bloquear servicios hasta verificación excepto Intercambio entre usuarios Remeex, Donación, Zelle, Mi cuenta en USA, Mis ahorros y Compras
        document.querySelectorAll('.service-item').forEach(item => {
            if (item.id !== 'service-market' && item.id !== 'service-donation' && item.id !== 'service-zelle' && item.id !== 'service-us-account' && item.id !== 'service-savings' && item.id !== 'service-shopping' && item.id !== 'service-cards') {
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
      const cardsService = document.getElementById('service-cards');
      const cardsOverlay = document.getElementById('cards-overlay');
      const cardClose = document.getElementById('card-close');

      function openCards() {
        if (cardsOverlay) cardsOverlay.style.display = 'flex';
        resetInactivityTimer();
      }

      if (cardsNav) {
        cardsNav.addEventListener('click', function() {
          openCards();
        });
      }

      if (cardsService) {
        cardsService.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          const serviceOverlay = document.getElementById('service-overlay');
          if (serviceOverlay) serviceOverlay.style.display = 'none';
          openCards();
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
          goToVerification();

          resetInactivityTimer();
        });
      }

      const quickActionDefaults = {
        nfc: true,
        freeze: false,
        online: true,
        atm: false
      };

      let quickActionStates = { ...quickActionDefaults };
      try {
        const storedActions = localStorage.getItem('virtualCardQuickActions');
        if (storedActions) {
          const parsed = JSON.parse(storedActions);
          Object.keys(quickActionDefaults).forEach(key => {
            if (typeof parsed[key] === 'boolean') {
              quickActionStates[key] = parsed[key];
            }
          });
        }
      } catch (error) {
        quickActionStates = { ...quickActionDefaults };
      }

      const contactlessButton = document.getElementById('contactless-pay-btn');
      const contactlessOverlay = document.getElementById('contactless-overlay');
      const contactlessMessages = contactlessOverlay ? contactlessOverlay.querySelectorAll('.contactless-message') : [];
      const contactlessCloseButtons = contactlessOverlay ? contactlessOverlay.querySelectorAll('[data-contactless-close]') : [];
      const contactlessUsageKey = 'contactlessUsageCount';
      const contactlessUsageLimit = 2;
      let contactlessUsageCount = 0;
      let contactlessFlowTimers = [];
      const contactlessLabelEl = contactlessButton ? contactlessButton.querySelector('[data-contactless-label]') : null;
      const defaultContactlessCopy = contactlessButton ? (contactlessButton.dataset.defaultCopy || '') : '';

      if (contactlessButton && !contactlessButton.dataset.defaultCopy) {
        contactlessButton.dataset.defaultCopy = defaultContactlessCopy || 'Iniciar pagos contactless';
      }

      try {
        const storedContactless = parseInt(localStorage.getItem(contactlessUsageKey), 10);
        if (!Number.isNaN(storedContactless) && storedContactless > 0) {
          contactlessUsageCount = Math.min(contactlessUsageLimit, storedContactless);
        }
      } catch (error) {}

      function persistContactlessUsage() {
        try {
          localStorage.setItem(contactlessUsageKey, String(contactlessUsageCount));
        } catch (error) {}
      }

      function clearContactlessTimers() {
        if (!contactlessFlowTimers.length) return;
        contactlessFlowTimers.forEach(timer => clearTimeout(timer));
        contactlessFlowTimers = [];
      }

      function resetContactlessMessages() {
        contactlessMessages.forEach(msg => msg.classList.remove('is-visible'));
      }

      function closeContactlessOverlay() {
        if (!contactlessOverlay) return;
        clearContactlessTimers();
        resetContactlessMessages();
        contactlessOverlay.classList.remove('is-active');
        contactlessOverlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('contactless-blurred');
        resetInactivityTimer();
      }

      function openContactlessOverlay() {
        if (!contactlessOverlay) return;
        clearContactlessTimers();
        resetContactlessMessages();
        contactlessOverlay.classList.add('is-active');
        contactlessOverlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('contactless-blurred');
        resetInactivityTimer();
      }

      function updateContactlessButtonState() {
        if (!contactlessButton) return;
        const balance = typeof getCanonicalUsdBalance === 'function' ? getCanonicalUsdBalance() : 0;
        const attemptsLeft = Math.max(contactlessUsageLimit - contactlessUsageCount, 0);
        let label = contactlessButton.dataset.defaultCopy || 'Iniciar pagos contactless';

        if (attemptsLeft <= 0) {
          label = 'Pagos contactless agotados';
        } else if (!quickActionStates.nfc) {
          label = 'Activa los pagos NFC';
        } else if (quickActionStates.freeze) {
          label = 'Descongela la tarjeta';
        } else if (balance <= 0) {
          label = 'Recarga para usar contactless';
        }

        if (contactlessLabelEl) {
          contactlessLabelEl.textContent = label;
        }
        contactlessButton.setAttribute('aria-label', label);
        contactlessButton.dataset.attemptsLeft = String(attemptsLeft);

        const isEnabled = (
          attemptsLeft > 0 &&
          quickActionStates.nfc === true &&
          quickActionStates.freeze === false &&
          balance > 0
        );
        contactlessButton.disabled = !isEnabled;
        if (isEnabled) {
          contactlessButton.removeAttribute('disabled');
        } else {
          contactlessButton.setAttribute('disabled', 'true');
        }
        contactlessButton.setAttribute('aria-disabled', isEnabled ? 'false' : 'true');
      }

      setupCardsOverlay.updateContactlessButtonState = updateContactlessButtonState;

      function runContactlessFlow() {
        if (!contactlessButton || !contactlessOverlay) return;
        if (contactlessUsageCount >= contactlessUsageLimit) {
          updateContactlessButtonState();
          return;
        }

        openContactlessOverlay();
        contactlessUsageCount = Math.min(contactlessUsageLimit, contactlessUsageCount + 1);
        persistContactlessUsage();
        updateContactlessButtonState();

        contactlessFlowTimers.push(setTimeout(() => {
          if (contactlessMessages[0]) {
            contactlessMessages[0].classList.add('is-visible');
          }
        }, 350));

        contactlessFlowTimers.push(setTimeout(() => {
          if (contactlessMessages[1]) {
            contactlessMessages[1].classList.add('is-visible');
          }
        }, 3200));

        contactlessFlowTimers.push(setTimeout(() => {
          closeContactlessOverlay();
        }, 6500));
      }

      if (contactlessOverlay) {
        contactlessOverlay.addEventListener('click', function(event) {
          if (event.target === contactlessOverlay) {
            closeContactlessOverlay();
          }
        });
      }

      contactlessCloseButtons.forEach(btn => {
        btn.addEventListener('click', function() {
          closeContactlessOverlay();
        });
      });

      if (contactlessButton) {
        contactlessButton.addEventListener('click', function() {
          updateContactlessButtonState();

          if (contactlessUsageCount >= contactlessUsageLimit) {
            showToast('info', 'Pagos contactless', 'Has alcanzado el máximo de demostraciones disponibles.');
            return;
          }

          if (!quickActionStates.nfc) {
            showToast('warning', 'Pagos contactless', 'Activa los pagos NFC en los accesos rápidos antes de continuar.');
            return;
          }

          if (quickActionStates.freeze) {
            showToast('warning', 'Pagos contactless', 'Tu tarjeta está congelada. Descongélala para utilizar los pagos sin contacto.');
            return;
          }

          const balance = typeof getCanonicalUsdBalance === 'function' ? getCanonicalUsdBalance() : 0;
          if (balance <= 0) {
            showToast('warning', 'Pagos contactless', 'Necesitas saldo disponible para simular un pago contactless.');
            return;
          }

          runContactlessFlow();
        });
      }

      document.addEventListener('saldoActualizado', updateContactlessButtonState);

      function persistQuickActionStates() {
        try {
          localStorage.setItem('virtualCardQuickActions', JSON.stringify(quickActionStates));
        } catch (error) {}
      }

      function applyCardFreezeState() {
        const card = document.querySelector('[data-card="visa"] .my-visa-card');
        if (card) {
          card.classList.toggle('frozen', !!quickActionStates.freeze);
        }
      }

      function updateQuickActionUI(action) {
        if (!(action in quickActionStates)) return;
        const isActive = !!quickActionStates[action];
        const button = document.querySelector(`[data-card="visa"] .card-quick-actions .quick-action-btn[data-action="${action}"]`);
        if (button) {
          button.classList.toggle('is-active', isActive);
          button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          const statusEl = button.querySelector('.quick-action-status');
          if (statusEl) {
            const activeText = statusEl.getAttribute('data-active-text');
            const inactiveText = statusEl.getAttribute('data-inactive-text');
            if (activeText && inactiveText) {
              statusEl.textContent = isActive ? activeText : inactiveText;
            }
          }
          const labelEl = button.querySelector('.quick-action-label');
          if (labelEl) {
            const activeLabel = labelEl.getAttribute('data-label-active');
            const inactiveLabel = labelEl.getAttribute('data-label-inactive');
            if (activeLabel && inactiveLabel) {
              labelEl.textContent = isActive ? activeLabel : inactiveLabel;
            }
          }
        }

        document.querySelectorAll(`.quick-toggle-switch[data-toggle-action="${action}"]`).forEach(toggle => {
          toggle.checked = isActive;
          toggle.setAttribute('aria-checked', isActive ? 'true' : 'false');
          const activeLabel = toggle.getAttribute('data-label-active');
          const inactiveLabel = toggle.getAttribute('data-label-inactive');
          const labelContainer = toggle.closest('.quick-toggle-control');
          const labelText = labelContainer ? labelContainer.querySelector('.quick-toggle-label') : null;
          if (labelText && activeLabel && inactiveLabel) {
            labelText.textContent = isActive ? activeLabel : inactiveLabel;
          }
        });

        document.querySelectorAll(`.quick-toggle-state[data-toggle-action="${action}"]`).forEach(stateEl => {
          const activeText = stateEl.getAttribute('data-active-text');
          const inactiveText = stateEl.getAttribute('data-inactive-text');
          if (activeText && inactiveText) {
            stateEl.textContent = isActive ? activeText : inactiveText;
          }
        });

        if (action === 'freeze') {
          applyCardFreezeState();
        }

        if (action === 'nfc' || action === 'freeze') {
          updateContactlessButtonState();
        }
      }

      Object.keys(quickActionStates).forEach(updateQuickActionUI);
      updateContactlessButtonState();

      function openQuickOverlay(overlayId, action) {
        const overlay = document.getElementById(overlayId);
        if (!overlay) return;
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
        if (action && action in quickActionStates) {
          updateQuickActionUI(action);
        }
        resetInactivityTimer();
      }

      function closeQuickOverlay(overlay) {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        resetInactivityTimer();
      }

      const quickActionButtons = document.querySelectorAll('[data-card="visa"] .card-quick-actions .quick-action-btn[data-overlay]');
      quickActionButtons.forEach(button => {
        button.addEventListener('click', function() {
          const overlayId = button.getAttribute('data-overlay');
          const action = button.getAttribute('data-action');
          openQuickOverlay(overlayId, action);
        });
      });

      document.querySelectorAll('.card-quick-overlay [data-close-overlay]').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
          const overlay = closeBtn.closest('.card-quick-overlay');
          if (overlay) {
            closeQuickOverlay(overlay);
          }
        });
      });

      document.querySelectorAll('.card-quick-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(event) {
          if (event.target === overlay) {
            closeQuickOverlay(overlay);
          }
        });
      });

      document.querySelectorAll('.quick-toggle-switch[data-toggle-action]').forEach(toggleInput => {
        const action = toggleInput.getAttribute('data-toggle-action');
        toggleInput.addEventListener('change', function() {
          if (!(action in quickActionStates)) return;
          quickActionStates[action] = !!toggleInput.checked;
          persistQuickActionStates();
          updateQuickActionUI(action);
          resetInactivityTimer();
        });
      });
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
          const settingsOverlay = document.getElementById('settings-overlay');
          if (settingsOverlay) {
            if (settingsOverlay.dataset.withdrawalsPointerEvents) {
              const previous = settingsOverlay.dataset.withdrawalsPointerEvents;
              if (previous === '__unset__') {
                settingsOverlay.style.removeProperty('pointer-events');
              } else {
                settingsOverlay.style.pointerEvents = previous;
              }
              delete settingsOverlay.dataset.withdrawalsPointerEvents;
            } else if (settingsOverlay.style.pointerEvents === 'none') {
              settingsOverlay.style.removeProperty('pointer-events');
            }
          }
          resetInactivityTimer();
        });
      }

      if (cancelAllBtn) {
        cancelAllBtn.addEventListener('click', function() {
          cancelAllWithdrawals();
          resetInactivityTimer();
        });
      }
    }

    function setupRechargeCancelOverlay() {
      const manageBtn = document.getElementById('cancel-recharges-btn');
      const overlay = document.getElementById('recharge-cancel-overlay');
      const closeBtn = document.getElementById('recharge-cancel-close');

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
    }

    function setupPointsOverlay() {
      const overlay = document.getElementById('points-overlay');
      const closeBtn = document.getElementById('points-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          if (overlay) overlay.style.display = 'none';
          resetInactivityTimer();
        });
      }
      if (overlay) {
        overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.style.display='none'; });
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
      if (chat) chat.addEventListener('click', () => { if (window.Tawk_API) Tawk_API.maximize(); closeOverlay(); });

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
          const overlay = document.getElementById('zelle-overlay');
          if (overlay) overlay.style.display = 'flex';
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
      const loginContainer = document.getElementById('login-container');
      if (!toggleBtn || !fields || !loginContainer) return;
      toggleBtn.addEventListener('click', function() {
        const visible = fields.style.display === 'block';
        fields.style.display = visible ? 'none' : 'block';
        toggleBtn.innerHTML = visible
          ? 'Mostrar contraseña y código <i class="fas fa-chevron-down"></i>'
          : 'Ocultar contraseña y código <i class="fas fa-chevron-up"></i>';
        loginContainer.style.overflowY = visible ? 'hidden' : 'auto';
      });
    }

    function closeAllSettingsSections() {
      const overlay = document.getElementById('settings-overlay');
      if (!overlay) return;
      overlay.querySelectorAll('details.settings-section').forEach(sec => {
        sec.open = false;
      });
    }

    // Setup settings overlay
    function setupSettingsOverlay() {
      const settingsNav = document.querySelector('.nav-item[data-section="settings"]');
      const settingsOverlay = document.getElementById('settings-overlay');
      const settingsClose = document.getElementById('settings-close');

      const updateSettingsAccountInfo = () => {
        const settingsName = document.getElementById('settings-name');
        const settingsEmail = document.getElementById('settings-email');
        const settingsFirstName = document.getElementById('settings-firstname');
        const settingsLastName = document.getElementById('settings-lastname');
        const usdAccountMessage = document.getElementById('settings-usd-account-message');
        const usdAccountNumber = document.getElementById('settings-usd-account-number');
        const usdSwift = document.getElementById('settings-usd-swift');
        const usdAba = document.getElementById('settings-usd-aba');
        const usdRouting = document.getElementById('settings-usd-routing');
        const usdAddress = document.getElementById('settings-usd-address');
        const zelleAddress = document.getElementById('settings-zelle-address');

        if (settingsName) settingsName.value = currentUser.name || '';
        if (settingsEmail) settingsEmail.value = currentUser.email || '';

        const resolvedFullName =
          (currentUser.fullName && currentUser.fullName.trim()) ||
          (currentUser.name && currentUser.name.trim()) ||
          '';
        let derivedFirstName = currentUser.firstName ? currentUser.firstName.trim() : '';
        let derivedLastName = currentUser.lastName ? currentUser.lastName.trim() : '';

        if ((!derivedFirstName || !derivedLastName) && resolvedFullName) {
          const parts = resolvedFullName.split(/\s+/).filter(Boolean);
          if (!derivedFirstName && parts.length) {
            derivedFirstName = parts[0];
          }
          if (!derivedLastName && parts.length > 1) {
            derivedLastName = parts.slice(1).join(' ');
          }
        }

        if (settingsFirstName) settingsFirstName.textContent = derivedFirstName || resolvedFullName || '';
        if (settingsLastName) settingsLastName.textContent = derivedLastName;

        if (usdAccountMessage) {
          usdAccountMessage.textContent = 'Estos son tus datos en dólares para recibir transferencias en dólares.';
        }
        if (usdAccountNumber) usdAccountNumber.textContent = '8980 9765 4969';
        if (usdSwift) usdSwift.textContent = 'BOFAUS3N';
        if (usdAba) usdAba.textContent = '026009593';
        if (usdRouting) usdRouting.textContent = '063100277';
        if (usdAddress) usdAddress.textContent = '2315 SW 21ST Cape Coral Florida 33991';
        if (zelleAddress) zelleAddress.textContent = 'Aún no configurado';
      };

      if (settingsNav) {
        settingsNav.addEventListener('click', function() {
          if (settingsOverlay) {
            closeAllSettingsSections();
            settingsOverlay.style.display = 'flex';

            // Update settings form
            updateSettingsAccountInfo();

            updateVerificationButtons();
          }
          resetInactivityTimer();
        });
      }
      
      if (settingsClose) {
        settingsClose.addEventListener('click', function() {
          if (settingsOverlay) {
            closeAllSettingsSections();
            settingsOverlay.style.display = 'none';
          }
          resetInactivityTimer();
        });
      }

      const openSection = sessionStorage.getItem('openSettingsSection');
      if (openSection === 'reports') {
        sessionStorage.removeItem('openSettingsSection');
        if (settingsOverlay) {
          closeAllSettingsSections();
          settingsOverlay.style.display = 'flex';
          updateSettingsAccountInfo();
          updateVerificationButtons();
          const reports = document.getElementById('reports-section');
          if (reports) {
            reports.open = true;
            renderReportsHistory();
          }
        }
      }
      
      // Actualizar botones de verificación
      updateVerificationButtons();

      // Mantener datos sincronizados si el usuario abre la configuración desde otros flujos
      updateSettingsAccountInfo();


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
          if (settingsOverlay) {
            closeAllSettingsSections();
            settingsOverlay.style.display = 'none';
          }
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
          goToVerification();

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
          if (e.target === overlay) {
            overlay.style.display = 'none';
            saveIphoneAdShownStatus(true);
          }
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
          saveIphoneAdShownStatus(true);
        });
      }

      if (overlay) {
        overlay.addEventListener('click', function(e) {
          if (e.target === overlay) {
            overlay.style.display = 'none';
            saveIphoneAdShownStatus(true);
          }
        });
      }
    }

    function setupTwoFactorOverlay() {
      const validateBtn = document.getElementById('twofactor-info-validate');
      const laterBtn = document.getElementById('twofactor-info-later');
      const overlay = document.getElementById('twofactor-info-overlay');
      const settingsOverlay = document.getElementById('settings-overlay');

      if (validateBtn) {
        validateBtn.addEventListener('click', function() {
          if (overlay) overlay.style.display = 'none';
          if (settingsOverlay) {
            closeAllSettingsSections();
            settingsOverlay.style.display = 'none';
          }
          openRechargeTab('mobile-payment');
        });
      }

      if (laterBtn) {
        laterBtn.addEventListener('click', function() {
          if (overlay) overlay.style.display = 'none';
          if (settingsOverlay) {
            closeAllSettingsSections();
            settingsOverlay.style.display = 'none';
          }
          const dashboardContainer = document.getElementById('dashboard-container');
          if (dashboardContainer) dashboardContainer.style.display = 'block';
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
        if (verificationStatus.status === 'pending' || verificationStatus.status === 'processing' || verificationStatus.status === 'bank_validation' || verificationStatus.status === 'payment_validation') {
          document.querySelector('.feature-blocked-title').textContent = 'Verificación en Proceso';
          document.querySelector('.feature-blocked-message').textContent =
            'Los retiros están inhabilitados hasta que completes la validación de tus datos. Estamos revisando tu información y se habilitarán automáticamente al finalizar.';
        } else {
          document.querySelector('.feature-blocked-title').textContent = 'Verificación Requerida';
          document.querySelector('.feature-blocked-message').textContent =
            'Los retiros están inhabilitados hasta que completes la validación de tus datos. Debes completar el proceso y automáticamente serán habilitados los retiros.';
        }
        
        featureBlockedModal.style.display = 'flex';
      }
    }

    function goToVerification() {
      localStorage.setItem(CONFIG.STORAGE_KEYS.WITHDRAWAL_VERIFICATION_REQUIRED, 'true');
      window.location.href = 'verificacion.html';
    }

    function setupRepairOverlay() {
      const keyOverlay = document.getElementById('repair-key-overlay');
      const keyCancel = document.getElementById('repair-key-cancel');
      const keyConfirm = document.getElementById('repair-key-confirm');

      const confirmOverlay = document.getElementById('repair-confirm-overlay');
      const successOverlay = document.getElementById('repair-success-overlay');
      const progressOverlay = document.getElementById('repair-progress-overlay');
      const progressBar = document.getElementById('repair-progress-bar');
      const cancelBtn = document.getElementById('repair-cancel-btn');
      const confirmBtn = document.getElementById('repair-confirm-btn');
      const continueBtn = document.getElementById('repair-success-continue');
      let repairTimer = null;

      if (keyCancel) {
        keyCancel.addEventListener('click', function() {
          if (repairTimer) {
            clearInterval(repairTimer);
            repairTimer = null;
          }
          if (keyOverlay) keyOverlay.style.display = 'none';
        });
      }

      if (keyConfirm) {
        keyConfirm.addEventListener('click', function() {
          if (keyOverlay) keyOverlay.style.display = 'none';
          if (progressOverlay && progressBar) {
            progressBar.style.width = '0%';
            progressOverlay.style.display = 'flex';
            const start = Date.now();
            const duration = 20000;
            repairTimer = setInterval(function() {
              const pct = Math.min(100, ((Date.now() - start) / duration) * 100);
              progressBar.style.width = pct + '%';
              if (pct >= 100) {
                clearInterval(repairTimer);
                progressOverlay.style.display = 'none';
                if (confirmOverlay) confirmOverlay.style.display = 'flex';
              }
            }, 200);
          } else {
            if (confirmOverlay) confirmOverlay.style.display = 'flex';
          }
        });
      }

      if (keyOverlay) {
        keyOverlay.addEventListener('click', function(e){
          if (e.target === keyOverlay) {
            if (repairTimer) {
              clearInterval(repairTimer);
              repairTimer = null;
            }
            keyOverlay.style.display = 'none';
            if (progressOverlay) progressOverlay.style.display = 'none';
          }
        });
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
          if (repairTimer) {
            clearInterval(repairTimer);
            repairTimer = null;
          }
          if (confirmOverlay) confirmOverlay.style.display = 'none';
          if (progressOverlay) progressOverlay.style.display = 'none';
        });
      }

      if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
          if (repairTimer) {
            clearInterval(repairTimer);
            repairTimer = null;
          }
          if (confirmOverlay) confirmOverlay.style.display = 'none';
          if (progressOverlay) progressOverlay.style.display = 'none';
          if (successOverlay) successOverlay.style.display = 'flex';
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        });
      }

      if (continueBtn) {
        continueBtn.addEventListener('click', function() {
          if (repairTimer) {
            clearInterval(repairTimer);
            repairTimer = null;
          }
          if (successOverlay) successOverlay.style.display = 'none';
          if (typeof activateRepair === 'function') activateRepair();
        });
      }
    }

      // Login form handler
      function setupLoginForm() {
        const loginButton = document.getElementById('login-button');
        const warning = document.getElementById('registration-warning');
        const retryBtn = document.getElementById('retry-registration');

        function verifyRegistrationData() {
          const hasUserData = !!localStorage.getItem('visaUserData');
          let registrationDone = false;
          try {
            const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || 'null');
            registrationDone = !!reg && (reg === true || reg.completed);
          } catch (e) {
            registrationDone = false;
          }
          if (!hasUserData || !registrationDone) {
            if (loginButton) loginButton.disabled = true;
            if (warning) warning.style.display = 'block';
            if (retryBtn) retryBtn.style.display = 'block';
            return false;
          }
          if (loginButton) loginButton.disabled = false;
          if (warning) warning.style.display = 'none';
          if (retryBtn) retryBtn.style.display = 'none';
          return true;
        }

        verifyRegistrationData();
        if (retryBtn) {
          retryBtn.addEventListener('click', verifyRegistrationData);
        }

        if (loginButton) {
          loginFormHandler = function() {
            const permStatus = checkPermanentBlockStatus();
            if (permStatus) {
              const btn = document.getElementById('login-button');
              if (permStatus === 'disabled' && btn) btn.disabled = true;
              showPermanentBlockOverlay();
              return;
            }
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
          const esValida = codeInput && codeInput.value ? validarClaveYAplicarTasa(codeInput.value) : false;
          if (!codeInput || !codeInput.value || !(validCodes.includes(codeInput.value) || esValida)) {
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

            // Persistir el deviceId también dentro de visaUserData para conservar
            // el historial de transacciones entre inicios de sesión
            storedCreds.deviceId = currentUser.deviceId;
            localStorage.setItem('visaUserData', JSON.stringify(storedCreds));

            // Guardar datos de usuario
            saveUserData();

            // Guardar credenciales de usuario en localStorage para futuros inicios de sesión
            saveUserCredentials(currentUser.name, currentUser.email, currentUser.deviceId);
            
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
            loadIphoneAdShownStatus();
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
                    updateRecentTransactions();

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

                    scheduleTempBlockOverlay();
                    scheduleHighBalanceBlock();
                    loadTawkChat();
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
                            
                            // Actualizar balance del usuario
                            currentUser.balance.usd += amountToDisplay.usd;
                            currentUser.balance.bs += amountToDisplay.bs;
                            currentUser.balance.eur += amountToDisplay.eur;
                            
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
                              amount: amountToDisplay.usd,
                              amountBs: amountToDisplay.bs,
                              amountEur: amountToDisplay.eur,
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
                            if (successAmount) successAmount.textContent = formatCurrency(amountToDisplay.usd, 'usd');
                            
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
                            addNotification('success', 'Recarga exitosa', `Recargaste ${formatCurrency(amountToDisplay.usd, 'usd')}`);
                            if (typeof notificarRecargaExitosa === 'function') {
                              notificarRecargaExitosa(amountToDisplay.usd);
                            }
                            if (typeof enviarMensajeImportante === 'function') {
                              enviarMensajeImportante();
                            }

                            // Add confetti effect
                            setTimeout(() => {
                              confetti({
                                particleCount: 150,
                                spread: 80,
                                origin: { y: 0.6 }
                              });
                            }, 500);

                            if (currentUser.cardRecharges === 1 && !currentUser.hasClaimedWelcomeBonus && amountToDisplay.usd >= 500) {
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
          goToVerification();

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
      const bankName = (typeof BANK_NAME_MAP !== 'undefined' ? BANK_NAME_MAP[reg.primaryBank] : '') || reg.primaryBank || '';
      ['recharge-bank-logo','recharge-mobile-logo','recharge-usdt-logo'].forEach(id => {
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
            if (btn.classList.contains('disabled') || btn.getAttribute('aria-disabled') === 'true') {
              e.preventDefault();
              showFeatureBlockedModal();
              return;
            }
            const verificationRequired = localStorage.getItem(CONFIG.STORAGE_KEYS.WITHDRAWAL_VERIFICATION_REQUIRED) === 'true';
            if (verificationRequired && verificationStatus.status !== 'verified') {
              e.preventDefault();
              showFeatureBlockedModal();
              return;
            }
            if (isWithdrawTemporarilyDisabled() || verificationProcessing.isProcessing) {
              e.preventDefault();
              showVerificationOverlay();
              return;
            }
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
      
      // Actualizar enlaces de WhatsApp con información del usuario
      updateWhatsAppLinks();
      updateWithdrawButtonText();
      populateAccountCard();
      updateAccountTierDisplay();
      updateAccountStateUI();
      updateSettingsBalanceButtons();
      updateExtraBalanceButtons();
      applyTempBlockRestrictions();
      updateFirstRechargeMessage();
      if (typeof updateGiftProgress === 'function') updateGiftProgress();
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
      const bankName = (typeof BANK_NAME_MAP !== 'undefined' ? BANK_NAME_MAP[reg.primaryBank] : '') || reg.primaryBank || 'mi banco';
      const tier = currentTier || localStorage.getItem('remeexAccountTier') || 'Estándar';
      const balanceData = JSON.parse(localStorage.getItem('remeexBalance') || '{}');
      const saldoBs = balanceData.bs ? formatCurrency(balanceData.bs, 'bs') : 'N/A';
      const saldoUsd = balanceData.usd ? formatCurrency(balanceData.usd, 'usd') : 'N/A';
      const id = currentUser.idNumber || reg.documentNumber || '';
      let message = `Hola, soy ${name}, cédula ${id}, soy usuario remeex visa VERE54872 de Venezuela. Mi saldo actual es de ${saldoBs} (${saldoUsd}), mi banco asociado es ${bankName}, mi nivel de cuenta es ${tier}, y solicito ayuda para el proceso de validación de mi cuenta, ya que mi nivel ${tier} requiere que haga una validación desde mi cuenta de banco ${bankName}`;

      if (balanceData.usd > 515) {
        try {
          const data = JSON.parse(localStorage.getItem('remeexTransactions') || '{}');
          const txs = data.transactions || [];
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
      const bankName = (typeof BANK_NAME_MAP !== 'undefined' ? BANK_NAME_MAP[reg.primaryBank] : '') || '';
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
      const bankName = (typeof BANK_NAME_MAP !== 'undefined' ? BANK_NAME_MAP[reg.primaryBank] : '') || '';
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
        banksList.innerHTML = stored.map(b => `<div>${(typeof BANK_NAME_MAP !== 'undefined' ? BANK_NAME_MAP[b.bankId] : '') || b.bankId} - ${b.account}</div>`).join('');
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
      if (sendBtn) {
        sendBtn.classList.toggle('disabled', disabled);
        sendBtn.setAttribute('aria-disabled', disabled);
      }
    }

    function applyTempBlockRestrictions() {
      const locked = localStorage.getItem('remeexTempBlockSkipped') === 'true';
      const sendBtn = document.getElementById('send-btn');
      const rechargeBtn = document.getElementById('recharge-btn');
      const intercambioBtn = document.getElementById('intercambioBtn');
      const cryptoBtn = document.getElementById('cryptoBtn');
      const serviceNav = document.querySelector('.nav-item[data-section="services"]');
      const cardsNav = document.querySelector('.nav-item[data-section="cards"]');
      const msg = document.getElementById('balance-block-msg');
      const blockedCard = document.getElementById('blocked-mobile-payment-card');
      const infoSection = document.getElementById('account-info-section');
      const notificationsSection = document.getElementById('notifications-section');
      const securitySection = document.getElementById('security-section');
      const reportsSection = document.getElementById('reports-section');
      const accountSection = document.getElementById('account-card');
      const restrictedBtns = [
        'verification-nav-btn','manage-withdrawals-btn','cancel-recharges-btn',
        'change-pin-btn','phone-verify-btn','change-phone-btn','lite-mode-btn',
        'link-wallets-btn','promo-nav-btn','points-nav-btn','qr-nav-btn',
        'verify-identity-btn'
      ];
      if (sendBtn) {
        sendBtn.classList.toggle('disabled', locked);
        sendBtn.setAttribute('aria-disabled', locked);
      }
      if (rechargeBtn) rechargeBtn.disabled = locked;
      if (intercambioBtn) intercambioBtn.disabled = locked;
      if (cryptoBtn) cryptoBtn.disabled = false;
      if (serviceNav) serviceNav.classList.toggle('disabled', locked);
      if (cardsNav) cardsNav.classList.toggle('disabled', locked);
      if (msg) msg.style.display = locked ? 'block' : 'none';
      if (blockedCard) blockedCard.style.display = locked ? 'block' : 'none';
      [infoSection, notificationsSection, securitySection, reportsSection, accountSection].forEach(sec => {
        if (sec) {
          sec.classList.toggle('disabled', locked);
          if (locked) sec.open = false;
        }
      });
      restrictedBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
          btn.classList.toggle('disabled', locked);
          btn.disabled = locked;
        }
      });

      const validationButtons = [
        'start-recharge',
        'view-status',
        'view-account-level',
        'go-validation-data',
        'open-validation-benefits',
        'open-validation-example'
      ];
      validationButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
          btn.style.display = locked ? 'none' : '';
        }
      });
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

    function toggleGuidedNavigation() {
      const enabled = localStorage.getItem('remeexGuidedNavigationEnabled') === 'true';
      const newState = !enabled;
      localStorage.setItem('remeexGuidedNavigationEnabled', newState);
      const toggle = document.getElementById('guided-navigation-switch');
      if (toggle) toggle.checked = newState;
      showToast('success', newState ? 'Navegación guiada habilitada' : 'Navegación guiada deshabilitada',
        newState ? 'La navegación guiada está activada.' : 'La navegación guiada está desactivada.');
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
      const linkWalletsBtn = document.getElementById('link-wallets-btn');
      const hasBalance = (currentUser.balance.usd || 0) > 0 ||
                         (currentUser.balance.bs || 0) > 0 ||
                         (currentUser.balance.eur || 0) > 0;
      [verifyBtn, activationBtn, repairBtn, linkWalletsBtn].forEach(btn => {
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
      let cryptoBtn = document.getElementById('cryptoBtn');
      let intercambioBtn = document.getElementById('intercambioBtn');

      if (hasBalance) {
        if (rechargeGroup && !cryptoBtn) {
          cryptoBtn = document.createElement('button');
          cryptoBtn.className = 'balance-btn';
          cryptoBtn.id = 'cryptoBtn';
          cryptoBtn.innerHTML = '<i class="fas fa-coins"></i>Área CriptoRemeex';
          rechargeGroup.appendChild(cryptoBtn);

          cryptoBtn.addEventListener('click', function() {
            window.location.href = 'https://www.binance.com/es';
          });
        }

          if (withdrawGroup && !intercambioBtn) {
            intercambioBtn = document.createElement('button');
            intercambioBtn.className = 'balance-btn';
            intercambioBtn.id = 'intercambioBtn';
            intercambioBtn.innerHTML = '<i class="fas fa-exchange-alt"></i><span class="btn-text"><span class="line1">Intercambio entre usuarios</span><span class="line2">Remeex</span></span>';
            withdrawGroup.appendChild(intercambioBtn);
            intercambioBtn.addEventListener('click', function() {
              window.location.href = 'intercambio.html';
            });
          }
      } else {
        if (cryptoBtn) cryptoBtn.remove();
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
      if (!card) return;
      const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.BALANCE) || sessionStorage.getItem(CONFIG.SESSION_KEYS.BALANCE);
      try {
        const bal = stored ? JSON.parse(stored) : { usd: 0, bs: 0, eur: 0 };
        const canonical = getCanonicalBalance(bal);
        document.getElementById('pre-main-balance').textContent = formatCurrency(canonical.bs, 'bs');
        document.getElementById('pre-usd-balance').textContent = `≈ ${formatCurrency(canonical.usd, 'usd')}`;
        document.getElementById('pre-eur-balance').textContent = `≈ ${formatCurrency(canonical.eur, 'eur')}`;
        const preRateLabel = currentRateName ? `Tasa (${currentRateName}):` : 'Tasa:';
        document.getElementById('pre-exchange-rate').textContent = `${preRateLabel} 1 USD = ${CONFIG.EXCHANGE_RATES.USD_TO_BS.toFixed(2)} Bs | 1 USD = ${CONFIG.EXCHANGE_RATES.USD_TO_EUR.toFixed(2)} EUR`;
        card.style.display = 'block';
        if (led) {
          const hasFunds = canonical.usd > 0 || canonical.bs > 0 || canonical.eur > 0;
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
      if (balanceOwner) balanceOwner.textContent = `${name}, tu saldo disponible:`;

      const nameInput = document.getElementById('full-name');
      const emailInput = document.getElementById('email');
      if (nameInput) nameInput.value = name;
      if (emailInput) emailInput.value = email;

      const avatarImg = document.getElementById('login-avatar-img');
      if (avatarImg) {
        const photo = localStorage.getItem('remeexProfilePhoto') || reg.profilePhoto || '';
        if (photo) {
          avatarImg.src = photo;
          avatarImg.style.display = 'block';
          localStorage.setItem('remeexProfilePhoto', photo);
        }
      }

    }

    let loginBankInterval;
    function updateLoginBankLogo() {
      if (loginBankInterval) return; // already initialized
      const bankContainer = document.getElementById('login-bank-logo');
      const bankImg = document.getElementById('login-bank-logo-img');
      const bankText = document.getElementById('bank-affiliate-text');
      if (!bankContainer || !bankImg) return;

      const bankIds = [
        'banco-venezuela',
        'banco-mercantil',
        'banco-provincial',
        'banco-bancaribe',
        'banco-exterior',
        'banco-caroni',
        'banco-banesco',
        'banco-bancofc',
        'banco-100banco',
        'banco-tesoro',
        'banco-activo',
        'banco-bancamiga',
        'banco-n58',
        'banco-bnc',
        'zelle',
        'paypal',
        'zinli',
        'western-union',
        'xoom',
        'zoom'
      ];

      let index = 0;
      function showNextLogo() {
        const id = bankIds[index];
        const logoUrl = typeof getBankLogo === 'function' ? getBankLogo(id) : id;
        const name = (typeof BANK_NAME_MAP !== 'undefined' ? BANK_NAME_MAP[id] : '') || id;
        bankImg.style.opacity = 0;
        setTimeout(() => {
          bankImg.src = logoUrl;
          bankImg.alt = name;
          bankImg.style.opacity = 1;
        }, 250);
        index = (index + 1) % bankIds.length;
      }

      bankContainer.style.display = 'flex';
      if (bankText) bankText.style.display = 'block';
      showNextLogo();
      loginBankInterval = setInterval(showNextLogo, 4000);
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
      const bankName = (typeof BANK_NAME_MAP !== 'undefined' ? BANK_NAME_MAP[reg.primaryBank] : '') || reg.primaryBank || 'tu banco';
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
    function createTransactionElement(transaction) {
      const element = document.createElement('div');
      element.className = 'transaction-item';
      element.setAttribute('aria-label', `Transacción: ${transaction.description}`);
      
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

      if (transaction.cardAmount) {
        const cardAmt = formatCurrency(transaction.cardAmount, 'usd');
        const balAmt = formatCurrency(transaction.amount, 'usd');
        transactionHTML += `
          <div class="transaction-category">
            <i class="fas fa-random"></i>
            <span>Mixto: ${balAmt} Remeex y ${cardAmt} tarjeta</span>
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
          ${amountPrefix}${formatCurrency(transaction.amount, 'usd')}
        </div>
      `;

      if (transaction.status === 'pending_refund' && !transaction.undoDisabled && Date.now() < transaction.undoDeadline) {
        element.classList.add('has-action');
        transactionHTML += `
          <div class="transaction-action">
            <button class="btn btn-outline btn-small undo-refund-btn" type="button">Anular reintegro</button>
          </div>
        `;
      }

      element.innerHTML = transactionHTML;

      if (transaction.type === 'withdraw' && transaction.status === 'pending') {
        const pendingBadge = element.querySelector('.transaction-badge.pending');
        if (pendingBadge) {
          pendingBadge.addEventListener('click', function(e) {
            e.stopPropagation();
            const overlay = document.getElementById('withdrawals-overlay');
            if (overlay) overlay.style.display = 'flex';
            updatePendingWithdrawalsList();
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

      currentUser.transactions.slice().reverse().forEach((tx, index) => {
        const ref = tx.reference || tx.id || tx.timestamp || tx.date || `tx-${index}`;
        if (displayedTransactions.has(ref)) return;

        if (tx.status === 'pending_refund' && tx.undoDeadline && Date.now() > tx.undoDeadline) {
          tx.status = 'completed';
        }

        if (transactionFilter === 'sent' && tx.type !== 'withdraw') return;
        if (transactionFilter === 'received' && tx.type !== 'deposit') return;
        if (transactionFilter === 'savings' && !tx.description.toLowerCase().includes('ahorro')) return;
        if (transactionFilter === 'exchange' && !tx.description.toLowerCase().includes('intercambio')) return;
        if (transactionFilter === 'services' && !tx.description.toLowerCase().includes('servicio')) return;

        const transactionElement = createTransactionElement(tx);
        recentTransactions.insertBefore(transactionElement, recentTransactions.firstChild);
        if (tx.status === 'pending_refund' && !tx.undoDisabled && Date.now() < tx.undoDeadline) {
          const btn = transactionElement.querySelector('.undo-refund-btn');
          if (btn) btn.addEventListener('click', () => showRefundUndoOverlay(tx.id));
        }
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
        balanceLabelName.textContent = `${firstName}, tu saldo disponible:`;
      }
      }

      personalizeStatusTexts();

      // Update dashboard
      updateDashboardUI();
      // Ensure validation message reflects latest balance
      updateBankValidationStatusItem();
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

  function setupSupportFab() {
    const fab = document.getElementById('support-fab');
    const menu = document.getElementById('support-menu');
    if (fab && menu) {
      fab.addEventListener('click', function() {
        menu.classList.toggle('show');
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

    const canonicalBalance = getCanonicalBalance();
    const balanceEquivalents = {
      usd: canonicalBalance.usd,
      eur: canonicalBalance.eur
    };
    const usdEquivalent = balanceEquivalents.usd;
    const eurEquivalent = balanceEquivalents.eur;

    if (selectedBalanceCurrency === 'bs') {
      mainFlag.src = 'https://upload.wikimedia.org/wikipedia/commons/0/06/Flag_of_Venezuela.svg';
      mainSymbol.textContent = 'Bs';
      mainValue.textContent = formatCurrency(canonicalBalance.bs, 'bs').replace('Bs ', '');
      if (eq1Flag) eq1Flag.src = 'https://flagcdn.com/us.svg';
      if (eq1Span) eq1Span.textContent = `≈ ${formatCurrency(usdEquivalent, 'usd')}`;
      if (eq2Flag) eq2Flag.src = 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg';
      if (eq2Span) eq2Span.textContent = `≈ ${formatCurrency(eurEquivalent, 'eur')}`;
    } else {
      mainFlag.src = 'https://flagcdn.com/us.svg';
      mainSymbol.textContent = '$';
      mainValue.textContent = formatCurrency(canonicalBalance.usd, 'usd').replace('$', '');
      if (eq1Flag) eq1Flag.src = 'https://upload.wikimedia.org/wikipedia/commons/0/06/Flag_of_Venezuela.svg';
      if (eq1Span) eq1Span.textContent = `≈ ${formatCurrency(canonicalBalance.bs, 'bs')}`;
      if (eq2Flag) eq2Flag.src = 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg';
      if (eq2Span) eq2Span.textContent = `≈ ${formatCurrency(eurEquivalent, 'eur')}`;
    }

    updateBalanceEquivalents(balanceEquivalents);

    const usdtSpan = document.getElementById('usdt-equivalent');
    if (usdtSpan) usdtSpan.textContent = `≈ ${(currentUser.balance.usdt || 0).toFixed(2)} USDT`;

    updateMiniBalanceOverlay();
  }

  function updateMiniBalanceOverlay() {
    const mini = document.getElementById('mini-balance-overlay');
    if (!mini) return;
    const amount = currentUser.balance.bs || 0;
    mini.textContent = `Tu saldo actual es ${formatCurrency(amount, 'bs')}`;
  }

  function showMiniBalanceOverlay() {
    const mini = document.getElementById('mini-balance-overlay');
    if (!mini) return;
    updateMiniBalanceOverlay();
    mini.style.display = 'block';
    requestAnimationFrame(() => mini.classList.add('visible'));
  }

  function hideMiniBalanceOverlay() {
    const mini = document.getElementById('mini-balance-overlay');
    if (!mini) return;
    mini.classList.remove('visible');
    setTimeout(() => { mini.style.display = 'none'; }, 300);
  }

  function setupMiniBalanceObserver() {
    const mainCard = document.getElementById('main-balance-card');
    const root = document.getElementById('dashboard-container');
    if (!mainCard || !root) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          hideMiniBalanceOverlay();
        } else {
          showMiniBalanceOverlay();
        }
      });
    }, { root, threshold: 0.1 });
    observer.observe(mainCard);
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

        const mobileReceiptButton = document.getElementById('mobile-receipt-upload-btn');
        if (mobileReceiptButton) {
          mobileReceiptButton.addEventListener('click', function() {
            mobileReceiptFile.click();

            // Reset inactivity timer
            resetInactivityTimer();
          });
        }

        const mobileProcessBtn = document.getElementById('mobile-process-recharge-btn');
        const unlockSpinner = document.getElementById('unlock-spinner');
        if (mobileProcessBtn) {
          mobileProcessBtn.addEventListener('click', function() {
            Swal.fire({
              title: 'Procesando comprobante...',
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
                setTimeout(() => {
                  Swal.fire({
                    icon: 'success',
                    title: 'Comprobante enviado',
                    showConfirmButton: false,
                    timer: 1500
                  });
                  if (unlockSpinner) unlockSpinner.style.display = 'flex';
                  setTimeout(() => {
                    openWhatsAppSupport();
                  }, 1500);
                }, 2000);
              }
            });

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
              timestamp: Date.now(),
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
      const cardNumberErrorEl = document.getElementById('card-number-error');
      const submitPaymentButton = document.getElementById('submit-payment');
      const virtualCardNumberEl = document.getElementById('virtual-card-number');
      let normalizedOwnCardNumber = '';

      if (virtualCardNumberEl) {
        let rawOwnCardNumber = '';

        if (virtualCardNumberEl.dataset && typeof virtualCardNumberEl.dataset.value === 'string') {
          rawOwnCardNumber = virtualCardNumberEl.dataset.value;
        } else {
          rawOwnCardNumber = virtualCardNumberEl.textContent || '';
        }

        normalizedOwnCardNumber = rawOwnCardNumber.replace(/\D/g, '');
      }

      const SELF_CARD_ERROR_MESSAGE = 'No puede recargar su cuenta con su propia tarjeta, debe ser otra tarjeta.';

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

          const normalizedInputCardNumber = value;
          if (normalizedOwnCardNumber && normalizedInputCardNumber === normalizedOwnCardNumber) {
            if (cardNumberErrorEl) {
              cardNumberErrorEl.textContent = SELF_CARD_ERROR_MESSAGE;
              cardNumberErrorEl.style.display = 'block';
              cardNumberErrorEl.dataset.selfCardError = 'true';
            } else if (typeof showToast === 'function' && !cardNumberInput.dataset.selfCardToastShown) {
              showToast('error', 'Tarjeta no permitida', SELF_CARD_ERROR_MESSAGE);
              cardNumberInput.dataset.selfCardToastShown = 'true';
            }

            if (submitPaymentButton) {
              submitPaymentButton.disabled = true;
              submitPaymentButton.dataset.selfCardDisabled = 'true';
            }
          } else {
            if (cardNumberErrorEl && cardNumberErrorEl.dataset.selfCardError === 'true') {
              cardNumberErrorEl.textContent = '';
              cardNumberErrorEl.style.display = 'none';
              delete cardNumberErrorEl.dataset.selfCardError;
            }

            if (submitPaymentButton && submitPaymentButton.dataset.selfCardDisabled === 'true') {
              submitPaymentButton.disabled = false;
              delete submitPaymentButton.dataset.selfCardDisabled;
            }

            if (cardNumberInput.dataset && cardNumberInput.dataset.selfCardToastShown) {
              delete cardNumberInput.dataset.selfCardToastShown;
            }
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
                setTimeout(function() {
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
                }, 500);
              }
            });
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
      if (typeof currentUser.twoFactorEnabled !== 'boolean') {
        currentUser.twoFactorEnabled = localStorage.getItem('remeexTwoFactorEnabled') === 'true';
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
      if (!currentUser.virtualCardCurrency) {
        try {
          const storedVirtualCurrency = localStorage.getItem(CONFIG.STORAGE_KEYS.VIRTUAL_CARD_CURRENCY);
          const normalized = storedVirtualCurrency ? storedVirtualCurrency.toLowerCase() : '';
          if (['usd', 'bs', 'eur'].indexOf(normalized) !== -1) {
            currentUser.virtualCardCurrency = normalized;
          } else {
            currentUser.virtualCardCurrency = currentUser.primaryCurrency || 'usd';
          }
        } catch (error) {
          currentUser.virtualCardCurrency = currentUser.primaryCurrency || 'usd';
        }
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
