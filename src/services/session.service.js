/**
 * Servicio de Sesiones de Pase de Lista
 * Maneja todas las operaciones relacionadas con la tabla CurrentGroup
 */

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
  client
) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
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
export const getById = async (sessionId, client) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
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
export const updateStatus = async (sessionId, status, client) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
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
export const closeSession = async (sessionId, client) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
  return await updateStatus(sessionId, SESSION_STATUS.INACTIVE, client);
};

/**
 * Obtiene todas las sesiones activas de un profesor
 * @param {string} professorId - ID del profesor
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<Array>} Lista de sesiones activas
 */
export const getActiveSessionsByProfessor = async (professorId, client) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
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
export const getSessionHistory = async (subjectId, groupId, client) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
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
export const isSessionActive = async (sessionId, client) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
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

/**
 * Obtiene TODAS las sesiones de un profesor (ACTIVE e INACTIVE)
 * Incluye Subject, Group y conteo de estudiantes
 * @param {string} professorId - ID del profesor
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<Array>} Lista de sesiones con datos relacionados
 */
export const getAllByProfessor = async (professorId, client) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
  try {
    log(MODULE_NAME, 'Obteniendo todas las sesiones del profesor', { professorId });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select(`
        *,
        Subject (*),
        Group (*),
        TakeAttendance (count)
      `)
      .eq('professorId', professorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Agregar conteo de estudiantes a cada sesión
    const sessionsWithCount = data.map((session) => ({
      ...session,
      studentCount: session.TakeAttendance?.[0]?.count || 0,
    }));

    log(MODULE_NAME, 'Sesiones obtenidas exitosamente', {
      count: sessionsWithCount.length,
    });

    return sessionsWithCount;
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener sesiones del profesor', error);
    throw error;
  }
};

/**
 * Actualiza los datos de una sesión
 * NO permite cambiar professorId ni status (usar updateStatus para eso)
 * @param {string} sessionId - ID de la sesión
 * @param {object} sessionData - Datos a actualizar
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Sesión actualizada
 */
export const update = async (sessionId, sessionData, client) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
  try {
    log(MODULE_NAME, 'Actualizando sesión', { sessionId, sessionData });

    // Validar datos (permitir campos parciales)
    const allowedFields = [
      'subjectId',
      'groupId',
      'curriculum',
      'schoolPeriod',
      'degree',
      'school',
      'institute',
    ];

    const updateData = {};
    Object.keys(sessionData).forEach((key) => {
      if (allowedFields.includes(key) && sessionData[key] !== undefined) {
        updateData[key] = sessionData[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new Error('No hay datos válidos para actualizar');
    }

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', sessionId)
      .select(`
        *,
        Subject (*),
        Group (*)
      `)
      .single();

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Sesión actualizada exitosamente', { sessionId });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al actualizar sesión', error);
    throw error;
  }
};

/**
 * Elimina una sesión si no tiene estudiantes inscritos
 * Si tiene TakeAttendance asociados, retorna error
 * @param {string} sessionId - ID de la sesión
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Resultado de la operación
 */
export const removeIfEmpty = async (sessionId, client) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
  try {
    log(MODULE_NAME, 'Intentando eliminar sesión', { sessionId });

    // Verificar si tiene asistencias registradas
    const { data: attendances, error: checkError } = await client
      .schema(SCHEMA)
      .from('TakeAttendance')
      .select('id')
      .eq('currentGroupId', sessionId)
      .limit(1);

    if (checkError) {
      throw checkError;
    }

    if (attendances && attendances.length > 0) {
      const errorMsg = 'No se puede eliminar grupo con estudiantes inscritos';
      log(MODULE_NAME, errorMsg, { sessionId });
      throw new Error(errorMsg);
    }

    // Si está vacío, eliminar
    const { error: deleteError } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      throw deleteError;
    }

    log(MODULE_NAME, 'Sesión eliminada exitosamente', { sessionId });
    return { success: true, deleted: true };
  } catch (error) {
    logError(MODULE_NAME, 'Error al eliminar sesión', error);
    throw error;
  }
};
