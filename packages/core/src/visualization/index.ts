/**
 * Visualization Module
 *
 * VISZ-MOLE: Molecule/Protein visualization
 * VISZ-CRYS: Crystal structure visualization
 * VISZ-DATA: Data visualization
 * VISZ-MAP: Map visualization
 * VISZ-WKFL: Workflow visualization
 */

// ============================================
// Common Types
// ============================================

/**
 * Export formats
 */
export enum ExportFormat {
  PNG = 'png',
  SVG = 'svg',
  PDF = 'pdf',
}

/**
 * Export result
 */
export interface ExportResult {
  format: ExportFormat;
  data: string;
  width?: number;
  height?: number;
}

// ============================================
// Molecule Visualization (VISZ-MOLE)
// ============================================

/**
 * Molecule file formats (VISZ-MOLE-001)
 */
export enum MoleculeFormat {
  PDB = 'pdb',
  SDF = 'sdf',
  MOL2 = 'mol2',
}

/**
 * Display modes (VISZ-MOLE-002)
 */
export enum MoleculeDisplayMode {
  Wireframe = 'wireframe',
  Stick = 'stick',
  BallAndStick = 'ball-and-stick',
  SpaceFilling = 'space-filling',
  Ribbon = 'ribbon',
}

/**
 * Atom representation
 */
export interface Atom {
  index: number;
  element: string;
  x: number;
  y: number;
  z: number;
  residue?: string;
  chain?: string;
  bFactor?: number;
}

/**
 * Molecule data
 */
export interface Molecule {
  atoms: Atom[];
  bonds: Array<{ from: number; to: number }>;
  format: MoleculeFormat;
}

/**
 * Molecule Viewer (VISZ-MOLE)
 */
export class MoleculeViewer {
  private molecule: Molecule | null = null;
  private displayMode: MoleculeDisplayMode = MoleculeDisplayMode.BallAndStick;
  private coloringScheme: string = 'element';
  private labelsVisible: boolean = false;

  getSupportedFormats(): MoleculeFormat[] {
    return [MoleculeFormat.PDB, MoleculeFormat.SDF, MoleculeFormat.MOL2];
  }

  getDisplayModes(): MoleculeDisplayMode[] {
    return [
      MoleculeDisplayMode.Wireframe,
      MoleculeDisplayMode.Stick,
      MoleculeDisplayMode.BallAndStick,
      MoleculeDisplayMode.SpaceFilling,
      MoleculeDisplayMode.Ribbon,
    ];
  }

  loadMolecule(data: string, format: MoleculeFormat): Molecule {
    const atoms: Atom[] = [];

    if (format === MoleculeFormat.PDB) {
      const lines = data.split('\n');
      for (const line of lines) {
        if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
          atoms.push({
            index: atoms.length,
            element: line.substring(76, 78).trim() || line.substring(12, 14).trim(),
            x: parseFloat(line.substring(30, 38)),
            y: parseFloat(line.substring(38, 46)),
            z: parseFloat(line.substring(46, 54)),
            residue: line.substring(17, 20).trim(),
            chain: line.substring(21, 22).trim(),
            bFactor: parseFloat(line.substring(60, 66)) || undefined,
          });
        }
      }
    }

    this.molecule = { atoms, bonds: [], format };
    return this.molecule;
  }

  setDisplayMode(mode: MoleculeDisplayMode): void {
    this.displayMode = mode;
  }

  getDisplayMode(): MoleculeDisplayMode {
    return this.displayMode;
  }

  selectAtoms(indices: number[]): Atom[] {
    if (!this.molecule) return [];
    return this.molecule.atoms.filter((a) => indices.includes(a.index));
  }

  selectResidues(residueNames: string[]): Atom[] {
    if (!this.molecule) return [];
    return this.molecule.atoms.filter((a) => a.residue && residueNames.includes(a.residue));
  }

  showLabels(visible: boolean): void {
    this.labelsVisible = visible;
  }

  isLabelsVisible(): boolean {
    return this.labelsVisible;
  }

  setColoringScheme(scheme: string): void {
    this.coloringScheme = scheme;
  }

  getColoringScheme(): string {
    return this.coloringScheme;
  }

  getAtomColors(): string[] {
    if (!this.molecule) return [];
    return this.molecule.atoms.map((atom) => {
      if (this.coloringScheme === 'plddt' && atom.bFactor !== undefined) {
        if (atom.bFactor > 90) return '#0053D6';
        if (atom.bFactor > 70) return '#65CBF3';
        if (atom.bFactor > 50) return '#FFDB13';
        return '#FF7D45';
      }
      return this.getElementColor(atom.element);
    });
  }

  getElementColor(element: string): string {
    const colors: Record<string, string> = {
      C: '#909090',
      N: '#3050F8',
      O: '#FF0D0D',
      S: '#FFFF30',
      H: '#FFFFFF',
      default: '#FF1493',
    };
    return colors[element] ?? colors.default;
  }

  async export(format: ExportFormat): Promise<ExportResult> {
    return {
      format,
      data: `mock-${format}-data`,
    };
  }
}

export function createMoleculeViewer(): MoleculeViewer {
  return new MoleculeViewer();
}

// ============================================
// Crystal Visualization (VISZ-CRYS)
// ============================================

/**
 * Crystal file formats (VISZ-CRYS-001)
 */
export enum CrystalFormat {
  CIF = 'cif',
  POSCAR = 'poscar',
}

/**
 * Jmol color scheme
 */
const JMOL_COLORS: Record<string, string> = {
  H: '#FFFFFF',
  He: '#D9FFFF',
  Li: '#CC80FF',
  Be: '#C2FF00',
  B: '#FFB5B5',
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  F: '#90E050',
  Ne: '#B3E3F5',
  Na: '#AB5CF2',
  Mg: '#8AFF00',
  Al: '#BFA6A6',
  Si: '#F0C8A0',
  P: '#FF8000',
  S: '#FFFF30',
  Cl: '#1FF01F',
  Ar: '#80D1E3',
  K: '#8F40D4',
  Ca: '#3DFF00',
  Fe: '#E06633',
  Co: '#F090A0',
  Ni: '#50D050',
  Cu: '#C88033',
  Zn: '#7D80B0',
};

/**
 * Crystal Viewer (VISZ-CRYS)
 */
export class CrystalViewer {
  private unitCellVisible: boolean = true;
  private supercell: { a: number; b: number; c: number } = { a: 1, b: 1, c: 1 };
  private colorScheme: string = 'jmol';
  private bondDetectionEnabled: boolean = true;
  private bondThreshold: number = 2.0;

  getSupportedFormats(): CrystalFormat[] {
    return [CrystalFormat.CIF, CrystalFormat.POSCAR];
  }

  showUnitCell(visible: boolean): void {
    this.unitCellVisible = visible;
  }

  isUnitCellVisible(): boolean {
    return this.unitCellVisible;
  }

  setSupercell(a: number, b: number, c: number): void {
    if (a < 1 || a > 5 || b < 1 || b > 5 || c < 1 || c > 5) {
      throw new Error('Supercell dimensions must be between 1 and 5');
    }
    this.supercell = { a, b, c };
  }

  getSupercell(): { a: number; b: number; c: number } {
    return { ...this.supercell };
  }

  getColorScheme(): string {
    return this.colorScheme;
  }

  setColorScheme(scheme: string): void {
    this.colorScheme = scheme;
  }

  getElementColor(element: string): string {
    return JMOL_COLORS[element] ?? '#FF1493';
  }

  enableBondDetection(enabled: boolean): void {
    this.bondDetectionEnabled = enabled;
  }

  isBondDetectionEnabled(): boolean {
    return this.bondDetectionEnabled;
  }

  setBondThreshold(threshold: number): void {
    this.bondThreshold = threshold;
  }

  getBondThreshold(): number {
    return this.bondThreshold;
  }
}

export function createCrystalViewer(): CrystalViewer {
  return new CrystalViewer();
}

// ============================================
// Data Visualization (VISZ-DATA)
// ============================================

/**
 * Chart types (VISZ-DATA-001)
 */
export enum ChartType {
  Line = 'line',
  Bar = 'bar',
  Scatter = 'scatter',
  Histogram = 'histogram',
  Heatmap = 'heatmap',
  BoxPlot = 'boxplot',
}

/**
 * Data series
 */
export interface DataSeries {
  name: string;
  data: number[];
}

/**
 * Chart configuration
 */
export interface ChartConfig {
  type: ChartType;
  title: string;
  axisLabels: { x: string; y: string };
  legendVisible: boolean;
  series: DataSeries[];
}

/**
 * Data Visualizer (VISZ-DATA)
 */
export class DataVisualizer {
  private chartType: ChartType = ChartType.Line;
  private title: string = '';
  private axisLabels: { x: string; y: string } = { x: '', y: '' };
  private legendVisible: boolean = true;
  private series: DataSeries[] = [];

  getSupportedChartTypes(): ChartType[] {
    return [
      ChartType.Line,
      ChartType.Bar,
      ChartType.Scatter,
      ChartType.Histogram,
      ChartType.Heatmap,
      ChartType.BoxPlot,
    ];
  }

  setChartType(type: ChartType): void {
    this.chartType = type;
  }

  setTitle(title: string): void {
    this.title = title;
  }

  getTitle(): string {
    return this.title;
  }

  setAxisLabels(x: string, y: string): void {
    this.axisLabels = { x, y };
  }

  getAxisLabels(): { x: string; y: string } {
    return { ...this.axisLabels };
  }

  showLegend(visible: boolean): void {
    this.legendVisible = visible;
  }

  isLegendVisible(): boolean {
    return this.legendVisible;
  }

  addSeries(name: string, data: number[]): void {
    this.series.push({ name, data });
  }

  getSeriesCount(): number {
    return this.series.length;
  }

  getChartConfig(): ChartConfig {
    return {
      type: this.chartType,
      title: this.title,
      axisLabels: { ...this.axisLabels },
      legendVisible: this.legendVisible,
      series: [...this.series],
    };
  }

  async export(format: ExportFormat): Promise<ExportResult> {
    return {
      format,
      data: `mock-chart-${format}-data`,
    };
  }

  async exportDataAsCSV(): Promise<string> {
    const headers = this.series.map((s) => s.name).join(',');
    const maxLength = Math.max(...this.series.map((s) => s.data.length));
    const rows: string[] = [];

    for (let i = 0; i < maxLength; i++) {
      const row = this.series.map((s) => s.data[i] ?? '').join(',');
      rows.push(row);
    }

    return `${headers}\n${rows.join('\n')}`;
  }
}

export function createDataVisualizer(): DataVisualizer {
  return new DataVisualizer();
}

// ============================================
// Map Visualization (VISZ-MAP)
// ============================================

/**
 * Base map types (VISZ-MAP-002)
 */
export enum BaseMapType {
  Standard = 'standard',
  Satellite = 'satellite',
  Terrain = 'terrain',
}

/**
 * Color scale config
 */
export interface ColorScaleConfig {
  min?: number;
  max?: number;
  colors?: string[];
  categories?: string[];
}

/**
 * Map Visualizer (VISZ-MAP)
 */
export class MapVisualizer {
  private baseMap: BaseMapType = BaseMapType.Standard;
  private colorScaleType: 'continuous' | 'categorical' = 'continuous';
  private colorScaleConfig: ColorScaleConfig = {};

  getBaseMapTypes(): BaseMapType[] {
    return [BaseMapType.Standard, BaseMapType.Satellite, BaseMapType.Terrain];
  }

  setBaseMap(type: BaseMapType): void {
    this.baseMap = type;
  }

  getBaseMap(): BaseMapType {
    return this.baseMap;
  }

  setColorScale(type: 'continuous' | 'categorical', config: ColorScaleConfig): void {
    this.colorScaleType = type;
    this.colorScaleConfig = config;
  }

  getColorScaleType(): 'continuous' | 'categorical' {
    return this.colorScaleType;
  }

  async export(format: ExportFormat): Promise<ExportResult> {
    return {
      format,
      data: `mock-map-${format}-data`,
    };
  }
}

export function createMapVisualizer(): MapVisualizer {
  return new MapVisualizer();
}

// ============================================
// Workflow Visualization (VISZ-WKFL)
// ============================================

/**
 * Node status (VISZ-WKFL-002)
 */
export enum NodeStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

/**
 * Workflow node
 */
export interface WorkflowNode {
  id: string;
  name: string;
  status?: NodeStatus;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  logs?: string[];
}

/**
 * Workflow edge
 */
export interface WorkflowEdge {
  from: string;
  to: string;
  hasArrow?: boolean;
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/**
 * Graph representation
 */
export interface GraphData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/**
 * Status colors
 */
const STATUS_COLORS: Record<NodeStatus, string> = {
  [NodeStatus.Pending]: '#9CA3AF',
  [NodeStatus.Running]: '#3B82F6',
  [NodeStatus.Completed]: '#10B981',
  [NodeStatus.Failed]: '#EF4444',
};

/**
 * Workflow Visualizer (VISZ-WKFL)
 */
export class WorkflowVisualizer {
  private workflow: WorkflowDefinition = { nodes: [], edges: [] };

  setWorkflow(workflow: WorkflowDefinition): void {
    this.workflow = {
      nodes: [...workflow.nodes],
      edges: workflow.edges.map((e) => ({ ...e, hasArrow: true })),
    };
  }

  getGraph(): GraphData {
    return {
      nodes: [...this.workflow.nodes],
      edges: [...this.workflow.edges],
    };
  }

  getNodeColors(): Record<string, string> {
    const colors: Record<string, string> = {};
    for (const node of this.workflow.nodes) {
      const status = node.status ?? NodeStatus.Pending;
      colors[node.id] = STATUS_COLORS[status];
    }
    return colors;
  }

  getStatusColor(status: NodeStatus): string {
    return STATUS_COLORS[status];
  }

  getNodeDetails(nodeId: string): WorkflowNode | undefined {
    return this.workflow.nodes.find((n) => n.id === nodeId);
  }
}

export function createWorkflowVisualizer(): WorkflowVisualizer {
  return new WorkflowVisualizer();
}
