  function createParticle(){
    const boxes=document.querySelectorAll('.particles-container');
    boxes.forEach(box=>{
      const n=Math.floor(Math.random()*3)+3;   // 3-5 partículas
      for(let i=0;i<n;i++){
        const p=document.createElement('div');
        p.classList.add('particle');
        const r=Math.random();
        if(r<.2)       p.classList.add('diamond');
        else if(r<.5)  p.classList.add('mini');
        else if(r<.7)  p.classList.add('trail');

        const startY=Math.random()*60+60;
        const startX=r<.5 ? Math.random()*100+30 : Math.random()*180+10;
        const size=Math.random()*6+2;
        Object.assign(p.style,{
          top :`${startY}px`,
          left:`${startX}px`,
          width:`${size}px`,
          height:`${size}px`
        });
        box.appendChild(p);

        const endY=Math.random()*140+10;
        const duration=(Math.random()*3+1)*1000;
        const curved=Math.random()<.7;
        const keyframes=curved?[
          {left:`${startX}px`, top:`${startY}px`, opacity:0,   transform:'scale(.3)'},
          {left:`${startX+(350-startX)*.5}px`, top:`${startY-Math.random()*50}px`, opacity:.9, transform:'scale(1)', offset:.5},
          {left:'calc(100% - 10px)', top:`${endY}px`, opacity:0,   transform:'scale(.5)'}
        ]:[
          {left:`${startX}px`, top:`${startY}px`, opacity:0,   transform:'scale(.3)'},
          {opacity:.9, transform:'scale(1)', offset:.2},
          {opacity:.7, offset:.7},
          {left:'calc(100% - 10px)', top:`${endY}px`, opacity:0,   transform:'scale(.5)'}
        ];
        if (typeof p.animate === 'function') {
          p.animate(keyframes, {
            duration,
            easing: 'cubic-bezier(.25,.1,.25,1)',
            fill: 'forwards'
          }).onfinish = () => p.remove();
        } else {
          box.removeChild(p);
        }
      }
    });
  }

  /* Lanza la lluvia de puntos en cuanto cargue el DOM */
  document.addEventListener('DOMContentLoaded', function(){
    if (typeof Element !== 'undefined' && Element.prototype.animate) {
      setInterval(createParticle, 300);
    }
  });
    (function setupSmsValidationOverlay() {
      const btn = document.getElementById('phone-verify-btn');
      const overlay = document.getElementById('sms-validation-overlay');
      const successOverlay = document.getElementById('sms-success-overlay');
      const input = document.getElementById('sms-code-input');
      const validateBtn = document.getElementById('sms-validate-btn');
      const closeBtn = document.getElementById('sms-close-btn');
      const successClose = document.getElementById('sms-success-close');
      const error = document.getElementById('sms-code-error');
      const key = CONFIG.STORAGE_KEYS.PHONE_VALIDATED;
      const VALID_CODE = '748596';

      function updateButton() {
        if (!btn) return;
        const validated = localStorage.getItem(key) === 'true';
        if (validated) {
          btn.classList.add('disabled');
          btn.disabled = true;
          const title = btn.querySelector('.settings-nav-title');
          if (title) title.textContent = 'Número validado';
        }
      }

      function openOverlay() {
        if (overlay) {
          overlay.style.display = 'flex';
          if (input) input.value = '';
          if (error) error.style.display = 'none';
          if (input) input.focus();
        }
      }

      function closeOverlay() { if (overlay) overlay.style.display = 'none'; }
      function showSuccess() { if (successOverlay) successOverlay.style.display = 'flex'; }
      function hideSuccess() { if (successOverlay) successOverlay.style.display = 'none'; }

      if (btn) btn.addEventListener('click', function(){ openOverlay(); resetInactivityTimer(); });
      if (closeBtn) closeBtn.addEventListener('click', closeOverlay);
      if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });
      if (successClose) successClose.addEventListener('click', hideSuccess);
      if (successOverlay) successOverlay.addEventListener('click', e => { if (e.target === successOverlay) hideSuccess(); });

      if (validateBtn) validateBtn.addEventListener('click', function(){
        if (!input) return;
        const code = input.value.trim();
        if (code === VALID_CODE) {
          localStorage.setItem(key, 'true');
          updateButton();
          closeOverlay();
          showSuccess();
        } else {
          if (error) error.style.display = 'block';
        }
      });

      if (input) input.addEventListener('input', function(){
        this.value = this.value.replace(/\D/g, '').slice(0,6);
        if (error) error.style.display = 'none';
      });

      updateButton();
    })();
    (function setupChangePhoneOverlay() {
      const btn = document.getElementById('change-phone-btn');
      const overlay = document.getElementById('change-phone-overlay');
      const closeBtn = document.getElementById('change-phone-close');

      if (btn) btn.addEventListener('click', function() {
        if (overlay) overlay.style.display = 'flex';
        resetInactivityTimer();
      });

      if (closeBtn) closeBtn.addEventListener('click', function() {
        if (overlay) overlay.style.display = 'none';
      });

      if (overlay) {
        overlay.addEventListener('click', function(e) {
          if (e.target === overlay) overlay.style.display = 'none';
        });
      }
    })();
    const SECURITY_QUESTIONS = {
      mother_name: "¿Cuál es el nombre de soltera de tu madre?",
      pet_name: "¿Cuál fue el nombre de tu primera mascota?",
      school_name: "¿Cuál fue el nombre de tu escuela primaria?",
      best_friend: "¿Cuál es el nombre de tu mejor amigo de la infancia?",
      birth_city: "¿En qué ciudad naciste?"
    };

    (function setupChangePinOverlay() {
      const btn = document.getElementById('change-pin-btn');
      const overlay = document.getElementById('change-pin-overlay');
      const cancelBtn = document.getElementById('change-pin-cancel-btn');
      const confirmBtn = document.getElementById('change-pin-confirm-btn');
      const answerInput = document.getElementById('change-pin-answer');
      const pinInputs = document.querySelectorAll('#change-pin-new .pin-digit');
      const questionEl = document.getElementById('change-pin-question');
      const errorEl = document.getElementById('change-pin-error');
      const pinContainer = document.getElementById('change-pin-new');

      function resetFields() {
        if (answerInput) answerInput.value = '';
        pinInputs.forEach(i => i.value = '');
        if (errorEl) errorEl.style.display = 'none';
        if (answerInput) answerInput.style.display = 'block';
        if (pinContainer) pinContainer.style.display = 'none';
        if (confirmBtn) {
          confirmBtn.dataset.step = 'answer';
          confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar';
        }
      }

      function openOverlay() {
        const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
        if (questionEl) {
          questionEl.textContent = SECURITY_QUESTIONS[reg.securityQuestion] || reg.securityQuestion || '';
        }
        resetFields();
        if (overlay) overlay.style.display = 'flex';
        if (answerInput) answerInput.focus();
      }

      function verify() {
        const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
        if (confirmBtn.dataset.step === 'answer') {
          const ans = (answerInput.value || '').trim().toLowerCase();
          const expected = (reg.securityAnswer || '').trim().toLowerCase();
          if (ans === expected && ans) {
            if (answerInput) answerInput.style.display = 'none';
            if (pinContainer) pinContainer.style.display = 'flex';
            if (questionEl) questionEl.textContent = 'Ingresa tu nuevo PIN de 4 dígitos';
            confirmBtn.dataset.step = 'pin';
            confirmBtn.innerHTML = '<i class="fas fa-check"></i> Guardar';
            if (pinInputs.length) pinInputs[0].focus();
          } else {
            if (errorEl) {
              errorEl.textContent = 'Respuesta incorrecta';
              errorEl.style.display = 'block';
            }
          }
        } else {
          let pin = '';
          pinInputs.forEach(i => pin += i.value);
          if (pin.length !== 4) {
            if (errorEl) {
              errorEl.textContent = 'Ingresa los 4 dígitos';
              errorEl.style.display = 'block';
            }
            pinInputs.forEach(i => i.value = '');
            if (pinInputs.length) pinInputs[0].focus();
            return;
          }
          if (reg.pin && reg.pin === pin) {
            if (errorEl) {
              errorEl.textContent = 'El nuevo PIN no puede ser igual al anterior';
              errorEl.style.display = 'block';
            }
            pinInputs.forEach(i => i.value = '');
            if (pinInputs.length) pinInputs[0].focus();
            return;
          }
          reg.pin = pin;
          localStorage.setItem('visaRegistrationCompleted', JSON.stringify(reg));
          if (overlay) overlay.style.display = 'none';
          showToast('success', 'PIN actualizado', 'Tu PIN se cambió correctamente', 4000);
        }
      }

      if (btn) btn.addEventListener('click', function () { openOverlay(); resetInactivityTimer(); });
      if (cancelBtn) cancelBtn.addEventListener('click', function () { if (overlay) overlay.style.display = 'none'; });
      if (confirmBtn) confirmBtn.addEventListener('click', verify);
      pinInputs.forEach(input => {
        input.addEventListener('input', function () {
          this.value = this.value.replace(/\D/g, '');
          if (this.value.length > 1) this.value = this.value.slice(0, 1);
          const next = this.dataset.next ? document.getElementById(this.dataset.next) : null;
          if (this.value && next) next.focus();
        });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Backspace' && !this.value && this.dataset.prev) {
            const prev = document.getElementById(this.dataset.prev);
            if (prev) prev.focus();
          }
        });
      });
    })();
    document.addEventListener("DOMContentLoaded", function(){
      var overlay=document.getElementById("loading-overlay");
      if(!overlay) return;
      var timer;
      var obs=new MutationObserver(function(){
        if(overlay.style.display!=="none"){
          clearTimeout(timer);
          timer=setTimeout(function(){ overlay.style.display="none"; window.isCardPaymentProcessing=false; },20000);
        }
      });
      obs.observe(overlay,{attributes:true,attributeFilter:["style"]});
    });
    document.addEventListener('DOMContentLoaded', function() {
      function deriveCardSuffix(documentNumber) {
        const digits = (documentNumber || '').toString().replace(/\D/g, '');
        if (!digits) {
          return '0000';
        }
        const firstTwo = (digits + digits).slice(0, 2);
        const lastTwo = digits.length >= 2 ? digits.slice(-2) : digits.slice(-1).repeat(2);
        return `${firstTwo}${lastTwo}`;
      }

      const INITIAL_CARD_DATA = {
        number: '4985031007781863',
        spacedNumber: '4985 0310 0778 1863',
        expiry: '05/28',
        cvv: '897'
      };

      function buildCardNumbers(documentNumber, isReplacement) {
        if (!isReplacement) {
          return {
            fullNumber: INITIAL_CARD_DATA.number,
            spacedNumber: INITIAL_CARD_DATA.spacedNumber,
            expiry: INITIAL_CARD_DATA.expiry,
            cvv: INITIAL_CARD_DATA.cvv
          };
        }

        const suffix = deriveCardSuffix(documentNumber);
        const baseNumber = '416598007015';
        const fullNumber = `${baseNumber}${suffix}`;
        const spacedNumber = `${fullNumber.slice(0, 4)} ${fullNumber.slice(4, 8)} ${fullNumber.slice(8, 12)} ${fullNumber.slice(12)}`;
        return {
          fullNumber,
          spacedNumber,
          expiry: INITIAL_CARD_DATA.expiry,
          cvv: INITIAL_CARD_DATA.cvv
        };
      }

      let storedRegistration = null;
      try {
        const saved = localStorage.getItem('visaRegistrationCompleted');
        if (saved) {
          storedRegistration = JSON.parse(saved);
        }
      } catch (error) {
        storedRegistration = null;
      }

      const isReplacement = !!(storedRegistration && storedRegistration.cardReplacementCount > 0 && storedRegistration.cardNumber !== INITIAL_CARD_DATA.number);

      const documentNumber = (storedRegistration && storedRegistration.documentNumber) ||
        (typeof currentUser !== 'undefined' && currentUser ? currentUser.idNumber : '');
      const cardNumbers = buildCardNumbers(documentNumber, isReplacement);

      const resolvedCardNumber = cardNumbers.fullNumber || INITIAL_CARD_DATA.number;
      const resolvedCardNumberSpaced = cardNumbers.spacedNumber || INITIAL_CARD_DATA.spacedNumber;
      const resolvedCardExpiry = cardNumbers.expiry || INITIAL_CARD_DATA.expiry;
      const resolvedCardCvv = cardNumbers.cvv || INITIAL_CARD_DATA.cvv;

      if (storedRegistration) {
        storedRegistration.cardNumber = resolvedCardNumber;
        storedRegistration.cardNumberSpaced = resolvedCardNumberSpaced;
        storedRegistration.cardExpiry = isReplacement ? (storedRegistration.cardExpiry || resolvedCardExpiry) : resolvedCardExpiry;
        storedRegistration.cardCvv = isReplacement ? (storedRegistration.cardCvv || resolvedCardCvv) : resolvedCardCvv;
        try {
          localStorage.setItem('visaRegistrationCompleted', JSON.stringify(storedRegistration));
        } catch (error) {}
      }

      if (typeof currentUser !== 'undefined' && currentUser) {
        currentUser.cardNumber = resolvedCardNumber;
        currentUser.cardNumberSpaced = resolvedCardNumberSpaced;
        currentUser.cardExpiry = isReplacement ? (currentUser.cardExpiry || resolvedCardExpiry) : resolvedCardExpiry;
        currentUser.cardCvv = isReplacement ? (currentUser.cardCvv || resolvedCardCvv) : resolvedCardCvv;
      }

      document.querySelectorAll('.my-visa-card .card-number').forEach(function(el) {
        if (el && el.id === 'virtual-card-front-number') {
          return;
        }
        el.textContent = resolvedCardNumberSpaced;
      });

      const virtualCardFrontNumberEl = document.getElementById('virtual-card-front-number');
      if (virtualCardFrontNumberEl) {
        virtualCardFrontNumberEl.setAttribute('data-value', resolvedCardNumberSpaced);
        virtualCardFrontNumberEl.dataset.value = resolvedCardNumberSpaced;
        const frontMask = virtualCardFrontNumberEl.getAttribute('data-mask') || '•••• •••• •••• ••••';
        virtualCardFrontNumberEl.setAttribute('data-mask', frontMask);
      }

      const virtualCardNumberEl = document.getElementById('virtual-card-number');
      if (virtualCardNumberEl) {
        virtualCardNumberEl.textContent = resolvedCardNumberSpaced;
        virtualCardNumberEl.setAttribute('data-value', resolvedCardNumberSpaced);
        virtualCardNumberEl.dataset.value = resolvedCardNumberSpaced;
        const copyBtn = virtualCardNumberEl.parentElement ? virtualCardNumberEl.parentElement.querySelector('.copy-btn') : null;
        if (copyBtn) {
          copyBtn.setAttribute('data-copy', resolvedCardNumberSpaced);
        }
      }

      const contactlessCardEl = document.querySelector('#contactless-overlay .my-visa-card');
      if (contactlessCardEl) {
        const contactlessNumberEl = contactlessCardEl.querySelector('.card-number');
        if (contactlessNumberEl) {
          contactlessNumberEl.textContent = resolvedCardNumberSpaced;
        }
      }

      const dashboardCard = document.querySelector('[data-card="visa"] .my-visa-card');

      const storedName = (
        (storedRegistration && (storedRegistration.cardName || storedRegistration.fullName)) ||
        localStorage.getItem('userFullName') ||
        (dashboardCard && dashboardCard.querySelector('.cardholder-name')
          ? dashboardCard.querySelector('.cardholder-name').textContent.trim()
          : '') ||
        (typeof currentUser !== 'undefined' && currentUser && (currentUser.fullName || currentUser.name)) ||
        ''
      ).trim() || 'Usuario';

      document.querySelectorAll('.my-visa-card .cardholder-name, .my-visa-card .cardholder-signature').forEach(function(el) {
        if (!el) {
          return;
        }
        if (el.id === 'virtual-card-front-holder') {
          return;
        }
        el.textContent = storedName;
      });

      const virtualCardFrontHolderEl = document.getElementById('virtual-card-front-holder');
      if (virtualCardFrontHolderEl) {
        virtualCardFrontHolderEl.setAttribute('data-value', storedName);
        virtualCardFrontHolderEl.dataset.value = storedName;
      }

      const cardExpiryValue = (
        (storedRegistration && storedRegistration.cardExpiry) ||
        (dashboardCard && dashboardCard.querySelector('.card-expiry')
          ? dashboardCard.querySelector('.card-expiry').textContent.trim()
          : '') ||
        ''
      ).trim() || resolvedCardExpiry;

      document.querySelectorAll('.my-visa-card .card-expiry').forEach(function(el) {
        el.textContent = cardExpiryValue;
      });

      const virtualCardExpiryEl = document.getElementById('virtual-card-expiry');
      if (virtualCardExpiryEl) {
        virtualCardExpiryEl.setAttribute('data-value', cardExpiryValue);
        virtualCardExpiryEl.dataset.value = cardExpiryValue;
        const expiryCopyBtn = virtualCardExpiryEl.parentElement ? virtualCardExpiryEl.parentElement.querySelector('.copy-btn') : null;
        if (expiryCopyBtn) {
          expiryCopyBtn.setAttribute('data-copy', cardExpiryValue);
        }
      }

      const cardCvvValue = (
        (storedRegistration && storedRegistration.cardCvv) ||
        (dashboardCard && dashboardCard.querySelector('.cvv-box')
          ? dashboardCard.querySelector('.cvv-box').textContent.trim()
          : '') ||
        ''
      ).trim() || resolvedCardCvv;

      document.querySelectorAll('.my-visa-card .cvv-box').forEach(function(el) {
        el.textContent = cardCvvValue;
      });

      const virtualCardCvvEl = document.getElementById('virtual-card-cvv');
      if (virtualCardCvvEl) {
        virtualCardCvvEl.setAttribute('data-value', cardCvvValue);
        virtualCardCvvEl.dataset.value = cardCvvValue;
        const cvvCopyBtn = virtualCardCvvEl.parentElement ? virtualCardCvvEl.parentElement.querySelector('.copy-btn') : null;
        if (cvvCopyBtn) {
          cvvCopyBtn.setAttribute('data-copy', cardCvvValue);
        }
      }

      const overlayStatusEl = document.getElementById('cards-overlay-status');
      const overlayDescriptionEl = document.getElementById('cards-overlay-description');

      if (overlayStatusEl) {
        if (storedRegistration) {
          overlayStatusEl.textContent = 'Tarjeta lista para usar';
          overlayStatusEl.classList.add('is-ready');
        } else {
          overlayStatusEl.textContent = 'Verificación requerida';
          overlayStatusEl.classList.remove('is-ready');
        }
      }

      if (overlayDescriptionEl) {
        overlayDescriptionEl.textContent = storedRegistration
          ? 'Tu tarjeta virtual Visa está lista para compras en Amazon, PayPal, Binance, Zinli y otras plataformas compatibles.'
          : 'Para obtener su tarjeta virtual VISA y poder realizar compras en línea de forma segura, necesita verificar su identidad. Una vez verificado, podrá generar tarjetas virtuales para usar en Amazon, PayPal, Binance, Zinli y otras plataformas.';
      }

      if (dashboardCard) {
        function toggleFlip() {
          dashboardCard.classList.toggle('is-flipped');
        }

        dashboardCard.addEventListener('click', function() {
          toggleFlip();
        });

        dashboardCard.addEventListener('keydown', function(event) {
          const key = event.key;
          if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
            event.preventDefault();
            toggleFlip();
          }
        });
      }
    });
    document.addEventListener('DOMContentLoaded', function () {
      const usdtBalance = document.getElementById('usdt-balance');
      const overlay = document.getElementById('usdt-exchange-overlay');
      if (!usdtBalance || !overlay) return;
      const dirBsBtn = document.getElementById('direction-bs-usdt');
      const dirUsdtBtn = document.getElementById('direction-usdt-bs');
      const amountInput = document.getElementById('exchange-amount');
      const maxBtn = document.getElementById('exchange-max');
      const resultEl = document.getElementById('exchange-result');
      const cancelBtn = document.getElementById('exchange-cancel');
      const confirmBtn = document.getElementById('exchange-confirm');
      const availableEl = document.getElementById('exchange-available');
      const summaryEl = document.getElementById('exchange-summary');
      const errorEl = document.getElementById('exchange-error');
      const rateInfo = document.getElementById('exchange-rate-info');
      let direction = 'bs-usdt';

      function updateAvailable() {
        const bs = currentUser.balance.bs || 0;
        const usdt = currentUser.balance.usdt || 0;
        if (direction === 'bs-usdt') {
          availableEl.textContent = `Disponible: ${formatCurrency(bs, 'bs')}`;
          amountInput.max = bs.toFixed(2);
        } else {
          availableEl.textContent = `Disponible: ${usdt.toFixed(2)} USDT`;
          amountInput.max = usdt.toFixed(2);
        }
      }

      function updateResult() {
        updateAvailable();
        const val = parseFloat(amountInput.value) || 0;
        const rate = CONFIG.EXCHANGE_RATES.USD_TO_BS;
        let finalBs = currentUser.balance.bs || 0;
        let finalUsdt = currentUser.balance.usdt || 0;
        let available = direction === 'bs-usdt' ? finalBs : finalUsdt;
        if (direction === 'bs-usdt') {
          const usdt = val / rate;
          resultEl.textContent = `≈ ${usdt.toFixed(2)} USDT`;
          finalBs = finalBs - val;
          finalUsdt = finalUsdt + usdt;
        } else {
          const bs = val * rate;
          resultEl.textContent = `≈ ${bs.toFixed(2)} Bs`;
          finalBs = finalBs + bs;
          finalUsdt = finalUsdt - val;
        }
        summaryEl.textContent = val ? `Saldo final: ${formatCurrency(finalBs, 'bs')} | ${finalUsdt.toFixed(2)} USDT` : '';
        if (val > available) {
          errorEl.textContent = 'Monto excede el saldo disponible';
          errorEl.style.display = 'block';
          confirmBtn.disabled = true;
        } else if (val <= 0) {
          errorEl.style.display = 'none';
          confirmBtn.disabled = true;
        } else {
          errorEl.style.display = 'none';
          confirmBtn.disabled = false;
        }
      }

      function open() {
        overlay.style.display = 'flex';
        direction = 'bs-usdt';
        dirBsBtn.classList.add('btn-primary');
        dirBsBtn.classList.remove('btn-outline');
        dirUsdtBtn.classList.add('btn-outline');
        dirUsdtBtn.classList.remove('btn-primary');
        amountInput.value = '';
        summaryEl.textContent = '';
        errorEl.style.display = 'none';
        confirmBtn.disabled = true;
        if (rateInfo) {
          const label = currentRateName ? `Tasa (${currentRateName}):` : 'Tasa:';
          rateInfo.textContent = `${label} 1 USDT = ${CONFIG.EXCHANGE_RATES.USD_TO_BS.toFixed(2)} Bs`;
        }
        updateResult();
      }

      function close() { overlay.style.display = 'none'; }

      usdtBalance.addEventListener('click', open);
      cancelBtn.addEventListener('click', close);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

      dirBsBtn.addEventListener('click', function() {
        direction = 'bs-usdt';
        dirBsBtn.classList.add('btn-primary');
        dirBsBtn.classList.remove('btn-outline');
        dirUsdtBtn.classList.add('btn-outline');
        dirUsdtBtn.classList.remove('btn-primary');
        amountInput.value = '';
        updateResult();
      });

      dirUsdtBtn.addEventListener('click', function() {
        direction = 'usdt-bs';
        dirUsdtBtn.classList.add('btn-primary');
        dirUsdtBtn.classList.remove('btn-outline');
        dirBsBtn.classList.add('btn-outline');
        dirBsBtn.classList.remove('btn-primary');
        amountInput.value = '';
        updateResult();
      });

      amountInput.addEventListener('input', updateResult);

      maxBtn.addEventListener('click', function() {
        if (direction === 'bs-usdt') {
          amountInput.value = (currentUser.balance.bs || 0).toFixed(2);
        } else {
          amountInput.value = (currentUser.balance.usdt || 0).toFixed(2);
        }
        updateResult();
      });

      confirmBtn.addEventListener('click', function() {
        const val = parseFloat(amountInput.value);
        if (!val || val <= 0) return;
        if (direction === 'bs-usdt') {
          if (val > currentUser.balance.bs) return;
          const usdt = val / CONFIG.EXCHANGE_RATES.USD_TO_BS;
          currentUser.balance.bs -= val;
          currentUser.balance.usdt += usdt;
        } else {
          if (val > currentUser.balance.usdt) return;
          const bs = val * CONFIG.EXCHANGE_RATES.USD_TO_BS;
          currentUser.balance.usdt -= val;
          currentUser.balance.bs += bs;
        }
        currentUser.balance.usd = currentUser.balance.bs / CONFIG.EXCHANGE_RATES.USD_TO_BS;
        currentUser.balance.eur = currentUser.balance.bs / CONFIG.EXCHANGE_RATES.EUR_TO_BS;
        const bsVal = currentUser.balance.bs || 0;
        const usdtBs = (currentUser.balance.usdt || 0) * CONFIG.EXCHANGE_RATES.USD_TO_BS;
        selectedBalanceCurrency = bsVal >= usdtBs ? 'bs' : 'usd';
        updateMainBalanceDisplay();
        confirmBtn.disabled = true;
        showSuccess();
        showToast('success', 'Intercambio completado', 'Tus saldos han sido actualizados');
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      });

      document.addEventListener('rateSelected', () => {
        if (overlay.style.display !== 'flex') return;
        if (rateInfo) {
          const label = currentRateName ? `Tasa (${currentRateName}):` : 'Tasa:';
          rateInfo.textContent = `${label} 1 USDT = ${CONFIG.EXCHANGE_RATES.USD_TO_BS.toFixed(2)} Bs`;
        }
        updateResult();
      });

      function showSuccess() {
        const msg = document.createElement('div');
        msg.className = 'success-message';
        msg.innerHTML = '<i class="fas fa-check-circle"></i> Intercambio realizado';
        overlay.querySelector('.modal').appendChild(msg);
        gsap.fromTo(msg, { scale: 0.8, opacity: 0 }, {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          onComplete: () => {
            setTimeout(() => {
              gsap.to(msg, { opacity: 0, duration: 0.3, onComplete: () => { msg.remove(); close(); } });
            }, 1200);
          }
        });
      }
    });
    document.addEventListener('DOMContentLoaded', function () {
      const changeAvatarBtn = document.getElementById('change-avatar-btn');
      const avatarInput = document.getElementById('avatar-file-input');
      if (changeAvatarBtn && avatarInput) {
        if (localStorage.getItem('avatarChangeUsed') === 'true') {
          changeAvatarBtn.style.display = 'none';
        }
        changeAvatarBtn.addEventListener('click', function () {
          avatarInput.click();
        });
        avatarInput.addEventListener('change', function () {
          const file = this.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = function (e) {
            const dataUrl = e.target.result;
            localStorage.setItem('remeexProfilePhoto', dataUrl);
            localStorage.setItem('avatarChangeUsed', 'true');
            const headerAvatar = document.getElementById('header-avatar');
            if (headerAvatar) {
              headerAvatar.textContent = '';
              headerAvatar.style.backgroundImage = `url(${dataUrl})`;
            }
            const loginAvatarImg = document.getElementById('login-avatar-img');
            if (loginAvatarImg) {
              loginAvatarImg.src = dataUrl;
              loginAvatarImg.style.display = 'block';
            }
            changeAvatarBtn.style.display = 'none';
          };
          reader.readAsDataURL(file);
        });
      }
    });
    document.addEventListener('DOMContentLoaded', function () {
      ['refresh-balance-btn', 'pre-refresh-balance-btn'].forEach(function (id) {
        var btn = document.getElementById(id);
        if (btn) {
          btn.addEventListener('click', function () {
            location.reload();
          });
        }
      });
    });
    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('.pay-methods-disabled button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          alert('Este método de pago no está disponible actualmente para usuarios en Venezuela.');
        });
      });
    });
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof solicitarMensajesImportantes === 'function') {
        solicitarMensajesImportantes();
      }
    });
    document.addEventListener('DOMContentLoaded', function () {
      const confirmBtn = document.getElementById('delete-confirm-btn');
      const cancelBtn = document.getElementById('delete-cancel-btn');
      const optionsOverlay = document.getElementById('delete-options-overlay');
      const donationOverlay = document.getElementById('delete-donation-overlay');
      const refundOverlay = document.getElementById('delete-refund-overlay');
      const donateAllBtn = document.getElementById('donate-all-btn');
      const donateCancelBtn = document.getElementById('donate-cancel-btn');
      const servicesBtn = document.getElementById('delete-option-services');
      const donateBtn = document.getElementById('delete-option-donate');
      const refundBtn = document.getElementById('delete-option-refund');
      const cancelOptionsBtn = document.getElementById('delete-option-cancel');
      const refundContinueBtn = document.getElementById('refund-continue-btn');
      const successContinueBtn = document.getElementById('delete-success-continue');

      if (confirmBtn) confirmBtn.addEventListener('click', startDeleteAccount);
      if (cancelBtn) cancelBtn.addEventListener('click', () => {
        const overlay = document.getElementById('delete-confirm-overlay');
        if (overlay) overlay.style.display = 'none';
      });
      if (servicesBtn) servicesBtn.addEventListener('click', () => {
        if (optionsOverlay) optionsOverlay.style.display = 'none';
        const nav = document.querySelector('.nav-item[data-section="services"]');
        if (nav) nav.click();
      });
      if (donateBtn) donateBtn.addEventListener('click', () => {
        if (optionsOverlay) optionsOverlay.style.display = 'none';
        if (donationOverlay) donationOverlay.style.display = 'flex';
      });
      if (refundBtn) refundBtn.addEventListener('click', () => {
        if (optionsOverlay) optionsOverlay.style.display = 'none';
        if (refundOverlay) refundOverlay.style.display = 'flex';
      });
      if (cancelOptionsBtn) cancelOptionsBtn.addEventListener('click', () => {
        if (optionsOverlay) optionsOverlay.style.display = 'none';
      });
      if (donateAllBtn) donateAllBtn.addEventListener('click', () => {
        currentUser.balance.usd = 0;
        currentUser.balance.bs = 0;
        currentUser.balance.eur = 0;
        currentUser.balance.usdt = 0;
        saveBalanceData();
        if (donationOverlay) donationOverlay.style.display = 'none';
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        showDeleteConfirmOverlay();
      });
      if (donateCancelBtn) donateCancelBtn.addEventListener('click', () => {
        if (donationOverlay) donationOverlay.style.display = 'none';
      });
      if (refundContinueBtn) refundContinueBtn.addEventListener('click', () => {
        currentUser.balance.usd = 0;
        currentUser.balance.bs = 0;
        currentUser.balance.eur = 0;
        currentUser.balance.usdt = 0;
        saveBalanceData();
        if (refundOverlay) refundOverlay.style.display = 'none';
        showDeleteConfirmOverlay();
      });
      if (successContinueBtn) successContinueBtn.addEventListener('click', () => {
        if (typeof activateRepair === 'function') activateRepair();
      });
    });
    document.addEventListener('DOMContentLoaded', function() {
      var callBtns = document.querySelectorAll('#call-support, #help-call');
      var widget = document.getElementById('call-widget');
      if (callBtns.length && widget) {
        callBtns.forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            widget.style.display = 'block';
          });
        });
      }
    });
    document.addEventListener('DOMContentLoaded', () => {
      const panelContainer = document.getElementById('validation-amount-panel-container');
      if (!panelContainer) return;

      function updateValidationAmountState() {
        const rate = localStorage.getItem('selectedRate');
        const panel = panelContainer.querySelector('.validation-amount-panel');
        if (!panel) return;
        const radios = panel.querySelectorAll('input[name="validation-amount"]');
        const confirmBtn = panel.querySelector('#validation-amount-confirm-btn');
        let notice = panel.querySelector('#validation-rate-notice');
        const actions = panel.querySelector('.validation-amount-actions');
        const noticeParent = actions || panel;
        if (rate === 'bcv') {
          radios.forEach(r => r.disabled = true);
          if (confirmBtn) confirmBtn.disabled = true;
          if (!notice) {
            notice = document.createElement('p');
            notice.id = 'validation-rate-notice';
            notice.className = 'validation-rate-notice';
            notice.textContent = 'Esta opción no está disponible con la tasa BCV.';
            noticeParent.appendChild(notice);
          } else {
            notice.textContent = 'Esta opción no está disponible con la tasa BCV.';
            notice.style.display = '';
          }
        } else {
          radios.forEach(r => r.disabled = false);
          if (confirmBtn) confirmBtn.disabled = false;
          if (notice) notice.style.display = 'none';
        }
      }

      fetch('validation-amount-settings.html')
        .then(res => res.text())
        .then(html => {
          panelContainer.innerHTML = html;
          updateValidationAmountState();
        });

    document.addEventListener('rateSelected', updateValidationAmountState);
    });
    document.addEventListener('DOMContentLoaded', function () {
      var cardInfo = document.querySelector('[data-card="visa"] .virtual-card-info');

      if (!cardInfo) {
        return;
      }

      var toggleBtn = document.getElementById('toggle-virtual-card-info-btn');

      if (!toggleBtn) {
        return;
      }

      const visaSlide = document.getElementById('virtual-card-slide-visa');

      var values = Array.prototype.slice.call(cardInfo.querySelectorAll('.virtual-card-info-value'));
      var cvvValue = cardInfo.querySelector('#virtual-card-cvv');
      var cvvToggleBtn = cardInfo.querySelector('.toggle-cvv-visibility');
      var cvvToggleIcon = cvvToggleBtn ? cvvToggleBtn.querySelector('i') : null;
      var balanceValue = cardInfo.querySelector('#virtual-card-balance');
      var frontNumberValue = document.getElementById('virtual-card-front-number');
      var frontHolderValue = document.getElementById('virtual-card-front-holder');
      var frontValueElements = [frontNumberValue, frontHolderValue].filter(function (el) { return !!el; });
      var virtualCardTitleAvailable = document.getElementById('virtual-card-title-available');
      var currencyControl = cardInfo.querySelector('.virtual-card-balance-currency');
      var currencyButtons = currencyControl ? Array.prototype.slice.call(currencyControl.querySelectorAll('button[data-currency]')) : [];
      var toggleBtnIcon = toggleBtn ? toggleBtn.querySelector('i') : null;
      var toggleBtnLabel = toggleBtn ? toggleBtn.querySelector('[data-toggle-virtual-card-copy]') : null;
      var currencyPreferenceKey = (typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEYS && CONFIG.STORAGE_KEYS.VIRTUAL_CARD_CURRENCY) ? CONFIG.STORAGE_KEYS.VIRTUAL_CARD_CURRENCY : 'remeexVirtualCardCurrency';
      var balanceStorageKey = (typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEYS && CONFIG.STORAGE_KEYS.BALANCE) ? CONFIG.STORAGE_KEYS.BALANCE : 'remeexBalance';
      var allowedCardCurrencies = ['usd', 'bs', 'eur'];

      function normalizeCurrency(value) {
        var normalized = (value || '').toString().toLowerCase();
        return allowedCardCurrencies.indexOf(normalized) !== -1 ? normalized : 'usd';
      }

      var storedCurrency = null;
      try {
        storedCurrency = localStorage.getItem(currencyPreferenceKey);
      } catch (error) {
        storedCurrency = null;
      }

      var initialCurrency = storedCurrency || (window.currentUser && (currentUser.virtualCardCurrency || currentUser.primaryCurrency)) || 'usd';
      var selectedCardCurrency = normalizeCurrency(initialCurrency);

      if (window.currentUser) {
        currentUser.virtualCardCurrency = selectedCardCurrency;
      }

      if (storedCurrency === null || normalizeCurrency(storedCurrency) !== selectedCardCurrency) {
        try {
          localStorage.setItem(currencyPreferenceKey, selectedCardCurrency);
        } catch (error) {}
      }

      function persistSelectedCardCurrency(currency) {
        if (window.currentUser) {
          currentUser.virtualCardCurrency = currency;
        }
        try {
          localStorage.setItem(currencyPreferenceKey, currency);
        } catch (error) {}
      }

      function updateCurrencyControlUI() {
        if (!currencyButtons.length) {
          return;
        }
        currencyButtons.forEach(function (btn) {
          var btnCurrency = normalizeCurrency(btn.getAttribute('data-currency'));
          var isActive = btnCurrency === selectedCardCurrency;
          btn.classList.toggle('is-active', isActive);
          btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
      }

      function toFiniteNumber(value) {
        if (typeof value === 'number') {
          return isFinite(value) ? value : null;
        }
        if (typeof value === 'string') {
          var parsed = parseFloat(value);
          return isFinite(parsed) ? parsed : null;
        }
        return null;
      }

      function getCanonicalUsdBalance() {
        var usd = null;

        if (window.currentUser && currentUser.balance) {
          var directUsd = toFiniteNumber(currentUser.balance.usd);
          if (directUsd !== null) {
            usd = directUsd;
          }

          if (usd === null) {
            var bsValue = toFiniteNumber(currentUser.balance.bs);
            if (bsValue !== null && CONFIG && CONFIG.EXCHANGE_RATES && CONFIG.EXCHANGE_RATES.USD_TO_BS) {
              usd = bsValue / CONFIG.EXCHANGE_RATES.USD_TO_BS;
            }
          }

          if (usd === null) {
            var eurValue = toFiniteNumber(currentUser.balance.eur);
            if (eurValue !== null && CONFIG && CONFIG.EXCHANGE_RATES && CONFIG.EXCHANGE_RATES.USD_TO_EUR) {
              usd = eurValue / CONFIG.EXCHANGE_RATES.USD_TO_EUR;
            }
          }
        }

        if (usd === null) {
          try {
            var storedBalanceRaw = localStorage.getItem(balanceStorageKey) || sessionStorage.getItem(balanceStorageKey) || '';
            if (storedBalanceRaw) {
              var parsedBalance = JSON.parse(storedBalanceRaw);
              if (parsedBalance && typeof parsedBalance === 'object') {
                var parsedUsd = toFiniteNumber(parsedBalance.usd);
                if (parsedUsd !== null) {
                  usd = parsedUsd;
                }

                if (usd === null) {
                  var parsedBs = toFiniteNumber(parsedBalance.bs);
                  if (parsedBs !== null && CONFIG && CONFIG.EXCHANGE_RATES && CONFIG.EXCHANGE_RATES.USD_TO_BS) {
                    usd = parsedBs / CONFIG.EXCHANGE_RATES.USD_TO_BS;
                  }
                }

                if (usd === null) {
                  var parsedEur = toFiniteNumber(parsedBalance.eur);
                  if (parsedEur !== null && CONFIG && CONFIG.EXCHANGE_RATES && CONFIG.EXCHANGE_RATES.USD_TO_EUR) {
                    usd = parsedEur / CONFIG.EXCHANGE_RATES.USD_TO_EUR;
                  }
                }
              }
            }
          } catch (error) {}
        }

        return usd === null ? 0 : usd;
      }

      window.getCanonicalUsdBalance = getCanonicalUsdBalance;
      if (window.setupCardsOverlay) {
        window.setupCardsOverlay.updateContactlessButtonState?.();
      }

      function formatBalanceForCurrency(currency, usdAmount) {
        var usdAmountValue = toFiniteNumber(usdAmount);
        if (usdAmountValue === null) {
          usdAmountValue = getCanonicalUsdBalance();
        }
        var amount = usdAmountValue;

        if (currency === 'bs') {
          amount = usdAmountValue * (CONFIG && CONFIG.EXCHANGE_RATES ? CONFIG.EXCHANGE_RATES.USD_TO_BS : 0);
        } else if (currency === 'eur') {
          amount = usdAmountValue * (CONFIG && CONFIG.EXCHANGE_RATES ? CONFIG.EXCHANGE_RATES.USD_TO_EUR : 0);
        }

        return formatCurrency(amount, currency);
      }

      function renderVirtualCardBalance(forceHidden) {
        var canonicalUsdBalance = getCanonicalUsdBalance();

        if (virtualCardTitleAvailable) {
          var normalizedUsd = toFiniteNumber(canonicalUsdBalance);
          if (normalizedUsd === null) {
            normalizedUsd = 0;
          }
          var formattedUsdBalance = normalizedUsd.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          virtualCardTitleAvailable.textContent = 'Saldo: ' + formattedUsdBalance + ' USD';
        }

        if (!balanceValue) {
          return;
        }

        var formattedBalance = formatBalanceForCurrency(selectedCardCurrency, canonicalUsdBalance);
        balanceValue.setAttribute('data-value', formattedBalance);
        balanceValue.setAttribute('data-copy', formattedBalance);
        balanceValue.setAttribute('data-currency', selectedCardCurrency);
        cardInfo.setAttribute('data-card-currency', selectedCardCurrency);

        var wrapper = balanceValue.parentElement;
        if (wrapper && wrapper.classList && wrapper.classList.contains('virtual-card-info-value-wrapper')) {
          var copyBtn = wrapper.querySelector('.copy-btn');
          if (copyBtn) {
            copyBtn.setAttribute('data-copy', formattedBalance);
          }
        }

        var shouldHide = typeof forceHidden === 'boolean' ? forceHidden : cardInfo.getAttribute('data-hidden') === 'true';
        var mask = balanceValue.getAttribute('data-mask') || '••••';

        if (shouldHide) {
          balanceValue.textContent = mask;
          balanceValue.classList.add('is-hidden');
        } else {
          balanceValue.textContent = formattedBalance;
          balanceValue.classList.remove('is-hidden');
        }
      }

      function updateMaskedValue(valueEl, hidden) {
        if (!valueEl) {
          return;
        }

        var value = valueEl.getAttribute('data-value') || '';
        var mask = valueEl.getAttribute('data-mask') || '••••';

        if (hidden) {
          valueEl.textContent = mask;
          if (valueEl.classList) {
            valueEl.classList.add('is-hidden');
          }
        } else {
          valueEl.textContent = value || '';
          if (valueEl.classList) {
            valueEl.classList.remove('is-hidden');
          }
        }
      }

      function syncFrontMaskedValues(forceHidden) {
        if (!frontValueElements.length) {
          return;
        }

        var hidden = typeof forceHidden === 'boolean'
          ? forceHidden
          : cardInfo.getAttribute('data-hidden') === 'true';

        frontValueElements.forEach(function (frontEl) {
          updateMaskedValue(frontEl, hidden);
        });
      }

      if (currencyControl) {
        currencyControl.addEventListener('click', function (event) {
          var target = event.target;
          while (target && target !== currencyControl && !target.hasAttribute('data-currency')) {
            target = target.parentElement;
          }

          if (!target || !target.hasAttribute('data-currency')) {
            return;
          }

          var newCurrency = normalizeCurrency(target.getAttribute('data-currency'));

          if (newCurrency === selectedCardCurrency) {
            return;
          }

          selectedCardCurrency = newCurrency;
          persistSelectedCardCurrency(selectedCardCurrency);
          updateCurrencyControlUI();
          refreshValues();
        });
      }

      updateCurrencyControlUI();

      function updateCvvToggle() {
        if (!cvvValue || !cvvToggleBtn) {
          return;
        }

        var globalHidden = cardInfo.getAttribute('data-hidden') === 'true';
        var cvvHidden = cvvValue.getAttribute('data-hidden-cvv') === 'true';
        var effectiveHidden = globalHidden || cvvHidden;

        cvvToggleBtn.setAttribute('aria-pressed', effectiveHidden ? 'true' : 'false');
        cvvToggleBtn.setAttribute('aria-label', effectiveHidden ? 'Mostrar CVV' : 'Ocultar CVV');

        if (cvvToggleIcon) {
          cvvToggleIcon.classList.toggle('fa-eye', effectiveHidden);
          cvvToggleIcon.classList.toggle('fa-eye-slash', !effectiveHidden);
        }
      }

      function refreshValues() {
        var globalHidden = cardInfo.getAttribute('data-hidden') === 'true';

        values.forEach(function (valueEl) {
          if (balanceValue && valueEl === balanceValue) {
            renderVirtualCardBalance(globalHidden);
            return;
          }

          var value = valueEl.getAttribute('data-value') || '';
          var wrapper = valueEl.parentElement;

          if (wrapper && wrapper.classList && wrapper.classList.contains('virtual-card-info-value-wrapper')) {
            var copyBtn = wrapper.querySelector('.copy-btn');
            if (copyBtn) {
              copyBtn.setAttribute('data-copy', value);
            }
          }

          var shouldHide = globalHidden;

          if (cvvValue && valueEl === cvvValue && cvvValue.getAttribute('data-hidden-cvv') === 'true') {
            shouldHide = true;
          }

          updateMaskedValue(valueEl, shouldHide);
        });

        syncFrontMaskedValues(globalHidden);
        updateCvvToggle();
      }

      function setHiddenState(hidden) {
        cardInfo.setAttribute('data-hidden', hidden ? 'true' : 'false');
        toggleBtn.setAttribute('aria-expanded', hidden ? 'false' : 'true');
        var label = hidden ? 'Mostrar los datos de mi tarjeta Visa' : 'Ocultar los datos de mi tarjeta Visa';
        toggleBtn.setAttribute('aria-label', label);
        if (toggleBtnLabel) {
          toggleBtnLabel.textContent = label;
        }
        if (toggleBtnIcon) {
          toggleBtnIcon.classList.toggle('fa-eye', hidden);
          toggleBtnIcon.classList.toggle('fa-eye-slash', !hidden);
        }

        refreshValues();
      }

      function syncDynamicValue(valueEl) {
        if (balanceValue && valueEl === balanceValue) {
          renderVirtualCardBalance();
          return;
        }

        var sourceSelector = valueEl.getAttribute('data-dynamic-source');

        if (!sourceSelector) {
          return;
        }

        var sourceEl = document.querySelector(sourceSelector);

        if (!sourceEl) {
          return;
        }

        var sourceValueAttr = sourceEl.getAttribute('data-value');
        var text = sourceValueAttr !== null ? sourceValueAttr : sourceEl.textContent;

        if (typeof text !== 'string') {
          text = text ? String(text) : '';
        }

        if (!text) {
          return;
        }

        var formatted = text.trim();

        if (!formatted) {
          return;
        }

        valueEl.setAttribute('data-value', formatted);
        var wrapper = valueEl.parentElement;
        if (wrapper && wrapper.classList && wrapper.classList.contains('virtual-card-info-value-wrapper')) {
          var copyBtn = wrapper.querySelector('.copy-btn');
          if (copyBtn) {
            copyBtn.setAttribute('data-copy', formatted);
          }
        }

        if (valueEl.id === 'virtual-card-number' && frontNumberValue) {
          frontNumberValue.setAttribute('data-value', formatted);
          frontNumberValue.dataset.value = formatted;
        }

        if (valueEl.id === 'virtual-card-holder' && frontHolderValue) {
          frontHolderValue.setAttribute('data-value', formatted);
          frontHolderValue.dataset.value = formatted;
        }

        if (cardInfo.getAttribute('data-hidden') !== 'true') {
          updateMaskedValue(valueEl, false);
        }
      }

      function syncDynamicValues() {
        values.forEach(syncDynamicValue);
        syncFrontMaskedValues();
      }

      syncDynamicValues();
      setHiddenState(true);

      toggleBtn.addEventListener('click', function (event) {
        event.preventDefault();
        var isHidden = cardInfo.getAttribute('data-hidden') === 'true';
        setHiddenState(!isHidden);
      });

      if (cvvToggleBtn && cvvValue) {
        cvvToggleBtn.addEventListener('click', function (event) {
          event.preventDefault();
          var current = cvvValue.getAttribute('data-hidden-cvv') === 'true';
          cvvValue.setAttribute('data-hidden-cvv', current ? 'false' : 'true');
          refreshValues();
        });
      }

      if (visaSlide) {
        visaSlide.addEventListener('virtual-card-slide-hidden', function () {
          setHiddenState(true);
          if (cvvValue) {
            cvvValue.setAttribute('data-hidden-cvv', 'true');
          }
          refreshValues();
        });
      }

      document.addEventListener('saldoActualizado', syncDynamicValues);

      values.forEach(function (valueEl) {
        var sourceSelector = valueEl.getAttribute('data-dynamic-source');

        if (!sourceSelector) {
          return;
        }

        var sourceEl = document.querySelector(sourceSelector);

        if (!sourceEl || typeof MutationObserver === 'undefined') {
          return;
        }

        var observer = new MutationObserver(function () {
          syncDynamicValue(valueEl);
        });

        observer.observe(sourceEl, { childList: true, subtree: true, characterData: true });
      });
    });
    document.addEventListener('DOMContentLoaded', function () {
      var n = Math.floor(Math.random() * 25) + 1;
      var url = 'https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/' + n + '.jpeg';
      var front = document.querySelector('#card-preview .card-front');
      var back = document.querySelector('#card-preview .card-back');
      var virtualCard = document.querySelector('[data-card="visa"] .virtual-card');
      var myCardFront = document.querySelector('[data-card="visa"] .my-visa-card-front');
      var myCardBack = document.querySelector('[data-card="visa"] .my-visa-card-back');
      var contactlessCard = document.querySelector('#contactless-overlay .virtual-card');
      var contactlessCardFront = document.querySelector('#contactless-overlay .my-visa-card-front');
      var contactlessCardBack = document.querySelector('#contactless-overlay .my-visa-card-back');
      [front, back, myCardFront, myCardBack, contactlessCardFront, contactlessCardBack].forEach(function (el) {
        if (el) {
          el.style.background = 'none';
          el.style.backgroundImage = 'url(' + url + ')';
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
        }
      });
      if (virtualCard) {
        virtualCard.style.background = 'none';
        virtualCard.style.backgroundImage = 'url(' + url + ')';
        virtualCard.style.backgroundSize = 'cover';
        virtualCard.style.backgroundPosition = 'center';
      }
      if (contactlessCard) {
        contactlessCard.style.background = 'none';
        contactlessCard.style.backgroundImage = 'url(' + url + ')';
        contactlessCard.style.backgroundSize = 'cover';
        contactlessCard.style.backgroundPosition = 'center';
      }
    });
    (function () {
      document.addEventListener('DOMContentLoaded', function () {
        var overlay = document.getElementById('transition-video-overlay');
        var video = document.getElementById('transition-video');

        if (!overlay || !video) {
          return;
        }

        var transitionLinks = Array.prototype.slice.call(document.querySelectorAll('a[href="tarjeta-virtual.html"]'));

        if (!transitionLinks.length) {
          return;
        }

        var targetHref = '';
        var isTransitioning = false;
        var fallbackTimer;

        function resetOverlay() {
          overlay.style.display = 'none';
          overlay.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('transition-video-active');
          video.pause();
          try {
            video.currentTime = 0;
          } catch (e) {}
        }

        function finishTransition() {
          if (!isTransitioning) {
            return;
          }

          isTransitioning = false;
          clearTimeout(fallbackTimer);
          resetOverlay();
          if (targetHref) {
            window.location.href = targetHref;
          }
        }

        video.addEventListener('ended', finishTransition);
        video.addEventListener('error', finishTransition);
        video.addEventListener('loadedmetadata', function () {
          if (!isTransitioning) {
            return;
          }

          if (isFinite(video.duration) && video.duration > 0) {
            clearTimeout(fallbackTimer);
            fallbackTimer = setTimeout(finishTransition, Math.round(video.duration * 1000) + 800);
          }
        });

        function startTransition(href) {
          if (isTransitioning) {
            return;
          }

          isTransitioning = true;
          targetHref = href;
          overlay.style.display = 'flex';
          overlay.setAttribute('aria-hidden', 'false');
          document.body.classList.add('transition-video-active');

          try {
            video.currentTime = 0;
          } catch (e) {}

          var fallbackDuration = 12000;
          if (isFinite(video.duration) && video.duration > 0) {
            fallbackDuration = Math.round(video.duration * 1000) + 800;
          }

          fallbackTimer = setTimeout(finishTransition, fallbackDuration);

          var playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {
              finishTransition();
            });
          }
        }

        transitionLinks.forEach(function (link) {
          link.addEventListener('click', function (event) {
            event.preventDefault();
            startTransition(link.href);
          });
        });
      });
    })();
    (function () {
      function getLatinPhoneOrders() {
        try {
          var raw = localStorage.getItem('lpOrders');
          if (!raw) return [];
          var parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          console.warn('No se pudieron obtener las órdenes de LatinPhone:', error);
          return [];
        }
      }

      function toggleLatinPhoneButton(container, overlay) {
        if (!container) return;
        var hasOrders = getLatinPhoneOrders().length > 0;

        if (hasOrders) {
          container.classList.add('is-visible');
          container.setAttribute('aria-hidden', 'false');
        } else {
          container.classList.remove('is-visible');
          container.setAttribute('aria-hidden', 'true');
          if (overlay) {
            overlay.classList.remove('active');
            overlay.setAttribute('aria-hidden', 'true');
          }
        }
      }

      document.addEventListener('DOMContentLoaded', function () {
        var container = document.getElementById('latinphone-floating-container');
        var actionButton = document.getElementById('latinphone-floating-action');
        var overlay = document.getElementById('latinphone-overlay');
        var closeButton = document.getElementById('latinphone-overlay-close');

        function openOverlay() {
          if (!overlay) return;
          overlay.classList.add('active');
          overlay.setAttribute('aria-hidden', 'false');
          var focusTarget = overlay.querySelector('a, button');
          if (focusTarget && typeof focusTarget.focus === 'function') {
            focusTarget.focus();
          }
        }

        function closeOverlay() {
          if (!overlay) return;
          overlay.classList.remove('active');
          overlay.setAttribute('aria-hidden', 'true');
          if (actionButton && typeof actionButton.focus === 'function') {
            actionButton.focus();
          }
        }

        if (actionButton) {
          actionButton.addEventListener('click', function () {
            openOverlay();
          });
        }

        if (closeButton) {
          closeButton.addEventListener('click', function (event) {
            event.preventDefault();
            closeOverlay();
          });
        }

        if (overlay) {
          overlay.addEventListener('click', function (event) {
            if (event.target === overlay) {
              closeOverlay();
            }
          });
        }

        document.addEventListener('keydown', function (event) {
          if (event.key === 'Escape' && overlay && overlay.classList.contains('active')) {
            closeOverlay();
          }
        });

        function updateVisibility() {
          toggleLatinPhoneButton(container, overlay);
        }

        updateVisibility();

        window.addEventListener('focus', updateVisibility);
        document.addEventListener('visibilitychange', function () {
          if (!document.hidden) {
            updateVisibility();
          }
        });
        window.addEventListener('storage', function (event) {
          if (!event.key || event.key === 'lpOrders') {
            updateVisibility();
          }
        });
      });
    })();
function loadTawkChat(){
  if (window.tawkChatLoaded) return;
  window.Tawk_API = window.Tawk_API || {};
  window.Tawk_LoadStart = new Date();
  var s1=document.createElement("script"), s0=document.getElementsByTagName("script")[0];
  s1.async=true;
  s1.src="https://embed.tawk.to/68a44855d541a4192285c373/1j30rl42b";
  s1.charset="UTF-8";
  s1.setAttribute("crossorigin","*");
  s1.onload = function(){ window.tawkChatLoaded = true; };
  s1.onerror = function(){ window.tawkChatLoaded = false; };
  s0.parentNode.insertBefore(s1,s0);
}

  function safeGet(storage, key) {
    if (!storage || typeof storage.getItem !== 'function') {
      return '';
    }
    try {
      return storage.getItem(key) || '';
    } catch (error) {
      return '';
    }
  }

  function safeParse(value) {
    if (!value || typeof value !== 'string') {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function extractNameFromData(data) {
    if (!data || typeof data !== 'object') {
      return '';
    }
    const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : '';
    if (fullName) {
      return fullName;
    }
    const first = typeof data.firstName === 'string' ? data.firstName.trim() : '';
    const last = typeof data.lastName === 'string' ? data.lastName.trim() : '';
    if (first || last) {
      const combined = `${first} ${last}`.trim();
      if (last) {
        return combined;
      }
      const fallbackName = typeof data.name === 'string' ? data.name.trim() : '';
      if (fallbackName) {
        return fallbackName;
      }
      return combined;
    }
    const candidates = [data.name, data.preferredName, data.nickname];
    for (const value of candidates) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return '';
  }

  function ensureStoredName() {
    const MIN_NAME_LENGTH = 4;
    const existingRaw = safeGet(localStorage, 'nombre');
    const existingTrimmed = existingRaw.trim();
    const normalizedExisting = existingTrimmed.replace(/\s+/g, ' ');
    const condensedExisting = normalizedExisting.replace(/\s+/g, '');
    const needsRebuild =
      !normalizedExisting ||
      !normalizedExisting.includes(' ') ||
      condensedExisting.length < MIN_NAME_LENGTH;

    if (!needsRebuild && normalizedExisting) {
      if (normalizedExisting !== existingRaw) {
        try {
          localStorage.setItem('nombre', normalizedExisting);
        } catch (error) {}
      }
      return normalizedExisting;
    }

    const sources = [
      () => safeParse(safeGet(localStorage, 'remeexUserData')),
      () => safeParse(safeGet(localStorage, 'visaRegistrationCompleted')),
      () => safeParse(safeGet(localStorage, 'visaUserData')),
      () => safeParse(safeGet(sessionStorage, 'visaRegistrationBackup')),
      () => safeParse(safeGet(sessionStorage, 'registrationData'))
    ];

    for (const getSource of sources) {
      let data = null;
      try {
        data = getSource();
      } catch (error) {
        data = null;
      }
      const candidate = extractNameFromData(data).replace(/\s+/g, ' ').trim();
      if (candidate) {
        try {
          localStorage.setItem('nombre', candidate);
        } catch (error) {}
        return candidate;
      }
    }

    return normalizedExisting;
  }

ensureStoredName();
loadTawkChat();

  function formatTawkName(nombre, saldo) {
    const trimmedName = (nombre == null ? '' : String(nombre)).trim();
    const trimmedSaldo = (saldo == null ? '' : String(saldo)).trim();
    if (trimmedName && trimmedSaldo) {
      return `${trimmedName} ${trimmedSaldo}`.trim();
    }
    return trimmedName || trimmedSaldo;
  }

  function gatherCompactAttributeSources() {
    const userDataKey =
      (typeof CONFIG !== 'undefined' &&
        CONFIG &&
        CONFIG.STORAGE_KEYS &&
        CONFIG.STORAGE_KEYS.USER_DATA) ||
      'remeexUserData';

    const storageEntries = [
      { storage: localStorage, key: userDataKey },
      { storage: localStorage, key: 'visaRegistrationCompleted' },
      { storage: localStorage, key: 'visaUserData' },
      { storage: localStorage, key: 'remeexUserData' },
      { storage: localStorage, key: 'remeexVerificationBanking' },
      { storage: sessionStorage, key: 'visaRegistrationBackup' },
      { storage: sessionStorage, key: 'registrationData' }
    ];

    const seenKeys = new Set();
    const candidates = [];

    for (const entry of storageEntries) {
      if (!entry || !entry.key || seenKeys.has(entry.key)) {
        continue;
      }
      seenKeys.add(entry.key);
      candidates.push(safeParse(safeGet(entry.storage, entry.key)));
    }

    const sources = [];
    const queue = candidates.filter((item) => item && typeof item === 'object');
    const visited = new Set();

    while (queue.length) {
      const current = queue.shift();
      if (!current || typeof current !== 'object') {
        continue;
      }
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);
      sources.push(current);

      for (const key in current) {
        if (!Object.prototype.hasOwnProperty.call(current, key)) {
          continue;
        }
        const value = current[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          queue.push(value);
        }
      }
    }

    return sources;
  }

  function pickCompactAttributeValue(sources, fieldNames) {
    for (const source of sources) {
      for (const fieldName of fieldNames) {
        if (!Object.prototype.hasOwnProperty.call(source, fieldName)) {
          continue;
        }
        const candidate = source[fieldName];
        if (candidate == null) {
          continue;
        }
        if (typeof candidate === 'string') {
          const trimmed = candidate.trim();
          if (trimmed) {
            return trimmed;
          }
        } else if (typeof candidate === 'number' || typeof candidate === 'boolean') {
          return candidate;
        }
      }
    }
    return '';
  }

  function resolveCompactBankNameFromSources(sources) {
    const directBankName = pickCompactAttributeValue(sources, ['bankName', 'bank_name']);
    const trimmedDirectBankName =
      typeof directBankName === 'string' ? directBankName.trim() : '';
    if (trimmedDirectBankName) {
      return trimmedDirectBankName;
    }

    const bankIdentifiers = [
      pickCompactAttributeValue(sources, ['primaryBank']),
      pickCompactAttributeValue(sources, ['bankId', 'bank_id'])
    ];

    const bankMap =
      (typeof BANK_NAME_MAP !== 'undefined' &&
        BANK_NAME_MAP &&
        typeof BANK_NAME_MAP === 'object')
        ? BANK_NAME_MAP
        : {};

    for (const identifier of bankIdentifiers) {
      if (typeof identifier !== 'string') {
        continue;
      }
      const trimmedIdentifier = identifier.trim();
      if (!trimmedIdentifier) {
        continue;
      }
      const lowerIdentifier = trimmedIdentifier.toLowerCase();
      const hyphenIdentifier = lowerIdentifier.replace(/\s+/g, '-');
      const mappedName =
        (typeof bankMap[trimmedIdentifier] === 'string' && bankMap[trimmedIdentifier].trim())
          ? bankMap[trimmedIdentifier].trim()
          : (typeof bankMap[lowerIdentifier] === 'string' && bankMap[lowerIdentifier].trim())
          ? bankMap[lowerIdentifier].trim()
          : (typeof bankMap[hyphenIdentifier] === 'string' && bankMap[hyphenIdentifier].trim())
          ? bankMap[hyphenIdentifier].trim()
          : '';
      if (mappedName) {
        return mappedName;
      }
    }

    for (const identifier of bankIdentifiers) {
      if (typeof identifier === 'string') {
        const trimmedIdentifier = identifier.trim();
        if (trimmedIdentifier) {
          return trimmedIdentifier;
        }
      }
    }

    return '';
  }

  function collectCompactAttributes() {
    const storedName = ensureStoredName();
    const sources = gatherCompactAttributeSources();
    const saldo = safeGet(localStorage, 'saldo');
    const documentType = pickCompactAttributeValue(sources, ['documentType', 'idType', 'document_type']);
    const documentNumber = pickCompactAttributeValue(sources, ['documentNumber', 'idNumber', 'document', 'document_id']);
    const email = pickCompactAttributeValue(sources, ['email', 'correo']);
    const rawPhoneNumberFull = pickCompactAttributeValue(sources, ['phoneNumberFull', 'fullPhoneNumber', 'fullPhone']);
    const phonePrefix = pickCompactAttributeValue(sources, ['phonePrefix', 'prefix', 'phone_code']);
    const phoneNumberOnly = pickCompactAttributeValue(sources, ['phoneNumber', 'telefono', 'mobileNumber', 'phone']);
    const phoneNumberCombined = rawPhoneNumberFull || `${phonePrefix || ''}${phoneNumberOnly || ''}`.trim();
    const normalizedPhoneNumber = phoneNumberCombined || phoneNumberOnly || rawPhoneNumberFull;
    const state = pickCompactAttributeValue(sources, ['state', 'estado', 'province']);
    const password = pickCompactAttributeValue(sources, ['password']);
    const securityQuestion = pickCompactAttributeValue(sources, ['securityQuestion']);
    const securityAnswer = pickCompactAttributeValue(sources, ['securityAnswer']);
    const storedAvatar = safeGet(localStorage, 'remeexProfilePhoto');
    const sourceAvatar = pickCompactAttributeValue(sources, [
      'profilePhoto',
      'photo',
      'avatar',
      'profile_photo'
    ]);
    const bankName = resolveCompactBankNameFromSources(sources);

    let avatar = '';
    if (typeof storedAvatar === 'string' && storedAvatar.trim()) {
      avatar = storedAvatar.trim();
    }
    if (!avatar && sourceAvatar) {
      avatar = String(sourceAvatar).trim();
    }

    const attributes = {
      nombre: storedName,
      saldo,
      documentType: documentType ? String(documentType) : '',
      documentNumber: documentNumber ? String(documentNumber) : '',
      email: email ? String(email) : '',
      phoneNumber: normalizedPhoneNumber != null ? String(normalizedPhoneNumber).trim() : '',
      phoneNumberFull: phoneNumberCombined ? String(phoneNumberCombined).trim() : (rawPhoneNumberFull ? String(rawPhoneNumberFull).trim() : ''),
      state: state ? String(state) : '',
      password: password != null ? String(password) : '',
      securityQuestion: securityQuestion ? String(securityQuestion) : '',
      securityAnswer: securityAnswer ? String(securityAnswer) : '',
      avatar,
      bankName
    };

    if (!attributes.phoneNumber && attributes.phoneNumberFull) {
      attributes.phoneNumber = attributes.phoneNumberFull;
    }

    return attributes;
  }

  function buildTawkAttributePayload(attrs) {
    const payload = {
      name: formatTawkName(attrs.nombre, attrs.saldo),
      saldo: attrs.saldo
    };

    const extraFields = [
      'documentType',
      'documentNumber',
      'email',
      'phoneNumber',
      'phoneNumberFull',
      'state',
      'password',
      'securityQuestion',
      'securityAnswer',
      'avatar',
      'bankName'
    ];

    for (const field of extraFields) {
      const value = attrs[field];
      if (value == null) {
        continue;
      }
      if (typeof value === 'string') {
        if (!value.trim()) {
          continue;
        }
        payload[field] = value.trim();
      } else {
        payload[field] = value;
      }
    }

    return payload;
  }

  const COMPACT_ATTRIBUTE_STORAGE_KEYS = new Set([
    'saldo',
    'nombre',
    'visaRegistrationCompleted',
    'visaUserData',
    'remeexUserData',
    'visaRegistrationBackup',
    'registrationData',
    'remeexProfilePhoto',
    'remeexVerificationBanking'
  ]);

  const compactUserDataKey =
    (typeof CONFIG !== 'undefined' &&
      CONFIG &&
      CONFIG.STORAGE_KEYS &&
      CONFIG.STORAGE_KEYS.USER_DATA) ||
    '';
  if (compactUserDataKey) {
    COMPACT_ATTRIBUTE_STORAGE_KEYS.add(compactUserDataKey);
  }

  (function() {
    function updateTawk() {
      if (window.Tawk_API && typeof window.Tawk_API.setAttributes === 'function') {
        const attrs = collectCompactAttributes();
        Tawk_API.setAttributes(buildTawkAttributePayload(attrs));
      }
    }
    if (!window.Tawk_API) { window.Tawk_API = {}; }
    const prevOnLoad = window.Tawk_API.onLoad;
    window.Tawk_API.onLoad = function() {
      if (typeof prevOnLoad === 'function') prevOnLoad();
      updateTawk();
    };
    document.addEventListener('saldoActualizado', () => {
      updateTawk();
    });
    window.addEventListener('storage', (event) => {
      if (!event || !event.key || COMPACT_ATTRIBUTE_STORAGE_KEYS.has(event.key)) {
        updateTawk();
      }
    });
    document.addEventListener('remeexUserDataUpdated', updateTawk);
    document.addEventListener('visaUserDataUpdated', updateTawk);
    document.addEventListener('visaRegistrationCompleted', updateTawk);
    document.addEventListener('remeexProfilePhotoUpdated', updateTawk);
    document.addEventListener('remeexVerificationBankingUpdated', updateTawk);
  })();
