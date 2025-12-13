import * as argon2 from 'argon2';
import { jwtVerify, SignJWT } from 'jose';

// src/auth/providers/local.ts

// src/auth/errors.ts
var AuthError = class extends Error {
  constructor(message, code, statusCode = 401) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = "AuthError";
  }
};
var InvalidCredentialsError = class extends AuthError {
  constructor(message = "Invalid email or password") {
    super(message, "INVALID_CREDENTIALS", 401);
    this.name = "InvalidCredentialsError";
  }
};
var UserNotFoundError = class extends AuthError {
  constructor(message = "User not found") {
    super(message, "USER_NOT_FOUND", 404);
    this.name = "UserNotFoundError";
  }
};
var SessionExpiredError = class extends AuthError {
  constructor(message = "Session has expired") {
    super(message, "SESSION_EXPIRED", 401);
    this.name = "SessionExpiredError";
  }
};
var AccountLockedError = class extends AuthError {
  lockedUntil;
  constructor(lockedUntil) {
    const timeStr = lockedUntil.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    super(`Account is locked until ${timeStr}`, "ACCOUNT_LOCKED", 423);
    this.name = "AccountLockedError";
    this.lockedUntil = lockedUntil;
  }
};
var ProviderNotConfiguredError = class extends AuthError {
  constructor(providerType) {
    super(
      `Authentication provider '${providerType}' is not configured`,
      "PROVIDER_NOT_CONFIGURED",
      500
    );
    this.name = "ProviderNotConfiguredError";
  }
};
var InvalidTokenError = class extends AuthError {
  constructor(message = "Invalid or expired token") {
    super(message, "INVALID_TOKEN", 401);
    this.name = "InvalidTokenError";
  }
};

// src/auth/providers/local.ts
var LocalAuthProvider = class {
  type = "local";
  config;
  jwtSecret;
  // TODO: Inject repository
  users = /* @__PURE__ */ new Map();
  constructor(config) {
    this.config = config;
    this.jwtSecret = new TextEncoder().encode(config.jwtSecret);
  }
  /**
   * Authenticate with email and password
   */
  async authenticate(credentials) {
    if (credentials.type !== "local") {
      throw new InvalidCredentialsError("Invalid credential type");
    }
    const { email, password } = credentials;
    const user = this.findUserByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    if (user.lockedUntil && user.lockedUntil > /* @__PURE__ */ new Date()) {
      throw new AccountLockedError(user.lockedUntil);
    }
    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await this.recordFailedAttempt(user);
      throw new InvalidCredentialsError();
    }
    await this.resetFailedAttempts(user);
    const token = await this.generateToken(user);
    const expiresAt = this.calculateExpiry();
    return {
      user: this.toAuthUser(user),
      token,
      expiresAt
    };
  }
  /**
   * Validate JWT token
   */
  async validateSession(token) {
    try {
      const { payload } = await jwtVerify(token, this.jwtSecret);
      const user = this.users.get(payload.sub);
      if (!user) return null;
      return this.toAuthUser(user);
    } catch {
      return null;
    }
  }
  /**
   * Revoke session (invalidate token)
   */
  async revokeSession(token) {
  }
  /**
   * Hash password with Argon2id
   */
  async hashPassword(password) {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.config.argon2Options?.memoryCost ?? 65536,
      // 64 MiB
      timeCost: this.config.argon2Options?.timeCost ?? 3,
      parallelism: this.config.argon2Options?.parallelism ?? 4
    });
  }
  /**
   * Verify password against hash
   */
  async verifyPassword(password, hash2) {
    return argon2.verify(hash2, password);
  }
  /**
   * Generate JWT token
   */
  async generateToken(user) {
    return new SignJWT({
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime(this.config.jwtExpiresIn).sign(this.jwtSecret);
  }
  /**
   * Calculate token expiry date
   */
  calculateExpiry() {
    const match = this.config.jwtExpiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 15 * 60 * 1e3);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = {
      s: 1e3,
      m: 60 * 1e3,
      h: 60 * 60 * 1e3,
      d: 24 * 60 * 60 * 1e3
    };
    return new Date(Date.now() + value * (multipliers[unit] ?? 60 * 1e3));
  }
  /**
   * Record failed login attempt (DASH-AUTH-013)
   */
  async recordFailedAttempt(user) {
    user.failedAttempts += 1;
    if (user.failedAttempts >= 3) {
      user.lockedUntil = new Date(Date.now() + 30 * 60 * 1e3);
      user.failedAttempts = 0;
    }
  }
  /**
   * Reset failed attempts after successful login
   */
  async resetFailedAttempts(user) {
    user.failedAttempts = 0;
    user.lockedUntil = void 0;
  }
  /**
   * Convert internal user record to AuthUser
   */
  toAuthUser(user) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      organizationId: user.organizationId,
      provider: "local"
    };
  }
  /**
   * Find user by email (TODO: Replace with repository)
   */
  findUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return void 0;
  }
  /**
   * Create user (for testing/seeding)
   */
  async createUser(email, password, displayName, role = "researcher") {
    const id = crypto.randomUUID();
    const passwordHash = await this.hashPassword(password);
    const user = {
      id,
      email,
      passwordHash,
      displayName,
      role,
      failedAttempts: 0
    };
    this.users.set(id, user);
    return this.toAuthUser(user);
  }
};

// src/auth/providers/entra.ts
var EntraIDProvider = class {
  type = "entra";
  config;
  constructor(config) {
    this.config = config;
  }
  /**
   * Authenticate with authorization code from Entra ID callback
   */
  async authenticate(credentials) {
    if (credentials.type !== "entra") {
      throw new InvalidCredentialsError("Invalid credential type");
    }
    const { code, state } = credentials;
    const tokens = await this.exchangeCodeForTokens(code);
    const user = await this.validateIdToken(tokens.id_token);
    return {
      user,
      token: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1e3)
    };
  }
  /**
   * Validate access token
   */
  async validateSession(token) {
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!response.ok) {
        return null;
      }
      const profile = await response.json();
      return {
        id: profile.id,
        email: profile.mail || profile.userPrincipalName,
        displayName: profile.displayName,
        role: "researcher",
        // TODO: Map from groups/roles
        provider: "entra",
        attributes: {
          jobTitle: profile.jobTitle,
          department: profile.department
        }
      };
    } catch {
      return null;
    }
  }
  /**
   * Revoke session
   */
  async revokeSession(token) {
  }
  /**
   * Get OAuth 2.0 authorization URL
   */
  getLoginUrl(redirectUri) {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: "code",
      redirect_uri: redirectUri || this.config.redirectUri,
      response_mode: "query",
      scope: this.config.scopes?.join(" ") || "openid profile email",
      state: this.generateState()
    });
    return `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/authorize?${params}`;
  }
  /**
   * Handle OAuth callback
   */
  async handleCallback(params) {
    const { code, state, error, error_description } = params;
    if (error) {
      throw new InvalidCredentialsError(error_description || error);
    }
    if (!code) {
      throw new InvalidCredentialsError("Authorization code not provided");
    }
    return this.authenticate({
      type: "entra",
      code,
      state: state || ""
    });
  }
  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code) {
    const response = await fetch(
      `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
          grant_type: "authorization_code"
        })
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new InvalidCredentialsError(
        error.error_description || "Token exchange failed"
      );
    }
    return response.json();
  }
  /**
   * Validate ID token and extract user info
   */
  async validateIdToken(idToken) {
    const parts = idToken.split(".");
    if (parts.length !== 3 || !parts[1]) {
      throw new InvalidTokenError("Invalid ID token format");
    }
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8")
    );
    if (payload.aud !== this.config.clientId) {
      throw new InvalidTokenError("Invalid audience");
    }
    const userId = payload.oid || payload.sub;
    const userEmail = payload.email || payload.preferred_username;
    const userName = payload.name;
    if (!userId || !userEmail) {
      throw new InvalidTokenError("Missing required claims in ID token");
    }
    return {
      id: userId,
      email: userEmail,
      displayName: userName || userEmail,
      role: "researcher",
      // TODO: Map from roles claim
      provider: "entra",
      attributes: {
        tid: payload.tid,
        iss: payload.iss
      }
    };
  }
  /**
   * Generate random state parameter for CSRF protection
   */
  generateState() {
    return crypto.randomUUID();
  }
};
var DEFAULT_ATTRIBUTE_MAPPING = {
  "urn:oid:0.9.2342.19200300.100.1.3": "email",
  // mail
  "urn:oid:2.5.4.42": "givenName",
  // givenName
  "urn:oid:2.5.4.4": "sn",
  // surname
  "urn:oid:2.16.840.1.113730.3.1.241": "displayName",
  // displayName
  "urn:oid:1.3.6.1.4.1.5923.1.1.1.6": "eduPersonPrincipalName",
  // eppn
  "urn:oid:1.3.6.1.4.1.5923.1.1.1.9": "eduPersonScopedAffiliation",
  // affiliation
  "urn:oid:1.3.6.1.4.1.5923.1.1.1.7": "eduPersonEntitlement"
  // entitlement
};
var ShibbolethProvider = class {
  type = "shibboleth";
  config;
  jwtSecret;
  attributeMapping;
  constructor(config) {
    this.config = config;
    this.jwtSecret = new TextEncoder().encode(
      config.privateKey.slice(0, 64) || "default-secret"
    );
    this.attributeMapping = {
      ...DEFAULT_ATTRIBUTE_MAPPING,
      ...config.attributeMapping
    };
  }
  /**
   * Authenticate with SAML assertion from Shibboleth IdP
   */
  async authenticate(credentials) {
    if (credentials.type !== "shibboleth") {
      throw new InvalidCredentialsError("Invalid credential type");
    }
    const { samlResponse, relayState } = credentials;
    const assertion = await this.parseSamlResponse(samlResponse);
    const user = this.extractUserFromAssertion(assertion);
    const token = await this.generateToken(user);
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1e3);
    return {
      user,
      token,
      expiresAt
    };
  }
  /**
   * Validate internal JWT token
   */
  async validateSession(token) {
    try {
      const { payload } = await jwtVerify(token, this.jwtSecret);
      return {
        id: payload.sub,
        email: payload.email,
        displayName: payload.displayName,
        role: payload.role || "researcher",
        provider: "shibboleth",
        attributes: payload.attributes
      };
    } catch {
      return null;
    }
  }
  /**
   * Revoke session
   */
  async revokeSession(token) {
  }
  /**
   * Get Shibboleth login URL
   */
  getLoginUrl(redirectUri) {
    const params = new URLSearchParams({
      target: redirectUri
    });
    return `/Shibboleth.sso/Login?${params}`;
  }
  /**
   * Handle SAML callback
   */
  async handleCallback(params) {
    const { SAMLResponse, RelayState } = params;
    if (!SAMLResponse) {
      throw new InvalidCredentialsError("SAML response not provided");
    }
    return this.authenticate({
      type: "shibboleth",
      samlResponse: SAMLResponse,
      relayState: RelayState
    });
  }
  /**
   * Parse SAML response
   *
   * Note: This is a simplified implementation. In production, use a proper
   * SAML library (e.g., @node-saml/node-saml) for full validation.
   */
  async parseSamlResponse(samlResponse) {
    const decoded = Buffer.from(samlResponse, "base64").toString("utf-8");
    const attributes = this.extractAttributes(decoded);
    return {
      issuer: this.extractElement(decoded, "Issuer") || "",
      nameId: this.extractElement(decoded, "NameID") || "",
      sessionIndex: this.extractAttribute(decoded, "SessionIndex") || "",
      attributes
    };
  }
  /**
   * Extract user from SAML assertion
   */
  extractUserFromAssertion(assertion) {
    const attrs = assertion.attributes;
    const mailOid = this.attributeMapping["urn:oid:0.9.2342.19200300.100.1.3"] ?? "mail";
    const displayNameOid = this.attributeMapping["urn:oid:2.16.840.1.113730.3.1.241"] ?? "displayName";
    const eppnOid = this.attributeMapping["urn:oid:1.3.6.1.4.1.5923.1.1.1.6"] ?? "eduPersonPrincipalName";
    const affiliationOid = this.attributeMapping["urn:oid:1.3.6.1.4.1.5923.1.1.1.9"] ?? "eduPersonScopedAffiliation";
    const email = attrs[mailOid] || attrs["mail"] || assertion.nameId;
    const displayName = attrs[displayNameOid] || attrs["displayName"] || email.split("@")[0] || email;
    const eppn = attrs[eppnOid] || attrs["eduPersonPrincipalName"] || email;
    const id = this.generateUserId(eppn);
    const role = this.determineRole(attrs);
    return {
      id,
      email,
      displayName,
      role,
      provider: "shibboleth",
      attributes: {
        eppn,
        affiliation: attrs[affiliationOid],
        issuer: assertion.issuer
      }
    };
  }
  /**
   * Generate JWT for internal use
   */
  async generateToken(user) {
    return new SignJWT({
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      attributes: user.attributes
    }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime("8h").sign(this.jwtSecret);
  }
  /**
   * Generate consistent user ID from identifier
   */
  generateUserId(identifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(identifier);
    let hash2 = 0;
    for (const byte of data) {
      hash2 = (hash2 << 5) - hash2 + byte;
      hash2 |= 0;
    }
    return `shib_${Math.abs(hash2).toString(16)}`;
  }
  /**
   * Determine user role from SAML attributes
   */
  determineRole(attrs) {
    const affiliationOid = this.attributeMapping["urn:oid:1.3.6.1.4.1.5923.1.1.1.9"] ?? "eduPersonScopedAffiliation";
    const affiliation = attrs[affiliationOid] || attrs["eduPersonScopedAffiliation"] || "";
    if (affiliation.includes("staff") || affiliation.includes("faculty")) {
      return "researcher";
    }
    if (affiliation.includes("student")) {
      return "viewer";
    }
    return "researcher";
  }
  /**
   * Simple XML element extraction (replace with proper parser)
   */
  extractElement(xml, elementName) {
    const regex = new RegExp(`<[^>]*${elementName}[^>]*>([^<]*)<`, "i");
    const match = xml.match(regex);
    return match?.[1];
  }
  /**
   * Simple XML attribute extraction (replace with proper parser)
   */
  extractAttribute(xml, attrName) {
    const regex = new RegExp(`${attrName}="([^"]*)"`, "i");
    const match = xml.match(regex);
    return match?.[1];
  }
  /**
   * Extract SAML attributes from response
   */
  extractAttributes(xml) {
    const attributes = {};
    const attrRegex = /<(?:saml2?:)?Attribute[^>]*Name="([^"]*)"[^>]*>[\s\S]*?<(?:saml2?:)?AttributeValue[^>]*>([^<]*)</g;
    let match;
    while ((match = attrRegex.exec(xml)) !== null) {
      if (match[1] && match[2]) {
        attributes[match[1]] = match[2];
      }
    }
    return attributes;
  }
};

// src/auth/providers/factory.ts
var AuthProviderFactory = class {
  static providers = /* @__PURE__ */ new Map();
  /**
   * Create an auth provider instance
   *
   * @param config - Provider-specific configuration with type
   * @returns AuthProvider instance
   * @throws ProviderNotConfiguredError if provider type is unknown
   */
  static create(config) {
    switch (config.type) {
      case "local":
        return new LocalAuthProvider(config);
      case "entra":
        return new EntraIDProvider(config);
      case "shibboleth":
        return new ShibbolethProvider(config);
      default:
        throw new ProviderNotConfiguredError(config.type ?? "unknown");
    }
  }
  /**
   * Create provider from environment variable
   *
   * Reads AUTH_PROVIDER env var to determine provider type
   */
  static createFromEnv() {
    const providerType = process.env.AUTH_PROVIDER || "local";
    const cached = this.providers.get(providerType);
    if (cached) return cached;
    let config;
    switch (providerType) {
      case "local":
        config = {
          type: "local",
          jwtSecret: process.env.JWT_SECRET || "",
          jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m"
        };
        break;
      case "entra":
        if (!process.env.ENTRA_CLIENT_ID || !process.env.ENTRA_CLIENT_SECRET) {
          throw new ProviderNotConfiguredError("entra - missing required environment variables (ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET)");
        }
        config = {
          type: "entra",
          clientId: process.env.ENTRA_CLIENT_ID || "",
          clientSecret: process.env.ENTRA_CLIENT_SECRET || "",
          tenantId: process.env.ENTRA_TENANT_ID || "",
          redirectUri: process.env.ENTRA_REDIRECT_URI || ""
        };
        break;
      case "shibboleth":
        config = {
          type: "shibboleth",
          entityId: process.env.SHIBBOLETH_ENTITY_ID || "",
          idpMetadataUrl: process.env.SHIBBOLETH_IDP_METADATA_URL || "",
          privateKey: process.env.SHIBBOLETH_PRIVATE_KEY || "",
          certificate: process.env.SHIBBOLETH_CERTIFICATE || ""
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
  static getAvailableProviders() {
    return ["local", "entra", "shibboleth"];
  }
  /**
   * Check if a provider type is valid
   */
  static isValidProvider(type) {
    return ["local", "entra", "shibboleth"].includes(type);
  }
  /**
   * Check if a provider type is supported
   */
  static isSupported(type) {
    return ["local", "entra", "shibboleth"].includes(type);
  }
  /**
   * Clear cached providers (for testing)
   */
  static clearCache() {
    this.providers.clear();
  }
};

// src/auth/service.ts
var AuthService = class {
  provider;
  constructor(provider) {
    this.provider = provider || AuthProviderFactory.createFromEnv();
  }
  /**
   * Get current provider type
   */
  getProviderType() {
    return this.provider.type;
  }
  /**
   * Get available authentication providers
   */
  getAvailableProviders() {
    return AuthProviderFactory.getAvailableProviders();
  }
  /**
   * Authenticate user
   */
  async authenticate(credentials) {
    return this.provider.authenticate(credentials);
  }
  /**
   * Validate session token
   */
  async validateSession(token) {
    return this.provider.validateSession(token);
  }
  /**
   * Logout / revoke session
   */
  async logout(token) {
    return this.provider.revokeSession(token);
  }
  /**
   * Get login URL for OAuth/SAML providers
   */
  getLoginUrl(redirectUri) {
    if (this.provider.getLoginUrl) {
      return this.provider.getLoginUrl(redirectUri);
    }
    return null;
  }
  /**
   * Handle OAuth/SAML callback
   */
  async handleCallback(params) {
    if (this.provider.handleCallback) {
      return this.provider.handleCallback(params);
    }
    throw new Error("Provider does not support callback handling");
  }
};

export { AccountLockedError, AuthError, AuthProviderFactory, AuthService, EntraIDProvider, InvalidCredentialsError, InvalidTokenError, LocalAuthProvider, ProviderNotConfiguredError, SessionExpiredError, ShibbolethProvider, UserNotFoundError };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map