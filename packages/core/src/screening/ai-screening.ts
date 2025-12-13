/**
 * AI Prediction Screening (SCRN-AI)
 * AI予測によるスクリーニング
 */

export interface ScreeningCandidate {
  id: string;
  data: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

export type AIModelType = 'classification' | 'regression' | 'ranking';

export interface AIModelConfig {
  id: string;
  name: string;
  type: AIModelType;
  endpoint: string;
  version: string;
  threshold?: {
    passValue: number;
    direction: 'above' | 'below';
  };
  supportsUncertainty?: boolean;
  supportsExplanation?: boolean;
}

export interface PredictionResult {
  candidateId: string;
  prediction: number;
  modelVersion: string;
  uncertainty?: UncertaintyEstimate;
  explanation?: PredictionExplanation;
  flaggedForReview?: boolean;
}

export interface UncertaintyEstimate {
  value: number;
  level: 'high' | 'medium' | 'low';
}

export interface FeatureContribution {
  name: string;
  contribution: number;
}

export interface PredictionExplanation {
  topFeatures: FeatureContribution[];
  method: string;
}

export interface EnsemblePredictionResult extends PredictionResult {
  modelDisagreement?: number;
  individualPredictions?: Record<string, number>;
}

export interface AIScreeningResult {
  passed: ScreeningCandidate[];
  excluded: ScreeningCandidate[];
}

export interface BatchPredictionOptions {
  batchSize?: number;
  parallel?: boolean;
  maxConcurrency?: number;
  onProgress?: (progress: number) => void;
}

export interface EnsembleOptions {
  aggregation: 'mean' | 'median' | 'weighted';
  weights?: Record<string, number>;
  calculateDisagreement?: boolean;
}

/**
 * AI Prediction Screening
 */
export class AIScreening {
  private models: Map<string, AIModelConfig> = new Map();
  private mockPredictions: Map<string, Record<string, number>> = new Map();
  private mockUncertaintyPredictions: Map<
    string,
    Record<string, { prediction: number; uncertainty: number }>
  > = new Map();
  private mockExplanationPredictions: Map<
    string,
    Record<string, { prediction: number; explanation: PredictionExplanation }>
  > = new Map();

  async addModel(config: AIModelConfig): Promise<void> {
    this.models.set(config.id, config);
  }

  getModels(): AIModelConfig[] {
    return Array.from(this.models.values());
  }

  getModel(id: string): AIModelConfig | undefined {
    return this.models.get(id);
  }

  getSupportedModelTypes(): AIModelType[] {
    return ['classification', 'regression', 'ranking'];
  }

  // Mock helpers for testing
  setMockPredictions(
    predictions: Record<string, number>,
    modelId?: string
  ): void {
    const key = modelId ?? 'default';
    this.mockPredictions.set(key, predictions);
  }

  setMockPredictionsWithUncertainty(
    predictions: Record<string, { prediction: number; uncertainty: number }>,
    modelId?: string
  ): void {
    const key = modelId ?? 'default';
    this.mockUncertaintyPredictions.set(key, predictions);
  }

  setMockPredictionsWithExplanations(
    predictions: Record<
      string,
      { prediction: number; explanation: PredictionExplanation }
    >,
    modelId?: string
  ): void {
    const key = modelId ?? 'default';
    this.mockExplanationPredictions.set(key, predictions);
  }

  private getMockPrediction(candidateId: string, modelId: string): number {
    const modelPredictions = this.mockPredictions.get(modelId);
    if (modelPredictions && candidateId in modelPredictions) {
      return modelPredictions[candidateId]!;
    }
    const defaultPredictions = this.mockPredictions.get('default');
    if (defaultPredictions && candidateId in defaultPredictions) {
      return defaultPredictions[candidateId]!;
    }
    return 0.5; // Default prediction
  }

  async predict(
    modelId: string,
    candidates: ScreeningCandidate[]
  ): Promise<PredictionResult[]> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    return candidates.map((candidate) => ({
      candidateId: candidate.id,
      prediction: this.getMockPrediction(candidate.id, modelId),
      modelVersion: model.version,
    }));
  }

  async screen(
    modelId: string,
    candidates: ScreeningCandidate[]
  ): Promise<AIScreeningResult> {
    const model = this.models.get(modelId);
    if (!model || !model.threshold) {
      throw new Error(`Model not found or no threshold configured: ${modelId}`);
    }

    const predictions = await this.predict(modelId, candidates);
    const passed: ScreeningCandidate[] = [];
    const excluded: ScreeningCandidate[] = [];

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i]!;
      const prediction = predictions[i]!;
      const passes =
        model.threshold.direction === 'above'
          ? prediction.prediction >= model.threshold.passValue
          : prediction.prediction <= model.threshold.passValue;

      if (passes) {
        passed.push(candidate);
      } else {
        excluded.push(candidate);
      }
    }

    return { passed, excluded };
  }

  async rank(
    modelId: string,
    candidates: ScreeningCandidate[]
  ): Promise<PredictionResult[]> {
    const predictions = await this.predict(modelId, candidates);
    return predictions.sort((a, b) => b.prediction - a.prediction);
  }

  async predictWithUncertainty(
    modelId: string,
    candidates: ScreeningCandidate[]
  ): Promise<PredictionResult[]> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    // Try model-specific data first, then fall back to default
    const mockData = this.mockUncertaintyPredictions.get(modelId) ?? 
                     this.mockUncertaintyPredictions.get('default');

    return candidates.map((candidate) => {
      const data = mockData?.[candidate.id];
      const uncertaintyValue = data?.uncertainty ?? 0.1;
      const uncertaintyLevel =
        uncertaintyValue < 0.1
          ? 'high'
          : uncertaintyValue > 0.2
            ? 'low'
            : 'medium';

      return {
        candidateId: candidate.id,
        prediction: data?.prediction ?? this.getMockPrediction(candidate.id, modelId),
        modelVersion: model.version,
        uncertainty: {
          value: uncertaintyValue,
          level: uncertaintyLevel,
        },
        flaggedForReview: uncertaintyValue > 0.2,
      };
    });
  }

  async predictWithExplanation(
    modelId: string,
    candidates: ScreeningCandidate[]
  ): Promise<PredictionResult[]> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    // Try model-specific data first, then fall back to default
    const mockData = this.mockExplanationPredictions.get(modelId) ??
                     this.mockExplanationPredictions.get('default');

    return candidates.map((candidate) => {
      const data = mockData?.[candidate.id];

      return {
        candidateId: candidate.id,
        prediction: data?.prediction ?? this.getMockPrediction(candidate.id, modelId),
        modelVersion: model.version,
        explanation: data?.explanation,
      };
    });
  }

  async ensemblePredict(
    modelIds: string[],
    candidates: ScreeningCandidate[],
    options: EnsembleOptions
  ): Promise<EnsemblePredictionResult[]> {
    // Get predictions from all models
    const allPredictions: Record<string, Record<string, number>> = {};

    for (const modelId of modelIds) {
      const predictions = await this.predict(modelId, candidates);
      for (const pred of predictions) {
        if (!allPredictions[pred.candidateId]) {
          allPredictions[pred.candidateId] = {};
        }
        allPredictions[pred.candidateId]![modelId] = pred.prediction;
      }
    }

    return candidates.map((candidate) => {
      const predictions = allPredictions[candidate.id] ?? {};
      const values = Object.values(predictions);

      let aggregatedPrediction: number;

      if (options.aggregation === 'mean') {
        aggregatedPrediction =
          values.reduce((sum, v) => sum + v, 0) / values.length;
      } else if (options.aggregation === 'median') {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        aggregatedPrediction =
          sorted.length % 2 !== 0
            ? sorted[mid]!
            : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
      } else {
        // weighted
        let weightedSum = 0;
        let totalWeight = 0;
        for (const [modelId, pred] of Object.entries(predictions)) {
          const weight = options.weights?.[modelId] ?? 1;
          weightedSum += pred * weight;
          totalWeight += weight;
        }
        aggregatedPrediction = totalWeight > 0 ? weightedSum / totalWeight : 0;
      }

      // Calculate model disagreement (standard deviation)
      let disagreement: number | undefined;
      if (options.calculateDisagreement && values.length > 1) {
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
        disagreement = Math.sqrt(
          squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length
        );
      }

      const model = this.models.get(modelIds[0]!);

      return {
        candidateId: candidate.id,
        prediction: aggregatedPrediction,
        modelVersion: model?.version ?? 'ensemble',
        modelDisagreement: disagreement,
        individualPredictions: predictions,
      };
    });
  }

  async batchPredict(
    modelId: string,
    candidates: ScreeningCandidate[],
    options: BatchPredictionOptions = {}
  ): Promise<PredictionResult[]> {
    const { batchSize = 100, onProgress, parallel = false, maxConcurrency = 4 } = options;

    const results: PredictionResult[] = [];
    const batches: ScreeningCandidate[][] = [];

    // Split into batches
    for (let i = 0; i < candidates.length; i += batchSize) {
      batches.push(candidates.slice(i, i + batchSize));
    }

    if (parallel) {
      // Process batches in parallel with concurrency limit
      let completedBatches = 0;
      
      const processBatch = async (batch: ScreeningCandidate[]): Promise<PredictionResult[]> => {
        const batchResults = await this.predict(modelId, batch);
        completedBatches++;
        if (onProgress) {
          onProgress(completedBatches / batches.length);
        }
        return batchResults;
      };

      // Process in chunks based on maxConcurrency
      for (let i = 0; i < batches.length; i += maxConcurrency) {
        const chunk = batches.slice(i, i + maxConcurrency);
        const chunkResults = await Promise.all(chunk.map(processBatch));
        for (const r of chunkResults) {
          results.push(...r);
        }
      }
    } else {
      // Sequential processing
      for (let i = 0; i < batches.length; i++) {
        const batchResults = await this.predict(modelId, batches[i]!);
        results.push(...batchResults);

        if (onProgress) {
          onProgress((i + 1) / batches.length);
        }
      }
    }

    return results;
  }
}
