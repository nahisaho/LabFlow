/**
 * @file GraphRAG 定数・ラベル定義
 * @description ノードタイプ、エンティティタイプの表示ラベルと設定
 */

import type { NodeType, EntityType, DocumentType, ViewMode } from './types';

// ============================================================================
// ノードタイプ
// ============================================================================

/** ノードタイプ情報 */
export interface NodeTypeInfo {
  /** ID */
  id: NodeType;
  /** 英語ラベル */
  label: string;
  /** 日本語ラベル */
  labelJa: string;
  /** アイコン */
  icon: string;
  /** 色（Tailwind） */
  color: string;
  /** 背景色 */
  bgColor: string;
}

/** ノードタイプ定義 */
export const NODE_TYPES: Record<NodeType, NodeTypeInfo> = {
  paper: {
    id: 'paper',
    label: 'Paper',
    labelJa: '論文',
    icon: '📄',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  entity: {
    id: 'entity',
    label: 'Entity',
    labelJa: 'エンティティ',
    icon: '🔷',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  author: {
    id: 'author',
    label: 'Author',
    labelJa: '著者',
    icon: '👤',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  journal: {
    id: 'journal',
    label: 'Journal',
    labelJa: 'ジャーナル',
    icon: '📚',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  topic: {
    id: 'topic',
    label: 'Topic',
    labelJa: 'トピック',
    icon: '🏷️',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
  concept: {
    id: 'concept',
    label: 'Concept',
    labelJa: '概念',
    icon: '💡',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
};

// ============================================================================
// エンティティタイプ
// ============================================================================

/** エンティティタイプ情報 */
export interface EntityTypeInfo {
  /** ID */
  id: EntityType;
  /** 英語ラベル */
  label: string;
  /** 日本語ラベル */
  labelJa: string;
  /** アイコン */
  icon: string;
  /** 色 */
  color: string;
  /** 関連分野 */
  domains: string[];
}

/** エンティティタイプ定義 */
export const ENTITY_TYPES: Record<EntityType, EntityTypeInfo> = {
  compound: {
    id: 'compound',
    label: 'Compound',
    labelJa: '化合物',
    icon: '🧪',
    color: 'text-cyan-600',
    domains: ['drug-discovery', 'materials-science'],
  },
  protein: {
    id: 'protein',
    label: 'Protein',
    labelJa: 'タンパク質',
    icon: '🔬',
    color: 'text-red-600',
    domains: ['drug-discovery', 'genomics'],
  },
  gene: {
    id: 'gene',
    label: 'Gene',
    labelJa: '遺伝子',
    icon: '🧬',
    color: 'text-indigo-600',
    domains: ['genomics', 'drug-discovery'],
  },
  material: {
    id: 'material',
    label: 'Material',
    labelJa: '材料',
    icon: '⚛️',
    color: 'text-amber-600',
    domains: ['materials-science'],
  },
  method: {
    id: 'method',
    label: 'Method',
    labelJa: '手法',
    icon: '📋',
    color: 'text-slate-600',
    domains: ['drug-discovery', 'materials-science', 'climate', 'genomics'],
  },
  metric: {
    id: 'metric',
    label: 'Metric',
    labelJa: '指標',
    icon: '📊',
    color: 'text-teal-600',
    domains: ['drug-discovery', 'materials-science', 'climate', 'genomics'],
  },
  property: {
    id: 'property',
    label: 'Property',
    labelJa: '特性',
    icon: '📈',
    color: 'text-emerald-600',
    domains: ['materials-science', 'drug-discovery'],
  },
  disease: {
    id: 'disease',
    label: 'Disease',
    labelJa: '疾患',
    icon: '🏥',
    color: 'text-rose-600',
    domains: ['drug-discovery', 'genomics'],
  },
  organism: {
    id: 'organism',
    label: 'Organism',
    labelJa: '生物',
    icon: '🦠',
    color: 'text-lime-600',
    domains: ['genomics', 'drug-discovery'],
  },
};

// ============================================================================
// ドキュメントタイプ
// ============================================================================

/** ドキュメントタイプ情報 */
export interface DocumentTypeInfo {
  /** ID */
  id: DocumentType;
  /** 英語ラベル */
  label: string;
  /** 日本語ラベル */
  labelJa: string;
  /** アイコン */
  icon: string;
  /** 説明 */
  description: string;
  /** 日本語説明 */
  descriptionJa: string;
}

/** ドキュメントタイプ定義 */
export const DOCUMENT_TYPES: Record<DocumentType, DocumentTypeInfo> = {
  paper: {
    id: 'paper',
    label: 'Research Paper',
    labelJa: '研究論文',
    icon: '📄',
    description: 'Academic papers, preprints, and journal articles',
    descriptionJa: '学術論文、プレプリント、ジャーナル記事',
  },
  protocol: {
    id: 'protocol',
    label: 'Protocol',
    labelJa: 'プロトコル',
    icon: '📋',
    description: 'Experimental protocols and methods',
    descriptionJa: '実験プロトコルと手法',
  },
  documentation: {
    id: 'documentation',
    label: 'Documentation',
    labelJa: 'ドキュメント',
    icon: '📚',
    description: 'Technical documentation and manuals',
    descriptionJa: '技術ドキュメントとマニュアル',
  },
  tutorial: {
    id: 'tutorial',
    label: 'Tutorial',
    labelJa: 'チュートリアル',
    icon: '🎓',
    description: 'Educational materials and tutorials',
    descriptionJa: '教育資料とチュートリアル',
  },
  note: {
    id: 'note',
    label: 'Note',
    labelJa: 'ノート',
    icon: '📝',
    description: 'Research notes and observations',
    descriptionJa: '研究ノートと観察記録',
  },
};

// ============================================================================
// ビューモード
// ============================================================================

/** ビューモード情報 */
export interface ViewModeInfo {
  /** ID */
  id: ViewMode;
  /** 英語ラベル */
  label: string;
  /** 日本語ラベル */
  labelJa: string;
  /** アイコン */
  icon: string;
  /** 説明 */
  description: string;
  /** 日本語説明 */
  descriptionJa: string;
}

/** ビューモード定義 */
export const VIEW_MODES: Record<ViewMode, ViewModeInfo> = {
  graph: {
    id: 'graph',
    label: 'Graph View',
    labelJa: 'グラフビュー',
    icon: '🕸️',
    description: 'Interactive knowledge graph visualization',
    descriptionJa: 'インタラクティブなナレッジグラフ可視化',
  },
  list: {
    id: 'list',
    label: 'List View',
    labelJa: 'リストビュー',
    icon: '📋',
    description: 'Documents and entities in list format',
    descriptionJa: 'ドキュメントとエンティティのリスト表示',
  },
  tree: {
    id: 'tree',
    label: 'Tree View',
    labelJa: 'ツリービュー',
    icon: '🌳',
    description: 'Hierarchical structure view',
    descriptionJa: '階層構造表示',
  },
  timeline: {
    id: 'timeline',
    label: 'Timeline View',
    labelJa: 'タイムラインビュー',
    icon: '📅',
    description: 'Chronological document timeline',
    descriptionJa: '時系列ドキュメントタイムライン',
  },
};

// ============================================================================
// 関係タイプ
// ============================================================================

/** 関係タイプ情報 */
export interface RelationTypeInfo {
  /** ID */
  id: string;
  /** 英語ラベル */
  label: string;
  /** 日本語ラベル */
  labelJa: string;
  /** 色 */
  color: string;
}

/** 関係タイプ定義 */
export const RELATION_TYPES: Record<string, RelationTypeInfo> = {
  cites: {
    id: 'cites',
    label: 'Cites',
    labelJa: '引用',
    color: '#6366f1',
  },
  mentions: {
    id: 'mentions',
    label: 'Mentions',
    labelJa: '言及',
    color: '#8b5cf6',
  },
  authored: {
    id: 'authored',
    label: 'Authored',
    labelJa: '執筆',
    color: '#22c55e',
  },
  related_to: {
    id: 'related_to',
    label: 'Related to',
    labelJa: '関連',
    color: '#f59e0b',
  },
  inhibits: {
    id: 'inhibits',
    label: 'Inhibits',
    labelJa: '阻害',
    color: '#ef4444',
  },
  activates: {
    id: 'activates',
    label: 'Activates',
    labelJa: '活性化',
    color: '#10b981',
  },
  binds_to: {
    id: 'binds_to',
    label: 'Binds to',
    labelJa: '結合',
    color: '#06b6d4',
  },
  produces: {
    id: 'produces',
    label: 'Produces',
    labelJa: '生成',
    color: '#84cc16',
  },
  contains: {
    id: 'contains',
    label: 'Contains',
    labelJa: '含有',
    color: '#a855f7',
  },
};

// ============================================================================
// 検索タイプ
// ============================================================================

/** 検索タイプ情報 */
export interface SearchTypeInfo {
  /** ID */
  id: 'semantic' | 'entity' | 'path' | 'community';
  /** 英語ラベル */
  label: string;
  /** 日本語ラベル */
  labelJa: string;
  /** 説明 */
  description: string;
  /** 日本語説明 */
  descriptionJa: string;
  /** アイコン */
  icon: string;
}

/** 検索タイプ定義 */
export const SEARCH_TYPES: SearchTypeInfo[] = [
  {
    id: 'semantic',
    label: 'Semantic Search',
    labelJa: 'セマンティック検索',
    description: 'Find documents and entities by meaning',
    descriptionJa: '意味ベースでドキュメントとエンティティを検索',
    icon: '🔍',
  },
  {
    id: 'entity',
    label: 'Entity Search',
    labelJa: 'エンティティ検索',
    description: 'Search for specific entities and their relationships',
    descriptionJa: '特定のエンティティとその関係を検索',
    icon: '🔷',
  },
  {
    id: 'path',
    label: 'Path Search',
    labelJa: 'パス検索',
    description: 'Find connection paths between entities',
    descriptionJa: 'エンティティ間の接続パスを検索',
    icon: '🔗',
  },
  {
    id: 'community',
    label: 'Community Search',
    labelJa: 'コミュニティ検索',
    description: 'Explore topic clusters and research communities',
    descriptionJa: 'トピッククラスタと研究コミュニティを探索',
    icon: '👥',
  },
];

// ============================================================================
// UIテキスト
// ============================================================================

/** UIテキスト */
export const UI_TEXT = {
  // ヘッダー
  title: 'Knowledge Graph',
  titleJa: 'ナレッジグラフ',
  subtitle: 'Build and explore knowledge from your literature',
  subtitleJa: '文献からナレッジを構築・探索',

  // アクション
  addDocument: 'Add Document',
  addDocumentJa: 'ドキュメント追加',
  uploadFile: 'Upload File',
  uploadFileJa: 'ファイルアップロード',
  importFromDOI: 'Import from DOI',
  importFromDOIJa: 'DOIからインポート',
  searchLiterature: 'Search Literature',
  searchLiteratureJa: '文献検索',
  rebuildIndex: 'Rebuild Index',
  rebuildIndexJa: 'インデックス再構築',
  exportGraph: 'Export Graph',
  exportGraphJa: 'グラフエクスポート',

  // 検索
  searchPlaceholder: 'Search knowledge graph...',
  searchPlaceholderJa: 'ナレッジグラフを検索...',
  askQuestion: 'Ask a question about your literature',
  askQuestionJa: '文献について質問する',

  // 状態
  empty: 'No documents yet',
  emptyJa: 'ドキュメントがありません',
  emptyDescription: 'Add documents to build your knowledge graph',
  emptyDescriptionJa: 'ドキュメントを追加してナレッジグラフを構築しましょう',
  indexing: 'Building knowledge graph...',
  indexingJa: 'ナレッジグラフを構築中...',
  ready: 'Knowledge graph ready',
  readyJa: 'ナレッジグラフ準備完了',

  // ノード詳細
  nodeDetails: 'Node Details',
  nodeDetailsJa: 'ノード詳細',
  relatedNodes: 'Related Nodes',
  relatedNodesJa: '関連ノード',
  sourceDocuments: 'Source Documents',
  sourceDocumentsJa: 'ソースドキュメント',

  // 統計
  documents: 'Documents',
  documentsJa: 'ドキュメント',
  nodes: 'Nodes',
  nodesJa: 'ノード',
  edges: 'Edges',
  edgesJa: 'エッジ',
  entities: 'Entities',
  entitiesJa: 'エンティティ',
  communities: 'Communities',
  communitiesJa: 'コミュニティ',

  // ナレッジギャップ
  knowledgeGaps: 'Knowledge Gaps',
  knowledgeGapsJa: '知識ギャップ',
  researchSuggestions: 'Research Suggestions',
  researchSuggestionsJa: '研究提案',
};
