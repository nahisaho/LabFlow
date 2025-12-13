/**
 * Literature Search Service
 *
 * KNOW-GRAG-001: GraphRAG integration for scientific literature
 * KNOW-GRAG-002: Entity extraction from papers
 * KNOW-GRAG-004: Citation graph analysis
 * KNOW-GRAG-005: Literature search by domain
 */

import type { KnowledgeDocument, SearchResult, QueryOptions } from './types.js';
import { KnowledgeBase } from './knowledge-base.js';
import { RAGService, type ScientificEntity, type EntityRelation } from './rag-service.js';

/**
 * Literature search domains
 */
export type LiteratureDomain =
  | 'drug-discovery'
  | 'materials-science'
  | 'climate'
  | 'genomics'
  | 'chemistry'
  | 'physics'
  | 'biology'
  | 'general';

/**
 * Paper metadata
 */
export interface PaperMetadata {
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
export interface LiteraturePaper {
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
export interface CitationNode {
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
export interface LiteratureSearchResult {
  paper: LiteraturePaper;
  score: number;
  highlights?: string[];
  relatedPapers?: LiteraturePaper[];
}

/**
 * Search query with filters
 */
export interface LiteratureSearchQuery {
  query: string;
  domain?: LiteratureDomain;
  yearRange?: { start?: number; end?: number };
  authors?: string[];
  journals?: string[];
  keywords?: string[];
  minCitations?: number;
  limit?: number;
}

/**
 * Domain keywords for classification
 */
const DOMAIN_KEYWORDS: Record<LiteratureDomain, string[]> = {
  'drug-discovery': [
    'drug', 'pharmaceutical', 'compound', 'target', 'binding',
    'ADMET', 'toxicity', 'efficacy', 'clinical', 'therapeutic',
    '薬物', '医薬品', '化合物', '標的', '結合', '毒性',
  ],
  'materials-science': [
    'material', 'crystal', 'polymer', 'metal', 'alloy',
    'bandgap', 'conductivity', 'semiconductor', 'nanoparticle',
    '材料', '結晶', 'ポリマー', '金属', '合金', '半導体',
  ],
  climate: [
    'climate', 'weather', 'temperature', 'carbon', 'emission',
    'atmosphere', 'ocean', 'precipitation', 'warming',
    '気候', '天気', '温度', '炭素', '排出', '大気',
  ],
  genomics: [
    'gene', 'genome', 'DNA', 'RNA', 'protein', 'sequence',
    'mutation', 'expression', 'transcription', 'CRISPR',
    '遺伝子', 'ゲノム', 'タンパク質', '配列', '変異',
  ],
  chemistry: [
    'molecule', 'reaction', 'synthesis', 'catalyst', 'bond',
    'organic', 'inorganic', 'spectroscopy', 'NMR',
    '分子', '反応', '合成', '触媒', '結合',
  ],
  physics: [
    'quantum', 'particle', 'energy', 'wave', 'field',
    'relativity', 'thermodynamics', 'mechanics',
    '量子', '粒子', 'エネルギー', '波動', '場',
  ],
  biology: [
    'cell', 'organism', 'evolution', 'ecology', 'species',
    'metabolism', 'enzyme', 'pathway', 'tissue',
    '細胞', '生物', '進化', '生態', '代謝',
  ],
  general: [],
};

/**
 * Literature Search Service
 *
 * Provides domain-specific scientific literature search with
 * entity extraction and citation analysis
 */
export class LiteratureSearchService {
  private knowledgeBase: KnowledgeBase;
  private ragService: RAGService;
  private papers: Map<string, LiteraturePaper> = new Map();
  private citationGraph: Map<string, CitationNode> = new Map();
  private domainIndex: Map<LiteratureDomain, Set<string>> = new Map();

  constructor(knowledgeBase: KnowledgeBase) {
    this.knowledgeBase = knowledgeBase;
    this.ragService = new RAGService(knowledgeBase);

    // Initialize domain index
    for (const domain of Object.keys(DOMAIN_KEYWORDS) as LiteratureDomain[]) {
      this.domainIndex.set(domain, new Set());
    }
  }

  /**
   * Add a paper to the literature database
   */
  async addPaper(paper: LiteraturePaper): Promise<void> {
    // Extract entities if not already present
    if (!paper.entities) {
      paper.entities = await this.ragService.extractEntities(paper.content);
    }

    // Detect domain if not specified
    if (!paper.metadata.domain) {
      paper.metadata.domain = this.detectDomain(paper);
    }

    // Store paper
    this.papers.set(paper.id, paper);

    // Update domain index
    const domain = paper.metadata.domain;
    const domainPapers = this.domainIndex.get(domain);
    if (domainPapers) {
      domainPapers.add(paper.id);
    }

    // Add to knowledge base
    const now = new Date();
    const document: KnowledgeDocument = {
      id: paper.id,
      title: paper.title,
      content: paper.content,
      type: 'paper',
      metadata: {
        ...paper.metadata,
        // entities are stored separately in paper
      },
      status: 'indexed',
      createdAt: now,
      updatedAt: now,
    };

    await this.knowledgeBase.addDocument(document);

    // Update citation graph
    this.updateCitationGraph(paper);
  }

  /**
   * Add multiple papers
   */
  async addPapers(papers: LiteraturePaper[]): Promise<void> {
    for (const paper of papers) {
      await this.addPaper(paper);
    }
  }

  /**
   * Search for papers
   */
  async search(searchQuery: LiteratureSearchQuery): Promise<LiteratureSearchResult[]> {
    const { query, domain, yearRange, authors, journals, keywords, minCitations, limit = 10 } = searchQuery;

    // Convert to literature results
    let results: LiteratureSearchResult[] = [];

    try {
      // Build query options
      const queryOptions: QueryOptions = {
        limit: limit * 2, // Get more results to filter
        domains: domain ? [domain] : undefined,
        dateRange: yearRange ? {
          start: yearRange.start ? new Date(yearRange.start, 0, 1) : undefined,
          end: yearRange.end ? new Date(yearRange.end, 11, 31) : undefined,
        } : undefined,
      };

      // Search knowledge base
      const searchResults = await this.knowledgeBase.search(query, queryOptions);

      // If vector search returned results, use them
      if (searchResults.length > 0) {
        for (const result of searchResults) {
          const paper = this.papers.get(result.document.id);
          if (!paper) continue;

          // Apply additional filters
          if (domain && paper.metadata.domain !== domain) continue;
          if (yearRange) {
            const year = paper.metadata.year;
            if (year && yearRange.start && year < yearRange.start) continue;
            if (year && yearRange.end && year > yearRange.end) continue;
          }
          if (minCitations && (paper.metadata.citations ?? 0) < minCitations) continue;
          if (authors && authors.length > 0) {
            const hasAuthor = authors.some((a) =>
              paper.metadata.authors.some((pa) => pa.toLowerCase().includes(a.toLowerCase()))
            );
            if (!hasAuthor) continue;
          }
          if (journals && journals.length > 0) {
            if (!journals.includes(paper.metadata.journal ?? '')) continue;
          }
          if (keywords && keywords.length > 0) {
            const hasKeyword = keywords.some((k) =>
              (paper.metadata.keywords ?? []).some((pk) => pk.toLowerCase().includes(k.toLowerCase()))
            );
            if (!hasKeyword) continue;
          }

          results.push({
            paper,
            score: result.score,
            highlights: this.extractHighlights(paper.content, query),
          });
        }
      }
    } catch {
      // Vector search failed, will use fallback
    }

    // Fallback to simple text matching for testing/demo if no results
    if (results.length === 0) {
      results = this.simpleTextSearch(searchQuery);
    }

    // Sort by score and limit
    results = results.sort((a, b) => b.score - a.score).slice(0, limit);

    // Add related papers
    for (const result of results) {
      result.relatedPapers = await this.findRelatedPapers(result.paper.id, 3);
    }

    return results;
  }

  /**
   * Simple text search fallback (for testing/demo without embeddings)
   */
  private simpleTextSearch(searchQuery: LiteratureSearchQuery): LiteratureSearchResult[] {
    const { query, domain, yearRange, authors, journals, keywords, minCitations, limit = 10 } = searchQuery;
    const queryTerms = query.toLowerCase().split(/\s+/);
    const results: LiteratureSearchResult[] = [];

    for (const paper of this.papers.values()) {
      // Apply filters
      if (domain && paper.metadata.domain !== domain) continue;
      if (yearRange) {
        const year = paper.metadata.year;
        if (year && yearRange.start && year < yearRange.start) continue;
        if (year && yearRange.end && year > yearRange.end) continue;
      }
      if (minCitations && (paper.metadata.citations ?? 0) < minCitations) continue;
      if (authors && authors.length > 0) {
        const hasAuthor = authors.some((a) =>
          paper.metadata.authors.some((pa) => pa.toLowerCase().includes(a.toLowerCase()))
        );
        if (!hasAuthor) continue;
      }
      if (journals && journals.length > 0) {
        if (!journals.includes(paper.metadata.journal ?? '')) continue;
      }
      if (keywords && keywords.length > 0) {
        const hasKeyword = keywords.some((k) =>
          (paper.metadata.keywords ?? []).some((pk) => pk.toLowerCase().includes(k.toLowerCase()))
        );
        if (!hasKeyword) continue;
      }

      // Calculate simple score based on term frequency
      const searchableText = `${paper.title} ${paper.content} ${paper.metadata.keywords?.join(' ') ?? ''}`.toLowerCase();
      const matchCount = queryTerms.filter((term) => searchableText.includes(term)).length;
      
      if (matchCount > 0) {
        const score = matchCount / queryTerms.length;
        results.push({
          paper,
          score,
          highlights: this.extractHighlights(paper.content, query),
        });
      }
    }

    return results.slice(0, limit);
  }

  /**
   * Search by domain
   */
  async searchByDomain(
    domain: LiteratureDomain,
    query: string,
    limit = 10
  ): Promise<LiteratureSearchResult[]> {
    return this.search({ query, domain, limit });
  }

  /**
   * Find papers citing a specific paper
   */
  async findCitingPapers(paperId: string): Promise<LiteraturePaper[]> {
    const node = this.citationGraph.get(paperId);
    if (!node) return [];

    const papers: LiteraturePaper[] = [];
    for (const citingId of node.citedBy) {
      const paper = this.papers.get(citingId);
      if (paper) papers.push(paper);
    }

    return papers;
  }

  /**
   * Find papers cited by a specific paper
   */
  async findCitedPapers(paperId: string): Promise<LiteraturePaper[]> {
    const node = this.citationGraph.get(paperId);
    if (!node) return [];

    const papers: LiteraturePaper[] = [];
    for (const citedId of node.cites) {
      const paper = this.papers.get(citedId);
      if (paper) papers.push(paper);
    }

    return papers;
  }

  /**
   * Find related papers using entity overlap and citations
   */
  async findRelatedPapers(paperId: string, limit = 5): Promise<LiteraturePaper[]> {
    const paper = this.papers.get(paperId);
    if (!paper) return [];

    const scores = new Map<string, number>();

    // Score by entity overlap
    const paperEntities = new Set(paper.entities?.map((e) => e.name.toLowerCase()) ?? []);
    for (const [otherId, otherPaper] of this.papers) {
      if (otherId === paperId) continue;

      let score = 0;
      const otherEntities = otherPaper.entities?.map((e) => e.name.toLowerCase()) ?? [];

      for (const entity of otherEntities) {
        if (paperEntities.has(entity)) {
          score += 1;
        }
      }

      // Score by domain match
      if (paper.metadata.domain === otherPaper.metadata.domain) {
        score += 0.5;
      }

      // Score by citation relationship
      const node = this.citationGraph.get(paperId);
      if (node) {
        if (node.citedBy.includes(otherId)) score += 2;
        if (node.cites.includes(otherId)) score += 2;
      }

      if (score > 0) {
        scores.set(otherId, score);
      }
    }

    // Sort and return top papers
    const sortedIds = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const relatedPapers: LiteraturePaper[] = [];
    for (const id of sortedIds) {
      const p = this.papers.get(id);
      if (p) relatedPapers.push(p);
    }

    return relatedPapers;
  }

  /**
   * Get citation graph for a paper
   */
  getCitationNode(paperId: string): CitationNode | undefined {
    return this.citationGraph.get(paperId);
  }

  /**
   * Get papers by domain
   */
  getPapersByDomain(domain: LiteratureDomain): LiteraturePaper[] {
    const paperIds = this.domainIndex.get(domain);
    if (!paperIds) return [];

    const papers: LiteraturePaper[] = [];
    for (const id of paperIds) {
      const paper = this.papers.get(id);
      if (paper) papers.push(paper);
    }

    return papers;
  }

  /**
   * Get all entities across papers
   */
  getAllEntities(): ScientificEntity[] {
    const entityMap = new Map<string, ScientificEntity>();

    for (const paper of this.papers.values()) {
      for (const entity of paper.entities ?? []) {
        const key = `${entity.type}:${entity.name.toLowerCase()}`;
        if (!entityMap.has(key)) {
          entityMap.set(key, entity);
        }
      }
    }

    return Array.from(entityMap.values());
  }

  /**
   * Find papers mentioning a specific entity
   */
  findPapersByEntity(entityName: string): LiteraturePaper[] {
    const normalizedName = entityName.toLowerCase();
    const papers: LiteraturePaper[] = [];

    for (const paper of this.papers.values()) {
      const hasEntity = paper.entities?.some(
        (e) => e.name.toLowerCase() === normalizedName
      );
      if (hasEntity) {
        papers.push(paper);
      }
    }

    return papers;
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalPapers: number;
    papersByDomain: Record<LiteratureDomain, number>;
    totalEntities: number;
    citationNodes: number;
  } {
    const papersByDomain: Record<LiteratureDomain, number> = {
      'drug-discovery': 0,
      'materials-science': 0,
      climate: 0,
      genomics: 0,
      chemistry: 0,
      physics: 0,
      biology: 0,
      general: 0,
    };

    for (const [domain, papers] of this.domainIndex) {
      papersByDomain[domain] = papers.size;
    }

    return {
      totalPapers: this.papers.size,
      papersByDomain,
      totalEntities: this.getAllEntities().length,
      citationNodes: this.citationGraph.size,
    };
  }

  /**
   * Detect domain from paper content and metadata
   */
  private detectDomain(paper: LiteraturePaper): LiteratureDomain {
    const text = `${paper.title} ${paper.content} ${(paper.metadata.keywords ?? []).join(' ')}`.toLowerCase();
    const scores: Record<LiteratureDomain, number> = {
      'drug-discovery': 0,
      'materials-science': 0,
      climate: 0,
      genomics: 0,
      chemistry: 0,
      physics: 0,
      biology: 0,
      general: 0,
    };

    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          scores[domain as LiteratureDomain] += 1;
        }
      }
    }

    // Find domain with highest score
    let maxScore = 0;
    let maxDomain: LiteratureDomain = 'general';

    for (const [domain, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxDomain = domain as LiteratureDomain;
      }
    }

    return maxDomain;
  }

  /**
   * Update citation graph for a paper
   */
  private updateCitationGraph(paper: LiteraturePaper): void {
    // Create or update node for this paper
    let node = this.citationGraph.get(paper.id);
    if (!node) {
      node = {
        paperId: paper.id,
        title: paper.title,
        year: paper.metadata.year,
        citedBy: [],
        cites: [],
        citationCount: paper.metadata.citations ?? 0,
      };
      this.citationGraph.set(paper.id, node);
    }
  }

  /**
   * Add citation relationship
   */
  addCitation(citingPaperId: string, citedPaperId: string): void {
    // Update citing paper's cites list
    const citingNode = this.citationGraph.get(citingPaperId);
    if (citingNode && !citingNode.cites.includes(citedPaperId)) {
      citingNode.cites.push(citedPaperId);
    }

    // Update cited paper's citedBy list
    const citedNode = this.citationGraph.get(citedPaperId);
    if (citedNode && !citedNode.citedBy.includes(citingPaperId)) {
      citedNode.citedBy.push(citingPaperId);
      citedNode.citationCount = citedNode.citedBy.length;
    }
  }

  /**
   * Build filters for knowledge base query
   */
  private buildFilters(query: LiteratureSearchQuery): Record<string, unknown> | undefined {
    const filters: Record<string, unknown> = {};

    if (query.domain) {
      filters.domain = query.domain;
    }

    if (query.yearRange) {
      if (query.yearRange.start) {
        filters.yearStart = query.yearRange.start;
      }
      if (query.yearRange.end) {
        filters.yearEnd = query.yearRange.end;
      }
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  }

  /**
   * Extract highlights from content matching query
   */
  private extractHighlights(content: string, query: string): string[] {
    const highlights: string[] = [];
    const queryTerms = query.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]+/);

    for (const sentence of sentences) {
      const normalizedSentence = sentence.toLowerCase();
      const matchCount = queryTerms.filter((term) => normalizedSentence.includes(term)).length;

      if (matchCount >= Math.ceil(queryTerms.length / 2)) {
        const trimmed = sentence.trim();
        if (trimmed.length > 20 && trimmed.length < 500) {
          highlights.push(trimmed);
        }
      }
    }

    return highlights.slice(0, 3);
  }
}

/**
 * Create literature search service
 */
export function createLiteratureSearchService(knowledgeBase: KnowledgeBase): LiteratureSearchService {
  return new LiteratureSearchService(knowledgeBase);
}
