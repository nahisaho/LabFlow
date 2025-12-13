/**
 * GraphRAG Service
 *
 * KNOW-GRAG-001: GraphRAG integration
 * KNOW-GRAG-002: Entity extraction
 * KNOW-GRAG-003: Relationship extraction
 * KNOW-GRAG-004: Citation graph analysis
 */

import type { ScientificEntity, EntityRelation } from './rag-service.js';
import type { LiteraturePaper } from './literature-search.js';

/**
 * Graph node types
 */
export type GraphNodeType = 'paper' | 'entity' | 'author' | 'journal' | 'topic';

/**
 * Graph node
 */
export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  properties: Record<string, unknown>;
  embedding?: number[];
}

/**
 * Graph edge
 */
export interface GraphEdge {
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
export interface KnowledgeGraph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
}

/**
 * Graph query result
 */
export interface GraphQueryResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  paths?: GraphNode[][];
}

/**
 * Community detection result
 */
export interface Community {
  id: string;
  nodes: string[];
  topic?: string;
  keyTerms: string[];
}

/**
 * GraphRAG configuration
 */
export interface GraphRAGConfig {
  maxHops?: number;
  minEdgeWeight?: number;
  communityResolution?: number;
}

/**
 * GraphRAG Service
 *
 * Implements GraphRAG pattern for knowledge graph construction and querying
 */
export class GraphRAGService {
  private graph: KnowledgeGraph;
  private communities: Map<string, Community> = new Map();
  private config: GraphRAGConfig;

  constructor(config: GraphRAGConfig = {}) {
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
    };
    this.config = {
      maxHops: config.maxHops ?? 3,
      minEdgeWeight: config.minEdgeWeight ?? 0.1,
      communityResolution: config.communityResolution ?? 1.0,
    };
  }

  /**
   * Add a paper to the knowledge graph
   */
  addPaper(paper: LiteraturePaper): void {
    // Add paper node
    const paperNode: GraphNode = {
      id: `paper:${paper.id}`,
      type: 'paper',
      label: paper.title,
      properties: {
        year: paper.metadata.year,
        doi: paper.metadata.doi,
        citations: paper.metadata.citations,
        domain: paper.metadata.domain,
      },
    };
    this.graph.nodes.set(paperNode.id, paperNode);

    // Add author nodes and edges
    for (const author of paper.metadata.authors) {
      const authorId = `author:${this.normalizeId(author)}`;
      if (!this.graph.nodes.has(authorId)) {
        const authorNode: GraphNode = {
          id: authorId,
          type: 'author',
          label: author,
          properties: { paperCount: 1 },
        };
        this.graph.nodes.set(authorId, authorNode);
      } else {
        const node = this.graph.nodes.get(authorId)!;
        (node.properties.paperCount as number) += 1;
      }

      // Add author-paper edge
      const edgeId = `${authorId}->${paperNode.id}`;
      const edge: GraphEdge = {
        id: edgeId,
        source: authorId,
        target: paperNode.id,
        type: 'authored',
        weight: 1.0,
      };
      this.graph.edges.set(edgeId, edge);
    }

    // Add journal node and edge
    if (paper.metadata.journal) {
      const journalId = `journal:${this.normalizeId(paper.metadata.journal)}`;
      if (!this.graph.nodes.has(journalId)) {
        const journalNode: GraphNode = {
          id: journalId,
          type: 'journal',
          label: paper.metadata.journal,
          properties: { paperCount: 1 },
        };
        this.graph.nodes.set(journalId, journalNode);
      } else {
        const node = this.graph.nodes.get(journalId)!;
        (node.properties.paperCount as number) += 1;
      }

      const edgeId = `${paperNode.id}->published:${journalId}`;
      const edge: GraphEdge = {
        id: edgeId,
        source: paperNode.id,
        target: journalId,
        type: 'published_in',
        weight: 1.0,
      };
      this.graph.edges.set(edgeId, edge);
    }

    // Add entity nodes and edges
    if (paper.entities) {
      for (const entity of paper.entities) {
        const entityId = `entity:${entity.type}:${this.normalizeId(entity.name)}`;
        if (!this.graph.nodes.has(entityId)) {
          const entityNode: GraphNode = {
            id: entityId,
            type: 'entity',
            label: entity.name,
            properties: {
              entityType: entity.type,
              mentionCount: 1,
            },
          };
          this.graph.nodes.set(entityId, entityNode);
        } else {
          const node = this.graph.nodes.get(entityId)!;
          (node.properties.mentionCount as number) += 1;
        }

        // Add paper-entity edge
        const edgeId = `${paperNode.id}->mentions:${entityId}`;
        const edge: GraphEdge = {
          id: edgeId,
          source: paperNode.id,
          target: entityId,
          type: 'mentions',
          weight: entity.confidence ?? 0.8,
        };
        this.graph.edges.set(edgeId, edge);
      }
    }

    // Add relation edges between entities
    if (paper.relations) {
      for (const relation of paper.relations) {
        const sourceId = `entity:${relation.source.type}:${this.normalizeId(relation.source.name)}`;
        const targetId = `entity:${relation.target.type}:${this.normalizeId(relation.target.name)}`;

        const edgeId = `${sourceId}->${relation.type}:${targetId}`;
        if (!this.graph.edges.has(edgeId)) {
          const edge: GraphEdge = {
            id: edgeId,
            source: sourceId,
            target: targetId,
            type: relation.type,
            weight: relation.confidence ?? 0.7,
            properties: { paperIds: [paper.id] },
          };
          this.graph.edges.set(edgeId, edge);
        } else {
          // Increase weight for repeated relations
          const edge = this.graph.edges.get(edgeId)!;
          edge.weight = Math.min(1.0, edge.weight + 0.1);
          (edge.properties?.paperIds as string[]).push(paper.id);
        }
      }
    }
  }

  /**
   * Add citation edge between papers
   */
  addCitation(citingPaperId: string, citedPaperId: string): void {
    const sourceId = `paper:${citingPaperId}`;
    const targetId = `paper:${citedPaperId}`;

    if (!this.graph.nodes.has(sourceId) || !this.graph.nodes.has(targetId)) {
      return;
    }

    const edgeId = `${sourceId}->cites:${targetId}`;
    if (!this.graph.edges.has(edgeId)) {
      const edge: GraphEdge = {
        id: edgeId,
        source: sourceId,
        target: targetId,
        type: 'cites',
        weight: 1.0,
      };
      this.graph.edges.set(edgeId, edge);
    }
  }

  /**
   * Query the knowledge graph
   */
  query(startNodeId: string, maxHops?: number): GraphQueryResult {
    const hops = maxHops ?? this.config.maxHops ?? 3;
    const visitedNodes = new Set<string>();
    const resultNodes: GraphNode[] = [];
    const resultEdges: GraphEdge[] = [];

    // BFS traversal
    const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: startNodeId, depth: 0 }];

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;

      if (visitedNodes.has(nodeId) || depth > hops) continue;
      visitedNodes.add(nodeId);

      const node = this.graph.nodes.get(nodeId);
      if (node) {
        resultNodes.push(node);
      }

      // Find connected edges
      for (const edge of this.graph.edges.values()) {
        if (edge.source === nodeId && !visitedNodes.has(edge.target)) {
          resultEdges.push(edge);
          queue.push({ nodeId: edge.target, depth: depth + 1 });
        }
        if (edge.target === nodeId && !visitedNodes.has(edge.source)) {
          resultEdges.push(edge);
          queue.push({ nodeId: edge.source, depth: depth + 1 });
        }
      }
    }

    return { nodes: resultNodes, edges: resultEdges };
  }

  /**
   * Find shortest path between two nodes
   */
  findPath(sourceId: string, targetId: string): GraphNode[] | null {
    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; path: string[] }> = [
      { nodeId: sourceId, path: [sourceId] },
    ];

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;

      if (nodeId === targetId) {
        return path.map((id) => this.graph.nodes.get(id)!).filter(Boolean);
      }

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      // Find neighbors
      for (const edge of this.graph.edges.values()) {
        let neighbor: string | null = null;
        if (edge.source === nodeId) neighbor = edge.target;
        if (edge.target === nodeId) neighbor = edge.source;

        if (neighbor && !visited.has(neighbor)) {
          queue.push({ nodeId: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return null;
  }

  /**
   * Get neighbors of a node
   */
  getNeighbors(nodeId: string): GraphNode[] {
    const neighbors: GraphNode[] = [];

    for (const edge of this.graph.edges.values()) {
      let neighborId: string | null = null;
      if (edge.source === nodeId) neighborId = edge.target;
      if (edge.target === nodeId) neighborId = edge.source;

      if (neighborId) {
        const neighbor = this.graph.nodes.get(neighborId);
        if (neighbor) neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  /**
   * Find nodes by type
   */
  getNodesByType(type: GraphNodeType): GraphNode[] {
    const nodes: GraphNode[] = [];
    for (const node of this.graph.nodes.values()) {
      if (node.type === type) {
        nodes.push(node);
      }
    }
    return nodes;
  }

  /**
   * Find edges by type
   */
  getEdgesByType(type: string): GraphEdge[] {
    const edges: GraphEdge[] = [];
    for (const edge of this.graph.edges.values()) {
      if (edge.type === type) {
        edges.push(edge);
      }
    }
    return edges;
  }

  /**
   * Get the most connected nodes (by degree centrality)
   */
  getTopNodes(limit = 10): Array<{ node: GraphNode; degree: number }> {
    const degrees = new Map<string, number>();

    // Count edges for each node
    for (const edge of this.graph.edges.values()) {
      degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
      degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
    }

    // Sort by degree
    const sorted = Array.from(degrees.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted
      .map(([nodeId, degree]) => ({
        node: this.graph.nodes.get(nodeId)!,
        degree,
      }))
      .filter((item) => item.node !== undefined);
  }

  /**
   * Detect communities using label propagation
   */
  detectCommunities(): Community[] {
    const labels = new Map<string, string>();
    const nodeIds = Array.from(this.graph.nodes.keys());

    // Initialize: each node in its own community
    for (const nodeId of nodeIds) {
      labels.set(nodeId, nodeId);
    }

    // Iterate until convergence
    let changed = true;
    let iterations = 0;
    const maxIterations = 100;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      // Shuffle nodes
      const shuffled = [...nodeIds].sort(() => Math.random() - 0.5);

      for (const nodeId of shuffled) {
        // Count neighbor labels
        const labelCounts = new Map<string, number>();
        for (const edge of this.graph.edges.values()) {
          let neighborId: string | null = null;
          if (edge.source === nodeId) neighborId = edge.target;
          if (edge.target === nodeId) neighborId = edge.source;

          if (neighborId) {
            const label = labels.get(neighborId)!;
            labelCounts.set(label, (labelCounts.get(label) ?? 0) + edge.weight);
          }
        }

        // Find most common label
        let maxCount = 0;
        let maxLabel = labels.get(nodeId)!;
        for (const [label, count] of labelCounts) {
          if (count > maxCount) {
            maxCount = count;
            maxLabel = label;
          }
        }

        // Update label if changed
        if (maxLabel !== labels.get(nodeId)) {
          labels.set(nodeId, maxLabel);
          changed = true;
        }
      }
    }

    // Group nodes by label
    const communityNodes = new Map<string, string[]>();
    for (const [nodeId, label] of labels) {
      if (!communityNodes.has(label)) {
        communityNodes.set(label, []);
      }
      communityNodes.get(label)!.push(nodeId);
    }

    // Create communities
    const communities: Community[] = [];
    let communityIndex = 0;

    for (const [_label, nodeIds] of communityNodes) {
      if (nodeIds.length < 2) continue; // Skip single-node communities

      const community: Community = {
        id: `community-${communityIndex++}`,
        nodes: nodeIds,
        keyTerms: this.extractKeyTerms(nodeIds),
      };

      communities.push(community);
      this.communities.set(community.id, community);
    }

    return communities;
  }

  /**
   * Extract key terms from a set of nodes
   */
  private extractKeyTerms(nodeIds: string[]): string[] {
    const terms = new Map<string, number>();

    for (const nodeId of nodeIds) {
      const node = this.graph.nodes.get(nodeId);
      if (!node) continue;

      // Add node label as term
      const label = node.label.toLowerCase();
      terms.set(label, (terms.get(label) ?? 0) + 1);

      // Add entity types as terms for entity nodes
      if (node.type === 'entity' && node.properties.entityType) {
        const entityType = node.properties.entityType as string;
        terms.set(entityType, (terms.get(entityType) ?? 0) + 0.5);
      }
    }

    // Return top terms
    return Array.from(terms.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term]) => term);
  }

  /**
   * Get graph statistics
   */
  getStats(): {
    nodeCount: number;
    edgeCount: number;
    nodesByType: Record<GraphNodeType, number>;
    avgDegree: number;
  } {
    const nodesByType: Record<GraphNodeType, number> = {
      paper: 0,
      entity: 0,
      author: 0,
      journal: 0,
      topic: 0,
    };

    for (const node of this.graph.nodes.values()) {
      nodesByType[node.type]++;
    }

    const avgDegree =
      this.graph.nodes.size > 0
        ? (this.graph.edges.size * 2) / this.graph.nodes.size
        : 0;

    return {
      nodeCount: this.graph.nodes.size,
      edgeCount: this.graph.edges.size,
      nodesByType,
      avgDegree,
    };
  }

  /**
   * Export graph to serializable format
   */
  exportGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    return {
      nodes: Array.from(this.graph.nodes.values()),
      edges: Array.from(this.graph.edges.values()),
    };
  }

  /**
   * Import graph from serialized format
   */
  importGraph(data: { nodes: GraphNode[]; edges: GraphEdge[] }): void {
    this.graph.nodes.clear();
    this.graph.edges.clear();

    for (const node of data.nodes) {
      this.graph.nodes.set(node.id, node);
    }

    for (const edge of data.edges) {
      this.graph.edges.set(edge.id, edge);
    }
  }

  /**
   * Normalize ID for consistent lookup
   */
  private normalizeId(str: string): string {
    return str.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
  }
}

/**
 * Create GraphRAG service
 */
export function createGraphRAGService(config?: GraphRAGConfig): GraphRAGService {
  return new GraphRAGService(config);
}
