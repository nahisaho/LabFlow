/**
 * Climate Science Service
 * 
 * Provides climate science workflow capabilities powered by Microsoft Aurora
 * and other climate modeling frameworks.
 */

import {
  ClimateWorkflow,
  ClimateWorkflowType,
  ClimateWorkflowStatus,
  ClimateWorkflowListOptions,
  WeatherPredictionConfig,
  WeatherPrediction,
  ClimateProjectionConfig,
  ClimateProjection,
  ExtremeEventConfig,
  ExtremeEventAnalysis,
  ExtremeEvent,
  ImpactAssessmentConfig,
  ImpactAssessment,
  SectorImpact,
  ClimateVariable,
  ClimateVariableType,
  EmissionScenario,
  ExtremeEventType,
  ImpactSector,
  CreateWeatherPredictionInput,
  CreateClimateProjectionInput,
  CreateExtremeEventAnalysisInput,
  CreateImpactAssessmentInput,
} from './types';

// ============================================================================
// Climate Variable Definitions
// ============================================================================

const CLIMATE_VARIABLES: Record<ClimateVariableType, ClimateVariable> = {
  temperature: {
    type: 'temperature',
    unit: '°C',
    description: '2m地上気温',
    range: { min: -90, max: 60 },
  },
  precipitation: {
    type: 'precipitation',
    unit: 'mm',
    description: '降水量',
    range: { min: 0, max: 500 },
  },
  humidity: {
    type: 'humidity',
    unit: '%',
    description: '相対湿度',
    range: { min: 0, max: 100 },
  },
  wind_speed: {
    type: 'wind_speed',
    unit: 'm/s',
    description: '風速',
    range: { min: 0, max: 150 },
  },
  wind_direction: {
    type: 'wind_direction',
    unit: '°',
    description: '風向',
    range: { min: 0, max: 360 },
  },
  pressure: {
    type: 'pressure',
    unit: 'hPa',
    description: '気圧',
    range: { min: 870, max: 1084 },
  },
  sea_level: {
    type: 'sea_level',
    unit: 'm',
    description: '海面水位',
  },
  ice_extent: {
    type: 'ice_extent',
    unit: 'km²',
    description: '海氷面積',
  },
  solar_radiation: {
    type: 'solar_radiation',
    unit: 'W/m²',
    description: '日射量',
    range: { min: 0, max: 1400 },
  },
  cloud_cover: {
    type: 'cloud_cover',
    unit: '%',
    description: '雲量',
    range: { min: 0, max: 100 },
  },
  co2_concentration: {
    type: 'co2_concentration',
    unit: 'ppm',
    description: 'CO2濃度',
    range: { min: 200, max: 1000 },
  },
  methane_concentration: {
    type: 'methane_concentration',
    unit: 'ppb',
    description: 'メタン濃度',
    range: { min: 700, max: 3000 },
  },
};

// ============================================================================
// Climate Science Service
// ============================================================================

export class ClimateService {
  private workflows: Map<string, ClimateWorkflow> = new Map();
  private nextId = 1;

  /**
   * Get available climate variables
   */
  getClimateVariables(): ClimateVariable[] {
    return Object.values(CLIMATE_VARIABLES);
  }

  /**
   * Get emission scenarios with descriptions
   */
  getEmissionScenarios(): Array<{ id: EmissionScenario; name: string; description: string }> {
    return [
      {
        id: 'ssp1-1.9',
        name: '非常に低排出（SSP1-1.9）',
        description: '持続可能な発展、2050年ネットゼロ達成、1.5°C目標',
      },
      {
        id: 'ssp1-2.6',
        name: '低排出（SSP1-2.6）',
        description: '持続可能な発展、2°C目標達成可能',
      },
      {
        id: 'ssp2-4.5',
        name: '中間排出（SSP2-4.5）',
        description: '現状維持シナリオ、2100年約2.7°C上昇',
      },
      {
        id: 'ssp3-7.0',
        name: '高排出（SSP3-7.0）',
        description: '地域分裂シナリオ、2100年約3.6°C上昇',
      },
      {
        id: 'ssp5-8.5',
        name: '非常に高排出（SSP5-8.5）',
        description: '化石燃料依存シナリオ、2100年約4.4°C上昇',
      },
    ];
  }

  /**
   * Get extreme event types with thresholds
   */
  getExtremeEventTypes(): Array<{ type: ExtremeEventType; name: string; defaultThreshold: string }> {
    return [
      { type: 'heatwave', name: '熱波', defaultThreshold: '35°C以上が3日以上継続' },
      { type: 'drought', name: '干ばつ', defaultThreshold: 'SPI < -2.0' },
      { type: 'flood', name: '洪水', defaultThreshold: '100mm/日以上の降水' },
      { type: 'hurricane', name: 'ハリケーン', defaultThreshold: 'カテゴリー1以上' },
      { type: 'tornado', name: '竜巻', defaultThreshold: 'EF1以上' },
      { type: 'wildfire', name: '山火事', defaultThreshold: 'FWI > 30' },
      { type: 'cold_snap', name: '寒波', defaultThreshold: '-10°C以下が3日以上継続' },
      { type: 'storm_surge', name: '高潮', defaultThreshold: '1m以上の潮位上昇' },
    ];
  }

  /**
   * Get impact sectors
   */
  getImpactSectors(): Array<{ sector: ImpactSector; name: string; description: string }> {
    return [
      { sector: 'agriculture', name: '農業', description: '作物生産、畜産、漁業への影響' },
      { sector: 'water_resources', name: '水資源', description: '水利用可能性、水質、洪水リスク' },
      { sector: 'energy', name: 'エネルギー', description: '発電、冷暖房需要、再エネ資源' },
      { sector: 'health', name: '健康', description: '熱中症、感染症、大気汚染関連疾患' },
      { sector: 'infrastructure', name: 'インフラ', description: '道路、建物、送電網の脆弱性' },
      { sector: 'ecosystems', name: '生態系', description: '生物多様性、生態系サービス' },
      { sector: 'coastal', name: '沿岸域', description: '海面上昇、浸食、高潮被害' },
      { sector: 'urban', name: '都市', description: 'ヒートアイランド、都市洪水、生活環境' },
    ];
  }

  // ============================================================================
  // Weather Prediction
  // ============================================================================

  /**
   * Create a weather prediction workflow
   */
  async createWeatherPrediction(input: CreateWeatherPredictionInput): Promise<ClimateWorkflow> {
    const id = `weather-${this.nextId++}`;
    const now = new Date();

    const workflow: ClimateWorkflow = {
      id,
      name: input.name,
      type: 'weather_prediction',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      config: input.config,
    };

    this.workflows.set(id, workflow);
    return workflow;
  }

  /**
   * Run weather prediction using Aurora
   */
  async runWeatherPrediction(workflowId: string): Promise<WeatherPrediction> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.type !== 'weather_prediction') {
      throw new Error(`Weather prediction workflow not found: ${workflowId}`);
    }

    // Update status to running
    workflow.status = 'running';
    workflow.progress = {
      currentStep: 'データ取得中',
      totalSteps: 4,
      completedSteps: 0,
    };
    workflow.updatedAt = new Date();

    const config = workflow.config as WeatherPredictionConfig;

    // Simulate prediction process
    await this.simulateDelay(1000);
    workflow.progress!.currentStep = 'モデル初期化中';
    workflow.progress!.completedSteps = 1;

    await this.simulateDelay(1500);
    workflow.progress!.currentStep = '予測計算中';
    workflow.progress!.completedSteps = 2;

    await this.simulateDelay(2000);
    workflow.progress!.currentStep = '結果後処理中';
    workflow.progress!.completedSteps = 3;

    // Generate mock predictions
    const predictions = this.generateMockWeatherPredictions(config);

    await this.simulateDelay(500);
    workflow.progress!.currentStep = '完了';
    workflow.progress!.completedSteps = 4;

    const result: WeatherPrediction = {
      id: `pred-${workflowId}`,
      config,
      createdAt: new Date(),
      predictions,
      uncertainty: this.generateUncertainty(config.variables),
      metadata: {
        modelVersion: config.model === 'aurora' ? 'aurora-v1.0' : `${config.model}-v1.0`,
        computeTime: 4000,
        dataSource: 'ERA5 Reanalysis',
      },
    };

    workflow.status = 'completed';
    workflow.results = result;
    workflow.updatedAt = new Date();

    return result;
  }

  // ============================================================================
  // Climate Projection
  // ============================================================================

  /**
   * Create a climate projection workflow
   */
  async createClimateProjection(input: CreateClimateProjectionInput): Promise<ClimateWorkflow> {
    const id = `projection-${this.nextId++}`;
    const now = new Date();

    const workflow: ClimateWorkflow = {
      id,
      name: input.name,
      type: 'climate_projection',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      config: input.config,
    };

    this.workflows.set(id, workflow);
    return workflow;
  }

  /**
   * Run climate projection
   */
  async runClimateProjection(workflowId: string): Promise<ClimateProjection> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.type !== 'climate_projection') {
      throw new Error(`Climate projection workflow not found: ${workflowId}`);
    }

    workflow.status = 'running';
    workflow.progress = {
      currentStep: 'ベースライン計算中',
      totalSteps: 5,
      completedSteps: 0,
    };
    workflow.updatedAt = new Date();

    const config = workflow.config as ClimateProjectionConfig;

    // Simulate projection process
    await this.simulateDelay(1000);
    workflow.progress!.currentStep = 'シナリオデータ取得中';
    workflow.progress!.completedSteps = 1;

    await this.simulateDelay(1500);
    workflow.progress!.currentStep = 'ダウンスケーリング中';
    workflow.progress!.completedSteps = 2;

    await this.simulateDelay(2000);
    workflow.progress!.currentStep = '将来予測計算中';
    workflow.progress!.completedSteps = 3;

    await this.simulateDelay(1000);
    workflow.progress!.currentStep = '不確実性評価中';
    workflow.progress!.completedSteps = 4;

    const projections = this.generateMockClimateProjections(config);

    await this.simulateDelay(500);
    workflow.progress!.currentStep = '完了';
    workflow.progress!.completedSteps = 5;

    const result: ClimateProjection = {
      id: `proj-${workflowId}`,
      config,
      createdAt: new Date(),
      baseline: this.generateBaseline(config.variables),
      projections,
      summary: this.generateProjectionSummary(projections, config.variables),
    };

    workflow.status = 'completed';
    workflow.results = result;
    workflow.updatedAt = new Date();

    return result;
  }

  // ============================================================================
  // Extreme Event Analysis
  // ============================================================================

  /**
   * Create an extreme event analysis workflow
   */
  async createExtremeEventAnalysis(input: CreateExtremeEventAnalysisInput): Promise<ClimateWorkflow> {
    const id = `extreme-${this.nextId++}`;
    const now = new Date();

    const workflow: ClimateWorkflow = {
      id,
      name: input.name,
      type: 'extreme_event_analysis',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      config: input.config,
    };

    this.workflows.set(id, workflow);
    return workflow;
  }

  /**
   * Run extreme event analysis
   */
  async runExtremeEventAnalysis(workflowId: string): Promise<ExtremeEventAnalysis> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.type !== 'extreme_event_analysis') {
      throw new Error(`Extreme event analysis workflow not found: ${workflowId}`);
    }

    workflow.status = 'running';
    workflow.progress = {
      currentStep: '過去データ分析中',
      totalSteps: 4,
      completedSteps: 0,
    };
    workflow.updatedAt = new Date();

    const config = workflow.config as ExtremeEventConfig;

    await this.simulateDelay(1000);
    workflow.progress!.currentStep = '閾値超過検出中';
    workflow.progress!.completedSteps = 1;

    await this.simulateDelay(1500);
    workflow.progress!.currentStep = 'イベント分類中';
    workflow.progress!.completedSteps = 2;

    await this.simulateDelay(1000);
    workflow.progress!.currentStep = '統計分析中';
    workflow.progress!.completedSteps = 3;

    const events = this.generateMockExtremeEvents(config);

    await this.simulateDelay(500);
    workflow.progress!.currentStep = '完了';
    workflow.progress!.completedSteps = 4;

    const result: ExtremeEventAnalysis = {
      id: `analysis-${workflowId}`,
      config,
      createdAt: new Date(),
      events,
      statistics: this.generateEventStatistics(events, config.eventTypes),
    };

    workflow.status = 'completed';
    workflow.results = result;
    workflow.updatedAt = new Date();

    return result;
  }

  // ============================================================================
  // Impact Assessment
  // ============================================================================

  /**
   * Create an impact assessment workflow
   */
  async createImpactAssessment(input: CreateImpactAssessmentInput): Promise<ClimateWorkflow> {
    const id = `impact-${this.nextId++}`;
    const now = new Date();

    const workflow: ClimateWorkflow = {
      id,
      name: input.name,
      type: 'impact_assessment',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      config: input.config,
    };

    this.workflows.set(id, workflow);
    return workflow;
  }

  /**
   * Run impact assessment
   */
  async runImpactAssessment(workflowId: string): Promise<ImpactAssessment> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.type !== 'impact_assessment') {
      throw new Error(`Impact assessment workflow not found: ${workflowId}`);
    }

    workflow.status = 'running';
    workflow.progress = {
      currentStep: '気候データ統合中',
      totalSteps: 5,
      completedSteps: 0,
    };
    workflow.updatedAt = new Date();

    const config = workflow.config as ImpactAssessmentConfig;

    await this.simulateDelay(1000);
    workflow.progress!.currentStep = '脆弱性評価中';
    workflow.progress!.completedSteps = 1;

    await this.simulateDelay(1500);
    workflow.progress!.currentStep = 'リスク分析中';
    workflow.progress!.completedSteps = 2;

    await this.simulateDelay(1500);
    workflow.progress!.currentStep = '適応策評価中';
    workflow.progress!.completedSteps = 3;

    await this.simulateDelay(1000);
    workflow.progress!.currentStep = 'レポート生成中';
    workflow.progress!.completedSteps = 4;

    const sectorImpacts = this.generateMockSectorImpacts(config.sectors);

    await this.simulateDelay(500);
    workflow.progress!.currentStep = '完了';
    workflow.progress!.completedSteps = 5;

    const result: ImpactAssessment = {
      id: `impact-${workflowId}`,
      config,
      createdAt: new Date(),
      sectorImpacts,
      overallRiskScore: Math.round(
        sectorImpacts.reduce((sum, s) => sum + s.vulnerabilityScore, 0) / sectorImpacts.length
      ),
      priorityActions: this.generatePriorityActions(sectorImpacts),
    };

    workflow.status = 'completed';
    workflow.results = result;
    workflow.updatedAt = new Date();

    return result;
  }

  // ============================================================================
  // Workflow Management
  // ============================================================================

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<ClimateWorkflow | undefined> {
    return this.workflows.get(workflowId);
  }

  /**
   * List workflows
   */
  async listWorkflows(options?: ClimateWorkflowListOptions): Promise<ClimateWorkflow[]> {
    let workflows = Array.from(this.workflows.values());

    if (options?.type) {
      workflows = workflows.filter((w) => w.type === options.type);
    }

    if (options?.status) {
      workflows = workflows.filter((w) => w.status === options.status);
    }

    workflows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 20;

    return workflows.slice(offset, offset + limit);
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    this.workflows.delete(workflowId);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateMockWeatherPredictions(config: WeatherPredictionConfig) {
    const predictions = [];
    const { region, forecastHorizon } = config;
    const centerLat = (region.bounds.north + region.bounds.south) / 2;
    const centerLon = (region.bounds.east + region.bounds.west) / 2;

    for (let h = 0; h < forecastHorizon; h += 6) {
      const variables: Record<ClimateVariableType, number> = {} as Record<ClimateVariableType, number>;
      
      for (const v of config.variables) {
        const varDef = CLIMATE_VARIABLES[v];
        if (varDef.range) {
          const mid = (varDef.range.max + varDef.range.min) / 2;
          const range = varDef.range.max - varDef.range.min;
          variables[v] = mid + (Math.random() - 0.5) * range * 0.3;
        } else {
          variables[v] = Math.random() * 100;
        }
      }

      predictions.push({
        timestamp: new Date(Date.now() + h * 3600000),
        location: { lat: centerLat, lon: centerLon },
        variables,
        quality: 'predicted' as const,
      });
    }

    return predictions;
  }

  private generateUncertainty(variables: ClimateVariableType[]) {
    const mean: Record<ClimateVariableType, number> = {} as Record<ClimateVariableType, number>;
    const std: Record<ClimateVariableType, number> = {} as Record<ClimateVariableType, number>;
    const quantiles: Record<ClimateVariableType, Record<string, number>> = {} as Record<ClimateVariableType, Record<string, number>>;

    for (const v of variables) {
      const varDef = CLIMATE_VARIABLES[v];
      const baseValue = varDef.range ? (varDef.range.max + varDef.range.min) / 2 : 50;
      mean[v] = baseValue;
      std[v] = baseValue * 0.1;
      quantiles[v] = {
        '5': baseValue * 0.8,
        '25': baseValue * 0.9,
        '50': baseValue,
        '75': baseValue * 1.1,
        '95': baseValue * 1.2,
      };
    }

    return { mean, std, quantiles };
  }

  private generateBaseline(variables: ClimateVariableType[]) {
    const mean: Record<ClimateVariableType, number> = {} as Record<ClimateVariableType, number>;
    const std: Record<ClimateVariableType, number> = {} as Record<ClimateVariableType, number>;

    for (const v of variables) {
      const varDef = CLIMATE_VARIABLES[v];
      mean[v] = varDef.range ? (varDef.range.max + varDef.range.min) / 2 : 50;
      std[v] = mean[v] * 0.15;
    }

    return { mean, std };
  }

  private generateMockClimateProjections(config: ClimateProjectionConfig) {
    const projections = [];
    const startYear = config.timeRange.start.getFullYear();
    const endYear = config.timeRange.end.getFullYear();

    // Temperature change factors based on scenario
    const scenarioFactors: Record<EmissionScenario, number> = {
      'ssp1-1.9': 0.3,
      'ssp1-2.6': 0.5,
      'ssp2-4.5': 1.0,
      'ssp3-7.0': 1.5,
      'ssp5-8.5': 2.0,
    };

    const factor = scenarioFactors[config.scenario];

    for (let year = startYear; year <= endYear; year += 10) {
      const yearsSince2020 = Math.max(0, year - 2020);
      const change: Record<ClimateVariableType, number> = {} as Record<ClimateVariableType, number>;
      const confidence: Record<ClimateVariableType, { lower: number; upper: number }> = {} as Record<ClimateVariableType, { lower: number; upper: number }>;

      for (const v of config.variables) {
        let baseChange = 0;
        switch (v) {
          case 'temperature':
            baseChange = (yearsSince2020 / 80) * 4 * factor;
            break;
          case 'precipitation':
            baseChange = (yearsSince2020 / 80) * 20 * factor;
            break;
          case 'sea_level':
            baseChange = (yearsSince2020 / 80) * 0.5 * factor;
            break;
          default:
            baseChange = (yearsSince2020 / 80) * 10 * factor;
        }
        change[v] = baseChange;
        confidence[v] = {
          lower: baseChange * 0.7,
          upper: baseChange * 1.3,
        };
      }

      projections.push({ year, change, confidence });
    }

    return projections;
  }

  private generateProjectionSummary(
    projections: Array<{ year: number; change: Record<ClimateVariableType, number> }>,
    variables: ClimateVariableType[]
  ) {
    const lastProjection = projections[projections.length - 1];
    const totalChange: Record<ClimateVariableType, number> = {} as Record<ClimateVariableType, number>;
    const peakYear: Record<ClimateVariableType, number> = {} as Record<ClimateVariableType, number>;

    for (const v of variables) {
      totalChange[v] = lastProjection?.change[v] ?? 0;
      peakYear[v] = lastProjection?.year ?? 2100;
    }

    const tempChange = totalChange['temperature'] ?? 0;
    let riskLevel: 'low' | 'moderate' | 'high' | 'severe' = 'low';
    if (tempChange > 3) riskLevel = 'severe';
    else if (tempChange > 2) riskLevel = 'high';
    else if (tempChange > 1.5) riskLevel = 'moderate';

    return { totalChange, peakYear, riskLevel };
  }

  private generateMockExtremeEvents(config: ExtremeEventConfig): ExtremeEvent[] {
    const events: ExtremeEvent[] = [];
    const eventCount = Math.floor(Math.random() * 10) + 5;

    for (let i = 0; i < eventCount; i++) {
      const eventType = config.eventTypes[Math.floor(Math.random() * config.eventTypes.length)];
      const severities: Array<'minor' | 'moderate' | 'severe' | 'extreme'> = ['minor', 'moderate', 'severe', 'extreme'];

      events.push({
        id: `event-${i + 1}`,
        type: eventType,
        startDate: new Date(
          config.timeRange.start.getTime() +
            Math.random() * (config.timeRange.end.getTime() - config.timeRange.start.getTime())
        ),
        endDate: new Date(),
        location: config.region,
        severity: severities[Math.floor(Math.random() * severities.length)],
        metrics: {
          intensity: Math.random() * 100,
          duration: Math.floor(Math.random() * 168) + 24,
          affectedArea: Math.floor(Math.random() * 10000) + 100,
          returnPeriod: Math.floor(Math.random() * 100) + 1,
        },
      });
    }

    events[events.length - 1].endDate = new Date(events[events.length - 1].startDate.getTime() + events[events.length - 1].metrics.duration * 3600000);

    return events.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  private generateEventStatistics(events: ExtremeEvent[], eventTypes: ExtremeEventType[]) {
    const byType: Record<ExtremeEventType, number> = {} as Record<ExtremeEventType, number>;
    const bySeverity: Record<string, number> = {
      minor: 0,
      moderate: 0,
      severe: 0,
      extreme: 0,
    };

    for (const type of eventTypes) {
      byType[type] = 0;
    }

    for (const event of events) {
      byType[event.type] = (byType[event.type] || 0) + 1;
      bySeverity[event.severity]++;
    }

    return {
      totalEvents: events.length,
      byType,
      bySeverity,
      trends: {
        frequency: Math.random() > 0.5 ? 'increasing' as const : 'stable' as const,
        intensity: Math.random() > 0.6 ? 'increasing' as const : 'stable' as const,
      },
    };
  }

  private generateMockSectorImpacts(sectors: ImpactSector[]): SectorImpact[] {
    const sectorNames: Record<ImpactSector, string> = {
      agriculture: '農業',
      water_resources: '水資源',
      energy: 'エネルギー',
      health: '健康',
      infrastructure: 'インフラ',
      ecosystems: '生態系',
      coastal: '沿岸域',
      urban: '都市',
    };

    return sectors.map((sector) => ({
      sector,
      vulnerabilityScore: Math.floor(Math.random() * 40) + 30,
      risks: [
        {
          description: `${sectorNames[sector]}における気温上昇の影響`,
          likelihood: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
          impact: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
          timeframe: (['near-term', 'mid-term', 'long-term'] as const)[Math.floor(Math.random() * 3)],
        },
        {
          description: `${sectorNames[sector]}における極端現象の増加`,
          likelihood: 'medium' as const,
          impact: 'high' as const,
          timeframe: 'mid-term' as const,
        },
      ],
      opportunities: [
        {
          description: `適応策による${sectorNames[sector]}の強化`,
          potential: 'medium' as const,
        },
      ],
      adaptationRecommendations: [
        {
          measure: `${sectorNames[sector]}の気候変動適応計画策定`,
          effectiveness: 'high' as const,
          cost: 'medium' as const,
          urgency: 'high' as const,
        },
        {
          measure: 'モニタリングシステムの強化',
          effectiveness: 'medium' as const,
          cost: 'low' as const,
          urgency: 'medium' as const,
        },
      ],
    }));
  }

  private generatePriorityActions(sectorImpacts: SectorImpact[]): string[] {
    const actions: string[] = [];

    // Sort by vulnerability score
    const sorted = [...sectorImpacts].sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);

    // Take top 3 priority actions
    for (let i = 0; i < Math.min(3, sorted.length); i++) {
      const sector = sorted[i];
      if (sector.adaptationRecommendations.length > 0) {
        actions.push(sector.adaptationRecommendations[0].measure);
      }
    }

    return actions;
  }
}

// Export singleton instance
export const climateService = new ClimateService();
