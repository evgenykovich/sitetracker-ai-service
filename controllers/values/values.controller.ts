import { Request, Response } from 'express'
import { getValueFromFieldsInImage } from '../../services'
import { convertToBase64 } from '../../utils'

/**
 * Retrieves values from specified fields in an image.
 * @async
 * @function getValuesFromFields
 * @param {Request} req - The request object containing fields and files.
 * @param {Response} res - The response object used to send the response.
 * @returns {Promise<Response>} - A promise that resolves to the response object.
 */
export const getValuesFromFields = async (req: Request, res: Response) => {
  const { fields: itemsInput } = req.fields as unknown as {
    fields: string[]
  }

  const fields = Array.isArray(itemsInput)
    ? itemsInput
    : (itemsInput as string)?.split(',').map((item: string) => item.trim())

  const file = req.files?.image as unknown as Express.Multer.File | null

  if (!file || !fields) {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const image = await convertToBase64(file.path)

  const response = await getValueFromFieldsInImage(image, fields)

  return res.status(200).json({ response })
}
