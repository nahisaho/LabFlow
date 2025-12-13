# Technology Stack

**Project**: LabFlow
**Last Updated**: 2025-12-14
**Status**: 決定済み
**Version**: 1.1

---

## Overview

LabFlow は AI for Science スターターキットとして、初心者研究者が科学発見ワークフローを簡単に構築・実行できるプラットフォームです。本ドキュメントでは、プロジェクトの技術スタックを定義します。

---

## 技術選定の原則

1. **Library-First (Article I)**: すべての機能は再利用可能なライブラリとして実装
2. **CLI Interface (Article II)**: すべてのライブラリはCLIインターフェースを提供
3. **Test-First (Article III)**: テストカバレッジ80%以上を維持
4. **TypeScript First**: 型安全性とDXを重視
5. **Azure Native**: Microsoft Discovery との統合を考慮

---

## Primary Technology Stack

### 言語・ランタイム

| Aspect | Technology | Version | Rationale |
|--------|------------|---------|-----------|
| Primary Language | **TypeScript** | 5.x | 型安全性、エコシステムの充実、フロント・バックエンド統一 |
| Secondary Language | **Python** | 3.11+ | AI/MLライブラリ連携（GraphRAG、scikit-learn等） |
| Runtime (Backend) | **Node.js** | 20 LTS | TypeScriptネイティブサポート、Azure Functions対応 |
| Runtime (AI/ML) | **Python** | 3.11+ | AI/MLライブラリ実行環境 |

### Python SDK（Notebook 統合）

| Aspect | Technology | Version | Rationale |
|--------|------------|---------|-----------|
| Package Manager | **uv** | latest | 高速、pip互換 |
| HTTP Client | **httpx** | 0.27+ | 非同期対応、型ヒント |
| Data Processing | **pandas** | 2.x | DataFrame操作、研究者に馴染み深い |
| Interactive UI | **ipywidgets** | 8.x | Notebook内パラメータ入力 |
| Visualization | **plotly** | 5.x | インタラクティブ可視化 |
| Type Hints | **pydantic** | 2.x | 設定・バリデーション |

### フロントエンド

| Aspect | Technology | Version | Rationale |
|--------|------------|---------|-----------|
| Framework | **Next.js** | 15.x | App Router、RSC、エッジ対応 |
| UI Library | **React** | 19.x | コンポーネント指向、エコシステム |
| Styling | **Tailwind CSS** | 4.x | ユーティリティファースト、高速開発 |
| Component Library | **shadcn/ui** | latest | カスタマイズ可能、アクセシビリティ |
| State Management | **Zustand** | 5.x | シンプル、TypeScript親和性 |
| Data Fetching | **TanStack Query** | 5.x | キャッシュ、楽観的更新 |
| Forms | **React Hook Form** + **Zod** | 7.x / 3.x | バリデーション、型安全 |
| Charts/Visualization | **Recharts** + **Plotly.js** | 2.x / 2.x | 科学データ可視化 |
| 3D Molecular Viewer | **3Dmol.js** | latest | 分子構造表示 |

### バックエンド

| Aspect | Technology | Version | Rationale |
|--------|------------|---------|-----------|
| API Framework | **Hono** | 4.x | 軽量、TypeScript、エッジ対応 |
| API Specification | **OpenAPI 3.1** | - | 標準仕様、自動ドキュメント |
| Validation | **Zod** | 3.x | ランタイム型検証 |
| ORM | **Drizzle ORM** | 0.3x | 型安全、SQLファースト |
| Authentication | **マルチプロバイダー** | - | ローカル / Entra ID / Shibboleth 切替 |
| Authorization | **CASL** | 6.x | RBAC/ABAC実装 |
| Background Jobs | **BullMQ** | 5.x | Redis ベースのジョブキュー |
| File Storage | **Azure Blob Storage** | - | 大容量ファイル管理 |

### AI/ML インテグレーション

| Aspect | Technology | Rationale |
|--------|------------|-----------|
| LLM Abstraction | **Esperanto** | プロバイダー統一インターフェース、軽量 |
| LLM (開発) | **Ollama** (Windows) | ローカルLLM、無料、オフライン開発 |
| LLM (本番) | **Azure OpenAI Service** | GPT-4o、スケーラブル |
| GraphRAG | **Microsoft GraphRAG** | ナレッジグラフ構築・検索 |
| ML Framework | **PyTorch** | Microsoft Discovery モデル |
| Model Serving | **Azure ML Endpoints** | スケーラブル推論 |
| Vector Database | **Azure AI Search** | ベクトル検索、ハイブリッド検索 |

### ドキュメント前処理

| Aspect | Technology | Version | Rationale |
|--------|------------|---------|-----------|
| PDF 処理 | **Azure AI Document Intelligence** | Layout API | 構造化抽出、document map 生成 |
| 非PDF処理 | **unstructured** | 0.16.x | DOCX/HTML/CSV/PPTX等の前処理 |
| 画像 OCR | **Azure Computer Vision API** | - | 画像内テキスト抽出 |

> **Note**: unstructured ライブラリは以下のエクストラを使用:
> `unstructured[csv,doc,docx,email,html,md,msg,ppt,pptx,text,xlsx,xml]`
> 
> 対応フォーマット: PDF, DOCX, DOC, HTML, HTM, CSV, MD, PPTX, PPT, TXT, JSON, XLSX, XML, EML, MSG

### データベース

| Aspect | Technology | Version | Rationale |
|--------|------------|---------|-----------|
| Primary Database | **PostgreSQL** | 16 | ACID、JSON対応、拡張性 |
| Managed Service | **Azure Database for PostgreSQL** | Flexible Server | マネージド、自動バックアップ |
| Vector Extension | **pgvector** | 0.7+ | 埋め込みベクトル保存 |
| Cache | **Redis** | 7.x | セッション、キャッシュ、ジョブキュー |
| Managed Cache | **Azure Cache for Redis** | - | マネージド Redis |
| Graph Database | **Azure Cosmos DB (Gremlin API)** | - | ナレッジグラフ保存（オプション） |

### インフラストラクチャ

| Aspect | Technology | Rationale |
|--------|------------|-----------|
| Cloud Provider | **Microsoft Azure** | Microsoft Discovery 統合 |
| Container Runtime | **Azure Container Apps** | サーバーレスコンテナ |
| Serverless Functions | **Azure Functions** | イベント駆動処理 |
| CDN | **Azure Front Door** | グローバル配信 |
| DNS | **Azure DNS** | DNS管理 |
| Secret Management | **Azure Key Vault** | シークレット管理 |
| Monitoring | **Azure Monitor** + **Application Insights** | 可観測性 |

### 開発ツール

| Aspect | Technology | Version | Rationale |
|--------|------------|---------|-----------|
| Package Manager | **pnpm** | 9.x | 高速、ディスク効率 |
| Monorepo Tool | **Turborepo** | 2.x | ビルドキャッシュ、並列実行 |
| Build Tool | **Vite** / **tsup** | 6.x / 8.x | 高速ビルド |
| Linter | **ESLint** + **Biome** | 9.x / 1.x | コード品質 |
| Formatter | **Biome** | 1.x | 高速フォーマット |
| Testing | **Vitest** | 2.x | Vite ネイティブ、高速 |
| E2E Testing | **Playwright** | 1.x | クロスブラウザ |
| API Testing | **Bruno** / **Hoppscotch** | - | API開発・テスト |
| Container | **Docker** | 24+ | ローカル開発環境 |
| IaC | **Bicep** | - | Azure Infrastructure as Code |
| CI/CD | **GitHub Actions** | - | 自動化パイプライン |

---

## Monorepo Structure

```
LabFlow/
├── packages/
│   ├── core/              # コアライブラリ（Article I）
│   │   ├── auth/          # 認証プロバイダー
│   │   ├── db/            # データベーススキーマ (Drizzle)
│   │   ├── knowledge/     # RAGサービス、ドキュメント処理
│   │   ├── model-catalog/ # AIモデルカタログ・実行
│   │   ├── nli/           # 自然言語インターフェース (日英対応)
│   │   ├── plugin/        # プラグインマネージャー
│   │   ├── project/       # プロジェクト管理
│   │   ├── screening/     # スクリーニングロジック
│   │   ├── visualization/ # 可視化ユーティリティ
│   │   └── workflow/      # ワークフローエンジン
│   ├── cli/               # CLIツール（Article II）
│   │   ├── labflow/       # メインCLI
│   │   └── scripts/       # ユーティリティスクリプト
│   ├── python/            # Python SDK（Notebook統合用）
│   │   ├── labflow/       # labflow パッケージ
│   │   │   ├── workflow.py    # ワークフロー実行
│   │   │   ├── visualize.py   # 可視化ヘルパー
│   │   │   └── widgets.py     # ipywidgets 統合
│   │   └── notebooks/     # テンプレート Notebook
│   │       ├── drug-discovery/
│   │       ├── materials/
│   │       ├── climate/
│   │       └── genomics/
│   └── web/               # Webアプリケーション
│       ├── app/           # Next.js App Router
│       ├── components/    # UIコンポーネント
│       └── api/           # API Routes
├── plugins/               # 公式プラグイン
│   ├── drug-discovery/    # 創薬プラグイン
│   ├── materials/         # 材料科学プラグイン
│   ├── climate/           # 気候・環境プラグイン
│   └── genomics/          # ゲノミクスプラグイン
├── services/              # バックエンドサービス
│   ├── api/               # REST API (Hono)
│   ├── worker/            # バックグラウンドワーカー
│   └── ml/                # ML推論サービス（Python）
├── infra/                 # インフラストラクチャ
│   ├── bicep/             # Azure Bicep テンプレート
│   └── docker/            # Docker設定
├── tests/                 # 統合テスト
│   ├── e2e/               # E2Eテスト
│   └── integration/       # 統合テスト
├── docs/                  # ドキュメント
│   ├── api/               # API仕様（OpenAPI）
│   └── guides/            # ユーザーガイド
├── steering/              # プロジェクトメモリ
├── storage/               # SDD成果物
└── templates/             # テンプレート
```

---

## 依存関係グラフ

```
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │Azure AD  │ │Azure ML  │ │Azure     │ │ External DBs │   │
│  │B2C       │ │Endpoints │ │OpenAI    │ │ (ChEMBL等)   │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘   │
└───────┼────────────┼────────────┼──────────────┼───────────┘
        │            │            │              │
┌───────▼────────────▼────────────▼──────────────▼───────────┐
│                     API Layer (Hono)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Authentication │ Rate Limiting │ Request Validation │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────┬──────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────┐
│                   packages/core/                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ domain   │ │ workflow │ │ graphrag │ │screening │      │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │
│       └────────────┴────────────┴────────────┘             │
└─────────────────────────────┬──────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────┐
│                   Data Layer                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ PostgreSQL   │ │ Redis        │ │ Blob Storage │        │
│  │ (+ pgvector) │ │ (Cache/Queue)│ │ (Files)      │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└────────────────────────────────────────────────────────────┘
```

---

## 環境構成

### 開発環境（Local）

```yaml
# docker-compose.yml
services:
  postgres:
    image: pgvector/pgvector:pg16
    ports: ["5432:5432"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  azurite:
    image: mcr.microsoft.com/azure-storage/azurite
    ports: ["10000:10000", "10001:10001"]
```

### ステージング環境（Azure）

| Service | SKU | Purpose |
|---------|-----|---------|
| Container Apps | Consumption | Web/API |
| PostgreSQL | Burstable B1ms | Database |
| Redis | Basic C0 | Cache |
| Blob Storage | Standard LRS | Files |

### 本番環境（Azure）

| Service | SKU | Purpose |
|---------|-----|---------|
| Container Apps | Dedicated D4 | Web/API |
| PostgreSQL | GP Standard D2s v3 | Database |
| Redis | Standard C1 | Cache |
| Blob Storage | Standard GRS | Files |
| Front Door | Standard | CDN/WAF |

---

## セキュリティ要件

### 認証・認可（マルチプロバイダー対応）

- **ローカル認証**: メール/パスワード + JWT（開発環境、小規模利用）
- **Microsoft Entra ID**: OAuth 2.0 / OIDC（企業向け）
- **Shibboleth**: SAML 2.0（学術機関、学認連携）
- **切替**: 環境変数 `AUTH_PROVIDER` で設定
- JWT トークンベースのAPI認証
- RBAC (Role-Based Access Control) によるリソース認可
- API Key 認証（外部連携用）

### データ保護

- TLS 1.3 による通信暗号化
- Azure Key Vault によるシークレット管理
- PostgreSQL: TDE (Transparent Data Encryption)
- Blob Storage: SSE (Server-Side Encryption)

### コンプライアンス

- GDPR 対応（データ削除、エクスポート）
- HIPAA 対応モード（オプション）
- 21 CFR Part 11 対応モード（オプション）

---

## パフォーマンス目標

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load (LCP) | < 2.5s | Lighthouse |
| API Response (P95) | < 500ms | Application Insights |
| Search Latency | < 1s | Custom metrics |
| Concurrent Users | 1,000+ | Load testing |
| Database Query (P95) | < 100ms | Query insights |

---

## 決定履歴 (ADR)

### ADR-001: TypeScript をプライマリ言語として採用

**Status**: Accepted
**Date**: 2025-12-13

**Context**: フロントエンド、バックエンド、CLIを統一した言語で開発したい

**Decision**: TypeScript を採用

**Rationale**:
- 型安全性による開発効率向上
- フロント・バック間での型共有
- 豊富なエコシステム
- Azure Functions との親和性

### ADR-002: Hono をAPIフレームワークとして採用

**Status**: Accepted
**Date**: 2025-12-13

**Context**: 軽量でエッジ対応のAPIフレームワークが必要

**Decision**: Hono を採用（Express、Fastify の代替）

**Rationale**:
- TypeScript ネイティブ
- エッジランタイム対応（Cloudflare、Vercel Edge）
- Web Standards 準拠
- Express 互換のミドルウェア

### ADR-003: PostgreSQL + pgvector をプライマリDBとして採用

**Status**: Accepted
**Date**: 2025-12-13

**Context**: リレーショナルデータとベクトルデータの両方を扱う必要がある

**Decision**: PostgreSQL + pgvector を採用

**Rationale**:
- 単一DBで両方のワークロードを処理
- Azure Database for PostgreSQL のマネージドサービス
- 豊富な拡張機能
- 運用実績と信頼性

---

## Reference Implementations

LabFlowの実装において参照するオープンソースプロジェクト：

### Microsoft GraphRAG

- **リポジトリ**: `References/graphrag`
- **用途**: ナレッジグラフ構築・検索機能の実装参照
- **主要コンポーネント**:

| ディレクトリ | 説明 |
|------------|------|
| `graphrag/api/` | GraphRAG API インターフェース |
| `graphrag/index/` | インデックス構築パイプライン |
| `graphrag/query/` | クエリ処理（Local/Global Search） |
| `graphrag/config/` | 設定管理 |
| `graphrag/data_model/` | データモデル定義 |
| `graphrag/prompt_tune/` | プロンプトチューニング |
| `graphrag/vector_stores/` | ベクトルストア統合 |
| `graphrag/language_model/` | LLM統合 |

- **統合方針**: 
  - `packages/core/graphrag/` でTypeScriptラッパーを実装
  - PythonバックエンドとREST API経由で連携
  - Azure OpenAI Serviceと組み合わせて使用

### Esperanto (LLM統一インターフェース)

- **リポジトリ**: `References/esperanto`
- **用途**: LLM/Embedding/STT/TTS プロバイダーの統一インターフェース
- **主要コンポーネント**:

| ディレクトリ | 説明 |
|------------|------|
| `src/esperanto/providers/llm/` | LLMプロバイダー（OpenAI, Anthropic, Ollama等） |
| `src/esperanto/providers/embedding/` | 埋め込みプロバイダー |
| `src/esperanto/providers/stt/` | Speech-to-Text |
| `src/esperanto/providers/tts/` | Text-to-Speech |
| `src/esperanto/providers/reranker/` | リランキング |
| `src/esperanto/factory.py` | プロバイダーファクトリー |

- **対応プロバイダー**: OpenAI, Azure OpenAI, Anthropic, Ollama, Groq, Google GenAI, Vertex AI, Mistral, DeepSeek, xAI 等 17+
- **統合方針**:
  - `services/ml/` でeperantoをLLMアクセス層として使用
  - 開発時は Ollama (Windows) を使用、本番は Azure OpenAI
  - プロバイダー切り替えは環境変数で制御

### その他リファレンス

| プロジェクト | 場所 | 用途 |
|------------|------|------|
| py-gpt | `References/py-gpt` | AIエージェント実装参照 |

---

## 開発環境設定

### LLM プロバイダー設定

```bash
# 開発環境（Ollama on Windows）
LLM_PROVIDER=ollama
OLLAMA_HOST=http://<windows-ip>:11434
OLLAMA_MODEL=llama3.2

# 本番環境（Azure OpenAI）
LLM_PROVIDER=azure_openai
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

### Windows Ollama へのアクセス

WSL2/Linux から Windows の Ollama にアクセスする場合：

```bash
# Windows の IP アドレスを確認
ip route show | grep -i default | awk '{ print $3}'

# または固定で設定
OLLAMA_HOST=http://host.docker.internal:11434  # Docker環境
OLLAMA_HOST=http://$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):11434  # WSL2
```

---

*Last Updated: 2025-12-14 by Claude*

---

## 実装済み機能の詳細

### NLI (自然言語インターフェース) モジュール

| 要件ID | 機能 | 説明 |
|--------|------|------|
| DASH-NLI-001 | 日英入力対応 | 日本語/英語の自動検出 (文字種比率ベース) |
| DASH-NLI-002 | インテント分析 | 入力からワークフロー推薦を生成 |
| DASH-NLI-003 | 情報抽出 | ドメイン、対象プロパティ、データ形式の抽出 |
| DASH-NLI-004 | 明確化質問 | 信頼度が低い場合の補足質問生成 |
| DASH-NLI-007 | 入力パターン認識 | predict/generate/optimize/analyze/compare |

**対応ドメイン**: 創薬 (drug-discovery), 材料 (materials), 気候 (climate), ゲノミクス (genomics), 化学 (chemistry), 物理 (physics)

**対応データ形式**: PDB, FASTA, SMILES, SDF, CIF, CSV, JSON, NetCDF, XYZ

### Screening モジュール

| タイプ | クラス | 説明 |
|--------|--------|------|
| Primary | `PrimaryScreening` | ルールベースフィルタリング（閾値条件） |
| AI | `AIScreening` | ML予測、アンサンブル、不確実性推定 |
| Simulation | `SimulationScreening` | Docking, MD, FEP, DFT, Phonon |

### Knowledge モジュール

| コンポーネント | 機能 |
|--------------|------|
| `KnowledgeBase` | ナレッジベース管理 |
| `DocumentProcessor` | ドキュメント前処理・チャンキング |
| `RAGService` | 検索拡張生成 |
| `VectorStore` | ベクトル検索 |
| `SemanticSearch` | セマンティック検索 |
| `EmbeddingProvider` | 埋め込みベクトル生成 |

### Auth モジュール

| プロバイダー | 認証方式 |
|------------|----------|
| `LocalAuthProvider` | メール/パスワード + JWT |
| `EntraIDProvider` | OAuth 2.0 / OIDC |
| `ShibbolethProvider` | SAML 2.0 (学術機関向け) |

---

## 決定履歴 (ADR) 追加

### ADR-004: NLI モジュールのキーワードベース実装

**Status**: Accepted
**Date**: 2025-12-14

**Context**: ユーザーの自然言語入力からインテントとドメインを検出する必要がある

**Decision**: 初期実装としてキーワードマッチングベースの手法を採用

**Rationale**:
- LLM依存なしで高速に処理可能
- 科学分野固有のキーワードで高精度
- 将来的なLLMベース実装への拡張が容易

### ADR-005: Screening パイプラインの3層構造

**Status**: Accepted
**Date**: 2025-12-14

**Context**: 科学発見における候補スクリーニングを効率化する必要がある

**Decision**: Primary → AI → Simulation の3層スクリーニングを採用

**Rationale**:
- Primary: 高速なルールベースで大量候補を絞り込み
- AI: ML予測で有望候補を選定
- Simulation: 高精度シミュレーションで最終評価
- 計算コストとスループットの最適化
