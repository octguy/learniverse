CREATE TABLE password_reset_token
(
    id         UUID                        NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    user_id    UUID                        NOT NULL,
    token      VARCHAR(200)                NOT NULL,
    is_used    BOOLEAN                     NOT NULL,
    expiration TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT pk_password_reset_token PRIMARY KEY (id)
);

ALTER TABLE password_reset_token
    ADD CONSTRAINT uc_password_reset_token_user UNIQUE (user_id);

ALTER TABLE password_reset_token
    ADD CONSTRAINT FK_PASSWORD_RESET_TOKEN_ON_USER FOREIGN KEY (user_id) REFERENCES "user" (id);