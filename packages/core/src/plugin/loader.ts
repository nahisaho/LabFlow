/**
 * Plugin Loader
 *
 * PLUG-CORE-005: Version compatibility
 */

import type { LabFlowPlugin } from './types.js';

/**
 * Plugin loader for discovering and loading plugins
 */
export class PluginLoader {
  /**
   * Load a plugin from a path or module name
   */
  async load(pluginPath: string): Promise<LabFlowPlugin> {
    try {
      // Dynamic import of plugin module
      const module = await import(pluginPath);

      // Get default export or named export
      const plugin: LabFlowPlugin = module.default || module.plugin;

      if (!plugin) {
        throw new Error(`No plugin export found in ${pluginPath}`);
      }

      // Validate plugin interface
      this.validatePlugin(plugin);

      return plugin;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load plugin from ${pluginPath}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate that an object implements the LabFlowPlugin interface
   */
  validatePlugin(plugin: unknown): asserts plugin is LabFlowPlugin {
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('Plugin must be an object');
    }

    const p = plugin as Record<string, unknown>;

    // Required properties
    if (typeof p.id !== 'string' || !p.id) {
      throw new Error('Plugin must have a string id');
    }

    if (typeof p.name !== 'string' || !p.name) {
      throw new Error('Plugin must have a string name');
    }

    if (typeof p.version !== 'string' || !p.version) {
      throw new Error('Plugin must have a string version');
    }

    if (typeof p.domain !== 'string' || !p.domain) {
      throw new Error('Plugin must have a string domain');
    }

    // Required methods
    if (typeof p.initialize !== 'function') {
      throw new Error('Plugin must have an initialize method');
    }

    if (typeof p.getWorkflowSteps !== 'function') {
      throw new Error('Plugin must have a getWorkflowSteps method');
    }

    if (typeof p.getDataConnectors !== 'function') {
      throw new Error('Plugin must have a getDataConnectors method');
    }

    if (typeof p.getVisualizations !== 'function') {
      throw new Error('Plugin must have a getVisualizations method');
    }

    if (typeof p.getUIExtensions !== 'function') {
      throw new Error('Plugin must have a getUIExtensions method');
    }

    if (typeof p.cleanup !== 'function') {
      throw new Error('Plugin must have a cleanup method');
    }
  }

  /**
   * Check if a plugin version is compatible with the core version
   */
  isVersionCompatible(pluginVersion: string, coreVersion: string): boolean {
    // Simple semver major version check
    const pluginMajorStr = pluginVersion.split('.')[0];
    const coreMajorStr = coreVersion.split('.')[0];
    const pluginMajor = parseInt(pluginMajorStr ?? '0', 10);
    const coreMajor = parseInt(coreMajorStr ?? '0', 10);

    // Major version 0 allows any compatible version
    if (coreMajor === 0) {
      return true;
    }

    return pluginMajor === coreMajor;
  }
}
