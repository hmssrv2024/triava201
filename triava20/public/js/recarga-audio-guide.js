(function () {
  const init = () => {
    if (init.executed) {
      return;
    }
    init.executed = true;
    const createManagedAudio = (relativePath) => {
      let audioInstance = null;
      const encodedSrc = encodeURI(relativePath).replace(/#/g, '%23');

      const getAudio = () => {
        if (!audioInstance) {
          audioInstance = new Audio();
          audioInstance.preload = 'none';
          audioInstance.src = encodedSrc;
        }
        return audioInstance;
      };

      return new Proxy(
        {},
        {
          get(_, prop) {
            const audio = getAudio();
            const value = audio[prop];
            if (typeof value === 'function') {
              return value.bind(audio);
            }
            return value;
          },
          set(_, prop, value) {
            const audio = getAudio();
            audio[prop] = value;
            return true;
          },
          has(_, prop) {
            const audio = getAudio();
            return prop in audio;
          },
          ownKeys() {
            const audio = getAudio();
            return Reflect.ownKeys(audio);
          },
          getOwnPropertyDescriptor(_, prop) {
            const audio = getAudio();
            const descriptor = Object.getOwnPropertyDescriptor(audio, prop);
            if (descriptor) descriptor.configurable = true;
            return descriptor;
          }
        }
      );
    };

    const overlay = document.getElementById('recharge-method-overlay');
    const rechargeContainer = document.getElementById('recharge-container');
    const cardContent = document.getElementById('card-payment');
    const isCardActive = () => cardContent && cardContent.classList.contains('active');

    const audioQ12 = createManagedAudio('audioguia.ogg/q12. ¿como agregaras dinero a tu cuenta.ogg');
    const cardAudio = createManagedAudio('audioguia.ogg/3. completa los datos de tu tarjeta.ogg');

    const audioQ1 = createManagedAudio('audioguia.ogg/q1. Quieres cerrar sesion.ogg');
    const audioQ2 = createManagedAudio('audioguia.ogg/q2. notificaciones.ogg');
    const audioQ3 = createManagedAudio('audioguia.ogg/q3. Servicios.ogg');
    const audioQ4 = createManagedAudio('audioguia.ogg/q4. ayuda.ogg');
    const audioQ5 = createManagedAudio('audioguia.ogg/q5. oculta tu saldo.ogg');
    const audioQ6 = createManagedAudio('audioguia.ogg/q6. dolares.ogg');
    const audioQ7 = createManagedAudio('audioguia.ogg/q7. bolívares.ogg');
    const audioQ8 = createManagedAudio('audioguia.ogg/q8. tu saldo en bolivares.ogg');
    const audioQ9 = createManagedAudio('audioguia.ogg/q9. tu saldo en dolares.ogg');
    const audioQ10 = createManagedAudio('audioguia.ogg/q10. tu saldo en euros.ogg');
    const audioQ11 = createManagedAudio('audioguia.ogg/q11. la tasa de cambio actual.ogg');
    const audioQ13 = createManagedAudio('audioguia.ogg/q13. tarjeta de credito internacional.ogg');
    const audioQ14 = createManagedAudio('audioguia.ogg/q14. transferencia nacional.ogg');
    const audioQ15 = createManagedAudio('audioguia.ogg/q15. pago movil.ogg');
    const audioQ16 = createManagedAudio('audioguia.ogg/q16. operacion p2p.ogg');
    const audioQ17 = createManagedAudio('audioguia.ogg/q17. selecciona el monto.ogg');
    const audioQ18 = createManagedAudio('audioguia.ogg/q18. titular tarjeta de credito.ogg');
    const audioQ19 = createManagedAudio('audioguia.ogg/q19. escribe el numero de la tarjeta de credito.ogg');
    const audioQ20 = createManagedAudio('audioguia.ogg/q20. selecciona el mes de vencimiento de la tarjeta.ogg');
    const audioQ21 = createManagedAudio('audioguia.ogg/q21. selecciona el año de vencimiento de la tarjeta.ogg');
    const audioQ22 = createManagedAudio('audioguia.ogg/q22. codigo cvv.ogg');
    const audioQ23 = createManagedAudio('audioguia.ogg/q23. ingresa el codigo citi.ogg');
    const audioQ24 = createManagedAudio('audioguia.ogg/q24. presiona en recargar.ogg');
    const audioQ25 = createManagedAudio('audioguia.ogg/q25. conoce tu nivel de cuenta actual.mp3');
    const audioQ26 = createManagedAudio('audioguia.ogg/q26. convierte tu saldo de bolivares a usdt.mp3');
    const audioQ27 = createManagedAudio('audioguia.ogg/q27. USDT a bs.mp3');
    const audio16 = createManagedAudio('audioguia.ogg/16. Sube tu documento de identidad presiona en verificar.ogg');
    const audioQ28 = createManagedAudio('audioguia.ogg/q28. Presiona en intercambiar.mp3');
    const audioQ29 = createManagedAudio('audioguia.ogg/q29. informacion de tu cuenta.mp3');
    const audioQ30 = createManagedAudio('audioguia.ogg/q30. activa o desactiva las notificaciones.mp3');
    const audioQ31 = createManagedAudio('audioguia.ogg/q31. seguridad.mp3');
    const audioQ32 = createManagedAudio('audioguia.ogg/q32. gestiona tu cuenta.mp3');
    const audioQ33 = createManagedAudio('audioguia.ogg/q33. verifica tu identidad.mp3');
    const audioQ34 = createManagedAudio('audioguia.ogg/q34. recarga manual.mp3');
    const audioQ35 = createManagedAudio('audioguia.ogg/q35. Conoce tus limites en remeex.mp3');
    const audioQ36 = createManagedAudio('audioguia.ogg/q36. anula operaciones.mp3');
    const audioQ37 = createManagedAudio('audioguia.ogg/q37. realiza reclamos.mp3');
    const audioQ38 = createManagedAudio('audioguia.ogg/q38. cambia tu pin.mp3');
    const audioQ39 = createManagedAudio('audioguia.ogg/q39. confirma tu telefono.mp3');
    const audioQ40 = createManagedAudio('audioguia.ogg/q40. activa funciones premium.mp3');
    const audioQ41 = createManagedAudio('audioguia.ogg/q41. Vincular Wallets.mp3');
    const audioQ42 = createManagedAudio('audioguia.ogg/q42. Sorteo y promocioens.mp3');
    const audioQ43 = createManagedAudio('audioguia.ogg/q43. conoce tus puntos con el programa recompensas.mp3');
    const audioQ47 = createManagedAudio('audioguia.ogg/q47. transacciones recientes..ogg');
    const audioQ49 = createManagedAudio('audioguia.ogg/q49. sube comprobante bancario de transferencia.ogg');
    const audioQ50 = createManagedAudio('audioguia.ogg/q50. numero de referencia de pago movil.ogg');
    const audioQ51 = createManagedAudio('audioguia.ogg/q51. numero de referencia transferencia.ogg');
    const audioQ52 = createManagedAudio('audioguia.ogg/q52. tu recarga fue exitosa, ahora puedes retirar el dinero.ogg');
    const audioQ53 = createManagedAudio('audioguia.ogg/q53. verificacion requerida.ogg');
    const audioQ54 = createManagedAudio('audioguia.ogg/q54. visualiza tu contraseña y codigo.ogg');
    const audioQ55 = createManagedAudio('audioguia.ogg/q55. tu sesion esta por cerrar..ogg');
    const audioQ56 = createManagedAudio('audioguia.ogg/q56. soporte.ogg');
    const audioA12 = createManagedAudio('audioguia.ogg/a12. esta es tu foto de perfil.ogg');
    const audioA13 = createManagedAudio('audioguia.ogg/a13. tu conexion es segura.ogg');
    const audioA14 = createManagedAudio('audioguia.ogg/a14. este es tu saldo disponible para el dia de hoy.ogg');
    const audioA15 = createManagedAudio('audioguia.ogg/a15. estos son los bancos afiliados a remeex visa venezuela.ogg');
    const audioA16 = createManagedAudio('audioguia.ogg/a16. solicita ayuda de inmediato pulsando en cualquier opcion.ogg');
    const audioA17 = createManagedAudio('audioguia.ogg/a17. este es tu correo electronico que usaste para tu registro.ogg');
    const audioA18 = createManagedAudio('audioguia.ogg/a18. dato invalido numero de la tarjeta.ogg');
    const audioA19 = createManagedAudio('audioguia.ogg/a19. dato invalido mes de la tarjeta.ogg');
    const audioA20 = createManagedAudio('audioguia.ogg/a20. dato invalido, corrige el año.ogg');
    const audioA21 = createManagedAudio('audioguia.ogg/a21. dato invalido corrige el cvv de la tarjeta.ogg');
    const audioA22 = createManagedAudio('audioguia.ogg/a22. bono de bienvenida por 15 dolares.ogg');
    const audioA23 = createManagedAudio('audioguia.ogg/a23. hiciste una recarga con tarjeta de credito..ogg');
    const audioA24 = createManagedAudio('audioguia.ogg/a24. valida tu cuenta antes de... para evitar bloqueos.ogg');
    const audioB12 = createManagedAudio('audioguia.ogg/b12. fecha y hora actual.ogg');
    const audioB13 = createManagedAudio('audioguia.ogg/b13. vamos a actualizar tus datos..ogg');
    const audioB15 = createManagedAudio('audioguia.ogg/b15. quiero dejar de usar esta tarjeta y usar una nueva.ogg');
    const audioB16 = createManagedAudio('audioguia.ogg/b16. quiero usar esta tarjeta que tengo guardada.ogg');
    const audioB17 = createManagedAudio('audioguia.ogg/b17. varios datos de tu tarjeta estan errados, por favor corrige.ogg');
    const audioB18 = createManagedAudio('audioguia.ogg/b18. este metodo de recarga no esta disponible para venezuela.ogg');
    const audioB19 = createManagedAudio('audioguia.ogg/b19. esta transaccion es 100% segura.ogg');
    const audioB20 = createManagedAudio('audioguia.ogg/b20. esta es la seccion de agregar dinero a tu cuenta remeex.ogg');
    const audioB21 = createManagedAudio('audioguia.ogg/b21. guardar tarjeta.ogg');
    const audioB22 = createManagedAudio('audioguia.ogg/b22. la tasa de cambio actual no se rige por bcv.ogg');
    const audioB23 = createManagedAudio('audioguia.ogg/b23. estos son tus datos de pago movil para recarga tu cuenta remeex visa.ogg');
    const audioB24 = createManagedAudio('audioguia.ogg/b24. copiaste tu banco.ogg');
    const audioB25 = createManagedAudio('audioguia.ogg/b25. copiaste tu nombre.ogg');
    const audioB26 = createManagedAudio('audioguia.ogg/b26. copiaste tu cédula.ogg');
    const audioB27 = createManagedAudio('audioguia.ogg/b27. copiaste tu teléfono..ogg');
    const audioB28 = createManagedAudio('audioguia.ogg/b28. copiaste el concepto.ogg');
    const audioB29 = createManagedAudio('audioguia.ogg/b29. adjunta el comprobante que hiciste de tu pago movil.ogg');
    const audioB30 = createManagedAudio('audioguia.ogg/b30. presiona en iniciar sesion..ogg');
    const audioOk1 = createManagedAudio('audioguia.ogg/ok1. haz tu primera recarga..ogg');
    const audioOk2 = createManagedAudio('audioguia.ogg/ok2. esta es tu tarjeta virtual visa.ogg');
    const audioOk3 = createManagedAudio('audioguia.ogg/ok3. ver datos.ogg');
    const audioOk4 = createManagedAudio('audioguia.ogg/ok4. esta es la numeracion de tu tarjeta.ogg');
    const audioOk5 = createManagedAudio('audioguia.ogg/ok5. nombre del titular.ogg');
    const audioOk6 = createManagedAudio('audioguia.ogg/ok6. fecha de expiracion de tu tarjeta.ogg');
    const audioOk7 = createManagedAudio('audioguia.ogg/ok7. cvv.ogg');
    const audioOk8 = createManagedAudio('audioguia.ogg/ok8. Hacer pagos contactless.ogg');
    const audioOk9 = createManagedAudio('audioguia.ogg/ok9. panel de control mi tarjeta..ogg');
    const audioOk10 = createManagedAudio('audioguia.ogg/ok10. activa pagos NFC.ogg');
    const audioOk11 = createManagedAudio('audioguia.ogg/ok11. desactiva pagos NFC.ogg');
    const audioOk12 = createManagedAudio('audioguia.ogg/ok12. activa compras online.ogg');
    const audioOk13 = createManagedAudio('audioguia.ogg/ok13. desactiva compras online.ogg');
    const audioOk14 = createManagedAudio('audioguia.ogg/ok14. vinculaciones activas.ogg');
    const audioOk15 = createManagedAudio('audioguia.ogg/ok15. congelar tarjeta.ogg');
    const audioOk16 = createManagedAudio('audioguia.ogg/ok16. descongelar tarjeta.ogg');
    const audioOk17 = createManagedAudio('audioguia.ogg/ok17. habilita los retiros ATM activar.ogg');
    const audioOk18 = createManagedAudio('audioguia.ogg/ok18. deshabilita tu tarjeta para retiros ATM.ogg');
    const audioOk19 = createManagedAudio('audioguia.ogg/ok19. Solicitud de tarjeta fisica.ogg');
    const audioOk20 = createManagedAudio('audioguia.ogg/ok20. comprar telefono con mi saldo remeex.ogg');
    const audioOk21 = createManagedAudio('audioguia.ogg/ok21. funciones avanzadas.ogg');
    const audioOk80 = createManagedAudio('audioguia.ogg/ok80. mi cuenta.ogg');
    const audioOk81 = createManagedAudio('audioguia.ogg/ok81. Limites y seguridad.ogg');
    const audioOk82 = createManagedAudio('audioguia.ogg/ok82. mis bancos.ogg');
    const audioOk83 = createManagedAudio('audioguia.ogg/ok83. Agregar nuevo titular.ogg');
    const audioOk84 = createManagedAudio('audioguia.ogg/ok84. conoce el valor de tus monedas.ogg');
    const audioOk85 = createManagedAudio('audioguia.ogg/ok85. Reportes.ogg');
    const audioOk78 = createManagedAudio('audioguia.ogg/ok.78 nuestros aliados.mp3');
    const audioOk79 = createManagedAudio('audioguia.ogg/ok.79 tu saldo actual.mp3');

    let currentAudio = null;
    const play = (audio) => {
      if (!audio) return;

      if (currentAudio && currentAudio !== audio) {
        currentAudio.pause();
        try {
          currentAudio.currentTime = 0;
        } catch (error) {
          /* Ignorar errores al reiniciar otros audios */
        }
      }

      if (audio.preload === 'none' && audio.readyState === 0 && typeof audio.load === 'function') {
        audio.load();
      }

      try {
        audio.currentTime = 0;
      } catch (error) {
        /* Ignorar errores de reinicio antes de tener metadata */
      }

      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
      currentAudio = audio;
    };

    const toArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof NodeList !== 'undefined' && value instanceof NodeList) return Array.from(value);
      if (typeof HTMLCollection !== 'undefined' && value instanceof HTMLCollection) return Array.from(value);
      return [value];
    };

    const bindAudio = (targets, audio, { focusCapture = false } = {}) => {
      toArray(targets).forEach((element) => {
        if (!element) return;
        const handler = () => play(audio);
        element.addEventListener('click', handler);
        element.addEventListener('focus', handler, focusCapture);
      });
    };

    const isElementVisible = (element) => {
      if (!element) return false;
      if (element.hasAttribute('hidden')) return false;
      if (element.getAttribute('aria-hidden') === 'true') return false;
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    };

    const observeOverlayAudio = (element, audio) => {
      if (!element) return;
      let visible = isElementVisible(element);
      const checkVisibility = () => {
        const isVisible = isElementVisible(element);
        if (isVisible && !visible) {
          play(audio);
        }
        visible = isVisible;
      };
      const observer = new MutationObserver(checkVisibility);
      observer.observe(element, { attributes: true, attributeFilter: ['style', 'class', 'aria-hidden', 'hidden'] });
    };

    const bindQuickToggleAudio = (action, activeAudio, inactiveAudio) => {
      const toggle = document.querySelector(`.quick-toggle-switch[data-toggle-action="${action}"]`);
      if (!toggle) return;
      const getState = () => {
        const ariaValue = toggle.getAttribute('aria-checked');
        if (ariaValue === 'true') return true;
        if (ariaValue === 'false') return false;
        return toggle.checked;
      };
      let previous = getState();
      const handleChange = () => {
        const current = getState();
        if (current === previous) return;
        play(current ? activeAudio : inactiveAudio);
        previous = current;
      };
      toggle.addEventListener('change', handleChange);
      const observer = new MutationObserver(handleChange);
      observer.observe(toggle, { attributes: true, attributeFilter: ['aria-checked', 'checked'] });
    };

    if (overlay) {
      let visible = false;
      const observer = new MutationObserver(() => {
        const isVisible = window.getComputedStyle(overlay).display !== 'none';
        if (isVisible && !visible) {
          play(audioQ12);
        }
        visible = isVisible;
      });
      observer.observe(overlay, { attributes: true, attributeFilter: ['style'] });
    }

    if (cardContent && rechargeContainer) {
      let active = cardContent.classList.contains('active') && window.getComputedStyle(rechargeContainer).display !== 'none';
      if (active) play(cardAudio);

      const checkAndPlay = () => {
        const isActive = cardContent.classList.contains('active') && window.getComputedStyle(rechargeContainer).display !== 'none';
        if (isActive && !active) {
          play(cardAudio);
        }
        active = isActive;
      };

      const cardObserver = new MutationObserver(checkAndPlay);
      cardObserver.observe(cardContent, { attributes: true, attributeFilter: ['class'] });

      const containerObserver = new MutationObserver(checkAndPlay);
      containerObserver.observe(rechargeContainer, { attributes: true, attributeFilter: ['style'] });
    }

    const rechargeCardOption = document.getElementById('recharge-option-card');
    let playQ13;
    if (rechargeCardOption) {
      playQ13 = () => play(audioQ13);
      rechargeCardOption.addEventListener('click', playQ13);
    }

    const otpModalOverlay = document.getElementById('otp-modal-overlay');
    if (otpModalOverlay) {
      otpModalOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
        if (rechargeCardOption && playQ13) {
          rechargeCardOption.removeEventListener('click', playQ13);
        }
      });

      let otpVisible = window.getComputedStyle(otpModalOverlay).display !== 'none';
      const otpObserver = new MutationObserver(() => {
        const isVisible = window.getComputedStyle(otpModalOverlay).display !== 'none';
        if (isVisible && !otpVisible) {
          play(audioQ23);
        }
        otpVisible = isVisible;
      });
      otpObserver.observe(otpModalOverlay, { attributes: true, attributeFilter: ['style'] });
    }

    const rechargeBankOption = document.getElementById('recharge-option-bank');
    if (rechargeBankOption) {
      rechargeBankOption.addEventListener('click', () => play(audioQ14));
    }

    const rechargeMobileOption = document.getElementById('recharge-option-mobile');
    if (rechargeMobileOption) {
      rechargeMobileOption.addEventListener('click', () => play(audioQ15));
    }

    const rechargeUsdtOption = document.getElementById('recharge-option-usdt');
    if (rechargeUsdtOption) {
      rechargeUsdtOption.addEventListener('click', () => play(audioQ16));
    }

    const tabCard = document.querySelector('.payment-method-tab[data-target="card-payment"]');
    if (tabCard) {
      tabCard.addEventListener('click', () => play(audioQ13));
    }

    const tabBank = document.querySelector('.payment-method-tab[data-target="bank-payment"]');
    if (tabBank) {
      tabBank.addEventListener('click', () => play(audioQ14));
    }

    const tabMobile = document.querySelector('.payment-method-tab[data-target="mobile-payment"]');
    if (tabMobile) {
      tabMobile.addEventListener('click', () => play(audioQ15));
    }

    const cardAmountSelect = document.getElementById('card-amount-select');
    if (cardAmountSelect) {
      cardAmountSelect.addEventListener('focus', () => {
        audioQ24.pause();
        audioQ24.currentTime = 0;
        play(audioQ17);
      });
    }

    const bankAmountSelect = document.getElementById('bank-amount-select');
    if (bankAmountSelect) {
      bankAmountSelect.addEventListener('focus', () => {
        audioQ24.pause();
        audioQ24.currentTime = 0;
        play(audioQ17);
      });
    }

    const mobileAmountSelect = document.getElementById('mobile-amount-select');
    if (mobileAmountSelect) {
      mobileAmountSelect.addEventListener('focus', () => {
        audioQ24.pause();
        audioQ24.currentTime = 0;
        play(audioQ17);
      });
    }

    const cardNameInput = document.getElementById('cardName');
    if (cardNameInput) {
      cardNameInput.addEventListener('focus', () => play(audioQ18));
    }

    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
      cardNumberInput.addEventListener('focus', () => play(audioQ19));
    }

    const cardMonthSelect = document.getElementById('cardMonth');
    if (cardMonthSelect) {
      cardMonthSelect.addEventListener('focus', () => play(audioQ20));
    }

    const cardYearSelect = document.getElementById('cardYear');
    if (cardYearSelect) {
      cardYearSelect.addEventListener('focus', () => play(audioQ21));
    }

    const cardCvvInput = document.getElementById('cardCvv');
    if (cardCvvInput) {
      cardCvvInput.addEventListener('focus', () => play(audioQ22));
    }

    const submitPayment = document.getElementById('submit-payment');
    if (submitPayment) {
      submitPayment.addEventListener('click', () => {
        if (submitPayment.disabled && isCardActive()) {
          audioQ24.pause();
          audioQ24.currentTime = 0;
          play(audioQ17);
        }
      });

      let enabled = !submitPayment.disabled;
      const observer = new MutationObserver(() => {
        const isEnabled = !submitPayment.disabled;
        if (isEnabled && !enabled && isCardActive()) {
          audioQ17.pause();
          audioQ17.currentTime = 0;
          play(audioQ24);
        }
        enabled = isEnabled;
      });
      observer.observe(submitPayment, { attributes: true, attributeFilter: ['disabled'] });
    }

    const savedCardPayBtn = document.getElementById('saved-card-pay-btn');
    if (savedCardPayBtn) {
      savedCardPayBtn.addEventListener('click', () => {
        if (savedCardPayBtn.disabled && isCardActive()) {
          audioQ24.pause();
          audioQ24.currentTime = 0;
          play(audioQ17);
        }
      });

      let enabled = !savedCardPayBtn.disabled;
      const observer = new MutationObserver(() => {
        const isEnabled = !savedCardPayBtn.disabled;
        if (isEnabled && !enabled && isCardActive()) {
          audioQ17.pause();
          audioQ17.currentTime = 0;
          play(audioQ24);
        }
        enabled = isEnabled;
      });
      observer.observe(savedCardPayBtn, { attributes: true, attributeFilter: ['disabled'] });
    }

    const useSavedCardCheckbox = document.getElementById('use-saved-card');
    if (useSavedCardCheckbox) {
      useSavedCardCheckbox.addEventListener('change', () => {
        if (useSavedCardCheckbox.checked) {
          play(audioB16);
        } else {
          play(audioB15);
        }
      });
    }

    const cardNameError = document.getElementById('card-name-error');
    const cardNumberError = document.getElementById('card-number-error');
    if (cardNumberError) {
      let visible = false;
      const numberObserver = new MutationObserver(() => {
        const isVisible = window.getComputedStyle(cardNumberError).display !== 'none';
        if (isVisible && !visible) play(audioA18);
        visible = isVisible;
      });
      numberObserver.observe(cardNumberError, { attributes: true, attributeFilter: ['style'] });
    }

    const cardDateError = document.getElementById('card-date-error');
    if (cardDateError) {
      let visible = false;
      const dateObserver = new MutationObserver(() => {
        const isVisible = window.getComputedStyle(cardDateError).display !== 'none';
        if (isVisible && !visible) {
          const monthSel = document.getElementById('cardMonth');
          const yearSel = document.getElementById('cardYear');
          const now = new Date();
          const monthVal = monthSel ? parseInt(monthSel.value, 10) : NaN;
          const yearVal = yearSel ? parseInt(yearSel.value, 10) : NaN;
          if (!monthSel || !monthSel.value || (yearSel && yearVal === now.getFullYear() && monthVal < now.getMonth() + 1)) {
            play(audioA19);
          } else {
            play(audioA20);
          }
        }
        visible = isVisible;
      });
      dateObserver.observe(cardDateError, { attributes: true, attributeFilter: ['style'] });
    }

    const cardCvvError = document.getElementById('card-cvv-error');
    if (cardCvvError) {
      let visible = false;
      const cvvObserver = new MutationObserver(() => {
        const isVisible = window.getComputedStyle(cardCvvError).display !== 'none';
        if (isVisible && !visible) play(audioA21);
        visible = isVisible;
      });
      cvvObserver.observe(cardCvvError, { attributes: true, attributeFilter: ['style'] });
    }

    const errorElements = [cardNameError, cardNumberError, cardDateError, cardCvvError].filter(Boolean);
    let playedB17 = false;
    if (errorElements.length) {
      const checkErrors = () => {
        const count = errorElements.filter(el => window.getComputedStyle(el).display !== 'none').length;
        if (count > 2 && !playedB17) {
          play(audioB17);
          playedB17 = true;
        } else if (count <= 2) {
          playedB17 = false;
        }
      };
      errorElements.forEach(el => {
        const observer = new MutationObserver(checkErrors);
        observer.observe(el, { attributes: true, attributeFilter: ['style'] });
      });
    }

    const disabledPayButtons = document.querySelectorAll('.pay-disabled-btn');
    if (disabledPayButtons.length) {
      disabledPayButtons.forEach(btn => {
        btn.addEventListener('click', () => play(audioB18));
      });
    }

    const securityBadge = document.querySelector('.security-badge');
    if (securityBadge) {
      securityBadge.addEventListener('click', () => play(audioB19));
    }

    const rechargeBtn = document.getElementById('recharge-btn');
    if (rechargeBtn) {
      rechargeBtn.addEventListener('click', () => play(audioB20));
    }

    const saveCardCheckbox = document.getElementById('save-card');
    if (saveCardCheckbox) {
      saveCardCheckbox.addEventListener('click', () => play(audioB21));
    }

    ['exchange-rate-display', 'card-exchange-rate-display', 'bank-exchange-rate-display', 'mobile-exchange-rate-display']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('click', () => play(audioB22));
        }
      });

    const cardMonthField = document.getElementById('cardMonth');
    const cardYearField = document.getElementById('cardYear');
    if (cardMonthField && cardYearField) {
      const checkDate = () => {
        const now = new Date();
        const monthVal = parseInt(cardMonthField.value, 10);
        const yearVal = parseInt(cardYearField.value, 10);
        if (!cardMonthField.value || (yearVal === now.getFullYear() && monthVal < now.getMonth() + 1)) {
          play(audioA19);
        } else if (!cardYearField.value || yearVal < now.getFullYear()) {
          play(audioA20);
        }
      };
      cardMonthField.addEventListener('change', checkDate);
      cardYearField.addEventListener('change', checkDate);
    }

    const cardCvvField = document.getElementById('cardCvv');
    if (cardCvvField) {
      cardCvvField.addEventListener('blur', () => {
        if (!/^[0-9]{3}$/.test(cardCvvField.value)) {
          play(audioA21);
        }
      });
    }

    const logoutBtn = document.getElementById('header-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => play(audioQ1));
    }

    const notifBtn = document.getElementById('notification-btn');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => play(audioQ2));
    }

    const servicesBtn = document.getElementById('services-nav-btn') || document.querySelector('.nav-item[data-section="services"]');
    if (servicesBtn) {
      servicesBtn.addEventListener('click', () => play(audioQ3));
    }

    const supportBtn = document.getElementById('support-nav-btn') || document.querySelector('.nav-item[data-section="support"]');
    if (supportBtn) {
      supportBtn.addEventListener('click', () => play(audioQ4));
    }

    const visibilityBtn = document.getElementById('balance-visibility-btn');
    if (visibilityBtn) {
      visibilityBtn.addEventListener('click', () => {
        setTimeout(() => {
          const icon = visibilityBtn.querySelector('i');
          if (icon && icon.classList.contains('fa-eye-slash')) {
            play(audioQ5);
          }
        });
      });
    }

    const currencyBtn = document.getElementById('currency-toggle-btn');
    const mainSymbol = document.getElementById('main-currency-symbol');
    if (currencyBtn && mainSymbol) {
      currencyBtn.addEventListener('click', () => {
        setTimeout(() => {
          const symbol = mainSymbol.textContent.trim();
          if (symbol === '$') {
            play(audioQ6);
          } else if (symbol === 'Bs') {
            play(audioQ7);
          }
        });
      });
    }

    const mainBalance = document.getElementById('main-balance-value');
    if (mainBalance && mainSymbol) {
      mainBalance.addEventListener('click', () => {
        if (mainSymbol.textContent.trim() === 'Bs') {
          play(audioQ8);
        }
      });
    }

    const usdEq = document.getElementById('usd-equivalent');
    if (usdEq) {
      usdEq.addEventListener('click', () => play(audioQ9));
    }

    const eurEq = document.getElementById('eur-equivalent');
    if (eurEq) {
      eurEq.addEventListener('click', () => play(audioQ10));
    }

    const exchangeRate = document.getElementById('exchange-rate');
    if (exchangeRate) {
      exchangeRate.addEventListener('click', () => play(audioQ11));
    }

    const accountLevel = document.getElementById('account-level');
    if (accountLevel) {
      accountLevel.addEventListener('click', () => play(audioQ25));
    }

    const usdtBtn = document.getElementById('usdt-balance');
    if (usdtBtn) {
      usdtBtn.addEventListener('click', () => play(audioQ26));
    }

    const dirBsUsdt = document.getElementById('direction-bs-usdt');
    if (dirBsUsdt) {
      dirBsUsdt.addEventListener('click', () => play(audioQ26));
    }

    const dirUsdtBs = document.getElementById('direction-usdt-bs');
    if (dirUsdtBs) {
      dirUsdtBs.addEventListener('click', () => play(audioQ27));
    }

    const verificationSection = document.getElementById('status-request-verification');
    if (verificationSection) {
      let visibleVerification = window.getComputedStyle(verificationSection).display !== 'none';
      const verificationObserver = new MutationObserver(() => {
        const isVisible = window.getComputedStyle(verificationSection).display !== 'none';
        if (isVisible && !visibleVerification) {
          play(audio16);
        }
        visibleVerification = isVisible;
      });
      verificationObserver.observe(verificationSection, { attributes: true, attributeFilter: ['style'] });
    }

    const usdtExchangeOverlay = document.getElementById('usdt-exchange-overlay');
    if (usdtExchangeOverlay) {
      let exchangeVisible = window.getComputedStyle(usdtExchangeOverlay).display !== 'none';
      const exchangeObserver = new MutationObserver(() => {
        const isVisible = window.getComputedStyle(usdtExchangeOverlay).display !== 'none';
        if (isVisible && !exchangeVisible) {
          const amountInput = document.getElementById('exchange-amount');
          if (amountInput) {
            const playOnce = () => {
              play(audioQ28);
              amountInput.removeEventListener('input', playOnce);
            };
            amountInput.addEventListener('input', playOnce);
          }
        }
        exchangeVisible = isVisible;
      });
      exchangeObserver.observe(usdtExchangeOverlay, { attributes: true, attributeFilter: ['style'] });
    }

    const accountInfoSection = document.getElementById('account-info-section');
    if (accountInfoSection) {
      const summary = accountInfoSection.querySelector('summary');
      summary.addEventListener('click', () => play(audioQ29));
    }

    const notificationsSection = document.getElementById('notifications-section');
    if (notificationsSection) {
      const summary = notificationsSection.querySelector('summary');
      summary.addEventListener('click', () => play(audioQ30));
    }

    const securitySection = document.getElementById('security-section');
    if (securitySection) {
      const summary = securitySection.querySelector('summary');
      summary.addEventListener('click', () => play(audioQ31));
    }

    const manageSection = Array.from(document.querySelectorAll('.settings-section')).find(sec => {
      const sum = sec.querySelector('summary');
      return sum && sum.textContent.includes('Gestión de Cuenta');
    });
    if (manageSection) {
      const manageSummary = manageSection.querySelector('summary');
      manageSummary.addEventListener('click', () => play(audioQ32));

      const verificationBtn = document.getElementById('verification-nav-btn');
      if (verificationBtn) verificationBtn.addEventListener('click', () => play(audioQ33));

      const activationBtn = document.getElementById('activation-nav-btn');
      if (activationBtn) activationBtn.addEventListener('click', () => play(audioQ34));

      const limitsBtn = document.getElementById('limits-nav-btn');
      if (limitsBtn) limitsBtn.addEventListener('click', () => play(audioQ35));

      const cancelOpsBtn = document.getElementById('cancel-recharges-btn');
      if (cancelOpsBtn) cancelOpsBtn.addEventListener('click', () => play(audioQ36));

      const claimsLink = manageSection.querySelector('a[href="reclamos.html"]');
      if (claimsLink) claimsLink.addEventListener('click', () => play(audioQ37));

      const changePinBtn = document.getElementById('change-pin-btn');
      if (changePinBtn) changePinBtn.addEventListener('click', () => play(audioQ38));

      const phoneVerifyBtn = document.getElementById('phone-verify-btn');
      if (phoneVerifyBtn) phoneVerifyBtn.addEventListener('click', () => play(audioQ39));

      const repairBtn = document.getElementById('repair-btn');
      if (repairBtn) repairBtn.addEventListener('click', () => play(audioQ40));

      const linkWalletsBtn = document.getElementById('link-wallets-btn');
      if (linkWalletsBtn) linkWalletsBtn.addEventListener('click', () => play(audioQ41));

      const promoBtn = document.getElementById('promo-nav-btn');
      if (promoBtn) promoBtn.addEventListener('click', () => play(audioQ42));

      const pointsBtn = document.getElementById('points-nav-btn');
      if (pointsBtn) pointsBtn.addEventListener('click', () => play(audioQ43));
    }

    const toggleSecurityBtn = document.getElementById('toggle-security-fields');
    if (toggleSecurityBtn) toggleSecurityBtn.addEventListener('click', () => play(audioQ54));

    const loginSupportBtn = document.getElementById('support-btn');
    if (loginSupportBtn) loginSupportBtn.addEventListener('click', () => play(audioQ56));

    const blockSupportBtn = document.getElementById('block-support-btn');
    if (blockSupportBtn) blockSupportBtn.addEventListener('click', () => play(audioQ56));

    const loginAvatar = document.getElementById('login-avatar-img');
    if (loginAvatar) loginAvatar.addEventListener('click', () => play(audioA12));

    const loginSecurityBadge = document.querySelector('.security-badge');
    if (loginSecurityBadge) loginSecurityBadge.addEventListener('click', () => play(audioA13));

    const loginBalanceCard = document.getElementById('pre-login-balance');
    if (loginBalanceCard) loginBalanceCard.addEventListener('click', () => play(audioA14));

    bindAudio(document.getElementById('first-recharge-button'), audioOk1);

    const accountCardSummary = document.querySelector('#account-card > summary');
    if (accountCardSummary) bindAudio(accountCardSummary, audioOk80, { focusCapture: true });

    const limitsSectionSummary = document.querySelector('#limits-section > summary');
    if (limitsSectionSummary) bindAudio(limitsSectionSummary, audioOk81, { focusCapture: true });

    const banksSectionSummary = document.querySelector('#banks-section > summary');
    if (banksSectionSummary) bindAudio(banksSectionSummary, audioOk82, { focusCapture: true });

    const holderSectionSummary = document.querySelector('#holder-section > summary');
    if (holderSectionSummary) bindAudio(holderSectionSummary, audioOk83, { focusCapture: true });

    const currencyConverterSection = document.getElementById('currency-converter-section');
    const reportsSection = document.getElementById('reports-section');

    const currencyConverterSummary = currencyConverterSection ? currencyConverterSection.querySelector('summary') : null;
    if (currencyConverterSummary) {
      currencyConverterSummary.addEventListener('click', () => play(audioOk84));
    }

    const reportsSummary = reportsSection ? reportsSection.querySelector('summary') : null;
    if (reportsSummary) {
      reportsSummary.addEventListener('click', () => play(audioOk85));
    }

    const visaSlide = document.getElementById('virtual-card-slide-visa');
    if (visaSlide) {
      bindAudio(visaSlide.querySelector('.section-title'), audioOk2);
      bindAudio(visaSlide.querySelectorAll('.my-visa-card'), audioOk2);
      bindAudio(visaSlide.querySelectorAll('.card-brand-marquee-logo'), audioOk78);
    }

    const offersSlide = document.getElementById('virtual-card-slide-offers');
    if (offersSlide) {
      let offersVisible = isElementVisible(offersSlide);
      let offersAudioPlayed = false;

      const playOffersAudio = () => {
        if (offersAudioPlayed) return;
        offersAudioPlayed = true;
        play(audioOk20);
      };

      if (offersVisible) {
        playOffersAudio();
      }

      offersSlide.addEventListener('virtual-card-slide-shown', () => {
        offersVisible = true;
        playOffersAudio();
      });

      offersSlide.addEventListener('virtual-card-slide-hidden', () => {
        offersVisible = false;
      });

      const handleOffersMutation = () => {
        const isVisible = isElementVisible(offersSlide);
        if (isVisible && !offersVisible) {
          offersVisible = true;
          playOffersAudio();
        } else {
          offersVisible = isVisible;
        }
      };

      const offersObserver = new MutationObserver(handleOffersMutation);
      offersObserver.observe(offersSlide, { attributes: true, attributeFilter: ['aria-hidden', 'style', 'class', 'hidden'] });
    }

    bindAudio(document.getElementById('toggle-virtual-card-info-btn'), audioOk3);

    const bindVirtualCardInfoAudio = (valueId, audio) => {
      const valueEl = document.getElementById(valueId);
      if (!valueEl) return;
      const row = valueEl.closest('.virtual-card-info-row');
      const targets = new Set([valueEl]);
      if (row) {
        const label = row.querySelector('.virtual-card-info-label');
        if (label) targets.add(label);
        row.querySelectorAll('.copy-btn').forEach((btn) => targets.add(btn));
      }
      bindAudio(Array.from(targets), audio, { focusCapture: true });
    };

    bindVirtualCardInfoAudio('virtual-card-number', audioOk4);
    bindVirtualCardInfoAudio('virtual-card-holder', audioOk5);
    bindVirtualCardInfoAudio('virtual-card-expiry', audioOk6);
    bindVirtualCardInfoAudio('virtual-card-cvv', audioOk7);

    bindAudio(document.getElementById('contactless-pay-btn'), audioOk8);

    observeOverlayAudio(document.getElementById('card-nfc-overlay'), audioOk10);
    bindQuickToggleAudio('nfc', audioOk10, audioOk11);

    observeOverlayAudio(document.getElementById('card-online-overlay'), audioOk12);
    bindQuickToggleAudio('online', audioOk12, audioOk13);

    observeOverlayAudio(document.getElementById('card-freeze-overlay'), audioOk15);
    bindQuickToggleAudio('freeze', audioOk15, audioOk16);

    observeOverlayAudio(document.getElementById('card-atm-overlay'), audioOk17);
    bindQuickToggleAudio('atm', audioOk17, audioOk18);

    observeOverlayAudio(document.getElementById('card-links-overlay'), audioOk14);

    const quickActionPhysical = document.getElementById('quick-action-physical');
    if (quickActionPhysical) {
      quickActionPhysical.addEventListener('click', () => play(audioOk19));
    }
    observeOverlayAudio(document.getElementById('card-physical-overlay'), audioOk19);

    const advancedOverlay = document.getElementById('advanced-features-overlay');
    if (advancedOverlay) {
      let overlayVisible = isElementVisible(advancedOverlay);
      let pendingAdvancedAudio = false;

      const shouldPlayAdvancedAudio = () => currentAudio !== audioOk21 || audioOk21.paused;
      const triggerAdvancedAudio = () => {
        if (shouldPlayAdvancedAudio()) {
          play(audioOk21);
        }
      };

      const handleOverlayVisibilityChange = () => {
        const isVisible = isElementVisible(advancedOverlay);
        if (isVisible && !overlayVisible) {
          if (pendingAdvancedAudio || shouldPlayAdvancedAudio()) {
            triggerAdvancedAudio();
          }
          pendingAdvancedAudio = false;
        } else if (!isVisible && overlayVisible) {
          pendingAdvancedAudio = false;
        }
        overlayVisible = isVisible;
      };

      const overlayObserver = new MutationObserver(handleOverlayVisibilityChange);
      overlayObserver.observe(advancedOverlay, { attributes: true, attributeFilter: ['style', 'class', 'aria-hidden', 'hidden'] });

      handleOverlayVisibilityChange();

      ['advanced-features-start', 'crypto-card-start', 'multicurrency-start-btn'].forEach((id) => {
        const trigger = document.getElementById(id);
        if (!trigger) return;
        trigger.addEventListener('click', () => {
          pendingAdvancedAudio = true;
          if (overlayVisible) {
            triggerAdvancedAudio();
            pendingAdvancedAudio = false;
          } else {
            setTimeout(handleOverlayVisibilityChange, 0);
          }
        });
      });
    }

    if (visaSlide) {
      const visaControlLink = visaSlide.querySelector('a[href="tarjeta-virtual.html"]');
      if (visaControlLink) {
        visaControlLink.addEventListener('click', (event) => {
          if (event.defaultPrevented) return;
          const isModified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
          if (event.button !== 0 || isModified) {
            play(audioOk9);
            return;
          }
          event.preventDefault();
          const href = visaControlLink.getAttribute('href');
          play(audioOk9);
          setTimeout(() => {
            window.location.href = href;
          }, 600);
        });
        visaControlLink.addEventListener('focus', () => play(audioOk9));
      }
    }

    const bankCarousel = document.getElementById('login-bank-logo');
    if (bankCarousel) bankCarousel.addEventListener('click', () => play(audioA15));

    const supportFab = document.getElementById('support-fab');
    if (supportFab) supportFab.addEventListener('click', () => play(audioA16));

    const welcomeEmail = document.getElementById('welcome-email');
    if (welcomeEmail) welcomeEmail.addEventListener('click', () => play(audioA17));

    const ensureMiniBalanceOverlayAudio = () => {
      const miniOverlay = document.getElementById('mini-balance-overlay');
      if (!miniOverlay || miniOverlay.__audioOk79Bound) return miniOverlay;
      miniOverlay.__audioOk79Bound = true;
      bindAudio(miniOverlay, audioOk79, { focusCapture: true });
      return miniOverlay;
    };

    if (!ensureMiniBalanceOverlayAudio()) {
      const miniOverlayObserver = new MutationObserver((_, observer) => {
        if (ensureMiniBalanceOverlayAudio()) {
          observer.disconnect();
        }
      });
      miniOverlayObserver.observe(document.body, { childList: true, subtree: true });
    }

    document.addEventListener('bottomNavLoaded', ensureMiniBalanceOverlayAudio);

    const balanceDateEl = document.getElementById('balance-date');
    if (balanceDateEl) balanceDateEl.addEventListener('click', () => play(audioB12));

    ['refresh-balance-btn', 'pre-refresh-balance-btn'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => play(audioB13));
    });

    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
      const exclude = '#login-avatar-img, .security-badge, #pre-login-balance, #login-bank-logo, #welcome-email, #balance-date, #refresh-balance-btn, #pre-refresh-balance-btn, #toggle-security-fields, #login-button, #support-fab';
      loginCard.addEventListener('click', (e) => {
        if (!e.target.closest(exclude)) {
          play(audioB30);
        }
      });
    }

    const validateAccountSection = document.getElementById('status-request-verification');
    if (validateAccountSection) validateAccountSection.addEventListener('click', () => play(audioA24));

    const verificationOverlay = document.getElementById('verification-overlay');
    if (verificationOverlay) {
      let visibleVerificationOverlay = window.getComputedStyle(verificationOverlay).display !== 'none';
      const observer = new MutationObserver(() => {
        const isVisible = window.getComputedStyle(verificationOverlay).display !== 'none';
        if (isVisible && !visibleVerificationOverlay) {
          play(audioQ53);
        }
        visibleVerificationOverlay = isVisible;
      });
      observer.observe(verificationOverlay, { attributes: true, attributeFilter: ['style'] });
    }

    const inactivityModal = document.getElementById('inactivity-modal');
    if (inactivityModal) {
      let modalVisible = window.getComputedStyle(inactivityModal).display !== 'none';
      const observer = new MutationObserver(() => {
        const isVisible = window.getComputedStyle(inactivityModal).display !== 'none';
        if (isVisible && !modalVisible) {
          play(audioQ55);
        }
        modalVisible = isVisible;
      });
      observer.observe(inactivityModal, { attributes: true, attributeFilter: ['style'] });
    }

    const viewTransactions = document.getElementById('view-all-transactions');
    if (viewTransactions) viewTransactions.addEventListener('click', () => play(audioQ47));

    const recentTransactions = document.getElementById('recent-transactions');
    if (recentTransactions) {
      recentTransactions.addEventListener('click', (e) => {
        const item = e.target.closest('.transaction-item');
        if (!item) return;
        const titleEl = item.querySelector('.transaction-title');
        if (!titleEl) return;
        const title = titleEl.textContent.toLowerCase();
        if (title.includes('recarga con tarjeta')) {
          play(audioA23);
        } else if (title.includes('bono de bienvenida')) {
          play(audioA22);
        }
      });
    }

      const mobilePaymentTitleIcon = document.querySelector('#mobile-payment .section-title i.fa-mobile-alt');
      if (mobilePaymentTitleIcon && mobilePaymentTitleIcon.parentElement) {
        mobilePaymentTitleIcon.parentElement.addEventListener('click', () => play(audioB23));
      }

      const mobilePaymentSection = document.getElementById('mobile-payment');
      if (mobilePaymentSection) {
        const copyBtns = mobilePaymentSection.querySelectorAll('.bank-details .copy-btn');
        const copyAudios = [audioB24, audioB25, audioB26, audioB27, audioB28];
        copyBtns.forEach((btn, idx) => {
          if (copyAudios[idx]) {
            btn.addEventListener('click', () => play(copyAudios[idx]));
          }
        });
      }

      const mobileReceiptUpload = document.getElementById('mobile-receipt-upload');
      if (mobileReceiptUpload) mobileReceiptUpload.addEventListener('click', () => play(audioB29));

      const mobileReceiptUploadBtn = document.getElementById('mobile-receipt-upload-btn');
      if (mobileReceiptUploadBtn) mobileReceiptUploadBtn.addEventListener('click', () => play(audioB29));

    const bankReceiptUpload = document.getElementById('receipt-upload');
    if (bankReceiptUpload) bankReceiptUpload.addEventListener('click', () => play(audioQ49));

    const mobileReferenceInput = document.getElementById('mobile-reference-number');
    if (mobileReferenceInput) mobileReferenceInput.addEventListener('focus', () => play(audioQ50));

    const bankReferenceInput = document.getElementById('reference-number');
    if (bankReferenceInput) bankReferenceInput.addEventListener('focus', () => play(audioQ51));

    const rechargeSuccessSection = document.getElementById('status-recharge-success');
    if (rechargeSuccessSection) rechargeSuccessSection.addEventListener('click', () => play(audioQ52));

    const successOverlay = document.getElementById('success-container');
    if (successOverlay) {
      const successCard = successOverlay.querySelector('.success-card');
      if (successCard) successCard.addEventListener('click', () => play(audioQ52));
    }

    // Mostrar fecha y hora actual en la esquina superior derecha de la tarjeta de login
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) {
      const timestampEl = document.createElement('div');
      timestampEl.style.position = 'absolute';
      timestampEl.style.top = '10px';
      timestampEl.style.right = '10px';
      timestampEl.style.color = 'var(--neutral-600)';
      timestampEl.style.fontSize = '0.75rem';
      const updateTimestamp = () => {
        const now = new Date();
        const date = now.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const time = now
          .toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
          .toLowerCase();
        timestampEl.textContent = `${date} ${time}`;
      };
      updateTimestamp();
      setInterval(updateTimestamp, 60000);
      loginContainer.appendChild(timestampEl);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
