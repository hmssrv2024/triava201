(function () {
  'use strict';

  const SW_PATH = 'sw.js';
  const NOTIFICATION_ICON = 'visablu192.png';
  const NOTIFICATION_BADGE = 'icons8-visa-96.png';
  const NOTIFICATION_TAG = 'homevisa-card-recharge';
  const currencyFormatter = new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  let serviceWorkerPromise = null;

  const normalizeAmount = (amount) => {
    if (typeof amount === 'number' && Number.isFinite(amount)) {
      return amount;
    }
    const parsed = parseFloat(
      typeof amount === 'string' ? amount.replace(/[^0-9.,-]/g, '').replace(',', '.') : amount
    );
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const ensureServiceWorker = () => {
    if (!('serviceWorker' in navigator)) {
      return Promise.resolve(null);
    }

    if (!serviceWorkerPromise) {
      serviceWorkerPromise = (async () => {
        try {
          let registration = await navigator.serviceWorker.getRegistration();
          if (!registration) {
            registration = await navigator.serviceWorker.register(SW_PATH);
          }

          try {
            const readyRegistration = await navigator.serviceWorker.ready;
            return readyRegistration || registration;
          } catch (readyError) {
            console.warn('[HomeVisa][Push] No se pudo obtener el estado "ready" del Service Worker.', readyError);
            return registration;
          }
        } catch (error) {
          console.error('[HomeVisa][Push] No se pudo registrar el Service Worker.', error);
          return null;
        }
      })();
    }

    return serviceWorkerPromise;
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return Notification.permission;
    }

    try {
      return await Notification.requestPermission();
    } catch (error) {
      console.warn('[HomeVisa][Push] No se pudo solicitar el permiso de notificaciones.', error);
      return Notification.permission;
    }
  };

  const showBrowserNotification = async (amountUsd) => {
    if (!('Notification' in window)) {
      return;
    }

    const permission = await requestPermission();
    if (permission !== 'granted') {
      return;
    }

    const formattedAmount = currencyFormatter.format(normalizeAmount(amountUsd));
    const title = '🎉 Recarga con tarjeta completada';
    const options = {
      body: `Tu recarga por ${formattedAmount} fue acreditada exitosamente. Tu saldo ya está disponible.`,
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_BADGE,
      tag: NOTIFICATION_TAG,
      renotify: true,
      vibrate: [120, 45, 120],
      data: {
        url: '/homevisa.html#resumen-saldo',
        amountUsd: formattedAmount,
        timestamp: Date.now()
      }
    };

    try {
      const registration = await ensureServiceWorker();
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, options);
        return;
      }
    } catch (error) {
      console.warn('[HomeVisa][Push] No se pudo mostrar la notificación mediante el Service Worker.', error);
    }

    try {
      new Notification(title, options);
    } catch (fallbackError) {
      console.error('[HomeVisa][Push] No se pudo mostrar la notificación.', fallbackError);
    }
  };

  const ensurePermissionOnInteraction = () => {
    if (!('Notification' in window) || Notification.permission !== 'default') {
      return;
    }

    const gestureEvents = ['click', 'touchstart', 'pointerdown', 'keydown'];
    const handleFirstInteraction = async () => {
      gestureEvents.forEach((eventName) => {
        document.removeEventListener(eventName, handleFirstInteraction, true);
      });
      await requestPermission();
    };

    gestureEvents.forEach((eventName) => {
      document.addEventListener(eventName, handleFirstInteraction, {
        once: true,
        passive: true,
        capture: true
      });
    });
  };

  const notifyRechargeSuccess = (amount) => {
    showBrowserNotification(amount);
  };

  const handleRechargeEvent = (event) => {
    if (!event) {
      return;
    }

    const detail = event.detail || {};
    const amount = detail.amountUsd ?? detail.amount ?? 0;
    notifyRechargeSuccess(amount);
  };

  ensurePermissionOnInteraction();

  window.addEventListener('homevisa:card-recharge:success', handleRechargeEvent);

  const previousNotifier = window.notificarRecargaExitosa;
  window.notificarRecargaExitosa = function (amount) {
    notifyRechargeSuccess(amount);
    if (typeof previousNotifier === 'function' && previousNotifier !== window.notificarRecargaExitosa) {
      try {
        previousNotifier.call(window, amount);
      } catch (error) {
        console.error('[HomeVisa][Push] Error al ejecutar el notificador anterior.', error);
      }
    }
  };

  window.HomeVisaCardRechargePush = {
    requestPermission,
    ensureServiceWorker,
    notifyRechargeSuccess
  };
})();
