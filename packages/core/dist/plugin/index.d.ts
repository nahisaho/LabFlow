import { R as ResearchDomain, d as StepConfigSchema } from '../types-BA_TAtBg.js';

/**
 * Plugin Types
 *
 * PLUG-INTF-001: Plugin interface
 * PLUG-INTF-002: Extension points
 */

/**
 * Plugin domain
 */
type PluginDomain = ResearchDomain | 'common';
/**
 * Plugin status
 */
type PluginStatus = 'registered' | 'initialized' | 'active' | 'error' | 'unloaded';
/**
 * LabFlow Plugin Interface
 *
 * All plugins must implement this interface
 */
interface LabFlowPlugin {
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
interface PluginContext {
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
interface PluginServices {
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
interface PluginLogger {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}
/**
 * Plugin cache interface
 */
interface PluginCache {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    delete(key: string): Promise<void>;
}
/**
 * Plugin event emitter interface
 */
interface PluginEventEmitter {
    emit(event: string, data: unknown): void;
    on(event: string, handler: (data: unknown) => void): void;
    off(event: string, handler: (data: unknown) => void): void;
}
/**
 * Workflow step definition provided by a plugin
 *
 * PLUG-INTF-002: Extension points
 */
interface WorkflowStepDefinition {
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
    execute(config: Record<string, unknown>, inputs: Record<string, unknown>, context: StepExecutionContext): Promise<StepExecutionResult>;
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
interface StepExecutionContext {
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
interface StepExecutionResult {
    success: boolean;
    outputs: Record<string, unknown>;
    error?: string;
    artifacts?: Artifact[];
}
/**
 * Artifact produced by a step
 */
interface Artifact {
    name: string;
    type: string;
    path: string;
    size?: number;
}
/**
 * Validation result
 */
interface ValidationResult {
    valid: boolean;
    errors?: string[];
}
/**
 * Data connector for external data sources
 */
interface DataConnector {
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
interface VisualizationComponent {
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
interface UIExtension {
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
type UIExtensionType = 'sidebar-panel' | 'toolbar-button' | 'context-menu' | 'dashboard-widget' | 'step-config-panel';
/**
 * Plugin metadata for registration
 */
interface PluginMetadata {
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

/**
 * Plugin Manager
 *
 * PLUG-CORE-001: Plugin architecture
 * PLUG-CORE-002: Plugin lifecycle
 */

/**
 * Plugin manager for loading, initializing, and managing plugins
 */
declare class PluginManager {
    private registry;
    private loader;
    private context;
    constructor();
    /**
     * Initialize the plugin manager with context
     */
    initialize(context: PluginContext): Promise<void>;
    /**
     * Load and initialize a plugin
     */
    loadPlugin(pluginPath: string): Promise<PluginMetadata>;
    /**
     * Unload a plugin
     */
    unloadPlugin(pluginId: string): Promise<void>;
    /**
     * Get a loaded plugin by ID
     */
    getPlugin(pluginId: string): LabFlowPlugin | undefined;
    /**
     * Get all loaded plugins
     */
    getAllPlugins(): LabFlowPlugin[];
    /**
     * Get plugins by domain
     */
    getPluginsByDomain(domain: string): LabFlowPlugin[];
    /**
     * Get all plugin metadata
     */
    getAllMetadata(): PluginMetadata[];
    /**
     * Get all workflow step definitions from all plugins
     */
    getAllWorkflowSteps(): ReturnType<LabFlowPlugin['getWorkflowSteps']>;
    /**
     * Get all data connectors from all plugins
     */
    getAllDataConnectors(): ReturnType<LabFlowPlugin['getDataConnectors']>;
    /**
     * Get all visualizations from all plugins
     */
    getAllVisualizations(): ReturnType<LabFlowPlugin['getVisualizations']>;
    /**
     * Get all UI extensions from all plugins
     */
    getAllUIExtensions(): ReturnType<LabFlowPlugin['getUIExtensions']>;
    /**
     * Shutdown all plugins
     */
    shutdown(): Promise<void>;
}

/**
 * Plugin Registry
 *
 * Internal registry for tracking loaded plugins
 */

/**
 * Plugin registry for storing and querying plugins
 */
declare class PluginRegistry {
    private plugins;
    private metadata;
    /**
     * Register a plugin
     */
    register(plugin: LabFlowPlugin): void;
    /**
     * Unregister a plugin
     */
    unregister(pluginId: string): void;
    /**
     * Get a plugin by ID
     */
    get(pluginId: string): LabFlowPlugin | undefined;
    /**
     * Get all plugins
     */
    getAll(): LabFlowPlugin[];
    /**
     * Get plugins by domain
     */
    getByDomain(domain: string): LabFlowPlugin[];
    /**
     * Get plugin metadata
     */
    getMetadata(pluginId: string): PluginMetadata | undefined;
    /**
     * Get all plugin metadata
     */
    getAllMetadata(): PluginMetadata[];
    /**
     * Update plugin status
     */
    updateStatus(pluginId: string, status: PluginStatus, error?: string): void;
    /**
     * Check if a plugin is registered
     */
    has(pluginId: string): boolean;
    /**
     * Get plugin count
     */
    get size(): number;
    /**
     * Clear all plugins
     */
    clear(): void;
}

/**
 * Plugin Loader
 *
 * PLUG-CORE-005: Version compatibility
 */

/**
 * Plugin loader for discovering and loading plugins
 */
declare class PluginLoader {
    /**
     * Load a plugin from a path or module name
     */
    load(pluginPath: string): Promise<LabFlowPlugin>;
    /**
     * Validate that an object implements the LabFlowPlugin interface
     */
    validatePlugin(plugin: unknown): asserts plugin is LabFlowPlugin;
    /**
     * Check if a plugin version is compatible with the core version
     */
    isVersionCompatible(pluginVersion: string, coreVersion: string): boolean;
}

export { type Artifact, type DataConnector, type LabFlowPlugin, type PluginCache, type PluginContext, type PluginDomain, type PluginEventEmitter, PluginLoader, type PluginLogger, PluginManager, type PluginMetadata, PluginRegistry, type PluginServices, type PluginStatus, type StepExecutionContext, type StepExecutionResult, type UIExtension, type UIExtensionType, type ValidationResult, type VisualizationComponent, type WorkflowStepDefinition };
