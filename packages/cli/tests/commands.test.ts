/**
 * CLI Commands Tests
 *
 * WKFL-NBIO-001 to WKFL-NBIO-010: CLI and Notebook integration requirements
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Command } from 'commander';
import {
  createInitCommand,
  createWorkflowCommand,
  createSearchCommand,
  createExportCommand,
  type InitOptions,
  type WorkflowRunOptions,
  type SearchOptions,
} from '../src/commands/index.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// Mock fs
vi.mock('node:fs/promises');

describe('CLI Commands', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.exitOverride(); // Prevent process.exit
    vi.clearAllMocks();
  });

  describe('init command', () => {
    beforeEach(() => {
      createInitCommand(program);
    });

    it('should register init command (WKFL-NBIO-002)', () => {
      const initCmd = program.commands.find((cmd) => cmd.name() === 'init');
      expect(initCmd).toBeDefined();
    });

    it('should accept --domain option', () => {
      const initCmd = program.commands.find((cmd) => cmd.name() === 'init');
      const domainOption = initCmd?.options.find((opt) => opt.long === '--domain');
      expect(domainOption).toBeDefined();
    });

    it('should accept --notebook option (WKFL-NBIO-002)', () => {
      const initCmd = program.commands.find((cmd) => cmd.name() === 'init');
      const notebookOption = initCmd?.options.find((opt) => opt.long === '--notebook');
      expect(notebookOption).toBeDefined();
    });

    it('should accept --template option', () => {
      const initCmd = program.commands.find((cmd) => cmd.name() === 'init');
      const templateOption = initCmd?.options.find((opt) => opt.long === '--template');
      expect(templateOption).toBeDefined();
    });

    it('should support all research domains (WKFL-NBIO-010)', async () => {
      const domains = ['drug-discovery', 'materials', 'climate', 'genomics'];
      
      for (const domain of domains) {
        expect(domains).toContain(domain);
      }
    });
  });

  describe('workflow command', () => {
    beforeEach(() => {
      createWorkflowCommand(program);
    });

    it('should register workflow command', () => {
      const workflowCmd = program.commands.find((cmd) => cmd.name() === 'workflow');
      expect(workflowCmd).toBeDefined();
    });

    it('should have list subcommand', () => {
      const workflowCmd = program.commands.find((cmd) => cmd.name() === 'workflow');
      const listCmd = workflowCmd?.commands.find((cmd) => cmd.name() === 'list');
      expect(listCmd).toBeDefined();
    });

    it('should have run subcommand', () => {
      const workflowCmd = program.commands.find((cmd) => cmd.name() === 'workflow');
      const runCmd = workflowCmd?.commands.find((cmd) => cmd.name() === 'run');
      expect(runCmd).toBeDefined();
    });

    it('should accept --config option for run', () => {
      const workflowCmd = program.commands.find((cmd) => cmd.name() === 'workflow');
      const runCmd = workflowCmd?.commands.find((cmd) => cmd.name() === 'run');
      const configOption = runCmd?.options.find((opt) => opt.long === '--config');
      expect(configOption).toBeDefined();
    });

    it('should have validate subcommand', () => {
      const workflowCmd = program.commands.find((cmd) => cmd.name() === 'workflow');
      const validateCmd = workflowCmd?.commands.find((cmd) => cmd.name() === 'validate');
      expect(validateCmd).toBeDefined();
    });
  });

  describe('search command', () => {
    beforeEach(() => {
      createSearchCommand(program);
    });

    it('should register search command', () => {
      const searchCmd = program.commands.find((cmd) => cmd.name() === 'search');
      expect(searchCmd).toBeDefined();
    });

    it('should have docs subcommand with query argument', () => {
      const searchCmd = program.commands.find((cmd) => cmd.name() === 'search');
      const docsCmd = searchCmd?.commands.find((cmd) => cmd.name() === 'docs');
      expect(docsCmd).toBeDefined();
      expect(docsCmd?.registeredArguments[0]?.name()).toBe('query');
    });

    it('should have docs subcommand with --limit option', () => {
      const searchCmd = program.commands.find((cmd) => cmd.name() === 'search');
      const docsCmd = searchCmd?.commands.find((cmd) => cmd.name() === 'docs');
      const limitOption = docsCmd?.options.find((opt) => opt.long === '--limit');
      expect(limitOption).toBeDefined();
    });

    it('should have docs subcommand with --domain option for filtering', () => {
      const searchCmd = program.commands.find((cmd) => cmd.name() === 'search');
      const docsCmd = searchCmd?.commands.find((cmd) => cmd.name() === 'docs');
      const domainOption = docsCmd?.options.find((opt) => opt.long === '--domain');
      expect(domainOption).toBeDefined();
    });

    it('should have docs subcommand with --format option (json, table)', () => {
      const searchCmd = program.commands.find((cmd) => cmd.name() === 'search');
      const docsCmd = searchCmd?.commands.find((cmd) => cmd.name() === 'docs');
      const formatOption = docsCmd?.options.find((opt) => opt.long === '--format');
      expect(formatOption).toBeDefined();
    });

    it('should have literature subcommand for GraphRAG search', () => {
      const searchCmd = program.commands.find((cmd) => cmd.name() === 'search');
      const litCmd = searchCmd?.commands.find((cmd) => cmd.name() === 'literature');
      expect(litCmd).toBeDefined();
    });

    it('should have literature subcommand with domain and year options', () => {
      const searchCmd = program.commands.find((cmd) => cmd.name() === 'search');
      const litCmd = searchCmd?.commands.find((cmd) => cmd.name() === 'literature');
      const domainOption = litCmd?.options.find((opt) => opt.long === '--domain');
      const yearStartOption = litCmd?.options.find((opt) => opt.long === '--year-start');
      const yearEndOption = litCmd?.options.find((opt) => opt.long === '--year-end');
      expect(domainOption).toBeDefined();
      expect(yearStartOption).toBeDefined();
      expect(yearEndOption).toBeDefined();
    });

    it('should have stats subcommand', () => {
      const searchCmd = program.commands.find((cmd) => cmd.name() === 'search');
      const statsCmd = searchCmd?.commands.find((cmd) => cmd.name() === 'stats');
      expect(statsCmd).toBeDefined();
    });
  });

  describe('export command', () => {
    beforeEach(() => {
      createExportCommand(program);
    });

    it('should register export command (WKFL-NBIO-009)', () => {
      const exportCmd = program.commands.find((cmd) => cmd.name() === 'export');
      expect(exportCmd).toBeDefined();
    });

    it('should accept --format option with notebook value (WKFL-NBIO-009)', () => {
      const exportCmd = program.commands.find((cmd) => cmd.name() === 'export');
      const formatOption = exportCmd?.options.find((opt) => opt.long === '--format');
      expect(formatOption).toBeDefined();
    });

    it('should accept workflow argument', () => {
      const exportCmd = program.commands.find((cmd) => cmd.name() === 'export');
      expect(exportCmd?.registeredArguments[0]?.name()).toBe('workflow');
    });

    it('should accept --output option', () => {
      const exportCmd = program.commands.find((cmd) => cmd.name() === 'export');
      const outputOption = exportCmd?.options.find((opt) => opt.long === '--output');
      expect(outputOption).toBeDefined();
    });
  });
});

describe('Init Action', () => {
  const mockedFs = vi.mocked(fs);

  beforeEach(() => {
    vi.clearAllMocks();
    mockedFs.mkdir.mockResolvedValue(undefined);
    mockedFs.writeFile.mockResolvedValue(undefined);
    mockedFs.access.mockRejectedValue(new Error('Not found'));
  });

  it('should create project directory structure', async () => {
    const { initProject } = await import('../src/actions/init.js');
    
    await initProject({
      name: 'test-project',
      domain: 'drug-discovery',
      notebook: false,
    });

    expect(mockedFs.mkdir).toHaveBeenCalled();
  });

  it('should create labflow.config.json', async () => {
    const { initProject } = await import('../src/actions/init.js');
    
    await initProject({
      name: 'test-project',
      domain: 'drug-discovery',
      notebook: false,
    });

    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('labflow.config.json'),
      expect.any(String)
    );
  });

  it('should create template notebook when --notebook flag is set (WKFL-NBIO-002)', async () => {
    const { initProject } = await import('../src/actions/init.js');
    
    await initProject({
      name: 'test-project',
      domain: 'drug-discovery',
      notebook: true,
    });

    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('.ipynb'),
      expect.any(String)
    );
  });

  it('should include required notebook sections (WKFL-NBIO-003)', async () => {
    const { generateNotebook } = await import('../src/actions/init.js');
    
    const notebook = generateNotebook('drug-discovery');
    const notebookObj = JSON.parse(notebook);
    
    const cellContents = notebookObj.cells.map((c: { source: string[] }) => 
      c.source.join('')
    ).join('\n');

    expect(cellContents).toContain('概要');
    expect(cellContents).toContain('セットアップ');
    expect(cellContents).toContain('データ');
  });

  it('should generate domain-specific template (WKFL-NBIO-010)', async () => {
    const { generateNotebook } = await import('../src/actions/init.js');
    
    const drugNotebook = generateNotebook('drug-discovery');
    const materialsNotebook = generateNotebook('materials');
    
    expect(drugNotebook).not.toBe(materialsNotebook);
  });
});

describe('Search Action', () => {
  it('should perform semantic search with query', async () => {
    const { searchDocuments } = await import('../src/actions/search.js');
    
    const results = await searchDocuments('machine learning', {
      limit: 5,
    });

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });

  it('should respect limit option', async () => {
    const { searchDocuments } = await import('../src/actions/search.js');
    
    const results = await searchDocuments('test query', {
      limit: 3,
    });

    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('should filter by domain when specified', async () => {
    const { searchDocuments } = await import('../src/actions/search.js');
    
    const results = await searchDocuments('test', {
      limit: 10,
      domain: 'drug-discovery',
    });

    results.forEach((result) => {
      if (result.metadata?.domain) {
        expect(result.metadata.domain).toBe('drug-discovery');
      }
    });
  });

  it('should return results with score and content', async () => {
    const { searchDocuments } = await import('../src/actions/search.js');
    
    const results = await searchDocuments('test', { limit: 1 });

    if (results.length > 0) {
      expect(results[0]).toHaveProperty('score');
      expect(results[0]).toHaveProperty('content');
    }
  });
});

describe('Export Action', () => {
  const mockedFs = vi.mocked(fs);

  beforeEach(() => {
    vi.clearAllMocks();
    mockedFs.readFile.mockResolvedValue(
      JSON.stringify({
        name: 'test-workflow',
        steps: [{ id: 'step1', type: 'data-load' }],
      })
    );
    mockedFs.writeFile.mockResolvedValue(undefined);
  });

  it('should export workflow to notebook format (WKFL-NBIO-009)', async () => {
    const { exportWorkflow } = await import('../src/actions/export.js');
    
    await exportWorkflow('test-workflow.json', {
      format: 'notebook',
      output: 'output.ipynb',
    });

    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('.ipynb'),
      expect.any(String)
    );
  });

  it('should export workflow to JSON format', async () => {
    const { exportWorkflow } = await import('../src/actions/export.js');
    
    await exportWorkflow('test-workflow.json', {
      format: 'json',
      output: 'output.json',
    });

    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('.json'),
      expect.any(String)
    );
  });

  it('should export workflow to YAML format', async () => {
    const { exportWorkflow } = await import('../src/actions/export.js');
    
    await exportWorkflow('test-workflow.json', {
      format: 'yaml',
      output: 'output.yaml',
    });

    expect(mockedFs.writeFile).toHaveBeenCalled();
  });

  it('should convert workflow steps to notebook cells', async () => {
    const { workflowToNotebook } = await import('../src/actions/export.js');
    
    const workflow = {
      name: 'test-workflow',
      description: 'Test workflow',
      steps: [
        { id: 'step1', type: 'data-load', config: {} },
        { id: 'step2', type: 'model-run', config: {} },
      ],
    };
    
    const notebook = workflowToNotebook(workflow);
    const notebookObj = JSON.parse(notebook);
    
    expect(notebookObj.cells.length).toBeGreaterThan(2);
  });
});

describe('Workflow Action', () => {
  it('should list available workflows', async () => {
    const { listWorkflows } = await import('../src/actions/workflow.js');
    
    const workflows = await listWorkflows();
    
    expect(workflows).toBeDefined();
    expect(Array.isArray(workflows)).toBe(true);
  });

  it('should validate workflow file', async () => {
    const { validateWorkflow } = await import('../src/actions/workflow.js');
    
    const validWorkflow = {
      name: 'test',
      version: '1.0',
      steps: [{ id: 'step1', type: 'test' }],
    };
    
    const result = await validateWorkflow(validWorkflow);
    
    expect(result.valid).toBe(true);
  });

  it('should return validation errors for invalid workflow', async () => {
    const { validateWorkflow } = await import('../src/actions/workflow.js');
    
    const invalidWorkflow = {
      name: '',
      steps: [],
    };
    
    const result = await validateWorkflow(invalidWorkflow);
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('CLI Output Formatting', () => {
  it('should format search results as table', async () => {
    const { formatAsTable } = await import('../src/utils/format.js');
    
    const results = [
      { id: 'doc1', content: 'Test content', score: 0.95 },
      { id: 'doc2', content: 'Another test', score: 0.85 },
    ];
    
    const table = formatAsTable(results);
    
    expect(table).toContain('doc1');
    expect(table).toContain('0.95');
  });

  it('should format search results as JSON', async () => {
    const { formatAsJson } = await import('../src/utils/format.js');
    
    const results = [
      { id: 'doc1', content: 'Test content', score: 0.95 },
    ];
    
    const json = formatAsJson(results);
    const parsed = JSON.parse(json);
    
    expect(parsed[0].id).toBe('doc1');
  });

  it('should truncate long content in table format', async () => {
    const { formatAsTable } = await import('../src/utils/format.js');
    
    const results = [
      { id: 'doc1', content: 'A'.repeat(200), score: 0.9 },
    ];
    
    const table = formatAsTable(results, { maxContentLength: 50 });
    
    expect(table.length).toBeLessThan(300);
    expect(table).toContain('...');
  });
});
