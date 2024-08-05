import { OctokitResponse } from '@octokit/types'
import {
  ChatCompletionMessageParam,
  ChatCompletion
} from 'openai/resources/chat/completions'

export interface Context {
  [key: string]: string
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

export { OctokitResponse, ChatCompletionMessageParam, ChatCompletion }
