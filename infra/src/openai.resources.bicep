@description('Name of the Azure OpenAI service')
param name string

@description('Custom domain name for the Azure OpenAI service')
param customDomainName string

@description('Location of the Azure OpenAI service')
param location string

@description('Deployments for the Azure OpenAI service')
param deployment object

@description('Kind of the Azure OpenAI service')
param kind string = 'OpenAI'

@description('Public network access of the Azure OpenAI service')
param publicNetworkAccess string = 'Enabled'

@description('SKU of the Azure OpenAI service')
param sku object

@description('Tags for the Azure OpenAI service')
param tags object ={}


@description('Unique postfix for resources')
param postfix string

@allowed(['Basic', 'Enterprise', 'Free', 'Premium', 'Standard'])
param deploymentSkuName string = 'Standard'

// Azure OpenAI service
resource account 'Microsoft.CognitiveServices/accounts@2022-03-01' = {
  name: '${name}${postfix}'
  location: location
  tags: tags
  kind: kind
  properties: {
    customSubDomainName: customDomainName
    publicNetworkAccess: publicNetworkAccess
    // restore: false
  }
  sku: sku
}

// Deployments for the Azure OpenAI service
resource oaAeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-04-01-preview' = {
  parent: account
  name: deployment.name
  properties: {
    model: deployment.model
  }
  sku: {
    name: deploymentSkuName
    capacity: 50
  }
}

output endpoint string = account.properties.endpoint
output deployment string = oaAeployment.name
output name string = account.name
