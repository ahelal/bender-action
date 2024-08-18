import { sanitizeString } from '../src/output'
import { Context } from '../src/types'

// ghToken: string
// azOpenaiDeployment: string
// azOpenaiKey: string
describe('sanitizeString', () => {
  it('should sanitize the string if it does not contain any secrets', () => {
    const context = {
      ghToken: 'secret1',
      azOpenaiKey: 'secret2',
      azOpenaiDeployment: 'secret3'
    } as Context

    expect(sanitizeString('Hi\n$secret1$', context)).toBe('Hi\n$*x*x**+x$')
    expect(sanitizeString('12345secret267', context)).toBe('12345*x*x**+x67')
    expect(sanitizeString('abc123 secret2', context)).toBe('abc123 *x*x**+x')
    expect(sanitizeString('secret1', context)).toBe('*x*x**+x')
    expect(sanitizeString('secret1secret3', context)).toBe('*x*x**+x*x*x**+x')
  })

  it('should not sanitize the string if it does not contain any secrets', () => {
    const context = {
      ghToken: 'secret1',
      azOpenaiKey: 'secret2'
    } as Context

    expect(sanitizeString('Hello\nWorld 2', context)).toBe('Hello\nWorld 2')
    expect(sanitizeString('1234567890', context)).toBe('1234567890')
    expect(sanitizeString('abc123 secert 2', context)).toBe('abc123 secert 2')
    expect(sanitizeString('', context)).toBe('')
    expect(sanitizeString('    ', context)).toBe('    ')
  })
})
