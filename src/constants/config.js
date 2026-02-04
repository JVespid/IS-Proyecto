/**
 * Configuración global de la aplicación
 * Centraliza todas las constantes y configuraciones
 */

// Duración de sesiones
export const SESSION_DURATION = parseInt(
  process.env.NEXT_PUBLIC_SESSION_DURATION || "90",
  10,
);

// Estados de sesión (CurrentGroup.status)
// IMPORTANTE: Estos valores deben coincidir exactamente con el enum statusCurrentGroup en la BD
export const SESSION_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

// Configuración de la aplicación
export const APP_CONFIG = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  SESSION_DURATION_MS: SESSION_DURATION * 60 * 1000, // Convertir a milisegundos
};

// Configuración de QR
export const QR_CONFIG = {
  SIZE: 256, // Tamaño del QR en píxeles
  ERROR_CORRECTION: "M", // Nivel de corrección de errores: L, M, Q, H
  MARGIN: 4, // Margen alrededor del QR
};

// Configuración de Web Scraping
export const SCRAPING_CONFIG = {
  TIMEOUT: 10000, // 10 segundos
  USER_AGENT:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  BOLETA_CLASS: "boleta", // Clase del div que contiene la boleta
};

// Rutas de la aplicación
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  GENERAR_QR: "/generar-qr",
  ASISTENCIA: (sessionId) => `/asistencia/${sessionId}`,
  API: {
    AUTH_CALLBACK: "/api/auth/callback",
    CREATE_SESSION: "/api/attendance/create-session",
    VALIDATE_SESSION: "/api/attendance/validate-session",
    RECORD_ATTENDANCE: "/api/attendance/record",
    EXTRACT_STUDENT: "/api/scraping/extract-student",
  },
};

// Configuración de logging
export const LOGGING = {
  ENABLED: process.env.NODE_ENV === "development",
  PREFIX: "[Sistema Pase Lista]",
};

/**
 * Función de logging estructurado
 * @param {string} module - Módulo que genera el log
 * @param {string} message - Mensaje del log
 * @param {object} data - Datos adicionales
 */
export const log = (module, message, data = {}) => {
  if (LOGGING.ENABLED) {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV != "development") return;

    console.log(
      `${LOGGING.PREFIX} [${timestamp}] [${module}] ${message}`,
      Object.keys(data).length > 0 ? data : "",
    );
  }
};

/**
 * Función de logging de errores
 * @param {string} module - Módulo que genera el error
 * @param {string} message - Mensaje del error
 * @param {Error} error - Objeto de error
 */
export const logError = (module, message, error) => {
  const timestamp = new Date().toISOString();
  console.error(
    `${LOGGING.PREFIX} [${timestamp}] [${module}] ERROR: ${message}`,
    {
      error: error.message,
      stack: error.stack,
    },
  );
};
