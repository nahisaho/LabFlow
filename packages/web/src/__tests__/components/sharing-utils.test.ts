/**
 * @file 共有ユーティリティ テスト
 * @description エクスポート、インポート、共有リンク関連のユーティリティ関数テスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
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
  // インポート
  validateImportData,
  executeImport,
  // 共有リンク
  generateId,
  generateShortCode,
  createShareLink,
  isShareLinkValid,
  // フォーマット
  formatFileSize,
  formatRelativeTime,
  formatDateTime,
  formatExpiration,
  formatMemberStatus,
  // クリップボード・URL
  buildShareUrl,
  buildEmailShareUrl,
} from '@/components/sharing';
import type { ShareLink, ShareLinkConfig, ProjectExportData } from '@/components/sharing';

describe('共有ユーティリティ', () => {
  describe('ラベル定義', () => {
    it('エクスポート形式ラベルが定義されている', () => {
      expect(EXPORT_FORMAT_LABELS.json).toEqual({ en: 'JSON', ja: 'JSON' });
      expect(EXPORT_FORMAT_LABELS.csv).toEqual({ en: 'CSV', ja: 'CSV' });
      expect(EXPORT_FORMAT_LABELS.zip.ja).toBe('ZIPアーカイブ');
      expect(EXPORT_FORMAT_LABELS.yaml).toBeDefined();
    });

    it('権限ラベルが定義されている', () => {
      expect(PERMISSION_LABELS.view.ja).toBe('閲覧');
      expect(PERMISSION_LABELS.comment.ja).toBe('コメント');
      expect(PERMISSION_LABELS.edit.ja).toBe('編集');
      expect(PERMISSION_LABELS.admin.ja).toBe('管理者');
      expect(PERMISSION_LABELS.view.description.ja).toBeDefined();
    });

    it('アクティビティラベルが定義されている', () => {
      expect(ACTIVITY_ACTION_LABELS.project_created.ja).toBe('プロジェクトを作成しました');
      expect(ACTIVITY_ACTION_LABELS.workflow_completed.ja).toBe('ワークフローが完了しました');
      expect(ACTIVITY_ACTION_LABELS.member_invited.ja).toBe('メンバーを招待しました');
    });
  });

  describe('デフォルト値', () => {
    it('デフォルトエクスポートオプションが正しい', () => {
      expect(DEFAULT_EXPORT_OPTIONS.format).toBe('json');
      expect(DEFAULT_EXPORT_OPTIONS.includeResults).toBe(true);
      expect(DEFAULT_EXPORT_OPTIONS.includeSettings).toBe(true);
      expect(DEFAULT_EXPORT_OPTIONS.compress).toBe(false);
    });

    it('デフォルトインポートオプションが正しい', () => {
      expect(DEFAULT_IMPORT_OPTIONS.mode).toBe('create');
      expect(DEFAULT_IMPORT_OPTIONS.conflictResolution).toBe('rename');
      expect(DEFAULT_IMPORT_OPTIONS.importAttachments).toBe(true);
    });

    it('デフォルト共有リンク設定が正しい', () => {
      expect(DEFAULT_SHARE_LINK_CONFIG.permission).toBe('view');
      expect(DEFAULT_SHARE_LINK_CONFIG.allowDownload).toBe(false);
      expect(DEFAULT_SHARE_LINK_CONFIG.expiresAt).toBeNull();
    });
  });

  describe('エクスポート機能', () => {
    it('createExportData: プロジェクトデータを正しくエクスポート形式に変換', () => {
      const project = {
        id: 'proj-1',
        name: 'テストプロジェクト',
        description: '説明文',
        domain: 'drug-discovery',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
        settings: { theme: 'dark' },
      };

      const result = createExportData(project, DEFAULT_EXPORT_OPTIONS);

      expect(result.meta.source).toBe('labflow');
      expect(result.meta.formatVersion).toBe(EXPORT_FORMAT_VERSION);
      expect(result.project.name).toBe('テストプロジェクト');
      expect(result.project.settings).toEqual({ theme: 'dark' });
    });

    it('createExportData: includeSettings=false で設定を除外', () => {
      const project = {
        id: 'proj-1',
        name: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: { key: 'value' },
      };

      const result = createExportData(project, { ...DEFAULT_EXPORT_OPTIONS, includeSettings: false });

      expect(result.project.settings).toBeUndefined();
    });

    it('jsonToBlob: JSONをBlobに変換', () => {
      const data = { key: 'value' };
      const blob = jsonToBlob(data);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });

    it('dataToCSV: 配列をCSVに変換', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];

      const csv = dataToCSV(data);

      expect(csv).toContain('name,age');
      expect(csv).toContain('Alice,30');
      expect(csv).toContain('Bob,25');
    });

    it('dataToCSV: 特殊文字をエスケープ', () => {
      const data = [{ name: 'Test, Name', value: 'Has "quotes"' }];
      const csv = dataToCSV(data);

      expect(csv).toContain('"Test, Name"');
      expect(csv).toContain('"Has ""quotes"""');
    });

    it('dataToCSV: 空配列で空文字列を返す', () => {
      expect(dataToCSV([])).toBe('');
    });

    it('dataToYAML: オブジェクトをYAMLに変換', () => {
      const data = { name: 'Test', count: 42 };
      const yaml = dataToYAML(data);

      expect(yaml).toContain('name: Test');
      expect(yaml).toContain('count: 42');
    });

    it('generateExportFilename: ファイル名を生成', () => {
      const filename = generateExportFilename('labflow', 'json', 'My Project');

      expect(filename).toMatch(/^labflow_My_Project_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
    });

    it('createExportBlob: 各形式でBlobを生成', () => {
      const data: ProjectExportData = {
        meta: {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          source: 'labflow',
          formatVersion: '1.0.0',
        },
        project: {
          id: 'p1',
          name: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      const json = createExportBlob(data, 'json');
      expect(json.mimeType).toBe('application/json');

      const yaml = createExportBlob(data, 'yaml');
      expect(yaml.mimeType).toBe('text/yaml');

      const csv = createExportBlob(data, 'csv');
      expect(csv.mimeType).toBe('text/csv');
    });

    it('executeExport: エクスポートを実行', async () => {
      // URL.createObjectURL をモック
      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = vi.fn(() => 'blob:mock-url');

      const data: ProjectExportData = {
        meta: {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          source: 'labflow',
          formatVersion: '1.0.0',
        },
        project: {
          id: 'p1',
          name: 'Test Project',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      const result = await executeExport(data, DEFAULT_EXPORT_OPTIONS);

      expect(result.success).toBe(true);
      expect(result.filename).toBeDefined();
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.size).toBeGreaterThan(0);

      // モックを復元
      URL.createObjectURL = originalCreateObjectURL;
    });
  });

  describe('インポート機能', () => {
    it('validateImportData: 有効なデータを検証', () => {
      const data: ProjectExportData = {
        meta: {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          source: 'labflow',
          formatVersion: EXPORT_FORMAT_VERSION,
        },
        project: {
          id: 'p1',
          name: 'Valid Project',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        workflows: [{ id: 'w1', name: 'WF', steps: [], createdAt: '', updatedAt: '' }],
        results: [{ id: 'r1', workflowId: 'w1', type: 'test', data: {}, createdAt: '' }],
      };

      const result = validateImportData(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.detected.workflows).toBe(1);
      expect(result.detected.results).toBe(1);
    });

    it('validateImportData: 無効なデータでエラーを返す', () => {
      const result = validateImportData(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('無効なデータ形式です');
    });

    it('validateImportData: プロジェクト名がない場合エラー', () => {
      const data = {
        meta: { source: 'labflow', formatVersion: '1.0.0' },
        project: { id: 'p1' },
      };

      const result = validateImportData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('プロジェクト名がありません');
    });

    it('validateImportData: 別ソースの場合警告', () => {
      const data = {
        meta: { source: 'other-app', formatVersion: '1.0.0' },
        project: { id: 'p1', name: 'Test' },
      };

      const result = validateImportData(data);
      expect(result.warnings.some(w => w.includes('別のアプリケーション'))).toBe(true);
    });

    it('executeImport: ドライランで結果をプレビュー', async () => {
      const data: ProjectExportData = {
        meta: {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          source: 'labflow',
          formatVersion: EXPORT_FORMAT_VERSION,
        },
        project: {
          id: 'p1',
          name: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        workflows: [{ id: 'w1', name: 'WF', steps: [], createdAt: '', updatedAt: '' }],
      };

      const result = await executeImport(data, { ...DEFAULT_IMPORT_OPTIONS, dryRun: true });

      expect(result.success).toBe(true);
      expect(result.imported.workflows).toBe(1);
    });
  });

  describe('共有リンク機能', () => {
    it('generateId: 指定長さのIDを生成', () => {
      const id = generateId(16);
      expect(id).toHaveLength(16);
      expect(/^[A-Za-z0-9]+$/.test(id)).toBe(true);
    });

    it('generateShortCode: 紛らわしい文字を除いたコードを生成', () => {
      const code = generateShortCode(8);
      expect(code).toHaveLength(8);
      // 0, O, I, l を含まない
      expect(code).not.toMatch(/[0OIl]/);
    });

    it('createShareLink: 共有リンクを作成', () => {
      const config: ShareLinkConfig = {
        expiresAt: new Date(Date.now() + 86400000),
        permission: 'view',
        allowDownload: true,
        maxAccessCount: 100,
      };

      const link = createShareLink('proj-1', config, 'user-1', 'https://example.com');

      expect(link.id).toBeDefined();
      expect(link.shortCode).toHaveLength(8);
      expect(link.url).toContain('https://example.com/share/');
      expect(link.projectId).toBe('proj-1');
      expect(link.createdBy).toBe('user-1');
      expect(link.isActive).toBe(true);
      expect(link.accessCount).toBe(0);
    });

    it('isShareLinkValid: アクティブなリンクは有効', () => {
      const link: ShareLink = {
        id: 'link-1',
        url: 'https://example.com/share/abc',
        shortCode: 'abc',
        projectId: 'proj-1',
        config: { ...DEFAULT_SHARE_LINK_CONFIG },
        createdBy: 'user-1',
        createdAt: new Date(),
        accessCount: 0,
        isActive: true,
      };

      expect(isShareLinkValid(link)).toEqual({ valid: true });
    });

    it('isShareLinkValid: 無効化されたリンク', () => {
      const link: ShareLink = {
        id: 'link-1',
        url: 'https://example.com/share/abc',
        shortCode: 'abc',
        projectId: 'proj-1',
        config: { ...DEFAULT_SHARE_LINK_CONFIG },
        createdBy: 'user-1',
        createdAt: new Date(),
        accessCount: 0,
        isActive: false,
      };

      expect(isShareLinkValid(link)).toEqual({ valid: false, reason: 'disabled' });
    });

    it('isShareLinkValid: 期限切れリンク', () => {
      const link: ShareLink = {
        id: 'link-1',
        url: 'https://example.com/share/abc',
        shortCode: 'abc',
        projectId: 'proj-1',
        config: {
          ...DEFAULT_SHARE_LINK_CONFIG,
          expiresAt: new Date(Date.now() - 86400000), // 昨日
        },
        createdBy: 'user-1',
        createdAt: new Date(),
        accessCount: 0,
        isActive: true,
      };

      expect(isShareLinkValid(link)).toEqual({ valid: false, reason: 'expired' });
    });

    it('isShareLinkValid: アクセス上限超過', () => {
      const link: ShareLink = {
        id: 'link-1',
        url: 'https://example.com/share/abc',
        shortCode: 'abc',
        projectId: 'proj-1',
        config: {
          ...DEFAULT_SHARE_LINK_CONFIG,
          maxAccessCount: 10,
        },
        createdBy: 'user-1',
        createdAt: new Date(),
        accessCount: 10,
        isActive: true,
      };

      expect(isShareLinkValid(link)).toEqual({ valid: false, reason: 'max_access' });
    });
  });

  describe('フォーマット機能', () => {
    it('formatFileSize: ファイルサイズをフォーマット', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('formatRelativeTime: 相対時間をフォーマット（日本語）', () => {
      const now = new Date();
      
      expect(formatRelativeTime(new Date(now.getTime() - 30000), 'ja')).toBe('たった今');
      expect(formatRelativeTime(new Date(now.getTime() - 120000), 'ja')).toBe('2分前');
      expect(formatRelativeTime(new Date(now.getTime() - 3600000), 'ja')).toBe('1時間前');
      expect(formatRelativeTime(new Date(now.getTime() - 86400000), 'ja')).toBe('1日前');
    });

    it('formatRelativeTime: 相対時間をフォーマット（英語）', () => {
      const now = new Date();
      
      expect(formatRelativeTime(new Date(now.getTime() - 30000), 'en')).toBe('just now');
      expect(formatRelativeTime(new Date(now.getTime() - 120000), 'en')).toBe('2m ago');
      expect(formatRelativeTime(new Date(now.getTime() - 3600000), 'en')).toBe('1h ago');
    });

    it('formatDateTime: 日時をフォーマット', () => {
      const date = new Date('2025-06-15T14:30:00');
      
      const jaResult = formatDateTime(date, 'ja');
      expect(jaResult).toContain('2025');
      
      const enResult = formatDateTime(date, 'en');
      expect(enResult).toContain('2025');
    });

    it('formatExpiration: 有効期限をフォーマット', () => {
      expect(formatExpiration(null, 'ja')).toBe('無期限');
      expect(formatExpiration(null, 'en')).toBe('Never expires');
      
      const pastDate = new Date(Date.now() - 86400000);
      expect(formatExpiration(pastDate, 'ja')).toBe('期限切れ');
      expect(formatExpiration(pastDate, 'en')).toBe('Expired');
      
      const futureDate = new Date(Date.now() + 12 * 3600000);
      const jaExpiration = formatExpiration(futureDate, 'ja');
      expect(jaExpiration).toContain('時間後');
    });

    it('formatMemberStatus: メンバーステータスをフォーマット', () => {
      expect(formatMemberStatus('pending', 'ja')).toEqual({
        label: '招待中',
        color: '#f59e0b',
      });
      expect(formatMemberStatus('active', 'ja')).toEqual({
        label: 'アクティブ',
        color: '#10b981',
      });
      expect(formatMemberStatus('inactive', 'en')).toEqual({
        label: 'Inactive',
        color: '#6b7280',
      });
    });
  });

  describe('URL生成', () => {
    it('buildShareUrl: 共有URLを生成', () => {
      expect(buildShareUrl('abc123', 'https://labflow.io')).toBe('https://labflow.io/share/abc123');
    });

    it('buildEmailShareUrl: メール共有URLを生成（日本語）', () => {
      const url = buildEmailShareUrl('https://labflow.io/share/abc', 'テストプロジェクト', 'ja');
      
      expect(url).toContain('mailto:?');
      expect(url).toContain('subject=');
      expect(url).toContain('body=');
      expect(url).toContain(encodeURIComponent('[LabFlow]'));
    });

    it('buildEmailShareUrl: メール共有URLを生成（英語）', () => {
      const url = buildEmailShareUrl('https://labflow.io/share/abc', 'Test Project', 'en');
      
      expect(url).toContain('mailto:?');
      expect(url).toContain('Invitation');
    });
  });
});
