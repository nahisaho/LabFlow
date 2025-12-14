/**
 * Visualization Dashboard
 * 
 * 可視化ダッシュボードコンポーネント
 */
'use client';

import { useState, useMemo } from 'react';
import type {
  DashboardLayout,
  DashboardWidget,
  WidgetType,
  DataSeries,
  CategoricalPoint,
  HeatmapData,
  PropertyDistribution,
  ConvergencePoint,
  EnergyPoint,
  MoleculeData,
  CrystalData,
} from './types';
import { LineChart, BarChart } from './basic-charts';
import { ScatterPlot, Heatmap } from './advanced-charts';
import {
  PropertyDistributionChart,
  ConvergencePlot,
  EnergyLandscape,
  SummaryStats,
} from './science-charts';
import { MoleculeViewer2D } from './molecule-viewer';
import { CrystalViewer } from './crystal-viewer';

// ============================================================================
// ダッシュボードウィジェットレンダラー
// ============================================================================

interface WidgetData {
  lineSeries?: DataSeries[];
  barData?: CategoricalPoint[];
  scatterSeries?: DataSeries[];
  heatmapData?: HeatmapData;
  propertyDistribution?: PropertyDistribution;
  convergenceData?: ConvergencePoint[];
  energyPoints?: EnergyPoint[];
  molecule?: MoleculeData;
  crystal?: CrystalData;
  summaryStats?: Array<{
    label: string;
    labelJa?: string;
    value: number | string;
    unit?: string;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
  }>;
}

interface WidgetRendererProps {
  widget: DashboardWidget;
  data: WidgetData;
  onRemove?: () => void;
}

function WidgetRenderer({ widget, data, onRemove }: WidgetRendererProps) {
  const { type, title, titleJa, config } = widget;
  const displayTitle = titleJa || title;

  const renderContent = () => {
    switch (type) {
      case 'line-chart':
        if (!data.lineSeries) return <EmptyState message="データがありません" />;
        return (
          <LineChart
            series={data.lineSeries}
            config={{ title: displayTitle, ...config }}
          />
        );

      case 'bar-chart':
        if (!data.barData) return <EmptyState message="データがありません" />;
        return (
          <BarChart
            data={data.barData}
            config={{ title: displayTitle, ...config }}
          />
        );

      case 'scatter-plot':
        if (!data.scatterSeries) return <EmptyState message="データがありません" />;
        return (
          <ScatterPlot
            series={data.scatterSeries}
            config={{ title: displayTitle, ...config }}
          />
        );

      case 'heatmap':
        if (!data.heatmapData) return <EmptyState message="データがありません" />;
        return (
          <Heatmap
            data={data.heatmapData}
            config={{ title: displayTitle, ...config }}
          />
        );

      case 'property-distribution':
        if (!data.propertyDistribution)
          return <EmptyState message="データがありません" />;
        return (
          <PropertyDistributionChart
            distribution={data.propertyDistribution}
            config={{ title: displayTitle, ...config }}
          />
        );

      case 'convergence-plot':
        if (!data.convergenceData)
          return <EmptyState message="データがありません" />;
        return (
          <ConvergencePlot
            data={data.convergenceData}
            config={{ title: displayTitle, ...config }}
          />
        );

      case 'energy-landscape':
        if (!data.energyPoints) return <EmptyState message="データがありません" />;
        return (
          <EnergyLandscape
            points={data.energyPoints}
            config={{ title: displayTitle, ...config }}
          />
        );

      case 'molecule-viewer':
        if (!data.molecule) return <EmptyState message="分子データがありません" />;
        return <MoleculeViewer2D molecule={data.molecule} />;

      case 'crystal-viewer':
        if (!data.crystal) return <EmptyState message="結晶データがありません" />;
        return <CrystalViewer crystal={data.crystal} />;

      case 'summary-stats':
        if (!data.summaryStats) return <EmptyState message="データがありません" />;
        return <SummaryStats title={displayTitle} stats={data.summaryStats} />;

      default:
        return <EmptyState message="未対応のウィジェットタイプ" />;
    }
  };

  return (
    <div className="relative group">
      {renderContent()}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
        >
          ×
        </button>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 h-full min-h-[200px] flex items-center justify-center">
      <span className="text-gray-400 text-sm">{message}</span>
    </div>
  );
}

// ============================================================================
// VisualizationDashboard
// ============================================================================

interface VisualizationDashboardProps {
  layout: DashboardLayout;
  dataMap: Map<string, WidgetData>;
  editable?: boolean;
  onLayoutChange?: (layout: DashboardLayout) => void;
}

/**
 * 可視化ダッシュボードコンポーネント
 */
export function VisualizationDashboard({
  layout,
  dataMap,
  editable = false,
  onLayoutChange,
}: VisualizationDashboardProps) {
  const [widgets, setWidgets] = useState(layout.widgets);

  const handleRemoveWidget = (widgetId: string) => {
    const newWidgets = widgets.filter((w) => w.id !== widgetId);
    setWidgets(newWidgets);
    onLayoutChange?.({ ...layout, widgets: newWidgets });
  };

  // グリッドスタイル
  const gridStyle = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
      gap: '16px',
    }),
    [layout.columns]
  );

  return (
    <div className="space-y-4">
      {/* ダッシュボードヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {layout.nameJa || layout.name}
        </h2>
        {editable && (
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
              ウィジェット追加
            </button>
            <button className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              保存
            </button>
          </div>
        )}
      </div>

      {/* ウィジェットグリッド */}
      <div style={gridStyle}>
        {widgets.map((widget) => {
          const data = dataMap.get(widget.dataSource || widget.id) || {};
          const spanStyle = {
            gridColumn: `span ${widget.position.width}`,
            gridRow: `span ${widget.position.height}`,
          };

          return (
            <div key={widget.id} style={spanStyle}>
              <WidgetRenderer
                widget={widget}
                data={data}
                onRemove={editable ? () => handleRemoveWidget(widget.id) : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// プリセットダッシュボード
// ============================================================================

/**
 * 材料科学用ダッシュボードレイアウト
 */
export const MATERIALS_DASHBOARD_LAYOUT: DashboardLayout = {
  id: 'materials-dashboard',
  name: 'Materials Science Dashboard',
  nameJa: '材料科学ダッシュボード',
  columns: 3,
  rows: 3,
  widgets: [
    {
      id: 'crystal-structure',
      type: 'crystal-viewer',
      title: 'Crystal Structure',
      titleJa: '結晶構造',
      position: { x: 0, y: 0, width: 1, height: 2 },
      dataSource: 'crystal',
    },
    {
      id: 'formation-energy',
      type: 'property-distribution',
      title: 'Formation Energy Distribution',
      titleJa: '形成エネルギー分布',
      position: { x: 1, y: 0, width: 1, height: 1 },
      dataSource: 'formationEnergy',
    },
    {
      id: 'band-gap',
      type: 'property-distribution',
      title: 'Band Gap Distribution',
      titleJa: 'バンドギャップ分布',
      position: { x: 2, y: 0, width: 1, height: 1 },
      dataSource: 'bandGap',
    },
    {
      id: 'convergence',
      type: 'convergence-plot',
      title: 'Optimization Convergence',
      titleJa: '最適化収束',
      position: { x: 1, y: 1, width: 2, height: 1 },
      dataSource: 'convergence',
    },
    {
      id: 'stats',
      type: 'summary-stats',
      title: 'Summary Statistics',
      titleJa: 'サマリー統計',
      position: { x: 0, y: 2, width: 3, height: 1 },
      dataSource: 'stats',
    },
  ],
};

/**
 * 創薬用ダッシュボードレイアウト
 */
export const DRUG_DASHBOARD_LAYOUT: DashboardLayout = {
  id: 'drug-dashboard',
  name: 'Drug Discovery Dashboard',
  nameJa: '創薬ダッシュボード',
  columns: 3,
  rows: 3,
  widgets: [
    {
      id: 'molecule',
      type: 'molecule-viewer',
      title: 'Molecule Structure',
      titleJa: '分子構造',
      position: { x: 0, y: 0, width: 1, height: 2 },
      dataSource: 'molecule',
    },
    {
      id: 'binding-scatter',
      type: 'scatter-plot',
      title: 'Binding Affinity vs LogP',
      titleJa: '結合親和性 vs LogP',
      position: { x: 1, y: 0, width: 2, height: 1 },
      dataSource: 'bindingScatter',
    },
    {
      id: 'property-heatmap',
      type: 'heatmap',
      title: 'Property Correlation',
      titleJa: 'プロパティ相関',
      position: { x: 1, y: 1, width: 2, height: 1 },
      dataSource: 'propertyHeatmap',
    },
    {
      id: 'lipinski',
      type: 'bar-chart',
      title: 'Lipinski Rule Compliance',
      titleJa: 'リピンスキー則適合',
      position: { x: 0, y: 2, width: 3, height: 1 },
      dataSource: 'lipinski',
    },
  ],
};

/**
 * 気候科学用ダッシュボードレイアウト
 */
export const CLIMATE_DASHBOARD_LAYOUT: DashboardLayout = {
  id: 'climate-dashboard',
  name: 'Climate Science Dashboard',
  nameJa: '気候科学ダッシュボード',
  columns: 2,
  rows: 3,
  widgets: [
    {
      id: 'temperature-trend',
      type: 'line-chart',
      title: 'Temperature Prediction',
      titleJa: '気温予測',
      position: { x: 0, y: 0, width: 2, height: 1 },
      dataSource: 'temperatureTrend',
    },
    {
      id: 'spatial-heatmap',
      type: 'heatmap',
      title: 'Spatial Distribution',
      titleJa: '空間分布',
      position: { x: 0, y: 1, width: 1, height: 1 },
      dataSource: 'spatialHeatmap',
    },
    {
      id: 'model-comparison',
      type: 'bar-chart',
      title: 'Model Comparison',
      titleJa: 'モデル比較',
      position: { x: 1, y: 1, width: 1, height: 1 },
      dataSource: 'modelComparison',
    },
    {
      id: 'stats',
      type: 'summary-stats',
      title: 'Prediction Stats',
      titleJa: '予測統計',
      position: { x: 0, y: 2, width: 2, height: 1 },
      dataSource: 'stats',
    },
  ],
};

/**
 * ゲノミクス用ダッシュボードレイアウト
 */
export const GENOMICS_DASHBOARD_LAYOUT: DashboardLayout = {
  id: 'genomics-dashboard',
  name: 'Genomics Dashboard',
  nameJa: 'ゲノミクスダッシュボード',
  columns: 2,
  rows: 3,
  widgets: [
    {
      id: 'protein-structure',
      type: 'molecule-viewer',
      title: 'Protein Structure',
      titleJa: 'タンパク質構造',
      position: { x: 0, y: 0, width: 1, height: 2 },
      dataSource: 'protein',
    },
    {
      id: 'energy-landscape',
      type: 'energy-landscape',
      title: 'Folding Energy Landscape',
      titleJa: 'フォールディングエネルギー',
      position: { x: 1, y: 0, width: 1, height: 1 },
      dataSource: 'energyLandscape',
    },
    {
      id: 'rmsd-plot',
      type: 'line-chart',
      title: 'RMSD Over Time',
      titleJa: 'RMSD推移',
      position: { x: 1, y: 1, width: 1, height: 1 },
      dataSource: 'rmsdPlot',
    },
    {
      id: 'contact-map',
      type: 'heatmap',
      title: 'Contact Map',
      titleJa: 'コンタクトマップ',
      position: { x: 0, y: 2, width: 2, height: 1 },
      dataSource: 'contactMap',
    },
  ],
};

// ============================================================================
// ダッシュボードセレクター
// ============================================================================

interface DashboardSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * ダッシュボードセレクターコンポーネント
 */
export function DashboardSelector({ selectedId, onSelect }: DashboardSelectorProps) {
  const dashboards = [
    { id: 'materials', label: '材料科学', icon: '🔬' },
    { id: 'drug', label: '創薬', icon: '💊' },
    { id: 'climate', label: '気候科学', icon: '🌍' },
    { id: 'genomics', label: 'ゲノミクス', icon: '🧬' },
    { id: 'custom', label: 'カスタム', icon: '⚙️' },
  ];

  return (
    <div className="flex gap-2 p-2 bg-gray-100 rounded-lg">
      {dashboards.map((d) => (
        <button
          key={d.id}
          onClick={() => onSelect(d.id)}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            selectedId === d.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className="mr-1">{d.icon}</span>
          {d.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// エクスポート
// ============================================================================

export type { VisualizationDashboardProps, WidgetData, DashboardSelectorProps };
