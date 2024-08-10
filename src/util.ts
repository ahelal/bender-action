import * as core from '@actions/core'
import { Context } from './types'

/**
 * Sanitizes a string by replacing all characters except the first and last with asterisks.
 * If the string is empty or null, an empty string is returned.
 * @param str - The string to sanitize.
 * @returns The sanitized string.
 */
export function sanitizeString(str: string): string {
  if (!str) return ''
  return str.length <= 2
    ? str
    : str[0] + '*'.repeat(str.length - 2) + str[str.length - 1]
}

/**
 * Removes timestamps from log strings.
 *
 * @param str - The log string with timestamps.
 * @returns The log string without timestamps.
 */
export function stripTimestampFromLogs(str: string): string {
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{7}Z\s/gm
  return str.replaceAll(regex, '')
}

/**
 * Filters an array of commit files based on status and regular expression filters.
 *
 * @param files - An array of commit files.
 * @param regExFilters - An array of regular expression filters.
 * @returns An array of filtered commit files.
 */
export function filterCommitFiles(
  files: Record<string, string>[],
  regExFilters: string[]
): Record<string, string>[] {
  if (!files || files.length < 1) {
    core.warning('No files found in the response to filter.')
    return []
  }

  const allowedStatus = ['added', 'modified', 'renamed']
  core.info(
    `* PR files (${files.length}): ${files.map(f => f.filename).join(', ')}`
  )

  // filter files based on status
  const filteredFilesStatus = files.filter((f: Record<string, string>) =>
    allowedStatus.includes(f.status)
  )
  if (filteredFilesStatus.length < 1) {
    core.warning('No files found with status added, modified or renamed.')
    return []
  }
  if (regExFilters.length < 1) return filteredFilesStatus

  let filteredFiles: Record<string, string>[] = []
  for (const regEx of regExFilters) {
    filteredFiles = filteredFiles.concat(
      filteredFilesStatus.filter(
        f => f.filename && new RegExp(regEx, 'g').test(f.filename)
      )
    )
  }
  const unqiueFiles = [...new Set(filteredFiles)]
  // loop through the files and print names.
  core.info(
    `* Filtered file (${unqiueFiles.length}): ${unqiueFiles.map(f => f.filename).join(', ')}`
  )
  return unqiueFiles
}

/**
 * Replaces placeholders in a string with corresponding values from a context object.
 *
 * @param str - The string containing placeholders to be replaced.
 * @param context - The context object containing key-value pairs for replacement.
 * @returns The string with placeholders replaced by their corresponding values.
 */
export function interpolateString(str: string, context: Context): string {
  return str.replace(/\${(.*?)}/g, (match, key) => context[key] || match)
}

/**
 * Interpolates values from the given `context` object into the `target` object.
 * If a key in `target` exists in `context`, the corresponding value from `context` is used.
 * Otherwise, the original value from `target` is used.
 *
 * @param target - The target object to interpolate values into.
 * @param context - The context object containing the values to interpolate.
 * @returns A new object with interpolated values.
 */
export function interpolateObject(
  target: Record<string, string> | string | undefined,
  context: Context
): Record<string, string> {
  if (!target) return {}
  const newDic: Record<string, string> = {}
  let targetObj: Record<string, string> = {}
  if (typeof target === 'string') {
    targetObj = JSON.parse(target)
  } else {
    targetObj = target
  }

  for (const [key, value] of Object.entries(targetObj)) {
    if (key in context) {
      newDic[key] = context[key]
    } else {
      newDic[key] = value
    }
  }
  return newDic
}

/**
 * Prints the given message if the debug mode is enabled.
 *
 * @param message - The message to be printed.
 * @returns void
 */
export function rawPrintIfDebug(message: string): void {
  if (core.isDebug()) core.info(message)
}

/**
 * Logs a grouped debug message with a specified title and message.
 *
 * @param title - The title of the debug group.
 * @param message - The message to be logged.
 */
export function debugGroupedMsg(title: string, message: string): void {
  if (core.isDebug()) {
    core.startGroup(title)
    core.debug(message)
    core.endGroup()
  }
}
