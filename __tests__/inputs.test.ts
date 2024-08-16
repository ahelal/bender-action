// import * as core from '@actions/core'
// import { context } from '@actions/github'
import { getInputs, validateInputAsBoolean } from '../src/inputs'
// getContextFromPayload

// jest.mock('@actions/core')
// jest.mock('@actions/github')

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
function clearEnvironmentVariables(): void {
  for (const key in process.env) {
    if (key.startsWith('INPUT_')) {
      delete process.env[key]
    }
  }
}

describe('getInputs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearEnvironmentVariables()
  })

  it('should throw an error for empty mode', () => {
    expect(getInputs).toThrow('Input required and not supplied: mode')
  })

  it('should throw an error for invalid mode', () => {
    // set environment variables for the test
    process.env['INPUT_MODE'] = 'no-mode'
    expect(getInputs).toThrow("Invalid input for input 'mode'")
  })

  it('should return the correct inputs for pr mode', () => {
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
      include: ['include123']
    })
  })

  it('should return the correct inputs for job mode', () => {
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
      include: ['include123']
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

    describe('validateInputAsBoolean', () => {
      it('should return true for valid input "true"', () => {
        const result = validateInputAsBoolean('testKey', 'true')
        expect(result).toBe(true)
      })

      it('should return false for valid input "false"', () => {
        const result = validateInputAsBoolean('testKey', 'false')
        expect(result).toBe(false)
      })

      it('should throw an error for invalid input', () => {
        expect(() => {
          validateInputAsBoolean('testKey', 'invalid')
        }).toThrow(
          "Invalid input for input 'testKey': invalid is not a boolean value"
        )
      })
    })
  })
})
