import * as core from '@actions/core'
import {
  postComment,
  getComments,
  getCommitFiles,
  getFileContent4Context,
  getContent,
  getUserInfo
} from './github_api'
import { setupInitialMessagePr, openAiRequest } from './openai_api'
import { Context } from './types'
import { maxRecursionPr, CMD_INCLUDE_FILE } from './config'

// core.notice('More context needed')
// AnnotationProperties

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function processFile(
  file: string,
  context: Context,
  relevantComments: Record<string, any>[]
): Promise<void> {
  core.info(`* Processing file: ${file}`)

  let reply = ''
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

  for (let i = 1; i <= maxRecursionPr; i++) {
    const message = setupInitialMessagePr(context, prFileContent, file)
    const aiResponse = await openAiRequest(message, context)

    if (aiResponse.choices.length > 1) {
      core.warning(
        'This should not happen: more than one choice in OpenAI response'
      )
      core.debug(`AI Response choices: JSON.stringify(aiResponse.choices)`)
      return
    }

    const content = aiResponse.choices[0].message.content
    reply = content ?? ''

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
    message.push({ role: 'assistant', content })
  }

  await postComment(context.pr, context, {
    body: reply,
    commit_id: context.commitId,
    path: file,
    subject_type: 'file'
  })
}

export async function runPrMode(context: Context): Promise<string> {
  const filesInPR = await getCommitFiles(context)
  const files = filesInPR.map(f => f.filename)

  if (filesInPR.length < 1) return ''

  const user = await getUserInfo(context)
  const prComments = await getComments(context)

  const relevantComments = prComments.filter(
    comment =>
      comment.user.login === user.login &&
      comment.subject_type === 'file' &&
      comment.commit_id === context.commitId &&
      files.includes(comment.path)
  )

  for (const file of files) {
    await processFile(file, context, relevantComments)
  }

  return ''
}
