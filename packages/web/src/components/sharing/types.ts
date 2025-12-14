/**
 * @file プロジェクト共有 型定義
 * @description プロジェクトのエクスポート、インポート、共有機能の型定義
 * @module @labflow/web/components/sharing/types
 */

// =============================================================================
// エクスポート/インポート関連
// =============================================================================

/** エクスポート形式 */
export type ExportFormat = 'json' | 'csv' | 'zip' | 'yaml';

/** エクスポートオプション */
export interface ExportOptions {
  /** エクスポート形式 */
  format: ExportFormat;
  /** ワークフロー結果を含める */
  includeResults?: boolean;
  /** ワークフロー履歴を含める */
  includeHistory?: boolean;
  /** 設定を含める */
  includeSettings?: boolean;
  /** 添付ファイルを含める */
  includeAttachments?: boolean;
  /** コメント・メモを含める */
  includeComments?: boolean;
  /** 圧縮を有効にする */
  compress?: boolean;
  /** ファイル名プレフィックス */
  filenamePrefix?: string;
}

/** エクスポート対象 */
export type ExportTarget = 
  | 'project'      // プロジェクト全体
  | 'workflow'     // 特定ワークフロー
  | 'results'      // 結果のみ
  | 'settings'     // 設定のみ
  | 'selection';   // 選択項目

/** エクスポートリクエスト */
export interface ExportRequest {
  /** エクスポート対象 */
  target: ExportTarget;
  /** 対象ID（プロジェクトID、ワークフローIDなど） */
  targetId: string;
  /** エクスポートオプション */
  options: ExportOptions;
}

/** エクスポート結果 */
export interface ExportResult {
  /** 成功フラグ */
  success: boolean;
  /** ファイル名 */
  filename?: string;
  /** ファイルサイズ（バイト） */
  size?: number;
  /** Blob URL（ダウンロード用） */
  blobUrl?: string;
  /** Blob データ */
  blob?: Blob;
  /** エラーメッセージ */
  error?: string;
  /** エクスポート日時 */
  exportedAt: Date;
}

/** インポートオプション */
export interface ImportOptions {
  /** 既存プロジェクトにマージするか新規作成か */
  mode: 'merge' | 'create' | 'replace';
  /** 競合時の処理 */
  conflictResolution: 'keep' | 'overwrite' | 'rename' | 'skip';
  /** 添付ファイルをインポートするか */
  importAttachments?: boolean;
  /** インポート先プロジェクトID（mergeモード時） */
  targetProjectId?: string;
  /** バリデーションのみ行う（ドライラン） */
  dryRun?: boolean;
}

/** インポートバリデーション結果 */
export interface ImportValidation {
  /** 有効かどうか */
  isValid: boolean;
  /** 警告メッセージ */
  warnings: string[];
  /** エラーメッセージ */
  errors: string[];
  /** 検出されたコンテンツ */
  detected: {
    /** ワークフロー数 */
    workflows: number;
    /** 結果数 */
    results: number;
    /** 添付ファイル数 */
    attachments: number;
    /** バージョン */
    version?: string;
    /** 作成元 */
    source?: string;
  };
}

/** インポート結果 */
export interface ImportResult {
  /** 成功フラグ */
  success: boolean;
  /** 作成されたプロジェクトID */
  projectId?: string;
  /** インポートされた項目数 */
  imported: {
    workflows: number;
    results: number;
    attachments: number;
    settings: number;
  };
  /** スキップされた項目数 */
  skipped: {
    workflows: number;
    results: number;
    attachments: number;
  };
  /** エラーメッセージ */
  error?: string;
  /** インポート日時 */
  importedAt: Date;
}

// =============================================================================
// 共有リンク関連
// =============================================================================

/** 共有権限レベル */
export type SharePermission = 
  | 'view'      // 閲覧のみ
  | 'comment'   // 閲覧 + コメント
  | 'edit'      // 閲覧 + 編集
  | 'admin';    // 全権限

/** 共有リンク設定 */
export interface ShareLinkConfig {
  /** 有効期限（null = 無期限） */
  expiresAt: Date | null;
  /** パスワード保護 */
  password?: string;
  /** 権限レベル */
  permission: SharePermission;
  /** ダウンロード許可 */
  allowDownload: boolean;
  /** 最大アクセス回数（null = 無制限） */
  maxAccessCount: number | null;
  /** アクセス制限IPアドレス（null = 制限なし） */
  allowedIps?: string[];
}

/** 共有リンク */
export interface ShareLink {
  /** リンクID */
  id: string;
  /** 共有URL */
  url: string;
  /** 短縮コード */
  shortCode: string;
  /** 対象プロジェクトID */
  projectId: string;
  /** 設定 */
  config: ShareLinkConfig;
  /** 作成者ID */
  createdBy: string;
  /** 作成日時 */
  createdAt: Date;
  /** アクセス回数 */
  accessCount: number;
  /** 最終アクセス日時 */
  lastAccessedAt?: Date;
  /** アクティブかどうか */
  isActive: boolean;
}

/** 共有リンクアクセスログ */
export interface ShareLinkAccessLog {
  /** ログID */
  id: string;
  /** リンクID */
  linkId: string;
  /** アクセス日時 */
  accessedAt: Date;
  /** IPアドレス */
  ipAddress?: string;
  /** ユーザーエージェント */
  userAgent?: string;
  /** 成功フラグ */
  success: boolean;
  /** 失敗理由 */
  failureReason?: 'expired' | 'password' | 'ip_blocked' | 'max_access' | 'disabled';
}

// =============================================================================
// コラボレーション関連
// =============================================================================

/** チームメンバー */
export interface TeamMember {
  /** ユーザーID */
  userId: string;
  /** ユーザー名 */
  name: string;
  /** メールアドレス */
  email: string;
  /** アバターURL */
  avatarUrl?: string;
  /** 役割 */
  role: SharePermission;
  /** 招待日時 */
  invitedAt: Date;
  /** 参加日時 */
  joinedAt?: Date;
  /** ステータス */
  status: 'pending' | 'active' | 'inactive';
  /** 最終アクティブ日時 */
  lastActiveAt?: Date;
}

/** チーム招待 */
export interface TeamInvitation {
  /** 招待ID */
  id: string;
  /** プロジェクトID */
  projectId: string;
  /** 招待者ID */
  invitedBy: string;
  /** 招待先メールアドレス */
  email: string;
  /** 役割 */
  role: SharePermission;
  /** 有効期限 */
  expiresAt: Date;
  /** ステータス */
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  /** 招待日時 */
  createdAt: Date;
  /** メッセージ */
  message?: string;
}

/** コメント */
export interface Comment {
  /** コメントID */
  id: string;
  /** プロジェクトID */
  projectId: string;
  /** 対象（ワークフローID、結果IDなど） */
  targetId?: string;
  /** 対象タイプ */
  targetType?: 'workflow' | 'result' | 'step' | 'project';
  /** 著者ID */
  authorId: string;
  /** 著者名 */
  authorName: string;
  /** 本文 */
  content: string;
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt?: Date;
  /** 親コメントID（スレッド返信用） */
  parentId?: string;
  /** リアクション */
  reactions?: Record<string, string[]>; // emoji -> userIds
  /** 解決済みフラグ */
  resolved?: boolean;
  /** メンション先ユーザーID */
  mentions?: string[];
}

/** アクティビティログ */
export interface ActivityLog {
  /** ログID */
  id: string;
  /** プロジェクトID */
  projectId: string;
  /** ユーザーID */
  userId: string;
  /** ユーザー名 */
  userName: string;
  /** アクション種別 */
  action: ActivityAction;
  /** 対象ID */
  targetId?: string;
  /** 対象タイプ */
  targetType?: string;
  /** 詳細情報 */
  details?: Record<string, unknown>;
  /** タイムスタンプ */
  timestamp: Date;
}

/** アクティビティアクション種別 */
export type ActivityAction =
  | 'project_created'
  | 'project_updated'
  | 'workflow_started'
  | 'workflow_completed'
  | 'workflow_failed'
  | 'member_invited'
  | 'member_joined'
  | 'member_left'
  | 'comment_added'
  | 'comment_resolved'
  | 'share_link_created'
  | 'share_link_accessed'
  | 'export_created'
  | 'import_completed'
  | 'settings_changed';

// =============================================================================
// プロジェクト共有設定
// =============================================================================

/** プロジェクト共有設定 */
export interface ProjectSharingSettings {
  /** プロジェクトID */
  projectId: string;
  /** 公開設定 */
  visibility: 'private' | 'team' | 'organization' | 'public';
  /** チームメンバー */
  members: TeamMember[];
  /** 共有リンク一覧 */
  shareLinks: ShareLink[];
  /** デフォルト権限 */
  defaultPermission: SharePermission;
  /** コメント許可 */
  allowComments: boolean;
  /** エクスポート許可 */
  allowExport: boolean;
  /** 通知設定 */
  notifications: {
    /** メンバー追加時 */
    onMemberAdded: boolean;
    /** コメント時 */
    onComment: boolean;
    /** ワークフロー完了時 */
    onWorkflowComplete: boolean;
    /** 共有リンクアクセス時 */
    onShareLinkAccess: boolean;
  };
}

// =============================================================================
// エクスポートデータ構造
// =============================================================================

/** プロジェクトエクスポートデータ */
export interface ProjectExportData {
  /** メタデータ */
  meta: {
    /** バージョン */
    version: string;
    /** エクスポート日時 */
    exportedAt: string;
    /** エクスポート元 */
    source: 'labflow';
    /** エクスポート形式バージョン */
    formatVersion: string;
  };
  /** プロジェクト情報 */
  project: {
    id: string;
    name: string;
    description?: string;
    domain?: string;
    createdAt: string;
    updatedAt: string;
    settings?: Record<string, unknown>;
  };
  /** ワークフロー一覧 */
  workflows?: WorkflowExportData[];
  /** 結果データ */
  results?: ResultExportData[];
  /** コメント */
  comments?: Comment[];
  /** 添付ファイル情報 */
  attachments?: AttachmentInfo[];
}

/** ワークフローエクスポートデータ */
export interface WorkflowExportData {
  id: string;
  name: string;
  description?: string;
  steps: Array<{
    id: string;
    type: string;
    config: Record<string, unknown>;
    order: number;
  }>;
  createdAt: string;
  updatedAt: string;
  status?: string;
}

/** 結果エクスポートデータ */
export interface ResultExportData {
  id: string;
  workflowId: string;
  stepId?: string;
  type: string;
  data: unknown;
  createdAt: string;
}

/** 添付ファイル情報 */
export interface AttachmentInfo {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  checksum?: string;
  /** Base64エンコードデータ（オプション） */
  data?: string;
  /** ファイルパス（ZIPエクスポート時） */
  path?: string;
}

// =============================================================================
// コンポーネントProps
// =============================================================================

/** エクスポートダイアログProps */
export interface ExportDialogProps {
  /** 開閉状態 */
  isOpen: boolean;
  /** 閉じるハンドラ */
  onClose: () => void;
  /** エクスポート対象 */
  target: ExportTarget;
  /** 対象ID */
  targetId: string;
  /** 対象名（表示用） */
  targetName?: string;
  /** エクスポート実行ハンドラ */
  onExport?: (result: ExportResult) => void;
  /** 日本語ラベル使用 */
  useJapaneseLabels?: boolean;
}

/** インポートダイアログProps */
export interface ImportDialogProps {
  /** 開閉状態 */
  isOpen: boolean;
  /** 閉じるハンドラ */
  onClose: () => void;
  /** インポート先プロジェクトID（既存プロジェクトへのマージ時） */
  targetProjectId?: string;
  /** インポート完了ハンドラ */
  onImport?: (result: ImportResult) => void;
  /** 日本語ラベル使用 */
  useJapaneseLabels?: boolean;
}

/** 共有パネルProps */
export interface SharePanelProps {
  /** プロジェクトID */
  projectId: string;
  /** 共有設定 */
  settings?: ProjectSharingSettings;
  /** 設定更新ハンドラ */
  onSettingsChange?: (settings: ProjectSharingSettings) => void;
  /** 読み取り専用 */
  readOnly?: boolean;
  /** 日本語ラベル使用 */
  useJapaneseLabels?: boolean;
}

/** チームメンバーリストProps */
export interface TeamMemberListProps {
  /** メンバー一覧 */
  members: TeamMember[];
  /** 現在のユーザーID */
  currentUserId?: string;
  /** メンバー追加ハンドラ */
  onAddMember?: (email: string, role: SharePermission) => void;
  /** メンバー削除ハンドラ */
  onRemoveMember?: (userId: string) => void;
  /** 役割変更ハンドラ */
  onChangeRole?: (userId: string, role: SharePermission) => void;
  /** 読み取り専用 */
  readOnly?: boolean;
  /** 日本語ラベル使用 */
  useJapaneseLabels?: boolean;
}

/** 共有リンク管理Props */
export interface ShareLinkManagerProps {
  /** 共有リンク一覧 */
  links: ShareLink[];
  /** プロジェクトID */
  projectId: string;
  /** リンク作成ハンドラ */
  onCreateLink?: (config: ShareLinkConfig) => void;
  /** リンク削除ハンドラ */
  onDeleteLink?: (linkId: string) => void;
  /** リンク無効化ハンドラ */
  onDeactivateLink?: (linkId: string) => void;
  /** 読み取り専用 */
  readOnly?: boolean;
  /** 日本語ラベル使用 */
  useJapaneseLabels?: boolean;
}

/** コメントセクションProps */
export interface CommentSectionProps {
  /** プロジェクトID */
  projectId: string;
  /** 対象ID（オプション） */
  targetId?: string;
  /** 対象タイプ */
  targetType?: Comment['targetType'];
  /** コメント一覧 */
  comments: Comment[];
  /** 現在のユーザーID */
  currentUserId?: string;
  /** コメント追加ハンドラ */
  onAddComment?: (content: string, parentId?: string) => void;
  /** コメント編集ハンドラ */
  onEditComment?: (commentId: string, content: string) => void;
  /** コメント削除ハンドラ */
  onDeleteComment?: (commentId: string) => void;
  /** リアクション追加ハンドラ */
  onAddReaction?: (commentId: string, emoji: string) => void;
  /** 解決マークハンドラ */
  onResolve?: (commentId: string) => void;
  /** 読み取り専用 */
  readOnly?: boolean;
  /** 日本語ラベル使用 */
  useJapaneseLabels?: boolean;
}

/** アクティビティフィードProps */
export interface ActivityFeedProps {
  /** アクティビティログ */
  activities: ActivityLog[];
  /** 最大表示件数 */
  maxItems?: number;
  /** もっと読み込むハンドラ */
  onLoadMore?: () => void;
  /** フィルター */
  filter?: {
    actions?: ActivityAction[];
    userId?: string;
    fromDate?: Date;
    toDate?: Date;
  };
  /** 日本語ラベル使用 */
  useJapaneseLabels?: boolean;
}
