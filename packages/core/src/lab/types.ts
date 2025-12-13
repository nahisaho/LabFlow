/**
 * Lab Module Types
 *
 * Requirements:
 * - LAB-CORE-001: Team collaboration
 * - LAB-CORE-002: Data sharing
 * - LAB-DATA-001: Dataset management
 * - LAB-EXP-001: Experiment tracking
 */

/**
 * Lab member roles
 */
export type LabMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Dataset types
 */
export type DatasetType =
  | 'molecules'
  | 'proteins'
  | 'sequences'
  | 'spectra'
  | 'images'
  | 'tabular'
  | 'time_series'
  | 'other';

/**
 * Dataset visibility levels
 */
export type DatasetVisibility = 'private' | 'lab' | 'public';

/**
 * Experiment status
 */
export type ExperimentStatus =
  | 'draft'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Lab settings
 */
export interface LabSettings {
  allowDatasetExport: boolean;
  requireApprovalForPublic: boolean;
  defaultVisibility: DatasetVisibility;
  maxStorageGb: number;
  enableGraphRAG: boolean;
}

/**
 * Lab entity
 */
export interface Lab {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  settings: LabSettings;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lab member entity
 */
export interface LabMember {
  id: string;
  labId: string;
  userId: string;
  role: LabMemberRole;
  invitedById: string | null;
  joinedAt: Date;
  updatedAt: Date;
}

/**
 * Dataset schema
 */
export interface DatasetSchema {
  columns: DatasetColumn[];
  primaryKey?: string;
  version?: string;
}

/**
 * Dataset column definition
 */
export interface DatasetColumn {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array';
  nullable?: boolean;
  description?: string;
}

/**
 * Lab dataset entity
 */
export interface LabDataset {
  id: string;
  labId: string;
  name: string;
  description: string | null;
  type: DatasetType;
  visibility: DatasetVisibility;
  schema: DatasetSchema | null;
  storagePath: string;
  sizeBytes: number;
  rowCount: number | null;
  isIndexed: boolean;
  tags: string[];
  version: number;
  parentId: string | null;
  customFields: Record<string, unknown>;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Experiment results
 */
export interface ExperimentResults {
  metrics?: Record<string, number>;
  artifacts?: string[];
  outputs?: Record<string, unknown>;
  error?: string;
}

/**
 * Lab experiment entity
 */
export interface LabExperiment {
  id: string;
  labId: string;
  name: string;
  description: string | null;
  status: ExperimentStatus;
  workflowId: string | null;
  parameters: Record<string, unknown>;
  results: ExperimentResults | null;
  tags: string[];
  createdById: string;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lab invitation entity
 */
export interface LabInvitation {
  id: string;
  labId: string;
  email: string;
  role: LabMemberRole;
  token: string;
  invitedById: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}

/**
 * Create lab input
 */
export interface CreateLabInput {
  name: string;
  description?: string;
  iconUrl?: string;
  settings?: Partial<LabSettings>;
}

/**
 * Update lab input
 */
export interface UpdateLabInput {
  name?: string;
  description?: string;
  iconUrl?: string;
  settings?: Partial<LabSettings>;
}

/**
 * Create dataset input
 */
export interface CreateDatasetInput {
  labId: string;
  name: string;
  description?: string;
  type: DatasetType;
  visibility?: DatasetVisibility;
  schema?: DatasetSchema;
  storagePath: string;
  sizeBytes: number;
  rowCount?: number;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

/**
 * Update dataset input
 */
export interface UpdateDatasetInput {
  name?: string;
  description?: string;
  visibility?: DatasetVisibility;
  schema?: DatasetSchema;
  sizeBytes?: number;
  rowCount?: number;
  isIndexed?: boolean;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

/**
 * Create experiment input
 */
export interface CreateExperimentInput {
  labId: string;
  name: string;
  description?: string;
  workflowId?: string;
  parameters?: Record<string, unknown>;
  tags?: string[];
}

/**
 * Update experiment input
 */
export interface UpdateExperimentInput {
  name?: string;
  description?: string;
  status?: ExperimentStatus;
  parameters?: Record<string, unknown>;
  results?: ExperimentResults;
  tags?: string[];
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Invite member input
 */
export interface InviteMemberInput {
  labId: string;
  email: string;
  role: LabMemberRole;
}

/**
 * Lab member with user info
 */
export interface LabMemberWithUser extends LabMember {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

/**
 * Lab with member count
 */
export interface LabWithStats extends Lab {
  memberCount: number;
  datasetCount: number;
  experimentCount: number;
}

/**
 * Dataset with creator info
 */
export interface DatasetWithCreator extends LabDataset {
  createdBy: {
    id: string;
    name: string | null;
  };
}

/**
 * List options for labs
 */
export interface ListLabsOptions {
  userId: string;
  role?: LabMemberRole;
  limit?: number;
  offset?: number;
}

/**
 * List options for datasets
 */
export interface ListDatasetsOptions {
  labId: string;
  type?: DatasetType;
  visibility?: DatasetVisibility;
  isIndexed?: boolean;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * List options for experiments
 */
export interface ListExperimentsOptions {
  labId: string;
  status?: ExperimentStatus;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Permission check result
 */
export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}
