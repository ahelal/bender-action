const core = require('@actions/core')
const { AzureOpenAI } = require('openai')
const maxTokens = 384

// `Your a coding engineer assistant. Your purpose is to find errors and suggest solutions to fix them.
// Your output should be formatted as text. You will be presented with Github action job log that failed.
// If information provided is enough. You should reply with the following:
// 1- Cause why the job failed.
// 2- Provide a solution to fix the error.
// If the information provided is not enough to deduct the cause of failure or your unable to suggest solution. You should reply as follows:
// 1- If you have a stack trace or error indicates a specific file, you can ask for the content of a the file with a single line reply 'CONTENT_OF_FILE_NEEDED "<full path of file>"' e.g. 'CONTENT_OF_FILE_NEEDED "src/index.js"' and you will be provided with the content of the file for further investigation.
// 2- if no possible way forward reply with 'Not enough information to provide a solution'`

function setupInitialMessage(context, jobLog) {
  const systemMessage = [
    {
      role: 'system',
      content: `As a support software engineer assistant, your purpose is to identify errors and suggest solutions to fix them. 
You'll receive GitHub Action job log that indicate failures. Your response should be formatted as text and follow these guidelines:
1. If the information provided is sufficient:
    - State the cause of the job failure.
    - Provide a solution to fix the error.
2. If the information is insufficient or you're unable to suggest a solution:
    - If there's a stack trace or an error pointing to a specific file, request the content of that file with a single-line reply: 'CONTENT_OF_FILE_NEEDED "<valid unix path>"' (e.g., 'CONTENT_OF_FILE_NEEDED "src/index.js"'). if directory structure is provided you can cross reference the file path with the directory structure.
    - If there's no way forward, reply with 'Not enough information to provide a solution.'`
    }
  ]
  // Message setup

  let userMessage = `Github Action log that failed\n--------\n${jobLog}\n`

  if (context.jobContext)
    userMessage = `${userMessage}GitHub Action job definition yaml\n--------\n${context.jobContext}\n`

  if (context.dirContext)
    userMessage = `${userMessage}Directory structure of project\n--------\n${context.dirContext})\n`

  if (context.userContext)
    userMessage = `${userMessage}Extra user context: ${context.userContext}\n`

  core.info(
    `Job definition context: '${context.jobContext.length > 0}' Dir context: '${context.dirContext.length > 0}' User context: '${context.userContext.length > 0}'`
  )
  return systemMessage.concat({ role: 'user', content: userMessage })
}

async function openAiRequest(message, context) {
  const deployment = context['azOpenaiDeployment']
  const apiVersion = context['azOpenaiVersion']
  const apiKey = context['azOpenaiKey']
  const endpoint = context['azOpenaiEndpoint']

  core.info('Sending request to OpenAI')
  core.debug(`Message: ${JSON.stringify(message, null, 2)}`)
  const client = new AzureOpenAI({ apiKey, endpoint, deployment, apiVersion })
  const results = await client.chat.completions.create({
    messages: message,
    model: '',
    max_tokens: maxTokens,
    stream: false
  })
  return results
}

module.exports = { openAiRequest, setupInitialMessage }
