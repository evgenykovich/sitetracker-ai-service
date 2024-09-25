import { promises as fsPromises } from 'fs'
import {
  formatBase64Image,
  base64Helper,
  validateUrl,
  findTranslation,
  mapColumnToLang,
  getPdfBuffer,
  convertToBase64,
} from './helpers'

describe('helpers', () => {
  describe('formatBase64Image', () => {
    it('should add data URL prefix to base64 string', () => {
      const base64 = 'abc123'
      const result = formatBase64Image(base64)
      expect(result).toBe('data:image/jpeg;base64,abc123')
    })
  })

  describe('base64Helper', () => {
    it('should remove data URL prefix if present', () => {
      const base64 = 'data:image/jpeg;base64,abc123'
      const result = base64Helper(base64)
      expect(result).toBe('abc123')
    })

    it('should return original string if prefix not present', () => {
      const base64 = 'abc123'
      const result = base64Helper(base64)
      expect(result).toBe('abc123')
    })
  })

  describe('validateUrl', () => {
    it('should return true for valid URLs', () => {
      expect(validateUrl('https://www.example.com')).toBe(true)
      expect(validateUrl('http://subdomain.example.co.uk')).toBe(true)
    })

    it('should return false for invalid URLs', () => {
      expect(validateUrl('not a url')).toBe(false)
      expect(validateUrl('http://')).toBe(false)
    })
  })

  describe('findTranslation', () => {
    it('should translate terms in the given text', () => {
      const glossary = {
        hello: { en: 'Hello', es: 'Hola', fr: 'Bonjour' },
        world: { en: 'World', es: 'Mundo', fr: 'Monde' },
      }

      expect(findTranslation(glossary, 'en', 'hello world')).toBe('Hello World')
      expect(findTranslation(glossary, 'es', 'hello world')).toBe('Hola Mundo')
      expect(findTranslation(glossary, 'fr', 'hello world')).toBe(
        'Bonjour Monde'
      )
    })

    it('should not translate terms not in the glossary', () => {
      const glossary = {
        hello: { en: 'Hello', es: 'Hola', fr: 'Bonjour' },
      }

      expect(findTranslation(glossary, 'en', 'hello universe')).toBe(
        'Hello universe'
      )
    })

    it('should use the original term if translation is not available for the language', () => {
      const glossary = {
        hello: { en: 'Hello', es: 'Hola' },
      }

      expect(findTranslation(glossary, 'fr', 'hello world')).toBe('hello world')
    })

    it('should handle case-insensitive matching', () => {
      const glossary = {
        hello: { en: 'Hello', es: 'Hola' },
      }

      expect(findTranslation(glossary, 'en', 'HELLO world')).toBe('Hello world')
    })
  })
  describe('getPdfBuffer', () => {
    it('should throw an error if neither file nor URL is provided', async () => {
      await expect(getPdfBuffer(null, null)).rejects.toThrow(
        'Either a file or a URL must be provided'
      )
    })

    it('should read file from path', async () => {
      const mockFile = { path: '/tmp/test.pdf' }
      const mockBuffer = Buffer.from('mock pdf content')
      jest.spyOn(fsPromises, 'readFile').mockResolvedValue(mockBuffer)

      const result = await getPdfBuffer(mockFile as any, null)
      expect(result).toBe(mockBuffer)
    })

    it('should return buffer if file is already a Buffer', async () => {
      const mockBuffer = Buffer.from('mock pdf content')
      const result = await getPdfBuffer(mockBuffer as any, null)
      expect(result).toBe(mockBuffer)
    })

    it('should throw an error for unsupported file format', async () => {
      await expect(getPdfBuffer({} as any, null)).rejects.toThrow(
        'Unsupported file format'
      )
    })

    it('should fetch PDF from URL', async () => {
      const mockBuffer = Buffer.from('mock pdf content')
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockBuffer),
      })

      const result = await getPdfBuffer(null, 'https://example.com/test.pdf')
      expect(result).toEqual(mockBuffer)
    })

    it('should throw an error if fetching from URL fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      })

      await expect(
        getPdfBuffer(null, 'https://example.com/test.pdf')
      ).rejects.toThrow('Failed to fetch PDF from URL: Not Found')
    })
  })

  describe('convertToBase64', () => {
    it('should convert file to base64', async () => {
      const mockBuffer = Buffer.from('test content')
      const mockBase64 = mockBuffer.toString('base64')

      jest.spyOn(fsPromises, 'readFile').mockResolvedValue(mockBuffer)

      const result = await convertToBase64('/path/to/file.txt')
      expect(result).toBe(mockBase64)
    })
  })
})
