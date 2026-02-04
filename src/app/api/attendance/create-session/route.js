/**
 * API Route: Crear Sesión de Pase de Lista
 * Crea una nueva sesión (CurrentGroup) para tomar asistencia
 */

import { NextResponse } from 'next/server';
import { createServerClient, getCurrentUser } from '@/lib/supabase/server';
import { createSession } from '@/services/session.service';
import { getById as getSubject } from '@/services/subject.service';
import { createSessionSchema } from '@/lib/utils/validators';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'API: Create Session';

export async function POST(request) {
  try {
    log(MODULE_NAME, 'Recibiendo solicitud de creación de sesión');

    // Obtener usuario autenticado
    const supabase = await createServerClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      log(MODULE_NAME, 'Usuario no autenticado');
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener datos del profesor autenticado
    const { data: professorData, error: profError } = await supabase
      .schema('bdLista')
      .from('Professors')
      .select('id')
      .eq('email', user.email)
      .single();

    if (profError || !professorData) {
      log(MODULE_NAME, 'Profesor no encontrado en BD');
      return NextResponse.json(
        { error: 'Profesor no encontrado' },
        { status: 404 }
      );
    }

    const professorId = professorData.id;
    log(MODULE_NAME, 'Profesor identificado', { professorId });

    // Parsear body
    const body = await request.json();

    // Validar datos
    const validatedData = createSessionSchema.parse({
      ...body,
      professorId, // Agregar professorId del usuario autenticado
    });

    log(MODULE_NAME, 'Datos validados', {
      subjectId: validatedData.subjectId,
      groupId: validatedData.groupId,
      professorId: validatedData.professorId,
      duration: validatedData.duration,
      schoolPeriod: validatedData.schoolPeriod,
    });

    // Verificar que la materia existe (validación simple)
    const subject = await getSubject(validatedData.subjectId, supabase);
    
    if (!subject) {
      log(MODULE_NAME, 'Materia no encontrada');
      return NextResponse.json(
        { error: 'Materia no encontrada' },
        { status: 404 }
      );
    }

    // Crear objeto con datos de contexto académico
    const sessionData = {
      curriculum: validatedData.curriculum,
      schoolPeriod: validatedData.schoolPeriod,
      degree: validatedData.degree,
      school: validatedData.school,
      institute: validatedData.institute,
    };

    // Crear sesión
    const session = await createSession(
      validatedData.subjectId,
      validatedData.groupId,
      validatedData.professorId,
      sessionData,
      'ACTIVE',
      supabase
    );

    log(MODULE_NAME, 'Sesión creada exitosamente', { sessionId: session.id });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        subjectId: session.subjectId,
        groupId: session.groupId,
        professorId: session.professorId,
        status: session.status,
        curriculum: session.curriculum,
        schoolPeriod: session.schoolPeriod,
        degree: session.degree,
        school: session.school,
        institute: session.institute,
        createdAt: session.created_at,
        duration: validatedData.duration,
      },
    });
  } catch (error) {
    logError(MODULE_NAME, 'Error al crear sesión', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear sesión' },
      { status: 500 }
    );
  }
}
