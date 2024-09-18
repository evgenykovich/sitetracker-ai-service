import * as xlsx from 'xlsx'
import { promises as fs } from 'fs'
import { OpenAI as langChainOpenAI } from 'langchain/llms/openai'
import { LLMChain } from 'langchain/chains'
import { PromptTemplate } from 'langchain/prompts'
import { findTranslation, mapColumnToLang } from '../utils'

interface GlossaryEntryItem {
  [key: string]: {
    [lang: string]: string
  }
}

/**
 * Loads the glossary from an Excel file.
 * @async
 * @function loadGlossary
 * @param {string} glossaryFilePath - The path to the glossary file.
 * @returns {Promise<GlossaryEntryItem>} - A promise that resolves to an object representing the glossary.
 */
const loadGlossary = async (
  glossaryFilePath: string
): Promise<GlossaryEntryItem> => {
  const fileContent = await fs.readFile(glossaryFilePath)
  const workbook = xlsx.read(fileContent, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rawData = xlsx.utils.sheet_to_json(sheet)

  const glossary: GlossaryEntryItem = {}

  rawData.forEach((row: any) => {
    const term = row['Column1']
    if (!term) return

    glossary[term] = {}

    Object.keys(row).forEach((key) => {
      if (key !== 'Column1') {
        const lang = mapColumnToLang(key)
        glossary[term][lang] = row[key] || ''
      }
    })
  })

  return glossary
}

/**
 * Translates text using a glossary if provided.
 * @async
 * @function translateWithGlossary
 * @param {string} text - The text to translate.
 * @param {string | undefined} glossaryFilePath - The path to the glossary file.
 * @param {string} sourceLang - The source language.
 * @param {string} targetLang - The target language.
 * @returns {Promise<string>} - A promise that resolves to the translated text.
 */
export const translateWithGlossary = async (
  text: string,
  glossaryFilePath: string | undefined,
  sourceLang: string,
  targetLang: string
): Promise<string> => {
  const model = new langChainOpenAI({
    temperature: 0,
    modelName: 'gpt-4o-mini',
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  let modifiedText = text
  let promptTemplate: PromptTemplate
  if (glossaryFilePath) {
    const glossary = await loadGlossary(glossaryFilePath)
    const sortedTerms = Object.keys(glossary).sort(
      (a, b) => b.length - a.length
    )
    modifiedText = text
    for (const term of sortedTerms) {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`\\b${escapedTerm}s?\\b`, 'gi')
      const translation = findTranslation(glossary as any, targetLang, term)
      if (translation) {
        modifiedText = modifiedText.replace(regex, (match) => {
          return match.endsWith('s') && !translation.endsWith('s')
            ? translation + 's'
            : translation
        })
      }
    }

    promptTemplate = new PromptTemplate({
      template: `Translate the following text from {sourceLang} to {targetLang}. Provide only the translation, without any additional text:
      
      {text}`,
      inputVariables: ['sourceLang', 'targetLang', 'text'],
    })
  } else {
    promptTemplate = new PromptTemplate({
      template: `Translate the following text literally from {sourceLang} to {targetLang}. Provide only the translation, without any additional text:
      
      {text}`,
      inputVariables: ['sourceLang', 'targetLang', 'text'],
    })
  }

  const chain = new LLMChain({
    llm: model,
    prompt: promptTemplate,
  })

  const result = await chain.call({
    sourceLang,
    targetLang,
    text: modifiedText,
  })
  return result.text.trim()
}
