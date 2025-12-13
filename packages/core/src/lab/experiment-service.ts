/**
 * Experiment Service
 *
 * Requirements:
 * - LAB-EXP-001: Experiment tracking
 * - LAB-EXP-002: Experiment lifecycle management
 * - LAB-EXP-003: Results storage
 */

import { randomUUID } from 'crypto';
import type {
  LabExperiment,
  ExperimentStatus,
  ExperimentResults,
  CreateExperimentInput,
  UpdateExperimentInput,
  ListExperimentsOptions,
  PermissionCheck,
  LabMemberRole,
} from './types.js';

/**
 * Experiment repository interface
 */
export interface ExperimentRepository {
  createExperiment(experiment: LabExperiment): Promise<LabExperiment>;
  getExperiment(id: string): Promise<LabExperiment | null>;
  updateExperiment(id: string, experiment: Partial<LabExperiment>): Promise<LabExperiment | null>;
  deleteExperiment(id: string): Promise<boolean>;
  listExperiments(options: ListExperimentsOptions): Promise<LabExperiment[]>;
  countExperiments(labId: string): Promise<number>;
  countExperimentsByStatus(labId: string): Promise<Record<ExperimentStatus, number>>;
}

/**
 * Permission service interface
 */
export interface LabPermissionService {
  checkPermission(labId: string, userId: string, requiredRole: LabMemberRole): Promise<PermissionCheck>;
}

/**
 * Workflow execution service interface (optional)
 */
export interface WorkflowExecutor {
  startWorkflow(workflowId: string, parameters: Record<string, unknown>): Promise<string>;
  getWorkflowStatus(executionId: string): Promise<{ status: string; results?: unknown }>;
  cancelWorkflow(executionId: string): Promise<boolean>;
}

/**
 * Experiment service for managing lab experiments
 */
export class ExperimentService {
  constructor(
    private readonly repository: ExperimentRepository,
    private readonly permissionService: LabPermissionService,
    private readonly workflowExecutor?: WorkflowExecutor
  ) {}

  /**
   * Create a new experiment
   */
  async createExperiment(input: CreateExperimentInput, userId: string): Promise<LabExperiment> {
    // Check permission
    const hasAccess = await this.permissionService.checkPermission(input.labId, userId, 'member');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    const now = new Date();
    const experiment: LabExperiment = {
      id: randomUUID(),
      labId: input.labId,
      name: input.name,
      description: input.description ?? null,
      status: 'draft',
      workflowId: input.workflowId ?? null,
      parameters: input.parameters ?? {},
      results: null,
      tags: input.tags ?? [],
      createdById: userId,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.createExperiment(experiment);
  }

  /**
   * Get an experiment by ID
   */
  async getExperiment(id: string, userId: string): Promise<LabExperiment | null> {
    const experiment = await this.repository.getExperiment(id);
    if (!experiment) {
      return null;
    }

    const hasAccess = await this.permissionService.checkPermission(experiment.labId, userId, 'viewer');
    if (!hasAccess.allowed) {
      return null;
    }

    return experiment;
  }

  /**
   * Update an experiment
   */
  async updateExperiment(id: string, input: UpdateExperimentInput, userId: string): Promise<LabExperiment | null> {
    const experiment = await this.repository.getExperiment(id);
    if (!experiment) {
      return null;
    }

    // Check permission - creator or admin can update
    const hasAccess = await this.permissionService.checkPermission(experiment.labId, userId, 'member');
    if (!hasAccess.allowed && experiment.createdById !== userId) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    // Validate status transitions
    if (input.status !== undefined) {
      this.validateStatusTransition(experiment.status, input.status);
    }

    const updates: Partial<LabExperiment> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.status !== undefined) updates.status = input.status;
    if (input.parameters !== undefined) updates.parameters = input.parameters;
    if (input.results !== undefined) updates.results = input.results;
    if (input.tags !== undefined) updates.tags = input.tags;
    if (input.startedAt !== undefined) updates.startedAt = input.startedAt;
    if (input.completedAt !== undefined) updates.completedAt = input.completedAt;

    return this.repository.updateExperiment(id, updates);
  }

  /**
   * Delete an experiment
   */
  async deleteExperiment(id: string, userId: string): Promise<boolean> {
    const experiment = await this.repository.getExperiment(id);
    if (!experiment) {
      return false;
    }

    // Check permission - creator or admin can delete
    const hasAccess = await this.permissionService.checkPermission(experiment.labId, userId, 'admin');
    if (!hasAccess.allowed && experiment.createdById !== userId) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    // Can't delete running experiments
    if (experiment.status === 'running') {
      throw new Error('Cannot delete a running experiment. Cancel it first.');
    }

    return this.repository.deleteExperiment(id);
  }

  /**
   * List experiments in a lab
   */
  async listExperiments(options: ListExperimentsOptions, userId: string): Promise<LabExperiment[]> {
    const hasAccess = await this.permissionService.checkPermission(options.labId, userId, 'viewer');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    return this.repository.listExperiments(options);
  }

  /**
   * Start an experiment
   */
  async startExperiment(id: string, userId: string): Promise<LabExperiment> {
    const experiment = await this.repository.getExperiment(id);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const hasAccess = await this.permissionService.checkPermission(experiment.labId, userId, 'member');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    if (experiment.status !== 'draft') {
      throw new Error(`Cannot start experiment in ${experiment.status} status`);
    }

    const now = new Date();
    const updates: Partial<LabExperiment> = {
      status: 'running',
      startedAt: now,
      updatedAt: now,
    };

    // If there's a workflow, execute it
    if (experiment.workflowId && this.workflowExecutor) {
      try {
        await this.workflowExecutor.startWorkflow(experiment.workflowId, experiment.parameters);
      } catch (error) {
        updates.status = 'failed';
        updates.completedAt = now;
        updates.results = {
          error: error instanceof Error ? error.message : 'Unknown error starting workflow',
        };
      }
    }

    const updated = await this.repository.updateExperiment(id, updates);
    if (!updated) {
      throw new Error('Failed to update experiment');
    }

    return updated;
  }

  /**
   * Complete an experiment with results
   */
  async completeExperiment(id: string, results: ExperimentResults, userId: string): Promise<LabExperiment> {
    const experiment = await this.repository.getExperiment(id);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const hasAccess = await this.permissionService.checkPermission(experiment.labId, userId, 'member');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    if (experiment.status !== 'running') {
      throw new Error(`Cannot complete experiment in ${experiment.status} status`);
    }

    const now = new Date();
    const updated = await this.repository.updateExperiment(id, {
      status: 'completed',
      results,
      completedAt: now,
      updatedAt: now,
    });

    if (!updated) {
      throw new Error('Failed to update experiment');
    }

    return updated;
  }

  /**
   * Fail an experiment
   */
  async failExperiment(id: string, error: string, userId: string): Promise<LabExperiment> {
    const experiment = await this.repository.getExperiment(id);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const hasAccess = await this.permissionService.checkPermission(experiment.labId, userId, 'member');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    if (experiment.status !== 'running') {
      throw new Error(`Cannot fail experiment in ${experiment.status} status`);
    }

    const now = new Date();
    const updated = await this.repository.updateExperiment(id, {
      status: 'failed',
      results: {
        ...(experiment.results || {}),
        error,
      },
      completedAt: now,
      updatedAt: now,
    });

    if (!updated) {
      throw new Error('Failed to update experiment');
    }

    return updated;
  }

  /**
   * Cancel an experiment
   */
  async cancelExperiment(id: string, userId: string): Promise<LabExperiment> {
    const experiment = await this.repository.getExperiment(id);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const hasAccess = await this.permissionService.checkPermission(experiment.labId, userId, 'member');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    if (experiment.status !== 'running' && experiment.status !== 'draft') {
      throw new Error(`Cannot cancel experiment in ${experiment.status} status`);
    }

    // Cancel workflow if running
    if (experiment.status === 'running' && experiment.workflowId && this.workflowExecutor) {
      try {
        await this.workflowExecutor.cancelWorkflow(experiment.workflowId);
      } catch (error) {
        console.error('Failed to cancel workflow:', error);
      }
    }

    const now = new Date();
    const updated = await this.repository.updateExperiment(id, {
      status: 'cancelled',
      completedAt: now,
      updatedAt: now,
    });

    if (!updated) {
      throw new Error('Failed to update experiment');
    }

    return updated;
  }

  /**
   * Get experiment statistics for a lab
   */
  async getExperimentStats(labId: string, userId: string): Promise<{
    total: number;
    byStatus: Record<ExperimentStatus, number>;
    recentCompleted: number;
    successRate: number;
  }> {
    const hasAccess = await this.permissionService.checkPermission(labId, userId, 'viewer');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    const [total, byStatus] = await Promise.all([
      this.repository.countExperiments(labId),
      this.repository.countExperimentsByStatus(labId),
    ]);

    const completed = byStatus.completed || 0;
    const failed = byStatus.failed || 0;
    const totalFinished = completed + failed;

    return {
      total,
      byStatus,
      recentCompleted: completed,
      successRate: totalFinished > 0 ? (completed / totalFinished) * 100 : 0,
    };
  }

  /**
   * Validate status transitions
   */
  private validateStatusTransition(currentStatus: ExperimentStatus, newStatus: ExperimentStatus): void {
    const validTransitions: Record<ExperimentStatus, ExperimentStatus[]> = {
      draft: ['running', 'cancelled'],
      running: ['completed', 'failed', 'cancelled'],
      completed: [], // Terminal state
      failed: ['draft'], // Can retry
      cancelled: ['draft'], // Can retry
    };

    const allowed = validTransitions[currentStatus];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  /**
   * Clone an experiment
   */
  async cloneExperiment(id: string, newName: string, userId: string): Promise<LabExperiment> {
    const experiment = await this.repository.getExperiment(id);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const hasAccess = await this.permissionService.checkPermission(experiment.labId, userId, 'member');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    return this.createExperiment(
      {
        labId: experiment.labId,
        name: newName,
        description: experiment.description ?? undefined,
        workflowId: experiment.workflowId ?? undefined,
        parameters: { ...experiment.parameters },
        tags: [...experiment.tags],
      },
      userId
    );
  }
}
