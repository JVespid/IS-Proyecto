/**
 * Validador de QR Codes
 * Valida códigos QR y sus firmas
 */

import { validateSignature } from '@/lib/utils/crypto';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'QR Validator';

/**
 * Decodifica los datos de un QR code
 * @param {string} qrString - String completo del QR (URL)
 * @returns {object|null} Datos decodificados o null si inválido
 */
export const decodeQRData = (qrString) => {
  try {
    log(MODULE_NAME, 'Decodificando datos de QR', { qrString });

    // Parsear la URL
    const url = new URL(qrString);
    
    // Extraer sessionId del path /asistencia/[sessionId]
    const pathParts = url.pathname.split('/');
    const sessionId = pathParts[pathParts.length - 1];
    
    // Extraer parámetros de query
    const signature = url.searchParams.get('signature');
    const timestamp = parseInt(url.searchParams.get('timestamp'), 10);

    if (!sessionId || !signature || !timestamp) {
      log(MODULE_NAME, 'Datos de QR incompletos', {
        hasSessionId: !!sessionId,
        hasSignature: !!signature,
        hasTimestamp: !!timestamp,
      });
      return null;
    }

    const decoded = {
      sessionId,
      signature,
      timestamp,
    };

    log(MODULE_NAME, 'Datos de QR decodificados exitosamente', { sessionId });

    return decoded;
  } catch (error) {
    logError(MODULE_NAME, 'Error al decodificar datos de QR', error);
    return null;
  }
};

/**
 * Valida el payload y la firma de un QR
 * @param {object} payload - Datos del payload (sessionId, timestamp, expiresAt)
 * @param {string} signature - Firma a validar
 * @returns {boolean} True si la firma es válida
 */
export const validateQRPayload = (payload, signature) => {
  try {
    log(MODULE_NAME, 'Validando payload de QR', {
      sessionId: payload.sessionId,
      timestamp: payload.timestamp,
    });

    const isValid = validateSignature(payload, signature);

    log(MODULE_NAME, 'Resultado de validación de firma', { isValid });

    return isValid;
  } catch (error) {
    logError(MODULE_NAME, 'Error al validar payload de QR', error);
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
 * Valida completamente un QR code
 * @param {string} sessionId - ID de la sesión
 * @param {string} signature - Firma del QR
 * @param {number} timestamp - Timestamp de creación
 * @param {number} duration - Duración configurada en minutos
 * @returns {object} Resultado de la validación
 */
export const validateQRCode = (sessionId, signature, timestamp, duration) => {
  try {
    log(MODULE_NAME, 'Validación completa de QR', {
      sessionId,
      timestamp,
      duration,
    });

    // Calcular expiresAt basado en timestamp y duration
    const expiresAt = timestamp + duration * 60 * 1000;

    // Crear payload para validar firma
    const payload = {
      sessionId,
      timestamp,
      expiresAt,
    };

    // Validar firma
    const signatureValid = validateQRPayload(payload, signature);
    if (!signatureValid) {
      log(MODULE_NAME, 'Firma de QR inválida', { sessionId });
      return {
        valid: false,
        reason: 'invalid_signature',
        message: 'La firma del QR no es válida',
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
      timestamp,
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
