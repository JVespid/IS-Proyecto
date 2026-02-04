/**
 * Web Scraper para extraer datos de estudiantes
 * Extrae información de portales estudiantiles mediante web scraping
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { SCRAPING_CONFIG, log, logError } from '@/constants/config';
import { validateReportCard } from '@/lib/utils/validators';

const MODULE_NAME = 'Web Scraper';

/**
 * Realiza un fetch HTTP de una URL
 * @param {string} url - URL a fetchear
 * @returns {Promise<string>} HTML de la página
 */
const fetchHTML = async (url) => {
  try {
    log(MODULE_NAME, 'Fetching HTML', { url });

    const response = await axios.get(url, {
      timeout: SCRAPING_CONFIG.TIMEOUT,
      headers: {
        'User-Agent': SCRAPING_CONFIG.USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
      },
      validateStatus: (status) => status < 500, // Aceptar cualquier status < 500
    });

    if (response.status !== 200) {
      log(MODULE_NAME, 'HTTP status no exitoso', {
        url,
        status: response.status,
      });
      throw new Error(`HTTP ${response.status}: No se pudo cargar la página`);
    }

    log(MODULE_NAME, 'HTML obtenido exitosamente', {
      url,
      contentLength: response.data.length,
    });

    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      logError(MODULE_NAME, 'Timeout al hacer fetch', error);
      throw new Error('Timeout: La página tardó demasiado en responder');
    } else if (error.code === 'ENOTFOUND') {
      logError(MODULE_NAME, 'URL no encontrada', error);
      throw new Error('URL no válida: No se pudo conectar al servidor');
    } else {
      logError(MODULE_NAME, 'Error al hacer fetch', error);
      throw error;
    }
  }
};

/**
 * Extrae el número de boleta del HTML
 * @param {string} html - HTML de la página
 * @returns {string|null} Número de boleta o null si no se encuentra
 */
const extractBoletaFromHTML = (html) => {
  try {
    log(MODULE_NAME, 'Extrayendo boleta del HTML');

    const $ = cheerio.load(html);

    // Buscar div con clase 'boleta'
    const boletaDiv = $(`.${SCRAPING_CONFIG.BOLETA_CLASS}`);

    if (boletaDiv.length === 0) {
      log(MODULE_NAME, 'No se encontró div con clase boleta');
      return null;
    }

    // Extraer texto del div
    const boletaText = boletaDiv.text().trim();

    if (!boletaText) {
      log(MODULE_NAME, 'Div de boleta está vacío');
      return null;
    }

    log(MODULE_NAME, 'Boleta extraída del HTML', {
      boleta: boletaText,
      divCount: boletaDiv.length,
    });

    return boletaText;
  } catch (error) {
    logError(MODULE_NAME, 'Error al extraer boleta del HTML', error);
    return null;
  }
};

/**
 * Intenta extraer el nombre completo del estudiante (opcional)
 * @param {string} html - HTML de la página
 * @returns {string|null} Nombre completo o null
 */
const extractFullNameFromHTML = (html) => {
  try {
    log(MODULE_NAME, 'Intentando extraer nombre completo del HTML');

    const $ = cheerio.load(html);

    // Intentar buscar clases comunes para nombre
    const possibleSelectors = [
      '.nombre',
      '.student-name',
      '.fullname',
      '.nombre-completo',
      '.alumno',
      '#nombre',
      '#student-name',
    ];

    for (const selector of possibleSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const name = element.text().trim();
        if (name) {
          log(MODULE_NAME, 'Nombre completo encontrado', {
            selector,
            name,
          });
          return name;
        }
      }
    }

    log(MODULE_NAME, 'No se pudo extraer nombre completo');
    return null;
  } catch (error) {
    logError(MODULE_NAME, 'Error al extraer nombre completo', error);
    return null;
  }
};

/**
 * Extrae datos del estudiante desde una URL
 * @param {string} url - URL de la credencial/portal del estudiante
 * @returns {Promise<object>} Datos extraídos del estudiante
 */
export const extractStudentData = async (url) => {
  try {
    log(MODULE_NAME, 'Extrayendo datos de estudiante', { url });

    // Validar URL
    if (!url || typeof url !== 'string') {
      throw new Error('URL inválida');
    }

    // Fetch HTML
    const html = await fetchHTML(url);

    // Extraer boleta
    const reportCard = extractBoletaFromHTML(html);

    if (!reportCard) {
      log(MODULE_NAME, 'No se pudo extraer número de boleta', { url });
      throw new Error(
        'No se encontró el número de boleta en la página. Asegúrate de que la URL sea correcta y contenga un div con clase "boleta".'
      );
    }

    // Validar y sanitizar boleta
    const validatedReportCard = validateReportCard(reportCard);

    // Intentar extraer nombre (opcional)
    const fullName = extractFullNameFromHTML(html);

    const result = {
      reportCard: validatedReportCard,
      fullName: fullName || 'Nombre no disponible',
      scannedUrl: url,
      extractedAt: new Date().toISOString(),
      additionalData: {
        fullNameAvailable: !!fullName,
      },
    };

    log(MODULE_NAME, 'Datos de estudiante extraídos exitosamente', {
      reportCard: result.reportCard,
      hasFullName: !!fullName,
    });

    return result;
  } catch (error) {
    logError(MODULE_NAME, 'Error al extraer datos de estudiante', error);
    throw error;
  }
};

/**
 * Valida que una URL sea accesible antes de intentar scraping
 * @param {string} url - URL a validar
 * @returns {Promise<boolean>} True si la URL es accesible
 */
export const validateURL = async (url) => {
  try {
    log(MODULE_NAME, 'Validando accesibilidad de URL', { url });

    const response = await axios.head(url, {
      timeout: 5000,
      headers: {
        'User-Agent': SCRAPING_CONFIG.USER_AGENT,
      },
      validateStatus: (status) => status < 500,
    });

    const accessible = response.status === 200;
    log(MODULE_NAME, 'Validación de URL completa', {
      url,
      accessible,
      status: response.status,
    });

    return accessible;
  } catch (error) {
    logError(MODULE_NAME, 'Error al validar URL', error);
    return false;
  }
};

/**
 * Extrae datos de estudiante con reintentos
 * @param {string} url - URL de la credencial
 * @param {number} retries - Número de reintentos (default: 2)
 * @returns {Promise<object>} Datos extraídos del estudiante
 */
export const extractStudentDataWithRetry = async (url, retries = 2) => {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      log(MODULE_NAME, 'Intento de extracción de datos', {
        url,
        attempt: attempt + 1,
        maxAttempts: retries + 1,
      });

      return await extractStudentData(url);
    } catch (error) {
      lastError = error;
      log(MODULE_NAME, 'Intento fallido', {
        attempt: attempt + 1,
        error: error.message,
      });

      if (attempt < retries) {
        // Esperar antes de reintentar (backoff exponencial)
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        log(MODULE_NAME, 'Esperando antes de reintentar', {
          waitTimeMs: waitTime,
        });
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  logError(
    MODULE_NAME,
    `Todos los intentos fallaron después de ${retries + 1} intentos`,
    lastError
  );
  throw lastError;
};
