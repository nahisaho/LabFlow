/**
 * Visualization Components
 * 
 * 科学データ可視化コンポーネントのエクスポート
 */

// Types
export type {
  // 基本データ型
  DataPoint,
  DataPoint3D,
  TimeSeriesPoint,
  CategoricalPoint,
  HeatmapCell,
  DataSeries,
  TimeSeriesData,
  HeatmapData,
  // 科学データ型
  AtomCoordinate,
  MoleculeData,
  LatticeData,
  CrystalData,
  EnergyPoint,
  ConvergencePoint,
  PropertyDistribution,
  // チャート設定
  AxisConfig,
  LegendConfig,
  TooltipConfig,
  ColorScale,
  BaseChartConfig,
  LineChartConfig,
  BarChartConfig,
  ScatterPlotConfig,
  HeatmapConfig,
  // ビューア設定
  MoleculeStyle,
  MoleculeViewerConfig,
  CrystalViewerConfig,
  // ダッシュボード
  WidgetType,
  DashboardWidget,
  DashboardLayout,
  // イベント
  DataPointClickEvent,
  SelectionChangeEvent,
  ZoomChangeEvent,
  // エクスポート
  ExportFormat,
  ExportConfig,
} from './types';

// Utilities
export {
  // カラー
  getColorFromScale,
  getColorScaleGradient,
  CHART_COLORS,
  getChartColor,
  ELEMENT_COLORS,
  getElementColor,
  // データ変換
  createDataSeries,
  createHeatmapData,
  calculateHistogramBins,
  createHistogramFromDistribution,
  // 統計
  calculateStatistics,
  calculateCorrelation,
  linearRegression,
  // フォーマット
  formatNumber,
  formatWithUnit,
  // 範囲計算
  calculateDataRange,
  calculateAxisRange,
  // SVG
  generateLinePath,
  generateSmoothPath,
} from './utils';
export type { Statistics } from './utils';

// Basic Charts
export {
  LineChart,
  BarChart,
  ChartContainer,
  Axis,
  Legend,
  Tooltip,
} from './basic-charts';

// Advanced Charts
export { ScatterPlot, Heatmap } from './advanced-charts';
export type { ScatterPlotProps, HeatmapProps } from './advanced-charts';

// Science Charts
export {
  PropertyDistributionChart,
  ConvergencePlot,
  EnergyLandscape,
  SummaryStats,
} from './science-charts';
export type {
  PropertyDistributionChartProps,
  ConvergencePlotProps,
  EnergyLandscapeProps,
  SummaryStatsProps,
} from './science-charts';

// Molecule Viewer
export {
  MoleculeViewer2D,
  MoleculeGrid,
  MoleculeCompare,
} from './molecule-viewer';
export type {
  MoleculeViewer2DProps,
  MoleculeGridProps,
  MoleculeCompareProps,
} from './molecule-viewer';

// Crystal Viewer
export {
  CrystalViewer,
  CrystalGrid,
  LatticeInfo,
} from './crystal-viewer';
export type {
  CrystalViewerProps,
  CrystalGridProps,
  LatticeInfoProps,
} from './crystal-viewer';

// Dashboard
export {
  VisualizationDashboard,
  DashboardSelector,
  MATERIALS_DASHBOARD_LAYOUT,
  DRUG_DASHBOARD_LAYOUT,
  CLIMATE_DASHBOARD_LAYOUT,
  GENOMICS_DASHBOARD_LAYOUT,
} from './dashboard';
export type {
  VisualizationDashboardProps,
  WidgetData,
  DashboardSelectorProps,
} from './dashboard';
