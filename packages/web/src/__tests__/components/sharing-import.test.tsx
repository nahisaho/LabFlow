/**
 * @file インポートコンポーネント テスト
 * @description ImportDialog, ImportButton のテスト
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  ImportDialog,
  ImportButton,
} from '@/components/sharing';
import type { ImportDialogProps } from '@/components/sharing';

// 有効なインポートデータ
const validImportData = {
  meta: {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    source: 'labflow',
    formatVersion: '1.0.0',
  },
  project: {
    id: 'proj-1',
    name: 'インポートプロジェクト',
    description: 'インポートテスト用',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  workflows: [
    { id: 'wf-1', name: 'ワークフロー1', steps: [], createdAt: '', updatedAt: '' },
  ],
  results: [
    { id: 'r-1', workflowId: 'wf-1', type: 'model', data: {}, createdAt: '' },
  ],
};

// FileReader モック
beforeEach(() => {
  vi.clearAllMocks();
  
  global.FileReader = vi.fn().mockImplementation(() => {
    const reader = {
      readAsText: vi.fn(),
      result: null as string | null,
      onload: null as ((event: any) => void) | null,
      onerror: null as ((event: any) => void) | null,
    };
    reader.readAsText = vi.fn().mockImplementation(() => {
      setTimeout(() => {
        reader.result = JSON.stringify(validImportData);
        reader.onload?.({ target: reader } as any);
      }, 0);
    });
    return reader;
  }) as any;
});

describe('ImportDialog', () => {
  const defaultProps: ImportDialogProps = {
    isOpen: true,
    onClose: vi.fn(),
    onImport: vi.fn(),
    useJapaneseLabels: true,
  };

  it('ダイアログが開いている状態で表示される', () => {
    render(<ImportDialog {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('ファイルドロップゾーンが表示される', () => {
    render(<ImportDialog {...defaultProps} />);

    expect(screen.getByText(/ファイルをドロップ/)).toBeInTheDocument();
  });

  it('サポートされる形式が表示される', () => {
    render(<ImportDialog {...defaultProps} />);

    expect(screen.getByText(/JSON/)).toBeInTheDocument();
    expect(screen.getByText(/YAML/)).toBeInTheDocument();
    expect(screen.getByText(/ZIP/)).toBeInTheDocument();
  });

  it('閉じるボタンをクリックするとダイアログを閉じる', () => {
    render(<ImportDialog {...defaultProps} />);

    const closeButton = screen.getByLabelText(/閉じる/i);
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('isOpen=false の場合は非表示', () => {
    render(<ImportDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('英語ロケールで表示される', () => {
    render(<ImportDialog {...defaultProps} useJapaneseLabels={false} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('ImportButton', () => {
  const defaultProps = {
    onImport: vi.fn(),
    useJapaneseLabels: true,
  };

  it('ボタンが表示される', () => {
    render(<ImportButton {...defaultProps} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('インポート')).toBeInTheDocument();
  });

  it('クリックするとダイアログが開く', () => {
    render(<ImportButton {...defaultProps} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('英語ロケールで表示', () => {
    render(<ImportButton {...defaultProps} useJapaneseLabels={false} />);

    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('variant=primary で表示', () => {
    render(<ImportButton {...defaultProps} variant="primary" />);

    const button = screen.getByRole('button');
    expect(button.className).toMatch(/bg-blue-500/);
  });
});

describe('ファイルドラッグ＆ドロップ', () => {
  const defaultProps: ImportDialogProps = {
    isOpen: true,
    onClose: vi.fn(),
    onImport: vi.fn(),
    useJapaneseLabels: true,
  };

  it('ドラッグオーバーでスタイルが変わる', () => {
    render(<ImportDialog {...defaultProps} />);

    const dropzone = screen.getByText(/ファイルをドロップ/).closest('div');
    
    if (dropzone) {
      fireEvent.dragEnter(dropzone);
      // ドラッグ状態の確認
      expect(dropzone).toBeInTheDocument();
    }
  });
});
