# Bender Action

## Inputs

```yml
gh-token:
  description: GH personal access token (if using private repos)
  required: false

gh-job:
  description:
    Specify the failed job name. If not defined will loop through all job and
    pick first failed one.
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
  description: Should the github action yaml be provided as context
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
name: Generic Python
on:
  push:
    branches: ['main']
  pull_request:
    branches: ['main']

jobs:
  python:
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
    needs: [python]
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
          gh-token: ${{ secrets.GH_TOKEB }} # if needed
          az-openai-endpoint: ${{vars.OA_ENDPOINT}}
          az-openai-deployment: ${{secrets.OA_DEPLOYMENT}}
          az-openai-key: ${{secrets.OA_KEY}}
          dir-context: ${{ env.dir_context }}
```
