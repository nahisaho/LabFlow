import { K as KnowledgeBase, S as ScientificEntity, E as EntityRelation, O as OllamaEmbeddingConfig, A as AzureSearchConfig, M as MockEmbeddingConfig, a as EmbeddingResult, I as IndexDocumentRequest, V as VectorSearchRequest, b as VectorStore, c as VectorSearchResult } from '../vector-store-DgwsaGJD.js';
export { C as ChunkMetadata, n as DocumentChunk, m as DocumentMetadata, D as DocumentProcessor, k as DocumentType, t as EmbeddingConfig, s as EmbeddingProviderConfig, r as EmbeddingProviderType, f as InMemoryVectorStore, u as KnowledgeBaseConfig, l as KnowledgeDocument, P as ProcessingStatus, p as QueryOptions, Q as QueryResponse, q as RAGContext, R as RAGService, o as SearchResult, d as SummaryResult, g as VectorDocument, h as VectorSearchRequest, j as VectorStoreConfig, i as VectorStoreStats, e as createVectorStore } from '../vector-store-DgwsaGJD.js';

/**
 * Literature Search Service
 *
 * KNOW-GRAG-001: GraphRAG integration for scientific literature
 * KNOW-GRAG-002: Entity extraction from papers
 * KNOW-GRAG-004: Citation graph analysis
 * KNOW-GRAG-005: Literature search by domain
 */

/**
 * Literature search domains
 */
type LiteratureDomain = 'drug-discovery' | 'materials-science' | 'climate' | 'genomics' | 'chemistry' | 'physics' | 'biology' | 'general';
/**
 * Paper metadata
 */
interface PaperMetadata {
    doi?: string;
    arxivId?: string;
    pmid?: string;
    authors: string[];
    journal?: string;
    year?: number;
    abstract?: string;
    keywords?: string[];
    citations?: number;
    domain?: LiteratureDomain;
}
/**
 * Literature paper document
 */
interface LiteraturePaper {
    id: string;
    title: string;
    content: string;
    metadata: PaperMetadata;
    entities?: ScientificEntity[];
    relations?: EntityRelation[];
}
/**
 * Citation graph node
 */
interface CitationNode {
    paperId: string;
    title: string;
    year?: number;
    citedBy: string[];
    cites: string[];
    citationCount: number;
}
/**
 * Literature search result
 */
interface LiteratureSearchResult {
    paper: LiteraturePaper;
    score: number;
    highlights?: string[];
    relatedPapers?: LiteraturePaper[];
}
/**
 * Search query with filters
 */
interface LiteratureSearchQuery {
    query: string;
    domain?: LiteratureDomain;
    yearRange?: {
        start?: number;
        end?: number;
    };
    authors?: string[];
    journals?: string[];
    keywords?: string[];
    minCitations?: number;
    limit?: number;
}
/**
 * Literature Search Service
 *
 * Provides domain-specific scientific literature search with
 * entity extraction and citation analysis
 */
declare class LiteratureSearchService {
    private knowledgeBase;
    private ragService;
    private papers;
    private citationGraph;
    private domainIndex;
    constructor(knowledgeBase: KnowledgeBase);
    /**
     * Add a paper to the literature database
     */
    addPaper(paper: LiteraturePaper): Promise<void>;
    /**
     * Add multiple papers
     */
    addPapers(papers: LiteraturePaper[]): Promise<void>;
    /**
     * Search for papers
     */
    search(searchQuery: LiteratureSearchQuery): Promise<LiteratureSearchResult[]>;
    /**
     * Simple text search fallback (for testing/demo without embeddings)
     */
    private simpleTextSearch;
    /**
     * Search by domain
     */
    searchByDomain(domain: LiteratureDomain, query: string, limit?: number): Promise<LiteratureSearchResult[]>;
    /**
     * Find papers citing a specific paper
     */
    findCitingPapers(paperId: string): Promise<LiteraturePaper[]>;
    /**
     * Find papers cited by a specific paper
     */
    findCitedPapers(paperId: string): Promise<LiteraturePaper[]>;
    /**
     * Find related papers using entity overlap and citations
     */
    findRelatedPapers(paperId: string, limit?: number): Promise<LiteraturePaper[]>;
    /**
     * Get citation graph for a paper
     */
    getCitationNode(paperId: string): CitationNode | undefined;
    /**
     * Get papers by domain
     */
    getPapersByDomain(domain: LiteratureDomain): LiteraturePaper[];
    /**
     * Get all entities across papers
     */
    getAllEntities(): ScientificEntity[];
    /**
     * Find papers mentioning a specific entity
     */
    findPapersByEntity(entityName: string): LiteraturePaper[];
    /**
     * Get service statistics
     */
    getStats(): {
        totalPapers: number;
        papersByDomain: Record<LiteratureDomain, number>;
        totalEntities: number;
        citationNodes: number;
    };
    /**
     * Detect domain from paper content and metadata
     */
    private detectDomain;
    /**
     * Update citation graph for a paper
     */
    private updateCitationGraph;
    /**
     * Add citation relationship
     */
    addCitation(citingPaperId: string, citedPaperId: string): void;
    /**
     * Build filters for knowledge base query
     */
    private buildFilters;
    /**
     * Extract highlights from content matching query
     */
    private extractHighlights;
}
/**
 * Create literature search service
 */
declare function createLiteratureSearchService(knowledgeBase: KnowledgeBase): LiteratureSearchService;

/**
 * GraphRAG Service
 *
 * KNOW-GRAG-001: GraphRAG integration
 * KNOW-GRAG-002: Entity extraction
 * KNOW-GRAG-003: Relationship extraction
 * KNOW-GRAG-004: Citation graph analysis
 */

/**
 * Graph node types
 */
type GraphNodeType = 'paper' | 'entity' | 'author' | 'journal' | 'topic';
/**
 * Graph node
 */
interface GraphNode {
    id: string;
    type: GraphNodeType;
    label: string;
    properties: Record<string, unknown>;
    embedding?: number[];
}
/**
 * Graph edge
 */
interface GraphEdge {
    id: string;
    source: string;
    target: string;
    type: string;
    weight: number;
    properties?: Record<string, unknown>;
}
/**
 * Knowledge graph
 */
interface KnowledgeGraph {
    nodes: Map<string, GraphNode>;
    edges: Map<string, GraphEdge>;
}
/**
 * Graph query result
 */
interface GraphQueryResult {
    nodes: GraphNode[];
    edges: GraphEdge[];
    paths?: GraphNode[][];
}
/**
 * Community detection result
 */
interface Community {
    id: string;
    nodes: string[];
    topic?: string;
    keyTerms: string[];
}
/**
 * GraphRAG configuration
 */
interface GraphRAGConfig {
    maxHops?: number;
    minEdgeWeight?: number;
    communityResolution?: number;
}
/**
 * GraphRAG Service
 *
 * Implements GraphRAG pattern for knowledge graph construction and querying
 */
declare class GraphRAGService {
    private graph;
    private communities;
    private config;
    constructor(config?: GraphRAGConfig);
    /**
     * Add a paper to the knowledge graph
     */
    addPaper(paper: LiteraturePaper): void;
    /**
     * Add citation edge between papers
     */
    addCitation(citingPaperId: string, citedPaperId: string): void;
    /**
     * Query the knowledge graph
     */
    query(startNodeId: string, maxHops?: number): GraphQueryResult;
    /**
     * Find shortest path between two nodes
     */
    findPath(sourceId: string, targetId: string): GraphNode[] | null;
    /**
     * Get neighbors of a node
     */
    getNeighbors(nodeId: string): GraphNode[];
    /**
     * Find nodes by type
     */
    getNodesByType(type: GraphNodeType): GraphNode[];
    /**
     * Find edges by type
     */
    getEdgesByType(type: string): GraphEdge[];
    /**
     * Get the most connected nodes (by degree centrality)
     */
    getTopNodes(limit?: number): Array<{
        node: GraphNode;
        degree: number;
    }>;
    /**
     * Detect communities using label propagation
     */
    detectCommunities(): Community[];
    /**
     * Extract key terms from a set of nodes
     */
    private extractKeyTerms;
    /**
     * Get graph statistics
     */
    getStats(): {
        nodeCount: number;
        edgeCount: number;
        nodesByType: Record<GraphNodeType, number>;
        avgDegree: number;
    };
    /**
     * Export graph to serializable format
     */
    exportGraph(): {
        nodes: GraphNode[];
        edges: GraphEdge[];
    };
    /**
     * Import graph from serialized format
     */
    importGraph(data: {
        nodes: GraphNode[];
        edges: GraphEdge[];
    }): void;
    /**
     * Normalize ID for consistent lookup
     */
    private normalizeId;
}
/**
 * Create GraphRAG service
 */
declare function createGraphRAGService(config?: GraphRAGConfig): GraphRAGService;

/**
 * Embedding Provider Interface
 *
 * KNOW-CORE-001: Extensible embedding provider abstraction
 * Supports Ollama (development) and Azure AI Search (production)
 */

/**
 * Embedding provider interface
 */
interface EmbeddingProvider {
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
interface VectorSearchProvider extends EmbeddingProvider {
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
interface SearchHit {
    id: string;
    score: number;
    content: string;
    metadata: Record<string, unknown>;
}
/**
 * Provider factory type
 */
type ProviderConfig = OllamaEmbeddingConfig | AzureSearchConfig | MockEmbeddingConfig;
/**
 * Create embedding provider from configuration
 */
declare function createEmbeddingProvider(config: ProviderConfig): EmbeddingProvider;
/**
 * Mock embedding provider for testing
 */
declare class MockEmbeddingProvider implements EmbeddingProvider {
    readonly type = "mock";
    readonly dimensions: number;
    constructor(config: MockEmbeddingConfig);
    generateEmbedding(text: string): Promise<EmbeddingResult>;
    generateEmbeddingBatch(texts: string[]): Promise<EmbeddingResult[]>;
    isAvailable(): Promise<boolean>;
    private hashToEmbedding;
}
/**
 * Ollama embedding provider for local development
 */
declare class OllamaEmbeddingProvider implements EmbeddingProvider {
    readonly type = "ollama";
    readonly dimensions: number;
    private readonly baseUrl;
    private readonly model;
    private readonly timeout;
    constructor(config: OllamaEmbeddingConfig);
    generateEmbedding(text: string): Promise<EmbeddingResult>;
    generateEmbeddingBatch(texts: string[]): Promise<EmbeddingResult[]>;
    isAvailable(): Promise<boolean>;
    private callOllama;
}
/**
 * Azure AI Search provider for production
 */
declare class AzureSearchProvider implements VectorSearchProvider {
    readonly type = "azure-ai-search";
    readonly dimensions: number;
    private readonly endpoint;
    private readonly apiKey;
    private readonly indexName;
    private readonly embeddingDeployment?;
    constructor(config: AzureSearchConfig);
    generateEmbedding(text: string): Promise<EmbeddingResult>;
    generateEmbeddingBatch(texts: string[]): Promise<EmbeddingResult[]>;
    isAvailable(): Promise<boolean>;
    indexDocument(request: IndexDocumentRequest): Promise<void>;
    indexDocuments(requests: IndexDocumentRequest[]): Promise<void>;
    search(request: VectorSearchRequest): Promise<SearchHit[]>;
    deleteDocument(id: string): Promise<void>;
    clearIndex(): Promise<void>;
    private generateAzureOpenAIEmbedding;
    private generateAzureOpenAIEmbeddingBatch;
}

/**
 * Semantic Search Service
 *
 * KNOW-CORE-001: Unified semantic search with embedding providers and vector stores
 * Supports Ollama (development) and Azure AI Search (production)
 */

/**
 * Document to index
 */
interface DocumentToIndex {
    id: string;
    content: string;
    metadata: Record<string, unknown>;
    chunkSize?: number;
    chunkOverlap?: number;
}
/**
 * Search options
 */
interface SearchOptions {
    limit: number;
    threshold?: number;
    filter?: Record<string, unknown>;
}
/**
 * Context build options
 */
interface ContextOptions extends SearchOptions {
    maxTokens?: number;
}
/**
 * Built context result
 */
interface BuiltContext {
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
interface SemanticSearchStats {
    documentCount: number;
    dimensions: number | null;
    providerType: string;
}
/**
 * Semantic search service configuration
 */
interface SemanticSearchConfig {
    embeddingProvider: EmbeddingProvider;
    vectorStore: VectorStore;
}
/**
 * Semantic Search Service
 *
 * Integrates embedding providers with vector stores for semantic search
 */
declare class SemanticSearchService {
    private readonly embeddingProvider;
    private readonly vectorStore;
    private readonly documentChunks;
    constructor(config: SemanticSearchConfig);
    /**
     * Index a single document
     */
    indexDocument(doc: DocumentToIndex): Promise<void>;
    /**
     * Index multiple documents in batch
     */
    indexDocuments(docs: DocumentToIndex[]): Promise<void>;
    /**
     * Search for similar documents
     */
    search(query: string, options: SearchOptions): Promise<VectorSearchResult[]>;
    /**
     * Delete a document and all its chunks
     */
    deleteDocument(docId: string): Promise<void>;
    /**
     * Update an existing document
     */
    updateDocument(doc: DocumentToIndex): Promise<void>;
    /**
     * Build context for RAG from search results
     */
    buildContext(query: string, options: ContextOptions): Promise<BuiltContext>;
    /**
     * Get service statistics
     */
    getStats(): Promise<SemanticSearchStats>;
    /**
     * Check if the service is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Chunk content into smaller pieces
     */
    private chunkContent;
}

export { AzureSearchConfig, AzureSearchProvider, type BuiltContext, type CitationNode, type Community, type ContextOptions, type DocumentToIndex, type EmbeddingProvider, EmbeddingResult, EntityRelation, type GraphEdge, type GraphNode, type GraphNodeType, type GraphQueryResult, type GraphRAGConfig, GraphRAGService, IndexDocumentRequest, KnowledgeBase, type KnowledgeGraph, type LiteratureDomain, type LiteraturePaper, type LiteratureSearchQuery, type LiteratureSearchResult, LiteratureSearchService, MockEmbeddingConfig, MockEmbeddingProvider, OllamaEmbeddingConfig, OllamaEmbeddingProvider, type PaperMetadata, type ProviderConfig, ScientificEntity, type SearchHit, type SearchOptions, type SemanticSearchConfig, SemanticSearchService, type SemanticSearchStats, type VectorSearchProvider, VectorSearchResult, VectorStore, createEmbeddingProvider, createGraphRAGService, createLiteratureSearchService };
