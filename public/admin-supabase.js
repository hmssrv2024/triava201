/**
 * Admin Supabase Module
 * Integración completa con Supabase como backend
 * Sin servidor tradicional - todo del lado del cliente
 */

const AdminSupabase = {
    client: null,
    config: {
        url: 'https://spprnhvkrxlpqyytrbcm.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcHJuaHZrcnhscHF5eXRyYmNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAzMjcxNTQsImV4cCI6MjA0NTkwMzE1NH0.W9MR2wA0GVMNPINlc5Y3i_2KvGqQpxnHXvwWpfL1rvM'
    },

    /**
     * Inicializa cliente Supabase
     */
    async init() {
        try {
            if (typeof supabase === 'undefined') {
                console.warn('[AdminSupabase] Esperando carga de Supabase...');
                await this.waitForSupabase();
            }

            const { createClient } = supabase;
            this.client = createClient(this.config.url, this.config.anonKey);
            window.supabaseClient = this.client;

            console.log('[AdminSupabase] Cliente inicializado correctamente');
            return true;
        } catch (error) {
            console.error('[AdminSupabase] Error inicializando:', error);
            return false;
        }
    },

    /**
     * Espera a que Supabase esté disponible
     */
    waitForSupabase(timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkInterval = setInterval(() => {
                if (typeof supabase !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    reject(new Error('Timeout esperando Supabase'));
                }
            }, 100);
        });
    },

    /**
     * ========================================
     * USUARIOS - Operaciones CRUD
     * ========================================
     */

    /**
     * Obtiene todos los usuarios
     */
    async getUsers() {
        try {
            const { data, error } = await this.client
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('[AdminSupabase] Error obteniendo usuarios:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    /**
     * Obtiene un usuario por ID
     */
    async getUserById(userId) {
        try {
            const { data, error } = await this.client
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('[AdminSupabase] Error obteniendo usuario:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtiene usuario por email
     */
    async getUserByEmail(email) {
        try {
            const { data, error } = await this.client
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('[AdminSupabase] Error obteniendo usuario por email:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Actualiza usuario
     */
    async updateUser(userId, updates) {
        try {
            const { data, error } = await this.client
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('[AdminSupabase] Error actualizando usuario:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Elimina usuario
     */
    async deleteUser(userId) {
        try {
            const { error } = await this.client
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('[AdminSupabase] Error eliminando usuario:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Bloquea/desbloquea usuario
     */
    async toggleUserBlock(userId, blocked) {
        try {
            const updates = {
                blocked: blocked,
                status: blocked ? 'blocked' : 'active',
                updated_at: new Date().toISOString()
            };

            return await this.updateUser(userId, updates);
        } catch (error) {
            console.error('[AdminSupabase] Error bloqueando usuario:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Actualiza balance de usuario
     */
    async updateUserBalance(userId, newBalance) {
        try {
            const updates = {
                balance: newBalance,
                updated_at: new Date().toISOString()
            };

            return await this.updateUser(userId, updates);
        } catch (error) {
            console.error('[AdminSupabase] Error actualizando balance:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * ========================================
     * TRANSFERENCIAS
     * ========================================
     */

    /**
     * Registra transferencia
     */
    async createTransfer(transferData) {
        try {
            const { data, error } = await this.client
                .from('admin_transfers')
                .insert([{
                    ...transferData,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('[AdminSupabase] Error creando transferencia:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtiene historial de transferencias
     */
    async getTransfers(limit = 50) {
        try {
            const { data, error } = await this.client
                .from('admin_transfers')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('[AdminSupabase] Error obteniendo transferencias:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    /**
     * ========================================
     * NOTIFICACIONES
     * ========================================
     */

    /**
     * Crea notificación
     */
    async createNotification(notificationData) {
        try {
            const { data, error } = await this.client
                .from('admin_notifications')
                .insert([{
                    ...notificationData,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('[AdminSupabase] Error creando notificación:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtiene notificaciones enviadas
     */
    async getNotifications(limit = 50) {
        try {
            const { data, error } = await this.client
                .from('admin_notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('[AdminSupabase] Error obteniendo notificaciones:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    /**
     * ========================================
     * LOGS DE ACTIVIDAD
     * ========================================
     */

    /**
     * Registra log de actividad
     */
    async createLog(logData) {
        try {
            const { data, error } = await this.client
                .from('admin_logs')
                .insert([{
                    ...logData,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('[AdminSupabase] Error creando log:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtiene logs de actividad
     */
    async getLogs(limit = 500) {
        try {
            const { data, error } = await this.client
                .from('admin_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('[AdminSupabase] Error obteniendo logs:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    /**
     * Elimina logs antiguos
     */
    async deleteLogs() {
        try {
            const { error } = await this.client
                .from('admin_logs')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Elimina todos

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('[AdminSupabase] Error eliminando logs:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * ========================================
     * ESTADÍSTICAS
     * ========================================
     */

    /**
     * Obtiene estadísticas generales
     */
    async getStats() {
        try {
            const { data: users } = await this.getUsers();

            const totalUsers = users.length;
            const activeUsers = users.filter(u => u.status === 'active' || !u.blocked).length;
            const blockedUsers = users.filter(u => u.status === 'blocked' || u.blocked).length;

            let totalBalance = 0;
            users.forEach(user => {
                if (user.balance && typeof user.balance === 'object') {
                    totalBalance += parseFloat(user.balance.usd || 0);
                }
            });

            return {
                success: true,
                data: {
                    totalUsers,
                    activeUsers,
                    blockedUsers,
                    totalBalance
                }
            };
        } catch (error) {
            console.error('[AdminSupabase] Error obteniendo estadísticas:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * ========================================
     * BÚSQUEDA Y FILTROS
     * ========================================
     */

    /**
     * Busca usuarios por término
     */
    async searchUsers(searchTerm) {
        try {
            const { data, error } = await this.client
                .from('users')
                .select('*')
                .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('[AdminSupabase] Error buscando usuarios:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    /**
     * Filtra usuarios por estado
     */
    async filterUsersByStatus(status) {
        try {
            const query = this.client
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (status !== 'all') {
                query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('[AdminSupabase] Error filtrando usuarios:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    /**
     * ========================================
     * UTILIDADES
     * ========================================
     */

    /**
     * Verifica conexión con Supabase
     */
    async checkConnection() {
        try {
            const { error } = await this.client.from('users').select('count').limit(1);
            return !error;
        } catch (error) {
            return false;
        }
    },

    /**
     * Sincroniza usuario de localStorage a Supabase
     */
    async syncUserToSupabase(localUser) {
        try {
            // Buscar si ya existe
            const existing = await this.getUserByEmail(localUser.email);

            if (existing.success && existing.data) {
                // Actualizar
                return await this.updateUser(existing.data.id, {
                    full_name: localUser.fullName,
                    phone_number: localUser.phoneNumber,
                    balance: localUser.balance,
                    auth_provider: localUser.auth_provider || localUser.authProvider,
                    updated_at: new Date().toISOString()
                });
            } else {
                // Crear nuevo
                const { data, error } = await this.client
                    .from('users')
                    .insert([{
                        email: localUser.email,
                        full_name: localUser.fullName,
                        phone_number: localUser.phoneNumber,
                        balance: localUser.balance || { usd: 0, bs: 0, eur: 0 },
                        auth_provider: localUser.auth_provider || localUser.authProvider || 'email',
                        status: localUser.status || 'active',
                        blocked: localUser.blocked || false,
                        created_at: localUser.createdAt || new Date().toISOString()
                    }])
                    .select();

                if (error) throw error;
                return { success: true, data: data[0] };
            }
        } catch (error) {
            console.error('[AdminSupabase] Error sincronizando usuario:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Limpia caché (no afecta Supabase, solo localStorage)
     */
    clearCache() {
        const keysToKeep = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('visaUser') || key === 'visaUserData' || key === 'visaRegistrationCompleted')) {
                keysToKeep.push({ key, value: localStorage.getItem(key) });
            }
        }

        localStorage.clear();

        keysToKeep.forEach(item => {
            localStorage.setItem(item.key, item.value);
        });

        return true;
    }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AdminSupabase.init();
    });
} else {
    AdminSupabase.init();
}

console.log('[AdminSupabase] Módulo de Supabase cargado');
