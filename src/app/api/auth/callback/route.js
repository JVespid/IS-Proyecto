/**
 * API Route: Auth Callback
 * Maneja el callback de autenticación de Supabase
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { log } from '@/constants/config';

const MODULE_NAME = 'API: Auth Callback';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
      log(MODULE_NAME, 'Procesando código de autenticación');

      const supabase = await createServerClient();
      await supabase.auth.exchangeCodeForSession(code);
    }

    // Redirigir al dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    log(MODULE_NAME, 'Error en callback de auth', { error: error.message });
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
