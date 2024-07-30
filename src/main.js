const { getJob, getJobLogs } = require('./api')

const { openAiRequest } = require('./openai')

const core = require('@actions/core')
const github = require('@actions/github')

function getInputs() {
  const payloadContext = {}

  payloadContext['ghToken'] = core.getInput('gh-token', { required: false })

  payloadContext['ghJob'] = core.getInput('gh-job', {
    required: true
  })

  payloadContext['azOpenaiEndpoint'] = core.getInput('az-openai-endpoint', {
    required: true
  })

  payloadContext['azOpenaiDeployment'] = core.getInput('az-openai-deployment', {
    required: true
  })

  payloadContext['azOpenaiKey'] = core.getInput('az-openai-key', {
    required: true
  })

  payloadContext['azOpenaiVersion'] = core.getInput('az-openai-apiVersion', {
    required: true
  })

  payloadContext['jobContext'] = core.getInput('job-context', {
    required: false
  })

  payloadContext['userContext'] = core.getInput('user-context', {
    required: false
  })

  payloadContext['delay'] = core.getInput('delay', {
    required: true
  })

  return payloadContext
}

function getContext(context) {
  const full_name = github.context.payload.repository.full_name.split('/')
  context['owner'] = full_name[0]
  context['repo'] = full_name[1]
  context['runId'] = github.context.runId
  context['ref'] = github.context.ref
  // context['job'] = github.context.job
  context['full_name'] = github.context.payload.repository.full_name
}

async function run() {
  try {
    const payloadContext = getInputs()
    getContext(payloadContext)
    const delay = Number(payloadContext['delay'])
    core.info(`Waiting for ${payloadContext['delay']} seconds`)
    await new Promise(resolve => setTimeout(resolve, delay * 1000))

    core.debug(`Context: ${JSON.stringify(payloadContext, null, 2)}`)

    core.info('Getting some GH action context job logs')
    const currentJob = await getJob(payloadContext)
    payloadContext['jobId'] = currentJob.id
    core.info(`Job Name/ID: ${currentJob.name}/${payloadContext['jobId']}`)

    const jobLog = await getJobLogs(payloadContext)

    const aiResponse = await openAiRequest(jobLog, payloadContext)
    for (const result of aiResponse.choices) {
      core.info(result.message.content)
    }
  } catch (error) {
    // Fail the workflow step if an error occurs
    core.setFailed(`${error}`)
  }
}

module.exports = {
  run
}
