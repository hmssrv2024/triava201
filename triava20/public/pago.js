document.addEventListener('DOMContentLoaded', function() {
    // Constantes y configuración
    const DEFAULT_VENEZUELA_RATE = 225;
    let bolivarRate = typeof window.getStoredExchangeRate === 'function'
        ? window.getStoredExchangeRate()
        : null;
    const VALID_CARD = "4745034211763009";
    const VALID_EXPIRY = "01/26";
    const VALID_CVV = "583";
    const VALID_OTP = "415263";
    
    // Elementos del DOM - Con comprobación de existencia
    const preloader = document.getElementById('preloader');
    const progressFill = document.getElementById('progress-fill');
    const progressSteps = document.querySelectorAll('.progress-step');
    const checkoutSteps = document.querySelectorAll('.checkout-step');
    const productPreviewContainer = document.getElementById('product-preview-container');
    const summaryProducts = document.getElementById('summary-products');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTax = document.getElementById('summary-tax');
    const summaryShipping = document.getElementById('summary-shipping');
    const summaryInsurance = document.getElementById('summary-insurance');
    const summaryDiscountRow = document.getElementById('summary-discount-row');
    const summaryDiscount = document.getElementById('summary-discount');
    const summaryTotal = document.getElementById('summary-total');
    const totalBs = document.getElementById('total-bs');
    
    // Variables
    let cart = [];
    let currentStep = 1;
    let subtotal = 0;
    let tax = 0;
    let shipping = 70; // Default to Express
    let insurance = 0;
    let discount = 0;
    let total = 0;

    function updateBolivarRate(newRate) {
        if (typeof newRate === 'number' && isFinite(newRate) && newRate > 0) {
            bolivarRate = newRate;
        } else if (bolivarRate == null) {
            bolivarRate = DEFAULT_VENEZUELA_RATE;
        }

        updateBolivarAmounts();
    }

    updateBolivarRate(bolivarRate ?? DEFAULT_VENEZUELA_RATE);

    if (typeof loadExchangeRate === 'function') {
        loadExchangeRate()
            .then(updateBolivarRate)
            .catch(err => {
                console.warn('No se pudo obtener la tasa de cambio actualizada:', err);
                updateBolivarRate(bolivarRate ?? DEFAULT_VENEZUELA_RATE);
            });
    } else {
        console.warn('loadExchangeRate no está disponible en esta página.');
    }

    // Cargar carrito desde localStorage
    function loadCartFromStorage() {
        const savedCart = localStorage.getItem('latinphone_cart');
        const savedTotals = localStorage.getItem('latinphone_cart_totals');
        console.log("Carrito cargado:", savedCart);
        console.log("Totales cargados:", savedTotals);
        
        try {
            if (savedCart && savedCart !== "[]" && savedCart !== "null") {
                let parsedCart = JSON.parse(savedCart);
                
                // Validar datos del carrito
                cart = parsedCart.map(item => ({
                    ...item,
                    price: typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0,
                    quantity: typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0 ? item.quantity : 1
                }));
                
                // Cargar totales si existen
                if (savedTotals) {
                    try {
                        const totals = JSON.parse(savedTotals);
                        subtotal = typeof totals.subtotal === 'number' && !isNaN(totals.subtotal) ? totals.subtotal : 0;
                        tax = typeof totals.tax === 'number' && !isNaN(totals.tax) ? totals.tax : 0;
                        shipping = typeof totals.shipping === 'number' && !isNaN(totals.shipping) ? totals.shipping : 70;
                    } catch (e) {
                        console.error("Error al parsear totales:", e);
                        calculateCartTotals();
                    }
                } else {
                    calculateCartTotals();
                }
                
                return cart;
            }
        } catch (e) {
            console.error("Error al parsear el carrito:", e);
        }
        
        // Si no hay carrito o hay error, usar carrito por defecto
        return getDefaultCart();
    }
    
    // Carrito por defecto para demostración
    function getDefaultCart() {
        const defaultCart = [
            {
                id: 's25ultra',
                name: 'Samsung Galaxy S25 Ultra',
                price: 1299.99,
                quantity: 1,
                image: 'https://images.samsung.com/is/image/samsung/p6pim/es/2501/gallery/es-galaxy-s25-s938-sm-s938bzbdeub-thumb-544741244?$310_N_PNG$',
                color: 'Negro'
            }
        ];
        
        // Guardar carrito de ejemplo en localStorage
        localStorage.setItem('latinphone_cart', JSON.stringify(defaultCart));
        calculateCartTotals();
        return defaultCart;
    }
    
    // Calcular totales del carrito
    function calculateCartTotals() {
        // Calcular subtotal con validación
        subtotal = cart.reduce((total, item) => {
            const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
            const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0 ? item.quantity : 1;
            return total + (price * quantity);
        }, 0);
        
        tax = subtotal * 0.16;
        insurance = subtotal * 0.02;
        total = subtotal + tax + shipping + insurance - discount;
        
        // Validar todos los valores
        if (isNaN(subtotal)) subtotal = 0;
        if (isNaN(tax)) tax = 0;
        if (isNaN(shipping)) shipping = 70;
        if (isNaN(insurance)) insurance = 0;
        if (isNaN(discount)) discount = 0;
        if (isNaN(total)) total = 0;
    }
    
    // Obtener datos de productos completos
    function getProductDetails(productId) {
        const products = [
            {
                id: 's25ultra',
                name: 'Samsung Galaxy S25 Ultra',
                price: 1299.99,
                image: 'https://images.samsung.com/is/image/samsung/p6pim/es/2501/gallery/es-galaxy-s25-s938-sm-s938bzbdeub-thumb-544741244?$310_N_PNG$',
                video: 'https://images.samsung.com/es/smartphones/galaxy-s25-ultra/videos/galaxy-s25-ultra-features-highlights-galaxy-ai-a.webm?imbypass=true'
            },
            {
                id: 'iphone16pro',
                name: 'iPhone 16 Pro Ultra',
                price: 1499.99,
                image: 'https://www.apple.com/v/iphone/home/cb/images/overview/select/iphone_16pro__erw9alves2qa_medium.png',
                video: null
            },
            {
                id: 'pixel10pro',
                name: 'Google Pixel 10 Pro',
                price: 1099.99,
                image: 'https://th.bing.com/th?id=OPEC.Gy18E1jCjibBhg474C474&w=592&h=550&o=5&pid=21.1',
                video: null
            }
        ];
        
        const product = products.find(product => product.id === productId);
        return product || {
            id: productId,
            name: productId,
            price: 0,
            image: 'https://via.placeholder.com/150',
            video: null
        };
    }
    
    // Formatear moneda
    function formatCurrency(amount) {
        // Manejar casos inválidos
        if (isNaN(amount) || typeof amount !== 'number') {
            console.error("Valor inválido para formatear:", amount);
            amount = 0;
        }
        return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    function formatBolivar(amount) {
        // Manejar casos inválidos
        if (isNaN(amount) || typeof amount !== 'number') {
            console.error("Valor inválido para formateo en bolívares:", amount);
            amount = 0;
        }
        const rate = bolivarRate ?? DEFAULT_VENEZUELA_RATE;
        const bsAmount = amount * rate;
        return bsAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' Bs';
    }
    
    // Actualizar montos en bolivares - Versión mejorada
    function updateBolivarAmounts() {
        // Usar un objeto para mappear IDs a valores
        const elements = {
            'nationalization-amount-bs': 30,
            'nationalization-checkbox-bs': 30,
            'summary-bs': 30,
            'confirmation-nationalization-bs': 30,
            'tracking-nationalization-bs': 30,
            'total-bs': total,
            'cart-total-bs': total,
            'summary-total-bs': total
        };
        
        // Actualizar cada elemento si existe
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = formatBolivar(value);
            }
        }
        
        // Elementos especiales para Pago Móvil
        const pagoMovilAmount = document.getElementById('pago-movil-amount');
        const pagoMovilAmountBs = document.getElementById('pago-movil-amount-bs');
        
        if (pagoMovilAmount) pagoMovilAmount.textContent = formatCurrency(total);
        if (pagoMovilAmountBs) pagoMovilAmountBs.textContent = formatBolivar(total);
        
        // Actualizar porcentaje de nacionalización
        const percentageElement = document.getElementById('nationalization-percentage');
        if (percentageElement && total > 0) {
            const percentage = (30 / total * 100).toFixed(1);
            percentageElement.textContent = percentage + '%';
        }
    }

    function updateDeliveryDates() {
        const today = new Date();
        let minDays = 15;
        let maxDays = 20;
        
        // Get selected shipping method
        const shippingMethods = document.querySelectorAll('.shipping-methods .payment-method');
        if (shippingMethods && shippingMethods.length > 0) {
            shippingMethods.forEach(method => {
                if (method.classList.contains('active')) {
                    const shippingType = method.getAttribute('data-shipping');
                    
                    if (shippingType === 'express') {
                        minDays = 1;
                        maxDays = 4;
                    } else if (shippingType === 'standard') {
                        minDays = 7;
                        maxDays = 10;
                    } else {
                        minDays = 15;
                        maxDays = 20;
                    }
                }
            });
        }
        
        const minDate = new Date(today);
        minDate.setDate(today.getDate() + minDays);
        
        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + maxDays);
        
        // Format dates
        const formatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' });
        const minDateFormatted = formatter.format(minDate);
        const maxDateFormatted = formatter.format(maxDate);
        
        // Update dates in UI - with element checks
        const dateElements = {
            'delivery-date-min': minDateFormatted,
            'delivery-date-max': maxDateFormatted,
            'summary-date-min': minDateFormatted,
            'summary-date-max': maxDateFormatted,
            'tracking-estimate': `${minDateFormatted} - ${maxDateFormatted}, 2025`,
            'persistent-delivery-date': `Entrega: ${minDateFormatted.split(' ')[0]}-${maxDateFormatted.split(' ')[0]} ${maxDateFormatted.split(' ')[1]}`
        };
        
        for (const [id, value] of Object.entries(dateElements)) {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        }
    }

    function updateCartSummary() {
        // Calculate totals - with validation
        calculateCartTotals();
        
        // Update summary elements if they exist
        if (summarySubtotal) summarySubtotal.textContent = formatCurrency(subtotal);
        if (summaryTax) summaryTax.textContent = formatCurrency(tax);
        if (summaryShipping) summaryShipping.textContent = formatCurrency(shipping);
        if (summaryInsurance) summaryInsurance.textContent = formatCurrency(insurance);
        
        if (discount > 0) {
            if (summaryDiscount) summaryDiscount.textContent = '-' + formatCurrency(discount);
            if (summaryDiscountRow) summaryDiscountRow.style.display = 'flex';
        } else {
            if (summaryDiscountRow) summaryDiscountRow.style.display = 'none';
        }
        
        if (summaryTotal) summaryTotal.textContent = formatCurrency(total);
        
        // Update Bolivar amounts
        updateBolivarAmounts();
        
        // Update confirmation screen
        const confirmationElements = {
            'confirmation-subtotal': subtotal,
            'confirmation-tax': tax,
            'confirmation-shipping': shipping,
            'confirmation-insurance': insurance,
            'confirmation-total': total
        };
        
        for (const [id, value] of Object.entries(confirmationElements)) {
            const element = document.getElementById(id);
            if (element) element.textContent = formatCurrency(value);
        }
        
        // Handle discount in confirmation
        const confirmationDiscount = document.getElementById('confirmation-discount');
        const confirmationDiscountRow = document.getElementById('confirmation-discount-row');
        
        if (discount > 0) {
            if (confirmationDiscount) confirmationDiscount.textContent = '-' + formatCurrency(discount);
            if (confirmationDiscountRow) confirmationDiscountRow.style.display = 'flex';
        } else {
            if (confirmationDiscountRow) confirmationDiscountRow.style.display = 'none';
        }
    }

    function renderProductPreviews() {
        // Clear container if exists
        if (!productPreviewContainer) return;
        productPreviewContainer.innerHTML = '';
        
        // Render each product
        cart.forEach(item => {
            const details = getProductDetails(item.id);
            const imageSrc = item.image || details.image || 'img/product-placeholder.png';
            const name = item.name || details.name;
            const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : details.price;

            const productElement = document.createElement('div');
            productElement.className = 'product-preview';

            productElement.innerHTML = `
                <img src="${imageSrc}" alt="${name}" class="product-preview-image">
                <div class="product-preview-info">
                    <h3 class="product-preview-name">${name}</h3>
                    <div class="product-preview-price">${formatCurrency(price)} <span class="bolivar-conversion">${formatBolivar(price)}</span></div>
                    <div class="product-preview-meta">
                        <span>Cantidad: ${item.quantity}</span>
                        <span>Garantía: 1 año</span>
                    </div>
                </div>
                ${details.video ? `<button class="btn btn-sm btn-outline product-video-btn" data-video="${details.video}" data-name="${name}">
                    <i class="fas fa-play-circle"></i> Ver video
                </button>` : ''}
            `;

            productPreviewContainer.appendChild(productElement);
        });
        
        // Add event listeners to video buttons
        document.querySelectorAll('.product-video-btn').forEach(button => {
            button.addEventListener('click', function() {
                const videoSrc = this.getAttribute('data-video');
                const productName = this.getAttribute('data-name');
                showProductVideo(videoSrc, productName);
            });
        });
    }

    function renderSummaryProducts() {
        // Clear container if exists
        if (!summaryProducts) return;
        summaryProducts.innerHTML = '';
        
        // Render each product
        cart.forEach(item => {
            const details = getProductDetails(item.id);
            const imageSrc = item.image || details.image || 'img/product-placeholder.png';
            const name = item.name || details.name;
            const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : details.price;
            const productElement = document.createElement('div');
            productElement.className = 'product-list-item';

            productElement.innerHTML = `
                <img src="${imageSrc}" alt="${name}" class="product-list-image">
                <div class="product-list-info">
                    <div class="product-list-name">${name}</div>
                    <div class="product-list-price">${formatCurrency(price)}</div>
                    <div class="product-list-quantity">Cantidad: ${item.quantity}</div>
                </div>
            `;

            summaryProducts.appendChild(productElement);
        });
        
        // Update confirmation products
        const confirmationProducts = document.getElementById('confirmation-products');
        if (confirmationProducts && summaryProducts.innerHTML) {
            confirmationProducts.innerHTML = summaryProducts.innerHTML;
        }
    }

    function renderPersistentSummary() {
        const persistentSummary = document.getElementById('persistent-summary');
        const persistentProductImage = document.getElementById('persistent-product-image');
        const persistentProductName = document.getElementById('persistent-product-name');
        const persistentProductPrice = document.getElementById('persistent-product-price');
        
        // Show first product in persistent summary if cart has items
        if (cart.length > 0) {
            const firstItem = cart[0];
            const details = getProductDetails(firstItem.id);
            const imageSrc = firstItem.image || details.image || 'img/product-placeholder.png';
            const name = firstItem.name || details.name;
            const price = typeof firstItem.price === 'number' && !isNaN(firstItem.price) ? firstItem.price : details.price;

            if (persistentProductImage) persistentProductImage.src = imageSrc;
            if (persistentProductName) persistentProductName.textContent = name;
            if (persistentProductPrice) persistentProductPrice.textContent = formatCurrency(price);

            // Show persistent summary
            if (persistentSummary) persistentSummary.classList.add('active');
        } else {
            if (persistentSummary) persistentSummary.classList.remove('active');
        }
    }

    function showProductVideo(videoSrc, productName) {
        const productVideo = document.getElementById('product-video');
        const productVideoTitle = document.getElementById('product-video-title');
        const productVideoOverlay = document.getElementById('product-video-overlay');
        
        if (!productVideo || !productVideoTitle || !productVideoOverlay) return;
        
        productVideo.src = videoSrc;
        productVideoTitle.textContent = productName;
        productVideoOverlay.classList.add('active');
    }

    function goToStep(step) {
        if (currentStep < step && !validateStep(currentStep)) {
            return; // No avanzar si no se valida el paso actual
        }
        
        // Hide all steps
        checkoutSteps.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show requested step if it exists
        if (checkoutSteps[step - 1]) {
            checkoutSteps[step - 1].classList.add('active');
        } else {
            console.error('Paso no encontrado:', step);
            return;
        }
        
        // Update progress fill if exists
        if (progressFill) progressFill.style.width = (step / 4 * 100) + '%';
        
        // Update progress steps if they exist
        if (progressSteps && progressSteps.length > 0) {
            progressSteps.forEach((stepElement, index) => {
                stepElement.classList.remove('active', 'completed');
                
                if (index + 1 === step) {
                    stepElement.classList.add('active');
                } else if (index + 1 < step) {
                    stepElement.classList.add('completed');
                }
            });
        }
        
        // Update current step
        currentStep = step;
        
        // Scroll to top of the section
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
            window.scrollTo({
                top: progressContainer.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    }

    function toggleCardFlip() {
        const creditCard = document.getElementById('credit-card');
        if (creditCard) creditCard.classList.toggle('flipped');
    }

    function formatCardNumber(input) {
        if (!input) return;
        
        let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const regex = /^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})$/g;
        const onlyDigits = value.replace(/[\s-]/g, '');
        
        if (onlyDigits.length <= 16) {
            value = onlyDigits.replace(regex, (regex, $1, $2, $3, $4) => 
                [$1, $2, $3, $4].filter(group => group !== '').join(' ')
            );
            input.value = value;
        }
        
        // Update card display
        updateCardDisplay();
        
        // Update card type
        updateCardType(value.replace(/\s+/g, ''));
    }

    function formatCardExpiry(input) {
        if (!input) return;
        
        let value = input.value.replace(/[^0-9]/g, '');
        
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        
        input.value = value;
        
        // Update card display
        updateCardDisplay();
    }

    function updateCardType(cardNumber) {
        const cardTypeIcon = document.getElementById('card-type-icon');
        const cardTypeDisplay = document.getElementById('card-type-display');
        
        if (!cardTypeIcon || !cardTypeDisplay) return;
        
        let cardType = 'cc-generic';
        let cardTypeName = 'TARJETA';
        
        // Determine card type based on BIN range
        if (/^4/.test(cardNumber)) {
            cardType = 'cc-visa';
            cardTypeName = 'VISA';
        } else if (/^5[1-5]/.test(cardNumber)) {
            cardType = 'cc-mastercard';
            cardTypeName = 'MASTERCARD';
        } else if (/^3[47]/.test(cardNumber)) {
            cardType = 'cc-amex';
            cardTypeName = 'AMEX';
        } else if (/^6(?:011|5)/.test(cardNumber)) {
            cardType = 'cc-discover';
            cardTypeName = 'DISCOVER';
        }
        
        // Update card type icon and name
        cardTypeIcon.innerHTML = `<i class="fab fa-${cardType}"></i>`;
        cardTypeDisplay.textContent = cardTypeName;
    }

    function updateCardDisplay() {
        const cardNumberInput = document.getElementById('card-number-input');
        const cardNameInput = document.getElementById('card-name-input');
        const cardExpiryInput = document.getElementById('card-expiry-input');
        const cardCVVInput = document.getElementById('card-cvv-input');
        const cardNumberDisplay = document.getElementById('card-number-display');
        const cardNameDisplay = document.getElementById('card-name-display');
        const cardExpiryDisplay = document.getElementById('card-expiry-display');
        const cardCVVDisplay = document.getElementById('card-cvv-display');
        const cardNumberOverlay = document.getElementById('card-number-overlay');
        
        // Card Number - with element checks
        if (cardNumberInput && cardNumberDisplay) {
            if (cardNumberInput.value) {
                const lastDigits = cardNumberInput.value.slice(-4);
                const maskedNumber = '•••• •••• •••• ' + lastDigits;
                cardNumberDisplay.textContent = maskedNumber;
                
                // Update overlay if it exists
                if (cardNumberOverlay) {
                    if (cardNumberInput.value.length > 0) {
                        const maskedValue = cardNumberInput.value.replace(/\d(?=\d{4})/g, '•');
                        cardNumberOverlay.textContent = maskedValue;
                        cardNumberOverlay.style.display = 'flex';
                    } else {
                        cardNumberOverlay.style.display = 'none';
                    }
                }
            } else {
                cardNumberDisplay.textContent = '•••• •••• •••• ••••';
                if (cardNumberOverlay) cardNumberOverlay.style.display = 'none';
            }
        }
        
        // Card Name
        if (cardNameInput && cardNameDisplay) {
            cardNameDisplay.textContent = cardNameInput.value.toUpperCase() || 'NOMBRE APELLIDO';
        }
        
        // Card Expiry
        if (cardExpiryInput && cardExpiryDisplay) {
            cardExpiryDisplay.textContent = cardExpiryInput.value || 'MM/AA';
        }
        
        // Card CVV
        if (cardCVVInput && cardCVVDisplay) {
            cardCVVDisplay.textContent = cardCVVInput.value ? '***' : '***';
        }
    }

    function showOTPModal() {
        const otpModal = document.getElementById('otp-modal');
        const otpInputs = document.querySelectorAll('.otp-input');
        
        if (!otpModal) return;
        
        otpModal.classList.add('active');
        if (otpInputs && otpInputs.length > 0) otpInputs[0].focus();
        
        // Start OTP timer
        let timeLeft = 120; // 2 minutes
        const timerElement = document.getElementById('otp-timer');
        
        if (!timerElement) return;
        
        const timer = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                timerElement.textContent = '00:00';
                showNotification('El código ha expirado. Por favor solicita uno nuevo.', 'error');
            }
        }, 1000);
        
        // Store timer reference for cleanup
        otpModal.dataset.timer = timer;
    }

    function hideOTPModal() {
        const otpModal = document.getElementById('otp-modal');
        const otpInputs = document.querySelectorAll('.otp-input');
        
        if (!otpModal) return;
        
        otpModal.classList.remove('active');
        
        // Clear OTP inputs
        if (otpInputs) {
            otpInputs.forEach(input => {
                if (input) input.value = '';
            });
        }
        
        // Clear timer
        if (otpModal.dataset.timer) {
            clearInterval(otpModal.dataset.timer);
        }
    }

    function handleOTPInput() {
        const otpInputs = document.querySelectorAll('.otp-input');
        
        if (!otpInputs || otpInputs.length === 0) return;
        
        const otpValue = Array.from(otpInputs).map(input => input.value || '').join('');
        
        if (otpValue.length === 6) {
            // Validate OTP
            if (otpValue === VALID_OTP) {
                hideOTPModal();
                goToStep(4); // Go to confirmation step
                createConfetti(); // Celebration effect
            } else {
                showNotification('Código de verificación incorrecto. Intenta nuevamente.', 'error');
            }
        }
    }

    function createConfetti() {
        const colors = ['#0056b3', '#ff3a6e', '#00e676', '#ffc107', '#3a86ff'];
        const confettiCount = 200;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Random properties
            const size = Math.random() * 10 + 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const left = Math.random() * 100;
            const delay = Math.random() * 3;
            const duration = Math.random() * 3 + 3;
            
            // Apply styles
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            confetti.style.backgroundColor = color;
            confetti.style.left = `${left}%`;
            confetti.style.animationDuration = `${duration}s`;
            confetti.style.animationDelay = `${delay}s`;
            
            document.body.appendChild(confetti);
            
            // Remove after animation
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.remove();
                }
            }, (duration + delay) * 1000);
        }
    }

    function showNotification(message, type = 'success') {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(notification => {
            notification.remove();
        });
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Set icon based on type
        let icon = 'check-circle';
        if (type === 'error') icon = 'times-circle';
        else if (type === 'warning') icon = 'exclamation-circle';
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${type === 'success' ? 'Éxito!' : type === 'error' ? 'Error' : 'Atención'}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Add close event
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.remove();
            });
        }
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    function validateStep(step) {
        if (step === 1) {
            // Check if cart has items
            if (cart.length === 0) {
                showNotification('Por favor, agrega productos al carrito para continuar.', 'error');
                return false;
            }
            return true;
        } else if (step === 2) {
            // Validate shipping form
            const formFields = {
                'name': 'Nombre completo',
                'email': 'Correo electrónico',
                'phone': 'Número de teléfono',
                'dni': 'Documento de identidad',
                'country': 'País',
                'state': 'Estado/Provincia',
                'city': 'Ciudad',
                'address': 'Dirección',
                'shipping-company': 'Empresa de envío'
            };
            
            // Check all required fields
            let missingFields = [];
            
            for (const [id, label] of Object.entries(formFields)) {
                const field = document.getElementById(id);
                if (!field || !field.value.trim()) {
                    missingFields.push(label);
                    if (field) field.classList.add('is-invalid');
                } else if (field) {
                    field.classList.remove('is-invalid');
                }
            }
            
            if (missingFields.length > 0) {
                showNotification(`Por favor, completa los siguientes campos: ${missingFields.join(', ')}.`, 'error');
                return false;
            }
            
            // Check if agreement is checked for Venezuela
            const country = document.getElementById('country');
            const agreement = document.getElementById('nationalization-agreement');
            
            if (country && (country.value === 've' || country.value === 'co')) {
                if (!agreement || !agreement.checked) {
                    showNotification('Debes aceptar el acuerdo de nacionalización para continuar.', 'error');
                    return false;
                }
            }
            
            return true;
        } else if (step === 3) {
            // Get selected payment method
            const activePaymentMethod = document.querySelector('.payment-methods .payment-method.active');
            if (!activePaymentMethod) {
                showNotification('Por favor, selecciona un método de pago.', 'error');
                return false;
            }
            
            const paymentType = activePaymentMethod.getAttribute('data-payment');
            
            if (paymentType === 'card') {
                // Validate card details
                const cardFields = {
                    'card-name-input': 'Nombre en la tarjeta',
                    'card-number-input': 'Número de tarjeta',
                    'card-expiry-input': 'Fecha de vencimiento',
                    'card-cvv-input': 'Código de seguridad'
                };
                
                let missingCardFields = [];
                
                for (const [id, label] of Object.entries(cardFields)) {
                    const field = document.getElementById(id);
                    if (!field || !field.value.trim()) {
                        missingCardFields.push(label);
                        if (field) field.classList.add('is-invalid');
                    } else {
                        field.classList.remove('is-invalid');
                    }
                }
                
                if (missingCardFields.length > 0) {
                    showNotification(`Por favor, completa los siguientes campos: ${missingCardFields.join(', ')}.`, 'error');
                    return false;
                }
                
                // Validate card details against the valid ones
                const cardNumber = document.getElementById('card-number-input').value.replace(/\s/g, '');
                const cardExpiry = document.getElementById('card-expiry-input').value;
                const cardCVV = document.getElementById('card-cvv-input').value;
                
                if (cardNumber !== VALID_CARD || cardExpiry !== VALID_EXPIRY || cardCVV !== VALID_CVV) {
                    showNotification('Los datos de la tarjeta no son válidos o no coinciden con nuestros registros.', 'error');
                    return false;
                }
                
                return true;
            } else if (paymentType === 'pago-movil') {
                // Validate Pago Móvil fields
                const pagoMovilFields = {
                    'banco-emisor': 'Banco emisor',
                    'numero-referencia': 'Número de referencia',
                    'telefono-pago-movil': 'Teléfono asociado'
                };
                
                let missingPaymentFields = [];
                
                for (const [id, label] of Object.entries(pagoMovilFields)) {
                    const field = document.getElementById(id);
                    if (!field || !field.value.trim()) {
                        missingPaymentFields.push(label);
                        if (field) field.classList.add('is-invalid');
                    } else {
                        field.classList.remove('is-invalid');
                    }
                }
                
                if (missingPaymentFields.length > 0) {
                    showNotification(`Por favor, completa los siguientes campos: ${missingPaymentFields.join(', ')}.`, 'error');
                    return false;
                }
                
                return true;
            }
            
            return true;
        }
        
        return true;
    }

    function applyCoupon() {
        const couponCode = document.getElementById('coupon-code');
        const couponMessage = document.getElementById('coupon-message');
        
        if (!couponCode || !couponMessage) return;
        
        const code = couponCode.value.trim().toUpperCase();
        
        if (code === 'NEW2025') {
            // Apply 10% discount
            discount = subtotal * 0.1;
            couponMessage.textContent = '¡Cupón aplicado! 10% de descuento';
            couponMessage.style.color = 'var(--success)';
            showNotification('Cupón aplicado correctamente. ¡10% de descuento!');
            updateCartSummary();
        } else {
            couponMessage.textContent = 'Cupón inválido o expirado';
            couponMessage.style.color = 'var(--danger)';
            showNotification('El código de cupón no es válido.', 'error');
        }
    }

    function setupEventListeners() {
        // Navegación entre pasos
        const navigationButtons = {
            'go-to-step-2': () => goToStep(2),
            'back-to-step-1': () => goToStep(1),
            'go-to-step-3': () => goToStep(3),
            'back-to-step-2': () => goToStep(2),
            'go-to-step-4': () => {
                if (validateStep(3)) showOTPModal();
            }
        };
        
        for (const [id, action] of Object.entries(navigationButtons)) {
            const button = document.getElementById(id);
            if (button) button.addEventListener('click', action);
        }
        
        // Persistent summary continue button
        const persistentContinueBtn = document.getElementById('persistent-continue');
        if (persistentContinueBtn) {
            persistentContinueBtn.addEventListener('click', () => {
                if (currentStep < 4) {
                    if (validateStep(currentStep)) {
                        if (currentStep === 3) {
                            showOTPModal();
                        } else {
                            goToStep(currentStep + 1);
                        }
                    }
                }
            });
        }
        
        // Credit card form
        const creditCard = document.getElementById('credit-card');
        const cardCVVInput = document.getElementById('card-cvv-input');
        const cardNumberInput = document.getElementById('card-number-input');
        const cardExpiryInput = document.getElementById('card-expiry-input');
        const cardNameInput = document.getElementById('card-name-input');
        
        if (cardCVVInput) {
            cardCVVInput.addEventListener('focus', () => {
                if (creditCard) creditCard.classList.add('flipped');
            });
            
            cardCVVInput.addEventListener('blur', () => {
                if (creditCard) creditCard.classList.remove('flipped');
            });
        }
        
        if (creditCard) creditCard.addEventListener('click', toggleCardFlip);
        
        // Card input formatting
        if (cardNumberInput) cardNumberInput.addEventListener('input', () => formatCardNumber(cardNumberInput));
        if (cardExpiryInput) cardExpiryInput.addEventListener('input', () => formatCardExpiry(cardExpiryInput));
        if (cardNameInput) cardNameInput.addEventListener('input', updateCardDisplay);
        if (cardCVVInput) cardCVVInput.addEventListener('input', updateCardDisplay);
        
        // OTP inputs
        const otpInputs = document.querySelectorAll('.otp-input');
        if (otpInputs && otpInputs.length > 0) {
            otpInputs.forEach((input, index) => {
                if (!input) return;
                
                input.addEventListener('input', () => {
                    if (input.value.length === 1) {
                        if (index < otpInputs.length - 1 && otpInputs[index + 1]) {
                            otpInputs[index + 1].focus();
                        } else {
                            handleOTPInput();
                        }
                    }
                });
                
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && input.value === '' && index > 0 && otpInputs[index - 1]) {
                        otpInputs[index - 1].focus();
                    }
                });
            });
        }
        
        // OTP modal
        const verifyOtpBtn = document.getElementById('verify-otp');
        const closeOtpBtn = document.getElementById('close-otp');
        const resendOtpBtn = document.getElementById('resend-otp');
        
        if (verifyOtpBtn) verifyOtpBtn.addEventListener('click', handleOTPInput);
        if (closeOtpBtn) closeOtpBtn.addEventListener('click', hideOTPModal);
        if (resendOtpBtn) {
            resendOtpBtn.addEventListener('click', () => {
                hideOTPModal();
                setTimeout(showOTPModal, 500);
                showNotification('Se ha enviado un nuevo código de verificación.');
            });
        }
        
        // Payment method selection
        const paymentMethods = document.querySelectorAll('.payment-methods .payment-method');
        if (paymentMethods && paymentMethods.length > 0) {
            paymentMethods.forEach(method => {
                method.addEventListener('click', () => {
                    // Remove active class from all methods in the same group
                    const parentContainer = method.closest('.payment-methods');
                    if (parentContainer) {
                        parentContainer.querySelectorAll('.payment-method').forEach(m => {
                            m.classList.remove('active');
                        });
                    }
                    
                    // Add active class to clicked method
                    method.classList.add('active');
                    
                    // Handle payment form display or shipping method selection
                    if (parentContainer && !parentContainer.classList.contains('shipping-methods')) {
                        const paymentType = method.getAttribute('data-payment');
                        if (paymentType) {
                            const formContainers = document.querySelectorAll('.payment-method-form');
                            formContainers.forEach(form => form.classList.remove('active'));
                            
                            const activeForm = document.getElementById(`${paymentType}-payment-form`);
                            if (activeForm) activeForm.classList.add('active');
                        }
                    } else {
                        // Handle shipping method selection
                        const shippingCost = parseFloat(method.getAttribute('data-cost'));
                        if (!isNaN(shippingCost)) {
                            shipping = shippingCost;
                            updateCartSummary();
                            updateDeliveryDates();
                        }
                    }
                });
            });
        }
        
        // Apply coupon button
        const applyCouponBtn = document.getElementById('apply-coupon');
        if (applyCouponBtn) applyCouponBtn.addEventListener('click', applyCoupon);
        
        // Video overlay close
        const closeVideoBtn = document.getElementById('close-video');
        const productVideoOverlay = document.getElementById('product-video-overlay');
        const productVideo = document.getElementById('product-video');
        
        if (closeVideoBtn && productVideoOverlay && productVideo) {
            closeVideoBtn.addEventListener('click', () => {
                productVideoOverlay.classList.remove('active');
                productVideo.pause();
            });
        }
        
        // WhatsApp contact
        const contactWhatsAppBtn = document.getElementById('contact-whatsapp');
        if (contactWhatsAppBtn) {
            contactWhatsAppBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const orderNumber = document.getElementById('order-number');
                const orderNumberText = orderNumber ? orderNumber.textContent : 'nuevo pedido';
                const message = `Hola LatinPhone, acabo de realizar el pedido ${orderNumberText}. Quiero confirmar mi compra.`;
                window.open(`https://wa.me/18133584564?text=${encodeURIComponent(message)}`, '_blank');
            });
        }
        
        // Support link
        const supportLink = document.getElementById('support-link');
        if (supportLink) {
            supportLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.open(`https://wa.me/18133584564?text=${encodeURIComponent('Hola LatinPhone, necesito ayuda con mi compra.')}`, '_blank');
            });
        }
        
        // Complete order button (in confirmation step)
        const completeOrderBtn = document.getElementById('complete-order');
        if (completeOrderBtn) {
            completeOrderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Clear the cart from localStorage
                localStorage.removeItem('latinphone_cart');
                localStorage.removeItem('latinphone_cart_totals');
                showNotification('¡Gracias por tu compra!');
                setTimeout(() => {
                    window.location.href = 'latinphonestorehome.html';
                }, 1500);
            });
        }
    }

    // Inicializar
    function init() {
        // Cargar carrito
        cart = loadCartFromStorage();
        
        // Renderizar productos y resúmenes
        renderProductPreviews();
        renderSummaryProducts();
        renderPersistentSummary();
        
        // Actualizar cálculos
        updateCartSummary();
        updateDeliveryDates();
        
        // Configurar listeners
        setupEventListeners();
        
        // Ocultar preloader
        if (preloader) {
            setTimeout(() => {
                preloader.classList.remove('active');
            }, 2000);
        }
    }
    
    // Iniciar
    init();
});
