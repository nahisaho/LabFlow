/**
 * Model Catalog Components Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  ModelCard, 
  ModelCatalogView, 
  ModelExecutionForm,
  ModelDetailView,
  ExecutionResultView,
  ModelMetadata,
  ExtendedModelMetadata,
  ExecutionResult,
} from '@/components/model-catalog';

const mockModel: ModelMetadata = {
  id: 'mattergen',
  name: 'MatterGen',
  version: '1.0.0',
  domain: 'materials-science',
  description: 'Crystal structure generation',
  descriptionJa: '結晶構造生成モデル',
  tags: ['generation', 'crystal'],
  parameters: [
    {
      name: 'numSamples',
      type: 'number',
      required: true,
      description: 'Number of samples',
      descriptionJa: 'サンプル数',
      default: 10,
      min: 1,
      max: 100,
    },
    {
      name: 'format',
      type: 'select',
      required: true,
      description: 'Output format',
      descriptionJa: '出力形式',
      options: ['cif', 'xyz', 'json'],
      default: 'cif',
    },
  ],
};

describe('Model Catalog Components', () => {
  describe('ModelCard', () => {
    it('should render model name', () => {
      render(<ModelCard model={mockModel} />);
      expect(screen.getByText('MatterGen')).toBeInTheDocument();
    });

    it('should render model description in Japanese', () => {
      render(<ModelCard model={mockModel} />);
      expect(screen.getByText('結晶構造生成モデル')).toBeInTheDocument();
    });

    it('should render domain badge', () => {
      render(<ModelCard model={mockModel} />);
      expect(screen.getByText('材料科学')).toBeInTheDocument();
    });

    it('should render version', () => {
      render(<ModelCard model={mockModel} />);
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });

    it('should call onSelect when details button clicked', () => {
      const onSelect = vi.fn();
      render(<ModelCard model={mockModel} onSelect={onSelect} />);
      fireEvent.click(screen.getByText('詳細'));
      expect(onSelect).toHaveBeenCalledWith(mockModel);
    });

    it('should call onExecute when execute button clicked', () => {
      const onExecute = vi.fn();
      render(<ModelCard model={mockModel} onExecute={onExecute} />);
      fireEvent.click(screen.getByText('実行'));
      expect(onExecute).toHaveBeenCalledWith(mockModel);
    });
  });

  describe('ModelCatalogView', () => {
    const mockModels: ModelMetadata[] = [
      mockModel,
      {
        id: 'aurora',
        name: 'Aurora',
        version: '1.0.0',
        domain: 'climate',
        description: 'Weather prediction',
        descriptionJa: '気象予測モデル',
        tags: ['prediction', 'weather'],
        parameters: [],
      },
      {
        id: 'bioemu',
        name: 'BioEmu',
        version: '1.0.0',
        domain: 'genomics',
        description: 'Protein dynamics',
        descriptionJa: 'タンパク質ダイナミクス',
        tags: ['simulation', 'protein'],
        parameters: [],
      },
    ];

    it('should render all models', () => {
      render(<ModelCatalogView models={mockModels} />);
      expect(screen.getByText('MatterGen')).toBeInTheDocument();
      expect(screen.getByText('Aurora')).toBeInTheDocument();
      expect(screen.getByText('BioEmu')).toBeInTheDocument();
    });

    it('should filter models by search', () => {
      render(<ModelCatalogView models={mockModels} />);
      const searchInput = screen.getByPlaceholderText('モデルを検索...');
      fireEvent.change(searchInput, { target: { value: 'Aurora' } });
      expect(screen.getByText('Aurora')).toBeInTheDocument();
      expect(screen.queryByText('MatterGen')).not.toBeInTheDocument();
    });

    it('should show empty state when no models match', () => {
      render(<ModelCatalogView models={mockModels} />);
      const searchInput = screen.getByPlaceholderText('モデルを検索...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      expect(screen.getByText('モデルが見つかりません')).toBeInTheDocument();
    });
  });

  describe('ModelExecutionForm', () => {
    it('should render form with parameters', () => {
      render(<ModelExecutionForm model={mockModel} onSubmit={vi.fn()} />);
      expect(screen.getByText('サンプル数 *')).toBeInTheDocument();
      expect(screen.getByText('出力形式')).toBeInTheDocument();
    });

    it('should call onSubmit with params when form is submitted', async () => {
      const onSubmit = vi.fn();
      render(<ModelExecutionForm model={mockModel} onSubmit={onSubmit} />);
      
      // Set number input
      const numberInput = screen.getByRole('spinbutton');
      fireEvent.change(numberInput, { target: { value: '20' } });
      
      // Submit form
      fireEvent.click(screen.getByText('実行'));
      
      expect(onSubmit).toHaveBeenCalled();
    });

    it('should show validation error for required fields', () => {
      const modelWithRequired: ModelMetadata = {
        ...mockModel,
        parameters: [
          {
            name: 'required',
            type: 'string',
            required: true,
            description: 'Required field',
            descriptionJa: '必須フィールド',
          },
        ],
      };
      render(<ModelExecutionForm model={modelWithRequired} onSubmit={vi.fn()} />);
      fireEvent.click(screen.getByText('実行'));
      expect(screen.getByText('必須項目です')).toBeInTheDocument();
    });

    it('should call onCancel when cancel button clicked', () => {
      const onCancel = vi.fn();
      render(<ModelExecutionForm model={mockModel} onSubmit={vi.fn()} onCancel={onCancel} />);
      fireEvent.click(screen.getByText('キャンセル'));
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('ModelDetailView', () => {
    const mockExtendedModel: ExtendedModelMetadata = {
      ...mockModel,
      taskTypes: ['generation'],
      estimatedTime: '5-10分',
      inputFormats: ['JSON'],
      outputFormats: ['CIF'],
      exampleCode: `import mattergen
model = mattergen.load()
result = model.generate()`,
    };

    it('should render model name and domain', () => {
      render(<ModelDetailView model={mockExtendedModel} />);
      expect(screen.getByText('MatterGen')).toBeInTheDocument();
    });

    it('should render estimated time', () => {
      render(<ModelDetailView model={mockExtendedModel} />);
      expect(screen.getByText('5-10分')).toBeInTheDocument();
    });

    it('should render code example in code tab', () => {
      render(<ModelDetailView model={mockExtendedModel} />);
      const codeTab = screen.getByText('コード例');
      fireEvent.click(codeTab);
      expect(screen.getByText(/import mattergen/)).toBeInTheDocument();
    });

    it('should render model details in specs tab', () => {
      render(<ModelDetailView model={mockExtendedModel} />);
      const specsTab = screen.getByText('仕様');
      fireEvent.click(specsTab);
      // Specs tab shows model ID, version, domain, etc.
      expect(screen.getByText('mattergen')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });

    it('should call onExecute when execute button clicked', () => {
      const onExecute = vi.fn();
      render(<ModelDetailView model={mockExtendedModel} onExecute={onExecute} />);
      fireEvent.click(screen.getByText('モデルを実行'));
      expect(onExecute).toHaveBeenCalledWith(mockExtendedModel);
    });

    it('should call onBack when back button clicked', () => {
      const onBack = vi.fn();
      render(<ModelDetailView model={mockExtendedModel} onBack={onBack} />);
      fireEvent.click(screen.getByText('← カタログに戻る'));
      expect(onBack).toHaveBeenCalled();
    });
  });

  describe('ExecutionResultView', () => {
    const mockRunningResult = {
      id: 'exec-123',
      modelId: 'mattergen',
      status: 'running' as const,
      startedAt: new Date(),
      params: { numSamples: 10 },
    };

    const mockCompletedResult = {
      id: 'exec-456',
      modelId: 'mattergen',
      status: 'completed' as const,
      startedAt: new Date(Date.now() - 60000),
      completedAt: new Date(),
      params: { numSamples: 10 },
      outputs: {
        type: 'structures',
        data: [{ id: 1, formula: 'SiO2' }],
      },
    };

    const mockFailedResult = {
      id: 'exec-789',
      modelId: 'mattergen',
      status: 'failed' as const,
      startedAt: new Date(),
      params: { numSamples: 10 },
      error: 'Out of memory',
    };

    it('should render running status', () => {
      render(<ExecutionResultView result={mockRunningResult} />);
      expect(screen.getByText('実行中')).toBeInTheDocument();
    });

    it('should render completed status with output', () => {
      render(<ExecutionResultView result={mockCompletedResult} />);
      expect(screen.getByText('完了')).toBeInTheDocument();
    });

    it('should render failed status with error', () => {
      render(<ExecutionResultView result={mockFailedResult} />);
      expect(screen.getByText('失敗')).toBeInTheDocument();
      expect(screen.getByText('Out of memory')).toBeInTheDocument();
    });

    it('should call onRetry when retry button clicked', () => {
      const onRetry = vi.fn();
      render(<ExecutionResultView result={mockFailedResult} onRetry={onRetry} />);
      fireEvent.click(screen.getByText('再実行'));
      expect(onRetry).toHaveBeenCalled();
    });

    it('should call onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<ExecutionResultView result={mockCompletedResult} onClose={onClose} />);
      fireEvent.click(screen.getByText('閉じる'));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
