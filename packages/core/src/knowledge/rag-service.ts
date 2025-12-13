/**
 * RAG Service
 *
 * KNOW-CORE-001: RAG integration
 * KNOW-GRAG-001 to KNOW-GRAG-003: GraphRAG requirements
 */

import type { RAGContext, SearchResult, QueryOptions } from './types.js';
import { KnowledgeBase } from './knowledge-base.js';

/**
 * Entity extracted from text (KNOW-GRAG-002)
 */
export interface ScientificEntity {
  name: string;
  type: 'compound' | 'protein' | 'gene' | 'disease' | 'author' | 'other';
  position?: { start: number; end: number };
  confidence?: number;
}

/**
 * Relation between entities (KNOW-GRAG-003)
 */
export interface EntityRelation {
  source: ScientificEntity;
  target: ScientificEntity;
  type: 'inhibits' | 'activates' | 'binds' | 'treats' | 'causes' | 'related';
  confidence?: number;
}

/**
 * Query response with citations
 */
export interface QueryResponse {
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
export interface SummaryResult {
  text: string;
  keyPoints: string[];
  sourceCount: number;
}

/**
 * RAG (Retrieval-Augmented Generation) service
 */
export class RAGService {
  private knowledgeBase: KnowledgeBase;
  private maxContextTokens: number;

  constructor(knowledgeBase: KnowledgeBase, maxContextTokens = 4000) {
    this.knowledgeBase = knowledgeBase;
    this.maxContextTokens = maxContextTokens;
  }

  /**
   * Generate embedding vector for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim() === '') {
      throw new Error('Text cannot be empty');
    }

    // Truncate if exceeding max tokens (8192 tokens ≈ 32768 chars)
    const maxChars = 32768;
    const truncatedText = text.slice(0, maxChars);

    // Simple hash-based embedding for MVP (production would use real embedding model)
    return this.simpleEmbedding(truncatedText);
  }

  /**
   * Simple hash-based embedding for testing
   * In production, this would call text-embedding-ada-002 or similar
   */
  private simpleEmbedding(text: string): number[] {
    const dimensions = 1536; // Match text-embedding-ada-002
    const embedding = new Array(dimensions).fill(0);

    // Create a deterministic embedding based on text content
    const words = text.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word) continue;
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j);
        const idx = (charCode * (i + 1) * (j + 1)) % dimensions;
        embedding[idx] += 1 / (i + 1);
      }
    }

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  /**
   * Generate embeddings for multiple texts
   */
  async generateEmbeddingBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    return Promise.all(texts.map((text) => this.generateEmbedding(text)));
  }

  /**
   * Compute cosine similarity between two vectors
   */
  computeSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have same dimensions');
    }

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += (vec1[i] ?? 0) * (vec2[i] ?? 0);
      mag1 += (vec1[i] ?? 0) * (vec1[i] ?? 0);
      mag2 += (vec2[i] ?? 0) * (vec2[i] ?? 0);
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (mag1 * mag2);
  }

  /**
   * Build RAG context for a query
   */
  async buildContext(query: string, options?: QueryOptions): Promise<RAGContext> {
    // Search for relevant documents
    const results = await this.knowledgeBase.search(query, {
      limit: 10,
      ...options,
    });

    // Build combined context with token limit
    const { combinedContext, tokenCount } = this.combineResults(results);

    return {
      query,
      results,
      combinedContext,
      tokenCount,
    };
  }

  /**
   * Combine search results into a single context string
   */
  private combineResults(results: SearchResult[]): {
    combinedContext: string;
    tokenCount: number;
  } {
    const contextParts: string[] = [];
    let tokenCount = 0;

    for (const result of results) {
      const chunkTokens = this.estimateTokens(result.chunk.content);

      if (tokenCount + chunkTokens > this.maxContextTokens) {
        break;
      }

      const contextPart = this.formatResultForContext(result);
      contextParts.push(contextPart);
      tokenCount += chunkTokens;
    }

    return {
      combinedContext: contextParts.join('\n\n---\n\n'),
      tokenCount,
    };
  }

  /**
   * Format a search result for inclusion in context
   */
  private formatResultForContext(result: SearchResult): string {
    const { document, chunk } = result;
    const header = `[Source: ${document.title}${document.metadata.doi ? ` (DOI: ${document.metadata.doi})` : ''}]`;
    return `${header}\n${chunk.content}`;
  }

  /**
   * Estimate token count for text (rough approximation)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Extract scientific entities from text (KNOW-GRAG-002)
   */
  async extractEntities(text: string): Promise<ScientificEntity[]> {
    const entities: ScientificEntity[] = [];

    // Common compound patterns
    const compoundPatterns = [
      /\b(Aspirin|Ibuprofen|Tamoxifen|Metformin|Paracetamol)\b/gi,
      /\b[A-Z][a-z]+(?:in|ol|ide|ine|ate)\b/g, // Generic drug-like names
    ];

    // Protein patterns (often uppercase or with numbers)
    const proteinPatterns = [
      /\b(COX-\d+|p53|EGFR|HER2|BRCA\d?)\b/gi,
      /\b[A-Z]{2,5}-?\d*\b/g, // Protein-like abbreviations
    ];

    // Gene patterns
    const genePatterns = [/\b[A-Z]{2,}[0-9]*\b/g];

    // Disease patterns
    const diseasePatterns = [
      /\b(cancer|diabetes|alzheimer|parkinson|tumor|carcinoma)\b/gi,
      /\b(breast cancer|lung cancer|colon cancer)\b/gi,
    ];

    // Author patterns (Name et al. or Name (year))
    const authorPatterns = [/\b([A-Z][a-z]+)\s+et\s+al\./g, /\b([A-Z][a-z]+)\s+\(\d{4}\)/g];

    // Extract compounds
    for (const pattern of compoundPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            name: match[0],
            type: 'compound',
            position: { start: match.index, end: match.index + match[0].length },
          });
        }
      }
    }

    // Extract proteins
    for (const pattern of proteinPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== undefined && match[0].length >= 3) {
          // Avoid duplicates with compounds
          if (!entities.some((e) => e.name.toLowerCase() === match[0].toLowerCase())) {
            entities.push({
              name: match[0],
              type: 'protein',
              position: { start: match.index, end: match.index + match[0].length },
            });
          }
        }
      }
    }

    // Extract diseases
    for (const pattern of diseasePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          if (!entities.some((e) => e.name.toLowerCase() === match[0].toLowerCase())) {
            entities.push({
              name: match[0],
              type: 'disease',
              position: { start: match.index, end: match.index + match[0].length },
            });
          }
        }
      }
    }

    // Extract authors
    for (const pattern of authorPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== undefined && match[1]) {
          entities.push({
            name: match[1],
            type: 'author',
            position: { start: match.index, end: match.index + match[0].length },
          });
        }
      }
    }

    // Remove duplicates by name and type
    const uniqueEntities = entities.filter(
      (entity, index, self) =>
        index ===
        self.findIndex(
          (e) => e.name.toLowerCase() === entity.name.toLowerCase() && e.type === entity.type
        )
    );

    return uniqueEntities;
  }

  /**
   * Extract relations between entities (KNOW-GRAG-003)
   */
  async extractRelations(
    text: string,
    entities: ScientificEntity[]
  ): Promise<EntityRelation[]> {
    const relations: EntityRelation[] = [];
    const textLower = text.toLowerCase();

    // Relation patterns
    const relationPatterns: Array<{ pattern: RegExp; type: EntityRelation['type'] }> = [
      { pattern: /inhibits?/gi, type: 'inhibits' },
      { pattern: /activates?/gi, type: 'activates' },
      { pattern: /binds?\s+to/gi, type: 'binds' },
      { pattern: /treats?/gi, type: 'treats' },
      { pattern: /causes?/gi, type: 'causes' },
    ];

    // Find relations by proximity and verb patterns
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];
        
        if (!entity1 || !entity2) continue;

        // Find text between entities
        const pos1 = entity1.position;
        const pos2 = entity2.position;

        if (pos1 && pos2) {
          const start = Math.min(pos1.end, pos2.end);
          const end = Math.max(pos1.start, pos2.start);

          if (end > start && end - start < 100) {
            const between = text.substring(start, end);

            // Check for relation patterns
            for (const { pattern, type } of relationPatterns) {
              if (pattern.test(between)) {
                relations.push({
                  source: entity1,
                  target: entity2,
                  type,
                  confidence: 0.8,
                });
                break;
              }
            }
          }
        }
      }
    }

    return relations;
  }

  /**
   * Perform RAG query with context
   */
  async query(
    question: string,
    searchResults: SearchResult[]
  ): Promise<QueryResponse> {
    if (searchResults.length === 0) {
      return {
        answer:
          'I could not find relevant information in the knowledge base to answer this question.',
        sources: [],
        confidence: 0.0,
      };
    }

    // Build answer from search results
    const context = searchResults.map((r) => r.chunk.content).join('\n\n');
    const sources = searchResults.map((r) => ({
      documentId: r.document.id,
      title: r.document.title,
      excerpt: r.chunk.content.substring(0, 200) + '...',
      score: r.score,
    }));

    // Simple answer generation (in production, this would call LLM)
    const answer = `Based on the retrieved documents:\n\n${context.substring(0, 500)}...`;

    return {
      answer,
      sources,
      confidence: Math.max(...searchResults.map((r) => r.score)),
    };
  }

  /**
   * Rerank search results by relevance
   */
  async rerank(query: string, results: SearchResult[]): Promise<SearchResult[]> {
    // Calculate semantic similarity for reranking
    const queryEmbedding = await this.generateEmbedding(query);

    const rerankedResults = await Promise.all(
      results.map(async (result) => {
        const chunkEmbedding = await this.generateEmbedding(result.chunk.content);
        const semanticScore = this.computeSimilarity(queryEmbedding, chunkEmbedding);

        // Combine original score with semantic score
        const combinedScore = result.score * 0.3 + semanticScore * 0.7;

        return {
          ...result,
          score: combinedScore,
        };
      })
    );

    return rerankedResults.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate summary of search results
   */
  async summarize(results: SearchResult[]): Promise<SummaryResult> {
    if (results.length === 0) {
      return {
        text: 'No results to summarize.',
        keyPoints: [],
        sourceCount: 0,
      };
    }

    // Extract key points from each result
    const keyPoints: string[] = [];
    const allText = results.map((r) => r.chunk.content).join('\n\n');

    // Simple extraction of first sentence from each chunk
    for (const result of results.slice(0, 5)) {
      const firstSentence = result.chunk.content.split('.')[0];
      if (firstSentence && firstSentence.length > 20) {
        keyPoints.push(firstSentence.trim() + '.');
      }
    }

    // Generate summary text
    const text = `Summary of ${results.length} relevant documents:\n\n${keyPoints.join('\n')}`;

    return {
      text,
      keyPoints,
      sourceCount: results.length,
    };
  }

  /**
   * Generate a prompt with RAG context
   */
  buildPrompt(userQuery: string, context: RAGContext, systemPrompt?: string): string {
    const defaultSystemPrompt = `You are an AI assistant for scientific research. 
Use the following context from the knowledge base to answer the user's question.
If the context doesn't contain relevant information, say so clearly.`;

    const prompt = `${systemPrompt || defaultSystemPrompt}

## Context from Knowledge Base

${context.combinedContext}

## User Question

${userQuery}

## Instructions

Based on the context provided, answer the user's question. 
Cite sources when possible using [Source: title] format.`;

    return prompt;
  }
}
