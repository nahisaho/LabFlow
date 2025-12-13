/**
 * Ask Action Tests
 *
 * DASH-NLI-001: Japanese and English input support
 * DASH-NLI-002: Intent analysis and workflow recommendation
 */

import { describe, it, expect, vi } from 'vitest';
import {
  formatAskResult,
  getClarificationOptions,
  detectLanguage,
  extractIntent,
  InputPattern,
  type AskResult,
} from '../src/actions/ask.js';

// Helper to create mock AskResult
function createMockResult(overrides: Partial<AskResult> = {}): AskResult {
  return {
    query: 'test query',
    language: 'ja',
    intent: {
      pattern: InputPattern.Generate,
      confidence: 0.9,
      language: 'ja',
      recommendedWorkflows: ['material-generation'],
      needsClarification: false,
    },
    extractedInfo: {
      domain: 'materials',
    },
    suggestions: [
      {
        id: 'material-generation',
        name: 'Material Generation',
        description: 'MatterGenで新規材料を生成',
        confidence: 0.9,
        command: 'labflow workflow run material-generation',
      },
    ],
    ...overrides,
  };
}

describe('Ask Action', () => {
  describe('formatAskResult', () => {
    it('should format result for Japanese', () => {
      const result = createMockResult({ language: 'ja' });
      const formatted = formatAskResult(result);

      expect(formatted).toContain('分析結果');
      expect(formatted).toContain('インテント');
    });

    it('should format result for English', () => {
      const result = createMockResult({
        language: 'en',
        intent: {
          pattern: InputPattern.Generate,
          confidence: 0.9,
          language: 'en',
          recommendedWorkflows: ['material-generation'],
          needsClarification: false,
        },
      });
      const formatted = formatAskResult(result);

      expect(formatted).toContain('Analysis Result');
      expect(formatted).toContain('Intent');
    });

    it('should include workflow suggestions', () => {
      const result = createMockResult();
      const formatted = formatAskResult(result);

      expect(formatted).toContain('推奨ワークフロー');
      expect(formatted).toContain('labflow');
    });

    it('should include clarification question when needed', () => {
      const result = createMockResult({
        intent: {
          pattern: InputPattern.Unknown,
          confidence: 0.3,
          language: 'ja',
          recommendedWorkflows: [],
          needsClarification: true,
          clarificationQuestion: '何を行いたいですか？',
          clarificationOptions: ['予測', '生成', '分析'],
        },
      });
      const formatted = formatAskResult(result);

      expect(formatted).toContain('確認');
      expect(formatted).toContain('何を行いたいですか？');
    });

    it('should include detailed info in verbose mode', () => {
      const result = createMockResult();
      const formatted = formatAskResult(result, true);

      expect(formatted).toContain('詳細情報');
      expect(formatted).toContain('materials');
    });

    it('should show confidence percentage', () => {
      const result = createMockResult();
      const formatted = formatAskResult(result);

      expect(formatted).toContain('90%');
    });

    it('should show domain information', () => {
      const result = createMockResult();
      const formatted = formatAskResult(result);

      expect(formatted).toContain('ドメイン');
      expect(formatted).toContain('materials');
    });
  });

  describe('getClarificationOptions', () => {
    it('should return clarification options when available', () => {
      const result = createMockResult({
        intent: {
          pattern: InputPattern.Unknown,
          confidence: 0.3,
          language: 'ja',
          recommendedWorkflows: [],
          needsClarification: true,
          clarificationQuestion: '何を行いたいですか？',
          clarificationOptions: ['予測', '生成', '分析'],
        },
      });
      const options = getClarificationOptions(result);

      expect(options).toEqual(['予測', '生成', '分析']);
    });

    it('should return empty array when no options', () => {
      const result = createMockResult();
      const options = getClarificationOptions(result);

      expect(options).toEqual([]);
    });
  });

  describe('detectLanguage', () => {
    it('should detect Japanese text', () => {
      expect(detectLanguage('こんにちは')).toBe('ja');
      expect(detectLanguage('タンパク質構造予測')).toBe('ja');
      expect(detectLanguage('材料を生成したい')).toBe('ja');
    });

    it('should detect English text', () => {
      expect(detectLanguage('Hello world')).toBe('en');
      expect(detectLanguage('Generate materials')).toBe('en');
      expect(detectLanguage('Predict protein structure')).toBe('en');
    });

    it('should detect mixed text with majority Japanese', () => {
      // More Japanese characters
      expect(detectLanguage('タンパク質のstructure')).toBe('ja');
    });

    it('should detect mixed text with majority English', () => {
      // More English characters
      expect(detectLanguage('Predict something in English text')).toBe('en');
    });
  });

  describe('extractIntent', () => {
    it('should extract predict intent from Japanese', () => {
      expect(extractIntent('予測したい')).toBe(InputPattern.Predict);
      expect(extractIntent('構造を予測する')).toBe(InputPattern.Predict);
    });

    it('should extract generate intent from Japanese', () => {
      expect(extractIntent('生成したい')).toBe(InputPattern.Generate);
      expect(extractIntent('分子を作りたい')).toBe(InputPattern.Generate);
    });

    it('should extract optimize intent from Japanese', () => {
      expect(extractIntent('最適化したい')).toBe(InputPattern.Optimize);
      expect(extractIntent('特性を改善したい')).toBe(InputPattern.Optimize);
    });

    it('should extract analyze intent from Japanese', () => {
      expect(extractIntent('分析したい')).toBe(InputPattern.Analyze);
      expect(extractIntent('データを調べたい')).toBe(InputPattern.Analyze);
    });

    it('should extract compare intent from Japanese', () => {
      expect(extractIntent('比較したい')).toBe(InputPattern.Compare);
    });

    it('should extract predict intent from English', () => {
      expect(extractIntent('I want to predict')).toBe(InputPattern.Predict);
      expect(extractIntent('Make a prediction')).toBe(InputPattern.Predict);
    });

    it('should extract generate intent from English', () => {
      expect(extractIntent('Generate molecules')).toBe(InputPattern.Generate);
      expect(extractIntent('Create new compounds')).toBe(InputPattern.Generate);
    });

    it('should return unknown for ambiguous text', () => {
      expect(extractIntent('hello')).toBe(InputPattern.Unknown);
      expect(extractIntent('こんにちは')).toBe(InputPattern.Unknown);
    });
  });
});
