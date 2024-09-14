import pdf from 'pdf-parse'
import { Document } from 'langchain/document'
import { OpenAI as langChainOpenAI } from 'langchain/llms/openai'
import { loadQARefineChain } from 'langchain/chains'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'

const extractTextFromPDF = async (pdfBuffer: Buffer): Promise<string> => {
  const data = await pdf(pdfBuffer)
  return data.text
}

/**
 * Performs a question-answering operation on a PDF.
 * @async
 * @function analyzePDF
 * @param {string} question - The question to ask.
 * @param {Buffer} pdfBuffer - The PDF buffer.
 * @returns {Promise<string>} - The answer to the question.
 */
export const analyzePDF = async (question: string, pdfBuffer: Buffer) => {
  const content = await extractTextFromPDF(pdfBuffer)

  const doc = new Document({
    pageContent: content,
    metadata: { id: 'pdf-doc', createdAt: new Date() },
  })

  const model = new langChainOpenAI({
    temperature: 0,
    modelName: 'gpt-4o-mini',
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const chain = loadQARefineChain(model)
  const embeddings = new OpenAIEmbeddings()
  const store = await MemoryVectorStore.fromDocuments([doc], embeddings)
  const relevantDocs = await store.similaritySearch(question)
  const res = await chain.call({
    input_documents: relevantDocs,
    question,
  })

  return res.output_text
}
