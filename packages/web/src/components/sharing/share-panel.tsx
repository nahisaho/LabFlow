/**
 * @file 共有パネルコンポーネント
 * @description プロジェクト共有の統合パネル
 * @module @labflow/web/components/sharing/share-panel
 */

'use client';

import React, { useState } from 'react';
import type {
  ProjectSharingSettings,
  SharePanelProps,
  SharePermission,
  ShareLinkConfig,
} from './types';
import { ShareLinkManager } from './share-link';
import { TeamMemberList, CommentSection, ActivityFeed } from './collaboration';
import { ExportButton } from './export-dialog';
import { ImportButton } from './import-dialog';
import { PERMISSION_LABELS } from './utils';

// =============================================================================
// ラベル定義
// =============================================================================

const LABELS = {
  en: {
    title: 'Share & Collaborate',
    tabs: {
      members: 'Members',
      links: 'Links',
      comments: 'Comments',
      activity: 'Activity',
      settings: 'Settings',
    },
    settings: {
      title: 'Sharing Settings',
      visibility: 'Visibility',
      visibilityOptions: {
        private: 'Private - Only you',
        team: 'Team - Invited members only',
        organization: 'Organization - Anyone in your organization',
        public: 'Public - Anyone with the link',
      },
      defaultPermission: 'Default Permission',
      allowComments: 'Allow comments',
      allowExport: 'Allow export',
      notifications: {
        title: 'Notifications',
        onMemberAdded: 'When member is added',
        onComment: 'When comment is posted',
        onWorkflowComplete: 'When workflow completes',
        onShareLinkAccess: 'When share link is accessed',
      },
    },
    actions: 'Actions',
  },
  ja: {
    title: '共有・コラボレーション',
    tabs: {
      members: 'メンバー',
      links: 'リンク',
      comments: 'コメント',
      activity: 'アクティビティ',
      settings: '設定',
    },
    settings: {
      title: '共有設定',
      visibility: '公開設定',
      visibilityOptions: {
        private: '非公開 - 自分のみ',
        team: 'チーム - 招待されたメンバーのみ',
        organization: '組織 - 組織内の全員',
        public: '公開 - リンクを知っている全員',
      },
      defaultPermission: 'デフォルト権限',
      allowComments: 'コメントを許可',
      allowExport: 'エクスポートを許可',
      notifications: {
        title: '通知設定',
        onMemberAdded: 'メンバー追加時',
        onComment: 'コメント投稿時',
        onWorkflowComplete: 'ワークフロー完了時',
        onShareLinkAccess: '共有リンクアクセス時',
      },
    },
    actions: 'アクション',
  },
};

// =============================================================================
// タブ定義
// =============================================================================

type TabId = 'members' | 'links' | 'comments' | 'activity' | 'settings';

// =============================================================================
// 設定パネル
// =============================================================================

interface SettingsPanelProps {
  settings: ProjectSharingSettings;
  onChange: (settings: ProjectSharingSettings) => void;
  readOnly?: boolean;
  useJapaneseLabels?: boolean;
}

function SettingsPanel({
  settings,
  onChange,
  readOnly = false,
  useJapaneseLabels = true,
}: SettingsPanelProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  const locale = useJapaneseLabels ? 'ja' : 'en';

  const updateSetting = <K extends keyof ProjectSharingSettings>(
    key: K,
    value: ProjectSharingSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const updateNotification = (key: keyof ProjectSharingSettings['notifications'], value: boolean) => {
    onChange({
      ...settings,
      notifications: { ...settings.notifications, [key]: value },
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">{l.settings.title}</h3>

      {/* 公開設定 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {l.settings.visibility}
        </label>
        <select
          value={settings.visibility}
          onChange={(e) => updateSetting('visibility', e.target.value as ProjectSharingSettings['visibility'])}
          disabled={readOnly}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          {(['private', 'team', 'organization', 'public'] as const).map((v) => (
            <option key={v} value={v}>
              {l.settings.visibilityOptions[v]}
            </option>
          ))}
        </select>
      </div>

      {/* デフォルト権限 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {l.settings.defaultPermission}
        </label>
        <select
          value={settings.defaultPermission}
          onChange={(e) => updateSetting('defaultPermission', e.target.value as SharePermission)}
          disabled={readOnly}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          {(['view', 'comment', 'edit'] as SharePermission[]).map((p) => (
            <option key={p} value={p}>
              {PERMISSION_LABELS[p][locale]}
            </option>
          ))}
        </select>
      </div>

      {/* 許可設定 */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.allowComments}
            onChange={(e) => updateSetting('allowComments', e.target.checked)}
            disabled={readOnly}
            className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{l.settings.allowComments}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.allowExport}
            onChange={(e) => updateSetting('allowExport', e.target.checked)}
            disabled={readOnly}
            className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{l.settings.allowExport}</span>
        </label>
      </div>

      {/* 通知設定 */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">{l.settings.notifications.title}</h4>
        <div className="space-y-2">
          {([
            ['onMemberAdded', l.settings.notifications.onMemberAdded],
            ['onComment', l.settings.notifications.onComment],
            ['onWorkflowComplete', l.settings.notifications.onWorkflowComplete],
            ['onShareLinkAccess', l.settings.notifications.onShareLinkAccess],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications[key]}
                onChange={(e) => updateNotification(key, e.target.checked)}
                disabled={readOnly}
                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// メインコンポーネント
// =============================================================================

/**
 * 共有パネル
 */
export function SharePanel({
  projectId,
  settings,
  onSettingsChange,
  readOnly = false,
  useJapaneseLabels = true,
}: SharePanelProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  const [activeTab, setActiveTab] = useState<TabId>('members');

  // デフォルト設定
  const currentSettings: ProjectSharingSettings = settings ?? {
    projectId,
    visibility: 'private',
    members: [],
    shareLinks: [],
    defaultPermission: 'view',
    allowComments: true,
    allowExport: true,
    notifications: {
      onMemberAdded: true,
      onComment: true,
      onWorkflowComplete: true,
      onShareLinkAccess: false,
    },
  };

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'members', label: l.tabs.members, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'links', label: l.tabs.links, icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
    { id: 'comments', label: l.tabs.comments, icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { id: 'activity', label: l.tabs.activity, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'settings', label: l.tabs.settings, icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{l.title}</h2>
          <div className="flex items-center gap-2">
            <ExportButton
              target="project"
              targetId={projectId}
              useJapaneseLabels={useJapaneseLabels}
              variant="ghost"
            />
            <ImportButton
              targetProjectId={projectId}
              useJapaneseLabels={useJapaneseLabels}
              variant="ghost"
            />
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* コンテンツ */}
      <div className="p-6">
        {activeTab === 'members' && (
          <TeamMemberList
            members={currentSettings.members}
            currentUserId="current-user"
            onAddMember={onSettingsChange ? (email, role) => {
              const newMember = {
                userId: `user-${Date.now()}`,
                name: email.split('@')[0],
                email,
                role,
                invitedAt: new Date(),
                status: 'pending' as const,
              };
              onSettingsChange({
                ...currentSettings,
                members: [...currentSettings.members, newMember],
              });
            } : undefined}
            onRemoveMember={onSettingsChange ? (userId) => {
              onSettingsChange({
                ...currentSettings,
                members: currentSettings.members.filter((m) => m.userId !== userId),
              });
            } : undefined}
            onChangeRole={onSettingsChange ? (userId, role) => {
              onSettingsChange({
                ...currentSettings,
                members: currentSettings.members.map((m) =>
                  m.userId === userId ? { ...m, role } : m
                ),
              });
            } : undefined}
            readOnly={readOnly}
            useJapaneseLabels={useJapaneseLabels}
          />
        )}

        {activeTab === 'links' && (
          <ShareLinkManager
            links={currentSettings.shareLinks}
            projectId={projectId}
            onCreateLink={onSettingsChange ? (config) => {
              const newLink = {
                id: `link-${Date.now()}`,
                url: `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${Math.random().toString(36).slice(2, 10)}`,
                shortCode: Math.random().toString(36).slice(2, 10),
                projectId,
                config,
                createdBy: 'current-user',
                createdAt: new Date(),
                accessCount: 0,
                isActive: true,
              };
              onSettingsChange({
                ...currentSettings,
                shareLinks: [...currentSettings.shareLinks, newLink],
              });
            } : undefined}
            onDeleteLink={onSettingsChange ? (linkId) => {
              onSettingsChange({
                ...currentSettings,
                shareLinks: currentSettings.shareLinks.filter((l) => l.id !== linkId),
              });
            } : undefined}
            onDeactivateLink={onSettingsChange ? (linkId) => {
              onSettingsChange({
                ...currentSettings,
                shareLinks: currentSettings.shareLinks.map((l) =>
                  l.id === linkId ? { ...l, isActive: false } : l
                ),
              });
            } : undefined}
            readOnly={readOnly}
            useJapaneseLabels={useJapaneseLabels}
          />
        )}

        {activeTab === 'comments' && (
          <CommentSection
            projectId={projectId}
            comments={[]}
            currentUserId="current-user"
            onAddComment={readOnly ? undefined : (content) => {
              console.log('Add comment:', content);
            }}
            readOnly={readOnly}
            useJapaneseLabels={useJapaneseLabels}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityFeed
            activities={[]}
            useJapaneseLabels={useJapaneseLabels}
          />
        )}

        {activeTab === 'settings' && onSettingsChange && (
          <SettingsPanel
            settings={currentSettings}
            onChange={onSettingsChange}
            readOnly={readOnly}
            useJapaneseLabels={useJapaneseLabels}
          />
        )}
      </div>
    </div>
  );
}
