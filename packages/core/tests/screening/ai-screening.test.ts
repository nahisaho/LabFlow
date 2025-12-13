/**
 * AI Prediction Screening Tests (SCRN-AI)
 * AI予測によるスクリーニング
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  AIScreening,
  AIModelConfig,
  PredictionResult,
  ScreeningCandidate,
  UncertaintyEstimate,
  BatchPredictionOptions,
} from '../../src/screening/ai-screening';

describe('AI Prediction Screening (SCRN-AI)', () => {
  let aiScreening: AIScreening;

  beforeEach(() => {
    aiScreening = new AIScreening();
  });

  describe('AI model configuration (SCRN-AI-001)', () => {
    it('should configure pre-trained models for screening', async () => {
      const config: AIModelConfig = {
        id: 'activity-predictor',
        name: 'Activity Predictor',
        type: 'classification',
        endpoint: 'local://models/activity-predictor',
        version: '1.0.0',
      };

      await aiScreening.addModel(config);
      expect(aiScreening.getModels()).toHaveLength(1);
    });

    it('should support multiple model types', () => {
      const types = aiScreening.getSupportedModelTypes();

      expect(types).toContain('classification');
      expect(types).toContain('regression');
      expect(types).toContain('ranking');
    });

    it('should configure model-specific thresholds', async () => {
      const config: AIModelConfig = {
        id: 'toxicity-model',
        name: 'Toxicity Predictor',
        type: 'classification',
        endpoint: 'local://models/toxicity',
        version: '1.0.0',
        threshold: {
          passValue: 0.3, // predict < 0.3 means pass (low toxicity)
          direction: 'below',
        },
      };

      await aiScreening.addModel(config);
      const model = aiScreening.getModel('toxicity-model');

      expect(model?.threshold?.passValue).toBe(0.3);
    });
  });

  describe('prediction for screening candidates (SCRN-AI-002)', () => {
    beforeEach(async () => {
      // Mock model
      await aiScreening.addModel({
        id: 'mock-predictor',
        name: 'Mock Predictor',
        type: 'regression',
        endpoint: 'mock://test',
        version: '1.0.0',
        threshold: {
          passValue: 0.5,
          direction: 'above',
        },
      });

      // Set mock predictions
      aiScreening.setMockPredictions({
        c1: 0.8,
        c2: 0.3,
        c3: 0.6,
      });
    });

    it('should predict activity/property values', async () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: { smiles: 'CCO' } },
      ];

      const results = await aiScreening.predict('mock-predictor', candidates);

      expect(results[0]?.prediction).toBe(0.8);
    });

    it('should filter candidates based on predictions', async () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: { smiles: 'CCO' } },
        { id: 'c2', data: { smiles: 'CC' } },
        { id: 'c3', data: { smiles: 'C' } },
      ];

      const screeningResult = await aiScreening.screen('mock-predictor', candidates);

      expect(screeningResult.passed).toHaveLength(2); // c1 (0.8) and c3 (0.6) > 0.5
      expect(screeningResult.excluded).toHaveLength(1); // c2 (0.3) < 0.5
    });

    it('should rank candidates by predicted score', async () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: {} },
        { id: 'c2', data: {} },
        { id: 'c3', data: {} },
      ];

      const ranked = await aiScreening.rank('mock-predictor', candidates);

      expect(ranked[0]?.candidateId).toBe('c1'); // 0.8
      expect(ranked[1]?.candidateId).toBe('c3'); // 0.6
      expect(ranked[2]?.candidateId).toBe('c2'); // 0.3
    });
  });

  describe('uncertainty estimation (SCRN-AI-003)', () => {
    beforeEach(async () => {
      await aiScreening.addModel({
        id: 'uncertainty-model',
        name: 'Uncertainty Model',
        type: 'regression',
        endpoint: 'mock://uncertainty',
        version: '1.0.0',
        supportsUncertainty: true,
      });

      aiScreening.setMockPredictionsWithUncertainty({
        c1: { prediction: 0.8, uncertainty: 0.05 },
        c2: { prediction: 0.5, uncertainty: 0.35 },
        c3: { prediction: 0.6, uncertainty: 0.12 },
      });
    });

    it('should return uncertainty estimates with predictions', async () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: {} },
      ];

      const results = await aiScreening.predictWithUncertainty(
        'uncertainty-model',
        candidates
      );

      expect(results[0]?.uncertainty).toBeDefined();
      expect(results[0]?.uncertainty?.value).toBe(0.05);
    });

    it('should classify confidence levels', async () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: {} },
        { id: 'c2', data: {} },
        { id: 'c3', data: {} },
      ];

      const results = await aiScreening.predictWithUncertainty(
        'uncertainty-model',
        candidates
      );

      expect(results[0]?.uncertainty?.level).toBe('high'); // 0.05 < 0.1
      expect(results[1]?.uncertainty?.level).toBe('low'); // 0.35 > 0.2
      expect(results[2]?.uncertainty?.level).toBe('medium'); // 0.12
    });

    it('should flag high-uncertainty predictions for review', async () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: {} },
        { id: 'c2', data: {} },
      ];

      const results = await aiScreening.predictWithUncertainty(
        'uncertainty-model',
        candidates
      );

      const flagged = results.filter((r) => r.flaggedForReview);
      expect(flagged).toHaveLength(1);
      expect(flagged[0]?.candidateId).toBe('c2');
    });
  });

  describe('multi-model ensemble (SCRN-AI-004)', () => {
    beforeEach(async () => {
      await aiScreening.addModel({
        id: 'model-a',
        name: 'Model A',
        type: 'regression',
        endpoint: 'mock://a',
        version: '1.0.0',
      });
      await aiScreening.addModel({
        id: 'model-b',
        name: 'Model B',
        type: 'regression',
        endpoint: 'mock://b',
        version: '1.0.0',
      });
      await aiScreening.addModel({
        id: 'model-c',
        name: 'Model C',
        type: 'regression',
        endpoint: 'mock://c',
        version: '1.0.0',
      });

      aiScreening.setMockPredictions({
        c1: 0.8,
      }, 'model-a');
      aiScreening.setMockPredictions({
        c1: 0.6,
      }, 'model-b');
      aiScreening.setMockPredictions({
        c1: 0.7,
      }, 'model-c');
    });

    it('should combine predictions from multiple models', async () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: {} },
      ];

      const ensembleResult = await aiScreening.ensemblePredict(
        ['model-a', 'model-b', 'model-c'],
        candidates,
        { aggregation: 'mean' }
      );

      expect(ensembleResult[0]?.prediction).toBeCloseTo(0.7, 2);
    });

    it('should support different aggregation methods', async () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: {} },
      ];

      const meanResult = await aiScreening.ensemblePredict(
        ['model-a', 'model-b', 'model-c'],
        candidates,
        { aggregation: 'mean' }
      );

      const medianResult = await aiScreening.ensemblePredict(
        ['model-a', 'model-b', 'model-c'],
        candidates,
        { aggregation: 'median' }
      );

      expect(meanResult[0]?.prediction).toBeCloseTo(0.7, 2);
      expect(medianResult[0]?.prediction).toBeCloseTo(0.7, 2);
    });

    it('should calculate ensemble uncertainty from model disagreement', async () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: {} },
      ];

      const result = await aiScreening.ensemblePredict(
        ['model-a', 'model-b', 'model-c'],
        candidates,
        { aggregation: 'mean', calculateDisagreement: true }
      );

      expect(result[0]?.modelDisagreement).toBeDefined();
      expect(result[0]?.modelDisagreement).toBeGreaterThan(0);
    });
  });

  describe('batch processing (SCRN-AI-005)', () => {
    beforeEach(async () => {
      await aiScreening.addModel({
        id: 'batch-model',
        name: 'Batch Model',
        type: 'regression',
        endpoint: 'mock://batch',
        version: '1.0.0',
      });
    });

    it('should handle up to 10,000 candidates in batch', async () => {
      const candidates: ScreeningCandidate[] = Array.from(
        { length: 10000 },
        (_, i) => ({
          id: `c${i}`,
          data: { index: i },
        })
      );

      // Mock batch predictions
      const mockPredictions: Record<string, number> = {};
      candidates.forEach((c, i) => {
        mockPredictions[c.id] = Math.random();
      });
      aiScreening.setMockPredictions(mockPredictions, 'batch-model');

      const options: BatchPredictionOptions = {
        batchSize: 1000,
      };

      const results = await aiScreening.batchPredict(
        'batch-model',
        candidates,
        options
      );

      expect(results).toHaveLength(10000);
    });

    it('should provide progress callback for batch processing', async () => {
      const candidates: ScreeningCandidate[] = Array.from(
        { length: 1000 },
        (_, i) => ({
          id: `c${i}`,
          data: {},
        })
      );

      const mockPredictions: Record<string, number> = {};
      candidates.forEach((c) => {
        mockPredictions[c.id] = Math.random();
      });
      aiScreening.setMockPredictions(mockPredictions, 'batch-model');

      const progressUpdates: number[] = [];
      const onProgress = vi.fn((progress: number) => {
        progressUpdates.push(progress);
      });

      await aiScreening.batchPredict('batch-model', candidates, {
        batchSize: 200,
        onProgress,
      });

      expect(onProgress).toHaveBeenCalled();
      expect(progressUpdates.length).toBeGreaterThan(0);
    });

    it('should support parallel batch processing', async () => {
      const candidates: ScreeningCandidate[] = Array.from(
        { length: 1000 },
        (_, i) => ({
          id: `c${i}`,
          data: {},
        })
      );

      const mockPredictions: Record<string, number> = {};
      candidates.forEach((c) => {
        mockPredictions[c.id] = Math.random();
      });
      aiScreening.setMockPredictions(mockPredictions, 'batch-model');

      const startTime = Date.now();
      await aiScreening.batchPredict('batch-model', candidates, {
        batchSize: 100,
        parallel: true,
        maxConcurrency: 4,
      });
      const duration = Date.now() - startTime;

      // Should complete reasonably fast
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('prediction explanation (SCRN-AI-006)', () => {
    beforeEach(async () => {
      await aiScreening.addModel({
        id: 'explainable-model',
        name: 'Explainable Model',
        type: 'classification',
        endpoint: 'mock://explainable',
        version: '1.0.0',
        supportsExplanation: true,
      });

      aiScreening.setMockPredictionsWithExplanations({
        c1: {
          prediction: 0.85,
          explanation: {
            topFeatures: [
              { name: 'molecularWeight', contribution: 0.3 },
              { name: 'logP', contribution: 0.25 },
              { name: 'aromatic_rings', contribution: 0.15 },
            ],
            method: 'SHAP',
          },
        },
      });
    });

    it('should provide feature importance for predictions', async () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: { molecularWeight: 300, logP: 2.5 } },
      ];

      const results = await aiScreening.predictWithExplanation(
        'explainable-model',
        candidates
      );

      expect(results[0]?.explanation).toBeDefined();
      expect(results[0]?.explanation?.topFeatures).toHaveLength(3);
    });

    it('should identify key contributing factors', async () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: {} },
      ];

      const results = await aiScreening.predictWithExplanation(
        'explainable-model',
        candidates
      );

      const topFeature = results[0]?.explanation?.topFeatures[0];
      expect(topFeature?.name).toBe('molecularWeight');
      expect(topFeature?.contribution).toBe(0.3);
    });

    it('should indicate explanation method used', async () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: {} },
      ];

      const results = await aiScreening.predictWithExplanation(
        'explainable-model',
        candidates
      );

      expect(results[0]?.explanation?.method).toBe('SHAP');
    });
  });

  describe('model versioning', () => {
    it('should track model version used for predictions', async () => {
      await aiScreening.addModel({
        id: 'versioned-model',
        name: 'Versioned Model',
        type: 'regression',
        endpoint: 'mock://versioned',
        version: '2.1.0',
      });

      aiScreening.setMockPredictions({ c1: 0.5 }, 'versioned-model');

      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: {} },
      ];

      const results = await aiScreening.predict('versioned-model', candidates);

      expect(results[0]?.modelVersion).toBe('2.1.0');
    });
  });
});
