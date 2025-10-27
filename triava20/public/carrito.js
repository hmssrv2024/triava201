document.addEventListener('DOMContentLoaded', function() {
    // Constantes globales
    const DEFAULT_VENEZUELA_RATE = 225;
    let exchangeRate = typeof window.getStoredExchangeRate === 'function'
        ? window.getStoredExchangeRate()
        : null;
    const TAX_RATE = 0.16; // IVA 16%
    
    // Elementos DOM
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartEmptyEl = document.querySelector('.cart-empty');
    const cartContentEl = document.querySelector('.cart-content');
    const cartCount = document.querySelector('.cart-count');
    const proceedCheckoutBtn = document.getElementById('proceed-checkout');
    
    // Variables de estado
    let cart = [];
    let orderTotal = 0;
    let taxAmount = 0;

    function getCurrentExchangeRate() {
        return exchangeRate ?? DEFAULT_VENEZUELA_RATE;
    }

    function applyExchangeRate(newRate) {
        if (typeof newRate === 'number' && isFinite(newRate) && newRate > 0) {
            exchangeRate = newRate;
        } else if (exchangeRate == null) {
            exchangeRate = DEFAULT_VENEZUELA_RATE;
        }

        updateAllSummaries();
    }

    applyExchangeRate(exchangeRate ?? DEFAULT_VENEZUELA_RATE);

    if (typeof loadExchangeRate === 'function') {
        loadExchangeRate()
            .then(applyExchangeRate)
            .catch(err => {
                console.warn('No se pudo cargar la tasa de cambio para el carrito:', err);
                applyExchangeRate(exchangeRate ?? DEFAULT_VENEZUELA_RATE);
            });
    } else {
        console.warn('loadExchangeRate no está disponible en la vista de carrito.');
    }

    // Cargar carrito desde localStorage o crear uno de ejemplo
    function loadCart() {
        const savedCart = localStorage.getItem('latinphone_cart');
        
        try {
            if (savedCart && JSON.parse(savedCart).length > 0) {
                cart = JSON.parse(savedCart);
                // Validar los items del carrito
                cart = cart.map(item => ({
                    ...item,
                    price: typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0,
                    quantity: typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0 ? item.quantity : 1
                }));
            } else {
                // Carrito de ejemplo
                cart = getDefaultCart();
                // Guardar carrito de ejemplo en localStorage
                localStorage.setItem('latinphone_cart', JSON.stringify(cart));
            }
        } catch (e) {
            console.error("Error al cargar el carrito:", e);
            cart = getDefaultCart();
            localStorage.setItem('latinphone_cart', JSON.stringify(cart));
        }
        
        updateCartDisplay();
    }
    
    // Obtener carrito de ejemplo
    function getDefaultCart() {
        return [
            {
                id: 's25ultra',
                name: 'Samsung Galaxy S25 Ultra',
                price: 1299.99,
                quantity: 1,
                image: 'https://th.bing.com/th?id=OPEC.Gy18E1jCjibBhg474C474&w=592&h=550&o=5&pid=21.1',
                color: 'Negro'
            }
        ];
    }
    
    // Agregar al carrito - Nueva función robusta
    function addToCart(product) {
        if (!product || !product.id) {
            console.error("Producto inválido", product);
            return false;
        }
        
        // Validar precio
        const price = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0;
        
        // Buscar si ya existe en el carrito
        const existingItemIndex = cart.findIndex(item => item.id === product.id);
        
        if (existingItemIndex !== -1) {
            // Si ya existe, aumentar la cantidad
            cart[existingItemIndex].quantity = (parseInt(cart[existingItemIndex].quantity) || 0) + 1;
        } else {
            // Si no existe, agregar al carrito
            cart.push({
                id: product.id,
                name: product.name || 'Producto',
                price: price,
                quantity: 1,
                image: product.image || 'img/product-placeholder.png',
                color: product.color || 'Estándar'
            });
        }
        
        // Guardar carrito en localStorage
        localStorage.setItem('latinphone_cart', JSON.stringify(cart));
        
        // Actualizar visualización
        updateCartDisplay();
        return true;
    }
    
    // Actualizar visualización del carrito
    function updateCartDisplay() {
        // Limpiar contenedor de items
        if (!cartItemsContainer) {
            console.error("Elemento .cart-items no encontrado");
            return;
        }
        
        cartItemsContainer.innerHTML = '';
        
        // Verificar si el carrito está vacío
        if (cart.length === 0) {
            if (cartEmptyEl) cartEmptyEl.style.display = 'block';
            if (cartContentEl) cartContentEl.style.display = 'none';
            if (cartCount) cartCount.textContent = '0';
            if (proceedCheckoutBtn) proceedCheckoutBtn.style.display = 'none';
            return;
        }
        
        // Ocultar mensaje de carrito vacío
        if (cartEmptyEl) cartEmptyEl.style.display = 'none';
        if (cartContentEl) cartContentEl.style.display = 'block';
        if (proceedCheckoutBtn) proceedCheckoutBtn.style.display = 'inline-flex';
        
        // Calcular subtotal
        let subtotal = 0;
        let totalItems = 0;
        
        // Generar HTML para cada producto
        cart.forEach(item => {
            // Asegurar precio y cantidad válidos
            const itemPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
            const itemQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0 ? item.quantity : 1;
            
            const itemTotal = itemPrice * itemQuantity;
            subtotal += itemTotal;
            totalItems += itemQuantity;
            
            const cartItemHTML = `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-image">
                        <img src="${item.image || 'img/product-placeholder.png'}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <h3 class="cart-item-name">${item.name}</h3>
                        <p class="cart-item-variant">Color: ${item.color || 'Negro'}</p>
                        <span class="cart-item-price">$${itemPrice.toFixed(2)} USD</span>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <input type="text" class="quantity-input" value="${itemQuantity}" readonly>
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                    <i class="fas fa-trash cart-item-remove" data-id="${item.id}"></i>
                </div>
            `;
            
            cartItemsContainer.innerHTML += cartItemHTML;
        });
        
        // Actualizar subtotal y contador
        const subtotalEl = document.getElementById('cart-subtotal');
        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (cartCount) cartCount.textContent = totalItems.toString();
        
        // Actualizar total global
        orderTotal = subtotal;
        
        // Actualizar todos los elementos del resumen
        updateAllSummaries();
        
        // Agregar event listeners a los botones de cantidad y eliminar
        addCartItemsListeners();
    }
    
    // Agregar listeners a botones del carrito
    function addCartItemsListeners() {
        // Botones de incremento
        document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                updateQuantity(itemId, 1);
            });
        });
        
        // Botones de decremento
        document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                updateQuantity(itemId, -1);
            });
        });
        
        // Botones de eliminar
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                removeItem(itemId);
            });
        });
    }
    
    // Actualizar cantidad de un producto
    function updateQuantity(itemId, change) {
        const itemIndex = cart.findIndex(item => item.id === itemId);
        
        if (itemIndex !== -1) {
            // Asegurar que la cantidad actual sea un número válido
            const currentQuantity = parseInt(cart[itemIndex].quantity) || 0;
            const newQuantity = currentQuantity + change;
            
            if (newQuantity <= 0) {
                // Si la cantidad llega a 0, eliminar el producto
                removeItem(itemId);
            } else {
                // Actualizar cantidad
                cart[itemIndex].quantity = newQuantity;
                localStorage.setItem('latinphone_cart', JSON.stringify(cart));
                updateCartDisplay();
            }
        }
    }
    
    // Eliminar un producto
    function removeItem(itemId) {
        cart = cart.filter(item => item.id !== itemId);
        localStorage.setItem('latinphone_cart', JSON.stringify(cart));
        updateCartDisplay();
    }
    
    // Actualizar todos los resúmenes de precio
    function updateAllSummaries() {
        const summarySubtotal = document.getElementById('cart-subtotal');
        const summaryTax = document.getElementById('cart-tax');
        const summaryShipping = document.getElementById('cart-shipping');
        const summaryTotal = document.getElementById('cart-total');
        const bolivarTotal = document.getElementById('cart-total-bs');
        const nationalizationBs = document.getElementById('cart-nationalization-bs');
        
        // Verificar que orderTotal sea un número válido
        if (isNaN(orderTotal) || orderTotal < 0) {
            console.error("orderTotal inválido:", orderTotal);
            orderTotal = 0;
        }
        
        // Calcular valores
        taxAmount = orderTotal * TAX_RATE;
        const shipping = 70; // Costo fijo de envío
        const total = orderTotal + taxAmount + shipping;

        // Actualizar elementos si existen
        if (summarySubtotal) summarySubtotal.textContent = `$${orderTotal.toFixed(2)}`;
        if (summaryTax) summaryTax.textContent = `$${taxAmount.toFixed(2)}`;
        if (summaryTotal) summaryTotal.textContent = `$${total.toFixed(2)}`;

        // Actualizar conversión a bolívares
        if (bolivarTotal) bolivarTotal.textContent = formatBsAmount(total);
        if (nationalizationBs) nationalizationBs.textContent = formatBsAmount(30);
    }
    
    // Formatear montos en bolivares
    function formatBsAmount(amountInUsd) {
        let value = amountInUsd;
        if (isNaN(value) || value < 0) {
            console.error("Monto inválido para formateo en bolívares:", amountInUsd);
            value = 0;
        }
        const converted = value * getCurrentExchangeRate();
        return new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(converted) + " Bs";
    }
    
    // Navegar a checkout - SOLUCIÓN MEJORADA
    function goToCheckout(e) {
        e.preventDefault();
        
        if (cart.length === 0) {
            alert('Tu carrito está vacío. Agrega productos antes de continuar.');
            return;
        }
        
        // Verificar datos del carrito antes de proceder
        const validCart = cart.every(item => 
            typeof item.price === 'number' && !isNaN(item.price) && 
            typeof item.quantity === 'number' && !isNaN(item.quantity) && 
            item.quantity > 0
        );
        
        if (!validCart) {
            console.error("Datos inválidos en el carrito");
            alert('Ocurrió un error con los datos del carrito. Por favor, inténtalo de nuevo.');
            return;
        }
        
        // Calcular totales antes de guardar
        const totals = {
            subtotal: orderTotal,
            tax: taxAmount,
            shipping: 70, // Costo predeterminado
            total: orderTotal + taxAmount + 70
        };
        
        try {
            // Guardar carrito y totales en localStorage
            localStorage.setItem('latinphone_cart', JSON.stringify(cart));
            localStorage.setItem('latinphone_cart_totals', JSON.stringify(totals));
            
            console.log('Carrito guardado:', JSON.stringify(cart));
            console.log('Totales guardados:', JSON.stringify(totals));
            
            // Redirección con un método más robusto
            window.location.href = 'pago.html';
        } catch (err) {
            console.error("Error al procesar el checkout:", err);
            alert("Redirigiendo a la página de pago...");
            window.location.href = 'pago.html';
        }
    }
    
    // Función para manejar eventos de "Agregar al carrito" desde la página de productos
    function handleProductPageAddToCart() {
        // Seleccionar todos los botones "Agregar al carrito" de la página de productos
        const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
        
        if (addToCartButtons.length > 0) {
            addToCartButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Obtener datos del producto desde los atributos data-*
                    const productId = this.getAttribute('data-id');
                    const productName = this.getAttribute('data-name');
                    const productPrice = parseFloat(this.getAttribute('data-price'));
                    const productImage = this.getAttribute('data-image');
                    const productColor = this.getAttribute('data-color') || 'Negro';
                    
                    if (!productId || !productName || isNaN(productPrice)) {
                        console.error('Datos del producto incompletos');
                        return;
                    }
                    
                    // Crear objeto del producto
                    const product = {
                        id: productId,
                        name: productName,
                        price: productPrice,
                        image: productImage,
                        color: productColor
                    };
                    
                    // Agregar al carrito
                    if (addToCart(product)) {
                        // Mostrar mensaje de éxito
                        alert(`${productName} agregado al carrito.`);
                    }
                });
            });
        }
    }
    
    // Agregar event listener al botón de proceder al pago
    if (proceedCheckoutBtn) {
        proceedCheckoutBtn.addEventListener('click', goToCheckout);
    }
    
    // Inicializar carrito
    loadCart();
    
    // Verificar si estamos en la página de productos y configurar botones
    handleProductPageAddToCart();
});
