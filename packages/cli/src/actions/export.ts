/**
 * Export Action
 *
 * WKFL-NBIO-009: Export workflow to notebook format
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface ExportOptions {
  format: 'notebook' | 'json' | 'yaml';
  output?: string;
}

export interface WorkflowDefinition {
  name: string;
  description?: string;
  version?: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  type: string;
  config?: Record<string, unknown>;
}

/**
 * Export workflow to specified format
 */
export async function exportWorkflow(
  workflowFile: string,
  options: ExportOptions
): Promise<void> {
  // Read workflow file
  const content = await fs.readFile(workflowFile, 'utf-8');
  const workflow = JSON.parse(content) as WorkflowDefinition;

  let output: string;
  let outputPath: string;

  switch (options.format) {
    case 'notebook':
      output = workflowToNotebook(workflow);
      outputPath =
        options.output ??
        workflowFile.replace(/\.(json|yaml|yml)$/, '.ipynb');
      break;

    case 'yaml':
      output = workflowToYaml(workflow);
      outputPath =
        options.output ?? workflowFile.replace(/\.json$/, '.yaml');
      break;

    case 'json':
    default:
      output = JSON.stringify(workflow, null, 2);
      outputPath =
        options.output ?? workflowFile.replace(/\.(yaml|yml)$/, '.json');
      break;
  }

  await fs.writeFile(outputPath, output);
}

/**
 * Convert workflow to Jupyter notebook format (WKFL-NBIO-009)
 */
export function workflowToNotebook(workflow: WorkflowDefinition): string {
  const cells: NotebookCell[] = [];

  // Title cell
  cells.push(
    markdownCell(`# ${workflow.name}\n\n${workflow.description ?? ''}`)
  );

  // Setup cell
  cells.push(markdownCell('## Setup'));
  cells.push(
    codeCell(`# LabFlow Workflow: ${workflow.name}
from labflow import LabFlow, WorkflowRunner

lf = LabFlow()
runner = WorkflowRunner(lf)`)
  );

  // Generate cell for each step
  for (const step of workflow.steps) {
    cells.push(markdownCell(`## Step: ${step.id}`));
    cells.push(codeCell(generateStepCode(step)));
  }

  // Results cell
  cells.push(markdownCell('## Results'));
  cells.push(
    codeCell(`# Display results
print("Workflow completed successfully")
runner.get_results()`)
  );

  const notebook: JupyterNotebook = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3',
      },
      language_info: {
        name: 'python',
        version: '3.10.0',
      },
    },
    cells,
  };

  return JSON.stringify(notebook, null, 2);
}

/**
 * Convert workflow to YAML format
 */
function workflowToYaml(workflow: WorkflowDefinition): string {
  // Simple YAML serialization
  const lines: string[] = [];
  lines.push(`name: ${workflow.name}`);
  if (workflow.description) {
    lines.push(`description: ${workflow.description}`);
  }
  if (workflow.version) {
    lines.push(`version: ${workflow.version}`);
  }
  lines.push('steps:');
  for (const step of workflow.steps) {
    lines.push(`  - id: ${step.id}`);
    lines.push(`    type: ${step.type}`);
    if (step.config && Object.keys(step.config).length > 0) {
      lines.push('    config:');
      for (const [key, value] of Object.entries(step.config)) {
        lines.push(`      ${key}: ${JSON.stringify(value)}`);
      }
    }
  }
  return lines.join('\n');
}

/**
 * Generate Python code for a workflow step
 */
function generateStepCode(step: WorkflowStep): string {
  const configStr = step.config
    ? JSON.stringify(step.config, null, 2)
        .split('\n')
        .map((line, i) => (i === 0 ? line : '    ' + line))
        .join('\n')
    : '{}';

  return `# Step: ${step.id} (${step.type})
config = ${configStr}
result_${step.id} = runner.run_step('${step.id}', '${step.type}', config)
print(f"Step ${step.id} completed")`;
}

interface JupyterNotebook {
  nbformat: number;
  nbformat_minor: number;
  metadata: {
    kernelspec: {
      display_name: string;
      language: string;
      name: string;
    };
    language_info: {
      name: string;
      version: string;
    };
  };
  cells: NotebookCell[];
}

interface NotebookCell {
  cell_type: 'markdown' | 'code';
  metadata: Record<string, unknown>;
  source: string[];
  execution_count?: number | null;
  outputs?: unknown[];
}

function markdownCell(content: string): NotebookCell {
  return {
    cell_type: 'markdown',
    metadata: {},
    source: content.split('\n').map((line, i, arr) =>
      i < arr.length - 1 ? line + '\n' : line
    ),
  };
}

function codeCell(code: string): NotebookCell {
  return {
    cell_type: 'code',
    metadata: {},
    source: code.split('\n').map((line, i, arr) =>
      i < arr.length - 1 ? line + '\n' : line
    ),
    execution_count: null,
    outputs: [],
  };
}
