import * as core from '@actions/core'
import { AzureOpenAI } from 'openai'

const maxTokens = 384

function setupInitialMessage(
  context: Record<string, string>,
  jobLog: string
): any[] {
  const systemMessage = [
    {
      role: 'system',
      content: `As a support software engineer assistant, your purpose is to identify errors and suggest solutions to fix them. 
You'll receive GitHub Action job log that indicate failures. Your response should be formatted as text and follow these guidelines:
1. Sufficient Information Provided:
    - State the cause of the job failure.
    - Provide a solution to fix the error.
2. Insufficient Information or Unable to Suggest a Solution:
    - If there's a stacktrace or an error pointing to a specific file, request the content of that file with a single-line reply: 'CONTENT_OF_FILE_NEEDED "<valid unix path>"' (e.g., 'CONTENT_OF_FILE_NEEDED "src/index.js"'). If directory structure is provided, you can cross-reference the file path with the directory structure.
    - If there's no way forward, reply with 'Not enough information to provide a solution.'`
    }
  ]

  let userMessage = `Github Action log that failed:\n---\n${jobLog}\n`

  if (context.jobContext) {
    userMessage = `${userMessage}GitHub Action job definition yaml:\n---\n${context.jobContext}\n`
  }

  if (context.dirContext) {
    userMessage = `${userMessage}Directory structure of project:\n---\n${context.dirContext})\n`
  }

  if (context.userContext) {
    userMessage = `${userMessage}Extra user context:\n---\n${context.userContext}\n`
  }

  core.debug(
    `Job definition context: '${!!context.jobContext}' Dir context: '${!!context.dirContext}' User context: '${!!context.userContext}'`
  )

  return systemMessage.concat({ role: 'user', content: userMessage })
}

async function openAiRequest(message: any[], context: Record<string, string>) {
  const {
    azOpenaiDeployment: deployment,
    azOpenaiVersion: apiVersion,
    azOpenaiKey: apiKey,
    azOpenaiEndpoint: endpoint
  } = context

  core.info('Asking OpenAI')
  core.debug(`Message: ${JSON.stringify(message, null, 2)}`)
  const client = new AzureOpenAI({ apiKey, endpoint, deployment, apiVersion })
  const response = await client.chat.completions.create({
    messages: message,
    model: '',
    max_tokens: maxTokens,
    stream: false
  })
  core.debug(`OpenAI response: ${JSON.stringify(response, null, 2)}`)
  return response
}

export { openAiRequest, setupInitialMessage }
