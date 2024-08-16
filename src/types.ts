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

// export interface Context {
//   [key: string]: string | boolean
// }

export interface Context {
  // Inputs
  mode: string
  ghToken: string
  ghJob: string
  azOpenaiEndpoint: string
  azOpenaiDeployment: string
  azOpenaiKey: string
  azOpenaiVersion: string
  dirContext: string
  jobContext: boolean
  jobContextFile: string
  userContext: string
  include: string[]
  // PayloadContext
  full_name: string
  owner: string
  repo: string
  runId: string
  ref: string
  pr: string
  commitId: string
  // run time
  jobId?: string
}

export interface requestParams {
  method: string
  path: string
  headers?: Record<string, string>
  baseUrl?: string
}

export { OctokitResponse, ChatCompletionMessageParam, ChatCompletion }

/* eslint-disable  @typescript-eslint/no-explicit-any */
export type dataResponse = Record<string, any>
