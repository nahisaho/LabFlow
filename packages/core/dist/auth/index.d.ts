/**
 * Auth Types
 *
 * DASH-AUTH-001: Multi-provider authentication types
 */
/**
 * Supported authentication provider types
 */
type AuthProviderType = 'local' | 'entra' | 'shibboleth';
/**
 * Authentication provider interface (Strategy Pattern)
 */
interface AuthProvider {
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
interface AuthCredentials {
    type: AuthProviderType;
}
/**
 * Local authentication credentials
 * DASH-AUTH-002
 */
interface LocalCredentials extends AuthCredentials {
    type: 'local';
    email: string;
    password: string;
}
/**
 * Entra ID callback credentials
 * DASH-AUTH-003
 */
interface EntraCredentials extends AuthCredentials {
    type: 'entra';
    code: string;
    state: string;
}
/**
 * Shibboleth SAML assertion credentials
 * DASH-AUTH-004
 */
interface ShibbolethCredentials extends AuthCredentials {
    type: 'shibboleth';
    samlResponse: string;
    relayState?: string;
}
/**
 * Authenticated user
 */
interface AuthUser {
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
type UserRole = 'admin' | 'researcher' | 'viewer';
/**
 * Authentication result
 */
interface AuthResult {
    user: AuthUser;
    token: string;
    refreshToken?: string;
    expiresAt: Date;
}
/**
 * Auth provider configuration
 */
interface AuthProviderConfig {
    type: AuthProviderType;
}
/**
 * Local provider configuration
 */
interface LocalProviderConfig extends AuthProviderConfig {
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
interface EntraProviderConfig extends AuthProviderConfig {
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
interface ShibbolethProviderConfig extends AuthProviderConfig {
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
type ProviderConfig = LocalProviderConfig | EntraProviderConfig | ShibbolethProviderConfig;

/**
 * AuthProviderFactory - Strategy Pattern
 *
 * DASH-AUTH-001: Multi-provider switching based on AUTH_PROVIDER env var
 */

/**
 * Factory for creating authentication providers
 *
 * Usage:
 * ```ts
 * const provider = AuthProviderFactory.create('local', config);
 * const result = await provider.authenticate(credentials);
 * ```
 */
declare class AuthProviderFactory {
    private static providers;
    /**
     * Create an auth provider instance
     *
     * @param config - Provider-specific configuration with type
     * @returns AuthProvider instance
     * @throws ProviderNotConfiguredError if provider type is unknown
     */
    static create(config: ProviderConfig): AuthProvider;
    /**
     * Create provider from environment variable
     *
     * Reads AUTH_PROVIDER env var to determine provider type
     */
    static createFromEnv(): AuthProvider;
    /**
     * Get all available provider types
     */
    static getAvailableProviders(): AuthProviderType[];
    /**
     * Check if a provider type is valid
     */
    static isValidProvider(type: string): type is AuthProviderType;
    /**
     * Check if a provider type is supported
     */
    static isSupported(type: string): boolean;
    /**
     * Clear cached providers (for testing)
     */
    static clearCache(): void;
}

/**
 * LocalAuthProvider - Local Authentication with Argon2id
 *
 * DASH-AUTH-002: Local authentication
 * DASH-AUTH-011: Argon2id password hashing
 * DASH-AUTH-012: Session timeout (15 min idle)
 * DASH-AUTH-013: Account lockout (3 failures = 30 min)
 */

/**
 * Local authentication provider using email/password with Argon2id
 */
declare class LocalAuthProvider implements AuthProvider {
    readonly type: "local";
    private readonly config;
    private readonly jwtSecret;
    private users;
    constructor(config: LocalProviderConfig);
    /**
     * Authenticate with email and password
     */
    authenticate(credentials: AuthCredentials): Promise<AuthResult>;
    /**
     * Validate JWT token
     */
    validateSession(token: string): Promise<AuthUser | null>;
    /**
     * Revoke session (invalidate token)
     */
    revokeSession(token: string): Promise<void>;
    /**
     * Hash password with Argon2id
     */
    hashPassword(password: string): Promise<string>;
    /**
     * Verify password against hash
     */
    private verifyPassword;
    /**
     * Generate JWT token
     */
    private generateToken;
    /**
     * Calculate token expiry date
     */
    private calculateExpiry;
    /**
     * Record failed login attempt (DASH-AUTH-013)
     */
    private recordFailedAttempt;
    /**
     * Reset failed attempts after successful login
     */
    private resetFailedAttempts;
    /**
     * Convert internal user record to AuthUser
     */
    private toAuthUser;
    /**
     * Find user by email (TODO: Replace with repository)
     */
    private findUserByEmail;
    /**
     * Create user (for testing/seeding)
     */
    createUser(email: string, password: string, displayName: string, role?: 'admin' | 'researcher' | 'viewer'): Promise<AuthUser>;
}

/**
 * EntraIDProvider - Microsoft Entra ID (Azure AD) Authentication
 *
 * DASH-AUTH-003: Entra ID (OAuth 2.0/OIDC)
 */

/**
 * Microsoft Entra ID authentication provider using OAuth 2.0/OIDC
 */
declare class EntraIDProvider implements AuthProvider {
    readonly type: "entra";
    private readonly config;
    constructor(config: EntraProviderConfig);
    /**
     * Authenticate with authorization code from Entra ID callback
     */
    authenticate(credentials: AuthCredentials): Promise<AuthResult>;
    /**
     * Validate access token
     */
    validateSession(token: string): Promise<AuthUser | null>;
    /**
     * Revoke session
     */
    revokeSession(token: string): Promise<void>;
    /**
     * Get OAuth 2.0 authorization URL
     */
    getLoginUrl(redirectUri: string): string;
    /**
     * Handle OAuth callback
     */
    handleCallback(params: Record<string, string>): Promise<AuthResult>;
    /**
     * Exchange authorization code for tokens
     */
    private exchangeCodeForTokens;
    /**
     * Validate ID token and extract user info
     */
    private validateIdToken;
    /**
     * Generate random state parameter for CSRF protection
     */
    private generateState;
}

/**
 * ShibbolethProvider - Shibboleth SAML 2.0 Authentication
 *
 * DASH-AUTH-004: Shibboleth (SAML 2.0)
 * Supports 学認 (GakuNin) federation for Japanese academic institutions
 */

/**
 * Shibboleth authentication provider using SAML 2.0
 */
declare class ShibbolethProvider implements AuthProvider {
    readonly type: "shibboleth";
    private readonly config;
    private readonly jwtSecret;
    private readonly attributeMapping;
    constructor(config: ShibbolethProviderConfig);
    /**
     * Authenticate with SAML assertion from Shibboleth IdP
     */
    authenticate(credentials: AuthCredentials): Promise<AuthResult>;
    /**
     * Validate internal JWT token
     */
    validateSession(token: string): Promise<AuthUser | null>;
    /**
     * Revoke session
     */
    revokeSession(token: string): Promise<void>;
    /**
     * Get Shibboleth login URL
     */
    getLoginUrl(redirectUri: string): string;
    /**
     * Handle SAML callback
     */
    handleCallback(params: Record<string, string>): Promise<AuthResult>;
    /**
     * Parse SAML response
     *
     * Note: This is a simplified implementation. In production, use a proper
     * SAML library (e.g., @node-saml/node-saml) for full validation.
     */
    private parseSamlResponse;
    /**
     * Extract user from SAML assertion
     */
    private extractUserFromAssertion;
    /**
     * Generate JWT for internal use
     */
    private generateToken;
    /**
     * Generate consistent user ID from identifier
     */
    private generateUserId;
    /**
     * Determine user role from SAML attributes
     */
    private determineRole;
    /**
     * Simple XML element extraction (replace with proper parser)
     */
    private extractElement;
    /**
     * Simple XML attribute extraction (replace with proper parser)
     */
    private extractAttribute;
    /**
     * Extract SAML attributes from response
     */
    private extractAttributes;
}

/**
 * AuthService - Application Service for Authentication
 *
 * Orchestrates authentication operations using providers
 */

/**
 * Authentication service
 */
declare class AuthService {
    private provider;
    constructor(provider?: AuthProvider);
    /**
     * Get current provider type
     */
    getProviderType(): AuthProviderType;
    /**
     * Get available authentication providers
     */
    getAvailableProviders(): AuthProviderType[];
    /**
     * Authenticate user
     */
    authenticate(credentials: AuthCredentials): Promise<AuthResult>;
    /**
     * Validate session token
     */
    validateSession(token: string): Promise<AuthUser | null>;
    /**
     * Logout / revoke session
     */
    logout(token: string): Promise<void>;
    /**
     * Get login URL for OAuth/SAML providers
     */
    getLoginUrl(redirectUri: string): string | null;
    /**
     * Handle OAuth/SAML callback
     */
    handleCallback(params: Record<string, string>): Promise<AuthResult>;
}

/**
 * Auth Errors
 */
/**
 * Base authentication error
 */
declare class AuthError extends Error {
    readonly code: string;
    readonly statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
/**
 * Invalid credentials error
 */
declare class InvalidCredentialsError extends AuthError {
    constructor(message?: string);
}
/**
 * User not found error
 */
declare class UserNotFoundError extends AuthError {
    constructor(message?: string);
}
/**
 * Session expired error
 */
declare class SessionExpiredError extends AuthError {
    constructor(message?: string);
}
/**
 * Account locked error
 * DASH-AUTH-013
 */
declare class AccountLockedError extends AuthError {
    readonly lockedUntil: Date;
    constructor(lockedUntil: Date);
}
/**
 * Provider not configured error
 */
declare class ProviderNotConfiguredError extends AuthError {
    constructor(providerType: string);
}
/**
 * Invalid token error
 */
declare class InvalidTokenError extends AuthError {
    constructor(message?: string);
}

export { AccountLockedError, type AuthCredentials, AuthError, type AuthProvider, type AuthProviderConfig, AuthProviderFactory, type AuthProviderType, type AuthResult, AuthService, type AuthUser, type EntraCredentials, EntraIDProvider, type EntraProviderConfig, InvalidCredentialsError, InvalidTokenError, LocalAuthProvider, type LocalCredentials, type LocalProviderConfig, type ProviderConfig, ProviderNotConfiguredError, SessionExpiredError, type ShibbolethCredentials, ShibbolethProvider, type ShibbolethProviderConfig, UserNotFoundError, type UserRole };
