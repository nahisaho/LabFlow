/**
 * Project Service
 *
 * DASH-PROJ-001: CRUD operations
 * DASH-PROJ-007: Sorting
 * DASH-PROJ-008: Filtering
 */

import {
  createProject,
  validateProject,
  updateProject as updateProjectEntity,
  type Project,
  type CreateProjectInput,
  ProjectStatus,
  ResearchDomain,
} from './project.js';

/**
 * Project repository interface
 */
export interface ProjectRepository {
  create(project: Project): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findAll(): Promise<Project[]>;
  update(project: Project): Promise<Project>;
  delete(id: string): Promise<boolean>;
  archive(id: string): Promise<Project>;
}

/**
 * List projects options
 */
export interface ListProjectsOptions {
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'domain' | 'status';
  sortOrder?: 'asc' | 'desc';
  keyword?: string;
  domain?: ResearchDomain;
  status?: ProjectStatus;
  tags?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Project Service
 *
 * Handles all project-related operations
 */
export class ProjectService {
  constructor(private readonly repository: ProjectRepository) {}

  /**
   * Create a new project (DASH-PROJ-001)
   */
  async createProject(input: CreateProjectInput): Promise<Project> {
    const project = createProject(input);
    const validation = validateProject(project);

    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    return this.repository.create(project);
  }

  /**
   * Get project by ID
   */
  async getProject(id: string): Promise<Project | null> {
    return this.repository.findById(id);
  }

  /**
   * Update project (DASH-PROJ-001)
   */
  async updateProject(
    id: string,
    updates: Partial<Omit<Project, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<Project> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Project not found');
    }

    const updated = updateProjectEntity(existing, updates);
    return this.repository.update(updated);
  }

  /**
   * Delete project (DASH-PROJ-001)
   */
  async deleteProject(id: string): Promise<boolean> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Project not found');
    }

    return this.repository.delete(id);
  }

  /**
   * Archive project (DASH-PROJ-001)
   */
  async archiveProject(id: string): Promise<Project> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Project not found');
    }

    return this.repository.archive(id);
  }

  /**
   * List projects with sorting and filtering (DASH-PROJ-007, DASH-PROJ-008)
   */
  async listProjects(options: ListProjectsOptions = {}): Promise<Project[]> {
    let projects = await this.repository.findAll();

    // Apply filters (DASH-PROJ-008)
    projects = this.applyFilters(projects, options);

    // Apply sorting (DASH-PROJ-007)
    projects = this.applySorting(projects, options);

    // Apply pagination
    if (options.offset !== undefined || options.limit !== undefined) {
      const start = options.offset ?? 0;
      const end = options.limit ? start + options.limit : undefined;
      projects = projects.slice(start, end);
    }

    return projects;
  }

  /**
   * Apply filters to project list (DASH-PROJ-008)
   */
  private applyFilters(
    projects: Project[],
    options: ListProjectsOptions
  ): Project[] {
    let filtered = [...projects];

    // Filter by keyword (in name or description)
    if (options.keyword) {
      const keyword = options.keyword.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(keyword) ||
          p.description?.toLowerCase().includes(keyword)
      );
    }

    // Filter by domain
    if (options.domain) {
      filtered = filtered.filter((p) => p.domain === options.domain);
    }

    // Filter by status
    if (options.status) {
      filtered = filtered.filter((p) => p.status === options.status);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter((p) =>
        options.tags!.some((tag) => p.tags.includes(tag))
      );
    }

    return filtered;
  }

  /**
   * Apply sorting to project list (DASH-PROJ-007)
   */
  private applySorting(
    projects: Project[],
    options: ListProjectsOptions
  ): Project[] {
    const { sortBy = 'createdAt', sortOrder = 'desc' } = options;

    return [...projects].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'domain':
          comparison = a.domain.localeCompare(b.domain);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'updatedAt':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'createdAt':
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }
}
