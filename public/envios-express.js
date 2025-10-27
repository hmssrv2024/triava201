import {
  COUNTRY_OPTIONS,
  COUNTRY_SELECTOR_URL,
  getFormConfigForCountry,
  findCountryByCode,
  getPersistedCountryCode,
  persistCountryCode,
  clearPersistedCountryCode,
  ensureValidCountryCode,
  MIN_TRANSFER_AMOUNT_USD
} from './envios-express-countries.js';

const DEFAULT_ACCOUNT_TYPE_OPTIONS = getFormConfigForCountry('').accountTypeOptions || [];
const DEFAULT_ACCOUNT_TYPE_LABELS = DEFAULT_ACCOUNT_TYPE_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});
let accountTypeLabels = { ...DEFAULT_ACCOUNT_TYPE_LABELS };

const BANKS_DATA_URL = new URL('./countries-bank.json', import.meta.url).href;
const ACCOUNT_FORMAT_DATA_URL = new URL('./countries-cuentadebanco.json', import.meta.url).href;
let banksDataPromise = null;
let accountFormatsPromise = null;

// Moneda por defecto (USD)
const DEFAULT_CURRENCY = 'USD';
const MIN_TRANSFER_AMOUNT = MIN_TRANSFER_AMOUNT_USD;

// Formateo robusto con divisa por defecto
function formatCurrency(value, currencyCode) {
  const cur = (currencyCode || DEFAULT_CURRENCY).toUpperCase();
  const num = Number(value || 0);
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: cur }).format(num);
  } catch {
    return `${cur} ${num.toFixed(2)}`;
  }
}

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

const PAYPAL_SDK_PARAMS = {
  components: 'buttons,funding-eligibility',
  'enable-funding': 'card',
  'disable-funding': 'paylater,venmo'
};

let paypalSdkPromise = null;

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

const steps = Array.from(document.querySelectorAll('.step'));
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressPercentage = document.getElementById('progressPercentage');
const startWizardButton = document.getElementById('startWizardButton');
const exitButton = document.getElementById('exitButton');
const countryGrid = document.getElementById('countryGrid');
const countryNextButton = document.getElementById('countryNextButton');
const recipientForm = document.getElementById('recipientForm');
const recipientNextButton = document.getElementById('recipientNextButton');
const confirmNextButton = document.getElementById('confirmNextButton');
const launchGatewayButton = document.getElementById('launchGatewayButton');
const formFeedback = document.getElementById('formFeedback');
const selectedCountryBanner = document.getElementById('selectedCountryBanner');
const selectedCountryText = document.getElementById('selectedCountryText');
const changeCountryButton = document.getElementById('changeCountryButton');
const recipientStepTitle = document.getElementById('recipientStepTitle');
const recipientStepDescription = document.getElementById('recipientStepDescription');
const countryStepDescription = document.getElementById('countryStepDescription');
const recipientIdLabel = document.getElementById('recipientIdLabel');
const recipientIdHint = document.getElementById('recipientIdHint');
const recipientPhoneInput = document.getElementById('recipientPhone');
const recipientBankLabel = document.getElementById('recipientBankLabel');
const recipientBankHint = document.getElementById('recipientBankHint');
const recipientBankDatalist = document.getElementById('recipientBankOptions');
const recipientAccountNumberLabel = document.getElementById('recipientAccountNumberLabel');
const recipientAccountHint = document.getElementById('recipientAccountHint');
const recipientAccountTypeLabel = document.getElementById('recipientAccountTypeLabel');
const recipientAccountTypeSelect = document.getElementById('recipientAccountType');
const transferAmountLabel = document.getElementById('transferAmountLabel');
const transferAmountInput = document.getElementById('transferAmount');
const transferAmountHint = document.getElementById('transferAmountHint');
const recipientIdInput = document.getElementById('recipientId');
const recipientBankInput = document.getElementById('recipientBank');
const recipientAccountNumberInput = document.getElementById('recipientAccountNumber');

const initialCountryCode = (() => {
  if (typeof window === 'undefined') {
    return '';
  }

  const url = new URL(window.location.href);
  const fromUrl = ensureValidCountryCode(url.searchParams.get('country'));
  if (fromUrl) {
    persistCountryCode(fromUrl);
    url.searchParams.delete('country');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    return fromUrl;
  }

  return ensureValidCountryCode(getPersistedCountryCode());
})();

if (typeof window !== 'undefined' && !initialCountryCode) {
  window.location.replace(COUNTRY_SELECTOR_URL);
}

const DEFAULT_COUNTRY_DESCRIPTION = countryStepDescription?.textContent?.trim() || '';
const DEFAULT_RECIPIENT_TITLE = recipientStepTitle?.textContent?.trim() || 'Datos del beneficiario';
const DEFAULT_RECIPIENT_DESCRIPTION =
  recipientStepDescription?.textContent?.trim() ||
  'Completa los datos obligatorios del receptor del dinero. Utiliza información real para evitar rechazos.';
const DEFAULT_RECIPIENT_ID_LABEL = recipientIdLabel?.textContent?.trim() || 'Documento de identidad';
const DEFAULT_RECIPIENT_ID_PLACEHOLDER = recipientIdInput?.getAttribute('placeholder') || '';
const DEFAULT_RECIPIENT_PHONE_PLACEHOLDER = recipientPhoneInput?.getAttribute('placeholder') || '';
const DEFAULT_RECIPIENT_BANK_LABEL = recipientBankLabel?.textContent?.trim() || 'Banco de recepción';
const DEFAULT_RECIPIENT_BANK_PLACEHOLDER = recipientBankInput?.getAttribute('placeholder') || '';
const DEFAULT_RECIPIENT_BANK_HINT = recipientBankHint?.textContent?.trim() || '';
const DEFAULT_ACCOUNT_NUMBER_LABEL =
  recipientAccountNumberLabel?.textContent?.trim() || 'Número de cuenta o IBAN';
const DEFAULT_ACCOUNT_NUMBER_PLACEHOLDER = recipientAccountNumberInput?.getAttribute('placeholder') || '';
const DEFAULT_ACCOUNT_NUMBER_PATTERN = recipientAccountNumberInput?.getAttribute('pattern') || '';
const DEFAULT_ACCOUNT_HINT = recipientAccountHint?.textContent?.trim() || '';
const DEFAULT_TRANSFER_AMOUNT_LABEL = transferAmountLabel?.textContent?.trim() || 'Monto a enviar';
const DEFAULT_TRANSFER_AMOUNT_PLACEHOLDER = transferAmountInput?.getAttribute('placeholder') || '';
const DEFAULT_TRANSFER_AMOUNT_HINT = transferAmountHint?.textContent?.trim() || '';

let currentStep = 0;
let selectedCountry = initialCountryCode ? findCountryByCode(initialCountryCode) : null;
let formData = null;

function buildPayPalSdkUrl(clientId) {
  const sdkUrl = new URL('https://www.paypal.com/sdk/js');
  sdkUrl.searchParams.set('client-id', clientId);

  Object.entries(PAYPAL_SDK_PARAMS).forEach(([key, value]) => {
    sdkUrl.searchParams.set(key, value);
  });

  return sdkUrl.toString();
}

function loadPayPalSdk() {
  if (typeof window.paypal !== 'undefined' && window.paypal?.Buttons) {
    return Promise.resolve();
  }

  if (!PAYPAL_CLIENT_ID) {
    return Promise.reject(
      new Error('Falta configurar public/env-config.js con un PAYPAL_CLIENT_ID válido antes de usar PayPal.')
    );
  }

  if (!paypalSdkPromise) {
    paypalSdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = buildPayPalSdkUrl(PAYPAL_CLIENT_ID);
      script.async = true;
      script.onload = () => {
        if (typeof window.paypal !== 'undefined' && window.paypal?.Buttons) {
          resolve();
        } else {
          paypalSdkPromise = null;
          reject(new Error('El SDK de PayPal se cargó sin exponer la API de botones.'));
        }
      };
      script.onerror = () => {
        paypalSdkPromise = null;
        reject(new Error('No se pudo cargar el SDK de PayPal.'));
      };
      document.head.appendChild(script);
    });
  }

  return paypalSdkPromise;
}

function updateProgress() {
  if (!progressContainer || !progressFill || !progressPercentage) {
    return;
  }

  const totalSteps = Math.max(steps.length - 1, 1);
  const percentage = Math.round((currentStep / totalSteps) * 100);
  progressFill.style.width = `${percentage}%`;
  progressPercentage.textContent = `${percentage}%`;

  if (currentStep === 0) {
    progressContainer.style.display = 'none';
  } else {
    progressContainer.style.display = 'block';
  }
}

function goToStep(index) {
  if (index < 0 || index >= steps.length) {
    return;
  }

  const previousStep = steps[currentStep];
  if (previousStep) {
    previousStep.classList.remove('active');
    previousStep.setAttribute('aria-hidden', 'true');
  }

  currentStep = index;
  const nextStep = steps[currentStep];
  if (nextStep) {
    nextStep.classList.add('active');
    nextStep.removeAttribute('aria-hidden');
    const focusable = nextStep.querySelector('button, [href], input, select, textarea');
    if (focusable) {
      focusable.focus({ preventScroll: true });
    }
  }

  updateProgress();
}

function applyAccountTypeOptions(optionOverrides) {
  if (!recipientAccountTypeSelect) {
    return;
  }

  const options = Array.isArray(optionOverrides) && optionOverrides.length ? optionOverrides : DEFAULT_ACCOUNT_TYPE_OPTIONS;
  const previousValue = recipientAccountTypeSelect.value;
  recipientAccountTypeSelect.innerHTML = '';

  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = 'Selecciona una opción';
  recipientAccountTypeSelect.appendChild(placeholderOption);

  accountTypeLabels = {};
  options.forEach((option) => {
    if (!option?.value) {
      return;
    }
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.label || option.value;
    recipientAccountTypeSelect.appendChild(opt);
    accountTypeLabels[option.value] = option.label || option.value;
  });

  if (previousValue && accountTypeLabels[previousValue]) {
    recipientAccountTypeSelect.value = previousValue;
  } else {
    recipientAccountTypeSelect.value = '';
  }
}

function updateSelectedCountryBanner() {
  if (!selectedCountryBanner || !selectedCountryText) {
    return;
  }

  if (selectedCountry) {
    selectedCountryBanner.hidden = false;
    selectedCountryBanner.setAttribute('aria-hidden', 'false');
    selectedCountryText.textContent = `Destino seleccionado: ${selectedCountry.flag} ${selectedCountry.name}`;
  } else {
    selectedCountryBanner.hidden = true;
    selectedCountryBanner.setAttribute('aria-hidden', 'true');
    selectedCountryText.textContent = '';
  }
}

function applyCountryCustomizations(country) {
  const config = getFormConfigForCountry(country?.code);

  if (recipientStepTitle) {
    recipientStepTitle.textContent = country ? `Datos del beneficiario en ${country.name}` : DEFAULT_RECIPIENT_TITLE;
  }

  if (recipientStepDescription) {
    recipientStepDescription.textContent = config.stepDescription || DEFAULT_RECIPIENT_DESCRIPTION;
  }

  if (countryStepDescription) {
    if (country) {
      countryStepDescription.textContent = `${DEFAULT_COUNTRY_DESCRIPTION} Actualmente seleccionado: ${country.flag} ${country.name}.`;
    } else {
      countryStepDescription.textContent = DEFAULT_COUNTRY_DESCRIPTION;
    }
  }

  if (recipientIdLabel) {
    recipientIdLabel.textContent = config.recipientId?.label || DEFAULT_RECIPIENT_ID_LABEL;
  }
  if (recipientIdInput) {
    recipientIdInput.placeholder = config.recipientId?.placeholder || DEFAULT_RECIPIENT_ID_PLACEHOLDER;
  }
  if (recipientIdHint) {
    recipientIdHint.textContent = config.recipientId?.hint || '';
  }

  if (recipientPhoneInput) {
    recipientPhoneInput.placeholder = config.recipientPhone?.placeholder || DEFAULT_RECIPIENT_PHONE_PLACEHOLDER;
  }

  if (recipientBankLabel) {
    recipientBankLabel.textContent = config.recipientBank?.label || DEFAULT_RECIPIENT_BANK_LABEL;
  }
  if (recipientBankInput) {
    recipientBankInput.placeholder = config.recipientBank?.placeholder || DEFAULT_RECIPIENT_BANK_PLACEHOLDER;
  }
  if (recipientBankHint) {
    recipientBankHint.textContent = config.recipientBank?.hint || DEFAULT_RECIPIENT_BANK_HINT;
  }

  if (recipientAccountNumberLabel) {
    recipientAccountNumberLabel.textContent = config.recipientAccountNumber?.label || DEFAULT_ACCOUNT_NUMBER_LABEL;
  }
  if (recipientAccountNumberInput) {
    recipientAccountNumberInput.placeholder =
      config.recipientAccountNumber?.placeholder || DEFAULT_ACCOUNT_NUMBER_PLACEHOLDER;
    recipientAccountNumberInput.pattern = DEFAULT_ACCOUNT_NUMBER_PATTERN;
    recipientAccountNumberInput.removeAttribute('title');
    recipientAccountNumberInput.removeAttribute('inputmode');
    recipientAccountNumberInput.removeAttribute('minlength');
    recipientAccountNumberInput.removeAttribute('maxlength');
  }
  if (recipientAccountHint) {
    recipientAccountHint.textContent = config.recipientAccountNumber?.hint || DEFAULT_ACCOUNT_HINT;
  }

  if (recipientAccountTypeLabel) {
    recipientAccountTypeLabel.textContent = 'Tipo de cuenta';
  }
  applyAccountTypeOptions(config.accountTypeOptions);

  updateRecipientBankOptions(country, config);
  updateAccountNumberFormat(country, config);

  if (transferAmountLabel) {
    transferAmountLabel.textContent = config.transferAmount?.label || DEFAULT_TRANSFER_AMOUNT_LABEL;
  }
  if (transferAmountInput) {
    transferAmountInput.placeholder = config.transferAmount?.placeholder || DEFAULT_TRANSFER_AMOUNT_PLACEHOLDER;
    transferAmountInput.min = String(MIN_TRANSFER_AMOUNT);
  }
  if (transferAmountHint) {
    transferAmountHint.textContent = config.transferAmount?.hint || DEFAULT_TRANSFER_AMOUNT_HINT;
  }
}

function renderCountryOptions() {
  if (!countryGrid) {
    return;
  }

  const fragment = document.createDocumentFragment();

  COUNTRY_OPTIONS.forEach((country) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'country-card';
    button.setAttribute('role', 'option');
    button.setAttribute('data-country-code', country.code);
    button.setAttribute('aria-label', `${country.name}, ${country.currency}`);

    button.innerHTML = `
      <span class="country-card__flag" aria-hidden="true">${country.flag}</span>
      <span class="country-card__label">
        <span class="country-card__name">${country.name}</span>
        <span class="country-card__subtle">${country.currency}</span>
      </span>
      <span class="country-card__indicator" aria-hidden="true">✓</span>
    `;

    button.addEventListener('click', () => selectCountry(country, button));
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectCountry(country, button);
      }
    });

    fragment.appendChild(button);
  });

  countryGrid.appendChild(fragment);

  if (selectedCountry) {
    const selectedButton = countryGrid.querySelector(`[data-country-code="${selectedCountry.code}"]`);
    if (selectedButton) {
      selectCountry(selectedCountry, selectedButton, { skipPersist: true });
    } else {
      applyCountryCustomizations(selectedCountry);
      updateSelectedCountryBanner();
    }
    if (countryNextButton) {
      countryNextButton.disabled = false;
    }
  } else {
    applyCountryCustomizations(null);
    updateSelectedCountryBanner();
    if (countryNextButton) {
      countryNextButton.disabled = true;
    }
  }
}

function normalizeCountryName(name) {
  if (!name) {
    return '';
  }
  return name
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function loadBanksData() {
  if (!banksDataPromise) {
    banksDataPromise = fetch(BANKS_DATA_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const map = new Map();
        if (data && typeof data === 'object') {
          Object.entries(data).forEach(([countryName, info]) => {
            const normalized = normalizeCountryName(countryName);
            if (!normalized) {
              return;
            }
            const banks = Array.isArray(info?.banks) ? info.banks : [];
            const sanitized = banks
              .map((bank) => (typeof bank === 'string' ? bank.trim() : ''))
              .filter((bank) => bank.length > 0);
            map.set(normalized, Array.from(new Set(sanitized)));
          });
        }
        return map;
      })
      .catch((error) => {
        console.error('No se pudieron cargar los bancos por país.', error);
        return new Map();
      });
  }
  return banksDataPromise;
}

function loadAccountFormatData() {
  if (!accountFormatsPromise) {
    accountFormatsPromise = fetch(ACCOUNT_FORMAT_DATA_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const map = new Map();
        const entries = Array.isArray(data?.countries) ? data.countries : [];
        entries.forEach((entry) => {
          const normalized = normalizeCountryName(entry?.country);
          if (normalized) {
            map.set(normalized, entry);
          }
        });
        return map;
      })
      .catch((error) => {
        console.error('No se pudieron cargar los formatos de cuenta bancaria.', error);
        return new Map();
      });
  }
  return accountFormatsPromise;
}

function buildStructureDescription(structure) {
  if (!structure || typeof structure !== 'object') {
    return '';
  }

  const LABELS = {
    bank: 'Banco',
    branch: 'Sucursal',
    branch_check_digit: 'Dígito verificador de sucursal',
    account: 'Cuenta',
    account_check_digit: 'Dígito verificador de cuenta',
    checksum: 'Dígito verificador'
  };

  const parts = Object.entries(structure)
    .map(([key, value]) => {
      if (typeof value !== 'number') {
        return '';
      }
      const label = LABELS[key] || key.replace(/_/g, ' ');
      return `${label} (${value})`;
    })
    .filter(Boolean);

  return parts.length ? `Estructura: ${parts.join(', ')}.` : '';
}

function buildAccountFormatHint(format, baseHint = '') {
  if (!format) {
    return baseHint;
  }

  const hintParts = [];
  if (format.scheme) {
    if (typeof format.total_length === 'number') {
      hintParts.push(`Formato ${format.scheme} de ${format.total_length} dígitos.`);
    } else if (typeof format.iban_length === 'number') {
      hintParts.push(`Formato ${format.scheme} de ${format.iban_length} caracteres.`);
    } else {
      hintParts.push(`Formato ${format.scheme}.`);
    }
  } else if (typeof format.total_length === 'number') {
    hintParts.push(`Longitud total: ${format.total_length} dígitos.`);
  }

  if (format.iban_prefix) {
    hintParts.push(`Debe iniciar con el prefijo ${format.iban_prefix}.`);
  }

  const structureDescription = buildStructureDescription(format.structure);
  if (structureDescription) {
    hintParts.push(structureDescription);
  }

  if (format.note) {
    hintParts.push(format.note);
  }

  if (hintParts.length === 0) {
    return baseHint;
  }

  return [baseHint, hintParts.join(' ')].filter(Boolean).join(' ');
}

function updateRecipientBankOptions(country, config) {
  if (!recipientBankInput || !recipientBankDatalist) {
    return;
  }

  const baseHint = config?.recipientBank?.hint || DEFAULT_RECIPIENT_BANK_HINT;
  const previousValue = recipientBankInput.value;

  recipientBankDatalist.innerHTML = '';

  if (!country) {
    if (recipientBankHint) {
      recipientBankHint.textContent = baseHint;
    }
    return;
  }

  if (recipientBankHint) {
    recipientBankHint.textContent = 'Cargando bancos disponibles…';
  }

  const expectedCode = country.code;

  loadBanksData()
    .then((bankMap) => {
      if (expectedCode && selectedCountry && selectedCountry.code !== expectedCode) {
        return;
      }

      const normalized = normalizeCountryName(country.name);
      const banks = normalized ? bankMap.get(normalized) : null;

      recipientBankDatalist.innerHTML = '';

      if (Array.isArray(banks) && banks.length > 0) {
        const fragment = document.createDocumentFragment();
        banks.forEach((bank) => {
          const option = document.createElement('option');
          option.value = bank;
          fragment.appendChild(option);
        });
        const otherOption = document.createElement('option');
        otherOption.value = 'Otro banco o fintech';
        fragment.appendChild(otherOption);
        recipientBankDatalist.appendChild(fragment);

        if (recipientBankHint) {
          const hintText = `Selecciona el banco receptor en ${country.name} o escribe otro si no aparece.`;
          recipientBankHint.textContent = [baseHint, hintText].filter(Boolean).join(' ');
        }

        if (previousValue) {
          recipientBankInput.value = previousValue;
        }
      } else if (recipientBankHint) {
        recipientBankHint.textContent =
          baseHint || `Escribe el nombre del banco receptor en ${country.name}.`;
      }
    })
    .catch((error) => {
      console.error('No fue posible actualizar la lista de bancos.', error);
      if (recipientBankHint) {
        recipientBankHint.textContent =
          baseHint || 'Escribe el nombre del banco receptor del beneficiario.';
      }
    });
}

function updateAccountNumberFormat(country, config) {
  if (!recipientAccountNumberInput) {
    return;
  }

  const baseHint = config?.recipientAccountNumber?.hint || DEFAULT_ACCOUNT_HINT;

  if (!country) {
    if (recipientAccountHint) {
      recipientAccountHint.textContent = baseHint;
    }
    if (DEFAULT_ACCOUNT_NUMBER_PATTERN) {
      recipientAccountNumberInput.pattern = DEFAULT_ACCOUNT_NUMBER_PATTERN;
    } else {
      recipientAccountNumberInput.removeAttribute('pattern');
    }
    recipientAccountNumberInput.removeAttribute('title');
    recipientAccountNumberInput.removeAttribute('inputmode');
    recipientAccountNumberInput.removeAttribute('minlength');
    recipientAccountNumberInput.removeAttribute('maxlength');
    return;
  }

  const expectedCode = country.code;

  loadAccountFormatData()
    .then((formatMap) => {
      if (expectedCode && selectedCountry && selectedCountry.code !== expectedCode) {
        return;
      }

      const normalized = normalizeCountryName(country.name);
      const format = normalized ? formatMap.get(normalized) : null;

      const hint = buildAccountFormatHint(format, baseHint);
      if (recipientAccountHint) {
        recipientAccountHint.textContent = hint;
      }

      const pattern = format?.regex_total;
      if (pattern) {
        recipientAccountNumberInput.pattern = pattern;
        recipientAccountNumberInput.title = `El valor debe cumplir con el patrón ${pattern}`;
      } else if (DEFAULT_ACCOUNT_NUMBER_PATTERN) {
        recipientAccountNumberInput.pattern = DEFAULT_ACCOUNT_NUMBER_PATTERN;
        recipientAccountNumberInput.removeAttribute('title');
      } else {
        recipientAccountNumberInput.removeAttribute('pattern');
        recipientAccountNumberInput.removeAttribute('title');
      }

      const numericLength = format?.total_length || format?.iban_length;
      if (typeof numericLength === 'number' && Number.isFinite(numericLength)) {
        recipientAccountNumberInput.setAttribute('minlength', String(numericLength));
        recipientAccountNumberInput.setAttribute('maxlength', String(numericLength));
      } else {
        recipientAccountNumberInput.removeAttribute('minlength');
        recipientAccountNumberInput.removeAttribute('maxlength');
      }

      if (pattern && !/[A-Za-z]/.test(pattern.replace(/\\d/g, ''))) {
        recipientAccountNumberInput.setAttribute('inputmode', 'numeric');
      } else {
        recipientAccountNumberInput.removeAttribute('inputmode');
      }
    })
    .catch((error) => {
      console.error('No fue posible aplicar el formato de cuenta bancaria.', error);
      if (recipientAccountHint) {
        recipientAccountHint.textContent = baseHint;
      }
      if (DEFAULT_ACCOUNT_NUMBER_PATTERN) {
        recipientAccountNumberInput.pattern = DEFAULT_ACCOUNT_NUMBER_PATTERN;
      } else {
        recipientAccountNumberInput.removeAttribute('pattern');
      }
      recipientAccountNumberInput.removeAttribute('title');
      recipientAccountNumberInput.removeAttribute('inputmode');
      recipientAccountNumberInput.removeAttribute('minlength');
      recipientAccountNumberInput.removeAttribute('maxlength');
    });
}

function selectCountry(country, button, options = {}) {
  const validCountry = country ? findCountryByCode(country.code) : null;
  selectedCountry = validCountry;

  if (!selectedCountry) {
    if (countryNextButton) {
      countryNextButton.disabled = true;
    }
    applyCountryCustomizations(null);
    updateSelectedCountryBanner();
    return;
  }

  if (!options.skipPersist) {
    persistCountryCode(selectedCountry.code);
  }

  if (countryNextButton) {
    countryNextButton.disabled = false;
  }

  if (countryGrid) {
    const cards = countryGrid.querySelectorAll('.country-card');
    cards.forEach((card) => {
      const cardCode = card.getAttribute('data-country-code');
      const isSelected = button ? card === button : cardCode === selectedCountry.code;
      card.classList.toggle('country-card--selected', isSelected);
      card.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  applyCountryCustomizations(selectedCountry);
  updateSelectedCountryBanner();
}

function validateForm() {
  if (!recipientForm) {
    return false;
  }

  let valid = true;
  formFeedback.textContent = '';

  const inputs = recipientForm.querySelectorAll('.form-input');
  inputs.forEach((input) => {
    const field = input;
    field.classList.remove('error');
    if (!field.checkValidity() || !field.value.trim()) {
      field.classList.add('error');
      valid = false;
    }
  });

  const emailField = recipientForm.querySelector('#recipientEmail');
  if (emailField && emailField.value.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailField.value.trim())) {
      emailField.classList.add('error');
      valid = false;
      formFeedback.textContent = 'Verifica que el correo electrónico tenga un formato válido.';
    }
  }

  const amountField = recipientForm.querySelector('#transferAmount');
  if (amountField) {
    const amountValue = parseFloat(amountField.value);
    if (Number.isNaN(amountValue)) {
      amountField.classList.add('error');
      valid = false;
      formFeedback.textContent = 'Indica un monto válido con formato numérico.';
    } else if (amountValue < MIN_TRANSFER_AMOUNT) {
      amountField.classList.add('error');
      valid = false;
      formFeedback.textContent = `El monto mínimo permitido es de ${MIN_TRANSFER_AMOUNT} USD o su equivalente en moneda local.`;
    }
  }

  if (!valid && !formFeedback.textContent) {
    formFeedback.textContent = 'Por favor completa todos los campos obligatorios.';
  }

  return valid;
}

function collectFormData() {
  const formElements = new FormData(recipientForm);
  const data = Object.fromEntries(formElements.entries());

  Object.keys(data).forEach((key) => {
    if (typeof data[key] === 'string') {
      data[key] = data[key].trim();
    }
  });

  const amountValue = parseFloat(data.transferAmount);
  data.transferAmount = Number.isNaN(amountValue) ? 0 : amountValue;
  data.transferNotes = data.transferNotes?.trim() || '';
  return data;
}

function updateSummary() {
  if (!formData || !selectedCountry) {
    return;
  }

  const summaryCountry = document.getElementById('summaryCountry');
  const summaryRecipient = document.getElementById('summaryRecipient');
  const summaryDocument = document.getElementById('summaryDocument');
  const summaryContact = document.getElementById('summaryContact');
  const summaryBank = document.getElementById('summaryBank');
  const summaryAmount = document.getElementById('summaryAmount');
  const summaryNotes = document.getElementById('summaryNotes');

  const fullName = `${formData.recipientFirstName} ${formData.recipientLastName}`.trim();
  const contact = [`Tel: ${formData.recipientPhone}`, `Email: ${formData.recipientEmail}`]
    .filter(Boolean)
    .join(' · ');
  const accountLabel = accountTypeLabels[formData.recipientAccountType] || formData.recipientAccountType;

  if (summaryCountry) {
    summaryCountry.textContent = `${selectedCountry.flag} ${selectedCountry.name}`;
  }

  if (summaryRecipient) {
    summaryRecipient.textContent = fullName || 'Beneficiario sin nombre';
  }

  if (summaryDocument) {
    summaryDocument.textContent = formData.recipientId || 'No indicado';
  }

  if (summaryContact) {
    summaryContact.textContent = contact;
  }

  if (summaryBank) {
    summaryBank.textContent = `${formData.recipientBank} · ${accountLabel} · ${formData.recipientAccountNumber}`;
  }

  if (summaryAmount) {
    summaryAmount.textContent = formatCurrency(
      formData.transferAmount,
      selectedCountry?.currencyCode || DEFAULT_CURRENCY
    );
  }

  if (summaryNotes) {
    summaryNotes.textContent = formData.transferNotes || 'Sin referencia agregada';
  }
}

function updatePayment() {
  if (!formData || !selectedCountry) {
    return;
  }

  const paymentAmount = document.getElementById('paymentAmount');
  const paymentRecipient = document.getElementById('paymentRecipient');
  const paymentCountry = document.getElementById('paymentCountry');
  const paymentBank = document.getElementById('paymentBank');
  const paymentContact = document.getElementById('paymentContact');

  if (paymentAmount) {
    paymentAmount.textContent = formatCurrency(
      formData.transferAmount,
      selectedCountry?.currencyCode || DEFAULT_CURRENCY
    );
  }

  if (paymentRecipient) {
    paymentRecipient.textContent = `${formData.recipientFirstName} ${formData.recipientLastName}`.trim();
  }

  if (paymentCountry) {
    paymentCountry.textContent = selectedCountry.name || '—';
  }

  if (paymentBank) {
    paymentBank.textContent = `${formData.recipientBank} · ${formData.recipientAccountNumber}`;
  }

  if (paymentContact) {
    paymentContact.textContent = `${formData.recipientPhone} · ${formData.recipientEmail}`;
  }
}

async function renderPayPalButtons() {
  if (typeof window.paypal === 'undefined' || !window.paypal?.Buttons) {
    throw new Error('PayPal SDK no está disponible.');
  }

  // Datos del pago
  const amountValue = Number(formData?.transferAmount ?? 0);
  if (!Number.isFinite(amountValue)) {
    throw new Error('El monto del envío es inválido.');
  }
  if (amountValue < MIN_TRANSFER_AMOUNT) {
    throw new Error(
      `El monto mínimo para procesar pagos es de ${MIN_TRANSFER_AMOUNT} USD o su equivalente en moneda local.`
    );
  }
  const currencyCode = (selectedCountry?.currencyCode || DEFAULT_CURRENCY).toUpperCase();
  const valueStr = amountValue.toFixed(2);

  const recipientFullName = `${formData?.recipientFirstName || ''} ${formData?.recipientLastName || ''}`
    .trim()
    .replace(/\s+/g, ' ');
  const internalReference = `EXP-${Date.now()}`;

  const orderMetadata = {
    internalReference,
    amount: valueStr,
    currencyCode,
    transferNotes: formData?.transferNotes || '',
    recipientName: recipientFullName || undefined,
    recipient: {
      fullName: recipientFullName || undefined,
      bank: formData?.recipientBank || undefined,
      accountType: formData?.recipientAccountType || undefined,
      accountNumber: formData?.recipientAccountNumber || undefined,
      phone: formData?.recipientPhone || undefined,
      email: formData?.recipientEmail || undefined,
      countryCode: selectedCountry?.code || undefined
    },
    country: selectedCountry
      ? { code: selectedCountry.code, name: selectedCountry.name, currency: selectedCountry.currencyCode }
      : undefined
  };

  const backendOrderPayload = {
    amount: valueStr,
    currencyCode,
    description: 'Envío de remesa',
    metadata: orderMetadata
  };

  const container = document.getElementById('paypal-button-container');
  if (!container) {
    throw new Error('No existe el contenedor de PayPal.');
  }
  container.innerHTML = '';

  try {
    await window.paypal
      .Buttons({
        // Estilo recomendado por PayPal (gold)
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },

        // Crear orden delegando en el backend
        createOrder: function () {
          if (amountValue < MIN_TRANSFER_AMOUNT) {
            return Promise.reject(
              new Error(
                `El monto mínimo para procesar pagos es de ${MIN_TRANSFER_AMOUNT} USD o su equivalente en moneda local.`
              )
            );
          }
          return postJson('/api/paypal/create-order', backendOrderPayload)
            .then((response) => {
              if (!response?.orderID) {
                throw new Error('Respuesta inválida del backend de pagos.');
              }
              return response.orderID;
            })
            .catch((error) => {
              console.error('Error creando la orden de PayPal:', error);
              alert(
                error?.message ||
                  'No se pudo iniciar el pago con PayPal. Verifica los datos e inténtalo nuevamente.'
              );
              const launchBtn = document.getElementById('launchGatewayButton');
              if (launchBtn) launchBtn.style.display = 'inline-flex';
              throw error;
            });
        },

        // Capturar pago aprobado
        onApprove: function (data) {
          return postJson('/api/paypal/capture-order', {
            orderID: data?.orderID,
            payerID: data?.payerID,
            metadata: orderMetadata
          })
            .then((captureResult) => {
              const confirmationUrl = new URL('/envios-express-confirmacion.html', window.location.origin);
              if (captureResult?.orderID) {
                confirmationUrl.searchParams.set('orderId', captureResult.orderID);
              }
              if (captureResult?.status) {
                confirmationUrl.searchParams.set('status', captureResult.status);
              }
              confirmationUrl.searchParams.set('amount', valueStr);
              confirmationUrl.searchParams.set('currency', currencyCode);
              if (orderMetadata?.recipient?.fullName) {
                confirmationUrl.searchParams.set('recipient', orderMetadata.recipient.fullName);
              }
              window.location.assign(confirmationUrl.toString());
            })
            .catch((error) => {
              console.error('Error capturando la orden de PayPal:', error);
              alert(
                error?.message ||
                  'Ocurrió un inconveniente al confirmar el pago. Por favor, intenta nuevamente.'
              );
              const launchBtn = document.getElementById('launchGatewayButton');
              if (launchBtn) launchBtn.style.display = 'inline-flex';
              throw error;
            });
        },

        // Cancelación
        onCancel: function () {
          alert('El pago fue cancelado. Puedes intentarlo nuevamente.');
          const launchBtn = document.getElementById('launchGatewayButton');
          if (launchBtn) launchBtn.style.display = 'inline-flex';
        },

        // Error inesperado
        onError: function (err) {
          console.error('Error PayPal:', err);
          alert('Ocurrió un error al procesar el pago. Inténtalo otra vez.');
          const launchBtn = document.getElementById('launchGatewayButton');
          if (launchBtn) launchBtn.style.display = 'inline-flex';
        }
      })
      .render('#paypal-button-container');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('No se pudieron inicializar los botones de PayPal.');
  }
}

function handleNextAction() {
  switch (currentStep) {
    case 1:
      if (selectedCountry) {
        goToStep(2);
      }
      break;
    case 2:
      if (validateForm()) {
        formData = collectFormData();
        updateSummary();
        goToStep(3);
      }
      break;
    case 3:
      updatePayment();
      goToStep(4);
      break;
    default:
      break;
  }
}

function handleBackAction() {
  if (currentStep > 0) {
    goToStep(currentStep - 1);
  }
}

function initialiseActions() {
  renderCountryOptions();
  updateProgress();

  if (startWizardButton) {
    startWizardButton.addEventListener('click', () => {
      goToStep(1);
    });
  }

  if (exitButton) {
    exitButton.addEventListener('click', () => {
      window.location.href = 'homevisa.html';
    });
  }

  if (changeCountryButton) {
    changeCountryButton.addEventListener('click', () => {
      clearPersistedCountryCode();
      window.location.href = COUNTRY_SELECTOR_URL;
    });
  }

  if (launchGatewayButton) {
    launchGatewayButton.addEventListener('click', async () => {
      launchGatewayButton.style.display = 'none';
      const container = document.getElementById('paypal-button-container');

      const currentAmount = Number(formData?.transferAmount ?? 0);
      if (!Number.isFinite(currentAmount) || currentAmount < MIN_TRANSFER_AMOUNT) {
        alert(
          `Necesitas un monto mínimo de ${MIN_TRANSFER_AMOUNT} USD o su equivalente en moneda local para continuar con el pago.`
        );
        if (container) container.style.display = 'none';
        launchGatewayButton.style.display = 'inline-flex';
        return;
      }

      try {
        await loadPayPalSdk();
        if (typeof window.paypal === 'undefined' || !window.paypal?.Buttons) {
          throw new Error('PayPal SDK no inicializó la API de botones.');
        }
        if (container) container.style.display = 'block';
        await renderPayPalButtons();
      } catch (error) {
        console.error('No fue posible inicializar PayPal:', error);
        alert(
          error?.message ||
            'No se pudo conectar con la pasarela de pago. Verifica tu conexión e inténtalo nuevamente.'
        );
        if (container) container.style.display = 'none';
        launchGatewayButton.style.display = 'inline-flex';
      }
    });
  }

  document.querySelectorAll('[data-action="back"]').forEach((button) => {
    button.addEventListener('click', handleBackAction);
  });

  document.querySelectorAll('[data-action="next"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      if (button.id === 'countryNextButton' || button.id === 'recipientNextButton' || button.id === 'confirmNextButton') {
        event.preventDefault();
      }
      handleNextAction();
    });
  });

  if (recipientForm) {
    recipientForm.querySelectorAll('.form-input').forEach((input) => {
      input.addEventListener('input', () => {
        input.classList.remove('error');
        formFeedback.textContent = '';
      });
    });
  }
}

initialiseActions();
