/**
 * @file My Lab Data 実験パネル
 * @description 実験一覧・トラッキングコンポーネント
 */

'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { EXPERIMENT_STATUSES, UI_TEXT } from './constants';
import type { Experiment, ExperimentStatus, CreateExperimentInput } from './types';

// ============================================================================
// Props
// ============================================================================

export interface ExperimentListProps {
  /** 実験一覧 */
  experiments: Experiment[];
  /** 言語設定 */
  language?: 'ja' | 'en';
  /** 実験選択時 */
  onSelectExperiment?: (experiment: Experiment) => void;
  /** 実験作成時 */
  onCreateExperiment?: (input: CreateExperimentInput) => Promise<void>;
  /** 実験更新時 */
  onUpdateExperiment?: (experimentId: string, updates: Partial<Experiment>) => Promise<void>;
  /** 実験削除時 */
  onDeleteExperiment?: (experimentId: string) => Promise<void>;
  /** ローディング状態 */
  isLoading?: boolean;
}

export interface ExperimentCardProps {
  /** 実験 */
  experiment: Experiment;
  /** 言語設定 */
  language?: 'ja' | 'en';
  /** 選択時 */
  onSelect?: () => void;
  /** 削除時 */
  onDelete?: () => void;
  /** ステータス変更時 */
  onChangeStatus?: (status: ExperimentStatus) => void;
}

export interface CreateExperimentDialogProps {
  /** 開いているか */
  isOpen: boolean;
  /** 閉じる */
  onClose: () => void;
  /** 作成時 */
  onCreate: (input: CreateExperimentInput) => void;
  /** 言語設定 */
  language?: 'ja' | 'en';
}

// ============================================================================
// ユーティリティ
// ============================================================================

function getStatusBadgeVariant(status: ExperimentStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'running':
      return 'default';
    case 'completed':
      return 'secondary';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}

function calculateProgress(experiment: Experiment): number {
  if (experiment.metrics.epochs_total <= 0) return 0;
  return Math.round((experiment.metrics.epochs_completed / experiment.metrics.epochs_total) * 100);
}

// ============================================================================
// ExperimentCard
// ============================================================================

export function ExperimentCard({
  experiment,
  language = 'ja',
  onSelect,
  onDelete,
  onChangeStatus,
}: ExperimentCardProps): React.JSX.Element {
  const isJa = language === 'ja';
  const statusInfo = EXPERIMENT_STATUSES[experiment.status];
  const progress = calculateProgress(experiment);

  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect?.();
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* タイトルとステータス */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm truncate">
                {isJa && experiment.nameJa ? experiment.nameJa : experiment.name}
              </h4>
              <Badge variant={getStatusBadgeVariant(experiment.status)}>
                {statusInfo.icon} {isJa ? statusInfo.labelJa : statusInfo.label}
              </Badge>
            </div>
            
            {/* 仮説 */}
            {(experiment.hypothesis || experiment.hypothesisJa) && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                💡 {isJa && experiment.hypothesisJa ? experiment.hypothesisJa : experiment.hypothesis}
              </p>
            )}
            
            {/* プログレスバー */}
            {(experiment.status === 'running' || experiment.status === 'paused') && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* メトリクス */}
            <div className="flex items-center gap-3 mt-2 text-xs">
              {experiment.metrics.loss !== null && (
                <span className="text-muted-foreground">
                  📉 Loss: {experiment.metrics.loss.toFixed(4)}
                </span>
              )}
              {experiment.metrics.accuracy !== null && (
                <span className="text-muted-foreground">
                  🎯 Acc: {(experiment.metrics.accuracy * 100).toFixed(1)}%
                </span>
              )}
              {experiment.metrics.duration_seconds !== null && (
                <span className="text-muted-foreground">
                  ⏱️ {Math.round(experiment.metrics.duration_seconds / 60)}min
                </span>
              )}
            </div>
            
            {/* タグ */}
            {experiment.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {experiment.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {experiment.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{experiment.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* アクション */}
          <div className="flex flex-col gap-1">
            {/* ステータス変更ボタン */}
            {onChangeStatus && experiment.status === 'planned' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeStatus('running');
                }}
                title={isJa ? '開始' : 'Start'}
              >
                ▶️
              </Button>
            )}
            {onChangeStatus && experiment.status === 'running' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeStatus('paused');
                }}
                title={isJa ? '一時停止' : 'Pause'}
              >
                ⏸️
              </Button>
            )}
            {onChangeStatus && experiment.status === 'paused' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeStatus('running');
                }}
                title={isJa ? '再開' : 'Resume'}
              >
                ▶️
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                aria-label={isJa ? '削除' : 'Delete'}
              >
                🗑️
              </Button>
            )}
          </div>
        </div>
        
        {/* 作成者・日時 */}
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>{experiment.createdBy.name ?? 'Unknown'}</span>
          <span>•</span>
          <span>{new Date(experiment.updatedAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CreateExperimentDialog
// ============================================================================

export function CreateExperimentDialog({
  isOpen,
  onClose,
  onCreate,
  language = 'ja',
}: CreateExperimentDialogProps): React.JSX.Element | null {
  const isJa = language === 'ja';
  const [name, setName] = React.useState('');
  const [hypothesis, setHypothesis] = React.useState('');
  const [tags, setTags] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      hypothesis: hypothesis.trim() || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });

    // Reset form
    setName('');
    setHypothesis('');
    setTags('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>
            {isJa ? UI_TEXT.newExperimentJa : UI_TEXT.newExperiment}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 名前 */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {isJa ? '実験名' : 'Experiment Name'} *
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isJa ? '実験名を入力' : 'Enter experiment name'}
                required
              />
            </div>

            {/* 仮説 */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {isJa ? '仮説' : 'Hypothesis'}
              </label>
              <textarea
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                placeholder={isJa ? 'この実験で検証したい仮説...' : 'What hypothesis are you testing...'}
                className="w-full px-3 py-2 border rounded-md text-sm min-h-[80px]"
              />
            </div>

            {/* タグ */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {isJa ? 'タグ（カンマ区切り）' : 'Tags (comma-separated)'}
              </label>
              <Input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={isJa ? 'タグ1, タグ2, ...' : 'tag1, tag2, ...'}
              />
            </div>

            {/* アクション */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {isJa ? 'キャンセル' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                {isJa ? '作成' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// ExperimentList
// ============================================================================

export function ExperimentList({
  experiments,
  language = 'ja',
  onSelectExperiment,
  onCreateExperiment,
  onUpdateExperiment,
  onDeleteExperiment,
  isLoading = false,
}: ExperimentListProps): React.JSX.Element {
  const isJa = language === 'ja';
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<ExperimentStatus | 'all'>('all');

  const filteredExperiments = React.useMemo(() => {
    let filtered = experiments;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((e) =>
        e.name.toLowerCase().includes(q) ||
        (e.nameJa?.toLowerCase().includes(q)) ||
        (e.hypothesis?.toLowerCase().includes(q)) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    
    return filtered;
  }, [experiments, statusFilter, search]);

  // ステータス別カウント
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: experiments.length };
    for (const exp of experiments) {
      counts[exp.status] = (counts[exp.status] || 0) + 1;
    }
    return counts;
  }, [experiments]);

  const handleCreate = async (input: CreateExperimentInput) => {
    await onCreateExperiment?.(input);
  };

  const handleStatusChange = async (experimentId: string, status: ExperimentStatus) => {
    await onUpdateExperiment?.(experimentId, { status });
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            {isJa ? '実験' : 'Experiments'}
          </span>
          <Badge variant="secondary">{experiments.length}</Badge>
        </div>
        {onCreateExperiment && (
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            🧪 {isJa ? UI_TEXT.newExperimentJa : UI_TEXT.newExperiment}
          </Button>
        )}
      </div>

      {/* 検索・フィルタ */}
      <div className="flex gap-2 flex-wrap">
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isJa ? '検索...' : 'Search...'}
          className="max-w-xs"
        />
        <div className="flex gap-1 flex-wrap">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            {isJa ? 'すべて' : 'All'} ({statusCounts['all'] || 0})
          </Button>
          {Object.values(EXPERIMENT_STATUSES).map((s) => (
            <Button
              key={s.id}
              variant={statusFilter === s.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s.id)}
            >
              {s.icon} {statusCounts[s.id] || 0}
            </Button>
          ))}
        </div>
      </div>

      {/* リスト */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {isJa ? '読み込み中...' : 'Loading...'}
        </div>
      ) : filteredExperiments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-4xl mb-2">🧪</p>
          <p>{isJa ? UI_TEXT.noExperimentsJa : UI_TEXT.noExperiments}</p>
          <p className="text-sm mt-1">
            {isJa ? '実験を作成して仮説を検証しましょう' : 'Create an experiment to test your hypothesis'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredExperiments.map((experiment) => (
            <ExperimentCard
              key={experiment.id}
              experiment={experiment}
              language={language}
              onSelect={() => onSelectExperiment?.(experiment)}
              onDelete={onDeleteExperiment ? () => onDeleteExperiment(experiment.id) : undefined}
              onChangeStatus={onUpdateExperiment ? (status) => handleStatusChange(experiment.id, status) : undefined}
            />
          ))}
        </div>
      )}

      {/* 作成ダイアログ */}
      {onCreateExperiment && (
        <CreateExperimentDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onCreate={handleCreate}
          language={language}
        />
      )}
    </div>
  );
}
