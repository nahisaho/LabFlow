/**
 * Knowledge Base
 *
 * KNOW-CORE-001: RAG integration
 */

import type {
  KnowledgeDocument,
  SearchResult,
  QueryOptions,
  KnowledgeBaseConfig,
  DocumentChunk,
} from './types.js';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Simple text similarity (cosine similarity on word frequency vectors)
 */
function textSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  const wordSet = new Set([...words1, ...words2]);
  const vec1: number[] = [];
  const vec2: number[] = [];

  for (const word of wordSet) {
    vec1.push(words1.filter((w) => w === word).length);
    vec2.push(words2.filter((w) => w === word).length);
  }

  const dotProduct = vec1.reduce((sum, val, i) => sum + val * (vec2[i] ?? 0), 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
}

/**
 * Knowledge base for document storage and retrieval
 */
export class KnowledgeBase {
  private config: KnowledgeBaseConfig;
  private documents: Map<string, KnowledgeDocument> = new Map();
  private chunks: Map<string, DocumentChunk[]> = new Map();

  constructor(config: KnowledgeBaseConfig) {
    this.config = config;
  }

  /**
   * Add a document to the knowledge base
   */
  async addDocument(
    document: Omit<KnowledgeDocument, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<KnowledgeDocument> {
    // Validate required fields
    if (!document.title || document.title.trim() === '') {
      throw new Error('Title is required');
    }
    if (!document.content || document.content.trim() === '') {
      throw new Error('Content is required');
    }

    const id = generateId();
    const now = new Date();

    const newDocument: KnowledgeDocument = {
      ...document,
      id,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    this.documents.set(id, newDocument);

    // Create chunks for the document
    const documentChunks = this.createChunks(newDocument);
    this.chunks.set(id, documentChunks);

    // Mark as indexed (in real implementation, this would be async)
    newDocument.status = 'indexed';
    this.documents.set(id, newDocument);

    return newDocument;
  }

  /**
   * Create chunks from a document
   */
  private createChunks(document: KnowledgeDocument): DocumentChunk[] {
    const { chunkSize, chunkOverlap } = this.config;
    const content = document.content;
    const chunks: DocumentChunk[] = [];

    let position = 0;
    let charStart = 0;

    while (charStart < content.length) {
      const charEnd = Math.min(charStart + chunkSize, content.length);
      const chunkContent = content.substring(charStart, charEnd);

      chunks.push({
        id: `${document.id}-chunk-${position}`,
        documentId: document.id,
        content: chunkContent,
        metadata: {
          position,
          charStart,
          charEnd,
        },
      });

      position++;
      charStart = charEnd - chunkOverlap;
      if (charStart >= content.length) break;
      if (charEnd === content.length) break;
    }

    return chunks;
  }

  /**
   * Get a document by ID
   */
  async getDocument(id: string): Promise<KnowledgeDocument | null> {
    return this.documents.get(id) ?? null;
  }

  /**
   * Search the knowledge base
   */
  async search(query: string, options?: QueryOptions): Promise<SearchResult[]> {
    const limit = options?.limit ?? 10;
    const threshold = options?.threshold ?? 0.0;
    const domains = options?.domains;
    const documentTypes = options?.documentTypes;

    const results: SearchResult[] = [];

    for (const [docId, document] of this.documents) {
      // Filter by domain
      if (domains && domains.length > 0) {
        if (!document.metadata.domain || !domains.includes(document.metadata.domain)) {
          continue;
        }
      }

      // Filter by document type
      if (documentTypes && documentTypes.length > 0) {
        if (!documentTypes.includes(document.type)) {
          continue;
        }
      }

      const docChunks = this.chunks.get(docId) ?? [];

      for (const chunk of docChunks) {
        const score = textSimilarity(query, chunk.content);

        if (score >= threshold) {
          results.push({
            chunk,
            document,
            score,
            highlights: this.extractHighlights(query, chunk.content),
          });
        }
      }
    }

    // Sort by score descending and limit
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  /**
   * Extract highlights from content based on query
   */
  private extractHighlights(query: string, content: string): string[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]+/);
    const highlights: string[] = [];

    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      if (queryWords.some((word) => sentenceLower.includes(word))) {
        highlights.push(sentence.trim());
      }
    }

    return highlights.slice(0, 3);
  }

  /**
   * Delete a document from the knowledge base
   */
  async deleteDocument(id: string): Promise<void> {
    if (!this.documents.has(id)) {
      throw new Error('Document not found');
    }

    this.documents.delete(id);
    this.chunks.delete(id);
  }

  /**
   * Update a document in the knowledge base
   */
  async updateDocument(
    id: string,
    updates: Partial<KnowledgeDocument>
  ): Promise<KnowledgeDocument> {
    const existing = this.documents.get(id);
    if (!existing) {
      throw new Error('Document not found');
    }

    const updated: KnowledgeDocument = {
      ...existing,
      ...updates,
      id: existing.id, // ID cannot be changed
      createdAt: existing.createdAt, // createdAt cannot be changed
      updatedAt: new Date(),
      metadata: {
        ...existing.metadata,
        ...(updates.metadata ?? {}),
      },
    };

    this.documents.set(id, updated);

    // Re-create chunks if content was updated
    if (updates.content) {
      const documentChunks = this.createChunks(updated);
      this.chunks.set(id, documentChunks);
    }

    return updated;
  }

  /**
   * Re-index a document
   */
  async reindexDocument(id: string): Promise<void> {
    const document = this.documents.get(id);
    if (!document) {
      throw new Error('Document not found');
    }

    // Set status to pending
    document.status = 'pending';
    this.documents.set(id, document);

    // Re-create chunks
    const documentChunks = this.createChunks(document);
    this.chunks.set(id, documentChunks);

    // Mark as indexed
    document.status = 'indexed';
    document.updatedAt = new Date();
    this.documents.set(id, document);
  }

  /**
   * Get statistics about the knowledge base
   */
  async getStats(): Promise<{
    documentCount: number;
    chunkCount: number;
    indexedCount: number;
    pendingCount: number;
    errorCount: number;
  }> {
    let chunkCount = 0;
    let indexedCount = 0;
    let pendingCount = 0;
    let errorCount = 0;

    for (const [docId, document] of this.documents) {
      const docChunks = this.chunks.get(docId) ?? [];
      chunkCount += docChunks.length;

      switch (document.status) {
        case 'indexed':
          indexedCount++;
          break;
        case 'pending':
        case 'processing':
          pendingCount++;
          break;
        case 'error':
          errorCount++;
          break;
      }
    }

    return {
      documentCount: this.documents.size,
      chunkCount,
      indexedCount,
      pendingCount,
      errorCount,
    };
  }
}
