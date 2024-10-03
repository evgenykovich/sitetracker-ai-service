/**
 * Utility functions for handling base64 images, URL validation, and PDF retrieval.
 * @module helpers
 */
import { promises as fsPromises } from 'fs'
import { GlossaryEntryItem } from '../services'

/**
 * Saves a base64 string as an image file, adding the data URL prefix if necessary.
 * @param {string} base64String - The base64 encoded image string without the data URL prefix.
 * @returns {string} The formatted base64 string with the data URL prefix.
 */
export const formatBase64Image = (base64String: string): string => {
  const dataUrlPrefix = 'data:image/jpeg;base64,'
  return dataUrlPrefix + base64String
}

/**
 * Removes the base64 prefix from an image string if present.
 * @param {string} imageBase64 - The base64 encoded image string.
 * @returns {string} The base64 string without the prefix.
 */
export const base64Helper = (imageBase64: string): string => {
  const prefix = 'data:image/jpeg;base64,'
  return imageBase64.startsWith(prefix)
    ? imageBase64.substring(prefix.length)
    : imageBase64
}

/**
 * Validates a URL string.
 * @param {string} url - The URL to validate.
 * @returns {boolean} True if the URL is valid, false otherwise.
 */
export const validateUrl = (url: string): boolean => {
  const urlRegex =
    /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/
  return urlRegex.test(url)
}

/**
 * Retrieves a PDF buffer from either a File object or a URL.
 * @param {File | null} file - The File object containing the PDF.
 * @param {string | null} pdfUrl - The URL of the PDF.
 * @returns {Promise<Buffer>} A promise that resolves to the PDF buffer.
 * @throws {Error} If neither file nor URL is provided, or if fetching from URL fails.
 */
export const getPdfBuffer = async (
  file: File | null,
  pdfUrl: string | null
): Promise<Buffer> => {
  if (!file && !pdfUrl) {
    throw new Error('Either a file or a URL must be provided')
  }

  if (file) {
    let buffer: Buffer
    if (
      typeof file === 'object' &&
      'path' in file &&
      typeof file.path === 'string'
    ) {
      // If the file is stored in a temporary path
      buffer = await fsPromises.readFile(file.path)
    } else if (Buffer.isBuffer(file)) {
      // If glossaryFile is already a Buffer
      buffer = file
    } else {
      throw new Error('Unsupported file format')
    }
    return buffer
  }

  if (pdfUrl) {
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF from URL: ${response.statusText}`)
    }
    return Buffer.from(await response.arrayBuffer())
  }

  // This line should never be reached due to the initial check,
  // but it's included to satisfy TypeScript's control flow analysis
  throw new Error('Unexpected error occurred')
}

/**
 * Converts a file to a base64 encoded string.
 * @param {string} filePath - The path to the file to convert.
 * @returns {Promise<string>} A promise that resolves to the base64 encoded string.
 */
export const convertToBase64 = async (filePath: string): Promise<string> => {
  const fs = require('fs').promises
  const fileBuffer = await fs.readFile(filePath)
  return fileBuffer.toString('base64')
}

/**
 * Finds the translation of a term using the provided glossary.
 * @param {Object} glossary - The glossary containing translations.
 * @param {string | number} outputLang - The target language for translation.
 * @param {string} term - The term to be translated.
 * @returns {string} The translated text.
 */
export const findTranslation = (
  glossary: GlossaryEntryItem,
  outputLang: string | number,
  term: string
): string => {
  const terms = Object.keys(glossary)
  let text = term

  terms.forEach((term) => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    const translation = glossary[term][outputLang] || term
    text = text.replace(regex, translation)
  })

  return text
}

/**
 * Maps a column key to a language code.
 * @param {string} columnKey - The key of the column to map.
 * @returns {string} The corresponding language code.
 */
export const mapColumnToLang = (columnKey: string): string => {
  const columnMapping: { [key: string]: string } = {
    Column7: 'zh_TW',
    Column9: 'zh_CN',
    Column11: 'pt_BR',
    Column13: 'en_US',
    Column15: 'de',
    Column17: 'es',
    Column19: 'fr',
    Column21: 'it',
    Column23: 'ja',
    Column25: 'ko',
    Column29: 'da',
    Column31: 'sv',
    Column33: 'no',
    Column35: 'nl_NL',
    Column37: 'es_MX',
  }
  return columnMapping[columnKey] || columnKey
}
