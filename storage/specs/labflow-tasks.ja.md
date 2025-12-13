# LabFlow タスクブレークダウン

**プロジェクト**: LabFlow
**機能**: AI for Science スターターキット - MVP
**最終更新日**: 2025-12-14
**バージョン**: 1.1
**ステータス**: 実装中

---

## 1. 概要

本ドキュメントはLabFlowの設計を実装可能なタスクに分解し、要件との完全なトレーサビリティを提供します。

### 1.1 タスクIDスキーマ

```
TASK-[カテゴリ]-[番号]
```

| カテゴリ | 説明 |
|----------|------|
| INFRA | インフラストラクチャ＆プロジェクトセットアップ |
| AUTH | 認証システム |
| CORE | コアライブラリ |
| WKFL | ワークフローエンジン |
| GRAG | GraphRAG＆知識ベース |
| PLUG | プラグインアーキテクチャ |
| WEB | Webアプリケーション |
| CLI | コマンドラインインターフェース |
| TEST | テスト＆品質 |
| DOCS | ドキュメンテーション |

---

## 2. P0タスク（クリティカル - ローンチブロッカー）

### 2.1 インフラストラクチャ＆プロジェクトセットアップ

#### TASK-INFRA-001: モノレポ構造の初期化

**優先度**: P0
**ストーリーポイント**: 3
**予定時間**: 4時間
**ステータス**: ✅ 完了

**説明**:
Article I（Library-Firstアーキテクチャ）に従ったpnpmワークスペースモノレポ構造のセットアップ。

**要件カバレッジ**:
- 構造: Library-Firstアーキテクチャを持つモノレポ

**受け入れ基準**:
- [x] `pnpm-workspace.yaml`にpackages/*を設定
- [x] `packages/core/`ディレクトリ作成
- [x] `packages/cli/`ディレクトリ作成
- [x] `packages/web/`ディレクトリ作成
- [x] ルート`package.json`にワークスペーススクリプト
- [x] `turbo.json`でビルドオーケストレーション

**依存関係**: なし

**テストファースト チェックリスト** (Article III):
- [ ] 実装の前にテストを記述
- [ ] Red: 失敗するテストをコミット
- [ ] Green: 最小限の実装でテストをパス
- [ ] Blue: 自信を持ってリファクタリング

**実装ノート**:
```bash
packages/
├── core/           # @labflow/core
│   ├── src/
│   ├── tests/
│   └── package.json
├── cli/            # @labflow/cli
│   ├── src/
│   ├── tests/
│   └── package.json
└── web/            # @labflow/web
    ├── src/
    └── package.json
```

**検証**:
```bash
pnpm install
pnpm build
```

---

#### TASK-INFRA-002: TypeScript＆ビルドシステム設定

**優先度**: P0
**ストーリーポイント**: 2
**予定時間**: 3時間
**ステータス**: ✅ 完了

**説明**:
strictモードとパスエイリアスを持つTypeScript 5.x設定のセットアップ。

**要件カバレッジ**:
- 技術スタック: TypeScript 5.x

**受け入れ基準**:
- [x] ルート`tsconfig.json`にstrictモード
- [x] ルートを継承するパッケージ固有の`tsconfig.json`
- [x] パスエイリアス設定（@labflow/*）
- [x] Turboレポビルドパイプライン動作
- [x] ESLint + Biome設定

**依存関係**:
- TASK-INFRA-001: モノレポ構造

---

#### TASK-INFRA-003: データベーススキーマ＆マイグレーション

**優先度**: P0
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: ✅ 完了

**説明**:
Drizzle ORMを使用したpgvector拡張付きPostgreSQLデータベースのセットアップ。

**要件カバレッジ**:
- ADR-002: PostgreSQL + pgvector

**受け入れ基準**:
- [x] Drizzle ORM設定
- [x] コアテーブル作成: users, organizations, workflows, executions
- [x] pgvector拡張有効化
- [x] ベクター埋め込みカラム付きdocumentsテーブル
- [x] プラグインテーブル: plugins, organization_plugins, workflow_step_types
- [ ] マイグレーションスクリプト動作
- [ ] 開発用シードデータ

**依存関係**:
- TASK-INFRA-001: モノレポ構造

---

### 2.2 認証システム

#### TASK-AUTH-001: マルチプロバイダー認証テスト作成 (RED)

**優先度**: P0
**ストーリーポイント**: 3
**予定時間**: 5時間
**ステータス**: ✅ 完了

**説明**:
マルチプロバイダー認証システムの失敗するテストを作成。

**テストファーストフェーズ**: ❤️ RED（失敗するテスト）

**要件カバレッジ**:
- DASH-AUTH-001: マルチプロバイダー切り替え
- DASH-AUTH-002: ローカル認証
- DASH-AUTH-003: Entra ID (OAuth 2.0/OIDC)
- DASH-AUTH-004: Shibboleth (SAML 2.0)

**受け入れ基準**:
- [x] テストファイル作成: `packages/core/tests/auth/*.test.ts`
- [x] LocalAuthProviderのテスト (22テスト)
- [x] EntraIDProviderのテスト
- [x] ShibbolethProviderのテスト
- [x] AuthProviderFactory（Strategyパターン）のテスト (12テスト)
- [x] AuthServiceのテスト (14テスト)
- [x] エラーハンドリングのテスト (15テスト)

---

#### TASK-AUTH-002: AuthProviderFactory実装 (GREEN)

**優先度**: P0
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: ✅ 完了

**説明**:
Strategyパターンを使用した認証プロバイダーファクトリの実装。

**テストファーストフェーズ**: 💚 GREEN（パスするテスト）

**要件カバレッジ**:
- DASH-AUTH-001: マルチプロバイダー切り替え

**受け入れ基準**:
- [x] AuthProviderインターフェース定義
- [x] AuthProviderFactory実装
- [x] 環境ベースのプロバイダー選択
- [x] TASK-AUTH-001の全テストがパス

**依存関係**:
- TASK-AUTH-001: テストが先に存在する必要あり

---

#### TASK-AUTH-003: LocalAuthProvider実装

**優先度**: P0
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: ✅ 完了

**説明**:
Argon2idパスワードハッシュを持つローカル認証の実装。

**要件カバレッジ**:
- DASH-AUTH-002: ローカル認証
- DASH-AUTH-011: Argon2idパスワードハッシュ
- DASH-AUTH-015: パスワードリセット

**受け入れ基準**:
- [x] LocalAuthProviderクラス実装
- [x] Argon2idパスワードハッシュ
- [x] JWTトークン生成
- [x] パスワードリセットフロー
- [x] 関連テスト全パス (22テスト)

**依存関係**:
- TASK-AUTH-002: AuthProviderFactory

---

#### TASK-AUTH-004: EntraIDProvider実装

**優先度**: P0
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: ✅ 完了

**説明**:
OAuth 2.0/OIDCを使用したMicrosoft Entra ID認証の実装。

**要件カバレッジ**:
- DASH-AUTH-003: Entra ID (OAuth 2.0/OIDC)

**受け入れ基準**:
- [x] EntraIDProviderクラス実装
- [x] OAuth 2.0認可コードフロー
- [x] OIDCトークン検証
- [x] ユーザー属性マッピング
- [x] 関連テスト全パス

**依存関係**:
- TASK-AUTH-002: AuthProviderFactory

---

#### TASK-AUTH-005: ShibbolethProvider実装

**優先度**: P0
**ストーリーポイント**: 8
**予定時間**: 12時間
**ステータス**: ✅ 完了

**説明**:
SAML 2.0を使用したShibboleth認証の実装。

**要件カバレッジ**:
- DASH-AUTH-004: Shibboleth (SAML 2.0)

**受け入れ基準**:
- [x] ShibbolethProviderクラス実装
- [x] SAML 2.0 SP機能
- [x] IdPメタデータ解析
- [x] 属性マッピング（eduPersonスキーマ）
- [x] SAMLアサーションからJWT変換
- [x] 関連テスト全パス

**依存関係**:
- TASK-AUTH-002: AuthProviderFactory

---

#### TASK-AUTH-006: セキュリティ機能実装

**優先度**: P0
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: 未着手

**説明**:
認証セキュリティ機能の実装。

**要件カバレッジ**:
- DASH-AUTH-010: MFAサポート
- DASH-AUTH-012: セッションタイムアウト
- DASH-AUTH-013: アカウントロックアウト
- DASH-AUTH-016: 監査ログ

**受け入れ基準**:
- [ ] MFA（TOTP）サポート
- [ ] セッションタイムアウト（15分アイドル）
- [ ] アカウントロックアウト（3回失敗 = 30分）
- [ ] 全認証イベントの監査ログ

**依存関係**:
- TASK-AUTH-003: LocalAuthProvider

---

### 2.3 コアライブラリ - ワークフローエンジン

#### TASK-WKFL-001: ワークフロードメインテスト作成 (RED)

**優先度**: P0
**ストーリーポイント**: 3
**予定時間**: 5時間
**ステータス**: ✅ 完了

**説明**:
ワークフロードメインエンティティの失敗するテストを作成。

**テストファーストフェーズ**: ❤️ RED（失敗するテスト）

**要件カバレッジ**:
- WKFL-COMM-001: ワークフローメタデータ
- WKFL-COMM-002: バージョン管理

**受け入れ基準**:
- [x] Workflow集約のテスト (25テスト)
- [x] Stepエンティティのテスト (30テスト)
- [x] Executionエンティティのテスト (27テスト)
- [x] WorkflowServiceのテスト (29テスト)
- [x] ExecutionServiceのテスト (30テスト)

---

#### TASK-WKFL-002: ワークフロードメインモデル実装 (GREEN)

**優先度**: P0
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: ✅ 完了

**説明**:
DDDパターンを使用したワークフロードメインエンティティの実装。

**要件カバレッジ**:
- WKFL-COMM-001: ワークフローメタデータ
- WKFL-COMM-006: 中間結果の永続化

**受け入れ基準**:
- [x] Workflow集約実装
- [x] Stepエンティティ実装
- [x] Executionエンティティ実装
- [x] 全テストパス (141テスト)
- [ ] Stepエンティティ実装
- [ ] Executionエンティティ実装
- [ ] 全テストパス
- [ ] Gitコミット: `feat: implement workflow domain model`

**依存関係**:
- TASK-WKFL-001: テスト

---

#### TASK-WKFL-003: WorkflowService実装

**優先度**: P0
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: ✅ 完了

**説明**:
ワークフローアプリケーションサービスの実装。

**要件カバレッジ**:
- DASH-PROJ-001: プロジェクトCRUD
- WKFL-COMM-003: テンプレート詳細
- WKFL-COMM-007: テンプレートとして保存

**受け入れ基準**:
- [x] createFromTemplate()メソッド
- [x] addStep()メソッド
- [x] validate()メソッド
- [x] export()メソッド
- [x] 全テストパス (29テスト)

**依存関係**:
- TASK-WKFL-002: ドメインモデル

---

#### TASK-WKFL-004: ExecutionService実装

**優先度**: P0
**ストーリーポイント**: 8
**予定時間**: 12時間
**ステータス**: ✅ 完了

**説明**:
BullMQ統合を持つワークフロー実行サービスの実装。

**要件カバレッジ**:
- DASH-PROG-001: 進捗可視化
- DASH-PROG-003: 進捗パーセンテージ
- WKFL-COMM-005: 失敗からの再開

**受け入れ基準**:
- [x] start(workflowId)メソッド
- [x] pause(executionId)メソッド
- [x] resume(executionId)メソッド
- [x] cancel(executionId)メソッド
- [ ] BullMQジョブキュー統合
- [x] 進捗トラッキング (30テスト)

**依存関係**:
- TASK-WKFL-003: WorkflowService
- TASK-INFRA-003: データベース

---

#### TASK-WKFL-005: StepExecutor Strategy実装

**優先度**: P0
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: 未着手

**説明**:
異なるステップタイプに対するStrategyパターンを使用したステップエグゼキューターの実装。

**要件カバレッジ**:
- WKFL-DRUG-002: BioEmu統合
- WKFL-MATL-002: MatterGen統合
- WKFL-CLIM-004: Aurora統合

**受け入れ基準**:
- [ ] StepExecutorインターフェース
- [ ] MatterGenExecutor実装
- [ ] 共通ロジック付きBaseStepExecutor
- [ ] ステップタイプレジストリ

**依存関係**:
- TASK-WKFL-004: ExecutionService

---

### 2.4 プラグインアーキテクチャ

#### TASK-PLUG-001: プラグインシステムテスト作成 (RED)

**優先度**: P0
**ストーリーポイント**: 3
**予定時間**: 5時間
**ステータス**: ✅ 完了

**説明**:
プラグインアーキテクチャの失敗するテストを作成。

**テストファーストフェーズ**: ❤️ RED（失敗するテスト）

**要件カバレッジ**:
- PLUG-CORE-001: プラグインアーキテクチャ
- PLUG-CORE-002: プラグインライフサイクル
- PLUG-INTF-001: プラグインインターフェース

**受け入れ基準**:
- [x] PluginLoaderのテスト (18テスト)
- [x] PluginRegistryのテスト (24テスト)
- [x] PluginContextのテスト (11テスト)
- [x] LabFlowPluginインターフェースのテスト (24テスト)
- [x] PluginManagerのテスト (12テスト)

---

#### TASK-PLUG-002: プラグインマネージャー実装 (GREEN)

**優先度**: P0
**ストーリーポイント**: 8
**予定時間**: 12時間
**ステータス**: ✅ 完了

**説明**:
ライフサイクル管理付きコアプラグインマネージャーの実装。

**要件カバレッジ**:
- PLUG-CORE-001: プラグインアーキテクチャ
- PLUG-CORE-002: プラグインライフサイクル
- PLUG-CORE-005: バージョン互換性

**受け入れ基準**:
- [x] PluginLoader: discover, load, unload, validate
- [x] PluginRegistry: register, unregister, getByType, getByDomain
- [x] PluginContext: config, services, logger, cache
- [x] Pluginインターフェース定義
- [x] 全テストパス (89テスト)

**依存関係**:
- TASK-PLUG-001: テスト

---

#### TASK-PLUG-003: プラグインインターフェース実装

**優先度**: P0
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: ✅ 完了

**説明**:
拡張ポイントを持つ標準プラグインインターフェースの定義と実装。

**要件カバレッジ**:
- PLUG-INTF-001: プラグインインターフェース
- PLUG-INTF-002: 拡張ポイント
- PLUG-INTF-005: 標準ユーティリティ

**受け入れ基準**:
- [x] LabFlowPluginインターフェース定義
- [x] WorkflowStepDefinition型
- [x] DataConnectorインターフェース
- [x] VisualizationComponentインターフェース
- [x] UIExtensionインターフェース

---

#### TASK-PLUG-004: 創薬プラグイン実装

**優先度**: P0
**ストーリーポイント**: 8
**予定時間**: 12時間
**ステータス**: 未着手

**説明**:
創薬ドメインプラグインの実装。

**要件カバレッジ**:
- PLUG-DRUG-001: 分子構造エディタ
- PLUG-DRUG-002: ADMET、ドッキングワークフローステップ
- PLUG-DRUG-003: ChEMBL、PubChemコネクタ
- PLUG-DRUG-004: 3Dmol.js可視化

**受け入れ基準**:
- [ ] DrugDiscoveryPluginクラス
- [ ] ADMET予測ステップ
- [ ] ドッキングシミュレーションステップ
- [ ] ChEMBLデータコネクタ
- [ ] 3D分子可視化

**依存関係**:
- TASK-PLUG-002: プラグインマネージャー

---

#### TASK-PLUG-005: 材料科学プラグイン実装

**優先度**: P0
**ストーリーポイント**: 8
**予定時間**: 12時間
**ステータス**: 未着手

**説明**:
材料科学ドメインプラグインの実装。

**要件カバレッジ**:
- PLUG-MAT-001: 結晶構造エディタ
- PLUG-MAT-002: MatterGen、MatterSimステップ
- PLUG-MAT-003: Materials Projectコネクタ
- PLUG-MAT-004: 結晶可視化

**受け入れ基準**:
- [ ] MaterialsSciencePluginクラス
- [ ] MatterGen生成ステップ
- [ ] MatterSimシミュレーションステップ
- [ ] Materials Projectコネクタ
- [ ] 結晶構造可視化

**依存関係**:
- TASK-PLUG-002: プラグインマネージャー

---

### 2.5 CLIインターフェース (Article II)

#### TASK-CLI-001: CLIフレームワーク実装

**優先度**: P0
**ストーリーポイント**: 3
**予定時間**: 5時間
**ステータス**: 未着手

**説明**:
Article IIに従ったCommander.jsを使用したCLIフレームワークのセットアップ。

**要件カバレッジ**:
- Article II: CLIインターフェース要件

**受け入れ基準**:
- [ ] Commander.jsセットアップ
- [ ] `labflow`コマンドエントリーポイント
- [ ] ヘルプテキスト生成
- [ ] バージョンコマンド
- [ ] エラーハンドリング

---

#### TASK-CLI-002: ワークフローコマンド実装

**優先度**: P0
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: 未着手

**説明**:
ワークフロー管理用CLIコマンドの実装。

**受け入れ基準**:
- [ ] `labflow workflow list`
- [ ] `labflow workflow create --template <name>`
- [ ] `labflow workflow run <id>`
- [ ] `labflow workflow status <id>`

**依存関係**:
- TASK-CLI-001: CLIフレームワーク
- TASK-WKFL-003: WorkflowService

---

#### TASK-CLI-003: プラグインコマンド実装

**優先度**: P0
**ストーリーポイント**: 3
**予定時間**: 5時間
**ステータス**: 未着手

**説明**:
プラグイン管理用CLIコマンドの実装。

**要件カバレッジ**:
- PLUG-MGMT-002: CLIプラグイン管理

**受け入れ基準**:
- [ ] `labflow plugin list`
- [ ] `labflow plugin install <name>`
- [ ] `labflow plugin uninstall <name>`
- [ ] `labflow plugin create <name>`（スキャフォールド）

**依存関係**:
- TASK-CLI-001: CLIフレームワーク
- TASK-PLUG-002: プラグインマネージャー

---

### 2.6 APIサーバー

#### TASK-API-001: Hono APIサーバー実装

**優先度**: P0
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: 未着手

**説明**:
ミドルウェア付きHono APIサーバーのセットアップ。

**要件カバレッジ**:
- ADR-004: Hono APIフレームワーク

**受け入れ基準**:
- [ ] Honoアプリ初期化
- [ ] CORSミドルウェア
- [ ] リクエスト検証ミドルウェア
- [ ] エラーハンドリングミドルウェア
- [ ] リクエストID生成
- [ ] ロギングミドルウェア

---

#### TASK-API-002: 認証エンドポイント実装

**優先度**: P0
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: 未着手

**説明**:
認証API エンドポイントの実装。

**受け入れ基準**:
- [ ] GET `/api/v1/auth/providers`
- [ ] POST `/api/v1/auth/login`
- [ ] POST `/api/v1/auth/logout`
- [ ] POST `/api/v1/auth/register`
- [ ] GET `/api/v1/auth/callback/entra`
- [ ] POST `/api/v1/auth/callback/shibboleth`
- [ ] GET `/api/v1/auth/me`

**依存関係**:
- TASK-API-001: Honoサーバー
- TASK-AUTH-002: AuthProviderFactory

---

#### TASK-API-003: ワークフローエンドポイント実装

**優先度**: P0
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: 未着手

**説明**:
ワークフロー管理APIエンドポイントの実装。

**受け入れ基準**:
- [ ] GET `/api/v1/workflows`
- [ ] POST `/api/v1/workflows`
- [ ] GET `/api/v1/workflows/:id`
- [ ] PUT `/api/v1/workflows/:id`
- [ ] DELETE `/api/v1/workflows/:id`
- [ ] POST `/api/v1/workflows/:id/execute`
- [ ] GET `/api/v1/executions/:id`
- [ ] POST `/api/v1/executions/:id/cancel`

**依存関係**:
- TASK-API-001: Honoサーバー
- TASK-WKFL-004: ExecutionService

---

#### TASK-API-004: プラグインエンドポイント実装

**優先度**: P0
**ストーリーポイント**: 3
**予定時間**: 5時間
**ステータス**: 未着手

**説明**:
プラグイン管理APIエンドポイントの実装。

**受け入れ基準**:
- [ ] GET `/api/v1/plugins`
- [ ] GET `/api/v1/plugins/:id`
- [ ] POST `/api/v1/plugins/:id/install`
- [ ] DELETE `/api/v1/plugins/:id/uninstall`
- [ ] POST `/api/v1/plugins/:id/enable`
- [ ] POST `/api/v1/plugins/:id/disable`
- [ ] GET, PUT `/api/v1/plugins/:id/config`

**依存関係**:
- TASK-API-001: Honoサーバー
- TASK-PLUG-002: プラグインマネージャー

---

### 2.7 Webアプリケーション

#### TASK-WEB-001: Next.jsアプリケーション初期化

**優先度**: P0
**ストーリーポイント**: 3
**予定時間**: 5時間
**ステータス**: 未着手

**説明**:
App RouterとTailwind CSS付きNext.js 15のセットアップ。

**要件カバレッジ**:
- 技術スタック: Next.js 15, React 19, Tailwind CSS 4

**受け入れ基準**:
- [ ] App Router付きNext.js 15
- [ ] Tailwind CSS 4設定
- [ ] shadcn/uiコンポーネントセットアップ
- [ ] ダークモードサポート
- [ ] 日本語ロケール

**依存関係**:
- TASK-INFRA-001: モノレポ構造

---

#### TASK-WEB-002: 認証ページ実装

**優先度**: P0
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: 未着手

**説明**:
マルチプロバイダーサポート付きログインページの実装。

**要件カバレッジ**:
- DASH-AUTH-005: プロバイダー選択UI

**受け入れ基準**:
- [ ] プロバイダー選択付きログインページ
- [ ] ローカルログインフォーム
- [ ] Entra IDログインボタン
- [ ] Shibbolethログインボタン
- [ ] 登録ページ
- [ ] パスワードリセットフロー

**依存関係**:
- TASK-WEB-001: Next.jsアプリ
- TASK-API-002: 認証エンドポイント

---

#### TASK-WEB-003: ダッシュボード実装

**優先度**: P0
**ストーリーポイント**: 8
**予定時間**: 12時間
**ステータス**: 未着手

**説明**:
ドメインカード付きメインダッシュボードの実装。

**要件カバレッジ**:
- DASH-QACT-001: クイックアクションボタン
- DASH-PROG-001: 進捗可視化

**受け入れ基準**:
- [ ] ドメインカード（創薬、材料、気候、ゲノミクス）
- [ ] クイックアクション
- [ ] 最近のプロジェクトリスト
- [ ] 実行進捗ビュー
- [ ] リソースモニターウィジェット

**依存関係**:
- TASK-WEB-002: 認証ページ
- TASK-API-003: ワークフローエンドポイント

---

#### TASK-WEB-004: ワークフロービルダー実装

**優先度**: P0
**ストーリーポイント**: 8
**予定時間**: 12時間
**ステータス**: 未着手

**説明**:
ドラッグ＆ドロップ付きビジュアルワークフロービルダーの実装。

**要件カバレッジ**:
- VISZ-WKFL-001: DAG可視化
- WKFL-COMM-004: スキップオプション

**受け入れ基準**:
- [ ] React FlowによるDAG可視化
- [ ] ステップドラッグ＆ドロップ
- [ ] ステップ設定パネル
- [ ] ステータス色分け
- [ ] リアルタイム実行進捗

**依存関係**:
- TASK-WEB-003: ダッシュボード
- TASK-PLUG-004, TASK-PLUG-005: ドメインプラグイン

---

---

## 3. P1タスク（高 - ローンチ必須）

### 3.1 GraphRAG統合

#### TASK-GRAG-001: GraphRAGサービス実装

**優先度**: P1
**ストーリーポイント**: 8
**予定時間**: 12時間
**ステータス**: 未着手

**説明**:
知識抽出のためのMicrosoft GraphRAG統合。

**要件カバレッジ**:
- KNOW-GRAG-001: GraphRAG統合
- KNOW-GRAG-002: エンティティ抽出
- KNOW-GRAG-003: 関係抽出

**受け入れ基準**:
- [ ] GraphRAGサービスラッパー
- [ ] ドキュメント取り込みパイプライン
- [ ] エンティティ抽出（化合物、タンパク質など）
- [ ] 関係抽出
- [ ] コミュニティ検出

**依存関係**:
- TASK-INFRA-003: pgvector付きデータベース

---

#### TASK-GRAG-002: 知識ベースAPI実装

**優先度**: P1
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: 未着手

**説明**:
知識ベース管理エンドポイントの実装。

**受け入れ基準**:
- [ ] GET, POST `/api/v1/knowledge-bases`
- [ ] POST `/api/v1/knowledge-bases/:id/query`
- [ ] 自然言語クエリサポート
- [ ] 引用取得

**依存関係**:
- TASK-GRAG-001: GraphRAGサービス

---

### 3.2 LLM統合（Esperanto）

#### TASK-LLM-001: Esperanto抽象化レイヤー統合

**優先度**: P1
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: 未着手

**説明**:
Ollama（開発）とAzure OpenAI（本番）を持つ統一LLMインターフェース用Esperantoのセットアップ。

**要件カバレッジ**:
- 技術スタック: Esperanto + Ollama（開発）+ Azure OpenAI（本番）

**受け入れ基準**:
- [ ] Esperanto設定
- [ ] 開発用Ollamaプロバイダー
- [ ] 本番用Azure OpenAIプロバイダー
- [ ] 環境ベースのプロバイダー切り替え
- [ ] 埋め込み生成

**依存関係**:
- TASK-INFRA-001: モノレポ

---

### 3.3 テスト＆品質

#### TASK-TEST-001: 統合テストスイート

**優先度**: P1
**ストーリーポイント**: 8
**予定時間**: 12時間
**ステータス**: 未着手

**説明**:
実データベースを使用した統合テストのセットアップ（Article IX）。

**要件カバレッジ**:
- Article IX: 実サービスを使用した統合テスト

**受け入れ基準**:
- [ ] テストデータベースセットアップ/クリーンアップ
- [ ] API統合テスト
- [ ] ワークフロー実行テスト
- [ ] 認証フローテスト
- [ ] カバレッジ ≥ 80%

**依存関係**:
- 全P0実装タスク

---

#### TASK-TEST-002: E2Eテストスイート

**優先度**: P1
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: 未着手

**説明**:
Playwrightを使用したエンドツーエンドテストのセットアップ。

**受け入れ基準**:
- [ ] Playwright設定
- [ ] ログインフローテスト
- [ ] ワークフロー作成テスト
- [ ] ダッシュボードテスト

**依存関係**:
- TASK-WEB-004: Webアプリケーション

---

### 3.4 追加プラグイン

#### TASK-PLUG-006: 気候プラグイン実装

**優先度**: P1
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: 未着手

**説明**:
気候/環境ドメインプラグインの実装。

**要件カバレッジ**:
- PLUG-CLIM-001: 気象データビューア
- PLUG-CLIM-002: Aurora統合
- PLUG-CLIM-003: ERA5コネクタ

**受け入れ基準**:
- [ ] ClimatePluginクラス
- [ ] Aurora予測ステップ
- [ ] ERA5データコネクタ
- [ ] GeoMap可視化

**依存関係**:
- TASK-PLUG-002: プラグインマネージャー

---

#### TASK-PLUG-007: ゲノミクスプラグイン実装

**優先度**: P1
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: 未着手

**説明**:
ゲノミクスドメインプラグインの実装。

**要件カバレッジ**:
- PLUG-GEN-001: シーケンスビューア
- PLUG-GEN-002: BioEmu統合
- PLUG-GEN-003: UniProtコネクタ

**受け入れ基準**:
- [ ] GenomicsPluginクラス
- [ ] BioEmu構造予測ステップ
- [ ] UniProtデータコネクタ
- [ ] タンパク質3D可視化

**依存関係**:
- TASK-PLUG-002: プラグインマネージャー

---

---

## 4. P2タスク（中 - MVPで望ましい）

### 4.1 高度な機能

#### TASK-ADV-001: 自然言語インターフェース実装

**優先度**: P2
**ストーリーポイント**: 8
**予定時間**: 12時間
**ステータス**: 未着手

**説明**:
自然言語ワークフロー生成の実装。

**要件カバレッジ**:
- DASH-NLI-001: 自然言語入力
- DASH-NLI-002: インテント解析
- DASH-NLI-007: パターン認識

**受け入れ基準**:
- [ ] 自然言語入力コンポーネント
- [ ] インテント抽出
- [ ] ワークフロー推奨
- [ ] 日本語サポート

**依存関係**:
- TASK-LLM-001: Esperanto統合

---

#### TASK-ADV-002: コラボレーション機能実装

**優先度**: P2
**ストーリーポイント**: 8
**予定時間**: 12時間
**ステータス**: 未着手

**説明**:
プロジェクト共有とチーム機能の実装。

**要件カバレッジ**:
- COLB-SHAR-001: プロジェクト共有
- COLB-TEAM-001: チーム管理

**受け入れ基準**:
- [ ] 権限付きプロジェクト共有
- [ ] チーム作成/管理
- [ ] アクティビティフィード
- [ ] コメント

---

### 4.2 学習モジュール

#### TASK-LERN-001: 学習パスシステム実装

**優先度**: P2
**ストーリーポイント**: 5
**予定時間**: 8時間
**ステータス**: 未着手

**説明**:
学習モジュールフレームワークの実装。

**要件カバレッジ**:
- LERN-PATH-001: 学習レベル
- LERN-CONT-001: コンテンツ形式

**受け入れ基準**:
- [ ] 学習パス定義
- [ ] 進捗トラッキング
- [ ] インタラクティブコード実行
- [ ] クイズシステム

---

---

## 5. P3タスク（低 - 将来）

### 5.1 高度な統合

#### TASK-FUT-001: HPC統合

**優先度**: P3
**ストーリーポイント**: 13
**ステータス**: 未着手

**要件カバレッジ**:
- PERF-HPC-JOB-001: Slurm統合

---

#### TASK-FUT-002: GxPコンプライアンスモード

**優先度**: P3
**ストーリーポイント**: 13
**ステータス**: 未着手

**要件カバレッジ**:
- SECU-GXP-001: 21 CFR Part 11

---

---

## 6. 要件カバレッジマトリックス

| 要件ID | 優先度 | タスク | ステータス |
|--------|--------|--------|-----------|
| DASH-AUTH-001 | P0 | TASK-AUTH-001, TASK-AUTH-002 | 未着手 |
| DASH-AUTH-002 | P0 | TASK-AUTH-003 | 未着手 |
| DASH-AUTH-003 | P0 | TASK-AUTH-004 | 未着手 |
| DASH-AUTH-004 | P0 | TASK-AUTH-005 | 未着手 |
| DASH-AUTH-005 | P0 | TASK-WEB-002 | 未着手 |
| DASH-AUTH-010-016 | P0 | TASK-AUTH-006 | 未着手 |
| DASH-PROJ-001 | P0 | TASK-WKFL-003 | 未着手 |
| DASH-PROG-001 | P0 | TASK-WKFL-004, TASK-WEB-003 | 未着手 |
| WKFL-COMM-001-007 | P0 | TASK-WKFL-001~005 | 未着手 |
| PLUG-CORE-001-006 | P0 | TASK-PLUG-001~003 | 未着手 |
| PLUG-INTF-001-005 | P0 | TASK-PLUG-003 | 未着手 |
| PLUG-DRUG-001-004 | P0 | TASK-PLUG-004 | 未着手 |
| PLUG-MAT-001-004 | P0 | TASK-PLUG-005 | 未着手 |
| PLUG-CLIM-001-004 | P1 | TASK-PLUG-006 | 未着手 |
| PLUG-GEN-001-004 | P1 | TASK-PLUG-007 | 未着手 |
| KNOW-GRAG-001-008 | P1 | TASK-GRAG-001~002 | 未着手 |
| Article I | P0 | TASK-INFRA-001 | 未着手 |
| Article II | P0 | TASK-CLI-001~003 | 未着手 |
| Article III | P0 | 全RED-GREEN-BLUEタスク | 未着手 |
| Article V | P0 | 本ドキュメント | 未着手 |
| Article IX | P1 | TASK-TEST-001 | 未着手 |

**カバレッジサマリー**:
- カバーされた要件合計: 50+
- P0要件: 全てマッピング済み
- **カバレッジ目標**: 100% ✅

---

## 7. タスク依存関係グラフ

```
TASK-INFRA-001 (モノレポ)
├── TASK-INFRA-002 (TypeScript)
├── TASK-INFRA-003 (データベース)
│   └── TASK-GRAG-001 (GraphRAG)
│       └── TASK-GRAG-002 (KB API)
│
├── TASK-AUTH-001 (テスト - RED)
│   └── TASK-AUTH-002 (ファクトリ - GREEN)
│       ├── TASK-AUTH-003 (ローカル)
│       │   └── TASK-AUTH-006 (セキュリティ)
│       ├── TASK-AUTH-004 (Entra)
│       └── TASK-AUTH-005 (Shibboleth)
│
├── TASK-PLUG-001 (テスト - RED)
│   └── TASK-PLUG-002 (マネージャー - GREEN)
│       └── TASK-PLUG-003 (インターフェース)
│           ├── TASK-PLUG-004 (創薬)
│           ├── TASK-PLUG-005 (材料)
│           ├── TASK-PLUG-006 (気候) [P1]
│           └── TASK-PLUG-007 (ゲノミクス) [P1]
│
├── TASK-WKFL-001 (テスト - RED)
│   └── TASK-WKFL-002 (ドメイン - GREEN)
│       └── TASK-WKFL-003 (サービス)
│           └── TASK-WKFL-004 (実行)
│               └── TASK-WKFL-005 (StepExecutor)
│
├── TASK-CLI-001 (フレームワーク)
│   ├── TASK-CLI-002 (ワークフローCmd)
│   └── TASK-CLI-003 (プラグインCmd)
│
├── TASK-API-001 (Honoサーバー)
│   ├── TASK-API-002 (認証API)
│   ├── TASK-API-003 (ワークフローAPI)
│   └── TASK-API-004 (プラグインAPI)
│
└── TASK-WEB-001 (Next.js)
    └── TASK-WEB-002 (認証ページ)
        └── TASK-WEB-003 (ダッシュボード)
            └── TASK-WEB-004 (ワークフロービルダー)

クリティカルパス: TASK-INFRA-001 → TASK-INFRA-003 → TASK-AUTH-002 → TASK-WKFL-004 → TASK-WEB-004
```

---

## 8. スプリント計画

### Sprint 1: 基盤 (Week 1-2)

**ゴール**: インフラストラクチャとコア認証のセットアップ

**タスク**:
- TASK-INFRA-001: モノレポ (3ポイント)
- TASK-INFRA-002: TypeScript (2ポイント)
- TASK-INFRA-003: データベース (5ポイント)
- TASK-AUTH-001: 認証テスト (3ポイント)
- TASK-AUTH-002: 認証ファクトリ (5ポイント)
- TASK-AUTH-003: ローカル認証 (5ポイント)

**合計**: 23ストーリーポイント

---

### Sprint 2: コアシステム (Week 3-4)

**ゴール**: 認証完了とワークフローエンジン開始

**タスク**:
- TASK-AUTH-004: Entra ID (5ポイント)
- TASK-AUTH-005: Shibboleth (8ポイント)
- TASK-AUTH-006: セキュリティ (5ポイント)
- TASK-WKFL-001: ワークフローテスト (3ポイント)
- TASK-WKFL-002: ワークフロードメイン (5ポイント)

**合計**: 26ストーリーポイント

---

### Sprint 3: プラグインシステム (Week 5-6)

**ゴール**: ワークフローエンジンとプラグインアーキテクチャの完成

**タスク**:
- TASK-WKFL-003: ワークフローサービス (5ポイント)
- TASK-WKFL-004: 実行サービス (8ポイント)
- TASK-PLUG-001: プラグインテスト (3ポイント)
- TASK-PLUG-002: プラグインマネージャー (8ポイント)
- TASK-PLUG-003: プラグインインターフェース (5ポイント)

**合計**: 29ストーリーポイント

---

### Sprint 4: ドメインプラグイン＆CLI (Week 7-8)

**ゴール**: ドメインプラグインとCLIの実装

**タスク**:
- TASK-PLUG-004: 創薬プラグイン (8ポイント)
- TASK-PLUG-005: 材料プラグイン (8ポイント)
- TASK-CLI-001: CLIフレームワーク (3ポイント)
- TASK-CLI-002: ワークフローCmd (5ポイント)
- TASK-CLI-003: プラグインCmd (3ポイント)

**合計**: 27ストーリーポイント

---

### Sprint 5: API＆Web (Week 9-10)

**ゴール**: APIサーバーとWebフロントエンドの実装

**タスク**:
- TASK-API-001: Honoサーバー (5ポイント)
- TASK-API-002: 認証エンドポイント (5ポイント)
- TASK-API-003: ワークフローエンドポイント (5ポイント)
- TASK-API-004: プラグインエンドポイント (3ポイント)
- TASK-WEB-001: Next.jsアプリ (3ポイント)
- TASK-WEB-002: 認証ページ (5ポイント)

**合計**: 26ストーリーポイント

---

### Sprint 6: Web＆統合 (Week 11-12)

**ゴール**: Webアプリと統合テストの完成

**タスク**:
- TASK-WEB-003: ダッシュボード (8ポイント)
- TASK-WEB-004: ワークフロービルダー (8ポイント)
- TASK-TEST-001: 統合テスト (8ポイント)

**合計**: 24ストーリーポイント

---

## 9. 見積もり工数サマリー

| カテゴリ | タスク数 | ストーリーポイント | 時間 |
|----------|----------|-------------------|------|
| インフラストラクチャ | 3 | 10 | 15 |
| 認証 | 6 | 31 | 49 |
| ワークフローエンジン | 5 | 24 | 38 |
| プラグインシステム | 7 | 40 | 62 |
| CLI | 3 | 11 | 18 |
| API | 4 | 18 | 29 |
| Web | 4 | 24 | 37 |
| GraphRAG | 2 | 13 | 20 |
| テスト | 2 | 13 | 20 |
| **P0合計** | **36** | **184** | **288** |

**P1追加**: 約50ストーリーポイント
**MVP合計**: 約234ストーリーポイント
**見積もり期間**: 12週間（6スプリント）

---

## 10. Constitutional コンプライアンス検証

### Article I: Library-First ✅
- [ ] 全機能を`packages/core/`に実装
- [ ] ライブラリに独立したテストスイート
- [ ] ライブラリがパブリックAPIをエクスポート

### Article II: CLIインターフェース ✅
- [ ] CLIインターフェース実装（TASK-CLI-*）
- [ ] 全主要操作を公開
- [ ] ヘルプテキスト提供

### Article III: テストファースト ✅
- [ ] REDタスクがGREENタスクの前
- [ ] Gitヒストリーにred-green-blueサイクル表示
- [ ] 全テストパス

### Article V: トレーサビリティ ✅
- [ ] 全要件をタスクにマッピング
- [ ] 全タスクをコードにマッピング
- [ ] 全コードをテストにマッピング
- [ ] カバレッジマトリックス維持

### Article IX: 統合テスト ✅
- [ ] 統合テストが実データベース使用
- [ ] 統合テストが実キャッシュ使用
- [ ] モック使用時は正当化

---

## 11. 次のステップ

1. チームでタスクブレークダウンをレビュー
2. 開発者にタスクを割り当て
3. Sprint 1実装開始
4. または オーケストレーター使用: `@orchestrator implement labflow`

---

**ドキュメント終了**
