'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

/**
 * Intent confidence level
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Detected intent
 */
export interface DetectedIntent {
  intent: string;
  domain: string | null;
  confidence: number;
  entities: Record<string, unknown>;
  language: 'ja' | 'en';
}

/**
 * Workflow suggestion
 */
export interface WorkflowSuggestion {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  descriptionJa: string;
  domain: string;
  matchScore: number;
}

/**
 * NLIInput props
 */
export interface NLIInputProps {
  onSubmit: (input: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isProcessing?: boolean;
}

/**
 * NLIInput component - natural language input with Japanese placeholder
 */
export function NLIInput({
  onSubmit,
  placeholder = '何をしたいですか？例: 新しい薬を設計したい',
  disabled = false,
  isProcessing = false,
}: NLIInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled && !isProcessing) {
      onSubmit(input.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full" data-testid="nli-input">
      <div className="relative">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isProcessing}
          className="
            w-full min-h-[60px] max-h-[150px] resize-none
            rounded-lg border border-gray-300 px-4 py-3 pr-20
            text-gray-900 placeholder-gray-400
            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
            disabled:bg-gray-50 disabled:text-gray-500
          "
          rows={1}
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!input.trim() || disabled || isProcessing}
          className="absolute right-2 bottom-2"
        >
          {isProcessing ? '処理中...' : '送信'}
        </Button>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        日本語または英語で入力できます
      </p>
    </form>
  );
}

/**
 * Get confidence level from score
 */
function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

/**
 * Confidence badge variants
 */
const confidenceVariants: Record<ConfidenceLevel, 'success' | 'warning' | 'danger'> = {
  high: 'success',
  medium: 'warning',
  low: 'danger',
};

/**
 * IntentDisplay props
 */
export interface IntentDisplayProps {
  intent: DetectedIntent;
  showDetails?: boolean;
}

/**
 * IntentDisplay component - shows detected intent and confidence
 */
export function IntentDisplay({ intent, showDetails = true }: IntentDisplayProps) {
  const confidenceLevel = getConfidenceLevel(intent.confidence);
  const confidencePercent = Math.round(intent.confidence * 100);

  const domainLabels: Record<string, string> = {
    'drug-discovery': '創薬',
    'materials-science': '材料科学',
    'climate': '気候科学',
    'genomics': 'ゲノミクス',
  };

  return (
    <Card data-testid="intent-display">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">検出された意図</CardTitle>
          <Badge variant={confidenceVariants[confidenceLevel]}>
            信頼度: {confidencePercent}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-500">意図: </span>
            <span className="font-medium">{intent.intent}</span>
          </div>
          {intent.domain && (
            <div>
              <span className="text-sm text-gray-500">ドメイン: </span>
              <Badge variant="info">{domainLabels[intent.domain] || intent.domain}</Badge>
            </div>
          )}
          <div>
            <span className="text-sm text-gray-500">言語: </span>
            <span>{intent.language === 'ja' ? '日本語' : '英語'}</span>
          </div>
          {showDetails && Object.keys(intent.entities).length > 0 && (
            <div>
              <span className="text-sm text-gray-500">抽出された情報: </span>
              <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                {JSON.stringify(intent.entities, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * WorkflowSuggestions props
 */
export interface WorkflowSuggestionsProps {
  suggestions: WorkflowSuggestion[];
  onSelect: (workflow: WorkflowSuggestion) => void;
  maxDisplay?: number;
}

/**
 * WorkflowSuggestions component - workflow recommendation display
 */
export function WorkflowSuggestions({
  suggestions,
  onSelect,
  maxDisplay = 5,
}: WorkflowSuggestionsProps) {
  const displayedSuggestions = suggestions.slice(0, maxDisplay);

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500" data-testid="no-suggestions">
        提案するワークフローがありません
      </div>
    );
  }

  const domainLabels: Record<string, string> = {
    'drug-discovery': '創薬',
    'materials-science': '材料科学',
    'climate': '気候科学',
    'genomics': 'ゲノミクス',
  };

  const domainVariants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    'drug-discovery': 'success',
    'materials-science': 'info',
    'climate': 'warning',
    'genomics': 'danger',
  };

  return (
    <div className="space-y-3" data-testid="workflow-suggestions">
      <h3 className="text-sm font-medium text-gray-700">
        おすすめのワークフロー ({suggestions.length}件)
      </h3>
      {displayedSuggestions.map((workflow) => (
        <Card
          key={workflow.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelect(workflow)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{workflow.nameJa}</h4>
                <p className="text-sm text-gray-600 mt-1">{workflow.descriptionJa}</p>
              </div>
              <div className="flex flex-col items-end gap-1 ml-4">
                <Badge variant={domainVariants[workflow.domain] || 'default'}>
                  {domainLabels[workflow.domain] || workflow.domain}
                </Badge>
                <span className="text-xs text-gray-400">
                  一致度: {Math.round(workflow.matchScore * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {suggestions.length > maxDisplay && (
        <p className="text-sm text-gray-500 text-center">
          他 {suggestions.length - maxDisplay} 件のワークフロー
        </p>
      )}
    </div>
  );
}

/**
 * NLI Panel - combines all NLI components
 */
export interface NLIPanelProps {
  onProcessInput: (input: string) => Promise<{
    intent: DetectedIntent;
    suggestions: WorkflowSuggestion[];
  }>;
  onSelectWorkflow: (workflow: WorkflowSuggestion) => void;
}

export function NLIPanel({ onProcessInput, onSelectWorkflow }: NLIPanelProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    intent: DetectedIntent;
    suggestions: WorkflowSuggestion[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (input: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const response = await onProcessInput(input);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="nli-panel">
      <NLIInput onSubmit={handleSubmit} isProcessing={isProcessing} />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <IntentDisplay intent={result.intent} />
          <WorkflowSuggestions
            suggestions={result.suggestions}
            onSelect={onSelectWorkflow}
          />
        </div>
      )}
    </div>
  );
}
