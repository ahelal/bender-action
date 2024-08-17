import {
  sanitizeString,
  stripTimestampFromLogs,
  filterCommitFiles,
  decode64,
  stripWordsFromContent
} from '../src/util'

describe('stripWordsFromContent', () => {
  it('should remove specified words from the content', () => {
    const content = 'This is a test string with some words to remove.'
    const words = ['test', 'remove']
    const result = stripWordsFromContent(content, words)
    expect(result).toBe('This is a  string with some words to .')
  })

  it('should remove lines that start with specified words', () => {
    const content = `This is a test string.
Remove this line.
Keep this line.`
    const linesStartWithWord = ['Remove']
    const result = stripWordsFromContent(content, [], linesStartWithWord)
    expect(result).toBe(`This is a test string.
Keep this line.`)
  })

  it('should handle empty strings and arrays', () => {
    const content = ''
    const words: string[] = []
    const linesStartWithWord: string[] = []
    const result = stripWordsFromContent(content, words, linesStartWithWord)
    expect(result).toBe('')
  })

  it('should combine word removal and line removal', () => {
    const content = `This is a test string.
Remove this line.
Keep this line with test word.`
    const words = ['test']
    const linesStartWithWord = ['Remove']
    const result = stripWordsFromContent(content, words, linesStartWithWord)
    expect(result).toBe(`This is a  string.
Keep this line with  word.`)
  })
})

describe('sanitizeString', () => {
  it('should return an empty string for empty input', () => {
    expect(sanitizeString('')).toBe('')
  })

  it('should return the ****** string for input with length <= 6', () => {
    expect(sanitizeString('a')).toBe('******')
    expect(sanitizeString('abcde')).toBe('******')
    expect(sanitizeString('abcdef')).toBe('******')
  })

  it('should replace characters in the middle with asterisks with length >6', () => {
    expect(sanitizeString('hello world')).toBe('h******d')
  })
})

describe('stripTimestampFromLogs', () => {
  it('should remove timestamps from log strings', () => {
    const logString = '2022-01-01T00:00:00.0000000Z Log message'
    expect(stripTimestampFromLogs(logString)).toBe('Log message')
  })
})

describe('filterCommitFiles', () => {
  const files = [
    { filename: 'file1.txt', status: 'added' },
    { filename: 'file2.txt', status: 'modified' },
    { filename: 'file3.txt', status: 'renamed' },
    { filename: 'file4.txt', status: 'deleted' }
  ]

  it('should return an empty array if no files are provided', () => {
    expect(filterCommitFiles([], [])).toEqual([])
  })

  it('should return an empty array if no files match the allowed status', () => {
    expect(
      filterCommitFiles([{ filename: 'file1.txt', status: 'deleted' }], [])
    ).toEqual([])
  })

  it('should return the filtered files based on status', () => {
    expect(filterCommitFiles(files, [])).toEqual([
      { filename: 'file1.txt', status: 'added' },
      { filename: 'file2.txt', status: 'modified' },
      { filename: 'file3.txt', status: 'renamed' }
    ])
  })

  it('should return all files if no expression filters is provided', () => {
    expect(filterCommitFiles(files, [])).toEqual([
      { filename: 'file1.txt', status: 'added' },
      { filename: 'file2.txt', status: 'modified' },
      { filename: 'file3.txt', status: 'renamed' }
    ])
  })

  it('should return the filtered files based on filters', () => {
    expect(filterCommitFiles(files, ['file1'])).toEqual([
      { filename: 'file1.txt', status: 'added' }
    ])
    expect(filterCommitFiles(files, ['file2', 'file3'])).toEqual([
      { filename: 'file2.txt', status: 'modified' },
      { filename: 'file3.txt', status: 'renamed' }
    ])
  })

  it('should return the filtered files based on advanced filters', () => {
    const realFiles = [
      { filename: '.github/workflows/bender-pr.yml', status: 'added' },
      { filename: 'README.md', status: 'added' },
      { filename: 'action.yml', status: 'added' },
      { filename: 'dist/index.js', status: 'modified' },
      { filename: 'dist/index.js.map', status: 'modified' },
      { filename: 'src/config.ts', status: 'renamed' },
      { filename: 'src/util.ts', status: 'added' },
      { filename: 'src/test.py', status: 'added' },
      { filename: 'imgs/.file1.jpg', status: 'added' },
      { filename: 'imgs/.file2.jpg', status: 'added' }
    ]
    expect(filterCommitFiles(realFiles, ['src*.ts'])).toEqual([
      { filename: 'src/config.ts', status: 'renamed' },
      { filename: 'src/util.ts', status: 'added' }
    ])
    expect(filterCommitFiles(realFiles, ['src*', '*.md'])).toEqual([
      { filename: 'src/config.ts', status: 'renamed' },
      { filename: 'src/util.ts', status: 'added' },
      { filename: 'src/test.py', status: 'added' },
      { filename: 'README.md', status: 'added' }
    ])

    expect(filterCommitFiles(realFiles, ['.*file*'])).toEqual([
      { filename: 'imgs/.file1.jpg', status: 'added' },
      { filename: 'imgs/.file2.jpg', status: 'added' }
    ])
  })

  it('should return the filtered files based on multiple expression filters', () => {
    const realFiles = [
      { filename: '.github/workflows/bender-pr.yml', status: 'added' },
      { filename: 'README.md', status: 'added' },
      { filename: 'action.yml', status: 'added' },
      { filename: 'dist/index.js', status: 'modified' },
      { filename: 'dist/index.js.map', status: 'modified' },
      { filename: 'src/config.ts', status: 'renamed' },
      { filename: 'src/util.ts', status: 'added' },
      { filename: 'src/test.py', status: 'added' },
      { filename: 'imgs/.file1.jpg', status: 'added' },
      { filename: 'imgs/.file2.jpg', status: 'added' },
      { filename: 'src/file.java', status: 'added' },
      { filename: 'src/file.py', status: 'added' }
    ]
    // 'src*.ts;*.py;*.jpg'
    expect(filterCommitFiles(realFiles, ['*.py', '*.jpg'])).toEqual([
      { filename: 'src/test.py', status: 'added' },
      { filename: 'src/file.py', status: 'added' },
      { filename: 'imgs/.file1.jpg', status: 'added' },
      { filename: 'imgs/.file2.jpg', status: 'added' }
    ])
  })
})

describe('decode64', () => {
  it('should decode the base64 string and return the decoded string', () => {
    const base64String = 'SGVsbG8gd29ybGQ='
    const decodedString = 'Hello world'
    expect(decode64(base64String, 'file.txt')).toBe(decodedString)
  })

  it('should return a space character if the base64 string is empty', () => {
    const base64String = ''
    expect(decode64(base64String, 'file.txt')).toBe(' ')
  })

  it('should throw an error if there is an issue decoding the base64 string', () => {
    const base64String = 'adasd'
    const fileRef = 'file.txt'
    expect(() => {
      decode64(base64String, fileRef)
    }).toThrow('error while decoding base64 string')
  })
})
