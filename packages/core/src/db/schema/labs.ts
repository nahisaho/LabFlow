/**
 * Labs Schema
 *
 * My Lab Data: Team data sharing and knowledge management
 * LABS-001: Lab/Team management
 * LABS-002: Shared datasets
 * LABS-003: Experiment tracking
 */

import { pgTable, uuid, varchar, timestamp, boolean, jsonb, index, integer, unique } from 'drizzle-orm/pg-core';
import { users } from './users.js';

/**
 * Lab member roles
 */
export const labMemberRoles = ['owner', 'admin', 'member', 'viewer'] as const;
export type LabMemberRole = (typeof labMemberRoles)[number];

/**
 * Dataset types
 */
export const datasetTypes = [
  'experiment',
  'simulation',
  'screening',
  'literature',
  'molecule',
  'material',
  'sequence',
  'other',
] as const;
export type DatasetType = (typeof datasetTypes)[number];

/**
 * Dataset visibility
 */
export const datasetVisibilities = ['private', 'lab', 'public'] as const;
export type DatasetVisibility = (typeof datasetVisibilities)[number];

/**
 * Experiment status
 */
export const experimentStatuses = ['draft', 'running', 'completed', 'failed', 'archived'] as const;
export type ExperimentStatus = (typeof experimentStatuses)[number];

/**
 * Labs table - Research teams/groups
 */
export const labs = pgTable(
  'labs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    description: varchar('description', { length: 2000 }),
    organization: varchar('organization', { length: 255 }),
    domain: varchar('domain', { length: 50 }), // drug-discovery, materials-science, etc.
    avatarUrl: varchar('avatar_url', { length: 500 }),
    settings: jsonb('settings').$type<LabSettings>().default({}),
    isActive: boolean('is_active').notNull().default(true),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('labs_slug_idx').on(table.slug),
    index('labs_domain_idx').on(table.domain),
    index('labs_created_by_idx').on(table.createdById),
  ]
);

/**
 * Lab settings interface
 */
export interface LabSettings {
  defaultVisibility?: DatasetVisibility;
  allowPublicDatasets?: boolean;
  requireApproval?: boolean;
  maxStorageGB?: number;
  enableGraphRAG?: boolean;
  customFields?: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: string[];
    required?: boolean;
  }>;
}

/**
 * Lab members table - Team membership
 */
export const labMembers = pgTable(
  'lab_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    labId: uuid('lab_id')
      .notNull()
      .references(() => labs.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 50 }).$type<LabMemberRole>().notNull().default('member'),
    isActive: boolean('is_active').notNull().default(true),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    invitedById: uuid('invited_by_id').references(() => users.id),
  },
  (table) => [
    index('lab_members_lab_id_idx').on(table.labId),
    index('lab_members_user_id_idx').on(table.userId),
    unique('lab_members_lab_user_unique').on(table.labId, table.userId),
  ]
);

/**
 * Lab datasets table - Shared data
 */
export const labDatasets = pgTable(
  'lab_datasets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    labId: uuid('lab_id')
      .notNull()
      .references(() => labs.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 5000 }),
    type: varchar('type', { length: 50 }).$type<DatasetType>().notNull(),
    visibility: varchar('visibility', { length: 50 }).$type<DatasetVisibility>().notNull().default('lab'),
    
    // Data location
    storageUrl: varchar('storage_url', { length: 1000 }),
    filePath: varchar('file_path', { length: 500 }),
    fileSize: integer('file_size'), // bytes
    fileFormat: varchar('file_format', { length: 50 }), // csv, json, parquet, etc.
    
    // Metadata
    schema: jsonb('schema').$type<DatasetSchema>(),
    rowCount: integer('row_count'),
    columnCount: integer('column_count'),
    tags: jsonb('tags').$type<string[]>().default([]),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    
    // Versioning
    version: varchar('version', { length: 50 }).default('1.0.0'),
    parentId: uuid('parent_id'), // Previous version
    
    // GraphRAG integration
    isIndexed: boolean('is_indexed').notNull().default(false),
    indexedAt: timestamp('indexed_at', { withTimezone: true }),
    
    // Ownership
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('lab_datasets_lab_id_idx').on(table.labId),
    index('lab_datasets_type_idx').on(table.type),
    index('lab_datasets_visibility_idx').on(table.visibility),
    index('lab_datasets_created_by_idx').on(table.createdById),
  ]
);

/**
 * Dataset schema interface
 */
export interface DatasetSchema {
  columns: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
    description?: string;
    nullable?: boolean;
    unit?: string;
  }>;
}

/**
 * Lab experiments table - Experiment tracking
 */
export const labExperiments = pgTable(
  'lab_experiments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    labId: uuid('lab_id')
      .notNull()
      .references(() => labs.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 5000 }),
    hypothesis: varchar('hypothesis', { length: 2000 }),
    status: varchar('status', { length: 50 }).$type<ExperimentStatus>().notNull().default('draft'),
    
    // Experiment configuration
    workflowId: uuid('workflow_id'),
    parameters: jsonb('parameters').$type<Record<string, unknown>>().default({}),
    
    // Results
    results: jsonb('results').$type<ExperimentResults>(),
    conclusions: varchar('conclusions', { length: 5000 }),
    
    // Input/Output datasets
    inputDatasetIds: jsonb('input_dataset_ids').$type<string[]>().default([]),
    outputDatasetIds: jsonb('output_dataset_ids').$type<string[]>().default([]),
    
    // Metadata
    tags: jsonb('tags').$type<string[]>().default([]),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    
    // Timeline
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    
    // Ownership
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('lab_experiments_lab_id_idx').on(table.labId),
    index('lab_experiments_status_idx').on(table.status),
    index('lab_experiments_created_by_idx').on(table.createdById),
  ]
);

/**
 * Experiment results interface
 */
export interface ExperimentResults {
  metrics?: Record<string, number>;
  artifacts?: Array<{
    name: string;
    type: string;
    url?: string;
    data?: unknown;
  }>;
  logs?: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;
}

/**
 * Lab invitations table - Pending invitations
 */
export const labInvitations = pgTable(
  'lab_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    labId: uuid('lab_id')
      .notNull()
      .references(() => labs.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).$type<LabMemberRole>().notNull().default('member'),
    token: varchar('token', { length: 100 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    invitedById: uuid('invited_by_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('lab_invitations_lab_id_idx').on(table.labId),
    index('lab_invitations_email_idx').on(table.email),
    index('lab_invitations_token_idx').on(table.token),
  ]
);

/**
 * Type exports
 */
export type Lab = typeof labs.$inferSelect;
export type NewLab = typeof labs.$inferInsert;
export type LabMember = typeof labMembers.$inferSelect;
export type NewLabMember = typeof labMembers.$inferInsert;
export type LabDataset = typeof labDatasets.$inferSelect;
export type NewLabDataset = typeof labDatasets.$inferInsert;
export type LabExperiment = typeof labExperiments.$inferSelect;
export type NewLabExperiment = typeof labExperiments.$inferInsert;
export type LabInvitation = typeof labInvitations.$inferSelect;
export type NewLabInvitation = typeof labInvitations.$inferInsert;
