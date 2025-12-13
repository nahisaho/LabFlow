/**
 * EntraIDProvider - Microsoft Entra ID (Azure AD) Authentication
 *
 * DASH-AUTH-003: Entra ID (OAuth 2.0/OIDC)
 */

import type {
  AuthProvider,
  AuthCredentials,
  EntraCredentials,
  EntraProviderConfig,
  AuthResult,
  AuthUser,
} from '../types.js';
import { InvalidCredentialsError, InvalidTokenError } from '../errors.js';

/**
 * Microsoft Entra ID authentication provider using OAuth 2.0/OIDC
 */
export class EntraIDProvider implements AuthProvider {
  readonly type = 'entra' as const;
  private readonly config: EntraProviderConfig;

  constructor(config: EntraProviderConfig) {
    this.config = config;
  }

  /**
   * Authenticate with authorization code from Entra ID callback
   */
  async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    if (credentials.type !== 'entra') {
      throw new InvalidCredentialsError('Invalid credential type');
    }

    const { code, state } = credentials as EntraCredentials;

    // Exchange authorization code for tokens
    const tokens = await this.exchangeCodeForTokens(code);

    // Validate ID token and extract user info
    const user = await this.validateIdToken(tokens.id_token);

    return {
      user,
      token: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    };
  }

  /**
   * Validate access token
   */
  async validateSession(token: string): Promise<AuthUser | null> {
    try {
      // Validate token with Microsoft identity platform
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const profile = await response.json() as {
        id: string;
        mail?: string;
        userPrincipalName: string;
        displayName: string;
        jobTitle?: string;
        department?: string;
      };

      return {
        id: profile.id,
        email: profile.mail || profile.userPrincipalName,
        displayName: profile.displayName,
        role: 'researcher', // TODO: Map from groups/roles
        provider: 'entra',
        attributes: {
          jobTitle: profile.jobTitle,
          department: profile.department,
        },
      };
    } catch {
      return null;
    }
  }

  /**
   * Revoke session
   */
  async revokeSession(token: string): Promise<void> {
    // Entra ID tokens are managed by Microsoft
    // Client-side logout redirects to Microsoft logout endpoint
  }

  /**
   * Get OAuth 2.0 authorization URL
   */
  getLoginUrl(redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: redirectUri || this.config.redirectUri,
      response_mode: 'query',
      scope: this.config.scopes?.join(' ') || 'openid profile email',
      state: this.generateState(),
    });

    return `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/authorize?${params}`;
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(params: Record<string, string>): Promise<AuthResult> {
    const { code, state, error, error_description } = params;

    if (error) {
      throw new InvalidCredentialsError(error_description || error);
    }

    if (!code) {
      throw new InvalidCredentialsError('Authorization code not provided');
    }

    return this.authenticate({
      type: 'entra',
      code,
      state: state || '',
    } as EntraCredentials);
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    id_token: string;
    refresh_token?: string;
    expires_in: number;
  }> {
    const response = await fetch(
      `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
          grant_type: 'authorization_code',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json() as { error_description?: string };
      throw new InvalidCredentialsError(
        error.error_description || 'Token exchange failed'
      );
    }

    return response.json() as Promise<{
      access_token: string;
      id_token: string;
      refresh_token?: string;
      expires_in: number;
    }>;
  }

  /**
   * Validate ID token and extract user info
   */
  private async validateIdToken(idToken: string): Promise<AuthUser> {
    // Decode JWT (in production, verify signature with JWKS)
    const parts = idToken.split('.');
    if (parts.length !== 3 || !parts[1]) {
      throw new InvalidTokenError('Invalid ID token format');
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    ) as {
      aud?: string;
      oid?: string;
      sub?: string;
      email?: string;
      preferred_username?: string;
      name?: string;
      tid?: string;
      iss?: string;
    };

    // Validate claims
    if (payload.aud !== this.config.clientId) {
      throw new InvalidTokenError('Invalid audience');
    }

    const userId = payload.oid || payload.sub;
    const userEmail = payload.email || payload.preferred_username;
    const userName = payload.name;

    if (!userId || !userEmail) {
      throw new InvalidTokenError('Missing required claims in ID token');
    }

    return {
      id: userId,
      email: userEmail,
      displayName: userName || userEmail,
      role: 'researcher', // TODO: Map from roles claim
      provider: 'entra',
      attributes: {
        tid: payload.tid,
        iss: payload.iss,
      },
    };
  }

  /**
   * Generate random state parameter for CSRF protection
   */
  private generateState(): string {
    return crypto.randomUUID();
  }
}
