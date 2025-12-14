/**
 * Model Catalog Adapter Tests
 */
import { describe, it, expect } from 'vitest';
import {
  coreToWebModel,
  coreToWebModels,
  getStandardWebModels,
  CoreModelMetadata,
} from '@/components/model-catalog/adapter';

const mockCoreModel: CoreModelMetadata = {
  id: 'mattergen',
  name: 'MatterGen',
  version: '1.0.0',
  domain: 'materials',
  taskTypes: ['generation'],
  inputFormats: ['JSON', 'Text'],
  outputFormats: ['CIF', 'JSON'],
  estimatedTime: '5〜30分',
  license: 'MIT',
  description: 'Crystal structure generation',
  descriptionJa: '結晶構造生成モデル',
  exampleCode: `from mattergen import MatterGen
model = MatterGen()
result = model.generate(num_samples=10)`,
  exampleExplanationJa: 'MatterGenの使用例です。',
};

describe('Model Catalog Adapter', () => {
  describe('coreToWebModel', () => {
    it('should convert core model to web model format', () => {
      const webModel = coreToWebModel(mockCoreModel);
      
      expect(webModel.id).toBe('mattergen');
      expect(webModel.name).toBe('MatterGen');
      expect(webModel.version).toBe('1.0.0');
      expect(webModel.domain).toBe('materials-science');
      expect(webModel.description).toBe('Crystal structure generation');
      expect(webModel.descriptionJa).toBe('結晶構造生成モデル');
    });

    it('should include task types array', () => {
      const webModel = coreToWebModel(mockCoreModel);
      expect(webModel.taskTypes).toBeDefined();
      expect(webModel.taskTypes).toContain('generation');
    });

    it('should include estimated time', () => {
      const webModel = coreToWebModel(mockCoreModel);
      expect(webModel.estimatedTime).toBe('5〜30分');
    });

    it('should convert input/output formats', () => {
      const webModel = coreToWebModel(mockCoreModel);
      expect(webModel.inputFormats).toContain('JSON');
      expect(webModel.outputFormats).toContain('CIF');
    });

    it('should include code example', () => {
      const webModel = coreToWebModel(mockCoreModel);
      expect(webModel.exampleCode).toContain('from mattergen');
    });

    it('should add default parameters', () => {
      const webModel = coreToWebModel(mockCoreModel);
      expect(webModel.parameters).toBeDefined();
      expect(webModel.parameters.length).toBeGreaterThan(0);
    });

    it('should add tags based on model', () => {
      const webModel = coreToWebModel(mockCoreModel);
      expect(webModel.tags).toBeDefined();
      expect(webModel.tags.length).toBeGreaterThan(0);
    });
  });

  describe('coreToWebModels', () => {
    it('should convert multiple core models', () => {
      const coreModels: CoreModelMetadata[] = [
        mockCoreModel,
        {
          ...mockCoreModel,
          id: 'aurora',
          name: 'Aurora',
          domain: 'climate',
          taskTypes: ['prediction'],
        },
      ];
      
      const webModels = coreToWebModels(coreModels);
      
      expect(webModels).toHaveLength(2);
      expect(webModels[0].name).toBe('MatterGen');
      expect(webModels[1].name).toBe('Aurora');
    });

    it('should return empty array for empty input', () => {
      const webModels = coreToWebModels([]);
      expect(webModels).toHaveLength(0);
    });
  });

  describe('getStandardWebModels', () => {
    it('should return all 5 standard models', () => {
      const models = getStandardWebModels();
      expect(models).toHaveLength(5);
    });

    it('should include MatterGen', () => {
      const models = getStandardWebModels();
      const mattergen = models.find(m => m.id === 'mattergen');
      expect(mattergen).toBeDefined();
      expect(mattergen?.name).toBe('MatterGen');
      expect(mattergen?.domain).toBe('materials-science');
    });

    it('should include MatterSim', () => {
      const models = getStandardWebModels();
      const mattersim = models.find(m => m.id === 'mattersim');
      expect(mattersim).toBeDefined();
      expect(mattersim?.name).toBe('MatterSim');
    });

    it('should include Aurora', () => {
      const models = getStandardWebModels();
      const aurora = models.find(m => m.id === 'aurora');
      expect(aurora).toBeDefined();
      expect(aurora?.name).toBe('Aurora');
      expect(aurora?.domain).toBe('climate');
    });

    it('should include BioEmu', () => {
      const models = getStandardWebModels();
      const bioemu = models.find(m => m.id === 'bioemu');
      expect(bioemu).toBeDefined();
      expect(bioemu?.name).toBe('BioEmu');
      expect(bioemu?.domain).toBe('genomics');
    });

    it('should include TamGen', () => {
      const models = getStandardWebModels();
      const tamgen = models.find(m => m.id === 'tamgen');
      expect(tamgen).toBeDefined();
      expect(tamgen?.name).toBe('TamGen');
      expect(tamgen?.domain).toBe('drug-discovery');
    });

    it('should have Japanese descriptions for all models', () => {
      const models = getStandardWebModels();
      models.forEach(model => {
        expect(model.descriptionJa).toBeDefined();
        expect(model.descriptionJa.length).toBeGreaterThan(0);
      });
    });

    it('should have parameters for all models', () => {
      const models = getStandardWebModels();
      models.forEach(model => {
        expect(model.parameters).toBeDefined();
        expect(model.parameters.length).toBeGreaterThan(0);
      });
    });

    it('should have code examples for all models', () => {
      const models = getStandardWebModels();
      models.forEach(model => {
        expect(model.exampleCode).toBeDefined();
        expect(model.exampleCode.length).toBeGreaterThan(0);
      });
    });

    it('should have estimated time for all models', () => {
      const models = getStandardWebModels();
      models.forEach(model => {
        expect(model.estimatedTime).toBeDefined();
      });
    });

    it('should have task types for all models', () => {
      const models = getStandardWebModels();
      models.forEach(model => {
        expect(model.taskTypes).toBeDefined();
        expect(model.taskTypes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Domain mapping', () => {
    it('should map materials domain correctly', () => {
      const webModel = coreToWebModel({
        ...mockCoreModel,
        domain: 'materials',
      });
      expect(webModel.domain).toBe('materials-science');
    });

    it('should map climate domain correctly', () => {
      const webModel = coreToWebModel({
        ...mockCoreModel,
        domain: 'climate',
      });
      expect(webModel.domain).toBe('climate');
    });

    it('should map drug-discovery domain correctly', () => {
      const webModel = coreToWebModel({
        ...mockCoreModel,
        domain: 'drug-discovery',
      });
      expect(webModel.domain).toBe('drug-discovery');
    });

    it('should map genomics domain correctly', () => {
      const webModel = coreToWebModel({
        ...mockCoreModel,
        domain: 'genomics',
      });
      expect(webModel.domain).toBe('genomics');
    });
  });
});
