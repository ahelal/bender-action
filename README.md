# Bender Action

## Overview

Bender is a GitHub Action designed to interact with Azure OpenAI services and
assist you with failed jobs and review your PRs with security in mind in your
GitHub workflows. It provides logs and source code for context and utilizes
OpenAI to assist in debugging, resolving issues, and providing feedback.

If you need to deploy Azure OpenAI you can head to [infra](/infra) directory and
follow the `Readme` to deploy AzureOI with bicep.

## Inputs

```yml
mode:
  description: 'Mode of operation (job|pr)'
  required: true
  default: 'job'

gh-token:
  description:
    GH personal access token (if using private repos or PR mode for commenting
  required: false

gh-job:
  description:
    Specify the failed job name. If not defined will loop through all job and
    pick first failed one.
  required: false

az-openai-endpoint:
  description:
    Azure OpenAI Endpoint URL, example
    https://eastus2.api.cognitive.microsoft.com"
  required: true

az-openai-deployment:
  description: Azure OpenAI deployment name
  required: true

az-openai-key:
  description: Azure OpenAI API Key
  required: true

az-openai-apiVersion:
  description: Azure OpenAI version
  default: '2024-05-01-preview'

dir-context:
  description: Provide the directory structure as base64 extra context
  default: ''

job-context:
  description: Should the github action YAML be provided as context
  default: 'false'

user-context:
  description: Extra OpenAI user context
  default: ''

include:
  description:
    In PR mode, Filter files to be used for context, comma seperated regex i.e.
    'src/*.ts' '*.ts;*.js'
  default: ''
  required: true
```

## Usage Instructions

Set Up Secrets and Variables:

Ensure you have the necessary secrets for example (GH_TOKEN, OA_ENDPOINT,
OA_DEPLOYMENT, OA_KEY) set up in your GitHub repository settings.

Check the example workflow YAML examples.

## Example workflow

### Job mode

In Job mode, Bender should run only if a job failed, it will inspect the job
failed and give recommendation on hot to fix the problem.

```YAML
name: YOR JOB
on:
  push:
    branches: ['main']
  pull_request:
    branches: ['main']

jobs:
  myjob:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.10'
      - name: Run python script
        run: python3 generic/python/main.py

  bender:
    runs-on: ubuntu-latest
    needs: [myjob]
    if: ${{ always() && contains(needs.*.result, 'failure') }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Get dir context
        id: getdir
        run:
          echo "dir_context=$(find . -path ./.git -prune -o -print | base64 | tr
          '\n' ' ')" >> $GITHUB_ENV

      - name: Run Bender (if failure)
        uses: ahelal/bender-action@main
        with:
          mode: 'job'
          gh-token: ${{ secrets.GH_TOKEB }} # if needed
          az-openai-endpoint: ${{vars.OA_ENDPOINT}}
          az-openai-deployment: ${{secrets.OA_DEPLOYMENT}}
          az-openai-key: ${{secrets.OA_KEY}}
          dir-context: ${{ env.dir_context }}
```

Define the Workflow:

Copy the example workflow into your .github/workflows/ directory in your
repository. Modify the myjob job to suit your needs, ensuring it runs the
necessary scripts or commands. Configure the Bender Job:

The bender job is configured to run only if the myjob job fails. It checks out
the repository, gathers directory context, and runs the Bender Action with the
provided inputs. Run the Workflow:

Push changes to the main branch or create a pull request to trigger the
workflow. Monitor the workflow runs in the GitHub Actions tab of your
repository. By following these steps, you can effectively integrate the Bender
Action into your GitHub workflows to leverage Azure OpenAI for debugging and
resolving issues in your CI/CD pipelines.

### PR mode

In PR mode, Bender acts as a code reviewer, focusing on security and
recommending code improvments.

```YAML
name: Bender PR
on:
  pull_request:
    branches:
      - main
jobs:
  bender-action:
    name: Bender-action security insights
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      - name: Get dir context
        id: getdir
        run: |
          dirs="$(find . -path ./.git -prune -o -print | base64 | tr '\n' ' ')"
          echo "dir_context=${dirs}" >> "$GITHUB_ENV"

      - name: Echo dir context
        run: echo ${{env.dir_context}}

      - name: Run Bender
        uses: ahelal/bender-action@feature/pr_comment
        id: bender
        with:
          mode: 'pr'
          gh-token: ${{ secrets.GHTOKEN }}
          az-openai-endpoint: ${{vars.OA_ENDPOINT}}
          az-openai-deployment: ${{secrets.OA_DEPLOYMENT}}
          az-openai-key: ${{secrets.OA_KEY}}
          dir-context: ${{ env.dir_context }}
          include: '*.ts'

      - name: Print Output
        id: output
        run: echo "${{ steps.bender.outputs.usage }}"
```
