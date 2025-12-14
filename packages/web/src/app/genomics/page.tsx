'use client';

import { useState } from 'react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

type Tab = 'variant' | 'expression' | 'singlecell' | 'results';

interface Variant {
  id: string;
  gene: string;
  chr: string;
  pos: number;
  ref: string;
  alt: string;
  impact: 'high' | 'moderate' | 'low';
  type: string;
}

// ============================================================================
// Genomics Page Component
// ============================================================================

export default function GenomicsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('variant');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Variant calling state
  const [referenceGenome, setReferenceGenome] = useState('hg38');
  const [caller, setCaller] = useState('deepvariant');
  const [minQuality, setMinQuality] = useState(30);
  const [minDepth, setMinDepth] = useState(10);

  // Gene expression state
  const [normMethod, setNormMethod] = useState('deseq2');
  const [groupA, setGroupA] = useState('Treatment');
  const [groupB, setGroupB] = useState('Control');

  // Single cell state
  const [platform, setPlatform] = useState('10x_genomics');
  const [minGenes, setMinGenes] = useState(200);
  const [maxGenes, setMaxGenes] = useState(5000);
  const [resolution, setResolution] = useState(0.5);

  // Results state
  const [variantResult, setVariantResult] = useState<any>(null);
  const [expressionResult, setExpressionResult] = useState<any>(null);
  const [singleCellResult, setSingleCellResult] = useState<any>(null);

  const referenceGenomes = [
    { id: 'hg38', name: 'Human GRCh38', organism: 'ヒト' },
    { id: 'hg19', name: 'Human GRCh37', organism: 'ヒト' },
    { id: 'mm39', name: 'Mouse GRCm39', organism: 'マウス' },
    { id: 'mm10', name: 'Mouse GRCm38', organism: 'マウス' },
  ];

  const variantCallers = [
    { id: 'deepvariant', name: 'DeepVariant', desc: 'Google AI ベース' },
    { id: 'gatk', name: 'GATK HaplotypeCaller', desc: 'Broad Institute' },
    { id: 'freebayes', name: 'FreeBayes', desc: 'ベイズ推定ベース' },
    { id: 'strelka', name: 'Strelka2', desc: 'Illumina 開発' },
  ];

  const runVariantCalling = async () => {
    setIsRunning(true);
    setProgress(0);

    const steps = ['QC', 'アライメント', '重複除去', '変異検出', 'フィルタリング', 'アノテーション'];
    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 800));
      setProgress(((i + 1) / steps.length) * 100);
    }

    const mockVariants: Variant[] = [
      { id: 'v1', gene: 'TP53', chr: 'chr17', pos: 7577538, ref: 'C', alt: 'T', impact: 'high', type: 'missense' },
      { id: 'v2', gene: 'BRCA1', chr: 'chr17', pos: 43094464, ref: 'G', alt: 'A', impact: 'high', type: 'nonsense' },
      { id: 'v3', gene: 'EGFR', chr: 'chr7', pos: 55249071, ref: 'T', alt: 'G', impact: 'moderate', type: 'missense' },
      { id: 'v4', gene: 'KRAS', chr: 'chr12', pos: 25398284, ref: 'G', alt: 'T', impact: 'high', type: 'missense' },
      { id: 'v5', gene: 'BRAF', chr: 'chr7', pos: 140453136, ref: 'A', alt: 'T', impact: 'high', type: 'missense' },
      { id: 'v6', gene: 'PIK3CA', chr: 'chr3', pos: 178936091, ref: 'G', alt: 'A', impact: 'moderate', type: 'missense' },
    ];

    setVariantResult({
      totalVariants: 42847,
      snvCount: 36421,
      indelCount: 6426,
      tiTvRatio: 2.14,
      meanDepth: 45.2,
      topVariants: mockVariants,
    });

    setIsRunning(false);
    setActiveTab('results');
  };

  const runGeneExpression = async () => {
    setIsRunning(true);
    setProgress(0);

    const steps = ['リードカウント', '正規化', '品質評価', '差次的発現解析', 'エンリッチメント'];
    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setProgress(((i + 1) / steps.length) * 100);
    }

    setExpressionResult({
      totalGenes: 25000,
      expressedGenes: 15234,
      upregulated: 523,
      downregulated: 412,
      topGenes: [
        { gene: 'MYC', log2FC: 3.2, pAdj: 0.0001 },
        { gene: 'CCND1', log2FC: 2.8, pAdj: 0.0003 },
        { gene: 'TP53', log2FC: -2.5, pAdj: 0.0005 },
        { gene: 'BCL2', log2FC: -2.1, pAdj: 0.001 },
        { gene: 'VEGFA', log2FC: 2.4, pAdj: 0.002 },
      ],
      enrichedPathways: [
        { name: 'Cell cycle', pValue: 0.0001, genes: 45 },
        { name: 'Apoptosis', pValue: 0.0005, genes: 32 },
        { name: 'PI3K-Akt signaling', pValue: 0.001, genes: 28 },
      ],
    });

    setIsRunning(false);
    setActiveTab('results');
  };

  const runSingleCell = async () => {
    setIsRunning(true);
    setProgress(0);

    const steps = ['フィルタリング', '正規化', '次元削減', 'クラスタリング', 'マーカー同定', '細胞タイプ推定'];
    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setProgress(((i + 1) / steps.length) * 100);
    }

    setSingleCellResult({
      totalCells: 10000,
      filteredCells: 8532,
      medianGenes: 2847,
      clusters: [
        { id: 0, name: 'T細胞', count: 2541, pct: 29.8, markers: ['CD3D', 'CD4', 'CD8A'] },
        { id: 1, name: 'B細胞', count: 1842, pct: 21.6, markers: ['CD19', 'MS4A1', 'CD79A'] },
        { id: 2, name: 'NK細胞', count: 1123, pct: 13.2, markers: ['NKG7', 'GNLY', 'NCAM1'] },
        { id: 3, name: 'マクロファージ', count: 985, pct: 11.5, markers: ['CD68', 'CD14', 'FCGR3A'] },
        { id: 4, name: '樹状細胞', count: 654, pct: 7.7, markers: ['CD1C', 'CLEC10A', 'FCER1A'] },
        { id: 5, name: '上皮細胞', count: 1387, pct: 16.2, markers: ['EPCAM', 'KRT18', 'KRT19'] },
      ],
    });

    setIsRunning(false);
    setActiveTab('results');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900">
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
                  🧬 ゲノミクスワークフロー
                </h1>
                <p className="text-emerald-300 text-sm">変異検出・発現解析・シングルセル解析</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {isRunning && (
        <div className="bg-black/30 border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className="text-white text-sm">{progress.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-white/10 bg-black/10">
        <div className="mx-auto max-w-7xl px-4">
          <nav className="flex gap-1">
            {[
              { id: 'variant', label: '変異検出', icon: '🔬' },
              { id: 'expression', label: '発現解析', icon: '📊' },
              { id: 'singlecell', label: 'シングルセル', icon: '🔴' },
              { id: 'results', label: '結果', icon: '📋' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-emerald-400 bg-white/5'
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
        {/* Variant Calling Tab */}
        {activeTab === 'variant' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-white mb-4">変異検出パイプライン</h2>

                {/* Reference Genome */}
                <div className="mb-6">
                  <label className="block text-sm text-white/70 mb-2">リファレンスゲノム</label>
                  <div className="grid grid-cols-2 gap-3">
                    {referenceGenomes.map((ref) => (
                      <button
                        key={ref.id}
                        onClick={() => setReferenceGenome(ref.id)}
                        className={`p-4 rounded-lg text-left transition-colors ${
                          referenceGenome === ref.id
                            ? 'bg-emerald-500/30 border-2 border-emerald-400'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-white font-medium">{ref.name}</div>
                        <div className="text-white/60 text-sm">{ref.organism}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variant Caller */}
                <div className="mb-6">
                  <label className="block text-sm text-white/70 mb-2">変異検出ツール</label>
                  <div className="grid grid-cols-2 gap-3">
                    {variantCallers.map((vc) => (
                      <button
                        key={vc.id}
                        onClick={() => setCaller(vc.id)}
                        className={`p-4 rounded-lg text-left transition-colors ${
                          caller === vc.id
                            ? 'bg-emerald-500/30 border-2 border-emerald-400'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-white font-medium">{vc.name}</div>
                        <div className="text-white/60 text-sm">{vc.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Filters */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">最小品質スコア: {minQuality}</label>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      value={minQuality}
                      onChange={(e) => setMinQuality(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">最小リード深度: {minDepth}x</label>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      value={minDepth}
                      onChange={(e) => setMinDepth(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                <button
                  onClick={runVariantCalling}
                  disabled={isRunning}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  {isRunning ? '解析中...' : '🧬 変異検出を実行'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-xl p-6 border border-emerald-400/30">
                <h3 className="text-white font-medium mb-3">パイプライン概要</h3>
                <ol className="space-y-2 text-sm text-white/70">
                  <li className="flex gap-2"><span className="text-emerald-400">1.</span> リード品質チェック (FastQC)</li>
                  <li className="flex gap-2"><span className="text-emerald-400">2.</span> リファレンスへのアライメント (BWA-MEM2)</li>
                  <li className="flex gap-2"><span className="text-emerald-400">3.</span> 重複除去 (MarkDuplicates)</li>
                  <li className="flex gap-2"><span className="text-emerald-400">4.</span> 変異検出 ({caller})</li>
                  <li className="flex gap-2"><span className="text-emerald-400">5.</span> 品質フィルタリング</li>
                  <li className="flex gap-2"><span className="text-emerald-400">6.</span> アノテーション (VEP)</li>
                </ol>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-white font-medium mb-3">サンプルファイル</h3>
                <div className="space-y-2">
                  <div className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-white/70 text-sm">sample_R1.fastq.gz</span>
                    <span className="text-emerald-400 text-sm">2.4 GB</span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-white/70 text-sm">sample_R2.fastq.gz</span>
                    <span className="text-emerald-400 text-sm">2.4 GB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gene Expression Tab */}
        {activeTab === 'expression' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-white mb-4">遺伝子発現解析</h2>

                {/* Normalization Method */}
                <div className="mb-6">
                  <label className="block text-sm text-white/70 mb-2">正規化手法</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['TPM', 'FPKM', 'DESeq2', 'edgeR'].map((method) => (
                      <button
                        key={method}
                        onClick={() => setNormMethod(method.toLowerCase())}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          normMethod === method.toLowerCase()
                            ? 'bg-teal-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sample Groups */}
                <div className="mb-6">
                  <label className="block text-sm text-white/70 mb-2">比較グループ</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-white/50 mb-1">グループA</label>
                      <input
                        type="text"
                        value={groupA}
                        onChange={(e) => setGroupA(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/50 mb-1">グループB</label>
                      <input
                        type="text"
                        value={groupB}
                        onChange={(e) => setGroupB(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={runGeneExpression}
                  disabled={isRunning}
                  className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  {isRunning ? '解析中...' : '📊 発現解析を実行'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-white font-medium mb-3">解析内容</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>• 差次的発現遺伝子（DEG）の同定</li>
                  <li>• Volcano plot / MA plot</li>
                  <li>• Gene Ontology エンリッチメント</li>
                  <li>• KEGG パスウェイ解析</li>
                  <li>• サンプル間相関解析</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Single Cell Tab */}
        {activeTab === 'singlecell' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-white mb-4">シングルセル解析</h2>

                {/* Platform */}
                <div className="mb-6">
                  <label className="block text-sm text-white/70 mb-2">プラットフォーム</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '10x_genomics', name: '10x Genomics' },
                      { id: 'smart_seq', name: 'Smart-seq2' },
                      { id: 'drop_seq', name: 'Drop-seq' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPlatform(p.id)}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          platform === p.id
                            ? 'bg-cyan-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* QC Parameters */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">最小遺伝子数: {minGenes}</label>
                    <input
                      type="range"
                      min={100}
                      max={500}
                      value={minGenes}
                      onChange={(e) => setMinGenes(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">最大遺伝子数: {maxGenes}</label>
                    <input
                      type="range"
                      min={2000}
                      max={8000}
                      value={maxGenes}
                      onChange={(e) => setMaxGenes(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">解像度: {resolution}</label>
                    <input
                      type="range"
                      min={0.1}
                      max={2}
                      step={0.1}
                      value={resolution}
                      onChange={(e) => setResolution(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                <button
                  onClick={runSingleCell}
                  disabled={isRunning}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  {isRunning ? '解析中...' : '🔴 シングルセル解析を実行'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl p-6 border border-cyan-400/30">
                <h3 className="text-white font-medium mb-3">解析パイプライン</h3>
                <ol className="space-y-2 text-sm text-white/70">
                  <li className="flex gap-2"><span className="text-cyan-400">1.</span> セルフィルタリング</li>
                  <li className="flex gap-2"><span className="text-cyan-400">2.</span> 正規化・スケーリング</li>
                  <li className="flex gap-2"><span className="text-cyan-400">3.</span> 可変遺伝子選択</li>
                  <li className="flex gap-2"><span className="text-cyan-400">4.</span> PCA次元削減</li>
                  <li className="flex gap-2"><span className="text-cyan-400">5.</span> UMAP可視化</li>
                  <li className="flex gap-2"><span className="text-cyan-400">6.</span> クラスタリング</li>
                  <li className="flex gap-2"><span className="text-cyan-400">7.</span> マーカー遺伝子同定</li>
                  <li className="flex gap-2"><span className="text-cyan-400">8.</span> 細胞タイプアノテーション</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            {/* Variant Results */}
            {variantResult && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-white mb-4">🔬 変異検出結果</h2>
                
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-400">{variantResult.totalVariants.toLocaleString()}</div>
                    <div className="text-white/60 text-sm">総変異数</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-400">{variantResult.snvCount.toLocaleString()}</div>
                    <div className="text-white/60 text-sm">SNV</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-400">{variantResult.indelCount.toLocaleString()}</div>
                    <div className="text-white/60 text-sm">InDel</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-amber-400">{variantResult.tiTvRatio}</div>
                    <div className="text-white/60 text-sm">Ti/Tv比</div>
                  </div>
                </div>

                <h3 className="text-white font-medium mb-3">高インパクト変異</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-white/60 text-sm border-b border-white/10">
                        <th className="text-left py-2 px-3">遺伝子</th>
                        <th className="text-left py-2 px-3">位置</th>
                        <th className="text-left py-2 px-3">変異</th>
                        <th className="text-left py-2 px-3">タイプ</th>
                        <th className="text-left py-2 px-3">インパクト</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variantResult.topVariants.map((v: Variant) => (
                        <tr key={v.id} className="border-b border-white/5">
                          <td className="py-2 px-3 text-white font-medium">{v.gene}</td>
                          <td className="py-2 px-3 text-white/70">{v.chr}:{v.pos.toLocaleString()}</td>
                          <td className="py-2 px-3">
                            <span className="text-red-400">{v.ref}</span>
                            <span className="text-white/50"> → </span>
                            <span className="text-green-400">{v.alt}</span>
                          </td>
                          <td className="py-2 px-3 text-white/70">{v.type}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              v.impact === 'high' ? 'bg-red-500/30 text-red-300' :
                              v.impact === 'moderate' ? 'bg-yellow-500/30 text-yellow-300' :
                              'bg-green-500/30 text-green-300'
                            }`}>
                              {v.impact}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Expression Results */}
            {expressionResult && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-white mb-4">📊 発現解析結果</h2>
                
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-teal-400">{expressionResult.totalGenes.toLocaleString()}</div>
                    <div className="text-white/60 text-sm">総遺伝子数</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-400">{expressionResult.expressedGenes.toLocaleString()}</div>
                    <div className="text-white/60 text-sm">発現遺伝子</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-red-400">↑{expressionResult.upregulated}</div>
                    <div className="text-white/60 text-sm">発現上昇</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-400">↓{expressionResult.downregulated}</div>
                    <div className="text-white/60 text-sm">発現低下</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-white font-medium mb-3">Top DEGs</h3>
                    <div className="space-y-2">
                      {expressionResult.topGenes.map((g: any) => (
                        <div key={g.gene} className="bg-white/5 rounded-lg p-3 flex justify-between">
                          <span className="text-white font-medium">{g.gene}</span>
                          <span className={g.log2FC > 0 ? 'text-red-400' : 'text-green-400'}>
                            {g.log2FC > 0 ? '+' : ''}{g.log2FC.toFixed(1)} FC
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-3">エンリッチパスウェイ</h3>
                    <div className="space-y-2">
                      {expressionResult.enrichedPathways.map((p: any) => (
                        <div key={p.name} className="bg-white/5 rounded-lg p-3">
                          <div className="flex justify-between">
                            <span className="text-white">{p.name}</span>
                            <span className="text-white/60 text-sm">{p.genes}遺伝子</span>
                          </div>
                          <div className="text-teal-400 text-sm">p = {p.pValue}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Single Cell Results */}
            {singleCellResult && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-white mb-4">🔴 シングルセル解析結果</h2>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-cyan-400">{singleCellResult.filteredCells.toLocaleString()}</div>
                    <div className="text-white/60 text-sm">QC通過細胞</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-400">{singleCellResult.clusters.length}</div>
                    <div className="text-white/60 text-sm">クラスター数</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-amber-400">{singleCellResult.medianGenes.toLocaleString()}</div>
                    <div className="text-white/60 text-sm">中央値遺伝子数</div>
                  </div>
                </div>

                <h3 className="text-white font-medium mb-3">細胞タイプ分布</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {singleCellResult.clusters.map((c: any) => (
                    <div key={c.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white font-medium">{c.name}</span>
                        <span className="text-cyan-400">{c.pct.toFixed(1)}%</span>
                      </div>
                      <div className="text-white/60 text-sm mb-2">{c.count.toLocaleString()} cells</div>
                      <div className="flex flex-wrap gap-1">
                        {c.markers.map((m: string) => (
                          <span key={m} className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded text-xs">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!variantResult && !expressionResult && !singleCellResult && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-12 border border-white/20 text-center">
                <span className="text-6xl mb-4 block">📋</span>
                <p className="text-white/60">解析を実行すると結果がここに表示されます</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
