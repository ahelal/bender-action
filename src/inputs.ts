import * as core from '@actions/core'

import { decode64 } from './util'
import { Context } from './types'

import { debugGroupedMsg } from './output'

function getBooleanInput(nameOfKey: string, required: boolean): boolean {
  const userInput: string = core.getInput(nameOfKey, { required })
  if (userInput.toLowerCase() === 'true') return true
  if (userInput.toLowerCase() === 'false') return false
  if (userInput.trim() === '') return false
  throw new Error(
    `Invalid input for input '${nameOfKey}': ${userInput} is not a boolean value`
  )
}

function getStringInput(
  nameOfKey: string,
  required: boolean,
  validValues: string[] = []
): string {
  const strInput: string = core
    .getInput(nameOfKey, { required })
    ?.toLocaleLowerCase()

  if (validValues.length === 0) return strInput

  if (validValues.includes(strInput)) return strInput
  throw new Error(
    `Invalid input for '${nameOfKey}': ${strInput} is not a valid value`
  )
}

/**
 * Get predfined action inputs for actions.
 * @returns {Context} Resolves when the action is complete.
 */
export function getInputs(): Context {
  const inputs: Context = {} as Context

  inputs.mode = getStringInput('mode', true, ['pr', 'job'])

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

  inputs.jobContext = getBooleanInput('job-context', false)

  inputs.userContext = core.getInput('user-context', {
    required: false
  })

  inputs.inlineComment = getBooleanInput('inline-comment', false)

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
export async function getContextFromPayload(): Promise<Context> {
  // const contextPayload = context()
  const { context } = await import('@actions/github')
  // const context = require('@actions/github').context
  // const users = await import("./yourModuleThatExportsUsers");
  debugGroupedMsg(
    `GH Context event`,
    `GH Action context event ${JSON.stringify(context, null, 2)}`,
    {} as Context
  )

  const payloadContext: Context = {} as Context
  const full_name = context.payload.repository?.full_name?.split('/') || []

  payloadContext.full_name = full_name.join('/')
  payloadContext.owner = full_name[0] || ''
  payloadContext.repo = full_name[1] || ''
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
