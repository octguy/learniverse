# variables.tf – containing the variable declarations used in the resource blocks.

variable "subscription_id" {
  type = string
}

variable "acr_name" {
  type = string
}

variable "resource_prefix" {
  description = "Prefix for the name for all resources"
  type        = string
}

variable "location" {
  description = "Azure region for all resources"
  type        = string
}

variable "postgres_admin_username" {
  type = string
}
variable "postgres_admin_password" {
  type = string
  sensitive = true
}
variable "postgres_admin_password_version" {
  type = number
}

variable "base_hostname" {
  type = string
}

variable "pfx_ssl_filename" {
  type = string
}

variable "pfx_ssl_password" {
  type = string
  sensitive = true
}

// app secrets
variable "jwt_secret" {
  description = "JWT secret for authentication service"
  type        = string
  sensitive   = true
}
variable "jwt_secret_exp" {
  description = "JWT secret expiration (in ms)"
  type        = string
  sensitive   = true
}
variable "secret_support_email" {
  type = string
  sensitive = true
}
variable "secret_support_email_password" {
  type = string
  sensitive = true
}
variable "secret_cloud_name" {
  type = string
  sensitive = true
}
variable "secret_cloudinary_api_key" {
  type = string
  sensitive = true
}
variable "secret_cloudinary_api_secret" {
  type = string
  sensitive = true
}
variable "secret_cloudinary_folder" {
  type = string
  sensitive = true
}

// app env
variable "env_reset_password_token_exp" {
  description = "in minutes"
  default = 15
}
variable "env_refresh_token_exp" {
  description = "in minutes"
  default = 30
}
variable "env_verify_code_exp" {
  description = "in minutes"
  default = 15
}