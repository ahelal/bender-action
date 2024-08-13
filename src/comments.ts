import { postComment, getComments, getUserInfo } from './github_api'
import { Context, dataResponse } from './types'

export async function getRelevantComments(
  files: string[],
  context: Context
): Promise<dataResponse[]> {
  const user = await getUserInfo(context)
  const prComments = await getComments(context)
  const relevantComments = prComments.filter(
    comment =>
      comment.user.login === user.login &&
      comment.subject_type === 'file' &&
      comment.commit_id === context.commitId &&
      files.includes(comment.path)
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
