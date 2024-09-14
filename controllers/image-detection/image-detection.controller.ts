import { Request, Response } from 'express'
import {
  awsRekognitionDetectImage,
  claudeDetectImage,
  detect,
  geminiDetectImage,
} from '../../services'
import { AIAction, AISelectorEnum, convertToBase64 } from '../../utils'

type ImageDetectionFieldsType = {
  items: string[]
  aiToUse: string
}

export const getImageDetection = async (req: Request, res: Response) => {
  const { items: itemsInput, aiToUse = AISelectorEnum.OPEN_AI } =
    req.fields as unknown as ImageDetectionFieldsType
  const file = req.files?.image as unknown as Express.Multer.File | null
  const items = Array.isArray(itemsInput)
    ? itemsInput
    : (itemsInput as string).split(',').map((item: string) => item.trim())
  if (!file || !items) {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const image = await convertToBase64(file.path)

  /**
   * Object mapping AI services to their respective detection functions.
   */
  const detectFunctions = {
    [AISelectorEnum.OPEN_AI]: detect,
    [AISelectorEnum.GEMINI]: (image: string, items: string[]) =>
      geminiDetectImage(image, AIAction.DETECT, items),
    [AISelectorEnum.CLAUDE]: (image: string, items: string[]) =>
      claudeDetectImage(image, AIAction.DETECT, items),
    [AISelectorEnum.AWS_REKOGNITION]: awsRekognitionDetectImage,
  }

  const detectFunction =
    detectFunctions[aiToUse as keyof typeof detectFunctions]

  if (!detectFunction) {
    return res.status(400).json({ error: 'Invalid AI selection' })
  }

  const detectedItems = await detectFunction(image as string, items)
  return res.status(200).json({ detectedItems })
}
