variable "resource_group_name" {
  description = "Name of the resource group to create resource in"
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

variable "subnet_id" {
  description = "Subnet ID to create resource in. Must not contain any other resource."
  type        = string
}
variable "base_hostname" {
  description = "Base host name to use for AppGW, where a subdomain will be prepended for each endpoint"
  type        = string
}

variable "backend_aca_fqdn" {
  description = "FQDN of target Backend API ACA (target app, not environment)"
  type        = string
}
variable "backend_subdomain" {
  description = "Subdomain of the api endpoint."
  default     = "backend"
  type        = string
}

variable "frontend_aca_fqdn" {
  description = "FQDN of target Frontend ACA (target app, not environment)"
  type        = string
}
variable "frontend_subdomain" {
  description = "Subdomain of the frontend endpoint."
  default     = "frontend"
  type        = string
}

variable "request_timeout" {
  type    = number
  default = 30
}

variable "pfx_ssl_filename" {
  description = "Name of the .pfx file containing SSL certificate for frontend in the `certs` folder. Should have all endpoint hostnames in CN."
  type        = string
}
variable "pfx_ssl_password" {
  description = "Password for the pfx SSL file"
  type        = string
  sensitive = true
}
