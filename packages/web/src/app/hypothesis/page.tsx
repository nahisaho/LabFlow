'use client';

import { useState } from 'react';
import Link from 'next/link';

type Tab = 'generate' | 'list' | 'gaps';

interface Hypothesis {
  id: string;
  statement: string;
  statementJa: string;
  type: 'mechanistic' | 'correlational' | 'predictive' | 'causal';
  confidence: 'high' | 'medium' | 'low' | 'speculative';
  noveltyScore: number;
  testabilityScore: number;
  impactScore: number;
  supportingEvidence: number;
  contradictingEvidence: number;
  status: 'generated' | 'under_review' | 'accepted' | 'rejected';
}

interface KnowledgeGap {
  id: string;
  topic: string;
  description: string;
  severity: number;
  relatedPapers: number;
}

export default function HypothesisPage() {
  const [activeTab, setActiveTab] = useState<Tab>('generate');

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
              <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-800">
                仮説生成支援
              </span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/graphrag" className="text-gray-600 hover:text-gray-900">
                GraphRAG
              </Link>
              <Link href="/optimization" className="text-gray-600 hover:text-gray-900">
                最適化
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
              { id: 'generate', label: '仮説生成', icon: '✨' },
              { id: 'list', label: '仮説一覧', icon: '📋' },
              { id: 'gaps', label: 'ナレッジギャップ', icon: '🔍' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-600'
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
        {activeTab === 'generate' && <GeneratePanel />}
        {activeTab === 'list' && <HypothesisListPanel />}
        {activeTab === 'gaps' && <GapsPanel />}
      </main>
    </div>
  );
}

// 生成パネル
function GeneratePanel() {
  const [topic, setTopic] = useState('');
  const [domain, setDomain] = useState('drug_discovery');
  const [types, setTypes] = useState(['mechanistic', 'predictive']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHypotheses, setGeneratedHypotheses] = useState<Hypothesis[]>([]);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Mock generation
    setTimeout(() => {
      setGeneratedHypotheses([
        {
          id: '1',
          statement: 'GNN-based molecular representations capture structural features that correlate with binding affinity',
          statementJa: 'GNNベースの分子表現は、結合親和性と相関する構造特徴を捉える',
          type: 'correlational',
          confidence: 'high',
          noveltyScore: 0.72,
          testabilityScore: 0.85,
          impactScore: 0.78,
          supportingEvidence: 5,
          contradictingEvidence: 1,
          status: 'generated',
        },
        {
          id: '2',
          statement: 'Attention mechanisms in Transformers identify key molecular substructures for property prediction',
          statementJa: 'Transformerのアテンション機構は、特性予測に重要な分子部分構造を特定する',
          type: 'mechanistic',
          confidence: 'medium',
          noveltyScore: 0.65,
          testabilityScore: 0.78,
          impactScore: 0.82,
          supportingEvidence: 3,
          contradictingEvidence: 0,
          status: 'generated',
        },
        {
          id: '3',
          statement: 'Pre-trained molecular language models will improve prediction accuracy on small datasets',
          statementJa: '事前学習済み分子言語モデルは、小規模データセットでの予測精度を向上させる',
          type: 'predictive',
          confidence: 'medium',
          noveltyScore: 0.58,
          testabilityScore: 0.92,
          impactScore: 0.75,
          supportingEvidence: 4,
          contradictingEvidence: 2,
          status: 'generated',
        },
      ]);
      setIsGenerating(false);
    }, 2000);
  };

  const typeOptions = [
    { id: 'mechanistic', label: '機構的', description: '「なぜ/どのように」を説明' },
    { id: 'correlational', label: '相関的', description: '関連性を主張' },
    { id: 'predictive', label: '予測的', description: '将来の結果を予測' },
    { id: 'causal', label: '因果的', description: '原因と結果を主張' },
  ];

  return (
    <div className="space-y-8">
      {/* 概要 */}
      <div className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 p-6 text-white">
        <h2 className="text-xl font-bold">🧠 GraphRAGベース仮説生成</h2>
        <p className="mt-2 text-violet-100">
          ナレッジグラフから研究仮説を自動生成します。
          エビデンスに基づいた仮説を提案し、新しい研究の方向性を発見しましょう。
        </p>
      </div>

      {/* 入力フォーム */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">📝 研究トピック</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">研究テーマ・質問</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例: GNNを用いた分子特性予測の精度向上..."
              className="mt-1 h-24 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">研究ドメイン</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-violet-500 focus:outline-none"
            >
              <option value="drug_discovery">💊 創薬</option>
              <option value="materials">🔬 材料科学</option>
              <option value="climate">🌍 気候科学</option>
              <option value="genomics">🧬 ゲノミクス</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">仮説タイプ</label>
            <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
              {typeOptions.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    if (types.includes(type.id)) {
                      setTypes(types.filter((t) => t !== type.id));
                    } else {
                      setTypes([...types, type.id]);
                    }
                  }}
                  className={`rounded-lg border p-3 text-left transition ${
                    types.includes(type.id)
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{type.label}</p>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !topic}
          className="mt-6 w-full rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-3 font-medium text-white hover:from-violet-600 hover:to-purple-600 disabled:opacity-50"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">🔄</span> 生成中...
            </span>
          ) : (
            '✨ 仮説を生成'
          )}
        </button>
      </div>

      {/* 生成結果 */}
      {generatedHypotheses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">📊 生成された仮説</h3>
          {generatedHypotheses.map((h) => (
            <HypothesisCard key={h.id} hypothesis={h} />
          ))}
        </div>
      )}
    </div>
  );
}

// 仮説カード
function HypothesisCard({ hypothesis }: { hypothesis: Hypothesis }) {
  const typeConfig = {
    mechanistic: { label: '機構的', color: 'bg-blue-100 text-blue-800', icon: '⚙️' },
    correlational: { label: '相関的', color: 'bg-green-100 text-green-800', icon: '🔗' },
    predictive: { label: '予測的', color: 'bg-orange-100 text-orange-800', icon: '🔮' },
    causal: { label: '因果的', color: 'bg-red-100 text-red-800', icon: '➡️' },
  };

  const confidenceConfig = {
    high: { label: '高', color: 'text-green-600' },
    medium: { label: '中', color: 'text-yellow-600' },
    low: { label: '低', color: 'text-orange-600' },
    speculative: { label: '推測的', color: 'text-red-600' },
  };

  const type = typeConfig[hypothesis.type];
  const confidence = confidenceConfig[hypothesis.confidence];

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${type.color}`}>
            {type.icon} {type.label}
          </span>
          <span className={`text-sm font-medium ${confidence.color}`}>
            信頼度: {confidence.label}
          </span>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-green-200 px-3 py-1 text-sm text-green-600 hover:bg-green-50">
            ✅ 採用
          </button>
          <button className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">
            📝 評価
          </button>
        </div>
      </div>

      <p className="mt-4 text-lg font-medium text-gray-900">{hypothesis.statementJa}</p>
      <p className="mt-1 text-sm text-gray-500 italic">{hypothesis.statement}</p>

      {/* スコア */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">新規性</span>
            <span className="font-medium">{Math.round(hypothesis.noveltyScore * 100)}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full bg-violet-500" style={{ width: `${hypothesis.noveltyScore * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">検証可能性</span>
            <span className="font-medium">{Math.round(hypothesis.testabilityScore * 100)}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full bg-blue-500" style={{ width: `${hypothesis.testabilityScore * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">インパクト</span>
            <span className="font-medium">{Math.round(hypothesis.impactScore * 100)}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full bg-green-500" style={{ width: `${hypothesis.impactScore * 100}%` }} />
          </div>
        </div>
      </div>

      {/* エビデンス */}
      <div className="mt-4 flex gap-4 text-sm">
        <span className="text-green-600">
          📄 支持エビデンス: {hypothesis.supportingEvidence}件
        </span>
        <span className="text-red-600">
          ⚠️ 反証エビデンス: {hypothesis.contradictingEvidence}件
        </span>
      </div>
    </div>
  );
}

// 仮説一覧パネル
function HypothesisListPanel() {
  const [filter, setFilter] = useState('all');

  const hypotheses: Hypothesis[] = [
    {
      id: '1',
      statement: 'GNN-based molecular representations capture structural features',
      statementJa: 'GNNベースの分子表現は構造特徴を捉える',
      type: 'correlational',
      confidence: 'high',
      noveltyScore: 0.72,
      testabilityScore: 0.85,
      impactScore: 0.78,
      supportingEvidence: 5,
      contradictingEvidence: 1,
      status: 'accepted',
    },
    {
      id: '2',
      statement: 'Attention mechanisms identify key molecular substructures',
      statementJa: 'アテンション機構は重要な分子部分構造を特定する',
      type: 'mechanistic',
      confidence: 'medium',
      noveltyScore: 0.65,
      testabilityScore: 0.78,
      impactScore: 0.82,
      supportingEvidence: 3,
      contradictingEvidence: 0,
      status: 'under_review',
    },
    {
      id: '3',
      statement: 'Pre-trained models improve prediction on small datasets',
      statementJa: '事前学習済みモデルは小規模データセットでの予測を改善する',
      type: 'predictive',
      confidence: 'medium',
      noveltyScore: 0.58,
      testabilityScore: 0.92,
      impactScore: 0.75,
      supportingEvidence: 4,
      contradictingEvidence: 2,
      status: 'generated',
    },
  ];

  const statusConfig: Record<string, { label: string; color: string }> = {
    generated: { label: '生成済み', color: 'bg-gray-100 text-gray-800' },
    under_review: { label: '評価中', color: 'bg-yellow-100 text-yellow-800' },
    accepted: { label: '採用', color: 'bg-green-100 text-green-800' },
    rejected: { label: '却下', color: 'bg-red-100 text-red-800' },
  };

  return (
    <div className="space-y-6">
      {/* フィルター */}
      <div className="flex gap-2">
        {['all', 'generated', 'under_review', 'accepted', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              filter === f
                ? 'bg-violet-100 text-violet-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'すべて' : statusConfig[f].label}
          </button>
        ))}
      </div>

      {/* 仮説リスト */}
      <div className="space-y-4">
        {hypotheses
          .filter((h) => filter === 'all' || h.status === filter)
          .map((h) => (
            <div key={h.id} className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{h.statementJa}</p>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusConfig[h.status].color}`}>
                  {statusConfig[h.status].label}
                </span>
              </div>
              <div className="mt-4 flex gap-4 text-sm text-gray-500">
                <span>新規性: {Math.round(h.noveltyScore * 100)}%</span>
                <span>検証可能性: {Math.round(h.testabilityScore * 100)}%</span>
                <span>インパクト: {Math.round(h.impactScore * 100)}%</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ナレッジギャップパネル
function GapsPanel() {
  const gaps: KnowledgeGap[] = [
    {
      id: '1',
      topic: 'Diffusion Models for Molecular Generation',
      description: '分子生成における拡散モデルの適用に関する研究は限定的',
      severity: 0.8,
      relatedPapers: 3,
    },
    {
      id: '2',
      topic: 'Geometric Deep Learning for Proteins',
      description: 'タンパク質の幾何学的深層学習は発展途上',
      severity: 0.65,
      relatedPapers: 7,
    },
    {
      id: '3',
      topic: 'Multi-task Learning in Drug Discovery',
      description: '創薬におけるマルチタスク学習の効果は未検証の領域が多い',
      severity: 0.5,
      relatedPapers: 12,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-violet-50 border border-violet-200 p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          🔍 ナレッジギャップとは？
        </h3>
        <p className="mt-2 text-gray-600">
          現在のナレッジベースで十分にカバーされていない研究領域を特定します。
          これらのギャップは新しい研究の方向性を示す可能性があります。
        </p>
      </div>

      <div className="space-y-4">
        {gaps.map((gap) => (
          <div key={gap.id} className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{gap.topic}</h4>
                <p className="mt-1 text-sm text-gray-500">{gap.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  gap.severity > 0.7 ? 'bg-red-100 text-red-800' :
                  gap.severity > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  重要度: {Math.round(gap.severity * 100)}%
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                📄 関連論文: {gap.relatedPapers}件
              </span>
              <div className="flex gap-2">
                <button className="rounded-lg border border-violet-200 px-3 py-1.5 text-sm text-violet-600 hover:bg-violet-50">
                  ✨ 仮説を生成
                </button>
                <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                  📚 論文を推薦
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
