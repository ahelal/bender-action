import * as core from '@actions/core'
import { Octokit } from '@octokit/core'
import { OctokitResponse, Context, requestParams } from './types'
import { GITHUB_API_VERSION } from './config'

import { outSantized } from './output'

/* eslint-disable  @typescript-eslint/no-explicit-any */
export async function doRequest(
  params: requestParams,
  context: Context,
  body?: Record<string, string>,
  requestFetch?: () => Promise<any>
): Promise<OctokitResponse<any, number>> {
  const {
    baseUrl = 'https://api.github.com',
    method,
    path,
    headers = {}
  } = params
  const { ghToken } = context

  const config: Record<string, string> = { baseUrl }
  if (ghToken) config['auth'] = ghToken

  const requestOctoKit = requestFetch
    ? { request: { fetch: requestFetch } }
    : {}
  const octokit = new Octokit({ ...config, ...requestOctoKit })

  const iMethodPath = `${method} ${path}`

  if (core.isDebug()) core.startGroup(`doRequest ${iMethodPath}`)
  core.debug(
    `doRequest octokit init: { baseURL: ${baseUrl} auth: ${context?.ghToken?.length > 0} }`
  )

  outSantized(
    'debug',
    `doRequest payload: ${JSON.stringify(body, null, 2)}`,
    context
  )

  headers['X-GitHub-Api-Version'] = GITHUB_API_VERSION

  const response = await octokit.request(iMethodPath, {
    headers,
    ...body
  })

  outSantized(
    'debug',
    `doRequest response: ${JSON.stringify(response, null, 2)}`,
    context
  )
  if (core.isDebug()) core.endGroup()

  if (response.status < 200 || response.status >= 300) {
    outSantized(
      'debug',
      `Github API request failed with status code ${response.status}. ${response.data.message}`,
      context
    )

    core.setFailed('Request to Github API failed')
  }
  return response
}
