import { splitComment, filterCommentsInline } from '../src/comments'
import { Context } from '../src/types'

describe('splitComment', () => {
  it('should split comment with line range', () => {
    const comment = '#L10-20 Test comment'
    const result = splitComment(comment)
    expect(result).toEqual({
      start_line: 10,
      end_line: 20,
      comment: 'Test comment'
    })
  })

  it('should split comment without line range', () => {
    const comment = '#L10 Test comment'
    const result = splitComment(comment)
    expect(result).toEqual({
      start_line: 10,
      end_line: 10,
      comment: 'Test comment'
    })
  })

  it('should return empty comment for invalid format', () => {
    const comment = 'Invalid comment format'
    const result = splitComment(comment)
    expect(result).toEqual({
      start_line: -1,
      end_line: 0,
      comment: ''
    })
  })

  it('should return start_line 0 if white space is provided', () => {
    const comment = '  \t \n\r'
    const result = splitComment(comment)
    expect(result).toEqual({
      start_line: 0,
      end_line: 0,
      comment: ''
    })
  })
})

describe('filterCommentsInline', () => {})
it('should return true for relevant comment', () => {
  const comment = {
    user: { login: 'testUser' },
    subject_type: 'line',
    path: 'testFile',
    commit_id: 'testCommitId',
    line: 10
  }
  const files = ['testFile']
  const commitOnly = true
  const context = { login: 'testUser', commitId: 'testCommitId' } as Context
  const result = filterCommentsInline(comment, files, commitOnly, context)
  expect(result).toBe(true)
})

it('should return false for irrelevant comment', () => {
  const comment = {
    user: { login: 'testUser' },
    subject_type: 'line',
    path: 'testFile',
    commit_id: 'testCommitId',
    line: 10
  }
  const files = ['otherFile']
  const commitOnly = true
  const context = { login: 'testUser', commitId: 'testCommitId' } as Context
  const result = filterCommentsInline(comment, files, commitOnly, context)
  expect(result).toBe(false)
})

it('should return false for outdated comment', () => {
  const comment = {
    user: { login: 'testUser' },
    subject_type: 'line',
    path: 'testFile',
    commit_id: 'testCommitId',
    line: null
  }
  const files = ['testFile']
  const commitOnly = true
  const context = { login: 'testUser', commitId: 'testCommitId' } as Context
  const result = filterCommentsInline(comment, files, commitOnly, context)
  expect(result).toBe(false)
})

it('should return false for comment with different commit ID', () => {
  const comment = {
    user: { login: 'testUser' },
    subject_type: 'line',
    path: 'testFile',
    commit_id: 'otherCommitId',
    line: 10
  }
  const files = ['testFile']
  const commitOnly = true
  const context = { login: 'testUser', commitId: 'testCommitId' } as Context
  const result = filterCommentsInline(comment, files, commitOnly, context)
  expect(result).toBe(false)
})
