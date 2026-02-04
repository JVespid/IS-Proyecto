/**
 * Servicio de Profesores
 * Maneja todas las operaciones relacionadas con la tabla Professors
 */

import { supabase } from '@/lib/supabase/client';
import { professorSchema } from '@/lib/utils/validators';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'ProfessorService';
const TABLE_NAME = 'Professors';
const SCHEMA = 'bdLista';

/**
 * Busca un profesor por email
 * @param {string} email - Email del profesor
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object|null>} Profesor encontrado o null
 */
export const findByEmail = async (email, client = supabase) => {
  try {
    log(MODULE_NAME, 'Buscando profesor por email', { email });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró el profesor
        log(MODULE_NAME, 'Profesor no encontrado', { email });
        return null;
      }
      throw error;
    }

    log(MODULE_NAME, 'Profesor encontrado', { professorId: data.id });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al buscar profesor por email', error);
    throw error;
  }
};

/**
 * Obtiene un profesor por ID
 * @param {string} id - ID del profesor
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object|null>} Profesor encontrado o null
 */
export const getById = async (id, client = supabase) => {
  try {
    log(MODULE_NAME, 'Obteniendo profesor por ID', { id });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        log(MODULE_NAME, 'Profesor no encontrado', { id });
        return null;
      }
      throw error;
    }

    log(MODULE_NAME, 'Profesor obtenido', { professorId: data.id });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener profesor por ID', error);
    throw error;
  }
};

/**
 * Crea un nuevo profesor
 * @param {object} professorData - Datos del profesor
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Profesor creado
 */
export const createProfessor = async (professorData, client = supabase) => {
  try {
    // Validar datos con Zod
    const validatedData = professorSchema.parse(professorData);

    log(MODULE_NAME, 'Creando profesor', { email: validatedData.email });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .insert([
        {
          name: validatedData.name,
          lastName: validatedData.lastName,
          email: validatedData.email,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Profesor creado exitosamente', { professorId: data.id });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al crear profesor', error);
    throw error;
  }
};

/**
 * Actualiza un profesor
 * @param {string} id - ID del profesor
 * @param {object} professorData - Datos a actualizar
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Profesor actualizado
 */
export const updateProfessor = async (id, professorData, client = supabase) => {
  try {
    log(MODULE_NAME, 'Actualizando profesor', { id });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .update(professorData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Profesor actualizado exitosamente', { professorId: data.id });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al actualizar profesor', error);
    throw error;
  }
};

/**
 * Obtiene o crea un profesor por email
 * @param {object} professorData - Datos del profesor
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Profesor encontrado o creado
 */
export const getOrCreateProfessor = async (professorData, client = supabase) => {
  try {
    log(MODULE_NAME, 'Obteniendo o creando profesor', { email: professorData.email });

    // Intentar buscar primero
    const existing = await findByEmail(professorData.email, client);
    
    if (existing) {
      log(MODULE_NAME, 'Profesor ya existe', { professorId: existing.id });
      return existing;
    }

    // Si no existe, crear
    return await createProfessor(professorData, client);
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener o crear profesor', error);
    throw error;
  }
};
