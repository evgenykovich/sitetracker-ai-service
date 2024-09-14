import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import bodyParser from 'body-parser'
import formidable from 'express-formidable'
import routes from './routes'
import swaggerUi from 'swagger-ui-express'
import swaggerJsDoc from 'swagger-jsdoc'

const app = express()
const PORT = process.env.PORT || 3000

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'SiteTracker AI Service',
      version: '1.0.0',
      description: 'API Documentation',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./routes/*.ts'],
}
dotenv.config()
const swaggerDocs = swaggerJsDoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

// Middlewares
app.use(bodyParser.json())
// Enable CORS
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(formidable())

// Routes
app.use('/api', routes)

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
