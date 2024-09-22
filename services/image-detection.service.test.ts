import {
  detect,
  measurments,
  geminiDetectImage,
  claudeDetectImage,
  awsRekognitionDetectImage,
} from './image-detection.service'
import { OpenAI } from 'openai'
import { OpenAI as langChainOpenAI } from 'langchain/llms/openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'
import AWS from 'aws-sdk'
import { AIAction } from '../utils'

// Mock the external dependencies
jest.mock('openai')
jest.mock('langchain/llms/openai')
jest.mock('@google/generative-ai')
jest.mock('@anthropic-ai/sdk')
jest.mock('aws-sdk')

describe('Image Detection Service', () => {
  const mockImageBase64 = 'base64encodedimage'
  const mockItems = ['item1', 'item2']

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('detect', () => {
    it('should call OpenAI and return the response', async () => {
      const mockResponse = 'Detected items: item1, item2'
      const mockCall = jest.fn().mockResolvedValue(mockResponse)
      ;(
        langChainOpenAI as jest.MockedClass<typeof langChainOpenAI>
      ).mockImplementation(
        () =>
          ({
            call: mockCall,
          } as any)
      )

      const result = await detect(mockImageBase64, mockItems)

      expect(result).toBe(mockResponse)
      expect(mockCall).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: 'text' }),
          expect.objectContaining({ type: 'image_url' }),
        ])
      )
    })
  })

  describe('measurments', () => {
    it('should call OpenAI chat completions and return the response', async () => {
      const mockResponse = {
        message: 'Measurements: item1 is 10cm, item2 is 20cm',
      }
      const mockCreate = jest
        .fn()
        .mockResolvedValue({ choices: [mockResponse] })
      ;(OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: mockCreate,
              },
            },
          } as any)
      )

      const result = await measurments(mockImageBase64, mockItems)

      expect(result).toEqual(mockResponse)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({ type: 'text' }),
                expect.objectContaining({ type: 'image_url' }),
              ]),
            }),
          ]),
        })
      )
    })
  })

  describe('geminiDetectImage', () => {
    it('should call Gemini AI and return the response for detect action', async () => {
      const mockResponse = { text: () => 'Detected: item1, item2' }
      const mockGenerateContent = jest
        .fn()
        .mockResolvedValue({ response: mockResponse })
      ;(
        GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>
      ).mockImplementation(
        () =>
          ({
            getGenerativeModel: jest.fn().mockReturnValue({
              generateContent: mockGenerateContent,
            }),
          } as any)
      )

      const result = await geminiDetectImage(
        mockImageBase64,
        AIAction.DETECT,
        mockItems
      )

      expect(result).toBe('Detected: item1, item2')
      expect(mockGenerateContent).toHaveBeenCalled()
    })
  })

  describe('claudeDetectImage', () => {
    it('should call Claude AI and return the response for detect action', async () => {
      const mockResponse = { content: [{ text: 'Detected: item1, item2' }] }
      const mockCreate = jest.fn().mockResolvedValue(mockResponse)
      ;(Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(
        () =>
          ({
            messages: {
              create: mockCreate,
            },
          } as any)
      )

      const result = await claudeDetectImage(
        mockImageBase64,
        AIAction.DETECT,
        mockItems
      )

      expect(result).toBe('Detected: item1, item2')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-opus-20240229',
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({ type: 'image' }),
                expect.objectContaining({ type: 'text' }),
              ]),
            }),
          ]),
        })
      )
    })
  })

  describe('awsRekognitionDetectImage', () => {
    it('should call AWS Rekognition and return detected items', async () => {
      const mockResponse = {
        Labels: [{ Name: 'item1' }, { Name: 'item2' }],
      }
      const mockDetectLabels = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(mockResponse),
      })
      ;(
        AWS.Rekognition as jest.MockedClass<typeof AWS.Rekognition>
      ).mockImplementation(
        () =>
          ({
            detectLabels: mockDetectLabels,
          } as any)
      )

      const result = await awsRekognitionDetectImage(mockImageBase64, mockItems)

      expect(result).toBe('item1, item2')
      expect(mockDetectLabels).toHaveBeenCalledWith(
        expect.objectContaining({
          Image: expect.objectContaining({ Bytes: expect.any(Buffer) }),
          MaxLabels: 10,
          MinConfidence: 70,
        })
      )
    })
  })
})
