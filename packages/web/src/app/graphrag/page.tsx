'use client';

import { useState } from 'react';
import Link from 'next/link';

type Tab = 'documents' | 'graph' | 'search';

export default function GraphRAGPage() {
  const [activeTab, setActiveTab] = useState<Tab>('graph');

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
              <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
                GraphRAG
              </span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
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
              { id: 'documents', label: 'ドキュメント', icon: '📄' },
              { id: 'graph', label: 'ナレッジグラフ', icon: '🕸️' },
              { id: 'search', label: '検索 & Q&A', icon: '🔍' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
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
        {activeTab === 'documents' && <DocumentsPanel />}
        {activeTab === 'graph' && <GraphPanel />}
        {activeTab === 'search' && <SearchPanel />}
      </main>
    </div>
  );
}

// ドキュメントパネル
function DocumentsPanel() {
  const documents = [
    { id: 1, title: 'Attention Is All You Need', authors: 'Vaswani et al.', year: 2017, nodes: 45, status: 'indexed' },
    { id: 2, title: 'AlphaFold2: Highly accurate protein structure prediction', authors: 'Jumper et al.', year: 2021, nodes: 78, status: 'indexed' },
    { id: 3, title: 'Graph Neural Networks: A Review', authors: 'Wu et al.', year: 2020, nodes: 34, status: 'processing' },
    { id: 4, title: 'SMILES: A Chemical Language', authors: 'Weininger', year: 1988, nodes: 0, status: 'pending' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">ドキュメント管理</h2>
          <p className="text-sm text-gray-500">論文やノートからナレッジを抽出</p>
        </div>
        <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
          📥 論文を追加
        </button>
      </div>

      <div className="space-y-4">
        {documents.map((doc) => (
          <div key={doc.id} className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{doc.title}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {doc.authors} · {doc.year}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  doc.status === 'indexed'
                    ? 'bg-green-100 text-green-800'
                    : doc.status === 'processing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {doc.status === 'indexed' ? '✅ 抽出済み' : doc.status === 'processing' ? '🔄 処理中' : '⏳ 待機中'}
              </span>
            </div>
            {doc.nodes > 0 && (
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span>🔗 {doc.nodes} ノード抽出</span>
                <button className="text-purple-600 hover:text-purple-800">グラフで表示</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// グラフパネル
function GraphPanel() {
  const stats = [
    { label: 'ノード数', value: '156', icon: '⚪' },
    { label: 'エッジ数', value: '342', icon: '🔗' },
    { label: 'コミュニティ', value: '8', icon: '🎯' },
    { label: 'ドキュメント', value: '4', icon: '📄' },
  ];

  const nodes = [
    { id: 1, label: 'Transformer', type: 'concept', x: 200, y: 150 },
    { id: 2, label: 'Self-Attention', type: 'concept', x: 350, y: 100 },
    { id: 3, label: 'AlphaFold2', type: 'paper', x: 150, y: 280 },
    { id: 4, label: 'Protein Structure', type: 'entity', x: 300, y: 250 },
    { id: 5, label: 'GNN', type: 'concept', x: 450, y: 200 },
    { id: 6, label: 'Message Passing', type: 'concept', x: 500, y: 300 },
  ];

  const edges = [
    { from: 1, to: 2 },
    { from: 1, to: 5 },
    { from: 3, to: 4 },
    { from: 3, to: 1 },
    { from: 5, to: 6 },
    { from: 4, to: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* 統計 */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span>{stat.icon}</span>
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* グラフビューア */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">ナレッジグラフ</h2>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
              🔍 ズーム
            </button>
            <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
              📐 フィット
            </button>
            <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
              ⚙️ 設定
            </button>
          </div>
        </div>

        {/* SVG グラフ */}
        <div className="relative h-[500px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <svg width="100%" height="100%" viewBox="0 0 600 400">
            {/* エッジ */}
            {edges.map((edge, i) => {
              const fromNode = nodes.find((n) => n.id === edge.from);
              const toNode = nodes.find((n) => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              return (
                <line
                  key={i}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="#d1d5db"
                  strokeWidth="2"
                />
              );
            })}

            {/* ノード */}
            {nodes.map((node) => (
              <g key={node.id} className="cursor-pointer">
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="30"
                  fill={
                    node.type === 'concept'
                      ? '#ddd6fe'
                      : node.type === 'paper'
                        ? '#bfdbfe'
                        : '#bbf7d0'
                  }
                  stroke={
                    node.type === 'concept'
                      ? '#8b5cf6'
                      : node.type === 'paper'
                        ? '#3b82f6'
                        : '#22c55e'
                  }
                  strokeWidth="2"
                />
                <text
                  x={node.x}
                  y={node.y + 45}
                  textAnchor="middle"
                  className="fill-gray-700 text-xs font-medium"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>

          {/* 凡例 */}
          <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 p-3 shadow-sm">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-purple-200 border border-purple-500" />
                <span>概念</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-blue-200 border border-blue-500" />
                <span>論文</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-green-200 border border-green-500" />
                <span>エンティティ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 検索パネル
function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ question: string; answer: string; sources: string[] } | null>(null);

  const handleSearch = () => {
    if (!query.trim()) return;
    // モックの検索結果
    setResults({
      question: query,
      answer: 'Transformerアーキテクチャは、Self-Attention機構を中心とした深層学習モデルです。従来のRNNやLSTMと異なり、並列処理が可能で、長距離依存関係を効率的に学習できます。AlphaFold2やGPTシリーズなど、多くの最先端モデルの基盤となっています。',
      sources: ['Attention Is All You Need (2017)', 'AlphaFold2 Paper (2021)'],
    });
  };

  const suggestedQueries = [
    'Transformerとは何ですか？',
    'AlphaFold2の仕組みを説明してください',
    'GNNはどのような問題に適していますか？',
    '分子表現学習の手法を比較してください',
  ];

  return (
    <div className="space-y-6">
      {/* 検索バー */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">ナレッジ検索 & Q&A</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="質問を入力してください..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
          <button
            onClick={handleSearch}
            className="rounded-lg bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700"
          >
            🔍 検索
          </button>
        </div>

        {/* サジェスト */}
        <div className="mt-4">
          <p className="mb-2 text-sm text-gray-500">サンプル質問:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((q) => (
              <button
                key={q}
                onClick={() => setQuery(q)}
                className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 検索結果 */}
      {results && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-2 font-medium text-gray-900">Q: {results.question}</h3>
          <div className="mt-4 rounded-lg bg-purple-50 p-4">
            <p className="text-gray-700">{results.answer}</p>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-gray-500">参照元:</p>
            <div className="flex flex-wrap gap-2">
              {results.sources.map((source) => (
                <span
                  key={source}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600"
                >
                  📄 {source}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ナレッジギャップ */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">🔎 ナレッジギャップ検出</h2>
        <p className="mb-4 text-sm text-gray-500">
          現在のナレッジベースで回答できない領域を特定します
        </p>
        <div className="space-y-3">
          {[
            { topic: 'Diffusion Models for Drug Design', confidence: 0.3 },
            { topic: 'Geometric Deep Learning', confidence: 0.4 },
            { topic: 'Protein-Ligand Docking', confidence: 0.5 },
          ].map((gap) => (
            <div key={gap.topic} className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3">
              <span className="text-sm font-medium text-gray-700">{gap.topic}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-orange-500"
                    style={{ width: `${gap.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{Math.round(gap.confidence * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 text-sm text-purple-600 hover:text-purple-800">
          📚 関連論文を推薦
        </button>
      </div>
    </div>
  );
}
