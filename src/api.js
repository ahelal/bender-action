const { Octokit } = require('@octokit/core')
const core = require('@actions/core')

const GithubAPIversion = '2022-11-28'

function interpolateStr(str, context) {
  let newStr = str
  for (const [key, value] of Object.entries(context)) {
    newStr = newStr.replace(`\${${key}}`, value)
  }
  return newStr
}

function interpolateObj(dic, context) {
  const newDic = dic
  for (const [key] of Object.entries(dic)) {
    if (key in context) {
      newDic[key] = context[key]
    }
  }
  return newDic
}

function interpolate(target, context) {
  if (typeof target === 'string' || target instanceof String) {
    return interpolateStr(target, context)
  }
  return interpolateObj(target, context)
}

async function getActionRuns(context) {
  const response = await doRequest(
    'GET',
    '/repos/${owner}/${repo}/actions/runs/${runId}',
    {},
    context
  )
  return response.data
}

async function getJob(context) {
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

async function getContent(filepath, ref, context) {
  const response = await doRequest(
    'GET',
    '/repos/${owner}/${repo}/contents/' + `${filepath}?ref=${ref}`,
    {},
    context
  )
  return response.data
}

function stripLogs(str) {
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{7}Z\s/gm
  return str.replaceAll(regex, '')
}

async function getJobLogs(context) {
  const response = await doRequest(
    'GET',
    '/repos/${owner}/${repo}/actions/jobs/${jobId}/logs',
    {},
    context
  )
  return stripLogs(response.data)
}

async function doRequest(method, path, body, context) {
  const octokit = new Octokit()
  const iPath = interpolate(`${method} ${path}`, context)

  // create headers if not present
  if (!body.headers) body.headers = {}
  body.headers['X-GitHub-Api-Version'] = GithubAPIversion
  if (context.ghToken)
    body.headers['authorization'] = `Bearer ${context.ghToken}`
  const iBody = interpolate(body, context)

  //TODO remove secrets
  core.debug(`doRequest Path ${iPath}`)
  core.debug(`doRequest Body: ${JSON.stringify(iBody, null, 2)}`)

  try {
    const response = await octokit.request(iPath, iBody)
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

module.exports = { getJob, getJobLogs, getActionRuns, getContent }
