/**
 * Lab Module
 *
 * Requirements:
 * - LAB-CORE-001: Team collaboration
 * - LAB-CORE-002: Data sharing
 * - LAB-DATA-001: Dataset management
 * - LAB-EXP-001: Experiment tracking
 * - LAB-MEM-001: Member management
 * - LAB-INV-001: Invitation system
 */

// Types
export * from './types.js';

// Lab Service
export {
  LabService,
  DEFAULT_LAB_SETTINGS,
  type LabRepository,
} from './lab-service.js';

// Dataset Service
export {
  DatasetService,
  type DatasetRepository,
  type LabPermissionService,
  type GraphRAGIndexer,
} from './dataset-service.js';

// Experiment Service
export {
  ExperimentService,
  type ExperimentRepository,
  type WorkflowExecutor,
} from './experiment-service.js';
