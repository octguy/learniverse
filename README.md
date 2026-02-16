# Learniverse

A social learning platform that connects students and learners to share knowledge, collaborate, and grow together. Built with Spring Boot and Next.js.

## Overview

Learniverse is a feature-rich social network designed specifically for learning enthusiasts. Connect with like-minded people, share knowledge through posts and Q&A, join study groups, and engage in meaningful academic discussions.

## Key Features

- **User Authentication** - Multi-provider login (Google, Email, Facebook) with JWT authentication
- **Learning Profiles** - Customizable profiles with interests, subjects, and goals
- **Academic Posts** - Rich content creation with Markdown, LaTeX math formulas, and file uploads
- **Q&A System** - Ask questions, provide answers, and vote on quality responses
- **Real-time Chat** - Direct messaging and group chats with WebSocket support
- **Social Connections** - Friend system with requests, suggestions, and notifications
- **Study Groups** - Create and manage public/private learning communities
- **Engagement** - Comments, mentions (@username), bookmarks, and reactions
- **Smart Features** - AI-powered content moderation, semantic search, and personalized feed recommendations
- **Real-time Notifications** - Instant updates for interactions, mentions, and invitations

## Tech Stack

### Frontend
- **Framework:** Next.js 15 with React 19
- **Language:** TypeScript
- **Styling:** TailwindCSS v4
- **UI Components:** Radix UI, shadcn/ui
- **State Management:** React Hooks
- **Editor:** Markdown + LaTeX support (KaTeX)
- **Real-time:** STOMP over WebSocket

### Backend
- **Framework:** Spring Boot
- **Language:** Java
- **Build Tool:** Gradle
- **Security:** Spring Security + JWT + OAuth2
- **Database:** PostgreSQL
- **Cache:** Redis
- **Real-time:** Spring WebSocket + STOMP
- **File Storage:** S3-compatible storage
- **Search:** Elasticsearch/Meilisearch

### AI & ML
- **Content Moderation:** OpenAI Moderation API / Perspective API
- **Semantic Search:** Vector embeddings (pgvector/Milvus)
- **Recommendations:** Collaborative filtering + graph-based algorithms

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Orchestration:** Kubernetes (optional)
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana

## Prerequisites

- **Node.js** 20+ and npm
- **Java** 17+
- **Docker** and Docker Compose
- **PostgreSQL** 14+
- **Redis** 7+

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/octguy/learniverse.git
cd learniverse
```

### 2. Environment Setup

Create `.env` files for both frontend and backend:

**Backend (.env in learniverse-be/):**
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/learniverse
SPRING_DATASOURCE_USERNAME=your_username
SPRING_DATASOURCE_PASSWORD=your_password
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379
JWT_SECRET=your_jwt_secret_key
OAUTH2_GOOGLE_CLIENT_ID=your_google_client_id
OAUTH2_GOOGLE_CLIENT_SECRET=your_google_client_secret
S3_BUCKET_NAME=your_s3_bucket
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key
```

**Frontend (.env.local in learniverse-fe/):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

### 3. Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 4. Manual Setup

**Backend:**
```bash
cd learniverse-be
./gradlew build
./gradlew bootRun
```

**Frontend:**
```bash
cd learniverse-fe
npm install
npm run dev
```

**Comment Scanner Service:**
```bash
cd learniverse-commentscan
# Follow service-specific instructions
```

## Project Structure

```
learniverse/
├── learniverse-be/           # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/         # Java source code
│   │   │   └── resources/    # Application configs
│   │   └── test/             # Backend tests
│   ├── build.gradle
│   └── Dockerfile
├── learniverse-fe/           # Next.js frontend
│   ├── src/
│   │   ├── app/              # Next.js app directory
│   │   ├── components/       # React components
│   │   ├── lib/              # Utilities and configs
│   │   └── hooks/            # Custom React hooks
│   ├── package.json
│   └── next.config.js
├── learniverse-commentscan/  # AI moderation service
├── docker-compose.yml        # Docker orchestration
└── README.md
```

## Access the Application

- **Frontend:** http://localhost:8386
- **Backend API:** http://localhost:8080/api
- **API Documentation:** http://localhost:8080/swagger-ui.html

## Development

### Running Tests

**Backend:**
```bash
cd learniverse-be
./gradlew test
```

**Frontend:**
```bash
cd learniverse-fe
npm test
```

### Code Style

**Frontend:**
```bash
npm run lint
```

**Backend:**
Follow standard Java/Spring Boot conventions and use IDE formatting tools.

## Core Features Documentation

### 1. User Authentication & Profiles
- OAuth2 integration (Google, Facebook)
- Email/password authentication with OTP verification
- Profile customization with subjects, interests, and learning goals

### 2. Content Creation
- Rich text editor with Markdown support
- LaTeX math formula rendering
- File uploads (images up to 5MB, PDFs up to 15MB)
- Real-time preview
- Edit window (24 hours post-creation)

### 3. Q&A System
- Question posting with tag suggestions
- Community answers with upvoting
- Best answer selection
- AI-powered duplicate detection

### 4. Chat & Messaging
- Real-time 1-on-1 direct messaging
- Group chat with member management
- Message recall within 24 hours
- File sharing and chat history
- Online/offline status indicators

### 5. Social Features
- Friend requests and connections
- AI-powered friend suggestions
- Follow/unfollow functionality
- Privacy controls

### 6. Groups & Communities
- Public and private study groups
- Role-based permissions (owner, moderator, member)
- Group feed and file storage
- Member management tools

### 7. Engagement
- Threaded comments
- @mentions with notifications
- Bookmarking posts
- Reaction system

### 8. Smart Features
- AI content moderation (toxic/spam filtering)
- Semantic search across content
- Personalized feed recommendations
- Real-time notification system

## API Documentation

API documentation is available via Swagger UI when running the backend:

```
http://localhost:8080/swagger-ui.html
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Format

```
type: subject

body (optional)
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Open an issue on GitHub
- Contact the development team

## Roadmap

- [ ] Mobile applications (iOS/Android)
- [ ] Video content support
- [ ] Live study sessions
- [ ] Advanced analytics dashboard
- [ ] Integration with learning management systems (LMS)
- [ ] Gamification features (badges, achievements)

## Acknowledgments

Built with modern technologies and best practices to create a seamless learning experience for students worldwide.

---

Made with dedication by the Learniverse team
