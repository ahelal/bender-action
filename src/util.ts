import * as core from '@actions/core'
import {
  MAX_INPUT_LOG_LENGTH,
  MAX_INPUT_FILES_LENGTH,
  MAX_REGEX_PATTERNS,
  MAX_REGEX_CHARS
} from './config'

/**
 * Removes specified words from a given string and removes lines that start with specified words.
 *
 * @param str - The input string.
 * @param words - An array of words to be removed from the string. Default is an empty array.
 * @param linesStartWithWord - An array of words that indicate the start of lines to be removed from the string. Default is an empty array.
 * @returns The modified string after removing the specified words and lines.
 */
export function stripWordsFromContent(
  str: string,
  words: string[] = [],
  linesStartWithWord: string[] = []
): string {
  let result = str
  for (const word of words) {
    result = result.replaceAll(word, '')
  }
  for (const lineStartWithWord of linesStartWithWord) {
    const regex = new RegExp(`^${lineStartWithWord}.*\n`, 'gm')
    result = result.replaceAll(regex, '')
  }
  return result
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
      `No files found in the PR, that match the regEx filter '${regexFilters}'`
    )
  } else {
    core.info(
      `* Filtered file (${uniqueFiles.length}): ${uniqueFiles.map(f => f.filename).join(', ')}`
    )
  }
  return uniqueFiles
}

/**
 * Validates the input files and regex filters.
 *
 * @param files - An array of objects representing the files to be validated.
 * @param regexFilters - An array of regex patterns to be applied for filtering.
 * @throws {Error} If the total length of filenames exceeds the maximum limit.
 * @throws {Error} If the number of regex patterns exceeds the maximum limit.
 */
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

/**
 * Filters an array of files based on allowed diff status only added, modified and renamed.
 *
 * @param files - The array of files to filter.
 * @returns The filtered array of files.
 */
function filterByStatus(
  files: Record<string, string>[]
): Record<string, string>[] {
  const allowedStatus = ['added', 'modified', 'renamed']
  core.info(
    `* PR files (${files.length}): ${files.map(f => f.filename).join(', ')}`
  )
  return files.filter(f => allowedStatus.includes(f.status))
}

/**
 * Tests if a given string matches a regular expression pattern.
 *
 * @param regexStr - The regular expression pattern to test.
 * @param testString - The string to test against the regular expression pattern.
 * @returns A boolean indicating whether the test string matches the regular expression pattern.
 */
function regTest(regexStr: string, testString: string): boolean {
  if (!testString) return false
  if (regexStr.length > MAX_REGEX_CHARS) {
    console.warn(`Regex pattern is too long over ${MAX_REGEX_CHARS}`)
    return false
  }
  const sanitizedRegex = sanitizeRegex(regexStr)
  if (sanitizedRegex !== regexStr)
    console.warn(
      `Regex pattern has illegal expersion, '${sanitizedRegex}' != '${regexStr}'`
    )
  const regResult = new RegExp(sanitizedRegex, 'g').test(testString)
  return regResult
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

/**
 * Filters an array of files based on an array of regular expressions.
 *
 * @param files - The array of files to be filtered.
 * @param regexFilters - The array of regular expressions to filter the files.
 * @returns The filtered array of files.
 */
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
 * Decodes a base64 string.
 *
 * @param str - The base64 string to decode.
 * @param fileRef - The reference to the file being decoded.
 * @returns The decoded string.
 * @throws An error if there is an issue decoding the base64 string.
 */
export function decode64(str: string, fileRef: string): string {
  if (!str || str.length === 0) return ' '
  try {
    return atob(str)
  } catch (e) {
    throw new Error(
      `error while decoding base64 string when attempting to decode ${fileRef}. ${e}`
    )
  }
}
