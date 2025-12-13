/**
 * ExecutionService Tests
 *
 * Requirements:
 * - DASH-PROG-001: Progress visualization
 * - DASH-PROG-003: Progress percentage
 * - WKFL-COMM-005: Resume from failure
 * - WKFL-COMM-006: Intermediate result persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Workflow } from '../../src/workflow/domain/workflow.js';
import type { Execution } from '../../src/workflow/domain/execution.js';
import type { Step } from '../../src/workflow/domain/step.js';
import type { ExecutionResult, ResearchDomain } from '../../src/workflow/types.js';
import {
  ExecutionService,
  type ExecutionRepository,
  type WorkflowRepository,
  type StartExecutionInput,
  type StepExecutionOptions,
} from '../../src/workflow/services/execution-service.js';

describe('ExecutionService', () => {
  let service: ExecutionService;
  let executionRepository: ExecutionRepository;
  let workflowRepository: WorkflowRepository;

  // Mock workflow with steps
  const createMockWorkflow = (stepCount: number = 3): Workflow => {
    const steps: Step[] = [];
    for (let i = 0; i < stepCount; i++) {
      steps.push({
        id: `step-${i + 1}`,
        name: `Step ${i + 1}`,
        type: 'data_processing',
        domain: 'drug_discovery' as ResearchDomain,
        status: 'pending',
        config: {},
        position: { x: i * 100, y: 0 },
      } as unknown as Step);
    }

    return {
      id: 'workflow-1',
      name: 'Test Workflow',
      domain: 'drug_discovery' as ResearchDomain,
      userId: 'user-1',
      status: 'active',
      steps,
      getMetadata: () => ({ stepCount }),
    } as unknown as Workflow;
  };

  // Mock execution
  const createMockExecution = (
    status: string = 'queued',
    progress: number = 0
  ): Execution => {
    return {
      id: 'exec-1',
      workflowId: 'workflow-1',
      userId: 'user-1',
      status,
      progress,
      totalSteps: 3,
      results: [],
      parameters: {},
      environment: {},
      startedAt: new Date(),
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      cancel: vi.fn(),
      complete: vi.fn(),
      fail: vi.fn(),
      setTotalSteps: vi.fn(),
      setParameters: vi.fn(),
      recordStepResult: vi.fn(),
      getStepResult: vi.fn(),
      resumeFromFailure: vi.fn(),
      retryStep: vi.fn(),
      getFailedStepIds: vi.fn().mockReturnValue([]),
      getCompletedStepIds: vi.fn().mockReturnValue([]),
      getSummary: vi.fn().mockReturnValue({
        totalSteps: 3,
        completedSteps: 0,
        failedSteps: 0,
        skippedSteps: 0,
        progress: 0,
        duration: undefined,
        status: 'queued',
      }),
    } as unknown as Execution;
  };

  beforeEach(() => {
    executionRepository = {
      findById: vi.fn(),
      findByWorkflowId: vi.fn().mockResolvedValue([]),
      findByUserId: vi.fn().mockResolvedValue([]),
      findByStatus: vi.fn().mockResolvedValue([]),
      save: vi.fn(),
      delete: vi.fn(),
    };

    workflowRepository = {
      findById: vi.fn().mockResolvedValue(createMockWorkflow()),
    };

    service = new ExecutionService(executionRepository, workflowRepository);
  });

  describe('start', () => {
    it('should start a new execution for a workflow', async () => {
      const input: StartExecutionInput = {
        workflowId: 'workflow-1',
        userId: 'user-1',
        parameters: { inputData: 'test' },
      };

      const execution = await service.start(input);

      expect(execution).toBeDefined();
      expect(execution.workflowId).toBe('workflow-1');
      expect(execution.userId).toBe('user-1');
      expect(executionRepository.save).toHaveBeenCalled();
    });

    it('should throw error when workflow not found', async () => {
      vi.mocked(workflowRepository.findById).mockResolvedValue(null);

      await expect(
        service.start({
          workflowId: 'non-existent',
          userId: 'user-1',
        })
      ).rejects.toThrow('Workflow not found');
    });

    it('should throw error when workflow is not active', async () => {
      const draftWorkflow = createMockWorkflow();
      (draftWorkflow as unknown as { status: string }).status = 'draft';
      vi.mocked(workflowRepository.findById).mockResolvedValue(draftWorkflow);

      await expect(
        service.start({
          workflowId: 'workflow-1',
          userId: 'user-1',
        })
      ).rejects.toThrow('Cannot execute workflow in draft status');
    });

    it('should set execution parameters', async () => {
      const input: StartExecutionInput = {
        workflowId: 'workflow-1',
        userId: 'user-1',
        parameters: { dataPath: '/path/to/data', threshold: 0.5 },
      };

      const execution = await service.start(input);

      expect(execution.parameters).toEqual({
        dataPath: '/path/to/data',
        threshold: 0.5,
      });
    });

    it('should set execution environment', async () => {
      const input: StartExecutionInput = {
        workflowId: 'workflow-1',
        userId: 'user-1',
        environment: { PYTHONPATH: '/usr/lib/python' },
      };

      const execution = await service.start(input);

      expect(execution.environment).toEqual({
        PYTHONPATH: '/usr/lib/python',
      });
    });
  });

  describe('getById', () => {
    it('should return execution by ID', async () => {
      const mockExecution = createMockExecution();
      vi.mocked(executionRepository.findById).mockResolvedValue(mockExecution);

      const execution = await service.getById('exec-1');

      expect(execution).toBe(mockExecution);
      expect(executionRepository.findById).toHaveBeenCalledWith('exec-1');
    });

    it('should return null when execution not found', async () => {
      vi.mocked(executionRepository.findById).mockResolvedValue(null);

      const execution = await service.getById('non-existent');

      expect(execution).toBeNull();
    });
  });

  describe('getByWorkflowId', () => {
    it('should return all executions for a workflow', async () => {
      const executions = [createMockExecution(), createMockExecution()];
      vi.mocked(executionRepository.findByWorkflowId).mockResolvedValue(executions);

      const result = await service.getByWorkflowId('workflow-1');

      expect(result).toHaveLength(2);
      expect(executionRepository.findByWorkflowId).toHaveBeenCalledWith('workflow-1');
    });
  });

  describe('getByUserId', () => {
    it('should return all executions for a user', async () => {
      const executions = [createMockExecution()];
      vi.mocked(executionRepository.findByUserId).mockResolvedValue(executions);

      const result = await service.getByUserId('user-1');

      expect(result).toHaveLength(1);
      expect(executionRepository.findByUserId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('pause', () => {
    it('should pause a running execution', async () => {
      const mockExecution = createMockExecution('running', 50);
      vi.mocked(executionRepository.findById).mockResolvedValue(mockExecution);

      await service.pause('exec-1');

      expect(mockExecution.pause).toHaveBeenCalled();
      expect(executionRepository.save).toHaveBeenCalledWith(mockExecution);
    });

    it('should throw error when execution not found', async () => {
      vi.mocked(executionRepository.findById).mockResolvedValue(null);

      await expect(service.pause('non-existent')).rejects.toThrow(
        'Execution not found'
      );
    });
  });

  describe('resume', () => {
    it('should resume a paused execution (WKFL-COMM-005)', async () => {
      const mockExecution = createMockExecution('paused', 50);
      vi.mocked(executionRepository.findById).mockResolvedValue(mockExecution);

      await service.resume('exec-1');

      expect(mockExecution.resume).toHaveBeenCalled();
      expect(executionRepository.save).toHaveBeenCalledWith(mockExecution);
    });

    it('should throw error when execution not found', async () => {
      vi.mocked(executionRepository.findById).mockResolvedValue(null);

      await expect(service.resume('non-existent')).rejects.toThrow(
        'Execution not found'
      );
    });
  });

  describe('cancel', () => {
    it('should cancel a running execution', async () => {
      const mockExecution = createMockExecution('running', 50);
      vi.mocked(executionRepository.findById).mockResolvedValue(mockExecution);

      await service.cancel('exec-1');

      expect(mockExecution.cancel).toHaveBeenCalled();
      expect(executionRepository.save).toHaveBeenCalledWith(mockExecution);
    });

    it('should throw error when execution not found', async () => {
      vi.mocked(executionRepository.findById).mockResolvedValue(null);

      await expect(service.cancel('non-existent')).rejects.toThrow(
        'Execution not found'
      );
    });
  });

  describe('resumeFromFailure (WKFL-COMM-005)', () => {
    it('should resume from failed step', async () => {
      const mockExecution = createMockExecution('failed', 33);
      vi.mocked(executionRepository.findById).mockResolvedValue(mockExecution);

      await service.resumeFromFailure('exec-1');

      expect(mockExecution.resumeFromFailure).toHaveBeenCalled();
      expect(executionRepository.save).toHaveBeenCalledWith(mockExecution);
    });

    it('should throw error when execution not found', async () => {
      vi.mocked(executionRepository.findById).mockResolvedValue(null);

      await expect(service.resumeFromFailure('non-existent')).rejects.toThrow(
        'Execution not found'
      );
    });
  });

  describe('retryStep', () => {
    it('should retry a specific step', async () => {
      const mockExecution = createMockExecution('failed', 33);
      vi.mocked(executionRepository.findById).mockResolvedValue(mockExecution);

      await service.retryStep('exec-1', 'step-1');

      expect(mockExecution.retryStep).toHaveBeenCalledWith('step-1');
      expect(executionRepository.save).toHaveBeenCalledWith(mockExecution);
    });
  });

  describe('recordStepResult (WKFL-COMM-006)', () => {
    it('should record step execution result', async () => {
      const mockExecution = createMockExecution('running', 33);
      vi.mocked(executionRepository.findById).mockResolvedValue(mockExecution);

      const result: ExecutionResult = {
        stepId: 'step-1',
        status: 'completed',
        output: { result: 'success' },
        duration: 1000,
      };

      await service.recordStepResult('exec-1', result);

      expect(mockExecution.recordStepResult).toHaveBeenCalledWith(result);
      expect(executionRepository.save).toHaveBeenCalledWith(mockExecution);
    });

    it('should throw error when execution not found', async () => {
      vi.mocked(executionRepository.findById).mockResolvedValue(null);

      await expect(
        service.recordStepResult('non-existent', {
          stepId: 'step-1',
          status: 'completed',
        })
      ).rejects.toThrow('Execution not found');
    });
  });

  describe('getProgress (DASH-PROG-001, DASH-PROG-003)', () => {
    it('should return execution progress', async () => {
      const mockExecution = createMockExecution('running', 66);
      (mockExecution as unknown as { progress: number }).progress = 66;
      vi.mocked(executionRepository.findById).mockResolvedValue(mockExecution);

      const progress = await service.getProgress('exec-1');

      expect(progress.progress).toBe(66);
      expect(progress.status).toBeDefined();
    });

    it('should throw error when execution not found', async () => {
      vi.mocked(executionRepository.findById).mockResolvedValue(null);

      await expect(service.getProgress('non-existent')).rejects.toThrow(
        'Execution not found'
      );
    });
  });

  describe('getSummary', () => {
    it('should return execution summary', async () => {
      const mockExecution = createMockExecution('completed', 100);
      vi.mocked(executionRepository.findById).mockResolvedValue(mockExecution);

      const summary = await service.getSummary('exec-1');

      expect(summary).toBeDefined();
      expect(summary.totalSteps).toBe(3);
    });

    it('should throw error when execution not found', async () => {
      vi.mocked(executionRepository.findById).mockResolvedValue(null);

      await expect(service.getSummary('non-existent')).rejects.toThrow(
        'Execution not found'
      );
    });
  });

  describe('complete', () => {
    it('should mark execution as completed', async () => {
      const mockExecution = createMockExecution('running', 100);
      vi.mocked(executionRepository.findById).mockResolvedValue(mockExecution);

      await service.complete('exec-1');

      expect(mockExecution.complete).toHaveBeenCalled();
      expect(executionRepository.save).toHaveBeenCalledWith(mockExecution);
    });
  });

  describe('fail', () => {
    it('should mark execution as failed with error', async () => {
      const mockExecution = createMockExecution('running', 50);
      vi.mocked(executionRepository.findById).mockResolvedValue(mockExecution);

      await service.fail('exec-1', 'Step 2 failed: Division by zero');

      expect(mockExecution.fail).toHaveBeenCalledWith('Step 2 failed: Division by zero');
      expect(executionRepository.save).toHaveBeenCalledWith(mockExecution);
    });
  });

  describe('getStepResult', () => {
    it('should return step result from execution', async () => {
      const mockExecution = createMockExecution('running', 33);
      const stepResult: ExecutionResult = {
        stepId: 'step-1',
        status: 'completed',
        output: { data: 'test' },
      };
      vi.mocked(mockExecution.getStepResult).mockReturnValue(stepResult);
      vi.mocked(executionRepository.findById).mockResolvedValue(mockExecution);

      const result = await service.getStepResult('exec-1', 'step-1');

      expect(result).toBe(stepResult);
      expect(mockExecution.getStepResult).toHaveBeenCalledWith('step-1');
    });
  });

  describe('canAccess', () => {
    it('should return true for execution owner', async () => {
      const mockExecution = createMockExecution();
      vi.mocked(executionRepository.findById).mockResolvedValue(mockExecution);

      const canAccess = await service.canAccess('exec-1', 'user-1');

      expect(canAccess).toBe(true);
    });

    it('should return false for non-owner', async () => {
      const mockExecution = createMockExecution();
      vi.mocked(executionRepository.findById).mockResolvedValue(mockExecution);

      const canAccess = await service.canAccess('exec-1', 'other-user');

      expect(canAccess).toBe(false);
    });

    it('should return false when execution not found', async () => {
      vi.mocked(executionRepository.findById).mockResolvedValue(null);

      const canAccess = await service.canAccess('non-existent', 'user-1');

      expect(canAccess).toBe(false);
    });
  });
});
