const core = require('@actions/core')
const { AzureOpenAI } = require('openai')

let systemMessage = [
  {
    role: 'system',
    content: `Your a coding engineer assistant. Your purpose is to find errors and suggest solutions to fix them.
Your output should be formatted as text.
You will be presented by Github actions job log that failed. You should provide the following 
1- Cause why the job failed.  
2- Provide a solution to fix the error.
Only if the information provided is not enough to find the cause and a solution. Take the following actions:
If you have a stack trace you can ask for the file that caused the error by replying with "GET FILEPATH/FILENAME" without an other text.`
  }
]

async function openAiRequest(payload, context) {
  const deployment = context['azOpenaiDeployment']
  const apiVersion = context['azOpenaiVersion']
  const apiKey = context['azOpenaiKey']
  const endpoint = context['azOpenaiEndpoint']

  if (context.jobContext)
    message.push({
      role: 'system',
      content: `Github action Job\n--------\n${context.jobContext}`
    })

  if (context.dirContext)
    message.push({
      role: 'system',
      content: `Directory structure of project\n--------\n${context.dirContext}`
    })

  if (context.userContext)
    message.push({
      role: 'system',
      content: `extra user context: ${context.userContext}`
    })

  core.info(
    `Job context: '${context.jobContext.length > 0}' Dir context: '${context.dirContext.length > 0}' User context: '${context.userContext.length > 0}'`
  )
  core.info('Sending request to OpenAI')
  const client = new AzureOpenAI({ apiKey, endpoint, deployment, apiVersion })
  const message = systemMessage.concat({ role: 'user', content: payload })
  const results = await client.chat.completions.create({
    messages: message,
    model: '',
    max_tokens: 256,
    stream: false
  })
  return results
}

module.exports = { openAiRequest }
