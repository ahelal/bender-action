import * as core from '@actions/core'
import { context } from '@actions/github'
import { decode64 } from './util'
import { Context } from './types'
import { debugGroupedMsg } from './output'

export function validateInputAsBoolean(
  nameOfKey: string,
  userInput: string
): boolean {
  if (userInput.toLowerCase() === 'true') return true
  if (userInput.toLowerCase() === 'false') return false
  if (userInput.trim() === '') return false
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
  // value selectopm for mode
  // dynamic required based on mode

  // input decode for dirContext

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

  inputs.azOpenaiKey = core.getInput('az-openai-key', {
    required: true
  })

  inputs.azOpenaiVersion = core.getInput('az-openai-apiVersion', {
    required: true
  })

  inputs.dirContext = core.getInput('dir-context', {
    required: false
  })

  if (inputs.dirContext.length > 0)
    inputs.dirContext = decode64(
      inputs.dirContext,
      "GH action input 'dirContext'"
    )

  inputs.jobContext = validateInputAsBoolean(
    'jobContext',
    core.getInput('job-context', {
      required: false
    })
  )

  inputs.userContext = core.getInput('user-context', {
    required: false
  })

  inputs.inlineComment = validateInputAsBoolean(
    'inline-comment',
    core.getInput('inline-comment', {
      required: false
    })
  )

  inputs.include = core
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
    `GH Action context event ${JSON.stringify(context, null, 2)}`,
    {} as Context
  )

  const payloadContext: Context = {} as Context
  const full_name = context.payload.repository?.full_name?.split('/') || []
  payloadContext.full_name = full_name.join('/')
  payloadContext.owner = full_name[0]
  payloadContext.repo = full_name[1]
  payloadContext.runId = context.runId ? context.runId.toString() : ''
  payloadContext.pr = context.payload.number?.toString() || ''
  payloadContext.action = context.payload.action || ''
  if (
    payloadContext.action === 'synchronize' ||
    payloadContext.action === 'opened'
  ) {
    payloadContext.commitId = context.payload.pull_request?.head.sha || ''
  } else {
    payloadContext.commitId = context.payload.after?.toString() || ''
  }
  payloadContext.ref = context.ref || payloadContext.commitId

  return payloadContext
}
