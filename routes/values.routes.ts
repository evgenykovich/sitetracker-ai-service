import express from 'express'
import { getValuesFromFields } from '../controllers'
/**
 * @swagger
 * /api/values:
 *   post:
 *     summary: Get values from fields in an image
 *     description: Extracts values from specified fields in an uploaded image
 *     tags:
 *       - default
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               fields:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: object
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
const router = express.Router()

router.post('/values', getValuesFromFields)

export default router
