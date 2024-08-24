import * as core from '@actions/core'
import { ChatCompletionMessageParam, ChatCompletion, Context } from './types'
import { AzureOpenAI } from 'openai'
import {
  githubActionFailurePrompt,
  githubActionSecurityPrompt
} from './openai_prompts'
import { MAX_TOKENS } from './config'
import { debugGroupedMsg } from './output'

export function setupInitialMessageJob(
  context: Context,
  logs: string
): ChatCompletionMessageParam[] {
  const systemMessage: ChatCompletionMessageParam = {
    role: 'system',
    content: githubActionFailurePrompt
  }
  const jobLogs = `Github Action log that failed:\n"""${logs}\n"""\n`
  const jobContext = context.jobContext
    ? `GitHub Action job yaml:\n"""${context.jobContextFile}\n"""\n`
    : ''
  const dirContext = context.dirContext
    ? `Project Directory structure:\n"""${context.dirContext}\n"""\n`
    : ''
  const userContext = context.userContext
    ? `Extra user context:\n"""${context.userContext}\n"""\n`
    : ''
  const userMessageStr = `${jobLogs}${jobContext}${dirContext}${userContext}`

  core.debug(
    `Job definition context: '${context.jobContext}' Dir context: '${!!context.dirContext}' User context: '${!!context.userContext}'`
  )
  const userMessage: ChatCompletionMessageParam = {
    role: 'user',
    content: userMessageStr
  }

  return [systemMessage, userMessage]
}

export function setupInitialMessagePr(
  context: Context,
  diffText: string,
  filePath: string
): ChatCompletionMessageParam[] {
  const systemMessage: ChatCompletionMessageParam = {
    role: 'system',
    content: githubActionSecurityPrompt
  }

  const sourceCode = `Source code/Diff. File path '${filePath}':\n\n"""${diffText}\n"""\n`

  const dirContext = context.dirContext
    ? `Project Directory structure:\n"""${context.dirContext}\n"""\n`
    : ''

  const userContext = context.userContext
    ? `Extra user context:\n"""${context.userContext}\n"""\n`
    : ''

  const userMessageStr = `${sourceCode}${dirContext}${userContext}`

  core.debug(
    `PR  context: Dir context: '${!!context.dirContext}' User context: '${!!context.userContext}'`
  )

  const userMessage: ChatCompletionMessageParam = {
    role: 'user',
    content: userMessageStr
  }

  return [systemMessage, userMessage]
}

export async function openAiRequest(
  message: ChatCompletionMessageParam[],
  context: Context
): Promise<ChatCompletion> {
  const {
    azOpenaiDeployment: deployment,
    azOpenaiVersion: apiVersion,
    azOpenaiKey: apiKey,
    azOpenaiEndpoint: endpoint
  } = context

  const payloadStr = JSON.stringify(message)

  core.info(
    `* Request response from Azure OpenAI [Chars: '${payloadStr.length}' Lines: '${payloadStr.split('\n').length}' ~Tokens: '${payloadStr.length / 4}']`
  )
  debugGroupedMsg(
    'Azure OpenAI Message',
    `Message: ${JSON.stringify(message, null, 2)}`,
    context
  )

  const client = new AzureOpenAI({ apiKey, endpoint, deployment, apiVersion })
  const response = await client.chat.completions.create({
    messages: message,
    model: '',
    max_tokens: MAX_TOKENS,
    stream: false
  })

  debugGroupedMsg(
    'Azure OpenAI response',
    `HTTP Response: ${JSON.stringify(response, null, 2)}`,
    context
  )

  return response
}
