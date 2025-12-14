/**
 * @file エクスポートダイアログコンポーネント
 * @description プロジェクト・ワークフローのエクスポート機能
 * @module @labflow/web/components/sharing/export-dialog
 */

'use client';

import React, { useState, useCallback } from 'react';
import type {
  ExportFormat,
  ExportOptions,
  ExportTarget,
  ExportDialogProps,
  ProjectExportData,
} from './types';
import {
  EXPORT_FORMAT_LABELS,
  DEFAULT_EXPORT_OPTIONS,
  createExportData,
  executeExport,
  downloadBlob,
  formatFileSize,
} from './utils';

// =============================================================================
// ラベル定義
// =============================================================================

const LABELS = {
  en: {
    title: 'Export',
    target: {
      project: 'Project',
      workflow: 'Workflow',
      results: 'Results',
      settings: 'Settings',
      selection: 'Selection',
    },
    format: 'Format',
    options: 'Options',
    includeResults: 'Include results',
    includeHistory: 'Include history',
    includeSettings: 'Include settings',
    includeAttachments: 'Include attachments',
    includeComments: 'Include comments',
    compress: 'Compress output',
    export: 'Export',
    cancel: 'Cancel',
    exporting: 'Exporting...',
    success: 'Export successful!',
    downloadReady: 'Download ready',
    download: 'Download',
    close: 'Close',
    error: 'Export failed',
    fileSize: 'File size',
    preview: 'Preview',
  },
  ja: {
    title: 'エクスポート',
    target: {
      project: 'プロジェクト',
      workflow: 'ワークフロー',
      results: '結果',
      settings: '設定',
      selection: '選択項目',
    },
    format: '形式',
    options: 'オプション',
    includeResults: '結果を含める',
    includeHistory: '履歴を含める',
    includeSettings: '設定を含める',
    includeAttachments: '添付ファイルを含める',
    includeComments: 'コメントを含める',
    compress: '圧縮する',
    export: 'エクスポート',
    cancel: 'キャンセル',
    exporting: 'エクスポート中...',
    success: 'エクスポート完了！',
    downloadReady: 'ダウンロード準備完了',
    download: 'ダウンロード',
    close: '閉じる',
    error: 'エクスポート失敗',
    fileSize: 'ファイルサイズ',
    preview: 'プレビュー',
  },
};

// =============================================================================
// サブコンポーネント
// =============================================================================

/** フォーマット選択 */
interface FormatSelectorProps {
  value: ExportFormat;
  onChange: (format: ExportFormat) => void;
  useJapaneseLabels?: boolean;
}

function FormatSelector({
  value,
  onChange,
  useJapaneseLabels = true,
}: FormatSelectorProps) {
  const formats: ExportFormat[] = ['json', 'csv', 'yaml', 'zip'];
  const locale = useJapaneseLabels ? 'ja' : 'en';

  return (
    <div className="flex gap-2 flex-wrap">
      {formats.map((format) => (
        <button
          key={format}
          type="button"
          onClick={() => onChange(format)}
          className={`
            px-4 py-2 rounded-lg border-2 transition-all
            ${value === format
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300'
            }
          `}
          aria-pressed={value === format}
        >
          {EXPORT_FORMAT_LABELS[format][locale]}
        </button>
      ))}
    </div>
  );
}

/** オプションチェックボックス */
interface OptionCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function OptionCheckbox({
  label,
  checked,
  onChange,
  disabled = false,
}: OptionCheckboxProps) {
  return (
    <label className={`flex items-center gap-2 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

/** エクスポート結果表示 */
interface ExportResultDisplayProps {
  success: boolean;
  filename?: string;
  size?: number;
  error?: string;
  onDownload: () => void;
  useJapaneseLabels?: boolean;
}

function ExportResultDisplay({
  success,
  filename,
  size,
  error,
  onDownload,
  useJapaneseLabels = true,
}: ExportResultDisplayProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;

  if (!success) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center gap-2 text-red-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="font-medium">{l.error}</span>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
      <div className="flex items-center gap-2 text-green-700">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="font-medium">{l.success}</span>
      </div>
      {filename && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-gray-600 truncate" title={filename}>
            {filename}
          </p>
          {size !== undefined && (
            <p className="text-xs text-gray-500">
              {l.fileSize}: {formatFileSize(size)}
            </p>
          )}
          <button
            onClick={onDownload}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {l.download}
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// メインコンポーネント
// =============================================================================

/**
 * エクスポートダイアログ
 */
export function ExportDialog({
  isOpen,
  onClose,
  target,
  targetId,
  targetName,
  onExport,
  useJapaneseLabels = true,
}: ExportDialogProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;

  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    filename?: string;
    size?: number;
    blob?: Blob;
    error?: string;
  } | null>(null);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setResult(null);

    try {
      // サンプルデータ作成（実際の実装ではAPIから取得）
      const sampleProject = {
        id: targetId,
        name: targetName ?? 'Untitled Project',
        description: 'Sample project for export',
        domain: 'drug-discovery',
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: options.includeSettings ? { theme: 'light' } : undefined,
      };

      const exportData = createExportData(sampleProject, options, {
        workflows: options.includeResults ? [
          {
            id: 'wf-1',
            name: 'Sample Workflow',
            steps: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'completed',
          },
        ] : undefined,
        results: options.includeResults ? [
          {
            id: 'res-1',
            workflowId: 'wf-1',
            type: 'prediction',
            data: { score: 0.85 },
            createdAt: new Date().toISOString(),
          },
        ] : undefined,
      });

      const exportResult = await executeExport(exportData, options);

      setResult({
        success: exportResult.success,
        filename: exportResult.filename,
        size: exportResult.size,
        blob: exportResult.blob,
        error: exportResult.error,
      });

      if (exportResult.success && onExport) {
        onExport(exportResult);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsExporting(false);
    }
  }, [targetId, targetName, options, onExport]);

  const handleDownload = useCallback(() => {
    if (result?.blob && result.filename) {
      downloadBlob(result.blob, result.filename);
    }
  }, [result]);

  const handleClose = useCallback(() => {
    setResult(null);
    onClose();
  }, [onClose]);

  const updateOption = useCallback(<K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K]
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 id="export-dialog-title" className="text-lg font-semibold text-gray-900">
              {l.title}: {targetName ?? l.target[target]}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              aria-label={l.close}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="px-6 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {result ? (
            <ExportResultDisplay
              success={result.success}
              filename={result.filename}
              size={result.size}
              error={result.error}
              onDownload={handleDownload}
              useJapaneseLabels={useJapaneseLabels}
            />
          ) : (
            <>
              {/* フォーマット選択 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{l.format}</h3>
                <FormatSelector
                  value={options.format}
                  onChange={(format) => updateOption('format', format)}
                  useJapaneseLabels={useJapaneseLabels}
                />
              </div>

              {/* オプション */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">{l.options}</h3>
                <div className="space-y-3">
                  <OptionCheckbox
                    label={l.includeResults}
                    checked={options.includeResults ?? true}
                    onChange={(v) => updateOption('includeResults', v)}
                  />
                  <OptionCheckbox
                    label={l.includeHistory}
                    checked={options.includeHistory ?? false}
                    onChange={(v) => updateOption('includeHistory', v)}
                  />
                  <OptionCheckbox
                    label={l.includeSettings}
                    checked={options.includeSettings ?? true}
                    onChange={(v) => updateOption('includeSettings', v)}
                  />
                  <OptionCheckbox
                    label={l.includeAttachments}
                    checked={options.includeAttachments ?? false}
                    onChange={(v) => updateOption('includeAttachments', v)}
                    disabled={options.format !== 'zip'}
                  />
                  <OptionCheckbox
                    label={l.includeComments}
                    checked={options.includeComments ?? true}
                    onChange={(v) => updateOption('includeComments', v)}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          {result ? (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {l.close}
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isExporting}
              >
                {l.cancel}
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                disabled={isExporting}
              >
                {isExporting && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {isExporting ? l.exporting : l.export}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// エクスポートボタン（簡易版）
// =============================================================================

interface ExportButtonProps {
  target: ExportTarget;
  targetId: string;
  targetName?: string;
  useJapaneseLabels?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function ExportButton({
  target,
  targetId,
  targetName,
  useJapaneseLabels = true,
  className = '',
  variant = 'secondary',
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;

  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${variantClasses[variant]} ${className}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span>{l.export}</span>
      </button>

      <ExportDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        target={target}
        targetId={targetId}
        targetName={targetName}
        useJapaneseLabels={useJapaneseLabels}
      />
    </>
  );
}
