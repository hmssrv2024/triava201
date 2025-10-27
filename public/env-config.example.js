// Copia este archivo como env-config.js y actualiza PAYPAL_CLIENT_ID
// con el identificador obtenido en PayPal Business (sandbox o live según corresponda).
// Si necesitas variaciones locales, crea env-config.local.js con los ajustes temporales.
// Este archivo de ejemplo se mantiene versionado; los archivos reales están en .gitignore.
window.__ENV__ = window.__ENV__ || {};
window.__ENV__.PAYPAL_CLIENT_ID = 'TU_CLIENT_ID_DE_PAYPAL';
window.__ENV__.GEMINI_API_KEY = 'TU_GEMINI_API_KEY';
