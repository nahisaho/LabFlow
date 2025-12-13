/**
 * Experiment Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExperimentService } from '../src/lab/experiment-service.js';
import type {
  LabExperiment,
  ExperimentStatus,
  LabMemberRole,
} from '../src/lab/types.js';
import type {
  ExperimentRepository,
  WorkflowExecutor,
} from '../src/lab/experiment-service.js';
import type { LabPermissionService } from '../src/lab/dataset-service.js';

// Mock experiment repository
function createMockRepository(): ExperimentRepository {
  const experiments = new Map<string, LabExperiment>();

  return {
    createExperiment: vi.fn(async (experiment: LabExperiment) => {
      experiments.set(experiment.id, experiment);
      return experiment;
    }),
    getExperiment: vi.fn(async (id: string) => experiments.get(id) ?? null),
    updateExperiment: vi.fn(async (id: string, updates: Partial<LabExperiment>) => {
      const experiment = experiments.get(id);
      if (!experiment) return null;
      const updated = { ...experiment, ...updates };
      experiments.set(id, updated);
      return updated;
    }),
    deleteExperiment: vi.fn(async (id: string) => experiments.delete(id)),
    listExperiments: vi.fn(async () => Array.from(experiments.values())),
    countExperiments: vi.fn(async () => experiments.size),
    countExperimentsByStatus: vi.fn(async (): Promise<Record<ExperimentStatus, number>> => ({
      draft: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    })),
  };
}

// Mock permission service
function createMockPermissionService(allowed = true): LabPermissionService {
  return {
    checkPermission: vi.fn(async () => ({
      allowed,
      reason: allowed ? undefined : 'Permission denied',
    })),
    getLabSettings: vi.fn(async () => ({
      maxStorageGb: 100,
      defaultVisibility: 'lab' as const,
      requireApprovalForPublic: true,
      enableGraphRAG: true,
    })),
  };
}

// Mock workflow executor
function createMockWorkflowExecutor(): WorkflowExecutor {
  return {
    startWorkflow: vi.fn(async () => 'execution-1'),
    getWorkflowStatus: vi.fn(async () => ({ status: 'running' })),
    cancelWorkflow: vi.fn(async () => true),
  };
}

describe('ExperimentService', () => {
  let service: ExperimentService;
  let repository: ExperimentRepository;
  let permissionService: LabPermissionService;
  let workflowExecutor: WorkflowExecutor;

  beforeEach(() => {
    repository = createMockRepository();
    permissionService = createMockPermissionService();
    workflowExecutor = createMockWorkflowExecutor();
    service = new ExperimentService(repository, permissionService, workflowExecutor);
  });

  describe('createExperiment', () => {
    it('should create an experiment', async () => {
      const experiment = await service.createExperiment(
        {
          labId: 'lab-1',
          name: 'Test Experiment',
          description: 'Testing',
        },
        'user-1'
      );

      expect(experiment).toBeDefined();
      expect(experiment.name).toBe('Test Experiment');
      expect(experiment.status).toBe('draft');
      expect(experiment.createdById).toBe('user-1');
      expect(repository.createExperiment).toHaveBeenCalled();
    });

    it('should create experiment with workflow', async () => {
      const experiment = await service.createExperiment(
        {
          labId: 'lab-1',
          name: 'Workflow Experiment',
          workflowId: 'workflow-1',
          parameters: { input: 'test' },
        },
        'user-1'
      );

      expect(experiment.workflowId).toBe('workflow-1');
      expect(experiment.parameters).toEqual({ input: 'test' });
    });

    it('should throw when permission denied', async () => {
      permissionService = createMockPermissionService(false);
      service = new ExperimentService(repository, permissionService);

      await expect(
        service.createExperiment(
          { labId: 'lab-1', name: 'Test' },
          'user-1'
        )
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('startExperiment', () => {
    it('should start a draft experiment', async () => {
      const created = await service.createExperiment(
        { labId: 'lab-1', name: 'Test Experiment' },
        'user-1'
      );

      const started = await service.startExperiment(created.id, 'user-1');

      expect(started.status).toBe('running');
      expect(started.startedAt).toBeDefined();
    });

    it('should not start already running experiment', async () => {
      const created = await service.createExperiment(
        { labId: 'lab-1', name: 'Test Experiment' },
        'user-1'
      );

      await service.startExperiment(created.id, 'user-1');

      await expect(
        service.startExperiment(created.id, 'user-1')
      ).rejects.toThrow('Cannot start experiment in running status');
    });

    it('should execute workflow when specified', async () => {
      const created = await service.createExperiment(
        {
          labId: 'lab-1',
          name: 'Workflow Experiment',
          workflowId: 'workflow-1',
          parameters: { input: 'test' },
        },
        'user-1'
      );

      await service.startExperiment(created.id, 'user-1');

      expect(workflowExecutor.startWorkflow).toHaveBeenCalledWith(
        'workflow-1',
        { input: 'test' }
      );
    });
  });

  describe('completeExperiment', () => {
    it('should complete a running experiment', async () => {
      const created = await service.createExperiment(
        { labId: 'lab-1', name: 'Test Experiment' },
        'user-1'
      );
      await service.startExperiment(created.id, 'user-1');

      const completed = await service.completeExperiment(
        created.id,
        {
          metrics: { accuracy: 0.95 },
          artifacts: ['model.pkl'],
        },
        'user-1'
      );

      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeDefined();
      expect(completed.results?.metrics?.accuracy).toBe(0.95);
    });

    it('should not complete draft experiment', async () => {
      const created = await service.createExperiment(
        { labId: 'lab-1', name: 'Test Experiment' },
        'user-1'
      );

      await expect(
        service.completeExperiment(created.id, {}, 'user-1')
      ).rejects.toThrow('Cannot complete experiment in draft status');
    });
  });

  describe('failExperiment', () => {
    it('should fail a running experiment', async () => {
      const created = await service.createExperiment(
        { labId: 'lab-1', name: 'Test Experiment' },
        'user-1'
      );
      await service.startExperiment(created.id, 'user-1');

      const failed = await service.failExperiment(
        created.id,
        'Out of memory',
        'user-1'
      );

      expect(failed.status).toBe('failed');
      expect(failed.results?.error).toBe('Out of memory');
    });
  });

  describe('cancelExperiment', () => {
    it('should cancel a running experiment', async () => {
      const created = await service.createExperiment(
        { labId: 'lab-1', name: 'Test Experiment' },
        'user-1'
      );
      await service.startExperiment(created.id, 'user-1');

      const cancelled = await service.cancelExperiment(created.id, 'user-1');

      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.completedAt).toBeDefined();
    });

    it('should cancel a draft experiment', async () => {
      const created = await service.createExperiment(
        { labId: 'lab-1', name: 'Test Experiment' },
        'user-1'
      );

      const cancelled = await service.cancelExperiment(created.id, 'user-1');

      expect(cancelled.status).toBe('cancelled');
    });

    it('should not cancel completed experiment', async () => {
      const created = await service.createExperiment(
        { labId: 'lab-1', name: 'Test Experiment' },
        'user-1'
      );
      await service.startExperiment(created.id, 'user-1');
      await service.completeExperiment(created.id, {}, 'user-1');

      await expect(
        service.cancelExperiment(created.id, 'user-1')
      ).rejects.toThrow('Cannot cancel experiment in completed status');
    });

    it('should cancel workflow when running', async () => {
      const created = await service.createExperiment(
        {
          labId: 'lab-1',
          name: 'Workflow Experiment',
          workflowId: 'workflow-1',
        },
        'user-1'
      );
      await service.startExperiment(created.id, 'user-1');

      await service.cancelExperiment(created.id, 'user-1');

      expect(workflowExecutor.cancelWorkflow).toHaveBeenCalledWith('workflow-1');
    });
  });

  describe('deleteExperiment', () => {
    it('should delete draft experiment', async () => {
      const created = await service.createExperiment(
        { labId: 'lab-1', name: 'Test Experiment' },
        'user-1'
      );

      const result = await service.deleteExperiment(created.id, 'user-1');

      expect(result).toBe(true);
      expect(repository.deleteExperiment).toHaveBeenCalledWith(created.id);
    });

    it('should not delete running experiment', async () => {
      const created = await service.createExperiment(
        { labId: 'lab-1', name: 'Test Experiment' },
        'user-1'
      );
      await service.startExperiment(created.id, 'user-1');

      await expect(
        service.deleteExperiment(created.id, 'user-1')
      ).rejects.toThrow('Cannot delete a running experiment');
    });
  });

  describe('cloneExperiment', () => {
    it('should clone an experiment', async () => {
      const original = await service.createExperiment(
        {
          labId: 'lab-1',
          name: 'Original Experiment',
          description: 'Original description',
          parameters: { batch_size: 32 },
          tags: ['ml', 'production'],
        },
        'user-1'
      );

      const cloned = await service.cloneExperiment(
        original.id,
        'Cloned Experiment',
        'user-1'
      );

      expect(cloned.name).toBe('Cloned Experiment');
      expect(cloned.description).toBe('Original description');
      expect(cloned.parameters).toEqual({ batch_size: 32 });
      expect(cloned.tags).toEqual(['ml', 'production']);
      expect(cloned.status).toBe('draft');
      expect(cloned.id).not.toBe(original.id);
    });
  });

  describe('getExperimentStats', () => {
    it('should return experiment statistics', async () => {
      repository.countExperiments = vi.fn(async () => 10);
      repository.countExperimentsByStatus = vi.fn(async () => ({
        draft: 2,
        running: 1,
        completed: 5,
        failed: 1,
        cancelled: 1,
      }));

      const stats = await service.getExperimentStats('lab-1', 'user-1');

      expect(stats.total).toBe(10);
      expect(stats.byStatus.completed).toBe(5);
      expect(stats.successRate).toBeCloseTo(83.33, 1);
    });

    it('should return 0 success rate when no finished experiments', async () => {
      repository.countExperiments = vi.fn(async () => 3);
      repository.countExperimentsByStatus = vi.fn(async () => ({
        draft: 2,
        running: 1,
        completed: 0,
        failed: 0,
        cancelled: 0,
      }));

      const stats = await service.getExperimentStats('lab-1', 'user-1');

      expect(stats.successRate).toBe(0);
    });
  });

  describe('status transitions', () => {
    it('should allow failed to draft (retry)', async () => {
      const created = await service.createExperiment(
        { labId: 'lab-1', name: 'Test' },
        'user-1'
      );
      await service.startExperiment(created.id, 'user-1');
      await service.failExperiment(created.id, 'Error', 'user-1');

      const updated = await service.updateExperiment(
        created.id,
        { status: 'draft' },
        'user-1'
      );

      expect(updated?.status).toBe('draft');
    });

    it('should allow cancelled to draft (retry)', async () => {
      const created = await service.createExperiment(
        { labId: 'lab-1', name: 'Test' },
        'user-1'
      );
      await service.cancelExperiment(created.id, 'user-1');

      const updated = await service.updateExperiment(
        created.id,
        { status: 'draft' },
        'user-1'
      );

      expect(updated?.status).toBe('draft');
    });

    it('should not allow completed to running', async () => {
      const created = await service.createExperiment(
        { labId: 'lab-1', name: 'Test' },
        'user-1'
      );
      await service.startExperiment(created.id, 'user-1');
      await service.completeExperiment(created.id, {}, 'user-1');

      await expect(
        service.updateExperiment(created.id, { status: 'running' }, 'user-1')
      ).rejects.toThrow('Invalid status transition');
    });
  });
});
