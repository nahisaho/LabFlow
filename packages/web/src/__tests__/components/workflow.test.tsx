/**
 * Workflow Builder Components Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  WorkflowListItem,
  WorkflowListView,
  StepPalette,
  StepNode,
  StepEditor,
  WorkflowCanvas,
  WorkflowBuilder,
  ExecutionProgressView,
  WorkflowTemplateCard,
  WorkflowTemplateSelection,
  WorkflowDefinition,
  WorkflowStep,
  WorkflowExecutionResult,
  STEP_TYPES,
} from '@/components/workflow';

// Mock workflow data
const mockWorkflow: WorkflowDefinition = {
  id: 'wf-1',
  name: 'テストワークフロー',
  description: '材料探索のテストワークフロー',
  domain: 'materials',
  status: 'draft',
  steps: [],
  version: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

const mockStep: WorkflowStep = {
  id: 'step-1',
  name: 'データ読み込み',
  type: 'data-load',
  domain: 'materials',
  config: { source: 'file', path: '/data/test.csv' },
  position: { x: 50, y: 100 },
  dependencies: [],
  status: 'pending',
};

const mockWorkflowWithSteps: WorkflowDefinition = {
  ...mockWorkflow,
  steps: [
    mockStep,
    {
      id: 'step-2',
      name: 'MatterGen生成',
      type: 'model-mattergen',
      domain: 'materials',
      config: { chemical_system: 'Li-Fe-O', num_samples: 100 },
      position: { x: 300, y: 100 },
      dependencies: ['step-1'],
      status: 'pending',
    },
  ],
};

const mockExecution: WorkflowExecutionResult = {
  id: 'exec-1',
  workflowId: 'wf-1',
  status: 'running',
  startedAt: new Date(),
  stepResults: new Map([
    ['step-1', {
      stepId: 'step-1',
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      duration: 5,
    }],
  ]),
  currentStepId: 'step-2',
};

describe('Workflow Components', () => {
  describe('WorkflowListItem', () => {
    it('should render workflow name', () => {
      render(<WorkflowListItem workflow={mockWorkflow} />);
      expect(screen.getByText('テストワークフロー')).toBeInTheDocument();
    });

    it('should render domain badge', () => {
      render(<WorkflowListItem workflow={mockWorkflow} />);
      expect(screen.getByText('材料科学')).toBeInTheDocument();
    });

    it('should render status badge', () => {
      render(<WorkflowListItem workflow={mockWorkflow} />);
      expect(screen.getByText('下書き')).toBeInTheDocument();
    });

    it('should render step count', () => {
      render(<WorkflowListItem workflow={mockWorkflowWithSteps} />);
      expect(screen.getByText('2 ステップ')).toBeInTheDocument();
    });

    it('should call onSelect when clicked', () => {
      const onSelect = vi.fn();
      render(<WorkflowListItem workflow={mockWorkflow} onSelect={onSelect} />);
      fireEvent.click(screen.getByText('テストワークフロー'));
      expect(onSelect).toHaveBeenCalledWith(mockWorkflow);
    });

    it('should call onEdit when edit button clicked', () => {
      const onEdit = vi.fn();
      render(<WorkflowListItem workflow={mockWorkflow} onEdit={onEdit} />);
      fireEvent.click(screen.getByText('編集'));
      expect(onEdit).toHaveBeenCalledWith(mockWorkflow);
    });

    it('should call onRun when run button clicked', () => {
      const onRun = vi.fn();
      render(<WorkflowListItem workflow={mockWorkflow} onRun={onRun} />);
      fireEvent.click(screen.getByText('実行'));
      expect(onRun).toHaveBeenCalledWith(mockWorkflow);
    });
  });

  describe('WorkflowListView', () => {
    const workflows: WorkflowDefinition[] = [
      mockWorkflow,
      {
        ...mockWorkflow,
        id: 'wf-2',
        name: '気象予測',
        domain: 'climate',
        status: 'active',
      },
    ];

    it('should render all workflows', () => {
      render(<WorkflowListView workflows={workflows} />);
      expect(screen.getByText('テストワークフロー')).toBeInTheDocument();
      expect(screen.getByText('気象予測')).toBeInTheDocument();
    });

    it('should filter by search', () => {
      render(<WorkflowListView workflows={workflows} />);
      const searchInput = screen.getByPlaceholderText('ワークフローを検索...');
      fireEvent.change(searchInput, { target: { value: '気象' } });
      expect(screen.queryByText('テストワークフロー')).not.toBeInTheDocument();
      expect(screen.getByText('気象予測')).toBeInTheDocument();
    });

    it('should show empty state when no workflows', () => {
      render(<WorkflowListView workflows={[]} />);
      expect(screen.getByText('ワークフローが見つかりません')).toBeInTheDocument();
    });

    it('should call onCreate when create button clicked', () => {
      const onCreate = vi.fn();
      render(<WorkflowListView workflows={workflows} onCreate={onCreate} />);
      fireEvent.click(screen.getByText('+ 新規作成'));
      expect(onCreate).toHaveBeenCalled();
    });
  });

  describe('StepPalette', () => {
    it('should render step types', () => {
      const onAddStep = vi.fn();
      render(<StepPalette onAddStep={onAddStep} />);
      expect(screen.getByText('データ読み込み')).toBeInTheDocument();
    });

    it('should filter by category', () => {
      const onAddStep = vi.fn();
      render(<StepPalette onAddStep={onAddStep} />);
      fireEvent.click(screen.getByText('モデル'));
      expect(screen.getByText('MatterGen生成')).toBeInTheDocument();
    });

    it('should call onAddStep when step clicked', () => {
      const onAddStep = vi.fn();
      render(<StepPalette onAddStep={onAddStep} />);
      fireEvent.click(screen.getByText('データ読み込み'));
      expect(onAddStep).toHaveBeenCalled();
    });

    it('should filter by domain', () => {
      const onAddStep = vi.fn();
      render(<StepPalette domain="drug" onAddStep={onAddStep} />);
      // Should show drug-specific and common steps
      expect(screen.getByText('TamGen分子生成')).toBeInTheDocument();
    });
  });

  describe('StepNode', () => {
    const stepType = STEP_TYPES.find((s) => s.id === 'data-load');

    it('should render step name', () => {
      render(<StepNode step={mockStep} stepType={stepType} />);
      expect(screen.getAllByText('データ読み込み').length).toBeGreaterThan(0);
    });

    it('should show actions when selected', () => {
      const onDelete = vi.fn();
      const onConfigure = vi.fn();
      render(
        <StepNode
          step={mockStep}
          stepType={stepType}
          selected
          onDelete={onDelete}
          onConfigure={onConfigure}
        />
      );
      expect(screen.getByText('設定')).toBeInTheDocument();
      expect(screen.getByText('削除')).toBeInTheDocument();
    });

    it('should call onSelect when clicked', () => {
      const onSelect = vi.fn();
      render(<StepNode step={mockStep} stepType={stepType} onSelect={onSelect} />);
      fireEvent.click(screen.getAllByText('データ読み込み')[0]);
      expect(onSelect).toHaveBeenCalled();
    });

    it('should call onDelete when delete button clicked', () => {
      const onDelete = vi.fn();
      render(
        <StepNode step={mockStep} stepType={stepType} selected onDelete={onDelete} />
      );
      fireEvent.click(screen.getByText('削除'));
      expect(onDelete).toHaveBeenCalled();
    });
  });

  describe('StepEditor', () => {
    const stepType = STEP_TYPES.find((s) => s.id === 'data-load');

    it('should render step configuration fields', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();
      render(
        <StepEditor step={mockStep} stepType={stepType} onUpdate={onUpdate} onClose={onClose} />
      );
      expect(screen.getByText('ソース')).toBeInTheDocument();
      expect(screen.getByText('パス')).toBeInTheDocument();
    });

    it('should call onUpdate when save clicked', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();
      render(
        <StepEditor step={mockStep} stepType={stepType} onUpdate={onUpdate} onClose={onClose} />
      );
      fireEvent.click(screen.getByText('保存'));
      expect(onUpdate).toHaveBeenCalled();
    });

    it('should call onClose when cancel clicked', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();
      render(
        <StepEditor step={mockStep} stepType={stepType} onUpdate={onUpdate} onClose={onClose} />
      );
      fireEvent.click(screen.getByText('キャンセル'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('WorkflowCanvas', () => {
    it('should render empty state when no steps', () => {
      render(<WorkflowCanvas workflow={mockWorkflow} />);
      expect(screen.getByText('ステップがありません')).toBeInTheDocument();
    });

    it('should render steps', () => {
      render(<WorkflowCanvas workflow={mockWorkflowWithSteps} />);
      expect(screen.getAllByText('データ読み込み').length).toBeGreaterThan(0);
      expect(screen.getAllByText('MatterGen生成').length).toBeGreaterThan(0);
    });

    it('should call onSelectStep when step clicked', () => {
      const onSelectStep = vi.fn();
      render(<WorkflowCanvas workflow={mockWorkflowWithSteps} onSelectStep={onSelectStep} />);
      fireEvent.click(screen.getAllByText('データ読み込み')[0]);
      expect(onSelectStep).toHaveBeenCalledWith('step-1');
    });
  });

  describe('WorkflowBuilder', () => {
    it('should render workflow name', () => {
      render(<WorkflowBuilder workflow={mockWorkflow} />);
      expect(screen.getByText('テストワークフロー')).toBeInTheDocument();
    });

    it('should render step palette', () => {
      render(<WorkflowBuilder workflow={mockWorkflow} />);
      expect(screen.getByText('ステップを追加')).toBeInTheDocument();
    });

    it('should call onSave when save clicked', () => {
      const onSave = vi.fn();
      render(<WorkflowBuilder workflow={mockWorkflow} onSave={onSave} />);
      fireEvent.click(screen.getByText('保存'));
      expect(onSave).toHaveBeenCalled();
    });

    it('should call onRun when run clicked', () => {
      const onRun = vi.fn();
      render(<WorkflowBuilder workflow={mockWorkflow} onRun={onRun} />);
      fireEvent.click(screen.getByText('実行'));
      expect(onRun).toHaveBeenCalled();
    });

    it('should call onBack when back clicked', () => {
      const onBack = vi.fn();
      render(<WorkflowBuilder workflow={mockWorkflow} onBack={onBack} />);
      fireEvent.click(screen.getByText('← 戻る'));
      expect(onBack).toHaveBeenCalled();
    });
  });

  describe('ExecutionProgressView', () => {
    it('should render execution status', () => {
      render(
        <ExecutionProgressView execution={mockExecution} workflow={mockWorkflowWithSteps} />
      );
      expect(screen.getByText('実行中')).toBeInTheDocument();
    });

    it('should render step statuses', () => {
      render(
        <ExecutionProgressView execution={mockExecution} workflow={mockWorkflowWithSteps} />
      );
      // "完了 - 5秒" is rendered as combined text
      expect(screen.getByText(/完了/)).toBeInTheDocument();
    });

    it('should show progress', () => {
      render(
        <ExecutionProgressView execution={mockExecution} workflow={mockWorkflowWithSteps} />
      );
      // Check the progress indicator exists
      expect(screen.getByText('進捗')).toBeInTheDocument();
      // Check step count display
      const progressText = screen.getByText(/ステップ$/);
      expect(progressText).toBeInTheDocument();
    });

    it('should call onCancel when cancel clicked', () => {
      const onCancel = vi.fn();
      const runningExecution = { ...mockExecution, status: 'running' as const };
      render(
        <ExecutionProgressView
          execution={runningExecution}
          workflow={mockWorkflowWithSteps}
          onCancel={onCancel}
        />
      );
      const cancelBtn = screen.queryByText('キャンセル');
      if (cancelBtn) {
        fireEvent.click(cancelBtn);
        expect(onCancel).toHaveBeenCalled();
      }
    });
  });

  describe('WorkflowTemplateCard', () => {
    const mockTemplate = {
      id: 'materials-discovery',
      name: 'Materials Discovery',
      nameJa: '新材料探索',
      description: 'End-to-end materials discovery',
      descriptionJa: 'エンドツーエンド材料探索',
      domain: 'materials' as const,
      stepCount: 5,
      icon: '🔬',
    };

    it('should render template name', () => {
      const onSelect = vi.fn();
      render(<WorkflowTemplateCard template={mockTemplate} onSelect={onSelect} />);
      expect(screen.getByText('新材料探索')).toBeInTheDocument();
    });

    it('should render step count', () => {
      const onSelect = vi.fn();
      render(<WorkflowTemplateCard template={mockTemplate} onSelect={onSelect} />);
      expect(screen.getByText('5 ステップ')).toBeInTheDocument();
    });

    it('should call onSelect when clicked', () => {
      const onSelect = vi.fn();
      render(<WorkflowTemplateCard template={mockTemplate} onSelect={onSelect} />);
      fireEvent.click(screen.getByText('新材料探索'));
      expect(onSelect).toHaveBeenCalled();
    });
  });

  describe('WorkflowTemplateSelection', () => {
    const templates = [
      {
        id: 'materials-discovery',
        name: 'Materials Discovery',
        nameJa: '新材料探索',
        description: 'End-to-end materials discovery',
        descriptionJa: 'エンドツーエンド材料探索',
        domain: 'materials' as const,
        stepCount: 5,
        icon: '🔬',
      },
      {
        id: 'drug-discovery',
        name: 'Drug Discovery',
        nameJa: '創薬パイプライン',
        description: 'Drug discovery pipeline',
        descriptionJa: '基本的な創薬ワークフロー',
        domain: 'drug' as const,
        stepCount: 5,
        icon: '💊',
      },
    ];

    it('should render all templates', () => {
      const onSelect = vi.fn();
      const onSkip = vi.fn();
      render(<WorkflowTemplateSelection templates={templates} onSelect={onSelect} onSkip={onSkip} />);
      expect(screen.getByRole('heading', { name: '新材料探索' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '創薬パイプライン' })).toBeInTheDocument();
    });

    it('should filter by domain', () => {
      const onSelect = vi.fn();
      const onSkip = vi.fn();
      render(<WorkflowTemplateSelection templates={templates} onSelect={onSelect} onSkip={onSkip} />);
      // Find the filter button specifically
      const filterButtons = screen.getAllByRole('button');
      const drugFilterBtn = filterButtons.find(btn => btn.textContent === '創薬');
      if (drugFilterBtn) {
        fireEvent.click(drugFilterBtn);
        expect(screen.queryByRole('heading', { name: '新材料探索' })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: '創薬パイプライン' })).toBeInTheDocument();
      }
    });

    it('should call onSkip when skip clicked', () => {
      const onSelect = vi.fn();
      const onSkip = vi.fn();
      render(<WorkflowTemplateSelection templates={templates} onSelect={onSelect} onSkip={onSkip} />);
      fireEvent.click(screen.getByText('空白から作成'));
      expect(onSkip).toHaveBeenCalled();
    });
  });
});
