/**
 * REMEEX VISA - Gestor de Administración
 *
 * Sistema completo para gestionar usuarios:
 * - Asignar saldo
 * - Bloquear/desbloquear cuentas
 * - Enviar notificaciones
 * - Modificar montos de validación
 * - Ver logs de actividad
 */

(function() {
  'use strict';

  /**
   * Clase principal de gestión de administración
   */
  class AdminManager {
    constructor() {
      this.supabase = null;
      this.currentAdmin = null;
    }

    /**
     * Inicializar gestor
     */
    async init(adminEmail) {
      // Esperar a que Supabase esté listo
      if (!window.SupabaseDB || !window.SupabaseDB.isReady()) {
        console.log('[AdminManager] Esperando Supabase...');
        setTimeout(() => this.init(adminEmail), 500);
        return;
      }

      this.supabase = window.supabaseClient;
      this.currentAdmin = adminEmail;

      console.log('[AdminManager] ✅ Inicializado para:', adminEmail);
    }

    // =====================================================
    // GESTIÓN DE USUARIOS
    // =====================================================

    /**
     * Obtener todos los usuarios con sus datos completos
     */
    async getAllUsers(filters = {}) {
      try {
        let query = this.supabase
          .from('registrations')
          .select(`
            *,
            user_balances(current_balance, available_balance, reserved_balance),
            user_sessions!inner(is_online, last_activity)
          `)
          .order('created_at', { ascending: false });

        // Aplicar filtros
        if (filters.blocked !== undefined) {
          query = query.eq('account_blocked', filters.blocked);
        }

        if (filters.status) {
          query = query.eq('account_status', filters.status);
        }

        if (filters.search) {
          query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        console.log('[AdminManager] ✅ Usuarios obtenidos:', data.length);
        return { ok: true, data };
      } catch (error) {
        console.error('[AdminManager] Error obteniendo usuarios:', error);
        return { ok: false, error: error.message };
      }
    }

    /**
     * Bloquear cuenta de usuario
     */
    async blockUser(userEmail, reason) {
      try {
        const { data, error } = await this.supabase
          .from('registrations')
          .update({
            account_blocked: true,
            block_reason: reason,
            blocked_at: new Date().toISOString(),
            blocked_by: this.currentAdmin,
            account_status: 'suspended'
          })
          .eq('email', userEmail)
          .select();

        if (error) throw error;

        // Registrar en log
        await this.logActivity('block_user', userEmail, 'Usuario bloqueado', {
          reason,
          blocked_at: new Date().toISOString()
        });

        // Enviar notificación al usuario
        await this.sendNotification(userEmail, {
          title: 'Cuenta Bloqueada',
          message: `Tu cuenta ha sido suspendida. Motivo: ${reason}`,
          type: 'error',
          priority: 'urgent',
          showAsOverlay: true
        });

        console.log('[AdminManager] ✅ Usuario bloqueado:', userEmail);
        return { ok: true, data: data[0] };
      } catch (error) {
        console.error('[AdminManager] Error bloqueando usuario:', error);
        return { ok: false, error: error.message };
      }
    }

    /**
     * Desbloquear cuenta de usuario
     */
    async unblockUser(userEmail) {
      try {
        const { data, error } = await this.supabase
          .from('registrations')
          .update({
            account_blocked: false,
            block_reason: null,
            blocked_at: null,
            blocked_by: null,
            account_status: 'active'
          })
          .eq('email', userEmail)
          .select();

        if (error) throw error;

        // Registrar en log
        await this.logActivity('unblock_user', userEmail, 'Usuario desbloqueado');

        // Enviar notificación al usuario
        await this.sendNotification(userEmail, {
          title: 'Cuenta Desbloqueada',
          message: '¡Tu cuenta ha sido reactivada! Ya puedes usar todos los servicios.',
          type: 'success',
          priority: 'high',
          showAsOverlay: true
        });

        console.log('[AdminManager] ✅ Usuario desbloqueado:', userEmail);
        return { ok: true, data: data[0] };
      } catch (error) {
        console.error('[AdminManager] Error desbloqueando usuario:', error);
        return { ok: false, error: error.message };
      }
    }

    /**
     * Actualizar monto de validación de usuario
     */
    async updateValidationAmount(userEmail, amount) {
      try {
        const { data, error } = await this.supabase
          .from('registrations')
          .update({
            validation_amount: amount
          })
          .eq('email', userEmail)
          .select();

        if (error) throw error;

        // Registrar en log
        await this.logActivity('update_validation_amount', userEmail, 'Monto de validación actualizado', {
          new_amount: amount
        });

        console.log('[AdminManager] ✅ Monto de validación actualizado:', userEmail, amount);
        return { ok: true, data: data[0] };
      } catch (error) {
        console.error('[AdminManager] Error actualizando validación:', error);
        return { ok: false, error: error.message };
      }
    }

    // =====================================================
    // TRANSFERENCIAS Y SALDO
    // =====================================================

    /**
     * Enviar saldo a usuario (crea transferencia pendiente)
     */
    async sendBalanceToUser(userEmail, amount, description = '') {
      try {
        // Llamar función de Supabase que crea transferencia + notificación
        const { data, error } = await this.supabase
          .rpc('create_transfer_with_notification', {
            p_user_email: userEmail,
            p_amount: amount,
            p_description: description,
            p_admin_email: this.currentAdmin
          });

        if (error) throw error;

        // Registrar en log
        await this.logActivity('send_transfer', userEmail, `Transferencia enviada: $${amount}`, {
          amount,
          description,
          transfer_id: data
        });

        console.log('[AdminManager] ✅ Transferencia enviada:', data);
        return { ok: true, transferId: data };
      } catch (error) {
        console.error('[AdminManager] Error enviando transferencia:', error);
        return { ok: false, error: error.message };
      }
    }

    /**
     * Obtener transferencias pendientes
     */
    async getPendingTransfers(userEmail = null) {
      try {
        let query = this.supabase
          .from('pending_transfers')
          .select('*')
          .order('created_at', { ascending: false });

        if (userEmail) {
          query = query.eq('user_email', userEmail);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { ok: true, data };
      } catch (error) {
        console.error('[AdminManager] Error obteniendo transferencias:', error);
        return { ok: false, error: error.message };
      }
    }

    /**
     * Cancelar transferencia pendiente
     */
    async cancelTransfer(transferId) {
      try {
        const { data, error } = await this.supabase
          .from('pending_transfers')
          .update({
            status: 'cancelled'
          })
          .eq('id', transferId)
          .select();

        if (error) throw error;

        await this.logActivity('cancel_transfer', null, 'Transferencia cancelada', {
          transfer_id: transferId
        });

        console.log('[AdminManager] ✅ Transferencia cancelada:', transferId);
        return { ok: true, data: data[0] };
      } catch (error) {
        console.error('[AdminManager] Error cancelando transferencia:', error);
        return { ok: false, error: error.message };
      }
    }

    // =====================================================
    // NOTIFICACIONES
    // =====================================================

    /**
     * Enviar notificación a usuario
     */
    async sendNotification(userEmail, options) {
      const {
        title,
        message,
        type = 'info',
        priority = 'normal',
        showAsOverlay = false,
        actionUrl = null,
        actionLabel = null,
        autoDismissSeconds = null,
        data = null
      } = options;

      try {
        const { data: notification, error } = await this.supabase
          .from('notifications')
          .insert({
            user_email: userEmail,
            title,
            message,
            type,
            priority,
            show_as_overlay: showAsOverlay,
            action_url: actionUrl,
            action_label: actionLabel,
            auto_dismiss_seconds: autoDismissSeconds,
            data,
            created_by: this.currentAdmin
          })
          .select();

        if (error) throw error;

        // Actualizar last_notification_at del usuario
        await this.supabase
          .from('registrations')
          .update({ last_notification_at: new Date().toISOString() })
          .eq('email', userEmail);

        // Registrar en log
        await this.logActivity('send_notification', userEmail, `Notificación: ${title}`, {
          type,
          priority
        });

        console.log('[AdminManager] ✅ Notificación enviada:', notification[0].id);
        return { ok: true, data: notification[0] };
      } catch (error) {
        console.error('[AdminManager] Error enviando notificación:', error);
        return { ok: false, error: error.message };
      }
    }

    /**
     * Enviar notificación masiva
     */
    async sendBulkNotification(userEmails, options) {
      const results = [];

      for (const email of userEmails) {
        const result = await this.sendNotification(email, options);
        results.push({ email, success: result.ok });
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`[AdminManager] ✅ Notificaciones enviadas: ${successCount}/${userEmails.length}`);

      return { ok: true, results, successCount };
    }

    /**
     * Enviar recordatorio personalizado
     */
    async sendReminder(userEmail, message) {
      return await this.sendNotification(userEmail, {
        title: 'Recordatorio',
        message,
        type: 'reminder',
        priority: 'normal',
        showAsOverlay: true,
        autoDismissSeconds: 10
      });
    }

    // =====================================================
    // LOGS Y AUDITORÍA
    // =====================================================

    /**
     * Registrar actividad de admin
     */
    async logActivity(actionType, targetUserEmail, description, data = null) {
      try {
        await this.supabase
          .from('admin_activity_log')
          .insert({
            admin_email: this.currentAdmin,
            action_type: actionType,
            target_user_email: targetUserEmail,
            description,
            data
          });

        return { ok: true };
      } catch (error) {
        console.error('[AdminManager] Error registrando log:', error);
        return { ok: false, error: error.message };
      }
    }

    /**
     * Obtener logs de actividad
     */
    async getActivityLogs(filters = {}) {
      try {
        let query = this.supabase
          .from('admin_activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(filters.limit || 100);

        if (filters.adminEmail) {
          query = query.eq('admin_email', filters.adminEmail);
        }

        if (filters.targetUser) {
          query = query.eq('target_user_email', filters.targetUser);
        }

        if (filters.actionType) {
          query = query.eq('action_type', filters.actionType);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { ok: true, data };
      } catch (error) {
        console.error('[AdminManager] Error obteniendo logs:', error);
        return { ok: false, error: error.message };
      }
    }

    // =====================================================
    // CONFIGURACIÓN GLOBAL
    // =====================================================

    /**
     * Obtener configuración global
     */
    async getSettings() {
      try {
        const { data, error } = await this.supabase
          .from('admin_settings')
          .select('*');

        if (error) throw error;

        // Convertir a objeto key-value
        const settings = {};
        data.forEach(setting => {
          settings[setting.setting_key] = setting.setting_value;
        });

        return { ok: true, data: settings };
      } catch (error) {
        console.error('[AdminManager] Error obteniendo settings:', error);
        return { ok: false, error: error.message };
      }
    }

    /**
     * Actualizar configuración
     */
    async updateSetting(key, value) {
      try {
        const { data, error } = await this.supabase
          .from('admin_settings')
          .update({
            setting_value: value,
            updated_by: this.currentAdmin,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', key)
          .select();

        if (error) throw error;

        await this.logActivity('update_setting', null, `Setting actualizado: ${key}`, {
          key,
          value
        });

        return { ok: true, data: data[0] };
      } catch (error) {
        console.error('[AdminManager] Error actualizando setting:', error);
        return { ok: false, error: error.message };
      }
    }
  }

  // Exportar a window
  window.AdminManager = AdminManager;

  console.log('[AdminManager] 📦 Módulo cargado');

})();
