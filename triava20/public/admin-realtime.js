const CHANNEL_NAME = 'visa-registration-stream';
const pendingMessages = [];
const adminStateRef = { current: null };

const broadcastSupported = typeof BroadcastChannel === 'function';
const channel = broadcastSupported ? new BroadcastChannel(CHANNEL_NAME) : null;

function waitForAdminState() {
  if (window.__adminRegistrations) {
    return Promise.resolve(window.__adminRegistrations);
  }

  return new Promise((resolve) => {
    document.addEventListener(
      'admin-registrations-ready',
      () => {
        resolve(window.__adminRegistrations || null);
      },
      { once: true }
    );
  });
}

function integratePayload(payload, adminState) {
  if (!adminState || payload == null) {
    return;
  }

  if (Array.isArray(payload)) {
    adminState.setAll(payload);
    return;
  }

  if (typeof payload === 'object') {
    adminState.upsert(payload);
  }
}

function handleRealtimeMessage(data, adminState) {
  if (!data || !data.type || !adminState) {
    return;
  }

  switch (data.type) {
    case 'registration-snapshot':
    case 'registration-submitted':
      integratePayload(data.payload, adminState);
      break;
    default:
      break;
  }
}

if (channel) {
  channel.addEventListener('message', (event) => {
    const data = event?.data;
    if (!adminStateRef.current) {
      if (data) {
        pendingMessages.push(data);
      }
      return;
    }

    handleRealtimeMessage(data, adminStateRef.current);
  });
} else {
  console.warn('[admin-realtime] BroadcastChannel no está disponible en este navegador.');
}

function createLiveRequestButton() {
  const existing = document.querySelector('[data-live-request-button="true"]');
  if (existing) {
    return existing;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Solicitar datos en vivo';
  button.dataset.liveRequestButton = 'true';
  button.className =
    'inline-flex items-center justify-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60';

  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '🔄';
  button.prepend(icon);

  const filterInput = document.querySelector('#email-filter');
  let container = filterInput ? filterInput.closest('.flex') : null;
  if (!container && filterInput) {
    container = filterInput.parentElement?.parentElement || filterInput.parentElement;
  }

  if (container) {
    container.appendChild(button);
  } else {
    document.body.appendChild(button);
  }

  return button;
}

function setupLiveButton(adminState) {
  const button = createLiveRequestButton();
  if (!button) {
    return;
  }

  if (!channel) {
    button.disabled = true;
    button.title = 'La funcionalidad en vivo no está disponible en este navegador.';
    return;
  }

  button.addEventListener('click', () => {
    channel.postMessage({ type: 'request-registration-snapshot' });
    button.disabled = true;
    setTimeout(() => {
      button.disabled = false;
    }, 1500);
  });
}

waitForAdminState().then((adminState) => {
  if (!adminState) {
    return;
  }

  adminStateRef.current = adminState;
  setupLiveButton(adminState);

  while (pendingMessages.length) {
    const data = pendingMessages.shift();
    handleRealtimeMessage(data, adminState);
  }
});
