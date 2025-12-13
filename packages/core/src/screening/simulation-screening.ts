/**
 * Simulation Screening (SCRN-SIM)
 * シミュレーションによるスクリーニング
 */

export interface ScreeningCandidate {
  id: string;
  data: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

export type SimulationType =
  | 'docking'
  | 'molecular-dynamics'
  | 'fep'
  | 'dft'
  | 'phonon';

export interface BindingSite {
  x: number;
  y: number;
  z: number;
  radius: number;
}

export interface DockingConfig {
  type: 'docking';
  name: string;
  parameters: {
    targetPdb: string;
    bindingSite: BindingSite;
    exhaustiveness?: number;
    numModes?: number;
  };
}

export interface MDConfig {
  type: 'molecular-dynamics';
  name: string;
  parameters: {
    duration: number; // ns
    timestep: number; // fs
    temperature?: number; // K
    ensemble?: 'NVT' | 'NPT';
  };
}

export interface FEPConfig {
  type: 'fep';
  name: string;
  parameters: {
    reference: string;
    lambdaWindows?: number;
    equilibrationTime?: number; // ns
    productionTime?: number; // ns
  };
}

export interface DFTConfig {
  type: 'dft';
  name: string;
  parameters: {
    functional: string;
    basisSet: string;
    dispersionCorrection?: string;
    convergence?: number;
  };
}

export interface PhononConfig {
  type: 'phonon';
  name: string;
  parameters: {
    supercellSize: [number, number, number];
    meshDensity: number;
    temperatureRange?: { min: number; max: number; step: number };
  };
}

export type SimulationConfig =
  | DockingConfig
  | MDConfig
  | FEPConfig
  | DFTConfig
  | PhononConfig;

export interface SimulationResultData {
  score?: number;
  poses?: number;
  rmsd?: number;
  rmsdMean?: number;
  rmsdStd?: number;
  bindingEnergyMean?: number;
  stableFrameRatio?: number;
  ddG?: number;
  ddG_error?: number;
  totalEnergy?: number;
  bandgap?: number;
  formationEnergy?: number;
  dielectricConstant?: number;
  isStable?: boolean;
  maxImaginaryFrequency?: number;
  thermalConductivity?: number;
  heatCapacity?: Record<string, number>;
}

export interface SimulationResult {
  candidateId: string;
  type: SimulationType;
  result: SimulationResultData;
  timestamp: Date;
}

export interface SimulationJob {
  id: string;
  candidateId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
  result?: SimulationResultData;
}

export interface ScreeningOptions {
  scoreThreshold: number;
  scoreDirection: 'above' | 'below';
  scoreKey?: string;
}

export interface SimulationScreeningResult {
  passed: ScreeningCandidate[];
  excluded: ScreeningCandidate[];
}

export interface ResourceEstimate {
  cpuHours: number;
  gpuHours: number;
  estimatedWallTime: string;
}

export interface ResourceLimits {
  maxConcurrentJobs?: number;
  maxCpuCores?: number;
  maxGpuCount?: number;
  maxMemoryGB?: number;
}

export interface StabilityResult {
  isStable: boolean;
  confidenceScore: number;
}

export interface AggregatedResults {
  count: number;
  scoreStats: {
    min: number;
    max: number;
    mean: number;
  };
}

export interface StatisticsResult {
  score: {
    min: number;
    max: number;
    mean: number;
    percentile25: number;
    percentile75: number;
    standardDeviation: number;
  };
}

export interface RankedCandidate {
  candidateId: string;
  score: number;
}

/**
 * Simulation Screening
 */
export class SimulationScreening {
  private config: SimulationConfig | null = null;
  private mockResults: Record<string, SimulationResultData> = {};
  private jobs: Map<string, SimulationJob> = new Map();
  private cache: Map<string, Map<string, SimulationResultData>> = new Map();
  private cachingEnabled = false;
  private resourceLimits: ResourceLimits = {};
  private simulationRunCallback?: () => void;
  private jobIdCounter = 0;

  getSupportedTypes(): SimulationType[] {
    return ['docking', 'molecular-dynamics', 'fep', 'dft', 'phonon'];
  }

  setConfiguration(config: SimulationConfig): void {
    // Validate configuration
    if (config.type === 'docking') {
      const params = config.parameters as DockingConfig['parameters'];
      if (!params.targetPdb) {
        throw new Error('Missing required parameter: targetPdb');
      }
    }

    this.config = config;
    // Invalidate cache on config change
    this.cache.clear();
  }

  getConfiguration(): SimulationConfig | null {
    return this.config;
  }

  setMockResults(results: Record<string, SimulationResultData>): void {
    this.mockResults = results;
  }

  private getMockResult(candidateId: string): SimulationResultData {
    return (
      this.mockResults[candidateId] ?? {
        score: -7.0,
      }
    );
  }

  async runSimulations(
    candidates: ScreeningCandidate[]
  ): Promise<SimulationResult[]> {
    if (!this.config) {
      throw new Error('No configuration set');
    }

    const results: SimulationResult[] = [];

    for (const candidate of candidates) {
      // Check cache first
      if (this.cachingEnabled) {
        const cachedResult = this.getCachedResult(candidate.id, this.config.type);
        if (cachedResult) {
          results.push({
            candidateId: candidate.id,
            type: this.config.type,
            result: cachedResult,
            timestamp: new Date(),
          });
          continue;
        }
      }

      // Run simulation (mock)
      if (this.simulationRunCallback) {
        this.simulationRunCallback();
      }

      const result = this.getMockResult(candidate.id);

      // Cache result
      if (this.cachingEnabled) {
        this.setCachedResult(candidate.id, this.config.type, result);
      }

      results.push({
        candidateId: candidate.id,
        type: this.config.type,
        result,
        timestamp: new Date(),
      });
    }

    return results;
  }

  async screen(
    candidates: ScreeningCandidate[],
    options: ScreeningOptions
  ): Promise<SimulationScreeningResult> {
    const results = await this.runSimulations(candidates);
    const passed: ScreeningCandidate[] = [];
    const excluded: ScreeningCandidate[] = [];

    const scoreKey = options.scoreKey ?? 'score';

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i]!;
      const result = results[i]!;
      const score = result.result[scoreKey as keyof SimulationResultData] as number;

      const passes =
        options.scoreDirection === 'below'
          ? score < options.scoreThreshold
          : score > options.scoreThreshold;

      if (passes) {
        passed.push(candidate);
      } else {
        excluded.push(candidate);
      }
    }

    return { passed, excluded };
  }

  async rankByScore(candidates: ScreeningCandidate[]): Promise<RankedCandidate[]> {
    const results = await this.runSimulations(candidates);

    return results
      .map((r) => ({
        candidateId: r.candidateId,
        score: r.result.score ?? 0,
      }))
      .sort((a, b) => a.score - b.score); // More negative is better for docking
  }

  calculateStability(result: SimulationResult): StabilityResult {
    const data = result.result;

    if (data.stableFrameRatio !== undefined) {
      return {
        isStable: data.stableFrameRatio > 0.8,
        confidenceScore: data.stableFrameRatio,
      };
    }

    if (data.isStable !== undefined) {
      return {
        isStable: data.isStable,
        confidenceScore: data.isStable ? 1.0 : 0.0,
      };
    }

    return {
      isStable: true,
      confidenceScore: 0.5,
    };
  }

  async queueJobs(candidates: ScreeningCandidate[]): Promise<SimulationJob[]> {
    const jobs: SimulationJob[] = [];

    for (const candidate of candidates) {
      const job: SimulationJob = {
        id: `job-${++this.jobIdCounter}`,
        candidateId: candidate.id,
        status: 'queued',
        priority: candidate.priority ?? 'normal',
        createdAt: new Date(),
      };

      this.jobs.set(job.id, job);
      jobs.push(job);
    }

    return jobs;
  }

  async getJobStatus(jobId: string): Promise<SimulationJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    return job;
  }

  getQueue(): SimulationJob[] {
    return Array.from(this.jobs.values())
      .filter((j) => j.status === 'queued')
      .sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    if (job.status === 'queued' || job.status === 'running') {
      job.status = 'cancelled';
      return true;
    }

    return false;
  }

  getRunningJobs(): SimulationJob[] {
    // In a real implementation, this would check actual running jobs
    // For now, return jobs that would be running based on resource limits
    const queue = this.getQueue();
    const maxConcurrent = this.resourceLimits.maxConcurrentJobs ?? 1;
    return queue.slice(0, maxConcurrent);
  }

  estimateResources(candidates: ScreeningCandidate[]): ResourceEstimate {
    if (!this.config) {
      return { cpuHours: 0, gpuHours: 0, estimatedWallTime: '0h' };
    }

    let cpuHoursPerJob = 1;
    let gpuHoursPerJob = 0;

    switch (this.config.type) {
      case 'docking':
        cpuHoursPerJob = 0.1;
        break;
      case 'molecular-dynamics':
        gpuHoursPerJob = 10;
        cpuHoursPerJob = 2;
        break;
      case 'fep':
        gpuHoursPerJob = 50;
        cpuHoursPerJob = 10;
        break;
      case 'dft':
        cpuHoursPerJob = 100;
        break;
      case 'phonon':
        cpuHoursPerJob = 200;
        break;
    }

    const totalCpuHours = cpuHoursPerJob * candidates.length;
    const totalGpuHours = gpuHoursPerJob * candidates.length;

    // Estimate wall time based on parallelism
    const parallelism = this.resourceLimits.maxConcurrentJobs ?? 1;
    const wallTimeHours = Math.ceil(totalCpuHours / parallelism);

    return {
      cpuHours: totalCpuHours,
      gpuHours: totalGpuHours,
      estimatedWallTime: `${wallTimeHours}h`,
    };
  }

  setResourceLimits(limits: ResourceLimits): void {
    this.resourceLimits = limits;
  }

  getResourceLimits(): ResourceLimits {
    return { ...this.resourceLimits };
  }

  enableCaching(enabled: boolean): void {
    this.cachingEnabled = enabled;
  }

  getCachedResult(
    candidateId: string,
    type: SimulationType
  ): SimulationResultData | undefined {
    return this.cache.get(type)?.get(candidateId);
  }

  private setCachedResult(
    candidateId: string,
    type: SimulationType,
    result: SimulationResultData
  ): void {
    if (!this.cache.has(type)) {
      this.cache.set(type, new Map());
    }
    this.cache.get(type)!.set(candidateId, result);
  }

  onSimulationRun(callback: () => void): void {
    this.simulationRunCallback = callback;
  }

  aggregateResults(results: SimulationResult[]): AggregatedResults {
    const scores = results
      .map((r) => r.result.score)
      .filter((s): s is number => s !== undefined);

    return {
      count: results.length,
      scoreStats: {
        min: Math.min(...scores),
        max: Math.max(...scores),
        mean: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      },
    };
  }

  calculateStatistics(results: SimulationResult[]): StatisticsResult {
    const scores = results
      .map((r) => r.result.score)
      .filter((s): s is number => s !== undefined)
      .sort((a, b) => a - b);

    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const squaredDiffs = scores.map((s) => Math.pow(s - mean, 2));
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    const percentile = (arr: number[], p: number) => {
      const index = (p / 100) * (arr.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      if (lower === upper) return arr[lower]!;
      return (arr[lower]! + arr[upper]!) / 2;
    };

    return {
      score: {
        min: scores[0]!,
        max: scores[scores.length - 1]!,
        mean,
        percentile25: percentile(scores, 25),
        percentile75: percentile(scores, 75),
        standardDeviation: stdDev,
      },
    };
  }

  selectTop(results: SimulationResult[], count: number): RankedCandidate[] {
    return results
      .map((r) => ({
        candidateId: r.candidateId,
        score: r.result.score ?? 0,
      }))
      .sort((a, b) => a.score - b.score) // More negative is better
      .slice(0, count);
  }
}
