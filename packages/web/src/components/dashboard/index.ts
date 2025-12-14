/**
 * @file 統合ダッシュボード - エクスポート
 * @description P0機能: 分野別ワークフロー入口を提供する統合ダッシュボード
 */

// メインコンポーネント
export {
  IntegratedDashboard,
  SimpleDashboard,
  type SimpleDashboardProps,
} from './integrated-dashboard';

// 分野カード関連
export {
  DomainCard,
  DomainCardGrid,
  WelcomeHeader,
  QuickStartPanel,
  NLISearchBox,
} from './domain-cards';

// パネル関連
export {
  RecentActivityPanel,
  StatsPanel,
  PinnedItemsPanel,
  NotificationPanel,
  DomainStatsBar,
  formatRelativeTime,
} from './panels';

// 型定義
export type {
  ResearchDomain,
  DomainInfo,
  QuickStartItem,
  QuickStartAction,
  ActivityLog,
  ActivityType,
  DashboardStats,
  Notification,
  NotificationType,
  PinnedItem,
  PinnedItemType,
  DashboardLayout,
  DashboardSection,
  // コンポーネントProps
  IntegratedDashboardProps,
  DomainCardProps,
  DomainCardGridProps,
  QuickStartPanelProps,
  RecentActivityPanelProps,
  StatsPanelProps,
  PinnedItemsPanelProps,
  NotificationPanelProps,
  WelcomeHeaderProps,
  NLISearchBoxProps,
  DomainStatsBarProps,
} from './types';

// 定数
export {
  DOMAIN_INFO,
  QUICK_START_ITEMS,
  DEFAULT_LAYOUT,
  LABELS,
  ACTIVITY_TYPE_LABELS,
} from './constants';
