/**
 * Dataset Service
 *
 * Requirements:
 * - LAB-DATA-001: Dataset management
 * - LAB-DATA-002: Data versioning
 * - LAB-DATA-003: GraphRAG indexing
 */

import { randomUUID } from 'crypto';
import type {
  LabDataset,
  DatasetType,
  DatasetVisibility,
  DatasetWithCreator,
  CreateDatasetInput,
  UpdateDatasetInput,
  ListDatasetsOptions,
  PermissionCheck,
  LabMemberRole,
} from './types.js';

/**
 * Dataset repository interface
 */
export interface DatasetRepository {
  // Dataset operations
  createDataset(dataset: LabDataset): Promise<LabDataset>;
  getDataset(id: string): Promise<LabDataset | null>;
  updateDataset(id: string, dataset: Partial<LabDataset>): Promise<LabDataset | null>;
  deleteDataset(id: string): Promise<boolean>;
  listDatasets(options: ListDatasetsOptions): Promise<DatasetWithCreator[]>;
  countDatasets(labId: string): Promise<number>;
  
  // Version operations
  getDatasetVersions(datasetId: string): Promise<LabDataset[]>;
  
  // Storage calculations
  getLabStorageUsage(labId: string): Promise<number>;
}

/**
 * Permission service interface
 */
export interface LabPermissionService {
  checkPermission(labId: string, userId: string, requiredRole: LabMemberRole): Promise<PermissionCheck>;
  getLabSettings(labId: string): Promise<{ 
    maxStorageGb: number;
    defaultVisibility: DatasetVisibility;
    requireApprovalForPublic: boolean;
    enableGraphRAG: boolean;
  } | null>;
}

/**
 * GraphRAG indexing service interface
 */
export interface GraphRAGIndexer {
  indexDataset(datasetId: string, storagePath: string, datasetType: DatasetType): Promise<void>;
  removeDatasetIndex(datasetId: string): Promise<void>;
}

/**
 * Dataset service for managing lab datasets
 */
export class DatasetService {
  constructor(
    private readonly repository: DatasetRepository,
    private readonly permissionService: LabPermissionService,
    private readonly graphRAGIndexer?: GraphRAGIndexer
  ) {}

  /**
   * Create a new dataset
   */
  async createDataset(input: CreateDatasetInput, userId: string): Promise<LabDataset> {
    // Check permission
    const hasAccess = await this.permissionService.checkPermission(input.labId, userId, 'member');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    // Get lab settings
    const labSettings = await this.permissionService.getLabSettings(input.labId);
    if (!labSettings) {
      throw new Error('Lab not found');
    }

    // Check storage limit
    const currentUsage = await this.repository.getLabStorageUsage(input.labId);
    const maxStorageBytes = labSettings.maxStorageGb * 1024 * 1024 * 1024;
    if (currentUsage + input.sizeBytes > maxStorageBytes) {
      throw new Error(`Storage limit exceeded. Current: ${(currentUsage / 1024 / 1024 / 1024).toFixed(2)} GB, Max: ${labSettings.maxStorageGb} GB`);
    }

    // Check if public visibility requires approval
    const visibility = input.visibility ?? labSettings.defaultVisibility;
    if (visibility === 'public' && labSettings.requireApprovalForPublic) {
      // For MVP, we'll just use 'lab' visibility instead
      // In future, implement approval workflow
    }

    const now = new Date();
    const dataset: LabDataset = {
      id: randomUUID(),
      labId: input.labId,
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      visibility,
      schema: input.schema ?? null,
      storagePath: input.storagePath,
      sizeBytes: input.sizeBytes,
      rowCount: input.rowCount ?? null,
      isIndexed: false,
      tags: input.tags ?? [],
      version: 1,
      parentId: null,
      customFields: input.customFields ?? {},
      createdById: userId,
      createdAt: now,
      updatedAt: now,
    };

    const createdDataset = await this.repository.createDataset(dataset);

    // Trigger GraphRAG indexing if enabled
    if (labSettings.enableGraphRAG && this.graphRAGIndexer) {
      // Index asynchronously - don't block the response
      this.graphRAGIndexer
        .indexDataset(createdDataset.id, createdDataset.storagePath, createdDataset.type)
        .then(async () => {
          await this.repository.updateDataset(createdDataset.id, { isIndexed: true });
        })
        .catch((error) => {
          console.error(`Failed to index dataset ${createdDataset.id}:`, error);
        });
    }

    return createdDataset;
  }

  /**
   * Get a dataset by ID
   */
  async getDataset(id: string, userId: string): Promise<LabDataset | null> {
    const dataset = await this.repository.getDataset(id);
    if (!dataset) {
      return null;
    }

    // Check visibility
    if (dataset.visibility === 'public') {
      return dataset;
    }

    // Check permission
    const hasAccess = await this.permissionService.checkPermission(dataset.labId, userId, 'viewer');
    if (!hasAccess.allowed) {
      if (dataset.visibility === 'private' && dataset.createdById !== userId) {
        return null;
      }
      return null;
    }

    return dataset;
  }

  /**
   * Update a dataset
   */
  async updateDataset(id: string, input: UpdateDatasetInput, userId: string): Promise<LabDataset | null> {
    const dataset = await this.repository.getDataset(id);
    if (!dataset) {
      return null;
    }

    // Check permission - creator or admin can update
    const hasAccess = await this.permissionService.checkPermission(dataset.labId, userId, 'member');
    if (!hasAccess.allowed && dataset.createdById !== userId) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    const updates: Partial<LabDataset> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.visibility !== undefined) updates.visibility = input.visibility;
    if (input.schema !== undefined) updates.schema = input.schema;
    if (input.sizeBytes !== undefined) updates.sizeBytes = input.sizeBytes;
    if (input.rowCount !== undefined) updates.rowCount = input.rowCount;
    if (input.isIndexed !== undefined) updates.isIndexed = input.isIndexed;
    if (input.tags !== undefined) updates.tags = input.tags;
    if (input.customFields !== undefined) updates.customFields = input.customFields;

    return this.repository.updateDataset(id, updates);
  }

  /**
   * Delete a dataset
   */
  async deleteDataset(id: string, userId: string): Promise<boolean> {
    const dataset = await this.repository.getDataset(id);
    if (!dataset) {
      return false;
    }

    // Check permission - creator or admin can delete
    const hasAccess = await this.permissionService.checkPermission(dataset.labId, userId, 'admin');
    if (!hasAccess.allowed && dataset.createdById !== userId) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    // Remove from GraphRAG index
    if (dataset.isIndexed && this.graphRAGIndexer) {
      try {
        await this.graphRAGIndexer.removeDatasetIndex(id);
      } catch (error) {
        console.error(`Failed to remove dataset ${id} from index:`, error);
      }
    }

    return this.repository.deleteDataset(id);
  }

  /**
   * List datasets in a lab
   */
  async listDatasets(options: ListDatasetsOptions, userId: string): Promise<DatasetWithCreator[]> {
    const hasAccess = await this.permissionService.checkPermission(options.labId, userId, 'viewer');
    
    if (!hasAccess.allowed) {
      // Return only public datasets
      return this.repository.listDatasets({
        ...options,
        visibility: 'public',
      });
    }

    return this.repository.listDatasets(options);
  }

  /**
   * Create a new version of a dataset
   */
  async createDatasetVersion(
    parentId: string,
    input: Omit<CreateDatasetInput, 'labId'>,
    userId: string
  ): Promise<LabDataset> {
    const parentDataset = await this.repository.getDataset(parentId);
    if (!parentDataset) {
      throw new Error('Parent dataset not found');
    }

    // Check permission
    const hasAccess = await this.permissionService.checkPermission(parentDataset.labId, userId, 'member');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    const now = new Date();
    const newVersion = parentDataset.version + 1;

    const dataset: LabDataset = {
      id: randomUUID(),
      labId: parentDataset.labId,
      name: input.name,
      description: input.description ?? parentDataset.description,
      type: input.type,
      visibility: input.visibility ?? parentDataset.visibility,
      schema: input.schema ?? parentDataset.schema,
      storagePath: input.storagePath,
      sizeBytes: input.sizeBytes,
      rowCount: input.rowCount ?? null,
      isIndexed: false,
      tags: input.tags ?? parentDataset.tags,
      version: newVersion,
      parentId,
      customFields: input.customFields ?? parentDataset.customFields,
      createdById: userId,
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.createDataset(dataset);
  }

  /**
   * Get all versions of a dataset
   */
  async getDatasetVersions(datasetId: string, userId: string): Promise<LabDataset[]> {
    const dataset = await this.repository.getDataset(datasetId);
    if (!dataset) {
      return [];
    }

    const hasAccess = await this.permissionService.checkPermission(dataset.labId, userId, 'viewer');
    if (!hasAccess.allowed) {
      return [];
    }

    return this.repository.getDatasetVersions(datasetId);
  }

  /**
   * Trigger GraphRAG indexing for a dataset
   */
  async indexDataset(id: string, userId: string): Promise<void> {
    const dataset = await this.repository.getDataset(id);
    if (!dataset) {
      throw new Error('Dataset not found');
    }

    const hasAccess = await this.permissionService.checkPermission(dataset.labId, userId, 'member');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    const labSettings = await this.permissionService.getLabSettings(dataset.labId);
    if (!labSettings?.enableGraphRAG) {
      throw new Error('GraphRAG is not enabled for this lab');
    }

    if (!this.graphRAGIndexer) {
      throw new Error('GraphRAG indexer not configured');
    }

    await this.graphRAGIndexer.indexDataset(dataset.id, dataset.storagePath, dataset.type);
    await this.repository.updateDataset(id, { isIndexed: true, updatedAt: new Date() });
  }

  /**
   * Get storage usage for a lab
   */
  async getStorageUsage(labId: string, userId: string): Promise<{ usedBytes: number; maxBytes: number; percentage: number }> {
    const hasAccess = await this.permissionService.checkPermission(labId, userId, 'viewer');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    const labSettings = await this.permissionService.getLabSettings(labId);
    if (!labSettings) {
      throw new Error('Lab not found');
    }

    const usedBytes = await this.repository.getLabStorageUsage(labId);
    const maxBytes = labSettings.maxStorageGb * 1024 * 1024 * 1024;

    return {
      usedBytes,
      maxBytes,
      percentage: (usedBytes / maxBytes) * 100,
    };
  }
}
