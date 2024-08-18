import { setupInitialMessage, setupInitialMessagePr } from '../src/openai_api'
import {
  githubActionFailurePrompt,
  githubActionSecurityPrompt
} from '../src/openai_prompts'
import { Context } from '../src/types'

jest.mock('@actions/core')

describe('setupInitialMessage', () => {
  it('should return correct messages with minimal context', () => {
    const context: Context = {} as Context
    const jobLog = 'Sample job log'
    const messages = setupInitialMessage(context, jobLog)

    expect(messages).toEqual([
      { role: 'system', content: githubActionFailurePrompt },
      {
        role: 'user',
        content: `Github Action log that failed:\n---\n${jobLog}\n`
      }
    ])
  })

  it('should return correct messages with full context', () => {
    const context: Context = {
      jobContext: true,
      jobContextFile: 'job context file',
      dirContext: 'dir context',
      userContext: 'Sample user context'
    } as Context
    const jobLog = 'Sample job log'
    const messages = setupInitialMessage(context, jobLog)

    expect(messages).toEqual([
      { role: 'system', content: githubActionFailurePrompt },
      {
        role: 'user',
        content: `Github Action log that failed:\n---\n${jobLog}\nGitHub Action job definition yaml:\n---\n${context.jobContextFile}\nDirectory structure of project:\n---\n${context.dirContext})\nExtra user context:\n---\n${context.userContext}\n`
      }
    ])
  })
})

describe('setupInitialMessagePr', () => {
  it('should return correct messages with minimal context', () => {
    const context = {} as Context
    const diffText = 'Sample diff text'
    const filePath = 'path/to/file'
    const messages = setupInitialMessagePr(context, diffText, filePath)

    expect(messages).toEqual([
      { role: 'system', content: githubActionSecurityPrompt },
      { role: 'user', content: `${filePath} diff:\n---\n${diffText}\n` }
    ])
  })

  it('should return correct messages with full context', () => {
    const context = {
      dirContext: 'Sample dir context',
      userContext: 'Sample user context'
    } as Context
    const diffText = 'Sample diff text'
    const filePath = 'path/to/file'
    const messages = setupInitialMessagePr(context, diffText, filePath)

    expect(messages).toEqual([
      { role: 'system', content: githubActionSecurityPrompt },
      {
        role: 'user',
        content: `${filePath} diff:\n---\n${diffText}\nDirectory structure of project:\n---\n${context.dirContext})\nExtra user context:\n---\n${context.userContext}\n`
      }
    ])
  })
})
