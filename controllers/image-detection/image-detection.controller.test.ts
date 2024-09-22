import { Request, Response } from 'express'
import { getImageDetection } from './image-detection.controller'
import { AISelectorEnum, convertToBase64 } from '../../utils'
import { detect } from '../../services'

jest.mock('../../services')
jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  convertToBase64: jest.fn(),
}))

describe('getImageDetection', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockJson: jest.Mock
  let mockStatus: jest.Mock

  beforeEach(() => {
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

  it('should return 400 if file or items are missing', async () => {
    await getImageDetection(mockRequest as Request, mockResponse as Response)

    expect(mockStatus).toHaveBeenCalledWith(400)
    expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid request' })

    mockStatus.mockClear()
    mockJson.mockClear()

    mockRequest.files = {
      image: [
        {
          filepath: 'test/path',
          originalFilename: 'test.jpg',
          newFilename: 'test_123.jpg',
          hashAlgorithm: 'md5',
          toJSON: () => ({}),
        } as any,
      ],
    }
    await getImageDetection(mockRequest as Request, mockResponse as Response)

    expect(mockStatus).toHaveBeenCalledWith(400)
    expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid request' })

    mockStatus.mockClear()
    mockJson.mockClear()

    mockRequest.files = {}
    mockRequest.fields = { items: ['item1', 'item2'] }
    await getImageDetection(mockRequest as Request, mockResponse as Response)

    expect(mockStatus).toHaveBeenCalledWith(400)
    expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid request' })
  })

  it('should call the correct detection function based on aiToUse', async () => {
    mockRequest.fields = {
      items: ['item1', 'item2'],
      aiToUse: AISelectorEnum.OPEN_AI as any,
    }
    mockRequest.files = {
      image: [
        {
          filepath: 'test/path',
          originalFilename: 'test.jpg',
          newFilename: 'test_123.jpg',
          hashAlgorithm: 'md5',
          toJSON: () => ({}),
        } as any,
      ],
    }
    ;(convertToBase64 as jest.Mock).mockResolvedValue('base64Image')
    ;(detect as jest.Mock).mockResolvedValue(['detectedItem'])

    await getImageDetection(mockRequest as Request, mockResponse as Response)

    expect(detect).toHaveBeenCalledWith('base64Image', ['item1', 'item2'])
    expect(mockStatus).toHaveBeenCalledWith(200)
    expect(mockJson).toHaveBeenCalledWith({ detectedItems: ['detectedItem'] })
  })
})
