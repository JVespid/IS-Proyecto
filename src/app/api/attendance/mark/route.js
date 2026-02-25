/**
 * Endpoint de Marcado de Asistencia
 * POST /api/attendance/mark
 * Marca asistencia del estudiante al escanear credencial o ingresar boleta manualmente
 * 
 * ⚠️ RUTA PÚBLICA: Usa admin client porque los estudiantes no están autenticados
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSessionActive } from '@/services/session.service';
import { findByReportCard } from '@/services/student.service';
import { markAttendance, formatDateForAttendance } from '@/services/dailyAttendance.service';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'mark-attendance.route';
const SCHEMA = 'bdLista';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId, reportCard, method } = body;

    log(MODULE_NAME, 'Marcando asistencia', { sessionId, reportCard, method });

    // Validar parámetros
    if (!sessionId || !reportCard) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Parámetros faltantes: sessionId y reportCard son requeridos'
        },
        { status: 400 }
      );
    }

    if (method && !['scan', 'manual'].includes(method)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Método inválido. Use "scan" o "manual"'
        },
        { status: 400 }
      );
    }

    // Crear cliente admin de Supabase (bypasea RLS para estudiantes no autenticados)
    const supabase = createAdminClient();

    // Verificar que la sesión existe y está activa
    const sessionActive = await isSessionActive(sessionId, supabase);

    if (!sessionActive) {
      log(MODULE_NAME, 'Sesión inactiva o expirada', { sessionId });

      return NextResponse.json(
        { 
          success: false,
          error: 'La sesión ha expirado o no existe',
          reason: 'SESION_EXPIRADA'
        },
        { status: 400 }
      );
    }

    // Buscar estudiante por número de boleta
    const student = await findByReportCard(reportCard, supabase);

    if (!student) {
      log(MODULE_NAME, 'Estudiante no encontrado', { reportCard });

      return NextResponse.json(
        { 
          success: false,
          error: `No se encontró estudiante con boleta: ${reportCard}`,
          reason: 'ESTUDIANTE_NO_ENCONTRADO'
        },
        { status: 404 }
      );
    }

    // Obtener el currentGroupId de la sesión
    const { data: session, error: sessionError } = await supabase
      .schema(SCHEMA)
      .from('CurrentGroup')
      .select('id, groupId, created_at')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      logError(MODULE_NAME, 'Error al obtener sesión', sessionError);
      throw sessionError;
    }

    // Verificar si el estudiante ya está registrado en esta sesión
    // Nota: Obtenemos todos los registros para detectar duplicados*
    const { data: attendanceRecords, error: checkError } = await supabase
      .schema(SCHEMA)
      .from('TakeAttendance')
      .select('id, takeAttendanceStudentData')
      .eq('studentId', student.id)
      .eq('currentGroupId', sessionId);

    if (checkError) {
      logError(MODULE_NAME, 'Error al verificar asistencia existente', checkError);
      throw checkError;
    }

    // Detectar y registrar duplicados (no debería pasar, pero manejamos el caso)
    if (attendanceRecords && attendanceRecords.length > 1) {
      logError(MODULE_NAME, 'ADVERTENCIA: Duplicados detectados en TakeAttendance', {
        studentId: student.id,
        sessionId,
        cantidad: attendanceRecords.length,
        ids: attendanceRecords.map(r => r.id)
      });
    }

    // Si no existe ningún registro, el estudiante no pertenece al grupo
    if (!attendanceRecords || attendanceRecords.length === 0) {
      log(MODULE_NAME, 'Estudiante no está registrado en esta sesión/grupo', { 
        studentId: student.id, 
        sessionId 
      });

      return NextResponse.json(
        { 
          success: false,
          error: 'Este estudiante no pertenece a este grupo',
          reason: 'ESTUDIANTE_NO_EN_GRUPO'
        },
        { status: 403 }
      );
    }

    // Usar el primer registro (en caso de duplicados, todos tienen los mismos datos)
    const existingAttendance = attendanceRecords[0];

    // Verificar si ya marcó asistencia hoy
    const attendanceData = existingAttendance.takeAttendanceStudentData;
    if (attendanceData?.attended === true) {
      log(MODULE_NAME, 'Estudiante ya marcó asistencia hoy', { 
        studentId: student.id,
        reportCard,
        sessionId
      });

      return NextResponse.json(
        { 
          success: false,
          error: 'Ya registraste tu asistencia el día de hoy',
          reason: 'ASISTENCIA_DUPLICADA',
          data: {
            student: {
              id: student.id,
              name: student.name,
              reportCard: student.reportCard
            },
            previousAttendance: attendanceData
          }
        },
        { status: 400 }
      );
    }

    // Formatear fecha actual
    const currentDateTime = formatDateForAttendance();

    // Marcar asistencia (attended: true, absent: false, delayed: false)
    const updatedRecord = await markAttendance(
      student.id,
      sessionId,
      currentDateTime,
      {
        attended: true,
        absent: false,
        delayed: false
      },
      supabase
    );

    log(MODULE_NAME, 'Asistencia marcada exitosamente', { 
      studentId: student.id,
      reportCard,
      method: method || 'scan',
      dateTime: currentDateTime
    });

    return NextResponse.json({
      success: true,
      message: 'Asistencia registrada exitosamente',
      data: {
        student: {
          id: student.id,
          name: student.name,
          reportCard: student.reportCard
        },
        sessionId,
        dateTime: currentDateTime,
        method: method || 'scan'
      }
    });

  } catch (error) {
    logError(MODULE_NAME, 'Error al marcar asistencia', error);

    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno al marcar asistencia',
        details: error.message
      },
      { status: 500 }
    );
  }
}
