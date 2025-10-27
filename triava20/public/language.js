(function(){
  const translations = {
    es: {
      'nav-services': 'Servicios',
      'nav-cards': 'Tarjetas',
      'nav-home': 'Inicio',
      'nav-support': 'Ayuda',
      'nav-settings': 'Ajustes',
      'recharge-balance': 'Agregar Dinero',
      'secure-transaction-title': 'Transacción Segura',
      'secure-transaction-text': 'Todos los pagos están protegidos con cifrado SSL',
      'tab-credit-card': 'Tarjeta de Crédito',
      'tab-bank-transfer': 'Transferencia Bancaria',
      'tab-mobile-payment': 'Pago Móvil',
      'select-amount': 'Seleccione un Monto',
      'select-amount-button': 'Seleccione un monto'
    },
    en: {
      'nav-services': 'Services',
      'nav-cards': 'Cards',
      'nav-home': 'Home',
      'nav-support': 'Help',
      'nav-settings': 'Settings',
      'recharge-balance': 'Recharge Balance',
      'secure-transaction-title': 'Secure Transaction',
      'secure-transaction-text': 'All payments are protected with SSL encryption',
      'tab-credit-card': 'Credit Card',
      'tab-bank-transfer': 'Bank Transfer',
      'tab-mobile-payment': 'Mobile Payment',
      'select-amount': 'Select Amount',
      'select-amount-button': 'Select amount'
    }
  };

  function applyLanguage(lang){
    const texts = translations[lang] || translations.es;
    document.documentElement.lang = lang;
    for(const key in texts){
      const el = document.querySelector('[data-i18n="'+key+'"]');
      if(el) el.textContent = texts[key];
    }
    localStorage.setItem('remeexLanguage', lang);
  }

  function init(){
    const select = document.getElementById('interface-language');
    const lang = localStorage.getItem('remeexLanguage') || 'es';
    if(select){
      select.value = lang;
      select.addEventListener('change', ()=>applyLanguage(select.value));
    }
    applyLanguage(lang);
  }

  document.addEventListener('DOMContentLoaded', init);
  window.applyLanguage = applyLanguage;
})();
