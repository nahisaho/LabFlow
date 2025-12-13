/**
 * Workflows Schema
 *
 * WORK-001: Workflow management
 */

import { pgTable, uuid, varchar, timestamp, boolean, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';

/**
 * Research domains
 */
export const researchDomains = ['drug_discovery', 'materials_science', 'climate', 'genomics', 'custom'] as const;
export type ResearchDomainType = (typeof researchDomains)[number];

/**
 * Workflow status
 */
export const workflowStatuses = ['draft', 'published', 'archived', 'deprecated'] as const;
export type WorkflowStatusType = (typeof workflowStatuses)[number];

/**
 * Workflows table
 */
export const workflows = pgTable(
  'workflows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 2000 }),
    domain: varchar('domain', { length: 50 }).$type<ResearchDomainType>().notNull(),
    status: varchar('status', { length: 50 }).$type<WorkflowStatusType>().notNull().default('draft'),
    version: integer('version').notNull().default(1),
    isTemplate: boolean('is_template').notNull().default(false),
    parentTemplateId: uuid('parent_template_id'),  // Self-reference handled via relations
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id),
    steps: jsonb('steps').$type<WorkflowStepData[]>().notNull().default([]),
    config: jsonb('config').$type<Record<string, unknown>>().default({}),
    tags: jsonb('tags').$type<string[]>().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (table) => [
    index('workflows_owner_id_idx').on(table.ownerId),
    index('workflows_domain_idx').on(table.domain),
    index('workflows_status_idx').on(table.status),
    index('workflows_is_template_idx').on(table.isTemplate),
  ]
);

/**
 * Workflow step data structure (stored as JSONB)
 */
export interface WorkflowStepData {
  id: string;
  type: string;
  name: string;
  description?: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  dependencies: string[];
}

/**
 * Workflow collaborators (many-to-many)
 */
export const workflowCollaborators = pgTable(
  'workflow_collaborators',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 50 }).notNull().default('viewer'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('workflow_collaborators_workflow_id_idx').on(table.workflowId),
    index('workflow_collaborators_user_id_idx').on(table.userId),
  ]
);

/**
 * Workflow types for TypeScript
 */
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
export type WorkflowCollaborator = typeof workflowCollaborators.$inferSelect;
export type NewWorkflowCollaborator = typeof workflowCollaborators.$inferInsert;
