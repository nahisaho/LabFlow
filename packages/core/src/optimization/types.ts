/**
 * Experiment Optimization Module - Types
 *
 * Requirements:
 * - EXP-OPT-001: Bayesian optimization for experiment planning
 * - EXP-OPT-002: Multi-objective optimization support
 * - EXP-OPT-003: Constraint handling
 */

/**
 * Parameter types for optimization
 */
export type ParameterType = 'continuous' | 'integer' | 'categorical' | 'ordinal';

/**
 * Optimization direction
 */
export type OptimizationDirection = 'minimize' | 'maximize';

/**
 * Acquisition function types for Bayesian optimization
 */
export type AcquisitionFunction =
  | 'expected_improvement' // EI: Balance exploration/exploitation
  | 'probability_improvement' // PI: Focus on probability of improvement
  | 'upper_confidence_bound' // UCB: Optimistic approach
  | 'thompson_sampling' // TS: Probabilistic exploration
  | 'knowledge_gradient'; // KG: Information gain focused

/**
 * Optimization status
 */
export type OptimizationStatus =
  | 'pending' // Not started
  | 'running' // Active optimization
  | 'paused' // Temporarily stopped
  | 'completed' // Target reached or budget exhausted
  | 'failed'; // Error occurred

/**
 * Parameter space definition
 */
export interface ParameterSpace {
  name: string;
  type: ParameterType;
  description?: string;
  // For continuous/integer
  min?: number;
  max?: number;
  // For categorical/ordinal
  choices?: (string | number)[];
  // Default value
  default?: string | number;
  // Log scale for continuous
  logScale?: boolean;
}

/**
 * Objective definition
 */
export interface ObjectiveDefinition {
  name: string;
  direction: OptimizationDirection;
  description?: string;
  // Target value (optimization stops when reached)
  target?: number;
  // Weight for multi-objective (0-1)
  weight?: number;
}

/**
 * Constraint definition
 */
export interface ConstraintDefinition {
  name: string;
  expression: string; // e.g., "param1 + param2 <= 100"
  type: 'linear' | 'nonlinear';
  description?: string;
}

/**
 * Optimization configuration
 */
export interface OptimizationConfig {
  id: string;
  name: string;
  description?: string;
  // Parameter space
  parameters: ParameterSpace[];
  // Objectives (can be multi-objective)
  objectives: ObjectiveDefinition[];
  // Constraints
  constraints?: ConstraintDefinition[];
  // Acquisition function
  acquisitionFunction: AcquisitionFunction;
  // Number of initial random samples
  initialSamples: number;
  // Maximum iterations/evaluations
  maxIterations: number;
  // Early stopping patience
  earlyStoppingPatience?: number;
  // Random seed for reproducibility
  seed?: number;
  // Batch size for parallel evaluation
  batchSize?: number;
  // Exploration/exploitation trade-off (0-1)
  explorationWeight?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Single trial/experiment
 */
export interface OptimizationTrial {
  id: string;
  configId: string;
  iteration: number;
  // Parameter values
  parameters: Record<string, number | string>;
  // Objective values
  objectives: Record<string, number>;
  // Constraint satisfaction
  constraintsSatisfied: boolean;
  // Trial status
  status: 'pending' | 'running' | 'completed' | 'failed';
  // Duration in seconds
  duration?: number;
  // Error message if failed
  error?: string;
  // User notes
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Optimization session/run
 */
export interface OptimizationSession {
  id: string;
  configId: string;
  labId: string;
  name: string;
  status: OptimizationStatus;
  // All trials
  trials: OptimizationTrial[];
  // Best trial so far
  bestTrialId?: string;
  // Current iteration
  currentIteration: number;
  // Convergence metrics
  convergenceHistory: ConvergencePoint[];
  createdById: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convergence tracking point
 */
export interface ConvergencePoint {
  iteration: number;
  bestValue: number;
  mean: number;
  std: number;
  timestamp: Date;
}

/**
 * Suggested next parameters
 */
export interface ParameterSuggestion {
  parameters: Record<string, number | string>;
  // Expected improvement / acquisition value
  acquisitionValue: number;
  // Predicted objective values
  predictedObjectives: Record<string, number>;
  // Uncertainty estimates
  uncertainty: Record<string, number>;
  // Reasoning for suggestion
  reasoning?: string;
}

/**
 * Optimization insights
 */
export interface OptimizationInsights {
  // Parameter importance ranking
  parameterImportance: Array<{ name: string; importance: number }>;
  // Parameter interactions
  interactions: Array<{
    params: [string, string];
    strength: number;
  }>;
  // Convergence analysis
  convergenceRate: number;
  estimatedIterationsToTarget?: number;
  // Recommendations
  recommendations: string[];
}

/**
 * Create optimization config input
 */
export interface CreateOptimizationInput {
  name: string;
  description?: string;
  parameters: ParameterSpace[];
  objectives: ObjectiveDefinition[];
  constraints?: ConstraintDefinition[];
  acquisitionFunction?: AcquisitionFunction;
  initialSamples?: number;
  maxIterations?: number;
  earlyStoppingPatience?: number;
  seed?: number;
  batchSize?: number;
  explorationWeight?: number;
}

/**
 * Report trial result input
 */
export interface ReportTrialInput {
  sessionId: string;
  trialId: string;
  objectives: Record<string, number>;
  duration?: number;
  notes?: string;
}

/**
 * Optimization summary
 */
export interface OptimizationSummary {
  sessionId: string;
  totalTrials: number;
  completedTrials: number;
  bestObjectiveValue: number;
  bestParameters: Record<string, number | string>;
  improvementOverInitial: number;
  timeElapsed: number;
  estimatedTimeRemaining?: number;
}
