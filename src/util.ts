import * as core from '@actions/core'
import { Context } from './types'
import {
  MAX_INPUT_LOG_LENGTH,
  MAX_INPUT_FILES_LENGTH,
  MAX_REGEX_PATTERNS,
  MAX_REGEX_CHARS
} from './config'

/**
 * Sanitizes a string by replacing all characters except the first and last with asterisks.
 * If the string is empty or null, an empty string is returned.
 * @param str - The string to sanitize.
 * @returns The sanitized string.
 */
export function sanitizeString(str: string): string {
  if (!str) return ''
  return str.length <= 6 ? '******' : `${str[0]}******${str[str.length - 1]}`
}

/**
 * Removes timestamps from log strings.
 *
 * @param str - The log string with timestamps.
 * @returns The log string without timestamps.
 */
export function stripTimestampFromLogs(str: string): string {
  if (str.length > MAX_INPUT_LOG_LENGTH) {
    throw new Error('Input string is too long')
  }
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{7}Z\s/gm
  return str.replaceAll(regex, '')
}

/**
 * Filters an array of commit files based on status and regular expression filters.
 *
 * @param files - An array of commit files.
 * @param regexFilters - An array of regular expression filters.
 * @returns An array of filtered commit files.
 */
export function filterCommitFiles(
  files: Record<string, string>[],
  regexFilters: string[]
): Record<string, string>[] {
  if (!files || files.length < 1) {
    core.warning('No files found in the response to filter.')
    return []
  }

  filterValidateInput(files, regexFilters)

  const filteredFilesStatus = filterByStatus(files)
  if (filteredFilesStatus.length < 1) {
    core.warning('No files found with status added, modified or renamed.')
    return []
  }

  const filteredFiles =
    regexFilters.length > 0
      ? filterByRegex(filteredFilesStatus, regexFilters)
      : filteredFilesStatus

  // Remove duplicates
  const uniqueFiles = [...new Set(filteredFiles)]

  if (uniqueFiles.length < 1) {
    core.warning(
      `No files found in the PR, that match the regEx filter '${uniqueFiles}'`
    )
  } else {
    core.info(
      `* Filtered file (${uniqueFiles.length}): ${uniqueFiles.map(f => f.filename).join(', ')}`
    )
  }
  return uniqueFiles
}

function filterValidateInput(
  files: Record<string, string>[],
  regexFilters: string[]
): void {
  const totalFilenameLength = files
    .map(f => f.filename.length)
    .reduce((sum, len) => sum + len, 0)
  if (totalFilenameLength > MAX_INPUT_FILES_LENGTH) {
    throw new Error(
      `Input filenames array is too long over ${MAX_INPUT_FILES_LENGTH}`
    )
  }

  if (regexFilters.length > MAX_REGEX_PATTERNS) {
    throw new Error(
      `Too many regex patterns max limit is ${MAX_REGEX_PATTERNS}`
    )
  }
}

function filterByStatus(
  files: Record<string, string>[]
): Record<string, string>[] {
  const allowedStatus = ['added', 'modified', 'renamed']
  core.info(
    `* PR files (${files.length}): ${files.map(f => f.filename).join(', ')}`
  )
  return files.filter(f => allowedStatus.includes(f.status))
}

function regTest(regexStr: string, testString: string): boolean {
  if (!testString) return false
  if (regexStr.length > MAX_REGEX_CHARS) {
    console.warn(`Regex pattern is too long over ${MAX_REGEX_CHARS}`)
    return false
  }
  const sanitizedRegex = sanitizeRegex(regexStr)
  if (sanitizedRegex !== regexStr) {
    console.warn(`Regex pattern has illegal expersion ${sanitizedRegex}`)
  }
  return new RegExp(sanitizeRegex(regexStr), 'g').test(testString)
}

/**
 * Sanitizes a string to be used in a regular expression by escaping special characters.
 * @param input - The string to be sanitized.
 * @returns The sanitized string.
 */
function sanitizeRegex(input: string): string {
  const sanitized = input
    .replace(/[+?^${}()|[\]\\.]/g, '\\$&')
    .replace(/\*/g, '.*')
  return sanitized
}

function filterByRegex(
  files: Record<string, string>[],
  regexFilters: string[]
): Record<string, string>[] {
  let filteredFiles: Record<string, string>[] = []
  for (const regEx of regexFilters) {
    filteredFiles = filteredFiles.concat(
      files.filter(f => regTest(regEx, f.filename))
    )
  }
  return filteredFiles
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
