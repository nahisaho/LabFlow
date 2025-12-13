/**
 * Auth Module - Multi-provider Authentication
 *
 * Requirements:
 * - DASH-AUTH-001: Multi-provider switching (Local, Entra ID, Shibboleth)
 * - DASH-AUTH-002: Local authentication with Argon2id
 * - DASH-AUTH-003: Entra ID (OAuth 2.0/OIDC)
 * - DASH-AUTH-004: Shibboleth (SAML 2.0)
 */

// Types
export * from './types.js';

// Providers
export { AuthProviderFactory } from './providers/factory.js';
export { LocalAuthProvider } from './providers/local.js';
export { EntraIDProvider } from './providers/entra.js';
export { ShibbolethProvider } from './providers/shibboleth.js';

// Services
export { AuthService } from './service.js';

// Errors
export * from './errors.js';
