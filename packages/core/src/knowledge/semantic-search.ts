/**
 * Semantic Search Service
 *
 * KNOW-CORE-001: Unified semantic search with embedding providers and vector stores
 * Supports Ollama (development) and Azure AI Search (production)
 */

import type { EmbeddingProvider } from './embedding-provider.js';
import type {
  VectorStore,
  VectorDocument,
  VectorSearchResult,
} from './vector-store.js';

/**
 * Document to index
 */
export interface DocumentToIndex {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  chunkSize?: number;
  chunkOverlap?: number;
}

/**
 * Search options
 */
export interface SearchOptions {
  limit: number;
  threshold?: number;
  filter?: Record<string, unknown>;
}

/**
 * Context build options
 */
export interface ContextOptions extends SearchOptions {
  maxTokens?: number;
}

/**
 * Built context result
 */
export interface BuiltContext {
  context: string;
  sources: Array<{
    id: string;
    score: number;
    content: string;
  }>;
  tokenCount: number;
}

/**
 * Service statistics
 */
export interface SemanticSearchStats {
  documentCount: number;
  dimensions: number | null;
  providerType: string;
}

/**
 * Semantic search service configuration
 */
export interface SemanticSearchConfig {
  embeddingProvider: EmbeddingProvider;
  vectorStore: VectorStore;
}

/**
 * Semantic Search Service
 *
 * Integrates embedding providers with vector stores for semantic search
 */
export class SemanticSearchService {
  private readonly embeddingProvider: EmbeddingProvider;
  private readonly vectorStore: VectorStore;
  private readonly documentChunks: Map<string, string[]> = new Map();

  constructor(config: SemanticSearchConfig) {
    this.embeddingProvider = config.embeddingProvider;
    this.vectorStore = config.vectorStore;
  }

  /**
   * Index a single document
   */
  async indexDocument(doc: DocumentToIndex): Promise<void> {
    if (!doc.content || doc.content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    const chunks = this.chunkContent(
      doc.content,
      doc.chunkSize ?? 1000,
      doc.chunkOverlap ?? 100
    );

    const chunkIds: string[] = [];

    if (chunks.length === 1) {
      // Single chunk, use original ID
      const chunkContent = chunks[0] ?? '';
      const embedding = await this.embeddingProvider.generateEmbedding(chunkContent);
      await this.vectorStore.addDocument({
        id: doc.id,
        content: chunkContent,
        embedding: embedding.embedding,
        metadata: { ...doc.metadata, originalId: doc.id },
      });
      chunkIds.push(doc.id);
    } else {
      // Multiple chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `${doc.id}#chunk-${i}`;
        const chunkContent = chunks[i] ?? '';
        const embedding = await this.embeddingProvider.generateEmbedding(chunkContent);
        await this.vectorStore.addDocument({
          id: chunkId,
          content: chunkContent,
          embedding: embedding.embedding,
          metadata: {
            ...doc.metadata,
            originalId: doc.id,
            chunkIndex: i,
            totalChunks: chunks.length,
          },
        });
        chunkIds.push(chunkId);
      }
    }

    this.documentChunks.set(doc.id, chunkIds);
  }

  /**
   * Index multiple documents in batch
   */
  async indexDocuments(docs: DocumentToIndex[]): Promise<void> {
    // Filter out empty content
    const validDocs = docs.filter((doc) => doc.content && doc.content.trim().length > 0);

    if (validDocs.length === 0) {
      return;
    }

    // Generate all embeddings in batch
    const contents = validDocs.map((doc) => doc.content);
    const embeddings = await this.embeddingProvider.generateEmbeddingBatch(contents);

    // Create vector documents
    const vectorDocs: VectorDocument[] = validDocs.map((doc, i) => {
      const embeddingResult = embeddings[i];
      return {
        id: doc.id,
        content: doc.content,
        embedding: embeddingResult?.embedding ?? [],
        metadata: { ...doc.metadata, originalId: doc.id },
      };
    });

    await this.vectorStore.addDocuments(vectorDocs);

    // Track chunks (single chunk per doc in batch mode)
    for (const doc of validDocs) {
      this.documentChunks.set(doc.id, [doc.id]);
    }
  }

  /**
   * Search for similar documents
   */
  async search(
    query: string,
    options: SearchOptions
  ): Promise<VectorSearchResult[]> {
    if (!query || query.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }

    const queryEmbedding = await this.embeddingProvider.generateEmbedding(query);

    return this.vectorStore.search({
      embedding: queryEmbedding.embedding,
      limit: options.limit,
      threshold: options.threshold,
      filter: options.filter,
    });
  }

  /**
   * Delete a document and all its chunks
   */
  async deleteDocument(docId: string): Promise<void> {
    const chunkIds = this.documentChunks.get(docId) ?? [docId];

    for (const chunkId of chunkIds) {
      await this.vectorStore.deleteDocument(chunkId);
    }

    this.documentChunks.delete(docId);
  }

  /**
   * Update an existing document
   */
  async updateDocument(doc: DocumentToIndex): Promise<void> {
    // Delete existing chunks
    await this.deleteDocument(doc.id);

    // Re-index with new content
    await this.indexDocument(doc);
  }

  /**
   * Build context for RAG from search results
   */
  async buildContext(
    query: string,
    options: ContextOptions
  ): Promise<BuiltContext> {
    const results = await this.search(query, {
      limit: options.limit,
      threshold: options.threshold,
      filter: options.filter,
    });

    const maxTokens = options.maxTokens ?? 4000;
    const contextParts: string[] = [];
    const sources: BuiltContext['sources'] = [];
    let currentTokens = 0;

    for (const result of results) {
      // Estimate tokens (roughly 1 token per 4 characters)
      const estimatedTokens = Math.ceil(result.content.length / 4);

      if (currentTokens + estimatedTokens > maxTokens) {
        // Truncate content to fit
        const remainingTokens = maxTokens - currentTokens;
        const truncatedContent = result.content.slice(0, remainingTokens * 4);
        
        if (truncatedContent.length > 50) {
          contextParts.push(truncatedContent + '...');
          sources.push({
            id: result.id,
            score: result.score,
            content: truncatedContent,
          });
        }
        break;
      }

      contextParts.push(result.content);
      sources.push({
        id: result.id,
        score: result.score,
        content: result.content,
      });
      currentTokens += estimatedTokens;
    }

    const context = contextParts.join('\n\n---\n\n');

    return {
      context,
      sources,
      tokenCount: Math.ceil(context.length / 4),
    };
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<SemanticSearchStats> {
    const storeStats = await this.vectorStore.getStats();

    return {
      documentCount: storeStats.documentCount,
      dimensions: storeStats.dimensions,
      providerType: this.embeddingProvider.type,
    };
  }

  /**
   * Check if the service is available
   */
  async isAvailable(): Promise<boolean> {
    return this.embeddingProvider.isAvailable();
  }

  /**
   * Chunk content into smaller pieces
   */
  private chunkContent(
    content: string,
    chunkSize: number,
    chunkOverlap: number
  ): string[] {
    if (content.length <= chunkSize) {
      return [content];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < content.length) {
      let end = start + chunkSize;

      // Try to break at paragraph or sentence boundary
      if (end < content.length) {
        const paragraphBreak = content.lastIndexOf('\n\n', end);
        if (paragraphBreak > start + chunkSize / 2) {
          end = paragraphBreak + 2;
        } else {
          const sentenceBreak = content.lastIndexOf('. ', end);
          if (sentenceBreak > start + chunkSize / 2) {
            end = sentenceBreak + 2;
          }
        }
      }

      chunks.push(content.slice(start, end).trim());
      start = end - chunkOverlap;

      if (start >= content.length - chunkOverlap) {
        break;
      }
    }

    return chunks.filter((chunk) => chunk.length > 0);
  }
}
