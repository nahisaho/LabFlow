import * as argon2 from 'argon2';
import { jwtVerify, SignJWT } from 'jose';
import { pgTable, timestamp, jsonb, varchar, boolean, uuid, index, integer, real, vector } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

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

// src/workflow/domain/step.ts
var Step = class _Step {
  _id;
  _name;
  _type;
  _domain;
  _config;
  _requiredConfigFields;
  _position;
  _dependencies;
  _status;
  _statusHistory;
  _output;
  _metrics;
  _optional;
  constructor(params) {
    this._id = params.id;
    this._name = params.name;
    this._type = params.type;
    this._domain = params.domain;
    this._config = params.config ?? {};
    this._requiredConfigFields = params.requiredConfigFields ?? [];
    this._position = params.position ?? { x: 0, y: 0 };
    this._dependencies = params.dependencies ?? [];
    this._status = params.status ?? "pending";
    this._statusHistory = [{ status: this._status, timestamp: /* @__PURE__ */ new Date() }];
    this._metrics = {};
    this._optional = params.optional ?? false;
  }
  // Getters
  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }
  get type() {
    return this._type;
  }
  get domain() {
    return this._domain;
  }
  get config() {
    return { ...this._config };
  }
  get position() {
    return { ...this._position };
  }
  get dependencies() {
    return [...this._dependencies];
  }
  get status() {
    return this._status;
  }
  get statusHistory() {
    return [...this._statusHistory];
  }
  get output() {
    return this._output;
  }
  get metrics() {
    return { ...this._metrics };
  }
  get optional() {
    return this._optional;
  }
  /**
   * Update step name
   */
  updateName(name) {
    this._name = name;
  }
  /**
   * Update step configuration
   */
  updateConfig(config) {
    this._config = { ...this._config, ...config };
  }
  /**
   * Update step position
   */
  updatePosition(position) {
    this._position = { ...position };
  }
  /**
   * Add dependency
   */
  addDependency(stepId) {
    if (!this._dependencies.includes(stepId)) {
      this._dependencies.push(stepId);
    }
  }
  /**
   * Remove dependency
   */
  removeDependency(stepId) {
    const index6 = this._dependencies.indexOf(stepId);
    if (index6 > -1) {
      this._dependencies.splice(index6, 1);
    }
  }
  /**
   * Update status
   */
  updateStatus(status) {
    this._status = status;
    this._statusHistory.push({ status, timestamp: /* @__PURE__ */ new Date() });
  }
  /**
   * Validate config against required fields
   */
  validateConfig() {
    const missingFields = [];
    for (const field of this._requiredConfigFields) {
      if (!(field in this._config) || this._config[field] === void 0) {
        missingFields.push(field);
      }
    }
    return {
      valid: missingFields.length === 0,
      missingFields
    };
  }
  /**
   * Check if this step depends on another step
   */
  dependsOn(stepId) {
    return this._dependencies.includes(stepId);
  }
  /**
   * Start step execution
   */
  start() {
    if (this._status !== "pending") {
      throw new Error(`Cannot start step in ${this._status} state`);
    }
    this._status = "running";
    this._statusHistory.push({ status: "running", timestamp: /* @__PURE__ */ new Date() });
    this._metrics.startTime = /* @__PURE__ */ new Date();
  }
  /**
   * Complete step execution
   */
  complete(output) {
    if (this._status !== "running") {
      throw new Error(`Cannot complete step in ${this._status} state`);
    }
    this._status = "completed";
    this._statusHistory.push({ status: "completed", timestamp: /* @__PURE__ */ new Date() });
    this._metrics.endTime = /* @__PURE__ */ new Date();
    if (this._metrics.startTime) {
      this._metrics.duration = this._metrics.endTime.getTime() - this._metrics.startTime.getTime();
    }
    if (output !== void 0) {
      this._output = output;
    }
  }
  /**
   * Fail step execution
   */
  fail(error) {
    if (this._status !== "running") {
      throw new Error(`Cannot fail step in ${this._status} state`);
    }
    this._status = "failed";
    this._statusHistory.push({ status: "failed", timestamp: /* @__PURE__ */ new Date() });
    this._metrics.endTime = /* @__PURE__ */ new Date();
    if (this._metrics.startTime) {
      this._metrics.duration = this._metrics.endTime.getTime() - this._metrics.startTime.getTime();
    }
    if (error) {
      this._output = { error };
    }
  }
  /**
   * Skip step (WKFL-COMM-004)
   */
  skip(reason) {
    if (this._status !== "pending") {
      throw new Error(`Cannot skip step in ${this._status} state`);
    }
    if (!this._optional) {
      throw new Error("Cannot skip required step");
    }
    this._status = "skipped";
    this._statusHistory.push({ status: "skipped", timestamp: /* @__PURE__ */ new Date() });
    if (reason) {
      this._output = { skipReason: reason };
    }
  }
  /**
   * Reset step to pending state
   */
  reset() {
    this._status = "pending";
    this._statusHistory.push({ status: "pending", timestamp: /* @__PURE__ */ new Date() });
    this._output = void 0;
    this._metrics = {};
  }
  /**
   * Set step output
   */
  setOutput(output) {
    this._output = output;
  }
  /**
   * Check if step is skippable
   */
  isSkippable() {
    return this._optional;
  }
  /**
   * Clone step with new ID
   */
  clone(newId) {
    return new _Step({
      id: newId ?? crypto.randomUUID(),
      name: this._name,
      type: this._type,
      domain: this._domain,
      config: { ...this._config },
      requiredConfigFields: [...this._requiredConfigFields],
      position: { ...this._position },
      dependencies: [...this._dependencies],
      status: "pending",
      optional: this._optional
    });
  }
  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this._id,
      name: this._name,
      type: this._type,
      domain: this._domain,
      config: this._config,
      requiredConfigFields: this._requiredConfigFields,
      position: this._position,
      dependencies: this._dependencies,
      status: this._status,
      optional: this._optional,
      output: this._output,
      metrics: this._metrics
    };
  }
  /**
   * Deserialize from JSON
   */
  static fromJSON(json) {
    return new _Step({
      id: json.id,
      name: json.name,
      type: json.type,
      domain: json.domain,
      config: json.config,
      requiredConfigFields: json.requiredConfigFields,
      position: json.position,
      dependencies: json.dependencies,
      status: json.status,
      optional: json.optional
    });
  }
};

// src/workflow/domain/workflow.ts
var Workflow = class _Workflow {
  _id;
  _name;
  _description;
  _domain;
  _templateId;
  _version;
  _versionHistory;
  _status;
  _userId;
  _organizationId;
  _steps;
  _createdAt;
  _updatedAt;
  constructor(params) {
    this._id = params.id;
    this._name = params.name;
    this._description = params.description;
    this._domain = params.domain;
    this._templateId = params.templateId;
    this._version = params.version ?? 1;
    this._versionHistory = [];
    this._status = params.status ?? "draft";
    this._userId = params.userId;
    this._organizationId = params.organizationId;
    this._steps = /* @__PURE__ */ new Map();
    this._createdAt = params.createdAt ?? /* @__PURE__ */ new Date();
    this._updatedAt = params.updatedAt ?? /* @__PURE__ */ new Date();
  }
  // Getters
  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }
  get description() {
    return this._description;
  }
  get domain() {
    return this._domain;
  }
  get templateId() {
    return this._templateId;
  }
  get version() {
    return this._version;
  }
  get status() {
    return this._status;
  }
  get userId() {
    return this._userId;
  }
  get organizationId() {
    return this._organizationId;
  }
  get steps() {
    return Array.from(this._steps.values());
  }
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }
  /**
   * Get workflow metadata
   */
  getMetadata() {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      domain: this._domain,
      templateId: this._templateId,
      version: this._version,
      status: this._status,
      userId: this._userId,
      organizationId: this._organizationId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      stepCount: this._steps.size
    };
  }
  /**
   * Add a step to the workflow
   */
  addStep(step) {
    if (this._status === "archived") {
      throw new Error("Cannot modify archived workflow");
    }
    if (this._steps.has(step.id)) {
      throw new Error(`Step with ID ${step.id} already exists`);
    }
    for (const depId of step.dependencies) {
      if (!this._steps.has(depId)) {
        throw new Error(`Dependency step ${depId} not found`);
      }
    }
    this._steps.set(step.id, step);
    this._incrementVersion();
  }
  /**
   * Remove a step from the workflow
   */
  /**
   * Remove a step from the workflow
   */
  removeStep(stepId) {
    if (this._status === "archived") {
      throw new Error("Cannot modify archived workflow");
    }
    for (const step of this._steps.values()) {
      if (step.dependencies.includes(stepId)) {
        throw new Error(`Cannot remove step ${stepId}: step ${step.id} depends on it`);
      }
    }
    this._steps.delete(stepId);
    this._incrementVersion();
  }
  /**
   * Get a step by ID
   */
  getStep(stepId) {
    return this._steps.get(stepId);
  }
  /**
   * Update workflow name
   */
  updateName(name) {
    if (this._status === "archived") {
      throw new Error("Cannot modify archived workflow");
    }
    this._name = name;
    this._incrementVersion();
  }
  /**
   * Update workflow description
   */
  updateDescription(description) {
    if (this._status === "archived") {
      throw new Error("Cannot modify archived workflow");
    }
    this._description = description;
    this._incrementVersion();
  }
  /**
   * Increment version (private helper)
   */
  _incrementVersion() {
    this._version += 1;
    this._updatedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Reorder steps
   */
  reorderSteps(stepIds) {
    if (this._status === "archived") {
      throw new Error("Cannot modify archived workflow");
    }
    for (const id of stepIds) {
      if (!this._steps.has(id)) {
        throw new Error(`Step ${id} not found`);
      }
    }
    const newSteps = /* @__PURE__ */ new Map();
    for (const id of stepIds) {
      newSteps.set(id, this._steps.get(id));
    }
    this._steps = newSteps;
    this._incrementVersion();
  }
  /**
   * Activate workflow (draft -> active)
   */
  activate() {
    if (this._status !== "draft") {
      throw new Error(`Cannot activate workflow in ${this._status} state`);
    }
    this._status = "active";
    this._updatedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Complete workflow (active -> completed)
   */
  complete() {
    if (this._status !== "active") {
      throw new Error(`Cannot complete workflow in ${this._status} state`);
    }
    this._status = "completed";
    this._updatedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Validate workflow structure
   */
  validate() {
    const errors = [];
    if (this._steps.size === 0) {
      errors.push("Workflow must have at least one step");
    }
    for (const step of this._steps.values()) {
      for (const depId of step.dependencies) {
        if (!this._steps.has(depId)) {
          errors.push(`Step ${step.id} depends on non-existent step ${depId}`);
        }
      }
    }
    try {
      this.validateNoCycles();
    } catch {
      errors.push("Workflow contains circular dependencies");
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
  /**
   * Clone workflow with new ID
   */
  clone(newId) {
    const cloned = new _Workflow({
      id: newId,
      name: this._name,
      description: this._description,
      domain: this._domain,
      templateId: this._id,
      version: 1,
      status: "draft",
      userId: this._userId,
      organizationId: this._organizationId
    });
    const stepIdMap = /* @__PURE__ */ new Map();
    for (const step of this._steps.values()) {
      stepIdMap.set(step.id, crypto.randomUUID());
    }
    for (const step of this._steps.values()) {
      const newStepId = stepIdMap.get(step.id);
      const newDependencies = step.dependencies.map((depId) => stepIdMap.get(depId) ?? depId);
      const clonedStep = new Step({
        id: newStepId,
        name: step.name,
        type: step.type,
        domain: step.domain,
        config: { ...step.config },
        position: { ...step.position },
        dependencies: newDependencies,
        status: "pending"
      });
      cloned._steps.set(newStepId, clonedStep);
    }
    return cloned;
  }
  /**
   * Create template from workflow (strips user-specific data)
   */
  toTemplate() {
    return {
      name: this._name,
      description: this._description,
      domain: this._domain,
      steps: this.steps.map((s) => ({
        name: s.name,
        type: s.type,
        domain: s.domain,
        config: s.config,
        dependencies: s.dependencies
      }))
    };
  }
  /**
   * Create version snapshot (WKFL-COMM-002)
   */
  createSnapshot() {
    const snapshot = {
      version: this._version,
      data: this.toJSON(),
      createdAt: /* @__PURE__ */ new Date()
    };
    this._versionHistory.push(snapshot);
    return snapshot;
  }
  /**
   * Get version history
   */
  get versionHistory() {
    return [...this._versionHistory];
  }
  /**
   * Publish workflow (WKFL-COMM-002)
   */
  publish() {
    if (this._steps.size === 0) {
      throw new Error("Cannot publish workflow without steps");
    }
    this.validateNoCycles();
    this._status = "published";
    this._version += 1;
    this._updatedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Archive workflow
   */
  archive() {
    this._status = "archived";
    this._updatedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Create a draft copy
   */
  createDraft() {
    const draft = new _Workflow({
      id: crypto.randomUUID(),
      name: `${this._name} (Copy)`,
      description: this._description,
      domain: this._domain,
      templateId: this._id,
      version: 1,
      status: "draft",
      userId: this._userId,
      organizationId: this._organizationId
    });
    for (const step of this._steps.values()) {
      draft.addStep(step.clone());
    }
    return draft;
  }
  /**
   * Validate workflow is a valid DAG (no cycles)
   */
  validateNoCycles() {
    const visited = /* @__PURE__ */ new Set();
    const recursionStack = /* @__PURE__ */ new Set();
    const hasCycle = (stepId) => {
      visited.add(stepId);
      recursionStack.add(stepId);
      const step = this._steps.get(stepId);
      if (step) {
        for (const depId of step.dependencies) {
          if (!visited.has(depId) && hasCycle(depId)) {
            return true;
          }
          if (recursionStack.has(depId)) {
            return true;
          }
        }
      }
      recursionStack.delete(stepId);
      return false;
    };
    for (const stepId of this._steps.keys()) {
      if (!visited.has(stepId) && hasCycle(stepId)) {
        throw new Error("Workflow contains a cycle");
      }
    }
  }
  /**
   * Get execution order (topological sort)
   */
  getExecutionOrder() {
    const order = [];
    const visited = /* @__PURE__ */ new Set();
    const visit = (stepId) => {
      if (visited.has(stepId)) return;
      visited.add(stepId);
      const step = this._steps.get(stepId);
      if (step) {
        for (const depId of step.dependencies) {
          visit(depId);
        }
      }
      order.push(stepId);
    };
    for (const stepId of this._steps.keys()) {
      visit(stepId);
    }
    return order;
  }
  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      domain: this._domain,
      templateId: this._templateId,
      version: this._version,
      status: this._status,
      userId: this._userId,
      organizationId: this._organizationId,
      steps: this.steps.map((s) => s.toJSON()),
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }
  /**
   * Deserialize from JSON
   */
  static fromJSON(json) {
    const workflow = new _Workflow({
      id: json.id,
      name: json.name,
      description: json.description,
      domain: json.domain,
      templateId: json.templateId,
      version: json.version,
      status: json.status,
      userId: json.userId,
      organizationId: json.organizationId,
      createdAt: json.createdAt ? new Date(json.createdAt) : void 0,
      updatedAt: json.updatedAt ? new Date(json.updatedAt) : void 0
    });
    if (json.steps) {
      for (const stepJson of json.steps) {
        const step = Step.fromJSON(stepJson);
        workflow._steps.set(step.id, step);
      }
    }
    return workflow;
  }
};

// src/workflow/domain/execution.ts
var Execution = class _Execution {
  _id;
  _workflowId;
  _userId;
  _status;
  _progress;
  _totalSteps;
  _results;
  _error;
  _failedStepId;
  _parameters;
  _environment;
  _startedAt;
  _completedAt;
  constructor(params) {
    this._id = params.id;
    this._workflowId = params.workflowId;
    this._userId = params.userId;
    this._status = params.status ?? "queued";
    this._progress = params.progress ?? 0;
    this._totalSteps = params.totalSteps ?? 0;
    this._results = /* @__PURE__ */ new Map();
    this._parameters = params.parameters ?? {};
    this._environment = params.environment ?? {};
    this._startedAt = params.startedAt ?? /* @__PURE__ */ new Date();
  }
  // Getters
  get id() {
    return this._id;
  }
  get workflowId() {
    return this._workflowId;
  }
  get userId() {
    return this._userId;
  }
  get status() {
    return this._status;
  }
  get progress() {
    return this._progress;
  }
  get totalSteps() {
    return this._totalSteps;
  }
  get results() {
    return Array.from(this._results.values());
  }
  get error() {
    return this._error;
  }
  get failedStepId() {
    return this._failedStepId;
  }
  get parameters() {
    return { ...this._parameters };
  }
  get environment() {
    return { ...this._environment };
  }
  get startedAt() {
    return this._startedAt;
  }
  get completedAt() {
    return this._completedAt;
  }
  get duration() {
    if (!this._completedAt) return void 0;
    return this._completedAt.getTime() - this._startedAt.getTime();
  }
  /**
   * Start execution
   */
  start() {
    if (this._status !== "queued") {
      throw new Error(`Cannot start execution in ${this._status} state`);
    }
    this._status = "running";
    this._startedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Set total number of steps
   */
  setTotalSteps(count) {
    this._totalSteps = count;
    this._updateProgress();
  }
  /**
   * Set execution parameters
   */
  setParameters(params) {
    this._parameters = { ...params };
  }
  /**
   * Set execution environment
   */
  setEnvironment(env) {
    this._environment = { ...env };
  }
  /**
   * Record step result (WKFL-COMM-006)
   */
  recordStepResult(result) {
    this._results.set(result.stepId, result);
    if (result.status === "failed") {
      this._failedStepId = result.stepId;
    }
    this._updateProgress();
  }
  /**
   * Update progress based on completed/skipped steps
   */
  _updateProgress() {
    if (this._totalSteps === 0) {
      this._progress = 0;
      return;
    }
    const completed = Array.from(this._results.values()).filter(
      (r) => r.status === "completed" || r.status === "skipped"
    ).length;
    this._progress = Math.round(completed / this._totalSteps * 100);
  }
  /**
   * Estimate remaining time based on average step duration
   */
  get estimatedRemainingTime() {
    const completedResults = Array.from(this._results.values()).filter(
      (r) => r.status === "completed" && r.duration
    );
    if (completedResults.length === 0) return void 0;
    const avgDuration = completedResults.reduce((sum, r) => sum + (r.duration ?? 0), 0) / completedResults.length;
    const remainingSteps = this._totalSteps - completedResults.length;
    return Math.round(avgDuration * remainingSteps);
  }
  /**
   * Get result for a specific step
   */
  getStepResult(stepId) {
    return this._results.get(stepId);
  }
  /**
   * Pause execution (WKFL-COMM-005)
   */
  pause() {
    if (this._status !== "running") {
      throw new Error(`Cannot pause execution in ${this._status} state`);
    }
    this._status = "paused";
  }
  /**
   * Resume execution (WKFL-COMM-005)
   */
  resume() {
    if (this._status !== "paused" && this._status !== "failed") {
      throw new Error(`Cannot resume execution in ${this._status} state`);
    }
    this._status = "running";
    this._failedStepId = void 0;
  }
  /**
   * Resume from failed step (WKFL-COMM-005)
   */
  resumeFromFailure() {
    if (this._status !== "failed") {
      throw new Error(`Cannot resume from failure in ${this._status} state`);
    }
    if (this._failedStepId) {
      this._results.delete(this._failedStepId);
    }
    this._status = "running";
    this._error = void 0;
    this._failedStepId = void 0;
    this._updateProgress();
  }
  /**
   * Retry a specific step (WKFL-COMM-005)
   */
  retryStep(stepId) {
    this._results.delete(stepId);
    if (this._failedStepId === stepId) {
      this._failedStepId = void 0;
      this._error = void 0;
    }
    if (this._status === "failed") {
      this._status = "running";
    }
    this._updateProgress();
  }
  /**
   * Cancel execution
   */
  cancel() {
    if (this._status === "completed") {
      throw new Error("Cannot cancel completed execution");
    }
    this._status = "cancelled";
    this._completedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Complete execution
   */
  complete() {
    this._status = "completed";
    this._progress = 100;
    this._completedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Fail execution
   */
  fail(error) {
    this._status = "failed";
    this._error = error;
    this._completedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Get failed step IDs for retry (WKFL-COMM-005)
   */
  getFailedStepIds() {
    return Array.from(this._results.values()).filter((r) => r.status === "failed").map((r) => r.stepId);
  }
  /**
   * Get completed step IDs for resume (WKFL-COMM-005)
   */
  getCompletedStepIds() {
    return Array.from(this._results.values()).filter((r) => r.status === "completed").map((r) => r.stepId);
  }
  /**
   * Get execution summary
   */
  getSummary() {
    const results = Array.from(this._results.values());
    return {
      totalSteps: this._totalSteps,
      completedSteps: results.filter((r) => r.status === "completed").length,
      failedSteps: results.filter((r) => r.status === "failed").length,
      skippedSteps: results.filter((r) => r.status === "skipped").length,
      progress: this._progress,
      duration: this.duration,
      status: this._status
    };
  }
  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this._id,
      workflowId: this._workflowId,
      userId: this._userId,
      status: this._status,
      progress: this._progress,
      totalSteps: this._totalSteps,
      results: Array.from(this._results.values()),
      error: this._error,
      failedStepId: this._failedStepId,
      parameters: this._parameters,
      environment: this._environment,
      startedAt: this._startedAt.toISOString(),
      completedAt: this._completedAt?.toISOString()
    };
  }
  /**
   * Deserialize from JSON
   */
  static fromJSON(json) {
    const execution = new _Execution({
      id: json.id,
      workflowId: json.workflowId,
      userId: json.userId,
      status: json.status,
      progress: json.progress,
      totalSteps: json.totalSteps,
      parameters: json.parameters,
      environment: json.environment,
      startedAt: json.startedAt ? new Date(json.startedAt) : void 0
    });
    if (json.results) {
      for (const result of json.results) {
        execution._results.set(result.stepId, result);
      }
    }
    if (json.error) {
      execution._error = json.error;
    }
    if (json.failedStepId) {
      execution._failedStepId = json.failedStepId;
    }
    if (json.completedAt) {
      execution._completedAt = new Date(json.completedAt);
    }
    return execution;
  }
};

// src/plugin/registry.ts
var PluginRegistry = class {
  plugins = /* @__PURE__ */ new Map();
  metadata = /* @__PURE__ */ new Map();
  /**
   * Register a plugin
   */
  register(plugin) {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already registered`);
    }
    if (plugin.dependencies) {
      for (const depId of plugin.dependencies) {
        if (!this.plugins.has(depId)) {
          throw new Error(
            `Plugin ${plugin.id} depends on ${depId} which is not loaded`
          );
        }
      }
    }
    this.plugins.set(plugin.id, plugin);
    this.metadata.set(plugin.id, {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      domain: plugin.domain,
      description: plugin.description,
      author: plugin.author,
      dependencies: plugin.dependencies,
      status: "registered",
      loadedAt: /* @__PURE__ */ new Date()
    });
  }
  /**
   * Unregister a plugin
   */
  unregister(pluginId) {
    for (const [id, plugin] of this.plugins) {
      if (plugin.dependencies?.includes(pluginId)) {
        throw new Error(
          `Cannot unregister ${pluginId}: plugin ${id} depends on it`
        );
      }
    }
    this.plugins.delete(pluginId);
    this.metadata.delete(pluginId);
  }
  /**
   * Get a plugin by ID
   */
  get(pluginId) {
    return this.plugins.get(pluginId);
  }
  /**
   * Get all plugins
   */
  getAll() {
    return Array.from(this.plugins.values());
  }
  /**
   * Get plugins by domain
   */
  getByDomain(domain) {
    return Array.from(this.plugins.values()).filter(
      (p) => p.domain === domain || p.domain === "common"
    );
  }
  /**
   * Get plugin metadata
   */
  getMetadata(pluginId) {
    return this.metadata.get(pluginId);
  }
  /**
   * Get all plugin metadata
   */
  getAllMetadata() {
    return Array.from(this.metadata.values());
  }
  /**
   * Update plugin status
   */
  updateStatus(pluginId, status, error) {
    const meta = this.metadata.get(pluginId);
    if (meta) {
      meta.status = status;
      if (error) {
        meta.error = error;
      }
    }
  }
  /**
   * Check if a plugin is registered
   */
  has(pluginId) {
    return this.plugins.has(pluginId);
  }
  /**
   * Get plugin count
   */
  get size() {
    return this.plugins.size;
  }
  /**
   * Clear all plugins
   */
  clear() {
    this.plugins.clear();
    this.metadata.clear();
  }
};

// src/plugin/loader.ts
var PluginLoader = class {
  /**
   * Load a plugin from a path or module name
   */
  async load(pluginPath) {
    try {
      const module = await import(pluginPath);
      const plugin = module.default || module.plugin;
      if (!plugin) {
        throw new Error(`No plugin export found in ${pluginPath}`);
      }
      this.validatePlugin(plugin);
      return plugin;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load plugin from ${pluginPath}: ${error.message}`);
      }
      throw error;
    }
  }
  /**
   * Validate that an object implements the LabFlowPlugin interface
   */
  validatePlugin(plugin) {
    if (!plugin || typeof plugin !== "object") {
      throw new Error("Plugin must be an object");
    }
    const p = plugin;
    if (typeof p.id !== "string" || !p.id) {
      throw new Error("Plugin must have a string id");
    }
    if (typeof p.name !== "string" || !p.name) {
      throw new Error("Plugin must have a string name");
    }
    if (typeof p.version !== "string" || !p.version) {
      throw new Error("Plugin must have a string version");
    }
    if (typeof p.domain !== "string" || !p.domain) {
      throw new Error("Plugin must have a string domain");
    }
    if (typeof p.initialize !== "function") {
      throw new Error("Plugin must have an initialize method");
    }
    if (typeof p.getWorkflowSteps !== "function") {
      throw new Error("Plugin must have a getWorkflowSteps method");
    }
    if (typeof p.getDataConnectors !== "function") {
      throw new Error("Plugin must have a getDataConnectors method");
    }
    if (typeof p.getVisualizations !== "function") {
      throw new Error("Plugin must have a getVisualizations method");
    }
    if (typeof p.getUIExtensions !== "function") {
      throw new Error("Plugin must have a getUIExtensions method");
    }
    if (typeof p.cleanup !== "function") {
      throw new Error("Plugin must have a cleanup method");
    }
  }
  /**
   * Check if a plugin version is compatible with the core version
   */
  isVersionCompatible(pluginVersion, coreVersion) {
    const pluginMajorStr = pluginVersion.split(".")[0];
    const coreMajorStr = coreVersion.split(".")[0];
    const pluginMajor = parseInt(pluginMajorStr ?? "0", 10);
    const coreMajor = parseInt(coreMajorStr ?? "0", 10);
    if (coreMajor === 0) {
      return true;
    }
    return pluginMajor === coreMajor;
  }
};

// src/plugin/manager.ts
var PluginManager = class {
  registry;
  loader;
  context = null;
  constructor() {
    this.registry = new PluginRegistry();
    this.loader = new PluginLoader();
  }
  /**
   * Initialize the plugin manager with context
   */
  async initialize(context) {
    this.context = context;
  }
  /**
   * Load and initialize a plugin
   */
  async loadPlugin(pluginPath) {
    if (!this.context) {
      throw new Error("Plugin manager not initialized");
    }
    const plugin = await this.loader.load(pluginPath);
    this.registry.register(plugin);
    try {
      await plugin.initialize(this.context);
      this.registry.updateStatus(plugin.id, "initialized");
      this.registry.updateStatus(plugin.id, "active");
      return this.registry.getMetadata(plugin.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.registry.updateStatus(plugin.id, "error", message);
      throw error;
    }
  }
  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId) {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    await plugin.cleanup();
    this.registry.unregister(pluginId);
  }
  /**
   * Get a loaded plugin by ID
   */
  getPlugin(pluginId) {
    return this.registry.get(pluginId);
  }
  /**
   * Get all loaded plugins
   */
  getAllPlugins() {
    return this.registry.getAll();
  }
  /**
   * Get plugins by domain
   */
  getPluginsByDomain(domain) {
    return this.registry.getByDomain(domain);
  }
  /**
   * Get all plugin metadata
   */
  getAllMetadata() {
    return this.registry.getAllMetadata();
  }
  /**
   * Get all workflow step definitions from all plugins
   */
  getAllWorkflowSteps() {
    return this.registry.getAll().flatMap((p) => p.getWorkflowSteps());
  }
  /**
   * Get all data connectors from all plugins
   */
  getAllDataConnectors() {
    return this.registry.getAll().flatMap((p) => p.getDataConnectors());
  }
  /**
   * Get all visualizations from all plugins
   */
  getAllVisualizations() {
    return this.registry.getAll().flatMap((p) => p.getVisualizations());
  }
  /**
   * Get all UI extensions from all plugins
   */
  getAllUIExtensions() {
    return this.registry.getAll().flatMap((p) => p.getUIExtensions());
  }
  /**
   * Shutdown all plugins
   */
  async shutdown() {
    const plugins2 = this.registry.getAll();
    for (const plugin of plugins2) {
      try {
        await plugin.cleanup();
        this.registry.updateStatus(plugin.id, "unloaded");
      } catch (error) {
        console.error(`Error cleaning up plugin ${plugin.id}:`, error);
      }
    }
    this.registry.clear();
  }
};

// src/knowledge/knowledge-base.ts
function generateId() {
  return `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
function textSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  const wordSet = /* @__PURE__ */ new Set([...words1, ...words2]);
  const vec1 = [];
  const vec2 = [];
  for (const word of wordSet) {
    vec1.push(words1.filter((w) => w === word).length);
    vec2.push(words2.filter((w) => w === word).length);
  }
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * (vec2[i] ?? 0), 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
}
var KnowledgeBase = class {
  config;
  documents = /* @__PURE__ */ new Map();
  chunks = /* @__PURE__ */ new Map();
  constructor(config) {
    this.config = config;
  }
  /**
   * Add a document to the knowledge base
   */
  async addDocument(document) {
    if (!document.title || document.title.trim() === "") {
      throw new Error("Title is required");
    }
    if (!document.content || document.content.trim() === "") {
      throw new Error("Content is required");
    }
    const id = generateId();
    const now = /* @__PURE__ */ new Date();
    const newDocument = {
      ...document,
      id,
      status: "pending",
      createdAt: now,
      updatedAt: now
    };
    this.documents.set(id, newDocument);
    const documentChunks2 = this.createChunks(newDocument);
    this.chunks.set(id, documentChunks2);
    newDocument.status = "indexed";
    this.documents.set(id, newDocument);
    return newDocument;
  }
  /**
   * Create chunks from a document
   */
  createChunks(document) {
    const { chunkSize, chunkOverlap } = this.config;
    const content = document.content;
    const chunks = [];
    let position = 0;
    let charStart = 0;
    while (charStart < content.length) {
      const charEnd = Math.min(charStart + chunkSize, content.length);
      const chunkContent = content.substring(charStart, charEnd);
      chunks.push({
        id: `${document.id}-chunk-${position}`,
        documentId: document.id,
        content: chunkContent,
        metadata: {
          position,
          charStart,
          charEnd
        }
      });
      position++;
      charStart = charEnd - chunkOverlap;
      if (charStart >= content.length) break;
      if (charEnd === content.length) break;
    }
    return chunks;
  }
  /**
   * Get a document by ID
   */
  async getDocument(id) {
    return this.documents.get(id) ?? null;
  }
  /**
   * Search the knowledge base
   */
  async search(query, options) {
    const limit = options?.limit ?? 10;
    const threshold = options?.threshold ?? 0;
    const domains = options?.domains;
    const documentTypes2 = options?.documentTypes;
    const results = [];
    for (const [docId, document] of this.documents) {
      if (domains && domains.length > 0) {
        if (!document.metadata.domain || !domains.includes(document.metadata.domain)) {
          continue;
        }
      }
      if (documentTypes2 && documentTypes2.length > 0) {
        if (!documentTypes2.includes(document.type)) {
          continue;
        }
      }
      const docChunks = this.chunks.get(docId) ?? [];
      for (const chunk of docChunks) {
        const score = textSimilarity(query, chunk.content);
        if (score >= threshold) {
          results.push({
            chunk,
            document,
            score,
            highlights: this.extractHighlights(query, chunk.content)
          });
        }
      }
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
  /**
   * Extract highlights from content based on query
   */
  extractHighlights(query, content) {
    const queryWords = query.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]+/);
    const highlights = [];
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      if (queryWords.some((word) => sentenceLower.includes(word))) {
        highlights.push(sentence.trim());
      }
    }
    return highlights.slice(0, 3);
  }
  /**
   * Delete a document from the knowledge base
   */
  async deleteDocument(id) {
    if (!this.documents.has(id)) {
      throw new Error("Document not found");
    }
    this.documents.delete(id);
    this.chunks.delete(id);
  }
  /**
   * Update a document in the knowledge base
   */
  async updateDocument(id, updates) {
    const existing = this.documents.get(id);
    if (!existing) {
      throw new Error("Document not found");
    }
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      // ID cannot be changed
      createdAt: existing.createdAt,
      // createdAt cannot be changed
      updatedAt: /* @__PURE__ */ new Date(),
      metadata: {
        ...existing.metadata,
        ...updates.metadata ?? {}
      }
    };
    this.documents.set(id, updated);
    if (updates.content) {
      const documentChunks2 = this.createChunks(updated);
      this.chunks.set(id, documentChunks2);
    }
    return updated;
  }
  /**
   * Re-index a document
   */
  async reindexDocument(id) {
    const document = this.documents.get(id);
    if (!document) {
      throw new Error("Document not found");
    }
    document.status = "pending";
    this.documents.set(id, document);
    const documentChunks2 = this.createChunks(document);
    this.chunks.set(id, documentChunks2);
    document.status = "indexed";
    document.updatedAt = /* @__PURE__ */ new Date();
    this.documents.set(id, document);
  }
  /**
   * Get statistics about the knowledge base
   */
  async getStats() {
    let chunkCount = 0;
    let indexedCount = 0;
    let pendingCount = 0;
    let errorCount = 0;
    for (const [docId, document] of this.documents) {
      const docChunks = this.chunks.get(docId) ?? [];
      chunkCount += docChunks.length;
      switch (document.status) {
        case "indexed":
          indexedCount++;
          break;
        case "pending":
        case "processing":
          pendingCount++;
          break;
        case "error":
          errorCount++;
          break;
      }
    }
    return {
      documentCount: this.documents.size,
      chunkCount,
      indexedCount,
      pendingCount,
      errorCount
    };
  }
};

// src/knowledge/document-processor.ts
var SUPPORTED_FORMATS = [
  "pdf",
  "docx",
  "doc",
  "txt",
  "md",
  "csv",
  "xlsx",
  "pptx",
  "ppt",
  "html",
  "xml",
  "json",
  "email",
  "msg",
  "eml"
];
var DocumentProcessor = class {
  options;
  constructor(options) {
    this.options = {
      chunkSize: 1e3,
      chunkOverlap: 200,
      preserveParagraphs: true,
      maxCharacters: 1500,
      combineTextUnderNChars: 500,
      ...options
    };
  }
  /**
   * Get list of supported formats (DATA-DOC-001)
   */
  getSupportedFormats() {
    return [...SUPPORTED_FORMATS];
  }
  /**
   * Check if a format is supported
   */
  isSupported(format) {
    return SUPPORTED_FORMATS.includes(format.toLowerCase());
  }
  /**
   * Detect format from filename
   */
  detectFormat(filename) {
    const parts = filename.split(/[/\\]/);
    const basename = parts[parts.length - 1] ?? "";
    const extMatch = basename.match(/\.([^.]+)$/);
    if (!extMatch || !extMatch[1]) return null;
    const ext = extMatch[1].toLowerCase();
    return this.isSupported(ext) ? ext : null;
  }
  /**
   * Extract text from content (DATA-DOC-004)
   */
  async extractText(content, mimeType) {
    const text = typeof content === "string" ? content : content.toString("utf-8");
    const elements = [];
    const supportedMimeTypes = [
      "text/plain",
      "txt",
      "text/markdown",
      "md",
      "text/html",
      "html",
      "text/csv",
      "csv"
    ];
    if (!supportedMimeTypes.includes(mimeType)) {
      throw new Error(`Unsupported format: ${mimeType}`);
    }
    if (mimeType === "md" || mimeType === "text/markdown") {
      elements.push(...this.parseMarkdown(text));
    } else {
      elements.push({
        type: "NarrativeText",
        text: text.trim()
      });
    }
    return { text, elements };
  }
  /**
   * Parse markdown content into elements
   */
  parseMarkdown(content) {
    const elements = [];
    const lines = content.split("\n");
    let currentText = "";
    for (const line of lines) {
      if (line.startsWith("#")) {
        if (currentText.trim()) {
          elements.push({ type: "NarrativeText", text: currentText.trim() });
          currentText = "";
        }
        elements.push({ type: "Title", text: line.replace(/^#+\s*/, "") });
      } else if (line.match(/^[-*+]\s/) || line.match(/^\d+\.\s/)) {
        if (currentText.trim()) {
          elements.push({ type: "NarrativeText", text: currentText.trim() });
          currentText = "";
        }
        elements.push({ type: "ListItem", text: line.replace(/^[-*+\d.]+\s*/, "") });
      } else if (line.includes("|")) {
        if (currentText.trim()) {
          elements.push({ type: "NarrativeText", text: currentText.trim() });
          currentText = "";
        }
        elements.push({ type: "Table", text: line });
      } else {
        currentText += (currentText ? "\n" : "") + line;
      }
    }
    if (currentText.trim()) {
      elements.push({ type: "NarrativeText", text: currentText.trim() });
    }
    return elements;
  }
  /**
   * Chunk by title boundaries (DATA-DOC-006)
   */
  async chunkByTitle(elements, documentId) {
    const chunks = [];
    let currentChunk = [];
    let charStart = 0;
    let position = 0;
    const maxChars = this.options.maxCharacters ?? 1500;
    const combineThreshold = this.options.combineTextUnderNChars ?? 500;
    for (const element of elements) {
      const elementLength = element.text.length;
      if (element.type === "Title" && currentChunk.length > 0) {
        const chunkText = currentChunk.map((e) => e.text).join("\n");
        chunks.push(this.createChunk(documentId, chunkText, {
          position,
          charStart,
          charEnd: charStart + chunkText.length
        }));
        charStart += chunkText.length;
        position++;
        currentChunk = [];
      }
      const currentLength = currentChunk.reduce((sum, e) => sum + e.text.length, 0);
      if (currentLength + elementLength > maxChars && currentChunk.length > 0) {
        const chunkText = currentChunk.map((e) => e.text).join("\n");
        chunks.push(this.createChunk(documentId, chunkText, {
          position,
          charStart,
          charEnd: charStart + chunkText.length
        }));
        charStart += chunkText.length;
        position++;
        currentChunk = [];
      }
      currentChunk.push(element);
    }
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.map((e) => e.text).join("\n");
      chunks.push(this.createChunk(documentId, chunkText, {
        position,
        charStart,
        charEnd: charStart + chunkText.length
      }));
    }
    return this.combineSmallChunks(chunks, combineThreshold);
  }
  /**
   * Combine small chunks under threshold
   */
  combineSmallChunks(chunks, threshold) {
    if (chunks.length <= 1) return chunks;
    const result = [];
    let accumulated = null;
    for (const chunk of chunks) {
      if (!accumulated) {
        accumulated = { ...chunk };
        continue;
      }
      if (accumulated.content.length < threshold && chunk.content.length < threshold) {
        accumulated = {
          ...accumulated,
          content: accumulated.content + "\n" + chunk.content,
          metadata: {
            ...accumulated.metadata,
            charEnd: chunk.metadata.charEnd
          }
        };
      } else {
        result.push(accumulated);
        accumulated = { ...chunk };
      }
    }
    if (accumulated) {
      result.push(accumulated);
    }
    return result;
  }
  /**
   * Preserve table format as HTML (DATA-DOC-008)
   */
  preserveTableFormat(tableData) {
    const headerRow = `<tr>${tableData.headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;
    const bodyRows = tableData.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");
    return `<table>${headerRow}${bodyRows}</table>`;
  }
  /**
   * Extract email metadata (DATA-DOC-009)
   */
  async extractEmailMetadata(emailContent) {
    const metadata = {
      subject: ""
    };
    const lines = emailContent.split("\n");
    for (const line of lines) {
      const subjectMatch = line.match(/^Subject:\s*(.+)/i);
      if (subjectMatch && subjectMatch[1]) {
        metadata.subject = subjectMatch[1].trim();
      }
      const fromMatch = line.match(/^From:\s*(.+)/i);
      if (fromMatch && fromMatch[1]) {
        metadata.from = fromMatch[1].trim();
      }
      const toMatch = line.match(/^To:\s*(.+)/i);
      if (toMatch && toMatch[1]) {
        metadata.to = toMatch[1].split(",").map((e) => e.trim());
      }
      const dateMatch = line.match(/^Date:\s*(.+)/i);
      if (dateMatch && dateMatch[1]) {
        metadata.date = new Date(dateMatch[1]);
      }
    }
    return metadata;
  }
  /**
   * Validate token count (DATA-DOC-010)
   * Approximate: 1 token ≈ 4 characters
   */
  validateTokenCount(content, limit = 8192) {
    const estimatedTokens = Math.ceil(content.length / 4);
    return estimatedTokens <= limit;
  }
  /**
   * Generate standardized JSON document map (DATA-DOC-005)
   */
  generateDocumentMap(elements, metadata) {
    return {
      filename: metadata.filename,
      pages: metadata.pages,
      elements,
      tableCount: elements.filter((e) => e.type === "Table").length,
      imageCount: elements.filter((e) => e.type === "Image").length,
      processedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Handle partial content on error (DATA-DOC-012)
   */
  handlePartialContent(elements, errorInfo) {
    return {
      elements,
      error: errorInfo.error,
      recoveredElements: errorInfo.recoveredElements,
      isPartial: true
    };
  }
  /**
   * Process a document end-to-end
   */
  async processDocument(content, format, documentId, options) {
    if (!this.isSupported(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }
    const opts = { ...this.options, ...options };
    if (opts.preserveParagraphs) {
      return this.chunkByParagraphs(documentId, content, opts);
    }
    return this.chunkBySize(documentId, content, opts);
  }
  /**
   * Chunk content by paragraph boundaries
   */
  chunkByParagraphs(documentId, content, options) {
    const paragraphs = content.split(/\n\n+/);
    const chunks = [];
    let currentChunk = "";
    let charStart = 0;
    let position = 0;
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > options.chunkSize && currentChunk.length > 0) {
        chunks.push(
          this.createChunk(documentId, currentChunk.trim(), {
            position,
            charStart,
            charEnd: charStart + currentChunk.length
          })
        );
        const overlapStart = Math.max(0, currentChunk.length - options.chunkOverlap);
        currentChunk = currentChunk.slice(overlapStart) + "\n\n" + paragraph;
        charStart = charStart + overlapStart;
        position++;
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      }
    }
    if (currentChunk.trim()) {
      chunks.push(
        this.createChunk(documentId, currentChunk.trim(), {
          position,
          charStart,
          charEnd: charStart + currentChunk.length
        })
      );
    }
    return chunks;
  }
  /**
   * Chunk content by fixed size
   */
  chunkBySize(documentId, content, options) {
    const chunks = [];
    let position = 0;
    let charStart = 0;
    while (charStart < content.length) {
      const charEnd = Math.min(charStart + options.chunkSize, content.length);
      const chunkContent = content.slice(charStart, charEnd);
      chunks.push(
        this.createChunk(documentId, chunkContent, {
          position,
          charStart,
          charEnd
        })
      );
      charStart = charEnd - options.chunkOverlap;
      position++;
      if (charStart >= charEnd) break;
    }
    return chunks;
  }
  /**
   * Create a document chunk
   */
  createChunk(documentId, content, metadata) {
    return {
      id: `${documentId}-chunk-${metadata.position}`,
      documentId,
      content,
      metadata
    };
  }
};

// src/knowledge/rag-service.ts
var RAGService = class {
  knowledgeBase;
  maxContextTokens;
  constructor(knowledgeBase, maxContextTokens = 4e3) {
    this.knowledgeBase = knowledgeBase;
    this.maxContextTokens = maxContextTokens;
  }
  /**
   * Generate embedding vector for text
   */
  async generateEmbedding(text) {
    if (!text || text.trim() === "") {
      throw new Error("Text cannot be empty");
    }
    const maxChars = 32768;
    const truncatedText = text.slice(0, maxChars);
    return this.simpleEmbedding(truncatedText);
  }
  /**
   * Simple hash-based embedding for testing
   * In production, this would call text-embedding-ada-002 or similar
   */
  simpleEmbedding(text) {
    const dimensions = 1536;
    const embedding = new Array(dimensions).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word) continue;
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j);
        const idx = charCode * (i + 1) * (j + 1) % dimensions;
        embedding[idx] += 1 / (i + 1);
      }
    }
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    return embedding;
  }
  /**
   * Generate embeddings for multiple texts
   */
  async generateEmbeddingBatch(texts) {
    if (texts.length === 0) return [];
    return Promise.all(texts.map((text) => this.generateEmbedding(text)));
  }
  /**
   * Compute cosine similarity between two vectors
   */
  computeSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      throw new Error("Vectors must have same dimensions");
    }
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += (vec1[i] ?? 0) * (vec2[i] ?? 0);
      mag1 += (vec1[i] ?? 0) * (vec1[i] ?? 0);
      mag2 += (vec2[i] ?? 0) * (vec2[i] ?? 0);
    }
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (mag1 * mag2);
  }
  /**
   * Build RAG context for a query
   */
  async buildContext(query, options) {
    const results = await this.knowledgeBase.search(query, {
      limit: 10,
      ...options
    });
    const { combinedContext, tokenCount } = this.combineResults(results);
    return {
      query,
      results,
      combinedContext,
      tokenCount
    };
  }
  /**
   * Combine search results into a single context string
   */
  combineResults(results) {
    const contextParts = [];
    let tokenCount = 0;
    for (const result of results) {
      const chunkTokens = this.estimateTokens(result.chunk.content);
      if (tokenCount + chunkTokens > this.maxContextTokens) {
        break;
      }
      const contextPart = this.formatResultForContext(result);
      contextParts.push(contextPart);
      tokenCount += chunkTokens;
    }
    return {
      combinedContext: contextParts.join("\n\n---\n\n"),
      tokenCount
    };
  }
  /**
   * Format a search result for inclusion in context
   */
  formatResultForContext(result) {
    const { document, chunk } = result;
    const header = `[Source: ${document.title}${document.metadata.doi ? ` (DOI: ${document.metadata.doi})` : ""}]`;
    return `${header}
${chunk.content}`;
  }
  /**
   * Estimate token count for text (rough approximation)
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }
  /**
   * Extract scientific entities from text (KNOW-GRAG-002)
   */
  async extractEntities(text) {
    const entities = [];
    const compoundPatterns = [
      /\b(Aspirin|Ibuprofen|Tamoxifen|Metformin|Paracetamol)\b/gi,
      /\b[A-Z][a-z]+(?:in|ol|ide|ine|ate)\b/g
      // Generic drug-like names
    ];
    const proteinPatterns = [
      /\b(COX-\d+|p53|EGFR|HER2|BRCA\d?)\b/gi,
      /\b[A-Z]{2,5}-?\d*\b/g
      // Protein-like abbreviations
    ];
    const diseasePatterns = [
      /\b(cancer|diabetes|alzheimer|parkinson|tumor|carcinoma)\b/gi,
      /\b(breast cancer|lung cancer|colon cancer)\b/gi
    ];
    const authorPatterns = [/\b([A-Z][a-z]+)\s+et\s+al\./g, /\b([A-Z][a-z]+)\s+\(\d{4}\)/g];
    for (const pattern of compoundPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== void 0) {
          entities.push({
            name: match[0],
            type: "compound",
            position: { start: match.index, end: match.index + match[0].length }
          });
        }
      }
    }
    for (const pattern of proteinPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== void 0 && match[0].length >= 3) {
          if (!entities.some((e) => e.name.toLowerCase() === match[0].toLowerCase())) {
            entities.push({
              name: match[0],
              type: "protein",
              position: { start: match.index, end: match.index + match[0].length }
            });
          }
        }
      }
    }
    for (const pattern of diseasePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== void 0) {
          if (!entities.some((e) => e.name.toLowerCase() === match[0].toLowerCase())) {
            entities.push({
              name: match[0],
              type: "disease",
              position: { start: match.index, end: match.index + match[0].length }
            });
          }
        }
      }
    }
    for (const pattern of authorPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== void 0 && match[1]) {
          entities.push({
            name: match[1],
            type: "author",
            position: { start: match.index, end: match.index + match[0].length }
          });
        }
      }
    }
    const uniqueEntities = entities.filter(
      (entity, index6, self) => index6 === self.findIndex(
        (e) => e.name.toLowerCase() === entity.name.toLowerCase() && e.type === entity.type
      )
    );
    return uniqueEntities;
  }
  /**
   * Extract relations between entities (KNOW-GRAG-003)
   */
  async extractRelations(text, entities) {
    const relations2 = [];
    text.toLowerCase();
    const relationPatterns = [
      { pattern: /inhibits?/gi, type: "inhibits" },
      { pattern: /activates?/gi, type: "activates" },
      { pattern: /binds?\s+to/gi, type: "binds" },
      { pattern: /treats?/gi, type: "treats" },
      { pattern: /causes?/gi, type: "causes" }
    ];
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];
        if (!entity1 || !entity2) continue;
        const pos1 = entity1.position;
        const pos2 = entity2.position;
        if (pos1 && pos2) {
          const start = Math.min(pos1.end, pos2.end);
          const end = Math.max(pos1.start, pos2.start);
          if (end > start && end - start < 100) {
            const between = text.substring(start, end);
            for (const { pattern, type } of relationPatterns) {
              if (pattern.test(between)) {
                relations2.push({
                  source: entity1,
                  target: entity2,
                  type,
                  confidence: 0.8
                });
                break;
              }
            }
          }
        }
      }
    }
    return relations2;
  }
  /**
   * Perform RAG query with context
   */
  async query(question, searchResults) {
    if (searchResults.length === 0) {
      return {
        answer: "I could not find relevant information in the knowledge base to answer this question.",
        sources: [],
        confidence: 0
      };
    }
    const context = searchResults.map((r) => r.chunk.content).join("\n\n");
    const sources = searchResults.map((r) => ({
      documentId: r.document.id,
      title: r.document.title,
      excerpt: r.chunk.content.substring(0, 200) + "...",
      score: r.score
    }));
    const answer = `Based on the retrieved documents:

${context.substring(0, 500)}...`;
    return {
      answer,
      sources,
      confidence: Math.max(...searchResults.map((r) => r.score))
    };
  }
  /**
   * Rerank search results by relevance
   */
  async rerank(query, results) {
    const queryEmbedding = await this.generateEmbedding(query);
    const rerankedResults = await Promise.all(
      results.map(async (result) => {
        const chunkEmbedding = await this.generateEmbedding(result.chunk.content);
        const semanticScore = this.computeSimilarity(queryEmbedding, chunkEmbedding);
        const combinedScore = result.score * 0.3 + semanticScore * 0.7;
        return {
          ...result,
          score: combinedScore
        };
      })
    );
    return rerankedResults.sort((a, b) => b.score - a.score);
  }
  /**
   * Generate summary of search results
   */
  async summarize(results) {
    if (results.length === 0) {
      return {
        text: "No results to summarize.",
        keyPoints: [],
        sourceCount: 0
      };
    }
    const keyPoints = [];
    results.map((r) => r.chunk.content).join("\n\n");
    for (const result of results.slice(0, 5)) {
      const firstSentence = result.chunk.content.split(".")[0];
      if (firstSentence && firstSentence.length > 20) {
        keyPoints.push(firstSentence.trim() + ".");
      }
    }
    const text = `Summary of ${results.length} relevant documents:

${keyPoints.join("\n")}`;
    return {
      text,
      keyPoints,
      sourceCount: results.length
    };
  }
  /**
   * Generate a prompt with RAG context
   */
  buildPrompt(userQuery, context, systemPrompt) {
    const defaultSystemPrompt = `You are an AI assistant for scientific research. 
Use the following context from the knowledge base to answer the user's question.
If the context doesn't contain relevant information, say so clearly.`;
    const prompt = `${systemPrompt || defaultSystemPrompt}

## Context from Knowledge Base

${context.combinedContext}

## User Question

${userQuery}

## Instructions

Based on the context provided, answer the user's question. 
Cite sources when possible using [Source: title] format.`;
    return prompt;
  }
};

// src/db/schema/index.ts
var schema_exports = {};
__export(schema_exports, {
  authProviders: () => authProviders,
  documentChunks: () => documentChunks,
  documentChunksRelations: () => documentChunksRelations,
  documentTypes: () => documentTypes,
  documents: () => documents,
  documentsRelations: () => documentsRelations,
  executionArtifacts: () => executionArtifacts,
  executionArtifactsRelations: () => executionArtifactsRelations,
  executionStatuses: () => executionStatuses,
  executions: () => executions,
  executionsRelations: () => executionsRelations,
  pluginDependencies: () => pluginDependencies,
  pluginDependenciesRelations: () => pluginDependenciesRelations,
  pluginStatuses: () => pluginStatuses,
  plugins: () => plugins,
  pluginsRelations: () => pluginsRelations,
  processingStatuses: () => processingStatuses,
  researchDomains: () => researchDomains,
  sessions: () => sessions,
  sessionsRelations: () => sessionsRelations,
  stepExecutions: () => stepExecutions,
  stepExecutionsRelations: () => stepExecutionsRelations,
  stepStatuses: () => stepStatuses,
  userRoles: () => userRoles,
  users: () => users,
  usersRelations: () => usersRelations,
  workflowCollaborators: () => workflowCollaborators,
  workflowCollaboratorsRelations: () => workflowCollaboratorsRelations,
  workflowStatuses: () => workflowStatuses,
  workflows: () => workflows,
  workflowsRelations: () => workflowsRelations
});
var authProviders = ["local", "entra", "shibboleth"];
var userRoles = ["admin", "researcher", "viewer"];
var users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    passwordHash: varchar("password_hash", { length: 255 }),
    authProvider: varchar("auth_provider", { length: 50 }).$type().notNull().default("local"),
    externalId: varchar("external_id", { length: 255 }),
    role: varchar("role", { length: 50 }).$type().notNull().default("researcher"),
    isActive: boolean("is_active").notNull().default(true),
    emailVerified: boolean("email_verified").notNull().default(false),
    failedLoginAttempts: varchar("failed_login_attempts", { length: 10 }).notNull().default("0"),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_auth_provider_idx").on(table.authProvider),
    index("users_external_id_idx").on(table.externalId)
  ]
);
var sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    refreshToken: varchar("refresh_token", { length: 500 }).notNull().unique(),
    userAgent: varchar("user_agent", { length: 500 }),
    ipAddress: varchar("ip_address", { length: 50 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_refresh_token_idx").on(table.refreshToken),
    index("sessions_expires_at_idx").on(table.expiresAt)
  ]
);
var researchDomains = ["drug_discovery", "materials_science", "climate", "genomics", "custom"];
var workflowStatuses = ["draft", "published", "archived", "deprecated"];
var workflows = pgTable(
  "workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 2e3 }),
    domain: varchar("domain", { length: 50 }).$type().notNull(),
    status: varchar("status", { length: 50 }).$type().notNull().default("draft"),
    version: integer("version").notNull().default(1),
    isTemplate: boolean("is_template").notNull().default(false),
    parentTemplateId: uuid("parent_template_id"),
    // Self-reference handled via relations
    ownerId: uuid("owner_id").notNull().references(() => users.id),
    steps: jsonb("steps").$type().notNull().default([]),
    config: jsonb("config").$type().default({}),
    tags: jsonb("tags").$type().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true })
  },
  (table) => [
    index("workflows_owner_id_idx").on(table.ownerId),
    index("workflows_domain_idx").on(table.domain),
    index("workflows_status_idx").on(table.status),
    index("workflows_is_template_idx").on(table.isTemplate)
  ]
);
var workflowCollaborators = pgTable(
  "workflow_collaborators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default("viewer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("workflow_collaborators_workflow_id_idx").on(table.workflowId),
    index("workflow_collaborators_user_id_idx").on(table.userId)
  ]
);
var executionStatuses = ["pending", "running", "paused", "completed", "failed", "cancelled"];
var stepStatuses = ["pending", "running", "completed", "failed", "skipped"];
var executions = pgTable(
  "executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id").notNull().references(() => workflows.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    status: varchar("status", { length: 50 }).$type().notNull().default("pending"),
    progress: real("progress").notNull().default(0),
    currentStepId: varchar("current_step_id", { length: 100 }),
    inputs: jsonb("inputs").$type().default({}),
    outputs: jsonb("outputs").$type().default({}),
    error: varchar("error", { length: 2e3 }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("executions_workflow_id_idx").on(table.workflowId),
    index("executions_user_id_idx").on(table.userId),
    index("executions_status_idx").on(table.status),
    index("executions_created_at_idx").on(table.createdAt)
  ]
);
var stepExecutions = pgTable(
  "step_executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionId: uuid("execution_id").notNull().references(() => executions.id, { onDelete: "cascade" }),
    stepId: varchar("step_id", { length: 100 }).notNull(),
    status: varchar("status", { length: 50 }).$type().notNull().default("pending"),
    progress: real("progress").notNull().default(0),
    inputs: jsonb("inputs").$type().default({}),
    outputs: jsonb("outputs").$type().default({}),
    error: varchar("error", { length: 2e3 }),
    retryCount: integer("retry_count").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("step_executions_execution_id_idx").on(table.executionId),
    index("step_executions_step_id_idx").on(table.stepId),
    index("step_executions_status_idx").on(table.status)
  ]
);
var executionArtifacts = pgTable(
  "execution_artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionId: uuid("execution_id").notNull().references(() => executions.id, { onDelete: "cascade" }),
    stepId: varchar("step_id", { length: 100 }),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 100 }).notNull(),
    path: varchar("path", { length: 1e3 }).notNull(),
    size: integer("size"),
    metadata: jsonb("metadata").$type().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("execution_artifacts_execution_id_idx").on(table.executionId),
    index("execution_artifacts_step_id_idx").on(table.stepId)
  ]
);
var pluginStatuses = ["active", "inactive", "error"];
var plugins = pgTable(
  "plugins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pluginId: varchar("plugin_id", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    version: varchar("version", { length: 50 }).notNull(),
    domain: varchar("domain", { length: 50 }).notNull(),
    description: varchar("description", { length: 2e3 }),
    author: varchar("author", { length: 255 }),
    status: varchar("status", { length: 50 }).$type().notNull().default("inactive"),
    isBuiltIn: boolean("is_built_in").notNull().default(false),
    config: jsonb("config").$type().default({}),
    metadata: jsonb("metadata").$type().default({}),
    installedAt: timestamp("installed_at", { withTimezone: true }).notNull().defaultNow(),
    lastActivatedAt: timestamp("last_activated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("plugins_plugin_id_idx").on(table.pluginId),
    index("plugins_domain_idx").on(table.domain),
    index("plugins_status_idx").on(table.status)
  ]
);
var pluginDependencies = pgTable(
  "plugin_dependencies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pluginId: uuid("plugin_id").notNull().references(() => plugins.id, { onDelete: "cascade" }),
    dependsOnPluginId: varchar("depends_on_plugin_id", { length: 255 }).notNull(),
    versionConstraint: varchar("version_constraint", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("plugin_dependencies_plugin_id_idx").on(table.pluginId)
  ]
);
var documentTypes = ["paper", "protocol", "documentation", "tutorial", "workflow", "note"];
var processingStatuses = ["pending", "processing", "indexed", "error"];
var documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 500 }).notNull(),
    type: varchar("type", { length: 50 }).$type().notNull(),
    content: varchar("content", { length: 1e5 }),
    status: varchar("status", { length: 50 }).$type().notNull().default("pending"),
    source: varchar("source", { length: 1e3 }),
    doi: varchar("doi", { length: 255 }),
    authors: jsonb("authors").$type().default([]),
    tags: jsonb("tags").$type().default([]),
    domain: varchar("domain", { length: 50 }),
    language: varchar("language", { length: 10 }).default("en"),
    metadata: jsonb("metadata").$type().default({}),
    uploadedById: uuid("uploaded_by_id").references(() => users.id),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("documents_type_idx").on(table.type),
    index("documents_status_idx").on(table.status),
    index("documents_domain_idx").on(table.domain),
    index("documents_doi_idx").on(table.doi)
  ]
);
var documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
    content: varchar("content", { length: 1e4 }).notNull(),
    position: integer("position").notNull(),
    charStart: integer("char_start").notNull(),
    charEnd: integer("char_end").notNull(),
    pageNumber: integer("page_number"),
    section: varchar("section", { length: 255 }),
    embedding: vector("embedding", { dimensions: 1536 }),
    // OpenAI ada-002 dimensions
    metadata: jsonb("metadata").$type().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("document_chunks_document_id_idx").on(table.documentId),
    index("document_chunks_position_idx").on(table.position)
    // Note: Vector index should be created with HNSW or IVFFlat
    // CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);
  ]
);
var usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  workflows: many(workflows),
  executions: many(executions),
  documents: many(documents),
  collaborations: many(workflowCollaborators)
}));
var sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}));
var workflowsRelations = relations(workflows, ({ one, many }) => ({
  owner: one(users, {
    fields: [workflows.ownerId],
    references: [users.id]
  }),
  parentTemplate: one(workflows, {
    fields: [workflows.parentTemplateId],
    references: [workflows.id]
  }),
  executions: many(executions),
  collaborators: many(workflowCollaborators)
}));
var workflowCollaboratorsRelations = relations(workflowCollaborators, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowCollaborators.workflowId],
    references: [workflows.id]
  }),
  user: one(users, {
    fields: [workflowCollaborators.userId],
    references: [users.id]
  })
}));
var executionsRelations = relations(executions, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [executions.workflowId],
    references: [workflows.id]
  }),
  user: one(users, {
    fields: [executions.userId],
    references: [users.id]
  }),
  stepExecutions: many(stepExecutions),
  artifacts: many(executionArtifacts)
}));
var stepExecutionsRelations = relations(stepExecutions, ({ one }) => ({
  execution: one(executions, {
    fields: [stepExecutions.executionId],
    references: [executions.id]
  })
}));
var executionArtifactsRelations = relations(executionArtifacts, ({ one }) => ({
  execution: one(executions, {
    fields: [executionArtifacts.executionId],
    references: [executions.id]
  })
}));
var pluginsRelations = relations(plugins, ({ many }) => ({
  dependencies: many(pluginDependencies)
}));
var pluginDependenciesRelations = relations(pluginDependencies, ({ one }) => ({
  plugin: one(plugins, {
    fields: [pluginDependencies.pluginId],
    references: [plugins.id]
  })
}));
var documentsRelations = relations(documents, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [documents.uploadedById],
    references: [users.id]
  }),
  chunks: many(documentChunks)
}));
var documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id]
  })
}));
function createDbConnection(options) {
  const client = postgres(options.connectionString, {
    max: options.max ?? 10,
    idle_timeout: options.idleTimeout ?? 20
  });
  return drizzle(client, { schema: schema_exports });
}

// src/db/drizzle.ts
var _db = null;
function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    _db = createDbConnection({ connectionString });
  }
  return _db;
}
function initializeDb(connectionString) {
  _db = createDbConnection({ connectionString });
  return _db;
}
function getCurrentDb() {
  return _db;
}

// src/screening/primary-screening.ts
var PrimaryScreening = class {
  filters = [];
  presets = [];
  constructor() {
    this.initializeBuiltInPresets();
  }
  initializeBuiltInPresets() {
    this.presets = [
      {
        id: "lipinski-ro5",
        name: "Lipinski Rule of Five",
        filters: [
          DrugDiscoveryFilters.molecularWeight(0, 500),
          DrugDiscoveryFilters.logP(-Infinity, 5),
          {
            id: "hbd",
            name: "H-Bond Donors",
            field: "hBondDonors",
            condition: "lessThan",
            value: 6
          },
          {
            id: "hba",
            name: "H-Bond Acceptors",
            field: "hBondAcceptors",
            condition: "lessThan",
            value: 11
          }
        ]
      },
      {
        id: "veber-rules",
        name: "Veber Rules",
        filters: [
          DrugDiscoveryFilters.tpsa(0, 140),
          DrugDiscoveryFilters.rotatableBonds(0, 10)
        ]
      }
    ];
  }
  addFilter(filter) {
    this.filters.push(filter);
  }
  getFilters() {
    return [...this.filters];
  }
  clearFilters() {
    this.filters = [];
  }
  isValidCondition(condition) {
    const validConditions = [
      "equals",
      "notEquals",
      "greaterThan",
      "lessThan",
      "between",
      "contains",
      "matches",
      "custom",
      "formula"
    ];
    return validConditions.includes(condition);
  }
  evaluateFilter(filter, candidate) {
    const value = candidate.data[filter.field];
    switch (filter.condition) {
      case "equals":
        return value === filter.value;
      case "notEquals":
        return value !== filter.value;
      case "greaterThan":
        return typeof value === "number" && value > filter.value;
      case "lessThan":
        return typeof value === "number" && value < filter.value;
      case "between":
        return typeof value === "number" && value >= (filter.min ?? -Infinity) && value <= (filter.max ?? Infinity);
      case "contains":
        if (Array.isArray(value)) {
          return value.includes(filter.value);
        }
        if (typeof value === "string") {
          return value.includes(filter.value);
        }
        return false;
      case "matches":
        if (typeof value === "string" && typeof filter.value === "string") {
          return new RegExp(filter.value).test(value);
        }
        return false;
      case "custom":
        if (filter.customFn) {
          return filter.customFn(candidate);
        }
        return true;
      case "formula":
        if (filter.formula) {
          return this.evaluateFormula(filter.formula, candidate);
        }
        return true;
      default:
        return true;
    }
  }
  evaluateFormula(formula, candidate) {
    try {
      const data = candidate.data;
      const fn = new Function("data", `return ${formula}`);
      return Boolean(fn(data));
    } catch {
      return false;
    }
  }
  apply(candidates) {
    const passed = [];
    const excluded = [];
    const filterStats = {};
    for (const filter of this.filters) {
      filterStats[filter.id] = {
        filterId: filter.id,
        failedCount: 0,
        passedCount: 0
      };
    }
    for (const candidate of candidates) {
      const failedFilters = [];
      for (const filter of this.filters) {
        const result = this.evaluateFilter(filter, candidate);
        if (result) {
          filterStats[filter.id].passedCount++;
        } else {
          filterStats[filter.id].failedCount++;
          failedFilters.push(`${filter.name}: failed`);
        }
      }
      if (failedFilters.length === 0) {
        passed.push(candidate);
      } else {
        excluded.push({
          candidate,
          reasons: failedFilters
        });
      }
    }
    return {
      passed,
      excluded,
      statistics: {
        inputCount: candidates.length,
        passedCount: passed.length,
        excludedCount: excluded.length,
        passRate: candidates.length > 0 ? passed.length / candidates.length : 0
      },
      filterStats
    };
  }
  saveAsPreset(id, name) {
    const preset = {
      id,
      name,
      filters: [...this.filters]
    };
    this.presets.push(preset);
    return preset;
  }
  loadPreset(preset) {
    this.filters = [...preset.filters];
  }
  getBuiltInPresets() {
    return this.presets;
  }
};
var DrugDiscoveryFilters = {
  molecularWeight(min, max) {
    return {
      id: "mw",
      name: "Molecular Weight",
      field: "molecularWeight",
      condition: "between",
      min,
      max
    };
  },
  logP(min, max) {
    return {
      id: "logp",
      name: "LogP",
      field: "logP",
      condition: "between",
      min,
      max
    };
  },
  tpsa(min, max) {
    return {
      id: "tpsa",
      name: "TPSA",
      field: "tpsa",
      condition: "between",
      min,
      max
    };
  },
  rotatableBonds(min, max) {
    return {
      id: "rotatable-bonds",
      name: "Rotatable Bonds",
      field: "rotatableBonds",
      condition: "between",
      min,
      max
    };
  },
  lipinskiRuleOfFive() {
    return {
      id: "lipinski-ro5",
      name: "Lipinski Rule of Five",
      field: "lipinski",
      condition: "custom",
      customFn: (candidate) => {
        const mw = candidate.data.molecularWeight;
        const logP = candidate.data.logP;
        const hbd = candidate.data.hBondDonors;
        const hba = candidate.data.hBondAcceptors;
        return mw <= 500 && logP <= 5 && hbd <= 5 && hba <= 10;
      }
    };
  },
  veberRules() {
    return {
      id: "veber-rules",
      name: "Veber Rules",
      field: "veber",
      condition: "custom",
      customFn: (candidate) => {
        const tpsa = candidate.data.tpsa;
        const rotatable = candidate.data.rotatableBonds;
        return tpsa <= 140 && rotatable <= 10;
      }
    };
  }
};
var MaterialsFilters = {
  elementConstraint(config) {
    return {
      id: "element-constraint",
      name: "Element Constraint",
      field: "elements",
      condition: "custom",
      customFn: (candidate) => {
        const elements = candidate.data.elements;
        if (!Array.isArray(elements)) return false;
        if (config.required) {
          for (const required of config.required) {
            if (!elements.includes(required)) {
              return false;
            }
          }
        }
        if (config.excluded) {
          for (const excluded of config.excluded) {
            if (elements.includes(excluded)) {
              return false;
            }
          }
        }
        return true;
      }
    };
  },
  propertyRange(property, min, max) {
    return {
      id: `property-${property}`,
      name: `${property} Range`,
      field: property,
      condition: "between",
      min,
      max
    };
  },
  similarityThreshold(threshold) {
    return {
      id: "similarity-threshold",
      name: "Structure Similarity",
      field: "structureSimilarity",
      condition: "custom",
      customFn: (candidate) => {
        const similarity = candidate.data.structureSimilarity;
        return typeof similarity === "number" && similarity >= threshold;
      }
    };
  },
  synthesizability(threshold) {
    return {
      id: "synthesizability",
      name: "Synthesizability",
      field: "synthesizability",
      condition: "custom",
      customFn: (candidate) => {
        const score = candidate.data.synthesizability;
        return typeof score === "number" && score >= threshold;
      }
    };
  }
};

// src/screening/ai-screening.ts
var AIScreening = class {
  models = /* @__PURE__ */ new Map();
  mockPredictions = /* @__PURE__ */ new Map();
  mockUncertaintyPredictions = /* @__PURE__ */ new Map();
  mockExplanationPredictions = /* @__PURE__ */ new Map();
  async addModel(config) {
    this.models.set(config.id, config);
  }
  getModels() {
    return Array.from(this.models.values());
  }
  getModel(id) {
    return this.models.get(id);
  }
  getSupportedModelTypes() {
    return ["classification", "regression", "ranking"];
  }
  // Mock helpers for testing
  setMockPredictions(predictions, modelId) {
    const key = modelId ?? "default";
    this.mockPredictions.set(key, predictions);
  }
  setMockPredictionsWithUncertainty(predictions, modelId) {
    const key = modelId ?? "default";
    this.mockUncertaintyPredictions.set(key, predictions);
  }
  setMockPredictionsWithExplanations(predictions, modelId) {
    const key = modelId ?? "default";
    this.mockExplanationPredictions.set(key, predictions);
  }
  getMockPrediction(candidateId, modelId) {
    const modelPredictions = this.mockPredictions.get(modelId);
    if (modelPredictions && candidateId in modelPredictions) {
      return modelPredictions[candidateId];
    }
    const defaultPredictions = this.mockPredictions.get("default");
    if (defaultPredictions && candidateId in defaultPredictions) {
      return defaultPredictions[candidateId];
    }
    return 0.5;
  }
  async predict(modelId, candidates) {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }
    return candidates.map((candidate) => ({
      candidateId: candidate.id,
      prediction: this.getMockPrediction(candidate.id, modelId),
      modelVersion: model.version
    }));
  }
  async screen(modelId, candidates) {
    const model = this.models.get(modelId);
    if (!model || !model.threshold) {
      throw new Error(`Model not found or no threshold configured: ${modelId}`);
    }
    const predictions = await this.predict(modelId, candidates);
    const passed = [];
    const excluded = [];
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const prediction = predictions[i];
      const passes = model.threshold.direction === "above" ? prediction.prediction >= model.threshold.passValue : prediction.prediction <= model.threshold.passValue;
      if (passes) {
        passed.push(candidate);
      } else {
        excluded.push(candidate);
      }
    }
    return { passed, excluded };
  }
  async rank(modelId, candidates) {
    const predictions = await this.predict(modelId, candidates);
    return predictions.sort((a, b) => b.prediction - a.prediction);
  }
  async predictWithUncertainty(modelId, candidates) {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }
    const mockData = this.mockUncertaintyPredictions.get(modelId) ?? this.mockUncertaintyPredictions.get("default");
    return candidates.map((candidate) => {
      const data = mockData?.[candidate.id];
      const uncertaintyValue = data?.uncertainty ?? 0.1;
      const uncertaintyLevel = uncertaintyValue < 0.1 ? "high" : uncertaintyValue > 0.2 ? "low" : "medium";
      return {
        candidateId: candidate.id,
        prediction: data?.prediction ?? this.getMockPrediction(candidate.id, modelId),
        modelVersion: model.version,
        uncertainty: {
          value: uncertaintyValue,
          level: uncertaintyLevel
        },
        flaggedForReview: uncertaintyValue > 0.2
      };
    });
  }
  async predictWithExplanation(modelId, candidates) {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }
    const mockData = this.mockExplanationPredictions.get(modelId) ?? this.mockExplanationPredictions.get("default");
    return candidates.map((candidate) => {
      const data = mockData?.[candidate.id];
      return {
        candidateId: candidate.id,
        prediction: data?.prediction ?? this.getMockPrediction(candidate.id, modelId),
        modelVersion: model.version,
        explanation: data?.explanation
      };
    });
  }
  async ensemblePredict(modelIds, candidates, options) {
    const allPredictions = {};
    for (const modelId of modelIds) {
      const predictions = await this.predict(modelId, candidates);
      for (const pred of predictions) {
        if (!allPredictions[pred.candidateId]) {
          allPredictions[pred.candidateId] = {};
        }
        allPredictions[pred.candidateId][modelId] = pred.prediction;
      }
    }
    return candidates.map((candidate) => {
      const predictions = allPredictions[candidate.id] ?? {};
      const values = Object.values(predictions);
      let aggregatedPrediction;
      if (options.aggregation === "mean") {
        aggregatedPrediction = values.reduce((sum, v) => sum + v, 0) / values.length;
      } else if (options.aggregation === "median") {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        aggregatedPrediction = sorted.length % 2 !== 0 ? sorted[mid] : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
      } else {
        let weightedSum = 0;
        let totalWeight = 0;
        for (const [modelId, pred] of Object.entries(predictions)) {
          const weight = options.weights?.[modelId] ?? 1;
          weightedSum += pred * weight;
          totalWeight += weight;
        }
        aggregatedPrediction = totalWeight > 0 ? weightedSum / totalWeight : 0;
      }
      let disagreement;
      if (options.calculateDisagreement && values.length > 1) {
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
        disagreement = Math.sqrt(
          squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length
        );
      }
      const model = this.models.get(modelIds[0]);
      return {
        candidateId: candidate.id,
        prediction: aggregatedPrediction,
        modelVersion: model?.version ?? "ensemble",
        modelDisagreement: disagreement,
        individualPredictions: predictions
      };
    });
  }
  async batchPredict(modelId, candidates, options = {}) {
    const { batchSize = 100, onProgress, parallel = false, maxConcurrency = 4 } = options;
    const results = [];
    const batches = [];
    for (let i = 0; i < candidates.length; i += batchSize) {
      batches.push(candidates.slice(i, i + batchSize));
    }
    if (parallel) {
      let completedBatches = 0;
      const processBatch = async (batch) => {
        const batchResults = await this.predict(modelId, batch);
        completedBatches++;
        if (onProgress) {
          onProgress(completedBatches / batches.length);
        }
        return batchResults;
      };
      for (let i = 0; i < batches.length; i += maxConcurrency) {
        const chunk = batches.slice(i, i + maxConcurrency);
        const chunkResults = await Promise.all(chunk.map(processBatch));
        for (const r of chunkResults) {
          results.push(...r);
        }
      }
    } else {
      for (let i = 0; i < batches.length; i++) {
        const batchResults = await this.predict(modelId, batches[i]);
        results.push(...batchResults);
        if (onProgress) {
          onProgress((i + 1) / batches.length);
        }
      }
    }
    return results;
  }
};

// src/screening/simulation-screening.ts
var SimulationScreening = class {
  config = null;
  mockResults = {};
  jobs = /* @__PURE__ */ new Map();
  cache = /* @__PURE__ */ new Map();
  cachingEnabled = false;
  resourceLimits = {};
  simulationRunCallback;
  jobIdCounter = 0;
  getSupportedTypes() {
    return ["docking", "molecular-dynamics", "fep", "dft", "phonon"];
  }
  setConfiguration(config) {
    if (config.type === "docking") {
      const params = config.parameters;
      if (!params.targetPdb) {
        throw new Error("Missing required parameter: targetPdb");
      }
    }
    this.config = config;
    this.cache.clear();
  }
  getConfiguration() {
    return this.config;
  }
  setMockResults(results) {
    this.mockResults = results;
  }
  getMockResult(candidateId) {
    return this.mockResults[candidateId] ?? {
      score: -7
    };
  }
  async runSimulations(candidates) {
    if (!this.config) {
      throw new Error("No configuration set");
    }
    const results = [];
    for (const candidate of candidates) {
      if (this.cachingEnabled) {
        const cachedResult = this.getCachedResult(candidate.id, this.config.type);
        if (cachedResult) {
          results.push({
            candidateId: candidate.id,
            type: this.config.type,
            result: cachedResult,
            timestamp: /* @__PURE__ */ new Date()
          });
          continue;
        }
      }
      if (this.simulationRunCallback) {
        this.simulationRunCallback();
      }
      const result = this.getMockResult(candidate.id);
      if (this.cachingEnabled) {
        this.setCachedResult(candidate.id, this.config.type, result);
      }
      results.push({
        candidateId: candidate.id,
        type: this.config.type,
        result,
        timestamp: /* @__PURE__ */ new Date()
      });
    }
    return results;
  }
  async screen(candidates, options) {
    const results = await this.runSimulations(candidates);
    const passed = [];
    const excluded = [];
    const scoreKey = options.scoreKey ?? "score";
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const result = results[i];
      const score = result.result[scoreKey];
      const passes = options.scoreDirection === "below" ? score < options.scoreThreshold : score > options.scoreThreshold;
      if (passes) {
        passed.push(candidate);
      } else {
        excluded.push(candidate);
      }
    }
    return { passed, excluded };
  }
  async rankByScore(candidates) {
    const results = await this.runSimulations(candidates);
    return results.map((r) => ({
      candidateId: r.candidateId,
      score: r.result.score ?? 0
    })).sort((a, b) => a.score - b.score);
  }
  calculateStability(result) {
    const data = result.result;
    if (data.stableFrameRatio !== void 0) {
      return {
        isStable: data.stableFrameRatio > 0.8,
        confidenceScore: data.stableFrameRatio
      };
    }
    if (data.isStable !== void 0) {
      return {
        isStable: data.isStable,
        confidenceScore: data.isStable ? 1 : 0
      };
    }
    return {
      isStable: true,
      confidenceScore: 0.5
    };
  }
  async queueJobs(candidates) {
    const jobs = [];
    for (const candidate of candidates) {
      const job = {
        id: `job-${++this.jobIdCounter}`,
        candidateId: candidate.id,
        status: "queued",
        priority: candidate.priority ?? "normal",
        createdAt: /* @__PURE__ */ new Date()
      };
      this.jobs.set(job.id, job);
      jobs.push(job);
    }
    return jobs;
  }
  async getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    return job;
  }
  getQueue() {
    return Array.from(this.jobs.values()).filter((j) => j.status === "queued").sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  async cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }
    if (job.status === "queued" || job.status === "running") {
      job.status = "cancelled";
      return true;
    }
    return false;
  }
  getRunningJobs() {
    const queue = this.getQueue();
    const maxConcurrent = this.resourceLimits.maxConcurrentJobs ?? 1;
    return queue.slice(0, maxConcurrent);
  }
  estimateResources(candidates) {
    if (!this.config) {
      return { cpuHours: 0, gpuHours: 0, estimatedWallTime: "0h" };
    }
    let cpuHoursPerJob = 1;
    let gpuHoursPerJob = 0;
    switch (this.config.type) {
      case "docking":
        cpuHoursPerJob = 0.1;
        break;
      case "molecular-dynamics":
        gpuHoursPerJob = 10;
        cpuHoursPerJob = 2;
        break;
      case "fep":
        gpuHoursPerJob = 50;
        cpuHoursPerJob = 10;
        break;
      case "dft":
        cpuHoursPerJob = 100;
        break;
      case "phonon":
        cpuHoursPerJob = 200;
        break;
    }
    const totalCpuHours = cpuHoursPerJob * candidates.length;
    const totalGpuHours = gpuHoursPerJob * candidates.length;
    const parallelism = this.resourceLimits.maxConcurrentJobs ?? 1;
    const wallTimeHours = Math.ceil(totalCpuHours / parallelism);
    return {
      cpuHours: totalCpuHours,
      gpuHours: totalGpuHours,
      estimatedWallTime: `${wallTimeHours}h`
    };
  }
  setResourceLimits(limits) {
    this.resourceLimits = limits;
  }
  getResourceLimits() {
    return { ...this.resourceLimits };
  }
  enableCaching(enabled) {
    this.cachingEnabled = enabled;
  }
  getCachedResult(candidateId, type) {
    return this.cache.get(type)?.get(candidateId);
  }
  setCachedResult(candidateId, type, result) {
    if (!this.cache.has(type)) {
      this.cache.set(type, /* @__PURE__ */ new Map());
    }
    this.cache.get(type).set(candidateId, result);
  }
  onSimulationRun(callback) {
    this.simulationRunCallback = callback;
  }
  aggregateResults(results) {
    const scores = results.map((r) => r.result.score).filter((s) => s !== void 0);
    return {
      count: results.length,
      scoreStats: {
        min: Math.min(...scores),
        max: Math.max(...scores),
        mean: scores.reduce((sum, s) => sum + s, 0) / scores.length
      }
    };
  }
  calculateStatistics(results) {
    const scores = results.map((r) => r.result.score).filter((s) => s !== void 0).sort((a, b) => a - b);
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const squaredDiffs = scores.map((s) => Math.pow(s - mean, 2));
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    const percentile = (arr, p) => {
      const index6 = p / 100 * (arr.length - 1);
      const lower = Math.floor(index6);
      const upper = Math.ceil(index6);
      if (lower === upper) return arr[lower];
      return (arr[lower] + arr[upper]) / 2;
    };
    return {
      score: {
        min: scores[0],
        max: scores[scores.length - 1],
        mean,
        percentile25: percentile(scores, 25),
        percentile75: percentile(scores, 75),
        standardDeviation: stdDev
      }
    };
  }
  selectTop(results, count) {
    return results.map((r) => ({
      candidateId: r.candidateId,
      score: r.result.score ?? 0
    })).sort((a, b) => a.score - b.score).slice(0, count);
  }
};

// src/nli/nli-service.ts
var InputPattern = /* @__PURE__ */ ((InputPattern2) => {
  InputPattern2["Predict"] = "predict";
  InputPattern2["Generate"] = "generate";
  InputPattern2["Optimize"] = "optimize";
  InputPattern2["Analyze"] = "analyze";
  InputPattern2["Compare"] = "compare";
  InputPattern2["Unknown"] = "unknown";
  return InputPattern2;
})(InputPattern || {});
function detectLanguage(text) {
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g;
  const japaneseMatches = text.match(japaneseRegex) || [];
  const japaneseRatio = japaneseMatches.length / text.length;
  return japaneseRatio > 0.2 ? "ja" : "en";
}
function extractIntent(text) {
  const normalizedText = text.toLowerCase();
  const japanesePatterns = [
    [/予測したい|予測する|予測を/, "predict" /* Predict */],
    [/生成したい|生成する|作りたい|作成したい/, "generate" /* Generate */],
    [/最適化したい|最適化する|改善したい/, "optimize" /* Optimize */],
    [/分析したい|分析する|解析したい|調べたい/, "analyze" /* Analyze */],
    [/比較したい|比較する|比べたい/, "compare" /* Compare */]
  ];
  const englishPatterns = [
    [/predict|prediction|forecast/, "predict" /* Predict */],
    [/generate|create|design|discover/, "generate" /* Generate */],
    [/optimize|optimization|improve/, "optimize" /* Optimize */],
    [/analyze|analysis|examine|investigate/, "analyze" /* Analyze */],
    [/compare|comparison|diff/, "compare" /* Compare */]
  ];
  for (const [regex, pattern] of japanesePatterns) {
    if (regex.test(text)) {
      return pattern;
    }
  }
  for (const [regex, pattern] of englishPatterns) {
    if (regex.test(normalizedText)) {
      return pattern;
    }
  }
  return "unknown" /* Unknown */;
}
var DOMAIN_KEYWORDS = {
  "drug-discovery": [
    "\u5275\u85AC",
    "\u85AC",
    "\u85AC\u7269",
    "drug",
    "pharma",
    "pharmaceutical",
    "\u5316\u5408\u7269",
    "compound",
    "molecule",
    "\u5206\u5B50",
    "\u30EA\u30FC\u30C9",
    "lead",
    "ADMET",
    "\u7D50\u5408\u89AA\u548C\u6027",
    "binding",
    "affinity",
    "target",
    "\u6A19\u7684"
  ],
  "materials": [
    "\u6750\u6599",
    "material",
    "\u96FB\u6C60",
    "battery",
    "\u534A\u5C0E\u4F53",
    "semiconductor",
    "\u30D0\u30F3\u30C9\u30AE\u30E3\u30C3\u30D7",
    "bandgap",
    "\u7D50\u6676",
    "crystal",
    "\u5408\u91D1",
    "alloy",
    "\u89E6\u5A92",
    "catalyst",
    "\u8D85\u4F1D\u5C0E",
    "superconductor"
  ],
  "climate": [
    "\u6C17\u5019",
    "climate",
    "\u5929\u6C17",
    "weather",
    "\u6C17\u8C61",
    "\u4E88\u5831",
    "forecast",
    "\u5927\u6C17",
    "atmosphere",
    "\u74B0\u5883",
    "environment",
    "\u6E29\u5EA6",
    "temperature"
  ],
  "genomics": [
    "\u30BF\u30F3\u30D1\u30AF\u8CEA",
    "protein",
    "\u907A\u4F1D\u5B50",
    "gene",
    "DNA",
    "RNA",
    "\u914D\u5217",
    "sequence",
    "FASTA",
    "\u69CB\u9020",
    "structure",
    "\u30B3\u30F3\u30D5\u30A9\u30E1\u30FC\u30B7\u30E7\u30F3",
    "\u30B2\u30CE\u30E0",
    "genome",
    "\u30D7\u30ED\u30C6\u30AA\u30FC\u30E0",
    "proteome",
    "PDB"
  ],
  "chemistry": [
    "\u5316\u5B66",
    "chemistry",
    "DFT",
    "\u91CF\u5B50",
    "quantum",
    "\u96FB\u5B50",
    "electron",
    "\u8ECC\u9053",
    "orbital",
    "\u53CD\u5FDC",
    "reaction",
    "MD",
    "\u52D5\u529B\u5B66",
    "dynamics"
  ],
  "physics": [
    "\u7269\u7406",
    "physics",
    "\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3",
    "simulation",
    "\u5834",
    "field",
    "\u7C92\u5B50",
    "particle",
    "\u91CF\u5B50",
    "quantum"
  ]
};
var WORKFLOW_RECOMMENDATIONS = {
  "drug-discovery": {
    ["predict" /* Predict */]: ["admet-prediction", "binding-prediction", "activity-prediction"],
    ["generate" /* Generate */]: ["molecule-generation", "lead-optimization"],
    ["optimize" /* Optimize */]: ["lead-optimization", "property-optimization"],
    ["analyze" /* Analyze */]: ["molecule-analysis", "docking-analysis"],
    ["compare" /* Compare */]: ["molecule-comparison", "activity-comparison"],
    ["unknown" /* Unknown */]: ["molecule-generation", "admet-prediction"]
  },
  "materials": {
    ["predict" /* Predict */]: ["property-prediction", "stability-prediction"],
    ["generate" /* Generate */]: ["material-generation", "crystal-design"],
    ["optimize" /* Optimize */]: ["material-optimization", "composition-optimization"],
    ["analyze" /* Analyze */]: ["dft-analysis", "structure-analysis"],
    ["compare" /* Compare */]: ["material-comparison"],
    ["unknown" /* Unknown */]: ["material-generation", "property-prediction"]
  },
  "climate": {
    ["predict" /* Predict */]: ["weather-prediction", "climate-forecast"],
    ["generate" /* Generate */]: ["weather-prediction", "scenario-generation", "ensemble-generation"],
    ["optimize" /* Optimize */]: ["model-calibration"],
    ["analyze" /* Analyze */]: ["climate-analysis", "trend-analysis"],
    ["compare" /* Compare */]: ["model-comparison", "scenario-comparison"],
    ["unknown" /* Unknown */]: ["weather-prediction", "climate-analysis"]
  },
  "genomics": {
    ["predict" /* Predict */]: ["protein-structure", "structure-prediction", "function-prediction"],
    ["generate" /* Generate */]: ["sequence-generation", "variant-generation"],
    ["optimize" /* Optimize */]: ["sequence-optimization"],
    ["analyze" /* Analyze */]: ["sequence-analysis", "structure-analysis"],
    ["compare" /* Compare */]: ["structure-comparison", "alignment"],
    ["unknown" /* Unknown */]: ["protein-structure", "sequence-analysis"]
  },
  "chemistry": {
    ["predict" /* Predict */]: ["property-prediction", "reaction-prediction"],
    ["generate" /* Generate */]: ["conformer-generation", "reaction-design"],
    ["optimize" /* Optimize */]: ["geometry-optimization", "reaction-optimization"],
    ["analyze" /* Analyze */]: ["dft-analysis", "orbital-analysis"],
    ["compare" /* Compare */]: ["isomer-comparison", "mechanism-comparison"],
    ["unknown" /* Unknown */]: ["dft-analysis", "property-prediction"]
  },
  "physics": {
    ["predict" /* Predict */]: ["simulation-prediction", "field-prediction"],
    ["generate" /* Generate */]: ["trajectory-generation", "configuration-generation"],
    ["optimize" /* Optimize */]: ["parameter-optimization"],
    ["analyze" /* Analyze */]: ["trajectory-analysis", "field-analysis"],
    ["compare" /* Compare */]: ["model-comparison"],
    ["unknown" /* Unknown */]: ["simulation-prediction"]
  }
};
var CLARIFICATION_TEMPLATES = {
  ja: {
    general: "\u3088\u308A\u5177\u4F53\u7684\u306B\u6559\u3048\u3066\u304F\u3060\u3055\u3044\u3002\u3069\u306E\u3088\u3046\u306A\u7814\u7A76\u5206\u91CE\u3067\u3001\u4F55\u3092\u9054\u6210\u3057\u305F\u3044\u3067\u3059\u304B\uFF1F",
    domain: "\u3069\u306E\u7814\u7A76\u5206\u91CE\u306B\u95A2\u9023\u3057\u3066\u3044\u307E\u3059\u304B\uFF1F\uFF08\u5275\u85AC\u3001\u6750\u6599\u79D1\u5B66\u3001\u6C17\u5019\u3001\u30B2\u30CE\u30DF\u30AF\u30B9\u3001\u5316\u5B66\u3001\u7269\u7406\uFF09",
    target: "\u4F55\u3092\u4E88\u6E2C/\u751F\u6210/\u5206\u6790\u3057\u305F\u3044\u3067\u3059\u304B\uFF1F\u5177\u4F53\u7684\u306A\u5BFE\u8C61\u3092\u6559\u3048\u3066\u304F\u3060\u3055\u3044\u3002",
    input: "\u5165\u529B\u30C7\u30FC\u30BF\u306E\u5F62\u5F0F\u306F\u4F55\u3067\u3059\u304B\uFF1F\uFF08PDB\u3001FASTA\u3001SMILES\u3001CIF \u306A\u3069\uFF09"
  },
  en: {
    general: "Please be more specific. What research domain and what do you want to achieve?",
    domain: "Which research domain is this related to? (drug discovery, materials, climate, genomics, chemistry, physics)",
    target: "What do you want to predict/generate/analyze? Please specify the target.",
    input: "What is the input data format? (PDB, FASTA, SMILES, CIF, etc.)"
  }
};
var DATA_FORMAT_KEYWORDS = {
  pdb: ["pdb", "PDB"],
  fasta: ["fasta", "FASTA", "fa"],
  smiles: ["smiles", "SMILES"],
  sdf: ["sdf", "SDF", "mol"],
  cif: ["cif", "CIF"],
  csv: ["csv", "CSV"],
  json: ["json", "JSON"],
  netcdf: ["netcdf", "NetCDF", "nc"],
  xyz: ["xyz", "XYZ"]
};
var PROPERTY_KEYWORDS = {
  "binding-affinity": ["\u7D50\u5408\u89AA\u548C\u6027", "binding affinity", "binding", "\u89AA\u548C\u6027", "affinity", "Ki", "Kd"],
  "bandgap": ["\u30D0\u30F3\u30C9\u30AE\u30E3\u30C3\u30D7", "bandgap", "band gap", "\u30D0\u30F3\u30C9\u30AE\u30E3\u30C3\u30D7"],
  "activity": ["\u6D3B\u6027", "activity", "IC50", "EC50"],
  "stability": ["\u5B89\u5B9A\u6027", "stability", "\u71B1\u529B\u5B66\u7684\u5B89\u5B9A\u6027"],
  "solubility": ["\u6EB6\u89E3\u6027", "solubility"],
  "toxicity": ["\u6BD2\u6027", "toxicity"]
};
var NLIService = class {
  /**
   * Analyze intent from natural language input (DASH-NLI-002)
   */
  async analyzeIntent(text, options = {}) {
    const language = options.language ?? detectLanguage(text);
    const pattern = extractIntent(text);
    const extractedInfo = await this.extractInfo(text);
    const domain = extractedInfo.domain ?? this.detectDomain(text);
    const confidence = this.calculateConfidence(text, pattern, domain);
    const needsClarification = confidence < 0.5 || pattern === "unknown" /* Unknown */ && !domain;
    const recommendedWorkflows = this.getWorkflowRecommendations(
      domain,
      pattern,
      text
    );
    let clarificationQuestion;
    let clarificationOptions;
    if (needsClarification) {
      const templates = CLARIFICATION_TEMPLATES[language];
      if (pattern === "unknown" /* Unknown */) {
        clarificationQuestion = templates.general;
      } else if (!domain) {
        clarificationQuestion = templates.domain;
        clarificationOptions = [
          "\u5275\u85AC\u30FB\u88FD\u85AC",
          "\u6750\u6599\u79D1\u5B66",
          "\u6C17\u5019\u30FB\u74B0\u5883",
          "\u30B2\u30CE\u30DF\u30AF\u30B9",
          "\u5316\u5B66",
          "\u7269\u7406"
        ];
      } else {
        clarificationQuestion = templates.target;
      }
    }
    return {
      pattern,
      confidence,
      language,
      recommendedWorkflows,
      needsClarification,
      clarificationQuestion,
      clarificationOptions
    };
  }
  /**
   * Extract information from text (DASH-NLI-003)
   */
  async extractInfo(text) {
    const domain = this.detectDomain(text);
    const targetProperties = this.extractProperties(text);
    const inputDataTypes = this.extractDataFormats(text, "input");
    const expectedOutputFormats = this.extractDataFormats(text, "output");
    return {
      domain,
      targetProperties: targetProperties.length > 0 ? targetProperties : void 0,
      inputDataTypes: inputDataTypes.length > 0 ? inputDataTypes : void 0,
      expectedOutputFormats: expectedOutputFormats.length > 0 ? expectedOutputFormats : void 0
    };
  }
  /**
   * Detect research domain from text
   */
  detectDomain(text) {
    const normalizedText = text.toLowerCase();
    let maxMatches = 0;
    let detectedDomain;
    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      const matches = keywords.filter(
        (kw) => text.includes(kw) || normalizedText.includes(kw.toLowerCase())
      ).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedDomain = domain;
      }
    }
    return detectedDomain;
  }
  /**
   * Extract data formats from text
   */
  extractDataFormats(text, context) {
    const formats = [];
    const normalizedText = text.toLowerCase();
    const isOutputContext = context === "output" && (text.includes("\u51FA\u529B") || normalizedText.includes("output") || normalizedText.includes("export"));
    const isInputContext = context === "input" && (text.includes("\u5165\u529B") || normalizedText.includes("input") || text.includes("\u30D5\u30A1\u30A4\u30EB"));
    for (const [format, keywords] of Object.entries(DATA_FORMAT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword) || normalizedText.includes(keyword.toLowerCase())) {
          if (context === "output" && isOutputContext) {
            formats.push(format);
          } else if (context === "input" && isInputContext) {
            formats.push(format);
          } else if (!isOutputContext && !isInputContext) {
            formats.push(format);
          }
          break;
        }
      }
    }
    return [...new Set(formats)];
  }
  /**
   * Extract target properties from text
   */
  extractProperties(text) {
    const properties = [];
    const normalizedText = text.toLowerCase();
    for (const [property, keywords] of Object.entries(PROPERTY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword) || normalizedText.includes(keyword.toLowerCase())) {
          properties.push(property);
          break;
        }
      }
    }
    return [...new Set(properties)];
  }
  /**
   * Calculate confidence score
   */
  calculateConfidence(text, pattern, domain) {
    let confidence = 0;
    if (pattern !== "unknown" /* Unknown */) {
      confidence += 0.45;
    }
    if (domain) {
      confidence += 0.35;
    }
    if (text.length > 20) {
      confidence += 0.15;
    }
    if (text.length > 50) {
      confidence += 0.15;
    }
    const keywordCount = this.countDomainKeywords(text);
    if (keywordCount >= 2) {
      confidence += 0.1;
    }
    return Math.min(confidence, 1);
  }
  /**
   * Count domain keywords in text
   */
  countDomainKeywords(text) {
    let count = 0;
    const normalizedText = text.toLowerCase();
    for (const keywords of Object.values(DOMAIN_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword) || normalizedText.includes(keyword.toLowerCase())) {
          count++;
        }
      }
    }
    return count;
  }
  /**
   * Get workflow recommendations
   */
  getWorkflowRecommendations(domain, pattern, text) {
    const recommendations = [];
    if (domain && WORKFLOW_RECOMMENDATIONS[domain]) {
      const domainWorkflows = WORKFLOW_RECOMMENDATIONS[domain][pattern] ?? WORKFLOW_RECOMMENDATIONS[domain]["unknown" /* Unknown */];
      recommendations.push(...domainWorkflows);
    }
    if (recommendations.length === 0) {
      if (text.includes("\u30BF\u30F3\u30D1\u30AF\u8CEA") || text.includes("protein") || text.includes("\u69CB\u9020")) {
        recommendations.push("protein-structure");
      }
      if (text.includes("\u5206\u5B50") || text.includes("molecule") || text.includes("\u5316\u5408\u7269")) {
        recommendations.push("molecule-generation");
      }
      if (text.includes("\u6750\u6599") || text.includes("material") || text.includes("\u96FB\u6C60")) {
        recommendations.push("material-generation");
      }
      if (text.includes("\u5929\u6C17") || text.includes("weather") || text.includes("\u6C17\u8C61")) {
        recommendations.push("weather-prediction");
      }
    }
    return [...new Set(recommendations)];
  }
};

// src/index.ts
var VERSION = "0.0.1";

export { AIScreening, AccountLockedError, AuthError, AuthProviderFactory, AuthService, DocumentProcessor, DrugDiscoveryFilters, EntraIDProvider, Execution, InputPattern, InvalidCredentialsError, InvalidTokenError, KnowledgeBase, LocalAuthProvider, MaterialsFilters, NLIService, PluginLoader, PluginManager, PluginRegistry, PrimaryScreening, ProviderNotConfiguredError, RAGService, SessionExpiredError, ShibbolethProvider, SimulationScreening, Step, UserNotFoundError, VERSION, Workflow, authProviders, createDbConnection, detectLanguage, documentChunks, documentChunksRelations, documentTypes, documents, documentsRelations, executionArtifacts, executionArtifactsRelations, executionStatuses, executions, executionsRelations, extractIntent, getCurrentDb, getDb, initializeDb, pluginDependencies, pluginDependenciesRelations, pluginStatuses, plugins, pluginsRelations, processingStatuses, researchDomains, sessions, sessionsRelations, stepExecutions, stepExecutionsRelations, stepStatuses, userRoles, users, usersRelations, workflowCollaborators, workflowCollaboratorsRelations, workflowStatuses, workflows, workflowsRelations };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map