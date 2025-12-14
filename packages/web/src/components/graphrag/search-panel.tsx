/**
 * @file GraphRAG 検索パネル
 * @description ナレッジグラフ検索・質問応答コンポーネント
 */

'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SEARCH_TYPES, NODE_TYPES, UI_TEXT } from './constants';
import type {
  GraphSearchQuery,
  GraphSearchResult,
  NodeType,
  EntityType,
  Community,
  GraphNode,
  Document,
} from './types';

// ============================================================================
// Props
// ============================================================================

export interface SearchPanelProps {
  /** 検索実行時 */
  onSearch: (query: GraphSearchQuery) => Promise<GraphSearchResult>;
  /** ノード選択時 */
  onSelectNode?: (nodeId: string) => void;
  /** 言語設定 */
  language?: 'ja' | 'en';
  /** ローディング状態 */
  isLoading?: boolean;
}

export interface SearchResultsProps {
  /** 検索結果 */
  result: GraphSearchResult | null;
  /** ノード選択時 */
  onSelectNode?: (nodeId: string) => void;
  /** 言語設定 */
  language?: 'ja' | 'en';
}

export interface AnswerPanelProps {
  /** AI生成の回答 */
  answer: string | null;
  /** 日本語回答 */
  answerJa?: string | null;
  /** 根拠ドキュメント */
  sourceDocuments: Document[];
  /** 言語設定 */
  language?: 'ja' | 'en';
}

// ============================================================================
// AnswerPanel
// ============================================================================

export function AnswerPanel({
  answer,
  answerJa,
  sourceDocuments,
  language = 'ja',
}: AnswerPanelProps): React.JSX.Element | null {
  const isJa = language === 'ja';
  const displayAnswer = isJa && answerJa ? answerJa : answer;

  if (!displayAnswer) return null;

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span>🤖</span>
          {isJa ? 'AI回答' : 'AI Answer'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{displayAnswer}</p>

        {sourceDocuments.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              {isJa ? UI_TEXT.sourceDocumentsJa : UI_TEXT.sourceDocuments} ({sourceDocuments.length})
            </h4>
            <div className="space-y-1">
              {sourceDocuments.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  className="text-xs bg-background p-2 rounded border"
                >
                  <p className="font-medium truncate">
                    {isJa && doc.titleJa ? doc.titleJa : doc.title}
                  </p>
                  {doc.metadata.authors && doc.metadata.authors.length > 0 && (
                    <p className="text-muted-foreground truncate">
                      {doc.metadata.authors.slice(0, 2).join(', ')}
                      {doc.metadata.publishedDate && (
                        <> ({new Date(doc.metadata.publishedDate).getFullYear()})</>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SearchResults
// ============================================================================

export function SearchResults({
  result,
  onSelectNode,
  language = 'ja',
}: SearchResultsProps): React.JSX.Element | null {
  const isJa = language === 'ja';

  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* AI回答 */}
      {(result.answer || result.answerJa) && (
        <AnswerPanel
          answer={result.answer ?? null}
          answerJa={result.answerJa}
          sourceDocuments={result.sourceDocuments}
          language={language}
        />
      )}

      {/* 処理時間 */}
      <div className="text-xs text-muted-foreground">
        {isJa ? '処理時間' : 'Processing time'}: {result.processingTimeMs}ms
      </div>

      {/* マッチしたノード */}
      {result.nodes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {isJa ? 'マッチしたノード' : 'Matched Nodes'} ({result.nodes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.nodes.slice(0, 10).map((node) => {
                const typeInfo = NODE_TYPES[node.type];
                return (
                  <button
                    key={node.id}
                    onClick={() => onSelectNode?.(node.id)}
                    className="flex items-center gap-2 w-full p-2 text-left hover:bg-muted rounded transition-colors"
                  >
                    <span>{typeInfo.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {isJa && node.labelJa ? node.labelJa : node.label}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {isJa ? typeInfo.labelJa : typeInfo.label}
                      </Badge>
                    </div>
                  </button>
                );
              })}
              {result.nodes.length > 10 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{result.nodes.length - 10} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* コミュニティ */}
      {result.communities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {isJa ? '関連コミュニティ' : 'Related Communities'} ({result.communities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.communities.map((community) => (
                <div key={community.id} className="p-2 bg-muted rounded">
                  <p className="text-sm font-medium">
                    {isJa && community.nameJa ? community.nameJa : community.name}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {community.keywords.slice(0, 5).map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                  {(community.summary || community.summaryJa) && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {isJa && community.summaryJa ? community.summaryJa : community.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// SearchPanel
// ============================================================================

export function SearchPanel({
  onSearch,
  onSelectNode,
  language = 'ja',
  isLoading = false,
}: SearchPanelProps): React.JSX.Element {
  const isJa = language === 'ja';
  const [query, setQuery] = React.useState('');
  const [searchType, setSearchType] = React.useState<'semantic' | 'entity' | 'path' | 'community'>('semantic');
  const [nodeTypeFilters, setNodeTypeFilters] = React.useState<NodeType[]>([]);
  const [showFilters, setShowFilters] = React.useState(false);
  const [result, setResult] = React.useState<GraphSearchResult | null>(null);
  const [searching, setSearching] = React.useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const searchQuery: GraphSearchQuery = {
        text: query,
        searchType,
        filters: nodeTypeFilters.length > 0 ? { nodeTypes: nodeTypeFilters } : undefined,
        limit: 20,
      };
      const searchResult = await onSearch(searchQuery);
      setResult(searchResult);
    } finally {
      setSearching(false);
    }
  };

  const toggleNodeTypeFilter = (type: NodeType) => {
    setNodeTypeFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-4">
      {/* 検索フォーム */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="relative">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isJa ? UI_TEXT.askQuestionJa : UI_TEXT.askQuestion}
            className="pr-12"
            disabled={isLoading || searching}
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1"
            disabled={!query.trim() || isLoading || searching}
          >
            {searching ? '...' : '🔍'}
          </Button>
        </div>

        {/* 検索タイプ */}
        <div className="flex gap-1 flex-wrap">
          {SEARCH_TYPES.map((st) => (
            <Button
              key={st.id}
              type="button"
              variant={searchType === st.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchType(st.id)}
            >
              {st.icon} {isJa ? st.labelJa : st.label}
            </Button>
          ))}
        </div>

        {/* フィルタトグル */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? '▼' : '▶'} {isJa ? 'フィルタ' : 'Filters'}
          {nodeTypeFilters.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {nodeTypeFilters.length}
            </Badge>
          )}
        </Button>

        {/* フィルタオプション */}
        {showFilters && (
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div>
              <h4 className="text-xs font-medium mb-1">
                {isJa ? 'ノードタイプ' : 'Node Types'}
              </h4>
              <div className="flex flex-wrap gap-1">
                {Object.values(NODE_TYPES).map((typeInfo) => (
                  <Button
                    key={typeInfo.id}
                    type="button"
                    variant={nodeTypeFilters.includes(typeInfo.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleNodeTypeFilter(typeInfo.id)}
                  >
                    {typeInfo.icon}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </form>

      {/* 検索結果 */}
      <SearchResults result={result} onSelectNode={onSelectNode} language={language} />
    </div>
  );
}

// ============================================================================
// KnowledgeGapPanel
// ============================================================================

export interface KnowledgeGapPanelProps {
  /** ナレッジギャップ一覧 */
  gaps: Array<{
    id: string;
    type: 'missing_link' | 'sparse_area' | 'isolated_cluster' | 'unexplored_relation';
    description: string;
    descriptionJa: string;
    suggestions: string[];
    suggestionsJa: string[];
    importance: number;
  }>;
  /** 言語設定 */
  language?: 'ja' | 'en';
}

export function KnowledgeGapPanel({
  gaps,
  language = 'ja',
}: KnowledgeGapPanelProps): React.JSX.Element {
  const isJa = language === 'ja';

  const getGapTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ja: string }> = {
      missing_link: { en: 'Missing Link', ja: '欠落リンク' },
      sparse_area: { en: 'Sparse Area', ja: '疎な領域' },
      isolated_cluster: { en: 'Isolated Cluster', ja: '孤立クラスタ' },
      unexplored_relation: { en: 'Unexplored Relation', ja: '未探索関係' },
    };
    return isJa ? labels[type]?.ja ?? type : labels[type]?.en ?? type;
  };

  if (gaps.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          <p>{isJa ? 'ナレッジギャップが見つかりませんでした' : 'No knowledge gaps found'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <span>🔍</span>
        {isJa ? UI_TEXT.knowledgeGapsJa : UI_TEXT.knowledgeGaps}
      </h3>

      {gaps.map((gap) => (
        <Card key={gap.id}>
          <CardContent className="py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{getGapTypeLabel(gap.type)}</Badge>
                  <span
                    className={`text-xs ${
                      gap.importance > 0.7
                        ? 'text-red-600'
                        : gap.importance > 0.4
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}
                  >
                    {isJa ? '重要度' : 'Importance'}: {Math.round(gap.importance * 100)}%
                  </span>
                </div>
                <p className="text-sm">
                  {isJa ? gap.descriptionJa : gap.description}
                </p>
              </div>
            </div>

            {/* 研究提案 */}
            {((isJa ? gap.suggestionsJa : gap.suggestions) ?? []).length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-1">
                  {isJa ? UI_TEXT.researchSuggestionsJa : UI_TEXT.researchSuggestions}
                </h4>
                <ul className="text-xs space-y-1">
                  {(isJa ? gap.suggestionsJa : gap.suggestions).map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-primary">💡</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
