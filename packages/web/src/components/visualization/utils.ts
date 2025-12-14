/**
 * Visualization Utilities
 * 
 * 可視化のためのユーティリティ関数
 */

import type {
  DataPoint,
  DataSeries,
  HeatmapData,
  PropertyDistribution,
  ColorScale,
} from './types';

// ============================================================================
// カラースケール
// ============================================================================

/**
 * カラースケールのカラーマップ定義
 */
const COLOR_SCALES: Record<ColorScale, string[]> = {
  viridis: ['#440154', '#482878', '#3e4a89', '#31688e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'],
  plasma: ['#0d0887', '#46039f', '#7201a8', '#9c179e', '#bd3786', '#d8576b', '#ed7953', '#fb9f3a', '#fdca26'],
  inferno: ['#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#f7d13d'],
  magma: ['#000004', '#180f3d', '#440f76', '#721f81', '#9e2f7f', '#cd4071', '#f1605d', '#fd9668', '#fcfdbf'],
  cividis: ['#00204d', '#213d6b', '#3d5a80', '#5a788e', '#799698', '#9ab4a0', '#bcd2a7', '#e0f0b5', '#ffff72'],
  blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
  greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
  reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
  spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
  coolwarm: ['#3b4cc0', '#6688ee', '#88bbff', '#aaddff', '#dddddd', '#ffccaa', '#ff9966', '#dd6644', '#b40426'],
};

/**
 * カラースケールから色を取得
 */
export function getColorFromScale(
  value: number,
  min: number,
  max: number,
  scale: ColorScale = 'viridis'
): string {
  const colors = COLOR_SCALES[scale];
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const index = Math.floor(normalized * (colors.length - 1));
  return colors[index];
}

/**
 * カラースケールのグラデーションCSS生成
 */
export function getColorScaleGradient(scale: ColorScale = 'viridis'): string {
  const colors = COLOR_SCALES[scale];
  return `linear-gradient(to right, ${colors.join(', ')})`;
}

// ============================================================================
// デフォルトカラーパレット
// ============================================================================

/**
 * チャート用デフォルトカラー
 */
export const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899', // pink
  '#6366f1', // indigo
];

/**
 * インデックスからチャートカラーを取得
 */
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

// ============================================================================
// 元素カラー
// ============================================================================

/**
 * CPK配色による元素カラー
 */
export const ELEMENT_COLORS: Record<string, string> = {
  H: '#FFFFFF',
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  F: '#90E050',
  P: '#FF8000',
  S: '#FFFF30',
  Cl: '#1FF01F',
  Br: '#A62929',
  I: '#940094',
  Fe: '#E06633',
  Cu: '#C88033',
  Zn: '#7D80B0',
  Si: '#F0C8A0',
  Na: '#AB5CF2',
  K: '#8F40D4',
  Ca: '#3DFF00',
  Mg: '#8AFF00',
  Al: '#BFA6A6',
  Ti: '#BFC2C7',
  Ni: '#50D050',
  Co: '#F090A0',
  default: '#FF1493',
};

/**
 * 元素カラーを取得
 */
export function getElementColor(element: string): string {
  return ELEMENT_COLORS[element] || ELEMENT_COLORS.default;
}

// ============================================================================
// データ変換
// ============================================================================

/**
 * 配列からDataSeriesを生成
 */
export function createDataSeries(
  id: string,
  name: string,
  xValues: number[],
  yValues: number[],
  options?: { nameJa?: string; color?: string }
): DataSeries {
  if (xValues.length !== yValues.length) {
    throw new Error('X and Y arrays must have the same length');
  }

  return {
    id,
    name,
    nameJa: options?.nameJa,
    color: options?.color,
    data: xValues.map((x, i) => ({ x, y: yValues[i] })),
    visible: true,
  };
}

/**
 * 2次元配列からHeatmapDataを生成
 */
export function createHeatmapData(
  values: number[][],
  xLabels?: string[],
  yLabels?: string[]
): HeatmapData {
  const rows = values.length;
  const cols = values[0]?.length || 0;

  return {
    values,
    xLabels: xLabels || Array.from({ length: cols }, (_, i) => `${i + 1}`),
    yLabels: yLabels || Array.from({ length: rows }, (_, i) => `${i + 1}`),
    minValue: Math.min(...values.flat()),
    maxValue: Math.max(...values.flat()),
  };
}

/**
 * ヒストグラム用のビン計算
 */
export function calculateHistogramBins(
  values: number[],
  binCount: number = 20
): { bins: number[]; counts: number[] } {
  if (values.length === 0) {
    return { bins: [], counts: [] };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = (max - min) / binCount;

  const bins: number[] = [];
  const counts: number[] = new Array(binCount).fill(0);

  for (let i = 0; i <= binCount; i++) {
    bins.push(min + i * binWidth);
  }

  for (const value of values) {
    const binIndex = Math.min(
      Math.floor((value - min) / binWidth),
      binCount - 1
    );
    counts[binIndex]++;
  }

  return { bins, counts };
}

/**
 * PropertyDistributionからヒストグラムデータを生成
 */
export function createHistogramFromDistribution(
  distribution: PropertyDistribution
): DataSeries {
  const binCount = distribution.bins || 20;
  const { bins, counts } = calculateHistogramBins(distribution.values, binCount);

  return {
    id: distribution.property,
    name: distribution.property,
    nameJa: distribution.propertyJa,
    data: bins.slice(0, -1).map((x, i) => ({
      x: (x + bins[i + 1]) / 2, // ビン中央値
      y: counts[i],
    })),
  };
}

// ============================================================================
// 統計計算
// ============================================================================

/**
 * 基本統計量
 */
export interface Statistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  std: number;
  count: number;
}

/**
 * 基本統計量を計算
 */
export function calculateStatistics(values: number[]): Statistics {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, std: 0, count: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = values.length;
  const min = sorted[0];
  const max = sorted[count - 1];
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / count;

  const median =
    count % 2 === 0
      ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : sorted[Math.floor(count / 2)];

  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / count;
  const std = Math.sqrt(variance);

  return { min, max, mean, median, std, count };
}

/**
 * 相関係数を計算
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) {
    return 0;
  }

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * 線形回帰
 */
export function linearRegression(
  x: number[],
  y: number[]
): { slope: number; intercept: number; r2: number } {
  if (x.length !== y.length || x.length === 0) {
    return { slope: 0, intercept: 0, r2: 0 };
  }

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R² 計算
  const yMean = sumY / n;
  const ssTot = y.reduce((total, yi) => total + Math.pow(yi - yMean, 2), 0);
  const ssRes = y.reduce(
    (total, yi, i) => total + Math.pow(yi - (slope * x[i] + intercept), 2),
    0
  );
  const r2 = 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

// ============================================================================
// フォーマット
// ============================================================================

/**
 * 数値をフォーマット
 */
export function formatNumber(
  value: number,
  options?: {
    precision?: number;
    notation?: 'standard' | 'scientific' | 'engineering';
  }
): string {
  const precision = options?.precision ?? 3;
  const notation = options?.notation ?? 'standard';

  if (notation === 'scientific') {
    return value.toExponential(precision);
  }

  if (notation === 'engineering') {
    const exp = Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
    const mantissa = value / Math.pow(10, exp);
    return `${mantissa.toFixed(precision)}e${exp >= 0 ? '+' : ''}${exp}`;
  }

  // standard notation
  if (Math.abs(value) >= 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
    return value.toExponential(precision);
  }

  return value.toPrecision(precision);
}

/**
 * 単位付きでフォーマット
 */
export function formatWithUnit(
  value: number,
  unit?: string,
  precision?: number
): string {
  const formatted = formatNumber(value, { precision });
  return unit ? `${formatted} ${unit}` : formatted;
}

// ============================================================================
// データ範囲計算
// ============================================================================

/**
 * データシリーズの範囲を計算
 */
export function calculateDataRange(
  series: DataSeries[]
): { xMin: number; xMax: number; yMin: number; yMax: number } {
  const allPoints = series.flatMap((s) => s.data);

  if (allPoints.length === 0) {
    return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
  }

  return {
    xMin: Math.min(...allPoints.map((p) => p.x)),
    xMax: Math.max(...allPoints.map((p) => p.x)),
    yMin: Math.min(...allPoints.map((p) => p.y)),
    yMax: Math.max(...allPoints.map((p) => p.y)),
  };
}

/**
 * 適切な軸範囲を計算（余白付き）
 */
export function calculateAxisRange(
  min: number,
  max: number,
  padding: number = 0.1
): { min: number; max: number } {
  const range = max - min;
  const paddingValue = range * padding;

  return {
    min: min - paddingValue,
    max: max + paddingValue,
  };
}

// ============================================================================
// SVG/Canvas ヘルパー
// ============================================================================

/**
 * SVGパスを生成（折れ線用）
 */
export function generateLinePath(points: DataPoint[]): string {
  if (points.length === 0) return '';

  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
}

/**
 * スムーズなSVGパスを生成（ベジェ曲線）
 */
export function generateSmoothPath(points: DataPoint[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}
