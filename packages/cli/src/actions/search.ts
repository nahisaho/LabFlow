/**
 * Search Action
 *
 * Semantic search using LabFlow knowledge base
 */

import {
  SemanticSearchService,
  createEmbeddingProvider,
  createVectorStore,
  KnowledgeBase,
  LiteratureSearchService,
  type LiteratureDomain,
  type LiteraturePaper,
} from '@labflow/core/knowledge';

export interface SearchDocumentOptions {
  limit?: number;
  domain?: string;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

// Singleton search service
let searchService: SemanticSearchService | null = null;

/**
 * Get or create search service
 */
function getSearchService(): SemanticSearchService {
  if (!searchService) {
    // Use mock provider for now (can be switched to Ollama/Azure in production)
    const embeddingProvider = createEmbeddingProvider({
      type: 'mock',
      dimensions: 384,
    });
    const vectorStore = createVectorStore({ type: 'memory' });

    searchService = new SemanticSearchService({
      embeddingProvider,
      vectorStore,
    });
  }
  return searchService;
}

/**
 * Search documents using semantic search
 */
export async function searchDocuments(
  query: string,
  options: SearchDocumentOptions = {}
): Promise<SearchResult[]> {
  const service = getSearchService();

  const results = await service.search(query, {
    limit: options.limit ?? 10,
    filter: options.domain ? { domain: options.domain } : undefined,
  });

  return results.map((result) => ({
    id: result.id,
    content: result.content,
    score: result.score,
    metadata: result.metadata,
  }));
}

/**
 * Index a document for search
 */
export async function indexDocument(
  id: string,
  content: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const service = getSearchService();

  await service.indexDocument({
    id,
    content,
    metadata,
  });
}

/**
 * Index multiple documents
 */
export async function indexDocuments(
  documents: Array<{
    id: string;
    content: string;
    metadata?: Record<string, unknown>;
  }>
): Promise<void> {
  const service = getSearchService();

  await service.indexDocuments(
    documents.map((doc) => ({
      id: doc.id,
      content: doc.content,
      metadata: doc.metadata ?? {},
    }))
  );
}

// ============================================
// Literature Search (GraphRAG integration)
// ============================================

export interface LiteratureSearchOptions {
  domain?: LiteratureDomain;
  yearRange?: { start?: number; end?: number };
  minCitations?: number;
  limit?: number;
}

export interface LiteratureSearchResult {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  domain?: LiteratureDomain;
  citations?: number;
  score: number;
  highlights: string[];
}

// Singleton literature search service
let literatureService: LiteratureSearchService | null = null;

/**
 * Get or create literature search service
 */
function getLiteratureSearchService(): LiteratureSearchService {
  if (!literatureService) {
    const knowledgeBase = new KnowledgeBase({
      embedding: {
        model: 'text-embedding-mock',
        dimensions: 384,
        maxTokens: 8191,
      },
      vectorStore: {
        type: 'memory',
        collectionName: 'literature',
      },
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    literatureService = new LiteratureSearchService(knowledgeBase);
  }
  return literatureService;
}

/**
 * Search scientific literature
 */
export async function searchLiterature(
  query: string,
  options: LiteratureSearchOptions = {}
): Promise<LiteratureSearchResult[]> {
  const service = getLiteratureSearchService();

  const results = await service.search({
    query,
    domain: options.domain,
    yearRange: options.yearRange,
    minCitations: options.minCitations,
    limit: options.limit ?? 10,
  });

  return results.map((result) => ({
    id: result.paper.id,
    title: result.paper.title,
    authors: result.paper.metadata.authors,
    year: result.paper.metadata.year,
    domain: result.paper.metadata.domain,
    citations: result.paper.metadata.citations,
    score: result.score,
    highlights: result.highlights ?? [],
  }));
}

/**
 * Search literature by domain
 */
export async function searchLiteratureByDomain(
  domain: LiteratureDomain,
  query: string,
  limit = 10
): Promise<LiteratureSearchResult[]> {
  const service = getLiteratureSearchService();

  const results = await service.searchByDomain(domain, query, limit);

  return results.map((result) => ({
    id: result.paper.id,
    title: result.paper.title,
    authors: result.paper.metadata.authors,
    year: result.paper.metadata.year,
    domain: result.paper.metadata.domain,
    citations: result.paper.metadata.citations,
    score: result.score,
    highlights: result.highlights ?? [],
  }));
}

/**
 * Add a paper to the literature database
 */
export async function addLiteraturePaper(paper: LiteraturePaper): Promise<void> {
  const service = getLiteratureSearchService();
  await service.addPaper(paper);
}

/**
 * Get literature statistics
 */
export function getLiteratureStats(): {
  totalPapers: number;
  papersByDomain: Record<LiteratureDomain, number>;
  totalEntities: number;
} {
  const service = getLiteratureSearchService();
  return service.getStats();
}

/**
 * Get papers by domain
 */
export function getPapersByDomain(domain: LiteratureDomain): LiteraturePaper[] {
  const service = getLiteratureSearchService();
  return service.getPapersByDomain(domain);
}
