/**
 * @file My Lab Data データセットパネル
 * @description データセット一覧・管理コンポーネント
 */

'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DATASET_TYPES, VISIBILITY_OPTIONS, UI_TEXT } from './constants';
import type { Dataset, DatasetType, DataVisibility, CreateDatasetInput } from './types';

// ============================================================================
// Props
// ============================================================================

export interface DatasetListProps {
  /** データセット一覧 */
  datasets: Dataset[];
  /** 言語設定 */
  language?: 'ja' | 'en';
  /** データセット選択時 */
  onSelectDataset?: (dataset: Dataset) => void;
  /** データセット作成時 */
  onCreateDataset?: (input: CreateDatasetInput) => Promise<void>;
  /** データセット削除時 */
  onDeleteDataset?: (datasetId: string) => Promise<void>;
  /** GraphRAGインデックス時 */
  onIndexDataset?: (datasetId: string) => Promise<void>;
  /** ローディング状態 */
  isLoading?: boolean;
}

export interface DatasetCardProps {
  /** データセット */
  dataset: Dataset;
  /** 言語設定 */
  language?: 'ja' | 'en';
  /** 選択時 */
  onSelect?: () => void;
  /** 削除時 */
  onDelete?: () => void;
  /** インデックス時 */
  onIndex?: () => void;
}

export interface CreateDatasetDialogProps {
  /** 開いているか */
  isOpen: boolean;
  /** 閉じる */
  onClose: () => void;
  /** 作成時 */
  onCreate: (input: CreateDatasetInput) => void;
  /** 言語設定 */
  language?: 'ja' | 'en';
}

// ============================================================================
// ユーティリティ
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ============================================================================
// DatasetCard
// ============================================================================

export function DatasetCard({
  dataset,
  language = 'ja',
  onSelect,
  onDelete,
  onIndex,
}: DatasetCardProps): React.JSX.Element {
  const isJa = language === 'ja';
  const typeInfo = DATASET_TYPES[dataset.type];
  const visibilityInfo = VISIBILITY_OPTIONS[dataset.visibility];

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
                {isJa && dataset.nameJa ? dataset.nameJa : dataset.name}
              </h4>
              {(dataset.description || dataset.descriptionJa) && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {isJa && dataset.descriptionJa ? dataset.descriptionJa : dataset.description}
                </p>
              )}
              
              {/* メタデータ */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {typeInfo.icon} {isJa ? typeInfo.labelJa : typeInfo.label}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {visibilityInfo.icon} {isJa ? visibilityInfo.labelJa : visibilityInfo.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatBytes(dataset.sizeBytes)}
                </span>
                {dataset.rowCount !== null && (
                  <span className="text-xs text-muted-foreground">
                    {dataset.rowCount.toLocaleString()} rows
                  </span>
                )}
                {dataset.isIndexed && (
                  <Badge variant="default" className="text-xs">
                    🕸️ GraphRAG
                  </Badge>
                )}
              </div>
              
              {/* タグ */}
              {dataset.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {dataset.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {dataset.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{dataset.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* アクション */}
          <div className="flex flex-col gap-1">
            {!dataset.isIndexed && onIndex && (
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
          <span>{dataset.createdBy.name ?? 'Unknown'}</span>
          <span>•</span>
          <span>{new Date(dataset.updatedAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CreateDatasetDialog
// ============================================================================

export function CreateDatasetDialog({
  isOpen,
  onClose,
  onCreate,
  language = 'ja',
}: CreateDatasetDialogProps): React.JSX.Element | null {
  const isJa = language === 'ja';
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [type, setType] = React.useState<DatasetType>('tabular');
  const [visibility, setVisibility] = React.useState<DataVisibility>('lab');
  const [tags, setTags] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      visibility,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      file: file ?? undefined,
    });

    // Reset form
    setName('');
    setDescription('');
    setTags('');
    setFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>
            {isJa ? UI_TEXT.addDatasetJa : UI_TEXT.addDataset}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 名前 */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {isJa ? '名前' : 'Name'} *
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isJa ? 'データセット名' : 'Dataset name'}
                required
              />
            </div>

            {/* 説明 */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {isJa ? '説明' : 'Description'}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isJa ? 'データセットの説明...' : 'Describe this dataset...'}
                className="w-full px-3 py-2 border rounded-md text-sm min-h-[80px]"
              />
            </div>

            {/* タイプ */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {isJa ? 'タイプ' : 'Type'}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DatasetType)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {Object.values(DATASET_TYPES).map((dt) => (
                  <option key={dt.id} value={dt.id}>
                    {dt.icon} {isJa ? dt.labelJa : dt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 可視性 */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {isJa ? '可視性' : 'Visibility'}
              </label>
              <div className="flex gap-2">
                {Object.values(VISIBILITY_OPTIONS).map((v) => (
                  <Button
                    key={v.id}
                    type="button"
                    variant={visibility === v.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisibility(v.id)}
                  >
                    {v.icon} {isJa ? v.labelJa : v.label}
                  </Button>
                ))}
              </div>
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

            {/* ファイル */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {isJa ? 'ファイル' : 'File'}
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
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
// DatasetList
// ============================================================================

export function DatasetList({
  datasets,
  language = 'ja',
  onSelectDataset,
  onCreateDataset,
  onDeleteDataset,
  onIndexDataset,
  isLoading = false,
}: DatasetListProps): React.JSX.Element {
  const isJa = language === 'ja';
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<DatasetType | 'all'>('all');

  const filteredDatasets = React.useMemo(() => {
    let filtered = datasets;
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter((d) => d.type === typeFilter);
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((d) =>
        d.name.toLowerCase().includes(q) ||
        (d.nameJa?.toLowerCase().includes(q)) ||
        (d.description?.toLowerCase().includes(q)) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    
    return filtered;
  }, [datasets, typeFilter, search]);

  const handleCreate = async (input: CreateDatasetInput) => {
    await onCreateDataset?.(input);
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            {isJa ? 'データセット' : 'Datasets'}
          </span>
          <Badge variant="secondary">{datasets.length}</Badge>
        </div>
        {onCreateDataset && (
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            ➕ {isJa ? UI_TEXT.addDatasetJa : UI_TEXT.addDataset}
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
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as DatasetType | 'all')}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="all">{isJa ? 'すべてのタイプ' : 'All types'}</option>
          {Object.values(DATASET_TYPES).map((dt) => (
            <option key={dt.id} value={dt.id}>
              {dt.icon} {isJa ? dt.labelJa : dt.label}
            </option>
          ))}
        </select>
      </div>

      {/* リスト */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {isJa ? '読み込み中...' : 'Loading...'}
        </div>
      ) : filteredDatasets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-4xl mb-2">📁</p>
          <p>{isJa ? UI_TEXT.noDatasetsJa : UI_TEXT.noDatasets}</p>
          <p className="text-sm mt-1">
            {isJa ? 'データセットを追加して始めましょう' : 'Add a dataset to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredDatasets.map((dataset) => (
            <DatasetCard
              key={dataset.id}
              dataset={dataset}
              language={language}
              onSelect={() => onSelectDataset?.(dataset)}
              onDelete={onDeleteDataset ? () => onDeleteDataset(dataset.id) : undefined}
              onIndex={onIndexDataset ? () => onIndexDataset(dataset.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* 作成ダイアログ */}
      {onCreateDataset && (
        <CreateDatasetDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onCreate={handleCreate}
          language={language}
        />
      )}
    </div>
  );
}
