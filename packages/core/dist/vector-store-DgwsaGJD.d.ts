/**
 * Knowledge Module Types
 *
 * KNOW-CORE-001: RAG integration
 */
/**
 * Document type for knowledge base
 */
type DocumentType = 'paper' | 'protocol' | 'documentation' | 'tutorial' | 'workflow' | 'note';
/**
 * Processing status for documents
 */
type ProcessingStatus = 'pending' | 'processing' | 'indexed' | 'error';
/**
 * Knowledge document
 */
interface KnowledgeDocument {
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
interface DocumentMetadata {
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
interface DocumentChunk {
    id: string;
    documentId: string;
    content: string;
    embedding?: number[];
    metadata: ChunkMetadata;
}
/**
 * Chunk metadata
 */
interface ChunkMetadata {
    pageNumber?: number;
    section?: string;
    position: number;
    charStart: number;
    charEnd: number;
}
/**
 * Search result from knowledge base
 */
interface SearchResult {
    chunk: DocumentChunk;
    document: KnowledgeDocument;
    score: number;
    highlights?: string[];
}
/**
 * Query options for knowledge base search
 */
interface QueryOptions {
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
interface RAGContext {
    query: string;
    results: SearchResult[];
    combinedContext: string;
    tokenCount: number;
}
/**
 * Embedding provider type
 */
type EmbeddingProviderType = 'mock' | 'ollama' | 'azure-ai-search';
/**
 * Base embedding provider configuration
 */
interface EmbeddingProviderConfig {
    type: EmbeddingProviderType;
    dimensions: number;
}
/**
 * Ollama embedding configuration
 */
interface OllamaEmbeddingConfig extends EmbeddingProviderConfig {
    type: 'ollama';
    baseUrl: string;
    model: string;
    timeout?: number;
}
/**
 * Azure AI Search configuration
 */
interface AzureSearchConfig extends EmbeddingProviderConfig {
    type: 'azure-ai-search';
    endpoint: string;
    apiKey: string;
    indexName: string;
    embeddingDeployment?: string;
}
/**
 * Mock embedding configuration (for testing)
 */
interface MockEmbeddingConfig extends EmbeddingProviderConfig {
    type: 'mock';
}
/**
 * Embedding model configuration
 */
interface EmbeddingConfig {
    model: string;
    dimensions: number;
    maxTokens: number;
}
/**
 * Vector store configuration
 */
interface VectorStoreConfig$1 {
    type: 'memory' | 'pgvector' | 'qdrant';
    connectionString?: string;
    collectionName: string;
}
/**
 * Knowledge base configuration
 */
interface KnowledgeBaseConfig {
    embedding: EmbeddingConfig;
    vectorStore: VectorStoreConfig$1;
    chunkSize: number;
    chunkOverlap: number;
}
/**
 * Embedding result
 */
interface EmbeddingResult {
    embedding: number[];
    tokenCount: number;
}
/**
 * Search request for vector stores
 */
interface VectorSearchRequest$1 {
    embedding: number[];
    limit: number;
    threshold?: number;
    filters?: Record<string, unknown>;
}
/**
 * Index document request
 */
interface IndexDocumentRequest {
    id: string;
    content: string;
    embedding: number[];
    metadata: Record<string, unknown>;
}

/**
 * Knowledge Base
 *
 * KNOW-CORE-001: RAG integration
 */

/**
 * Knowledge base for document storage and retrieval
 */
declare class KnowledgeBase {
    private config;
    private documents;
    private chunks;
    constructor(config: KnowledgeBaseConfig);
    /**
     * Add a document to the knowledge base
     */
    addDocument(document: Omit<KnowledgeDocument, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeDocument>;
    /**
     * Create chunks from a document
     */
    private createChunks;
    /**
     * Get a document by ID
     */
    getDocument(id: string): Promise<KnowledgeDocument | null>;
    /**
     * Search the knowledge base
     */
    search(query: string, options?: QueryOptions): Promise<SearchResult[]>;
    /**
     * Extract highlights from content based on query
     */
    private extractHighlights;
    /**
     * Delete a document from the knowledge base
     */
    deleteDocument(id: string): Promise<void>;
    /**
     * Update a document in the knowledge base
     */
    updateDocument(id: string, updates: Partial<KnowledgeDocument>): Promise<KnowledgeDocument>;
    /**
     * Re-index a document
     */
    reindexDocument(id: string): Promise<void>;
    /**
     * Get statistics about the knowledge base
     */
    getStats(): Promise<{
        documentCount: number;
        chunkCount: number;
        indexedCount: number;
        pendingCount: number;
        errorCount: number;
    }>;
}

/**
 * Document Processor
 *
 * KNOW-CORE-002: Document processing
 * DATA-DOC-001 to DATA-DOC-012: Document preprocessing requirements
 */

/**
 * Options for document chunking
 */
interface ChunkOptions {
    chunkSize: number;
    chunkOverlap: number;
    preserveParagraphs?: boolean;
    maxCharacters?: number;
    combineTextUnderNChars?: number;
}
/**
 * Document element extracted from content
 */
interface DocumentElement {
    type: 'Title' | 'NarrativeText' | 'Table' | 'ListItem' | 'Image';
    text: string;
    metadata?: {
        page?: number;
        section?: string;
        coordinates?: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    };
}
/**
 * Email metadata structure
 */
interface EmailMetadata {
    subject: string;
    from?: string;
    to?: string[];
    cc?: string[];
    date?: Date;
    attachments?: string[];
}
/**
 * Document map structure (DATA-DOC-005)
 */
interface DocumentMap {
    filename: string;
    pages: number;
    elements: DocumentElement[];
    tableCount: number;
    imageCount: number;
    processedAt: Date;
}
/**
 * Partial content result (DATA-DOC-012)
 */
interface PartialContentResult {
    elements: DocumentElement[];
    error: string;
    recoveredElements: number;
    isPartial: boolean;
}
/**
 * Document processor for chunking and preparing documents
 */
declare class DocumentProcessor {
    private options;
    constructor(options?: Partial<ChunkOptions>);
    /**
     * Get list of supported formats (DATA-DOC-001)
     */
    getSupportedFormats(): string[];
    /**
     * Check if a format is supported
     */
    isSupported(format: string): boolean;
    /**
     * Detect format from filename
     */
    detectFormat(filename: string): string | null;
    /**
     * Extract text from content (DATA-DOC-004)
     */
    extractText(content: string | Buffer, mimeType: string): Promise<{
        text: string;
        elements: DocumentElement[];
    }>;
    /**
     * Parse markdown content into elements
     */
    private parseMarkdown;
    /**
     * Chunk by title boundaries (DATA-DOC-006)
     */
    chunkByTitle(elements: DocumentElement[], documentId: string): Promise<DocumentChunk[]>;
    /**
     * Combine small chunks under threshold
     */
    private combineSmallChunks;
    /**
     * Preserve table format as HTML (DATA-DOC-008)
     */
    preserveTableFormat(tableData: {
        headers: string[];
        rows: string[][];
    }): string;
    /**
     * Extract email metadata (DATA-DOC-009)
     */
    extractEmailMetadata(emailContent: string): Promise<EmailMetadata>;
    /**
     * Validate token count (DATA-DOC-010)
     * Approximate: 1 token ≈ 4 characters
     */
    validateTokenCount(content: string, limit?: number): boolean;
    /**
     * Generate standardized JSON document map (DATA-DOC-005)
     */
    generateDocumentMap(elements: DocumentElement[], metadata: {
        filename: string;
        pages: number;
    }): DocumentMap;
    /**
     * Handle partial content on error (DATA-DOC-012)
     */
    handlePartialContent(elements: DocumentElement[], errorInfo: {
        error: string;
        recoveredElements: number;
    }): PartialContentResult;
    /**
     * Process a document end-to-end
     */
    processDocument(content: string, format: string, documentId: string, options?: Partial<ChunkOptions>): Promise<DocumentChunk[]>;
    /**
     * Chunk content by paragraph boundaries
     */
    private chunkByParagraphs;
    /**
     * Chunk content by fixed size
     */
    private chunkBySize;
    /**
     * Create a document chunk
     */
    private createChunk;
}

/**
 * RAG Service
 *
 * KNOW-CORE-001: RAG integration
 * KNOW-GRAG-001 to KNOW-GRAG-003: GraphRAG requirements
 */

/**
 * Entity extracted from text (KNOW-GRAG-002)
 */
interface ScientificEntity {
    name: string;
    type: 'compound' | 'protein' | 'gene' | 'disease' | 'author' | 'other';
    position?: {
        start: number;
        end: number;
    };
    confidence?: number;
}
/**
 * Relation between entities (KNOW-GRAG-003)
 */
interface EntityRelation {
    source: ScientificEntity;
    target: ScientificEntity;
    type: 'inhibits' | 'activates' | 'binds' | 'treats' | 'causes' | 'related';
    confidence?: number;
}
/**
 * Query response with citations
 */
interface QueryResponse {
    answer: string;
    sources: Array<{
        documentId: string;
        title: string;
        excerpt: string;
        score: number;
    }>;
    confidence: number;
}
/**
 * Summary result
 */
interface SummaryResult {
    text: string;
    keyPoints: string[];
    sourceCount: number;
}
/**
 * RAG (Retrieval-Augmented Generation) service
 */
declare class RAGService {
    private knowledgeBase;
    private maxContextTokens;
    constructor(knowledgeBase: KnowledgeBase, maxContextTokens?: number);
    /**
     * Generate embedding vector for text
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Simple hash-based embedding for testing
     * In production, this would call text-embedding-ada-002 or similar
     */
    private simpleEmbedding;
    /**
     * Generate embeddings for multiple texts
     */
    generateEmbeddingBatch(texts: string[]): Promise<number[][]>;
    /**
     * Compute cosine similarity between two vectors
     */
    computeSimilarity(vec1: number[], vec2: number[]): number;
    /**
     * Build RAG context for a query
     */
    buildContext(query: string, options?: QueryOptions): Promise<RAGContext>;
    /**
     * Combine search results into a single context string
     */
    private combineResults;
    /**
     * Format a search result for inclusion in context
     */
    private formatResultForContext;
    /**
     * Estimate token count for text (rough approximation)
     */
    private estimateTokens;
    /**
     * Extract scientific entities from text (KNOW-GRAG-002)
     */
    extractEntities(text: string): Promise<ScientificEntity[]>;
    /**
     * Extract relations between entities (KNOW-GRAG-003)
     */
    extractRelations(text: string, entities: ScientificEntity[]): Promise<EntityRelation[]>;
    /**
     * Perform RAG query with context
     */
    query(question: string, searchResults: SearchResult[]): Promise<QueryResponse>;
    /**
     * Rerank search results by relevance
     */
    rerank(query: string, results: SearchResult[]): Promise<SearchResult[]>;
    /**
     * Generate summary of search results
     */
    summarize(results: SearchResult[]): Promise<SummaryResult>;
    /**
     * Generate a prompt with RAG context
     */
    buildPrompt(userQuery: string, context: RAGContext, systemPrompt?: string): string;
}

/**
 * Vector Store
 *
 * KNOW-CORE-001: Vector storage for semantic search
 * Supports in-memory (dev/test) and production backends
 */
/**
 * Vector document structure
 */
interface VectorDocument {
    id: string;
    content: string;
    embedding: number[];
    metadata: Record<string, unknown>;
}
/**
 * Search request parameters
 */
interface VectorSearchRequest {
    embedding: number[];
    limit: number;
    threshold?: number;
    filter?: Record<string, unknown>;
}
/**
 * Search result
 */
interface VectorSearchResult {
    id: string;
    content: string;
    score: number;
    metadata: Record<string, unknown>;
}
/**
 * Vector store statistics
 */
interface VectorStoreStats {
    documentCount: number;
    dimensions: number | null;
}
/**
 * Vector store configuration
 */
interface VectorStoreConfig {
    type: 'memory' | 'pgvector' | 'qdrant';
    connectionString?: string;
    collectionName?: string;
}
/**
 * Vector store interface
 */
interface VectorStore {
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
declare function createVectorStore(config: VectorStoreConfig): VectorStore;
/**
 * In-memory vector store for development and testing
 */
declare class InMemoryVectorStore implements VectorStore {
    private documents;
    addDocument(doc: VectorDocument): Promise<void>;
    addDocuments(docs: VectorDocument[]): Promise<void>;
    getDocument(id: string): Promise<VectorDocument | null>;
    deleteDocument(id: string): Promise<void>;
    search(request: VectorSearchRequest): Promise<VectorSearchResult[]>;
    clear(): Promise<void>;
    getStats(): Promise<VectorStoreStats>;
    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity;
    /**
     * Check if document metadata matches filter
     */
    private matchesFilter;
}

export { type AzureSearchConfig as A, type ChunkMetadata as C, DocumentProcessor as D, type EntityRelation as E, type IndexDocumentRequest as I, KnowledgeBase as K, type MockEmbeddingConfig as M, type OllamaEmbeddingConfig as O, type ProcessingStatus as P, type QueryResponse as Q, RAGService as R, type ScientificEntity as S, type VectorSearchRequest$1 as V, type EmbeddingResult as a, type VectorStore as b, type VectorSearchResult as c, type SummaryResult as d, createVectorStore as e, InMemoryVectorStore as f, type VectorDocument as g, type VectorSearchRequest as h, type VectorStoreStats as i, type VectorStoreConfig as j, type DocumentType as k, type KnowledgeDocument as l, type DocumentMetadata as m, type DocumentChunk as n, type SearchResult as o, type QueryOptions as p, type RAGContext as q, type EmbeddingProviderType as r, type EmbeddingProviderConfig as s, type EmbeddingConfig as t, type KnowledgeBaseConfig as u };
