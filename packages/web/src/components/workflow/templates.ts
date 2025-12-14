/**
 * Workflow Templates
 * 
 * Pre-built workflow templates for common research tasks
 */

import type { ResearchDomain, WorkflowDefinition, WorkflowStep } from './index';

/**
 * Workflow template definition
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  descriptionJa: string;
  domain: ResearchDomain;
  stepCount: number;
  icon: string;
  steps: Omit<WorkflowStep, 'id' | 'status'>[];
}

/**
 * Standard workflow templates
 */
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // Materials Science Templates
  {
    id: 'materials-discovery',
    name: 'Materials Discovery',
    nameJa: '新材料探索',
    description: 'End-to-end materials discovery workflow using MatterGen and MatterSim',
    descriptionJa: 'MatterGenとMatterSimを使用したエンドツーエンド材料探索ワークフロー',
    domain: 'materials',
    stepCount: 5,
    icon: '🔬',
    steps: [
      {
        name: 'データ読み込み',
        type: 'data-load',
        domain: 'materials',
        config: { source: 'file', path: '' },
        position: { x: 50, y: 100 },
        dependencies: [],
      },
      {
        name: '結晶構造生成',
        type: 'model-mattergen',
        domain: 'materials',
        config: { chemical_system: '', num_samples: 100 },
        position: { x: 300, y: 100 },
        dependencies: [],
      },
      {
        name: '物性予測',
        type: 'model-mattersim',
        domain: 'materials',
        config: { predict_properties: 'all' },
        position: { x: 550, y: 100 },
        dependencies: [],
      },
      {
        name: 'DFT検証',
        type: 'analysis-dft',
        domain: 'materials',
        config: { functional: 'pbe', kpoints: '4 4 4' },
        position: { x: 800, y: 100 },
        dependencies: [],
      },
      {
        name: '結果エクスポート',
        type: 'output-export',
        domain: 'materials',
        config: { format: 'csv', destination: '' },
        position: { x: 1050, y: 100 },
        dependencies: [],
      },
    ],
  },
  {
    id: 'battery-materials',
    name: 'Battery Materials Screening',
    nameJa: '電池材料スクリーニング',
    description: 'Screen materials for battery applications',
    descriptionJa: '電池応用のための材料スクリーニングワークフロー',
    domain: 'materials',
    stepCount: 4,
    icon: '🔋',
    steps: [
      {
        name: 'Li系構造生成',
        type: 'model-mattergen',
        domain: 'materials',
        config: { chemical_system: 'Li-Fe-O', num_samples: 200 },
        position: { x: 50, y: 100 },
        dependencies: [],
      },
      {
        name: 'イオン伝導予測',
        type: 'model-mattersim',
        domain: 'materials',
        config: { predict_properties: 'all' },
        position: { x: 300, y: 100 },
        dependencies: [],
      },
      {
        name: '可視化',
        type: 'output-visualize',
        domain: 'materials',
        config: { chart_type: 'scatter' },
        position: { x: 550, y: 100 },
        dependencies: [],
      },
      {
        name: '結果エクスポート',
        type: 'output-export',
        domain: 'materials',
        config: { format: 'json', destination: '' },
        position: { x: 800, y: 100 },
        dependencies: [],
      },
    ],
  },

  // Drug Discovery Templates
  {
    id: 'drug-discovery',
    name: 'Drug Discovery Pipeline',
    nameJa: '創薬パイプライン',
    description: 'Target-based drug discovery using TamGen',
    descriptionJa: 'TamGenを使用したターゲットベース創薬パイプライン',
    domain: 'drug',
    stepCount: 5,
    icon: '💊',
    steps: [
      {
        name: 'ターゲット読み込み',
        type: 'data-load',
        domain: 'drug',
        config: { source: 'file', path: '' },
        position: { x: 50, y: 100 },
        dependencies: [],
      },
      {
        name: '分子生成',
        type: 'model-tamgen',
        domain: 'drug',
        config: { target_pdb: '', num_samples: 1000 },
        position: { x: 300, y: 100 },
        dependencies: [],
      },
      {
        name: 'バーチャルスクリーニング',
        type: 'analysis-screening',
        domain: 'drug',
        config: { threshold: 0.7, top_k: 100 },
        position: { x: 550, y: 100 },
        dependencies: [],
      },
      {
        name: '可視化',
        type: 'output-visualize',
        domain: 'drug',
        config: { chart_type: 'scatter' },
        position: { x: 800, y: 100 },
        dependencies: [],
      },
      {
        name: '結果エクスポート',
        type: 'output-export',
        domain: 'drug',
        config: { format: 'csv', destination: '' },
        position: { x: 1050, y: 100 },
        dependencies: [],
      },
    ],
  },
  {
    id: 'lead-optimization',
    name: 'Lead Optimization',
    nameJa: 'リード最適化',
    description: 'Optimize lead compounds for drug-likeness',
    descriptionJa: 'リード化合物のドラッグライクネス最適化',
    domain: 'drug',
    stepCount: 4,
    icon: '🧪',
    steps: [
      {
        name: 'リード化合物読み込み',
        type: 'data-load',
        domain: 'drug',
        config: { source: 'file', path: '' },
        position: { x: 50, y: 100 },
        dependencies: [],
      },
      {
        name: 'データ変換',
        type: 'data-transform',
        domain: 'drug',
        config: { operation: 'filter' },
        position: { x: 300, y: 100 },
        dependencies: [],
      },
      {
        name: 'スクリーニング',
        type: 'analysis-screening',
        domain: 'drug',
        config: { threshold: 0.8, top_k: 50 },
        position: { x: 550, y: 100 },
        dependencies: [],
      },
      {
        name: '結果エクスポート',
        type: 'output-export',
        domain: 'drug',
        config: { format: 'json', destination: '' },
        position: { x: 800, y: 100 },
        dependencies: [],
      },
    ],
  },

  // Climate Science Templates
  {
    id: 'weather-forecast',
    name: 'Weather Forecasting',
    nameJa: '気象予測',
    description: 'High-resolution weather prediction using Aurora',
    descriptionJa: 'Auroraを使用した高解像度気象予測',
    domain: 'climate',
    stepCount: 4,
    icon: '🌤️',
    steps: [
      {
        name: '観測データ読み込み',
        type: 'data-load',
        domain: 'climate',
        config: { source: 'api', path: '' },
        position: { x: 50, y: 100 },
        dependencies: [],
      },
      {
        name: '気象予測',
        type: 'model-aurora',
        domain: 'climate',
        config: { latitude: 35.6762, longitude: 139.6503, forecast_hours: 72 },
        position: { x: 300, y: 100 },
        dependencies: [],
      },
      {
        name: '可視化',
        type: 'output-visualize',
        domain: 'climate',
        config: { chart_type: 'heatmap' },
        position: { x: 550, y: 100 },
        dependencies: [],
      },
      {
        name: '結果エクスポート',
        type: 'output-export',
        domain: 'climate',
        config: { format: 'csv', destination: '' },
        position: { x: 800, y: 100 },
        dependencies: [],
      },
    ],
  },
  {
    id: 'climate-analysis',
    name: 'Climate Data Analysis',
    nameJa: '気候データ分析',
    description: 'Analyze historical climate data and predict trends',
    descriptionJa: '過去の気候データ分析とトレンド予測',
    domain: 'climate',
    stepCount: 4,
    icon: '📈',
    steps: [
      {
        name: 'データ読み込み',
        type: 'data-load',
        domain: 'climate',
        config: { source: 'database', path: '' },
        position: { x: 50, y: 100 },
        dependencies: [],
      },
      {
        name: 'データ変換',
        type: 'data-transform',
        domain: 'climate',
        config: { operation: 'normalize' },
        position: { x: 300, y: 100 },
        dependencies: [],
      },
      {
        name: '予測モデル',
        type: 'model-aurora',
        domain: 'climate',
        config: { latitude: 0, longitude: 0, forecast_hours: 240 },
        position: { x: 550, y: 100 },
        dependencies: [],
      },
      {
        name: '可視化',
        type: 'output-visualize',
        domain: 'climate',
        config: { chart_type: 'bar' },
        position: { x: 800, y: 100 },
        dependencies: [],
      },
    ],
  },

  // Genomics Templates
  {
    id: 'protein-structure',
    name: 'Protein Structure Prediction',
    nameJa: 'タンパク質構造予測',
    description: 'Predict protein structures using BioEmu',
    descriptionJa: 'BioEmuを使用したタンパク質構造予測',
    domain: 'genomics',
    stepCount: 4,
    icon: '🧬',
    steps: [
      {
        name: '配列読み込み',
        type: 'data-load',
        domain: 'genomics',
        config: { source: 'file', path: '' },
        position: { x: 50, y: 100 },
        dependencies: [],
      },
      {
        name: '構造予測',
        type: 'model-bioemu',
        domain: 'genomics',
        config: { sequence: '', num_ensemble: 10 },
        position: { x: 300, y: 100 },
        dependencies: [],
      },
      {
        name: '3D可視化',
        type: 'output-visualize',
        domain: 'genomics',
        config: { chart_type: '3d' },
        position: { x: 550, y: 100 },
        dependencies: [],
      },
      {
        name: '結果エクスポート',
        type: 'output-export',
        domain: 'genomics',
        config: { format: 'json', destination: '' },
        position: { x: 800, y: 100 },
        dependencies: [],
      },
    ],
  },
  {
    id: 'protein-dynamics',
    name: 'Protein Dynamics Analysis',
    nameJa: 'タンパク質ダイナミクス解析',
    description: 'Analyze protein conformational dynamics',
    descriptionJa: 'タンパク質のコンフォメーションダイナミクス解析',
    domain: 'genomics',
    stepCount: 5,
    icon: '🔄',
    steps: [
      {
        name: '配列読み込み',
        type: 'data-load',
        domain: 'genomics',
        config: { source: 'file', path: '' },
        position: { x: 50, y: 100 },
        dependencies: [],
      },
      {
        name: 'アンサンブル生成',
        type: 'model-bioemu',
        domain: 'genomics',
        config: { sequence: '', num_ensemble: 50 },
        position: { x: 300, y: 100 },
        dependencies: [],
      },
      {
        name: 'データ変換',
        type: 'data-transform',
        domain: 'genomics',
        config: { operation: 'normalize' },
        position: { x: 550, y: 100 },
        dependencies: [],
      },
      {
        name: '可視化',
        type: 'output-visualize',
        domain: 'genomics',
        config: { chart_type: 'scatter' },
        position: { x: 800, y: 100 },
        dependencies: [],
      },
      {
        name: '結果エクスポート',
        type: 'output-export',
        domain: 'genomics',
        config: { format: 'csv', destination: '' },
        position: { x: 1050, y: 100 },
        dependencies: [],
      },
    ],
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(templateId: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Get templates by domain
 */
export function getTemplatesByDomain(domain: ResearchDomain): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter((t) => t.domain === domain);
}

/**
 * Create workflow from template
 */
export function createWorkflowFromTemplate(
  template: WorkflowTemplate,
  userId: string,
  name?: string
): WorkflowDefinition {
  const now = new Date();
  const workflowId = `wf-${Date.now()}`;

  // Generate step IDs and set up dependencies
  const steps: WorkflowStep[] = template.steps.map((step, index) => {
    const stepId = `${workflowId}-step-${index}`;
    return {
      ...step,
      id: stepId,
      status: 'pending' as const,
      dependencies: index > 0 ? [`${workflowId}-step-${index - 1}`] : [],
    };
  });

  return {
    id: workflowId,
    name: name || template.nameJa,
    description: template.descriptionJa,
    domain: template.domain,
    status: 'draft',
    steps,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create empty workflow
 */
export function createEmptyWorkflow(
  domain: ResearchDomain,
  userId: string,
  name?: string
): WorkflowDefinition {
  const now = new Date();

  return {
    id: `wf-${Date.now()}`,
    name: name || '新規ワークフロー',
    description: '',
    domain,
    status: 'draft',
    steps: [],
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get templates for template selection UI
 */
export function getTemplatesForSelection() {
  return WORKFLOW_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    nameJa: t.nameJa,
    description: t.description,
    descriptionJa: t.descriptionJa,
    domain: t.domain,
    stepCount: t.stepCount,
    icon: t.icon,
  }));
}
