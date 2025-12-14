'use client';

import { useState } from 'react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

type Tab = 'weather' | 'projection' | 'extreme' | 'impact';

interface Region {
  name: string;
  bounds: { north: number; south: number; east: number; west: number };
}

// ============================================================================
// Climate Page Component
// ============================================================================

export default function ClimatePage() {
  const [activeTab, setActiveTab] = useState<Tab>('weather');
  const [isRunning, setIsRunning] = useState(false);

  // Weather prediction state
  const [selectedRegion, setSelectedRegion] = useState('japan');
  const [forecastHours, setForecastHours] = useState(72);
  const [selectedVariables, setSelectedVariables] = useState<string[]>(['temperature', 'precipitation']);

  // Climate projection state
  const [scenario, setScenario] = useState('ssp2-4.5');
  const [projectionYear, setProjectionYear] = useState(2050);

  // Results state
  const [weatherResult, setWeatherResult] = useState<any>(null);
  const [projectionResult, setProjectionResult] = useState<any>(null);
  const [extremeResult, setExtremeResult] = useState<any>(null);

  const regions: Record<string, Region> = {
    japan: { name: '日本全域', bounds: { north: 46, south: 24, east: 146, west: 122 } },
    kanto: { name: '関東地方', bounds: { north: 37, south: 35, east: 141, west: 138 } },
    kansai: { name: '関西地方', bounds: { north: 36, south: 34, east: 136, west: 134 } },
    global: { name: 'グローバル', bounds: { north: 90, south: -90, east: 180, west: -180 } },
  };

  const climateVariables = [
    { id: 'temperature', name: '気温', unit: '°C' },
    { id: 'precipitation', name: '降水量', unit: 'mm' },
    { id: 'humidity', name: '湿度', unit: '%' },
    { id: 'wind_speed', name: '風速', unit: 'm/s' },
    { id: 'pressure', name: '気圧', unit: 'hPa' },
    { id: 'cloud_cover', name: '雲量', unit: '%' },
  ];

  const emissionScenarios = [
    { id: 'ssp1-1.9', name: '非常に低排出（SSP1-1.9）', temp: '+1.4°C', color: 'bg-green-500' },
    { id: 'ssp1-2.6', name: '低排出（SSP1-2.6）', temp: '+1.8°C', color: 'bg-emerald-500' },
    { id: 'ssp2-4.5', name: '中間排出（SSP2-4.5）', temp: '+2.7°C', color: 'bg-yellow-500' },
    { id: 'ssp3-7.0', name: '高排出（SSP3-7.0）', temp: '+3.6°C', color: 'bg-orange-500' },
    { id: 'ssp5-8.5', name: '非常に高排出（SSP5-8.5）', temp: '+4.4°C', color: 'bg-red-500' },
  ];

  const extremeEventTypes = [
    { id: 'heatwave', name: '熱波', icon: '🌡️' },
    { id: 'drought', name: '干ばつ', icon: '🏜️' },
    { id: 'flood', name: '洪水', icon: '🌊' },
    { id: 'hurricane', name: '台風', icon: '🌀' },
    { id: 'wildfire', name: '山火事', icon: '🔥' },
  ];

  const handleRunWeatherPrediction = async () => {
    setIsRunning(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 3000));
    setWeatherResult({
      predictions: [
        { hour: 0, temp: 22, precip: 0, humidity: 65 },
        { hour: 6, temp: 19, precip: 0, humidity: 72 },
        { hour: 12, temp: 26, precip: 0, humidity: 55 },
        { hour: 18, temp: 24, precip: 2, humidity: 68 },
        { hour: 24, temp: 21, precip: 5, humidity: 78 },
        { hour: 30, temp: 18, precip: 8, humidity: 85 },
        { hour: 36, temp: 20, precip: 3, humidity: 75 },
        { hour: 42, temp: 23, precip: 0, humidity: 62 },
        { hour: 48, temp: 25, precip: 0, humidity: 58 },
      ],
      model: 'Aurora v1.0',
      confidence: 0.87,
    });
    setIsRunning(false);
  };

  const handleRunProjection = async () => {
    setIsRunning(true);
    await new Promise((r) => setTimeout(r, 3500));
    const scenarioData = emissionScenarios.find((s) => s.id === scenario);
    const baseTemp = parseFloat(scenarioData?.temp || '+2.7') || 2.7;
    const yearFactor = (projectionYear - 2020) / 80;
    
    setProjectionResult({
      scenario: scenarioData?.name,
      tempChange: (baseTemp * yearFactor).toFixed(1),
      seaLevelRise: (0.5 * yearFactor * (baseTemp / 2.7)).toFixed(2),
      precipChange: ((Math.random() * 10 - 5) * yearFactor).toFixed(1),
      riskLevel: yearFactor * baseTemp > 2 ? 'high' : yearFactor * baseTemp > 1 ? 'moderate' : 'low',
    });
    setIsRunning(false);
  };

  const handleRunExtremeAnalysis = async () => {
    setIsRunning(true);
    await new Promise((r) => setTimeout(r, 2500));
    setExtremeResult({
      events: [
        { type: '熱波', count: 12, trend: 'increasing', severity: 'high' },
        { type: '洪水', count: 8, trend: 'increasing', severity: 'moderate' },
        { type: '干ばつ', count: 3, trend: 'stable', severity: 'low' },
        { type: '台風', count: 15, trend: 'stable', severity: 'high' },
      ],
      totalEvents: 38,
      periodYears: 10,
    });
    setIsRunning(false);
  };

  const toggleVariable = (varId: string) => {
    setSelectedVariables((prev) =>
      prev.includes(varId) ? prev.filter((v) => v !== varId) : [...prev, varId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
                ← ダッシュボード
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  🌍 気候科学ワークフロー
                </h1>
                <p className="text-sky-300 text-sm">Microsoft Aurora によるAI気象予測・気候変動解析</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/10 bg-black/10">
        <div className="mx-auto max-w-7xl px-4">
          <nav className="flex gap-1">
            {[
              { id: 'weather', label: '気象予測', icon: '⛅' },
              { id: 'projection', label: '気候予測', icon: '📈' },
              { id: 'extreme', label: '極端現象', icon: '⚠️' },
              { id: 'impact', label: '影響評価', icon: '🏭' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-sky-400 bg-white/5'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Weather Prediction Tab */}
        {activeTab === 'weather' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-white mb-4">予測設定</h2>

                {/* Region Selection */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">対象地域</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  >
                    {Object.entries(regions).map(([id, region]) => (
                      <option key={id} value={id} className="bg-gray-800">
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Forecast Horizon */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">
                    予測期間: {forecastHours}時間
                  </label>
                  <input
                    type="range"
                    min={24}
                    max={240}
                    step={24}
                    value={forecastHours}
                    onChange={(e) => setForecastHours(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-white/50">
                    <span>1日</span>
                    <span>10日</span>
                  </div>
                </div>

                {/* Variables */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">気象変数</label>
                  <div className="grid grid-cols-2 gap-2">
                    {climateVariables.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => toggleVariable(v.id)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedVariables.includes(v.id)
                            ? 'bg-sky-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleRunWeatherPrediction}
                  disabled={isRunning || selectedVariables.length === 0}
                  className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  {isRunning ? '予測実行中...' : '🚀 Aurora で予測実行'}
                </button>
              </div>

              {/* Model Info */}
              <div className="bg-gradient-to-br from-sky-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl p-6 border border-sky-400/30">
                <h3 className="text-white font-medium mb-2">Microsoft Aurora</h3>
                <p className="text-white/70 text-sm mb-3">
                  高精度AIモデルによる大気シミュレーション。従来の数値予報より10倍高速かつ高精度。
                </p>
                <div className="flex gap-2">
                  <span className="bg-sky-500/30 text-sky-300 px-2 py-1 rounded text-xs">0.1°解像度</span>
                  <span className="bg-sky-500/30 text-sky-300 px-2 py-1 rounded text-xs">10日先予測</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 min-h-[500px]">
                <h2 className="text-lg font-semibold text-white mb-4">予測結果</h2>

                {!weatherResult ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-white/50">
                    <span className="text-6xl mb-4">🌤️</span>
                    <p>地域と変数を選択して予測を実行してください</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Confidence */}
                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                      <div>
                        <span className="text-white/70 text-sm">予測モデル</span>
                        <p className="text-white font-medium">{weatherResult.model}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-white/70 text-sm">信頼度</span>
                        <p className="text-2xl font-bold text-sky-400">
                          {(weatherResult.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {/* Chart Placeholder */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-white/70 text-sm mb-4">気温予測（{forecastHours}時間）</h3>
                      <div className="h-48 flex items-end gap-2">
                        {weatherResult.predictions.map((p: any, i: number) => (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-gradient-to-t from-sky-500 to-sky-300 rounded-t"
                              style={{ height: `${(p.temp / 30) * 100}%` }}
                            />
                            <span className="text-xs text-white/50 mt-1">{p.hour}h</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Precipitation */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-white/70 text-sm mb-4">降水量予測</h3>
                      <div className="h-32 flex items-end gap-2">
                        {weatherResult.predictions.map((p: any, i: number) => (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                              style={{ height: `${(p.precip / 10) * 100}%`, minHeight: p.precip > 0 ? '8px' : '0' }}
                            />
                            <span className="text-xs text-white/50 mt-1">{p.precip}mm</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Climate Projection Tab */}
        {activeTab === 'projection' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-white mb-4">シナリオ設定</h2>

                {/* Scenario Selection */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">排出シナリオ（SSP）</label>
                  <div className="space-y-2">
                    {emissionScenarios.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setScenario(s.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                          scenario === s.id
                            ? 'bg-white/20 border-2 border-sky-400'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${s.color}`} />
                          <span className="text-white text-sm">{s.name}</span>
                        </div>
                        <span className="text-white/70 text-sm">{s.temp}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Year */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">予測年: {projectionYear}年</label>
                  <input
                    type="range"
                    min={2030}
                    max={2100}
                    step={10}
                    value={projectionYear}
                    onChange={(e) => setProjectionYear(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-white/50">
                    <span>2030</span>
                    <span>2100</span>
                  </div>
                </div>

                <button
                  onClick={handleRunProjection}
                  disabled={isRunning}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  {isRunning ? '計算中...' : '📊 気候予測を実行'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 min-h-[500px]">
                <h2 className="text-lg font-semibold text-white mb-4">予測結果</h2>

                {!projectionResult ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-white/50">
                    <span className="text-6xl mb-4">📈</span>
                    <p>シナリオと予測年を選択して実行してください</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-6">
                      <div className="text-white/60 text-sm mb-2">気温上昇</div>
                      <div className="text-4xl font-bold text-orange-400">
                        +{projectionResult.tempChange}°C
                      </div>
                      <div className="text-white/50 text-sm mt-1">
                        {projectionYear}年までの変化
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-6">
                      <div className="text-white/60 text-sm mb-2">海面上昇</div>
                      <div className="text-4xl font-bold text-blue-400">
                        +{projectionResult.seaLevelRise}m
                      </div>
                      <div className="text-white/50 text-sm mt-1">
                        平均海面からの変化
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-6">
                      <div className="text-white/60 text-sm mb-2">降水量変化</div>
                      <div className="text-4xl font-bold text-cyan-400">
                        {projectionResult.precipChange > 0 ? '+' : ''}{projectionResult.precipChange}%
                      </div>
                      <div className="text-white/50 text-sm mt-1">
                        年間平均からの変化
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-6">
                      <div className="text-white/60 text-sm mb-2">リスクレベル</div>
                      <div className={`text-4xl font-bold ${
                        projectionResult.riskLevel === 'high' ? 'text-red-400' :
                        projectionResult.riskLevel === 'moderate' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {projectionResult.riskLevel === 'high' ? '高' :
                         projectionResult.riskLevel === 'moderate' ? '中' : '低'}
                      </div>
                      <div className="text-white/50 text-sm mt-1">
                        総合的な気候リスク
                      </div>
                    </div>

                    <div className="col-span-2 bg-gradient-to-r from-amber-500/20 to-red-500/20 rounded-xl p-6 border border-amber-400/30">
                      <h3 className="text-white font-medium mb-2">⚠️ シナリオ: {projectionResult.scenario}</h3>
                      <p className="text-white/70 text-sm">
                        このシナリオでは{projectionYear}年までに気温が{projectionResult.tempChange}°C上昇し、
                        海面が{projectionResult.seaLevelRise}m上昇すると予測されています。
                        適応策の検討が推奨されます。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Extreme Events Tab */}
        {activeTab === 'extreme' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-white mb-4">極端現象分析</h2>

                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">分析対象</label>
                  <div className="grid grid-cols-2 gap-2">
                    {extremeEventTypes.map((e) => (
                      <div
                        key={e.id}
                        className="bg-white/10 rounded-lg p-3 text-center"
                      >
                        <span className="text-2xl">{e.icon}</span>
                        <div className="text-white text-sm mt-1">{e.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleRunExtremeAnalysis}
                  disabled={isRunning}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  {isRunning ? '分析中...' : '⚠️ 極端現象を分析'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 min-h-[500px]">
                <h2 className="text-lg font-semibold text-white mb-4">分析結果</h2>

                {!extremeResult ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-white/50">
                    <span className="text-6xl mb-4">⚠️</span>
                    <p>極端現象の分析を実行してください</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                      <span className="text-white/70">分析期間</span>
                      <span className="text-white font-medium">過去{extremeResult.periodYears}年間</span>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                      <span className="text-white/70">検出イベント数</span>
                      <span className="text-2xl text-red-400 font-bold">{extremeResult.totalEvents}</span>
                    </div>

                    <div className="space-y-3">
                      {extremeResult.events.map((event: any, i: number) => (
                        <div key={i} className="bg-white/5 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-white font-medium">{event.type}</h3>
                              <p className="text-white/60 text-sm">{event.count}件検出</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded text-xs ${
                                event.trend === 'increasing' ? 'bg-red-500/30 text-red-300' : 'bg-gray-500/30 text-gray-300'
                              }`}>
                                {event.trend === 'increasing' ? '↑ 増加傾向' : '→ 安定'}
                              </span>
                              <div className={`mt-2 text-sm ${
                                event.severity === 'high' ? 'text-red-400' :
                                event.severity === 'moderate' ? 'text-yellow-400' : 'text-green-400'
                              }`}>
                                深刻度: {event.severity === 'high' ? '高' : event.severity === 'moderate' ? '中' : '低'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Impact Assessment Tab */}
        {activeTab === 'impact' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { sector: '農業', icon: '🌾', score: 72, risk: 'high' },
              { sector: '水資源', icon: '💧', score: 58, risk: 'moderate' },
              { sector: 'エネルギー', icon: '⚡', score: 45, risk: 'moderate' },
              { sector: '健康', icon: '🏥', score: 65, risk: 'high' },
              { sector: 'インフラ', icon: '🏗️', score: 52, risk: 'moderate' },
              { sector: '沿岸域', icon: '🏖️', score: 78, risk: 'high' },
            ].map((sector) => (
              <div
                key={sector.sector}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{sector.icon}</span>
                    <h3 className="text-xl font-semibold text-white">{sector.sector}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    sector.risk === 'high' ? 'bg-red-500/30 text-red-300' :
                    'bg-yellow-500/30 text-yellow-300'
                  }`}>
                    {sector.risk === 'high' ? '高リスク' : '中リスク'}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/70">脆弱性スコア</span>
                    <span className="text-white">{sector.score}/100</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        sector.score > 70 ? 'bg-red-500' :
                        sector.score > 50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${sector.score}%` }}
                    />
                  </div>
                </div>

                <div className="text-white/60 text-sm">
                  気候変動による{sector.sector}セクターへの影響評価。
                  適応策の検討が推奨されます。
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
