#!/usr/bin/env bash

set -e

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Move to terraform folder
cd $SCRIPT_DIR/../terraform

# Init
terraform init

# Plan ACR only
terraform plan -target module.acr -out=acr.tfplan