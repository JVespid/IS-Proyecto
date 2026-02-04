/**
 * Helpers para el middleware de autenticación
 * Funciones auxiliares para validar autenticación en middleware
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { log } from '@/constants/config';

const MODULE_NAME = 'Supabase Middleware';

/**
 * Crea un cliente de Supabase para el middleware
 * @param {NextRequest} request - Request de Next.js
 * @param {NextResponse} response - Response de Next.js
 * @returns {SupabaseClient} Cliente de Supabase
 */
export const createMiddlewareClient = (request, response) => {
  const supabase = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  log(MODULE_NAME, 'Cliente de Supabase creado para middleware');

  return supabase;
};

/**
 * Verifica si el usuario está autenticado
 * @param {SupabaseClient} supabase - Cliente de Supabase
 * @returns {Promise<boolean>} True si está autenticado
 */
export const isAuthenticated = async (supabase) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const authenticated = !!session;
    log(MODULE_NAME, 'Verificación de autenticación', { authenticated });

    return authenticated;
  } catch (error) {
    log(MODULE_NAME, 'Error al verificar autenticación', {
      error: error.message,
    });
    return false;
  }
};
