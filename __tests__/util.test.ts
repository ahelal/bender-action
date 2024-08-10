import { Context } from '../src/types'
import {
  sanitizeString,
  stripTimestampFromLogs,
  filterCommitFiles,
  interpolateString,
  interpolateObject
} from '../src/util'

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

  it('should return the filtered files based on regular expression filters', () => {
    expect(filterCommitFiles(files, ['file1'])).toEqual([
      { filename: 'file1.txt', status: 'added' }
    ])
    expect(filterCommitFiles(files, ['file2', 'file3'])).toEqual([
      { filename: 'file2.txt', status: 'modified' },
      { filename: 'file3.txt', status: 'renamed' }
    ])
  })
})

describe('interpolateString', () => {
  const context: Context = {
    key1: 'value1',
    key2: 'value2'
  }

  it('should replace placeholders with corresponding values from the context', () => {
    const str = 'This is ${key1} and ${key2}'
    expect(interpolateString(str, context)).toBe('This is value1 and value2')
  })

  it('should leave placeholders unchanged if corresponding values are not found in the context', () => {
    const str = 'This is ${key1} and ${key3}'
    expect(interpolateString(str, context)).toBe('This is value1 and ${key3}')
  })
})

describe('interpolateObject', () => {
  const context: Context = {
    key1: 'value1',
    key2: 'value2'
  }

  it('should return an empty object if the target is undefined', () => {
    expect(interpolateObject(undefined, context)).toEqual({})
  })

  it('should interpolate values from the context into the target object', () => {
    const target = {
      key1: '${key1}',
      key2: '${key2}',
      key3: 'value3'
    }
    expect(interpolateObject(target, context)).toEqual({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3'
    })
  })

  it('should leave values unchanged if corresponding keys are not found in the context', () => {
    const target = {
      key1: '${key1}',
      key2: '${key3}',
      key3: 'value3'
    }
    expect(interpolateObject(target, context)).toEqual({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3'
    })
  })
})
