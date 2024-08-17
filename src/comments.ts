import * as core from '@actions/core'
import { postComment, getComments } from './github_api'
import { Context, dataResponse } from './types'
import { printAIResponse } from './util'

/**
 * Filters comments based on specified criteria for inline comments.
 *
 * @param comment - The comment to be filtered.
 * @param files - The list of files to filter comments for.
 * @param commitOnly - Indicates whether to filter comments based on commit ID only.
 * @param context - The context object containing login and commit ID information.
 * @returns A boolean value indicating whether the comment passes the filter.
 */
export function filterCommentsInline(
  comment: dataResponse,
  files: string[],
  commitOnly: boolean,
  context: Context
): boolean {
  if (
    !(
      comment.user.login === context.login &&
      comment.subject_type === 'line' &&
      files.includes(comment.path)
    )
  )
    return false
  if (commitOnly && comment.commit_id !== context.commitId) return false

  // filter out comments that are outdated
  if (comment.line == null) return false
  return true
}

/**
 * Filters the comments based on the provided criteria for file comments.
 *
 * @param comment - The comment to be filtered.
 * @param files - The list of files to compare against.
 * @param context - The context object containing login and commitId.
 * @returns A boolean indicating whether the comment meets the filtering criteria.
 */
export function filterCommentsFiles(
  comment: dataResponse,
  files: string[],
  context: Context
): boolean {
  return (
    comment.user.login === context.login &&
    comment.subject_type === 'file' &&
    comment.commit_id === context.commitId &&
    files.includes(comment.path)
  )
}

/**
 * Retrieves relevant comments based on the provided files and context.
 *
 * @param files - An array of file paths.
 * @param context - The context object containing additional information.
 * @returns A promise that resolves to an array of relevant comments.
 */
export async function getRelevantComments(
  files: string[],
  context: Context
): Promise<dataResponse[]> {
  const prComments = await getComments(context)
  // inline comments
  if (context.inlineComment) {
    return prComments.filter(comment =>
      filterCommentsInline(comment, files, true, context)
    )
  }

  return prComments.filter(comment =>
    filterCommentsFiles(comment, files, context)
  )
}

/**
 * Splits a comment from OpenAI into its start line, end line, and comment text.
 *
 * @param comment - The comment to split.
 * @returns An object containing the start line, end line, and comment text.
 */
export function splitComment(comment: string): {
  start_line: number
  end_line: number
  comment: string
} {
  if (comment.trim().length === 0) {
    return { start_line: 0, end_line: 0, comment: '' }
  }
  const regex = /#L(\d+)(?:-(\d+))?\s(.+)/
  const matches = comment.match(regex)
  if (matches) {
    const startLine = parseInt(matches[1])
    const endLine = matches[2] ? parseInt(matches[2]) : startLine
    const commentText = matches[3]
    return { start_line: startLine, end_line: endLine, comment: commentText }
  } else {
    return { start_line: -1, end_line: 0, comment: '' }
  }
}

export async function postReviewComment(
  reply: string,
  file: string,
  context: Context
): Promise<void> {
  // loop through each line in rely
  // for (const line of reply.split('\n')) {
  //   const lineComment = splitComment(line)
  //   console.log(`YYYYYY Posting comment on ${file} ${line}`, lineComment)
  // }
  // await postComment(context.pr, context, {
  //   body: reply,
  //   commit_id: context.commitId,
  //   path: file,
  //   subject_type: 'file'
  // })
  if (context.inlineComment) {
    core.warning('Inline comment not supported yet')
  } else {
    await postComment(context.pr, context, {
      body: reply,
      commit_id: context.commitId,
      path: file,
      subject_type: 'file'
    })
  }

  if (reply)
    printAIResponse(
      `PR response for ${file}@${context.ref}`,
      JSON.stringify(reply.split('\n'), null, 2)
    )
}
