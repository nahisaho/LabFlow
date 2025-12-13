/**
 * LabFlowPlugin Interface Tests
 *
 * Requirements:
 * - PLUG-INTF-001: Plugin interface (initialize, execute, cleanup)
 * - PLUG-INTF-002: Extension points (workflow templates, data schema, visualization)
 * - PLUG-CORE-003: Plugin types support
 */

import { describe, it, expect, vi } from 'vitest';
import type {
  LabFlowPlugin,
  PluginContext,
  WorkflowStepDefinition,
  DataConnector,
  VisualizationComponent,
  UIExtension,
} from '../../src/plugin/types.js';

describe('LabFlowPlugin Interface (PLUG-INTF-001)', () => {
  // Helper to create a complete mock plugin
  const createCompletePlugin = (): LabFlowPlugin => ({
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    domain: 'drug_discovery',
    description: 'A comprehensive test plugin',
    author: 'Test Author',
    dependencies: [],
    initialize: vi.fn().mockResolvedValue(undefined),
    getWorkflowSteps: vi.fn().mockReturnValue([]),
    getDataConnectors: vi.fn().mockReturnValue([]),
    getVisualizations: vi.fn().mockReturnValue([]),
    getUIExtensions: vi.fn().mockReturnValue([]),
    cleanup: vi.fn().mockResolvedValue(undefined),
  });

  // Helper to create mock context
  const createMockContext = (): PluginContext => ({
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
  });

  describe('Required properties', () => {
    it('should have id property', () => {
      const plugin = createCompletePlugin();
      expect(plugin.id).toBe('test-plugin');
    });

    it('should have name property', () => {
      const plugin = createCompletePlugin();
      expect(plugin.name).toBe('Test Plugin');
    });

    it('should have version property (semver)', () => {
      const plugin = createCompletePlugin();
      expect(plugin.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have domain property', () => {
      const plugin = createCompletePlugin();
      expect(plugin.domain).toBe('drug_discovery');
    });
  });

  describe('Optional properties', () => {
    it('should support description', () => {
      const plugin = createCompletePlugin();
      expect(plugin.description).toBe('A comprehensive test plugin');
    });

    it('should support author', () => {
      const plugin = createCompletePlugin();
      expect(plugin.author).toBe('Test Author');
    });

    it('should support dependencies array', () => {
      const plugin = createCompletePlugin();
      expect(plugin.dependencies).toEqual([]);
    });
  });

  describe('initialize method', () => {
    it('should accept PluginContext', async () => {
      const plugin = createCompletePlugin();
      const context = createMockContext();

      await plugin.initialize(context);

      expect(plugin.initialize).toHaveBeenCalledWith(context);
    });

    it('should return Promise<void>', async () => {
      const plugin = createCompletePlugin();
      const context = createMockContext();

      const result = await plugin.initialize(context);

      expect(result).toBeUndefined();
    });
  });

  describe('cleanup method', () => {
    it('should return Promise<void>', async () => {
      const plugin = createCompletePlugin();

      const result = await plugin.cleanup();

      expect(result).toBeUndefined();
    });
  });
});

describe('WorkflowStepDefinition (PLUG-INTF-002)', () => {
  it('should have required properties', () => {
    const step: Partial<WorkflowStepDefinition> = {
      type: 'data-processing',
      name: 'Data Processing Step',
      domain: 'drug_discovery',
      description: 'Process molecular data',
    };

    expect(step.type).toBe('data-processing');
    expect(step.name).toBe('Data Processing Step');
    expect(step.domain).toBe('drug_discovery');
  });

  it('should support optional properties', () => {
    const step: Partial<WorkflowStepDefinition> = {
      type: 'visualization',
      name: 'Molecule Viewer',
      domain: 'drug_discovery',
      icon: 'molecule-icon',
      category: 'visualization',
    };

    expect(step.icon).toBe('molecule-icon');
    expect(step.category).toBe('visualization');
  });
});

describe('DataConnector (PLUG-INTF-002)', () => {
  it('should have required properties', () => {
    const connector: DataConnector = {
      id: 'chembl-connector',
      name: 'ChEMBL Connector',
      sourceType: 'chembl',
      domain: 'drug_discovery',
      connect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
      disconnect: vi.fn().mockResolvedValue(undefined),
    };

    expect(connector.id).toBe('chembl-connector');
    expect(connector.name).toBe('ChEMBL Connector');
    expect(connector.sourceType).toBe('chembl');
    expect(connector.domain).toBe('drug_discovery');
  });

  it('should support connect operation', async () => {
    const connector: DataConnector = {
      id: 'test-connector',
      name: 'Test Connector',
      sourceType: 'test',
      domain: 'common',
      connect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn(),
      disconnect: vi.fn(),
    };

    await connector.connect({ apiKey: 'test' });

    expect(connector.connect).toHaveBeenCalledWith({ apiKey: 'test' });
  });

  it('should support query operation', async () => {
    const mockData = [{ id: '1', smiles: 'CCO' }];
    const connector: DataConnector = {
      id: 'test-connector',
      name: 'Test Connector',
      sourceType: 'test',
      domain: 'common',
      connect: vi.fn(),
      query: vi.fn().mockResolvedValue(mockData),
      disconnect: vi.fn(),
    };

    const result = await connector.query({ limit: 10 });

    expect(result).toEqual(mockData);
  });

  it('should support disconnect operation', async () => {
    const connector: DataConnector = {
      id: 'test-connector',
      name: 'Test Connector',
      sourceType: 'test',
      domain: 'common',
      connect: vi.fn(),
      query: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined),
    };

    await connector.disconnect();

    expect(connector.disconnect).toHaveBeenCalled();
  });
});

describe('VisualizationComponent (PLUG-INTF-002)', () => {
  it('should have required properties', () => {
    const viz: VisualizationComponent = {
      id: 'molecule-3d',
      name: '3D Molecule Viewer',
      type: '3d-molecule',
      domain: 'drug_discovery',
      component: 'Molecule3DViewer',
      supportedDataTypes: ['smiles', 'mol', 'sdf'],
    };

    expect(viz.id).toBe('molecule-3d');
    expect(viz.name).toBe('3D Molecule Viewer');
    expect(viz.type).toBe('3d-molecule');
    expect(viz.domain).toBe('drug_discovery');
    expect(viz.component).toBe('Molecule3DViewer');
  });

  it('should specify supported data types', () => {
    const viz: VisualizationComponent = {
      id: 'crystal-structure',
      name: 'Crystal Structure Viewer',
      type: 'crystal-structure',
      domain: 'materials_science',
      component: 'CrystalViewer',
      supportedDataTypes: ['cif', 'poscar'],
    };

    expect(viz.supportedDataTypes).toContain('cif');
    expect(viz.supportedDataTypes).toContain('poscar');
  });
});

describe('UIExtension (PLUG-INTF-002)', () => {
  it('should have required properties', () => {
    const extension: UIExtension = {
      id: 'molecule-panel',
      type: 'sidebar-panel',
      mountPoint: 'sidebar-left',
      component: 'MoleculePanel',
    };

    expect(extension.id).toBe('molecule-panel');
    expect(extension.type).toBe('sidebar-panel');
    expect(extension.mountPoint).toBe('sidebar-left');
  });

  it('should support different extension types', () => {
    const types: UIExtension['type'][] = [
      'sidebar-panel',
      'toolbar-button',
      'context-menu',
      'dashboard-widget',
      'step-config-panel',
    ];

    types.forEach((type) => {
      const extension: UIExtension = {
        id: `${type}-extension`,
        type,
        mountPoint: 'test-mount',
        component: 'TestComponent',
      };

      expect(extension.type).toBe(type);
    });
  });

  it('should support optional config', () => {
    const extension: UIExtension = {
      id: 'configurable-panel',
      type: 'dashboard-widget',
      mountPoint: 'dashboard',
      component: 'ConfigurableWidget',
      config: {
        width: 400,
        height: 300,
        refreshInterval: 5000,
      },
    };

    expect(extension.config).toEqual({
      width: 400,
      height: 300,
      refreshInterval: 5000,
    });
  });
});

describe('Plugin Types Support (PLUG-CORE-003)', () => {
  it('should support domain plugin type', () => {
    const domainPlugin: LabFlowPlugin = {
      id: 'drug-discovery-plugin',
      name: 'Drug Discovery Plugin',
      version: '1.0.0',
      domain: 'drug_discovery',
      initialize: vi.fn(),
      getWorkflowSteps: () => [],
      getDataConnectors: () => [],
      getVisualizations: () => [],
      getUIExtensions: () => [],
      cleanup: vi.fn(),
    };

    expect(domainPlugin.domain).toBe('drug_discovery');
  });

  it('should support common plugin type', () => {
    const commonPlugin: LabFlowPlugin = {
      id: 'common-utils-plugin',
      name: 'Common Utilities',
      version: '1.0.0',
      domain: 'common',
      initialize: vi.fn(),
      getWorkflowSteps: () => [],
      getDataConnectors: () => [],
      getVisualizations: () => [],
      getUIExtensions: () => [],
      cleanup: vi.fn(),
    };

    expect(commonPlugin.domain).toBe('common');
  });

  it('should support all research domains', () => {
    const domains = ['drug_discovery', 'materials_science', 'climate', 'genomics'];

    domains.forEach((domain) => {
      const plugin: LabFlowPlugin = {
        id: `${domain}-plugin`,
        name: `${domain} Plugin`,
        version: '1.0.0',
        domain: domain as 'drug_discovery',
        initialize: vi.fn(),
        getWorkflowSteps: () => [],
        getDataConnectors: () => [],
        getVisualizations: () => [],
        getUIExtensions: () => [],
        cleanup: vi.fn(),
      };

      expect(plugin.domain).toBe(domain);
    });
  });
});
