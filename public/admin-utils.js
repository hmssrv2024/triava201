/**
 * Admin Utils - Utilidades Modulares
 * Funciones reutilizables para el panel de administración
 */

const AdminUtils = {
    /**
     * Escapa HTML para prevenir XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Formatea fecha en español
     */
    formatDate(dateString) {
        if (!dateString) return 'Desconocida';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Formatea fecha y hora completa
     */
    formatDateTime(dateString) {
        if (!dateString) return 'Desconocida';
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Formatea tiempo relativo (hace X minutos/horas/días)
     */
    formatTimeAgo(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Hace ${diffHours}h`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `Hace ${diffDays}d`;

        return this.formatDate(dateString);
    },

    /**
     * Formatea moneda
     */
    formatCurrency(amount, currency = 'USD') {
        const symbols = { USD: '$', EUR: '€', VES: 'Bs' };
        const symbol = symbols[currency] || currency;
        return `${symbol}${parseFloat(amount || 0).toFixed(2)}`;
    },

    /**
     * Valida email
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Genera ID único
     */
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Descarga archivo CSV
     */
    downloadCSV(data, filename) {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(',')
            )
        ].join('\n');

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    },

    /**
     * Muestra toast notification
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');

        if (!toast || !toastMessage) return;

        toastMessage.textContent = message;
        toast.className = `toast ${type}`;

        const icon = toast.querySelector('i');
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-times-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };

        if (icon) {
            icon.className = `fas ${icons[type] || icons.success}`;
        }

        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    },

    /**
     * Muestra modal de confirmación
     */
    showConfirmation(title, message, onConfirm, onCancel) {
        const modal = document.getElementById('confirm-modal');
        if (!modal) return;

        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const cancelBtn = document.getElementById('cancel-confirm');
        const acceptBtn = document.getElementById('accept-confirm');

        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;

        modal.classList.add('active');

        const handleCancel = () => {
            modal.classList.remove('active');
            if (onCancel) onCancel();
        };

        const handleAccept = () => {
            modal.classList.remove('active');
            if (onConfirm) onConfirm();
        };

        if (cancelBtn) {
            cancelBtn.onclick = handleCancel;
        }

        if (acceptBtn) {
            acceptBtn.onclick = handleAccept;
        }

        modal.onclick = (e) => {
            if (e.target === modal) handleCancel();
        };
    },

    /**
     * Cierra modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Filtra array por múltiples criterios
     */
    filterArray(array, filters) {
        return array.filter(item => {
            return Object.keys(filters).every(key => {
                if (!filters[key]) return true;
                const value = String(item[key] || '').toLowerCase();
                const filterValue = String(filters[key]).toLowerCase();
                return value.includes(filterValue);
            });
        });
    },

    /**
     * Ordena array por campo
     */
    sortArray(array, field, ascending = true) {
        return array.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];

            if (aVal === bVal) return 0;

            const comparison = aVal > bVal ? 1 : -1;
            return ascending ? comparison : -comparison;
        });
    },

    /**
     * Pagina array
     */
    paginateArray(array, page, perPage) {
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        return {
            data: array.slice(startIndex, endIndex),
            total: array.length,
            totalPages: Math.ceil(array.length / perPage),
            currentPage: page,
            perPage: perPage
        };
    },

    /**
     * Obtiene icono según tipo de acción
     */
    getActionIcon(action) {
        const icons = {
            'login': 'sign-in-alt',
            'logout': 'sign-out-alt',
            'delete': 'trash',
            'block': 'ban',
            'unblock': 'check',
            'desbloquear': 'check',
            'send_money': 'money-bill-wave',
            'notification': 'bell',
            'export': 'download',
            'settings': 'cog'
        };
        return icons[action] || 'info-circle';
    },

    /**
     * Obtiene icono según tipo de notificación
     */
    getNotificationIcon(type) {
        const icons = {
            'info': 'info-circle',
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'error': 'times-circle'
        };
        return icons[type] || 'bell';
    },

    /**
     * Calcula estadísticas de array
     */
    calculateStats(array, field) {
        if (!array || array.length === 0) return { sum: 0, avg: 0, min: 0, max: 0 };

        const values = array.map(item => parseFloat(item[field]) || 0);
        const sum = values.reduce((a, b) => a + b, 0);

        return {
            sum: sum,
            avg: sum / values.length,
            min: Math.min(...values),
            max: Math.max(...values)
        };
    },

    /**
     * Valida objeto contra schema
     */
    validateSchema(obj, schema) {
        const errors = [];

        Object.keys(schema).forEach(key => {
            const rules = schema[key];
            const value = obj[key];

            if (rules.required && !value) {
                errors.push(`${key} es requerido`);
            }

            if (rules.type && value && typeof value !== rules.type) {
                errors.push(`${key} debe ser de tipo ${rules.type}`);
            }

            if (rules.min && value < rules.min) {
                errors.push(`${key} debe ser mayor o igual a ${rules.min}`);
            }

            if (rules.max && value > rules.max) {
                errors.push(`${key} debe ser menor o igual a ${rules.max}`);
            }

            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(`${key} tiene un formato inválido`);
            }
        });

        return { valid: errors.length === 0, errors };
    },

    /**
     * Almacena en localStorage de forma segura
     */
    setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error guardando en localStorage:', e);
            return false;
        }
    },

    /**
     * Obtiene de localStorage de forma segura
     */
    getStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error leyendo de localStorage:', e);
            return defaultValue;
        }
    },

    /**
     * Elimina de localStorage
     */
    removeStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Error eliminando de localStorage:', e);
            return false;
        }
    }
};

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminUtils;
}

console.log('[AdminUtils] Módulo de utilidades cargado');
