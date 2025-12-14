/**
 * @file GraphRAG グラフビューワー
 * @description ナレッジグラフの可視化・インタラクティブ操作コンポーネント
 */

'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { NODE_TYPES, RELATION_TYPES, UI_TEXT } from './constants';
import type {
  GraphNode,
  GraphEdge,
  GraphData,
  GraphDisplaySettings,
  ViewMode,
  NodeType,
} from './types';

// ============================================================================
// Props
// ============================================================================

export interface GraphViewerProps {
  /** グラフデータ */
  data: GraphData | null;
  /** 選択中のノードID */
  selectedNodeId?: string | null;
  /** 表示設定 */
  settings?: Partial<GraphDisplaySettings>;
  /** ノード選択時 */
  onSelectNode?: (nodeId: string | null) => void;
  /** 言語設定 */
  language?: 'ja' | 'en';
  /** 高さ */
  height?: string | number;
}

export interface NodeDetailPanelProps {
  /** 選択中のノード */
  node: GraphNode | null;
  /** 関連エッジ */
  edges: GraphEdge[];
  /** 隣接ノード */
  neighbors: GraphNode[];
  /** 言語設定 */
  language?: 'ja' | 'en';
  /** 閉じる */
  onClose?: () => void;
  /** 隣接ノード選択時 */
  onSelectNeighbor?: (nodeId: string) => void;
}

export interface GraphStatsProps {
  /** ノード数 */
  nodeCount: number;
  /** エッジ数 */
  edgeCount: number;
  /** ノードタイプ別カウント */
  nodesByType: Record<NodeType, number>;
  /** 言語設定 */
  language?: 'ja' | 'en';
}

export interface GraphControlsProps {
  /** 現在の設定 */
  settings: GraphDisplaySettings;
  /** 設定変更時 */
  onSettingsChange: (settings: GraphDisplaySettings) => void;
  /** ビューモード */
  viewMode: ViewMode;
  /** ビューモード変更時 */
  onViewModeChange: (mode: ViewMode) => void;
  /** 言語設定 */
  language?: 'ja' | 'en';
}

// ============================================================================
// GraphStats
// ============================================================================

export function GraphStats({
  nodeCount,
  edgeCount,
  nodesByType,
  language = 'ja',
}: GraphStatsProps): React.JSX.Element {
  const isJa = language === 'ja';

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">
          {isJa ? UI_TEXT.nodesJa : UI_TEXT.nodes}:
        </span>
        <Badge variant="secondary">{nodeCount}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">
          {isJa ? UI_TEXT.edgesJa : UI_TEXT.edges}:
        </span>
        <Badge variant="secondary">{edgeCount}</Badge>
      </div>
      {Object.entries(nodesByType)
        .filter(([, count]) => count > 0)
        .map(([type, count]) => {
          const typeInfo = NODE_TYPES[type as NodeType];
          return (
            <div key={type} className="flex items-center gap-1">
              <span>{typeInfo.icon}</span>
              <span className="text-xs text-muted-foreground">
                {isJa ? typeInfo.labelJa : typeInfo.label}:
              </span>
              <span className="text-xs font-medium">{count}</span>
            </div>
          );
        })}
    </div>
  );
}

// ============================================================================
// NodeDetailPanel
// ============================================================================

export function NodeDetailPanel({
  node,
  edges,
  neighbors,
  language = 'ja',
  onClose,
  onSelectNeighbor,
}: NodeDetailPanelProps): React.JSX.Element | null {
  const isJa = language === 'ja';

  if (!node) return null;

  const typeInfo = NODE_TYPES[node.type];

  return (
    <Card className="w-80">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{typeInfo.icon}</span>
            <div>
              <CardTitle className="text-base">
                {isJa && node.labelJa ? node.labelJa : node.label}
              </CardTitle>
              <Badge variant="outline" className={`text-xs ${typeInfo.color}`}>
                {isJa ? typeInfo.labelJa : typeInfo.label}
              </Badge>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* プロパティ */}
        {Object.keys(node.properties).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">
              {isJa ? 'プロパティ' : 'Properties'}
            </h4>
            <div className="space-y-1 text-sm">
              {Object.entries(node.properties).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground">{key}</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 関連エッジ */}
        {edges.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">
              {isJa ? '関係' : 'Relationships'} ({edges.length})
            </h4>
            <div className="space-y-1">
              {edges.slice(0, 5).map((edge) => {
                const relInfo = RELATION_TYPES[edge.type];
                return (
                  <div
                    key={edge.id}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: relInfo?.color ?? '#888' }}
                    />
                    <span>{relInfo ? (isJa ? relInfo.labelJa : relInfo.label) : edge.type}</span>
                  </div>
                );
              })}
              {edges.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{edges.length - 5} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* 隣接ノード */}
        {neighbors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">
              {isJa ? UI_TEXT.relatedNodesJa : UI_TEXT.relatedNodes} ({neighbors.length})
            </h4>
            <div className="space-y-1">
              {neighbors.slice(0, 5).map((neighbor) => {
                const neighborTypeInfo = NODE_TYPES[neighbor.type];
                return (
                  <button
                    key={neighbor.id}
                    onClick={() => onSelectNeighbor?.(neighbor.id)}
                    className="flex items-center gap-2 text-xs hover:bg-muted p-1 rounded w-full text-left"
                  >
                    <span>{neighborTypeInfo.icon}</span>
                    <span className="truncate">
                      {isJa && neighbor.labelJa ? neighbor.labelJa : neighbor.label}
                    </span>
                  </button>
                );
              })}
              {neighbors.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{neighbors.length - 5} more
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// GraphControls
// ============================================================================

export function GraphControls({
  settings,
  onSettingsChange,
  language = 'ja',
}: GraphControlsProps): React.JSX.Element {
  const isJa = language === 'ja';

  const toggleNodeType = (type: NodeType) => {
    const current = settings.visibleNodeTypes;
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onSettingsChange({ ...settings, visibleNodeTypes: updated });
  };

  return (
    <div className="space-y-4">
      {/* ノードタイプフィルタ */}
      <div>
        <h4 className="text-sm font-medium mb-2">
          {isJa ? 'ノードタイプ' : 'Node Types'}
        </h4>
        <div className="flex flex-wrap gap-1">
          {Object.values(NODE_TYPES).map((typeInfo) => (
            <Button
              key={typeInfo.id}
              variant={settings.visibleNodeTypes.includes(typeInfo.id) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleNodeType(typeInfo.id)}
            >
              {typeInfo.icon} {isJa ? typeInfo.labelJa : typeInfo.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 表示オプション */}
      <div>
        <h4 className="text-sm font-medium mb-2">
          {isJa ? '表示設定' : 'Display Options'}
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.showLabels}
              onChange={(e) =>
                onSettingsChange({ ...settings, showLabels: e.target.checked })
              }
            />
            {isJa ? 'ラベル表示' : 'Show Labels'}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.highlightNeighbors}
              onChange={(e) =>
                onSettingsChange({ ...settings, highlightNeighbors: e.target.checked })
              }
            />
            {isJa ? '隣接ノードハイライト' : 'Highlight Neighbors'}
          </label>
        </div>
      </div>

      {/* レイアウト */}
      <div>
        <h4 className="text-sm font-medium mb-2">
          {isJa ? 'レイアウト' : 'Layout'}
        </h4>
        <div className="flex gap-1">
          {(['force', 'circular', 'hierarchical'] as const).map((layout) => (
            <Button
              key={layout}
              variant={settings.layout === layout ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSettingsChange({ ...settings, layout })}
            >
              {layout === 'force' && (isJa ? '力学' : 'Force')}
              {layout === 'circular' && (isJa ? '円形' : 'Circular')}
              {layout === 'hierarchical' && (isJa ? '階層' : 'Hierarchical')}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// GraphCanvas (SVG-based simple visualization)
// ============================================================================

interface GraphCanvasProps {
  data: GraphData;
  selectedNodeId?: string | null;
  settings: GraphDisplaySettings;
  onSelectNode?: (nodeId: string | null) => void;
  width: number;
  height: number;
  language?: 'ja' | 'en';
}

function GraphCanvas({
  data,
  selectedNodeId,
  settings,
  onSelectNode,
  width,
  height,
  language = 'ja',
}: GraphCanvasProps): React.JSX.Element {
  const isJa = language === 'ja';

  // フィルタリング
  const visibleNodes = React.useMemo(() => {
    return data.nodes.filter((n) => settings.visibleNodeTypes.includes(n.type));
  }, [data.nodes, settings.visibleNodeTypes]);

  const visibleNodeIds = React.useMemo(() => {
    return new Set(visibleNodes.map((n) => n.id));
  }, [visibleNodes]);

  const visibleEdges = React.useMemo(() => {
    return data.edges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
  }, [data.edges, visibleNodeIds]);

  // 簡易レイアウト計算
  const nodePositions = React.useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const padding = 50;
    const w = width - padding * 2;
    const h = height - padding * 2;
    const cx = width / 2;
    const cy = height / 2;

    if (settings.layout === 'circular') {
      visibleNodes.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / visibleNodes.length;
        const r = Math.min(w, h) / 2 - 30;
        positions[node.id] = {
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle),
        };
      });
    } else {
      // Grid layout as fallback
      const cols = Math.ceil(Math.sqrt(visibleNodes.length));
      visibleNodes.forEach((node, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        positions[node.id] = {
          x: padding + (col + 0.5) * (w / cols),
          y: padding + (row + 0.5) * (h / Math.ceil(visibleNodes.length / cols)),
        };
      });
    }

    return positions;
  }, [visibleNodes, width, height, settings.layout]);

  // 選択ノードの隣接ノード
  const neighborIds = React.useMemo(() => {
    if (!selectedNodeId || !settings.highlightNeighbors) return new Set<string>();
    const ids = new Set<string>();
    for (const edge of visibleEdges) {
      if (edge.source === selectedNodeId) ids.add(edge.target);
      if (edge.target === selectedNodeId) ids.add(edge.source);
    }
    return ids;
  }, [selectedNodeId, visibleEdges, settings.highlightNeighbors]);

  return (
    <svg width={width} height={height} className="bg-muted/20 rounded-lg">
      {/* エッジ */}
      <g className="edges">
        {visibleEdges.map((edge) => {
          const source = nodePositions[edge.source];
          const target = nodePositions[edge.target];
          if (!source || !target) return null;

          const isHighlighted =
            selectedNodeId === edge.source || selectedNodeId === edge.target;
          const relInfo = RELATION_TYPES[edge.type];

          return (
            <line
              key={edge.id}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={relInfo?.color ?? '#888'}
              strokeWidth={isHighlighted ? 2 : 1}
              strokeOpacity={selectedNodeId && !isHighlighted ? 0.2 : 0.6}
            />
          );
        })}
      </g>

      {/* ノード */}
      <g className="nodes">
        {visibleNodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;

          const typeInfo = NODE_TYPES[node.type];
          const isSelected = node.id === selectedNodeId;
          const isNeighbor = neighborIds.has(node.id);
          const isDimmed = selectedNodeId && !isSelected && !isNeighbor;

          const size = node.size ?? (settings.nodeSizeBy === 'degree' ? 8 + (node.degree ?? 0) : 12);

          return (
            <g
              key={node.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => onSelectNode?.(isSelected ? null : node.id)}
              className="cursor-pointer"
              opacity={isDimmed ? 0.3 : 1}
            >
              <circle
                r={size}
                className={typeInfo.bgColor}
                fill="currentColor"
                stroke={isSelected ? '#000' : 'transparent'}
                strokeWidth={isSelected ? 2 : 0}
              />
              {settings.showLabels && (
                <text
                  y={size + 12}
                  textAnchor="middle"
                  className="text-[10px] fill-foreground pointer-events-none"
                >
                  {(isJa && node.labelJa ? node.labelJa : node.label).slice(0, 20)}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ============================================================================
// GraphViewer
// ============================================================================

export function GraphViewer({
  data,
  selectedNodeId,
  settings: customSettings,
  onSelectNode,
  language = 'ja',
  height = 500,
}: GraphViewerProps): React.JSX.Element {
  const isJa = language === 'ja';
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 500 });

  // デフォルト設定とマージ
  const settings: GraphDisplaySettings = React.useMemo(
    () => ({
      nodeSizeBy: 'degree',
      visibleNodeTypes: ['paper', 'entity', 'author', 'topic', 'journal', 'concept'],
      visibleEdgeTypes: ['cites', 'mentions', 'authored', 'related_to'],
      showLabels: true,
      highlightNeighbors: true,
      layout: 'force',
      zoom: 1.0,
      ...customSettings,
    }),
    [customSettings]
  );

  // リサイズ監視
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: typeof height === 'number' ? height : entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [height]);

  // 選択ノードの詳細データ取得
  const selectedNode = React.useMemo(() => {
    if (!selectedNodeId || !data) return null;
    return data.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, data]);

  const selectedNodeEdges = React.useMemo(() => {
    if (!selectedNodeId || !data) return [];
    return data.edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId
    );
  }, [selectedNodeId, data]);

  const selectedNodeNeighbors = React.useMemo(() => {
    if (!selectedNodeId || !data) return [];
    const neighborIds = new Set<string>();
    for (const edge of selectedNodeEdges) {
      if (edge.source !== selectedNodeId) neighborIds.add(edge.source);
      if (edge.target !== selectedNodeId) neighborIds.add(edge.target);
    }
    return data.nodes.filter((n) => neighborIds.has(n.id));
  }, [selectedNodeId, selectedNodeEdges, data]);

  if (!data || data.nodes.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-muted-foreground"
        style={{ height: typeof height === 'number' ? height : '100%' }}
      >
        <p className="text-4xl mb-2">🕸️</p>
        <p>{isJa ? 'グラフデータがありません' : 'No graph data'}</p>
        <p className="text-sm mt-1">
          {isJa
            ? 'ドキュメントを追加してナレッジグラフを構築してください'
            : 'Add documents to build your knowledge graph'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* グラフキャンバス */}
      <div ref={containerRef} className="flex-1">
        <GraphCanvas
          data={data}
          selectedNodeId={selectedNodeId}
          settings={settings}
          onSelectNode={onSelectNode}
          width={dimensions.width - (selectedNode ? 336 : 0)}
          height={dimensions.height}
          language={language}
        />
      </div>

      {/* 詳細パネル */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          edges={selectedNodeEdges}
          neighbors={selectedNodeNeighbors}
          language={language}
          onClose={() => onSelectNode?.(null)}
          onSelectNeighbor={onSelectNode}
        />
      )}
    </div>
  );
}
