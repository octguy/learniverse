# Learniverse (A Social Network for Learning Enthusiasts)

Learniverse is a social learning platform that helps students and learners connect, share knowledge, and grow together. Here, you can connect with like-minded people, share interesting knowledge, and join academic communities to ask and answer questions, expanding your network.

# Core Features

## 1) Registration / Login & Learning Profile

### Goal:

Quick access to the system, profile shows “what the learner studies – what they need”.

### User stories

- I log in via Google/Email/Facebook; set a display name.
- I select subjects/interests (tags), education level, and goals.
- I update avatar/bio.

### Flow/UX

- 2-step onboarding: (1) auth → (2) select 3–5 interested subjects (tags).
- Remind to complete profile when < 60% done.

### Permissions & Security

- JWT + refresh.
- Email verification (OTP)

### Edge cases

- Duplicate email, account locked, change email.

## 2) Newsfeed & Academic Posts

### Goal:

Create/share learning content and personal knowledge.

### User Stories:

- I want to post articles containing text, math formulas, and images to share knowledge and get feedback from the community.
- I want to edit my post within 24 hours to fix typos or add missing info.
- I want to upload PDF/image files with my post to make it clearer.
- I want to preview my post to ensure Markdown and LaTeX formatting is correct.

### Must-have:

- _Create post_

  - Users can open an editor to create new posts.

  - Editor supports basic Markdown formatting (heading, bold, list, link, code block).

  - Supports LaTeX math formulas (rendered after posting).

  - Users must select at least one tag (subject or topic).

  - After posting, the system saves and displays the post with correct formatting in the feed.

  - Post time and author name are shown with the post.

- _Upload files & basic images_

  - Users can insert at least one illustration image (PNG/JPEG ≤ 5MB).

  - Users can upload PDF files ≤ 15MB.

  - If file exceeds allowed size → show error message.

  - Files are securely stored on server (S3/Cloud storage) and return a URL.

  - Images display directly in the post, PDFs show download/preview link.

- _Edit post_

  - Users can only edit their own posts within 24h.

  - Each edit is timestamped.

  - After 24h, “Edit” button is hidden (except for admin/mod).

  - If a post is edited → show “Edited” label with last edit time.

- _Preview_

  - Editor has a Preview button to switch to preview mode.

  - Markdown, LaTeX, images, attachments display correctly.

  - Users can return to edit mode without losing data.

  - Preview content must match 100% with the final post.

  - If there are Markdown/LaTeX syntax errors → show warning, don’t crash.

### Should-have

- Editor with intuitive toolbar (bold/italic, code block, insert LaTeX, live preview).

- Auto-save draft while writing but not yet posted.

- Save edit history (at least original + latest version).

- Placeholder “File no longer exists” if file is deleted from server.

## 3) Q&A

### Goal:

Solve questions quickly and with quality.

### User stories:

- Ask questions (similar to posting)
- Answer questions.

### Flow/UX:

- Question form suggests tags & “similar questions already asked” (AI)

### Must-have:

- Limit answer length (< 50 words)
- No file upload in answers
- Everyone can see answers; quality answers get +1 Upvote. The answer with most Upvotes appears at the top.

### Should-have:

- If user creates a post but it’s a question, prompt to switch to Q&A mode.
- Filter spam/negative answers (AI). (can be moved to must-have)

## 4) Personal & Group Chat

### Goal:

Chat with others, create group chats.

### User stories:

- Direct Message: I want to privately message another user to discuss homework or share personal info.
- Group chat: As a member of a class/study group, I want to join group chats for quick exchanges.

### Must-have:

- Users can send/receive real-time text messages (WebSocket).
- User A opens user B’s profile → clicks “Message”.
- Messages display in chronological order (latest → bottom).
- Personal chat: 1-1 between two users.
- Group chat: multiple members, with group name and member list.
- Show basic info: avatar, sender name, send time.
- Can recall sent messages within allowed time (1 day)
- Users can view chat history (saved in DB).
- Notification for new messages.
- Can leave group or add new members.

### Should-have:

- Send files/images (with preview).
- Pin important messages in group.
- Search chat history.
- Show online/offline status.
- Thread (reply to specific message in group).

### Good-to-have:

- Show “typing…” indicator.
- Read receipt / seen.
- Reactions (👍❤️😂) for messages.

### Flow / UX:

1. User opens personal or group chat → sees message list.
2. Type content → send → message displays instantly for both sides.
3. Old messages can be scrolled (infinite scroll).
4. In group: view member list, add/remove, leave group.
5. New message → show notification + unread badge.
6. Sender can recall message within X minutes.

### Edge Cases:

- Permissions:
  - Blocked users → cannot send messages.
  - Member leaves/kicked → cannot see new messages.
- Messages:
  - Too long → show error.
  - Lost connection → message shows “Sending…” until sent.
  - Recalled → show “Message has been recalled” placeholder.
- Notification:
  - Read on device A → sync status to device B.
  - Turn off notification → message still saved but not pushed.
- File/image:
  - Exceeds allowed size → show error.
  - Upload failed → retry.
  - File deleted from server → show “File no longer exists”.

## 5) Friendship Feature

### Goal:

- Create connections between users, build a learning network.
- Allow users to follow activities, chat more easily with friends.

### User Stories:

- I want to send friend requests to classmates so we can follow each other’s activities.
- I want notifications for friend requests so I can accept or decline.
- I want to view my friends list for easy messaging or group invites.

### Must-have:

- Users can send friend requests to others.
- Recipients can accept or decline requests.
- After acceptance → both become friends.
- Friends list shown in profile.
- Notification for new friend requests.
- Cannot send friend request to someone already a friend or with a pending request.

### Should-have:

- Cancel friend request (if pending).
- Unfriend.
- Friend suggestions based on shared classes/groups or subject tags.
- Search friends list.

### Good-to-have:

- Light follow: allow one-way follow to view activities.
- AI-based friend suggestions (based on reading, Q&A behavior).
- Mutual friends: show shared friends.
- Privacy setting: only friends can see posts/private info.
- Periodic friend suggestions (“You have 5 new friend suggestions this week”).

### Flow/UX:

1. User A visits B’s profile → clicks “Add Friend”.
2. If no relationship: system creates pending request.
3. User B gets notification → can Accept or Decline.
4. If accepted → both added to each other’s friends list.
5. Users can view all friends in “Friends” tab in profile.
6. From friends list → can Message, Invite to group, Unfriend.

### Edge cases:

- A sends request to B but B has blocked A → auto decline.
- A and B are already friends → “Add Friend” button hidden.
- If account deleted → friendship also deleted.

## 6) Group/Community Feature

### Goal:

- Allow users to create study communities/groups (e.g. “Calculus 1 – Class of 2023”).
- Connect people with shared interests to share posts, discuss, store documents.
- Manage group members (add, invite, kick, leave).

### User Stories:

- As a student, I want to create study groups for friends to join and exchange knowledge.
- As a user, I want to join or leave groups as needed.
- As group owner/mod, I want to manage members (add, remove, assign roles) to keep quality.
- As group member, I want to see group feed with posts and comments for discussion.

### Must-have:

- Users can create groups with name, description, avatar.
- Group types: public (anyone can join) or private (invite/approval required).
- Basic member management: join, leave, invite, kick.
- Group feed: only show posts belonging to group.
- Show member list.
- Owner can transfer ownership when leaving group.

### Should-have:

- Roles: owner, moderator, member.
- Pin posts in group.
- Notification for new group posts.
- List of uploaded files/documents in group.
- Allow subject tags for group for search suggestions.

### Good-to-have:

- Group event calendar (study session, meeting).
- Integrated group chat (linked to chat module).
- Auto-suggest related groups based on subject tags.

### Flow/UX:

1. User selects “Create new group”.
2. Fill info: Name, Description, Avatar, Group type (public/private), Subject tags.
3. Click Create → system saves group and assigns creator as owner.
4. Other members:
   - Public group → click “Join” to participate.
   - Private group → click “Request to Join” → owner/mod approves.
5. In group, show tabs: Feed | Members | About.
6. Users can leave group anytime.

### Edge Cases:

- Group creator leaves → system must assign/transfer ownership.
- Private group: user requests join but is declined → cannot access content.
- If group deleted → all posts/files/chat in group also deleted or archived.
- Kicked members → can see previous history but not new content.

## 7) Comments, @mention, Bookmark

### Goal:

- Allow short discussions under posts/questions.
- Mention to invite others to join.
- Bookmark to save important posts.

### User Stories:

- As a student, I want to comment on posts to exchange ideas.
- As a user, I want to @mention classmates so they see and join.
- As a learner, I want to save posts to review later.

### Must-have:

- Threaded comments (can reply).
- Mention user with @Name syntax.
- Save (bookmark) posts and view saved list.
- Show comment and bookmark counts.

### Should-have:

- Emoji support in comments.
- Basic Markdown for comments (bold, code).
- Allow edit or delete own comments.
- Suggest users when typing “@”.

### Good-to-have:

- React to comments (👍❤️😂).
- Quote part of content to reply.
- Tag comments for categorization (e.g. “explanation”, “question”).

### Flow/UX:

1. User opens post → sees comment box.
2. Write comment → send → displays instantly in thread.
3. Type “@” → suggest user list to mention.
4. Bookmark post → show “Saved” button.
5. Saved bookmarks viewable in profile.

### Edge cases:

- Delete parent comment → child comments become orphan (hide or keep?).
- Mentioned user without access → no notification sent.
- Duplicate bookmark → only save once.

## 8) Notification & Realtime

### Goal:

- Users know instantly when someone answers, mentions, or invites to group.
- Badge shows unread notification count in realtime.

### User Stories:

1. As a user, I want notifications when someone answers my question.
2. As a user, I want to see realtime unread badge count.

### Must-have:

- In-app notification for answer/comment/mention/invite.
- Realtime unread badge count.
- Notification list with type (answer, mention, invite).
- Allow marking notifications as read individually or all.

### Should-have:

- Group notifications by type (e.g. “3 people commented on your post”).
- Filter notifications by type (learning, system, group).
- Show small preview link in notification.

### Flow/UX:

1. Someone answers/mentions/invites → system creates notification.
2. Notification pushed via WebSocket → shows instantly (badge + popup).
3. User clicks notification → goes to detailed content.
4. User can mark as read.

### Edge cases:

- Large fan-out: 1 event (new group post) → sent to thousands.
- Retry on lost connection → need idempotency to avoid duplicates.
- User turns off notification → only saved in list, not pushed.

# What AI Can Do

## 1. Toxic Comment Moderation

### Goal:

- Keep learning environment healthy.
- Prevent spam, toxic, hate speech, sexual, ads.

### How it works:

1. When user submits comment, system calls AI moderation API.
2. AI returns scores (e.g. toxic=0.85, spam=0.2).
3. If above threshold (toxic > 0.8) → auto delete.
4. If warning level (0.5–0.8) → show to user but flag for mod.

### Technology:

- Model: OpenAI moderation API, Perspective API (Google), or open-source models like Detoxify (BERT fine-tuned).
- Pipeline: API Gateway → Moderation Service (AI) → DB → Notification mod.

## 2) Semantic Search

### Goal:

- Users search content by meaning, not just keywords.
- Support Vietnamese with/without accents, typos.

### How it works:

- When user enters query, system:
  - Step 1: Normalize (lowercase, remove accents, typo correction via AI).
  - Step 2: Use embedding model to encode query → vector.
  - Step 3: Compare with content vectors (posts, questions, groups, users).
  - Step 4: Combine BM25 (keyword) + cosine similarity (semantic).

### Technology:

- Embedding model: OpenAI text-embedding-3-small, Cohere, or PhoBERT/viBERT (for on-premise).
- DB for vectors: Postgres + pgvector or Weaviate / Milvus.
- Search engine: Meilisearch or Elasticsearch + Vietnamese analyzer plugin.

### KPI:

- CTR (click-through rate) after search.
- Time-to-result < 300ms.
- Recall@k and MRR (Mean Reciprocal Rank).

## 3) Newsfeed Recommendation System

### Goal:

- Personalize newsfeed by:
  - Friends (friend graph).
  - Interested subject tags.
  - Behavior (like, comment, bookmark).

### How it works:

- Candidate generation (pre-filter):
  - Get posts from direct friends.
  - Get posts with tags matching user profile.
  - Get trending posts (most votes in 24h).

### Technology:

- Embedding model for post & user: same as search.
- Recommender system:
  - Collaborative filtering (user–item matrix).
  - Graph-based recommend (PageRank on friend graph).
  - Hybrid (tag-based + friend-based + embedding).
- Infrastructure:
  - Candidate store = Redis/Elasticsearch.
  - Ranking model = LightGBM/NN (trained from click/vote logs).

### KPI:

- Avg session length (users browse feed longer).
- CTR for posts in feed.
- Diversity (not too repetitive).
- Retention D7 (user retention after 7 days).

## Overall Data Flow

### 1. Input:

Content (post, comment, group, tags) + user behavior (like, comment, save, follow).

### 2. AI pipeline:

- Moderation → filter toxic/spam comments.
- Embedding → save vectors for search & recommend.
- Ranking → personalized feed sorting.

### 3. Output:

- Safe comments.
- Accurate, semantic search.
- Personalized newsfeed by friends & tags.

## Summary

- Moderation: AI NLP filters toxic/spam, helps mods avoid overload.
- Search: AI semantic search + typo correction, supports Vietnamese.
- Newsfeed: AI recommender combines friends + subject tags + behavior → personalized feed.


# Tech-stack

## 1. Frontend

- Framework: React or Next.js (SSR/SEO, good for feed & search).

- Language: TypeScript (safe, scalable code).

- UI/Styling: TailwindCSS + shadcn/ui (easy to customize, modern).

- State Management: Zustand or Redux Toolkit (manage user/profile, feed, chat state).

- Realtime: Socket.IO client or WebSocket API.

- Editor: TipTap/Quill.js + Markdown + LaTeX support (MathJax/KaTeX).

- Build tool: Vite (fast, well integrated with TS/React).

## 2. Backend

- Framework: 🚀 Spring Boot

  - Web: Spring Web / Spring MVC (REST API).

  - Auth & Security: Spring Security + JWT + OAuth2 (Google/Facebook login).

  - Database Access: Spring Data JPA + Hibernate.

  - Realtime: Spring WebSocket / STOMP for chat & notification.

  - Validation: Hibernate Validator (handle registration, post forms).

- Database:

  - Relational: PostgreSQL (store user, post, comment, friends, groups).

  - Vector DB: PostgreSQL + pgvector or Milvus (for semantic search & recommender).

- Cache & session: Redis (cache feed, notification, ranking).

- File storage: AWS S3 / GCP Cloud Storage / MinIO (images, PDF).

- Search engine: Elasticsearch or Meilisearch (full-text search, Vietnamese analyzer).

## 3. AI & Machine Learning

- Moderation (filter toxic comments):

  - OpenAI Moderation API, Perspective API or Detoxify (on-prem).

- Semantic Search:

  - Embedding model: text-embedding-3-small (OpenAI) or PhoBERT/viBERT (on-prem).

  - Vector DB: pgvector or Milvus.

- Recommendation (Personalized Newsfeed):

  - Candidate generation: get posts from friends, groups, trending.

  - Ranking model: LightGBM or neural network from behavior (click, vote, bookmark).

  - Graph-based: PageRank on friend graph.

## 4. DevOps & Infrastructure

- Containerization: Docker.

- Orchestration: Kubernetes (scale microservices: auth, chat, recommend).

- CI/CD: GitHub Actions / GitLab CI.

- Monitoring: Prometheus + Grafana.

- Logging: ELK Stack (Elasticsearch, Logstash, Kibana).

- Notification Service: Firebase Cloud Messaging (mobile push), WebPush (desktop).

