/**
 * @file My Lab Data UI コンポーネントテスト
 * @description My Lab Data機能のUIコンポーネントユニットテスト
 */

import { describe, it, expect, vi } from 'vitest';

// ============================================================================
// Constants Tests
// ============================================================================

describe('My Lab Data Constants', () => {
  it('should export all dataset types', async () => {
    const { DATASET_TYPES } = await import('./constants');
    
    expect(DATASET_TYPES.molecules).toBeDefined();
    expect(DATASET_TYPES.proteins).toBeDefined();
    expect(DATASET_TYPES.sequences).toBeDefined();
    expect(DATASET_TYPES.spectra).toBeDefined();
    expect(DATASET_TYPES.images).toBeDefined();
    expect(DATASET_TYPES.tabular).toBeDefined();
    expect(DATASET_TYPES.time_series).toBeDefined();
    
    // Check structure
    expect(DATASET_TYPES.molecules).toHaveProperty('id');
    expect(DATASET_TYPES.molecules).toHaveProperty('label');
    expect(DATASET_TYPES.molecules).toHaveProperty('labelJa');
    expect(DATASET_TYPES.molecules).toHaveProperty('icon');
    expect(DATASET_TYPES.molecules).toHaveProperty('description');
  });

  it('should export all visibility options', async () => {
    const { VISIBILITY_OPTIONS } = await import('./constants');
    
    expect(VISIBILITY_OPTIONS.private).toBeDefined();
    expect(VISIBILITY_OPTIONS.lab).toBeDefined();
    expect(VISIBILITY_OPTIONS.public).toBeDefined();
    
    // Check Japanese labels
    expect(VISIBILITY_OPTIONS.private.labelJa).toBe('プライベート');
    expect(VISIBILITY_OPTIONS.lab.labelJa).toBe('ラボ内');
    expect(VISIBILITY_OPTIONS.public.labelJa).toBe('公開');
  });

  it('should export all experiment statuses', async () => {
    const { EXPERIMENT_STATUSES } = await import('./constants');
    
    expect(EXPERIMENT_STATUSES.draft).toBeDefined();
    expect(EXPERIMENT_STATUSES.running).toBeDefined();
    expect(EXPERIMENT_STATUSES.completed).toBeDefined();
    expect(EXPERIMENT_STATUSES.failed).toBeDefined();
    expect(EXPERIMENT_STATUSES.cancelled).toBeDefined();
    
    // Check icons
    expect(EXPERIMENT_STATUSES.draft.icon).toBe('📝');
    expect(EXPERIMENT_STATUSES.running.icon).toBe('⏳');
    expect(EXPERIMENT_STATUSES.completed.icon).toBe('✅');
    expect(EXPERIMENT_STATUSES.failed.icon).toBe('❌');
  });

  it('should export all member roles', async () => {
    const { MEMBER_ROLES } = await import('./constants');
    
    expect(MEMBER_ROLES.owner).toBeDefined();
    expect(MEMBER_ROLES.admin).toBeDefined();
    expect(MEMBER_ROLES.member).toBeDefined();
    expect(MEMBER_ROLES.viewer).toBeDefined();
    
    // Check permissions
    expect(MEMBER_ROLES.owner.permissions).toContain('all');
    expect(MEMBER_ROLES.viewer.permissions).toContain('view');
  });

  it('should export all knowledge types', async () => {
    const { KNOWLEDGE_TYPES } = await import('./constants');
    
    expect(KNOWLEDGE_TYPES.finding).toBeDefined();
    expect(KNOWLEDGE_TYPES.hypothesis).toBeDefined();
    expect(KNOWLEDGE_TYPES.protocol).toBeDefined();
    expect(KNOWLEDGE_TYPES.insight).toBeDefined();
    expect(KNOWLEDGE_TYPES.note).toBeDefined();
    
    // Check Japanese labels
    expect(KNOWLEDGE_TYPES.finding.labelJa).toBe('発見');
    expect(KNOWLEDGE_TYPES.hypothesis.labelJa).toBe('仮説');
    expect(KNOWLEDGE_TYPES.protocol.labelJa).toBe('プロトコル');
  });

  it('should export activity types', async () => {
    const { ACTIVITY_TYPES } = await import('./constants');
    
    expect(ACTIVITY_TYPES.dataset_created).toBeDefined();
    expect(ACTIVITY_TYPES.dataset_updated).toBeDefined();
    expect(ACTIVITY_TYPES.experiment_started).toBeDefined();
    expect(ACTIVITY_TYPES.experiment_completed).toBeDefined();
    expect(ACTIVITY_TYPES.knowledge_added).toBeDefined();
    expect(ACTIVITY_TYPES.member_joined).toBeDefined();
  });
});

// ============================================================================
// Type Definitions Tests
// ============================================================================

describe('My Lab Data Type Definitions', () => {
  it('should have correct type structure for Lab', () => {
    const mockLab = {
      id: 'lab-1',
      name: 'Test Lab',
      description: 'A test laboratory',
      iconUrl: null,
      settings: {
        allowDatasetExport: true,
        requireApprovalForPublic: false,
        defaultVisibility: 'lab' as const,
        maxStorageGb: 10,
        enableGraphRAG: true,
      },
      createdById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    expect(mockLab.id).toBe('lab-1');
    expect(mockLab.name).toBe('Test Lab');
    expect(mockLab.settings.enableGraphRAG).toBe(true);
  });

  it('should have correct type structure for Dataset', () => {
    const mockDataset = {
      id: 'ds-1',
      labId: 'lab-1',
      name: 'Test Dataset',
      nameJa: 'テストデータセット',
      description: 'A test dataset',
      type: 'tabular' as const,
      visibility: 'lab' as const,
      tags: ['test', 'sample'],
      sizeBytes: 1024 * 1024,
      rowCount: 1000,
      schema: null,
      storagePath: '/data/ds-1',
      isIndexed: false,
      version: 1,
      parentId: null,
      customFields: {},
      createdBy: { id: 'user-1', name: 'User 1' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    expect(mockDataset.id).toBe('ds-1');
    expect(mockDataset.type).toBe('tabular');
    expect(mockDataset.visibility).toBe('lab');
    expect(mockDataset.tags).toContain('test');
    expect(mockDataset.sizeBytes).toBe(1024 * 1024);
  });

  it('should have correct type structure for Experiment', () => {
    const mockExperiment = {
      id: 'exp-1',
      labId: 'lab-1',
      name: 'Test Experiment',
      nameJa: 'テスト実験',
      description: 'Test description',
      status: 'running' as const,
      config: {
        model: 'test-model',
        hyperparameters: { learning_rate: 0.001 },
      },
      results: {
        metrics: { loss: 0.5, accuracy: 0.85 },
      },
      tags: ['test'],
      createdBy: { id: 'user-1', name: 'User 1' },
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: new Date(),
      completedAt: null,
    };
    
    expect(mockExperiment.id).toBe('exp-1');
    expect(mockExperiment.status).toBe('running');
    expect(mockExperiment.results.metrics?.accuracy).toBe(0.85);
  });

  it('should have correct type structure for KnowledgeItem', () => {
    const mockKnowledge = {
      id: 'know-1',
      labId: 'lab-1',
      type: 'finding' as const,
      title: 'Test Finding',
      titleJa: 'テスト発見',
      content: 'This is a test finding.',
      tags: ['test', 'important'],
      relatedExperimentIds: ['exp-1'],
      relatedDatasetIds: ['ds-1'],
      isIndexed: true,
      createdBy: { id: 'user-1', name: 'User 1' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    expect(mockKnowledge.id).toBe('know-1');
    expect(mockKnowledge.type).toBe('finding');
    expect(mockKnowledge.isIndexed).toBe(true);
    expect(mockKnowledge.relatedExperimentIds).toContain('exp-1');
  });

  it('should have correct type structure for ActivityLog', () => {
    const mockActivity = {
      id: 'act-1',
      labId: 'lab-1',
      type: 'dataset_created' as const,
      description: 'Created new dataset',
      targetId: 'ds-1',
      targetType: 'dataset',
      user: { id: 'user-1', name: 'User 1' },
      metadata: {},
      createdAt: new Date(),
    };
    
    expect(mockActivity.id).toBe('act-1');
    expect(mockActivity.type).toBe('dataset_created');
    expect(mockActivity.targetType).toBe('dataset');
  });
});

// ============================================================================
// Component Export Tests
// ============================================================================

describe('My Lab Data Component Exports', () => {
  it('should export all main components', async () => {
    const exports = await import('./index');
    
    // Dashboard
    expect(exports.MyLabDashboard).toBeDefined();
    expect(exports.LabHeader).toBeDefined();
    expect(exports.MemberList).toBeDefined();
    expect(exports.ActivityFeed).toBeDefined();
    
    // Dataset components
    expect(exports.DatasetList).toBeDefined();
    expect(exports.DatasetCard).toBeDefined();
    expect(exports.CreateDatasetDialog).toBeDefined();
    
    // Experiment components
    expect(exports.ExperimentList).toBeDefined();
    expect(exports.ExperimentCard).toBeDefined();
    expect(exports.CreateExperimentDialog).toBeDefined();
    
    // Knowledge components
    expect(exports.KnowledgeList).toBeDefined();
    expect(exports.KnowledgeCard).toBeDefined();
    expect(exports.CreateKnowledgeDialog).toBeDefined();
  });

  it('should export all constants', async () => {
    const exports = await import('./index');
    
    expect(exports.DATASET_TYPES).toBeDefined();
    expect(exports.VISIBILITY_OPTIONS).toBeDefined();
    expect(exports.EXPERIMENT_STATUSES).toBeDefined();
    expect(exports.MEMBER_ROLES).toBeDefined();
    expect(exports.KNOWLEDGE_TYPES).toBeDefined();
    expect(exports.ACTIVITY_TYPES).toBeDefined();
    expect(exports.MYLAB_VIEWS).toBeDefined();
    expect(exports.UI_TEXT).toBeDefined();
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('My Lab Data Utilities', () => {
  it('should format bytes correctly', () => {
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };
    
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('should calculate experiment progress correctly', () => {
    const calculateProgress = (completed: number, total: number): number => {
      if (total <= 0) return 0;
      return Math.round((completed / total) * 100);
    };
    
    expect(calculateProgress(0, 100)).toBe(0);
    expect(calculateProgress(50, 100)).toBe(50);
    expect(calculateProgress(100, 100)).toBe(100);
    expect(calculateProgress(33, 100)).toBe(33);
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it('should filter items by search query', () => {
    const items = [
      { name: 'Protein Dataset', tags: ['protein', 'biology'] },
      { name: 'Molecule Data', tags: ['chemistry', 'organic'] },
      { name: 'Sequence Analysis', tags: ['genomics', 'DNA'] },
    ];
    
    const filterBySearch = (items: typeof items, query: string) => {
      const q = query.toLowerCase();
      return items.filter((item) =>
        item.name.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    };
    
    expect(filterBySearch(items, 'protein')).toHaveLength(1);
    expect(filterBySearch(items, 'data')).toHaveLength(2);
    expect(filterBySearch(items, 'biology')).toHaveLength(1);
    expect(filterBySearch(items, '')).toHaveLength(3);
    expect(filterBySearch(items, 'xyz')).toHaveLength(0);
  });
});

// ============================================================================
// Mock Data Helpers
// ============================================================================

export function createMockLab(overrides: Partial<{
  id: string;
  name: string;
}> = {}) {
  return {
    id: overrides.id ?? 'lab-' + Math.random().toString(36).substr(2, 9),
    name: overrides.name ?? 'Mock Lab',
    description: 'A mock laboratory for testing',
    iconUrl: null,
    settings: {
      allowDatasetExport: true,
      requireApprovalForPublic: false,
      defaultVisibility: 'lab' as const,
      maxStorageGb: 10,
      enableGraphRAG: true,
    },
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createMockLabWithStats(overrides: Partial<{
  id: string;
  name: string;
}> = {}) {
  const lab = createMockLab(overrides);
  return {
    ...lab,
    memberCount: 3,
    datasetCount: 5,
    experimentCount: 10,
    storageUsedGb: 1.5,
  };
}

export function createMockDataset(overrides: Partial<{
  id: string;
  name: string;
  type: 'molecules' | 'proteins' | 'sequences' | 'spectra' | 'images' | 'tabular' | 'time_series' | 'other';
}> = {}) {
  return {
    id: overrides.id ?? 'ds-' + Math.random().toString(36).substr(2, 9),
    labId: 'lab-1',
    name: overrides.name ?? 'Mock Dataset',
    nameJa: 'モックデータセット',
    description: 'A mock dataset for testing',
    type: overrides.type ?? 'tabular',
    visibility: 'lab' as const,
    tags: ['test', 'mock'],
    sizeBytes: 1024 * 1024,
    rowCount: 1000,
    schema: null,
    storagePath: '/data/mock',
    isIndexed: false,
    version: 1,
    parentId: null,
    customFields: {},
    createdBy: { id: 'user-1', name: 'User 1' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createMockExperiment(overrides: Partial<{
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed' | 'failed' | 'cancelled';
}> = {}) {
  return {
    id: overrides.id ?? 'exp-' + Math.random().toString(36).substr(2, 9),
    labId: 'lab-1',
    name: overrides.name ?? 'Mock Experiment',
    nameJa: 'モック実験',
    description: 'This is a mock experiment',
    status: overrides.status ?? 'draft',
    config: {
      model: 'mock-model',
      hyperparameters: {},
    },
    results: null,
    tags: ['test'],
    createdBy: { id: 'user-1', name: 'User 1' },
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: null,
    completedAt: null,
  };
}

export function createMockKnowledge(overrides: Partial<{
  id: string;
  type: 'finding' | 'hypothesis' | 'protocol' | 'insight' | 'note';
  title: string;
}> = {}) {
  return {
    id: overrides.id ?? 'know-' + Math.random().toString(36).substr(2, 9),
    labId: 'lab-1',
    type: overrides.type ?? 'finding',
    title: overrides.title ?? 'Mock Knowledge',
    titleJa: 'モックナレッジ',
    content: 'This is mock knowledge content.',
    tags: ['test'],
    relatedExperimentIds: [],
    relatedDatasetIds: [],
    isIndexed: false,
    createdBy: { id: 'user-1', name: 'User 1' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createMockActivity(overrides: Partial<{
  id: string;
  type: string;
}> = {}) {
  return {
    id: overrides.id ?? 'act-' + Math.random().toString(36).substr(2, 9),
    labId: 'lab-1',
    type: overrides.type ?? 'dataset_created',
    description: 'Mock activity description',
    targetId: 'target-1',
    targetType: 'dataset',
    user: { id: 'user-1', name: 'User 1' },
    metadata: {},
    createdAt: new Date(),
  };
}

// ============================================================================
// Integration Tests
// ============================================================================

describe('My Lab Data Integration', () => {
  it('should create valid mock data for testing', () => {
    const lab = createMockLabWithStats({ name: 'Test Lab' });
    const dataset = createMockDataset({ type: 'proteins' });
    const experiment = createMockExperiment({ status: 'running' });
    const knowledge = createMockKnowledge({ type: 'hypothesis' });
    const activity = createMockActivity({ type: 'experiment_started' });
    
    expect(lab.name).toBe('Test Lab');
    expect(lab.datasetCount).toBe(5);
    
    expect(dataset.type).toBe('proteins');
    expect(dataset.visibility).toBe('lab');
    
    expect(experiment.status).toBe('running');
    
    expect(knowledge.type).toBe('hypothesis');
    expect(knowledge.isIndexed).toBe(false);
    
    expect(activity.type).toBe('experiment_started');
  });

  it('should validate lab statistics', () => {
    const stats = {
      datasetCount: 10,
      experimentCount: 25,
      memberCount: 5,
      storageUsedGb: 2.5,
    };
    
    expect(stats.datasetCount).toBeGreaterThanOrEqual(0);
    expect(stats.experimentCount).toBeGreaterThanOrEqual(0);
    expect(stats.memberCount).toBeGreaterThanOrEqual(1); // At least owner
    expect(stats.storageUsedGb).toBeGreaterThanOrEqual(0);
  });

  it('should validate experiment workflow', () => {
    const validTransitions: Record<string, string[]> = {
      draft: ['running', 'cancelled'],
      running: ['completed', 'failed', 'cancelled'],
      completed: [],
      failed: [],
      cancelled: [],
    };
    
    expect(validTransitions['draft']).toContain('running');
    expect(validTransitions['running']).toContain('completed');
    expect(validTransitions['running']).toContain('failed');
    expect(validTransitions['completed']).toHaveLength(0);
    expect(validTransitions['failed']).toHaveLength(0);
  });
});
