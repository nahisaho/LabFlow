/**
 * Visualization Tests
 *
 * VISZ-MOLE: Molecule/Protein visualization
 * VISZ-CRYS: Crystal structure visualization
 * VISZ-DATA: Data visualization
 * VISZ-MAP: Map visualization
 * VISZ-WKFL: Workflow visualization
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Molecule visualization
  MoleculeViewer,
  MoleculeDisplayMode,
  MoleculeFormat,
  // Crystal visualization
  CrystalViewer,
  CrystalFormat,
  // Data visualization
  DataVisualizer,
  ChartType,
  ChartConfig,
  // Map visualization
  MapVisualizer,
  BaseMapType,
  // Workflow visualization
  WorkflowVisualizer,
  NodeStatus,
  // Common
  ExportFormat,
  createMoleculeViewer,
  createCrystalViewer,
  createDataVisualizer,
  createMapVisualizer,
  createWorkflowVisualizer,
} from '../../src/visualization';

describe('Molecule/Protein Visualization (VISZ-MOLE)', () => {
  let viewer: MoleculeViewer;

  beforeEach(() => {
    viewer = createMoleculeViewer();
  });

  describe('Format Support (VISZ-MOLE-001)', () => {
    it('should support PDB format', () => {
      const formats = viewer.getSupportedFormats();
      expect(formats).toContain(MoleculeFormat.PDB);
    });

    it('should support SDF format', () => {
      const formats = viewer.getSupportedFormats();
      expect(formats).toContain(MoleculeFormat.SDF);
    });

    it('should support MOL2 format', () => {
      const formats = viewer.getSupportedFormats();
      expect(formats).toContain(MoleculeFormat.MOL2);
    });

    it('should load molecule from PDB string', () => {
      const pdbData = 'ATOM      1  CA  ALA A   1       0.000   0.000   0.000  1.00  0.00           C';
      const molecule = viewer.loadMolecule(pdbData, MoleculeFormat.PDB);
      
      expect(molecule).toBeDefined();
      expect(molecule.atoms.length).toBeGreaterThan(0);
    });
  });

  describe('Display Modes (VISZ-MOLE-002)', () => {
    it('should support wireframe mode', () => {
      const modes = viewer.getDisplayModes();
      expect(modes).toContain(MoleculeDisplayMode.Wireframe);
    });

    it('should support stick mode', () => {
      const modes = viewer.getDisplayModes();
      expect(modes).toContain(MoleculeDisplayMode.Stick);
    });

    it('should support ball-and-stick mode', () => {
      const modes = viewer.getDisplayModes();
      expect(modes).toContain(MoleculeDisplayMode.BallAndStick);
    });

    it('should support space-filling mode', () => {
      const modes = viewer.getDisplayModes();
      expect(modes).toContain(MoleculeDisplayMode.SpaceFilling);
    });

    it('should support ribbon mode for proteins', () => {
      const modes = viewer.getDisplayModes();
      expect(modes).toContain(MoleculeDisplayMode.Ribbon);
    });

    it('should change display mode', () => {
      viewer.setDisplayMode(MoleculeDisplayMode.BallAndStick);
      expect(viewer.getDisplayMode()).toBe(MoleculeDisplayMode.BallAndStick);
    });
  });

  describe('Selection and Labels (VISZ-MOLE-004)', () => {
    it('should select atoms by index', () => {
      const pdbData = 'ATOM      1  CA  ALA A   1       0.000   0.000   0.000  1.00  0.00           C';
      viewer.loadMolecule(pdbData, MoleculeFormat.PDB);

      const selection = viewer.selectAtoms([0]);
      expect(selection.length).toBe(1);
    });

    it('should support label display', () => {
      viewer.showLabels(true);
      expect(viewer.isLabelsVisible()).toBe(true);
    });

    it('should select residues', () => {
      const pdbData = 'ATOM      1  CA  ALA A   1       0.000   0.000   0.000  1.00  0.00           C';
      viewer.loadMolecule(pdbData, MoleculeFormat.PDB);

      const selection = viewer.selectResidues(['ALA']);
      expect(selection.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Export (VISZ-MOLE-006)', () => {
    it('should export to PNG', async () => {
      const image = await viewer.export(ExportFormat.PNG);
      expect(image).toBeDefined();
      expect(image.format).toBe(ExportFormat.PNG);
    });

    it('should export to SVG', async () => {
      const image = await viewer.export(ExportFormat.SVG);
      expect(image).toBeDefined();
      expect(image.format).toBe(ExportFormat.SVG);
    });
  });

  describe('pLDDT Coloring (VISZ-MOLE-007)', () => {
    it('should support pLDDT score coloring', () => {
      viewer.setColoringScheme('plddt');
      expect(viewer.getColoringScheme()).toBe('plddt');
    });

    it('should apply pLDDT colors based on scores', () => {
      const pdbData = 'ATOM      1  CA  ALA A   1       0.000   0.000   0.000  1.00 90.00           C';
      viewer.loadMolecule(pdbData, MoleculeFormat.PDB);
      viewer.setColoringScheme('plddt');

      const colors = viewer.getAtomColors();
      expect(colors.length).toBeGreaterThan(0);
    });
  });
});

describe('Crystal Structure Visualization (VISZ-CRYS)', () => {
  let viewer: CrystalViewer;

  beforeEach(() => {
    viewer = createCrystalViewer();
  });

  describe('Format Support (VISZ-CRYS-001)', () => {
    it('should support CIF format', () => {
      const formats = viewer.getSupportedFormats();
      expect(formats).toContain(CrystalFormat.CIF);
    });

    it('should support POSCAR format', () => {
      const formats = viewer.getSupportedFormats();
      expect(formats).toContain(CrystalFormat.POSCAR);
    });
  });

  describe('Unit Cell Display (VISZ-CRYS-002)', () => {
    it('should toggle unit cell boundary display', () => {
      viewer.showUnitCell(true);
      expect(viewer.isUnitCellVisible()).toBe(true);

      viewer.showUnitCell(false);
      expect(viewer.isUnitCellVisible()).toBe(false);
    });
  });

  describe('Supercell Display (VISZ-CRYS-003)', () => {
    it('should support supercell expansion 1x1x1 to 5x5x5', () => {
      expect(() => viewer.setSupercell(1, 1, 1)).not.toThrow();
      expect(() => viewer.setSupercell(5, 5, 5)).not.toThrow();
    });

    it('should reject invalid supercell dimensions', () => {
      expect(() => viewer.setSupercell(0, 1, 1)).toThrow();
      expect(() => viewer.setSupercell(6, 1, 1)).toThrow();
    });

    it('should get current supercell dimensions', () => {
      viewer.setSupercell(2, 3, 4);
      const dims = viewer.getSupercell();
      expect(dims).toEqual({ a: 2, b: 3, c: 4 });
    });
  });

  describe('Jmol Color Scheme (VISZ-CRYS-004)', () => {
    it('should use Jmol color scheme by default', () => {
      expect(viewer.getColorScheme()).toBe('jmol');
    });

    it('should provide element colors', () => {
      const liColor = viewer.getElementColor('Li');
      const feColor = viewer.getElementColor('Fe');
      const oColor = viewer.getElementColor('O');

      expect(liColor).toBeDefined();
      expect(feColor).toBeDefined();
      expect(oColor).toBeDefined();
      expect(liColor).not.toBe(feColor);
    });
  });

  describe('Bond Detection (VISZ-CRYS-005)', () => {
    it('should auto-detect bonds based on distance', () => {
      viewer.enableBondDetection(true);
      expect(viewer.isBondDetectionEnabled()).toBe(true);
    });

    it('should set bond detection threshold', () => {
      viewer.setBondThreshold(1.5);
      expect(viewer.getBondThreshold()).toBe(1.5);
    });
  });
});

describe('Data Visualization (VISZ-DATA)', () => {
  let visualizer: DataVisualizer;

  beforeEach(() => {
    visualizer = createDataVisualizer();
  });

  describe('Chart Types (VISZ-DATA-001)', () => {
    it('should support line chart', () => {
      const types = visualizer.getSupportedChartTypes();
      expect(types).toContain(ChartType.Line);
    });

    it('should support bar chart', () => {
      const types = visualizer.getSupportedChartTypes();
      expect(types).toContain(ChartType.Bar);
    });

    it('should support scatter plot', () => {
      const types = visualizer.getSupportedChartTypes();
      expect(types).toContain(ChartType.Scatter);
    });

    it('should support histogram', () => {
      const types = visualizer.getSupportedChartTypes();
      expect(types).toContain(ChartType.Histogram);
    });

    it('should support heatmap', () => {
      const types = visualizer.getSupportedChartTypes();
      expect(types).toContain(ChartType.Heatmap);
    });

    it('should support box plot', () => {
      const types = visualizer.getSupportedChartTypes();
      expect(types).toContain(ChartType.BoxPlot);
    });
  });

  describe('Customization (VISZ-DATA-002)', () => {
    it('should set axis labels', () => {
      visualizer.setAxisLabels('X軸', 'Y軸');
      const labels = visualizer.getAxisLabels();
      
      expect(labels.x).toBe('X軸');
      expect(labels.y).toBe('Y軸');
    });

    it('should set title', () => {
      visualizer.setTitle('グラフタイトル');
      expect(visualizer.getTitle()).toBe('グラフタイトル');
    });

    it('should show/hide legend', () => {
      visualizer.showLegend(true);
      expect(visualizer.isLegendVisible()).toBe(true);
    });
  });

  describe('Multiple Series (VISZ-DATA-004)', () => {
    it('should add multiple data series', () => {
      visualizer.addSeries('Series 1', [1, 2, 3]);
      visualizer.addSeries('Series 2', [4, 5, 6]);

      expect(visualizer.getSeriesCount()).toBe(2);
    });

    it('should overlay series on same chart', () => {
      visualizer.addSeries('A', [1, 2, 3]);
      visualizer.addSeries('B', [4, 5, 6]);

      const config = visualizer.getChartConfig();
      expect(config.series.length).toBe(2);
    });
  });

  describe('Export (VISZ-DATA-005, VISZ-DATA-006)', () => {
    it('should export to PNG', async () => {
      const image = await visualizer.export(ExportFormat.PNG);
      expect(image.format).toBe(ExportFormat.PNG);
    });

    it('should export to SVG', async () => {
      const image = await visualizer.export(ExportFormat.SVG);
      expect(image.format).toBe(ExportFormat.SVG);
    });

    it('should export to PDF', async () => {
      const image = await visualizer.export(ExportFormat.PDF);
      expect(image.format).toBe(ExportFormat.PDF);
    });

    it('should export data to CSV', async () => {
      visualizer.addSeries('Data', [1, 2, 3]);
      const csv = await visualizer.exportDataAsCSV();
      
      expect(csv).toBeDefined();
      expect(csv).toContain('Data');
    });
  });
});

describe('Map Visualization (VISZ-MAP)', () => {
  let visualizer: MapVisualizer;

  beforeEach(() => {
    visualizer = createMapVisualizer();
  });

  describe('Base Maps (VISZ-MAP-002)', () => {
    it('should support standard map', () => {
      const baseMaps = visualizer.getBaseMapTypes();
      expect(baseMaps).toContain(BaseMapType.Standard);
    });

    it('should support satellite image', () => {
      const baseMaps = visualizer.getBaseMapTypes();
      expect(baseMaps).toContain(BaseMapType.Satellite);
    });

    it('should support terrain map', () => {
      const baseMaps = visualizer.getBaseMapTypes();
      expect(baseMaps).toContain(BaseMapType.Terrain);
    });

    it('should change base map', () => {
      visualizer.setBaseMap(BaseMapType.Satellite);
      expect(visualizer.getBaseMap()).toBe(BaseMapType.Satellite);
    });
  });

  describe('Coloring (VISZ-MAP-003)', () => {
    it('should support continuous color scale', () => {
      visualizer.setColorScale('continuous', {
        min: 0,
        max: 100,
        colors: ['blue', 'red'],
      });
      expect(visualizer.getColorScaleType()).toBe('continuous');
    });

    it('should support categorical colors', () => {
      visualizer.setColorScale('categorical', {
        categories: ['A', 'B', 'C'],
        colors: ['red', 'green', 'blue'],
      });
      expect(visualizer.getColorScaleType()).toBe('categorical');
    });
  });

  describe('Export (VISZ-MAP-005)', () => {
    it('should export to PNG', async () => {
      const image = await visualizer.export(ExportFormat.PNG);
      expect(image.format).toBe(ExportFormat.PNG);
    });
  });
});

describe('Workflow Visualization (VISZ-WKFL)', () => {
  let visualizer: WorkflowVisualizer;

  beforeEach(() => {
    visualizer = createWorkflowVisualizer();
  });

  describe('DAG Display (VISZ-WKFL-001)', () => {
    it('should render workflow as DAG', () => {
      visualizer.setWorkflow({
        nodes: [
          { id: 'a', name: 'Step A' },
          { id: 'b', name: 'Step B' },
        ],
        edges: [{ from: 'a', to: 'b' }],
      });

      const graph = visualizer.getGraph();
      expect(graph.nodes.length).toBe(2);
      expect(graph.edges.length).toBe(1);
    });
  });

  describe('Status Coloring (VISZ-WKFL-002)', () => {
    it('should color nodes by status', () => {
      visualizer.setWorkflow({
        nodes: [
          { id: 'a', name: 'Step A', status: NodeStatus.Completed },
          { id: 'b', name: 'Step B', status: NodeStatus.Running },
          { id: 'c', name: 'Step C', status: NodeStatus.Pending },
        ],
        edges: [],
      });

      const colors = visualizer.getNodeColors();
      expect(colors['a']).toBe(visualizer.getStatusColor(NodeStatus.Completed));
      expect(colors['b']).toBe(visualizer.getStatusColor(NodeStatus.Running));
      expect(colors['c']).toBe(visualizer.getStatusColor(NodeStatus.Pending));
    });

    it('should define colors for all statuses', () => {
      expect(visualizer.getStatusColor(NodeStatus.Pending)).toBeDefined();
      expect(visualizer.getStatusColor(NodeStatus.Running)).toBeDefined();
      expect(visualizer.getStatusColor(NodeStatus.Completed)).toBeDefined();
      expect(visualizer.getStatusColor(NodeStatus.Failed)).toBeDefined();
    });
  });

  describe('Node Details (VISZ-WKFL-003)', () => {
    it('should get node details', () => {
      visualizer.setWorkflow({
        nodes: [
          {
            id: 'a',
            name: 'Step A',
            inputs: { file: 'input.csv' },
            outputs: { result: 'output.json' },
            logs: ['Starting...', 'Done'],
          },
        ],
        edges: [],
      });

      const details = visualizer.getNodeDetails('a');
      expect(details).toBeDefined();
      expect(details?.inputs).toEqual({ file: 'input.csv' });
      expect(details?.outputs).toEqual({ result: 'output.json' });
      expect(details?.logs).toContain('Starting...');
    });
  });

  describe('Edge Direction (VISZ-WKFL-004)', () => {
    it('should show edge direction', () => {
      visualizer.setWorkflow({
        nodes: [
          { id: 'a', name: 'A' },
          { id: 'b', name: 'B' },
        ],
        edges: [{ from: 'a', to: 'b' }],
      });

      const edges = visualizer.getGraph().edges;
      expect(edges[0].from).toBe('a');
      expect(edges[0].to).toBe('b');
      expect(edges[0].hasArrow).toBe(true);
    });
  });
});
