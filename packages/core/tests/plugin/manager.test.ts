/**
 * PluginManager Tests
 *
 * Requirements:
 * - PLUG-CORE-001: Plugin architecture
 * - PLUG-CORE-002: Plugin lifecycle
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginManager } from '../../src/plugin/manager.js';
import type { LabFlowPlugin, PluginContext } from '../../src/plugin/types.js';

describe('PluginManager', () => {
  let manager: PluginManager;
  let mockContext: PluginContext;

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
    getWorkflowSteps: () => [
      {
        type: `${id}-step`,
        name: `${id} Step`,
        domain: domain as 'drug_discovery',
        description: 'Test step',
      },
    ],
    getDataConnectors: () => [
      {
        id: `${id}-connector`,
        name: `${id} Connector`,
        type: 'database' as const,
        connect: vi.fn(),
        disconnect: vi.fn(),
        query: vi.fn(),
        execute: vi.fn(),
      },
    ],
    getVisualizations: () => [
      {
        id: `${id}-viz`,
        name: `${id} Visualization`,
        type: 'chart' as const,
        render: vi.fn(),
      },
    ],
    getUIExtensions: () => [
      {
        id: `${id}-ui`,
        name: `${id} UI`,
        type: 'panel' as const,
        position: 'sidebar' as const,
        render: vi.fn(),
      },
    ],
    cleanup: vi.fn(),
  });

  beforeEach(() => {
    manager = new PluginManager();

    mockContext = {
      config: { apiKey: 'test-key' },
      services: {
        get: vi.fn(),
        register: vi.fn(),
      },
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      cache: {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      },
      events: {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      },
    };
  });

  describe('initialize', () => {
    it('should initialize with context', async () => {
      await expect(manager.initialize(mockContext)).resolves.not.toThrow();
    });
  });

  describe('loadPlugin (PLUG-CORE-002)', () => {
    it('should throw error when manager not initialized', async () => {
      await expect(manager.loadPlugin('./test-plugin')).rejects.toThrow(
        'Plugin manager not initialized'
      );
    });

    // Note: Dynamic loading tests require actual plugin files
    // These would be integration tests
  });

  describe('unloadPlugin', () => {
    it('should throw error for non-existent plugin', async () => {
      await manager.initialize(mockContext);

      await expect(manager.unloadPlugin('non-existent')).rejects.toThrow(
        'Plugin non-existent not found'
      );
    });
  });

  describe('getPlugin', () => {
    it('should return undefined for non-existent plugin', () => {
      const plugin = manager.getPlugin('non-existent');

      expect(plugin).toBeUndefined();
    });
  });

  describe('getAllPlugins', () => {
    it('should return empty array when no plugins loaded', () => {
      const plugins = manager.getAllPlugins();

      expect(plugins).toEqual([]);
    });
  });

  describe('getPluginsByDomain', () => {
    it('should return empty array when no plugins loaded', () => {
      const plugins = manager.getPluginsByDomain('drug_discovery');

      expect(plugins).toEqual([]);
    });
  });

  describe('getAllMetadata', () => {
    it('should return empty array when no plugins loaded', () => {
      const metadata = manager.getAllMetadata();

      expect(metadata).toEqual([]);
    });
  });

  describe('getAllWorkflowSteps', () => {
    it('should return empty array when no plugins loaded', () => {
      const steps = manager.getAllWorkflowSteps();

      expect(steps).toEqual([]);
    });
  });

  describe('getAllDataConnectors', () => {
    it('should return empty array when no plugins loaded', () => {
      const connectors = manager.getAllDataConnectors();

      expect(connectors).toEqual([]);
    });
  });

  describe('getAllVisualizations', () => {
    it('should return empty array when no plugins loaded', () => {
      const visualizations = manager.getAllVisualizations();

      expect(visualizations).toEqual([]);
    });
  });

  describe('getAllUIExtensions', () => {
    it('should return empty array when no plugins loaded', () => {
      const extensions = manager.getAllUIExtensions();

      expect(extensions).toEqual([]);
    });
  });

  describe('shutdown (PLUG-CORE-002)', () => {
    it('should not throw when no plugins loaded', async () => {
      await manager.initialize(mockContext);

      await expect(manager.shutdown()).resolves.not.toThrow();
    });
  });
});
