/**
 * Execution Domain Entity
 *
 * WKFL-COMM-005: Resume from failure
 * WKFL-COMM-006: Intermediate result persistence
 */

import type { ExecutionStatus, ExecutionResult } from '../types.js';

/**
 * Workflow execution entity
 */
export class Execution {
  private _id: string;
  private _workflowId: string;
  private _userId: string;
  private _status: ExecutionStatus;
  private _progress: number;
  private _totalSteps: number;
  private _results: Map<string, ExecutionResult>;
  private _error?: string;
  private _failedStepId?: string;
  private _parameters: Record<string, unknown>;
  private _environment: Record<string, string>;
  private _startedAt: Date;
  private _completedAt?: Date;

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
  }) {
    this._id = params.id;
    this._workflowId = params.workflowId;
    this._userId = params.userId;
    this._status = params.status ?? 'queued';
    this._progress = params.progress ?? 0;
    this._totalSteps = params.totalSteps ?? 0;
    this._results = new Map();
    this._parameters = params.parameters ?? {};
    this._environment = params.environment ?? {};
    this._startedAt = params.startedAt ?? new Date();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get workflowId(): string {
    return this._workflowId;
  }

  get userId(): string {
    return this._userId;
  }

  get status(): ExecutionStatus {
    return this._status;
  }

  get progress(): number {
    return this._progress;
  }

  get totalSteps(): number {
    return this._totalSteps;
  }

  get results(): ExecutionResult[] {
    return Array.from(this._results.values());
  }

  get error(): string | undefined {
    return this._error;
  }

  get failedStepId(): string | undefined {
    return this._failedStepId;
  }

  get parameters(): Record<string, unknown> {
    return { ...this._parameters };
  }

  get environment(): Record<string, string> {
    return { ...this._environment };
  }

  get startedAt(): Date {
    return this._startedAt;
  }

  get completedAt(): Date | undefined {
    return this._completedAt;
  }

  get duration(): number | undefined {
    if (!this._completedAt) return undefined;
    return this._completedAt.getTime() - this._startedAt.getTime();
  }

  /**
   * Start execution
   */
  start(): void {
    if (this._status !== 'queued') {
      throw new Error(`Cannot start execution in ${this._status} state`);
    }

    this._status = 'running';
    this._startedAt = new Date();
  }

  /**
   * Set total number of steps
   */
  setTotalSteps(count: number): void {
    this._totalSteps = count;
    this._updateProgress();
  }

  /**
   * Set execution parameters
   */
  setParameters(params: Record<string, unknown>): void {
    this._parameters = { ...params };
  }

  /**
   * Set execution environment
   */
  setEnvironment(env: Record<string, string>): void {
    this._environment = { ...env };
  }

  /**
   * Record step result (WKFL-COMM-006)
   */
  recordStepResult(result: ExecutionResult): void {
    this._results.set(result.stepId, result);

    // Track failed step for resume capability
    if (result.status === 'failed') {
      this._failedStepId = result.stepId;
    }

    this._updateProgress();
  }

  /**
   * Update progress based on completed/skipped steps
   */
  private _updateProgress(): void {
    if (this._totalSteps === 0) {
      this._progress = 0;
      return;
    }

    const completed = Array.from(this._results.values()).filter(
      (r) => r.status === 'completed' || r.status === 'skipped'
    ).length;

    this._progress = Math.round((completed / this._totalSteps) * 100);
  }

  /**
   * Estimate remaining time based on average step duration
   */
  get estimatedRemainingTime(): number | undefined {
    const completedResults = Array.from(this._results.values()).filter(
      (r) => r.status === 'completed' && r.duration
    );

    if (completedResults.length === 0) return undefined;

    const avgDuration =
      completedResults.reduce((sum, r) => sum + (r.duration ?? 0), 0) / completedResults.length;

    const remainingSteps = this._totalSteps - completedResults.length;
    return Math.round(avgDuration * remainingSteps);
  }

  /**
   * Get result for a specific step
   */
  getStepResult(stepId: string): ExecutionResult | undefined {
    return this._results.get(stepId);
  }

  /**
   * Pause execution (WKFL-COMM-005)
   */
  pause(): void {
    if (this._status !== 'running') {
      throw new Error(`Cannot pause execution in ${this._status} state`);
    }

    this._status = 'paused';
  }

  /**
   * Resume execution (WKFL-COMM-005)
   */
  resume(): void {
    if (this._status !== 'paused' && this._status !== 'failed') {
      throw new Error(`Cannot resume execution in ${this._status} state`);
    }

    this._status = 'running';
    this._failedStepId = undefined;
  }

  /**
   * Resume from failed step (WKFL-COMM-005)
   */
  resumeFromFailure(): void {
    if (this._status !== 'failed') {
      throw new Error(`Cannot resume from failure in ${this._status} state`);
    }

    // Clear failed step result so it can be retried
    if (this._failedStepId) {
      this._results.delete(this._failedStepId);
    }

    this._status = 'running';
    this._error = undefined;
    this._failedStepId = undefined;
    this._updateProgress();
  }

  /**
   * Retry a specific step (WKFL-COMM-005)
   */
  retryStep(stepId: string): void {
    // Remove the step result so it can be re-executed
    this._results.delete(stepId);
    
    // Clear error state if this was the failed step
    if (this._failedStepId === stepId) {
      this._failedStepId = undefined;
      this._error = undefined;
    }
    
    // If we were in failed state, resume
    if (this._status === 'failed') {
      this._status = 'running';
    }

    this._updateProgress();
  }

  /**
   * Cancel execution
   */
  cancel(): void {
    if (this._status === 'completed') {
      throw new Error('Cannot cancel completed execution');
    }

    this._status = 'cancelled';
    this._completedAt = new Date();
  }

  /**
   * Complete execution
   */
  complete(): void {
    this._status = 'completed';
    this._progress = 100;
    this._completedAt = new Date();
  }

  /**
   * Fail execution
   */
  fail(error: string): void {
    this._status = 'failed';
    this._error = error;
    this._completedAt = new Date();
  }

  /**
   * Get failed step IDs for retry (WKFL-COMM-005)
   */
  getFailedStepIds(): string[] {
    return Array.from(this._results.values())
      .filter((r) => r.status === 'failed')
      .map((r) => r.stepId);
  }

  /**
   * Get completed step IDs for resume (WKFL-COMM-005)
   */
  getCompletedStepIds(): string[] {
    return Array.from(this._results.values())
      .filter((r) => r.status === 'completed')
      .map((r) => r.stepId);
  }

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
  } {
    const results = Array.from(this._results.values());
    return {
      totalSteps: this._totalSteps,
      completedSteps: results.filter((r) => r.status === 'completed').length,
      failedSteps: results.filter((r) => r.status === 'failed').length,
      skippedSteps: results.filter((r) => r.status === 'skipped').length,
      progress: this._progress,
      duration: this.duration,
      status: this._status,
    };
  }

  /**
   * Serialize to JSON
   */
  toJSON(): object {
    return {
      id: this._id,
      workflowId: this._workflowId,
      userId: this._userId,
      status: this._status,
      progress: this._progress,
      totalSteps: this._totalSteps,
      results: Array.from(this._results.values()),
      error: this._error,
      failedStepId: this._failedStepId,
      parameters: this._parameters,
      environment: this._environment,
      startedAt: this._startedAt.toISOString(),
      completedAt: this._completedAt?.toISOString(),
    };
  }

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
  }): Execution {
    const execution = new Execution({
      id: json.id,
      workflowId: json.workflowId,
      userId: json.userId,
      status: json.status,
      progress: json.progress,
      totalSteps: json.totalSteps,
      parameters: json.parameters,
      environment: json.environment,
      startedAt: json.startedAt ? new Date(json.startedAt) : undefined,
    });

    // Restore results
    if (json.results) {
      for (const result of json.results) {
        execution._results.set(result.stepId, result);
      }
    }

    // Restore error state
    if (json.error) {
      execution._error = json.error;
    }
    if (json.failedStepId) {
      execution._failedStepId = json.failedStepId;
    }
    if (json.completedAt) {
      execution._completedAt = new Date(json.completedAt);
    }

    return execution;
  }
}
