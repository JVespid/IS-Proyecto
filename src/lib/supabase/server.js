/**
 * Cliente de Supabase para Server Components y API Routes
 * Usado en componentes del servidor y rutas de API
 * Migrado a @supabase/ssr (API moderna)
 */

import { createServerClient as createSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { log } from '@/constants/config';

const MODULE_NAME = 'Supabase Server';

/**
 * Crea cliente de Supabase para Server Components y API Routes
 * Utiliza @supabase/ssr para manejo moderno de cookies
 * @returns {Promise<SupabaseClient>} Cliente de Supabase
 */
export const createServerClient = async () => {
  const cookieStore = await cookies();

  const supabase = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // Ignorar error en middleware/route handlers
            // Las cookies se establecerán en la respuesta
          }
        },
        remove(name, options) {
          try {
            cookieStore.set(name, '', {
              ...options,
              maxAge: 0,
            });
          } catch (error) {
            // Ignorar error en middleware/route handlers
          }
        },
      },
    }
  );

  log(MODULE_NAME, 'Cliente de Supabase creado con @supabase/ssr');

  return supabase;
};

/**
 * Crea cliente de Supabase para Server Components
 * @deprecated Use createServerClient instead (funcionalidad unificada)
 * @returns {Promise<SupabaseClient>} Cliente de Supabase
 */
export const createServerComponentSupabaseClient = async () => {
  log(MODULE_NAME, 'DEPRECATED: Use createServerClient() en su lugar');
  return createServerClient();
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
