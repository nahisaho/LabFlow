/**
 * RAGService Tests
 *
 * KNOW-GRAG-001: GraphRAG integration
 * KNOW-GRAG-002: Entity extraction
 * KNOW-GRAG-003: Relation extraction
 * Test-first approach (Article III)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RAGService } from '../../src/knowledge/rag-service.js';
import { KnowledgeBase } from '../../src/knowledge/knowledge-base.js';
import type {
  RAGContext,
  SearchResult,
  KnowledgeDocument,
  DocumentChunk,
  KnowledgeBaseConfig,
} from '../../src/knowledge/types.js';

describe('RAGService', () => {
  let ragService: RAGService;
  let knowledgeBase: KnowledgeBase;

  const kbConfig: KnowledgeBaseConfig = {
    embedding: {
      model: 'text-embedding-ada-002',
      dimensions: 1536,
      maxTokens: 8192,
    },
    vectorStore: {
      type: 'memory',
      collectionName: 'test',
    },
    chunkSize: 1000,
    chunkOverlap: 200,
  };

  beforeEach(() => {
    knowledgeBase = new KnowledgeBase(kbConfig);
    ragService = new RAGService(knowledgeBase, 4000);
  });

  describe('constructor', () => {
    it('should create instance with knowledge base', () => {
      expect(ragService).toBeInstanceOf(RAGService);
    });

    it('should accept different maxContextTokens', () => {
      const customService = new RAGService(knowledgeBase, 8000);
      expect(customService).toBeInstanceOf(RAGService);
    });
  });

  describe('generateEmbedding', () => {
    it('should generate embedding vector for text', async () => {
      const text = 'This is a test sentence for embedding.';
      const embedding = await ragService.generateEmbedding(text);

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
      expect(embedding.every(n => typeof n === 'number')).toBe(true);
    });

    it('should generate consistent embeddings for same text', async () => {
      const text = 'Consistent embedding test.';
      const embedding1 = await ragService.generateEmbedding(text);
      const embedding2 = await ragService.generateEmbedding(text);

      expect(embedding1).toEqual(embedding2);
    });

    it('should throw error for empty text', async () => {
      await expect(ragService.generateEmbedding('')).rejects.toThrow(
        'Text cannot be empty'
      );
    });

    it('should truncate text exceeding max tokens', async () => {
      const longText = 'A'.repeat(50000);
      // Should not throw, but truncate
      const embedding = await ragService.generateEmbedding(longText);
      expect(Array.isArray(embedding)).toBe(true);
    });
  });

  describe('generateEmbeddingBatch', () => {
    it('should generate embeddings for multiple texts', async () => {
      const texts = [
        'First sentence.',
        'Second sentence.',
        'Third sentence.',
      ];

      const embeddings = await ragService.generateEmbeddingBatch(texts);

      expect(embeddings.length).toBe(3);
      embeddings.forEach(embedding => {
        expect(Array.isArray(embedding)).toBe(true);
        expect(embedding.length).toBeGreaterThan(0);
      });
    });

    it('should return empty array for empty input', async () => {
      const embeddings = await ragService.generateEmbeddingBatch([]);
      expect(embeddings).toEqual([]);
    });
  });

  describe('computeSimilarity', () => {
    it('should compute cosine similarity between vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0, 0];
      const similarity = ragService.computeSimilarity(vec1, vec2);

      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [0, 1, 0];
      const similarity = ragService.computeSimilarity(vec1, vec2);

      expect(similarity).toBeCloseTo(0, 5);
    });

    it('should return -1 for opposite vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [-1, 0, 0];
      const similarity = ragService.computeSimilarity(vec1, vec2);

      expect(similarity).toBeCloseTo(-1, 5);
    });

    it('should throw error for vectors of different dimensions', () => {
      const vec1 = [1, 0];
      const vec2 = [1, 0, 0];

      expect(() => ragService.computeSimilarity(vec1, vec2)).toThrow(
        'Vectors must have same dimensions'
      );
    });
  });

  describe('buildContext', () => {
    it('should build RAG context from knowledge base search', async () => {
      // Add documents to knowledge base first
      await knowledgeBase.addDocument({
        title: 'ML Basics',
        type: 'paper',
        content: 'Machine learning is a subset of artificial intelligence.',
        metadata: {},
      });

      await knowledgeBase.addDocument({
        title: 'AI Overview',
        type: 'paper',
        content: 'AI enables computers to learn patterns from data.',
        metadata: {},
      });

      const query = 'machine learning';
      const context = await ragService.buildContext(query);

      expect(context.query).toBe(query);
      expect(context.results.length).toBeGreaterThan(0);
      expect(context.combinedContext).toBeDefined();
      expect(context.tokenCount).toBeGreaterThan(0);
    });

    it('should respect max context tokens', async () => {
      // Add many documents to test token limit
      for (let i = 0; i < 20; i++) {
        await knowledgeBase.addDocument({
          title: `Doc ${i}`,
          type: 'paper',
          content: `Content for document ${i}. `.repeat(100),
          metadata: {},
        });
      }

      const context = await ragService.buildContext('document content');

      expect(context.tokenCount).toBeLessThanOrEqual(4000);
    });

    it('should handle empty search results', async () => {
      // Empty knowledge base, high threshold
      const context = await ragService.buildContext('xyz123nonexistent', { threshold: 0.99 });

      expect(context.results).toEqual([]);
      expect(context.combinedContext).toBe('');
      expect(context.tokenCount).toBe(0);
    });
  });

  describe('extractEntities', () => {
    it('should extract scientific entities from text (KNOW-GRAG-002)', async () => {
      const text = `The compound Aspirin (acetylsalicylic acid) inhibits COX-2 enzyme.
      The study by Smith et al. (2023) showed promising results.`;

      const entities = await ragService.extractEntities(text);

      expect(entities.length).toBeGreaterThan(0);
      expect(entities.some(e => e.type === 'compound')).toBe(true);
      expect(entities.some(e => e.type === 'protein')).toBe(true);
    });

    it('should extract entity types: compound, protein, disease, author', async () => {
      const text = `COX-2 enzyme is a target for anti-inflammatory drugs.
      Breast cancer is treated with Tamoxifen. Research by Johnson (2024).`;

      const entities = await ragService.extractEntities(text);

      const types = entities.map(e => e.type);
      expect(types).toContain('disease');
      expect(types).toContain('compound');
      expect(types).toContain('author');
    });

    it('should include entity positions', async () => {
      const text = 'Aspirin is a common drug.';
      const entities = await ragService.extractEntities(text);

      const aspirin = entities.find(e => e.name === 'Aspirin');
      expect(aspirin?.position).toBeDefined();
      expect(aspirin?.position?.start).toBe(0);
      expect(aspirin?.position?.end).toBe(7);
    });
  });

  describe('extractRelations', () => {
    it('should extract relations between entities (KNOW-GRAG-003)', async () => {
      const text = 'Aspirin inhibits COX-2 enzyme in inflammatory pathways.';
      const entities = await ragService.extractEntities(text);
      const relations = await ragService.extractRelations(text, entities);

      expect(relations.length).toBeGreaterThan(0);
      expect(relations[0]).toHaveProperty('source');
      expect(relations[0]).toHaveProperty('target');
      expect(relations[0]).toHaveProperty('type');
    });

    it('should identify relation types', async () => {
      const text = `BRCA1 is associated with breast cancer.
      Metformin treats diabetes.
      Drug X binds to protein Y.`;

      const entities = await ragService.extractEntities(text);
      const relations = await ragService.extractRelations(text, entities);

      const relationTypes = relations.map(r => r.type);
      expect(relationTypes.some(t => ['associates', 'treats', 'binds'].includes(t))).toBe(true);
    });
  });

  describe('query', () => {
    it('should perform RAG query with context', async () => {
      // Setup mock knowledge base results
      const mockResults: SearchResult[] = [
        {
          chunk: {
            id: 'chunk-1',
            documentId: 'doc-1',
            content: 'The protein structure was determined using X-ray crystallography.',
            metadata: { position: 0, charStart: 0, charEnd: 65 },
          },
          document: {
            id: 'doc-1',
            title: 'Protein Structure Analysis',
            type: 'paper',
            content: 'Full content',
            metadata: {},
            status: 'indexed',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          score: 0.92,
        },
      ];

      const response = await ragService.query(
        'How was the protein structure determined?',
        mockResults
      );

      expect(response.answer).toBeDefined();
      expect(response.sources).toBeDefined();
      expect(response.sources.length).toBeGreaterThan(0);
      expect(response.confidence).toBeGreaterThanOrEqual(0);
      expect(response.confidence).toBeLessThanOrEqual(1);
    });

    it('should return citations with answer', async () => {
      const mockResults: SearchResult[] = [
        {
          chunk: {
            id: 'chunk-1',
            documentId: 'doc-1',
            content: 'Key finding from the research.',
            metadata: { position: 0, charStart: 0, charEnd: 30 },
          },
          document: {
            id: 'doc-1',
            title: 'Research Paper',
            type: 'paper',
            content: 'Full content',
            metadata: { authors: ['Smith, J.'], doi: '10.1234/test' },
            status: 'indexed',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          score: 0.9,
        },
      ];

      const response = await ragService.query('What was the key finding?', mockResults);

      expect(response.sources[0].documentId).toBe('doc-1');
      expect(response.sources[0].title).toBe('Research Paper');
    });

    it('should handle no relevant results gracefully', async () => {
      const response = await ragService.query('Unrelated query', []);

      expect(response.answer).toBeDefined();
      expect(response.confidence).toBeLessThan(0.5);
      expect(response.sources).toEqual([]);
    });
  });

  describe('rerank', () => {
    it('should rerank results by relevance', async () => {
      const query = 'machine learning algorithms';
      const results: SearchResult[] = [
        {
          chunk: {
            id: 'c1',
            documentId: 'd1',
            content: 'Neural networks are powerful.',
            metadata: { position: 0, charStart: 0, charEnd: 30 },
          },
          document: {
            id: 'd1',
            title: 'Deep Learning',
            type: 'paper',
            content: '',
            metadata: {},
            status: 'indexed',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          score: 0.7,
        },
        {
          chunk: {
            id: 'c2',
            documentId: 'd2',
            content: 'Machine learning algorithms include decision trees and random forests.',
            metadata: { position: 0, charStart: 0, charEnd: 70 },
          },
          document: {
            id: 'd2',
            title: 'ML Algorithms',
            type: 'paper',
            content: '',
            metadata: {},
            status: 'indexed',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          score: 0.6,
        },
      ];

      const reranked = await ragService.rerank(query, results);

      // More relevant result should be ranked higher
      expect(reranked[0].chunk.id).toBe('c2');
      expect(reranked[0].score).toBeGreaterThan(results[1].score);
    });
  });

  describe('summarize', () => {
    it('should generate summary of search results', async () => {
      const results: SearchResult[] = [
        {
          chunk: {
            id: 'c1',
            documentId: 'd1',
            content: 'First key point about the topic.',
            metadata: { position: 0, charStart: 0, charEnd: 35 },
          },
          document: {
            id: 'd1',
            title: 'Source 1',
            type: 'paper',
            content: '',
            metadata: {},
            status: 'indexed',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          score: 0.9,
        },
        {
          chunk: {
            id: 'c2',
            documentId: 'd2',
            content: 'Second important finding.',
            metadata: { position: 0, charStart: 0, charEnd: 25 },
          },
          document: {
            id: 'd2',
            title: 'Source 2',
            type: 'paper',
            content: '',
            metadata: {},
            status: 'indexed',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          score: 0.85,
        },
      ];

      const summary = await ragService.summarize(results);

      expect(summary.text).toBeDefined();
      expect(summary.text.length).toBeGreaterThan(0);
      expect(summary.sourceCount).toBe(2);
    });
  });
});
