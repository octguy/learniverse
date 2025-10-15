CREATE TABLE role
(
    id         UUID                        NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    name       VARCHAR(50)                 NOT NULL,
    CONSTRAINT pk_role PRIMARY KEY (id)
);

CREATE TABLE role_user
(
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    user_id    UUID                        NOT NULL,
    role_id    UUID                        NOT NULL,
    CONSTRAINT pk_roleuser PRIMARY KEY (user_id, role_id)
);

ALTER TABLE role
    ADD CONSTRAINT uc_role_name UNIQUE (name);

ALTER TABLE role_user
    ADD CONSTRAINT FK_ROLEUSER_ON_ROLE FOREIGN KEY (role_id) REFERENCES role (id);

ALTER TABLE role_user
    ADD CONSTRAINT FK_ROLEUSER_ON_USER FOREIGN KEY (user_id) REFERENCES "user" (id);