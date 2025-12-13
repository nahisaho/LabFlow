/**
 * Project Module
 *
 * DASH-PROJ: Project management for research projects
 */

// Project entity
export {
  ResearchDomain,
  ProjectStatus,
  createProject,
  validateProject,
  updateProject,
  type Project,
  type ProjectSettings,
  type CreateProjectInput,
  type ProjectValidationResult,
} from './project.js';

// Project service
export {
  ProjectService,
  type ProjectRepository,
  type ListProjectsOptions,
} from './project-service.js';

// Project wizard
export {
  ProjectWizard,
  WizardStep,
  getDomainTemplate,
  getDomainDefaults,
  type WizardState,
  type DomainTemplate,
  type DomainDefaults,
} from './project-wizard.js';
