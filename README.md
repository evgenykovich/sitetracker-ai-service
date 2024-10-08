# SiteTracker AI Service

## Overview

The SiteTracker AI Service is a web application that leverages AI technologies to analyze and process various types of data, including images and PDFs. It provides functionalities for image detection, knowledge base retrieval, and text translation.

## Features

- **Image Detection**: Detects specified items in images using various AI models.
- **Knowledge Base Retrieval**: Analyzes PDFs to answer questions based on their content.
- **Text Translation**: Translates text using an optional glossary for enhanced accuracy.

## Technologies Used

- **Node.js**: JavaScript runtime for building the server.
- **Express**: Web framework for Node.js.
- **TypeScript**: Superset of JavaScript for type safety.
- **OpenAI API**: For language processing and image analysis.
- **AWS SDK**: For integrating with AWS services.
- **Google Generative AI**: For advanced AI functionalities.
- **Anthropic Claude**: Another AI model for processing requests.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sitetracker-ai-service.git
   ```
2. Navigate to the project directory:
   ```bash
   cd sitetracker-ai-service
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory and add your environment variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   CLAUDE_API_KEY=your_claude_api_key
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=your_aws_region
   PORT=3000
   ```

## Running the Application

To start the server, run:
For development mode with auto-reloading, use:

```
npm run dev
```

For production mode, use:

```
npm start
```

## API Documentation

The API is documented using Swagger. You can access it at:

```
http://localhost:3000/api-docs
```
