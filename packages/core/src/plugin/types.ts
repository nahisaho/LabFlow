/**
 * Plugin Types
 *
 * PLUG-INTF-001: Plugin interface
 * PLUG-INTF-002: Extension points
 */

import type { ResearchDomain, StepConfigSchema } from '../workflow/types.js';

/**
 * Plugin domain
 */
export type PluginDomain = ResearchDomain | 'common';

/**
 * Plugin status
 */
export type PluginStatus = 'registered' | 'initialized' | 'active' | 'error' | 'unloaded';

/**
 * LabFlow Plugin Interface
 *
 * All plugins must implement this interface
 */
export interface LabFlowPlugin {
  /**
   * Unique plugin identifier
   */
  readonly id: string;

  /**
   * Human-readable plugin name
   */
  readonly name: string;

  /**
   * Plugin version (semver)
   */
  readonly version: string;

  /**
   * Research domain this plugin targets
   */
  readonly domain: PluginDomain;

  /**
   * Plugin description
   */
  readonly description?: string;

  /**
   * Plugin author
   */
  readonly author?: string;

  /**
   * Plugin dependencies (other plugin IDs)
   */
  readonly dependencies?: string[];

  /**
   * Initialize the plugin with context
   */
  initialize(context: PluginContext): Promise<void>;

  /**
   * Get workflow step definitions provided by this plugin
   */
  getWorkflowSteps(): WorkflowStepDefinition[];

  /**
   * Get data connectors provided by this plugin
   */
  getDataConnectors(): DataConnector[];

  /**
   * Get visualization components provided by this plugin
   */
  getVisualizations(): VisualizationComponent[];

  /**
   * Get UI extensions provided by this plugin
   */
  getUIExtensions(): UIExtension[];

  /**
   * Cleanup resources when plugin is unloaded
   */
  cleanup(): Promise<void>;
}

/**
 * Plugin context provided during initialization
 */
export interface PluginContext {
  /**
   * Plugin configuration from database/environment
   */
  config: Record<string, unknown>;

  /**
   * Service registry for accessing core services
   */
  services: PluginServices;

  /**
   * Logger instance for the plugin
   */
  logger: PluginLogger;

  /**
   * Cache interface
   */
  cache: PluginCache;

  /**
   * Event emitter for plugin events
   */
  events: PluginEventEmitter;
}

/**
 * Services available to plugins
 */
export interface PluginServices {
  /**
   * Get a registered service by name
   */
  get<T>(serviceName: string): T | undefined;

  /**
   * Register a service
   */
  register<T>(serviceName: string, service: T): void;
}

/**
 * Plugin logger interface
 */
export interface PluginLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}

/**
 * Plugin cache interface
 */
export interface PluginCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Plugin event emitter interface
 */
export interface PluginEventEmitter {
  emit(event: string, data: unknown): void;
  on(event: string, handler: (data: unknown) => void): void;
  off(event: string, handler: (data: unknown) => void): void;
}

/**
 * Workflow step definition provided by a plugin
 *
 * PLUG-INTF-002: Extension points
 */
export interface WorkflowStepDefinition {
  /**
   * Unique step type identifier
   */
  type: string;

  /**
   * Human-readable step name
   */
  name: string;

  /**
   * Step description
   */
  description?: string;

  /**
   * Research domain
   */
  domain: PluginDomain;

  /**
   * Configuration schema
   */
  configSchema: StepConfigSchema;

  /**
   * Execute the step
   */
  execute(
    config: Record<string, unknown>,
    inputs: Record<string, unknown>,
    context: StepExecutionContext
  ): Promise<StepExecutionResult>;

  /**
   * Validate step configuration
   */
  validateConfig?(config: Record<string, unknown>): ValidationResult;

  /**
   * Icon for UI display
   */
  icon?: string;

  /**
   * Category for grouping in UI
   */
  category?: string;
}

/**
 * Step execution context
 */
export interface StepExecutionContext {
  executionId: string;
  stepId: string;
  workflowId: string;
  userId: string;
  logger: PluginLogger;
  cache: PluginCache;
  reportProgress: (progress: number) => void;
}

/**
 * Step execution result
 */
export interface StepExecutionResult {
  success: boolean;
  outputs: Record<string, unknown>;
  error?: string;
  artifacts?: Artifact[];
}

/**
 * Artifact produced by a step
 */
export interface Artifact {
  name: string;
  type: string;
  path: string;
  size?: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Data connector for external data sources
 */
export interface DataConnector {
  /**
   * Unique connector identifier
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Data source type (e.g., 'chembl', 'pubchem', 'materials-project')
   */
  sourceType: string;

  /**
   * Research domain
   */
  domain: PluginDomain;

  /**
   * Connect to the data source
   */
  connect(config: Record<string, unknown>): Promise<void>;

  /**
   * Query data from the source
   */
  query(params: Record<string, unknown>): Promise<unknown>;

  /**
   * Disconnect from the data source
   */
  disconnect(): Promise<void>;
}

/**
 * Visualization component for rendering data
 */
export interface VisualizationComponent {
  /**
   * Unique component identifier
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Component type (e.g., '3d-molecule', 'crystal-structure', 'chart')
   */
  type: string;

  /**
   * Research domain
   */
  domain: PluginDomain;

  /**
   * React component or component path
   */
  component: string;

  /**
   * Supported data types
   */
  supportedDataTypes: string[];
}

/**
 * UI extension for dashboard/workflow builder
 */
export interface UIExtension {
  /**
   * Unique extension identifier
   */
  id: string;

  /**
   * Extension type (e.g., 'sidebar-panel', 'toolbar-button', 'context-menu')
   */
  type: UIExtensionType;

  /**
   * Where to mount the extension
   */
  mountPoint: string;

  /**
   * React component or component path
   */
  component: string;

  /**
   * Extension configuration
   */
  config?: Record<string, unknown>;
}

/**
 * UI extension types
 */
export type UIExtensionType =
  | 'sidebar-panel'
  | 'toolbar-button'
  | 'context-menu'
  | 'dashboard-widget'
  | 'step-config-panel';

/**
 * Plugin metadata for registration
 */
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  domain: PluginDomain;
  description?: string;
  author?: string;
  dependencies?: string[];
  status: PluginStatus;
  loadedAt?: Date;
  error?: string;
}
