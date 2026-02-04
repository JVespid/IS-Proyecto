/**
 * API Route: Validar Sesión de Pase de Lista
 * Valida que una sesión sea válida y esté activa
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getById, isSessionActive } from '@/services/session.service';
import { validateQRCode } from '@/lib/qr/validator';
import { SESSION_DURATION, log, logError } from '@/constants/config';

const MODULE_NAME = 'API: Validate Session';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const signature = searchParams.get('signature');
    const timestamp = searchParams.get('timestamp');
    const duration = parseInt(searchParams.get('duration') || SESSION_DURATION, 10);

    log(MODULE_NAME, 'Validando sesión', { sessionId, duration });

    if (!sessionId || !signature || !timestamp) {
      return NextResponse.json(
        { error: 'Parámetros faltantes' },
        { status: 400 }
      );
    }

    // Validar QR (firma y expiración)
    const qrValidation = validateQRCode(
      sessionId,
      signature,
      parseInt(timestamp, 10),
      duration
    );

    if (!qrValidation.valid) {
      log(MODULE_NAME, 'QR inválido', {
        sessionId,
        reason: qrValidation.reason,
      });
      return NextResponse.json(
        {
          valid: false,
          error: qrValidation.message,
          reason: qrValidation.reason,
        },
        { status: 400 }
      );
    }

    // Verificar que la sesión existe y está activa en la BD
    const supabase = await createServerClient();
    const sessionActive = await isSessionActive(sessionId, supabase);

    if (!sessionActive) {
      log(MODULE_NAME, 'Sesión no activa en BD', { sessionId });
      return NextResponse.json(
        {
          valid: false,
          error: 'La sesión no está activa',
          reason: 'session_not_active',
        },
        { status: 400 }
      );
    }

    // Obtener datos completos de la sesión
    const session = await getById(sessionId, supabase);

    log(MODULE_NAME, 'Sesión validada exitosamente', { sessionId });

    return NextResponse.json({
      valid: true,
      session: {
        id: session.id,
        subject: session.Subject?.Subject || 'N/A',
        group: session.Group?.group || 'N/A',
        status: session.status,
        createdAt: session.created_at,
      },
      timeRemaining: qrValidation.timeRemaining,
    });
  } catch (error) {
    logError(MODULE_NAME, 'Error al validar sesión', error);
    return NextResponse.json(
      { error: 'Error al validar sesión' },
      { status: 500 }
    );
  }
}
