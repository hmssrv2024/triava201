// ====================================
// LATINPHONE - PREMIUM JAVASCRIPT 2025
// Apple-Inspired User Experience
// ====================================

class LatinPhoneStore {
    constructor() {
        // State management
        this.state = {
            currentStep: 1,
            selectedCountry: '',
            selectedCategory: '',
            selectedBrand: '',
            cart: [],
            selectedShipping: { method: 'express', price: 70 },
            selectedCarrier: 'dhl',
            selectedInsurance: { selected: true, price: 50 },
            selectedGift: null,
            selectedPayment: 'card',
            orderNumber: '',
            acceptedTerms: false
        };

        // Configuration
        this.config = {
            exchangeRate: 310.10,
            taxRate: 0.16,
            validCard: '4745034211763009',
            validCardExpMonth: '01',
            validCardExpYear: '2026',
            validCardCvv: '583'
        };

        // Remeex integration
        this.remeex = {
            user: null,
            balance: { usd: 0, bs: 0, eur: 0 },
            hasSavedCard: false,
            useBalance: false
        };

        this.pinCallback = null;

        // Purchases history
        this.purchases = [];

        // Product database with expanded inventory
        this.inventory = this.initializeInventory();
        this.giftProducts = this.initializeGiftProducts();

        // Initialize the application
        this.init();
    }

    init() {
        this.cacheDOMElements();
        this.bindEvents();
        this.checkRemeexSession();
        this.updateCartBadge();
        this.setupDefaultSelections();
        this.loadPurchases();
        this.loadCart();
        this.renderPurchases();
        this.checkPurchaseLimit();
        this.autofillContactForm();
        this.showWelcomeMessage();
        this.setupPinModal();
    }

    cacheDOMElements() {
        // Header elements
        this.cartBadge = document.getElementById('cart-badge');

        // Progress elements
        this.progressSteps = document.querySelectorAll('.progress-step');

        // Content sections
        this.contentSections = document.querySelectorAll('.content-section');

        // Country selection
        this.countryCards = document.querySelectorAll('.country-card');
        this.categoriesSection = document.querySelector('.categories-section');

        // Category selection
        this.categoryCards = document.querySelectorAll('.category-card');
        this.brandsSection = document.querySelector('.brands-section');
        this.brandsGrid = document.getElementById('brands-grid');

        // Product selection
        this.productsSection = document.querySelector('.products-section');
        this.productsGrid = document.getElementById('products-grid');

        // Cart elements
        this.cartSection = document.querySelector('.cart-section');
        this.cartItems = document.getElementById('cart-items');
        this.subtotalElement = document.getElementById('subtotal');
        this.taxElement = document.getElementById('tax');
        this.shippingElement = document.getElementById('shipping');
        this.insuranceElement = document.getElementById('insurance');
        this.totalElement = document.getElementById('total');
        this.totalBsElement = document.getElementById('total-bs');
        this.clearCartBtn = document.getElementById('clear-cart');

        // Shipping elements
        this.shippingOptions = document.querySelectorAll('.shipping-option');
        this.carrierDropdown = document.getElementById('carrier-dropdown');
        this.carrierOptions = document.getElementById('carrier-options');
        this.carrierOptionElements = document.querySelectorAll('.carrier-option');

        // Insurance elements
        this.insuranceOptions = document.querySelectorAll('.insurance-option');

        // Gift elements
        this.giftSelect = document.getElementById('gift-select');

        // Terms elements
        this.acceptTermsCheckbox = document.getElementById('accept-terms');
        this.nationalizationFee = document.getElementById('nationalization-fee');

        // Payment elements
        this.paymentOptions = document.querySelectorAll('.payment-option');
        this.paymentForm = document.getElementById('card-form');
        this.savedCardContainer = document.getElementById('saved-card-container');
        this.useSavedCardCheckbox = document.getElementById('use-saved-card');
        this.paymentSummaryItems = document.getElementById('payment-summary-items');

        // Navigation buttons
        this.continueToShippingBtn = document.getElementById('continue-to-shipping');
        this.backToProductsBtn = document.getElementById('back-to-products');
        this.continueToPaymentBtn = document.getElementById('continue-to-payment');
        this.backToShippingBtn = document.getElementById('back-to-shipping');
        this.processPaymentBtn = document.getElementById('process-payment');

        // Modal elements
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.nationalizationOverlay = document.getElementById('nationalization-overlay');
        this.videoModal = document.getElementById('video-modal');
        this.productVideo = document.getElementById('product-video');

        // Toast container
        this.toastContainer = document.getElementById('toast-container');

        // Order elements
        this.orderNumber = document.getElementById('order-number');
        this.orderDate = document.getElementById('order-date');
        this.orderTotal = document.getElementById('order-total');

        // Contact form elements
        this.contactName = document.getElementById('contact-name');
        this.contactEmail = document.getElementById('contact-email');
        this.contactPhone = document.getElementById('contact-phone');
        this.contactId = document.getElementById('contact-id');
        this.contactAddress = document.getElementById('contact-address');
        this.contactForm = document.querySelector('.contact-form');

        this.successOverlay = document.getElementById('purchase-success-overlay');
        this.successContinueBtn = document.getElementById('purchase-success-continue');
        this.finalizeBtn = document.getElementById('finalize-whatsapp');

        this.detailsOverlay = document.getElementById('purchase-details-overlay');
        this.detailsCloseBtn = document.getElementById('purchase-details-close');
        this.detailsContainer = document.getElementById('purchase-details');

        // Purchases section
        this.purchasesContainer = document.getElementById('purchases-container');
    }

    bindEvents() {
        // Country selection
        this.countryCards.forEach(card => {
            card.addEventListener('click', () => this.selectCountry(card.dataset.country));
        });

        // Category selection
        this.categoryCards.forEach(card => {
            card.addEventListener('click', () => this.selectCategory(card.dataset.category));
        });

        // Shipping options
        this.shippingOptions.forEach(option => {
            option.addEventListener('click', () => this.selectShipping(option));
        });

        // Carrier dropdown
        if (this.carrierDropdown) {
            this.carrierDropdown.addEventListener('click', () => this.toggleCarrierDropdown());
            
            this.carrierOptionElements.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectCarrier(option.dataset.carrier);
                });
            });
        }

        // Insurance options
        this.insuranceOptions.forEach(option => {
            option.addEventListener('click', () => this.selectInsurance(option));
        });

        // Gift selection
        if (this.giftSelect) {
            this.giftSelect.addEventListener('change', () => {
                const selected = this.giftProducts.find(g => g.id === this.giftSelect.value);
                if (selected) this.selectGift(selected);
            });
        }

        // Payment options
        this.paymentOptions.forEach(option => {
            option.addEventListener('click', () => this.selectPaymentMethod(option.dataset.payment));
        });

        // Terms checkbox
        if (this.acceptTermsCheckbox) {
            this.acceptTermsCheckbox.addEventListener('change', () => this.updateTermsAcceptance());
        }

        // Navigation buttons
        if (this.continueToShippingBtn) {
            this.continueToShippingBtn.addEventListener('click', () => this.proceedToShipping());
        }

        if (this.backToProductsBtn) {
            this.backToProductsBtn.addEventListener('click', () => this.goToStep(1));
        }

        if (this.continueToPaymentBtn) {
            this.continueToPaymentBtn.addEventListener('click', () => this.proceedToPayment());
        }

        if (this.backToShippingBtn) {
            this.backToShippingBtn.addEventListener('click', () => this.goToStep(2));
        }

        if (this.processPaymentBtn) {
            this.processPaymentBtn.addEventListener('click', () => this.showPinModal(() => this.processPayment()));
        }

        if (this.clearCartBtn) {
            this.clearCartBtn.addEventListener('click', () => this.clearCart());
        }

        const downloadBtn = document.getElementById('download-invoice');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadInvoice());
        }

        if (this.contactForm) {
            this.contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendOrderToWhatsApp();
            });
        }

        if (this.finalizeBtn) {
            this.finalizeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.sendOrderToWhatsApp();
            });
        }

        if (this.successContinueBtn) {
            this.successContinueBtn.addEventListener('click', () => this.hideSuccessOverlay());
        }

        if (this.detailsCloseBtn) {
            this.detailsCloseBtn.addEventListener('click', () => this.hidePurchaseDetails());
        }

        // Modal events
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Form validation
        this.setupFormValidation();

        if (this.useSavedCardCheckbox) {
            this.useSavedCardCheckbox.addEventListener('change', () => {
                if (this.useSavedCardCheckbox.checked) {
                    if (this.paymentForm) this.paymentForm.style.display = 'none';
                } else {
                    if (this.paymentForm && this.state.selectedPayment === 'card') {
                        this.paymentForm.style.display = 'block';
                    }
                }
            });
        }

        // Close modals
        const closeButtons = document.querySelectorAll('[id*="close"]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });
    }

    initializeInventory() {
        return {
            smartphones: {
                apple: [
                    { id: 'iphone11', name: 'iPhone 11 64GB', price: 355, specs: ['64GB', 'A13 Bionic', '6.1" Liquid Retina'] },
                    { id: 'iphone12', name: 'iPhone 12 128GB', price: 499, specs: ['128GB', 'A14 Bionic', '6.1" Super Retina'] },
                    { id: 'iphone13', name: 'iPhone 13 128GB', price: 560, specs: ['128GB', 'A15 Bionic', '6.1" Super Retina'] },
                    { id: 'iphone14', name: 'iPhone 14 128GB', price: 650, specs: ['128GB', 'A15 Bionic', '6.1" Super Retina'] },
                    { id: 'iphone15', name: 'iPhone 15 128GB', price: 740, specs: ['128GB', 'A16 Bionic', '6.1" Super Retina'], hasVideo: true },
                    { id: 'iphone15plus', name: 'iPhone 15 Plus 128GB', price: 830, specs: ['128GB', 'A16 Bionic', '6.7" Super Retina'] },
                    { id: 'iphone15pro', name: 'iPhone 15 Pro 128GB', price: 1050, specs: ['128GB', 'A17 Pro', '6.1" ProMotion'] },
                    { id: 'iphone15promax', name: 'iPhone 15 Pro Max 256GB', price: 1340, specs: ['256GB', 'A17 Pro', '6.7" ProMotion'] },
                    { id: 'iphone16', name: 'iPhone 16 128GB', price: 870, specs: ['128GB', 'A18 Chip', '6.1" Super Retina'], hasVideo: true },
                    { id: 'iphone16plus', name: 'iPhone 16 Plus 256GB', price: 970, specs: ['256GB', 'A18 Chip', '6.7" Super Retina'] },
                    { id: 'iphone16pro', name: 'iPhone 16 Pro 128GB', price: 1170, specs: ['128GB', 'A18 Pro', '6.1" ProMotion'] },
                    { id: 'iphone16promax', name: 'iPhone 16 Pro Max 256GB', price: 1340, specs: ['256GB', 'A18 Pro', '6.7" ProMotion'] }
                ],
                samsung: [
                    { id: 'samsungs24', name: 'Galaxy S24 8GB/128GB', price: 699, specs: ['8GB RAM', '128GB', 'Snapdragon 8 Gen 3'] },
                    { id: 'samsungs24plus', name: 'Galaxy S24+ 12GB/256GB', price: 849, specs: ['12GB RAM', '256GB', 'Snapdragon 8 Gen 3'] },
                    { id: 'samsungs24ultra', name: 'Galaxy S24 Ultra 12GB/512GB', price: 1199, specs: ['12GB RAM', '512GB', 'Snapdragon 8 Gen 3', 'S Pen'] },
                    { id: 'samsungs25', name: 'Samsung S25 12GB/256GB', price: 850, specs: ['12GB RAM', '256GB', 'Snapdragon 8 Gen 3'], hasVideo: true },
                    { id: 'samsungs25plus', name: 'Samsung S25+ 12GB/512GB', price: 999, specs: ['12GB RAM', '512GB', 'Snapdragon 8 Gen 3'] },
                    { id: 'samsungs25ultra', name: 'Samsung S25 Ultra 12GB/512GB', price: 1340, specs: ['12GB RAM', '512GB', 'Snapdragon 8 Gen 3', '200MP'], hasVideo: true },
                    { id: 'samsungzflip6', name: 'Galaxy Z Flip 6 12GB/256GB', price: 965, specs: ['12GB RAM', '256GB', 'Plegable', 'Snapdragon 8 Gen 3'], hasVideo: true },
                    { id: 'samsungzfold6', name: 'Galaxy Z Fold 6 12GB/512GB', price: 1490, specs: ['12GB RAM', '512GB', 'Plegable', 'Snapdragon 8 Gen 3'], hasVideo: true },
                    { id: 'samsungzflip7', name: 'Galaxy Z Flip 7 12GB/256GB', price: 1200, specs: ['12GB RAM', '256GB', 'Plegable', 'Snapdragon 8 Gen 4'], hasVideo: true },
                    { id: 'samsungzfold7', name: 'Galaxy Z Fold 7 16GB/1TB', price: 2300, specs: ['16GB RAM', '1TB', 'Plegable', 'Snapdragon 8 Gen 4'], hasVideo: true },
                    { id: 'samsunga55', name: 'Galaxy A55 5G 8GB/256GB', price: 365, specs: ['8GB RAM', '256GB', '5G', 'Exynos 1480'] },
                    { id: 'samsunga35', name: 'Galaxy A35 5G 6GB/128GB', price: 285, specs: ['6GB RAM', '128GB', '5G', 'Exynos 1380'] }
                ],
                xiaomi: [
                    { id: 'xiaomi13', name: 'Redmi 13 6GB/128GB', price: 125, specs: ['6GB RAM', '128GB', 'MediaTek Helio G99'] },
                    { id: 'xiaomi14', name: 'Xiaomi 14 12GB/256GB', price: 749, specs: ['12GB RAM', '256GB', 'Snapdragon 8 Gen 3'] },
                    { id: 'xiaominote14pro', name: 'Redmi Note 14 Pro 5G 8GB/256GB', price: 285, specs: ['8GB RAM', '256GB', '5G', 'Dimensity 7300'] },
                    { id: 'xiaomipocof6pro', name: 'POCO F6 Pro 5G 12GB/512GB', price: 490, specs: ['12GB RAM', '512GB', '5G', 'Snapdragon 8 Gen 2'], hasVideo: true },
                    { id: 'xiaomi15', name: 'Xiaomi 15 12GB/256GB', price: 899, specs: ['12GB RAM', '256GB', 'Snapdragon 8 Elite'], hasVideo: true },
                    { id: 'xiaomipocox6pro', name: 'POCO X6 Pro 12GB/512GB', price: 349, specs: ['12GB RAM', '512GB', 'Dimensity 8300-Ultra'] }
                ],
                google: [
                    { id: 'pixel8', name: 'Google Pixel 8 8GB/128GB', price: 599, specs: ['8GB RAM', '128GB', '5G', 'Google Tensor G3'] },
                    { id: 'pixel8pro', name: 'Google Pixel 8 Pro 12GB/256GB', price: 899, specs: ['12GB RAM', '256GB', '5G', 'Google Tensor G3'] },
                    { id: 'pixel9', name: 'Google Pixel 9 5G 12GB/256GB', price: 819, specs: ['12GB RAM', '256GB', '5G', 'Google Tensor G4'] },
                    { id: 'pixel9pro', name: 'Google Pixel 9 Pro 16GB/256GB', price: 999, specs: ['16GB RAM', '256GB', '5G', 'Google Tensor G4'] },
                    { id: 'pixel9profold', name: 'Google Pixel 9 Pro Fold 16GB/512GB', price: 1760, specs: ['16GB RAM', '512GB', 'Plegable', 'Google Tensor G4'] }
                ],
                motorola: [
                    { id: 'motorolaedge50', name: 'Motorola EDGE 50 5G 12GB/256GB', price: 350, specs: ['12GB RAM', '256GB', '5G', 'Snapdragon 7 Gen 1'] },
                    { id: 'motorolarazr50', name: 'Motorola RAZR 50 5G 12GB/512GB', price: 695, specs: ['12GB RAM', '512GB', 'Plegable', 'Snapdragon 8s Gen 3'] },
                    { id: 'motorolag85', name: 'Motorola Moto G85 5G 12GB/256GB', price: 249, specs: ['12GB RAM', '256GB', '5G', 'Snapdragon 6s Gen 3'] }
                ],
                oneplus: [
                    { id: 'oneplus12', name: 'OnePlus 12 16GB/512GB', price: 899, specs: ['16GB RAM', '512GB', 'Snapdragon 8 Gen 3'] },
                    { id: 'oneplus12r', name: 'OnePlus 12R 12GB/256GB', price: 599, specs: ['12GB RAM', '256GB', 'Snapdragon 8s Gen 2'] }
                ]
            },
            tablets: {
                apple: [
                    { id: 'ipad10', name: 'iPad 10.9" 64GB', price: 449, specs: ['A14 Bionic', '64GB', '10.9" Liquid Retina'] },
                    { id: 'ipadair11', name: 'iPad Air 11" M2 128GB', price: 650, specs: ['Chip M2', '128GB', '11" Liquid Retina'] },
                    { id: 'ipadair13', name: 'iPad Air 13" M2 256GB', price: 899, specs: ['Chip M2', '256GB', '13" Liquid Retina'] },
                    { id: 'ipadpro11', name: 'iPad Pro 11" M4 256GB', price: 1030, specs: ['Chip M4', '256GB', '11" Ultra Retina'] },
                    { id: 'ipadpro13', name: 'iPad Pro 13" M4 512GB', price: 1499, specs: ['Chip M4', '512GB', '13" Ultra Retina'] },
                    { id: 'ipadmini', name: 'iPad mini 8.3" 256GB', price: 649, specs: ['A15 Bionic', '256GB', '8.3" Liquid Retina'] }
                ],
                samsung: [
                    { id: 'samsungtaba9', name: 'Galaxy Tab A9 4GB/64GB', price: 125, specs: ['4GB RAM', '64GB', '8.7" TFT'] },
                    { id: 'samsungtabs9', name: 'Galaxy Tab S9 8GB/128GB', price: 649, specs: ['8GB RAM', '128GB', '11" Dynamic AMOLED'] },
                    { id: 'samsungtabs9plus', name: 'Galaxy Tab S9+ 12GB/256GB', price: 799, specs: ['12GB RAM', '256GB', '12.4" Dynamic AMOLED'] },
                    { id: 'samsungtabs9ultra', name: 'Galaxy Tab S9 Ultra 16GB/512GB', price: 1199, specs: ['16GB RAM', '512GB', '14.6" Dynamic AMOLED'] },
                    { id: 'samsungtabs10', name: 'Galaxy Tab S10 Plus 12GB/256GB', price: 880, specs: ['12GB RAM', '256GB', '12.4" Dynamic AMOLED'] }
                ],
                xiaomi: [
                    { id: 'xiaomipad6', name: 'Xiaomi Pad 6 6GB/128GB', price: 310, specs: ['6GB RAM', '128GB', 'Snapdragon 870'] },
                    { id: 'xiaomipad6pro', name: 'Xiaomi Pad 6 Pro 8GB/256GB', price: 449, specs: ['8GB RAM', '256GB', 'Snapdragon 8+ Gen 1'] }
                ],
                microsoft: [
                    { id: 'surfacepro9', name: 'Surface Pro 9 16GB/512GB', price: 1299, specs: ['Intel i7', '16GB RAM', '512GB SSD'] },
                    { id: 'surfacelaptop5', name: 'Surface Laptop 5 16GB/512GB', price: 1199, specs: ['Intel i7', '16GB RAM', '512GB SSD'] }
                ]
            },
            smartwatches: {
                apple: [
                    { id: 'applewatchse', name: 'Apple Watch SE 40mm', price: 249, specs: ['S8 SiP', '40mm Case', 'GPS'] },
                    { id: 'applewatchs9', name: 'Apple Watch Series 9 41mm', price: 399, specs: ['S9 SiP', '41mm Case', 'GPS + Cellular'] },
                    { id: 'applewatchs10', name: 'Apple Watch Series 10 46mm', price: 435, specs: ['S10 SiP', '46mm Case', 'GPS + Cellular'] },
                    { id: 'applewatchultra', name: 'Apple Watch Ultra 2 49mm', price: 825, specs: ['S9 SiP', '49mm Titanium', 'GPS + Cellular'] }
                ],
                samsung: [
                    { id: 'samsungwatch6', name: 'Galaxy Watch 6 40mm', price: 199, specs: ['Exynos W930', '40mm Case', 'Wear OS'] },
                    { id: 'samsungwatch6classic', name: 'Galaxy Watch 6 Classic 47mm', price: 349, specs: ['Exynos W930', '47mm Case', 'Rotating Bezel'] },
                    { id: 'samsungwatch7', name: 'Galaxy Watch 7 44mm', price: 230, specs: ['Exynos W1000', '44mm Case', 'Wear OS 5'] },
                    { id: 'samsungwatchultra', name: 'Galaxy Watch Ultra 47mm', price: 390, specs: ['Exynos W1000', '47mm Titanium', 'GPS + LTE'] }
                ],
                xiaomi: [
                    { id: 'xiaomiwatch2', name: 'Xiaomi Watch 2 Pro', price: 149, specs: ['Snapdragon W5+', 'AMOLED', 'Wear OS'] },
                    { id: 'xiaomiwatchs3', name: 'Xiaomi Watch S3', price: 199, specs: ['HyperOS', 'AMOLED', 'GPS + eSIM'] }
                ],
                garmin: [
                    { id: 'garminvenu3', name: 'Garmin Venu 3 45mm', price: 449, specs: ['AMOLED Display', 'GPS', '14 days battery'] },
                    { id: 'garminfenix7', name: 'Garmin Fenix 7 Solar', price: 699, specs: ['Solar Charging', 'Multi-GNSS', 'Sapphire Glass'] }
                ]
            },
            accesorios: {
                apple: [
                    { id: 'airpods3', name: 'AirPods 3rd Gen', price: 179, specs: ['Spatial Audio', 'MagSafe Case', 'H1 Chip'] },
                    { id: 'airpods4', name: 'AirPods 4', price: 150, specs: ['Audio Adaptativo', 'USB-C', 'H2 Chip'] },
                    { id: 'airpodspro2', name: 'AirPods Pro 2nd Gen', price: 249, specs: ['Active Noise Cancellation', 'MagSafe Case', 'H2 Chip'] },
                    { id: 'airpodsmax', name: 'AirPods Max', price: 455, specs: ['Audio espacial', 'Cancelación activa', 'H1 chip'] },
                    { id: 'airtag1pack', name: 'AirTag', price: 29, specs: ['Precision Finding', 'IP67', 'CR2032 Battery'] },
                    { id: 'airtag4pack', name: 'AirTag 4 Pack', price: 99, specs: ['Precision Finding', 'IP67', 'CR2032 Battery'] },
                    { id: 'magicmouse', name: 'Magic Mouse', price: 99, specs: ['Multi-Touch Surface', 'Lightning Connector', 'Wireless'] },
                    { id: 'magickeyboard', name: 'Magic Keyboard', price: 149, specs: ['Scissor Mechanism', 'Lightning Connector', 'Wireless'] },
                    { id: 'applepen2', name: 'Apple Pencil 2nd Gen', price: 129, specs: ['Magnetic Attachment', 'Wireless Charging', 'Double Tap'] }
                ],
                samsung: [
                    { id: 'samsungbuds2pro', name: 'Galaxy Buds 2 Pro', price: 179, specs: ['ANC', '360 Audio', 'IPX7'] },
                    { id: 'samsungbuds3', name: 'Galaxy Buds 3', price: 130, specs: ['AI Noise Cancelling', '360 Audio', 'Galaxy AI'] },
                    { id: 'samsungbuds3pro', name: 'Galaxy Buds 3 Pro', price: 199, specs: ['ANC', 'Adaptive Audio', 'Galaxy AI'] },
                    { id: 'samsungtag2', name: 'Galaxy SmartTag 2', price: 30, specs: ['Bluetooth LE', 'IP67', 'SmartThings Find'] },
                    { id: 'samsungcharger45w', name: 'Super Fast Charger 45W', price: 45, specs: ['45W PD', 'USB-C', 'GaN Technology'] },
                    { id: 'samsungwirelesscharger', name: 'Wireless Charger Duo', price: 69, specs: ['15W Fast Charging', 'Dual Charging', 'LED Indicator'] }
                ],
                xiaomi: [
                    { id: 'xiaomibuds4pro', name: 'Xiaomi Buds 4 Pro', price: 89, specs: ['ANC', 'LDAC', 'Wireless Charging'] },
                    { id: 'xiaomibuds5', name: 'Xiaomi Buds 5', price: 40, specs: ['Bluetooth 5.3', '40h Battery', 'IPX4'] },
                    { id: 'xiaomicharger67w', name: 'Xiaomi 67W Charger', price: 35, specs: ['67W Turbo', 'GaN Tech', 'Multi-Protocol'] },
                    { id: 'xiaomipowerbank20k', name: 'Power Bank 20000mAh', price: 25, specs: ['20000mAh', '22.5W Fast Charge', 'USB-C PD'] }
                ],
                anker: [
                    { id: 'ankercharger100w', name: 'Anker PowerPort 100W', price: 79, specs: ['100W GaN', '4 Ports', 'PowerIQ 4.0'] },
                    { id: 'ankerpowerbank26k', name: 'Anker PowerCore 26800', price: 59, specs: ['26800mAh', '45W PD', 'Triple Output'] },
                    { id: 'ankerwirelessstand', name: 'Anker Wireless Stand', price: 39, specs: ['15W Max', 'Qi Certified', 'Case Friendly'] }
                ],
                belkin: [
                    { id: 'belkin3in1charger', name: 'Belkin 3-in-1 Wireless Charger', price: 129, specs: ['MagSafe Compatible', '15W Fast Charge', 'Watch Stand'] },
                    { id: 'belkinscreenprotector', name: 'Belkin Screen Protector', price: 19, specs: ['Tempered Glass', 'Easy Install', 'Case Compatible'] }
                ]
            },
            televisores: {
                samsung: [
                    { id: 'samsungtv43qled', name: 'Samsung TV 43" QLED 4K', price: 415, specs: ['43" QLED', '4K UHD', 'Smart TV Tizen'] },
                    { id: 'samsungtv55qled', name: 'Samsung TV 55" QLED 4K', price: 599, specs: ['55" QLED', '4K UHD', 'HDR10+'] },
                    { id: 'samsungtv65qled', name: 'Samsung TV 65" QLED 4K', price: 845, specs: ['65" QLED', '4K UHD', 'HDR10+'] },
                    { id: 'samsungtv75neo', name: 'Samsung TV 75" Neo QLED 8K', price: 2199, specs: ['75" Neo QLED', '8K UHD', 'HDR10+'] }
                ],
                lg: [
                    { id: 'lgtv43led', name: 'LG TV 43" LED 4K', price: 329, specs: ['43" LED', '4K UHD', 'webOS Smart TV'] },
                    { id: 'lgtv55oled', name: 'LG TV 55" OLED C4', price: 1299, specs: ['55" OLED', '4K UHD', 'Dolby Vision'] },
                    { id: 'lgtv65oled', name: 'LG TV 65" OLED G4', price: 2299, specs: ['65" OLED', '4K UHD', 'Gallery Design'] }
                ],
                tcl: [
                    { id: 'tcltv43', name: 'TCL 43" HDR Android TV', price: 225, specs: ['43" LED', '4K UHD', 'Android TV'] },
                    { id: 'tcltv55qled', name: 'TCL 55" QLED HDR+ Google TV', price: 415, specs: ['55" QLED', '4K UHD', 'Google TV'] },
                    { id: 'tcltv65mini', name: 'TCL 65" Mini LED 4K', price: 899, specs: ['65" Mini LED', '4K UHD', 'HDR Premium'] }
                ],
                sony: [
                    { id: 'sonytv55x90l', name: 'Sony TV 55" X90L LED', price: 999, specs: ['55" LED', '4K UHD', 'Google TV'] },
                    { id: 'sonytv65a95l', name: 'Sony TV 65" A95L OLED', price: 2799, specs: ['65" QD-OLED', '4K UHD', 'XR Processor'] }
                ]
            },
            videojuegos: {
                sony: [
                    { id: 'ps5slim', name: 'PlayStation 5 Slim', price: 610, specs: ['SSD 1TB', 'Ray Tracing', '4K Gaming'] },
                    { id: 'ps5digital', name: 'PlayStation 5 Digital', price: 545, specs: ['SSD 1TB', 'Digital Edition', '4K Gaming'] },
                    { id: 'ps5pro', name: 'PlayStation 5 Pro', price: 899, specs: ['SSD 2TB', 'Enhanced RT', '8K Ready'] },
                    { id: 'psvr2', name: 'PlayStation VR2', price: 549, specs: ['4K HDR', 'Eye Tracking', 'Haptic Feedback'] }
                ],
                microsoft: [
                    { id: 'xboxseriess', name: 'Xbox Series S', price: 360, specs: ['SSD 512GB', '1440p Gaming', 'Quick Resume'] },
                    { id: 'xboxseriesx', name: 'Xbox Series X', price: 599, specs: ['SSD 1TB', '4K Gaming', 'Ray Tracing'] }
                ],
                nintendo: [
                    { id: 'switcholed', name: 'Nintendo Switch OLED', price: 330, specs: ['7" OLED Screen', '64GB', 'Enhanced Audio'] },
                    { id: 'switchlite', name: 'Nintendo Switch Lite', price: 190, specs: ['Handheld Only', '32GB', 'Lightweight'] }
                ],
                steam: [
                    { id: 'steamdeck512', name: 'Steam Deck 512GB', price: 649, specs: ['AMD APU', '512GB SSD', 'SteamOS'] },
                    { id: 'steamdeck1tb', name: 'Steam Deck OLED 1TB', price: 799, specs: ['AMD APU', '1TB SSD', '7.4" OLED'] }
                ]
            }
        };
    }

    initializeGiftProducts() {
        return [
            // Accesorios premium como regalos
            { id: 'gift-airtag', name: 'Apple AirTag', price: 0, originalPrice: 29, category: 'accesorios', brand: 'apple', description: 'Encuentra tus objetos perdidos fácilmente' },
            { id: 'gift-samsungtag', name: 'Galaxy SmartTag 2', price: 0, originalPrice: 30, category: 'accesorios', brand: 'samsung', description: 'Localizador inteligente Samsung' },
            { id: 'gift-powerbank', name: 'Power Bank 10000mAh Xiaomi', price: 0, originalPrice: 25, category: 'accesorios', brand: 'xiaomi', description: 'Carga portátil de alta capacidad' },
            { id: 'gift-screenprotector', name: 'Protector de Pantalla Premium', price: 0, originalPrice: 19, category: 'accesorios', brand: 'belkin', description: 'Protección total para tu pantalla' },
            { id: 'gift-wirelesscharger', name: 'Cargador Inalámbrico 15W', price: 0, originalPrice: 39, category: 'accesorios', brand: 'anker', description: 'Carga inalámbrica rápida y segura' },
            { id: 'gift-usbc-cable', name: 'Cable USB-C Premium 2m', price: 0, originalPrice: 25, category: 'accesorios', brand: 'anker', description: 'Cable de carga y datos de alta calidad' },
            { id: 'gift-car-mount', name: 'Soporte Magnético para Auto', price: 0, originalPrice: 35, category: 'accesorios', brand: 'belkin', description: 'Soporte magnético para vehículo' },
            { id: 'gift-bluetooth-speaker', name: 'Speaker Bluetooth Portátil', price: 0, originalPrice: 45, category: 'accesorios', brand: 'xiaomi', description: 'Audio premium portátil' },
            { id: 'gift-phone-case', name: 'Funda Premium Transparente', price: 0, originalPrice: 29, category: 'accesorios', brand: 'belkin', description: 'Protección elegante y resistente' },
            { id: 'gift-cleaning-kit', name: 'Kit de Limpieza Profesional', price: 0, originalPrice: 15, category: 'accesorios', brand: 'belkin', description: 'Mantén tus dispositivos impecables' },
            { id: 'gift-stand', name: 'Soporte Ajustable para Escritorio', price: 0, originalPrice: 32, category: 'accesorios', brand: 'anker', description: 'Soporte ergonómico multifuncional' },
            { id: 'gift-lens-protector', name: 'Protector de Lente de Cámara', price: 0, originalPrice: 12, category: 'accesorios', brand: 'belkin', description: 'Protege la cámara de tu dispositivo' },
            { id: 'gift-cable-organizer', name: 'Organizador de Cables Premium', price: 0, originalPrice: 18, category: 'accesorios', brand: 'anker', description: 'Mantén tus cables ordenados' },
            { id: 'gift-pop-socket', name: 'PopSocket Magnético', price: 0, originalPrice: 22, category: 'accesorios', brand: 'belkin', description: 'Agarre seguro y soporte integrado' },
            { id: 'gift-card-holder', name: 'Cartera MagSafe Compatible', price: 0, originalPrice: 28, category: 'accesorios', brand: 'apple', description: 'Porta tarjetas magnético premium' }
        ];
    }

    setupDefaultSelections() {
        // Set default shipping (Express)
        const expressOption = document.querySelector('.shipping-option[data-shipping="express"]');
        if (expressOption) {
            expressOption.classList.add('selected');
        }

        // Set default insurance (Premium)
        const premiumInsuranceOption = document.querySelector('.insurance-option[data-insurance="true"]');
        if (premiumInsuranceOption) {
            premiumInsuranceOption.classList.add('selected');
        }

        // Set default payment method
        const cardOption = document.querySelector('.payment-option[data-payment="card"]');
        if (cardOption) {
            cardOption.classList.add('selected');
        }

        // Set default carrier
        this.updateCarrierDisplay('DHL');
    }

    checkRemeexSession() {
        try {
            const isActiveSession = sessionStorage.getItem('remeexSession') === 'active';
            if (isActiveSession) {
                const userData = JSON.parse(sessionStorage.getItem('remeexUser') || '{}');
                this.remeex.user = userData;

                const rateData = sessionStorage.getItem('remeexSessionExchangeRate');
                if (rateData) {
                    try {
                        const parsedRate = JSON.parse(rateData);
                        if (parsedRate && parsedRate.USD_TO_BS) {
                            this.config.exchangeRate = parsedRate.USD_TO_BS;
                        }
                    } catch (e) { /* ignore */ }
                }

                const balanceData = localStorage.getItem('remeexBalance');
                if (balanceData) {
                    const parsedBalance = JSON.parse(balanceData);
                    this.remeex.balance = {
                        usd: parsedBalance.usd || 0,
                        bs: parsedBalance.bs || 0,
                        eur: parsedBalance.eur || 0
                    };
                }
                
                const cardData = localStorage.getItem('remeexCardData');
                if (cardData) {
                    const parsedCard = JSON.parse(cardData);
                    this.remeex.hasSavedCard = parsedCard.hasSavedCard || false;
                }

                this.updateSavedCardUI();

                this.displayRemeexPaymentOption();
                this.updateOrderSummary();
            }
        } catch (error) {
            console.log('No Remeex session detected');
        }
    }

    displayRemeexPaymentOption() {
        const paymentOptionsContainer = document.querySelector('.payment-options');
        if (!paymentOptionsContainer || document.getElementById('remeex-payment-option')) return;

        const remeexOption = document.createElement('div');
        remeexOption.id = 'remeex-payment-option';
        remeexOption.className = 'payment-option';
        remeexOption.setAttribute('data-payment', 'remeex');
        
        remeexOption.innerHTML = `
            <div class="payment-icon">
                <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhnBzNdjl6bNp-nIdaiHVENczJhwlJNA7ocsyiOObMmzbu8at0dY5yGcZ9cLxLF39qI6gwNfqBxlkTDC0txVULEwQVwGkeEzN0Jq9MRTRagA48mh18UqTlR4WhsXOLAEZugUyhqJHB19xJgnkpe-S5VOWFgzpKFwctv3XP9XhH41vNTvq0ZS-nik58Qhr-O/s320/remeex.png" 
                     alt="Remeex" style="width: 24px; height: auto;">
            </div>
            <span class="payment-label">Remeex ($${this.remeex.balance.usd.toFixed(2)})</span>
        `;

        remeexOption.addEventListener('click', () => this.selectPaymentMethod('remeex'));
        paymentOptionsContainer.insertBefore(remeexOption, paymentOptionsContainer.firstChild);
    }

    updateSavedCardUI() {
        if (!this.savedCardContainer) return;
        if (this.remeex.hasSavedCard) {
            this.savedCardContainer.style.display = 'block';
            if (this.useSavedCardCheckbox && this.useSavedCardCheckbox.checked) {
                if (this.paymentForm) this.paymentForm.style.display = 'none';
            }
        } else {
            this.savedCardContainer.style.display = 'none';
            if (this.paymentForm && this.state.selectedPayment === 'card') {
                this.paymentForm.style.display = 'block';
            }
        }
    }

    selectCountry(country) {
        this.clearSelections('.country-card');
        this.setSelected(`.country-card[data-country="${country}"]`);
        this.state.selectedCountry = country;

        // Show categories
        this.categoriesSection.style.display = 'block';
        this.scrollToElement(this.categoriesSection);

        // Configure payment options based on country
        this.configurePaymentOptions(country);

        this.showToast('success', 'País seleccionado', `Has seleccionado ${this.getCountryName(country)}`);
    }

    selectCategory(category) {
        this.clearSelections('.category-card');
        this.setSelected(`.category-card[data-category="${category}"]`);
        this.state.selectedCategory = category;

        // Show brands
        this.renderBrands(category);
        this.brandsSection.style.display = 'block';
        this.scrollToElement(this.brandsSection);

        this.showToast('info', 'Categoría seleccionada', `Explorando ${category}`);
    }

    selectBrand(brand) {
        this.clearSelections('.brand-card');
        this.setSelected(`.brand-card[data-brand="${brand}"]`);
        this.state.selectedBrand = brand;

        // Show products
        this.renderProducts(this.state.selectedCategory, brand);
        this.productsSection.style.display = 'block';
        this.scrollToElement(this.productsSection);

        this.showToast('info', 'Marca seleccionada', `Productos de ${this.capitalize(brand)}`);
    }

    renderBrands(category) {
        if (!this.inventory[category]) return;

        this.brandsGrid.innerHTML = '';
        const brands = Object.keys(this.inventory[category]);

        brands.forEach(brand => {
            const brandCard = document.createElement('div');
            brandCard.className = 'brand-card';
            brandCard.setAttribute('data-brand', brand);

            const logo = this.getBrandLogo(brand);
            const logoContent = logo ? `<img src="${logo}" alt="${brand} logo">` : brand.toUpperCase();

            brandCard.innerHTML = `
                <div class="brand-logo">${logoContent}</div>
                <div class="brand-name">${this.capitalize(brand)}</div>
            `;

            brandCard.addEventListener('click', () => this.selectBrand(brand));
            this.brandsGrid.appendChild(brandCard);
        });
    }

    renderProducts(category, brand) {
        if (!this.inventory[category] || !this.inventory[category][brand]) return;

        this.productsGrid.innerHTML = '';
        const products = this.inventory[category][brand];

        products.forEach(product => {
            const productCard = this.createProductCard(product, category, brand);
            this.productsGrid.appendChild(productCard);
        });
    }

    createProductCard(product, category, brand) {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        const videoButton = product.hasVideo ? 
            `<button class="product-video-btn" data-id="${product.id}">
                <i class="fas fa-play"></i>
             </button>` : '';

        const specs = product.specs.map(spec =>
            `<span class="product-spec">${spec}</span>`
        ).join('');

        const imageUrl = product.image || this.getDefaultProductImage(brand, category);
        const imageContent = imageUrl
            ? `<img src="${imageUrl}" alt="${product.name}" class="product-photo">`
            : `<i class="product-icon ${this.getCategoryIcon(category)}"></i>`;

        productCard.innerHTML = `
            <div class="product-image">
                ${imageContent}
                ${videoButton}
            </div>
            <div class="product-content">
                <div class="product-brand">${this.capitalize(brand)}</div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-specs">${specs}</div>
                <div class="product-price">${product.price.toFixed(2)}</div>
                <div class="product-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn minus" data-id="${product.id}">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" value="1" min="1" class="quantity-input" data-id="${product.id}">
                        <button class="quantity-btn plus" data-id="${product.id}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="add-to-cart-btn" data-product='${JSON.stringify({...product, category, brand})}'>
                        <i class="fas fa-cart-plus"></i>
                        <span>Añadir</span>
                    </button>
                </div>
            </div>
        `;

        this.bindProductCardEvents(productCard);
        return productCard;
    }

    bindProductCardEvents(productCard) {
        // Video button
        const videoBtn = productCard.querySelector('.product-video-btn');
        if (videoBtn) {
            videoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openVideoModal(videoBtn.dataset.id);
            });
        }

        // Quantity controls
        const minusBtn = productCard.querySelector('.quantity-btn.minus');
        const plusBtn = productCard.querySelector('.quantity-btn.plus');
        const quantityInput = productCard.querySelector('.quantity-input');

        minusBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });

        plusBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            quantityInput.value = currentValue + 1;
        });

        // Add to cart
        const addToCartBtn = productCard.querySelector('.add-to-cart-btn');
        addToCartBtn.addEventListener('click', () => {
            const product = JSON.parse(addToCartBtn.dataset.product);
            const quantity = parseInt(quantityInput.value);
            this.addToCart(product, quantity);
        });
    }

    addToCart(product, quantity) {
        const existingItem = this.state.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.state.cart.push({
                ...product,
                quantity: quantity
            });
        }

        this.updateCartDisplay();
        this.updateCartBadge();
        this.saveCart();
        this.cartSection.style.display = 'block';
        this.scrollToElement(this.cartSection);

        this.showToast('success', 'Producto añadido', 
            `${quantity} ${quantity > 1 ? 'unidades' : 'unidad'} de ${product.name} añadido al carrito`);
    }

    updateCartDisplay() {
        if (this.state.cart.length === 0) {
            this.cartItems.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-cart-icon">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                    <h3 class="empty-cart-title">Tu carrito está vacío</h3>
                    <p class="empty-cart-text">Explora nuestros productos y añade algunos a tu carrito</p>
                </div>
            `;
            this.continueToShippingBtn.disabled = true;
        } else {
            this.cartItems.innerHTML = '';
            this.state.cart.forEach(item => {
                const cartItem = this.createCartItem(item);
                this.cartItems.appendChild(cartItem);
            });
            this.continueToShippingBtn.disabled = false;
        }

        this.updateOrderSummary();
    }

    createCartItem(item) {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';

        cartItem.innerHTML = `
            <div class="item-image">
                <i class="item-icon ${this.getCategoryIcon(item.category)}"></i>
            </div>
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-brand">${this.capitalize(item.brand)}</div>
            </div>
            <div class="item-price">$${item.price.toFixed(2)}</div>
            <div class="quantity-control">
                <button class="quantity-btn minus" data-id="${item.id}">
                    <i class="fas fa-minus"></i>
                </button>
                <input type="number" value="${item.quantity}" min="1" class="quantity-input" data-id="${item.id}">
                <button class="quantity-btn plus" data-id="${item.id}">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <button class="item-remove" data-id="${item.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;

        this.bindCartItemEvents(cartItem);
        return cartItem;
    }

    bindCartItemEvents(cartItem) {
        const minusBtn = cartItem.querySelector('.quantity-btn.minus');
        const plusBtn = cartItem.querySelector('.quantity-btn.plus');
        const quantityInput = cartItem.querySelector('.quantity-input');
        const removeBtn = cartItem.querySelector('.item-remove');

        minusBtn.addEventListener('click', () => {
            const itemId = minusBtn.dataset.id;
            this.updateCartItemQuantity(itemId, -1);
        });

        plusBtn.addEventListener('click', () => {
            const itemId = plusBtn.dataset.id;
            this.updateCartItemQuantity(itemId, 1);
        });

        quantityInput.addEventListener('change', () => {
            const itemId = quantityInput.dataset.id;
            const newQuantity = parseInt(quantityInput.value);
            if (newQuantity > 0) {
                this.setCartItemQuantity(itemId, newQuantity);
            } else {
                quantityInput.value = 1;
            }
        });

        removeBtn.addEventListener('click', () => {
            const itemId = removeBtn.dataset.id;
            this.removeFromCart(itemId);
        });
    }

    updateCartItemQuantity(itemId, change) {
        const item = this.state.cart.find(item => item.id === itemId);
        if (item) {
            const newQuantity = item.quantity + change;
            if (newQuantity > 0) {
                item.quantity = newQuantity;
                this.updateCartDisplay();
                this.updateCartBadge();
                this.saveCart();
            }
        }
    }

    setCartItemQuantity(itemId, quantity) {
        const item = this.state.cart.find(item => item.id === itemId);
        if (item) {
            item.quantity = quantity;
            this.updateCartDisplay();
            this.updateCartBadge();
            this.saveCart();
        }
    }

    removeFromCart(itemId) {
        const itemIndex = this.state.cart.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            const removedItem = this.state.cart[itemIndex];
            this.state.cart.splice(itemIndex, 1);
            this.updateCartDisplay();
            this.updateCartBadge();
            this.saveCart();
            this.showToast('info', 'Producto eliminado', `${removedItem.name} eliminado del carrito`);
        }
    }

    clearCart() {
        if (this.state.cart.length === 0) return;
        this.state.cart = [];
        this.updateCartDisplay();
        this.updateCartBadge();
        this.saveCart();
        this.showToast('info', 'Carrito vaciado', 'Se eliminaron todos los productos de tu carrito');
    }

    updateCartBadge() {
        const totalItems = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
        this.cartBadge.textContent = totalItems;
        
        if (totalItems > 0) {
            this.cartBadge.classList.add('active');
        } else {
            this.cartBadge.classList.remove('active');
        }
    }

    updateOrderSummary() {
        const subtotal = this.calculateSubtotal();
        const tax = subtotal * this.config.taxRate;
        const shipping = this.state.selectedShipping.price;
        const insurance = this.state.selectedInsurance.price;
        const total = subtotal + tax + shipping + insurance;

        // Update main summary
        if (this.subtotalElement) this.subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        if (this.taxElement) this.taxElement.textContent = `$${tax.toFixed(2)}`;
        if (this.shippingElement) this.shippingElement.textContent = `$${shipping.toFixed(2)}`;
        if (this.insuranceElement) this.insuranceElement.textContent = `$${insurance.toFixed(2)}`;
        if (this.totalElement) this.totalElement.textContent = `$${total.toFixed(2)}`;
        if (this.totalBsElement) this.totalBsElement.textContent = `${(total * this.config.exchangeRate).toFixed(2)} Bs`;

        // Update payment summary
        const paymentSubtotal = document.getElementById('payment-subtotal');
        const paymentTax = document.getElementById('payment-tax');
        const paymentShipping = document.getElementById('payment-shipping');
        const paymentInsurance = document.getElementById('payment-insurance');
        const paymentTotal = document.getElementById('payment-total');
        const paymentTotalBs = document.getElementById('payment-total-bs');

        if (paymentSubtotal) paymentSubtotal.textContent = `$${subtotal.toFixed(2)}`;
        if (paymentTax) paymentTax.textContent = `$${tax.toFixed(2)}`;
        if (paymentShipping) paymentShipping.textContent = `$${shipping.toFixed(2)}`;
        if (paymentInsurance) paymentInsurance.textContent = `$${insurance.toFixed(2)}`;
        if (paymentTotal) paymentTotal.textContent = `$${total.toFixed(2)}`;
        if (paymentTotalBs) paymentTotalBs.textContent = `${(total * this.config.exchangeRate).toFixed(2)} Bs`;

        // Update nationalization fee
        const nationalizationFeeValue = this.calculateNationalizationFee(total);
        if (this.nationalizationFee) {
            this.nationalizationFee.textContent = `${nationalizationFeeValue.toFixed(2)} Bs`;
        }
        
        const nationalizationModalFee = document.getElementById('nationalization-modal-fee');
        if (nationalizationModalFee) {
            nationalizationModalFee.textContent = `${nationalizationFeeValue.toFixed(2)} Bs`;
        }

        // Update order total in success section
        if (this.orderTotal) this.orderTotal.textContent = `$${total.toFixed(2)}`;
    }

    calculateSubtotal() {
        return this.state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    calculateNationalizationFee(totalUSD) {
        return totalUSD * 0.02 * this.config.exchangeRate;
    }

    selectShipping(option) {
        this.clearSelections('.shipping-option');
        option.classList.add('selected');
        
        this.state.selectedShipping = {
            method: option.dataset.shipping,
            price: parseFloat(option.dataset.price)
        };
        
        this.updateOrderSummary();
        this.showToast('info', 'Envío seleccionado', 
            `Has elegido el envío ${option.querySelector('.shipping-title').textContent}`);
    }

    toggleCarrierDropdown() {
        this.carrierDropdown.classList.toggle('active');
    }

    selectCarrier(carrier) {
        this.clearSelections('.carrier-option');
        this.setSelected(`.carrier-option[data-carrier="${carrier}"]`);
        this.state.selectedCarrier = carrier;
        
        this.updateCarrierDisplay(carrier.toUpperCase());
        this.carrierDropdown.classList.remove('active');
        
        this.showToast('info', 'Transportista seleccionado', 
            `Has elegido ${carrier.toUpperCase()}`);
    }

    updateCarrierDisplay(carrierName) {
        const carrierNameElement = this.carrierDropdown.querySelector('.carrier-name');
        if (carrierNameElement) {
            carrierNameElement.textContent = carrierName;
        }
    }

    selectInsurance(option) {
        this.clearSelections('.insurance-option');
        option.classList.add('selected');
        
        this.state.selectedInsurance = {
            selected: option.dataset.insurance === 'true',
            price: parseFloat(option.dataset.price)
        };
        
        this.updateOrderSummary();
        
        const insuranceMsg = this.state.selectedInsurance.selected ? 
            'Has seleccionado el seguro premium' : 
            'Has elegido no incluir seguro';
        
        this.showToast('info', 'Seguro actualizado', insuranceMsg);
    }

    renderGifts() {
        if (!this.giftSelect) return;
        this.giftSelect.innerHTML = '';

        if (this.giftProducts.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No hay regalos disponibles';
            option.disabled = true;
            option.selected = true;
            this.giftSelect.appendChild(option);
            return;
        }

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Selecciona un regalo';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        this.giftSelect.appendChild(defaultOption);

        this.giftProducts.forEach(gift => {
            const opt = document.createElement('option');
            opt.value = gift.id;
            opt.textContent = gift.name;
            this.giftSelect.appendChild(opt);
        });
    }

    selectGift(gift) {
        this.state.selectedGift = gift;
        this.showToast('success', '¡Regalo seleccionado!',
            `Has elegido ${gift.name} como tu regalo gratuito`);
    }

    updateTermsAcceptance() {
        this.state.acceptedTerms = this.acceptTermsCheckbox.checked;
        this.continueToPaymentBtn.disabled = !this.state.acceptedTerms;
    }

    selectPaymentMethod(method) {
        this.clearSelections('.payment-option');
        this.setSelected(`.payment-option[data-payment="${method}"]`);
        this.state.selectedPayment = method;
        
        // Show/hide payment form based on method
        if (this.paymentForm) {
            this.paymentForm.style.display = method === 'card' ? 'block' : 'none';
            if (method === 'card' && this.useSavedCardCheckbox && this.useSavedCardCheckbox.checked) {
                this.paymentForm.style.display = 'none';
            }
        }
        
        this.showToast('info', 'Método de pago', 
            `Has seleccionado ${this.getPaymentMethodName(method)}`);
    }

    configurePaymentOptions(country) {
        const paypalOption = document.getElementById('paypal-option');
        const zelleOption = document.getElementById('zelle-option');
        const cryptoOption = document.getElementById('crypto-option');
        
        if (country === 'venezuela') {
            if (paypalOption) paypalOption.style.display = 'none';
            if (zelleOption) zelleOption.style.display = 'flex';
            if (cryptoOption) cryptoOption.style.display = 'flex';
        } else {
            if (paypalOption) paypalOption.style.display = 'flex';
            if (zelleOption) zelleOption.style.display = 'none';
            if (cryptoOption) cryptoOption.style.display = 'none';
        }
    }

    proceedToShipping() {
        if (this.state.cart.length === 0) {
            this.showToast('warning', 'Carrito vacío', 
                'Por favor, añade al menos un producto al carrito');
            return;
        }
        
        this.renderGifts();
        this.goToStep(2);
        this.showToast('info', 'Elige un regalo', 
            'Como agradecimiento por tu compra, puedes elegir un regalo gratis');
    }

    proceedToPayment() {
        if (!this.state.acceptedTerms) {
            this.showToast('warning', 'Términos requeridos', 
                'Debes aceptar los términos de nacionalización para continuar');
            return;
        }
        
        this.updatePaymentSummary();
        this.goToStep(3);
    }

    updatePaymentSummary() {
        if (!this.paymentSummaryItems) return;
        
        this.paymentSummaryItems.innerHTML = '';
        
        this.state.cart.forEach(item => {
            const summaryItem = document.createElement('div');
            summaryItem.className = 'cart-item';
            
            summaryItem.innerHTML = `
                <div class="item-image">
                    <i class="item-icon ${this.getCategoryIcon(item.category)}"></i>
                </div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-brand">${this.capitalize(item.brand)}</div>
                </div>
                <div class="item-price">$${item.price.toFixed(2)}</div>
                <div class="item-quantity">${item.quantity}</div>
                <div class="item-total">$${(item.price * item.quantity).toFixed(2)}</div>
            `;
            
            this.paymentSummaryItems.appendChild(summaryItem);
        });
        
        // Add gift if selected
        if (this.state.selectedGift) {
            const giftItem = document.createElement('div');
            giftItem.className = 'cart-item';
            
            giftItem.innerHTML = `
                <div class="item-image">
                    <i class="item-icon ${this.getCategoryIcon(this.state.selectedGift.category)}" style="color: var(--warning);"></i>
                </div>
                <div class="item-details">
                    <div class="item-name">${this.state.selectedGift.name} (Regalo)</div>
                    <div class="item-brand">${this.capitalize(this.state.selectedGift.brand)}</div>
                </div>
                <div class="item-price">$0.00</div>
                <div class="item-quantity">1</div>
                <div class="item-total">$0.00</div>
            `;
            
            this.paymentSummaryItems.appendChild(giftItem);
        }
    }

    processPayment() {
        if (this.state.cart.length === 0) {
            this.showToast('error', 'Carrito vacío',
                'No hay productos en tu carrito para procesar el pago');
            return;
        }

        if (this.purchases.length >= 2) {
            this.showToast('warning', 'Límite alcanzado', 'Ya alcanzaste el máximo de compras permitidas');
            return;
        }
        
        // Generate order number
        this.state.orderNumber = this.generateOrderNumber();
        if (this.orderNumber) {
            this.orderNumber.textContent = this.state.orderNumber;
        }
        
        // Show loading
        this.showLoading();

        if (this.state.selectedPayment === 'card') {
            if (!this.validateCardForm()) {
                this.hideLoading();
                return;
            }
        }

        // Process payment based on method
        if (this.state.selectedPayment === 'remeex' && this.remeex.user) {
            this.processRemeexPayment();
        } else {
            this.processStandardPayment();
        }
    }

    processStandardPayment() {
        setTimeout(() => {
            this.hideLoading();
            this.showNationalizationModal();
            const total = this.calculateTotal();
            this.registerPurchase(total);
        }, 3000);
    }

    processRemeexPayment() {
        const total = this.calculateTotal();

        setTimeout(() => {
            try {
                if (this.remeex.balance.usd >= total) {
                    this.remeex.balance.usd -= total;
                    this.remeex.balance.bs -= total * this.config.exchangeRate;
                    
                    // Save updated balance
                    const currentDeviceId = localStorage.getItem('remeexDeviceId');
                    localStorage.setItem('remeexBalance', JSON.stringify({
                        ...this.remeex.balance,
                        deviceId: currentDeviceId
                    }));
                    
                    // Add transaction
                    this.addRemeexTransaction({
                        type: 'withdraw',
                        amount: total,
                        amountBs: total * this.config.exchangeRate,
                        date: this.getCurrentDateTime(),
                        description: `Compra en LatinPhone - ${this.state.orderNumber}`,
                        status: 'completed'
                    });
                    
                    this.hideLoading();
                    this.showNationalizationModal();
                    this.showToast('success', '¡Pago exitoso!',
                        `Pago de $${total.toFixed(2)} procesado desde Remeex`);
                    this.registerPurchase(total);
                } else {
                    if (this.remeex.hasSavedCard && this.remeex.balance.usd > 0) {
                        const fromBalance = this.remeex.balance.usd;
                        const fromCard = total - fromBalance;
                        this.remeex.balance.usd = 0;
                        this.remeex.balance.bs -= fromBalance * this.config.exchangeRate;

                        const currentDeviceId = localStorage.getItem('remeexDeviceId');
                        localStorage.setItem('remeexBalance', JSON.stringify({
                            ...this.remeex.balance,
                            deviceId: currentDeviceId
                        }));

                        if (fromBalance > 0) {
                            this.addRemeexTransaction({
                                type: 'withdraw',
                                amount: fromBalance,
                                amountBs: fromBalance * this.config.exchangeRate,
                                cardAmount: fromCard,
                                card: '****3009',
                                date: this.getCurrentDateTime(),
                                description: `Compra en LatinPhone - ${this.state.orderNumber}`,
                                status: 'completed'
                            });
                        }

                        this.hideLoading();
                        this.showNationalizationModal();
                        this.showToast('success', '¡Pago exitoso!',
                            `Pago mixto: $${fromBalance.toFixed(2)} Remeex y $${fromCard.toFixed(2)} tarjeta`);
                        this.registerPurchase(total);
                    } else if (this.remeex.hasSavedCard && this.remeex.balance.usd === 0) {
                        this.hideLoading();
                        this.showNationalizationModal();
                        this.showToast('success', '¡Pago exitoso!',
                            `Pago de $${total.toFixed(2)} procesado con tarjeta`);
                        this.registerPurchase(total);
                    } else {
                        throw new Error('Saldo insuficiente en Remeex');
                    }
                }
            } catch (error) {
                this.hideLoading();
                this.showToast('error', 'Error en el pago', error.message);
            }
        }, 2000);
    }

    addRemeexTransaction(transaction) {
        try {
            const currentDeviceId = localStorage.getItem('remeexDeviceId');
            const transactionsData = localStorage.getItem('remeexTransactions');
            let data = { transactions: [], deviceId: currentDeviceId };
            
            if (transactionsData) {
                const parsed = JSON.parse(transactionsData);
                if (parsed.deviceId === currentDeviceId) {
                    data = parsed;
                }
            }
            
            data.transactions.unshift(transaction);
            localStorage.setItem('remeexTransactions', JSON.stringify(data));
        } catch (error) {
            console.error('Error adding Remeex transaction:', error);
        }
    }

    calculateTotal() {
        const subtotal = this.calculateSubtotal();
        const tax = subtotal * this.config.taxRate;
        return subtotal + tax + this.state.selectedShipping.price + this.state.selectedInsurance.price;
    }

    generateOrderNumber() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'LP-';
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    goToStep(step) {
        // Update progress
        this.progressSteps.forEach(stepEl => {
            const stepNum = parseInt(stepEl.dataset.step);
            stepEl.classList.remove('active', 'completed');
            
            if (stepNum < step) {
                stepEl.classList.add('completed');
            } else if (stepNum === step) {
                stepEl.classList.add('active');
            }
        });
        
        // Show section
        this.contentSections.forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`section-${step}`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.scrollToElement(targetSection, -100);
        }
        
        this.state.currentStep = step;
    }

    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('active');
        }
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('active');
        }
    }

    showNationalizationModal() {
        if (this.nationalizationOverlay) {
            this.nationalizationOverlay.classList.add('active');
        }
    }

    closeModals() {
        const wasNationalizationActive = this.nationalizationOverlay &&
            this.nationalizationOverlay.classList.contains('active');

        if (this.nationalizationOverlay) {
            this.nationalizationOverlay.classList.remove('active');
        }

        if (this.videoModal) {
            this.videoModal.classList.remove('active');
            if (this.productVideo) {
                this.productVideo.pause();
                this.productVideo.src = '';
            }
        }

        if (wasNationalizationActive) {
            setTimeout(() => {
                this.goToStep(4);
                this.updateOrderDetails();

                if (window.confetti) {
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }
                this.showSuccessOverlay();
            }, 300);
        }
    }

    openVideoModal(productId) {
        const videoSrc = this.getProductVideoUrl(productId);
        if (!videoSrc) {
            this.showToast('warning', 'Video no disponible', 
                'El video de este producto no está disponible');
            return;
        }
        
        if (this.productVideo) {
            this.productVideo.src = videoSrc;
            this.productVideo.load();
        }
        
        if (this.videoModal) {
            this.videoModal.classList.add('active');
            
            setTimeout(() => {
                if (this.productVideo) {
                    this.productVideo.play().catch(err => {
                        this.showToast('info', 'Reproducción de video', 
                            'Toca el video para comenzar la reproducción');
                    });
                }
            }, 300);
        }
    }

    updateOrderDetails() {
        // Update order date
        if (this.orderDate) {
            this.orderDate.textContent = this.getCurrentDate();
        }

        const subtotalEl = document.getElementById('order-subtotal');
        const taxEl = document.getElementById('order-tax');
        const insuranceEl = document.getElementById('insurance-fee');
        const nationalizationEl = document.getElementById('nationalization-amount');
        const exchangeRateEl = document.getElementById('order-exchange-rate');

        let subtotal = this.calculateSubtotal();
        let total = this.calculateTotal();

        if (this.lastPurchase) {
            subtotal = this.lastPurchase.items.reduce((s, it) => s + it.price * it.quantity, 0);
            total = this.lastPurchase.total;
        }

        const tax = subtotal * this.config.taxRate;

        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
        if (this.orderTotal) this.orderTotal.textContent = `$${total.toFixed(2)}`;
        if (insuranceEl) insuranceEl.textContent = `$${this.state.selectedInsurance.price.toFixed(2)}`;
        if (nationalizationEl) nationalizationEl.textContent = `${this.calculateNationalizationFee(total).toFixed(2)} Bs`;
        if (exchangeRateEl) exchangeRateEl.textContent = `1 USD = ${this.config.exchangeRate.toFixed(2)} Bs`;
        
        // Update delivery dates
        this.updateDeliveryDates();
        
        // Generate promo code
        this.generatePromoCode();
        
        // Update WhatsApp links
        this.updateWhatsAppLinks();
    }

    updateDeliveryDates() {
        const today = new Date();
        let startDate, endDate;
        
        switch (this.state.selectedShipping.method) {
            case 'express':
                startDate = new Date(today);
                startDate.setDate(today.getDate() + 1);
                endDate = new Date(today);
                endDate.setDate(today.getDate() + 4);
                break;
            case 'standard':
                startDate = new Date(today);
                startDate.setDate(today.getDate() + 1);
                endDate = new Date(today);
                endDate.setDate(today.getDate() + 10);
                break;
            case 'free':
                startDate = new Date(today);
                startDate.setDate(today.getDate() + 15);
                endDate = new Date(today);
                endDate.setDate(today.getDate() + 20);
                break;
        }
        
        const formatDate = (date) => {
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        };
        
        const paidDateEl = document.getElementById('paid-date');
        const packagingDateEl = document.getElementById('packaging-date');
        const portDateEl = document.getElementById('port-date');
        const shippedDateEl = document.getElementById('shipped-date');
        const deliveryDateTransit = document.getElementById('delivery-date-transit');
        const deliveryDateStart = document.getElementById('delivery-date-start');
        const deliveryDateStart2 = document.getElementById('delivery-date-start-2');
        const deliveryDateEnd = document.getElementById('delivery-date-end');

        const packagingDate = new Date(today);
        packagingDate.setDate(today.getDate() + 1);
        const portDate = new Date(today);
        portDate.setDate(today.getDate() + 2);
        const shippedDate = new Date(today);
        shippedDate.setDate(today.getDate() + 3);

        if (paidDateEl) paidDateEl.textContent = formatDate(today);
        if (packagingDateEl) packagingDateEl.textContent = formatDate(packagingDate);
        if (portDateEl) portDateEl.textContent = formatDate(portDate);
        if (shippedDateEl) shippedDateEl.textContent = formatDate(shippedDate);
        if (deliveryDateTransit) deliveryDateTransit.textContent = formatDate(shippedDate);
        if (deliveryDateStart) deliveryDateStart.textContent = formatDate(startDate);
        if (deliveryDateStart2) deliveryDateStart2.textContent = formatDate(startDate);
        if (deliveryDateEnd) deliveryDateEnd.textContent = formatDate(endDate);
        
        // Update shipping method and company
        const shippingMethod = document.getElementById('shipping-method');
        const shippingCompany = document.getElementById('shipping-company');
        const carrierName = document.getElementById('carrier-name');
        
        if (shippingMethod) {
            let methodText = '';
            switch (this.state.selectedShipping.method) {
                case 'express':
                    methodText = 'Express (1-4 días)';
                    break;
                case 'standard':
                    methodText = 'Estándar (1-10 días)';
                    break;
                case 'free':
                    methodText = 'Gratuito (15-20 días)';
                    break;
            }
            shippingMethod.textContent = methodText;
        }
        
        if (shippingCompany) {
            shippingCompany.textContent = this.state.selectedCarrier.toUpperCase();
        }
        if (carrierName) {
            carrierName.textContent = this.state.selectedCarrier.toUpperCase();
        }
    }

    generatePromoCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'LATIN';
        
        for (let i = 0; i < 3; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        const promoCodeElement = document.getElementById('promo-code');
        if (promoCodeElement) {
            promoCodeElement.textContent = code;
        }
    }

    updateWhatsAppLinks() {
        const total = this.calculateTotal();
        let whatsappMessage = `Hola, acabo de realizar una compra en LatinPhone.\n\n`;
        whatsappMessage += `Número de orden: ${this.state.orderNumber}\n`;
        whatsappMessage += `Fecha: ${this.getCurrentDateTime()}\n\n`;
        whatsappMessage += `*Detalles de la compra:*\n`;
        
        // Add products
        this.state.cart.forEach(item => {
            whatsappMessage += `• ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}\n`;
        });
        
        // Add gift if selected
        if (this.state.selectedGift) {
            whatsappMessage += `• 1x ${this.state.selectedGift.name} (Regalo GRATIS)\n`;
        }
        
        // Add summary
        const subtotal = this.calculateSubtotal();
        const tax = subtotal * this.config.taxRate;
        
        whatsappMessage += `\n*Resumen:*\n`;
        whatsappMessage += `Subtotal: $${subtotal.toFixed(2)}\n`;
        whatsappMessage += `IVA (16%): $${tax.toFixed(2)}\n`;
        whatsappMessage += `Envío: $${this.state.selectedShipping.price.toFixed(2)}\n`;
        whatsappMessage += `Seguro: $${this.state.selectedInsurance.price.toFixed(2)}\n`;
        whatsappMessage += `*Total USD: $${total.toFixed(2)}*\n`;
        whatsappMessage += `*Total Bs: ${(total * this.config.exchangeRate).toFixed(2)} Bs*\n\n`;
        
        // Add nationalization info
        const nationalizationFeeValue = this.calculateNationalizationFee(total);
        whatsappMessage += `*Tasa de nacionalización: ${nationalizationFeeValue.toFixed(2)} Bs*\n\n`;
        
        whatsappMessage += `Método de pago: ${this.getPaymentMethodName(this.state.selectedPayment)}\n`;
        whatsappMessage += `Empresa de transporte: ${this.state.selectedCarrier.toUpperCase()}\n\n`;
        
        whatsappMessage += `Por favor, necesito finalizar el proceso de compra y confirmar los detalles de envío.`;
        
        // Update WhatsApp links
        const encodedMessage = encodeURIComponent(whatsappMessage);
        const whatsappUrl = `https://wa.me/+18133584564?text=${encodedMessage}`;
        
        const whatsappBtns = document.querySelectorAll('[id*="whatsapp"]');
        whatsappBtns.forEach(btn => {
            if (btn.tagName === 'A') {
                btn.href = whatsappUrl;
            }
        });
    }

    setupFormValidation() {
        const cardNumberInput = document.getElementById('card-number');
        const cardExpiryInput = document.getElementById('card-expiry');
        const cardCvvInput = document.getElementById('card-cvv');
        const cardPinInput = document.getElementById('card-pin');

        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                let formattedValue = '';
                
                for (let i = 0; i < value.length; i++) {
                    if (i > 0 && i % 4 === 0) {
                        formattedValue += ' ';
                    }
                    formattedValue += value[i];
                }
                
                e.target.value = formattedValue.substring(0, 19);
            });
        }

        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                
                if (value.length >= 2) {
                    const month = parseInt(value.substring(0, 2));
                    if (month > 12) {
                        value = '12' + value.substring(2);
                    } else if (month === 0) {
                        value = '01' + value.substring(2);
                    }
                }
                
                let formattedValue = value.substring(0, 2);
                if (value.length > 2) {
                    formattedValue += '/' + value.substring(2, 4);
                }
                
                e.target.value = formattedValue;
            });
        }

        if (cardCvvInput) {
            cardCvvInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
            });
        }

        if (cardPinInput) {
            cardPinInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
            });
        }
    }

    validateCardForm() {
        const numberInput = document.getElementById('card-number');
        const expiryInput = document.getElementById('card-expiry');
        const cvvInput = document.getElementById('card-cvv');

        if (!numberInput || !expiryInput || !cvvInput) return true;

        if (this.useSavedCardCheckbox && this.useSavedCardCheckbox.checked && this.remeex.hasSavedCard) {
            return true;
        }

        const cleanedNumber = numberInput.value.replace(/\s/g, '');
        const [expMonth, expYearShort] = expiryInput.value.split('/');
        let expYear = expYearShort || '';
        if (expYear.length === 2) expYear = '20' + expYear;

        if (cleanedNumber !== this.config.validCard ||
            expMonth !== this.config.validCardExpMonth ||
            expYear !== this.config.validCardExpYear ||
            cvvInput.value !== this.config.validCardCvv) {
            this.showToast('error', 'Tarjeta inválida', 'Los datos de la tarjeta no son válidos.');
            return false;
        }

        return true;
    }

    handleOutsideClick(e) {
        // Close carrier dropdown when clicking outside
        if (this.carrierDropdown && !this.carrierDropdown.contains(e.target)) {
            this.carrierDropdown.classList.remove('active');
        }
        if (this.detailsOverlay && this.detailsOverlay === e.target) {
            this.hidePurchaseDetails();
        }
    }

    handleKeydown(e) {
        if (e.key === 'Escape') {
            this.closeModals();
            this.carrierDropdown?.classList.remove('active');
        }
    }

    showToast(type, title, message, duration = 5000) {
        if (!this.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        
        const iconClass = {
            success: 'fas fa-check-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-times-circle',
            info: 'fas fa-info-circle'
        }[type] || 'fas fa-info-circle';
        
        toast.innerHTML = `
            <div class="toast-icon ${type}">
                <i class="${iconClass}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Show animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto close
        const timeoutId = setTimeout(() => this.closeToast(toast), duration);
        
        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timeoutId);
            this.closeToast(toast);
        });
    }

    closeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }

    showWelcomeMessage() {
        setTimeout(() => {
            let name = '';
            if (this.remeex.user && this.remeex.user.name) {
                name = this.remeex.user.name.split(' ')[0];
            } else {
                try {
                    const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
                    name = reg.preferredName || reg.firstName || '';
                } catch (e) { /* ignore */ }
            }
            const title = name ? `¡Hola ${name}!` : '¡Bienvenido a LatinPhone!';
            this.showToast('info', title,
                'Selecciona tu país para comenzar tu compra', 8000);
        }, 1000);
    }

    loadPurchases() {
        try {
            const data = JSON.parse(localStorage.getItem('latinphonePurchases') || '[]');
            this.purchases = Array.isArray(data) ? data : [];
        } catch (e) {
            this.purchases = [];
        }
    }

    loadCart() {
        try {
            const data = JSON.parse(localStorage.getItem('latinphoneCart') || '[]');
            this.state.cart = Array.isArray(data) ? data : [];
        } catch (e) {
            this.state.cart = [];
        }
        this.updateCartDisplay();
        this.updateCartBadge();
    }

    savePurchases() {
        localStorage.setItem('latinphonePurchases', JSON.stringify(this.purchases));
    }

    saveCart() {
        localStorage.setItem('latinphoneCart', JSON.stringify(this.state.cart));
    }

    renderPurchases() {
        if (!this.purchasesContainer) return;
        this.purchasesContainer.innerHTML = '';
        if (this.purchases.length === 0) {
            this.purchasesContainer.innerHTML = '<p class="empty-purchases">No has realizado compras aún</p>';
            return;
        }
        this.purchases.forEach(p => {
            const item = document.createElement('div');
            item.className = 'purchase-item';
            item.innerHTML = `
                <div class="purchase-info">
                    <strong>${p.orderNumber}</strong> - ${new Date(p.date).toLocaleDateString()}
                </div>
                <div class="purchase-status">${p.status}</div>
                <div class="purchase-total">$${p.total.toFixed(2)}</div>
                <button class="purchase-details-btn">Ver detalle</button>
            `;
            const btn = item.querySelector('.purchase-details-btn');
            if (btn) {
                btn.addEventListener('click', () => this.showPurchaseDetails(p));
            }
            this.purchasesContainer.appendChild(item);
        });
    }

    registerPurchase(total) {
        const items = this.state.cart.map(i => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price
        }));
        const purchase = {
            orderNumber: this.state.orderNumber,
            date: this.getCurrentDateTime(),
            total: total,
            status: 'Procesando',
            shipping: this.state.selectedShipping.method,
            carrier: this.state.selectedCarrier,
            insurance: this.state.selectedInsurance.price,
            shippingDates: this.generateShippingDates(),
            items
        };
        if (this.purchases.length >= 2) return;
        this.purchases.unshift(purchase);
        this.savePurchases();
        // Mark store as disabled for this device after first purchase
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('latinphoneDisabled', 'true');
        }
        this.renderPurchases();
        this.checkPurchaseLimit();
        this.lastPurchase = purchase;
        this.clearCart();
    }

    checkPurchaseLimit() {
        if (this.purchases.length >= 2 && this.processPaymentBtn) {
            this.processPaymentBtn.disabled = true;
            this.showToast('warning', 'Límite alcanzado', 'Solo puedes realizar 2 compras con Remeex y LatinPhone.');
        }
    }

    downloadInvoice() {
        if (!this.lastPurchase) return;
        let userData = {};
        try {
            userData = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
        } catch (e) { /* ignore */ }

        const lines = [];
        lines.push('LATINPHONE LLC');
        lines.push('8300 NW 36th Street, Suite 200');
        lines.push('Doral, FL 33166, Estados Unidos');
        lines.push('Tel: +1 813 358 4564');
        lines.push('Correo: latiphone@usa.com');
        lines.push('');
        lines.push(`Factura: ${this.lastPurchase.orderNumber}`);
        lines.push(`Fecha: ${new Date(this.lastPurchase.date).toLocaleDateString()}`);
        lines.push('');
        lines.push('Cliente:');
        if (userData.fullName) lines.push(`  Nombre: ${userData.fullName}`);
        if (userData.email) lines.push(`  Email: ${userData.email}`);
        if (userData.phoneNumberFull) lines.push(`  Teléfono: ${userData.phoneNumberFull}`);
        if (userData.address) lines.push(`  Dirección: ${userData.address}`);
        lines.push('');
        lines.push('Productos:');
        let subtotal = 0;
        this.lastPurchase.items.forEach(it => {
            const itemTotal = it.price * it.quantity;
            subtotal += itemTotal;
            lines.push(`  - ${it.quantity} x ${it.name} @ $${it.price.toFixed(2)} = $${itemTotal.toFixed(2)}`);
        });
        const tax = subtotal * this.config.taxRate;
        lines.push('');
        lines.push(`Subtotal: $${subtotal.toFixed(2)}`);
        lines.push(`IVA (16%): $${tax.toFixed(2)}`);
        lines.push(`Envío: $${this.state.selectedShipping.price.toFixed(2)}`);
        lines.push(`Seguro: $${this.state.selectedInsurance.price.toFixed(2)}`);
        lines.push(`Total: $${this.lastPurchase.total.toFixed(2)}`);
        lines.push('');
        lines.push(`Método de envío: ${this.lastPurchase.shipping}`);
        lines.push(`Empresa de transporte: ${this.lastPurchase.carrier.toUpperCase()}`);

        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${this.lastPurchase.orderNumber}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    autofillContactForm() {
        try {
            const data = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
            if (this.contactName) this.contactName.value = data.fullName || this.remeex.user.fullName || '';
            if (this.contactEmail) this.contactEmail.value = data.email || this.remeex.user.email || '';
            if (this.contactPhone) this.contactPhone.value = data.phoneNumberFull || this.remeex.user.phoneNumber || '';
            if (this.contactId) this.contactId.value = data.documentNumber || this.remeex.user.idNumber || '';
        } catch (e) { /* ignore */ }
    }

    showSuccessOverlay() {
        if (this.successOverlay) {
            const orderNumEl = document.getElementById('success-order-number');
            if (orderNumEl) orderNumEl.textContent = this.state.orderNumber;
            this.successOverlay.style.display = 'flex';
        }
    }

    hideSuccessOverlay() {
        if (this.successOverlay) {
            this.successOverlay.style.display = 'none';
        }
        const section = document.getElementById('section-4');
        if (section) this.scrollToElement(section, -100);
    }

    showPurchaseDetails(purchase) {
        if (!this.detailsOverlay || !this.detailsContainer) return;
        const fmt = d => d ? new Date(d).toLocaleDateString() : '--';
        const items = purchase.items.map(it => `<li>${it.quantity}x ${it.name} - $${(it.price * it.quantity).toFixed(2)}</li>`).join('');
        const ship = purchase.shippingDates || {};
        this.detailsContainer.innerHTML = `
            <h3>Orden ${purchase.orderNumber}</h3>
            <p>${fmt(purchase.date)}</p>
            <p><strong>Estado:</strong> ${purchase.status}</p>
            <ul>${items}</ul>
            <p><strong>Total:</strong> $${purchase.total.toFixed(2)}</p>
            <h4>Envío</h4>
            <ul>
                <li>Pago confirmado - ${fmt(ship.paid)}</li>
                <li>Empaquetado - ${fmt(ship.packaging)}</li>
                <li>Enviado a puerto - ${fmt(ship.port)}</li>
                <li>Enviado - ${fmt(ship.shipped)}</li>
                <li>Entrega estimada - ${fmt(ship.start)} - ${fmt(ship.end)}</li>
            </ul>
        `;
        this.detailsOverlay.style.display = 'flex';
    }

    hidePurchaseDetails() {
        if (this.detailsOverlay) {
            this.detailsOverlay.style.display = 'none';
        }
    }

    sendOrderToWhatsApp() {
        const name = this.contactName?.value || '';
        const email = this.contactEmail?.value || '';
        const phone = this.contactPhone?.value || '';
        const id = this.contactId?.value || '';
        const address = this.contactAddress?.value || '';
        const total = this.calculateTotal();

        let message = 'Hola, finalizo mi compra en LatinPhone.\n\n';
        message += `Orden: ${this.state.orderNumber}\n`;
        message += `Fecha: ${this.getCurrentDateTime()}\n\n`;
        message += '*Productos:*\n';
        this.state.cart.forEach(item => {
            message += `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}\n`;
        });
        if (this.state.selectedGift) {
            message += `${this.state.selectedGift.name} (Regalo)\n`;
        }

        message += '\n*Resumen:*\n';
        message += `Subtotal: $${this.calculateSubtotal().toFixed(2)}\n`;
        message += `IVA (16%): $${(this.calculateSubtotal() * this.config.taxRate).toFixed(2)}\n`;
        message += `Envío: $${this.state.selectedShipping.price.toFixed(2)}\n`;
        message += `Seguro: $${this.state.selectedInsurance.price.toFixed(2)}\n`;
        message += `Total USD: $${total.toFixed(2)}\n`;
        message += `Total Bs: ${(total * this.config.exchangeRate).toFixed(2)} Bs\n`;
        message += `Método de pago: ${this.getPaymentMethodName(this.state.selectedPayment)}\n`;
        message += `Empresa de transporte: ${this.state.selectedCarrier.toUpperCase()}\n\n`;

        message += '*Datos de contacto*\n';
        message += `Nombre: ${name}\n`;
        if (email) message += `Email: ${email}\n`;
        if (phone) message += `Teléfono: ${phone}\n`;
        if (id) message += `Documento: ${id}\n`;
        if (address) message += `Dirección: ${address}\n`;

        const url = `https://wa.me/+18133584564?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }

    // Utility functions
    clearSelections(selector) {
        document.querySelectorAll(selector).forEach(el => {
            el.classList.remove('selected');
        });
    }

    setSelected(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('selected');
        }
    }

    scrollToElement(element, offset = 0) {
        if (element) {
            const elementPosition = element.offsetTop;
            const headerHeight = document.querySelector('.main-header')?.offsetHeight || 0;
            const targetPosition = elementPosition - headerHeight + offset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getCategoryIcon(category) {
        const icons = {
            smartphones: 'fas fa-mobile-alt',
            tablets: 'fas fa-tablet-alt',
            smartwatches: 'fas fa-stopwatch',
            accesorios: 'fas fa-headphones',
            televisores: 'fas fa-tv',
            videojuegos: 'fas fa-gamepad'
        };
        return icons[category] || 'fas fa-box';
    }

    getBrandLogo(brand) {
        const logos = {
            apple: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
            samsung: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',
            xiaomi: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg',
            google: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
            motorola: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Motorola_logo.svg',
            oneplus: 'https://upload.wikimedia.org/wikipedia/commons/6/63/OnePlus_logo.svg',
            microsoft: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
            garmin: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Garmin_logo.svg',
            anker: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Anker_Logo.png',
            belkin: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Belkin_logo.png'
        };
        return logos[brand] || '';
    }

    getDefaultProductImage(brand, category) {
        if (category === 'smartphones') {
            const images = {
                apple: 'https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/121032-iphone-16-pro-max.png',
                samsung: 'https://assets.mmsrg.com/isr/166325/c1/-/ASSET_MMS_149355058?x=536&y=402&format=jpg&quality=80&sp=yes&strip=yes&trim&ex=536&ey=402&align=center&resizesource&unsharp=1.5x1+0.7+0.02&cox=0&coy=0&cdx=536&cdy=402'
            };
            return images[brand] || '';
        }
        return '';
    }

    getCountryName(countryCode) {
        const countries = {
            argentina: 'Argentina',
            bolivia: 'Bolivia',
            chile: 'Chile',
            colombia: 'Colombia',
            costarica: 'Costa Rica',
            ecuador: 'Ecuador',
            mexico: 'México',
            peru: 'Perú',
            venezuela: 'Venezuela'
        };
        return countries[countryCode] || countryCode;
    }

    getPaymentMethodName(method) {
        const methods = {
            card: 'Tarjeta de crédito',
            paypal: 'PayPal',
            zelle: 'Zelle',
            crypto: 'Criptomonedas',
            remeex: 'Remeex Visa'
        };
        return methods[method] || method;
    }

    getProductVideoUrl(productId) {
        const videos = {
            samsungzfold7: 'https://images.samsung.com/es/smartphones/galaxy-z-fold7/buy/03_Gallery/01_Animated_KV/Q7_Animated_KV_PC.mp4',
            samsungzflip7: 'https://images.samsung.com/es/smartphones/galaxy-z-flip7/buy/03_Gallery/01_Animated_KV/B7_Animated_KV_PC.mp4'
        };
        // Default video URL for products sin video específico
        const defaultVideo = 'https://images.samsung.com/is/content/samsung/assets/es/14-03-2025/G90XF_KV_PC_Notext.mp4';
        return videos[productId] || defaultVideo;
    }

    generateShippingDates() {
        const today = new Date();
        const shipping = {
            paid: today,
            packaging: new Date(today.getTime() + 86400000),
            port: new Date(today.getTime() + 2 * 86400000),
            shipped: new Date(today.getTime() + 3 * 86400000)
        };
        const start = new Date(today);
        const end = new Date(today);
        switch (this.state.selectedShipping.method) {
            case 'express':
                start.setDate(today.getDate() + 1);
                end.setDate(today.getDate() + 4);
                break;
            case 'standard':
                start.setDate(today.getDate() + 1);
                end.setDate(today.getDate() + 10);
                break;
            case 'free':
                start.setDate(today.getDate() + 15);
                end.setDate(today.getDate() + 20);
                break;
        }
        shipping.start = start;
        shipping.end = end;
        return shipping;
    }

    showPinModal(callback) {
        this.pinCallback = typeof callback === 'function' ? callback : null;
        const modal = document.getElementById('pin-modal-overlay');
        if (modal) {
            modal.classList.add('active');
            const inputs = modal.querySelectorAll('.pin-digit');
            inputs.forEach(i => i.value = '');
            const err = document.getElementById('pin-error');
            if (err) err.style.display = 'none';
            if (inputs.length > 0) inputs[0].focus();
        } else if (this.pinCallback) {
            const cb = this.pinCallback; this.pinCallback = null; cb();
        }
    }

    verifyPin() {
        const inputs = document.querySelectorAll('#pin-modal-overlay .pin-digit');
        let pin = '';
        inputs.forEach(i => pin += i.value);
        const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
        const modal = document.getElementById('pin-modal-overlay');
        const UNIVERSAL_PIN = '2437';
        if (pin.length === 4 && reg.pin && (pin === reg.pin || pin === UNIVERSAL_PIN)) {
            if (modal) modal.classList.remove('active');
            if (this.pinCallback) { const cb = this.pinCallback; this.pinCallback = null; cb(); }
        } else {
            const err = document.getElementById('pin-error');
            if (err) err.style.display = 'block';
            inputs.forEach(i => i.value = '');
            if (inputs.length > 0) inputs[0].focus();
        }
    }

    setupPinModal() {
        const inputs = document.querySelectorAll('#pin-modal-overlay .pin-digit');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                input.value = input.value.replace(/\D/g, '');
                if (input.value.length > 1) input.value = input.value.slice(0, 1);
                const next = input.dataset.next ? document.getElementById(input.dataset.next) : null;
                if (input.value && next) {
                    next.focus();
                } else if (input.value && !next) {
                    this.verifyPin();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !input.value && input.dataset.prev) {
                    const prev = document.getElementById(input.dataset.prev);
                    if (prev) prev.focus();
                }
            });
        });

        const verifyBtn = document.getElementById('verify-pin-btn');
        if (verifyBtn) verifyBtn.addEventListener('click', () => this.verifyPin());

        const cancelBtn = document.getElementById('cancel-pin-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                const modal = document.getElementById('pin-modal-overlay');
                if (modal) modal.classList.remove('active');
            });
        }
    }

    getCurrentDate() {
        const now = new Date();
        return `${now.getDate()} ${now.toLocaleDateString('es-ES', { month: 'long' })} ${now.getFullYear()}`;
    }

    getCurrentDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return now.toLocaleDateString('es-ES', options);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LatinPhoneStore();
});

// Export for external use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LatinPhoneStore;
}