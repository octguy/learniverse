ALTER TABLE refresh_token
DROP
COLUMN is_revoked;

ALTER TABLE password_reset_token
DROP
COLUMN is_used;