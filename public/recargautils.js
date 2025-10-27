'use strict';
// FROM recargamain.js L176-L195
export function getVenezuelaTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + (-4 * 3600000));
}

export function generateHourlyCode() {
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

// FROM recargamain.js L374-L401
export function addEventOnce(el, evt, handler) {
  if (!el) return;
  const key = '__' + evt + '_handler';
  if (el[key]) el.removeEventListener(evt, el[key]);
  el[key] = handler;
  el.addEventListener(evt, handler);
}

export function addUnifiedClick(el, handler) {
  let startX = 0;
  let startY = 0;
  addEventOnce(el, 'click', handler);
  addEventOnce(el, 'touchstart', function(e){
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
  });
  addEventOnce(el, 'touchend', function(e){
    const t = e.changedTouches[0];
    const dx = Math.abs(t.clientX - startX);
    const dy = Math.abs(t.clientY - startY);
    if (dx < 10 && dy < 10) {
      e.preventDefault();
      handler();
    }
  });
}

// FROM recargamain.js L2162-L2207
export function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatCurrency(amount, currency) {
  if (currency === 'usd') {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (currency === 'bs') {
    return 'Bs ' + amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (currency === 'eur') {
    return '€' + amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

export function getCurrentDate() {
  const date = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('es-ES', options);
}

export function getCurrentDateTime() {
  const date = new Date();
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const dateStr = date.toLocaleDateString('es-ES', dateOptions);
  const timeStr = date.toLocaleTimeString('es-ES', timeOptions).toLowerCase();
  return `${dateStr} ${timeStr}`;
}

export function getShortDate() {
  const date = new Date();
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('es-ES', options);
}

export function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// Helper to obtain the logo URL for a given bank id. Relies on BANK_DATA
// defined globally in bank-data.js. Returns an empty string if no match is
// found or BANK_DATA is unavailable.
export function getBankLogo(bankId) {
  if (!bankId || !window.BANK_DATA) return '';
  const allBanks = [
    ...(window.BANK_DATA.NACIONAL || []),
    ...(window.BANK_DATA.INTERNACIONAL || []),
    ...(window.BANK_DATA.FINTECH || [])
  ];
  const bank = allBanks.find(b => b.id === bankId);
  return bank ? bank.logo : '';
}
