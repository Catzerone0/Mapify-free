# Database Reset Guide

Quick reference for resetting the database and applying migrations.

## Quick Start

Reset your database with one command:

```bash
npm run db:reset
```

This will:
- ✅ Drop and recreate the database
- ✅ Apply all migrations (including the second migration)
- ✅ Generate Prisma Client
- ✅ Seed with demo data

## All Available Commands

```bash
# Reset with seeding (recommended)
npm run db:reset

# Reset without seeding
npm run db:reset:skip-seed

# Reset without confirmation prompt
npm run db:reset:force

# Just seed the database
npm run db:seed

# Create a new migration
npm run db:migrate

# Generate Prisma Client
npm run db:generate
```

## Alternative Usage

You can also run the scripts directly:

```bash
# Node.js script (cross-platform, works on Windows)
node scripts/reset-db-second-migration.mjs [--skip-seed] [--force]

# Bash script (Unix/Linux/macOS only)
./scripts/reset-db-second-migration.sh [--skip-seed]
```

**Windows users:** Use the Node.js script (first option) or the npm commands above. The bash script will not work on Windows without WSL or Git Bash.

## Prerequisites

Before running reset commands:

1. **Set DATABASE_URL** in your `.env.local` (recommended) or `.env` file:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/mindmap_db"
   ```
   
   **Note for Windows users:** Make sure the `.env` or `.env.local` file is in the root directory of the project (same location as `package.json`). The script will automatically find it.

2. **Start PostgreSQL** server

3. **Install dependencies**: `npm install`

## Safety Note

⚠️ **Warning**: These commands will **DELETE ALL DATA** in your database. Only use in development environments.

The script will ask for confirmation before proceeding (unless `--force` is used).

## Troubleshooting

If you encounter issues:

1. **Check DATABASE_URL** is set correctly
   - Verify `.env` or `.env.local` exists in the project root (same directory as `package.json`)
   - The script will show you the project root directory and which env files it loaded
   
2. **Verify PostgreSQL is running**

3. **Ensure you have database permissions**

4. **Windows-specific issues:**
   - Make sure you're using Command Prompt, PowerShell, or Windows Terminal
   - Use forward slashes or double backslashes in file paths
   - The script automatically handles Windows path differences

5. **Check the logs** for specific error messages

For detailed documentation, see: [scripts/README.md](scripts/README.md)

## Migration Workflow

When you need to make schema changes:

1. **Modify** `prisma/schema.prisma`
2. **Create migration**: `npm run db:migrate`
3. **Test migration** on clean database: `npm run db:reset`
4. **Verify** your application works with the new schema

## Related Documentation

- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Project README](README.md)
- [Scripts README](scripts/README.md)
