/**
 * Primary Screening Tests (SCRN-PRI)
 * 1次スクリーニング - ルールベースのフィルタリング
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  PrimaryScreening,
  ScreeningFilter,
  FilterCondition,
  ScreeningCandidate,
  ScreeningResult,
  DrugDiscoveryFilters,
  MaterialsFilters,
  FilterPreset,
} from '../../src/screening/primary-screening';

describe('Primary Screening (SCRN-PRI)', () => {
  let screening: PrimaryScreening;

  beforeEach(() => {
    screening = new PrimaryScreening();
  });

  describe('filter configuration (SCRN-PRI-001)', () => {
    it('should support rule-based filtering', () => {
      const filter: ScreeningFilter = {
        id: 'mw-filter',
        name: 'Molecular Weight Filter',
        field: 'molecularWeight',
        condition: 'between',
        min: 200,
        max: 500,
      };

      screening.addFilter(filter);
      expect(screening.getFilters()).toHaveLength(1);
    });

    it('should support multiple filter conditions', () => {
      const conditions: FilterCondition[] = [
        'equals',
        'notEquals',
        'greaterThan',
        'lessThan',
        'between',
        'contains',
        'matches',
      ];

      conditions.forEach((condition) => {
        expect(screening.isValidCondition(condition)).toBe(true);
      });
    });

    it('should chain multiple filters with AND logic', () => {
      screening.addFilter({
        id: 'mw',
        name: 'MW',
        field: 'molecularWeight',
        condition: 'lessThan',
        value: 500,
      });

      screening.addFilter({
        id: 'logp',
        name: 'LogP',
        field: 'logP',
        condition: 'lessThan',
        value: 5,
      });

      expect(screening.getFilters()).toHaveLength(2);
    });
  });

  describe('drug discovery filters (SCRN-PRI-002)', () => {
    it('should filter by molecular weight range', () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: { molecularWeight: 250 } },
        { id: 'c2', data: { molecularWeight: 600 } },
        { id: 'c3', data: { molecularWeight: 450 } },
      ];

      screening.addFilter(DrugDiscoveryFilters.molecularWeight(200, 500));
      const results = screening.apply(candidates);

      expect(results.passed).toHaveLength(2);
      expect(results.passed.map((c) => c.id)).toContain('c1');
      expect(results.passed.map((c) => c.id)).toContain('c3');
    });

    it('should filter by logP range', () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: { logP: 2.5 } },
        { id: 'c2', data: { logP: 6.0 } },
        { id: 'c3', data: { logP: 4.8 } },
      ];

      screening.addFilter(DrugDiscoveryFilters.logP(-0.4, 5.6));
      const results = screening.apply(candidates);

      expect(results.passed).toHaveLength(2);
    });

    it('should filter by TPSA range', () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: { tpsa: 80 } },
        { id: 'c2', data: { tpsa: 160 } },
      ];

      screening.addFilter(DrugDiscoveryFilters.tpsa(0, 140));
      const results = screening.apply(candidates);

      expect(results.passed).toHaveLength(1);
      expect(results.passed[0]?.id).toBe('c1');
    });

    it('should filter by rotatable bond count', () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: { rotatableBonds: 5 } },
        { id: 'c2', data: { rotatableBonds: 15 } },
      ];

      screening.addFilter(DrugDiscoveryFilters.rotatableBonds(0, 10));
      const results = screening.apply(candidates);

      expect(results.passed).toHaveLength(1);
    });

    it('should apply Lipinski Rule of Five', () => {
      const candidates: ScreeningCandidate[] = [
        {
          id: 'drug-like',
          data: {
            molecularWeight: 400,
            logP: 3.5,
            hBondDonors: 2,
            hBondAcceptors: 5,
          },
        },
        {
          id: 'non-drug-like',
          data: {
            molecularWeight: 600,
            logP: 6.0,
            hBondDonors: 6,
            hBondAcceptors: 12,
          },
        },
      ];

      screening.addFilter(DrugDiscoveryFilters.lipinskiRuleOfFive());
      const results = screening.apply(candidates);

      expect(results.passed).toHaveLength(1);
      expect(results.passed[0]?.id).toBe('drug-like');
    });

    it('should apply Veber rules', () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: { tpsa: 100, rotatableBonds: 8 } },
        { id: 'c2', data: { tpsa: 150, rotatableBonds: 12 } },
      ];

      screening.addFilter(DrugDiscoveryFilters.veberRules());
      const results = screening.apply(candidates);

      expect(results.passed).toHaveLength(1);
    });
  });

  describe('materials science filters (SCRN-PRI-003)', () => {
    it('should filter by element composition constraints', () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'm1', data: { elements: ['Li', 'Co', 'O'] } },
        { id: 'm2', data: { elements: ['Pb', 'S'] } },
        { id: 'm3', data: { elements: ['Li', 'Fe', 'P', 'O'] } },
      ];

      screening.addFilter(
        MaterialsFilters.elementConstraint({
          required: ['Li', 'O'],
          excluded: ['Pb', 'Cd', 'Hg'],
        })
      );

      const results = screening.apply(candidates);
      expect(results.passed).toHaveLength(2);
    });

    it('should filter by target property range', () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'm1', data: { bandgap: 1.5 } },
        { id: 'm2', data: { bandgap: 0.3 } },
        { id: 'm3', data: { bandgap: 2.8 } },
      ];

      screening.addFilter(MaterialsFilters.propertyRange('bandgap', 1.0, 2.5));
      const results = screening.apply(candidates);

      expect(results.passed).toHaveLength(1);
      expect(results.passed[0]?.id).toBe('m1');
    });

    it('should filter by similarity to known structures', () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'm1', data: { structureSimilarity: 0.95 } },
        { id: 'm2', data: { structureSimilarity: 0.45 } },
        { id: 'm3', data: { structureSimilarity: 0.78 } },
      ];

      screening.addFilter(MaterialsFilters.similarityThreshold(0.7));
      const results = screening.apply(candidates);

      expect(results.passed).toHaveLength(2);
    });

    it('should filter by synthesizability score', () => {
      const candidates: ScreeningCandidate[] = [
        { id: 'm1', data: { synthesizability: 0.85 } },
        { id: 'm2', data: { synthesizability: 0.35 } },
      ];

      screening.addFilter(MaterialsFilters.synthesizability(0.5));
      const results = screening.apply(candidates);

      expect(results.passed).toHaveLength(1);
    });
  });

  describe('custom filters (SCRN-PRI-004)', () => {
    it('should support user-defined filter functions', () => {
      const customFilter: ScreeningFilter = {
        id: 'custom-1',
        name: 'Custom Filter',
        field: 'custom',
        condition: 'custom',
        customFn: (candidate) => {
          const score = candidate.data.score as number;
          return score > 0.5 && score < 0.9;
        },
      };

      screening.addFilter(customFilter);

      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: { score: 0.7 } },
        { id: 'c2', data: { score: 0.3 } },
        { id: 'c3', data: { score: 0.95 } },
      ];

      const results = screening.apply(candidates);
      expect(results.passed).toHaveLength(1);
      expect(results.passed[0]?.id).toBe('c1');
    });

    it('should support formula-based thresholds', () => {
      const formulaFilter: ScreeningFilter = {
        id: 'formula-1',
        name: 'Formula Filter',
        field: 'computed',
        condition: 'formula',
        formula: '(data.value1 + data.value2) / 2 > 50',
      };

      screening.addFilter(formulaFilter);

      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: { value1: 40, value2: 80 } }, // avg = 60 > 50 ✓
        { id: 'c2', data: { value1: 20, value2: 30 } }, // avg = 25 < 50 ✗
      ];

      const results = screening.apply(candidates);
      expect(results.passed).toHaveLength(1);
    });
  });

  describe('exclusion reasons (SCRN-PRI-005)', () => {
    it('should record exclusion reason for each filtered candidate', () => {
      screening.addFilter({
        id: 'mw-filter',
        name: 'Molecular Weight',
        field: 'molecularWeight',
        condition: 'lessThan',
        value: 500,
      });

      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: { molecularWeight: 300 } },
        { id: 'c2', data: { molecularWeight: 600 } },
      ];

      const results = screening.apply(candidates);

      expect(results.excluded).toHaveLength(1);
      expect(results.excluded[0]?.candidate.id).toBe('c2');
      expect(results.excluded[0]?.reasons).toHaveLength(1);
      expect(results.excluded[0]?.reasons[0]).toContain('Molecular Weight');
    });

    it('should record multiple exclusion reasons when multiple filters fail', () => {
      screening.addFilter({
        id: 'mw',
        name: 'MW Filter',
        field: 'molecularWeight',
        condition: 'lessThan',
        value: 500,
      });
      screening.addFilter({
        id: 'logp',
        name: 'LogP Filter',
        field: 'logP',
        condition: 'lessThan',
        value: 5,
      });

      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: { molecularWeight: 600, logP: 6.5 } },
      ];

      const results = screening.apply(candidates);

      expect(results.excluded[0]?.reasons).toHaveLength(2);
    });
  });

  describe('filter presets (SCRN-PRI-006)', () => {
    it('should save filter combination as preset', () => {
      screening.addFilter(DrugDiscoveryFilters.molecularWeight(200, 500));
      screening.addFilter(DrugDiscoveryFilters.logP(-0.4, 5.6));

      const preset = screening.saveAsPreset('drug-like-filters', 'Drug-like Filters');

      expect(preset.id).toBe('drug-like-filters');
      expect(preset.name).toBe('Drug-like Filters');
      expect(preset.filters).toHaveLength(2);
    });

    it('should load preset and apply filters', () => {
      const preset: FilterPreset = {
        id: 'ro5',
        name: 'Rule of Five',
        filters: [
          DrugDiscoveryFilters.molecularWeight(0, 500),
          DrugDiscoveryFilters.logP(-Infinity, 5),
        ],
      };

      screening.loadPreset(preset);

      expect(screening.getFilters()).toHaveLength(2);
    });

    it('should list available presets', () => {
      const presets = screening.getBuiltInPresets();

      expect(presets).toContainEqual(
        expect.objectContaining({ id: 'lipinski-ro5' })
      );
      expect(presets).toContainEqual(
        expect.objectContaining({ id: 'veber-rules' })
      );
    });
  });

  describe('funnel visualization data (SCRN-PRI-007)', () => {
    it('should return candidate count change statistics', () => {
      screening.addFilter({
        id: 'mw',
        name: 'MW',
        field: 'molecularWeight',
        condition: 'lessThan',
        value: 500,
      });

      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: { molecularWeight: 300 } },
        { id: 'c2', data: { molecularWeight: 400 } },
        { id: 'c3', data: { molecularWeight: 600 } },
        { id: 'c4', data: { molecularWeight: 550 } },
      ];

      const results = screening.apply(candidates);

      expect(results.statistics.inputCount).toBe(4);
      expect(results.statistics.passedCount).toBe(2);
      expect(results.statistics.excludedCount).toBe(2);
      expect(results.statistics.passRate).toBe(0.5);
    });

    it('should provide per-filter statistics', () => {
      screening.addFilter({
        id: 'mw',
        name: 'MW',
        field: 'molecularWeight',
        condition: 'lessThan',
        value: 500,
      });
      screening.addFilter({
        id: 'logp',
        name: 'LogP',
        field: 'logP',
        condition: 'lessThan',
        value: 5,
      });

      const candidates: ScreeningCandidate[] = [
        { id: 'c1', data: { molecularWeight: 300, logP: 3 } },
        { id: 'c2', data: { molecularWeight: 600, logP: 3 } }, // fails MW
        { id: 'c3', data: { molecularWeight: 400, logP: 6 } }, // fails LogP
        { id: 'c4', data: { molecularWeight: 600, logP: 6 } }, // fails both
      ];

      const results = screening.apply(candidates);

      expect(results.filterStats['mw']?.failedCount).toBe(2);
      expect(results.filterStats['logp']?.failedCount).toBe(2);
    });
  });

  describe('batch processing', () => {
    it('should efficiently process large candidate sets', () => {
      screening.addFilter(DrugDiscoveryFilters.molecularWeight(200, 500));

      // Create 10000 candidates
      const candidates: ScreeningCandidate[] = Array.from(
        { length: 10000 },
        (_, i) => ({
          id: `c${i}`,
          data: { molecularWeight: 100 + (i % 600) },
        })
      );

      const startTime = Date.now();
      const results = screening.apply(candidates);
      const duration = Date.now() - startTime;

      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
      expect(results.statistics.inputCount).toBe(10000);
    });
  });
});
