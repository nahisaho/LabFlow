/**
 * Workflow Module
 *
 * Requirements:
 * - WKFL-COMM-001: Workflow metadata
 * - WKFL-COMM-002: Version management
 * - WKFL-COMM-005: Resume from failure
 * - WKFL-COMM-006: Intermediate result persistence
 */

// Types
export * from './types.js';

// Domain
export { Workflow, type WorkflowSnapshot } from './domain/workflow.js';
export { Step, type StatusHistoryEntry, type StepMetrics } from './domain/step.js';
export { Execution } from './domain/execution.js';

// Services
export {
  WorkflowService,
  type WorkflowRepository,
  type CreateWorkflowInput,
  type CreateFromTemplateInput,
  type UpdateWorkflowInput,
  type AddStepInput,
  type UpdateStepInput,
  type DeleteOptions,
  type CloneOptions,
  type ValidationResult,
} from './services/workflow-service.js';

export {
  ExecutionService,
  type ExecutionRepository,
  type WorkflowRepository as ExecutionWorkflowRepository,
  type StartExecutionInput,
  type StepExecutionOptions,
  type ExecutionProgress,
  type ExecutionSummary,
} from './services/execution-service.js';
