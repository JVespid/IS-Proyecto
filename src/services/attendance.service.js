/**
 * Servicio de Asistencias
 * Maneja todas las operaciones relacionadas con la tabla TakeAttendance
 */

import { attendanceSchema } from '@/lib/utils/validators';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'AttendanceService';
const TABLE_NAME = 'TakeAttendance';
const SCHEMA = 'bdLista';

/**
 * Registra una asistencia
 * @param {string} studentId - ID del estudiante
 * @param {string} currentGroupId - ID de la sesión (CurrentGroup)
 * @param {object} studentData - Datos del estudiante extraídos
 * @param {string} numberOfList - Número de lista del estudiante (opcional)
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @param {Array} initialAttendanceData - Datos iniciales de asistencia (opcional, para sincronizar con otros estudiantes)
 * @returns {Promise<object>} Asistencia registrada
 */
export const recordAttendance = async (
  studentId,
  currentGroupId,
  studentData,
  numberOfList = null,
  client,
  initialAttendanceData = []
) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
  try {
    // takeAttendanceStudentData normalmente inicia como array vacío
    // Los datos se agregarán cuando el estudiante escanee el QR
    // PERO si se proporciona initialAttendanceData, se usa ese (para sincronizar alumnos nuevos con registros existentes)

    // Validar datos con Zod
    const validatedData = attendanceSchema.parse({
      studentId,
      currentGroupId,
      takeAttendanceStudentData: initialAttendanceData, // Array proporcionado o vacío
      numberOfList,
    });

    log(MODULE_NAME, 'Registrando asistencia', {
      studentId,
      currentGroupId,
      reportCard: studentData.reportCard,
      numberOfList,
    });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .insert([
        {
          studentId: validatedData.studentId,
          currentGroupId: validatedData.currentGroupId,
          takeAttendanceStudentData: validatedData.takeAttendanceStudentData,
          numberOfList: validatedData.numberOfList,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Asistencia registrada exitosamente', {
      attendanceId: data.id,
      studentId: data.studentId,
    });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al registrar asistencia', error);
    throw error;
  }
};

/**
 * Verifica si un estudiante ya pasó lista en una sesión
 * @param {string} studentId - ID del estudiante
 * @param {string} currentGroupId - ID de la sesión
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<boolean>} True si ya pasó lista
 */
export const checkDuplicate = async (studentId, currentGroupId, client) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
  try {
    log(MODULE_NAME, 'Verificando duplicado de asistencia', {
      studentId,
      currentGroupId,
    });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select('id')
      .eq('studentId', studentId)
      .eq('currentGroupId', currentGroupId)
      .limit(1);

    if (error) {
      throw error;
    }

    const isDuplicate = data && data.length > 0;
    log(MODULE_NAME, 'Verificación de duplicado', {
      studentId,
      currentGroupId,
      isDuplicate,
    });

    return isDuplicate;
  } catch (error) {
    logError(MODULE_NAME, 'Error al verificar duplicado', error);
    throw error;
  }
};

/**
 * Obtiene todas las asistencias de una sesión
 * @param {string} currentGroupId - ID de la sesión
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<Array>} Lista de asistencias
 */
export const getBySession = async (currentGroupId, client) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
  try {
    log(MODULE_NAME, 'Obteniendo asistencias de sesión', { currentGroupId });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select(`
        *,
        Students (*)
      `)
      .eq('currentGroupId', currentGroupId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Asistencias obtenidas', {
      currentGroupId,
      count: data.length,
    });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener asistencias de sesión', error);
    throw error;
  }
};

/**
 * Obtiene el historial de asistencias de un estudiante
 * @param {string} studentId - ID del estudiante
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<Array>} Lista de asistencias
 */
export const getByStudent = async (studentId, client) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
  try {
    log(MODULE_NAME, 'Obteniendo historial de asistencias del estudiante', {
      studentId,
    });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select(`
        *,
        CurrentGroup (
          *,
          Subject (*),
          Group (*)
        )
      `)
      .eq('studentId', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Historial de asistencias obtenido', {
      studentId,
      count: data.length,
    });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener historial de asistencias', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de asistencia por sesión
 * @param {string} currentGroupId - ID de la sesión
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Estadísticas de asistencia
 */
export const getSessionStats = async (currentGroupId, client) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
  try {
    log(MODULE_NAME, 'Obteniendo estadísticas de sesión', { currentGroupId });

    const attendances = await getBySession(currentGroupId, client);

    const stats = {
      totalAttendances: attendances.length,
      uniqueStudents: new Set(attendances.map((a) => a.studentId)).size,
      duplicates: attendances.length - new Set(attendances.map((a) => a.studentId)).size,
      firstAttendance: attendances[attendances.length - 1]?.created_at || null,
      lastAttendance: attendances[0]?.created_at || null,
    };

    log(MODULE_NAME, 'Estadísticas calculadas', { currentGroupId, stats });
    return stats;
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener estadísticas de sesión', error);
    throw error;
  }
};

/**
 * Elimina una asistencia
 * @param {string} attendanceId - ID de la asistencia
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<boolean>} True si se eliminó correctamente
 */
export const remove = async (attendanceId, client) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
  try {
    log(MODULE_NAME, 'Eliminando asistencia', { attendanceId });

    const { error } = await client.schema(SCHEMA).from(TABLE_NAME).delete().eq('id', attendanceId);

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Asistencia eliminada exitosamente', { attendanceId });
    return true;
  } catch (error) {
    logError(MODULE_NAME, 'Error al eliminar asistencia', error);
    throw error;
  }
};

/**
 * Actualiza el número de lista de un estudiante en TakeAttendance
 * @param {string} attendanceId - ID del registro de asistencia
 * @param {string|number} numberOfList - Nuevo número de lista
 * @param {SupabaseClient} client - Cliente de Supabase
 * @returns {Promise<object>} Registro actualizado
 */
export const updateNumberOfList = async (attendanceId, numberOfList, client) => {
  if (!client) {
    throw new Error('Supabase client is required');
  }
  try {
    log(MODULE_NAME, 'Actualizando número de lista', { attendanceId, numberOfList });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .update({ numberOfList: numberOfList ? String(numberOfList) : null })
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Número de lista actualizado exitosamente', { attendanceId, numberOfList });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al actualizar número de lista', error);
    throw error;
  }
};
