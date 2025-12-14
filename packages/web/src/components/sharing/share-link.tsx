/**
 * @file 共有リンク管理コンポーネント
 * @description 共有リンクの作成・管理機能
 * @module @labflow/web/components/sharing/share-link
 */

'use client';

import React, { useState, useCallback } from 'react';
import type {
  ShareLink,
  ShareLinkConfig,
  SharePermission,
  ShareLinkManagerProps,
} from './types';
import {
  PERMISSION_LABELS,
  DEFAULT_SHARE_LINK_CONFIG,
  createShareLink,
  isShareLinkValid,
  formatExpiration,
  formatDateTime,
  copyToClipboard,
  buildEmailShareUrl,
} from './utils';

// =============================================================================
// ラベル定義
// =============================================================================

const LABELS = {
  en: {
    title: 'Share Links',
    createLink: 'Create Link',
    noLinks: 'No share links yet',
    createFirst: 'Create your first share link to share this project',
    linkSettings: {
      title: 'Link Settings',
      permission: 'Permission',
      expiration: 'Expiration',
      expirationOptions: {
        never: 'Never',
        '1h': '1 hour',
        '24h': '24 hours',
        '7d': '7 days',
        '30d': '30 days',
        custom: 'Custom',
      },
      password: 'Password protection',
      passwordPlaceholder: 'Enter password (optional)',
      allowDownload: 'Allow download',
      maxAccess: 'Max access count',
      maxAccessPlaceholder: 'Unlimited',
    },
    actions: {
      copy: 'Copy Link',
      copied: 'Copied!',
      email: 'Email',
      deactivate: 'Deactivate',
      delete: 'Delete',
      reactivate: 'Reactivate',
    },
    status: {
      active: 'Active',
      expired: 'Expired',
      disabled: 'Disabled',
      maxAccess: 'Max access reached',
    },
    accessCount: 'accesses',
    create: 'Create',
    cancel: 'Cancel',
  },
  ja: {
    title: '共有リンク',
    createLink: 'リンクを作成',
    noLinks: '共有リンクがありません',
    createFirst: '最初の共有リンクを作成して、このプロジェクトを共有しましょう',
    linkSettings: {
      title: 'リンク設定',
      permission: '権限',
      expiration: '有効期限',
      expirationOptions: {
        never: '無期限',
        '1h': '1時間',
        '24h': '24時間',
        '7d': '7日間',
        '30d': '30日間',
        custom: 'カスタム',
      },
      password: 'パスワード保護',
      passwordPlaceholder: 'パスワードを入力（任意）',
      allowDownload: 'ダウンロードを許可',
      maxAccess: '最大アクセス回数',
      maxAccessPlaceholder: '無制限',
    },
    actions: {
      copy: 'リンクをコピー',
      copied: 'コピーしました！',
      email: 'メール',
      deactivate: '無効化',
      delete: '削除',
      reactivate: '再有効化',
    },
    status: {
      active: 'アクティブ',
      expired: '期限切れ',
      disabled: '無効',
      maxAccess: 'アクセス上限',
    },
    accessCount: 'アクセス',
    create: '作成',
    cancel: 'キャンセル',
  },
};

// =============================================================================
// サブコンポーネント
// =============================================================================

/** 権限選択 */
interface PermissionSelectorProps {
  value: SharePermission;
  onChange: (permission: SharePermission) => void;
  useJapaneseLabels?: boolean;
}

function PermissionSelector({
  value,
  onChange,
  useJapaneseLabels = true,
}: PermissionSelectorProps) {
  const locale = useJapaneseLabels ? 'ja' : 'en';
  const permissions: SharePermission[] = ['view', 'comment', 'edit'];

  return (
    <div className="space-y-2">
      {permissions.map((perm) => (
        <label
          key={perm}
          className={`
            flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
            ${value === perm
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
            }
          `}
        >
          <input
            type="radio"
            name="permission"
            value={perm}
            checked={value === perm}
            onChange={() => onChange(perm)}
            className="mt-1"
          />
          <div>
            <p className="font-medium text-gray-900">
              {PERMISSION_LABELS[perm][locale]}
            </p>
            <p className="text-sm text-gray-500">
              {PERMISSION_LABELS[perm].description[locale]}
            </p>
          </div>
        </label>
      ))}
    </div>
  );
}

/** リンク作成フォーム */
interface CreateLinkFormProps {
  projectId: string;
  onCreate: (config: ShareLinkConfig) => void;
  onCancel: () => void;
  useJapaneseLabels?: boolean;
}

function CreateLinkForm({
  projectId,
  onCreate,
  onCancel,
  useJapaneseLabels = true,
}: CreateLinkFormProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  const [config, setConfig] = useState<ShareLinkConfig>(DEFAULT_SHARE_LINK_CONFIG);
  const [expirationPreset, setExpirationPreset] = useState<string>('never');

  const handleExpirationChange = (preset: string) => {
    setExpirationPreset(preset);
    let expiresAt: Date | null = null;
    const now = new Date();

    switch (preset) {
      case '1h':
        expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case '24h':
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case '7d':
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
    }

    setConfig((prev) => ({ ...prev, expiresAt }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="font-medium text-gray-900">{l.linkSettings.title}</h3>

      {/* 権限 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {l.linkSettings.permission}
        </label>
        <PermissionSelector
          value={config.permission}
          onChange={(permission) => setConfig((prev) => ({ ...prev, permission }))}
          useJapaneseLabels={useJapaneseLabels}
        />
      </div>

      {/* 有効期限 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {l.linkSettings.expiration}
        </label>
        <div className="flex flex-wrap gap-2">
          {(['never', '1h', '24h', '7d', '30d'] as const).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleExpirationChange(preset)}
              className={`
                px-3 py-1.5 rounded-lg text-sm transition-all
                ${expirationPreset === preset
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {l.linkSettings.expirationOptions[preset]}
            </button>
          ))}
        </div>
      </div>

      {/* パスワード */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {l.linkSettings.password}
        </label>
        <input
          type="password"
          value={config.password ?? ''}
          onChange={(e) => setConfig((prev) => ({
            ...prev,
            password: e.target.value || undefined,
          }))}
          placeholder={l.linkSettings.passwordPlaceholder}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* ダウンロード許可 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={config.allowDownload}
          onChange={(e) => setConfig((prev) => ({ ...prev, allowDownload: e.target.checked }))}
          className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">{l.linkSettings.allowDownload}</span>
      </label>

      {/* 最大アクセス回数 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {l.linkSettings.maxAccess}
        </label>
        <input
          type="number"
          min="1"
          value={config.maxAccessCount ?? ''}
          onChange={(e) => setConfig((prev) => ({
            ...prev,
            maxAccessCount: e.target.value ? parseInt(e.target.value, 10) : null,
          }))}
          placeholder={l.linkSettings.maxAccessPlaceholder}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* ボタン */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {l.cancel}
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {l.create}
        </button>
      </div>
    </form>
  );
}

/** リンクカード */
interface LinkCardProps {
  link: ShareLink;
  projectName?: string;
  onDeactivate?: () => void;
  onDelete?: () => void;
  onReactivate?: () => void;
  useJapaneseLabels?: boolean;
}

function LinkCard({
  link,
  projectName = 'Project',
  onDeactivate,
  onDelete,
  onReactivate,
  useJapaneseLabels = true,
}: LinkCardProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  const locale = useJapaneseLabels ? 'ja' : 'en';
  const [copied, setCopied] = useState(false);

  const validity = isShareLinkValid(link);
  const statusLabel = validity.valid
    ? l.status.active
    : l.status[validity.reason as keyof typeof l.status] ?? l.status.disabled;
  const statusColor = validity.valid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';

  const handleCopy = async () => {
    const success = await copyToClipboard(link.url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmail = () => {
    const emailUrl = buildEmailShareUrl(link.url, projectName, locale);
    window.location.href = emailUrl;
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* URL とステータス */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <code className="text-sm text-gray-600 truncate">{link.url}</code>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* 詳細情報 */}
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
        <div>
          <span className="font-medium">{PERMISSION_LABELS[link.config.permission][locale]}</span>
        </div>
        <div>
          {formatExpiration(link.config.expiresAt, locale)}
        </div>
        <div>
          {link.accessCount} {l.accessCount}
        </div>
        <div>
          {formatDateTime(link.createdAt, locale)}
        </div>
      </div>

      {/* アクション */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <button
          onClick={handleCopy}
          className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {l.actions.copied}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {l.actions.copy}
            </>
          )}
        </button>
        <button
          onClick={handleEmail}
          className="px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          title={l.actions.email}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>
        {validity.valid ? (
          onDeactivate && (
            <button
              onClick={onDeactivate}
              className="px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title={l.actions.deactivate}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
          )
        ) : (
          onReactivate && link.isActive === false && (
            <button
              onClick={onReactivate}
              className="px-3 py-2 text-sm text-green-600 rounded-lg hover:bg-green-50 transition-colors"
              title={l.actions.reactivate}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            title={l.actions.delete}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// メインコンポーネント
// =============================================================================

/**
 * 共有リンク管理
 */
export function ShareLinkManager({
  links,
  projectId,
  onCreateLink,
  onDeleteLink,
  onDeactivateLink,
  readOnly = false,
  useJapaneseLabels = true,
}: ShareLinkManagerProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback((config: ShareLinkConfig) => {
    if (onCreateLink) {
      onCreateLink(config);
    }
    setIsCreating(false);
  }, [onCreateLink]);

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{l.title}</h3>
        {!readOnly && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {l.createLink}
          </button>
        )}
      </div>

      {/* リンク作成フォーム */}
      {isCreating && (
        <CreateLinkForm
          projectId={projectId}
          onCreate={handleCreate}
          onCancel={() => setIsCreating(false)}
          useJapaneseLabels={useJapaneseLabels}
        />
      )}

      {/* リンク一覧 */}
      {links.length === 0 && !isCreating ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="font-medium">{l.noLinks}</p>
          <p className="text-sm mt-1">{l.createFirst}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              onDeactivate={onDeactivateLink ? () => onDeactivateLink(link.id) : undefined}
              onDelete={onDeleteLink ? () => onDeleteLink(link.id) : undefined}
              useJapaneseLabels={useJapaneseLabels}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// クイック共有ボタン
// =============================================================================

interface QuickShareButtonProps {
  projectId: string;
  projectName?: string;
  useJapaneseLabels?: boolean;
  className?: string;
}

export function QuickShareButton({
  projectId,
  projectName = 'Project',
  useJapaneseLabels = true,
  className = '',
}: QuickShareButtonProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  const locale = useJapaneseLabels ? 'ja' : 'en';
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState<ShareLink | null>(null);

  const handleCreateQuickLink = useCallback(() => {
    const newLink = createShareLink(
      projectId,
      {
        ...DEFAULT_SHARE_LINK_CONFIG,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日間
      },
      'current-user',
      typeof window !== 'undefined' ? window.location.origin : ''
    );
    setLink(newLink);
    setIsOpen(true);
  }, [projectId]);

  const handleCopy = async () => {
    if (link) {
      const success = await copyToClipboard(link.url);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleEmail = () => {
    if (link) {
      const emailUrl = buildEmailShareUrl(link.url, projectName, locale);
      window.location.href = emailUrl;
    }
  };

  return (
    <>
      <button
        onClick={handleCreateQuickLink}
        className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600 ${className}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span>{useJapaneseLabels ? '共有' : 'Share'}</span>
      </button>

      {/* 共有モーダル */}
      {isOpen && link && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">
              {useJapaneseLabels ? '共有リンクを作成しました' : 'Share link created'}
            </h3>
            
            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg mb-4">
              <input
                type="text"
                value={link.url}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {l.actions.copied}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {l.actions.copy}
                  </>
                )}
              </button>
              <button
                onClick={handleEmail}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {l.actions.email}
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-4 text-center">
              {useJapaneseLabels 
                ? `このリンクは ${formatExpiration(link.config.expiresAt, 'ja')} まで有効です`
                : `This link expires ${formatExpiration(link.config.expiresAt, 'en')}`
              }
            </p>
          </div>
        </div>
      )}
    </>
  );
}
