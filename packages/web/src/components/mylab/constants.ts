/**
 * @file My Lab Data 定数・ラベル定義
 * @description データセットタイプ、ロール等の表示ラベルと設定
 */

import type {
  DatasetType,
  DataVisibility,
  ExperimentStatus,
  MemberRole,
  KnowledgeType,
  ActivityType,
  MyLabView,
} from './types';

// ============================================================================
// データセットタイプ
// ============================================================================

export interface DatasetTypeInfo {
  id: DatasetType;
  label: string;
  labelJa: string;
  icon: string;
  description: string;
  descriptionJa: string;
  color: string;
}

export const DATASET_TYPES: Record<DatasetType, DatasetTypeInfo> = {
  molecules: {
    id: 'molecules',
    label: 'Molecules',
    labelJa: '分子',
    icon: '🧪',
    description: 'Chemical structures and properties',
    descriptionJa: '化学構造と特性データ',
    color: 'text-cyan-600',
  },
  proteins: {
    id: 'proteins',
    label: 'Proteins',
    labelJa: 'タンパク質',
    icon: '🔬',
    description: 'Protein sequences and structures',
    descriptionJa: 'タンパク質配列と構造',
    color: 'text-red-600',
  },
  sequences: {
    id: 'sequences',
    label: 'Sequences',
    labelJa: '配列',
    icon: '🧬',
    description: 'DNA/RNA sequences',
    descriptionJa: 'DNA/RNA配列',
    color: 'text-indigo-600',
  },
  spectra: {
    id: 'spectra',
    label: 'Spectra',
    labelJa: 'スペクトル',
    icon: '📊',
    description: 'Spectroscopic data',
    descriptionJa: '分光データ',
    color: 'text-purple-600',
  },
  images: {
    id: 'images',
    label: 'Images',
    labelJa: '画像',
    icon: '🖼️',
    description: 'Microscopy and imaging data',
    descriptionJa: '顕微鏡・画像データ',
    color: 'text-pink-600',
  },
  tabular: {
    id: 'tabular',
    label: 'Tabular',
    labelJa: 'テーブル',
    icon: '📋',
    description: 'Structured tabular data',
    descriptionJa: '構造化テーブルデータ',
    color: 'text-blue-600',
  },
  time_series: {
    id: 'time_series',
    label: 'Time Series',
    labelJa: '時系列',
    icon: '📈',
    description: 'Time-dependent measurements',
    descriptionJa: '時系列測定データ',
    color: 'text-green-600',
  },
  other: {
    id: 'other',
    label: 'Other',
    labelJa: 'その他',
    icon: '📁',
    description: 'Other data types',
    descriptionJa: 'その他のデータ',
    color: 'text-gray-600',
  },
};

// ============================================================================
// 可視性
// ============================================================================

export interface VisibilityInfo {
  id: DataVisibility;
  label: string;
  labelJa: string;
  icon: string;
  description: string;
  descriptionJa: string;
}

export const VISIBILITY_OPTIONS: Record<DataVisibility, VisibilityInfo> = {
  private: {
    id: 'private',
    label: 'Private',
    labelJa: 'プライベート',
    icon: '🔒',
    description: 'Only you can access',
    descriptionJa: '自分のみアクセス可能',
  },
  lab: {
    id: 'lab',
    label: 'Lab',
    labelJa: 'ラボ内',
    icon: '👥',
    description: 'Lab members can access',
    descriptionJa: 'ラボメンバーがアクセス可能',
  },
  public: {
    id: 'public',
    label: 'Public',
    labelJa: '公開',
    icon: '🌐',
    description: 'Anyone can access',
    descriptionJa: '誰でもアクセス可能',
  },
};

// ============================================================================
// 実験ステータス
// ============================================================================

export interface ExperimentStatusInfo {
  id: ExperimentStatus;
  label: string;
  labelJa: string;
  icon: string;
  color: string;
}

export const EXPERIMENT_STATUSES: Record<ExperimentStatus, ExperimentStatusInfo> = {
  draft: {
    id: 'draft',
    label: 'Draft',
    labelJa: '下書き',
    icon: '📝',
    color: 'text-gray-600',
  },
  running: {
    id: 'running',
    label: 'Running',
    labelJa: '実行中',
    icon: '⏳',
    color: 'text-blue-600',
  },
  completed: {
    id: 'completed',
    label: 'Completed',
    labelJa: '完了',
    icon: '✅',
    color: 'text-green-600',
  },
  failed: {
    id: 'failed',
    label: 'Failed',
    labelJa: '失敗',
    icon: '❌',
    color: 'text-red-600',
  },
  cancelled: {
    id: 'cancelled',
    label: 'Cancelled',
    labelJa: 'キャンセル',
    icon: '⛔',
    color: 'text-orange-600',
  },
};

// ============================================================================
// メンバーロール
// ============================================================================

export interface RoleInfo {
  id: MemberRole;
  label: string;
  labelJa: string;
  description: string;
  descriptionJa: string;
  permissions: string[];
}

export const MEMBER_ROLES: Record<MemberRole, RoleInfo> = {
  owner: {
    id: 'owner',
    label: 'Owner',
    labelJa: 'オーナー',
    description: 'Full control of the lab',
    descriptionJa: 'ラボの全権限',
    permissions: ['all'],
  },
  admin: {
    id: 'admin',
    label: 'Admin',
    labelJa: '管理者',
    description: 'Can manage members and settings',
    descriptionJa: 'メンバーと設定の管理が可能',
    permissions: ['manage_members', 'manage_settings', 'crud_all'],
  },
  member: {
    id: 'member',
    label: 'Member',
    labelJa: 'メンバー',
    description: 'Can create and edit data',
    descriptionJa: 'データの作成・編集が可能',
    permissions: ['create', 'edit_own', 'view'],
  },
  viewer: {
    id: 'viewer',
    label: 'Viewer',
    labelJa: '閲覧者',
    description: 'Can only view data',
    descriptionJa: 'データの閲覧のみ',
    permissions: ['view'],
  },
};

// ============================================================================
// ナレッジタイプ
// ============================================================================

export interface KnowledgeTypeInfo {
  id: KnowledgeType;
  label: string;
  labelJa: string;
  icon: string;
  description: string;
  descriptionJa: string;
}

export const KNOWLEDGE_TYPES: Record<KnowledgeType, KnowledgeTypeInfo> = {
  protocol: {
    id: 'protocol',
    label: 'Protocol',
    labelJa: 'プロトコル',
    icon: '📋',
    description: 'Experimental protocols and procedures',
    descriptionJa: '実験プロトコルと手順',
  },
  insight: {
    id: 'insight',
    label: 'Insight',
    labelJa: '洞察',
    icon: '💡',
    description: 'Key insights and learnings',
    descriptionJa: '重要な洞察と学び',
  },
  finding: {
    id: 'finding',
    label: 'Finding',
    labelJa: '発見',
    icon: '🔍',
    description: 'Research findings and discoveries',
    descriptionJa: '研究結果と発見',
  },
  hypothesis: {
    id: 'hypothesis',
    label: 'Hypothesis',
    labelJa: '仮説',
    icon: '🎯',
    description: 'Research hypotheses',
    descriptionJa: '研究仮説',
  },
  note: {
    id: 'note',
    label: 'Note',
    labelJa: 'ノート',
    icon: '📝',
    description: 'General notes and observations',
    descriptionJa: '一般的なノートと観察',
  },
};

// ============================================================================
// アクティビティタイプ
// ============================================================================

export interface ActivityTypeInfo {
  id: ActivityType;
  label: string;
  labelJa: string;
  icon: string;
}

export const ACTIVITY_TYPES: Record<ActivityType, ActivityTypeInfo> = {
  dataset_created: {
    id: 'dataset_created',
    label: 'Dataset created',
    labelJa: 'データセット作成',
    icon: '📁',
  },
  dataset_updated: {
    id: 'dataset_updated',
    label: 'Dataset updated',
    labelJa: 'データセット更新',
    icon: '📝',
  },
  experiment_started: {
    id: 'experiment_started',
    label: 'Experiment started',
    labelJa: '実験開始',
    icon: '▶️',
  },
  experiment_completed: {
    id: 'experiment_completed',
    label: 'Experiment completed',
    labelJa: '実験完了',
    icon: '✅',
  },
  knowledge_added: {
    id: 'knowledge_added',
    label: 'Knowledge added',
    labelJa: 'ナレッジ追加',
    icon: '💡',
  },
  member_joined: {
    id: 'member_joined',
    label: 'Member joined',
    labelJa: 'メンバー参加',
    icon: '👋',
  },
  member_left: {
    id: 'member_left',
    label: 'Member left',
    labelJa: 'メンバー脱退',
    icon: '👋',
  },
};

// ============================================================================
// ビュー
// ============================================================================

export interface ViewInfo {
  id: MyLabView;
  label: string;
  labelJa: string;
  icon: string;
}

export const MYLAB_VIEWS: Record<MyLabView, ViewInfo> = {
  overview: {
    id: 'overview',
    label: 'Overview',
    labelJa: '概要',
    icon: '📊',
  },
  datasets: {
    id: 'datasets',
    label: 'Datasets',
    labelJa: 'データセット',
    icon: '📁',
  },
  experiments: {
    id: 'experiments',
    label: 'Experiments',
    labelJa: '実験',
    icon: '🧪',
  },
  knowledge: {
    id: 'knowledge',
    label: 'Knowledge',
    labelJa: 'ナレッジ',
    icon: '💡',
  },
  members: {
    id: 'members',
    label: 'Members',
    labelJa: 'メンバー',
    icon: '👥',
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    labelJa: '設定',
    icon: '⚙️',
  },
};

// ============================================================================
// UIテキスト
// ============================================================================

export const UI_TEXT = {
  // ヘッダー
  title: 'My Lab Data',
  titleJa: 'マイラボデータ',
  subtitle: 'Team data and knowledge management',
  subtitleJa: 'チームデータ・ナレッジ管理',

  // アクション
  createLab: 'Create Lab',
  createLabJa: 'ラボを作成',
  switchLab: 'Switch Lab',
  switchLabJa: 'ラボを切り替え',
  addDataset: 'Add Dataset',
  addDatasetJa: 'データセット追加',
  newExperiment: 'New Experiment',
  newExperimentJa: '新規実験',
  addKnowledge: 'Add Knowledge',
  addKnowledgeJa: 'ナレッジ追加',
  inviteMember: 'Invite Member',
  inviteMemberJa: 'メンバー招待',

  // 状態
  noLabs: 'No labs yet',
  noLabsJa: 'ラボがありません',
  noLabsDescription: 'Create your first lab to start collaborating',
  noLabsDescriptionJa: '最初のラボを作成してコラボレーションを開始しましょう',
  noDatasets: 'No datasets yet',
  noDatasetsJa: 'データセットがありません',
  noExperiments: 'No experiments yet',
  noExperimentsJa: '実験がありません',
  noKnowledge: 'No knowledge items yet',
  noKnowledgeJa: 'ナレッジがありません',

  // 統計
  storage: 'Storage',
  storageJa: 'ストレージ',
  used: 'Used',
  usedJa: '使用中',
  of: 'of',
  ofJa: '/',
  recentActivity: 'Recent Activity',
  recentActivityJa: '最近のアクティビティ',
};
