import * as core from '@actions/core'
import { ChatCompletionMessageParam, ChatCompletion, Context } from './types'
import { AzureOpenAI } from 'openai'
import {
  githubActionFailurePrompt,
  githubActionSecurityPrompt
} from './openai_prompts'
import { maxTokens } from './config'
import { debugGroupedMsg } from './util'

function setupInitialMessage(
  context: Context,
  jobLog: string
): ChatCompletionMessageParam[] {
  const systemMessage: ChatCompletionMessageParam = {
    role: 'system',
    content: githubActionFailurePrompt
  }

  let userMessageStr = `Github Action log that failed:\n---\n${jobLog}\n`

  if (context.jobContext) {
    userMessageStr = `${userMessageStr}GitHub Action job definition yaml:\n---\n${context.jobContextFile}\n`
  }

  if (context.dirContext) {
    userMessageStr = `${userMessageStr}Directory structure of project:\n---\n${context.dirContext})\n`
  }

  if (context.userContext) {
    userMessageStr = `${userMessageStr}Extra user context:\n---\n${context.userContext}\n`
  }

  core.debug(
    `Job definition context: '${!!context.jobContext}' Dir context: '${!!context.dirContext}' User context: '${!!context.userContext}'`
  )
  const userMessage: ChatCompletionMessageParam = {
    role: 'user',
    content: userMessageStr
  }

  return [systemMessage, userMessage]
}

function setupInitialMessagePr(
  context: Context,
  diffText: string,
  filePath: string
): ChatCompletionMessageParam[] {
  const systemMessage: ChatCompletionMessageParam = {
    role: 'system',
    content: githubActionSecurityPrompt
  }

  let userMessageStr = `${filePath} diff:\n---\n${diffText}\n`

  if (context.dirContext) {
    userMessageStr = `${userMessageStr}Directory structure of project:\n---\n${context.dirContext})\n`
  }

  if (context.userContext) {
    userMessageStr = `${userMessageStr}Extra user context:\n---\n${context.userContext}\n`
  }

  core.debug(
    `Job definition context: '${!!context.jobContext}' Dir context: '${!!context.dirContext}' User context: '${!!context.userContext}'`
  )
  const userMessage: ChatCompletionMessageParam = {
    role: 'user',
    content: userMessageStr
  }

  return [systemMessage, userMessage]
}

async function openAiRequest(
  message: ChatCompletionMessageParam[],
  context: Context
): Promise<ChatCompletion> {
  const {
    azOpenaiDeployment: deployment,
    azOpenaiVersion: apiVersion,
    azOpenaiKey: apiKey,
    azOpenaiEndpoint: endpoint
  } = context

  core.info(`* Request response from Azure OpenAI`)
  debugGroupedMsg(
    'Azure OpenAI Message',
    `Message: ${JSON.stringify(message, null, 2)}`
  )

  const client = new AzureOpenAI({ apiKey, endpoint, deployment, apiVersion })
  const response = await client.chat.completions.create({
    messages: message,
    model: '',
    max_tokens: maxTokens,
    stream: false
  })

  debugGroupedMsg(
    'Azure OpenAI response',
    `HTTP Response: ${JSON.stringify(response, null, 2)}`
  )

  return response
}

export { openAiRequest, setupInitialMessage, setupInitialMessagePr }
