/**
 * AuthProviderFactory - Strategy Pattern
 *
 * DASH-AUTH-001: Multi-provider switching based on AUTH_PROVIDER env var
 */

import type {
  AuthProvider,
  AuthProviderType,
  ProviderConfig,
  LocalProviderConfig,
  EntraProviderConfig,
  ShibbolethProviderConfig,
} from '../types.js';
import { LocalAuthProvider } from './local.js';
import { EntraIDProvider } from './entra.js';
import { ShibbolethProvider } from './shibboleth.js';
import { ProviderNotConfiguredError } from '../errors.js';

/**
 * Factory for creating authentication providers
 *
 * Usage:
 * ```ts
 * const provider = AuthProviderFactory.create('local', config);
 * const result = await provider.authenticate(credentials);
 * ```
 */
export class AuthProviderFactory {
  private static providers = new Map<AuthProviderType, AuthProvider>();

  /**
   * Create an auth provider instance
   *
   * @param config - Provider-specific configuration with type
   * @returns AuthProvider instance
   * @throws ProviderNotConfiguredError if provider type is unknown
   */
  static create(config: ProviderConfig): AuthProvider {
    switch (config.type) {
      case 'local':
        return new LocalAuthProvider(config as LocalProviderConfig);
      case 'entra':
        return new EntraIDProvider(config as EntraProviderConfig);
      case 'shibboleth':
        return new ShibbolethProvider(config as ShibbolethProviderConfig);
      default:
        throw new ProviderNotConfiguredError((config as any).type ?? 'unknown');
    }
  }

  /**
   * Create provider from environment variable
   *
   * Reads AUTH_PROVIDER env var to determine provider type
   */
  static createFromEnv(): AuthProvider {
    const providerType = (process.env.AUTH_PROVIDER || 'local') as AuthProviderType;

    // Get cached provider if exists
    const cached = this.providers.get(providerType);
    if (cached) return cached;

    let config: ProviderConfig;

    switch (providerType) {
      case 'local':
        config = {
          type: 'local',
          jwtSecret: process.env.JWT_SECRET || '',
          jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
        };
        break;

      case 'entra':
        if (!process.env.ENTRA_CLIENT_ID || !process.env.ENTRA_CLIENT_SECRET) {
          throw new ProviderNotConfiguredError('entra - missing required environment variables (ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET)');
        }
        config = {
          type: 'entra',
          clientId: process.env.ENTRA_CLIENT_ID || '',
          clientSecret: process.env.ENTRA_CLIENT_SECRET || '',
          tenantId: process.env.ENTRA_TENANT_ID || '',
          redirectUri: process.env.ENTRA_REDIRECT_URI || '',
        };
        break;

      case 'shibboleth':
        config = {
          type: 'shibboleth',
          entityId: process.env.SHIBBOLETH_ENTITY_ID || '',
          idpMetadataUrl: process.env.SHIBBOLETH_IDP_METADATA_URL || '',
          privateKey: process.env.SHIBBOLETH_PRIVATE_KEY || '',
          certificate: process.env.SHIBBOLETH_CERTIFICATE || '',
        };
        break;

      default:
        throw new ProviderNotConfiguredError(providerType);
    }

    const provider = this.create(config);
    this.providers.set(providerType, provider);

    return provider;
  }

  /**
   * Get all available provider types
   */
  static getAvailableProviders(): AuthProviderType[] {
    return ['local', 'entra', 'shibboleth'];
  }

  /**
   * Check if a provider type is valid
   */
  static isValidProvider(type: string): type is AuthProviderType {
    return ['local', 'entra', 'shibboleth'].includes(type);
  }

  /**
   * Check if a provider type is supported
   */
  static isSupported(type: string): boolean {
    return ['local', 'entra', 'shibboleth'].includes(type);
  }

  /**
   * Clear cached providers (for testing)
   */
  static clearCache(): void {
    this.providers.clear();
  }
}
