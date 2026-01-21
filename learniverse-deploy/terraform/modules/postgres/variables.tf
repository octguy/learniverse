variable "resource_group_name" {
  description = "Name of the resource group to create db in"
  type        = string
}

variable "resource_prefix" {
  description = "Prefix of the name for the resources"
  type        = string
}

variable "location" {
  description = "Azure region of resource group"
  type        = string
}

variable "virtual_network_id" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "db_name" {
  description = "db name to create"
  type    = string
  default = "learniverse"
}

variable "admin_username" {
  type = string
}

variable "admin_password" {
  type = string
  sensitive = true
}

variable "admin_password_version" {
  type = number
}

variable "sku_name" {
  description = "Compute size SKU"
  type = string
  default = "B_Standard_B2s"
}

variable "key_vault_id" {
  description = "ID of the Key Vault to store connection string"
  type        = string
}