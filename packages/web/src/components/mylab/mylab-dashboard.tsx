/**
 * @file My Lab Data ダッシュボード
 * @description ラボデータ管理のメインダッシュボードコンポーネント
 */

'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DatasetList } from './dataset-panel';
import { ExperimentList } from './experiment-panel';
import { KnowledgeList } from './knowledge-panel';
import { MYLAB_VIEWS, MEMBER_ROLES, UI_TEXT } from './constants';
import type {
  Lab,
  LabWithStats,
  LabMember,
  Dataset,
  Experiment,
  KnowledgeItem,
  ActivityLog,
  MyLabView,
  CreateDatasetInput,
  CreateExperimentInput,
  CreateKnowledgeInput,
} from './types';

// ============================================================================
// Props
// ============================================================================

export interface MyLabDashboardProps {
  /** ラボ情報 */
  lab: LabWithStats;
  /** データセット一覧 */
  datasets: Dataset[];
  /** 実験一覧 */
  experiments: Experiment[];
  /** ナレッジ一覧 */
  knowledgeItems: KnowledgeItem[];
  /** アクティビティログ */
  activities?: ActivityLog[];
  /** 言語設定 */
  language?: 'ja' | 'en';
  /** 初期ビュー */
  initialView?: MyLabView;
  /** データセット関連ハンドラ */
  datasetHandlers?: {
    onSelect?: (dataset: Dataset) => void;
    onCreate?: (input: CreateDatasetInput) => Promise<void>;
    onDelete?: (datasetId: string) => Promise<void>;
    onIndex?: (datasetId: string) => Promise<void>;
  };
  /** 実験関連ハンドラ */
  experimentHandlers?: {
    onSelect?: (experiment: Experiment) => void;
    onCreate?: (input: CreateExperimentInput) => Promise<void>;
    onUpdate?: (experimentId: string, updates: Partial<Experiment>) => Promise<void>;
    onDelete?: (experimentId: string) => Promise<void>;
  };
  /** ナレッジ関連ハンドラ */
  knowledgeHandlers?: {
    onSelect?: (item: KnowledgeItem) => void;
    onCreate?: (input: CreateKnowledgeInput) => Promise<void>;
    onDelete?: (itemId: string) => Promise<void>;
    onIndex?: (itemId: string) => Promise<void>;
  };
  /** ローディング状態 */
  isLoading?: boolean;
}

export interface LabHeaderProps {
  /** ラボ情報 */
  lab: LabWithStats;
  /** 言語設定 */
  language?: 'ja' | 'en';
}

export interface ActivityFeedProps {
  /** アクティビティログ */
  activities: ActivityLog[];
  /** 言語設定 */
  language?: 'ja' | 'en';
}

export interface MemberListProps {
  /** メンバー一覧 */
  members: LabMember[];
  /** 言語設定 */
  language?: 'ja' | 'en';
}

// ============================================================================
// LabHeader
// ============================================================================

export function LabHeader({ lab, language = 'ja' }: LabHeaderProps): React.JSX.Element {
  const isJa = language === 'ja';

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">
          {isJa && lab.nameJa ? lab.nameJa : lab.name}
        </h1>
        {(lab.description || lab.descriptionJa) && (
          <p className="text-muted-foreground mt-1">
            {isJa && lab.descriptionJa ? lab.descriptionJa : lab.description}
          </p>
        )}
      </div>
      
      {/* 統計 */}
      <div className="flex gap-4 text-center">
        <div>
          <div className="text-2xl font-bold">{lab.stats.datasetCount}</div>
          <div className="text-xs text-muted-foreground">
            {isJa ? 'データセット' : 'Datasets'}
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold">{lab.stats.experimentCount}</div>
          <div className="text-xs text-muted-foreground">
            {isJa ? '実験' : 'Experiments'}
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold">{lab.stats.knowledgeCount}</div>
          <div className="text-xs text-muted-foreground">
            {isJa ? 'ナレッジ' : 'Knowledge'}
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold">{lab.stats.memberCount}</div>
          <div className="text-xs text-muted-foreground">
            {isJa ? 'メンバー' : 'Members'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MemberList
// ============================================================================

export function MemberList({ members, language = 'ja' }: MemberListProps): React.JSX.Element {
  const isJa = language === 'ja';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          👥 {isJa ? 'メンバー' : 'Members'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {members.map((member) => {
            const roleInfo = MEMBER_ROLES[member.role];
            return (
              <div key={member.userId} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                  {member.name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{member.name}</div>
                  <div className="text-xs text-muted-foreground">{member.email}</div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {roleInfo?.icon ?? '👤'} {isJa ? roleInfo?.labelJa ?? member.role : roleInfo?.label ?? member.role}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ActivityFeed
// ============================================================================

export function ActivityFeed({ activities, language = 'ja' }: ActivityFeedProps): React.JSX.Element {
  const isJa = language === 'ja';

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'dataset_created': return '📊';
      case 'dataset_updated': return '📊';
      case 'dataset_deleted': return '🗑️';
      case 'experiment_created': return '🧪';
      case 'experiment_started': return '▶️';
      case 'experiment_completed': return '✅';
      case 'experiment_failed': return '❌';
      case 'knowledge_created': return '💡';
      case 'member_joined': return '👋';
      case 'member_left': return '👤';
      default: return '📝';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          📋 {isJa ? '最近のアクティビティ' : 'Recent Activity'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isJa ? 'アクティビティはありません' : 'No recent activity'}
          </p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-start gap-2">
                <span className="text-lg">{getActivityIcon(activity.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    {isJa && activity.descriptionJa ? activity.descriptionJa : activity.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{activity.user.name}</span>
                    <span>•</span>
                    <span>{new Date(activity.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MyLabDashboard
// ============================================================================

export function MyLabDashboard({
  lab,
  datasets,
  experiments,
  knowledgeItems,
  activities = [],
  language = 'ja',
  initialView = 'overview',
  datasetHandlers = {},
  experimentHandlers = {},
  knowledgeHandlers = {},
  isLoading = false,
}: MyLabDashboardProps): React.JSX.Element {
  const isJa = language === 'ja';
  const [currentView, setCurrentView] = React.useState<MyLabView>(initialView);

  // アクティブな実験
  const runningExperiments = experiments.filter((e) => e.status === 'running');

  return (
    <div className="space-y-6">
      {/* ラボヘッダー */}
      <LabHeader lab={lab} language={language} />

      {/* ナビゲーションタブ */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {Object.values(MYLAB_VIEWS).map((view) => (
          <Button
            key={view.id}
            variant={currentView === view.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView(view.id)}
          >
            {view.icon} {isJa ? view.labelJa : view.label}
          </Button>
        ))}
      </div>

      {/* コンテンツ */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">
          {isJa ? '読み込み中...' : 'Loading...'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview */}
          {currentView === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* 左カラム: 概要 */}
              <div className="lg:col-span-2 space-y-6">
                {/* 実行中の実験 */}
                {runningExperiments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        🔬 {isJa ? '実行中の実験' : 'Running Experiments'}
                        <Badge variant="default" className="ml-2">{runningExperiments.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {runningExperiments.slice(0, 3).map((exp) => {
                          const progress = exp.metrics.epochs_total > 0
                            ? Math.round((exp.metrics.epochs_completed / exp.metrics.epochs_total) * 100)
                            : 0;
                          return (
                            <div key={exp.id} className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="text-sm font-medium">
                                  {isJa && exp.nameJa ? exp.nameJa : exp.name}
                                </div>
                                <div className="h-1.5 bg-muted rounded-full mt-1">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-sm text-muted-foreground">{progress}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 最近のデータセット */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">
                      📊 {isJa ? '最近のデータセット' : 'Recent Datasets'}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentView('datasets')}>
                      {isJa ? 'すべて見る' : 'View all'} →
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {datasets.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {isJa ? 'データセットはありません' : 'No datasets yet'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {datasets.slice(0, 3).map((ds) => (
                          <div key={ds.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              <span>📁</span>
                              <span className="text-sm">{isJa && ds.nameJa ? ds.nameJa : ds.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(ds.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 最近のナレッジ */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">
                      💡 {isJa ? '最近のナレッジ' : 'Recent Knowledge'}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentView('knowledge')}>
                      {isJa ? 'すべて見る' : 'View all'} →
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {knowledgeItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {isJa ? 'ナレッジはありません' : 'No knowledge yet'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {knowledgeItems.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              <span>💡</span>
                              <span className="text-sm">{isJa && item.titleJa ? item.titleJa : item.title}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 右カラム: サイドバー */}
              <div className="space-y-6">
                <MemberList members={lab.members} language={language} />
                <ActivityFeed activities={activities} language={language} />
              </div>
            </div>
          )}

          {/* Datasets */}
          {currentView === 'datasets' && (
            <DatasetList
              datasets={datasets}
              language={language}
              onSelectDataset={datasetHandlers.onSelect}
              onCreateDataset={datasetHandlers.onCreate}
              onDeleteDataset={datasetHandlers.onDelete}
              onIndexDataset={datasetHandlers.onIndex}
            />
          )}

          {/* Experiments */}
          {currentView === 'experiments' && (
            <ExperimentList
              experiments={experiments}
              language={language}
              onSelectExperiment={experimentHandlers.onSelect}
              onCreateExperiment={experimentHandlers.onCreate}
              onUpdateExperiment={experimentHandlers.onUpdate}
              onDeleteExperiment={experimentHandlers.onDelete}
            />
          )}

          {/* Knowledge */}
          {currentView === 'knowledge' && (
            <KnowledgeList
              knowledgeItems={knowledgeItems}
              language={language}
              onSelectKnowledge={knowledgeHandlers.onSelect}
              onCreateKnowledge={knowledgeHandlers.onCreate}
              onDeleteKnowledge={knowledgeHandlers.onDelete}
              onIndexKnowledge={knowledgeHandlers.onIndex}
            />
          )}
        </div>
      )}
    </div>
  );
}
