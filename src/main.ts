import * as core from '@actions/core'
import { wait } from './wait'
import { getInputs, getContextFromPayload } from './inputs'
import {
  getJob,
  getJobYaml,
  getJobLogs,
  getFileContent4Context
} from './github_api'
import { setupInitialMessage, openAiRequest } from './openai_api'
import { CompletionUsage } from './types'

const maxRecursion = 3

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    let context: Record<string, string> = getInputs()
    const payloadContext = getContextFromPayload()
    context = Object.assign({}, context, payloadContext)
    core.debug(`Context: ${JSON.stringify(context, null, 2)}`)

    await wait(parseInt(context.delay, 10))

    // Getting GH action job information
    const currentJob = await getJob(context)
    context.jobId = currentJob.id

    core.info(
      `* Job Name/ID: ${currentJob.name}/${context.jobId} Job yaml context: ${context.jobContext}`
    )

    if (context.jobContext) context.jobContext = await getJobYaml(context)

    const jobLog = await getJobLogs(context)
    const message = setupInitialMessage(context, jobLog)

    let usage: CompletionUsage = {} as CompletionUsage
    for (let i = 1; i <= maxRecursion; i++) {
      const aiResponse = await openAiRequest(message, context)
      // assign the response to the usage object
      if (aiResponse.usage !== undefined) usage = aiResponse.usage

      for (const result of aiResponse.choices) {
        const content = result.message.content
        core.info(
          `###### [ Bender Response ] ######\n${content}\n############\n`
        )
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

      core.debug(
        `UsageAI ${JSON.stringify(aiResponse.usage, null, 2)} recursions: ${i}/${maxRecursion}`
      )
    }
    core.setOutput('usage', JSON.stringify(usage))
  } catch (error) {
    // Fail the workflow step if an error occurs
    if (error instanceof Error && error !== null) {
      core.error(`\nMessage: ${error.message}`)
      if (error.stack) {
        core.error('\nStacktrace:\n====================')
        core.error(error.stack)
      }
    }
    core.setFailed(error as Error)
  }
}
