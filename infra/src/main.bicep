@description('Name of the resource group to deploy the resources to')
param resourceGroupName string

@description('Location of the resource group to deploy the resources to')
param resourceGroupLocation string = ''

@description('Name of the OpenAI service')
param openAiServiceName string

@description('Name of the OpenAI deployment')
param openAiDeploymentName string

@description('Name of the OpenAI deployment model')
param openAiDeploymentModelName string

@description('Version of the OpenAI deployment model')
param openAiDeploymentModelVersion string

@description('SKU name for the OpenAI service')
param openAiSkuName string = 'S0'

// Array of deployments, currently just one deployment will be used
param deployment object = {
    name: openAiDeploymentName
    model: {
      format: 'OpenAI'
      name: openAiDeploymentModelName
      version: openAiDeploymentModelVersion
    }
  }


// Tags for the resource group
@description('Tags for the Azure OpenAI service')
param tags object ={}

@minLength(4)
@description('Unique postfix for resources')
param postfix string = uniqueString('${subscription()}-${resourceGroupLocation}')

@description('Location of the OpenAI service')
param openAiResourceGroupLocation string = ''

@description('Custom domain name for the OpenAI service')
param openAiCustomDomain string = ''

// Scope of the deployment, currently just the subscription is supported
targetScope = 'subscription'

// Createa the resource group
resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: resourceGroupName
  location: resourceGroupLocation
}

var opanAIlocation = length(openAiResourceGroupLocation)>0? openAiResourceGroupLocation: resourceGroupLocation

// Create the OpenAI service by using a separate file
module openAi './openai.resources.bicep' = {
  name: 'openai'
  scope: rg
  params: {
    name: openAiServiceName
    customDomainName: length(openAiCustomDomain)>0? openAiCustomDomain: '${postfix}${openAiServiceName}'
    location: opanAIlocation
    postfix: postfix
    tags: tags
    sku: {
      name: openAiSkuName
    }
    deployment: deployment
  }
}

output endpoint string = openAi.outputs.endpoint
output deployment string = openAi.outputs.deployment
output name string = openAi.outputs.name
output resource_group string = resourceGroupName
output location string = opanAIlocation
