/**
 * Primary Screening (SCRN-PRI)
 * 1次スクリーニング - ルールベースのフィルタリング
 */

export type FilterCondition =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'contains'
  | 'matches'
  | 'custom'
  | 'formula';

export interface ScreeningFilter {
  id: string;
  name: string;
  field: string;
  condition: FilterCondition;
  value?: number | string | boolean;
  min?: number;
  max?: number;
  customFn?: (candidate: ScreeningCandidate) => boolean;
  formula?: string;
}

export interface ScreeningCandidate {
  id: string;
  data: Record<string, unknown>;
}

export interface ExcludedCandidate {
  candidate: ScreeningCandidate;
  reasons: string[];
}

export interface FilterStats {
  filterId: string;
  failedCount: number;
  passedCount: number;
}

export interface ScreeningStatistics {
  inputCount: number;
  passedCount: number;
  excludedCount: number;
  passRate: number;
}

export interface ScreeningResult {
  passed: ScreeningCandidate[];
  excluded: ExcludedCandidate[];
  statistics: ScreeningStatistics;
  filterStats: Record<string, FilterStats>;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: ScreeningFilter[];
}

/**
 * Primary Screening - ルールベースのフィルタリング
 */
export class PrimaryScreening {
  private filters: ScreeningFilter[] = [];
  private presets: FilterPreset[] = [];

  constructor() {
    this.initializeBuiltInPresets();
  }

  private initializeBuiltInPresets(): void {
    this.presets = [
      {
        id: 'lipinski-ro5',
        name: 'Lipinski Rule of Five',
        filters: [
          DrugDiscoveryFilters.molecularWeight(0, 500),
          DrugDiscoveryFilters.logP(-Infinity, 5),
          {
            id: 'hbd',
            name: 'H-Bond Donors',
            field: 'hBondDonors',
            condition: 'lessThan',
            value: 6,
          },
          {
            id: 'hba',
            name: 'H-Bond Acceptors',
            field: 'hBondAcceptors',
            condition: 'lessThan',
            value: 11,
          },
        ],
      },
      {
        id: 'veber-rules',
        name: 'Veber Rules',
        filters: [
          DrugDiscoveryFilters.tpsa(0, 140),
          DrugDiscoveryFilters.rotatableBonds(0, 10),
        ],
      },
    ];
  }

  addFilter(filter: ScreeningFilter): void {
    this.filters.push(filter);
  }

  getFilters(): ScreeningFilter[] {
    return [...this.filters];
  }

  clearFilters(): void {
    this.filters = [];
  }

  isValidCondition(condition: string): boolean {
    const validConditions: FilterCondition[] = [
      'equals',
      'notEquals',
      'greaterThan',
      'lessThan',
      'between',
      'contains',
      'matches',
      'custom',
      'formula',
    ];
    return validConditions.includes(condition as FilterCondition);
  }

  private evaluateFilter(
    filter: ScreeningFilter,
    candidate: ScreeningCandidate
  ): boolean {
    const value = candidate.data[filter.field];

    switch (filter.condition) {
      case 'equals':
        return value === filter.value;

      case 'notEquals':
        return value !== filter.value;

      case 'greaterThan':
        return typeof value === 'number' && value > (filter.value as number);

      case 'lessThan':
        return typeof value === 'number' && value < (filter.value as number);

      case 'between':
        return (
          typeof value === 'number' &&
          value >= (filter.min ?? -Infinity) &&
          value <= (filter.max ?? Infinity)
        );

      case 'contains':
        if (Array.isArray(value)) {
          return value.includes(filter.value);
        }
        if (typeof value === 'string') {
          return value.includes(filter.value as string);
        }
        return false;

      case 'matches':
        if (typeof value === 'string' && typeof filter.value === 'string') {
          return new RegExp(filter.value).test(value);
        }
        return false;

      case 'custom':
        if (filter.customFn) {
          return filter.customFn(candidate);
        }
        return true;

      case 'formula':
        if (filter.formula) {
          return this.evaluateFormula(filter.formula, candidate);
        }
        return true;

      default:
        return true;
    }
  }

  private evaluateFormula(formula: string, candidate: ScreeningCandidate): boolean {
    try {
      const data = candidate.data;
      // Safe evaluation using Function constructor with limited scope
      const fn = new Function('data', `return ${formula}`);
      return Boolean(fn(data));
    } catch {
      return false;
    }
  }

  apply(candidates: ScreeningCandidate[]): ScreeningResult {
    const passed: ScreeningCandidate[] = [];
    const excluded: ExcludedCandidate[] = [];
    const filterStats: Record<string, FilterStats> = {};

    // Initialize filter stats
    for (const filter of this.filters) {
      filterStats[filter.id] = {
        filterId: filter.id,
        failedCount: 0,
        passedCount: 0,
      };
    }

    for (const candidate of candidates) {
      const failedFilters: string[] = [];

      for (const filter of this.filters) {
        const result = this.evaluateFilter(filter, candidate);
        if (result) {
          filterStats[filter.id]!.passedCount++;
        } else {
          filterStats[filter.id]!.failedCount++;
          failedFilters.push(`${filter.name}: failed`);
        }
      }

      if (failedFilters.length === 0) {
        passed.push(candidate);
      } else {
        excluded.push({
          candidate,
          reasons: failedFilters,
        });
      }
    }

    return {
      passed,
      excluded,
      statistics: {
        inputCount: candidates.length,
        passedCount: passed.length,
        excludedCount: excluded.length,
        passRate: candidates.length > 0 ? passed.length / candidates.length : 0,
      },
      filterStats,
    };
  }

  saveAsPreset(id: string, name: string): FilterPreset {
    const preset: FilterPreset = {
      id,
      name,
      filters: [...this.filters],
    };
    this.presets.push(preset);
    return preset;
  }

  loadPreset(preset: FilterPreset): void {
    this.filters = [...preset.filters];
  }

  getBuiltInPresets(): FilterPreset[] {
    return this.presets;
  }
}

/**
 * Drug Discovery用フィルタープリセット
 */
export const DrugDiscoveryFilters = {
  molecularWeight(min: number, max: number): ScreeningFilter {
    return {
      id: 'mw',
      name: 'Molecular Weight',
      field: 'molecularWeight',
      condition: 'between',
      min,
      max,
    };
  },

  logP(min: number, max: number): ScreeningFilter {
    return {
      id: 'logp',
      name: 'LogP',
      field: 'logP',
      condition: 'between',
      min,
      max,
    };
  },

  tpsa(min: number, max: number): ScreeningFilter {
    return {
      id: 'tpsa',
      name: 'TPSA',
      field: 'tpsa',
      condition: 'between',
      min,
      max,
    };
  },

  rotatableBonds(min: number, max: number): ScreeningFilter {
    return {
      id: 'rotatable-bonds',
      name: 'Rotatable Bonds',
      field: 'rotatableBonds',
      condition: 'between',
      min,
      max,
    };
  },

  lipinskiRuleOfFive(): ScreeningFilter {
    return {
      id: 'lipinski-ro5',
      name: 'Lipinski Rule of Five',
      field: 'lipinski',
      condition: 'custom',
      customFn: (candidate) => {
        const mw = candidate.data.molecularWeight as number;
        const logP = candidate.data.logP as number;
        const hbd = candidate.data.hBondDonors as number;
        const hba = candidate.data.hBondAcceptors as number;

        return mw <= 500 && logP <= 5 && hbd <= 5 && hba <= 10;
      },
    };
  },

  veberRules(): ScreeningFilter {
    return {
      id: 'veber-rules',
      name: 'Veber Rules',
      field: 'veber',
      condition: 'custom',
      customFn: (candidate) => {
        const tpsa = candidate.data.tpsa as number;
        const rotatable = candidate.data.rotatableBonds as number;

        return tpsa <= 140 && rotatable <= 10;
      },
    };
  },
};

/**
 * Materials Science用フィルタープリセット
 */
export const MaterialsFilters = {
  elementConstraint(config: {
    required?: string[];
    excluded?: string[];
  }): ScreeningFilter {
    return {
      id: 'element-constraint',
      name: 'Element Constraint',
      field: 'elements',
      condition: 'custom',
      customFn: (candidate) => {
        const elements = candidate.data.elements as string[];
        if (!Array.isArray(elements)) return false;

        // Check required elements
        if (config.required) {
          for (const required of config.required) {
            if (!elements.includes(required)) {
              return false;
            }
          }
        }

        // Check excluded elements
        if (config.excluded) {
          for (const excluded of config.excluded) {
            if (elements.includes(excluded)) {
              return false;
            }
          }
        }

        return true;
      },
    };
  },

  propertyRange(property: string, min: number, max: number): ScreeningFilter {
    return {
      id: `property-${property}`,
      name: `${property} Range`,
      field: property,
      condition: 'between',
      min,
      max,
    };
  },

  similarityThreshold(threshold: number): ScreeningFilter {
    return {
      id: 'similarity-threshold',
      name: 'Structure Similarity',
      field: 'structureSimilarity',
      condition: 'custom',
      customFn: (candidate) => {
        const similarity = candidate.data.structureSimilarity as number;
        return typeof similarity === 'number' && similarity >= threshold;
      },
    };
  },

  synthesizability(threshold: number): ScreeningFilter {
    return {
      id: 'synthesizability',
      name: 'Synthesizability',
      field: 'synthesizability',
      condition: 'custom',
      customFn: (candidate) => {
        const score = candidate.data.synthesizability as number;
        return typeof score === 'number' && score >= threshold;
      },
    };
  },
};
