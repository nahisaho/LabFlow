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
