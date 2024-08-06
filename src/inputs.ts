import * as core from '@actions/core'
// import * as github from '@actions/github'
import { context } from '@actions/github'

const allowedModes = ['pr', 'job']
/**
 * Get predfined action inputs for actions.
 * @returns {Record<string, string>} Resolves when the action is complete.
 */
export function getInputs(): Record<string, string> {
  const inputs: Record<string, string> = {}
  inputs['mode'] = core.getInput('mode', { required: true })
  if (!allowedModes.includes(inputs['mode'])) {
    throw new Error(`Invalid mode: ${inputs['mode']}`)
  }

  inputs['ghToken'] = core.getInput('gh-token', { required: false })

  inputs['ghJob'] = core.getInput('gh-job', {
    required: false
  })

  inputs['azOpenaiEndpoint'] = core.getInput('az-openai-endpoint', {
    required: true
  })

  inputs['azOpenaiDeployment'] = core.getInput('az-openai-deployment', {
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

  inputs['jobContext'] = core.getInput('job-context', {
    required: false
  })

  inputs['userContext'] = core.getInput('user-context', {
    required: false
  })

  inputs['delay'] = core.getInput('delay', {
    required: true
  })

  return inputs
}
/**
 * Get context from githubaction payload and return required context.
 * @returns {Record<string, string>} Resolves when the action is complete.
 */

export function getContextFromPayload(): Record<string, string> {
  core.debug(`GIT Payload: ${JSON.stringify(context.payload, null, 2)}`)

  const requiredContext: Record<string, string> = {}
  const full_name = context.payload.repository?.full_name?.split('/') || []
  requiredContext['full_name'] = full_name.join('/')
  requiredContext['owner'] = full_name[0]
  requiredContext['repo'] = full_name[1]
  requiredContext['runId'] = context.runId.toString()
  requiredContext['ref'] = context.ref

  return requiredContext
}
