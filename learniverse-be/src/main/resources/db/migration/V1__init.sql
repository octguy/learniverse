CREATE TABLE answers
(
    id             UUID                        NOT NULL,
    created_at     TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at     TIMESTAMP WITHOUT TIME ZONE,
    deleted_at     TIMESTAMP WITHOUT TIME ZONE,
    question_id    UUID                        NOT NULL,
    author_id      UUID                        NOT NULL,
    body           TEXT                        NOT NULL,
    body_html      TEXT,
    vote_score     INTEGER                     NOT NULL,
    upvote_count   INTEGER                     NOT NULL,
    downvote_count INTEGER                     NOT NULL,
    is_accepted    BOOLEAN                     NOT NULL,
    CONSTRAINT pk_answers PRIMARY KEY (id)
);

CREATE TABLE attachments
(
    id          UUID                        NOT NULL,
    created_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at  TIMESTAMP WITHOUT TIME ZONE,
    deleted_at  TIMESTAMP WITHOUT TIME ZONE,
    content_id  UUID                        NOT NULL,
    uploaded_by UUID                        NOT NULL,
    file_name   VARCHAR(255)                NOT NULL,
    file_type   VARCHAR(255)                NOT NULL,
    file_size   BIGINT                      NOT NULL,
    mime_type   VARCHAR(100)                NOT NULL,
    storage_url VARCHAR(1000)               NOT NULL,
    storage_key VARCHAR(500)                NOT NULL,
    is_verified BOOLEAN                     NOT NULL,
    CONSTRAINT pk_attachments PRIMARY KEY (id)
);

CREATE TABLE auth_credential
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

CREATE TABLE bookmarks
(
    id              UUID                        NOT NULL,
    created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITHOUT TIME ZONE,
    deleted_at      TIMESTAMP WITHOUT TIME ZONE,
    user_id         UUID                        NOT NULL,
    content_id      UUID                        NOT NULL,
    collection_name VARCHAR(100),
    notes           TEXT,
    CONSTRAINT pk_bookmarks PRIMARY KEY (id)
);

CREATE TABLE comments
(
    id               UUID                        NOT NULL,
    created_at       TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at       TIMESTAMP WITHOUT TIME ZONE,
    deleted_at       TIMESTAMP WITHOUT TIME ZONE,
    commentable_type VARCHAR(20)                 NOT NULL,
    commentable_id   UUID                        NOT NULL,
    author_id        UUID                        NOT NULL,
    parent_id        UUID,
    body             TEXT                        NOT NULL,
    body_html        TEXT,
    reply_count      INTEGER                     NOT NULL,
    reaction_count   INTEGER                     NOT NULL,
    is_edited        BOOLEAN                     NOT NULL,
    CONSTRAINT pk_comments PRIMARY KEY (id)
);

CREATE TABLE content_edit_history
(
    id             UUID                        NOT NULL,
    created_at     TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at     TIMESTAMP WITHOUT TIME ZONE,
    deleted_at     TIMESTAMP WITHOUT TIME ZONE,
    edited_by      UUID                        NOT NULL,
    content_id     UUID                        NOT NULL,
    previous_title VARCHAR(300)                NOT NULL,
    previous_body  TEXT                        NOT NULL,
    edit_reason    VARCHAR(500)                NOT NULL,
    edited_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT pk_content_edit_history PRIMARY KEY (id)
);

CREATE TABLE content_reports
(
    id              UUID                        NOT NULL,
    created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITHOUT TIME ZONE,
    deleted_at      TIMESTAMP WITHOUT TIME ZONE,
    reportable_type VARCHAR(255)                NOT NULL,
    reportable_id   UUID                        NOT NULL,
    reported_by     UUID                        NOT NULL,
    reason          VARCHAR(255)                NOT NULL,
    previous_body   TEXT,
    status          VARCHAR(255)                NOT NULL,
    reviewed_by     UUID,
    reviewed_at     TIMESTAMP WITHOUT TIME ZONE,
    resolution_note TEXT,
    CONSTRAINT pk_content_reports PRIMARY KEY (id)
);

CREATE TABLE content_tag
(
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    content_id UUID                        NOT NULL,
    tag_id     UUID                        NOT NULL,
    CONSTRAINT pk_content_tag PRIMARY KEY (content_id, tag_id)
);

CREATE TABLE contents
(
    id                 UUID                        NOT NULL,
    created_at         TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at         TIMESTAMP WITHOUT TIME ZONE,
    deleted_at         TIMESTAMP WITHOUT TIME ZONE,
    author_id          UUID                        NOT NULL,
    content_type       VARCHAR(255)                NOT NULL,
    status             VARCHAR(255)                NOT NULL,
    title              VARCHAR(300),
    body               TEXT                        NOT NULL,
    slug               VARCHAR(400),
    view_count         INTEGER                     NOT NULL,
    comment_count      INTEGER                     NOT NULL,
    reaction_count     INTEGER                     NOT NULL,
    bookmark_count     INTEGER                     NOT NULL,
    share_count        INTEGER                     NOT NULL,
    vote_score         INTEGER,
    accepted_answer_id UUID,
    answer_count       INTEGER                     NOT NULL,
    is_answered        BOOLEAN,
    published_at       TIMESTAMP WITHOUT TIME ZONE,
    last_edited_at     TIMESTAMP WITHOUT TIME ZONE,
    search_vector      TSVECTOR,
    CONSTRAINT pk_contents PRIMARY KEY (id)
);

CREATE TABLE mentions
(
    id                UUID                        NOT NULL,
    created_at        TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at        TIMESTAMP WITHOUT TIME ZONE,
    deleted_at        TIMESTAMP WITHOUT TIME ZONE,
    comment_id        UUID                        NOT NULL,
    mentioned_user_id UUID                        NOT NULL,
    mentioned_by      UUID                        NOT NULL,
    is_notified       BOOLEAN,
    notified_at       TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT pk_mentions PRIMARY KEY (id)
);

CREATE TABLE password_reset_token
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

CREATE TABLE reactions
(
    id             UUID                        NOT NULL,
    created_at     TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at     TIMESTAMP WITHOUT TIME ZONE,
    deleted_at     TIMESTAMP WITHOUT TIME ZONE,
    reactable_type VARCHAR(255)                NOT NULL,
    reactable_id   UUID                        NOT NULL,
    user_id        UUID                        NOT NULL,
    reaction_type  VARCHAR(255)                NOT NULL,
    CONSTRAINT pk_reactions PRIMARY KEY (id)
);

CREATE TABLE refresh_token
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
    CONSTRAINT pk_role_user PRIMARY KEY (user_id, role_id)
);

CREATE TABLE shares
(
    id         UUID                        NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    content_id UUID                        NOT NULL,
    shared_by  UUID                        NOT NULL,
    share_type VARCHAR(255)                NOT NULL,
    target_id  UUID,
    CONSTRAINT pk_shares PRIMARY KEY (id)
);

CREATE TABLE tags
(
    id          UUID                        NOT NULL,
    created_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at  TIMESTAMP WITHOUT TIME ZONE,
    deleted_at  TIMESTAMP WITHOUT TIME ZONE,
    name        VARCHAR(100)                NOT NULL,
    slug        VARCHAR(120)                NOT NULL,
    description TEXT,
    CONSTRAINT pk_tags PRIMARY KEY (id)
);

CREATE TABLE "user"
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

CREATE TABLE votes
(
    id           UUID                        NOT NULL,
    created_at   TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at   TIMESTAMP WITHOUT TIME ZONE,
    deleted_at   TIMESTAMP WITHOUT TIME ZONE,
    votable_type VARCHAR(255)                NOT NULL,
    votable_id   UUID                        NOT NULL,
    user_id      UUID                        NOT NULL,
    vote_type    VARCHAR(255)                NOT NULL,
    CONSTRAINT pk_votes PRIMARY KEY (id)
);

ALTER TABLE attachments
    ADD CONSTRAINT uc_attachments_storage_key UNIQUE (storage_key);

ALTER TABLE auth_credential
    ADD CONSTRAINT uc_auth_credential_user UNIQUE (user_id);

ALTER TABLE contents
    ADD CONSTRAINT uc_contents_accepted_answer UNIQUE (accepted_answer_id);

ALTER TABLE contents
    ADD CONSTRAINT uc_contents_slug UNIQUE (slug);

ALTER TABLE password_reset_token
    ADD CONSTRAINT uc_password_reset_token_user UNIQUE (user_id);

ALTER TABLE refresh_token
    ADD CONSTRAINT uc_refresh_token_user UNIQUE (user_id);

ALTER TABLE role
    ADD CONSTRAINT uc_role_name UNIQUE (name);

ALTER TABLE tags
    ADD CONSTRAINT uc_tags_name UNIQUE (name);

ALTER TABLE tags
    ADD CONSTRAINT uc_tags_slug UNIQUE (slug);

ALTER TABLE "user"
    ADD CONSTRAINT uc_user_email UNIQUE (email);

ALTER TABLE "user"
    ADD CONSTRAINT uc_user_username UNIQUE (username);

ALTER TABLE bookmarks
    ADD CONSTRAINT uq_bookmark_per_user UNIQUE (user_id, content_id);

ALTER TABLE mentions
    ADD CONSTRAINT uq_mention_per_comment UNIQUE (comment_id, mentioned_user_id);

ALTER TABLE reactions
    ADD CONSTRAINT uq_reaction_per_user_item_type UNIQUE (reactable_type, reactable_id, user_id, reaction_type);

ALTER TABLE votes
    ADD CONSTRAINT uq_vote_per_user UNIQUE (votable_type, votable_id, user_id);

ALTER TABLE answers
    ADD CONSTRAINT FK_ANSWERS_ON_AUTHOR FOREIGN KEY (author_id) REFERENCES "user" (id);

ALTER TABLE answers
    ADD CONSTRAINT FK_ANSWERS_ON_QUESTION FOREIGN KEY (question_id) REFERENCES contents (id);

ALTER TABLE attachments
    ADD CONSTRAINT FK_ATTACHMENTS_ON_CONTENT FOREIGN KEY (content_id) REFERENCES contents (id);

ALTER TABLE attachments
    ADD CONSTRAINT FK_ATTACHMENTS_ON_UPLOADED_BY FOREIGN KEY (uploaded_by) REFERENCES "user" (id);

ALTER TABLE auth_credential
    ADD CONSTRAINT FK_AUTH_CREDENTIAL_ON_USER FOREIGN KEY (user_id) REFERENCES "user" (id);

ALTER TABLE bookmarks
    ADD CONSTRAINT FK_BOOKMARKS_ON_CONTENT FOREIGN KEY (content_id) REFERENCES contents (id);

ALTER TABLE bookmarks
    ADD CONSTRAINT FK_BOOKMARKS_ON_USER FOREIGN KEY (user_id) REFERENCES "user" (id);

ALTER TABLE comments
    ADD CONSTRAINT FK_COMMENTS_ON_AUTHOR FOREIGN KEY (author_id) REFERENCES "user" (id);

ALTER TABLE comments
    ADD CONSTRAINT FK_COMMENTS_ON_PARENT FOREIGN KEY (parent_id) REFERENCES comments (id);

ALTER TABLE contents
    ADD CONSTRAINT FK_CONTENTS_ON_ACCEPTED_ANSWER FOREIGN KEY (accepted_answer_id) REFERENCES answers (id);

ALTER TABLE contents
    ADD CONSTRAINT FK_CONTENTS_ON_AUTHOR FOREIGN KEY (author_id) REFERENCES "user" (id);

ALTER TABLE content_edit_history
    ADD CONSTRAINT FK_CONTENT_EDIT_HISTORY_ON_CONTENT FOREIGN KEY (content_id) REFERENCES contents (id);

ALTER TABLE content_edit_history
    ADD CONSTRAINT FK_CONTENT_EDIT_HISTORY_ON_EDITED_BY FOREIGN KEY (edited_by) REFERENCES "user" (id);

ALTER TABLE content_reports
    ADD CONSTRAINT FK_CONTENT_REPORTS_ON_REPORTED_BY FOREIGN KEY (reported_by) REFERENCES "user" (id);

ALTER TABLE content_reports
    ADD CONSTRAINT FK_CONTENT_REPORTS_ON_REVIEWED_BY FOREIGN KEY (reviewed_by) REFERENCES "user" (id);

ALTER TABLE content_tag
    ADD CONSTRAINT FK_CONTENT_TAG_ON_CONTENT FOREIGN KEY (content_id) REFERENCES contents (id);

ALTER TABLE content_tag
    ADD CONSTRAINT FK_CONTENT_TAG_ON_TAG FOREIGN KEY (tag_id) REFERENCES tags (id);

ALTER TABLE mentions
    ADD CONSTRAINT FK_MENTIONS_ON_COMMENT FOREIGN KEY (comment_id) REFERENCES comments (id);

ALTER TABLE mentions
    ADD CONSTRAINT FK_MENTIONS_ON_MENTIONED_BY FOREIGN KEY (mentioned_by) REFERENCES "user" (id);

ALTER TABLE mentions
    ADD CONSTRAINT FK_MENTIONS_ON_MENTIONED_USER FOREIGN KEY (mentioned_user_id) REFERENCES "user" (id);

ALTER TABLE password_reset_token
    ADD CONSTRAINT FK_PASSWORD_RESET_TOKEN_ON_USER FOREIGN KEY (user_id) REFERENCES "user" (id);

ALTER TABLE reactions
    ADD CONSTRAINT FK_REACTIONS_ON_USER FOREIGN KEY (user_id) REFERENCES "user" (id);

ALTER TABLE refresh_token
    ADD CONSTRAINT FK_REFRESH_TOKEN_ON_USER FOREIGN KEY (user_id) REFERENCES "user" (id);

ALTER TABLE role_user
    ADD CONSTRAINT FK_ROLE_USER_ON_ROLE FOREIGN KEY (role_id) REFERENCES role (id);

ALTER TABLE role_user
    ADD CONSTRAINT FK_ROLE_USER_ON_USER FOREIGN KEY (user_id) REFERENCES "user" (id);

ALTER TABLE shares
    ADD CONSTRAINT FK_SHARES_ON_CONTENT FOREIGN KEY (content_id) REFERENCES contents (id);

ALTER TABLE shares
    ADD CONSTRAINT FK_SHARES_ON_SHARED_BY FOREIGN KEY (shared_by) REFERENCES "user" (id);

ALTER TABLE votes
    ADD CONSTRAINT FK_VOTES_ON_USER FOREIGN KEY (user_id) REFERENCES "user" (id);