# Azure Bicep Deployment

This repository contains a Bicep template for deploying Azure resources. The
deployment is managed using a shell script `infra.sh`.

Original code is by
[Sebastian Jensen](https://medium.com/medialesson/deploy-an-azure-openai-service-with-llm-deployments-via-bicep-244411472d40)

## Prerequisites

Before you can deploy the Bicep template, ensure you have the following
prerequisites:

- **Azure Subscription**: You need an active Azure subscription. If you don't
  have one, you can create a free account at
  [Azure Free Account](https://azure.microsoft.com/free/).

- **Azure CLI**: The Azure Command-Line Interface (CLI) is required to interact
  with Azure resources. You can install it by following the instructions at
  [Install Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli).

- **Bicep CLI**: The Bicep CLI is required to build and deploy Bicep templates.
  You can install it by following the instructions at
  [Install Bicep CLI](https://docs.microsoft.com/azure/azure-resource-manager/bicep/install).

- **jq**: jq us required to parase output from json. You can install it by
  following the instructions at
  [Downloading jq](<[https://docs.microsoft.com/azure/azure-resource-manager/bicep/install](https://jqlang.github.io/jq/download/)>).

## Parameters

You can copy the example parameter file

```bash
cd infra/src
cp openai.solution-example.bicepparam openai.solution.bicepparam
```

Then you can edit the `openai.solution.bicepparam` to your liking

## Deploy

To deploy the bicep script you can use the helper script and run
`./infra.sh deploy` in shell.

## Output

Once the deployment is finished you can run `/infra.sh output` to see the _Azure
OpenAI Endpoint_ and _OpenAI deployment_ and _OpenAI Key_ that you can use in
your GitHub Action secrets.

```shell
# example output
Endpoint   : https://dk3cjc2j6bender-oa.openai.azure.com/
Deployment : bender-codehelper
Key1       : XXXXXXXXXXXXXXXXXXXXX
```

## Cleanup

To do clean up run the script in delete `./infra.sh delete`. This will delete
the resource group, deployment and purge the deployment.
