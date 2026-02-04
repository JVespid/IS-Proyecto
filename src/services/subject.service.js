/**
 * Servicio de Materias
 * Maneja todas las operaciones relacionadas con la tabla Subject
 */

import { supabase } from '@/lib/supabase/client';
import { subjectSchema } from '@/lib/utils/validators';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'SubjectService';
const TABLE_NAME = 'Subject';
const SCHEMA = 'bdLista';

/**
 * Obtiene todas las materias de un profesor
 * @param {string} professorId - ID del profesor
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<Array>} Lista de materias
 */
export const getByProfessorId = async (professorId, client = supabase) => {
  try {
    log(MODULE_NAME, 'Obteniendo materias del profesor', { professorId });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select('*')
      .eq('professorId', professorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Materias obtenidas', {
      professorId,
      count: data.length,
    });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener materias del profesor', error);
    throw error;
  }
};

/**
 * Obtiene una materia por ID
 * @param {string} id - ID de la materia
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object|null>} Materia encontrada o null
 */
export const getById = async (id, client = supabase) => {
  try {
    log(MODULE_NAME, 'Obteniendo materia por ID', { id });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        log(MODULE_NAME, 'Materia no encontrada', { id });
        return null;
      }
      throw error;
    }

    log(MODULE_NAME, 'Materia obtenida', { subjectId: data.id });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener materia por ID', error);
    throw error;
  }
};

/**
 * Crea una nueva materia
 * @param {object} subjectData - Datos de la materia
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Materia creada
 */
export const create = async (subjectData, client = supabase) => {
  try {
    // Validar datos con Zod
    const validatedData = subjectSchema.parse(subjectData);

    log(MODULE_NAME, 'Creando materia', {
      subject: validatedData.Subject,
      professorId: validatedData.professorId,
    });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .insert([
        {
          professorId: validatedData.professorId,
          Subject: validatedData.Subject,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Materia creada exitosamente', { subjectId: data.id });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al crear materia', error);
    throw error;
  }
};

/**
 * Actualiza una materia
 * @param {string} id - ID de la materia
 * @param {object} subjectData - Datos a actualizar
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Materia actualizada
 */
export const update = async (id, subjectData, client = supabase) => {
  try {
    log(MODULE_NAME, 'Actualizando materia', { id });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .update(subjectData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Materia actualizada exitosamente', { subjectId: data.id });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al actualizar materia', error);
    throw error;
  }
};

/**
 * Elimina una materia
 * @param {string} id - ID de la materia
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<boolean>} True si se eliminó correctamente
 */
export const remove = async (id, client = supabase) => {
  try {
    log(MODULE_NAME, 'Eliminando materia', { id });

    const { error } = await client.schema(SCHEMA).from(TABLE_NAME).delete().eq('id', id);

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Materia eliminada exitosamente', { id });
    return true;
  } catch (error) {
    logError(MODULE_NAME, 'Error al eliminar materia', error);
    throw error;
  }
};
