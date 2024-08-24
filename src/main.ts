import * as core from '@actions/core'
import { wait } from './wait'
import { getInputs, getContextFromPayload } from './inputs'
import { mainJob } from './mode_job'
import { mainPR } from './mode_pr'
import { debugGroupedMsg } from './output'
import { WAIT_TIME } from './config'
import { Context } from './types'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    let context: Context = getInputs()
    const payloadContext = await getContextFromPayload()
    context = Object.assign({}, context, payloadContext)
    debugGroupedMsg(
      'Context',
      `Context: ${JSON.stringify(context, null, 2)}`,
      context
    )

    await wait(parseInt(WAIT_TIME, 10))

    let usage: Promise<string>
    if (context.mode === 'pr') usage = mainPR(context)
    else if (context.mode === 'job') usage = mainJob(context)
    else throw new Error(`Invalid mode: ${context.mode}`)
    core.setOutput('usage', usage)
  } catch (error) {
    core.error('An unexpected error occurred during the action')
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
