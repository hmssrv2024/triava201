function getVerificationAmountUsd(balanceUsd) {
if (typeof CONFIG !== 'undefined' && CONFIG.EXCHANGE_RATES && CONFIG.EXCHANGE_RATES.FORCED_VALIDATION_USD !== null) return CONFIG.EXCHANGE_RATES.FORCED_VALIDATION_USD;
if (typeof isLiteModeActive === 'function' && isLiteModeActive()) return CONFIG.LITE_VALIDATION_AMOUNT;
if (balanceUsd >= 5001) return 45;
if (balanceUsd >= 2001) return 40;
if (balanceUsd >= 1001) return 35;
if (balanceUsd >= 501) return 30;
return 25;
}

function formatCurrency(amount, currency) {
amount = Number(amount);
if (currency === 'usd') return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
if (currency === 'bs') return 'Bs ' + amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
return amount;
}

function updateVerificationTexts(balanceUsd, rateBs) {
const amtUsd = getVerificationAmountUsd(balanceUsd);
const amtBs = amtUsd * rateBs;
const usdEl = document.getElementById('verification-usd');
const bsEl = document.getElementById('verification-bs');
const usdText = document.getElementById('verification-usd-text');
const bsText = document.getElementById('verification-bs-text');
const usdNote = document.getElementById('verification-usd-note');
const usdTest = document.getElementById('verification-usd-test');
const usdTest2 = document.getElementById('verification-usd-test2');
const usdTable = document.getElementById('verification-usd-table');
const bsTable = document.getElementById('verification-bs-table');
if (usdEl) usdEl.textContent = formatCurrency(amtUsd, 'usd');
if (bsEl) bsEl.textContent = formatCurrency(amtBs, 'bs');
if (usdText) usdText.textContent = formatCurrency(amtUsd, 'usd');
if (bsText) bsText.textContent = formatCurrency(amtBs, 'bs');
if (usdNote) usdNote.textContent = formatCurrency(amtUsd, 'usd');
if (usdTest) usdTest.textContent = formatCurrency(amtUsd, 'usd');
if (usdTest2) usdTest2.textContent = formatCurrency(amtUsd, 'usd');
if (usdTable) usdTable.textContent = formatCurrency(amtUsd, 'usd');
if (bsTable) bsTable.textContent = '(' + formatCurrency(amtBs, 'bs') + ')';
}

function initFromGlobalData() {
const userData = GlobalData.get('remeexUserData') || {};
const balance = GlobalData.get('remeexBalance') || {};
const verification = localStorage.getItem('remeexVerificationStatus') || 'unverified';
const firstRecharge = localStorage.getItem('remeexHasMadeFirstRecharge') === 'true';

const firstName = (userData.fullName || userData.name || '').split(' ')[0];
const heroTitle = document.getElementById('hero-title');
if (heroTitle && firstName) {
heroTitle.textContent = `¡Felicidades, ${firstName}! Has Completado tu Verificación`;
}
const headerUser = document.getElementById('header-user-name');
if (headerUser && firstName) {
headerUser.textContent = firstName;
}

let rateBs = 0;
const rateData = sessionStorage.getItem('remeexSessionExchangeRate');
if (rateData) {
try {
const r = JSON.parse(rateData);
rateBs = typeof r === 'number' ? r : (r.USD_TO_BS || 0);
} catch(e) {
rateBs = parseFloat(rateData);
}
}
updateVerificationTexts(parseFloat(balance.usd || 0), rateBs);

const balanceEl = document.getElementById('balance-value');
if (balanceEl) {
const amount = parseFloat(balance.usd || 0);
balanceEl.textContent = amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const stepRegister = document.getElementById('step-register');
const stepRecharge = document.getElementById('step-first-recharge');
const stepIdentity = document.getElementById('step-identity');
const stepBank = document.getElementById('step-bank-validation');

function markCompleted(step) {
if (!step) return;
step.querySelector('.step-icon').classList.add('completed');
step.querySelector('.step-content').classList.add('completed');
}

function markCurrent(step) {
if (!step) return;
step.querySelector('.step-icon').classList.add('current');
step.querySelector('.step-content').classList.add('current');
}

if (userData.email) markCompleted(stepRegister);
if (firstRecharge) markCompleted(stepRecharge);
if (verification === 'verified' || verification === 'bank_validation' || verification === 'payment_validation') {
markCompleted(stepIdentity);
}

let completed = 1; // registro
if (firstRecharge) completed++;
if (verification === 'verified' || verification === 'bank_validation' || verification === 'payment_validation') completed++;

if (verification === 'verified') {
markCompleted(stepBank);
completed++;
const btn = stepBank.querySelector('.step-action');
if (btn) btn.style.display = 'none';
} else if (verification === 'bank_validation' || verification === 'payment_validation') {
markCurrent(stepBank);
} else {
markCurrent(stepBank);
}

const progressBar = document.getElementById('steps-progress-bar');
if (progressBar) {
progressBar.style.height = `${(completed / 4) * 100}%`;
}

// stats animation
const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
const observer = new IntersectionObserver(entries => {
entries.forEach(entry => {
if (entry.isIntersecting) {
animateStats();
observer.unobserve(entry.target);
}
});
}, observerOptions);

const statsContainer = document.querySelector('.stats-container');
if (statsContainer) observer.observe(statsContainer);
}

document.addEventListener('globalDataReady', initFromGlobalData);
if (window.GlobalData) {
initFromGlobalData();
}

function animateStats() {
const statNumbers = document.querySelectorAll('.stat-number');
statNumbers.forEach((stat, index) => {
const finalValue = stat.textContent;
let isPercentage = finalValue.includes('%');
let isTime = finalValue.includes('min');
let numericValue = parseInt(finalValue.replace(/[^\d]/g, ''));

let currentValue = 0;
const increment = numericValue / 50;

const timer = setInterval(() => {
currentValue += increment;
if (currentValue >= numericValue) {
currentValue = numericValue;
clearInterval(timer);
}

if (isPercentage) {
stat.textContent = Math.floor(currentValue) + '%';
} else if (isTime) {
stat.textContent = Math.floor(currentValue) + ' min';
} else {
stat.textContent = Math.floor(currentValue).toLocaleString();
}
}, 50);
});
}

// Add smooth animations for cards
const cards = document.querySelectorAll('.explanation-card, .testimonial-card');
cards.forEach((card, index) => {
card.style.animationDelay = `${index * 0.1}s`;
card.style.animation = 'fadeIn 0.6s ease forwards';
});
document.addEventListener('DOMContentLoaded', function() {
const audio = document.getElementById('buildingSound');
if (audio) {
audio.currentTime = 0;
const playPromise = audio.play();
if (playPromise !== undefined) {
playPromise.catch(err => console.error('Audio playback failed:', err));
}
}
});
