# provider.tf – containing the terraform block, s3 backend definition, provider configurations, and aliases.

terraform {
  required_version = ">= 1.11.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.57.0"
    }
    random = {
      source = "hashicorp/random"
      version = "3.8.0"
    }
    http = {
      source = "hashicorp/http"
      version = "3.5.0"
    }
  }

  #! INFO: Configure remote state prior to first apply (Azure Storage backend recommended).
}

provider "azurerm" {
  subscription_id = var.subscription_id
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}
