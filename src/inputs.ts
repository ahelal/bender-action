import * as core from '@actions/core'
// import * as github from '@actions/github'
import { context } from '@actions/github'
import { debugGroupedMsg } from './util'
import { Context } from './types'

export function validateInputAsBoolean(
  nameOfKey: string,
  userInput: string
): boolean {
  if (userInput.toLowerCase() === 'true') return true
  if (userInput.toLowerCase() === 'false') return false
  throw new Error(
    `Invalid input for input '${nameOfKey}': ${userInput} is not a boolean value`
  )
}

export function validateInputWithSelection(
  nameOfKey: string,
  userInput: string,
  validValues: string[]
): string {
  if (validValues.includes(userInput)) return userInput
  throw new Error(
    `Invalid input for input '${nameOfKey}': ${userInput} is not a valid value`
  )
}

/**
 * Get predfined action inputs for actions.
 * @returns {Context} Resolves when the action is complete.
 */
export function getInputs(): Context {
  const inputs: Context = {} as Context

  inputs.mode = validateInputWithSelection(
    'mode',
    core.getInput('mode', { required: true }),
    ['pr', 'job']
  )

  inputs.ghToken = core.getInput('gh-token', {
    required: inputs.mode === 'pr'
  })

  inputs.ghJob = core.getInput('gh-job', {
    required: false
  })

  inputs.azOpenaiEndpoint = core.getInput('az-openai-endpoint', {
    required: true
  })

  inputs.azOpenaiDeployment = core.getInput('az-openai-deployment', {
    required: true
  })

  inputs['azOpenaiKey'] = core.getInput('az-openai-key', {
    required: true
  })

  inputs['azOpenaiVersion'] = core.getInput('az-openai-apiVersion', {
    required: true
  })

  inputs['dirContext'] = core.getInput('dir-context', {
    required: false
  })

  if (inputs['dirContext'].length > 0)
    inputs['dirContext'] = atob(inputs['dirContext'])

  inputs['jobContext'] = validateInputAsBoolean(
    'jobContext',
    core.getInput('job-context', {
      required: false
    })
  )

  inputs['userContext'] = core.getInput('user-context', {
    required: false
  })

  inputs['include'] = core
    .getInput('include', {
      required: false
    })
    .split(';')

  return inputs
}
/**
 * Get context from githubaction payload and return required context.
 * @returns {Context} Resolves when the action is complete.
 */

export function getContextFromPayload(): Context {
  debugGroupedMsg(
    `GH Context event`,
    `GH Action context event ${JSON.stringify(context, null, 2)}`
  )

  const requiredContext: Context = {} as Context
  const full_name = context.payload.repository?.full_name?.split('/') || []
  requiredContext['full_name'] = full_name.join('/')
  requiredContext['owner'] = full_name[0]
  requiredContext['repo'] = full_name[1]
  requiredContext['runId'] = context.runId ? context.runId.toString() : ''
  requiredContext['ref'] = context.ref
  requiredContext['pr'] = context.payload.number
    ? context.payload.number.toString()
    : ''
  requiredContext['commitId'] = context.payload.after
    ? context.payload.after.toString()
    : ''

  return requiredContext
}
