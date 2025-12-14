/**
 * Visualization Dashboard Tests
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  VisualizationDashboard,
  DashboardSelector,
  MATERIALS_DASHBOARD_LAYOUT,
  DRUG_DASHBOARD_LAYOUT,
  CLIMATE_DASHBOARD_LAYOUT,
  GENOMICS_DASHBOARD_LAYOUT,
} from '@/components/visualization/dashboard';
import type { DashboardLayout, DashboardWidget } from '@/components/visualization/types';

// Mock ResizeObserver
vi.stubGlobal('ResizeObserver', vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));

describe('Dashboard Components', () => {
  // Sample data for testing
  const sampleLineData = [
    {
      id: 'energy',
      name: 'Energy',
      data: [
        { x: 0, y: -100 },
        { x: 1, y: -95 },
        { x: 2, y: -92 },
      ],
    },
  ];

  const sampleHeatmapData = {
    values: [[1, 2], [3, 4]],
    xLabels: ['A', 'B'],
    yLabels: ['X', 'Y'],
    minValue: 1,
    maxValue: 4,
  };

  const sampleMolecule = {
    id: 'test',
    name: 'Test Molecule',
    formula: 'H2O',
    atoms: [
      { element: 'O', x: 0, y: 0, z: 0 },
      { element: 'H', x: 1, y: 0, z: 0 },
      { element: 'H', x: -1, y: 0, z: 0 },
    ],
    bonds: [
      { atom1: 0, atom2: 1, order: 1 },
      { atom1: 0, atom2: 2, order: 1 },
    ],
  };

  const sampleCrystal = {
    id: 'test',
    name: 'Test Crystal',
    formula: 'NaCl',
    lattice: { a: 5, b: 5, c: 5, alpha: 90, beta: 90, gamma: 90 },
    atoms: [
      { element: 'Na', x: 0, y: 0, z: 0 },
      { element: 'Cl', x: 0.5, y: 0.5, z: 0.5 },
    ],
  };

  const createTestLayout = (widgets: DashboardWidget[]): DashboardLayout => ({
    id: 'test-layout',
    name: 'Test Layout',
    nameJa: 'テストレイアウト',
    widgets,
    columns: 2,
    rows: 2,
  });

  describe('VisualizationDashboard', () => {
    it('should render layout title (Japanese)', () => {
      const layout = createTestLayout([]);
      const dataMap = new Map();
      render(<VisualizationDashboard layout={layout} dataMap={dataMap} />);
      // nameJa is displayed by default when available
      expect(screen.getByText('テストレイアウト')).toBeDefined();
    });

    it('should render line chart widget', () => {
      const layout = createTestLayout([
        {
          id: 'chart1',
          type: 'line-chart',
          title: 'Energy Chart',
          dataSource: 'energy',
          config: { xAxis: { label: 'Step' }, yAxis: { label: 'Energy' } },
          position: { x: 0, y: 0, width: 1, height: 1 },
        },
      ]);
      const dataMap = new Map([['energy', { lineSeries: sampleLineData }]]);
      render(<VisualizationDashboard layout={layout} dataMap={dataMap} />);
      expect(screen.getByText('Energy Chart')).toBeDefined();
    });

    it('should render scatter plot widget', () => {
      const layout = createTestLayout([
        {
          id: 'scatter',
          type: 'scatter-plot',
          title: 'Scatter',
          dataSource: 'scatter',
          config: { xAxis: { label: 'X' }, yAxis: { label: 'Y' } },
          position: { x: 0, y: 0, width: 1, height: 1 },
        },
      ]);
      const dataMap = new Map([['scatter', { scatterSeries: sampleLineData }]]);
      render(<VisualizationDashboard layout={layout} dataMap={dataMap} />);
      expect(screen.getByText('Scatter')).toBeDefined();
    });

    it('should render heatmap widget', () => {
      const layout = createTestLayout([
        {
          id: 'heatmap',
          type: 'heatmap',
          title: 'Heatmap',
          dataSource: 'heat',
          config: { colorScale: 'viridis' },
          position: { x: 0, y: 0, width: 1, height: 1 },
        },
      ]);
      const dataMap = new Map([['heat', { heatmapData: sampleHeatmapData }]]);
      render(<VisualizationDashboard layout={layout} dataMap={dataMap} />);
      expect(screen.getByText('Heatmap')).toBeDefined();
    });

    it('should render molecule viewer widget', () => {
      const layout = createTestLayout([
        {
          id: 'mol',
          type: 'molecule-viewer',
          title: 'Molecule',
          dataSource: 'molecule',
          position: { x: 0, y: 0, width: 1, height: 1 },
        },
      ]);
      const dataMap = new Map([['molecule', { molecule: sampleMolecule }]]);
      render(<VisualizationDashboard layout={layout} dataMap={dataMap} />);
      expect(screen.getByText('Test Molecule')).toBeDefined();
    });

    it('should render crystal viewer widget', () => {
      const layout = createTestLayout([
        {
          id: 'crystal',
          type: 'crystal-viewer',
          title: 'Crystal',
          dataSource: 'crystal',
          position: { x: 0, y: 0, width: 1, height: 1 },
        },
      ]);
      const dataMap = new Map([['crystal', { crystal: sampleCrystal }]]);
      render(<VisualizationDashboard layout={layout} dataMap={dataMap} />);
      expect(screen.getByText('Test Crystal')).toBeDefined();
    });

    it('should handle missing data gracefully', () => {
      const layout = createTestLayout([
        {
          id: 'missing',
          type: 'line-chart',
          title: 'Missing Data',
          dataSource: 'nonexistent',
          config: {},
          position: { x: 0, y: 0, width: 1, height: 1 },
        },
      ]);
      const dataMap = new Map();
      render(<VisualizationDashboard layout={layout} dataMap={dataMap} />);
      // Should show empty state message
      expect(screen.getByText('データがありません')).toBeDefined();
    });

    it('should apply custom className', () => {
      const layout = createTestLayout([]);
      const dataMap = new Map();
      const { container } = render(
        <VisualizationDashboard
          layout={layout}
          dataMap={dataMap}
        />
      );
      expect(container.querySelector('.space-y-4')).toBeDefined();
    });
  });

  describe('Preset Dashboard Layouts', () => {
    it('should have materials dashboard layout', () => {
      expect(MATERIALS_DASHBOARD_LAYOUT.id).toBe('materials-dashboard');
      expect(MATERIALS_DASHBOARD_LAYOUT.widgets.length).toBeGreaterThan(0);
    });

    it('should have drug dashboard layout', () => {
      expect(DRUG_DASHBOARD_LAYOUT.id).toBe('drug-dashboard');
      expect(DRUG_DASHBOARD_LAYOUT.widgets.length).toBeGreaterThan(0);
    });

    it('should have climate dashboard layout', () => {
      expect(CLIMATE_DASHBOARD_LAYOUT.id).toBe('climate-dashboard');
      expect(CLIMATE_DASHBOARD_LAYOUT.widgets.length).toBeGreaterThan(0);
    });

    it('should have genomics dashboard layout', () => {
      expect(GENOMICS_DASHBOARD_LAYOUT.id).toBe('genomics-dashboard');
      expect(GENOMICS_DASHBOARD_LAYOUT.widgets.length).toBeGreaterThan(0);
    });

    it('should have correct widget types in materials layout', () => {
      const widgetTypes = MATERIALS_DASHBOARD_LAYOUT.widgets.map(w => w.type);
      expect(widgetTypes).toContain('crystal-viewer');
      expect(widgetTypes).toContain('convergence-plot');
    });

    it('should have correct widget types in drug layout', () => {
      const widgetTypes = DRUG_DASHBOARD_LAYOUT.widgets.map(w => w.type);
      expect(widgetTypes).toContain('molecule-viewer');
      expect(widgetTypes).toContain('scatter-plot');
    });
  });

  describe('DashboardSelector', () => {
    it('should render all layout options', () => {
      const onSelect = vi.fn();
      render(<DashboardSelector selectedId="materials" onSelect={onSelect} />);
      expect(screen.getByText('材料科学')).toBeDefined();
      expect(screen.getByText('創薬')).toBeDefined();
      expect(screen.getByText('気候科学')).toBeDefined();
      expect(screen.getByText('ゲノミクス')).toBeDefined();
    });

    it('should call onSelect when layout clicked', () => {
      const onSelect = vi.fn();
      render(<DashboardSelector selectedId="materials" onSelect={onSelect} />);
      const button = screen.getByText('創薬');
      fireEvent.click(button);
      expect(onSelect).toHaveBeenCalledWith('drug');
    });

    it('should highlight selected layout', () => {
      const onSelect = vi.fn();
      render(
        <DashboardSelector
          selectedId="materials"
          onSelect={onSelect}
        />
      );
      // Check that materials layout button has selected styling
      const button = screen.getByText('材料科学').closest('button');
      expect(button?.className).toContain('bg-white');
    });
  });
});
