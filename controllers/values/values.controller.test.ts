import { Request, Response } from 'express'
import { getValuesFromFields } from './values.controller'
import { getValueFromFieldsInImage } from '../../services'
import { convertToBase64 } from '../../utils'

jest.mock('../../services')
jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  convertToBase64: jest.fn(),
}))

describe('Values Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('getValuesFromFields', () => {
    let mockRequest: Partial<Request>
    let mockResponse: Partial<Response>
    let mockJson: jest.Mock
    let mockStatus: jest.Mock

    beforeEach(() => {
      mockJson = jest.fn()
      mockStatus = jest.fn().mockReturnThis()
      mockResponse = {
        json: mockJson,
        status: mockStatus,
      }
      mockRequest = {
        fields: {},
        files: {},
      }
    })

    it('should return 400 if file or fields are missing', async () => {
      await getValuesFromFields(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid request' })
    })

    it('should process single field input', async () => {
      mockRequest.fields = { fields: ['field1'] }
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
      ;(convertToBase64 as jest.Mock).mockResolvedValue('base64image')
      ;(getValueFromFieldsInImage as jest.Mock).mockResolvedValue({
        field1: 'value1',
      })

      await getValuesFromFields(
        mockRequest as Request,
        mockResponse as Response
      )

      //   expect(convertToBase64).toHaveBeenCalledWith('test/path')

      expect(getValueFromFieldsInImage).toHaveBeenCalledWith('base64image', [
        'field1',
      ])
      expect(mockStatus).toHaveBeenCalledWith(200)
      expect(mockJson).toHaveBeenCalledWith({ response: { field1: 'value1' } })
    })

    it('should process multiple fields input', async () => {
      mockRequest.fields = { fields: ['field1', 'field2'] }
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
      ;(convertToBase64 as jest.Mock).mockResolvedValue('base64image')
      ;(getValueFromFieldsInImage as jest.Mock).mockResolvedValue({
        field1: 'value1',
        field2: 'value2',
      })

      await getValuesFromFields(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(getValueFromFieldsInImage).toHaveBeenCalledWith('base64image', [
        'field1',
        'field2',
      ])
      expect(mockStatus).toHaveBeenCalledWith(200)
      expect(mockJson).toHaveBeenCalledWith({
        response: { field1: 'value1', field2: 'value2' },
      })
    })

    it('should process comma-separated string fields input', async () => {
      mockRequest.fields = {
        fields: 'field1, field2, field3' as unknown as string[],
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
      ;(convertToBase64 as jest.Mock).mockResolvedValue('base64image')
      ;(getValueFromFieldsInImage as jest.Mock).mockResolvedValue({
        field1: 'value1',
        field2: 'value2',
        field3: 'value3',
      })

      await getValuesFromFields(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(getValueFromFieldsInImage).toHaveBeenCalledWith('base64image', [
        'field1',
        'field2',
        'field3',
      ])
      expect(mockStatus).toHaveBeenCalledWith(200)
      expect(mockJson).toHaveBeenCalledWith({
        response: { field1: 'value1', field2: 'value2', field3: 'value3' },
      })
    })
  })
})
