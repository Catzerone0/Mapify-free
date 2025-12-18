#!/bin/bash

# Database Reset Script for Second Migration
# This script resets the database and applies all migrations including the second one
# Usage: ./scripts/reset-db-second-migration.sh [--skip-seed]

set -e  # Exit on error

echo "================================================"
echo "Database Reset Script for Second Migration"
echo "================================================"
echo ""

# Parse arguments
SKIP_SEED=false
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --skip-seed) SKIP_SEED=true ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-seed    Skip seeding the database after reset"
            echo "  -h, --help     Show this help message"
            echo ""
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL in your .env file or export it"
    exit 1
fi

echo "📋 Current DATABASE_URL: ${DATABASE_URL}"
echo ""

# Confirm before proceeding
read -p "⚠️  This will DELETE all data in the database. Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled"
    exit 0
fi

echo ""
echo "🗑️  Step 1: Resetting database..."
echo "----------------------------------------"
# Prisma migrate reset will:
# 1. Drop the database/schema
# 2. Create a new database/schema
# 3. Apply all migrations
# 4. Run seed script (unless --skip-seed is used)

if [ "$SKIP_SEED" = true ]; then
    echo "Running: npx prisma migrate reset --force --skip-seed"
    npx prisma migrate reset --force --skip-seed
else
    echo "Running: npx prisma migrate reset --force"
    npx prisma migrate reset --force
fi

if [ $? -eq 0 ]; then
    echo "✅ Database reset completed successfully"
else
    echo "❌ Database reset failed"
    exit 1
fi

echo ""
echo "🔄 Step 2: Generating Prisma Client..."
echo "----------------------------------------"
npm run db:generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma Client generated successfully"
else
    echo "❌ Prisma Client generation failed"
    exit 1
fi

echo ""
echo "📊 Step 3: Checking migration status..."
echo "----------------------------------------"
npx prisma migrate status

echo ""
echo "================================================"
echo "✅ Database reset complete!"
echo "================================================"
echo ""
echo "Summary:"
echo "  - Database schema dropped and recreated"
echo "  - All migrations applied (including second migration)"
echo "  - Prisma Client regenerated"

if [ "$SKIP_SEED" = false ]; then
    echo "  - Database seeded with demo data"
else
    echo "  - Database seeding skipped"
fi

echo ""
echo "Next steps:"
echo "  - Start your development server: npm run dev"
echo "  - Or manually seed the database: npm run db:seed"
echo ""
