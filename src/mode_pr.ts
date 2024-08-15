import * as core from '@actions/core'
import {
  getCommitFiles,
  getFileContent4Context,
  getContent
} from './github_api'
import { setupInitialMessagePr, openAiRequest } from './openai_api'
import { Context, dataResponse } from './types'
import { maxRecursionPr, CMD_INCLUDE_FILE } from './config'
import { getRelevantComments, postReviewComment } from './comments'

async function generateReply(
  prFileContent: string,
  context: Context,
  file: string
): Promise<string> {
  let reply = ''
  for (let i = 1; i <= maxRecursionPr; i++) {
    const message = setupInitialMessagePr(context, prFileContent, file)
    const aiResponse = await openAiRequest(message, context)

    if (aiResponse.choices.length > 1) {
      core.warning(
        'This should not happen: more than one choice in OpenAI response'
      )
      core.debug(JSON.stringify(aiResponse.choices))
      return ''
    }

    const content = aiResponse.choices[0].message.content ?? ''
    reply = content

    if (!content.includes(CMD_INCLUDE_FILE)) {
      core.debug('No more context needed')
      break
    }

    const fileContent = await getFileContent4Context(content, context)
    if (!fileContent) {
      core.warning('Unable to get file content')
      break
    }
    message.push({ role: 'assistant', content })
  }
  return reply
}

async function processFile(
  file: string,
  context: Context,
  relevantComments: dataResponse[]
): Promise<void> {
  core.info(`* Processing file: ${file}`)

  const prFileContent = await getContent(file, context.ref, context)
  if (!prFileContent) {
    core.error(`Unable to fetch file content '${file}' '${context.ref}'`)
    return
  }

  const fileComment = relevantComments.find(comment => comment.path === file)
  if (fileComment) {
    core.warning(`Skipping file ${file} has been commented on before`)
    return
  }

  const reply = await generateReply(prFileContent, context, file)
  await postReviewComment(reply, file, context)
  console.info(reply)
}

export async function runPrMode(context: Context): Promise<string> {
  const filesInPR = await getCommitFiles(context)
  const files = filesInPR.map(f => f.filename)

  if (filesInPR.length < 1) return ''

  const relevantComments = await getRelevantComments(files, context)

  for (const file of files) {
    await processFile(file, context, relevantComments)
  }

  return ''
}
