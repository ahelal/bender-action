import {
  ChatCompletionMessageParam,
  ChatCompletion
} from 'openai/resources/chat/completions'

/*eslint import/no-unresolved: [2, { ignore: ['OctokitResponse'] }]*/
import { OctokitResponse } from '@octokit/types/dist-types/OctokitResponse'

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
