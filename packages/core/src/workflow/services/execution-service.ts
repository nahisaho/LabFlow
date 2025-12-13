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

import { Execution } from '../domain/execution.js';
import type { Workflow } from '../domain/workflow.js';
import type { ExecutionResult, ExecutionStatus } from '../types.js';

/**
 * Execution repository interface
 */
export interface ExecutionRepository {
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
export interface WorkflowRepository {
  findById(id: string): Promise<Workflow | null>;
}

/**
 * Start execution input
 */
export interface StartExecutionInput {
  workflowId: string;
  userId: string;
  parameters?: Record<string, unknown>;
  environment?: Record<string, string>;
}

/**
 * Step execution options
 */
export interface StepExecutionOptions {
  timeout?: number;
  retries?: number;
}

/**
 * Execution progress result
 */
export interface ExecutionProgress {
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
export interface ExecutionSummary {
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
export class ExecutionService {
  constructor(
    private readonly executionRepository: ExecutionRepository,
    private readonly workflowRepository: WorkflowRepository
  ) {}

  /**
   * Start a new execution for a workflow
   */
  async start(input: StartExecutionInput): Promise<Execution> {
    // Verify workflow exists
    const workflow = await this.workflowRepository.findById(input.workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Verify workflow is active
    if (workflow.status !== 'active' && workflow.status !== 'published') {
      throw new Error(`Cannot execute workflow in ${workflow.status} status`);
    }

    // Create execution
    const execution = new Execution({
      id: crypto.randomUUID(),
      workflowId: input.workflowId,
      userId: input.userId,
      status: 'queued',
      totalSteps: workflow.getMetadata?.()?.stepCount ?? workflow.steps?.length ?? 0,
      parameters: input.parameters,
      environment: input.environment,
    });

    // Start execution
    execution.start();

    await this.executionRepository.save(execution);
    return execution;
  }

  /**
   * Get execution by ID
   */
  async getById(id: string): Promise<Execution | null> {
    return this.executionRepository.findById(id);
  }

  /**
   * Get all executions for a workflow
   */
  async getByWorkflowId(workflowId: string): Promise<Execution[]> {
    return this.executionRepository.findByWorkflowId(workflowId);
  }

  /**
   * Get all executions for a user
   */
  async getByUserId(userId: string): Promise<Execution[]> {
    return this.executionRepository.findByUserId(userId);
  }

  /**
   * Pause execution
   */
  async pause(executionId: string): Promise<void> {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    execution.pause();
    await this.executionRepository.save(execution);
  }

  /**
   * Resume execution (WKFL-COMM-005)
   */
  async resume(executionId: string): Promise<void> {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    execution.resume();
    await this.executionRepository.save(execution);
  }

  /**
   * Cancel execution
   */
  async cancel(executionId: string): Promise<void> {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    execution.cancel();
    await this.executionRepository.save(execution);
  }

  /**
   * Resume from failed step (WKFL-COMM-005)
   */
  async resumeFromFailure(executionId: string): Promise<void> {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    execution.resumeFromFailure();
    await this.executionRepository.save(execution);
  }

  /**
   * Retry a specific step
   */
  async retryStep(executionId: string, stepId: string): Promise<void> {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    execution.retryStep(stepId);
    await this.executionRepository.save(execution);
  }

  /**
   * Record step result (WKFL-COMM-006)
   */
  async recordStepResult(executionId: string, result: ExecutionResult): Promise<void> {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    execution.recordStepResult(result);
    await this.executionRepository.save(execution);
  }

  /**
   * Get execution progress (DASH-PROG-001, DASH-PROG-003)
   */
  async getProgress(executionId: string): Promise<ExecutionProgress> {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    const summary = execution.getSummary();
    return {
      progress: execution.progress,
      status: execution.status,
      totalSteps: summary.totalSteps,
      completedSteps: summary.completedSteps,
      estimatedRemainingTime: execution.estimatedRemainingTime,
    };
  }

  /**
   * Get execution summary
   */
  async getSummary(executionId: string): Promise<ExecutionSummary> {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    return execution.getSummary();
  }

  /**
   * Mark execution as completed
   */
  async complete(executionId: string): Promise<void> {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    execution.complete();
    await this.executionRepository.save(execution);
  }

  /**
   * Mark execution as failed
   */
  async fail(executionId: string, error: string): Promise<void> {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    execution.fail(error);
    await this.executionRepository.save(execution);
  }

  /**
   * Get result for a specific step
   */
  async getStepResult(executionId: string, stepId: string): Promise<ExecutionResult | undefined> {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    return execution.getStepResult(stepId);
  }

  /**
   * Check if user can access execution
   */
  async canAccess(executionId: string, userId: string): Promise<boolean> {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      return false;
    }

    return execution.userId === userId;
  }
}
