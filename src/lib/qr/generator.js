/**
 * Generador de QR Codes
 * Genera códigos QR simples para sesiones de pase de lista
 */

import QRCode from 'qrcode';
import { APP_CONFIG, QR_CONFIG, log, logError } from '@/constants/config';

const MODULE_NAME = 'QR Generator';

// Configuración de tiempos
const DEFAULT_LIFE_TIME = 15; // segundos - cada cuánto se actualiza el QR
const DEFAULT_ACTIVE_TIME = 90; // minutos - duración total del QR

/**
 * Genera una llave aleatoria simple
 * @returns {string} Llave de 8 caracteres
 */
const generateRandomKey = () => {
  return Math.random().toString(36).substring(2, 10);
};

/**
 * Genera el payload para el QR code
 * @param {string} sessionId - ID del CurrentGroup
 * @param {number} iteration - Número de iteración actual
 * @param {number} lifeTime - Tiempo de vida en segundos (default: 15)
 * @param {number} activeTime - Tiempo de actividad en minutos (default: 90)
 * @returns {object} Payload del QR
 */
export const generateQRPayload = (
  sessionId, 
  iteration = 0,
  lifeTime = DEFAULT_LIFE_TIME,
  activeTime = DEFAULT_ACTIVE_TIME
) => {
  try {
    const timestamp = Date.now();
    const randomKey = generateRandomKey();
    
    // Formato: groupId-lifeTime-activeTime-timestamp-iteration-randomKey
    const rawData = `${sessionId}-${lifeTime}-${activeTime}-${timestamp}-${iteration}-${randomKey}`;
    
    // Codificar en base64 para que se vea diferente pero sea decodificable
    const encodedData = Buffer.from(rawData).toString('base64');

    log(MODULE_NAME, 'Payload de QR generado', {
      sessionId,
      iteration,
      lifeTime,
      activeTime,
      timestamp: new Date(timestamp).toISOString(),
    });

    return {
      sessionId,
      lifeTime,
      activeTime,
      timestamp,
      iteration,
      randomKey,
      rawData,
      encodedData,
      expiresAt: timestamp + (activeTime * 60 * 1000),
    };
  } catch (error) {
    logError(MODULE_NAME, 'Error al generar payload de QR', error);
    throw error;
  }
};

/**
 * Genera la URL completa para el QR
 * @param {string} encodedData - Datos codificados en base64
 * @returns {string} URL completa
 */
export const generateQRUrl = (encodedData) => {
  const baseUrl = APP_CONFIG.APP_URL;
  const url = `${baseUrl}/asistencia/scan?qr=${encodeURIComponent(encodedData)}`;

  log(MODULE_NAME, 'URL de QR generada', { encodedDataLength: encodedData.length });

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
 * @param {string} sessionId - ID del CurrentGroup
 * @param {number} iteration - Número de iteración
 * @param {number} lifeTime - Tiempo de vida en segundos (default: 15)
 * @param {number} activeTime - Tiempo de actividad en minutos (default: 90)
 * @returns {Promise<object>} Datos del QR generado
 */
export const generateSessionQR = async (
  sessionId, 
  iteration = 0,
  lifeTime = DEFAULT_LIFE_TIME,
  activeTime = DEFAULT_ACTIVE_TIME
) => {
  try {
    log(MODULE_NAME, 'Generando QR para sesión', { sessionId, iteration, lifeTime, activeTime });

    // Generar payload
    const payload = generateQRPayload(sessionId, iteration, lifeTime, activeTime);

    // Generar URL
    const url = generateQRUrl(payload.encodedData);

    // Generar imagen del QR
    const qrImage = await generateQRImage(url);

    const result = {
      sessionId: payload.sessionId,
      url,
      qrImage,
      timestamp: payload.timestamp,
      expiresAt: payload.expiresAt,
      iteration: payload.iteration,
      lifeTime: payload.lifeTime,
      activeTime: payload.activeTime,
      encodedData: payload.encodedData,
      rawData: payload.rawData,
    };

    log(MODULE_NAME, 'QR de sesión generado exitosamente', {
      sessionId,
      iteration,
      expiresAt: new Date(payload.expiresAt).toISOString(),
    });

    return result;
  } catch (error) {
    logError(MODULE_NAME, 'Error al generar QR de sesión', error);
    throw error;
  }
};

/**
 * Decodifica un QR code
 * @param {string} encodedData - Datos codificados
 * @returns {object} Datos decodificados
 */
export const decodeQRData = (encodedData) => {
  try {
    const rawData = Buffer.from(encodedData, 'base64').toString('utf-8');
    const [sessionId, lifeTime, activeTime, timestamp, iteration, randomKey] = rawData.split('-');
    
    return {
      sessionId,
      lifeTime: parseInt(lifeTime),
      activeTime: parseInt(activeTime),
      timestamp: parseInt(timestamp),
      iteration: parseInt(iteration),
      randomKey,
      rawData,
      expiresAt: parseInt(timestamp) + (parseInt(activeTime) * 60 * 1000),
    };
  } catch (error) {
    logError(MODULE_NAME, 'Error al decodificar QR', error);
    throw new Error('QR inválido');
  }
};

/**
 * Valida si un QR aún está vigente
 * @param {object} decodedData - Datos decodificados del QR
 * @returns {boolean} True si el QR es válido
 */
export const isQRValid = (decodedData) => {
  const now = Date.now();
  return now <= decodedData.expiresAt;
};
