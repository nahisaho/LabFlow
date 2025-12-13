/**
 * Plugins Schema
 *
 * PLUG-001: Plugin management
 */

import { pgTable, uuid, varchar, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';

/**
 * Plugin status
 */
export const pluginStatuses = ['active', 'inactive', 'error'] as const;
export type PluginStatusType = (typeof pluginStatuses)[number];

/**
 * Plugins table - stores installed plugins
 */
export const plugins = pgTable(
  'plugins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pluginId: varchar('plugin_id', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    version: varchar('version', { length: 50 }).notNull(),
    domain: varchar('domain', { length: 50 }).notNull(),
    description: varchar('description', { length: 2000 }),
    author: varchar('author', { length: 255 }),
    status: varchar('status', { length: 50 }).$type<PluginStatusType>().notNull().default('inactive'),
    isBuiltIn: boolean('is_built_in').notNull().default(false),
    config: jsonb('config').$type<Record<string, unknown>>().default({}),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    installedAt: timestamp('installed_at', { withTimezone: true }).notNull().defaultNow(),
    lastActivatedAt: timestamp('last_activated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('plugins_plugin_id_idx').on(table.pluginId),
    index('plugins_domain_idx').on(table.domain),
    index('plugins_status_idx').on(table.status),
  ]
);

/**
 * Plugin dependencies - tracks plugin dependencies
 */
export const pluginDependencies = pgTable(
  'plugin_dependencies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pluginId: uuid('plugin_id')
      .notNull()
      .references(() => plugins.id, { onDelete: 'cascade' }),
    dependsOnPluginId: varchar('depends_on_plugin_id', { length: 255 }).notNull(),
    versionConstraint: varchar('version_constraint', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('plugin_dependencies_plugin_id_idx').on(table.pluginId),
  ]
);

/**
 * Plugin types for TypeScript
 */
export type Plugin = typeof plugins.$inferSelect;
export type NewPlugin = typeof plugins.$inferInsert;
export type PluginDependency = typeof pluginDependencies.$inferSelect;
export type NewPluginDependency = typeof pluginDependencies.$inferInsert;
