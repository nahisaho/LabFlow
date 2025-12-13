/**
 * Plugin Module
 *
 * Requirements:
 * - PLUG-CORE-001: Plugin architecture
 * - PLUG-CORE-002: Plugin lifecycle
 * - PLUG-INTF-001: Plugin interface
 */

// Types
export * from './types.js';

// Manager
export { PluginManager } from './manager.js';
export { PluginRegistry } from './registry.js';
export { PluginLoader } from './loader.js';
