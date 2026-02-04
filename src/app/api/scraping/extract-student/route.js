/**
 * API Route: Extraer Datos de Estudiante (Web Scraping)
 * Extrae información del estudiante desde una URL
 */

import { NextResponse } from 'next/server';
import { extractStudentDataWithRetry } from '@/lib/scraping/scraper';
import { extractStudentSchema } from '@/lib/utils/validators';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'API: Extract Student';

export async function POST(request) {
  try {
    log(MODULE_NAME, 'Recibiendo solicitud de extracción de datos');

    // Parsear body
    const body = await request.json();

    // Validar datos
    const validatedData = extractStudentSchema.parse(body);

    log(MODULE_NAME, 'Extrayendo datos de URL', { url: validatedData.url });

    // Extraer datos con reintentos
    const studentData = await extractStudentDataWithRetry(validatedData.url, 2);

    log(MODULE_NAME, 'Datos extraídos exitosamente', {
      reportCard: studentData.reportCard,
      hasFullName: !!studentData.fullName,
    });

    return NextResponse.json({
      success: true,
      data: {
        reportCard: studentData.reportCard,
        fullName: studentData.fullName,
        scannedUrl: studentData.scannedUrl,
        extractedAt: studentData.extractedAt,
      },
    });
  } catch (error) {
    logError(MODULE_NAME, 'Error al extraer datos', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'URL inválida', details: error.errors },
        { status: 400 }
      );
    }

    // Mensajes de error específicos
    let errorMessage = 'Error al extraer datos del estudiante';
    if (error.message.includes('No se encontró el número de boleta')) {
      errorMessage = error.message;
    } else if (error.message.includes('Timeout')) {
      errorMessage = 'La página tardó demasiado en responder';
    } else if (error.message.includes('URL no válida')) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
