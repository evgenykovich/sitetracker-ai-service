import * as xlsx from 'xlsx'
import { promises as fs } from 'fs'
import { LLMChain } from 'langchain/chains'
import { PromptTemplate } from 'langchain/prompts'
import * as translationService from './translation.service'

jest.mock('xlsx')
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}))
jest.mock('langchain/llms/openai')
jest.mock('langchain/chains')
jest.mock('langchain/prompts', () => ({
  PromptTemplate: jest.fn().mockImplementation((args) => ({
    template: args.template,
    inputVariables: args.inputVariables,
  })),
}))

describe('Translation Service', () => {
  describe('loadGlossary', () => {
    it('should load and parse the glossary file correctly', async () => {
      const mockFileContent = Buffer.from('mock content')
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {},
        },
      }
      const mockRawData = [
        { Column1: 'A&E', Column17: 'Arquitectura e Ingeniería' },
      ]

      ;(fs.readFile as jest.Mock).mockResolvedValue(mockFileContent)
      ;(xlsx.read as jest.Mock).mockReturnValue(mockWorkbook)
      ;(xlsx.utils.sheet_to_json as jest.Mock).mockReturnValue(mockRawData)

      const result = await translationService.loadGlossary(
        '../mocks/glossary.xlsx'
      )

      expect(result).toEqual({
        'A&E': { es: 'Arquitectura e Ingeniería' },
      })
    })
  })

  describe('translateWithGlossary', () => {
    it('should translate text using the glossary and LLM', async () => {
      const mockGlossary = [
        { Column1: 'A&E', Column17: 'Arquitectura e Ingeniería' },
      ]
      jest
        .spyOn(translationService, 'loadGlossary')
        .mockResolvedValue(mockGlossary as any)
      const mockTranslation = 'Arquitectura e Ingeniería'
      ;(LLMChain.prototype.call as jest.Mock).mockResolvedValue({
        text: mockTranslation,
      })

      const result = await translationService.translateWithGlossary(
        'A&E',
        '../mocks/glossary.xlsx',
        'en',
        'es'
      )

      expect(result).toBe(mockTranslation)
      expect(LLMChain.prototype.call).toHaveBeenCalledWith({
        sourceLang: 'en',
        targetLang: 'es',
        text: 'A&E',
      })
    })

    it('should translate text without a glossary', async () => {
      const mockTranslation = 'Bonjour le Monde'
      ;(LLMChain.prototype.call as jest.Mock).mockResolvedValue({
        text: mockTranslation,
      })

      const result = await translationService.translateWithGlossary(
        'Hello World',
        undefined,
        'en',
        'fr'
      )

      expect(result).toBe(mockTranslation)
      expect(LLMChain.prototype.call).toHaveBeenCalledWith({
        sourceLang: 'en',
        targetLang: 'fr',
        text: 'Hello World',
      })
    })

    it('should handle plural forms in glossary translation', async () => {
      const mockGlossary = {
        apple: { en_US: 'apple', es: 'manzana' },
      }
      jest
        .spyOn(translationService, 'loadGlossary')
        .mockResolvedValue(mockGlossary as any)

      const mockTranslation = 'Me gustan las manzanas'
      ;(LLMChain.prototype.call as jest.Mock).mockResolvedValue({
        text: mockTranslation,
      })

      const result = await translationService.translateWithGlossary(
        'I like apples',
        '../mocks/glossary.xlsx',
        'en',
        'es'
      )

      expect(result).toBe('Me gustan las manzanas')
      expect(LLMChain.prototype.call).toHaveBeenCalledWith({
        sourceLang: 'en',
        targetLang: 'es',
        text: 'I like manzanas',
      })
    })

    it('should use a different prompt template when no glossary is provided', async () => {
      const mockTranslation = 'Translated text'
      ;(LLMChain.prototype.call as jest.Mock).mockResolvedValue({
        text: mockTranslation,
      })

      await translationService.translateWithGlossary(
        'Hello world',
        undefined,
        'en',
        'es'
      )

      expect(PromptTemplate).toHaveBeenCalledWith({
        template: expect.stringContaining(
          'Translate the following text literally'
        ),
        inputVariables: ['sourceLang', 'targetLang', 'text'],
      })
    })

    it('should use glossary prompt template when glossary is provided', async () => {
      const mockGlossary = {
        hello: { en_US: 'Hello', es: 'Hola' },
      }
      jest
        .spyOn(translationService, 'loadGlossary')
        .mockResolvedValue(mockGlossary as any)

      const mockTranslation = 'Translated text'
      ;(LLMChain.prototype.call as jest.Mock).mockResolvedValue({
        text: mockTranslation,
      })

      await translationService.translateWithGlossary(
        'Hello world',
        '../mocks/glossary.xlsx',
        'en',
        'es'
      )

      expect(PromptTemplate).toHaveBeenCalledWith({
        template: expect.stringContaining('Translate the following text from'),
        inputVariables: ['sourceLang', 'targetLang', 'text'],
      })
    })

    it('should not modify text when term is not found in glossary', async () => {
      const mockGlossary = {
        hello: { en_US: 'Hello', es: 'Hola' },
      }
      jest
        .spyOn(translationService, 'loadGlossary')
        .mockResolvedValue(mockGlossary as any)

      const mockTranslation = 'Hola mundo'
      ;(LLMChain.prototype.call as jest.Mock).mockResolvedValue({
        text: mockTranslation,
      })

      const result = await translationService.translateWithGlossary(
        'Hello world',
        '../mocks/glossary.xlsx',
        'en',
        'es'
      )

      expect(result).toBe('Hola mundo')
      expect(LLMChain.prototype.call).toHaveBeenCalledWith({
        sourceLang: 'en',
        targetLang: 'es',
        text: 'Hola world',
      })
    })
  })
})
