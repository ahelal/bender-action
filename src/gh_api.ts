import * as core from '@actions/core'
import { doRequest } from './gh_requests'

import { Context, dataResponse } from './types'
import { CMD_INCLUDE_FILE } from './config'

import { decode64, stripTimestampFromLogs, filterCommitFiles } from './util'

import { debugGroupedMsg } from './output'

/**
 * Retrieves the GH user information.
 *
 * @param context - The context object.
 * @returns A promise that resolves to dataResponse to the user information.
 */
export async function getUserInfo(context: Context): Promise<dataResponse> {
  const user = await doRequest(
    {
      method: 'GET',
      path: '/user'
    },
    context
  )
  return user.data
}

/**
 * Retrieves the comments for a specific pull request.
 *
 * @param context - The context object containing information about the repository and pull request.
 * @returns A promise that resolves to an array of dataResponse objects representing the comments.
 */
export async function getComments(context: Context): Promise<dataResponse[]> {
  const response = await doRequest(
    {
      method: 'GET',
      path: `/repos/${context.owner}/${context.repo}/pulls/${context.pr}/comments`
    },
    context
  )
  return response.data
}

/**
 * Retrieves the list of files associated with a specific commit.
 *
 * @param context - The context object containing information about the repository and commit.
 * @returns A promise that resolves to an array of dataResponse objects representing the commit files.
 */
export async function getCommitFiles(
  context: Context
): Promise<dataResponse[]> {
  const files = await doRequest(
    {
      method: 'GET',
      path: `/repos/${context.owner}/${context.repo}/commits/${context.commitId}`
    },
    context
  )
  return filterCommitFiles(files.data.files, context.include)
}

export async function getJobYaml(context: Context): Promise<string> {
  const jobAction = await getActionRuns(context)
  const jobYaml = await getContentByRef(
    jobAction.path,
    jobAction.head_branch,
    context
  )
  return jobYaml
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
export async function getActionRuns(context: Context): Promise<any> {
  const response = await doRequest(
    {
      method: 'GET',
      path: `/repos/${context.owner}/${context.repo}/actions/runs/${context.runId}`
    },
    context
  )
  return response.data
}

// async function getRepoMetaInfo(context: Context): Promise<String> {
//   let info = ''
//   const repoMeta = await doRequest(
//     {
//       method: 'GET',
//       path: `/repos/${context.owner}/${context.repo}`
//     },
//     context
//   )
//   if (repoMeta.data.full_name) info = `Repo: ${repoMeta.data.full_name}`
//   if (repoMeta.data.description)
//     info += `, Description: ${repoMeta.data.description}`

//   const repoLanguages = await doRequest(
//     {
//       method: 'GET',
//       path: `/repos/${context.owner}/${context.repo}/languages`
//     },
//     context
//   )
//   info += `, Languages (with line count): ${Object.keys(repoLanguages.data).join(', ')}`
//   return info
// }

export async function getJob(context: Context): Promise<any> {
  const response = await doRequest(
    {
      method: 'GET',
      path: `/repos/${context.owner}/${context.repo}/actions/runs/${context.runId}/jobs`
    },
    context
  )

  if (context.ghJob) {
    const namedJob = response.data.jobs.find(
      (job: any) => job.name === context.ghJob
    )
    return namedJob || null
  }

  const failedJob = response.data.jobs.find(
    (job: any) => job.status === 'completed' && job.conclusion === 'failure'
  )

  return failedJob || null
}

export async function getJobLogs(context: Context): Promise<string> {
  const response = await doRequest(
    {
      method: 'GET',
      path: `/repos/${context.owner}/${context.repo}/actions/jobs/${context.jobId}/logs`
    },
    context
  )
  return stripTimestampFromLogs(response.data)
}

export async function getContentByRef(
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
    `Response: ${JSON.stringify(response, null, 2)}`,
    context
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
  const fileContent = await getContentByRef(found[0], context.ref, context)
  return { filename: found[0], content: fileContent }
}

export async function postComment(
  pullRequestNumber: string,
  context: Context,
  body: Record<string, string>
): Promise<string> {
  const response = await doRequest(
    {
      method: 'POST',
      path: `/repos/${context.owner}/${context.repo}/pulls/${pullRequestNumber}/comments`
    },
    context,
    body
  )
  return response.data
}
