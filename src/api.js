import { Octokit } from '@octokit/core'

API = null
const auth = {}
if (API) auth.auth = API

const octokit = new Octokit(auth)

await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs', {
  owner: 'OWNER',
  repo: 'REPO',
  run_id: 'RUN_ID',
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
})
