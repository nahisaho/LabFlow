'use client';

import { useState } from 'react';
import Link from 'next/link';

type Tab = 'setup' | 'running' | 'results' | 'insights';

interface Parameter {
  name: string;
  type: 'continuous' | 'integer' | 'categorical';
  min?: number;
  max?: number;
  choices?: string[];
  value?: number | string;
}

interface Trial {
  id: number;
  parameters: Record<string, number | string>;
  objective: number;
  status: 'completed' | 'running' | 'pending';
  duration?: string;
}

export default function OptimizationPage() {
  const [activeTab, setActiveTab] = useState<Tab>('setup');
  const [isRunning, setIsRunning] = useState(false);

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
              <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
                実験計画最適化
              </span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/hypothesis" className="text-gray-600 hover:text-gray-900">
                仮説生成
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
              { id: 'setup', label: '設定', icon: '⚙️' },
              { id: 'running', label: '実行状況', icon: '🔄' },
              { id: 'results', label: '結果', icon: '📊' },
              { id: 'insights', label: 'インサイト', icon: '💡' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
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
        {activeTab === 'setup' && <SetupPanel onStart={() => { setIsRunning(true); setActiveTab('running'); }} />}
        {activeTab === 'running' && <RunningPanel isRunning={isRunning} />}
        {activeTab === 'results' && <ResultsPanel />}
        {activeTab === 'insights' && <InsightsPanel />}
      </main>
    </div>
  );
}

// 設定パネル
function SetupPanel({ onStart }: { onStart: () => void }) {
  const [parameters, setParameters] = useState<Parameter[]>([
    { name: 'learning_rate', type: 'continuous', min: 0.0001, max: 0.1 },
    { name: 'batch_size', type: 'integer', min: 16, max: 256 },
    { name: 'optimizer', type: 'categorical', choices: ['Adam', 'SGD', 'AdamW'] },
  ]);

  const [objective, setObjective] = useState({ name: 'validation_accuracy', direction: 'maximize' });
  const [settings, setSettings] = useState({
    acquisitionFunction: 'expected_improvement',
    initialSamples: 5,
    maxIterations: 30,
    explorationWeight: 0.5,
  });

  return (
    <div className="space-y-8">
      {/* 概要 */}
      <div className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
        <h2 className="text-xl font-bold">🎯 ベイズ最適化で実験を効率化</h2>
        <p className="mt-2 text-orange-100">
          機械学習モデルのハイパーパラメータや実験条件を、少ない試行回数で最適化します。
          獲得関数に基づいて次に試すべきパラメータを提案します。
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* パラメータ空間 */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">📐 パラメータ空間</h3>
          <div className="space-y-4">
            {parameters.map((param, index) => (
              <div key={param.name} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{param.name}</span>
                  <span className={`rounded-full px-2 py-1 text-xs ${
                    param.type === 'continuous' ? 'bg-blue-100 text-blue-800' :
                    param.type === 'integer' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {param.type}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {param.type === 'categorical' ? (
                    <span>選択肢: {param.choices?.join(', ')}</span>
                  ) : (
                    <span>範囲: {param.min} ~ {param.max}</span>
                  )}
                </div>
              </div>
            ))}
            <button className="w-full rounded-lg border-2 border-dashed border-gray-300 p-4 text-gray-500 hover:border-orange-400 hover:text-orange-600">
              ➕ パラメータを追加
            </button>
          </div>
        </div>

        {/* 目的関数 & 設定 */}
        <div className="space-y-6">
          {/* 目的関数 */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">🎯 目的関数</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">メトリクス名</label>
                <input
                  type="text"
                  value={objective.name}
                  onChange={(e) => setObjective({ ...objective, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">方向</label>
                <div className="mt-2 flex gap-4">
                  {['maximize', 'minimize'].map((dir) => (
                    <button
                      key={dir}
                      onClick={() => setObjective({ ...objective, direction: dir })}
                      className={`rounded-lg px-4 py-2 text-sm font-medium ${
                        objective.direction === dir
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {dir === 'maximize' ? '📈 最大化' : '📉 最小化'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 最適化設定 */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">⚙️ 最適化設定</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">獲得関数</label>
                <select
                  value={settings.acquisitionFunction}
                  onChange={(e) => setSettings({ ...settings, acquisitionFunction: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                >
                  <option value="expected_improvement">Expected Improvement (EI)</option>
                  <option value="probability_improvement">Probability of Improvement (PI)</option>
                  <option value="upper_confidence_bound">Upper Confidence Bound (UCB)</option>
                  <option value="thompson_sampling">Thompson Sampling</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">初期サンプル数</label>
                  <input
                    type="number"
                    value={settings.initialSamples}
                    onChange={(e) => setSettings({ ...settings, initialSamples: parseInt(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">最大イテレーション</label>
                  <input
                    type="number"
                    value={settings.maxIterations}
                    onChange={(e) => setSettings({ ...settings, maxIterations: parseInt(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  探索/活用バランス: {settings.explorationWeight.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.explorationWeight}
                  onChange={(e) => setSettings({ ...settings, explorationWeight: parseFloat(e.target.value) })}
                  className="mt-2 w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>活用重視</span>
                  <span>探索重視</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 開始ボタン */}
      <div className="flex justify-center">
        <button
          onClick={onStart}
          className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg font-bold text-white shadow-lg hover:from-orange-600 hover:to-amber-600"
        >
          🚀 最適化を開始
        </button>
      </div>
    </div>
  );
}

// 実行状況パネル
function RunningPanel({ isRunning }: { isRunning: boolean }) {
  const [trials] = useState<Trial[]>([
    { id: 1, parameters: { learning_rate: 0.001, batch_size: 32, optimizer: 'Adam' }, objective: 0.82, status: 'completed', duration: '2分' },
    { id: 2, parameters: { learning_rate: 0.01, batch_size: 64, optimizer: 'SGD' }, objective: 0.78, status: 'completed', duration: '3分' },
    { id: 3, parameters: { learning_rate: 0.005, batch_size: 128, optimizer: 'AdamW' }, objective: 0.85, status: 'completed', duration: '4分' },
    { id: 4, parameters: { learning_rate: 0.003, batch_size: 64, optimizer: 'Adam' }, objective: 0.87, status: 'completed', duration: '3分' },
    { id: 5, parameters: { learning_rate: 0.002, batch_size: 96, optimizer: 'AdamW' }, objective: 0, status: 'running' },
  ]);

  const progress = (trials.filter(t => t.status === 'completed').length / 30) * 100;
  const bestTrial = trials.filter(t => t.status === 'completed').reduce((best, t) => t.objective > best.objective ? t : best, trials[0]);

  return (
    <div className="space-y-6">
      {/* ステータスカード */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <span>🔄</span>
            <span className="text-sm">進捗</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{Math.round(progress)}%</p>
          <p className="text-sm text-gray-500">{trials.filter(t => t.status === 'completed').length} / 30 試行</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <span>🏆</span>
            <span className="text-sm">現在の最良値</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-green-600">{bestTrial.objective.toFixed(4)}</p>
          <p className="text-sm text-gray-500">試行 #{bestTrial.id}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <span>📈</span>
            <span className="text-sm">改善率</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-blue-600">+6.1%</p>
          <p className="text-sm text-gray-500">初期値から</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <span>⏱️</span>
            <span className="text-sm">推定残り時間</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">~1時間</p>
          <p className="text-sm text-gray-500">25試行残り</p>
        </div>
      </div>

      {/* 進捗バー */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-2 flex justify-between">
          <span className="font-medium text-gray-900">最適化進捗</span>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 次の提案 */}
      <div className="rounded-xl bg-orange-50 border border-orange-200 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <span className="animate-pulse">💡</span>
          次に試すべきパラメータ
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-white p-4">
            <span className="text-sm text-gray-500">learning_rate</span>
            <p className="text-xl font-bold text-gray-900">0.0025</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <span className="text-sm text-gray-500">batch_size</span>
            <p className="text-xl font-bold text-gray-900">80</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <span className="text-sm text-gray-500">optimizer</span>
            <p className="text-xl font-bold text-gray-900">AdamW</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          📊 期待改善度 (EI) に基づき、改善可能性の高い点を提案しています。
          予測される目的関数値: <span className="font-bold">0.89</span> (±0.02)
        </p>
      </div>

      {/* 試行履歴 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">📋 試行履歴</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">learning_rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">batch_size</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">optimizer</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">目的関数</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">状態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trials.map((trial) => (
                <tr key={trial.id} className={trial.id === bestTrial.id ? 'bg-green-50' : ''}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {trial.id === bestTrial.id && <span className="mr-1">🏆</span>}
                    {trial.id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {(trial.parameters.learning_rate as number).toFixed(4)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {trial.parameters.batch_size}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {trial.parameters.optimizer}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {trial.status === 'completed' ? trial.objective.toFixed(4) : '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      trial.status === 'completed' ? 'bg-green-100 text-green-800' :
                      trial.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {trial.status === 'completed' ? '✅ 完了' : trial.status === 'running' ? '🔄 実行中' : '⏳ 待機'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 結果パネル
function ResultsPanel() {
  const bestResult = {
    parameters: { learning_rate: 0.0028, batch_size: 72, optimizer: 'AdamW' },
    objective: 0.912,
    trial: 24,
  };

  return (
    <div className="space-y-6">
      {/* 最良結果 */}
      <div className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🏆</span>
          <div>
            <h2 className="text-2xl font-bold">最適化完了!</h2>
            <p className="text-green-100">30回の試行で最良パラメータを発見</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white/20 p-4">
            <span className="text-sm text-green-100">learning_rate</span>
            <p className="text-2xl font-bold">{bestResult.parameters.learning_rate}</p>
          </div>
          <div className="rounded-lg bg-white/20 p-4">
            <span className="text-sm text-green-100">batch_size</span>
            <p className="text-2xl font-bold">{bestResult.parameters.batch_size}</p>
          </div>
          <div className="rounded-lg bg-white/20 p-4">
            <span className="text-sm text-green-100">optimizer</span>
            <p className="text-2xl font-bold">{bestResult.parameters.optimizer}</p>
          </div>
          <div className="rounded-lg bg-white/20 p-4">
            <span className="text-sm text-green-100">最良スコア</span>
            <p className="text-2xl font-bold">{bestResult.objective}</p>
          </div>
        </div>
      </div>

      {/* 収束グラフ (モック) */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">📈 収束グラフ</h3>
        <div className="h-64 flex items-end justify-around gap-1 rounded-lg bg-gray-50 p-4">
          {[0.82, 0.78, 0.85, 0.87, 0.86, 0.88, 0.87, 0.89, 0.88, 0.90, 0.89, 0.91, 0.90, 0.912, 0.912].map((val, i) => (
            <div
              key={i}
              className="w-full bg-gradient-to-t from-orange-500 to-amber-400 rounded-t"
              style={{ height: `${(val - 0.7) * 500}%` }}
              title={`試行 ${i + 1}: ${val}`}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>試行 1</span>
          <span>試行 15</span>
        </div>
      </div>

      {/* アクション */}
      <div className="flex gap-4">
        <button className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700">
          📥 結果をエクスポート
        </button>
        <button className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50">
          🔄 新しい最適化を開始
        </button>
      </div>
    </div>
  );
}

// インサイトパネル
function InsightsPanel() {
  const parameterImportance = [
    { name: 'learning_rate', importance: 0.85 },
    { name: 'optimizer', importance: 0.62 },
    { name: 'batch_size', importance: 0.38 },
  ];

  const recommendations = [
    'learning_rate は最も重要なパラメータです。0.002〜0.004の範囲が最適です。',
    'AdamW オプティマイザが他の選択肢より一貫して良い結果を示しています。',
    'batch_size の影響は比較的小さく、64〜96の範囲で安定しています。',
    '収束は早く、約15試行で最良値の95%に到達しました。',
  ];

  return (
    <div className="space-y-6">
      {/* パラメータ重要度 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">📊 パラメータ重要度</h3>
        <div className="space-y-4">
          {parameterImportance.map((param) => (
            <div key={param.name}>
              <div className="mb-1 flex justify-between">
                <span className="font-medium text-gray-700">{param.name}</span>
                <span className="text-sm text-gray-500">{Math.round(param.importance * 100)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                  style={{ width: `${param.importance * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 推奨事項 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">💡 推奨事項</h3>
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div key={i} className="flex gap-3 rounded-lg bg-gray-50 p-4">
              <span className="text-orange-500">💡</span>
              <p className="text-gray-700">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* パラメータ相互作用 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">🔗 パラメータ相互作用</h3>
        <p className="text-gray-600">
          learning_rate と optimizer の間に強い相互作用が検出されました。
          AdamW を使用する場合、より低い learning_rate (0.001〜0.003) が効果的です。
        </p>
      </div>
    </div>
  );
}
