/**
 * Workflow Types
 */

/**
 * Workflow status
 */
export type WorkflowStatus = 'draft' | 'active' | 'completed' | 'published' | 'archived';

/**
 * Step status
 */
export type StepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'cancelled';

/**
 * Execution status
 */
export type ExecutionStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

/**
 * Research domain
 */
export type ResearchDomain = 'drug' | 'materials' | 'climate' | 'genomics';

/**
 * Step definition
 */
export interface StepDefinition {
  id: string;
  name: string;
  type: string;
  domain: ResearchDomain;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  dependencies: string[];
}

/**
 * Workflow metadata
 * WKFL-COMM-001
 */
export interface WorkflowMetadata {
  id: string;
  name: string;
  description?: string;
  domain: ResearchDomain;
  templateId?: string;
  version: number;
  status: WorkflowStatus;
  userId: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Execution result
 */
export interface ExecutionResult {
  stepId: string;
  status: StepStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  output?: Record<string, unknown>;
  error?: string;
}

/**
 * Step configuration schema
 */
export interface StepConfigSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    description?: string;
    default?: unknown;
    required?: boolean;
  }>;
}
