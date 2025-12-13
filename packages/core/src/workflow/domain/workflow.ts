/**
 * Workflow Domain Entity
 *
 * WKFL-COMM-001: Workflow metadata
 * WKFL-COMM-002: Version management
 */

import type {
  WorkflowStatus,
  WorkflowMetadata,
  ResearchDomain,
  StepDefinition,
  StepStatus,
} from '../types.js';
import { Step } from './step.js';

/**
 * Version snapshot type
 */
export interface WorkflowSnapshot {
  version: number;
  data: object;
  createdAt: Date;
}

/**
 * Workflow aggregate root
 */
export class Workflow {
  private _id: string;
  private _name: string;
  private _description?: string;
  private _domain: ResearchDomain;
  private _templateId?: string;
  private _version: number;
  private _versionHistory: WorkflowSnapshot[];
  private _status: WorkflowStatus;
  private _userId: string;
  private _organizationId?: string;
  private _steps: Map<string, Step>;
  private _createdAt: Date;
  private _updatedAt: Date;

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
  }) {
    this._id = params.id;
    this._name = params.name;
    this._description = params.description;
    this._domain = params.domain;
    this._templateId = params.templateId;
    this._version = params.version ?? 1;
    this._versionHistory = [];
    this._status = params.status ?? 'draft';
    this._userId = params.userId;
    this._organizationId = params.organizationId;
    this._steps = new Map();
    this._createdAt = params.createdAt ?? new Date();
    this._updatedAt = params.updatedAt ?? new Date();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get domain(): ResearchDomain {
    return this._domain;
  }

  get templateId(): string | undefined {
    return this._templateId;
  }

  get version(): number {
    return this._version;
  }

  get status(): WorkflowStatus {
    return this._status;
  }

  get userId(): string {
    return this._userId;
  }

  get organizationId(): string | undefined {
    return this._organizationId;
  }

  get steps(): Step[] {
    return Array.from(this._steps.values());
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Get workflow metadata
   */
  getMetadata(): WorkflowMetadata & { stepCount: number } {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      domain: this._domain,
      templateId: this._templateId,
      version: this._version,
      status: this._status,
      userId: this._userId,
      organizationId: this._organizationId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      stepCount: this._steps.size,
    };
  }

  /**
   * Add a step to the workflow
   */
  addStep(step: Step): void {
    if (this._status === 'archived') {
      throw new Error('Cannot modify archived workflow');
    }

    // Check for duplicate step ID
    if (this._steps.has(step.id)) {
      throw new Error(`Step with ID ${step.id} already exists`);
    }

    // Validate dependencies exist
    for (const depId of step.dependencies) {
      if (!this._steps.has(depId)) {
        throw new Error(`Dependency step ${depId} not found`);
      }
    }

    this._steps.set(step.id, step);
    this._incrementVersion();
  }

  /**
   * Remove a step from the workflow
   */
  /**
   * Remove a step from the workflow
   */
  removeStep(stepId: string): void {
    if (this._status === 'archived') {
      throw new Error('Cannot modify archived workflow');
    }

    // Check if any step depends on this step
    for (const step of this._steps.values()) {
      if (step.dependencies.includes(stepId)) {
        throw new Error(`Cannot remove step ${stepId}: step ${step.id} depends on it`);
      }
    }

    this._steps.delete(stepId);
    this._incrementVersion();
  }

  /**
   * Get a step by ID
   */
  getStep(stepId: string): Step | undefined {
    return this._steps.get(stepId);
  }

  /**
   * Update workflow name
   */
  updateName(name: string): void {
    if (this._status === 'archived') {
      throw new Error('Cannot modify archived workflow');
    }

    this._name = name;
    this._incrementVersion();
  }

  /**
   * Update workflow description
   */
  updateDescription(description: string): void {
    if (this._status === 'archived') {
      throw new Error('Cannot modify archived workflow');
    }

    this._description = description;
    this._incrementVersion();
  }

  /**
   * Increment version (private helper)
   */
  private _incrementVersion(): void {
    this._version += 1;
    this._updatedAt = new Date();
  }

  /**
   * Reorder steps
   */
  reorderSteps(stepIds: string[]): void {
    if (this._status === 'archived') {
      throw new Error('Cannot modify archived workflow');
    }

    // Verify all IDs exist
    for (const id of stepIds) {
      if (!this._steps.has(id)) {
        throw new Error(`Step ${id} not found`);
      }
    }

    // Rebuild Map in new order
    const newSteps = new Map<string, Step>();
    for (const id of stepIds) {
      newSteps.set(id, this._steps.get(id)!);
    }
    this._steps = newSteps;
    this._incrementVersion();
  }

  /**
   * Activate workflow (draft -> active)
   */
  activate(): void {
    if (this._status !== 'draft') {
      throw new Error(`Cannot activate workflow in ${this._status} state`);
    }
    this._status = 'active';
    this._updatedAt = new Date();
  }

  /**
   * Complete workflow (active -> completed)
   */
  complete(): void {
    if (this._status !== 'active') {
      throw new Error(`Cannot complete workflow in ${this._status} state`);
    }
    this._status = 'completed';
    this._updatedAt = new Date();
  }

  /**
   * Validate workflow structure
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Must have at least one step
    if (this._steps.size === 0) {
      errors.push('Workflow must have at least one step');
    }

    // Check dependencies exist
    for (const step of this._steps.values()) {
      for (const depId of step.dependencies) {
        if (!this._steps.has(depId)) {
          errors.push(`Step ${step.id} depends on non-existent step ${depId}`);
        }
      }
    }

    // Check for cycles
    try {
      this.validateNoCycles();
    } catch {
      errors.push('Workflow contains circular dependencies');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clone workflow with new ID
   */
  clone(newId: string): Workflow {
    const cloned = new Workflow({
      id: newId,
      name: this._name,
      description: this._description,
      domain: this._domain,
      templateId: this._id,
      version: 1,
      status: 'draft',
      userId: this._userId,
      organizationId: this._organizationId,
    });

    // Clone steps - need to remap step IDs and their dependencies
    const stepIdMap = new Map<string, string>();
    
    // First pass: create ID mapping
    for (const step of this._steps.values()) {
      stepIdMap.set(step.id, crypto.randomUUID());
    }
    
    // Second pass: clone steps with remapped dependencies
    for (const step of this._steps.values()) {
      const newStepId = stepIdMap.get(step.id)!;
      const newDependencies = step.dependencies.map(depId => stepIdMap.get(depId) ?? depId);
      
      const clonedStep = new Step({
        id: newStepId,
        name: step.name,
        type: step.type,
        domain: step.domain,
        config: { ...step.config },
        position: { ...step.position },
        dependencies: newDependencies,
        status: 'pending',
      });
      
      // Bypass normal addStep validation for internal cloning
      cloned._steps.set(newStepId, clonedStep);
    }

    return cloned;
  }

  /**
   * Create template from workflow (strips user-specific data)
   */
  toTemplate(): object {
    return {
      name: this._name,
      description: this._description,
      domain: this._domain,
      steps: this.steps.map((s) => ({
        name: s.name,
        type: s.type,
        domain: s.domain,
        config: s.config,
        dependencies: s.dependencies,
      })),
    };
  }

  /**
   * Create version snapshot (WKFL-COMM-002)
   */
  createSnapshot(): WorkflowSnapshot {
    const snapshot: WorkflowSnapshot = {
      version: this._version,
      data: this.toJSON(),
      createdAt: new Date(),
    };
    this._versionHistory.push(snapshot);
    return snapshot;
  }

  /**
   * Get version history
   */
  get versionHistory(): WorkflowSnapshot[] {
    return [...this._versionHistory];
  }

  /**
   * Publish workflow (WKFL-COMM-002)
   */
  publish(): void {
    if (this._steps.size === 0) {
      throw new Error('Cannot publish workflow without steps');
    }

    // Validate workflow has no cycles
    this.validateNoCycles();

    this._status = 'published';
    this._version += 1;
    this._updatedAt = new Date();
  }

  /**
   * Archive workflow
   */
  archive(): void {
    this._status = 'archived';
    this._updatedAt = new Date();
  }

  /**
   * Create a draft copy
   */
  createDraft(): Workflow {
    const draft = new Workflow({
      id: crypto.randomUUID(),
      name: `${this._name} (Copy)`,
      description: this._description,
      domain: this._domain,
      templateId: this._id,
      version: 1,
      status: 'draft',
      userId: this._userId,
      organizationId: this._organizationId,
    });

    // Copy steps
    for (const step of this._steps.values()) {
      draft.addStep(step.clone());
    }

    return draft;
  }

  /**
   * Validate workflow is a valid DAG (no cycles)
   */
  validateNoCycles(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepId: string): boolean => {
      visited.add(stepId);
      recursionStack.add(stepId);

      const step = this._steps.get(stepId);
      if (step) {
        for (const depId of step.dependencies) {
          if (!visited.has(depId) && hasCycle(depId)) {
            return true;
          }
          if (recursionStack.has(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const stepId of this._steps.keys()) {
      if (!visited.has(stepId) && hasCycle(stepId)) {
        throw new Error('Workflow contains a cycle');
      }
    }
  }

  /**
   * Get execution order (topological sort)
   */
  getExecutionOrder(): string[] {
    const order: string[] = [];
    const visited = new Set<string>();

    const visit = (stepId: string): void => {
      if (visited.has(stepId)) return;
      visited.add(stepId);

      const step = this._steps.get(stepId);
      if (step) {
        for (const depId of step.dependencies) {
          visit(depId);
        }
      }

      order.push(stepId);
    };

    for (const stepId of this._steps.keys()) {
      visit(stepId);
    }

    return order;
  }

  /**
   * Serialize to JSON
   */
  toJSON(): object {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      domain: this._domain,
      templateId: this._templateId,
      version: this._version,
      status: this._status,
      userId: this._userId,
      organizationId: this._organizationId,
      steps: this.steps.map((s) => s.toJSON()),
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

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
      position?: { x: number; y: number };
      dependencies?: string[];
      status?: StepStatus;
    }>;
    createdAt?: string;
    updatedAt?: string;
  }): Workflow {
    const workflow = new Workflow({
      id: json.id,
      name: json.name,
      description: json.description,
      domain: json.domain,
      templateId: json.templateId,
      version: json.version,
      status: json.status,
      userId: json.userId,
      organizationId: json.organizationId,
      createdAt: json.createdAt ? new Date(json.createdAt) : undefined,
      updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined,
    });

    // Add steps
    if (json.steps) {
      for (const stepJson of json.steps) {
        const step = Step.fromJSON(stepJson);
        workflow._steps.set(step.id, step);
      }
    }

    return workflow;
  }
}
