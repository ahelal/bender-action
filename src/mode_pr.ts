import * as core from '@actions/core'
import {
  getCommitFiles,
  getContentByRef,
  getFileContent4Context,
  getUserInfo
} from './gh_api'
import { setupInitialMessagePr, openAiRequest } from './openai_api'
import { Context, dataResponse } from './types'
import {
  MAX_RECURSION_OPENAI_REQUEST_PR,
  CMD_INCLUDE_FILE,
  CMD_NO_SUFFICIENT_INFO
} from './config'
import { getRelevantComments, postReviewComment } from './comments'

async function generateReply(
  prFileContent: string,
  context: Context,
  file: string
): Promise<string> {
  let reply = ''
  for (let i = 1; i <= MAX_RECURSION_OPENAI_REQUEST_PR; i++) {
    const message = setupInitialMessagePr(context, prFileContent, file)
    const aiResponse = await openAiRequest(message, context)

    if (aiResponse.choices.length > 1) {
      core.warning(
        'This should not happen: more than one choice in OpenAI response'
      )
      core.debug(JSON.stringify(aiResponse.choices))
      return ''
    }

    reply = aiResponse.choices[0].message.content ?? ''
    if (!reply.includes(CMD_INCLUDE_FILE)) {
      core.debug('No more context needed')
      break
    }

    const fileContent = await getFileContent4Context(reply, context)
    if (!fileContent) {
      core.warning('Unable to get file content')
      break
    }
    message.push({ role: 'assistant', content: reply })
  }
  if (reply.includes(CMD_NO_SUFFICIENT_INFO)) {
    core.warning(
      `No sufficient info for OpenAI to provide reply for content of '${file}'.\n${reply}\n`
    )
    return ''
  }
  return reply
}

async function processFile(
  file: string,
  context: Context,
  relevantComments: dataResponse[]
): Promise<void> {
  core.info(`* Processing file: ${file}`)

  const prFileContent = await getContentByRef(file, context.ref, context)
  if (!prFileContent) {
    core.error(`Unable to fetch file content '${file}' '${context.ref}'`)
    return
  }
  if (prFileContent.trim().length < 1) {
    core.warning(`File ${file} is empty skipping`)
    return
  }

  const fileComment = relevantComments.find(comment => comment.path === file)
  if (fileComment) {
    core.warning(`Skipping file ${file} has been commented on before`)
    return
  }

  const reply = await generateReply(prFileContent, context, file)
  if (reply.trim().length < 1) return

  await postReviewComment(reply, file, context)
}

export async function mainPR(context: Context): Promise<string> {
  const filesInPR = await getCommitFiles(context)
  const files = filesInPR.map(f => f.filename)

  if (filesInPR.length < 1) return ''

  // Whoami
  const user = await getUserInfo(context)
  context.login = user.login

  const relevantComments = await getRelevantComments(files, context)

  for (const file of files) {
    await processFile(file, context, relevantComments)
  }

  return ''
}
