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

  const REGISTRATION_SNAPSHOT_DESCRIPTORS = [
    { key: 'visaRegistrationCompleted', label: 'Registro completado', storage: 'localStorage' },
    { key: 'visaRegistrationTemp', label: 'Registro temporal (localStorage)', storage: 'localStorage' },
    { key: 'visaRegistrationTemp', label: 'Registro temporal (sessionStorage)', storage: 'sessionStorage' },
    { key: 'visaUserData', label: 'Credenciales y sesión', storage: 'localStorage' },
    { key: 'remeexVerificationData', label: 'Verificación de identidad', storage: 'localStorage' },
    { key: 'remeexVerificationBanking', label: 'Verificación bancaria', storage: 'localStorage' },
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

  function toNumber(value) {
    if (Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const normalized = value
        .replace(/[^0-9,.-]/g, '')
        .replace(/(,)(?=\d{3}\b)/g, '')
        .replace(',', '.');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
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
    const { timestamp, createdAt, updatedAt, date } = transaction;

    if (Number.isFinite(timestamp)) return timestamp;
    if (typeof timestamp === 'string') {
      const numeric = Number(timestamp);
      if (Number.isFinite(numeric)) return numeric;
      const parsed = Date.parse(timestamp);
      if (Number.isFinite(parsed)) return parsed;
    }

    const fallbackString = createdAt || updatedAt || date;
    if (typeof fallbackString === 'string') {
      const parsed = Date.parse(fallbackString);
      if (Number.isFinite(parsed)) return parsed;
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

  function resolveAvatarSource(registration, userData, verification, banking, temp) {
    const candidates = [
      safeGetFromStorage(localStorage, 'remeexProfilePhoto'),
      registration?.profilePhoto,
      userData?.profilePhoto,
      verification?.profilePhoto,
      banking?.profilePhoto,
      temp?.profilePhoto
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

  function gatherProfileInfo(registration, userData, verification, banking, temp) {
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
    const avatarSrc = resolveAvatarSource(registration, userData, verification, banking, temp);

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
      sources: { registration, userData, verification, banking, temp }
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
    const rate = getRateInfo();
    const balance = loadBalance();
    const transactions = loadTransactions();
    const sessionMonitor = loadSessionMonitor();

    const combinedRegistration = Object.assign(
      {},
      registrationTemp && typeof registrationTemp === 'object' ? registrationTemp : {},
      userData && typeof userData === 'object' ? userData : {},
      verification && typeof verification === 'object' ? verification : {},
      banking && typeof banking === 'object' ? banking : {},
      registration && typeof registration === 'object' ? registration : {}
    );

    const profile = gatherProfileInfo(registration, userData, verification, banking, registrationTemp);
    const snapshots = collectRegistrationSnapshots();

    renderProfile(profile);
    renderRegistration(combinedRegistration, Boolean(registration));
    renderRegistrationSnapshots(snapshots);
    renderRate(rate);
    renderBalance(balance);
    renderSessionMonitor(sessionMonitor);
    renderTransactions(transactions);
  }

  let refreshTimeout = null;

  function scheduleRefresh(delay = 0) {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    refreshTimeout = setTimeout(refreshAll, delay);
  }

  document.addEventListener('DOMContentLoaded', function () {
    refreshAll();
    setInterval(refreshAll, 60000);
  });

  window.addEventListener('storage', function () {
    scheduleRefresh();
  });

  const watchedKeys = new Set([
    'visaRegistrationCompleted',
    'visaRegistrationTemp',
    'visaUserData',
    'remeexVerificationData',
    'remeexVerificationBanking',
    'remeexIdentityDetails',
    'remeexIdentityDocuments',
    'remeexProfilePhoto',
    'remeexDeviceId',
    'remeexBalance',
    'remeexTransactions',
    'selectedRate',
    'selectedRateValue',
    'selectedRateUsdToEur',
    'selectedLatamCountry',
    'userFullName',
    'remeexSessionExchangeRate',
    'homevisaSessionMonitor'
  ]);

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
