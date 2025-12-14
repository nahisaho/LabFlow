/**
 * @file 分野別カード・クイックスタートコンポーネント
 * @description 研究分野カード、クイックスタートパネル
 */

'use client';

import React from 'react';
import type {
  DomainCardProps,
  QuickStartPanelProps,
  DomainInfo,
  QuickStartItem,
} from './types';
import { DOMAIN_INFO, DOMAIN_LIST, LABELS } from './constants';

// ============================================================================
// DomainCard - 分野カード
// ============================================================================

/**
 * 分野カードコンポーネント
 * クリックで該当分野のワークフロー一覧に遷移
 */
export function DomainCard({
  domain,
  projectCount = 0,
  onClick,
  useJapaneseLabels = true,
}: DomainCardProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  const displayName = useJapaneseLabels ? domain.nameJa : domain.name;
  const displayDescription = useJapaneseLabels ? domain.descriptionJa : domain.description;

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-6 rounded-xl border-2 transition-all duration-200
        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
        ${domain.bgColor} ${domain.borderColor}
        text-left
      `}
      aria-label={`${displayName} - ${displayDescription}`}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-4xl" role="img" aria-hidden="true">
          {domain.icon}
        </span>
        {projectCount > 0 && (
          <span className={`text-sm font-medium ${domain.textColor} bg-white/80 px-2 py-1 rounded-full`}>
            {projectCount} {l.projects}
          </span>
        )}
      </div>
      
      <h3 className={`text-xl font-bold ${domain.textColor} mb-2`}>
        {displayName}
      </h3>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {displayDescription}
      </p>
      
      <div className="flex flex-wrap gap-2">
        {domain.models.slice(0, 3).map((model) => (
          <span
            key={model}
            className={`text-xs px-2 py-1 rounded-full bg-white/60 ${domain.textColor}`}
          >
            {model}
          </span>
        ))}
      </div>
    </button>
  );
}

// ============================================================================
// DomainCardGrid - 分野カードグリッド
// ============================================================================

export interface DomainCardGridProps {
  /** プロジェクト数（分野別） */
  projectCounts?: Record<string, number>;
  /** 分野選択ハンドラ */
  onDomainSelect?: (domain: DomainInfo) => void;
  /** 日本語表示 */
  useJapaneseLabels?: boolean;
}

/**
 * 分野カードグリッド
 */
export function DomainCardGrid({
  projectCounts = {},
  onDomainSelect,
  useJapaneseLabels = true,
}: DomainCardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {DOMAIN_LIST.map((domainId) => {
        const domain = DOMAIN_INFO[domainId];
        return (
          <DomainCard
            key={domainId}
            domain={domain}
            projectCount={projectCounts[domainId]}
            onClick={() => onDomainSelect?.(domain)}
            useJapaneseLabels={useJapaneseLabels}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// QuickStartButton - クイックスタートボタン
// ============================================================================

interface QuickStartButtonProps {
  item: QuickStartItem;
  onClick?: () => void;
  useJapaneseLabels?: boolean;
}

function QuickStartButton({
  item,
  onClick,
  useJapaneseLabels = true,
}: QuickStartButtonProps) {
  const displayLabel = useJapaneseLabels ? item.labelJa : item.label;
  const displayDescription = useJapaneseLabels ? item.descriptionJa : item.description;

  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-4 p-4 rounded-xl
        bg-white border border-gray-200
        hover:shadow-md hover:border-gray-300
        transition-all duration-200
        text-left w-full
      "
      aria-label={`${displayLabel} - ${displayDescription}`}
    >
      <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center`}>
        <span className="text-2xl text-white" role="img" aria-hidden="true">
          {item.icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 truncate">
          {displayLabel}
        </h4>
        <p className="text-sm text-gray-500 truncate">
          {displayDescription}
        </p>
      </div>
      <svg
        className="w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
}

// ============================================================================
// QuickStartPanel - クイックスタートパネル
// ============================================================================

/**
 * クイックスタートパネル
 */
export function QuickStartPanel({
  items,
  onItemClick,
  useJapaneseLabels = true,
}: QuickStartPanelProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;

  return (
    <div className="bg-gray-50 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {l.quickStart}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <QuickStartButton
            key={item.id}
            item={item}
            onClick={() => onItemClick?.(item)}
            useJapaneseLabels={useJapaneseLabels}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// WelcomeHeader - ウェルカムヘッダー
// ============================================================================

export interface WelcomeHeaderProps {
  /** ユーザー名 */
  userName?: string;
  /** 日本語表示 */
  useJapaneseLabels?: boolean;
}

/**
 * ウェルカムヘッダー
 */
export function WelcomeHeader({
  userName,
  useJapaneseLabels = true,
}: WelcomeHeaderProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  
  // 現在時刻に基づく挨拶
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (useJapaneseLabels) {
      if (hour < 12) return 'おはようございます';
      if (hour < 18) return 'こんにちは';
      return 'こんばんは';
    }
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {userName ? `${getGreeting()}、${userName}さん` : l.welcomeMessage}
      </h1>
      <p className="text-gray-600">
        {l.welcomeSubtitle}
      </p>
    </div>
  );
}

// ============================================================================
// NLISearchBox - 自然言語入力ボックス（簡易版）
// ============================================================================

export interface NLISearchBoxProps {
  /** 送信ハンドラ */
  onSubmit?: (query: string) => void;
  /** プレースホルダー */
  placeholder?: string;
  /** 日本語表示 */
  useJapaneseLabels?: boolean;
}

/**
 * NLI検索ボックス
 */
export function NLISearchBox({
  onSubmit,
  placeholder,
  useJapaneseLabels = true,
}: NLISearchBoxProps) {
  const [query, setQuery] = React.useState('');
  
  const defaultPlaceholder = useJapaneseLabels
    ? '「新しい材料を生成したい」など、やりたいことを入力...'
    : 'Enter what you want to do, e.g., "Generate new materials"...';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit?.(query.trim());
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || defaultPlaceholder}
          className="
            w-full px-6 py-4 pr-14
            text-lg rounded-2xl
            border-2 border-gray-200
            focus:border-blue-500 focus:ring-2 focus:ring-blue-200
            transition-all duration-200
            placeholder:text-gray-400
          "
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            w-10 h-10 rounded-xl
            bg-blue-500 text-white
            hover:bg-blue-600
            disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-colors duration-200
            flex items-center justify-center
          "
          aria-label={useJapaneseLabels ? '検索' : 'Search'}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
