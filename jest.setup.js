// Jest setup file
// Add any global test setup here

// Mock environment variables for tests
process.env.SKIP_ENV_VALIDATION = 'true';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NEXTAUTH_SECRET = 'test-secret-key-min-32-chars-1234567890';
process.env.ENCRYPTION_KEY = 'test-encryption-key-min-32-chars-1234';
