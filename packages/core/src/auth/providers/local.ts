/**
 * LocalAuthProvider - Local Authentication with Argon2id
 *
 * DASH-AUTH-002: Local authentication
 * DASH-AUTH-011: Argon2id password hashing
 * DASH-AUTH-012: Session timeout (15 min idle)
 * DASH-AUTH-013: Account lockout (3 failures = 30 min)
 */

import * as argon2 from 'argon2';
import { SignJWT, jwtVerify } from 'jose';
import type {
  AuthProvider,
  AuthCredentials,
  LocalCredentials,
  LocalProviderConfig,
  AuthResult,
  AuthUser,
} from '../types.js';
import {
  InvalidCredentialsError,
  InvalidTokenError,
  AccountLockedError,
} from '../errors.js';

// TODO: Replace with actual repository
interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'admin' | 'researcher' | 'viewer';
  organizationId?: string;
  failedAttempts: number;
  lockedUntil?: Date;
}

/**
 * Local authentication provider using email/password with Argon2id
 */
export class LocalAuthProvider implements AuthProvider {
  readonly type = 'local' as const;
  private readonly config: LocalProviderConfig;
  private readonly jwtSecret: Uint8Array;

  // TODO: Inject repository
  private users: Map<string, UserRecord> = new Map();

  constructor(config: LocalProviderConfig) {
    this.config = config;
    this.jwtSecret = new TextEncoder().encode(config.jwtSecret);
  }

  /**
   * Authenticate with email and password
   */
  async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    if (credentials.type !== 'local') {
      throw new InvalidCredentialsError('Invalid credential type');
    }

    const { email, password } = credentials as LocalCredentials;

    // TODO: Replace with repository call
    const user = this.findUserByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Check account lockout (DASH-AUTH-013)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AccountLockedError(user.lockedUntil);
    }

    // Verify password with Argon2id (DASH-AUTH-011)
    const isValid = await this.verifyPassword(password, user.passwordHash);

    if (!isValid) {
      await this.recordFailedAttempt(user);
      throw new InvalidCredentialsError();
    }

    // Reset failed attempts on successful login
    await this.resetFailedAttempts(user);

    // Generate JWT
    const token = await this.generateToken(user);
    const expiresAt = this.calculateExpiry();

    return {
      user: this.toAuthUser(user),
      token,
      expiresAt,
    };
  }

  /**
   * Validate JWT token
   */
  async validateSession(token: string): Promise<AuthUser | null> {
    try {
      const { payload } = await jwtVerify(token, this.jwtSecret);

      // TODO: Replace with repository call
      const user = this.users.get(payload.sub as string);
      if (!user) return null;

      return this.toAuthUser(user);
    } catch {
      return null;
    }
  }

  /**
   * Revoke session (invalidate token)
   */
  async revokeSession(token: string): Promise<void> {
    // TODO: Add token to blacklist in Redis
    // For now, tokens are stateless and cannot be revoked
    // This is a placeholder for future implementation
  }

  /**
   * Hash password with Argon2id
   */
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.config.argon2Options?.memoryCost ?? 65536, // 64 MiB
      timeCost: this.config.argon2Options?.timeCost ?? 3,
      parallelism: this.config.argon2Options?.parallelism ?? 4,
    });
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  /**
   * Generate JWT token
   */
  private async generateToken(user: UserRecord): Promise<string> {
    return new SignJWT({
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(this.config.jwtExpiresIn)
      .sign(this.jwtSecret);
  }

  /**
   * Calculate token expiry date
   */
  private calculateExpiry(): Date {
    const match = this.config.jwtExpiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 15 * 60 * 1000); // Default 15 minutes
    }

    const value = parseInt(match[1]!, 10);
    const unit = match[2]!;

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * (multipliers[unit] ?? 60 * 1000));
  }

  /**
   * Record failed login attempt (DASH-AUTH-013)
   */
  private async recordFailedAttempt(user: UserRecord): Promise<void> {
    user.failedAttempts += 1;

    // Lock account after 3 failed attempts
    if (user.failedAttempts >= 3) {
      user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      user.failedAttempts = 0;
    }

    // TODO: Persist to database
  }

  /**
   * Reset failed attempts after successful login
   */
  private async resetFailedAttempts(user: UserRecord): Promise<void> {
    user.failedAttempts = 0;
    user.lockedUntil = undefined;
    // TODO: Persist to database
  }

  /**
   * Convert internal user record to AuthUser
   */
  private toAuthUser(user: UserRecord): AuthUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      organizationId: user.organizationId,
      provider: 'local',
    };
  }

  /**
   * Find user by email (TODO: Replace with repository)
   */
  private findUserByEmail(email: string): UserRecord | undefined {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  /**
   * Create user (for testing/seeding)
   */
  async createUser(
    email: string,
    password: string,
    displayName: string,
    role: 'admin' | 'researcher' | 'viewer' = 'researcher'
  ): Promise<AuthUser> {
    const id = crypto.randomUUID();
    const passwordHash = await this.hashPassword(password);

    const user: UserRecord = {
      id,
      email,
      passwordHash,
      displayName,
      role,
      failedAttempts: 0,
    };

    this.users.set(id, user);
    return this.toAuthUser(user);
  }
}
