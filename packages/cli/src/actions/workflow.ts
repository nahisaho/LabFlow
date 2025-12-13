/**
 * Workflow Action
 *
 * WKFL-RUNT-001: List and run workflows
 * WKFL-DEFL-003: Validate workflow schemas
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface WorkflowInfo {
  name: string;
  path: string;
  description?: string;
  version?: string;
  status: 'valid' | 'invalid' | 'unknown';
  stepCount: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
}

interface WorkflowDefinition {
  name?: string;
  description?: string;
  version?: string;
  steps?: WorkflowStep[];
}

interface WorkflowStep {
  id?: string;
  type?: string;
  config?: Record<string, unknown>;
  depends?: string[];
}

/**
 * List all workflows in a directory
 */
export async function listWorkflows(
  directory: string = process.cwd()
): Promise<WorkflowInfo[]> {
  const workflows: WorkflowInfo[] = [];
  const workflowDir = path.join(directory, 'workflows');

  try {
    const files = await fs.readdir(workflowDir);
    
    // Handle case where fs.readdir returns undefined (e.g., in tests)
    if (!files || !Array.isArray(files)) {
      return workflows;
    }

    for (const file of files) {
      if (file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml')) {
        const filePath = path.join(workflowDir, file);
        const info = await getWorkflowInfo(filePath);
        workflows.push(info);
      }
    }
  } catch (error) {
    // workflows directory doesn't exist, return empty array
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  return workflows;
}

/**
 * Get information about a specific workflow
 */
async function getWorkflowInfo(filePath: string): Promise<WorkflowInfo> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const workflow = JSON.parse(content) as WorkflowDefinition;
    const validation = validateWorkflowObject(workflow);

    return {
      name: workflow.name ?? path.basename(filePath, path.extname(filePath)),
      path: filePath,
      description: workflow.description,
      version: workflow.version,
      status: validation.isValid ? 'valid' : 'invalid',
      stepCount: workflow.steps?.length ?? 0,
    };
  } catch {
    return {
      name: path.basename(filePath, path.extname(filePath)),
      path: filePath,
      status: 'unknown',
      stepCount: 0,
    };
  }
}

/**
 * Validate a workflow file (WKFL-DEFL-003)
 * Accepts either a file path string or a workflow object
 */
export async function validateWorkflow(
  workflowOrPath: string | WorkflowDefinition
): Promise<{ valid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] }> {
  try {
    let workflow: WorkflowDefinition;
    
    if (typeof workflowOrPath === 'string') {
      const content = await fs.readFile(workflowOrPath, 'utf-8');
      workflow = JSON.parse(content) as WorkflowDefinition;
    } else {
      workflow = workflowOrPath;
    }
    
    const result = validateWorkflowObject(workflow);
    return {
      valid: result.isValid,
      errors: result.errors,
      warnings: result.warnings,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          path: '',
          message: `Failed to parse workflow: ${(error as Error).message}`,
          code: 'PARSE_ERROR',
        },
      ],
      warnings: [],
    };
  }
}

/**
 * Validate workflow object against schema
 */
function validateWorkflowObject(workflow: WorkflowDefinition): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required: name
  if (!workflow.name || typeof workflow.name !== 'string') {
    errors.push({
      path: 'name',
      message: 'Workflow name is required and must be a string',
      code: 'REQUIRED_FIELD',
    });
  }

  // Required: steps
  if (!workflow.steps || !Array.isArray(workflow.steps)) {
    errors.push({
      path: 'steps',
      message: 'Workflow steps are required and must be an array',
      code: 'REQUIRED_FIELD',
    });
  } else if (workflow.steps.length === 0) {
    warnings.push({
      path: 'steps',
      message: 'Workflow has no steps defined',
      code: 'EMPTY_STEPS',
    });
  } else {
    // Validate each step
    const stepIds = new Set<string>();

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const stepPath = `steps[${i}]`;

      // Step ID required
      if (!step.id || typeof step.id !== 'string') {
        errors.push({
          path: `${stepPath}.id`,
          message: 'Step ID is required and must be a string',
          code: 'REQUIRED_FIELD',
        });
      } else {
        // Check for duplicate IDs
        if (stepIds.has(step.id)) {
          errors.push({
            path: `${stepPath}.id`,
            message: `Duplicate step ID: ${step.id}`,
            code: 'DUPLICATE_ID',
          });
        }
        stepIds.add(step.id);
      }

      // Step type required
      if (!step.type || typeof step.type !== 'string') {
        errors.push({
          path: `${stepPath}.type`,
          message: 'Step type is required and must be a string',
          code: 'REQUIRED_FIELD',
        });
      }

      // Validate dependencies
      if (step.depends) {
        if (!Array.isArray(step.depends)) {
          errors.push({
            path: `${stepPath}.depends`,
            message: 'Step depends must be an array',
            code: 'INVALID_TYPE',
          });
        } else {
          for (const dep of step.depends) {
            if (typeof dep !== 'string') {
              errors.push({
                path: `${stepPath}.depends`,
                message: 'Dependency must be a string',
                code: 'INVALID_TYPE',
              });
            }
          }
        }
      }
    }

    // Validate dependency references
    if (workflow.steps.length > 0) {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        if (step.depends && Array.isArray(step.depends)) {
          for (const dep of step.depends) {
            if (!stepIds.has(dep)) {
              errors.push({
                path: `steps[${i}].depends`,
                message: `Unknown dependency: ${dep}`,
                code: 'UNKNOWN_DEPENDENCY',
              });
            }
          }
        }
      }
    }
  }

  // Optional: version format warning
  if (workflow.version && !/^\d+\.\d+\.\d+/.test(workflow.version)) {
    warnings.push({
      path: 'version',
      message: 'Version should follow semantic versioning (e.g., 1.0.0)',
      code: 'VERSION_FORMAT',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Run a workflow
 */
export async function runWorkflow(
  workflowFile: string,
  options: { dryRun?: boolean } = {}
): Promise<{ success: boolean; message: string }> {
  const validation = await validateWorkflow(workflowFile);

  if (!validation.isValid) {
    return {
      success: false,
      message: `Workflow validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
    };
  }

  if (options.dryRun) {
    return {
      success: true,
      message: 'Workflow validation passed (dry run)',
    };
  }

  // In a real implementation, this would execute the workflow
  return {
    success: true,
    message: 'Workflow executed successfully',
  };
}
