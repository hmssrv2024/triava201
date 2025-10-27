import { DATASET } from './countries-data.js';

if (!window.__registroScriptLoaded) {
    window.__registroScriptLoaded = true;

    const COUNTRY_STORAGE_KEY = 'selectedLatamCountry';
    const DOCUMENT_HIDDEN_CLASS = 'registro-document-hidden';

    function getSelectedCountry() {
        try {
            return localStorage.getItem(COUNTRY_STORAGE_KEY) || '';
        } catch (error) {
            return '';
        }
    }

    const rawStoredCountry = getSelectedCountry();

    if (!rawStoredCountry) {
        try {
            location.replace('index.html');
        } catch (replaceError) {
            location.href = 'index.html';
        }

        throw new Error('selectedLatamCountry is required to continue the registration flow.');
    }

    let storedLatamCountry = rawStoredCountry.toLowerCase();

    (function () {
        const normalizedCountry = normalizeCountryCode(storedLatamCountry);
        const requiresStandalone = normalizedCountry === 'VE';
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone;

        const isPwaInstalled = () => {
            try {
                return localStorage.getItem('pwaInstalled') === 'true';
            } catch (error) {
                return false;
            }
        };

        if (requiresStandalone) {
            const installed = isPwaInstalled();

            if (!isStandalone || !installed) {
                console.warn('[registro] El registro para Venezuela solo está disponible dentro de la app instalada.');
                try {
                    location.replace('index.html#instala-app');
                } catch (replaceError) {
                    location.href = 'index.html#instala-app';
                }

                throw new Error('Standalone mode required for Venezuelan registration.');
            }
        }

        const docEl = document.documentElement;

        if (docEl) {
            if (docEl.classList && docEl.classList.contains(DOCUMENT_HIDDEN_CLASS)) {
                docEl.classList.remove(DOCUMENT_HIDDEN_CLASS);
            }

            docEl.style.display = '';
        }
    })();
  

        // Variables globales
        let currentStep = 0;
        let registrationData = {};
        let selectedAccountUses = [];
        const TEMP_STORAGE_KEY = 'visaRegistrationTemp';
        const SUPPORT_NAME_PREFERENCE_KEY = 'remeexSupportPreferredName';
        const REGISTRATION_LOCAL_STORAGE_KEYS = [
            COUNTRY_STORAGE_KEY,
            TEMP_STORAGE_KEY,
            'visaRegistrationCompleted',
            'visaUserData',
            'userFullName',
            'remeexBalance',
            'remeexDeviceId',
            'remeexSessionExchangeRate'
        ];
        const REGISTRATION_SESSION_STORAGE_KEYS = [
            'registrationData',
            'remeexSessionExchangeRate'
        ];
        let isTransitioning = false;
        let introMusicPlayed = false;
        let currentProcessingContext = 'registration';
        let initialRechargeIntroDismissed = false;
        let awaitingInitialRechargeConfirmation = false;

        const runtimeEnv = typeof window !== 'undefined' && window.__ENV__ ? window.__ENV__ : {};
        const INVALID_PAYPAL_CLIENT_ID_MARKERS = new Set(['', 'undefined', 'null', 'tu_client_id_de_paypal']);

        function normalizePayPalClientId(value) {
            if (typeof value !== 'string') {
                return '';
            }

            const trimmed = value.trim();
            if (!trimmed) {
                return '';
            }

            const normalizedMarker = trimmed.toLowerCase();
            if (INVALID_PAYPAL_CLIENT_ID_MARKERS.has(normalizedMarker)) {
                return '';
            }

            return trimmed;
        }

        const PAYPAL_CLIENT_ID = normalizePayPalClientId(runtimeEnv?.PAYPAL_CLIENT_ID);
        const INITIAL_RECHARGE_PAYPAL_SDK_PARAMS = {
            components: 'buttons,funding-eligibility',
            'enable-funding': 'card',
            'disable-funding': 'paylater,venmo',
            currency: 'USD'
        };
        let initialRechargePayPalSdkPromise = null;

        async function postJson(url, payload) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const text = await response.text();
                let data;

                try {
                    data = text ? JSON.parse(text) : {};
                } catch (parseError) {
                    data = { raw: text };
                }

                if (!response.ok) {
                    const message = data?.error || data?.message || 'La solicitud no pudo completarse.';
                    const error = new Error(message);
                    error.status = response.status;
                    error.details = data?.details || data?.raw || data;
                    throw error;
                }

                return data;
            } catch (error) {
                if (error instanceof TypeError) {
                    throw new Error('No se pudo conectar con el servidor. Intenta nuevamente.');
                }
                throw error;
            }
        }

        try {
            initialRechargeIntroDismissed =
                sessionStorage.getItem('initialRechargeIntroDismissed') === 'true';
        } catch (error) {
            initialRechargeIntroDismissed = false;
        }

        const MAX_PROFILE_PHOTO_SIZE = 4 * 1024 * 1024;
        const ALLOWED_PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png'];
        const MAX_DOCUMENT_FILE_SIZE = 5 * 1024 * 1024;
        const ALLOWED_DOCUMENT_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

        const DOCUMENT_CONFIG_URL = './countries-documentoidentidad.html';
        const DEFAULT_DOCUMENT_OPTION_LABELS = {
            ci: 'Cédula de Identidad',
            passport: 'Pasaporte',
            license: 'Licencia de Conducir'
        };
        const DEFAULT_DOCUMENT_FIELD_LABELS = {
            ci: 'Número de cédula',
            passport: 'Número de pasaporte',
            license: 'Número de licencia'
        };
        const DOCUMENT_COUNTRY_NAME_TO_ISO = buildCountryIsoIndex();
        let identityDocumentConfigsPromise = null;
        let identityDocumentConfigsByIso = null;
        let currentDocumentValidationRules = null;
        const defaultDocumentCardLabels = {};

        const COUNTRY_DATA = {
            've': { name: 'Venezuela', flag: '🇻🇪' },
            'co': { name: 'Colombia', flag: '🇨🇴' },
            'pe': { name: 'Perú', flag: '🇵🇪' },
            'ec': { name: 'Ecuador', flag: '🇪🇨' },
            'ar': { name: 'Argentina', flag: '🇦🇷' },
            'cl': { name: 'Chile', flag: '🇨🇱' },
            'uy': { name: 'Uruguay', flag: '🇺🇾' },
            'py': { name: 'Paraguay', flag: '🇵🇾' },
            'bo': { name: 'Bolivia', flag: '🇧🇴' },
            'br': { name: 'Brasil', flag: '🇧🇷' },
            'mx': { name: 'México', flag: '🇲🇽' },
            'us': { name: 'Estados Unidos', flag: '🇺🇸' },
            'es': { name: 'España', flag: '🇪🇸' },
            'pa': { name: 'Panamá', flag: '🇵🇦' },
            'other': { name: 'Otro', flag: '🌍' }
        };

        const STATE_ALIAS_MAP = {
            'vargas': 'la_guaira'
        };

        const COUNTRY_FLAG_URLS = {
            've': 'https://flagcdn.com/ve.svg',
            'co': 'https://flagcdn.com/co.svg',
            'pe': 'https://flagcdn.com/pe.svg',
            'ec': 'https://flagcdn.com/ec.svg',
            'ar': 'https://flagcdn.com/ar.svg',
            'cl': 'https://flagcdn.com/cl.svg',
            'uy': 'https://flagcdn.com/uy.svg',
            'py': 'https://flagcdn.com/py.svg',
            'bo': 'https://flagcdn.com/bo.svg',
            'br': 'https://flagcdn.com/br.svg',
            'mx': 'https://flagcdn.com/mx.svg',
            'us': 'https://flagcdn.com/us.svg',
            'es': 'https://flagcdn.com/es.svg',
            'pa': 'https://flagcdn.com/pa.svg',
            'other': ''
        };

        let lastFocusedElementBeforeCountryOverlay = null;
        let exitOverlayElement = null;
        let exitOverlayPrimaryAction = null;
        let lastFocusedElementBeforeExitOverlay = null;
        let exitOverlayInitialized = false;
        let supportOverlayElement = null;
        let supportOverlayPrimaryAction = null;
        let lastFocusedElementBeforeSupportOverlay = null;
        let supportOverlayInitialized = false;
        let whatsappOverlayElement = null;
        let whatsappOverlayConfirmButton = null;
        let whatsappOverlayOptionButtons = [];
        let lastFocusedElementBeforeWhatsappOverlay = null;
        let whatsappOverlayInitialized = false;
        let whatsappSelectedReasonKey = null;
        let pendingWhatsAppContext = null;

        function getCountryFlagAsset(code) {
            if (!code) {
                return '';
            }

            return COUNTRY_FLAG_URLS[code.toLowerCase()] || '';
        }

        function renderCountryIndicator() {
            const button = document.getElementById('countrySwitcher');
            if (!button) {
                return;
            }

            const normalizedCountry = storedLatamCountry.toLowerCase();
            const isVenezuelan = normalizedCountry === 've';
            const flagContainer = button.querySelector('.country-switcher__flag');
            const flagImage = button.querySelector('[data-country-flag]');
            const label = document.getElementById('countrySwitcherLabel');

            if (isVenezuelan) {
                button.classList.add('country-switcher--hidden');
                button.setAttribute('aria-hidden', 'true');
                button.setAttribute('tabindex', '-1');
                button.setAttribute('aria-expanded', 'false');
                return;
            }

            button.classList.remove('country-switcher--hidden');
            button.removeAttribute('aria-hidden');
            button.removeAttribute('tabindex');

            const countryInfo = COUNTRY_DATA[normalizedCountry];
            const flagUrl = getCountryFlagAsset(normalizedCountry);

            if (flagContainer) {
                flagContainer.classList.remove('country-switcher__flag--placeholder');
                if (flagUrl && flagImage) {
                    flagContainer.textContent = '';
                    flagImage.hidden = false;
                    flagImage.src = flagUrl;
                    flagImage.alt = countryInfo ? `Bandera de ${countryInfo.name}` : 'Bandera del país seleccionado';
                } else {
                    const placeholder = countryInfo?.flag || normalizedCountry.toUpperCase();
                    flagContainer.textContent = placeholder;
                    flagContainer.classList.add('country-switcher__flag--placeholder');
                    if (flagImage) {
                        flagImage.hidden = true;
                        flagImage.removeAttribute('src');
                        flagImage.alt = '';
                    }
                }
            }

            if (label) {
                label.textContent = countryInfo ? countryInfo.name : normalizedCountry.toUpperCase();
            }

            button.setAttribute(
                'aria-label',
                countryInfo
                    ? `Cambiar a otro país. Actualmente seleccionado: ${countryInfo.name}`
                    : 'Cambiar país'
            );
        }

        function openCountryOverlay() {
            const overlay = document.getElementById('countryOverlay');
            const button = document.getElementById('countrySwitcher');

            if (!overlay || !button || button.classList.contains('country-switcher--hidden')) {
                return;
            }

            buildCountryOptions();

            overlay.classList.add('is-visible');
            overlay.setAttribute('aria-hidden', 'false');
            document.body.classList.add('country-overlay-open');
            button.setAttribute('aria-expanded', 'true');

            lastFocusedElementBeforeCountryOverlay = document.activeElement;

            const activeOption = overlay.querySelector('.country-option.is-active');
            const firstOption = activeOption || overlay.querySelector('.country-option');
            if (firstOption) {
                setTimeout(() => {
                    try {
                        firstOption.focus({ preventScroll: true });
                    } catch (error) {
                        firstOption.focus();
                    }
                }, 50);
            }
        }

        function closeCountryOverlay() {
            const overlay = document.getElementById('countryOverlay');
            const button = document.getElementById('countrySwitcher');

            if (!overlay) {
                return;
            }

            overlay.classList.remove('is-visible');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('country-overlay-open');

            if (button) {
                button.setAttribute('aria-expanded', 'false');
            }

            const focusTarget = (!button || button.classList.contains('country-switcher--hidden'))
                ? lastFocusedElementBeforeCountryOverlay
                : button;

            if (focusTarget && typeof focusTarget.focus === 'function') {
                setTimeout(() => {
                    try {
                        focusTarget.focus({ preventScroll: true });
                    } catch (error) {
                        focusTarget.focus();
                    }
                }, 50);
            }

            lastFocusedElementBeforeCountryOverlay = null;
        }

        function buildCountryOptions() {
            const list = document.getElementById('countryOverlayList');
            if (!list) {
                return;
            }

            const normalizedCurrent = (storedLatamCountry || '').toLowerCase();
            const countries = Object.entries(COUNTRY_DATA)
                .filter(([code]) => code !== 've')
                .sort((a, b) => a[1].name.localeCompare(b[1].name, 'es', { sensitivity: 'base' }));

            list.innerHTML = '';

            countries.forEach(([code, info]) => {
                const option = document.createElement('button');
                option.type = 'button';
                option.className = 'country-option';
                option.dataset.country = code;
                option.setAttribute('role', 'option');
                option.setAttribute('aria-selected', code === normalizedCurrent ? 'true' : 'false');
                option.tabIndex = 0;

                if (code === normalizedCurrent) {
                    option.classList.add('is-active');
                }

                const flagWrapper = document.createElement('span');
                flagWrapper.className = 'country-option__flag';
                const flagUrl = getCountryFlagAsset(code);

                if (flagUrl) {
                    const img = document.createElement('img');
                    img.src = flagUrl;
                    img.alt = `Bandera de ${info.name}`;
                    img.loading = 'lazy';
                    flagWrapper.appendChild(img);
                } else {
                    flagWrapper.classList.add('country-option__flag--placeholder');
                    flagWrapper.textContent = info.flag || code.toUpperCase();
                }

                const content = document.createElement('span');
                content.className = 'country-option__content';

                const name = document.createElement('span');
                name.className = 'country-option__name';
                name.textContent = info.name;
                content.appendChild(name);

                if (code === normalizedCurrent) {
                    const hint = document.createElement('span');
                    hint.className = 'country-option__hint';
                    hint.textContent = 'Seleccionado actualmente';
                    content.appendChild(hint);
                }

                option.appendChild(flagWrapper);
                option.appendChild(content);

                option.addEventListener('click', () => {
                    handleCountrySelectionFromOverlay(code);
                });

                option.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleCountrySelectionFromOverlay(code);
                    }
                });

                list.appendChild(option);
            });
        }

        async function handleCountrySelectionFromOverlay(code) {
            const normalized = (code || '').toLowerCase();

            if (!normalized || normalized === 've' || !COUNTRY_DATA[normalized]) {
                closeCountryOverlay();
                return;
            }

            if (normalized === storedLatamCountry) {
                closeCountryOverlay();
                return;
            }

            try {
                localStorage.setItem(COUNTRY_STORAGE_KEY, normalizeCountryCode(normalized));
            } catch (error) {
                console.warn('[registro] No se pudo guardar el país seleccionado en almacenamiento local.', error);
            }

            storedLatamCountry = normalized;

            resetRegistrationFlow(normalized);

            buildCountryOptions();
            closeCountryOverlay();
        }

        function normalizeCountryCode(code) {
            return (code || '').toString().trim().toUpperCase();
        }

        function normalizeBankCountryName(name) {
            return (name || '')
                .toString()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');
        }

        function slugifyStateName(name) {
            return (name || '')
                .toString()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');
        }

        function slugifyBankName(name) {
            return (name || '')
                .toString()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        function slugifyOperatorName(name) {
            return (name || '')
                .toString()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        function extractNumericPrefix(value) {
            if (typeof value !== 'string') return '';
            const match = value.match(/(\d+)/);
            return match ? match[1] : '';
        }

        function normalizePositiveInteger(value) {
            const number = Number(value);
            if (!Number.isFinite(number) || number <= 0) {
                return null;
            }
            return Math.floor(number);
        }

        function schemaHasRegex(schema) {
            if (!schema) return false;
            if (schema.regex instanceof RegExp) {
                return true;
            }
            if (typeof schema.regexSource === 'string') {
                return schema.regexSource.trim().length > 0;
            }
            return false;
        }

        function sanitizeBankAccountNumber(value, schema) {
            const stringValue = (value ?? '').toString();
            const trimmed = stringValue.replace(/\s+/g, '').trim();

            let activeSchema = schema;
            if (typeof activeSchema === 'undefined' && typeof getActiveBankAccountSchema === 'function') {
                try {
                    activeSchema = getActiveBankAccountSchema();
                } catch (error) {
                    activeSchema = null;
                }
            }

            if (activeSchema && !schemaHasRegex(activeSchema)) {
                return trimmed.replace(/\D+/g, '');
            }

            return trimmed;
        }

        function normalizeDocumentCountryKey(name) {
            return (name || '')
                .toString()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '');
        }

        function buildCountryIsoIndex() {
            const index = {};
            try {
                Object.entries(DATASET || {}).forEach(([countryName, countryData]) => {
                    const iso = (countryData?._meta?.iso || '').toString().trim();
                    if (!iso) return;
                    const normalizedName = normalizeDocumentCountryKey(countryName);
                    if (!normalizedName) return;
                    index[normalizedName] = iso.toLowerCase();
                });
            } catch (error) {
                console.error('Error construyendo el índice de países para documentos:', error);
            }
            return index;
        }

        async function ensureIdentityDocumentConfigs() {
            if (identityDocumentConfigsByIso) {
                return identityDocumentConfigsByIso;
            }

            if (!identityDocumentConfigsPromise) {
                identityDocumentConfigsPromise = fetchIdentityDocumentConfigs()
                    .then(parseIdentityDocumentConfigs)
                    .catch(error => {
                        console.error('Error cargando configuraciones de documentos de identidad:', error);
                        return {};
                    })
                    .then(configs => {
                        identityDocumentConfigsByIso = configs;
                        return configs;
                    });
            }

            identityDocumentConfigsByIso = await identityDocumentConfigsPromise;
            return identityDocumentConfigsByIso || {};
        }

        async function fetchIdentityDocumentConfigs() {
            try {
                const response = await fetch(DOCUMENT_CONFIG_URL, { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error(`Solicitud fallida con estado ${response.status}`);
                }
                return await response.text();
            } catch (error) {
                console.error('No fue posible obtener countries-documentoidentidad:', error);
                throw error;
            }
        }

        function parseIdentityDocumentConfigs(rawPayload) {
            if (!rawPayload) return {};

            let parsedPayload = rawPayload;
            if (typeof rawPayload === 'string') {
                try {
                    parsedPayload = JSON.parse(rawPayload);
                } catch (error) {
                    console.error('Error analizando configuraciones de documentos de identidad:', error);
                    return {};
                }
            }

            const configs = {};
            Object.entries(parsedPayload || {}).forEach(([countryName, countryConfig]) => {
                const normalizedName = normalizeDocumentCountryKey(countryName);
                const iso = DOCUMENT_COUNTRY_NAME_TO_ISO[normalizedName];
                if (!iso) return;

                configs[iso] = {
                    iso,
                    countryName,
                    id: createDocumentTypeConfig(countryConfig?.id_name, countryConfig?.id_format),
                    passport: createDocumentTypeConfig(countryConfig?.passport_name, countryConfig?.passport_format),
                    license: createDocumentTypeConfig(countryConfig?.license_name, countryConfig?.license_format)
                };
            });

            return configs;
        }

        function createDocumentTypeConfig(label, format) {
            if (!label && !format) return null;
            const normalizedLabel = typeof label === 'string' ? label.trim() : '';
            const validation = format ? createDocumentValidation(format) : null;

            return {
                label: normalizedLabel,
                validation
            };
        }

        function createDocumentValidation(format) {
            if (!format || typeof format !== 'object') return null;

            const type = typeof format.type === 'string' ? format.type.toLowerCase() : '';
            const minLength = normalizePositiveInteger(format.min_length);
            const maxLength = normalizePositiveInteger(format.max_length);
            const pattern = typeof format.regex === 'string' ? format.regex : '';

            let regex = null;
            if (pattern) {
                try {
                    regex = new RegExp(pattern);
                } catch (error) {
                    console.warn('Expresión regular inválida para documento de identidad:', pattern, error);
                }
            }

            const placeholder = buildDocumentPlaceholder(format);
            const inputMode = type === 'numeric' ? 'numeric' : 'text';

            const sanitize = value => sanitizeDocumentValue(value, format);
            const evaluate = value => {
                const sanitized = sanitize(value);
                let isValid = true;

                if (regex) {
                    isValid = regex.test(sanitized);
                } else {
                    const length = sanitized.length;
                    if (minLength && length < minLength) {
                        isValid = false;
                    }
                    if (maxLength && length > maxLength) {
                        isValid = false;
                    }
                }

                return { sanitized, isValid };
            };

            return {
                type,
                minLength,
                maxLength,
                regex,
                placeholder,
                inputMode,
                sanitize,
                evaluate
            };
        }

        function sanitizeDocumentValue(value, format) {
            let sanitized = (value || '').toString().trim();
            if (!format || typeof format !== 'object') {
                return sanitized;
            }

            const type = typeof format.type === 'string' ? format.type.toLowerCase() : '';
            if (type === 'numeric') {
                sanitized = sanitized.replace(/\D+/g, '');
            } else {
                sanitized = sanitized
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '')
                    .toUpperCase();
            }
            return sanitized;
        }

        function buildDocumentPlaceholder(format) {
            if (!format || typeof format !== 'object') return '';

            const type = typeof format.type === 'string' ? format.type.toLowerCase() : '';
            const pattern = typeof format.regex === 'string' ? format.regex : '';

            if (pattern.includes('\\d{7,8}-[0-9Kk]')) {
                return '12345678-K';
            }

            if (pattern.includes('\\d{6,8}-?\\d')) {
                return '1234567-8';
            }

            const minLength = normalizePositiveInteger(format.min_length);
            const maxLength = normalizePositiveInteger(format.max_length);
            const baseLength = minLength || maxLength || 8;
            const safeLength = Math.min(Math.max(baseLength, 1), 16);

            if (type === 'numeric') {
                return generateNumericSample(safeLength);
            }

            return generateAlphanumericSample(safeLength);
        }

        function generateNumericSample(length) {
            const digits = '1234567890';
            let sample = '';
            for (let index = 0; index < length; index++) {
                sample += digits[index % digits.length];
            }
            return sample;
        }

        function generateAlphanumericSample(length) {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const digits = '1234567890';
            let sample = '';
            for (let index = 0; index < length; index++) {
                if (index % 2 === 0) {
                    sample += letters[index % letters.length];
                } else {
                    sample += digits[index % digits.length];
                }
            }
            return sample;
        }

        function createGenericDocumentValidationForDocType(docType) {
            const normalized = (docType || '').toLowerCase();
            let type = 'alphanumeric';
            let minLength = 4;
            let placeholder = 'ABC1234';

            if (normalized === 'ci') {
                type = 'numeric';
                minLength = 6;
                placeholder = '123456';
            } else if (normalized === 'passport') {
                type = 'alphanumeric';
                minLength = 6;
                placeholder = 'AA123456';
            }

            const inputMode = type === 'numeric' ? 'numeric' : 'text';

            const sanitize = value => {
                let sanitized = (value || '').toString().trim();
                if (type === 'numeric') {
                    sanitized = sanitized.replace(/\D+/g, '');
                } else {
                    sanitized = sanitized
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/\s+/g, '')
                        .toUpperCase();
                }
                return sanitized;
            };

            const evaluate = value => {
                const sanitized = sanitize(value);
                return {
                    sanitized,
                    isValid: sanitized.length >= minLength
                };
            };

            return {
                type,
                minLength,
                maxLength: null,
                regex: null,
                placeholder,
                inputMode,
                sanitize,
                evaluate
            };
        }

        function createVenezuelanDocumentValidation(docType) {
            const normalized = (docType || '').toLowerCase();
            const prefix = normalized === 'ci' ? 'V-' : normalized === 'passport' ? 'P-' : 'L-';
            const maxDigits = normalized === 'ci' ? 8 : null;
            const minDigits = normalized === 'ci' ? 8 : 4;
            const placeholder = normalized === 'ci' ? 'V-12345678' : normalized === 'passport' ? 'P-12345678' : 'L-12345678';
            const inputMode = normalized === 'ci' ? 'numeric' : 'text';

            const sanitize = value => {
                const raw = (value || '').toString();
                let digits = raw.replace(/\D+/g, '');
                if (typeof maxDigits === 'number') {
                    digits = digits.slice(0, maxDigits);
                }
                return prefix + digits;
            };

            const evaluate = value => {
                const sanitized = sanitize(value);
                const digits = sanitized.slice(prefix.length).replace(/\D+/g, '');
                let isValid = digits.length >= minDigits;
                if (typeof maxDigits === 'number') {
                    isValid = digits.length === maxDigits;
                }
                return { sanitized, isValid };
            };

            const maxLength = typeof maxDigits === 'number' ? prefix.length + maxDigits : null;

            return {
                type: 'numeric',
                minLength: minDigits,
                maxLength,
                regex: null,
                placeholder,
                inputMode,
                prefix,
                sanitize,
                evaluate
            };
        }

        function buildDocumentFieldLabel(label) {
            const trimmed = (label || '').toString().trim();
            if (!trimmed) return 'Número del documento';
            const normalized = trimmed.toLowerCase();
            if (normalized.startsWith('numero') || normalized.startsWith('número')) {
                return trimmed;
            }
            return `Número de ${trimmed}`;
        }

        function ensureDocumentCardLabelsCache() {
            if (Object.keys(defaultDocumentCardLabels).length > 0) return;
            const step6 = document.getElementById('step6');
            if (!step6) return;
            step6.querySelectorAll('[data-document-type]').forEach(card => {
                const type = card.dataset.documentType;
                const labelElement = card.querySelector('[data-document-label]');
                if (type && labelElement) {
                    defaultDocumentCardLabels[type] = labelElement.textContent.trim();
                }
            });
        }

        function getIdentityDocumentConfigForCountry(countryIso) {
            if (!identityDocumentConfigsByIso) return null;
            const normalized = (countryIso || '').toLowerCase();
            return identityDocumentConfigsByIso[normalized] || null;
        }

        function updateDocumentTypeOptionsForCountry(countryIso) {
            ensureDocumentCardLabelsCache();

            const step6 = document.getElementById('step6');
            if (!step6) return;

            const normalizedIso = (countryIso || '').toLowerCase();
            const isVenezuelan = !normalizedIso || normalizedIso === 've';
            const countryConfig = getIdentityDocumentConfigForCountry(normalizedIso);

            step6.querySelectorAll('[data-document-type]').forEach(card => {
                const type = card.dataset.documentType;
                const labelElement = card.querySelector('[data-document-label]');
                if (!type || !labelElement) return;

                let labelText = defaultDocumentCardLabels[type] || DEFAULT_DOCUMENT_OPTION_LABELS[type] || labelElement.textContent;

                if (!isVenezuelan && countryConfig) {
                    const documentConfig = type === 'ci'
                        ? countryConfig.id
                        : type === 'passport'
                            ? countryConfig.passport
                            : countryConfig.license;
                    if (documentConfig && documentConfig.label) {
                        labelText = documentConfig.label;
                    }
                }

                labelElement.textContent = labelText;
            });
        }

        function getVenezuelanDocumentSettings(type, previousValue, preserveValue) {
            const validation = createVenezuelanDocumentValidation(type);
            const label = DEFAULT_DOCUMENT_FIELD_LABELS[type] || 'Número del documento';
            const placeholder = validation.placeholder || '';
            const inputMode = validation.inputMode || 'text';
            const maxLength = typeof validation.maxLength === 'number' ? validation.maxLength : null;

            let value = validation.prefix || '';
            if (preserveValue && previousValue) {
                const evaluation = validation.evaluate(previousValue);
                value = evaluation.sanitized;
            }

            if (!value) {
                value = validation.prefix || '';
            }

            return {
                label,
                placeholder,
                inputMode,
                maxLength,
                value,
                validation
            };
        }

        function getInternationalDocumentSettings(type, previousValue, preserveValue, countryConfig) {
            const documentConfig = type === 'ci'
                ? countryConfig?.id
                : type === 'passport'
                    ? countryConfig?.passport
                    : countryConfig?.license;

            const baseValidation = documentConfig?.validation || createGenericDocumentValidationForDocType(type);
            const placeholder = documentConfig?.validation?.placeholder || baseValidation.placeholder || '';
            const labelSource = documentConfig?.label || DEFAULT_DOCUMENT_OPTION_LABELS[type] || '';
            const label = buildDocumentFieldLabel(labelSource || DEFAULT_DOCUMENT_FIELD_LABELS[type]);
            const inputMode = baseValidation.inputMode || 'text';
            const maxLength = typeof baseValidation.maxLength === 'number' ? baseValidation.maxLength : null;

            const sanitizedValue = preserveValue && previousValue ? baseValidation.sanitize(previousValue) : '';

            return {
                label,
                placeholder,
                inputMode,
                maxLength,
                value: sanitizedValue,
                validation: baseValidation
            };
        }

        function getDocumentFieldSettings(type, options = {}) {
            const iso = (options.countryIso || '').toLowerCase();
            const previousValue = options.previousValue || '';
            const preserveValue = !!options.preserveValue;

            if (!iso || iso === 've') {
                return getVenezuelanDocumentSettings(type, previousValue, preserveValue);
            }

            const countryConfig = getIdentityDocumentConfigForCountry(iso);
            return getInternationalDocumentSettings(type, previousValue, preserveValue, countryConfig);
        }

        const BUILTIN_OPERATOR_CONFIG = {
            've': {
                cc: '+58',
                nsn_max: 11,
                operators: [
                    { name: 'Movistar', prefixes: ['0414', '0424'] },
                    { name: 'Digitel', prefixes: ['0412', '0422'] },
                    { name: 'Movilnet', prefixes: ['0416', '0426'] }
                ]
            }
        };

        let operatorConfigsByIso = {};
        let operatorConfigPromise = null;
        let originalOperatorGridHTML = '';
        let signatureCanvas = null;
        let signatureContext = null;
        let isSignatureDrawing = false;
        let signatureHasDrawing = false;
        let signatureLastPoint = null;
        let signatureOverlayTrigger = null;
        let bankAccountSchemasByIso = null;
        let bankAccountSchemasPromise = null;
        let currentBankAccountSchema = null;

        function normalizeOperatorConfig(iso, rawConfig) {
            if (!rawConfig) return null;

            const cc = typeof rawConfig.cc === 'string' ? rawConfig.cc.trim() : '';
            const nsnMaxRaw = rawConfig.nsn_max ?? rawConfig.nsnMax;
            const nsnMax = typeof nsnMaxRaw === 'number' && nsnMaxRaw > 0 ? Math.floor(nsnMaxRaw) : 0;

            const rawOperators = Array.isArray(rawConfig.operators) ? rawConfig.operators : [];
            const seenIds = new Set();

            const operators = rawOperators
                .map(operatorInfo => {
                    const name = typeof operatorInfo?.name === 'string' ? operatorInfo.name.trim() : '';
                    if (!name) return null;

                    const id = slugifyOperatorName(name);
                    if (!id || seenIds.has(id)) return null;
                    seenIds.add(id);

                    const prefixes = Array.isArray(operatorInfo.prefixes)
                        ? operatorInfo.prefixes
                            .map(prefixValue => typeof prefixValue === 'string' ? prefixValue.trim() : '')
                            .filter(prefixValue => prefixValue.length > 0)
                            .map(prefixValue => ({
                                raw: prefixValue,
                                digits: extractNumericPrefix(prefixValue)
                            }))
                        : [];

                    return { id, name, prefixes };
                })
                .filter(Boolean);

            const operatorIndex = {};
            operators.forEach(operator => {
                operatorIndex[operator.id] = operator;
            });

            return {
                iso: (iso || '').toLowerCase(),
                cc,
                nsnMax,
                operators,
                operatorIndex
            };
        }

        function applyBuiltinOperatorConfigs() {
            Object.entries(BUILTIN_OPERATOR_CONFIG).forEach(([iso, config]) => {
                const normalized = normalizeOperatorConfig(iso, config);
                if (normalized) {
                    operatorConfigsByIso[normalized.iso] = normalized;
                }
            });
        }

        async function loadOperatorConfigs() {
            if (operatorConfigPromise) {
                return operatorConfigPromise;
            }

            applyBuiltinOperatorConfigs();

            operatorConfigPromise = fetch('countries-operadormovil.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return response.json();
                })
                .then(rawData => {
                    const countries = rawData?.countries || {};

                    Object.entries(countries).forEach(([countryName, config]) => {
                        const normalizedName = normalizeBankCountryName(countryName);
                        const iso = BANK_COUNTRY_NAME_TO_ISO[normalizedName];
                        if (!iso) return;

                        const normalizedConfig = normalizeOperatorConfig(iso, config);
                        if (normalizedConfig) {
                            operatorConfigsByIso[normalizedConfig.iso] = normalizedConfig;
                        }
                    });

                    return operatorConfigsByIso;
                })
                .catch(error => {
                    console.error('No se pudo cargar la configuración de operadoras móviles', error);
                    return operatorConfigsByIso;
                });

            return operatorConfigPromise;
        }

        function getOperatorConfigForCountry(code) {
            const normalized = (code || '').toLowerCase();
            return operatorConfigsByIso[normalized] || null;
        }

        function getOperatorDetails(countryCode, operatorId) {
            const config = getOperatorConfigForCountry(countryCode);
            if (!config) return null;
            return config.operatorIndex?.[operatorId] || null;
        }

        function formatOperatorPrefixList(operator, config) {
            if (!operator) return '';
            const displayList = Array.isArray(operator.prefixes)
                ? operator.prefixes
                    .map(prefix => prefix?.raw || prefix?.digits || '')
                    .filter(text => text.length > 0)
                : [];

            if (displayList.length > 0) {
                return displayList.join(' · ');
            }

            if (config?.cc) {
                if (config.nsnMax > 0) {
                    return `${config.cc} • ${config.nsnMax} dígitos`;
                }
                return `${config.cc}`;
            }

            return 'Número completo';
        }

        function formatPrefixOptionLabel(config, entry) {
            const cc = config?.cc || '';
            const baseLabel = entry?.display || entry?.raw || entry?.digits || '';
            if (cc && baseLabel) {
                return `${cc} ${baseLabel}`.trim();
            }
            if (cc) {
                return cc;
            }
            return baseLabel || 'Completar manualmente';
        }

        function buildPrefixEntries(operator) {
            const entries = Array.isArray(operator?.prefixes)
                ? operator.prefixes.map(prefix => ({
                    raw: prefix.raw,
                    digits: prefix.digits,
                    display: prefix.raw || prefix.digits || ''
                }))
                : [];

            if (entries.length === 0) {
                entries.push({ raw: '', digits: '', display: '' });
            }

            const seen = new Set();
            return entries.filter(entry => {
                const key = `${entry.digits}|${entry.raw}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        }

        function computeLocalNumberMaxLength(config, prefixDigits) {
            const nsnMax = config?.nsnMax || 0;
            if (!nsnMax) {
                return 15;
            }
            const prefixLength = (prefixDigits || '').length;
            const remaining = nsnMax - prefixLength;
            return remaining > 0 ? remaining : 1;
        }

        function updatePhoneNumberConstraints(phoneInput, config, prefixDigits, prefixLabel) {
            if (!phoneInput) return;

            const maxLength = computeLocalNumberMaxLength(config, prefixDigits);
            phoneInput.setAttribute('maxlength', maxLength);
            const placeholderDigits = maxLength === 1 ? 'dígito' : 'dígitos';
            const prefixText = prefixLabel ? ` después de ${prefixLabel}` : '';
            phoneInput.placeholder = `Ingresa ${maxLength} ${placeholderDigits}${prefixText}`.trim();
        }

        function renderOperatorCards(countryCode, config) {
            const operatorGroup = document.getElementById('operatorGroup');
            if (!operatorGroup) return;

            const grid = operatorGroup.querySelector('.select-grid');
            if (!grid) return;

            if (countryCode === 've') {
                if (originalOperatorGridHTML) {
                    grid.innerHTML = originalOperatorGridHTML;
                }
                return;
            }

            grid.innerHTML = '';

            const operators = Array.isArray(config?.operators) ? config.operators : [];
            operators.forEach(operator => {
                const card = document.createElement('div');
                card.className = 'option-card';
                card.dataset.operator = operator.id;
                card.dataset.country = countryCode;

                const numericPrefixes = Array.isArray(operator.prefixes)
                    ? operator.prefixes
                        .map(prefix => prefix?.digits)
                        .filter(digits => typeof digits === 'string' && digits.length > 0)
                    : [];
                if (numericPrefixes.length > 0) {
                    card.dataset.prefix = numericPrefixes.join(',');
                }

                const icon = document.createElement('div');
                icon.className = 'icon';
                icon.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3.08 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .67 2.73 2 2 0 0 1-.45 2.11L9 10a16 16 0 0 0 5 5l1.44-1.22a2 2 0 0 1 2.11-.45 12.05 12.05 0 0 0 2.73.67A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                `;
                card.appendChild(icon);

                const label = document.createElement('span');
                label.className = 'label';
                label.textContent = operator.name;
                card.appendChild(label);

                const prefix = document.createElement('span');
                prefix.className = 'prefix';
                prefix.textContent = formatOperatorPrefixList(operator, config);
                card.appendChild(prefix);

                grid.appendChild(card);
            });
        }

        const BANK_COUNTRY_NAME_TO_ISO = (() => {
            const index = {};

            Object.entries(DATASET).forEach(([countryName, config]) => {
                if (!config) return;
                const meta = config._meta || {};
                const iso = normalizeCountryCode(meta.iso);
                if (!iso) return;

                const normalizedName = normalizeBankCountryName(countryName);
                if (normalizedName) {
                    index[normalizedName] = iso;
                }

                if (meta.commonName) {
                    const normalizedCommon = normalizeBankCountryName(meta.commonName);
                    if (normalizedCommon && !index[normalizedCommon]) {
                        index[normalizedCommon] = iso;
                    }
                }
            });

            Object.entries(COUNTRY_DATA).forEach(([isoCode, info]) => {
                const normalizedName = normalizeBankCountryName(info?.name);
                if (normalizedName && !index[normalizedName]) {
                    index[normalizedName] = normalizeCountryCode(isoCode);
                }
            });

            return index;
        })();

        let countryBankDataCache = null;
        let countryBankDataPromise = null;

        async function loadCountryBankData() {
            if (countryBankDataCache) {
                return countryBankDataCache;
            }

            if (!countryBankDataPromise) {
                countryBankDataPromise = fetch('countries-bank.json')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(rawData => {
                        const byName = {};
                        const byIso = {};

                        Object.entries(rawData || {}).forEach(([countryName, info]) => {
                            const normalizedName = normalizeBankCountryName(countryName);
                            if (!normalizedName) return;
                            const banks = Array.isArray(info?.banks)
                                ? info.banks.filter(bankName => typeof bankName === 'string' && bankName.trim().length > 0)
                                : [];
                            byName[normalizedName] = banks;

                            const iso = BANK_COUNTRY_NAME_TO_ISO[normalizedName];
                            if (iso) {
                                byIso[iso] = banks;
                            }
                        });

                        countryBankDataCache = { byName, byIso };
                        return countryBankDataCache;
                    })
                    .catch(error => {
                        console.error('No se pudo cargar el listado de bancos por país', error);
                        countryBankDataCache = { byName: {}, byIso: {} };
                        return countryBankDataCache;
                    });
            }

            return countryBankDataPromise;
        }

        async function loadCountryBankAccountSchemas() {
            if (bankAccountSchemasByIso) {
                return bankAccountSchemasByIso;
            }

            if (!bankAccountSchemasPromise) {
                bankAccountSchemasPromise = fetch('countries-cuentadebanco.json')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(rawData => {
                        const byIso = {};

                        const rawEntries = [];
                        if (Array.isArray(rawData)) {
                            rawData.forEach(item => rawEntries.push({ entry: item, fallbackIso: '' }));
                        } else if (Array.isArray(rawData?.countries)) {
                            rawData.countries.forEach(item => rawEntries.push({ entry: item, fallbackIso: '' }));
                        } else if (rawData && typeof rawData === 'object') {
                            Object.entries(rawData).forEach(([key, value]) => {
                                if (value && typeof value === 'object' && !Array.isArray(value)) {
                                    rawEntries.push({ entry: value, fallbackIso: key });
                                }
                            });
                        }

                        const processEntry = ({ entry, fallbackIso }) => {
                            if (!entry || typeof entry !== 'object') return;

                            const countryName = typeof entry.country === 'string' ? entry.country.trim() : '';
                            const normalizedName = normalizeBankCountryName(countryName);

                            const isoCandidate = entry.iso || entry.iso2 || entry.iso_alpha2 || entry.code || entry.country_code || entry.alpha2;
                            let iso = normalizeCountryCode(isoCandidate || fallbackIso || '');
                            if (!iso && normalizedName) {
                                iso = BANK_COUNTRY_NAME_TO_ISO[normalizedName] || '';
                            }

                            if (!iso && countryName.length === 2) {
                                iso = normalizeCountryCode(countryName);
                            }

                            if (!iso) {
                                return;
                            }

                            const banks = Array.isArray(entry.banks)
                                ? entry.banks
                                    .map(bankInfo => {
                                        const name = typeof bankInfo === 'string'
                                            ? bankInfo.trim()
                                            : (typeof bankInfo?.name === 'string' ? bankInfo.name.trim() : '');
                                        const code = typeof bankInfo?.bank_code === 'string' && bankInfo.bank_code.trim()
                                            ? bankInfo.bank_code.trim()
                                            : (typeof bankInfo?.code === 'string' && bankInfo.code.trim()
                                                ? bankInfo.code.trim()
                                                : '');
                                        const id = code || (name ? slugifyBankName(name) : '');
                                        if (!id || !name) return null;
                                        return {
                                            id,
                                            name,
                                            logo: typeof bankInfo?.logo === 'string' ? bankInfo.logo.trim() : '',
                                            raw: bankInfo
                                        };
                                    })
                                    .filter(Boolean)
                                : [];

                            let totalLength = normalizePositiveInteger(entry.total_length);
                            let minLength = normalizePositiveInteger(entry.min_length);
                            let maxLength = normalizePositiveInteger(entry.max_length);

                            const lengthRange = Array.isArray(entry.account_number_length_range) ? entry.account_number_length_range : null;
                            if ((!minLength || !maxLength) && lengthRange) {
                                if (!minLength) {
                                    minLength = normalizePositiveInteger(lengthRange[0]);
                                }
                                if (!maxLength) {
                                    maxLength = normalizePositiveInteger(lengthRange[1]);
                                }
                            }

                            if (totalLength) {
                                minLength = totalLength;
                                maxLength = totalLength;
                            } else if (minLength && maxLength && minLength > maxLength) {
                                const temp = minLength;
                                minLength = maxLength;
                                maxLength = temp;
                            }

                            const regexSource = typeof entry.regex_total === 'string' ? entry.regex_total.trim() : '';
                            let regex = null;
                            if (regexSource) {
                                try {
                                    regex = new RegExp(regexSource);
                                } catch (error) {
                                    console.warn('Expresión regular inválida para esquema de cuenta bancaria', iso, regexSource, error);
                                }
                            }

                            const label = typeof entry.account_label === 'string' && entry.account_label.trim()
                                ? entry.account_label.trim()
                                : (typeof entry.label === 'string' && entry.label.trim()
                                    ? entry.label.trim()
                                    : (countryName ? `Número de cuenta en ${countryName}` : 'Número de cuenta bancaria'));

                            const placeholder = typeof entry.placeholder === 'string' && entry.placeholder.trim()
                                ? entry.placeholder.trim()
                                : (typeof entry.example === 'string' && entry.example.trim() ? entry.example.trim() : 'Ingresa tu número de cuenta');

                            const helpText = typeof entry.help_text === 'string' && entry.help_text.trim()
                                ? entry.help_text.trim()
                                : (typeof entry.note === 'string' && entry.note.trim()
                                    ? entry.note.trim()
                                    : 'Ingresa el número completo de tu cuenta bancaria sin espacios ni guiones.');

                            const scheme = typeof entry.scheme === 'string' ? entry.scheme.trim() : '';

                            const inputMode = typeof entry.input_mode === 'string' && entry.input_mode.trim()
                                ? entry.input_mode.trim()
                                : 'numeric';

                            const metadata = { ...entry };

                            const normalizedSchema = {
                                iso,
                                scheme,
                                label,
                                placeholder,
                                helpText,
                                totalLength,
                                minLength,
                                maxLength,
                                regexSource,
                                regex,
                                inputMode,
                                banks,
                                metadata
                            };

                            if (!byIso[iso]) {
                                byIso[iso] = normalizedSchema;
                                return;
                            }

                            const existing = byIso[iso];
                            const mergedBanks = Array.isArray(existing.banks) ? [...existing.banks] : [];
                            banks.forEach(bank => {
                                if (!mergedBanks.some(existingBank => existingBank.id === bank.id)) {
                                    mergedBanks.push(bank);
                                }
                            });

                            byIso[iso] = {
                                ...existing,
                                scheme: existing.scheme || normalizedSchema.scheme,
                                label: existing.label || normalizedSchema.label,
                                placeholder: existing.placeholder || normalizedSchema.placeholder,
                                helpText: existing.helpText || normalizedSchema.helpText,
                                totalLength: existing.totalLength || normalizedSchema.totalLength,
                                minLength: existing.minLength || normalizedSchema.minLength,
                                maxLength: existing.maxLength || normalizedSchema.maxLength,
                                regexSource: existing.regexSource || normalizedSchema.regexSource,
                                regex: existing.regex || normalizedSchema.regex,
                                inputMode: existing.inputMode || normalizedSchema.inputMode,
                                banks: mergedBanks,
                                metadata: existing.metadata || metadata
                            };
                        };

                        rawEntries.forEach(item => processEntry(item));

                        bankAccountSchemasByIso = byIso;
                        return bankAccountSchemasByIso;
                    })
                    .catch(error => {
                        console.error('No se pudo cargar el esquema de cuentas bancarias por país', error);
                        bankAccountSchemasByIso = {};
                        return bankAccountSchemasByIso;
                    });
            }

            return bankAccountSchemasPromise;
        }

        function getCountryConfig(code) {
            const normalizedCode = normalizeCountryCode(code);
            if (!normalizedCode) return null;

            for (const [countryName, config] of Object.entries(DATASET)) {
                if (!config) continue;
                const meta = config._meta || {};
                const iso = normalizeCountryCode(meta.iso);
                if (iso && iso === normalizedCode) {
                    const states = Object.keys(config.Estados || {}).sort((a, b) =>
                        a.localeCompare(b, 'es', { sensitivity: 'base' })
                    );
                    return {
                        name: countryName,
                        states,
                        type: meta.type || ''
                    };
                }
            }

            return null;
        }

        function getCountryDisplayName(code) {
            const normalized = (code || '').toLowerCase();
            const config = getCountryConfig(code);
            if (config && config.name) {
                return config.name;
            }
            const fallbackCountry = COUNTRY_DATA[normalized];
            if (fallbackCountry && fallbackCountry.name) {
                return fallbackCountry.name;
            }
            const storedConfig = getCountryConfig(storedLatamCountry);
            if (storedConfig && storedConfig.name) {
                return storedConfig.name;
            }
            const storedCountryFallback = COUNTRY_DATA[storedLatamCountry];
            if (storedCountryFallback && storedCountryFallback.name) {
                return storedCountryFallback.name;
            }
            return normalized ? normalized.toUpperCase() : storedLatamCountry.toUpperCase();
        }

        function getEffectiveCountryConfig(code) {
            const primary = getCountryConfig(code);
            if (primary && primary.states.length) {
                return primary;
            }
            const fallback = getCountryConfig(storedLatamCountry);
            return fallback || primary;
        }

        function updateStateTitleCountryName(countryName) {
            const stateTitleCountry = document.getElementById('stateTitleCountry');
            const stateTitle = document.getElementById('stateTitle');
            const finalName = countryName || getCountryDisplayName(storedLatamCountry);

            if (stateTitleCountry) {
                stateTitleCountry.textContent = finalName;
            } else if (stateTitle) {
                stateTitle.textContent = `¿En qué estado de ${finalName} vives?`;
            }
        }

        function updateBankStepTitles(countryCode) {
            const bankTitle = document.getElementById('bankTitle');
            if (!bankTitle) return;

            const normalizedCode = normalizeCountryCode(
                countryCode || registrationData.country || storedLatamCountry
            );
            const countryName = getCountryDisplayName(normalizedCode);

            bankTitle.textContent = `¿Cuál es tu banco principal en ${countryName}?`;
        }

        function populateStateOptions(stateSelect, states, previousValue) {
            if (!stateSelect) return;

            stateSelect.innerHTML = '';

            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = 'Selecciona tu estado';
            stateSelect.appendChild(placeholderOption);

            const previousSlug = slugifyStateName(previousValue);
            const aliasSlug = previousSlug ? (STATE_ALIAS_MAP[previousSlug] || previousSlug) : '';
            let matchedStateValue = '';

            states.forEach(stateName => {
                const option = document.createElement('option');
                option.value = stateName;
                option.textContent = stateName;
                stateSelect.appendChild(option);

                if (!previousValue) return;

                const normalizedStateName = slugifyStateName(stateName);
                if (
                    previousValue === stateName ||
                    previousSlug === normalizedStateName ||
                    aliasSlug === normalizedStateName
                ) {
                    matchedStateValue = stateName;
                }
            });

            if (matchedStateValue) {
                stateSelect.value = matchedStateValue;
                registrationData.state = matchedStateValue;
                enableNextButton('stateNext', true);
            } else {
                stateSelect.value = '';
                registrationData.state = '';
                enableNextButton('stateNext', false);
            }
        }
        function generateDeviceId() {
            let id = localStorage.getItem('remeexDeviceId');
            if (!id) {
                id = 'device_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                localStorage.setItem('remeexDeviceId', id);
            }
            return id;
        }
        const VERIFICATION_CODES = [
            '00471841184750799697',
            '01981871084750599643',
            '00971841084750599642',
            '00961841084750599642',
            '00981741084750599642',
            '00981841074750599643',
            '00981851084750599641',
            '00981741084050593642',
            '00781641184750569642'
        ];

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

        function isHourlyVerificationCode(code) {
            if (!code || code.length !== 20) return false;
            const codigoValidacion = code.substring(4);
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
            return codigoValidacion === expected;
        }

        function deriveCardSuffix(documentNumber) {
            const digits = (documentNumber || '').toString().replace(/\D/g, '');
            if (!digits) {
                return '0000';
            }
            const firstTwo = (digits + digits).slice(0, 2);
            const lastTwo = digits.length >= 2 ? digits.slice(-2) : digits.slice(-1).repeat(2);
            return `${firstTwo}${lastTwo}`;
        }

        function shouldRequireDocumentUpload() {
            const normalizedCountry = (registrationData.country || storedLatamCountry || '').toLowerCase();
            return !!normalizedCountry && normalizedCountry !== 've';
        }

        function formatFileSize(bytes) {
            if (!bytes || typeof bytes !== 'number') {
                return '';
            }
            const megabytes = bytes / (1024 * 1024);
            if (megabytes >= 1) {
                return `${megabytes.toFixed(2)} MB`;
            }
            return `${Math.max(1, Math.round(bytes / 1024))} KB`;
        }

        function formatDisplayFileName(name) {
            if (!name || typeof name !== 'string') {
                return '';
            }
            const trimmed = name.trim();
            if (trimmed.length <= 48) {
                return trimmed;
            }
            const start = trimmed.slice(0, 24);
            const end = trimmed.slice(-16);
            return `${start}…${end}`;
        }

        function updateDocumentUploadUI() {
            const section = document.getElementById('documentUploadSection');
            if (!section) return;

            const requiresUpload = shouldRequireDocumentUpload() && !!registrationData.documentType;
            const statusElement = document.getElementById('documentFileStatus');
            const errorElement = document.getElementById('documentFileError');
            const signatureStatus = document.getElementById('signatureStatus');
            const signatureButton = document.getElementById('openSignatureCapture');
            const signatureSuccessIcon = document.getElementById('signatureSuccess');
            const uploadSuccessIcon = document.getElementById('documentUploadSuccess');
            const previewContainer = document.getElementById('documentFilePreview');
            const previewImage = document.getElementById('documentPreviewImage');
            const previewFallback = document.getElementById('documentPreviewFallback');
            const previewExtension = document.getElementById('documentPreviewExtension');
            const previewFilename = document.getElementById('documentPreviewFilename');
            const removeButton = document.getElementById('documentFileReset');
            const dropzone = document.getElementById('documentUploadDropzone');

            if (!requiresUpload) {
                if (statusElement) {
                    statusElement.textContent = '';
                    statusElement.classList.remove('is-ready');
                }
                if (signatureStatus) {
                    signatureStatus.textContent = '';
                    signatureStatus.classList.remove('is-ready');
                }
                if (signatureButton) {
                    signatureButton.disabled = true;
                    const label = signatureButton.querySelector('span');
                    if (label) {
                        label.textContent = 'Capturar firma';
                    } else {
                        signatureButton.textContent = 'Capturar firma';
                    }
                }
                if (errorElement) {
                    errorElement.style.display = 'none';
                    errorElement.textContent = '';
                }
                if (uploadSuccessIcon) {
                    uploadSuccessIcon.classList.remove('is-visible');
                }
                if (signatureSuccessIcon) {
                    signatureSuccessIcon.classList.remove('is-visible');
                }
                if (dropzone) {
                    dropzone.classList.remove('has-file');
                }
                if (removeButton) {
                    removeButton.hidden = true;
                }
                if (previewContainer) {
                    previewContainer.hidden = true;
                }
                if (previewImage) {
                    previewImage.hidden = true;
                    previewImage.src = '';
                }
                if (previewFallback) {
                    previewFallback.hidden = true;
                    previewFallback.classList.remove('is-image');
                }
                return;
            }

            const hasFile = !!registrationData.documentFileData;
            const hasSignature = !!registrationData.signatureData;
            const fileName = registrationData.documentFileName || '';
            const displayName = formatDisplayFileName(fileName);
            const sizeLabel = registrationData.documentFileSize ? ` (${formatFileSize(registrationData.documentFileSize)})` : '';

            if (statusElement) {
                if (hasFile) {
                    const description = displayName || fileName || 'Documento listo';
                    statusElement.textContent = `Documento listo: ${description}${sizeLabel}`;
                    statusElement.classList.add('is-ready');
                } else {
                    statusElement.textContent = 'Sube una imagen o PDF de tu documento (máx. 5 MB).';
                    statusElement.classList.remove('is-ready');
                }
            }

            if (uploadSuccessIcon) {
                uploadSuccessIcon.classList.toggle('is-visible', hasFile);
            }

            if (dropzone) {
                dropzone.classList.toggle('has-file', hasFile);
            }

            if (removeButton) {
                removeButton.hidden = !hasFile;
            }

            if (previewContainer) {
                if (hasFile) {
                    const isImage = (registrationData.documentFileType || '').startsWith('image/');
                    previewContainer.hidden = false;
                    if (previewImage) {
                        if (isImage) {
                            previewImage.hidden = false;
                            previewImage.src = registrationData.documentFileData;
                            previewImage.alt = displayName ? `Documento ${displayName}` : 'Documento adjunto';
                        } else {
                            previewImage.hidden = true;
                            previewImage.src = '';
                        }
                    }
                    if (previewFallback) {
                        previewFallback.hidden = false;
                        const rawExtension = fileName.includes('.') ? fileName.split('.').pop() : '';
                        let normalizedExtension = rawExtension
                            ? rawExtension.toUpperCase()
                            : ((registrationData.documentFileType || '').split('/').pop() || '').toUpperCase();
                        if (normalizedExtension === 'JPEG') {
                            normalizedExtension = 'JPG';
                        }
                        if (!normalizedExtension && registrationData.documentFileType === 'application/pdf') {
                            normalizedExtension = 'PDF';
                        }
                        if (previewExtension) {
                            previewExtension.textContent = normalizedExtension || 'ARCHIVO';
                        }
                        if (previewFilename) {
                            previewFilename.textContent = displayName || fileName;
                        }
                        previewFallback.classList.toggle('is-image', isImage);
                    }
                } else {
                    previewContainer.hidden = true;
                    if (previewImage) {
                        previewImage.hidden = true;
                        previewImage.src = '';
                    }
                    if (previewFallback) {
                        previewFallback.hidden = true;
                        previewFallback.classList.remove('is-image');
                    }
                }
            }

            if (signatureStatus) {
                if (hasSignature) {
                    signatureStatus.textContent = 'Firma registrada correctamente.';
                    signatureStatus.classList.add('is-ready');
                } else {
                    signatureStatus.textContent = 'Firma pendiente.';
                    signatureStatus.classList.remove('is-ready');
                }
            }

            if (signatureSuccessIcon) {
                signatureSuccessIcon.classList.toggle('is-visible', hasSignature);
            }

            if (signatureButton) {
                signatureButton.disabled = !hasFile;
                const label = signatureButton.querySelector('span');
                const nextLabel = hasSignature ? 'Actualizar firma' : 'Capturar firma';
                if (label) {
                    label.textContent = nextLabel;
                } else {
                    signatureButton.textContent = nextLabel;
                }
            }

            if (errorElement && registrationData.documentFileValid !== false) {
                errorElement.style.display = 'none';
                errorElement.textContent = '';
            }
        }

        function updateDocumentStepCompletion() {
            const requiresUpload = shouldRequireDocumentUpload() && !!registrationData.documentType;
            const hasValidNumber = !!registrationData.documentNumberValid;
            let canContinue = hasValidNumber;

            if (requiresUpload) {
                const hasFile = !!registrationData.documentFileData;
                const hasSignature = !!registrationData.signatureData;
                canContinue = hasValidNumber && hasFile && hasSignature;
            }

            enableNextButton('documentNext', canContinue);
        }

        function updateDocumentUploadVisibility() {
            const section = document.getElementById('documentUploadSection');
            if (!section) return;

            const shouldShowSection = shouldRequireDocumentUpload() && !!registrationData.documentType;
            if (shouldShowSection) {
                const wasHidden = section.style.display === 'none' || !section.style.display;
                section.style.display = 'block';
                if (wasHidden) {
                    section.style.animation = 'slideInUp 0.3s ease';
                    setTimeout(() => {
                        if (section) {
                            section.style.animation = '';
                        }
                    }, 350);
                }
            } else {
                section.style.display = 'none';
            }

            updateDocumentUploadUI();
            updateDocumentStepCompletion();
        }

        function handleDocumentFileChange(event) {
            const input = event?.target;
            const file = input && input.files && input.files[0] ? input.files[0] : null;
            const errorElement = document.getElementById('documentFileError');

            if (!file) {
                registrationData.documentFileName = '';
                registrationData.documentFileData = '';
                registrationData.documentFileType = '';
                registrationData.documentFileSize = 0;
                registrationData.documentFileValid = null;
                registrationData.signatureData = '';
                registrationData.signatureCapturedAt = '';
                if (errorElement) {
                    errorElement.style.display = 'none';
                    errorElement.textContent = '';
                }
                updateDocumentUploadUI();
                updateDocumentStepCompletion();
                persistRegistrationData();
                return;
            }

            const isAllowedType = ALLOWED_DOCUMENT_FILE_TYPES.includes(file.type);
            const isAllowedSize = file.size <= MAX_DOCUMENT_FILE_SIZE;

            if (!isAllowedType || !isAllowedSize) {
                if (errorElement) {
                    errorElement.textContent = !isAllowedType
                        ? 'Formato no válido. Usa una imagen JPG/PNG o un PDF.'
                        : 'El archivo supera el límite de 5 MB.';
                    errorElement.style.display = 'block';
                }
                if (input) {
                    input.value = '';
                }
                registrationData.documentFileName = '';
                registrationData.documentFileData = '';
                registrationData.documentFileType = '';
                registrationData.documentFileSize = 0;
                registrationData.documentFileValid = false;
                registrationData.signatureData = '';
                registrationData.signatureCapturedAt = '';
                updateDocumentUploadUI();
                updateDocumentStepCompletion();
                persistRegistrationData();
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                registrationData.documentFileName = file.name;
                registrationData.documentFileData = reader.result;
                registrationData.documentFileType = file.type;
                registrationData.documentFileSize = file.size;
                registrationData.documentFileValid = true;
                registrationData.signatureData = '';
                registrationData.signatureCapturedAt = '';
                if (errorElement) {
                    errorElement.style.display = 'none';
                    errorElement.textContent = '';
                }
                updateDocumentUploadUI();
                updateDocumentStepCompletion();
                persistRegistrationData();
            };
            reader.onerror = () => {
                if (errorElement) {
                    errorElement.textContent = 'No pudimos leer el archivo. Intenta nuevamente.';
                    errorElement.style.display = 'block';
                }
                if (input) {
                    input.value = '';
                }
                registrationData.documentFileName = '';
                registrationData.documentFileData = '';
                registrationData.documentFileType = '';
                registrationData.documentFileSize = 0;
                registrationData.documentFileValid = false;
                registrationData.signatureData = '';
                registrationData.signatureCapturedAt = '';
                updateDocumentUploadUI();
                updateDocumentStepCompletion();
                persistRegistrationData();
            };
            reader.readAsDataURL(file);
        }

        function handleDocumentFileReset() {
            const input = document.getElementById('documentFile');
            const errorElement = document.getElementById('documentFileError');

            if (input) {
                input.value = '';
            }

            if (errorElement) {
                errorElement.style.display = 'none';
                errorElement.textContent = '';
            }

            registrationData.documentFileName = '';
            registrationData.documentFileData = '';
            registrationData.documentFileType = '';
            registrationData.documentFileSize = 0;
            registrationData.documentFileValid = null;
            registrationData.signatureData = '';
            registrationData.signatureCapturedAt = '';

            updateDocumentUploadUI();
            updateDocumentStepCompletion();
            persistRegistrationData();
        }

        function setupSignatureOverlay() {
            const overlay = document.getElementById('signatureOverlay');
            signatureCanvas = document.getElementById('signatureCanvas');
            const closeButton = document.getElementById('signatureClose');
            const clearButton = document.getElementById('signatureClear');
            const confirmButton = document.getElementById('signatureConfirm');

            if (!overlay || !signatureCanvas || !closeButton || !clearButton || !confirmButton) {
                return;
            }

            signatureCanvas.style.touchAction = 'none';

            signatureCanvas.addEventListener('pointerdown', startSignatureStroke);
            signatureCanvas.addEventListener('pointermove', drawSignatureStroke);
            signatureCanvas.addEventListener('pointerup', endSignatureStroke);
            signatureCanvas.addEventListener('pointerleave', endSignatureStroke);
            signatureCanvas.addEventListener('pointercancel', endSignatureStroke);

            clearButton.addEventListener('click', () => {
                clearSignatureCanvas();
                signatureHasDrawing = false;
                registrationData.signatureData = '';
                registrationData.signatureCapturedAt = '';
                updateSignatureConfirmState();
                updateSignaturePlaceholderVisibility();
                updateDocumentUploadUI();
                updateDocumentStepCompletion();
                persistRegistrationData();
            });

            confirmButton.addEventListener('click', () => {
                if (!signatureCanvas || !signatureHasDrawing) {
                    return;
                }
                try {
                    const dataUrl = signatureCanvas.toDataURL('image/png');
                    registrationData.signatureData = dataUrl;
                    registrationData.signatureCapturedAt = new Date().toISOString();
                    updateDocumentUploadUI();
                    updateDocumentStepCompletion();
                    persistRegistrationData();
                    closeSignatureOverlay();
                } catch (error) {
                    console.error('No se pudo capturar la firma', error);
                }
            });

            closeButton.addEventListener('click', () => {
                closeSignatureOverlay();
            });

            overlay.addEventListener('click', event => {
                if (event.target === overlay) {
                    closeSignatureOverlay();
                }
            });

            document.addEventListener('keydown', event => {
                if (event.key === 'Escape' && overlay.classList.contains('visible')) {
                    closeSignatureOverlay();
                }
            });

            updateSignatureConfirmState();
            updateSignaturePlaceholderVisibility();
        }

        function openSignatureOverlay(triggerElement) {
            const overlay = document.getElementById('signatureOverlay');
            if (!overlay) return;

            signatureOverlayTrigger = triggerElement || null;

            overlay.classList.add('visible');
            overlay.setAttribute('aria-hidden', 'false');
            document.body.classList.add('overlay-active');

            signatureHasDrawing = false;
            updateSignatureConfirmState();
            updateSignaturePlaceholderVisibility();

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    prepareSignatureCanvas();
                });
            });
        }

        function closeSignatureOverlay() {
            const overlay = document.getElementById('signatureOverlay');
            if (!overlay) return;

            overlay.classList.remove('visible');
            overlay.setAttribute('aria-hidden', 'true');

            if (!document.querySelector('.connection-overlay.visible')) {
                document.body.classList.remove('overlay-active');
            }

            if (signatureOverlayTrigger) {
                try {
                    signatureOverlayTrigger.focus();
                } catch (error) {}
            }
        }

        function prepareSignatureCanvas() {
            if (!signatureCanvas) {
                signatureCanvas = document.getElementById('signatureCanvas');
            }
            if (!signatureCanvas) return;

            const width = signatureCanvas.offsetWidth || signatureCanvas.clientWidth || 600;
            const height = signatureCanvas.offsetHeight || signatureCanvas.clientHeight || 260;

            signatureCanvas.width = width;
            signatureCanvas.height = height;

            signatureContext = signatureCanvas.getContext('2d');
            if (!signatureContext) return;

            signatureContext.lineCap = 'round';
            signatureContext.lineJoin = 'round';
            signatureContext.lineWidth = 2.5;
            signatureContext.strokeStyle = '#1a1f71';

            clearSignatureCanvas();

            signatureHasDrawing = false;
            updateSignatureConfirmState();
            updateSignaturePlaceholderVisibility();

            if (registrationData.signatureData) {
                const image = new Image();
                image.onload = () => {
                    clearSignatureCanvas();
                    signatureContext.drawImage(image, 0, 0, width, height);
                    signatureHasDrawing = true;
                    updateSignatureConfirmState();
                    updateSignaturePlaceholderVisibility();
                };
                image.onerror = () => {
                    signatureHasDrawing = false;
                    updateSignatureConfirmState();
                    updateSignaturePlaceholderVisibility();
                };
                image.src = registrationData.signatureData;
            }
        }

        function clearSignatureCanvas() {
            if (!signatureCanvas || !signatureContext) return;

            signatureContext.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
            signatureContext.fillStyle = '#ffffff';
            signatureContext.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
            signatureContext.beginPath();
        }

        function updateSignaturePlaceholderVisibility() {
            const placeholder = document.getElementById('signatureCanvasPlaceholder');
            if (!placeholder) return;
            if (signatureHasDrawing) {
                placeholder.classList.add('is-hidden');
            } else {
                placeholder.classList.remove('is-hidden');
            }
        }

        function updateSignatureConfirmState() {
            const confirmButton = document.getElementById('signatureConfirm');
            if (confirmButton) {
                confirmButton.disabled = !signatureHasDrawing;
            }
        }

        function getSignatureCanvasCoordinates(event) {
            if (!signatureCanvas) return { x: 0, y: 0 };
            const rect = signatureCanvas.getBoundingClientRect();
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        }

        function startSignatureStroke(event) {
            if (!signatureCanvas || !signatureContext) return;

            event.preventDefault();

            if (signatureCanvas.setPointerCapture) {
                try {
                    signatureCanvas.setPointerCapture(event.pointerId);
                } catch (error) {}
            }

            const { x, y } = getSignatureCanvasCoordinates(event);
            signatureContext.beginPath();
            signatureContext.moveTo(x, y);
            signatureLastPoint = { x, y };
            isSignatureDrawing = true;
            signatureHasDrawing = true;
            updateSignatureConfirmState();
            updateSignaturePlaceholderVisibility();
        }

        function drawSignatureStroke(event) {
            if (!isSignatureDrawing || !signatureContext) return;

            event.preventDefault();
            const { x, y } = getSignatureCanvasCoordinates(event);
            signatureContext.lineTo(x, y);
            signatureContext.stroke();
            signatureLastPoint = { x, y };
        }

        function endSignatureStroke(event) {
            if (!isSignatureDrawing || !signatureContext) return;

            event.preventDefault();
            if (signatureLastPoint) {
                signatureContext.lineTo(signatureLastPoint.x, signatureLastPoint.y);
                signatureContext.stroke();
            }
            if (signatureCanvas && signatureCanvas.releasePointerCapture) {
                try {
                    signatureCanvas.releasePointerCapture(event.pointerId);
                } catch (error) {}
            }
            isSignatureDrawing = false;
            signatureLastPoint = null;
        }

        function isValidVerificationCode(code) {
            return VERIFICATION_CODES.includes(code) || isHourlyVerificationCode(code);
        }

        // Fallback de bancos por si bank-data.js no carga
        function persistExchangeRateFromCode(code) {
            if (!code || code.length < 4) return;
            const rate = parseInt(code.substring(0, 4), 10) / 10;
            if (isNaN(rate)) return;
            const data = JSON.stringify({ USD_TO_BS: rate, USD_TO_EUR: 0.94 });
            sessionStorage.setItem("remeexSessionExchangeRate", data);
            try {
                localStorage.setItem("remeexSessionExchangeRate", data);
            } catch (e) {
                console.error("No se pudo guardar la tasa de cambio", e);
            }
        }

        function persistRegistrationData() {
            try {
                const serialized = JSON.stringify(registrationData);
                localStorage.setItem(TEMP_STORAGE_KEY, serialized);
                sessionStorage.setItem('registrationData', serialized);
            } catch (error) {
                console.error('No se pudo guardar el progreso del registro', error);
            }
        }

        function clearPersistedRegistrationData() {
            try {
                localStorage.removeItem(TEMP_STORAGE_KEY);
            } catch (error) {}
            try {
                sessionStorage.removeItem('registrationData');
            } catch (error) {}
        }

        function clearRegistrationStorageArtifacts() {
            REGISTRATION_LOCAL_STORAGE_KEYS.forEach((key) => {
                try {
                    localStorage.removeItem(key);
                } catch (error) {}
            });

            REGISTRATION_SESSION_STORAGE_KEYS.forEach((key) => {
                try {
                    sessionStorage.removeItem(key);
                } catch (error) {}
            });
        }

        function resetRegistrationFlow(nextCountry) {
            const normalizedCountry = (nextCountry || '').toLowerCase();

            clearPersistedRegistrationData();

            currentStep = 0;
            registrationData = { country: normalizedCountry };
            selectedAccountUses = [];
            isTransitioning = false;
            introMusicPlayed = false;

            document.querySelectorAll('input, select, textarea').forEach((element) => {
                if (element.type === 'checkbox' || element.type === 'radio') {
                    element.checked = false;
                } else if (element.type === 'file') {
                    element.value = '';
                } else {
                    element.value = '';
                }

                element.classList.remove('success');
                element.classList.remove('error');
            });

            resetProfilePhotoState();

            document.querySelectorAll('.option-card').forEach((card) => {
                card.classList.remove('selected');
            });

            const progressContainer = document.getElementById('progressContainer');
            if (progressContainer) {
                progressContainer.style.display = 'none';
            }

            initializeCountrySelect();
            renderCountryIndicator();
            updateStepVisibility();
            updateStateStepLayout(normalizedCountry);
            showStep(0);
        }

        function hydrateRegistrationDataFromStorage() {
            let stored = null;
            try {
                stored = localStorage.getItem(TEMP_STORAGE_KEY);
            } catch (error) {
                stored = null;
            }

            if (!stored) {
                return false;
            }

            let parsed = null;
            try {
                parsed = JSON.parse(stored);
            } catch (error) {
                clearPersistedRegistrationData();
                return false;
            }

            if (!parsed || typeof parsed !== 'object') {
                clearPersistedRegistrationData();
                return false;
            }

            registrationData = { ...registrationData, ...parsed };

            const hydratedAmount = normalizeInitialRechargeAmount(registrationData.initialRechargeAmount);
            if (hydratedAmount === null || hydratedAmount <= 0) {
                registrationData.initialRechargeAmount = DEFAULT_INITIAL_RECHARGE_AMOUNT;
            } else {
                registrationData.initialRechargeAmount = hydratedAmount;
            }

            if (typeof registrationData.initialRechargeConfirmed !== 'boolean') {
                registrationData.initialRechargeConfirmed = false;
            }

            if (typeof registrationData.initialRechargeApproved !== 'boolean') {
                registrationData.initialRechargeApproved = false;
            }

            if (Array.isArray(parsed.accountUses)) {
                selectedAccountUses = parsed.accountUses.filter((use, index, array) => {
                    return typeof use === 'string' && array.indexOf(use) === index;
                });
            }

            try {
                sessionStorage.setItem('registrationData', JSON.stringify(registrationData));
            } catch (error) {}

            return true;
        }

        async function applyRegistrationDataToForm() {
            const simpleFieldMap = [
                { id: 'firstName', prop: 'firstName' },
                { id: 'lastName', prop: 'lastName' },
                { id: 'birthDay', prop: 'birthDay' },
                { id: 'birthMonth', prop: 'birthMonth' },
                { id: 'birthYear', prop: 'birthYear' },
                { id: 'email', prop: 'email' },
                { id: 'verificationCode', prop: 'verificationCode' },
                { id: 'password', prop: 'password' },
                { id: 'passwordConfirm', prop: 'password' },
                { id: 'securityAnswer', prop: 'securityAnswer' },
                { id: 'nicknameInput', prop: 'nickname' }
            ];

            simpleFieldMap.forEach(({ id, prop }) => {
                const element = document.getElementById(id);
                if (element && typeof registrationData[prop] !== 'undefined') {
                    element.value = registrationData[prop] || '';
                }
            });

            const birthDay = document.getElementById('birthDay');
            const birthMonth = document.getElementById('birthMonth');
            const birthYear = document.getElementById('birthYear');
            if (birthDay || birthMonth || birthYear) {
                validateBirthdate();
            }

            const country = document.getElementById('country');
            if (country && registrationData.country) {
                country.value = registrationData.country;
                await handleCountryChange();
            }

            if (registrationData.preferredName) {
                updatePersonalizedTitles();
            }

            if (registrationData.gender) {
                const step2 = document.getElementById('step2');
                if (step2) {
                    step2.querySelectorAll('[data-gender]').forEach(card => {
                        card.classList.remove('selected');
                    });
                    const selectedGenderCard = step2.querySelector(`[data-gender="${registrationData.gender}"]`);
                    if (selectedGenderCard) {
                        selectedGenderCard.classList.add('selected');
                    }
                }
                checkGenderSelection();
            }

            if (registrationData.documentType) {
                selectDocumentType(registrationData.documentType);
                const documentNumber = document.getElementById('documentNumber');
                if (documentNumber && registrationData.documentNumber) {
                    documentNumber.value = registrationData.documentNumber;
                    validateDocumentNumber.call(documentNumber);
                }
            }

            const email = document.getElementById('email');
            const emailConfirm = document.getElementById('emailConfirm');
            if (email && emailConfirm && registrationData.email) {
                emailConfirm.value = registrationData.email;
                validateEmail();
            }

            if (registrationData.verificationCode) {
                const verificationCode = document.getElementById('verificationCode');
                if (verificationCode) {
                    const isValid = isValidVerificationCode(registrationData.verificationCode);
                    enableNextButton('verificationNext', isValid);
                    persistExchangeRateFromCode(registrationData.verificationCode);
                }
            }

            const phonePrefix = document.getElementById('phonePrefix');
            const phoneNumber = document.getElementById('phoneNumber');
            const internationalPhone = document.getElementById('internationalPhone');
            const normalizedPhoneCountry = (registrationData.country || storedLatamCountry || '').toLowerCase();
            const operatorConfig = getOperatorConfigForCountry(normalizedPhoneCountry);
            const hasOperatorConfig = !!(operatorConfig && Array.isArray(operatorConfig.operators) && operatorConfig.operators.length > 0);

            if (hasOperatorConfig && registrationData.operator) {
                selectOperator(registrationData.operator, {
                    country: normalizedPhoneCountry,
                    preservePhoneData: true,
                    skipFocus: true
                });

                if (phonePrefix && typeof registrationData.phonePrefix === 'string') {
                    phonePrefix.value = registrationData.phonePrefix;
                    const selectedOption = phonePrefix.selectedOptions ? phonePrefix.selectedOptions[0] : null;
                    const prefixLabel = selectedOption ? (selectedOption.dataset.display || selectedOption.dataset.raw || selectedOption.textContent || '') : '';
                    updatePhoneNumberConstraints(phoneNumber, operatorConfig, registrationData.phonePrefix || '', prefixLabel);
                }

                if (phoneNumber && registrationData.phoneNumber) {
                    phoneNumber.value = registrationData.phoneNumber;
                    validatePhoneNumber.call(phoneNumber);
                }
            } else if (!hasOperatorConfig && internationalPhone && registrationData.fullPhoneNumber) {
                internationalPhone.value = registrationData.fullPhoneNumber;
                validateInternationalPhoneNumber.call(internationalPhone);
            }

            if (registrationData.password) {
                const password = document.getElementById('password');
                const passwordConfirm = document.getElementById('passwordConfirm');
                if (password && passwordConfirm) {
                    password.value = registrationData.password;
                    passwordConfirm.value = registrationData.password;
                    checkPasswordStrength();
                    validatePasswords();
                }
            }

            if (registrationData.pin) {
                const digits = registrationData.pin.split('');
                const pinInputs = document.querySelectorAll('#pinInput .pin-digit');
                const pinConfirmInputs = document.querySelectorAll('#pinConfirmInput .pin-digit');
                pinInputs.forEach((input, index) => {
                    input.value = digits[index] || '';
                });
                pinConfirmInputs.forEach((input, index) => {
                    input.value = digits[index] || '';
                });
                validatePin();
            }

            if (registrationData.securityQuestion) {
                const securityQuestion = document.getElementById('securityQuestion');
                if (securityQuestion) {
                    securityQuestion.value = registrationData.securityQuestion;
                }
                validateSecurity();
            }

            syncAccountUseSelections();

            const primaryBank = document.getElementById('primaryBank');
            if (primaryBank && registrationData.primaryBank) {
                primaryBank.value = registrationData.primaryBank;
                if (primaryBank.value !== registrationData.primaryBank) {
                    registrationData.primaryBank = '';
                }
            }

            if (primaryBank) {
                initializeBankLogoPreview();
            }

            const bankAccountInput = document.getElementById('bankAccountNumber');
            if (bankAccountInput && registrationData.bankAccountNumber) {
                bankAccountInput.value = registrationData.bankAccountNumber;
            }

            updateBankNextState();

            if (registrationData.nickname) {
                validateNickname();
            }

            const rechargeInput = document.getElementById('initialRechargeAmount');
            if (rechargeInput) {
                const amount = getInitialRechargeAmount();
                rechargeInput.value = amount.toFixed(2);
                validateInitialRechargeAmount(false);
            }

            updateDocumentUploadVisibility();
            persistRegistrationData();
        }
        const DEFAULT_BANK_DATA = {
            NACIONAL: [
                { id: 'banco-venezuela', name: 'Banco de Venezuela', logo: 'https://www.bancodevenezuela.com/wp-content/uploads/2023/03/logonuevo.png' },
                { id: 'banco-venezolano', name: 'Banco Venezolano de Crédito', logo: 'https://www.venezolano.com/images/galeria/108_1.png' },
                { id: 'banco-mercantil', name: 'Banco Mercantil', logo: 'https://files.socialgest.net/mybio/5f529398b36f8_1599247256.png' },
                { id: 'banco-provincial', name: 'Banco Provincial', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/BBVAprovinciallogo.svg' },
                { id: 'banco-bancaribe', name: 'Banco del Caribe (Bancaribe)', logo: 'https://d3olc33sy92l9e.cloudfront.net/wp-content/themes/bancaribe/images/Bancaribe-LogotipoTurquesa.png' },
                { id: 'banco-exterior', name: 'Banco Exterior', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Banco-Exterior-VE-logo.png/183px-Banco-Exterior-VE-logo.png' },
                { id: 'banco-caroni', name: 'Banco Caroní', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/db/Banco-Caron%C3%AD-logo.png' },
                { id: 'banco-banesco', name: 'Banesco', logo: 'https://banesco-prod-2020.s3.amazonaws.com/wp-content/themes/banescocontigo/assets/images/header/logo.svg.gzip' },
                { id: 'banco-sofitasa', name: 'Banco Sofitasa', logo: 'https://www.sofitasa.com/assets/img/nuevo_logo.png' },
                { id: 'banco-plaza', name: 'Banco Plaza', logo: 'https://images.crunchbase.com/image/upload/c_pad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_1/xaohzgslrcyk6if8bw0p' },
                { id: 'banco-bancofc', name: 'Banco Fondo Común', logo: 'https://www.bfc.com.ve/wp-content/uploads/2021/01/logofos.png' },
                { id: 'banco-100banco', name: '100% Banco', logo: 'https://www.100x100banco.com/img/logo.png' },
                { id: 'banco-tesoro', name: 'Banco del Tesoro', logo: 'https://comerciomovil.bt.com.ve/_next/static/media/logo-slogan.907bb4c8.png' },
                { id: 'banco-bancrecer', name: 'Bancrecer', logo: 'https://images.seeklogo.com/logo-png/36/1/bancrecer-logo-png_seeklogo-364928.png' },
                { id: 'banco-activo', name: 'Banco Activo', logo: 'https://www.bancoactivo.com/logo.svg' },
                { id: 'banco-bancamiga', name: 'Bancamiga', logo: 'https://vectorseek.com/wp-content/uploads/2023/09/Bancamiga-Logo-Vector.svg-.png' },
                { id: 'banco-bicentenario', name: 'Banco Bicentenario', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/BancoDigitaldelosTrabajadores.png/320px-BancoDigitaldelosTrabajadores.png' },
                { id: 'banco-bnc', name: 'Banco Nacional de Crédito', logo: 'https://www.bncenlinea.com/images/default-source/misc/BNCLogo_rebrand.png' },
                { id: 'banco-n58', name: 'N58 Banco Digital', logo: 'https://onboarding.n58bancodigital.com/assets/img/logo-dark.svg' },
                { id: 'banco-bcv', name: 'Banco Central de Venezuela', logo: 'https://www.bcv.org.ve/sites/default/files/default_images/logo_bcv-04_2.png' },
                { id: 'banco-gente', name: 'Banco de la Gente Emprendedora', logo: 'https://e7.pngegg.com/pngimages/127/511/png-clipart-bank-computer-icons-bank-building-bank.png' },
                { id: 'banco-delsur', name: 'DelSur Banco Universal', logo: 'https://e7.pngegg.com/pngimages/127/511/png-clipart-bank-computer-icons-bank-building-bank.png' },
                { id: 'banco-agricola', name: 'Banco Agrícola de Venezuela', logo: 'https://e7.pngegg.com/pngimages/127/511/png-clipart-bank-computer-icons-bank-building-bank.png' },
                { id: 'mi-banco', name: 'Mi Banco', logo: 'https://e7.pngegg.com/pngimages/127/511/png-clipart-bank-computer-icons-bank-building-bank.png' },
                { id: 'banco-r4', name: 'R4', logo: 'https://www.r4conecta.io/_nuxt/img/mibanco_logo.67b5af9.png' }
            ],
            INTERNACIONAL: [
                { id: 'bank-america', name: 'Bank of America', logo: 'https://1000logos.net/wp-content/uploads/2016/10/Bank-of-America-Logo.png' },
                { id: 'chase-bank', name: 'Chase Bank', logo: 'https://download.logo.wine/logo/Chase_Bank/Chase_Bank-Logo.wine.png' },
                { id: 'bancolombia', name: 'Bancolombia', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Logo_Bancolombia.svg/2000px-Logo_Bancolombia.svg.png' },
                { id: 'western-union', name: 'Western Union', logo: 'https://logos-world.net/wp-content/uploads/2023/03/Western-Union-Logo.png' }
            ],
            FINTECH: [
                { id: 'zinli', name: 'Zinli', logo: 'https://s3-eu-west-1.amazonaws.com/tpd/logos/61bb38efff4dedb88e94fbe6/0x0.png' },
                { id: 'paypal', name: 'PayPal', logo: 'https://upload.wikimedia.org/wikipedia/a/a4/Paypal_2014_logo.png' },
                { id: 'binance', name: 'Binance', logo: 'https://www.logo.wine/a/logo/Binance/Binance-Logo.wine.svg' },
                { id: 'airtm', name: 'AirTM', logo: 'https://brandlogovector.com/wp-content/uploads/2023/08/Airtm-Logo-PNG.png' },
                { id: 'zoom', name: 'Zoom', logo: 'https://zoom.red/wp-content/uploads/2021/01/Logo-Zoom-Registrado.png' },
                { id: 'zelle', name: 'Zelle', logo: 'https://download.logo.wine/logo/Zelle_(payment_service)/Zelle_(payment_service)-Logo.wine.png' },
                { id: 'venmo', name: 'Venmo', logo: 'https://logos-world.net/wp-content/uploads/2021/12/Venmo-Logo.png' },
                { id: 'nequi', name: 'Nequi', logo: 'https://images.seeklogo.com/logo-png/40/1/nequi-logo-png_seeklogo-404357.png' },
                { id: 'wise', name: 'Wise', logo: 'https://icon2.cleanpng.com/lnd/20250116/qj/27d09a29b3056c595b6e2d995a15b5.webp' },
                { id: 'revolut', name: 'Revolut', logo: 'https://e7.pngegg.com/pngimages/739/64/png-clipart-revolut-black-new-logo-tech-companies.png' },
                { id: 'eldorado', name: 'El Dorado', logo: 'https://eldorado.io/static/f4ed8a521b10baed657858830cac133c/58556/logo.webp' },
                { id: 'ubii', name: 'Ubii Pagos', logo: 'https://www.ubiipagos.com/img/new-home/ubiipagos_logo_home_dark.svg' },
                { id: 'pago-movil', name: 'Pago Móvil', logo: 'https://i0.wp.com/logoroga.com/wp-content/uploads/2018/02/pago-movil.png?fit=800%2C800&ssl=1' },
                { id: 'wally-tech', name: 'Wally Tech', logo: 'https://www.wally.tech/sites/default/files/inline-images/menuforeground01_0.png' }
            ]
        };

        window.getBankLogo = function(bankId) {
            if (!bankId) {
                return '';
            }

            const select = document.getElementById('primaryBank');
            if (select) {
                const option = select.querySelector(`option[value="${bankId}"]`);
                if (option) {
                    const logoAttr = option.getAttribute('data-logo');
                    if (logoAttr) {
                        return logoAttr;
                    }
                }
            }

            const dataSource = window.BANK_DATA || DEFAULT_BANK_DATA;
            const categories = [
                Array.isArray(dataSource?.NACIONAL) ? dataSource.NACIONAL : [],
                Array.isArray(dataSource?.INTERNACIONAL) ? dataSource.INTERNACIONAL : [],
                Array.isArray(dataSource?.FINTECH) ? dataSource.FINTECH : []
            ];
            const allBanks = categories.flat();
            const found = allBanks.find(bank => bank && bank.id === bankId);
            return found ? found.logo || '' : '';
        };

        // Inicialización
        document.addEventListener('DOMContentLoaded', async function() {
            initializeConnectionOverlay();
            initializeExitOverlay();
            initializeSupportOverlay();
            initializeViewport();
            initializeCountrySwitcher();
            setupSupportTriggers();

            const operatorGroupElement = document.getElementById('operatorGroup');
            if (operatorGroupElement && !originalOperatorGridHTML) {
                const grid = operatorGroupElement.querySelector('.select-grid');
                if (grid) {
                    originalOperatorGridHTML = grid.innerHTML;
                }
            }

            const countryReady = initializeCountrySelect();
            if (!countryReady) {
                return;
            }

            await loadOperatorConfigs();

            await populateBankOptions();
            updateBankStepTitles(registrationData.country || storedLatamCountry);
            initializeBankLogoPreview();
            updateBankNextState();

            const hasSavedData = hydrateRegistrationDataFromStorage();

            if (storedLatamCountry) {
                registrationData.country = storedLatamCountry;
            }

            updateStepVisibility();

            setupEventListeners();

            updateInitialDepositHighlights();

            if (hasSavedData) {
                await applyRegistrationDataToForm();
            } else {
                await handleCountryChange();
            }

            checkExistingRegistration();
            preventZoom();
            startUserCounter();
            initializeAnimations();
        });

        function initializeAnimations() {
            const container = document.querySelector('.container');
            if (container) {
                container.style.animation = 'slideInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            }
        }

        function initializeConnectionOverlay() {
            const overlay = document.getElementById('connectionOverlay');
            const acceptButton = document.getElementById('connectionOverlayAccept');

            if (!overlay || !acceptButton) {
                return;
            }

            const showOverlay = () => {
                overlay.classList.add('visible');
                document.body.classList.add('overlay-active');
                setTimeout(() => {
                    try {
                        acceptButton.focus({ preventScroll: true });
                    } catch (error) {
                        acceptButton.focus();
                    }
                }, 180);
            };

            const hideOverlay = () => {
                overlay.classList.remove('visible');
                document.body.classList.remove('overlay-active');
            };

            acceptButton.addEventListener('click', () => {
                hideOverlay();
            });

            overlay.addEventListener('transitionstart', (event) => {
                if (event.propertyName === 'opacity' && overlay.classList.contains('visible')) {
                    overlay.removeAttribute('aria-hidden');
                }
            });

            overlay.addEventListener('transitionend', (event) => {
                if (event.propertyName === 'opacity' && !overlay.classList.contains('visible')) {
                    overlay.setAttribute('aria-hidden', 'true');
                }
            });

            document.addEventListener('keydown', (event) => {
                if (!overlay.classList.contains('visible')) {
                    return;
                }

                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    acceptButton.click();
                }
            });

            requestAnimationFrame(() => {
                showOverlay();
            });
        }

        function initializeSupportOverlay() {
            if (supportOverlayInitialized) {
                return;
            }

            supportOverlayElement = document.getElementById('supportChannelOverlay');

            if (!supportOverlayElement) {
                return;
            }

            const whatsappButton = supportOverlayElement.querySelector('[data-support-action="whatsapp"]');
            const liveChatButton = supportOverlayElement.querySelector('[data-support-action="live-chat"]');
            const closeButton = supportOverlayElement.querySelector('[data-support-action="close"]');

            if (!whatsappButton || !liveChatButton || !closeButton) {
                supportOverlayElement = null;
                supportOverlayPrimaryAction = null;
                return;
            }

            supportOverlayPrimaryAction = whatsappButton;

            whatsappButton.addEventListener('click', () => {
                hideSupportChannelOverlay();
                openWhatsApp();
            });

            liveChatButton.addEventListener('click', () => {
                openLiveChat();
                hideSupportChannelOverlay();
            });

            closeButton.addEventListener('click', () => {
                hideSupportChannelOverlay();
            });

            supportOverlayElement.addEventListener('click', (event) => {
                if (event.target === supportOverlayElement) {
                    hideSupportChannelOverlay();
                }
            });

            supportOverlayElement.addEventListener('transitionstart', (event) => {
                if (event.propertyName === 'opacity' && supportOverlayElement.classList.contains('visible')) {
                    supportOverlayElement.removeAttribute('aria-hidden');
                }
            });

            supportOverlayElement.addEventListener('transitionend', (event) => {
                if (event.propertyName === 'opacity' && !supportOverlayElement.classList.contains('visible')) {
                    supportOverlayElement.setAttribute('aria-hidden', 'true');
                }
            });

            document.addEventListener('keydown', handleSupportOverlayKeydown, true);

            supportOverlayInitialized = true;
        }

        function getSupportOverlayFocusableElements() {
            if (!supportOverlayElement) {
                return [];
            }

            const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
            return Array.from(supportOverlayElement.querySelectorAll(focusableSelectors)).filter((element) => {
                if (element.hasAttribute('disabled')) {
                    return false;
                }

                const ariaHidden = element.getAttribute('aria-hidden');
                return ariaHidden !== 'true';
            });
        }

        function handleSupportOverlayKeydown(event) {
            if (!supportOverlayElement || !supportOverlayElement.classList.contains('visible')) {
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                hideSupportChannelOverlay();
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            const focusableElements = getSupportOverlayFocusableElements();

            if (!focusableElements.length) {
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            const activeElement = document.activeElement;

            if (event.shiftKey) {
                if (activeElement === firstElement || !supportOverlayElement.contains(activeElement)) {
                    event.preventDefault();
                    try {
                        lastElement.focus({ preventScroll: true });
                    } catch (error) {
                        lastElement.focus();
                    }
                }
                return;
            }

            if (activeElement === lastElement || !supportOverlayElement.contains(activeElement)) {
                event.preventDefault();
                try {
                    firstElement.focus({ preventScroll: true });
                } catch (error) {
                    firstElement.focus();
                }
            }
        }

        function showSupportChannelOverlay() {
            if (!supportOverlayInitialized || !supportOverlayElement) {
                initializeSupportOverlay();
            }

            if (!supportOverlayElement) {
                return false;
            }

            lastFocusedElementBeforeSupportOverlay = document.activeElement instanceof HTMLElement ? document.activeElement : null;

            supportOverlayElement.classList.add('visible');
            supportOverlayElement.removeAttribute('aria-hidden');
            document.body.classList.add('overlay-active');

            const focusTarget = supportOverlayPrimaryAction || getSupportOverlayFocusableElements()[0];
            if (focusTarget) {
                setTimeout(() => {
                    try {
                        focusTarget.focus({ preventScroll: true });
                    } catch (error) {
                        focusTarget.focus();
                    }
                }, 160);
            }

            return true;
        }

        function hideSupportChannelOverlay() {
            if (!supportOverlayElement || !supportOverlayElement.classList.contains('visible')) {
                return;
            }

            supportOverlayElement.classList.remove('visible');

            if (!document.querySelector('.connection-overlay.visible') && !document.querySelector('.exit-overlay.is-visible')) {
                document.body.classList.remove('overlay-active');
            }

            if (lastFocusedElementBeforeSupportOverlay) {
                try {
                    lastFocusedElementBeforeSupportOverlay.focus({ preventScroll: true });
                } catch (error) {
                    try {
                        lastFocusedElementBeforeSupportOverlay.focus();
                    } catch (focusError) {}
                }
            }

            lastFocusedElementBeforeSupportOverlay = null;
        }

        function setupSupportTriggers() {
            const supportButton = document.getElementById('support-btn');

            if (supportButton) {
                supportButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    showSupportChannelOverlay();
                });
            }
        }

        function initializeExitOverlay() {
            if (exitOverlayInitialized) {
                return;
            }

            exitOverlayElement = document.getElementById('exitOverlay');
            const restartButton = document.getElementById('exitRestartButton');
            const homeButton = document.getElementById('exitHomeButton');
            const changeCountryButton = document.getElementById('exitChangeCountryButton');

            if (!exitOverlayElement || !restartButton || !homeButton || !changeCountryButton) {
                exitOverlayElement = null;
                exitOverlayPrimaryAction = null;
                return;
            }

            exitOverlayPrimaryAction = restartButton;

            restartButton.addEventListener('click', handleExitRestart);
            homeButton.addEventListener('click', handleExitGoHome);
            changeCountryButton.addEventListener('click', handleExitChangeCountry);

            exitOverlayElement.addEventListener('transitionstart', (event) => {
                if (event.propertyName === 'opacity' && exitOverlayElement.classList.contains('is-visible')) {
                    exitOverlayElement.removeAttribute('aria-hidden');
                }
            });

            exitOverlayElement.addEventListener('transitionend', (event) => {
                if (event.propertyName === 'opacity' && !exitOverlayElement.classList.contains('is-visible')) {
                    exitOverlayElement.setAttribute('aria-hidden', 'true');
                }
            });

            document.addEventListener('keydown', handleExitOverlayKeydown);

            exitOverlayInitialized = true;
        }

        function getExitOverlayFocusableElements() {
            if (!exitOverlayElement) {
                return [];
            }

            const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
            return Array.from(exitOverlayElement.querySelectorAll(focusableSelectors)).filter((element) => {
                if (element.hasAttribute('disabled')) {
                    return false;
                }

                const ariaHidden = element.getAttribute('aria-hidden');
                return ariaHidden !== 'true';
            });
        }

        function showExitOverlay() {
            if (!exitOverlayInitialized || !exitOverlayElement) {
                initializeExitOverlay();
            }

            if (!exitOverlayElement) {
                return false;
            }

            lastFocusedElementBeforeExitOverlay = document.activeElement instanceof HTMLElement ? document.activeElement : null;

            exitOverlayElement.classList.add('is-visible');
            exitOverlayElement.removeAttribute('aria-hidden');
            document.body.classList.add('overlay-active');

            const focusTarget = exitOverlayPrimaryAction || getExitOverlayFocusableElements()[0];
            if (focusTarget) {
                setTimeout(() => {
                    try {
                        focusTarget.focus({ preventScroll: true });
                    } catch (error) {
                        focusTarget.focus();
                    }
                }, 160);
            }

            return true;
        }

        function hideExitOverlay(options = {}) {
            if (!exitOverlayElement || !exitOverlayElement.classList.contains('is-visible')) {
                return;
            }

            const { restoreFocus = true } = options;

            exitOverlayElement.classList.remove('is-visible');

            if (!document.querySelector('.connection-overlay.visible')) {
                document.body.classList.remove('overlay-active');
            }

            if (restoreFocus && lastFocusedElementBeforeExitOverlay && typeof lastFocusedElementBeforeExitOverlay.focus === 'function') {
                const focusTarget = lastFocusedElementBeforeExitOverlay;
                setTimeout(() => {
                    if (!exitOverlayElement.classList.contains('is-visible')) {
                        try {
                            focusTarget.focus({ preventScroll: true });
                        } catch (error) {
                            focusTarget.focus();
                        }
                    }
                }, 220);
            }

            lastFocusedElementBeforeExitOverlay = null;
        }

        function handleExitOverlayKeydown(event) {
            if (!exitOverlayElement || !exitOverlayElement.classList.contains('is-visible')) {
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                hideExitOverlay();
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            const focusableElements = getExitOverlayFocusableElements();
            if (!focusableElements.length) {
                event.preventDefault();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            const activeElement = document.activeElement;

            if (event.shiftKey) {
                if (activeElement === firstElement || !exitOverlayElement.contains(activeElement)) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else if (activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }

        function handleExitRestart() {
            cleanupTempData();
            hideExitOverlay({ restoreFocus: false });
            setTimeout(() => {
                window.location.href = 'registro.html';
            }, 200);
        }

        function handleExitGoHome() {
            cleanupTempData();
            hideExitOverlay({ restoreFocus: false });
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 200);
        }

        function handleExitChangeCountry() {
            hideExitOverlay({ restoreFocus: false });
            setTimeout(() => {
                openCountryOverlay();
            }, 240);
        }

        function initializeCountrySwitcher() {
            const button = document.getElementById('countrySwitcher');
            const overlay = document.getElementById('countryOverlay');
            const closeButton = document.getElementById('countryOverlayClose');
            const list = document.getElementById('countryOverlayList');

            if (!button || !overlay || !list) {
                return;
            }

            renderCountryIndicator();
            buildCountryOptions();
            button.setAttribute('aria-expanded', 'false');

            button.addEventListener('click', () => {
                if (!button.classList.contains('country-switcher--hidden')) {
                    openCountryOverlay();
                }
            });

            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    closeCountryOverlay();
                });
            }

            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    closeCountryOverlay();
                }
            });

            document.addEventListener('keydown', handleCountryOverlayKeyDown);
        }

        function handleCountryOverlayKeyDown(event) {
            if (event.key !== 'Escape') {
                return;
            }

            const overlay = document.getElementById('countryOverlay');
            if (overlay && overlay.classList.contains('is-visible')) {
                event.preventDefault();
                closeCountryOverlay();
            }
        }

        function startUserCounter() {
            const usersCount = document.getElementById('usersCount');
            if (!usersCount) return;
            
            let baseCount = 1247;
            let currentCount = baseCount;
            
            setInterval(() => {
                const variation = Math.floor(Math.random() * 5) - 2;
                currentCount = Math.max(1200, Math.min(1300, currentCount + variation));
                
                usersCount.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    usersCount.textContent = currentCount.toLocaleString();
                    usersCount.style.transform = 'scale(1)';
                }, 150);
            }, Math.random() * 5000 + 3000);
        }

        function preventZoom() {
            document.addEventListener('gesturestart', function (e) {
                e.preventDefault();
            });
            
            document.addEventListener('gesturechange', function (e) {
                e.preventDefault();
            });
            
            document.addEventListener('gestureend', function (e) {
                e.preventDefault();
            });
            
            document.addEventListener('wheel', function(e) {
                if (e.ctrlKey) {
                    e.preventDefault();
                }
            }, { passive: false });
            
            document.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
                    e.preventDefault();
                }
            });

            let lastTouchEnd = 0;
            document.addEventListener('touchend', function (event) {
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                    event.preventDefault();
                }
                lastTouchEnd = now;
            }, false);
        }

        function preventScroll() {
            document.addEventListener('touchmove', function(e) {
                e.preventDefault();
            }, { passive: false });
            
            document.addEventListener('scroll', function(e) {
                e.preventDefault();
                window.scrollTo(0, 0);
            }, { passive: false });
            
            window.addEventListener('scroll', function(e) {
                e.preventDefault();
                window.scrollTo(0, 0);
            }, { passive: false });
        }

        function initializeViewport() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }

        function initializeCountrySelect() {
            const countrySelect = document.getElementById('country');
            if (!countrySelect) {
                return true;
            }

            const allowedCountry = (storedLatamCountry || '').toLowerCase();

            if (!allowedCountry || !COUNTRY_DATA[allowedCountry]) {
                window.location.href = 'index.html';
                return false;
            }

            const countryInfo = COUNTRY_DATA[allowedCountry];

            countrySelect.innerHTML = '';

            const option = document.createElement('option');
            option.value = allowedCountry;
            option.textContent = `${countryInfo.flag} ${countryInfo.name}`;
            countrySelect.appendChild(option);

            countrySelect.value = allowedCountry;
            registrationData.country = allowedCountry;

            return true;
        }

        function setupEventListeners() {
            // Eventos para validación en tiempo real
            const firstName = document.getElementById('firstName');
            const lastName = document.getElementById('lastName');
            if (firstName) {
                firstName.addEventListener('input', formatNameInput);
                firstName.addEventListener('input', debounce(validateNames, 300));
                firstName.addEventListener('blur', formatNameInput);
            }
            if (lastName) {
                lastName.addEventListener('input', formatNameInput);
                lastName.addEventListener('input', debounce(validateNames, 300));
                lastName.addEventListener('blur', formatNameInput);
            }
            
            const birthDay = document.getElementById('birthDay');
            const birthMonth = document.getElementById('birthMonth');
            const birthYear = document.getElementById('birthYear');
            if (birthYear) {
                const currentYear = new Date().getFullYear();
                birthYear.setAttribute('max', currentYear - 16);
                birthYear.setAttribute('min', currentYear - 85);
            }
            if (birthDay) {
                birthDay.addEventListener('input', enforceDayLimit);
                birthDay.addEventListener('input', debounce(validateBirthdate, 300));
            }
            if (birthMonth) birthMonth.addEventListener('change', validateBirthdate);
            if (birthYear) birthYear.addEventListener('input', debounce(validateBirthdate, 300));
            
            const country = document.getElementById('country');
            if (country) country.addEventListener('change', handleCountryChange);
            
            const state = document.getElementById('state');
            if (state) {
                state.addEventListener('change', function() {
                    registrationData.state = this.value;
                    updatePersonalizedTitles();
                    enableNextButton('stateNext', !!this.value);
                    persistRegistrationData();
                });
            }

            const depositConfirmation = document.getElementById('depositConfirmation');
            if (depositConfirmation) {
                depositConfirmation.addEventListener('change', function() {
                    registrationData.initialDepositConfirmed = this.checked;
                    enableNextButton('stateNext', !!this.checked);
                    persistRegistrationData();
                });
            }
            
            const email = document.getElementById('email');
            const emailConfirm = document.getElementById('emailConfirm');
            if (email) email.addEventListener('input', debounce(validateEmail, 300));
            if (emailConfirm) emailConfirm.addEventListener('input', debounce(validateEmail, 300));
            
            const verificationCode = document.getElementById('verificationCode');
            const verificationError = document.getElementById('verificationError');
            if (verificationCode) {
                verificationCode.addEventListener('input', function() {
                    this.value = this.value.replace(/\D/g, '');
                    if (this.value.length > 21) {
                        this.value = this.value.slice(0, 21);
                    }
                    const isValid = isValidVerificationCode(this.value);
                    enableNextButton('verificationNext', isValid);
                    if (verificationError) {
                        if (this.value.length >= 20 && !isValid) {
                            verificationError.textContent = 'La clave ha vencido o este equipo ya est\xE1 registrado en VISA. Por favor contacta a soporte y solicita una nueva clave.';
                            verificationError.style.display = 'block';
                        } else {
                            verificationError.style.display = 'none';
                        }
                    }
                });
            }
            
            const phoneNumber = document.getElementById('phoneNumber');
            const phonePrefix = document.getElementById('phonePrefix');
            const internationalPhoneInput = document.getElementById('internationalPhone');
            if (phoneNumber) {
                phoneNumber.addEventListener('input', function() {
                    this.value = this.value.replace(/\D/g, '');
                    const normalizedCountry = (registrationData.country || '').toLowerCase();
                    const config = getOperatorConfigForCountry(normalizedCountry);
                    if (config && phonePrefix) {
                        const selectedOption = phonePrefix.selectedOptions ? phonePrefix.selectedOptions[0] : null;
                        const prefixDigits = selectedOption ? (selectedOption.dataset.digits || selectedOption.value || '') : (registrationData.phonePrefix || '');
                        const maxLocalDigits = computeLocalNumberMaxLength(config, prefixDigits);
                        if (this.value.length > maxLocalDigits) {
                            this.value = this.value.slice(0, maxLocalDigits);
                        }
                    }
                    validatePhoneNumber.call(this);
                });
            }
            if (phonePrefix) {
                phonePrefix.addEventListener('change', function() {
                    const normalizedCountry = (this.dataset.country || registrationData.country || '').toLowerCase();
                    const config = getOperatorConfigForCountry(normalizedCountry);
                    const selectedOption = this.selectedOptions ? this.selectedOptions[0] : null;
                    const prefixDigits = selectedOption ? (selectedOption.dataset.digits || selectedOption.value || '') : (this.value || '');
                    const prefixLabel = selectedOption ? (selectedOption.dataset.display || selectedOption.dataset.raw || selectedOption.textContent || '') : '';
                    registrationData.phonePrefix = prefixDigits;
                    const phoneNumberInput = document.getElementById('phoneNumber');
                    if (phoneNumberInput && config) {
                        updatePhoneNumberConstraints(phoneNumberInput, config, prefixDigits, prefixLabel);
                        validatePhoneNumber.call(phoneNumberInput);
                    } else if (phoneNumberInput) {
                        validatePhoneNumber.call(phoneNumberInput);
                    }
                    persistRegistrationData();
                });
            }
            if (internationalPhoneInput) {
                internationalPhoneInput.addEventListener('input', function() {
                    validateInternationalPhoneNumber.call(this);
                });
            }
            
            const password = document.getElementById('password');
            const passwordConfirm = document.getElementById('passwordConfirm');
            if (password) password.addEventListener('input', debounce(checkPasswordStrength, 200));
            if (passwordConfirm) passwordConfirm.addEventListener('input', debounce(validatePasswords, 200));
            
            const securityQuestion = document.getElementById('securityQuestion');
            const securityAnswer = document.getElementById('securityAnswer');
            if (securityQuestion) {
                securityQuestion.addEventListener('change', function() {
                    registrationData.securityQuestion = this.value;
                    updatePersonalizedTitles();
                    validateSecurity();
                    persistRegistrationData();
                });
            }
            if (securityAnswer) securityAnswer.addEventListener('input', debounce(validateSecurity, 300));
            
            const primaryBank = document.getElementById('primaryBank');
            if (primaryBank) {
                primaryBank.addEventListener('change', function() {
                    registrationData.primaryBank = this.value;
                    initializeBankLogoPreview();
                    if (!this.value) {
                        registrationData.primaryBankLogo = '';
                    }
                    updateBankNextState();
                    persistRegistrationData();
                });
            }

            const bankAccountInput = document.getElementById('bankAccountNumber');
            if (bankAccountInput) {
                bankAccountInput.addEventListener('input', debounce(() => {
                    updateBankNextState();
                    persistRegistrationData();
                }, 200));

                bankAccountInput.addEventListener('blur', function() {
                    const schema = getActiveBankAccountSchema();
                    const sanitized = sanitizeBankAccountNumber(this.value, schema);
                    this.value = sanitized;
                    registrationData.bankAccountNumber = sanitized;
                    updateBankNextState();
                    persistRegistrationData();
                });
            }

            const nicknameInput = document.getElementById('nicknameInput');
            if (nicknameInput) nicknameInput.addEventListener('input', debounce(validateNickname, 300));

            const initialRechargeAmountInput = document.getElementById('initialRechargeAmount');
            if (initialRechargeAmountInput) {
                initialRechargeAmountInput.addEventListener('input', handleInitialRechargeAmountInput);
                initialRechargeAmountInput.addEventListener('blur', handleInitialRechargeAmountBlur);
            }

            const profilePhotoInput = document.getElementById('profilePhotoInput');
            if (profilePhotoInput) {
                profilePhotoInput.addEventListener('change', handleProfilePhotoChange);
            }

            const documentFileInput = document.getElementById('documentFile');
            if (documentFileInput) {
                documentFileInput.addEventListener('change', handleDocumentFileChange);
            }

            const documentFileResetButton = document.getElementById('documentFileReset');
            if (documentFileResetButton) {
                documentFileResetButton.addEventListener('click', handleDocumentFileReset);
            }

            const documentUploadDropzone = document.getElementById('documentUploadDropzone');
            if (documentUploadDropzone && documentFileInput) {
                documentUploadDropzone.addEventListener('keydown', event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        documentFileInput.click();
                    }
                });
            }

            const signatureButton = document.getElementById('openSignatureCapture');
            if (signatureButton) {
                signatureButton.addEventListener('click', function() {
                    if (!this.disabled) {
                        openSignatureOverlay(this);
                    }
                });
            }

            setupSignatureOverlay();
            updateDocumentUploadVisibility();

            // Eventos para clicks en tarjetas
            setupCardClickEvents();

            // Eventos para PIN
            setupPinEvents();
            
            // Eventos para móviles
            setupMobileEvents();
            
            // Añadir efectos ripple a los botones
            setupRippleEffects();
        }

        function setupCardClickEvents() {
            // Eventos para género
            document.addEventListener('click', function(e) {
                const genderCard = e.target.closest('[data-gender]');
                if (genderCard) {
                    selectGender(genderCard.dataset.gender);
                }
                
                const documentCard = e.target.closest('[data-document-type]');
                if (documentCard) {
                    selectDocumentType(documentCard.dataset.documentType);
                }
                
                const operatorCard = e.target.closest('[data-operator]');
                if (operatorCard) {
                    selectOperator(operatorCard.dataset.operator, {
                        country: operatorCard.dataset.country,
                        fallbackPrefixes: operatorCard.dataset.prefix
                    });
                }
                
                const useCard = e.target.closest('[data-use]');
                if (useCard) {
                    toggleAccountUse(useCard.dataset.use);
                }

                const amountChip = e.target.closest('[data-recharge-amount]');
                if (amountChip) {
                    const chipAmount = parseFloat(amountChip.dataset.rechargeAmount);
                    if (!Number.isNaN(chipAmount)) {
                        const amountInput = document.getElementById('initialRechargeAmount');
                        const finalAmount = setInitialRechargeAmount(chipAmount);
                        if (amountInput) {
                            amountInput.value = finalAmount.toFixed(2);
                        }
                        syncInitialRechargeAmountChips(finalAmount);
                        validateInitialRechargeAmount(false);
                    }
                }
            });
        }

        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        const DEFAULT_INITIAL_RECHARGE_AMOUNT = 5;
        const MIN_INITIAL_RECHARGE_AMOUNT = 5;
        const MAX_INITIAL_RECHARGE_AMOUNT = 5;

        function enableNextButton(buttonId, enabled) {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = !enabled;
                if (enabled) {
                    button.style.transform = 'scale(1.02)';
                    setTimeout(() => {
                        button.style.transform = 'scale(1)';
                    }, 150);
                }
            }
        }

        function buildInitialRechargePayPalSdkUrl(clientId) {
            const sdkUrl = new URL('https://www.paypal.com/sdk/js');
            sdkUrl.searchParams.set('client-id', clientId);

            Object.entries(INITIAL_RECHARGE_PAYPAL_SDK_PARAMS).forEach(([key, value]) => {
                sdkUrl.searchParams.set(key, value);
            });

            return sdkUrl.toString();
        }

        function loadInitialRechargePayPalSdk() {
            if (!PAYPAL_CLIENT_ID) {
                return Promise.reject(new Error('Configura PAYPAL_CLIENT_ID en env-config.js para habilitar los pagos con PayPal.'));
            }

            if (typeof window.paypal !== 'undefined' && window.paypal?.Buttons) {
                return Promise.resolve();
            }

            if (initialRechargePayPalSdkPromise) {
                return initialRechargePayPalSdkPromise;
            }

            initialRechargePayPalSdkPromise = new Promise((resolve, reject) => {
                const existingScript = document.querySelector('script[data-paypal-sdk="initial-recharge"]');

                if (existingScript) {
                    if (existingScript.dataset.loaded === 'true') {
                        resolve();
                        return;
                    }

                    existingScript.addEventListener('load', () => {
                        existingScript.dataset.loaded = 'true';
                        resolve();
                    }, { once: true });

                    existingScript.addEventListener('error', () => {
                        reject(new Error('No se pudo cargar el SDK de PayPal. Verifica tu conexión e inténtalo nuevamente.'));
                    }, { once: true });
                    return;
                }

                const script = document.createElement('script');
                script.src = buildInitialRechargePayPalSdkUrl(PAYPAL_CLIENT_ID);
                script.async = true;
                script.dataset.paypalSdk = 'initial-recharge';

                script.addEventListener('load', () => {
                    script.dataset.loaded = 'true';
                    resolve();
                }, { once: true });

                script.addEventListener('error', () => {
                    script.remove();
                    reject(new Error('No se pudo cargar el SDK de PayPal. Verifica tu conexión e inténtalo nuevamente.'));
                }, { once: true });

                document.head.appendChild(script);
            }).catch(error => {
                initialRechargePayPalSdkPromise = null;
                throw error;
            });

            return initialRechargePayPalSdkPromise;
        }

        function updateInitialRechargePaymentStatus(message, type = 'info') {
            const statusElement = document.getElementById('initialRechargePaymentStatus');
            if (!statusElement) {
                return;
            }

            const statusClasses = [
                'initial-recharge-paypal__status--info',
                'initial-recharge-paypal__status--success',
                'initial-recharge-paypal__status--error'
            ];

            statusClasses.forEach(className => statusElement.classList.remove(className));

            if (message) {
                statusElement.textContent = message;
                statusElement.classList.add(`initial-recharge-paypal__status--${type}`);
            } else {
                statusElement.textContent = '';
            }
        }

        function showInitialRechargePayPalButtons() {
            const container = document.getElementById('initialRechargePayPalButtons');
            if (container) {
                container.hidden = false;
                container.innerHTML = '';
            }
        }

        function hideInitialRechargePayPalButtons() {
            const container = document.getElementById('initialRechargePayPalButtons');
            if (container) {
                container.hidden = true;
                container.innerHTML = '';
            }
        }

        function updateInitialRechargeConfirmAvailability(isValidAmount) {
            const confirmButton = document.getElementById('initialRechargeConfirm');
            if (!confirmButton) {
                return;
            }

            const canProceed = Boolean(isValidAmount) && Boolean(PAYPAL_CLIENT_ID);
            confirmButton.disabled = !canProceed;
        }

        function getInitialRechargeAmountChips() {
            return Array.from(document.querySelectorAll('[data-recharge-amount]'));
        }

        function syncInitialRechargeAmountChips(selectedAmount) {
            const chips = getInitialRechargeAmountChips();
            const hasSelection = Number.isFinite(selectedAmount);

            chips.forEach(chip => {
                const chipAmount = Number(chip.dataset.rechargeAmount);
                const isSelected = hasSelection && Math.abs(chipAmount - selectedAmount) < 0.01;

                chip.classList.toggle('initial-recharge-amount-chip--selected', isSelected);
                chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            });
        }

        function resetInitialRechargePayPalUi({ preserveStatus = false } = {}) {
            hideInitialRechargePayPalButtons();

            const confirmButton = document.getElementById('initialRechargeConfirm');
            const amountInput = document.getElementById('initialRechargeAmount');

            if (confirmButton) {
                confirmButton.style.display = 'inline-flex';
                confirmButton.removeAttribute('aria-busy');

                const currentAmount = amountInput
                    ? normalizeInitialRechargeAmount(amountInput.value)
                    : normalizeInitialRechargeAmount(registrationData.initialRechargeAmount);
                const isValid = currentAmount !== null &&
                    currentAmount >= MIN_INITIAL_RECHARGE_AMOUNT &&
                    currentAmount <= MAX_INITIAL_RECHARGE_AMOUNT;

                updateInitialRechargeConfirmAvailability(isValid);
            }

            if (!preserveStatus) {
                updateInitialRechargePaymentStatus('', 'info');
            }
        }

        function handleInitialRechargeAmountChange() {
            const buttonsContainer = document.getElementById('initialRechargePayPalButtons');
            if (buttonsContainer && !buttonsContainer.hidden) {
                resetInitialRechargePayPalUi({ preserveStatus: true });
                updateInitialRechargePaymentStatus(
                    'Monto actualizado. Vuelve a conectar con PayPal para confirmar la recarga.',
                    'info'
                );
            }
        }

        function normalizeInitialRechargeAmount(amount) {
            if (typeof amount === 'number' && isFinite(amount)) {
                return Math.round(amount * 100) / 100;
            }

            if (typeof amount === 'string') {
                const sanitized = amount.replace(/,/g, '.');
                const parsed = parseFloat(sanitized);
                if (!isNaN(parsed)) {
                    return Math.round(parsed * 100) / 100;
                }
            }

            return null;
        }

        function clampInitialRechargeAmount(amount) {
            const normalized = normalizeInitialRechargeAmount(amount);
            if (normalized === null) {
                return DEFAULT_INITIAL_RECHARGE_AMOUNT;
            }

            if (normalized < MIN_INITIAL_RECHARGE_AMOUNT) {
                return MIN_INITIAL_RECHARGE_AMOUNT;
            }

            if (normalized > MAX_INITIAL_RECHARGE_AMOUNT) {
                return MAX_INITIAL_RECHARGE_AMOUNT;
            }

            return normalized;
        }

        function getInitialRechargeAmount() {
            const amount = normalizeInitialRechargeAmount(registrationData.initialRechargeAmount);
            if (amount === null || amount <= 0) {
                return DEFAULT_INITIAL_RECHARGE_AMOUNT;
            }
            return clampInitialRechargeAmount(amount);
        }

        function setInitialRechargeAmount(amount) {
            const previousAmount = normalizeInitialRechargeAmount(registrationData.initialRechargeAmount);
            const finalAmount = clampInitialRechargeAmount(amount);

            registrationData.initialRechargeAmount = finalAmount;
            persistRegistrationData();
            updateInitialDepositHighlights();
            syncInitialRechargeAmountChips(finalAmount);

            if (previousAmount === null || Math.abs(finalAmount - previousAmount) > 0.0001) {
                handleInitialRechargeAmountChange();
            }

            return finalAmount;
        }

        function formatUsdAmount(amount) {
            const normalized = normalizeInitialRechargeAmount(amount);
            const value = normalized !== null ? normalized : DEFAULT_INITIAL_RECHARGE_AMOUNT;
            return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        function updateInitialDepositHighlights() {
            const amountLabel = document.getElementById('depositAmountValue');
            const actionLabel = document.getElementById('depositActionButtonLabel');
            const confirmationLabel = document.getElementById('depositConfirmationLabel');

            const formattedAmount = formatUsdAmount(getInitialRechargeAmount()).replace('$', '') + ' USD';

            if (amountLabel) {
                amountLabel.textContent = formattedAmount;
            }

            if (actionLabel) {
                actionLabel.textContent = `Realizar recarga de ${formattedAmount}`;
            }

            if (confirmationLabel) {
                confirmationLabel.textContent = `Confirmo que realizaré mi recarga inicial de ${formattedAmount} para activar mi cuenta.`;
            }
        }

        function updateCreateAccountAction() {
            const createBtn = document.getElementById('createAccountBtn');
            const label = document.getElementById('createAccountLabel');
            if (!createBtn || !label) {
                return;
            }

            const normalizedCountry = normalizeCountryCode(
                registrationData.country || storedLatamCountry
            );

            if (normalizedCountry !== 'VE') {
                label.textContent = 'Realizar la primera recarga';
                createBtn.onclick = startInitialRechargeFlow;
                if (typeof registrationData.initialRechargeAmount === 'undefined') {
                    registrationData.initialRechargeAmount = DEFAULT_INITIAL_RECHARGE_AMOUNT;
                }
            } else {
                label.textContent = 'Crear Cuenta';
                createBtn.onclick = submitRegistro;
            }
        }

        function handleInitialRechargeAmountInput(event) {
            const value = event.target.value;
            const normalized = normalizeInitialRechargeAmount(value);

            if (normalized !== null) {
                registrationData.initialRechargeAmount = normalized;
                syncInitialRechargeAmountChips(normalized);
            } else {
                syncInitialRechargeAmountChips(NaN);
            }

            handleInitialRechargeAmountChange();
            validateInitialRechargeAmount(false);
            persistRegistrationData();
        }

        function handleInitialRechargeAmountBlur(event) {
            const finalAmount = setInitialRechargeAmount(event.target.value);
            event.target.value = finalAmount.toFixed(2);
            validateInitialRechargeAmount(true);
        }

        function validateInitialRechargeAmount(showError = false) {
            const amountInput = document.getElementById('initialRechargeAmount');
            const errorElement = document.getElementById('initialRechargeAmountError');

            if (!amountInput) {
                return false;
            }

            const normalized = normalizeInitialRechargeAmount(amountInput.value);
            const isValid = normalized !== null &&
                normalized >= MIN_INITIAL_RECHARGE_AMOUNT &&
                normalized <= MAX_INITIAL_RECHARGE_AMOUNT;

            if (errorElement) {
                if (!isValid && showError) {
                    const errorMessage = MIN_INITIAL_RECHARGE_AMOUNT === MAX_INITIAL_RECHARGE_AMOUNT
                        ? `Ingresa el monto establecido de ${MIN_INITIAL_RECHARGE_AMOUNT} USD.`
                        : `Ingresa un monto válido entre ${MIN_INITIAL_RECHARGE_AMOUNT} y ${MAX_INITIAL_RECHARGE_AMOUNT} USD.`;
                    errorElement.textContent = errorMessage;
                    errorElement.style.display = 'block';
                } else {
                    errorElement.style.display = 'none';
                }
            }

            if (isValid) {
                registrationData.initialRechargeAmount = Math.round(normalized * 100) / 100;
                persistRegistrationData();
                updateInitialDepositHighlights();
            }

            enableNextButton('initialRechargeConfirm', isValid);
            updateInitialRechargeConfirmAvailability(isValid);
            return isValid;
        }

        function goDirectToStep(stepNumber) {
            if (isTransitioning) return;

            isTransitioning = true;
            currentStep = stepNumber;
            showStep(stepNumber);
            setTimeout(() => {
                isTransitioning = false;
            }, 350);
        }

        function prepareInitialRechargeStep() {
            const amountInput = document.getElementById('initialRechargeAmount');
            const amount = getInitialRechargeAmount();

            if (amountInput) {
                amountInput.value = amount.toFixed(2);
            }

            syncInitialRechargeAmountChips(amount);
            updateInitialDepositHighlights();
            const isValid = validateInitialRechargeAmount(false);

            if (!PAYPAL_CLIENT_ID) {
                const confirmButton = document.getElementById('initialRechargeConfirm');
                if (confirmButton) {
                    confirmButton.style.display = 'inline-flex';
                    confirmButton.disabled = true;
                }
                hideInitialRechargePayPalButtons();
                updateInitialRechargePaymentStatus(
                    'Configura PAYPAL_CLIENT_ID en env-config.js para habilitar los pagos con PayPal.',
                    'error'
                );
                return;
            }

            resetInitialRechargePayPalUi();
            updateInitialRechargePaymentStatus(
                'La recarga inicial es de 5 USD. Selecciona “Conectar con PayPal” para continuar.',
                'info'
            );

            if (!isValid) {
                updateInitialRechargeConfirmAvailability(false);
            }
        }

        function startInitialRechargeFlow() {
            const normalizedCountry = normalizeCountryCode(
                registrationData.country || storedLatamCountry
            );

            if (normalizedCountry === 'VE') {
                submitRegistro();
                return;
            }

            registrationData.initialRechargeConfirmed = false;
            registrationData.initialRechargeApproved = false;
            persistRegistrationData();
            awaitingInitialRechargeConfirmation = false;

            const introOverlay = document.getElementById('initialRechargeIntro');
            const introCta = document.getElementById('initialRechargeIntroCta');

            const proceedToRecharge = () => {
                prepareInitialRechargeStep();
                goDirectToStep(18);
                const amountInput = document.getElementById('initialRechargeAmount');
                if (amountInput) {
                    try {
                        amountInput.focus({ preventScroll: true });
                    } catch (error) {
                        amountInput.focus();
                    }
                }
            };

            if (
                initialRechargeIntroDismissed ||
                !introOverlay ||
                !introCta
            ) {
                proceedToRecharge();
                return;
            }

            introOverlay.classList.add('is-visible');
            introOverlay.setAttribute('aria-hidden', 'false');

            setTimeout(() => {
                try {
                    introCta.focus({ preventScroll: true });
                } catch (error) {
                    introCta.focus();
                }
            }, 60);

            const handleIntroCta = () => {
                introOverlay.classList.remove('is-visible');
                introOverlay.setAttribute('aria-hidden', 'true');
                try {
                    sessionStorage.setItem('initialRechargeIntroDismissed', 'true');
                } catch (error) {
                    // Session storage might be unavailable; ignore silently.
                }
                initialRechargeIntroDismissed = true;
                introCta.removeEventListener('click', handleIntroCta);
                proceedToRecharge();
            };

            introCta.addEventListener('click', handleIntroCta);
        }

        function returnToSummaryFromRecharge() {
            currentProcessingContext = 'registration';
            registrationData.initialRechargeConfirmed = false;
            registrationData.initialRechargeApproved = false;
            persistRegistrationData();
            resetInitialRechargePayPalUi();
            goDirectToStep(17);
            generateSummary();
            enableNextButton('createAccountBtn', (registrationData.nickname || '').trim().length >= 2);
            const processingStep = document.getElementById('step19');
            if (processingStep) {
                processingStep.removeAttribute('data-processing-context');
            }
        }

        function goToProcessingStep(context = 'registration') {
            currentProcessingContext = context;
            const processingTitle = document.getElementById('processingTitle');
            const processingDescription = document.getElementById('processingDescription');

            if (processingTitle && processingDescription) {
                if (context === 'recharge') {
                    processingTitle.textContent = 'Procesando tu recarga inicial...';
                    processingDescription.textContent = 'Estamos validando el pago y activando tus beneficios internacionales. Esto puede tardar unos segundos.';
                } else {
                    processingTitle.textContent = 'Creando tu cuenta...';
                    processingDescription.textContent = 'Estamos configurando tu cuenta Visa con la más alta seguridad. Esto tomará solo unos segundos.';
                }
            }

            goDirectToStep(19);

            if (context === 'recharge') {
                startRechargeProcessing();
            } else {
                awaitingInitialRechargeConfirmation = false;
                const processingStep = document.getElementById('step19');
                if (processingStep) {
                    processingStep.removeAttribute('data-processing-context');
                }
            }
        }

        function startRechargeProcessing() {
            awaitingInitialRechargeConfirmation = true;

            const processingDescription = document.getElementById('processingDescription');
            if (processingDescription) {
                processingDescription.textContent = 'Estamos validando el pago con PayPal y activando tus beneficios internacionales. Esto puede tardar unos segundos.';
            }

            const processingStep = document.getElementById('step19');
            if (processingStep) {
                processingStep.setAttribute('data-processing-context', 'recharge');
            }
        }

        async function renderInitialRechargePayPalButtons(amount) {
            if (typeof window.paypal === 'undefined' || !window.paypal?.Buttons) {
                throw new Error('PayPal SDK no está disponible en este momento.');
            }

            const container = document.getElementById('initialRechargePayPalButtons');
            if (!container) {
                throw new Error('No se encontró el contenedor de PayPal.');
            }

            const clampedAmount = clampInitialRechargeAmount(amount);
            const valueStr = clampedAmount.toFixed(2);
            const orderMetadata = {
                context: 'initial-recharge',
                amount: valueStr,
                currencyCode: 'USD',
                registration: {
                    firstName: registrationData.firstName || undefined,
                    lastName: registrationData.lastName || undefined,
                    fullName: `${registrationData.firstName || ''} ${registrationData.lastName || ''}`.trim() || undefined,
                    email: registrationData.email || undefined,
                    country: registrationData.country || storedLatamCountry || undefined
                }
            };

            const backendOrderPayload = {
                amount: valueStr,
                currencyCode: 'USD',
                description: 'Recarga inicial Visa Digital',
                metadata: orderMetadata
            };

            container.innerHTML = '';

            const buttons = window.paypal.Buttons({
                style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
                createOrder: () => {
                    return postJson('/api/paypal/create-order', backendOrderPayload)
                        .then(response => {
                            if (!response?.orderID) {
                                throw new Error('No se pudo iniciar el pago con PayPal.');
                            }
                            updateInitialRechargePaymentStatus('PayPal listo. Continúa en la ventana segura.', 'info');
                            return response.orderID;
                        })
                        .catch(error => {
                            console.error('Error al crear la orden de PayPal:', error);
                            updateInitialRechargePaymentStatus(
                                error?.message || 'No se pudo iniciar el pago con PayPal. Intenta nuevamente.',
                                'error'
                            );
                            throw error;
                        });
                },
                onApprove: data => {
                    updateInitialRechargePaymentStatus('Pago aprobado. Confirmando tu recarga…', 'info');
                    return postJson('/api/paypal/capture-order', {
                        orderID: data?.orderID,
                        payerID: data?.payerID,
                        metadata: orderMetadata
                    })
                        .then(() => {
                            registrationData.initialRechargeAmount = clampedAmount;
                            registrationData.initialRechargeConfirmed = true;
                            registrationData.initialRechargeApproved = true;
                            persistRegistrationData();
                            updateInitialRechargePaymentStatus('Recarga confirmada. Estamos activando tu cuenta.', 'success');
                            goToProcessingStep('recharge');
                            handleInitialRechargeApproval();
                        })
                        .catch(error => {
                            console.error('Error al capturar la orden de PayPal:', error);
                            registrationData.initialRechargeApproved = false;
                            registrationData.initialRechargeConfirmed = false;
                            persistRegistrationData();
                            updateInitialRechargePaymentStatus(
                                error?.message || 'Ocurrió un inconveniente al confirmar el pago. Intenta nuevamente.',
                                'error'
                            );
                            throw error;
                        });
                },
                onCancel: () => {
                    updateInitialRechargePaymentStatus('El pago fue cancelado. Puedes intentarlo nuevamente cuando lo desees.', 'info');
                },
                onError: err => {
                    console.error('Error de PayPal durante la recarga inicial:', err);
                    updateInitialRechargePaymentStatus('No pudimos procesar el pago. Intenta nuevamente.', 'error');
                }
            });

            await buttons.render(container);
            updateInitialRechargePaymentStatus('Selecciona el botón de PayPal para completar tu recarga.', 'info');
        }

        async function confirmInitialRecharge() {
            const isValid = validateInitialRechargeAmount(true);
            if (!isValid) {
                return;
            }

            if (!PAYPAL_CLIENT_ID) {
                updateInitialRechargePaymentStatus('Configura PAYPAL_CLIENT_ID en env-config.js para habilitar los pagos con PayPal.', 'error');
                return;
            }

            const amountInput = document.getElementById('initialRechargeAmount');
            const finalAmount = amountInput ? setInitialRechargeAmount(amountInput.value) : getInitialRechargeAmount();
            if (amountInput) {
                amountInput.value = finalAmount.toFixed(2);
            }

            registrationData.initialRechargeConfirmed = false;
            registrationData.initialRechargeApproved = false;
            persistRegistrationData();

            const confirmButton = document.getElementById('initialRechargeConfirm');
            const buttonsContainer = document.getElementById('initialRechargePayPalButtons');

            if (confirmButton) {
                confirmButton.disabled = true;
                confirmButton.setAttribute('aria-busy', 'true');
            }

            updateInitialRechargePaymentStatus('Conectando con PayPal…', 'info');
            showInitialRechargePayPalButtons();

            try {
                await loadInitialRechargePayPalSdk();
                if (typeof window.paypal === 'undefined' || !window.paypal?.Buttons) {
                    throw new Error('PayPal SDK no está disponible en este momento.');
                }

                await renderInitialRechargePayPalButtons(finalAmount);

                if (confirmButton) {
                    confirmButton.style.display = 'none';
                    confirmButton.removeAttribute('aria-busy');
                }
            } catch (error) {
                console.error('No fue posible inicializar PayPal para la recarga inicial:', error);
                updateInitialRechargePaymentStatus(
                    error?.message || 'No pudimos conectar con PayPal. Verifica tu conexión e inténtalo nuevamente.',
                    'error'
                );

                if (buttonsContainer) {
                    buttonsContainer.hidden = true;
                    buttonsContainer.innerHTML = '';
                }

                if (confirmButton) {
                    confirmButton.style.display = 'inline-flex';
                    confirmButton.disabled = false;
                    confirmButton.removeAttribute('aria-busy');
                }
            }
        }

        function completeInitialRechargeFlow() {
            awaitingInitialRechargeConfirmation = false;
            registrationData.initialRechargeConfirmed = true;
            registrationData.initialRechargeApproved = false;
            persistRegistrationData();
            currentProcessingContext = 'registration';
            const processingStep = document.getElementById('step19');
            if (processingStep) {
                processingStep.removeAttribute('data-processing-context');
            }
            cleanupTempData();
            location.replace('index.html');
        }

        function handleInitialRechargeApproval() {
            if (!registrationData.initialRechargeApproved) {
                registrationData.initialRechargeApproved = true;
                persistRegistrationData();
            }

            if (!awaitingInitialRechargeConfirmation && currentProcessingContext !== 'recharge') {
                return;
            }

            completeInitialRechargeFlow();
        }

        function clearProfilePhotoError() {
            const errorElement = document.getElementById('profilePhotoError');
            const inputElement = document.getElementById('profilePhotoInput');

            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }

            if (inputElement) {
                inputElement.classList.remove('error');
            }
        }

        function showProfilePhotoError(message) {
            const errorElement = document.getElementById('profilePhotoError');
            const inputElement = document.getElementById('profilePhotoInput');
            const previewElement = document.getElementById('profilePhotoPreview');
            const previewWrapper = document.getElementById('profilePhotoPreviewWrapper');

            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }

            if (inputElement) {
                inputElement.classList.add('error');
            }

            if (previewElement) {
                previewElement.removeAttribute('src');
                previewElement.style.display = 'none';
            }

            if (previewWrapper) {
                previewWrapper.style.display = 'none';
            }
        }

        function updateProfilePhotoPreview(dataUrl) {
            const previewElement = document.getElementById('profilePhotoPreview');
            const previewWrapper = document.getElementById('profilePhotoPreviewWrapper');

            if (!previewElement || !previewWrapper) return;

            if (dataUrl) {
                previewElement.src = dataUrl;
                previewElement.style.display = 'block';
                previewWrapper.style.display = 'flex';
            } else {
                previewElement.removeAttribute('src');
                previewElement.style.display = 'none';
                previewWrapper.style.display = 'none';
            }
        }

        function resetProfilePhotoState() {
            const inputElement = document.getElementById('profilePhotoInput');
            const isVenezuela = registrationData.country === 've';

            clearProfilePhotoError();

            if (inputElement) {
                inputElement.value = '';
                inputElement.classList.remove('error');
            }

            if (isVenezuela) {
                updateProfilePhotoPreview('');
            } else if (registrationData.profilePhoto) {
                updateProfilePhotoPreview(registrationData.profilePhoto);
            } else {
                updateProfilePhotoPreview('');
            }
        }

        function handleProfilePhotoChange(event) {
            const inputElement = event.target;
            const file = (inputElement?.files || [])[0];

            registrationData.profilePhoto = '';
            clearProfilePhotoError();

            if (!file) {
                updateProfilePhotoPreview('');
                persistRegistrationData();
                enableNextButton('avatarNext', false);
                return;
            }

            const normalizedType = (file.type || '').toLowerCase();

            if (!ALLOWED_PROFILE_PHOTO_TYPES.includes(normalizedType)) {
                showProfilePhotoError('Selecciona una imagen en formato JPG o PNG.');
                if (inputElement) {
                    inputElement.value = '';
                }
                persistRegistrationData();
                enableNextButton('avatarNext', false);
                return;
            }

            if (file.size > MAX_PROFILE_PHOTO_SIZE) {
                showProfilePhotoError('La imagen supera el tamaño máximo de 4 MB. Elige una foto más ligera.');
                if (inputElement) {
                    inputElement.value = '';
                }
                persistRegistrationData();
                enableNextButton('avatarNext', false);
                return;
            }

            const reader = new FileReader();

            reader.onload = function(loadEvent) {
                const result = loadEvent.target?.result;

                if (typeof result === 'string') {
                    registrationData.profilePhoto = result;
                    updateProfilePhotoPreview(result);
                    clearProfilePhotoError();
                    persistRegistrationData();
                    enableNextButton('avatarNext', true);
                    if (inputElement) {
                        inputElement.value = '';
                    }
                } else {
                    showProfilePhotoError('No pudimos leer tu imagen. Intenta con otro archivo.');
                    persistRegistrationData();
                    enableNextButton('avatarNext', false);
                    if (inputElement) {
                        inputElement.value = '';
                    }
                }
            };

            reader.onerror = function() {
                showProfilePhotoError('Ocurrió un error al cargar tu imagen. Intenta nuevamente.');
                persistRegistrationData();
                enableNextButton('avatarNext', false);
                if (inputElement) {
                    inputElement.value = '';
                }
            };

            enableNextButton('avatarNext', false);
            reader.readAsDataURL(file);
        }

        function setupRippleEffects() {
            document.addEventListener('click', function(e) {
                if (e.target.classList.contains('btn-primary') || e.target.closest('.btn-primary')) {
                    const button = e.target.closest('.btn') || e.target;
                    const ripple = button.querySelector('.btn-ripple');
                    
                    if (ripple) {
                        const rect = button.getBoundingClientRect();
                        const size = Math.max(rect.width, rect.height);
                        const x = e.clientX - rect.left - size / 2;
                        const y = e.clientY - rect.top - size / 2;
                        
                        ripple.style.width = ripple.style.height = size + 'px';
                        ripple.style.left = x + 'px';
                        ripple.style.top = y + 'px';
                        ripple.style.transform = 'scale(0)';
                        ripple.style.opacity = '0.6';
                        
                        requestAnimationFrame(() => {
                            ripple.style.transform = 'scale(1)';
                            ripple.style.opacity = '0';
                        });
                    }
                }
            });
        }

        function setupPinEvents() {
            // Para PIN principal
            const pinInputs = document.querySelectorAll('#pinInput .pin-digit');
            pinInputs.forEach((input, index) => {
                input.addEventListener('input', function() {
                    this.value = this.value.replace(/\D/g, '');
                    if (this.value.length > 1) {
                        this.value = this.value.slice(0, 1);
                    }
                    
                    if (this.value && index < 3) {
                        const nextInput = pinInputs[index + 1];
                        if (nextInput) nextInput.focus();
                    }
                    validatePin();
                });
                
                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Backspace' && !this.value && index > 0) {
                        const prevInput = pinInputs[index - 1];
                        if (prevInput) prevInput.focus();
                    }
                });
            });
            
            // Para PIN de confirmación
            const pinConfirmInputs = document.querySelectorAll('#pinConfirmInput .pin-digit');
            pinConfirmInputs.forEach((input, index) => {
                input.addEventListener('input', function() {
                    this.value = this.value.replace(/\D/g, '');
                    if (this.value.length > 1) {
                        this.value = this.value.slice(0, 1);
                    }
                    
                    if (this.value && index < 3) {
                        const nextInput = pinConfirmInputs[index + 1];
                        if (nextInput) nextInput.focus();
                    }
                    validatePin();
                });
                
                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Backspace' && !this.value && index > 0) {
                        const prevInput = pinConfirmInputs[index - 1];
                        if (prevInput) prevInput.focus();
                    }
                });
            });
        }

        function setupMobileEvents() {
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                document.body.style.fontSize = '16px';
                
                document.querySelectorAll('input[type="email"]').forEach(input => {
                    input.setAttribute('autocomplete', 'email');
                    input.setAttribute('autocapitalize', 'none');
                });
                
                document.querySelectorAll('input[type="password"]').forEach(input => {
                    input.setAttribute('autocomplete', 'current-password');
                });
            }
        }

        function checkExistingRegistration() {
            const saved = localStorage.getItem('visaRegistrationCompleted');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    if (data.completed) {
                        // Redirigir utilizando transitionGuardian
                        transitionGuardian.persistAndRedirect(data, data.useOldRecarga);
                        return;
                    }
                } catch (e) {
                    localStorage.removeItem('visaRegistrationCompleted');
                }
            }
        }

        function startRegistration() {
            const progressContainer = document.getElementById('progressContainer');
            if (progressContainer) {
                progressContainer.style.display = 'block';
                progressContainer.style.animation = 'slideInDown 0.5s ease';
            }
            if (!introMusicPlayed) {
                introMusicPlayed = true;
                const audio = document.getElementById('introMusic');
                if (audio) {
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(err => console.error('Audio playback failed:', err));
                    }
                }
            }
            nextStep();
        }

        function nextStep() {
            if (isTransitioning) return;
            
            if (!validateCurrentStep()) {
                console.log('Validación fallida en paso:', currentStep);
                showValidationError();
                return;
            }
            
            isTransitioning = true;
            saveCurrentStepData();
            
            const currentStepElement = document.getElementById(`step${currentStep}`);
            if (currentStepElement) {
                currentStepElement.style.transform = 'translateX(-100%)';
                currentStepElement.style.opacity = '0';
                
                setTimeout(() => {
                    currentStepElement.classList.remove('active');
                    currentStepElement.style.display = 'none';
                    currentStepElement.style.transform = 'translateX(0)';
                    currentStepElement.style.opacity = '1';
                    
                    currentStep++;

                    if (registrationData.country !== 've') {
                        while (currentStep === 5 || currentStep === 8) {
                            currentStep++;
                        }
                    } else {
                        while (currentStep === 18) {
                            currentStep++;
                        }
                    }

                    if (currentStep > 20) {
                        currentStep = 20;
                    }

                    showStep(currentStep);
                    isTransitioning = false;
                }, 300);
            } else {
                currentStep++;
                if (registrationData.country !== 've') {
                    while (currentStep === 5 || currentStep === 8) {
                        currentStep++;
                    }
                } else {
                    while (currentStep === 18) {
                        currentStep++;
                    }
                }
                if (currentStep > 20) {
                    currentStep = 20;
                }
                showStep(currentStep);
                isTransitioning = false;
            }
        }

        function showValidationError() {
            const currentStepElement = document.getElementById(`step${currentStep}`);
            if (currentStepElement) {
                currentStepElement.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    currentStepElement.style.animation = '';
                }, 500);
            }
        }

        function validateCurrentStep() {
            console.log('Validando paso:', currentStep);
            
            switch(currentStep) {
                case 0:
                    return true;
                case 1:
                    const firstName = document.getElementById('firstName');
                    const lastName = document.getElementById('lastName');
                    return firstName && lastName && 
                           firstName.value.trim().length >= 2 && 
                           lastName.value.trim().length >= 2 &&
                           /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(firstName.value.trim()) &&
                           /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(lastName.value.trim());
                case 2:
                    return !!(registrationData.preferredName && registrationData.gender);
                case 3:
                    const birthDay = document.getElementById('birthDay');
                    const birthMonth = document.getElementById('birthMonth');
                    const birthYear = document.getElementById('birthYear');
                    if (!birthDay || !birthMonth || !birthYear) return false;
                    
                    const day = parseInt(birthDay.value);
                    const month = parseInt(birthMonth.value);
                    const year = parseInt(birthYear.value);
                    
                    if (!day || !month || !year) return false;
                    
                    const birthDate = new Date(year, month - 1, day);
                    const today = new Date();
                    const age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    
                    const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
                        ? age - 1 : age;
                    
                    return finalAge >= 18;
                case 4:
                    return !!registrationData.country;
                case 5:
                    if (registrationData.country !== 've') return true;
                    return !!registrationData.state;
                case 6:
                    console.log('Validando documento paso 6:', registrationData);
                    return !!(registrationData.documentType && registrationData.documentNumberValid);
                case 7:
                    const email = document.getElementById('email');
                    const emailConfirm = document.getElementById('emailConfirm');
                    if (!email || !emailConfirm) return false;
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return email.value === emailConfirm.value && emailRegex.test(email.value);
                case 8:
                    if (registrationData.country !== 've') return true;
                    const verificationCode = document.getElementById('verificationCode');
                    return verificationCode && isValidVerificationCode(verificationCode.value);
                case 9: {
                    const normalized = (registrationData.country || '').toLowerCase();
                    const operatorConfig = getOperatorConfigForCountry(normalized);
                    if (operatorConfig && Array.isArray(operatorConfig.operators) && operatorConfig.operators.length > 0) {
                        const nationalDigits = (registrationData.nationalPhoneNumber || '').replace(/\D/g, '');
                        const nsnMax = operatorConfig.nsnMax || 0;
                        const lengthValid = nsnMax > 0 ? nationalDigits.length === nsnMax : nationalDigits.length > 0;
                        return !!(registrationData.operator && lengthValid);
                    }
                    const internationalDigits = (registrationData.fullPhoneNumber || '').replace(/\D/g, '');
                    return internationalDigits.length >= 8 && internationalDigits.length <= 15;
                }
                case 10:
                    const password = document.getElementById('password');
                    const passwordConfirm = document.getElementById('passwordConfirm');
                    if (!password || !passwordConfirm) return false;
                    const passwordStrong = password.value.length >= 8 && 
                                         /[a-z]/.test(password.value) && 
                                         /[A-Z]/.test(password.value) && 
                                         /\d/.test(password.value) && 
                                         /[!@#$%^&*(),.?":{}|<>]/.test(password.value);
                    return passwordStrong && password.value === passwordConfirm.value;
                case 11:
                    const pinInputs = document.querySelectorAll('#pinInput .pin-digit');
                    const pinConfirmInputs = document.querySelectorAll('#pinConfirmInput .pin-digit');
                    const pin = Array.from(pinInputs).map(input => input.value).join('');
                    const pinConfirm = Array.from(pinConfirmInputs).map(input => input.value).join('');
                    return pin.length === 4 && pin === pinConfirm;
                case 12:
                    return !!(registrationData.securityQuestion && registrationData.securityAnswer && 
                             registrationData.securityAnswer.length >= 3);
                case 13:
                    return selectedAccountUses.length > 0;
                case 14:
                    return !!registrationData.primaryBank;
                case 15:
                    if (registrationData.country === 've') return true;
                    return !!registrationData.profilePhoto;
                case 16:
                    return !!registrationData.cardName;
                case 17:
                case 18:
                case 19:
                case 20:
                    return true;
                default:
                    return true;
            }
        }

        function previousStep() {
            if (isTransitioning || currentStep <= 1) return;
            isTransitioning = true;
            
            const currentStepElement = document.getElementById(`step${currentStep}`);
            if (currentStepElement) {
                currentStepElement.style.transform = 'translateX(100%)';
                currentStepElement.style.opacity = '0';
                
                setTimeout(() => {
                    currentStepElement.classList.remove('active');
                    currentStepElement.style.display = 'none';
                    currentStepElement.style.transform = 'translateX(0)';
                    currentStepElement.style.opacity = '1';
                    
                    currentStep--;

                    if (registrationData.country !== 've') {
                        while (currentStep === 5 || currentStep === 8) {
                            currentStep--;
                        }
                    } else {
                        while (currentStep === 18) {
                            currentStep--;
                        }
                    }

                    showStep(currentStep);
                    updatePersonalizedTitles();
                    isTransitioning = false;
                }, 300);
            } else {
                currentStep--;
                if (registrationData.country !== 've') {
                    while (currentStep === 5 || currentStep === 8) {
                        currentStep--;
                    }
                } else {
                    while (currentStep === 18) {
                        currentStep--;
                    }
                }
                showStep(currentStep);
                updatePersonalizedTitles();
                isTransitioning = false;
            }
        }

        function showStep(stepNumber) {
            console.log('Mostrando paso:', stepNumber);
            
            document.querySelectorAll('.step').forEach(step => {
                step.classList.remove('active');
                step.style.display = 'none';
            });
            
            const stepElement = document.getElementById(`step${stepNumber}`);
            if (stepElement) {
                const isVenezuela = registrationData.country === 've';
                if (stepNumber === 8) {
                    if (isVenezuela) {
                        stepElement.style.display = 'flex';
                    } else {
                        currentStep = 9;
                        showStep(9);
                        return;
                    }
                } else {
                    if (stepNumber === 5) {
                        updateStateStepLayout(registrationData.country);
                    }
                    stepElement.style.display = 'flex';
                }
                
                stepElement.style.transform = 'translateX(100%)';
                stepElement.style.opacity = '0';
                
                requestAnimationFrame(() => {
                    stepElement.classList.add('active');
                    stepElement.style.transform = 'translateX(0)';
                    stepElement.style.opacity = '1';
                    stepElement.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    
                    updateProgress();
                    handleStepLogic();
                });
            }
        }

        function updateProgress() {
            const isVenezuela = registrationData.country === 've';
            const baseTotalSteps = 18;
            const totalSteps = isVenezuela ? baseTotalSteps : baseTotalSteps - 1;

            let adjustedStep = currentStep;
            if (!isVenezuela && currentStep > 8) {
                adjustedStep -= 1;
            }

            const progress = Math.round(((adjustedStep - 1) / (totalSteps - 1)) * 100);

            const progressFill = document.getElementById('progressFill');
            const progressPercentage = document.getElementById('progressPercentage');

            if (progressFill) {
                progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
                progressFill.style.transition = 'width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            }
            if (progressPercentage) {
                progressPercentage.textContent = `${Math.max(0, Math.min(100, progress))}%`;
            }
        }

        function updateStepVisibility() {
            const step8 = document.getElementById('step8');
            if (!step8) return;

            if (registrationData.country === 've') {
                if (step8.style.display === 'none') {
                    step8.style.display = '';
                }
            } else {
                step8.style.display = 'none';
            }

            updateDocumentUploadVisibility();
        }

        function saveCurrentStepData() {
            switch(currentStep) {
                case 1:
                    const firstName = document.getElementById('firstName');
                    const lastName = document.getElementById('lastName');
                    if (firstName) registrationData.firstName = firstName.value.trim();
                    if (lastName) registrationData.lastName = lastName.value.trim();
                    if (firstName && lastName) {
                        registrationData.fullName = `${firstName.value.trim()} ${lastName.value.trim()}`.trim();
                    }
                    break;
                case 3:
                    const birthDay = document.getElementById('birthDay');
                    const birthMonth = document.getElementById('birthMonth');
                    const birthYear = document.getElementById('birthYear');
                    if (birthDay) registrationData.birthDay = birthDay.value;
                    if (birthMonth) registrationData.birthMonth = birthMonth.value;
                    if (birthYear) registrationData.birthYear = birthYear.value;
                    break;
                case 4:
                    const country = document.getElementById('country');
                    if (country) registrationData.country = country.value;
                    break;
                case 5: {
                    if ((registrationData.country || '').toLowerCase() === 've') {
                        const state = document.getElementById('state');
                        if (state) {
                            registrationData.state = state.value;
                        }
                        registrationData.initialDepositConfirmed = false;
                    } else {
                        const depositConfirmation = document.getElementById('depositConfirmation');
                        registrationData.initialDepositConfirmed = depositConfirmation ? depositConfirmation.checked : false;
                        registrationData.state = '';
                    }
                    break;
                }
                case 7:
                    const email = document.getElementById('email');
                    if (email) registrationData.email = email.value;
                    break;
                case 8:
                    if (registrationData.country === 've') {
                        const verificationCodeElement = document.getElementById('verificationCode');
                        if (verificationCodeElement) {
                            const codeValue = verificationCodeElement.value;
                            registrationData.verificationCode = codeValue;
                            registrationData.useOldRecarga = !isHourlyVerificationCode(codeValue);
                            persistExchangeRateFromCode(codeValue);
                        }
                    } else {
                        delete registrationData.verificationCode;
                        registrationData.useOldRecarga = true;
                    }
                    break;
                case 10:
                    const password = document.getElementById('password');
                    if (password) registrationData.password = password.value;
                    break;
                case 11:
                    const pinInputs = document.querySelectorAll('#pinInput .pin-digit');
                    if (pinInputs.length > 0) {
                        registrationData.pin = Array.from(pinInputs).map(input => input.value).join('');
                    }
                    break;
                case 13:
                    registrationData.accountUses = [...selectedAccountUses];
                    break;
            }

            persistRegistrationData();
        }

        function handleStepLogic() {
            switch(currentStep) {
                case 2:
                    generateNameOptions();
                    updatePersonalizedTitles();
                    break;
                case 3:
                    updatePersonalizedTitles();
                    break;
                case 4:
                    updatePersonalizedTitles();
                    break;
                case 5:
                    updateStateStepLayout(registrationData.country);
                    updatePersonalizedTitles();
                    break;
                case 6:
                    updatePersonalizedTitles();
                    break;
                case 7:
                    updatePersonalizedTitles();
                    break;
                case 8:
                    if (registrationData.country === 've') {
                        showEmailVerificationMessage();
                    }
                    updatePersonalizedTitles();
                    break;
                case 9:
                    updatePhoneStepLayout(registrationData.country);
                    updatePersonalizedTitles();
                    break;
                case 10:
                    updatePersonalizedTitles();
                    break;
                case 11:
                    updatePersonalizedTitles();
                    setTimeout(() => {
                        const firstPin = document.querySelector('#pinInput .pin-digit');
                        if (firstPin) firstPin.focus();
                    }, 100);
                    break;
                case 12:
                    updatePersonalizedTitles();
                    updatePersonalizedQuestions();
                    break;
                case 13:
                    updatePersonalizedTitles();
                    break;
                case 14:
                    updatePersonalizedTitles();
                    break;
                case 15: {
                    const isVenezuela = registrationData.country === 've';
                    const avatarMessage = document.getElementById('avatarVenezuelaMessage');
                    const avatarUploadSection = document.getElementById('avatarUploadSection');

                    resetProfilePhotoState();

                    if (avatarMessage) {
                        avatarMessage.style.display = isVenezuela ? 'block' : 'none';
                    }

                    if (avatarUploadSection) {
                        avatarUploadSection.style.display = isVenezuela ? 'none' : 'flex';
                    }

                    if (isVenezuela) {
                        registrationData.profilePhoto = '';
                        updateProfilePhotoPreview('');
                        enableNextButton('avatarNext', true);
                    } else {
                        enableNextButton('avatarNext', !!registrationData.profilePhoto);
                    }

                    updatePersonalizedTitles();
                    persistRegistrationData();
                    break;
                }
                case 16:
                    updatePersonalizedTitles();
                    break;
                case 17:
                    generateSummary();
                    updatePersonalizedTitles();
                    break;
                case 18:
                    prepareInitialRechargeStep();
                    updatePersonalizedTitles();
                    break;
                case 19:
                    updatePersonalizedTitles();
                    if (currentProcessingContext === 'registration') {
                        setTimeout(() => {
                            nextStep();
                        }, 3000);
                    }
                    break;
                case 20:
                    showWelcomeMessage();
                    const progressContainer = document.getElementById('progressContainer');
                    if (progressContainer) {
                        progressContainer.style.animation = 'slideOutUp 0.5s ease';
                        setTimeout(() => {
                            progressContainer.style.display = 'none';
                        }, 500);
                    }
                    break;
            }
        }

        function updatePersonalizedTitles() {
            const preferredName = registrationData.preferredName || '';

            if (!preferredName) return;

            const selectedCountryCode = normalizeCountryCode(registrationData.country || storedLatamCountry);
            const effectiveCountry = getEffectiveCountryConfig(selectedCountryCode);
            const stateCountryName = effectiveCountry?.name || getCountryDisplayName(selectedCountryCode);
            const isVenezuela = selectedCountryCode === 'VE';
            const bankCountryName = getCountryDisplayName(selectedCountryCode);

            const initialRechargeLabel = formatUsdAmount(getInitialRechargeAmount());

            const personalizedTitles = {
                2: `¡Hola! ¿Cómo prefieres que te llamemos?`,
                3: `${preferredName}, ¿cuál es tu fecha de nacimiento?`,
                4: `${preferredName}, ¿en qué país resides actualmente?`,
                5: isVenezuela
                    ? `${preferredName}, ¿en qué estado de ${stateCountryName} vives?`
                    : `${preferredName}, activa tu cuenta con tu primera recarga`,
                6: `${preferredName}, ¿con qué documento te vas a identificar?`,
                7: `${preferredName}, ¿cuál es tu correo electrónico?`,
                8: `${preferredName}, verifica tu correo electrónico`,
                9: `${preferredName}, ¿cuál es tu número de teléfono?`,
                10: `${preferredName}, crea tu contraseña`,
                11: `${preferredName}, crea tu PIN de seguridad`,
                12: `${preferredName}, configura tu pregunta de seguridad`,
                13: `${preferredName}, ¿para qué usarás tu cuenta?`,
                14: `${preferredName}, ¿cuál es tu banco principal en ${bankCountryName}?`,
                15: isVenezuela
                    ? `${preferredName}, solicitaremos tu foto más adelante`
                    : `${preferredName}, define tu foto de perfil`,
                16: `${preferredName}, revisa tu información`,
                17: `${preferredName}, revisa tu información`,
                18: `${preferredName}, confirma tu recarga inicial`,
                19: currentProcessingContext === 'recharge'
                    ? `${preferredName}, estamos procesando tu recarga`
                    : `Creando tu cuenta ${preferredName}...`
            };

            const personalizedDescriptions = {
                3: `${preferredName}, necesitamos verificar tu edad para abrir tu cuenta`,
                5: isVenezuela
                    ? 'Selecciona el estado donde tienes tu residencia principal'
                    : `Realiza una recarga inicial de ${initialRechargeLabel} para habilitar retiros, tarjetas y promociones internacionales.`
            };

            personalizedDescriptions[18] = `Confirma tu recarga inicial de ${initialRechargeLabel}.`;
            personalizedDescriptions[19] = currentProcessingContext === 'recharge'
                ? `Validamos tu recarga de ${initialRechargeLabel} para activar todos tus beneficios internacionales. Esto tomará solo unos segundos.`
                : 'Estamos configurando tu cuenta Visa con la más alta seguridad. Esto tomará solo unos segundos.';

            personalizedDescriptions[15] = isVenezuela
                ? 'En la recarga inicial te pediremos tu foto de perfil para completar la verificación. Continúa con el registro y ten a mano una imagen nítida de tu rostro para ese momento.'
                : 'Sube una imagen clara de tu rostro en formato JPG o PNG. El tamaño máximo permitido es de 4 MB.';
            
            if (personalizedTitles[currentStep]) {
                const titleElement = document.getElementById(`${getStepElementId(currentStep)}Title`);
                if (titleElement) {
                    titleElement.textContent = personalizedTitles[currentStep];
                }
            }
            
            if (personalizedDescriptions[currentStep]) {
                const descElement = document.getElementById(`${getStepElementId(currentStep)}Description`);
                if (descElement) {
                    descElement.textContent = personalizedDescriptions[currentStep];
                }
            }
        }

        function getStepElementId(step) {
            const stepIds = {
                2: 'namePreference',
                3: 'birthdate',
                4: 'country',
                5: 'state',
                6: 'document',
                7: 'email',
                8: 'verification',
                9: 'phone',
                10: 'password',
                11: 'pin',
                12: 'security',
                13: 'accountUse',
                14: 'bank',
                15: 'avatar',
                16: 'summary',
                17: 'summary',
                18: 'initialRecharge',
                19: 'processing',
                20: 'welcome'
            };
            return stepIds[step] || '';
        }

        // Validaciones
        function formatName(value) {
            const hasTrailingSpace = /\s$/.test(value);
            const sanitized = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            const formatted = sanitized
                .toLowerCase()
                .split(' ')
                .filter(word => word)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            return hasTrailingSpace ? formatted + ' ' : formatted;
        }

        function formatNameInput(event) {
            event.target.value = formatName(event.target.value);
        }

        function validateNames() {
            const firstName = document.getElementById('firstName');
            const lastName = document.getElementById('lastName');
            const nameNext = document.getElementById('nameNext');

            if (!firstName || !lastName || !nameNext) return;

            firstName.value = formatName(firstName.value);
            lastName.value = formatName(lastName.value);

            const firstNameValue = firstName.value.trim();
            const lastNameValue = lastName.value.trim();
            const isValid = firstNameValue.length >= 2 && lastNameValue.length >= 2 &&
                           /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(firstNameValue) &&
                           /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(lastNameValue);
            
            enableNextButton('nameNext', isValid);
            
            if (isValid) {
                firstName.classList.add('success');
                lastName.classList.add('success');
                firstName.classList.remove('error');
                lastName.classList.remove('error');
            } else {
                firstName.classList.remove('success');
                lastName.classList.remove('success');
                if (firstNameValue.length > 0 && firstNameValue.length < 2) {
                    firstName.classList.add('error');
                }
                if (lastNameValue.length > 0 && lastNameValue.length < 2) {
                    lastName.classList.add('error');
                }
            }
        }

        function generateNameOptions() {
            const firstName = registrationData.firstName;
            if (!firstName) return;
            
            const names = firstName.split(' ').filter(name => name.trim());
            const nameOptions = document.getElementById('nameOptions');
            
            if (!nameOptions) return;
            nameOptions.innerHTML = '';
            
            names.forEach(name => {
                if (name.trim()) {
                    const option = document.createElement('div');
                    option.className = 'option-card';
                    option.dataset.name = name.trim();
                    option.innerHTML = `
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span class="label">${name.trim()}</span>
                    `;
                    option.addEventListener('click', () => selectPreferredName(name.trim()));
                    nameOptions.appendChild(option);
                }
            });
        }

        function selectPreferredName(name) {
            const nameOptions = document.getElementById('nameOptions');
            if (nameOptions) {
                nameOptions.querySelectorAll('.option-card').forEach(card => {
                    card.classList.remove('selected');
                });
                
                const cards = nameOptions.querySelectorAll('.option-card');
                cards.forEach(card => {
                    const label = card.querySelector('.label');
                    if (label && label.textContent === name) {
                        card.classList.add('selected');
                        card.style.transform = 'scale(1.05)';
                        setTimeout(() => {
                            card.style.transform = 'scale(1)';
                        }, 150);
                    }
                });
            }
            
            registrationData.preferredName = name;
            checkGenderSelection();
            persistRegistrationData();
        }

        function selectGender(gender) {
            const step2 = document.getElementById('step2');
            if (step2) {
                step2.querySelectorAll('[data-gender]').forEach(card => {
                    card.classList.remove('selected');
                });
                
                const selectedCard = step2.querySelector(`[data-gender="${gender}"]`);
                if (selectedCard) {
                    selectedCard.classList.add('selected');
                    selectedCard.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                        selectedCard.style.transform = 'scale(1)';
                    }, 150);
                }
            }
            
            registrationData.gender = gender;
            checkGenderSelection();
            persistRegistrationData();
        }

        function checkGenderSelection() {
            const hasName = registrationData.preferredName;
            const hasGender = registrationData.gender;
            enableNextButton('genderNext', !!(hasName && hasGender));
        }

        function enforceDayLimit(event) {
            const input = event.target;
            const value = parseInt(input.value);
            if (value > 31) {
                input.value = 31;
            } else if (value < 1) {
                input.value = '';
            }
        }

        function validateBirthdate() {
            const birthDay = document.getElementById('birthDay');
            const birthMonth = document.getElementById('birthMonth');
            const birthYear = document.getElementById('birthYear');
            const ageConfirmation = document.getElementById('ageConfirmation');
            const birthdateNext = document.getElementById('birthdateNext');
            
            if (!birthDay || !birthMonth || !birthYear || !ageConfirmation || !birthdateNext) return;
            
            const day = parseInt(birthDay.value);
            const month = parseInt(birthMonth.value);
            const year = parseInt(birthYear.value);
            
            if (day && month && year) {
                const birthDate = new Date(year, month - 1, day);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                
                const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
                    ? age - 1 : age;
                
                const preferredName = registrationData.preferredName || 'usuario';
                
                if (finalAge >= 16 && finalAge <= 85) {
                    ageConfirmation.innerHTML = `
                        <div class="personalized-message success">
                            ¡Perfecto ${preferredName}! Tienes ${finalAge} años. Cumples con el requisito de edad para abrir tu cuenta.
                        </div>
                    `;
                    ageConfirmation.style.display = 'block';
                    enableNextButton('birthdateNext', true);
                } else {
                    ageConfirmation.innerHTML = `
                        <div class="error-message">
                            Lo sentimos ${preferredName}, debes tener entre 16 y 85 años para abrir una cuenta. Por favor verifica tu fecha de nacimiento.
                        </div>
                    `;
                    ageConfirmation.style.display = 'block';
                    enableNextButton('birthdateNext', false);
                }
            } else {
                ageConfirmation.style.display = 'none';
                enableNextButton('birthdateNext', false);
            }
        }

        async function handleCountryChange() {
            const country = document.getElementById('country');
            const countryMessage = document.getElementById('countryMessage');
            const countryNext = document.getElementById('countryNext');
            const stateSelect = document.getElementById('state');

            if (!country || !countryMessage || !countryNext) return;

            const preferredName = registrationData.preferredName || 'usuario';
            const allowedCountry = (storedLatamCountry || '').toLowerCase();
            const isAllowed = allowedCountry && !!COUNTRY_DATA[allowedCountry];

            if (
                currentStep > 0 &&
                allowedCountry &&
                registrationData.country &&
                registrationData.country !== allowedCountry
            ) {
                resetRegistrationFlow(allowedCountry);
                return;
            }

            let countryValue = (country.value || '').toLowerCase();

            if (!isAllowed) {
                countryValue = '';
            } else if (countryValue !== allowedCountry) {
                countryValue = allowedCountry;
                if (country.value !== allowedCountry) {
                    country.value = allowedCountry;
                }
            }

            countryMessage.style.display = 'none';
            countryMessage.innerHTML = '';

            if (countryValue) {
                if (countryValue === 've') {
                    countryMessage.innerHTML = `
                        <div class="personalized-message">
                            ¡Excelente ${preferredName}! Al estar en Venezuela, tus servicios estarán disponibles en BS y USD. Podrás retirar fondos hacia tu banco nacional y acceder a todos nuestros servicios locales.
                        </div>
                    `;
                    countryMessage.style.display = 'block';
                    countryMessage.style.animation = 'slideInDown 0.5s ease';
                } else {
                    const countryInfo = COUNTRY_DATA[countryValue];
                    if (countryInfo) {
                        countryMessage.innerHTML = `
                            <div class="personalized-message">
                                ${countryInfo.flag} ¡Perfecto ${preferredName}! Configuraremos tu cuenta para ${countryInfo.name}.
                            </div>
                        `;
                        countryMessage.style.display = 'block';
                        countryMessage.style.animation = 'slideInDown 0.5s ease';
                    }
                }
            }

            const isValidSelection = isAllowed && countryValue === allowedCountry;
            registrationData.country = isValidSelection ? countryValue : '';

            const previousState = registrationData.state;
            const effectiveCountryConfig = getEffectiveCountryConfig(countryValue);
            const stateCountryName = effectiveCountryConfig?.name || getCountryDisplayName(countryValue);

            updateStateTitleCountryName(stateCountryName);
            updateStepVisibility();

            if (stateSelect) {
                populateStateOptions(stateSelect, effectiveCountryConfig?.states || [], previousState);
            } else {
                registrationData.state = '';
            }

            updateStateStepLayout(registrationData.country || countryValue);

            enableNextButton('countryNext', isValidSelection);
            updatePhoneStepLayout(registrationData.country || countryValue);

            await ensureIdentityDocumentConfigs();
            updateDocumentTypeOptionsForCountry(registrationData.country || countryValue);

            if (registrationData.documentType && registrationData.country) {
                selectDocumentType(registrationData.documentType, { skipReload: true });
            } else {
                currentDocumentValidationRules = null;
            }

            await populateBankOptions();
            updateBankStepTitles(registrationData.country || countryValue);
            initializeBankLogoPreview();
            updateBankNextState();
            updatePersonalizedTitles();
            updateDocumentUploadVisibility();
            persistRegistrationData();
        }

        function selectDocumentType(type, options = {}) {
            console.log('Seleccionando tipo de documento:', type);

            const skipReload = !!options.skipReload;
            const previousType = registrationData.documentType;
            const previousValue = registrationData.documentNumber || '';
            const iso = (registrationData.country || storedLatamCountry).toLowerCase();
            const shouldPreserveValue = !!options.preserveValue || skipReload || previousType === type;
            const isVenezuelan = !iso || iso === 've';

            if (!skipReload && !isVenezuelan) {
                const hasConfig = identityDocumentConfigsByIso && getIdentityDocumentConfigForCountry(iso);
                if (!hasConfig) {
                    ensureIdentityDocumentConfigs().then(() => {
                        if (registrationData.documentType === type) {
                            selectDocumentType(type, { skipReload: true, preserveValue: true });
                        }
                    });
                }
            }

            const step6 = document.getElementById('step6');
            if (step6) {
                step6.querySelectorAll('[data-document-type]').forEach(card => {
                    card.classList.remove('selected');
                });

                const selectedCard = step6.querySelector(`[data-document-type="${type}"]`);
                if (selectedCard) {
                    selectedCard.classList.add('selected');
                    selectedCard.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                        selectedCard.style.transform = 'scale(1)';
                    }, 150);
                }
            }

            registrationData.documentType = type;
            registrationData.documentNumberValid = false;

            const documentNumberGroup = document.getElementById('documentNumberGroup');
            const documentLabel = document.getElementById('documentLabel');
            const documentNumber = document.getElementById('documentNumber');

            if (!documentNumberGroup || !documentLabel || !documentNumber) return;

            const fieldSettings = getDocumentFieldSettings(type, {
                countryIso: iso,
                previousValue,
                preserveValue: shouldPreserveValue
            });

            documentNumberGroup.style.display = 'block';
            documentNumberGroup.style.animation = 'slideInDown 0.3s ease';

            const labelText = fieldSettings?.label || DEFAULT_DOCUMENT_FIELD_LABELS[type] || 'Número del documento';
            documentLabel.textContent = labelText;
            documentNumber.placeholder = fieldSettings?.placeholder || '';

            if (fieldSettings?.inputMode) {
                documentNumber.setAttribute('inputmode', fieldSettings.inputMode);
            } else {
                documentNumber.setAttribute('inputmode', 'text');
            }

            if (typeof fieldSettings?.maxLength === 'number' && fieldSettings.maxLength > 0) {
                documentNumber.maxLength = fieldSettings.maxLength;
            } else {
                documentNumber.removeAttribute('maxLength');
            }

            documentNumber.value = fieldSettings?.value || '';

            const newDocumentNumber = documentNumber.cloneNode(true);
            newDocumentNumber.classList.remove('success');
            newDocumentNumber.classList.remove('error');
            documentNumber.parentNode.replaceChild(newDocumentNumber, documentNumber);

            const validation = fieldSettings?.validation || createGenericDocumentValidationForDocType(type);
            if (validation) {
                validation.docType = type;
                validation.isVenezuelan = isVenezuelan;
                currentDocumentValidationRules = validation;
            } else {
                currentDocumentValidationRules = null;
            }

            newDocumentNumber.addEventListener('input', function() {
                validateDocumentNumber.call(this);
            });

            registrationData.documentNumber = newDocumentNumber.value;

            setTimeout(() => {
                newDocumentNumber.focus();
                newDocumentNumber.setSelectionRange(newDocumentNumber.value.length, newDocumentNumber.value.length);
            }, 100);

            validateDocumentNumber.call(newDocumentNumber);
            persistRegistrationData();
            updateDocumentUploadVisibility();
        }

        function validateDocumentNumber() {
            const docType = registrationData.documentType;
            if (!docType) return;

            const iso = (registrationData.country || storedLatamCountry).toLowerCase();
            const isVenezuelan = !iso || iso === 've';

            let validation = currentDocumentValidationRules;
            if (!validation || validation.docType !== docType || validation.isVenezuelan !== isVenezuelan) {
                const fallbackSettings = getDocumentFieldSettings(docType, {
                    countryIso: iso,
                    previousValue: registrationData.documentNumber || this.value || '',
                    preserveValue: true
                });
                validation = fallbackSettings?.validation || (isVenezuelan
                    ? createVenezuelanDocumentValidation(docType)
                    : createGenericDocumentValidationForDocType(docType));
                if (validation) {
                    validation.docType = docType;
                    validation.isVenezuelan = isVenezuelan;
                }
                currentDocumentValidationRules = validation;
            }

            let result;
            if (validation && typeof validation.evaluate === 'function') {
                result = validation.evaluate(this.value);
            } else {
                const sanitized = (this.value || '').toString().trim();
                result = {
                    sanitized,
                    isValid: sanitized.length >= 4
                };
            }

            const sanitizedValue = result?.sanitized ?? '';
            this.value = sanitizedValue;
            registrationData.documentNumber = sanitizedValue;

            const isValid = !!(result && result.isValid);
            registrationData.documentNumberValid = isValid;

            console.log('Validando documento:', {
                value: sanitizedValue,
                country: iso,
                docType,
                isValid
            });

            if (isValid) {
                this.classList.add('success');
                this.classList.remove('error');
            } else {
                this.classList.remove('success');
                let hasMeaningfulLength = sanitizedValue.length > 0;
                if (validation && typeof validation.prefix === 'string') {
                    hasMeaningfulLength = sanitizedValue.length > validation.prefix.length;
                }
                if (hasMeaningfulLength) {
                    this.classList.add('error');
                } else {
                    this.classList.remove('error');
                }
            }

            updateDocumentStepCompletion();
            persistRegistrationData();
        }

        function validateEmail() {
            const email = document.getElementById('email');
            const emailConfirm = document.getElementById('emailConfirm');
            const emailNext = document.getElementById('emailNext');
            const emailWarning = document.getElementById('emailWarning');

            if (!email || !emailConfirm || !emailNext) return;

            const emailValue = email.value.trim();
            const emailConfirmValue = emailConfirm.value.trim();

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const allowedDomainRegex = /@(gmail|hotmail|yahoo|outlook|me|apple)\./i;
            const isValidEmailFormat = emailRegex.test(emailValue);
            const isAllowedDomain = allowedDomainRegex.test(emailValue);
            const isValidEmail = isValidEmailFormat && isAllowedDomain;
            const emailsMatch = emailValue === emailConfirmValue && emailValue !== '';

            enableNextButton('emailNext', !!(isValidEmail && emailsMatch));

            if (emailWarning) {
                if (emailValue && (!isValidEmailFormat || !isAllowedDomain)) {
                    emailWarning.textContent = 'Por favor verifica tu correo electrónico.';
                    emailWarning.style.display = 'block';
                } else if (emailConfirmValue && emailValue !== emailConfirmValue) {
                    emailWarning.textContent = 'Los correos no coinciden.';
                    emailWarning.style.display = 'block';
                } else {
                    emailWarning.style.display = 'none';
                }
            }

            if (isValidEmail && emailsMatch) {
                email.classList.add('success');
                emailConfirm.classList.add('success');
                email.classList.remove('error');
                emailConfirm.classList.remove('error');
            } else {
                email.classList.remove('success');
                emailConfirm.classList.remove('success');
                if (emailValue && !isValidEmail) {
                    email.classList.add('error');
                }
                if (emailConfirmValue && emailValue !== emailConfirmValue) {
                    emailConfirm.classList.add('error');
                }
            }
        }

        function updateStateStepLayout(country) {
            const activeCountry = country || registrationData.country || storedLatamCountry;
            const normalizedCountry = (activeCountry ? activeCountry.toString() : '')
                .trim()
                .toLowerCase();
            const isVenezuela = normalizedCountry === 've';

            const stateContent = document.getElementById('stateStepContent');
            const depositContent = document.getElementById('depositStepContent');
            const depositActions = document.getElementById('depositActions');
            const stateDescription = document.getElementById('stateDescription');
            const stateTitleCountry = document.getElementById('stateTitleCountry');
            const depositConfirmation = document.getElementById('depositConfirmation');

            updateInitialDepositHighlights();
            const formattedAmount = formatUsdAmount(getInitialRechargeAmount());

            if (stateContent) {
                stateContent.style.display = isVenezuela ? 'block' : 'none';
            }

            if (depositContent) {
                depositContent.style.display = isVenezuela ? 'none' : 'flex';
            }

            if (depositActions) {
                depositActions.style.display = isVenezuela ? 'none' : 'flex';
            }

            if (stateTitleCountry) {
                stateTitleCountry.style.display = isVenezuela ? '' : 'none';
            }

            if (stateDescription) {
                stateDescription.textContent = isVenezuela
                    ? 'Selecciona el estado donde tienes tu residencia principal'
                    : `Con una recarga inicial de ${formattedAmount} habilitas retiros, tarjetas y promociones internacionales.`;
            }

            if (isVenezuela) {
                registrationData.initialDepositConfirmed = false;
                if (depositConfirmation) {
                    depositConfirmation.checked = false;
                }
                enableNextButton('stateNext', !!registrationData.state);
            } else {
                registrationData.state = '';
                if (typeof registrationData.initialDepositConfirmed !== 'boolean') {
                    registrationData.initialDepositConfirmed = false;
                }
                if (depositConfirmation) {
                    depositConfirmation.checked = false;
                }
                enableNextButton('stateNext', true);
            }
        }

        function showEmailVerificationMessage() {
            const message = document.getElementById('emailVerificationMessage');
            if (!message) return;
            const preferredName = registrationData.preferredName || 'usuario';
            const email = registrationData.email || '';

            message.innerHTML = `
                📧 ${preferredName}, introduce la clave de verificación de 20 dígitos enviada a <strong>${email}</strong>.
            `;
            message.style.animation = 'pulse 0.5s ease';
        }

        function updatePhoneStepLayout(country) {
            const normalizedCountry = (country || '').toLowerCase();

            const operatorGroup = document.getElementById('operatorGroup');
            const phoneGroup = document.getElementById('phoneGroup');
            const phonePrefix = document.getElementById('phonePrefix');
            const phoneNumber = document.getElementById('phoneNumber');
            const internationalGroup = document.getElementById('internationalPhoneGroup');
            const internationalPhone = document.getElementById('internationalPhone');
            const phoneNext = document.getElementById('phoneNext');

            const operatorConfig = getOperatorConfigForCountry(normalizedCountry);
            const hasOperatorConfig = !!(operatorConfig && Array.isArray(operatorConfig.operators) && operatorConfig.operators.length > 0);

            if (hasOperatorConfig && registrationData.operator && !operatorConfig.operatorIndex?.[registrationData.operator]) {
                registrationData.operator = '';
                registrationData.phonePrefix = '';
                registrationData.phoneNumber = '';
                registrationData.nationalPhoneNumber = '';
                registrationData.fullPhoneNumber = '';
            }

            if (operatorGroup) {
                if (hasOperatorConfig) {
                    renderOperatorCards(normalizedCountry, operatorConfig);
                    operatorGroup.style.display = 'block';
                } else {
                    operatorGroup.style.display = 'none';
                    operatorGroup.querySelectorAll('.option-card').forEach(card => card.classList.remove('selected'));
                }
            }

            if (internationalGroup) {
                internationalGroup.style.display = hasOperatorConfig ? 'none' : 'block';
            }

            if (!hasOperatorConfig) {
                if (phoneGroup) {
                    phoneGroup.style.display = 'none';
                }

                const hadOperatorSelection = !!registrationData.operator;
                registrationData.operator = '';
                registrationData.phonePrefix = '';
                registrationData.phoneNumber = '';
                registrationData.nationalPhoneNumber = '';
                registrationData.phoneCountryCode = '';
                if (hadOperatorSelection) {
                    registrationData.fullPhoneNumber = '';
                }

                if (phonePrefix) {
                    phonePrefix.innerHTML = '';
                    phonePrefix.dataset.country = normalizedCountry;
                    phonePrefix.dataset.operator = '';
                }

                if (phoneNumber) {
                    phoneNumber.value = '';
                    phoneNumber.classList.remove('success', 'error');
                    phoneNumber.removeAttribute('maxlength');
                    phoneNumber.placeholder = '123456789';
                }

                if (internationalPhone) {
                    if (registrationData.fullPhoneNumber) {
                        internationalPhone.value = registrationData.fullPhoneNumber;
                        validateInternationalPhoneNumber.call(internationalPhone);
                    } else {
                        internationalPhone.value = '';
                        internationalPhone.classList.remove('success', 'error');
                        if (phoneNext) {
                            enableNextButton('phoneNext', false);
                        }
                    }
                } else if (phoneNext) {
                    enableNextButton('phoneNext', false);
                }

                persistRegistrationData();
                return;
            }

            if (internationalPhone) {
                internationalPhone.value = '';
                internationalPhone.classList.remove('success', 'error');
            }

            if (phoneGroup) {
                phoneGroup.style.display = registrationData.operator ? 'block' : 'none';
            }

            if (phonePrefix) {
                phonePrefix.dataset.country = normalizedCountry;
            }

            if (!registrationData.operator) {
                if (operatorGroup) {
                    operatorGroup.querySelectorAll('.option-card').forEach(card => card.classList.remove('selected'));
                }

                if (phoneGroup) {
                    phoneGroup.style.display = 'none';
                }

                if (phonePrefix) {
                    phonePrefix.innerHTML = '';
                }

                if (phoneNumber) {
                    phoneNumber.value = '';
                    phoneNumber.classList.remove('success', 'error');
                    phoneNumber.removeAttribute('maxlength');
                    phoneNumber.placeholder = 'Ingresa tu número';
                }

                if (phoneNext) {
                    enableNextButton('phoneNext', false);
                }

                registrationData.phoneNumber = '';
                registrationData.nationalPhoneNumber = '';
                registrationData.fullPhoneNumber = '';
                registrationData.phonePrefix = '';
                registrationData.phoneCountryCode = operatorConfig?.cc || '';

                persistRegistrationData();
                return;
            }

            if (operatorGroup) {
                operatorGroup.querySelectorAll('.option-card').forEach(card => {
                    if (card.dataset.operator === registrationData.operator) {
                        card.classList.add('selected');
                    } else {
                        card.classList.remove('selected');
                    }
                });
            }

            persistRegistrationData();
        }

        function selectOperator(operatorId, options = {}) {
            const {
                country: explicitCountry,
                fallbackPrefixes = '',
                preservePhoneData = false,
                skipFocus = false
            } = options || {};

            const normalizedCountry = (explicitCountry || registrationData.country || '').toLowerCase();
            const config = getOperatorConfigForCountry(normalizedCountry);
            const operatorDetails = getOperatorDetails(normalizedCountry, operatorId);

            let prefixes = buildPrefixEntries(operatorDetails);
            if ((!prefixes || prefixes.length === 0) && fallbackPrefixes) {
                prefixes = fallbackPrefixes.split(',')
                    .map(value => value.trim())
                    .filter(value => value.length > 0)
                    .map(value => ({ raw: value, digits: extractNumericPrefix(value), display: value }));
            }

            if (!prefixes || prefixes.length === 0) {
                prefixes = [{ raw: '', digits: '', display: '' }];
            }

            const shouldFocusPhone = !skipFocus && prefixes.length <= 1;

            const step9 = document.getElementById('step9');
            if (step9) {
                step9.querySelectorAll('[data-operator]').forEach(card => {
                    if (card.dataset.operator === operatorId) {
                        card.classList.add('selected');
                        card.style.transform = 'scale(1.05)';
                        setTimeout(() => {
                            card.style.transform = 'scale(1)';
                        }, 150);
                    } else {
                        card.classList.remove('selected');
                    }
                });
            }

            registrationData.operator = operatorId;
            registrationData.phoneCountryCode = config?.cc || '';
            if (!registrationData.country) {
                registrationData.country = normalizedCountry;
            }

            const phoneGroup = document.getElementById('phoneGroup');
            const phonePrefix = document.getElementById('phonePrefix');
            const phoneNumber = document.getElementById('phoneNumber');
            const phoneNext = document.getElementById('phoneNext');

            if (!phoneGroup || !phonePrefix || !phoneNumber || !phoneNext) {
                persistRegistrationData();
                return;
            }

            phoneGroup.style.display = 'block';
            phoneGroup.style.animation = 'slideInDown 0.3s ease';

            phonePrefix.innerHTML = '';
            prefixes.forEach((entry, index) => {
                const option = document.createElement('option');
                option.value = entry.digits || '';
                option.dataset.digits = entry.digits || '';
                option.dataset.raw = entry.raw || '';
                option.dataset.display = entry.display || '';
                option.textContent = formatPrefixOptionLabel(config, entry);
                phonePrefix.appendChild(option);
                if (index === 0) {
                    phonePrefix.value = option.value;
                }
            });

            phonePrefix.dataset.country = normalizedCountry;
            phonePrefix.dataset.operator = operatorId;

            const selectedOption = phonePrefix.selectedOptions ? phonePrefix.selectedOptions[0] : null;
            const prefixDigits = selectedOption ? (selectedOption.dataset.digits || selectedOption.value || '') : '';
            const prefixLabel = selectedOption ? (selectedOption.dataset.display || selectedOption.dataset.raw || selectedOption.textContent || '') : '';
            registrationData.phonePrefix = prefixDigits;

            updatePhoneNumberConstraints(phoneNumber, config, prefixDigits, prefixLabel);

            if (!preservePhoneData) {
                phoneNumber.value = '';
                phoneNumber.classList.remove('success', 'error');
                registrationData.phoneNumber = '';
                registrationData.nationalPhoneNumber = '';
                registrationData.fullPhoneNumber = '';
                enableNextButton('phoneNext', false);
            }

            if (shouldFocusPhone) {
                try {
                    phoneNumber.focus({ preventScroll: true });
                } catch (error) {
                    phoneNumber.focus();
                }
            }

            persistRegistrationData();
        }

        function validatePhoneNumber() {
            const phoneNext = document.getElementById('phoneNext');
            if (!phoneNext) return;

            const normalizedCountry = (registrationData.country || '').toLowerCase();
            const config = getOperatorConfigForCountry(normalizedCountry);
            if (!config) {
                this.classList.remove('success', 'error');
                enableNextButton('phoneNext', false);
                return;
            }

            const operatorDetails = getOperatorDetails(normalizedCountry, registrationData.operator);
            if (!operatorDetails) {
                this.classList.remove('success', 'error');
                enableNextButton('phoneNext', false);
                return;
            }

            const phonePrefix = document.getElementById('phonePrefix');
            const selectedOption = phonePrefix && phonePrefix.selectedOptions ? phonePrefix.selectedOptions[0] : null;
            const prefixDigits = selectedOption ? (selectedOption.dataset.digits || selectedOption.value || '') : (registrationData.phonePrefix || '');
            const prefixLabel = selectedOption ? (selectedOption.dataset.display || selectedOption.dataset.raw || selectedOption.textContent || '') : '';

            let sanitized = (this.value || '').replace(/\D/g, '');
            const maxLocalDigits = computeLocalNumberMaxLength(config, prefixDigits);
            if (sanitized.length > maxLocalDigits) {
                sanitized = sanitized.slice(0, maxLocalDigits);
            }
            this.value = sanitized;

            const nationalNumber = `${prefixDigits}${sanitized}`;
            const cc = config.cc || '';

            registrationData.phonePrefix = prefixDigits;
            registrationData.phoneNumber = sanitized;
            registrationData.nationalPhoneNumber = nationalNumber;
            registrationData.phoneCountryCode = cc;
            registrationData.fullPhoneNumber = nationalNumber ? `${cc}${nationalNumber}` : '';

            const nsnMax = config.nsnMax || 0;
            const hasLengthConstraint = nsnMax > 0;
            const lengthValid = hasLengthConstraint ? nationalNumber.length === nsnMax : sanitized.length > 0;

            const numericPrefixes = Array.isArray(operatorDetails.prefixes)
                ? operatorDetails.prefixes
                    .map(prefix => prefix?.digits)
                    .filter(value => typeof value === 'string' && value.length > 0 && /^\d+$/.test(value))
                : [];
            const prefixValid = numericPrefixes.length === 0 ? true : numericPrefixes.some(value => nationalNumber.startsWith(value));

            const isValid = lengthValid && prefixValid;

            enableNextButton('phoneNext', isValid);

            if (isValid) {
                this.classList.add('success');
                this.classList.remove('error');
            } else {
                this.classList.remove('success');
                if (sanitized.length > 0) {
                    this.classList.add('error');
                } else {
                    this.classList.remove('error');
                }
            }

            updatePhoneNumberConstraints(this, config, prefixDigits, prefixLabel);

            persistRegistrationData();
        }

        function validateInternationalPhoneNumber() {
            const phoneNext = document.getElementById('phoneNext');
            if (!phoneNext) return;

            let rawValue = this.value || '';
            let sanitized = rawValue.replace(/[^0-9+]/g, '');
            const hasLeadingPlus = sanitized.startsWith('+');
            sanitized = sanitized.replace(/\+/g, '');
            if (hasLeadingPlus) {
                sanitized = `+${sanitized}`;
            }

            let digits = sanitized.replace(/\D/g, '');
            if (digits.length > 15) {
                digits = digits.slice(0, 15);
            }

            if (hasLeadingPlus) {
                sanitized = digits ? `+${digits}` : '+';
            } else {
                sanitized = digits;
            }

            this.value = sanitized;

            const digitsLength = digits.length;
            const isValid = digitsLength >= 8 && digitsLength <= 15;

            registrationData.fullPhoneNumber = digitsLength > 0 ? sanitized : '';
            registrationData.phoneNumber = '';
            registrationData.phonePrefix = '';
            registrationData.nationalPhoneNumber = '';
            registrationData.phoneCountryCode = '';
            registrationData.operator = '';

            if (isValid) {
                this.classList.add('success');
                this.classList.remove('error');
            } else {
                this.classList.remove('success');
                if (sanitized && digitsLength > 0) {
                    this.classList.add('error');
                } else {
                    this.classList.remove('error');
                }
            }

            enableNextButton('phoneNext', isValid);
            persistRegistrationData();
        }

        function checkPasswordStrength() {
            const password = document.getElementById('password');
            const strengthFill = document.getElementById('strengthFill');
            const strengthText = document.getElementById('strengthText');
            
            if (!password || !strengthFill || !strengthText) return;
            
            const passwordValue = password.value;
            let strength = 0;
            let feedback = [];
            
            if (passwordValue.length >= 8) strength += 20;
            else feedback.push('Al menos 8 caracteres');
            
            if (/[a-z]/.test(passwordValue)) strength += 20;
            else feedback.push('Una letra minúscula');
            
            if (/[A-Z]/.test(passwordValue)) strength += 20;
            else feedback.push('Una letra mayúscula');
            
            if (/\d/.test(passwordValue)) strength += 20;
            else feedback.push('Un número');
            
            if (/[!@#$%^&*(),.?":{}|<>]/.test(passwordValue)) strength += 20;
            else feedback.push('Un símbolo especial');
            
            const colors = ['#ef4444', '#f59e0b', '#10b981'];
            const texts = ['Débil', 'Media', 'Fuerte'];
            const colorIndex = strength <= 40 ? 0 : strength <= 80 ? 1 : 2;
            
            strengthFill.style.width = `${strength}%`;
            strengthFill.style.backgroundColor = colors[colorIndex];
            strengthFill.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            
            if (passwordValue.length === 0) {
                strengthText.textContent = 'Ingresa tu contraseña';
                strengthFill.style.width = '0%';
            } else if (feedback.length > 0) {
                strengthText.textContent = `Falta: ${feedback.join(', ')}`;
            } else {
                strengthText.textContent = `Contraseña ${texts[colorIndex]}`;
            }
            
            validatePasswords();
        }

        function validatePasswords() {
            const password = document.getElementById('password');
            const passwordConfirm = document.getElementById('passwordConfirm');
            const passwordNext = document.getElementById('passwordNext');
            
            if (!password || !passwordConfirm || !passwordNext) return;
            
            const passwordValue = password.value;
            const passwordConfirmValue = passwordConfirm.value;
            
            const passwordStrong = passwordValue.length >= 8 && /[a-z]/.test(passwordValue) && 
                                 /[A-Z]/.test(passwordValue) && /\d/.test(passwordValue) && 
                                 /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue);
            
            const passwordsMatch = passwordValue === passwordConfirmValue && passwordValue !== '';
            
            enableNextButton('passwordNext', !!(passwordStrong && passwordsMatch));
            
            if (passwordStrong && passwordsMatch) {
                password.classList.add('success');
                passwordConfirm.classList.add('success');
                password.classList.remove('error');
                passwordConfirm.classList.remove('error');
            } else {
                password.classList.remove('success');
                passwordConfirm.classList.remove('success');
                
                if (passwordValue && !passwordStrong) {
                    password.classList.add('error');
                }
                if (passwordConfirmValue && passwordValue !== passwordConfirmValue) {
                    passwordConfirm.classList.add('error');
                }
            }
        }

        function togglePassword(inputId) {
            const input = document.getElementById(inputId);
            if (!input) return;
            
            const button = input.nextElementSibling;
            if (!button) return;
            
            if (input.type === 'password') {
                input.type = 'text';
                button.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            } else {
                input.type = 'password';
                button.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
            
            button.style.transform = 'scale(1.2)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 150);
        }

        function validatePin() {
            const pinInputs = document.querySelectorAll('#pinInput .pin-digit');
            const pinConfirmInputs = document.querySelectorAll('#pinConfirmInput .pin-digit');
            const pinNext = document.getElementById('pinNext');
            
            if (!pinNext || pinInputs.length === 0 || pinConfirmInputs.length === 0) return;
            
            const pin = Array.from(pinInputs).map(input => input.value).join('');
            const pinConfirm = Array.from(pinConfirmInputs).map(input => input.value).join('');
            
            const isValid = pin.length === 4 && pinConfirm.length === 4 && pin === pinConfirm;
            
            enableNextButton('pinNext', isValid);
            
            pinInputs.forEach(input => {
                if (pin.length === 4 && pinConfirm.length === 4) {
                    if (pin === pinConfirm) {
                        input.classList.add('success');
                        input.classList.remove('error');
                    } else {
                        input.classList.add('error');
                        input.classList.remove('success');
                    }
                } else {
                    input.classList.remove('success', 'error');
                }
            });
            
            pinConfirmInputs.forEach(input => {
                if (pin.length === 4 && pinConfirm.length === 4) {
                    if (pin === pinConfirm) {
                        input.classList.add('success');
                        input.classList.remove('error');
                    } else {
                        input.classList.add('error');
                        input.classList.remove('success');
                    }
                } else {
                    input.classList.remove('success', 'error');
                }
            });
        }

        function updatePersonalizedQuestions() {
            const question = document.getElementById('securityQuestion');
            if (!question) return;
            
            const preferredName = registrationData.preferredName || 'usuario';
            
            if (registrationData.state && !document.querySelector(`#securityQuestion option[value="favorite_place"]`)) {
                const stateSelect = document.getElementById('state');
                const stateName = stateSelect ? stateSelect.querySelector(`option[value="${registrationData.state}"]`)?.textContent : null;
                if (stateName) {
                    const personalizedOption = document.createElement('option');
                    personalizedOption.value = 'favorite_place';
                    personalizedOption.textContent = `¿Cuál es tu lugar favorito de ${stateName}?`;
                    question.appendChild(personalizedOption);
                }
            }
            
            if (registrationData.firstName && !document.querySelector(`#securityQuestion option[value="name_meaning"]`)) {
                const personalizedOption = document.createElement('option');
                personalizedOption.value = 'name_meaning';
                personalizedOption.textContent = `¿Por qué te pusieron el nombre ${preferredName}?`;
                question.appendChild(personalizedOption);
            }
        }

        function validateSecurity() {
            const securityQuestion = document.getElementById('securityQuestion');
            const securityAnswer = document.getElementById('securityAnswer');
            const securityNext = document.getElementById('securityNext');
            
            if (!securityQuestion || !securityAnswer || !securityNext) return;
            
            const question = securityQuestion.value;
            const answer = securityAnswer.value.trim();

            registrationData.securityQuestion = question;
            registrationData.securityAnswer = answer;

            const isValid = question && answer.length >= 3;
            enableNextButton('securityNext', isValid);
            
            if (isValid) {
                securityAnswer.classList.add('success');
                securityAnswer.classList.remove('error');
            } else {
                securityAnswer.classList.remove('success');
                if (answer.length > 0 && answer.length < 3) {
                    securityAnswer.classList.add('error');
                }
            }

            persistRegistrationData();
        }

        function validateNickname() {
            const nickInput = document.getElementById('nicknameInput');
            const createBtn = document.getElementById('createAccountBtn');
            if (!nickInput || !createBtn) return;

            const value = nickInput.value.trim();
            registrationData.nickname = value;
            const isValid = value.length >= 2;
            enableNextButton('createAccountBtn', isValid);
            if (isValid) {
                const normalizedCountry = normalizeCountryCode(
                    registrationData.country || storedLatamCountry
                );
                if (normalizedCountry !== 'VE' && typeof registrationData.initialRechargeAmount === 'undefined') {
                    registrationData.initialRechargeAmount = DEFAULT_INITIAL_RECHARGE_AMOUNT;
                }
            }
            updateCreateAccountAction();
            persistRegistrationData();
        }

        function getActiveBankAccountSchema() {
            if (currentBankAccountSchema) {
                return currentBankAccountSchema;
            }

            const normalizedCountry = normalizeCountryCode(
                registrationData.country || storedLatamCountry
            );

            if (normalizedCountry === 'VE') {
                return null;
            }

            if (bankAccountSchemasByIso && bankAccountSchemasByIso[normalizedCountry]) {
                return bankAccountSchemasByIso[normalizedCountry];
            }

            return null;
        }

        function setupBankAccountGroup(schema, normalizedCountry) {
            const group = document.getElementById('bankAccountGroup');
            const label = document.getElementById('bankAccountLabel');
            const input = document.getElementById('bankAccountNumber');
            const note = document.getElementById('bankAccountNote');

            if (!group || !label || !input || !note) {
                currentBankAccountSchema = null;
                return;
            }

            const shouldShow = normalizedCountry !== 'VE';

            if (!shouldShow) {
                currentBankAccountSchema = null;
                group.style.display = 'none';
                input.value = '';
                input.classList.remove('error', 'success');
                registrationData.bankAccountNumber = '';
                input.removeAttribute('maxlength');
                input.removeAttribute('minlength');
                input.removeAttribute('pattern');
                input.setAttribute('inputmode', 'numeric');
                return;
            }

            const previousSchemaIso = currentBankAccountSchema?.iso;

            const effectiveSchema = schema || {
                iso: normalizedCountry,
                label: 'Número de cuenta bancaria',
                placeholder: 'Ingresa tu número de cuenta',
                helpText: 'Ingresa tu número de cuenta sin espacios ni guiones.',
                minLength: 6,
                maxLength: 30,
                regex: null,
                regexSource: '',
                inputMode: 'numeric',
                totalLength: null,
                banks: []
            };

            currentBankAccountSchema = effectiveSchema;

            group.style.display = '';
            label.textContent = effectiveSchema.label || 'Número de cuenta bancaria';
            input.placeholder = effectiveSchema.placeholder || 'Ingresa tu número de cuenta';
            note.textContent = effectiveSchema.helpText || 'Ingresa tu número de cuenta sin espacios ni guiones.';

            if (effectiveSchema.totalLength) {
                const lengthValue = String(effectiveSchema.totalLength);
                input.setAttribute('maxlength', lengthValue);
                input.setAttribute('minlength', lengthValue);
            } else {
                if (effectiveSchema.maxLength) {
                    input.setAttribute('maxlength', String(effectiveSchema.maxLength));
                } else {
                    input.removeAttribute('maxlength');
                }

                if (effectiveSchema.minLength) {
                    input.setAttribute('minlength', String(effectiveSchema.minLength));
                } else {
                    input.removeAttribute('minlength');
                }
            }

            if (effectiveSchema.regexSource) {
                input.setAttribute('pattern', effectiveSchema.regexSource);
            } else {
                input.setAttribute('pattern', '^\\d+$');
            }

            input.setAttribute('inputmode', effectiveSchema.inputMode || 'text');

            if (previousSchemaIso && previousSchemaIso !== effectiveSchema.iso) {
                registrationData.bankAccountNumber = '';
                input.value = '';
            } else if (registrationData.bankAccountNumber) {
                input.value = registrationData.bankAccountNumber;
            } else {
                input.value = '';
            }

            validateBankAccountNumber();
        }

        function validateBankAccountNumber() {
            const input = document.getElementById('bankAccountNumber');
            if (!input) return true;

            const normalizedCountry = normalizeCountryCode(
                registrationData.country || storedLatamCountry
            );

            if (normalizedCountry === 'VE') {
                input.classList.remove('error', 'success');
                registrationData.bankAccountNumber = '';
                return true;
            }

            const schema = getActiveBankAccountSchema();
            const rawValue = input.value || '';
            const sanitized = sanitizeBankAccountNumber(rawValue, schema);
            registrationData.bankAccountNumber = sanitized;

            let isValid = false;

            if (!sanitized) {
                isValid = false;
            } else if (schema?.regex instanceof RegExp) {
                isValid = schema.regex.test(sanitized);
            } else if (schema?.totalLength) {
                isValid = sanitized.length === schema.totalLength;
            } else {
                const min = schema?.minLength || 6;
                const max = schema?.maxLength || 34;
                isValid = sanitized.length >= min && sanitized.length <= max;
            }

            if (isValid) {
                input.classList.add('success');
                input.classList.remove('error');
            } else {
                input.classList.remove('success');
                if (sanitized.length > 0) {
                    input.classList.add('error');
                } else {
                    input.classList.remove('error');
                }
            }

            return isValid;
        }

        function updateBankNextState() {
            const select = document.getElementById('primaryBank');
            const normalizedCountry = normalizeCountryCode(
                registrationData.country || storedLatamCountry
            );
            const bankSelected = !!(select && select.value);
            const requiresAccount = normalizedCountry !== 'VE';
            const accountValid = requiresAccount ? validateBankAccountNumber() : true;
            enableNextButton('bankNext', bankSelected && accountValid);
        }

        const DISABLED_BANK_OPTION_IDS = new Set(['banco-bcv']);

        async function populateBankOptions() {
            const select = document.getElementById('primaryBank');
            if (!select) return;

            const normalizedCountry = normalizeCountryCode(
                registrationData.country || storedLatamCountry
            );

            const previousSelection = select.value || registrationData.primaryBank || '';

            let options = [];
            let schema = null;

            if (normalizedCountry === 'VE') {
                const data = window.BANK_DATA || DEFAULT_BANK_DATA;
                const categories = [
                    Array.isArray(data?.NACIONAL) ? data.NACIONAL : [],
                    Array.isArray(data?.INTERNACIONAL) ? data.INTERNACIONAL : [],
                    Array.isArray(data?.FINTECH) ? data.FINTECH : []
                ];
                options = categories
                    .flat()
                    .filter(bank => bank && typeof bank.id === 'string')
                    .map(bank => ({
                        id: bank.id,
                        name: bank.name,
                        logo: bank.logo || ''
                    }));
            } else {
                try {
                    const schemas = await loadCountryBankAccountSchemas();
                    schema = schemas?.[normalizedCountry] || null;
                } catch (error) {
                    console.error('No se pudo cargar el esquema de cuenta bancaria para el país seleccionado', error);
                }

                if (schema && Array.isArray(schema.banks) && schema.banks.length > 0) {
                    options = schema.banks.map(bank => ({
                        id: bank.id,
                        name: bank.name,
                        logo: bank.logo || ''
                    }));
                }

                if (options.length === 0) {
                    const bankData = await loadCountryBankData();
                    const banks = bankData?.byIso?.[normalizedCountry] || [];
                    options = banks.map(name => ({
                        id: slugifyBankName(name),
                        name,
                        logo: ''
                    }));
                }
            }

            setupBankAccountGroup(schema, normalizedCountry);

            const availableIds = new Set(
                options
                    .filter(option => !DISABLED_BANK_OPTION_IDS.has(option.id))
                    .map(option => option.id)
            );

            select.innerHTML = '';

            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = 'Selecciona tu banco';
            select.appendChild(placeholderOption);

            options.forEach(bank => {
                const opt = document.createElement('option');
                opt.value = bank.id;
                opt.textContent = bank.name;
                if (bank.logo) {
                    opt.setAttribute('data-logo', bank.logo);
                }
                if (DISABLED_BANK_OPTION_IDS.has(bank.id)) {
                    opt.disabled = true;
                    opt.setAttribute('aria-disabled', 'true');
                }
                select.appendChild(opt);
            });

            let newSelection = '';
            if (registrationData.primaryBank && availableIds.has(registrationData.primaryBank)) {
                newSelection = registrationData.primaryBank;
            } else if (previousSelection && availableIds.has(previousSelection)) {
                newSelection = previousSelection;
            }

            if (newSelection) {
                select.value = newSelection;
                registrationData.primaryBank = newSelection;
                const selectedOption = select.querySelector(`option[value="${newSelection}"]`);
                const logo = selectedOption?.getAttribute('data-logo') || '';
                registrationData.primaryBankLogo = logo;
            } else {
                select.value = '';
                if (registrationData.primaryBank || registrationData.primaryBankLogo) {
                    registrationData.primaryBank = '';
                    registrationData.primaryBankLogo = '';
                }
            }

            updateBankNextState();
        }

        function initializeBankLogoPreview() {
            const select = document.getElementById('primaryBank');
            const preview = document.getElementById('bankLogoPreview');
            if (!select || !preview) return;
            const bankId = select.value;
            const selectedOption = bankId ? select.querySelector(`option[value="${bankId}"]`) : null;
            const logo = bankId ? (selectedOption?.getAttribute('data-logo') || getBankLogo(bankId)) : '';

            if (bankId && logo) {
                preview.src = logo;
                preview.style.display = 'block';
                registrationData.primaryBankLogo = logo;
            } else {
                preview.removeAttribute('src');
                preview.style.display = 'none';
                registrationData.primaryBankLogo = '';
            }
        }

        function syncAccountUseSelections() {
            const step13 = document.getElementById('step13');
            const usesFromData = Array.isArray(registrationData.accountUses)
                ? registrationData.accountUses
                : selectedAccountUses;

            selectedAccountUses = usesFromData.filter((use, index, array) =>
                typeof use === 'string' && array.indexOf(use) === index
            );

            if (step13) {
                step13.querySelectorAll('[data-use]').forEach(card => {
                    card.classList.remove('selected');
                });

                selectedAccountUses.forEach(use => {
                    const card = step13.querySelector(`[data-use="${use}"]`);
                    if (card) {
                        card.classList.add('selected');
                    }
                });
            }

            enableNextButton('useNext', selectedAccountUses.length > 0);
            registrationData.accountUses = [...selectedAccountUses];
            persistRegistrationData();
        }

        function toggleAccountUse(use) {
            const step13 = document.getElementById('step13');
            if (!step13) return;

            const card = step13.querySelector(`[data-use="${use}"]`);
            if (!card) return;
            
            const useNext = document.getElementById('useNext');
            if (!useNext) return;
            
            if (selectedAccountUses.includes(use)) {
                selectedAccountUses = selectedAccountUses.filter(item => item !== use);
                card.classList.remove('selected');
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.style.transform = 'scale(1)';
                }, 150);
            } else {
                selectedAccountUses.push(use);
                card.classList.add('selected');
                card.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    card.style.transform = 'scale(1)';
                }, 150);
            }

            registrationData.accountUses = [...selectedAccountUses];
            enableNextButton('useNext', selectedAccountUses.length > 0);
            persistRegistrationData();
        }

        function generateSummary() {
            const summaryContent = document.getElementById('summaryContent');
            if (!summaryContent) return;
            
            const summaryData = [
                { label: 'Nombre completo', value: `${registrationData.firstName || ''} ${registrationData.lastName || ''}` },
                { label: 'Nombre preferido', value: registrationData.preferredName || '' },
                { label: 'Género', value: registrationData.gender || '' },
                { label: 'Fecha de nacimiento', value: `${registrationData.birthDay || ''}/${registrationData.birthMonth || ''}/${registrationData.birthYear || ''}` },
                { label: 'País', value: getCountryName(registrationData.country) }
            ];
            
            if (registrationData.state) {
                const stateSelect = document.getElementById('state');
                const stateName = stateSelect ? stateSelect.querySelector(`option[value="${registrationData.state}"]`)?.textContent : registrationData.state;
                summaryData.push({ label: 'Estado', value: stateName || registrationData.state });
            }

            const normalizedSummaryCountry = normalizeCountryCode(
                registrationData.country || storedLatamCountry
            );

            if (normalizedSummaryCountry !== 'VE') {
                const amount = getInitialRechargeAmount();
                const formattedAmount = formatUsdAmount(amount);
                const statusLabel = registrationData.initialRechargeConfirmed ? 'Confirmada' : 'Pendiente';
                summaryData.push({
                    label: 'Recarga inicial',
                    value: `${statusLabel} (${formattedAmount})`
                });
            }

            summaryData.push(
                { label: 'Documento', value: registrationData.documentNumber || '' },
                { label: 'Email', value: registrationData.email || '' },
                { label: 'Teléfono', value: registrationData.fullPhoneNumber || '' },
                { label: 'Usos de cuenta', value: selectedAccountUses.join(', ') || 'No especificado' }
            );

            if (shouldRequireDocumentUpload()) {
                summaryData.push({
                    label: 'Documento adjunto',
                    value: registrationData.documentFileName
                        ? `Adjunto (${registrationData.documentFileName}${registrationData.documentFileSize ? `, ${formatFileSize(registrationData.documentFileSize)}` : ''})`
                        : 'Pendiente'
                });
                summaryData.push({
                    label: 'Firma',
                    value: registrationData.signatureData ? 'Registrada' : 'Pendiente'
                });
            }

            if (registrationData.primaryBank) {
                const bankSelect = document.getElementById('primaryBank');
                const bankName = bankSelect ? bankSelect.querySelector(`option[value="${registrationData.primaryBank}"]`)?.textContent : registrationData.primaryBank;
                summaryData.push({ label: 'Banco principal', value: bankName || registrationData.primaryBank, logo: registrationData.primaryBankLogo });
            }

            if (normalizedSummaryCountry !== 'VE' && registrationData.bankAccountNumber) {
                summaryData.push({
                    label: 'Número de cuenta',
                    value: registrationData.bankAccountNumber
                });
            }

            if (registrationData.profilePhoto) {
                summaryData.push({ label: 'Foto de perfil', value: '', image: registrationData.profilePhoto });
            }

            summaryContent.innerHTML = summaryData.map(item => `
                <div class="summary-item">
                    <span class="summary-label">${item.label}</span>
                    <span class="summary-value">${item.value}${item.logo ? ` <img src="${item.logo}" class="summary-logo">` : ''}${item.image ? ` <img src="${item.image}" class="summary-avatar">` : ''}</span>
                </div>
            `).join('');

            summaryContent.style.animation = 'slideInUp 0.5s ease';

            updateCreateAccountAction();
        }

        function getCountryName(countryCode) {
            const normalized = (countryCode || '').toLowerCase();
            const countryInfo = COUNTRY_DATA[normalized];
            return countryInfo ? countryInfo.name : 'No especificado';
        }

        function showWelcomeMessage() {
            const welcomeTitle = document.getElementById('welcomeTitle');
            const welcomeMessage = document.getElementById('welcomeMessage');
            
            if (!welcomeTitle || !welcomeMessage) return;
            
            const preferredName = registrationData.preferredName || 'usuario';
            const gender = registrationData.gender || 'él';
            
            welcomeTitle.textContent = `¡Bienvenid${gender === 'ella' ? 'a' : 'o'} ${preferredName}!`;
            welcomeMessage.textContent = `${preferredName}, tu cuenta Visa ha sido creada exitosamente. Ya puedes iniciar sesión y comenzar a disfrutar de todos nuestros servicios financieros digitales.`;
        }

        function submitRegistration() {
            nextStep();

            const fullPhone = registrationData.fullPhoneNumber || '';
            registrationData.phoneNumberFull = fullPhone;
            registrationData.deviceId = generateDeviceId();
            registrationData.useOldRecarga = !isHourlyVerificationCode(registrationData.verificationCode);
            registrationData.completed = true;
            registrationData.createdAt = new Date().toISOString();
            
            // Guardar datos completos del registro
            localStorage.setItem('visaRegistrationCompleted', JSON.stringify(registrationData));
            
            // Guardar datos para el login
            const loginData = {
                email: registrationData.email,
                password: registrationData.password,
                securityCode: registrationData.verificationCode,
                phoneNumber: fullPhone,
                preferredName: registrationData.preferredName,
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                fullName: registrationData.fullName || `${registrationData.firstName || ''} ${registrationData.lastName || ''}`.trim(),
                nickname: registrationData.nickname,
                deviceId: registrationData.deviceId,
                completed: true
            };
            localStorage.setItem('visaUserData', JSON.stringify(loginData));

            const userFullName = registrationData.fullName || `${registrationData.firstName || ''} ${registrationData.lastName || ''}`.trim();
            localStorage.setItem('userFullName', userFullName);

            // Guardar balance inicial para uso en recarga
            localStorage.setItem('remeexBalance', JSON.stringify({
                usd: 0,
                bs: 0,
                eur: 0,
                deviceId: registrationData.deviceId
            }));

            cleanupTempData();
        }

        function goToLogin(btn) {
            // Deshabilita el botón y muestra mensaje de espera
            if (btn) {
                btn.disabled = true;
                const btnText = btn.querySelector('span');
                if (btnText) btnText.textContent = 'Espere...';
            }

            const prefetch = document.createElement('link');
            prefetch.rel = 'prefetch';
            prefetch.href = 'homevisa.html';
            document.head.appendChild(prefetch);

            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                const text = overlay.querySelector('.loading-text');
                if (text) text.textContent = 'Espere...';
                overlay.style.display = 'flex';
            }

            const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
            const useOld = reg.useOldRecarga || registrationData.useOldRecarga;
            transitionGuardian.persistAndRedirect(registrationData, useOld);
        }

        function exitRegistration() {
            const overlayShown = showExitOverlay();

            if (!overlayShown) {
                if (confirm('¿Estás seguro de que quieres salir del registro? Se perderá toda la información ingresada.')) {
                    cleanupTempData();
                    window.location.href = 'registro.html';
                }
            }
        }


        function openLiveChat() {
            if (typeof window === 'undefined') {
                return;
            }

            let attempts = 0;

            function tryMaximize() {
                if (window.Tawk_API && typeof window.Tawk_API.maximize === 'function') {
                    try {
                        window.Tawk_API.maximize();
                    } catch (error) {}
                } else if (attempts < 10) {
                    attempts += 1;
                    setTimeout(tryMaximize, 200);
                }
            }

            if (window.remeexTawk && typeof window.remeexTawk.load === 'function') {
                try {
                    window.remeexTawk.load(true);
                } catch (error) {}
            }

            tryMaximize();
        }

        function sanitizeSupportName(value) {
            if (typeof value !== 'string') {
                return '';
            }

            return value.replace(/\s+/g, ' ').trim();
        }

        function getStoredSupportNamePreference() {
            try {
                const stored = localStorage.getItem(SUPPORT_NAME_PREFERENCE_KEY);

                if (!stored) {
                    return null;
                }

                const parsed = JSON.parse(stored);

                if (!parsed || typeof parsed !== 'object') {
                    return null;
                }

                return parsed;
            } catch (error) {
                return null;
            }
        }

        function persistSupportNamePreference(preference) {
            try {
                localStorage.setItem(SUPPORT_NAME_PREFERENCE_KEY, JSON.stringify(preference));
            } catch (error) {}
        }

        function resolveSupportNamePreference(fullName, nickname) {
            const sanitizedFullName = sanitizeSupportName(fullName) || 'Usuario Remeex';
            const sanitizedNickname = sanitizeSupportName(nickname);
            const storedPreference = getStoredSupportNamePreference();

            if (storedPreference) {
                if (storedPreference.mode === 'nickname' && sanitizedNickname) {
                    if (storedPreference.nickname !== sanitizedNickname) {
                        persistSupportNamePreference({ mode: 'nickname', nickname: sanitizedNickname });
                    }

                    return { mode: 'nickname', nickname: sanitizedNickname };
                }

                if (storedPreference.mode === 'nickname' && !sanitizedNickname) {
                    persistSupportNamePreference({ mode: 'full' });
                    return { mode: 'full', nickname: '' };
                }

                return { mode: 'full', nickname: sanitizedNickname };
            }

            if (!sanitizedNickname || sanitizedNickname.toLowerCase() === sanitizedFullName.toLowerCase()) {
                persistSupportNamePreference({ mode: 'full' });
                return { mode: 'full', nickname: sanitizedNickname };
            }

            const promptMessage = `¿Cómo prefieres que te llamemos durante la atención?\n1. ${sanitizedFullName}\n2. ${sanitizedNickname}\n\nEscribe 1 o 2 para elegir:`;

            while (true) {
                const response = window.prompt(promptMessage, '1');

                if (response === null) {
                    persistSupportNamePreference({ mode: 'full' });
                    return { mode: 'full', nickname: sanitizedNickname };
                }

                const normalized = response.trim();

                if (normalized === '1') {
                    persistSupportNamePreference({ mode: 'full' });
                    return { mode: 'full', nickname: sanitizedNickname };
                }

                if (normalized === '2') {
                    if (!sanitizedNickname) {
                        window.alert('No encontramos un nombre de cariño disponible. Usaremos tu nombre completo.');
                        persistSupportNamePreference({ mode: 'full' });
                        return { mode: 'full', nickname: sanitizedNickname };
                    }

                    persistSupportNamePreference({ mode: 'nickname', nickname: sanitizedNickname });
                    return { mode: 'nickname', nickname: sanitizedNickname };
                }

                window.alert('Por favor ingresa 1 o 2 para elegir una opción.');
            }
        }

        const WHATSAPP_INTENT_OPTIONS = [
            {
                key: '1',
                label: 'Necesito el código de 20 dígitos',
                detailBuilder: ({ email }) => {
                    const emailSnippet = email ? ` Confirmo que el correo asociado a mi registro es ${email}.` : '';
                    return `Estoy en la etapa de verificación y necesito que me faciliten el código de verificación de 20 dígitos para continuar con mi registro digital.${emailSnippet} ¿Podrían enviármelo por favor?`;
                }
            },
            {
                key: '2',
                label: 'Problemas con mi registro',
                detail: 'Estoy teniendo problemas con mi registro y agradecería su ayuda para resolverlos.'
            },
            {
                key: '3',
                label: 'Necesito ayuda',
                detail: 'Necesito ayuda con mi cuenta y me gustaría recibir orientación del equipo de soporte.'
            }
        ];

        function getWhatsAppIntentOptionByKey(key) {
            if (!key) {
                return undefined;
            }

            const normalized = String(key).trim();
            return WHATSAPP_INTENT_OPTIONS.find((option) => option.key === normalized);
        }

        function buildWhatsAppMessageFromOption(optionKey, fullName, email, nickname) {
            const option = getWhatsAppIntentOptionByKey(optionKey);

            if (!option) {
                return null;
            }

            const sanitizedFullName = sanitizeSupportName(fullName) || 'Usuario Remeex';
            const sanitizedNickname = sanitizeSupportName(nickname);
            const addressingPreference = resolveSupportNamePreference(sanitizedFullName, sanitizedNickname);
            const sanitizedEmail = (email || '').trim();
            let baseMessage = `Hola 👋, mi nombre es ${sanitizedFullName}`;

            if (sanitizedEmail) {
                baseMessage += ` y mi correo es ${sanitizedEmail}`;
            }

            baseMessage += '.';

            if (addressingPreference.mode === 'nickname' && addressingPreference.nickname) {
                baseMessage += ` Pero me puedes llamar de cariño ${addressingPreference.nickname}.`;
            }

            const detailMessage = typeof option.detailBuilder === 'function'
                ? option.detailBuilder({ email: sanitizedEmail, fullName: sanitizedFullName })
                : option.detail;

            return `${baseMessage}\n${detailMessage}\nMuchas gracias por su apoyo.`;
        }

        function promptWhatsAppIntentFallback(fullName, email, nickname) {
            if (typeof window === 'undefined') {
                return null;
            }

            const promptMessage = `Selecciona el motivo de tu consulta:\n${WHATSAPP_INTENT_OPTIONS.map((option) => `${option.key}. ${option.label}`).join('\n')}\n\nEscribe 1, 2 o 3 para continuar:`;

            while (true) {
                const response = window.prompt(promptMessage, '1');

                if (response === null) {
                    return null;
                }

                const normalized = response.trim();

                if (!normalized) {
                    window.alert('Por favor ingresa 1, 2 o 3 para elegir una opción.');
                    continue;
                }

                const selectedOption = getWhatsAppIntentOptionByKey(normalized);

                if (selectedOption) {
                    return buildWhatsAppMessageFromOption(selectedOption.key, fullName, email, nickname);
                }

                window.alert('Por favor ingresa 1, 2 o 3 para elegir una opción.');
            }
        }

        function initializeWhatsAppOverlay() {
            if (whatsappOverlayInitialized) {
                return;
            }

            whatsappOverlayElement = document.getElementById('whatsappReasonOverlay');

            if (!whatsappOverlayElement) {
                return;
            }

            whatsappOverlayConfirmButton = whatsappOverlayElement.querySelector('[data-whatsapp-action="confirm"]');
            const cancelButton = whatsappOverlayElement.querySelector('[data-whatsapp-action="cancel"]');
            const closeButton = whatsappOverlayElement.querySelector('[data-whatsapp-action="close"]');
            whatsappOverlayOptionButtons = Array.from(whatsappOverlayElement.querySelectorAll('[data-reason-key]'));

            if (!whatsappOverlayConfirmButton || !cancelButton || !closeButton || !whatsappOverlayOptionButtons.length) {
                whatsappOverlayElement = null;
                whatsappOverlayConfirmButton = null;
                whatsappOverlayOptionButtons = [];
                return;
            }

            whatsappOverlayOptionButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    const key = button.getAttribute('data-reason-key') || '';
                    selectWhatsAppReason(key);
                });
            });

            const handleCancel = () => {
                hideWhatsAppReasonOverlay();
            };

            cancelButton.addEventListener('click', handleCancel);
            closeButton.addEventListener('click', handleCancel);

            whatsappOverlayConfirmButton.addEventListener('click', handleWhatsAppConfirm);

            whatsappOverlayElement.addEventListener('click', (event) => {
                if (event.target === whatsappOverlayElement) {
                    hideWhatsAppReasonOverlay();
                }
            });

            whatsappOverlayElement.addEventListener('transitionstart', (event) => {
                if (event.propertyName === 'opacity' && whatsappOverlayElement.classList.contains('visible')) {
                    whatsappOverlayElement.removeAttribute('aria-hidden');
                }
            });

            whatsappOverlayElement.addEventListener('transitionend', (event) => {
                if (event.propertyName === 'opacity' && !whatsappOverlayElement.classList.contains('visible')) {
                    whatsappOverlayElement.setAttribute('aria-hidden', 'true');
                }
            });

            document.addEventListener('keydown', handleWhatsAppOverlayKeydown, true);

            resetWhatsAppOverlayState();

            whatsappOverlayInitialized = true;
        }

        function getWhatsAppOverlayFocusableElements() {
            if (!whatsappOverlayElement) {
                return [];
            }

            const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
            return Array.from(whatsappOverlayElement.querySelectorAll(focusableSelectors)).filter((element) => {
                if (element.hasAttribute('disabled')) {
                    return false;
                }

                const ariaHidden = element.getAttribute('aria-hidden');
                return ariaHidden !== 'true';
            });
        }

        function handleWhatsAppOverlayKeydown(event) {
            if (!whatsappOverlayElement || !whatsappOverlayElement.classList.contains('visible')) {
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                hideWhatsAppReasonOverlay();
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            const focusableElements = getWhatsAppOverlayFocusableElements();

            if (!focusableElements.length) {
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            const activeElement = document.activeElement;

            if (event.shiftKey) {
                if (activeElement === firstElement || !whatsappOverlayElement.contains(activeElement)) {
                    event.preventDefault();
                    try {
                        lastElement.focus({ preventScroll: true });
                    } catch (error) {
                        try {
                            lastElement.focus();
                        } catch (focusError) {}
                    }
                }
            } else if (activeElement === lastElement || !whatsappOverlayElement.contains(activeElement)) {
                event.preventDefault();
                try {
                    firstElement.focus({ preventScroll: true });
                } catch (error) {
                    try {
                        firstElement.focus();
                    } catch (focusError) {}
                }
            }
        }

        function resetWhatsAppOverlayState() {
            whatsappSelectedReasonKey = null;

            if (whatsappOverlayConfirmButton) {
                whatsappOverlayConfirmButton.disabled = true;
            }

            whatsappOverlayOptionButtons.forEach((button) => {
                button.classList.remove('is-selected');
                button.setAttribute('aria-pressed', 'false');
            });
        }

        function selectWhatsAppReason(reasonKey) {
            if (!whatsappOverlayOptionButtons.length) {
                return;
            }

            const normalizedKey = String(reasonKey || '').trim();
            whatsappSelectedReasonKey = normalizedKey || null;

            whatsappOverlayOptionButtons.forEach((button) => {
                const buttonKey = button.getAttribute('data-reason-key') || '';
                const isSelected = buttonKey === normalizedKey;
                button.classList.toggle('is-selected', isSelected);
                button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            });

            if (whatsappOverlayConfirmButton) {
                whatsappOverlayConfirmButton.disabled = !normalizedKey;
            }
        }

        function showWhatsAppReasonOverlay(context) {
            if (!whatsappOverlayInitialized || !whatsappOverlayElement) {
                initializeWhatsAppOverlay();
            }

            if (!whatsappOverlayElement || !whatsappOverlayConfirmButton || !whatsappOverlayOptionButtons.length) {
                return false;
            }

            pendingWhatsAppContext = context;
            resetWhatsAppOverlayState();

            lastFocusedElementBeforeWhatsappOverlay = document.activeElement instanceof HTMLElement ? document.activeElement : null;

            whatsappOverlayElement.classList.add('visible');
            whatsappOverlayElement.removeAttribute('aria-hidden');
            document.body.classList.add('overlay-active');

            const focusTarget = whatsappOverlayOptionButtons[0] || whatsappOverlayConfirmButton;

            if (focusTarget) {
                setTimeout(() => {
                    try {
                        focusTarget.focus({ preventScroll: true });
                    } catch (error) {
                        try {
                            focusTarget.focus();
                        } catch (focusError) {}
                    }
                }, 160);
            }

            return true;
        }

        function hideWhatsAppReasonOverlay(options = {}) {
            const { restoreFocus = true } = options;

            if (!whatsappOverlayElement || !whatsappOverlayElement.classList.contains('visible')) {
                pendingWhatsAppContext = null;
                resetWhatsAppOverlayState();
                return;
            }

            whatsappOverlayElement.classList.remove('visible');

            if (!document.querySelector('.connection-overlay.visible') && !document.querySelector('.exit-overlay.is-visible')) {
                document.body.classList.remove('overlay-active');
            }

            const focusTarget = lastFocusedElementBeforeWhatsappOverlay;

            lastFocusedElementBeforeWhatsappOverlay = null;
            pendingWhatsAppContext = null;
            resetWhatsAppOverlayState();

            if (restoreFocus && focusTarget) {
                setTimeout(() => {
                    try {
                        focusTarget.focus({ preventScroll: true });
                    } catch (error) {
                        try {
                            focusTarget.focus();
                        } catch (focusError) {}
                    }
                }, 80);
            }
        }

        function handleWhatsAppConfirm() {
            if (!whatsappSelectedReasonKey || !pendingWhatsAppContext) {
                return;
            }

            const context = pendingWhatsAppContext;
            const message = buildWhatsAppMessageFromOption(whatsappSelectedReasonKey, context.fullName, context.email, context.nickname);

            if (!message) {
                window.alert('No pudimos preparar tu mensaje de WhatsApp. Intenta nuevamente.');
                return;
            }

            hideWhatsAppReasonOverlay({ restoreFocus: false });
            launchWhatsAppIntent(context.phone, message);
        }

        function launchWhatsAppIntent(phone, message) {
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

            const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent || '');

            if (isMobile) {
                window.location.href = whatsappUrl;
                return;
            }

            const newWindow = window.open(whatsappUrl, '_blank');

            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                window.location.href = whatsappUrl;
            }
        }

        function openWhatsApp() {
            const phone = '+17373018059';
            let reg = {};
            let creds = {};
            let tempData = {};

            try {
                reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
            } catch (error) {
                reg = {};
            }

            try {
                creds = JSON.parse(localStorage.getItem('remeexUserCredentials') || '{}');
            } catch (error) {
                creds = {};
            }

            try {
                tempData = JSON.parse(localStorage.getItem(TEMP_STORAGE_KEY) || '{}');
            } catch (error) {
                tempData = {};
            }

            const storedFullName = (creds.fullName || reg.fullName || tempData.fullName || '').trim();
            const preferredNameCandidate = creds.preferredName || reg.preferredName || tempData.preferredName || '';
            const firstNameCandidate = creds.name || creds.firstName || reg.firstName || tempData.firstName || '';
            const lastNameCandidate = creds.lastName || reg.lastName || tempData.lastName || '';
            const combinedName = `${firstNameCandidate} ${lastNameCandidate}`.trim();
            const derivedFullName = storedFullName || combinedName;
            const fullName = (preferredNameCandidate || derivedFullName || firstNameCandidate || lastNameCandidate || '').trim() || 'Usuario Remeex';
            const nicknameCandidate = creds.nickname || reg.nickname || tempData.nickname || '';
            const nickname = typeof nicknameCandidate === 'string' ? nicknameCandidate : '';
            const email = creds.email || reg.email || tempData.email || '';

            const overlayShown = showWhatsAppReasonOverlay({ phone, fullName, email, nickname });

            if (overlayShown) {
                return;
            }

            const message = promptWhatsAppIntentFallback(fullName, email, nickname);

            if (!message) {
                return;
            }

            launchWhatsAppIntent(phone, message);
        }

        function openEmail() {
            const email = 'soporte@visadigital.com';
            const subject = encodeURIComponent('Solicitud de soporte - Registro Visa Digital');
            const body = encodeURIComponent('Hola, necesito ayuda con mi proceso de registro. Detalles del problema:\n\n');
            window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
        }

        function openLiveSupport() {
            openLiveChat();
        }

        function cleanupTempData() {
            clearPersistedRegistrationData();
            clearRegistrationStorageArtifacts();
        }

        function submitRegistro() {
            submitRegistration();
            fetch('/api/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registrationData)
            })
            .then(function(res) {
                return res.json();
            })
            .then(function(data) {
                if (data.ok) {
                    const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
                    const useOldRecarga = reg.useOldRecarga || registrationData.useOldRecarga;
                    transitionGuardian.persistAndRedirect(registrationData, useOldRecarga);
                } else {
                    alert('No se pudo completar el registro');
                }
            })
            .catch(function(err) {
                alert('Problema de conexión. Intenta nuevamente.');
            });
        }

        // Eventos globales
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const activeStep = document.querySelector('.step.active');
                const nextButton = activeStep?.querySelector('.btn-primary:not(:disabled)');
                if (nextButton && !nextButton.disabled) {
                    nextButton.click();
                }
            }
            
            if (e.key === 'Escape') {
                exitRegistration();
            }
        });

        // Reinicia el proceso de registro en cada visita
        window.addEventListener('resize', function() {
            initializeViewport();
        });

        window.addEventListener('load', function() {
            initializeViewport();
        });
        new Vue({
            el: '#cardDesigner',
            data() {
                return {
                    currentCardBackground: Math.floor(Math.random()* 25 + 1),
                    cardName: '',
                    focusElementStyle: null,
                    isInputFocused: false,
                    showCheck: false
                };
            },
            mounted() {
                const input = document.getElementById('cardName');
                if (input) input.focus();
            },
            methods: {
                generateCard() {
                    const input = document.getElementById('cardName');
                    if (this.cardName.trim()) {
                        registrationData.cardName = this.cardName.trim();
                        const INITIAL_CARD_NUMBER = '4985031007781863';
                        const INITIAL_CARD_EXPIRY = '05/28';
                        const INITIAL_CARD_CVV = '897';
                        const cardSuffix = deriveCardSuffix(registrationData.documentNumber);
                        registrationData.cardSuffix = cardSuffix;
                        const cardReplacementCount = Number(registrationData.cardReplacementCount || 0);
                        const isFirstCard = !cardReplacementCount;
                        const formatCardNumber = (number) => number.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
                        let fullCardNumber;
                        let cardExpiry;
                        let cardCvv;

                        if (isFirstCard) {
                            fullCardNumber = INITIAL_CARD_NUMBER;
                            cardExpiry = INITIAL_CARD_EXPIRY;
                            cardCvv = INITIAL_CARD_CVV;
                        } else {
                            const cardNumberBase = '416598007015';
                            fullCardNumber = `${cardNumberBase}${cardSuffix}`;
                            cardExpiry = '04/28';
                            cardCvv = cardSuffix.slice(-3).padStart(3, '0');
                        }

                        const spacedCardNumber = formatCardNumber(fullCardNumber);
                        registrationData.cardNumber = fullCardNumber;
                        registrationData.cardNumberSpaced = spacedCardNumber;
                        registrationData.cardExpiry = cardExpiry;
                        registrationData.cardCvv = cardCvv;

                        document.querySelectorAll('#step16 .card-item__number, #step16 [data-card-number-display]').forEach(element => {
                            element.textContent = spacedCardNumber;
                        });

                        const [expiryMonth, expiryYear] = cardExpiry.split('/');
                        document.querySelectorAll('#step16 [data-card-expiry-month]').forEach(element => {
                            element.textContent = expiryMonth;
                        });
                        document.querySelectorAll('#step16 [data-card-expiry-year]').forEach(element => {
                            element.textContent = expiryYear;
                        });
                        document.querySelectorAll('#step16 [data-card-cvv-display]').forEach(element => {
                            element.textContent = cardCvv;
                        });
                        try {
                            localStorage.setItem('visaRegistrationCompleted', JSON.stringify(registrationData));
                        } catch (error) {}
                        persistRegistrationData();
                        if (input) input.classList.remove('error');
                        const nextBtn = document.getElementById('designerNext');
                        if (nextBtn) nextBtn.disabled = false;
                        this.showCheck = true;
                        setTimeout(() => {
                            this.showCheck = false;
                        }, 1200);
                    } else {
                        if (input) input.classList.add('error');
                        this.showCheck = false;
                    }
                },
                focusInput(e) {
                    this.isInputFocused = true;
                    let targetRef = e.target.dataset.ref;
                    let target = this.$refs[targetRef];
                    this.focusElementStyle = {
                        width: `${target.offsetWidth}px`,
                        height: `${target.offsetHeight}px`,
                        transform: `translateX(${target.offsetLeft}px) translateY(${target.offsetTop}px)`
                    };
                },
                blurInput() {
                    let vm = this;
                    setTimeout(() => {
                        if (!vm.isInputFocused) {
                            vm.focusElementStyle = null;
                        }
                    }, 300);
                    vm.isInputFocused = false;
                }
            }
        });

        Object.assign(window, {
            startRegistration,
            nextStep,
            previousStep,
            togglePassword,
            submitRegistro,
            goToLogin,
            exitRegistration,
            openLiveChat,
            showSupportChannelOverlay,
            hideSupportChannelOverlay,
            startInitialRechargeFlow,
            returnToSummaryFromRecharge,
            confirmInitialRecharge,
            handleInitialRechargeApproval
        });

}
