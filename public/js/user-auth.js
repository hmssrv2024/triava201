/**
 * REMEEX VISA - Sistema de Autenticación y Sincronización
 *
 * Funcionalidades:
 * - Login de usuario
 * - Sincronización localStorage ↔ Supabase
 * - Multi-dispositivo
 * - Sesiones persistentes
 */

(function() {
  'use strict';

  class UserAuth {
    constructor() {
      this.supabase = null;
      this.currentUser = null;
      this.syncInterval = null;
      this.SESSION_KEY = 'remeex_user_session';
      this.USER_DATA_KEY = 'remeex_user_data';
    }

    /**
     * Inicializar sistema de autenticación
     */
    async init() {
      // Esperar a que Supabase esté listo
      if (!window.SupabaseDB || !window.SupabaseDB.isReady()) {
        console.log('[UserAuth] Esperando Supabase...');
        setTimeout(() => this.init(), 500);
        return;
      }

      this.supabase = window.supabaseClient;
      console.log('[UserAuth] ✅ Sistema inicializado');
    }

    /**
     * Login de usuario
     */
    async login(email, password) {
      try {
        console.log('[UserAuth] Intentando login:', email);

        // Llamar función de autenticación en Supabase
        const { data, error } = await this.supabase
          .rpc('authenticate_user', {
            p_email: email,
            p_password: password
          });

        if (error) throw error;

        const result = data[0];

        if (!result.success) {
          console.warn('[UserAuth] Login fallido:', result.message);
          return {
            ok: false,
            error: result.message,
            blocked: result.account_blocked
          };
        }

        // Login exitoso
        console.log('[UserAuth] ✅ Login exitoso');

        // Crear sesión
        await this.createSession(result);

        // Cargar datos del usuario
        await this.loadUserData(email);

        // Registrar dispositivo
        await this.logDevice(email);

        return {
          ok: true,
          user: {
            id: result.user_id,
            email: result.user_email,
            fullName: result.full_name,
            isValidated: result.is_validated
          }
        };
      } catch (error) {
        console.error('[UserAuth] Error en login:', error);
        return {
          ok: false,
          error: 'Error de conexión. Intenta nuevamente.'
        };
      }
    }

    /**
     * Crear sesión local y en Supabase
     */
    async createSession(userData) {
      const session = {
        userId: userData.user_id,
        email: userData.user_email,
        fullName: userData.full_name,
        isValidated: userData.is_validated,
        loginTime: new Date().toISOString(),
        deviceInfo: this.getDeviceInfo()
      };

      // Guardar en localStorage
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      localStorage.setItem('user_email', userData.user_email);

      // Crear sesión en Supabase
      await window.SupabaseDB.createSession(
        userData.user_email,
        session.deviceInfo.ip,
        session.deviceInfo.userAgent
      );

      this.currentUser = session;
      console.log('[UserAuth] ✅ Sesión creada');
    }

    /**
     * Verificar si hay sesión activa
     */
    async checkSession() {
      const sessionData = localStorage.getItem(this.SESSION_KEY);

      if (!sessionData) {
        console.log('[UserAuth] No hay sesión local');
        return null;
      }

      try {
        const session = JSON.parse(sessionData);

        // Verificar que no haya expirado (24 horas)
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const hoursElapsed = (now - loginTime) / (1000 * 60 * 60);

        if (hoursElapsed > 24) {
          console.log('[UserAuth] Sesión expirada');
          await this.logout();
          return null;
        }

        // Verificar contra Supabase
        const result = await window.SupabaseDB.getProfile(session.email);

        if (!result.ok) {
          console.log('[UserAuth] Usuario no encontrado en Supabase');
          await this.logout();
          return null;
        }

        // Verificar si cuenta está bloqueada
        if (result.data.account_blocked) {
          console.log('[UserAuth] Cuenta bloqueada');
          await this.logout();
          return {
            blocked: true,
            reason: result.data.block_reason
          };
        }

        this.currentUser = session;
        console.log('[UserAuth] ✅ Sesión válida');
        return session;
      } catch (error) {
        console.error('[UserAuth] Error verificando sesión:', error);
        return null;
      }
    }

    /**
     * Cargar datos completos del usuario desde Supabase
     */
    async loadUserData(email) {
      try {
        console.log('[UserAuth] Cargando datos del usuario...');

        // Llamar función que obtiene TODO
        const { data, error } = await this.supabase
          .rpc('get_user_data', {
            p_email: email
          });

        if (error) throw error;

        // Guardar en localStorage
        localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(data));

        console.log('[UserAuth] ✅ Datos cargados:', {
          balance: data.balance?.current_balance || 0,
          transactions: data.recent_transactions?.length || 0,
          notifications: data.unread_notifications?.length || 0,
          pendingTransfers: data.pending_transfers?.length || 0
        });

        return data;
      } catch (error) {
        console.error('[UserAuth] Error cargando datos:', error);
        return null;
      }
    }

    /**
     * Sincronizar datos con Supabase
     */
    async syncData(email) {
      try {
        const userData = await this.loadUserData(email);

        if (userData) {
          // Disparar evento para que la UI se actualice
          window.dispatchEvent(new CustomEvent('user-data-synced', {
            detail: userData
          }));

          console.log('[UserAuth] 🔄 Sincronización completa');
          return true;
        }

        return false;
      } catch (error) {
        console.error('[UserAuth] Error sincronizando:', error);
        return false;
      }
    }

    /**
     * Iniciar sincronización automática
     */
    startAutoSync(email, intervalSeconds = 30) {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
      }

      this.syncInterval = setInterval(async () => {
        await this.syncData(email);
      }, intervalSeconds * 1000);

      console.log(`[UserAuth] ⏰ Auto-sync iniciado (cada ${intervalSeconds}s)`);
    }

    /**
     * Detener sincronización automática
     */
    stopAutoSync() {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
        console.log('[UserAuth] ⏰ Auto-sync detenido');
      }
    }

    /**
     * Logout
     */
    async logout() {
      try {
        if (this.currentUser && this.currentUser.email) {
          // Marcar sesión como offline en Supabase
          await window.SupabaseDB.logout(this.currentUser.email);
        }

        // Limpiar localStorage
        localStorage.removeItem(this.SESSION_KEY);
        localStorage.removeItem(this.USER_DATA_KEY);
        localStorage.removeItem('user_email');

        // Detener sync
        this.stopAutoSync();

        this.currentUser = null;

        console.log('[UserAuth] ✅ Logout exitoso');
        return { ok: true };
      } catch (error) {
        console.error('[UserAuth] Error en logout:', error);
        return { ok: false, error: error.message };
      }
    }

    /**
     * Registrar información del dispositivo
     */
    async logDevice(email) {
      try {
        const deviceInfo = this.getDeviceInfo();

        await this.supabase
          .rpc('log_device_activity', {
            p_email: email,
            p_device_info: deviceInfo
          });

        console.log('[UserAuth] 📱 Dispositivo registrado');
      } catch (error) {
        console.error('[UserAuth] Error registrando dispositivo:', error);
      }
    }

    /**
     * Obtener información del dispositivo
     */
    getDeviceInfo() {
      return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }

    /**
     * Obtener datos del usuario desde localStorage
     */
    getUserData() {
      const data = localStorage.getItem(this.USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    }

    /**
     * Obtener sesión actual
     */
    getSession() {
      const data = localStorage.getItem(this.SESSION_KEY);
      return data ? JSON.parse(data) : null;
    }

    /**
     * Verificar si usuario está logueado
     */
    isLoggedIn() {
      return !!this.getSession();
    }

    /**
     * Iniciar sesión con Google OAuth
     */
    async signInWithGoogle() {
      try {
        console.log('[UserAuth] Iniciando login con Google...');

        // Iniciar OAuth con Supabase
        const { data, error } = await this.supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/login.html`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            }
          }
        });

        if (error) throw error;

        // El flujo redirige automáticamente a Google
        // El callback se maneja en handleGoogleCallback()
        return { ok: true };
      } catch (error) {
        console.error('[UserAuth] Error con Google OAuth:', error);
        return {
          ok: false,
          error: 'No se pudo conectar con Google. Verifica tu configuración.'
        };
      }
    }

    /**
     * Manejar callback de Google (llamar después de redirección)
     */
    async handleGoogleCallback() {
      try {
        console.log('[UserAuth] Procesando callback de Google...');

        // Obtener sesión de Supabase Auth
        const { data: { session }, error } = await this.supabase.auth.getSession();

        if (error) throw error;

        if (!session) {
          console.log('[UserAuth] No hay sesión de Google');
          return { ok: false, error: 'No se pudo obtener sesión de Google' };
        }

        const googleUser = session.user;
        const email = googleUser.email;
        const fullName = googleUser.user_metadata?.full_name || googleUser.user_metadata?.name;
        const firstName = googleUser.user_metadata?.given_name || '';
        const lastName = googleUser.user_metadata?.family_name || '';
        const avatarUrl = googleUser.user_metadata?.avatar_url || googleUser.user_metadata?.picture;
        const googleId = googleUser.id;

        console.log('[UserAuth] Usuario de Google:', { email, fullName, googleId });

        // Verificar si el usuario ya existe en nuestra DB
        const { data: checkData, error: checkError } = await this.supabase
          .rpc('check_google_user', {
            p_google_id: googleId,
            p_email: email
          });

        if (checkError) throw checkError;

        const userCheck = checkData[0];

        if (!userCheck.exists) {
          // Usuario NO existe, debe completar registro
          console.log('[UserAuth] Usuario nuevo, redirigiendo a registro...');

          // Guardar temporalmente en localStorage
          localStorage.setItem('google_temp_email', email);
          localStorage.setItem('google_temp_name', fullName);
          localStorage.setItem('google_temp_avatar', avatarUrl);
          localStorage.setItem('google_temp_google_id', googleId);
          localStorage.setItem('google_temp_first_name', firstName);
          localStorage.setItem('google_temp_last_name', lastName);

          // Redirigir a página de verificación de código
          window.location.href = `/google-verify.html?email=${encodeURIComponent(email)}&name=${encodeURIComponent(fullName)}&avatar=${encodeURIComponent(avatarUrl)}`;
          return { ok: true, needsVerification: true };
        }

        if (!userCheck.code_verified) {
          // Usuario existe pero NO ha verificado el código de 20 dígitos
          console.log('[UserAuth] Usuario sin código verificado, redirigiendo...');

          localStorage.setItem('google_temp_email', email);
          localStorage.setItem('google_temp_name', fullName);
          localStorage.setItem('google_temp_avatar', avatarUrl);

          window.location.href = `/google-verify.html?email=${encodeURIComponent(email)}&name=${encodeURIComponent(fullName)}&avatar=${encodeURIComponent(avatarUrl)}`;
          return { ok: true, needsVerification: true };
        }

        // Usuario ya existe y está verificado, hacer login directo
        console.log('[UserAuth] Usuario existente, iniciando sesión...');
        return await this.loginWithGoogle(email);

      } catch (error) {
        console.error('[UserAuth] Error en callback de Google:', error);
        return { ok: false, error: 'Error procesando login de Google' };
      }
    }

    /**
     * Login directo con Google (usuario ya registrado)
     */
    async loginWithGoogle(email) {
      try {
        console.log('[UserAuth] Login con Google para:', email);

        // Obtener datos del usuario
        const result = await this.loadUserData(email);

        if (!result) {
          return { ok: false, error: 'No se pudieron cargar los datos del usuario' };
        }

        // Crear sesión local
        const session = {
          userId: result.profile.id,
          email: result.profile.email,
          fullName: result.profile.full_name,
          isValidated: result.profile.is_validated,
          authProvider: 'google',
          loginTime: new Date().toISOString(),
          deviceInfo: this.getDeviceInfo()
        };

        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        localStorage.setItem('user_email', email);

        // Crear sesión en Supabase
        await window.SupabaseDB.createSession(
          email,
          session.deviceInfo.ip,
          session.deviceInfo.userAgent
        );

        // Registrar dispositivo
        await this.logDevice(email);

        this.currentUser = session;

        console.log('[UserAuth] ✅ Login con Google exitoso');

        return {
          ok: true,
          user: {
            email: result.profile.email,
            fullName: result.profile.full_name,
            authProvider: 'google'
          }
        };
      } catch (error) {
        console.error('[UserAuth] Error en login con Google:', error);
        return { ok: false, error: 'Error en login con Google' };
      }
    }

    /**
     * Verificar código de 20 dígitos
     */
    async verifyCode20Digits(email, code) {
      try {
        console.log('[UserAuth] Verificando código de 20 dígitos...');

        const { data, error } = await this.supabase
          .rpc('verify_code_20', {
            p_email: email,
            p_code: code
          });

        if (error) throw error;

        const result = data[0];

        if (!result.success) {
          console.warn('[UserAuth] Código incorrecto');
          return { ok: false, error: result.message };
        }

        console.log('[UserAuth] ✅ Código verificado');
        return { ok: true };
      } catch (error) {
        console.error('[UserAuth] Error verificando código:', error);
        return { ok: false, error: 'Error al verificar código' };
      }
    }
  }

  // Exportar instancia global
  window.UserAuth = UserAuth;
  window.userAuth = new UserAuth();

  // Auto-inicializar
  document.addEventListener('DOMContentLoaded', async () => {
    await window.userAuth.init();

    // Verificar si venimos de un callback de Google OAuth
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasAccessToken = hashParams.get('access_token');

    if (hasAccessToken && window.location.pathname === '/login.html') {
      console.log('[UserAuth] Detectado callback de Google, procesando...');
      await window.userAuth.handleGoogleCallback();
    }
  });

  console.log('[UserAuth] 📦 Módulo cargado');

})();
