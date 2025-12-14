/**
 * @file My Lab Data UI 型定義
 * @description チーム共有のデータ・ナレッジ管理機能の型定義
 * 
 * Requirements:
 * - LAB-CORE-001: Team collaboration
 * - LAB-CORE-002: Data sharing
 * - LAB-DATA-001: Dataset management
 * - LAB-EXP-001: Experiment tracking
 */

// ============================================================================
// ラボ関連
// ============================================================================

/** メンバーロール */
export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

/** ラボ設定 */
export interface LabSettings {
  /** データセットエクスポート許可 */
  allowDatasetExport: boolean;
  /** 公開時承認必要 */
  requireApprovalForPublic: boolean;
  /** デフォルト可視性 */
  defaultVisibility: DataVisibility;
  /** 最大ストレージ(GB) */
  maxStorageGb: number;
  /** GraphRAG有効 */
  enableGraphRAG: boolean;
}

/** ラボ */
export interface Lab {
  /** ID */
  id: string;
  /** 名前 */
  name: string;
  /** 説明 */
  description: string | null;
  /** アイコンURL */
  iconUrl: string | null;
  /** 設定 */
  settings: LabSettings;
  /** 作成者ID */
  createdById: string;
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

/** ラボ統計付き */
export interface LabWithStats extends Lab {
  /** メンバー数 */
  memberCount: number;
  /** データセット数 */
  datasetCount: number;
  /** 実験数 */
  experimentCount: number;
  /** 使用ストレージ(GB) */
  storageUsedGb: number;
}

/** ラボメンバー */
export interface LabMember {
  /** ID */
  id: string;
  /** ラボID */
  labId: string;
  /** ユーザーID */
  userId: string;
  /** ロール */
  role: MemberRole;
  /** ユーザー情報 */
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  /** 参加日時 */
  joinedAt: Date;
}

// ============================================================================
// データセット関連
// ============================================================================

/** データセットタイプ */
export type DatasetType =
  | 'molecules'
  | 'proteins'
  | 'sequences'
  | 'spectra'
  | 'images'
  | 'tabular'
  | 'time_series'
  | 'other';

/** データ可視性 */
export type DataVisibility = 'private' | 'lab' | 'public';

/** データセットスキーマ */
export interface DatasetSchema {
  /** カラム */
  columns: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array';
    nullable?: boolean;
    description?: string;
  }>;
  /** プライマリキー */
  primaryKey?: string;
  /** バージョン */
  version?: string;
}

/** データセット */
export interface Dataset {
  /** ID */
  id: string;
  /** ラボID */
  labId: string;
  /** 名前 */
  name: string;
  /** 日本語名 */
  nameJa?: string;
  /** 説明 */
  description: string | null;
  /** 日本語説明 */
  descriptionJa?: string | null;
  /** タイプ */
  type: DatasetType;
  /** 可視性 */
  visibility: DataVisibility;
  /** スキーマ */
  schema: DatasetSchema | null;
  /** ストレージパス */
  storagePath: string;
  /** サイズ(バイト) */
  sizeBytes: number;
  /** 行数 */
  rowCount: number | null;
  /** インデックス済み（GraphRAG） */
  isIndexed: boolean;
  /** タグ */
  tags: string[];
  /** バージョン */
  version: number;
  /** 親データセットID（バージョニング用） */
  parentId: string | null;
  /** カスタムフィールド */
  customFields: Record<string, unknown>;
  /** 作成者情報 */
  createdBy: {
    id: string;
    name: string | null;
  };
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

// ============================================================================
// 実験関連
// ============================================================================

/** 実験ステータス */
export type ExperimentStatus =
  | 'draft'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/** 実験結果 */
export interface ExperimentResults {
  /** メトリクス */
  metrics?: Record<string, number>;
  /** アーティファクト */
  artifacts?: string[];
  /** 出力 */
  outputs?: Record<string, unknown>;
  /** エラー */
  error?: string;
}

/** 実験 */
export interface Experiment {
  /** ID */
  id: string;
  /** ラボID */
  labId: string;
  /** 名前 */
  name: string;
  /** 日本語名 */
  nameJa?: string;
  /** 説明 */
  description: string | null;
  /** 日本語説明 */
  descriptionJa?: string | null;
  /** ステータス */
  status: ExperimentStatus;
  /** ワークフローID */
  workflowId: string | null;
  /** パラメータ */
  parameters: Record<string, unknown>;
  /** 結果 */
  results: ExperimentResults | null;
  /** タグ */
  tags: string[];
  /** 作成者情報 */
  createdBy: {
    id: string;
    name: string | null;
  };
  /** 開始日時 */
  startedAt: Date | null;
  /** 完了日時 */
  completedAt: Date | null;
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

// ============================================================================
// ナレッジ関連
// ============================================================================

/** ナレッジタイプ */
export type KnowledgeType =
  | 'protocol'
  | 'insight'
  | 'finding'
  | 'hypothesis'
  | 'note';

/** ナレッジアイテム */
export interface KnowledgeItem {
  /** ID */
  id: string;
  /** ラボID */
  labId: string;
  /** タイトル */
  title: string;
  /** 日本語タイトル */
  titleJa?: string;
  /** タイプ */
  type: KnowledgeType;
  /** 内容（Markdown） */
  content: string;
  /** タグ */
  tags: string[];
  /** 関連データセットID */
  relatedDatasetIds: string[];
  /** 関連実験ID */
  relatedExperimentIds: string[];
  /** 作成者情報 */
  createdBy: {
    id: string;
    name: string | null;
  };
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

// ============================================================================
// アクティビティ
// ============================================================================

/** アクティビティタイプ */
export type ActivityType =
  | 'dataset_created'
  | 'dataset_updated'
  | 'experiment_started'
  | 'experiment_completed'
  | 'knowledge_added'
  | 'member_joined'
  | 'member_left';

/** アクティビティログ */
export interface ActivityLog {
  /** ID */
  id: string;
  /** ラボID */
  labId: string;
  /** タイプ */
  type: ActivityType;
  /** タイトル */
  title: string;
  /** 日本語タイトル */
  titleJa: string;
  /** 詳細 */
  details?: string;
  /** ユーザー情報 */
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  /** タイムスタンプ */
  timestamp: Date;
}

// ============================================================================
// UI状態
// ============================================================================

/** 現在のビュー */
export type MyLabView =
  | 'overview'
  | 'datasets'
  | 'experiments'
  | 'knowledge'
  | 'members'
  | 'settings';

/** My Lab Data UIステート */
export interface MyLabDataState {
  /** 現在のラボID */
  currentLabId: string | null;
  /** ラボ一覧 */
  labs: LabWithStats[];
  /** 現在のビュー */
  currentView: MyLabView;
  /** 選択中のデータセットID */
  selectedDatasetId: string | null;
  /** 選択中の実験ID */
  selectedExperimentId: string | null;
  /** ローディング状態 */
  isLoading: boolean;
  /** エラー */
  error: string | null;
}

// ============================================================================
// 入力型
// ============================================================================

/** ラボ作成入力 */
export interface CreateLabInput {
  /** 名前 */
  name: string;
  /** 説明 */
  description?: string;
  /** アイコンURL */
  iconUrl?: string;
  /** 設定 */
  settings?: Partial<LabSettings>;
}

/** データセット作成入力 */
export interface CreateDatasetInput {
  /** 名前 */
  name: string;
  /** 説明 */
  description?: string;
  /** タイプ */
  type: DatasetType;
  /** 可視性 */
  visibility?: DataVisibility;
  /** タグ */
  tags?: string[];
  /** ファイル */
  file?: File;
}

/** 実験作成入力 */
export interface CreateExperimentInput {
  /** 名前 */
  name: string;
  /** 説明 */
  description?: string;
  /** ワークフローID */
  workflowId?: string;
  /** パラメータ */
  parameters?: Record<string, unknown>;
  /** タグ */
  tags?: string[];
}

/** ナレッジ作成入力 */
export interface CreateKnowledgeInput {
  /** タイトル */
  title: string;
  /** タイプ */
  type: KnowledgeType;
  /** 内容 */
  content: string;
  /** タグ */
  tags?: string[];
  /** 関連データセットID */
  relatedDatasetIds?: string[];
  /** 関連実験ID */
  relatedExperimentIds?: string[];
}

/** メンバー招待入力 */
export interface InviteMemberInput {
  /** メールアドレス */
  email: string;
  /** ロール */
  role: MemberRole;
}

// ============================================================================
// デフォルト設定
// ============================================================================

/** デフォルトラボ設定 */
export const DEFAULT_LAB_SETTINGS: LabSettings = {
  allowDatasetExport: true,
  requireApprovalForPublic: true,
  defaultVisibility: 'lab',
  maxStorageGb: 100,
  enableGraphRAG: true,
};

/** 初期状態 */
export const INITIAL_MYLAB_STATE: MyLabDataState = {
  currentLabId: null,
  labs: [],
  currentView: 'overview',
  selectedDatasetId: null,
  selectedExperimentId: null,
  isLoading: false,
  error: null,
};
