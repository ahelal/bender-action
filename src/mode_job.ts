import * as core from '@actions/core'
import {
  getJob,
  getJobYaml,
  getJobLogs,
  getFileContent4Context
} from './github_api'
import { setupInitialMessage, openAiRequest } from './openai_api'
import { CompletionUsage, Context } from './types'
import { maxRecursionJob, CMD_INCLUDE_FILE } from './config'
import { printAIResponse } from './util'

export async function mainJob(context: Context): Promise<string> {
  // Getting GH action job information
  const currentJob = await getJob(context)
  if (!currentJob) {
    core.warning(
      `Unable to get job ID, either no failed job or wrong job name provided`
    )
    return ''
  }
  context.jobId = currentJob.id

  core.info(
    `* Job Name/ID: ${currentJob.name}/${context.jobId} Job yaml context: ${context.jobContext}`
  )

  if (context.jobContext) context.jobContext = await getJobYaml(context)

  const jobLog = await getJobLogs(context)
  const message = setupInitialMessage(context, jobLog)

  let usage: CompletionUsage = {} as CompletionUsage
  for (let i = 1; i <= maxRecursionJob; i++) {
    const aiResponse = await openAiRequest(message, context)
    if (aiResponse.usage !== undefined) usage = aiResponse.usage

    for (const result of aiResponse.choices) {
      const content = result.message.content
      printAIResponse('JOB Response', content)
      message.push({ role: 'assistant', content })
    }

    const firstChoice = aiResponse.choices[0]
    if (!firstChoice?.message?.content?.includes(CMD_INCLUDE_FILE)) {
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
