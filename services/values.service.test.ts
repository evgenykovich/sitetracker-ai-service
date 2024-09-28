import { getValueFromFieldsInImage } from './values.service'
import { OpenAI as langChainOpenAI } from 'langchain/llms/openai'

// Mock the langchain OpenAI class
jest.mock('langchain/llms/openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    call: jest.fn(),
  })),
}))

describe('getValueFromFieldsInImage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should extract values from fields in an image', async () => {
    const mockResponse = JSON.stringify([
      { field: 'name', value: 'John Doe' },
      { field: 'age', value: '30' },
    ])

    // Mock the OpenAI call method
    const mockCall = jest.fn().mockResolvedValue(mockResponse)
    ;(
      langChainOpenAI as jest.MockedClass<typeof langChainOpenAI>
    ).mockImplementation(
      () =>
        ({
          call: mockCall,
        } as any)
    )

    const imageBase64 = 'base64encodedimage'
    const fields = ['name', 'age']

    const result = await getValueFromFieldsInImage(imageBase64, fields)

    expect(result).toEqual([
      { field: 'name', value: 'John Doe' },
      { field: 'age', value: '30' },
    ])

    expect(langChainOpenAI).toHaveBeenCalledWith({
      modelName: 'gpt-4o',
      temperature: 0,
    })

    expect(mockCall).toHaveBeenCalledWith([
      {
        type: 'text',
        text: expect.stringContaining('name, age'),
      },
      {
        type: 'image_url',
        image_url: {
          url: expect.stringContaining('base64encodedimage'),
        },
      },
    ])
  })

  it('should throw an error if AI response is invalid', async () => {
    const mockResponse = 'Invalid JSON response'

    // Mock the OpenAI call method
    const mockCall = jest.fn().mockResolvedValue(mockResponse)
    ;(
      langChainOpenAI as jest.MockedClass<typeof langChainOpenAI>
    ).mockImplementation(
      () =>
        ({
          call: mockCall,
        } as any)
    )

    const imageBase64 = 'base64encodedimage'
    const fields = ['name', 'age']

    await expect(
      getValueFromFieldsInImage(imageBase64, fields)
    ).rejects.toThrow('Failed to process the AI response')
  })
})
