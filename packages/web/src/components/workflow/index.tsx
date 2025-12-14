/**
 * Workflow Builder Components
 * 
 * P0 Feature: Workflow Builder UI
 * - Visual workflow editor
 * - Step configuration
 * - Execution monitoring
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

// ============================================================================
// Types
// ============================================================================

/**
 * Research domain
 */
export type ResearchDomain = 'drug' | 'materials' | 'climate' | 'genomics';

/**
 * Workflow status
 */
export type WorkflowStatus = 'draft' | 'active' | 'completed' | 'published' | 'archived';

/**
 * Step status
 */
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled';

/**
 * Step type definition
 */
export interface StepType {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  descriptionJa: string;
  domain: ResearchDomain | 'common';
  category: 'data' | 'model' | 'analysis' | 'output';
  icon: string;
  configSchema: StepConfigField[];
}

/**
 * Step configuration field
 */
export interface StepConfigField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'file';
  label: string;
  labelJa: string;
  required?: boolean;
  default?: unknown;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

/**
 * Workflow step
 */
export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  domain: ResearchDomain;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  dependencies: string[];
  status: StepStatus;
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  domain: ResearchDomain;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Execution result
 */
export interface WorkflowExecutionResult {
  id: string;
  workflowId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  startedAt: Date;
  completedAt?: Date;
  stepResults: Map<string, StepExecutionResult>;
  currentStepId?: string;
  error?: string;
}

/**
 * Step execution result
 */
export interface StepExecutionResult {
  stepId: string;
  status: StepStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  output?: Record<string, unknown>;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const domainLabels: Record<ResearchDomain, string> = {
  drug: '創薬',
  materials: '材料科学',
  climate: '気候科学',
  genomics: 'ゲノミクス',
};

const domainColors: Record<ResearchDomain, string> = {
  drug: 'bg-purple-100 text-purple-800',
  materials: 'bg-blue-100 text-blue-800',
  climate: 'bg-green-100 text-green-800',
  genomics: 'bg-orange-100 text-orange-800',
};

const statusLabels: Record<WorkflowStatus, string> = {
  draft: '下書き',
  active: '実行中',
  completed: '完了',
  published: '公開済み',
  archived: 'アーカイブ',
};

const statusColors: Record<WorkflowStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  published: 'bg-purple-100 text-purple-800',
  archived: 'bg-yellow-100 text-yellow-800',
};

const stepStatusColors: Record<StepStatus, string> = {
  pending: 'bg-gray-200',
  running: 'bg-blue-400 animate-pulse',
  completed: 'bg-green-400',
  failed: 'bg-red-400',
  skipped: 'bg-yellow-300',
  cancelled: 'bg-gray-400',
};

const stepStatusLabels: Record<StepStatus, string> = {
  pending: '待機中',
  running: '実行中',
  completed: '完了',
  failed: '失敗',
  skipped: 'スキップ',
  cancelled: 'キャンセル',
};

/**
 * Available step types
 */
export const STEP_TYPES: StepType[] = [
  // Data steps
  {
    id: 'data-load',
    name: 'Data Load',
    nameJa: 'データ読み込み',
    description: 'Load data from various sources',
    descriptionJa: '各種ソースからデータを読み込みます',
    domain: 'common',
    category: 'data',
    icon: '📥',
    configSchema: [
      { name: 'source', type: 'select', label: 'Source', labelJa: 'ソース', required: true, options: [
        { value: 'file', label: 'ファイル' },
        { value: 'database', label: 'データベース' },
        { value: 'api', label: 'API' },
      ]},
      { name: 'path', type: 'string', label: 'Path', labelJa: 'パス', required: true },
    ],
  },
  {
    id: 'data-transform',
    name: 'Data Transform',
    nameJa: 'データ変換',
    description: 'Transform and preprocess data',
    descriptionJa: 'データの変換・前処理を行います',
    domain: 'common',
    category: 'data',
    icon: '🔄',
    configSchema: [
      { name: 'operation', type: 'select', label: 'Operation', labelJa: '操作', required: true, options: [
        { value: 'normalize', label: '正規化' },
        { value: 'filter', label: 'フィルタリング' },
        { value: 'merge', label: '結合' },
      ]},
    ],
  },
  // Model steps
  {
    id: 'model-mattergen',
    name: 'MatterGen',
    nameJa: 'MatterGen生成',
    description: 'Generate crystal structures using MatterGen',
    descriptionJa: 'MatterGenで結晶構造を生成します',
    domain: 'materials',
    category: 'model',
    icon: '🔮',
    configSchema: [
      { name: 'chemical_system', type: 'string', label: 'Chemical System', labelJa: '化学系', required: true },
      { name: 'num_samples', type: 'number', label: 'Number of Samples', labelJa: 'サンプル数', required: true, default: 10, min: 1, max: 1000 },
    ],
  },
  {
    id: 'model-mattersim',
    name: 'MatterSim',
    nameJa: 'MatterSimシミュレーション',
    description: 'Run property predictions with MatterSim',
    descriptionJa: 'MatterSimで物性予測を行います',
    domain: 'materials',
    category: 'model',
    icon: '⚡',
    configSchema: [
      { name: 'predict_properties', type: 'select', label: 'Properties', labelJa: '予測プロパティ', required: true, options: [
        { value: 'formation_energy', label: '形成エネルギー' },
        { value: 'bulk_modulus', label: '体積弾性率' },
        { value: 'band_gap', label: 'バンドギャップ' },
        { value: 'all', label: 'すべて' },
      ]},
    ],
  },
  {
    id: 'model-aurora',
    name: 'Aurora',
    nameJa: 'Aurora気象予測',
    description: 'Weather prediction using Aurora',
    descriptionJa: 'Auroraで気象予測を行います',
    domain: 'climate',
    category: 'model',
    icon: '🌤️',
    configSchema: [
      { name: 'latitude', type: 'number', label: 'Latitude', labelJa: '緯度', required: true, min: -90, max: 90 },
      { name: 'longitude', type: 'number', label: 'Longitude', labelJa: '経度', required: true, min: -180, max: 180 },
      { name: 'forecast_hours', type: 'number', label: 'Forecast Hours', labelJa: '予測時間', required: true, default: 72, min: 1, max: 240 },
    ],
  },
  {
    id: 'model-bioemu',
    name: 'BioEmu',
    nameJa: 'BioEmu構造予測',
    description: 'Protein structure prediction with BioEmu',
    descriptionJa: 'BioEmuでタンパク質構造を予測します',
    domain: 'genomics',
    category: 'model',
    icon: '🧬',
    configSchema: [
      { name: 'sequence', type: 'string', label: 'Sequence', labelJa: 'アミノ酸配列', required: true },
      { name: 'num_ensemble', type: 'number', label: 'Ensemble Count', labelJa: 'アンサンブル数', default: 5, min: 1, max: 100 },
    ],
  },
  {
    id: 'model-tamgen',
    name: 'TamGen',
    nameJa: 'TamGen分子生成',
    description: 'Target-aware molecule generation with TamGen',
    descriptionJa: 'TamGenでターゲット認識分子を生成します',
    domain: 'drug',
    category: 'model',
    icon: '💊',
    configSchema: [
      { name: 'target_pdb', type: 'file', label: 'Target PDB', labelJa: 'ターゲットPDB', required: true },
      { name: 'num_samples', type: 'number', label: 'Number of Samples', labelJa: '生成数', required: true, default: 100, min: 1, max: 1000 },
    ],
  },
  // Analysis steps
  {
    id: 'analysis-screening',
    name: 'Virtual Screening',
    nameJa: 'バーチャルスクリーニング',
    description: 'Run virtual screening on generated compounds',
    descriptionJa: '生成化合物のバーチャルスクリーニングを実行',
    domain: 'drug',
    category: 'analysis',
    icon: '🔬',
    configSchema: [
      { name: 'threshold', type: 'number', label: 'Score Threshold', labelJa: 'スコア閾値', default: 0.7, min: 0, max: 1 },
      { name: 'top_k', type: 'number', label: 'Top K Results', labelJa: '上位K件', default: 100, min: 1, max: 10000 },
    ],
  },
  {
    id: 'analysis-dft',
    name: 'DFT Calculation',
    nameJa: 'DFT計算',
    description: 'Run DFT calculations for validation',
    descriptionJa: '検証用DFT計算を実行',
    domain: 'materials',
    category: 'analysis',
    icon: '🧮',
    configSchema: [
      { name: 'functional', type: 'select', label: 'Functional', labelJa: '汎関数', required: true, options: [
        { value: 'pbe', label: 'PBE' },
        { value: 'pbe0', label: 'PBE0' },
        { value: 'hse06', label: 'HSE06' },
      ]},
      { name: 'kpoints', type: 'string', label: 'K-points', labelJa: 'K点メッシュ', default: '4 4 4' },
    ],
  },
  // Output steps
  {
    id: 'output-export',
    name: 'Export Results',
    nameJa: '結果エクスポート',
    description: 'Export results to various formats',
    descriptionJa: '結果を各種フォーマットでエクスポート',
    domain: 'common',
    category: 'output',
    icon: '📤',
    configSchema: [
      { name: 'format', type: 'select', label: 'Format', labelJa: '形式', required: true, options: [
        { value: 'csv', label: 'CSV' },
        { value: 'json', label: 'JSON' },
        { value: 'excel', label: 'Excel' },
      ]},
      { name: 'destination', type: 'string', label: 'Destination', labelJa: '出力先', required: true },
    ],
  },
  {
    id: 'output-visualize',
    name: 'Visualize',
    nameJa: '可視化',
    description: 'Create visualizations from results',
    descriptionJa: '結果の可視化を作成',
    domain: 'common',
    category: 'output',
    icon: '📊',
    configSchema: [
      { name: 'chart_type', type: 'select', label: 'Chart Type', labelJa: 'グラフ種類', required: true, options: [
        { value: 'scatter', label: '散布図' },
        { value: 'bar', label: '棒グラフ' },
        { value: 'heatmap', label: 'ヒートマップ' },
        { value: '3d', label: '3D構造' },
      ]},
    ],
  },
];

// ============================================================================
// Components
// ============================================================================

/**
 * Workflow List Item
 */
export interface WorkflowListItemProps {
  workflow: WorkflowDefinition;
  onSelect?: (workflow: WorkflowDefinition) => void;
  onEdit?: (workflow: WorkflowDefinition) => void;
  onDelete?: (workflow: WorkflowDefinition) => void;
  onRun?: (workflow: WorkflowDefinition) => void;
}

export function WorkflowListItem({ workflow, onSelect, onEdit, onDelete, onRun }: WorkflowListItemProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect?.(workflow)}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{workflow.name}</h3>
              <Badge variant="secondary" className={domainColors[workflow.domain]}>
                {domainLabels[workflow.domain]}
              </Badge>
              <Badge variant="secondary" className={statusColors[workflow.status]}>
                {statusLabels[workflow.status]}
              </Badge>
            </div>
            {workflow.description && (
              <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span>{workflow.steps.length} ステップ</span>
              <span>v{workflow.version}</span>
              <span>更新: {workflow.updatedAt.toLocaleDateString('ja-JP')}</span>
            </div>
          </div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(workflow)}>
                編集
              </Button>
            )}
            {onRun && workflow.status !== 'archived' && (
              <Button variant="primary" size="sm" onClick={() => onRun(workflow)}>
                実行
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" size="sm" onClick={() => onDelete(workflow)}>
                削除
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Workflow List View
 */
export interface WorkflowListViewProps {
  workflows: WorkflowDefinition[];
  onSelect?: (workflow: WorkflowDefinition) => void;
  onEdit?: (workflow: WorkflowDefinition) => void;
  onDelete?: (workflow: WorkflowDefinition) => void;
  onRun?: (workflow: WorkflowDefinition) => void;
  onCreate?: () => void;
}

export function WorkflowListView({ workflows, onSelect, onEdit, onDelete, onRun, onCreate }: WorkflowListViewProps) {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<ResearchDomain | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | 'all'>('all');

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((wf) => {
      const matchesSearch = search === '' || 
        wf.name.toLowerCase().includes(search.toLowerCase()) ||
        wf.description?.toLowerCase().includes(search.toLowerCase());
      const matchesDomain = domainFilter === 'all' || wf.domain === domainFilter;
      const matchesStatus = statusFilter === 'all' || wf.status === statusFilter;
      return matchesSearch && matchesDomain && matchesStatus;
    });
  }, [workflows, search, domainFilter, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">ワークフロー</h2>
        {onCreate && (
          <Button variant="primary" onClick={onCreate}>
            + 新規作成
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Input
          type="text"
          placeholder="ワークフローを検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value as ResearchDomain | 'all')}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="all">すべてのドメイン</option>
          {Object.entries(domainLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as WorkflowStatus | 'all')}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="all">すべてのステータス</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {filteredWorkflows.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">ワークフローが見つかりません</p>
          {onCreate && (
            <Button variant="outline" className="mt-4" onClick={onCreate}>
              最初のワークフローを作成
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWorkflows.map((workflow) => (
            <WorkflowListItem
              key={workflow.id}
              workflow={workflow}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onRun={onRun}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Step Palette - available steps to add
 */
export interface StepPaletteProps {
  domain?: ResearchDomain;
  onAddStep: (stepType: StepType) => void;
}

export function StepPalette({ domain, onAddStep }: StepPaletteProps) {
  const [category, setCategory] = useState<'all' | 'data' | 'model' | 'analysis' | 'output'>('all');

  const filteredSteps = useMemo(() => {
    return STEP_TYPES.filter((step) => {
      const matchesDomain = !domain || step.domain === 'common' || step.domain === domain;
      const matchesCategory = category === 'all' || step.category === category;
      return matchesDomain && matchesCategory;
    });
  }, [domain, category]);

  const categoryLabels = {
    all: 'すべて',
    data: 'データ',
    model: 'モデル',
    analysis: '分析',
    output: '出力',
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700">ステップを追加</h3>
      
      {/* Category filter */}
      <div className="flex gap-1 flex-wrap">
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCategory(key as typeof category)}
            className={`px-2 py-1 text-xs rounded ${
              category === key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Step list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filteredSteps.map((step) => (
          <button
            key={step.id}
            onClick={() => onAddStep(step)}
            className="w-full text-left p-2 rounded border hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{step.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{step.nameJa}</div>
                <div className="text-xs text-gray-500">{step.descriptionJa}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Step Node - visual representation of a step
 */
export interface StepNodeProps {
  step: WorkflowStep;
  stepType?: StepType;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  onConfigure?: () => void;
}

export function StepNode({ step, stepType, selected, onSelect, onDelete, onConfigure }: StepNodeProps) {
  return (
    <div
      className={`
        relative p-3 rounded-lg border-2 bg-white shadow-sm cursor-pointer
        transition-all min-w-[180px]
        ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
      `}
      onClick={onSelect}
    >
      {/* Status indicator */}
      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${stepStatusColors[step.status]}`} />

      {/* Content */}
      <div className="flex items-start gap-2">
        <span className="text-xl">{stepType?.icon || '📦'}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{step.name}</div>
          <div className="text-xs text-gray-500">{stepType?.nameJa || step.type}</div>
        </div>
      </div>

      {/* Actions */}
      {selected && (
        <div className="flex gap-1 mt-2 pt-2 border-t">
          {onConfigure && (
            <button
              onClick={(e) => { e.stopPropagation(); onConfigure(); }}
              className="flex-1 text-xs py-1 px-2 rounded bg-gray-100 hover:bg-gray-200"
            >
              設定
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex-1 text-xs py-1 px-2 rounded bg-red-100 hover:bg-red-200 text-red-600"
            >
              削除
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Step Editor - configure step parameters
 */
export interface StepEditorProps {
  step: WorkflowStep;
  stepType?: StepType;
  onUpdate: (config: Record<string, unknown>) => void;
  onClose: () => void;
}

export function StepEditor({ step, stepType, onUpdate, onClose }: StepEditorProps) {
  const [config, setConfig] = useState<Record<string, unknown>>(step.config);
  const [name, setName] = useState(step.name);

  const handleSubmit = () => {
    onUpdate({ ...config, _name: name });
    onClose();
  };

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [fieldName]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="text-xl">{stepType?.icon}</span>
          {stepType?.nameJa || step.type}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      {/* Step name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ステップ名
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ステップ名を入力"
        />
      </div>

      {/* Configuration fields */}
      {stepType?.configSchema.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.labelJa}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.type === 'string' && (
            <Input
              value={(config[field.name] as string) || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.labelJa}
            />
          )}
          {field.type === 'number' && (
            <Input
              type="number"
              value={(config[field.name] as number) ?? field.default ?? ''}
              onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value))}
              min={field.min}
              max={field.max}
            />
          )}
          {field.type === 'boolean' && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(config[field.name] as boolean) ?? false}
                onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">有効</span>
            </label>
          )}
          {field.type === 'select' && field.options && (
            <select
              value={(config[field.name] as string) || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">選択してください</option>
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          {field.type === 'file' && (
            <input
              type="file"
              onChange={(e) => handleFieldChange(field.name, e.target.files?.[0]?.name || '')}
              className="w-full text-sm"
            />
          )}
        </div>
      ))}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          キャンセル
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          保存
        </Button>
      </div>
    </div>
  );
}

/**
 * Workflow Canvas - visual workflow editor
 */
export interface WorkflowCanvasProps {
  workflow: WorkflowDefinition;
  selectedStepId?: string;
  onSelectStep?: (stepId: string | undefined) => void;
  onUpdateStep?: (stepId: string, updates: Partial<WorkflowStep>) => void;
  onDeleteStep?: (stepId: string) => void;
  onAddStep?: (stepType: StepType, position: { x: number; y: number }) => void;
}

export function WorkflowCanvas({
  workflow,
  selectedStepId,
  onSelectStep,
  onUpdateStep,
  onDeleteStep,
}: WorkflowCanvasProps) {
  const stepTypeMap = useMemo(() => {
    const map = new Map<string, StepType>();
    STEP_TYPES.forEach((st) => map.set(st.id, st));
    return map;
  }, []);

  // Calculate positions for steps in a flow layout
  const stepsWithPositions = useMemo(() => {
    const positioned: Array<WorkflowStep & { calculatedX: number; calculatedY: number }> = [];
    const stepMap = new Map(workflow.steps.map((s) => [s.id, s]));
    
    // Simple left-to-right layout
    let x = 50;
    const y = 100;
    const spacing = 250;

    workflow.steps.forEach((step, index) => {
      positioned.push({
        ...step,
        calculatedX: x + index * spacing,
        calculatedY: y,
      });
    });

    return positioned;
  }, [workflow.steps]);

  // Draw connections between steps
  const connections = useMemo(() => {
    const lines: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }> = [];
    const stepPositions = new Map(stepsWithPositions.map((s) => [s.id, { x: s.calculatedX, y: s.calculatedY }]));

    stepsWithPositions.forEach((step) => {
      step.dependencies.forEach((depId) => {
        const from = stepPositions.get(depId);
        const to = stepPositions.get(step.id);
        if (from && to) {
          lines.push({
            from: { x: from.x + 90, y: from.y + 40 },
            to: { x: to.x, y: to.y + 40 },
          });
        }
      });
    });

    return lines;
  }, [stepsWithPositions]);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-50 rounded-lg border overflow-auto">
      {/* SVG for connections */}
      <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
        {connections.map((conn, i) => (
          <g key={i}>
            <line
              x1={conn.from.x}
              y1={conn.from.y}
              x2={conn.to.x}
              y2={conn.to.y}
              stroke="#9CA3AF"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          </g>
        ))}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
          </marker>
        </defs>
      </svg>

      {/* Step nodes */}
      {stepsWithPositions.map((step) => (
        <div
          key={step.id}
          className="absolute"
          style={{ left: step.calculatedX, top: step.calculatedY }}
        >
          <StepNode
            step={step}
            stepType={stepTypeMap.get(step.type)}
            selected={selectedStepId === step.id}
            onSelect={() => onSelectStep?.(step.id)}
            onDelete={() => onDeleteStep?.(step.id)}
            onConfigure={() => onSelectStep?.(step.id)}
          />
        </div>
      ))}

      {/* Empty state */}
      {workflow.steps.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-lg">ステップがありません</p>
            <p className="text-sm">左のパレットからステップを追加してください</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Workflow Builder - main editor component
 */
export interface WorkflowBuilderProps {
  workflow: WorkflowDefinition;
  onSave?: (workflow: WorkflowDefinition) => void;
  onRun?: (workflow: WorkflowDefinition) => void;
  onBack?: () => void;
}

export function WorkflowBuilder({ workflow: initialWorkflow, onSave, onRun, onBack }: WorkflowBuilderProps) {
  const [workflow, setWorkflow] = useState<WorkflowDefinition>(initialWorkflow);
  const [selectedStepId, setSelectedStepId] = useState<string | undefined>();
  const [editingStep, setEditingStep] = useState<WorkflowStep | undefined>();

  const selectedStep = useMemo(
    () => workflow.steps.find((s) => s.id === selectedStepId),
    [workflow.steps, selectedStepId]
  );

  const stepTypeMap = useMemo(() => {
    const map = new Map<string, StepType>();
    STEP_TYPES.forEach((st) => map.set(st.id, st));
    return map;
  }, []);

  const handleAddStep = useCallback((stepType: StepType) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      name: stepType.nameJa,
      type: stepType.id,
      domain: stepType.domain === 'common' ? workflow.domain : stepType.domain as ResearchDomain,
      config: {},
      position: { x: 50 + workflow.steps.length * 250, y: 100 },
      dependencies: workflow.steps.length > 0 ? [workflow.steps[workflow.steps.length - 1].id] : [],
      status: 'pending',
    };

    setWorkflow((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
      updatedAt: new Date(),
    }));

    setSelectedStepId(newStep.id);
    setEditingStep(newStep);
  }, [workflow]);

  const handleUpdateStep = useCallback((stepId: string, updates: Partial<WorkflowStep>) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
      updatedAt: new Date(),
    }));
  }, []);

  const handleDeleteStep = useCallback((stepId: string) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== stepId).map((s) => ({
        ...s,
        dependencies: s.dependencies.filter((d) => d !== stepId),
      })),
      updatedAt: new Date(),
    }));
    if (selectedStepId === stepId) {
      setSelectedStepId(undefined);
      setEditingStep(undefined);
    }
  }, [selectedStepId]);

  const handleStepConfigUpdate = useCallback((config: Record<string, unknown>) => {
    if (editingStep) {
      const name = (config._name as string) || editingStep.name;
      const { _name, ...restConfig } = config;
      handleUpdateStep(editingStep.id, { name, config: restConfig });
    }
  }, [editingStep, handleUpdateStep]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              ← 戻る
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold">{workflow.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className={domainColors[workflow.domain]}>
                {domainLabels[workflow.domain]}
              </Badge>
              <Badge variant="secondary" className={statusColors[workflow.status]}>
                {statusLabels[workflow.status]}
              </Badge>
              <span className="text-sm text-gray-500">v{workflow.version}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {onSave && (
            <Button variant="outline" onClick={() => onSave(workflow)}>
              保存
            </Button>
          )}
          {onRun && (
            <Button variant="primary" onClick={() => onRun(workflow)}>
              実行
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Step palette */}
        <div className="w-64 border-r bg-white p-4 overflow-y-auto">
          <StepPalette domain={workflow.domain} onAddStep={handleAddStep} />
        </div>

        {/* Canvas */}
        <div className="flex-1 p-4">
          <WorkflowCanvas
            workflow={workflow}
            selectedStepId={selectedStepId}
            onSelectStep={(id) => {
              setSelectedStepId(id);
              setEditingStep(workflow.steps.find((s) => s.id === id));
            }}
            onUpdateStep={handleUpdateStep}
            onDeleteStep={handleDeleteStep}
          />
        </div>

        {/* Step editor panel */}
        {editingStep && (
          <div className="w-80 border-l bg-white p-4 overflow-y-auto">
            <StepEditor
              step={editingStep}
              stepType={stepTypeMap.get(editingStep.type)}
              onUpdate={handleStepConfigUpdate}
              onClose={() => {
                setEditingStep(undefined);
                setSelectedStepId(undefined);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Execution Progress View
 */
export interface ExecutionProgressViewProps {
  execution: WorkflowExecutionResult;
  workflow: WorkflowDefinition;
  onCancel?: () => void;
  onClose?: () => void;
}

export function ExecutionProgressView({ execution, workflow, onCancel, onClose }: ExecutionProgressViewProps) {
  const stepTypeMap = useMemo(() => {
    const map = new Map<string, StepType>();
    STEP_TYPES.forEach((st) => map.set(st.id, st));
    return map;
  }, []);

  const executionStatusLabels: Record<WorkflowExecutionResult['status'], string> = {
    queued: 'キュー待ち',
    running: '実行中',
    completed: '完了',
    failed: '失敗',
    cancelled: 'キャンセル',
    paused: '一時停止',
  };

  const executionStatusColors: Record<WorkflowExecutionResult['status'], string> = {
    queued: 'bg-gray-100 text-gray-800',
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-yellow-100 text-yellow-800',
    paused: 'bg-orange-100 text-orange-800',
  };

  const completedSteps = workflow.steps.filter(
    (s) => execution.stepResults.get(s.id)?.status === 'completed'
  ).length;

  const progress = workflow.steps.length > 0 
    ? Math.round((completedSteps / workflow.steps.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{workflow.name}</h2>
          <p className="text-sm text-gray-500">実行ID: {execution.id}</p>
        </div>
        <Badge className={executionStatusColors[execution.status]}>
          {executionStatusLabels[execution.status]}
        </Badge>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">進捗</span>
            <span className="text-sm text-gray-500">{completedSteps} / {workflow.steps.length} ステップ</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                execution.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step status list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ステップ状況</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workflow.steps.map((step) => {
              const result = execution.stepResults.get(step.id);
              const stepType = stepTypeMap.get(step.type);
              const isCurrent = execution.currentStepId === step.id;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    isCurrent ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${stepStatusColors[result?.status || 'pending']}`} />
                  <span className="text-lg">{stepType?.icon || '📦'}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{step.name}</div>
                    <div className="text-xs text-gray-500">
                      {result?.status ? stepStatusLabels[result.status] : '待機中'}
                      {result?.duration && ` - ${result.duration}秒`}
                    </div>
                  </div>
                  {result?.error && (
                    <span className="text-xs text-red-500" title={result.error}>
                      エラー
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Error display */}
      {execution.error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-sm text-red-700">エラー</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{execution.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        )}
        {onCancel && execution.status === 'running' && (
          <Button variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Workflow Template Card
 */
export interface WorkflowTemplateCardProps {
  template: {
    id: string;
    name: string;
    nameJa: string;
    description: string;
    descriptionJa: string;
    domain: ResearchDomain;
    stepCount: number;
    icon: string;
  };
  onSelect: () => void;
}

export function WorkflowTemplateCard({ template, onSelect }: WorkflowTemplateCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{template.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{template.nameJa}</h3>
              <Badge variant="secondary" className={domainColors[template.domain]}>
                {domainLabels[template.domain]}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">{template.descriptionJa}</p>
            <p className="text-xs text-gray-400 mt-2">{template.stepCount} ステップ</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Workflow Template Selection
 */
export interface WorkflowTemplateSelectionProps {
  templates: WorkflowTemplateCardProps['template'][];
  onSelect: (templateId: string) => void;
  onSkip: () => void;
}

export function WorkflowTemplateSelection({ templates, onSelect, onSkip }: WorkflowTemplateSelectionProps) {
  const [domainFilter, setDomainFilter] = useState<ResearchDomain | 'all'>('all');

  const filteredTemplates = useMemo(() => {
    if (domainFilter === 'all') return templates;
    return templates.filter((t) => t.domain === domainFilter);
  }, [templates, domainFilter]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">ワークフローテンプレート</h2>
        <p className="text-gray-500 mt-2">テンプレートから始めるか、空白から作成できます</p>
      </div>

      {/* Domain filter */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setDomainFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm ${
            domainFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          すべて
        </button>
        {Object.entries(domainLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setDomainFilter(key as ResearchDomain)}
            className={`px-4 py-2 rounded-lg text-sm ${
              domainFilter === key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <WorkflowTemplateCard
            key={template.id}
            template={template}
            onSelect={() => onSelect(template.id)}
          />
        ))}
      </div>

      {/* Skip option */}
      <div className="text-center">
        <Button variant="outline" onClick={onSkip}>
          空白から作成
        </Button>
      </div>
    </div>
  );
}
