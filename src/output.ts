import * as core from '@actions/core'
import { Context } from './types'
import { MASK_CONTEXT_SECRETS } from './config'

/**
 * Prints the AI response with a formatted title and message.
 *
 * @param title - The title of the AI response.
 * @param message - The message of the AI response. Can be null.
 */
export function outAIReply(title: string, message: string | null): void {
  core.info(
    `${'#'.repeat(6)} [ Bender: ${title} ] ${'#'.repeat(6)}\n${message}\n${'#'.repeat(12)}\n`
  )
}

/**
 * Sanitizes a string by replacing all characters except the first and last with asterisks.
 * If the string is empty or null, an empty string is returned.
 * @param str - The string to sanitize.
 * @returns The sanitized string.
 */
export function sanitizeString(str: string, context: Context): string {
  if (!str) return ''
  let result = str
  for (const secret of MASK_CONTEXT_SECRETS) {
    const valueOfSecret = context[secret as keyof Context] as string
    if (!valueOfSecret) continue

    if (result.includes(valueOfSecret))
      result = result.replaceAll(valueOfSecret, '*x*x**+x')
  }
  return result
}

export function outSantized(
  level: 'info' | 'debug' | 'warning' | 'notice',
  message: string,
  context: Context
): void {
  const sanitizeMessage = sanitizeString(message, context)
  core[level](sanitizeMessage)
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
export function debugGroupedMsg(
  title: string,
  message: string,
  context: Context
): void {
  if (core.isDebug()) {
    core.startGroup(title)
    outSantized('debug', message, context)
    core.endGroup()
  }
}
