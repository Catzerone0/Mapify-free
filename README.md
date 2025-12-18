# MindMap - Full-Stack Collaborative Mind Mapping Application

A production-ready Next.js 16 application with authentication, database layer (Prisma + PostgreSQL), and secure LLM API key management.

## Features

### ✅ MVP (Minimum Viable Product)
- **Next.js 16 App Router** with React 19 Server Components
- **Tailwind CSS v4** with comprehensive theming (light/dark mode)
- **Authentication**: Email/password authentication with session management
- **Database**: Prisma ORM + PostgreSQL with migrations and seeding
- **Workspace Management**: Single-tenant workspaces with role-based access
- **LLM Integration**: Secure encrypted storage and management of API keys
- **UI Components**: Button, Input, Card components with accessibility
- **State Management**: Zustand for session and workspace context
- **Backend Infrastructure**:
  - Typed error handling
  - Logging utilities
  - Rate limiting
  - API response formatting
  - Health check endpoint
- **Content Ingestion Pipeline** (NEW):
  - Multi-source content ingestion (Text, YouTube, PDF, Web, WebSearch)
  - Background job processing with BullMQ
  - Chunking and normalization for LLM consumption
  - Status tracking and error handling
  - Citation generation and source attribution
  - Comprehensive testing suite

### 🎯 Nice-to-Have (Future)
- Multi-tenant organizations
- Usage metering and analytics
- Admin dashboards
- OAuth providers (Google, GitHub)
- Redis caching and job queue
- Advanced LLM integrations

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **UI**: React 19, Tailwind CSS v4
- **Forms**: React Hook Form + Zod validation
- **State**: Zustand
- **Styling**: Tailwind CSS with CSS variables

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth v5 (beta)
- **Jobs**: BullMQ for background processing
- **Encryption**: CryptoJS for API key encryption
- **Content Processing**:
  - `youtube-transcript` for YouTube video transcripts
  - `pdf-parse` for PDF text extraction
  - `@mozilla/readability` for web page content extraction
  - `jsdom` for HTML parsing
  - `cheerio` for web scraping

### DevTools
- **Testing**: Ready for Jest/Vitest
- **Linting**: ESLint 9 with Next.js config
- **Type Checking**: TypeScript 5

## Getting Started

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL 12+ (or Supabase account)
- Git
- nvm (Node Version Manager) - [Install nvm](https://github.com/nvm-sh/nvm)

### Installation

1. **Clone and set up Node.js version**:
```bash
git clone <repo-url>
cd project
nvm install  # Installs Node.js version from .nvmrc file
nvm use      # Uses the Node.js version specified in .nvmrc
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mindmap_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-char-secret-key-here"
ENCRYPTION_KEY="your-32-char-encryption-key"
```

4. **Generate Prisma Client**:
```bash
npm run db:generate
```

5. **Run database migrations**:
```bash
npm run db:migrate
```

6. **Seed demo data** (optional):
```bash
npm run db:seed
```

7. **Start development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

### Local PostgreSQL
```bash
# Install PostgreSQL if not already installed
brew install postgresql  # macOS
# or use: apt-get install postgresql  # Linux

# Start PostgreSQL
brew services start postgresql

# Create database
createdb mindmap_db
```

### Supabase (Cloud Alternative)
1. Create project at [supabase.com](https://supabase.com)
2. Copy the PostgreSQL connection string
3. Use it as `DATABASE_URL` in `.env.local`

## Project Structure

```
/app
  /api
    /auth
      /login          # User login endpoint
      /register       # User registration endpoint
    /llm-keys         # LLM API key management endpoints
    /workspaces       # Workspace CRUD operations
    /health           # Health check endpoint
  /auth
    /login            # Login page
    /signup           # Signup page
  /dashboard          # Main dashboard
  /onboarding         # Onboarding flow
  /settings           # User settings & API keys management
  layout.tsx          # Root layout
  page.tsx            # Home page (redirects to dashboard)

/lib
  auth.ts             # NextAuth configuration
  db.ts               # Prisma client singleton
  encryption.ts       # API key encryption/decryption
  errors.ts           # Custom error classes
  logger.ts           # Logging utilities
  middleware.ts       # Request middleware
  rate-limit.ts       # Rate limiting
  queue.ts            # Job queue configuration
  feature-flags.ts    # Feature flag management
  api-response.ts     # API response formatting
  providers.tsx       # React providers
  /stores
    auth.ts           # Auth store (Zustand)
    workspace.ts      # Workspace store (Zustand)

/components
  Button.tsx          # Button component
  Input.tsx           # Input component
  Card.tsx            # Card components

/prisma
  schema.prisma       # Database schema
  seed.js             # Seed data script
  /migrations         # Database migrations

```

## API Routes

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login, returns JWT token

### Workspaces
- `GET /api/workspaces` - List user's workspaces (requires auth)
- `POST /api/workspaces` - Create new workspace (requires auth)

### LLM API Keys
- `GET /api/llm-keys` - List saved API keys (requires auth, returns metadata only)
- `POST /api/llm-keys` - Add new LLM API key (encrypted storage)
- `DELETE /api/llm-keys/[id]` - Remove API key

### Utilities
- `GET /api/health` - Health check endpoint

## Authentication

### Session Management
- Sessions are stored in database with expiration
- Tokens are stored in browser localStorage
- Automatic session restoration on app load
- 30-day default session expiration

### Protected Routes
API routes can be protected using the `extractSession()` middleware:

```typescript
import { extractSession } from "@/lib/middleware";

export async function POST(request: NextRequest) {
  const session = await extractSession(request);
  if (!session) {
    throw new AuthenticationError();
  }
  // Route logic here
}
```

## Secure LLM API Key Storage

### How It Works
1. **Encryption**: API keys are encrypted using AES encryption with `ENCRYPTION_KEY`
2. **Storage**: Encrypted keys stored in database `UserProviderKey` table
3. **Retrieval**: Keys decrypted on-demand per request
4. **Security**: Original keys never logged or exposed in responses

### Environment Variables Required
```env
ENCRYPTION_KEY="must-be-at-least-32-characters"
```

### Usage Example
```typescript
import { encryptApiKey, decryptApiKey } from "@/lib/encryption";

// Encrypt before storage
const encrypted = encryptApiKey(userApiKey);
await db.userProviderKey.create({
  data: {
    provider: "openai",
    encryptedKey: encrypted,
  }
});

// Decrypt when needed
const decrypted = decryptApiKey(storedKey.encryptedKey);
// Use decrypted key for API calls
```

## Rate Limiting

Built-in rate limiting prevents abuse:
- **API endpoints**: 100 requests/minute
- **Auth endpoints**: 5 requests/minute  
- **LLM key operations**: 10 requests/minute

Stored in-memory (for single instance). For distributed systems, use Redis:

```typescript
// Configure in environment
REDIS_URL="redis://localhost:6379"
```

## Logging

Structured logging with context:

```typescript
import { logger } from "@/lib/logger";

logger.info("User logged in", {
  userId: user.id,
  email: user.email,
});

logger.error("Database error", error, {
  userId: session.userId,
  requestId: request.id,
});
```

## Feature Flags

Enable/disable features without redeployment:

```typescript
import { featureFlags, FeatureFlag } from "@/lib/feature-flags";

if (featureFlags.isEnabled(FeatureFlag.OAUTH_GOOGLE)) {
  // Show Google OAuth option
}
```

## Development Scripts

```bash
# Development
npm run dev              # Start dev server

# Database
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run migrations
npm run db:migrate:deploy  # Deploy migrations (production)
npm run db:seed         # Seed demo data

# Building
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
```

## Environment Variables

### Required
```env
DATABASE_URL=           # PostgreSQL connection string
NEXTAUTH_SECRET=        # Min 32 characters
ENCRYPTION_KEY=         # Min 32 characters for API key encryption
NEXTAUTH_URL=           # App URL
```

### Optional
```env
REDIS_URL=              # Redis connection (for job queue)
NEXT_PUBLIC_APP_NAME=   # App display name
```

See `.env.example` for more details.

## Database Models

### User
- `id`: Unique identifier
- `email`: Unique email
- `name`: User's display name
- `password`: Hashed password
- Relations: `sessions`, `workspaces`, `providerKeys`

### Session
- `id`: Session ID
- `userId`: User reference
- `token`: Authentication token
- `expiresAt`: Session expiration
- Relations: `user`

### Workspace
- `id`: Workspace ID
- `name`: Workspace name
- `members`: WorkspaceMember array
- `mindMaps`: MindMap array
- Relations: `members`, `mindMaps`, `templates`

### UserProviderKey
- `id`: Key ID
- `userId`: User reference
- `provider`: LLM provider (openai, anthropic, google)
- `encryptedKey`: Encrypted API key
- Relations: `user`

### MindMap
- `id`: Map ID
- `title`: Map title
- `description`: Optional description
- `workspaceId`: Workspace reference
- `nodes`: MapNode array

### MapNode
- `id`: Node ID
- `mindMapId`: MindMap reference
- `content`: Node content
- `x`, `y`: Position coordinates
- `attachments`: ContentAttachment array

For full schema, see `prisma/schema.prisma`.

## Performance Considerations

### Optimization
- ✅ Server Components for faster initial load
- ✅ Automatic code splitting with dynamic imports
- ✅ CSS-in-JS with Tailwind (optimized)
- ✅ Database query optimization with Prisma

### Future Improvements
- Add Redis caching layer
- Implement database query batching
- Add CDN for static assets
- Implement pagination for lists
- Add database indexes for common queries

## Security Features

### Implemented
- ✅ Password hashing with bcrypt
- ✅ API key encryption at rest
- ✅ Session management with token validation
- ✅ Rate limiting to prevent abuse
- ✅ CORS and security headers (via Next.js defaults)
- ✅ Input validation with Zod

### Recommendations
- Use HTTPS in production
- Set `NEXTAUTH_SECRET` to random string (generate with `openssl rand -base64 32`)
- Keep dependencies updated: `npm audit`, `npm update`
- Use environment variables for all secrets
- Implement CSRF protection headers
- Add HTTPS redirect middleware

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Ensure PostgreSQL is running: `brew services start postgresql`
- Check DATABASE_URL is correct in `.env.local`
- Verify database exists: `psql postgres -l | grep mindmap_db`

### Prisma Client Not Found
```
Error: cannot find module '@prisma/client'
```
Run: `npm run db:generate`

### Migration Conflicts
```
Error: P3005 The database schema is not in sync
```
Run: `npm run db:migrate:deploy`

### Session/Auth Issues
- Clear localStorage: `localStorage.clear()` in browser console
- Check NEXTAUTH_SECRET is at least 32 characters
- Verify token is valid: Check browser Network tab for auth headers

## Production Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import repo in Vercel dashboard
3. Add environment variables
4. Run migrations: `npm run db:migrate:deploy`
5. Deploy!

### Other Platforms
1. Ensure Node.js 20+ is available (or use `nvm install` and `nvm use` if nvm is available)
2. Set all environment variables
3. Run migrations before starting: `npm run db:migrate:deploy`
4. Start app: `npm run start`

### Pre-deployment Checklist
- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] Tests pass (setup needed)
- [ ] NEXTAUTH_SECRET is random and secure
- [ ] ENCRYPTION_KEY is random and secure

## Content Ingestion Pipeline

The application includes a comprehensive content ingestion system for processing multiple content sources. See `INGESTION_PIPELINE.md` for full documentation.

### Quick Start

```typescript
import { ingestionService } from '@/lib/ingest';

// Ingest content
const ingestionId = await ingestionService.createIngestionJob({
  workspaceId: 'workspace_id',
  userId: 'user_id',
  sourceType: 'youtube',
  payload: {
    url: 'https://www.youtube.com/watch?v=VIDEO_ID',
    videoId: 'VIDEO_ID',
  },
});

// Get processed content
const content = await ingestionService.getProcessedContent(ingestionId);
```

### Supported Sources

- **Text**: Direct text paste with normalization
- **YouTube**: Automatic transcript extraction
- **PDF**: Text extraction from PDF documents
- **Web**: Content extraction from web pages
- **WebSearch**: Aggregated search results (Tavily, SerpAPI, Bing)

### API Endpoints

- `POST /api/ingest` - Create ingestion job
- `GET /api/ingest` - List content sources
- `GET /api/ingest/[id]/status` - Poll ingestion status
- `GET /api/ingest/[id]/content` - Retrieve processed content

See `INGESTION_PIPELINE.md` and `INGESTION_INTEGRATION.md` for complete documentation.

## Contributing

This is a full-stack foundation ready for feature development. Key areas for contribution:

1. **MindMap Features**: Node editing, canvas rendering, export functionality
2. **Collaboration**: Real-time sync, sharing, permissions
3. **LLM Integration**: Use saved keys for AI features
4. **Content Sources**: Additional ingestion connectors (email, RSS, audio)
5. **UI/UX**: Enhanced components, animations, accessibility
6. **Testing**: Unit tests, integration tests, E2E tests

## License

MIT

## Support

For issues or questions, please refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
