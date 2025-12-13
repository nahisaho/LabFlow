/**
 * Step Domain Entity
 */

import type { StepStatus, ResearchDomain } from '../types.js';

/**
 * Status change record
 */
export interface StatusHistoryEntry {
  status: StepStatus;
  timestamp: Date;
}

/**
 * Step execution metrics
 */
export interface StepMetrics {
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

/**
 * Workflow step entity
 */
export class Step {
  private _id: string;
  private _name: string;
  private _type: string;
  private _domain: ResearchDomain;
  private _config: Record<string, unknown>;
  private _requiredConfigFields: string[];
  private _position: { x: number; y: number };
  private _dependencies: string[];
  private _status: StepStatus;
  private _statusHistory: StatusHistoryEntry[];
  private _output?: unknown;
  private _metrics: StepMetrics;
  private _optional: boolean;

  constructor(params: {
    id: string;
    name: string;
    type: string;
    domain: ResearchDomain;
    config?: Record<string, unknown>;
    requiredConfigFields?: string[];
    position?: { x: number; y: number };
    dependencies?: string[];
    status?: StepStatus;
    optional?: boolean;
  }) {
    this._id = params.id;
    this._name = params.name;
    this._type = params.type;
    this._domain = params.domain;
    this._config = params.config ?? {};
    this._requiredConfigFields = params.requiredConfigFields ?? [];
    this._position = params.position ?? { x: 0, y: 0 };
    this._dependencies = params.dependencies ?? [];
    this._status = params.status ?? 'pending';
    this._statusHistory = [{ status: this._status, timestamp: new Date() }];
    this._metrics = {};
    this._optional = params.optional ?? false;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get type(): string {
    return this._type;
  }

  get domain(): ResearchDomain {
    return this._domain;
  }

  get config(): Record<string, unknown> {
    return { ...this._config };
  }

  get position(): { x: number; y: number } {
    return { ...this._position };
  }

  get dependencies(): string[] {
    return [...this._dependencies];
  }

  get status(): StepStatus {
    return this._status;
  }

  get statusHistory(): StatusHistoryEntry[] {
    return [...this._statusHistory];
  }

  get output(): unknown {
    return this._output;
  }

  get metrics(): StepMetrics {
    return { ...this._metrics };
  }

  get optional(): boolean {
    return this._optional;
  }

  /**
   * Update step name
   */
  updateName(name: string): void {
    this._name = name;
  }

  /**
   * Update step configuration
   */
  updateConfig(config: Record<string, unknown>): void {
    this._config = { ...this._config, ...config };
  }

  /**
   * Update step position
   */
  updatePosition(position: { x: number; y: number }): void {
    this._position = { ...position };
  }

  /**
   * Add dependency
   */
  addDependency(stepId: string): void {
    if (!this._dependencies.includes(stepId)) {
      this._dependencies.push(stepId);
    }
  }

  /**
   * Remove dependency
   */
  removeDependency(stepId: string): void {
    const index = this._dependencies.indexOf(stepId);
    if (index > -1) {
      this._dependencies.splice(index, 1);
    }
  }

  /**
   * Update status
   */
  updateStatus(status: StepStatus): void {
    this._status = status;
    this._statusHistory.push({ status, timestamp: new Date() });
  }

  /**
   * Validate config against required fields
   */
  validateConfig(): { valid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    for (const field of this._requiredConfigFields) {
      if (!(field in this._config) || this._config[field] === undefined) {
        missingFields.push(field);
      }
    }
    return {
      valid: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Check if this step depends on another step
   */
  dependsOn(stepId: string): boolean {
    return this._dependencies.includes(stepId);
  }

  /**
   * Start step execution
   */
  start(): void {
    if (this._status !== 'pending') {
      throw new Error(`Cannot start step in ${this._status} state`);
    }
    this._status = 'running';
    this._statusHistory.push({ status: 'running', timestamp: new Date() });
    this._metrics.startTime = new Date();
  }

  /**
   * Complete step execution
   */
  complete(output?: unknown): void {
    if (this._status !== 'running') {
      throw new Error(`Cannot complete step in ${this._status} state`);
    }
    this._status = 'completed';
    this._statusHistory.push({ status: 'completed', timestamp: new Date() });
    this._metrics.endTime = new Date();
    if (this._metrics.startTime) {
      this._metrics.duration = this._metrics.endTime.getTime() - this._metrics.startTime.getTime();
    }
    if (output !== undefined) {
      this._output = output;
    }
  }

  /**
   * Fail step execution
   */
  fail(error?: string): void {
    if (this._status !== 'running') {
      throw new Error(`Cannot fail step in ${this._status} state`);
    }
    this._status = 'failed';
    this._statusHistory.push({ status: 'failed', timestamp: new Date() });
    this._metrics.endTime = new Date();
    if (this._metrics.startTime) {
      this._metrics.duration = this._metrics.endTime.getTime() - this._metrics.startTime.getTime();
    }
    if (error) {
      this._output = { error };
    }
  }

  /**
   * Skip step (WKFL-COMM-004)
   */
  skip(reason?: string): void {
    if (this._status !== 'pending') {
      throw new Error(`Cannot skip step in ${this._status} state`);
    }
    if (!this._optional) {
      throw new Error('Cannot skip required step');
    }
    this._status = 'skipped';
    this._statusHistory.push({ status: 'skipped', timestamp: new Date() });
    if (reason) {
      this._output = { skipReason: reason };
    }
  }

  /**
   * Reset step to pending state
   */
  reset(): void {
    this._status = 'pending';
    this._statusHistory.push({ status: 'pending', timestamp: new Date() });
    this._output = undefined;
    this._metrics = {};
  }

  /**
   * Set step output
   */
  setOutput(output: unknown): void {
    this._output = output;
  }

  /**
   * Check if step is skippable
   */
  isSkippable(): boolean {
    return this._optional;
  }

  /**
   * Clone step with new ID
   */
  clone(newId?: string): Step {
    return new Step({
      id: newId ?? crypto.randomUUID(),
      name: this._name,
      type: this._type,
      domain: this._domain,
      config: { ...this._config },
      requiredConfigFields: [...this._requiredConfigFields],
      position: { ...this._position },
      dependencies: [...this._dependencies],
      status: 'pending',
      optional: this._optional,
    });
  }

  /**
   * Serialize to JSON
   */
  toJSON(): object {
    return {
      id: this._id,
      name: this._name,
      type: this._type,
      domain: this._domain,
      config: this._config,
      requiredConfigFields: this._requiredConfigFields,
      position: this._position,
      dependencies: this._dependencies,
      status: this._status,
      optional: this._optional,
      output: this._output,
      metrics: this._metrics,
    };
  }

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
    position?: { x: number; y: number };
    dependencies?: string[];
    status?: StepStatus;
    optional?: boolean;
  }): Step {
    return new Step({
      id: json.id,
      name: json.name,
      type: json.type,
      domain: json.domain,
      config: json.config,
      requiredConfigFields: json.requiredConfigFields,
      position: json.position,
      dependencies: json.dependencies,
      status: json.status,
      optional: json.optional,
    });
  }
}
