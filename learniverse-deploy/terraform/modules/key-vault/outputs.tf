output "kv_fdns" {
  value = azurerm_key_vault.keyvault.vault_uri
}

output "id" {
  value = azurerm_key_vault.keyvault.id
}

output "access_identity_id" {
  value = azurerm_user_assigned_identity.apps.id
}