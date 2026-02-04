/**
 * Servicio de Estudiantes
 * Maneja todas las operaciones relacionadas con la tabla Students
 */

import { supabase } from '@/lib/supabase/client';
import { studentSchema } from '@/lib/utils/validators';
import { generateUUID } from '@/lib/utils/crypto';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'StudentService';
const TABLE_NAME = 'Students';
const SCHEMA = 'bdLista';

/**
 * Busca un estudiante por número de boleta
 * @param {string} reportCard - Número de boleta
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object|null>} Estudiante encontrado o null
 */
export const findByReportCard = async (reportCard, client = supabase) => {
  try {
    log(MODULE_NAME, 'Buscando estudiante por boleta', { reportCard });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select('*')
      .eq('reportCard', reportCard)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        log(MODULE_NAME, 'Estudiante no encontrado', { reportCard });
        return null;
      }
      throw error;
    }

    log(MODULE_NAME, 'Estudiante encontrado', { studentId: data.id });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al buscar estudiante por boleta', error);
    throw error;
  }
};

/**
 * Obtiene un estudiante por ID
 * @param {string} id - ID del estudiante
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object|null>} Estudiante encontrado o null
 */
export const getById = async (id, client = supabase) => {
  try {
    log(MODULE_NAME, 'Obteniendo estudiante por ID', { id });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        log(MODULE_NAME, 'Estudiante no encontrado', { id });
        return null;
      }
      throw error;
    }

    log(MODULE_NAME, 'Estudiante obtenido', { studentId: data.id });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener estudiante por ID', error);
    throw error;
  }
};

/**
 * Crea un nuevo estudiante
 * @param {string} fullName - Nombre completo
 * @param {string} reportCard - Número de boleta
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Estudiante creado
 */
export const createStudent = async (fullName, reportCard, client = supabase) => {
  try {
    // Generar UUID manualmente ya que no se auto-genera en el schema
    const studentId = generateUUID();

    // Validar datos con Zod
    const validatedData = studentSchema.parse({
      id: studentId,
      fullName,
      reportCard,
    });

    log(MODULE_NAME, 'Creando estudiante', {
      reportCard: validatedData.reportCard,
      studentId,
    });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .insert([
        {
          id: studentId,
          fullName: validatedData.fullName,
          reportCard: validatedData.reportCard,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Estudiante creado exitosamente', { studentId: data.id });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al crear estudiante', error);
    throw error;
  }
};

/**
 * Obtiene o crea un estudiante por número de boleta
 * @param {string} fullName - Nombre completo
 * @param {string} reportCard - Número de boleta
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Estudiante encontrado o creado
 */
export const getOrCreateStudent = async (fullName, reportCard, client = supabase) => {
  try {
    log(MODULE_NAME, 'Obteniendo o creando estudiante', { reportCard });

    // Intentar buscar primero
    const existing = await findByReportCard(reportCard, client);

    if (existing) {
      log(MODULE_NAME, 'Estudiante ya existe', { studentId: existing.id });
      return existing;
    }

    // Si no existe, crear
    return await createStudent(fullName, reportCard, client);
  } catch (error) {
    logError(MODULE_NAME, 'Error al obtener o crear estudiante', error);
    throw error;
  }
};

/**
 * Actualiza un estudiante
 * @param {string} id - ID del estudiante
 * @param {object} studentData - Datos a actualizar
 * @param {SupabaseClient} client - Cliente de Supabase (opcional)
 * @returns {Promise<object>} Estudiante actualizado
 */
export const updateStudent = async (id, studentData, client = supabase) => {
  try {
    log(MODULE_NAME, 'Actualizando estudiante', { id });

    const { data, error } = await client
      .schema(SCHEMA)
      .from(TABLE_NAME)
      .update(studentData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    log(MODULE_NAME, 'Estudiante actualizado exitosamente', { studentId: data.id });
    return data;
  } catch (error) {
    logError(MODULE_NAME, 'Error al actualizar estudiante', error);
    throw error;
  }
};
