--
-- PostgreSQL schema for the Learniverse platform
--
-- This schema is intended to support a rich social learning platform with
-- functionality for user authentication and profile management, posts and
-- newsfeeds, Q&A with voting, real‑time chat, friendships, groups,
-- notifications and moderation.  The goal is to capture the core
-- entities and relationships described in the functional specification.
--

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

CREATE TYPE post_visibility_enum AS ENUM (
    'public',
    'friends',
    'private',
    'group'
);

CREATE TYPE post_status_enum AS ENUM (
    'draft',
    'published',
    'deleted'
);

CREATE TYPE friend_request_status_enum AS ENUM (
    'pending',
    'accepted',
    'declined',
    'cancelled'
);

CREATE TYPE conversation_type_enum AS ENUM (
    'direct',
    'group'
);

CREATE TYPE participant_role_enum AS ENUM (
    'member',
    'admin',
    'owner'
);

CREATE TYPE message_type_enum AS ENUM (
    'text',
    'image',
    'file',
    'system'
);

CREATE TYPE report_status_enum AS ENUM (
    'pending',
    'resolved',
    'rejected'
);

CREATE TYPE group_type_enum AS ENUM (
    'public',
    'private'
);

CREATE TYPE membership_role_enum AS ENUM (
    'owner',
    'moderator',
    'member'
);

CREATE TYPE membership_status_enum AS ENUM (
    'active',
    'pending',
    'banned'
);

CREATE TYPE notification_type_enum AS ENUM (
    'comment',
    'reply',
    'mention',
    'like',
    'bookmark',
    'friend_request',
    'friend_accept',
    'group_invite',
    'group_join_accept',
    'post_share',
    'report',
    'answer',
    'answer_accepted',
    'vote'
);

CREATE TYPE notification_status_enum AS ENUM (
    'unread',
    'read'
);

CREATE TYPE report_target_type_enum AS ENUM (
    'post',
    'comment',
    'question',
    'answer',
    'user',
    'group'
);

-- No enum for votes; we store an integer value (1 or -1) and enforce
-- via a CHECK constraint.

--
-- Core user and authentication tables
--

-- Users table: stores basic authentication fields and account status.  As
-- recommended in social media database design, the users table is kept
-- lean; extended profile information lives in a separate table【673997057214084†L160-L173】.
CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(255) NOT NULL UNIQUE,
    username          VARCHAR(100) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    status            user_status_enum NOT NULL DEFAULT 'pending_verification',
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at     TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extended user profile information such as display name, bio and
-- educational details.  Keeping this separate helps the main users table
-- stay efficient for authentication queries【673997057214084†L160-L173】.
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(150) NOT NULL,
    bio          TEXT,
    avatar_url   VARCHAR(500),
    school       VARCHAR(255),
    class        VARCHAR(100),
    profile_completion INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for email verification codes (OTP) used during sign up and email
-- change flows.  OTP codes are 6 digits and expire after 15 minutes.
CREATE TABLE IF NOT EXISTS email_verifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_code     VARCHAR(6) NOT NULL,
    sent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ NOT NULL,
    attempts     INTEGER NOT NULL DEFAULT 0,
    consumed_at  TIMESTAMPTZ,
    CONSTRAINT chk_email_verifications_length CHECK (char_length(otp_code) = 6)
);

-- Table for password reset tokens (forgot password flow).  Each token
-- expires after a configurable period and is invalidated once used.
CREATE TABLE IF NOT EXISTS password_resets (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token        UUID NOT NULL UNIQUE,
    sent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ NOT NULL,
    used_at      TIMESTAMPTZ,
    CONSTRAINT chk_password_reset_times CHECK (expires_at > sent_at)
);

-- Table for storing refresh tokens for JWT authentication.  Each row
-- represents a session on a particular device.  Revoked tokens are
-- marked by revoked_at.
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token        UUID NOT NULL UNIQUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked_at   TIMESTAMPTZ,
    user_agent   VARCHAR(500),
    ip_address   INET
);

-- User roles (admin, moderator, regular user).  A user can have
-- multiple roles.  Roles can be used for access control and
-- moderation privileges【673997057214084†L185-L188】.
CREATE TABLE IF NOT EXISTS roles (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Tags represent subject areas or interests such as "Math", "Programming"
-- or "English".  Tags are used by users to express interests and by
-- content (posts, questions, groups) for categorisation【673997057214084†L135-L143】.
CREATE TABLE IF NOT EXISTS tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_tags (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag_id  UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tag_id)
);

--
-- Posts and newsfeed
--
-- Posts are central to the platform: they can be standalone, belong to
-- a group, or be a shared repost of another post.  Each post has a
-- visibility scope and may have attachments stored in a separate
-- table.  The Newsfeed service uses this table along with feed
-- algorithms to surface relevant posts【673997057214084†L90-L109】.

CREATE TABLE IF NOT EXISTS posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    visibility      post_visibility_enum NOT NULL DEFAULT 'public',
    status          post_status_enum NOT NULL DEFAULT 'published',
    original_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    group_id        UUID REFERENCES groups(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_at       TIMESTAMPTZ,
    likes_count     INTEGER NOT NULL DEFAULT 0,
    comments_count  INTEGER NOT NULL DEFAULT 0,
    bookmarks_count INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_post_content_length CHECK (char_length(content) >= 10)
);

-- Association table for tags on posts.  Posts should have at least one
-- tag to aid discovery and relevance ranking【673997057214084†L135-L143】.
CREATE TABLE IF NOT EXISTS post_tags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id  UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Attachments associated with posts (images, PDFs).  Storing file
-- metadata separately allows multiple attachments per post and avoids
-- bloating the posts table with large blobs【673997057214084†L214-L217】.
CREATE TABLE IF NOT EXISTS post_media (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id      UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_type   VARCHAR(20) NOT NULL, -- e.g. 'image', 'pdf'
    file_url     VARCHAR(1000) NOT NULL,
    file_name    VARCHAR(255) NOT NULL,
    file_size    INTEGER NOT NULL,
    preview_url  VARCHAR(1000),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_post_media_size CHECK (file_size > 0)
);

-- Likes on posts.  Each user can like a given post at most once.  We
-- maintain like counts on the posts table via triggers or application
-- code.
CREATE TABLE IF NOT EXISTS post_likes (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);

-- Bookmarks allow users to save posts for later.  A unique constraint
-- prevents duplicate bookmarks per user per post.
CREATE TABLE IF NOT EXISTS post_bookmarks (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);

-- Comments on posts.  Comments can be nested up to a limited depth via
-- the parent_comment_id field.  The specification allows up to three
-- levels of nesting.  To enforce this, application logic should
-- inspect the depth; the database does not enforce it directly.
CREATE TABLE IF NOT EXISTS comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_edited       BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at       TIMESTAMPTZ,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    likes_count     INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_comment_length CHECK (char_length(content) >= 2 AND char_length(content) <= 1000)
);

-- Likes on comments.  Similar to post likes, each user can like a
-- comment at most once.
CREATE TABLE IF NOT EXISTS comment_likes (
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (comment_id, user_id)
);

-- Mentions within comments.  When a user mentions another user in a
-- comment (using @username), we record the relationship here to
-- support notification delivery【673997057214084†L232-L244】.
CREATE TABLE IF NOT EXISTS comment_mentions (
    comment_id   UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (comment_id, mentioned_user_id)
);

--
-- Q&A: questions, answers and votes
--
-- Questions allow users to ask for help.  Each question has a title,
-- body and associated tags.  An accepted answer is referenced via
-- accepted_answer_id.  Views and counts may be maintained via
-- additional columns if needed.
CREATE TABLE IF NOT EXISTS questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    body            TEXT NOT NULL,
    status          post_status_enum NOT NULL DEFAULT 'published',
    accepted_answer_id UUID REFERENCES answers(id) ON DELETE SET NULL,
    views_count     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_question_title_length CHECK (char_length(title) >= 10),
    CONSTRAINT chk_question_body_length CHECK (char_length(body) >= 10)
);

-- Association table for tags on questions.  Questions must have at
-- least one and at most five tags.
CREATE TABLE IF NOT EXISTS question_tags (
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    tag_id      UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, tag_id)
);

-- Answers to questions.  Answers are limited to 50 words by
-- application logic.  Each answer belongs to one question and has an
-- author.  The is_accepted flag indicates if the answer is selected
-- as the accepted answer.【251730448688923†L166-L173】
CREATE TABLE IF NOT EXISTS answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body        TEXT NOT NULL,
    is_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    votes_count INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_answer_length CHECK (char_length(body) >= 10)
);

-- Votes on questions and answers.  A positive value represents an
-- upvote and a negative value represents a downvote.  Each user can
-- vote at most once per question or answer.
CREATE TABLE IF NOT EXISTS votes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id  UUID REFERENCES questions(id) ON DELETE CASCADE,
    answer_id    UUID REFERENCES answers(id) ON DELETE CASCADE,
    value        SMALLINT NOT NULL CHECK (value IN (1, -1)),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_vote_target CHECK (
        (question_id IS NOT NULL AND answer_id IS NULL) OR
        (question_id IS NULL AND answer_id IS NOT NULL)
    ),
    CONSTRAINT uq_votes_unique UNIQUE (user_id, question_id, answer_id)
);

--
-- Messaging (personal & group chat)
--

-- Conversations table.  A conversation may be a direct chat between
-- two users or a group chat.  For direct chats, we enforce that
-- exactly two participants exist at the application layer.  A
-- conversation can contain many messages.
CREATE TABLE IF NOT EXISTS conversations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type         conversation_type_enum NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ
);

-- Participants in a conversation.  Each conversation must have at
-- least one participant.  The role field determines whether a user
-- has admin or owner rights in a group chat.  is_muted controls
-- notification behaviour.  last_read_message_id helps implement
-- read receipts【673997057214084†L232-L244】.
CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            participant_role_enum NOT NULL DEFAULT 'member',
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_muted        BOOLEAN NOT NULL DEFAULT FALSE,
    last_read_message_id UUID REFERENCES messages(id),
    PRIMARY KEY (conversation_id, user_id)
);

-- Messages within a conversation.  Supports different message types
-- (text, image, file, system).  For media messages we store URLs
-- directly in the message record.  recall information is stored via
-- the recalled_at flag.
CREATE TABLE IF NOT EXISTS messages (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type           message_type_enum NOT NULL DEFAULT 'text',
    content        TEXT,
    file_url       VARCHAR(1000),
    file_name      VARCHAR(255),
    file_type      VARCHAR(100),
    file_size      INTEGER,
    thumbnail_url  VARCHAR(1000),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    recalled_at    TIMESTAMPTZ,
    reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    CONSTRAINT chk_message_content_presence CHECK (
        (type = 'text' AND content IS NOT NULL) OR
        (type IN ('image','file') AND file_url IS NOT NULL)
    )
);

-- Read receipts for conversations.  Tracks the latest message read
-- per participant.  The same information is also stored in
-- conversation_participants.last_read_message_id for convenience.
CREATE TABLE IF NOT EXISTS read_receipts (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    read_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (conversation_id, user_id)
);

-- Mentions within messages.  Used to drive special notifications for
-- @mentions in group chats.
CREATE TABLE IF NOT EXISTS message_mentions (
    message_id       UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (message_id, mentioned_user_id)
);

--
-- Friendship (social graph)
--

-- Friend requests sent from one user to another.  Each request has a
-- status indicating whether it is pending, accepted, declined or cancelled.
CREATE TABLE IF NOT EXISTS friend_requests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status        friend_request_status_enum NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at  TIMESTAMPTZ,
    CONSTRAINT chk_friend_requests_unique UNIQUE (from_user_id, to_user_id),
    CONSTRAINT chk_no_self_request CHECK (from_user_id <> to_user_id)
);

-- Friendships store bidirectional relationships between users.  We
-- store one row per direction (A→B and B→A) to simplify queries such
-- as "list all friends of a user".  Both rows are inserted when a
-- request is accepted.
CREATE TABLE IF NOT EXISTS friendships (
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, friend_id),
    CONSTRAINT chk_no_self_friendship CHECK (user_id <> friend_id)
);

-- Blocks prevent a user from interacting with another user.  When a
-- block exists, other relationships such as friend requests or
-- chats are ignored at the application layer.  A unique constraint
-- ensures a user cannot block the same user twice.
CREATE TABLE IF NOT EXISTS blocks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_blocks_unique UNIQUE (blocker_id, blocked_id),
    CONSTRAINT chk_no_self_block CHECK (blocker_id <> blocked_id)
);

--
-- Groups / communities
--

-- Groups table stores metadata about communities.  Each group is
-- owned by a user and can be public or private【673997057214084†L232-L246】.
CREATE TABLE IF NOT EXISTS groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(120) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    avatar_url  VARCHAR(500),
    cover_url   VARCHAR(500),
    type        group_type_enum NOT NULL DEFAULT 'public',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    status      post_status_enum NOT NULL DEFAULT 'published'
);

-- Tags assigned to groups for categorisation.  A group may have
-- multiple tags.
CREATE TABLE IF NOT EXISTS group_tags (
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    tag_id   UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, tag_id)
);

-- Membership table for groups.  Stores each user's role and status in
-- the group.  The status distinguishes active members from those
-- pending approval or banned.  The role determines privileges【673997057214084†L232-L247】.
CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role     membership_role_enum NOT NULL DEFAULT 'member',
    status   membership_status_enum NOT NULL DEFAULT 'active',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

-- Join requests for private groups.  When a user requests to join a
-- private group, a row is created here.  Upon approval, the row is
-- updated and a corresponding group_members entry is inserted.
CREATE TABLE IF NOT EXISTS group_join_requests (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     friend_request_status_enum NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at TIMESTAMPTZ,
    CONSTRAINT chk_group_join_requests_unique UNIQUE (group_id, user_id)
);

-- Invitations sent to users to join a group.  Invitations may be
-- accepted or rejected; accepted invitations create a group_members
-- entry.  Invites are particularly useful for private groups.
CREATE TABLE IF NOT EXISTS group_invitations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    inviter_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      friend_request_status_enum NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at TIMESTAMPTZ,
    CONSTRAINT chk_group_invitations_unique UNIQUE (group_id, invitee_id)
);

--
-- Notifications
--
-- Notifications inform users about events such as comments, likes,
-- mentions, friend requests and group activity【673997057214084†L135-L143】.  A
-- JSONB field stores event‑specific metadata (for example, post
-- content snippets) to avoid over‑normalising the schema.
CREATE TABLE IF NOT EXISTS notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    type         notification_type_enum NOT NULL,
    target_type  report_target_type_enum,
    target_id    UUID,
    message      TEXT NOT NULL,
    metadata     JSONB,
    status       notification_status_enum NOT NULL DEFAULT 'unread',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at      TIMESTAMPTZ,
    CONSTRAINT chk_notification_target CHECK (
        (target_type IS NOT NULL AND target_id IS NOT NULL) OR
        (target_type IS NULL AND target_id IS NULL)
    )
);

-- Notification settings per user.  Each row indicates whether the
-- user wants to receive realtime notifications for a particular type
-- of event.  By default all notifications are enabled; the
-- application can prepopulate this table with defaults for each user.
CREATE TABLE IF NOT EXISTS notification_settings (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type    notification_type_enum NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (user_id, type)
);

--
-- Reports and moderation
--
-- Reports filed by users against content or other users.  The
-- moderation team reviews pending reports and decides an action.
CREATE TABLE IF NOT EXISTS reports (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type   report_target_type_enum NOT NULL,
    target_id     UUID NOT NULL,
    reason        VARCHAR(100) NOT NULL,
    description   TEXT,
    status        report_status_enum NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at   TIMESTAMPTZ,
    action_taken  TEXT
);

-- Warnings issued to users by moderators.  Multiple warnings within a
-- certain timeframe can trigger automatic suspensions.
CREATE TABLE IF NOT EXISTS user_warnings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason      VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Records of user bans and suspensions.  Temporary bans have an
-- expires_at timestamp; permanent bans leave expires_at NULL.  When a
-- ban is issued, the user is marked banned in the users table.  When
-- the ban expires, application logic should restore the user's
-- previous status.
CREATE TABLE IF NOT EXISTS user_bans (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason      VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ,
    lifted_at   TIMESTAMPTZ
);

--
-- Additional indexes to improve query performance
--

-- Index on posts for fast retrieval by author and creation time.  This
-- supports newsfeed queries that order posts by recency and filter by
-- author.
CREATE INDEX IF NOT EXISTS idx_posts_author_created_at ON posts (author_id, created_at DESC);

-- Index on comments for efficient lookup of comments per post ordered
-- by creation time.
CREATE INDEX IF NOT EXISTS idx_comments_post_created_at ON comments (post_id, created_at ASC);

-- Index on votes to quickly tally votes on questions and answers.
CREATE INDEX IF NOT EXISTS idx_votes_question_id ON votes (question_id);
CREATE INDEX IF NOT EXISTS idx_votes_answer_id ON votes (answer_id);

-- Index on conversation participants for efficient lookup of
-- conversations per user.
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants (user_id);

-- Index on messages for retrieving the latest messages per conversation.
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON messages (conversation_id, created_at DESC);

-- Index on notifications for quickly showing unread notifications for
-- a user.
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications (user_id, status);
