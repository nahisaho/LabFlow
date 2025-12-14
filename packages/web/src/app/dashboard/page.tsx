'use client';

import { useState } from 'react';
import Link from 'next/link';

// ダッシュボードのメインページ
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'data' | 'knowledge'>('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                🧬 LabFlow
              </Link>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                Dashboard
              </span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/graphrag" className="text-gray-600 hover:text-gray-900">
                GraphRAG
              </Link>
              <Link href="/mylab" className="text-gray-600 hover:text-gray-900">
                My Lab
              </Link>
              <Link href="/workflows" className="text-gray-600 hover:text-gray-900">
                Workflows
              </Link>
              <Link href="/optimization" className="text-gray-600 hover:text-gray-900">
                最適化
              </Link>
              <Link href="/hypothesis" className="text-gray-600 hover:text-gray-900">
                仮説生成
              </Link>
              <Link href="/climate" className="text-gray-600 hover:text-gray-900">
                気候科学
              </Link>
              <Link href="/genomics" className="text-gray-600 hover:text-gray-900">
                ゲノミクス
              </Link>
              <Link href="/enterprise" className="text-gray-600 hover:text-gray-900">
                Enterprise
              </Link>
              <Link href="/learning" className="text-gray-600 hover:text-gray-900">
                学習
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: '概要', icon: '📊' },
              { id: 'workflows', label: 'ワークフロー', icon: '🔄' },
              { id: 'data', label: 'データ', icon: '📁' },
              { id: 'knowledge', label: 'ナレッジ', icon: '🧠' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'overview' && <OverviewPanel />}
        {activeTab === 'workflows' && <WorkflowsPanel />}
        {activeTab === 'data' && <DataPanel />}
        {activeTab === 'knowledge' && <KnowledgePanel />}
      </main>
    </div>
  );
}

// 概要パネル
function OverviewPanel() {
  const stats = [
    { label: 'アクティブワークフロー', value: '3', change: '+2', icon: '🔄' },
    { label: 'データセット', value: '12', change: '+5', icon: '📁' },
    { label: 'ナレッジノード', value: '156', change: '+23', icon: '🧠' },
    { label: '実験', value: '8', change: '+1', icon: '🧪' },
  ];

  const recentActivities = [
    { id: 1, action: 'ワークフロー実行完了', target: '分子特性予測', time: '5分前', status: 'success' },
    { id: 2, action: 'データセット追加', target: 'ZINC250K サブセット', time: '1時間前', status: 'info' },
    { id: 3, action: '論文インポート', target: 'AlphaFold2 Paper', time: '2時間前', status: 'info' },
    { id: 4, action: '実験開始', target: 'GNN ハイパーパラメータ最適化', time: '3時間前', status: 'running' },
  ];

  const quickActions = [
    { label: '新規ワークフロー', href: '/workflows/new', icon: '➕' },
    { label: 'データインポート', href: '/mylab/datasets/import', icon: '📥' },
    { label: '論文追加', href: '/graphrag/add', icon: '📄' },
    { label: '実験作成', href: '/mylab/experiments/new', icon: '🧪' },
  ];

  return (
    <div className="space-y-8">
      {/* 統計カード */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-sm font-medium text-green-600">{stat.change}</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 最近のアクティビティ */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">最近のアクティビティ</h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4">
                <div
                  className={`h-2 w-2 rounded-full ${
                    activity.status === 'success'
                      ? 'bg-green-500'
                      : activity.status === 'running'
                        ? 'bg-blue-500 animate-pulse'
                        : 'bg-gray-400'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.target}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* クイックアクション */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">クイックアクション</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50"
              >
                <span className="text-xl">{action.icon}</span>
                <span className="font-medium text-gray-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 研究ドメイン */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">研究ドメイン</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { name: '創薬', icon: '💊', description: '分子生成・特性予測', color: 'bg-purple-50 border-purple-200' },
            { name: '材料科学', icon: '🔬', description: '材料設計・特性予測', color: 'bg-blue-50 border-blue-200' },
            { name: '気候科学', icon: '🌍', description: '気候モデリング・予測', color: 'bg-green-50 border-green-200' },
            { name: 'ゲノミクス', icon: '🧬', description: '配列解析・タンパク質構造', color: 'bg-red-50 border-red-200' },
          ].map((domain) => (
            <div
              key={domain.name}
              className={`rounded-lg border p-4 ${domain.color}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{domain.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{domain.name}</p>
                  <p className="text-sm text-gray-500">{domain.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ワークフローパネル
function WorkflowsPanel() {
  const workflows = [
    { id: 1, name: '分子特性予測パイプライン', status: 'running', progress: 65, domain: '創薬' },
    { id: 2, name: 'タンパク質構造予測', status: 'completed', progress: 100, domain: 'ゲノミクス' },
    { id: 3, name: '材料スクリーニング', status: 'pending', progress: 0, domain: '材料科学' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">ワークフロー一覧</h2>
        <Link
          href="/workflows/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          新規作成
        </Link>
      </div>

      <div className="space-y-4">
        {workflows.map((wf) => (
          <div key={wf.id} className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{wf.name}</h3>
                <p className="text-sm text-gray-500">{wf.domain}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  wf.status === 'running'
                    ? 'bg-blue-100 text-blue-800'
                    : wf.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {wf.status === 'running' ? '実行中' : wf.status === 'completed' ? '完了' : '待機中'}
              </span>
            </div>
            {wf.status === 'running' && (
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-500">進捗</span>
                  <span className="font-medium text-gray-900">{wf.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${wf.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// データパネル
function DataPanel() {
  const datasets = [
    { id: 1, name: 'ZINC250K', type: 'molecules', records: '250,000', size: '1.2 GB' },
    { id: 2, name: 'ChEMBL Subset', type: 'molecules', records: '50,000', size: '320 MB' },
    { id: 3, name: 'PDB Structures', type: 'proteins', records: '1,500', size: '4.8 GB' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">データセット</h2>
        <Link
          href="/mylab/datasets/import"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          インポート
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                名前
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                タイプ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                レコード数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                サイズ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {datasets.map((ds) => (
              <tr key={ds.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                  {ds.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500">{ds.type}</td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500">{ds.records}</td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500">{ds.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ナレッジパネル
function KnowledgePanel() {
  const knowledgeItems = [
    { id: 1, title: 'AlphaFold2 アーキテクチャ', type: 'paper', connections: 12 },
    { id: 2, title: 'GNN による分子表現', type: 'insight', connections: 8 },
    { id: 3, title: 'SMILES エンコーディング手法', type: 'protocol', connections: 15 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">ナレッジベース</h2>
        <Link
          href="/graphrag"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          GraphRAG へ
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {knowledgeItems.map((item) => (
          <div key={item.id} className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`rounded px-2 py-1 text-xs font-medium ${
                  item.type === 'paper'
                    ? 'bg-blue-100 text-blue-800'
                    : item.type === 'insight'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                }`}
              >
                {item.type === 'paper' ? '論文' : item.type === 'insight' ? 'インサイト' : 'プロトコル'}
              </span>
            </div>
            <h3 className="font-medium text-gray-900">{item.title}</h3>
            <p className="mt-2 text-sm text-gray-500">{item.connections} 件の関連ノード</p>
          </div>
        ))}
      </div>
    </div>
  );
}
