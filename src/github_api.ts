import * as core from '@actions/core'
import { Octokit } from '@octokit/core'
import { OctokitResponse, Context, requestParams } from './types'
import { GithubAPIversion } from './config'

/**
 * Replaces placeholders in a string with corresponding values from a context object.
 *
 * @param str - The string containing placeholders to be replaced.
 * @param context - The context object containing key-value pairs for replacement.
 * @returns The string with placeholders replaced by their corresponding values.
 */
function interpolateString(str: string, context: Context): string {
  return str.replace(/\${(.*?)}/g, (match, key) => context[key] || match)
}

/**
 * Interpolates values from the given `context` object into the `target` object.
 * If a key in `target` exists in `context`, the corresponding value from `context` is used.
 * Otherwise, the original value from `target` is used.
 *
 * @param target - The target object to interpolate values into.
 * @param context - The context object containing the values to interpolate.
 * @returns A new object with interpolated values.
 */
// function interpolateObject(
//   target: Record<string, string>,
//   context: Context
// ): Record<string, string> {
//   const newDic: Record<string, string> = {}
//   for (const [key, value] of Object.entries(target)) {
//     if (key in context) {
//       newDic[key] = context[key]
//     } else {
//       newDic[key] = value
//     }
//   }
//   return newDic
// }

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

function stripLogs(str: string): string {
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{7}Z\s/gm
  return str.replaceAll(regex, '')
}

async function getJobLogs(context: Context): Promise<string> {
  const response = await doRequest(
    {
      method: 'GET',
      path: `/repos/${context.owner}/${context.repo}/actions/jobs/${context.jobId}/logs`
    },
    context
  )
  return stripLogs(response.data)
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
  core.info(`Fetching more context from repo: ${found[0]}:${context['ref']}`)
  const fileContent = await getContent(found[0], context['ref'], context)
  return { filename: found[0], content: fileContent }
}

async function doRequest(
  params: requestParams,
  context: Context
): Promise<OctokitResponse<any, number>> {
  const { baseUrl, method, path, payload, headers } = params
  let iBaseUrl = baseUrl
  if (!iBaseUrl) iBaseUrl = 'https://api.github.com'

  const config: Record<string, string> = { baseUrl: iBaseUrl }
  if (context.ghToken) config['auth'] = context.ghToken
  const octokit = new Octokit(config)

  const iMethodPath = interpolateString(`${method} ${path}`, context)
  core.debug(`doRequest methodPath: ${iMethodPath}`)

  // payload = interpolateObject(payload, context)
  core.debug(`doRequest payload: ${JSON.stringify(payload, null, 2)}}`)
  let iHeaders = headers
  if (!iHeaders) iHeaders = {}
  iHeaders['X-GitHub-Api-Version'] = GithubAPIversion

  const response = await octokit.request(iMethodPath, iHeaders)
  core.debug(`doRequest response: ${JSON.stringify(response, null, 2)}`)

  if (response.status !== 200) {
    core.setFailed(
      `Github API request failed with status code ${response.status}. ${response.data.message}`
    )
  }

  return response
}

export {
  doRequest,
  getJob,
  getJobLogs,
  getActionRuns,
  getContent,
  getJobYaml,
  getFileContent4Context
}
