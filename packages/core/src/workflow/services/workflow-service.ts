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

import { Workflow, type WorkflowSnapshot } from '../domain/workflow.js';
import { Step } from '../domain/step.js';
import type { ResearchDomain, StepStatus } from '../types.js';

/**
 * Workflow repository interface
 */
export interface WorkflowRepository {
  findById(id: string): Promise<Workflow | null>;
  findByUserId(userId: string): Promise<Workflow[]>;
  findByDomain(domain: ResearchDomain): Promise<Workflow[]>;
  save(workflow: Workflow): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Create workflow input
 */
export interface CreateWorkflowInput {
  name: string;
  description?: string;
  domain: ResearchDomain;
  userId: string;
  organizationId?: string;
}

/**
 * Create from template input
 */
export interface CreateFromTemplateInput {
  userId: string;
  name?: string;
  organizationId?: string;
}

/**
 * Update workflow input
 */
export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
}

/**
 * Add step input
 */
export interface AddStepInput {
  name: string;
  type: string;
  domain: ResearchDomain;
  config?: Record<string, unknown>;
  position?: { x: number; y: number };
  dependencies?: string[];
  optional?: boolean;
}

/**
 * Update step input
 */
export interface UpdateStepInput {
  name?: string;
  config?: Record<string, unknown>;
  position?: { x: number; y: number };
}

/**
 * Delete options
 */
export interface DeleteOptions {
  soft?: boolean;
}

/**
 * Clone options
 */
export interface CloneOptions {
  userId: string;
  name?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * WorkflowService - Application service for workflow management
 */
export class WorkflowService {
  constructor(private readonly repository: WorkflowRepository) {}

  /**
   * Create a new workflow (DASH-PROJ-001, DASH-PROJ-005)
   */
  async create(input: CreateWorkflowInput): Promise<Workflow> {
    const workflow = new Workflow({
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      domain: input.domain,
      userId: input.userId,
      organizationId: input.organizationId,
      status: 'draft',
      version: 1,
    });

    await this.repository.save(workflow);
    return workflow;
  }

  /**
   * Create workflow from template
   */
  async createFromTemplate(
    templateId: string,
    options: CreateFromTemplateInput
  ): Promise<Workflow> {
    const template = await this.repository.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const newId = crypto.randomUUID();
    const workflow = new Workflow({
      id: newId,
      name: options.name ?? `${template.name} (Copy)`,
      description: template.description,
      domain: template.domain,
      templateId: templateId,
      userId: options.userId,
      organizationId: options.organizationId,
      status: 'draft',
      version: 1,
    });

    // Clone steps with new IDs
    const stepIdMap = new Map<string, string>();
    for (const step of template.steps) {
      stepIdMap.set(step.id, crypto.randomUUID());
    }

    for (const step of template.steps) {
      const newStepId = stepIdMap.get(step.id)!;
      const newDependencies = step.dependencies.map((depId) => stepIdMap.get(depId) ?? depId);

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

      workflow.addStep(clonedStep);
    }

    await this.repository.save(workflow);
    return workflow;
  }

  /**
   * Get workflow by ID
   */
  async getById(id: string): Promise<Workflow | null> {
    return this.repository.findById(id);
  }

  /**
   * List workflows by user
   */
  async listByUser(userId: string): Promise<Workflow[]> {
    return this.repository.findByUserId(userId);
  }

  /**
   * List workflows by domain
   */
  async listByDomain(domain: ResearchDomain): Promise<Workflow[]> {
    return this.repository.findByDomain(domain);
  }

  /**
   * Update workflow (WKFL-COMM-001)
   */
  async update(id: string, input: UpdateWorkflowInput): Promise<Workflow> {
    const workflow = await this.repository.findById(id);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (workflow.status === 'archived') {
      throw new Error('Cannot modify archived workflow');
    }

    if (input.name !== undefined) {
      workflow.updateName(input.name);
    }

    if (input.description !== undefined) {
      workflow.updateDescription(input.description);
    }

    await this.repository.save(workflow);
    return workflow;
  }

  /**
   * Delete workflow (DASH-PROJ-001)
   */
  async delete(id: string, options?: DeleteOptions): Promise<void> {
    const workflow = await this.repository.findById(id);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (options?.soft) {
      workflow.archive();
      await this.repository.save(workflow);
    } else {
      await this.repository.delete(id);
    }
  }

  /**
   * Add step to workflow
   */
  async addStep(workflowId: string, input: AddStepInput): Promise<Workflow> {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const step = new Step({
      id: crypto.randomUUID(),
      name: input.name,
      type: input.type,
      domain: input.domain,
      config: input.config,
      position: input.position,
      dependencies: input.dependencies,
      optional: input.optional,
    });

    workflow.addStep(step);
    await this.repository.save(workflow);
    return workflow;
  }

  /**
   * Remove step from workflow
   */
  async removeStep(workflowId: string, stepId: string): Promise<Workflow> {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    workflow.removeStep(stepId);
    await this.repository.save(workflow);
    return workflow;
  }

  /**
   * Update step configuration
   */
  async updateStep(
    workflowId: string,
    stepId: string,
    input: UpdateStepInput
  ): Promise<Workflow> {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const step = workflow.getStep(stepId);
    if (!step) {
      throw new Error('Step not found');
    }

    if (input.name !== undefined) {
      step.updateName(input.name);
    }

    if (input.config !== undefined) {
      step.updateConfig(input.config);
    }

    if (input.position !== undefined) {
      step.updatePosition(input.position);
    }

    await this.repository.save(workflow);
    return workflow;
  }

  /**
   * Create version snapshot (WKFL-COMM-002)
   */
  async createSnapshot(workflowId: string): Promise<WorkflowSnapshot> {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const snapshot = workflow.createSnapshot();
    await this.repository.save(workflow);
    return snapshot;
  }

  /**
   * Get version history (WKFL-COMM-002)
   */
  async getVersionHistory(workflowId: string): Promise<WorkflowSnapshot[]> {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    return workflow.versionHistory;
  }

  /**
   * Activate workflow
   */
  async activate(workflowId: string): Promise<Workflow> {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (workflow.steps.length === 0) {
      throw new Error('Cannot activate workflow without steps');
    }

    workflow.activate();
    await this.repository.save(workflow);
    return workflow;
  }

  /**
   * Archive workflow
   */
  async archive(workflowId: string): Promise<Workflow> {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    workflow.archive();
    await this.repository.save(workflow);
    return workflow;
  }

  /**
   * Clone workflow
   */
  async clone(workflowId: string, options: CloneOptions): Promise<Workflow> {
    const original = await this.repository.findById(workflowId);
    if (!original) {
      throw new Error('Workflow not found');
    }

    const newId = crypto.randomUUID();
    const cloned = original.clone(newId);

    // Override with options
    if (options.name) {
      cloned.updateName(options.name);
    }

    // Update user (need to create new workflow since userId is readonly)
    const workflow = new Workflow({
      id: cloned.id,
      name: cloned.name,
      description: cloned.description,
      domain: cloned.domain,
      templateId: original.id,
      userId: options.userId,
      status: 'draft',
      version: 1,
    });

    // Copy steps
    for (const step of cloned.steps) {
      workflow.addStep(step);
    }

    await this.repository.save(workflow);
    return workflow;
  }

  /**
   * Validate workflow structure
   */
  async validate(workflowId: string): Promise<ValidationResult> {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    return workflow.validate();
  }

  /**
   * Check if user can access workflow
   */
  async canAccess(workflowId: string, userId: string): Promise<boolean> {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      return false;
    }

    // Published workflows are accessible to everyone
    if (workflow.status === 'published') {
      return true;
    }

    // Otherwise, only owner can access
    return workflow.userId === userId;
  }
}
