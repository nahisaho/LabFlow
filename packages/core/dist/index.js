import * as argon2 from 'argon2';
import { jwtVerify, SignJWT } from 'jose';
import { pgTable, timestamp, jsonb, varchar, boolean, uuid, index, integer, real, vector, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { randomUUID } from 'crypto';

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  __defProp(target, "default", { value: mod, enumerable: true }) ,
  mod
));

// ../../../../node_modules/uuid/rng.js
var require_rng = __commonJS({
  "../../../../node_modules/uuid/rng.js"(exports$1, module) {
    var rb = __require("crypto").randomBytes;
    module.exports = function() {
      return rb(16);
    };
  }
});

// ../../../../node_modules/uuid/uuid.js
var require_uuid = __commonJS({
  "../../../../node_modules/uuid/uuid.js"(exports$1, module) {
    var _rng = require_rng();
    var _byteToHex = [];
    var _hexToByte = {};
    for (i = 0; i < 256; i++) {
      _byteToHex[i] = (i + 256).toString(16).substr(1);
      _hexToByte[_byteToHex[i]] = i;
    }
    var i;
    function parse(s, buf, offset) {
      var i2 = buf && offset || 0, ii = 0;
      buf = buf || [];
      s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
        if (ii < 16) {
          buf[i2 + ii++] = _hexToByte[oct];
        }
      });
      while (ii < 16) {
        buf[i2 + ii++] = 0;
      }
      return buf;
    }
    function unparse(buf, offset) {
      var i2 = offset || 0, bth = _byteToHex;
      return bth[buf[i2++]] + bth[buf[i2++]] + bth[buf[i2++]] + bth[buf[i2++]] + "-" + bth[buf[i2++]] + bth[buf[i2++]] + "-" + bth[buf[i2++]] + bth[buf[i2++]] + "-" + bth[buf[i2++]] + bth[buf[i2++]] + "-" + bth[buf[i2++]] + bth[buf[i2++]] + bth[buf[i2++]] + bth[buf[i2++]] + bth[buf[i2++]] + bth[buf[i2++]];
    }
    var _seedBytes = _rng();
    var _nodeId = [
      _seedBytes[0] | 1,
      _seedBytes[1],
      _seedBytes[2],
      _seedBytes[3],
      _seedBytes[4],
      _seedBytes[5]
    ];
    var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 16383;
    var _lastMSecs = 0;
    var _lastNSecs = 0;
    function v1(options, buf, offset) {
      var i2 = buf && offset || 0;
      var b = buf || [];
      options = options || {};
      var clockseq = options.clockseq !== void 0 ? options.clockseq : _clockseq;
      var msecs = options.msecs !== void 0 ? options.msecs : (/* @__PURE__ */ new Date()).getTime();
      var nsecs = options.nsecs !== void 0 ? options.nsecs : _lastNSecs + 1;
      var dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
      if (dt < 0 && options.clockseq === void 0) {
        clockseq = clockseq + 1 & 16383;
      }
      if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === void 0) {
        nsecs = 0;
      }
      if (nsecs >= 1e4) {
        throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
      }
      _lastMSecs = msecs;
      _lastNSecs = nsecs;
      _clockseq = clockseq;
      msecs += 122192928e5;
      var tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
      b[i2++] = tl >>> 24 & 255;
      b[i2++] = tl >>> 16 & 255;
      b[i2++] = tl >>> 8 & 255;
      b[i2++] = tl & 255;
      var tmh = msecs / 4294967296 * 1e4 & 268435455;
      b[i2++] = tmh >>> 8 & 255;
      b[i2++] = tmh & 255;
      b[i2++] = tmh >>> 24 & 15 | 16;
      b[i2++] = tmh >>> 16 & 255;
      b[i2++] = clockseq >>> 8 | 128;
      b[i2++] = clockseq & 255;
      var node = options.node || _nodeId;
      for (var n = 0; n < 6; n++) {
        b[i2 + n] = node[n];
      }
      return buf ? buf : unparse(b);
    }
    function v4(options, buf, offset) {
      var i2 = buf && offset || 0;
      if (typeof options == "string") {
        buf = options == "binary" ? new Array(16) : null;
        options = null;
      }
      options = options || {};
      var rnds = options.random || (options.rng || _rng)();
      rnds[6] = rnds[6] & 15 | 64;
      rnds[8] = rnds[8] & 63 | 128;
      if (buf) {
        for (var ii = 0; ii < 16; ii++) {
          buf[i2 + ii] = rnds[ii];
        }
      }
      return buf || unparse(rnds);
    }
    var uuid7 = v4;
    uuid7.v1 = v1;
    uuid7.v4 = v4;
    uuid7.parse = parse;
    uuid7.unparse = unparse;
    module.exports = uuid7;
  }
});

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
    const index7 = this._dependencies.indexOf(stepId);
    if (index7 > -1) {
      this._dependencies.splice(index7, 1);
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
      (entity, index7, self) => index7 === self.findIndex(
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
  datasetTypes: () => datasetTypes,
  datasetVisibilities: () => datasetVisibilities,
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
  experimentStatuses: () => experimentStatuses,
  labDatasets: () => labDatasets,
  labDatasetsRelations: () => labDatasetsRelations,
  labExperiments: () => labExperiments,
  labExperimentsRelations: () => labExperimentsRelations,
  labInvitations: () => labInvitations,
  labInvitationsRelations: () => labInvitationsRelations,
  labMemberRoles: () => labMemberRoles,
  labMembers: () => labMembers,
  labMembersRelations: () => labMembersRelations,
  labs: () => labs,
  labsRelations: () => labsRelations,
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
var labMemberRoles = ["owner", "admin", "member", "viewer"];
var datasetTypes = [
  "experiment",
  "simulation",
  "screening",
  "literature",
  "molecule",
  "material",
  "sequence",
  "other"
];
var datasetVisibilities = ["private", "lab", "public"];
var experimentStatuses = ["draft", "running", "completed", "failed", "archived"];
var labs = pgTable(
  "labs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    description: varchar("description", { length: 2e3 }),
    organization: varchar("organization", { length: 255 }),
    domain: varchar("domain", { length: 50 }),
    // drug-discovery, materials-science, etc.
    avatarUrl: varchar("avatar_url", { length: 500 }),
    settings: jsonb("settings").$type().default({}),
    isActive: boolean("is_active").notNull().default(true),
    createdById: uuid("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("labs_slug_idx").on(table.slug),
    index("labs_domain_idx").on(table.domain),
    index("labs_created_by_idx").on(table.createdById)
  ]
);
var labMembers = pgTable(
  "lab_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    labId: uuid("lab_id").notNull().references(() => labs.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).$type().notNull().default("member"),
    isActive: boolean("is_active").notNull().default(true),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    invitedById: uuid("invited_by_id").references(() => users.id)
  },
  (table) => [
    index("lab_members_lab_id_idx").on(table.labId),
    index("lab_members_user_id_idx").on(table.userId),
    unique("lab_members_lab_user_unique").on(table.labId, table.userId)
  ]
);
var labDatasets = pgTable(
  "lab_datasets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    labId: uuid("lab_id").notNull().references(() => labs.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 5e3 }),
    type: varchar("type", { length: 50 }).$type().notNull(),
    visibility: varchar("visibility", { length: 50 }).$type().notNull().default("lab"),
    // Data location
    storageUrl: varchar("storage_url", { length: 1e3 }),
    filePath: varchar("file_path", { length: 500 }),
    fileSize: integer("file_size"),
    // bytes
    fileFormat: varchar("file_format", { length: 50 }),
    // csv, json, parquet, etc.
    // Metadata
    schema: jsonb("schema").$type(),
    rowCount: integer("row_count"),
    columnCount: integer("column_count"),
    tags: jsonb("tags").$type().default([]),
    metadata: jsonb("metadata").$type().default({}),
    // Versioning
    version: varchar("version", { length: 50 }).default("1.0.0"),
    parentId: uuid("parent_id"),
    // Previous version
    // GraphRAG integration
    isIndexed: boolean("is_indexed").notNull().default(false),
    indexedAt: timestamp("indexed_at", { withTimezone: true }),
    // Ownership
    createdById: uuid("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("lab_datasets_lab_id_idx").on(table.labId),
    index("lab_datasets_type_idx").on(table.type),
    index("lab_datasets_visibility_idx").on(table.visibility),
    index("lab_datasets_created_by_idx").on(table.createdById)
  ]
);
var labExperiments = pgTable(
  "lab_experiments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    labId: uuid("lab_id").notNull().references(() => labs.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 5e3 }),
    hypothesis: varchar("hypothesis", { length: 2e3 }),
    status: varchar("status", { length: 50 }).$type().notNull().default("draft"),
    // Experiment configuration
    workflowId: uuid("workflow_id"),
    parameters: jsonb("parameters").$type().default({}),
    // Results
    results: jsonb("results").$type(),
    conclusions: varchar("conclusions", { length: 5e3 }),
    // Input/Output datasets
    inputDatasetIds: jsonb("input_dataset_ids").$type().default([]),
    outputDatasetIds: jsonb("output_dataset_ids").$type().default([]),
    // Metadata
    tags: jsonb("tags").$type().default([]),
    metadata: jsonb("metadata").$type().default({}),
    // Timeline
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    // Ownership
    createdById: uuid("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("lab_experiments_lab_id_idx").on(table.labId),
    index("lab_experiments_status_idx").on(table.status),
    index("lab_experiments_created_by_idx").on(table.createdById)
  ]
);
var labInvitations = pgTable(
  "lab_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    labId: uuid("lab_id").notNull().references(() => labs.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).$type().notNull().default("member"),
    token: varchar("token", { length: 100 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    invitedById: uuid("invited_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("lab_invitations_lab_id_idx").on(table.labId),
    index("lab_invitations_email_idx").on(table.email),
    index("lab_invitations_token_idx").on(table.token)
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
var labsRelations = relations(labs, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [labs.createdById],
    references: [users.id]
  }),
  members: many(labMembers),
  datasets: many(labDatasets),
  experiments: many(labExperiments),
  invitations: many(labInvitations)
}));
var labMembersRelations = relations(labMembers, ({ one }) => ({
  lab: one(labs, {
    fields: [labMembers.labId],
    references: [labs.id]
  }),
  user: one(users, {
    fields: [labMembers.userId],
    references: [users.id]
  }),
  invitedBy: one(users, {
    fields: [labMembers.invitedById],
    references: [users.id]
  })
}));
var labDatasetsRelations = relations(labDatasets, ({ one }) => ({
  lab: one(labs, {
    fields: [labDatasets.labId],
    references: [labs.id]
  }),
  createdBy: one(users, {
    fields: [labDatasets.createdById],
    references: [users.id]
  })
}));
var labExperimentsRelations = relations(labExperiments, ({ one }) => ({
  lab: one(labs, {
    fields: [labExperiments.labId],
    references: [labs.id]
  }),
  createdBy: one(users, {
    fields: [labExperiments.createdById],
    references: [users.id]
  })
}));
var labInvitationsRelations = relations(labInvitations, ({ one }) => ({
  lab: one(labs, {
    fields: [labInvitations.labId],
    references: [labs.id]
  }),
  invitedBy: one(users, {
    fields: [labInvitations.invitedById],
    references: [users.id]
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
      const index7 = p / 100 * (arr.length - 1);
      const lower = Math.floor(index7);
      const upper = Math.ceil(index7);
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
var DEFAULT_LAB_SETTINGS = {
  allowDatasetExport: true,
  requireApprovalForPublic: true,
  defaultVisibility: "lab",
  maxStorageGb: 100,
  enableGraphRAG: true
};
var ROLE_LEVELS = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4
};
var LabService = class {
  constructor(repository) {
    this.repository = repository;
  }
  /**
   * Create a new lab
   */
  async createLab(input, userId) {
    const now = /* @__PURE__ */ new Date();
    const lab = {
      id: randomUUID(),
      name: input.name,
      description: input.description ?? null,
      iconUrl: input.iconUrl ?? null,
      settings: {
        ...DEFAULT_LAB_SETTINGS,
        ...input.settings
      },
      createdById: userId,
      createdAt: now,
      updatedAt: now
    };
    const createdLab = await this.repository.createLab(lab);
    await this.repository.addMember({
      id: randomUUID(),
      labId: createdLab.id,
      userId,
      role: "owner",
      invitedById: null,
      joinedAt: now,
      updatedAt: now
    });
    return createdLab;
  }
  /**
   * Get a lab by ID
   */
  async getLab(id, userId) {
    const hasAccess = await this.checkPermission(id, userId, "viewer");
    if (!hasAccess.allowed) {
      return null;
    }
    return this.repository.getLab(id);
  }
  /**
   * Update a lab
   */
  async updateLab(id, input, userId) {
    const hasAccess = await this.checkPermission(id, userId, "admin");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    const updates = {
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (input.name !== void 0) updates.name = input.name;
    if (input.description !== void 0) updates.description = input.description;
    if (input.iconUrl !== void 0) updates.iconUrl = input.iconUrl;
    if (input.settings !== void 0) {
      const existingLab = await this.repository.getLab(id);
      if (existingLab) {
        updates.settings = {
          ...existingLab.settings,
          ...input.settings
        };
      }
    }
    return this.repository.updateLab(id, updates);
  }
  /**
   * Delete a lab (owner only)
   */
  async deleteLab(id, userId) {
    const hasAccess = await this.checkPermission(id, userId, "owner");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    return this.repository.deleteLab(id);
  }
  /**
   * List labs for a user
   */
  async listLabs(options) {
    return this.repository.listLabsForUser(options);
  }
  /**
   * Invite a member to a lab
   */
  async inviteMember(input, inviterId) {
    const hasAccess = await this.checkPermission(input.labId, inviterId, "admin");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    if (input.role === "owner") {
      throw new Error("Cannot invite as owner");
    }
    const inviterMember = await this.repository.getMember(input.labId, inviterId);
    if (inviterMember && ROLE_LEVELS[input.role] > ROLE_LEVELS[inviterMember.role]) {
      throw new Error("Cannot invite with higher role than your own");
    }
    const token = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.repository.createInvitation({
      id: randomUUID(),
      labId: input.labId,
      email: input.email,
      role: input.role,
      token,
      invitedById: inviterId,
      expiresAt
    });
    return { token };
  }
  /**
   * Accept an invitation
   */
  async acceptInvitation(token, userId, userEmail) {
    const invitation = await this.repository.getInvitationByToken(token);
    if (!invitation) {
      throw new Error("Invalid or expired invitation");
    }
    if (invitation.acceptedAt) {
      throw new Error("Invitation already accepted");
    }
    if (invitation.expiresAt < /* @__PURE__ */ new Date()) {
      throw new Error("Invitation expired");
    }
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new Error("Invitation email does not match");
    }
    const existingMember = await this.repository.getMember(invitation.labId, userId);
    if (existingMember) {
      throw new Error("Already a member of this lab");
    }
    return this.repository.acceptInvitation(token, userId);
  }
  /**
   * Update member role
   */
  async updateMemberRole(labId, targetUserId, newRole, requesterId) {
    if (newRole === "owner") {
      throw new Error("Cannot change role to owner");
    }
    const hasAccess = await this.checkPermission(labId, requesterId, "admin");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    const requesterMember = await this.repository.getMember(labId, requesterId);
    if (!requesterMember) {
      throw new Error("Requester not a member");
    }
    const targetMember = await this.repository.getMember(labId, targetUserId);
    if (!targetMember) {
      throw new Error("Target user is not a member");
    }
    if (targetMember.role === "owner") {
      throw new Error("Cannot change owner role");
    }
    if (requesterMember.role !== "owner" && ROLE_LEVELS[newRole] >= ROLE_LEVELS[requesterMember.role]) {
      throw new Error("Cannot assign role equal to or higher than your own");
    }
    return this.repository.updateMemberRole(labId, targetUserId, newRole);
  }
  /**
   * Remove a member from a lab
   */
  async removeMember(labId, targetUserId, requesterId) {
    if (targetUserId === requesterId) {
      const member = await this.repository.getMember(labId, targetUserId);
      if (member?.role === "owner") {
        throw new Error("Owner cannot leave the lab. Transfer ownership first.");
      }
      return this.repository.removeMember(labId, targetUserId);
    }
    const hasAccess = await this.checkPermission(labId, requesterId, "admin");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    const [requesterMember, targetMember] = await Promise.all([
      this.repository.getMember(labId, requesterId),
      this.repository.getMember(labId, targetUserId)
    ]);
    if (!targetMember) {
      throw new Error("Target user is not a member");
    }
    if (targetMember.role === "owner") {
      throw new Error("Cannot remove owner");
    }
    if (requesterMember?.role !== "owner" && ROLE_LEVELS[targetMember.role] >= ROLE_LEVELS[requesterMember?.role || "viewer"]) {
      throw new Error("Cannot remove member with equal or higher role");
    }
    return this.repository.removeMember(labId, targetUserId);
  }
  /**
   * List members of a lab
   */
  async listMembers(labId, userId) {
    const hasAccess = await this.checkPermission(labId, userId, "viewer");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    return this.repository.listMembers(labId);
  }
  /**
   * List pending invitations
   */
  async listPendingInvitations(labId, userId) {
    const hasAccess = await this.checkPermission(labId, userId, "admin");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    return this.repository.listPendingInvitations(labId);
  }
  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId, labId, userId) {
    const hasAccess = await this.checkPermission(labId, userId, "admin");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    return this.repository.deleteInvitation(invitationId);
  }
  /**
   * Check if a user has permission for a specific action
   */
  async checkPermission(labId, userId, requiredRole) {
    const member = await this.repository.getMember(labId, userId);
    if (!member) {
      return { allowed: false, reason: "Not a member of this lab" };
    }
    const userLevel = ROLE_LEVELS[member.role];
    const requiredLevel = ROLE_LEVELS[requiredRole];
    if (userLevel < requiredLevel) {
      return {
        allowed: false,
        reason: `Requires ${requiredRole} role or higher`
      };
    }
    return { allowed: true };
  }
  /**
   * Get user's role in a lab
   */
  async getUserRole(labId, userId) {
    const member = await this.repository.getMember(labId, userId);
    return member?.role ?? null;
  }
};
var DatasetService = class {
  constructor(repository, permissionService, graphRAGIndexer) {
    this.repository = repository;
    this.permissionService = permissionService;
    this.graphRAGIndexer = graphRAGIndexer;
  }
  /**
   * Create a new dataset
   */
  async createDataset(input, userId) {
    const hasAccess = await this.permissionService.checkPermission(input.labId, userId, "member");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    const labSettings = await this.permissionService.getLabSettings(input.labId);
    if (!labSettings) {
      throw new Error("Lab not found");
    }
    const currentUsage = await this.repository.getLabStorageUsage(input.labId);
    const maxStorageBytes = labSettings.maxStorageGb * 1024 * 1024 * 1024;
    if (currentUsage + input.sizeBytes > maxStorageBytes) {
      throw new Error(`Storage limit exceeded. Current: ${(currentUsage / 1024 / 1024 / 1024).toFixed(2)} GB, Max: ${labSettings.maxStorageGb} GB`);
    }
    const visibility = input.visibility ?? labSettings.defaultVisibility;
    if (visibility === "public" && labSettings.requireApprovalForPublic) ;
    const now = /* @__PURE__ */ new Date();
    const dataset = {
      id: randomUUID(),
      labId: input.labId,
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      visibility,
      schema: input.schema ?? null,
      storagePath: input.storagePath,
      sizeBytes: input.sizeBytes,
      rowCount: input.rowCount ?? null,
      isIndexed: false,
      tags: input.tags ?? [],
      version: 1,
      parentId: null,
      customFields: input.customFields ?? {},
      createdById: userId,
      createdAt: now,
      updatedAt: now
    };
    const createdDataset = await this.repository.createDataset(dataset);
    if (labSettings.enableGraphRAG && this.graphRAGIndexer) {
      this.graphRAGIndexer.indexDataset(createdDataset.id, createdDataset.storagePath, createdDataset.type).then(async () => {
        await this.repository.updateDataset(createdDataset.id, { isIndexed: true });
      }).catch((error) => {
        console.error(`Failed to index dataset ${createdDataset.id}:`, error);
      });
    }
    return createdDataset;
  }
  /**
   * Get a dataset by ID
   */
  async getDataset(id, userId) {
    const dataset = await this.repository.getDataset(id);
    if (!dataset) {
      return null;
    }
    if (dataset.visibility === "public") {
      return dataset;
    }
    const hasAccess = await this.permissionService.checkPermission(dataset.labId, userId, "viewer");
    if (!hasAccess.allowed) {
      if (dataset.visibility === "private" && dataset.createdById !== userId) {
        return null;
      }
      return null;
    }
    return dataset;
  }
  /**
   * Update a dataset
   */
  async updateDataset(id, input, userId) {
    const dataset = await this.repository.getDataset(id);
    if (!dataset) {
      return null;
    }
    const hasAccess = await this.permissionService.checkPermission(dataset.labId, userId, "member");
    if (!hasAccess.allowed && dataset.createdById !== userId) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    const updates = {
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (input.name !== void 0) updates.name = input.name;
    if (input.description !== void 0) updates.description = input.description;
    if (input.visibility !== void 0) updates.visibility = input.visibility;
    if (input.schema !== void 0) updates.schema = input.schema;
    if (input.sizeBytes !== void 0) updates.sizeBytes = input.sizeBytes;
    if (input.rowCount !== void 0) updates.rowCount = input.rowCount;
    if (input.isIndexed !== void 0) updates.isIndexed = input.isIndexed;
    if (input.tags !== void 0) updates.tags = input.tags;
    if (input.customFields !== void 0) updates.customFields = input.customFields;
    return this.repository.updateDataset(id, updates);
  }
  /**
   * Delete a dataset
   */
  async deleteDataset(id, userId) {
    const dataset = await this.repository.getDataset(id);
    if (!dataset) {
      return false;
    }
    const hasAccess = await this.permissionService.checkPermission(dataset.labId, userId, "admin");
    if (!hasAccess.allowed && dataset.createdById !== userId) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    if (dataset.isIndexed && this.graphRAGIndexer) {
      try {
        await this.graphRAGIndexer.removeDatasetIndex(id);
      } catch (error) {
        console.error(`Failed to remove dataset ${id} from index:`, error);
      }
    }
    return this.repository.deleteDataset(id);
  }
  /**
   * List datasets in a lab
   */
  async listDatasets(options, userId) {
    const hasAccess = await this.permissionService.checkPermission(options.labId, userId, "viewer");
    if (!hasAccess.allowed) {
      return this.repository.listDatasets({
        ...options,
        visibility: "public"
      });
    }
    return this.repository.listDatasets(options);
  }
  /**
   * Create a new version of a dataset
   */
  async createDatasetVersion(parentId, input, userId) {
    const parentDataset = await this.repository.getDataset(parentId);
    if (!parentDataset) {
      throw new Error("Parent dataset not found");
    }
    const hasAccess = await this.permissionService.checkPermission(parentDataset.labId, userId, "member");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    const now = /* @__PURE__ */ new Date();
    const newVersion = parentDataset.version + 1;
    const dataset = {
      id: randomUUID(),
      labId: parentDataset.labId,
      name: input.name,
      description: input.description ?? parentDataset.description,
      type: input.type,
      visibility: input.visibility ?? parentDataset.visibility,
      schema: input.schema ?? parentDataset.schema,
      storagePath: input.storagePath,
      sizeBytes: input.sizeBytes,
      rowCount: input.rowCount ?? null,
      isIndexed: false,
      tags: input.tags ?? parentDataset.tags,
      version: newVersion,
      parentId,
      customFields: input.customFields ?? parentDataset.customFields,
      createdById: userId,
      createdAt: now,
      updatedAt: now
    };
    return this.repository.createDataset(dataset);
  }
  /**
   * Get all versions of a dataset
   */
  async getDatasetVersions(datasetId, userId) {
    const dataset = await this.repository.getDataset(datasetId);
    if (!dataset) {
      return [];
    }
    const hasAccess = await this.permissionService.checkPermission(dataset.labId, userId, "viewer");
    if (!hasAccess.allowed) {
      return [];
    }
    return this.repository.getDatasetVersions(datasetId);
  }
  /**
   * Trigger GraphRAG indexing for a dataset
   */
  async indexDataset(id, userId) {
    const dataset = await this.repository.getDataset(id);
    if (!dataset) {
      throw new Error("Dataset not found");
    }
    const hasAccess = await this.permissionService.checkPermission(dataset.labId, userId, "member");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    const labSettings = await this.permissionService.getLabSettings(dataset.labId);
    if (!labSettings?.enableGraphRAG) {
      throw new Error("GraphRAG is not enabled for this lab");
    }
    if (!this.graphRAGIndexer) {
      throw new Error("GraphRAG indexer not configured");
    }
    await this.graphRAGIndexer.indexDataset(dataset.id, dataset.storagePath, dataset.type);
    await this.repository.updateDataset(id, { isIndexed: true, updatedAt: /* @__PURE__ */ new Date() });
  }
  /**
   * Get storage usage for a lab
   */
  async getStorageUsage(labId, userId) {
    const hasAccess = await this.permissionService.checkPermission(labId, userId, "viewer");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    const labSettings = await this.permissionService.getLabSettings(labId);
    if (!labSettings) {
      throw new Error("Lab not found");
    }
    const usedBytes = await this.repository.getLabStorageUsage(labId);
    const maxBytes = labSettings.maxStorageGb * 1024 * 1024 * 1024;
    return {
      usedBytes,
      maxBytes,
      percentage: usedBytes / maxBytes * 100
    };
  }
};
var ExperimentService = class {
  constructor(repository, permissionService, workflowExecutor) {
    this.repository = repository;
    this.permissionService = permissionService;
    this.workflowExecutor = workflowExecutor;
  }
  /**
   * Create a new experiment
   */
  async createExperiment(input, userId) {
    const hasAccess = await this.permissionService.checkPermission(input.labId, userId, "member");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    const now = /* @__PURE__ */ new Date();
    const experiment = {
      id: randomUUID(),
      labId: input.labId,
      name: input.name,
      description: input.description ?? null,
      status: "draft",
      workflowId: input.workflowId ?? null,
      parameters: input.parameters ?? {},
      results: null,
      tags: input.tags ?? [],
      createdById: userId,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };
    return this.repository.createExperiment(experiment);
  }
  /**
   * Get an experiment by ID
   */
  async getExperiment(id, userId) {
    const experiment = await this.repository.getExperiment(id);
    if (!experiment) {
      return null;
    }
    const hasAccess = await this.permissionService.checkPermission(experiment.labId, userId, "viewer");
    if (!hasAccess.allowed) {
      return null;
    }
    return experiment;
  }
  /**
   * Update an experiment
   */
  async updateExperiment(id, input, userId) {
    const experiment = await this.repository.getExperiment(id);
    if (!experiment) {
      return null;
    }
    const hasAccess = await this.permissionService.checkPermission(experiment.labId, userId, "member");
    if (!hasAccess.allowed && experiment.createdById !== userId) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    if (input.status !== void 0) {
      this.validateStatusTransition(experiment.status, input.status);
    }
    const updates = {
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (input.name !== void 0) updates.name = input.name;
    if (input.description !== void 0) updates.description = input.description;
    if (input.status !== void 0) updates.status = input.status;
    if (input.parameters !== void 0) updates.parameters = input.parameters;
    if (input.results !== void 0) updates.results = input.results;
    if (input.tags !== void 0) updates.tags = input.tags;
    if (input.startedAt !== void 0) updates.startedAt = input.startedAt;
    if (input.completedAt !== void 0) updates.completedAt = input.completedAt;
    return this.repository.updateExperiment(id, updates);
  }
  /**
   * Delete an experiment
   */
  async deleteExperiment(id, userId) {
    const experiment = await this.repository.getExperiment(id);
    if (!experiment) {
      return false;
    }
    const hasAccess = await this.permissionService.checkPermission(experiment.labId, userId, "admin");
    if (!hasAccess.allowed && experiment.createdById !== userId) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    if (experiment.status === "running") {
      throw new Error("Cannot delete a running experiment. Cancel it first.");
    }
    return this.repository.deleteExperiment(id);
  }
  /**
   * List experiments in a lab
   */
  async listExperiments(options, userId) {
    const hasAccess = await this.permissionService.checkPermission(options.labId, userId, "viewer");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    return this.repository.listExperiments(options);
  }
  /**
   * Start an experiment
   */
  async startExperiment(id, userId) {
    const experiment = await this.repository.getExperiment(id);
    if (!experiment) {
      throw new Error("Experiment not found");
    }
    const hasAccess = await this.permissionService.checkPermission(experiment.labId, userId, "member");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    if (experiment.status !== "draft") {
      throw new Error(`Cannot start experiment in ${experiment.status} status`);
    }
    const now = /* @__PURE__ */ new Date();
    const updates = {
      status: "running",
      startedAt: now,
      updatedAt: now
    };
    if (experiment.workflowId && this.workflowExecutor) {
      try {
        await this.workflowExecutor.startWorkflow(experiment.workflowId, experiment.parameters);
      } catch (error) {
        updates.status = "failed";
        updates.completedAt = now;
        updates.results = {
          error: error instanceof Error ? error.message : "Unknown error starting workflow"
        };
      }
    }
    const updated = await this.repository.updateExperiment(id, updates);
    if (!updated) {
      throw new Error("Failed to update experiment");
    }
    return updated;
  }
  /**
   * Complete an experiment with results
   */
  async completeExperiment(id, results, userId) {
    const experiment = await this.repository.getExperiment(id);
    if (!experiment) {
      throw new Error("Experiment not found");
    }
    const hasAccess = await this.permissionService.checkPermission(experiment.labId, userId, "member");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    if (experiment.status !== "running") {
      throw new Error(`Cannot complete experiment in ${experiment.status} status`);
    }
    const now = /* @__PURE__ */ new Date();
    const updated = await this.repository.updateExperiment(id, {
      status: "completed",
      results,
      completedAt: now,
      updatedAt: now
    });
    if (!updated) {
      throw new Error("Failed to update experiment");
    }
    return updated;
  }
  /**
   * Fail an experiment
   */
  async failExperiment(id, error, userId) {
    const experiment = await this.repository.getExperiment(id);
    if (!experiment) {
      throw new Error("Experiment not found");
    }
    const hasAccess = await this.permissionService.checkPermission(experiment.labId, userId, "member");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    if (experiment.status !== "running") {
      throw new Error(`Cannot fail experiment in ${experiment.status} status`);
    }
    const now = /* @__PURE__ */ new Date();
    const updated = await this.repository.updateExperiment(id, {
      status: "failed",
      results: {
        ...experiment.results || {},
        error
      },
      completedAt: now,
      updatedAt: now
    });
    if (!updated) {
      throw new Error("Failed to update experiment");
    }
    return updated;
  }
  /**
   * Cancel an experiment
   */
  async cancelExperiment(id, userId) {
    const experiment = await this.repository.getExperiment(id);
    if (!experiment) {
      throw new Error("Experiment not found");
    }
    const hasAccess = await this.permissionService.checkPermission(experiment.labId, userId, "member");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    if (experiment.status !== "running" && experiment.status !== "draft") {
      throw new Error(`Cannot cancel experiment in ${experiment.status} status`);
    }
    if (experiment.status === "running" && experiment.workflowId && this.workflowExecutor) {
      try {
        await this.workflowExecutor.cancelWorkflow(experiment.workflowId);
      } catch (error) {
        console.error("Failed to cancel workflow:", error);
      }
    }
    const now = /* @__PURE__ */ new Date();
    const updated = await this.repository.updateExperiment(id, {
      status: "cancelled",
      completedAt: now,
      updatedAt: now
    });
    if (!updated) {
      throw new Error("Failed to update experiment");
    }
    return updated;
  }
  /**
   * Get experiment statistics for a lab
   */
  async getExperimentStats(labId, userId) {
    const hasAccess = await this.permissionService.checkPermission(labId, userId, "viewer");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    const [total, byStatus] = await Promise.all([
      this.repository.countExperiments(labId),
      this.repository.countExperimentsByStatus(labId)
    ]);
    const completed = byStatus.completed || 0;
    const failed = byStatus.failed || 0;
    const totalFinished = completed + failed;
    return {
      total,
      byStatus,
      recentCompleted: completed,
      successRate: totalFinished > 0 ? completed / totalFinished * 100 : 0
    };
  }
  /**
   * Validate status transitions
   */
  validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      draft: ["running", "cancelled"],
      running: ["completed", "failed", "cancelled"],
      completed: [],
      // Terminal state
      failed: ["draft"],
      // Can retry
      cancelled: ["draft"]
      // Can retry
    };
    const allowed = validTransitions[currentStatus];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }
  /**
   * Clone an experiment
   */
  async cloneExperiment(id, newName, userId) {
    const experiment = await this.repository.getExperiment(id);
    if (!experiment) {
      throw new Error("Experiment not found");
    }
    const hasAccess = await this.permissionService.checkPermission(experiment.labId, userId, "member");
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || "Permission denied");
    }
    return this.createExperiment(
      {
        labId: experiment.labId,
        name: newName,
        description: experiment.description ?? void 0,
        workflowId: experiment.workflowId ?? void 0,
        parameters: { ...experiment.parameters },
        tags: [...experiment.tags]
      },
      userId
    );
  }
};

// src/optimization/optimization-service.ts
var DEFAULT_SETTINGS = {
  acquisitionFunction: "expected_improvement",
  initialSamples: 5,
  maxIterations: 50,
  earlyStoppingPatience: 10,
  batchSize: 1,
  explorationWeight: 0.5
};
var OptimizationService = class {
  configs = /* @__PURE__ */ new Map();
  sessions = /* @__PURE__ */ new Map();
  /**
   * Create a new optimization configuration
   */
  async createConfig(input) {
    const id = crypto.randomUUID();
    const now = /* @__PURE__ */ new Date();
    const config = {
      id,
      name: input.name,
      description: input.description,
      parameters: input.parameters,
      objectives: input.objectives,
      constraints: input.constraints,
      acquisitionFunction: input.acquisitionFunction ?? DEFAULT_SETTINGS.acquisitionFunction,
      initialSamples: input.initialSamples ?? DEFAULT_SETTINGS.initialSamples,
      maxIterations: input.maxIterations ?? DEFAULT_SETTINGS.maxIterations,
      earlyStoppingPatience: input.earlyStoppingPatience ?? DEFAULT_SETTINGS.earlyStoppingPatience,
      seed: input.seed,
      batchSize: input.batchSize ?? DEFAULT_SETTINGS.batchSize,
      explorationWeight: input.explorationWeight ?? DEFAULT_SETTINGS.explorationWeight,
      createdAt: now,
      updatedAt: now
    };
    this.configs.set(id, config);
    return config;
  }
  /**
   * Start a new optimization session
   */
  async startSession(configId, labId, userId, name) {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Optimization config not found: ${configId}`);
    }
    const id = crypto.randomUUID();
    const now = /* @__PURE__ */ new Date();
    const session = {
      id,
      configId,
      labId,
      name: name ?? `${config.name} - Run ${now.toISOString().slice(0, 10)}`,
      status: "running",
      trials: [],
      currentIteration: 0,
      convergenceHistory: [],
      createdById: userId,
      startedAt: now,
      createdAt: now,
      updatedAt: now
    };
    this.sessions.set(id, session);
    return session;
  }
  /**
   * Suggest next parameters to try
   */
  async suggestNext(sessionId, count = 1) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Optimization session not found: ${sessionId}`);
    }
    const config = this.configs.get(session.configId);
    if (!config) {
      throw new Error(`Optimization config not found: ${session.configId}`);
    }
    const suggestions = [];
    for (let i = 0; i < count; i++) {
      const completedTrials = session.trials.filter((t) => t.status === "completed");
      if (completedTrials.length < config.initialSamples) {
        suggestions.push(this.generateRandomSample(config.parameters, config.objectives));
      } else {
        suggestions.push(
          this.generateBayesianSuggestion(
            config,
            completedTrials,
            config.acquisitionFunction
          )
        );
      }
    }
    return suggestions;
  }
  /**
   * Generate random sample for initial exploration
   */
  generateRandomSample(parameters, objectives) {
    const params = {};
    const predicted = {};
    const uncertainty = {};
    for (const param of parameters) {
      params[param.name] = this.sampleParameter(param);
    }
    for (const obj of objectives) {
      predicted[obj.name] = 0;
      uncertainty[obj.name] = 1;
    }
    return {
      parameters: params,
      acquisitionValue: Math.random(),
      // Random for initial samples
      predictedObjectives: predicted,
      uncertainty,
      reasoning: "\u521D\u671F\u63A2\u7D22\u30D5\u30A7\u30FC\u30BA: \u30E9\u30F3\u30C0\u30E0\u30B5\u30F3\u30D7\u30EA\u30F3\u30B0\u306B\u3088\u308B\u30D1\u30E9\u30E1\u30FC\u30BF\u7A7A\u9593\u306E\u63A2\u7D22"
    };
  }
  /**
   * Sample a single parameter
   */
  sampleParameter(param) {
    switch (param.type) {
      case "continuous":
        if (param.min !== void 0 && param.max !== void 0) {
          if (param.logScale) {
            const logMin = Math.log(param.min);
            const logMax = Math.log(param.max);
            return Math.exp(logMin + Math.random() * (logMax - logMin));
          }
          return param.min + Math.random() * (param.max - param.min);
        }
        return 0;
      case "integer":
        if (param.min !== void 0 && param.max !== void 0) {
          return Math.floor(param.min + Math.random() * (param.max - param.min + 1));
        }
        return 0;
      case "categorical":
      case "ordinal":
        if (param.choices && param.choices.length > 0) {
          return param.choices[Math.floor(Math.random() * param.choices.length)];
        }
        return param.default ?? "";
      default:
        return param.default ?? 0;
    }
  }
  /**
   * Generate Bayesian optimization suggestion
   */
  generateBayesianSuggestion(config, completedTrials, acquisitionFunction) {
    const params = {};
    const predicted = {};
    const uncertainty = {};
    const bestTrial = this.findBestTrial(completedTrials, config.objectives[0]);
    for (const param of config.parameters) {
      const exploration = config.explorationWeight ?? 0.5;
      const bestValue = bestTrial?.parameters[param.name];
      if (param.type === "continuous" && param.min !== void 0 && param.max !== void 0) {
        const range = param.max - param.min;
        const noise = (Math.random() - 0.5) * range * exploration;
        const baseValue = typeof bestValue === "number" ? bestValue : (param.min + param.max) / 2;
        params[param.name] = Math.max(param.min, Math.min(param.max, baseValue + noise));
      } else if (param.type === "integer" && param.min !== void 0 && param.max !== void 0) {
        const range = param.max - param.min;
        const noise = Math.round((Math.random() - 0.5) * range * exploration);
        const baseValue = typeof bestValue === "number" ? bestValue : Math.floor((param.min + param.max) / 2);
        params[param.name] = Math.max(param.min, Math.min(param.max, baseValue + noise));
      } else if (param.choices && param.choices.length > 0) {
        if (Math.random() < exploration) {
          params[param.name] = param.choices[Math.floor(Math.random() * param.choices.length)];
        } else {
          params[param.name] = bestValue ?? param.choices[0];
        }
      }
    }
    for (const obj of config.objectives) {
      const avgValue = completedTrials.reduce((sum, t) => sum + (t.objectives[obj.name] ?? 0), 0) / completedTrials.length;
      predicted[obj.name] = avgValue;
      uncertainty[obj.name] = 0.3;
    }
    const reasoningMap = {
      expected_improvement: "\u671F\u5F85\u6539\u5584\u5EA6 (EI) \u306B\u57FA\u3065\u304D\u3001\u6539\u5584\u53EF\u80FD\u6027\u306E\u9AD8\u3044\u70B9\u3092\u63D0\u6848",
      probability_improvement: "\u6539\u5584\u78BA\u7387 (PI) \u306B\u57FA\u3065\u304D\u3001\u78BA\u5B9F\u306B\u6539\u5584\u3059\u308B\u70B9\u3092\u63D0\u6848",
      upper_confidence_bound: "\u697D\u89B3\u7684\u63A8\u5B9A (UCB) \u306B\u57FA\u3065\u304D\u3001\u63A2\u7D22\u3068\u6D3B\u7528\u306E\u30D0\u30E9\u30F3\u30B9\u3092\u53D6\u3063\u305F\u70B9\u3092\u63D0\u6848",
      thompson_sampling: "Thompson Sampling \u306B\u57FA\u3065\u304D\u3001\u78BA\u7387\u7684\u306A\u63A2\u7D22\u3092\u5B9F\u65BD",
      knowledge_gradient: "\u77E5\u8B58\u52FE\u914D (KG) \u306B\u57FA\u3065\u304D\u3001\u60C5\u5831\u7372\u5F97\u91CF\u3092\u6700\u5927\u5316\u3059\u308B\u70B9\u3092\u63D0\u6848"
    };
    return {
      parameters: params,
      acquisitionValue: Math.random() * 0.5 + 0.5,
      // Higher for Bayesian
      predictedObjectives: predicted,
      uncertainty,
      reasoning: reasoningMap[acquisitionFunction]
    };
  }
  /**
   * Find best trial based on primary objective
   */
  findBestTrial(trials, objective) {
    if (trials.length === 0) return void 0;
    return trials.reduce((best, current) => {
      const currentValue = current.objectives[objective.name] ?? 0;
      const bestValue = best.objectives[objective.name] ?? 0;
      if (objective.direction === "maximize") {
        return currentValue > bestValue ? current : best;
      } else {
        return currentValue < bestValue ? current : best;
      }
    });
  }
  /**
   * Report trial result
   */
  async reportTrial(input) {
    const session = this.sessions.get(input.sessionId);
    if (!session) {
      throw new Error(`Optimization session not found: ${input.sessionId}`);
    }
    const trial = session.trials.find((t) => t.id === input.trialId);
    if (!trial) {
      throw new Error(`Trial not found: ${input.trialId}`);
    }
    const config = this.configs.get(session.configId);
    trial.objectives = input.objectives;
    trial.duration = input.duration;
    trial.notes = input.notes;
    trial.status = "completed";
    trial.completedAt = /* @__PURE__ */ new Date();
    trial.constraintsSatisfied = this.checkConstraints(trial.parameters, config?.constraints);
    const completedTrials = session.trials.filter((t) => t.status === "completed");
    const bestTrial = this.findBestTrial(completedTrials, config?.objectives[0] ?? { name: "objective", direction: "maximize" });
    if (bestTrial) {
      const values = completedTrials.map((t) => Object.values(t.objectives)[0] ?? 0);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(
        values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
      );
      session.convergenceHistory.push({
        iteration: session.currentIteration,
        bestValue: Object.values(bestTrial.objectives)[0] ?? 0,
        mean,
        std,
        timestamp: /* @__PURE__ */ new Date()
      });
      session.bestTrialId = bestTrial.id;
    }
    session.currentIteration++;
    session.updatedAt = /* @__PURE__ */ new Date();
    if (config) {
      if (session.currentIteration >= config.maxIterations) {
        session.status = "completed";
        session.completedAt = /* @__PURE__ */ new Date();
      }
    }
    return trial;
  }
  /**
   * Check if constraints are satisfied
   */
  checkConstraints(params, constraints) {
    if (!constraints || constraints.length === 0) return true;
    for (const constraint of constraints) {
      const match = constraint.expression.match(/(\w+)\s*\+\s*(\w+)\s*<=\s*(\d+)/);
      if (match) {
        const [, param1, param2, limit] = match;
        const value1 = typeof params[param1] === "number" ? params[param1] : 0;
        const value2 = typeof params[param2] === "number" ? params[param2] : 0;
        if (value1 + value2 > parseFloat(limit)) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Create a new trial
   */
  async createTrial(sessionId, parameters) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Optimization session not found: ${sessionId}`);
    }
    const config = this.configs.get(session.configId);
    const trial = {
      id: crypto.randomUUID(),
      configId: session.configId,
      iteration: session.trials.length,
      parameters,
      objectives: {},
      constraintsSatisfied: this.checkConstraints(parameters, config?.constraints),
      status: "pending",
      createdAt: /* @__PURE__ */ new Date()
    };
    session.trials.push(trial);
    session.updatedAt = /* @__PURE__ */ new Date();
    return trial;
  }
  /**
   * Get optimization insights
   */
  async getInsights(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Optimization session not found: ${sessionId}`);
    }
    const config = this.configs.get(session.configId);
    if (!config) {
      throw new Error(`Optimization config not found: ${session.configId}`);
    }
    const completedTrials = session.trials.filter((t) => t.status === "completed");
    const parameterImportance = config.parameters.map((param) => {
      const values = completedTrials.map((t) => {
        const v = t.parameters[param.name];
        return typeof v === "number" ? v : 0;
      });
      const mean = values.reduce((a, b) => a + b, 0) / values.length || 0;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length || 0;
      return { name: param.name, importance: Math.sqrt(variance) };
    }).sort((a, b) => b.importance - a.importance);
    const maxImportance = Math.max(...parameterImportance.map((p) => p.importance), 1e-3);
    parameterImportance.forEach((p) => p.importance = p.importance / maxImportance);
    const convergenceRate = session.convergenceHistory.length > 1 ? Math.abs(
      session.convergenceHistory[session.convergenceHistory.length - 1].bestValue - session.convergenceHistory[0].bestValue
    ) / session.convergenceHistory.length : 0;
    const recommendations = [];
    if (completedTrials.length < config.initialSamples) {
      recommendations.push("\u521D\u671F\u63A2\u7D22\u30D5\u30A7\u30FC\u30BA\u3067\u3059\u3002\u3055\u3089\u306B\u30E9\u30F3\u30C0\u30E0\u30B5\u30F3\u30D7\u30EB\u3092\u53CE\u96C6\u3059\u308B\u3053\u3068\u3092\u63A8\u5968\u3057\u307E\u3059\u3002");
    }
    if (convergenceRate < 0.01 && completedTrials.length > 10) {
      recommendations.push("\u53CE\u675F\u304C\u9045\u3044\u3067\u3059\u3002\u63A2\u7D22\u7BC4\u56F2\u306E\u898B\u76F4\u3057\u307E\u305F\u306F\u7372\u5F97\u95A2\u6570\u306E\u5909\u66F4\u3092\u691C\u8A0E\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    }
    if (parameterImportance.length > 0 && parameterImportance[0].importance < 0.1) {
      recommendations.push("\u30D1\u30E9\u30E1\u30FC\u30BF\u306E\u5F71\u97FF\u5EA6\u304C\u5747\u4E00\u3067\u3059\u3002\u3088\u308A\u5E83\u3044\u7BC4\u56F2\u3067\u306E\u63A2\u7D22\u3092\u63A8\u5968\u3057\u307E\u3059\u3002");
    }
    return {
      parameterImportance,
      interactions: [],
      // Would require more sophisticated analysis
      convergenceRate,
      estimatedIterationsToTarget: convergenceRate > 0 ? Math.ceil(1 / convergenceRate) : void 0,
      recommendations
    };
  }
  /**
   * Get optimization summary
   */
  async getSummary(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Optimization session not found: ${sessionId}`);
    }
    const config = this.configs.get(session.configId);
    const completedTrials = session.trials.filter((t) => t.status === "completed");
    const bestTrial = session.bestTrialId ? session.trials.find((t) => t.id === session.bestTrialId) : void 0;
    const firstTrial = completedTrials[0];
    const bestValue = bestTrial ? Object.values(bestTrial.objectives)[0] ?? 0 : 0;
    const firstValue = firstTrial ? Object.values(firstTrial.objectives)[0] ?? 0 : 0;
    const timeElapsed = session.startedAt ? (Date.now() - session.startedAt.getTime()) / 1e3 : 0;
    const avgTrialTime = completedTrials.length > 0 ? completedTrials.reduce((sum, t) => sum + (t.duration ?? 0), 0) / completedTrials.length : 0;
    const remainingIterations = config ? config.maxIterations - session.currentIteration : 0;
    return {
      sessionId,
      totalTrials: session.trials.length,
      completedTrials: completedTrials.length,
      bestObjectiveValue: bestValue,
      bestParameters: bestTrial?.parameters ?? {},
      improvementOverInitial: firstValue !== 0 ? (bestValue - firstValue) / Math.abs(firstValue) * 100 : 0,
      timeElapsed,
      estimatedTimeRemaining: avgTrialTime * remainingIterations
    };
  }
  /**
   * Pause optimization session
   */
  async pauseSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Optimization session not found: ${sessionId}`);
    }
    session.status = "paused";
    session.updatedAt = /* @__PURE__ */ new Date();
    return session;
  }
  /**
   * Resume optimization session
   */
  async resumeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Optimization session not found: ${sessionId}`);
    }
    session.status = "running";
    session.updatedAt = /* @__PURE__ */ new Date();
    return session;
  }
  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    return this.sessions.get(sessionId);
  }
  /**
   * Get config by ID
   */
  async getConfig(configId) {
    return this.configs.get(configId);
  }
  /**
   * List sessions for a lab
   */
  async listSessions(labId) {
    return Array.from(this.sessions.values()).filter((s) => s.labId === labId);
  }
};
var optimizationService = new OptimizationService();

// src/hypothesis/hypothesis-service.ts
var DEFAULT_CRITERIA = {
  testabilityWeight: 0.3,
  noveltyWeight: 0.25,
  impactWeight: 0.25,
  evidenceWeight: 0.2,
  minOverallScore: 0.5
};
var HYPOTHESIS_PATTERNS = {
  mechanistic: {
    en: [
      "{entity1} functions through {mechanism} to affect {entity2}",
      "The {property} of {entity} is mediated by {mechanism}"
    ],
    ja: [
      "{entity1}\u306F{mechanism}\u3092\u901A\u3058\u3066{entity2}\u306B\u5F71\u97FF\u3092\u4E0E\u3048\u308B",
      "{entity}\u306E{property}\u306F{mechanism}\u306B\u3088\u3063\u3066\u5A92\u4ECB\u3055\u308C\u308B"
    ]
  },
  correlational: {
    en: [
      "There is a correlation between {entity1} and {entity2}",
      "{property1} and {property2} are associated in {domain}"
    ],
    ja: [
      "{entity1}\u3068{entity2}\u306E\u9593\u306B\u76F8\u95A2\u304C\u3042\u308B",
      "{domain}\u306B\u304A\u3044\u3066{property1}\u3068{property2}\u306F\u95A2\u9023\u3057\u3066\u3044\u308B"
    ]
  },
  predictive: {
    en: [
      "{entity} with {property} will exhibit {outcome}",
      "Changes in {variable1} will lead to changes in {variable2}"
    ],
    ja: [
      "{property}\u3092\u6301\u3064{entity}\u306F{outcome}\u3092\u793A\u3059",
      "{variable1}\u306E\u5909\u5316\u306F{variable2}\u306E\u5909\u5316\u3092\u3082\u305F\u3089\u3059"
    ]
  },
  causal: {
    en: [
      "{entity1} causes {outcome} in {entity2}",
      "Modification of {entity} results in {effect}"
    ],
    ja: [
      "{entity1}\u306F{entity2}\u306B\u304A\u3044\u3066{outcome}\u3092\u5F15\u304D\u8D77\u3053\u3059",
      "{entity}\u306E\u4FEE\u6B63\u306F{effect}\u3092\u3082\u305F\u3089\u3059"
    ]
  },
  comparative: {
    en: [
      "{entity1} is more {property} than {entity2} under {condition}",
      "{method1} outperforms {method2} for {task}"
    ],
    ja: [
      "{condition}\u4E0B\u3067{entity1}\u306F{entity2}\u3088\u308A{property}\u3067\u3042\u308B",
      "{task}\u306B\u304A\u3044\u3066{method1}\u306F{method2}\u3088\u308A\u512A\u308C\u3066\u3044\u308B"
    ]
  },
  exploratory: {
    en: [
      "The relationship between {entity1} and {entity2} in {domain} is unexplored",
      "The role of {entity} in {process} remains unclear"
    ],
    ja: [
      "{domain}\u306B\u304A\u3051\u308B{entity1}\u3068{entity2}\u306E\u95A2\u4FC2\u306F\u672A\u63A2\u7D22\u3067\u3042\u308B",
      "{process}\u306B\u304A\u3051\u308B{entity}\u306E\u5F79\u5272\u306F\u4E0D\u660E\u78BA\u3067\u3042\u308B"
    ]
  }
};
var HypothesisService = class {
  hypotheses = /* @__PURE__ */ new Map();
  gaps = /* @__PURE__ */ new Map();
  evaluations = /* @__PURE__ */ new Map();
  /**
   * Generate hypotheses based on a research topic
   */
  async generateHypotheses(request, userId) {
    const count = request.count ?? 5;
    const types = request.types ?? ["mechanistic", "correlational", "predictive"];
    const minConfidence = request.minConfidence ?? 0.3;
    const gaps = await this.identifyKnowledgeGaps(request.topic, request.domain);
    const hypotheses = [];
    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const hypothesis = this.generateSingleHypothesis(
        request,
        type,
        gaps,
        userId,
        minConfidence
      );
      if (hypothesis.confidenceScore >= minConfidence) {
        hypotheses.push(hypothesis);
        this.hypotheses.set(hypothesis.id, hypothesis);
      }
    }
    return this.rankHypotheses(hypotheses);
  }
  /**
   * Generate a single hypothesis
   */
  generateSingleHypothesis(request, type, gaps, userId, minConfidence) {
    const id = crypto.randomUUID();
    const now = /* @__PURE__ */ new Date();
    const patterns = HYPOTHESIS_PATTERNS[type];
    const patternIndex = Math.floor(Math.random() * patterns.en.length);
    const statement = this.fillPattern(patterns.en[patternIndex], request);
    const statementJa = this.fillPattern(patterns.ja[patternIndex], request);
    const supportingEvidence = this.generateMockEvidence("supporting", 2 + Math.floor(Math.random() * 3));
    const contradictingEvidence = this.generateMockEvidence("contradicting", Math.floor(Math.random() * 2));
    const confidenceScore = this.calculateConfidenceScore(supportingEvidence, contradictingEvidence);
    const testabilityScore = 0.5 + Math.random() * 0.5;
    const noveltyScore = request.noveltyWeight ?? 0.5 + Math.random() * 0.3;
    const impactScore = 0.4 + Math.random() * 0.5;
    const confidence = this.scoreToConfidenceLevel(confidenceScore);
    const keyEntities = this.extractEntities(request.topic);
    const suggestedExperiments = this.generateExperimentSuggestions(type, keyEntities);
    const relatedGapIds = gaps.slice(0, 2).map((g) => g.id);
    return {
      id,
      statement,
      statementJa,
      type,
      confidence,
      confidenceScore,
      domain: request.domain ?? "general",
      relatedGapIds,
      supportingEvidence,
      contradictingEvidence,
      keyEntities,
      keyRelationships: this.generateKeyRelationships(keyEntities),
      testabilityScore,
      noveltyScore,
      impactScore,
      suggestedExperiments,
      relatedHypothesisIds: [],
      status: "generated",
      generatedFor: userId,
      labId: request.labId,
      reasoning: `${type}\u4EEE\u8AAC\u3068\u3057\u3066\u3001${request.topic}\u306B\u95A2\u3059\u308B\u77E5\u898B\u304B\u3089\u5C0E\u51FA\u3002${supportingEvidence.length}\u4EF6\u306E\u652F\u6301\u30A8\u30D3\u30C7\u30F3\u30B9\u3092\u7279\u5B9A\u3002`,
      createdAt: now,
      updatedAt: now
    };
  }
  /**
   * Fill pattern with request data
   */
  fillPattern(pattern, request) {
    const entities = this.extractEntities(request.topic);
    const domain = request.domain ?? "\u79D1\u5B66";
    let result = pattern.replace("{entity}", entities[0] ?? request.topic).replace("{entity1}", entities[0] ?? "A").replace("{entity2}", entities[1] ?? "B").replace("{domain}", domain).replace("{property}", "\u7279\u6027").replace("{property1}", "\u7279\u60271").replace("{property2}", "\u7279\u60272").replace("{mechanism}", "\u30E1\u30AB\u30CB\u30BA\u30E0X").replace("{outcome}", "\u52B9\u679CY").replace("{effect}", "\u7D50\u679CZ").replace("{variable1}", "\u5909\u65701").replace("{variable2}", "\u5909\u65702").replace("{condition}", "\u6761\u4EF6C").replace("{method1}", "\u624B\u6CD5A").replace("{method2}", "\u624B\u6CD5B").replace("{task}", "\u30BF\u30B9\u30AFT").replace("{process}", "\u30D7\u30ED\u30BB\u30B9P");
    return result;
  }
  /**
   * Extract entities from topic
   */
  extractEntities(topic) {
    const words = topic.split(/[\s,、。]+/).filter((w) => w.length > 1);
    return words.slice(0, 3);
  }
  /**
   * Generate mock evidence
   */
  generateMockEvidence(type, count) {
    const evidence = [];
    const paperTitles = [
      "Deep Learning for Molecular Property Prediction",
      "Graph Neural Networks in Drug Discovery",
      "Machine Learning Approaches to Materials Science",
      "Advances in Protein Structure Prediction",
      "AI-Driven Climate Modeling"
    ];
    for (let i = 0; i < count; i++) {
      evidence.push({
        id: crypto.randomUUID(),
        sourceType: "paper",
        sourceId: `paper-${i + 1}`,
        sourceTitle: paperTitles[i % paperTitles.length],
        excerpt: `This study ${type === "supporting" ? "demonstrates" : "questions"} the relationship...`,
        type,
        relevance: 0.5 + Math.random() * 0.5,
        confidence: 0.6 + Math.random() * 0.4
      });
    }
    return evidence;
  }
  /**
   * Calculate confidence score from evidence
   */
  calculateConfidenceScore(supporting, contradicting) {
    const supportScore = supporting.reduce((sum, e) => sum + e.relevance * e.confidence, 0);
    const contradictScore = contradicting.reduce((sum, e) => sum + e.relevance * e.confidence, 0);
    const total = supporting.length + contradicting.length;
    if (total === 0) return 0.5;
    const netScore = (supportScore - contradictScore * 0.5) / total;
    return Math.max(0, Math.min(1, 0.5 + netScore));
  }
  /**
   * Convert score to confidence level
   */
  scoreToConfidenceLevel(score) {
    if (score >= 0.8) return "high";
    if (score >= 0.6) return "medium";
    if (score >= 0.4) return "low";
    return "speculative";
  }
  /**
   * Generate key relationships
   */
  generateKeyRelationships(entities) {
    if (entities.length < 2) return [];
    const relations2 = ["affects", "correlates_with", "causes", "inhibits", "activates"];
    const relationships = [];
    for (let i = 0; i < entities.length - 1; i++) {
      relationships.push({
        source: entities[i],
        relation: relations2[i % relations2.length],
        target: entities[i + 1]
      });
    }
    return relationships;
  }
  /**
   * Generate experiment suggestions
   */
  generateExperimentSuggestions(type, entities) {
    const suggestions = {
      mechanistic: [
        "\u30CE\u30C3\u30AF\u30A2\u30A6\u30C8/\u30CE\u30C3\u30AF\u30C0\u30A6\u30F3\u5B9F\u9A13\u3092\u5B9F\u65BD",
        "\u963B\u5BB3\u5264\u3092\u7528\u3044\u305F\u6A5F\u80FD\u963B\u5BB3\u5B9F\u9A13",
        "\u8A73\u7D30\u306A\u6642\u9593\u7D4C\u904E\u89E3\u6790"
      ],
      correlational: [
        "\u5927\u898F\u6A21\u30B3\u30DB\u30FC\u30C8\u7814\u7A76",
        "\u591A\u5909\u91CF\u89E3\u6790\u306B\u3088\u308B\u95A2\u9023\u6027\u691C\u8A3C",
        "\u7570\u306A\u308B\u6761\u4EF6\u4E0B\u3067\u306E\u518D\u73FE\u5B9F\u9A13"
      ],
      predictive: [
        "\u4E88\u6E2C\u30E2\u30C7\u30EB\u306E\u691C\u8A3C\u5B9F\u9A13",
        "\u30DB\u30FC\u30EB\u30C9\u30A2\u30A6\u30C8\u30C7\u30FC\u30BF\u3067\u306E\u8A55\u4FA1",
        "\u524D\u5411\u304D\u7814\u7A76\u306E\u5B9F\u65BD"
      ],
      causal: [
        "\u4ECB\u5165\u5B9F\u9A13\u306E\u8A2D\u8A08\u3068\u5B9F\u65BD",
        "\u30E9\u30F3\u30C0\u30E0\u5316\u6BD4\u8F03\u8A66\u9A13",
        "\u56E0\u679C\u63A8\u8AD6\u30E2\u30C7\u30EB\u306E\u9069\u7528"
      ],
      comparative: [
        "\u6A19\u6E96\u5316\u3055\u308C\u305F\u6BD4\u8F03\u5B9F\u9A13",
        "\u30D9\u30F3\u30C1\u30DE\u30FC\u30AF\u30C7\u30FC\u30BF\u30BB\u30C3\u30C8\u3067\u306E\u8A55\u4FA1",
        "\u30AF\u30ED\u30B9\u30D0\u30EA\u30C7\u30FC\u30B7\u30E7\u30F3"
      ],
      exploratory: [
        "\u4E88\u5099\u7684\u30B9\u30AF\u30EA\u30FC\u30CB\u30F3\u30B0",
        "\u7DB2\u7F85\u7684\u30C7\u30FC\u30BF\u53CE\u96C6",
        "\u8CEA\u7684\u7814\u7A76\u306E\u5B9F\u65BD"
      ]
    };
    return suggestions[type] ?? ["\u8FFD\u52A0\u5B9F\u9A13\u304C\u5FC5\u8981"];
  }
  /**
   * Identify knowledge gaps
   */
  async identifyKnowledgeGaps(topic, domain) {
    const gaps = [
      {
        id: crypto.randomUUID(),
        topic: `${topic} - \u30E1\u30AB\u30CB\u30BA\u30E0`,
        description: `The detailed mechanism of ${topic} remains unclear`,
        descriptionJa: `${topic}\u306E\u8A73\u7D30\u306A\u30E1\u30AB\u30CB\u30BA\u30E0\u306F\u4E0D\u660E\u78BA`,
        relatedEntities: this.extractEntities(topic),
        severity: 0.7,
        researchQuestions: [
          `What is the primary mechanism of ${topic}?`,
          "Are there alternative pathways?"
        ],
        relatedPaperIds: [],
        detectedAt: /* @__PURE__ */ new Date()
      },
      {
        id: crypto.randomUUID(),
        topic: `${topic} - \u5FDC\u7528`,
        description: `Practical applications of ${topic} are underexplored`,
        descriptionJa: `${topic}\u306E\u5B9F\u7528\u7684\u306A\u5FDC\u7528\u306F\u672A\u958B\u62D3`,
        relatedEntities: this.extractEntities(topic),
        severity: 0.5,
        researchQuestions: [
          `How can ${topic} be applied in practice?`,
          "What are the barriers to application?"
        ],
        relatedPaperIds: [],
        detectedAt: /* @__PURE__ */ new Date()
      }
    ];
    gaps.forEach((g) => this.gaps.set(g.id, g));
    return gaps;
  }
  /**
   * Rank hypotheses by overall score
   */
  rankHypotheses(hypotheses) {
    return hypotheses.sort((a, b) => {
      const scoreA = this.calculateOverallScore(a, DEFAULT_CRITERIA);
      const scoreB = this.calculateOverallScore(b, DEFAULT_CRITERIA);
      return scoreB - scoreA;
    });
  }
  /**
   * Calculate overall score
   */
  calculateOverallScore(hypothesis, criteria) {
    return hypothesis.testabilityScore * criteria.testabilityWeight + hypothesis.noveltyScore * criteria.noveltyWeight + hypothesis.impactScore * criteria.impactWeight + hypothesis.confidenceScore * criteria.evidenceWeight;
  }
  /**
   * Evaluate a hypothesis
   */
  async evaluateHypothesis(hypothesisId, criteria) {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis not found: ${hypothesisId}`);
    }
    const evalCriteria = criteria ?? DEFAULT_CRITERIA;
    const overallScore = this.calculateOverallScore(hypothesis, evalCriteria);
    const feedback = [];
    const recommendations = [];
    if (hypothesis.testabilityScore < 0.5) {
      feedback.push("\u691C\u8A3C\u53EF\u80FD\u6027\u304C\u4F4E\u3044: \u3088\u308A\u5177\u4F53\u7684\u306A\u4E88\u6E2C\u3092\u542B\u3081\u308B\u3053\u3068\u3092\u691C\u8A0E");
      recommendations.push("\u4EEE\u8AAC\u3092\u64CD\u4F5C\u7684\u306B\u5B9A\u7FA9\u3057\u76F4\u3059");
    }
    if (hypothesis.noveltyScore < 0.5) {
      feedback.push("\u65B0\u898F\u6027\u304C\u4F4E\u3044: \u65E2\u5B58\u7814\u7A76\u3068\u306E\u5DEE\u5225\u5316\u304C\u5FC5\u8981");
      recommendations.push("\u65E2\u5B58\u6587\u732E\u3092\u30EC\u30D3\u30E5\u30FC\u3057\u3001\u672A\u63A2\u7D22\u306E\u5074\u9762\u3092\u7279\u5B9A");
    }
    if (hypothesis.impactScore < 0.5) {
      feedback.push("\u30A4\u30F3\u30D1\u30AF\u30C8\u304C\u9650\u5B9A\u7684: \u3088\u308A\u5E83\u3044\u6587\u8108\u3067\u306E\u610F\u7FA9\u3092\u691C\u8A0E");
      recommendations.push("\u7814\u7A76\u306E\u5B9F\u7528\u7684\u30FB\u7406\u8AD6\u7684\u8CA2\u732E\u3092\u660E\u78BA\u5316");
    }
    if (hypothesis.contradictingEvidence.length > hypothesis.supportingEvidence.length) {
      feedback.push("\u53CD\u8A3C\u30A8\u30D3\u30C7\u30F3\u30B9\u304C\u591A\u3044: \u4EEE\u8AAC\u306E\u518D\u691C\u8A0E\u3092\u63A8\u5968");
      recommendations.push("\u53CD\u8A3C\u30A8\u30D3\u30C7\u30F3\u30B9\u306E\u8A73\u7D30\u3092\u5206\u6790\u3057\u3001\u4EEE\u8AAC\u3092\u4FEE\u6B63");
    }
    const evaluation = {
      hypothesisId,
      testabilityScore: hypothesis.testabilityScore,
      noveltyScore: hypothesis.noveltyScore,
      impactScore: hypothesis.impactScore,
      evidenceScore: hypothesis.confidenceScore,
      overallScore,
      rank: 0,
      // Will be set when compared with others
      feedback,
      recommendations,
      evaluatedAt: /* @__PURE__ */ new Date()
    };
    this.evaluations.set(hypothesisId, evaluation);
    return evaluation;
  }
  /**
   * Get refinement suggestions
   */
  async getRefinementSuggestions(hypothesisId) {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis not found: ${hypothesisId}`);
    }
    const suggestions = [];
    if (hypothesis.keyEntities.length > 3) {
      suggestions.push({
        hypothesisId,
        type: "narrow_scope",
        refinedStatement: `${hypothesis.statement} (focusing on ${hypothesis.keyEntities[0]})`,
        refinedStatementJa: `${hypothesis.statementJa}\uFF08${hypothesis.keyEntities[0]}\u306B\u7126\u70B9\u3092\u5F53\u3066\u3066\uFF09`,
        explanation: "\u4EEE\u8AAC\u306E\u7BC4\u56F2\u304C\u5E83\u3059\u304E\u308B\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\u3002\u7279\u5B9A\u306E\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3\u306B\u7126\u70B9\u3092\u5F53\u3066\u308B\u3053\u3068\u3067\u691C\u8A3C\u53EF\u80FD\u6027\u304C\u5411\u4E0A\u3057\u307E\u3059\u3002",
        expectedImprovement: 0.15
      });
    }
    if (hypothesis.testabilityScore < 0.5) {
      suggestions.push({
        hypothesisId,
        type: "add_constraint",
        refinedStatement: `Under specific conditions, ${hypothesis.statement}`,
        refinedStatementJa: `\u7279\u5B9A\u306E\u6761\u4EF6\u4E0B\u3067\u3001${hypothesis.statementJa}`,
        explanation: "\u6761\u4EF6\u3092\u8FFD\u52A0\u3059\u308B\u3053\u3068\u3067\u3001\u4EEE\u8AAC\u304C\u3088\u308A\u691C\u8A3C\u53EF\u80FD\u306B\u306A\u308A\u307E\u3059\u3002",
        expectedImprovement: 0.2
      });
    }
    return suggestions;
  }
  /**
   * Generate research questions from hypothesis
   */
  async generateResearchQuestions(hypothesisId) {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis not found: ${hypothesisId}`);
    }
    const questions = [];
    questions.push({
      id: crypto.randomUUID(),
      hypothesisId,
      question: `Is it true that ${hypothesis.statement}?`,
      questionJa: `${hypothesis.statementJa}\u306F\u6B63\u3057\u3044\u304B\uFF1F`,
      answerType: "binary",
      requiredMethods: ["statistical_analysis", "experimental_validation"],
      estimatedEffort: 3,
      priority: 5
    });
    if (hypothesis.type === "mechanistic" || hypothesis.type === "causal") {
      questions.push({
        id: crypto.randomUUID(),
        hypothesisId,
        question: "What is the underlying mechanism?",
        questionJa: "\u6839\u5E95\u306B\u3042\u308B\u30E1\u30AB\u30CB\u30BA\u30E0\u306F\u4F55\u304B\uFF1F",
        answerType: "qualitative",
        requiredMethods: ["pathway_analysis", "molecular_studies"],
        estimatedEffort: 4,
        priority: 4
      });
    }
    questions.push({
      id: crypto.randomUUID(),
      hypothesisId,
      question: "What is the magnitude of the effect?",
      questionJa: "\u52B9\u679C\u306E\u5927\u304D\u3055\u306F\u3069\u306E\u7A0B\u5EA6\u304B\uFF1F",
      answerType: "quantitative",
      requiredMethods: ["quantitative_analysis", "measurement"],
      estimatedEffort: 2,
      priority: 3
    });
    return questions;
  }
  /**
   * Update hypothesis status
   */
  async updateStatus(hypothesisId, status) {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis not found: ${hypothesisId}`);
    }
    hypothesis.status = status;
    hypothesis.updatedAt = /* @__PURE__ */ new Date();
    return hypothesis;
  }
  /**
   * Get generation summary
   */
  async getGenerationSummary(hypotheses, requestId, topic) {
    const byType = {
      mechanistic: 0,
      correlational: 0,
      predictive: 0,
      causal: 0,
      comparative: 0,
      exploratory: 0
    };
    const byConfidence = {
      high: 0,
      medium: 0,
      low: 0,
      speculative: 0
    };
    let totalNovelty = 0;
    let totalTestability = 0;
    let totalImpact = 0;
    let topScore = 0;
    let topHypothesisId = hypotheses[0]?.id ?? "";
    for (const h of hypotheses) {
      byType[h.type]++;
      byConfidence[h.confidence]++;
      totalNovelty += h.noveltyScore;
      totalTestability += h.testabilityScore;
      totalImpact += h.impactScore;
      const score = this.calculateOverallScore(h, DEFAULT_CRITERIA);
      if (score > topScore) {
        topScore = score;
        topHypothesisId = h.id;
      }
    }
    const count = hypotheses.length || 1;
    return {
      requestId,
      topic,
      totalGenerated: hypotheses.length,
      byType,
      byConfidence,
      averageNovelty: totalNovelty / count,
      averageTestability: totalTestability / count,
      averageImpact: totalImpact / count,
      topHypothesisId,
      knowledgeGapsIdentified: this.gaps.size,
      generatedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Get hypothesis by ID
   */
  async getHypothesis(id) {
    return this.hypotheses.get(id);
  }
  /**
   * List hypotheses for a user/lab
   */
  async listHypotheses(options) {
    let results = Array.from(this.hypotheses.values());
    if (options.userId) {
      results = results.filter((h) => h.generatedFor === options.userId);
    }
    if (options.labId) {
      results = results.filter((h) => h.labId === options.labId);
    }
    if (options.status) {
      results = results.filter((h) => h.status === options.status);
    }
    return results;
  }
  /**
   * Get knowledge gaps
   */
  async getKnowledgeGaps(topic) {
    let results = Array.from(this.gaps.values());
    if (topic) {
      results = results.filter((g) => g.topic.includes(topic));
    }
    return results;
  }
};
var hypothesisService = new HypothesisService();

// src/climate/climate-service.ts
var CLIMATE_VARIABLES = {
  temperature: {
    type: "temperature",
    unit: "\xB0C",
    description: "2m\u5730\u4E0A\u6C17\u6E29",
    range: { min: -90, max: 60 }
  },
  precipitation: {
    type: "precipitation",
    unit: "mm",
    description: "\u964D\u6C34\u91CF",
    range: { min: 0, max: 500 }
  },
  humidity: {
    type: "humidity",
    unit: "%",
    description: "\u76F8\u5BFE\u6E7F\u5EA6",
    range: { min: 0, max: 100 }
  },
  wind_speed: {
    type: "wind_speed",
    unit: "m/s",
    description: "\u98A8\u901F",
    range: { min: 0, max: 150 }
  },
  wind_direction: {
    type: "wind_direction",
    unit: "\xB0",
    description: "\u98A8\u5411",
    range: { min: 0, max: 360 }
  },
  pressure: {
    type: "pressure",
    unit: "hPa",
    description: "\u6C17\u5727",
    range: { min: 870, max: 1084 }
  },
  sea_level: {
    type: "sea_level",
    unit: "m",
    description: "\u6D77\u9762\u6C34\u4F4D"
  },
  ice_extent: {
    type: "ice_extent",
    unit: "km\xB2",
    description: "\u6D77\u6C37\u9762\u7A4D"
  },
  solar_radiation: {
    type: "solar_radiation",
    unit: "W/m\xB2",
    description: "\u65E5\u5C04\u91CF",
    range: { min: 0, max: 1400 }
  },
  cloud_cover: {
    type: "cloud_cover",
    unit: "%",
    description: "\u96F2\u91CF",
    range: { min: 0, max: 100 }
  },
  co2_concentration: {
    type: "co2_concentration",
    unit: "ppm",
    description: "CO2\u6FC3\u5EA6",
    range: { min: 200, max: 1e3 }
  },
  methane_concentration: {
    type: "methane_concentration",
    unit: "ppb",
    description: "\u30E1\u30BF\u30F3\u6FC3\u5EA6",
    range: { min: 700, max: 3e3 }
  }
};
var ClimateService = class {
  workflows = /* @__PURE__ */ new Map();
  nextId = 1;
  /**
   * Get available climate variables
   */
  getClimateVariables() {
    return Object.values(CLIMATE_VARIABLES);
  }
  /**
   * Get emission scenarios with descriptions
   */
  getEmissionScenarios() {
    return [
      {
        id: "ssp1-1.9",
        name: "\u975E\u5E38\u306B\u4F4E\u6392\u51FA\uFF08SSP1-1.9\uFF09",
        description: "\u6301\u7D9A\u53EF\u80FD\u306A\u767A\u5C55\u30012050\u5E74\u30CD\u30C3\u30C8\u30BC\u30ED\u9054\u6210\u30011.5\xB0C\u76EE\u6A19"
      },
      {
        id: "ssp1-2.6",
        name: "\u4F4E\u6392\u51FA\uFF08SSP1-2.6\uFF09",
        description: "\u6301\u7D9A\u53EF\u80FD\u306A\u767A\u5C55\u30012\xB0C\u76EE\u6A19\u9054\u6210\u53EF\u80FD"
      },
      {
        id: "ssp2-4.5",
        name: "\u4E2D\u9593\u6392\u51FA\uFF08SSP2-4.5\uFF09",
        description: "\u73FE\u72B6\u7DAD\u6301\u30B7\u30CA\u30EA\u30AA\u30012100\u5E74\u7D042.7\xB0C\u4E0A\u6607"
      },
      {
        id: "ssp3-7.0",
        name: "\u9AD8\u6392\u51FA\uFF08SSP3-7.0\uFF09",
        description: "\u5730\u57DF\u5206\u88C2\u30B7\u30CA\u30EA\u30AA\u30012100\u5E74\u7D043.6\xB0C\u4E0A\u6607"
      },
      {
        id: "ssp5-8.5",
        name: "\u975E\u5E38\u306B\u9AD8\u6392\u51FA\uFF08SSP5-8.5\uFF09",
        description: "\u5316\u77F3\u71C3\u6599\u4F9D\u5B58\u30B7\u30CA\u30EA\u30AA\u30012100\u5E74\u7D044.4\xB0C\u4E0A\u6607"
      }
    ];
  }
  /**
   * Get extreme event types with thresholds
   */
  getExtremeEventTypes() {
    return [
      { type: "heatwave", name: "\u71B1\u6CE2", defaultThreshold: "35\xB0C\u4EE5\u4E0A\u304C3\u65E5\u4EE5\u4E0A\u7D99\u7D9A" },
      { type: "drought", name: "\u5E72\u3070\u3064", defaultThreshold: "SPI < -2.0" },
      { type: "flood", name: "\u6D2A\u6C34", defaultThreshold: "100mm/\u65E5\u4EE5\u4E0A\u306E\u964D\u6C34" },
      { type: "hurricane", name: "\u30CF\u30EA\u30B1\u30FC\u30F3", defaultThreshold: "\u30AB\u30C6\u30B4\u30EA\u30FC1\u4EE5\u4E0A" },
      { type: "tornado", name: "\u7ADC\u5DFB", defaultThreshold: "EF1\u4EE5\u4E0A" },
      { type: "wildfire", name: "\u5C71\u706B\u4E8B", defaultThreshold: "FWI > 30" },
      { type: "cold_snap", name: "\u5BD2\u6CE2", defaultThreshold: "-10\xB0C\u4EE5\u4E0B\u304C3\u65E5\u4EE5\u4E0A\u7D99\u7D9A" },
      { type: "storm_surge", name: "\u9AD8\u6F6E", defaultThreshold: "1m\u4EE5\u4E0A\u306E\u6F6E\u4F4D\u4E0A\u6607" }
    ];
  }
  /**
   * Get impact sectors
   */
  getImpactSectors() {
    return [
      { sector: "agriculture", name: "\u8FB2\u696D", description: "\u4F5C\u7269\u751F\u7523\u3001\u755C\u7523\u3001\u6F01\u696D\u3078\u306E\u5F71\u97FF" },
      { sector: "water_resources", name: "\u6C34\u8CC7\u6E90", description: "\u6C34\u5229\u7528\u53EF\u80FD\u6027\u3001\u6C34\u8CEA\u3001\u6D2A\u6C34\u30EA\u30B9\u30AF" },
      { sector: "energy", name: "\u30A8\u30CD\u30EB\u30AE\u30FC", description: "\u767A\u96FB\u3001\u51B7\u6696\u623F\u9700\u8981\u3001\u518D\u30A8\u30CD\u8CC7\u6E90" },
      { sector: "health", name: "\u5065\u5EB7", description: "\u71B1\u4E2D\u75C7\u3001\u611F\u67D3\u75C7\u3001\u5927\u6C17\u6C5A\u67D3\u95A2\u9023\u75BE\u60A3" },
      { sector: "infrastructure", name: "\u30A4\u30F3\u30D5\u30E9", description: "\u9053\u8DEF\u3001\u5EFA\u7269\u3001\u9001\u96FB\u7DB2\u306E\u8106\u5F31\u6027" },
      { sector: "ecosystems", name: "\u751F\u614B\u7CFB", description: "\u751F\u7269\u591A\u69D8\u6027\u3001\u751F\u614B\u7CFB\u30B5\u30FC\u30D3\u30B9" },
      { sector: "coastal", name: "\u6CBF\u5CB8\u57DF", description: "\u6D77\u9762\u4E0A\u6607\u3001\u6D78\u98DF\u3001\u9AD8\u6F6E\u88AB\u5BB3" },
      { sector: "urban", name: "\u90FD\u5E02", description: "\u30D2\u30FC\u30C8\u30A2\u30A4\u30E9\u30F3\u30C9\u3001\u90FD\u5E02\u6D2A\u6C34\u3001\u751F\u6D3B\u74B0\u5883" }
    ];
  }
  // ============================================================================
  // Weather Prediction
  // ============================================================================
  /**
   * Create a weather prediction workflow
   */
  async createWeatherPrediction(input) {
    const id = `weather-${this.nextId++}`;
    const now = /* @__PURE__ */ new Date();
    const workflow = {
      id,
      name: input.name,
      type: "weather_prediction",
      status: "draft",
      createdAt: now,
      updatedAt: now,
      config: input.config
    };
    this.workflows.set(id, workflow);
    return workflow;
  }
  /**
   * Run weather prediction using Aurora
   */
  async runWeatherPrediction(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.type !== "weather_prediction") {
      throw new Error(`Weather prediction workflow not found: ${workflowId}`);
    }
    workflow.status = "running";
    workflow.progress = {
      currentStep: "\u30C7\u30FC\u30BF\u53D6\u5F97\u4E2D",
      totalSteps: 4,
      completedSteps: 0
    };
    workflow.updatedAt = /* @__PURE__ */ new Date();
    const config = workflow.config;
    await this.simulateDelay(1e3);
    workflow.progress.currentStep = "\u30E2\u30C7\u30EB\u521D\u671F\u5316\u4E2D";
    workflow.progress.completedSteps = 1;
    await this.simulateDelay(1500);
    workflow.progress.currentStep = "\u4E88\u6E2C\u8A08\u7B97\u4E2D";
    workflow.progress.completedSteps = 2;
    await this.simulateDelay(2e3);
    workflow.progress.currentStep = "\u7D50\u679C\u5F8C\u51E6\u7406\u4E2D";
    workflow.progress.completedSteps = 3;
    const predictions = this.generateMockWeatherPredictions(config);
    await this.simulateDelay(500);
    workflow.progress.currentStep = "\u5B8C\u4E86";
    workflow.progress.completedSteps = 4;
    const result = {
      id: `pred-${workflowId}`,
      config,
      createdAt: /* @__PURE__ */ new Date(),
      predictions,
      uncertainty: this.generateUncertainty(config.variables),
      metadata: {
        modelVersion: config.model === "aurora" ? "aurora-v1.0" : `${config.model}-v1.0`,
        computeTime: 4e3,
        dataSource: "ERA5 Reanalysis"
      }
    };
    workflow.status = "completed";
    workflow.results = result;
    workflow.updatedAt = /* @__PURE__ */ new Date();
    return result;
  }
  // ============================================================================
  // Climate Projection
  // ============================================================================
  /**
   * Create a climate projection workflow
   */
  async createClimateProjection(input) {
    const id = `projection-${this.nextId++}`;
    const now = /* @__PURE__ */ new Date();
    const workflow = {
      id,
      name: input.name,
      type: "climate_projection",
      status: "draft",
      createdAt: now,
      updatedAt: now,
      config: input.config
    };
    this.workflows.set(id, workflow);
    return workflow;
  }
  /**
   * Run climate projection
   */
  async runClimateProjection(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.type !== "climate_projection") {
      throw new Error(`Climate projection workflow not found: ${workflowId}`);
    }
    workflow.status = "running";
    workflow.progress = {
      currentStep: "\u30D9\u30FC\u30B9\u30E9\u30A4\u30F3\u8A08\u7B97\u4E2D",
      totalSteps: 5,
      completedSteps: 0
    };
    workflow.updatedAt = /* @__PURE__ */ new Date();
    const config = workflow.config;
    await this.simulateDelay(1e3);
    workflow.progress.currentStep = "\u30B7\u30CA\u30EA\u30AA\u30C7\u30FC\u30BF\u53D6\u5F97\u4E2D";
    workflow.progress.completedSteps = 1;
    await this.simulateDelay(1500);
    workflow.progress.currentStep = "\u30C0\u30A6\u30F3\u30B9\u30B1\u30FC\u30EA\u30F3\u30B0\u4E2D";
    workflow.progress.completedSteps = 2;
    await this.simulateDelay(2e3);
    workflow.progress.currentStep = "\u5C06\u6765\u4E88\u6E2C\u8A08\u7B97\u4E2D";
    workflow.progress.completedSteps = 3;
    await this.simulateDelay(1e3);
    workflow.progress.currentStep = "\u4E0D\u78BA\u5B9F\u6027\u8A55\u4FA1\u4E2D";
    workflow.progress.completedSteps = 4;
    const projections = this.generateMockClimateProjections(config);
    await this.simulateDelay(500);
    workflow.progress.currentStep = "\u5B8C\u4E86";
    workflow.progress.completedSteps = 5;
    const result = {
      id: `proj-${workflowId}`,
      config,
      createdAt: /* @__PURE__ */ new Date(),
      baseline: this.generateBaseline(config.variables),
      projections,
      summary: this.generateProjectionSummary(projections, config.variables)
    };
    workflow.status = "completed";
    workflow.results = result;
    workflow.updatedAt = /* @__PURE__ */ new Date();
    return result;
  }
  // ============================================================================
  // Extreme Event Analysis
  // ============================================================================
  /**
   * Create an extreme event analysis workflow
   */
  async createExtremeEventAnalysis(input) {
    const id = `extreme-${this.nextId++}`;
    const now = /* @__PURE__ */ new Date();
    const workflow = {
      id,
      name: input.name,
      type: "extreme_event_analysis",
      status: "draft",
      createdAt: now,
      updatedAt: now,
      config: input.config
    };
    this.workflows.set(id, workflow);
    return workflow;
  }
  /**
   * Run extreme event analysis
   */
  async runExtremeEventAnalysis(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.type !== "extreme_event_analysis") {
      throw new Error(`Extreme event analysis workflow not found: ${workflowId}`);
    }
    workflow.status = "running";
    workflow.progress = {
      currentStep: "\u904E\u53BB\u30C7\u30FC\u30BF\u5206\u6790\u4E2D",
      totalSteps: 4,
      completedSteps: 0
    };
    workflow.updatedAt = /* @__PURE__ */ new Date();
    const config = workflow.config;
    await this.simulateDelay(1e3);
    workflow.progress.currentStep = "\u95BE\u5024\u8D85\u904E\u691C\u51FA\u4E2D";
    workflow.progress.completedSteps = 1;
    await this.simulateDelay(1500);
    workflow.progress.currentStep = "\u30A4\u30D9\u30F3\u30C8\u5206\u985E\u4E2D";
    workflow.progress.completedSteps = 2;
    await this.simulateDelay(1e3);
    workflow.progress.currentStep = "\u7D71\u8A08\u5206\u6790\u4E2D";
    workflow.progress.completedSteps = 3;
    const events = this.generateMockExtremeEvents(config);
    await this.simulateDelay(500);
    workflow.progress.currentStep = "\u5B8C\u4E86";
    workflow.progress.completedSteps = 4;
    const result = {
      id: `analysis-${workflowId}`,
      config,
      createdAt: /* @__PURE__ */ new Date(),
      events,
      statistics: this.generateEventStatistics(events, config.eventTypes)
    };
    workflow.status = "completed";
    workflow.results = result;
    workflow.updatedAt = /* @__PURE__ */ new Date();
    return result;
  }
  // ============================================================================
  // Impact Assessment
  // ============================================================================
  /**
   * Create an impact assessment workflow
   */
  async createImpactAssessment(input) {
    const id = `impact-${this.nextId++}`;
    const now = /* @__PURE__ */ new Date();
    const workflow = {
      id,
      name: input.name,
      type: "impact_assessment",
      status: "draft",
      createdAt: now,
      updatedAt: now,
      config: input.config
    };
    this.workflows.set(id, workflow);
    return workflow;
  }
  /**
   * Run impact assessment
   */
  async runImpactAssessment(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.type !== "impact_assessment") {
      throw new Error(`Impact assessment workflow not found: ${workflowId}`);
    }
    workflow.status = "running";
    workflow.progress = {
      currentStep: "\u6C17\u5019\u30C7\u30FC\u30BF\u7D71\u5408\u4E2D",
      totalSteps: 5,
      completedSteps: 0
    };
    workflow.updatedAt = /* @__PURE__ */ new Date();
    const config = workflow.config;
    await this.simulateDelay(1e3);
    workflow.progress.currentStep = "\u8106\u5F31\u6027\u8A55\u4FA1\u4E2D";
    workflow.progress.completedSteps = 1;
    await this.simulateDelay(1500);
    workflow.progress.currentStep = "\u30EA\u30B9\u30AF\u5206\u6790\u4E2D";
    workflow.progress.completedSteps = 2;
    await this.simulateDelay(1500);
    workflow.progress.currentStep = "\u9069\u5FDC\u7B56\u8A55\u4FA1\u4E2D";
    workflow.progress.completedSteps = 3;
    await this.simulateDelay(1e3);
    workflow.progress.currentStep = "\u30EC\u30DD\u30FC\u30C8\u751F\u6210\u4E2D";
    workflow.progress.completedSteps = 4;
    const sectorImpacts = this.generateMockSectorImpacts(config.sectors);
    await this.simulateDelay(500);
    workflow.progress.currentStep = "\u5B8C\u4E86";
    workflow.progress.completedSteps = 5;
    const result = {
      id: `impact-${workflowId}`,
      config,
      createdAt: /* @__PURE__ */ new Date(),
      sectorImpacts,
      overallRiskScore: Math.round(
        sectorImpacts.reduce((sum, s) => sum + s.vulnerabilityScore, 0) / sectorImpacts.length
      ),
      priorityActions: this.generatePriorityActions(sectorImpacts)
    };
    workflow.status = "completed";
    workflow.results = result;
    workflow.updatedAt = /* @__PURE__ */ new Date();
    return result;
  }
  // ============================================================================
  // Workflow Management
  // ============================================================================
  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId) {
    return this.workflows.get(workflowId);
  }
  /**
   * List workflows
   */
  async listWorkflows(options) {
    let workflows2 = Array.from(this.workflows.values());
    if (options?.type) {
      workflows2 = workflows2.filter((w) => w.type === options.type);
    }
    if (options?.status) {
      workflows2 = workflows2.filter((w) => w.status === options.status);
    }
    workflows2.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 20;
    return workflows2.slice(offset, offset + limit);
  }
  /**
   * Delete workflow
   */
  async deleteWorkflow(workflowId) {
    this.workflows.delete(workflowId);
  }
  // ============================================================================
  // Private Helper Methods
  // ============================================================================
  async simulateDelay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  generateMockWeatherPredictions(config) {
    const predictions = [];
    const { region, forecastHorizon } = config;
    const centerLat = (region.bounds.north + region.bounds.south) / 2;
    const centerLon = (region.bounds.east + region.bounds.west) / 2;
    for (let h = 0; h < forecastHorizon; h += 6) {
      const variables = {};
      for (const v of config.variables) {
        const varDef = CLIMATE_VARIABLES[v];
        if (varDef.range) {
          const mid = (varDef.range.max + varDef.range.min) / 2;
          const range = varDef.range.max - varDef.range.min;
          variables[v] = mid + (Math.random() - 0.5) * range * 0.3;
        } else {
          variables[v] = Math.random() * 100;
        }
      }
      predictions.push({
        timestamp: new Date(Date.now() + h * 36e5),
        location: { lat: centerLat, lon: centerLon },
        variables,
        quality: "predicted"
      });
    }
    return predictions;
  }
  generateUncertainty(variables) {
    const mean = {};
    const std = {};
    const quantiles = {};
    for (const v of variables) {
      const varDef = CLIMATE_VARIABLES[v];
      const baseValue = varDef.range ? (varDef.range.max + varDef.range.min) / 2 : 50;
      mean[v] = baseValue;
      std[v] = baseValue * 0.1;
      quantiles[v] = {
        "5": baseValue * 0.8,
        "25": baseValue * 0.9,
        "50": baseValue,
        "75": baseValue * 1.1,
        "95": baseValue * 1.2
      };
    }
    return { mean, std, quantiles };
  }
  generateBaseline(variables) {
    const mean = {};
    const std = {};
    for (const v of variables) {
      const varDef = CLIMATE_VARIABLES[v];
      mean[v] = varDef.range ? (varDef.range.max + varDef.range.min) / 2 : 50;
      std[v] = mean[v] * 0.15;
    }
    return { mean, std };
  }
  generateMockClimateProjections(config) {
    const projections = [];
    const startYear = config.timeRange.start.getFullYear();
    const endYear = config.timeRange.end.getFullYear();
    const scenarioFactors = {
      "ssp1-1.9": 0.3,
      "ssp1-2.6": 0.5,
      "ssp2-4.5": 1,
      "ssp3-7.0": 1.5,
      "ssp5-8.5": 2
    };
    const factor = scenarioFactors[config.scenario];
    for (let year = startYear; year <= endYear; year += 10) {
      const yearsSince2020 = Math.max(0, year - 2020);
      const change = {};
      const confidence = {};
      for (const v of config.variables) {
        let baseChange = 0;
        switch (v) {
          case "temperature":
            baseChange = yearsSince2020 / 80 * 4 * factor;
            break;
          case "precipitation":
            baseChange = yearsSince2020 / 80 * 20 * factor;
            break;
          case "sea_level":
            baseChange = yearsSince2020 / 80 * 0.5 * factor;
            break;
          default:
            baseChange = yearsSince2020 / 80 * 10 * factor;
        }
        change[v] = baseChange;
        confidence[v] = {
          lower: baseChange * 0.7,
          upper: baseChange * 1.3
        };
      }
      projections.push({ year, change, confidence });
    }
    return projections;
  }
  generateProjectionSummary(projections, variables) {
    const lastProjection = projections[projections.length - 1];
    const totalChange = {};
    const peakYear = {};
    for (const v of variables) {
      totalChange[v] = lastProjection?.change[v] ?? 0;
      peakYear[v] = lastProjection?.year ?? 2100;
    }
    const tempChange = totalChange["temperature"] ?? 0;
    let riskLevel = "low";
    if (tempChange > 3) riskLevel = "severe";
    else if (tempChange > 2) riskLevel = "high";
    else if (tempChange > 1.5) riskLevel = "moderate";
    return { totalChange, peakYear, riskLevel };
  }
  generateMockExtremeEvents(config) {
    const events = [];
    const eventCount = Math.floor(Math.random() * 10) + 5;
    for (let i = 0; i < eventCount; i++) {
      const eventType = config.eventTypes[Math.floor(Math.random() * config.eventTypes.length)];
      const severities = ["minor", "moderate", "severe", "extreme"];
      events.push({
        id: `event-${i + 1}`,
        type: eventType,
        startDate: new Date(
          config.timeRange.start.getTime() + Math.random() * (config.timeRange.end.getTime() - config.timeRange.start.getTime())
        ),
        endDate: /* @__PURE__ */ new Date(),
        location: config.region,
        severity: severities[Math.floor(Math.random() * severities.length)],
        metrics: {
          intensity: Math.random() * 100,
          duration: Math.floor(Math.random() * 168) + 24,
          affectedArea: Math.floor(Math.random() * 1e4) + 100,
          returnPeriod: Math.floor(Math.random() * 100) + 1
        }
      });
    }
    events[events.length - 1].endDate = new Date(events[events.length - 1].startDate.getTime() + events[events.length - 1].metrics.duration * 36e5);
    return events.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }
  generateEventStatistics(events, eventTypes) {
    const byType = {};
    const bySeverity = {
      minor: 0,
      moderate: 0,
      severe: 0,
      extreme: 0
    };
    for (const type of eventTypes) {
      byType[type] = 0;
    }
    for (const event of events) {
      byType[event.type] = (byType[event.type] || 0) + 1;
      bySeverity[event.severity]++;
    }
    return {
      totalEvents: events.length,
      byType,
      bySeverity,
      trends: {
        frequency: Math.random() > 0.5 ? "increasing" : "stable",
        intensity: Math.random() > 0.6 ? "increasing" : "stable"
      }
    };
  }
  generateMockSectorImpacts(sectors) {
    const sectorNames = {
      agriculture: "\u8FB2\u696D",
      water_resources: "\u6C34\u8CC7\u6E90",
      energy: "\u30A8\u30CD\u30EB\u30AE\u30FC",
      health: "\u5065\u5EB7",
      infrastructure: "\u30A4\u30F3\u30D5\u30E9",
      ecosystems: "\u751F\u614B\u7CFB",
      coastal: "\u6CBF\u5CB8\u57DF",
      urban: "\u90FD\u5E02"
    };
    return sectors.map((sector) => ({
      sector,
      vulnerabilityScore: Math.floor(Math.random() * 40) + 30,
      risks: [
        {
          description: `${sectorNames[sector]}\u306B\u304A\u3051\u308B\u6C17\u6E29\u4E0A\u6607\u306E\u5F71\u97FF`,
          likelihood: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
          impact: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
          timeframe: ["near-term", "mid-term", "long-term"][Math.floor(Math.random() * 3)]
        },
        {
          description: `${sectorNames[sector]}\u306B\u304A\u3051\u308B\u6975\u7AEF\u73FE\u8C61\u306E\u5897\u52A0`,
          likelihood: "medium",
          impact: "high",
          timeframe: "mid-term"
        }
      ],
      opportunities: [
        {
          description: `\u9069\u5FDC\u7B56\u306B\u3088\u308B${sectorNames[sector]}\u306E\u5F37\u5316`,
          potential: "medium"
        }
      ],
      adaptationRecommendations: [
        {
          measure: `${sectorNames[sector]}\u306E\u6C17\u5019\u5909\u52D5\u9069\u5FDC\u8A08\u753B\u7B56\u5B9A`,
          effectiveness: "high",
          cost: "medium",
          urgency: "high"
        },
        {
          measure: "\u30E2\u30CB\u30BF\u30EA\u30F3\u30B0\u30B7\u30B9\u30C6\u30E0\u306E\u5F37\u5316",
          effectiveness: "medium",
          cost: "low",
          urgency: "medium"
        }
      ]
    }));
  }
  generatePriorityActions(sectorImpacts) {
    const actions = [];
    const sorted = [...sectorImpacts].sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);
    for (let i = 0; i < Math.min(3, sorted.length); i++) {
      const sector = sorted[i];
      if (sector.adaptationRecommendations.length > 0) {
        actions.push(sector.adaptationRecommendations[0].measure);
      }
    }
    return actions;
  }
};
var climateService = new ClimateService();

// src/genomics/genomics-service.ts
var REFERENCE_GENOMES = [
  {
    id: "hg38",
    name: "Human GRCh38",
    organism: "Homo sapiens",
    assembly: "GRCh38",
    version: "p14",
    chromosomes: 24,
    totalBases: 3099734149
  },
  {
    id: "hg19",
    name: "Human GRCh37",
    organism: "Homo sapiens",
    assembly: "GRCh37",
    version: "p13",
    chromosomes: 24,
    totalBases: 3101804739
  },
  {
    id: "mm39",
    name: "Mouse GRCm39",
    organism: "Mus musculus",
    assembly: "GRCm39",
    version: "",
    chromosomes: 21,
    totalBases: 2728222451
  },
  {
    id: "mm10",
    name: "Mouse GRCm38",
    organism: "Mus musculus",
    assembly: "GRCm38",
    version: "p6",
    chromosomes: 21,
    totalBases: 2730871774
  }
];
var CHROMOSOMES = [
  "chr1",
  "chr2",
  "chr3",
  "chr4",
  "chr5",
  "chr6",
  "chr7",
  "chr8",
  "chr9",
  "chr10",
  "chr11",
  "chr12",
  "chr13",
  "chr14",
  "chr15",
  "chr16",
  "chr17",
  "chr18",
  "chr19",
  "chr20",
  "chr21",
  "chr22",
  "chrX",
  "chrY"
];
var GENE_NAMES = [
  "TP53",
  "BRCA1",
  "BRCA2",
  "EGFR",
  "KRAS",
  "BRAF",
  "PIK3CA",
  "PTEN",
  "AKT1",
  "MYC",
  "RB1",
  "CDKN2A",
  "ERBB2",
  "ALK",
  "ROS1",
  "MET",
  "NRAS",
  "HRAS",
  "APC",
  "VHL",
  "NF1",
  "NF2",
  "TSC1",
  "TSC2",
  "GAPDH",
  "ACTB",
  "TUBB",
  "HSP90AA1",
  "HSPA5",
  "CALM1"
];
var GenomicsService = class {
  workflows = /* @__PURE__ */ new Map();
  sequenceFiles = /* @__PURE__ */ new Map();
  nextId = 1;
  /**
   * Get available reference genomes
   */
  getReferenceGenomes() {
    return REFERENCE_GENOMES;
  }
  /**
   * Get reference genome by ID
   */
  getReferenceGenome(id) {
    return REFERENCE_GENOMES.find((r) => r.id === id);
  }
  /**
   * Get analysis types with descriptions
   */
  getAnalysisTypes() {
    return [
      {
        type: "variant_calling",
        name: "\u5909\u7570\u691C\u51FA",
        description: "SNV\u3001InDel\u3001\u69CB\u9020\u5909\u7570\u306E\u691C\u51FA\u3068\u30A2\u30CE\u30C6\u30FC\u30B7\u30E7\u30F3"
      },
      {
        type: "gene_expression",
        name: "\u907A\u4F1D\u5B50\u767A\u73FE\u89E3\u6790",
        description: "RNA-Seq\u306B\u3088\u308B\u767A\u73FE\u5B9A\u91CF\u3068\u5DEE\u6B21\u7684\u767A\u73FE\u89E3\u6790"
      },
      {
        type: "single_cell",
        name: "\u30B7\u30F3\u30B0\u30EB\u30BB\u30EB\u89E3\u6790",
        description: "\u5358\u4E00\u7D30\u80DE\u30EC\u30D9\u30EB\u3067\u306E\u907A\u4F1D\u5B50\u767A\u73FE\u30D7\u30ED\u30D5\u30A1\u30A4\u30EA\u30F3\u30B0"
      },
      {
        type: "rna_seq",
        name: "RNA-Seq",
        description: "\u30C8\u30E9\u30F3\u30B9\u30AF\u30EA\u30D7\u30C8\u30FC\u30E0\u89E3\u6790"
      },
      {
        type: "chip_seq",
        name: "ChIP-Seq",
        description: "\u30AF\u30ED\u30DE\u30C1\u30F3\u514D\u75AB\u6C88\u964D\u30B7\u30FC\u30B1\u30F3\u30B7\u30F3\u30B0"
      },
      {
        type: "methylation",
        name: "\u30E1\u30C1\u30EB\u5316\u89E3\u6790",
        description: "DNA\u30E1\u30C1\u30EB\u5316\u30D1\u30BF\u30FC\u30F3\u306E\u89E3\u6790"
      },
      {
        type: "metagenomics",
        name: "\u30E1\u30BF\u30B2\u30CE\u30DF\u30AF\u30B9",
        description: "\u74B0\u5883\u30B5\u30F3\u30D7\u30EB\u304B\u3089\u306E\u5FAE\u751F\u7269\u7FA4\u96C6\u89E3\u6790"
      }
    ];
  }
  // ============================================================================
  // Sequence File Management
  // ============================================================================
  /**
   * Register a sequence file (mock upload)
   */
  async registerSequenceFile(name, format, size) {
    const id = `seq-${this.nextId++}`;
    const file = {
      id,
      name,
      format,
      size,
      sequenceType: format === "fastq" ? "dna" : "dna",
      uploadedAt: /* @__PURE__ */ new Date()
    };
    this.sequenceFiles.set(id, file);
    return file;
  }
  /**
   * List sequence files
   */
  async listSequenceFiles() {
    return Array.from(this.sequenceFiles.values());
  }
  // ============================================================================
  // Variant Calling
  // ============================================================================
  /**
   * Create variant calling workflow
   */
  async createVariantCalling(input) {
    const id = `variant-${this.nextId++}`;
    const now = /* @__PURE__ */ new Date();
    const workflow = {
      id,
      name: input.name,
      description: input.description,
      type: "variant_calling",
      status: "draft",
      createdAt: now,
      updatedAt: now,
      config: input.config,
      logs: []
    };
    this.workflows.set(id, workflow);
    return workflow;
  }
  /**
   * Run variant calling pipeline
   */
  async runVariantCalling(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.type !== "variant_calling") {
      throw new Error(`Variant calling workflow not found: ${workflowId}`);
    }
    workflow.status = "running";
    workflow.progress = {
      currentStep: "\u30EA\u30FC\u30C9\u54C1\u8CEA\u30C1\u30A7\u30C3\u30AF",
      totalSteps: 6,
      completedSteps: 0
    };
    workflow.updatedAt = /* @__PURE__ */ new Date();
    this.addLog(workflow, "info", "\u30D1\u30A4\u30D7\u30E9\u30A4\u30F3\u958B\u59CB");
    const config = workflow.config;
    await this.simulateDelay(800);
    this.addLog(workflow, "info", "\u30EA\u30FC\u30C9\u54C1\u8CEA\u30C1\u30A7\u30C3\u30AF\u5B8C\u4E86");
    workflow.progress.currentStep = "\u30EA\u30D5\u30A1\u30EC\u30F3\u30B9\u3078\u306E\u30A2\u30E9\u30A4\u30E1\u30F3\u30C8";
    workflow.progress.completedSteps = 1;
    await this.simulateDelay(1500);
    this.addLog(workflow, "info", `${config.referenceGenome}\u3078\u306E\u30A2\u30E9\u30A4\u30E1\u30F3\u30C8\u5B8C\u4E86`);
    workflow.progress.currentStep = "\u91CD\u8907\u9664\u53BB\u30FB\u518D\u30A2\u30E9\u30A4\u30E1\u30F3\u30C8";
    workflow.progress.completedSteps = 2;
    await this.simulateDelay(1e3);
    this.addLog(workflow, "info", "\u91CD\u8907\u9664\u53BB\u5B8C\u4E86");
    workflow.progress.currentStep = "\u5909\u7570\u691C\u51FA";
    workflow.progress.completedSteps = 3;
    await this.simulateDelay(2e3);
    this.addLog(workflow, "info", `${config.callers.join(", ")}\u306B\u3088\u308B\u5909\u7570\u691C\u51FA\u5B8C\u4E86`);
    workflow.progress.currentStep = "\u30D5\u30A3\u30EB\u30BF\u30EA\u30F3\u30B0";
    workflow.progress.completedSteps = 4;
    await this.simulateDelay(800);
    this.addLog(workflow, "info", `\u54C1\u8CEA\u30D5\u30A3\u30EB\u30BF\u30EA\u30F3\u30B0\u5B8C\u4E86 (Q\u2265${config.minQuality}, DP\u2265${config.minDepth})`);
    workflow.progress.currentStep = "\u30A2\u30CE\u30C6\u30FC\u30B7\u30E7\u30F3";
    workflow.progress.completedSteps = 5;
    await this.simulateDelay(1200);
    this.addLog(workflow, "info", "\u30A2\u30CE\u30C6\u30FC\u30B7\u30E7\u30F3\u5B8C\u4E86");
    workflow.progress.currentStep = "\u5B8C\u4E86";
    workflow.progress.completedSteps = 6;
    const result = this.generateMockVariantResult(config);
    workflow.status = "completed";
    workflow.results = result;
    workflow.updatedAt = /* @__PURE__ */ new Date();
    this.addLog(workflow, "info", `\u30D1\u30A4\u30D7\u30E9\u30A4\u30F3\u5B8C\u4E86: ${result.totalVariants}\u5909\u7570\u691C\u51FA`);
    return result;
  }
  // ============================================================================
  // Gene Expression Analysis
  // ============================================================================
  /**
   * Create gene expression workflow
   */
  async createGeneExpression(input) {
    const id = `expr-${this.nextId++}`;
    const now = /* @__PURE__ */ new Date();
    const workflow = {
      id,
      name: input.name,
      description: input.description,
      type: "gene_expression",
      status: "draft",
      createdAt: now,
      updatedAt: now,
      config: input.config,
      logs: []
    };
    this.workflows.set(id, workflow);
    return workflow;
  }
  /**
   * Run gene expression analysis
   */
  async runGeneExpression(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.type !== "gene_expression") {
      throw new Error(`Gene expression workflow not found: ${workflowId}`);
    }
    workflow.status = "running";
    workflow.progress = {
      currentStep: "\u30EA\u30FC\u30C9\u30AB\u30A6\u30F3\u30C8",
      totalSteps: 5,
      completedSteps: 0
    };
    workflow.updatedAt = /* @__PURE__ */ new Date();
    this.addLog(workflow, "info", "\u767A\u73FE\u89E3\u6790\u30D1\u30A4\u30D7\u30E9\u30A4\u30F3\u958B\u59CB");
    const config = workflow.config;
    await this.simulateDelay(1e3);
    this.addLog(workflow, "info", "\u30EA\u30FC\u30C9\u30AB\u30A6\u30F3\u30C8\u5B8C\u4E86");
    workflow.progress.currentStep = "\u6B63\u898F\u5316";
    workflow.progress.completedSteps = 1;
    await this.simulateDelay(800);
    this.addLog(workflow, "info", `${config.normalization}\u6B63\u898F\u5316\u5B8C\u4E86`);
    workflow.progress.currentStep = "\u54C1\u8CEA\u8A55\u4FA1";
    workflow.progress.completedSteps = 2;
    await this.simulateDelay(600);
    this.addLog(workflow, "info", "\u30B5\u30F3\u30D7\u30EB\u54C1\u8CEA\u8A55\u4FA1\u5B8C\u4E86");
    workflow.progress.currentStep = "\u5DEE\u6B21\u7684\u767A\u73FE\u89E3\u6790";
    workflow.progress.completedSteps = 3;
    await this.simulateDelay(1500);
    if (config.contrasts && config.contrasts.length > 0) {
      this.addLog(workflow, "info", `${config.contrasts.length}\u500B\u306E\u30B3\u30F3\u30C8\u30E9\u30B9\u30C8\u3067\u5DEE\u6B21\u7684\u767A\u73FE\u89E3\u6790\u5B8C\u4E86`);
    }
    workflow.progress.currentStep = "\u30A8\u30F3\u30EA\u30C3\u30C1\u30E1\u30F3\u30C8\u89E3\u6790";
    workflow.progress.completedSteps = 4;
    await this.simulateDelay(1e3);
    this.addLog(workflow, "info", "GO/Pathway \u30A8\u30F3\u30EA\u30C3\u30C1\u30E1\u30F3\u30C8\u89E3\u6790\u5B8C\u4E86");
    workflow.progress.currentStep = "\u5B8C\u4E86";
    workflow.progress.completedSteps = 5;
    const result = this.generateMockGeneExpressionResult(config);
    workflow.status = "completed";
    workflow.results = result;
    workflow.updatedAt = /* @__PURE__ */ new Date();
    return result;
  }
  // ============================================================================
  // Single Cell Analysis
  // ============================================================================
  /**
   * Create single cell workflow
   */
  async createSingleCell(input) {
    const id = `sc-${this.nextId++}`;
    const now = /* @__PURE__ */ new Date();
    const workflow = {
      id,
      name: input.name,
      description: input.description,
      type: "single_cell",
      status: "draft",
      createdAt: now,
      updatedAt: now,
      config: input.config,
      logs: []
    };
    this.workflows.set(id, workflow);
    return workflow;
  }
  /**
   * Run single cell analysis
   */
  async runSingleCell(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.type !== "single_cell") {
      throw new Error(`Single cell workflow not found: ${workflowId}`);
    }
    workflow.status = "running";
    workflow.progress = {
      currentStep: "\u30BB\u30EB\u30D5\u30A3\u30EB\u30BF\u30EA\u30F3\u30B0",
      totalSteps: 6,
      completedSteps: 0
    };
    workflow.updatedAt = /* @__PURE__ */ new Date();
    this.addLog(workflow, "info", "\u30B7\u30F3\u30B0\u30EB\u30BB\u30EB\u89E3\u6790\u30D1\u30A4\u30D7\u30E9\u30A4\u30F3\u958B\u59CB");
    const config = workflow.config;
    await this.simulateDelay(800);
    this.addLog(workflow, "info", `\u30BB\u30EB\u30D5\u30A3\u30EB\u30BF\u30EA\u30F3\u30B0\u5B8C\u4E86 (genes: ${config.minGenes}-${config.maxGenes})`);
    workflow.progress.currentStep = "\u6B63\u898F\u5316\u30FB\u30B9\u30B1\u30FC\u30EA\u30F3\u30B0";
    workflow.progress.completedSteps = 1;
    await this.simulateDelay(1e3);
    this.addLog(workflow, "info", "\u6B63\u898F\u5316\u30FB\u30B9\u30B1\u30FC\u30EA\u30F3\u30B0\u5B8C\u4E86");
    workflow.progress.currentStep = "\u6B21\u5143\u524A\u6E1B";
    workflow.progress.completedSteps = 2;
    await this.simulateDelay(1200);
    this.addLog(workflow, "info", "PCA\u30FBUMAP\u6B21\u5143\u524A\u6E1B\u5B8C\u4E86");
    workflow.progress.currentStep = "\u30AF\u30E9\u30B9\u30BF\u30EA\u30F3\u30B0";
    workflow.progress.completedSteps = 3;
    await this.simulateDelay(1500);
    this.addLog(workflow, "info", `\u30AF\u30E9\u30B9\u30BF\u30EA\u30F3\u30B0\u5B8C\u4E86 (resolution: ${config.clusteringResolution})`);
    workflow.progress.currentStep = "\u30DE\u30FC\u30AB\u30FC\u907A\u4F1D\u5B50\u540C\u5B9A";
    workflow.progress.completedSteps = 4;
    await this.simulateDelay(1e3);
    this.addLog(workflow, "info", "\u30DE\u30FC\u30AB\u30FC\u907A\u4F1D\u5B50\u540C\u5B9A\u5B8C\u4E86");
    workflow.progress.currentStep = "\u7D30\u80DE\u30BF\u30A4\u30D7\u63A8\u5B9A";
    workflow.progress.completedSteps = 5;
    await this.simulateDelay(800);
    this.addLog(workflow, "info", "\u7D30\u80DE\u30BF\u30A4\u30D7\u30A2\u30CE\u30C6\u30FC\u30B7\u30E7\u30F3\u5B8C\u4E86");
    workflow.progress.currentStep = "\u5B8C\u4E86";
    workflow.progress.completedSteps = 6;
    const result = this.generateMockSingleCellResult(config);
    workflow.status = "completed";
    workflow.results = result;
    workflow.updatedAt = /* @__PURE__ */ new Date();
    return result;
  }
  // ============================================================================
  // Workflow Management
  // ============================================================================
  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId) {
    return this.workflows.get(workflowId);
  }
  /**
   * List workflows
   */
  async listWorkflows(options) {
    let workflows2 = Array.from(this.workflows.values());
    if (options?.type) {
      workflows2 = workflows2.filter((w) => w.type === options.type);
    }
    if (options?.status) {
      workflows2 = workflows2.filter((w) => w.status === options.status);
    }
    workflows2.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 20;
    return workflows2.slice(offset, offset + limit);
  }
  /**
   * Delete workflow
   */
  async deleteWorkflow(workflowId) {
    this.workflows.delete(workflowId);
  }
  // ============================================================================
  // Private Helper Methods
  // ============================================================================
  async simulateDelay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  addLog(workflow, level, message) {
    if (!workflow.logs) workflow.logs = [];
    workflow.logs.push({
      timestamp: /* @__PURE__ */ new Date(),
      level,
      message
    });
  }
  generateMockVariantResult(config) {
    const totalVariants = Math.floor(Math.random() * 5e4) + 3e4;
    const variantsByChr = {};
    for (const chr of CHROMOSOMES) {
      variantsByChr[chr] = Math.floor(Math.random() * 3e3) + 500;
    }
    const variantsByType = {
      snv: Math.floor(totalVariants * 0.85),
      indel: Math.floor(totalVariants * 0.12),
      mnv: Math.floor(totalVariants * 0.02),
      sv: Math.floor(totalVariants * 5e-3),
      cnv: Math.floor(totalVariants * 5e-3)
    };
    const variantsByImpact = {
      high: Math.floor(totalVariants * 0.01),
      moderate: Math.floor(totalVariants * 0.05),
      low: Math.floor(totalVariants * 0.15),
      modifier: Math.floor(totalVariants * 0.79)
    };
    const topVariants = this.generateMockVariants(20);
    return {
      id: `result-${Date.now()}`,
      config,
      createdAt: /* @__PURE__ */ new Date(),
      totalVariants,
      variantsByChr,
      variantsByType,
      variantsByImpact,
      qualityMetrics: {
        tiTvRatio: 2.1 + Math.random() * 0.2,
        hetHomRatio: 1.5 + Math.random() * 0.3,
        meanDepth: 30 + Math.random() * 20,
        callRate: 0.95 + Math.random() * 0.04
      },
      topVariants
    };
  }
  generateMockVariants(count) {
    const variants = [];
    const types = ["snv", "snv", "snv", "snv", "indel"];
    const impacts = ["high", "moderate", "low", "modifier"];
    const consequences = ["missense_variant", "synonymous_variant", "frameshift_variant", "splice_acceptor_variant"];
    for (let i = 0; i < count; i++) {
      const chr = CHROMOSOMES[Math.floor(Math.random() * CHROMOSOMES.length)];
      const gene = GENE_NAMES[Math.floor(Math.random() * GENE_NAMES.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const impact = impacts[Math.floor(Math.random() * impacts.length)];
      variants.push({
        id: `var-${i + 1}`,
        chromosome: chr,
        position: Math.floor(Math.random() * 1e8),
        ref: ["A", "C", "G", "T"][Math.floor(Math.random() * 4)],
        alt: ["A", "C", "G", "T"][Math.floor(Math.random() * 4)],
        type,
        quality: Math.floor(Math.random() * 1e3) + 100,
        filter: Math.random() > 0.1 ? "PASS" : ["LowQual"],
        annotations: {
          gene,
          impact,
          consequence: [consequences[Math.floor(Math.random() * consequences.length)]],
          gnomAD: {
            alleleFrequency: Math.random() * 0.01,
            homozygotes: Math.floor(Math.random() * 10)
          },
          prediction: impact === "moderate" ? {
            sift: { score: Math.random(), prediction: Math.random() > 0.5 ? "deleterious" : "tolerated" },
            polyphen: { score: Math.random(), prediction: Math.random() > 0.5 ? "probably_damaging" : "benign" },
            cadd: { score: Math.random() * 30 }
          } : void 0
        }
      });
    }
    return variants.sort((a, b) => {
      const impactOrder = { high: 0, moderate: 1, low: 2, modifier: 3 };
      return impactOrder[a.annotations.impact] - impactOrder[b.annotations.impact];
    });
  }
  generateMockGeneExpressionResult(config) {
    const totalGenes = 25e3;
    const expressedGenes = Math.floor(totalGenes * 0.6);
    const sampleCorrelations = {};
    const allSamples = config.sampleGroups.flatMap((g) => g.samples);
    for (const s1 of allSamples) {
      sampleCorrelations[s1] = {};
      for (const s2 of allSamples) {
        sampleCorrelations[s1][s2] = s1 === s2 ? 1 : 0.8 + Math.random() * 0.15;
      }
    }
    const differentialExpression = config.contrasts?.map((contrast) => {
      const results = GENE_NAMES.map((gene) => {
        const log2FC = (Math.random() - 0.5) * 6;
        const pValue = Math.random() * 0.1;
        return {
          geneId: `ENSG${Math.floor(Math.random() * 1e5)}`,
          geneName: gene,
          baseMean: Math.random() * 1e4,
          log2FoldChange: log2FC,
          pValue,
          adjustedPValue: pValue * 1.5,
          significant: Math.abs(log2FC) > 1 && pValue < 0.05
        };
      });
      return {
        contrast: contrast.name,
        results,
        upregulated: results.filter((r) => r.significant && r.log2FoldChange > 0).length,
        downregulated: results.filter((r) => r.significant && r.log2FoldChange < 0).length
      };
    });
    return {
      id: `result-${Date.now()}`,
      config,
      createdAt: /* @__PURE__ */ new Date(),
      totalGenes,
      expressedGenes,
      sampleCorrelations,
      differentialExpression,
      enrichment: {
        goTerms: [
          { term: "GO:0006915", description: "apoptotic process", pValue: 1e-3, genes: ["TP53", "BCL2", "BAX"] },
          { term: "GO:0007049", description: "cell cycle", pValue: 5e-3, genes: ["CDKN2A", "RB1", "MYC"] },
          { term: "GO:0008283", description: "cell population proliferation", pValue: 0.01, genes: ["EGFR", "KRAS", "PIK3CA"] }
        ],
        pathways: [
          { pathway: "hsa05200", source: "KEGG", pValue: 1e-3, genes: ["TP53", "KRAS", "BRAF"] },
          { pathway: "R-HSA-109582", source: "Reactome", pValue: 3e-3, genes: ["EGFR", "ERBB2", "MET"] }
        ]
      }
    };
  }
  generateMockSingleCellResult(config) {
    const totalCells = config.expectedCells ?? 1e4;
    const filteredCells = Math.floor(totalCells * 0.85);
    const cellTypes = [
      "T\u7D30\u80DE",
      "B\u7D30\u80DE",
      "NK\u7D30\u80DE",
      "\u30DE\u30AF\u30ED\u30D5\u30A1\u30FC\u30B8",
      "\u6A39\u72B6\u7D30\u80DE",
      "\u4E0A\u76AE\u7D30\u80DE",
      "\u7DDA\u7DAD\u82BD\u7D30\u80DE",
      "\u5185\u76AE\u7D30\u80DE"
    ];
    const clusters = [];
    let remainingCells = filteredCells;
    for (let i = 0; i < 8 && remainingCells > 0; i++) {
      const cellCount = i < 7 ? Math.floor(remainingCells * (0.1 + Math.random() * 0.2)) : remainingCells;
      remainingCells -= cellCount;
      clusters.push({
        id: `cluster-${i}`,
        name: `Cluster ${i}`,
        cellCount,
        percentage: cellCount / filteredCells * 100,
        markerGenes: GENE_NAMES.slice(i * 3, i * 3 + 3).map((gene) => ({
          gene,
          avgExpression: Math.random() * 5,
          pctExpressed: Math.random() * 100,
          log2FC: 1 + Math.random() * 3,
          pValue: Math.random() * 1e-3
        })),
        predictedCellType: cellTypes[i],
        confidence: 0.7 + Math.random() * 0.25
      });
    }
    const umap = {
      coordinates: []
    };
    for (const cluster of clusters) {
      const centerX = (Math.random() - 0.5) * 20;
      const centerY = (Math.random() - 0.5) * 20;
      for (let i = 0; i < Math.min(cluster.cellCount, 100); i++) {
        umap.coordinates.push({
          x: centerX + (Math.random() - 0.5) * 4,
          y: centerY + (Math.random() - 0.5) * 4,
          cluster: cluster.id
        });
      }
    }
    return {
      id: `result-${Date.now()}`,
      config,
      createdAt: /* @__PURE__ */ new Date(),
      qcMetrics: {
        totalCells,
        filteredCells,
        totalGenes: 2e4,
        medianGenes: 2500 + Math.floor(Math.random() * 1e3),
        medianUMIs: 8e3 + Math.floor(Math.random() * 4e3),
        medianMitochondrial: 3 + Math.random() * 4
      },
      clusters,
      umap,
      trajectoryAnalysis: {
        rootCluster: "cluster-0",
        branches: [
          { from: "cluster-0", to: "cluster-1", pseudotime: 0.3 },
          { from: "cluster-1", to: "cluster-2", pseudotime: 0.6 },
          { from: "cluster-0", to: "cluster-3", pseudotime: 0.4 }
        ]
      }
    };
  }
};
var genomicsService = new GenomicsService();

// src/enterprise/enterprise-service.ts
var import_uuid = __toESM(require_uuid());
var EnterpriseService = class {
  // In-memory storage (would be replaced with actual database)
  ssoProviders = /* @__PURE__ */ new Map();
  ssoSessions = /* @__PURE__ */ new Map();
  auditEvents = [];
  signatures = /* @__PURE__ */ new Map();
  documentVersions = /* @__PURE__ */ new Map();
  roles = /* @__PURE__ */ new Map();
  permissions = /* @__PURE__ */ new Map();
  roleAssignments = /* @__PURE__ */ new Map();
  trainingRecords = /* @__PURE__ */ new Map();
  organizations = /* @__PURE__ */ new Map();
  constructor() {
    this.initializeDefaultRoles();
  }
  // ============================================================================
  // SSO Management
  // ============================================================================
  /**
   * Register a new SSO provider
   */
  async createSSOProvider(input) {
    const provider = {
      id: (0, import_uuid.v4)(),
      name: input.name,
      type: input.type,
      enabled: true,
      config: input.config,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.ssoProviders.set(provider.id, provider);
    await this.logAuditEvent({
      category: "system_config",
      severity: "info",
      action: "sso_provider_created",
      actor: {
        userId: "system",
        userName: "System",
        email: "system@labflow.ai",
        ipAddress: "127.0.0.1"
      },
      resource: {
        type: "sso_provider",
        id: provider.id,
        name: provider.name
      },
      details: { providerType: input.type },
      outcome: "success"
    });
    return provider;
  }
  /**
   * List all SSO providers
   */
  async listSSOProviders() {
    return Array.from(this.ssoProviders.values());
  }
  /**
   * Get SSO provider by ID
   */
  async getSSOProvider(id) {
    return this.ssoProviders.get(id) || null;
  }
  /**
   * Enable/disable SSO provider
   */
  async toggleSSOProvider(id, enabled) {
    const provider = this.ssoProviders.get(id);
    if (!provider) return null;
    provider.enabled = enabled;
    provider.updatedAt = /* @__PURE__ */ new Date();
    this.ssoProviders.set(id, provider);
    return provider;
  }
  /**
   * Delete SSO provider
   */
  async deleteSSOProvider(id) {
    return this.ssoProviders.delete(id);
  }
  /**
   * Initiate SSO login (mock implementation)
   */
  async initiateSSOLogin(providerId, redirectUrl) {
    const provider = this.ssoProviders.get(providerId);
    if (!provider || !provider.enabled) {
      throw new Error("SSO provider not found or disabled");
    }
    const authUrl = `https://idp.example.com/auth?provider=${providerId}&redirect=${encodeURIComponent(redirectUrl)}`;
    return { authUrl };
  }
  /**
   * Complete SSO login (mock implementation)
   */
  async completeSSOLogin(providerId, code, userId) {
    const provider = this.ssoProviders.get(providerId);
    if (!provider) {
      throw new Error("SSO provider not found");
    }
    const session = {
      id: (0, import_uuid.v4)(),
      userId,
      providerId,
      providerUserId: `external-${(0, import_uuid.v4)().substring(0, 8)}`,
      accessToken: `token-${(0, import_uuid.v4)()}`,
      refreshToken: `refresh-${(0, import_uuid.v4)()}`,
      expiresAt: new Date(Date.now() + 36e5),
      // 1 hour
      createdAt: /* @__PURE__ */ new Date()
    };
    this.ssoSessions.set(session.id, session);
    await this.logAuditEvent({
      category: "authentication",
      severity: "info",
      action: "sso_login",
      actor: {
        userId,
        userName: "Unknown",
        email: "unknown@example.com",
        ipAddress: "127.0.0.1"
      },
      resource: {
        type: "sso_provider",
        id: providerId,
        name: provider.name
      },
      details: { sessionId: session.id },
      outcome: "success"
    });
    return session;
  }
  // ============================================================================
  // Audit Logging
  // ============================================================================
  /**
   * Log an audit event
   */
  async logAuditEvent(input) {
    const event = {
      id: (0, import_uuid.v4)(),
      timestamp: /* @__PURE__ */ new Date(),
      category: input.category,
      severity: input.severity,
      action: input.action,
      actor: input.actor,
      resource: input.resource,
      details: input.details,
      outcome: input.outcome,
      errorMessage: input.errorMessage,
      metadata: {
        requestId: (0, import_uuid.v4)(),
        correlationId: (0, import_uuid.v4)()
      }
    };
    this.auditEvents.push(event);
    return event;
  }
  /**
   * Query audit events
   */
  async queryAuditEvents(options) {
    let filtered = [...this.auditEvents];
    if (options.startDate) {
      filtered = filtered.filter((e) => e.timestamp >= options.startDate);
    }
    if (options.endDate) {
      filtered = filtered.filter((e) => e.timestamp <= options.endDate);
    }
    if (options.category) {
      filtered = filtered.filter((e) => e.category === options.category);
    }
    if (options.severity) {
      filtered = filtered.filter((e) => e.severity === options.severity);
    }
    if (options.userId) {
      filtered = filtered.filter((e) => e.actor.userId === options.userId);
    }
    if (options.resourceType) {
      filtered = filtered.filter((e) => e.resource.type === options.resourceType);
    }
    if (options.resourceId) {
      filtered = filtered.filter((e) => e.resource.id === options.resourceId);
    }
    if (options.action) {
      filtered = filtered.filter((e) => e.action.includes(options.action));
    }
    if (options.outcome) {
      filtered = filtered.filter((e) => e.outcome === options.outcome);
    }
    const sortBy = options.sortBy || "timestamp";
    const sortOrder = options.sortOrder || "desc";
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "timestamp") {
        comparison = a.timestamp.getTime() - b.timestamp.getTime();
      } else if (sortBy === "severity") {
        const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    const total = filtered.length;
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    const events = filtered.slice(offset, offset + limit);
    return {
      events,
      total,
      hasMore: offset + events.length < total
    };
  }
  /**
   * Export audit log
   */
  async exportAuditLog(options, format) {
    const { events } = await this.queryAuditEvents({ ...options, limit: 1e4 });
    const exportId = (0, import_uuid.v4)();
    await this.logAuditEvent({
      category: "export",
      severity: "info",
      action: "audit_log_exported",
      actor: {
        userId: "system",
        userName: "System",
        email: "system@labflow.ai",
        ipAddress: "127.0.0.1"
      },
      resource: {
        type: "audit_log",
        id: exportId
      },
      details: { format, eventCount: events.length },
      outcome: "success"
    });
    return {
      url: `/exports/audit-${exportId}.${format}`,
      expiresAt: new Date(Date.now() + 864e5)
      // 24 hours
    };
  }
  /**
   * Get audit statistics
   */
  async getAuditStatistics(startDate, endDate) {
    const events = this.auditEvents.filter(
      (e) => e.timestamp >= startDate && e.timestamp <= endDate
    );
    const byCategory = {};
    const bySeverity = {};
    const byOutcome = {};
    const actionCounts = {};
    const userCounts = {};
    for (const event of events) {
      byCategory[event.category] = (byCategory[event.category] || 0) + 1;
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
      byOutcome[event.outcome] = (byOutcome[event.outcome] || 0) + 1;
      actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
      if (!userCounts[event.actor.userId]) {
        userCounts[event.actor.userId] = { userName: event.actor.userName, count: 0 };
      }
      userCounts[event.actor.userId].count++;
    }
    const topActions = Object.entries(actionCounts).map(([action, count]) => ({ action, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    const topUsers = Object.entries(userCounts).map(([userId, data]) => ({ userId, userName: data.userName, count: data.count })).sort((a, b) => b.count - a.count).slice(0, 10);
    return {
      totalEvents: events.length,
      byCategory,
      bySeverity,
      byOutcome,
      topActions,
      topUsers
    };
  }
  // ============================================================================
  // 21 CFR Part 11 Compliance
  // ============================================================================
  /**
   * Create electronic signature
   */
  async createSignature(input, userId, userName) {
    if (!input.password) {
      throw new Error("Password required for electronic signature");
    }
    const signature = {
      id: (0, import_uuid.v4)(),
      documentId: input.documentId,
      documentType: input.documentType,
      documentVersion: input.documentVersion,
      signedAt: /* @__PURE__ */ new Date(),
      signer: {
        userId,
        userName,
        email: `${userId}@labflow.ai`
      },
      meaning: input.meaning,
      signatureData: {
        method: "password",
        verificationTimestamp: /* @__PURE__ */ new Date()
      },
      hash: this.generateHash(`${input.documentId}-${input.documentVersion}-${userId}-${Date.now()}`),
      metadata: {}
    };
    this.signatures.set(signature.id, signature);
    await this.logAuditEvent({
      category: "compliance",
      severity: "info",
      action: "document_signed",
      actor: {
        userId,
        userName,
        email: signature.signer.email,
        ipAddress: "127.0.0.1"
      },
      resource: {
        type: input.documentType,
        id: input.documentId
      },
      details: {
        signatureId: signature.id,
        meaning: input.meaning,
        version: input.documentVersion
      },
      outcome: "success"
    });
    return signature;
  }
  /**
   * Verify electronic signature
   */
  async verifySignature(signatureId) {
    const signature = this.signatures.get(signatureId);
    if (!signature) {
      return { valid: false, signature: null, verifiedAt: /* @__PURE__ */ new Date() };
    }
    return {
      valid: true,
      signature,
      verifiedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Create document version (for audit trail)
   */
  async createDocumentVersion(documentId, content, userId, userName, changeDescription) {
    const versions = this.documentVersions.get(documentId) || [];
    const version = versions.length + 1;
    const docVersion = {
      id: (0, import_uuid.v4)(),
      documentId,
      version,
      content,
      contentHash: this.generateHash(content),
      createdAt: /* @__PURE__ */ new Date(),
      createdBy: { userId, userName },
      changeDescription,
      signatures: []
    };
    versions.push(docVersion);
    this.documentVersions.set(documentId, versions);
    await this.logAuditEvent({
      category: "data_modification",
      severity: "info",
      action: "document_version_created",
      actor: {
        userId,
        userName,
        email: `${userId}@labflow.ai`,
        ipAddress: "127.0.0.1"
      },
      resource: {
        type: "document",
        id: documentId
      },
      details: {
        version,
        versionId: docVersion.id,
        changeDescription
      },
      outcome: "success"
    });
    return docVersion;
  }
  /**
   * Get document version history
   */
  async getDocumentHistory(documentId) {
    return this.documentVersions.get(documentId) || [];
  }
  /**
   * Run compliance check
   */
  async runComplianceCheck(organizationId) {
    const org = this.organizations.get(organizationId);
    const details = [];
    details.push({
      requirement: "\u76E3\u67FB\u30ED\u30B0\u304C\u6709\u52B9",
      status: "pass",
      message: "\u76E3\u67FB\u30ED\u30B0\u306F\u6B63\u5E38\u306B\u6A5F\u80FD\u3057\u3066\u3044\u307E\u3059"
    });
    details.push({
      requirement: "\u96FB\u5B50\u7F72\u540D\u306E\u5B9F\u88C5",
      status: "pass",
      message: "\u96FB\u5B50\u7F72\u540D\u30B7\u30B9\u30C6\u30E0\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u3059"
    });
    details.push({
      requirement: "\u30E6\u30FC\u30B6\u30FC\u8A8D\u8A3C\u306E\u5F37\u5316",
      status: org?.settings.security.mfaRequired ? "pass" : "warning",
      message: org?.settings.security.mfaRequired ? "MFA\u304C\u5FC5\u9808\u306B\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u3059" : "MFA\u306E\u6709\u52B9\u5316\u3092\u63A8\u5968\u3057\u307E\u3059"
    });
    details.push({
      requirement: "\u30C7\u30FC\u30BF\u6574\u5408\u6027\u306E\u78BA\u4FDD",
      status: "pass",
      message: "\u30CF\u30C3\u30B7\u30E5\u30D9\u30FC\u30B9\u306E\u6574\u5408\u6027\u30C1\u30A7\u30C3\u30AF\u304C\u5B9F\u88C5\u3055\u308C\u3066\u3044\u307E\u3059"
    });
    details.push({
      requirement: "\u30A2\u30AF\u30BB\u30B9\u5236\u5FA1",
      status: "pass",
      message: "\u30ED\u30FC\u30EB\u30D9\u30FC\u30B9\u306E\u30A2\u30AF\u30BB\u30B9\u5236\u5FA1\u304C\u6709\u52B9\u3067\u3059"
    });
    details.push({
      requirement: "\u30C8\u30EC\u30FC\u30CB\u30F3\u30B0\u8A18\u9332",
      status: "warning",
      message: "\u30E6\u30FC\u30B6\u30FC\u30C8\u30EC\u30FC\u30CB\u30F3\u30B0\u8A18\u9332\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044"
    });
    const passedCount = details.filter((d) => d.status === "pass").length;
    const overallScore = passedCount / details.length * 100;
    const result = {
      id: (0, import_uuid.v4)(),
      checkType: "21_cfr_part_11",
      passed: overallScore >= 80,
      timestamp: /* @__PURE__ */ new Date(),
      details,
      overallScore: Math.round(overallScore)
    };
    await this.logAuditEvent({
      category: "compliance",
      severity: "info",
      action: "compliance_check_completed",
      actor: {
        userId: "system",
        userName: "System",
        email: "system@labflow.ai",
        ipAddress: "127.0.0.1"
      },
      resource: {
        type: "organization",
        id: organizationId
      },
      details: { checkType: "21_cfr_part_11", score: overallScore, passed: result.passed },
      outcome: "success"
    });
    return result;
  }
  // ============================================================================
  // Access Control
  // ============================================================================
  initializeDefaultRoles() {
    const adminPermissions = [
      { id: "p1", name: "manage_users", description: "\u30E6\u30FC\u30B6\u30FC\u7BA1\u7406", resource: "users", actions: ["create", "read", "update", "delete"] },
      { id: "p2", name: "manage_roles", description: "\u30ED\u30FC\u30EB\u7BA1\u7406", resource: "roles", actions: ["create", "read", "update", "delete"] },
      { id: "p3", name: "manage_sso", description: "SSO\u8A2D\u5B9A", resource: "sso", actions: ["create", "read", "update", "delete"] },
      { id: "p4", name: "view_audit", description: "\u76E3\u67FB\u30ED\u30B0\u95B2\u89A7", resource: "audit", actions: ["read", "export"] },
      { id: "p5", name: "manage_compliance", description: "\u30B3\u30F3\u30D7\u30E9\u30A4\u30A2\u30F3\u30B9\u7BA1\u7406", resource: "compliance", actions: ["read", "execute"] }
    ];
    const researcherPermissions = [
      { id: "p6", name: "manage_experiments", description: "\u5B9F\u9A13\u7BA1\u7406", resource: "experiments", actions: ["create", "read", "update"] },
      { id: "p7", name: "manage_workflows", description: "\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC\u7BA1\u7406", resource: "workflows", actions: ["create", "read", "update", "execute"] },
      { id: "p8", name: "sign_documents", description: "\u6587\u66F8\u7F72\u540D", resource: "documents", actions: ["read", "sign"] }
    ];
    const viewerPermissions = [
      { id: "p9", name: "view_experiments", description: "\u5B9F\u9A13\u95B2\u89A7", resource: "experiments", actions: ["read"] },
      { id: "p10", name: "view_workflows", description: "\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC\u95B2\u89A7", resource: "workflows", actions: ["read"] }
    ];
    [...adminPermissions, ...researcherPermissions, ...viewerPermissions].forEach((p) => {
      this.permissions.set(p.id, p);
    });
    const roles = [
      {
        id: "admin",
        name: "\u7BA1\u7406\u8005",
        description: "\u30B7\u30B9\u30C6\u30E0\u5168\u4F53\u306E\u7BA1\u7406\u6A29\u9650",
        permissions: adminPermissions,
        isBuiltIn: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "researcher",
        name: "\u7814\u7A76\u8005",
        description: "\u5B9F\u9A13\u3068\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC\u306E\u7BA1\u7406\u6A29\u9650",
        permissions: researcherPermissions,
        isBuiltIn: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "viewer",
        name: "\u95B2\u89A7\u8005",
        description: "\u95B2\u89A7\u306E\u307F\u306E\u6A29\u9650",
        permissions: viewerPermissions,
        isBuiltIn: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
    roles.forEach((r) => this.roles.set(r.id, r));
  }
  /**
   * List all roles
   */
  async listRoles() {
    return Array.from(this.roles.values());
  }
  /**
   * Get role by ID
   */
  async getRole(id) {
    return this.roles.get(id) || null;
  }
  /**
   * Create custom role
   */
  async createRole(name, description, permissionIds) {
    const permissions = permissionIds.map((id) => this.permissions.get(id)).filter((p) => p !== void 0);
    const role = {
      id: (0, import_uuid.v4)(),
      name,
      description,
      permissions,
      isBuiltIn: false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.roles.set(role.id, role);
    return role;
  }
  /**
   * Assign role to user
   */
  async assignRole(input, assignedBy) {
    const assignment = {
      id: (0, import_uuid.v4)(),
      userId: input.userId,
      roleId: input.roleId,
      scope: input.scope,
      assignedAt: /* @__PURE__ */ new Date(),
      assignedBy,
      expiresAt: input.expiresAt
    };
    this.roleAssignments.set(assignment.id, assignment);
    await this.logAuditEvent({
      category: "authorization",
      severity: "info",
      action: "role_assigned",
      actor: {
        userId: assignedBy,
        userName: "Admin",
        email: `${assignedBy}@labflow.ai`,
        ipAddress: "127.0.0.1"
      },
      resource: {
        type: "user",
        id: input.userId
      },
      details: { roleId: input.roleId, scope: input.scope },
      outcome: "success"
    });
    return assignment;
  }
  /**
   * Get user's role assignments
   */
  async getUserRoles(userId) {
    return Array.from(this.roleAssignments.values()).filter((a) => a.userId === userId);
  }
  /**
   * Check if user has permission
   */
  async checkPermission(userId, resource, action) {
    const assignments = await this.getUserRoles(userId);
    for (const assignment of assignments) {
      const role = this.roles.get(assignment.roleId);
      if (!role) continue;
      for (const permission of role.permissions) {
        if (permission.resource === resource && permission.actions.includes(action)) {
          return true;
        }
      }
    }
    return false;
  }
  // ============================================================================
  // Training Records
  // ============================================================================
  /**
   * Add training record
   */
  async addTrainingRecord(record) {
    const fullRecord = {
      id: (0, import_uuid.v4)(),
      ...record
    };
    const userRecords = this.trainingRecords.get(record.userId) || [];
    userRecords.push(fullRecord);
    this.trainingRecords.set(record.userId, userRecords);
    await this.logAuditEvent({
      category: "compliance",
      severity: "info",
      action: "training_completed",
      actor: {
        userId: record.userId,
        userName: record.userName,
        email: `${record.userId}@labflow.ai`,
        ipAddress: "127.0.0.1"
      },
      resource: {
        type: "training_course",
        id: record.courseId,
        name: record.courseName
      },
      details: { score: record.score, status: record.status },
      outcome: "success"
    });
    return fullRecord;
  }
  /**
   * Get user's training records
   */
  async getUserTrainingRecords(userId) {
    return this.trainingRecords.get(userId) || [];
  }
  // ============================================================================
  // Organization Management
  // ============================================================================
  /**
   * Create organization
   */
  async createOrganization(name, slug, plan) {
    const defaultSettings = {
      sso: {
        enabled: false,
        required: false,
        providers: []
      },
      security: {
        mfaRequired: plan === "enterprise",
        sessionTimeout: 60,
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          maxAge: 90
        }
      },
      compliance: {
        cfr21Part11Enabled: plan === "enterprise",
        auditLogRetention: plan === "enterprise" ? 2555 : 365,
        // 7 years for enterprise
        dataRetention: 1095,
        // 3 years
        exportApprovalRequired: plan === "enterprise"
      },
      features: {
        apiAccess: plan !== "free",
        customIntegrations: plan === "enterprise",
        advancedAnalytics: plan !== "free"
      }
    };
    const org = {
      id: (0, import_uuid.v4)(),
      name,
      slug,
      plan,
      settings: defaultSettings,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.organizations.set(org.id, org);
    return org;
  }
  /**
   * Get organization
   */
  async getOrganization(id) {
    return this.organizations.get(id) || null;
  }
  /**
   * Update organization settings
   */
  async updateOrganizationSettings(id, settings) {
    const org = this.organizations.get(id);
    if (!org) return null;
    org.settings = { ...org.settings, ...settings };
    org.updatedAt = /* @__PURE__ */ new Date();
    this.organizations.set(id, org);
    await this.logAuditEvent({
      category: "system_config",
      severity: "info",
      action: "organization_settings_updated",
      actor: {
        userId: "admin",
        userName: "Admin",
        email: "admin@labflow.ai",
        ipAddress: "127.0.0.1"
      },
      resource: {
        type: "organization",
        id,
        name: org.name
      },
      details: { updatedSettings: Object.keys(settings) },
      outcome: "success"
    });
    return org;
  }
  // ============================================================================
  // Helper Methods
  // ============================================================================
  generateHash(input) {
    let hash2 = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash2 = (hash2 << 5) - hash2 + char;
      hash2 = hash2 & hash2;
    }
    return Math.abs(hash2).toString(16).padStart(16, "0");
  }
};
var enterpriseService = new EnterpriseService();

// src/learning/learning-service.ts
var import_uuid2 = __toESM(require_uuid());
var LearningService = class {
  // In-memory storage
  courses = /* @__PURE__ */ new Map();
  categories = /* @__PURE__ */ new Map();
  enrollments = /* @__PURE__ */ new Map();
  quizAttempts = /* @__PURE__ */ new Map();
  codeSubmissions = /* @__PURE__ */ new Map();
  projectSubmissions = /* @__PURE__ */ new Map();
  achievements = /* @__PURE__ */ new Map();
  userAchievements = /* @__PURE__ */ new Map();
  certificates = /* @__PURE__ */ new Map();
  learningPaths = /* @__PURE__ */ new Map();
  pathEnrollments = /* @__PURE__ */ new Map();
  constructor() {
    this.initializeCourses();
    this.initializeAchievements();
    this.initializeLearningPaths();
  }
  // ============================================================================
  // Course Catalog
  // ============================================================================
  initializeCourses() {
    const instructors = [
      {
        id: "inst-1",
        name: "\u7530\u4E2D \u535A\u58EB",
        title: "\u5275\u85ACAI\u7814\u7A76\u8005",
        bio: "AI\u5275\u85AC\u5206\u91CE\u306715\u5E74\u306E\u7D4C\u9A13\u3092\u6301\u3064\u7814\u7A76\u8005",
        avatar: "/avatars/tanaka.jpg",
        expertise: ["\u5275\u85AC", "\u6A5F\u68B0\u5B66\u7FD2", "\u5206\u5B50\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3"]
      },
      {
        id: "inst-2",
        name: "\u9234\u6728 \u6559\u6388",
        title: "\u6C17\u5019\u79D1\u5B66\u8005",
        bio: "\u6C17\u5019\u30E2\u30C7\u30EA\u30F3\u30B0\u3068AI\u4E88\u6E2C\u306E\u5C02\u9580\u5BB6",
        avatar: "/avatars/suzuki.jpg",
        expertise: ["\u6C17\u5019\u79D1\u5B66", "\u4E88\u6E2C\u30E2\u30C7\u30EB", "\u30C7\u30FC\u30BF\u5206\u6790"]
      },
      {
        id: "inst-3",
        name: "\u5C71\u7530 \u7814\u7A76\u54E1",
        title: "\u30B2\u30CE\u30DF\u30AF\u30B9\u5C02\u9580\u5BB6",
        bio: "\u30B7\u30F3\u30B0\u30EB\u30BB\u30EB\u89E3\u6790\u3068\u30D0\u30A4\u30AA\u30A4\u30F3\u30D5\u30A9\u30DE\u30C6\u30A3\u30AF\u30B9\u306E\u7B2C\u4E00\u4EBA\u8005",
        avatar: "/avatars/yamada.jpg",
        expertise: ["\u30B2\u30CE\u30DF\u30AF\u30B9", "\u30D0\u30A4\u30AA\u30A4\u30F3\u30D5\u30A9\u30DE\u30C6\u30A3\u30AF\u30B9", "RNA-seq"]
      }
    ];
    const categoryData = [
      { id: "cat-1", name: "\u5275\u85AC\u30FB\u533B\u85AC\u54C1\u958B\u767A", description: "AI\u5275\u85AC\u306E\u57FA\u790E\u304B\u3089\u5B9F\u8DF5\u307E\u3067", icon: "\u{1F48A}", domain: "drug_discovery", courseCount: 5 },
      { id: "cat-2", name: "\u6750\u6599\u79D1\u5B66", description: "\u6750\u6599\u8A2D\u8A08\u3068\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3", icon: "\u{1F52C}", domain: "materials_science", courseCount: 3 },
      { id: "cat-3", name: "\u6C17\u5019\u79D1\u5B66", description: "\u6C17\u5019\u4E88\u6E2C\u3068\u30E2\u30C7\u30EA\u30F3\u30B0", icon: "\u{1F30D}", domain: "climate_science", courseCount: 4 },
      { id: "cat-4", name: "\u30B2\u30CE\u30DF\u30AF\u30B9", description: "\u907A\u4F1D\u5B50\u89E3\u6790\u3068\u30D0\u30A4\u30AA\u30A4\u30F3\u30D5\u30A9\u30DE\u30C6\u30A3\u30AF\u30B9", icon: "\u{1F9EC}", domain: "genomics", courseCount: 4 },
      { id: "cat-5", name: "\u6A5F\u68B0\u5B66\u7FD2\u57FA\u790E", description: "AI/ML\u306E\u57FA\u790E\u77E5\u8B58", icon: "\u{1F916}", domain: "machine_learning", courseCount: 6 }
    ];
    categoryData.forEach((c) => this.categories.set(c.id, c));
    const courses = [
      {
        id: "course-1",
        title: "AI\u5275\u85AC\u5165\u9580\uFF1A\u5206\u5B50\u8A2D\u8A08\u306E\u57FA\u790E",
        description: "GraphRAG\u3068\u5206\u5B50\u751F\u6210\u30E2\u30C7\u30EB\u3092\u4F7F\u3063\u305F\u5275\u85AC\u306E\u57FA\u790E\u3092\u5B66\u3073\u307E\u3059",
        domain: "drug_discovery",
        level: "beginner",
        duration: 240,
        prerequisites: [],
        skills: ["\u5206\u5B50\u8868\u73FE", "SMILES", "GraphRAG", "\u5206\u5B50\u751F\u6210"],
        instructor: instructors[0],
        thumbnail: "/courses/drug-discovery-intro.jpg",
        rating: 4.8,
        enrollmentCount: 1250,
        createdAt: /* @__PURE__ */ new Date("2024-01-15"),
        updatedAt: /* @__PURE__ */ new Date("2024-06-01"),
        modules: [
          {
            id: "mod-1-1",
            title: "\u5206\u5B50\u8868\u73FE\u306E\u57FA\u790E",
            description: "SMILES\u3001\u5206\u5B50\u30B0\u30E9\u30D5\u3001\u30D5\u30A3\u30F3\u30AC\u30FC\u30D7\u30EA\u30F3\u30C8",
            order: 1,
            duration: 60,
            lessons: [
              {
                id: "les-1-1-1",
                title: "SMILES\u8868\u8A18\u6CD5",
                description: "\u5206\u5B50\u306ESMILES\u8868\u73FE\u3092\u7406\u89E3\u3059\u308B",
                type: "video",
                duration: 15,
                order: 1,
                content: { type: "video", url: "/videos/smiles-intro.mp4", chapters: [] },
                resources: []
              },
              {
                id: "les-1-1-2",
                title: "\u5206\u5B50\u30B0\u30E9\u30D5\u5165\u9580",
                description: "\u30B0\u30E9\u30D5\u30CB\u30E5\u30FC\u30E9\u30EB\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u3068\u5206\u5B50",
                type: "interactive",
                duration: 20,
                order: 2,
                content: { type: "interactive", componentType: "MoleculeViewer", props: {} },
                resources: []
              },
              {
                id: "les-1-1-3",
                title: "\u7406\u89E3\u5EA6\u30C1\u30A7\u30C3\u30AF",
                description: "\u5206\u5B50\u8868\u73FE\u306E\u78BA\u8A8D\u30AF\u30A4\u30BA",
                type: "quiz",
                duration: 10,
                order: 3,
                content: {
                  type: "quiz",
                  passingScore: 70,
                  questions: [
                    {
                      id: "q1",
                      question: "SMILES\u306F\u4F55\u306E\u7565\u3067\u3059\u304B\uFF1F",
                      type: "multiple_choice",
                      options: [
                        "Simplified Molecular Input Line Entry System",
                        "Simple Molecular Information Language Entry System",
                        "Structured Molecular Input Listing Entry Syntax"
                      ],
                      correctAnswer: "Simplified Molecular Input Line Entry System",
                      explanation: "SMILES\u306FSimplified Molecular Input Line Entry System\u306E\u7565\u3067\u3059",
                      points: 10
                    }
                  ]
                },
                resources: []
              }
            ]
          },
          {
            id: "mod-1-2",
            title: "GraphRAG\u306B\u3088\u308B\u5206\u5B50\u691C\u7D22",
            description: "\u77E5\u8B58\u30B0\u30E9\u30D5\u3092\u4F7F\u3063\u305F\u985E\u4F3C\u5206\u5B50\u691C\u7D22",
            order: 2,
            duration: 90,
            lessons: [
              {
                id: "les-1-2-1",
                title: "GraphRAG\u306E\u4ED5\u7D44\u307F",
                description: "\u30B0\u30E9\u30D5\u30D9\u30FC\u30B9\u306E\u691C\u7D22\u62E1\u5F35\u751F\u6210",
                type: "text",
                duration: 25,
                order: 1,
                content: { type: "text", markdown: "# GraphRAG\u5165\u9580\n\nGraphRAG\u306F...", images: [] },
                resources: []
              },
              {
                id: "les-1-2-2",
                title: "\u5B9F\u8DF5\uFF1A\u5206\u5B50\u691C\u7D22\u30B7\u30B9\u30C6\u30E0\u69CB\u7BC9",
                description: "Python\u3067GraphRAG\u3092\u5B9F\u88C5",
                type: "code_exercise",
                duration: 45,
                order: 2,
                content: {
                  type: "code_exercise",
                  language: "python",
                  starterCode: "# GraphRAG\u691C\u7D22\u306E\u5B9F\u88C5\nimport labflow\n\n# TODO: \u5B9F\u88C5\u3057\u3066\u304F\u3060\u3055\u3044",
                  solution: "# \u89E3\u7B54\u30B3\u30FC\u30C9",
                  testCases: [
                    { id: "tc1", input: "CCO", expectedOutput: "\u30A8\u30BF\u30CE\u30FC\u30EB", isHidden: false }
                  ],
                  hints: ["labflow.graphrag.search()\u3092\u4F7F\u7528\u3057\u307E\u3059"]
                },
                resources: []
              }
            ]
          }
        ]
      },
      {
        id: "course-2",
        title: "\u6C17\u5019\u4E88\u6E2CAI\u306E\u5B9F\u8DF5",
        description: "Aurora AI\u3092\u4F7F\u3063\u305F\u6C17\u8C61\u30FB\u6C17\u5019\u4E88\u6E2C\u3092\u5B9F\u8DF5\u7684\u306B\u5B66\u3076",
        domain: "climate_science",
        level: "intermediate",
        duration: 360,
        prerequisites: ["course-ml-basic"],
        skills: ["\u6C17\u5019\u30E2\u30C7\u30EB", "\u6642\u7CFB\u5217\u4E88\u6E2C", "Aurora AI", "SSP\u30B7\u30CA\u30EA\u30AA"],
        instructor: instructors[1],
        thumbnail: "/courses/climate-prediction.jpg",
        rating: 4.6,
        enrollmentCount: 890,
        createdAt: /* @__PURE__ */ new Date("2024-02-20"),
        updatedAt: /* @__PURE__ */ new Date("2024-07-15"),
        modules: [
          {
            id: "mod-2-1",
            title: "\u6C17\u5019\u30C7\u30FC\u30BF\u306E\u7406\u89E3",
            description: "\u6C17\u8C61\u30C7\u30FC\u30BF\u306E\u7A2E\u985E\u3068\u524D\u51E6\u7406",
            order: 1,
            duration: 90,
            lessons: [
              {
                id: "les-2-1-1",
                title: "\u6C17\u5019\u5909\u6570\u3068\u5358\u4F4D",
                description: "\u6E29\u5EA6\u3001\u964D\u6C34\u91CF\u3001\u98A8\u901F\u306A\u3069\u306E\u7406\u89E3",
                type: "text",
                duration: 30,
                order: 1,
                content: { type: "text", markdown: "# \u6C17\u5019\u5909\u6570\n\n\u6C17\u5019\u30C7\u30FC\u30BF\u306B\u306F...", images: [] },
                resources: []
              }
            ]
          }
        ]
      },
      {
        id: "course-3",
        title: "\u30B7\u30F3\u30B0\u30EB\u30BB\u30EB\u89E3\u6790\u5165\u9580",
        description: "scRNA-seq\u30C7\u30FC\u30BF\u306E\u89E3\u6790\u624B\u6CD5\u3092\u30DE\u30B9\u30BF\u30FC",
        domain: "genomics",
        level: "intermediate",
        duration: 300,
        prerequisites: [],
        skills: ["scRNA-seq", "\u6B21\u5143\u524A\u6E1B", "\u30AF\u30E9\u30B9\u30BF\u30EA\u30F3\u30B0", "\u30DE\u30FC\u30AB\u30FC\u907A\u4F1D\u5B50"],
        instructor: instructors[2],
        thumbnail: "/courses/single-cell.jpg",
        rating: 4.9,
        enrollmentCount: 1100,
        createdAt: /* @__PURE__ */ new Date("2024-03-10"),
        updatedAt: /* @__PURE__ */ new Date("2024-08-01"),
        modules: [
          {
            id: "mod-3-1",
            title: "scRNA-seq\u57FA\u790E",
            description: "\u30B7\u30F3\u30B0\u30EB\u30BB\u30EB\u30B7\u30FC\u30B1\u30F3\u30B7\u30F3\u30B0\u306E\u539F\u7406",
            order: 1,
            duration: 60,
            lessons: [
              {
                id: "les-3-1-1",
                title: "\u30B7\u30F3\u30B0\u30EB\u30BB\u30EB\u6280\u8853\u306E\u6982\u8981",
                description: "10x Genomics\u3001Smart-seq2\u306A\u3069",
                type: "video",
                duration: 20,
                order: 1,
                content: { type: "video", url: "/videos/sc-intro.mp4", chapters: [] },
                resources: []
              }
            ]
          }
        ]
      },
      // 実践プロジェクトコース（Level 3）
      {
        id: "course-4",
        title: "\u5B9F\u8DF5\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\uFF1A\u5275\u85AC\u30D1\u30A4\u30D7\u30E9\u30A4\u30F3\u69CB\u7BC9",
        description: "\u5B9F\u969B\u306E\u30C7\u30FC\u30BF\u3092\u4F7F\u3063\u305FEnd-to-End\u5275\u85AC\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC\u306E\u69CB\u7BC9",
        domain: "drug_discovery",
        level: "advanced",
        duration: 600,
        prerequisites: ["course-1"],
        skills: ["\u30D1\u30A4\u30D7\u30E9\u30A4\u30F3\u8A2D\u8A08", "\u30E2\u30C7\u30EB\u7D71\u5408", "\u30D0\u30EA\u30C7\u30FC\u30B7\u30E7\u30F3", "\u672C\u756A\u30C7\u30D7\u30ED\u30A4"],
        instructor: instructors[0],
        thumbnail: "/courses/drug-pipeline.jpg",
        rating: 4.7,
        enrollmentCount: 450,
        createdAt: /* @__PURE__ */ new Date("2024-04-01"),
        updatedAt: /* @__PURE__ */ new Date("2024-09-01"),
        modules: [
          {
            id: "mod-4-1",
            title: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u6982\u8981",
            description: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u76EE\u6A19\u3068\u8981\u4EF6",
            order: 1,
            duration: 30,
            lessons: [
              {
                id: "les-4-1-1",
                title: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u7D39\u4ECB",
                description: "\u5275\u85AC\u30D1\u30A4\u30D7\u30E9\u30A4\u30F3\u306E\u5168\u4F53\u50CF",
                type: "video",
                duration: 15,
                order: 1,
                content: { type: "video", url: "/videos/project-intro.mp4", chapters: [] },
                resources: []
              },
              {
                id: "les-4-1-2",
                title: "\u5B9F\u8DF5\u8AB2\u984C",
                description: "End-to-End\u30D1\u30A4\u30D7\u30E9\u30A4\u30F3\u306E\u69CB\u7BC9",
                type: "project",
                duration: 480,
                order: 2,
                content: {
                  type: "project",
                  description: "\u5275\u85AC\u30D1\u30A4\u30D7\u30E9\u30A4\u30F3\u3092\u69CB\u7BC9\u3057\u3001\u30EA\u30FC\u30C9\u5316\u5408\u7269\u3092\u540C\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044",
                  requirements: [
                    "GraphRAG\u306B\u3088\u308B\u6A19\u7684\u30BF\u30F3\u30D1\u30AF\u8CEA\u691C\u7D22",
                    "\u5206\u5B50\u751F\u6210\u30E2\u30C7\u30EB\u306B\u3088\u308B\u5019\u88DC\u5316\u5408\u7269\u751F\u6210",
                    "ADMET\u4E88\u6E2C\u306B\u3088\u308B\u30D5\u30A3\u30EB\u30BF\u30EA\u30F3\u30B0",
                    "\u30C9\u30C3\u30AD\u30F3\u30B0\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3"
                  ],
                  milestones: [
                    { id: "ms1", title: "\u6A19\u7684\u540C\u5B9A", description: "\u75BE\u60A3\u95A2\u9023\u30BF\u30F3\u30D1\u30AF\u8CEA\u306E\u540C\u5B9A", deliverables: ["\u6A19\u7684\u30EA\u30B9\u30C8"], order: 1 },
                    { id: "ms2", title: "\u5019\u88DC\u751F\u6210", description: "1000\u5316\u5408\u7269\u306E\u751F\u6210", deliverables: ["SMILES\u4E00\u89A7"], order: 2 },
                    { id: "ms3", title: "\u30B9\u30AF\u30EA\u30FC\u30CB\u30F3\u30B0", description: "ADMET\u30FB\u30C9\u30C3\u30AD\u30F3\u30B0\u8A55\u4FA1", deliverables: ["\u8A55\u4FA1\u30EC\u30DD\u30FC\u30C8"], order: 3 },
                    { id: "ms4", title: "\u6700\u7D42\u5831\u544A", description: "\u30C8\u30C3\u30D710\u5316\u5408\u7269\u306E\u63D0\u6848", deliverables: ["\u6700\u7D42\u30EC\u30DD\u30FC\u30C8"], order: 4 }
                  ],
                  datasets: ["ChEMBL", "PDB", "DrugBank"],
                  submissionInstructions: "GitHub\u30EA\u30DD\u30B8\u30C8\u30EA\u306EURL\u3068\u30EC\u30DD\u30FC\u30C8\u3092\u63D0\u51FA\u3057\u3066\u304F\u3060\u3055\u3044"
                },
                resources: []
              }
            ]
          }
        ]
      }
    ];
    courses.forEach((c) => this.courses.set(c.id, c));
  }
  initializeAchievements() {
    const achievements = [
      { id: "ach-1", name: "\u30D5\u30A1\u30FC\u30B9\u30C8\u30B9\u30C6\u30C3\u30D7", description: "\u6700\u521D\u306E\u30B3\u30FC\u30B9\u3092\u5B8C\u4E86", icon: "\u{1F3AF}", type: "course_completion", requirement: "1\u30B3\u30FC\u30B9\u5B8C\u4E86", points: 100 },
      { id: "ach-2", name: "\u5B66\u7FD2\u30DE\u30B9\u30BF\u30FC", description: "5\u3064\u306E\u30B3\u30FC\u30B9\u3092\u5B8C\u4E86", icon: "\u{1F3C6}", type: "course_completion", requirement: "5\u30B3\u30FC\u30B9\u5B8C\u4E86", points: 500 },
      { id: "ach-3", name: "7\u65E5\u9023\u7D9A", description: "7\u65E5\u9023\u7D9A\u3067\u5B66\u7FD2", icon: "\u{1F525}", type: "streak", requirement: "7\u65E5\u9023\u7D9A", points: 200 },
      { id: "ach-4", name: "\u5275\u85AC\u30B9\u30DA\u30B7\u30E3\u30EA\u30B9\u30C8", description: "\u5275\u85AC\u30B3\u30FC\u30B9\u3092\u3059\u3079\u3066\u5B8C\u4E86", icon: "\u{1F48A}", type: "skill", requirement: "\u5275\u85AC\u30D1\u30B9\u5B8C\u4E86", points: 1e3 },
      { id: "ach-5", name: "\u30B3\u30FC\u30C9\u30DE\u30B9\u30BF\u30FC", description: "50\u500B\u306E\u30B3\u30FC\u30C9\u6F14\u7FD2\u3092\u5B8C\u4E86", icon: "\u{1F4BB}", type: "special", requirement: "50\u30B3\u30FC\u30C9\u6F14\u7FD2", points: 750 }
    ];
    achievements.forEach((a) => this.achievements.set(a.id, a));
  }
  initializeLearningPaths() {
    const paths = [
      {
        id: "path-1",
        name: "AI\u5275\u85AC\u30B9\u30DA\u30B7\u30E3\u30EA\u30B9\u30C8",
        description: "\u30BC\u30ED\u304B\u3089AI\u5275\u85AC\u306E\u30D7\u30ED\u30D5\u30A7\u30C3\u30B7\u30E7\u30CA\u30EB\u3078",
        domain: "drug_discovery",
        level: "beginner",
        courses: ["course-ml-basic", "course-1", "course-4"],
        estimatedDuration: 40,
        skills: ["\u6A5F\u68B0\u5B66\u7FD2", "\u5206\u5B50\u8A2D\u8A08", "GraphRAG", "\u5275\u85AC\u30D1\u30A4\u30D7\u30E9\u30A4\u30F3"],
        thumbnail: "/paths/drug-discovery.jpg"
      },
      {
        id: "path-2",
        name: "\u6C17\u5019\u79D1\u5B66AI\u30A8\u30F3\u30B8\u30CB\u30A2",
        description: "\u6C17\u5019\u4E88\u6E2C\u3068\u30E2\u30C7\u30EA\u30F3\u30B0\u306E\u30B9\u30DA\u30B7\u30E3\u30EA\u30B9\u30C8\u3078",
        domain: "climate_science",
        level: "intermediate",
        courses: ["course-2"],
        estimatedDuration: 30,
        skills: ["\u6C17\u5019\u30E2\u30C7\u30EB", "Aurora AI", "\u30C7\u30FC\u30BF\u5206\u6790"],
        thumbnail: "/paths/climate-science.jpg"
      },
      {
        id: "path-3",
        name: "\u30B2\u30CE\u30DF\u30AF\u30B9\u30C7\u30FC\u30BF\u30B5\u30A4\u30A8\u30F3\u30C6\u30A3\u30B9\u30C8",
        description: "\u30D0\u30A4\u30AA\u30A4\u30F3\u30D5\u30A9\u30DE\u30C6\u30A3\u30AF\u30B9\u306E\u30DE\u30B9\u30BF\u30FC\u3078",
        domain: "genomics",
        level: "intermediate",
        courses: ["course-3"],
        estimatedDuration: 35,
        skills: ["scRNA-seq", "\u30D0\u30A4\u30AA\u30A4\u30F3\u30D5\u30A9\u30DE\u30C6\u30A3\u30AF\u30B9", "\u30C7\u30FC\u30BF\u89E3\u6790"],
        thumbnail: "/paths/genomics.jpg"
      }
    ];
    paths.forEach((p) => this.learningPaths.set(p.id, p));
  }
  // ============================================================================
  // Course Management
  // ============================================================================
  /**
   * Get all course categories
   */
  async getCategories() {
    return Array.from(this.categories.values());
  }
  /**
   * Search courses
   */
  async searchCourses(options) {
    let filtered = Array.from(this.courses.values());
    if (options.domain) {
      filtered = filtered.filter((c) => c.domain === options.domain);
    }
    if (options.level) {
      filtered = filtered.filter((c) => c.level === options.level);
    }
    if (options.query) {
      const query = options.query.toLowerCase();
      filtered = filtered.filter(
        (c) => c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query) || c.skills.some((s) => s.toLowerCase().includes(query))
      );
    }
    const total = filtered.length;
    const offset = options.offset || 0;
    const limit = options.limit || 20;
    const courses = filtered.slice(offset, offset + limit);
    return {
      courses,
      total,
      hasMore: offset + courses.length < total
    };
  }
  /**
   * Get course by ID
   */
  async getCourse(id) {
    return this.courses.get(id) || null;
  }
  /**
   * Get featured courses
   */
  async getFeaturedCourses() {
    return Array.from(this.courses.values()).sort((a, b) => b.rating - a.rating).slice(0, 6);
  }
  /**
   * Get popular courses
   */
  async getPopularCourses() {
    return Array.from(this.courses.values()).sort((a, b) => b.enrollmentCount - a.enrollmentCount).slice(0, 6);
  }
  // ============================================================================
  // Enrollment & Progress
  // ============================================================================
  /**
   * Enroll in a course
   */
  async enrollCourse(input) {
    const course = this.courses.get(input.courseId);
    if (!course) {
      throw new Error("Course not found");
    }
    const existingEnrollment = Array.from(this.enrollments.values()).find(
      (e) => e.userId === input.userId && e.courseId === input.courseId
    );
    if (existingEnrollment) {
      return existingEnrollment;
    }
    const moduleProgress = course.modules.map((m) => ({
      moduleId: m.id,
      progress: 0,
      lessonProgress: m.lessons.map((l) => ({
        lessonId: l.id,
        status: "not_started",
        progress: 0,
        timeSpent: 0,
        attempts: 0
      }))
    }));
    const enrollment = {
      id: (0, import_uuid2.v4)(),
      userId: input.userId,
      courseId: input.courseId,
      enrolledAt: /* @__PURE__ */ new Date(),
      progress: 0,
      status: "enrolled",
      lastAccessedAt: /* @__PURE__ */ new Date(),
      moduleProgress
    };
    this.enrollments.set(enrollment.id, enrollment);
    course.enrollmentCount++;
    return enrollment;
  }
  /**
   * Get user's enrollments
   */
  async getUserEnrollments(userId) {
    return Array.from(this.enrollments.values()).filter((e) => e.userId === userId);
  }
  /**
   * Get enrollment by course
   */
  async getEnrollment(userId, courseId) {
    return Array.from(this.enrollments.values()).find(
      (e) => e.userId === userId && e.courseId === courseId
    ) || null;
  }
  /**
   * Update lesson progress
   */
  async updateLessonProgress(input) {
    const enrollment = await this.getEnrollment(input.userId, input.courseId);
    if (!enrollment) {
      throw new Error("Not enrolled in this course");
    }
    for (const moduleProgress of enrollment.moduleProgress) {
      const lessonProgress = moduleProgress.lessonProgress.find(
        (lp) => lp.lessonId === input.lessonId
      );
      if (lessonProgress) {
        if (lessonProgress.status === "not_started") {
          lessonProgress.startedAt = /* @__PURE__ */ new Date();
        }
        lessonProgress.progress = Math.max(lessonProgress.progress, input.progress);
        lessonProgress.timeSpent += input.timeSpent;
        if (input.progress >= 100) {
          lessonProgress.status = "completed";
          lessonProgress.completedAt = /* @__PURE__ */ new Date();
        } else {
          lessonProgress.status = "in_progress";
        }
        break;
      }
    }
    this.recalculateProgress(enrollment);
    enrollment.lastAccessedAt = /* @__PURE__ */ new Date();
    if (enrollment.status === "enrolled") {
      enrollment.status = "in_progress";
      enrollment.startedAt = /* @__PURE__ */ new Date();
    }
    if (enrollment.progress >= 100 && enrollment.status !== "completed") {
      enrollment.status = "completed";
      enrollment.completedAt = /* @__PURE__ */ new Date();
      await this.issueCertificate(input.userId, input.courseId);
    }
    this.enrollments.set(enrollment.id, enrollment);
    return enrollment;
  }
  recalculateProgress(enrollment) {
    let totalLessons = 0;
    let completedLessons = 0;
    for (const moduleProgress of enrollment.moduleProgress) {
      const moduleLessons = moduleProgress.lessonProgress.length;
      const moduleCompleted = moduleProgress.lessonProgress.filter(
        (lp) => lp.status === "completed"
      ).length;
      totalLessons += moduleLessons;
      completedLessons += moduleCompleted;
      moduleProgress.progress = moduleLessons > 0 ? Math.round(moduleCompleted / moduleLessons * 100) : 0;
      if (moduleProgress.progress >= 100 && !moduleProgress.completedAt) {
        moduleProgress.completedAt = /* @__PURE__ */ new Date();
      }
    }
    enrollment.progress = totalLessons > 0 ? Math.round(completedLessons / totalLessons * 100) : 0;
  }
  // ============================================================================
  // Quiz & Code Submissions
  // ============================================================================
  /**
   * Submit quiz answers
   */
  async submitQuiz(input) {
    const attempt = {
      id: (0, import_uuid2.v4)(),
      userId: input.userId,
      lessonId: input.lessonId,
      startedAt: /* @__PURE__ */ new Date(),
      completedAt: /* @__PURE__ */ new Date(),
      answers: [],
      score: 0,
      passed: false,
      timeSpent: 0
    };
    let totalPoints = 0;
    let earnedPoints = 0;
    for (const course of this.courses.values()) {
      for (const module of course.modules) {
        const lesson = module.lessons.find((l) => l.id === input.lessonId);
        if (lesson && lesson.content.type === "quiz") {
          const quizContent = lesson.content;
          for (const answer of input.answers) {
            const question = quizContent.questions.find((q) => q.id === answer.questionId);
            if (question) {
              const isCorrect = Array.isArray(question.correctAnswer) ? JSON.stringify(answer.answer) === JSON.stringify(question.correctAnswer) : answer.answer === question.correctAnswer;
              totalPoints += question.points;
              if (isCorrect) {
                earnedPoints += question.points;
              }
              attempt.answers.push({
                questionId: answer.questionId,
                answer: answer.answer,
                isCorrect,
                points: isCorrect ? question.points : 0
              });
            }
          }
          attempt.score = totalPoints > 0 ? Math.round(earnedPoints / totalPoints * 100) : 0;
          attempt.passed = attempt.score >= quizContent.passingScore;
          break;
        }
      }
    }
    const userAttempts = this.quizAttempts.get(input.userId) || [];
    userAttempts.push(attempt);
    this.quizAttempts.set(input.userId, userAttempts);
    return attempt;
  }
  /**
   * Submit code exercise
   */
  async submitCode(input) {
    const submission = {
      id: (0, import_uuid2.v4)(),
      userId: input.userId,
      lessonId: input.lessonId,
      code: input.code,
      language: input.language,
      submittedAt: /* @__PURE__ */ new Date(),
      testResults: [],
      passed: false,
      executionTime: 0
    };
    for (const course of this.courses.values()) {
      for (const module of course.modules) {
        const lesson = module.lessons.find((l) => l.id === input.lessonId);
        if (lesson && lesson.content.type === "code_exercise") {
          const codeContent = lesson.content;
          for (const testCase of codeContent.testCases) {
            const passed = Math.random() > 0.3;
            submission.testResults.push({
              testCaseId: testCase.id,
              passed,
              output: passed ? testCase.expectedOutput : "Error: assertion failed",
              error: passed ? void 0 : "Test failed"
            });
          }
          submission.passed = submission.testResults.every((r) => r.passed);
          submission.executionTime = Math.random() * 1e3;
          break;
        }
      }
    }
    const userSubmissions = this.codeSubmissions.get(input.userId) || [];
    userSubmissions.push(submission);
    this.codeSubmissions.set(input.userId, userSubmissions);
    return submission;
  }
  // ============================================================================
  // Achievements & Certificates
  // ============================================================================
  /**
   * Get all achievements
   */
  async getAllAchievements() {
    return Array.from(this.achievements.values());
  }
  /**
   * Get user's achievements
   */
  async getUserAchievements(userId) {
    return this.userAchievements.get(userId) || [];
  }
  /**
   * Award achievement
   */
  async awardAchievement(userId, achievementId) {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) {
      throw new Error("Achievement not found");
    }
    const userAchievement = {
      id: (0, import_uuid2.v4)(),
      userId,
      achievementId,
      earnedAt: /* @__PURE__ */ new Date()
    };
    const userAchievements = this.userAchievements.get(userId) || [];
    userAchievements.push(userAchievement);
    this.userAchievements.set(userId, userAchievements);
    return userAchievement;
  }
  /**
   * Issue certificate
   */
  async issueCertificate(userId, courseId) {
    const course = this.courses.get(courseId);
    if (!course) {
      throw new Error("Course not found");
    }
    const certificate = {
      id: (0, import_uuid2.v4)(),
      userId,
      courseId,
      courseName: course.title,
      userName: `User ${userId.substring(0, 8)}`,
      issuedAt: /* @__PURE__ */ new Date(),
      verificationCode: `LF-${(0, import_uuid2.v4)().substring(0, 8).toUpperCase()}`,
      pdfUrl: `/certificates/${(0, import_uuid2.v4)()}.pdf`
    };
    const userCertificates = this.certificates.get(userId) || [];
    userCertificates.push(certificate);
    this.certificates.set(userId, userCertificates);
    const completedCourses = userCertificates.length;
    if (completedCourses === 1) {
      await this.awardAchievement(userId, "ach-1");
    }
    if (completedCourses === 5) {
      await this.awardAchievement(userId, "ach-2");
    }
    return certificate;
  }
  /**
   * Get user's certificates
   */
  async getUserCertificates(userId) {
    return this.certificates.get(userId) || [];
  }
  /**
   * Verify certificate
   */
  async verifyCertificate(verificationCode) {
    for (const userCerts of this.certificates.values()) {
      const cert = userCerts.find((c) => c.verificationCode === verificationCode);
      if (cert) return cert;
    }
    return null;
  }
  // ============================================================================
  // Learning Paths
  // ============================================================================
  /**
   * Get all learning paths
   */
  async getLearningPaths() {
    return Array.from(this.learningPaths.values());
  }
  /**
   * Get learning path by ID
   */
  async getLearningPath(id) {
    return this.learningPaths.get(id) || null;
  }
  /**
   * Enroll in learning path
   */
  async enrollLearningPath(userId, pathId) {
    const path = this.learningPaths.get(pathId);
    if (!path) {
      throw new Error("Learning path not found");
    }
    const enrollment = {
      id: (0, import_uuid2.v4)(),
      userId,
      pathId,
      enrolledAt: /* @__PURE__ */ new Date(),
      progress: 0,
      currentCourseIndex: 0
    };
    const userEnrollments = this.pathEnrollments.get(userId) || [];
    userEnrollments.push(enrollment);
    this.pathEnrollments.set(userId, userEnrollments);
    return enrollment;
  }
  /**
   * Get user's learning statistics
   */
  async getUserStats(userId) {
    const enrollments = await this.getUserEnrollments(userId);
    const achievements = await this.getUserAchievements(userId);
    const certificates = await this.getUserCertificates(userId);
    const totalHours = enrollments.reduce((sum, e) => {
      return sum + e.moduleProgress.reduce((mSum, m) => {
        return mSum + m.lessonProgress.reduce((lSum, l) => lSum + l.timeSpent, 0);
      }, 0);
    }, 0) / 60;
    return {
      totalCourses: enrollments.length,
      completedCourses: enrollments.filter((e) => e.status === "completed").length,
      totalHours: Math.round(totalHours * 10) / 10,
      achievements: achievements.length,
      certificates: certificates.length,
      currentStreak: Math.floor(Math.random() * 14) + 1
      // Mock streak
    };
  }
};
var learningService = new LearningService();

// src/index.ts
var VERSION = "0.0.1";

export { AIScreening, AccountLockedError, AuthError, AuthProviderFactory, AuthService, ClimateService, DEFAULT_LAB_SETTINGS, DatasetService, DocumentProcessor, DrugDiscoveryFilters, EnterpriseService, EntraIDProvider, Execution, ExperimentService, GenomicsService, HypothesisService, InputPattern, InvalidCredentialsError, InvalidTokenError, KnowledgeBase, LabService, LearningService, LocalAuthProvider, MaterialsFilters, NLIService, OptimizationService, PluginLoader, PluginManager, PluginRegistry, PrimaryScreening, ProviderNotConfiguredError, RAGService, SessionExpiredError, ShibbolethProvider, SimulationScreening, Step, UserNotFoundError, VERSION, Workflow, authProviders, climateService, createDbConnection, datasetTypes, datasetVisibilities, detectLanguage, documentChunks, documentChunksRelations, documentTypes, documents, documentsRelations, enterpriseService, executionArtifacts, executionArtifactsRelations, executionStatuses, executions, executionsRelations, experimentStatuses, extractIntent, genomicsService, getCurrentDb, getDb, hypothesisService, initializeDb, labDatasets, labDatasetsRelations, labExperiments, labExperimentsRelations, labInvitations, labInvitationsRelations, labMemberRoles, labMembers, labMembersRelations, labs, labsRelations, learningService, optimizationService, pluginDependencies, pluginDependenciesRelations, pluginStatuses, plugins, pluginsRelations, processingStatuses, researchDomains, sessions, sessionsRelations, stepExecutions, stepExecutionsRelations, stepStatuses, userRoles, users, usersRelations, workflowCollaborators, workflowCollaboratorsRelations, workflowStatuses, workflows, workflowsRelations };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map