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

export async function runPrMode(context: Context): Promise<string> {
  const filesInPR = await getCommitFiles(context)
  const files = filesInPR.map(f => f.filename)

  if (filesInPR.length < 1)
    core.warning(
      `No files found in the PR, that matchs the regEx filter '${context.filesSelection}' `
    )
  const user = await getUserInfo(context)
  // console.log(`**User**: ${JSON.stringify(user, null, 2)}`)
  const prComments = await getComments(context)
  // console.log(`**Comments**: ${JSON.stringify(prComments, null, 2)}`)
  // && comment.path
  const relvantComments = prComments.filter(
    comment =>
      comment.user.login === user.login &&
      comment.subject_type === 'file' &&
      comment.commit_id === context.commitId &&
      files.includes(comment.path)
  )

  for (const file of files) {
    core.info(`Processing file: ${file}}`)

    let reply = ''
    const prFileContent = await getContent(file, context.ref, context)
    if (!prFileContent) {
      core.error(`Unable to get file content ${file} ${context.ref}`)
      continue
    }

    // check if the file has been commented on before
    const fileComment = relvantComments.find(comment => comment.path === file)
    if (fileComment) {
      core.warning(`Skipping file ${file} has been commented on before `)
      continue
    }

    for (let i = 1; i <= 2; i++) {
      const message = setupInitialMessagePr(context, prFileContent, file)
      const aiResponse = await openAiRequest(message, context)

      // assign the response to the usage object
      if (aiResponse.choices.length > 1) {
        console.warn('This should not happen more then one choice')
        console.debug('AI Response choices: ', aiResponse.choices)
      }
      const content = aiResponse.choices[0].message.content
      reply = content ?? ''

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
      message.push({ role: 'assistant', content })
    }

    postComment(context.pr, context, {
      body: reply,
      commit_id: context.commitId,
      path: file,
      subject_type: 'file'
    })
  }

  return ''
}
