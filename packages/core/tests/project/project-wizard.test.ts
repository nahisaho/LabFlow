/**
 * Project Wizard Tests
 *
 * DASH-PROJ-002: Guided setup wizard
 * DASH-PROJ-003: Research domain templates
 * DASH-PROJ-004: Domain-specific default settings
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ProjectWizard,
  WizardStep,
  type WizardState,
  getDomainDefaults,
  getDomainTemplate,
} from '../../src/project/project-wizard.js';
import { ResearchDomain } from '../../src/project/project.js';

describe('ProjectWizard (DASH-PROJ-002)', () => {
  let wizard: ProjectWizard;

  beforeEach(() => {
    wizard = new ProjectWizard();
  });

  describe('wizard steps', () => {
    it('should have required wizard steps', () => {
      const steps = wizard.getSteps();

      expect(steps).toContain(WizardStep.SelectDomain);
      expect(steps).toContain(WizardStep.BasicInfo);
      expect(steps).toContain(WizardStep.Configuration);
      expect(steps).toContain(WizardStep.Review);
    });

    it('should start at SelectDomain step', () => {
      expect(wizard.getCurrentStep()).toBe(WizardStep.SelectDomain);
    });

    it('should progress to next step', () => {
      wizard.setDomain(ResearchDomain.DrugDiscovery);
      wizard.nextStep();

      expect(wizard.getCurrentStep()).toBe(WizardStep.BasicInfo);
    });

    it('should go back to previous step', () => {
      wizard.setDomain(ResearchDomain.DrugDiscovery);
      wizard.nextStep();
      wizard.previousStep();

      expect(wizard.getCurrentStep()).toBe(WizardStep.SelectDomain);
    });

    it('should not go before first step', () => {
      wizard.previousStep();

      expect(wizard.getCurrentStep()).toBe(WizardStep.SelectDomain);
    });
  });

  describe('domain selection', () => {
    it('should set selected domain', () => {
      wizard.setDomain(ResearchDomain.Materials);

      expect(wizard.getState().domain).toBe(ResearchDomain.Materials);
    });

    it('should not allow progression without domain selection', () => {
      expect(() => wizard.nextStep()).toThrow('Domain must be selected');
    });
  });

  describe('basic info', () => {
    beforeEach(() => {
      wizard.setDomain(ResearchDomain.Climate);
      wizard.nextStep();
    });

    it('should set project name', () => {
      wizard.setBasicInfo({ name: 'Climate Research Project' });

      expect(wizard.getState().name).toBe('Climate Research Project');
    });

    it('should set description', () => {
      wizard.setBasicInfo({
        name: 'Test',
        description: 'A detailed description',
      });

      expect(wizard.getState().description).toBe('A detailed description');
    });

    it('should not allow progression without name', () => {
      expect(() => wizard.nextStep()).toThrow('Project name is required');
    });
  });

  describe('wizard state', () => {
    it('should track completion progress', () => {
      expect(wizard.getProgress()).toBe(0);

      wizard.setDomain(ResearchDomain.Genomics);
      wizard.nextStep();
      expect(wizard.getProgress()).toBe(25);

      wizard.setBasicInfo({ name: 'Test Project' });
      wizard.nextStep();
      expect(wizard.getProgress()).toBe(50);
    });

    it('should return complete state', () => {
      wizard.setDomain(ResearchDomain.Chemistry);
      wizard.nextStep();
      wizard.setBasicInfo({ name: 'Chemistry Project', description: 'Test' });
      wizard.nextStep();
      wizard.setConfiguration({ computeMode: 'gpu' });
      wizard.nextStep();

      const state = wizard.getState();

      expect(state.domain).toBe(ResearchDomain.Chemistry);
      expect(state.name).toBe('Chemistry Project');
      expect(state.description).toBe('Test');
      expect(state.configuration?.computeMode).toBe('gpu');
    });

    it('should reset wizard state', () => {
      wizard.setDomain(ResearchDomain.Physics);
      wizard.nextStep();
      wizard.setBasicInfo({ name: 'Test' });

      wizard.reset();

      expect(wizard.getCurrentStep()).toBe(WizardStep.SelectDomain);
      expect(wizard.getState().domain).toBeUndefined();
      expect(wizard.getState().name).toBeUndefined();
    });
  });

  describe('finalize', () => {
    it('should return project creation input when complete', () => {
      wizard.setDomain(ResearchDomain.DrugDiscovery);
      wizard.nextStep();
      wizard.setBasicInfo({ name: 'Final Project', description: 'Desc' });
      wizard.nextStep();
      wizard.setConfiguration({});
      wizard.nextStep();

      const input = wizard.finalize('user-123');

      expect(input.name).toBe('Final Project');
      expect(input.description).toBe('Desc');
      expect(input.domain).toBe(ResearchDomain.DrugDiscovery);
      expect(input.createdBy).toBe('user-123');
    });

    it('should throw if not complete', () => {
      wizard.setDomain(ResearchDomain.Materials);

      expect(() => wizard.finalize('user-123')).toThrow(
        'Wizard is not complete'
      );
    });
  });
});

describe('Domain Templates (DASH-PROJ-003)', () => {
  it('should provide template for drug-discovery', () => {
    const template = getDomainTemplate(ResearchDomain.DrugDiscovery);

    expect(template).toBeDefined();
    expect(template.domain).toBe(ResearchDomain.DrugDiscovery);
    expect(template.suggestedWorkflows).toBeDefined();
    expect(template.suggestedWorkflows.length).toBeGreaterThan(0);
  });

  it('should provide template for materials', () => {
    const template = getDomainTemplate(ResearchDomain.Materials);

    expect(template.domain).toBe(ResearchDomain.Materials);
    expect(template.suggestedWorkflows).toContain('material-generation');
  });

  it('should provide template for climate', () => {
    const template = getDomainTemplate(ResearchDomain.Climate);

    expect(template.domain).toBe(ResearchDomain.Climate);
    expect(template.suggestedWorkflows).toContain('weather-prediction');
  });

  it('should provide template for genomics', () => {
    const template = getDomainTemplate(ResearchDomain.Genomics);

    expect(template.domain).toBe(ResearchDomain.Genomics);
    expect(template.suggestedWorkflows).toContain('protein-structure');
  });

  it('should provide template for chemistry', () => {
    const template = getDomainTemplate(ResearchDomain.Chemistry);

    expect(template.domain).toBe(ResearchDomain.Chemistry);
  });

  it('should provide template for physics', () => {
    const template = getDomainTemplate(ResearchDomain.Physics);

    expect(template.domain).toBe(ResearchDomain.Physics);
  });
});

describe('Domain Default Settings (DASH-PROJ-004)', () => {
  it('should apply drug-discovery defaults', () => {
    const defaults = getDomainDefaults(ResearchDomain.DrugDiscovery);

    expect(defaults.computeMode).toBe('gpu');
    expect(defaults.defaultOutputFormats).toContain('sdf');
    expect(defaults.defaultOutputFormats).toContain('csv');
    expect(defaults.enabledFeatures).toContain('admet-prediction');
    expect(defaults.enabledFeatures).toContain('docking');
  });

  it('should apply materials defaults', () => {
    const defaults = getDomainDefaults(ResearchDomain.Materials);

    expect(defaults.computeMode).toBe('gpu');
    expect(defaults.defaultOutputFormats).toContain('cif');
    expect(defaults.enabledFeatures).toContain('dft-calculation');
  });

  it('should apply climate defaults', () => {
    const defaults = getDomainDefaults(ResearchDomain.Climate);

    expect(defaults.defaultOutputFormats).toContain('netcdf');
    expect(defaults.enabledFeatures).toContain('geo-visualization');
  });

  it('should apply genomics defaults', () => {
    const defaults = getDomainDefaults(ResearchDomain.Genomics);

    expect(defaults.defaultOutputFormats).toContain('pdb');
    expect(defaults.defaultOutputFormats).toContain('fasta');
    expect(defaults.enabledFeatures).toContain('structure-prediction');
  });

  it('should apply chemistry defaults', () => {
    const defaults = getDomainDefaults(ResearchDomain.Chemistry);

    expect(defaults.defaultOutputFormats).toContain('xyz');
    expect(defaults.enabledFeatures).toContain('orbital-visualization');
  });

  it('should apply physics defaults', () => {
    const defaults = getDomainDefaults(ResearchDomain.Physics);

    expect(defaults.computeMode).toBe('hpc');
    expect(defaults.enabledFeatures).toContain('simulation');
  });
});
