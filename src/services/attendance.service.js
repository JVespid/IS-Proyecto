/**
 * Servicio de Asistencias
 * Maneja todas las operaciones relacionadas con la tabla TakeAttendance
 */

import { supabase } from '@/lib/supabase/client';
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
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Asistencia registrada
 */
export const recordAttendance = async (
  studentId,
  currentGroupId,
  studentData,
  client = supabase
) => {
  try {
    // Crear objeto de datos completo para el JSON
    const attendanceData = {
      reportCard: studentData.reportCard,
      fullName: studentData.fullName,
      scannedUrl: studentData.scannedUrl || null,
      scannedAt: new Date().toISOString(),
      additionalData: studentData.additionalData || {},
    };

    // Validar datos con Zod
    const validatedData = attendanceSchema.parse({
      studentId,
      currentGroupId,
      takeAttendanceStudentData: attendanceData,
    });

    log(MODULE_NAME, 'Registrando asistencia', {
      studentId,
      currentGroupId,
      reportCard: studentData.reportCard,
    });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .insert([
        {
          studentId: validatedData.studentId,
          currentGroupId: validatedData.currentGroupId,
          takeAttendanceStudentData: validatedData.takeAttendanceStudentData,
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
export const checkDuplicate = async (studentId, currentGroupId, client = supabase) => {
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
export const getBySession = async (currentGroupId, client = supabase) => {
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
export const getByStudent = async (studentId, client = supabase) => {
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
export const getSessionStats = async (currentGroupId, client = supabase) => {
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
export const remove = async (attendanceId, client = supabase) => {
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
