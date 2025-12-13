/**
 * Auth Types
 *
 * DASH-AUTH-001: Multi-provider authentication types
 */

/**
 * Supported authentication provider types
 */
export type AuthProviderType = 'local' | 'entra' | 'shibboleth';

/**
 * Authentication provider interface (Strategy Pattern)
 */
export interface AuthProvider {
  readonly type: AuthProviderType;

  /**
   * Authenticate user with provider-specific credentials
   */
  authenticate(credentials: AuthCredentials): Promise<AuthResult>;

  /**
   * Validate an existing session/token
   */
  validateSession(token: string): Promise<AuthUser | null>;

  /**
   * Revoke a session/token
   */
  revokeSession(token: string): Promise<void>;

  /**
   * Get provider-specific login URL (for OAuth/SAML)
   */
  getLoginUrl?(redirectUri: string): string;

  /**
   * Handle callback from external IdP (for OAuth/SAML)
   */
  handleCallback?(params: Record<string, string>): Promise<AuthResult>;
}

/**
 * Base credentials interface
 */
export interface AuthCredentials {
  type: AuthProviderType;
}

/**
 * Local authentication credentials
 * DASH-AUTH-002
 */
export interface LocalCredentials extends AuthCredentials {
  type: 'local';
  email: string;
  password: string;
}

/**
 * Entra ID callback credentials
 * DASH-AUTH-003
 */
export interface EntraCredentials extends AuthCredentials {
  type: 'entra';
  code: string;
  state: string;
}

/**
 * Shibboleth SAML assertion credentials
 * DASH-AUTH-004
 */
export interface ShibbolethCredentials extends AuthCredentials {
  type: 'shibboleth';
  samlResponse: string;
  relayState?: string;
}

/**
 * Authenticated user
 */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationId?: string;
  provider: AuthProviderType;
  attributes?: Record<string, unknown>;
}

/**
 * User roles
 * DASH-AUTH-006
 */
export type UserRole = 'admin' | 'researcher' | 'viewer';

/**
 * Authentication result
 */
export interface AuthResult {
  user: AuthUser;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
}

/**
 * Auth provider configuration
 */
export interface AuthProviderConfig {
  type: AuthProviderType;
}

/**
 * Local provider configuration
 */
export interface LocalProviderConfig extends AuthProviderConfig {
  type: 'local';
  jwtSecret: string;
  jwtExpiresIn: string;
  argon2Options?: {
    memoryCost?: number;
    timeCost?: number;
    parallelism?: number;
  };
}

/**
 * Entra ID provider configuration
 */
export interface EntraProviderConfig extends AuthProviderConfig {
  type: 'entra';
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
  scopes?: string[];
}

/**
 * Shibboleth provider configuration
 */
export interface ShibbolethProviderConfig extends AuthProviderConfig {
  type: 'shibboleth';
  entityId: string;
  idpMetadataUrl: string;
  privateKey: string;
  certificate: string;
  attributeMapping?: Record<string, string>;
}

/**
 * Union type for all provider configs
 */
export type ProviderConfig =
  | LocalProviderConfig
  | EntraProviderConfig
  | ShibbolethProviderConfig;
