/**
 * Validador de QR Codes
 * Valida códigos QR de forma simplificada (sin firmas HMAC)
 */

import { log, logError } from '@/constants/config';

const MODULE_NAME = 'QR Validator';

// Margen de error en milisegundos (3 segundos)
const VALIDATION_MARGIN = 3000;

/**
 * Decodifica los datos de un QR code (simplificado)
 * @param {string} qrString - String completo del QR (URL)
 * @returns {object|null} Datos decodificados o null si inválido
 */
export const decodeQRData = (qrString) => {
  try {
    log(MODULE_NAME, 'Decodificando datos de QR', { qrString });

    // Parsear la URL
    const url = new URL(qrString);
    
    // Extraer parámetros de query
    const sessionId = url.searchParams.get('sessionId');
    const expiresAt = parseInt(url.searchParams.get('expiresAt'), 10);

    if (!sessionId || !expiresAt) {
      log(MODULE_NAME, 'Datos de QR incompletos', {
        hasSessionId: !!sessionId,
        hasExpiresAt: !!expiresAt,
      });
      return null;
    }

    const decoded = {
      sessionId,
      expiresAt,
    };

    log(MODULE_NAME, 'Datos de QR decodificados exitosamente', { sessionId });

    return decoded;
  } catch (error) {
    logError(MODULE_NAME, 'Error al decodificar datos de QR', error);
    return null;
  }
};

/**
 * Valida si un QR no ha expirado (con margen de +3 segundos)
 * @param {number} expiresAt - Timestamp de expiración
 * @returns {boolean} True si el QR es válido
 */
export const validateQRExpiration = (expiresAt) => {
  try {
    const now = Date.now();
    const isValid = now <= (expiresAt + VALIDATION_MARGIN);

    log(MODULE_NAME, 'Validando expiración de QR', {
      expiresAt: new Date(expiresAt).toISOString(),
      now: new Date(now).toISOString(),
      margin: `${VALIDATION_MARGIN}ms`,
      isValid,
    });

    return isValid;
  } catch (error) {
    logError(MODULE_NAME, 'Error al validar expiración de QR', error);
    return false;
  }
};

/**
 * Verifica si un QR ha expirado
 * @param {number} expiresAt - Timestamp de expiración
 * @returns {boolean} True si ha expirado
 */
export const isQRExpired = (expiresAt) => {
  const now = Date.now();
  const expired = now > expiresAt;

  log(MODULE_NAME, 'Verificación de expiración de QR', {
    expiresAt: new Date(expiresAt).toISOString(),
    now: new Date(now).toISOString(),
    expired,
  });

  return expired;
};

/**
 * Calcula el tiempo restante de un QR en minutos
 * @param {number} expiresAt - Timestamp de expiración
 * @returns {number} Minutos restantes (puede ser negativo si expiró)
 */
export const getTimeRemaining = (expiresAt) => {
  const now = Date.now();
  const diff = expiresAt - now;
  const minutes = Math.floor(diff / (60 * 1000));

  log(MODULE_NAME, 'Tiempo restante calculado', {
    expiresAt: new Date(expiresAt).toISOString(),
    minutesRemaining: minutes,
  });

  return minutes;
};

/**
 * Valida completamente un QR code (simplificado)
 * @param {string} sessionId - ID de la sesión
 * @param {number} expiresAt - Timestamp de expiración
 * @returns {object} Resultado de la validación
 */
export const validateQRCode = (sessionId, expiresAt) => {
  try {
    log(MODULE_NAME, 'Validación completa de QR', {
      sessionId,
      expiresAt: new Date(expiresAt).toISOString(),
    });

    // Validar expiración (con margen de +3 segundos)
    const isValid = validateQRExpiration(expiresAt);
    if (!isValid) {
      log(MODULE_NAME, 'QR expirado', { sessionId });
      return {
        valid: false,
        reason: 'expired',
        message: 'El código QR ha expirado',
      };
    }

    // Verificar expiración
    const expired = isQRExpired(expiresAt);
    if (expired) {
      log(MODULE_NAME, 'QR expirado', {
        sessionId,
        expiresAt: new Date(expiresAt).toISOString(),
      });
      return {
        valid: false,
        reason: 'expired',
        message: 'El QR ha expirado',
        expiresAt,
      };
    }

    // QR válido
    const timeRemaining = getTimeRemaining(expiresAt);
    log(MODULE_NAME, 'QR válido', {
      sessionId,
      timeRemaining,
    });

    return {
      valid: true,
      sessionId,
      expiresAt,
      timeRemaining,
      message: 'QR válido',
    };
  } catch (error) {
    logError(MODULE_NAME, 'Error en validación completa de QR', error);
    return {
      valid: false,
      reason: 'validation_error',
      message: 'Error al validar el QR',
      error: error.message,
    };
  }
};

/**
 * Extrae y valida datos de una URL de QR
 * @param {string} qrUrl - URL completa del QR
 * @param {number} duration - Duración configurada en minutos
 * @returns {object} Resultado de la validación
 */
export const validateQRUrl = (qrUrl, duration) => {
  try {
    log(MODULE_NAME, 'Validando URL de QR', { qrUrl });

    // Decodificar datos
    const decoded = decodeQRData(qrUrl);
    if (!decoded) {
      return {
        valid: false,
        reason: 'invalid_format',
        message: 'Formato de QR inválido',
      };
    }

    // Validar QR completo
    return validateQRCode(
      decoded.sessionId,
      decoded.signature,
      decoded.timestamp,
      duration
    );
  } catch (error) {
    logError(MODULE_NAME, 'Error al validar URL de QR', error);
    return {
      valid: false,
      reason: 'validation_error',
      message: 'Error al validar el QR',
      error: error.message,
    };
  }
};
