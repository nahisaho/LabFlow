'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

/**
 * Model domain type
 */
export type ModelDomain = 'drug-discovery' | 'materials-science' | 'climate' | 'genomics';

/**
 * Parameter spec
 */
export interface ParameterSpec {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required: boolean;
  description: string;
  descriptionJa: string;
  default?: unknown;
  options?: string[];
  min?: number;
  max?: number;
}

/**
 * Model metadata interface
 */
export interface ModelMetadata {
  id: string;
  name: string;
  description: string;
  descriptionJa: string;
  domain: ModelDomain;
  version: string;
  tags: string[];
  parameters: ParameterSpec[];
}

/**
 * Domain labels in Japanese
 */
const domainLabels: Record<ModelDomain, string> = {
  'drug-discovery': '創薬',
  'materials-science': '材料科学',
  'climate': '気候科学',
  'genomics': 'ゲノミクス',
};

/**
 * Domain badge variants
 */
const domainVariants: Record<ModelDomain, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  'drug-discovery': 'success',
  'materials-science': 'info',
  'climate': 'warning',
  'genomics': 'danger',
};

/**
 * ModelCard props
 */
export interface ModelCardProps {
  model: ModelMetadata;
  onSelect?: (model: ModelMetadata) => void;
  onExecute?: (model: ModelMetadata) => void;
}

/**
 * ModelCard component - displays a model with Japanese description
 */
export function ModelCard({ model, onSelect, onExecute }: ModelCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow" data-testid="model-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{model.name}</CardTitle>
            <span className="text-xs text-gray-500">v{model.version}</span>
          </div>
          <Badge variant={domainVariants[model.domain]}>
            {domainLabels[model.domain]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm mb-2">{model.descriptionJa}</p>
        <div className="flex flex-wrap gap-1">
          {model.tags.map((tag) => (
            <Badge key={tag} variant="default" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {onSelect && (
          <Button variant="outline" size="sm" onClick={() => onSelect(model)}>
            詳細
          </Button>
        )}
        {onExecute && (
          <Button variant="primary" size="sm" onClick={() => onExecute(model)}>
            実行
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * ModelCatalogView props
 */
export interface ModelCatalogViewProps {
  models: ModelMetadata[];
  onSelect?: (model: ModelMetadata) => void;
  onExecute?: (model: ModelMetadata) => void;
}

/**
 * ModelCatalogView component - model catalog with search and filter
 */
export function ModelCatalogView({ models, onSelect, onExecute }: ModelCatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<ModelDomain | null>(null);

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      // Domain filter
      if (domainFilter && model.domain !== domainFilter) {
        return false;
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          model.name.toLowerCase().includes(query) ||
          model.description.toLowerCase().includes(query) ||
          model.descriptionJa.includes(searchQuery) ||
          model.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [models, searchQuery, domainFilter]);

  const domains: (ModelDomain | null)[] = [null, 'drug-discovery', 'materials-science', 'climate', 'genomics'];

  return (
    <div className="space-y-4" data-testid="model-catalog">
      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="モデルを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="search-input"
          />
        </div>
        <div className="flex gap-2">
          {domains.map((domain) => (
            <Button
              key={domain || 'all'}
              variant={domainFilter === domain ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDomainFilter(domain)}
            >
              {domain ? domainLabels[domain] : 'すべて'}
            </Button>
          ))}
        </div>
      </div>

      {/* Model grid */}
      {filteredModels.length === 0 ? (
        <div className="text-center py-8 text-gray-500" data-testid="empty-state">
          モデルが見つかりません
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="model-grid">
          {filteredModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              onSelect={onSelect}
              onExecute={onExecute}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Extended model metadata for detail view
 */
export interface ExtendedModelMetadata extends ModelMetadata {
  estimatedTime?: string;
  license?: string;
  inputFormats?: string[];
  outputFormats?: string[];
  exampleCode?: string;
  exampleExplanationJa?: string;
  taskTypes?: string[];
}

/**
 * ModelDetailView props
 */
export interface ModelDetailViewProps {
  model: ExtendedModelMetadata;
  onExecute?: (model: ExtendedModelMetadata) => void;
  onBack?: () => void;
}

/**
 * ModelDetailView component - shows detailed model information with code examples
 */
export function ModelDetailView({ model, onExecute, onBack }: ModelDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'code' | 'specs'>('overview');

  return (
    <div className="space-y-6" data-testid="model-detail">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
              ← カタログに戻る
            </Button>
          )}
          <h1 className="text-2xl font-bold">{model.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={domainVariants[model.domain]}>
              {domainLabels[model.domain]}
            </Badge>
            <span className="text-sm text-gray-500">v{model.version}</span>
            {model.license && (
              <Badge variant="default" className="text-xs">
                {model.license}
              </Badge>
            )}
          </div>
        </div>
        {onExecute && (
          <Button variant="primary" onClick={() => onExecute(model)}>
            モデルを実行
          </Button>
        )}
      </div>

      {/* Description */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-gray-700">{model.descriptionJa}</p>
          <p className="text-gray-500 text-sm mt-2">{model.description}</p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {(['overview', 'code', 'specs'] as const).map((tab) => (
            <button
              key={tab}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'overview' && '概要'}
              {tab === 'code' && 'コード例'}
              {tab === 'specs' && '仕様'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Task types */}
          {model.taskTypes && model.taskTypes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">タスクタイプ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {model.taskTypes.map((type) => (
                    <Badge key={type} variant="info">
                      {type === 'generation' && '生成'}
                      {type === 'prediction' && '予測'}
                      {type === 'simulation' && 'シミュレーション'}
                      {type === 'optimization' && '最適化'}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estimated time */}
          {model.estimatedTime && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">推定実行時間</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{model.estimatedTime}</p>
              </CardContent>
            </Card>
          )}

          {/* Input formats */}
          {model.inputFormats && model.inputFormats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">入力フォーマット</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {model.inputFormats.map((format) => (
                    <Badge key={format} variant="default">
                      {format.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Output formats */}
          {model.outputFormats && model.outputFormats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">出力フォーマット</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {model.outputFormats.map((format) => (
                    <Badge key={format} variant="default">
                      {format.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parameters */}
          {model.parameters.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">パラメータ ({model.parameters.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">名前</th>
                        <th className="text-left py-2 font-medium">型</th>
                        <th className="text-left py-2 font-medium">必須</th>
                        <th className="text-left py-2 font-medium">説明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.parameters.map((param) => (
                        <tr key={param.name} className="border-b">
                          <td className="py-2 font-mono text-xs">{param.name}</td>
                          <td className="py-2">{param.type}</td>
                          <td className="py-2">{param.required ? '✓' : '-'}</td>
                          <td className="py-2 text-gray-600">{param.descriptionJa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'code' && (
        <div className="space-y-4">
          {model.exampleCode ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">使用例</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{model.exampleCode}</code>
                  </pre>
                </CardContent>
              </Card>
              {model.exampleExplanationJa && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">解説</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{model.exampleExplanationJa}</p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              コード例はまだ用意されていません
            </div>
          )}
        </div>
      )}

      {activeTab === 'specs' && (
        <Card>
          <CardContent className="pt-4">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">モデルID</dt>
                <dd className="font-mono">{model.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">バージョン</dt>
                <dd>{model.version}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">ドメイン</dt>
                <dd>{domainLabels[model.domain]}</dd>
              </div>
              {model.license && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">ライセンス</dt>
                  <dd>{model.license}</dd>
                </div>
              )}
              {model.tags.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">タグ</dt>
                  <dd className="flex flex-wrap gap-1 mt-1">
                    {model.tags.map((tag) => (
                      <Badge key={tag} variant="default">{tag}</Badge>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Execution result
 */
export interface ExecutionResult {
  id: string;
  modelId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  params: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: string;
}

/**
 * ExecutionResultView props
 */
export interface ExecutionResultViewProps {
  result: ExecutionResult;
  modelName?: string;
  onClose?: () => void;
  onRetry?: () => void;
}

/**
 * ExecutionResultView component - displays execution results
 */
export function ExecutionResultView({ result, modelName, onClose, onRetry }: ExecutionResultViewProps) {
  const duration = result.completedAt
    ? Math.round((result.completedAt.getTime() - result.startedAt.getTime()) / 1000)
    : null;

  const statusColors: Record<ExecutionResult['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<ExecutionResult['status'], string> = {
    pending: '待機中',
    running: '実行中',
    completed: '完了',
    failed: '失敗',
  };

  return (
    <div className="space-y-4" data-testid="execution-result">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{modelName || result.modelId}</h3>
          <p className="text-sm text-gray-500">実行ID: {result.id}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[result.status]}`}>
          {statusLabels[result.status]}
        </span>
      </div>

      {/* Timing */}
      <Card>
        <CardContent className="pt-4">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">開始時刻</dt>
              <dd>{result.startedAt.toLocaleString('ja-JP')}</dd>
            </div>
            {result.completedAt && (
              <div>
                <dt className="text-gray-500">完了時刻</dt>
                <dd>{result.completedAt.toLocaleString('ja-JP')}</dd>
              </div>
            )}
            {duration !== null && (
              <div>
                <dt className="text-gray-500">実行時間</dt>
                <dd>{duration}秒</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">入力パラメータ</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
            {JSON.stringify(result.params, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Results or Error */}
      {result.status === 'completed' && result.outputs && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">出力結果</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(result.outputs, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {result.status === 'failed' && result.error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-sm text-red-700">エラー</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{result.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Running indicator */}
      {result.status === 'running' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-blue-700">モデルを実行中です...</span>
            </div>
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
        {result.status === 'failed' && onRetry && (
          <Button variant="primary" onClick={onRetry}>
            再実行
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * ModelExecutionForm props
 */
export interface ModelExecutionFormProps {
  model: ModelMetadata;
  onSubmit: (params: Record<string, unknown>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

/**
 * ModelExecutionForm component - parameter form with validation
 */
export function ModelExecutionForm({ model, onSubmit, onCancel, isLoading = false }: ModelExecutionFormProps) {
  const [params, setParams] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    model.parameters.forEach((param) => {
      if (param.default !== undefined) {
        initial[param.name] = param.default;
      }
    });
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: unknown) => {
    setParams((prev) => ({ ...prev, [name]: value }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    model.parameters.forEach((param) => {
      const value = params[param.name];
      if (param.required && (value === undefined || value === '')) {
        newErrors[param.name] = '必須項目です';
      }
      if (param.type === 'number' && value !== undefined) {
        const num = Number(value);
        if (isNaN(num)) {
          newErrors[param.name] = '数値を入力してください';
        } else {
          if (param.min !== undefined && num < param.min) {
            newErrors[param.name] = `${param.min}以上の値を入力してください`;
          }
          if (param.max !== undefined && num > param.max) {
            newErrors[param.name] = `${param.max}以下の値を入力してください`;
          }
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(params);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="execution-form">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{model.name}</h3>
        <p className="text-sm text-gray-600">{model.descriptionJa}</p>
      </div>

      {model.parameters.map((param) => (
        <div key={param.name}>
          {param.type === 'select' && param.options ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {param.descriptionJa}
                {param.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={String(params[param.name] || '')}
                onChange={(e) => handleChange(param.name, e.target.value)}
              >
                <option value="">選択してください</option>
                {param.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {errors[param.name] && (
                <p className="mt-1 text-sm text-red-600">{errors[param.name]}</p>
              )}
            </div>
          ) : param.type === 'boolean' ? (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={param.name}
                checked={Boolean(params[param.name])}
                onChange={(e) => handleChange(param.name, e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor={param.name} className="text-sm text-gray-700">
                {param.descriptionJa}
              </label>
            </div>
          ) : (
            <Input
              label={`${param.descriptionJa}${param.required ? ' *' : ''}`}
              type={param.type === 'number' ? 'number' : 'text'}
              value={String(params[param.name] || '')}
              onChange={(e) =>
                handleChange(
                  param.name,
                  param.type === 'number' ? Number(e.target.value) : e.target.value
                )
              }
              error={errors[param.name]}
              min={param.min}
              max={param.max}
            />
          )}
        </div>
      ))}

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            キャンセル
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? '実行中...' : '実行'}
        </Button>
      </div>
    </form>
  );
}
