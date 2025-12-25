// Jest setup file
// Add any global test setup here

// Mock environment variables for tests
process.env.SKIP_ENV_VALIDATION = 'true';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NEXTAUTH_SECRET = 'test-secret-key-min-32-chars-1234567890';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.ENCRYPTION_KEY = 'test-encryption-key-min-32-chars-1234';
process.env.NEXT_PUBLIC_APP_NAME = 'MindMap Test';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_API_BASE = 'http://localhost:3000/api';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Mock the env module to avoid import issues
jest.mock('./lib/env', () => ({
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
    NODE_ENV: process.env.NODE_ENV,
    LOG_LEVEL: process.env.LOG_LEVEL,
  },
  isProd: false,
  isDev: true,
  isTest: true,
  hasRedis: () => false,
  hasWebSearch: () => false,
  getWebSearchProviders: () => [],
  getAllowedOrigins: () => [],
}));
