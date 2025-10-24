CREATE TABLE if not exists auth_credential
(
    id                      UUID                        NOT NULL,
    created_at              TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at              TIMESTAMP WITHOUT TIME ZONE,
    deleted_at              TIMESTAMP WITHOUT TIME ZONE,
    user_id                 UUID                        NOT NULL,
    password                VARCHAR(200)                NOT NULL,
    verfication_code        VARCHAR(6),
    verification_expiration TIMESTAMP WITHOUT TIME ZONE,
    last_password_change_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT pk_auth_credential PRIMARY KEY (id)
);

CREATE TABLE if not exists password_reset_token
(
    id         UUID                        NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    user_id    UUID                        NOT NULL,
    token      VARCHAR(200)                NOT NULL,
    expiration TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT pk_password_reset_token PRIMARY KEY (id)
);

CREATE TABLE if not exists refresh_token
(
    id         UUID                        NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    user_id    UUID                        NOT NULL,
    token      VARCHAR(200)                NOT NULL,
    expiration TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT pk_refresh_token PRIMARY KEY (id)
);

CREATE TABLE if not exists role
(
    id         UUID                        NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    name       VARCHAR(50)                 NOT NULL,
    CONSTRAINT pk_role PRIMARY KEY (id)
);

CREATE TABLE if not exists role_user
(
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    user_id    UUID                        NOT NULL,
    role_id    UUID                        NOT NULL,
    CONSTRAINT pk_role_user PRIMARY KEY (user_id, role_id)
);

CREATE TABLE if not exists "user"
(
    id            UUID                        NOT NULL,
    created_at    TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at    TIMESTAMP WITHOUT TIME ZONE,
    deleted_at    TIMESTAMP WITHOUT TIME ZONE,
    username      VARCHAR(50)                 NOT NULL,
    email         VARCHAR(50)                 NOT NULL,
    enabled       BOOLEAN                     NOT NULL,
    status        VARCHAR(255)                NOT NULL,
    last_login_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT pk_user PRIMARY KEY (id)
);

ALTER TABLE auth_credential
    ADD CONSTRAINT uc_auth_credential_user UNIQUE (user_id);

ALTER TABLE password_reset_token
    ADD CONSTRAINT uc_password_reset_token_user UNIQUE (user_id);

ALTER TABLE refresh_token
    ADD CONSTRAINT uc_refresh_token_user UNIQUE (user_id);

ALTER TABLE role
    ADD CONSTRAINT uc_role_name UNIQUE (name);

ALTER TABLE "user"
    ADD CONSTRAINT uc_user_email UNIQUE (email);

ALTER TABLE "user"
    ADD CONSTRAINT uc_user_username UNIQUE (username);

ALTER TABLE auth_credential
    ADD CONSTRAINT FK_AUTH_CREDENTIAL_ON_USER FOREIGN KEY (user_id) REFERENCES "user" (id);

ALTER TABLE password_reset_token
    ADD CONSTRAINT FK_PASSWORD_RESET_TOKEN_ON_USER FOREIGN KEY (user_id) REFERENCES "user" (id);

ALTER TABLE refresh_token
    ADD CONSTRAINT FK_REFRESH_TOKEN_ON_USER FOREIGN KEY (user_id) REFERENCES "user" (id);

ALTER TABLE role_user
    ADD CONSTRAINT FK_ROLE_USER_ON_ROLE FOREIGN KEY (role_id) REFERENCES role (id);

ALTER TABLE role_user
    ADD CONSTRAINT FK_ROLE_USER_ON_USER FOREIGN KEY (user_id) REFERENCES "user" (id);