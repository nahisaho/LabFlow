/**
 * @file GraphRAG 統合コンポーネント
 * @description ナレッジグラフの統合ダッシュボード
 * 
 * Requirements:
 * - KNOW-GRAG-001: GraphRAG integration
 * - KNOW-GRAG-002: Entity extraction
 * - KNOW-GRAG-003: Relationship extraction
 * - KNOW-GRAG-004: Citation graph analysis
 */

'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DocumentList } from './document-list';
import { GraphViewer, GraphStats, GraphControls } from './graph-viewer';
import { SearchPanel, KnowledgeGapPanel } from './search-panel';
import { VIEW_MODES, UI_TEXT, DEFAULT_DISPLAY_SETTINGS } from './constants';
import type {
  Document,
  GraphData,
  GraphSearchQuery,
  GraphSearchResult,
  KnowledgeBaseStats,
  KnowledgeBaseStatus,
  ViewMode,
  GraphDisplaySettings,
  AddDocumentInput,
  NodeType,
  KnowledgeGap,
} from './types';

// ============================================================================
// Props
// ============================================================================

export interface GraphRAGDashboardProps {
  /** ナレッジベースID */
  knowledgeBaseId?: string;
  /** ステータス */
  status?: KnowledgeBaseStatus;
  /** ドキュメント一覧 */
  documents?: Document[];
  /** グラフデータ */
  graphData?: GraphData | null;
  /** 統計情報 */
  stats?: KnowledgeBaseStats | null;
  /** ナレッジギャップ */
  knowledgeGaps?: KnowledgeGap[];
  /** 言語設定 */
  language?: 'ja' | 'en';
  /** ドキュメント追加時 */
  onAddDocument?: (input: AddDocumentInput) => Promise<void>;
  /** ドキュメント削除時 */
  onDeleteDocument?: (documentId: string) => Promise<void>;
  /** 検索実行時 */
  onSearch?: (query: GraphSearchQuery) => Promise<GraphSearchResult>;
  /** インデックス再構築時 */
  onRebuildIndex?: () => Promise<void>;
  /** エクスポート時 */
  onExport?: () => Promise<void>;
  /** ローディング状態 */
  isLoading?: boolean;
}

// ============================================================================
// サブコンポーネント
// ============================================================================

interface StatsOverviewProps {
  stats: KnowledgeBaseStats | null;
  status: KnowledgeBaseStatus;
  language: 'ja' | 'en';
}

function StatsOverview({ stats, status, language }: StatsOverviewProps): React.JSX.Element {
  const isJa = language === 'ja';

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="h-10 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: isJa ? UI_TEXT.documentsJa : UI_TEXT.documents,
      value: stats.documentCount,
      icon: '📄',
    },
    {
      label: isJa ? UI_TEXT.nodesJa : UI_TEXT.nodes,
      value: stats.nodeCount,
      icon: '🔷',
    },
    {
      label: isJa ? UI_TEXT.edgesJa : UI_TEXT.edges,
      value: stats.edgeCount,
      icon: '🔗',
    },
    {
      label: isJa ? UI_TEXT.communitiesJa : UI_TEXT.communities,
      value: stats.communityCount,
      icon: '👥',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-2xl font-bold">{item.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// GraphRAGDashboard
// ============================================================================

export function GraphRAGDashboard({
  knowledgeBaseId,
  status = 'empty',
  documents = [],
  graphData = null,
  stats = null,
  knowledgeGaps = [],
  language = 'ja',
  onAddDocument,
  onDeleteDocument,
  onSearch,
  onRebuildIndex,
  onExport,
  isLoading = false,
}: GraphRAGDashboardProps): React.JSX.Element {
  const isJa = language === 'ja';

  // UI状態
  const [viewMode, setViewMode] = React.useState<ViewMode>('graph');
  const [activeTab, setActiveTab] = React.useState<'graph' | 'documents' | 'search' | 'gaps'>('graph');
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [displaySettings, setDisplaySettings] = React.useState<GraphDisplaySettings>(DEFAULT_DISPLAY_SETTINGS);
  const [showSettings, setShowSettings] = React.useState(false);

  // 検索ハンドラ（モック）
  const handleSearch = React.useCallback(
    async (query: GraphSearchQuery): Promise<GraphSearchResult> => {
      if (onSearch) {
        return onSearch(query);
      }
      // モック結果
      await new Promise((r) => setTimeout(r, 500));
      return {
        query,
        nodes: graphData?.nodes.slice(0, 5) ?? [],
        edges: [],
        communities: [],
        answer: isJa
          ? `「${query.text}」に関する検索結果です。ナレッジグラフから関連する情報を抽出しました。`
          : `Search results for "${query.text}". Related information extracted from the knowledge graph.`,
        answerJa: `「${query.text}」に関する検索結果です。ナレッジグラフから関連する情報を抽出しました。`,
        sourceDocuments: documents.slice(0, 2),
        processingTimeMs: 450,
      };
    },
    [onSearch, graphData, documents, isJa]
  );

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>🕸️</span>
            {isJa ? UI_TEXT.titleJa : UI_TEXT.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isJa ? UI_TEXT.subtitleJa : UI_TEXT.subtitle}
          </p>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-2">
          {status === 'ready' && (
            <>
              {onRebuildIndex && (
                <Button variant="outline" size="sm" onClick={onRebuildIndex} disabled={isLoading}>
                  🔄 {isJa ? UI_TEXT.rebuildIndexJa : UI_TEXT.rebuildIndex}
                </Button>
              )}
              {onExport && (
                <Button variant="outline" size="sm" onClick={onExport} disabled={isLoading}>
                  📤 {isJa ? UI_TEXT.exportGraphJa : UI_TEXT.exportGraph}
                </Button>
              )}
            </>
          )}
          <Badge
            variant={
              status === 'ready'
                ? 'default'
                : status === 'indexing'
                ? 'secondary'
                : status === 'error'
                ? 'destructive'
                : 'outline'
            }
          >
            {status === 'ready' && (isJa ? UI_TEXT.readyJa : UI_TEXT.ready)}
            {status === 'indexing' && (isJa ? UI_TEXT.indexingJa : UI_TEXT.indexing)}
            {status === 'error' && (isJa ? 'エラー' : 'Error')}
            {status === 'empty' && (isJa ? UI_TEXT.emptyJa : UI_TEXT.empty)}
          </Badge>
        </div>
      </div>

      {/* 統計情報 */}
      <StatsOverview stats={stats} status={status} language={language} />

      {/* タブナビゲーション */}
      <div className="border-b">
        <div className="flex gap-1">
          {[
            { id: 'graph' as const, label: isJa ? 'グラフ' : 'Graph', icon: '🕸️' },
            { id: 'documents' as const, label: isJa ? 'ドキュメント' : 'Documents', icon: '📄' },
            { id: 'search' as const, label: isJa ? '検索' : 'Search', icon: '🔍' },
            { id: 'gaps' as const, label: isJa ? 'ギャップ' : 'Gaps', icon: '💡' },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="rounded-b-none"
            >
              {tab.icon} {tab.label}
              {tab.id === 'documents' && <Badge variant="secondary" className="ml-1">{documents.length}</Badge>}
              {tab.id === 'gaps' && knowledgeGaps.length > 0 && (
                <Badge variant="destructive" className="ml-1">{knowledgeGaps.length}</Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          {/* グラフコントロール */}
          <div className="flex items-center justify-between">
            <GraphStats
              nodeCount={stats?.nodeCount ?? 0}
              edgeCount={stats?.edgeCount ?? 0}
              nodesByType={stats?.nodesByType ?? {} as Record<NodeType, number>}
              language={language}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              ⚙️ {isJa ? '設定' : 'Settings'}
            </Button>
          </div>

          {/* 設定パネル */}
          {showSettings && (
            <Card>
              <CardContent className="py-4">
                <GraphControls
                  settings={displaySettings}
                  onSettingsChange={setDisplaySettings}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  language={language}
                />
              </CardContent>
            </Card>
          )}

          {/* グラフビューワー */}
          <Card>
            <CardContent className="p-0">
              <GraphViewer
                data={graphData}
                selectedNodeId={selectedNodeId}
                settings={displaySettings}
                onSelectNode={setSelectedNodeId}
                language={language}
                height={500}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'documents' && (
        <Card>
          <CardContent className="py-4">
            <DocumentList
              documents={documents}
              language={language}
              onAddDocument={onAddDocument}
              onDeleteDocument={onDeleteDocument}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'search' && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isJa ? '質問・検索' : 'Ask & Search'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SearchPanel
                onSearch={handleSearch}
                onSelectNode={(nodeId) => {
                  setSelectedNodeId(nodeId);
                  setActiveTab('graph');
                }}
                language={language}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          {/* グラフプレビュー */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isJa ? 'グラフプレビュー' : 'Graph Preview'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <GraphViewer
                data={graphData}
                selectedNodeId={selectedNodeId}
                settings={displaySettings}
                onSelectNode={setSelectedNodeId}
                language={language}
                height={350}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'gaps' && (
        <Card>
          <CardContent className="py-4">
            <KnowledgeGapPanel gaps={knowledgeGaps} language={language} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default GraphRAGDashboard;
