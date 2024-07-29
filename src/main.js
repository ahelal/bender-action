const core = require('@actions/core')
const github = require('@actions/github')

async function run() {
  try {
    // Get inputs
    const openaiEndpoint = core.getInput('az-openai-endpoint', {
      required: true
    })
    const openaiKey = core.getInput('az-openai-key', { required: true })
    const ghToken = core.getInput('gh-token', { required: false })
    const userContext = core.getInput('user-context', { required: false })

    const payloadContext = {}

    payloadContext['runId'] = github.context.runId
    payloadContext['ref'] = github.context.ref
    payloadContext['job'] = github.context.job
    payloadContext['repo'] = github.context.payload.repository.full_name

    // Output the payload for debugging
    core.info(`payloadContext: ${JSON.stringify(payloadContext, null, 2)}`)

    core.info(`The context : ${JSON.stringify(github.context, null, 2)}`)
  } catch (error) {
    // Fail the workflow step if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
