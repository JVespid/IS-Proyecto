/**
 * Servicio de Grupos
 * Maneja todas las operaciones relacionadas con la tabla Group
 */

import { supabase } from '@/lib/supabase/client';
import { groupSchema } from '@/lib/utils/validators';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'GroupService';
const TABLE_NAME = 'Group';
const SCHEMA = 'bdLista';

/**
 * Obtiene todos los grupos
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<Array>} Lista de grupos
 */
export const getAll = async (client = supabase) => {
  try {
    log(MODULE_NAME, 'Obteniendo todos los grupos');

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select('*')
      .order('group', { ascending: true });

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Grupos obtenidos', { count: data.length });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener grupos', error);
    throw error;
  }
};

/**
 * Obtiene un grupo por ID
 * @param {string} id - ID del grupo
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object|null>} Grupo encontrado o null
 */
export const getById = async (id, client = supabase) => {
  try {
    log(MODULE_NAME, 'Obteniendo grupo por ID', { id });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        log(MODULE_NAME, 'Grupo no encontrado', { id });
        return null;
      }
      throw error;
    }

    log(MODULE_NAME, 'Grupo obtenido', { groupId: data.id });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener grupo por ID', error);
    throw error;
  }
};

/**
 * Crea un nuevo grupo
 * @param {string} groupName - Nombre del grupo
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Grupo creado
 */
export const create = async (groupName, client = supabase) => {
  try {
    // Validar datos con Zod
    const validatedData = groupSchema.parse({ group: groupName });

    log(MODULE_NAME, 'Creando grupo', { group: validatedData.group });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .insert([{ group: validatedData.group }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Grupo creado exitosamente', { groupId: data.id });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al crear grupo', error);
    throw error;
  }
};

/**
 * Busca un grupo por nombre
 * @param {string} groupName - Nombre del grupo
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object|null>} Grupo encontrado o null
 */
export const findByName = async (groupName, client = supabase) => {
  try {
    log(MODULE_NAME, 'Buscando grupo por nombre', { group: groupName });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select('*')
      .eq('group', groupName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        log(MODULE_NAME, 'Grupo no encontrado', { group: groupName });
        return null;
      }
      throw error;
    }

    log(MODULE_NAME, 'Grupo encontrado', { groupId: data.id });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al buscar grupo por nombre', error);
    throw error;
  }
};

/**
 * Actualiza un grupo
 * @param {string} id - ID del grupo
 * @param {string} groupName - Nuevo nombre del grupo
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Grupo actualizado
 */
export const update = async (id, groupName, client = supabase) => {
  try {
    log(MODULE_NAME, 'Actualizando grupo', { id, group: groupName });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .update({ group: groupName })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Grupo actualizado exitosamente', { groupId: data.id });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al actualizar grupo', error);
    throw error;
  }
};

/**
 * Elimina un grupo
 * @param {string} id - ID del grupo
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<boolean>} True si se eliminó correctamente
 */
export const remove = async (id, client = supabase) => {
  try {
    log(MODULE_NAME, 'Eliminando grupo', { id });

    const { error } = await client.schema(SCHEMA).from(TABLE_NAME).delete().eq('id', id);

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Grupo eliminado exitosamente', { id });
    return true;
  } catch (error) {
    logError(MODULE_NAME, 'Error al eliminar grupo', error);
    throw error;
  }
};
