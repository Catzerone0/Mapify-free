# Quick Start Guide

Get the MindMap application running in 5 minutes.

## Prerequisites

- Node.js 20+ installed
- PostgreSQL running (or Supabase account)

## Setup Steps

### 1. Clone and Install

```bash
git clone <repo-url>
cd project
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Generate secrets
openssl rand -base64 32  # Use for NEXTAUTH_SECRET
openssl rand -base64 32  # Use for ENCRYPTION_KEY
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mindmap_dev"
NEXTAUTH_SECRET="<paste-first-generated-secret>"
ENCRYPTION_KEY="<paste-second-generated-secret>"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="MindMap"
```

### 3. Setup Database

```bash
npm run db:setup
```

This will:
- Generate Prisma client
- Run database migrations
- Seed demo data

### 4. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo credentials:**
- Email: `test@example.com`
- Password: `password123`

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm run test             # Run tests
npm run lint             # Run linter

# Database
npm run db:setup         # Initial setup
npm run db:migrate       # Create migration
npm run db:seed          # Seed demo data
npm run db:reset         # Reset database (⚠️ deletes data)
```

## Using Supabase (Cloud Database)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy "Connection string" (use Connection pooling)
5. Add to `.env.local`:

```env
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

## Troubleshooting

### "DATABASE_URL is not set"

Ensure `.env.local` exists in project root with DATABASE_URL

### "Can't reach database server"

```bash
# Check PostgreSQL is running
pg_isready

# Start it
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux
```

### "Migration failed"

```bash
# Reset database
npm run db:reset
```

### Port 3000 already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

## Next Steps

1. **Explore the app** - Login and create a workspace
2. **Add LLM API key** - Go to Settings → API Keys
3. **Generate mind map** - Create your first AI-generated mind map
4. **Read docs** - Check [SETUP.md](./SETUP.md) for detailed guide

## Documentation

- [SETUP.md](./SETUP.md) - Detailed setup guide
- [README.md](./README.md) - Full project documentation
- [FEATURES.md](./FEATURES.md) - Feature overview
- [TROUBLESHOOTING in README](./README.md#troubleshooting) - Common issues

## Need Help?

1. Check [SETUP.md troubleshooting](./SETUP.md#troubleshooting)
2. Review [README troubleshooting](./README.md#troubleshooting)
3. Check logs in terminal where `npm run dev` is running
4. Test API: `curl http://localhost:3000/api/health`

---

**Happy mapping! 🗺️**
