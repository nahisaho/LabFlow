/**
 * KnowledgeBase Tests
 *
 * KNOW-CORE-001: RAG integration
 * Test-first approach (Article III)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeBase } from '../../src/knowledge/knowledge-base.js';
import type {
  KnowledgeDocument,
  KnowledgeBaseConfig,
  QueryOptions,
} from '../../src/knowledge/types.js';

describe('KnowledgeBase', () => {
  let knowledgeBase: KnowledgeBase;
  let config: KnowledgeBaseConfig;

  beforeEach(() => {
    config = {
      embedding: {
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        maxTokens: 8191,
      },
      vectorStore: {
        type: 'memory',
        collectionName: 'test-collection',
      },
      chunkSize: 1000,
      chunkOverlap: 200,
    };
    knowledgeBase = new KnowledgeBase(config);
  });

  describe('constructor', () => {
    it('should create instance with valid config', () => {
      expect(knowledgeBase).toBeInstanceOf(KnowledgeBase);
    });

    it('should accept memory vector store', () => {
      const memoryConfig: KnowledgeBaseConfig = {
        ...config,
        vectorStore: { type: 'memory', collectionName: 'test' },
      };
      const kb = new KnowledgeBase(memoryConfig);
      expect(kb).toBeInstanceOf(KnowledgeBase);
    });

    it('should accept pgvector store with connection string', () => {
      const pgConfig: KnowledgeBaseConfig = {
        ...config,
        vectorStore: {
          type: 'pgvector',
          connectionString: 'postgresql://localhost:5432/test',
          collectionName: 'documents',
        },
      };
      const kb = new KnowledgeBase(pgConfig);
      expect(kb).toBeInstanceOf(KnowledgeBase);
    });
  });

  describe('addDocument', () => {
    it('should add a document and return with generated ID', async () => {
      const input = {
        title: 'Test Paper',
        type: 'paper' as const,
        content: 'This is test content for the knowledge base.',
        metadata: {
          source: 'test',
          authors: ['Author A'],
          tags: ['test', 'ai'],
        },
      };

      const result = await knowledgeBase.addDocument(input);

      expect(result.id).toBeDefined();
      expect(result.title).toBe(input.title);
      expect(result.type).toBe(input.type);
      expect(result.content).toBe(input.content);
      expect(result.status).toBe('indexed');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs for multiple documents', async () => {
      const doc1 = await knowledgeBase.addDocument({
        title: 'Doc 1',
        type: 'paper',
        content: 'Content 1',
        metadata: {},
      });

      const doc2 = await knowledgeBase.addDocument({
        title: 'Doc 2',
        type: 'paper',
        content: 'Content 2',
        metadata: {},
      });

      expect(doc1.id).not.toBe(doc2.id);
    });

    it('should validate required fields', async () => {
      await expect(
        knowledgeBase.addDocument({
          title: '',
          type: 'paper',
          content: 'Content',
          metadata: {},
        })
      ).rejects.toThrow('Title is required');
    });

    it('should validate content is not empty', async () => {
      await expect(
        knowledgeBase.addDocument({
          title: 'Title',
          type: 'paper',
          content: '',
          metadata: {},
        })
      ).rejects.toThrow('Content is required');
    });
  });

  describe('getDocument', () => {
    it('should retrieve a document by ID', async () => {
      const added = await knowledgeBase.addDocument({
        title: 'Test Doc',
        type: 'documentation',
        content: 'Test content here',
        metadata: { source: 'test' },
      });

      const retrieved = await knowledgeBase.getDocument(added.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(added.id);
      expect(retrieved?.title).toBe('Test Doc');
    });

    it('should return null for non-existent document', async () => {
      const result = await knowledgeBase.getDocument('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('updateDocument', () => {
    it('should update document fields', async () => {
      const doc = await knowledgeBase.addDocument({
        title: 'Original Title',
        type: 'paper',
        content: 'Original content',
        metadata: {},
      });

      const updated = await knowledgeBase.updateDocument(doc.id, {
        title: 'Updated Title',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.content).toBe('Original content');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(doc.updatedAt.getTime());
    });

    it('should throw error for non-existent document', async () => {
      await expect(
        knowledgeBase.updateDocument('non-existent', { title: 'New' })
      ).rejects.toThrow('Document not found');
    });

    it('should update metadata while preserving existing fields', async () => {
      const doc = await knowledgeBase.addDocument({
        title: 'Test',
        type: 'paper',
        content: 'Content',
        metadata: { source: 'original', tags: ['tag1'] },
      });

      const updated = await knowledgeBase.updateDocument(doc.id, {
        metadata: { ...doc.metadata, authors: ['New Author'] },
      });

      expect(updated.metadata.source).toBe('original');
      expect(updated.metadata.authors).toContain('New Author');
    });
  });

  describe('deleteDocument', () => {
    it('should delete an existing document', async () => {
      const doc = await knowledgeBase.addDocument({
        title: 'To Delete',
        type: 'note',
        content: 'Will be deleted',
        metadata: {},
      });

      await knowledgeBase.deleteDocument(doc.id);
      const result = await knowledgeBase.getDocument(doc.id);

      expect(result).toBeNull();
    });

    it('should throw error for non-existent document', async () => {
      await expect(
        knowledgeBase.deleteDocument('non-existent')
      ).rejects.toThrow('Document not found');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Add test documents
      await knowledgeBase.addDocument({
        title: 'Machine Learning Basics',
        type: 'paper',
        content: 'Machine learning is a subset of artificial intelligence that enables computers to learn from data.',
        metadata: { tags: ['ml', 'ai'], domain: 'computer-science' },
      });

      await knowledgeBase.addDocument({
        title: 'Drug Discovery Methods',
        type: 'paper',
        content: 'Drug discovery involves the identification of new medication candidates through various screening methods.',
        metadata: { tags: ['pharma', 'research'], domain: 'drug-discovery' },
      });

      await knowledgeBase.addDocument({
        title: 'Materials Science Overview',
        type: 'documentation',
        content: 'Materials science studies the properties and applications of different materials including metals and polymers.',
        metadata: { tags: ['materials'], domain: 'materials-science' },
      });
    });

    it('should return relevant results for query', async () => {
      const results = await knowledgeBase.search('artificial intelligence learning');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].document.title).toBe('Machine Learning Basics');
    });

    it('should return results with score', async () => {
      const results = await knowledgeBase.search('machine learning');

      expect(results[0].score).toBeGreaterThan(0);
      expect(results[0].score).toBeLessThanOrEqual(1);
    });

    it('should respect limit option', async () => {
      const results = await knowledgeBase.search('science', { limit: 1 });

      expect(results.length).toBe(1);
    });

    it('should filter by domain', async () => {
      const results = await knowledgeBase.search('methods', {
        domains: ['drug-discovery'],
      });

      expect(results.every(r => r.document.metadata.domain === 'drug-discovery')).toBe(true);
    });

    it('should filter by document type', async () => {
      const results = await knowledgeBase.search('science', {
        documentTypes: ['documentation'],
      });

      expect(results.every(r => r.document.type === 'documentation')).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      // With high threshold, unrelated query should return no matches
      const results = await knowledgeBase.search('xyz123nonexistent', { threshold: 0.5 });

      expect(results).toEqual([]);
    });

    it('should respect threshold option', async () => {
      const results = await knowledgeBase.search('machine learning', {
        threshold: 0.8,
      });

      expect(results.every(r => r.score >= 0.8)).toBe(true);
    });
  });

  describe('reindexDocument', () => {
    it('should update document status and re-process', async () => {
      const doc = await knowledgeBase.addDocument({
        title: 'To Reindex',
        type: 'paper',
        content: 'Content to be re-indexed',
        metadata: {},
      });

      await knowledgeBase.reindexDocument(doc.id);
      const updated = await knowledgeBase.getDocument(doc.id);

      // After reindex, status should be indexed (sync implementation)
      expect(updated?.status).toBe('indexed');
      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(doc.updatedAt.getTime());
    });

    it('should throw error for non-existent document', async () => {
      await expect(
        knowledgeBase.reindexDocument('non-existent')
      ).rejects.toThrow('Document not found');
    });
  });

  describe('getStats', () => {
    it('should return initial stats for empty knowledge base', async () => {
      const emptyKb = new KnowledgeBase(config);
      const stats = await emptyKb.getStats();

      expect(stats.documentCount).toBe(0);
      expect(stats.chunkCount).toBe(0);
      expect(stats.indexedCount).toBe(0);
      expect(stats.pendingCount).toBe(0);
      expect(stats.errorCount).toBe(0);
    });

    it('should track document counts correctly', async () => {
      await knowledgeBase.addDocument({
        title: 'Doc 1',
        type: 'paper',
        content: 'Content 1',
        metadata: {},
      });

      await knowledgeBase.addDocument({
        title: 'Doc 2',
        type: 'note',
        content: 'Content 2',
        metadata: {},
      });

      const stats = await knowledgeBase.getStats();

      expect(stats.documentCount).toBe(2);
      expect(stats.indexedCount).toBe(2); // Sync implementation indexes immediately
    });
  });
});
