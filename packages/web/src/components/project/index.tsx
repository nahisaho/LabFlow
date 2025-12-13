'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

/**
 * Project domain types
 */
export type ProjectDomain = 'drug-discovery' | 'materials-science' | 'climate' | 'genomics';

/**
 * Project status types
 */
export type ProjectStatus = 'active' | 'completed' | 'archived';

/**
 * Project data interface
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  domain: ProjectDomain;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Domain display names in Japanese
 */
export const domainLabels: Record<ProjectDomain, string> = {
  'drug-discovery': '創薬',
  'materials-science': '材料科学',
  'climate': '気候科学',
  'genomics': 'ゲノミクス',
};

/**
 * Domain badge variants
 */
const domainVariants: Record<ProjectDomain, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  'drug-discovery': 'success',
  'materials-science': 'info',
  'climate': 'warning',
  'genomics': 'danger',
};

/**
 * Status display names
 */
const statusLabels: Record<ProjectStatus, string> = {
  active: 'アクティブ',
  completed: '完了',
  archived: 'アーカイブ',
};

/**
 * ProjectCard props
 */
export interface ProjectCardProps {
  project: Project;
  onSelect?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

/**
 * ProjectCard component - displays a single project
 */
export function ProjectCard({ project, onSelect, onEdit, onDelete }: ProjectCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow" data-testid="project-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <Badge variant={domainVariants[project.domain]}>
            {domainLabels[project.domain]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm mb-2">{project.description}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>状態: {statusLabels[project.status]}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {onSelect && (
          <Button variant="primary" size="sm" onClick={() => onSelect(project)}>
            開く
          </Button>
        )}
        {onEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(project)}>
            編集
          </Button>
        )}
        {onDelete && (
          <Button variant="danger" size="sm" onClick={() => onDelete(project)}>
            削除
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * ProjectList props
 */
export interface ProjectListProps {
  projects: Project[];
  filter?: ProjectDomain | null;
  onSelect?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

/**
 * ProjectList component - displays a list of projects with optional filtering
 */
export function ProjectList({ projects, filter, onSelect, onEdit, onDelete }: ProjectListProps) {
  const filteredProjects = filter
    ? projects.filter((p) => p.domain === filter)
    : projects;

  if (filteredProjects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500" data-testid="empty-state">
        プロジェクトがありません
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="project-list">
      {filteredProjects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

/**
 * DomainSelector props
 */
export interface DomainSelectorProps {
  value: ProjectDomain | null;
  onChange: (domain: ProjectDomain | null) => void;
  showAll?: boolean;
}

/**
 * DomainSelector component - domain selection with Japanese labels
 */
export function DomainSelector({ value, onChange, showAll = true }: DomainSelectorProps) {
  const domains: (ProjectDomain | null)[] = showAll
    ? [null, 'drug-discovery', 'materials-science', 'climate', 'genomics']
    : ['drug-discovery', 'materials-science', 'climate', 'genomics'];

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="ドメイン選択">
      {domains.map((domain) => (
        <Button
          key={domain || 'all'}
          variant={value === domain ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onChange(domain)}
          aria-pressed={value === domain}
        >
          {domain ? domainLabels[domain] : 'すべて'}
        </Button>
      ))}
    </div>
  );
}
