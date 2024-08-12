# Azure Bicep Deployment

This repository contains a Bicep template for deploying Azure resources. The
deployment is managed using a shell script `infra.sh`.

Original code is by
[Sebastian Jensen](https://medium.com/medialesson/deploy-an-azure-openai-service-with-llm-deployments-via-bicep-244411472d40)

## Prerequisites

Before you can deploy the Bicep template, ensure you have the following
prerequisites:

1. **Azure Subscription**: You need an active Azure subscription. If you don't
   have one, you can create a free account at
   [Azure Free Account](https://azure.microsoft.com/free/).

2. **Azure CLI**: The Azure Command-Line Interface (CLI) is required to interact
   with Azure resources. You can install it by following the instructions at
   [Install Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli).

3. **Bicep CLI**: The Bicep CLI is required to build and deploy Bicep templates.
   You can install it by following the instructions at
   [Install Bicep CLI](https://docs.microsoft.com/azure/azure-resource-manager/bicep/install).

## Parameters

You can copy the example parameter file

```bash
cd infra/src
cp openai.solution-example.bicepparam openai.solution.bicepparam
```

You can then edit the `openai.solution.bicepparam` to your liking

## Deploy

To deploy run `./infra.sh deploy` Once a deploy is finished you can run
`/infra.sh output` you will get a the _Azure OpenAI Endpoint_ and _OpenAI
deployment_ and _OpenAI Key_ that you can use in your Github Action secrets.

## Cleanup

To deploy clean up `./infra.sh delete`
