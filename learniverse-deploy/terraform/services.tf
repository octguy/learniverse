locals {
  acr_login_server = module.acr.login_server_url
  acr_pull_identity_id = module.acr.acr_pull_identity_id
}

module "ai_service" {
  source = "./modules/aca-service"
  name = "learniverse-commentscan"
  image_url = "honguyenminh/learniverse-commentscan:latest"

  container_app_environment_id = module.aca-infra.env-id
  resource_group_name = local.rg_name
  
  acr_login_server = local.acr_login_server
  acr_pull_identity_id = local.acr_pull_identity_id
  key_vault_access_identity_id = module.key_vault.access_identity_id

  liveness_probe = {
    path = "/"
    port = 8000
    initial_delay = 15
    interval_seconds = 30
    timeout = 10
    failure_count_threshold = 5
  }

  is_external_ingress = false
  target_port_ingress = 8000
  transport = "auto"
  envs = {
    FORCE_CPU: 1
  }
}

module "backend_service" {
  source = "./modules/aca-service"
  name = "learniverse-backend"

  container_app_environment_id = module.aca-infra.env-id
  resource_group_name = local.rg_name
  
  acr_login_server = local.acr_login_server
  acr_pull_identity_id = local.acr_pull_identity_id
  key_vault_access_identity_id = module.key_vault.access_identity_id

  is_external_ingress = true
  target_port_ingress = 8080
  envs = {
    REFRESH_TOKEN_EXPIRATION: var.env_refresh_token_exp
    RESET_PASSWORD_TOKEN_EXPIRATION: var.env_reset_password_token_exp
    VERIFICATION_CODE_EXPIRATION: var.env_verify_code_exp
    AI_SERVICE_URL: "http://${module.ai_service.name}:8000"
  }
  secrets = {
    SPRING_DATASOURCE_URL=module.postgres.connection_string_secret_id
    SPRING_DATASOURCE_USERNAME=module.postgres.username_secret_id
    SPRING_DATASOURCE_PASSWORD=module.postgres.password_secret_id
    SPRING_JWT_SECRET_KEY=azurerm_key_vault_secret.jwt_secret_key.versionless_id
    SPRING_JWT_SECRET_KEY_EXPIRATION=azurerm_key_vault_secret.jwt_secret_key_exp.versionless_id
    SUPPORT_EMAIL: azurerm_key_vault_secret.support_email.versionless_id
    SUPPORT_EMAIL_PASSWORD: azurerm_key_vault_secret.support_email_password.versionless_id
    CLOUD_NAME: azurerm_key_vault_secret.cloud_name.versionless_id
    CLOUDINARY_API_KEY: azurerm_key_vault_secret.cloudinary_api_key.versionless_id
    CLOUDINARY_API_SECRET: azurerm_key_vault_secret.cloudinary_api_secret.versionless_id
    CLOUDINARY_FOLDER: azurerm_key_vault_secret.cloudinary_folder.versionless_id
  }
  transport = "tcp"
  min_replica = 1
}

module "frontend_service" {
  source = "./modules/aca-service"
  name = "learniverse-frontend"

  container_app_environment_id = module.aca-infra.env-id
  resource_group_name = local.rg_name
  
  acr_login_server = local.acr_login_server
  acr_pull_identity_id = local.acr_pull_identity_id
  key_vault_access_identity_id = module.key_vault.access_identity_id

  liveness_probe = {
    path = "/"
    port = 8386
    initial_delay = 15
    interval_seconds = 30
    timeout = 10
    failure_count_threshold = 5
  }

  is_external_ingress = true
  target_port_ingress = 8386
  transport = "auto"
  envs = {
    NEXT_PUBLIC_API_URL: module.app-gw.frontend_public_hostname
  }
}
