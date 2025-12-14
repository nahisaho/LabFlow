/**
 * Tutorial Definitions
 *
 * Pre-built tutorials for each research domain
 */

import type { Tutorial, TutorialCategory } from './index';
import type { ResearchDomain } from '../workflow';

// ============================================================================
// Quick Start Tutorials
// ============================================================================

const QUICKSTART_TUTORIALS: Tutorial[] = [
  {
    id: 'welcome-tour',
    name: 'Welcome Tour',
    nameJa: 'LabFlowへようこそ',
    description: 'Learn the basics of LabFlow',
    descriptionJa: 'LabFlowの基本機能を学びましょう',
    category: 'quickstart',
    estimatedMinutes: 5,
    difficulty: 'beginner',
    icon: '👋',
    steps: [
      {
        id: 'welcome-1',
        title: 'LabFlowへようこそ！',
        content: `LabFlowは、AIを活用した科学発見プラットフォームです。

このツアーでは、以下の基本機能を紹介します：
• プロジェクトの作成と管理
• ワークフローの構築
• AIモデルの活用
• 結果の分析と共有`,
        position: 'center',
      },
      {
        id: 'welcome-2',
        title: 'ダッシュボード',
        content: `ダッシュボードは、あなたの研究活動のハブです。

• 最近のプロジェクト
• 実行中のワークフロー
• 学習の進捗
• チームの活動

がひと目で確認できます。`,
        targetElement: '[data-tutorial="dashboard"]',
        position: 'bottom',
      },
      {
        id: 'welcome-3',
        title: 'プロジェクト',
        content: `プロジェクトは研究の単位です。

各プロジェクトには：
• ワークフロー（実験の設計）
• データセット（入出力データ）
• モデル設定
• 結果レポート

が含まれます。`,
        targetElement: '[data-tutorial="projects"]',
        position: 'right',
      },
      {
        id: 'welcome-4',
        title: 'ワークフロー',
        content: `ワークフローは研究プロセスを視覚的に設計できます。

ドラッグ&ドロップで：
• データの読み込み
• AIモデルの適用
• 結果の分析
• 出力のエクスポート

を組み合わせられます。`,
        targetElement: '[data-tutorial="workflows"]',
        position: 'right',
      },
      {
        id: 'welcome-5',
        title: 'モデルカタログ',
        content: `最先端のAIモデルにアクセスできます。

利用可能なモデル：
🔬 MatterGen - 結晶構造生成
⚛️ MatterSim - 材料シミュレーション
🌍 Aurora - 気象予測
🧬 BioEMU - タンパク質解析
💊 TamGen - 分子生成`,
        targetElement: '[data-tutorial="models"]',
        position: 'right',
      },
      {
        id: 'welcome-6',
        title: '準備完了！',
        content: `基本機能の紹介は以上です。

次のステップ：
1. 「最初のプロジェクト」チュートリアルを開始
2. テンプレートからワークフローを作成
3. サンプルデータで実験を試す

不明点があれば、ヘルプセンターをご覧ください。`,
        position: 'center',
      },
    ],
  },
  {
    id: 'first-project',
    name: 'First Project',
    nameJa: '最初のプロジェクトを作成',
    description: 'Create your first research project',
    descriptionJa: '初めての研究プロジェクトを作成しましょう',
    category: 'quickstart',
    estimatedMinutes: 10,
    difficulty: 'beginner',
    icon: '📁',
    steps: [
      {
        id: 'project-1',
        title: 'プロジェクトを作成しよう',
        content: `研究プロジェクトを作成します。

プロジェクトには以下の情報を設定します：
• 名前と説明
• 研究分野（材料/創薬/気候/ゲノム）
• チームメンバー（オプション）`,
        position: 'center',
      },
      {
        id: 'project-2',
        title: '新規作成ボタン',
        content: '「新規プロジェクト」ボタンをクリックしてください。',
        targetElement: '[data-tutorial="new-project"]',
        position: 'bottom',
        action: 'click',
        actionTarget: '[data-tutorial="new-project"]',
      },
      {
        id: 'project-3',
        title: 'プロジェクト名',
        content: `プロジェクト名を入力してください。

例：
• 「新規熱電材料探索」
• 「COVID-19治療薬候補スクリーニング」
• 「台風進路予測モデル検証」`,
        targetElement: '[data-tutorial="project-name"]',
        position: 'right',
        action: 'input',
      },
      {
        id: 'project-4',
        title: '研究分野の選択',
        content: `研究分野を選択してください。

分野によって使用できるモデルとテンプレートが変わります。`,
        targetElement: '[data-tutorial="project-domain"]',
        position: 'right',
        action: 'select',
      },
      {
        id: 'project-5',
        title: '作成完了！',
        content: `おめでとうございます！
最初のプロジェクトが作成されました。

次は、このプロジェクトにワークフローを追加しましょう。`,
        position: 'center',
      },
    ],
  },
  {
    id: 'first-workflow',
    name: 'First Workflow',
    nameJa: '最初のワークフローを作成',
    description: 'Build your first research workflow',
    descriptionJa: '初めての研究ワークフローを構築しましょう',
    category: 'quickstart',
    estimatedMinutes: 15,
    difficulty: 'beginner',
    icon: '🔄',
    prerequisites: ['first-project'],
    steps: [
      {
        id: 'workflow-1',
        title: 'ワークフローとは',
        content: `ワークフローは、研究プロセスを視覚的に表現したものです。

データの流れ：
入力 → 前処理 → モデル適用 → 分析 → 出力

各ステップを「ノード」として配置し、接続します。`,
        position: 'center',
      },
      {
        id: 'workflow-2',
        title: 'テンプレートを使う',
        content: `テンプレートを使うと、すぐに始められます。

分野ごとに最適化されたテンプレートが用意されています。`,
        targetElement: '[data-tutorial="workflow-templates"]',
        position: 'bottom',
      },
      {
        id: 'workflow-3',
        title: 'ステップを追加',
        content: `左のパレットからステップをドラッグして追加できます。

ステップの種類：
📥 データ読み込み
🔄 データ変換
🤖 モデル適用
📊 分析
📤 出力`,
        targetElement: '[data-tutorial="step-palette"]',
        position: 'right',
      },
      {
        id: 'workflow-4',
        title: 'ステップを接続',
        content: `ステップ同士を接続してデータフローを定義します。

接続することで、前のステップの出力が次のステップの入力になります。`,
        targetElement: '[data-tutorial="workflow-canvas"]',
        position: 'left',
      },
      {
        id: 'workflow-5',
        title: 'ステップを設定',
        content: `各ステップをクリックすると、詳細設定ができます。

設定項目はステップの種類によって異なります。`,
        targetElement: '[data-tutorial="step-config"]',
        position: 'left',
      },
      {
        id: 'workflow-6',
        title: 'ワークフローを実行',
        content: `設定が完了したら「実行」ボタンで開始できます。

実行中は進捗がリアルタイムで表示されます。`,
        targetElement: '[data-tutorial="run-workflow"]',
        position: 'bottom',
      },
    ],
  },
];

// ============================================================================
// Materials Science Tutorials
// ============================================================================

const MATERIALS_TUTORIALS: Tutorial[] = [
  {
    id: 'materials-intro',
    name: 'Materials Science Basics',
    nameJa: '材料科学入門',
    description: 'Introduction to AI-driven materials discovery',
    descriptionJa: 'AIを活用した材料探索の基礎を学びます',
    category: 'workflow',
    domain: 'materials',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    icon: '🔬',
    steps: [
      {
        id: 'mat-intro-1',
        title: '材料科学とAI',
        content: `材料科学では、新しい材料の発見と特性予測にAIが革命を起こしています。

従来の方法：実験 → 合成 → 評価 → 改良（数年かかる）
AI活用：候補生成 → シミュレーション → スクリーニング → 実験（数週間）`,
        position: 'center',
      },
      {
        id: 'mat-intro-2',
        title: 'MatterGenとは',
        content: `MatterGenは、Microsoft Researchが開発した結晶構造生成モデルです。

特徴：
• 化学組成から安定な結晶構造を予測
• 目的の特性を持つ材料候補を生成
• 周期表全体の元素に対応`,
        position: 'center',
      },
      {
        id: 'mat-intro-3',
        title: 'MatterSimとは',
        content: `MatterSimは、材料特性のシミュレーションを行うモデルです。

予測可能な特性：
• 熱力学的安定性
• 電子構造
• 機械的特性
• イオン伝導性`,
        position: 'center',
      },
      {
        id: 'mat-intro-4',
        title: '典型的なワークフロー',
        content: `材料探索の典型的なワークフロー：

1. 🎯 目標設定（熱電材料、電池材料など）
2. 📊 データ準備（元素系、条件）
3. 🔮 MatterGenで候補生成
4. ⚛️ MatterSimで特性予測
5. 🔍 スクリーニング
6. 📤 有望候補の出力`,
        position: 'center',
      },
    ],
  },
  {
    id: 'mattergen-guide',
    name: 'MatterGen Guide',
    nameJa: 'MatterGen活用ガイド',
    description: 'Learn to use MatterGen for crystal structure generation',
    descriptionJa: 'MatterGenを使った結晶構造生成を学びます',
    category: 'model',
    domain: 'materials',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    icon: '🔮',
    prerequisites: ['materials-intro'],
    steps: [
      {
        id: 'mg-1',
        title: 'MatterGenの概要',
        content: `MatterGenは拡散モデルをベースにした結晶構造生成AIです。

入力：
• 化学組成（例：Li-Fe-O）
• 生成条件（温度、圧力）
• 目標特性（オプション）

出力：
• 結晶構造（CIF形式）
• 予測安定性スコア`,
        position: 'center',
      },
      {
        id: 'mg-2',
        title: 'パラメータ設定',
        content: `重要なパラメータ：

chemical_system: 元素系（例：Li-Fe-O, Si-Ge）
num_samples: 生成する構造数
temperature: 生成の多様性
target_properties: 目標特性（オプション）`,
        targetElement: '[data-tutorial="mattergen-config"]',
        position: 'right',
      },
      {
        id: 'mg-3',
        title: '出力の解釈',
        content: `生成された構造の評価ポイント：

• formation_energy: 生成エネルギー（負の値が安定）
• e_above_hull: 凸包からの距離（0に近いほど安定）
• space_group: 空間群（対称性）
• crystal_system: 結晶系`,
        position: 'center',
      },
      {
        id: 'mg-4',
        title: 'ベストプラクティス',
        content: `効果的な使い方：

1. まず少数（10-50）で試行
2. 有望な化学系を特定
3. 大量生成（100-1000）でスクリーニング
4. MatterSimで詳細評価

注意：生成には数分〜数十分かかります。`,
        position: 'center',
      },
    ],
  },
  {
    id: 'mattersim-guide',
    name: 'MatterSim Guide',
    nameJa: 'MatterSim活用ガイド',
    description: 'Learn to use MatterSim for property prediction',
    descriptionJa: 'MatterSimを使った特性予測を学びます',
    category: 'model',
    domain: 'materials',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    icon: '⚛️',
    prerequisites: ['materials-intro'],
    steps: [
      {
        id: 'ms-1',
        title: 'MatterSimの概要',
        content: `MatterSimは材料特性を予測する普遍的なシミュレーションモデルです。

特徴：
• DFT精度で高速計算
• 幅広い材料系に対応
• 温度・圧力依存性を考慮`,
        position: 'center',
      },
      {
        id: 'ms-2',
        title: '入力形式',
        content: `入力データ形式：

• CIF: 結晶情報ファイル
• POSCAR: VASP形式
• XYZ: 分子座標

MatterGenの出力をそのまま使用できます。`,
        position: 'center',
      },
      {
        id: 'ms-3',
        title: '予測可能な特性',
        content: `主な予測特性：

エネルギー関連：
• 全エネルギー、生成エネルギー

機械特性：
• 弾性率、硬度

電子特性：
• バンドギャップ、状態密度

熱特性：
• 熱伝導率、比熱`,
        position: 'center',
      },
      {
        id: 'ms-4',
        title: '結果の活用',
        content: `予測結果の活用方法：

1. 安定性評価 → 不安定構造を除外
2. 特性スクリーニング → 条件を満たす候補抽出
3. 相図作成 → 組成-特性の関係把握
4. 最適化 → 有望候補の詳細解析`,
        position: 'center',
      },
    ],
  },
];

// ============================================================================
// Drug Discovery Tutorials
// ============================================================================

const DRUG_TUTORIALS: Tutorial[] = [
  {
    id: 'drug-intro',
    name: 'Drug Discovery Basics',
    nameJa: '創薬入門',
    description: 'Introduction to AI-driven drug discovery',
    descriptionJa: 'AIを活用した創薬の基礎を学びます',
    category: 'workflow',
    domain: 'drug',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    icon: '💊',
    steps: [
      {
        id: 'drug-1',
        title: '創薬とAI',
        content: `創薬プロセスは通常10年以上かかりますが、AIで大幅に短縮できます。

AIの活用領域：
• ターゲット同定
• リード化合物発見
• 最適化
• 毒性予測
• 臨床試験設計`,
        position: 'center',
      },
      {
        id: 'drug-2',
        title: 'TamGenとは',
        content: `TamGenは、ターゲットタンパク質に結合する分子を生成するモデルです。

特徴：
• 3D構造を考慮した分子生成
• 結合親和性の最適化
• 薬らしさ（Drug-likeness）を維持`,
        position: 'center',
      },
      {
        id: 'drug-3',
        title: 'BioEMUとは',
        content: `BioEMUは、タンパク質の動的挙動を予測するモデルです。

予測可能な情報：
• コンフォメーション変化
• 結合ポケットの柔軟性
• アロステリック効果`,
        position: 'center',
      },
      {
        id: 'drug-4',
        title: '創薬ワークフロー',
        content: `AI創薬の典型的なワークフロー：

1. 🎯 ターゲット選定（PDB構造）
2. 💊 TamGenで分子生成
3. 🔬 バーチャルスクリーニング
4. 📊 ADMET予測
5. 🧬 BioEMUで動的解析
6. 📤 候補化合物リスト出力`,
        position: 'center',
      },
    ],
  },
  {
    id: 'tamgen-guide',
    name: 'TamGen Guide',
    nameJa: 'TamGen活用ガイド',
    description: 'Learn to use TamGen for molecule generation',
    descriptionJa: 'TamGenを使った分子生成を学びます',
    category: 'model',
    domain: 'drug',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    icon: '🧪',
    prerequisites: ['drug-intro'],
    steps: [
      {
        id: 'tg-1',
        title: 'TamGenの概要',
        content: `TamGenは、ターゲットタンパク質の3D構造に基づいて、結合可能な分子を生成します。

入力：
• ターゲットPDB構造
• 結合サイト情報
• 生成条件

出力：
• SMILES形式の分子
• 予測結合親和性`,
        position: 'center',
      },
      {
        id: 'tg-2',
        title: 'パラメータ設定',
        content: `重要なパラメータ：

target_pdb: ターゲットのPDB ID
binding_site: 結合サイト残基
num_samples: 生成分子数
diversity: 多様性パラメータ
drug_likeness: 薬らしさ制約`,
        position: 'center',
      },
      {
        id: 'tg-3',
        title: '出力の評価',
        content: `生成分子の評価指標：

• Docking score: ドッキングスコア
• QED: 薬らしさスコア（0-1）
• SA score: 合成容易性（1-10）
• LogP: 脂溶性
• Tanimoto: 既存薬との類似性`,
        position: 'center',
      },
    ],
  },
];

// ============================================================================
// Climate Science Tutorials
// ============================================================================

const CLIMATE_TUTORIALS: Tutorial[] = [
  {
    id: 'climate-intro',
    name: 'Climate Science Basics',
    nameJa: '気候科学入門',
    description: 'Introduction to AI-driven weather and climate prediction',
    descriptionJa: 'AIを活用した気象・気候予測の基礎を学びます',
    category: 'workflow',
    domain: 'climate',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    icon: '🌍',
    steps: [
      {
        id: 'clim-1',
        title: '気候科学とAI',
        content: `気候科学では、AIによる予測精度の向上が急速に進んでいます。

AIの活用領域：
• 短期気象予報
• 季節予測
• 気候変動シミュレーション
• 極端気象の早期警戒`,
        position: 'center',
      },
      {
        id: 'clim-2',
        title: 'Auroraとは',
        content: `Auroraは、Microsoft Researchが開発した気象予測AIモデルです。

特徴：
• グローバルスケールの気象予測
• 高解像度（0.1°）
• 15日先までの予測
• 複数の気象変数を同時予測`,
        position: 'center',
      },
      {
        id: 'clim-3',
        title: '気象ワークフロー',
        content: `気象予測の典型的なワークフロー：

1. 📡 観測データ取得（ERA5等）
2. 🔄 前処理（正規化、欠損補完）
3. 🌤️ Aurora予測実行
4. 📊 結果の可視化
5. 📈 精度評価
6. 📤 予報データ出力`,
        position: 'center',
      },
    ],
  },
  {
    id: 'aurora-guide',
    name: 'Aurora Guide',
    nameJa: 'Aurora活用ガイド',
    description: 'Learn to use Aurora for weather prediction',
    descriptionJa: 'Auroraを使った気象予測を学びます',
    category: 'model',
    domain: 'climate',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    icon: '🌤️',
    prerequisites: ['climate-intro'],
    steps: [
      {
        id: 'au-1',
        title: 'Auroraの概要',
        content: `AuroraはTransformerベースの基盤モデルで、様々な気象タスクに対応します。

予測変数：
• 気温、気圧、湿度
• 風向、風速
• 降水量
• 雲量`,
        position: 'center',
      },
      {
        id: 'au-2',
        title: 'データ形式',
        content: `入力データ形式：

• NetCDF: 標準的な気象データ形式
• Zarr: 大規模データ向け
• CSV: 観測点データ

ERA5、GFS等の再解析データに対応。`,
        position: 'center',
      },
      {
        id: 'au-3',
        title: 'パラメータ設定',
        content: `重要なパラメータ：

prediction_length: 予測時間（時間単位）
resolution: 空間解像度
variables: 予測変数リスト
ensemble_size: アンサンブル数`,
        position: 'center',
      },
    ],
  },
];

// ============================================================================
// Genomics Tutorials
// ============================================================================

const GENOMICS_TUTORIALS: Tutorial[] = [
  {
    id: 'genomics-intro',
    name: 'Genomics Basics',
    nameJa: 'ゲノミクス入門',
    description: 'Introduction to AI-driven protein analysis',
    descriptionJa: 'AIを活用したタンパク質解析の基礎を学びます',
    category: 'workflow',
    domain: 'genomics',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    icon: '🧬',
    steps: [
      {
        id: 'gen-1',
        title: 'ゲノミクスとAI',
        content: `タンパク質研究では、AlphaFoldをはじめとするAIが革命を起こしています。

AIの活用領域：
• 構造予測
• 機能予測
• 動的挙動解析
• 相互作用予測`,
        position: 'center',
      },
      {
        id: 'gen-2',
        title: 'BioEMUとは',
        content: `BioEMUは、タンパク質のコンフォメーションアンサンブルを生成するモデルです。

特徴：
• ボルツマン分布に従うサンプリング
• 実験では観測困難な状態を予測
• ミリ秒スケールの動態を解析`,
        position: 'center',
      },
      {
        id: 'gen-3',
        title: 'タンパク質解析ワークフロー',
        content: `タンパク質解析の典型的なワークフロー：

1. 📥 配列/構造データ入力
2. 🧬 BioEMUでアンサンブル生成
3. 📊 コンフォメーション解析
4. 🔬 機能部位の特定
5. 📈 動態の可視化
6. 📤 構造データ出力`,
        position: 'center',
      },
    ],
  },
  {
    id: 'bioemu-guide',
    name: 'BioEMU Guide',
    nameJa: 'BioEMU活用ガイド',
    description: 'Learn to use BioEMU for protein analysis',
    descriptionJa: 'BioEMUを使ったタンパク質解析を学びます',
    category: 'model',
    domain: 'genomics',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    icon: '🔬',
    prerequisites: ['genomics-intro'],
    steps: [
      {
        id: 'be-1',
        title: 'BioEMUの概要',
        content: `BioEMUは、Flow Matchingを使用してタンパク質のコンフォメーションを生成します。

入力：
• アミノ酸配列（FASTA）
• 初期構造（PDB、オプション）

出力：
• 構造アンサンブル
• RMSF（柔軟性）プロファイル`,
        position: 'center',
      },
      {
        id: 'be-2',
        title: 'パラメータ設定',
        content: `重要なパラメータ：

sequence: アミノ酸配列
num_samples: 生成構造数
temperature: サンプリング温度
seed_structure: 初期構造（オプション）`,
        position: 'center',
      },
      {
        id: 'be-3',
        title: '結果の解析',
        content: `アンサンブルの解析方法：

• PCA: 主成分分析で主要な運動モードを特定
• クラスタリング: 代表構造の抽出
• RMSF: 残基ごとの柔軟性
• 接触確率: 残基間相互作用`,
        position: 'center',
      },
    ],
  },
];

// ============================================================================
// Analysis Tutorials
// ============================================================================

const ANALYSIS_TUTORIALS: Tutorial[] = [
  {
    id: 'graphrag-guide',
    name: 'GraphRAG Guide',
    nameJa: 'GraphRAG活用ガイド',
    description: 'Learn to use GraphRAG for literature analysis',
    descriptionJa: 'GraphRAGを使った文献解析を学びます',
    category: 'analysis',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    icon: '📚',
    steps: [
      {
        id: 'gr-1',
        title: 'GraphRAGとは',
        content: `GraphRAGは、文献からナレッジグラフを構築し、知識抽出を行うシステムです。

特徴：
• 自動的なエンティティ抽出
• 関係性のグラフ化
• 自然言語での質問応答
• 研究ギャップの発見`,
        position: 'center',
      },
      {
        id: 'gr-2',
        title: 'データの準備',
        content: `入力データ形式：

• PDF: 論文ファイル
• テキスト: 抄録、フルテキスト
• BibTeX: 書誌情報

推奨：関連する論文を50-200件程度収集。`,
        position: 'center',
      },
      {
        id: 'gr-3',
        title: '質問応答',
        content: `効果的な質問の例：

• 「〇〇材料の合成方法にはどのようなものがありますか？」
• 「△△の特性に影響する因子は何ですか？」
• 「この分野の研究トレンドは？」

質問は具体的にするほど良い回答が得られます。`,
        position: 'center',
      },
    ],
  },
  {
    id: 'visualization-guide',
    name: 'Visualization Guide',
    nameJa: '可視化ガイド',
    description: 'Learn to visualize research results',
    descriptionJa: '研究結果の可視化方法を学びます',
    category: 'analysis',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    icon: '📊',
    steps: [
      {
        id: 'vis-1',
        title: '可視化の重要性',
        content: `効果的な可視化は、データから洞察を得るために不可欠です。

LabFlowの可視化機能：
• 2D/3Dプロット
• 分子/結晶構造表示
• ヒートマップ
• 時系列グラフ`,
        position: 'center',
      },
      {
        id: 'vis-2',
        title: 'グラフの種類',
        content: `データに応じた適切なグラフ選択：

散布図: 2変数の関係
ヒストグラム: 分布の確認
箱ひげ図: 統計的比較
ヒートマップ: 相関関係
3D散布図: 多次元データ`,
        position: 'center',
      },
      {
        id: 'vis-3',
        title: '構造の可視化',
        content: `分子/結晶構造の可視化オプション：

表示モード：
• ボールアンドスティック
• スペースフィル
• リボン（タンパク質）

着色：
• 元素別
• 電荷
• 温度因子`,
        position: 'center',
      },
    ],
  },
];

// ============================================================================
// Export All Tutorials
// ============================================================================

export const ALL_TUTORIALS: Tutorial[] = [
  ...QUICKSTART_TUTORIALS,
  ...MATERIALS_TUTORIALS,
  ...DRUG_TUTORIALS,
  ...CLIMATE_TUTORIALS,
  ...GENOMICS_TUTORIALS,
  ...ANALYSIS_TUTORIALS,
];

export function getTutorialById(id: string): Tutorial | undefined {
  return ALL_TUTORIALS.find((t) => t.id === id);
}

export function getTutorialsByCategory(category: TutorialCategory): Tutorial[] {
  return ALL_TUTORIALS.filter((t) => t.category === category);
}

export function getTutorialsByDomain(domain: ResearchDomain): Tutorial[] {
  return ALL_TUTORIALS.filter((t) => t.domain === domain);
}

export function getRecommendedTutorials(
  completedIds: string[],
  domain?: ResearchDomain
): Tutorial[] {
  return ALL_TUTORIALS.filter((t) => {
    if (completedIds.includes(t.id)) return false;
    if (domain && t.domain && t.domain !== domain) return false;
    if (t.prerequisites?.some((p) => !completedIds.includes(p))) return false;
    return true;
  })
    .sort((a, b) => {
      // Prioritize quickstart > workflow > model > analysis > advanced
      const order = { quickstart: 0, workflow: 1, model: 2, analysis: 3, advanced: 4 };
      return order[a.category] - order[b.category];
    })
    .slice(0, 5);
}
