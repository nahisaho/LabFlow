/**
 * Database Module
 *
 * Requirements:
 * - INFRA-003: Database schema
 */

// Schema exports
export * from './schema/index.js';

// Connection
export { createDbConnection, type DbConnection } from './connection.js';

// Drizzle instance
export { getDb, initializeDb, getCurrentDb } from './drizzle.js';
