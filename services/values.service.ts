import { z } from 'zod'
import { OpenAI as langChainOpenAI } from 'langchain/llms/openai'
import { formatBase64Image } from '../utils'

const FieldValueSchema = z.object({
  field: z.string(),
  value: z.string(),
})

const FieldValuesArraySchema = z.array(FieldValueSchema)

/**
 * Extracts values from specified fields in an image.
 * @async
 * @function getValueFromFieldsInImage
 * @param {string} imageBase64 - The base64 encoded image.
 * @param {string[]} fields - The fields to extract values from.
 * @returns {Promise<Array<{ field: string, value: string }>>} - A promise that resolves to an array of objects containing field-value pairs.
 * @throws {Error} If the AI response cannot be parsed or validated.
 */
export const getValueFromFieldsInImage = async (
  imageBase64: string,
  fields: string[]
) => {
  const imageBase64Data = formatBase64Image(imageBase64)
  const model = new langChainOpenAI({
    modelName: 'gpt-4o',
    temperature: 0,
  })

  const prompt = `Please analyze this image and extract the value of the following fields: ${fields.join(
    ', '
  )}. Return the results as a JSON array of objects, where each object has a 'field' and a 'value' property.`

  const response = await model.call([
    {
      type: 'text',
      text: prompt,
    },
    {
      type: 'image_url',
      image_url: {
        url: imageBase64Data,
      },
    },
  ] as any)

  try {
    const cleanedResponse = response.replace(/```json\n|\n```/g, '').trim()
    const validatedResponse = FieldValuesArraySchema.parse(
      JSON.parse(cleanedResponse)
    )
    return validatedResponse
  } catch (error) {
    console.error('Error parsing or validating response:', error)
    throw new Error('Failed to process the AI response')
  }
}
