/**
 * @file 統合ダッシュボード 型定義
 * @description 分野別ワークフロー入口・クイックスタート機能の型定義
 */

// ============================================================================
// 研究分野
// ============================================================================

/** 研究分野 */
export type ResearchDomain = 
  | 'drug-discovery'
  | 'materials-science'
  | 'climate'
  | 'genomics';

/** 分野情報 */
export interface DomainInfo {
  /** 分野ID */
  id: ResearchDomain;
  /** 英語名 */
  name: string;
  /** 日本語名 */
  nameJa: string;
  /** 説明 */
  description: string;
  /** 日本語説明 */
  descriptionJa: string;
  /** アイコン（絵文字） */
  icon: string;
  /** 代表的なタスク */
  tasks: string[];
  /** 代表的なモデル */
  models: string[];
  /** 背景色クラス */
  bgColor: string;
  /** テキスト色クラス */
  textColor: string;
  /** ボーダー色クラス */
  borderColor: string;
}

// ============================================================================
// クイックスタート
// ============================================================================

/** クイックスタートアクション */
export type QuickStartAction = 
  | 'new-project'
  | 'use-template'
  | 'import-data'
  | 'explore-models'
  | 'start-tutorial'
  | 'browse-literature';

/** クイックスタートアイテム */
export interface QuickStartItem {
  /** アクションID */
  id: QuickStartAction;
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
  /** リンク先 */
  href?: string;
  /** カラー */
  color: string;
}

// ============================================================================
// 最近のアクティビティ
// ============================================================================

/** アクティビティタイプ */
export type ActivityType = 
  | 'project_created'
  | 'workflow_completed'
  | 'model_executed'
  | 'data_imported'
  | 'result_exported'
  | 'tutorial_completed';

/** アクティビティログ */
export interface ActivityLog {
  /** ID */
  id: string;
  /** タイプ */
  type: ActivityType;
  /** タイトル */
  title: string;
  /** 日本語タイトル */
  titleJa: string;
  /** 詳細 */
  details?: string;
  /** タイムスタンプ */
  timestamp: Date;
  /** 関連プロジェクトID */
  projectId?: string;
  /** 関連分野 */
  domain?: ResearchDomain;
}

// ============================================================================
// 統計情報
// ============================================================================

/** ダッシュボード統計 */
export interface DashboardStats {
  /** 総プロジェクト数 */
  totalProjects: number;
  /** アクティブワークフロー数 */
  activeWorkflows: number;
  /** 完了ワークフロー数 */
  completedWorkflows: number;
  /** モデル実行回数 */
  modelExecutions: number;
  /** 分野別プロジェクト数 */
  projectsByDomain: Record<ResearchDomain, number>;
  /** 今週の実行数 */
  weeklyExecutions: number;
  /** 先週比 */
  weeklyChange: number;
}

// ============================================================================
// お知らせ・通知
// ============================================================================

/** 通知タイプ */
export type NotificationType = 'info' | 'success' | 'warning' | 'update';

/** 通知 */
export interface Notification {
  /** ID */
  id: string;
  /** タイプ */
  type: NotificationType;
  /** タイトル */
  title: string;
  /** 日本語タイトル */
  titleJa: string;
  /** 内容 */
  content?: string;
  /** 日本語内容 */
  contentJa?: string;
  /** リンク */
  href?: string;
  /** 作成日時 */
  createdAt: Date;
  /** 既読フラグ */
  isRead: boolean;
}

// ============================================================================
// お気に入り・ピン留め
// ============================================================================

/** ピン留めアイテムタイプ */
export type PinnedItemType = 'project' | 'workflow' | 'model' | 'template';

/** ピン留めアイテム */
export interface PinnedItem {
  /** ID */
  id: string;
  /** タイプ */
  type: PinnedItemType;
  /** 名前 */
  name: string;
  /** 日本語名 */
  nameJa?: string;
  /** 分野 */
  domain?: ResearchDomain;
  /** リンク */
  href: string;
  /** 最終アクセス */
  lastAccessed: Date;
}

// ============================================================================
// レイアウト設定
// ============================================================================

/** ダッシュボードセクション */
export type DashboardSection = 
  | 'domain-cards'
  | 'quick-start'
  | 'recent-activity'
  | 'stats'
  | 'pinned'
  | 'notifications';

/** レイアウト設定 */
export interface DashboardLayout {
  /** 表示するセクション */
  visibleSections: DashboardSection[];
  /** セクション順序 */
  sectionOrder: DashboardSection[];
  /** コンパクトモード */
  compactMode: boolean;
}

// ============================================================================
// コンポーネントProps
// ============================================================================

/** DomainCard Props */
export interface DomainCardProps {
  /** 分野情報 */
  domain: DomainInfo;
  /** プロジェクト数 */
  projectCount?: number;
  /** クリックハンドラ */
  onClick?: () => void;
  /** 日本語表示 */
  useJapaneseLabels?: boolean;
}

/** QuickStartPanel Props */
export interface QuickStartPanelProps {
  /** アイテム */
  items: QuickStartItem[];
  /** クリックハンドラ */
  onItemClick?: (item: QuickStartItem) => void;
  /** 日本語表示 */
  useJapaneseLabels?: boolean;
}

/** RecentActivityPanel Props */
export interface RecentActivityPanelProps {
  /** アクティビティ */
  activities: ActivityLog[];
  /** 最大表示件数 */
  maxItems?: number;
  /** もっと見るハンドラ */
  onViewMore?: () => void;
  /** 日本語表示 */
  useJapaneseLabels?: boolean;
}

/** StatsPanel Props */
export interface StatsPanelProps {
  /** 統計データ */
  stats: DashboardStats;
  /** 日本語表示 */
  useJapaneseLabels?: boolean;
}

/** PinnedItemsPanel Props */
export interface PinnedItemsPanelProps {
  /** ピン留めアイテム */
  items: PinnedItem[];
  /** ピン解除ハンドラ */
  onUnpin?: (id: string) => void;
  /** 日本語表示 */
  useJapaneseLabels?: boolean;
}

/** NotificationPanel Props */
export interface NotificationPanelProps {
  /** 通知 */
  notifications: Notification[];
  /** 既読にするハンドラ */
  onMarkRead?: (id: string) => void;
  /** 全て既読にするハンドラ */
  onMarkAllRead?: () => void;
  /** 日本語表示 */
  useJapaneseLabels?: boolean;
}

/** IntegratedDashboard Props */
export interface IntegratedDashboardProps {
  /** 統計データ */
  stats?: DashboardStats;
  /** 最近のアクティビティ */
  recentActivities?: ActivityLog[];
  /** ピン留めアイテム */
  pinnedItems?: PinnedItem[];
  /** 通知 */
  notifications?: Notification[];
  /** レイアウト設定 */
  layout?: Partial<DashboardLayout>;
  /** 分野選択ハンドラ */
  onDomainSelect?: (domain: ResearchDomain) => void;
  /** クイックスタートハンドラ */
  onQuickStart?: (action: QuickStartAction) => void;
  /** 日本語表示 */
  useJapaneseLabels?: boolean;
}
