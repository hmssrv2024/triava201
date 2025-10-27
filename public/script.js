document.addEventListener('DOMContentLoaded', function() {
    // Variables originales
    const navbar = document.querySelector('.navbar');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const sliderTrack = document.querySelector('.slider-track');
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');
    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoSlideInterval;
    
    // Variables nuevas
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeMenuBtn = document.querySelector('.close-menu');
    const searchToggle = document.getElementById('search-toggle');
    const searchBar = document.querySelector('.search-bar');
    const menuOverlay = document.createElement('div');
    menuOverlay.className = 'menu-overlay';
    document.body.appendChild(menuOverlay);
    
    // WhatsApp Widget
    const whatsappTrigger = document.querySelector('.whatsapp-trigger');
    const whatsappWidget = document.querySelector('.whatsapp-widget');
    const whatsappClose = document.querySelector('.whatsapp-widget-close');
    const whatsappInput = document.querySelector('.whatsapp-widget-footer input');
    const sendButton = document.querySelector('.send-button');
    
    // Función para verificar si un elemento está en el viewport (mantener original)
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Inicializar la reproducción de videos solo cuando están en el viewport (mantener original)
    function initVideoPlayback() {
        const videos = document.querySelectorAll('video');
        
        // Configurar opciones de IntersectionObserver
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        // Crear el observer
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                // Si el video está en el viewport
                if (entry.isIntersecting) {
                    try {
                        entry.target.play();
                    } catch (err) {
                        console.log("Error al reproducir el video:", err);
                    }
                } else {
                    entry.target.pause();
                }
            });
        }, options);
        
        // Observar cada video
        videos.forEach(video => observer.observe(video));
    }
    
    // Menú móvil
    function toggleMobileMenu() {
        mobileMenu.classList.toggle('active');
        menuOverlay.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    }
    
    function closeMobileMenu() {
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Alternar barra de búsqueda
    function toggleSearchBar() {
        searchBar.classList.toggle('active');
        if (searchBar.classList.contains('active')) {
            searchBar.querySelector('input').focus();
        }
    }
    
    // WhatsApp Widget
    function toggleWhatsappWidget() {
        whatsappWidget.classList.toggle('active');
        if (whatsappWidget.classList.contains('active')) {
            setTimeout(() => {
                whatsappInput.focus();
            }, 300);
        }
    }
    
    function closeWhatsappWidget() {
        whatsappWidget.classList.remove('active');
    }
    
    function sendWhatsappMessage() {
        // Redireccionar a WhatsApp con el texto del input
        const message = whatsappInput.value.trim();
        if (message) {
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/13183584564?text=${encodedMessage}`, '_blank');
            whatsappInput.value = '';
        } else {
            window.open('https://wa.me/13183584564', '_blank');
        }
    }
    
    // Funciones para tabs en la página de información
    function initTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        // Verificar si estamos en la página de información
        if (tabButtons.length === 0) return;
        
        // Ver si hay un tab en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        
        // Inicializar el tab activo basado en el parámetro de URL o el primero por defecto
        let activeTabIndex = 0;
        
        if (tabParam) {
            tabButtons.forEach((btn, index) => {
                if (btn.dataset.tab === tabParam) {
                    activeTabIndex = index;
                }
            });
        }
        
        // Activar el tab inicial
        tabButtons[activeTabIndex].classList.add('active');
        tabContents[activeTabIndex].classList.add('active');
        
        // Event listeners para los botones de tab
        tabButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                // Desactivar todos los tabs
                tabButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Activar el tab seleccionado
                btn.classList.add('active');
                tabContents[index].classList.add('active');
                
                // Actualizar la URL sin recargar la página
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('tab', btn.dataset.tab);
                window.history.pushState({}, '', newUrl);
            });
        });
    }
    
    // Funciones para FAQ en la página de soporte
    function initFaq() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        // Verificar si estamos en la página de soporte
        if (faqQuestions.length === 0) return;
        
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                question.classList.toggle('active');
                answer.classList.toggle('active');
            });
        });
    }
    
    // Función para inicializar el formulario de rastreo
    function initTracking() {
        const trackingForm = document.querySelector('.tracking-form');
        const trackingResult = document.querySelector('.tracking-result');
        
        // Verificar si estamos en la página de rastreo
        if (!trackingForm) return;
        
        trackingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const trackingNumber = document.getElementById('tracking-number').value;
            
            // Simulación de búsqueda (en producción, esto sería una llamada a una API)
            if (trackingNumber) {
                // Mostrar un loader
                document.querySelector('.tracking-form-container').innerHTML = '<div class="spinner"></div><p>Buscando información de tu pedido...</p>';
                
                // Simular tiempo de carga
                setTimeout(() => {
                    trackingResult.classList.add('active');
                    document.querySelector('.tracking-form-container').style.display = 'none';
                    
                    // Actualizar el número de pedido en el resultado
                    document.querySelector('.tracking-number').textContent = trackingNumber;
                }, 1500);
            }
        });
    }
    
    // Funciones originales (mantener)
    function updateSlider() {
        sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateSlider();
    }
    
    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateSlider();
    }
    
    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, 5000);
    }
    
    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }
    
    function handleScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
    
    function animateOnScroll() {
        const elementsToAnimate = document.querySelectorAll('.feature-row, .product-card, .category-card');

        elementsToAnimate.forEach(element => {
            if (isInViewport(element) && !element.classList.contains('animated')) {
                element.classList.add('animated');
            }
        });
    }

    // Guardar el producto seleccionado antes de ir a latinphonestore.html
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('tr');
            if (row) {
                const nameEl = row.querySelector('.product-name');
                if (nameEl) {
                    localStorage.setItem('selectedProduct', nameEl.textContent.trim());
                }
            }
        });
    });
    
    // Event Listeners
    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMobileMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', closeMobileMenu);
    if (searchToggle) searchToggle.addEventListener('click', toggleSearchBar);
    if (whatsappTrigger) whatsappTrigger.addEventListener('click', toggleWhatsappWidget);
    if (whatsappClose) whatsappClose.addEventListener('click', closeWhatsappWidget);
    if (sendButton) sendButton.addEventListener('click', sendWhatsappMessage);
    if (whatsappInput) {
        whatsappInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendWhatsappMessage();
            }
        });
    }
    
    // Event Listeners originales
    if (prevBtn) prevBtn.addEventListener('click', () => {
        stopAutoSlide();
        prevSlide();
        startAutoSlide();
    });
    
    if (nextBtn) nextBtn.addEventListener('click', () => {
        stopAutoSlide();
        nextSlide();
        startAutoSlide();
    });
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', animateOnScroll);
    
    // Soporte para swipe en dispositivos móviles (mantener original)
    let touchStartX = 0;
    let touchEndX = 0;
    
    if (sliderTrack) {
        sliderTrack.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        sliderTrack.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }
    
    function handleSwipe() {
        if (touchEndX < touchStartX - 50) {
            // Swipe a la izquierda
            stopAutoSlide();
            nextSlide();
            startAutoSlide();
        }
        
        if (touchEndX > touchStartX + 50) {
            // Swipe a la derecha
            stopAutoSlide();
            prevSlide();
            startAutoSlide();
        }
    }
    
    // Inicializar funciones
    handleScroll();
    if (sliderTrack) {
        updateSlider();
        startAutoSlide();
    }
    initVideoPlayback();
    animateOnScroll();
    initTabs();
    initFaq();
    initTracking();
});
