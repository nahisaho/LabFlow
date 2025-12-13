/**
 * WorkflowService Tests
 *
 * Requirements:
 * - WKFL-COMM-001: Workflow metadata management
 * - WKFL-COMM-002: Version management
 * - DASH-PROJ-001: CRUD operations
 * - DASH-PROJ-005: UUID generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowService } from '../../src/workflow/services/workflow-service.js';
import { Workflow } from '../../src/workflow/domain/workflow.js';
import { Step } from '../../src/workflow/domain/step.js';
import type { ResearchDomain } from '../../src/workflow/types.js';

// Mock repository interface
interface WorkflowRepository {
  findById(id: string): Promise<Workflow | null>;
  findByUserId(userId: string): Promise<Workflow[]>;
  findByDomain(domain: ResearchDomain): Promise<Workflow[]>;
  save(workflow: Workflow): Promise<void>;
  delete(id: string): Promise<void>;
}

describe('WorkflowService', () => {
  let service: WorkflowService;
  let mockRepository: WorkflowRepository;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByDomain: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    service = new WorkflowService(mockRepository);
  });

  describe('workflow creation (DASH-PROJ-001)', () => {
    it('should create a new workflow with generated UUID', async () => {
      const input = {
        name: 'Drug Discovery Pipeline',
        description: 'Find new drug candidates',
        domain: 'drug' as ResearchDomain,
        userId: 'user-123',
      };

      const workflow = await service.create(input);

      expect(workflow.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      expect(workflow.name).toBe(input.name);
      expect(workflow.description).toBe(input.description);
      expect(workflow.domain).toBe(input.domain);
      expect(workflow.userId).toBe(input.userId);
      expect(workflow.status).toBe('draft');
      expect(workflow.version).toBe(1);
      expect(mockRepository.save).toHaveBeenCalledWith(workflow);
    });

    it('should create workflow from template', async () => {
      const template = new Workflow({
        id: 'tmpl-001',
        name: 'Material Discovery Template',
        description: 'Standard material discovery workflow',
        domain: 'materials',
        userId: 'system',
        status: 'published',
      });

      // Add template steps
      template.addStep(
        new Step({
          id: 'step-001',
          name: 'Data Input',
          type: 'data-input',
          domain: 'materials',
        })
      );

      vi.mocked(mockRepository.findById).mockResolvedValue(template);

      const workflow = await service.createFromTemplate('tmpl-001', {
        userId: 'user-456',
        name: 'My Material Project',
      });

      expect(workflow.id).not.toBe('tmpl-001');
      expect(workflow.name).toBe('My Material Project');
      expect(workflow.templateId).toBe('tmpl-001');
      expect(workflow.userId).toBe('user-456');
      expect(workflow.status).toBe('draft');
      expect(workflow.steps.length).toBe(1);
    });

    it('should throw error when template not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(
        service.createFromTemplate('non-existent', { userId: 'user-123' })
      ).rejects.toThrow('Template not found');
    });
  });

  describe('workflow retrieval', () => {
    it('should get workflow by id', async () => {
      const workflow = new Workflow({
        id: 'wf-001',
        name: 'Test Workflow',
        domain: 'drug',
        userId: 'user-123',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(workflow);

      const result = await service.getById('wf-001');

      expect(result).toBe(workflow);
      expect(mockRepository.findById).toHaveBeenCalledWith('wf-001');
    });

    it('should return null for non-existent workflow', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      const result = await service.getById('non-existent');

      expect(result).toBeNull();
    });

    it('should list workflows by user', async () => {
      const workflows = [
        new Workflow({
          id: 'wf-001',
          name: 'Workflow 1',
          domain: 'drug',
          userId: 'user-123',
        }),
        new Workflow({
          id: 'wf-002',
          name: 'Workflow 2',
          domain: 'materials',
          userId: 'user-123',
        }),
      ];

      vi.mocked(mockRepository.findByUserId).mockResolvedValue(workflows);

      const result = await service.listByUser('user-123');

      expect(result).toHaveLength(2);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should list workflows by domain', async () => {
      const workflows = [
        new Workflow({
          id: 'wf-001',
          name: 'Drug Workflow',
          domain: 'drug',
          userId: 'user-123',
        }),
      ];

      vi.mocked(mockRepository.findByDomain).mockResolvedValue(workflows);

      const result = await service.listByDomain('drug');

      expect(result).toHaveLength(1);
      expect(result[0].domain).toBe('drug');
    });
  });

  describe('workflow update (WKFL-COMM-001)', () => {
    let existingWorkflow: Workflow;

    beforeEach(() => {
      existingWorkflow = new Workflow({
        id: 'wf-001',
        name: 'Original Name',
        description: 'Original description',
        domain: 'drug',
        userId: 'user-123',
      });
      vi.mocked(mockRepository.findById).mockResolvedValue(existingWorkflow);
    });

    it('should update workflow name', async () => {
      const updated = await service.update('wf-001', {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update workflow description', async () => {
      const updated = await service.update('wf-001', {
        description: 'New description',
      });

      expect(updated.description).toBe('New description');
    });

    it('should throw error when updating non-existent workflow', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(service.update('non-existent', { name: 'New' })).rejects.toThrow(
        'Workflow not found'
      );
    });

    it('should throw error when updating archived workflow', async () => {
      existingWorkflow.archive();

      await expect(service.update('wf-001', { name: 'New' })).rejects.toThrow(
        'Cannot modify archived workflow'
      );
    });
  });

  describe('workflow deletion (DASH-PROJ-001)', () => {
    it('should delete workflow', async () => {
      const workflow = new Workflow({
        id: 'wf-001',
        name: 'To Delete',
        domain: 'drug',
        userId: 'user-123',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(workflow);

      await service.delete('wf-001');

      expect(mockRepository.delete).toHaveBeenCalledWith('wf-001');
    });

    it('should throw error when deleting non-existent workflow', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow('Workflow not found');
    });

    it('should archive instead of hard delete when workflow has executions', async () => {
      const workflow = new Workflow({
        id: 'wf-001',
        name: 'Has Executions',
        domain: 'drug',
        userId: 'user-123',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(workflow);

      await service.delete('wf-001', { soft: true });

      expect(workflow.status).toBe('archived');
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('step management', () => {
    let workflow: Workflow;

    beforeEach(() => {
      workflow = new Workflow({
        id: 'wf-001',
        name: 'Test Workflow',
        domain: 'drug',
        userId: 'user-123',
      });
      vi.mocked(mockRepository.findById).mockResolvedValue(workflow);
    });

    it('should add step to workflow', async () => {
      const stepInput = {
        name: 'Load Protein Structure',
        type: 'data-input',
        domain: 'drug' as ResearchDomain,
        config: { format: 'pdb' },
      };

      const updated = await service.addStep('wf-001', stepInput);

      expect(updated.steps).toHaveLength(1);
      expect(updated.steps[0].name).toBe(stepInput.name);
      expect(updated.steps[0].type).toBe(stepInput.type);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should add step with dependencies', async () => {
      // Add first step
      workflow.addStep(
        new Step({
          id: 'step-001',
          name: 'Step 1',
          type: 'data-input',
          domain: 'drug',
        })
      );

      const stepInput = {
        name: 'Step 2',
        type: 'processing',
        domain: 'drug' as ResearchDomain,
        dependencies: ['step-001'],
      };

      const updated = await service.addStep('wf-001', stepInput);

      expect(updated.steps).toHaveLength(2);
      expect(updated.steps[1].dependencies).toContain('step-001');
    });

    it('should remove step from workflow', async () => {
      workflow.addStep(
        new Step({
          id: 'step-001',
          name: 'To Remove',
          type: 'data-input',
          domain: 'drug',
        })
      );

      const updated = await service.removeStep('wf-001', 'step-001');

      expect(updated.steps).toHaveLength(0);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update step configuration', async () => {
      workflow.addStep(
        new Step({
          id: 'step-001',
          name: 'Config Step',
          type: 'model-inference',
          domain: 'drug',
          config: { temperature: 0.5 },
        })
      );

      const updated = await service.updateStep('wf-001', 'step-001', {
        config: { temperature: 0.8, topK: 10 },
      });

      expect(updated.steps[0].config).toMatchObject({
        temperature: 0.8,
        topK: 10,
      });
    });
  });

  describe('version management (WKFL-COMM-002)', () => {
    it('should increment version on modification', async () => {
      const workflow = new Workflow({
        id: 'wf-001',
        name: 'Test',
        domain: 'drug',
        userId: 'user-123',
        version: 1,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(workflow);

      await service.update('wf-001', { name: 'Updated' });

      expect(workflow.version).toBe(2);
    });

    it('should create version snapshot', async () => {
      const workflow = new Workflow({
        id: 'wf-001',
        name: 'Test',
        domain: 'drug',
        userId: 'user-123',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(workflow);

      const snapshot = await service.createSnapshot('wf-001');

      expect(snapshot).toHaveProperty('version');
      expect(snapshot).toHaveProperty('data');
      expect(snapshot).toHaveProperty('createdAt');
    });

    it('should list version history', async () => {
      const workflow = new Workflow({
        id: 'wf-001',
        name: 'Test',
        domain: 'drug',
        userId: 'user-123',
      });

      // Create some history
      workflow.updateName('V2');
      workflow.createSnapshot();
      workflow.updateName('V3');
      workflow.createSnapshot();

      vi.mocked(mockRepository.findById).mockResolvedValue(workflow);

      const history = await service.getVersionHistory('wf-001');

      expect(history.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('workflow lifecycle', () => {
    let workflow: Workflow;

    beforeEach(() => {
      workflow = new Workflow({
        id: 'wf-001',
        name: 'Test',
        domain: 'drug',
        userId: 'user-123',
      });
      workflow.addStep(
        new Step({
          id: 'step-001',
          name: 'Step 1',
          type: 'data-input',
          domain: 'drug',
        })
      );
      vi.mocked(mockRepository.findById).mockResolvedValue(workflow);
    });

    it('should activate workflow', async () => {
      const activated = await service.activate('wf-001');

      expect(activated.status).toBe('active');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error when activating without steps', async () => {
      const emptyWorkflow = new Workflow({
        id: 'wf-002',
        name: 'Empty',
        domain: 'drug',
        userId: 'user-123',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(emptyWorkflow);

      await expect(service.activate('wf-002')).rejects.toThrow(
        'Cannot activate workflow without steps'
      );
    });

    it('should archive workflow', async () => {
      workflow.activate();

      const archived = await service.archive('wf-001');

      expect(archived.status).toBe('archived');
    });

    it('should clone workflow', async () => {
      const cloned = await service.clone('wf-001', {
        userId: 'user-456',
        name: 'Cloned Workflow',
      });

      expect(cloned.id).not.toBe('wf-001');
      expect(cloned.name).toBe('Cloned Workflow');
      expect(cloned.userId).toBe('user-456');
      expect(cloned.status).toBe('draft');
      expect(cloned.steps.length).toBe(workflow.steps.length);
    });
  });

  describe('workflow validation', () => {
    it('should validate workflow structure', async () => {
      const workflow = new Workflow({
        id: 'wf-001',
        name: 'Test',
        domain: 'drug',
        userId: 'user-123',
      });

      workflow.addStep(
        new Step({
          id: 'step-001',
          name: 'Valid Step',
          type: 'data-input',
          domain: 'drug',
        })
      );

      vi.mocked(mockRepository.findById).mockResolvedValue(workflow);

      const result = await service.validate('wf-001');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid workflow', async () => {
      const workflow = new Workflow({
        id: 'wf-001',
        name: 'Empty',
        domain: 'drug',
        userId: 'user-123',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(workflow);

      const result = await service.validate('wf-001');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('access control', () => {
    it('should check if user can access workflow', async () => {
      const workflow = new Workflow({
        id: 'wf-001',
        name: 'Private Workflow',
        domain: 'drug',
        userId: 'user-123',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(workflow);

      const canAccess = await service.canAccess('wf-001', 'user-123');
      const cannotAccess = await service.canAccess('wf-001', 'user-other');

      expect(canAccess).toBe(true);
      expect(cannotAccess).toBe(false);
    });

    it('should allow access to published templates', async () => {
      const template = new Workflow({
        id: 'tmpl-001',
        name: 'Public Template',
        domain: 'drug',
        userId: 'system',
        status: 'published',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(template);

      const canAccess = await service.canAccess('tmpl-001', 'any-user');

      expect(canAccess).toBe(true);
    });
  });
});
