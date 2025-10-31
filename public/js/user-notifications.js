/**
 * REMEEX VISA - Sistema de Notificaciones de Usuario
 *
 * Muestra notificaciones tipo overlay, gestiona transferencias pendientes,
 * verifica bloqueos de cuenta, etc.
 */

(function() {
  'use strict';

  class UserNotificationSystem {
    constructor() {
      this.userEmail = null;
      this.supabase = null;
      this.checkInterval = null;
      this.notificationQueue = [];
      this.currentOverlay = null;
    }

    /**
     * Inicializar sistema
     */
    async init(userEmail) {
      if (!window.SupabaseDB || !window.SupabaseDB.isReady()) {
        console.log('[Notifications] Esperando Supabase...');
        setTimeout(() => this.init(userEmail), 500);
        return;
      }

      this.userEmail = userEmail;
      this.supabase = window.supabaseClient;

      // Crear contenedor de notificaciones si no existe
      this.createNotificationContainer();

      // Verificar cuenta bloqueada
      await this.checkAccountStatus();

      // Cargar notificaciones pendientes
      await this.loadNotifications();

      // Cargar transferencias pendientes
      await this.loadPendingTransfers();

      // Iniciar polling cada 10 segundos
      this.startPolling();

      console.log('[Notifications] ✅ Sistema inicializado para:', userEmail);
    }

    /**
     * Crear contenedor HTML para notificaciones
     */
    createNotificationContainer() {
      if (document.getElementById('remeex-notification-container')) {
        return; // Ya existe
      }

      const container = document.createElement('div');
      container.id = 'remeex-notification-container';
      container.innerHTML = `
        <style>
          #remeex-notification-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 999999;
            pointer-events: none;
          }

          .remeex-notification-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000000;
            pointer-events: all;
            animation: fadeIn 0.3s ease;
          }

          .remeex-notification-card {
            background: white;
            border-radius: 16px;
            padding: 32px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.4s ease;
            position: relative;
          }

          .remeex-notification-card.error {
            border-left: 6px solid #ef4444;
          }

          .remeex-notification-card.success {
            border-left: 6px solid #10b981;
          }

          .remeex-notification-card.warning {
            border-left: 6px solid #f59e0b;
          }

          .remeex-notification-card.info {
            border-left: 6px solid #3b82f6;
          }

          .remeex-notification-card.transfer {
            border-left: 6px solid #8b5cf6;
          }

          .remeex-notification-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin: 0 auto 20px;
          }

          .remeex-notification-card.error .remeex-notification-icon {
            background: #fee2e2;
            color: #ef4444;
          }

          .remeex-notification-card.success .remeex-notification-icon {
            background: #d1fae5;
            color: #10b981;
          }

          .remeex-notification-card.warning .remeex-notification-icon {
            background: #fef3c7;
            color: #f59e0b;
          }

          .remeex-notification-card.info .remeex-notification-icon {
            background: #dbeafe;
            color: #3b82f6;
          }

          .remeex-notification-card.transfer .remeex-notification-icon {
            background: #ede9fe;
            color: #8b5cf6;
          }

          .remeex-notification-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 12px;
            text-align: center;
            color: #1f2937;
          }

          .remeex-notification-message {
            font-size: 16px;
            line-height: 1.6;
            color: #4b5563;
            text-align: center;
            margin-bottom: 24px;
          }

          .remeex-notification-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
          }

          .remeex-notification-btn {
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
          }

          .remeex-notification-btn-primary {
            background: #667eea;
            color: white;
          }

          .remeex-notification-btn-primary:hover {
            background: #5568d3;
            transform: translateY(-2px);
          }

          .remeex-notification-btn-secondary {
            background: #e5e7eb;
            color: #374151;
          }

          .remeex-notification-btn-secondary:hover {
            background: #d1d5db;
          }

          .remeex-notification-btn-danger {
            background: #ef4444;
            color: white;
          }

          .remeex-notification-btn-danger:hover {
            background: #dc2626;
          }

          .remeex-notification-btn-success {
            background: #10b981;
            color: white;
          }

          .remeex-notification-btn-success:hover {
            background: #059669;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from {
              transform: translateY(50px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .remeex-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            pointer-events: all;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
            z-index: 1000001;
          }

          @keyframes slideInRight {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        </style>
        <div id="remeex-overlays"></div>
        <div id="remeex-toasts"></div>
      `;

      document.body.appendChild(container);
    }

    /**
     * Verificar estado de cuenta (bloqueada, validada, etc.)
     */
    async checkAccountStatus() {
      try {
        const { data, error } = await this.supabase
          .from('registrations')
          .select('account_blocked, block_reason, account_status, is_validated, validation_amount')
          .eq('email', this.userEmail)
          .single();

        if (error) throw error;

        // Si cuenta está bloqueada, mostrar overlay
        if (data.account_blocked) {
          this.showOverlay({
            title: '⛔ Cuenta Bloqueada',
            message: `Tu cuenta ha sido suspendida.\n\nMotivo: ${data.block_reason || 'No especificado'}`,
            type: 'error',
            actions: [
              {
                label: 'Contactar Soporte',
                type: 'primary',
                action: () => {
                  window.location.href = 'mailto:soporte@remeexvisa.com';
                }
              }
            ],
            dismissible: false
          });

          return { blocked: true, data };
        }

        // Verificar validación
        if (!data.is_validated) {
          const amount = data.validation_amount || 5.00;
          this.showToast({
            message: `⚠️ Cuenta pendiente de validación. Monto requerido: $${amount}`,
            type: 'warning',
            duration: 10000
          });
        }

        return { blocked: false, data };
      } catch (error) {
        console.error('[Notifications] Error verificando cuenta:', error);
        return { blocked: false, error };
      }
    }

    /**
     * Cargar notificaciones no leídas
     */
    async loadNotifications() {
      try {
        const { data, error } = await this.supabase
          .from('notifications')
          .select('*')
          .eq('user_email', this.userEmail)
          .eq('is_read', false)
          .order('created_at', { ascending: true });

        if (error) throw error;

        for (const notification of data) {
          await this.processNotification(notification);
        }

        console.log('[Notifications] ✅ Notificaciones cargadas:', data.length);
      } catch (error) {
        console.error('[Notifications] Error cargando notificaciones:', error);
      }
    }

    /**
     * Procesar una notificación
     */
    async processNotification(notification) {
      if (notification.show_as_overlay) {
        // Mostrar como overlay
        this.showOverlay({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          actions: notification.action_url ? [
            {
              label: notification.action_label || 'Ver más',
              type: 'primary',
              action: () => {
                window.location.href = notification.action_url;
              }
            },
            {
              label: 'Cerrar',
              type: 'secondary',
              action: () => {
                this.markAsRead(notification.id);
              }
            }
          ] : [
            {
              label: 'Entendido',
              type: 'primary',
              action: () => {
                this.markAsRead(notification.id);
              }
            }
          ]
        });
      } else {
        // Mostrar como toast
        this.showToast({
          message: `${notification.title}: ${notification.message}`,
          type: notification.type,
          duration: notification.auto_dismiss_seconds ? notification.auto_dismiss_seconds * 1000 : 5000
        });

        // Marcar como leída después de mostrar
        await this.markAsRead(notification.id);
      }
    }

    /**
     * Marcar notificación como leída
     */
    async markAsRead(notificationId) {
      try {
        await this.supabase
          .from('notifications')
          .update({
            is_read: true,
            read_at: new Date().toISOString()
          })
          .eq('id', notificationId);
      } catch (error) {
        console.error('[Notifications] Error marcando como leída:', error);
      }
    }

    /**
     * Cargar transferencias pendientes
     */
    async loadPendingTransfers() {
      try {
        const { data, error } = await this.supabase
          .from('pending_transfers')
          .select('*')
          .eq('user_email', this.userEmail)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString());

        if (error) throw error;

        for (const transfer of data) {
          this.showTransferOverlay(transfer);
        }

        console.log('[Notifications] ✅ Transferencias pendientes:', data.length);
      } catch (error) {
        console.error('[Notifications] Error cargando transferencias:', error);
      }
    }

    /**
     * Mostrar overlay de transferencia
     */
    showTransferOverlay(transfer) {
      this.showOverlay({
        title: '💰 Nueva Transferencia',
        message: `Has recibido $${transfer.amount} ${transfer.currency}\n\n${transfer.description || ''}`,
        type: 'transfer',
        actions: [
          {
            label: '✅ Aceptar',
            type: 'success',
            action: async () => {
              await this.acceptTransfer(transfer.id);
            }
          },
          {
            label: '❌ Rechazar',
            type: 'danger',
            action: async () => {
              await this.rejectTransfer(transfer.id);
            }
          }
        ],
        dismissible: false
      });
    }

    /**
     * Aceptar transferencia
     */
    async acceptTransfer(transferId) {
      try {
        const { data, error } = await this.supabase
          .rpc('accept_transfer', {
            p_transfer_id: transferId,
            p_user_response: 'Aceptada desde panel de usuario'
          });

        if (error) throw error;

        this.closeCurrentOverlay();
        this.showToast({
          message: '✅ ¡Transferencia aceptada! Tu saldo ha sido actualizado.',
          type: 'success',
          duration: 5000
        });

        // Recargar balance
        if (window.RemeexSupabase) {
          await window.RemeexSupabase.refresh();
        }

        console.log('[Notifications] ✅ Transferencia aceptada');
      } catch (error) {
        console.error('[Notifications] Error aceptando transferencia:', error);
        this.showToast({
          message: '❌ Error al aceptar transferencia. Intenta nuevamente.',
          type: 'error',
          duration: 5000
        });
      }
    }

    /**
     * Rechazar transferencia
     */
    async rejectTransfer(transferId) {
      try {
        const { data, error } = await this.supabase
          .rpc('reject_transfer', {
            p_transfer_id: transferId,
            p_user_response: 'Rechazada desde panel de usuario'
          });

        if (error) throw error;

        this.closeCurrentOverlay();
        this.showToast({
          message: 'Transferencia rechazada',
          type: 'info',
          duration: 3000
        });

        console.log('[Notifications] ✅ Transferencia rechazada');
      } catch (error) {
        console.error('[Notifications] Error rechazando transferencia:', error);
      }
    }

    /**
     * Mostrar overlay
     */
    showOverlay(options) {
      const {
        title,
        message,
        type = 'info',
        actions = [],
        dismissible = true
      } = options;

      const icons = {
        error: '⛔',
        success: '✅',
        warning: '⚠️',
        info: 'ℹ️',
        transfer: '💰',
        reminder: '🔔'
      };

      const overlayContainer = document.getElementById('remeex-overlays');
      const overlay = document.createElement('div');
      overlay.className = 'remeex-notification-overlay';
      overlay.innerHTML = `
        <div class="remeex-notification-card ${type}">
          <div class="remeex-notification-icon">
            ${icons[type] || 'ℹ️'}
          </div>
          <div class="remeex-notification-title">${title}</div>
          <div class="remeex-notification-message">${message.replace(/\n/g, '<br>')}</div>
          <div class="remeex-notification-actions">
            ${actions.map(action => `
              <button class="remeex-notification-btn remeex-notification-btn-${action.type || 'primary'}">
                ${action.label}
              </button>
            `).join('')}
          </div>
        </div>
      `;

      // Agregar event listeners a botones
      overlay.querySelectorAll('.remeex-notification-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
          actions[index].action();
          if (actions[index].close !== false) {
            overlay.remove();
          }
        });
      });

      // Cerrar al hacer click en fondo (si es dismissible)
      if (dismissible) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            overlay.remove();
          }
        });
      }

      overlayContainer.appendChild(overlay);
      this.currentOverlay = overlay;
    }

    /**
     * Cerrar overlay actual
     */
    closeCurrentOverlay() {
      if (this.currentOverlay) {
        this.currentOverlay.remove();
        this.currentOverlay = null;
      }
    }

    /**
     * Mostrar toast (notificación pequeña)
     */
    showToast(options) {
      const { message, type = 'info', duration = 5000 } = options;

      const toastContainer = document.getElementById('remeex-toasts');
      const toast = document.createElement('div');
      toast.className = `remeex-toast remeex-toast-${type}`;
      toast.textContent = message;

      toastContainer.appendChild(toast);

      // Auto-dismiss
      setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    /**
     * Iniciar polling de nuevas notificaciones
     */
    startPolling() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
      }

      this.checkInterval = setInterval(async () => {
        await this.loadNotifications();
        await this.loadPendingTransfers();
      }, 10000); // Cada 10 segundos

      console.log('[Notifications] ⏰ Polling iniciado (cada 10s)');
    }

    /**
     * Detener polling
     */
    stopPolling() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
        console.log('[Notifications] ⏰ Polling detenido');
      }
    }
  }

  // Exportar a window
  window.UserNotificationSystem = UserNotificationSystem;

  console.log('[Notifications] 📦 Sistema de notificaciones cargado');

})();
