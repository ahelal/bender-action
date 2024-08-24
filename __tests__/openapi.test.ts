import {
  setupInitialMessageJob,
  setupInitialMessagePr
} from '../src/openai_api'
import {
  githubActionFailurePrompt,
  githubActionSecurityPrompt
} from '../src/openai_prompts'
import { Context } from '../src/types'

jest.mock('@actions/core')

describe('setupInitialMessageJob', () => {
  it('should return correct messages with minimal context', () => {
    const context: Context = {} as Context
    const jobLog = 'Sample job log'
    const messages = setupInitialMessageJob(context, jobLog)
    expect(messages).toEqual([
      { role: 'system', content: githubActionFailurePrompt },
      {
        role: 'user',
        content: `Github Action log that failed:\n"""${jobLog}\n"""\n`
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
    const messages = setupInitialMessageJob(context, jobLog)
    expect(messages).toEqual([
      { role: 'system', content: githubActionFailurePrompt },
      {
        role: 'user',
        content: `Github Action log that failed:\n"""${jobLog}\n"""\nGitHub Action job yaml:\n"""${context.jobContextFile}\n"""\nProject Directory structure:\n"""${context.dirContext}\n"""\nExtra user context:\n"""${context.userContext}\n"""\n`
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
      {
        role: 'user',
        content: `Source code/Diff. File path '${filePath}':\n\n"""${diffText}\n"""\n`
      }
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
        content: `Source code/Diff. File path '${filePath}':\n\n"""${diffText}\n"""\nProject Directory structure:\n"""${context.dirContext}\n"""\nExtra user context:\n"""${context.userContext}\n"""\n`
      }
    ])
  })
})
