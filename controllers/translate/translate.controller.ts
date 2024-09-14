import { Request, Response } from 'express'
import { join } from 'path'
import { promises as fsPromises } from 'fs'
import { tmpdir } from 'os'
import { writeFile } from 'fs/promises'
import { translateWithGlossary } from '../../services'

type TranslateFieldsType = {
  text: string
  sourceLang: string
  targetLang: string
}

/**
 * Handles the request to translate text using a provided glossary and language settings.
 * @async
 * @function getTranslation
 * @param {Request} req - The request object containing fields and files.
 * @param {Response} res - The response object used to send the response.
 * @returns {Promise<Response>} - The response containing the translated text or an error message.
 */
export const getTranslation = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { text, sourceLang, targetLang } =
      req.fields as unknown as TranslateFieldsType
    const glossaryFile = req.files?.glossary as unknown as File | null

    if (!text || !sourceLang || !targetLang) {
      return res.status(400).json({ error: 'Form data is required' })
    }

    let glossaryFilePath: string | undefined
    if (glossaryFile) {
      let buffer: Buffer
      if (
        typeof glossaryFile === 'object' &&
        'path' in glossaryFile &&
        typeof glossaryFile.path === 'string'
      ) {
        // If the file is stored in a temporary path
        buffer = await fsPromises.readFile(glossaryFile.path)
      } else if (Buffer.isBuffer(glossaryFile)) {
        // If glossaryFile is already a Buffer
        buffer = glossaryFile
      } else {
        throw new Error('Unsupported file format')
      }
      const tempFilePath = join(tmpdir(), `glossary-${Date.now()}.xlsx`)
      await writeFile(tempFilePath, buffer)
      glossaryFilePath = tempFilePath
    }

    /**
     * Translates the text using the provided glossary and language settings.
     * @type {string}
     */
    const translatedText = await translateWithGlossary(
      text,
      glossaryFilePath,
      sourceLang,
      targetLang
    )

    return res.status(200).json({ translatedText })
  } catch (error) {
    console.error('Translation error:', error)
    return res.status(500).json({ error: 'Failed to translate text' })
  }
}
