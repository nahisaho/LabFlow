/**
 * Visualization Types
 * 
 * 科学データ可視化のための型定義
 */

// ============================================================================
// 基本データ型
// ============================================================================

/**
 * 2Dデータポイント
 */
export interface DataPoint {
  x: number;
  y: number;
  label?: string;
  color?: string;
}

/**
 * 3Dデータポイント
 */
export interface DataPoint3D extends DataPoint {
  z: number;
}

/**
 * 時系列データポイント
 */
export interface TimeSeriesPoint {
  timestamp: Date | number;
  value: number;
  label?: string;
}

/**
 * カテゴリカルデータポイント
 */
export interface CategoricalPoint {
  category: string;
  value: number;
  color?: string;
}

/**
 * ヒートマップセル
 */
export interface HeatmapCell {
  x: number | string;
  y: number | string;
  value: number;
}

// ============================================================================
// データシリーズ
// ============================================================================

/**
 * データシリーズ（複数のデータポイントの集合）
 */
export interface DataSeries {
  id: string;
  name: string;
  nameJa?: string;
  data: DataPoint[];
  color?: string;
  visible?: boolean;
}

/**
 * 時系列データシリーズ
 */
export interface TimeSeriesData {
  id: string;
  name: string;
  nameJa?: string;
  data: TimeSeriesPoint[];
  color?: string;
  visible?: boolean;
}

/**
 * ヒートマップデータ
 */
export interface HeatmapData {
  xLabels: string[];
  yLabels: string[];
  values: number[][];
  minValue?: number;
  maxValue?: number;
}

// ============================================================================
// 科学データ型
// ============================================================================

/**
 * 分子座標
 */
export interface AtomCoordinate {
  element: string;
  x: number;
  y: number;
  z: number;
  charge?: number;
  bondOrder?: number[];
}

/**
 * 分子データ
 */
export interface MoleculeData {
  id: string;
  name: string;
  smiles?: string;
  atoms: AtomCoordinate[];
  bonds: Array<{
    atom1: number;
    atom2: number;
    order: number;
  }>;
  properties?: Record<string, number | string>;
}

/**
 * 結晶格子データ
 */
export interface LatticeData {
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
}

/**
 * 結晶構造データ
 */
export interface CrystalData {
  id: string;
  name: string;
  formula: string;
  lattice: LatticeData;
  atoms: AtomCoordinate[];
  spaceGroup?: string;
  properties?: Record<string, number | string>;
}

/**
 * エネルギーランドスケープポイント
 */
export interface EnergyPoint {
  configuration: number[];
  energy: number;
  label?: string;
  isMinimum?: boolean;
  isTransitionState?: boolean;
}

/**
 * 収束データ
 */
export interface ConvergencePoint {
  iteration: number;
  value: number;
  metric?: string;
}

/**
 * プロパティ分布データ
 */
export interface PropertyDistribution {
  property: string;
  propertyJa?: string;
  unit?: string;
  values: number[];
  bins?: number;
}

// ============================================================================
// チャート設定
// ============================================================================

/**
 * 軸設定
 */
export interface AxisConfig {
  label?: string;
  labelJa?: string;
  unit?: string;
  min?: number;
  max?: number;
  tickCount?: number;
  tickFormat?: (value: number) => string;
  scale?: 'linear' | 'log' | 'sqrt';
}

/**
 * 凡例設定
 */
export interface LegendConfig {
  position?: 'top' | 'bottom' | 'left' | 'right';
  visible?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

/**
 * ツールチップ設定
 */
export interface TooltipConfig {
  enabled?: boolean;
  formatter?: (value: number, name: string) => string;
}

/**
 * カラースケール
 */
export type ColorScale = 
  | 'viridis'
  | 'plasma'
  | 'inferno'
  | 'magma'
  | 'cividis'
  | 'blues'
  | 'greens'
  | 'reds'
  | 'spectral'
  | 'coolwarm';

/**
 * 基本チャート設定
 */
export interface BaseChartConfig {
  title?: string;
  titleJa?: string;
  width?: number | string;
  height?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
  animate?: boolean;
  responsive?: boolean;
}

/**
 * 折れ線グラフ設定
 */
export interface LineChartConfig extends BaseChartConfig {
  showPoints?: boolean;
  pointSize?: number;
  lineWidth?: number;
  smooth?: boolean;
  showArea?: boolean;
  areaOpacity?: number;
}

/**
 * 棒グラフ設定
 */
export interface BarChartConfig extends BaseChartConfig {
  orientation?: 'vertical' | 'horizontal';
  barWidth?: number;
  barGap?: number;
  stacked?: boolean;
  showValues?: boolean;
}

/**
 * 散布図設定
 */
export interface ScatterPlotConfig extends BaseChartConfig {
  pointSize?: number;
  pointOpacity?: number;
  showTrendline?: boolean;
  colorBy?: string;
  sizeBy?: string;
}

/**
 * ヒートマップ設定
 */
export interface HeatmapConfig extends BaseChartConfig {
  colorScale?: ColorScale;
  showValues?: boolean;
  cellBorder?: boolean;
  cellBorderColor?: string;
}

// ============================================================================
// 3Dビューア設定
// ============================================================================

/**
 * 分子表示スタイル
 */
export type MoleculeStyle = 
  | 'stick'      // 棒モデル
  | 'ball-stick' // 球棒モデル
  | 'sphere'     // 空間充填モデル
  | 'cartoon'    // カートゥーンモデル
  | 'surface';   // 表面モデル

/**
 * 分子ビューア設定
 */
export interface MoleculeViewerConfig {
  style?: MoleculeStyle;
  backgroundColor?: string;
  showLabels?: boolean;
  showBonds?: boolean;
  bondRadius?: number;
  atomRadius?: number;
  autoRotate?: boolean;
  rotationSpeed?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
}

/**
 * 結晶ビューア設定
 */
export interface CrystalViewerConfig extends MoleculeViewerConfig {
  showUnitCell?: boolean;
  unitCellColor?: string;
  supercell?: [number, number, number];
  showAxes?: boolean;
}

// ============================================================================
// ダッシュボード
// ============================================================================

/**
 * ウィジェットタイプ
 */
export type WidgetType = 
  | 'line-chart'
  | 'bar-chart'
  | 'scatter-plot'
  | 'heatmap'
  | 'molecule-viewer'
  | 'crystal-viewer'
  | 'property-distribution'
  | 'convergence-plot'
  | 'energy-landscape'
  | 'summary-stats';

/**
 * ダッシュボードウィジェット
 */
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  titleJa?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config?: Record<string, unknown>;
  dataSource?: string;
}

/**
 * ダッシュボードレイアウト
 */
export interface DashboardLayout {
  id: string;
  name: string;
  nameJa?: string;
  columns: number;
  rows: number;
  widgets: DashboardWidget[];
}

// ============================================================================
// エクスポート設定
// ============================================================================

/**
 * エクスポート形式
 */
export type ExportFormat = 'png' | 'svg' | 'pdf' | 'csv' | 'json';

/**
 * エクスポート設定
 */
export interface ExportConfig {
  format: ExportFormat;
  filename?: string;
  width?: number;
  height?: number;
  quality?: number;
  transparent?: boolean;
}

// ============================================================================
// イベントハンドラ
// ============================================================================

/**
 * データポイントクリックイベント
 */
export interface DataPointClickEvent {
  point: DataPoint | DataPoint3D;
  seriesId?: string;
  seriesName?: string;
  index: number;
}

/**
 * 選択変更イベント
 */
export interface SelectionChangeEvent {
  selectedPoints: DataPoint[];
  selectedIndices: number[];
}

/**
 * ズーム変更イベント
 */
export interface ZoomChangeEvent {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}
