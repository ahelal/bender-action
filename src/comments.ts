import { postComment, getComments } from './github_api'
import { Context, dataResponse } from './types'

// const relevantComments = prComments.filter(
//   comment =>
//     comment.user.login === user.login &&
//     comment.subject_type === 'file' &&
//     comment.commit_id === context.commitId &&
//     files.includes(comment.path)

export function filterComments(
  comment: dataResponse,
  files: string[],
  context: Context
): boolean {
  if (
    // filter out comments that are not from the user, not on the commit, or not on the files, or not on the line
    !(
      comment.user.login === context.login &&
      comment.commit_id === context.commitId &&
      comment.subject_type === 'line' &&
      files.includes(comment.path)
    )
  )
    return false
  // filter out comments that are outdated
  if (comment.line == null) return false
  return true
}

export async function getRelevantComments(
  files: string[],
  context: Context
): Promise<dataResponse[]> {
  const prComments = await getComments(context)
  const relevantComments = prComments.filter(comment =>
    filterComments(comment, files, context)
  )
  return relevantComments
}

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
  console.log('YYYYYYY ', reply.split('\n'))
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
}
