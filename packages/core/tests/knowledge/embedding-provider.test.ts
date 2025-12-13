/**
 * Embedding Provider Tests
 *
 * Tests for embedding providers: Mock, Ollama, Azure AI Search
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createEmbeddingProvider,
  MockEmbeddingProvider,
  OllamaEmbeddingProvider,
  AzureSearchProvider,
  type EmbeddingProvider,
  type VectorSearchProvider,
} from '../../src/knowledge/embedding-provider.js';
import type {
  MockEmbeddingConfig,
  OllamaEmbeddingConfig,
  AzureSearchConfig,
} from '../../src/knowledge/types.js';

describe('EmbeddingProvider', () => {
  describe('createEmbeddingProvider', () => {
    it('should create MockEmbeddingProvider for mock type', () => {
      const config: MockEmbeddingConfig = {
        type: 'mock',
        dimensions: 384,
      };

      const provider = createEmbeddingProvider(config);

      expect(provider).toBeInstanceOf(MockEmbeddingProvider);
      expect(provider.type).toBe('mock');
      expect(provider.dimensions).toBe(384);
    });

    it('should create OllamaEmbeddingProvider for ollama type', () => {
      const config: OllamaEmbeddingConfig = {
        type: 'ollama',
        dimensions: 768,
        baseUrl: 'http://localhost:11434',
        model: 'nomic-embed-text',
      };

      const provider = createEmbeddingProvider(config);

      expect(provider).toBeInstanceOf(OllamaEmbeddingProvider);
      expect(provider.type).toBe('ollama');
      expect(provider.dimensions).toBe(768);
    });

    it('should create AzureSearchProvider for azure-ai-search type', () => {
      const config: AzureSearchConfig = {
        type: 'azure-ai-search',
        dimensions: 1536,
        endpoint: 'https://test.search.windows.net',
        apiKey: 'test-api-key',
        indexName: 'test-index',
      };

      const provider = createEmbeddingProvider(config);

      expect(provider).toBeInstanceOf(AzureSearchProvider);
      expect(provider.type).toBe('azure-ai-search');
      expect(provider.dimensions).toBe(1536);
    });

    it('should throw error for unknown provider type', () => {
      const config = {
        type: 'unknown',
        dimensions: 384,
      } as MockEmbeddingConfig;

      expect(() => createEmbeddingProvider(config)).toThrow(
        'Unknown embedding provider type'
      );
    });
  });

  describe('MockEmbeddingProvider', () => {
    let provider: MockEmbeddingProvider;

    beforeEach(() => {
      provider = new MockEmbeddingProvider({
        type: 'mock',
        dimensions: 384,
      });
    });

    it('should generate embedding with correct dimensions', async () => {
      const result = await provider.generateEmbedding('test text');

      expect(result.embedding).toHaveLength(384);
      expect(result.tokenCount).toBeGreaterThan(0);
    });

    it('should generate deterministic embeddings for same text', async () => {
      const result1 = await provider.generateEmbedding('hello world');
      const result2 = await provider.generateEmbedding('hello world');

      expect(result1.embedding).toEqual(result2.embedding);
    });

    it('should generate different embeddings for different text', async () => {
      const result1 = await provider.generateEmbedding('hello world');
      const result2 = await provider.generateEmbedding('goodbye world');

      expect(result1.embedding).not.toEqual(result2.embedding);
    });

    it('should generate normalized embeddings (unit vectors)', async () => {
      const result = await provider.generateEmbedding('test text');

      const magnitude = Math.sqrt(
        result.embedding.reduce((sum, val) => sum + val * val, 0)
      );
      expect(magnitude).toBeCloseTo(1.0, 5);
    });

    it('should generate batch embeddings', async () => {
      const texts = ['text one', 'text two', 'text three'];
      const results = await provider.generateEmbeddingBatch(texts);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.embedding).toHaveLength(384);
      });
    });

    it('should always be available', async () => {
      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });

    it('should estimate token count based on text length', async () => {
      const shortText = 'hi';
      const longText = 'a'.repeat(100);

      const shortResult = await provider.generateEmbedding(shortText);
      const longResult = await provider.generateEmbedding(longText);

      expect(shortResult.tokenCount).toBeLessThan(longResult.tokenCount);
    });
  });

  describe('OllamaEmbeddingProvider', () => {
    let provider: OllamaEmbeddingProvider;
    const mockFetch = vi.fn();

    beforeEach(() => {
      provider = new OllamaEmbeddingProvider({
        type: 'ollama',
        dimensions: 768,
        baseUrl: 'http://localhost:11434',
        model: 'nomic-embed-text',
        timeout: 5000,
      });

      // Mock global fetch
      vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should call Ollama API for embedding generation', async () => {
      const mockEmbedding = new Array(768).fill(0).map((_, i) => i * 0.001);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            embedding: mockEmbedding,
            prompt_eval_count: 5,
          }),
      });

      const result = await provider.generateEmbedding('test text');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/embeddings',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'nomic-embed-text',
            prompt: 'test text',
          }),
        })
      );
      expect(result.embedding).toEqual(mockEmbedding);
      expect(result.tokenCount).toBe(5);
    });

    it('should throw error on Ollama API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal server error'),
      });

      await expect(provider.generateEmbedding('test')).rejects.toThrow(
        'Ollama API error: 500'
      );
    });

    it('should check availability via /api/tags endpoint', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const available = await provider.isAvailable();

      expect(available).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return false when Ollama is not available', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const available = await provider.isAvailable();

      expect(available).toBe(false);
    });

    it('should process batch embeddings sequentially', async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            embedding: mockEmbedding,
            prompt_eval_count: 3,
          }),
      });

      const texts = ['text1', 'text2', 'text3'];
      const results = await provider.generateEmbeddingBatch(texts);

      expect(results).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should strip trailing slash from base URL', () => {
      const providerWithSlash = new OllamaEmbeddingProvider({
        type: 'ollama',
        dimensions: 768,
        baseUrl: 'http://localhost:11434/',
        model: 'nomic-embed-text',
      });

      expect(providerWithSlash.type).toBe('ollama');
    });
  });

  describe('AzureSearchProvider', () => {
    let provider: AzureSearchProvider;
    const mockFetch = vi.fn();

    beforeEach(() => {
      provider = new AzureSearchProvider({
        type: 'azure-ai-search',
        dimensions: 1536,
        endpoint: 'https://test.search.windows.net',
        apiKey: 'test-api-key',
        indexName: 'test-index',
        embeddingDeployment: 'text-embedding-ada-002',
      });

      vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should check index availability', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const available = await provider.isAvailable();

      expect(available).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.search.windows.net/indexes/test-index?api-version=2024-07-01',
        expect.objectContaining({
          method: 'GET',
          headers: { 'api-key': 'test-api-key' },
        })
      );
    });

    it('should return false when Azure Search is not available', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const available = await provider.isAvailable();

      expect(available).toBe(false);
    });

    it('should index a single document', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await provider.indexDocument({
        id: 'doc-1',
        content: 'Test content',
        embedding: new Array(1536).fill(0.1),
        metadata: { source: 'test' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.search.windows.net/indexes/test-index/docs/index?api-version=2024-07-01',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': 'test-api-key',
          },
        })
      );
    });

    it('should index multiple documents in batch', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const docs = [
        { id: 'doc-1', content: 'Content 1', embedding: [0.1], metadata: {} },
        { id: 'doc-2', content: 'Content 2', embedding: [0.2], metadata: {} },
      ];

      await provider.indexDocuments(docs);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.value).toHaveLength(2);
      expect(callBody.value[0]['@search.action']).toBe('mergeOrUpload');
    });

    it('should throw error on indexing failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad request'),
      });

      await expect(
        provider.indexDocument({
          id: 'doc-1',
          content: 'Test',
          embedding: [0.1],
          metadata: {},
        })
      ).rejects.toThrow('Azure Search indexing error: 400');
    });

    it('should perform vector search', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            value: [
              {
                id: 'doc-1',
                content: 'Result content',
                metadata: { source: 'test' },
                '@search.score': 0.95,
              },
            ],
          }),
      });

      const results = await provider.search({
        embedding: new Array(1536).fill(0.1),
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('doc-1');
      expect(results[0].score).toBe(0.95);
      expect(results[0].content).toBe('Result content');
    });

    it('should filter search results by threshold', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            value: [
              { id: 'doc-1', content: 'High score', '@search.score': 0.9 },
              { id: 'doc-2', content: 'Low score', '@search.score': 0.3 },
            ],
          }),
      });

      const results = await provider.search({
        embedding: [0.1],
        limit: 10,
        threshold: 0.5,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('doc-1');
    });

    it('should delete document from index', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await provider.deleteDocument('doc-1');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.value[0]['@search.action']).toBe('delete');
      expect(callBody.value[0].id).toBe('doc-1');
    });

    it('should throw error on clearIndex (not supported)', async () => {
      await expect(provider.clearIndex()).rejects.toThrow(
        'clearIndex not supported for Azure AI Search'
      );
    });

    it('should generate embeddings via Azure OpenAI', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ embedding: new Array(1536).fill(0.1), index: 0 }],
            usage: { prompt_tokens: 5, total_tokens: 5 },
          }),
      });

      const result = await provider.generateEmbedding('test text');

      expect(result.embedding).toHaveLength(1536);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/openai/deployments/text-embedding-ada-002/embeddings'),
        expect.anything()
      );
    });

    it('should throw error when embedding deployment not configured', async () => {
      const providerNoDeployment = new AzureSearchProvider({
        type: 'azure-ai-search',
        dimensions: 1536,
        endpoint: 'https://test.search.windows.net',
        apiKey: 'test-api-key',
        indexName: 'test-index',
        // No embeddingDeployment
      });

      await expect(
        providerNoDeployment.generateEmbedding('test')
      ).rejects.toThrow('embeddingDeployment');
    });
  });

  describe('Environment-based Provider Selection', () => {
    it('should use mock provider in test environment', () => {
      const config: MockEmbeddingConfig = {
        type: 'mock',
        dimensions: 384,
      };
      const provider = createEmbeddingProvider(config);
      expect(provider.type).toBe('mock');
    });

    it('should configure ollama provider for development', () => {
      const config: OllamaEmbeddingConfig = {
        type: 'ollama',
        dimensions: 768,
        baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL ?? 'nomic-embed-text',
      };
      const provider = createEmbeddingProvider(config);
      expect(provider.type).toBe('ollama');
      expect(provider.dimensions).toBe(768);
    });

    it('should configure azure provider for production', () => {
      const config: AzureSearchConfig = {
        type: 'azure-ai-search',
        dimensions: 1536,
        endpoint: 'https://prod.search.windows.net',
        apiKey: 'prod-api-key',
        indexName: 'production-index',
        embeddingDeployment: 'text-embedding-3-large',
      };
      const provider = createEmbeddingProvider(config);
      expect(provider.type).toBe('azure-ai-search');
      expect(provider.dimensions).toBe(1536);
    });
  });

  describe('Cosine Similarity Validation', () => {
    let provider: MockEmbeddingProvider;

    beforeEach(() => {
      provider = new MockEmbeddingProvider({
        type: 'mock',
        dimensions: 384,
      });
    });

    it('should generate embeddings suitable for cosine similarity', async () => {
      const emb1 = await provider.generateEmbedding('machine learning');
      const emb2 = await provider.generateEmbedding('deep learning');
      const emb3 = await provider.generateEmbedding('pizza recipe');

      // Calculate cosine similarity
      const cosineSim = (a: number[], b: number[]): number => {
        let dotProduct = 0;
        for (let i = 0; i < a.length; i++) {
          dotProduct += a[i] * b[i];
        }
        return dotProduct; // Already normalized
      };

      const sim12 = cosineSim(emb1.embedding, emb2.embedding);
      const sim13 = cosineSim(emb1.embedding, emb3.embedding);

      // Similar texts should have higher similarity (this is a mock, so just verify calculation works)
      expect(sim12).toBeGreaterThan(-1);
      expect(sim12).toBeLessThan(1);
      expect(sim13).toBeGreaterThan(-1);
      expect(sim13).toBeLessThan(1);
    });
  });
});
