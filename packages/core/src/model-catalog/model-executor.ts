/**
 * Model Executor
 *
 * MODL-EXEC-001: No-code execution interface
 * MODL-EXEC-002: Required parameters
 * MODL-EXEC-003: Default values
 * MODL-EXEC-004: Japanese descriptions
 * MODL-EXEC-005: Validation
 * MODL-EXEC-006: Background execution
 * MODL-EXEC-007: Results
 */

import { v4 as uuid } from 'uuid';

/**
 * Parameter types
 */
export type ParameterType = 'string' | 'number' | 'boolean' | 'array' | 'object';

/**
 * Parameter category
 */
export type ParameterCategory = 'basic' | 'advanced';

/**
 * Parameter specification (MODL-EXEC-002, MODL-EXEC-003, MODL-EXEC-004)
 */
export interface ParameterSpec {
  name: string;
  type: ParameterType;
  required: boolean;
  descriptionJa: string;
  tooltip: string;
  category: ParameterCategory;
  defaultValue?: unknown;
  min?: number;
  max?: number;
  enum?: string[];
}

/**
 * Execution configuration
 */
export interface ExecutionConfig {
  modelId: string;
  parameters: ParameterSpec[];
}

/**
 * Execution status
 */
export enum ExecutionStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

/**
 * Validation error types
 */
export type ValidationErrorType = 'required' | 'type' | 'range' | 'enum';

/**
 * Validation error
 */
export interface ValidationError {
  parameter: string;
  type: ValidationErrorType;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Execution options
 */
export interface ExecutionOptions {
  onProgress?: (progress: number) => void;
}

/**
 * Execution handle
 */
export interface ExecutionHandle {
  id: string;
  status: ExecutionStatus;
  wait: () => Promise<void>;
}

/**
 * Execution result (MODL-EXEC-007)
 */
export interface ExecutionResult {
  id: string;
  modelId: string;
  status: ExecutionStatus;
  summary: string;
  detailsUrl: string;
  startedAt: Date;
  completedAt: Date;
  duration: number;
  outputs?: Record<string, unknown>;
}

/**
 * Model parameter definitions
 */
const MODEL_PARAMETERS: Record<string, ParameterSpec[]> = {
  mattergen: [
    {
      name: 'chemicalSystem',
      type: 'string',
      required: true,
      descriptionJa: '化学組成（元素記号をハイフンで区切る）',
      tooltip: 'Example: Li-Fe-O, Si-C',
      category: 'basic',
    },
    {
      name: 'numSamples',
      type: 'number',
      required: false,
      descriptionJa: '生成する構造の数',
      tooltip: '1-1000の範囲で指定',
      category: 'basic',
      defaultValue: 100,
      min: 1,
      max: 1000,
    },
    {
      name: 'spaceGroup',
      type: 'number',
      required: false,
      descriptionJa: '空間群番号（1-230）',
      tooltip: '省略した場合は自動選択',
      category: 'advanced',
      defaultValue: null,
      min: 1,
      max: 230,
    },
    {
      name: 'bandgap',
      type: 'string',
      required: false,
      descriptionJa: 'バンドギャップ条件（eV）',
      tooltip: '例: ">2.0", "1.0-3.0"',
      category: 'advanced',
      defaultValue: null,
    },
    {
      name: 'bulkModulus',
      type: 'string',
      required: false,
      descriptionJa: '体積弾性率条件（GPa）',
      tooltip: '例: ">200", "100-300"',
      category: 'advanced',
      defaultValue: null,
    },
  ],
  mattersim: [
    {
      name: 'structurePath',
      type: 'string',
      required: true,
      descriptionJa: '入力構造ファイルのパス',
      tooltip: 'CIFまたはPOSCARファイル',
      category: 'basic',
    },
    {
      name: 'task',
      type: 'string',
      required: false,
      descriptionJa: '実行するタスク',
      tooltip: 'relax, predict, md',
      category: 'basic',
      defaultValue: 'predict',
      enum: ['relax', 'predict', 'md'],
    },
    {
      name: 'temperature',
      type: 'number',
      required: false,
      descriptionJa: '温度（K）',
      tooltip: 'MDシミュレーション用',
      category: 'advanced',
      defaultValue: 300,
      min: 0,
      max: 5000,
    },
  ],
  aurora: [
    {
      name: 'location',
      type: 'array',
      required: true,
      descriptionJa: '予測地点（緯度、経度）',
      tooltip: '例: [35.6762, 139.6503]',
      category: 'basic',
    },
    {
      name: 'forecastHours',
      type: 'number',
      required: false,
      descriptionJa: '予測時間（時間）',
      tooltip: '1-240時間',
      category: 'basic',
      defaultValue: 72,
      min: 1,
      max: 240,
    },
    {
      name: 'variables',
      type: 'array',
      required: false,
      descriptionJa: '予測変数',
      tooltip: '気温、気圧、風速、降水量など',
      category: 'advanced',
      defaultValue: ['temperature', 'precipitation'],
    },
  ],
  bioemu: [
    {
      name: 'sequence',
      type: 'string',
      required: true,
      descriptionJa: 'アミノ酸配列',
      tooltip: '1文字表記またはFASTA形式',
      category: 'basic',
    },
    {
      name: 'numEnsemble',
      type: 'number',
      required: false,
      descriptionJa: 'アンサンブル数',
      tooltip: '1-100の範囲',
      category: 'basic',
      defaultValue: 10,
      min: 1,
      max: 100,
    },
    {
      name: 'relaxStructure',
      type: 'boolean',
      required: false,
      descriptionJa: '構造緩和を実行',
      tooltip: '予測後に構造最適化を行う',
      category: 'advanced',
      defaultValue: false,
    },
  ],
  tamgen: [
    {
      name: 'targetPdb',
      type: 'string',
      required: true,
      descriptionJa: 'ターゲットPDBファイル',
      tooltip: 'PDB IDまたはファイルパス',
      category: 'basic',
    },
    {
      name: 'numSamples',
      type: 'number',
      required: false,
      descriptionJa: '生成する分子数',
      tooltip: '10-1000の範囲',
      category: 'basic',
      defaultValue: 100,
      min: 10,
      max: 1000,
    },
    {
      name: 'molecularWeightRange',
      type: 'array',
      required: false,
      descriptionJa: '分子量範囲',
      tooltip: '例: [200, 500]',
      category: 'advanced',
      defaultValue: [200, 500],
    },
    {
      name: 'logpRange',
      type: 'array',
      required: false,
      descriptionJa: 'logP範囲',
      tooltip: '例: [-1, 5]',
      category: 'advanced',
      defaultValue: [-1, 5],
    },
  ],
};

/**
 * Execution store
 */
interface ExecutionState {
  id: string;
  modelId: string;
  parameters: Record<string, unknown>;
  status: ExecutionStatus;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  result?: ExecutionResult;
}

/**
 * Model Executor class
 */
export class ModelExecutor {
  private executions: Map<string, ExecutionState> = new Map();

  /**
   * Get execution configuration (MODL-EXEC-001)
   */
  getExecutionConfig(modelId: string): ExecutionConfig {
    const params = MODEL_PARAMETERS[modelId.toLowerCase()];
    if (!params) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    return {
      modelId,
      parameters: params,
    };
  }

  /**
   * Validate parameters (MODL-EXEC-005)
   */
  validate(modelId: string, params: Record<string, unknown>): ValidationResult {
    const config = this.getExecutionConfig(modelId);
    const errors: ValidationError[] = [];

    for (const spec of config.parameters) {
      const value = params[spec.name];

      // Check required
      if (spec.required && (value === undefined || value === null || value === '')) {
        errors.push({
          parameter: spec.name,
          type: 'required',
          message: `${spec.name}は必須パラメータです`,
        });
        continue;
      }

      // Skip validation if value is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Check type
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== spec.type) {
        errors.push({
          parameter: spec.name,
          type: 'type',
          message: `${spec.name}は${spec.type}型である必要があります`,
        });
        continue;
      }

      // Check range for numbers
      if (spec.type === 'number' && typeof value === 'number') {
        if (spec.min !== undefined && value < spec.min) {
          errors.push({
            parameter: spec.name,
            type: 'range',
            message: `${spec.name}は${spec.min}以上である必要があります`,
          });
        }
        if (spec.max !== undefined && value > spec.max) {
          errors.push({
            parameter: spec.name,
            type: 'range',
            message: `${spec.name}は${spec.max}以下である必要があります`,
          });
        }
      }

      // Check enum
      if (spec.enum && typeof value === 'string' && !spec.enum.includes(value)) {
        errors.push({
          parameter: spec.name,
          type: 'enum',
          message: `${spec.name}は${spec.enum.join(', ')}のいずれかである必要があります`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Execute model (MODL-EXEC-006)
   */
  async execute(
    modelId: string,
    params: Record<string, unknown>,
    options: ExecutionOptions = {}
  ): Promise<ExecutionHandle> {
    // Validate first
    const validation = this.validate(modelId, params);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors[0].message}`);
    }

    const id = uuid();
    const state: ExecutionState = {
      id,
      modelId,
      parameters: params,
      status: ExecutionStatus.Running,
      progress: 0,
      startedAt: new Date(),
    };

    this.executions.set(id, state);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      const current = this.executions.get(id);
      if (current && current.status === ExecutionStatus.Running) {
        current.progress = Math.min(current.progress + 20, 90);
        if (options.onProgress) {
          options.onProgress(current.progress);
        }
      }
    }, 50);

    // Create wait function
    const wait = (): Promise<void> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          clearInterval(progressInterval);
          const current = this.executions.get(id);
          if (current && current.status === ExecutionStatus.Running) {
            current.status = ExecutionStatus.Completed;
            current.progress = 100;
            current.completedAt = new Date();
            current.result = {
              id,
              modelId,
              status: ExecutionStatus.Completed,
              summary: `${modelId}の実行が完了しました`,
              detailsUrl: `/results/${id}`,
              startedAt: current.startedAt,
              completedAt: current.completedAt,
              duration: current.completedAt.getTime() - current.startedAt.getTime(),
            };
          }
          resolve();
        }, 100);
      });
    };

    return {
      id,
      status: ExecutionStatus.Running,
      wait,
    };
  }

  /**
   * Get execution status
   */
  getStatus(id: string): ExecutionStatus {
    const state = this.executions.get(id);
    return state?.status ?? ExecutionStatus.Failed;
  }

  /**
   * Cancel execution
   */
  cancel(id: string): void {
    const state = this.executions.get(id);
    if (state) {
      state.status = ExecutionStatus.Cancelled;
    }
  }

  /**
   * Get execution result (MODL-EXEC-007)
   */
  getResult(id: string): ExecutionResult | undefined {
    const state = this.executions.get(id);
    return state?.result;
  }
}

/**
 * Create model executor
 */
export function createModelExecutor(): ModelExecutor {
  return new ModelExecutor();
}
