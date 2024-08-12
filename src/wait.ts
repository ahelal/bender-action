import * as core from '@actions/core'
/**
 * Wait for a number of seconds.
 * @param seconds The number of seconds to wait.
 * @returns {void} Resolves with 'done!' after the wait is over.
 */
export async function wait(seconds: number): Promise<void> {
  core.info(`* Waiting for ${seconds} seconds.`)
  return new Promise(resolve => {
    setTimeout(() => resolve(), seconds * 1000)
  })
}
