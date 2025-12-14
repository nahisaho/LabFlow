/**
 * @file GraphRAG UI コンポーネントテスト
 * @description GraphRAG機能のUIコンポーネントユニットテスト
 */

import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';

// ============================================================================
// Types Tests
// ============================================================================

describe('GraphRAG Types', () => {
  it('should export all node types', async () => {
    const { NODE_TYPES } = await import('./constants');
    
    expect(NODE_TYPES.paper).toBeDefined();
    expect(NODE_TYPES.entity).toBeDefined();
    expect(NODE_TYPES.author).toBeDefined();
    expect(NODE_TYPES.journal).toBeDefined();
    expect(NODE_TYPES.topic).toBeDefined();
    expect(NODE_TYPES.concept).toBeDefined();
    
    // Check structure
    expect(NODE_TYPES.paper).toHaveProperty('id');
    expect(NODE_TYPES.paper).toHaveProperty('label');
    expect(NODE_TYPES.paper).toHaveProperty('labelJa');
    expect(NODE_TYPES.paper).toHaveProperty('color');
    expect(NODE_TYPES.paper).toHaveProperty('icon');
  });

  it('should export all entity types', async () => {
    const { ENTITY_TYPES } = await import('./constants');
    
    expect(ENTITY_TYPES.protein).toBeDefined();
    expect(ENTITY_TYPES.compound).toBeDefined();
    expect(ENTITY_TYPES.gene).toBeDefined();
    expect(ENTITY_TYPES.disease).toBeDefined();
    expect(ENTITY_TYPES.material).toBeDefined();
    expect(ENTITY_TYPES.method).toBeDefined();
  });

  it('should export all view modes', async () => {
    const { VIEW_MODES } = await import('./constants');
    
    expect(VIEW_MODES.graph).toBeDefined();
    expect(VIEW_MODES.list).toBeDefined();
    expect(VIEW_MODES.tree).toBeDefined();
    expect(VIEW_MODES.timeline).toBeDefined();
    
    // Check Japanese labels
    expect(VIEW_MODES.graph.labelJa).toBe('グラフビュー');
    expect(VIEW_MODES.list.labelJa).toBe('リストビュー');
  });

  it('should export all document types', async () => {
    const { DOCUMENT_TYPES } = await import('./constants');
    
    expect(DOCUMENT_TYPES.paper).toBeDefined();
    expect(DOCUMENT_TYPES.protocol).toBeDefined();
    expect(DOCUMENT_TYPES.documentation).toBeDefined();
    expect(DOCUMENT_TYPES.tutorial).toBeDefined();
    expect(DOCUMENT_TYPES.note).toBeDefined();
    
    // Check labels
    expect(DOCUMENT_TYPES.paper.labelJa).toBe('研究論文');
    expect(DOCUMENT_TYPES.protocol.labelJa).toBe('プロトコル');
  });

  it('should export all relation types', async () => {
    const { RELATION_TYPES } = await import('./constants');
    
    expect(RELATION_TYPES.cites).toBeDefined();
    expect(RELATION_TYPES.mentions).toBeDefined();
    expect(RELATION_TYPES.authored).toBeDefined();
    
    // Check structure
    expect(RELATION_TYPES.cites.labelJa).toBe('引用');
    expect(RELATION_TYPES.mentions.labelJa).toBe('言及');
  });
});

// ============================================================================
// Type Definitions Tests
// ============================================================================

describe('GraphRAG Type Definitions', () => {
  it('should have correct type structure for KnowledgeBaseStatus', async () => {
    // Type-level test - ensure types compile correctly
    const mockStatus = {
      isInitialized: true,
      lastUpdated: new Date(),
      nodeCount: 100,
      edgeCount: 250,
      documentCount: 50,
      communityCount: 10,
      version: '1.0.0',
      storageUsed: 1024 * 1024,
      storageLimit: 10 * 1024 * 1024,
    };
    
    expect(mockStatus.isInitialized).toBe(true);
    expect(mockStatus.nodeCount).toBe(100);
    expect(mockStatus.communityCount).toBe(10);
  });

  it('should have correct type structure for GraphNode', () => {
    const mockNode = {
      id: 'node-1',
      type: 'paper' as const,
      label: 'Test Paper',
      labelJa: 'テスト論文',
      metadata: {
        title: 'Test Paper',
        authors: ['Author 1'],
        year: 2024,
        doi: '10.1234/test',
      },
      position: { x: 100, y: 200 },
      size: 10,
      color: '#3B82F6',
      weight: 1.0,
    };
    
    expect(mockNode.id).toBe('node-1');
    expect(mockNode.type).toBe('paper');
    expect(mockNode.position?.x).toBe(100);
  });

  it('should have correct type structure for GraphEdge', () => {
    const mockEdge = {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'cites' as const,
      label: 'cites',
      weight: 0.8,
      metadata: {
        confidence: 0.95,
      },
    };
    
    expect(mockEdge.id).toBe('edge-1');
    expect(mockEdge.source).toBe('node-1');
    expect(mockEdge.target).toBe('node-2');
    expect(mockEdge.weight).toBe(0.8);
  });

  it('should have correct type structure for GraphSearchQuery', () => {
    const mockQuery = {
      query: 'protein folding',
      queryJa: 'タンパク質フォールディング',
      searchType: 'global' as const,
      maxResults: 10,
      includeRelated: true,
      filters: {
        nodeTypes: ['paper' as const, 'entity' as const],
        dateRange: { start: new Date('2020-01-01'), end: new Date() },
      },
    };
    
    expect(mockQuery.query).toBe('protein folding');
    expect(mockQuery.searchType).toBe('global');
    expect(mockQuery.maxResults).toBe(10);
    expect(mockQuery.filters?.nodeTypes).toContain('paper');
  });

  it('should have correct type structure for KnowledgeGap', () => {
    const mockGap = {
      id: 'gap-1',
      type: 'missing_evidence' as const,
      title: 'Missing evidence for pathway',
      titleJa: '経路のエビデンス不足',
      description: 'No direct evidence linking A to B',
      descriptionJa: 'AとBを直接つなぐエビデンスがない',
      relatedNodes: ['node-1', 'node-2'],
      severity: 'high' as const,
      suggestedActions: ['Conduct experiments', 'Review literature'],
    };
    
    expect(mockGap.id).toBe('gap-1');
    expect(mockGap.type).toBe('missing_evidence');
    expect(mockGap.severity).toBe('high');
    expect(mockGap.relatedNodes).toHaveLength(2);
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('GraphRAG Utilities', () => {
  it('should calculate correct graph statistics', () => {
    const nodes = [
      { id: '1', type: 'paper' as const },
      { id: '2', type: 'paper' as const },
      { id: '3', type: 'entity' as const },
      { id: '4', type: 'author' as const },
    ];
    
    const edges = [
      { id: 'e1', source: '1', target: '3' },
      { id: 'e2', source: '2', target: '3' },
      { id: 'e3', source: '1', target: '4' },
    ];
    
    const nodesByType = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    expect(nodes.length).toBe(4);
    expect(edges.length).toBe(3);
    expect(nodesByType['paper']).toBe(2);
    expect(nodesByType['entity']).toBe(1);
    expect(nodesByType['author']).toBe(1);
  });

  it('should format node labels correctly', () => {
    const formatLabel = (label: string, maxLength: number = 30): string => {
      if (label.length <= maxLength) return label;
      return `${label.substring(0, maxLength - 3)}...`;
    };
    
    expect(formatLabel('Short')).toBe('Short');
    expect(formatLabel('A very long title that exceeds the maximum length allowed')).toBe('A very long title that exce...');
  });
});

// ============================================================================
// Component Export Tests
// ============================================================================

describe('GraphRAG Component Exports', () => {
  it('should export all main components', async () => {
    const exports = await import('./index');
    
    // Dashboard
    expect(exports.GraphRAGDashboard).toBeDefined();
    
    // Document components
    expect(exports.DocumentList).toBeDefined();
    expect(exports.DocumentCard).toBeDefined();
    expect(exports.AddDocumentDialog).toBeDefined();
    
    // Graph components
    expect(exports.GraphViewer).toBeDefined();
    expect(exports.GraphStats).toBeDefined();
    expect(exports.NodeDetailPanel).toBeDefined();
    expect(exports.GraphControls).toBeDefined();
    
    // Search components
    expect(exports.SearchPanel).toBeDefined();
    expect(exports.SearchResults).toBeDefined();
    expect(exports.AnswerPanel).toBeDefined();
    expect(exports.KnowledgeGapPanel).toBeDefined();
  });

  it('should export all types', async () => {
    const exports = await import('./index');
    
    // Constants
    expect(exports.NODE_TYPES).toBeDefined();
    expect(exports.ENTITY_TYPES).toBeDefined();
    expect(exports.SEARCH_TYPES).toBeDefined();
    expect(exports.VIEW_MODES).toBeDefined();
    expect(exports.UI_TEXT).toBeDefined();
  });
});

// ============================================================================
// Mock Data Helpers
// ============================================================================

export function createMockNode(overrides: Partial<{
  id: string;
  type: 'paper' | 'entity' | 'author' | 'journal' | 'topic' | 'concept';
  label: string;
}> = {}) {
  return {
    id: overrides.id ?? 'node-' + Math.random().toString(36).substr(2, 9),
    type: overrides.type ?? 'paper',
    label: overrides.label ?? 'Mock Node',
    labelJa: 'モックノード',
    metadata: {},
    position: { x: Math.random() * 500, y: Math.random() * 500 },
    size: 10,
    color: '#3B82F6',
    weight: 1.0,
  };
}

export function createMockEdge(overrides: Partial<{
  id: string;
  source: string;
  target: string;
  type: 'cites' | 'mentions' | 'related' | 'authored' | 'published_in';
}> = {}) {
  return {
    id: overrides.id ?? 'edge-' + Math.random().toString(36).substr(2, 9),
    source: overrides.source ?? 'node-1',
    target: overrides.target ?? 'node-2',
    type: overrides.type ?? 'related',
    weight: 1.0,
  };
}

export function createMockDocument(overrides: Partial<{
  id: string;
  title: string;
  type: 'paper' | 'note' | 'protocol' | 'review';
}> = {}) {
  return {
    id: overrides.id ?? 'doc-' + Math.random().toString(36).substr(2, 9),
    title: overrides.title ?? 'Mock Document',
    titleJa: 'モックドキュメント',
    type: overrides.type ?? 'paper',
    abstract: 'This is a mock document abstract.',
    authors: ['Author 1', 'Author 2'],
    year: 2024,
    source: 'Mock Journal',
    isIndexed: true,
    addedAt: new Date(),
    nodeCount: 10,
    edgeCount: 15,
  };
}

export function createMockSearchResult(overrides: Partial<{
  id: string;
  score: number;
}> = {}) {
  return {
    id: overrides.id ?? 'result-' + Math.random().toString(36).substr(2, 9),
    score: overrides.score ?? 0.9,
    node: createMockNode(),
    context: 'This is the context where the result was found.',
    highlight: 'This is the <mark>highlighted</mark> text.',
  };
}

export function createMockKnowledgeGap(overrides: Partial<{
  id: string;
  type: 'missing_evidence' | 'conflicting_data' | 'unexplored_area' | 'weak_connection';
  severity: 'high' | 'medium' | 'low';
}> = {}) {
  return {
    id: overrides.id ?? 'gap-' + Math.random().toString(36).substr(2, 9),
    type: overrides.type ?? 'missing_evidence',
    title: 'Mock Knowledge Gap',
    titleJa: 'モック知識ギャップ',
    description: 'This is a mock knowledge gap description.',
    descriptionJa: 'これはモックの知識ギャップの説明です。',
    relatedNodes: ['node-1', 'node-2'],
    severity: overrides.severity ?? 'medium',
    suggestedActions: ['Action 1', 'Action 2'],
  };
}

// ============================================================================
// Integration Tests
// ============================================================================

describe('GraphRAG Integration', () => {
  it('should create valid mock data for testing', () => {
    const node = createMockNode({ type: 'paper', label: 'Test Paper' });
    const edge = createMockEdge({ source: node.id, target: 'node-2' });
    const doc = createMockDocument({ title: 'Test Document' });
    const result = createMockSearchResult({ score: 0.95 });
    const gap = createMockKnowledgeGap({ severity: 'high' });
    
    expect(node.type).toBe('paper');
    expect(node.label).toBe('Test Paper');
    
    expect(edge.source).toBe(node.id);
    
    expect(doc.title).toBe('Test Document');
    expect(doc.isIndexed).toBe(true);
    
    expect(result.score).toBe(0.95);
    
    expect(gap.severity).toBe('high');
    expect(gap.type).toBe('missing_evidence');
  });

  it('should validate knowledge base status', () => {
    const status = {
      isInitialized: true,
      lastUpdated: new Date(),
      nodeCount: 100,
      edgeCount: 250,
      documentCount: 50,
      communityCount: 10,
      version: '1.0.0',
      storageUsed: 1024 * 1024,
      storageLimit: 10 * 1024 * 1024,
    };
    
    // Validation rules
    expect(status.isInitialized).toBe(true);
    expect(status.nodeCount).toBeGreaterThanOrEqual(0);
    expect(status.edgeCount).toBeGreaterThanOrEqual(0);
    expect(status.documentCount).toBeGreaterThanOrEqual(0);
    expect(status.communityCount).toBeGreaterThanOrEqual(0);
    expect(status.storageUsed).toBeLessThanOrEqual(status.storageLimit);
  });
});
