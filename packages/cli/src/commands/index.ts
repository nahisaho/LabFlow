/**
 * CLI Commands
 *
 * WKFL-NBIO-002: labflow init --notebook
 * WKFL-NBIO-009: labflow export --format notebook
 * DASH-NLI-001: Japanese and English input support
 * DASH-NLI-002: Intent analysis and workflow recommendation
 */

import { Command } from 'commander';
import { initProject, generateNotebook } from '../actions/init.js';
import { searchDocuments, searchLiterature, searchLiteratureByDomain, getLiteratureStats, type LiteratureSearchOptions, type LiteratureSearchResult } from '../actions/search.js';
import { exportWorkflow, workflowToNotebook } from '../actions/export.js';
import { listWorkflows, validateWorkflow } from '../actions/workflow.js';
import { processQuery, formatAskResult, getClarificationOptions } from '../actions/ask.js';
import { formatAsTable, formatAsJson } from '../utils/format.js';
import { select, confirm, styles } from '../utils/prompt.js';
import type { LiteratureDomain } from '@labflow/core/knowledge';

export interface InitOptions {
  name?: string;
  domain?: string;
  template?: string;
  notebook?: boolean;
}

export interface WorkflowRunOptions {
  config?: string;
}

export interface SearchOptions {
  limit?: number;
  domain?: string;
  format?: 'json' | 'table';
}

export interface LitSearchOptions {
  limit?: number;
  domain?: string;
  yearStart?: number;
  yearEnd?: number;
  minCitations?: number;
  format?: 'json' | 'table';
}

export interface ExportOptions {
  format?: 'notebook' | 'json' | 'yaml';
  output?: string;
}

export interface AskOptions {
  language?: 'ja' | 'en';
  verbose?: boolean;
  interactive?: boolean;
}

/**
 * Create ask command (DASH-NLI-001, DASH-NLI-002)
 */
export function createAskCommand(program: Command): void {
  program
    .command('ask')
    .description('Ask LabFlow in natural language (Japanese/English)')
    .argument('<query...>', 'Your question or request')
    .option('-l, --language <lang>', 'Force language (ja/en)')
    .option('-v, --verbose', 'Show detailed analysis')
    .option('-i, --interactive', 'Interactive mode with follow-up questions')
    .action(async (queryParts: string[], options: AskOptions) => {
      try {
        const query = queryParts.join(' ');
        
        console.log('');
        console.log(styles.cyan('🔍 Analyzing your request...'));
        console.log('');

        const result = await processQuery(query, {
          language: options.language,
          verbose: options.verbose,
        });

        console.log(formatAskResult(result, options.verbose));

        // Interactive mode
        if (options.interactive && result.suggestions.length > 0) {
          console.log('');
          const shouldRun = await confirm({
            message: result.language === 'ja'
              ? '推奨ワークフローを実行しますか?'
              : 'Would you like to run a recommended workflow?',
            defaultValue: false,
          });

          if (shouldRun) {
            const choices = result.suggestions.map((s, i) => ({
              value: s.command,
              label: `${s.name} - ${s.description}`,
            }));

            const selectedCommand = await select({
              message: result.language === 'ja'
                ? 'ワークフローを選択:'
                : 'Select workflow:',
              choices,
            });

            console.log('');
            console.log(styles.green(`$ ${selectedCommand}`));
            console.log('');
            // TODO: Actually execute the command
          }
        }

        // Handle clarification
        if (result.intent.needsClarification && options.interactive) {
          const clarificationOptions = getClarificationOptions(result);
          if (clarificationOptions.length > 0) {
            const choices = clarificationOptions.map((opt) => ({
              value: opt,
              label: opt,
            }));

            const selectedOption = await select({
              message: result.intent.clarificationQuestion ?? 'Please select:',
              choices,
            });

            // Re-process with clarification
            const clarifiedQuery = `${query} ${selectedOption}`;
            const clarifiedResult = await processQuery(clarifiedQuery, options);
            console.log('');
            console.log(formatAskResult(clarifiedResult, options.verbose));
          }
        }
      } catch (error) {
        console.error('Error processing query:', error);
        process.exit(1);
      }
    });
}

/**
 * Create init command (WKFL-NBIO-002)
 */
export function createInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize a new LabFlow project')
    .option('-n, --name <name>', 'Project name')
    .option(
      '-d, --domain <domain>',
      'Research domain (drug-discovery, materials, climate, genomics)'
    )
    .option('-t, --template <template>', 'Workflow template to use')
    .option('--notebook', 'Generate template Jupyter notebook')
    .action(async (options: InitOptions) => {
      try {
        await initProject({
          name: options.name ?? 'labflow-project',
          domain: options.domain ?? 'drug-discovery',
          notebook: options.notebook ?? false,
          template: options.template,
        });
        console.log('✓ Project initialized successfully');
      } catch (error) {
        console.error('Error initializing project:', error);
        process.exit(1);
      }
    });
}

/**
 * Create workflow command
 */
export function createWorkflowCommand(program: Command): void {
  const workflow = program
    .command('workflow')
    .description('Workflow management commands');

  workflow
    .command('list')
    .description('List available workflows')
    .action(async () => {
      try {
        const workflows = await listWorkflows();
        console.log('Available workflows:');
        workflows.forEach((wf) => {
          console.log(`  - ${wf.name}: ${wf.description}`);
        });
      } catch (error) {
        console.error('Error listing workflows:', error);
        process.exit(1);
      }
    });

  workflow
    .command('run <workflow>')
    .description('Run a workflow')
    .option('-c, --config <config>', 'Configuration file')
    .action(async (workflowId: string, options: WorkflowRunOptions) => {
      console.log(`Running workflow ${workflowId}...`, options);
      // TODO: Implement workflow execution
    });

  workflow
    .command('validate <file>')
    .description('Validate a workflow file')
    .action(async (file: string) => {
      try {
        const fs = await import('node:fs/promises');
        const content = await fs.readFile(file, 'utf-8');
        const workflowDef = JSON.parse(content);
        const result = await validateWorkflow(workflowDef);
        
        if (result.valid) {
          console.log('✓ Workflow is valid');
        } else {
          console.log('✗ Workflow validation failed:');
          result.errors.forEach((err) => console.log(`  - ${err}`));
          process.exit(1);
        }
      } catch (error) {
        console.error('Error validating workflow:', error);
        process.exit(1);
      }
    });
}

/**
 * Create search command
 */
export function createSearchCommand(program: Command): void {
  const search = program
    .command('search')
    .description('Search documents and literature');

  // Basic semantic search
  search
    .command('docs')
    .description('Search documents using semantic search')
    .argument('<query>', 'Search query')
    .option('-l, --limit <limit>', 'Maximum number of results', '10')
    .option('-d, --domain <domain>', 'Filter by domain')
    .option('-f, --format <format>', 'Output format (json, table)', 'table')
    .action(async (query: string, options: SearchOptions) => {
      try {
        const results = await searchDocuments(query, {
          limit: Number(options.limit) || 10,
          domain: options.domain,
        });

        if (options.format === 'json') {
          console.log(formatAsJson(results));
        } else {
          console.log(formatAsTable(results));
        }
      } catch (error) {
        console.error('Error searching:', error);
        process.exit(1);
      }
    });

  // Literature search (GraphRAG integration)
  search
    .command('literature')
    .alias('lit')
    .description('Search scientific literature with GraphRAG')
    .argument('<query>', 'Search query')
    .option('-l, --limit <limit>', 'Maximum number of results', '10')
    .option('-d, --domain <domain>', 'Filter by domain (drug-discovery, materials-science, climate, genomics, chemistry, physics, biology)')
    .option('--year-start <year>', 'Filter by start year')
    .option('--year-end <year>', 'Filter by end year')
    .option('--min-citations <count>', 'Minimum citation count')
    .option('-f, --format <format>', 'Output format (json, table)', 'table')
    .action(async (query: string, options: LitSearchOptions) => {
      try {
        console.log('');
        console.log(styles.cyan('🔬 Searching scientific literature...'));
        console.log('');

        const searchOptions: LiteratureSearchOptions = {
          limit: Number(options.limit) || 10,
          domain: options.domain as LiteratureDomain | undefined,
          yearRange: (options.yearStart || options.yearEnd) ? {
            start: options.yearStart ? Number(options.yearStart) : undefined,
            end: options.yearEnd ? Number(options.yearEnd) : undefined,
          } : undefined,
          minCitations: options.minCitations ? Number(options.minCitations) : undefined,
        };

        const results = await searchLiterature(query, searchOptions);

        if (results.length === 0) {
          console.log(styles.yellow('No papers found. Try adjusting your search criteria.'));
          console.log('');
          console.log('Tips:');
          console.log('  - Use broader search terms');
          console.log('  - Remove domain filters');
          console.log('  - Expand year range');
          return;
        }

        if (options.format === 'json') {
          console.log(formatAsJson(results));
        } else {
          formatLiteratureResults(results);
        }
      } catch (error) {
        console.error('Error searching literature:', error);
        process.exit(1);
      }
    });

  // Domain-specific search
  search
    .command('domain <domain>')
    .description('Search within a specific research domain')
    .argument('<query>', 'Search query')
    .option('-l, --limit <limit>', 'Maximum number of results', '10')
    .option('-f, --format <format>', 'Output format (json, table)', 'table')
    .action(async (domain: string, query: string, options: SearchOptions) => {
      try {
        const validDomains = ['drug-discovery', 'materials-science', 'climate', 'genomics', 'chemistry', 'physics', 'biology'];
        
        if (!validDomains.includes(domain)) {
          console.error(`Invalid domain. Choose from: ${validDomains.join(', ')}`);
          process.exit(1);
        }

        console.log('');
        console.log(styles.cyan(`🔬 Searching ${domain} literature...`));
        console.log('');

        const results = await searchLiteratureByDomain(
          domain as LiteratureDomain,
          query,
          Number(options.limit) || 10
        );

        if (results.length === 0) {
          console.log(styles.yellow(`No papers found in ${domain}.`));
          return;
        }

        if (options.format === 'json') {
          console.log(formatAsJson(results));
        } else {
          formatLiteratureResults(results);
        }
      } catch (error) {
        console.error('Error searching domain:', error);
        process.exit(1);
      }
    });

  // Statistics
  search
    .command('stats')
    .description('Show literature database statistics')
    .action(() => {
      try {
        const stats = getLiteratureStats();

        console.log('');
        console.log(styles.cyan('📊 Literature Database Statistics'));
        console.log('');
        console.log(`Total Papers: ${stats.totalPapers}`);
        console.log(`Total Entities: ${stats.totalEntities}`);
        console.log('');
        console.log('Papers by Domain:');
        
        for (const [domain, count] of Object.entries(stats.papersByDomain)) {
          if (count > 0) {
            console.log(`  ${domain}: ${count}`);
          }
        }
        console.log('');
      } catch (error) {
        console.error('Error getting statistics:', error);
        process.exit(1);
      }
    });
}

/**
 * Format literature search results for console output
 */
function formatLiteratureResults(results: LiteratureSearchResult[]): void {
  console.log(`Found ${results.length} papers:\n`);

  for (const result of results) {
    console.log(styles.green(`📄 ${result.title}`));
    console.log(`   Authors: ${result.authors.join(', ')}`);
    if (result.year) {
      console.log(`   Year: ${result.year}`);
    }
    if (result.domain) {
      console.log(`   Domain: ${result.domain}`);
    }
    if (result.citations !== undefined) {
      console.log(`   Citations: ${result.citations}`);
    }
    console.log(`   Score: ${(result.score * 100).toFixed(1)}%`);
    
    if (result.highlights.length > 0) {
      console.log('   Highlights:');
      for (const highlight of result.highlights.slice(0, 2)) {
        console.log(`     "${highlight.substring(0, 100)}..."`);
      }
    }
    console.log('');
  }
}

/**
 * Create export command (WKFL-NBIO-009)
 */
export function createExportCommand(program: Command): void {
  program
    .command('export')
    .description('Export workflow to different formats')
    .argument('<workflow>', 'Workflow file to export')
    .option(
      '-f, --format <format>',
      'Output format (notebook, json, yaml)',
      'notebook'
    )
    .option('-o, --output <output>', 'Output file path')
    .action(async (workflow: string, options: ExportOptions) => {
      try {
        await exportWorkflow(workflow, {
          format: options.format ?? 'notebook',
          output: options.output,
        });
        console.log('✓ Export completed successfully');
      } catch (error) {
        console.error('Error exporting workflow:', error);
        process.exit(1);
      }
    });
}

// Re-export action functions for testing
export { initProject, generateNotebook } from '../actions/init.js';
export { searchDocuments, searchLiterature, searchLiteratureByDomain, addLiteraturePaper, getLiteratureStats, getPapersByDomain } from '../actions/search.js';
export { exportWorkflow, workflowToNotebook } from '../actions/export.js';
export { listWorkflows, validateWorkflow } from '../actions/workflow.js';
export { processQuery, formatAskResult, getClarificationOptions } from '../actions/ask.js';
export { formatAsTable, formatAsJson } from '../utils/format.js';
export { prompt, select, confirm, withSpinner, styles, box } from '../utils/prompt.js';
