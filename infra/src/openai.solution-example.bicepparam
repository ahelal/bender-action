using './main.bicep'

param resourceGroupName = 'bender-action'
param resourceGroupLocation = 'swedencentral'

param openAiServiceName = 'bender-oa'
param openAiDeploymentName = 'bender-codehelper'

// *** GPT 4o example ***
param openAiDeploymentModelName = 'gpt-4o'
param openAiDeploymentModelVersion = '2024-05-13'
param deployment = {
    name: openAiDeploymentName
    model: {
      format: 'OpenAI'
      name: openAiDeploymentModelName
      version: openAiDeploymentModelVersion
    }
  }

// *** GPT 3.5 Turbo example ***
// param openAiDeploymentModelName = 'gpt-35-turbo'
// param openAiDeploymentModelVersion = '0301'
// param deployments = [
//   {
//     name: openAiDeploymentName
//     model: {
//       format: 'OpenAI'
//       name: openAiDeploymentModelName
//       version: openAiDeploymentModelVersion
//     }
//     scaleSettings: {
//       scaleType: 'Standard'
//     }
//   }
// ]

// *** Optional parameters ***

// param openAiResourceGroupLocation = 'swedencentral'

// param openAiCustomDomain = 'coolaiSomethong'

// param postfix = 'Csa2'

// param tags = {
//   DeployedBy: 'Bicep'
// }

// param openAiSkuName = 'S0'


