/**
 * Plugin Manager
 *
 * PLUG-CORE-001: Plugin architecture
 * PLUG-CORE-002: Plugin lifecycle
 */

import type { LabFlowPlugin, PluginContext, PluginMetadata } from './types.js';
import { PluginRegistry } from './registry.js';
import { PluginLoader } from './loader.js';

/**
 * Plugin manager for loading, initializing, and managing plugins
 */
export class PluginManager {
  private registry: PluginRegistry;
  private loader: PluginLoader;
  private context: PluginContext | null = null;

  constructor() {
    this.registry = new PluginRegistry();
    this.loader = new PluginLoader();
  }

  /**
   * Initialize the plugin manager with context
   */
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
  }

  /**
   * Load and initialize a plugin
   */
  async loadPlugin(pluginPath: string): Promise<PluginMetadata> {
    if (!this.context) {
      throw new Error('Plugin manager not initialized');
    }

    // Load plugin module
    const plugin = await this.loader.load(pluginPath);

    // Register plugin (marks as 'registered')
    this.registry.register(plugin);

    try {
      // Initialize plugin
      await plugin.initialize(this.context);
      this.registry.updateStatus(plugin.id, 'initialized');

      // Activate plugin
      this.registry.updateStatus(plugin.id, 'active');

      return this.registry.getMetadata(plugin.id)!;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.registry.updateStatus(plugin.id, 'error', message);
      throw error;
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Cleanup plugin resources
    await plugin.cleanup();

    // Unregister plugin
    this.registry.unregister(pluginId);
  }

  /**
   * Get a loaded plugin by ID
   */
  getPlugin(pluginId: string): LabFlowPlugin | undefined {
    return this.registry.get(pluginId);
  }

  /**
   * Get all loaded plugins
   */
  getAllPlugins(): LabFlowPlugin[] {
    return this.registry.getAll();
  }

  /**
   * Get plugins by domain
   */
  getPluginsByDomain(domain: string): LabFlowPlugin[] {
    return this.registry.getByDomain(domain);
  }

  /**
   * Get all plugin metadata
   */
  getAllMetadata(): PluginMetadata[] {
    return this.registry.getAllMetadata();
  }

  /**
   * Get all workflow step definitions from all plugins
   */
  getAllWorkflowSteps(): ReturnType<LabFlowPlugin['getWorkflowSteps']> {
    return this.registry.getAll().flatMap((p) => p.getWorkflowSteps());
  }

  /**
   * Get all data connectors from all plugins
   */
  getAllDataConnectors(): ReturnType<LabFlowPlugin['getDataConnectors']> {
    return this.registry.getAll().flatMap((p) => p.getDataConnectors());
  }

  /**
   * Get all visualizations from all plugins
   */
  getAllVisualizations(): ReturnType<LabFlowPlugin['getVisualizations']> {
    return this.registry.getAll().flatMap((p) => p.getVisualizations());
  }

  /**
   * Get all UI extensions from all plugins
   */
  getAllUIExtensions(): ReturnType<LabFlowPlugin['getUIExtensions']> {
    return this.registry.getAll().flatMap((p) => p.getUIExtensions());
  }

  /**
   * Shutdown all plugins
   */
  async shutdown(): Promise<void> {
    const plugins = this.registry.getAll();

    for (const plugin of plugins) {
      try {
        await plugin.cleanup();
        this.registry.updateStatus(plugin.id, 'unloaded');
      } catch (error) {
        console.error(`Error cleaning up plugin ${plugin.id}:`, error);
      }
    }

    this.registry.clear();
  }
}
