import { doRequest } from '../src/github_api'
import fetchMock from 'fetch-mock'
import { GithubAPIversion } from '../src/config'
import { Context } from '../src/types'
// import { request } from '@octokit/request'
// import { RequestInterface } from '@octokit/types'

describe('doRequest no context', () => {
  const context = {} as Context
  const fetchMockFunc = fetchMock.sandbox().getOnce(
    'https://api.github.com/',
    { ok: true },
    {
      headers: {
        accept: 'application/vnd.github.v3+json',
        'x-github-api-version': GithubAPIversion
      }
    }
  )
  const params = {
    method: 'GET',
    path: '/'
  }
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should make a successful request', async () => {
    const response = await doRequest(params, context, undefined, fetchMockFunc)
    const request = fetchMockFunc.lastOptions()
    expect(response.status).toBe(200)
    expect(request?.method).toEqual('GET')
    // console.log('Response: ', request)
    return response
  })
})

describe('doRequest more context', () => {
  const context = {
    ghToken: 'test-token'
  } as Context
  const fetchMockFunc = fetchMock.sandbox().postOnce(
    'https://test.github.com/test/test',
    { ok: true },
    {
      headers: {
        accept: 'application/vnd.github.v3+json',
        authorization: 'token test-token',
        'test1-header': 'test1-value',
        'test2-header': 'test2-value',
        'x-github-api-version': GithubAPIversion
      },
      body: { test1: 'test1', test2: 'test2' }
    }
  )
  const params = {
    baseUrl: 'https://test.github.com',
    method: 'POST',
    path: '/test/test',
    headers: {
      'test1-header': 'test1-value',
      'test2-header': 'test2-value'
    }
  }
  const body = { test1: 'test1', test2: 'test2' }
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should make a successful request', async () => {
    const response = await doRequest(params, context, body, fetchMockFunc)
    const request = fetchMockFunc.lastOptions()
    // console.log('Bodyyyyyyy', request)
    expect(request?.method).toEqual('POST')
    expect(response.status).toBe(200)
    return response
  })
})
