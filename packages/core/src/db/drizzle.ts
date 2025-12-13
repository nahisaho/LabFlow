/**
 * Drizzle Instance
 *
 * Singleton database instance
 */

import { createDbConnection, type DbConnection } from './connection.js';

let _db: DbConnection | null = null;

/**
 * Get the database instance (lazy initialization)
 *
 * Requires DATABASE_URL environment variable
 */
export function getDb(): DbConnection {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _db = createDbConnection({ connectionString });
  }
  return _db;
}

/**
 * Initialize database with custom connection
 */
export function initializeDb(connectionString: string): DbConnection {
  _db = createDbConnection({ connectionString });
  return _db;
}

/**
 * Get current database instance if initialized
 */
export function getCurrentDb(): DbConnection | null {
  return _db;
}
