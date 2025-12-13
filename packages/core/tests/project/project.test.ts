/**
 * Project Entity Tests
 *
 * DASH-PROJ-001: CRUD operations for research projects
 * DASH-PROJ-005: Unique project ID (UUID v4)
 * DASH-PROJ-006: Project metadata
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Project,
  ProjectStatus,
  ResearchDomain,
  createProject,
  validateProject,
} from '../../src/project/project.js';

describe('Project Entity', () => {
  describe('createProject (DASH-PROJ-001)', () => {
    it('should create a new project with required fields', () => {
      const project = createProject({
        name: 'Drug Discovery Project',
        description: 'Testing new compounds',
        domain: ResearchDomain.DrugDiscovery,
        createdBy: 'user-123',
      });

      expect(project).toBeDefined();
      expect(project.name).toBe('Drug Discovery Project');
      expect(project.description).toBe('Testing new compounds');
      expect(project.domain).toBe(ResearchDomain.DrugDiscovery);
      expect(project.createdBy).toBe('user-123');
    });

    it('should generate UUID v4 format project ID (DASH-PROJ-005)', () => {
      const project = createProject({
        name: 'Test Project',
        domain: ResearchDomain.Materials,
        createdBy: 'user-123',
      });

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidV4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(project.id).toMatch(uuidV4Regex);
    });

    it('should set default status to Draft', () => {
      const project = createProject({
        name: 'Test Project',
        domain: ResearchDomain.Climate,
        createdBy: 'user-123',
      });

      expect(project.status).toBe(ProjectStatus.Draft);
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const before = new Date();
      const project = createProject({
        name: 'Test Project',
        domain: ResearchDomain.Genomics,
        createdBy: 'user-123',
      });
      const after = new Date();

      expect(project.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(project.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(project.updatedAt.getTime()).toBe(project.createdAt.getTime());
    });

    it('should initialize with empty tags array', () => {
      const project = createProject({
        name: 'Test Project',
        domain: ResearchDomain.Chemistry,
        createdBy: 'user-123',
      });

      expect(project.tags).toEqual([]);
    });

    it('should accept custom tags', () => {
      const project = createProject({
        name: 'Test Project',
        domain: ResearchDomain.Physics,
        createdBy: 'user-123',
        tags: ['AI', 'Machine Learning', 'Simulation'],
      });

      expect(project.tags).toEqual(['AI', 'Machine Learning', 'Simulation']);
    });
  });

  describe('Project metadata (DASH-PROJ-006)', () => {
    it('should store all required metadata fields', () => {
      const project = createProject({
        name: 'Full Metadata Project',
        description: 'Complete project with all metadata',
        domain: ResearchDomain.DrugDiscovery,
        createdBy: 'user-456',
        tags: ['tag1', 'tag2'],
      });

      // Required metadata: name, description, createdBy, createdAt, updatedAt, domain, tags, status
      expect(project.name).toBeDefined();
      expect(project.description).toBeDefined();
      expect(project.createdBy).toBeDefined();
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
      expect(project.domain).toBeDefined();
      expect(project.tags).toBeDefined();
      expect(project.status).toBeDefined();
    });
  });

  describe('validateProject', () => {
    it('should return valid for correct project', () => {
      const project = createProject({
        name: 'Valid Project',
        domain: ResearchDomain.Materials,
        createdBy: 'user-123',
      });

      const result = validateProject(project);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for empty name', () => {
      const project = createProject({
        name: '',
        domain: ResearchDomain.Materials,
        createdBy: 'user-123',
      });

      const result = validateProject(project);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project name is required');
    });

    it('should return error for missing createdBy', () => {
      const project = createProject({
        name: 'Test',
        domain: ResearchDomain.Materials,
        createdBy: '',
      });

      const result = validateProject(project);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Created by is required');
    });

    it('should return error for invalid domain', () => {
      const project = {
        id: '123',
        name: 'Test',
        domain: 'invalid-domain' as ResearchDomain,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: ProjectStatus.Draft,
        tags: [],
      };

      const result = validateProject(project);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid research domain');
    });
  });
});

describe('ResearchDomain (DASH-PROJ-003)', () => {
  it('should define all required research domains', () => {
    expect(ResearchDomain.DrugDiscovery).toBe('drug-discovery');
    expect(ResearchDomain.Materials).toBe('materials');
    expect(ResearchDomain.Climate).toBe('climate');
    expect(ResearchDomain.Genomics).toBe('genomics');
    expect(ResearchDomain.Chemistry).toBe('chemistry');
    expect(ResearchDomain.Physics).toBe('physics');
  });

  it('should have exactly 6 domains', () => {
    const domains = Object.values(ResearchDomain);
    expect(domains).toHaveLength(6);
  });
});

describe('ProjectStatus', () => {
  it('should define all project statuses', () => {
    expect(ProjectStatus.Draft).toBe('draft');
    expect(ProjectStatus.Active).toBe('active');
    expect(ProjectStatus.Completed).toBe('completed');
    expect(ProjectStatus.Archived).toBe('archived');
  });
});
