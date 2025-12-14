'use client';

import { useState } from 'react';
import Link from 'next/link';

type Tab = 'datasets' | 'experiments' | 'knowledge' | 'members';

export default function MyLabPage() {
  const [activeTab, setActiveTab] = useState<Tab>('datasets');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
                🧬 LabFlow
              </Link>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                My Lab
              </span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/graphrag" className="text-gray-600 hover:text-gray-900">
                GraphRAG
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* ラボ情報 */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-blue-500 text-3xl">
              🔬
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Drug Discovery Lab</h1>
              <p className="text-gray-500">創薬研究のためのAI/ML実験環境</p>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-xs text-gray-500">データセット</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">8</p>
                <p className="text-xs text-gray-500">実験</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">5</p>
                <p className="text-xs text-gray-500">メンバー</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'datasets', label: 'データセット', icon: '📁' },
              { id: 'experiments', label: '実験', icon: '🧪' },
              { id: 'knowledge', label: 'ナレッジ', icon: '💡' },
              { id: 'members', label: 'メンバー', icon: '👥' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
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

      {/* コンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'datasets' && <DatasetsPanel />}
        {activeTab === 'experiments' && <ExperimentsPanel />}
        {activeTab === 'knowledge' && <KnowledgePanel />}
        {activeTab === 'members' && <MembersPanel />}
      </main>
    </div>
  );
}

// データセットパネル
function DatasetsPanel() {
  const datasets = [
    { id: 1, name: 'ZINC250K', type: 'molecules', records: '250,000', size: '1.2 GB', visibility: 'public', updated: '2日前' },
    { id: 2, name: 'ChEMBL Kinase Inhibitors', type: 'molecules', records: '15,000', size: '45 MB', visibility: 'lab', updated: '1週間前' },
    { id: 3, name: 'PDB Protein Structures', type: 'proteins', records: '1,500', size: '4.8 GB', visibility: 'public', updated: '3日前' },
    { id: 4, name: 'Internal Compound Library', type: 'molecules', records: '5,000', size: '120 MB', visibility: 'private', updated: '5時間前' },
  ];

  const typeIcons: Record<string, string> = {
    molecules: '🧪',
    proteins: '🔬',
    sequences: '🧬',
    images: '🖼️',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">データセット</h2>
          <p className="text-sm text-gray-500">研究データの管理・共有</p>
        </div>
        <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
          ➕ データセット作成
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {datasets.map((ds) => (
          <div key={ds.id} className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{typeIcons[ds.type] || '📁'}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{ds.name}</h3>
                  <p className="text-sm text-gray-500">{ds.type}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  ds.visibility === 'public'
                    ? 'bg-blue-100 text-blue-800'
                    : ds.visibility === 'lab'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {ds.visibility === 'public' ? '🌐 公開' : ds.visibility === 'lab' ? '🔬 ラボ内' : '🔒 非公開'}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span>📊 {ds.records} レコード</span>
              <span>💾 {ds.size}</span>
              <span>🕐 {ds.updated}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 実験パネル
function ExperimentsPanel() {
  const experiments = [
    { id: 1, name: 'GNN Hyperparameter Tuning', status: 'running', progress: 65, started: '3時間前', model: 'MPNN' },
    { id: 2, name: 'Molecular Property Prediction', status: 'completed', progress: 100, started: '昨日', model: 'SchNet' },
    { id: 3, name: 'Molecule Generation', status: 'draft', progress: 0, started: '-', model: 'VAE' },
    { id: 4, name: 'Protein Structure Prediction', status: 'failed', progress: 45, started: '2日前', model: 'ESMFold' },
  ];

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    running: { label: '実行中', color: 'bg-blue-100 text-blue-800', icon: '🔄' },
    completed: { label: '完了', color: 'bg-green-100 text-green-800', icon: '✅' },
    draft: { label: '下書き', color: 'bg-gray-100 text-gray-800', icon: '📝' },
    failed: { label: '失敗', color: 'bg-red-100 text-red-800', icon: '❌' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">実験</h2>
          <p className="text-sm text-gray-500">ML実験のトラッキング・管理</p>
        </div>
        <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
          🧪 新規実験
        </button>
      </div>

      <div className="space-y-4">
        {experiments.map((exp) => {
          const status = statusConfig[exp.status];
          return (
            <div key={exp.id} className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{exp.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    モデル: {exp.model} · 開始: {exp.started}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>
                  {status.icon} {status.label}
                </span>
              </div>
              {exp.status === 'running' && (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-500">進捗</span>
                    <span className="font-medium text-gray-900">{exp.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-blue-500 transition-all animate-pulse"
                      style={{ width: `${exp.progress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                  📊 メトリクス
                </button>
                <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                  📝 ログ
                </button>
                <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                  ⚙️ 設定
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ナレッジパネル
function KnowledgePanel() {
  const items = [
    { id: 1, title: 'SMILES前処理プロトコル', type: 'protocol', author: '田中', date: '1日前' },
    { id: 2, title: 'SchNetがMPNNより精度が低い原因', type: 'finding', author: '鈴木', date: '3日前' },
    { id: 3, title: 'ハイパーパラメータ最適化のコツ', type: 'insight', author: '山田', date: '1週間前' },
    { id: 4, title: 'データ拡張で精度向上の仮説', type: 'hypothesis', author: '佐藤', date: '2週間前' },
  ];

  const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
    protocol: { label: 'プロトコル', color: 'bg-blue-100 text-blue-800', icon: '📋' },
    finding: { label: '発見', color: 'bg-green-100 text-green-800', icon: '🔍' },
    insight: { label: 'インサイト', color: 'bg-purple-100 text-purple-800', icon: '💡' },
    hypothesis: { label: '仮説', color: 'bg-orange-100 text-orange-800', icon: '🧠' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">ナレッジベース</h2>
          <p className="text-sm text-gray-500">研究知見・プロトコル・仮説の共有</p>
        </div>
        <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
          ✍️ ナレッジ追加
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => {
          const type = typeConfig[item.type];
          return (
            <div key={item.id} className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition cursor-pointer">
              <div className="flex items-start justify-between">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${type.color}`}>
                  {type.icon} {type.label}
                </span>
                <span className="text-xs text-gray-400">{item.date}</span>
              </div>
              <h3 className="mt-3 font-medium text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-500">作成者: {item.author}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// メンバーパネル
function MembersPanel() {
  const members = [
    { id: 1, name: '田中 太郎', role: 'owner', email: 'tanaka@example.com', avatar: '👨‍🔬' },
    { id: 2, name: '鈴木 花子', role: 'admin', email: 'suzuki@example.com', avatar: '👩‍🔬' },
    { id: 3, name: '山田 一郎', role: 'member', email: 'yamada@example.com', avatar: '👨‍💻' },
    { id: 4, name: '佐藤 美咲', role: 'member', email: 'sato@example.com', avatar: '👩‍💻' },
    { id: 5, name: '高橋 健', role: 'viewer', email: 'takahashi@example.com', avatar: '🧑‍🎓' },
  ];

  const roleConfig: Record<string, { label: string; color: string }> = {
    owner: { label: 'オーナー', color: 'bg-purple-100 text-purple-800' },
    admin: { label: '管理者', color: 'bg-blue-100 text-blue-800' },
    member: { label: 'メンバー', color: 'bg-green-100 text-green-800' },
    viewer: { label: '閲覧者', color: 'bg-gray-100 text-gray-800' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">メンバー</h2>
          <p className="text-sm text-gray-500">ラボメンバーの管理</p>
        </div>
        <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
          👤 メンバー招待
        </button>
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                メンバー
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                役割
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                メール
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                アクション
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {members.map((member) => {
              const role = roleConfig[member.role];
              return (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{member.avatar}</span>
                      <span className="font-medium text-gray-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${role.color}`}>
                      {role.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                    {member.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600">⚙️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
