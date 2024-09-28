import { Request, Response } from 'express'
import { getKnowledgeBase } from './knowledge-base.controller'
import { analyzePDF } from '../../services'
import { getPdfBuffer } from '../../utils'

type KnowledgeBaseFieldsType = {
  question: string | string[]
  pdfUrl: string
}

jest.mock('../../services')
jest.mock('../../utils')

describe('KnowledgeBaseController', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockJson: jest.Mock
  let mockStatus: jest.Mock

  beforeEach(() => {
    mockJson = jest.fn()
    mockStatus = jest.fn().mockReturnValue({ json: mockJson })
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    }
    mockRequest = {
      fields: {},
      files: {},
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 if question is missing', async () => {
    mockRequest.fields = { pdfUrl: 'http://example.com/test.pdf' as any }

    await getKnowledgeBase(mockRequest as Request, mockResponse as Response)

    expect(mockStatus).toHaveBeenCalledWith(400)
    expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid request' })
  })

  it('should return 400 if both file and pdfUrl are missing', async () => {
    mockRequest.fields = { question: ['Test question'] as any }

    await getKnowledgeBase(mockRequest as Request, mockResponse as Response)

    expect(mockStatus).toHaveBeenCalledWith(400)
    expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid request' })
  })

  it('should process request with file upload', async () => {
    const mockFile = { buffer: Buffer.from('test') }
    mockRequest.fields = { question: ['Test question'] }
    mockRequest.files = { file: mockFile as any }

    const mockPdfBuffer = Buffer.from('pdf content')
    ;(getPdfBuffer as jest.Mock).mockResolvedValue(mockPdfBuffer)
    ;(analyzePDF as jest.Mock).mockResolvedValue('Test answer')

    await getKnowledgeBase(mockRequest as Request, mockResponse as Response)

    expect(getPdfBuffer).toHaveBeenCalledWith(mockFile, undefined)
    expect(analyzePDF).toHaveBeenCalledWith(['Test question'], mockPdfBuffer)
    expect(mockStatus).toHaveBeenCalledWith(200)
    expect(mockJson).toHaveBeenCalledWith({ answer: 'Test answer' })
  })

  it('should process request with pdfUrl', async () => {
    mockRequest.fields = {
      question: ['Test question'],
      pdfUrl: 'http://example.com/test.pdf' as any,
    }

    const mockPdfBuffer = Buffer.from('pdf content')
    ;(getPdfBuffer as jest.Mock).mockResolvedValue(mockPdfBuffer)
    ;(analyzePDF as jest.Mock).mockResolvedValue('Test answer')

    await getKnowledgeBase(mockRequest as Request, mockResponse as Response)

    expect(getPdfBuffer).toHaveBeenCalledWith(
      undefined,
      'http://example.com/test.pdf'
    )
    expect(analyzePDF).toHaveBeenCalledWith(['Test question'], mockPdfBuffer)
    expect(mockStatus).toHaveBeenCalledWith(200)
    expect(mockJson).toHaveBeenCalledWith({ answer: 'Test answer' })
  })

  it('should handle errors when getting PDF buffer', async () => {
    mockRequest.fields = {
      question: ['Test question'] as any,
      pdfUrl: 'http://example.com/test.pdf' as any,
    }
    ;(getPdfBuffer as jest.Mock).mockRejectedValue(
      new Error('PDF retrieval failed')
    )

    await getKnowledgeBase(mockRequest as Request, mockResponse as Response)

    expect(mockStatus).toHaveBeenCalledWith(400)
    expect(mockJson).toHaveBeenCalledWith({ error: 'PDF retrieval failed' })
  })
  it('should handle case when question is an array', async () => {
    const mockFile = { buffer: Buffer.from('test') }
    mockRequest.fields = { question: ['Test question'] }
    mockRequest.files = { file: mockFile as any }

    const mockPdfBuffer = Buffer.from('pdf content')
    ;(getPdfBuffer as jest.Mock).mockResolvedValue(mockPdfBuffer)
    ;(analyzePDF as jest.Mock).mockResolvedValue('Test answer')

    await getKnowledgeBase(mockRequest as Request, mockResponse as Response)

    expect(analyzePDF).toHaveBeenCalledWith(['Test question'], mockPdfBuffer)
    expect(mockStatus).toHaveBeenCalledWith(200)
    expect(mockJson).toHaveBeenCalledWith({ answer: 'Test answer' })
  })

  it('should handle errors without message', async () => {
    mockRequest.fields = {
      question: 'Test question' as any,
      pdfUrl: 'http://example.com/test.pdf' as any,
    }
    ;(getPdfBuffer as jest.Mock).mockRejectedValue(new Error())

    await getKnowledgeBase(mockRequest as Request, mockResponse as Response)

    expect(mockStatus).toHaveBeenCalledWith(400)
    expect(mockJson).toHaveBeenCalledWith({ error: 'An error occurred' })
  })

  it('should handle fields of KnowledgeBaseFieldsType', async () => {
    const mockFields: KnowledgeBaseFieldsType = {
      question: 'Test question',
      pdfUrl: 'http://example.com/test.pdf',
    }
    mockRequest.fields = mockFields as any

    const mockPdfBuffer = Buffer.from('pdf content')
    ;(getPdfBuffer as jest.Mock).mockResolvedValue(mockPdfBuffer)
    ;(analyzePDF as jest.Mock).mockResolvedValue('Test answer')

    await getKnowledgeBase(mockRequest as Request, mockResponse as Response)

    expect(getPdfBuffer).toHaveBeenCalledWith(
      undefined,
      'http://example.com/test.pdf'
    )
    expect(analyzePDF).toHaveBeenCalledWith('Test question', mockPdfBuffer)
    expect(mockStatus).toHaveBeenCalledWith(200)
    expect(mockJson).toHaveBeenCalledWith({ answer: 'Test answer' })
  })
})
