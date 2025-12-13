/**
 * Model Catalog Tests
 *
 * MODL-CATA-001: Model catalog display
 * MODL-CATA-002: Model metadata
 * MODL-CATA-003: Filtering
 * MODL-CATA-004: Search
 * MODL-CATA-005: Standard models (MatterGen, MatterSim, Aurora, BioEmu, TamGen)
 * MODL-CATA-006: Usage examples
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  ModelCatalog,
  ModelMetadata,
  ModelDomain,
  ModelTaskType,
  InputFormat,
  OutputFormat,
  STANDARD_MODELS,
  createModelCatalog,
} from '../../src/model-catalog/model-catalog';

describe('Model Catalog (MODL-CATA)', () => {
  let catalog: ModelCatalog;

  beforeEach(() => {
    catalog = createModelCatalog();
  });

  describe('Catalog Management (MODL-CATA-001)', () => {
    it('should list all available models', () => {
      const models = catalog.listModels();

      expect(models).toBeDefined();
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return model count', () => {
      const count = catalog.getModelCount();

      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Model Metadata (MODL-CATA-002)', () => {
    it('should display model name', () => {
      const models = catalog.listModels();
      const model = models[0];

      expect(model.name).toBeDefined();
      expect(model.name.length).toBeGreaterThan(0);
    });

    it('should display model version', () => {
      const models = catalog.listModels();
      const model = models[0];

      expect(model.version).toBeDefined();
      expect(model.version).toMatch(/^\d+\.\d+/);
    });

    it('should display target domain', () => {
      const models = catalog.listModels();
      const model = models[0];

      expect(model.domain).toBeDefined();
      expect(Object.values(ModelDomain)).toContain(model.domain);
    });

    it('should display input format', () => {
      const models = catalog.listModels();
      const model = models[0];

      expect(model.inputFormats).toBeDefined();
      expect(model.inputFormats.length).toBeGreaterThan(0);
    });

    it('should display output format', () => {
      const models = catalog.listModels();
      const model = models[0];

      expect(model.outputFormats).toBeDefined();
      expect(model.outputFormats.length).toBeGreaterThan(0);
    });

    it('should display estimated execution time', () => {
      const models = catalog.listModels();
      const model = models[0];

      expect(model.estimatedTime).toBeDefined();
      expect(model.estimatedTime).toMatch(/\d+.*[秒分時間]/);
    });

    it('should display license', () => {
      const models = catalog.listModels();
      const model = models[0];

      expect(model.license).toBeDefined();
      expect(model.license.length).toBeGreaterThan(0);
    });
  });

  describe('Filtering (MODL-CATA-003)', () => {
    it('should filter by domain', () => {
      const materials = catalog.filterByDomain(ModelDomain.Materials);

      expect(materials.length).toBeGreaterThan(0);
      materials.forEach((model) => {
        expect(model.domain).toBe(ModelDomain.Materials);
      });
    });

    it('should filter by task type', () => {
      const generation = catalog.filterByTaskType(ModelTaskType.Generation);

      expect(generation.length).toBeGreaterThan(0);
      generation.forEach((model) => {
        expect(model.taskTypes).toContain(ModelTaskType.Generation);
      });
    });

    it('should filter by input format', () => {
      const fastaModels = catalog.filterByInputFormat(InputFormat.FASTA);

      expect(fastaModels.length).toBeGreaterThan(0);
      fastaModels.forEach((model) => {
        expect(model.inputFormats).toContain(InputFormat.FASTA);
      });
    });

    it('should combine multiple filters', () => {
      const filtered = catalog.filter({
        domain: ModelDomain.Materials,
        taskType: ModelTaskType.Generation,
      });

      filtered.forEach((model) => {
        expect(model.domain).toBe(ModelDomain.Materials);
        expect(model.taskTypes).toContain(ModelTaskType.Generation);
      });
    });
  });

  describe('Search (MODL-CATA-004)', () => {
    it('should search by model name', () => {
      const results = catalog.search('MatterGen');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('MatterGen');
    });

    it('should search by description', () => {
      const results = catalog.search('結晶構造');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', () => {
      const results = catalog.search('存在しないモデル名xyz');

      expect(results).toEqual([]);
    });

    it('should be case-insensitive', () => {
      const lower = catalog.search('mattergen');
      const upper = catalog.search('MATTERGEN');

      expect(lower.length).toBe(upper.length);
    });
  });

  describe('Standard Models (MODL-CATA-005)', () => {
    it('should include MatterGen in catalog', () => {
      const matterGen = catalog.getModel('mattergen');

      expect(matterGen).toBeDefined();
      expect(matterGen?.name).toContain('MatterGen');
    });

    it('should include MatterSim in catalog', () => {
      const matterSim = catalog.getModel('mattersim');

      expect(matterSim).toBeDefined();
      expect(matterSim?.name).toContain('MatterSim');
    });

    it('should include Aurora in catalog', () => {
      const aurora = catalog.getModel('aurora');

      expect(aurora).toBeDefined();
      expect(aurora?.name).toContain('Aurora');
    });

    it('should include BioEmu in catalog', () => {
      const bioEmu = catalog.getModel('bioemu');

      expect(bioEmu).toBeDefined();
      expect(bioEmu?.name).toContain('BioEmu');
    });

    it('should include TamGen in catalog', () => {
      const tamGen = catalog.getModel('tamgen');

      expect(tamGen).toBeDefined();
      expect(tamGen?.name).toContain('TamGen');
    });

    it('should have all 5 standard models', () => {
      expect(STANDARD_MODELS.length).toBe(5);
      expect(STANDARD_MODELS).toContain('mattergen');
      expect(STANDARD_MODELS).toContain('mattersim');
      expect(STANDARD_MODELS).toContain('aurora');
      expect(STANDARD_MODELS).toContain('bioemu');
      expect(STANDARD_MODELS).toContain('tamgen');
    });
  });

  describe('Usage Examples (MODL-CATA-006)', () => {
    it('should provide sample code for each model', () => {
      const models = catalog.listModels();

      models.forEach((model) => {
        expect(model.exampleCode).toBeDefined();
        expect(model.exampleCode.length).toBeGreaterThan(0);
      });
    });

    it('should provide Japanese explanation', () => {
      const matterGen = catalog.getModel('mattergen');

      expect(matterGen?.exampleExplanationJa).toBeDefined();
      expect(matterGen?.exampleExplanationJa).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/);
    });
  });
});

describe('Model Domains and Types', () => {
  it('should define all required domains', () => {
    expect(ModelDomain.Materials).toBe('materials');
    expect(ModelDomain.DrugDiscovery).toBe('drug-discovery');
    expect(ModelDomain.Climate).toBe('climate');
    expect(ModelDomain.Genomics).toBe('genomics');
  });

  it('should define all required task types', () => {
    expect(ModelTaskType.Generation).toBe('generation');
    expect(ModelTaskType.Prediction).toBe('prediction');
    expect(ModelTaskType.Simulation).toBe('simulation');
    expect(ModelTaskType.Optimization).toBe('optimization');
  });

  it('should define all required input formats', () => {
    expect(InputFormat.CIF).toBe('cif');
    expect(InputFormat.FASTA).toBe('fasta');
    expect(InputFormat.PDB).toBe('pdb');
    expect(InputFormat.SMILES).toBe('smiles');
    expect(InputFormat.GeoJSON).toBe('geojson');
  });

  it('should define all required output formats', () => {
    expect(OutputFormat.CIF).toBe('cif');
    expect(OutputFormat.PDB).toBe('pdb');
    expect(OutputFormat.SMILES).toBe('smiles');
    expect(OutputFormat.JSON).toBe('json');
    expect(OutputFormat.CSV).toBe('csv');
  });
});
