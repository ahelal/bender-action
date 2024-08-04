import { OctokitResponse } from '@octokit/types'

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

export { OctokitResponse }
