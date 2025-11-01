// =====================================================
// CONFIGURACIÓN DE SUPABASE
// =====================================================
const SUPABASE_URL = 'https://ewdkxszfkqwlkyszodxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3ZGt4c3pma3F3bGt5c3pvZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODM5MzMsImV4cCI6MjA3NzM1OTkzM30.alofRt3MEn5UgSsSMk5zWTF0On1PGVepdME-MOoqk-M';

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_REDIRECT_PATH = '/admin-registros.html';

// =====================================================
// ELEMENTOS DEL DOM
// =====================================================
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const buttonText = document.getElementById('buttonText');
const buttonLoader = document.getElementById('buttonLoader');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const togglePassword = document.getElementById('togglePassword');

// =====================================================
// FUNCIONES DE UI
// =====================================================

function showError(message, fieldError = null) {
    errorMessage.querySelector('p').textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
    
    if (fieldError === 'email') {
        emailError.textContent = message;
        emailError.classList.remove('hidden');
        emailInput.classList.add('border-red-400');
    } else if (fieldError === 'password') {
        passwordError.textContent = message;
        passwordError.classList.remove('hidden');
        passwordInput.classList.add('border-red-400');
    }
}

function showSuccess(message) {
    successMessage.querySelector('p').textContent = message;
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
}

function hideErrors() {
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');
    emailError.classList.add('hidden');
    passwordError.classList.add('hidden');
    emailInput.classList.remove('border-red-400');
    passwordInput.classList.remove('border-red-400');
}

function setLoading(loading) {
    loginButton.disabled = loading;
    if (loading) {
        buttonText.classList.add('hidden');
        buttonLoader.classList.remove('hidden');
    } else {
        buttonText.classList.remove('hidden');
        buttonLoader.classList.add('hidden');
    }
}

// =====================================================
// VALIDACIÓN DE FORMULARIO
// =====================================================

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function getRedirectUrl() {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect');

    if (redirectParam) {
        try {
            const redirectUrl = new URL(redirectParam, window.location.origin);
            if (redirectUrl.origin === window.location.origin && redirectUrl.pathname !== '/auth/login.html') {
                return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
            }
        } catch (error) {
            console.warn('Parámetro de redirección inválido, se usará el destino por defecto.', error);
        }
    }

    return DEFAULT_REDIRECT_PATH;
}

// =====================================================
// FUNCIONES DE AUTENTICACIÓN
// =====================================================

async function checkIfUserIsAdmin(userId) {
    try {
        const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle();

        if (error) {
            console.error('Error verificando admin:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Error en checkIfUserIsAdmin:', err);
        return null;
    }
}

async function updateAdminLastLogin(userId) {
    try {
        const { error } = await supabase
            .from('admin_users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('user_id', userId);

        if (error) {
            console.error('Error actualizando último login:', error);
        }
    } catch (err) {
        console.error('Error en updateAdminLastLogin:', err);
    }
}

async function logAdminAction(action, details = {}) {
    try {
        const { error } = await supabase
            .from('admin_audit_log')
            .insert({
                action: action,
                details: details,
                ip_address: 'web_client',
                user_agent: navigator.userAgent
            });

        if (error) {
            console.error('Error registrando acción:', error);
        }
    } catch (err) {
        console.error('Error en logAdminAction:', err);
    }
}

async function handleLogin(email, password) {
    try {
        // Paso 1: Autenticar con Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) {
            throw new Error(authError.message);
        }

        if (!authData.user) {
            throw new Error('No se pudo obtener información del usuario');
        }

        // Paso 2: Verificar que el usuario es admin
        const adminData = await checkIfUserIsAdmin(authData.user.id);

        if (!adminData) {
            // Si no es admin, cerrar sesión inmediatamente
            await supabase.auth.signOut();
            throw new Error('Acceso denegado: No tienes permisos de administrador');
        }

        // Paso 3: Actualizar último login y registrar acción
        await updateAdminLastLogin(authData.user.id);
        await logAdminAction('login', {
            email: email,
            role: adminData.role,
            timestamp: new Date().toISOString()
        });

        // Paso 4: Guardar información del admin en sessionStorage
        sessionStorage.setItem('admin_user', JSON.stringify({
            id: adminData.id,
            user_id: adminData.user_id,
            email: adminData.email,
            full_name: adminData.full_name,
            role: adminData.role
        }));

        // Paso 5: Mostrar éxito y redirigir
        showSuccess('Autenticación exitosa. Redirigiendo...');

        const redirectUrl = getRedirectUrl();
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1500);

        return true;

    } catch (error) {
        console.error('Error en login:', error);
        throw error;
    }
}

// =====================================================
// EVENT LISTENERS
// =====================================================

// Toggle mostrar/ocultar contraseña
togglePassword.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
});

// Limpiar errores al escribir
emailInput.addEventListener('input', hideErrors);
passwordInput.addEventListener('input', hideErrors);

// Manejo del formulario
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validaciones
    if (!validateEmail(email)) {
        showError('Por favor ingresa un correo electrónico válido', 'email');
        return;
    }

    if (!validatePassword(password)) {
        showError('La contraseña debe tener al menos 6 caracteres', 'password');
        return;
    }

    // Intentar login
    setLoading(true);

    try {
        await handleLogin(email, password);
    } catch (error) {
        let errorMsg = 'Error al iniciar sesión. Por favor intenta de nuevo.';
        
        if (error.message.includes('Invalid login credentials')) {
            errorMsg = 'Credenciales inválidas. Verifica tu correo y contraseña.';
        } else if (error.message.includes('No tienes permisos')) {
            errorMsg = error.message;
        } else if (error.message.includes('Email not confirmed')) {
            errorMsg = 'Por favor confirma tu correo electrónico antes de iniciar sesión.';
        }
        
        showError(errorMsg);
    } finally {
        setLoading(false);
    }
});

// =====================================================
// VERIFICAR SESIÓN AL CARGAR
// =====================================================

async function checkExistingSession() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            console.error('Error obteniendo usuario:', error);
            return;
        }

        if (user) {
            // Verificar si es admin
            const adminData = await checkIfUserIsAdmin(user.id);

            if (adminData) {
                // Ya está autenticado, redirigir al dashboard
                window.location.href = getRedirectUrl();
            } else {
                // No es admin, cerrar sesión
                await supabase.auth.signOut();
            }
        }
    } catch (err) {
        console.error('Error verificando sesión:', err);
    }
}

// Verificar sesión al cargar la página
document.addEventListener('DOMContentLoaded', checkExistingSession);
