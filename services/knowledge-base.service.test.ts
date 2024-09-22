jest.doMock('pdf-parse', () => {
  return jest.fn().mockResolvedValue({ text: 'Mocked PDF content' })
})

jest.doMock('langchain/llms/openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({})),
}))
jest.doMock('langchain/chains', () => ({
  loadQARefineChain: jest.fn().mockReturnValue({
    call: jest.fn().mockResolvedValue({ output_text: 'This is the answer.' }),
  }),
}))
jest.doMock('langchain/embeddings/openai', () => ({
  OpenAIEmbeddings: jest.fn().mockImplementation(() => ({})),
}))
jest.doMock('langchain/vectorstores/memory', () => ({
  MemoryVectorStore: {
    fromDocuments: jest.fn().mockResolvedValue({
      similaritySearch: jest
        .fn()
        .mockResolvedValue(['relevantDoc1', 'relevantDoc2']),
    }),
  },
}))

const { analyzePDF } = jest.requireActual('./knowledge-base.service')

describe('analyzePDF', () => {
  it('should analyze a PDF and return an answer', async () => {
    const mockPDFBuffer = Buffer.from('mock PDF content')

    const question = 'What is the main topic of this PDF?'
    const answer = await analyzePDF(question, mockPDFBuffer)

    expect(answer).toBe('This is the answer.')

    const { loadQARefineChain } = require('langchain/chains')
    expect(loadQARefineChain().call).toHaveBeenCalledWith({
      input_documents: ['relevantDoc1', 'relevantDoc2'],
      question: 'What is the main topic of this PDF?',
    })
  })
})
