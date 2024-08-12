#!/usr/bin/env bash
set -e

DIR_NAME=$(dirname "$0")
cd "${DIR_NAME}"

status_file="${DIR_NAME}/.status.json"

deployment_name="openai-deployment"

function deloy {
    echo "* Deploying the infra"
    az deployment sub create \
        --name "${deployment_name}" \
        --location westeurope \
        --template-file ./main.bicep \
        --parameters openai.solution.bicepparam > "${status_file}"
    echo "* Done with deployment."
}

function get_number {
# Echo radnom number betwen 1-9 and use must enter the correct as a confirmation to proceed
    number=$((1 + RANDOM % 9))
    echo -n "Are you sure you want to delete all resources ? type '${number}' to confirm: "
    read -r input
    if [ "${input}" != "${number}" ]; then
        echo "Wrong number, canceling the operation"
        exit 0
    fi
}

function delete {
    get_number
    echo "* Deleteing deployment"

    name=$(jq -r .properties.outputs.name.value < "${status_file}")
    resource_group=$(jq -r .properties.outputs.resource_group.value < "${status_file}")
    location=$(az cognitiveservices account show --name "${name}" -g "${resource_group}" --output tsv --query "location")

    # Deete resource group
    az group delete -n "${resource_group}" -y
    # Delete deployment 
    az deployment sub delete \
        --name "${deployment_name}"

    # purge deployment
    az cognitiveservices account purge --name "${name}" -g "${resource_group}" --location "${location}"
    echo "* Done with deleting deployment"
    
    rm -f "${status_file}"
}

function output {
    if [ ! -f "${status_file}" ]; then
        echo "No status file, run deploy first"
        exit 1
    fi
    
    deployment_name=$(jq -r .properties.outputs.deployment.value < "${status_file}")
    endpoint=$(jq -r .properties.outputs.endpoint.value < "${status_file}")
    name=$(jq -r .properties.outputs.name.value < "${status_file}")
    resource_group=$(jq -r .properties.outputs.resource_group.value < "${status_file}")
    key=$(az cognitiveservices account keys list --name "${name}" -g "${resource_group}"  --output tsv --query "key1")
            
    echo "Endpoint   : ${endpoint}"
    echo "Deployment : ${deployment_name}"
    echo "Key1       : ${key}"   
}

option="${1}"
if [ "${option}" == "deploy" ]; then
    deloy
elif [ "${option}" ==  'delete' ]; then
    delete
elif [ "${option}" ==  'output' ]; then
    output
else 
    echo "** Unkown options '${option}' **"
    echo "Supported options: [ deploy, delete ]"
fi
