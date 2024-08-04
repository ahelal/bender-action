const { Octokit } = require('@octokit/core');
const { getJob, doRequest } = require('../src/api')
const payLoad = {
    status: 200,
    data: {
      message: 'Success',
      jobs: [
        { name: 'test-job', status: 'completed', conclusion: 'failure' },
        { name: 'run', status: 'completed', conclusion: 'success' }
      ]
    }
}
let mockResponse = {}
// Mock the @octokit/core module
jest.mock('@octokit/core', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => {
      return {
        request: jest.fn().mockImplementation(() => {
          return mockResponse;
        })
      };
    })
  };
});


// jest.mock('@octokit/core')

describe('API Tests', () => {
    let octokit

    beforeEach(() => {
        octokit = new Octokit()
        mockResponse = JSON.parse(JSON.stringify(payLoad));
    })

    it('should mock octokit.request', async () => {
        const context = { owner: 'test', repo: 'repo', runId: 1, ghJob: 'test-job' }
        const iPath = 'GET /some/path'
        const iBody = { some: 'body' }
        response.data.jobs[0].name = "test-job2"
        const response = await getJob(context) // Adjust based on your actual function call
        // Octokit.request.data[0].name = "a"
        
        console.log("XXXX",response)
        // expect(octokit.request).toHaveBeenCalledWith(iPath, iBody);
        expect(response.name).toEqual("test-job2");
        // expect(1).toEqual(1)
    })
    it('should mock octokit.request2', async () => {
        const context = { owner: 'test', repo: 'repo', runId: 1, ghJob: 'test-job' }
        const iPath = 'GET /some/path'
        const iBody = { some: 'body' }
        mockResponse.data.jobs[0].name = "test-jobX"
        const response = await getJob(context) // Adjust based on your actual function call
        // Octokit.request.data[0].name = "a"

        // expect(octokit.request).toHaveBeenCalledWith(iPath, iBody);
        expect(response.name).toEqual("test-jobX");
        // expect(1).toEqual(1)
    })

})