// Jest setup file
// Add any global test setup here

// Mock environment variables for tests
process.env.SKIP_ENV_VALIDATION = 'true';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NEXTAUTH_SECRET = 'test-secret-key-min-32-chars-1234567890';
process.env.ENCRYPTION_KEY = 'test-encryption-key-min-32-chars-1234';
process.env.NEXT_PUBLIC_APP_NAME = 'MindMap Test';

// Mock the env module to avoid import issues
jest.mock('./env', () => ({
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
}));
