/**
 * @file My Lab Data ナレッジパネル
 * @description ナレッジ・知見一覧・管理コンポーネント
 */

'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { KNOWLEDGE_TYPES, UI_TEXT } from './constants';
import type { KnowledgeItem, KnowledgeType, CreateKnowledgeInput } from './types';

// ============================================================================
// Props
// ============================================================================

export interface KnowledgeListProps {
  /** ナレッジ一覧 */
  knowledgeItems: KnowledgeItem[];
  /** 言語設定 */
  language?: 'ja' | 'en';
  /** ナレッジ選択時 */
  onSelectKnowledge?: (item: KnowledgeItem) => void;
  /** ナレッジ作成時 */
  onCreateKnowledge?: (input: CreateKnowledgeInput) => Promise<void>;
  /** ナレッジ削除時 */
  onDeleteKnowledge?: (itemId: string) => Promise<void>;
  /** GraphRAGへ追加時 */
  onIndexKnowledge?: (itemId: string) => Promise<void>;
  /** ローディング状態 */
  isLoading?: boolean;
}

export interface KnowledgeCardProps {
  /** ナレッジアイテム */
  item: KnowledgeItem;
  /** 言語設定 */
  language?: 'ja' | 'en';
  /** 選択時 */
  onSelect?: () => void;
  /** 削除時 */
  onDelete?: () => void;
  /** インデックス時 */
  onIndex?: () => void;
}

export interface CreateKnowledgeDialogProps {
  /** 開いているか */
  isOpen: boolean;
  /** 閉じる */
  onClose: () => void;
  /** 作成時 */
  onCreate: (input: CreateKnowledgeInput) => void;
  /** 言語設定 */
  language?: 'ja' | 'en';
}

// ============================================================================
// KnowledgeCard
// ============================================================================

export function KnowledgeCard({
  item,
  language = 'ja',
  onSelect,
  onDelete,
  onIndex,
}: KnowledgeCardProps): React.JSX.Element {
  const isJa = language === 'ja';
  const typeInfo = KNOWLEDGE_TYPES[item.type];

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
          {/* アイコンとタイトル */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-2xl" aria-hidden="true">
              {typeInfo.icon}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">
                {isJa && item.titleJa ? item.titleJa : item.title}
              </h4>
              
              {/* コンテンツプレビュー */}
              <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                {isJa && item.contentJa ? item.contentJa : item.content}
              </p>
              
              {/* メタデータ */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {typeInfo.icon} {isJa ? typeInfo.labelJa : typeInfo.label}
                </Badge>
                {item.isIndexed && (
                  <Badge variant="default" className="text-xs">
                    🕸️ GraphRAG
                  </Badge>
                )}
                {item.linkedExperiments.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    🔗 {item.linkedExperiments.length} {isJa ? '実験' : 'experiments'}
                  </span>
                )}
                {item.linkedDatasets.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    📊 {item.linkedDatasets.length} {isJa ? 'データセット' : 'datasets'}
                  </span>
                )}
              </div>
              
              {/* タグ */}
              {item.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {item.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 4 && (
                    <span className="text-xs text-muted-foreground">
                      +{item.tags.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* アクション */}
          <div className="flex flex-col gap-1">
            {!item.isIndexed && onIndex && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onIndex();
                }}
                title={isJa ? 'GraphRAGにインデックス' : 'Index to GraphRAG'}
              >
                🕸️
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
          <span>{item.createdBy.name ?? 'Unknown'}</span>
          <span>•</span>
          <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CreateKnowledgeDialog
// ============================================================================

export function CreateKnowledgeDialog({
  isOpen,
  onClose,
  onCreate,
  language = 'ja',
}: CreateKnowledgeDialogProps): React.JSX.Element | null {
  const isJa = language === 'ja';
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [type, setType] = React.useState<KnowledgeType>('finding');
  const [tags, setTags] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onCreate({
      title: title.trim(),
      content: content.trim(),
      type,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });

    // Reset form
    setTitle('');
    setContent('');
    setTags('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-auto">
        <CardHeader>
          <CardTitle>
            {isJa ? UI_TEXT.addKnowledgeJa : UI_TEXT.addKnowledge}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* タイトル */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {isJa ? 'タイトル' : 'Title'} *
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isJa ? 'ナレッジのタイトル' : 'Knowledge title'}
                required
              />
            </div>

            {/* タイプ */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {isJa ? 'タイプ' : 'Type'}
              </label>
              <div className="flex gap-2 flex-wrap">
                {Object.values(KNOWLEDGE_TYPES).map((kt) => (
                  <Button
                    key={kt.id}
                    type="button"
                    variant={type === kt.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setType(kt.id)}
                  >
                    {kt.icon} {isJa ? kt.labelJa : kt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* コンテンツ */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {isJa ? '内容' : 'Content'} *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={isJa ? '知見や発見の詳細を記述...' : 'Describe your finding or insight...'}
                className="w-full px-3 py-2 border rounded-md text-sm min-h-[120px]"
                required
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
              <Button type="submit" disabled={!title.trim() || !content.trim()}>
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
// KnowledgeList
// ============================================================================

export function KnowledgeList({
  knowledgeItems,
  language = 'ja',
  onSelectKnowledge,
  onCreateKnowledge,
  onDeleteKnowledge,
  onIndexKnowledge,
  isLoading = false,
}: KnowledgeListProps): React.JSX.Element {
  const isJa = language === 'ja';
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<KnowledgeType | 'all'>('all');

  const filteredItems = React.useMemo(() => {
    let filtered = knowledgeItems;
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter((k) => k.type === typeFilter);
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((k) =>
        k.title.toLowerCase().includes(q) ||
        (k.titleJa?.toLowerCase().includes(q)) ||
        k.content.toLowerCase().includes(q) ||
        k.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    
    return filtered;
  }, [knowledgeItems, typeFilter, search]);

  // タイプ別カウント
  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: knowledgeItems.length };
    for (const item of knowledgeItems) {
      counts[item.type] = (counts[item.type] || 0) + 1;
    }
    return counts;
  }, [knowledgeItems]);

  const handleCreate = async (input: CreateKnowledgeInput) => {
    await onCreateKnowledge?.(input);
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            {isJa ? 'ナレッジ' : 'Knowledge'}
          </span>
          <Badge variant="secondary">{knowledgeItems.length}</Badge>
        </div>
        {onCreateKnowledge && (
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            💡 {isJa ? UI_TEXT.addKnowledgeJa : UI_TEXT.addKnowledge}
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
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('all')}
          >
            {isJa ? 'すべて' : 'All'} ({typeCounts['all'] || 0})
          </Button>
          {Object.values(KNOWLEDGE_TYPES).map((kt) => (
            <Button
              key={kt.id}
              variant={typeFilter === kt.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(kt.id)}
            >
              {kt.icon} {typeCounts[kt.id] || 0}
            </Button>
          ))}
        </div>
      </div>

      {/* リスト */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {isJa ? '読み込み中...' : 'Loading...'}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-4xl mb-2">💡</p>
          <p>{isJa ? UI_TEXT.noKnowledgeJa : UI_TEXT.noKnowledge}</p>
          <p className="text-sm mt-1">
            {isJa ? '研究から得た知見を記録しましょう' : 'Record insights from your research'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredItems.map((item) => (
            <KnowledgeCard
              key={item.id}
              item={item}
              language={language}
              onSelect={() => onSelectKnowledge?.(item)}
              onDelete={onDeleteKnowledge ? () => onDeleteKnowledge(item.id) : undefined}
              onIndex={onIndexKnowledge ? () => onIndexKnowledge(item.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* 作成ダイアログ */}
      {onCreateKnowledge && (
        <CreateKnowledgeDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onCreate={handleCreate}
          language={language}
        />
      )}
    </div>
  );
}
