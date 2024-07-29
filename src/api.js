// import { Octokit } from '@octokit/core'

const payloadContext = {}
payloadContext['runId'] = 123
payloadContext['ref'] = 'master'
payloadContext['job'] = 'JobA'
payloadContext['repo'] = 'ahelal/testrepo'

// function createClient(context){
//   API = null
//   const auth = {}
//   if (API) auth.auth = API
//   return new Octokit(auth)
// }

function interpolate(str, context) {
  let newStr = str
  for (const [key, value] of Object.entries(context)) {
    newStr = newStr.replace('${' + key + '}', value)
  }
  return newStr
}

function doRequest(method, path, context) {
  const octokit = createClient(context)
  // await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs', {
  //   owner: 'OWNER',
  //   repo: 'REPO',
  //   run_id: 'RUN_ID',
  //   headers: {
  //     'X-GitHub-Api-Version': '2022-11-28'
  //   }
  // })
  const iPath = interpolate(path, context)
  console.log(`${method} ${iPath}`)
}

doRequest('GET', '/repos/${repo}/actions/runs/${runId}/jobs', payloadContext)
