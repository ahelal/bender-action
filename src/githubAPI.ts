import * as core from '@actions/core'
import { Octokit } from '@octokit/core'
import { OctokitResponse, Context } from './types'

const GithubAPIversion = '2022-11-28'

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
function interpolateObject(
  target: Record<string, string>,
  context: Context
): Record<string, string> {
  const newDic: Record<string, string> = {}
  for (const [key, value] of Object.entries(target)) {
    if (key in context) {
      newDic[key] = context[key]
    } else {
      newDic[key] = value
    }
  }
  return newDic
}

async function getActionRuns(context: Context): Promise<any> {
  const response = await doRequest(
    'GET',
    '/repos/${owner}/${repo}/actions/runs/${runId}',
    {},
    context
  )
  return response.data
}

async function getJob(context: Context): Promise<any> {
  const response = await doRequest(
    'GET',
    '/repos/${owner}/${repo}/actions/runs/${runId}/jobs',
    {},
    context
  )

  if (context['ghJob']) {
    for (const job of response.data.jobs) {
      if (job.name === context['ghJob']) {
        return job
      }
    }
    return null
  }
  for (const job of response.data.jobs) {
    if (job.status === 'completed' && job.conclusion === 'failure') {
      return job
    }
  }
  return null
}

async function getContent(
  filepath: string,
  ref: string,
  context: Context
): Promise<string> {
  const path = '/repos/${owner}/${repo}/contents'
  const response = await doRequest(
    'GET',
    `${path}/${filepath}?ref=${ref}`,
    {},
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
    'GET',
    '/repos/${owner}/${repo}/actions/jobs/${jobId}/logs',
    {},
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
  method: string,
  path: string,
  body: Record<string, any>,
  context: Context
): Promise<OctokitResponse<any, number>> {
  const octokit = new Octokit()
  const iPath: string = interpolateString(`${method} ${path}`, context)

  if (!body.headers) body.headers = {} // create headers if not present
  body.headers['X-GitHub-Api-Version'] = GithubAPIversion
  if (context.ghToken)
    body.headers['authorization'] = `Bearer ${context.ghToken}`
  const iBody = interpolateObject(body, context)

  //TODO remove secrets from body
  core.debug(`doRequest path ${iPath}`)
  core.debug(`doRequest body: ${JSON.stringify(iBody, null, 2)}`)

  try {
    const response = await octokit.request(iPath, iBody)
    core.debug(`doRequest response: ${JSON.stringify(response, null, 2)}`)
    if (response.status !== 200) {
      core.setFailed(
        `Github API request failed with status code ${response.status}. ${response.data.message}`
      )
    }
    return response
  } catch (error) {
    core.error(`Github API request failed. Path '${iPath}' : ${error}`)
    throw error
  }
}

export {
  getJob,
  getJobLogs,
  getActionRuns,
  getContent,
  getJobYaml,
  getFileContent4Context
}
