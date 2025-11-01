/**
 * Admin Panel Controller
 * Orquestador principal que usa los módulos modulares
 * Credenciales: hmssrv / B1en29**
 */

// Configuración
const ADMIN_CREDENTIALS = {
    username: 'hmssrv',
    password: 'B1en29**'
};

// Estado UI
let selectedRecipient = null;
let selectedNotificationUser = null;

/**
 * ========================================
 * INICIALIZACIÓN
 * ========================================
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[AdminPanel] Inicializando panel de administración...');
    console.log('[AdminPanel] Credenciales: hmssrv / B1en29**');

    // Verificar autenticación
    if (AdminUtils.getStorage('adminAuthenticated') === 'true') {
        await showDashboard();
    } else {
        showLogin();
    }

    setupEventListeners();
});

/**
 * ========================================
 * AUTENTICACIÓN
 * ========================================
 */

function setupEventListeners() {
    // Login
    document.getElementById('admin-login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('toggle-admin-password')?.addEventListener('click', togglePassword);
    document.getElementById('refresh-data')?.addEventListener('click', handleRefreshData);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToSection(item.dataset.section);
        });
    });

    setupUsersSection();
    setupSendMoneySection();
    setupNotificationsSection();
    setupLogsSection();
    setupSettingsSection();
}

function togglePassword() {
    const input = document.getElementById('admin-password');
    const icon = document.querySelector('#toggle-admin-password i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        AdminUtils.setStorage('adminAuthenticated', 'true');
        AdminUtils.setStorage('adminUsername', username);
        AdminUtils.setStorage('adminLastAccess', new Date().toISOString());

        await showDashboard();
        await AdminBackend.addLog('login', 'Administrador inició sesión');
    } else {
        const errorDiv = document.getElementById('login-error');
        errorDiv.textContent = '⚠️ Usuario o contraseña incorrectos';
        errorDiv.style.display = 'block';
    }
}

async function handleLogout() {
    await AdminBackend.addLog('logout', 'Administrador cerró sesión');
    AdminUtils.removeStorage('adminAuthenticated');
    showLogin();
}

function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
}

async function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'grid';

    // Set admin name
    const adminName = AdminUtils.getStorage('adminUsername', 'Administrador');
    document.getElementById('admin-name').textContent = adminName;

    // Set last access
    const lastAccess = AdminUtils.getStorage('adminLastAccess');
    if (lastAccess) {
        document.getElementById('last-access').textContent = AdminUtils.formatDate(lastAccess);
    }

    // Inicializar backend y cargar datos
    await AdminBackend.init();
    updateDashboard();
}

async function handleRefreshData() {
    const refreshBtn = document.getElementById('refresh-data');
    const icon = refreshBtn.querySelector('i');
    icon.classList.add('fa-spin');

    await AdminBackend.loadAllData();
    updateDashboard();

    icon.classList.remove('fa-spin');
    AdminUtils.showToast('Datos actualizados correctamente');
}

/**
 * ========================================
 * NAVEGACIÓN
 * ========================================
 */

function navigateToSection(sectionId) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${sectionId}`).classList.add('active');
}

/**
 * ========================================
 * DASHBOARD
 * ========================================
 */

function updateDashboard() {
    updateStats();
    renderUsers();
    renderLogs();
    loadTransferHistory();
    loadSentNotifications();
}

function updateStats() {
    const stats = AdminBackend.getStats();

    document.getElementById('total-users').textContent = stats.totalUsers;
    document.getElementById('active-users').textContent = stats.activeUsers;
    document.getElementById('blocked-users').textContent = stats.blockedUsers;
    document.getElementById('total-balance').textContent = AdminUtils.formatCurrency(stats.totalBalance);
    document.getElementById('total-logs').textContent = AdminBackend.state.logs.length;

    // Actividad reciente
    const recentLogs = AdminBackend.state.logs.slice(0, 5);
    const activityDiv = document.getElementById('recent-activity');

    if (recentLogs.length > 0) {
        activityDiv.innerHTML = recentLogs.map(log => `
            <div class="activity-item">
                <i class="fas fa-${AdminUtils.getActionIcon(log.action)}"></i>
                <span>${AdminUtils.escapeHtml(log.description)}</span>
                <span class="log-time">${AdminUtils.formatTimeAgo(log.timestamp)}</span>
            </div>
        `).join('');
    } else {
        activityDiv.innerHTML = '<p class="empty-state">No hay actividad reciente</p>';
    }
}

/**
 * ========================================
 * USUARIOS
 * ========================================
 */

function setupUsersSection() {
    document.getElementById('search-users')?.addEventListener('input', AdminUtils.debounce(handleSearchUsers, 300));
    document.getElementById('filter-status')?.addEventListener('change', handleFilterUsers);
    document.getElementById('filter-provider')?.addEventListener('change', handleFilterUsers);

    document.getElementById('select-all-users')?.addEventListener('change', handleSelectAll);
    document.getElementById('bulk-delete')?.addEventListener('click', () => handleBulkAction('delete'));
    document.getElementById('bulk-block')?.addEventListener('click', () => handleBulkAction('block'));
    document.getElementById('bulk-unblock')?.addEventListener('click', () => handleBulkAction('unblock'));

    document.getElementById('export-users')?.addEventListener('click', () => AdminBackend.exportUsers());
    document.getElementById('prev-page')?.addEventListener('click', () => changePage(-1));
    document.getElementById('next-page')?.addEventListener('click', () => changePage(1));
}

function handleSearchUsers() {
    const searchTerm = document.getElementById('search-users').value;
    AdminBackend.searchUsers(searchTerm);
    AdminBackend.state.currentPage = 1;
    renderUsers();
}

function handleFilterUsers() {
    const statusFilter = document.getElementById('filter-status').value;
    const providerFilter = document.getElementById('filter-provider').value;
    AdminBackend.filterUsers(statusFilter, providerFilter);
    AdminBackend.state.currentPage = 1;
    renderUsers();
}

function handleSelectAll(e) {
    const checkboxes = document.querySelectorAll('.user-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
        e.target.checked ? AdminBackend.state.selectedUsers.add(cb.dataset.userId) : AdminBackend.state.selectedUsers.delete(cb.dataset.userId);
    });
    updateBulkActions();
}

function renderUsers() {
    const tbody = document.getElementById('users-table-body');
    const users = AdminBackend.state.filteredUsers.length > 0 ? AdminBackend.state.filteredUsers : AdminBackend.state.users;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No hay usuarios registrados</td></tr>';
        updatePagination();
        return;
    }

    const paginatedData = AdminUtils.paginateArray(users, AdminBackend.state.currentPage, AdminBackend.state.usersPerPage);

    tbody.innerHTML = paginatedData.data.map(user => {
        const balance = user.balance || { usd: 0 };
        const provider = user.auth_provider || user.authProvider || 'email';
        const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Sin nombre';

        return `<tr>
            <td><input type="checkbox" class="user-checkbox" data-user-id="${user.id}" ${AdminBackend.state.selectedUsers.has(user.id) ? 'checked' : ''}></td>
            <td>${AdminUtils.escapeHtml(name)}</td>
            <td>${AdminUtils.escapeHtml(user.email || '-')}</td>
            <td>${AdminUtils.escapeHtml(user.phoneNumber || '-')}</td>
            <td>${AdminUtils.formatCurrency(balance.usd)}</td>
            <td><span class="status-badge ${user.status}">${user.status === 'active' ? 'Activo' : 'Bloqueado'}</span></td>
            <td><span class="provider-badge"><i class="fas fa-${provider === 'google' ? 'google' : 'envelope'}"></i> ${provider}</span></td>
            <td>${AdminUtils.formatDate(user.createdAt || user.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewUser('${user.id}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn ${user.status === 'blocked' ? 'edit' : 'block'}" onclick="toggleBlockUser('${user.id}')">
                        <i class="fas fa-${user.status === 'blocked' ? 'check' : 'ban'}"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteUser('${user.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    // Event listeners for checkboxes
    document.querySelectorAll('.user-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            e.target.checked ? AdminBackend.state.selectedUsers.add(e.target.dataset.userId) : AdminBackend.state.selectedUsers.delete(e.target.dataset.userId);
            updateBulkActions();
        });
    });

    updatePagination();
}

function updatePagination() {
    const users = AdminBackend.state.filteredUsers.length > 0 ? AdminBackend.state.filteredUsers : AdminBackend.state.users;
    const totalPages = Math.ceil(users.length / AdminBackend.state.usersPerPage) || 1;

    document.getElementById('page-info').textContent = `Página ${AdminBackend.state.currentPage} de ${totalPages}`;
    document.getElementById('prev-page').disabled = AdminBackend.state.currentPage === 1;
    document.getElementById('next-page').disabled = AdminBackend.state.currentPage >= totalPages;
}

function changePage(direction) {
    const users = AdminBackend.state.filteredUsers.length > 0 ? AdminBackend.state.filteredUsers : AdminBackend.state.users;
    const totalPages = Math.ceil(users.length / AdminBackend.state.usersPerPage);
    const newPage = AdminBackend.state.currentPage + direction;

    if (newPage >= 1 && newPage <= totalPages) {
        AdminBackend.state.currentPage = newPage;
        renderUsers();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateBulkActions() {
    const bulkActions = document.getElementById('bulk-actions');
    const selectedCount = document.getElementById('selected-count');

    if (AdminBackend.state.selectedUsers.size > 0) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = `${AdminBackend.state.selectedUsers.size} usuario${AdminBackend.state.selectedUsers.size > 1 ? 's' : ''} seleccionado${AdminBackend.state.selectedUsers.size > 1 ? 's' : ''}`;
    } else {
        bulkActions.style.display = 'none';
    }
}

// Funciones globales para onclick
async function viewUser(userId) {
    const user = AdminBackend.getUser(userId);
    if (!user) return;

    const modal = document.getElementById('user-detail-modal');
    const modalBody = document.getElementById('user-detail-body');
    const balance = user.balance || { usd: 0, bs: 0, eur: 0 };

    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <h4 style="margin-bottom: 10px; color: var(--primary);">Información Personal</h4>
                <p><strong>Nombre:</strong> ${AdminUtils.escapeHtml(user.fullName || 'Sin nombre')}</p>
                <p><strong>Email:</strong> ${AdminUtils.escapeHtml(user.email || 'Sin email')}</p>
                <p><strong>Teléfono:</strong> ${AdminUtils.escapeHtml(user.phoneNumber || 'Sin teléfono')}</p>
                <p><strong>Estado:</strong> <span class="status-badge ${user.status}">${user.status === 'active' ? 'Activo' : 'Bloqueado'}</span></p>
            </div>
            <div>
                <h4 style="margin-bottom: 10px; color: var(--primary);">Balance</h4>
                <p><strong>USD:</strong> ${AdminUtils.formatCurrency(balance.usd)}</p>
                <p><strong>Bs:</strong> Bs ${(balance.bs || 0).toFixed(2)}</p>
                <p><strong>EUR:</strong> €${(balance.eur || 0).toFixed(2)}</p>
                <p><strong>Registro:</strong> ${AdminUtils.formatDate(user.createdAt || user.created_at)}</p>
            </div>
        </div>
        <div style="margin-top: 20px; display: flex; gap: 10px;">
            <button class="btn btn-primary" onclick="quickSendMoney('${userId}')"><i class="fas fa-money-bill-wave"></i> Enviar Dinero</button>
            <button class="btn btn-warning" onclick="toggleBlockUser('${userId}'); AdminUtils.closeModal('user-detail-modal')">
                <i class="fas fa-ban"></i> ${user.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
            </button>
            <button class="btn btn-danger" onclick="deleteUser('${userId}'); AdminUtils.closeModal('user-detail-modal')"><i class="fas fa-trash"></i> Eliminar</button>
        </div>
    `;

    modal.classList.add('active');
    document.getElementById('close-user-modal').onclick = () => modal.classList.remove('active');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
}

async function toggleBlockUser(userId) {
    const user = AdminBackend.getUser(userId);
    if (!user) return;

    const action = user.status === 'blocked' ? 'desbloquear' : 'bloquear';

    AdminUtils.showConfirmation(
        `¿${action.charAt(0).toUpperCase() + action.slice(1)} usuario?`,
        `¿Seguro que desea ${action} a ${user.fullName || user.email}?`,
        async () => {
            const result = await AdminBackend.toggleBlockUser(userId);
            if (result.success) {
                renderUsers();
                updateStats();
                AdminUtils.showToast(`Usuario ${action}ado correctamente`);
            }
        }
    );
}

async function deleteUser(userId) {
    const user = AdminBackend.getUser(userId);
    if (!user) return;

    AdminUtils.showConfirmation(
        'Eliminar usuario',
        `¿Seguro que desea eliminar a ${user.fullName || user.email}? No se puede deshacer.`,
        async () => {
            const result = await AdminBackend.deleteUser(userId);
            if (result.success) {
                renderUsers();
                updateStats();
                AdminUtils.showToast('Usuario eliminado correctamente');
            }
        }
    );
}

async function handleBulkAction(action) {
    if (AdminBackend.state.selectedUsers.size === 0) return;

    const actionText = { 'delete': 'eliminar', 'block': 'bloquear', 'unblock': 'desbloquear' }[action];

    AdminUtils.showConfirmation(
        `${actionText} usuarios`,
        `¿Seguro que desea ${actionText} ${AdminBackend.state.selectedUsers.size} usuarios?`,
        async () => {
            for (const userId of AdminBackend.state.selectedUsers) {
                if (action === 'delete') {
                    await AdminBackend.deleteUser(userId);
                } else {
                    const user = AdminBackend.getUser(userId);
                    if (user && ((action === 'block' && user.status === 'active') || (action === 'unblock' && user.status === 'blocked'))) {
                        await AdminBackend.toggleBlockUser(userId);
                    }
                }
            }

            AdminBackend.clearSelection();
            renderUsers();
            updateStats();
            updateBulkActions();
            AdminUtils.showToast(`Acción completada sobre ${AdminBackend.state.selectedUsers.size} usuarios`);
        }
    );
}

/**
 * ========================================
 * ENVIAR DINERO
 * ========================================
 */

function setupSendMoneySection() {
    const recipientSearch = document.getElementById('recipient-search');
    const recipientResults = document.getElementById('recipient-results');

    if (recipientSearch) {
        recipientSearch.addEventListener('input', AdminUtils.debounce((e) => {
            const searchTerm = e.target.value.toLowerCase();
            if (searchTerm.length < 2) {
                recipientResults.classList.remove('active');
                return;
            }

            const matches = AdminBackend.searchUsers(searchTerm).slice(0, 5);

            if (matches.length > 0) {
                recipientResults.innerHTML = matches.map(user => `
                    <div class="search-result-item" data-user-id="${user.id}">
                        ${AdminUtils.escapeHtml(user.fullName || 'Sin nombre')} - ${AdminUtils.escapeHtml(user.email)}
                    </div>
                `).join('');
                recipientResults.classList.add('active');

                recipientResults.querySelectorAll('.search-result-item').forEach(item => {
                    item.addEventListener('click', () => selectRecipient(item.dataset.userId));
                });
            } else {
                recipientResults.classList.remove('active');
            }
        }, 300));
    }

    document.getElementById('send-money-form')?.addEventListener('submit', handleSendMoney);

    // Auto-calculate conversions
    const amountUsd = document.getElementById('amount-usd');
    const amountBs = document.getElementById('amount-bs');
    const exchangeRate = 36.5;

    if (amountUsd && amountBs) {
        amountUsd.addEventListener('input', (e) => {
            amountBs.value = ((parseFloat(e.target.value) || 0) * exchangeRate).toFixed(2);
        });
        amountBs.addEventListener('input', (e) => {
            amountUsd.value = ((parseFloat(e.target.value) || 0) / exchangeRate).toFixed(2);
        });
    }
}

function selectRecipient(userId) {
    const user = AdminBackend.getUser(userId);
    if (!user) return;

    selectedRecipient = user;
    document.getElementById('selected-recipient').value = `${user.fullName || 'Sin nombre'} (${user.email})`;
    document.getElementById('recipient-results').classList.remove('active');
    document.getElementById('recipient-search').value = '';
}

async function handleSendMoney(e) {
    e.preventDefault();

    if (!selectedRecipient) {
        AdminUtils.showToast('Seleccione un destinatario', 'error');
        return;
    }

    const amountUsd = parseFloat(document.getElementById('amount-usd').value) || 0;
    const amountBs = parseFloat(document.getElementById('amount-bs').value) || 0;
    const concept = document.getElementById('transfer-concept').value;

    if (amountUsd === 0 && amountBs === 0) {
        AdminUtils.showToast('Ingrese un monto', 'error');
        return;
    }

    AdminUtils.showConfirmation(
        'Confirmar envío',
        `¿Enviar ${AdminUtils.formatCurrency(amountUsd)} a ${selectedRecipient.fullName || selectedRecipient.email}?`,
        async () => {
            const result = await AdminBackend.sendMoney(selectedRecipient.id, amountUsd, amountBs, concept);

            if (result.success) {
                document.getElementById('send-money-form').reset();
                selectedRecipient = null;
                document.getElementById('selected-recipient').value = '';

                await AdminBackend.loadAllData();
                updateDashboard();
                loadTransferHistory();

                AdminUtils.showToast('Dinero enviado correctamente');
            } else {
                AdminUtils.showToast('Error enviando dinero', 'error');
            }
        }
    );
}

function quickSendMoney(userId) {
    navigateToSection('send-money');
    selectRecipient(userId);
    setTimeout(() => document.getElementById('amount-usd')?.focus(), 300);
}

function loadTransferHistory() {
    const transfers = AdminBackend.state.transfers;
    const historyDiv = document.getElementById('transfer-history');

    if (transfers.length === 0) {
        historyDiv.innerHTML = '<p class="empty-state">No hay transferencias recientes</p>';
        return;
    }

    historyDiv.innerHTML = transfers.slice(0, 10).map(transfer => `
        <div class="transfer-item">
            <h4>${AdminUtils.escapeHtml(transfer.recipientName || transfer.recipient)}</h4>
            <p><strong>Monto:</strong> ${AdminUtils.formatCurrency(transfer.amountUsd)}</p>
            ${transfer.concept ? `<p><strong>Concepto:</strong> ${AdminUtils.escapeHtml(transfer.concept)}</p>` : ''}
            <p><strong>Fecha:</strong> ${AdminUtils.formatDateTime(transfer.timestamp)}</p>
        </div>
    `).join('');
}

/**
 * ========================================
 * NOTIFICACIONES
 * ========================================
 */

function setupNotificationsSection() {
    document.getElementById('notification-type')?.addEventListener('change', updateNotificationPreview);
    document.getElementById('notification-title')?.addEventListener('input', updateNotificationPreview);
    document.getElementById('notification-message')?.addEventListener('input', updateNotificationPreview);

    document.getElementById('notification-target')?.addEventListener('change', (e) => {
        document.getElementById('specific-user-group').style.display = e.target.value === 'specific' ? 'block' : 'none';
    });

    document.getElementById('notification-form')?.addEventListener('submit', handleSendNotification);
}

function updateNotificationPreview() {
    const type = document.getElementById('notification-type').value;
    const title = document.getElementById('notification-title').value || 'Título de la notificación';
    const message = document.getElementById('notification-message').value || 'Contenido del mensaje aparecerá aquí...';

    const previewNotification = document.querySelector('.preview-notification');
    previewNotification.className = `preview-notification ${type}`;

    const icons = { 'info': 'fa-info-circle', 'success': 'fa-check-circle', 'warning': 'fa-exclamation-triangle', 'error': 'fa-times-circle' };
    previewNotification.querySelector('i').className = `fas ${icons[type]}`;
    document.getElementById('preview-title').textContent = title;
    document.getElementById('preview-message').textContent = message;
}

async function handleSendNotification(e) {
    e.preventDefault();

    const type = document.getElementById('notification-type').value;
    const target = document.getElementById('notification-target').value;
    const title = document.getElementById('notification-title').value;
    const message = document.getElementById('notification-message').value;

    let recipientText = '';
    let recipientCount = 0;

    switch (target) {
        case 'all':
            recipientText = 'todos los usuarios';
            recipientCount = AdminBackend.state.users.length;
            break;
        case 'active':
            recipientText = 'usuarios activos';
            recipientCount = AdminBackend.state.users.filter(u => u.status === 'active').length;
            break;
        case 'blocked':
            recipientText = 'usuarios bloqueados';
            recipientCount = AdminBackend.state.users.filter(u => u.status === 'blocked').length;
            break;
        case 'specific':
            if (!selectedNotificationUser) {
                AdminUtils.showToast('Seleccione un usuario', 'error');
                return;
            }
            recipientText = selectedNotificationUser.email;
            recipientCount = 1;
            break;
    }

    AdminUtils.showConfirmation(
        'Enviar notificación',
        `¿Enviar esta notificación a ${recipientText} (${recipientCount} usuarios)?`,
        async () => {
            const result = await AdminBackend.sendNotification(type, target, title, message);

            if (result.success) {
                document.getElementById('notification-form').reset();
                selectedNotificationUser = null;
                updateNotificationPreview();
                loadSentNotifications();
                AdminUtils.showToast(`Notificación enviada a ${result.recipientCount} usuarios`);
            } else {
                AdminUtils.showToast('Error enviando notificación', 'error');
            }
        }
    );
}

function loadSentNotifications() {
    const notifications = AdminBackend.state.notifications;
    const listDiv = document.getElementById('sent-notifications-list');

    if (notifications.length === 0) {
        listDiv.innerHTML = '<p class="empty-state">No hay notificaciones enviadas</p>';
        return;
    }

    listDiv.innerHTML = notifications.slice(0, 10).map(notif => `
        <div class="sent-notification-item">
            <h4><i class="fas fa-${AdminUtils.getNotificationIcon(notif.type)}"></i> ${AdminUtils.escapeHtml(notif.title)}</h4>
            <p>${AdminUtils.escapeHtml(notif.message)}</p>
            <p><strong>Destinatarios:</strong> ${notif.recipientCount} usuarios (${notif.target})</p>
            <p><strong>Enviada:</strong> ${AdminUtils.formatDateTime(notif.timestamp)}</p>
        </div>
    `).join('');
}

/**
 * ========================================
 * LOGS
 * ========================================
 */

function setupLogsSection() {
    document.getElementById('search-logs')?.addEventListener('input', AdminUtils.debounce(renderLogs, 300));
    document.getElementById('filter-log-action')?.addEventListener('change', renderLogs);
    document.getElementById('export-logs')?.addEventListener('click', () => AdminBackend.exportLogs());
}

function renderLogs() {
    const searchTerm = document.getElementById('search-logs')?.value || '';
    const actionFilter = document.getElementById('filter-log-action')?.value || 'all';

    const filteredLogs = AdminBackend.searchLogs(searchTerm, actionFilter);
    const logsDiv = document.getElementById('logs-list');

    if (filteredLogs.length === 0) {
        logsDiv.innerHTML = '<p class="empty-state">No hay registros de actividad</p>';
        return;
    }

    logsDiv.innerHTML = filteredLogs.map(log => `
        <div class="log-item ${log.action}">
            <i class="fas fa-${AdminUtils.getActionIcon(log.action)}"></i>
            <div style="flex: 1;">
                <strong>${AdminUtils.escapeHtml(log.description)}</strong>
                <br><small>Por: ${AdminUtils.escapeHtml(log.admin)}</small>
            </div>
            <span class="log-time">${AdminUtils.formatDateTime(log.timestamp)}</span>
        </div>
    `).join('');
}

/**
 * ========================================
 * CONFIGURACIÓN
 * ========================================
 */

function setupSettingsSection() {
    document.getElementById('change-password-form')?.addEventListener('submit', handleChangePassword);
    document.getElementById('clear-cache')?.addEventListener('click', handleClearCache);
    document.getElementById('delete-all-logs')?.addEventListener('click', handleDeleteLogs);
}

async function handleChangePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (currentPassword !== ADMIN_CREDENTIALS.password) {
        AdminUtils.showToast('Contraseña actual incorrecta', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        AdminUtils.showToast('Las contraseñas no coinciden', 'error');
        return;
    }

    if (newPassword.length < 6) {
        AdminUtils.showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    ADMIN_CREDENTIALS.password = newPassword;
    await AdminBackend.addLog('settings', 'Contraseña cambiada');
    document.getElementById('change-password-form').reset();
    AdminUtils.showToast('Contraseña cambiada correctamente');
}

function handleClearCache() {
    AdminUtils.showConfirmation(
        'Limpiar caché',
        '¿Seguro que desea limpiar el caché? Esto no afectará los datos de usuarios.',
        async () => {
            AdminSupabase.clearCache();
            await AdminBackend.addLog('settings', 'Caché limpiado');
            AdminUtils.showToast('Caché limpiado correctamente');
        }
    );
}

function handleDeleteLogs() {
    AdminUtils.showConfirmation(
        'Eliminar logs',
        '¿Seguro que desea eliminar todos los logs?',
        async () => {
            await AdminBackend.deleteLogs();
            renderLogs();
            loadTransferHistory();
            loadSentNotifications();
            await AdminBackend.addLog('settings', 'Todos los logs eliminados');
            AdminUtils.showToast('Logs eliminados correctamente');
        }
    );
}

console.log('[AdminPanel] Panel de administración listo. Credenciales: admin/admin123');
