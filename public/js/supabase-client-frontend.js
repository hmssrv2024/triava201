/**
 * REMEEX VISA - Cliente de Supabase para Frontend
 *
 * Este script inicializa el cliente de Supabase para uso directo
 * desde registro.html, admin-registros.html y homevisa.html
 *
 * Uso: Incluir DESPUÉS de cargar el CDN de Supabase
 */

(function() {
  'use strict';

  // Configuración de Supabase (credenciales públicas)
  const SUPABASE_URL = 'https://ewdkxszfkqwlkyszodxu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3ZGt4c3pma3F3bGt5c3pvZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODM5MzMsImV4cCI6MjA3NzM1OTkzM30.alofRt3MEn5UgSsSMk5zWTF0On1PGVepdME-MOoqk-M';

  // Esperar a que se cargue el SDK de Supabase
  function initSupabase() {
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.warn('[Supabase] SDK no cargado, reintentando en 500ms...');
      setTimeout(initSupabase, 500);
      return;
    }

    try {
      // Crear cliente de Supabase
      window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      console.log('[Supabase] ✅ Cliente inicializado correctamente');
      console.log('[Supabase] URL:', SUPABASE_URL);

      // Disparar evento de inicialización
      window.dispatchEvent(new Event('supabase:ready'));

      // Exportar funciones helper
      window.SupabaseDB = {
        client: window.supabaseClient,

        /**
         * Guardar registro de usuario
         */
        async saveRegistration(data) {
          try {
            const { data: result, error } = await window.supabaseClient
              .from('registrations')
              .insert([data])
              .select();

            if (error) {
              console.error('[Supabase] Error guardando registro:', error);
              return { ok: false, error: error.message };
            }

            console.log('[Supabase] ✅ Registro guardado:', result[0].id);
            return { ok: true, data: result[0] };
          } catch (error) {
            console.error('[Supabase] Error en saveRegistration:', error);
            return { ok: false, error: error.message };
          }
        },

        /**
         * Obtener todos los registros
         */
        async getRegistrations(limit = 1000) {
          try {
            const { data, error, count } = await window.supabaseClient
              .from('registrations')
              .select('*', { count: 'exact' })
              .order('created_at', { ascending: false })
              .limit(limit);

            if (error) {
              console.error('[Supabase] Error obteniendo registros:', error);
              return { ok: false, error: error.message };
            }

            console.log('[Supabase] ✅ Registros obtenidos:', data.length);
            return { ok: true, data: data, total: count };
          } catch (error) {
            console.error('[Supabase] Error en getRegistrations:', error);
            return { ok: false, error: error.message };
          }
        },

        /**
         * Obtener saldo de usuario
         */
        async getBalance(email) {
          try {
            let { data, error } = await window.supabaseClient
              .from('user_balances')
              .select('*')
              .eq('user_email', email)
              .single();

            // Si no existe, crear con saldo 0
            if (error && error.code === 'PGRST116') {
              const { data: newBalance, error: createError } = await window.supabaseClient
                .from('user_balances')
                .insert({
                  user_email: email,
                  current_balance: 0.00,
                  available_balance: 0.00,
                  reserved_balance: 0.00,
                  currency: 'USD'
                })
                .select()
                .single();

              if (createError) throw createError;
              data = newBalance;
            } else if (error) {
              throw error;
            }

            return { ok: true, data: data };
          } catch (error) {
            console.error('[Supabase] Error en getBalance:', error);
            return { ok: false, error: error.message };
          }
        },

        /**
         * Obtener transacciones de usuario
         */
        async getTransactions(email, limit = 50) {
          try {
            const { data, error } = await window.supabaseClient
              .from('user_transactions')
              .select('*')
              .eq('user_email', email)
              .order('transaction_date', { ascending: false })
              .limit(limit);

            if (error) throw error;

            return { ok: true, data: data || [] };
          } catch (error) {
            console.error('[Supabase] Error en getTransactions:', error);
            return { ok: false, error: error.message };
          }
        },

        /**
         * Crear/actualizar sesión
         */
        async createSession(email, ipAddress = null, userAgent = null) {
          try {
            // Buscar sesión existente
            const { data: existing } = await window.supabaseClient
              .from('user_sessions')
              .select('*')
              .eq('user_email', email)
              .eq('is_online', true)
              .order('login_time', { ascending: false })
              .limit(1)
              .single();

            let result;

            if (existing) {
              // Actualizar sesión existente
              const { data, error } = await window.supabaseClient
                .from('user_sessions')
                .update({
                  last_activity: new Date().toISOString(),
                  ip_address: ipAddress || existing.ip_address,
                  user_agent: userAgent || existing.user_agent
                })
                .eq('id', existing.id)
                .select()
                .single();

              if (error) throw error;
              result = data;
            } else {
              // Crear nueva sesión
              const token = this.generateSessionToken(email);
              const { data, error } = await window.supabaseClient
                .from('user_sessions')
                .insert({
                  user_email: email,
                  session_token: token,
                  is_online: true,
                  login_time: new Date().toISOString(),
                  last_activity: new Date().toISOString(),
                  ip_address: ipAddress,
                  user_agent: userAgent
                })
                .select()
                .single();

              if (error) throw error;
              result = data;
            }

            console.log('[Supabase] ✅ Sesión actualizada');
            return { ok: true, data: result };
          } catch (error) {
            console.error('[Supabase] Error en createSession:', error);
            return { ok: false, error: error.message };
          }
        },

        /**
         * Cerrar sesión
         */
        async logout(email) {
          try {
            const { error } = await window.supabaseClient
              .from('user_sessions')
              .update({
                is_online: false,
                logout_time: new Date().toISOString()
              })
              .eq('user_email', email)
              .eq('is_online', true);

            if (error) throw error;

            console.log('[Supabase] ✅ Sesión cerrada');
            return { ok: true };
          } catch (error) {
            console.error('[Supabase] Error en logout:', error);
            return { ok: false, error: error.message };
          }
        },

        /**
         * Obtener perfil de usuario
         */
        async getProfile(email) {
          try {
            const { data, error } = await window.supabaseClient
              .from('registrations')
              .select('*')
              .eq('email', email)
              .single();

            if (error) {
              if (error.code === 'PGRST116') {
                return { ok: false, error: 'Usuario no encontrado' };
              }
              throw error;
            }

            return { ok: true, data: data };
          } catch (error) {
            console.error('[Supabase] Error en getProfile:', error);
            return { ok: false, error: error.message };
          }
        },

        /**
         * Helper: Generar token de sesión
         */
        generateSessionToken(email) {
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 15);
          const emailHash = btoa(email).replace(/=/g, '');
          return `${emailHash}_${timestamp}_${random}`;
        },

        /**
         * Helper: Verificar si Supabase está listo
         */
        isReady() {
          return !!window.supabaseClient;
        }
      };

      console.log('[Supabase] ✅ API helper exportada como window.SupabaseDB');

    } catch (error) {
      console.error('[Supabase] Error inicializando:', error);
    }
  }

  // Iniciar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
  } else {
    initSupabase();
  }

})();
