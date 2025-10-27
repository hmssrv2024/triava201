class AndreaAssistant {
    constructor() {
        this.isInitialized = false;
        this.messageHistory = [];
        this.isTyping = false;
        this.connectionStatus = 'connected';
        this.userSession = {
            id: this.generateSessionId(),
            startTime: new Date(),
            messageCount: 0,
            lastActivity: new Date(),
            preferences: {
                theme: 'light',
                language: 'es',
                notifications: true
            }
        };
        
        this.knowledgeBase = this.initializeKnowledgeBase();
        this.responses = this.initializeResponses();
        this.suggestions = this.initializeSuggestions();
        
        this.init();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async init() {
        try {
            await this.showLoadingScreen();
            this.initializeElements();
            this.setupEventListeners();
            this.setupAutoResize();
            this.setupConnectionMonitoring();
            this.preloadImages();
            
            await this.delay(1500); // Simulate loading time
            this.hideLoadingScreen();
            this.isInitialized = true;
            
            this.trackEvent('assistant_initialized', { sessionId: this.userSession.id });
            this.scheduleWelcomeMessage();
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showErrorMessage('Error al inicializar el asistente. Por favor, recarga la página.');
        }
    }

    showLoadingScreen() {
        return new Promise(resolve => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.remove('hidden');
            }
            setTimeout(resolve, 100);
        });
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 350);
        }
    }

    initializeElements() {
        // Main elements
        this.chatContainer = document.getElementById('chatContainer');
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.suggestionsBar = document.getElementById('suggestionsBar');
        this.suggestionsList = document.getElementById('suggestionsList');
        this.charCount = document.getElementById('charCount');
        this.statusText = document.getElementById('statusText');
        
        // Menu elements
        this.menuBtn = document.getElementById('menuBtn');
        this.menuOverlay = document.getElementById('menuOverlay');
        this.closeMenu = document.getElementById('closeMenu');
        
        // Modal elements
        this.feedbackModal = document.getElementById('feedbackModal');
        
        // Toast container
        this.toastContainer = document.getElementById('toastContainer');
        
        // Context menu
        this.contextMenu = document.getElementById('contextMenu');
        
        // Connection status
        this.connectionStatusEl = document.getElementById('connectionStatus');
        
        // Validate essential elements
        if (!this.chatMessages || !this.messageInput || !this.sendButton) {
            throw new Error('Essential DOM elements not found');
        }
    }

    setupEventListeners() {
        // Message input events
        this.messageInput.addEventListener('input', (e) => this.handleInputChange(e));
        this.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.messageInput.addEventListener('paste', (e) => this.handlePaste(e));
        
        // Send button
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        
        // Quick options
        document.querySelectorAll('.quick-option').forEach(option => {
            option.addEventListener('click', (e) => this.handleQuickOption(e));
        });
        
        // Quick actions
        document.querySelectorAll('.quick-action').forEach(action => {
            action.addEventListener('click', (e) => this.handleQuickAction(e));
        });
        
        // Menu events
        this.menuBtn?.addEventListener('click', () => this.showMenu());
        this.closeMenu?.addEventListener('click', () => this.hideMenu());
        this.menuOverlay?.addEventListener('click', (e) => {
            if (e.target === this.menuOverlay) this.hideMenu();
        });
        
        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleMenuAction(e));
        });
        
        // Suggestions
        document.getElementById('closeSuggestions')?.addEventListener('click', () => {
            this.hideSuggestions();
        });
        
        // Modal events
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.hideModal());
        });
        
        // Feedback events
        this.setupFeedbackEvents();
        
        // Context menu
        this.setupContextMenu();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e));
        
        // Visibility change
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        // Online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Resize events
        window.addEventListener('resize', () => this.handleResize());
    }

    setupAutoResize() {
        const input = this.messageInput;
        if (!input) return;
        
        const autoResize = () => {
            input.style.height = 'auto';
            const newHeight = Math.min(input.scrollHeight, 120);
            input.style.height = newHeight + 'px';
        };
        
        input.addEventListener('input', autoResize);
        autoResize();
    }

    setupConnectionMonitoring() {
        setInterval(() => {
            this.checkConnection();
        }, 30000); // Check every 30 seconds
    }

    async checkConnection() {
        try {
            const response = await fetch('/api/health', { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                this.setConnectionStatus('connected');
            } else {
                this.setConnectionStatus('disconnected');
            }
        } catch (error) {
            this.setConnectionStatus('disconnected');
        }
    }

    setConnectionStatus(status) {
        if (this.connectionStatus === status) return;
        
        this.connectionStatus = status;
        
        if (status === 'disconnected') {
            this.showConnectionStatus('Conexión perdida. Reintentando...');
            this.statusText.textContent = 'Desconectado - Reintentando...';
        } else if (status === 'connected') {
            this.hideConnectionStatus();
            this.statusText.textContent = 'En línea - Tiempo de respuesta < 30s';
        }
    }

    showConnectionStatus(message) {
        if (this.connectionStatusEl) {
            this.connectionStatusEl.querySelector('span').textContent = message;
            this.connectionStatusEl.classList.add('show');
        }
    }

    hideConnectionStatus() {
        if (this.connectionStatusEl) {
            this.connectionStatusEl.classList.remove('show');
        }
    }

    preloadImages() {
        const images = [
            'https://via.placeholder.com/48x48/1A1F71/FFFFFF?text=A',
            'https://via.placeholder.com/72x72/1A1F71/FFFFFF?text=A',
            'https://via.placeholder.com/32x32/1A1F71/FFFFFF?text=A'
        ];
        
        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    scheduleWelcomeMessage() {
        setTimeout(() => {
            if (this.messageHistory.length === 0) {
                this.showSuggestions(['validacion', 'seguridad', 'saldo', 'soporte']);
            }
        }, 2000);
    }

    handleInputChange(e) {
        const value = e.target.value;
        const length = value.length;
        
        // Update character count
        if (this.charCount) {
            this.charCount.textContent = length;
            this.charCount.style.color = length > 900 ? 'var(--error)' : 'var(--gray-400)';
        }
        
        // Update send button state
        this.updateSendButtonState(value.trim().length > 0);
        
        // Auto-save draft
        this.saveDraft(value);
        
        // Update activity timestamp
        this.userSession.lastActivity = new Date();
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendMessage();
        } else if (e.key === 'Escape') {
            this.clearInput();
        }
    }

    handlePaste(e) {
        // Prevent pasting images or files
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        if (text) {
            const currentValue = this.messageInput.value;
            const start = this.messageInput.selectionStart;
            const end = this.messageInput.selectionEnd;
            const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
            
            if (newValue.length <= 1000) {
                this.messageInput.value = newValue;
                this.messageInput.setSelectionRange(start + text.length, start + text.length);
                this.handleInputChange({ target: this.messageInput });
            }
        }
    }

    updateSendButtonState(enabled) {
        if (this.sendButton) {
            this.sendButton.disabled = !enabled || this.isTyping;
            
            if (enabled && !this.isTyping) {
                this.sendButton.classList.add('ready');
            } else {
                this.sendButton.classList.remove('ready');
            }
        }
    }

    async handleSendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;
        
        try {
            // Add user message
            this.addMessage(message, 'user');
            this.clearInput();
            
            // Update session
            this.userSession.messageCount++;
            this.userSession.lastActivity = new Date();
            
            // Show typing indicator
            this.showTyping();
            
            // Process message
            const response = await this.processMessage(message);
            
            // Simulate typing delay
            await this.delay(this.calculateTypingDelay(response));
            
            // Hide typing and show response
            this.hideTyping();
            this.addMessage(response.content, 'assistant', response.type);
            
            // Show suggestions if any
            if (response.suggestions && response.suggestions.length > 0) {
                setTimeout(() => {
                    this.showSuggestions(response.suggestions);
                }, 1000);
            }
            
            // Track interaction
            this.trackEvent('message_sent', { 
                messageLength: message.length,
                responseType: response.type,
                sessionId: this.userSession.id
            });
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTyping();
            this.showErrorMessage('Error al procesar el mensaje. Inténtalo de nuevo.');
        }
    }

    calculateTypingDelay(response) {
        const baseDelay = 800;
        const lengthFactor = Math.min(response.content.length * 5, 2000);
        return baseDelay + lengthFactor;
    }

    async processMessage(message) {
        const normalizedMessage = this.normalizeMessage(message);
        const intent = this.detectIntent(normalizedMessage);
        const context = this.getConversationContext();
        
        // Get appropriate response
        let response = this.getResponse(intent, normalizedMessage, context);
        
        // If no specific response found, use AI-like processing
        if (!response) {
            response = this.generateContextualResponse(normalizedMessage, context);
        }
        
        // Add to conversation history
        this.messageHistory.push({
            userMessage: message,
            assistantResponse: response.content,
            intent: intent,
            timestamp: new Date(),
            context: context
        });
        
        return response;
    }

    normalizeMessage(message) {
        return message.toLowerCase()
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/ñ/g, 'n')
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    detectIntent(message) {
        for (const [intent, patterns] of Object.entries(this.knowledgeBase)) {
            for (const pattern of patterns) {
                if (pattern.test(message)) {
                    return intent;
                }
            }
        }
        
        // Fallback intent detection
        if (message.includes('hola') || message.includes('buenos')) return 'greeting';
        if (message.includes('gracias') || message.includes('perfecto')) return 'gratitude';
        if (message.includes('adios') || message.includes('hasta')) return 'farewell';
        if (message.includes('ayuda') || message.includes('soporte')) return 'help';
        
        return 'general';
    }

    getConversationContext() {
        const recentMessages = this.messageHistory.slice(-3);
        const topics = recentMessages.map(msg => msg.intent);
        const hasValidationQuestions = topics.includes('validation');
        const hasSecurityQuestions = topics.includes('security');
        const hasBalanceQuestions = topics.includes('balance');
        
        return {
            recentTopics: topics,
            hasValidationQuestions,
            hasSecurityQuestions,
            hasBalanceQuestions,
            messageCount: this.userSession.messageCount,
            isNewUser: this.userSession.messageCount <= 2
        };
    }

    getResponse(intent, message, context) {
        const responses = this.responses[intent];
        if (!responses) return null;
        
        // Select response based on context
        let selectedResponse;
        
        if (Array.isArray(responses)) {
            selectedResponse = responses[Math.floor(Math.random() * responses.length)];
        } else if (typeof responses === 'function') {
            selectedResponse = responses(message, context);
        } else {
            selectedResponse = responses;
        }
        
        return {
            content: selectedResponse,
            type: intent,
            suggestions: this.getSuggestionsForIntent(intent, context)
        };
    }

    generateContextualResponse(message, context) {
        if (context.isNewUser) {
            return {
                content: this.responses.onboarding(message, context),
                type: 'onboarding',
                suggestions: ['validation', 'security', 'balance', 'help']
            };
        }
        
        return {
            content: this.responses.fallback(message, context),
            type: 'general',
            suggestions: this.getSmartSuggestions(message, context)
        };
    }

    getSuggestionsForIntent(intent, context) {
        const suggestionMap = {
            'validation': ['validation_process', 'validation_documents', 'validation_time'],
            'security': ['security_licenses', 'security_data', 'security_funds'],
            'balance': ['balance_methods', 'balance_limits', 'balance_time'],
            'cards': ['cards_create', 'cards_types', 'cards_limits'],
            'withdrawal': ['withdrawal_methods', 'withdrawal_limits', 'withdrawal_time']
        };
        
        return suggestionMap[intent] || ['help', 'validation', 'security'];
    }

    getSmartSuggestions(message, context) {
        // AI-like suggestion generation based on message content and context
        const suggestions = [];
        
        if (message.includes('dinero') || message.includes('fondos')) {
            suggestions.push('balance', 'withdrawal');
        }
        
        if (message.includes('cuenta') || message.includes('registro')) {
            suggestions.push('validation', 'security');
        }
        
        if (message.includes('tarjeta') || message.includes('compra')) {
            suggestions.push('cards');
        }
        
        if (message.includes('problema') || message.includes('error')) {
            suggestions.push('help', 'support');
        }
        
        // Fill with default suggestions if needed
        while (suggestions.length < 3) {
            const defaults = ['validation', 'security', 'balance', 'help'];
            const unused = defaults.filter(s => !suggestions.includes(s));
            if (unused.length > 0) {
                suggestions.push(unused[0]);
            } else {
                break;
            }
        }
        
        return suggestions.slice(0, 3);
    }

    addMessage(content, sender, type = null) {
        const messageElement = this.createMessageElement(content, sender, type);
        this.chatMessages.appendChild(messageElement);
        
        // Animate message appearance
        requestAnimationFrame(() => {
            messageElement.classList.add('show');
        });
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Update UI state
        if (sender === 'user') {
            this.hideSuggestions();
        }
    }

    createMessageElement(content, sender, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        if (sender === 'assistant') {
            const img = document.createElement('img');
            img.src = 'https://via.placeholder.com/32x32/1A1F71/FFFFFF?text=A';
            img.alt = 'Andrea';
            avatarDiv.appendChild(img);
        } else {
            avatarDiv.textContent = 'TÚ';
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Process content for special formatting
        contentDiv.innerHTML = this.processMessageContent(content, type);
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.formatTime(new Date());
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        
        // Add context menu support
        this.addContextMenuSupport(messageDiv, content);
        
        return messageDiv;
    }

    processMessageContent(content, type) {
        // Basic HTML sanitization and enhancement
        let processedContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
        
        // Add interactive elements based on type
        if (type === 'validation') {
            processedContent += this.addValidationCTA();
        } else if (type === 'security') {
            processedContent += this.addSecurityBadges();
        } else if (type === 'balance') {
            processedContent += this.addBalanceCTA();
        }
        
        return processedContent;
    }

    addValidationCTA() {
        return `
            <div style="margin-top: 16px;">
                <button class="cta-button" onclick="window.assistant.handleValidationCTA()">
                    <i class="fas fa-user-check"></i>
                    Iniciar validación
                </button>
            </div>
        `;
    }

    addSecurityBadges() {
        return `
            <div style="margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="security-badge">
                    <i class="fas fa-shield-check"></i>
                    ISO 27001
                </span>
                <span class="security-badge">
                    <i class="fas fa-certificate"></i>
                    Licencia Bancaria
                </span>
            </div>
        `;
    }

    addBalanceCTA() {
        return `
            <div style="margin-top: 16px;">
                <button class="cta-button secondary" onclick="window.assistant.handleBalanceCTA()">
                    <i class="fas fa-plus-circle"></i>
                    Ver métodos de recarga
                </button>
            </div>
        `;
    }

    addContextMenuSupport(messageElement, content) {
        messageElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY, content);
        });
        
        // Long press support for mobile
        let pressTimer;
        messageElement.addEventListener('touchstart', (e) => {
            pressTimer = setTimeout(() => {
                const touch = e.touches[0];
                this.showContextMenu(touch.clientX, touch.clientY, content);
            }, 500);
        });
        
        messageElement.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });
        
        messageElement.addEventListener('touchmove', () => {
            clearTimeout(pressTimer);
        });
    }

    showContextMenu(x, y, content) {
        if (!this.contextMenu) return;
        
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.classList.add('show');
        this.contextMenu.dataset.content = content;
        
        // Hide menu when clicking elsewhere
        const hideMenu = (e) => {
            if (!this.contextMenu.contains(e.target)) {
                this.contextMenu.classList.remove('show');
                document.removeEventListener('click', hideMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', hideMenu);
        }, 100);
    }

    formatTime(date) {
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showTyping() {
        this.isTyping = true;
        this.updateSendButtonState(false);
        
        if (this.typingIndicator) {
            this.typingIndicator.classList.add('show');
            this.scrollToBottom();
        }
    }

    hideTyping() {
        this.isTyping = false;
        this.updateSendButtonState(this.messageInput.value.trim().length > 0);
        
        if (this.typingIndicator) {
            this.typingIndicator.classList.remove('show');
        }
    }

    showSuggestions(suggestionKeys) {
        if (!this.suggestionsBar || !this.suggestionsList) return;
        
        this.suggestionsList.innerHTML = '';
        
        suggestionKeys.forEach(key => {
            const suggestion = this.suggestions[key];
            if (suggestion) {
                const chip = document.createElement('button');
                chip.className = 'suggestion-chip';
                chip.textContent = suggestion.text;
                chip.addEventListener('click', () => {
                    this.handleSuggestionClick(suggestion.message);
                });
                this.suggestionsList.appendChild(chip);
            }
        });
        
        this.suggestionsBar.classList.add('show');
    }

    hideSuggestions() {
        if (this.suggestionsBar) {
            this.suggestionsBar.classList.remove('show');
        }
    }

    handleSuggestionClick(message) {
        this.messageInput.value = message;
        this.handleInputChange({ target: this.messageInput });
        this.messageInput.focus();
        this.hideSuggestions();
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        });
    }

    clearInput() {
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.handleInputChange({ target: this.messageInput });
        this.clearDraft();
    }

    saveDraft(content) {
        if (content.trim()) {
            localStorage.setItem('remeex_draft', content);
        } else {
            localStorage.removeItem('remeex_draft');
        }
    }

    loadDraft() {
        const draft = localStorage.getItem('remeex_draft');
        if (draft) {
            this.messageInput.value = draft;
            this.handleInputChange({ target: this.messageInput });
        }
    }

    clearDraft() {
        localStorage.removeItem('remeex_draft');
    }

    // Event Handlers
    handleQuickOption(e) {
        const action = e.currentTarget.dataset.action;
        const messages = {
            validation: '¿Cómo puedo validar mi cuenta en Remeex?',
            security: '¿Es seguro usar Remeex? ¿Qué certificaciones tienen?',
            balance: '¿Cómo puedo recargar saldo en mi cuenta?',
            cards: '¿Cómo creo una tarjeta virtual?'
        };
        
        const message = messages[action];
        if (message) {
            this.messageInput.value = message;
            this.handleSendMessage();
        }
    }

    handleQuickAction(e) {
        const message = e.currentTarget.dataset.message;
        if (message) {
            this.messageInput.value = message;
            this.handleSendMessage();
        }
    }

    handleMenuAction(e) {
        const action = e.currentTarget.dataset.action;
        
        switch (action) {
            case 'restart':
                this.restartConversation();
                break;
            case 'transcript':
                this.downloadTranscript();
                break;
            case 'contact':
                this.contactHumanSupport();
                break;
            case 'feedback':
                this.showFeedbackModal();
                break;
        }
        
        this.hideMenu();
    }

    showMenu() {
        if (this.menuOverlay) {
            this.menuOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    hideMenu() {
        if (this.menuOverlay) {
            this.menuOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    showFeedbackModal() {
        if (this.feedbackModal) {
            this.feedbackModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = '';
    }

    setupFeedbackEvents() {
        // Star rating
        document.querySelectorAll('.star').forEach((star, index) => {
            star.addEventListener('click', () => {
                this.setRating(index + 1);
            });
            
            star.addEventListener('mouseenter', () => {
                this.highlightStars(index + 1);
            });
        });
        
        document.querySelector('.stars-rating')?.addEventListener('mouseleave', () => {
            this.highlightStars(this.currentRating || 0);
        });
        
        // Submit feedback
        document.getElementById('submitFeedback')?.addEventListener('click', () => {
            this.submitFeedback();
        });
        
        document.getElementById('skipFeedback')?.addEventListener('click', () => {
            this.hideModal();
        });
    }

    setRating(rating) {
        this.currentRating = rating;
        this.highlightStars(rating);
        
        const ratingTexts = ['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
        const ratingText = document.querySelector('.rating-text');
        if (ratingText) {
            ratingText.textContent = ratingTexts[rating - 1];
        }
    }

    highlightStars(count) {
        document.querySelectorAll('.star').forEach((star, index) => {
            if (index < count) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    submitFeedback() {
        const feedback = {
            rating: this.currentRating,
            comment: document.querySelector('.feedback-form textarea')?.value || '',
            sessionId: this.userSession.id,
            timestamp: new Date()
        };
        
        this.trackEvent('feedback_submitted', feedback);
        this.hideModal();
        this.showToast('success', '¡Gracias!', 'Tu feedback ha sido enviado correctamente.');
    }

    setupContextMenu() {
        document.querySelectorAll('.context-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const content = this.contextMenu.dataset.content;
                
                switch (action) {
                    case 'copy':
                        this.copyToClipboard(content);
                        break;
                    case 'share':
                        this.shareContent(content);
                        break;
                    case 'translate':
                        this.translateContent(content);
                        break;
                }
                
                this.contextMenu.classList.remove('show');
            });
        });
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('success', 'Copiado', 'Texto copiado al portapapeles');
        } catch (error) {
            console.error('Failed to copy:', error);
            this.showToast('error', 'Error', 'No se pudo copiar el texto');
        }
    }

    shareContent(content) {
        if (navigator.share) {
            navigator.share({
                title: 'Conversación con Andrea - Remeex',
                text: content
            });
        } else {
            this.copyToClipboard(content);
        }}

    translateContent(content) {
        // Simulate translation feature
        this.showToast('info', 'Traducción', 'Función de traducción disponible próximamente');
    }

    restartConversation() {
        this.messageHistory = [];
        this.userSession.messageCount = 0;
        this.userSession.startTime = new Date();
        
        // Clear chat messages except welcome section
        const messages = this.chatMessages.querySelectorAll('.message');
        messages.forEach(message => message.remove());
        
        this.clearInput();
        this.hideSuggestions();
        this.showToast('success', 'Conversación reiniciada', 'Puedes comenzar una nueva conversación');
        
        // Show initial suggestions
        setTimeout(() => {
            this.showSuggestions(['validation', 'security', 'balance', 'help']);
        }, 1000);
    }

    downloadTranscript() {
        try {
            const transcript = this.generateTranscript();
            const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `remeex-conversation-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showToast('success', 'Descarga completada', 'Transcripción guardada exitosamente');
        } catch (error) {
            console.error('Failed to download transcript:', error);
            this.showToast('error', 'Error', 'No se pudo descargar la transcripción');
        }
    }

    generateTranscript() {
        let transcript = `Conversación con Andrea - Asistente Virtual Remeex\n`;
        transcript += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n`;
        transcript += `Hora de inicio: ${this.userSession.startTime.toLocaleTimeString('es-ES')}\n`;
        transcript += `ID de sesión: ${this.userSession.id}\n`;
        transcript += `${'='.repeat(50)}\n\n`;
        
        this.messageHistory.forEach((entry, index) => {
            transcript += `[${entry.timestamp.toLocaleTimeString('es-ES')}] USUARIO:\n`;
            transcript += `${entry.userMessage}\n\n`;
            transcript += `[${entry.timestamp.toLocaleTimeString('es-ES')}] ANDREA:\n`;
            transcript += `${entry.assistantResponse.replace(/<[^>]*>/g, '')}\n\n`;
            transcript += `${'-'.repeat(30)}\n\n`;
        });
        
        transcript += `Estadísticas de la conversación:\n`;
        transcript += `- Total de mensajes: ${this.userSession.messageCount}\n`;
        transcript += `- Duración: ${this.getSessionDuration()}\n`;
        transcript += `- Temas principales: ${this.getMainTopics().join(', ')}\n`;
        
        return transcript;
    }

    getSessionDuration() {
        const duration = new Date() - this.userSession.startTime;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }

    getMainTopics() {
        const topics = this.messageHistory.map(entry => entry.intent);
        const topicCounts = {};
        topics.forEach(topic => {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
        
        return Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([topic]) => topic);
    }

    contactHumanSupport() {
        const supportMessage = `
            **Conectando con Soporte Humano**
            
            Te voy a transferir con uno de nuestros especialistas humanos que podrá ayudarte de manera más personalizada.
            
            **Opciones de contacto disponibles:**
            
            📞 **Teléfono:** +1 (800) 123-4567
            💬 **WhatsApp:** +1 (234) 567-8900
            ✉️ **Email:** soporte@remeex.com
            
            **Horarios de atención:**
            - Lunes a Viernes: 8:00 AM - 8:00 PM EST
            - Sábados: 9:00 AM - 5:00 PM EST
            - Domingos: 10:00 AM - 4:00 PM EST
            
            ¿Te gustaría que genere un ticket de soporte con el resumen de nuestra conversación?
        `;
        
        this.addMessage(supportMessage, 'assistant', 'support');
        this.showSuggestions(['support_ticket', 'phone_support', 'email_support']);
    }

    // Global Event Handlers
    handleGlobalKeyDown(e) {
        // Keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'Enter':
                    e.preventDefault();
                    this.handleSendMessage();
                    break;
                case 'r':
                    e.preventDefault();
                    this.restartConversation();
                    break;
                case 'k':
                    e.preventDefault();
                    this.messageInput.focus();
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            this.hideMenu();
            this.hideModal();
            this.hideSuggestions();
            this.contextMenu?.classList.remove('show');
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.userSession.lastActiveTime = new Date();
        } else {
            // User returned to the page
            this.userSession.lastActivity = new Date();
            
            // Check if we need to refresh connection
            if (this.connectionStatus === 'disconnected') {
                this.checkConnection();
            }
        }
    }

    handleOnline() {
        this.setConnectionStatus('connected');
        this.showToast('success', 'Conectado', 'La conexión se ha restaurado');
    }

    handleOffline() {
        this.setConnectionStatus('disconnected');
        this.showToast('warning', 'Sin conexión', 'Modo offline activado');
    }

    handleResize() {
        this.scrollToBottom();
        
        // Hide context menu on resize
        if (this.contextMenu) {
            this.contextMenu.classList.remove('show');
        }
    }

    // CTA Handlers
    handleValidationCTA() {
        const message = 'Quiero iniciar el proceso de validación de mi cuenta. ¿Qué documentos necesito?';
        this.messageInput.value = message;
        this.handleSendMessage();
    }

    handleBalanceCTA() {
        const message = '¿Cuáles son todos los métodos disponibles para recargar saldo?';
        this.messageInput.value = message;
        this.handleSendMessage();
    }

    // Toast System
    showToast(type, title, message, duration = 5000) {
        const toast = this.createToastElement(type, title, message);
        this.toastContainer.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Auto-remove
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
        
        return toast;
    }

    createToastElement(type, title, message) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Cerrar">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add close functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        return toast;
    }

    removeToast(toast) {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    showErrorMessage(message) {
        this.showToast('error', 'Error', message);
    }

    // Utility Functions
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    trackEvent(eventName, data = {}) {
        // Analytics tracking
        console.log('Event tracked:', eventName, data);
        
        // Here you would integrate with your analytics service
        // Example: gtag('event', eventName, data);
        // Example: mixpanel.track(eventName, data);
    }

    // Knowledge Base Initialization
    initializeKnowledgeBase() {
        return {
            greeting: [
                /^(hola|buenos dias|buenas tardes|buenas noches|saludos|hi|hello)/,
                /^(que tal|como estas|como va)/
            ],
            gratitude: [
                /(gracias|thank you|muchas gracias|te agradezco|perfecto|excelente)/,
                /(muy bien|genial|fantastico|increible)/
            ],
            farewell: [
                /(adios|hasta luego|nos vemos|chao|bye|goodbye)/,
                /(me voy|termino|fin|hasta pronto)/
            ],
            validation: [
                /(validar|validacion|verificar|verificacion|autenticar|cuenta)/,
                /(documentos|proceso|kyc|identidad)/,
                /(como valido|que necesito para validar|validar mi cuenta)/,
                /(cuanto cuesta validar|precio validacion|monto validacion)/
            ],
            security: [
                /(seguro|seguridad|confiable|confianza|estafa|fraude)/,
                /(licencia|legal|regulado|certificado)/,
                /(es seguro remeex|es confiable|es legal)/,
                /(proteccion|protege|encriptacion)/
            ],
            balance: [
                /(recargar|agregar fondos|depositar|cargar saldo)/,
                /(metodos de pago|como recargar|formas de pagar)/,
                /(saldo|balance|dinero|fondos)/,
                /(tarjeta credito|transferencia|paypal|zelle)/
            ],
            withdrawal: [
                /(retirar|retiro|sacar dinero|extraer fondos)/,
                /(como retirar|metodos retiro|retirada)/,
                /(no puedo retirar|problemas retiro)/,
                /(tiempo retiro|cuanto tarda)/
            ],
            cards: [
                /(tarjeta virtual|crear tarjeta|tarjeta debito)/,
                /(compras online|ecommerce|amazon)/,
                /(como crear tarjeta|generar tarjeta)/,
                /(limites tarjeta|bloquear tarjeta)/
            ],
            exchange: [
                /(intercambio|cambio|exchange|divisas)/,
                /(dolares|euros|bolivares|peso)/,
                /(tasa cambio|cotizacion|tipo cambio)/
            ],
            support: [
                /(ayuda|soporte|asistencia|problema|error)/,
                /(contacto|telefono|whatsapp|email)/,
                /(hablar con humano|operador|agente)/,
                /(no funciona|falla|bug)/
            ],
            general: [
                /(que es remeex|como funciona|informacion)/,
                /(servicios|productos|empresa)/,
                /(horarios|disponibilidad)/
            ]
        };
    }

    // Response System Initialization
    initializeResponses() {
        return {
            greeting: (message, context) => {
                const hour = new Date().getHours();
                let greeting;
                if (hour < 12) greeting = "¡Buenos días!";
                else if (hour < 18) greeting = "¡Buenas tardes!";
                else greeting = "¡Buenas noches!";
                
                if (context.isNewUser) {
                    return `${greeting} 👋 Soy **Andrea**, tu especialista personal en servicios financieros de Remeex.
                    
Es un placer conocerte. Estoy aquí para ayudarte con todo lo relacionado con nuestra plataforma: validación de cuentas, seguridad, gestión de saldo, tarjetas virtuales y mucho más.

¿En qué puedo ayudarte hoy?`;
                } else {
                    return `${greeting} ¡Qué gusto verte de nuevo! 😊
                    
¿En qué más puedo asistirte?`;
                }
            },

            gratitude: [
                `¡Es un placer ayudarte! 😊 La satisfacción de nuestros usuarios es nuestra máxima prioridad en Remeex.

¿Hay algo más en lo que pueda asistirte?`,
                `¡De nada! Estoy aquí para hacer tu experiencia con Remeex lo más fácil y segura posible.

¿Tienes alguna otra consulta?`,
                `¡Me alegra haber podido ayudarte! Si necesitas cualquier cosa adicional, no dudes en preguntarme.`
            ],

            farewell: [
                `¡Ha sido un placer asistirte! 🌟 Recuerda que estoy disponible 24/7 para cualquier consulta.

Que tengas un excelente día y gracias por confiar en Remeex.`,
                `¡Hasta pronto! 👋 No olvides que puedes contactarme en cualquier momento si necesitas ayuda.

¡Cuídate mucho!`
            ],

            validation: (message, context) => {
                if (message.includes('proceso') || message.includes('como')) {
                    return `**Proceso de Validación de Cuenta - Paso a Paso** ✅

La validación es un proceso **obligatorio** y **gratuito** que nos permite cumplir con las regulaciones financieras internacionales y proteger tu cuenta.

**🔍 Paso 1: Documentación de Identidad**
- Documento oficial vigente (cédula, pasaporte o licencia)
- Fotografía clara en alta resolución
- Todos los datos claramente legibles

**🏠 Paso 2: Verificación de Domicilio**
- Factura de servicios públicos (máximo 3 meses)
- Estado de cuenta bancario
- Contrato de arrendamiento

**📱 Paso 3: Verificación Biométrica**
- Selfie sosteniendo tu documento
- Verificación de vida automática
- Proceso 100% seguro y encriptado

**⏱️ Tiempo de procesamiento:** 24-48 horas típicamente
**💰 Costo:** Completamente gratuito

¿Te gustaría que te explique algún paso en detalle?`;
                }
                
                if (message.includes('documentos')) {
                    return `**Documentos Necesarios para Validación** 📋

**📄 Documento de Identidad (Obligatorio):**
✅ Cédula de identidad nacional  
✅ Pasaporte vigente  
✅ Licencia de conducir (según país)

**🏡 Comprobante de Domicilio (Obligatorio):**
✅ Factura de luz, agua o gas (máx. 3 meses)  
✅ Estado de cuenta bancario  
✅ Contrato de arrendamiento certificado  
✅ Factura de telecomunicaciones

**📸 Requisitos Técnicos:**
- Imágenes en alta resolución (mín. 300 DPI)
- Formato JPG, PNG o PDF (máx. 5MB cada una)
- Sin reflejos, sombras o distorsiones
- Documento completamente visible

**⚠️ Importante:** Todos los documentos deben estar vigentes y mostrar claramente tu nombre completo y dirección actual.

¿Necesitas ayuda con algún documento específico?`;
                }
                
                if (message.includes('tiempo') || message.includes('cuanto tarda')) {
                    return `**Tiempos de Procesamiento de Validación** ⏰

**📊 Tiempo Promedio:** 24-48 horas hábiles

**⚡ Factores que Aceleran:**
- Documentos en alta calidad y perfectamente legibles
- Información consistente en todos los documentos
- Respuesta rápida a solicitudes adicionales

**⏳ Factores que Pueden Retardar:**
- Documentos de baja calidad o poco legibles
- Inconsistencias en la información
- Documentos próximos a vencer
- Necesidad de verificaciones adicionales

**📅 Casos Especiales:**
- Cuentas empresariales: 5-10 días hábiles
- Documentos internacionales: 3-5 días hábiles
- Verificaciones complejas: hasta 7 días hábiles

**🔔 Te mantenemos informado:**
- Notificaciones push en tiempo real
- Emails de actualización de estado
- SMS en momentos clave del proceso

¡No te preocupes! Te notificaremos tan pronto como tu cuenta esté validada.`;
                }
                
                return `**Validación de Cuenta Remeex** 🛡️

La validación es un proceso de seguridad **obligatorio** que nos permite:

✅ Cumplir con regulaciones financieras internacionales  
✅ Proteger tu cuenta contra fraudes  
✅ Garantizar la seguridad de tus fondos  
✅ Ofrecerte límites más altos de transacción

**💡 ¿Sabías que?** Una vez validada tu cuenta, tendrás acceso a todas nuestras funcionalidades premium y límites extendidos.

¿Te gustaría conocer el proceso paso a paso o tienes alguna pregunta específica?`;
            },

            security: (message, context) => {
                if (message.includes('licencia') || message.includes('legal') || message.includes('regulado')) {
                    return `**Licencias y Regulaciones de Remeex** 🏛️

**🏢 Información Corporativa Verificable:**
- **Empresa:** Remeex Financial Technologies Ltd.
- **Registro:** HE-425891 (Chipre)
- **Licencia Bancaria:** FB-2021-158
- **Regulador:** Cyprus Securities and Exchange Commission (CySEC)
- **Auditoría:** PricewaterhouseCoopers (PwC)

**📋 Certificaciones Internacionales:**
🔒 **ISO 27001** - Gestión de Seguridad de la Información  
💳 **PCI DSS Level 1** - Seguridad de Datos de Tarjetas  
🛡️ **SOC 2 Type II** - Controles de Seguridad  
🌍 **GDPR Compliant** - Protección de Datos Personales

**🌐 Oficinas Físicas Verificables:**
- **Sede Principal:** Nicosia, Chipre
- **Oficina Regional:** Londres, Reino Unido  
- **Centro de Operaciones:** Miami, Estados Unidos

**🏆 Reconocimientos 2024:**
- Best Digital Banking Platform - FinTech Awards
- Outstanding Security Implementation - Cybersecurity Excellence
- Top Customer Trust Rating - Financial Services Review

Toda nuestra información legal es **verificable públicamente** en los registros oficiales.`;
                }
                
                if (message.includes('datos') || message.includes('informacion') || message.includes('proteccion')) {
                    return `**Protección de Datos y Privacidad** 🔐

**🛡️ Encriptación de Nivel Militar:**
- **AES-256** para datos almacenados
- **TLS 1.3** para transmisión de datos
- **Hashing SHA-256** para contraseñas
- **End-to-end encryption** en comunicaciones críticas

**🔒 Medidas de Seguridad Activas:**
- Autenticación multi-factor (2FA/MFA)
- Monitoreo 24/7 con IA anti-fraude
- Detección de patrones sospechosos en tiempo real
- Cold storage para fondos (95% offline)

**📊 Cumplimiento Normativo:**
✅ **GDPR** - Reglamento General de Protección de Datos  
✅ **CCPA** - Ley de Privacidad del Consumidor de California  
✅ **PCI DSS** - Estándar de Seguridad de Datos  
✅ **SOX** - Ley Sarbanes-Oxley

**🚫 Lo que NUNCA hacemos:**
❌ Vender tu información personal
❌ Compartir datos sin tu consentimiento
❌ Almacenar información innecesaria
❌ Acceder a tus fondos sin autorización

**💰 Protección de Fondos:**
- Seguros de hasta $250,000 USD por cuenta
- Fondos segregados en bancos tier-1
- Auditorías externas trimestrales

Tu privacidad y seguridad son nuestra máxima prioridad.`;
                }
                
                return `**Seguridad y Confiabilidad de Remeex** 🛡️

¡Excelente pregunta! La seguridad es nuestra máxima prioridad.

**✅ ¿Por qué Remeex es 100% Seguro?**

🏛️ **Regulación Oficial:** Licencia bancaria válida en múltiples jurisdicciones  
🔒 **Encriptación Militar:** Tecnología AES-256 y TLS 1.3  
🏆 **Certificaciones:** ISO 27001, PCI DSS, SOC 2 Type II  
💰 **Fondos Protegidos:** Seguros hasta $250,000 USD por cuenta  
👥 **150,000+ usuarios** confían en nosotros diariamente

**🔍 Verificación Independiente:**
- Puedes consultar nuestras licencias en CySEC
- Estados financieros auditados públicamente disponibles
- Oficinas físicas verificables en 3 países

**⚡ Diferencias vs. Estafas:**
✅ Nosotros: Licencias verificables, oficinas físicas, auditorías públicas  
❌ Estafas: Sin licencias reales, información oculta, promesas irreales

¿Te gustaría ver alguna certificación específica o tienes dudas sobre algún aspecto de seguridad?`;
            },

            balance: (message, context) => {
                if (message.includes('metodos') || message.includes('como recargar') || message.includes('formas')) {
                    return `**Métodos de Recarga Disponibles** 💳

**💳 Tarjetas de Crédito/Débito:**
- Visa, Mastercard, American Express
- Procesamiento: Inmediato
- Comisión: 2.9% + $0.30
- Límites: $10 - $10,000

**🏦 Transferencia Bancaria:**
- SEPA (Europa), ACH (USA), SWIFT (Internacional)
- Procesamiento: 1-3 días hábiles
- Comisión: $5 fijo
- Límites: $100 - $100,000

**📱 Pagos Móviles:**
- Zelle, PayPal, Apple Pay, Google Pay
- Procesamiento: 5-15 minutos
- Comisión: 1.5%
- Límites: $5 - $5,000

**₿ Criptomonedas:**
- Bitcoin, Ethereum, USDT, USDC
- Procesamiento: 10-60 minutos
- Comisión: 1.0%
- Límites: $25 - $50,000

**🌍 Disponibilidad Regional:**
- **América:** Todos los métodos
- **Europa:** Todos + SEPA prioritario
- **Asia-Pacífico:** Métodos seleccionados
- **Otros:** Consultar disponibilidad

¿Te gustaría información detallada sobre algún método específico?`;
                }
                
                if (message.includes('limites') || message.includes('maximo') || message.includes('minimo')) {
                    return `**Límites de Recarga por Nivel de Cuenta** 📊

**👤 Cuenta Sin Validar:**
- Diario: $500
- Mensual: $2,000
- Anual: $10,000
- Restricciones: Solo métodos básicos

**✅ Cuenta Validada Básica:**
- Diario: $5,000
- Mensual: $25,000
- Anual: $100,000
- Beneficios: Todos los métodos disponibles

**⭐ Cuenta Premium:**
- Diario: $25,000
- Mensual: $100,000
- Anual: $500,000
- Beneficios: Comisiones reducidas, soporte prioritario

**🏢 Cuenta Empresarial:**
- Diario: $100,000
- Mensual: $1,000,000
- Anual: Sin límite
- Beneficios: API dedicada, gerente de cuenta

**📈 Aumento Automático de Límites:**
Los límites pueden incrementarse automáticamente basándose en:
- Historial de transacciones positivo
- Verificaciones adicionales
- Documentación de fuente de fondos
- Actividad comercial comprobada

¿Te gustaría validar tu cuenta para acceder a límites más altos?`;
                }
                
                return `**Gestión de Saldo en Remeex** 💰

¡Perfecto! Te ayudo con todo lo relacionado con tu saldo.

**🚀 Métodos de Recarga Rápidos:**
💳 **Tarjetas:** Inmediato - Visa, Mastercard, AMEX  
🏦 **Transferencias:** 1-3 días - Mayor seguridad  
📱 **Móviles:** 5-15 min - PayPal, Zelle, Apple Pay  
₿ **Crypto:** 10-60 min - BTC, ETH, USDT

**✨ Beneficios de Recargar:**
- Procesamiento seguro y encriptado
- Confirmación inmediata por email/SMS
- Historial detallado de transacciones
- Soporte 24/7 para cualquier problema

**🔒 Seguridad Garantizada:**
Todos los métodos cumplen con estándares PCI DSS y están protegidos por seguros bancarios.

¿Qué método te interesa más o tienes alguna pregunta específica sobre recargas?`;
            },

            withdrawal: (message, context) => {
                if (message.includes('como retirar') || message.includes('proceso')) {
                    return `**Guía Completa para Retirar Fondos** 💸

**📋 Requisitos Previos:**
✅ Cuenta completamente validada (KYC)  
✅ Saldo suficiente disponible  
✅ Método de retiro configurado  
✅ Cumplimiento con límites diarios

**🔄 Proceso Paso a Paso:**

**1️⃣ Verificar Elegibilidad**
- Confirma que tu cuenta esté validada
- Revisa tu saldo disponible vs. total
- Verifica que no tengas transacciones pendientes

**2️⃣ Iniciar Retiro**
- Ve a la sección "Retirar" en tu app
- Selecciona el método preferido
- Especifica el monto a retirar
- Revisa las comisiones aplicables

**3️⃣ Autenticación de Seguridad**
- Confirma con autenticación 2FA
- Verifica por SMS o email
- Completa verificación biométrica (si está activada)

**4️⃣ Procesamiento**
- Recibe confirmación inmediata
- Monitorea el estado en tiempo real
- Recibe notificaciones de progreso

**⏰ Tiempos de Procesamiento:**
- Transferencia local: 2-4 horas
- Internacional: 1-3 días hábiles
- Tarjeta débito: Instantáneo-30 min
- Criptomonedas: 15-60 minutos

¿Necesitas ayuda con algún paso específico?`;
                }
                
                if (message.includes('no puedo') || message.includes('problema') || message.includes('error')) {
                    return `**Solución de Problemas con Retiros** 🔧

**❗ Problemas Más Comunes y Soluciones:**

**🚫 "No aparece el botón Retirar"**
- **Causa:** Cuenta sin validar (90% de casos)
- **Solución:** Completa el proceso KYC
- **Tiempo:** 24-48 horas después de validar

**💰 "Saldo insuficiente"**
- **Causa:** Fondos en período de clearing o congelados
- **Solución:** Espera liberación automática
- **Verificar:** Saldo disponible vs. total

**❌ "Retiro rechazado"**
- **Causas:** Datos bancarios incorrectos, límites excedidos
- **Solución:** Actualiza información bancaria
- **Acción:** Verifica límites de tu nivel de cuenta

**⏳ "Retiro muy lento"**
- **Causas:** Fines de semana, verificaciones adicionales
- **Plazos máximos garantizados:**
  - Locales: 48 horas
  - Internacionales: 5 días hábiles
  - Tarjetas: 7 días hábiles

**🆘 ¿Necesitas Ayuda Inmediata?**
Si tu problema no se resuelve con estas soluciones, nuestro equipo especializado puede:
- Revisar manualmente tu cuenta
- Acelerar retiros urgentes
- Proporcionar trazabilidad completa
- Coordinar con bancos corresponsales

¿Cuál es específicamente el problema que estás experimentando?`;
                }
                
                return `**Retiros de Fondos en Remeex** 💸

¡Te ayudo con todo sobre retiros!

**🎯 Métodos Disponibles:**
🏦 **Transferencia Bancaria:** Segura y confiable  
💳 **Tarjeta Débito:** Inmediato a instantáneo  
📱 **Pagos Móviles:** Zelle, PayPal y más  
₿ **Criptomonedas:** A tu wallet personal

**⚡ Características Destacadas:**
- Procesamiento rápido y seguro
- Comisiones competitivas
- Monitoreo en tiempo real
- Soporte 24/7 especializado

**🔒 Protección Garantizada:**
- Verificación multicapa de seguridad
- Monitoreo 24/7 anti-fraude
- Capacidad de reversión de emergencia
- Seguro completo de transacciones

**⚠️ Requisito Importante:**
Necesitas tener tu cuenta completamente validada para realizar retiros.

¿Ya tienes tu cuenta validada o necesitas ayuda con algún aspecto específico de los retiros?`;
            },

            cards: (message, context) => {
                if (message.includes('crear') || message.includes('como') || message.includes('proceso')) {
                    return `**Creación de Tarjetas Virtuales** 💳

**🚀 Proceso Súper Fácil (2 minutos):**

**1️⃣ Accede a la Funcionalidad**
- Abre tu app Remeex
- Ve a la sección "Tarjetas"
- Toca "Crear nueva tarjeta virtual"

**2️⃣ Configuración Personalizada**
- Elige tipo: Temporal (1-30 días) o Permanente (1 año)
- Define límite de gasto personalizado
- Establece restricciones si necesitas

**3️⃣ Personaliza tu Tarjeta**
- Asigna un nombre descriptivo
- Selecciona moneda principal
- Configura notificaciones automáticas

**4️⃣ ¡Listo para Usar!**
- Recibe datos instantáneamente: número, CVV, expiración
- Activación automática
- Usar inmediatamente en compras online

**💎 Tipos Disponibles:**

**🆓 Temporal:** Gratuita, hasta $5,000, perfecta para compras específicas  
**⭐ Estándar:** $5/mes, hasta $25,000, uso regular  
**🌟 Premium:** $15/mes, hasta $100,000, alto volumen  
**🏢 Empresarial:** Personalizada, sin límites, para empresas

**🌐 Funciona En:**
✅ Amazon, eBay, Netflix, Spotify  
✅ Cualquier sitio que acepte Visa/Mastercard  
✅ Suscripciones y servicios  
✅ Reservas de viajes y hoteles

¿Te gustaría crear tu primera tarjeta virtual ahora?`;
                }
                
                if (message.includes('tipos') || message.includes('diferencias') || message.includes('cual')) {
                    return `**Tipos de Tarjetas Virtuales Disponibles** 💳

**🆓 TARJETA TEMPORAL**
- **Duración:** 1-30 días personalizables
- **Límite:** Hasta $5,000
- **Costo:** Completamente GRATUITA
- **Ideal para:** Compras específicas, pruebas, seguridad extra
- **Beneficios:** CVV dinámico, auto-destrucción programada

**⭐ TARJETA ESTÁNDAR** 
- **Duración:** 1 año completo
- **Límite:** Hasta $25,000
- **Costo:** Solo $5/mes
- **Ideal para:** Uso regular, suscripciones, compras mensuales
- **Beneficios:** Todas las funciones de seguridad, soporte prioritario

**🌟 TARJETA PREMIUM**
- **Duración:** 1 año completo
- **Límite:** Hasta $100,000
- **Costo:** $15/mes
- **Ideal para:** Alto volumen, empresarios, inversores
- **Beneficios:** Límites extendidos, comisiones reducidas, gerente dedicado

**🏢 TARJETA EMPRESARIAL**
- **Duración:** Personalizada según necesidades
- **Límite:** Sin límites (basado en facturación)
- **Costo:** Plan personalizado
- **Ideal para:** Empresas, corporaciones, alto volumen
- **Beneficios:** API dedicada, integración contable, reportes avanzados

**🔒 Todas Incluyen:**
- Encriptación de grado militar
- Bloqueo geográfico personalizable
- Alertas en tiempo real
- Control total desde la app
- Congelación/eliminación instantánea

¿Cuál se adapta mejor a tus necesidades?`;
                }
                
                return `**Tarjetas Virtuales Remeex** 💳

¡Las tarjetas virtuales son una de nuestras funciones más populares!

**✨ Beneficios Únicos:**
🛡️ **Seguridad Total:** CVV dinámico, geobloqueo, alertas inmediatas  
⚡ **Creación Instantánea:** Lista en menos de 30 segundos  
🌍 **Uso Universal:** Funciona en cualquier sitio que acepte Visa/Mastercard  
🎛️ **Control Completo:** Congela, elimina o ajusta límites al instante

**📱 Perfecto Para:**
- Compras online seguras (Amazon, eBay, etc.)
- Suscripciones (Netflix, Spotify, Gym)
- Viajes y reservas de hotel
- Pagos internacionales
- Protección contra fraudes

**💰 Opciones Flexibles:**
Desde tarjetas temporales GRATUITAS hasta tarjetas empresariales ilimitadas.

**🔥 ¿Sabías que?** 
Con una tarjeta virtual puedes hacer compras online sin exponer nunca tu información bancaria real.

¿Te gustaría crear una tarjeta virtual o necesitas más información sobre algún tipo específico?`;
            },

            support: (message, context) => {
                return `**Centro de Soporte Remeex - Estamos Aquí Para Ti** 🎧

**📞 Canales de Contacto Directo:**

**⚡ Urgencias (24/7):**
📱 **WhatsApp:** +1 (234) 567-8900 - Respuesta en 5-15 min  
☎️ **Teléfono:** +1 (800) 123-4567 - Atención inmediata

**💬 Soporte Regular:**
✉️ **Email:** soporte@remeex.com - Respuesta en 2-4 horas  
💻 **Chat en Vivo:** Disponible en tu app - 1-3 minutos

**🏢 Departamentos Especializados:**
- **Validación:** validacion@remeex.com
- **Técnico:** tecnico@remeex.com  
- **Disputas:** disputas@remeex.com
- **Empresarial:** empresas@remeex.com

**⏰ Horarios de Atención:**
- **WhatsApp/Email:** 24 horas, 7 días
- **Chat en Vivo:** 6:00 AM - 11:00 PM EST
- **Teléfono:** 8:00 AM - 8:00 PM EST

**🎯 Compromisos de Tiempo:**
- Urgencias: < 5 minutos
- Problemas técnicos: 2-4 horas
- Validaciones: 24-48 horas
- Disputas: 5-7 días hábiles

**🛡️ Importante de Seguridad:**
Nuestros agentes NUNCA te pedirán:
❌ Contraseñas o códigos 2FA
❌ Números completos de tarjetas
❌ Claves privadas de crypto

¿Prefieres que te conecte directamente con un especialista humano?`;
            },

            general: (message, context) => {
                return `**Remeex - Tu Plataforma Financiera Digital** 🏛️

¡Hola! Soy Andrea y estoy aquí para ayudarte con cualquier consulta sobre Remeex.

**🌟 Somos tu solución financiera completa:**

💼 **Servicios Principales:**
- Validación de cuentas profesional
- Gestión de saldo multi-moneda  
- Tarjetas virtuales instantáneas
- Retiros y transferencias globales
- Intercambio de divisas competitivo

🛡️ **100% Seguro y Regulado:**
- Licencia bancaria oficial
- Más de 150,000 usuarios activos
- Certificaciones ISO 27001, PCI DSS
- Seguros hasta $250,000 USD por cuenta

⚡ **Disponible 24/7:**
- Plataforma web y móvil
- Soporte en múltiples idiomas
- Procesamiento en tiempo real
- Sin horarios de corte

**🎯 ¿En qué puedo ayudarte específicamente?**
Puedo asistirte con validaciones, seguridad, saldo, tarjetas, retiros, o cualquier otra consulta.

¡Pregúntame lo que necesites!`;
            },

            onboarding: (message, context) => {
                return `¡Bienvenido a Remeex! 🎉 Es un placer tenerte aquí.

Veo que es una de tus primeras interacciones conmigo. Te voy a ayudar a familiarizarte con todo lo que podemos hacer juntos.

**🚀 Para empezar, lo más importante:**

1️⃣ **Validar tu cuenta** - Es rápido, seguro y te da acceso completo  
2️⃣ **Conocer nuestras medidas de seguridad** - Tu tranquilidad es lo primero  
3️⃣ **Explorar formas de recargar** - Múltiples opciones disponibles  

**💡 También puedo ayudarte con:**
- Crear tarjetas virtuales para compras seguras
- Procesar retiros rápidos y seguros
- Resolver cualquier duda técnica
- Conectarte con soporte humano especializado

¿Hay algo específico que te gustaría conocer primero, o prefieres que te guíe paso a paso?`;
            },

            fallback: (message, context) => {
                const responses = [
                    `Entiendo tu consulta, pero me gustaría asegurarme de darte la información más precisa. 

¿Podrías ser un poco más específico sobre qué aspecto de Remeex te interesa? Por ejemplo:
- Validación de cuenta
- Seguridad y licencias  
- Gestión de saldo
- Tarjetas virtuales
- Retiros y transferencias

¡Estoy aquí para ayudarte con todo!`,

                    `Gracias por tu pregunta. Para brindarte la mejor asistencia posible, me gustaría entender mejor qué necesitas.

¿Tu consulta está relacionada con:
- Procesos de cuenta (validación, configuración)
- Transacciones (recargas, retiros, transferencias)
- Seguridad (licencias, protección, confiabilidad)
- Productos (tarjetas virtuales, intercambios)
- Soporte técnico

¡Compárteme más detalles y te ayudo inmediatamente!`,

                    `¡Perfecto! Estoy aquí para resolver todas tus dudas sobre Remeex.

Si no estoy entendiendo bien tu consulta, no dudes en reformularla o puedes:
- Usar las sugerencias rápidas que aparecen
- Ser más específico sobre el tema
- Pedirme que te conecte con un especialista humano

Mi objetivo es que tengas la mejor experiencia posible. ¿Cómo puedo ayudarte mejor?`
                ];
                
                return responses[Math.floor(Math.random() * responses.length)];
            }
        };
    }

    // Suggestions Initialization
    initializeSuggestions() {
        return {
            validation: {
                text: "¿Cómo validar mi cuenta?",
                message: "¿Cómo puedo validar mi cuenta en Remeex?"
            },
            validation_process: {
                text: "Proceso de validación",
                message: "Explícame paso a paso el proceso de validación"
            },
            validation_documents: {
                text: "Documentos necesarios",
                message: "¿Qué documentos necesito para validar mi cuenta?"
            },
            validation_time: {
                text: "Tiempo de validación",
                message: "¿Cuánto tiempo tarda el proceso de validación?"
            },
            security: {
                text: "¿Es seguro Remeex?",
                message: "¿Es seguro usar Remeex? ¿Qué certificaciones tienen?"
            },
            security_licenses: {
                text: "Licencias bancarias",
                message: "¿Qué licencias bancarias tiene Remeex?"
            },
            security_data: {
                text: "Protección de datos",
                message: "¿Cómo protegen mis datos personales?"
            },
            security_funds: {
                text: "Seguridad de fondos",
                message: "¿Cómo están protegidos mis fondos?"
            },
            balance: {
                text: "Gestionar saldo",
                message: "¿Cómo puedo recargar saldo en mi cuenta?"
            },
            balance_methods: {
                text: "Métodos de recarga",
                message: "¿Cuáles son todos los métodos para recargar saldo?"
            },
            balance_limits: {
                text: "Límites de recarga",
                message: "¿Cuáles son los límites de recarga?"
            },
            balance_time: {
                text: "Tiempo de acreditación",
                message: "¿Cuánto tardan en acreditarse las recargas?"
            },
            cards: {
                text: "Tarjetas virtuales",
                message: "¿Cómo creo una tarjeta virtual?"
            },
            cards_create: {
                text: "Crear tarjeta",
                message: "¿Cómo creo una tarjeta virtual paso a paso?"
            },
            cards_types: {
                text: "Tipos de tarjetas",
                message: "¿Qué tipos de tarjetas virtuales ofrecen?"
            },
            cards_limits: {
                text: "Límites de tarjetas",
                message: "¿Cuáles son los límites de las tarjetas virtuales?"
            },
            withdrawal: {
                text: "Retirar dinero",
                message: "¿Cómo puedo retirar dinero de mi cuenta?"
            },
            withdrawal_methods: {
                text: "Métodos de retiro",
                message: "¿Qué métodos hay para retirar dinero?"
            },
            withdrawal_limits: {
                text: "Límites de retiro",
                message: "¿Cuáles son los límites de retiro?"
            },
            withdrawal_time: {
                text: "Tiempo de retiro",
                message: "¿Cuánto tardan los retiros?"
            },
            help: {
                text: "Necesito ayuda",
                message: "Necesito ayuda, ¿puedes asistirme?"
            },
            support: {
                text: "Contactar soporte",
                message: "¿Cómo puedo contactar con soporte humano?"
            },
            support_ticket: {
                text: "Crear ticket",
                message: "Quiero crear un ticket de soporte"
            },
            phone_support: {
                text: "Soporte telefónico",
                message: "¿Cuál es el número de soporte telefónico?"
            },
            email_support: {
                text: "Soporte por email",
                message: "¿Cuál es el email de soporte?"
            }
        };
    }
}

// Initialize the assistant when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.assistant = new AndreaAssistant();
});

// Add CSS classes for dynamic elements
const style = document.createElement('style');
style.textContent = `
    .cta-button {
        background: linear-gradient(135deg, var(--visa-blue) 0%, var(--visa-blue-light) 100%);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        text-decoration: none;
    }
    
    .cta-button:hover {
        background: linear-gradient(135deg, var(--visa-blue-dark) 0%, var(--visa-blue) 100%);
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }
    
    .cta-button.secondary {
        background: var(--gray-100);
        color: var(--gray-700);
        border: 1px solid var(--gray-200);
    }
    
    .cta-button.secondary:hover {
        background: var(--gray-200);
        color: var(--gray-800);
    }
    
    .security-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(16, 185, 129, 0.1);
        color: var(--success);
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        border: 1px solid rgba(16, 185, 129, 0.2);
    }
    
    .message.show {
        opacity: 1;
        transform: translateY(0);
    }
    
    .send-button.ready {
        animation: pulse 0.5s ease-in-out;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .toast.show {
        opacity: 1;
        transform: translateX(0);
    }
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
        .cta-button {
            width: 100%;
            justify-content: center;
            padding: 14px 20px;
        }
        
        .security-badge {
            font-size: 11px;
            padding: 4px 8px;
        }
    }
    
    /* High contrast mode */
    @media (prefers-contrast: high) {
        .cta-button {
            border: 2px solid currentColor;
        }
        
        .security-badge {
            border-width: 2px;
        }
    }
    
    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
        .cta-button:hover {
            transform: none;
        }
        
        .send-button.ready {
            animation: none;
        }
    }
`;

document.head.appendChild(style);

// Service Worker Registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Add touch event optimizations for mobile
document.addEventListener('touchstart', () => {}, { passive: true });
document.addEventListener('touchmove', () => {}, { passive: true });

// Prevent zoom on double tap (iOS Safari)
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Handle viewport changes on mobile
const handleViewportChange = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
};

window.addEventListener('resize', handleViewportChange);
window.addEventListener('orientationchange', handleViewportChange);
handleViewportChange();

// Error boundary for unhandled errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.assistant) {
        window.assistant.showErrorMessage('Ha ocurrido un error inesperado. Por favor, recarga la página.');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.assistant) {
        window.assistant.showErrorMessage('Error de conexión. Verifica tu conexión a internet.');
    }
});

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            
            if (loadTime > 3000) { // If load time > 3 seconds
                console.warn('Slow page load detected:', loadTime + 'ms');
            }
        }, 0);
    });
}

// Memory management for long sessions
setInterval(() => {
    if (window.assistant && window.assistant.messageHistory.length > 100) {
        // Keep only last 50 messages
        window.assistant.messageHistory = window.assistant.messageHistory.slice(-50);
    }
}, 300000); // Every 5 minutes

console.log('🚀 Andrea Assistant v2.1 initialized successfully');
console.log('💙 Powered by Remeex - Your Digital Financial Platform');
