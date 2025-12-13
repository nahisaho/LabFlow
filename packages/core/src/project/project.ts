/**
 * Project Entity
 *
 * DASH-PROJ-001: Research project management
 * DASH-PROJ-003: Research domains
 * DASH-PROJ-005: UUID v4 project ID
 * DASH-PROJ-006: Project metadata
 */

import { randomUUID } from 'node:crypto';

/**
 * Research domains (DASH-PROJ-003)
 */
export enum ResearchDomain {
  DrugDiscovery = 'drug-discovery',
  Materials = 'materials',
  Climate = 'climate',
  Genomics = 'genomics',
  Chemistry = 'chemistry',
  Physics = 'physics',
}

/**
 * Project status
 */
export enum ProjectStatus {
  Draft = 'draft',
  Active = 'active',
  Completed = 'completed',
  Archived = 'archived',
}

/**
 * Project entity (DASH-PROJ-006)
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  domain: ResearchDomain;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  status: ProjectStatus;
  tags: string[];
  settings?: ProjectSettings;
}

/**
 * Project settings
 */
export interface ProjectSettings {
  computeMode?: 'cpu' | 'gpu' | 'hpc';
  defaultOutputFormats?: string[];
  enabledFeatures?: string[];
  notifications?: {
    email?: boolean;
    dashboard?: boolean;
  };
  budget?: {
    limit?: number;
    currency?: string;
  };
}

/**
 * Project creation input
 */
export interface CreateProjectInput {
  name: string;
  description?: string;
  domain: ResearchDomain;
  createdBy: string;
  tags?: string[];
  settings?: ProjectSettings;
}

/**
 * Project validation result
 */
export interface ProjectValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Create a new project (DASH-PROJ-001, DASH-PROJ-005)
 */
export function createProject(input: CreateProjectInput): Project {
  const now = new Date();

  return {
    id: randomUUID(), // UUID v4 (DASH-PROJ-005)
    name: input.name,
    description: input.description,
    domain: input.domain,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
    status: ProjectStatus.Draft,
    tags: input.tags ?? [],
    settings: input.settings,
  };
}

/**
 * Validate a project
 */
export function validateProject(project: Project): ProjectValidationResult {
  const errors: string[] = [];

  // Required: name
  if (!project.name || project.name.trim().length === 0) {
    errors.push('Project name is required');
  }

  // Required: createdBy
  if (!project.createdBy || project.createdBy.trim().length === 0) {
    errors.push('Created by is required');
  }

  // Valid domain
  if (!Object.values(ResearchDomain).includes(project.domain)) {
    errors.push('Invalid research domain');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Update project fields
 */
export function updateProject(
  project: Project,
  updates: Partial<Omit<Project, 'id' | 'createdAt' | 'createdBy'>>
): Project {
  return {
    ...project,
    ...updates,
    updatedAt: new Date(),
  };
}
