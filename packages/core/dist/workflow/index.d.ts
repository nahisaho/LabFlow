import { R as ResearchDomain, E as ExecutionStatus, a as ExecutionResult } from '../types-BA_TAtBg.js';
export { d as StepConfigSchema, b as StepDefinition, S as StepStatus, c as WorkflowMetadata, W as WorkflowStatus } from '../types-BA_TAtBg.js';
import { W as Workflow, a as WorkflowSnapshot, E as Execution } from '../execution-4ksSPIae.js';
export { b as StatusHistoryEntry, S as Step, c as StepMetrics } from '../execution-4ksSPIae.js';

/**
 * WorkflowService
 *
 * Application service for workflow management
 *
 * Requirements:
 * - WKFL-COMM-001: Workflow metadata management
 * - WKFL-COMM-002: Version management
 * - DASH-PROJ-001: CRUD operations
 * - DASH-PROJ-005: UUID generation
 */

/**
 * Workflow repository interface
 */
interface WorkflowRepository$1 {
    findById(id: string): Promise<Workflow | null>;
    findByUserId(userId: string): Promise<Workflow[]>;
    findByDomain(domain: ResearchDomain): Promise<Workflow[]>;
    save(workflow: Workflow): Promise<void>;
    delete(id: string): Promise<void>;
}
/**
 * Create workflow input
 */
interface CreateWorkflowInput {
    name: string;
    description?: string;
    domain: ResearchDomain;
    userId: string;
    organizationId?: string;
}
/**
 * Create from template input
 */
interface CreateFromTemplateInput {
    userId: string;
    name?: string;
    organizationId?: string;
}
/**
 * Update workflow input
 */
interface UpdateWorkflowInput {
    name?: string;
    description?: string;
}
/**
 * Add step input
 */
interface AddStepInput {
    name: string;
    type: string;
    domain: ResearchDomain;
    config?: Record<string, unknown>;
    position?: {
        x: number;
        y: number;
    };
    dependencies?: string[];
    optional?: boolean;
}
/**
 * Update step input
 */
interface UpdateStepInput {
    name?: string;
    config?: Record<string, unknown>;
    position?: {
        x: number;
        y: number;
    };
}
/**
 * Delete options
 */
interface DeleteOptions {
    soft?: boolean;
}
/**
 * Clone options
 */
interface CloneOptions {
    userId: string;
    name?: string;
}
/**
 * Validation result
 */
interface ValidationResult {
    valid: boolean;
    errors: string[];
}
/**
 * WorkflowService - Application service for workflow management
 */
declare class WorkflowService {
    private readonly repository;
    constructor(repository: WorkflowRepository$1);
    /**
     * Create a new workflow (DASH-PROJ-001, DASH-PROJ-005)
     */
    create(input: CreateWorkflowInput): Promise<Workflow>;
    /**
     * Create workflow from template
     */
    createFromTemplate(templateId: string, options: CreateFromTemplateInput): Promise<Workflow>;
    /**
     * Get workflow by ID
     */
    getById(id: string): Promise<Workflow | null>;
    /**
     * List workflows by user
     */
    listByUser(userId: string): Promise<Workflow[]>;
    /**
     * List workflows by domain
     */
    listByDomain(domain: ResearchDomain): Promise<Workflow[]>;
    /**
     * Update workflow (WKFL-COMM-001)
     */
    update(id: string, input: UpdateWorkflowInput): Promise<Workflow>;
    /**
     * Delete workflow (DASH-PROJ-001)
     */
    delete(id: string, options?: DeleteOptions): Promise<void>;
    /**
     * Add step to workflow
     */
    addStep(workflowId: string, input: AddStepInput): Promise<Workflow>;
    /**
     * Remove step from workflow
     */
    removeStep(workflowId: string, stepId: string): Promise<Workflow>;
    /**
     * Update step configuration
     */
    updateStep(workflowId: string, stepId: string, input: UpdateStepInput): Promise<Workflow>;
    /**
     * Create version snapshot (WKFL-COMM-002)
     */
    createSnapshot(workflowId: string): Promise<WorkflowSnapshot>;
    /**
     * Get version history (WKFL-COMM-002)
     */
    getVersionHistory(workflowId: string): Promise<WorkflowSnapshot[]>;
    /**
     * Activate workflow
     */
    activate(workflowId: string): Promise<Workflow>;
    /**
     * Archive workflow
     */
    archive(workflowId: string): Promise<Workflow>;
    /**
     * Clone workflow
     */
    clone(workflowId: string, options: CloneOptions): Promise<Workflow>;
    /**
     * Validate workflow structure
     */
    validate(workflowId: string): Promise<ValidationResult>;
    /**
     * Check if user can access workflow
     */
    canAccess(workflowId: string, userId: string): Promise<boolean>;
}

/**
 * ExecutionService
 *
 * Application service for workflow execution management
 *
 * Requirements:
 * - DASH-PROG-001: Progress visualization
 * - DASH-PROG-003: Progress percentage
 * - WKFL-COMM-005: Resume from failure
 * - WKFL-COMM-006: Intermediate result persistence
 */

/**
 * Execution repository interface
 */
interface ExecutionRepository {
    findById(id: string): Promise<Execution | null>;
    findByWorkflowId(workflowId: string): Promise<Execution[]>;
    findByUserId(userId: string): Promise<Execution[]>;
    findByStatus(status: ExecutionStatus): Promise<Execution[]>;
    save(execution: Execution): Promise<void>;
    delete(id: string): Promise<void>;
}
/**
 * Workflow repository interface (subset for execution service)
 */
interface WorkflowRepository {
    findById(id: string): Promise<Workflow | null>;
}
/**
 * Start execution input
 */
interface StartExecutionInput {
    workflowId: string;
    userId: string;
    parameters?: Record<string, unknown>;
    environment?: Record<string, string>;
}
/**
 * Step execution options
 */
interface StepExecutionOptions {
    timeout?: number;
    retries?: number;
}
/**
 * Execution progress result
 */
interface ExecutionProgress {
    progress: number;
    status: ExecutionStatus;
    currentStep?: string;
    totalSteps: number;
    completedSteps: number;
    estimatedRemainingTime?: number;
}
/**
 * Execution summary result
 */
interface ExecutionSummary {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    skippedSteps: number;
    progress: number;
    duration: number | undefined;
    status: ExecutionStatus;
}
/**
 * ExecutionService - Application service for workflow execution management
 */
declare class ExecutionService {
    private readonly executionRepository;
    private readonly workflowRepository;
    constructor(executionRepository: ExecutionRepository, workflowRepository: WorkflowRepository);
    /**
     * Start a new execution for a workflow
     */
    start(input: StartExecutionInput): Promise<Execution>;
    /**
     * Get execution by ID
     */
    getById(id: string): Promise<Execution | null>;
    /**
     * Get all executions for a workflow
     */
    getByWorkflowId(workflowId: string): Promise<Execution[]>;
    /**
     * Get all executions for a user
     */
    getByUserId(userId: string): Promise<Execution[]>;
    /**
     * Pause execution
     */
    pause(executionId: string): Promise<void>;
    /**
     * Resume execution (WKFL-COMM-005)
     */
    resume(executionId: string): Promise<void>;
    /**
     * Cancel execution
     */
    cancel(executionId: string): Promise<void>;
    /**
     * Resume from failed step (WKFL-COMM-005)
     */
    resumeFromFailure(executionId: string): Promise<void>;
    /**
     * Retry a specific step
     */
    retryStep(executionId: string, stepId: string): Promise<void>;
    /**
     * Record step result (WKFL-COMM-006)
     */
    recordStepResult(executionId: string, result: ExecutionResult): Promise<void>;
    /**
     * Get execution progress (DASH-PROG-001, DASH-PROG-003)
     */
    getProgress(executionId: string): Promise<ExecutionProgress>;
    /**
     * Get execution summary
     */
    getSummary(executionId: string): Promise<ExecutionSummary>;
    /**
     * Mark execution as completed
     */
    complete(executionId: string): Promise<void>;
    /**
     * Mark execution as failed
     */
    fail(executionId: string, error: string): Promise<void>;
    /**
     * Get result for a specific step
     */
    getStepResult(executionId: string, stepId: string): Promise<ExecutionResult | undefined>;
    /**
     * Check if user can access execution
     */
    canAccess(executionId: string, userId: string): Promise<boolean>;
}

export { type AddStepInput, type CloneOptions, type CreateFromTemplateInput, type CreateWorkflowInput, type DeleteOptions, Execution, type ExecutionProgress, type ExecutionRepository, ExecutionResult, ExecutionService, ExecutionStatus, type ExecutionSummary, type WorkflowRepository as ExecutionWorkflowRepository, ResearchDomain, type StartExecutionInput, type StepExecutionOptions, type UpdateStepInput, type UpdateWorkflowInput, type ValidationResult, Workflow, type WorkflowRepository$1 as WorkflowRepository, WorkflowService, WorkflowSnapshot };
