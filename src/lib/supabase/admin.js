/**
 * Cliente de Supabase con Service Role Key (ADMIN)
 * ⚠️ BYPASS RLS - Solo usar en API routes server-side
 * ⚠️ NUNCA exponer al cliente o usar en componentes
 */

import { createClient } from '@supabase/supabase-js';
import { log } from '@/constants/config';

const MODULE_NAME = 'Supabase Admin';

/**
 * Crea cliente admin que bypasea Row Level Security (RLS)
 * 
 * IMPORTANTE: Solo usar para:
 * - Validación de QR en API routes
 * - Operaciones que requieren acceso sin restricciones de usuario
 * - Tareas administrativas server-side
 * 
 * NUNCA usar en:
 * - Client Components
 * - Código que se ejecuta en el navegador
 * - Exponer datos sensibles directamente al cliente
 * 
 * @returns {SupabaseClient} Cliente admin con bypass RLS
 */
export const createAdminClient = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no está configurada. ' +
      'Esta variable es requerida para operaciones admin.'
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY, // Service role key bypasea RLS
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  log(MODULE_NAME, 'Cliente admin creado (BYPASS RLS) - Solo server-side');

  return supabaseAdmin;
};
