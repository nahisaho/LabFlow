/**
 * LabFlow CLI
 *
 * Command-line interface for AI for Science workflows
 * 
 * DASH-NLI-001: Japanese and English input support
 * DASH-NLI-002: Intent analysis and workflow recommendation
 */

import { Command } from 'commander';
import {
  createInitCommand,
  createWorkflowCommand,
  createSearchCommand,
  createExportCommand,
  createAskCommand,
} from './commands/index.js';

const program = new Command();

program
  .name('labflow')
  .description('LabFlow CLI - AI for Science Starter Kit')
  .version('0.0.1');

// Register commands
createAskCommand(program);      // Natural language interface
createInitCommand(program);     // Project initialization
createWorkflowCommand(program); // Workflow management
createSearchCommand(program);   // Semantic search
createExportCommand(program);   // Export workflows

// Parse arguments
program.parse();
