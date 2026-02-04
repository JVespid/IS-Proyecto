/**
 * Middleware de Next.js
 * Protege rutas que requieren autenticación
 * Solo /login y /register son accesibles sin sesión
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
  const publicRoutes = ['/login', '/register'];
  
  // Verificar si la ruta actual es pública
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname === route
  );

  // Si NO es ruta pública y NO hay sesión, redirigir a login
  if (!isPublicRoute && !session) {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Si el usuario está autenticado y trata de ir a login/register, redirigir a /
  if (session && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    const redirectUrl = new URL('/', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
