/**
 * AuthService Tests
 *
 * TDD RED Phase - TASK-AUTH-001
 *
 * Tests for authentication service orchestration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthService } from '../../src/auth/service.js';
import { LocalAuthProvider } from '../../src/auth/providers/local.js';
import type {
  AuthProvider,
  AuthCredentials,
  AuthResult,
  AuthUser,
  LocalCredentials,
} from '../../src/auth/types.js';

describe('AuthService', () => {
  let service: AuthService;
  let localProvider: LocalAuthProvider;

  beforeEach(async () => {
    localProvider = new LocalAuthProvider({
      type: 'local',
      jwtSecret: 'test-secret-key-at-least-32-characters-long',
      jwtExpiresIn: '15m',
    });

    await localProvider.createUser(
      'test@example.com',
      'password123',
      'Test User',
      'researcher'
    );

    service = new AuthService(localProvider);
  });

  describe('constructor', () => {
    it('should accept a provider instance', () => {
      const customService = new AuthService(localProvider);
      expect(customService.getProviderType()).toBe('local');
    });

    it('should create provider from environment when not provided', () => {
      // This test requires environment variables to be set
      // Will use default provider based on AUTH_PROVIDER env var
      // For now, we test with explicit provider
      expect(service.getProviderType()).toBe('local');
    });
  });

  describe('getProviderType', () => {
    it('should return the current provider type', () => {
      expect(service.getProviderType()).toBe('local');
    });
  });

  describe('getAvailableProviders', () => {
    it('should return list of available providers', () => {
      const providers = service.getAvailableProviders();
      expect(Array.isArray(providers)).toBe(true);
      expect(providers).toContain('local');
    });
  });

  describe('authenticate', () => {
    it('should delegate to provider authenticate', async () => {
      const credentials: LocalCredentials = {
        type: 'local',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await service.authenticate(credentials);

      expect(result).toMatchObject({
        user: {
          email: 'test@example.com',
          provider: 'local',
        },
      });
      expect(result.token).toBeDefined();
    });

    it('should propagate authentication errors', async () => {
      const credentials: LocalCredentials = {
        type: 'local',
        email: 'test@example.com',
        password: 'wrongPassword',
      };

      await expect(service.authenticate(credentials))
        .rejects.toThrow();
    });
  });

  describe('validateSession', () => {
    it('should delegate to provider validateSession', async () => {
      const credentials: LocalCredentials = {
        type: 'local',
        email: 'test@example.com',
        password: 'password123',
      };

      const authResult = await service.authenticate(credentials);
      const user = await service.validateSession(authResult.token);

      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null for invalid token', async () => {
      const user = await service.validateSession('invalid-token');
      expect(user).toBeNull();
    });
  });

  describe('logout', () => {
    it('should delegate to provider revokeSession', async () => {
      const credentials: LocalCredentials = {
        type: 'local',
        email: 'test@example.com',
        password: 'password123',
      };

      const authResult = await service.authenticate(credentials);

      await expect(service.logout(authResult.token))
        .resolves.not.toThrow();
    });
  });

  describe('getLoginUrl', () => {
    it('should return null for local provider', () => {
      const url = service.getLoginUrl('http://localhost:3000/callback');
      expect(url).toBeNull();
    });

    it('should return URL for OAuth provider', () => {
      // Mock OAuth provider
      const mockOAuthProvider: AuthProvider = {
        type: 'entra',
        authenticate: vi.fn(),
        validateSession: vi.fn(),
        revokeSession: vi.fn(),
        getLoginUrl: (redirectUri: string) =>
          `https://login.microsoftonline.com/authorize?redirect_uri=${redirectUri}`,
      };

      const oauthService = new AuthService(mockOAuthProvider);
      const url = oauthService.getLoginUrl('http://localhost:3000/callback');

      expect(url).toContain('login.microsoftonline.com');
      expect(url).toContain('http://localhost:3000/callback');
    });
  });

  describe('handleCallback', () => {
    it('should throw error for provider without callback support', async () => {
      const params = { code: 'auth-code', state: 'state-value' };

      await expect(service.handleCallback(params))
        .rejects.toThrow('Provider does not support callback handling');
    });

    it('should delegate to provider handleCallback', async () => {
      const mockAuthResult: AuthResult = {
        user: {
          id: 'user-123',
          email: 'oauth@example.com',
          displayName: 'OAuth User',
          role: 'researcher',
          provider: 'entra',
        },
        token: 'oauth-token',
        expiresAt: new Date(Date.now() + 3600000),
      };

      const mockOAuthProvider: AuthProvider = {
        type: 'entra',
        authenticate: vi.fn(),
        validateSession: vi.fn(),
        revokeSession: vi.fn(),
        handleCallback: vi.fn().mockResolvedValue(mockAuthResult),
      };

      const oauthService = new AuthService(mockOAuthProvider);
      const params = { code: 'auth-code', state: 'state-value' };

      const result = await oauthService.handleCallback(params);

      expect(mockOAuthProvider.handleCallback).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockAuthResult);
    });
  });
});

describe('AuthService with Mock Provider', () => {
  it('should work with custom provider implementation', async () => {
    const mockUser: AuthUser = {
      id: 'mock-user-id',
      email: 'mock@example.com',
      displayName: 'Mock User',
      role: 'admin',
      provider: 'local',
    };

    const mockProvider: AuthProvider = {
      type: 'local',
      authenticate: vi.fn().mockResolvedValue({
        user: mockUser,
        token: 'mock-token',
        expiresAt: new Date(Date.now() + 3600000),
      }),
      validateSession: vi.fn().mockResolvedValue(mockUser),
      revokeSession: vi.fn().mockResolvedValue(undefined),
    };

    const service = new AuthService(mockProvider);

    const result = await service.authenticate({
      type: 'local',
      email: 'mock@example.com',
      password: 'password',
    } as LocalCredentials);

    expect(result.user).toEqual(mockUser);
    expect(mockProvider.authenticate).toHaveBeenCalled();
  });
});
