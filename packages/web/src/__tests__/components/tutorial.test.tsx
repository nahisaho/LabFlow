/**
 * Tutorial Components Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TutorialCard,
  TutorialList,
  TutorialHub,
  TutorialProvider,
  QuickStartWidget,
  AchievementBadge,
  Spotlight,
  useTutorial,
} from '@/components/tutorial';
import type { Tutorial, TutorialProgress } from '@/components/tutorial';

// Mock tutorial data
const mockTutorial: Tutorial = {
  id: 'test-tutorial',
  name: 'Test Tutorial',
  nameJa: 'テストチュートリアル',
  description: 'A test tutorial',
  descriptionJa: 'テスト用のチュートリアルです',
  category: 'quickstart',
  estimatedMinutes: 10,
  difficulty: 'beginner',
  icon: '📚',
  steps: [
    {
      id: 'step-1',
      title: 'ステップ1',
      content: '最初のステップです',
      position: 'center',
    },
    {
      id: 'step-2',
      title: 'ステップ2',
      content: '2番目のステップです',
      position: 'bottom',
    },
    {
      id: 'step-3',
      title: 'ステップ3',
      content: '最後のステップです',
      position: 'center',
    },
  ],
};

const mockMaterialsTutorial: Tutorial = {
  id: 'materials-test',
  name: 'Materials Test',
  nameJa: '材料科学テスト',
  description: 'Materials science tutorial',
  descriptionJa: '材料科学のチュートリアルです',
  category: 'workflow',
  domain: 'materials',
  estimatedMinutes: 20,
  difficulty: 'intermediate',
  icon: '🔬',
  steps: [
    {
      id: 'mat-1',
      title: '材料ステップ1',
      content: '材料科学の基礎',
      position: 'center',
    },
  ],
};

const mockProgress: TutorialProgress = {
  tutorialId: 'test-tutorial',
  currentStepIndex: 1,
  completedSteps: ['step-1'],
  startedAt: new Date(),
  status: 'in-progress',
};

describe('Tutorial Components', () => {
  describe('TutorialCard', () => {
    it('should render tutorial name', () => {
      const onStart = vi.fn();
      render(<TutorialCard tutorial={mockTutorial} onStart={onStart} />);
      expect(screen.getByText('テストチュートリアル')).toBeInTheDocument();
    });

    it('should render tutorial icon', () => {
      const onStart = vi.fn();
      render(<TutorialCard tutorial={mockTutorial} onStart={onStart} />);
      expect(screen.getByText('📚')).toBeInTheDocument();
    });

    it('should render difficulty badge', () => {
      const onStart = vi.fn();
      render(<TutorialCard tutorial={mockTutorial} onStart={onStart} />);
      expect(screen.getByText('初級')).toBeInTheDocument();
    });

    it('should render estimated time', () => {
      const onStart = vi.fn();
      render(<TutorialCard tutorial={mockTutorial} onStart={onStart} />);
      expect(screen.getByText('⏱ 10分')).toBeInTheDocument();
    });

    it('should render step count', () => {
      const onStart = vi.fn();
      render(<TutorialCard tutorial={mockTutorial} onStart={onStart} />);
      expect(screen.getByText('3ステップ')).toBeInTheDocument();
    });

    it('should call onStart when clicked', () => {
      const onStart = vi.fn();
      render(<TutorialCard tutorial={mockTutorial} onStart={onStart} />);
      fireEvent.click(screen.getByText('テストチュートリアル'));
      expect(onStart).toHaveBeenCalledWith(mockTutorial);
    });

    it('should show completed badge', () => {
      const onStart = vi.fn();
      const completedProgress: TutorialProgress = {
        ...mockProgress,
        status: 'completed',
        completedAt: new Date(),
      };
      render(
        <TutorialCard tutorial={mockTutorial} progress={completedProgress} onStart={onStart} />
      );
      expect(screen.getByText('✓ 完了')).toBeInTheDocument();
    });

    it('should show in-progress badge', () => {
      const onStart = vi.fn();
      render(
        <TutorialCard tutorial={mockTutorial} progress={mockProgress} onStart={onStart} />
      );
      expect(screen.getByText('進行中')).toBeInTheDocument();
    });
  });

  describe('TutorialList', () => {
    const tutorials = [mockTutorial, mockMaterialsTutorial];

    it('should render all tutorials', () => {
      const onStart = vi.fn();
      render(<TutorialList tutorials={tutorials} onStart={onStart} />);
      expect(screen.getByText('テストチュートリアル')).toBeInTheDocument();
      expect(screen.getByText('材料科学テスト')).toBeInTheDocument();
    });

    it('should filter by category', () => {
      const onStart = vi.fn();
      render(<TutorialList tutorials={tutorials} onStart={onStart} />);
      // カテゴリフィルターボタンをクリック（ボタン要素のみを対象）
      const categoryButtons = screen.getAllByRole('button');
      const quickstartButton = categoryButtons.find(btn => btn.textContent === 'クイックスタート');
      fireEvent.click(quickstartButton!);
      expect(screen.getByText('テストチュートリアル')).toBeInTheDocument();
      expect(screen.queryByText('材料科学テスト')).not.toBeInTheDocument();
    });

    it('should filter by domain', () => {
      const onStart = vi.fn();
      render(<TutorialList tutorials={tutorials} onStart={onStart} />);
      fireEvent.click(screen.getByText('材料科学'));
      expect(screen.queryByText('テストチュートリアル')).not.toBeInTheDocument();
      expect(screen.getByText('材料科学テスト')).toBeInTheDocument();
    });

    it('should show empty state when filtered', () => {
      const onStart = vi.fn();
      render(<TutorialList tutorials={[mockTutorial]} onStart={onStart} />);
      fireEvent.click(screen.getByText('創薬'));
      expect(screen.getByText('該当するチュートリアルがありません')).toBeInTheDocument();
    });
  });

  describe('TutorialHub', () => {
    const tutorials = [mockTutorial, mockMaterialsTutorial];

    it('should render welcome header', () => {
      const onStart = vi.fn();
      render(<TutorialHub tutorials={tutorials} onStart={onStart} />);
      expect(screen.getByText(/学習を始めましょう/)).toBeInTheDocument();
    });

    it('should render with user name', () => {
      const onStart = vi.fn();
      render(<TutorialHub tutorials={tutorials} onStart={onStart} userName="田中" />);
      expect(screen.getByText(/田中さん/)).toBeInTheDocument();
    });

    it('should show total tutorials count', () => {
      const onStart = vi.fn();
      render(<TutorialHub tutorials={tutorials} onStart={onStart} />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show in-progress tutorials', () => {
      const onStart = vi.fn();
      const progress = new Map([['test-tutorial', mockProgress]]);
      render(<TutorialHub tutorials={tutorials} progress={progress} onStart={onStart} />);
      expect(screen.getByText('📚 学習中')).toBeInTheDocument();
    });

    it('should show recommended tutorials', () => {
      const onStart = vi.fn();
      render(<TutorialHub tutorials={tutorials} onStart={onStart} />);
      expect(screen.getByText('✨ おすすめ')).toBeInTheDocument();
    });
  });

  describe('QuickStartWidget', () => {
    it('should render quickstart tutorials', () => {
      const onStart = vi.fn();
      render(<QuickStartWidget tutorials={[mockTutorial]} onStart={onStart} />);
      expect(screen.getByText('クイックスタート')).toBeInTheDocument();
      expect(screen.getByText('テストチュートリアル')).toBeInTheDocument();
    });

    it('should call onStart when tutorial clicked', () => {
      const onStart = vi.fn();
      render(<QuickStartWidget tutorials={[mockTutorial]} onStart={onStart} />);
      fireEvent.click(screen.getByText('テストチュートリアル'));
      expect(onStart).toHaveBeenCalledWith(mockTutorial);
    });

    it('should not render if no quickstart tutorials', () => {
      const onStart = vi.fn();
      const { container } = render(
        <QuickStartWidget tutorials={[mockMaterialsTutorial]} onStart={onStart} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('AchievementBadge', () => {
    it('should render unlocked badge', () => {
      render(
        <AchievementBadge
          title="初心者"
          description="最初のチュートリアルを完了"
          icon="🎉"
          unlocked={true}
          unlockedAt={new Date()}
        />
      );
      expect(screen.getByText('初心者')).toBeInTheDocument();
      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('should show unlock date', () => {
      const date = new Date('2024-01-15');
      render(
        <AchievementBadge
          title="初心者"
          description="最初のチュートリアルを完了"
          icon="🎉"
          unlocked={true}
          unlockedAt={date}
        />
      );
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });

    it('should render locked badge with reduced opacity', () => {
      const { container } = render(
        <AchievementBadge
          title="マスター"
          description="全てのチュートリアルを完了"
          icon="🏆"
          unlocked={false}
        />
      );
      expect(container.firstChild).toHaveClass('opacity-50');
    });
  });

  describe('TutorialProvider', () => {
    function TestComponent() {
      const { isActive, startTutorial, activeTutorial } = useTutorial();
      return (
        <div>
          <span data-testid="is-active">{isActive ? 'active' : 'inactive'}</span>
          <span data-testid="tutorial-name">{activeTutorial?.nameJa || 'none'}</span>
          <button onClick={() => startTutorial(mockTutorial)}>Start</button>
        </div>
      );
    }

    it('should provide tutorial context', () => {
      render(
        <TutorialProvider>
          <TestComponent />
        </TutorialProvider>
      );
      expect(screen.getByTestId('is-active')).toHaveTextContent('inactive');
    });

    it('should start tutorial', () => {
      render(
        <TutorialProvider>
          <TestComponent />
        </TutorialProvider>
      );
      fireEvent.click(screen.getByText('Start'));
      expect(screen.getByTestId('is-active')).toHaveTextContent('active');
      expect(screen.getByTestId('tutorial-name')).toHaveTextContent('テストチュートリアル');
    });

    it('should show overlay when tutorial active', () => {
      render(
        <TutorialProvider>
          <TestComponent />
        </TutorialProvider>
      );
      fireEvent.click(screen.getByText('Start'));
      expect(screen.getByText('ステップ1')).toBeInTheDocument();
    });

    it('should navigate to next step', () => {
      render(
        <TutorialProvider>
          <TestComponent />
        </TutorialProvider>
      );
      fireEvent.click(screen.getByText('Start'));
      expect(screen.getByText('ステップ1')).toBeInTheDocument();
      fireEvent.click(screen.getByText('次へ →'));
      expect(screen.getByText('ステップ2')).toBeInTheDocument();
    });

    it('should navigate to previous step', () => {
      render(
        <TutorialProvider>
          <TestComponent />
        </TutorialProvider>
      );
      fireEvent.click(screen.getByText('Start'));
      fireEvent.click(screen.getByText('次へ →'));
      expect(screen.getByText('ステップ2')).toBeInTheDocument();
      fireEvent.click(screen.getByText('← 前へ'));
      expect(screen.getByText('ステップ1')).toBeInTheDocument();
    });

    it('should skip tutorial', () => {
      render(
        <TutorialProvider>
          <TestComponent />
        </TutorialProvider>
      );
      fireEvent.click(screen.getByText('Start'));
      fireEvent.click(screen.getByText('スキップ'));
      expect(screen.getByTestId('is-active')).toHaveTextContent('inactive');
    });

    it('should call onComplete when finished', () => {
      const onComplete = vi.fn();
      render(
        <TutorialProvider onComplete={onComplete}>
          <TestComponent />
        </TutorialProvider>
      );
      fireEvent.click(screen.getByText('Start'));
      fireEvent.click(screen.getByText('次へ →'));
      fireEvent.click(screen.getByText('次へ →'));
      fireEvent.click(screen.getByText('完了'));
      expect(onComplete).toHaveBeenCalledWith('test-tutorial');
    });

    it('should show progress bar', () => {
      render(
        <TutorialProvider>
          <TestComponent />
        </TutorialProvider>
      );
      fireEvent.click(screen.getByText('Start'));
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });
  });

  describe('Spotlight', () => {
    it('should not render when show is false', () => {
      const { container } = render(
        <Spotlight
          targetSelector="#test"
          content={<div>Test content</div>}
          show={false}
          onDismiss={() => {}}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render dismiss button', () => {
      // Add target element
      const target = document.createElement('div');
      target.id = 'test-target';
      target.getBoundingClientRect = () => ({
        top: 100,
        left: 100,
        bottom: 150,
        right: 200,
        width: 100,
        height: 50,
        x: 100,
        y: 100,
        toJSON: () => {},
      });
      document.body.appendChild(target);

      render(
        <Spotlight
          targetSelector="#test-target"
          content={<div>Test content</div>}
          show={true}
          onDismiss={() => {}}
        />
      );

      expect(screen.getByText('わかりました')).toBeInTheDocument();

      document.body.removeChild(target);
    });
  });
});
