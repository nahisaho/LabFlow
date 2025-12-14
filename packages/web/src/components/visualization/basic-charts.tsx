/**
 * Basic Chart Components
 * 
 * LineChart と BarChart の基本チャートコンポーネント
 * 
 * 依存: なし（Recharts風のAPIをSVGで独自実装）
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
import type {
  DataSeries,
  DataPoint,
  CategoricalPoint,
  LineChartConfig,
  BarChartConfig,
} from './types';
import {
  getChartColor,
  calculateDataRange,
  calculateAxisRange,
  generateLinePath,
  generateSmoothPath,
  formatNumber,
} from './utils';

// ============================================================================
// 共通コンポーネント
// ============================================================================

interface ChartContainerProps {
  title?: string;
  titleJa?: string;
  width?: number | string;
  height?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * チャートコンテナ
 */
function ChartContainer({
  title,
  titleJa,
  width = '100%',
  height = 300,
  children,
  className = '',
}: ChartContainerProps) {
  const displayTitle = titleJa || title;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {displayTitle && (
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{displayTitle}</h3>
      )}
      <div style={{ width, height }}>{children}</div>
    </div>
  );
}

interface AxisProps {
  type: 'x' | 'y';
  min: number;
  max: number;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  label?: string;
  labelJa?: string;
  unit?: string;
  tickCount?: number;
}

/**
 * 軸コンポーネント
 */
function Axis({
  type,
  min,
  max,
  width,
  height,
  margin,
  label,
  labelJa,
  unit,
  tickCount = 5,
}: AxisProps) {
  const displayLabel = labelJa || label;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const ticks = useMemo(() => {
    const step = (max - min) / (tickCount - 1);
    return Array.from({ length: tickCount }, (_, i) => min + i * step);
  }, [min, max, tickCount]);

  if (type === 'x') {
    return (
      <g transform={`translate(${margin.left}, ${height - margin.bottom})`}>
        {/* 軸線 */}
        <line x1={0} y1={0} x2={innerWidth} y2={0} stroke="#e5e7eb" strokeWidth={1} />
        
        {/* 目盛り */}
        {ticks.map((tick, i) => {
          const x = ((tick - min) / (max - min)) * innerWidth;
          return (
            <g key={i} transform={`translate(${x}, 0)`}>
              <line y1={0} y2={5} stroke="#9ca3af" strokeWidth={1} />
              <text
                y={18}
                textAnchor="middle"
                fill="#6b7280"
                fontSize={10}
              >
                {formatNumber(tick, { precision: 2 })}
              </text>
            </g>
          );
        })}

        {/* ラベル */}
        {displayLabel && (
          <text
            x={innerWidth / 2}
            y={40}
            textAnchor="middle"
            fill="#374151"
            fontSize={11}
          >
            {displayLabel}{unit ? ` (${unit})` : ''}
          </text>
        )}
      </g>
    );
  }

  // Y軸
  return (
    <g transform={`translate(${margin.left}, ${margin.top})`}>
      {/* 軸線 */}
      <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="#e5e7eb" strokeWidth={1} />
      
      {/* 目盛り */}
      {ticks.map((tick, i) => {
        const y = innerHeight - ((tick - min) / (max - min)) * innerHeight;
        return (
          <g key={i} transform={`translate(0, ${y})`}>
            <line x1={-5} x2={0} stroke="#9ca3af" strokeWidth={1} />
            {/* グリッド線 */}
            <line x1={0} x2={innerWidth} stroke="#f3f4f6" strokeWidth={1} />
            <text
              x={-8}
              textAnchor="end"
              alignmentBaseline="middle"
              fill="#6b7280"
              fontSize={10}
            >
              {formatNumber(tick, { precision: 2 })}
            </text>
          </g>
        );
      })}

      {/* ラベル */}
      {displayLabel && (
        <text
          transform={`translate(${-45}, ${innerHeight / 2}) rotate(-90)`}
          textAnchor="middle"
          fill="#374151"
          fontSize={11}
        >
          {displayLabel}{unit ? ` (${unit})` : ''}
        </text>
      )}
    </g>
  );
}

interface LegendProps {
  series: DataSeries[];
  onToggle?: (seriesId: string) => void;
}

/**
 * 凡例コンポーネント
 */
function Legend({ series, onToggle }: LegendProps) {
  return (
    <div className="flex flex-wrap gap-4 justify-center mt-3">
      {series.map((s, i) => (
        <button
          key={s.id}
          onClick={() => onToggle?.(s.id)}
          className={`flex items-center gap-1.5 text-xs transition-opacity ${
            s.visible === false ? 'opacity-40' : ''
          }`}
        >
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: s.color || getChartColor(i) }}
          />
          <span className="text-gray-600">{s.nameJa || s.name}</span>
        </button>
      ))}
    </div>
  );
}

interface TooltipProps {
  x: number;
  y: number;
  content: React.ReactNode;
  visible: boolean;
}

/**
 * ツールチップコンポーネント
 */
function Tooltip({ x, y, content, visible }: TooltipProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-50"
      style={{
        left: x + 10,
        top: y - 10,
        transform: 'translateY(-100%)',
      }}
    >
      {content}
    </div>
  );
}

// ============================================================================
// LineChart
// ============================================================================

interface LineChartProps {
  series: DataSeries[];
  config?: LineChartConfig;
  onPointClick?: (point: DataPoint, seriesId: string) => void;
}

/**
 * 折れ線グラフコンポーネント
 */
export function LineChart({ series, config = {}, onPointClick }: LineChartProps) {
  const {
    title,
    titleJa,
    width = '100%',
    height = 300,
    margin = { top: 20, right: 30, bottom: 50, left: 60 },
    xAxis,
    yAxis,
    showPoints = true,
    pointSize = 4,
    lineWidth = 2,
    smooth = false,
    showArea = false,
    areaOpacity = 0.1,
    animate = true,
  } = config;

  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(
    new Set(series.map((s) => s.id))
  );
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: React.ReactNode;
  }>({ visible: false, x: 0, y: 0, content: null });

  // 表示するシリーズのみ抽出
  const activeSeries = useMemo(
    () => series.filter((s) => visibleSeries.has(s.id)),
    [series, visibleSeries]
  );

  // データ範囲計算
  const { xMin, xMax, yMin, yMax } = useMemo(
    () => calculateDataRange(activeSeries),
    [activeSeries]
  );

  const xRange = calculateAxisRange(
    xAxis?.min ?? xMin,
    xAxis?.max ?? xMax,
    0.05
  );
  const yRange = calculateAxisRange(
    yAxis?.min ?? yMin,
    yAxis?.max ?? yMax,
    0.1
  );

  // SVGサイズ（レスポンシブ対応）
  const svgWidth = typeof width === 'number' ? width : 600;
  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // スケール変換関数
  const scaleX = useCallback(
    (x: number) => ((x - xRange.min) / (xRange.max - xRange.min)) * innerWidth,
    [xRange, innerWidth]
  );

  const scaleY = useCallback(
    (y: number) =>
      innerHeight - ((y - yRange.min) / (yRange.max - yRange.min)) * innerHeight,
    [yRange, innerHeight]
  );

  // 凡例トグル
  const handleToggle = (seriesId: string) => {
    setVisibleSeries((prev) => {
      const next = new Set(prev);
      if (next.has(seriesId)) {
        next.delete(seriesId);
      } else {
        next.add(seriesId);
      }
      return next;
    });
  };

  // マウスイベント
  const handleMouseEnter = (point: DataPoint, seriesName: string, event: React.MouseEvent) => {
    const rect = (event.target as SVGElement).getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      content: (
        <div>
          <div className="font-medium">{seriesName}</div>
          <div>X: {formatNumber(point.x, { precision: 3 })}</div>
          <div>Y: {formatNumber(point.y, { precision: 3 })}</div>
        </div>
      ),
    });
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  return (
    <ChartContainer title={title} titleJa={titleJa} width={width} height={height + 50}>
      <div className="relative">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${svgWidth} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 軸 */}
          <Axis
            type="x"
            min={xRange.min}
            max={xRange.max}
            width={svgWidth}
            height={height}
            margin={margin}
            label={xAxis?.label}
            labelJa={xAxis?.labelJa}
            unit={xAxis?.unit}
          />
          <Axis
            type="y"
            min={yRange.min}
            max={yRange.max}
            width={svgWidth}
            height={height}
            margin={margin}
            label={yAxis?.label}
            labelJa={yAxis?.labelJa}
            unit={yAxis?.unit}
          />

          {/* データプロット領域 */}
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {activeSeries.map((s, seriesIndex) => {
              const color = s.color || getChartColor(seriesIndex);
              const scaledPoints = s.data.map((p) => ({
                x: scaleX(p.x),
                y: scaleY(p.y),
              }));

              const pathD = smooth
                ? generateSmoothPath(scaledPoints)
                : generateLinePath(scaledPoints);

              return (
                <g key={s.id}>
                  {/* エリア */}
                  {showArea && (
                    <path
                      d={`${pathD} L ${scaledPoints[scaledPoints.length - 1].x} ${innerHeight} L ${scaledPoints[0].x} ${innerHeight} Z`}
                      fill={color}
                      fillOpacity={areaOpacity}
                    />
                  )}

                  {/* ライン */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth={lineWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={animate ? 'transition-all duration-300' : ''}
                  />

                  {/* ポイント */}
                  {showPoints &&
                    s.data.map((point, i) => (
                      <circle
                        key={i}
                        cx={scaledPoints[i].x}
                        cy={scaledPoints[i].y}
                        r={pointSize}
                        fill={color}
                        stroke="white"
                        strokeWidth={1.5}
                        className="cursor-pointer hover:r-6 transition-all"
                        onMouseEnter={(e) =>
                          handleMouseEnter(point, s.nameJa || s.name, e)
                        }
                        onMouseLeave={handleMouseLeave}
                        onClick={() => onPointClick?.(point, s.id)}
                      />
                    ))}
                </g>
              );
            })}
          </g>
        </svg>

        {/* ツールチップ */}
        <Tooltip {...tooltip} />
      </div>

      {/* 凡例 */}
      {series.length > 1 && (
        <Legend
          series={series.map((s) => ({
            ...s,
            visible: visibleSeries.has(s.id),
          }))}
          onToggle={handleToggle}
        />
      )}
    </ChartContainer>
  );
}

// ============================================================================
// BarChart
// ============================================================================

interface BarChartProps {
  data: CategoricalPoint[];
  config?: BarChartConfig;
  onBarClick?: (point: CategoricalPoint) => void;
}

/**
 * 棒グラフコンポーネント
 */
export function BarChart({ data, config = {}, onBarClick }: BarChartProps) {
  const {
    title,
    titleJa,
    width = '100%',
    height = 300,
    margin = { top: 20, right: 30, bottom: 60, left: 60 },
    xAxis,
    yAxis,
    orientation = 'vertical',
    barWidth: configBarWidth,
    showValues = false,
    animate = true,
  } = config;

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: React.ReactNode;
  }>({ visible: false, x: 0, y: 0, content: null });

  // SVGサイズ
  const svgWidth = typeof width === 'number' ? width : 600;
  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // 値の範囲
  const minValue = Math.min(0, ...data.map((d) => d.value));
  const maxValue = Math.max(...data.map((d) => d.value));
  const yRange = calculateAxisRange(yAxis?.min ?? minValue, yAxis?.max ?? maxValue, 0.1);

  // バー設定
  const barGap = 8;
  const barWidth =
    configBarWidth || Math.max(10, (innerWidth - barGap * (data.length - 1)) / data.length);
  const totalBarsWidth = barWidth * data.length + barGap * (data.length - 1);
  const startX = (innerWidth - totalBarsWidth) / 2;

  // スケール変換
  const scaleY = useCallback(
    (v: number) =>
      innerHeight - ((v - yRange.min) / (yRange.max - yRange.min)) * innerHeight,
    [yRange, innerHeight]
  );

  const zeroY = scaleY(0);

  // マウスイベント
  const handleMouseEnter = (point: CategoricalPoint, event: React.MouseEvent) => {
    const rect = (event.target as SVGElement).getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2 + window.scrollX,
      y: rect.top + window.scrollY,
      content: (
        <div>
          <div className="font-medium">{point.category}</div>
          <div>{formatNumber(point.value, { precision: 3 })}</div>
        </div>
      ),
    });
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  if (orientation === 'horizontal') {
    // 横棒グラフ
    const barHeightForHorizontal = Math.max(
      10,
      (innerHeight - barGap * (data.length - 1)) / data.length
    );
    const xRange = calculateAxisRange(minValue, maxValue, 0.1);
    const scaleX = (v: number) =>
      ((v - xRange.min) / (xRange.max - xRange.min)) * innerWidth;

    return (
      <ChartContainer title={title} titleJa={titleJa} width={width} height={height}>
        <div className="relative">
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${svgWidth} ${height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {data.map((d, i) => {
                const color = d.color || getChartColor(i);
                const y = i * (barHeightForHorizontal + barGap);
                const barW = scaleX(d.value) - scaleX(0);

                return (
                  <g key={d.category}>
                    <rect
                      x={d.value >= 0 ? scaleX(0) : scaleX(d.value)}
                      y={y}
                      width={Math.abs(barW)}
                      height={barHeightForHorizontal}
                      fill={color}
                      rx={2}
                      className={`cursor-pointer hover:opacity-80 ${
                        animate ? 'transition-all duration-300' : ''
                      }`}
                      onMouseEnter={(e) => handleMouseEnter(d, e)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => onBarClick?.(d)}
                    />
                    {/* カテゴリラベル */}
                    <text
                      x={-8}
                      y={y + barHeightForHorizontal / 2}
                      textAnchor="end"
                      alignmentBaseline="middle"
                      fill="#374151"
                      fontSize={10}
                    >
                      {d.category}
                    </text>
                    {/* 値ラベル */}
                    {showValues && (
                      <text
                        x={scaleX(d.value) + (d.value >= 0 ? 5 : -5)}
                        y={y + barHeightForHorizontal / 2}
                        textAnchor={d.value >= 0 ? 'start' : 'end'}
                        alignmentBaseline="middle"
                        fill="#6b7280"
                        fontSize={10}
                      >
                        {formatNumber(d.value, { precision: 2 })}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
          <Tooltip {...tooltip} />
        </div>
      </ChartContainer>
    );
  }

  // 縦棒グラフ
  return (
    <ChartContainer title={title} titleJa={titleJa} width={width} height={height}>
      <div className="relative">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${svgWidth} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Y軸 */}
          <Axis
            type="y"
            min={yRange.min}
            max={yRange.max}
            width={svgWidth}
            height={height}
            margin={margin}
            label={yAxis?.label}
            labelJa={yAxis?.labelJa}
            unit={yAxis?.unit}
          />

          {/* バー */}
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {data.map((d, i) => {
              const color = d.color || getChartColor(i);
              const x = startX + i * (barWidth + barGap);
              const barH = Math.abs(scaleY(d.value) - zeroY);
              const barY = d.value >= 0 ? scaleY(d.value) : zeroY;

              return (
                <g key={d.category}>
                  <rect
                    x={x}
                    y={barY}
                    width={barWidth}
                    height={barH}
                    fill={color}
                    rx={2}
                    className={`cursor-pointer hover:opacity-80 ${
                      animate ? 'transition-all duration-300' : ''
                    }`}
                    onMouseEnter={(e) => handleMouseEnter(d, e)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => onBarClick?.(d)}
                  />
                  {/* カテゴリラベル */}
                  <text
                    x={x + barWidth / 2}
                    y={innerHeight + 15}
                    textAnchor="middle"
                    fill="#374151"
                    fontSize={10}
                    transform={`rotate(-45, ${x + barWidth / 2}, ${innerHeight + 15})`}
                  >
                    {d.category}
                  </text>
                  {/* 値ラベル */}
                  {showValues && (
                    <text
                      x={x + barWidth / 2}
                      y={barY - 5}
                      textAnchor="middle"
                      fill="#6b7280"
                      fontSize={10}
                    >
                      {formatNumber(d.value, { precision: 2 })}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
        <Tooltip {...tooltip} />
      </div>
    </ChartContainer>
  );
}

// ============================================================================
// エクスポート
// ============================================================================

export { ChartContainer, Axis, Legend, Tooltip };
