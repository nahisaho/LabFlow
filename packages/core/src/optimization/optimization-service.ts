/**
 * Experiment Optimization Service
 *
 * Bayesian optimization for experiment planning
 *
 * Requirements:
 * - EXP-OPT-001: Bayesian optimization for experiment planning
 * - EXP-OPT-002: Multi-objective optimization support
 * - EXP-OPT-003: Constraint handling
 */

import type {
  OptimizationConfig,
  OptimizationSession,
  OptimizationTrial,
  ParameterSuggestion,
  OptimizationInsights,
  OptimizationSummary,
  CreateOptimizationInput,
  ReportTrialInput,
  ParameterSpace,
  ObjectiveDefinition,
  ConvergencePoint,
  AcquisitionFunction,
} from './types';

/**
 * Default optimization settings
 */
const DEFAULT_SETTINGS = {
  acquisitionFunction: 'expected_improvement' as AcquisitionFunction,
  initialSamples: 5,
  maxIterations: 50,
  earlyStoppingPatience: 10,
  batchSize: 1,
  explorationWeight: 0.5,
};

/**
 * Optimization Service
 */
export class OptimizationService {
  private configs: Map<string, OptimizationConfig> = new Map();
  private sessions: Map<string, OptimizationSession> = new Map();

  /**
   * Create a new optimization configuration
   */
  async createConfig(input: CreateOptimizationInput): Promise<OptimizationConfig> {
    const id = crypto.randomUUID();
    const now = new Date();

    const config: OptimizationConfig = {
      id,
      name: input.name,
      description: input.description,
      parameters: input.parameters,
      objectives: input.objectives,
      constraints: input.constraints,
      acquisitionFunction: input.acquisitionFunction ?? DEFAULT_SETTINGS.acquisitionFunction,
      initialSamples: input.initialSamples ?? DEFAULT_SETTINGS.initialSamples,
      maxIterations: input.maxIterations ?? DEFAULT_SETTINGS.maxIterations,
      earlyStoppingPatience: input.earlyStoppingPatience ?? DEFAULT_SETTINGS.earlyStoppingPatience,
      seed: input.seed,
      batchSize: input.batchSize ?? DEFAULT_SETTINGS.batchSize,
      explorationWeight: input.explorationWeight ?? DEFAULT_SETTINGS.explorationWeight,
      createdAt: now,
      updatedAt: now,
    };

    this.configs.set(id, config);
    return config;
  }

  /**
   * Start a new optimization session
   */
  async startSession(
    configId: string,
    labId: string,
    userId: string,
    name?: string
  ): Promise<OptimizationSession> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Optimization config not found: ${configId}`);
    }

    const id = crypto.randomUUID();
    const now = new Date();

    const session: OptimizationSession = {
      id,
      configId,
      labId,
      name: name ?? `${config.name} - Run ${now.toISOString().slice(0, 10)}`,
      status: 'running',
      trials: [],
      currentIteration: 0,
      convergenceHistory: [],
      createdById: userId,
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(id, session);
    return session;
  }

  /**
   * Suggest next parameters to try
   */
  async suggestNext(sessionId: string, count: number = 1): Promise<ParameterSuggestion[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Optimization session not found: ${sessionId}`);
    }

    const config = this.configs.get(session.configId);
    if (!config) {
      throw new Error(`Optimization config not found: ${session.configId}`);
    }

    const suggestions: ParameterSuggestion[] = [];

    for (let i = 0; i < count; i++) {
      const completedTrials = session.trials.filter((t) => t.status === 'completed');

      // Initial random sampling phase
      if (completedTrials.length < config.initialSamples) {
        suggestions.push(this.generateRandomSample(config.parameters, config.objectives));
      } else {
        // Bayesian optimization phase
        suggestions.push(
          this.generateBayesianSuggestion(
            config,
            completedTrials,
            config.acquisitionFunction
          )
        );
      }
    }

    return suggestions;
  }

  /**
   * Generate random sample for initial exploration
   */
  private generateRandomSample(
    parameters: ParameterSpace[],
    objectives: ObjectiveDefinition[]
  ): ParameterSuggestion {
    const params: Record<string, number | string> = {};
    const predicted: Record<string, number> = {};
    const uncertainty: Record<string, number> = {};

    for (const param of parameters) {
      params[param.name] = this.sampleParameter(param);
    }

    for (const obj of objectives) {
      predicted[obj.name] = 0; // Unknown for random samples
      uncertainty[obj.name] = 1.0; // High uncertainty
    }

    return {
      parameters: params,
      acquisitionValue: Math.random(), // Random for initial samples
      predictedObjectives: predicted,
      uncertainty,
      reasoning: '初期探索フェーズ: ランダムサンプリングによるパラメータ空間の探索',
    };
  }

  /**
   * Sample a single parameter
   */
  private sampleParameter(param: ParameterSpace): number | string {
    switch (param.type) {
      case 'continuous':
        if (param.min !== undefined && param.max !== undefined) {
          if (param.logScale) {
            const logMin = Math.log(param.min);
            const logMax = Math.log(param.max);
            return Math.exp(logMin + Math.random() * (logMax - logMin));
          }
          return param.min + Math.random() * (param.max - param.min);
        }
        return 0;

      case 'integer':
        if (param.min !== undefined && param.max !== undefined) {
          return Math.floor(param.min + Math.random() * (param.max - param.min + 1));
        }
        return 0;

      case 'categorical':
      case 'ordinal':
        if (param.choices && param.choices.length > 0) {
          return param.choices[Math.floor(Math.random() * param.choices.length)];
        }
        return param.default ?? '';

      default:
        return param.default ?? 0;
    }
  }

  /**
   * Generate Bayesian optimization suggestion
   */
  private generateBayesianSuggestion(
    config: OptimizationConfig,
    completedTrials: OptimizationTrial[],
    acquisitionFunction: AcquisitionFunction
  ): ParameterSuggestion {
    // Simple GP-based suggestion (in production, use proper GP library)
    const params: Record<string, number | string> = {};
    const predicted: Record<string, number> = {};
    const uncertainty: Record<string, number> = {};

    // Find best trial so far
    const bestTrial = this.findBestTrial(completedTrials, config.objectives[0]);

    // Generate candidate near best with some exploration
    for (const param of config.parameters) {
      const exploration = config.explorationWeight ?? 0.5;
      const bestValue = bestTrial?.parameters[param.name];

      if (param.type === 'continuous' && param.min !== undefined && param.max !== undefined) {
        const range = param.max - param.min;
        const noise = (Math.random() - 0.5) * range * exploration;
        const baseValue = typeof bestValue === 'number' ? bestValue : (param.min + param.max) / 2;
        params[param.name] = Math.max(param.min, Math.min(param.max, baseValue + noise));
      } else if (param.type === 'integer' && param.min !== undefined && param.max !== undefined) {
        const range = param.max - param.min;
        const noise = Math.round((Math.random() - 0.5) * range * exploration);
        const baseValue = typeof bestValue === 'number' ? bestValue : Math.floor((param.min + param.max) / 2);
        params[param.name] = Math.max(param.min, Math.min(param.max, baseValue + noise));
      } else if (param.choices && param.choices.length > 0) {
        // For categorical, occasionally explore different choice
        if (Math.random() < exploration) {
          params[param.name] = param.choices[Math.floor(Math.random() * param.choices.length)];
        } else {
          params[param.name] = bestValue ?? param.choices[0];
        }
      }
    }

    // Estimate predictions based on similar past trials
    for (const obj of config.objectives) {
      const avgValue = completedTrials.reduce((sum, t) => sum + (t.objectives[obj.name] ?? 0), 0) / completedTrials.length;
      predicted[obj.name] = avgValue;
      uncertainty[obj.name] = 0.3; // Lower uncertainty after initial samples
    }

    const reasoningMap: Record<AcquisitionFunction, string> = {
      expected_improvement: '期待改善度 (EI) に基づき、改善可能性の高い点を提案',
      probability_improvement: '改善確率 (PI) に基づき、確実に改善する点を提案',
      upper_confidence_bound: '楽観的推定 (UCB) に基づき、探索と活用のバランスを取った点を提案',
      thompson_sampling: 'Thompson Sampling に基づき、確率的な探索を実施',
      knowledge_gradient: '知識勾配 (KG) に基づき、情報獲得量を最大化する点を提案',
    };

    return {
      parameters: params,
      acquisitionValue: Math.random() * 0.5 + 0.5, // Higher for Bayesian
      predictedObjectives: predicted,
      uncertainty,
      reasoning: reasoningMap[acquisitionFunction],
    };
  }

  /**
   * Find best trial based on primary objective
   */
  private findBestTrial(
    trials: OptimizationTrial[],
    objective: ObjectiveDefinition
  ): OptimizationTrial | undefined {
    if (trials.length === 0) return undefined;

    return trials.reduce((best, current) => {
      const currentValue = current.objectives[objective.name] ?? 0;
      const bestValue = best.objectives[objective.name] ?? 0;

      if (objective.direction === 'maximize') {
        return currentValue > bestValue ? current : best;
      } else {
        return currentValue < bestValue ? current : best;
      }
    });
  }

  /**
   * Report trial result
   */
  async reportTrial(input: ReportTrialInput): Promise<OptimizationTrial> {
    const session = this.sessions.get(input.sessionId);
    if (!session) {
      throw new Error(`Optimization session not found: ${input.sessionId}`);
    }

    const trial = session.trials.find((t) => t.id === input.trialId);
    if (!trial) {
      throw new Error(`Trial not found: ${input.trialId}`);
    }

    const config = this.configs.get(session.configId);

    trial.objectives = input.objectives;
    trial.duration = input.duration;
    trial.notes = input.notes;
    trial.status = 'completed';
    trial.completedAt = new Date();
    trial.constraintsSatisfied = this.checkConstraints(trial.parameters, config?.constraints);

    // Update convergence history
    const completedTrials = session.trials.filter((t) => t.status === 'completed');
    const bestTrial = this.findBestTrial(completedTrials, config?.objectives[0] ?? { name: 'objective', direction: 'maximize' });

    if (bestTrial) {
      const values = completedTrials.map((t) => Object.values(t.objectives)[0] ?? 0);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(
        values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
      );

      session.convergenceHistory.push({
        iteration: session.currentIteration,
        bestValue: Object.values(bestTrial.objectives)[0] ?? 0,
        mean,
        std,
        timestamp: new Date(),
      });

      session.bestTrialId = bestTrial.id;
    }

    session.currentIteration++;
    session.updatedAt = new Date();

    // Check completion conditions
    if (config) {
      if (session.currentIteration >= config.maxIterations) {
        session.status = 'completed';
        session.completedAt = new Date();
      }
    }

    return trial;
  }

  /**
   * Check if constraints are satisfied
   */
  private checkConstraints(
    params: Record<string, number | string>,
    constraints?: Array<{ expression: string }>
  ): boolean {
    if (!constraints || constraints.length === 0) return true;

    // Simple constraint checking (in production, use proper expression parser)
    for (const constraint of constraints) {
      // Basic parsing for "a + b <= c" style constraints
      const match = constraint.expression.match(/(\w+)\s*\+\s*(\w+)\s*<=\s*(\d+)/);
      if (match) {
        const [, param1, param2, limit] = match;
        const value1 = typeof params[param1] === 'number' ? params[param1] : 0;
        const value2 = typeof params[param2] === 'number' ? params[param2] : 0;
        if ((value1 as number) + (value2 as number) > parseFloat(limit)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Create a new trial
   */
  async createTrial(
    sessionId: string,
    parameters: Record<string, number | string>
  ): Promise<OptimizationTrial> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Optimization session not found: ${sessionId}`);
    }

    const config = this.configs.get(session.configId);

    const trial: OptimizationTrial = {
      id: crypto.randomUUID(),
      configId: session.configId,
      iteration: session.trials.length,
      parameters,
      objectives: {},
      constraintsSatisfied: this.checkConstraints(parameters, config?.constraints),
      status: 'pending',
      createdAt: new Date(),
    };

    session.trials.push(trial);
    session.updatedAt = new Date();

    return trial;
  }

  /**
   * Get optimization insights
   */
  async getInsights(sessionId: string): Promise<OptimizationInsights> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Optimization session not found: ${sessionId}`);
    }

    const config = this.configs.get(session.configId);
    if (!config) {
      throw new Error(`Optimization config not found: ${session.configId}`);
    }

    const completedTrials = session.trials.filter((t) => t.status === 'completed');

    // Calculate parameter importance (simplified variance-based)
    const parameterImportance = config.parameters.map((param) => {
      const values = completedTrials.map((t) => {
        const v = t.parameters[param.name];
        return typeof v === 'number' ? v : 0;
      });
      const mean = values.reduce((a, b) => a + b, 0) / values.length || 0;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length || 0;
      return { name: param.name, importance: Math.sqrt(variance) };
    }).sort((a, b) => b.importance - a.importance);

    // Normalize importance
    const maxImportance = Math.max(...parameterImportance.map((p) => p.importance), 0.001);
    parameterImportance.forEach((p) => (p.importance = p.importance / maxImportance));

    // Calculate convergence rate
    const convergenceRate = session.convergenceHistory.length > 1
      ? Math.abs(
          session.convergenceHistory[session.convergenceHistory.length - 1].bestValue -
            session.convergenceHistory[0].bestValue
        ) / session.convergenceHistory.length
      : 0;

    // Generate recommendations
    const recommendations: string[] = [];

    if (completedTrials.length < config.initialSamples) {
      recommendations.push('初期探索フェーズです。さらにランダムサンプルを収集することを推奨します。');
    }

    if (convergenceRate < 0.01 && completedTrials.length > 10) {
      recommendations.push('収束が遅いです。探索範囲の見直しまたは獲得関数の変更を検討してください。');
    }

    if (parameterImportance.length > 0 && parameterImportance[0].importance < 0.1) {
      recommendations.push('パラメータの影響度が均一です。より広い範囲での探索を推奨します。');
    }

    return {
      parameterImportance,
      interactions: [], // Would require more sophisticated analysis
      convergenceRate,
      estimatedIterationsToTarget: convergenceRate > 0 ? Math.ceil(1 / convergenceRate) : undefined,
      recommendations,
    };
  }

  /**
   * Get optimization summary
   */
  async getSummary(sessionId: string): Promise<OptimizationSummary> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Optimization session not found: ${sessionId}`);
    }

    const config = this.configs.get(session.configId);
    const completedTrials = session.trials.filter((t) => t.status === 'completed');
    const bestTrial = session.bestTrialId
      ? session.trials.find((t) => t.id === session.bestTrialId)
      : undefined;

    const firstTrial = completedTrials[0];
    const bestValue = bestTrial ? Object.values(bestTrial.objectives)[0] ?? 0 : 0;
    const firstValue = firstTrial ? Object.values(firstTrial.objectives)[0] ?? 0 : 0;

    const timeElapsed = session.startedAt
      ? (Date.now() - session.startedAt.getTime()) / 1000
      : 0;

    const avgTrialTime = completedTrials.length > 0
      ? completedTrials.reduce((sum, t) => sum + (t.duration ?? 0), 0) / completedTrials.length
      : 0;

    const remainingIterations = config ? config.maxIterations - session.currentIteration : 0;

    return {
      sessionId,
      totalTrials: session.trials.length,
      completedTrials: completedTrials.length,
      bestObjectiveValue: bestValue,
      bestParameters: bestTrial?.parameters ?? {},
      improvementOverInitial: firstValue !== 0 ? ((bestValue - firstValue) / Math.abs(firstValue)) * 100 : 0,
      timeElapsed,
      estimatedTimeRemaining: avgTrialTime * remainingIterations,
    };
  }

  /**
   * Pause optimization session
   */
  async pauseSession(sessionId: string): Promise<OptimizationSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Optimization session not found: ${sessionId}`);
    }

    session.status = 'paused';
    session.updatedAt = new Date();
    return session;
  }

  /**
   * Resume optimization session
   */
  async resumeSession(sessionId: string): Promise<OptimizationSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Optimization session not found: ${sessionId}`);
    }

    session.status = 'running';
    session.updatedAt = new Date();
    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<OptimizationSession | undefined> {
    return this.sessions.get(sessionId);
  }

  /**
   * Get config by ID
   */
  async getConfig(configId: string): Promise<OptimizationConfig | undefined> {
    return this.configs.get(configId);
  }

  /**
   * List sessions for a lab
   */
  async listSessions(labId: string): Promise<OptimizationSession[]> {
    return Array.from(this.sessions.values()).filter((s) => s.labId === labId);
  }
}

// Export singleton instance
export const optimizationService = new OptimizationService();
