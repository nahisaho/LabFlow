/**
 * Execution Domain Entity Tests
 *
 * TDD RED Phase - TASK-WKFL-001
 *
 * Tests for:
 * - WKFL-COMM-005: Resume from failure
 * - WKFL-COMM-006: Intermediate result persistence
 * - DASH-PROG-003: Progress percentage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Execution } from '../../src/workflow/domain/execution.js';
import type { ExecutionStatus, ExecutionResult } from '../../src/workflow/types.js';

describe('Execution Domain Entity', () => {
  describe('creation', () => {
    it('should create an execution with required properties', () => {
      const execution = new Execution({
        id: 'exec-001',
        workflowId: 'wf-001',
        userId: 'user-123',
      });

      expect(execution.id).toBe('exec-001');
      expect(execution.workflowId).toBe('wf-001');
      expect(execution.userId).toBe('user-123');
    });

    it('should set default values', () => {
      const execution = new Execution({
        id: 'exec-001',
        workflowId: 'wf-001',
        userId: 'user-123',
      });

      expect(execution.status).toBe('queued');
      expect(execution.progress).toBe(0);
      expect(execution.results).toHaveLength(0);
      expect(execution.startedAt).toBeInstanceOf(Date);
    });
  });

  describe('status transitions', () => {
    let execution: Execution;

    beforeEach(() => {
      execution = new Execution({
        id: 'exec-001',
        workflowId: 'wf-001',
        userId: 'user-123',
      });
    });

    it('should start execution from queued state', () => {
      execution.start();

      expect(execution.status).toBe('running');
    });

    it('should not start execution from non-queued state', () => {
      execution.start();

      expect(() => execution.start()).toThrow();
    });

    it('should pause running execution', () => {
      execution.start();
      execution.pause();

      expect(execution.status).toBe('paused');
    });

    it('should resume paused execution (WKFL-COMM-005)', () => {
      execution.start();
      execution.pause();
      execution.resume();

      expect(execution.status).toBe('running');
    });

    it('should complete execution', () => {
      execution.start();
      execution.complete();

      expect(execution.status).toBe('completed');
      expect(execution.completedAt).toBeInstanceOf(Date);
    });

    it('should fail execution with error', () => {
      execution.start();
      execution.fail('API timeout');

      expect(execution.status).toBe('failed');
      expect(execution.error).toBe('API timeout');
    });

    it('should cancel execution', () => {
      execution.start();
      execution.cancel();

      expect(execution.status).toBe('cancelled');
    });
  });

  describe('step results (WKFL-COMM-006)', () => {
    let execution: Execution;

    beforeEach(() => {
      execution = new Execution({
        id: 'exec-001',
        workflowId: 'wf-001',
        userId: 'user-123',
      });
      execution.start();
    });

    it('should record step result', () => {
      const result: ExecutionResult = {
        stepId: 'step-001',
        status: 'completed',
        output: { data: [1, 2, 3] },
        startedAt: new Date(),
        completedAt: new Date(),
      };

      execution.recordStepResult(result);

      expect(execution.results).toHaveLength(1);
      expect(execution.results[0]).toMatchObject({
        stepId: 'step-001',
        status: 'completed',
      });
    });

    it('should retrieve result by step ID', () => {
      const result: ExecutionResult = {
        stepId: 'step-001',
        status: 'completed',
        output: { value: 42 },
        startedAt: new Date(),
        completedAt: new Date(),
      };

      execution.recordStepResult(result);
      const retrieved = execution.getStepResult('step-001');

      expect(retrieved?.output).toEqual({ value: 42 });
    });

    it('should persist intermediate results', () => {
      // First step completes
      execution.recordStepResult({
        stepId: 'step-001',
        status: 'completed',
        output: { intermediate: 'data' },
        startedAt: new Date(),
        completedAt: new Date(),
      });

      // Second step starts
      execution.recordStepResult({
        stepId: 'step-002',
        status: 'running',
        startedAt: new Date(),
      });

      // Simulate pause/resume - intermediate results should be preserved
      execution.pause();
      execution.resume();

      expect(execution.getStepResult('step-001')?.output).toEqual({ intermediate: 'data' });
    });

    it('should update existing step result', () => {
      execution.recordStepResult({
        stepId: 'step-001',
        status: 'running',
        startedAt: new Date(),
      });

      execution.recordStepResult({
        stepId: 'step-001',
        status: 'completed',
        output: { final: 'result' },
        startedAt: new Date(),
        completedAt: new Date(),
      });

      expect(execution.getStepResult('step-001')?.status).toBe('completed');
      expect(execution.results).toHaveLength(1);
    });
  });

  describe('progress tracking (DASH-PROG-003)', () => {
    let execution: Execution;

    beforeEach(() => {
      execution = new Execution({
        id: 'exec-001',
        workflowId: 'wf-001',
        userId: 'user-123',
      });
      execution.start();
    });

    it('should update progress based on completed steps', () => {
      // Set total steps
      execution.setTotalSteps(4);

      // Complete first step
      execution.recordStepResult({
        stepId: 'step-001',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      expect(execution.progress).toBe(25); // 1/4 = 25%
    });

    it('should include skipped steps in progress', () => {
      execution.setTotalSteps(4);

      execution.recordStepResult({
        stepId: 'step-001',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      execution.recordStepResult({
        stepId: 'step-002',
        status: 'skipped',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      expect(execution.progress).toBe(50); // 2/4 = 50%
    });

    it('should reach 100% when all steps complete', () => {
      execution.setTotalSteps(2);

      execution.recordStepResult({
        stepId: 'step-001',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      execution.recordStepResult({
        stepId: 'step-002',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      expect(execution.progress).toBe(100);
    });

    it('should estimate remaining time', () => {
      execution.setTotalSteps(4);

      // Simulate elapsed time for first step (1 minute duration)
      const startTime = new Date(Date.now() - 60000);
      execution.recordStepResult({
        stepId: 'step-001',
        status: 'completed',
        duration: 60000, // 1 minute in ms
        startedAt: startTime,
        completedAt: new Date(),
      });

      const estimate = execution.estimatedRemainingTime;

      // Should estimate ~3 more minutes for remaining 3 steps (60000ms * 3 = 180000ms)
      expect(estimate).toBeGreaterThan(150000); // > 2.5 minutes
      expect(estimate).toBeLessThan(210000); // < 3.5 minutes
    });
  });

  describe('resume from failure (WKFL-COMM-005)', () => {
    let execution: Execution;

    beforeEach(() => {
      execution = new Execution({
        id: 'exec-001',
        workflowId: 'wf-001',
        userId: 'user-123',
      });
      execution.start();
      execution.setTotalSteps(3);
    });

    it('should identify failed step', () => {
      execution.recordStepResult({
        stepId: 'step-001',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      execution.recordStepResult({
        stepId: 'step-002',
        status: 'failed',
        error: 'Connection timeout',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      execution.fail('Step step-002 failed');

      expect(execution.failedStepId).toBe('step-002');
    });

    it('should resume from failed step', () => {
      execution.recordStepResult({
        stepId: 'step-001',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      execution.recordStepResult({
        stepId: 'step-002',
        status: 'failed',
        error: 'API error',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      execution.fail('Step failed');

      // Resume from failure
      execution.resumeFromFailure();

      expect(execution.status).toBe('running');
      // Failed step result should be cleared so it can be retried
      expect(execution.getStepResult('step-002')).toBeUndefined();
      expect(execution.getStepResult('step-001')?.status).toBe('completed');
    });

    it('should keep completed step results when resuming', () => {
      execution.recordStepResult({
        stepId: 'step-001',
        status: 'completed',
        output: { preserved: 'data' },
        startedAt: new Date(),
        completedAt: new Date(),
      });

      execution.recordStepResult({
        stepId: 'step-002',
        status: 'failed',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      execution.fail('Step failed');
      execution.resumeFromFailure();

      expect(execution.getStepResult('step-001')?.output).toEqual({ preserved: 'data' });
    });

    it('should allow retry specific step', () => {
      execution.recordStepResult({
        stepId: 'step-001',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      execution.recordStepResult({
        stepId: 'step-002',
        status: 'failed',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      execution.retryStep('step-002');

      // Step result should be cleared so it can be retried
      expect(execution.getStepResult('step-002')).toBeUndefined();
    });
  });

  describe('execution context', () => {
    it('should store execution parameters', () => {
      const execution = new Execution({
        id: 'exec-001',
        workflowId: 'wf-001',
        userId: 'user-123',
      });

      execution.setParameters({
        targetProtein: 'PDB:1ABC',
        temperature: 300,
      });

      expect(execution.parameters).toMatchObject({
        targetProtein: 'PDB:1ABC',
        temperature: 300,
      });
    });

    it('should track execution environment', () => {
      const execution = new Execution({
        id: 'exec-001',
        workflowId: 'wf-001',
        userId: 'user-123',
      });

      execution.setEnvironment({
        runtime: 'docker',
        image: 'labflow/runner:1.0',
        resources: {
          cpu: 4,
          memory: '16Gi',
          gpu: 1,
        },
      });

      expect(execution.environment).toMatchObject({
        runtime: 'docker',
        resources: { gpu: 1 },
      });
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const execution = new Execution({
        id: 'exec-001',
        workflowId: 'wf-001',
        userId: 'user-123',
      });
      execution.start();

      const json = execution.toJSON();

      expect(json).toMatchObject({
        id: 'exec-001',
        workflowId: 'wf-001',
        userId: 'user-123',
        status: 'running',
        progress: 0,
      });
    });

    it('should deserialize from JSON', () => {
      const json = {
        id: 'exec-001',
        workflowId: 'wf-001',
        userId: 'user-123',
        status: 'paused' as ExecutionStatus,
        progress: 50,
        results: [
          {
            stepId: 'step-001',
            status: 'completed' as const,
            output: { data: 'test' },
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          },
        ],
      };

      const execution = Execution.fromJSON(json);

      expect(execution.id).toBe('exec-001');
      expect(execution.status).toBe('paused');
      expect(execution.progress).toBe(50);
      expect(execution.results).toHaveLength(1);
    });
  });

  describe('metrics and logging', () => {
    it('should track execution duration', () => {
      const execution = new Execution({
        id: 'exec-001',
        workflowId: 'wf-001',
        userId: 'user-123',
      });

      execution.start();
      execution.complete();

      expect(execution.duration).toBeGreaterThanOrEqual(0);
    });

    it('should provide execution summary', () => {
      const execution = new Execution({
        id: 'exec-001',
        workflowId: 'wf-001',
        userId: 'user-123',
      });
      execution.setTotalSteps(3);
      execution.start();

      execution.recordStepResult({
        stepId: 'step-001',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      execution.recordStepResult({
        stepId: 'step-002',
        status: 'skipped',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      execution.recordStepResult({
        stepId: 'step-003',
        status: 'failed',
        error: 'Test error',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      const summary = execution.getSummary();

      expect(summary).toMatchObject({
        status: 'running',
        totalSteps: 3,
        completedSteps: 1,
        skippedSteps: 1,
        failedSteps: 1,
      });
    });
  });
});
