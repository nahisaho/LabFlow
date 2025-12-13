/**
 * Model Execution Interface Tests
 *
 * MODL-EXEC-001: No-code execution interface
 * MODL-EXEC-002: Required parameter form
 * MODL-EXEC-003: Default values for optional parameters
 * MODL-EXEC-004: Parameter descriptions in Japanese
 * MODL-EXEC-005: Real-time validation
 * MODL-EXEC-006: Background execution with progress
 * MODL-EXEC-007: Result display
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ModelExecutor,
  ExecutionConfig,
  ExecutionStatus,
  ExecutionResult,
  ParameterSpec,
  ValidationError,
  createModelExecutor,
} from '../../src/model-catalog/model-executor';

describe('Model Execution Interface (MODL-EXEC)', () => {
  let executor: ModelExecutor;

  beforeEach(() => {
    executor = createModelExecutor();
  });

  describe('No-code Interface (MODL-EXEC-001)', () => {
    it('should provide execution interface for models', () => {
      const config = executor.getExecutionConfig('mattergen');

      expect(config).toBeDefined();
      expect(config.parameters).toBeDefined();
    });

    it('should list available parameters', () => {
      const config = executor.getExecutionConfig('mattergen');

      expect(config.parameters.length).toBeGreaterThan(0);
    });
  });

  describe('Required Parameters (MODL-EXEC-002)', () => {
    it('should mark required parameters', () => {
      const config = executor.getExecutionConfig('mattergen');
      const required = config.parameters.filter((p) => p.required);

      expect(required.length).toBeGreaterThan(0);
      required.forEach((param) => {
        expect(param.required).toBe(true);
      });
    });

    it('should define parameter type', () => {
      const config = executor.getExecutionConfig('mattergen');

      config.parameters.forEach((param) => {
        expect(['string', 'number', 'boolean', 'array', 'object']).toContain(param.type);
      });
    });
  });

  describe('Default Values (MODL-EXEC-003)', () => {
    it('should set default values for optional parameters', () => {
      const config = executor.getExecutionConfig('mattergen');
      const optional = config.parameters.filter((p) => !p.required);

      optional.forEach((param) => {
        expect(param.defaultValue).toBeDefined();
      });
    });

    it('should categorize parameters as basic or advanced', () => {
      const config = executor.getExecutionConfig('mattergen');

      const basic = config.parameters.filter((p) => p.category === 'basic');
      const advanced = config.parameters.filter((p) => p.category === 'advanced');

      expect(basic.length).toBeGreaterThan(0);
      expect(advanced.length).toBeGreaterThan(0);
    });
  });

  describe('Parameter Descriptions (MODL-EXEC-004)', () => {
    it('should provide Japanese descriptions', () => {
      const config = executor.getExecutionConfig('mattergen');

      config.parameters.forEach((param) => {
        expect(param.descriptionJa).toBeDefined();
        expect(param.descriptionJa).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/);
      });
    });

    it('should provide tooltip', () => {
      const config = executor.getExecutionConfig('mattergen');

      config.parameters.forEach((param) => {
        expect(param.tooltip).toBeDefined();
      });
    });
  });

  describe('Validation (MODL-EXEC-005)', () => {
    it('should validate required parameters', () => {
      const result = executor.validate('mattergen', {});

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.type === 'required')).toBe(true);
    });

    it('should validate parameter types', () => {
      const result = executor.validate('mattergen', {
        chemicalSystem: 'Li-Fe-O',
        numSamples: 'invalid', // should be number
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'type')).toBe(true);
    });

    it('should validate parameter ranges', () => {
      const result = executor.validate('mattergen', {
        chemicalSystem: 'Li-Fe-O',
        numSamples: 2000, // max is 1000
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'range')).toBe(true);
    });

    it('should pass validation for valid input', () => {
      const result = executor.validate('mattergen', {
        chemicalSystem: 'Li-Fe-O',
        numSamples: 100,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Execution (MODL-EXEC-006)', () => {
    it('should start background execution', async () => {
      const execution = await executor.execute('mattergen', {
        chemicalSystem: 'Li-Fe-O',
        numSamples: 10,
      });

      expect(execution.id).toBeDefined();
      expect(execution.status).toBe(ExecutionStatus.Running);
    });

    it('should provide progress updates', async () => {
      const progressUpdates: number[] = [];

      const execution = await executor.execute(
        'mattergen',
        { chemicalSystem: 'Li-Fe-O', numSamples: 10 },
        {
          onProgress: (progress) => {
            progressUpdates.push(progress);
          },
        }
      );

      // Wait for some progress
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(progressUpdates.length).toBeGreaterThan(0);
    });

    it('should track execution status', async () => {
      const execution = await executor.execute('mattergen', {
        chemicalSystem: 'Li-Fe-O',
        numSamples: 10,
      });

      const status = executor.getStatus(execution.id);

      expect([ExecutionStatus.Pending, ExecutionStatus.Running, ExecutionStatus.Completed]).toContain(status);
    });

    it('should allow cancellation', async () => {
      const execution = await executor.execute('mattergen', {
        chemicalSystem: 'Li-Fe-O',
        numSamples: 100,
      });

      executor.cancel(execution.id);

      const status = executor.getStatus(execution.id);
      expect(status).toBe(ExecutionStatus.Cancelled);
    });
  });

  describe('Results (MODL-EXEC-007)', () => {
    it('should return result summary', async () => {
      const execution = await executor.execute('mattergen', {
        chemicalSystem: 'Li-Fe-O',
        numSamples: 5,
      });

      // Wait for completion
      await execution.wait();

      const result = executor.getResult(execution.id);

      expect(result).toBeDefined();
      expect(result?.summary).toBeDefined();
    });

    it('should provide link to detailed results', async () => {
      const execution = await executor.execute('mattergen', {
        chemicalSystem: 'Li-Fe-O',
        numSamples: 5,
      });

      await execution.wait();

      const result = executor.getResult(execution.id);

      expect(result?.detailsUrl).toBeDefined();
      expect(result?.detailsUrl).toMatch(/^\/results\//);
    });

    it('should include execution metadata', async () => {
      const execution = await executor.execute('mattergen', {
        chemicalSystem: 'Li-Fe-O',
        numSamples: 5,
      });

      await execution.wait();

      const result = executor.getResult(execution.id);

      expect(result?.startedAt).toBeDefined();
      expect(result?.completedAt).toBeDefined();
      expect(result?.duration).toBeDefined();
    });
  });
});

describe('Parameter Specification', () => {
  it('should define complete parameter spec', () => {
    const param: ParameterSpec = {
      name: 'testParam',
      type: 'number',
      required: true,
      descriptionJa: 'テストパラメータ',
      tooltip: 'Test parameter tooltip',
      category: 'basic',
      min: 1,
      max: 100,
      defaultValue: 10,
    };

    expect(param.name).toBe('testParam');
    expect(param.type).toBe('number');
    expect(param.min).toBe(1);
    expect(param.max).toBe(100);
  });
});
