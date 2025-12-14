/**
 * Climate Science Workflow Types
 * 
 * Provides type definitions for climate science workflows powered by Microsoft Aurora
 * and other climate modeling tools.
 */

// ============================================================================
// Climate Data Types
// ============================================================================

/**
 * Geographic region for climate analysis
 */
export interface GeographicRegion {
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  resolution?: {
    lat: number;
    lon: number;
  };
}

/**
 * Time range for climate analysis
 */
export interface TimeRange {
  start: Date;
  end: Date;
  resolution: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

/**
 * Climate variable types
 */
export type ClimateVariableType =
  | 'temperature'
  | 'precipitation'
  | 'humidity'
  | 'wind_speed'
  | 'wind_direction'
  | 'pressure'
  | 'sea_level'
  | 'ice_extent'
  | 'solar_radiation'
  | 'cloud_cover'
  | 'co2_concentration'
  | 'methane_concentration';

/**
 * Climate variable definition
 */
export interface ClimateVariable {
  type: ClimateVariableType;
  unit: string;
  description: string;
  range?: {
    min: number;
    max: number;
  };
}

/**
 * Climate data point
 */
export interface ClimateDataPoint {
  timestamp: Date;
  location: {
    lat: number;
    lon: number;
    elevation?: number;
  };
  variables: Record<ClimateVariableType, number>;
  quality?: 'observed' | 'interpolated' | 'predicted';
}

// ============================================================================
// Weather Prediction Types
// ============================================================================

/**
 * Weather prediction configuration
 */
export interface WeatherPredictionConfig {
  region: GeographicRegion;
  forecastHorizon: number; // hours
  variables: ClimateVariableType[];
  ensemble: boolean;
  ensembleMembers?: number;
  model: 'aurora' | 'graphcast' | 'pangu' | 'custom';
}

/**
 * Weather prediction result
 */
export interface WeatherPrediction {
  id: string;
  config: WeatherPredictionConfig;
  createdAt: Date;
  predictions: ClimateDataPoint[];
  uncertainty?: {
    mean: Record<ClimateVariableType, number>;
    std: Record<ClimateVariableType, number>;
    quantiles: Record<ClimateVariableType, Record<string, number>>;
  };
  metadata: {
    modelVersion: string;
    computeTime: number;
    dataSource: string;
  };
}

// ============================================================================
// Climate Scenario Types
// ============================================================================

/**
 * Emission scenario (IPCC-based)
 */
export type EmissionScenario =
  | 'ssp1-1.9'  // Very low emissions
  | 'ssp1-2.6'  // Low emissions
  | 'ssp2-4.5'  // Intermediate emissions
  | 'ssp3-7.0'  // High emissions
  | 'ssp5-8.5'; // Very high emissions

/**
 * Climate projection configuration
 */
export interface ClimateProjectionConfig {
  region: GeographicRegion;
  timeRange: TimeRange;
  scenario: EmissionScenario;
  variables: ClimateVariableType[];
  baselinePeriod: {
    start: number; // year
    end: number;
  };
}

/**
 * Climate projection result
 */
export interface ClimateProjection {
  id: string;
  config: ClimateProjectionConfig;
  createdAt: Date;
  baseline: {
    mean: Record<ClimateVariableType, number>;
    std: Record<ClimateVariableType, number>;
  };
  projections: Array<{
    year: number;
    change: Record<ClimateVariableType, number>;
    confidence: Record<ClimateVariableType, { lower: number; upper: number }>;
  }>;
  summary: {
    totalChange: Record<ClimateVariableType, number>;
    peakYear?: Record<ClimateVariableType, number>;
    riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  };
}

// ============================================================================
// Extreme Event Types
// ============================================================================

/**
 * Extreme event type
 */
export type ExtremeEventType =
  | 'heatwave'
  | 'drought'
  | 'flood'
  | 'hurricane'
  | 'tornado'
  | 'wildfire'
  | 'cold_snap'
  | 'storm_surge';

/**
 * Extreme event detection configuration
 */
export interface ExtremeEventConfig {
  region: GeographicRegion;
  timeRange: TimeRange;
  eventTypes: ExtremeEventType[];
  thresholds?: Partial<Record<ExtremeEventType, number>>;
  returnPeriod?: number; // years
}

/**
 * Detected extreme event
 */
export interface ExtremeEvent {
  id: string;
  type: ExtremeEventType;
  startDate: Date;
  endDate: Date;
  location: GeographicRegion;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  metrics: {
    intensity: number;
    duration: number; // hours
    affectedArea: number; // km²
    returnPeriod?: number; // years
  };
  impacts?: {
    populationAffected?: number;
    economicDamage?: number;
    environmentalImpact?: string;
  };
}

/**
 * Extreme event analysis result
 */
export interface ExtremeEventAnalysis {
  id: string;
  config: ExtremeEventConfig;
  createdAt: Date;
  events: ExtremeEvent[];
  statistics: {
    totalEvents: number;
    byType: Record<ExtremeEventType, number>;
    bySeverity: Record<string, number>;
    trends: {
      frequency: 'increasing' | 'decreasing' | 'stable';
      intensity: 'increasing' | 'decreasing' | 'stable';
    };
  };
}

// ============================================================================
// Impact Assessment Types
// ============================================================================

/**
 * Impact sector
 */
export type ImpactSector =
  | 'agriculture'
  | 'water_resources'
  | 'energy'
  | 'health'
  | 'infrastructure'
  | 'ecosystems'
  | 'coastal'
  | 'urban';

/**
 * Impact assessment configuration
 */
export interface ImpactAssessmentConfig {
  region: GeographicRegion;
  projection: ClimateProjection;
  sectors: ImpactSector[];
  adaptationMeasures?: string[];
}

/**
 * Sector impact result
 */
export interface SectorImpact {
  sector: ImpactSector;
  vulnerabilityScore: number; // 0-100
  risks: Array<{
    description: string;
    likelihood: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    timeframe: 'near-term' | 'mid-term' | 'long-term';
  }>;
  opportunities?: Array<{
    description: string;
    potential: 'low' | 'medium' | 'high';
  }>;
  adaptationRecommendations: Array<{
    measure: string;
    effectiveness: 'low' | 'medium' | 'high';
    cost: 'low' | 'medium' | 'high';
    urgency: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Impact assessment result
 */
export interface ImpactAssessment {
  id: string;
  config: ImpactAssessmentConfig;
  createdAt: Date;
  sectorImpacts: SectorImpact[];
  overallRiskScore: number;
  priorityActions: string[];
  reportUrl?: string;
}

// ============================================================================
// Workflow Types
// ============================================================================

/**
 * Climate workflow type
 */
export type ClimateWorkflowType =
  | 'weather_prediction'
  | 'climate_projection'
  | 'extreme_event_analysis'
  | 'impact_assessment'
  | 'custom';

/**
 * Climate workflow status
 */
export type ClimateWorkflowStatus =
  | 'draft'
  | 'validating'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Climate workflow definition
 */
export interface ClimateWorkflow {
  id: string;
  name: string;
  description?: string;
  type: ClimateWorkflowType;
  status: ClimateWorkflowStatus;
  createdAt: Date;
  updatedAt: Date;
  config: WeatherPredictionConfig | ClimateProjectionConfig | ExtremeEventConfig | ImpactAssessmentConfig;
  results?: WeatherPrediction | ClimateProjection | ExtremeEventAnalysis | ImpactAssessment;
  progress?: {
    currentStep: string;
    totalSteps: number;
    completedSteps: number;
    estimatedTimeRemaining?: number;
  };
}

// ============================================================================
// Service Input/Output Types
// ============================================================================

export interface CreateWeatherPredictionInput {
  name: string;
  config: WeatherPredictionConfig;
}

export interface CreateClimateProjectionInput {
  name: string;
  config: ClimateProjectionConfig;
}

export interface CreateExtremeEventAnalysisInput {
  name: string;
  config: ExtremeEventConfig;
}

export interface CreateImpactAssessmentInput {
  name: string;
  config: ImpactAssessmentConfig;
}

export interface ClimateWorkflowListOptions {
  type?: ClimateWorkflowType;
  status?: ClimateWorkflowStatus;
  limit?: number;
  offset?: number;
}
