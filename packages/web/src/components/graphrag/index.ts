/**
 * GraphRAG Module
 * 
 * ナレッジグラフ構築・検索機能のUIコンポーネント
 * 
 * Requirements:
 * - KNOW-GRAG-001: GraphRAG integration
 * - KNOW-GRAG-002: Entity extraction
 * - KNOW-GRAG-003: Relationship extraction
 * - KNOW-GRAG-004: Citation graph analysis
 */

// Types
export type {
  KnowledgeBaseStatus,
  DocumentType,
  NodeType,
  EntityType,
  DocumentMetadata,
  Document,
  GraphNode,
  GraphEdge,
  GraphData,
  ExtractedEntity,
  EntityRelation,
  Community,
  GraphSearchQuery,
  GraphSearchResult,
  KnowledgeGap,
  ViewMode,
  GraphDisplaySettings,
  GraphRAGState,
  AddDocumentInput,
  CreateKnowledgeBaseInput,
  KnowledgeBaseStats,
} from './types';

// Constants
export {
  NODE_TYPES,
  ENTITY_TYPES,
  DOCUMENT_TYPES,
  VIEW_MODES,
  RELATION_TYPES,
  SEARCH_TYPES,
  UI_TEXT,
} from './constants';

// Components
export { DocumentList, DocumentCard, AddDocumentDialog } from './document-list';
export {
  GraphViewer,
  GraphStats,
  GraphControls,
  NodeDetailPanel,
} from './graph-viewer';
export {
  SearchPanel,
  SearchResults,
  AnswerPanel,
  KnowledgeGapPanel,
} from './search-panel';
export { GraphRAGDashboard } from './graphrag-dashboard';

// Default export
export { default } from './graphrag-dashboard';
