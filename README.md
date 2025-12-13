# LabFlow

**AI for Science Starter Kit** - 初心者研究者のための科学発見プラットフォーム

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-orange.svg)](https://pnpm.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Vision

> **科学研究を誰もがアクセスできる創造的な探求へ**

LabFlowは、AIの力を活用して科学発見のプロセスを民主化します。専門的な計算科学の知識がなくても、初心者研究者が最先端のAIモデルを使って仮説生成、候補スクリーニング、実験計画を行えるプラットフォームを提供します。

---

## ✨ Features

### 🔬 研究ドメインサポート
- **創薬** (Drug Discovery) - TamGen, BioEmu統合
- **材料科学** (Materials Science) - MatterGen, MatterSim統合
- **気候科学** (Climate Science) - Aurora統合
- **ゲノミクス** (Genomics) - ESM, AlphaFold統合

### 📚 Knowledge Management
- **GraphRAG** - 文献からのナレッジグラフ自動構築
- **Literature Search** - セマンティック文献検索
- **RAG Service** - 文脈を考慮した質問応答

### 🧪 Lab Data Management (New!)
- **チーム管理** - ラボメンバーの招待・権限管理
- **データセット共有** - バージョニング、可視性制御
- **実験トラッキング** - ライフサイクル管理、ワークフロー連携
- **GraphRAG統合** - データセットの自動インデキシング

### 🔄 Workflow Engine
- **テンプレート化** - 実績のある発見ワークフローを提供
- **ステップ実行** - 並列・シーケンシャル実行
- **プラグインシステム** - カスタムステップの追加

### 🤖 AI Integration
- **Model Catalog** - AI/MLモデルの統一インターフェース
- **NLI Service** - 自然言語理解・意図抽出
- **Screening** - AI/シミュレーションによる候補評価

---

## 🏗️ Architecture

```
packages/
├── core/          # ビジネスロジック (Library-First)
│   ├── auth/      # 認証・認可
│   ├── db/        # データベーススキーマ (Drizzle ORM)
│   ├── knowledge/ # RAG, GraphRAG, 文献検索
│   ├── lab/       # ラボ・データセット・実験管理
│   ├── workflow/  # ワークフローエンジン
│   ├── plugin/    # プラグインシステム
│   └── screening/ # スクリーニングサービス
├── cli/           # コマンドラインインターフェース
└── web/           # Next.js Webアプリケーション
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20 LTS
- pnpm 9.x
- PostgreSQL 15+ (with pgvector extension)

### Installation

```bash
# Clone the repository
git clone https://github.com/nahisaho/LabFlow.git
cd LabFlow

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build with turbo
pnpm build
```

---

## 📦 Packages

| Package | Description | Status |
|---------|-------------|--------|
| `@labflow/core` | Core library - workflow, knowledge, lab management | ✅ Active |
| `@labflow/cli` | Command-line interface | ✅ Active |
| `@labflow/web` | Next.js web application | 🚧 In Progress |

---

## 🧪 Test Coverage

```
Total Tests: 805+
├── core:  750+ tests
├── cli:   77 tests
└── web:   50 tests
```

---

## 📋 Tech Stack

| Category | Technology |
|----------|------------|
| Language | TypeScript 5.x |
| Runtime | Node.js 20 LTS |
| Package Manager | pnpm + Turborepo |
| Database | PostgreSQL + Drizzle ORM |
| Vector Store | pgvector |
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Testing | Vitest |
| AI/ML | Esperanto (LLM abstraction) |

---

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] Workflow Engine
- [x] Plugin System
- [x] Knowledge Base (RAG)
- [x] GraphRAG Integration
- [x] Literature Search
- [x] Lab Data Management

### Phase 2: AI Integration 🚧
- [ ] Model Catalog UI
- [ ] AI Assistant
- [ ] Workflow Builder (Visual)

### Phase 3: Collaboration
- [ ] Team Dashboard
- [ ] Real-time Collaboration
- [ ] Sharing & Export

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Microsoft Discovery](https://www.microsoft.com/en-us/research/project/discovery/) - Foundation AI models
- [GraphRAG](https://github.com/microsoft/graphrag) - Knowledge graph extraction
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe SQL

---

**Built with ❤️ for the scientific community**
