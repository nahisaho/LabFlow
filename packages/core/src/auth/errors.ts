/**
 * Auth Errors
 */

/**
 * Base authentication error
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Invalid credentials error
 */
export class InvalidCredentialsError extends AuthError {
  constructor(message = 'Invalid email or password') {
    super(message, 'INVALID_CREDENTIALS', 401);
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * User not found error
 */
export class UserNotFoundError extends AuthError {
  constructor(message = 'User not found') {
    super(message, 'USER_NOT_FOUND', 404);
    this.name = 'UserNotFoundError';
  }
}

/**
 * Session expired error
 */
export class SessionExpiredError extends AuthError {
  constructor(message = 'Session has expired') {
    super(message, 'SESSION_EXPIRED', 401);
    this.name = 'SessionExpiredError';
  }
}

/**
 * Account locked error
 * DASH-AUTH-013
 */
export class AccountLockedError extends AuthError {
  public readonly lockedUntil: Date;

  constructor(lockedUntil: Date) {
    const timeStr = lockedUntil.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    super(`Account is locked until ${timeStr}`, 'ACCOUNT_LOCKED', 423);
    this.name = 'AccountLockedError';
    this.lockedUntil = lockedUntil;
  }
}

/**
 * Provider not configured error
 */
export class ProviderNotConfiguredError extends AuthError {
  constructor(providerType: string) {
    super(
      `Authentication provider '${providerType}' is not configured`,
      'PROVIDER_NOT_CONFIGURED',
      500
    );
    this.name = 'ProviderNotConfiguredError';
  }
}

/**
 * Invalid token error
 */
export class InvalidTokenError extends AuthError {
  constructor(message = 'Invalid or expired token') {
    super(message, 'INVALID_TOKEN', 401);
    this.name = 'InvalidTokenError';
  }
}
