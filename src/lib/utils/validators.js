/**
 * Schemas de validación con Zod
 * Define los esquemas de validación para todas las entidades del sistema
 */

import { z } from 'zod';

// ============================================
// SCHEMAS DE BASE DE DATOS
// ============================================

/**
 * Schema para Professors
 */
export const professorSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  lastName: z.string().max(100).nullable().optional(),
  email: z.string().email('Email inválido'),
  created_at: z.string().datetime().optional(),
});

/**
 * Schema para Students
 */
export const studentSchema = z.object({
  id: z.string().uuid().optional(),
  fullName: z.string().min(1, 'El nombre completo es requerido').max(200),
  reportCard: z.string().min(1, 'La boleta es requerida').max(50),
  created_at: z.string().datetime().optional(),
});

/**
 * Schema para Group
 */
export const groupSchema = z.object({
  id: z.string().uuid().optional(),
  group: z.string().min(1, 'El nombre del grupo es requerido').max(50),
  created_at: z.string().datetime().optional(),
});

/**
 * Schema para Subject
 * NOTA: Subject ahora es una tabla genérica sin vínculo a profesor específico
 * La relación profesor-materia se establece en CurrentGroup
 */
export const subjectSchema = z.object({
  id: z.string().uuid().optional(),
  Subject: z.string().min(1, 'El nombre de la materia es requerido').max(100),
  created_at: z.string().datetime().optional(),
});

/**
 * Schema para CurrentGroup (sesión de pase de lista)
 * IMPORTANTE: Los valores del enum deben coincidir con statusCurrentGroup en la BD
 */
export const sessionSchema = z.object({
  id: z.string().uuid().optional(),
  subjectId: z.string().uuid('ID de materia inválido'),
  groupId: z.string().uuid('ID de grupo inválido'),
  professorId: z.string().uuid('ID de profesor inválido'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  
  // Campos adicionales de contexto académico (opcionales)
  curriculum: z.string().optional(),
  schoolPeriod: z.string()
    .regex(/^\d{5}$/, 'El periodo escolar debe tener formato AAAAS (5 dígitos: año + semestre)')
    .optional(),
  degree: z.string().optional(),
  school: z.string().default('ESCUELA SUPERIOR DE INGENIERIA MECANICA Y ELECTRICA UNIDAD CULHUACAN'),
  institute: z.string().default('INSTITUTO POLITECNICO NACIONAL'),
  
  created_at: z.string().datetime().optional(),
});

/**
 * Schema para TakeAttendance
 */
export const attendanceSchema = z.object({
  id: z.string().uuid().optional(),
  studentId: z.string().uuid('ID de estudiante inválido'),
  currentGroupId: z.string().uuid('ID de sesión inválido'),
  takeAttendanceStudentData: z.object({
    reportCard: z.string(),
    fullName: z.string(),
    scannedUrl: z.string().url().optional(),
    scannedAt: z.string().datetime(),
    additionalData: z.record(z.any()).optional(),
  }),
  
  // Número de lista del estudiante (ingresado manualmente)
  numberOfList: z.string()
    .regex(/^\d+$/, 'El número de lista debe ser numérico (1, 2, 3, ...)')
    .optional(),
  
  created_at: z.string().datetime().optional(),
});

// ============================================
// SCHEMAS DE API
// ============================================

/**
 * Schema para crear sesión de pase de lista
 */
export const createSessionSchema = z.object({
  subjectId: z.string().uuid('ID de materia inválido'),
  groupId: z.string().uuid('ID de grupo inválido'),
  professorId: z.string().uuid('ID de profesor inválido'),
  duration: z.number().min(1).max(180).default(90), // 1-180 minutos
  
  // Campos opcionales de contexto académico (CurrentGroup)
  curriculum: z.string().optional(),
  schoolPeriod: z.string()
    .regex(/^\d{5}$/, 'El periodo escolar debe tener formato AAAAS (5 dígitos: año + semestre)')
    .optional(),
  degree: z.string().optional(),
  school: z.string().optional(),
  institute: z.string().optional(),
});

/**
 * Schema para validar sesión
 */
export const validateSessionSchema = z.object({
  sessionId: z.string().uuid('ID de sesión inválido'),
  signature: z.string().min(1, 'Firma requerida'),
  timestamp: z.number().int().positive('Timestamp inválido'),
});

/**
 * Schema para registrar asistencia
 */
export const recordAttendanceSchema = z.object({
  sessionId: z.string().uuid('ID de sesión inválido'),
  studentData: z.object({
    reportCard: z.string().min(1, 'Boleta requerida'),
    fullName: z.string().min(1, 'Nombre completo requerido'),
    scannedUrl: z.string().url('URL inválida').optional(),
    additionalData: z.record(z.any()).optional(),
  }),
  
  // Número de lista del estudiante (ingresado manualmente)
  numberOfList: z.string()
    .regex(/^\d+$/, 'El número de lista debe ser numérico (1, 2, 3, ...)')
    .optional(),
});

/**
 * Schema para extraer datos de estudiante (web scraping)
 */
export const extractStudentSchema = z.object({
  url: z.string().url('URL inválida'),
});

/**
 * Schema para autenticación
 */
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

/**
 * Schema para registro
 */
export const registerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  lastName: z.string().min(1, 'El apellido es requerido').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// ============================================
// VALIDADORES PERSONALIZADOS
// ============================================

/**
 * Valida si una cadena es un UUID válido
 */
export const isValidUUID = (value) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Valida si una URL es segura (https o http localhost)
 */
export const isSecureURL = (url) => {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' ||
      (parsed.protocol === 'http:' && parsed.hostname === 'localhost')
    );
  } catch {
    return false;
  }
};

/**
 * Sanitiza una cadena para prevenir XSS
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // Elimina < y >
    .trim();
};

/**
 * Valida y sanitiza número de boleta
 */
export const validateReportCard = (reportCard) => {
  const sanitized = sanitizeString(reportCard);
  if (sanitized.length === 0) {
    throw new Error('Número de boleta inválido');
  }
  return sanitized;
};
