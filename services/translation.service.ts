import * as xlsx from 'xlsx'
import { promises as fs } from 'fs'
import { OpenAI as langChainOpenAI } from 'langchain/llms/openai'
import { LLMChain } from 'langchain/chains'
import { PromptTemplate } from 'langchain/prompts'

/**
 * Loads and chunks the glossary from a file.
 * @async
 * @function loadAndChunkGlossary
 * @param {string} glossaryFilePath - Path to the glossary file.
 * @returns {Promise<string[]>} - An array of glossary chunks.
 */
const loadAndChunkGlossary = async (
  glossaryFilePath: string
): Promise<string[]> => {
  const fileContent = await fs.readFile(glossaryFilePath)
  const workbook = xlsx.read(fileContent, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const glossary = xlsx.utils.sheet_to_json(sheet)

  if (!Array.isArray(glossary) || glossary.length === 0) {
    console.error('Glossary is empty or not an array:', glossary)
    throw new Error('Invalid glossary format')
  }

  const glossaryString = glossary
    .map((entry) => {
      const values = Object.values(entry as Record<string, unknown>)
      if (values.length === 0) {
        console.warn('Empty glossary entry:', entry)
        return null
      }
      return values.join(' | ')
    })
    .filter(Boolean)
    .join('\n')

  if (glossaryString.length === 0) {
    console.warn('Glossary string is empty')
  }

  return chunkGlossary(glossaryString)
}

/**
 * Chunks the glossary string into smaller parts.
 * @function chunkGlossary
 * @param {string} glossaryString - The glossary string to chunk.
 * @returns {string[]} - An array of chunks.
 */
const chunkGlossary = (glossaryString: string): string[] => {
  const MAX_CHUNK_SIZE = 10000 // Adjust as needed
  const lines = glossaryString.split('\n')
  const chunks: string[] = []
  let currentChunk = ''

  for (const line of lines) {
    if ((currentChunk + line + '\n').length > MAX_CHUNK_SIZE) {
      if (currentChunk) chunks.push(currentChunk.trim())
      currentChunk = line + '\n'
    } else {
      currentChunk += line + '\n'
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim())

  return chunks
}

/**
 * Translates text using chunked glossary.
 * @async
 * @function translateWithChunkedGlossary
 * @param {string} text - The text to translate.
 * @param {string[]} glossaryChunks - The glossary chunks.
 * @param {LLMChain} chain - The LLM chain for translation.
 * @param {{ sourceLang: string; targetLang: string }} params - Language parameters.
 * @returns {Promise<string>} - The translated text.
 */
const translateWithChunkedGlossary = async (
  text: string,
  glossaryChunks: string[],
  chain: LLMChain,
  params: { sourceLang: string; targetLang: string }
): Promise<string> => {
  let translatedText = text

  for (const glossaryChunk of glossaryChunks) {
    const result = await chain.call({
      ...params,
      glossaryChunk,
      text: translatedText,
    })
    translatedText = result.text
  }

  return translatedText
}

/**
 * Translates text using a glossary if provided.
 * @async
 * @function translateWithGlossary
 * @param {string} text - The text to translate.
 * @param {string | undefined} glossaryFilePath - Path to the glossary file.
 * @param {string} sourceLang - The source language.
 * @param {string} targetLang - The target language.
 * @returns {Promise<string>} - The translated text.
 */
export const translateWithGlossary = async (
  text: string,
  glossaryFilePath: string | undefined,
  sourceLang: string,
  targetLang: string
) => {
  const model = new langChainOpenAI({
    temperature: 0,
    modelName: 'gpt-4o-mini',
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  if (!glossaryFilePath) {
    const simplePromptTemplate = new PromptTemplate({
      template: `Translate the following text from {sourceLang} to {targetLang}. Provide only the translation, without any additional text:
      
      {text}`,
      inputVariables: ['sourceLang', 'targetLang', 'text'],
    })

    const simpleChain = new LLMChain({
      llm: model,
      prompt: simplePromptTemplate,
    })
    const result = await simpleChain.call({ sourceLang, targetLang, text })
    return result.text.trim()
  }
  const glossaryChunks = await loadAndChunkGlossary(glossaryFilePath)

  const promptTemplate = new PromptTemplate({
    template: `You are a professional translator. Translate the following text from {sourceLang} to {targetLang}. 
          Use the provided glossary chunk for consistent terminology. Each line of the glossary contains all information about a term, separated by '|':
      
          Glossary Chunk:
          {glossaryChunk}
      
          Text to translate:
          {text}
      
          Translation:`,
    inputVariables: ['sourceLang', 'targetLang', 'glossaryChunk', 'text'],
  })

  const chain = new LLMChain({ llm: model, prompt: promptTemplate })

  const translatedText = await translateWithChunkedGlossary(
    text,
    glossaryChunks,
    chain,
    {
      sourceLang,
      targetLang,
    }
  )

  return translatedText
}
