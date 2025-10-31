import { supabase, isSupabaseConfigured } from './supabase-client.js';
import { readRegistrations as readLocal, saveRegistration as saveLocal } from './registro-storage.js';

/**
 * Lee todos los registros desde Supabase
 * @returns {Promise<Array>} Array de registros
 */
export async function readRegistrations() {
  // Si Supabase no está configurado, usar almacenamiento local
  if (!isSupabaseConfigured()) {
    console.warn('[registro-storage-supabase] Supabase no configurado, usando almacenamiento local');
    return readLocal();
  }

  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[registro-storage-supabase] Error al leer registros de Supabase:', error);
      // Fallback a almacenamiento local
      return readLocal();
    }

    return data || [];
  } catch (error) {
    console.error('[registro-storage-supabase] Error inesperado:', error);
    // Fallback a almacenamiento local
    return readLocal();
  }
}

/**
 * Guarda un registro en Supabase
 * @param {Object} record - Registro a guardar
 * @returns {Promise<Object>} Registro guardado
 */
export async function saveRegistration(record) {
  if (!record || typeof record !== 'object') {
    throw new Error('Invalid registration record.');
  }

  // Si Supabase no está configurado, usar almacenamiento local
  if (!isSupabaseConfigured()) {
    console.warn('[registro-storage-supabase] Supabase no configurado, usando almacenamiento local');
    return saveLocal(record);
  }

  try {
    // Preparar el registro para Supabase
    const supabaseRecord = {
      id: record.id,
      email: record.email,
      first_name: record.first_name,
      last_name: record.last_name,
      full_name: record.full_name,
      preferred_name: record.preferred_name,
      nickname: record.nickname,
      country: record.country,
      state: record.state,
      gender: record.gender,
      birth_day: record.birth_day,
      birth_month: record.birth_month,
      birth_year: record.birth_year,
      document_type: record.document_type,
      document_number: record.document_number,
      phone_country_code: record.phone_country_code,
      phone_prefix: record.phone_prefix,
      phone_number: record.phone_number,
      full_phone_number: record.full_phone_number,
      created_at: record.created_at,
      updated_at: record.updated_at,
      presence: record.presence,
      forwarded_at: record.forwarded_at,
      external_reference: record.external_reference
    };

    // Intentar insertar el registro
    const { data, error } = await supabase
      .from('registrations')
      .upsert(supabaseRecord, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('[registro-storage-supabase] Error al guardar en Supabase:', error);

      // Si es error de duplicado, intentar actualizar
      if (error.code === '23505') {
        const { data: updateData, error: updateError } = await supabase
          .from('registrations')
          .update(supabaseRecord)
          .eq('email', record.email)
          .select()
          .single();

        if (updateError) {
          console.error('[registro-storage-supabase] Error al actualizar:', updateError);
          // Fallback a almacenamiento local
          return saveLocal(record);
        }

        console.log('[registro-storage-supabase] Registro actualizado en Supabase');

        // También guardar localmente como backup
        try {
          await saveLocal(record);
        } catch (localError) {
          console.warn('[registro-storage-supabase] No se pudo guardar backup local:', localError);
        }

        return updateData;
      }

      // Para otros errores, usar almacenamiento local
      return saveLocal(record);
    }

    console.log('[registro-storage-supabase] Registro guardado en Supabase exitosamente');

    // También guardar localmente como backup
    try {
      await saveLocal(record);
    } catch (localError) {
      console.warn('[registro-storage-supabase] No se pudo guardar backup local:', localError);
    }

    return data;
  } catch (error) {
    console.error('[registro-storage-supabase] Error inesperado al guardar:', error);
    // Fallback a almacenamiento local
    return saveLocal(record);
  }
}
