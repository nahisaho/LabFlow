/**
 * Science Charts
 * 
 * 科学データ専用チャートコンポーネント
 * - PropertyDistributionChart: プロパティ分布（ヒストグラム）
 * - ConvergencePlot: 収束プロット
 * - EnergyLandscape: エネルギーランドスケープ
 * - SummaryStats: 統計サマリー
 */
'use client';

import { useState, useMemo } from 'react';
import type {
  PropertyDistribution,
  ConvergencePoint,
  EnergyPoint,
  DataSeries,
} from './types';
import {
  getChartColor,
  calculateHistogramBins,
  calculateStatistics,
  formatNumber,
  formatWithUnit,
} from './utils';
import { ChartContainer, Axis } from './basic-charts';
import { LineChart } from './basic-charts';

// ============================================================================
// PropertyDistributionChart（ヒストグラム）
// ============================================================================

interface PropertyDistributionChartProps {
  distribution: PropertyDistribution;
  config?: {
    title?: string;
    titleJa?: string;
    width?: number | string;
    height?: number;
    color?: string;
    showStats?: boolean;
    showKDE?: boolean;
  };
}

/**
 * プロパティ分布チャート（ヒストグラム）
 */
export function PropertyDistributionChart({
  distribution,
  config = {},
}: PropertyDistributionChartProps) {
  const {
    title,
    titleJa,
    width = '100%',
    height = 250,
    color = '#3b82f6',
    showStats = true,
  } = config;

  const displayTitle =
    titleJa || title || distribution.propertyJa || distribution.property;

  // ヒストグラム計算
  const { bins, counts } = useMemo(
    () => calculateHistogramBins(distribution.values, distribution.bins || 20),
    [distribution]
  );

  // 統計量
  const stats = useMemo(
    () => calculateStatistics(distribution.values),
    [distribution.values]
  );

  // SVGサイズ
  const svgWidth = typeof width === 'number' ? width : 500;
  const margin = { top: 20, right: 20, bottom: 50, left: 60 };
  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // スケール
  const maxCount = Math.max(...counts);
  const barWidth = innerWidth / counts.length;

  const scaleX = (i: number) => i * barWidth;
  const scaleY = (count: number) =>
    innerHeight - (count / maxCount) * innerHeight;

  return (
    <ChartContainer title={displayTitle} width={width} height={height + (showStats ? 80 : 0)}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${svgWidth} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* バー */}
          {counts.map((count, i) => (
            <rect
              key={i}
              x={scaleX(i)}
              y={scaleY(count)}
              width={barWidth - 1}
              height={innerHeight - scaleY(count)}
              fill={color}
              opacity={0.7}
              className="hover:opacity-100 transition-opacity"
            />
          ))}

          {/* 平均線 */}
          {(() => {
            const meanX =
              ((stats.mean - bins[0]) / (bins[bins.length - 1] - bins[0])) *
              innerWidth;
            return (
              <g>
                <line
                  x1={meanX}
                  y1={0}
                  x2={meanX}
                  y2={innerHeight}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5,3"
                />
                <text
                  x={meanX + 5}
                  y={15}
                  fill="#ef4444"
                  fontSize={10}
                >
                  平均
                </text>
              </g>
            );
          })()}

          {/* X軸ラベル */}
          {[0, Math.floor(bins.length / 2), bins.length - 1].map((i) => (
            <text
              key={i}
              x={scaleX(i)}
              y={innerHeight + 15}
              fill="#6b7280"
              fontSize={9}
              textAnchor="middle"
            >
              {formatNumber(bins[i], { precision: 2 })}
            </text>
          ))}

          {/* 軸タイトル */}
          <text
            x={innerWidth / 2}
            y={innerHeight + 35}
            textAnchor="middle"
            fill="#374151"
            fontSize={11}
          >
            {distribution.propertyJa || distribution.property}
            {distribution.unit ? ` (${distribution.unit})` : ''}
          </text>

          {/* Y軸 */}
          <text
            transform={`translate(${-40}, ${innerHeight / 2}) rotate(-90)`}
            textAnchor="middle"
            fill="#374151"
            fontSize={11}
          >
            度数
          </text>
        </g>
      </svg>

      {/* 統計サマリー */}
      {showStats && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <StatItem label="平均" value={stats.mean} unit={distribution.unit} />
          <StatItem label="中央値" value={stats.median} unit={distribution.unit} />
          <StatItem label="標準偏差" value={stats.std} unit={distribution.unit} />
          <StatItem label="最小" value={stats.min} unit={distribution.unit} />
          <StatItem label="最大" value={stats.max} unit={distribution.unit} />
          <StatItem label="データ数" value={stats.count} />
        </div>
      )}
    </ChartContainer>
  );
}

function StatItem({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit?: string;
}) {
  return (
    <div className="bg-gray-50 rounded px-2 py-1">
      <div className="text-gray-500">{label}</div>
      <div className="font-medium text-gray-900">
        {typeof value === 'number' && !Number.isInteger(value)
          ? formatWithUnit(value, unit, 3)
          : value}
      </div>
    </div>
  );
}

// ============================================================================
// ConvergencePlot
// ============================================================================

interface ConvergencePlotProps {
  data: ConvergencePoint[];
  config?: {
    title?: string;
    titleJa?: string;
    width?: number | string;
    height?: number;
    metric?: string;
    metricJa?: string;
    showThreshold?: boolean;
    threshold?: number;
    logScale?: boolean;
  };
}

/**
 * 収束プロットコンポーネント
 */
export function ConvergencePlot({ data, config = {} }: ConvergencePlotProps) {
  const {
    title = '収束プロット',
    titleJa = '収束プロット',
    width = '100%',
    height = 250,
    metric = 'Loss',
    metricJa = '損失',
    showThreshold = false,
    threshold,
    logScale = false,
  } = config;

  // DataSeriesに変換
  const series: DataSeries[] = useMemo(
    () => [
      {
        id: 'convergence',
        name: metric,
        nameJa: metricJa,
        data: data.map((p) => ({
          x: p.iteration,
          y: logScale ? Math.log10(p.value) : p.value,
        })),
        color: '#3b82f6',
      },
    ],
    [data, metric, metricJa, logScale]
  );

  // 収束判定
  const isConverged = useMemo(() => {
    if (data.length < 10) return false;
    const recent = data.slice(-10);
    const avg = recent.reduce((s, p) => s + p.value, 0) / recent.length;
    const variance =
      recent.reduce((s, p) => s + Math.pow(p.value - avg, 2), 0) / recent.length;
    return variance < avg * 0.01; // 1%以下の変動
  }, [data]);

  return (
    <div className="relative">
      <LineChart
        series={series}
        config={{
          title,
          titleJa,
          width,
          height,
          xAxis: {
            label: 'Iteration',
            labelJa: 'イテレーション',
          },
          yAxis: {
            label: logScale ? `log₁₀(${metric})` : metric,
            labelJa: logScale ? `log₁₀(${metricJa})` : metricJa,
          },
          showPoints: false,
          lineWidth: 2,
          smooth: true,
        }}
      />

      {/* 収束状態バッジ */}
      <div className="absolute top-4 right-4">
        {isConverged ? (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            ✓ 収束済み
          </span>
        ) : (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
            ⟳ 学習中
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EnergyLandscape
// ============================================================================

interface EnergyLandscapeProps {
  points: EnergyPoint[];
  config?: {
    title?: string;
    titleJa?: string;
    width?: number | string;
    height?: number;
    unit?: string;
  };
}

/**
 * エネルギーランドスケープコンポーネント
 */
export function EnergyLandscape({ points, config = {} }: EnergyLandscapeProps) {
  const {
    title = 'Energy Landscape',
    titleJa = 'エネルギーランドスケープ',
    width = '100%',
    height = 300,
    unit = 'eV',
  } = config;

  const displayTitle = titleJa || title;

  // SVGサイズ
  const svgWidth = typeof width === 'number' ? width : 600;
  const margin = { top: 30, right: 30, bottom: 50, left: 60 };
  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // 1次元設定配列として表示（X軸はreaction coordinate）
  const energies = points.map((p) => p.energy);
  const minEnergy = Math.min(...energies);
  const maxEnergy = Math.max(...energies);
  const energyRange = maxEnergy - minEnergy || 1;

  // スケール
  const scaleX = (i: number) => (i / (points.length - 1)) * innerWidth;
  const scaleY = (e: number) =>
    innerHeight - ((e - minEnergy) / energyRange) * innerHeight * 0.8 - innerHeight * 0.1;

  // パス生成（スムーズカーブ）
  const pathD = useMemo(() => {
    if (points.length < 2) return '';
    let d = `M ${scaleX(0)} ${scaleY(points[0].energy)}`;
    for (let i = 1; i < points.length; i++) {
      const x0 = scaleX(i - 1);
      const x1 = scaleX(i);
      const y0 = scaleY(points[i - 1].energy);
      const y1 = scaleY(points[i].energy);
      const cx = (x0 + x1) / 2;
      d += ` Q ${cx} ${y0}, ${x1} ${y1}`;
    }
    return d;
  }, [points]);

  return (
    <ChartContainer title={displayTitle} width={width} height={height}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${svgWidth} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="energy-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2} />
          </linearGradient>
        </defs>

        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* 背景グラデーション */}
          <rect
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="url(#energy-gradient)"
          />

          {/* エネルギーカーブ */}
          <path
            d={pathD}
            fill="none"
            stroke="#374151"
            strokeWidth={2.5}
          />

          {/* ポイントマーカー */}
          {points.map((point, i) => {
            const x = scaleX(i);
            const y = scaleY(point.energy);
            const isSpecial = point.isMinimum || point.isTransitionState;

            return (
              <g key={i}>
                {/* マーカー */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSpecial ? 8 : 5}
                  fill={
                    point.isMinimum
                      ? '#10b981'
                      : point.isTransitionState
                      ? '#ef4444'
                      : '#6b7280'
                  }
                  stroke="white"
                  strokeWidth={2}
                />

                {/* ラベル */}
                {point.label && (
                  <text
                    x={x}
                    y={y - 15}
                    textAnchor="middle"
                    fill="#374151"
                    fontSize={10}
                    fontWeight={isSpecial ? 'bold' : 'normal'}
                  >
                    {point.label}
                  </text>
                )}

                {/* エネルギー値 */}
                {isSpecial && (
                  <text
                    x={x}
                    y={y + 20}
                    textAnchor="middle"
                    fill="#6b7280"
                    fontSize={9}
                  >
                    {formatNumber(point.energy, { precision: 2 })} {unit}
                  </text>
                )}
              </g>
            );
          })}

          {/* X軸 */}
          <line
            x1={0}
            y1={innerHeight}
            x2={innerWidth}
            y2={innerHeight}
            stroke="#d1d5db"
            strokeWidth={1}
          />
          <text
            x={innerWidth / 2}
            y={innerHeight + 35}
            textAnchor="middle"
            fill="#374151"
            fontSize={11}
          >
            反応座標
          </text>

          {/* Y軸 */}
          <text
            transform={`translate(${-40}, ${innerHeight / 2}) rotate(-90)`}
            textAnchor="middle"
            fill="#374151"
            fontSize={11}
          >
            エネルギー ({unit})
          </text>
        </g>

        {/* 凡例 */}
        <g transform={`translate(${svgWidth - 120}, 10)`}>
          <circle cx={10} cy={8} r={5} fill="#10b981" />
          <text x={20} y={12} fill="#374151" fontSize={9}>
            安定状態
          </text>
          <circle cx={10} cy={28} r={5} fill="#ef4444" />
          <text x={20} y={32} fill="#374151" fontSize={9}>
            遷移状態
          </text>
        </g>
      </svg>
    </ChartContainer>
  );
}

// ============================================================================
// SummaryStats（統計サマリーカード）
// ============================================================================

interface SummaryStatsProps {
  title?: string;
  titleJa?: string;
  stats: Array<{
    label: string;
    labelJa?: string;
    value: number | string;
    unit?: string;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
  }>;
  columns?: number;
}

/**
 * 統計サマリーコンポーネント
 */
export function SummaryStats({
  title,
  titleJa,
  stats,
  columns = 4,
}: SummaryStatsProps) {
  const displayTitle = titleJa || title;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {displayTitle && (
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{displayTitle}</h3>
      )}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {stats.map((stat, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">
              {stat.labelJa || stat.label}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-gray-900">
                {typeof stat.value === 'number'
                  ? formatNumber(stat.value, { precision: 3 })
                  : stat.value}
              </span>
              {stat.unit && (
                <span className="text-xs text-gray-500">{stat.unit}</span>
              )}
            </div>
            {stat.change !== undefined && (
              <div
                className={`text-xs mt-1 flex items-center gap-1 ${
                  stat.trend === 'up'
                    ? 'text-green-600'
                    : stat.trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}
              >
                {stat.trend === 'up' && '↑'}
                {stat.trend === 'down' && '↓'}
                {stat.trend === 'neutral' && '→'}
                {stat.change > 0 ? '+' : ''}
                {formatNumber(stat.change, { precision: 1 })}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// エクスポート
// ============================================================================

export type {
  PropertyDistributionChartProps,
  ConvergencePlotProps,
  EnergyLandscapeProps,
  SummaryStatsProps,
};
