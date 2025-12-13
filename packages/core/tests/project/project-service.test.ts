/**
 * Project Service Tests
 *
 * DASH-PROJ-001: CRUD operations
 * DASH-PROJ-007: Sorting
 * DASH-PROJ-008: Filtering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ProjectService,
  type ProjectRepository,
} from '../../src/project/project-service.js';
import {
  createProject,
  ResearchDomain,
  ProjectStatus,
  type Project,
} from '../../src/project/project.js';

describe('ProjectService', () => {
  let service: ProjectService;
  let mockRepository: ProjectRepository;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      archive: vi.fn(),
    };
    service = new ProjectService(mockRepository);
  });

  describe('createProject (DASH-PROJ-001)', () => {
    it('should create and persist a new project', async () => {
      const input = {
        name: 'New Project',
        description: 'Description',
        domain: ResearchDomain.DrugDiscovery,
        createdBy: 'user-123',
      };

      const expectedProject = createProject(input);
      vi.mocked(mockRepository.create).mockResolvedValue(expectedProject);

      const result = await service.createProject(input);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(result.name).toBe('New Project');
      expect(result.domain).toBe(ResearchDomain.DrugDiscovery);
    });

    it('should throw error for invalid project data', async () => {
      const input = {
        name: '', // Invalid: empty name
        domain: ResearchDomain.Materials,
        createdBy: 'user-123',
      };

      await expect(service.createProject(input)).rejects.toThrow(
        'Project name is required'
      );
    });
  });

  describe('getProject', () => {
    it('should return project by ID', async () => {
      const project = createProject({
        name: 'Test',
        domain: ResearchDomain.Materials,
        createdBy: 'user-123',
      });
      vi.mocked(mockRepository.findById).mockResolvedValue(project);

      const result = await service.getProject(project.id);

      expect(result).toEqual(project);
      expect(mockRepository.findById).toHaveBeenCalledWith(project.id);
    });

    it('should return null for non-existent project', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      const result = await service.getProject('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('updateProject (DASH-PROJ-001)', () => {
    it('should update project fields', async () => {
      const project = createProject({
        name: 'Original Name',
        domain: ResearchDomain.Climate,
        createdBy: 'user-123',
      });
      vi.mocked(mockRepository.findById).mockResolvedValue(project);
      vi.mocked(mockRepository.update).mockImplementation(async (p) => p);

      const result = await service.updateProject(project.id, {
        name: 'Updated Name',
        description: 'New description',
      });

      expect(result.name).toBe('Updated Name');
      expect(result.description).toBe('New description');
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        project.createdAt.getTime()
      );
    });

    it('should throw error when project not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(
        service.updateProject('non-existent', { name: 'New Name' })
      ).rejects.toThrow('Project not found');
    });
  });

  describe('deleteProject (DASH-PROJ-001)', () => {
    it('should delete project by ID', async () => {
      const project = createProject({
        name: 'To Delete',
        domain: ResearchDomain.Genomics,
        createdBy: 'user-123',
      });
      vi.mocked(mockRepository.findById).mockResolvedValue(project);
      vi.mocked(mockRepository.delete).mockResolvedValue(true);

      const result = await service.deleteProject(project.id);

      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(project.id);
    });
  });

  describe('archiveProject (DASH-PROJ-001)', () => {
    it('should archive project', async () => {
      const project = createProject({
        name: 'To Archive',
        domain: ResearchDomain.Chemistry,
        createdBy: 'user-123',
      });
      vi.mocked(mockRepository.findById).mockResolvedValue(project);
      vi.mocked(mockRepository.archive).mockImplementation(async (id) => ({
        ...project,
        status: ProjectStatus.Archived,
      }));

      const result = await service.archiveProject(project.id);

      expect(result.status).toBe(ProjectStatus.Archived);
    });
  });

  describe('listProjects with sorting (DASH-PROJ-007)', () => {
    const projects: Project[] = [
      {
        ...createProject({
          name: 'Alpha Project',
          domain: ResearchDomain.DrugDiscovery,
          createdBy: 'user-1',
        }),
        createdAt: new Date('2024-01-01'),
      },
      {
        ...createProject({
          name: 'Zebra Project',
          domain: ResearchDomain.Materials,
          createdBy: 'user-2',
        }),
        createdAt: new Date('2024-06-01'),
      },
      {
        ...createProject({
          name: 'Beta Project',
          domain: ResearchDomain.Climate,
          createdBy: 'user-1',
        }),
        createdAt: new Date('2024-03-01'),
      },
    ];

    beforeEach(() => {
      vi.mocked(mockRepository.findAll).mockResolvedValue(projects);
    });

    it('should sort by name ascending', async () => {
      const result = await service.listProjects({
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result[0].name).toBe('Alpha Project');
      expect(result[1].name).toBe('Beta Project');
      expect(result[2].name).toBe('Zebra Project');
    });

    it('should sort by name descending', async () => {
      const result = await service.listProjects({
        sortBy: 'name',
        sortOrder: 'desc',
      });

      expect(result[0].name).toBe('Zebra Project');
      expect(result[2].name).toBe('Alpha Project');
    });

    it('should sort by date', async () => {
      const result = await service.listProjects({
        sortBy: 'createdAt',
        sortOrder: 'asc',
      });

      expect(result[0].name).toBe('Alpha Project');
      expect(result[2].name).toBe('Zebra Project');
    });

    it('should sort by domain', async () => {
      const result = await service.listProjects({
        sortBy: 'domain',
        sortOrder: 'asc',
      });

      // climate < drug-discovery < materials (alphabetically)
      expect(result[0].domain).toBe(ResearchDomain.Climate);
    });
  });

  describe('listProjects with filtering (DASH-PROJ-008)', () => {
    const projects: Project[] = [
      {
        ...createProject({
          name: 'Drug Discovery AI',
          domain: ResearchDomain.DrugDiscovery,
          createdBy: 'user-1',
          tags: ['AI', 'ML'],
        }),
      },
      {
        ...createProject({
          name: 'Materials Research',
          domain: ResearchDomain.Materials,
          createdBy: 'user-2',
          tags: ['Simulation'],
        }),
      },
      {
        ...createProject({
          name: 'Climate AI Model',
          domain: ResearchDomain.Climate,
          createdBy: 'user-1',
          tags: ['AI', 'Climate'],
        }),
      },
    ];

    beforeEach(() => {
      vi.mocked(mockRepository.findAll).mockResolvedValue(projects);
    });

    it('should filter by keyword in name', async () => {
      const result = await service.listProjects({
        keyword: 'AI',
      });

      expect(result).toHaveLength(2);
      expect(result.every((p) => p.name.includes('AI'))).toBe(true);
    });

    it('should filter by domain', async () => {
      const result = await service.listProjects({
        domain: ResearchDomain.DrugDiscovery,
      });

      expect(result).toHaveLength(1);
      expect(result[0].domain).toBe(ResearchDomain.DrugDiscovery);
    });

    it('should filter by tag', async () => {
      const result = await service.listProjects({
        tags: ['AI'],
      });

      expect(result).toHaveLength(2);
      expect(result.every((p) => p.tags.includes('AI'))).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const result = await service.listProjects({
        keyword: 'AI',
        domain: ResearchDomain.Climate,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Climate AI Model');
    });

    it('should filter by status', async () => {
      const projectsWithStatus: Project[] = [
        {
          ...createProject({
            name: 'Active Project',
            domain: ResearchDomain.Materials,
            createdBy: 'user-1',
          }),
          status: ProjectStatus.Active,
        },
        {
          ...createProject({
            name: 'Draft Project',
            domain: ResearchDomain.Materials,
            createdBy: 'user-1',
          }),
          status: ProjectStatus.Draft,
        },
      ];
      vi.mocked(mockRepository.findAll).mockResolvedValue(projectsWithStatus);

      const result = await service.listProjects({
        status: ProjectStatus.Active,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Active Project');
    });
  });
});
