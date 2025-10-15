CREATE TABLE auth_credential
(
    id                      UUID         NOT NULL,
    created_at              TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at              TIMESTAMP WITHOUT TIME ZONE,
    deleted_at              TIMESTAMP WITHOUT TIME ZONE,
    user_id                 UUID         NOT NULL,
    password                VARCHAR(200) NOT NULL,
    verfication_code        VARCHAR(6),
    verification_expiration TIMESTAMP WITHOUT TIME ZONE,
    last_password_change_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT pk_auth_credential PRIMARY KEY (id)
);

ALTER TABLE "user"
    ADD updated_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE auth_credential
    ADD CONSTRAINT uc_auth_credential_user UNIQUE (user_id);

ALTER TABLE auth_credential
    ADD CONSTRAINT FK_AUTH_CREDENTIAL_ON_USER FOREIGN KEY (user_id) REFERENCES "user" (id);

ALTER TABLE "user"
DROP
COLUMN password;

ALTER TABLE "user"
DROP
COLUMN verification_code;

ALTER TABLE "user"
DROP
COLUMN verification_expiration;