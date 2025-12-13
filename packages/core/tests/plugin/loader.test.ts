/**
 * PluginLoader Tests
 *
 * Requirements:
 * - PLUG-CORE-005: Version compatibility
 */

import { describe, it, expect, vi } from 'vitest';
import { PluginLoader } from '../../src/plugin/loader.js';
import type { LabFlowPlugin, PluginContext } from '../../src/plugin/types.js';

describe('PluginLoader', () => {
  const loader = new PluginLoader();

  describe('validatePlugin', () => {
    it('should validate a complete plugin object', () => {
      const plugin: LabFlowPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        domain: 'drug_discovery',
        description: 'A test plugin',
        author: 'Test Author',
        initialize: vi.fn(),
        getWorkflowSteps: () => [],
        getDataConnectors: () => [],
        getVisualizations: () => [],
        getUIExtensions: () => [],
        cleanup: vi.fn(),
      };

      expect(() => loader.validatePlugin(plugin)).not.toThrow();
    });

    it('should throw error when plugin is null', () => {
      expect(() => loader.validatePlugin(null)).toThrow('Plugin must be an object');
    });

    it('should throw error when plugin is not an object', () => {
      expect(() => loader.validatePlugin('string')).toThrow('Plugin must be an object');
    });

    it('should throw error when id is missing', () => {
      const plugin = {
        name: 'Test Plugin',
        version: '1.0.0',
        domain: 'drug_discovery',
        initialize: vi.fn(),
        getWorkflowSteps: () => [],
        getDataConnectors: () => [],
        getVisualizations: () => [],
        getUIExtensions: () => [],
        cleanup: vi.fn(),
      };

      expect(() => loader.validatePlugin(plugin)).toThrow('Plugin must have a string id');
    });

    it('should throw error when id is empty', () => {
      const plugin = {
        id: '',
        name: 'Test Plugin',
        version: '1.0.0',
        domain: 'drug_discovery',
        initialize: vi.fn(),
        getWorkflowSteps: () => [],
        getDataConnectors: () => [],
        getVisualizations: () => [],
        getUIExtensions: () => [],
        cleanup: vi.fn(),
      };

      expect(() => loader.validatePlugin(plugin)).toThrow('Plugin must have a string id');
    });

    it('should throw error when name is missing', () => {
      const plugin = {
        id: 'test-plugin',
        version: '1.0.0',
        domain: 'drug_discovery',
        initialize: vi.fn(),
        getWorkflowSteps: () => [],
        getDataConnectors: () => [],
        getVisualizations: () => [],
        getUIExtensions: () => [],
        cleanup: vi.fn(),
      };

      expect(() => loader.validatePlugin(plugin)).toThrow('Plugin must have a string name');
    });

    it('should throw error when version is missing', () => {
      const plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        domain: 'drug_discovery',
        initialize: vi.fn(),
        getWorkflowSteps: () => [],
        getDataConnectors: () => [],
        getVisualizations: () => [],
        getUIExtensions: () => [],
        cleanup: vi.fn(),
      };

      expect(() => loader.validatePlugin(plugin)).toThrow('Plugin must have a string version');
    });

    it('should throw error when domain is missing', () => {
      const plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        initialize: vi.fn(),
        getWorkflowSteps: () => [],
        getDataConnectors: () => [],
        getVisualizations: () => [],
        getUIExtensions: () => [],
        cleanup: vi.fn(),
      };

      expect(() => loader.validatePlugin(plugin)).toThrow('Plugin must have a string domain');
    });

    it('should throw error when initialize is missing', () => {
      const plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        domain: 'drug_discovery',
        getWorkflowSteps: () => [],
        getDataConnectors: () => [],
        getVisualizations: () => [],
        getUIExtensions: () => [],
        cleanup: vi.fn(),
      };

      expect(() => loader.validatePlugin(plugin)).toThrow('Plugin must have an initialize method');
    });

    it('should throw error when getWorkflowSteps is missing', () => {
      const plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        domain: 'drug_discovery',
        initialize: vi.fn(),
        getDataConnectors: () => [],
        getVisualizations: () => [],
        getUIExtensions: () => [],
        cleanup: vi.fn(),
      };

      expect(() => loader.validatePlugin(plugin)).toThrow('Plugin must have a getWorkflowSteps method');
    });

    it('should throw error when getDataConnectors is missing', () => {
      const plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        domain: 'drug_discovery',
        initialize: vi.fn(),
        getWorkflowSteps: () => [],
        getVisualizations: () => [],
        getUIExtensions: () => [],
        cleanup: vi.fn(),
      };

      expect(() => loader.validatePlugin(plugin)).toThrow('Plugin must have a getDataConnectors method');
    });

    it('should throw error when getVisualizations is missing', () => {
      const plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        domain: 'drug_discovery',
        initialize: vi.fn(),
        getWorkflowSteps: () => [],
        getDataConnectors: () => [],
        getUIExtensions: () => [],
        cleanup: vi.fn(),
      };

      expect(() => loader.validatePlugin(plugin)).toThrow('Plugin must have a getVisualizations method');
    });

    it('should throw error when getUIExtensions is missing', () => {
      const plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        domain: 'drug_discovery',
        initialize: vi.fn(),
        getWorkflowSteps: () => [],
        getDataConnectors: () => [],
        getVisualizations: () => [],
        cleanup: vi.fn(),
      };

      expect(() => loader.validatePlugin(plugin)).toThrow('Plugin must have a getUIExtensions method');
    });

    it('should throw error when cleanup is missing', () => {
      const plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        domain: 'drug_discovery',
        initialize: vi.fn(),
        getWorkflowSteps: () => [],
        getDataConnectors: () => [],
        getVisualizations: () => [],
        getUIExtensions: () => [],
      };

      expect(() => loader.validatePlugin(plugin)).toThrow('Plugin must have a cleanup method');
    });
  });

  describe('isVersionCompatible (PLUG-CORE-005)', () => {
    it('should return true for same major version', () => {
      expect(loader.isVersionCompatible('1.0.0', '1.2.3')).toBe(true);
      expect(loader.isVersionCompatible('1.5.0', '1.0.0')).toBe(true);
    });

    it('should return false for different major versions', () => {
      expect(loader.isVersionCompatible('1.0.0', '2.0.0')).toBe(false);
      expect(loader.isVersionCompatible('2.0.0', '1.0.0')).toBe(false);
    });

    it('should return true for version 0.x (development)', () => {
      expect(loader.isVersionCompatible('0.1.0', '0.2.0')).toBe(true);
    });

    it('should handle versions with different formats', () => {
      expect(loader.isVersionCompatible('1.0', '1.0.0')).toBe(true);
      expect(loader.isVersionCompatible('1', '1.0.0')).toBe(true);
    });
  });
});
