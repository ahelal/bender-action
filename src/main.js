const { getJob, getActionRuns, getJobLogs, getContent } = require('./api')

const { openAiRequest, setupInitialMessage } = require('./openai')

const core = require('@actions/core')
const github = require('@actions/github')
const maxRecursion = 2

function getInputs() {
  const context = {}

  context['ghToken'] = core.getInput('gh-token', { required: false })

  context['ghJob'] = core.getInput('gh-job', {
    required: false
  })

  context['azOpenaiEndpoint'] = core.getInput('az-openai-endpoint', {
    required: true
  })

  context['azOpenaiDeployment'] = core.getInput('az-openai-deployment', {
    required: true
  })

  context['azOpenaiKey'] = core.getInput('az-openai-key', {
    required: true
  })

  context['azOpenaiVersion'] = core.getInput('az-openai-apiVersion', {
    required: true
  })

  context['dirContext'] = core.getInput('dir-context', {
    required: false
  })

  context['jobContext'] = core.getInput('job-context', {
    required: false
  })

  context['userContext'] = core.getInput('user-context', {
    required: false
  })

  context['delay'] = core.getInput('delay', {
    required: true
  })

  return context
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

async function getJobYaml(context) {
  const jobAction = await getActionRuns(context)
  const jobYaml = await getContent(
    jobAction.path,
    jobAction.head_branch,
    context
  )
  return jobYaml
}

async function getFileContent4Context(response, context) {
  const regex = /CONTENT_OF_FILE_NEEDED "(.*?)"/gm
  const matches = [...response.matchAll(regex)]
  if (matches.length < 1) {
    core.warning(
      `No file content matched, this can be incorrect response format from OpenAI. try to run again`
    )
    return false
  }
  const found = matches.map(match => match[1])
  core.info(`Fetching file content for ${found[0]} from ${context['ref']}`)
  const fileContent = await getContent(found[0], context['ref'], context)
  return { filename: found[0], content: fileContent }
}

async function run() {
  try {
    const context = getInputs()
    getContext(context)
    core.debug(`Context: ${JSON.stringify(context, null, 2)}`)

    const delay = Number(context['delay'])
    core.info(`Waiting for ${context['delay']} seconds`)
    await new Promise(resolve => setTimeout(resolve, delay * 1000))

    core.info('Getting GH action job info')
    const currentJob = await getJob(context)
    context['jobId'] = currentJob.id

    core.info(`Job Name/ID: ${currentJob.name}/${context['jobId']}`)
    // core.debug(`Job info: ${JSON.stringify(currentJob, null, 2)}`)

    if (context['jobContext']) context['jobContext'] = await getJobYaml(context)

    const jobLog = await getJobLogs(context)
    const message = setupInitialMessage(context, jobLog)
    for (let i = 1; i <= maxRecursion; i++) {
      const aiResponse = await openAiRequest(message, context)
      for (const result of aiResponse.choices) {
        core.info(`\n${result.message.content}\n`)
        message.push({ role: 'assistant', content: result.message.content })
      }
      if (
        !aiResponse.choices[0].message.content.includes(
          'CONTENT_OF_FILE_NEEDED'
        )
      ) {
        core.debug(`No more context needed`)
        break
      }
      const fileContent = await getFileContent4Context(
        aiResponse.choices[0].message.content,
        context
      )
      if (!fileContent) {
        core.info(`Unable to get file content`)
        break
      }
      message.push({
        role: 'user',
        content: `Content of file ${fileContent.filename}\n--------\n${fileContent.content}\n`
      })
      core.debug(
        `UsageAI ${JSON.stringify(aiResponse.usage, null, 2)} recursions: ${i}/${maxRecursion}`
      )
    }
  } catch (error) {
    // Fail the workflow step if an error occurs
    core.setFailed(`${error}`)
  }
}

module.exports = {
  run
}
