/**
 * Natural Language Interface Tests
 *
 * DASH-NLI-001: Japanese and English input
 * DASH-NLI-002: Intent analysis and workflow recommendation
 * DASH-NLI-003: Information extraction
 * DASH-NLI-004: Clarification questions
 * DASH-NLI-007: Input pattern recognition
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  NLIService,
  type IntentAnalysisResult,
  type ExtractedInfo,
  InputPattern,
  detectLanguage,
  extractIntent,
} from '../../src/nli/nli-service.js';

describe('NLI Service', () => {
  let service: NLIService;

  beforeEach(() => {
    service = new NLIService();
  });

  describe('Language Detection (DASH-NLI-001)', () => {
    it('should detect Japanese input', () => {
      const result = detectLanguage('タンパク質の構造を予測したい');
      expect(result).toBe('ja');
    });

    it('should detect English input', () => {
      const result = detectLanguage('I want to predict protein structure');
      expect(result).toBe('en');
    });

    it('should handle mixed language input', () => {
      const result = detectLanguage('BioEmuでタンパク質構造を予測');
      // Should detect dominant language
      expect(['ja', 'en']).toContain(result);
    });
  });

  describe('Intent Analysis (DASH-NLI-002, DASH-NLI-007)', () => {
    it('should recognize prediction intent - Japanese', async () => {
      const result = await service.analyzeIntent('薬物の活性を予測したい');

      expect(result.pattern).toBe(InputPattern.Predict);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should recognize prediction intent - English', async () => {
      const result = await service.analyzeIntent('I want to predict binding affinity');

      expect(result.pattern).toBe(InputPattern.Predict);
    });

    it('should recognize generation intent - Japanese', async () => {
      const result = await service.analyzeIntent('新しい分子を生成したい');

      expect(result.pattern).toBe(InputPattern.Generate);
    });

    it('should recognize generation intent - English', async () => {
      const result = await service.analyzeIntent('Generate new candidate molecules');

      expect(result.pattern).toBe(InputPattern.Generate);
    });

    it('should recognize optimization intent', async () => {
      const result = await service.analyzeIntent('化合物の特性を最適化したい');

      expect(result.pattern).toBe(InputPattern.Optimize);
    });

    it('should recognize analysis intent', async () => {
      const result = await service.analyzeIntent('実験データを分析したい');

      expect(result.pattern).toBe(InputPattern.Analyze);
    });

    it('should recognize comparison intent', async () => {
      const result = await service.analyzeIntent('結果を比較したい');

      expect(result.pattern).toBe(InputPattern.Compare);
    });

    it('should recommend appropriate workflow based on intent', async () => {
      const result = await service.analyzeIntent('タンパク質の構造を予測したい');

      expect(result.recommendedWorkflows).toBeDefined();
      expect(result.recommendedWorkflows.length).toBeGreaterThan(0);
      expect(result.recommendedWorkflows).toContain('protein-structure');
    });
  });

  describe('Information Extraction (DASH-NLI-003)', () => {
    it('should extract research domain', async () => {
      const result = await service.extractInfo(
        '創薬研究でリード化合物を最適化したい'
      );

      expect(result.domain).toBe('drug-discovery');
    });

    it('should extract target properties', async () => {
      const result = await service.extractInfo(
        'バンドギャップが2eV以上の半導体材料を探したい'
      );

      expect(result.targetProperties).toBeDefined();
      expect(result.targetProperties).toContain('bandgap');
    });

    it('should extract input data type', async () => {
      const result = await service.extractInfo(
        'FASTAファイルからタンパク質構造を予測したい'
      );

      expect(result.inputDataTypes).toContain('fasta');
    });

    it('should extract expected output format', async () => {
      const result = await service.extractInfo(
        '結果をCSV形式で出力したい'
      );

      expect(result.expectedOutputFormats).toContain('csv');
    });

    it('should extract multiple pieces of information', async () => {
      const result = await service.extractInfo(
        '創薬研究で、PDBファイルを入力として結合親和性を予測し、SDFで出力したい'
      );

      expect(result.domain).toBe('drug-discovery');
      expect(result.inputDataTypes).toContain('pdb');
      expect(result.targetProperties).toContain('binding-affinity');
      expect(result.expectedOutputFormats).toContain('sdf');
    });
  });

  describe('Clarification Questions (DASH-NLI-004)', () => {
    it('should generate clarification question for ambiguous input', async () => {
      const result = await service.analyzeIntent('何かを予測したい');

      expect(result.needsClarification).toBe(true);
      expect(result.clarificationQuestion).toBeDefined();
      expect(result.clarificationQuestion?.length).toBeGreaterThan(0);
    });

    it('should provide clarification in Japanese', async () => {
      const result = await service.analyzeIntent('予測したい', { language: 'ja' });

      expect(result.needsClarification).toBe(true);
      // Check for Japanese characters
      expect(result.clarificationQuestion).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/);
    });

    it('should not need clarification for specific input', async () => {
      const result = await service.analyzeIntent(
        'PDBファイルを入力としてタンパク質構造を予測し、ADMET特性を評価したい'
      );

      expect(result.needsClarification).toBe(false);
    });

    it('should suggest options when multiple interpretations exist', async () => {
      const result = await service.analyzeIntent('分子の特性を調べたい');

      if (result.needsClarification) {
        expect(result.clarificationOptions).toBeDefined();
        expect(result.clarificationOptions!.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('Intent Pattern Extraction (DASH-NLI-007)', () => {
  it('should match "〇〇を予測したい" pattern', () => {
    const pattern = extractIntent('結合親和性を予測したい');
    expect(pattern).toBe(InputPattern.Predict);
  });

  it('should match "〇〇を生成したい" pattern', () => {
    const pattern = extractIntent('新規化合物を生成したい');
    expect(pattern).toBe(InputPattern.Generate);
  });

  it('should match "〇〇を最適化したい" pattern', () => {
    const pattern = extractIntent('リード化合物を最適化したい');
    expect(pattern).toBe(InputPattern.Optimize);
  });

  it('should match "〇〇を分析したい" pattern', () => {
    const pattern = extractIntent('実験結果を分析したい');
    expect(pattern).toBe(InputPattern.Analyze);
  });

  it('should match "〇〇を比較したい" pattern', () => {
    const pattern = extractIntent('候補を比較したい');
    expect(pattern).toBe(InputPattern.Compare);
  });

  it('should match English "predict" pattern', () => {
    const pattern = extractIntent('I want to predict activity');
    expect(pattern).toBe(InputPattern.Predict);
  });

  it('should match English "generate" pattern', () => {
    const pattern = extractIntent('Generate new molecules');
    expect(pattern).toBe(InputPattern.Generate);
  });

  it('should return unknown for unrecognized patterns', () => {
    const pattern = extractIntent('ヘルプを表示');
    expect(pattern).toBe(InputPattern.Unknown);
  });
});

describe('Workflow Recommendations', () => {
  let service: NLIService;

  beforeEach(() => {
    service = new NLIService();
  });

  it('should recommend drug discovery workflows for pharma-related input', async () => {
    const result = await service.analyzeIntent(
      '新しい薬候補分子を見つけたい'
    );

    expect(result.recommendedWorkflows).toContain('molecule-generation');
  });

  it('should recommend materials workflows for materials-related input', async () => {
    const result = await service.analyzeIntent(
      '新しい電池材料を設計したい'
    );

    expect(result.recommendedWorkflows).toContain('material-generation');
  });

  it('should recommend climate workflows for weather-related input', async () => {
    const result = await service.analyzeIntent('天気予報を生成したい');

    expect(result.recommendedWorkflows).toContain('weather-prediction');
  });

  it('should recommend genomics workflows for protein-related input', async () => {
    const result = await service.analyzeIntent(
      'タンパク質のコンフォメーションを予測したい'
    );

    expect(result.recommendedWorkflows).toContain('protein-structure');
  });

  it('should provide multiple workflow options when applicable', async () => {
    const result = await service.analyzeIntent(
      '創薬研究で候補化合物を探索したい'
    );

    expect(result.recommendedWorkflows.length).toBeGreaterThan(1);
  });
});
