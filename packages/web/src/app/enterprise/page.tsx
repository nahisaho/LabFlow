'use client';

import { useState } from 'react';
import Link from 'next/link';

// ============================================================================
// Mock Types (would import from @labflow/core)
// ============================================================================

type AuditEventCategory = 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system_config' | 'workflow_execution' | 'export' | 'compliance';
type AuditEventSeverity = 'info' | 'warning' | 'error' | 'critical';

interface AuditEvent {
  id: string;
  timestamp: Date;
  category: AuditEventCategory;
  severity: AuditEventSeverity;
  action: string;
  actor: { userId: string; userName: string; email: string };
  resource: { type: string; id: string; name?: string };
  outcome: 'success' | 'failure' | 'partial';
}

interface SSOProvider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
}

interface ComplianceResult {
  requirement: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

// ============================================================================
// Mock Data
// ============================================================================

const mockAuditEvents: AuditEvent[] = [
  { id: '1', timestamp: new Date(), category: 'authentication', severity: 'info', action: 'user_login', actor: { userId: 'u1', userName: '田中太郎', email: 'tanaka@example.com' }, resource: { type: 'session', id: 's1' }, outcome: 'success' },
  { id: '2', timestamp: new Date(Date.now() - 3600000), category: 'data_modification', severity: 'info', action: 'workflow_updated', actor: { userId: 'u2', userName: '鈴木花子', email: 'suzuki@example.com' }, resource: { type: 'workflow', id: 'w1', name: '分子生成パイプライン' }, outcome: 'success' },
  { id: '3', timestamp: new Date(Date.now() - 7200000), category: 'authorization', severity: 'warning', action: 'permission_denied', actor: { userId: 'u3', userName: '山田一郎', email: 'yamada@example.com' }, resource: { type: 'experiment', id: 'e1', name: '実験A' }, outcome: 'failure' },
  { id: '4', timestamp: new Date(Date.now() - 10800000), category: 'compliance', severity: 'info', action: 'document_signed', actor: { userId: 'u1', userName: '田中太郎', email: 'tanaka@example.com' }, resource: { type: 'document', id: 'd1', name: '実験報告書' }, outcome: 'success' },
  { id: '5', timestamp: new Date(Date.now() - 14400000), category: 'export', severity: 'info', action: 'data_exported', actor: { userId: 'u2', userName: '鈴木花子', email: 'suzuki@example.com' }, resource: { type: 'dataset', id: 'ds1', name: '創薬データセット' }, outcome: 'success' },
];

const mockSSOProviders: SSOProvider[] = [
  { id: 'sso-1', name: 'Azure AD', type: 'azure_ad', enabled: true },
  { id: 'sso-2', name: 'Okta', type: 'okta', enabled: false },
  { id: 'sso-3', name: 'Google Workspace', type: 'google_workspace', enabled: true },
];

const mockRoles: Role[] = [
  { id: 'admin', name: '管理者', description: 'システム全体の管理権限', userCount: 3 },
  { id: 'researcher', name: '研究者', description: '実験とワークフローの管理権限', userCount: 25 },
  { id: 'viewer', name: '閲覧者', description: '閲覧のみの権限', userCount: 12 },
];

const mockComplianceResults: ComplianceResult[] = [
  { requirement: '監査ログが有効', status: 'pass', message: '監査ログは正常に機能しています' },
  { requirement: '電子署名の実装', status: 'pass', message: '電子署名システムが設定されています' },
  { requirement: 'ユーザー認証の強化', status: 'warning', message: 'MFAの有効化を推奨します' },
  { requirement: 'データ整合性の確保', status: 'pass', message: 'ハッシュベースの整合性チェックが実装されています' },
  { requirement: 'アクセス制御', status: 'pass', message: 'ロールベースのアクセス制御が有効です' },
  { requirement: 'トレーニング記録', status: 'warning', message: 'ユーザートレーニング記録を確認してください' },
];

// ============================================================================
// Main Component
// ============================================================================

export default function EnterprisePage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'sso' | 'roles' | 'compliance'>('audit');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const tabs = [
    { id: 'audit', name: '監査ログ', icon: '📋' },
    { id: 'sso', name: 'SSO設定', icon: '🔐' },
    { id: 'roles', name: 'ロール管理', icon: '👥' },
    { id: 'compliance', name: 'コンプライアンス', icon: '✅' },
  ];

  const filteredEvents = mockAuditEvents.filter(event => {
    if (filterCategory !== 'all' && event.category !== filterCategory) return false;
    if (filterSeverity !== 'all' && event.severity !== filterSeverity) return false;
    return true;
  });

  const severityColors: Record<AuditEventSeverity, string> = {
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    critical: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  };

  const outcomeColors: Record<string, string> = {
    success: 'text-green-600 dark:text-green-400',
    failure: 'text-red-600 dark:text-red-400',
    partial: 'text-yellow-600 dark:text-yellow-400',
  };

  const complianceStatusColors: Record<string, string> = {
    pass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    fail: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← ダッシュボード
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🏢 Enterprise管理
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                Enterprise Plan
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  監査ログ
                </h2>
                <div className="flex items-center gap-4">
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="all">すべてのカテゴリ</option>
                    <option value="authentication">認証</option>
                    <option value="authorization">認可</option>
                    <option value="data_modification">データ変更</option>
                    <option value="compliance">コンプライアンス</option>
                    <option value="export">エクスポート</option>
                  </select>
                  <select
                    value={filterSeverity}
                    onChange={e => setFilterSeverity(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="all">すべての重要度</option>
                    <option value="info">情報</option>
                    <option value="warning">警告</option>
                    <option value="error">エラー</option>
                    <option value="critical">重大</option>
                  </select>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                    エクスポート
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">時刻</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">カテゴリ</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">重要度</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">アクション</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ユーザー</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">リソース</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">結果</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map(event => (
                      <tr key={event.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {event.timestamp.toLocaleString('ja-JP')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {event.category}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${severityColors[event.severity]}`}>
                            {event.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {event.action}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {event.actor.userName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {event.resource.name || event.resource.id}
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium ${outcomeColors[event.outcome]}`}>
                          {event.outcome === 'success' ? '✓ 成功' : event.outcome === 'failure' ? '✗ 失敗' : '△ 部分的'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{filteredEvents.length}件のイベント</span>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                    前へ
                  </button>
                  <span>1 / 1</span>
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                    次へ
                  </button>
                </div>
              </div>
            </div>

            {/* Audit Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">今日のイベント</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">156</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">警告</div>
                <div className="text-2xl font-bold text-yellow-600">3</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">エラー</div>
                <div className="text-2xl font-bold text-red-600">0</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">アクティブユーザー</div>
                <div className="text-2xl font-bold text-green-600">28</div>
              </div>
            </div>
          </div>
        )}

        {/* SSO Tab */}
        {activeTab === 'sso' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  SSOプロバイダー
                </h2>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                  + プロバイダーを追加
                </button>
              </div>

              <div className="space-y-4">
                {mockSSOProviders.map(provider => (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
                        {provider.type === 'azure_ad' ? '🔷' : provider.type === 'okta' ? '🟣' : '🔴'}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{provider.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{provider.type.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        provider.enabled
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {provider.enabled ? '有効' : '無効'}
                      </span>
                      <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                        設定
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SSO Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                セキュリティ設定
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">SSO必須</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">すべてのユーザーにSSOログインを要求</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">多要素認証（MFA）</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">追加のセキュリティレイヤーを要求</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">セッションタイムアウト</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">非アクティブ時の自動ログアウト時間</p>
                  </div>
                  <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                    <option value="30">30分</option>
                    <option value="60" selected>60分</option>
                    <option value="120">2時間</option>
                    <option value="480">8時間</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  ロール管理
                </h2>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                  + カスタムロールを作成
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockRoles.map(role => (
                  <div
                    key={role.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{role.name}</h3>
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                        {role.id === 'admin' || role.id === 'researcher' || role.id === 'viewer' ? 'ビルトイン' : 'カスタム'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{role.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        👤 {role.userCount}人
                      </span>
                      <button className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
                        編集
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permissions Matrix */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                権限マトリックス
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">権限</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">管理者</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">研究者</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">閲覧者</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">ユーザー管理</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                      <td className="px-4 py-3 text-center text-gray-400">-</td>
                      <td className="px-4 py-3 text-center text-gray-400">-</td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">実験作成</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                      <td className="px-4 py-3 text-center text-gray-400">-</td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">実験閲覧</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">監査ログ閲覧</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                      <td className="px-4 py-3 text-center text-gray-400">-</td>
                      <td className="px-4 py-3 text-center text-gray-400">-</td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">データエクスポート</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                      <td className="px-4 py-3 text-center text-gray-400">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {/* Compliance Score */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    21 CFR Part 11 コンプライアンス
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    FDA電子記録・電子署名規制への準拠状況
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">83%</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">準拠スコア</div>
                </div>
              </div>

              <div className="space-y-3">
                {mockComplianceResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        result.status === 'pass' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                        result.status === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {result.status === 'pass' ? '✓' : result.status === 'warning' ? '!' : '✗'}
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{result.requirement}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{result.message}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-sm rounded-full ${complianceStatusColors[result.status]}`}>
                      {result.status === 'pass' ? '合格' : result.status === 'warning' ? '要確認' : '不合格'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-4">
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                  コンプライアンスチェックを実行
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                  レポートをダウンロード
                </button>
              </div>
            </div>

            {/* Electronic Signatures */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                電子署名
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">署名済み文書</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">47</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">承認待ち</div>
                  <div className="text-2xl font-bold text-yellow-600">5</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">今月の署名</div>
                  <div className="text-2xl font-bold text-green-600">12</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">実験プロトコル v2.1</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">田中太郎により署名 - 2024/12/10</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                    署名済み
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">品質管理レポート</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">承認待ち - 鈴木花子</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                    承認待ち
                  </span>
                </div>
              </div>
            </div>

            {/* Training Records */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                トレーニング記録
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎓</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">GxPコンプライアンス基礎</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">完了: 38/40人</div>
                    </div>
                  </div>
                  <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎓</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">電子記録管理</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">完了: 35/40人</div>
                    </div>
                  </div>
                  <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '87.5%' }}></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎓</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">データインテグリティ</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">完了: 28/40人</div>
                    </div>
                  </div>
                  <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
