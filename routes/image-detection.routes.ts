import express from 'express'
import { getImageDetection } from '../controllers'
/**
 * @swagger
 * /api/detect:
 *   post:
 *     summary: Detect items in an image
 *     description: Analyze an image to detect specified items using AI. The fields must be sent as multipart/form-data.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: file
 *                 description: The image file to analyze.
 *               items:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of items to detect in the image (e.g., ['cat', 'dog']).
 *               aiToUse:
 *                 type: string
 *                 enum: [ 'All AI', 'OpenAI gpt-4o', 'Google gemini-light', 'Anthropic Claude-3', 'AWS Rekognition' ]
 *                 description: The AI model to use for detection.
 *                 default: 'OpenAI gpt-4o'
 *     responses:
 *       '200':
 *         description: Successful detection
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 detectedItems:
 *                   type: array
 *                   items:
 *                     type: string
 *       '400':
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
const router = express.Router()

router.post('/detect', getImageDetection)

export default router
