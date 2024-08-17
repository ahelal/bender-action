import * as core from '@actions/core'
import { Context } from './types'
import { CMD_INCLUDE_FILE } from './config'

import { debugGroupedMsg, decode64 } from './util'
import { doRequest } from './github_api'

export async function getContent(
  filepath: string,
  ref: string,
  context: Context
): Promise<string> {
  const response = await doRequest(
    {
      method: 'GET',
      path: `/repos/${context.owner}/${context.repo}/contents/${filepath}?ref=${ref}`
    },
    context
  )
  return decode64(response.data.content, `${filepath}@${ref}`)
}

export async function getFileContent4Context(
  response: string,
  context: Context
): Promise<{ filename: string; content: string } | false> {
  debugGroupedMsg(
    'getFileContent4Context',
    `Response: ${JSON.stringify(response, null, 2)}`
  )
  const regex = new RegExp(`${CMD_INCLUDE_FILE} "(.*?)"`, 'gm')
  const matches = [...response.matchAll(regex)]
  if (matches.length < 1) {
    core.warning(
      'No file content matched, this can be incorrect response format from OpenAI. try to run again'
    )
    return false
  }
  const found = matches.map(match => match[1])
  core.info(`Fetching more context from repo: ${found[0]}@${context.ref}`)
  const fileContent = await getContent(found[0], context.ref, context)
  return { filename: found[0], content: fileContent }
}
