import fs from 'fs'
import fsPromises from 'fs/promises'
import os from 'os'
import { Request, Response } from 'express'
import { getTranslation } from './translate.controller'
import { translateWithGlossary } from '../../services'

jest.mock('../../services')
jest.mock('fs/promises')
jest.mock('path')
jest.mock('os')
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}))
jest.mock('path', () => ({
  join: jest.fn((dir, file) => `${dir}/${file}`),
}))

let consoleErrorSpy: jest.SpyInstance

describe('TranslateController', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockJson: jest.Mock
  let mockStatus: jest.Mock

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockJson = jest.fn()
    mockStatus = jest.fn().mockReturnValue({ json: mockJson })
    mockResponse = {
      status: mockStatus,
    }
    mockRequest = {
      fields: {},
      files: {},
    }
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('getTranslation', () => {
    it('should return 400 if required fields are missing', async () => {
      await getTranslation(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({ error: 'Form data is required' })
    })

    it('should translate text without glossary', async () => {
      mockRequest.fields = {
        text: 'Hello',
        sourceLang: 'en',
        targetLang: 'fr',
      } as any
      ;(translateWithGlossary as jest.Mock).mockResolvedValue('Bonjour')

      await getTranslation(mockRequest as Request, mockResponse as Response)

      expect(translateWithGlossary).toHaveBeenCalledWith(
        'Hello',
        undefined,
        'en',
        'fr'
      )
      expect(mockStatus).toHaveBeenCalledWith(200)
      expect(mockJson).toHaveBeenCalledWith({ translatedText: 'Bonjour' })
    })

    it('should translate text with glossary file (path)', async () => {
      mockRequest.fields = {
        text: 'Hello',
        sourceLang: 'en',
        targetLang: 'fr',
      } as any
      mockRequest.files = {
        glossary: { path: 'mock-glossary-path.xlsx' } as any,
      }

      const mockFileContent = Buffer.from('mock file content')
      ;(fs.promises.readFile as jest.Mock).mockResolvedValue(mockFileContent)
      ;(translateWithGlossary as jest.Mock).mockResolvedValue('Bonjour')

      await getTranslation(mockRequest as Request, mockResponse as Response)

      expect(fs.promises.readFile).toHaveBeenCalledWith(
        'mock-glossary-path.xlsx'
      )

      expect(translateWithGlossary).toHaveBeenCalledWith(
        'Hello',
        undefined,
        'en',
        'fr'
      )
      expect(mockStatus).toHaveBeenCalledWith(200)
      expect(mockJson).toHaveBeenCalledWith({ translatedText: 'Bonjour' })
    })

    it('should handle glossary file as Buffer', async () => {
      mockRequest.fields = {
        text: 'Hello',
        sourceLang: 'en',
        targetLang: 'fr',
      } as any
      mockRequest.files = {
        glossary: Buffer.from('mock glossary content'),
      } as any
      ;(os.tmpdir as jest.Mock).mockReturnValue('/tmp')
      ;(fsPromises.writeFile as jest.Mock).mockImplementation((path, data) => {
        console.log('fsPromises.writeFile called with:', {
          path,
          dataType: typeof data,
        })
        return Promise.resolve(undefined)
      })
      ;(translateWithGlossary as jest.Mock).mockImplementation(
        (text, glossaryPath, sourceLang, targetLang) => {
          console.log('translateWithGlossary called with:', {
            text,
            glossaryPath,
            sourceLang,
            targetLang,
          })
          return Promise.resolve('Bonjour')
        }
      )

      await getTranslation(mockRequest as Request, mockResponse as Response)

      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/^\/tmp\/glossary-\d+\.xlsx$/),
        expect.any(Buffer)
      )
      expect(translateWithGlossary).toHaveBeenCalledWith(
        'Hello',
        expect.stringMatching(/^\/tmp\/glossary-\d+\.xlsx$/),
        'en',
        'fr'
      )
      expect(mockStatus).toHaveBeenCalledWith(200)
      expect(mockJson).toHaveBeenCalledWith({ translatedText: 'Bonjour' })
    })

    it('should handle unsupported glossary file format', async () => {
      mockRequest.fields = {
        text: 'Hello',
        sourceLang: 'en',
        targetLang: 'fr',
      } as any
      mockRequest.files = {
        glossary: 'invalid file format',
      } as any

      await getTranslation(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to translate text',
      })
    })
    it('should handle translation service errors', async () => {
      mockRequest.fields = {
        text: 'Hello',
        sourceLang: 'en',
        targetLang: 'fr',
      } as any
      ;(translateWithGlossary as jest.Mock).mockRejectedValue(
        new Error('Translation service error')
      )

      await getTranslation(mockRequest as Request, mockResponse as Response)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Translation error:',
        expect.any(Error)
      )
      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to translate text',
      })
    })
  })
})
