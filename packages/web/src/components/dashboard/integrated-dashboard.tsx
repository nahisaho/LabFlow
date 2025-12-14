/**
 * @file 統合ダッシュボード メインコンポーネント
 * @description P0機能: 分野別ワークフロー入口を提供する統合ダッシュボード
 */

'use client';

import React, { useState, useCallback } from 'react';
import type {
  IntegratedDashboardProps,
  DashboardStats,
  ActivityLog,
  PinnedItem,
  Notification,
  DashboardLayout,
  ResearchDomain,
  DomainInfo,
  QuickStartItem,
  QuickStartAction,
} from './types';
import {
  DOMAIN_INFO,
  QUICK_START_ITEMS,
  DEFAULT_LAYOUT,
  LABELS,
} from './constants';
import {
  WelcomeHeader,
  DomainCardGrid,
  QuickStartPanel,
  NLISearchBox,
} from './domain-cards';
import {
  RecentActivityPanel,
  StatsPanel,
  PinnedItemsPanel,
  NotificationPanel,
  DomainStatsBar,
} from './panels';

// ============================================================================
// デフォルト値
// ============================================================================

const DEFAULT_STATS: DashboardStats = {
  totalProjects: 0,
  activeWorkflows: 0,
  completedWorkflows: 0,
  modelExecutions: 0,
  projectsByDomain: {
    'drug-discovery': 0,
    'materials-science': 0,
    climate: 0,
    genomics: 0,
  },
  weeklyExecutions: 0,
  weeklyChange: 0,
};

// ============================================================================
// IntegratedDashboard - 統合ダッシュボード
// ============================================================================

/**
 * 統合ダッシュボード
 * 
 * P0機能: 分野別（創薬、材料、気候、ゲノム）のワークフロー入口
 * 
 * @example
 * ```tsx
 * <IntegratedDashboard
 *   stats={dashboardStats}
 *   recentActivities={activities}
 *   onDomainSelect={(domain) => router.push(`/domains/${domain.id}`)}
 *   onQuickStart={(action) => handleQuickStart(action)}
 * />
 * ```
 */
export function IntegratedDashboard({
  stats = DEFAULT_STATS,
  recentActivities = [],
  pinnedItems = [],
  notifications = [],
  layout: layoutOverrides,
  onDomainSelect,
  onQuickStart,
  useJapaneseLabels = true,
}: IntegratedDashboardProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  
  // レイアウト設定
  const layout: DashboardLayout = {
    ...DEFAULT_LAYOUT,
    ...layoutOverrides,
  };

  // NLI検索ハンドラ
  const handleNLISearch = useCallback((query: string) => {
    // NLIサービスに転送（実装は別途）
    console.log('NLI Query:', query);
  }, []);

  // 分野選択ハンドラ
  const handleDomainSelect = useCallback((domain: DomainInfo) => {
    onDomainSelect?.(domain.id);
  }, [onDomainSelect]);

  // クイックスタートハンドラ
  const handleQuickStart = useCallback((item: QuickStartItem) => {
    onQuickStart?.(item.id);
  }, [onQuickStart]);

  // セクション表示判定
  const showSection = (section: string) => 
    layout.visibleSections.includes(section as any);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ウェルカムヘッダー */}
        <WelcomeHeader useJapaneseLabels={useJapaneseLabels} />

        {/* NLI検索ボックス */}
        <div className="mb-8">
          <NLISearchBox
            onSubmit={handleNLISearch}
            useJapaneseLabels={useJapaneseLabels}
          />
        </div>

        {/* 分野カードグリッド */}
        {showSection('domain-cards') && (
          <section className="mb-8">
            <DomainCardGrid
              projectCounts={stats.projectsByDomain}
              onDomainSelect={handleDomainSelect}
              useJapaneseLabels={useJapaneseLabels}
            />
          </section>
        )}

        {/* クイックスタート */}
        {showSection('quick-start') && (
          <section className="mb-8">
            <QuickStartPanel
              items={QUICK_START_ITEMS}
              onItemClick={handleQuickStart}
              useJapaneseLabels={useJapaneseLabels}
            />
          </section>
        )}

        {/* 統計情報 */}
        {showSection('stats') && (
          <section className="mb-8">
            <StatsPanel
              stats={stats}
              useJapaneseLabels={useJapaneseLabels}
            />
            {stats.totalProjects > 0 && (
              <div className="mt-4">
                <DomainStatsBar
                  stats={stats.projectsByDomain}
                  useJapaneseLabels={useJapaneseLabels}
                />
              </div>
            )}
          </section>
        )}

        {/* 下部パネル（2カラム） */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左カラム: アクティビティ */}
          <div className="space-y-6">
            {showSection('recent-activity') && (
              <RecentActivityPanel
                activities={recentActivities}
                maxItems={5}
                useJapaneseLabels={useJapaneseLabels}
              />
            )}
            
            {showSection('pinned') && pinnedItems.length > 0 && (
              <PinnedItemsPanel
                items={pinnedItems}
                useJapaneseLabels={useJapaneseLabels}
              />
            )}
          </div>

          {/* 右カラム: 通知 */}
          <div className="space-y-6">
            {showSection('notifications') && notifications.length > 0 && (
              <NotificationPanel
                notifications={notifications}
                useJapaneseLabels={useJapaneseLabels}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SimpleDashboard - シンプル版ダッシュボード
// ============================================================================

export interface SimpleDashboardProps {
  /** 分野選択ハンドラ */
  onDomainSelect?: (domain: ResearchDomain) => void;
  /** 日本語表示 */
  useJapaneseLabels?: boolean;
}

/**
 * シンプル版ダッシュボード
 * 分野カードのみを表示する軽量版
 */
export function SimpleDashboard({
  onDomainSelect,
  useJapaneseLabels = true,
}: SimpleDashboardProps) {
  const handleDomainSelect = useCallback((domain: DomainInfo) => {
    onDomainSelect?.(domain.id);
  }, [onDomainSelect]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WelcomeHeader useJapaneseLabels={useJapaneseLabels} />
        
        <div className="mb-8">
          <NLISearchBox useJapaneseLabels={useJapaneseLabels} />
        </div>
        
        <DomainCardGrid
          onDomainSelect={handleDomainSelect}
          useJapaneseLabels={useJapaneseLabels}
        />
      </div>
    </div>
  );
}

// ============================================================================
// エクスポート
// ============================================================================

export {
  WelcomeHeader,
  DomainCardGrid,
  QuickStartPanel,
  NLISearchBox,
  RecentActivityPanel,
  StatsPanel,
  PinnedItemsPanel,
  NotificationPanel,
  DomainStatsBar,
} from './domain-cards';

export { DomainCard } from './domain-cards';
