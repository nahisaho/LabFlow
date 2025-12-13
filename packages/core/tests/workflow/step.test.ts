/**
 * Step Domain Entity Tests
 *
 * TDD RED Phase - TASK-WKFL-001
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Step } from '../../src/workflow/domain/step.js';
import type { StepStatus } from '../../src/workflow/types.js';

describe('Step Domain Entity', () => {
  describe('creation', () => {
    it('should create a step with required properties', () => {
      const step = new Step({
        id: 'step-001',
        name: 'Load Data',
        type: 'data-input',
        domain: 'drug-discovery',
      });

      expect(step.id).toBe('step-001');
      expect(step.name).toBe('Load Data');
      expect(step.type).toBe('data-input');
      expect(step.domain).toBe('drug-discovery');
    });

    it('should set default values for optional properties', () => {
      const step = new Step({
        id: 'step-001',
        name: 'Test Step',
        type: 'processing',
        domain: 'materials',
      });

      expect(step.config).toEqual({});
      expect(step.position).toEqual({ x: 0, y: 0 });
      expect(step.dependencies).toEqual([]);
      expect(step.status).toBe('pending');
    });

    it('should accept optional properties', () => {
      const step = new Step({
        id: 'step-001',
        name: 'Process Data',
        type: 'processing',
        domain: 'materials',
        config: { threshold: 0.5 },
        position: { x: 100, y: 200 },
        dependencies: ['step-000'],
        status: 'running',
      });

      expect(step.config).toEqual({ threshold: 0.5 });
      expect(step.position).toEqual({ x: 100, y: 200 });
      expect(step.dependencies).toEqual(['step-000']);
      expect(step.status).toBe('running');
    });
  });

  describe('configuration', () => {
    let step: Step;

    beforeEach(() => {
      step = new Step({
        id: 'step-001',
        name: 'MatterGen Step',
        type: 'model-inference',
        domain: 'materials',
        config: {
          modelVersion: '1.0',
          targetProperty: 'bandgap',
        },
      });
    });

    it('should update configuration', () => {
      step.updateConfig({
        targetProperty: 'bulk_modulus',
        maxIterations: 100,
      });

      expect(step.config).toMatchObject({
        modelVersion: '1.0',
        targetProperty: 'bulk_modulus',
        maxIterations: 100,
      });
    });

    it('should return immutable config copy', () => {
      const config = step.config;
      (config as any).modelVersion = 'modified';

      expect(step.config.modelVersion).toBe('1.0');
    });

    it('should validate required config fields', () => {
      // Step with requiredConfigFields defined at construction
      const stepWithRequirements = new Step({
        id: 'step-001',
        name: 'Test Step',
        type: 'processing',
        domain: 'materials',
        config: { modelVersion: '1.0', targetProperty: 'conductivity' },
        requiredConfigFields: ['modelVersion', 'targetProperty'],
      });
      
      const result = stepWithRequirements.validateConfig();

      expect(result.valid).toBe(true);
    });

    it('should report missing required config fields', () => {
      const stepWithMissing = new Step({
        id: 'step-001',
        name: 'Test Step',
        type: 'processing',
        domain: 'materials',
        config: { modelVersion: '1.0' }, // missing targetProperty
        requiredConfigFields: ['modelVersion', 'targetProperty', 'missingField'],
      });
      
      const result = stepWithMissing.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('missingField');
      expect(result.missingFields).toContain('targetProperty');
    });
  });

  describe('position', () => {
    let step: Step;

    beforeEach(() => {
      step = new Step({
        id: 'step-001',
        name: 'Test Step',
        type: 'processing',
        domain: 'materials',
        position: { x: 100, y: 100 },
      });
    });

    it('should update position', () => {
      step.updatePosition({ x: 200, y: 300 });

      expect(step.position).toEqual({ x: 200, y: 300 });
    });

    it('should return immutable position copy', () => {
      const position = step.position;
      position.x = 999;

      expect(step.position.x).toBe(100);
    });
  });

  describe('dependencies', () => {
    let step: Step;

    beforeEach(() => {
      step = new Step({
        id: 'step-002',
        name: 'Process Step',
        type: 'processing',
        domain: 'materials',
        dependencies: ['step-001'],
      });
    });

    it('should add a dependency', () => {
      step.addDependency('step-000');

      expect(step.dependencies).toContain('step-000');
      expect(step.dependencies).toContain('step-001');
    });

    it('should not add duplicate dependency', () => {
      step.addDependency('step-001');

      expect(step.dependencies).toHaveLength(1);
    });

    it('should remove a dependency', () => {
      step.removeDependency('step-001');

      expect(step.dependencies).not.toContain('step-001');
    });

    it('should check if step depends on another', () => {
      expect(step.dependsOn('step-001')).toBe(true);
      expect(step.dependsOn('step-999')).toBe(false);
    });

    it('should return immutable dependencies array', () => {
      const deps = step.dependencies;
      deps.push('step-999');

      expect(step.dependencies).not.toContain('step-999');
    });
  });

  describe('status transitions', () => {
    let step: Step;

    beforeEach(() => {
      step = new Step({
        id: 'step-001',
        name: 'Test Step',
        type: 'processing',
        domain: 'materials',
      });
    });

    it('should transition from pending to running', () => {
      expect(step.status).toBe('pending');

      step.start();

      expect(step.status).toBe('running');
    });

    it('should transition from running to completed', () => {
      step.start();
      step.complete();

      expect(step.status).toBe('completed');
    });

    it('should transition from running to failed', () => {
      step.start();
      step.fail('Connection error');

      expect(step.status).toBe('failed');
      expect((step.output as any)?.error).toBe('Connection error');
    });

    it('should transition to skipped (WKFL-COMM-004)', () => {
      // Create an optional step that can be skipped
      const optionalStep = new Step({
        id: 'step-optional',
        name: 'Optional Step',
        type: 'processing',
        domain: 'materials',
        optional: true,
      });
      
      optionalStep.skip('Optional step not needed');

      expect(optionalStep.status).toBe('skipped');
      expect((optionalStep.output as any)?.skipReason).toBe('Optional step not needed');
    });

    it('should reset status to pending', () => {
      step.start();
      step.fail('Error');
      step.reset();

      expect(step.status).toBe('pending');
      expect(step.output).toBeUndefined();
    });

    it('should not allow invalid transitions', () => {
      // Cannot complete from pending
      expect(() => step.complete()).toThrow();
    });

    it('should track status history', () => {
      step.start();
      step.complete();

      const history = step.statusHistory;
      expect(history).toHaveLength(3); // pending -> running -> completed
      expect(history[0].status).toBe('pending');
      expect(history[1].status).toBe('running');
      expect(history[2].status).toBe('completed');
    });
  });

  describe('execution results', () => {
    let step: Step;

    beforeEach(() => {
      step = new Step({
        id: 'step-001',
        name: 'Model Inference',
        type: 'model-inference',
        domain: 'materials',
      });
    });

    it('should store execution output', () => {
      step.start();
      step.setOutput({
        materials: [
          { composition: 'Li2O', bandgap: 5.2 },
          { composition: 'MgO', bandgap: 7.8 },
        ],
        count: 2,
      });

      expect(step.output).toMatchObject({
        materials: expect.any(Array),
        count: 2,
      });
    });

    it('should track execution metrics', () => {
      step.start();
      step.complete();

      expect(step.metrics).toHaveProperty('startTime');
      expect(step.metrics).toHaveProperty('endTime');
      expect(step.metrics).toHaveProperty('duration');
    });

    it('should clear output on reset', () => {
      step.start();
      step.setOutput({ result: 'data' });
      step.complete();
      step.reset();

      expect(step.output).toBeUndefined();
    });
  });

  describe('skippable steps (WKFL-COMM-004)', () => {
    it('should identify skippable steps', () => {
      const requiredStep = new Step({
        id: 'step-001',
        name: 'Required Step',
        type: 'data-input',
        domain: 'materials',
        config: { required: true },
      });

      const optionalStep = new Step({
        id: 'step-002',
        name: 'Optional Step',
        type: 'visualization',
        domain: 'materials',
        optional: true, // Mark as optional
      });

      expect(requiredStep.isSkippable()).toBe(false);
      expect(optionalStep.isSkippable()).toBe(true);
    });

    it('should skip optional step', () => {
      const step = new Step({
        id: 'step-001',
        name: 'Optional Step',
        type: 'visualization',
        domain: 'materials',
        optional: true,
      });

      step.skip('User chose to skip');

      expect(step.status).toBe('skipped');
    });

    it('should not allow skipping required step', () => {
      const step = new Step({
        id: 'step-001',
        name: 'Required Step',
        type: 'data-input',
        domain: 'materials',
        optional: false, // Required step
      });

      expect(() => step.skip('Try to skip')).toThrow();
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const step = new Step({
        id: 'step-001',
        name: 'Test Step',
        type: 'processing',
        domain: 'materials',
        config: { threshold: 0.5 },
        position: { x: 100, y: 200 },
        dependencies: ['step-000'],
      });

      const json = step.toJSON();

      expect(json).toMatchObject({
        id: 'step-001',
        name: 'Test Step',
        type: 'processing',
        domain: 'materials',
        config: { threshold: 0.5 },
        position: { x: 100, y: 200 },
        dependencies: ['step-000'],
        status: 'pending',
      });
    });

    it('should deserialize from JSON', () => {
      const json = {
        id: 'step-001',
        name: 'Test Step',
        type: 'processing' as const,
        domain: 'materials' as const,
        config: { threshold: 0.5 },
        position: { x: 100, y: 200 },
        dependencies: ['step-000'],
        status: 'completed' as StepStatus,
      };

      const step = Step.fromJSON(json);

      expect(step.id).toBe('step-001');
      expect(step.config).toEqual({ threshold: 0.5 });
      expect(step.status).toBe('completed');
    });
  });

  describe('cloning', () => {
    it('should clone step with new ID', () => {
      const original = new Step({
        id: 'step-001',
        name: 'Original Step',
        type: 'processing',
        domain: 'materials',
        config: { model: 'v1' },
        position: { x: 100, y: 100 },
      });

      const clone = original.clone('step-002');

      expect(clone.id).toBe('step-002');
      expect(clone.name).toBe('Original Step');
      expect(clone.config).toEqual({ model: 'v1' });
      expect(clone.status).toBe('pending'); // Reset status
    });
  });
});
