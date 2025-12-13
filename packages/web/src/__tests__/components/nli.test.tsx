/**
 * NLI Components Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { 
  NLIInput, 
  IntentDisplay, 
  WorkflowSuggestions,
  DetectedIntent,
  WorkflowSuggestion 
} from '@/components/nli';

describe('NLI Components', () => {
  describe('NLIInput', () => {
    it('should render input placeholder in Japanese', () => {
      render(<NLIInput onSubmit={() => {}} />);
      expect(screen.getByPlaceholderText('何をしたいですか？例: 新しい薬を設計したい')).toBeInTheDocument();
    });

    it('should call onSubmit when form is submitted', () => {
      const onSubmit = vi.fn();
      render(<NLIInput onSubmit={onSubmit} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'タンパク質構造を予測したい' } });
      fireEvent.submit(input.closest('form')!);
      
      expect(onSubmit).toHaveBeenCalledWith('タンパク質構造を予測したい');
    });

    it('should not submit empty input', () => {
      const onSubmit = vi.fn();
      render(<NLIInput onSubmit={onSubmit} />);
      
      const form = screen.getByTestId('nli-input');
      fireEvent.submit(form);
      
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should show processing state', () => {
      render(<NLIInput onSubmit={() => {}} isProcessing={true} />);
      expect(screen.getByText('処理中...')).toBeInTheDocument();
    });

    it('should show language hint', () => {
      render(<NLIInput onSubmit={() => {}} />);
      expect(screen.getByText('日本語または英語で入力できます')).toBeInTheDocument();
    });
  });

  describe('IntentDisplay', () => {
    const mockIntent: DetectedIntent = {
      intent: 'Generate',
      domain: 'drug-discovery',
      confidence: 0.85,
      entities: { target: 'protein' },
      language: 'ja',
    };

    it('should render detected intent', () => {
      render(<IntentDisplay intent={mockIntent} />);
      expect(screen.getByText('検出された意図')).toBeInTheDocument();
      expect(screen.getByText('Generate')).toBeInTheDocument();
    });

    it('should render confidence badge', () => {
      render(<IntentDisplay intent={mockIntent} />);
      expect(screen.getByText('信頼度: 85%')).toBeInTheDocument();
    });

    it('should render domain in Japanese', () => {
      render(<IntentDisplay intent={mockIntent} />);
      expect(screen.getByText('創薬')).toBeInTheDocument();
    });

    it('should render language as Japanese', () => {
      render(<IntentDisplay intent={mockIntent} />);
      expect(screen.getByText('日本語')).toBeInTheDocument();
    });

    it('should render entities when showDetails is true', () => {
      render(<IntentDisplay intent={mockIntent} showDetails={true} />);
      expect(screen.getByText('抽出された情報:')).toBeInTheDocument();
    });
  });

  describe('WorkflowSuggestions', () => {
    const mockSuggestions: WorkflowSuggestion[] = [
      {
        id: 'wf-1',
        name: 'Drug Design',
        nameJa: '創薬設計',
        description: 'Drug design workflow',
        descriptionJa: '創薬設計ワークフロー',
        domain: 'drug-discovery',
        matchScore: 0.9,
      },
      {
        id: 'wf-2',
        name: 'Protein Analysis',
        nameJa: 'タンパク質解析',
        description: 'Protein analysis workflow',
        descriptionJa: 'タンパク質解析ワークフロー',
        domain: 'genomics',
        matchScore: 0.7,
      },
    ];

    it('should render workflow suggestions', () => {
      render(<WorkflowSuggestions suggestions={mockSuggestions} onSelect={() => {}} />);
      expect(screen.getByText('創薬設計')).toBeInTheDocument();
      expect(screen.getByText('タンパク質解析')).toBeInTheDocument();
    });

    it('should show suggestion count', () => {
      render(<WorkflowSuggestions suggestions={mockSuggestions} onSelect={() => {}} />);
      expect(screen.getByText('おすすめのワークフロー (2件)')).toBeInTheDocument();
    });

    it('should call onSelect when workflow is clicked', () => {
      const onSelect = vi.fn();
      render(<WorkflowSuggestions suggestions={mockSuggestions} onSelect={onSelect} />);
      
      fireEvent.click(screen.getByText('創薬設計'));
      expect(onSelect).toHaveBeenCalledWith(mockSuggestions[0]);
    });

    it('should show empty state when no suggestions', () => {
      render(<WorkflowSuggestions suggestions={[]} onSelect={() => {}} />);
      expect(screen.getByText('提案するワークフローがありません')).toBeInTheDocument();
    });

    it('should show match score', () => {
      render(<WorkflowSuggestions suggestions={mockSuggestions} onSelect={() => {}} />);
      expect(screen.getByText('一致度: 90%')).toBeInTheDocument();
    });
  });
});
