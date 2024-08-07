import * as core from '@actions/core'
import { wait } from './wait'
import { getInputs, getContextFromPayload } from './inputs'
import { runJobMode } from './mode_job'
import { runPrMode } from './mode_pr'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    let context: Record<string, string> = getInputs()
    const payloadContext = getContextFromPayload()
    context = Object.assign({}, context, payloadContext)
    core.debug(`Context: ${JSON.stringify(context, null, 2)}`)

    await wait(parseInt(context.delay, 10))

    let usage: Promise<string>
    if (context.mode === 'pr') usage = runPrMode(context)
    else if (context.mode === 'job') usage = runJobMode(context)
    else throw new Error(`Invalid mode: ${context.mode}`)
    core.setOutput('usage', usage)
  } catch (error) {
    core.error('An error occurred during the action')
    // Fail the workflow step if an error occurs
    if (error instanceof Error && error !== null) {
      core.error(`\nMessage: ${error.message}`)
      if (error.stack) {
        core.error('\nStacktrace:\n====================')
        core.error(error.stack)
      }
    }
    core.setFailed(error as Error)
  }
}
