/**
 * Utility functions for handling base64 images, URL validation, and PDF retrieval.
 * @module helpers
 */

/**
 * Saves a base64 string as an image file, adding the data URL prefix if necessary.
 * @param {string} base64String - The base64 encoded image string without the data URL prefix.
 * @returns {string} The formatted base64 string with the data URL prefix.
 */
export const formatBase64Image = (base64String: string): string => {
  const dataUrlPrefix = 'data:image/jpeg;base64,'
  return dataUrlPrefix + base64String
}

import { promises as fsPromises } from 'fs'

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
