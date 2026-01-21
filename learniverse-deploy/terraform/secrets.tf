resource "azurerm_key_vault_secret" "jwt_secret_key" {
  name         = "jwt-secret-key"
  key_vault_id = module.key_vault.id
  value        = var.jwt_secret

  lifecycle {
    ignore_changes = [ value ]
  }
}
resource "azurerm_key_vault_secret" "jwt_secret_key_exp" {
  name         = "jwt-secret-key-exp"
  key_vault_id = module.key_vault.id
  value        = var.jwt_secret_exp

  lifecycle {
    ignore_changes = [ value ]
  }
}
resource "azurerm_key_vault_secret" "support_email" {
  name         = "jwt-secret-key-exp"
  key_vault_id = module.key_vault.id
  value        = var.secret_support_email

  lifecycle {
    ignore_changes = [ value ]
  }
}
resource "azurerm_key_vault_secret" "support_email_password" {
  name         = "jwt-secret-key-exp"
  key_vault_id = module.key_vault.id
  value        = var.secret_support_email_password

  lifecycle {
    ignore_changes = [ value ]
  }
}
resource "azurerm_key_vault_secret" "cloud_name" {
  name         = "jwt-secret-key-exp"
  key_vault_id = module.key_vault.id
  value        = var.secret_cloud_name

  lifecycle {
    ignore_changes = [ value ]
  }
}
resource "azurerm_key_vault_secret" "cloudinary_api_key" {
  name         = "jwt-secret-key-exp"
  key_vault_id = module.key_vault.id
  value        = var.secret_cloudinary_api_key

  lifecycle {
    ignore_changes = [ value ]
  }
}
resource "azurerm_key_vault_secret" "cloudinary_api_secret" {
  name         = "jwt-secret-key-exp"
  key_vault_id = module.key_vault.id
  value        = var.secret_cloudinary_api_secret

  lifecycle {
    ignore_changes = [ value ]
  }
}
resource "azurerm_key_vault_secret" "cloudinary_folder" {
  name         = "jwt-secret-key-exp"
  key_vault_id = module.key_vault.id
  value        = var.secret_cloudinary_folder

  lifecycle {
    ignore_changes = [ value ]
  }
}