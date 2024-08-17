import { splitComment } from '../src/comments'

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
