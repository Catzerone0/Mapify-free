# MindMap Application Setup Guide

This guide will help you set up the MindMap application for development, testing, or production deployment.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Testing Setup](#testing-setup)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd project
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# 3. Set up database
npm run db:setup

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Prerequisites

### Required

- **Node.js 20+** - [Download](https://nodejs.org/)
- **npm 10+** - Comes with Node.js
- **PostgreSQL 12+** - [Download](https://www.postgresql.org/download/) or use [Supabase](https://supabase.com)

### Optional

- **nvm** (Node Version Manager) - [Install Guide](https://github.com/nvm-sh/nvm)
- **Redis** - For production job queue and caching
- **Git** - For version control

## Development Setup

### 1. Install Dependencies

```bash
# Use Node.js version specified in .nvmrc (if using nvm)
nvm install
nvm use

# Install npm packages
npm install
```

### 2. Set Up Environment Variables

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Database - PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/mindmap_dev"

# NextAuth - Session management
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"

# Encryption - For storing LLM API keys
ENCRYPTION_KEY="<generate with: openssl rand -base64 32>"

# App Configuration
NEXT_PUBLIC_APP_NAME="MindMap Dev"
```

**Generate secure secrets:**

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -base64 32
```

### 3. Set Up Database

#### Option A: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@16
brew services start postgresql@16

# Install PostgreSQL (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Create database
createdb mindmap_dev

# Set DATABASE_URL in .env.local
DATABASE_URL="postgresql://postgres:@localhost:5432/mindmap_dev"
```

#### Option B: Supabase (Cloud)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy connection string (use "Connection pooling" for production)
5. Add to `.env.local`:

```env
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

#### Run Database Setup

```bash
# Set up database (generates client, runs migrations, seeds data)
npm run db:setup

# Or skip seeding
npm run db:setup:skip-seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Default credentials (after seeding):**
- Email: `test@example.com`
- Password: `password123`

### 5. Development Commands

```bash
# Start dev server
npm run dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Build for production
npm run build

# Database commands
npm run db:generate        # Generate Prisma client
npm run db:migrate         # Create and apply migration
npm run db:seed            # Seed database with demo data
npm run db:reset           # Reset database (⚠️ deletes all data)
```

## Testing Setup

### Environment Configuration

Tests use SQLite for fast execution. The `.env.test` file is already configured.

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- path/to/test.test.ts
```

### Writing Tests

Create test files with `.test.ts` extension:

```typescript
import { describe, it, expect } from "@jest/globals";

describe("MyFeature", () => {
  it("should work correctly", () => {
    expect(true).toBe(true);
  });
});
```

## Production Deployment

### Environment Variables

Set these in your deployment platform:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secure random string (32+ chars)
- `ENCRYPTION_KEY` - Secure random string (32+ chars)

**Optional:**
- `NEXTAUTH_URL` - Your domain (e.g., `https://yourdomain.com`)
- `REDIS_URL` - Redis connection string (recommended)
- `TAVILY_API_KEY` - For web search ingestion
- `NEXT_PUBLIC_APP_NAME` - App display name

### Deployment Platforms

#### Vercel (Recommended)

1. **Push to GitHub**
2. **Import in Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
3. **Add Environment Variables**
   - Go to Settings → Environment Variables
   - Add all required variables
4. **Deploy**
   - Vercel auto-deploys on git push
   - Migrations run automatically on build

**Build Settings:**
```
Build Command: npm run db:migrate:deploy && npm run build
Output Directory: .next
Install Command: npm install
```

#### Railway

1. **Create New Project**
   - Go to [railway.app](https://railway.app)
   - Create project from GitHub repo
2. **Add Database**
   - Click "+ New" → Database → PostgreSQL
   - DATABASE_URL is automatically set
3. **Add Environment Variables**
   - Go to Variables tab
   - Add NEXTAUTH_SECRET, ENCRYPTION_KEY, etc.
4. **Deploy**
   - Railway auto-deploys on git push

#### Docker

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run db:generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t mindmap .
docker run -p 3000:3000 --env-file .env.local mindmap
```

### Pre-Deployment Checklist

- [ ] All environment variables set in deployment platform
- [ ] DATABASE_URL points to production database
- [ ] NEXTAUTH_SECRET is unique and secure (not same as dev)
- [ ] ENCRYPTION_KEY is backed up and secure
- [ ] Database migrations tested: `npm run db:migrate:deploy`
- [ ] Build succeeds locally: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] Tests pass: `npm run test`
- [ ] Database backups configured
- [ ] SSL/TLS certificate configured
- [ ] Error tracking set up (Sentry, LogRocket, etc.)
- [ ] Performance monitoring configured

### Post-Deployment

```bash
# Run migrations (if not in build command)
npm run db:migrate:deploy

# Verify deployment
curl https://yourdomain.com/api/health

# Check logs for errors
# (Platform-specific: Vercel logs, Railway logs, etc.)
```

## Troubleshooting

### Common Issues

#### "DATABASE_URL is not set"

**Solution:**
- Ensure `.env.local` exists in project root
- Check the file has `DATABASE_URL=...`
- Restart dev server: `npm run dev`

#### "Can't reach database server"

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS)
brew services start postgresql

# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Test connection
psql $DATABASE_URL
```

#### "Migration failed"

**Solution:**
```bash
# Check migration status
npx prisma migrate status

# Reset database (⚠️ deletes all data)
npm run db:reset

# Or force reset
npm run db:reset:force
```

#### "Build fails with TypeScript errors"

**Solution:**
```bash
# Check for type errors
npx tsc --noEmit

# If errors are in node_modules, try:
rm -rf node_modules package-lock.json
npm install
```

#### "Tests fail"

**Solution:**
```bash
# Clear Jest cache
npx jest --clearCache

# Run with verbose output
npm run test -- --verbose

# Check .env.test exists with DATABASE_URL="file:./test.db"
```

### Getting Help

1. **Check Documentation**
   - [README.md](./README.md) - Project overview
   - [TROUBLESHOOTING section in README](./README.md#troubleshooting)

2. **Review Logs**
   ```bash
   # Development
   Check terminal output from `npm run dev`
   
   # Production
   Check logs in deployment platform (Vercel, Railway, etc.)
   ```

3. **Test API Endpoints**
   ```bash
   # Health check
   curl http://localhost:3000/api/health
   
   # Login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

4. **Database Status**
   ```bash
   # Check Prisma status
   npx prisma migrate status
   
   # Connect to database
   psql $DATABASE_URL
   ```

## Next Steps

After setup, explore these features:

1. **Create a Workspace** - Go to Dashboard → New Workspace
2. **Add LLM API Keys** - Settings → API Keys
3. **Generate Mind Map** - Workspace → Create Mind Map
4. **Ingest Content** - Upload PDFs, YouTube videos, or web pages
5. **Collaborate** - Share mind maps with team members

For more information, see:
- [README.md](./README.md) - Full project documentation
- [FEATURES.md](./FEATURES.md) - Feature overview
- [INGESTION_PIPELINE.md](./INGESTION_PIPELINE.md) - Content ingestion guide

## Security Best Practices

1. **Never commit secrets** - Use `.env.local` (gitignored)
2. **Use strong secrets** - Minimum 32 characters, random
3. **Backup encryption key** - Losing it invalidates all stored API keys
4. **Rotate secrets regularly** - Especially after team changes
5. **Use environment-specific secrets** - Different for dev/staging/prod
6. **Enable 2FA** - On deployment platforms and database hosts
7. **Review dependencies** - Run `npm audit` regularly
8. **Keep dependencies updated** - Run `npm update` periodically

---

**Need help?** Open an issue or check the [troubleshooting guide](./README.md#troubleshooting).
