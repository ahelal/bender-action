import fs, { promises as fsPromises } from 'fs'
import { getInputs, getContextFromPayload } from '../src/inputs'
import { tmpdir } from 'os'
import { join } from 'path'

function setInputEnvironmentVariables(
  override: Record<string, string> = {}
): void {
  process.env['INPUT_MODE'] = 'pr'
  process.env['INPUT_GH-TOKEN'] = 'token123'
  process.env['INPUT_GH-JOB'] = 'job123'
  process.env['INPUT_AZ-OPENAI-ENDPOINT'] = 'endpoint123'
  process.env['INPUT_AZ-OPENAI-DEPLOYMENT'] = 'deployment123'
  process.env['INPUT_AZ-OPENAI-KEY'] = 'key123'
  process.env['INPUT_AZ-OPENAI-APIVERSION'] = 'apiVersion123'
  process.env['INPUT_DIR-CONTEXT'] = 'aGVsbG8='
  process.env['INPUT_JOB-CONTEXT'] = 'true'
  process.env['INPUT_USER-CONTEXT'] = 'userContext123'
  process.env['INPUT_INCLUDE'] = 'include123'
  for (const key in override) {
    process.env[`INPUT_${key.toUpperCase()}`] = override[key]
  }
}

function clearInputEnvironmentVariables(): void {
  for (const key in process.env) {
    if (key.startsWith('INPUT_')) {
      delete process.env[key]
    }
  }
}

async function setContextPayloadEnvironmentVariables(
  payload: string,
  override: Record<string, string> = {}
): Promise<string> {
  // const tmp = require('tmp')
  const payloadPath = join(
    tmpdir(),
    `${Math.random().toString(36).substring(7)}.json`
  )
  await fsPromises.writeFile(payloadPath, payload)

  const tmpobj = {
    name: payloadPath,
    removeCallback: async () => {
      try {
        await fsPromises.unlink(payloadPath)
      } catch {
        console.log('..')
      }
    }
  }

  process.env['GITHUB_WORKFLOW'] = 'Test workflow'
  process.env['GITHUB_RUN_NUMBER'] = '2'
  process.env['GITHUB_RUN_ID'] = '123'
  process.env['GITHUB_SHA'] = 'commit'
  process.env['GITHUB_EVENT_NAME'] = 'pull_request'
  process.env['GITHUB_JOB'] = 'JOB'
  process.env['GITHUB_REF'] = 'ref'
  for (const key in override) {
    process.env[key] = override[key]
  }
  process.env['CI'] = 'true'
  process.env['GITHUB_EVENT_PATH'] = tmpobj.name
  // process.env['GITHUB_EVENT_PATH'] = p

  return tmpobj.name
  // return p
}

function clearContextPayloadEnvironmentVariables(path: string): void {
  for (const key in process.env) {
    if (key.startsWith('GITHUB_')) {
      delete process.env[key]
    }
  }
  try {
    fs.unlinkSync(path)
  } catch (e) {
    console.log('')
  }
}

describe('getInputs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    clearInputEnvironmentVariables()
  })

  it('should throw an error for empty mode', () => {
    // const getInputs = require('../src/inputs')
    expect(getInputs).toThrow('required')
  })

  it('should throw an error for invalid mode', () => {
    // const getInputs = require('../src/inputs')
    // set environment variables for the test
    process.env['INPUT_MODE'] = 'no-mode'
    expect(getInputs).toThrow("Invalid input for 'mode'")
    expect(getInputs).toThrow('no-mode')
  })

  it('should return the correct inputs for pr mode', () => {
    // const getInputs = require('../src/inputs')
    setInputEnvironmentVariables()
    const inputs = getInputs()
    expect(inputs).toEqual({
      mode: 'pr',
      ghToken: 'token123',
      ghJob: 'job123',
      azOpenaiEndpoint: 'endpoint123',
      azOpenaiDeployment: 'deployment123',
      azOpenaiKey: 'key123',
      azOpenaiVersion: 'apiVersion123',
      dirContext: 'hello',
      jobContext: true,
      userContext: 'userContext123',
      include: ['include123'],
      inlineComment: false
    })
  })

  it('should return the correct inputs for job mode', () => {
    // const getInputs = require('../src/inputs')
    setInputEnvironmentVariables({ mode: 'job' })
    const inputs = getInputs()
    expect(inputs).toEqual({
      mode: 'job',
      ghToken: 'token123',
      ghJob: 'job123',
      azOpenaiEndpoint: 'endpoint123',
      azOpenaiDeployment: 'deployment123',
      azOpenaiKey: 'key123',
      azOpenaiVersion: 'apiVersion123',
      dirContext: 'hello',
      jobContext: true,
      userContext: 'userContext123',
      include: ['include123'],
      inlineComment: false
    })
  })

  describe('should throw an error for required inputs', () => {
    const testCases = [
      { INPUT_MODE: 'pr' },
      { INPUT_MODE: 'pr', 'INPUT_AZ-OPENAI-ENDPOINT': 'endpoint123' },
      {
        INPUT_MODE: 'pr',
        'INPUT_AZ-OPENAI-ENDPOINT': 'endpoint123',
        'INPUT_AZ-OPENAI-DEPLOYMENT': 'deployment123'
      },
      {
        INPUT_MODE: 'pr',
        'INPUT_AZ-OPENAI-ENDPOINT': 'endpoint123',
        'INPUT_AZ-OPENAI-DEPLOYMENT': 'deployment123',
        'INPUT_AZ-OPENAI-KEY': 'key123'
      }
    ]
    for (const envVars of testCases) {
      it(`when ${Object.keys(envVars).join(', ')} is defined`, () => {
        for (const [key, value] of Object.entries(envVars))
          process.env[key] = value

        expect(getInputs).toThrow('Input required and not supplied')
      })
    }
  })
})

describe('getContextFromPayload', () => {
  let tmpfile = ''

  beforeEach(() => {
    jest.resetModules()
    // jest.isolateModules()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetModules()
    clearContextPayloadEnvironmentVariables(tmpfile)
  })

  it('should return empty context when payload is empty', async () => {
    // const { getContextFromPayload } = require('../src/inputs')
    const expectedContext = {
      action: '',
      commitId: '',
      full_name: '',
      owner: '',
      pr: '',
      ref: '',
      repo: '',
      runId: ''
    }
    const responseContext = await getContextFromPayload()
    expect(responseContext).toEqual(expectedContext)
  })

  it('should return the correct context for a valid payload', async () => {
    // const { getContextFromPayload } = require('../src/inputs')
    const payload = {
      runId: 123,
      action: 'opened',
      repository: {
        full_name: 'ownerName/repoName'
      },
      number: '20',
      pull_request: {
        head: {
          sha: 'commit'
        }
      }
    }
    const envVar = {
      // GITHUB_WORKFLOW: 'Node js cli',
      // GITHUB_EVENT_NAME: 'pull_request',
      // GITHUB_ACTION: '__run_2',
      // GITHUB_REF: 'refs/pull/6/merge',
      // GITHUB_RUN_NUMBER: '1',
      // GITHUB_RUN_ID: '123',
      // GITHUB_ACTOR: 'ahelal',
      // GITHUB_JOB: 'build',
      // GITHUB_SHA: 'd492f0dc80bbde6de8aca5bf59d068a6b811fc9f'
      // // GITHUB_EVENT_PATH: /home/runner/work/_temp/_github_workflow/event.json
    }

    tmpfile = await setContextPayloadEnvironmentVariables(
      JSON.stringify(payload),
      envVar
    )
    const expectedContext = {
      action: 'opened',
      full_name: 'ownerName/repoName',
      owner: 'ownerName',
      repo: 'repoName',
      pr: '20',
      runId: '123',
      commitId: 'commit',
      ref: 'ref'
    }

    const responseContext = await getContextFromPayload()
    expect(responseContext).toEqual(expectedContext)
  })

  //   it('should handle missing pull_request in payload', () => {
  //     const payload = {
  //       repository: {
  //         owner: { login: 'ownerName' },
  //         name: 'repoName'
  //       }
  //     }

  //     const expectedContext = {
  //       owner: 'ownerName',
  //       repo: 'repoName',
  //       pullRequestNumber: undefined
  //     }

  //     const context = getContextFromPayload(payload)

  //     expect(context).toEqual(expectedContext)
  //   })

  //   it('should handle missing repository in payload', () => {
  //     const payload = {}

  //     const expectedContext = {
  //       owner: undefined,
  //       repo: undefined,
  //       pullRequestNumber: undefined
  //     }

  //     const context = getContextFromPayload(payload)

  //     expect(context).toEqual(expectedContext)
  //   })
})

// {
//   "action": "synchronize",
//   "after": "5c1ff863f4116a38622b2495b94d592ec4d3af17",
//   "number": 2,
//   "repository": {
//     "default_branch": "main",
//     "description": null,
//     "full_name": "ahelal/bender-action-test",
//     "language": "Python",
//     "languages_url": "https://api.github.com/repos/ahelal/bender-action-test/languages",
//     "name": "bender-action-test",
//     "owner": {
//       "login": "ahelal",
//       "type": "User",
//       "url": "https://api.github.com/users/ahelal"
//     },
//     "private": false
//   },
//   "sender": {
//     "login": "ahelal"
//   }
// }

// safely create a temp file and return the path
// function createTempFile(): string {
//   const tmp = require('tmp')
//   const tmpobj = tmp.fileSync()
//   return tmpobj.name
// }
