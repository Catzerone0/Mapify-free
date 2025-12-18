#!/usr/bin/env node

/**
 * Database Reset Script for Second Migration
 * This script resets the database and applies all migrations including the second one
 * Usage: node scripts/reset-db-second-migration.mjs [--skip-seed] [--force]
 */

import { execSync } from 'child_process';
import { createInterface } from 'readline';
import { loadProjectEnv } from './load-env.mjs';

// Parse command line arguments
const args = process.argv.slice(2);
const skipSeed = args.includes('--skip-seed');
const force = args.includes('--force');
const help = args.includes('-h') || args.includes('--help');

if (help) {
  console.log(`
Usage: node scripts/reset-db-second-migration.mjs [OPTIONS]

Options:
  --skip-seed    Skip seeding the database after reset
  --force        Skip confirmation prompt
  -h, --help     Show this help message
`);
  process.exit(0);
}

console.log('================================================');
console.log('Database Reset Script for Second Migration');
console.log('================================================');
console.log('');

const { loadedFiles } = loadProjectEnv();
if (loadedFiles.length > 0) {
  console.log(`🔧 Loaded environment from: ${loadedFiles.join(', ')}`);
  console.log('');
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.error('Tried loading from .env/.env.local files, but DATABASE_URL is still missing');
  console.error('Set DATABASE_URL in your .env file or export it in your shell');
  process.exit(1);
}

console.log(`📋 Current DATABASE_URL: ${process.env.DATABASE_URL}`);
console.log('');

/**
 * Execute a command and print output in real-time
 */
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
    return true;
  } catch {
    console.error(`❌ ${description} failed`);
    return false;
  }
}

/**
 * Prompt user for confirmation
 */
function confirmReset() {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('⚠️  This will DELETE all data in the database. Continue? (y/N): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Main execution
 */
async function main() {
  // Confirm before proceeding (unless --force flag is used)
  if (!force) {
    const confirmed = await confirmReset();
    if (!confirmed) {
      console.log('❌ Operation cancelled');
      process.exit(0);
    }
  }

  console.log('');
  console.log('🗑️  Step 1: Resetting database...');
  
  // Build the reset command
  let resetCommand = 'npx prisma migrate reset --force';
  if (skipSeed) {
    resetCommand += ' --skip-seed';
  }
  
  const resetSuccess = executeCommand(resetCommand, 'Database reset');
  if (!resetSuccess) {
    process.exit(1);
  }

  console.log('');
  console.log('🔄 Step 2: Generating Prisma Client...');
  const generateSuccess = executeCommand('npm run db:generate', 'Prisma Client generation');
  if (!generateSuccess) {
    process.exit(1);
  }

  console.log('');
  console.log('📊 Step 3: Checking migration status...');
  console.log('----------------------------------------');
  try {
    execSync('npx prisma migrate status', {
      stdio: 'inherit',
      env: process.env
    });
  } catch {
    // Migration status command may exit with non-zero even on success
  }

  console.log('');
  console.log('================================================');
  console.log('✅ Database reset complete!');
  console.log('================================================');
  console.log('');
  console.log('Summary:');
  console.log('  - Database schema dropped and recreated');
  console.log('  - All migrations applied (including second migration)');
  console.log('  - Prisma Client regenerated');
  
  if (!skipSeed) {
    console.log('  - Database seeded with demo data');
  } else {
    console.log('  - Database seeding skipped');
  }

  console.log('');
  console.log('Next steps:');
  console.log('  - Start your development server: npm run dev');
  console.log('  - Or manually seed the database: npm run db:seed');
  console.log('');
}

// Run the script
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
