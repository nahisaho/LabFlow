/**
 * Semantic Search Service Tests
 *
 * Integration tests for semantic search with embedding providers and vector stores
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  SemanticSearchService,
  type SemanticSearchConfig,
} from '../../src/knowledge/semantic-search.js';
import { MockEmbeddingProvider } from '../../src/knowledge/embedding-provider.js';
import { InMemoryVectorStore } from '../../src/knowledge/vector-store.js';

describe('SemanticSearchService', () => {
  let service: SemanticSearchService;
  let embeddingProvider: MockEmbeddingProvider;
  let vectorStore: InMemoryVectorStore;

  beforeEach(() => {
    embeddingProvider = new MockEmbeddingProvider({
      type: 'mock',
      dimensions: 384,
    });
    vectorStore = new InMemoryVectorStore();
    service = new SemanticSearchService({
      embeddingProvider,
      vectorStore,
    });
  });

  describe('indexDocument', () => {
    it('should index a document with generated embedding', async () => {
      await service.indexDocument({
        id: 'doc-1',
        content: 'This is a test document about machine learning.',
        metadata: { source: 'test' },
      });

      const doc = await vectorStore.getDocument('doc-1');
      expect(doc).not.toBeNull();
      expect(doc?.embedding.length).toBe(384);
    });

    it('should index document with chunking for long content', async () => {
      const longContent = 'Paragraph one. '.repeat(100) + '\n\n' +
        'Paragraph two. '.repeat(100);

      await service.indexDocument({
        id: 'doc-long',
        content: longContent,
        metadata: { type: 'long' },
        chunkSize: 500,
        chunkOverlap: 50,
      });

      const stats = await vectorStore.getStats();
      expect(stats.documentCount).toBeGreaterThan(1);
    });

    it('should preserve metadata in indexed chunks', async () => {
      await service.indexDocument({
        id: 'doc-1',
        content: 'Test content',
        metadata: { author: 'Test Author', domain: 'science' },
      });

      const doc = await vectorStore.getDocument('doc-1');
      expect(doc?.metadata.author).toBe('Test Author');
      expect(doc?.metadata.domain).toBe('science');
    });
  });

  describe('indexDocuments', () => {
    it('should index multiple documents in batch', async () => {
      const docs = [
        { id: 'doc-1', content: 'Document one', metadata: {} },
        { id: 'doc-2', content: 'Document two', metadata: {} },
        { id: 'doc-3', content: 'Document three', metadata: {} },
      ];

      await service.indexDocuments(docs);

      const stats = await vectorStore.getStats();
      expect(stats.documentCount).toBe(3);
    });

    it('should generate embeddings in batch for efficiency', async () => {
      const batchSpy = vi.spyOn(embeddingProvider, 'generateEmbeddingBatch');

      const docs = Array.from({ length: 10 }, (_, i) => ({
        id: `doc-${i}`,
        content: `Document ${i}`,
        metadata: {},
      }));

      await service.indexDocuments(docs);

      expect(batchSpy).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      const docs = [
        { id: 'doc-1', content: 'Machine learning algorithms', metadata: { domain: 'ai' } },
        { id: 'doc-2', content: 'Deep neural networks', metadata: { domain: 'ai' } },
        { id: 'doc-3', content: 'Cooking recipes pasta', metadata: { domain: 'food' } },
        { id: 'doc-4', content: 'Natural language processing', metadata: { domain: 'ai' } },
        { id: 'doc-5', content: 'Gardening tips', metadata: { domain: 'home' } },
      ];

      await service.indexDocuments(docs);
    });

    it('should search for similar documents', async () => {
      const results = await service.search('artificial intelligence', { limit: 3 });

      expect(results.length).toBeLessThanOrEqual(3);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return results with scores', async () => {
      const results = await service.search('test query', { limit: 1 });

      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('content');
      expect(results[0]).toHaveProperty('score');
      expect(typeof results[0].score).toBe('number');
    });

    it('should filter by metadata', async () => {
      const results = await service.search('test', {
        limit: 10,
        filter: { domain: 'ai' },
      });

      results.forEach((result) => {
        expect(result.metadata.domain).toBe('ai');
      });
    });

    it('should respect threshold parameter', async () => {
      const highThreshold = await service.search('test', {
        limit: 10,
        threshold: 0.9,
      });

      const lowThreshold = await service.search('test', {
        limit: 10,
        threshold: 0.1,
      });

      expect(highThreshold.length).toBeLessThanOrEqual(lowThreshold.length);
    });

    it('should return empty array for no matches above threshold', async () => {
      const results = await service.search('xyz completely unrelated', {
        limit: 10,
        threshold: 0.99,
      });

      expect(results.length).toBe(0);
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document and its chunks', async () => {
      await service.indexDocument({
        id: 'doc-1',
        content: 'Test document',
        metadata: {},
      });

      await service.deleteDocument('doc-1');

      const doc = await vectorStore.getDocument('doc-1');
      expect(doc).toBeNull();
    });

    it('should delete all chunks for a chunked document', async () => {
      const longContent = 'Long content. '.repeat(200);
      
      await service.indexDocument({
        id: 'doc-chunked',
        content: longContent,
        metadata: {},
        chunkSize: 200,
      });

      const statsBefore = await vectorStore.getStats();
      expect(statsBefore.documentCount).toBeGreaterThan(1);

      await service.deleteDocument('doc-chunked');

      const statsAfter = await vectorStore.getStats();
      expect(statsAfter.documentCount).toBe(0);
    });
  });

  describe('updateDocument', () => {
    it('should update an existing document', async () => {
      await service.indexDocument({
        id: 'doc-1',
        content: 'Original content',
        metadata: { version: 1 },
      });

      await service.updateDocument({
        id: 'doc-1',
        content: 'Updated content',
        metadata: { version: 2 },
      });

      const doc = await vectorStore.getDocument('doc-1');
      expect(doc?.content).toBe('Updated content');
      expect(doc?.metadata.version).toBe(2);
    });

    it('should regenerate embedding on update', async () => {
      await service.indexDocument({
        id: 'doc-1',
        content: 'Original content',
        metadata: {},
      });

      const originalDoc = await vectorStore.getDocument('doc-1');
      const originalEmbedding = [...originalDoc!.embedding];

      await service.updateDocument({
        id: 'doc-1',
        content: 'Completely different content xyz',
        metadata: {},
      });

      const updatedDoc = await vectorStore.getDocument('doc-1');
      expect(updatedDoc?.embedding).not.toEqual(originalEmbedding);
    });
  });

  describe('buildContext', () => {
    beforeEach(async () => {
      const docs = [
        { id: 'doc-1', content: 'Context piece one about topic A.', metadata: {} },
        { id: 'doc-2', content: 'Context piece two about topic B.', metadata: {} },
        { id: 'doc-3', content: 'Context piece three about topic C.', metadata: {} },
      ];
      await service.indexDocuments(docs);
    });

    it('should build context string from search results', async () => {
      const context = await service.buildContext('test query', { limit: 3 });

      expect(context).toHaveProperty('context');
      expect(context).toHaveProperty('sources');
      expect(typeof context.context).toBe('string');
      expect(context.context.length).toBeGreaterThan(0);
    });

    it('should include source references', async () => {
      const context = await service.buildContext('test query', { limit: 3 });

      expect(context.sources.length).toBeGreaterThan(0);
      expect(context.sources[0]).toHaveProperty('id');
      expect(context.sources[0]).toHaveProperty('score');
    });

    it('should respect max tokens limit', async () => {
      const context = await service.buildContext('test query', {
        limit: 10,
        maxTokens: 50,
      });

      // Rough token estimate: 1 token ≈ 4 chars
      expect(context.context.length).toBeLessThan(250);
    });

    it('should format context with separators', async () => {
      const context = await service.buildContext('test query', { limit: 3 });

      // Should have some structure/separators between chunks
      expect(context.context).toContain('\n');
    });
  });

  describe('getStats', () => {
    it('should return search service statistics', async () => {
      await service.indexDocuments([
        { id: 'doc-1', content: 'Test 1', metadata: {} },
        { id: 'doc-2', content: 'Test 2', metadata: {} },
      ]);

      const stats = await service.getStats();

      expect(stats.documentCount).toBe(2);
      expect(stats.dimensions).toBe(384);
      expect(stats.providerType).toBe('mock');
    });
  });

  describe('isAvailable', () => {
    it('should check if embedding provider is available', async () => {
      const available = await service.isAvailable();
      expect(available).toBe(true);
    });
  });

  describe('Environment Configuration', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should work with development configuration (mock)', async () => {
      const devService = new SemanticSearchService({
        embeddingProvider: new MockEmbeddingProvider({
          type: 'mock',
          dimensions: 384,
        }),
        vectorStore: new InMemoryVectorStore(),
      });

      await devService.indexDocument({
        id: 'test',
        content: 'Test content',
        metadata: {},
      });

      const results = await devService.search('test', { limit: 1 });
      expect(results.length).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty content gracefully', async () => {
      await expect(
        service.indexDocument({
          id: 'empty',
          content: '',
          metadata: {},
        })
      ).rejects.toThrow('Content cannot be empty');
    });

    it('should handle search with empty query', async () => {
      await expect(
        service.search('', { limit: 10 })
      ).rejects.toThrow('Query cannot be empty');
    });
  });
});
