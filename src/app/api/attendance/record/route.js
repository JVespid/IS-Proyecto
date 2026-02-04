/**
 * API Route: Registrar Asistencia
 * Registra la asistencia de un estudiante en una sesión
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { recordAttendance, checkDuplicate } from '@/services/attendance.service';
import { getOrCreateStudent } from '@/services/student.service';
import { isSessionActive } from '@/services/session.service';
import { recordAttendanceSchema } from '@/lib/utils/validators';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'API: Record Attendance';

export async function POST(request) {
  try {
    log(MODULE_NAME, 'Recibiendo solicitud de registro de asistencia');

    // Parsear body
    const body = await request.json();

    // Validar datos
    const validatedData = recordAttendanceSchema.parse(body);

    log(MODULE_NAME, 'Datos validados', {
      sessionId: validatedData.sessionId,
      reportCard: validatedData.studentData.reportCard,
      numberOfList: validatedData.numberOfList,
    });

    // Verificar que la sesión esté activa
    const supabase = await createServerClient();
    const sessionActive = await isSessionActive(validatedData.sessionId, supabase);

    if (!sessionActive) {
      log(MODULE_NAME, 'Sesión no activa', { sessionId: validatedData.sessionId });
      return NextResponse.json(
        { error: 'La sesión no está activa' },
        { status: 400 }
      );
    }

    // Obtener o crear estudiante
    const student = await getOrCreateStudent(
      validatedData.studentData.fullName,
      validatedData.studentData.reportCard,
      supabase
    );

    log(MODULE_NAME, 'Estudiante procesado', {
      studentId: student.id,
      reportCard: student.reportCard,
    });

    // Verificar si ya pasó lista
    const isDuplicate = await checkDuplicate(
      student.id,
      validatedData.sessionId,
      supabase
    );

    if (isDuplicate) {
      log(MODULE_NAME, 'Asistencia duplicada detectada', {
        studentId: student.id,
        sessionId: validatedData.sessionId,
      });
      return NextResponse.json(
        {
          success: false,
          duplicate: true,
          message: 'Ya pasaste lista en esta sesión',
          student: {
            fullName: student.fullName,
            reportCard: student.reportCard,
          },
        },
        { status: 200 }
      );
    }

    // Registrar asistencia
    const attendance = await recordAttendance(
      student.id,
      validatedData.sessionId,
      {
        ...validatedData.studentData,
        scannedAt: new Date().toISOString(),
      },
      validatedData.numberOfList, // Número de lista
      supabase
    );

    log(MODULE_NAME, 'Asistencia registrada exitosamente', {
      attendanceId: attendance.id,
      studentId: student.id,
    });

    return NextResponse.json({
      success: true,
      duplicate: false,
      message: 'Asistencia registrada exitosamente',
      attendance: {
        id: attendance.id,
        studentId: student.id,
        fullName: student.fullName,
        reportCard: student.reportCard,
        numberOfList: attendance.numberOfList,
        recordedAt: attendance.created_at,
      },
    });
  } catch (error) {
    logError(MODULE_NAME, 'Error al registrar asistencia', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al registrar asistencia' },
      { status: 500 }
    );
  }
}
