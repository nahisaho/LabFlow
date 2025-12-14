'use client';

import { useState } from 'react';
import Link from 'next/link';

type Tab = 'all' | 'templates' | 'running';

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all');

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
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                Workflows
              </span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/graphrag" className="text-gray-600 hover:text-gray-900">
                GraphRAG
              </Link>
              <Link href="/mylab" className="text-gray-600 hover:text-gray-900">
                My Lab
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* タブ */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'all', label: 'すべて', icon: '📋' },
              { id: 'templates', label: 'テンプレート', icon: '📦' },
              { id: 'running', label: '実行中', icon: '🔄' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
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

      {/* コンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'all' && <AllWorkflowsPanel />}
        {activeTab === 'templates' && <TemplatesPanel />}
        {activeTab === 'running' && <RunningPanel />}
      </main>
    </div>
  );
}

// すべてのワークフロー
function AllWorkflowsPanel() {
  const workflows = [
    { id: 1, name: '分子特性予測パイプライン', domain: '創薬', status: 'running', runs: 12, lastRun: '5分前' },
    { id: 2, name: 'タンパク質構造予測', domain: 'ゲノミクス', status: 'completed', runs: 8, lastRun: '1時間前' },
    { id: 3, name: '材料スクリーニング', domain: '材料科学', status: 'pending', runs: 3, lastRun: '2日前' },
    { id: 4, name: 'SMILES → 3D構造変換', domain: '創薬', status: 'completed', runs: 45, lastRun: '3時間前' },
    { id: 5, name: '気候データ前処理', domain: '気候科学', status: 'failed', runs: 2, lastRun: '1日前' },
  ];

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    running: { label: '実行中', color: 'bg-blue-100 text-blue-800', icon: '🔄' },
    completed: { label: '完了', color: 'bg-green-100 text-green-800', icon: '✅' },
    pending: { label: '待機中', color: 'bg-gray-100 text-gray-800', icon: '⏳' },
    failed: { label: '失敗', color: 'bg-red-100 text-red-800', icon: '❌' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">ワークフロー一覧</h2>
          <p className="text-sm text-gray-500">研究パイプラインの管理・実行</p>
        </div>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          ➕ 新規作成
        </button>
      </div>

      <div className="space-y-4">
        {workflows.map((wf) => {
          const status = statusConfig[wf.status];
          return (
            <div key={wf.id} className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{wf.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{wf.domain}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>
                  {status.icon} {status.label}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>🔄 {wf.runs} 回実行</span>
                  <span>🕐 最終: {wf.lastRun}</span>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                    📊 詳細
                  </button>
                  <button className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-100">
                    ▶️ 実行
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// テンプレート
function TemplatesPanel() {
  const templates = [
    { id: 1, name: '分子特性予測（初心者向け）', domain: '創薬', difficulty: 'beginner', steps: 5, icon: '💊' },
    { id: 2, name: 'タンパク質構造予測', domain: 'ゲノミクス', difficulty: 'intermediate', steps: 8, icon: '🧬' },
    { id: 3, name: 'GNN 分子エンコーディング', domain: '創薬', difficulty: 'advanced', steps: 12, icon: '🔬' },
    { id: 4, name: '気候予測モデル', domain: '気候科学', difficulty: 'intermediate', steps: 7, icon: '🌍' },
    { id: 5, name: '材料特性スクリーニング', domain: '材料科学', difficulty: 'beginner', steps: 4, icon: '⚗️' },
    { id: 6, name: 'AlphaFold2 推論パイプライン', domain: 'ゲノミクス', difficulty: 'advanced', steps: 10, icon: '🔮' },
  ];

  const difficultyConfig: Record<string, { label: string; color: string }> = {
    beginner: { label: '初心者', color: 'bg-green-100 text-green-800' },
    intermediate: { label: '中級', color: 'bg-yellow-100 text-yellow-800' },
    advanced: { label: '上級', color: 'bg-red-100 text-red-800' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">ワークフローテンプレート</h2>
        <p className="text-sm text-gray-500">すぐに使える研究パイプラインテンプレート</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((tmpl) => {
          const difficulty = difficultyConfig[tmpl.difficulty];
          return (
            <div key={tmpl.id} className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{tmpl.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{tmpl.name}</h3>
                  <p className="text-sm text-gray-500">{tmpl.domain}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${difficulty.color}`}>
                  {difficulty.label}
                </span>
                <span className="text-sm text-gray-500">{tmpl.steps} ステップ</span>
              </div>
              <button className="mt-4 w-full rounded-lg border border-blue-200 bg-blue-50 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100">
                このテンプレートを使用
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 実行中
function RunningPanel() {
  const runningWorkflows = [
    { id: 1, name: '分子特性予測パイプライン', progress: 65, eta: '約10分', currentStep: 'GNN推論' },
    { id: 2, name: 'データ前処理バッチ', progress: 30, eta: '約25分', currentStep: 'SMILES正規化' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">実行中のワークフロー</h2>
        <p className="text-sm text-gray-500">リアルタイムの実行状況</p>
      </div>

      {runningWorkflows.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">🎉</span>
          <p className="mt-4 text-gray-500">現在実行中のワークフローはありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {runningWorkflows.map((wf) => (
            <div key={wf.id} className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{wf.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    現在のステップ: <span className="font-medium">{wf.currentStep}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{wf.progress}%</p>
                  <p className="text-sm text-gray-500">残り {wf.eta}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                    style={{ width: `${wf.progress}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                  📊 ログ表示
                </button>
                <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                  ⏹️ 停止
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
