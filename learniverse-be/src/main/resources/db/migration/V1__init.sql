CREATE TABLE flyway_schema_history
(
    installed_rank INTEGER       NOT NULL,
    version        VARCHAR(50),
    description    VARCHAR(200)  NOT NULL,
    type           VARCHAR(20)   NOT NULL,
    script         VARCHAR(1000) NOT NULL,
    checksum       INTEGER,
    installed_by   VARCHAR(100)  NOT NULL,
    installed_on   TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    execution_time INTEGER       NOT NULL,
    success        BOOLEAN       NOT NULL,
    CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank)
);

CREATE TABLE "user"
(
    id                      CHAR(36)     NOT NULL,
    created_at              TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    email                   VARCHAR(20)  NOT NULL,
    enabled                 BOOLEAN      NOT NULL,
    last_login_at           TIMESTAMP WITHOUT TIME ZONE,
    password                VARCHAR(200) NOT NULL,
    username                VARCHAR(20)  NOT NULL,
    verification_code       VARCHAR(6),
    verification_expiration TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT user_pkey PRIMARY KEY (id)
);

ALTER TABLE "user"
    ADD CONSTRAINT uk5c856itaihtmi69ni04cmpc4m UNIQUE (username);

ALTER TABLE "user"
    ADD CONSTRAINT ukhl4ga9r00rh51mdaf20hmnslt UNIQUE (email);

CREATE INDEX flyway_schema_history_s_idx ON flyway_schema_history (success);