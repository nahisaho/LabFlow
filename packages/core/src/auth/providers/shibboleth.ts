/**
 * ShibbolethProvider - Shibboleth SAML 2.0 Authentication
 *
 * DASH-AUTH-004: Shibboleth (SAML 2.0)
 * Supports 学認 (GakuNin) federation for Japanese academic institutions
 */

import type {
  AuthProvider,
  AuthCredentials,
  ShibbolethCredentials,
  ShibbolethProviderConfig,
  AuthResult,
  AuthUser,
} from '../types.js';
import { InvalidCredentialsError, InvalidTokenError } from '../errors.js';
import { SignJWT, jwtVerify } from 'jose';

/**
 * Default attribute mapping for eduPerson schema (GakuNin)
 */
const DEFAULT_ATTRIBUTE_MAPPING: Record<string, string> = {
  'urn:oid:0.9.2342.19200300.100.1.3': 'email', // mail
  'urn:oid:2.5.4.42': 'givenName', // givenName
  'urn:oid:2.5.4.4': 'sn', // surname
  'urn:oid:2.16.840.1.113730.3.1.241': 'displayName', // displayName
  'urn:oid:1.3.6.1.4.1.5923.1.1.1.6': 'eduPersonPrincipalName', // eppn
  'urn:oid:1.3.6.1.4.1.5923.1.1.1.9': 'eduPersonScopedAffiliation', // affiliation
  'urn:oid:1.3.6.1.4.1.5923.1.1.1.7': 'eduPersonEntitlement', // entitlement
};

/**
 * Shibboleth authentication provider using SAML 2.0
 */
export class ShibbolethProvider implements AuthProvider {
  readonly type = 'shibboleth' as const;
  private readonly config: ShibbolethProviderConfig;
  private readonly jwtSecret: Uint8Array;
  private readonly attributeMapping: Record<string, string>;

  constructor(config: ShibbolethProviderConfig) {
    this.config = config;
    // Use private key as JWT secret (in production, use separate secret)
    this.jwtSecret = new TextEncoder().encode(
      config.privateKey.slice(0, 64) || 'default-secret'
    );
    this.attributeMapping = {
      ...DEFAULT_ATTRIBUTE_MAPPING,
      ...config.attributeMapping,
    };
  }

  /**
   * Authenticate with SAML assertion from Shibboleth IdP
   */
  async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    if (credentials.type !== 'shibboleth') {
      throw new InvalidCredentialsError('Invalid credential type');
    }

    const { samlResponse, relayState } = credentials as ShibbolethCredentials;

    // Parse and validate SAML response
    const assertion = await this.parseSamlResponse(samlResponse);

    // Extract user attributes
    const user = this.extractUserFromAssertion(assertion);

    // Generate JWT for internal use
    const token = await this.generateToken(user);
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

    return {
      user,
      token,
      expiresAt,
    };
  }

  /**
   * Validate internal JWT token
   */
  async validateSession(token: string): Promise<AuthUser | null> {
    try {
      const { payload } = await jwtVerify(token, this.jwtSecret);

      return {
        id: payload.sub as string,
        email: payload.email as string,
        displayName: payload.displayName as string,
        role: (payload.role as 'admin' | 'researcher' | 'viewer') || 'researcher',
        provider: 'shibboleth',
        attributes: payload.attributes as Record<string, unknown>,
      };
    } catch {
      return null;
    }
  }

  /**
   * Revoke session
   */
  async revokeSession(token: string): Promise<void> {
    // TODO: Add token to blacklist
  }

  /**
   * Get Shibboleth login URL
   */
  getLoginUrl(redirectUri: string): string {
    // Shibboleth SP initiates login via configured handler
    const params = new URLSearchParams({
      target: redirectUri,
    });

    return `/Shibboleth.sso/Login?${params}`;
  }

  /**
   * Handle SAML callback
   */
  async handleCallback(params: Record<string, string>): Promise<AuthResult> {
    const { SAMLResponse, RelayState } = params;

    if (!SAMLResponse) {
      throw new InvalidCredentialsError('SAML response not provided');
    }

    return this.authenticate({
      type: 'shibboleth',
      samlResponse: SAMLResponse,
      relayState: RelayState,
    } as ShibbolethCredentials);
  }

  /**
   * Parse SAML response
   *
   * Note: This is a simplified implementation. In production, use a proper
   * SAML library (e.g., @node-saml/node-saml) for full validation.
   */
  private async parseSamlResponse(
    samlResponse: string
  ): Promise<SamlAssertion> {
    // Decode base64 SAML response
    const decoded = Buffer.from(samlResponse, 'base64').toString('utf-8');

    // TODO: Implement full SAML signature validation
    // For now, extract basic attributes (NOT PRODUCTION READY)

    // Simple XML parsing (use proper XML parser in production)
    const attributes = this.extractAttributes(decoded);

    return {
      issuer: this.extractElement(decoded, 'Issuer') || '',
      nameId: this.extractElement(decoded, 'NameID') || '',
      sessionIndex: this.extractAttribute(decoded, 'SessionIndex') || '',
      attributes,
    };
  }

  /**
   * Extract user from SAML assertion
   */
  private extractUserFromAssertion(assertion: SamlAssertion): AuthUser {
    const attrs = assertion.attributes;
    const mailOid = this.attributeMapping['urn:oid:0.9.2342.19200300.100.1.3'] ?? 'mail';
    const displayNameOid = this.attributeMapping['urn:oid:2.16.840.1.113730.3.1.241'] ?? 'displayName';
    const eppnOid = this.attributeMapping['urn:oid:1.3.6.1.4.1.5923.1.1.1.6'] ?? 'eduPersonPrincipalName';
    const affiliationOid = this.attributeMapping['urn:oid:1.3.6.1.4.1.5923.1.1.1.9'] ?? 'eduPersonScopedAffiliation';

    // Map SAML attributes to user properties
    const email =
      attrs[mailOid] ||
      attrs['mail'] ||
      assertion.nameId;

    const displayName =
      attrs[displayNameOid] ||
      attrs['displayName'] ||
      email.split('@')[0] || email;

    // Generate consistent user ID from ePPN or email
    const eppn =
      attrs[eppnOid] ||
      attrs['eduPersonPrincipalName'] ||
      email;

    const id = this.generateUserId(eppn);

    // Determine role from entitlements
    const role = this.determineRole(attrs);

    return {
      id,
      email,
      displayName,
      role,
      provider: 'shibboleth',
      attributes: {
        eppn,
        affiliation: attrs[affiliationOid],
        issuer: assertion.issuer,
      },
    };
  }

  /**
   * Generate JWT for internal use
   */
  private async generateToken(user: AuthUser): Promise<string> {
    return new SignJWT({
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      attributes: user.attributes,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(this.jwtSecret);
  }

  /**
   * Generate consistent user ID from identifier
   */
  private generateUserId(identifier: string): string {
    // Create hash-based ID for consistency
    const encoder = new TextEncoder();
    const data = encoder.encode(identifier);

    // Simple hash (use crypto.subtle.digest in production)
    let hash = 0;
    for (const byte of data) {
      hash = (hash << 5) - hash + byte;
      hash |= 0;
    }

    return `shib_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Determine user role from SAML attributes
   */
  private determineRole(
    attrs: Record<string, string>
  ): 'admin' | 'researcher' | 'viewer' {
    const affiliationOid = this.attributeMapping['urn:oid:1.3.6.1.4.1.5923.1.1.1.9'] ?? 'eduPersonScopedAffiliation';
    const affiliation =
      attrs[affiliationOid] ||
      attrs['eduPersonScopedAffiliation'] ||
      '';

    // Map affiliations to roles
    if (affiliation.includes('staff') || affiliation.includes('faculty')) {
      return 'researcher';
    }
    if (affiliation.includes('student')) {
      return 'viewer';
    }

    return 'researcher';
  }

  /**
   * Simple XML element extraction (replace with proper parser)
   */
  private extractElement(xml: string, elementName: string): string | undefined {
    const regex = new RegExp(`<[^>]*${elementName}[^>]*>([^<]*)<`, 'i');
    const match = xml.match(regex);
    return match?.[1];
  }

  /**
   * Simple XML attribute extraction (replace with proper parser)
   */
  private extractAttribute(xml: string, attrName: string): string | undefined {
    const regex = new RegExp(`${attrName}="([^"]*)"`, 'i');
    const match = xml.match(regex);
    return match?.[1];
  }

  /**
   * Extract SAML attributes from response
   */
  private extractAttributes(xml: string): Record<string, string> {
    const attributes: Record<string, string> = {};

    // Simple regex-based extraction (use proper XML parser in production)
    const attrRegex =
      /<(?:saml2?:)?Attribute[^>]*Name="([^"]*)"[^>]*>[\s\S]*?<(?:saml2?:)?AttributeValue[^>]*>([^<]*)</g;

    let match;
    while ((match = attrRegex.exec(xml)) !== null) {
      if (match[1] && match[2]) {
        attributes[match[1]] = match[2];
      }
    }

    return attributes;
  }
}

/**
 * SAML assertion structure
 */
interface SamlAssertion {
  issuer: string;
  nameId: string;
  sessionIndex: string;
  attributes: Record<string, string>;
}
