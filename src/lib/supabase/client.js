/**
 * Cliente de Supabase para Client Components
 * Usado en componentes que corren en el navegador
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { log } from '@/constants/config';

const MODULE_NAME = 'Supabase Client';

/**
 * Crea y retorna el cliente de Supabase para client components
 * @returns {SupabaseClient} Cliente de Supabase
 */
export const createClient = () => {
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  log(MODULE_NAME, 'Cliente de Supabase creado para browser');

  return supabase;
};

/**
 * Cliente de Supabase singleton para client components
 */
export const supabase = createClient();
