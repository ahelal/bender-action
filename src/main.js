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

    const runId = github.context.runId

    // Output the payload for debugging
    core.info(`The run ID ${runId}}`)

    core.info(`The context : ${JSON.stringify(github.context, null, 2)}`)
  } catch (error) {
    // Fail the workflow step if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
