/**
 * Auth Error Tests
 *
 * TDD RED Phase - TASK-AUTH-001
 *
 * Tests for authentication error classes
 */

import { describe, it, expect } from 'vitest';
import {
  AuthError,
  InvalidCredentialsError,
  UserNotFoundError,
  SessionExpiredError,
  AccountLockedError,
  InvalidTokenError,
  ProviderNotConfiguredError,
} from '../../src/auth/errors.js';

describe('Auth Errors', () => {
  describe('AuthError (base class)', () => {
    it('should create error with message, code, and statusCode', () => {
      const error = new AuthError('Test error', 'TEST_ERROR', 400);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AuthError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('AuthError');
    });

    it('should default to 401 statusCode', () => {
      const error = new AuthError('Test', 'TEST');

      expect(error.statusCode).toBe(401);
    });
  });

  describe('InvalidCredentialsError', () => {
    it('should have default message', () => {
      const error = new InvalidCredentialsError();

      expect(error.message).toBe('Invalid email or password');
      expect(error.code).toBe('INVALID_CREDENTIALS');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('InvalidCredentialsError');
    });

    it('should accept custom message', () => {
      const error = new InvalidCredentialsError('Custom message');

      expect(error.message).toBe('Custom message');
    });
  });

  describe('UserNotFoundError', () => {
    it('should have default message', () => {
      const error = new UserNotFoundError();

      expect(error.message).toBe('User not found');
      expect(error.code).toBe('USER_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('UserNotFoundError');
    });

    it('should accept custom message', () => {
      const error = new UserNotFoundError('No user with that email');

      expect(error.message).toBe('No user with that email');
    });
  });

  describe('SessionExpiredError', () => {
    it('should have default message', () => {
      const error = new SessionExpiredError();

      expect(error.message).toBe('Session has expired');
      expect(error.code).toBe('SESSION_EXPIRED');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('SessionExpiredError');
    });
  });

  describe('AccountLockedError', () => {
    it('should include locked until timestamp', () => {
      const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      const error = new AccountLockedError(lockedUntil);

      expect(error.message).toContain('Account is locked');
      expect(error.code).toBe('ACCOUNT_LOCKED');
      expect(error.statusCode).toBe(423); // Locked status code
      expect(error.name).toBe('AccountLockedError');
      expect(error.lockedUntil).toEqual(lockedUntil);
    });

    it('should format unlock time in message', () => {
      const lockedUntil = new Date('2025-12-13T12:30:00Z');
      const error = new AccountLockedError(lockedUntil);

      // Time should be formatted in the message (locale-specific)
      expect(error.message).toContain('locked until');
      expect(error.lockedUntil).toEqual(lockedUntil);
    });
  });

  describe('InvalidTokenError', () => {
    it('should have default message', () => {
      const error = new InvalidTokenError();

      expect(error.message).toBe('Invalid or expired token');
      expect(error.code).toBe('INVALID_TOKEN');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('InvalidTokenError');
    });
  });

  describe('ProviderNotConfiguredError', () => {
    it('should include provider name in message', () => {
      const error = new ProviderNotConfiguredError('entra');

      expect(error.message).toContain('entra');
      expect(error.code).toBe('PROVIDER_NOT_CONFIGURED');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('ProviderNotConfiguredError');
    });
  });

  describe('Error inheritance', () => {
    it('should be catchable as Error', () => {
      try {
        throw new InvalidCredentialsError();
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
    });

    it('should be catchable as AuthError', () => {
      try {
        throw new InvalidCredentialsError();
      } catch (e) {
        expect(e).toBeInstanceOf(AuthError);
      }
    });

    it('should be catchable as specific error type', () => {
      try {
        throw new InvalidCredentialsError();
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidCredentialsError);
      }
    });
  });

  describe('Error serialization', () => {
    it('should serialize to JSON properly', () => {
      const error = new InvalidCredentialsError('Test message');
      const json = JSON.stringify({
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      });

      const parsed = JSON.parse(json);
      expect(parsed.name).toBe('InvalidCredentialsError');
      expect(parsed.message).toBe('Test message');
      expect(parsed.code).toBe('INVALID_CREDENTIALS');
      expect(parsed.statusCode).toBe(401);
    });
  });
});
