import express from 'express'
import multer from 'multer'
import { getTranslation } from '../controllers'
const upload = multer()
/**
 * @swagger
 * /api/translate:
 *   post:
 *     summary: Translate text
 *     description: Translate the provided text using an optional glossary file.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text to be translated.
 *               sourceLang:
 *                 type: string
 *                 description: The source language code (e.g., 'en' for English). Defaults to 'en'.
 *                 default: 'en'
 *               targetLang:
 *                 type: string
 *                 description: The target language code (e.g., 'es' for Spanish). Defaults to 'es'.
 *                 default: 'es'
 *               glossary:
 *                 type: file
 *                 description: Optional glossary file for translation. Provide a file to enhance translation accuracy.
 *     responses:
 *       '200':
 *         description: Successful translation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 translatedText:
 *                   type: string
 *       '400':
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       '500':
 *         description: Translation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

const router = express.Router()

router.post('/translate', upload.single('file'), getTranslation)

export default router
