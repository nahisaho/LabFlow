/**
 * @file 統合ダッシュボード 定数・マスターデータ
 * @description 分野情報、クイックスタートアイテム等の定数定義
 */

import type { 
  DomainInfo, 
  QuickStartItem, 
  ResearchDomain,
  DashboardLayout,
  DashboardSection,
} from './types';

// ============================================================================
// 分野情報
// ============================================================================

/** 分野マスターデータ */
export const DOMAIN_INFO: Record<ResearchDomain, DomainInfo> = {
  'drug-discovery': {
    id: 'drug-discovery',
    name: 'Drug Discovery',
    nameJa: '創薬',
    description: 'AI-powered drug discovery and molecular optimization',
    descriptionJa: 'AIを活用した創薬・分子最適化',
    icon: '💊',
    tasks: ['Molecule Generation', 'ADMET Prediction', 'Virtual Screening', 'Lead Optimization'],
    models: ['TamGen', 'BioEmu', 'MoleculeTransformer'],
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
  },
  'materials-science': {
    id: 'materials-science',
    name: 'Materials Science',
    nameJa: '材料科学',
    description: 'Novel materials discovery and property prediction',
    descriptionJa: '新材料探索・物性予測',
    icon: '🔬',
    tasks: ['Crystal Generation', 'Property Prediction', 'Stability Analysis', 'Phase Diagram'],
    models: ['MatterGen', 'MatterSim', 'CHGNet'],
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  climate: {
    id: 'climate',
    name: 'Climate Science',
    nameJa: '気候科学',
    description: 'Climate modeling and weather prediction',
    descriptionJa: '気候モデリング・気象予測',
    icon: '🌍',
    tasks: ['Weather Forecast', 'Climate Projection', 'Extreme Event Analysis', 'Carbon Cycle'],
    models: ['Aurora', 'ClimaX', 'FourCastNet'],
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  genomics: {
    id: 'genomics',
    name: 'Genomics',
    nameJa: 'ゲノミクス',
    description: 'Genomic analysis and protein structure prediction',
    descriptionJa: 'ゲノム解析・タンパク質構造予測',
    icon: '🧬',
    tasks: ['Sequence Analysis', 'Variant Calling', 'Gene Expression', 'Protein Folding'],
    models: ['ESM-2', 'AlphaFold', 'GenomeTransformer'],
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
};

/** 分野リスト（順序付き） */
export const DOMAIN_LIST: ResearchDomain[] = [
  'drug-discovery',
  'materials-science',
  'climate',
  'genomics',
];

// ============================================================================
// クイックスタートアイテム
// ============================================================================

/** クイックスタートアイテム */
export const QUICK_START_ITEMS: QuickStartItem[] = [
  {
    id: 'new-project',
    label: 'New Project',
    labelJa: '新規プロジェクト',
    description: 'Start a new research project',
    descriptionJa: '新しい研究プロジェクトを開始',
    icon: '➕',
    href: '/projects/new',
    color: 'bg-blue-500',
  },
  {
    id: 'use-template',
    label: 'Use Template',
    labelJa: 'テンプレートを使う',
    description: 'Start from a workflow template',
    descriptionJa: 'ワークフローテンプレートから開始',
    icon: '📋',
    href: '/templates',
    color: 'bg-green-500',
  },
  {
    id: 'import-data',
    label: 'Import Data',
    labelJa: 'データをインポート',
    description: 'Import research data from file',
    descriptionJa: 'ファイルから研究データをインポート',
    icon: '📥',
    href: '/import',
    color: 'bg-purple-500',
  },
  {
    id: 'explore-models',
    label: 'Explore Models',
    labelJa: 'モデルを探索',
    description: 'Browse available AI models',
    descriptionJa: '利用可能なAIモデルを閲覧',
    icon: '🤖',
    href: '/models',
    color: 'bg-orange-500',
  },
  {
    id: 'start-tutorial',
    label: 'Start Tutorial',
    labelJa: 'チュートリアルを開始',
    description: 'Learn with hands-on tutorials',
    descriptionJa: 'ハンズオンチュートリアルで学ぶ',
    icon: '📚',
    href: '/tutorials',
    color: 'bg-pink-500',
  },
  {
    id: 'browse-literature',
    label: 'Browse Literature',
    labelJa: '文献を検索',
    description: 'Search scientific literature',
    descriptionJa: '科学文献を検索',
    icon: '🔍',
    href: '/literature',
    color: 'bg-teal-500',
  },
];

// ============================================================================
// アクティビティタイプラベル
// ============================================================================

/** アクティビティタイプラベル */
export const ACTIVITY_TYPE_LABELS = {
  en: {
    project_created: 'Created project',
    workflow_completed: 'Workflow completed',
    model_executed: 'Executed model',
    data_imported: 'Imported data',
    result_exported: 'Exported results',
    tutorial_completed: 'Completed tutorial',
  },
  ja: {
    project_created: 'プロジェクトを作成',
    workflow_completed: 'ワークフローが完了',
    model_executed: 'モデルを実行',
    data_imported: 'データをインポート',
    result_exported: '結果をエクスポート',
    tutorial_completed: 'チュートリアルを完了',
  },
};

/** アクティビティアイコン */
export const ACTIVITY_TYPE_ICONS: Record<string, string> = {
  project_created: '📁',
  workflow_completed: '✅',
  model_executed: '⚡',
  data_imported: '📥',
  result_exported: '📤',
  tutorial_completed: '🎓',
};

// ============================================================================
// デフォルトレイアウト
// ============================================================================

/** デフォルトセクション順序 */
export const DEFAULT_SECTION_ORDER: DashboardSection[] = [
  'domain-cards',
  'quick-start',
  'stats',
  'recent-activity',
  'pinned',
  'notifications',
];

/** デフォルトレイアウト */
export const DEFAULT_LAYOUT: DashboardLayout = {
  visibleSections: ['domain-cards', 'quick-start', 'stats', 'recent-activity'],
  sectionOrder: DEFAULT_SECTION_ORDER,
  compactMode: false,
};

// ============================================================================
// ラベル
// ============================================================================

/** UIラベル */
export const LABELS = {
  en: {
    dashboard: 'Dashboard',
    welcomeMessage: 'Welcome to LabFlow',
    welcomeSubtitle: 'Select a research domain to get started',
    quickStart: 'Quick Start',
    recentActivity: 'Recent Activity',
    viewAll: 'View All',
    pinnedItems: 'Pinned Items',
    notifications: 'Notifications',
    markAllRead: 'Mark All Read',
    noActivity: 'No recent activity',
    noPinned: 'No pinned items',
    noNotifications: 'No notifications',
    projects: 'projects',
    activeWorkflows: 'Active Workflows',
    completedWorkflows: 'Completed Workflows',
    modelExecutions: 'Model Executions',
    thisWeek: 'This Week',
    vsLastWeek: 'vs last week',
  },
  ja: {
    dashboard: 'ダッシュボード',
    welcomeMessage: 'LabFlow へようこそ',
    welcomeSubtitle: '研究分野を選択して始めましょう',
    quickStart: 'クイックスタート',
    recentActivity: '最近のアクティビティ',
    viewAll: 'すべて表示',
    pinnedItems: 'ピン留め',
    notifications: 'お知らせ',
    markAllRead: 'すべて既読にする',
    noActivity: 'アクティビティはありません',
    noPinned: 'ピン留めアイテムはありません',
    noNotifications: 'お知らせはありません',
    projects: 'プロジェクト',
    activeWorkflows: '実行中ワークフロー',
    completedWorkflows: '完了ワークフロー',
    modelExecutions: 'モデル実行回数',
    thisWeek: '今週',
    vsLastWeek: '先週比',
  },
};
