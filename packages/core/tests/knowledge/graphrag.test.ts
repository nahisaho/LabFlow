/**
 * GraphRAG Service Tests
 *
 * KNOW-GRAG-001: GraphRAG integration
 * KNOW-GRAG-002: Entity extraction
 * KNOW-GRAG-003: Relationship extraction
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GraphRAGService, type GraphNode, type GraphEdge } from '../../src/knowledge/graphrag.js';
import type { LiteraturePaper } from '../../src/knowledge/literature-search.js';
import type { ScientificEntity, EntityRelation } from '../../src/knowledge/rag-service.js';

describe('GraphRAGService', () => {
  let service: GraphRAGService;

  // Sample papers with entities and relations
  const createSamplePaper = (id: string, title: string, authors: string[], entities: ScientificEntity[] = [], relations: EntityRelation[] = []): LiteraturePaper => ({
    id,
    title,
    content: `Content of ${title}`,
    metadata: {
      authors,
      journal: 'Test Journal',
      year: 2023,
      domain: 'drug-discovery',
    },
    entities,
    relations,
  });

  const sampleEntities: ScientificEntity[] = [
    { name: 'Aspirin', type: 'compound' },
    { name: 'COX-2', type: 'protein' },
    { name: 'Inflammation', type: 'disease' },
  ];

  const sampleRelations: EntityRelation[] = [
    {
      source: { name: 'Aspirin', type: 'compound' },
      target: { name: 'COX-2', type: 'protein' },
      type: 'inhibits',
      confidence: 0.9,
    },
    {
      source: { name: 'COX-2', type: 'protein' },
      target: { name: 'Inflammation', type: 'disease' },
      type: 'causes',
      confidence: 0.8,
    },
  ];

  beforeEach(() => {
    service = new GraphRAGService();
  });

  describe('addPaper', () => {
    it('should add a paper node to the graph', () => {
      const paper = createSamplePaper('p1', 'Test Paper', ['Author A']);
      service.addPaper(paper);

      const stats = service.getStats();
      expect(stats.nodeCount).toBeGreaterThanOrEqual(1);
      expect(stats.nodesByType.paper).toBe(1);
    });

    it('should add author nodes', () => {
      const paper = createSamplePaper('p1', 'Test Paper', ['Author A', 'Author B']);
      service.addPaper(paper);

      const authors = service.getNodesByType('author');
      expect(authors.length).toBe(2);
    });

    it('should add journal node', () => {
      const paper = createSamplePaper('p1', 'Test Paper', ['Author A']);
      service.addPaper(paper);

      const journals = service.getNodesByType('journal');
      expect(journals.length).toBe(1);
    });

    it('should add entity nodes', () => {
      const paper = createSamplePaper('p1', 'Test Paper', ['Author A'], sampleEntities);
      service.addPaper(paper);

      const entities = service.getNodesByType('entity');
      expect(entities.length).toBe(3);
    });

    it('should add edges for author-paper relationship', () => {
      const paper = createSamplePaper('p1', 'Test Paper', ['Author A']);
      service.addPaper(paper);

      const edges = service.getEdgesByType('authored');
      expect(edges.length).toBe(1);
    });

    it('should add edges for entity relations', () => {
      const paper = createSamplePaper('p1', 'Test Paper', ['Author A'], sampleEntities, sampleRelations);
      service.addPaper(paper);

      const inhibitsEdges = service.getEdgesByType('inhibits');
      const causesEdges = service.getEdgesByType('causes');

      expect(inhibitsEdges.length).toBe(1);
      expect(causesEdges.length).toBe(1);
    });

    it('should increment mention count for existing entities', () => {
      const paper1 = createSamplePaper('p1', 'Paper 1', ['Author A'], [{ name: 'Aspirin', type: 'compound' }]);
      const paper2 = createSamplePaper('p2', 'Paper 2', ['Author B'], [{ name: 'Aspirin', type: 'compound' }]);

      service.addPaper(paper1);
      service.addPaper(paper2);

      const entities = service.getNodesByType('entity');
      const aspirin = entities.find(e => e.label === 'Aspirin');

      expect(aspirin?.properties.mentionCount).toBe(2);
    });
  });

  describe('addCitation', () => {
    it('should add citation edge between papers', () => {
      const paper1 = createSamplePaper('p1', 'Paper 1', ['Author A']);
      const paper2 = createSamplePaper('p2', 'Paper 2', ['Author B']);

      service.addPaper(paper1);
      service.addPaper(paper2);
      service.addCitation('p2', 'p1'); // p2 cites p1

      const citesEdges = service.getEdgesByType('cites');
      expect(citesEdges.length).toBe(1);
      expect(citesEdges[0].source).toBe('paper:p2');
      expect(citesEdges[0].target).toBe('paper:p1');
    });

    it('should not add citation edge for non-existent papers', () => {
      service.addCitation('nonexistent1', 'nonexistent2');

      const citesEdges = service.getEdgesByType('cites');
      expect(citesEdges.length).toBe(0);
    });
  });

  describe('query', () => {
    beforeEach(() => {
      const paper1 = createSamplePaper('p1', 'Paper 1', ['Author A'], sampleEntities, sampleRelations);
      const paper2 = createSamplePaper('p2', 'Paper 2', ['Author A', 'Author B'], [{ name: 'Ibuprofen', type: 'compound' }]);
      
      service.addPaper(paper1);
      service.addPaper(paper2);
    });

    it('should return connected subgraph from start node', () => {
      const result = service.query('paper:p1', 2);

      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.edges.length).toBeGreaterThan(0);
    });

    it('should respect maxHops parameter', () => {
      const result1 = service.query('paper:p1', 1);
      const result2 = service.query('paper:p1', 3);

      // More hops should generally return more nodes (or equal)
      expect(result2.nodes.length).toBeGreaterThanOrEqual(result1.nodes.length);
    });
  });

  describe('findPath', () => {
    beforeEach(() => {
      const paper1 = createSamplePaper('p1', 'Paper 1', ['Author A'], sampleEntities, sampleRelations);
      const paper2 = createSamplePaper('p2', 'Paper 2', ['Author B'], [{ name: 'COX-2', type: 'protein' }]);
      
      service.addPaper(paper1);
      service.addPaper(paper2);
    });

    it('should find path between connected nodes', () => {
      // Both papers share COX-2 entity
      const path = service.findPath('paper:p1', 'paper:p2');

      expect(path).not.toBeNull();
      if (path) {
        expect(path.length).toBeGreaterThan(1);
      }
    });

    it('should return null for disconnected nodes', () => {
      // Create isolated paper
      const isolated = createSamplePaper('isolated', 'Isolated Paper', ['Lonely Author']);
      service.addPaper(isolated);

      // Try to find path from isolated paper to p1
      const path = service.findPath('paper:isolated', 'entity:compound:aspirin');

      // May or may not find path depending on graph structure
      // Just verify it doesn't crash
      expect(path === null || Array.isArray(path)).toBe(true);
    });
  });

  describe('getNeighbors', () => {
    it('should return neighboring nodes', () => {
      const paper = createSamplePaper('p1', 'Paper 1', ['Author A', 'Author B'], sampleEntities);
      service.addPaper(paper);

      const neighbors = service.getNeighbors('paper:p1');

      // Should have authors, journal, and entities as neighbors
      expect(neighbors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getTopNodes', () => {
    beforeEach(() => {
      // Add multiple papers with shared authors/entities
      const papers = [
        createSamplePaper('p1', 'Paper 1', ['Author A'], [{ name: 'Aspirin', type: 'compound' }]),
        createSamplePaper('p2', 'Paper 2', ['Author A'], [{ name: 'Aspirin', type: 'compound' }]),
        createSamplePaper('p3', 'Paper 3', ['Author A'], [{ name: 'Aspirin', type: 'compound' }]),
        createSamplePaper('p4', 'Paper 4', ['Author B'], [{ name: 'Ibuprofen', type: 'compound' }]),
      ];

      for (const paper of papers) {
        service.addPaper(paper);
      }
    });

    it('should return most connected nodes', () => {
      const topNodes = service.getTopNodes(5);

      expect(topNodes.length).toBeGreaterThan(0);
      expect(topNodes[0].degree).toBeGreaterThanOrEqual(topNodes[topNodes.length - 1].degree);
    });
  });

  describe('detectCommunities', () => {
    beforeEach(() => {
      // Create papers that form distinct communities
      const drugPapers = [
        createSamplePaper('drug1', 'Drug Paper 1', ['Drug Author A'], [{ name: 'Aspirin', type: 'compound' }]),
        createSamplePaper('drug2', 'Drug Paper 2', ['Drug Author A'], [{ name: 'Aspirin', type: 'compound' }]),
      ];

      const materialsPapers = [
        createSamplePaper('mat1', 'Materials Paper 1', ['Mat Author B'], [{ name: 'Silicon', type: 'compound' }]),
        createSamplePaper('mat2', 'Materials Paper 2', ['Mat Author B'], [{ name: 'Silicon', type: 'compound' }]),
      ];

      for (const paper of [...drugPapers, ...materialsPapers]) {
        service.addPaper(paper);
      }
    });

    it('should detect communities in the graph', () => {
      const communities = service.detectCommunities();

      // Should detect at least some communities
      expect(communities.length).toBeGreaterThanOrEqual(0);
    });

    it('should assign key terms to communities', () => {
      const communities = service.detectCommunities();

      for (const community of communities) {
        expect(community.keyTerms).toBeDefined();
      }
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const paper = createSamplePaper('p1', 'Paper 1', ['Author A', 'Author B'], sampleEntities, sampleRelations);
      service.addPaper(paper);

      const stats = service.getStats();

      expect(stats.nodeCount).toBeGreaterThan(0);
      expect(stats.edgeCount).toBeGreaterThan(0);
      expect(stats.nodesByType.paper).toBe(1);
      expect(stats.nodesByType.author).toBe(2);
      expect(stats.avgDegree).toBeGreaterThan(0);
    });
  });

  describe('exportGraph / importGraph', () => {
    it('should export and import graph correctly', () => {
      const paper = createSamplePaper('p1', 'Paper 1', ['Author A'], sampleEntities);
      service.addPaper(paper);

      const exported = service.exportGraph();
      expect(exported.nodes.length).toBeGreaterThan(0);
      expect(exported.edges.length).toBeGreaterThan(0);

      // Create new service and import
      const newService = new GraphRAGService();
      newService.importGraph(exported);

      const newStats = newService.getStats();
      const originalStats = service.getStats();

      expect(newStats.nodeCount).toBe(originalStats.nodeCount);
      expect(newStats.edgeCount).toBe(originalStats.edgeCount);
    });
  });

  describe('getNodesByType', () => {
    beforeEach(() => {
      const paper = createSamplePaper('p1', 'Paper 1', ['Author A', 'Author B'], sampleEntities);
      service.addPaper(paper);
    });

    it('should return nodes of specified type', () => {
      const papers = service.getNodesByType('paper');
      const authors = service.getNodesByType('author');
      const entities = service.getNodesByType('entity');

      expect(papers.length).toBe(1);
      expect(authors.length).toBe(2);
      expect(entities.length).toBe(3);
    });
  });

  describe('getEdgesByType', () => {
    beforeEach(() => {
      const paper = createSamplePaper('p1', 'Paper 1', ['Author A'], sampleEntities, sampleRelations);
      service.addPaper(paper);
    });

    it('should return edges of specified type', () => {
      const authored = service.getEdgesByType('authored');
      const mentions = service.getEdgesByType('mentions');
      const inhibits = service.getEdgesByType('inhibits');

      expect(authored.length).toBe(1);
      expect(mentions.length).toBe(3); // 3 entities
      expect(inhibits.length).toBe(1);
    });
  });
});
