/**
 * Advanced Chart Components
 * 
 * ScatterPlot と Heatmap の高度なチャートコンポーネント
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
import type {
  DataPoint,
  DataSeries,
  HeatmapData,
  ScatterPlotConfig,
  HeatmapConfig,
} from './types';
import {
  getChartColor,
  getColorFromScale,
  getColorScaleGradient,
  calculateDataRange,
  calculateAxisRange,
  formatNumber,
  linearRegression,
} from './utils';
import { ChartContainer, Axis, Legend, Tooltip } from './basic-charts';

// ============================================================================
// ScatterPlot
// ============================================================================

interface ScatterPlotProps {
  series: DataSeries[];
  config?: ScatterPlotConfig;
  onPointClick?: (point: DataPoint, seriesId: string) => void;
}

/**
 * 散布図コンポーネント
 */
export function ScatterPlot({ series, config = {}, onPointClick }: ScatterPlotProps) {
  const {
    title,
    titleJa,
    width = '100%',
    height = 300,
    margin = { top: 20, right: 30, bottom: 50, left: 60 },
    xAxis,
    yAxis,
    pointSize = 6,
    pointOpacity = 0.7,
    showTrendline = false,
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

  const xRange = calculateAxisRange(xAxis?.min ?? xMin, xAxis?.max ?? xMax, 0.1);
  const yRange = calculateAxisRange(yAxis?.min ?? yMin, yAxis?.max ?? yMax, 0.1);

  // SVGサイズ
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

  // トレンドライン計算
  const trendlines = useMemo(() => {
    if (!showTrendline) return [];

    return activeSeries.map((s) => {
      const xValues = s.data.map((p) => p.x);
      const yValues = s.data.map((p) => p.y);
      const { slope, intercept, r2 } = linearRegression(xValues, yValues);

      const x1 = xRange.min;
      const x2 = xRange.max;
      const y1 = slope * x1 + intercept;
      const y2 = slope * x2 + intercept;

      return {
        seriesId: s.id,
        x1: scaleX(x1),
        y1: scaleY(y1),
        x2: scaleX(x2),
        y2: scaleY(y2),
        r2,
        color: s.color,
      };
    });
  }, [activeSeries, showTrendline, xRange, scaleX, scaleY]);

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
  const handleMouseEnter = (
    point: DataPoint,
    seriesName: string,
    event: React.MouseEvent
  ) => {
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
          {point.label && <div className="text-gray-300">{point.label}</div>}
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
            {/* トレンドライン */}
            {trendlines.map((line, i) => (
              <g key={`trend-${line.seriesId}`}>
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={line.color || getChartColor(i)}
                  strokeWidth={1.5}
                  strokeDasharray="5,5"
                  opacity={0.6}
                />
                {/* R² 表示 */}
                <text
                  x={line.x2 - 5}
                  y={line.y2 - 5}
                  fill={line.color || getChartColor(i)}
                  fontSize={9}
                  textAnchor="end"
                >
                  R² = {line.r2.toFixed(3)}
                </text>
              </g>
            ))}

            {/* データポイント */}
            {activeSeries.map((s, seriesIndex) => {
              const color = s.color || getChartColor(seriesIndex);

              return (
                <g key={s.id}>
                  {s.data.map((point, i) => (
                    <circle
                      key={i}
                      cx={scaleX(point.x)}
                      cy={scaleY(point.y)}
                      r={pointSize}
                      fill={point.color || color}
                      fillOpacity={pointOpacity}
                      stroke="white"
                      strokeWidth={1}
                      className={`cursor-pointer hover:opacity-100 ${
                        animate ? 'transition-all duration-200' : ''
                      }`}
                      onMouseEnter={(e) => handleMouseEnter(point, s.nameJa || s.name, e)}
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
// Heatmap
// ============================================================================

interface HeatmapProps {
  data: HeatmapData;
  config?: HeatmapConfig;
  onCellClick?: (x: string, y: string, value: number) => void;
}

/**
 * ヒートマップコンポーネント
 */
export function Heatmap({ data, config = {}, onCellClick }: HeatmapProps) {
  const {
    title,
    titleJa,
    width = '100%',
    height = 300,
    margin = { top: 20, right: 80, bottom: 60, left: 80 },
    xAxis,
    yAxis,
    colorScale = 'viridis',
    showValues = false,
    cellBorder = true,
    cellBorderColor = '#ffffff',
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

  // セルサイズ
  const cellWidth = innerWidth / data.xLabels.length;
  const cellHeight = innerHeight / data.yLabels.length;

  // 値の範囲
  const minValue = data.minValue ?? Math.min(...data.values.flat());
  const maxValue = data.maxValue ?? Math.max(...data.values.flat());

  // マウスイベント
  const handleMouseEnter = (
    xLabel: string,
    yLabel: string,
    value: number,
    event: React.MouseEvent
  ) => {
    const rect = (event.target as SVGElement).getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2 + window.scrollX,
      y: rect.top + window.scrollY,
      content: (
        <div>
          <div className="font-medium">
            {xLabel} × {yLabel}
          </div>
          <div>{formatNumber(value, { precision: 3 })}</div>
        </div>
      ),
    });
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  return (
    <ChartContainer title={title} titleJa={titleJa} width={width} height={height + 30}>
      <div className="relative">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${svgWidth} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* セル */}
            {data.values.map((row, rowIndex) =>
              row.map((value, colIndex) => {
                const color = getColorFromScale(value, minValue, maxValue, colorScale);
                const x = colIndex * cellWidth;
                const y = rowIndex * cellHeight;

                return (
                  <g key={`${rowIndex}-${colIndex}`}>
                    <rect
                      x={x}
                      y={y}
                      width={cellWidth}
                      height={cellHeight}
                      fill={color}
                      stroke={cellBorder ? cellBorderColor : 'none'}
                      strokeWidth={cellBorder ? 1 : 0}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onMouseEnter={(e) =>
                        handleMouseEnter(
                          data.xLabels[colIndex],
                          data.yLabels[rowIndex],
                          value,
                          e
                        )
                      }
                      onMouseLeave={handleMouseLeave}
                      onClick={() =>
                        onCellClick?.(
                          data.xLabels[colIndex],
                          data.yLabels[rowIndex],
                          value
                        )
                      }
                    />
                    {/* 値表示 */}
                    {showValues && cellWidth > 30 && cellHeight > 20 && (
                      <text
                        x={x + cellWidth / 2}
                        y={y + cellHeight / 2}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill={value > (minValue + maxValue) / 2 ? '#ffffff' : '#000000'}
                        fontSize={Math.min(10, cellHeight * 0.4)}
                      >
                        {formatNumber(value, { precision: 1 })}
                      </text>
                    )}
                  </g>
                );
              })
            )}

            {/* X軸ラベル */}
            {data.xLabels.map((label, i) => (
              <text
                key={`x-${i}`}
                x={i * cellWidth + cellWidth / 2}
                y={innerHeight + 15}
                textAnchor="end"
                fill="#374151"
                fontSize={Math.min(10, cellWidth * 0.8)}
                transform={`rotate(-45, ${i * cellWidth + cellWidth / 2}, ${innerHeight + 15})`}
              >
                {label}
              </text>
            ))}

            {/* Y軸ラベル */}
            {data.yLabels.map((label, i) => (
              <text
                key={`y-${i}`}
                x={-8}
                y={i * cellHeight + cellHeight / 2}
                textAnchor="end"
                alignmentBaseline="middle"
                fill="#374151"
                fontSize={Math.min(10, cellHeight * 0.8)}
              >
                {label}
              </text>
            ))}

            {/* X軸タイトル */}
            {(xAxis?.labelJa || xAxis?.label) && (
              <text
                x={innerWidth / 2}
                y={innerHeight + 45}
                textAnchor="middle"
                fill="#374151"
                fontSize={11}
              >
                {xAxis?.labelJa || xAxis?.label}
              </text>
            )}

            {/* Y軸タイトル */}
            {(yAxis?.labelJa || yAxis?.label) && (
              <text
                transform={`translate(${-55}, ${innerHeight / 2}) rotate(-90)`}
                textAnchor="middle"
                fill="#374151"
                fontSize={11}
              >
                {yAxis?.labelJa || yAxis?.label}
              </text>
            )}
          </g>

          {/* カラースケールレジェンド */}
          <g transform={`translate(${svgWidth - margin.right + 20}, ${margin.top})`}>
            <defs>
              <linearGradient id="heatmap-gradient" x1="0" x2="0" y1="1" y2="0">
                {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                  <stop
                    key={t}
                    offset={`${t * 100}%`}
                    stopColor={getColorFromScale(
                      minValue + t * (maxValue - minValue),
                      minValue,
                      maxValue,
                      colorScale
                    )}
                  />
                ))}
              </linearGradient>
            </defs>
            <rect
              x={0}
              y={0}
              width={15}
              height={innerHeight}
              fill="url(#heatmap-gradient)"
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            {/* スケールラベル */}
            <text
              x={20}
              y={5}
              fill="#6b7280"
              fontSize={9}
              alignmentBaseline="hanging"
            >
              {formatNumber(maxValue, { precision: 2 })}
            </text>
            <text
              x={20}
              y={innerHeight}
              fill="#6b7280"
              fontSize={9}
              alignmentBaseline="baseline"
            >
              {formatNumber(minValue, { precision: 2 })}
            </text>
          </g>
        </svg>

        {/* ツールチップ */}
        <Tooltip {...tooltip} />
      </div>
    </ChartContainer>
  );
}

// ============================================================================
// エクスポート
// ============================================================================

export type { ScatterPlotProps, HeatmapProps };
