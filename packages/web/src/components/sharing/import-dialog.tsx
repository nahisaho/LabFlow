/**
 * @file インポートダイアログコンポーネント
 * @description プロジェクト・ワークフローのインポート機能
 * @module @labflow/web/components/sharing/import-dialog
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import type {
  ImportOptions,
  ImportValidation,
  ImportResult,
  ImportDialogProps,
  ProjectExportData,
} from './types';
import {
  DEFAULT_IMPORT_OPTIONS,
  parseJSONFile,
  validateImportData,
  executeImport,
  formatFileSize,
} from './utils';

// =============================================================================
// ラベル定義
// =============================================================================

const LABELS = {
  en: {
    title: 'Import',
    dropzone: {
      title: 'Drop file here or click to select',
      subtitle: 'Supports JSON, YAML, ZIP formats',
      browsing: 'Browse files...',
    },
    validation: {
      title: 'File Validation',
      valid: 'File is valid',
      invalid: 'File has errors',
      warnings: 'Warnings',
      errors: 'Errors',
    },
    detected: {
      title: 'Detected Content',
      workflows: 'Workflows',
      results: 'Results',
      attachments: 'Attachments',
      version: 'Version',
      source: 'Source',
    },
    options: {
      title: 'Import Options',
      mode: 'Import Mode',
      modes: {
        create: 'Create new project',
        merge: 'Merge with existing project',
        replace: 'Replace existing project',
      },
      conflict: 'Conflict Resolution',
      conflicts: {
        keep: 'Keep existing',
        overwrite: 'Overwrite',
        rename: 'Rename',
        skip: 'Skip',
      },
      importAttachments: 'Import attachments',
      dryRun: 'Preview only (dry run)',
    },
    import: 'Import',
    cancel: 'Cancel',
    importing: 'Importing...',
    success: 'Import successful!',
    error: 'Import failed',
    close: 'Close',
    imported: 'Imported',
    skipped: 'Skipped',
    openProject: 'Open Project',
    removeFile: 'Remove',
  },
  ja: {
    title: 'インポート',
    dropzone: {
      title: 'ファイルをドロップまたはクリックして選択',
      subtitle: 'JSON、YAML、ZIP形式に対応',
      browsing: 'ファイルを選択...',
    },
    validation: {
      title: 'ファイル検証',
      valid: 'ファイルは有効です',
      invalid: 'ファイルにエラーがあります',
      warnings: '警告',
      errors: 'エラー',
    },
    detected: {
      title: '検出されたコンテンツ',
      workflows: 'ワークフロー',
      results: '結果',
      attachments: '添付ファイル',
      version: 'バージョン',
      source: '作成元',
    },
    options: {
      title: 'インポートオプション',
      mode: 'インポートモード',
      modes: {
        create: '新規プロジェクトとして作成',
        merge: '既存プロジェクトにマージ',
        replace: '既存プロジェクトを置換',
      },
      conflict: '競合時の処理',
      conflicts: {
        keep: '既存を保持',
        overwrite: '上書き',
        rename: '名前を変更',
        skip: 'スキップ',
      },
      importAttachments: '添付ファイルをインポート',
      dryRun: 'プレビューのみ（ドライラン）',
    },
    import: 'インポート',
    cancel: 'キャンセル',
    importing: 'インポート中...',
    success: 'インポート完了！',
    error: 'インポート失敗',
    close: '閉じる',
    imported: 'インポート済み',
    skipped: 'スキップ',
    openProject: 'プロジェクトを開く',
    removeFile: '削除',
  },
};

// =============================================================================
// サブコンポーネント
// =============================================================================

/** ファイルドロップゾーン */
interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  useJapaneseLabels?: boolean;
}

function FileDropzone({ onFileSelect, useJapaneseLabels = true }: FileDropzoneProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  return (
    <div
      className={`
        border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
        ${isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json,.yaml,.yml,.zip"
        onChange={handleInputChange}
        className="hidden"
      />
      <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <p className="text-gray-700 font-medium">{l.dropzone.title}</p>
      <p className="text-sm text-gray-500 mt-1">{l.dropzone.subtitle}</p>
    </div>
  );
}

/** 選択されたファイル表示 */
interface SelectedFileProps {
  file: File;
  validation: ImportValidation | null;
  onRemove: () => void;
  useJapaneseLabels?: boolean;
}

function SelectedFile({
  file,
  validation,
  onRemove,
  useJapaneseLabels = true,
}: SelectedFileProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;

  return (
    <div className="border rounded-lg p-4 space-y-4">
      {/* ファイル情報 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900 truncate max-w-[200px]" title={file.name}>
              {file.name}
            </p>
            <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
          title={l.removeFile}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* バリデーション結果 */}
      {validation && (
        <div className="space-y-3">
          {/* ステータス */}
          <div className={`flex items-center gap-2 ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
            {validation.isValid ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{l.validation.valid}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{l.validation.invalid}</span>
              </>
            )}
          </div>

          {/* 警告 */}
          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800 mb-1">{l.validation.warnings}</p>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validation.warnings.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* エラー */}
          {validation.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800 mb-1">{l.validation.errors}</p>
              <ul className="text-sm text-red-700 space-y-1">
                {validation.errors.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 検出されたコンテンツ */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">{l.detected.title}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{l.detected.workflows}:</span>
                <span className="font-medium">{validation.detected.workflows}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{l.detected.results}:</span>
                <span className="font-medium">{validation.detected.results}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{l.detected.attachments}:</span>
                <span className="font-medium">{validation.detected.attachments}</span>
              </div>
              {validation.detected.version && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{l.detected.version}:</span>
                  <span className="font-medium">{validation.detected.version}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** インポートオプション */
interface ImportOptionsFormProps {
  options: ImportOptions;
  onChange: (options: ImportOptions) => void;
  useJapaneseLabels?: boolean;
}

function ImportOptionsForm({
  options,
  onChange,
  useJapaneseLabels = true,
}: ImportOptionsFormProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;

  const updateOption = <K extends keyof ImportOptions>(key: K, value: ImportOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">{l.options.title}</h3>

      {/* モード選択 */}
      <div>
        <label className="block text-sm text-gray-600 mb-2">{l.options.mode}</label>
        <select
          value={options.mode}
          onChange={(e) => updateOption('mode', e.target.value as ImportOptions['mode'])}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="create">{l.options.modes.create}</option>
          <option value="merge">{l.options.modes.merge}</option>
          <option value="replace">{l.options.modes.replace}</option>
        </select>
      </div>

      {/* 競合解決 */}
      <div>
        <label className="block text-sm text-gray-600 mb-2">{l.options.conflict}</label>
        <select
          value={options.conflictResolution}
          onChange={(e) => updateOption('conflictResolution', e.target.value as ImportOptions['conflictResolution'])}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="keep">{l.options.conflicts.keep}</option>
          <option value="overwrite">{l.options.conflicts.overwrite}</option>
          <option value="rename">{l.options.conflicts.rename}</option>
          <option value="skip">{l.options.conflicts.skip}</option>
        </select>
      </div>

      {/* チェックボックスオプション */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.importAttachments ?? true}
            onChange={(e) => updateOption('importAttachments', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{l.options.importAttachments}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.dryRun ?? false}
            onChange={(e) => updateOption('dryRun', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{l.options.dryRun}</span>
        </label>
      </div>
    </div>
  );
}

/** インポート結果表示 */
interface ImportResultDisplayProps {
  result: ImportResult;
  useJapaneseLabels?: boolean;
}

function ImportResultDisplay({
  result,
  useJapaneseLabels = true,
}: ImportResultDisplayProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;

  if (!result.success) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center gap-2 text-red-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="font-medium">{l.error}</span>
        </div>
        {result.error && <p className="mt-2 text-sm text-red-600">{result.error}</p>}
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-4">
      <div className="flex items-center gap-2 text-green-700">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="font-medium">{l.success}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium text-gray-700 mb-2">{l.imported}</p>
          <ul className="space-y-1 text-gray-600">
            <li>• {LABELS[useJapaneseLabels ? 'ja' : 'en'].detected.workflows}: {result.imported.workflows}</li>
            <li>• {LABELS[useJapaneseLabels ? 'ja' : 'en'].detected.results}: {result.imported.results}</li>
            <li>• {LABELS[useJapaneseLabels ? 'ja' : 'en'].detected.attachments}: {result.imported.attachments}</li>
          </ul>
        </div>
        {(result.skipped.workflows > 0 || result.skipped.results > 0 || result.skipped.attachments > 0) && (
          <div>
            <p className="font-medium text-gray-700 mb-2">{l.skipped}</p>
            <ul className="space-y-1 text-gray-600">
              <li>• {LABELS[useJapaneseLabels ? 'ja' : 'en'].detected.workflows}: {result.skipped.workflows}</li>
              <li>• {LABELS[useJapaneseLabels ? 'ja' : 'en'].detected.results}: {result.skipped.results}</li>
              <li>• {LABELS[useJapaneseLabels ? 'ja' : 'en'].detected.attachments}: {result.skipped.attachments}</li>
            </ul>
          </div>
        )}
      </div>

      {result.projectId && (
        <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          {l.openProject}
        </button>
      )}
    </div>
  );
}

// =============================================================================
// メインコンポーネント
// =============================================================================

/**
 * インポートダイアログ
 */
export function ImportDialog({
  isOpen,
  onClose,
  targetProjectId,
  onImport,
  useJapaneseLabels = true,
}: ImportDialogProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ProjectExportData | null>(null);
  const [validation, setValidation] = useState<ImportValidation | null>(null);
  const [options, setOptions] = useState<ImportOptions>({
    ...DEFAULT_IMPORT_OPTIONS,
    targetProjectId,
    mode: targetProjectId ? 'merge' : 'create',
  });
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);

    try {
      const data = await parseJSONFile(selectedFile) as ProjectExportData;
      setParsedData(data);
      const validationResult = validateImportData(data);
      setValidation(validationResult);
    } catch (error) {
      setValidation({
        isValid: false,
        warnings: [],
        errors: [error instanceof Error ? error.message : 'ファイルの解析に失敗しました'],
        detected: { workflows: 0, results: 0, attachments: 0 },
      });
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setParsedData(null);
    setValidation(null);
    setResult(null);
  }, []);

  const handleImport = useCallback(async () => {
    if (!parsedData) return;

    setIsImporting(true);
    try {
      const importResult = await executeImport(parsedData, options);
      setResult(importResult);

      if (importResult.success && onImport) {
        onImport(importResult);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'インポートに失敗しました',
        imported: { workflows: 0, results: 0, attachments: 0, settings: 0 },
        skipped: { workflows: 0, results: 0, attachments: 0 },
        importedAt: new Date(),
      });
    } finally {
      setIsImporting(false);
    }
  }, [parsedData, options, onImport]);

  const handleClose = useCallback(() => {
    handleRemoveFile();
    onClose();
  }, [handleRemoveFile, onClose]);

  if (!isOpen) return null;

  const canImport = file && validation?.isValid && !result;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 id="import-dialog-title" className="text-lg font-semibold text-gray-900">
              {l.title}
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
            <ImportResultDisplay result={result} useJapaneseLabels={useJapaneseLabels} />
          ) : (
            <>
              {/* ファイル選択 */}
              {!file ? (
                <FileDropzone onFileSelect={handleFileSelect} useJapaneseLabels={useJapaneseLabels} />
              ) : (
                <SelectedFile
                  file={file}
                  validation={validation}
                  onRemove={handleRemoveFile}
                  useJapaneseLabels={useJapaneseLabels}
                />
              )}

              {/* オプション */}
              {validation?.isValid && (
                <ImportOptionsForm
                  options={options}
                  onChange={setOptions}
                  useJapaneseLabels={useJapaneseLabels}
                />
              )}
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
                disabled={isImporting}
              >
                {l.cancel}
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canImport || isImporting}
              >
                {isImporting && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {isImporting ? l.importing : l.import}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// インポートボタン（簡易版）
// =============================================================================

interface ImportButtonProps {
  targetProjectId?: string;
  useJapaneseLabels?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function ImportButton({
  targetProjectId,
  useJapaneseLabels = true,
  className = '',
  variant = 'secondary',
}: ImportButtonProps) {
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
        <span>{l.import}</span>
      </button>

      <ImportDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        targetProjectId={targetProjectId}
        useJapaneseLabels={useJapaneseLabels}
      />
    </>
  );
}
