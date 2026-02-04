/**
 * Utilidades de criptografía
 * Funciones para firma y validación de QR codes
 */

import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'Crypto';

/**
 * Obtiene la clave secreta para firmar QR codes
 */
const getSecretKey = () => {
  const key = process.env.QR_SECRET_KEY;
  if (!key) {
    throw new Error('QR_SECRET_KEY no está configurada en las variables de entorno');
  }
  return key;
};

/**
 * Genera una firma HMAC-SHA256 para un payload
 * @param {object} payload - Datos a firmar
 * @returns {string} Firma en formato hexadecimal
 */
export const generateSignature = (payload) => {
  try {
    const secretKey = getSecretKey();
    const dataString = JSON.stringify(payload);
    const signature = CryptoJS.HmacSHA256(dataString, secretKey).toString();
    
    log(MODULE_NAME, 'Firma generada exitosamente', {
      payloadKeys: Object.keys(payload),
    });
    
    return signature;
  } catch (error) {
    logError(MODULE_NAME, 'Error al generar firma', error);
    throw error;
  }
};

/**
 * Valida una firma HMAC-SHA256
 * @param {object} payload - Datos originales
 * @param {string} signature - Firma a validar
 * @returns {boolean} True si la firma es válida
 */
export const validateSignature = (payload, signature) => {
  try {
    const expectedSignature = generateSignature(payload);
    const isValid = expectedSignature === signature;
    
    log(MODULE_NAME, 'Firma validada', { isValid });
    
    return isValid;
  } catch (error) {
    logError(MODULE_NAME, 'Error al validar firma', error);
    return false;
  }
};

/**
 * Genera un UUID v4
 * @returns {string} UUID generado
 */
export const generateUUID = () => {
  const uuid = uuidv4();
  log(MODULE_NAME, 'UUID generado', { uuid });
  return uuid;
};

/**
 * Genera un token aleatorio seguro
 * @param {number} length - Longitud del token en bytes (default: 32)
 * @returns {string} Token en formato hexadecimal
 */
export const generateRandomToken = (length = 32) => {
  const randomBytes = CryptoJS.lib.WordArray.random(length);
  return randomBytes.toString();
};

/**
 * Encripta datos sensibles
 * @param {string} data - Datos a encriptar
 * @returns {string} Datos encriptados
 */
export const encryptData = (data) => {
  try {
    const secretKey = getSecretKey();
    const encrypted = CryptoJS.AES.encrypt(data, secretKey).toString();
    log(MODULE_NAME, 'Datos encriptados exitosamente');
    return encrypted;
  } catch (error) {
    logError(MODULE_NAME, 'Error al encriptar datos', error);
    throw error;
  }
};

/**
 * Desencripta datos
 * @param {string} encryptedData - Datos encriptados
 * @returns {string} Datos desencriptados
 */
export const decryptData = (encryptedData) => {
  try {
    const secretKey = getSecretKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    log(MODULE_NAME, 'Datos desencriptados exitosamente');
    return decrypted;
  } catch (error) {
    logError(MODULE_NAME, 'Error al desencriptar datos', error);
    throw error;
  }
};

/**
 * Genera un hash SHA-256 de una cadena
 * @param {string} data - Datos a hashear
 * @returns {string} Hash en formato hexadecimal
 */
export const generateHash = (data) => {
  return CryptoJS.SHA256(data).toString();
};
