/**
 * @file プロジェクト共有モジュール
 * @description 共有・コラボレーション機能のエクスポート
 * @module @labflow/web/components/sharing
 */

// 型定義
export type {
  // エクスポート/インポート
  ExportFormat,
  ExportOptions,
  ExportTarget,
  ExportRequest,
  ExportResult,
  ImportOptions,
  ImportValidation,
  ImportResult,
  ProjectExportData,
  WorkflowExportData,
  ResultExportData,
  AttachmentInfo,
  // 共有リンク
  SharePermission,
  ShareLinkConfig,
  ShareLink,
  ShareLinkAccessLog,
  // コラボレーション
  TeamMember,
  TeamInvitation,
  Comment,
  ActivityLog,
  ActivityAction,
  ProjectSharingSettings,
  // Props
  ExportDialogProps,
  ImportDialogProps,
  SharePanelProps,
  TeamMemberListProps,
  ShareLinkManagerProps,
  CommentSectionProps,
  ActivityFeedProps,
} from './types';

// ユーティリティ
export {
  // ラベル
  EXPORT_FORMAT_LABELS,
  PERMISSION_LABELS,
  ACTIVITY_ACTION_LABELS,
  // デフォルト値
  DEFAULT_EXPORT_OPTIONS,
  DEFAULT_IMPORT_OPTIONS,
  DEFAULT_SHARE_LINK_CONFIG,
  EXPORT_FORMAT_VERSION,
  // エクスポート
  createExportData,
  jsonToBlob,
  dataToCSV,
  dataToYAML,
  generateExportFilename,
  createExportBlob,
  executeExport,
  downloadBlob,
  // インポート
  readFileAsText,
  parseJSONFile,
  validateImportData,
  executeImport,
  // 共有リンク
  generateId,
  generateShortCode,
  createShareLink,
  isShareLinkValid,
  hashPassword,
  verifyPassword,
  // フォーマット
  formatFileSize,
  formatRelativeTime,
  formatDateTime,
  formatExpiration,
  formatMemberStatus,
  // クリップボード・URL
  copyToClipboard,
  buildShareUrl,
  buildEmailShareUrl,
} from './utils';

// コンポーネント
export { ExportDialog, ExportButton } from './export-dialog';
export { ImportDialog, ImportButton } from './import-dialog';
export { ShareLinkManager, QuickShareButton } from './share-link';
export { TeamMemberList, CommentSection, ActivityFeed } from './collaboration';
export { SharePanel } from './share-panel';
