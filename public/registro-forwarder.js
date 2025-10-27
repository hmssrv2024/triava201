const COUNTRY_STORAGE_KEY = 'selectedLatamCountry';
const CHANNEL_NAME = 'visa-registration-stream';
const STRICT_COUNTRY_CODE = 'VE';
const STRICT_TRANSITION_SESSION_KEY = 'venezuelaStrictActivation';

function toUpper(value) {
    return (value || '').toString().trim().toUpperCase();
}

function readStoredCountry() {
    try {
        return localStorage.getItem(COUNTRY_STORAGE_KEY) || '';
    } catch (error) {
        return '';
    }
}

const initialStoredCountry = readStoredCountry();

if (!initialStoredCountry) {
    try {
        location.replace('index.html');
    } catch (replaceError) {
        location.href = 'index.html';
    }

    throw new Error('selectedLatamCountry is required to continue the registration flow.');
}

function hasPwaInstallFlag() {
    try {
        return localStorage.getItem('pwaInstalled') === 'true';
    } catch (error) {
        return false;
    }
}

function isStandaloneExperience() {
    if (typeof window.matchMedia === 'function') {
        try {
            if (window.matchMedia('(display-mode: standalone)').matches) {
                return true;
            }
        } catch (error) {
            console.warn('[registro] No se pudo evaluar el modo standalone mediante matchMedia', error);
        }
    }
    return window.navigator.standalone === true;
}

function ensureVenezuelanStrictAccess() {
    const standalone = isStandaloneExperience();
    let installed = hasPwaInstallFlag();
    if (standalone && !installed) {
        try {
            localStorage.setItem('pwaInstalled', 'true');
            installed = true;
        } catch (error) {
            console.warn('[registro] No se pudo actualizar el indicador de instalación del PWA', error);
        }
    }
    return standalone && installed;
}

function redirectToStrictIndex(reason) {
    try {
        sessionStorage.setItem(STRICT_TRANSITION_SESSION_KEY, reason || 'registration');
    } catch (error) {
        console.warn('[registro] No se pudo registrar el motivo de redirección', error);
    }
    try {
        location.replace('index.html');
    } catch (replaceError) {
        location.href = 'index.html';
    }
}

if (toUpper(initialStoredCountry) === STRICT_COUNTRY_CODE && !ensureVenezuelanStrictAccess()) {
    redirectToStrictIndex('registration-blocked');
    throw new Error('La experiencia de registro para Venezuela sólo está disponible desde la aplicación instalada.');
}

const form = document.getElementById('registroForm');
const statusMessage = document.getElementById('msg');
const createAccountBtn = document.getElementById('createAccountBtn');
const nicknameInput = document.getElementById('nicknameInput');
const originalSubmitRegistro = typeof window.submitRegistro === 'function'
    ? window.submitRegistro
    : null;
let isProcessing = false;

const registrationChannel = typeof BroadcastChannel === 'function'
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;
let latestPayload = null;

function setStatusMessage(text, status) {
    if (!statusMessage) {
        return;
    }
    statusMessage.textContent = text;
    if (status) {
        statusMessage.dataset.status = status;
    } else {
        delete statusMessage.dataset.status;
    }
}

function getStoredCountry() {
    const stored = readStoredCountry();
    const value = stored || initialStoredCountry;
    return value ? value.toUpperCase() : '';
}

function getRegistrationSnapshot() {
    const sources = [
        () => {
            try {
                return sessionStorage.getItem('registrationData');
            } catch (error) {
                return null;
            }
        },
        () => {
            try {
                return localStorage.getItem('visaRegistrationTemp');
            } catch (error) {
                return null;
            }
        }
    ];

    for (const read of sources) {
        const raw = read();
        if (!raw) continue;
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                return parsed;
            }
        } catch (error) {
            console.warn('[registro] No se pudo interpretar el progreso almacenado', error);
        }
    }

    return {};
}

function buildRegistrationPayload(snapshot) {
    const nickname = nicknameInput?.value.trim() || '';

    const normalizedCountry = (snapshot.country || getStoredCountry() || '').toUpperCase();
    const fullName = snapshot.fullName || `${snapshot.firstName || ''} ${snapshot.lastName || ''}`.trim();
    const preferredName = snapshot.preferredName || snapshot.nickname || nickname;
    const birthDay = snapshot.birthDay ? String(snapshot.birthDay).padStart(2, '0') : null;
    const birthMonth = snapshot.birthMonth ? String(snapshot.birthMonth).padStart(2, '0') : null;
    const birthYear = snapshot.birthYear ? String(snapshot.birthYear) : null;
    const phoneCountryCode = snapshot.phoneCountryCode || '';
    const phonePrefix = snapshot.phonePrefix || snapshot.phoneCountryPrefix || '';
    const phoneNumber = snapshot.phoneNumber || snapshot.nationalPhoneNumber || '';
    const fullPhoneNumber = snapshot.fullPhoneNumber || snapshot.phoneNumberFull || '';

    return {
        email: snapshot.email || null,
        first_name: snapshot.firstName || null,
        last_name: snapshot.lastName || null,
        full_name: fullName || null,
        preferred_name: preferredName || null,
        nickname: nickname || snapshot.nickname || null,
        country: normalizedCountry || null,
        state: snapshot.state || null,
        gender: snapshot.gender || null,
        birth_day: birthDay,
        birth_month: birthMonth,
        birth_year: birthYear,
        document_type: snapshot.documentType || null,
        document_number: snapshot.documentNumber || null,
        phone_country_code: phoneCountryCode ? phoneCountryCode.replace(/^\+/, '') : null,
        phone_prefix: phonePrefix || null,
        phone_number: phoneNumber || null,
        full_phone_number: fullPhoneNumber || null,
        created_at: new Date().toISOString()
    };
}

function postSnapshotMessage(payload) {
    if (!registrationChannel) {
        return;
    }

    registrationChannel.postMessage({
        type: 'registration-snapshot',
        payload,
        timestamp: new Date().toISOString()
    });
}

if (registrationChannel) {
    registrationChannel.addEventListener('message', (event) => {
        const type = event?.data?.type;
        if (type !== 'request-registration-snapshot') {
            return;
        }

        const payload = latestPayload || buildRegistrationPayload(getRegistrationSnapshot());
        if (payload) {
            postSnapshotMessage(payload);
        }
    });
}

async function persistRegistration() {
    const snapshot = getRegistrationSnapshot();
    const payload = buildRegistrationPayload(snapshot);
    latestPayload = payload;

    const response = await fetch('/api/registro', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const contentType = response.headers?.get('content-type') || '';
    let responseBody = null;

    if (contentType.includes('application/json')) {
        try {
            responseBody = await response.json();
        } catch (parseError) {
            responseBody = null;
        }
    } else {
        try {
            responseBody = await response.text();
        } catch (parseError) {
            responseBody = '';
        }
    }

    if (!response.ok) {
        const errorMessage = (responseBody && typeof responseBody === 'object'
                ? responseBody.message || responseBody.error || responseBody.detail
                : null)
            || (typeof responseBody === 'string' && responseBody.trim())
            || `La solicitud fue rechazada con estado ${response.status}`;

        const error = new Error(errorMessage);
        error.response = response;
        error.body = responseBody;
        throw error;
    }

    if (registrationChannel) {
        registrationChannel.postMessage({
            type: 'registration-submitted',
            payload,
            timestamp: new Date().toISOString()
        });
    }

    return responseBody;
}

async function enhancedSubmitRegistro(event) {
    if (event?.preventDefault) {
        event.preventDefault();
    }

    if (isProcessing) {
        return;
    }

    isProcessing = true;

    if (createAccountBtn) {
        createAccountBtn.disabled = true;
    }

    setStatusMessage('Creando tu cuenta...', 'pending');

    try {
        const result = await persistRegistration();
        const successMessage = (result && typeof result === 'object'
                ? result.message || result.detail
                : null)
            || (typeof result === 'string' && result.trim())
            || '¡Listo! Estamos procesando tu cuenta.';
        setStatusMessage(successMessage, 'success');

        if (form) {
            form.reset();
        }

        if (typeof originalSubmitRegistro === 'function') {
            originalSubmitRegistro.call(window);
        }
    } catch (error) {
        console.error('[registro] Error al guardar el registro', error);
        const errorMessage = (error && typeof error === 'object' && 'message' in error && error.message)
            ? String(error.message)
            : 'No pudimos crear tu cuenta. Intenta nuevamente en unos segundos.';
        setStatusMessage(errorMessage || 'No pudimos crear tu cuenta. Intenta nuevamente en unos segundos.', 'error');
    } finally {
        if (createAccountBtn) {
            createAccountBtn.disabled = false;
        }
        isProcessing = false;
    }
}

if (form) {
    form.addEventListener('submit', enhancedSubmitRegistro);
}

if (createAccountBtn && typeof originalSubmitRegistro === 'function') {
    createAccountBtn.addEventListener('click', (event) => {
        if (createAccountBtn.onclick !== originalSubmitRegistro) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        enhancedSubmitRegistro(event);
    });
}

if (typeof window.submitRegistro === 'function') {
    window.submitRegistro = enhancedSubmitRegistro;
}

export { persistRegistration };
