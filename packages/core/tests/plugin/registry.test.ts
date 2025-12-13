/**
 * PluginRegistry Tests
 *
 * Requirements:
 * - PLUG-CORE-002: Plugin lifecycle
 * - PLUG-INTF-003: Plugin dependencies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginRegistry } from '../../src/plugin/registry.js';
import type { LabFlowPlugin } from '../../src/plugin/types.js';

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  // Helper to create mock plugins
  const createMockPlugin = (
    id: string,
    domain: string = 'drug_discovery',
    dependencies?: string[]
  ): LabFlowPlugin => ({
    id,
    name: `Plugin ${id}`,
    version: '1.0.0',
    domain: domain as 'drug_discovery',
    description: `Mock plugin ${id}`,
    author: 'Test Author',
    dependencies,
    initialize: vi.fn(),
    getWorkflowSteps: () => [],
    getDataConnectors: () => [],
    getVisualizations: () => [],
    getUIExtensions: () => [],
    cleanup: vi.fn(),
  });

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  describe('register', () => {
    it('should register a plugin', () => {
      const plugin = createMockPlugin('test-plugin');

      registry.register(plugin);

      expect(registry.has('test-plugin')).toBe(true);
      expect(registry.size).toBe(1);
    });

    it('should throw error when registering duplicate plugin', () => {
      const plugin = createMockPlugin('test-plugin');

      registry.register(plugin);

      expect(() => registry.register(plugin)).toThrow(
        'Plugin test-plugin is already registered'
      );
    });

    it('should throw error when dependency is not loaded (PLUG-INTF-003)', () => {
      const plugin = createMockPlugin('dependent-plugin', 'drug_discovery', [
        'base-plugin',
      ]);

      expect(() => registry.register(plugin)).toThrow(
        'Plugin dependent-plugin depends on base-plugin which is not loaded'
      );
    });

    it('should allow registration when dependencies are loaded', () => {
      const basePlugin = createMockPlugin('base-plugin');
      const dependentPlugin = createMockPlugin('dependent-plugin', 'drug_discovery', [
        'base-plugin',
      ]);

      registry.register(basePlugin);
      registry.register(dependentPlugin);

      expect(registry.has('dependent-plugin')).toBe(true);
      expect(registry.size).toBe(2);
    });

    it('should create metadata with registered status', () => {
      const plugin = createMockPlugin('test-plugin');

      registry.register(plugin);

      const metadata = registry.getMetadata('test-plugin');
      expect(metadata).toBeDefined();
      expect(metadata?.status).toBe('registered');
      expect(metadata?.loadedAt).toBeInstanceOf(Date);
    });
  });

  describe('unregister', () => {
    it('should unregister a plugin', () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);

      registry.unregister('test-plugin');

      expect(registry.has('test-plugin')).toBe(false);
      expect(registry.size).toBe(0);
    });

    it('should throw error when unregistering with dependents', () => {
      const basePlugin = createMockPlugin('base-plugin');
      const dependentPlugin = createMockPlugin('dependent-plugin', 'drug_discovery', [
        'base-plugin',
      ]);

      registry.register(basePlugin);
      registry.register(dependentPlugin);

      expect(() => registry.unregister('base-plugin')).toThrow(
        'Cannot unregister base-plugin: plugin dependent-plugin depends on it'
      );
    });

    it('should allow unregistering when dependents are removed first', () => {
      const basePlugin = createMockPlugin('base-plugin');
      const dependentPlugin = createMockPlugin('dependent-plugin', 'drug_discovery', [
        'base-plugin',
      ]);

      registry.register(basePlugin);
      registry.register(dependentPlugin);

      registry.unregister('dependent-plugin');
      registry.unregister('base-plugin');

      expect(registry.size).toBe(0);
    });
  });

  describe('get', () => {
    it('should return registered plugin', () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);

      const retrieved = registry.get('test-plugin');

      expect(retrieved).toBe(plugin);
    });

    it('should return undefined for unregistered plugin', () => {
      const retrieved = registry.get('non-existent');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all registered plugins', () => {
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');

      registry.register(plugin1);
      registry.register(plugin2);

      const all = registry.getAll();

      expect(all).toHaveLength(2);
      expect(all).toContain(plugin1);
      expect(all).toContain(plugin2);
    });

    it('should return empty array when no plugins registered', () => {
      const all = registry.getAll();

      expect(all).toEqual([]);
    });
  });

  describe('getByDomain', () => {
    it('should return plugins for specific domain', () => {
      const drugPlugin = createMockPlugin('drug-plugin', 'drug_discovery');
      const materialsPlugin = createMockPlugin('materials-plugin', 'materials_science');

      registry.register(drugPlugin);
      registry.register(materialsPlugin);

      const drugPlugins = registry.getByDomain('drug_discovery');

      expect(drugPlugins).toHaveLength(1);
      expect(drugPlugins[0]).toBe(drugPlugin);
    });

    it('should include common domain plugins', () => {
      const specificPlugin = createMockPlugin('specific-plugin', 'drug_discovery');
      const commonPlugin = createMockPlugin('common-plugin', 'common');

      registry.register(specificPlugin);
      registry.register(commonPlugin);

      const drugPlugins = registry.getByDomain('drug_discovery');

      expect(drugPlugins).toHaveLength(2);
      expect(drugPlugins).toContain(specificPlugin);
      expect(drugPlugins).toContain(commonPlugin);
    });
  });

  describe('getMetadata', () => {
    it('should return plugin metadata', () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);

      const metadata = registry.getMetadata('test-plugin');

      expect(metadata).toBeDefined();
      expect(metadata?.id).toBe('test-plugin');
      expect(metadata?.name).toBe('Plugin test-plugin');
      expect(metadata?.version).toBe('1.0.0');
      expect(metadata?.domain).toBe('drug_discovery');
    });

    it('should return undefined for unregistered plugin', () => {
      const metadata = registry.getMetadata('non-existent');

      expect(metadata).toBeUndefined();
    });
  });

  describe('getAllMetadata', () => {
    it('should return all plugin metadata', () => {
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');

      registry.register(plugin1);
      registry.register(plugin2);

      const allMetadata = registry.getAllMetadata();

      expect(allMetadata).toHaveLength(2);
    });
  });

  describe('updateStatus', () => {
    it('should update plugin status', () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);

      registry.updateStatus('test-plugin', 'active');

      const metadata = registry.getMetadata('test-plugin');
      expect(metadata?.status).toBe('active');
    });

    it('should update status with error message', () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);

      registry.updateStatus('test-plugin', 'error', 'Initialization failed');

      const metadata = registry.getMetadata('test-plugin');
      expect(metadata?.status).toBe('error');
      expect(metadata?.error).toBe('Initialization failed');
    });

    it('should not throw for unregistered plugin', () => {
      expect(() => registry.updateStatus('non-existent', 'active')).not.toThrow();
    });
  });

  describe('has', () => {
    it('should return true for registered plugin', () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);

      expect(registry.has('test-plugin')).toBe(true);
    });

    it('should return false for unregistered plugin', () => {
      expect(registry.has('non-existent')).toBe(false);
    });
  });

  describe('size', () => {
    it('should return correct plugin count', () => {
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');

      expect(registry.size).toBe(0);

      registry.register(plugin1);
      expect(registry.size).toBe(1);

      registry.register(plugin2);
      expect(registry.size).toBe(2);

      registry.unregister('plugin-1');
      expect(registry.size).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all plugins', () => {
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');

      registry.register(plugin1);
      registry.register(plugin2);

      registry.clear();

      expect(registry.size).toBe(0);
      expect(registry.getAll()).toEqual([]);
      expect(registry.getAllMetadata()).toEqual([]);
    });
  });
});
