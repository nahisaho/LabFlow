/**
 * Knowledge Module Types
 *
 * KNOW-CORE-001: RAG integration
 */

/**
 * Document type for knowledge base
 */
export type DocumentType =
  | 'paper'
  | 'protocol'
  | 'documentation'
  | 'tutorial'
  | 'workflow'
  | 'note';

/**
 * Processing status for documents
 */
export type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'indexed'
  | 'error';

/**
 * Knowledge document
 */
export interface KnowledgeDocument {
  id: string;
  title: string;
  type: DocumentType;
  content: string;
  metadata: DocumentMetadata;
  status: ProcessingStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Document metadata
 */
export interface DocumentMetadata {
  source?: string;
  authors?: string[];
  doi?: string;
  pubDate?: Date;
  tags?: string[];
  domain?: string;
  language?: string;
}

/**
 * Document chunk for embedding
 */
export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  metadata: ChunkMetadata;
}

/**
 * Chunk metadata
 */
export interface ChunkMetadata {
  pageNumber?: number;
  section?: string;
  position: number;
  charStart: number;
  charEnd: number;
}

/**
 * Search result from knowledge base
 */
export interface SearchResult {
  chunk: DocumentChunk;
  document: KnowledgeDocument;
  score: number;
  highlights?: string[];
}

/**
 * Query options for knowledge base search
 */
export interface QueryOptions {
  limit?: number;
  threshold?: number;
  domains?: string[];
  documentTypes?: DocumentType[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

/**
 * RAG context for AI interactions
 */
export interface RAGContext {
  query: string;
  results: SearchResult[];
  combinedContext: string;
  tokenCount: number;
}

/**
 * Embedding provider type
 */
export type EmbeddingProviderType = 'mock' | 'ollama' | 'azure-ai-search';

/**
 * Base embedding provider configuration
 */
export interface EmbeddingProviderConfig {
  type: EmbeddingProviderType;
  dimensions: number;
}

/**
 * Ollama embedding configuration
 */
export interface OllamaEmbeddingConfig extends EmbeddingProviderConfig {
  type: 'ollama';
  baseUrl: string;
  model: string;
  timeout?: number;
}

/**
 * Azure AI Search configuration
 */
export interface AzureSearchConfig extends EmbeddingProviderConfig {
  type: 'azure-ai-search';
  endpoint: string;
  apiKey: string;
  indexName: string;
  embeddingDeployment?: string;
}

/**
 * Mock embedding configuration (for testing)
 */
export interface MockEmbeddingConfig extends EmbeddingProviderConfig {
  type: 'mock';
}

/**
 * Embedding model configuration
 */
export interface EmbeddingConfig {
  model: string;
  dimensions: number;
  maxTokens: number;
}

/**
 * Vector store configuration
 */
export interface VectorStoreConfig {
  type: 'memory' | 'pgvector' | 'qdrant';
  connectionString?: string;
  collectionName: string;
}

/**
 * Knowledge base configuration
 */
export interface KnowledgeBaseConfig {
  embedding: EmbeddingConfig;
  vectorStore: VectorStoreConfig;
  chunkSize: number;
  chunkOverlap: number;
}

/**
 * Embedding result
 */
export interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
}

/**
 * Search request for vector stores
 */
export interface VectorSearchRequest {
  embedding: number[];
  limit: number;
  threshold?: number;
  filters?: Record<string, unknown>;
}

/**
 * Index document request
 */
export interface IndexDocumentRequest {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}
