import * as core from '@actions/core'
import { wait } from './wait'
import { getInputs, getContextFromPayload } from './inputs'
import { runJobMode } from './mode_job'

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

    if (context.mode === 'pr') {
      core.warning('PR mode is not supported yet')
      return
    } else if (context.mode === 'job') {
      await wait(parseInt(context.delay, 10))
      const usage = runJobMode(context)
      core.setOutput('usage', usage)
    }
  } catch (error) {
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
