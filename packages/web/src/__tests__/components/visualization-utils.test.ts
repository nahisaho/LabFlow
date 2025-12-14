/**
 * Visualization Utils Tests
 */
import { describe, it, expect } from 'vitest';
import {
  getColorFromScale,
  getChartColor,
  getElementColor,
  createDataSeries,
  createHeatmapData,
  calculateHistogramBins,
  calculateStatistics,
  calculateCorrelation,
  linearRegression,
  formatNumber,
  formatWithUnit,
  calculateDataRange,
  calculateAxisRange,
  generateLinePath,
} from '@/components/visualization/utils';

describe('Visualization Utils', () => {
  describe('getColorFromScale', () => {
    it('should return color from viridis scale', () => {
      const color = getColorFromScale(0.5, 0, 1, 'viridis');
      expect(color).toBeTruthy();
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should handle min value', () => {
      const color = getColorFromScale(0, 0, 1, 'viridis');
      expect(color).toBe('#440154');
    });

    it('should handle max value', () => {
      const color = getColorFromScale(1, 0, 1, 'viridis');
      expect(color).toBe('#fee825');
    });

    it('should handle different scales', () => {
      const plasma = getColorFromScale(0.5, 0, 1, 'plasma');
      const blues = getColorFromScale(0.5, 0, 1, 'blues');
      expect(plasma).not.toBe(blues);
    });
  });

  describe('getChartColor', () => {
    it('should return chart color by index', () => {
      const color0 = getChartColor(0);
      const color1 = getChartColor(1);
      expect(color0).toBe('#3b82f6');
      expect(color1).toBe('#10b981');
    });

    it('should wrap around for large indices', () => {
      const color10 = getChartColor(10);
      expect(color10).toBe('#3b82f6'); // Same as index 0
    });
  });

  describe('getElementColor', () => {
    it('should return correct colors for common elements', () => {
      expect(getElementColor('H')).toBe('#FFFFFF');
      expect(getElementColor('C')).toBe('#909090');
      expect(getElementColor('N')).toBe('#3050F8');
      expect(getElementColor('O')).toBe('#FF0D0D');
    });

    it('should return default color for unknown elements', () => {
      expect(getElementColor('Xx')).toBe('#FF1493');
    });
  });

  describe('createDataSeries', () => {
    it('should create data series from arrays', () => {
      const series = createDataSeries('test', 'Test Series', [1, 2, 3], [4, 5, 6]);
      expect(series.id).toBe('test');
      expect(series.name).toBe('Test Series');
      expect(series.data).toHaveLength(3);
      expect(series.data[0]).toEqual({ x: 1, y: 4 });
    });

    it('should include optional properties', () => {
      const series = createDataSeries('test', 'Test', [1], [2], {
        nameJa: 'テスト',
        color: '#ff0000',
      });
      expect(series.nameJa).toBe('テスト');
      expect(series.color).toBe('#ff0000');
    });

    it('should throw error for mismatched arrays', () => {
      expect(() => createDataSeries('test', 'Test', [1, 2], [1])).toThrow();
    });
  });

  describe('createHeatmapData', () => {
    it('should create heatmap data from 2D array', () => {
      const values = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      const heatmap = createHeatmapData(values);
      expect(heatmap.values).toEqual(values);
      expect(heatmap.xLabels).toHaveLength(3);
      expect(heatmap.yLabels).toHaveLength(2);
      expect(heatmap.minValue).toBe(1);
      expect(heatmap.maxValue).toBe(6);
    });

    it('should use custom labels', () => {
      const values = [[1, 2]];
      const heatmap = createHeatmapData(values, ['A', 'B'], ['Row1']);
      expect(heatmap.xLabels).toEqual(['A', 'B']);
      expect(heatmap.yLabels).toEqual(['Row1']);
    });
  });

  describe('calculateHistogramBins', () => {
    it('should calculate histogram bins', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const { bins, counts } = calculateHistogramBins(values, 5);
      expect(bins).toHaveLength(6); // binCount + 1
      expect(counts).toHaveLength(5);
      expect(counts.reduce((a, b) => a + b, 0)).toBe(10);
    });

    it('should handle empty array', () => {
      const { bins, counts } = calculateHistogramBins([]);
      expect(bins).toHaveLength(0);
      expect(counts).toHaveLength(0);
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate basic statistics', () => {
      const values = [1, 2, 3, 4, 5];
      const stats = calculateStatistics(values);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(5);
      expect(stats.mean).toBe(3);
      expect(stats.median).toBe(3);
      expect(stats.count).toBe(5);
      expect(stats.std).toBeCloseTo(Math.sqrt(2), 5);
    });

    it('should handle empty array', () => {
      const stats = calculateStatistics([]);
      expect(stats.count).toBe(0);
      expect(stats.mean).toBe(0);
    });

    it('should calculate median for even count', () => {
      const stats = calculateStatistics([1, 2, 3, 4]);
      expect(stats.median).toBe(2.5);
    });
  });

  describe('calculateCorrelation', () => {
    it('should calculate perfect positive correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const corr = calculateCorrelation(x, y);
      expect(corr).toBeCloseTo(1, 5);
    });

    it('should calculate perfect negative correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2];
      const corr = calculateCorrelation(x, y);
      expect(corr).toBeCloseTo(-1, 5);
    });

    it('should handle no correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [5, 5, 5, 5, 5]; // Constant
      const corr = calculateCorrelation(x, y);
      expect(corr).toBe(0);
    });
  });

  describe('linearRegression', () => {
    it('should calculate linear regression', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10]; // y = 2x
      const { slope, intercept, r2 } = linearRegression(x, y);
      expect(slope).toBeCloseTo(2, 5);
      expect(intercept).toBeCloseTo(0, 5);
      expect(r2).toBeCloseTo(1, 5);
    });

    it('should handle empty arrays', () => {
      const { slope, intercept, r2 } = linearRegression([], []);
      expect(slope).toBe(0);
      expect(intercept).toBe(0);
      expect(r2).toBe(0);
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with default precision', () => {
      expect(formatNumber(3.14159)).toBe('3.14');
    });

    it('should use scientific notation for large numbers', () => {
      const formatted = formatNumber(1234567);
      expect(formatted).toMatch(/e\+/);
    });

    it('should use scientific notation for small numbers', () => {
      const formatted = formatNumber(0.0001);
      expect(formatted).toMatch(/e-/);
    });

    it('should support scientific notation option', () => {
      const formatted = formatNumber(123, { notation: 'scientific' });
      expect(formatted).toBe('1.230e+2');
    });
  });

  describe('formatWithUnit', () => {
    it('should format with unit', () => {
      expect(formatWithUnit(3.14, 'eV')).toBe('3.14 eV');
    });

    it('should work without unit', () => {
      expect(formatWithUnit(3.14)).toBe('3.14');
    });
  });

  describe('calculateDataRange', () => {
    it('should calculate data range from series', () => {
      const series = [
        { id: '1', name: 'A', data: [{ x: 1, y: 10 }, { x: 5, y: 50 }] },
        { id: '2', name: 'B', data: [{ x: 2, y: 20 }, { x: 4, y: 40 }] },
      ];
      const range = calculateDataRange(series);
      expect(range.xMin).toBe(1);
      expect(range.xMax).toBe(5);
      expect(range.yMin).toBe(10);
      expect(range.yMax).toBe(50);
    });

    it('should handle empty series', () => {
      const range = calculateDataRange([]);
      expect(range.xMin).toBe(0);
      expect(range.xMax).toBe(1);
    });
  });

  describe('calculateAxisRange', () => {
    it('should add padding to range', () => {
      const range = calculateAxisRange(0, 100, 0.1);
      expect(range.min).toBe(-10);
      expect(range.max).toBe(110);
    });
  });

  describe('generateLinePath', () => {
    it('should generate SVG path', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 5 },
      ];
      const path = generateLinePath(points);
      expect(path).toBe('M 0 0 L 10 10 L 20 5');
    });

    it('should handle empty points', () => {
      expect(generateLinePath([])).toBe('');
    });
  });
});
