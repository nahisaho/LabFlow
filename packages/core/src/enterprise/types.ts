/**
 * Enterprise Module Types
 * 
 * Types for enterprise features including SSO, audit logging,
 * and regulatory compliance (21 CFR Part 11).
 */

// ============================================================================
// SSO / Authentication Types
// ============================================================================

/**
 * SSO Provider type
 */
export type SSOProviderType = 
  | 'saml'
  | 'oidc'
  | 'azure_ad'
  | 'okta'
  | 'google_workspace';

/**
 * SSO Provider configuration
 */
export interface SSOProviderConfig {
  id: string;
  name: string;
  type: SSOProviderType;
  enabled: boolean;
  config: SAMLConfig | OIDCConfig;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SAML configuration
 */
export interface SAMLConfig {
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: string;
  signRequest: boolean;
  signatureAlgorithm: 'sha256' | 'sha512';
  nameIdFormat: string;
  attributeMapping: {
    email: string;
    name: string;
    groups?: string;
  };
}

/**
 * OIDC configuration
 */
export interface OIDCConfig {
  clientId: string;
  clientSecret: string;
  issuer: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
  responseType: 'code' | 'token';
}

/**
 * SSO session
 */
export interface SSOSession {
  id: string;
  userId: string;
  providerId: string;
  providerUserId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt: Date;
  createdAt: Date;
}

// ============================================================================
// Audit Log Types
// ============================================================================

/**
 * Audit event category
 */
export type AuditEventCategory =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'system_config'
  | 'workflow_execution'
  | 'export'
  | 'compliance';

/**
 * Audit event severity
 */
export type AuditEventSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Audit event
 */
export interface AuditEvent {
  id: string;
  timestamp: Date;
  category: AuditEventCategory;
  severity: AuditEventSeverity;
  action: string;
  actor: {
    userId: string;
    userName: string;
    email: string;
    ipAddress: string;
    userAgent?: string;
  };
  resource: {
    type: string;
    id: string;
    name?: string;
  };
  details: Record<string, unknown>;
  outcome: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  metadata: {
    sessionId?: string;
    requestId?: string;
    correlationId?: string;
  };
}

/**
 * Audit log query options
 */
export interface AuditLogQueryOptions {
  startDate?: Date;
  endDate?: Date;
  category?: AuditEventCategory;
  severity?: AuditEventSeverity;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  outcome?: 'success' | 'failure';
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Audit log export format
 */
export type AuditExportFormat = 'json' | 'csv' | 'pdf';

// ============================================================================
// 21 CFR Part 11 Compliance Types
// ============================================================================

/**
 * Electronic signature
 */
export interface ElectronicSignature {
  id: string;
  documentId: string;
  documentType: string;
  documentVersion: string;
  signedAt: Date;
  signer: {
    userId: string;
    userName: string;
    email: string;
    title?: string;
    organization?: string;
  };
  meaning: string; // e.g., "Approved", "Reviewed", "Authored"
  signatureData: {
    method: 'password' | 'biometric' | 'certificate';
    verificationTimestamp: Date;
    certificateId?: string;
  };
  hash: string;
  metadata: Record<string, unknown>;
}

/**
 * Document version for audit trail
 */
export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  contentHash: string;
  createdAt: Date;
  createdBy: {
    userId: string;
    userName: string;
  };
  changeDescription?: string;
  signatures: ElectronicSignature[];
}

/**
 * Compliance check result
 */
export interface ComplianceCheckResult {
  id: string;
  checkType: string;
  passed: boolean;
  timestamp: Date;
  details: Array<{
    requirement: string;
    status: 'pass' | 'fail' | 'warning' | 'not_applicable';
    message: string;
  }>;
  overallScore: number;
}

/**
 * User training record (for compliance)
 */
export interface TrainingRecord {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  courseName: string;
  completedAt: Date;
  expiresAt?: Date;
  score?: number;
  passingScore?: number;
  certificateUrl?: string;
  status: 'completed' | 'expired' | 'in_progress';
}

// ============================================================================
// Access Control Types
// ============================================================================

/**
 * Permission
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  actions: string[];
}

/**
 * Role
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isBuiltIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Role assignment
 */
export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  scope?: {
    type: 'organization' | 'project' | 'resource';
    id: string;
  };
  assignedAt: Date;
  assignedBy: string;
  expiresAt?: Date;
}

// ============================================================================
// Organization Types
// ============================================================================

/**
 * Organization
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization settings
 */
export interface OrganizationSettings {
  sso: {
    enabled: boolean;
    required: boolean;
    providers: string[];
  };
  security: {
    mfaRequired: boolean;
    sessionTimeout: number; // minutes
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      maxAge: number; // days
    };
  };
  compliance: {
    cfr21Part11Enabled: boolean;
    auditLogRetention: number; // days
    dataRetention: number; // days
    exportApprovalRequired: boolean;
  };
  features: {
    apiAccess: boolean;
    customIntegrations: boolean;
    advancedAnalytics: boolean;
  };
}

// ============================================================================
// Service Input/Output Types
// ============================================================================

export interface CreateSSOProviderInput {
  name: string;
  type: SSOProviderType;
  config: SAMLConfig | OIDCConfig;
}

export interface LogAuditEventInput {
  category: AuditEventCategory;
  severity: AuditEventSeverity;
  action: string;
  actor: AuditEvent['actor'];
  resource: AuditEvent['resource'];
  details: Record<string, unknown>;
  outcome: 'success' | 'failure' | 'partial';
  errorMessage?: string;
}

export interface CreateSignatureInput {
  documentId: string;
  documentType: string;
  documentVersion: string;
  meaning: string;
  password: string;
}

export interface AssignRoleInput {
  userId: string;
  roleId: string;
  scope?: RoleAssignment['scope'];
  expiresAt?: Date;
}
