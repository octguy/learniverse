output "public_ip_address" {
  value = azurerm_public_ip.public_ip.ip_address
}

output "backend_public_hostname" {
  value = local.backend_hostname
}

output "frontend_public_hostname" {
  value = local.frontend_hostname
}