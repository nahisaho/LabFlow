# Product Context

**Project**: LabFlow
**Last Updated**: 2025-12-14
**Version**: 2.1

---

## Product Vision

**Vision Statement**: 科学研究を誰もがアクセスできる創造的な探求へ

> LabFlowは、AIの力を活用して科学発見のプロセスを民主化します。専門的な計算科学の知識がなくても、初心者研究者が最先端のAIモデルを使って仮説生成、候補スクリーニング、実験計画を行えるプラットフォームを提供します。Microsoft Discoveryの基盤モデル（MatterGen、MatterSim、Aurora、BioEmu、TamGen）へのアクセスを簡素化し、科学発見を加速させます。

**Mission**: ワークフローテンプレート、事前学習済みモデル統合、対話型チュートリアルを通じて、研究者がアイデアから発見までの道のりを短縮できるようにする

---

## Product Overview

### What is LabFlow?

LabFlow は「AI for Science スターターキット」です。創薬、材料科学、気候科学、ゲノミクスの4つの主要分野において、初心者研究者が科学発見ワークフローを構築・実行できる統合プラットフォームです。

従来、最先端のAIモデルを研究に活用するには、深い機械学習の知識、大規模な計算リソース、複雑なデータパイプラインの構築が必要でした。LabFlowはこれらの障壁を取り除き、研究者が「何を発見したいか」に集中できる環境を提供します。

GraphRAGによる文献知識の抽出、AIモデルによる候補生成、シミュレーションによる評価、反復的なスクリーニングという科学発見の本質的なフローをテンプレート化し、誰でも使えるようにします。

### Problem Statement

**Problem**: 科学研究におけるAI活用の障壁が高すぎる

> 初心者研究者や中小の研究機関は、以下の課題に直面しています：
> 1. **技術的障壁**: 最先端AIモデルの利用には専門的なMLの知識が必要
> 2. **コスト障壁**: GPU/計算リソースへのアクセスが限られている
> 3. **知識障壁**: 膨大な文献から関連知識を効率的に抽出できない
> 4. **ワークフロー障壁**: 発見プロセスの各ステップを繋ぐパイプライン構築が困難
> 5. **学習障壁**: AI for Scienceの学習リソースが分散・断片化している

### Solution

**Solution**: ワンストップの科学発見プラットフォーム

> LabFlowは以下の解決策を提供します：
> - **テンプレート化**: 実績のある発見ワークフローをすぐに使えるテンプレートとして提供
> - **モデル統合**: Microsoft Discoveryの基盤モデルへの簡単なアクセス
> - **GraphRAG**: 文献からのナレッジグラフ自動構築と仮説生成支援
> - **対話型チュートリアル**: 手を動かしながら学べる段階的な学習パス
> - **コラボレーション**: チームでの研究データ・知見の共有機能

---

## Target Users

### Primary Users

#### User Persona 1: 早川 美咲（Misaki Hayakawa）

**Demographics**:

- **Role**: 大学院修士課程（材料工学専攻）
- **Organization Size**: 国立大学の研究室（10名程度）
- **Technical Level**: Python基礎レベル、ML初心者

**Goals**:

- 修士論文のための新規材料候補を効率的に探索したい
- 先行研究を体系的に整理し、研究の位置づけを明確にしたい
- AIを使った研究手法を身につけてキャリアに活かしたい

**Pain Points**:

- 機械学習の論文を読んでも実装方法がわからない
- 計算リソースが限られており、大規模な探索ができない
- 文献調査に時間がかかりすぎて、実験に割く時間が減っている

**Use Cases**:

- MatterGenで新規熱電材料候補を生成し、MatterSimで安定性を評価
- GraphRAGで熱電材料の先行研究を整理し、研究ギャップを特定
- 学習モジュールでAI材料探索の基礎を習得

---

#### User Persona 2: 田中 健一（Kenichi Tanaka）

**Demographics**:

- **Role**: 製薬企業の研究員（創薬化学）
- **Organization Size**: 中堅製薬企業（500名）
- **Technical Level**: 化学専門家、プログラミング経験少

**Goals**:

- リード化合物の最適化を効率化したい
- 社内の過去の実験データを活用して予測精度を上げたい
- チーム内でのナレッジ共有を改善したい

**Pain Points**:

- 社内データが散在しており、統合的に活用できていない
- AIツールは多数あるが、どれを使えばいいかわからない
- IT部門への依頼なしに自分で分析を行いたい

**Use Cases**:

- TamGenでTAK-003ターゲットへの新規リガンド候補を生成
- My Lab Dataで社内実験データをGraphRAG化し、チームで共有
- スクリーニングワークフローで候補化合物を段階的に絞り込み

---

### Secondary Users

- **研究室PI（Principal Investigator）**: 研究室全体の進捗管理、リソース配分の意思決定
- **IT管理者**: システム管理、セキュリティ設定、ユーザー管理
- **バイオインフォマティシャン**: 高度なカスタマイズ、API統合、パイプライン構築

---

## Market & Business Context

### Market Opportunity

**Market Size**: AI for Science 市場は2030年までに$50B規模に成長予測（McKinsey, 2024）

**Target Market**: 
- 日本国内の大学・研究機関（約800機関）
- アジア太平洋地域の製薬・材料企業の研究部門
- 政府系研究機関（NIMS、AIST、理研等）

> AI for Science は急成長分野であり、特に創薬・材料科学での需要が高い。一方で、専門性の高さから利用者は限られている。LabFlowは「スターターキット」として、この市場の裾野を広げる役割を担う。

### Business Model

**Revenue Model**: SaaS サブスクリプション + 従量課金ハイブリッド

**Pricing Tiers**:

- **Free Tier（個人研究者）**: 
  - 機能: 学習モジュール全機能、基本ワークフローテンプレート
  - 制限: 計算時間 10時間/月、ストレージ 5GB
  
- **Pro Tier（研究室）**: ¥50,000/月
  - 機能: 全ワークフロー、My Lab Data、GraphRAG、チームコラボレーション（5名まで）
  - 制限: 計算時間 100時間/月、ストレージ 100GB
  
- **Enterprise Tier（企業・機関）**: カスタム価格
  - 機能: 全機能、オンプレミス/プライベートクラウド、SLA保証、21 CFR Part 11対応
  - 制限: 無制限（契約に基づく）

### Competitive Landscape

| Competitor | Strengths | Weaknesses | Our Differentiation |
|------------|-----------|------------|---------------------|
| Google Colab | 無料、簡単、広く使われている | AI for Science特化機能なし | 科学発見ワークフローのテンプレート化 |
| AWS SageMaker | 豊富な機能、スケーラブル | 学習曲線が急、高コスト | 初心者向けUI、対話型チュートリアル |
| Weights & Biases | 実験管理優秀、コミュニティ | 科学ドメイン知識なし | GraphRAG、Microsoft Discoveryモデル統合 |
| Schrodinger | 創薬特化、高精度 | 高価格、材料/気候/ゲノム非対応 | マルチドメイン対応、日本語サポート |

---

## Core Product Capabilities

### Must-Have Features (MVP)

1. **統合ダッシュボード**
   - **Description**: 分野別（創薬、材料、気候、ゲノム）のワークフロー入口
   - **User Value**: 迷わずに目的の機能にアクセスできる
   - **Priority**: P0 (Critical)

2. **ワークフローテンプレート**
   - **Description**: 実績ある発見パイプラインの定義済みテンプレート
   - **User Value**: ゼロから構築せずにすぐに研究を開始できる
   - **Priority**: P0 (Critical)

3. **学習モジュール**
   - **Description**: 段階的なハンズオンチュートリアル（Level 1-3）
   - **User Value**: AI for Scienceの基礎を体系的に学べる
   - **Priority**: P0 (Critical)

4. **モデルカタログ**
   - **Description**: Microsoft Discoveryモデル（MatterGen等）への統合インターフェース
   - **User Value**: 専門知識なしで最先端モデルを利用できる
   - **Priority**: P0 (Critical)

5. **自然言語インターフェース (NLI)** ✅ **Implemented**
   - **Description**: 日本語・英語での自然言語入力からワークフローを推薦
   - **User Value**: 「新しい材料を生成したい」のような自然な入力で始められる
   - **Priority**: P0 (Critical)
   - **Requirements**: DASH-NLI-001〜007
   - **Features**:
     - 日英自動言語検出
     - インテント分析（predict/generate/optimize/analyze/compare）
     - ドメイン検出（創薬/材料/気候/ゲノミクス/化学/物理）
     - 信頼度スコアと明確化質問生成

### High-Priority Features (Post-MVP)

5. **GraphRAG / ナレッジ抽出**
   - **Description**: 文献からのナレッジグラフ構築・検索
   - **User Value**: 文献調査の時間を大幅に短縮
   - **Priority**: P1 (High)

6. **スクリーニングワークフロー** ✅ **Implemented**
   - **Description**: 多段階フィルタリングによる候補絞り込み
   - **User Value**: 効率的に有望候補を特定できる
   - **Priority**: P1 (High)
   - **Features**:
     - Primary Screening: ルールベースフィルタリング
     - AI Screening: ML予測と不確実性推定
     - Simulation Screening: Docking, MD, FEP, DFT, Phonon

7. **My Lab Data**
   - **Description**: チーム共有のデータ・ナレッジ管理
   - **User Value**: 社内/研究室データの活用を促進
   - **Priority**: P1 (High)

### Future Features (Roadmap)

8. **実験計画最適化**
   - **Description**: ベイズ最適化による次実験パラメータ推薦
   - **User Value**: 実験回数を削減し、効率的に最適解に到達
   - **Priority**: P2 (Medium)

9. **仮説生成支援**
   - **Description**: GraphRAGに基づく研究仮説の自動提案
   - **User Value**: 新しい研究アイデアの発見を支援
   - **Priority**: P2 (Medium)

10. **論文執筆支援**
    - **Description**: 発見レポートからの論文ドラフト生成
    - **User Value**: 論文執筆の負担を軽減
    - **Priority**: P3 (Low)

---

## Product Principles

### Design Principles

1. **Progressive Complexity（段階的複雑性）**
   - 初心者はシンプルなUIで始め、習熟に応じて高度な機能が現れる
   - デフォルト値を賢く設定し、必要な入力を最小化

2. **Science-First（科学優先）**
   - 技術的な詳細より科学的な問いに焦点を当てるUI
   - 専門家が見ても納得できる科学的厳密性を維持

3. **Reproducibility（再現性）**
   - すべての実行はバージョン管理され、再現可能
   - パラメータ、データ、モデルバージョンの完全な追跡

### User Experience Principles

1. **ガイド付き探索（Guided Exploration）**
   - 次のステップを常に提案し、迷子にさせない
   - インラインヘルプとコンテキスト説明を充実

2. **即時フィードバック（Instant Feedback）**
   - 長時間の計算でも進捗を可視化
   - エラー時は具体的な解決策を提示

3. **日本語ファースト（Japanese First）**
   - 全UI・ドキュメントを自然な日本語で提供
   - 専門用語には解説を付与

---

## Success Metrics

### Key Performance Indicators (KPIs)

#### Business Metrics

| Metric | Target (Year 1) | Measurement |
|--------|-----------------|-------------|
| **Monthly Active Users (MAU)** | 5,000 | Analytics |
| **Monthly Recurring Revenue (MRR)** | ¥10M | Billing system |
| **Customer Acquisition Cost (CAC)** | ¥30,000 | Marketing spend / New customers |
| **Customer Lifetime Value (LTV)** | ¥600,000 | Avg. subscription × Avg. tenure |
| **Churn Rate** | < 5% | Subscription cancellations |

#### Product Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Daily Active Users (DAU)** | 1,000 | Analytics |
| **Workflow Completion Rate** | > 70% | Event tracking |
| **Learning Module Completion** | > 50% | Progress tracking |
| **Net Promoter Score (NPS)** | > 40 | User survey |
| **Time to First Value** | < 30 min | Onboarding funnel |

#### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Response Time (p95)** | < 500ms | Application Insights |
| **Uptime** | 99.9% | Azure Monitor |
| **Error Rate** | < 0.1% | Error tracking |
| **Page Load Time (LCP)** | < 2.5s | Web vitals |

---

## Product Roadmap

### Phase 1: MVP (Month 1-3)

**Goal**: コア機能の提供と初期ユーザー獲得

**Features**:
- 統合ダッシュボード
- 材料科学ワークフローテンプレート（MatterGen + MatterSim）
- Level 1 学習モジュール（AI for Science 基礎）
- モデルカタログ（MatterGen、MatterSim）
- 基本的なデータ管理

**Success Criteria**:
- 100名のベータユーザー獲得
- NPS > 30
- 重大バグ 0件

---

### Phase 2: Growth (Month 4-6)

**Goal**: 機能拡充と利用拡大

**Features**:
- 創薬ワークフローテンプレート（TamGen + BioEmu）
- GraphRAG / ナレッジ抽出
- スクリーニングワークフロー
- Level 2 学習モジュール（分野別入門）
- My Lab Data（チームデータ共有）

**Success Criteria**:
- MAU 1,000
- 有料顧客 20社
- ワークフロー完了率 > 60%

---

### Phase 3: Scale (Month 7-12)

**Goal**: エンタープライズ対応と収益化

**Features**:
- 気候科学ワークフロー（Aurora）
- ゲノミクスワークフロー
- 実験計画最適化
- 仮説生成支援
- Enterprise機能（SSO、監査ログ、21 CFR Part 11）
- Level 3 学習モジュール（実践プロジェクト）

**Success Criteria**:
- MAU 5,000
- MRR ¥10M
- Enterprise 顧客 5社

---

## User Workflows

### Primary Workflow 1: 新規材料発見

**User Goal**: 目標特性を持つ新規材料候補を効率的に発見する

**Steps**:

1. User: ダッシュボードから「材料科学」→「新規材料探索」テンプレートを選択
2. System: テンプレートウィザードを表示（目標特性の入力を促す）
3. User: 目標特性（例: バンドギャップ 1.5-2.0 eV、熱伝導率 < 5 W/mK）を入力
4. System: MatterGenで候補を生成（100件）し、結果リストを表示
5. User: スクリーニング条件を設定（安定性、合成可能性）
6. System: MatterSimで安定性を評価し、上位候補（10件）をハイライト
7. User: 候補の詳細を確認し、有望なものを「お気に入り」に保存
8. System: レポートを生成し、次のステップ（実験検証）を提案

**Success Criteria**:
- ワークフロー完了時間 < 2時間
- 有望候補特定成功率 > 80%

---

### Primary Workflow 2: 文献知識の構造化

**User Goal**: 研究テーマに関する文献を体系的に整理し、研究ギャップを特定する

**Steps**:

1. User: 「ナレッジ抽出」から研究テーマを入力（例: 「ペロブスカイト太陽電池の安定性」）
2. System: 関連文献を自動収集（または手動アップロードを受付）
3. User: 収集された文献リストを確認・調整
4. System: GraphRAGでナレッジグラフを構築し、可視化
5. User: グラフを探索し、エンティティ間の関係を確認
6. System: 知識ギャップ（研究が不足している領域）をハイライト
7. User: ギャップに基づいて研究仮説を選択
8. System: 選択した仮説を「研究ノート」に保存し、関連文献をリンク

**Success Criteria**:
- グラフ構築時間 < 30分（100論文の場合）
- ユーザー満足度 > 4.0 / 5.0

---

## Business Domain

### Domain Concepts

1. **ワークフローテンプレート**: 科学発見プロセスの定義済みパイプライン。入力→処理→出力の一連のステップを定義
2. **基盤モデル（Foundation Model）**: 大規模データで事前学習されたAIモデル（MatterGen、Aurora等）
3. **GraphRAG**: グラフ構造のナレッジベースと検索拡張生成を組み合わせた技術
4. **スクリーニング**: 大量の候補から条件に合致するものを段階的に絞り込むプロセス
5. **実験計画最適化**: ベイズ最適化等を用いて効率的に最適解を探索する手法

### Business Rules

1. **データ所有権**
   - ユーザーがアップロードしたデータはユーザーに帰属
   - システムは分析目的でのみデータを使用し、第三者と共有しない
   - **Example**: My Lab Dataにアップロードされた社内実験データは、明示的な許可なしにモデル訓練に使用されない

2. **計算リソース管理**
   - 各ティアの計算時間上限を超えた場合、ジョブはキューイングされる
   - 優先度: Enterprise > Pro > Free
   - **Example**: Free Tierユーザーが月間10時間を超えた場合、翌月までジョブ投入が制限される

---

## Constraints & Requirements

### Business Constraints

- **Budget**: 初年度開発予算 ¥50M
- **Timeline**: MVP リリース 2026年3月
- **Team Size**: 5名（フルタイム換算）
- **Launch Date**: MVP 2026年3月、GA 2026年9月

### Compliance Requirements

- **個人情報保護法**: 日本の個人情報保護法に準拠
- **GDPR**: EU圏ユーザー向けにGDPR準拠オプション
- **21 CFR Part 11**: 製薬企業向けに電子記録規制対応オプション
- **Data Residency**: 日本国内データは日本リージョンに保存

### Non-Functional Requirements

- **Performance**: API応答 < 500ms (95パーセンタイル)
- **Availability**: 99.9% 稼働率 SLA
- **Scalability**: 1,000同時接続ユーザーをサポート
- **Security**: OWASP Top 10 準拠、SOC 2 Type II 取得目標
- **Accessibility**: WCAG 2.1 AA 準拠

---

## Risk Assessment

### Product Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Microsoft Discoveryモデルの利用制限 | Medium | High | 代替モデル（OSS）の評価を並行実施 |
| 初心者に複雑すぎて使われない | Medium | High | ユーザーテストを早期・頻繁に実施 |
| 計算コストが想定を超える | Medium | Medium | 利用上限の設定、コスト監視 |
| 競合の参入 | Low | Medium | 差別化機能（日本語、学習コンテンツ）の強化 |
| セキュリティインシデント | Low | High | 定期的なペネトレーションテスト、WAF導入 |

---

## Integrations

### Existing Integrations

| Integration | Purpose | Priority |
|-------------|---------|----------|
| Azure AD B2C | ユーザー認証 | P0 |
| Azure OpenAI Service | LLM機能（要約、Q&A） | P0 |
| Microsoft GraphRAG | ナレッジグラフ構築 | P0 |

### Planned Integrations

| Integration | Purpose | Timeline |
|-------------|---------|----------|
| ChEMBL / PubChem | 化合物データベース連携 | Phase 2 |
| Materials Project | 材料データベース連携 | Phase 2 |
| Jupyter Hub | ノートブック環境連携 | Phase 2 |
| Slack / Teams | 通知連携 | Phase 3 |

---

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-12 | テンプレート作成 | MUSUBI |
| 2.0 | 2025-12-13 | LabFlow向けに全面具体化 | Claude |
| 2.1 | 2025-12-14 | NLI/Screening実装状況を追加 | Claude |

---

**Last Updated**: 2025-12-14
**Maintained By**: LabFlow Product Team
