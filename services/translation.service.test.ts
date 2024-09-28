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

    it('should handle glossary terms without entry for source language', async () => {
      const mockGlossary = {
        apple: { es: 'manzana', fr: 'pomme' }, // No English (source language) entry
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

      // Check if the specific call we're interested in was made
      const calls = (LLMChain.prototype.call as jest.Mock).mock.calls
      const targetCall = calls.find(
        (call) =>
          call[0].sourceLang === 'en' &&
          call[0].targetLang === 'es' &&
          call[0].text.includes('manzanas')
      )

      expect(targetCall).toBeTruthy()
      if (targetCall) {
        expect(targetCall[0]).toEqual(
          expect.objectContaining({
            sourceLang: 'en',
            targetLang: 'es',
            text: 'I like manzanas',
          })
        )
      }
    })

    it('should handle glossary terms without entry for source language but with target language', async () => {
      const mockGlossary = {
        apple: { fr: 'pomme', es: 'manzana' }, // No English (source language) entry
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

      const calls = (LLMChain.prototype.call as jest.Mock).mock.calls
      const targetCall = calls.find(
        (call) =>
          call[0].sourceLang === 'en' &&
          call[0].targetLang === 'es' &&
          call[0].text.includes('manzanas')
      )

      expect(targetCall).toBeTruthy()
      if (targetCall) {
        expect(targetCall[0]).toEqual(
          expect.objectContaining({
            sourceLang: 'en',
            targetLang: 'es',
            text: 'I like manzanas',
          })
        )
      }

      // Verify that the glossary was used despite no source language entry
      expect(translationService.loadGlossary).toHaveBeenCalled()
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
      expect(LLMChain.prototype.call).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceLang: 'en',
          targetLang: 'es',
          text: 'I like manzanas',
        })
      )
    })

    it('should handle complex glossary replacements including plurals and special characters', async () => {
      const mockGlossary = {
        apple: { en_US: 'apple', es: 'manzana' },
        orange: { en_US: 'orange', es: 'naranja' },
        'fruit salad': { en_US: 'fruit salad', es: 'ensalada de frutas' },
        'C\\+\\+': { en_US: 'C++', es: 'C++' },
        '\\(test\\)': { en_US: '(test)', es: '(prueba)' },
      }
      jest
        .spyOn(translationService, 'loadGlossary')
        .mockResolvedValue(mockGlossary as any)

      const mockTranslation =
        'Me gustan las manzanas, naranjas, ensalada de frutas, C++ y (prueba)s'
      ;(LLMChain.prototype.call as jest.Mock).mockResolvedValue({
        text: mockTranslation,
      })

      const result = await translationService.translateWithGlossary(
        'I like apples, oranges, fruit salad, C++ and (test)s',
        '../mocks/glossary.xlsx',
        'en',
        'es'
      )

      expect(result).toBe(
        'Me gustan las manzanas, naranjas, ensalada de frutas, C++ y (prueba)s'
      )

      const calls = (LLMChain.prototype.call as jest.Mock).mock.calls
      const targetCall = calls.find(
        (call) =>
          call[0].sourceLang === 'en' &&
          call[0].targetLang === 'es' &&
          call[0].text.includes('manzanas') &&
          call[0].text.includes('naranjas') &&
          call[0].text.includes('ensalada de frutas') &&
          call[0].text.includes('C++') &&
          call[0].text.includes('(test)s')
      )

      expect(targetCall).toBeTruthy()
      if (targetCall) {
        expect(targetCall[0]).toEqual(
          expect.objectContaining({
            sourceLang: 'en',
            targetLang: 'es',
            text: 'I like manzanas, naranjas, ensalada de frutas, C++ and (test)s',
          })
        )
      }
    })
  })
})
