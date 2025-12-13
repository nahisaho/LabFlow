/**
 * Vector Store
 *
 * KNOW-CORE-001: Vector storage for semantic search
 * Supports in-memory (dev/test) and production backends
 */

/**
 * Vector document structure
 */
export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

/**
 * Search request parameters
 */
export interface VectorSearchRequest {
  embedding: number[];
  limit: number;
  threshold?: number;
  filter?: Record<string, unknown>;
}

/**
 * Search result
 */
export interface VectorSearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

/**
 * Vector store statistics
 */
export interface VectorStoreStats {
  documentCount: number;
  dimensions: number | null;
}

/**
 * Vector store configuration
 */
export interface VectorStoreConfig {
  type: 'memory' | 'pgvector' | 'qdrant';
  connectionString?: string;
  collectionName?: string;
}

/**
 * Vector store interface
 */
export interface VectorStore {
  /**
   * Add a document to the store
   */
  addDocument(doc: VectorDocument): Promise<void>;

  /**
   * Add multiple documents to the store
   */
  addDocuments(docs: VectorDocument[]): Promise<void>;

  /**
   * Get a document by ID
   */
  getDocument(id: string): Promise<VectorDocument | null>;

  /**
   * Delete a document by ID
   */
  deleteDocument(id: string): Promise<void>;

  /**
   * Search for similar documents
   */
  search(request: VectorSearchRequest): Promise<VectorSearchResult[]>;

  /**
   * Clear all documents
   */
  clear(): Promise<void>;

  /**
   * Get store statistics
   */
  getStats(): Promise<VectorStoreStats>;
}

/**
 * Create a vector store from configuration
 */
export function createVectorStore(config: VectorStoreConfig): VectorStore {
  switch (config.type) {
    case 'memory':
      return new InMemoryVectorStore();
    case 'pgvector':
    case 'qdrant':
      throw new Error(`Vector store type '${config.type}' not yet implemented`);
    default:
      throw new Error(`Unsupported vector store type: ${config.type}`);
  }
}

/**
 * In-memory vector store for development and testing
 */
export class InMemoryVectorStore implements VectorStore {
  private documents: Map<string, VectorDocument> = new Map();

  async addDocument(doc: VectorDocument): Promise<void> {
    this.documents.set(doc.id, { ...doc });
  }

  async addDocuments(docs: VectorDocument[]): Promise<void> {
    for (const doc of docs) {
      this.documents.set(doc.id, { ...doc });
    }
  }

  async getDocument(id: string): Promise<VectorDocument | null> {
    const doc = this.documents.get(id);
    return doc ? { ...doc } : null;
  }

  async deleteDocument(id: string): Promise<void> {
    this.documents.delete(id);
  }

  async search(request: VectorSearchRequest): Promise<VectorSearchResult[]> {
    const { embedding, limit, threshold = 0, filter } = request;

    const results: VectorSearchResult[] = [];

    for (const doc of this.documents.values()) {
      // Apply metadata filter if provided
      if (filter && !this.matchesFilter(doc.metadata, filter)) {
        continue;
      }

      const score = this.cosineSimilarity(embedding, doc.embedding);

      if (score >= threshold) {
        results.push({
          id: doc.id,
          content: doc.content,
          score,
          metadata: { ...doc.metadata },
        });
      }
    }

    // Sort by score descending and limit
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async clear(): Promise<void> {
    this.documents.clear();
  }

  async getStats(): Promise<VectorStoreStats> {
    let dimensions: number | null = null;

    // Get dimensions from first document
    const firstDoc = this.documents.values().next().value;
    if (firstDoc) {
      dimensions = firstDoc.embedding.length;
    }

    return {
      documentCount: this.documents.size,
      dimensions,
    };
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(
        `Vector dimension mismatch: ${a.length} vs ${b.length}`
      );
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += (a[i] ?? 0) * (b[i] ?? 0);
      normA += (a[i] ?? 0) * (a[i] ?? 0);
      normB += (b[i] ?? 0) * (b[i] ?? 0);
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    
    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  /**
   * Check if document metadata matches filter
   */
  private matchesFilter(
    metadata: Record<string, unknown>,
    filter: Record<string, unknown>
  ): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (metadata[key] !== value) {
        return false;
      }
    }
    return true;
  }
}
