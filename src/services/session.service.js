/**
 * Servicio de Sesiones de Pase de Lista
 * Maneja todas las operaciones relacionadas con la tabla CurrentGroup
 */

import { supabase } from '@/lib/supabase/client';
import { sessionSchema } from '@/lib/utils/validators';
import { SESSION_STATUS, log, logError } from '@/constants/config';

const MODULE_NAME = 'SessionService';
const TABLE_NAME = 'CurrentGroup';
const SCHEMA = 'bdLista';

/**
 * Crea una nueva sesión de pase de lista
 * @param {string} subjectId - ID de la materia
 * @param {string} groupId - ID del grupo
 * @param {string} professorId - ID del profesor
 * @param {object} sessionData - Datos opcionales de contexto académico (curriculum, schoolPeriod, degree, school, institute)
 * @param {string} status - Estado de la sesión (default: 'ACTIVE')
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Sesión creada
 */
export const createSession = async (
  subjectId,
  groupId,
  professorId,
  sessionData = {},
  status = SESSION_STATUS.ACTIVE,
  client = supabase
) => {
  try {
    // Validar datos con Zod
    const validatedData = sessionSchema.parse({
      subjectId,
      groupId,
      professorId,
      status,
      curriculum: sessionData.curriculum,
      schoolPeriod: sessionData.schoolPeriod,
      degree: sessionData.degree,
      school: sessionData.school,
      institute: sessionData.institute,
    });

    log(MODULE_NAME, 'Creando sesión de pase de lista', {
      subjectId: validatedData.subjectId,
      groupId: validatedData.groupId,
      professorId: validatedData.professorId,
      status: validatedData.status,
      schoolPeriod: validatedData.schoolPeriod,
    });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .insert([
        {
          subjectId: validatedData.subjectId,
          groupId: validatedData.groupId,
          professorId: validatedData.professorId,
          status: validatedData.status,
          curriculum: validatedData.curriculum,
          schoolPeriod: validatedData.schoolPeriod,
          degree: validatedData.degree,
          school: validatedData.school,
          institute: validatedData.institute,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Sesión creada exitosamente', { sessionId: data.id });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al crear sesión', error);
    throw error;
  }
};

/**
 * Obtiene una sesión por ID
 * @param {string} sessionId - ID de la sesión
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object|null>} Sesión encontrada o null
 */
export const getById = async (sessionId, client = supabase) => {
  try {
    log(MODULE_NAME, 'Obteniendo sesión por ID', { sessionId });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select(`
        *,
        Subject (*),
        Group (*)
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        log(MODULE_NAME, 'Sesión no encontrada', { sessionId });
        return null;
      }
      throw error;
    }

    log(MODULE_NAME, 'Sesión obtenida', {
      sessionId: data.id,
      status: data.status,
    });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener sesión por ID', error);
    throw error;
  }
};

/**
 * Actualiza el estado de una sesión
 * @param {string} sessionId - ID de la sesión
 * @param {string} status - Nuevo estado
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Sesión actualizada
 */
export const updateStatus = async (sessionId, status, client = supabase) => {
  try {
    log(MODULE_NAME, 'Actualizando estado de sesión', { sessionId, status });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .update({ status })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Estado de sesión actualizado', {
      sessionId: data.id,
      newStatus: data.status,
    });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al actualizar estado de sesión', error);
    throw error;
  }
};

/**
 * Cierra una sesión (cambia status a 'INACTIVE')
 * @param {string} sessionId - ID de la sesión
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Sesión cerrada
 */
export const closeSession = async (sessionId, client = supabase) => {
  return await updateStatus(sessionId, SESSION_STATUS.INACTIVE, client);
};

/**
 * Obtiene todas las sesiones activas de un profesor
 * @param {string} professorId - ID del profesor
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<Array>} Lista de sesiones activas
 */
export const getActiveSessionsByProfessor = async (professorId, client = supabase) => {
  try {
    log(MODULE_NAME, 'Obteniendo sesiones activas del profesor', { professorId });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select(`
        *,
        Subject (*),
        Group (*)
      `)
      .eq('professorId', professorId)
      .eq('status', SESSION_STATUS.ACTIVE)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Sesiones activas obtenidas', {
      professorId,
      count: data.length,
    });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener sesiones activas del profesor', error);
    throw error;
  }
};

/**
 * Obtiene el historial de sesiones de una materia y grupo
 * @param {string} subjectId - ID de la materia
 * @param {string} groupId - ID del grupo
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<Array>} Lista de sesiones
 */
export const getSessionHistory = async (subjectId, groupId, client = supabase) => {
  try {
    log(MODULE_NAME, 'Obteniendo historial de sesiones', { subjectId, groupId });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select(`
        *,
        Subject (*),
        Group (*)
      `)
      .eq('subjectId', subjectId)
      .eq('groupId', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Historial de sesiones obtenido', {
      subjectId,
      groupId,
      count: data.length,
    });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener historial de sesiones', error);
    throw error;
  }
};

/**
 * Verifica si una sesión está activa
 * @param {string} sessionId - ID de la sesión
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<boolean>} True si la sesión está activa
 */
export const isSessionActive = async (sessionId, client = supabase) => {
  try {
    const session = await getById(sessionId, client);
    
    if (!session) {
      log(MODULE_NAME, 'Sesión no existe', { sessionId });
      return false;
    }

    const isActive = session.status === SESSION_STATUS.ACTIVE;
    log(MODULE_NAME, 'Verificación de sesión activa', { sessionId, isActive });
    
    return isActive;
  } catch (error) {
    logError(MODULE_NAME, 'Error al verificar si sesión está activa', error);
    return false;
  }
};
