/**
 * Embedding Provider Interface
 *
 * KNOW-CORE-001: Extensible embedding provider abstraction
 * Supports Ollama (development) and Azure AI Search (production)
 */

import type {
  EmbeddingProviderConfig,
  OllamaEmbeddingConfig,
  AzureSearchConfig,
  MockEmbeddingConfig,
  EmbeddingResult,
  VectorSearchRequest,
  IndexDocumentRequest,
} from './types.js';

/**
 * Embedding provider interface
 */
export interface EmbeddingProvider {
  /**
   * Get provider type
   */
  readonly type: string;

  /**
   * Get embedding dimensions
   */
  readonly dimensions: number;

  /**
   * Generate embedding for text
   */
  generateEmbedding(text: string): Promise<EmbeddingResult>;

  /**
   * Generate embeddings for multiple texts
   */
  generateEmbeddingBatch(texts: string[]): Promise<EmbeddingResult[]>;

  /**
   * Check if provider is available/healthy
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Vector search provider interface (extends embedding with search)
 */
export interface VectorSearchProvider extends EmbeddingProvider {
  /**
   * Index a document
   */
  indexDocument(request: IndexDocumentRequest): Promise<void>;

  /**
   * Index multiple documents
   */
  indexDocuments(requests: IndexDocumentRequest[]): Promise<void>;

  /**
   * Search for similar documents
   */
  search(request: VectorSearchRequest): Promise<SearchHit[]>;

  /**
   * Delete a document from index
   */
  deleteDocument(id: string): Promise<void>;

  /**
   * Clear all documents from index
   */
  clearIndex(): Promise<void>;
}

/**
 * Search hit result
 */
export interface SearchHit {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, unknown>;
}

/**
 * Provider factory type
 */
export type ProviderConfig =
  | OllamaEmbeddingConfig
  | AzureSearchConfig
  | MockEmbeddingConfig;

/**
 * Create embedding provider from configuration
 */
export function createEmbeddingProvider(
  config: ProviderConfig
): EmbeddingProvider {
  switch (config.type) {
    case 'ollama':
      // Lazy import to avoid loading when not used
      return new OllamaEmbeddingProvider(config);
    case 'azure-ai-search':
      return new AzureSearchProvider(config);
    case 'mock':
      return new MockEmbeddingProvider(config);
    default:
      throw new Error(`Unknown embedding provider type: ${(config as EmbeddingProviderConfig).type}`);
  }
}

/**
 * Mock embedding provider for testing
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly type = 'mock';
  readonly dimensions: number;

  constructor(config: MockEmbeddingConfig) {
    this.dimensions = config.dimensions;
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    // Generate deterministic embedding based on text hash
    const embedding = this.hashToEmbedding(text);
    return {
      embedding,
      tokenCount: Math.ceil(text.length / 4),
    };
  }

  async generateEmbeddingBatch(texts: string[]): Promise<EmbeddingResult[]> {
    return Promise.all(texts.map((text) => this.generateEmbedding(text)));
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  private hashToEmbedding(text: string): number[] {
    const embedding: number[] = new Array(this.dimensions).fill(0);
    for (let i = 0; i < text.length; i++) {
      const idx = i % this.dimensions;
      embedding[idx] = (embedding[idx] ?? 0) + text.charCodeAt(i);
    }
    // Normalize
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] = (embedding[i] ?? 0) / magnitude;
      }
    }
    return embedding;
  }
}

/**
 * Ollama embedding provider for local development
 */
export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly type = 'ollama';
  readonly dimensions: number;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number;

  constructor(config: OllamaEmbeddingConfig) {
    this.dimensions = config.dimensions;
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.model = config.model;
    this.timeout = config.timeout ?? 30000;
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const response = await this.callOllama('/api/embeddings', {
      model: this.model,
      prompt: text,
    });

    return {
      embedding: response.embedding,
      tokenCount: response.prompt_eval_count ?? Math.ceil(text.length / 4),
    };
  }

  async generateEmbeddingBatch(texts: string[]): Promise<EmbeddingResult[]> {
    // Ollama doesn't support batch natively, so we process sequentially
    const results: EmbeddingResult[] = [];
    for (const text of texts) {
      results.push(await this.generateEmbedding(text));
    }
    return results;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async callOllama(
    path: string,
    body: Record<string, unknown>
  ): Promise<OllamaEmbeddingResponse> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<OllamaEmbeddingResponse>;
  }
}

interface OllamaEmbeddingResponse {
  embedding: number[];
  prompt_eval_count?: number;
}

/**
 * Azure AI Search provider for production
 */
export class AzureSearchProvider implements VectorSearchProvider {
  readonly type = 'azure-ai-search';
  readonly dimensions: number;
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly indexName: string;
  private readonly embeddingDeployment?: string;

  constructor(config: AzureSearchConfig) {
    this.dimensions = config.dimensions;
    this.endpoint = config.endpoint.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.indexName = config.indexName;
    this.embeddingDeployment = config.embeddingDeployment;
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    // Use Azure OpenAI for embeddings if deployment is configured
    if (this.embeddingDeployment) {
      return this.generateAzureOpenAIEmbedding(text);
    }
    
    // Fallback to integrated vectorization in Azure AI Search
    throw new Error(
      'Azure AI Search requires embeddingDeployment for generating embeddings'
    );
  }

  async generateEmbeddingBatch(texts: string[]): Promise<EmbeddingResult[]> {
    // Azure OpenAI supports batch embeddings
    if (this.embeddingDeployment) {
      return this.generateAzureOpenAIEmbeddingBatch(texts);
    }
    
    throw new Error(
      'Azure AI Search requires embeddingDeployment for generating embeddings'
    );
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.endpoint}/indexes/${this.indexName}?api-version=2024-07-01`,
        {
          method: 'GET',
          headers: {
            'api-key': this.apiKey,
          },
          signal: AbortSignal.timeout(5000),
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async indexDocument(request: IndexDocumentRequest): Promise<void> {
    await this.indexDocuments([request]);
  }

  async indexDocuments(requests: IndexDocumentRequest[]): Promise<void> {
    const documents = requests.map((req) => ({
      '@search.action': 'mergeOrUpload',
      id: req.id,
      content: req.content,
      embedding: req.embedding,
      ...req.metadata,
    }));

    const response = await fetch(
      `${this.endpoint}/indexes/${this.indexName}/docs/index?api-version=2024-07-01`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({ value: documents }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure Search indexing error: ${response.status} - ${error}`);
    }
  }

  async search(request: VectorSearchRequest): Promise<SearchHit[]> {
    const searchBody = {
      vectorQueries: [
        {
          kind: 'vector',
          vector: request.embedding,
          fields: 'embedding',
          k: request.limit,
        },
      ],
      select: 'id,content,metadata',
      top: request.limit,
    };

    const response = await fetch(
      `${this.endpoint}/indexes/${this.indexName}/docs/search?api-version=2024-07-01`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify(searchBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure Search query error: ${response.status} - ${error}`);
    }

    const result = (await response.json()) as AzureSearchResponse;
    
    return result.value
      .filter((hit) => !request.threshold || hit['@search.score'] >= request.threshold)
      .map((hit) => ({
        id: hit.id,
        score: hit['@search.score'],
        content: hit.content,
        metadata: hit.metadata ?? {},
      }));
  }

  async deleteDocument(id: string): Promise<void> {
    const response = await fetch(
      `${this.endpoint}/indexes/${this.indexName}/docs/index?api-version=2024-07-01`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          value: [{ '@search.action': 'delete', id }],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure Search delete error: ${response.status} - ${error}`);
    }
  }

  async clearIndex(): Promise<void> {
    // Azure AI Search doesn't have a clear all operation
    // You would need to delete and recreate the index
    throw new Error(
      'clearIndex not supported for Azure AI Search. Delete and recreate the index instead.'
    );
  }

  private async generateAzureOpenAIEmbedding(
    text: string
  ): Promise<EmbeddingResult> {
    const results = await this.generateAzureOpenAIEmbeddingBatch([text]);
    const result = results[0];
    if (!result) {
      throw new Error('Failed to generate embedding');
    }
    return result;
  }

  private async generateAzureOpenAIEmbeddingBatch(
    texts: string[]
  ): Promise<EmbeddingResult[]> {
    // This would call Azure OpenAI embeddings API
    // For now, throw error indicating configuration needed
    const _deployment = this.embeddingDeployment;
    
    // Placeholder - actual implementation would use Azure OpenAI SDK
    const response = await fetch(
      `${this.endpoint}/openai/deployments/${this.embeddingDeployment}/embeddings?api-version=2024-02-01`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          input: texts,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI embedding error: ${response.status} - ${error}`);
    }

    const result = (await response.json()) as AzureOpenAIEmbeddingResponse;
    
    return result.data.map((item) => ({
      embedding: item.embedding,
      tokenCount: result.usage.prompt_tokens / texts.length,
    }));
  }
}

interface AzureSearchResponse {
  value: Array<{
    id: string;
    content: string;
    metadata?: Record<string, unknown>;
    '@search.score': number;
  }>;
}

interface AzureOpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}
