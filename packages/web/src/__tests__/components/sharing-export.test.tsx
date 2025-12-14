/**
 * @file エクスポートコンポーネント テスト
 * @description ExportDialog, ExportButton のテスト
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  ExportDialog,
  ExportButton,
} from '@/components/sharing';
import type { ExportDialogProps } from '@/components/sharing';

// URL.createObjectURL モック
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL, writable: true });
Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL, writable: true });

describe('ExportDialog', () => {
  const defaultProps: ExportDialogProps = {
    isOpen: true,
    onClose: vi.fn(),
    target: 'project',
    targetId: 'proj-1',
    targetName: 'テストプロジェクト',
    onExport: vi.fn(),
    useJapaneseLabels: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ダイアログが開いている状態で表示される', () => {
    render(<ExportDialog {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/テストプロジェクト/)).toBeInTheDocument();
  });

  it('エクスポート形式の選択肢が表示される', () => {
    render(<ExportDialog {...defaultProps} />);

    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('YAML')).toBeInTheDocument();
    expect(screen.getByText('ZIPアーカイブ')).toBeInTheDocument();
  });

  it('オプションチェックボックスが表示される', () => {
    render(<ExportDialog {...defaultProps} />);

    expect(screen.getByText('結果を含める')).toBeInTheDocument();
    expect(screen.getByText('履歴を含める')).toBeInTheDocument();
    expect(screen.getByText('設定を含める')).toBeInTheDocument();
  });

  it('形式を選択できる', () => {
    render(<ExportDialog {...defaultProps} />);

    const csvButton = screen.getByText('CSV');
    fireEvent.click(csvButton);

    // CSV形式が選択されていることを確認
    expect(csvButton).toBeInTheDocument();
  });

  it('オプションをトグルできる', () => {
    render(<ExportDialog {...defaultProps} />);

    const historyCheckbox = screen.getByLabelText('履歴を含める');
    expect(historyCheckbox).not.toBeChecked();

    fireEvent.click(historyCheckbox);
    expect(historyCheckbox).toBeChecked();
  });

  it('閉じるボタンをクリックするとダイアログを閉じる', () => {
    render(<ExportDialog {...defaultProps} />);

    const closeButton = screen.getByLabelText(/閉じる/i);
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('isOpen=false の場合は非表示', () => {
    render(<ExportDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('英語ロケールで表示される', () => {
    render(<ExportDialog {...defaultProps} useJapaneseLabels={false} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Include results')).toBeInTheDocument();
  });

  it('エクスポートボタンをクリックするとエクスポートを実行', async () => {
    render(<ExportDialog {...defaultProps} />);

    const exportButton = screen.getByRole('button', { name: /エクスポート$/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(defaultProps.onExport).toHaveBeenCalled();
    });
  });
});

describe('ExportButton', () => {
  const defaultProps = {
    target: 'project' as const,
    targetId: 'proj-1',
    targetName: 'テストプロジェクト',
    onExport: vi.fn(),
    useJapaneseLabels: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ボタンが表示される', () => {
    render(<ExportButton {...defaultProps} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('エクスポート')).toBeInTheDocument();
  });

  it('クリックするとダイアログが開く', () => {
    render(<ExportButton {...defaultProps} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('英語ロケールで表示', () => {
    render(<ExportButton {...defaultProps} useJapaneseLabels={false} />);

    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('variant=primary で表示', () => {
    render(<ExportButton {...defaultProps} variant="primary" />);

    const button = screen.getByRole('button');
    expect(button.className).toMatch(/bg-blue-500/);
  });
});
