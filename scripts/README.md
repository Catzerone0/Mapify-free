# Database Reset Scripts

This directory contains scripts for database management and reset operations.

## Reset Database for Second Migration

The `reset-db-second-migration` scripts provide a safe and automated way to reset your database and apply all migrations, including the second migration. This is useful during development when you need to start fresh with a clean database state.

### Available Scripts

#### 1. Node.js Script (Recommended - Cross-platform)

**File:** `reset-db-second-migration.mjs`

**Usage via npm:**
```bash
# Reset database with seeding
npm run db:reset

# Reset database without seeding
npm run db:reset:skip-seed

# Reset database with seeding (skip confirmation)
npm run db:reset:force
```

**Direct usage:**
```bash
# Reset database with seeding
node scripts/reset-db-second-migration.mjs

# Reset database without seeding
node scripts/reset-db-second-migration.mjs --skip-seed

# Reset database with seeding (skip confirmation)
node scripts/reset-db-second-migration.mjs --force

# Show help
node scripts/reset-db-second-migration.mjs --help
```

#### 2. Bash Script (Unix/Linux/macOS)

**File:** `reset-db-second-migration.sh`

**Usage:**
```bash
# Reset database with seeding
./scripts/reset-db-second-migration.sh

# Reset database without seeding
./scripts/reset-db-second-migration.sh --skip-seed

# Show help
./scripts/reset-db-second-migration.sh --help
```

### What the Scripts Do

1. **Drop the database/schema** - Removes all existing tables and data
2. **Create a new database/schema** - Sets up a fresh database
3. **Apply all migrations** - Runs all migration files in order, including the second migration
4. **Generate Prisma Client** - Updates the Prisma client to match the new schema
5. **Seed the database** (optional) - Populates with demo data from `prisma/seed.mjs`
6. **Check migration status** - Displays the current state of all migrations

### Options

- `--skip-seed` - Skip the database seeding step after reset
- `--force` - Skip the confirmation prompt (Node.js script only)
- `-h, --help` - Display help information

### Prerequisites

Before running the reset scripts, ensure:

1. **DATABASE_URL is set** - The `DATABASE_URL` environment variable must be configured in your `.env` file
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/mindmap_db"
   ```

2. **Database is running** - Your PostgreSQL server must be running and accessible

3. **Dependencies are installed** - Run `npm install` to ensure all packages are available

### Safety Features

- **Confirmation prompt** - The script asks for confirmation before deleting data (can be bypassed with `--force`)
- **Environment check** - Verifies that `DATABASE_URL` is set before proceeding
- **Error handling** - Stops execution if any step fails
- **Status reporting** - Shows detailed progress and results for each step

### When to Use

Use these scripts when you need to:

- Start fresh with a clean database during development
- Test the second migration from scratch
- Reset your local development database to a known state
- Fix database inconsistencies or corruption
- Apply schema changes after modifying the Prisma schema

### Example Output

```
================================================
Database Reset Script for Second Migration
================================================

📋 Current DATABASE_URL: postgresql://user:password@localhost:5432/mindmap_db

⚠️  This will DELETE all data in the database. Continue? (y/N): y

🗑️  Step 1: Resetting database...
----------------------------------------
Running: npx prisma migrate reset --force
✅ Database reset completed successfully

🔄 Step 2: Generating Prisma Client...
----------------------------------------
✅ Prisma Client generated successfully

📊 Step 3: Checking migration status...
----------------------------------------

================================================
✅ Database reset complete!
================================================

Summary:
  - Database schema dropped and recreated
  - All migrations applied (including second migration)
  - Prisma Client regenerated
  - Database seeded with demo data

Next steps:
  - Start your development server: npm run dev
  - Or manually seed the database: npm run db:seed
```

### Troubleshooting

**Error: DATABASE_URL environment variable is not set**
- Solution: Create a `.env` file with the `DATABASE_URL` variable, or copy from `.env.example`

**Error: Can't reach database server**
- Solution: Ensure PostgreSQL is running and the connection details in `DATABASE_URL` are correct

**Error: Permission denied**
- Solution: Make the bash script executable: `chmod +x scripts/reset-db-second-migration.sh`

**Error: Migration failed**
- Solution: Check your Prisma schema for errors and ensure all migrations are valid

### Related Commands

```bash
# Create a new migration
npm run db:migrate

# Generate Prisma Client only
npm run db:generate

# Deploy migrations (production)
npm run db:migrate:deploy

# Seed database only
npm run db:seed
```

## Other Scripts

### demo-ingestion.ts

Demo script for testing content ingestion functionality.

**Usage:**
```bash
npx tsx scripts/demo-ingestion.ts
```

---

For more information about Prisma migrations, see the [Prisma documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate).
