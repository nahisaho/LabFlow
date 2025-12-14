/**
 * @file GraphRAG UI 型定義
 * @description ナレッジグラフ構築・検索機能の型定義
 * 
 * Requirements:
 * - KNOW-GRAG-001: GraphRAG integration
 * - KNOW-GRAG-002: Entity extraction
 * - KNOW-GRAG-003: Relationship extraction
 * - KNOW-GRAG-004: Citation graph analysis
 */

// ============================================================================
// 基本型
// ============================================================================

/** ナレッジベース状態 */
export type KnowledgeBaseStatus = 
  | 'empty'
  | 'indexing'
  | 'ready'
  | 'error';

/** ドキュメントタイプ */
export type DocumentType = 
  | 'paper'
  | 'protocol'
  | 'documentation'
  | 'tutorial'
  | 'note';

/** ノードタイプ */
export type NodeType = 
  | 'paper'
  | 'entity'
  | 'author'
  | 'journal'
  | 'topic'
  | 'concept';

/** エンティティタイプ */
export type EntityType = 
  | 'compound'
  | 'protein'
  | 'gene'
  | 'material'
  | 'method'
  | 'metric'
  | 'property'
  | 'disease'
  | 'organism';

// ============================================================================
// ドキュメント
// ============================================================================

/** ドキュメントメタデータ */
export interface DocumentMetadata {
  /** DOI */
  doi?: string;
  /** 著者リスト */
  authors?: string[];
  /** 出版日 */
  publishedDate?: Date;
  /** ジャーナル名 */
  journal?: string;
  /** 被引用数 */
  citations?: number;
  /** 言語 */
  language?: 'ja' | 'en' | 'other';
  /** タグ */
  tags?: string[];
  /** 研究分野 */
  domain?: string;
}

/** ドキュメント */
export interface Document {
  /** ID */
  id: string;
  /** タイトル */
  title: string;
  /** 日本語タイトル */
  titleJa?: string;
  /** 概要 */
  abstract?: string;
  /** タイプ */
  type: DocumentType;
  /** ファイルURL */
  fileUrl?: string;
  /** メタデータ */
  metadata: DocumentMetadata;
  /** 処理ステータス */
  status: 'pending' | 'processing' | 'indexed' | 'error';
  /** エラーメッセージ */
  errorMessage?: string;
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

// ============================================================================
// グラフノード・エッジ
// ============================================================================

/** グラフノード */
export interface GraphNode {
  /** ID */
  id: string;
  /** ノードタイプ */
  type: NodeType;
  /** ラベル */
  label: string;
  /** 日本語ラベル */
  labelJa?: string;
  /** プロパティ */
  properties: Record<string, unknown>;
  /** 次数（接続数） */
  degree?: number;
  /** 座標（可視化用） */
  x?: number;
  y?: number;
  /** サイズ（可視化用） */
  size?: number;
  /** 色（可視化用） */
  color?: string;
}

/** グラフエッジ */
export interface GraphEdge {
  /** ID */
  id: string;
  /** ソースノードID */
  source: string;
  /** ターゲットノードID */
  target: string;
  /** 関係タイプ */
  type: string;
  /** 重み */
  weight: number;
  /** ラベル */
  label?: string;
  /** プロパティ */
  properties?: Record<string, unknown>;
}

/** グラフデータ */
export interface GraphData {
  /** ノード */
  nodes: GraphNode[];
  /** エッジ */
  edges: GraphEdge[];
}

// ============================================================================
// エンティティ
// ============================================================================

/** 抽出エンティティ */
export interface ExtractedEntity {
  /** ID */
  id: string;
  /** 名前 */
  name: string;
  /** 日本語名 */
  nameJa?: string;
  /** エンティティタイプ */
  type: EntityType;
  /** 信頼度スコア（0-1） */
  confidence: number;
  /** 出現回数 */
  occurrences: number;
  /** 出現ドキュメント数 */
  documentCount: number;
  /** 説明 */
  description?: string;
  /** 外部リンク */
  externalLinks?: Array<{
    source: string;
    url: string;
  }>;
}

/** エンティティ関係 */
export interface EntityRelation {
  /** ID */
  id: string;
  /** ソースエンティティ */
  source: ExtractedEntity;
  /** ターゲットエンティティ */
  target: ExtractedEntity;
  /** 関係タイプ */
  type: string;
  /** 信頼度スコア */
  confidence: number;
  /** 根拠ドキュメント */
  evidenceDocuments: string[];
}

// ============================================================================
// コミュニティ・クラスタ
// ============================================================================

/** コミュニティ（クラスタ） */
export interface Community {
  /** ID */
  id: string;
  /** 名前（自動生成） */
  name: string;
  /** 日本語名 */
  nameJa?: string;
  /** 含まれるノードID */
  nodeIds: string[];
  /** キーワード */
  keywords: string[];
  /** 代表的なドキュメント */
  representativeDocIds: string[];
  /** 要約 */
  summary?: string;
  /** 日本語要約 */
  summaryJa?: string;
}

// ============================================================================
// 検索
// ============================================================================

/** 検索クエリ */
export interface GraphSearchQuery {
  /** テキストクエリ */
  text: string;
  /** 検索タイプ */
  searchType: 'semantic' | 'entity' | 'path' | 'community';
  /** フィルタ条件 */
  filters?: {
    /** ノードタイプフィルタ */
    nodeTypes?: NodeType[];
    /** エンティティタイプフィルタ */
    entityTypes?: EntityType[];
    /** ドキュメントタイプフィルタ */
    documentTypes?: DocumentType[];
    /** 日付範囲 */
    dateRange?: {
      start?: Date;
      end?: Date;
    };
    /** 最小信頼度 */
    minConfidence?: number;
  };
  /** 最大結果数 */
  limit?: number;
}

/** 検索結果 */
export interface GraphSearchResult {
  /** クエリ */
  query: GraphSearchQuery;
  /** マッチしたノード */
  nodes: GraphNode[];
  /** 関連エッジ */
  edges: GraphEdge[];
  /** 関連コミュニティ */
  communities: Community[];
  /** AI生成の回答 */
  answer?: string;
  /** 日本語回答 */
  answerJa?: string;
  /** 根拠ドキュメント */
  sourceDocuments: Document[];
  /** 処理時間（ms） */
  processingTimeMs: number;
}

// ============================================================================
// ナレッジギャップ分析
// ============================================================================

/** ナレッジギャップ */
export interface KnowledgeGap {
  /** ID */
  id: string;
  /** ギャップタイプ */
  type: 'missing_link' | 'sparse_area' | 'isolated_cluster' | 'unexplored_relation';
  /** 説明 */
  description: string;
  /** 日本語説明 */
  descriptionJa: string;
  /** 関連ノード */
  relatedNodes: string[];
  /** 研究提案 */
  suggestions: string[];
  /** 日本語研究提案 */
  suggestionsJa: string[];
  /** 重要度スコア（0-1） */
  importance: number;
}

// ============================================================================
// UI状態
// ============================================================================

/** ビューモード */
export type ViewMode = 'graph' | 'list' | 'tree' | 'timeline';

/** グラフ表示設定 */
export interface GraphDisplaySettings {
  /** ノードサイズ基準 */
  nodeSizeBy: 'degree' | 'citations' | 'uniform';
  /** 表示するノードタイプ */
  visibleNodeTypes: NodeType[];
  /** 表示するエッジタイプ */
  visibleEdgeTypes: string[];
  /** ラベル表示 */
  showLabels: boolean;
  /** ホバー時の隣接ノードハイライト */
  highlightNeighbors: boolean;
  /** レイアウトアルゴリズム */
  layout: 'force' | 'circular' | 'hierarchical';
  /** ズームレベル */
  zoom: number;
}

/** GraphRAG UIステート */
export interface GraphRAGState {
  /** ナレッジベースID */
  knowledgeBaseId: string | null;
  /** ステータス */
  status: KnowledgeBaseStatus;
  /** ドキュメント一覧 */
  documents: Document[];
  /** 現在のグラフデータ */
  graphData: GraphData | null;
  /** 選択中のノードID */
  selectedNodeId: string | null;
  /** 検索結果 */
  searchResult: GraphSearchResult | null;
  /** ビューモード */
  viewMode: ViewMode;
  /** 表示設定 */
  displaySettings: GraphDisplaySettings;
  /** ローディング状態 */
  isLoading: boolean;
  /** エラー */
  error: string | null;
}

// ============================================================================
// アクション
// ============================================================================

/** ドキュメント追加入力 */
export interface AddDocumentInput {
  /** ファイル（アップロード時） */
  file?: File;
  /** URL（インポート時） */
  url?: string;
  /** DOI（文献検索時） */
  doi?: string;
  /** タイプ */
  type: DocumentType;
  /** タグ */
  tags?: string[];
}

/** ナレッジベース作成入力 */
export interface CreateKnowledgeBaseInput {
  /** 名前 */
  name: string;
  /** 説明 */
  description?: string;
  /** 研究分野 */
  domain?: string;
}

// ============================================================================
// 統計情報
// ============================================================================

/** ナレッジベース統計 */
export interface KnowledgeBaseStats {
  /** ドキュメント数 */
  documentCount: number;
  /** ノード数 */
  nodeCount: number;
  /** エッジ数 */
  edgeCount: number;
  /** エンティティ数 */
  entityCount: number;
  /** コミュニティ数 */
  communityCount: number;
  /** ノードタイプ別カウント */
  nodesByType: Record<NodeType, number>;
  /** 平均次数 */
  averageDegree: number;
  /** 最終更新日時 */
  lastUpdatedAt: Date;
}

// ============================================================================
// デフォルト設定
// ============================================================================

/** デフォルト表示設定 */
export const DEFAULT_DISPLAY_SETTINGS: GraphDisplaySettings = {
  nodeSizeBy: 'degree',
  visibleNodeTypes: ['paper', 'entity', 'author', 'topic'],
  visibleEdgeTypes: ['cites', 'mentions', 'authored', 'related_to'],
  showLabels: true,
  highlightNeighbors: true,
  layout: 'force',
  zoom: 1.0,
};

/** 初期状態 */
export const INITIAL_GRAPHRAG_STATE: GraphRAGState = {
  knowledgeBaseId: null,
  status: 'empty',
  documents: [],
  graphData: null,
  selectedNodeId: null,
  searchResult: null,
  viewMode: 'graph',
  displaySettings: DEFAULT_DISPLAY_SETTINGS,
  isLoading: false,
  error: null,
};
