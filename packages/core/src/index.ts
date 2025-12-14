/**
 * @labflow/core
 *
 * AI for Science ワークフロー実行エンジン
 * Library-First Architecture (Article I)
 */

// Auth Module - export only types to avoid conflicts
export {
  type AuthProvider,
  type AuthProviderType,
  type AuthUser,
  type AuthResult,
  type AuthCredentials,
  type LocalCredentials,
  type EntraCredentials,
  type ShibbolethCredentials,
  type ProviderConfig,
  type LocalProviderConfig,
  type EntraProviderConfig,
  type ShibbolethProviderConfig,
  type UserRole,
  AuthError,
  InvalidCredentialsError,
  UserNotFoundError,
  AccountLockedError,
  SessionExpiredError,
  ProviderNotConfiguredError,
  InvalidTokenError,
  AuthProviderFactory,
  LocalAuthProvider,
  EntraIDProvider,
  ShibbolethProvider,
  AuthService,
} from './auth/index.js';

// Workflow Module - export only types to avoid conflicts
export {
  type WorkflowStatus,
  type StepStatus,
  type ExecutionStatus,
  type ResearchDomain,
  type StepConfigSchema,
  type StepDefinition,
  type WorkflowMetadata,
  type ExecutionResult,
  Workflow,
  Step,
  Execution,
} from './workflow/index.js';

// Plugin Module
export * from './plugin/index.js';

// Knowledge Module - export types with explicit names
export {
  type DocumentType,
  type ProcessingStatus,
  type KnowledgeDocument,
  type DocumentMetadata,
  type ChunkMetadata,
  type SearchResult,
  type QueryOptions,
  type RAGContext,
  type EmbeddingConfig,
  type VectorStoreConfig,
  type KnowledgeBaseConfig,
  KnowledgeBase,
  DocumentProcessor,
  RAGService,
} from './knowledge/index.js';
// Rename DocumentChunk to avoid conflicts with db schema
export { type DocumentChunk as KnowledgeDocumentChunk } from './knowledge/index.js';

// Database Module
export * from './db/index.js';

// Screening Module
export * from './screening/index.js';

// NLI Module
export {
  NLIService,
  detectLanguage,
  extractIntent,
  InputPattern,
  type IntentAnalysisResult,
  type ExtractedInfo,
  type NLIOptions,
} from './nli/index.js';

// Lab Module
export {
  // Types
  type LabMemberRole,
  type DatasetType,
  type DatasetVisibility,
  type ExperimentStatus,
  type LabSettings,
  type Lab,
  type LabMember,
  type DatasetSchema,
  type DatasetColumn,
  type LabDataset,
  type ExperimentResults,
  type LabExperiment,
  type LabInvitation,
  type CreateLabInput,
  type UpdateLabInput,
  type CreateDatasetInput,
  type UpdateDatasetInput,
  type CreateExperimentInput,
  type UpdateExperimentInput,
  type InviteMemberInput,
  type LabMemberWithUser,
  type LabWithStats,
  type DatasetWithCreator,
  type ListLabsOptions,
  type ListDatasetsOptions,
  type ListExperimentsOptions,
  type PermissionCheck,
  // Services
  LabService,
  DatasetService,
  ExperimentService,
  DEFAULT_LAB_SETTINGS,
  // Repository interfaces
  type LabRepository,
  type DatasetRepository,
  type ExperimentRepository,
  type LabPermissionService,
  type GraphRAGIndexer,
  type WorkflowExecutor,
} from './lab/index.js';

// Optimization Module
export * from './optimization/index.js';

// Hypothesis Module
export * from './hypothesis/index.js';

// Version
export const VERSION = '0.0.1';
