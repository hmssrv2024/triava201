(function () {
  'use strict';

  const statusIndicator = document.getElementById('supabase-status');
  const previewCard = document.getElementById('session-preview');
  const previewName = document.getElementById('preview-name');
  const previewEmail = document.getElementById('preview-email');
  const previewStatus = document.getElementById('preview-status');
  const form = document.getElementById('prelogin-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const codeInput = document.getElementById('security-code');
  const answerInput = document.getElementById('security-answer');
  const pinInput = document.getElementById('security-pin');
  const documentCheckInput = document.getElementById('document-check');
  const questionBox = document.getElementById('security-question');
  const submitBtn = document.getElementById('submit-btn');
  const errorBox = document.getElementById('prelogin-error');
  const successBox = document.getElementById('prelogin-success');
  const profileLoading = document.getElementById('profile-loading');

  let cachedProfile = null;
  let cachedEmail = '';
  let supabaseReady = false;
  let syncing = false;

  function setStatus(text, online) {
    if (!statusIndicator) return;
    statusIndicator.innerHTML = '';
    const dot = document.createElement('span');
    if (!online) {
      dot.style.background = '#f87171';
      dot.style.boxShadow = '0 0 0 6px rgba(248, 113, 113, 0.18)';
    }
    statusIndicator.appendChild(dot);
    statusIndicator.appendChild(document.createTextNode(` ${text}`));
  }

  function toggleLoading(show) {
    if (!profileLoading) return;
    profileLoading.hidden = !show;
  }

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.classList.add('is-visible');
    errorBox.classList.add('alert-error');
    if (successBox) {
      successBox.textContent = '';
      successBox.classList.remove('is-visible');
    }
  }

  function showSuccess(message) {
    if (!successBox) return;
    successBox.textContent = message;
    successBox.classList.add('is-visible');
    successBox.classList.add('alert-success');
    if (errorBox) {
      errorBox.textContent = '';
      errorBox.classList.remove('is-visible');
    }
  }

  function clearFeedback() {
    if (errorBox) {
      errorBox.textContent = '';
      errorBox.classList.remove('is-visible');
    }
    if (successBox) {
      successBox.textContent = '';
      successBox.classList.remove('is-visible');
    }
  }

  function updatePreview(profile) {
    if (!previewCard || !profile) {
      previewCard && previewCard.setAttribute('hidden', '');
      return;
    }
    const fullName = resolveFullName(profile);
    previewName.textContent = fullName || '—';
    previewEmail.textContent = profile.email || cachedEmail || '—';
    if (profile.account_blocked) {
      previewStatus.textContent = 'Cuenta bloqueada';
      previewStatus.style.color = '#fca5a5';
    } else if (profile.is_validated) {
      previewStatus.textContent = 'Cuenta validada';
      previewStatus.style.color = '#bbf7d0';
    } else {
      previewStatus.textContent = 'Validación pendiente';
      previewStatus.style.color = '#fde68a';
    }
    previewCard.removeAttribute('hidden');
  }

  function clearPreview() {
    cachedProfile = null;
    previewName.textContent = '—';
    previewEmail.textContent = '—';
    previewStatus.textContent = '—';
    previewCard && previewCard.setAttribute('hidden', '');
  }

  function normalize(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function normalizeDigits(value) {
    return normalize(value).replace(/[^0-9]/g, '');
  }

  function resolveFullName(profile) {
    if (!profile) return '';
    const fromProfile = profile.full_name || '';
    if (fromProfile.trim()) return fromProfile.trim();
    const composed = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return composed || profile.preferred_name || '';
  }

  function waitForSupabase() {
    if (supabaseReady && window.SupabaseDB && window.SupabaseDB.isReady()) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const check = () => {
        if (window.SupabaseDB && typeof window.SupabaseDB.isReady === 'function' && window.SupabaseDB.isReady()) {
          supabaseReady = true;
          setStatus('Supabase conectado', true);
          resolve();
          return true;
        }
        return false;
      };

      if (check()) return;

      const handler = () => {
        if (check()) {
          window.removeEventListener('supabase:ready', handler);
        }
      };
      window.addEventListener('supabase:ready', handler);

      let attempts = 0;
      const maxAttempts = 40;
      const interval = window.setInterval(() => {
        attempts += 1;
        if (check() || attempts >= maxAttempts) {
          window.clearInterval(interval);
          if (!supabaseReady) {
            setStatus('Supabase sin conexión', false);
            resolve();
          }
        }
      }, 250);
    });
  }

  function isHourlyVerificationCode(code) {
    const normalized = normalizeDigits(code);
    if (!normalized || normalized.length !== 20) return false;
    const codigoValidacion = normalized.substring(4);
    const now = new Date();
    const day = now.getUTCDate();
    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();
    const hour = now.getUTCHours();
    const part2 = String(hour).padStart(2, '0') + '84';
    const part3 = String(day).padStart(2, '0') + String(year).slice(-2);
    const part4 = String(month).padStart(2, '0') + String(hour).padStart(2, '0');
    const seed = (day * month * year * (hour + 1)) % 10000;
    const part5 = String(seed).padStart(4, '0');
    const expected = part2 + part3 + part4 + part5;
    return codigoValidacion === expected;
  }

  function deriveRateFromCode(code) {
    const digits = normalizeDigits(code);
    if (digits.length < 4) return null;
    const rate = parseInt(digits.slice(0, 4), 10);
    if (Number.isFinite(rate)) {
      return rate / 10;
    }
    return null;
  }

  function generateDeviceId() {
    try {
      let id = localStorage.getItem('remeexDeviceId');
      if (!id) {
        id = `device_${Math.random().toString(36).slice(2, 15)}${Math.random().toString(36).slice(2, 15)}`;
        localStorage.setItem('remeexDeviceId', id);
      }
      return id;
    } catch (error) {
      return `device_${Date.now().toString(36)}`;
    }
  }

  async function fetchProfile(email) {
    const normalizedEmail = normalize(email).toLowerCase();
    if (!normalizedEmail) {
      clearPreview();
      questionBox.textContent = 'Introduce tu correo para recuperar la pregunta de seguridad.';
      return null;
    }
    await waitForSupabase();
    if (!window.SupabaseDB || !window.SupabaseDB.isReady()) {
      showError('No se pudo conectar con Supabase. Verifica tu conexión e intenta nuevamente.');
      return null;
    }
    toggleLoading(true);
    try {
      const result = await window.SupabaseDB.getProfile(normalizedEmail);
      if (!result.ok) {
        showError(result.error || 'No encontramos un registro con ese correo.');
        cachedProfile = null;
        cachedEmail = normalizedEmail;
        questionBox.textContent = 'No encontramos datos para este correo. Verifica e intenta otra vez.';
        return null;
      }
      const profile = result.data || {};
      cachedProfile = profile;
      cachedEmail = normalizedEmail;
      questionBox.textContent = profile.security_question
        ? `Pregunta de seguridad: ${profile.security_question}`
        : 'No hay una pregunta de seguridad registrada. Continúa con el proceso.';
      updatePreview(profile);
      clearFeedback();
      return profile;
    } catch (error) {
      console.error('[Prelogin] Error consultando perfil en Supabase', error);
      showError('No se pudo recuperar tu información. Intenta nuevamente en unos segundos.');
      return null;
    } finally {
      toggleLoading(false);
    }
  }

  function buildSessionMonitor(profile, sessionId) {
    const now = new Date().toISOString();
    const deviceInfo = {
      platform: navigator.platform,
      language: navigator.language,
      userAgent: navigator.userAgent,
      screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : ''
    };
    return {
      currentSessionId: sessionId,
      isOnline: true,
      lastLoginAt: now,
      lastSeenAt: now,
      updatedAt: now,
      user: {
        fullName: resolveFullName(profile),
        email: profile.email || cachedEmail || ''
      },
      deviceInfo,
      history: [
        {
          id: sessionId,
          type: 'login',
          label: 'Inicio de sesión',
          timestamp: now,
          reason: 'Sincronización mediante Prelogin Seguro',
          source: 'Supabase Prelogin'
        }
      ]
    };
  }

  function normalizeTransactions(transactions, usdToBs, usdToEur) {
    if (!Array.isArray(transactions)) return [];
    const rateBs = Number.isFinite(usdToBs) ? usdToBs : null;
    const rateEur = Number.isFinite(usdToEur) ? usdToEur : null;
    return transactions.map((tx) => {
      const date = tx.transaction_date || tx.created_at || tx.date;
      const timestamp = date ? Date.parse(date) : Date.now();
      const amount = Number(tx.amount) || 0;
      const currency = normalize(tx.currency || 'usd').toLowerCase() || 'usd';
      const usdAmount = currency === 'usd' ? amount : amount;
      const amountBs = rateBs ? Number((usdAmount * rateBs).toFixed(2)) : null;
      const amountEur = rateEur ? Number((usdAmount * rateEur).toFixed(2)) : null;
      return {
        id: tx.id,
        type: tx.transaction_type || tx.type || 'transaction',
        description: tx.description || tx.concept || 'Operación registrada en Supabase',
        amount: usdAmount,
        currency: currency,
        status: tx.status || 'completed',
        timestamp,
        date,
        reference: tx.reference || tx.id || null,
        amountBs,
        amountEur,
        metadata: tx
      };
    });
  }

  function persistRegistration(profile, balanceData, sessionId, exchangeRates, transactions) {
    const deviceId = profile.device_id || generateDeviceId();
    const securityCode = profile.security_code || profile.securityCode || '';
    const rateFromCode = deriveRateFromCode(securityCode);
    const usdToBs = rateFromCode || (exchangeRates && exchangeRates.USD_TO_BS) || null;
    const usdToEur = exchangeRates && exchangeRates.USD_TO_EUR ? exchangeRates.USD_TO_EUR : null;

    const registrationData = {
      email: profile.email || cachedEmail || '',
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      fullName: resolveFullName(profile),
      preferredName: profile.preferred_name || '',
      nickname: profile.nickname || '',
      country: profile.country || '',
      state: profile.state || '',
      phoneCountryCode: profile.phone_country_code || '',
      phonePrefix: profile.phone_prefix || '',
      phoneNumber: profile.phone_number || '',
      fullPhoneNumber: profile.full_phone_number || '',
      documentType: profile.document_type || '',
      documentNumber: profile.document_number || '',
      password: profile.password || '',
      verificationCode: securityCode,
      securityCode,
      securityPin: profile.security_pin || '',
      securityQuestion: profile.security_question || '',
      securityAnswer: profile.security_answer || '',
      accountStatus: profile.account_status || '',
      validationAmount: profile.validation_amount,
      isValidated: Boolean(profile.is_validated),
      createdAt: profile.created_at || null,
      lastLogin: profile.last_login || profile.last_login_at || null,
      authProvider: profile.auth_provider || 'email',
      googleAvatar: profile.google_avatar_url || '',
      googleId: profile.google_id || '',
      deviceId,
      signatureDataUrl: profile.signature_data_url || '',
      venezuelaBank: profile.venezuela_bank || profile.primary_bank || '',
      paymentMethod: profile.payment_method || '',
      paypalEmail: profile.paypal_email || '',
      accountType: profile.account_type || '',
      purpose: profile.purpose || '',
      initialRechargeConfirmed: Boolean(profile.initial_recharge_confirmed),
      useOldRecarga: !isHourlyVerificationCode(securityCode),
      completed: true,
      lastDeviceInfo: profile.last_device_info || null,
      codeVerified: Boolean(profile.code_verified)
    };

    const loginData = {
      email: registrationData.email,
      password: registrationData.password,
      securityCode,
      securityPin: registrationData.securityPin,
      securityQuestion: registrationData.securityQuestion,
      securityAnswer: registrationData.securityAnswer,
      phoneNumber: registrationData.fullPhoneNumber || registrationData.phoneNumber,
      preferredName: registrationData.preferredName,
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      fullName: registrationData.fullName,
      nickname: registrationData.nickname,
      deviceId,
      completed: true,
      auth_provider: registrationData.authProvider,
      googleId: registrationData.googleId || undefined
    };

    const balance = {
      usd: balanceData && Number.isFinite(balanceData.current_balance) ? Number(balanceData.current_balance) : 0,
      bs: usdToBs ? Number(((balanceData?.current_balance || 0) * usdToBs).toFixed(2)) : 0,
      eur: usdToEur ? Number(((balanceData?.current_balance || 0) * usdToEur).toFixed(2)) : 0,
      deviceId
    };

    const sessionMonitor = buildSessionMonitor(profile, sessionId);
    const exchangeStore = {};
    if (Number.isFinite(usdToBs)) exchangeStore.USD_TO_BS = usdToBs;
    if (Number.isFinite(usdToEur)) exchangeStore.USD_TO_EUR = usdToEur;

    try {
      localStorage.setItem('visaRegistrationCompleted', JSON.stringify(registrationData));
      localStorage.setItem('visaUserData', JSON.stringify(loginData));
      localStorage.setItem('userFullName', registrationData.fullName || registrationData.email);
      localStorage.setItem('remeexBalance', JSON.stringify(balance));
      localStorage.setItem('remeexTransactions', JSON.stringify(transactions));
      localStorage.setItem('homevisaSessionMonitor', JSON.stringify(sessionMonitor));
      localStorage.setItem('remeex_user_session', JSON.stringify({
        userId: profile.id || null,
        email: registrationData.email,
        fullName: registrationData.fullName,
        isValidated: registrationData.isValidated,
        loginTime: sessionMonitor.lastLoginAt,
        deviceInfo: sessionMonitor.deviceInfo
      }));
      if (exchangeStore.USD_TO_BS || exchangeStore.USD_TO_EUR) {
      localStorage.setItem('remeexSessionExchangeRate', JSON.stringify(exchangeStore));
      if (Number.isFinite(exchangeStore.USD_TO_BS)) {
        localStorage.setItem('selectedRate', 'personalizado');
        localStorage.setItem('selectedRateValue', String(exchangeStore.USD_TO_BS));
      }
      if (Number.isFinite(exchangeStore.USD_TO_EUR)) {
        localStorage.setItem('selectedRateUsdToEur', String(exchangeStore.USD_TO_EUR));
      }
      }
    } catch (error) {
      console.warn('[Prelogin] No se pudo persistir toda la información en localStorage', error);
    }
  }

  async function syncSupabase(profile) {
    await waitForSupabase();
    const email = profile.email || cachedEmail;
    if (!email) {
      throw new Error('No se pudo determinar el correo a sincronizar.');
    }

    const screenWidth = window.screen && window.screen.width ? window.screen.width : 0;
    const screenHeight = window.screen && window.screen.height ? window.screen.height : 0;
    let timezone = '';
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (error) {
      timezone = '';
    }

    const deviceInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screenWidth}x${screenHeight}`,
      timestamp: new Date().toISOString(),
      timezone
    };

    let balanceData = null;
    let transactionsData = [];
    let rpcData = null;

    try {
      const rpcPromise = window.supabaseClient
        ? window.supabaseClient.rpc('get_user_data', { p_email: email })
        : Promise.resolve({ data: null, error: null });

      const [balanceResult, transactionsResult, rpcResult] = await Promise.all([
        window.SupabaseDB.getBalance(email),
        window.SupabaseDB.getTransactions(email, 25),
        rpcPromise
      ]);

      if (balanceResult && balanceResult.ok) {
        balanceData = balanceResult.data;
      }
      if (transactionsResult && transactionsResult.ok) {
        transactionsData = transactionsResult.data || [];
      }
      if (rpcResult && !rpcResult.error) {
        rpcData = rpcResult.data;
      }

      await window.SupabaseDB.createSession(email, null, navigator.userAgent);
      if (window.supabaseClient && typeof window.supabaseClient.rpc === 'function') {
        await window.supabaseClient.rpc('log_device_activity', {
          p_email: email,
          p_device_info: deviceInfo
        });
      }
    } catch (error) {
      console.warn('[Prelogin] Advertencia sincronizando con Supabase', error);
    }

    const sessionId = `prelogin-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

    const exchangeRates = (function () {
      if (rpcData && rpcData.balance && Number.isFinite(rpcData.balance.usd_to_bs)) {
        return {
          USD_TO_BS: rpcData.balance.usd_to_bs,
          USD_TO_EUR: rpcData.balance.usd_to_eur
        };
      }
      if (rpcData && rpcData.profile && Number.isFinite(rpcData.profile.usd_to_bs)) {
        return {
          USD_TO_BS: rpcData.profile.usd_to_bs,
          USD_TO_EUR: rpcData.profile.usd_to_eur
        };
      }
      return null;
    })();

    const normalizedTransactions = normalizeTransactions(
      transactionsData,
      exchangeRates ? exchangeRates.USD_TO_BS : null,
      exchangeRates ? exchangeRates.USD_TO_EUR : null
    );

    persistRegistration(profile, balanceData, sessionId, exchangeRates, normalizedTransactions);

    if (rpcData && rpcData.unread_notifications) {
      try {
        localStorage.setItem('homevisaNotifications', JSON.stringify(rpcData.unread_notifications));
      } catch (error) {
        console.warn('[Prelogin] No se pudo almacenar las notificaciones', error);
      }
    }

    return { sessionId };
  }

  function validateInputs(profile) {
    const password = normalize(passwordInput.value);
    const storedPassword = normalize(profile.password);
    if (!password || password !== storedPassword) {
      throw new Error('La contraseña no coincide con la registrada.');
    }

    const codeValue = normalizeDigits(codeInput.value);
    const storedCode = normalizeDigits(profile.security_code || profile.securityCode);
    if (!storedCode || codeValue !== storedCode) {
      throw new Error('El código de 20 dígitos no coincide con el registrado.');
    }

    const answer = normalize(answerInput.value).toLowerCase();
    const storedAnswer = normalize(profile.security_answer).toLowerCase();
    if (!storedAnswer || answer !== storedAnswer) {
      throw new Error('La respuesta de seguridad no coincide.');
    }

    const pin = normalizeDigits(pinInput.value);
    const storedPin = normalizeDigits(profile.security_pin);
    if (!storedPin || pin !== storedPin) {
      throw new Error('El PIN de seguridad es incorrecto.');
    }

    const documentCheck = normalizeDigits(documentCheckInput.value);
    if (documentCheck) {
      const documentNumber = normalizeDigits(profile.document_number || profile.document || '');
      if (documentNumber) {
        if (documentNumber.slice(-1) !== documentCheck) {
          throw new Error('El dígito de verificación del documento no coincide.');
        }
      } else {
        console.warn('[Prelogin] No se encontró documento para validar dígito.');
      }
    }

    if (profile.account_blocked) {
      throw new Error(
        profile.block_reason
          ? `Tu cuenta está bloqueada: ${profile.block_reason}`
          : 'Tu cuenta está bloqueada. Contacta a soporte.'
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (syncing) return;
    clearFeedback();

    const email = normalize(emailInput.value);
    if (!email) {
      showError('Introduce un correo válido.');
      return;
    }

    try {
      syncing = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sincronizando…';

      const profile = cachedProfile && cachedEmail === email.toLowerCase() ? cachedProfile : await fetchProfile(email);
      if (!profile) {
        throw new Error('No se pudo recuperar el perfil.');
      }

      validateInputs(profile);

      const { sessionId } = await syncSupabase(profile);

      showSuccess('¡Cuenta sincronizada! Te redirigiremos a HomeVisa con tus datos actualizados.');
      submitBtn.textContent = 'Abrir HomeVisa';
      submitBtn.disabled = false;

      window.setTimeout(() => {
        window.location.href = 'homevisa.html?session=' + encodeURIComponent(sessionId);
      }, 1200);
    } catch (error) {
      console.error('[Prelogin] Error al sincronizar', error);
      showError(error.message || 'No se pudo completar la sincronización.');
      submitBtn.textContent = 'Sincronizar cuenta';
      submitBtn.disabled = false;
    } finally {
      syncing = false;
    }
  }

  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      const email = normalize(emailInput.value);
      if (!email) {
        questionBox.textContent = 'Introduce tu correo para recuperar la pregunta de seguridad.';
        clearPreview();
        return;
      }
      fetchProfile(email);
    });
  }

  if (codeInput) {
    codeInput.addEventListener('input', () => {
      const digits = normalizeDigits(codeInput.value);
      if (digits.length > 20) {
        codeInput.value = digits.slice(0, 20);
      }
    });
  }

  if (pinInput) {
    pinInput.addEventListener('input', () => {
      const digits = normalizeDigits(pinInput.value);
      if (digits.length > 4) {
        pinInput.value = digits.slice(0, 4);
      }
    });
  }

  form && form.addEventListener('submit', handleSubmit);

  waitForSupabase();
})();
