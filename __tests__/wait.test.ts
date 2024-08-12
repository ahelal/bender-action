import { wait } from '../src/wait'
import { expect } from '@jest/globals'

describe('psudo test', () => {
  it('should pass', () => {
    expect(1).toBe(1)
  })
})

describe('wait.ts', () => {
  it('waits with a valid number', async () => {
    const start = new Date()
    await wait(1)
    const end = new Date()

    const delta = Math.abs(end.getTime() - start.getTime())

    expect(delta).toBeGreaterThan(950)
  })
})
