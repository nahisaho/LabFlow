/**
 * AuthService - Application Service for Authentication
 *
 * Orchestrates authentication operations using providers
 */

import type {
  AuthProvider,
  AuthProviderType,
  AuthCredentials,
  AuthResult,
  AuthUser,
} from './types.js';
import { AuthProviderFactory } from './providers/factory.js';

/**
 * Authentication service
 */
export class AuthService {
  private provider: AuthProvider;

  constructor(provider?: AuthProvider) {
    this.provider = provider || AuthProviderFactory.createFromEnv();
  }

  /**
   * Get current provider type
   */
  getProviderType(): AuthProviderType {
    return this.provider.type;
  }

  /**
   * Get available authentication providers
   */
  getAvailableProviders(): AuthProviderType[] {
    return AuthProviderFactory.getAvailableProviders();
  }

  /**
   * Authenticate user
   */
  async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    return this.provider.authenticate(credentials);
  }

  /**
   * Validate session token
   */
  async validateSession(token: string): Promise<AuthUser | null> {
    return this.provider.validateSession(token);
  }

  /**
   * Logout / revoke session
   */
  async logout(token: string): Promise<void> {
    return this.provider.revokeSession(token);
  }

  /**
   * Get login URL for OAuth/SAML providers
   */
  getLoginUrl(redirectUri: string): string | null {
    if (this.provider.getLoginUrl) {
      return this.provider.getLoginUrl(redirectUri);
    }
    return null;
  }

  /**
   * Handle OAuth/SAML callback
   */
  async handleCallback(params: Record<string, string>): Promise<AuthResult> {
    if (this.provider.handleCallback) {
      return this.provider.handleCallback(params);
    }
    throw new Error('Provider does not support callback handling');
  }
}
