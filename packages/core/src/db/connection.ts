/**
 * Database Connection
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

/**
 * Database connection options
 */
export interface DbConnectionOptions {
  connectionString: string;
  max?: number;
  idleTimeout?: number;
}

/**
 * Database connection type
 */
export type DbConnection = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Create a database connection
 */
export function createDbConnection(options: DbConnectionOptions): DbConnection {
  const client = postgres(options.connectionString, {
    max: options.max ?? 10,
    idle_timeout: options.idleTimeout ?? 20,
  });

  return drizzle(client, { schema });
}
