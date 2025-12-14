/**
 * Workflow Templates Tests
 */
import { describe, it, expect } from 'vitest';
import {
  WORKFLOW_TEMPLATES,
  getTemplateById,
  getTemplatesByDomain,
  createWorkflowFromTemplate,
  createEmptyWorkflow,
  getTemplatesForSelection,
} from '@/components/workflow/templates';

describe('Workflow Templates', () => {
  describe('WORKFLOW_TEMPLATES', () => {
    it('should have 8 templates', () => {
      expect(WORKFLOW_TEMPLATES).toHaveLength(8);
    });

    it('should have templates for all domains', () => {
      const domains = [...new Set(WORKFLOW_TEMPLATES.map((t) => t.domain))];
      expect(domains).toContain('materials');
      expect(domains).toContain('drug');
      expect(domains).toContain('climate');
      expect(domains).toContain('genomics');
    });

    it('should have valid step definitions', () => {
      WORKFLOW_TEMPLATES.forEach((template) => {
        expect(template.steps.length).toBeGreaterThan(0);
        template.steps.forEach((step) => {
          // Template steps don't have id (generated on creation)
          expect(step.name).toBeTruthy();
          expect(step.type).toBeTruthy();
          expect(step.position).toBeDefined();
          expect(step.position.x).toBeGreaterThanOrEqual(0);
          expect(step.position.y).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  describe('getTemplateById', () => {
    it('should return template by id', () => {
      const template = getTemplateById('materials-discovery');
      expect(template).toBeDefined();
      expect(template?.id).toBe('materials-discovery');
      expect(template?.nameJa).toBe('新材料探索');
    });

    it('should return undefined for unknown id', () => {
      const template = getTemplateById('unknown-template');
      expect(template).toBeUndefined();
    });
  });

  describe('getTemplatesByDomain', () => {
    it('should return materials templates', () => {
      const templates = getTemplatesByDomain('materials');
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.domain).toBe('materials');
      });
    });

    it('should return drug templates', () => {
      const templates = getTemplatesByDomain('drug');
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.domain).toBe('drug');
      });
    });

    it('should return climate templates', () => {
      const templates = getTemplatesByDomain('climate');
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.domain).toBe('climate');
      });
    });

    it('should return genomics templates', () => {
      const templates = getTemplatesByDomain('genomics');
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.domain).toBe('genomics');
      });
    });
  });

  describe('createWorkflowFromTemplate', () => {
    it('should create workflow from template', () => {
      const template = getTemplateById('materials-discovery');
      expect(template).toBeDefined();
      const workflow = createWorkflowFromTemplate(template!, 'user-1', '新しい材料探索');
      expect(workflow).toBeDefined();
      expect(workflow.name).toBe('新しい材料探索');
      expect(workflow.domain).toBe('materials');
      expect(workflow.status).toBe('draft');
      expect(workflow.steps.length).toBeGreaterThan(0);
    });

    it('should generate unique ids', async () => {
      const template = getTemplateById('materials-discovery');
      expect(template).toBeDefined();
      
      const workflow1 = createWorkflowFromTemplate(template!, 'user-1');
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const workflow2 = createWorkflowFromTemplate(template!, 'user-1');
      
      // IDs should be different (timestamp-based)
      expect(workflow1.id).not.toBe(workflow2.id);
    });

    it('should use default name when not provided', () => {
      const template = getTemplateById('materials-discovery');
      expect(template).toBeDefined();
      const workflow = createWorkflowFromTemplate(template!, 'user-1');
      expect(workflow.name).toBe('新材料探索');
    });

    it('should update dependencies with new ids', () => {
      const template = getTemplateById('materials-discovery');
      expect(template).toBeDefined();
      const workflow = createWorkflowFromTemplate(template!, 'user-1');
      
      // Check that all steps have IDs
      workflow.steps.forEach((step) => {
        expect(step.id).toBeTruthy();
        expect(step.status).toBe('pending');
      });
      
      // Check dependencies point to valid steps
      const stepIds = workflow.steps.map((s) => s.id);
      workflow.steps.forEach((step) => {
        step.dependencies.forEach((depId) => {
          expect(stepIds).toContain(depId);
        });
      });
    });
  });

  describe('createEmptyWorkflow', () => {
    it('should create empty workflow', () => {
      const workflow = createEmptyWorkflow('drug', 'user-1', '空のワークフロー');
      expect(workflow).toBeDefined();
      expect(workflow.name).toBe('空のワークフロー');
      expect(workflow.domain).toBe('drug');
      expect(workflow.status).toBe('draft');
      expect(workflow.steps).toHaveLength(0);
    });

    it('should generate unique id', async () => {
      const workflow1 = createEmptyWorkflow('materials', 'user-1');
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const workflow2 = createEmptyWorkflow('materials', 'user-1');
      expect(workflow1.id).not.toBe(workflow2.id);
    });

    it('should use default name', () => {
      const workflow = createEmptyWorkflow('climate', 'user-1');
      expect(workflow.name).toBe('新規ワークフロー');
    });
  });

  describe('getTemplatesForSelection', () => {
    it('should return all templates with selection info', () => {
      const templates = getTemplatesForSelection();
      expect(templates.length).toBe(8);
      templates.forEach((t) => {
        expect(t.id).toBeTruthy();
        expect(t.name).toBeTruthy();
        expect(t.nameJa).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(t.descriptionJa).toBeTruthy();
        expect(t.domain).toBeTruthy();
        expect(t.icon).toBeTruthy();
        expect(t.stepCount).toBeGreaterThan(0);
      });
    });

    it('should have correct step counts', () => {
      const templates = getTemplatesForSelection();
      templates.forEach((selection) => {
        const fullTemplate = getTemplateById(selection.id);
        expect(selection.stepCount).toBe(fullTemplate?.steps.length);
      });
    });
  });

  describe('Template Step Dependencies', () => {
    it('should have valid dependency chains in materials-discovery', () => {
      const template = getTemplateById('materials-discovery');
      expect(template).toBeDefined();
      
      const stepIds = template!.steps.map((s) => s.id);
      template!.steps.forEach((step) => {
        step.dependencies.forEach((depId) => {
          expect(stepIds).toContain(depId);
        });
      });
    });

    it('should have valid dependency chains in drug-discovery', () => {
      const template = getTemplateById('drug-discovery');
      expect(template).toBeDefined();
      
      const stepIds = template!.steps.map((s) => s.id);
      template!.steps.forEach((step) => {
        step.dependencies.forEach((depId) => {
          expect(stepIds).toContain(depId);
        });
      });
    });
  });
});
