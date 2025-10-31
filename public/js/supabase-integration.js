/**
 * REMEEX VISA - Integración con Supabase
 *
 * Este script conecta homevisa.html con las APIs de Supabase para:
 * - Mostrar saldo del usuario en tiempo real
 * - Historial de transacciones
 * - Estado online/offline
 * - Tracking de sesión
 *
 * Uso: Incluir este script en homevisa.html
 * <script src="js/supabase-integration.js" defer></script>
 */

(function() {
  'use strict';

  // Configuración
  const API_BASE = '/api/user';
  const UPDATE_INTERVAL = 30000; // Actualizar cada 30 segundos
  const SESSION_PING_INTERVAL = 60000; // Ping de sesión cada 60 segundos

  // Estado global
  let currentUserEmail = null;
  let updateTimer = null;
  let sessionTimer = null;

  /**
   * Clase principal de integración con Supabase
   */
  class SupabaseIntegration {
    constructor() {
      this.userEmail = null;
      this.balance = null;
      this.transactions = [];
      this.session = null;
      this.isOnline = false;
    }

    /**
     * Inicializar integración
     * @param {string} email - Email del usuario
     */
    async init(email) {
      if (!email) {
        console.warn('[Supabase] No se proporcionó email de usuario');
        return;
      }

      this.userEmail = email;
      currentUserEmail = email;

      console.log('[Supabase] Inicializando integración para:', email);

      try {
        // Cargar datos iniciales
        await Promise.all([
          this.loadBalance(),
          this.loadTransactions(),
          this.createSession()
        ]);

        // Iniciar actualizaciones automáticas
        this.startAutoUpdate();
        this.startSessionPing();

        console.log('[Supabase] ✅ Integración inicializada correctamente');
      } catch (error) {
        console.error('[Supabase] Error inicializando:', error);
      }
    }

    /**
     * Cargar saldo del usuario
     */
    async loadBalance() {
      try {
        const response = await fetch(`${API_BASE}/balance?email=${encodeURIComponent(this.userEmail)}`);
        const data = await response.json();

        if (data.ok) {
          this.balance = data.data;
          this.updateBalanceUI();
          return this.balance;
        } else {
          console.error('[Supabase] Error cargando saldo:', data.error);
          return null;
        }
      } catch (error) {
        console.error('[Supabase] Error en loadBalance:', error);
        return null;
      }
    }

    /**
     * Cargar historial de transacciones
     * @param {number} limit - Número de transacciones a cargar
     * @param {number} offset - Offset para paginación
     */
    async loadTransactions(limit = 50, offset = 0) {
      try {
        const response = await fetch(
          `${API_BASE}/transactions?email=${encodeURIComponent(this.userEmail)}&limit=${limit}&offset=${offset}`
        );
        const data = await response.json();

        if (data.ok) {
          this.transactions = data.data.transactions;
          this.updateTransactionsUI();
          return this.transactions;
        } else {
          console.error('[Supabase] Error cargando transacciones:', data.error);
          return [];
        }
      } catch (error) {
        console.error('[Supabase] Error en loadTransactions:', error);
        return [];
      }
    }

    /**
     * Crear o actualizar sesión (marcar usuario online)
     */
    async createSession() {
      try {
        const response = await fetch(`${API_BASE}/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.userEmail,
            ipAddress: await this.getClientIP(),
            userAgent: navigator.userAgent
          })
        });

        const data = await response.json();

        if (data.ok) {
          this.session = data.data;
          this.isOnline = true;
          this.updateSessionUI();
          return this.session;
        } else {
          console.error('[Supabase] Error creando sesión:', data.error);
          return null;
        }
      } catch (error) {
        console.error('[Supabase] Error en createSession:', error);
        return null;
      }
    }

    /**
     * Obtener estado de sesión actual
     */
    async getSession() {
      try {
        const response = await fetch(`${API_BASE}/session?email=${encodeURIComponent(this.userEmail)}`);
        const data = await response.json();

        if (data.ok) {
          this.isOnline = data.data.isOnline;
          this.updateSessionUI();
          return data.data;
        }
      } catch (error) {
        console.error('[Supabase] Error en getSession:', error);
      }
    }

    /**
     * Cerrar sesión (marcar offline)
     */
    async logout() {
      try {
        const response = await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.userEmail
          })
        });

        const data = await response.json();

        if (data.ok) {
          this.isOnline = false;
          this.stopAutoUpdate();
          this.stopSessionPing();
          console.log('[Supabase] Sesión cerrada correctamente');
        }
      } catch (error) {
        console.error('[Supabase] Error en logout:', error);
      }
    }

    /**
     * Obtener perfil del usuario
     */
    async getProfile() {
      try {
        const response = await fetch(`${API_BASE}/profile?email=${encodeURIComponent(this.userEmail)}`);
        const data = await response.json();

        if (data.ok) {
          return data.data;
        }
      } catch (error) {
        console.error('[Supabase] Error en getProfile:', error);
      }
    }

    /**
     * Actualizar UI con saldo
     */
    updateBalanceUI() {
      if (!this.balance) return;

      // Buscar elementos donde mostrar el saldo
      const balanceElements = [
        document.getElementById('user-balance'),
        document.getElementById('current-balance'),
        document.getElementById('wallet-balance'),
        document.querySelector('[data-balance]'),
        document.querySelector('.balance-amount'),
        document.querySelector('#exchange-available')
      ];

      balanceElements.forEach(el => {
        if (el) {
          const formattedBalance = this.formatCurrency(this.balance.currentBalance, this.balance.currency);
          el.textContent = formattedBalance;
          el.setAttribute('data-balance-value', this.balance.currentBalance);
        }
      });

      // Disparar evento personalizado
      window.dispatchEvent(new CustomEvent('supabase:balance-updated', {
        detail: this.balance
      }));

      console.log('[Supabase] 💰 Saldo actualizado:', this.balance);
    }

    /**
     * Actualizar UI con transacciones
     */
    updateTransactionsUI() {
      // Disparar evento personalizado para que la app lo maneje
      window.dispatchEvent(new CustomEvent('supabase:transactions-updated', {
        detail: {
          transactions: this.transactions,
          count: this.transactions.length
        }
      }));

      console.log('[Supabase] 📊 Transacciones cargadas:', this.transactions.length);
    }

    /**
     * Actualizar UI de sesión
     */
    updateSessionUI() {
      const statusElement = document.querySelector('[data-online-status]');
      if (statusElement) {
        statusElement.textContent = this.isOnline ? 'En línea' : 'Desconectado';
        statusElement.classList.toggle('online', this.isOnline);
        statusElement.classList.toggle('offline', !this.isOnline);
      }

      // Disparar evento
      window.dispatchEvent(new CustomEvent('supabase:session-updated', {
        detail: {
          isOnline: this.isOnline,
          session: this.session
        }
      }));
    }

    /**
     * Iniciar actualización automática
     */
    startAutoUpdate() {
      if (updateTimer) return;

      updateTimer = setInterval(async () => {
        await this.loadBalance();
        await this.loadTransactions();
      }, UPDATE_INTERVAL);

      console.log('[Supabase] ⏰ Actualización automática iniciada');
    }

    /**
     * Detener actualización automática
     */
    stopAutoUpdate() {
      if (updateTimer) {
        clearInterval(updateTimer);
        updateTimer = null;
        console.log('[Supabase] ⏰ Actualización automática detenida');
      }
    }

    /**
     * Iniciar ping de sesión
     */
    startSessionPing() {
      if (sessionTimer) return;

      sessionTimer = setInterval(async () => {
        await this.createSession(); // Actualiza last_activity
      }, SESSION_PING_INTERVAL);

      console.log('[Supabase] 📡 Ping de sesión iniciado');
    }

    /**
     * Detener ping de sesión
     */
    stopSessionPing() {
      if (sessionTimer) {
        clearInterval(sessionTimer);
        sessionTimer = null;
        console.log('[Supabase] 📡 Ping de sesión detenido');
      }
    }

    /**
     * Formatear moneda
     */
    formatCurrency(amount, currency = 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    }

    /**
     * Obtener IP del cliente (intento)
     */
    async getClientIP() {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
      } catch (error) {
        return null;
      }
    }

    /**
     * Actualizar todo manualmente
     */
    async refresh() {
      console.log('[Supabase] 🔄 Actualizando datos...');
      await Promise.all([
        this.loadBalance(),
        this.loadTransactions()
      ]);
    }
  }

  // Instancia global
  window.SupabaseIntegration = SupabaseIntegration;
  window.supabaseClient = new SupabaseIntegration();

  // API pública simplificada
  window.RemeexSupabase = {
    /**
     * Inicializar con email de usuario
     */
    init: (email) => window.supabaseClient.init(email),

    /**
     * Obtener saldo actual
     */
    getBalance: () => window.supabaseClient.balance,

    /**
     * Obtener transacciones
     */
    getTransactions: () => window.supabaseClient.transactions,

    /**
     * Refrescar datos
     */
    refresh: () => window.supabaseClient.refresh(),

    /**
     * Cerrar sesión
     */
    logout: () => window.supabaseClient.logout(),

    /**
     * Verificar si está online
     */
    isOnline: () => window.supabaseClient.isOnline
  };

  // Auto-inicializar si detectamos email en elementos comunes
  document.addEventListener('DOMContentLoaded', () => {
    // Intentar obtener email de elementos comunes
    const emailElement = document.getElementById('welcome-email') ||
                        document.getElementById('user-email') ||
                        document.querySelector('[data-user-email]');

    if (emailElement && emailElement.textContent) {
      const email = emailElement.textContent.trim();
      if (email && email.includes('@')) {
        console.log('[Supabase] Email detectado, inicializando...');
        window.supabaseClient.init(email);
      }
    }
  });

  // Cerrar sesión al salir
  window.addEventListener('beforeunload', () => {
    if (window.supabaseClient && window.supabaseClient.isOnline) {
      // Usar sendBeacon para garantizar envío antes de cerrar
      const data = JSON.stringify({ email: currentUserEmail });
      navigator.sendBeacon(`${API_BASE}/logout`, data);
    }
  });

  console.log('[Supabase] 📦 Módulo de integración cargado');

})();
