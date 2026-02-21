/**
 * Endpoint de Validación de QR
 * GET /api/attendance/validate-qr
 * Valida QR y prepara registros de asistencia diarios
 * 
 * ⚠️ RUTA PÚBLICA: Usa admin client porque los estudiantes no están autenticados
 * El Service Role Key bypasea RLS según la documentación oficial de Supabase
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateQRCode } from '@/lib/qr/validator';
import { isSessionActive } from '@/services/session.service';
import { 
  hasDateRecord, 
  createDailyRecords, 
  formatDateForAttendance,
  extractDateOnly
} from '@/services/dailyAttendance.service';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'validate-qr.route';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const expiresAt = parseInt(searchParams.get('expiresAt'), 10);

    log(MODULE_NAME, 'Validando QR', { sessionId, expiresAt });

    // Validar parámetros
    if (!sessionId || !expiresAt) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Parámetros faltantes',
          valid: false
        },
        { status: 400 }
      );
    }

    // Validar que el QR no haya expirado (con margen de +3 segundos)
    const validationResult = validateQRCode(sessionId, expiresAt);

    if (!validationResult.valid) {
      log(MODULE_NAME, 'QR inválido o expirado', { 
        sessionId, 
        reason: validationResult.reason 
      });

      return NextResponse.json(
        { 
          success: false,
          valid: false,
          error: validationResult.message,
          reason: validationResult.reason
        },
        { status: 400 }
      );
    }

    // Crear cliente admin de Supabase (bypasea RLS para estudiantes no autenticados)
    const supabase = createAdminClient();

    // Verificar que la sesión existe y está activa
    const sessionActive = await isSessionActive(sessionId, supabase);

    if (!sessionActive) {
      log(MODULE_NAME, 'Sesión inactiva', { sessionId });

      return NextResponse.json(
        { 
          success: false,
          valid: false,
          error: 'La sesión de pase de lista no está activa',
          reason: 'session_inactive'
        },
        { status: 400 }
      );
    }

    // Verificar que el grupo tenga estudiantes registrados
    const { data: studentsInGroup, error: studentsError, count } = await supabase
      .schema('bdLista')
      .from('TakeAttendance')
      .select('id', { count: 'exact', head: true })
      .eq('currentGroupId', sessionId);

    if (studentsError) {
      logError(MODULE_NAME, 'Error al verificar estudiantes del grupo', studentsError);
    }

    const studentCount = count || 0;
    
    log(MODULE_NAME, 'Estudiantes encontrados en el grupo', { sessionId, studentCount });

    if (studentCount === 0) {
      log(MODULE_NAME, 'Grupo sin estudiantes registrados', { sessionId });

      return NextResponse.json(
        { 
          success: false,
          valid: false,
          error: 'Este grupo no tiene estudiantes registrados',
          reason: 'no_students'
        },
        { status: 400 }
      );
    }

    // Obtener fecha actual
    const currentDateTime = formatDateForAttendance();
    const dateOnly = extractDateOnly(currentDateTime);

    log(MODULE_NAME, 'Verificando registro de fecha', { 
      sessionId, 
      dateOnly, 
      currentDateTime 
    });

    // Verificar si ya existe registro para el día de hoy
    const hasRecord = await hasDateRecord(sessionId, dateOnly, supabase);

    let requiresSetup = false;

    if (!hasRecord) {
      log(MODULE_NAME, 'No existe registro para hoy, creando registros...', { 
        sessionId, 
        dateOnly 
      });

      // Crear registros de asistencia para todos los alumnos del grupo
      const updatedCount = await createDailyRecords(sessionId, currentDateTime, supabase);

      log(MODULE_NAME, 'Registros diarios creados', { 
        sessionId, 
        count: updatedCount 
      });

      requiresSetup = true;
    } else {
      log(MODULE_NAME, 'Ya existe registro para hoy', { sessionId, dateOnly });
    }

    // QR válido, sesión activa, registros preparados
    return NextResponse.json({
      success: true,
      valid: true,
      sessionId,
      requiresSetup,
      studentCount,
      message: requiresSetup 
        ? 'Pase de lista preparado exitosamente' 
        : 'Sesión de pase de lista lista',
      timestamp: Date.now()
    });

  } catch (error) {
    logError(MODULE_NAME, 'Error al validar QR', error);

    return NextResponse.json(
      { 
        success: false,
        valid: false,
        error: 'Error al validar QR',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
