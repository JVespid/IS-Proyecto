/**
 * Cliente de Supabase para Server Components y API Routes
 * Usado en componentes del servidor y rutas de API
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { log } from '@/constants/config';

const MODULE_NAME = 'Supabase Server';

/**
 * Crea cliente de Supabase para API Route Handlers
 * @returns {SupabaseClient} Cliente de Supabase
 */
export const createServerClient = async () => {
  const cookieStore = await cookies();
  
  const supabase = createRouteHandlerClient(
    { cookies: () => cookieStore },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  );

  log(MODULE_NAME, 'Cliente de Supabase creado para API Route');

  return supabase;
};

/**
 * Crea cliente de Supabase para Server Components
 * @returns {SupabaseClient} Cliente de Supabase
 */
export const createServerComponentSupabaseClient = async () => {
  const cookieStore = await cookies();
  
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  );

  log(MODULE_NAME, 'Cliente de Supabase creado para Server Component');

  return supabase;
};

/**
 * Obtiene el usuario autenticado actual
 * @param {SupabaseClient} supabase - Cliente de Supabase
 * @returns {Promise<User|null>} Usuario autenticado o null
 */
export const getCurrentUser = async (supabase) => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      log(MODULE_NAME, 'Error al obtener usuario', { error: error.message });
      return null;
    }

    log(MODULE_NAME, 'Usuario obtenido', { userId: user?.id });
    return user;
  } catch (error) {
    log(MODULE_NAME, 'Excepción al obtener usuario', { error: error.message });
    return null;
  }
};

/**
 * Obtiene la sesión actual
 * @param {SupabaseClient} supabase - Cliente de Supabase
 * @returns {Promise<Session|null>} Sesión actual o null
 */
export const getSession = async (supabase) => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      log(MODULE_NAME, 'Error al obtener sesión', { error: error.message });
      return null;
    }

    log(MODULE_NAME, 'Sesión obtenida', { hasSession: !!session });
    return session;
  } catch (error) {
    log(MODULE_NAME, 'Excepción al obtener sesión', { error: error.message });
    return null;
  }
};
