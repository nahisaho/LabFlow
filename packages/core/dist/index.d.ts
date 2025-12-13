export { AccountLockedError, AuthCredentials, AuthError, AuthProvider, AuthProviderFactory, AuthProviderType, AuthResult, AuthService, AuthUser, EntraCredentials, EntraIDProvider, EntraProviderConfig, InvalidCredentialsError, InvalidTokenError, LocalAuthProvider, LocalCredentials, LocalProviderConfig, ProviderConfig, ProviderNotConfiguredError, SessionExpiredError, ShibbolethCredentials, ShibbolethProvider, ShibbolethProviderConfig, UserNotFoundError, UserRole } from './auth/index.js';
export { a as ExecutionResult, E as ExecutionStatus, R as ResearchDomain, d as StepConfigSchema, b as StepDefinition, S as StepStatus, c as WorkflowMetadata, W as WorkflowStatus } from './types-BA_TAtBg.js';
export { E as Execution, S as Step, W as Workflow } from './execution-4ksSPIae.js';
export { Artifact, DataConnector, LabFlowPlugin, PluginCache, PluginContext, PluginDomain, PluginEventEmitter, PluginLoader, PluginLogger, PluginManager, PluginMetadata, PluginRegistry, PluginServices, PluginStatus, StepExecutionContext, StepExecutionResult, UIExtension, UIExtensionType, ValidationResult, VisualizationComponent, WorkflowStepDefinition } from './plugin/index.js';
export { C as ChunkMetadata, m as DocumentMetadata, D as DocumentProcessor, k as DocumentType, t as EmbeddingConfig, K as KnowledgeBase, u as KnowledgeBaseConfig, l as KnowledgeDocument, n as KnowledgeDocumentChunk, P as ProcessingStatus, p as QueryOptions, q as RAGContext, R as RAGService, o as SearchResult, j as VectorStoreConfig } from './vector-store-DgwsaGJD.js';
export { DbConnection, Document, DocumentChunk, DocumentTypeEnum, ExecutionArtifact, ExecutionStatusType, NewDocument, NewDocumentChunk, NewExecution, NewExecutionArtifact, NewPlugin, NewPluginDependency, NewSession, NewStepExecution, NewUser, NewWorkflow, NewWorkflowCollaborator, Plugin, PluginDependency, PluginStatusType, ProcessingStatusEnum, ResearchDomainType, Session, StepExecution, StepStatusType, User, WorkflowCollaborator, WorkflowStatusType, WorkflowStepData, authProviders, createDbConnection, documentChunks, documentChunksRelations, documentTypes, documents, documentsRelations, executionArtifacts, executionArtifactsRelations, executionStatuses, executions, executionsRelations, getCurrentDb, getDb, initializeDb, pluginDependencies, pluginDependenciesRelations, pluginStatuses, plugins, pluginsRelations, processingStatuses, researchDomains, sessions, sessionsRelations, stepExecutions, stepExecutionsRelations, stepStatuses, userRoles, users, usersRelations, workflowCollaborators, workflowCollaboratorsRelations, workflowStatuses, workflows, workflowsRelations } from './db/index.js';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import 'drizzle-orm/postgres-js';

/**
 * Primary Screening (SCRN-PRI)
 * 1次スクリーニング - ルールベースのフィルタリング
 */
type FilterCondition = 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'between' | 'contains' | 'matches' | 'custom' | 'formula';
interface ScreeningFilter {
    id: string;
    name: string;
    field: string;
    condition: FilterCondition;
    value?: number | string | boolean;
    min?: number;
    max?: number;
    customFn?: (candidate: ScreeningCandidate$2) => boolean;
    formula?: string;
}
interface ScreeningCandidate$2 {
    id: string;
    data: Record<string, unknown>;
}
interface ExcludedCandidate {
    candidate: ScreeningCandidate$2;
    reasons: string[];
}
interface FilterStats {
    filterId: string;
    failedCount: number;
    passedCount: number;
}
interface ScreeningStatistics {
    inputCount: number;
    passedCount: number;
    excludedCount: number;
    passRate: number;
}
interface ScreeningResult {
    passed: ScreeningCandidate$2[];
    excluded: ExcludedCandidate[];
    statistics: ScreeningStatistics;
    filterStats: Record<string, FilterStats>;
}
interface FilterPreset {
    id: string;
    name: string;
    filters: ScreeningFilter[];
}
/**
 * Primary Screening - ルールベースのフィルタリング
 */
declare class PrimaryScreening {
    private filters;
    private presets;
    constructor();
    private initializeBuiltInPresets;
    addFilter(filter: ScreeningFilter): void;
    getFilters(): ScreeningFilter[];
    clearFilters(): void;
    isValidCondition(condition: string): boolean;
    private evaluateFilter;
    private evaluateFormula;
    apply(candidates: ScreeningCandidate$2[]): ScreeningResult;
    saveAsPreset(id: string, name: string): FilterPreset;
    loadPreset(preset: FilterPreset): void;
    getBuiltInPresets(): FilterPreset[];
}
/**
 * Drug Discovery用フィルタープリセット
 */
declare const DrugDiscoveryFilters: {
    molecularWeight(min: number, max: number): ScreeningFilter;
    logP(min: number, max: number): ScreeningFilter;
    tpsa(min: number, max: number): ScreeningFilter;
    rotatableBonds(min: number, max: number): ScreeningFilter;
    lipinskiRuleOfFive(): ScreeningFilter;
    veberRules(): ScreeningFilter;
};
/**
 * Materials Science用フィルタープリセット
 */
declare const MaterialsFilters: {
    elementConstraint(config: {
        required?: string[];
        excluded?: string[];
    }): ScreeningFilter;
    propertyRange(property: string, min: number, max: number): ScreeningFilter;
    similarityThreshold(threshold: number): ScreeningFilter;
    synthesizability(threshold: number): ScreeningFilter;
};

/**
 * AI Prediction Screening (SCRN-AI)
 * AI予測によるスクリーニング
 */
interface ScreeningCandidate$1 {
    id: string;
    data: Record<string, unknown>;
    priority?: 'low' | 'normal' | 'high';
}
type AIModelType = 'classification' | 'regression' | 'ranking';
interface AIModelConfig {
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
interface PredictionResult {
    candidateId: string;
    prediction: number;
    modelVersion: string;
    uncertainty?: UncertaintyEstimate;
    explanation?: PredictionExplanation;
    flaggedForReview?: boolean;
}
interface UncertaintyEstimate {
    value: number;
    level: 'high' | 'medium' | 'low';
}
interface FeatureContribution {
    name: string;
    contribution: number;
}
interface PredictionExplanation {
    topFeatures: FeatureContribution[];
    method: string;
}
interface EnsemblePredictionResult extends PredictionResult {
    modelDisagreement?: number;
    individualPredictions?: Record<string, number>;
}
interface AIScreeningResult {
    passed: ScreeningCandidate$1[];
    excluded: ScreeningCandidate$1[];
}
interface BatchPredictionOptions {
    batchSize?: number;
    parallel?: boolean;
    maxConcurrency?: number;
    onProgress?: (progress: number) => void;
}
interface EnsembleOptions {
    aggregation: 'mean' | 'median' | 'weighted';
    weights?: Record<string, number>;
    calculateDisagreement?: boolean;
}
/**
 * AI Prediction Screening
 */
declare class AIScreening {
    private models;
    private mockPredictions;
    private mockUncertaintyPredictions;
    private mockExplanationPredictions;
    addModel(config: AIModelConfig): Promise<void>;
    getModels(): AIModelConfig[];
    getModel(id: string): AIModelConfig | undefined;
    getSupportedModelTypes(): AIModelType[];
    setMockPredictions(predictions: Record<string, number>, modelId?: string): void;
    setMockPredictionsWithUncertainty(predictions: Record<string, {
        prediction: number;
        uncertainty: number;
    }>, modelId?: string): void;
    setMockPredictionsWithExplanations(predictions: Record<string, {
        prediction: number;
        explanation: PredictionExplanation;
    }>, modelId?: string): void;
    private getMockPrediction;
    predict(modelId: string, candidates: ScreeningCandidate$1[]): Promise<PredictionResult[]>;
    screen(modelId: string, candidates: ScreeningCandidate$1[]): Promise<AIScreeningResult>;
    rank(modelId: string, candidates: ScreeningCandidate$1[]): Promise<PredictionResult[]>;
    predictWithUncertainty(modelId: string, candidates: ScreeningCandidate$1[]): Promise<PredictionResult[]>;
    predictWithExplanation(modelId: string, candidates: ScreeningCandidate$1[]): Promise<PredictionResult[]>;
    ensemblePredict(modelIds: string[], candidates: ScreeningCandidate$1[], options: EnsembleOptions): Promise<EnsemblePredictionResult[]>;
    batchPredict(modelId: string, candidates: ScreeningCandidate$1[], options?: BatchPredictionOptions): Promise<PredictionResult[]>;
}

/**
 * Simulation Screening (SCRN-SIM)
 * シミュレーションによるスクリーニング
 */
interface ScreeningCandidate {
    id: string;
    data: Record<string, unknown>;
    priority?: 'low' | 'normal' | 'high';
}
type SimulationType = 'docking' | 'molecular-dynamics' | 'fep' | 'dft' | 'phonon';
interface BindingSite {
    x: number;
    y: number;
    z: number;
    radius: number;
}
interface DockingConfig {
    type: 'docking';
    name: string;
    parameters: {
        targetPdb: string;
        bindingSite: BindingSite;
        exhaustiveness?: number;
        numModes?: number;
    };
}
interface MDConfig {
    type: 'molecular-dynamics';
    name: string;
    parameters: {
        duration: number;
        timestep: number;
        temperature?: number;
        ensemble?: 'NVT' | 'NPT';
    };
}
interface FEPConfig {
    type: 'fep';
    name: string;
    parameters: {
        reference: string;
        lambdaWindows?: number;
        equilibrationTime?: number;
        productionTime?: number;
    };
}
interface DFTConfig {
    type: 'dft';
    name: string;
    parameters: {
        functional: string;
        basisSet: string;
        dispersionCorrection?: string;
        convergence?: number;
    };
}
interface PhononConfig {
    type: 'phonon';
    name: string;
    parameters: {
        supercellSize: [number, number, number];
        meshDensity: number;
        temperatureRange?: {
            min: number;
            max: number;
            step: number;
        };
    };
}
type SimulationConfig = DockingConfig | MDConfig | FEPConfig | DFTConfig | PhononConfig;
interface SimulationResultData {
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
interface SimulationResult {
    candidateId: string;
    type: SimulationType;
    result: SimulationResultData;
    timestamp: Date;
}
interface SimulationJob {
    id: string;
    candidateId: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    priority: 'low' | 'normal' | 'high';
    createdAt: Date;
    result?: SimulationResultData;
}
interface ScreeningOptions {
    scoreThreshold: number;
    scoreDirection: 'above' | 'below';
    scoreKey?: string;
}
interface SimulationScreeningResult {
    passed: ScreeningCandidate[];
    excluded: ScreeningCandidate[];
}
interface ResourceEstimate {
    cpuHours: number;
    gpuHours: number;
    estimatedWallTime: string;
}
interface ResourceLimits {
    maxConcurrentJobs?: number;
    maxCpuCores?: number;
    maxGpuCount?: number;
    maxMemoryGB?: number;
}
interface StabilityResult {
    isStable: boolean;
    confidenceScore: number;
}
interface AggregatedResults {
    count: number;
    scoreStats: {
        min: number;
        max: number;
        mean: number;
    };
}
interface StatisticsResult {
    score: {
        min: number;
        max: number;
        mean: number;
        percentile25: number;
        percentile75: number;
        standardDeviation: number;
    };
}
interface RankedCandidate {
    candidateId: string;
    score: number;
}
/**
 * Simulation Screening
 */
declare class SimulationScreening {
    private config;
    private mockResults;
    private jobs;
    private cache;
    private cachingEnabled;
    private resourceLimits;
    private simulationRunCallback?;
    private jobIdCounter;
    getSupportedTypes(): SimulationType[];
    setConfiguration(config: SimulationConfig): void;
    getConfiguration(): SimulationConfig | null;
    setMockResults(results: Record<string, SimulationResultData>): void;
    private getMockResult;
    runSimulations(candidates: ScreeningCandidate[]): Promise<SimulationResult[]>;
    screen(candidates: ScreeningCandidate[], options: ScreeningOptions): Promise<SimulationScreeningResult>;
    rankByScore(candidates: ScreeningCandidate[]): Promise<RankedCandidate[]>;
    calculateStability(result: SimulationResult): StabilityResult;
    queueJobs(candidates: ScreeningCandidate[]): Promise<SimulationJob[]>;
    getJobStatus(jobId: string): Promise<SimulationJob>;
    getQueue(): SimulationJob[];
    cancelJob(jobId: string): Promise<boolean>;
    getRunningJobs(): SimulationJob[];
    estimateResources(candidates: ScreeningCandidate[]): ResourceEstimate;
    setResourceLimits(limits: ResourceLimits): void;
    getResourceLimits(): ResourceLimits;
    enableCaching(enabled: boolean): void;
    getCachedResult(candidateId: string, type: SimulationType): SimulationResultData | undefined;
    private setCachedResult;
    onSimulationRun(callback: () => void): void;
    aggregateResults(results: SimulationResult[]): AggregatedResults;
    calculateStatistics(results: SimulationResult[]): StatisticsResult;
    selectTop(results: SimulationResult[], count: number): RankedCandidate[];
}

/**
 * Natural Language Interface Service
 *
 * DASH-NLI-001: Japanese and English input support
 * DASH-NLI-002: Intent analysis and workflow recommendation
 * DASH-NLI-003: Information extraction
 * DASH-NLI-004: Clarification questions
 * DASH-NLI-007: Input pattern recognition
 */
/**
 * Input patterns (DASH-NLI-007)
 */
declare enum InputPattern {
    Predict = "predict",
    Generate = "generate",
    Optimize = "optimize",
    Analyze = "analyze",
    Compare = "compare",
    Unknown = "unknown"
}
/**
 * Intent analysis result (DASH-NLI-002)
 */
interface IntentAnalysisResult {
    pattern: InputPattern;
    confidence: number;
    language: 'ja' | 'en';
    recommendedWorkflows: string[];
    needsClarification: boolean;
    clarificationQuestion?: string;
    clarificationOptions?: string[];
}
/**
 * Extracted information (DASH-NLI-003)
 */
interface ExtractedInfo {
    domain?: string;
    targetProperties?: string[];
    inputDataTypes?: string[];
    expectedOutputFormats?: string[];
    constraints?: Record<string, unknown>;
}
/**
 * NLI analysis options
 */
interface NLIOptions {
    language?: 'ja' | 'en';
}
/**
 * Detect language from input text (DASH-NLI-001)
 */
declare function detectLanguage(text: string): 'ja' | 'en';
/**
 * Extract intent pattern from text (DASH-NLI-007)
 */
declare function extractIntent(text: string): InputPattern;
/**
 * Natural Language Interface Service
 */
declare class NLIService {
    /**
     * Analyze intent from natural language input (DASH-NLI-002)
     */
    analyzeIntent(text: string, options?: NLIOptions): Promise<IntentAnalysisResult>;
    /**
     * Extract information from text (DASH-NLI-003)
     */
    extractInfo(text: string): Promise<ExtractedInfo>;
    /**
     * Detect research domain from text
     */
    private detectDomain;
    /**
     * Extract data formats from text
     */
    private extractDataFormats;
    /**
     * Extract target properties from text
     */
    private extractProperties;
    /**
     * Calculate confidence score
     */
    private calculateConfidence;
    /**
     * Count domain keywords in text
     */
    private countDomainKeywords;
    /**
     * Get workflow recommendations
     */
    private getWorkflowRecommendations;
}

/**
 * @labflow/core
 *
 * AI for Science ワークフロー実行エンジン
 * Library-First Architecture (Article I)
 */

declare const VERSION = "0.0.1";

export { type AIModelConfig, type AIModelType, AIScreening, type ScreeningCandidate$1 as AIScreeningCandidate, type AIScreeningResult, type AggregatedResults, type BatchPredictionOptions, type BindingSite, type DFTConfig, type DockingConfig, DrugDiscoveryFilters, type EnsembleOptions, type EnsemblePredictionResult, type ExcludedCandidate, type ExtractedInfo, type FEPConfig, type FeatureContribution, type FilterCondition, type FilterPreset, type FilterStats, InputPattern, type IntentAnalysisResult, type MDConfig, MaterialsFilters, type NLIOptions, NLIService, type PhononConfig, type PredictionExplanation, type PredictionResult, PrimaryScreening, type ScreeningCandidate$2 as PrimaryScreeningCandidate, type RankedCandidate, type ResourceEstimate, type ResourceLimits, type ScreeningFilter, type ScreeningOptions, type ScreeningResult, type ScreeningStatistics, type SimulationConfig, type SimulationJob, type SimulationResult, type SimulationResultData, SimulationScreening, type ScreeningCandidate as SimulationScreeningCandidate, type SimulationScreeningResult, type SimulationType, type StabilityResult, type StatisticsResult, type UncertaintyEstimate, VERSION, detectLanguage, extractIntent };
