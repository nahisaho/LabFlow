/**
 * Executions Schema
 *
 * WORK-002: Workflow execution
 */

import { pgTable, uuid, varchar, timestamp, jsonb, integer, real, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { workflows } from './workflows.js';

/**
 * Execution status
 */
export const executionStatuses = ['pending', 'running', 'paused', 'completed', 'failed', 'cancelled'] as const;
export type ExecutionStatusType = (typeof executionStatuses)[number];

/**
 * Step execution status
 */
export const stepStatuses = ['pending', 'running', 'completed', 'failed', 'skipped'] as const;
export type StepStatusType = (typeof stepStatuses)[number];

/**
 * Workflow executions table
 */
export const executions = pgTable(
  'executions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => workflows.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    status: varchar('status', { length: 50 }).$type<ExecutionStatusType>().notNull().default('pending'),
    progress: real('progress').notNull().default(0),
    currentStepId: varchar('current_step_id', { length: 100 }),
    inputs: jsonb('inputs').$type<Record<string, unknown>>().default({}),
    outputs: jsonb('outputs').$type<Record<string, unknown>>().default({}),
    error: varchar('error', { length: 2000 }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('executions_workflow_id_idx').on(table.workflowId),
    index('executions_user_id_idx').on(table.userId),
    index('executions_status_idx').on(table.status),
    index('executions_created_at_idx').on(table.createdAt),
  ]
);

/**
 * Step executions table
 */
export const stepExecutions = pgTable(
  'step_executions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    executionId: uuid('execution_id')
      .notNull()
      .references(() => executions.id, { onDelete: 'cascade' }),
    stepId: varchar('step_id', { length: 100 }).notNull(),
    status: varchar('status', { length: 50 }).$type<StepStatusType>().notNull().default('pending'),
    progress: real('progress').notNull().default(0),
    inputs: jsonb('inputs').$type<Record<string, unknown>>().default({}),
    outputs: jsonb('outputs').$type<Record<string, unknown>>().default({}),
    error: varchar('error', { length: 2000 }),
    retryCount: integer('retry_count').notNull().default(0),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('step_executions_execution_id_idx').on(table.executionId),
    index('step_executions_step_id_idx').on(table.stepId),
    index('step_executions_status_idx').on(table.status),
  ]
);

/**
 * Execution artifacts table
 */
export const executionArtifacts = pgTable(
  'execution_artifacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    executionId: uuid('execution_id')
      .notNull()
      .references(() => executions.id, { onDelete: 'cascade' }),
    stepId: varchar('step_id', { length: 100 }),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 100 }).notNull(),
    path: varchar('path', { length: 1000 }).notNull(),
    size: integer('size'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('execution_artifacts_execution_id_idx').on(table.executionId),
    index('execution_artifacts_step_id_idx').on(table.stepId),
  ]
);

/**
 * Execution types for TypeScript
 */
export type Execution = typeof executions.$inferSelect;
export type NewExecution = typeof executions.$inferInsert;
export type StepExecution = typeof stepExecutions.$inferSelect;
export type NewStepExecution = typeof stepExecutions.$inferInsert;
export type ExecutionArtifact = typeof executionArtifacts.$inferSelect;
export type NewExecutionArtifact = typeof executionArtifacts.$inferInsert;
