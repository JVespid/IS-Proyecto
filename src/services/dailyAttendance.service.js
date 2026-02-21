/**
 * Servicio de Asistencia Diaria
 * Gestiona los registros de asistencia por fecha en takeAttendanceStudentData
 */

import { log, logError } from '@/constants/config';

const MODULE_NAME = 'dailyAttendance.service';
const SCHEMA = 'bdLista';

/**
 * Formatea la fecha actual en formato AAMMDD-HH:MM
 * @returns {string} Fecha formateada (ej: "260220-14:30")
 */
export const formatDateForAttendance = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2); // Últimos 2 dígitos del año
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  
  return `${year}${month}${day}-${hours}:${minutes}`;
};

/**
 * Extrae solo la parte de la fecha (AAMMDD) sin la hora
 * @param {string} dateString - Fecha en formato AAMMDD-HH:MM
 * @returns {string} Solo la fecha (ej: "260220")
 */
export const extractDateOnly = (dateString) => {
  return dateString.split('-')[0];
};

/**
 * Verifica si existe un registro de asistencia para la fecha actual
 * @param {string} currentGroupId - ID del grupo/sesión
 * @param {string} dateOnly - Fecha en formato AAMMDD (ej: "260220")
 * @param {SupabaseClient} supabase - Cliente de Supabase
 * @returns {Promise<boolean>} True si existe registro para ese día
 */
export async function hasDateRecord(currentGroupId, dateOnly, supabase) {
  log(MODULE_NAME, 'Verificando registro de fecha', { currentGroupId, dateOnly });

  try {
    // Obtener todos los registros del grupo
    const { data: attendances, error } = await supabase
      .schema(SCHEMA)
      .from('TakeAttendance')
      .select('takeAttendanceStudentData')
      .eq('currentGroupId', currentGroupId);

    if (error) throw error;

    if (!attendances || attendances.length === 0) {
      log(MODULE_NAME, 'No hay registros de asistencia para este grupo');
      return false;
    }

    // Verificar si algún registro tiene la fecha de hoy
    for (const attendance of attendances) {
      const studentData = attendance.takeAttendanceStudentData;
      
      // El campo puede ser un array de registros por fecha
      if (Array.isArray(studentData)) {
        const hasDate = studentData.some(record => {
          if (record.date) {
            const recordDate = extractDateOnly(record.date);
            return recordDate === dateOnly;
          }
          return false;
        });

        if (hasDate) {
          log(MODULE_NAME, 'Encontrado registro para la fecha', { dateOnly });
          return true;
        }
      }
    }

    log(MODULE_NAME, 'No se encontró registro para la fecha', { dateOnly });
    return false;
  } catch (error) {
    logError(MODULE_NAME, 'Error al verificar registro de fecha', error);
    throw error;
  }
}

/**
 * Crea registros de asistencia diarios para todos los alumnos de un grupo
 * @param {string} currentGroupId - ID del grupo/sesión
 * @param {string} dateTime - Fecha y hora en formato AAMMDD-HH:MM
 * @param {SupabaseClient} supabase - Cliente de Supabase
 * @returns {Promise<number>} Número de registros actualizados
 */
export async function createDailyRecords(currentGroupId, dateTime, supabase) {
  log(MODULE_NAME, 'Creando registros diarios', { currentGroupId, dateTime });

  try {
    // Obtener todos los registros del grupo
    const { data: attendances, error: fetchError } = await supabase
      .schema(SCHEMA)
      .from('TakeAttendance')
      .select('id, studentId, takeAttendanceStudentData')
      .eq('currentGroupId', currentGroupId);

    if (fetchError) throw fetchError;

    if (!attendances || attendances.length === 0) {
      log(MODULE_NAME, 'No hay alumnos registrados en este grupo', { currentGroupId });
      return 0;
    }

    // Crear nuevo objeto de asistencia para el día (ausente por defecto)
    const newRecord = {
      attended: false,
      absent: true,
      delayed: false,
      date: dateTime
    };

    let updatedCount = 0;

    // Actualizar cada registro agregando el nuevo objeto al array
    for (const attendance of attendances) {
      let studentData = attendance.takeAttendanceStudentData;

      // Si no es un array, convertirlo a array
      if (!Array.isArray(studentData)) {
        studentData = [];
      }

      // Agregar el nuevo registro
      studentData.push(newRecord);

      // Actualizar en la base de datos
      const { error: updateError } = await supabase
        .schema(SCHEMA)
        .from('TakeAttendance')
        .update({ takeAttendanceStudentData: studentData })
        .eq('id', attendance.id);

      if (updateError) {
        logError(MODULE_NAME, 'Error al actualizar registro', { 
          attendanceId: attendance.id, 
          error: updateError 
        });
      } else {
        updatedCount++;
      }
    }

    log(MODULE_NAME, 'Registros diarios creados exitosamente', { 
      total: attendances.length, 
      updated: updatedCount 
    });

    return updatedCount;
  } catch (error) {
    logError(MODULE_NAME, 'Error al crear registros diarios', error);
    throw error;
  }
}

/**
 * Marca asistencia para un alumno específico en una fecha
 * @param {string} studentId - ID del estudiante
 * @param {string} currentGroupId - ID del grupo/sesión
 * @param {string} dateTime - Fecha y hora en formato AAMMDD-HH:MM
 * @param {object} status - Estado de asistencia { attended, absent, delayed }
 * @param {SupabaseClient} supabase - Cliente de Supabase
 * @returns {Promise<object>} Registro actualizado
 */
export async function markAttendance(studentId, currentGroupId, dateTime, status, supabase) {
  log(MODULE_NAME, 'Marcando asistencia', { 
    studentId, 
    currentGroupId, 
    dateTime, 
    status 
  });

  try {
    const dateOnly = extractDateOnly(dateTime);

    log(MODULE_NAME, 'Buscando registros de asistencia', { 
      studentId, 
      currentGroupId 
    });

    // Obtener TODOS los registros del alumno (puede haber duplicados)
    const { data: attendanceRecords, error: fetchError } = await supabase
      .schema(SCHEMA)
      .from('TakeAttendance')
      .select('id, takeAttendanceStudentData')
      .eq('studentId', studentId)
      .eq('currentGroupId', currentGroupId);

    if (fetchError) {
      logError(MODULE_NAME, 'Error al obtener registros', fetchError);
      throw fetchError;
    }

    log(MODULE_NAME, 'Registros encontrados', { 
      cantidad: attendanceRecords?.length || 0 
    });

    // Detectar duplicados
    if (attendanceRecords && attendanceRecords.length > 1) {
      logError(MODULE_NAME, 'ADVERTENCIA: Duplicados en TakeAttendance al actualizar', {
        studentId,
        currentGroupId,
        cantidad: attendanceRecords.length,
        ids: attendanceRecords.map(r => r.id)
      });
    }

    if (!attendanceRecords || attendanceRecords.length === 0) {
      throw new Error('No se encontró registro de asistencia para este alumno');
    }

    // Usar el primer registro (en caso de duplicados)
    const attendance = attendanceRecords[0];

    log(MODULE_NAME, 'Usando registro', { id: attendance.id });

    let studentData = attendance.takeAttendanceStudentData;

    // Si no es un array, convertirlo a array
    if (!Array.isArray(studentData)) {
      studentData = [];
    }

    log(MODULE_NAME, 'Datos actuales del estudiante', { 
      registrosExistentes: studentData.length 
    });

    // Buscar el registro de la fecha actual
    const recordIndex = studentData.findIndex(record => {
      if (record.date) {
        const recordDate = extractDateOnly(record.date);
        return recordDate === dateOnly;
      }
      return false;
    });

    if (recordIndex !== -1) {
      log(MODULE_NAME, 'Actualizando registro existente de la fecha', { 
        fecha: dateOnly 
      });
      // Actualizar el registro existente
      studentData[recordIndex] = {
        ...studentData[recordIndex],
        ...status,
        date: dateTime // Actualizar con la hora exacta del escaneo
      };
    } else {
      log(MODULE_NAME, 'Creando nuevo registro para la fecha', { 
        fecha: dateOnly 
      });
      // Crear nuevo registro si no existe
      studentData.push({
        ...status,
        date: dateTime
      });
    }

    log(MODULE_NAME, 'Actualizando registro en BD', { 
      id: attendance.id,
      nuevaCantidadRegistros: studentData.length 
    });

    // Actualizar en la base de datos - usar ID específico para afectar solo 1 registro
    const { data: updated, error: updateError } = await supabase
      .schema(SCHEMA)
      .from('TakeAttendance')
      .update({ takeAttendanceStudentData: studentData })
      .eq('id', attendance.id)
      .select()
      .single();

    if (updateError) {
      logError(MODULE_NAME, 'Error en UPDATE', updateError);
      throw updateError;
    }

    log(MODULE_NAME, 'Asistencia marcada exitosamente', { 
      studentId, 
      dateTime,
      status
    });

    return updated;
  } catch (error) {
    logError(MODULE_NAME, 'Error al marcar asistencia', error);
    throw error;
  }
}

/**
 * Obtiene el registro de asistencia de un alumno en una fecha específica
 * @param {string} studentId - ID del estudiante
 * @param {string} currentGroupId - ID del grupo/sesión
 * @param {string} dateOnly - Fecha en formato AAMMDD
 * @param {SupabaseClient} supabase - Cliente de Supabase
 * @returns {Promise<object|null>} Registro de asistencia o null
 */
export async function getAttendanceByDate(studentId, currentGroupId, dateOnly, supabase) {
  log(MODULE_NAME, 'Obteniendo asistencia por fecha', { 
    studentId, 
    currentGroupId, 
    dateOnly 
  });

  try {
    const { data: attendance, error } = await supabase
      .schema(SCHEMA)
      .from('TakeAttendance')
      .select('takeAttendanceStudentData')
      .eq('studentId', studentId)
      .eq('currentGroupId', currentGroupId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No encontrado
        return null;
      }
      throw error;
    }

    if (!attendance || !Array.isArray(attendance.takeAttendanceStudentData)) {
      return null;
    }

    // Buscar el registro de la fecha
    const record = attendance.takeAttendanceStudentData.find(r => {
      if (r.date) {
        const recordDate = extractDateOnly(r.date);
        return recordDate === dateOnly;
      }
      return false;
    });

    return record || null;
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener asistencia por fecha', error);
    throw error;
  }
}
