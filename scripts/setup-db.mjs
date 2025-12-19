#!/usr/bin/env node

/**
 * Database Setup Script
 * Sets up the database for first-time use or after cloning the repo
 * Usage: node scripts/setup-db.mjs [--skip-seed]
 */

import { execSync } from 'child_process';
import { loadProjectEnv } from './load-env.mjs';

const args = process.argv.slice(2);
const skipSeed = args.includes('--skip-seed');

console.log('================================================');
console.log('Database Setup Script');
console.log('================================================');
console.log('');

const { loadedFiles, rootDir } = loadProjectEnv();
console.log(`📁 Project root: ${rootDir}`);
if (loadedFiles.length > 0) {
  console.log(`🔧 Loaded environment from: ${loadedFiles.join(', ')}`);
} else {
  console.log('⚠️  No .env files found');
}
console.log('');

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.error('');
  console.error('Please create a .env.local file with:');
  console.error('  DATABASE_URL="postgresql://user:password@localhost:5432/mindmap_db"');
  console.error('');
  console.error('Or for Supabase:');
  console.error('  DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"');
  process.exit(1);
}

console.log(`📋 DATABASE_URL configured`);
console.log('');

function executeCommand(command, description) {
  console.log(description);
  console.log('----------------------------------------');
  console.log(`Running: ${command}`);
  
  try {
    execSync(command, {
      stdio: 'inherit',
      env: process.env
    });
    console.log(`✅ ${description} completed successfully`);
    console.log('');
    return true;
  } catch {
    console.error(`❌ ${description} failed`);
    console.error('');
    return false;
  }
}

async function main() {
  console.log('🔄 Step 1: Generating Prisma Client...');
  if (!executeCommand('npm run db:generate', 'Prisma Client generation')) {
    process.exit(1);
  }

  console.log('🔄 Step 2: Running database migrations...');
  if (!executeCommand('npm run db:migrate:deploy', 'Database migrations')) {
    console.log('');
    console.log('⚠️  If migrations failed, you may need to:');
    console.log('  1. Ensure PostgreSQL is running');
    console.log('  2. Verify DATABASE_URL is correct');
    console.log('  3. Run: npm run db:reset (⚠️  deletes all data)');
    process.exit(1);
  }

  if (!skipSeed) {
    console.log('🔄 Step 3: Seeding database with demo data...');
    if (!executeCommand('npm run db:seed', 'Database seeding')) {
      console.log('⚠️  Seeding failed but database is set up');
    }
  } else {
    console.log('⏭️  Step 3: Skipping database seeding');
    console.log('');
  }

  console.log('================================================');
  console.log('✅ Database setup complete!');
  console.log('================================================');
  console.log('');
  console.log('Next steps:');
  console.log('  - Start development server: npm run dev');
  console.log('  - Run tests: npm run test');
  console.log('  - Build for production: npm run build');
  console.log('');
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
