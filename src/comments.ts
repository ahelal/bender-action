import { postComment, getComments, getUserInfo } from './github_api'
import { Context, dataResponse } from './types'

// const relevantComments = prComments.filter(
//   comment =>
//     comment.user.login === user.login &&
//     comment.subject_type === 'file' &&
//     comment.commit_id === context.commitId &&
//     files.includes(comment.path)

export async function filterComments(
  comment: dataResponse,
  files: string[],
  context: Context
): Promise<boolean> {
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
  const relevantComments = prComments.filter(
    comment => filterComments(comment, files, context)
    //     comment.user.login === user.login &&
    //     comment.commit_id === context.commitId &&
    //     files.includes(comment.path)
  )
  return relevantComments
}

export async function postReviewComment(
  reply: string,
  file: string,
  context: Context
): Promise<void> {
  await postComment(context.pr, context, {
    body: reply,
    commit_id: context.commitId,
    path: file,
    subject_type: 'file'
  })
}
