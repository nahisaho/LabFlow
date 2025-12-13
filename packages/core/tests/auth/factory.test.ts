/**
 * AuthProviderFactory Tests
 *
 * TDD RED Phase - TASK-AUTH-001
 *
 * Tests for:
 * - DASH-AUTH-001: Multi-provider switching
 * - Factory pattern for provider creation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthProviderFactory } from '../../src/auth/providers/factory.js';
import { LocalAuthProvider } from '../../src/auth/providers/local.js';
import { EntraIDProvider } from '../../src/auth/providers/entra.js';
import { ShibbolethProvider } from '../../src/auth/providers/shibboleth.js';
import type { LocalProviderConfig, EntraProviderConfig, ShibbolethProviderConfig } from '../../src/auth/types.js';

describe('AuthProviderFactory', () => {
  describe('create', () => {
    it('should create LocalAuthProvider for local config', () => {
      const config: LocalProviderConfig = {
        type: 'local',
        jwtSecret: 'test-secret-key-at-least-32-characters-long',
        jwtExpiresIn: '15m',
      };

      const provider = AuthProviderFactory.create(config);

      expect(provider).toBeInstanceOf(LocalAuthProvider);
      expect(provider.type).toBe('local');
    });

    it('should create EntraIDProvider for entra config', () => {
      const config: EntraProviderConfig = {
        type: 'entra',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        tenantId: 'test-tenant-id',
        redirectUri: 'http://localhost:3000/callback',
      };

      const provider = AuthProviderFactory.create(config);

      expect(provider).toBeInstanceOf(EntraIDProvider);
      expect(provider.type).toBe('entra');
    });

    it('should create ShibbolethProvider for shibboleth config', () => {
      const config: ShibbolethProviderConfig = {
        type: 'shibboleth',
        entityId: 'https://sp.example.com',
        idpMetadataUrl: 'https://idp.example.com/metadata',
        privateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
        certificate: '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----',
      };

      const provider = AuthProviderFactory.create(config);

      expect(provider).toBeInstanceOf(ShibbolethProvider);
      expect(provider.type).toBe('shibboleth');
    });

    it('should throw error for unknown provider type', () => {
      const invalidConfig = {
        type: 'unknown' as never,
      };

      expect(() => AuthProviderFactory.create(invalidConfig))
        .toThrow();
    });
  });

  describe('createFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should create LocalAuthProvider when AUTH_PROVIDER=local', () => {
      process.env.AUTH_PROVIDER = 'local';
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
      process.env.JWT_EXPIRES_IN = '15m';

      const provider = AuthProviderFactory.createFromEnv();

      expect(provider).toBeInstanceOf(LocalAuthProvider);
      expect(provider.type).toBe('local');
    });

    it('should create EntraIDProvider when AUTH_PROVIDER=entra', () => {
      process.env.AUTH_PROVIDER = 'entra';
      process.env.ENTRA_CLIENT_ID = 'test-client-id';
      process.env.ENTRA_CLIENT_SECRET = 'test-client-secret';
      process.env.ENTRA_TENANT_ID = 'test-tenant-id';
      process.env.ENTRA_REDIRECT_URI = 'http://localhost:3000/callback';

      const provider = AuthProviderFactory.createFromEnv();

      expect(provider).toBeInstanceOf(EntraIDProvider);
      expect(provider.type).toBe('entra');
    });

    it('should create ShibbolethProvider when AUTH_PROVIDER=shibboleth', () => {
      process.env.AUTH_PROVIDER = 'shibboleth';
      process.env.SHIBBOLETH_ENTITY_ID = 'https://sp.example.com';
      process.env.SHIBBOLETH_IDP_METADATA_URL = 'https://idp.example.com/metadata';
      process.env.SHIBBOLETH_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----';
      process.env.SHIBBOLETH_CERTIFICATE = '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----';

      const provider = AuthProviderFactory.createFromEnv();

      expect(provider).toBeInstanceOf(ShibbolethProvider);
      expect(provider.type).toBe('shibboleth');
    });

    it('should default to local provider when AUTH_PROVIDER is not set', () => {
      delete process.env.AUTH_PROVIDER;
      process.env.JWT_SECRET = 'default-secret-key-at-least-32-characters-long';
      process.env.JWT_EXPIRES_IN = '15m';

      const provider = AuthProviderFactory.createFromEnv();

      expect(provider).toBeInstanceOf(LocalAuthProvider);
    });

    it('should throw error when required env vars are missing', () => {
      // Clear cache to ensure fresh provider creation
      AuthProviderFactory.clearCache();

      process.env.AUTH_PROVIDER = 'entra';
      delete process.env.ENTRA_CLIENT_ID;
      delete process.env.ENTRA_CLIENT_SECRET;

      expect(() => AuthProviderFactory.createFromEnv())
        .toThrow();
    });
  });

  describe('getAvailableProviders', () => {
    it('should return all supported provider types', () => {
      const providers = AuthProviderFactory.getAvailableProviders();

      expect(providers).toContain('local');
      expect(providers).toContain('entra');
      expect(providers).toContain('shibboleth');
      expect(providers).toHaveLength(3);
    });
  });

  describe('isSupported', () => {
    it('should return true for supported providers', () => {
      expect(AuthProviderFactory.isSupported('local')).toBe(true);
      expect(AuthProviderFactory.isSupported('entra')).toBe(true);
      expect(AuthProviderFactory.isSupported('shibboleth')).toBe(true);
    });

    it('should return false for unsupported providers', () => {
      expect(AuthProviderFactory.isSupported('unknown' as any)).toBe(false);
      expect(AuthProviderFactory.isSupported('' as any)).toBe(false);
    });
  });
});
