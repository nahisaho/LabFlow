'use client';

/**
 * Tutorial Components
 *
 * Interactive tutorial system for AI for Science beginners
 * Features: Step-by-step guides, tooltips, progress tracking
 */

import React, { useState, useCallback, useEffect, createContext, useContext } from 'react';
import type { ResearchDomain } from '../workflow';

// ============================================================================
// Types
// ============================================================================

export type TutorialCategory = 'quickstart' | 'workflow' | 'model' | 'analysis' | 'advanced';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  targetElement?: string; // CSS selector for highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'input' | 'select' | 'none';
  actionTarget?: string;
  validation?: () => boolean;
  nextOnAction?: boolean;
}

export interface Tutorial {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  descriptionJa: string;
  category: TutorialCategory;
  domain?: ResearchDomain;
  estimatedMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: string;
  steps: TutorialStep[];
  prerequisites?: string[];
}

export interface TutorialProgress {
  tutorialId: string;
  currentStepIndex: number;
  completedSteps: string[];
  startedAt: Date;
  completedAt?: Date;
  status: 'not-started' | 'in-progress' | 'completed';
}

// ============================================================================
// Tutorial Context
// ============================================================================

interface TutorialContextValue {
  activeTutorial: Tutorial | null;
  currentStep: TutorialStep | null;
  currentStepIndex: number;
  progress: Map<string, TutorialProgress>;
  startTutorial: (tutorial: Tutorial) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  isActive: boolean;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
}

// ============================================================================
// Tutorial Provider
// ============================================================================

interface TutorialProviderProps {
  children: React.ReactNode;
  onComplete?: (tutorialId: string) => void;
}

export function TutorialProvider({ children, onComplete }: TutorialProviderProps) {
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState<Map<string, TutorialProgress>>(new Map());

  const currentStep = activeTutorial?.steps[currentStepIndex] ?? null;

  const startTutorial = useCallback((tutorial: Tutorial) => {
    setActiveTutorial(tutorial);
    setCurrentStepIndex(0);

    const existingProgress = progress.get(tutorial.id);
    if (existingProgress && existingProgress.status === 'in-progress') {
      setCurrentStepIndex(existingProgress.currentStepIndex);
    } else {
      setProgress((prev) => {
        const newProgress = new Map(prev);
        newProgress.set(tutorial.id, {
          tutorialId: tutorial.id,
          currentStepIndex: 0,
          completedSteps: [],
          startedAt: new Date(),
          status: 'in-progress',
        });
        return newProgress;
      });
    }
  }, [progress]);

  const nextStep = useCallback(() => {
    if (!activeTutorial) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= activeTutorial.steps.length) {
      completeTutorial();
      return;
    }

    setCurrentStepIndex(nextIndex);
    setProgress((prev) => {
      const newProgress = new Map(prev);
      const current = newProgress.get(activeTutorial.id);
      if (current) {
        newProgress.set(activeTutorial.id, {
          ...current,
          currentStepIndex: nextIndex,
          completedSteps: [...current.completedSteps, activeTutorial.steps[currentStepIndex].id],
        });
      }
      return newProgress;
    });
  }, [activeTutorial, currentStepIndex]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  const skipTutorial = useCallback(() => {
    setActiveTutorial(null);
    setCurrentStepIndex(0);
  }, []);

  const completeTutorial = useCallback(() => {
    if (!activeTutorial) return;

    setProgress((prev) => {
      const newProgress = new Map(prev);
      const current = newProgress.get(activeTutorial.id);
      if (current) {
        newProgress.set(activeTutorial.id, {
          ...current,
          completedAt: new Date(),
          status: 'completed',
          completedSteps: activeTutorial.steps.map((s) => s.id),
        });
      }
      return newProgress;
    });

    onComplete?.(activeTutorial.id);
    setActiveTutorial(null);
    setCurrentStepIndex(0);
  }, [activeTutorial, onComplete]);

  return (
    <TutorialContext.Provider
      value={{
        activeTutorial,
        currentStep,
        currentStepIndex,
        progress,
        startTutorial,
        nextStep,
        prevStep,
        skipTutorial,
        completeTutorial,
        isActive: activeTutorial !== null,
      }}
    >
      {children}
      {activeTutorial && currentStep && (
        <TutorialOverlay
          tutorial={activeTutorial}
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={activeTutorial.steps.length}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTutorial}
        />
      )}
    </TutorialContext.Provider>
  );
}

// ============================================================================
// Tutorial Overlay
// ============================================================================

interface TutorialOverlayProps {
  tutorial: Tutorial;
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

function TutorialOverlay({
  tutorial,
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: TutorialOverlayProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (step.targetElement) {
      const element = document.querySelector(step.targetElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
    }
  }, [step.targetElement]);

  const getTooltipPosition = () => {
    if (!targetRect || step.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 400;
    const tooltipHeight = 200;

    switch (step.position) {
      case 'top':
        return {
          top: `${targetRect.top - tooltipHeight - padding}px`,
          left: `${targetRect.left + targetRect.width / 2 - tooltipWidth / 2}px`,
        };
      case 'bottom':
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2 - tooltipWidth / 2}px`,
        };
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${targetRect.left - tooltipWidth - padding}px`,
        };
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${targetRect.right + padding}px`,
        };
      default:
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left}px`,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with cutout */}
      <div className="absolute inset-0 bg-black/50" onClick={onSkip} />

      {/* Highlight box */}
      {targetRect && (
        <div
          className="absolute border-2 border-blue-500 rounded-lg pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute bg-white rounded-xl shadow-2xl p-6 max-w-md z-10"
        style={getTooltipPosition()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{tutorial.icon}</span>
            <span className="font-semibold text-gray-900">{tutorial.nameJa}</span>
          </div>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">
            {stepIndex + 1} / {totalSteps}
          </span>
        </div>

        {/* Step content */}
        <div className="mb-6">
          <h3 className="font-bold text-lg text-gray-900 mb-2">{step.title}</h3>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{step.content}</p>
        </div>

        {/* Action hint */}
        {step.action && step.action !== 'none' && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4 flex items-center gap-2">
            <span className="text-blue-500">💡</span>
            <span className="text-sm text-blue-700">
              {step.action === 'click' && 'ハイライトされた要素をクリックしてください'}
              {step.action === 'input' && '入力欄に入力してください'}
              {step.action === 'select' && '選択肢を選んでください'}
            </span>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={stepIndex === 0}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← 前へ
          </button>
          <div className="flex gap-2">
            <button
              onClick={onSkip}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              スキップ
            </button>
            <button
              onClick={onNext}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {stepIndex === totalSteps - 1 ? '完了' : '次へ →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Tutorial Card
// ============================================================================

interface TutorialCardProps {
  tutorial: Tutorial;
  progress?: TutorialProgress;
  onStart: (tutorial: Tutorial) => void;
}

export function TutorialCard({ tutorial, progress, onStart }: TutorialCardProps) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  const difficultyLabels = {
    beginner: '初級',
    intermediate: '中級',
    advanced: '上級',
  };

  const statusBadge = () => {
    if (!progress) return null;
    switch (progress.status) {
      case 'completed':
        return (
          <span className="absolute top-3 right-3 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            ✓ 完了
          </span>
        );
      case 'in-progress':
        return (
          <span className="absolute top-3 right-3 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            進行中
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="relative rounded-xl border border-gray-200 bg-white p-5 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onStart(tutorial)}
    >
      {statusBadge()}

      <div className="flex items-start gap-4">
        <span className="text-4xl">{tutorial.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 mb-1">{tutorial.nameJa}</h3>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{tutorial.descriptionJa}</p>

          <div className="flex items-center gap-3 text-xs">
            <span className={`px-2 py-0.5 rounded-full ${difficultyColors[tutorial.difficulty]}`}>
              {difficultyLabels[tutorial.difficulty]}
            </span>
            <span className="text-gray-400">⏱ {tutorial.estimatedMinutes}分</span>
            <span className="text-gray-400">{tutorial.steps.length}ステップ</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {progress && progress.status === 'in-progress' && (
        <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500"
            style={{
              width: `${(progress.completedSteps.length / tutorial.steps.length) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Tutorial List
// ============================================================================

interface TutorialListProps {
  tutorials: Tutorial[];
  progress?: Map<string, TutorialProgress>;
  onStart: (tutorial: Tutorial) => void;
  filter?: {
    category?: TutorialCategory;
    domain?: ResearchDomain;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  };
}

export function TutorialList({ tutorials, progress, onStart, filter }: TutorialListProps) {
  const [selectedCategory, setSelectedCategory] = useState<TutorialCategory | 'all'>('all');
  const [selectedDomain, setSelectedDomain] = useState<ResearchDomain | 'all'>('all');

  const categories: { id: TutorialCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'すべて' },
    { id: 'quickstart', label: 'クイックスタート' },
    { id: 'workflow', label: 'ワークフロー' },
    { id: 'model', label: 'モデル活用' },
    { id: 'analysis', label: '分析手法' },
    { id: 'advanced', label: '応用編' },
  ];

  const domains: { id: ResearchDomain | 'all'; label: string }[] = [
    { id: 'all', label: 'すべて' },
    { id: 'materials', label: '材料科学' },
    { id: 'drug', label: '創薬' },
    { id: 'climate', label: '気候科学' },
    { id: 'genomics', label: 'ゲノミクス' },
  ];

  const filteredTutorials = tutorials.filter((t) => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (selectedDomain !== 'all' && t.domain !== selectedDomain) return false;
    if (filter?.category && t.category !== filter.category) return false;
    if (filter?.domain && t.domain !== filter.domain) return false;
    if (filter?.difficulty && t.difficulty !== filter.difficulty) return false;
    return true;
  });

  // Group by category
  const groupedTutorials = filteredTutorials.reduce(
    (acc, tutorial) => {
      if (!acc[tutorial.category]) {
        acc[tutorial.category] = [];
      }
      acc[tutorial.category].push(tutorial);
      return acc;
    },
    {} as Record<TutorialCategory, Tutorial[]>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {domains.map((dom) => (
            <button
              key={dom.id}
              onClick={() => setSelectedDomain(dom.id)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                selectedDomain === dom.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {dom.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tutorial grid */}
      {filteredTutorials.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          該当するチュートリアルがありません
        </div>
      ) : selectedCategory === 'all' ? (
        // Grouped view
        Object.entries(groupedTutorials).map(([category, categoryTutorials]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              {categories.find((c) => c.id === category)?.label}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryTutorials.map((tutorial) => (
                <TutorialCard
                  key={tutorial.id}
                  tutorial={tutorial}
                  progress={progress?.get(tutorial.id)}
                  onStart={onStart}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        // Flat view
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTutorials.map((tutorial) => (
            <TutorialCard
              key={tutorial.id}
              tutorial={tutorial}
              progress={progress?.get(tutorial.id)}
              onStart={onStart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Tutorial Hub (Main Page)
// ============================================================================

interface TutorialHubProps {
  tutorials: Tutorial[];
  progress?: Map<string, TutorialProgress>;
  onStart: (tutorial: Tutorial) => void;
  userName?: string;
}

export function TutorialHub({ tutorials, progress, onStart, userName }: TutorialHubProps) {
  const completedCount = progress
    ? Array.from(progress.values()).filter((p) => p.status === 'completed').length
    : 0;

  const inProgressTutorials = tutorials.filter(
    (t) => progress?.get(t.id)?.status === 'in-progress'
  );

  const recommendedTutorials = tutorials
    .filter((t) => !progress?.get(t.id) || progress.get(t.id)?.status === 'not-started')
    .filter((t) => t.difficulty === 'beginner')
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          {userName ? `${userName}さん、` : ''}学習を始めましょう！
        </h1>
        <p className="text-blue-100 mb-4">
          AI for Scienceの基礎から応用まで、ステップバイステップで学べます
        </p>
        <div className="flex items-center gap-6">
          <div>
            <div className="text-3xl font-bold">{completedCount}</div>
            <div className="text-sm text-blue-200">完了済み</div>
          </div>
          <div className="w-px h-12 bg-blue-400" />
          <div>
            <div className="text-3xl font-bold">{tutorials.length}</div>
            <div className="text-sm text-blue-200">総チュートリアル</div>
          </div>
          <div className="w-px h-12 bg-blue-400" />
          <div>
            <div className="text-3xl font-bold">
              {Math.round((completedCount / tutorials.length) * 100)}%
            </div>
            <div className="text-sm text-blue-200">進捗率</div>
          </div>
        </div>
      </div>

      {/* In progress */}
      {inProgressTutorials.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">📚 学習中</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inProgressTutorials.map((tutorial) => (
              <TutorialCard
                key={tutorial.id}
                tutorial={tutorial}
                progress={progress?.get(tutorial.id)}
                onStart={onStart}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommended */}
      {recommendedTutorials.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">✨ おすすめ</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendedTutorials.map((tutorial) => (
              <TutorialCard
                key={tutorial.id}
                tutorial={tutorial}
                progress={progress?.get(tutorial.id)}
                onStart={onStart}
              />
            ))}
          </div>
        </div>
      )}

      {/* All tutorials */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📖 すべてのチュートリアル</h2>
        <TutorialList tutorials={tutorials} progress={progress} onStart={onStart} />
      </div>
    </div>
  );
}

// ============================================================================
// Spotlight Highlight (for tooltips)
// ============================================================================

interface SpotlightProps {
  targetSelector: string;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  show: boolean;
  onDismiss: () => void;
}

export function Spotlight({ targetSelector, content, position = 'bottom', show, onDismiss }: SpotlightProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (show && targetSelector) {
      const element = document.querySelector(targetSelector);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    }
  }, [show, targetSelector]);

  if (!show || !targetRect) return null;

  const getPosition = () => {
    const padding = 12;
    switch (position) {
      case 'top':
        return {
          bottom: `${window.innerHeight - targetRect.top + padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          right: `${window.innerWidth - targetRect.left + padding}px`,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.right + padding}px`,
          transform: 'translateY(-50%)',
        };
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onDismiss} />

      {/* Highlight */}
      <div
        className="fixed z-50 border-2 border-blue-500 rounded-lg pointer-events-none"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl p-4 max-w-xs"
        style={getPosition()}
      >
        {content}
        <button
          onClick={onDismiss}
          className="mt-3 w-full px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          わかりました
        </button>
      </div>
    </>
  );
}

// ============================================================================
// Achievement Badge
// ============================================================================

interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export function AchievementBadge({ title, description, icon, unlocked, unlockedAt }: AchievementBadgeProps) {
  return (
    <div
      className={`
        p-4 rounded-xl border-2 transition-all
        ${unlocked ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-gray-50 opacity-50'}
      `}
    >
      <div className="flex items-center gap-3">
        <span className={`text-3xl ${unlocked ? '' : 'grayscale'}`}>{icon}</span>
        <div>
          <h3 className={`font-bold ${unlocked ? 'text-yellow-800' : 'text-gray-500'}`}>
            {title}
          </h3>
          <p className="text-sm text-gray-500">{description}</p>
          {unlocked && unlockedAt && (
            <p className="text-xs text-yellow-600 mt-1">
              {unlockedAt.toLocaleDateString('ja-JP')} 獲得
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Quick Start Widget (for dashboard)
// ============================================================================

interface QuickStartWidgetProps {
  tutorials: Tutorial[];
  onStart: (tutorial: Tutorial) => void;
}

export function QuickStartWidget({ tutorials, onStart }: QuickStartWidgetProps) {
  const quickStartTutorials = tutorials
    .filter((t) => t.category === 'quickstart')
    .slice(0, 2);

  if (quickStartTutorials.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>🚀</span>
        クイックスタート
      </h3>
      <div className="space-y-3">
        {quickStartTutorials.map((tutorial) => (
          <button
            key={tutorial.id}
            onClick={() => onStart(tutorial)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <span className="text-2xl">{tutorial.icon}</span>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{tutorial.nameJa}</div>
              <div className="text-sm text-gray-500">{tutorial.estimatedMinutes}分</div>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
