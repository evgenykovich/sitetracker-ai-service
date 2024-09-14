import express from 'express'
import { getKnowledgeBase } from '../controllers'
/**
 * @swagger
 * /api/retrieval:
 *   post:
 *     summary: Retrieve knowledge base
 *     description: Get knowledge base data based on the provided input.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               question:
 *                 type: string
 *               pdfUrl:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
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
 */
const router = express.Router()

router.post('/retrieval', getKnowledgeBase)

export default router
