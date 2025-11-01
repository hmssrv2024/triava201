/**
 * Admin Backend Module
 * Módulo principal que orquesta todas las operaciones administrativas
 * Usa AdminUtils y AdminSupabase de forma modular
 */

const AdminBackend = {
    // Estado global
    state: {
        users: [],
        filteredUsers: [],
        selectedUsers: new Set(),
        logs: [],
        transfers: [],
        notifications: [],
        currentPage: 1,
        usersPerPage: 10,
        isInitialized: false
    },

    /**
     * ========================================
     * INICIALIZACIÓN
     * ========================================
     */

    async init() {
        if (this.state.isInitialized) {
            console.log('[AdminBackend] Ya inicializado');
            return;
        }

        console.log('[AdminBackend] Inicializando módulo backend...');

        try {
            // Asegurar que Supabase esté inicializado
            if (!AdminSupabase.client) {
                await AdminSupabase.init();
            }

            // Cargar todos los datos
            await this.loadAllData();

            this.state.isInitialized = true;
            console.log('[AdminBackend] Módulo backend inicializado correctamente');
        } catch (error) {
            console.error('[AdminBackend] Error inicializando:', error);
        }
    },

    /**
     * Carga todos los datos (usuarios, logs, etc.)
     */
    async loadAllData() {
        await this.loadUsers();
        await this.loadLogs();
        await this.loadTransfers();
        await this.loadNotifications();
    },

    /**
     * ========================================
     * GESTIÓN DE USUARIOS
     * ========================================
     */

    /**
     * Carga usuarios de localStorage y Supabase
     */
    async loadUsers() {
        this.state.users = [];

        // Cargar de localStorage
        await this.loadUsersFromLocalStorage();

        // Cargar de Supabase
        await this.loadUsersFromSupabase();

        console.log(`[AdminBackend] ${this.state.users.length} usuarios cargados`);
        return this.state.users;
    },

    /**
     * Carga usuarios de localStorage
     */
    async loadUsersFromLocalStorage() {
        const localUsers = [];

        // Buscar en todas las claves de localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            if (key && key.startsWith('visaUser_')) {
                try {
                    const userData = JSON.parse(localStorage.getItem(key));
                    localUsers.push({
                        id: key,
                        ...userData,
                        source: 'localStorage',
                        status: userData.blocked ? 'blocked' : 'active'
                    });
                } catch (e) {
                    console.error('[AdminBackend] Error parseando usuario:', key, e);
                }
            }
        }

        // También cargar el usuario actual si existe
        try {
            const currentUser = localStorage.getItem('visaUserData');
            if (currentUser) {
                const userData = JSON.parse(currentUser);
                localUsers.push({
                    id: 'current_user',
                    ...userData,
                    source: 'localStorage',
                    status: userData.blocked ? 'blocked' : 'active'
                });
            }
        } catch (e) {
            console.error('[AdminBackend] Error cargando usuario actual:', e);
        }

        this.state.users = localUsers;
    },

    /**
     * Carga usuarios de Supabase y mergea con localStorage
     */
    async loadUsersFromSupabase() {
        const result = await AdminSupabase.getUsers();

        if (result.success && result.data && result.data.length > 0) {
            result.data.forEach(user => {
                const existing = this.state.users.find(u => u.email === user.email);

                if (!existing) {
                    this.state.users.push({
                        ...user,
                        source: 'supabase',
                        status: user.blocked ? 'blocked' : 'active'
                    });
                } else {
                    // Actualizar datos del usuario existente
                    Object.assign(existing, user);
                    existing.source = 'both';
                }
            });
        }
    },

    /**
     * Obtiene usuario por ID
     */
    getUser(userId) {
        return this.state.users.find(u => u.id === userId);
    },

    /**
     * Busca usuarios por término
     */
    searchUsers(searchTerm) {
        if (!searchTerm) {
            this.state.filteredUsers = [];
            return this.state.users;
        }

        const term = searchTerm.toLowerCase();
        this.state.filteredUsers = this.state.users.filter(user =>
            (user.fullName && user.fullName.toLowerCase().includes(term)) ||
            (user.email && user.email.toLowerCase().includes(term)) ||
            (user.phoneNumber && user.phoneNumber.includes(term))
        );

        return this.state.filteredUsers;
    },

    /**
     * Filtra usuarios por estado y proveedor
     */
    filterUsers(statusFilter = 'all', providerFilter = 'all') {
        let filtered = this.state.users;

        if (statusFilter !== 'all') {
            filtered = filtered.filter(u => u.status === statusFilter);
        }

        if (providerFilter !== 'all') {
            filtered = filtered.filter(u =>
                (u.auth_provider || u.authProvider || 'email') === providerFilter
            );
        }

        this.state.filteredUsers = filtered;
        return filtered;
    },

    /**
     * Bloquea/desbloquea usuario
     */
    async toggleBlockUser(userId) {
        const user = this.getUser(userId);
        if (!user) return { success: false, error: 'Usuario no encontrado' };

        const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
        const blocked = newStatus === 'blocked';

        // Actualizar en localStorage
        if (user.source === 'localStorage' || user.source === 'both') {
            user.status = newStatus;
            user.blocked = blocked;
            AdminUtils.setStorage(user.id, user);
        }

        // Actualizar en Supabase
        if (user.source === 'supabase' || user.source === 'both') {
            const result = await AdminSupabase.toggleUserBlock(user.id, blocked);
            if (!result.success) {
                console.error('[AdminBackend] Error actualizando en Supabase:', result.error);
            }
        }

        // Actualizar en estado
        user.status = newStatus;
        user.blocked = blocked;

        // Registrar log
        const action = newStatus === 'blocked' ? 'block' : 'unblock';
        await this.addLog(action, `Usuario ${action === 'block' ? 'bloqueado' : 'desbloqueado'}: ${user.email}`);

        return { success: true, user };
    },

    /**
     * Elimina usuario
     */
    async deleteUser(userId) {
        const user = this.getUser(userId);
        if (!user) return { success: false, error: 'Usuario no encontrado' };

        // Eliminar de localStorage
        if (user.source === 'localStorage' || user.source === 'both') {
            localStorage.removeItem(user.id);
        }

        // Eliminar de Supabase
        if (user.source === 'supabase' || user.source === 'both') {
            const result = await AdminSupabase.deleteUser(user.id);
            if (!result.success) {
                console.error('[AdminBackend] Error eliminando de Supabase:', result.error);
            }
        }

        // Eliminar del estado
        this.state.users = this.state.users.filter(u => u.id !== userId);
        this.state.selectedUsers.delete(userId);

        // Registrar log
        await this.addLog('delete', `Usuario eliminado: ${user.email}`);

        return { success: true };
    },

    /**
     * Envía dinero a usuario
     */
    async sendMoney(userId, amountUsd, amountBs, concept) {
        const user = this.getUser(userId);
        if (!user) return { success: false, error: 'Usuario no encontrado' };

        // Actualizar balance
        if (!user.balance) {
            user.balance = { usd: 0, bs: 0, eur: 0 };
        }

        user.balance.usd = (parseFloat(user.balance.usd) || 0) + parseFloat(amountUsd);
        user.balance.bs = (parseFloat(user.balance.bs) || 0) + parseFloat(amountBs);

        // Guardar en localStorage
        if (user.source === 'localStorage' || user.source === 'both') {
            AdminUtils.setStorage(user.id, user);
        }

        // Guardar en Supabase
        if (user.source === 'supabase' || user.source === 'both') {
            await AdminSupabase.updateUserBalance(user.id, user.balance);
        }

        // Registrar transferencia
        const transfer = {
            id: AdminUtils.generateId(),
            recipient: user.email,
            recipientName: user.fullName,
            amountUsd: parseFloat(amountUsd),
            amountBs: parseFloat(amountBs),
            concept,
            timestamp: new Date().toISOString(),
            admin: AdminUtils.getStorage('adminUsername', 'admin')
        };

        this.state.transfers.unshift(transfer);
        AdminUtils.setStorage('adminTransfers', this.state.transfers.slice(0, 50));

        // Guardar en Supabase
        await AdminSupabase.createTransfer(transfer);

        // Registrar log
        await this.addLog('send_money', `Enviado $${amountUsd.toFixed(2)} a ${user.email}${concept ? ` - ${concept}` : ''}`);

        return { success: true, transfer };
    },

    /**
     * ========================================
     * NOTIFICACIONES
     * ========================================
     */

    /**
     * Envía notificación
     */
    async sendNotification(type, target, title, message) {
        let recipients = [];
        let recipientText = '';

        switch (target) {
            case 'all':
                recipients = this.state.users;
                recipientText = 'todos los usuarios';
                break;
            case 'active':
                recipients = this.state.users.filter(u => u.status === 'active');
                recipientText = 'usuarios activos';
                break;
            case 'blocked':
                recipients = this.state.users.filter(u => u.status === 'blocked');
                recipientText = 'usuarios bloqueados';
                break;
            default:
                // Usuario específico
                recipients = [target];
                recipientText = target.email || target.fullName;
                break;
        }

        const notification = {
            id: AdminUtils.generateId(),
            type,
            title,
            message,
            target: typeof target === 'string' ? target : 'specific',
            recipientCount: recipients.length,
            timestamp: new Date().toISOString(),
            admin: AdminUtils.getStorage('adminUsername', 'admin')
        };

        this.state.notifications.unshift(notification);
        AdminUtils.setStorage('adminNotifications', this.state.notifications.slice(0, 50));

        // Guardar en Supabase
        await AdminSupabase.createNotification(notification);

        // Registrar log
        await this.addLog('notification', `Notificación enviada a ${recipientText}: ${title}`);

        return { success: true, notification, recipientCount: recipients.length };
    },

    /**
     * Carga notificaciones enviadas
     */
    async loadNotifications() {
        // Cargar de localStorage
        this.state.notifications = AdminUtils.getStorage('adminNotifications', []);

        // Cargar de Supabase
        const result = await AdminSupabase.getNotifications();
        if (result.success && result.data) {
            // Mergear notificaciones únicas
            result.data.forEach(notif => {
                if (!this.state.notifications.find(n => n.id === notif.id)) {
                    this.state.notifications.push(notif);
                }
            });
        }

        return this.state.notifications;
    },

    /**
     * ========================================
     * LOGS DE ACTIVIDAD
     * ========================================
     */

    /**
     * Agrega log de actividad
     */
    async addLog(action, description) {
        const log = {
            id: AdminUtils.generateId(),
            action,
            description,
            timestamp: new Date().toISOString(),
            admin: AdminUtils.getStorage('adminUsername', 'admin')
        };

        this.state.logs.unshift(log);
        this.state.logs = this.state.logs.slice(0, 500); // Mantener últimos 500

        AdminUtils.setStorage('adminLogs', this.state.logs);

        // Guardar en Supabase
        await AdminSupabase.createLog(log);

        return log;
    },

    /**
     * Carga logs de actividad
     */
    async loadLogs() {
        // Cargar de localStorage
        this.state.logs = AdminUtils.getStorage('adminLogs', []);

        // Cargar de Supabase
        const result = await AdminSupabase.getLogs();
        if (result.success && result.data) {
            // Mergear logs únicos
            result.data.forEach(log => {
                if (!this.state.logs.find(l => l.id === log.id)) {
                    this.state.logs.push(log);
                }
            });
        }

        return this.state.logs;
    },

    /**
     * Busca en logs
     */
    searchLogs(searchTerm, actionFilter = 'all') {
        let filtered = this.state.logs;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(log =>
                log.description.toLowerCase().includes(term)
            );
        }

        if (actionFilter !== 'all') {
            filtered = filtered.filter(log => log.action === actionFilter);
        }

        return filtered;
    },

    /**
     * Elimina todos los logs
     */
    async deleteLogs() {
        this.state.logs = [];
        localStorage.removeItem('adminLogs');
        localStorage.removeItem('adminTransfers');
        localStorage.removeItem('adminNotifications');

        // Eliminar de Supabase
        await AdminSupabase.deleteLogs();

        return { success: true };
    },

    /**
     * ========================================
     * TRANSFERENCIAS
     * ========================================
     */

    /**
     * Carga historial de transferencias
     */
    async loadTransfers() {
        // Cargar de localStorage
        this.state.transfers = AdminUtils.getStorage('adminTransfers', []);

        // Cargar de Supabase
        const result = await AdminSupabase.getTransfers();
        if (result.success && result.data) {
            // Mergear transferencias únicas
            result.data.forEach(transfer => {
                if (!this.state.transfers.find(t => t.id === transfer.id)) {
                    this.state.transfers.push(transfer);
                }
            });
        }

        return this.state.transfers;
    },

    /**
     * ========================================
     * ESTADÍSTICAS
     * ========================================
     */

    /**
     * Calcula estadísticas generales
     */
    getStats() {
        const totalUsers = this.state.users.length;
        const activeUsers = this.state.users.filter(u => u.status === 'active' || !u.blocked).length;
        const blockedUsers = this.state.users.filter(u => u.status === 'blocked' || u.blocked).length;

        let totalBalance = 0;
        this.state.users.forEach(user => {
            if (user.balance && typeof user.balance === 'object') {
                totalBalance += parseFloat(user.balance.usd || 0);
            }
        });

        return {
            totalUsers,
            activeUsers,
            blockedUsers,
            totalBalance
        };
    },

    /**
     * ========================================
     * EXPORTACIÓN
     * ========================================
     */

    /**
     * Exporta usuarios a CSV
     */
    exportUsers(users = null) {
        const usersToExport = users || (this.state.filteredUsers.length > 0 ? this.state.filteredUsers : this.state.users);

        const data = usersToExport.map(user => ({
            Nombre: user.fullName || `${user.firstName} ${user.lastName}`,
            Email: user.email,
            Teléfono: user.phoneNumber,
            'Balance USD': (user.balance?.usd || 0).toFixed(2),
            'Balance Bs': (user.balance?.bs || 0).toFixed(2),
            Estado: user.status === 'active' ? 'Activo' : 'Bloqueado',
            Método: user.auth_provider || user.authProvider || 'email',
            Registro: AdminUtils.formatDate(user.createdAt || user.created_at)
        }));

        const filename = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
        AdminUtils.downloadCSV(data, filename);

        this.addLog('export', `Exportados ${data.length} usuarios`);
    },

    /**
     * Exporta logs a CSV
     */
    exportLogs() {
        const data = this.state.logs.map(log => ({
            Fecha: AdminUtils.formatDateTime(log.timestamp),
            Acción: log.action,
            Descripción: log.description,
            Administrador: log.admin
        }));

        const filename = `logs_${new Date().toISOString().split('T')[0]}.csv`;
        AdminUtils.downloadCSV(data, filename);
    },

    /**
     * ========================================
     * UTILIDADES
     * ========================================
     */

    /**
     * Limpia selección
     */
    clearSelection() {
        this.state.selectedUsers.clear();
    },

    /**
     * Sincroniza usuarios de localStorage a Supabase
     */
    async syncToSupabase() {
        console.log('[AdminBackend] Sincronizando usuarios a Supabase...');

        let synced = 0;
        for (const user of this.state.users) {
            if (user.source === 'localStorage') {
                const result = await AdminSupabase.syncUserToSupabase(user);
                if (result.success) {
                    synced++;
                    user.source = 'both';
                }
            }
        }

        console.log(`[AdminBackend] ${synced} usuarios sincronizados`);
        return { success: true, synced };
    }
};

console.log('[AdminBackend] Módulo de backend cargado');
