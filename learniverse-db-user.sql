-- Enable useful extensions.  The uuid‑ossp extension provides
-- uuid_generate_v4() which we use for primary keys.  pgcrypto gives
-- gen_random_uuid() on PostgreSQL 13+.  Either will work, but we
-- include both to be safe.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--
-- Enumerated types
--
-- Using PostgreSQL enums helps to constrain values to known
-- possibilities, improving data integrity and readability.  Each enum
-- corresponds to a set of states for the associated table.

CREATE TYPE user_status_enum AS ENUM (
    'pending_verification',
    'active',
    'suspended',
    'banned',
    'deleted'
);

CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(255) NOT NULL UNIQUE,
    username          VARCHAR(100) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    status            user_status_enum NOT NULL DEFAULT 'pending_verification',
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at     TIMESTAMP,
    created_at        TIMESTAMP NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id      UUID PRIMARY KEY REFERENCES users(id),
    display_name VARCHAR(150) NOT NULL,
    bio          TEXT,
    avatar_url   VARCHAR(500),
    school       VARCHAR(255),
    class        VARCHAR(100),
    profile_completion INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMP NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_verifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id),
    otp_code     VARCHAR(6) NOT NULL,
    sent_at      TIMESTAMP NOT NULL DEFAULT now(),
    expires_at   TIMESTAMP NOT NULL,
    attempts     INTEGER NOT NULL DEFAULT 0,
    consumed_at  TIMESTAMP,
    deleted_at   TIMESTAMP,
    CONSTRAINT chk_email_verifications_length CHECK (char_length(otp_code) = 6)
);

CREATE TABLE IF NOT EXISTS password_resets (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id),
    token        UUID NOT NULL UNIQUE,
    sent_at      TIMESTAMP NOT NULL DEFAULT now(),
    expires_at   TIMESTAMP NOT NULL,
    used_at      TIMESTAMP,
    deleted_at   TIMESTAMP,
    CONSTRAINT chk_password_reset_times CHECK (expires_at > sent_at)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id),
    token        UUID NOT NULL UNIQUE,
    created_at   TIMESTAMP NOT NULL DEFAULT now(),
    expires_at   TIMESTAMP NOT NULL,
    revoked_at   TIMESTAMP,
    user_agent   VARCHAR(500),
    deleted_at   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id),
    role_id INTEGER NOT NULL REFERENCES roles(id),
    deleted_at TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_tags (
    user_id UUID NOT NULL REFERENCES users(id),
    tag_id  UUID NOT NULL REFERENCES tags(id),
    deleted_at TIMESTAMP,
    PRIMARY KEY (user_id, tag_id)
);