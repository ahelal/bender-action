import { doRequest } from '../src/gh_requests'
import { getUserInfo, getComments, getCommitFiles } from '../src/gh_api'
import { Context } from '../src/types'

jest.mock('../src/gh_requests', () => ({
  doRequest: jest.fn()
}))

// params: requestParams,
// context: Context,
describe('Github API', () => {
  beforeAll(() => {
    jest.clearAllMocks()
  })

  test('Get UserContext', async () => {
    const context = { ghToken: 'test' } as Context
    const mockResponse = {
      data: {
        login: 'octocat'
      },
      status: 200
    }
    ;(doRequest as jest.Mock).mockResolvedValue(mockResponse)
    const response = await Promise.resolve(getUserInfo(context))
    expect(doRequest).toHaveBeenCalledTimes(1)
    expect(doRequest).toHaveBeenCalledWith(
      { method: 'GET', path: '/user' },
      context
    )
    expect(response).toEqual(mockResponse.data)
  })

  test('Get Comments', async () => {
    const context = {
      owner: 'ahelal',
      repo: 'action',
      pr: '4',
      ghToken: 'test'
    } as Context
    const mockResponse = {
      data: {
        login: 'octocat'
      },
      status: 200
    }
    ;(doRequest as jest.Mock).mockResolvedValue(mockResponse)
    const response = await Promise.resolve(getComments(context))
    expect(doRequest).toHaveBeenCalledTimes(1)
    expect(doRequest).toHaveBeenCalledWith(
      { method: 'GET', path: '/repos/ahelal/action/pulls/4/comments' },
      context
    )
    expect(response).toEqual(mockResponse.data)
  })

  test('Get commit files', async () => {
    const context = {
      owner: 'ahelal',
      repo: 'action',
      commitId: 'hash',
      ghToken: 'test',
      include: ['*.yml']
    } as Context
    const mockResponse = {
      data: {
        sha: 'hash',
        files: [
          {
            filename: 'file1.yml',
            status: 'modified'
          },
          {
            filename: 'file2.yml',
            status: 'added'
          },
          {
            filename: 'file3.yml',
            status: 'removed'
          }
        ]
      },
      status: 200
    }
    const expectedResponse = [
      { filename: 'file1.yml', status: 'modified' },
      { filename: 'file2.yml', status: 'added' }
    ]
    ;(doRequest as jest.Mock).mockResolvedValue(mockResponse)
    const response = await Promise.resolve(getCommitFiles(context))
    expect(doRequest).toHaveBeenCalledTimes(1)
    expect(doRequest).toHaveBeenCalledWith(
      { method: 'GET', path: '/repos/ahelal/action/commits/hash' },
      context
    )
    expect(response).toEqual(expectedResponse)
  })

  //
})
