/**
 * Dataset Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatasetService } from '../src/lab/dataset-service.js';
import type {
  LabDataset,
  DatasetWithCreator,
  DatasetVisibility,
} from '../src/lab/types.js';
import type {
  DatasetRepository,
  LabPermissionService,
  GraphRAGIndexer,
} from '../src/lab/dataset-service.js';

// Mock dataset repository
function createMockRepository(): DatasetRepository {
  const datasets = new Map<string, LabDataset>();

  return {
    createDataset: vi.fn(async (dataset: LabDataset) => {
      datasets.set(dataset.id, dataset);
      return dataset;
    }),
    getDataset: vi.fn(async (id: string) => datasets.get(id) ?? null),
    updateDataset: vi.fn(async (id: string, updates: Partial<LabDataset>) => {
      const dataset = datasets.get(id);
      if (!dataset) return null;
      const updated = { ...dataset, ...updates };
      datasets.set(id, updated);
      return updated;
    }),
    deleteDataset: vi.fn(async (id: string) => datasets.delete(id)),
    listDatasets: vi.fn(async (): Promise<DatasetWithCreator[]> => {
      return Array.from(datasets.values()).map((d) => ({
        ...d,
        createdBy: { id: d.createdById, name: 'Test User' },
      }));
    }),
    countDatasets: vi.fn(async () => datasets.size),
    getDatasetVersions: vi.fn(async () => []),
    getLabStorageUsage: vi.fn(async () => 0),
  };
}

// Mock permission service
function createMockPermissionService(
  allowed = true,
  settings = {
    maxStorageGb: 100,
    defaultVisibility: 'lab' as DatasetVisibility,
    requireApprovalForPublic: true,
    enableGraphRAG: true,
  }
): LabPermissionService {
  return {
    checkPermission: vi.fn(async () => ({
      allowed,
      reason: allowed ? undefined : 'Permission denied',
    })),
    getLabSettings: vi.fn(async () => settings),
  };
}

// Mock GraphRAG indexer
function createMockGraphRAGIndexer(): GraphRAGIndexer {
  return {
    indexDataset: vi.fn(async () => {}),
    removeDatasetIndex: vi.fn(async () => {}),
  };
}

describe('DatasetService', () => {
  let service: DatasetService;
  let repository: DatasetRepository;
  let permissionService: LabPermissionService;
  let graphRAGIndexer: GraphRAGIndexer;

  beforeEach(() => {
    repository = createMockRepository();
    permissionService = createMockPermissionService();
    graphRAGIndexer = createMockGraphRAGIndexer();
    service = new DatasetService(repository, permissionService, graphRAGIndexer);
  });

  describe('createDataset', () => {
    it('should create a dataset', async () => {
      const dataset = await service.createDataset(
        {
          labId: 'lab-1',
          name: 'Test Dataset',
          type: 'molecules',
          storagePath: '/data/test.csv',
          sizeBytes: 1024,
        },
        'user-1'
      );

      expect(dataset).toBeDefined();
      expect(dataset.name).toBe('Test Dataset');
      expect(dataset.type).toBe('molecules');
      expect(dataset.visibility).toBe('lab');
      expect(dataset.version).toBe(1);
      expect(repository.createDataset).toHaveBeenCalled();
    });

    it('should throw when permission denied', async () => {
      permissionService = createMockPermissionService(false);
      service = new DatasetService(repository, permissionService);

      await expect(
        service.createDataset(
          {
            labId: 'lab-1',
            name: 'Test Dataset',
            type: 'molecules',
            storagePath: '/data/test.csv',
            sizeBytes: 1024,
          },
          'user-1'
        )
      ).rejects.toThrow('Permission denied');
    });

    it('should throw when storage limit exceeded', async () => {
      // Mock storage usage to be near limit
      repository.getLabStorageUsage = vi.fn(async () => 99 * 1024 * 1024 * 1024); // 99 GB

      await expect(
        service.createDataset(
          {
            labId: 'lab-1',
            name: 'Large Dataset',
            type: 'molecules',
            storagePath: '/data/large.csv',
            sizeBytes: 2 * 1024 * 1024 * 1024, // 2 GB
          },
          'user-1'
        )
      ).rejects.toThrow('Storage limit exceeded');
    });

    it('should trigger GraphRAG indexing when enabled', async () => {
      const dataset = await service.createDataset(
        {
          labId: 'lab-1',
          name: 'Test Dataset',
          type: 'molecules',
          storagePath: '/data/test.csv',
          sizeBytes: 1024,
        },
        'user-1'
      );

      // Wait for async indexing
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(graphRAGIndexer.indexDataset).toHaveBeenCalledWith(
        dataset.id,
        dataset.storagePath,
        dataset.type
      );
    });
  });

  describe('getDataset', () => {
    it('should return public dataset for any user', async () => {
      // Create public dataset
      const created = await service.createDataset(
        {
          labId: 'lab-1',
          name: 'Public Dataset',
          type: 'molecules',
          visibility: 'public',
          storagePath: '/data/public.csv',
          sizeBytes: 1024,
        },
        'user-1'
      );

      // Get as different user
      const dataset = await service.getDataset(created.id, 'other-user');

      expect(dataset).toBeDefined();
      expect(dataset?.name).toBe('Public Dataset');
    });

    it('should return null for private dataset when not creator', async () => {
      // Create private dataset
      const created = await service.createDataset(
        {
          labId: 'lab-1',
          name: 'Private Dataset',
          type: 'molecules',
          visibility: 'private',
          storagePath: '/data/private.csv',
          sizeBytes: 1024,
        },
        'user-1'
      );

      // Mock permission denied
      permissionService = createMockPermissionService(false);
      service = new DatasetService(repository, permissionService);

      const dataset = await service.getDataset(created.id, 'other-user');

      expect(dataset).toBeNull();
    });
  });

  describe('updateDataset', () => {
    it('should update dataset', async () => {
      const created = await service.createDataset(
        {
          labId: 'lab-1',
          name: 'Original Name',
          type: 'molecules',
          storagePath: '/data/test.csv',
          sizeBytes: 1024,
        },
        'user-1'
      );

      const updated = await service.updateDataset(
        created.id,
        { name: 'Updated Name' },
        'user-1'
      );

      expect(updated?.name).toBe('Updated Name');
    });

    it('should update tags', async () => {
      const created = await service.createDataset(
        {
          labId: 'lab-1',
          name: 'Test Dataset',
          type: 'molecules',
          storagePath: '/data/test.csv',
          sizeBytes: 1024,
          tags: ['original'],
        },
        'user-1'
      );

      const updated = await service.updateDataset(
        created.id,
        { tags: ['new', 'tags'] },
        'user-1'
      );

      expect(updated?.tags).toEqual(['new', 'tags']);
    });
  });

  describe('deleteDataset', () => {
    it('should delete dataset', async () => {
      const created = await service.createDataset(
        {
          labId: 'lab-1',
          name: 'Test Dataset',
          type: 'molecules',
          storagePath: '/data/test.csv',
          sizeBytes: 1024,
        },
        'user-1'
      );

      const result = await service.deleteDataset(created.id, 'user-1');

      expect(result).toBe(true);
      expect(repository.deleteDataset).toHaveBeenCalledWith(created.id);
    });

    it('should remove from GraphRAG index when indexed', async () => {
      const created = await service.createDataset(
        {
          labId: 'lab-1',
          name: 'Test Dataset',
          type: 'molecules',
          storagePath: '/data/test.csv',
          sizeBytes: 1024,
        },
        'user-1'
      );

      // Mark as indexed
      await repository.updateDataset(created.id, { isIndexed: true });

      await service.deleteDataset(created.id, 'user-1');

      expect(graphRAGIndexer.removeDatasetIndex).toHaveBeenCalledWith(created.id);
    });
  });

  describe('createDatasetVersion', () => {
    it('should create new version of dataset', async () => {
      const original = await service.createDataset(
        {
          labId: 'lab-1',
          name: 'Test Dataset v1',
          type: 'molecules',
          storagePath: '/data/v1.csv',
          sizeBytes: 1024,
          tags: ['production'],
        },
        'user-1'
      );

      const newVersion = await service.createDatasetVersion(
        original.id,
        {
          name: 'Test Dataset v2',
          type: 'molecules',
          storagePath: '/data/v2.csv',
          sizeBytes: 2048,
        },
        'user-1'
      );

      expect(newVersion.version).toBe(2);
      expect(newVersion.parentId).toBe(original.id);
      expect(newVersion.tags).toEqual(['production']); // Inherited
    });
  });

  describe('getStorageUsage', () => {
    it('should return storage usage', async () => {
      // Mock storage usage
      repository.getLabStorageUsage = vi.fn(async () => 50 * 1024 * 1024 * 1024); // 50 GB

      const usage = await service.getStorageUsage('lab-1', 'user-1');

      expect(usage.usedBytes).toBe(50 * 1024 * 1024 * 1024);
      expect(usage.maxBytes).toBe(100 * 1024 * 1024 * 1024);
      expect(usage.percentage).toBe(50);
    });
  });

  describe('indexDataset', () => {
    it('should trigger GraphRAG indexing', async () => {
      const created = await service.createDataset(
        {
          labId: 'lab-1',
          name: 'Test Dataset',
          type: 'molecules',
          storagePath: '/data/test.csv',
          sizeBytes: 1024,
        },
        'user-1'
      );

      await service.indexDataset(created.id, 'user-1');

      expect(graphRAGIndexer.indexDataset).toHaveBeenCalledWith(
        created.id,
        '/data/test.csv',
        'molecules'
      );
    });

    it('should throw when GraphRAG disabled', async () => {
      permissionService = createMockPermissionService(true, {
        maxStorageGb: 100,
        defaultVisibility: 'lab',
        requireApprovalForPublic: true,
        enableGraphRAG: false, // Disabled
      });
      service = new DatasetService(repository, permissionService, graphRAGIndexer);

      const created = await service.createDataset(
        {
          labId: 'lab-1',
          name: 'Test Dataset',
          type: 'molecules',
          storagePath: '/data/test.csv',
          sizeBytes: 1024,
        },
        'user-1'
      );

      await expect(
        service.indexDataset(created.id, 'user-1')
      ).rejects.toThrow('GraphRAG is not enabled');
    });
  });
});
