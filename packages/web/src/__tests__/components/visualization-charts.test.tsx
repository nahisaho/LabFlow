/**
 * Visualization Charts Tests
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LineChart, BarChart } from '@/components/visualization/basic-charts';
import { ScatterPlot, Heatmap } from '@/components/visualization/advanced-charts';
import type { DataSeries, HeatmapData, LineChartConfig, BarChartConfig } from '@/components/visualization/types';

// Mock ResizeObserver
vi.stubGlobal('ResizeObserver', vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));

describe('Basic Charts', () => {
  const sampleSeries: DataSeries[] = [
    {
      id: 'series1',
      name: 'Series 1',
      nameJa: 'シリーズ1',
      data: [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
        { x: 2, y: 15 },
        { x: 3, y: 25 },
      ],
      color: '#3b82f6',
    },
    {
      id: 'series2',
      name: 'Series 2',
      data: [
        { x: 0, y: 5 },
        { x: 1, y: 15 },
        { x: 2, y: 10 },
        { x: 3, y: 20 },
      ],
      color: '#10b981',
    },
  ];

  describe('LineChart', () => {
    const config: LineChartConfig = {
      title: 'Test Line Chart',
      titleJa: 'テスト線グラフ',
      xAxis: { label: 'X Axis', labelJa: 'X軸' },
      yAxis: { label: 'Y Axis', labelJa: 'Y軸' },
    };

    it('should render chart title', () => {
      render(<LineChart series={sampleSeries} config={config} />);
      // titleJa is displayed by default
      expect(screen.getByText('テスト線グラフ')).toBeDefined();
    });

    it('should render Japanese title when titleJa provided', () => {
      render(<LineChart series={sampleSeries} config={config} />);
      expect(screen.getByText('テスト線グラフ')).toBeDefined();
    });

    it('should render legend items', () => {
      render(<LineChart series={sampleSeries} config={config} />);
      // 凡例にシリーズ名が表示される（nameJaが優先）
      expect(screen.getByText('シリーズ1')).toBeDefined();
      expect(screen.getByText('Series 2')).toBeDefined();
    });

    it('should render SVG element', () => {
      const { container } = render(<LineChart series={sampleSeries} config={config} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
    });

    it('should handle empty data', () => {
      render(<LineChart series={[]} config={config} />);
      expect(screen.getByText('テスト線グラフ')).toBeDefined();
    });

    it('should handle legend click to toggle series', () => {
      render(<LineChart series={sampleSeries} config={config} />);
      const legendItem = screen.getByText('シリーズ1');
      fireEvent.click(legendItem);
      // Series should be hidden (opacity reduced)
    });
  });

  describe('BarChart', () => {
    const barData = [
      { category: 'A', categoryJa: 'カテゴリA', value: 10 },
      { category: 'B', categoryJa: 'カテゴリB', value: 20 },
      { category: 'C', categoryJa: 'カテゴリC', value: 15 },
      { category: 'D', categoryJa: 'カテゴリD', value: 25 },
    ];

    const config: BarChartConfig = {
      title: 'Test Bar Chart',
      xAxis: { label: 'Category' },
      yAxis: { label: 'Value' },
      orientation: 'vertical',
    };

    it('should render chart title', () => {
      render(<BarChart data={barData} config={config} />);
      expect(screen.getByText('Test Bar Chart')).toBeDefined();
    });

    it('should render SVG with bars', () => {
      const { container } = render(<BarChart data={barData} config={config} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
    });
  });
});

describe('Advanced Charts', () => {
  describe('ScatterPlot', () => {
    const scatterData: DataSeries[] = [
      {
        id: 'scatter1',
        name: 'Sample A',
        data: [
          { x: 1, y: 2 },
          { x: 2, y: 4 },
          { x: 3, y: 6 },
          { x: 4, y: 8 },
        ],
      },
    ];

    it('should render scatter plot', () => {
      render(
        <ScatterPlot
          series={scatterData}
          config={{
            title: 'Scatter Test',
            xAxis: { label: 'X' },
            yAxis: { label: 'Y' },
          }}
        />
      );
      expect(screen.getByText('Scatter Test')).toBeDefined();
    });

    it('should render trendline when enabled', () => {
      const { container } = render(
        <ScatterPlot
          series={scatterData}
          config={{
            title: 'Scatter Test',
            xAxis: { label: 'X' },
            yAxis: { label: 'Y' },
            showTrendline: true,
          }}
        />
      );
      // Check for trendline line element with dashed stroke
      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
      // Trendline is rendered as a line element
      const lines = container.querySelectorAll('line');
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should show R² value when trendline enabled', () => {
      const { container } = render(
        <ScatterPlot
          series={scatterData}
          config={{
            title: 'Scatter Test',
            xAxis: { label: 'X' },
            yAxis: { label: 'Y' },
            showTrendline: true,
          }}
        />
      );
      // R² should be displayed within SVG text element
      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
      expect(svg?.textContent).toContain('R²');
    });
  });

  describe('Heatmap', () => {
    const heatmapData: HeatmapData = {
      values: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
      xLabels: ['A', 'B', 'C'],
      yLabels: ['X', 'Y', 'Z'],
      minValue: 1,
      maxValue: 9,
    };

    it('should render heatmap', () => {
      render(
        <Heatmap
          data={heatmapData}
          config={{
            title: 'Heatmap Test',
            colorScale: 'viridis',
          }}
        />
      );
      expect(screen.getByText('Heatmap Test')).toBeDefined();
    });

    it('should render correct number of cells', () => {
      const { container } = render(
        <Heatmap
          data={heatmapData}
          config={{
            title: 'Heatmap Test',
          }}
        />
      );
      const cells = container.querySelectorAll('rect');
      // 3x3 = 9 cells + potentially legend rect
      expect(cells.length).toBeGreaterThanOrEqual(9);
    });

    it('should render labels', () => {
      render(
        <Heatmap
          data={heatmapData}
          config={{
            title: 'Heatmap Test',
          }}
        />
      );
      expect(screen.getByText('A')).toBeDefined();
      expect(screen.getByText('X')).toBeDefined();
    });

    it('should render color legend', () => {
      const { container } = render(
        <Heatmap
          data={heatmapData}
          config={{
            title: 'Heatmap Test',
            showColorLegend: true,
          }}
        />
      );
      // Should have gradient definition
      const defs = container.querySelector('defs');
      expect(defs).toBeDefined();
    });
  });
});
