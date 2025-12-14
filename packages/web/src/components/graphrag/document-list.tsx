/**
 * @file GraphRAG ドキュメントリスト
 * @description ナレッジベースのドキュメント一覧・管理コンポーネント
 */

'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DOCUMENT_TYPES, UI_TEXT } from './constants';
import type { Document, DocumentType, AddDocumentInput } from './types';

// ============================================================================
// Props
// ============================================================================

export interface DocumentListProps {
  /** ドキュメント一覧 */
  documents: Document[];
  /** 言語設定 */
  language?: 'ja' | 'en';
  /** ドキュメント選択時 */
  onSelectDocument?: (document: Document) => void;
  /** ドキュメント追加時 */
  onAddDocument?: (input: AddDocumentInput) => void;
  /** ドキュメント削除時 */
  onDeleteDocument?: (documentId: string) => void;
  /** ローディング状態 */
  isLoading?: boolean;
}

export interface DocumentCardProps {
  /** ドキュメント */
  document: Document;
  /** 言語設定 */
  language?: 'ja' | 'en';
  /** 選択時 */
  onSelect?: () => void;
  /** 削除時 */
  onDelete?: () => void;
}

export interface AddDocumentDialogProps {
  /** 開いているか */
  isOpen: boolean;
  /** 閉じる */
  onClose: () => void;
  /** 追加時 */
  onAdd: (input: AddDocumentInput) => void;
  /** 言語設定 */
  language?: 'ja' | 'en';
}

// ============================================================================
// DocumentCard
// ============================================================================

export function DocumentCard({
  document,
  language = 'ja',
  onSelect,
  onDelete,
}: DocumentCardProps): React.JSX.Element {
  const isJa = language === 'ja';
  const docTypeInfo = DOCUMENT_TYPES[document.type];

  const getStatusBadge = () => {
    switch (document.status) {
      case 'pending':
        return <Badge variant="outline">待機中</Badge>;
      case 'processing':
        return <Badge variant="secondary">処理中...</Badge>;
      case 'indexed':
        return <Badge variant="default">完了</Badge>;
      case 'error':
        return <Badge variant="destructive">エラー</Badge>;
    }
  };

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
              {docTypeInfo.icon}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">
                {isJa && document.titleJa ? document.titleJa : document.title}
              </h4>
              {document.metadata.authors && document.metadata.authors.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {document.metadata.authors.slice(0, 3).join(', ')}
                  {document.metadata.authors.length > 3 && ' et al.'}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {isJa ? docTypeInfo.labelJa : docTypeInfo.label}
                </Badge>
                {getStatusBadge()}
                {document.metadata.publishedDate && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(document.metadata.publishedDate).getFullYear()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* アクション */}
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
      </CardContent>
    </Card>
  );
}

// ============================================================================
// AddDocumentDialog
// ============================================================================

export function AddDocumentDialog({
  isOpen,
  onClose,
  onAdd,
  language = 'ja',
}: AddDocumentDialogProps): React.JSX.Element | null {
  const isJa = language === 'ja';
  const [activeTab, setActiveTab] = React.useState<'file' | 'doi' | 'url'>('file');
  const [file, setFile] = React.useState<File | null>(null);
  const [doi, setDoi] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [docType, setDocType] = React.useState<DocumentType>('paper');
  const [tags, setTags] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: AddDocumentInput = {
      type: docType,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    if (activeTab === 'file' && file) {
      input.file = file;
    } else if (activeTab === 'doi' && doi) {
      input.doi = doi;
    } else if (activeTab === 'url' && url) {
      input.url = url;
    } else {
      return;
    }

    onAdd(input);
    onClose();
    // Reset form
    setFile(null);
    setDoi('');
    setUrl('');
    setTags('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isJa ? UI_TEXT.addDocumentJa : UI_TEXT.addDocument}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* タブ */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={activeTab === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('file')}
              >
                {isJa ? '📁 ファイル' : '📁 File'}
              </Button>
              <Button
                type="button"
                variant={activeTab === 'doi' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('doi')}
              >
                {isJa ? '🔗 DOI' : '🔗 DOI'}
              </Button>
              <Button
                type="button"
                variant={activeTab === 'url' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('url')}
              >
                {isJa ? '🌐 URL' : '🌐 URL'}
              </Button>
            </div>

            {/* 入力フィールド */}
            {activeTab === 'file' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isJa ? 'ファイル選択' : 'Select File'}
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.html"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm"
                />
              </div>
            )}

            {activeTab === 'doi' && (
              <div>
                <label className="block text-sm font-medium mb-1">DOI</label>
                <input
                  type="text"
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  placeholder="10.1000/xyz123"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
            )}

            {activeTab === 'url' && (
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
            )}

            {/* ドキュメントタイプ */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {isJa ? 'タイプ' : 'Type'}
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {Object.values(DOCUMENT_TYPES).map((dt) => (
                  <option key={dt.id} value={dt.id}>
                    {dt.icon} {isJa ? dt.labelJa : dt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* タグ */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {isJa ? 'タグ（カンマ区切り）' : 'Tags (comma-separated)'}
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={isJa ? '材料科学, MatterGen' : 'materials, MatterGen'}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            {/* アクション */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {isJa ? 'キャンセル' : 'Cancel'}
              </Button>
              <Button type="submit">
                {isJa ? '追加' : 'Add'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// DocumentList
// ============================================================================

export function DocumentList({
  documents,
  language = 'ja',
  onSelectDocument,
  onAddDocument,
  onDeleteDocument,
  isLoading = false,
}: DocumentListProps): React.JSX.Element {
  const isJa = language === 'ja';
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<DocumentType | 'all'>('all');

  const filteredDocuments = React.useMemo(() => {
    if (filter === 'all') return documents;
    return documents.filter((d) => d.type === filter);
  }, [documents, filter]);

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            {isJa ? UI_TEXT.documentsJa : UI_TEXT.documents}
          </span>
          <Badge variant="secondary">{documents.length}</Badge>
        </div>
        {onAddDocument && (
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            {isJa ? UI_TEXT.addDocumentJa : UI_TEXT.addDocument}
          </Button>
        )}
      </div>

      {/* フィルタ */}
      <div className="flex gap-1 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          {isJa ? 'すべて' : 'All'}
        </Button>
        {Object.values(DOCUMENT_TYPES).map((dt) => (
          <Button
            key={dt.id}
            variant={filter === dt.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(dt.id)}
          >
            {dt.icon} {isJa ? dt.labelJa : dt.label}
          </Button>
        ))}
      </div>

      {/* リスト */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {isJa ? '読み込み中...' : 'Loading...'}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-4xl mb-2">📄</p>
          <p>{isJa ? UI_TEXT.emptyJa : UI_TEXT.empty}</p>
          <p className="text-sm mt-1">
            {isJa ? UI_TEXT.emptyDescriptionJa : UI_TEXT.emptyDescription}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              language={language}
              onSelect={() => onSelectDocument?.(doc)}
              onDelete={onDeleteDocument ? () => onDeleteDocument(doc.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* 追加ダイアログ */}
      {onAddDocument && (
        <AddDocumentDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onAdd={onAddDocument}
          language={language}
        />
      )}
    </div>
  );
}
