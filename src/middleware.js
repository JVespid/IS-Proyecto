/**
 * Middleware de Next.js
 * Protege rutas que requieren autenticación
 * 
 * Rutas PÚBLICAS (sin autenticación):
 * - /login, /register, /logout
 * - /asistencia/* (para escaneo de QR por estudiantes)
 * - /api/* (excluidas del middleware, ver config.matcher)
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Rutas PÚBLICAS (no requieren autenticación)
  const publicRoutes = ['/', '/login', '/register', '/logout'];
  
  // Rutas de autenticación (login/register) - usuarios autenticados no pueden acceder
  const authRoutes = ['/login', '/register'];
  
  // Verificar si la ruta actual es pública
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname === route
  );
  
  // Verificar si la ruta es de asistencia (accesible sin autenticación para escaneo de QR)
  const isAttendanceRoute = request.nextUrl.pathname.startsWith('/asistencia');
  
  // Verificar si es ruta de auth (login/register)
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname === route
  );

  // Si el usuario está autenticado y trata de ir a login/register, redirigir a /
  // (logout NO se redirige porque necesita cerrar sesión)
  if (session && isAuthRoute) {
    const redirectUrl = new URL('/', request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    
    // Transferir cookies de sesión a la respuesta de redirección
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    
    return redirectResponse;
  }

  // Si NO es ruta pública, NO es ruta de asistencia y NO hay sesión, redirigir a login
  if (!isPublicRoute && !isAttendanceRoute && !session) {
    const redirectUrl = new URL('/login', request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    
    // Transferir cookies a la respuesta de redirección
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
