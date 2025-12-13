# LabFlow 設計仕様書

**Project**: LabFlow
**Last Updated**: 2025-12-13
**Version**: 1.0
**Status**: Draft

---

## 1. はじめに

### 1.1 目的

本ドキュメントは、LabFlow の システムアーキテクチャ、コンポーネント設計、データベース設計、API設計を定義します。要件定義書（`ai_for_science_starter_kit_requirements.md`）から導出された設計を記述し、実装への橋渡しを行います。

### 1.2 スコープ

- MVP（Phase 1）の設計
- 将来拡張を考慮した基盤設計

### 1.3 参照ドキュメント

| 文書 | 場所 |
|------|------|
| 要件定義書 | `storage/specs/ai_for_science_starter_kit_requirements.md` |
| 技術スタック | `steering/tech.ja.md` |
| アーキテクチャパターン | `steering/structure.ja.md` |
| 憲法 | `steering/rules/constitution.md` |

---

## 2. C4モデル

### 2.1 Level 1: System Context

LabFlowシステムと外部アクターの関係を示します。

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              System Context                                      │
│                                                                                  │
│    ┌──────────────┐                                      ┌──────────────────┐   │
│    │   研究者     │                                      │ Microsoft        │   │
│    │  (Primary)   │                                      │ Discovery        │   │
│    └──────┬───────┘                                      │ (MatterGen等)    │   │
│           │                                              └────────┬─────────┘   │
│           │ Webブラウザ/CLI                                       │ API         │
│           ▼                                                       │             │
│    ┌──────────────────────────────────────────────┐              │             │
│    │                                              │◄─────────────┘             │
│    │              LabFlow System                  │                             │
│    │                                              │◄─────────────┐             │
│    │  - 統合ダッシュボード                          │              │             │
│    │  - ワークフロー実行                           │              │             │
│    │  - GraphRAG/ナレッジ抽出                      │   ┌─────────┴─────────┐   │
│    │  - 学習モジュール                             │   │ 外部データベース    │   │
│    │  - モデルカタログ                             │   │ - ChEMBL          │   │
│    │                                              │   │ - PubChem         │   │
│    └──────────────────────────────────────────────┘   │ - Materials Proj  │   │
│           │                                           └───────────────────┘   │
│           │                                                                     │
│           ▼                                                                     │
│    ┌──────────────┐                                                            │
│    │ IT管理者     │                                                            │
│    │ (Secondary)  │                                                            │
│    └──────────────┘                                                            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Level 2: Container Diagram

LabFlowを構成するコンテナ（デプロイ単位）を示します。

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              LabFlow System                                      │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Frontend Layer                                   │   │
│  │  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐       │   │
│  │  │   Web App       │   │    CLI Tool     │   │   SDK (Python)  │       │   │
│  │  │   (Next.js)     │   │   (TypeScript)  │   │                 │       │   │
│  │  │   Port: 3000    │   │                 │   │                 │       │   │
│  │  └────────┬────────┘   └────────┬────────┘   └────────┬────────┘       │   │
│  └───────────┼─────────────────────┼─────────────────────┼─────────────────┘   │
│              │                     │                     │                      │
│              └──────────────────┬──┴─────────────────────┘                      │
│                                 │ HTTPS/REST                                    │
│                                 ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         API Layer                                        │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                      API Gateway (Hono)                          │   │   │
│  │  │                      Port: 8080                                  │   │   │
│  │  │  - Authentication (Azure AD B2C)                                 │   │   │
│  │  │  - Rate Limiting                                                 │   │   │
│  │  │  - Request Validation                                            │   │   │
│  │  │  - API Routing                                                   │   │   │
│  │  └──────────────────────────────┬──────────────────────────────────┘   │   │
│  └─────────────────────────────────┼───────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Core Services (packages/core)                    │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐ │   │
│  │  │   Workflow    │ │   GraphRAG    │ │   Model       │ │  Screening  │ │   │
│  │  │   Engine      │ │   Service     │ │   Catalog     │ │  Engine     │ │   │
│  │  └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └──────┬──────┘ │   │
│  │          │                 │                 │                │        │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐ │   │
│  │  │   Learning    │ │   MyLabData   │ │   Experiment  │ │  Hypothesis │ │   │
│  │  │   Module      │ │   Manager     │ │   Optimizer   │ │  Generator  │ │   │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ └─────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Background Jobs                                  │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐ │   │
│  │  │                    Job Queue (BullMQ + Redis)                      │ │   │
│  │  │  - Workflow Execution Jobs                                         │ │   │
│  │  │  - Model Inference Jobs                                            │ │   │
│  │  │  - GraphRAG Indexing Jobs                                          │ │   │
│  │  │  - Literature Crawling Jobs                                        │ │   │
│  │  └───────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Data Layer                                       │   │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐           │   │
│  │  │  PostgreSQL     │ │  Redis          │ │  Blob Storage   │           │   │
│  │  │  (+ pgvector)   │ │  (Cache/Queue)  │ │  (Files)        │           │   │
│  │  │                 │ │                 │ │                 │           │   │
│  │  │  - Users        │ │  - Sessions     │ │  - Datasets     │           │   │
│  │  │  - Workflows    │ │  - Cache        │ │  - Models       │           │   │
│  │  │  - Results      │ │  - Job Queue    │ │  - Documents    │           │   │
│  │  │  - Embeddings   │ │                 │ │                 │           │   │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Level 3: Component Diagram（Workflow Engine）

Workflow Engineの内部コンポーネントを示します。

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         Workflow Engine (packages/core/workflow)                 │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                              Domain Layer                                  │ │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐             │ │
│  │  │  Workflow       │ │  Step           │ │  Execution      │             │ │
│  │  │  (Aggregate)    │ │  (Entity)       │ │  (Entity)       │             │ │
│  │  │                 │ │                 │ │                 │             │ │
│  │  │  - id           │ │  - id           │ │  - id           │             │ │
│  │  │  - name         │ │  - type         │ │  - workflowId   │             │ │
│  │  │  - templateId   │ │  - config       │ │  - status       │             │ │
│  │  │  - steps[]      │ │  - order        │ │  - startedAt    │             │ │
│  │  │  - status       │ │  - dependencies │ │  - completedAt  │             │ │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘             │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                          │
│                                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                           Application Layer                                │ │
│  │  ┌─────────────────────────────┐ ┌─────────────────────────────┐         │ │
│  │  │  WorkflowService            │ │  ExecutionService            │         │ │
│  │  │                             │ │                              │         │ │
│  │  │  - createFromTemplate()     │ │  - start(workflowId)         │         │ │
│  │  │  - addStep()                │ │  - pause(executionId)        │         │ │
│  │  │  - removeStep()             │ │  - resume(executionId)       │         │ │
│  │  │  - validate()               │ │  - cancel(executionId)       │         │ │
│  │  │  - export()                 │ │  - getStatus(executionId)    │         │ │
│  │  └─────────────────────────────┘ └─────────────────────────────┘         │ │
│  │                                                                            │ │
│  │  ┌─────────────────────────────┐ ┌─────────────────────────────┐         │ │
│  │  │  TemplateService            │ │  StepExecutor                │         │ │
│  │  │                             │ │  (Strategy Pattern)          │         │ │
│  │  │  - list()                   │ │                              │         │ │
│  │  │  - get(templateId)          │ │  - MatterGenExecutor         │         │ │
│  │  │  - instantiate()            │ │  - MatterSimExecutor         │         │ │
│  │  │                             │ │  - GraphRAGExecutor          │         │ │
│  │  │                             │ │  - ScreeningExecutor         │         │ │
│  │  └─────────────────────────────┘ └─────────────────────────────┘         │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                          │
│                                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                         Infrastructure Layer                               │ │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐             │ │
│  │  │ WorkflowRepo    │ │ ExecutionRepo   │ │ QueueAdapter    │             │ │
│  │  │ (PostgreSQL)    │ │ (PostgreSQL)    │ │ (BullMQ)        │             │ │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘             │ │
│  │                                                                            │ │
│  │  ┌─────────────────┐ ┌─────────────────┐                                 │ │
│  │  │ ModelClient     │ │ StorageAdapter  │                                 │ │
│  │  │ (Azure ML)      │ │ (Azure Blob)    │                                 │ │
│  │  └─────────────────┘ └─────────────────┘                                 │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Level 3: プラグインアーキテクチャ

研究分野別プラグインにより機能を拡張可能なアーキテクチャを示します。

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         Plugin Architecture                                      │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                         Plugin Manager (packages/core/plugin)              │ │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐             │ │
│  │  │  PluginLoader   │ │  PluginRegistry │ │  PluginContext  │             │ │
│  │  │                 │ │                 │ │                 │             │ │
│  │  │  - discover()   │ │  - register()   │ │  - config       │             │ │
│  │  │  - load()       │ │  - unregister() │ │  - services     │             │ │
│  │  │  - unload()     │ │  - getByType()  │ │  - logger       │             │ │
│  │  │  - validate()   │ │  - getByDomain()│ │  - cache        │             │ │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘             │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                          │
│                                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                         Plugin Interface                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  interface LabFlowPlugin {                                           │ │ │
│  │  │    id: string;                                                       │ │ │
│  │  │    name: string;                                                     │ │ │
│  │  │    version: string;                                                  │ │ │
│  │  │    domain: 'drug' | 'materials' | 'climate' | 'genomics' | 'common'; │ │ │
│  │  │    dependencies?: string[];                                          │ │ │
│  │  │                                                                      │ │ │
│  │  │    initialize(context: PluginContext): Promise<void>;                │ │ │
│  │  │    getWorkflowSteps(): WorkflowStepDefinition[];                     │ │ │
│  │  │    getDataConnectors(): DataConnector[];                             │ │ │
│  │  │    getVisualizations(): VisualizationComponent[];                    │ │ │
│  │  │    getUIExtensions(): UIExtension[];                                 │ │ │
│  │  │    cleanup(): Promise<void>;                                         │ │ │
│  │  │  }                                                                   │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                          │
│          ┌───────────────────────────┼───────────────────────────┐             │
│          │                           │                           │             │
│          ▼                           ▼                           ▼             │
│  ┌───────────────┐           ┌───────────────┐           ┌───────────────┐   │
│  │ Drug Discovery│           │   Materials   │           │    Climate    │   │
│  │    Plugin     │           │    Plugin     │           │    Plugin     │   │
│  ├───────────────┤           ├───────────────┤           ├───────────────┤   │
│  │ Steps:        │           │ Steps:        │           │ Steps:        │   │
│  │  - ADMET      │           │  - MatterGen  │           │  - Aurora     │   │
│  │  - Docking    │           │  - MatterSim  │           │  - Analysis   │   │
│  │  - Screening  │           │  - DFT        │           │  - Ensemble   │   │
│  │               │           │               │           │               │   │
│  │ Connectors:   │           │ Connectors:   │           │ Connectors:   │   │
│  │  - ChEMBL     │           │  - MatProject │           │  - CMIP6      │   │
│  │  - PubChem    │           │  - AFLOW      │           │  - ERA5       │   │
│  │  - DrugBank   │           │  - ICSD       │           │  - JMA        │   │
│  │               │           │               │           │               │   │
│  │ Visualizers:  │           │ Visualizers:  │           │ Visualizers:  │   │
│  │  - 3Dmol.js   │           │  - Crystal    │           │  - GeoMap     │   │
│  │  - Mol Editor │           │  - BandStruct │           │  - TimeSeries │   │
│  └───────────────┘           └───────────────┘           └───────────────┘   │
│          │                           │                           │             │
│          ▼                           ▼                           ▼             │
│  ┌───────────────┐           ┌───────────────┐           ┌───────────────┐   │
│  │   Genomics    │           │    Custom     │           │   Community   │   │
│  │    Plugin     │           │    Plugin     │           │   Plugins     │   │
│  ├───────────────┤           ├───────────────┤           ├───────────────┤   │
│  │ Steps:        │           │ User-defined  │           │ Third-party   │   │
│  │  - BioEmu     │           │ extensions    │           │ extensions    │   │
│  │  - AlphaFold  │           │ for specific  │           │ from registry │   │
│  │  - Alignment  │           │ research      │           │               │   │
│  │               │           │               │           │               │   │
│  │ Connectors:   │           │               │           │               │   │
│  │  - UniProt    │           │               │           │               │   │
│  │  - NCBI       │           │               │           │               │   │
│  │  - Ensembl    │           │               │           │               │   │
│  └───────────────┘           └───────────────┘           └───────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.5 プラグイン拡張ポイント

| 拡張ポイント | 説明 | 例 |
|-------------|------|-----|
| **WorkflowStep** | ワークフローに追加可能な処理ステップ | MatterGen, ADMET, Aurora |
| **DataConnector** | 外部データソースへの接続 | ChEMBL, Materials Project |
| **Visualization** | データ可視化コンポーネント | 分子3D, 結晶構造, 地図 |
| **UIExtension** | ダッシュボードUIの拡張 | 分子エディタ, 配列ビューア |
| **DataSchema** | ドメイン固有のデータスキーマ | SMILES, CIF, FASTA |
| **Validator** | 入力データのバリデーションルール | 分子妥当性チェック |

---

## 3. データベース設計

### 3.1 ER図

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Database Schema                                     │
│                                                                                  │
│  ┌────────────────┐       ┌────────────────┐       ┌────────────────┐          │
│  │     users      │       │  organizations │       │  team_members  │          │
│  ├────────────────┤       ├────────────────┤       ├────────────────┤          │
│  │ id (PK)        │◄──────│ id (PK)        │◄──────│ id (PK)        │          │
│  │ email          │       │ name           │       │ user_id (FK)   │──────────►│
│  │ name           │       │ plan_type      │       │ org_id (FK)    │          │
│  │ org_id (FK)    │───────│ settings       │       │ role           │          │
│  │ role           │       │ created_at     │       │ created_at     │          │
│  │ created_at     │       └────────────────┘       └────────────────┘          │
│  └────────────────┘                                                             │
│           │                                                                      │
│           │ 1:N                                                                  │
│           ▼                                                                      │
│  ┌────────────────┐       ┌────────────────┐       ┌────────────────┐          │
│  │   workflows    │       │  workflow_steps │       │  executions    │          │
│  ├────────────────┤       ├────────────────┤       ├────────────────┤          │
│  │ id (PK)        │◄──────│ id (PK)        │       │ id (PK)        │          │
│  │ user_id (FK)   │       │ workflow_id(FK)│───────│ workflow_id(FK)│──────────►│
│  │ template_id    │       │ type           │       │ status         │          │
│  │ name           │       │ config (JSON)  │       │ progress       │          │
│  │ description    │       │ order          │       │ started_at     │          │
│  │ status         │       │ dependencies   │       │ completed_at   │          │
│  │ created_at     │       └────────────────┘       │ results (JSON) │          │
│  └────────────────┘                                └────────────────┘          │
│           │                                                                      │
│           │ N:M                                                                  │
│           ▼                                                                      │
│  ┌────────────────┐       ┌────────────────┐       ┌────────────────┐          │
│  │   datasets     │       │ knowledge_bases│       │   documents    │          │
│  ├────────────────┤       ├────────────────┤       ├────────────────┤          │
│  │ id (PK)        │       │ id (PK)        │◄──────│ id (PK)        │          │
│  │ user_id (FK)   │       │ user_id (FK)   │       │ kb_id (FK)     │          │
│  │ org_id (FK)    │       │ org_id (FK)    │       │ title          │          │
│  │ name           │       │ name           │       │ content        │          │
│  │ type           │       │ domain         │       │ metadata       │          │
│  │ file_path      │       │ graph_data     │       │ embedding      │          │
│  │ metadata       │       │ status         │       │ created_at     │          │
│  └────────────────┘       └────────────────┘       └────────────────┘          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 主要テーブル定義

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255), -- OAuth の場合は NULL
    org_id UUID REFERENCES organizations(id),
    role VARCHAR(50) DEFAULT 'researcher', -- researcher, admin, owner
    avatar_url VARCHAR(500),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### workflows
```sql
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    org_id UUID REFERENCES organizations(id),
    template_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    domain VARCHAR(50), -- drug_discovery, materials, climate, genomics
    status VARCHAR(50) DEFAULT 'draft', -- draft, ready, running, completed, failed
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### executions
```sql
CREATE TABLE executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id),
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, paused, completed, failed, cancelled
    progress INTEGER DEFAULT 0, -- 0-100
    current_step INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    results JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### knowledge_bases
```sql
CREATE TABLE knowledge_bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    org_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    domain VARCHAR(50),
    status VARCHAR(50) DEFAULT 'building', -- building, ready, error
    document_count INTEGER DEFAULT 0,
    entity_count INTEGER DEFAULT 0,
    relation_count INTEGER DEFAULT 0,
    graph_data JSONB, -- GraphRAG graph structure
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### documents（pgvector使用）
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kb_id UUID NOT NULL REFERENCES knowledge_bases(id),
    title VARCHAR(500),
    content TEXT,
    source_url VARCHAR(1000),
    file_path VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    embedding vector(1536), -- OpenAI ada-002 embedding
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);
```

#### plugins（プラグイン管理）
```sql
CREATE TABLE plugins (
    id VARCHAR(100) PRIMARY KEY,          -- e.g., '@labflow/plugin-drug-discovery'
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    domain VARCHAR(50) NOT NULL,          -- drug, materials, climate, genomics, common
    description TEXT,
    author VARCHAR(255),
    repository_url VARCHAR(500),
    config_schema JSONB,                  -- JSON Schema for plugin config
    dependencies JSONB DEFAULT '[]',      -- Required plugins
    status VARCHAR(50) DEFAULT 'available', -- available, installed, disabled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### organization_plugins（組織別プラグイン設定）
```sql
CREATE TABLE organization_plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    plugin_id VARCHAR(100) NOT NULL REFERENCES plugins(id),
    enabled BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',            -- Plugin-specific config
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    installed_by UUID REFERENCES users(id),
    UNIQUE(org_id, plugin_id)
);
```

#### workflow_step_types（プラグイン提供ステップタイプ）
```sql
CREATE TABLE workflow_step_types (
    id VARCHAR(100) PRIMARY KEY,          -- e.g., 'drug:admet-prediction'
    plugin_id VARCHAR(100) NOT NULL REFERENCES plugins(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),                 -- generation, simulation, screening, analysis
    input_schema JSONB NOT NULL,
    output_schema JSONB NOT NULL,
    config_schema JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. API設計

### 4.1 API概要

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/v1/auth/providers` | GET | 有効な認証プロバイダー一覧 |
| `/api/v1/auth/login` | POST | ローカル認証ログイン |
| `/api/v1/auth/logout` | POST | ログアウト |
| `/api/v1/auth/register` | POST | ローカル認証ユーザー登録 |
| `/api/v1/auth/callback/entra` | GET | Entra ID コールバック |
| `/api/v1/auth/callback/shibboleth` | POST | Shibboleth ACS |
| `/api/v1/auth/me` | GET | 現在のユーザー情報 |
| `/api/v1/plugins` | GET | プラグイン一覧 |
| `/api/v1/plugins/:id` | GET | プラグイン詳細 |
| `/api/v1/plugins/:id/install` | POST | プラグインインストール |
| `/api/v1/plugins/:id/uninstall` | DELETE | プラグインアンインストール |
| `/api/v1/plugins/:id/enable` | POST | プラグイン有効化 |
| `/api/v1/plugins/:id/disable` | POST | プラグイン無効化 |
| `/api/v1/plugins/:id/config` | GET, PUT | プラグイン設定 |
| `/api/v1/step-types` | GET | 利用可能なワークフローステップタイプ一覧 |
| `/api/v1/data-connectors` | GET | 利用可能なデータコネクタ一覧 |
| `/api/v1/workflows` | GET, POST | ワークフロー一覧・作成 |
| `/api/v1/workflows/:id` | GET, PUT, DELETE | ワークフロー詳細・更新・削除 |
| `/api/v1/workflows/:id/execute` | POST | ワークフロー実行 |
| `/api/v1/executions/:id` | GET | 実行状態取得 |
| `/api/v1/executions/:id/cancel` | POST | 実行キャンセル |
| `/api/v1/models` | GET | モデルカタログ一覧 |
| `/api/v1/models/:id/predict` | POST | モデル推論 |
| `/api/v1/knowledge-bases` | GET, POST | ナレッジベース一覧・作成 |
| `/api/v1/knowledge-bases/:id/query` | POST | ナレッジベースクエリ |
| `/api/v1/datasets` | GET, POST | データセット一覧・アップロード |

### 4.2 認証（マルチプロバイダー対応）

- **方式**: Bearer Token (JWT)
- **対応プロバイダー**:
  - **ローカル認証**: 自己発行JWT（Argon2idパスワードハッシュ）
  - **Microsoft Entra ID**: OAuth 2.0 / OpenID Connect
  - **Shibboleth**: SAML 2.0 → JWT変換
- **ヘッダー**: `Authorization: Bearer <token>`
- **切り替え**: 環境変数 `AUTH_PROVIDER` で設定（`local` | `entra` | `shibboleth` | `multi`）

### 4.3 レスポンス形式

#### 成功レスポンス
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-12-13T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

#### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "WORKFLOW_NOT_FOUND",
    "message": "指定されたワークフローが見つかりません",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2025-12-13T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### 4.4 主要エンドポイント詳細

#### POST /api/v1/workflows

ワークフローを作成します。

**Request**:
```json
{
  "name": "熱電材料探索",
  "templateId": "materials-discovery-basic",
  "domain": "materials",
  "config": {
    "targetProperties": {
      "bandGap": { "min": 1.5, "max": 2.0, "unit": "eV" },
      "thermalConductivity": { "max": 5, "unit": "W/mK" }
    }
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "wf_abc123",
    "name": "熱電材料探索",
    "templateId": "materials-discovery-basic",
    "domain": "materials",
    "status": "draft",
    "steps": [
      { "id": "step_1", "type": "mattergen", "order": 1 },
      { "id": "step_2", "type": "mattersim", "order": 2 },
      { "id": "step_3", "type": "screening", "order": 3 }
    ],
    "createdAt": "2025-12-13T10:00:00Z"
  }
}
```

#### POST /api/v1/workflows/:id/execute

ワークフローを実行します。

**Request**:
```json
{
  "priority": "normal",
  "notifyOnComplete": true
}
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "data": {
    "executionId": "exec_xyz789",
    "workflowId": "wf_abc123",
    "status": "pending",
    "estimatedTime": "PT30M"
  }
}
```

---

## 5. 設計決定記録（ADR）

### ADR-001: Monorepo構成の採用

**Status**: Accepted
**Date**: 2025-12-13

**Context**: 
複数のパッケージ（core、cli、web）を効率的に管理する必要がある。

**Decision**: 
pnpm workspaces + Turborepo によるMonorepo構成を採用。

**Consequences**:
- ✅ コード共有が容易
- ✅ 統一的なビルド・テスト
- ✅ 依存関係の一元管理
- ⚠️ 初期設定の複雑さ

---

### ADR-002: PostgreSQL + pgvector の採用

**Status**: Accepted
**Date**: 2025-12-13

**Context**: 
リレーショナルデータとベクトルデータ（埋め込み）の両方を扱う必要がある。

**Decision**: 
PostgreSQL + pgvector拡張を採用し、単一DBで両方のワークロードを処理。

**Alternatives Considered**:
- PostgreSQL + Pinecone（ベクトルDB別）
- MongoDB + Atlas Vector Search

**Consequences**:
- ✅ 運用の簡素化
- ✅ トランザクション整合性
- ✅ Azure Database for PostgreSQL のマネージドサービス利用可能
- ⚠️ 超大規模ベクトル検索には専用DBが必要になる可能性

---

### ADR-003: BullMQ によるジョブキュー

**Status**: Accepted
**Date**: 2025-12-13

**Context**: 
AIモデル推論やGraphRAG構築など、長時間実行ジョブを非同期で処理する必要がある。

**Decision**: 
BullMQ（Redis ベース）を採用。

**Alternatives Considered**:
- Azure Queue Storage
- Azure Service Bus

**Consequences**:
- ✅ TypeScript ネイティブ
- ✅ 豊富な機能（リトライ、優先度、進捗追跡）
- ✅ Redis は既にキャッシュで使用
- ⚠️ Redis の可用性が単一障害点になりうる

---

### ADR-004: Hono APIフレームワーク

**Status**: Accepted
**Date**: 2025-12-13

**Context**: 
軽量で高速なAPIフレームワークが必要。エッジランタイムでの動作も考慮。

**Decision**: 
Hono を採用。

**Alternatives Considered**:
- Express
- Fastify
- NestJS

**Consequences**:
- ✅ 軽量・高速
- ✅ TypeScript ファースト
- ✅ Web Standards 準拠
- ✅ エッジ対応
- ⚠️ エコシステムが Express より小さい

---

## 6. トレーサビリティマトリクス

### 6.1 要件 → 設計マッピング（抜粋）

| 要件ID | 要件概要 | 設計コンポーネント | DB テーブル | API エンドポイント |
|--------|---------|-------------------|------------|-------------------|
| DASH-MAIN-001 | 分野別カード表示 | Web App / Dashboard | - | - |
| WKFL-TMPL-001 | テンプレート一覧 | TemplateService | workflow_templates | GET /api/v1/templates |
| WKFL-EXEC-001 | ワークフロー実行 | ExecutionService | executions | POST /api/v1/workflows/:id/execute |
| KNOW-GRPH-001 | ナレッジグラフ構築 | GraphRAGService | knowledge_bases, documents | POST /api/v1/knowledge-bases |
| MODL-CATL-001 | モデルカタログ | ModelCatalog | models | GET /api/v1/models |

### 6.2 コンポーネント → パッケージマッピング

| コンポーネント | パッケージ | 説明 |
|--------------|----------|------|
| WorkflowService | packages/core/workflow | ワークフロー管理 |
| ExecutionService | packages/core/workflow | 実行制御 |
| GraphRAGService | packages/core/graphrag | ナレッジグラフ |
| ModelCatalog | packages/core/models | モデル管理 |
| ScreeningEngine | packages/core/screening | スクリーニング |
| Web App | packages/web | フロントエンド |
| CLI | packages/cli | コマンドライン |

---

## 7. セキュリティ設計

### 7.1 認証アーキテクチャ（マルチプロバイダー）

LabFlowは以下の3つの認証プロバイダーを環境設定で切り替え可能です。

#### 認証プロバイダー比較

| プロバイダー | プロトコル | ユースケース | 設定値 |
|------------|-----------|-------------|--------|
| **ローカル認証** | メール/パスワード + JWT | 開発環境、小規模利用、オフライン | `AUTH_PROVIDER=local` |
| **Microsoft Entra ID** | OAuth 2.0 / OIDC | 企業向け、Microsoft 365連携 | `AUTH_PROVIDER=entra` |
| **Shibboleth** | SAML 2.0 | 学術機関、学認連携 | `AUTH_PROVIDER=shibboleth` |
| **複合モード** | 上記すべて | ハイブリッド環境 | `AUTH_PROVIDER=multi` |

### 7.2 認証フロー

#### 7.2.1 ローカル認証フロー

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  User    │     │  LabFlow     │     │  PostgreSQL  │
│  Browser │     │  API Server  │     │  (users)     │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘
     │                  │                    │
     │  1. POST /auth/login                  │
     │  {email, password}                    │
     │─────────────────►│                    │
     │                  │  2. SELECT user    │
     │                  │───────────────────►│
     │                  │                    │
     │                  │  3. User record    │
     │                  │◄───────────────────│
     │                  │                    │
     │                  │  4. Argon2id verify│
     │                  │  5. Generate JWT   │
     │                  │                    │
     │  6. JWT Token    │                    │
     │◄─────────────────│                    │
     │                  │                    │
```

#### 7.2.2 Entra ID (OAuth 2.0/OIDC) フロー

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  User    │     │  LabFlow     │     │  Microsoft   │
│  Browser │     │  Web App     │     │  Entra ID    │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘
     │                  │                    │
     │  1. Access App   │                    │
     │─────────────────►│                    │
     │                  │                    │
     │  2. Redirect to Entra ID              │
     │◄─────────────────│                    │
     │                  │                    │
     │  3. Login (Microsoft Account)         │
     │───────────────────────────────────────►
     │                  │                    │
     │  4. Authorization Code                │
     │◄──────────────────────────────────────│
     │                  │                    │
     │  5. Code         │                    │
     │─────────────────►│  6. Token Exchange │
     │                  │───────────────────►│
     │                  │                    │
     │                  │  7. ID Token + AT  │
     │                  │◄───────────────────│
     │                  │                    │
     │  8. Session (JWT)│                    │
     │◄─────────────────│                    │
```

#### 7.2.3 Shibboleth (SAML 2.0) フロー

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User    │     │  LabFlow     │     │  Shibboleth  │     │  IdP         │
│  Browser │     │  (SP)        │     │  (学認等)    │     │  (大学等)    │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
     │                  │                    │                    │
     │  1. Access App   │                    │                    │
     │─────────────────►│                    │                    │
     │                  │                    │                    │
     │  2. SAML AuthnRequest                 │                    │
     │◄─────────────────│                    │                    │
     │                  │                    │                    │
     │  3. Redirect to IdP Discovery         │                    │
     │───────────────────────────────────────►                    │
     │                  │                    │                    │
     │  4. Select IdP   │                    │                    │
     │───────────────────────────────────────────────────────────►│
     │                  │                    │                    │
     │  5. Login at IdP │                    │                    │
     │───────────────────────────────────────────────────────────►│
     │                  │                    │                    │
     │  6. SAML Response (Assertion)         │                    │
     │◄──────────────────────────────────────────────────────────│
     │                  │                    │                    │
     │  7. POST Assertion                    │                    │
     │─────────────────►│                    │                    │
     │                  │  8. Validate       │                    │
     │                  │  9. Extract attrs  │                    │
     │                  │  10. Generate JWT  │                    │
     │                  │                    │                    │
     │  11. Session     │                    │                    │
     │◄─────────────────│                    │                    │
```

### 7.3 認証設定スキーマ

```typescript
// packages/core/auth/config.ts
interface AuthConfig {
  provider: 'local' | 'entra' | 'shibboleth' | 'multi';
  
  local?: {
    jwtSecret: string;
    jwtExpiresIn: string;  // e.g., '24h'
    passwordMinLength: number;
    mfaEnabled: boolean;
  };
  
  entra?: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
  };
  
  shibboleth?: {
    spEntityId: string;
    idpMetadataUrl: string;
    attributeMapping: {
      email: string;      // e.g., 'urn:oid:0.9.2342.19200300.100.1.3'
      name: string;       // e.g., 'urn:oid:2.5.4.3'
      affiliation: string; // e.g., 'urn:oid:1.3.6.1.4.1.5923.1.1.1.1'
    };
    certificate: string;
    privateKey: string;
  };
  
  multi?: {
    enabledProviders: ('local' | 'entra' | 'shibboleth')[];
    defaultProvider: 'local' | 'entra' | 'shibboleth';
  };
}
```

### 7.4 データベーススキーマ（認証対応）

```sql
-- ユーザーテーブル（マルチプロバイダー対応）
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    
    -- 認証プロバイダー情報
    auth_provider VARCHAR(50) NOT NULL, -- 'local', 'entra', 'shibboleth'
    auth_provider_id VARCHAR(255),      -- 外部IdPでのユーザーID
    
    -- ローカル認証用
    password_hash VARCHAR(255),         -- Argon2id hash (localのみ)
    mfa_secret VARCHAR(255),            -- TOTP secret (optional)
    
    -- Shibboleth用属性
    affiliation VARCHAR(100),           -- 所属機関
    eppn VARCHAR(255),                  -- eduPersonPrincipalName
    
    -- 共通
    org_id UUID REFERENCES organizations(id),
    role VARCHAR(50) DEFAULT 'researcher',
    avatar_url VARCHAR(500),
    settings JSONB DEFAULT '{}',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- プロバイダー別ユニーク制約
CREATE UNIQUE INDEX idx_users_provider_id 
    ON users(auth_provider, auth_provider_id) 
    WHERE auth_provider_id IS NOT NULL;
```

### 7.5 認可（RBAC）

| Role | 権限 |
|------|------|
| owner | 組織のすべての操作、メンバー管理、プラン変更 |
| admin | ワークフロー管理、データ管理、メンバー招待 |
| researcher | ワークフロー作成・実行、データ閲覧・アップロード |
| viewer | 閲覧のみ |

### 7.6 環境変数設定例

```bash
# ローカル認証のみ
AUTH_PROVIDER=local
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Entra ID のみ
AUTH_PROVIDER=entra
ENTRA_TENANT_ID=your-tenant-id
ENTRA_CLIENT_ID=your-client-id
ENTRA_CLIENT_SECRET=your-client-secret
ENTRA_REDIRECT_URI=http://localhost:3000/api/auth/callback/entra

# Shibboleth のみ
AUTH_PROVIDER=shibboleth
SHIBBOLETH_SP_ENTITY_ID=https://labflow.example.com/shibboleth
SHIBBOLETH_IDP_METADATA_URL=https://metadata.gakunin.jp/gakunin-metadata.xml
SHIBBOLETH_CERT_PATH=/etc/shibboleth/sp-cert.pem
SHIBBOLETH_KEY_PATH=/etc/shibboleth/sp-key.pem

# 複合モード（ログイン画面で選択可能）
AUTH_PROVIDER=multi
AUTH_ENABLED_PROVIDERS=local,entra,shibboleth
AUTH_DEFAULT_PROVIDER=entra
```

---

## 8. ADR-005: マルチ認証プロバイダーの採用

**Status**: Accepted
**Date**: 2025-12-13

**Context**: 
LabFlowは企業、大学、個人研究者など多様なユーザー層を対象とする。各環境で要求される認証方式が異なる：
- 企業: Microsoft Entra ID (SSO)
- 学術機関: Shibboleth (学認)
- 個人/小規模: ローカル認証

**Decision**: 
Strategy パターンによる認証プロバイダーの抽象化を採用し、環境変数で切り替え可能にする。

**Consequences**:
- ✅ 多様な導入環境に対応
- ✅ 学術機関での導入障壁を下げる
- ✅ 開発環境でローカル認証が使える
- ⚠️ 認証コードの複雑化
- ⚠️ 各プロバイダーのテストが必要

---

## 9. 変更履歴

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-13 | 初版作成 | Claude |
| 1.1 | 2025-12-13 | マルチ認証プロバイダー対応追加 | Claude |

---

**文書終了**
