import * as xlsx from 'xlsx'
import { promises as fs } from 'fs'
import { OpenAI as langChainOpenAI } from 'langchain/llms/openai'
import { LLMChain } from 'langchain/chains'
import { PromptTemplate } from 'langchain/prompts'
import { findTranslation, mapColumnToLang } from '../utils'

export interface GlossaryEntryItem {
  [key: string]: {
    [lang: string]: string
  }
}
interface RawGlossaryRow {
  Column1: string
  [key: string]: string
}

/**
 * Loads the glossary from an Excel file.
 * @async
 * @function loadGlossary
 * @param {string} glossaryFilePath - The path to the glossary file.
 * @returns {Promise<GlossaryEntryItem>} - A promise that resolves to an object representing the glossary.
 */
export const loadGlossary = async (
  glossaryFilePath: string
): Promise<GlossaryEntryItem> => {
  const fileContent = await fs.readFile(glossaryFilePath)
  const workbook = xlsx.read(fileContent, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rawData = xlsx.utils.sheet_to_json(sheet) as RawGlossaryRow[]

  const glossary: GlossaryEntryItem = {}

  rawData.forEach((row: RawGlossaryRow) => {
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
    const pattern = Object.keys(glossary)
      .sort((a, b) => b.length - a.length)
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')
    const regex = new RegExp(`\\b(${pattern})s?\\b`, 'gi')

    modifiedText = text.replace(regex, (match) => {
      const term = match.replace(/s$/, '')
      const translation = findTranslation(glossary, targetLang, term)
      if (translation) {
        return match.endsWith('s') && !translation.endsWith('s')
          ? translation + 's'
          : translation
      }
      return match
    })

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
