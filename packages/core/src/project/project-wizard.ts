/**
 * Project Wizard
 *
 * DASH-PROJ-002: Guided setup wizard
 * DASH-PROJ-003: Research domain templates
 * DASH-PROJ-004: Domain-specific default settings
 */

import {
  ResearchDomain,
  type CreateProjectInput,
  type ProjectSettings,
} from './project.js';

/**
 * Wizard steps
 */
export enum WizardStep {
  SelectDomain = 'select-domain',
  BasicInfo = 'basic-info',
  Configuration = 'configuration',
  Review = 'review',
}

/**
 * Wizard state
 */
export interface WizardState {
  domain?: ResearchDomain;
  name?: string;
  description?: string;
  tags?: string[];
  configuration?: ProjectSettings;
}

/**
 * Domain template
 */
export interface DomainTemplate {
  domain: ResearchDomain;
  displayName: string;
  description: string;
  suggestedWorkflows: string[];
  defaultTags: string[];
}

/**
 * Domain default settings
 */
export interface DomainDefaults {
  computeMode: 'cpu' | 'gpu' | 'hpc';
  defaultOutputFormats: string[];
  enabledFeatures: string[];
}

/**
 * Project creation wizard (DASH-PROJ-002)
 */
export class ProjectWizard {
  private currentStep: WizardStep = WizardStep.SelectDomain;
  private state: WizardState = {};

  private readonly steps: WizardStep[] = [
    WizardStep.SelectDomain,
    WizardStep.BasicInfo,
    WizardStep.Configuration,
    WizardStep.Review,
  ];

  /**
   * Get all wizard steps
   */
  getSteps(): WizardStep[] {
    return [...this.steps];
  }

  /**
   * Get current step
   */
  getCurrentStep(): WizardStep {
    return this.currentStep;
  }

  /**
   * Get current state
   */
  getState(): WizardState {
    return { ...this.state };
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    const currentIndex = this.steps.indexOf(this.currentStep);
    return Math.round((currentIndex / this.steps.length) * 100);
  }

  /**
   * Move to next step
   */
  nextStep(): void {
    this.validateCurrentStep();

    const currentIndex = this.steps.indexOf(this.currentStep);
    if (currentIndex < this.steps.length - 1) {
      this.currentStep = this.steps[currentIndex + 1];
    }
  }

  /**
   * Move to previous step
   */
  previousStep(): void {
    const currentIndex = this.steps.indexOf(this.currentStep);
    if (currentIndex > 0) {
      this.currentStep = this.steps[currentIndex - 1];
    }
  }

  /**
   * Set domain (step 1)
   */
  setDomain(domain: ResearchDomain): void {
    this.state.domain = domain;
  }

  /**
   * Set basic info (step 2)
   */
  setBasicInfo(info: { name: string; description?: string; tags?: string[] }): void {
    this.state.name = info.name;
    this.state.description = info.description;
    this.state.tags = info.tags;
  }

  /**
   * Set configuration (step 3)
   */
  setConfiguration(config: ProjectSettings): void {
    this.state.configuration = config;
  }

  /**
   * Reset wizard state
   */
  reset(): void {
    this.currentStep = WizardStep.SelectDomain;
    this.state = {};
  }

  /**
   * Check if wizard is complete
   */
  isComplete(): boolean {
    return (
      this.currentStep === WizardStep.Review &&
      this.state.domain !== undefined &&
      this.state.name !== undefined
    );
  }

  /**
   * Finalize and create project input
   */
  finalize(createdBy: string): CreateProjectInput {
    if (!this.isComplete()) {
      throw new Error('Wizard is not complete');
    }

    const defaults = getDomainDefaults(this.state.domain!);

    return {
      name: this.state.name!,
      description: this.state.description,
      domain: this.state.domain!,
      createdBy,
      tags: this.state.tags,
      settings: {
        ...defaults,
        ...this.state.configuration,
      },
    };
  }

  /**
   * Validate current step before proceeding
   */
  private validateCurrentStep(): void {
    switch (this.currentStep) {
      case WizardStep.SelectDomain:
        if (!this.state.domain) {
          throw new Error('Domain must be selected');
        }
        break;
      case WizardStep.BasicInfo:
        if (!this.state.name || this.state.name.trim().length === 0) {
          throw new Error('Project name is required');
        }
        break;
    }
  }
}

/**
 * Get domain template (DASH-PROJ-003)
 */
export function getDomainTemplate(domain: ResearchDomain): DomainTemplate {
  const templates: Record<ResearchDomain, DomainTemplate> = {
    [ResearchDomain.DrugDiscovery]: {
      domain: ResearchDomain.DrugDiscovery,
      displayName: 'Drug Discovery',
      description: 'AI-powered drug discovery workflows including target identification, lead optimization, and ADMET prediction',
      suggestedWorkflows: ['target-identification', 'molecule-generation', 'admet-prediction', 'docking'],
      defaultTags: ['drug-discovery', 'pharma'],
    },
    [ResearchDomain.Materials]: {
      domain: ResearchDomain.Materials,
      displayName: 'Materials Science',
      description: 'Discover and design novel materials with target properties',
      suggestedWorkflows: ['material-generation', 'stability-prediction', 'dft-calculation'],
      defaultTags: ['materials', 'chemistry'],
    },
    [ResearchDomain.Climate]: {
      domain: ResearchDomain.Climate,
      displayName: 'Climate & Environment',
      description: 'Climate modeling and environmental prediction workflows',
      suggestedWorkflows: ['weather-prediction', 'climate-modeling', 'pollution-forecast'],
      defaultTags: ['climate', 'environment'],
    },
    [ResearchDomain.Genomics]: {
      domain: ResearchDomain.Genomics,
      displayName: 'Genomics & Proteomics',
      description: 'Protein structure prediction and genomic analysis',
      suggestedWorkflows: ['protein-structure', 'sequence-analysis', 'gene-expression'],
      defaultTags: ['genomics', 'biology'],
    },
    [ResearchDomain.Chemistry]: {
      domain: ResearchDomain.Chemistry,
      displayName: 'Computational Chemistry',
      description: 'Quantum chemistry and molecular simulation workflows',
      suggestedWorkflows: ['dft-optimization', 'md-simulation', 'reaction-mechanism'],
      defaultTags: ['chemistry', 'simulation'],
    },
    [ResearchDomain.Physics]: {
      domain: ResearchDomain.Physics,
      displayName: 'Physics Simulation',
      description: 'High-performance physics simulations',
      suggestedWorkflows: ['particle-simulation', 'quantum-simulation', 'field-theory'],
      defaultTags: ['physics', 'simulation'],
    },
  };

  return templates[domain];
}

/**
 * Get domain default settings (DASH-PROJ-004)
 */
export function getDomainDefaults(domain: ResearchDomain): DomainDefaults {
  const defaults: Record<ResearchDomain, DomainDefaults> = {
    [ResearchDomain.DrugDiscovery]: {
      computeMode: 'gpu',
      defaultOutputFormats: ['sdf', 'csv', 'json', 'pdb'],
      enabledFeatures: ['admet-prediction', 'docking', 'molecule-visualization', 'property-calculator'],
    },
    [ResearchDomain.Materials]: {
      computeMode: 'gpu',
      defaultOutputFormats: ['cif', 'poscar', 'json', 'xyz'],
      enabledFeatures: ['dft-calculation', 'stability-analysis', 'crystal-visualization', 'phonon-analysis'],
    },
    [ResearchDomain.Climate]: {
      computeMode: 'cpu',
      defaultOutputFormats: ['netcdf', 'geojson', 'csv', 'json'],
      enabledFeatures: ['geo-visualization', 'time-series', 'uncertainty-quantification', 'ensemble-analysis'],
    },
    [ResearchDomain.Genomics]: {
      computeMode: 'gpu',
      defaultOutputFormats: ['pdb', 'fasta', 'mmcif', 'json'],
      enabledFeatures: ['structure-prediction', 'sequence-alignment', 'structure-visualization', 'confidence-scoring'],
    },
    [ResearchDomain.Chemistry]: {
      computeMode: 'gpu',
      defaultOutputFormats: ['xyz', 'mol2', 'cube', 'json'],
      enabledFeatures: ['orbital-visualization', 'frequency-analysis', 'reaction-path', 'property-prediction'],
    },
    [ResearchDomain.Physics]: {
      computeMode: 'hpc',
      defaultOutputFormats: ['hdf5', 'vtk', 'json', 'csv'],
      enabledFeatures: ['simulation', 'field-visualization', 'trajectory-analysis', 'parallel-computation'],
    },
  };

  return defaults[domain];
}
