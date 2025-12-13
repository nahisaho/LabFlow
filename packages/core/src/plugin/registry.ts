/**
 * Plugin Registry
 *
 * Internal registry for tracking loaded plugins
 */

import type { LabFlowPlugin, PluginMetadata, PluginStatus, PluginDomain } from './types.js';

/**
 * Plugin registry for storing and querying plugins
 */
export class PluginRegistry {
  private plugins = new Map<string, LabFlowPlugin>();
  private metadata = new Map<string, PluginMetadata>();

  /**
   * Register a plugin
   */
  register(plugin: LabFlowPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already registered`);
    }

    // Check dependencies
    if (plugin.dependencies) {
      for (const depId of plugin.dependencies) {
        if (!this.plugins.has(depId)) {
          throw new Error(
            `Plugin ${plugin.id} depends on ${depId} which is not loaded`
          );
        }
      }
    }

    this.plugins.set(plugin.id, plugin);
    this.metadata.set(plugin.id, {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      domain: plugin.domain,
      description: plugin.description,
      author: plugin.author,
      dependencies: plugin.dependencies,
      status: 'registered',
      loadedAt: new Date(),
    });
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): void {
    // Check if any plugin depends on this one
    for (const [id, plugin] of this.plugins) {
      if (plugin.dependencies?.includes(pluginId)) {
        throw new Error(
          `Cannot unregister ${pluginId}: plugin ${id} depends on it`
        );
      }
    }

    this.plugins.delete(pluginId);
    this.metadata.delete(pluginId);
  }

  /**
   * Get a plugin by ID
   */
  get(pluginId: string): LabFlowPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all plugins
   */
  getAll(): LabFlowPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins by domain
   */
  getByDomain(domain: string): LabFlowPlugin[] {
    return Array.from(this.plugins.values()).filter(
      (p) => p.domain === domain || p.domain === 'common'
    );
  }

  /**
   * Get plugin metadata
   */
  getMetadata(pluginId: string): PluginMetadata | undefined {
    return this.metadata.get(pluginId);
  }

  /**
   * Get all plugin metadata
   */
  getAllMetadata(): PluginMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * Update plugin status
   */
  updateStatus(pluginId: string, status: PluginStatus, error?: string): void {
    const meta = this.metadata.get(pluginId);
    if (meta) {
      meta.status = status;
      if (error) {
        meta.error = error;
      }
    }
  }

  /**
   * Check if a plugin is registered
   */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Get plugin count
   */
  get size(): number {
    return this.plugins.size;
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins.clear();
    this.metadata.clear();
  }
}
