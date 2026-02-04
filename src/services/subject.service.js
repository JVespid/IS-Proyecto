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
 * Obtiene todas las materias usadas por un profesor en sus sesiones
 * NOTA: Ahora las materias son genéricas. Este método obtiene las materias
 * que el profesor ha usado en sus sesiones (CurrentGroup).
 * @param {string} professorId - ID del profesor
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<Array>} Lista de materias únicas usadas por el profesor
 */
export const getByProfessorId = async (professorId, client = supabase) => {
  try {
    log(MODULE_NAME, 'Obteniendo materias usadas por profesor', { professorId });

    // Nueva lógica: obtener materias desde CurrentGroup donde professorId coincide
    const { data, error } = await client
      .schema(SCHEMA)
      .from('CurrentGroup')
      .select('subjectId, Subject (*)')
      .eq('professorId', professorId);

    if (error) {
      throw error;
    }

    // Extraer y deduplicar materias
    const uniqueSubjects = [];
    const seenIds = new Set();
    
    data.forEach(item => {
      if (item.Subject && !seenIds.has(item.Subject.id)) {
        seenIds.add(item.Subject.id);
        uniqueSubjects.push(item.Subject);
      }
    });

    log(MODULE_NAME, 'Materias obtenidas', {
      professorId,
      count: uniqueSubjects.length,
    });
    
    return uniqueSubjects;
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
 * Obtiene todas las materias disponibles
 * NOTA: Las materias ahora son genéricas y pueden ser usadas por cualquier profesor
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<Array>} Lista de todas las materias
 */
export const getAll = async (client = supabase) => {
  try {
    log(MODULE_NAME, 'Obteniendo todas las materias');

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select('*')
      .order('Subject', { ascending: true });

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Materias obtenidas', { count: data.length });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener todas las materias', error);
    throw error;
  }
};

/**
 * Crea una nueva materia
 * NOTA: Las materias ahora son genéricas (sin vínculo a profesor específico)
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
    });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .insert([
        {
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
