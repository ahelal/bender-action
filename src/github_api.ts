import * as core from '@actions/core'
import { Octokit } from '@octokit/core'
import { OctokitResponse, Context, requestParams } from './types'
import { GithubAPIversion } from './config'

import {
  santizeString,
  stripTimestampFromLogs,
  filterCommitFiles,
  interpolateString,
  interpolateObject,
  rawPrintIfDebug
} from './util'

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function getActionRuns(context: Context): Promise<any> {
  const response = await doRequest(
    {
      method: 'GET',
      path: `/repos/${context.owner}/${context.repo}/actions/runs/${context.runId}`
    },
    context
  )
  return response.data
}

async function getJob(context: Context): Promise<any> {
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

async function getContent(
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
  return atob(response.data.content)
}

async function getJobLogs(context: Context): Promise<string> {
  const response = await doRequest(
    {
      method: 'GET',
      path: `/repos/${context.owner}/${context.repo}/actions/jobs/${context.jobId}/logs`
    },
    context
  )
  return stripTimestampFromLogs(response.data)
}

async function getJobYaml(context: Context): Promise<string> {
  const jobAction = await getActionRuns(context)
  const jobYaml = await getContent(
    jobAction.path,
    jobAction.head_branch,
    context
  )
  return jobYaml
}

async function getFileContent4Context(
  response: string,
  context: Context
): Promise<{ filename: string; content: string } | false> {
  const regex = /CONTENT_OF_FILE_NEEDED "(.*?)"/gm
  const matches = [...response.matchAll(regex)]
  if (matches.length < 1) {
    core.warning(
      'No file content matched, this can be incorrect response format from OpenAI. try to run again'
    )
    return false
  }
  const found = matches.map(match => match[1])
  core.info(`Fetching more context from repo: ${found[0]}:${context.ref}`)
  const fileContent = await getContent(found[0], context.ref, context)
  return { filename: found[0], content: fileContent }
}

async function getCommitFiles(
  context: Context
): Promise<Record<string, string>[]> {
  const files = await doRequest(
    {
      method: 'GET',
      path: `/repos/${context.owner}/${context.repo}/commits/${context.commitId}`
    },
    context
  )
  return filterCommitFiles(files.data.files, context.filesSelection.split(','))
}

async function getUserInfo(context: Context): Promise<Record<string, any>> {
  const user = await doRequest(
    {
      method: 'GET',
      path: '/user'
    },
    context
  )
  return user.data
}

async function getComments(context: Context): Promise<Record<string, any>[]> {
  const response = await doRequest(
    {
      method: 'GET',
      path: `/repos/${context.owner}/${context.repo}/pulls/${context.pr}/comments`
    },
    context
  )
  // path: `/repos/${context.owner}/${context.repo}/commits/${context.commitId}/comments`

  return response.data
}

async function postComment(
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

async function doRequest(
  params: requestParams,
  context: Context,
  body?: Record<string, string>
): Promise<OctokitResponse<any, number>> {
  const { baseUrl, method, path, headers } = params
  let iBaseUrl = baseUrl
  let iPayload = {}
  if (!iBaseUrl) iBaseUrl = 'https://api.github.com'

  const config: Record<string, string> = { baseUrl: iBaseUrl }
  if (context.ghToken) config['auth'] = context.ghToken
  const octokit = new Octokit(config)

  const iMethodPath = interpolateString(`${method} ${path}`, context)

  rawPrintIfDebug(`::group::doRequest`)
  core.debug(
    `doRequest octokit init: { baseURL: ${iBaseUrl} auth: ${santizeString(context.ghToken)} }`
  )

  iPayload = interpolateObject(body, context)
  core.debug(`doRequest payload: ${JSON.stringify(iPayload, null, 2)}`)

  let iHeaders = headers
  if (!iHeaders) iHeaders = {}
  iHeaders['X-GitHub-Api-Version'] = GithubAPIversion

  const response = await octokit.request(iMethodPath, {
    headers: iHeaders,
    ...iPayload
  })
  core.debug(`doRequest response: ${JSON.stringify(response, null, 2)}`)
  rawPrintIfDebug(`::endgroup::`)
  if (response.status < 200 || response.status >= 300) {
    core.setFailed(
      `Github API request failed with status code ${response.status}. ${response.data.message}`
    )
  }

  return response
}

export {
  getJob,
  getJobLogs,
  getActionRuns,
  getContent,
  getJobYaml,
  getFileContent4Context,
  getUserInfo,
  getCommitFiles,
  getComments,
  postComment
}
