/**
 * @file プロジェクト共有 ユーティリティ関数
 * @description エクスポート、インポート、共有リンク生成のユーティリティ
 * @module @labflow/web/components/sharing/utils
 */

import type {
  ExportFormat,
  ExportOptions,
  ExportResult,
  ImportOptions,
  ImportValidation,
  ImportResult,
  ShareLinkConfig,
  ShareLink,
  ProjectExportData,
  WorkflowExportData,
  ResultExportData,
  Comment,
  ActivityAction,
  SharePermission,
} from './types';

// =============================================================================
// 定数・ラベル
// =============================================================================

/** エクスポート形式ラベル */
export const EXPORT_FORMAT_LABELS: Record<ExportFormat, { en: string; ja: string }> = {
  json: { en: 'JSON', ja: 'JSON' },
  csv: { en: 'CSV', ja: 'CSV' },
  zip: { en: 'ZIP Archive', ja: 'ZIPアーカイブ' },
  yaml: { en: 'YAML', ja: 'YAML' },
};

/** 権限レベルラベル */
export const PERMISSION_LABELS: Record<SharePermission, { en: string; ja: string; description: { en: string; ja: string } }> = {
  view: {
    en: 'View',
    ja: '閲覧',
    description: { en: 'Can view project contents', ja: 'プロジェクト内容を閲覧できます' },
  },
  comment: {
    en: 'Comment',
    ja: 'コメント',
    description: { en: 'Can view and add comments', ja: '閲覧とコメントの追加ができます' },
  },
  edit: {
    en: 'Edit',
    ja: '編集',
    description: { en: 'Can view, comment, and edit', ja: '閲覧、コメント、編集ができます' },
  },
  admin: {
    en: 'Admin',
    ja: '管理者',
    description: { en: 'Full access including settings', ja: '設定を含む全ての操作ができます' },
  },
};

/** アクティビティアクションラベル */
export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, { en: string; ja: string }> = {
  project_created: { en: 'Project created', ja: 'プロジェクトを作成しました' },
  project_updated: { en: 'Project updated', ja: 'プロジェクトを更新しました' },
  workflow_started: { en: 'Workflow started', ja: 'ワークフローを開始しました' },
  workflow_completed: { en: 'Workflow completed', ja: 'ワークフローが完了しました' },
  workflow_failed: { en: 'Workflow failed', ja: 'ワークフローが失敗しました' },
  member_invited: { en: 'Member invited', ja: 'メンバーを招待しました' },
  member_joined: { en: 'Member joined', ja: 'メンバーが参加しました' },
  member_left: { en: 'Member left', ja: 'メンバーが退出しました' },
  comment_added: { en: 'Comment added', ja: 'コメントを追加しました' },
  comment_resolved: { en: 'Comment resolved', ja: 'コメントを解決しました' },
  share_link_created: { en: 'Share link created', ja: '共有リンクを作成しました' },
  share_link_accessed: { en: 'Share link accessed', ja: '共有リンクがアクセスされました' },
  export_created: { en: 'Export created', ja: 'エクスポートを作成しました' },
  import_completed: { en: 'Import completed', ja: 'インポートが完了しました' },
  settings_changed: { en: 'Settings changed', ja: '設定を変更しました' },
};

/** デフォルトエクスポートオプション */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'json',
  includeResults: true,
  includeHistory: false,
  includeSettings: true,
  includeAttachments: false,
  includeComments: true,
  compress: false,
  filenamePrefix: 'labflow-export',
};

/** デフォルトインポートオプション */
export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  mode: 'create',
  conflictResolution: 'rename',
  importAttachments: true,
  dryRun: false,
};

/** デフォルト共有リンク設定 */
export const DEFAULT_SHARE_LINK_CONFIG: ShareLinkConfig = {
  expiresAt: null,
  permission: 'view',
  allowDownload: false,
  maxAccessCount: null,
};

// =============================================================================
// エクスポート関連ユーティリティ
// =============================================================================

/** 現在のフォーマットバージョン */
export const EXPORT_FORMAT_VERSION = '1.0.0';

/**
 * プロジェクトデータをエクスポート用に整形
 */
export function createExportData(
  project: {
    id: string;
    name: string;
    description?: string;
    domain?: string;
    createdAt: Date;
    updatedAt: Date;
    settings?: Record<string, unknown>;
  },
  options: ExportOptions,
  data: {
    workflows?: WorkflowExportData[];
    results?: ResultExportData[];
    comments?: Comment[];
  } = {}
): ProjectExportData {
  const exportData: ProjectExportData = {
    meta: {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      source: 'labflow',
      formatVersion: EXPORT_FORMAT_VERSION,
    },
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      domain: project.domain,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      settings: options.includeSettings ? project.settings : undefined,
    },
  };

  if (options.includeResults && data.workflows) {
    exportData.workflows = data.workflows;
  }

  if (options.includeResults && data.results) {
    exportData.results = data.results;
  }

  if (options.includeComments && data.comments) {
    exportData.comments = data.comments;
  }

  return exportData;
}

/**
 * JSONデータをBlobに変換
 */
export function jsonToBlob(data: unknown, pretty = true): Blob {
  const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  return new Blob([json], { type: 'application/json' });
}

/**
 * データをCSVに変換
 */
export function dataToCSV(
  data: Array<Record<string, unknown>>,
  options: { headers?: string[]; delimiter?: string } = {}
): string {
  if (data.length === 0) return '';

  const { delimiter = ',' } = options;
  const headers = options.headers ?? Object.keys(data[0]);
  
  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.join(delimiter),
    ...data.map(row => headers.map(h => escapeCSV(row[h])).join(delimiter)),
  ];

  return lines.join('\n');
}

/**
 * データをYAMLに変換（簡易実装）
 */
export function dataToYAML(data: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent);
  
  if (data === null || data === undefined) {
    return 'null';
  }
  
  if (typeof data === 'string') {
    if (data.includes('\n') || data.includes(':') || data.includes('#')) {
      return `|\n${data.split('\n').map(line => spaces + '  ' + line).join('\n')}`;
    }
    return data;
  }
  
  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';
    return data.map(item => `${spaces}- ${dataToYAML(item, indent + 1)}`).join('\n');
  }
  
  if (typeof data === 'object') {
    const entries = Object.entries(data);
    if (entries.length === 0) return '{}';
    return entries
      .map(([key, value]) => {
        const valueStr = dataToYAML(value, indent + 1);
        if (typeof value === 'object' && value !== null) {
          return `${spaces}${key}:\n${valueStr}`;
        }
        return `${spaces}${key}: ${valueStr}`;
      })
      .join('\n');
  }
  
  return String(data);
}

/**
 * エクスポートファイル名を生成
 */
export function generateExportFilename(
  prefix: string,
  format: ExportFormat,
  projectName?: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const safeName = projectName?.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30) ?? 'project';
  const extension = format === 'zip' ? 'zip' : format;
  return `${prefix}_${safeName}_${timestamp}.${extension}`;
}

/**
 * データをエクスポート形式に変換してBlobを生成
 */
export function createExportBlob(
  data: ProjectExportData,
  format: ExportFormat
): { blob: Blob; mimeType: string } {
  switch (format) {
    case 'json':
      return {
        blob: jsonToBlob(data),
        mimeType: 'application/json',
      };
    
    case 'yaml':
      return {
        blob: new Blob([dataToYAML(data)], { type: 'text/yaml' }),
        mimeType: 'text/yaml',
      };
    
    case 'csv': {
      // CSVの場合は結果データをフラットに変換
      const rows: Array<Record<string, unknown>> = [];
      
      if (data.results) {
        for (const result of data.results) {
          rows.push({
            result_id: result.id,
            workflow_id: result.workflowId,
            step_id: result.stepId ?? '',
            type: result.type,
            data: JSON.stringify(result.data),
            created_at: result.createdAt,
          });
        }
      }
      
      return {
        blob: new Blob([dataToCSV(rows)], { type: 'text/csv' }),
        mimeType: 'text/csv',
      };
    }
    
    case 'zip':
      // ZIP形式はより複雑な処理が必要（別途実装）
      // ここでは単純にJSONをラップ
      return {
        blob: jsonToBlob(data),
        mimeType: 'application/zip',
      };
    
    default:
      return {
        blob: jsonToBlob(data),
        mimeType: 'application/json',
      };
  }
}

/**
 * エクスポートを実行
 */
export async function executeExport(
  data: ProjectExportData,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    const filename = generateExportFilename(
      options.filenamePrefix ?? 'labflow-export',
      options.format,
      data.project.name
    );
    
    const { blob } = createExportBlob(data, options.format);
    const blobUrl = URL.createObjectURL(blob);
    
    return {
      success: true,
      filename,
      size: blob.size,
      blobUrl,
      blob,
      exportedAt: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'エクスポートに失敗しました',
      exportedAt: new Date(),
    };
  }
}

/**
 * Blobをダウンロード
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =============================================================================
// インポート関連ユーティリティ
// =============================================================================

/**
 * ファイルを読み込んでテキストとして返す
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsText(file);
  });
}

/**
 * JSONファイルをパース
 */
export async function parseJSONFile(file: File): Promise<unknown> {
  const text = await readFileAsText(file);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('JSONの解析に失敗しました');
  }
}

/**
 * インポートデータのバリデーション
 */
export function validateImportData(data: unknown): ImportValidation {
  const warnings: string[] = [];
  const errors: string[] = [];
  const detected = {
    workflows: 0,
    results: 0,
    attachments: 0,
    version: undefined as string | undefined,
    source: undefined as string | undefined,
  };

  // 基本構造チェック
  if (!data || typeof data !== 'object') {
    errors.push('無効なデータ形式です');
    return { isValid: false, warnings, errors, detected };
  }

  const obj = data as Record<string, unknown>;

  // メタデータチェック
  if (obj.meta && typeof obj.meta === 'object') {
    const meta = obj.meta as Record<string, unknown>;
    detected.version = meta.version as string | undefined;
    detected.source = meta.source as string | undefined;
    
    if (meta.source !== 'labflow') {
      warnings.push('このファイルは別のアプリケーションで作成された可能性があります');
    }
    
    if (meta.formatVersion !== EXPORT_FORMAT_VERSION) {
      warnings.push(`形式バージョンが異なります（期待: ${EXPORT_FORMAT_VERSION}、実際: ${meta.formatVersion}）`);
    }
  } else {
    warnings.push('メタデータがありません');
  }

  // プロジェクトデータチェック
  if (!obj.project || typeof obj.project !== 'object') {
    errors.push('プロジェクトデータがありません');
  } else {
    const project = obj.project as Record<string, unknown>;
    if (!project.name) {
      errors.push('プロジェクト名がありません');
    }
  }

  // ワークフローチェック
  if (obj.workflows && Array.isArray(obj.workflows)) {
    detected.workflows = obj.workflows.length;
  }

  // 結果チェック
  if (obj.results && Array.isArray(obj.results)) {
    detected.results = obj.results.length;
  }

  // 添付ファイルチェック
  if (obj.attachments && Array.isArray(obj.attachments)) {
    detected.attachments = obj.attachments.length;
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    detected,
  };
}

/**
 * インポートを実行
 */
export async function executeImport(
  data: ProjectExportData,
  options: ImportOptions
): Promise<ImportResult> {
  try {
    // バリデーション
    const validation = validateImportData(data);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', '),
        imported: { workflows: 0, results: 0, attachments: 0, settings: 0 },
        skipped: { workflows: 0, results: 0, attachments: 0 },
        importedAt: new Date(),
      };
    }

    // ドライランの場合はここで終了
    if (options.dryRun) {
      return {
        success: true,
        imported: {
          workflows: validation.detected.workflows,
          results: validation.detected.results,
          attachments: options.importAttachments ? validation.detected.attachments : 0,
          settings: data.project.settings ? 1 : 0,
        },
        skipped: {
          workflows: 0,
          results: 0,
          attachments: options.importAttachments ? 0 : validation.detected.attachments,
        },
        importedAt: new Date(),
      };
    }

    // 実際のインポート処理（実装はバックエンドに依存）
    const projectId = generateId();
    
    return {
      success: true,
      projectId,
      imported: {
        workflows: validation.detected.workflows,
        results: validation.detected.results,
        attachments: options.importAttachments ? validation.detected.attachments : 0,
        settings: data.project.settings ? 1 : 0,
      },
      skipped: {
        workflows: 0,
        results: 0,
        attachments: options.importAttachments ? 0 : validation.detected.attachments,
      },
      importedAt: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'インポートに失敗しました',
      imported: { workflows: 0, results: 0, attachments: 0, settings: 0 },
      skipped: { workflows: 0, results: 0, attachments: 0 },
      importedAt: new Date(),
    };
  }
}

// =============================================================================
// 共有リンク関連ユーティリティ
// =============================================================================

/**
 * ランダムIDを生成
 */
export function generateId(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 短縮コードを生成
 */
export function generateShortCode(length = 8): string {
  // 紛らわしい文字を除外（0, O, I, l）
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 共有リンクを生成
 */
export function createShareLink(
  projectId: string,
  config: ShareLinkConfig,
  createdBy: string,
  baseUrl = ''
): ShareLink {
  const id = generateId();
  const shortCode = generateShortCode();
  
  return {
    id,
    url: `${baseUrl}/share/${shortCode}`,
    shortCode,
    projectId,
    config,
    createdBy,
    createdAt: new Date(),
    accessCount: 0,
    isActive: true,
  };
}

/**
 * 共有リンクの有効性をチェック
 */
export function isShareLinkValid(link: ShareLink): {
  valid: boolean;
  reason?: 'disabled' | 'expired' | 'max_access';
} {
  if (!link.isActive) {
    return { valid: false, reason: 'disabled' };
  }
  
  if (link.config.expiresAt && new Date() > link.config.expiresAt) {
    return { valid: false, reason: 'expired' };
  }
  
  if (link.config.maxAccessCount !== null && link.accessCount >= link.config.maxAccessCount) {
    return { valid: false, reason: 'max_access' };
  }
  
  return { valid: true };
}

/**
 * パスワードをハッシュ化（簡易実装）
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * パスワードを検証
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

// =============================================================================
// フォーマット・表示ユーティリティ
// =============================================================================

/**
 * ファイルサイズをフォーマット
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

/**
 * 相対時間をフォーマット
 */
export function formatRelativeTime(date: Date, locale: 'en' | 'ja' = 'ja'): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (locale === 'ja') {
    if (seconds < 60) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString('ja-JP');
  }

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US');
}

/**
 * 日時をフォーマット
 */
export function formatDateTime(date: Date, locale: 'en' | 'ja' = 'ja'): string {
  if (locale === 'ja') {
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 有効期限をフォーマット
 */
export function formatExpiration(date: Date | null, locale: 'en' | 'ja' = 'ja'): string {
  if (!date) {
    return locale === 'ja' ? '無期限' : 'Never expires';
  }
  
  const now = new Date();
  if (date < now) {
    return locale === 'ja' ? '期限切れ' : 'Expired';
  }
  
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days <= 1) {
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    return locale === 'ja' ? `${hours}時間後` : `${hours}h remaining`;
  }
  
  if (days <= 7) {
    return locale === 'ja' ? `${days}日後` : `${days}d remaining`;
  }
  
  return formatDateTime(date, locale);
}

/**
 * メンバーステータスをフォーマット
 */
export function formatMemberStatus(
  status: 'pending' | 'active' | 'inactive',
  locale: 'en' | 'ja' = 'ja'
): { label: string; color: string } {
  const labels: Record<typeof status, { en: string; ja: string; color: string }> = {
    pending: { en: 'Pending', ja: '招待中', color: '#f59e0b' },
    active: { en: 'Active', ja: 'アクティブ', color: '#10b981' },
    inactive: { en: 'Inactive', ja: '非アクティブ', color: '#6b7280' },
  };
  
  return {
    label: locale === 'ja' ? labels[status].ja : labels[status].en,
    color: labels[status].color,
  };
}

// =============================================================================
// クリップボード・URL操作
// =============================================================================

/**
 * テキストをクリップボードにコピー
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // フォールバック
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

/**
 * 共有URLを生成
 */
export function buildShareUrl(shortCode: string, baseUrl?: string): string {
  const base = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/share/${shortCode}`;
}

/**
 * メール共有URLを生成
 */
export function buildEmailShareUrl(
  shareUrl: string,
  projectName: string,
  locale: 'en' | 'ja' = 'ja'
): string {
  const subject = locale === 'ja'
    ? `[LabFlow] ${projectName}への招待`
    : `[LabFlow] Invitation to ${projectName}`;
  
  const body = locale === 'ja'
    ? `LabFlowプロジェクト「${projectName}」への招待です。\n\n以下のリンクからアクセスしてください：\n${shareUrl}`
    : `You have been invited to the LabFlow project "${projectName}".\n\nAccess it here:\n${shareUrl}`;
  
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
