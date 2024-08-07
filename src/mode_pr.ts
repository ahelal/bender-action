import * as core from '@actions/core'
import { getPullRequestDiff, getFileContent4Context } from './github_api'
import { setupInitialMessagePr, openAiRequest } from './openai_api'
import { Context, CompletionUsage } from './types'
import { maxRecursion } from './config'

export async function runPrMode(context: Context): Promise<string> {
  // const regx = ['/*.yml$', '/*.ts$']

  const response = await getPullRequestDiff(
    context['pr'],
    { owner: context['owner'], repo: context['repo'] },
    context['filesSelection'].split(';')
  )

  const message = setupInitialMessagePr(context, response)
  let usage: CompletionUsage = {} as CompletionUsage
  for (let i = 1; i <= maxRecursion; i++) {
    const aiResponse = await openAiRequest(message, context)
    // assign the response to the usage object
    if (aiResponse.usage !== undefined) usage = aiResponse.usage

    for (const result of aiResponse.choices) {
      const content = result.message.content
      core.info(`###### [ Bender Response ] ######\n${content}\n############\n`)
      message.push({ role: 'assistant', content })
    }

    const firstChoice = aiResponse.choices[0]
    if (!firstChoice?.message?.content?.includes('CONTENT_OF_FILE_NEEDED')) {
      core.debug('No more context needed')
      break
    }

    const fileContent = await getFileContent4Context(
      firstChoice.message.content,
      context
    )
    if (!fileContent) {
      core.warning('Unable to get file content')
      break
    }

    const { filename, content } = fileContent
    message.push({
      role: 'user',
      content: `Content of file ${filename}:\n---\n${content}\n`
    })
  }
  return JSON.stringify(usage)
}
