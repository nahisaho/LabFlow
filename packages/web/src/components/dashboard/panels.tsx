/**
 * @file アクティビティ・統計・通知パネル
 * @description 最近のアクティビティ、統計情報、通知パネルコンポーネント
 */

'use client';

import React from 'react';
import type {
  RecentActivityPanelProps,
  StatsPanelProps,
  PinnedItemsPanelProps,
  NotificationPanelProps,
  ActivityLog,
  DashboardStats,
  PinnedItem,
  Notification,
  ResearchDomain,
} from './types';
import { 
  LABELS, 
  ACTIVITY_TYPE_LABELS, 
  ACTIVITY_TYPE_ICONS,
  DOMAIN_INFO,
} from './constants';

// ============================================================================
// ユーティリティ
// ============================================================================

/** 相対時間フォーマット */
export function formatRelativeTime(date: Date, isJapanese: boolean): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (isJapanese) {
    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString('ja-JP');
  }

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US');
}

// ============================================================================
// RecentActivityPanel - 最近のアクティビティ
// ============================================================================

/**
 * アクティビティアイテム
 */
function ActivityItem({
  activity,
  useJapaneseLabels,
}: {
  activity: ActivityLog;
  useJapaneseLabels: boolean;
}) {
  const labels = useJapaneseLabels ? ACTIVITY_TYPE_LABELS.ja : ACTIVITY_TYPE_LABELS.en;
  const icon = ACTIVITY_TYPE_ICONS[activity.type] || '📋';
  const displayTitle = useJapaneseLabels ? activity.titleJa : activity.title;
  const typeLabel = labels[activity.type as keyof typeof labels] || activity.type;

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <span className="text-lg" role="img" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 font-medium truncate">
          {displayTitle}
        </p>
        <p className="text-xs text-gray-500">
          {typeLabel} · {formatRelativeTime(activity.timestamp, useJapaneseLabels)}
        </p>
      </div>
      {activity.domain && (
        <span className={`text-xs px-2 py-1 rounded-full ${DOMAIN_INFO[activity.domain].bgColor} ${DOMAIN_INFO[activity.domain].textColor}`}>
          {useJapaneseLabels ? DOMAIN_INFO[activity.domain].nameJa : DOMAIN_INFO[activity.domain].name}
        </span>
      )}
    </div>
  );
}

/**
 * 最近のアクティビティパネル
 */
export function RecentActivityPanel({
  activities,
  maxItems = 5,
  onViewMore,
  useJapaneseLabels = true,
}: RecentActivityPanelProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {l.recentActivity}
        </h3>
        {activities.length > maxItems && onViewMore && (
          <button
            onClick={onViewMore}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {l.viewAll}
          </button>
        )}
      </div>
      
      {displayActivities.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">
          {l.noActivity}
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {displayActivities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              useJapaneseLabels={useJapaneseLabels}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// StatsPanel - 統計パネル
// ============================================================================

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  change?: number;
  subLabel?: string;
}

function StatCard({ label, value, icon, change, subLabel }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl" role="img" aria-hidden="true">
          {icon}
        </span>
        {change !== undefined && (
          <span className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {subLabel && (
        <p className="text-xs text-gray-400 mt-1">{subLabel}</p>
      )}
    </div>
  );
}

/**
 * 統計パネル
 */
export function StatsPanel({
  stats,
  useJapaneseLabels = true,
}: StatsPanelProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label={l.projects}
        value={stats.totalProjects}
        icon="📁"
      />
      <StatCard
        label={l.activeWorkflows}
        value={stats.activeWorkflows}
        icon="⚙️"
      />
      <StatCard
        label={l.completedWorkflows}
        value={stats.completedWorkflows}
        icon="✅"
      />
      <StatCard
        label={l.modelExecutions}
        value={stats.modelExecutions}
        icon="⚡"
        change={stats.weeklyChange}
        subLabel={`${l.thisWeek}: ${stats.weeklyExecutions}`}
      />
    </div>
  );
}

// ============================================================================
// PinnedItemsPanel - ピン留めパネル
// ============================================================================

const PINNED_TYPE_ICONS: Record<string, string> = {
  project: '📁',
  workflow: '⚙️',
  model: '🤖',
  template: '📋',
};

/**
 * ピン留めパネル
 */
export function PinnedItemsPanel({
  items,
  onUnpin,
  useJapaneseLabels = true,
}: PinnedItemsPanelProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {l.pinnedItems}
      </h3>
      
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">
          {l.noPinned}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl" role="img" aria-hidden="true">
                {PINNED_TYPE_ICONS[item.type] || '📌'}
              </span>
              <div className="flex-1 min-w-0">
                <a
                  href={item.href}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
                >
                  {useJapaneseLabels && item.nameJa ? item.nameJa : item.name}
                </a>
                <p className="text-xs text-gray-500">
                  {formatRelativeTime(item.lastAccessed, useJapaneseLabels)}
                </p>
              </div>
              {onUnpin && (
                <button
                  onClick={() => onUnpin(item.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  aria-label={useJapaneseLabels ? 'ピン解除' : 'Unpin'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// NotificationPanel - 通知パネル
// ============================================================================

const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  update: 'bg-purple-100 text-purple-700',
};

const NOTIFICATION_TYPE_ICONS: Record<string, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  update: '🔔',
};

/**
 * 通知パネル
 */
export function NotificationPanel({
  notifications,
  onMarkRead,
  onMarkAllRead,
  useJapaneseLabels = true,
}: NotificationPanelProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {l.notifications}
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && onMarkAllRead && (
          <button
            onClick={onMarkAllRead}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {l.markAllRead}
          </button>
        )}
      </div>
      
      {notifications.length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">
          {l.noNotifications}
        </p>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`
                flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer
                ${notification.isRead ? 'bg-gray-50' : 'bg-blue-50'}
              `}
              onClick={() => !notification.isRead && onMarkRead?.(notification.id)}
            >
              <span
                className={`text-sm px-2 py-1 rounded-full ${NOTIFICATION_TYPE_COLORS[notification.type]}`}
              >
                {NOTIFICATION_TYPE_ICONS[notification.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                  {useJapaneseLabels ? notification.titleJa : notification.title}
                </p>
                {(notification.content || notification.contentJa) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {useJapaneseLabels ? notification.contentJa : notification.content}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {formatRelativeTime(notification.createdAt, useJapaneseLabels)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DomainStatsBar - 分野別統計バー
// ============================================================================

export interface DomainStatsBarProps {
  stats: Record<ResearchDomain, number>;
  useJapaneseLabels?: boolean;
}

/**
 * 分野別統計バー
 */
export function DomainStatsBar({
  stats,
  useJapaneseLabels = true,
}: DomainStatsBarProps) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
        {Object.entries(stats).map(([domain, count]) => {
          const info = DOMAIN_INFO[domain as ResearchDomain];
          const percentage = (count / total) * 100;
          if (percentage === 0) return null;
          
          return (
            <div
              key={domain}
              className={`${info.bgColor.replace('bg-', 'bg-').replace('-50', '-400')}`}
              style={{ width: `${percentage}%` }}
              title={`${useJapaneseLabels ? info.nameJa : info.name}: ${count}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        {Object.entries(stats).map(([domain, count]) => {
          const info = DOMAIN_INFO[domain as ResearchDomain];
          if (count === 0) return null;
          
          return (
            <div key={domain} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${info.bgColor.replace('-50', '-400')}`} />
              <span className="text-gray-600">
                {useJapaneseLabels ? info.nameJa : info.name}: {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
