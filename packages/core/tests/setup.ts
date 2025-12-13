/**
 * Vitest Test Setup
 *
 * Global test configuration and utilities
 */

import { vi } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';

// Default test JWT secret
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-for-hs256';
process.env.JWT_EXPIRES_IN = '15m';

// Default to local auth provider
process.env.AUTH_PROVIDER = 'local';

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Increase timeout for async tests
vi.setConfig({
  testTimeout: 10000,
});
