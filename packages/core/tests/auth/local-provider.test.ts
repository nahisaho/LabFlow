/**
 * LocalAuthProvider Tests
 *
 * TDD RED Phase - TASK-AUTH-001
 *
 * Tests for:
 * - DASH-AUTH-002: Local authentication
 * - DASH-AUTH-011: Argon2id password hashing
 * - DASH-AUTH-012: Session timeout
 * - DASH-AUTH-013: Account lockout (3 failures = 30 min)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalAuthProvider } from '../../src/auth/providers/local.js';
import {
  InvalidCredentialsError,
  AccountLockedError,
} from '../../src/auth/errors.js';
import type { LocalCredentials, LocalProviderConfig } from '../../src/auth/types.js';

describe('LocalAuthProvider', () => {
  let provider: LocalAuthProvider;
  const testConfig: LocalProviderConfig = {
    type: 'local',
    jwtSecret: 'test-secret-key-at-least-32-characters-long',
    jwtExpiresIn: '15m',
  };

  beforeEach(() => {
    provider = new LocalAuthProvider(testConfig);
  });

  describe('type property', () => {
    it('should return "local" as the provider type', () => {
      expect(provider.type).toBe('local');
    });
  });

  describe('password hashing (DASH-AUTH-011)', () => {
    it('should hash passwords using Argon2id', async () => {
      const password = 'securePassword123!';
      const hash = await provider.hashPassword(password);

      // Argon2id hash format: $argon2id$v=...
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'securePassword123!';
      const hash1 = await provider.hashPassword(password);
      const hash2 = await provider.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should use custom Argon2 options when provided', async () => {
      const customProvider = new LocalAuthProvider({
        ...testConfig,
        argon2Options: {
          memoryCost: 32768, // 32 MiB
          timeCost: 2,
          parallelism: 2,
        },
      });

      const hash = await customProvider.hashPassword('password');
      expect(hash).toMatch(/^\$argon2id\$/);
    });
  });

  describe('user creation', () => {
    it('should create a user with hashed password', async () => {
      const user = await provider.createUser(
        'test@example.com',
        'password123',
        'Test User',
        'researcher'
      );

      expect(user).toMatchObject({
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'researcher',
        provider: 'local',
      });
      expect(user.id).toBeDefined();
      expect(typeof user.id).toBe('string');
    });

    it('should default to researcher role', async () => {
      const user = await provider.createUser(
        'test@example.com',
        'password123',
        'Test User'
      );

      expect(user.role).toBe('researcher');
    });
  });

  describe('authentication (DASH-AUTH-002)', () => {
    const validCredentials: LocalCredentials = {
      type: 'local',
      email: 'test@example.com',
      password: 'correctPassword123!',
    };

    beforeEach(async () => {
      await provider.createUser(
        'test@example.com',
        'correctPassword123!',
        'Test User',
        'researcher'
      );
    });

    it('should authenticate with valid credentials', async () => {
      const result = await provider.authenticate(validCredentials);

      expect(result).toMatchObject({
        user: {
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'researcher',
          provider: 'local',
        },
      });
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should reject invalid email', async () => {
      const invalidCredentials: LocalCredentials = {
        type: 'local',
        email: 'wrong@example.com',
        password: 'correctPassword123!',
      };

      await expect(provider.authenticate(invalidCredentials))
        .rejects.toThrow(InvalidCredentialsError);
    });

    it('should reject invalid password', async () => {
      const invalidCredentials: LocalCredentials = {
        type: 'local',
        email: 'test@example.com',
        password: 'wrongPassword',
      };

      await expect(provider.authenticate(invalidCredentials))
        .rejects.toThrow(InvalidCredentialsError);
    });

    it('should reject non-local credential type', async () => {
      const wrongTypeCredentials = {
        type: 'entra' as const,
        code: 'some-code',
        state: 'some-state',
      };

      await expect(provider.authenticate(wrongTypeCredentials))
        .rejects.toThrow(InvalidCredentialsError);
    });
  });

  describe('account lockout (DASH-AUTH-013)', () => {
    beforeEach(async () => {
      await provider.createUser(
        'locktest@example.com',
        'correctPassword',
        'Lock Test User',
        'researcher'
      );
    });

    it('should lock account after 3 failed attempts', async () => {
      const invalidCredentials: LocalCredentials = {
        type: 'local',
        email: 'locktest@example.com',
        password: 'wrongPassword',
      };

      // First 3 attempts should throw InvalidCredentialsError
      await expect(provider.authenticate(invalidCredentials))
        .rejects.toThrow(InvalidCredentialsError);
      await expect(provider.authenticate(invalidCredentials))
        .rejects.toThrow(InvalidCredentialsError);
      await expect(provider.authenticate(invalidCredentials))
        .rejects.toThrow(InvalidCredentialsError);

      // 4th attempt should throw AccountLockedError
      await expect(provider.authenticate(invalidCredentials))
        .rejects.toThrow(AccountLockedError);
    });

    it('should include unlock time in AccountLockedError', async () => {
      const invalidCredentials: LocalCredentials = {
        type: 'local',
        email: 'locktest@example.com',
        password: 'wrongPassword',
      };

      // Trigger lockout
      for (let i = 0; i < 3; i++) {
        try {
          await provider.authenticate(invalidCredentials);
        } catch {
          // Expected to fail
        }
      }

      try {
        await provider.authenticate(invalidCredentials);
        expect.fail('Should have thrown AccountLockedError');
      } catch (error) {
        expect(error).toBeInstanceOf(AccountLockedError);
        const lockedError = error as AccountLockedError;
        expect(lockedError.lockedUntil).toBeInstanceOf(Date);
        // Should be locked for ~30 minutes
        const lockDuration = lockedError.lockedUntil.getTime() - Date.now();
        expect(lockDuration).toBeGreaterThan(29 * 60 * 1000); // > 29 min
        expect(lockDuration).toBeLessThan(31 * 60 * 1000); // < 31 min
      }
    });

    it('should reset failed attempts after successful login', async () => {
      const validCredentials: LocalCredentials = {
        type: 'local',
        email: 'locktest@example.com',
        password: 'correctPassword',
      };
      const invalidCredentials: LocalCredentials = {
        type: 'local',
        email: 'locktest@example.com',
        password: 'wrongPassword',
      };

      // 2 failed attempts
      await expect(provider.authenticate(invalidCredentials))
        .rejects.toThrow(InvalidCredentialsError);
      await expect(provider.authenticate(invalidCredentials))
        .rejects.toThrow(InvalidCredentialsError);

      // Successful login
      await expect(provider.authenticate(validCredentials))
        .resolves.toBeDefined();

      // Counter should be reset, so 3 more failures needed for lockout
      await expect(provider.authenticate(invalidCredentials))
        .rejects.toThrow(InvalidCredentialsError);
      await expect(provider.authenticate(invalidCredentials))
        .rejects.toThrow(InvalidCredentialsError);
      await expect(provider.authenticate(invalidCredentials))
        .rejects.toThrow(InvalidCredentialsError);

      // Now should be locked
      await expect(provider.authenticate(invalidCredentials))
        .rejects.toThrow(AccountLockedError);
    });
  });

  describe('JWT token generation', () => {
    beforeEach(async () => {
      await provider.createUser(
        'jwt@example.com',
        'password123',
        'JWT Test User',
        'admin'
      );
    });

    it('should generate valid JWT token on authentication', async () => {
      const result = await provider.authenticate({
        type: 'local',
        email: 'jwt@example.com',
        password: 'password123',
      });

      // JWT format: header.payload.signature
      const parts = result.token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should include user info in token payload', async () => {
      const result = await provider.authenticate({
        type: 'local',
        email: 'jwt@example.com',
        password: 'password123',
      });

      // Decode payload (base64url)
      const payload = JSON.parse(
        Buffer.from(result.token.split('.')[1]!, 'base64url').toString()
      );

      expect(payload.email).toBe('jwt@example.com');
      expect(payload.role).toBe('admin');
      expect(payload.sub).toBeDefined(); // User ID
      expect(payload.exp).toBeDefined(); // Expiration
      expect(payload.iat).toBeDefined(); // Issued at
    });
  });

  describe('session validation (DASH-AUTH-012)', () => {
    let validToken: string;

    beforeEach(async () => {
      await provider.createUser(
        'session@example.com',
        'password123',
        'Session Test User',
        'researcher'
      );

      const result = await provider.authenticate({
        type: 'local',
        email: 'session@example.com',
        password: 'password123',
      });
      validToken = result.token;
    });

    it('should validate a valid token', async () => {
      const user = await provider.validateSession(validToken);

      expect(user).not.toBeNull();
      expect(user).toMatchObject({
        email: 'session@example.com',
        displayName: 'Session Test User',
        role: 'researcher',
        provider: 'local',
      });
    });

    it('should return null for invalid token', async () => {
      const invalidToken = 'invalid.token.string';
      const user = await provider.validateSession(invalidToken);

      expect(user).toBeNull();
    });

    it('should return null for tampered token', async () => {
      // Tamper with the token signature
      const tamperedToken = validToken.slice(0, -5) + 'XXXXX';
      const user = await provider.validateSession(tamperedToken);

      expect(user).toBeNull();
    });

    it('should return null for expired token', async () => {
      // Create provider with very short expiry
      const shortExpiryProvider = new LocalAuthProvider({
        ...testConfig,
        jwtExpiresIn: '1s', // 1 second
      });

      await shortExpiryProvider.createUser(
        'expiry@example.com',
        'password123',
        'Expiry Test',
        'researcher'
      );

      const result = await shortExpiryProvider.authenticate({
        type: 'local',
        email: 'expiry@example.com',
        password: 'password123',
      });

      // Wait for token to expire (increased to 2.5s for stability)
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const user = await shortExpiryProvider.validateSession(result.token);
      expect(user).toBeNull();
    });
  });

  describe('session revocation', () => {
    it('should revoke session without error', async () => {
      await provider.createUser(
        'revoke@example.com',
        'password123',
        'Revoke Test',
        'researcher'
      );

      const result = await provider.authenticate({
        type: 'local',
        email: 'revoke@example.com',
        password: 'password123',
      });

      // Should not throw
      await expect(provider.revokeSession(result.token))
        .resolves.not.toThrow();
    });
  });

  describe('expiry calculation', () => {
    it('should calculate expiry based on jwtExpiresIn config', async () => {
      await provider.createUser(
        'expiry@example.com',
        'password123',
        'Expiry Test',
        'researcher'
      );

      const beforeAuth = Date.now();
      const result = await provider.authenticate({
        type: 'local',
        email: 'expiry@example.com',
        password: 'password123',
      });
      const afterAuth = Date.now();

      // 15 minutes = 900000 ms
      const expectedExpiry = 15 * 60 * 1000;
      const actualExpiry = result.expiresAt.getTime() - beforeAuth;

      expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(actualExpiry).toBeLessThanOrEqual(expectedExpiry + (afterAuth - beforeAuth) + 1000);
    });

    it('should handle different time units (s, m, h, d)', async () => {
      const testCases = [
        { expiresIn: '30s', expectedMs: 30 * 1000 },
        { expiresIn: '5m', expectedMs: 5 * 60 * 1000 },
        { expiresIn: '2h', expectedMs: 2 * 60 * 60 * 1000 },
        { expiresIn: '1d', expectedMs: 24 * 60 * 60 * 1000 },
      ];

      for (const { expiresIn, expectedMs } of testCases) {
        const testProvider = new LocalAuthProvider({
          ...testConfig,
          jwtExpiresIn: expiresIn,
        });

        await testProvider.createUser(
          `test-${expiresIn}@example.com`,
          'password123',
          'Test User',
          'researcher'
        );

        const before = Date.now();
        const result = await testProvider.authenticate({
          type: 'local',
          email: `test-${expiresIn}@example.com`,
          password: 'password123',
        });

        const actualExpiry = result.expiresAt.getTime() - before;
        expect(actualExpiry).toBeGreaterThanOrEqual(expectedMs - 1000);
        expect(actualExpiry).toBeLessThanOrEqual(expectedMs + 1000);
      }
    });
  });
});
