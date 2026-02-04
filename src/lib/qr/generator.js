/**
 * Generador de QR Codes
 * Genera códigos QR para sesiones de pase de lista
 */

import QRCode from 'qrcode';
import { generateSignature } from '@/lib/utils/crypto';
import { APP_CONFIG, QR_CONFIG, ROUTES, log, logError } from '@/constants/config';

const MODULE_NAME = 'QR Generator';

/**
 * Genera el payload para el QR code
 * @param {string} sessionId - ID de la sesión
 * @param {number} duration - Duración en minutos
 * @returns {object} Payload del QR con firma
 */
export const generateQRPayload = (sessionId, duration) => {
  try {
    const timestamp = Date.now();
    const expiresAt = timestamp + duration * 60 * 1000; // Convertir a milisegundos

    // Datos del payload
    const payload = {
      sessionId,
      timestamp,
      expiresAt,
    };

    // Generar firma del payload
    const signature = generateSignature(payload);

    log(MODULE_NAME, 'Payload de QR generado', {
      sessionId,
      duration,
      expiresAt: new Date(expiresAt).toISOString(),
    });

    return {
      ...payload,
      signature,
    };
  } catch (error) {
    logError(MODULE_NAME, 'Error al generar payload de QR', error);
    throw error;
  }
};

/**
 * Genera la URL completa para el QR
 * @param {string} sessionId - ID de la sesión
 * @param {string} signature - Firma del QR
 * @param {number} timestamp - Timestamp de creación
 * @returns {string} URL completa
 */
export const generateQRUrl = (sessionId, signature, timestamp) => {
  const baseUrl = APP_CONFIG.APP_URL;
  const url = `${baseUrl}/asistencia/${sessionId}?signature=${encodeURIComponent(
    signature
  )}&timestamp=${timestamp}`;

  log(MODULE_NAME, 'URL de QR generada', { sessionId, url });

  return url;
};

/**
 * Genera la imagen del QR code
 * @param {string} url - URL a codificar en el QR
 * @returns {Promise<string>} Data URL de la imagen del QR
 */
export const generateQRImage = async (url) => {
  try {
    log(MODULE_NAME, 'Generando imagen de QR', { urlLength: url.length });

    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: QR_CONFIG.SIZE,
      margin: QR_CONFIG.MARGIN,
      errorCorrectionLevel: QR_CONFIG.ERROR_CORRECTION,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    log(MODULE_NAME, 'Imagen de QR generada exitosamente');

    return qrCodeDataUrl;
  } catch (error) {
    logError(MODULE_NAME, 'Error al generar imagen de QR', error);
    throw error;
  }
};

/**
 * Genera un QR code completo para una sesión
 * @param {string} sessionId - ID de la sesión
 * @param {number} duration - Duración en minutos (default: 90)
 * @returns {Promise<object>} Datos del QR generado
 */
export const generateSessionQR = async (sessionId, duration = 90) => {
  try {
    log(MODULE_NAME, 'Generando QR para sesión', { sessionId, duration });

    // Generar payload con firma
    const payload = generateQRPayload(sessionId, duration);

    // Generar URL
    const url = generateQRUrl(payload.sessionId, payload.signature, payload.timestamp);

    // Generar imagen del QR
    const qrImage = await generateQRImage(url);

    const result = {
      sessionId: payload.sessionId,
      url,
      qrImage,
      timestamp: payload.timestamp,
      expiresAt: payload.expiresAt,
      signature: payload.signature,
      duration,
    };

    log(MODULE_NAME, 'QR de sesión generado exitosamente', {
      sessionId,
      expiresAt: new Date(payload.expiresAt).toISOString(),
    });

    return result;
  } catch (error) {
    logError(MODULE_NAME, 'Error al generar QR de sesión', error);
    throw error;
  }
};

/**
 * Genera un QR code como Buffer (para server-side)
 * @param {string} url - URL a codificar
 * @returns {Promise<Buffer>} Buffer de la imagen PNG
 */
export const generateQRBuffer = async (url) => {
  try {
    log(MODULE_NAME, 'Generando QR como buffer', { urlLength: url.length });

    const buffer = await QRCode.toBuffer(url, {
      width: QR_CONFIG.SIZE,
      margin: QR_CONFIG.MARGIN,
      errorCorrectionLevel: QR_CONFIG.ERROR_CORRECTION,
    });

    log(MODULE_NAME, 'Buffer de QR generado exitosamente');

    return buffer;
  } catch (error) {
    logError(MODULE_NAME, 'Error al generar buffer de QR', error);
    throw error;
  }
};
