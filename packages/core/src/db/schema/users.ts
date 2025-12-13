/**
 * Users Schema
 *
 * AUTH-001: Multi-provider authentication
 */

import { pgTable, uuid, varchar, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';

/**
 * Auth providers enum values
 */
export const authProviders = ['local', 'entra', 'shibboleth'] as const;
export type AuthProviderType = (typeof authProviders)[number];

/**
 * User roles enum values
 */
export const userRoles = ['admin', 'researcher', 'viewer'] as const;
export type UserRole = (typeof userRoles)[number];

/**
 * Users table
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }),
    passwordHash: varchar('password_hash', { length: 255 }),
    authProvider: varchar('auth_provider', { length: 50 }).$type<AuthProviderType>().notNull().default('local'),
    externalId: varchar('external_id', { length: 255 }),
    role: varchar('role', { length: 50 }).$type<UserRole>().notNull().default('researcher'),
    isActive: boolean('is_active').notNull().default(true),
    emailVerified: boolean('email_verified').notNull().default(false),
    failedLoginAttempts: varchar('failed_login_attempts', { length: 10 }).notNull().default('0'),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    index('users_auth_provider_idx').on(table.authProvider),
    index('users_external_id_idx').on(table.externalId),
  ]
);

/**
 * Sessions table for JWT refresh tokens
 */
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    refreshToken: varchar('refresh_token', { length: 500 }).notNull().unique(),
    userAgent: varchar('user_agent', { length: 500 }),
    ipAddress: varchar('ip_address', { length: 50 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_refresh_token_idx').on(table.refreshToken),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ]
);

/**
 * User types for TypeScript
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
