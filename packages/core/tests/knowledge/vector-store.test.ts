/**
 * Vector Store Tests
 *
 * Tests for vector store implementations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryVectorStore,
  createVectorStore,
  type VectorStore,
  type VectorDocument,
} from '../../src/knowledge/vector-store.js';
import { MockEmbeddingProvider } from '../../src/knowledge/embedding-provider.js';

describe('VectorStore', () => {
  describe('createVectorStore', () => {
    it('should create InMemoryVectorStore for memory type', () => {
      const store = createVectorStore({ type: 'memory' });
      expect(store).toBeInstanceOf(InMemoryVectorStore);
    });

    it('should throw error for unsupported store type', () => {
      expect(() =>
        createVectorStore({ type: 'unsupported' as 'memory' })
      ).toThrow('Unsupported vector store type');
    });
  });

  describe('InMemoryVectorStore', () => {
    let store: VectorStore;
    let embeddingProvider: MockEmbeddingProvider;

    beforeEach(() => {
      embeddingProvider = new MockEmbeddingProvider({
        type: 'mock',
        dimensions: 384,
      });
      store = new InMemoryVectorStore();
    });

    describe('addDocument', () => {
      it('should add a document with embedding', async () => {
        const embedding = await embeddingProvider.generateEmbedding('test content');
        
        await store.addDocument({
          id: 'doc-1',
          content: 'test content',
          embedding: embedding.embedding,
          metadata: { source: 'test' },
        });

        const doc = await store.getDocument('doc-1');
        expect(doc).not.toBeNull();
        expect(doc?.content).toBe('test content');
      });

      it('should overwrite existing document with same id', async () => {
        const emb1 = await embeddingProvider.generateEmbedding('content 1');
        const emb2 = await embeddingProvider.generateEmbedding('content 2');

        await store.addDocument({
          id: 'doc-1',
          content: 'content 1',
          embedding: emb1.embedding,
          metadata: {},
        });

        await store.addDocument({
          id: 'doc-1',
          content: 'content 2',
          embedding: emb2.embedding,
          metadata: {},
        });

        const doc = await store.getDocument('doc-1');
        expect(doc?.content).toBe('content 2');
      });
    });

    describe('addDocuments', () => {
      it('should add multiple documents in batch', async () => {
        const docs: VectorDocument[] = [];
        for (let i = 0; i < 5; i++) {
          const emb = await embeddingProvider.generateEmbedding(`content ${i}`);
          docs.push({
            id: `doc-${i}`,
            content: `content ${i}`,
            embedding: emb.embedding,
            metadata: { index: i },
          });
        }

        await store.addDocuments(docs);

        const stats = await store.getStats();
        expect(stats.documentCount).toBe(5);
      });
    });

    describe('getDocument', () => {
      it('should return document by id', async () => {
        const emb = await embeddingProvider.generateEmbedding('test');
        await store.addDocument({
          id: 'doc-1',
          content: 'test',
          embedding: emb.embedding,
          metadata: { key: 'value' },
        });

        const doc = await store.getDocument('doc-1');

        expect(doc).not.toBeNull();
        expect(doc?.id).toBe('doc-1');
        expect(doc?.metadata.key).toBe('value');
      });

      it('should return null for non-existent document', async () => {
        const doc = await store.getDocument('non-existent');
        expect(doc).toBeNull();
      });
    });

    describe('deleteDocument', () => {
      it('should delete document by id', async () => {
        const emb = await embeddingProvider.generateEmbedding('test');
        await store.addDocument({
          id: 'doc-1',
          content: 'test',
          embedding: emb.embedding,
          metadata: {},
        });

        await store.deleteDocument('doc-1');

        const doc = await store.getDocument('doc-1');
        expect(doc).toBeNull();
      });

      it('should not throw when deleting non-existent document', async () => {
        await expect(store.deleteDocument('non-existent')).resolves.not.toThrow();
      });
    });

    describe('search', () => {
      beforeEach(async () => {
        // Add test documents
        const texts = [
          'machine learning algorithms',
          'deep neural networks',
          'cooking recipes for pasta',
          'natural language processing',
          'gardening tips and tricks',
        ];

        for (let i = 0; i < texts.length; i++) {
          const emb = await embeddingProvider.generateEmbedding(texts[i]);
          await store.addDocument({
            id: `doc-${i}`,
            content: texts[i],
            embedding: emb.embedding,
            metadata: { index: i },
          });
        }
      });

      it('should return similar documents', async () => {
        const queryEmb = await embeddingProvider.generateEmbedding(
          'artificial intelligence'
        );

        const results = await store.search({
          embedding: queryEmb.embedding,
          limit: 3,
        });

        expect(results.length).toBeLessThanOrEqual(3);
        expect(results.length).toBeGreaterThan(0);
      });

      it('should respect limit parameter', async () => {
        const queryEmb = await embeddingProvider.generateEmbedding('test');

        const results = await store.search({
          embedding: queryEmb.embedding,
          limit: 2,
        });

        expect(results.length).toBeLessThanOrEqual(2);
      });

      it('should filter by threshold', async () => {
        const queryEmb = await embeddingProvider.generateEmbedding('test');

        const highThreshold = await store.search({
          embedding: queryEmb.embedding,
          limit: 10,
          threshold: 0.99,
        });

        const lowThreshold = await store.search({
          embedding: queryEmb.embedding,
          limit: 10,
          threshold: 0.0,
        });

        expect(highThreshold.length).toBeLessThanOrEqual(lowThreshold.length);
      });

      it('should return results sorted by score descending', async () => {
        const queryEmb = await embeddingProvider.generateEmbedding('machine learning');

        const results = await store.search({
          embedding: queryEmb.embedding,
          limit: 5,
        });

        for (let i = 1; i < results.length; i++) {
          expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
        }
      });

      it('should include document content and metadata in results', async () => {
        const queryEmb = await embeddingProvider.generateEmbedding('test');

        const results = await store.search({
          embedding: queryEmb.embedding,
          limit: 1,
        });

        expect(results[0]).toHaveProperty('id');
        expect(results[0]).toHaveProperty('content');
        expect(results[0]).toHaveProperty('score');
        expect(results[0]).toHaveProperty('metadata');
      });

      it('should filter by metadata', async () => {
        const queryEmb = await embeddingProvider.generateEmbedding('test');

        const results = await store.search({
          embedding: queryEmb.embedding,
          limit: 10,
          filter: { index: 0 },
        });

        results.forEach((result) => {
          expect(result.metadata.index).toBe(0);
        });
      });
    });

    describe('clear', () => {
      it('should remove all documents', async () => {
        const emb = await embeddingProvider.generateEmbedding('test');
        await store.addDocument({
          id: 'doc-1',
          content: 'test',
          embedding: emb.embedding,
          metadata: {},
        });

        await store.clear();

        const stats = await store.getStats();
        expect(stats.documentCount).toBe(0);
      });
    });

    describe('getStats', () => {
      it('should return correct document count', async () => {
        const emb = await embeddingProvider.generateEmbedding('test');
        
        await store.addDocument({
          id: 'doc-1',
          content: 'test 1',
          embedding: emb.embedding,
          metadata: {},
        });
        await store.addDocument({
          id: 'doc-2',
          content: 'test 2',
          embedding: emb.embedding,
          metadata: {},
        });

        const stats = await store.getStats();
        expect(stats.documentCount).toBe(2);
      });

      it('should return embedding dimensions', async () => {
        const emb = await embeddingProvider.generateEmbedding('test');
        await store.addDocument({
          id: 'doc-1',
          content: 'test',
          embedding: emb.embedding,
          metadata: {},
        });

        const stats = await store.getStats();
        expect(stats.dimensions).toBe(384);
      });

      it('should return zero for empty store', async () => {
        const stats = await store.getStats();
        expect(stats.documentCount).toBe(0);
      });
    });

    describe('cosine similarity calculation', () => {
      it('should return 1.0 for identical vectors', async () => {
        const emb = await embeddingProvider.generateEmbedding('identical text');
        
        await store.addDocument({
          id: 'doc-1',
          content: 'identical text',
          embedding: emb.embedding,
          metadata: {},
        });

        const results = await store.search({
          embedding: emb.embedding,
          limit: 1,
        });

        expect(results[0].score).toBeCloseTo(1.0, 5);
      });

      it('should return higher scores for more similar content', async () => {
        // Use identical prefix to ensure mock embedding similarity
        const texts = ['test content A', 'test content B', 'different xyz'];
        
        for (let i = 0; i < texts.length; i++) {
          const emb = await embeddingProvider.generateEmbedding(texts[i]);
          await store.addDocument({
            id: `doc-${i}`,
            content: texts[i],
            embedding: emb.embedding,
            metadata: {},
          });
        }

        const queryEmb = await embeddingProvider.generateEmbedding('test content');
        const results = await store.search({
          embedding: queryEmb.embedding,
          limit: 3,
        });

        // Results should be sorted by score
        expect(results.length).toBe(3);
        expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
        expect(results[1].score).toBeGreaterThanOrEqual(results[2].score);
      });
    });
  });

  describe('Integration with EmbeddingProvider', () => {
    it('should work with different embedding dimensions', async () => {
      const provider768 = new MockEmbeddingProvider({
        type: 'mock',
        dimensions: 768,
      });
      const store = new InMemoryVectorStore();

      const emb = await provider768.generateEmbedding('test');
      await store.addDocument({
        id: 'doc-1',
        content: 'test',
        embedding: emb.embedding,
        metadata: {},
      });

      const stats = await store.getStats();
      expect(stats.dimensions).toBe(768);
    });

    it('should handle batch operations efficiently', async () => {
      const provider = new MockEmbeddingProvider({
        type: 'mock',
        dimensions: 384,
      });
      const store = new InMemoryVectorStore();

      const texts = Array.from({ length: 100 }, (_, i) => `document ${i}`);
      const embeddings = await provider.generateEmbeddingBatch(texts);

      const docs: VectorDocument[] = texts.map((text, i) => ({
        id: `doc-${i}`,
        content: text,
        embedding: embeddings[i].embedding,
        metadata: { index: i },
      }));

      const start = Date.now();
      await store.addDocuments(docs);
      const addTime = Date.now() - start;

      expect(addTime).toBeLessThan(1000); // Should be fast for 100 docs

      const queryEmb = await provider.generateEmbedding('document 50');
      const searchStart = Date.now();
      const results = await store.search({
        embedding: queryEmb.embedding,
        limit: 10,
      });
      const searchTime = Date.now() - searchStart;

      expect(searchTime).toBeLessThan(100); // Search should be fast
      expect(results.length).toBe(10);
    });
  });
});
