/**
 * Workflow Domain Entity Tests
 *
 * TDD RED Phase - TASK-WKFL-001
 *
 * Tests for:
 * - WKFL-COMM-001: Workflow metadata
 * - WKFL-COMM-002: Version management
 * - WKFL-COMM-004: Step skip option
 * - WKFL-COMM-006: Intermediate result persistence
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Workflow } from '../../src/workflow/domain/workflow.js';
import { Step } from '../../src/workflow/domain/step.js';
import type { ResearchDomain, WorkflowStatus } from '../../src/workflow/types.js';

describe('Workflow Domain Entity', () => {
  describe('creation', () => {
    it('should create a workflow with required properties', () => {
      const workflow = new Workflow({
        id: 'wf-001',
        name: 'Drug Discovery Pipeline',
        domain: 'drug-discovery',
        userId: 'user-123',
      });

      expect(workflow.id).toBe('wf-001');
      expect(workflow.name).toBe('Drug Discovery Pipeline');
      expect(workflow.domain).toBe('drug-discovery');
      expect(workflow.userId).toBe('user-123');
    });

    it('should set default values for optional properties', () => {
      const workflow = new Workflow({
        id: 'wf-001',
        name: 'Test Workflow',
        domain: 'materials',
        userId: 'user-123',
      });

      expect(workflow.version).toBe(1);
      expect(workflow.status).toBe('draft');
      expect(workflow.steps).toHaveLength(0);
      expect(workflow.createdAt).toBeInstanceOf(Date);
      expect(workflow.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept optional properties', () => {
      const createdAt = new Date('2025-01-01');
      const workflow = new Workflow({
        id: 'wf-001',
        name: 'Test Workflow',
        description: 'A test workflow for materials science',
        domain: 'materials',
        templateId: 'tmpl-001',
        version: 2,
        status: 'active',
        userId: 'user-123',
        organizationId: 'org-456',
        createdAt,
      });

      expect(workflow.description).toBe('A test workflow for materials science');
      expect(workflow.templateId).toBe('tmpl-001');
      expect(workflow.version).toBe(2);
      expect(workflow.status).toBe('active');
      expect(workflow.organizationId).toBe('org-456');
      expect(workflow.createdAt).toEqual(createdAt);
    });
  });

  describe('metadata (WKFL-COMM-001)', () => {
    let workflow: Workflow;

    beforeEach(() => {
      workflow = new Workflow({
        id: 'wf-001',
        name: 'Drug Discovery Pipeline',
        description: 'Find new drug candidates',
        domain: 'drug-discovery',
        templateId: 'tmpl-drug-001',
        userId: 'user-123',
        organizationId: 'org-456',
      });
    });

    it('should return complete metadata object', () => {
      const metadata = workflow.getMetadata();

      expect(metadata).toMatchObject({
        id: 'wf-001',
        name: 'Drug Discovery Pipeline',
        description: 'Find new drug candidates',
        domain: 'drug-discovery',
        templateId: 'tmpl-drug-001',
        version: 1,
        status: 'draft',
      });
    });

    it('should include step count in metadata', () => {
      const metadata = workflow.getMetadata();
      expect(metadata).toHaveProperty('stepCount');
      expect(metadata.stepCount).toBe(0);
    });
  });

  describe('version management (WKFL-COMM-002)', () => {
    let workflow: Workflow;

    beforeEach(() => {
      workflow = new Workflow({
        id: 'wf-001',
        name: 'Test Workflow',
        domain: 'materials',
        userId: 'user-123',
      });
    });

    it('should increment version when modified', () => {
      expect(workflow.version).toBe(1);

      workflow.updateName('Updated Workflow');
      expect(workflow.version).toBe(2);
    });

    it('should track version history', () => {
      workflow.updateName('First Update');
      workflow.updateName('Second Update');

      expect(workflow.version).toBe(3);
    });

    it('should create snapshot at specific version', () => {
      workflow.updateName('Updated Name');
      const snapshot = workflow.createSnapshot();

      expect(snapshot).toHaveProperty('version', 2);
      expect(snapshot).toHaveProperty('data');
      expect(snapshot).toHaveProperty('createdAt');
      expect((snapshot.data as any).name).toBe('Updated Name');
    });
  });

  describe('step management', () => {
    let workflow: Workflow;

    beforeEach(() => {
      workflow = new Workflow({
        id: 'wf-001',
        name: 'Drug Discovery Pipeline',
        domain: 'drug-discovery',
        userId: 'user-123',
      });
    });

    it('should add a step to the workflow', () => {
      const step = new Step({
        id: 'step-001',
        name: 'Load Target Protein',
        type: 'data-input',
        domain: 'drug-discovery',
      });

      workflow.addStep(step);

      expect(workflow.steps).toHaveLength(1);
      expect(workflow.steps[0]).toBe(step);
    });

    it('should retrieve step by ID', () => {
      const step = new Step({
        id: 'step-001',
        name: 'Load Target Protein',
        type: 'data-input',
        domain: 'drug-discovery',
      });

      workflow.addStep(step);
      const retrieved = workflow.getStep('step-001');

      expect(retrieved).toBe(step);
    });

    it('should remove a step from the workflow', () => {
      const step = new Step({
        id: 'step-001',
        name: 'Load Target Protein',
        type: 'data-input',
        domain: 'drug-discovery',
      });

      workflow.addStep(step);
      workflow.removeStep('step-001');

      expect(workflow.steps).toHaveLength(0);
    });

    it('should reorder steps', () => {
      const step1 = new Step({
        id: 'step-001',
        name: 'Step 1',
        type: 'data-input',
        domain: 'drug-discovery',
      });
      const step2 = new Step({
        id: 'step-002',
        name: 'Step 2',
        type: 'processing',
        domain: 'drug-discovery',
      });

      workflow.addStep(step1);
      workflow.addStep(step2);
      workflow.reorderSteps(['step-002', 'step-001']);

      expect(workflow.steps[0].id).toBe('step-002');
      expect(workflow.steps[1].id).toBe('step-001');
    });

    it('should not add duplicate step IDs', () => {
      const step1 = new Step({
        id: 'step-001',
        name: 'Step 1',
        type: 'data-input',
        domain: 'drug-discovery',
      });
      const step2 = new Step({
        id: 'step-001', // Same ID
        name: 'Step 2',
        type: 'processing',
        domain: 'drug-discovery',
      });

      workflow.addStep(step1);

      expect(() => workflow.addStep(step2)).toThrow();
    });
  });

  describe('status transitions', () => {
    let workflow: Workflow;

    beforeEach(() => {
      workflow = new Workflow({
        id: 'wf-001',
        name: 'Test Workflow',
        domain: 'materials',
        userId: 'user-123',
      });
    });

    it('should transition from draft to active', () => {
      expect(workflow.status).toBe('draft');

      workflow.activate();

      expect(workflow.status).toBe('active');
    });

    it('should transition from active to archived', () => {
      workflow.activate();
      workflow.archive();

      expect(workflow.status).toBe('archived');
    });

    it('should not allow invalid transitions', () => {
      // Cannot complete from draft (must activate first)
      expect(() => workflow.complete()).toThrow();
    });

    it('should allow draft -> active -> completed flow', () => {
      workflow.activate();
      workflow.complete();

      expect(workflow.status).toBe('completed');
    });
  });

  describe('validation', () => {
    let workflow: Workflow;

    beforeEach(() => {
      workflow = new Workflow({
        id: 'wf-001',
        name: 'Test Workflow',
        domain: 'drug-discovery',
        userId: 'user-123',
      });
    });

    it('should validate workflow has at least one step', () => {
      const result = workflow.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Workflow must have at least one step');
    });

    it('should validate step dependencies exist', () => {
      const step = new Step({
        id: 'step-001',
        name: 'Step 1',
        type: 'processing',
        domain: 'drug-discovery',
        dependencies: ['step-999'], // Non-existent step
      });

      // addStep throws when dependency doesn't exist
      expect(() => workflow.addStep(step)).toThrow('Dependency step step-999 not found');
    });

    it('should detect circular dependencies', () => {
      // First add step1 without dependencies
      const step1 = new Step({
        id: 'step-001',
        name: 'Step 1',
        type: 'processing',
        domain: 'drug-discovery',
        dependencies: [], // Will add dependency later
      });
      workflow.addStep(step1);

      // Add step2 that depends on step1
      const step2 = new Step({
        id: 'step-002',
        name: 'Step 2',
        type: 'processing',
        domain: 'drug-discovery',
        dependencies: ['step-001'],
      });
      workflow.addStep(step2);

      // Now modify step1 to depend on step2 (creating a cycle)
      step1.addDependency('step-002');

      const result = workflow.validate();

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('circular'))).toBe(true);
    });

    it('should pass validation for valid workflow', () => {
      const step1 = new Step({
        id: 'step-001',
        name: 'Input',
        type: 'data-input',
        domain: 'drug-discovery',
      });
      const step2 = new Step({
        id: 'step-002',
        name: 'Process',
        type: 'processing',
        domain: 'drug-discovery',
        dependencies: ['step-001'],
      });

      workflow.addStep(step1);
      workflow.addStep(step2);
      const result = workflow.validate();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('cloning and templates', () => {
    it('should clone workflow with new ID', () => {
      const original = new Workflow({
        id: 'wf-001',
        name: 'Original Workflow',
        domain: 'materials',
        userId: 'user-123',
      });

      const step = new Step({
        id: 'step-001',
        name: 'Step 1',
        type: 'data-input',
        domain: 'materials',
      });
      original.addStep(step);

      const clone = original.clone('wf-002');

      expect(clone.id).toBe('wf-002');
      expect(clone.name).toBe('Original Workflow');
      expect(clone.steps).toHaveLength(1);
      expect(clone.status).toBe('draft'); // Reset to draft
      expect(clone.version).toBe(1); // Reset version
    });

    it('should create template from workflow', () => {
      const workflow = new Workflow({
        id: 'wf-001',
        name: 'Drug Discovery Template',
        description: 'Standard drug discovery workflow',
        domain: 'drug-discovery',
        userId: 'user-123',
      });

      const template = workflow.toTemplate() as any;

      expect(template.name).toBe('Drug Discovery Template');
      expect(template.description).toBe('Standard drug discovery workflow');
      expect(template.domain).toBe('drug-discovery');
      expect(template.steps).toEqual([]);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const workflow = new Workflow({
        id: 'wf-001',
        name: 'Test Workflow',
        domain: 'materials',
        userId: 'user-123',
      });

      const json = workflow.toJSON();

      expect(json).toMatchObject({
        id: 'wf-001',
        name: 'Test Workflow',
        domain: 'materials',
        userId: 'user-123',
        version: 1,
        status: 'draft',
        steps: [],
      });
    });

    it('should deserialize from JSON', () => {
      const json = {
        id: 'wf-001',
        name: 'Test Workflow',
        domain: 'materials' as ResearchDomain,
        userId: 'user-123',
        version: 3,
        status: 'active' as WorkflowStatus,
        steps: [],
      };

      const workflow = Workflow.fromJSON(json);

      expect(workflow.id).toBe('wf-001');
      expect(workflow.version).toBe(3);
      expect(workflow.status).toBe('active');
    });
  });
});
