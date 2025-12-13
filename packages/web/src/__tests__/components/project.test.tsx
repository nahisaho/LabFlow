/**
 * Project Components Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectCard, ProjectList, DomainSelector, Project, ProjectDomain } from '@/components/project';

const mockProject: Project = {
  id: 'proj-1',
  name: 'Test Project',
  description: 'A test project',
  domain: 'drug-discovery',
  status: 'active',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

describe('Project Components', () => {
  describe('ProjectCard', () => {
    it('should render project name', () => {
      render(<ProjectCard project={mockProject} />);
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should render project description', () => {
      render(<ProjectCard project={mockProject} />);
      expect(screen.getByText('A test project')).toBeInTheDocument();
    });

    it('should render domain badge', () => {
      render(<ProjectCard project={mockProject} />);
      expect(screen.getByText('創薬')).toBeInTheDocument();
    });

    it('should render status', () => {
      render(<ProjectCard project={mockProject} />);
      // Status is displayed as "状態: アクティブ" 
      expect(screen.getByText(/アクティブ/)).toBeInTheDocument();
    });

    it('should call onSelect when open button clicked', () => {
      const onSelect = vi.fn();
      render(<ProjectCard project={mockProject} onSelect={onSelect} />);
      fireEvent.click(screen.getByText('開く'));
      expect(onSelect).toHaveBeenCalledWith(mockProject);
    });
  });

  describe('ProjectList', () => {
    const projects: Project[] = [
      mockProject,
      { ...mockProject, id: 'proj-2', name: 'Project 2' },
    ];

    it('should render all projects', () => {
      render(<ProjectList projects={projects} />);
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Project 2')).toBeInTheDocument();
    });

    it('should show empty state when no projects', () => {
      render(<ProjectList projects={[]} />);
      expect(screen.getByText('プロジェクトがありません')).toBeInTheDocument();
    });

    it('should filter by domain', () => {
      render(<ProjectList projects={projects} filter="materials-science" />);
      expect(screen.getByText('プロジェクトがありません')).toBeInTheDocument();
    });
  });

  describe('DomainSelector', () => {
    it('should render all domain options', () => {
      render(<DomainSelector value={null} onChange={() => {}} />);
      expect(screen.getByText('すべて')).toBeInTheDocument();
      expect(screen.getByText('創薬')).toBeInTheDocument();
      expect(screen.getByText('材料科学')).toBeInTheDocument();
      expect(screen.getByText('気候科学')).toBeInTheDocument();
      expect(screen.getByText('ゲノミクス')).toBeInTheDocument();
    });

    it('should call onChange when domain is selected', () => {
      const onChange = vi.fn();
      render(<DomainSelector value={null} onChange={onChange} />);
      fireEvent.click(screen.getByText('創薬'));
      expect(onChange).toHaveBeenCalledWith('drug-discovery');
    });

    it('should highlight selected domain', () => {
      render(<DomainSelector value="drug-discovery" onChange={() => {}} />);
      const drugDiscovery = screen.getByText('創薬').closest('button');
      // Primary variant has bg-blue-600
      expect(drugDiscovery).toHaveClass('bg-blue-600');
    });
  });
});
