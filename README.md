# Bender Action

## Overview

The Bender Action is a GitHub Action designed to interact with Azure OpenAI
services and handle failed jobs in your GitHub workflows. This action can fetch
logs, provide context, and utilize OpenAI to assist in debugging and resolving
issues. It cam also review your code and comment directly in your pull requests.

## Modes

### Job mode

In Job mode, Bender should run only if a job failed, it will inspect the job
failed and give recommendation on hot to fix the problem.

### PR mode

In PR mode, Bender acts as a code reviewer, focusing on security and
recommending code improvments.

## Inputs

```yml
gh-token:
  description: GH personal access token (if using private repos)
  required: false

gh-job:
  description:
    Specify the failed job name. If not defined, will loop through all jobs and
    pick the first failed one.
  required: false

az-openai-endpoint:
  description: Azure OpenAI Endpoint URL
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
  description: Should the GitHub action YAML be provided as context
  default: false

user-context:
  description: Extra OpenAI user context
  default: ''

delay:
  description: Delay in seconds before fetching logs from GH action
  default: 1
  required: true
```

## Example workflow

```yaml
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

### Usage Instructions

Set Up Secrets and Variables:

Ensure you have the necessary secrets (GH_TOKEN, OA_ENDPOINT, OA_DEPLOYMENT,
OA_KEY) set up in your GitHub repository settings.

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
