import { Request, Response } from 'express'
import { analyzePDF } from '../../services'
import { getPdfBuffer } from '../../utils'

type KnowledgeBaseFieldsType = {
  question: string
  pdfUrl: string
}

/**
 * Handles the request to retrieve knowledge base information by analyzing a PDF.
 * @async
 * @function getKnowledgeBase
 * @param {Request} req - The request object containing fields and files.
 * @param {Response} res - The response object used to send the response.
 * @returns {Promise<Response>} - The response containing the answer or an error message.
 */
export const getKnowledgeBase = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { question, pdfUrl } = req.fields as unknown as KnowledgeBaseFieldsType
  const file = req.files?.file as unknown as File | null

  if (!question || (!file && !pdfUrl)) {
    return res.status(400).json({ error: 'Invalid request' })
  }

  let pdfBuffer: Buffer

  try {
    /**
     * Retrieves the PDF buffer from either the uploaded file or the provided URL.
     */
    pdfBuffer = await getPdfBuffer(file, pdfUrl)
  } catch (error) {
    return res.status(400).json({
      error: (error as Error).message || 'An error occurred',
    })
  }

  /**
   * Processes the question and PDF buffer to generate an answer.
   */
  const answer = await analyzePDF(question, pdfBuffer)
  return res.status(200).json({ answer })
}
