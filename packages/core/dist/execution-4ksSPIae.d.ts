import { R as ResearchDomain, S as StepStatus, W as WorkflowStatus, c as WorkflowMetadata, E as ExecutionStatus, a as ExecutionResult } from './types-BA_TAtBg.js';

/**
 * Step Domain Entity
 */

/**
 * Status change record
 */
interface StatusHistoryEntry {
    status: StepStatus;
    timestamp: Date;
}
/**
 * Step execution metrics
 */
interface StepMetrics {
    startTime?: Date;
    endTime?: Date;
    duration?: number;
}
/**
 * Workflow step entity
 */
declare class Step {
    private _id;
    private _name;
    private _type;
    private _domain;
    private _config;
    private _requiredConfigFields;
    private _position;
    private _dependencies;
    private _status;
    private _statusHistory;
    private _output?;
    private _metrics;
    private _optional;
    constructor(params: {
        id: string;
        name: string;
        type: string;
        domain: ResearchDomain;
        config?: Record<string, unknown>;
        requiredConfigFields?: string[];
        position?: {
            x: number;
            y: number;
        };
        dependencies?: string[];
        status?: StepStatus;
        optional?: boolean;
    });
    get id(): string;
    get name(): string;
    get type(): string;
    get domain(): ResearchDomain;
    get config(): Record<string, unknown>;
    get position(): {
        x: number;
        y: number;
    };
    get dependencies(): string[];
    get status(): StepStatus;
    get statusHistory(): StatusHistoryEntry[];
    get output(): unknown;
    get metrics(): StepMetrics;
    get optional(): boolean;
    /**
     * Update step name
     */
    updateName(name: string): void;
    /**
     * Update step configuration
     */
    updateConfig(config: Record<string, unknown>): void;
    /**
     * Update step position
     */
    updatePosition(position: {
        x: number;
        y: number;
    }): void;
    /**
     * Add dependency
     */
    addDependency(stepId: string): void;
    /**
     * Remove dependency
     */
    removeDependency(stepId: string): void;
    /**
     * Update status
     */
    updateStatus(status: StepStatus): void;
    /**
     * Validate config against required fields
     */
    validateConfig(): {
        valid: boolean;
        missingFields: string[];
    };
    /**
     * Check if this step depends on another step
     */
    dependsOn(stepId: string): boolean;
    /**
     * Start step execution
     */
    start(): void;
    /**
     * Complete step execution
     */
    complete(output?: unknown): void;
    /**
     * Fail step execution
     */
    fail(error?: string): void;
    /**
     * Skip step (WKFL-COMM-004)
     */
    skip(reason?: string): void;
    /**
     * Reset step to pending state
     */
    reset(): void;
    /**
     * Set step output
     */
    setOutput(output: unknown): void;
    /**
     * Check if step is skippable
     */
    isSkippable(): boolean;
    /**
     * Clone step with new ID
     */
    clone(newId?: string): Step;
    /**
     * Serialize to JSON
     */
    toJSON(): object;
    /**
     * Deserialize from JSON
     */
    static fromJSON(json: {
        id: string;
        name: string;
        type: string;
        domain: ResearchDomain;
        config?: Record<string, unknown>;
        requiredConfigFields?: string[];
        position?: {
            x: number;
            y: number;
        };
        dependencies?: string[];
        status?: StepStatus;
        optional?: boolean;
    }): Step;
}

/**
 * Workflow Domain Entity
 *
 * WKFL-COMM-001: Workflow metadata
 * WKFL-COMM-002: Version management
 */

/**
 * Version snapshot type
 */
interface WorkflowSnapshot {
    version: number;
    data: object;
    createdAt: Date;
}
/**
 * Workflow aggregate root
 */
declare class Workflow {
    private _id;
    private _name;
    private _description?;
    private _domain;
    private _templateId?;
    private _version;
    private _versionHistory;
    private _status;
    private _userId;
    private _organizationId?;
    private _steps;
    private _createdAt;
    private _updatedAt;
    constructor(params: {
        id: string;
        name: string;
        description?: string;
        domain: ResearchDomain;
        templateId?: string;
        version?: number;
        status?: WorkflowStatus;
        userId: string;
        organizationId?: string;
        createdAt?: Date;
        updatedAt?: Date;
    });
    get id(): string;
    get name(): string;
    get description(): string | undefined;
    get domain(): ResearchDomain;
    get templateId(): string | undefined;
    get version(): number;
    get status(): WorkflowStatus;
    get userId(): string;
    get organizationId(): string | undefined;
    get steps(): Step[];
    get createdAt(): Date;
    get updatedAt(): Date;
    /**
     * Get workflow metadata
     */
    getMetadata(): WorkflowMetadata & {
        stepCount: number;
    };
    /**
     * Add a step to the workflow
     */
    addStep(step: Step): void;
    /**
     * Remove a step from the workflow
     */
    /**
     * Remove a step from the workflow
     */
    removeStep(stepId: string): void;
    /**
     * Get a step by ID
     */
    getStep(stepId: string): Step | undefined;
    /**
     * Update workflow name
     */
    updateName(name: string): void;
    /**
     * Update workflow description
     */
    updateDescription(description: string): void;
    /**
     * Increment version (private helper)
     */
    private _incrementVersion;
    /**
     * Reorder steps
     */
    reorderSteps(stepIds: string[]): void;
    /**
     * Activate workflow (draft -> active)
     */
    activate(): void;
    /**
     * Complete workflow (active -> completed)
     */
    complete(): void;
    /**
     * Validate workflow structure
     */
    validate(): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Clone workflow with new ID
     */
    clone(newId: string): Workflow;
    /**
     * Create template from workflow (strips user-specific data)
     */
    toTemplate(): object;
    /**
     * Create version snapshot (WKFL-COMM-002)
     */
    createSnapshot(): WorkflowSnapshot;
    /**
     * Get version history
     */
    get versionHistory(): WorkflowSnapshot[];
    /**
     * Publish workflow (WKFL-COMM-002)
     */
    publish(): void;
    /**
     * Archive workflow
     */
    archive(): void;
    /**
     * Create a draft copy
     */
    createDraft(): Workflow;
    /**
     * Validate workflow is a valid DAG (no cycles)
     */
    validateNoCycles(): void;
    /**
     * Get execution order (topological sort)
     */
    getExecutionOrder(): string[];
    /**
     * Serialize to JSON
     */
    toJSON(): object;
    /**
     * Deserialize from JSON
     */
    static fromJSON(json: {
        id: string;
        name: string;
        description?: string;
        domain: ResearchDomain;
        templateId?: string;
        version?: number;
        status?: WorkflowStatus;
        userId: string;
        organizationId?: string;
        steps?: Array<{
            id: string;
            name: string;
            type: string;
            domain: ResearchDomain;
            config?: Record<string, unknown>;
            position?: {
                x: number;
                y: number;
            };
            dependencies?: string[];
            status?: StepStatus;
        }>;
        createdAt?: string;
        updatedAt?: string;
    }): Workflow;
}

/**
 * Execution Domain Entity
 *
 * WKFL-COMM-005: Resume from failure
 * WKFL-COMM-006: Intermediate result persistence
 */

/**
 * Workflow execution entity
 */
declare class Execution {
    private _id;
    private _workflowId;
    private _userId;
    private _status;
    private _progress;
    private _totalSteps;
    private _results;
    private _error?;
    private _failedStepId?;
    private _parameters;
    private _environment;
    private _startedAt;
    private _completedAt?;
    constructor(params: {
        id: string;
        workflowId: string;
        userId: string;
        status?: ExecutionStatus;
        progress?: number;
        totalSteps?: number;
        startedAt?: Date;
        parameters?: Record<string, unknown>;
        environment?: Record<string, string>;
    });
    get id(): string;
    get workflowId(): string;
    get userId(): string;
    get status(): ExecutionStatus;
    get progress(): number;
    get totalSteps(): number;
    get results(): ExecutionResult[];
    get error(): string | undefined;
    get failedStepId(): string | undefined;
    get parameters(): Record<string, unknown>;
    get environment(): Record<string, string>;
    get startedAt(): Date;
    get completedAt(): Date | undefined;
    get duration(): number | undefined;
    /**
     * Start execution
     */
    start(): void;
    /**
     * Set total number of steps
     */
    setTotalSteps(count: number): void;
    /**
     * Set execution parameters
     */
    setParameters(params: Record<string, unknown>): void;
    /**
     * Set execution environment
     */
    setEnvironment(env: Record<string, string>): void;
    /**
     * Record step result (WKFL-COMM-006)
     */
    recordStepResult(result: ExecutionResult): void;
    /**
     * Update progress based on completed/skipped steps
     */
    private _updateProgress;
    /**
     * Estimate remaining time based on average step duration
     */
    get estimatedRemainingTime(): number | undefined;
    /**
     * Get result for a specific step
     */
    getStepResult(stepId: string): ExecutionResult | undefined;
    /**
     * Pause execution (WKFL-COMM-005)
     */
    pause(): void;
    /**
     * Resume execution (WKFL-COMM-005)
     */
    resume(): void;
    /**
     * Resume from failed step (WKFL-COMM-005)
     */
    resumeFromFailure(): void;
    /**
     * Retry a specific step (WKFL-COMM-005)
     */
    retryStep(stepId: string): void;
    /**
     * Cancel execution
     */
    cancel(): void;
    /**
     * Complete execution
     */
    complete(): void;
    /**
     * Fail execution
     */
    fail(error: string): void;
    /**
     * Get failed step IDs for retry (WKFL-COMM-005)
     */
    getFailedStepIds(): string[];
    /**
     * Get completed step IDs for resume (WKFL-COMM-005)
     */
    getCompletedStepIds(): string[];
    /**
     * Get execution summary
     */
    getSummary(): {
        totalSteps: number;
        completedSteps: number;
        failedSteps: number;
        skippedSteps: number;
        progress: number;
        duration: number | undefined;
        status: ExecutionStatus;
    };
    /**
     * Serialize to JSON
     */
    toJSON(): object;
    /**
     * Deserialize from JSON
     */
    static fromJSON(json: {
        id: string;
        workflowId: string;
        userId: string;
        status?: ExecutionStatus;
        progress?: number;
        totalSteps?: number;
        results?: ExecutionResult[];
        error?: string;
        failedStepId?: string;
        parameters?: Record<string, unknown>;
        environment?: Record<string, string>;
        startedAt?: string;
        completedAt?: string;
    }): Execution;
}

export { Execution as E, Step as S, Workflow as W, type WorkflowSnapshot as a, type StatusHistoryEntry as b, type StepMetrics as c };
