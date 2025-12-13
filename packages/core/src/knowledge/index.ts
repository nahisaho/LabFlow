/**
 * Knowledge Module
 *
 * Requirements:
 * - KNOW-CORE-001: RAG integration
 * - KNOW-CORE-002: Document processing
 * - KNOW-GRAG-001: GraphRAG integration
 * - KNOW-GRAG-002: Entity extraction
 * - KNOW-GRAG-003: Relationship extraction
 * - KNOW-GRAG-004: Citation graph analysis
 */

// Types
export * from './types.js';

// Services
export { KnowledgeBase } from './knowledge-base.js';
export { DocumentProcessor } from './document-processor.js';
export { RAGService, type ScientificEntity, type EntityRelation, type QueryResponse, type SummaryResult } from './rag-service.js';

// Literature Search
export {
  LiteratureSearchService,
  createLiteratureSearchService,
  type LiteratureDomain,
  type PaperMetadata,
  type LiteraturePaper,
  type CitationNode,
  type LiteratureSearchResult,
  type LiteratureSearchQuery,
} from './literature-search.js';

// GraphRAG
export {
  GraphRAGService,
  createGraphRAGService,
  type GraphNodeType,
  type GraphNode,
  type GraphEdge,
  type KnowledgeGraph,
  type GraphQueryResult,
  type Community,
  type GraphRAGConfig,
} from './graphrag.js';

// Embedding Providers
export {
  createEmbeddingProvider,
  MockEmbeddingProvider,
  OllamaEmbeddingProvider,
  AzureSearchProvider,
  type EmbeddingProvider,
  type VectorSearchProvider,
  type SearchHit,
  type ProviderConfig,
} from './embedding-provider.js';

// Vector Store
export {
  createVectorStore,
  InMemoryVectorStore,
  type VectorStore,
  type VectorDocument,
  type VectorSearchRequest,
  type VectorSearchResult,
  type VectorStoreStats,
  type VectorStoreConfig,
} from './vector-store.js';

// Semantic Search
export {
  SemanticSearchService,
  type SemanticSearchConfig,
  type DocumentToIndex,
  type SearchOptions,
  type ContextOptions,
  type BuiltContext,
  type SemanticSearchStats,
} from './semantic-search.js';