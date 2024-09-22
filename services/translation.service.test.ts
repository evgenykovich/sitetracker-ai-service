import * as xlsx from 'xlsx'
import { promises as fs } from 'fs'
import { LLMChain } from 'langchain/chains'
import * as translationService from './translation.service'

jest.mock('xlsx')
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}))
jest.mock('langchain/llms/openai')
jest.mock('langchain/chains')

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
  })
})
