import {
  ChatCompletionMessageParam,
  ChatCompletion
} from 'openai/resources/chat/completions'

/*eslint import/no-unresolved: [2, { ignore: ['OctokitResponse'] }]*/
import { OctokitResponse } from '@octokit/types/dist-types/OctokitResponse'

export interface CompletionUsage {
  completion_tokens: number
  prompt_tokens: number
  total_tokens: number
}

export interface Context {
  [key: string]: string
}

export interface requestParams {
  method: string
  path: string
  headers?: Record<string, string>
  payload?: string
  baseUrl?: string
}

// interface Context {
//   jobContext?: string
//   dirContext?: string
//   userContext?: string
//   azOpenaiDeployment: string
//   azOpenaiVersion: string
//   azOpenaiKey: string
//   azOpenaiEndpoint: string
// }

// export interface Message {
//   role: string
//   content: string
// }

import parseDiff from 'parse-diff'

export {
  OctokitResponse,
  ChatCompletionMessageParam,
  ChatCompletion,
  parseDiff
}
