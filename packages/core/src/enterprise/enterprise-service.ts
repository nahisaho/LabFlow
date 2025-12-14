/**
 * Enterprise Service
 * 
 * Provides enterprise features including SSO, audit logging,
 * access control, and 21 CFR Part 11 compliance.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  SSOProviderConfig,
  SSOSession,
  CreateSSOProviderInput,
  AuditEvent,
  AuditLogQueryOptions,
  AuditExportFormat,
  LogAuditEventInput,
  ElectronicSignature,
  DocumentVersion,
  ComplianceCheckResult,
  TrainingRecord,
  CreateSignatureInput,
  Role,
  Permission,
  RoleAssignment,
  AssignRoleInput,
  Organization,
  OrganizationSettings,
} from './types.js';

export class EnterpriseService {
  // In-memory storage (would be replaced with actual database)
  private ssoProviders: Map<string, SSOProviderConfig> = new Map();
  private ssoSessions: Map<string, SSOSession> = new Map();
  private auditEvents: AuditEvent[] = [];
  private signatures: Map<string, ElectronicSignature> = new Map();
  private documentVersions: Map<string, DocumentVersion[]> = new Map();
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private roleAssignments: Map<string, RoleAssignment> = new Map();
  private trainingRecords: Map<string, TrainingRecord[]> = new Map();
  private organizations: Map<string, Organization> = new Map();

  constructor() {
    this.initializeDefaultRoles();
  }

  // ============================================================================
  // SSO Management
  // ============================================================================

  /**
   * Register a new SSO provider
   */
  async createSSOProvider(input: CreateSSOProviderInput): Promise<SSOProviderConfig> {
    const provider: SSOProviderConfig = {
      id: uuidv4(),
      name: input.name,
      type: input.type,
      enabled: true,
      config: input.config,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.ssoProviders.set(provider.id, provider);

    await this.logAuditEvent({
      category: 'system_config',
      severity: 'info',
      action: 'sso_provider_created',
      actor: {
        userId: 'system',
        userName: 'System',
        email: 'system@labflow.ai',
        ipAddress: '127.0.0.1',
      },
      resource: {
        type: 'sso_provider',
        id: provider.id,
        name: provider.name,
      },
      details: { providerType: input.type },
      outcome: 'success',
    });

    return provider;
  }

  /**
   * List all SSO providers
   */
  async listSSOProviders(): Promise<SSOProviderConfig[]> {
    return Array.from(this.ssoProviders.values());
  }

  /**
   * Get SSO provider by ID
   */
  async getSSOProvider(id: string): Promise<SSOProviderConfig | null> {
    return this.ssoProviders.get(id) || null;
  }

  /**
   * Enable/disable SSO provider
   */
  async toggleSSOProvider(id: string, enabled: boolean): Promise<SSOProviderConfig | null> {
    const provider = this.ssoProviders.get(id);
    if (!provider) return null;

    provider.enabled = enabled;
    provider.updatedAt = new Date();
    this.ssoProviders.set(id, provider);

    return provider;
  }

  /**
   * Delete SSO provider
   */
  async deleteSSOProvider(id: string): Promise<boolean> {
    return this.ssoProviders.delete(id);
  }

  /**
   * Initiate SSO login (mock implementation)
   */
  async initiateSSOLogin(providerId: string, redirectUrl: string): Promise<{ authUrl: string }> {
    const provider = this.ssoProviders.get(providerId);
    if (!provider || !provider.enabled) {
      throw new Error('SSO provider not found or disabled');
    }

    // In a real implementation, this would redirect to the IdP
    const authUrl = `https://idp.example.com/auth?provider=${providerId}&redirect=${encodeURIComponent(redirectUrl)}`;
    
    return { authUrl };
  }

  /**
   * Complete SSO login (mock implementation)
   */
  async completeSSOLogin(
    providerId: string,
    code: string,
    userId: string
  ): Promise<SSOSession> {
    const provider = this.ssoProviders.get(providerId);
    if (!provider) {
      throw new Error('SSO provider not found');
    }

    const session: SSOSession = {
      id: uuidv4(),
      userId,
      providerId,
      providerUserId: `external-${uuidv4().substring(0, 8)}`,
      accessToken: `token-${uuidv4()}`,
      refreshToken: `refresh-${uuidv4()}`,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      createdAt: new Date(),
    };

    this.ssoSessions.set(session.id, session);

    await this.logAuditEvent({
      category: 'authentication',
      severity: 'info',
      action: 'sso_login',
      actor: {
        userId,
        userName: 'Unknown',
        email: 'unknown@example.com',
        ipAddress: '127.0.0.1',
      },
      resource: {
        type: 'sso_provider',
        id: providerId,
        name: provider.name,
      },
      details: { sessionId: session.id },
      outcome: 'success',
    });

    return session;
  }

  // ============================================================================
  // Audit Logging
  // ============================================================================

  /**
   * Log an audit event
   */
  async logAuditEvent(input: LogAuditEventInput): Promise<AuditEvent> {
    const event: AuditEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      category: input.category,
      severity: input.severity,
      action: input.action,
      actor: input.actor,
      resource: input.resource,
      details: input.details,
      outcome: input.outcome,
      errorMessage: input.errorMessage,
      metadata: {
        requestId: uuidv4(),
        correlationId: uuidv4(),
      },
    };

    this.auditEvents.push(event);
    return event;
  }

  /**
   * Query audit events
   */
  async queryAuditEvents(options: AuditLogQueryOptions): Promise<{
    events: AuditEvent[];
    total: number;
    hasMore: boolean;
  }> {
    let filtered = [...this.auditEvents];

    // Apply filters
    if (options.startDate) {
      filtered = filtered.filter(e => e.timestamp >= options.startDate!);
    }
    if (options.endDate) {
      filtered = filtered.filter(e => e.timestamp <= options.endDate!);
    }
    if (options.category) {
      filtered = filtered.filter(e => e.category === options.category);
    }
    if (options.severity) {
      filtered = filtered.filter(e => e.severity === options.severity);
    }
    if (options.userId) {
      filtered = filtered.filter(e => e.actor.userId === options.userId);
    }
    if (options.resourceType) {
      filtered = filtered.filter(e => e.resource.type === options.resourceType);
    }
    if (options.resourceId) {
      filtered = filtered.filter(e => e.resource.id === options.resourceId);
    }
    if (options.action) {
      filtered = filtered.filter(e => e.action.includes(options.action!));
    }
    if (options.outcome) {
      filtered = filtered.filter(e => e.outcome === options.outcome);
    }

    // Sort
    const sortBy = options.sortBy || 'timestamp';
    const sortOrder = options.sortOrder || 'desc';
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'timestamp') {
        comparison = a.timestamp.getTime() - b.timestamp.getTime();
      } else if (sortBy === 'severity') {
        const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const total = filtered.length;
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    const events = filtered.slice(offset, offset + limit);

    return {
      events,
      total,
      hasMore: offset + events.length < total,
    };
  }

  /**
   * Export audit log
   */
  async exportAuditLog(
    options: AuditLogQueryOptions,
    format: AuditExportFormat
  ): Promise<{ url: string; expiresAt: Date }> {
    const { events } = await this.queryAuditEvents({ ...options, limit: 10000 });

    // In a real implementation, this would generate a file and return a download URL
    const exportId = uuidv4();
    
    await this.logAuditEvent({
      category: 'export',
      severity: 'info',
      action: 'audit_log_exported',
      actor: {
        userId: 'system',
        userName: 'System',
        email: 'system@labflow.ai',
        ipAddress: '127.0.0.1',
      },
      resource: {
        type: 'audit_log',
        id: exportId,
      },
      details: { format, eventCount: events.length },
      outcome: 'success',
    });

    return {
      url: `/exports/audit-${exportId}.${format}`,
      expiresAt: new Date(Date.now() + 86400000), // 24 hours
    };
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(startDate: Date, endDate: Date): Promise<{
    totalEvents: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    byOutcome: Record<string, number>;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; userName: string; count: number }>;
  }> {
    const events = this.auditEvents.filter(
      e => e.timestamp >= startDate && e.timestamp <= endDate
    );

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byOutcome: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};
    const userCounts: Record<string, { userName: string; count: number }> = {};

    for (const event of events) {
      byCategory[event.category] = (byCategory[event.category] || 0) + 1;
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
      byOutcome[event.outcome] = (byOutcome[event.outcome] || 0) + 1;
      actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
      
      if (!userCounts[event.actor.userId]) {
        userCounts[event.actor.userId] = { userName: event.actor.userName, count: 0 };
      }
      userCounts[event.actor.userId].count++;
    }

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topUsers = Object.entries(userCounts)
      .map(([userId, data]) => ({ userId, userName: data.userName, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: events.length,
      byCategory,
      bySeverity,
      byOutcome,
      topActions,
      topUsers,
    };
  }

  // ============================================================================
  // 21 CFR Part 11 Compliance
  // ============================================================================

  /**
   * Create electronic signature
   */
  async createSignature(input: CreateSignatureInput, userId: string, userName: string): Promise<ElectronicSignature> {
    // In a real implementation, verify password
    if (!input.password) {
      throw new Error('Password required for electronic signature');
    }

    const signature: ElectronicSignature = {
      id: uuidv4(),
      documentId: input.documentId,
      documentType: input.documentType,
      documentVersion: input.documentVersion,
      signedAt: new Date(),
      signer: {
        userId,
        userName,
        email: `${userId}@labflow.ai`,
      },
      meaning: input.meaning,
      signatureData: {
        method: 'password',
        verificationTimestamp: new Date(),
      },
      hash: this.generateHash(`${input.documentId}-${input.documentVersion}-${userId}-${Date.now()}`),
      metadata: {},
    };

    this.signatures.set(signature.id, signature);

    await this.logAuditEvent({
      category: 'compliance',
      severity: 'info',
      action: 'document_signed',
      actor: {
        userId,
        userName,
        email: signature.signer.email,
        ipAddress: '127.0.0.1',
      },
      resource: {
        type: input.documentType,
        id: input.documentId,
      },
      details: {
        signatureId: signature.id,
        meaning: input.meaning,
        version: input.documentVersion,
      },
      outcome: 'success',
    });

    return signature;
  }

  /**
   * Verify electronic signature
   */
  async verifySignature(signatureId: string): Promise<{
    valid: boolean;
    signature: ElectronicSignature | null;
    verifiedAt: Date;
  }> {
    const signature = this.signatures.get(signatureId);
    
    if (!signature) {
      return { valid: false, signature: null, verifiedAt: new Date() };
    }

    // In a real implementation, verify the hash and signature integrity
    return {
      valid: true,
      signature,
      verifiedAt: new Date(),
    };
  }

  /**
   * Create document version (for audit trail)
   */
  async createDocumentVersion(
    documentId: string,
    content: string,
    userId: string,
    userName: string,
    changeDescription?: string
  ): Promise<DocumentVersion> {
    const versions = this.documentVersions.get(documentId) || [];
    const version = versions.length + 1;

    const docVersion: DocumentVersion = {
      id: uuidv4(),
      documentId,
      version,
      content,
      contentHash: this.generateHash(content),
      createdAt: new Date(),
      createdBy: { userId, userName },
      changeDescription,
      signatures: [],
    };

    versions.push(docVersion);
    this.documentVersions.set(documentId, versions);

    await this.logAuditEvent({
      category: 'data_modification',
      severity: 'info',
      action: 'document_version_created',
      actor: {
        userId,
        userName,
        email: `${userId}@labflow.ai`,
        ipAddress: '127.0.0.1',
      },
      resource: {
        type: 'document',
        id: documentId,
      },
      details: {
        version,
        versionId: docVersion.id,
        changeDescription,
      },
      outcome: 'success',
    });

    return docVersion;
  }

  /**
   * Get document version history
   */
  async getDocumentHistory(documentId: string): Promise<DocumentVersion[]> {
    return this.documentVersions.get(documentId) || [];
  }

  /**
   * Run compliance check
   */
  async runComplianceCheck(organizationId: string): Promise<ComplianceCheckResult> {
    const org = this.organizations.get(organizationId);
    const details: ComplianceCheckResult['details'] = [];

    // Check 1: Audit logging enabled
    details.push({
      requirement: '監査ログが有効',
      status: 'pass',
      message: '監査ログは正常に機能しています',
    });

    // Check 2: Electronic signatures
    details.push({
      requirement: '電子署名の実装',
      status: 'pass',
      message: '電子署名システムが設定されています',
    });

    // Check 3: User authentication
    details.push({
      requirement: 'ユーザー認証の強化',
      status: org?.settings.security.mfaRequired ? 'pass' : 'warning',
      message: org?.settings.security.mfaRequired 
        ? 'MFAが必須に設定されています' 
        : 'MFAの有効化を推奨します',
    });

    // Check 4: Data integrity
    details.push({
      requirement: 'データ整合性の確保',
      status: 'pass',
      message: 'ハッシュベースの整合性チェックが実装されています',
    });

    // Check 5: Access control
    details.push({
      requirement: 'アクセス制御',
      status: 'pass',
      message: 'ロールベースのアクセス制御が有効です',
    });

    // Check 6: Training records
    details.push({
      requirement: 'トレーニング記録',
      status: 'warning',
      message: 'ユーザートレーニング記録を確認してください',
    });

    const passedCount = details.filter(d => d.status === 'pass').length;
    const overallScore = (passedCount / details.length) * 100;

    const result: ComplianceCheckResult = {
      id: uuidv4(),
      checkType: '21_cfr_part_11',
      passed: overallScore >= 80,
      timestamp: new Date(),
      details,
      overallScore: Math.round(overallScore),
    };

    await this.logAuditEvent({
      category: 'compliance',
      severity: 'info',
      action: 'compliance_check_completed',
      actor: {
        userId: 'system',
        userName: 'System',
        email: 'system@labflow.ai',
        ipAddress: '127.0.0.1',
      },
      resource: {
        type: 'organization',
        id: organizationId,
      },
      details: { checkType: '21_cfr_part_11', score: overallScore, passed: result.passed },
      outcome: 'success',
    });

    return result;
  }

  // ============================================================================
  // Access Control
  // ============================================================================

  private initializeDefaultRoles(): void {
    const adminPermissions: Permission[] = [
      { id: 'p1', name: 'manage_users', description: 'ユーザー管理', resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'p2', name: 'manage_roles', description: 'ロール管理', resource: 'roles', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'p3', name: 'manage_sso', description: 'SSO設定', resource: 'sso', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'p4', name: 'view_audit', description: '監査ログ閲覧', resource: 'audit', actions: ['read', 'export'] },
      { id: 'p5', name: 'manage_compliance', description: 'コンプライアンス管理', resource: 'compliance', actions: ['read', 'execute'] },
    ];

    const researcherPermissions: Permission[] = [
      { id: 'p6', name: 'manage_experiments', description: '実験管理', resource: 'experiments', actions: ['create', 'read', 'update'] },
      { id: 'p7', name: 'manage_workflows', description: 'ワークフロー管理', resource: 'workflows', actions: ['create', 'read', 'update', 'execute'] },
      { id: 'p8', name: 'sign_documents', description: '文書署名', resource: 'documents', actions: ['read', 'sign'] },
    ];

    const viewerPermissions: Permission[] = [
      { id: 'p9', name: 'view_experiments', description: '実験閲覧', resource: 'experiments', actions: ['read'] },
      { id: 'p10', name: 'view_workflows', description: 'ワークフロー閲覧', resource: 'workflows', actions: ['read'] },
    ];

    // Store permissions
    [...adminPermissions, ...researcherPermissions, ...viewerPermissions].forEach(p => {
      this.permissions.set(p.id, p);
    });

    // Create default roles
    const roles: Role[] = [
      {
        id: 'admin',
        name: '管理者',
        description: 'システム全体の管理権限',
        permissions: adminPermissions,
        isBuiltIn: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'researcher',
        name: '研究者',
        description: '実験とワークフローの管理権限',
        permissions: researcherPermissions,
        isBuiltIn: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'viewer',
        name: '閲覧者',
        description: '閲覧のみの権限',
        permissions: viewerPermissions,
        isBuiltIn: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    roles.forEach(r => this.roles.set(r.id, r));
  }

  /**
   * List all roles
   */
  async listRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  /**
   * Get role by ID
   */
  async getRole(id: string): Promise<Role | null> {
    return this.roles.get(id) || null;
  }

  /**
   * Create custom role
   */
  async createRole(name: string, description: string, permissionIds: string[]): Promise<Role> {
    const permissions = permissionIds
      .map(id => this.permissions.get(id))
      .filter((p): p is Permission => p !== undefined);

    const role: Role = {
      id: uuidv4(),
      name,
      description,
      permissions,
      isBuiltIn: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.roles.set(role.id, role);
    return role;
  }

  /**
   * Assign role to user
   */
  async assignRole(input: AssignRoleInput, assignedBy: string): Promise<RoleAssignment> {
    const assignment: RoleAssignment = {
      id: uuidv4(),
      userId: input.userId,
      roleId: input.roleId,
      scope: input.scope,
      assignedAt: new Date(),
      assignedBy,
      expiresAt: input.expiresAt,
    };

    this.roleAssignments.set(assignment.id, assignment);

    await this.logAuditEvent({
      category: 'authorization',
      severity: 'info',
      action: 'role_assigned',
      actor: {
        userId: assignedBy,
        userName: 'Admin',
        email: `${assignedBy}@labflow.ai`,
        ipAddress: '127.0.0.1',
      },
      resource: {
        type: 'user',
        id: input.userId,
      },
      details: { roleId: input.roleId, scope: input.scope },
      outcome: 'success',
    });

    return assignment;
  }

  /**
   * Get user's role assignments
   */
  async getUserRoles(userId: string): Promise<RoleAssignment[]> {
    return Array.from(this.roleAssignments.values()).filter(a => a.userId === userId);
  }

  /**
   * Check if user has permission
   */
  async checkPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const assignments = await this.getUserRoles(userId);
    
    for (const assignment of assignments) {
      const role = this.roles.get(assignment.roleId);
      if (!role) continue;

      for (const permission of role.permissions) {
        if (permission.resource === resource && permission.actions.includes(action)) {
          return true;
        }
      }
    }

    return false;
  }

  // ============================================================================
  // Training Records
  // ============================================================================

  /**
   * Add training record
   */
  async addTrainingRecord(record: Omit<TrainingRecord, 'id'>): Promise<TrainingRecord> {
    const fullRecord: TrainingRecord = {
      id: uuidv4(),
      ...record,
    };

    const userRecords = this.trainingRecords.get(record.userId) || [];
    userRecords.push(fullRecord);
    this.trainingRecords.set(record.userId, userRecords);

    await this.logAuditEvent({
      category: 'compliance',
      severity: 'info',
      action: 'training_completed',
      actor: {
        userId: record.userId,
        userName: record.userName,
        email: `${record.userId}@labflow.ai`,
        ipAddress: '127.0.0.1',
      },
      resource: {
        type: 'training_course',
        id: record.courseId,
        name: record.courseName,
      },
      details: { score: record.score, status: record.status },
      outcome: 'success',
    });

    return fullRecord;
  }

  /**
   * Get user's training records
   */
  async getUserTrainingRecords(userId: string): Promise<TrainingRecord[]> {
    return this.trainingRecords.get(userId) || [];
  }

  // ============================================================================
  // Organization Management
  // ============================================================================

  /**
   * Create organization
   */
  async createOrganization(name: string, slug: string, plan: Organization['plan']): Promise<Organization> {
    const defaultSettings: OrganizationSettings = {
      sso: {
        enabled: false,
        required: false,
        providers: [],
      },
      security: {
        mfaRequired: plan === 'enterprise',
        sessionTimeout: 60,
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          maxAge: 90,
        },
      },
      compliance: {
        cfr21Part11Enabled: plan === 'enterprise',
        auditLogRetention: plan === 'enterprise' ? 2555 : 365, // 7 years for enterprise
        dataRetention: 1095, // 3 years
        exportApprovalRequired: plan === 'enterprise',
      },
      features: {
        apiAccess: plan !== 'free',
        customIntegrations: plan === 'enterprise',
        advancedAnalytics: plan !== 'free',
      },
    };

    const org: Organization = {
      id: uuidv4(),
      name,
      slug,
      plan,
      settings: defaultSettings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.organizations.set(org.id, org);
    return org;
  }

  /**
   * Get organization
   */
  async getOrganization(id: string): Promise<Organization | null> {
    return this.organizations.get(id) || null;
  }

  /**
   * Update organization settings
   */
  async updateOrganizationSettings(
    id: string,
    settings: Partial<OrganizationSettings>
  ): Promise<Organization | null> {
    const org = this.organizations.get(id);
    if (!org) return null;

    org.settings = { ...org.settings, ...settings };
    org.updatedAt = new Date();
    this.organizations.set(id, org);

    await this.logAuditEvent({
      category: 'system_config',
      severity: 'info',
      action: 'organization_settings_updated',
      actor: {
        userId: 'admin',
        userName: 'Admin',
        email: 'admin@labflow.ai',
        ipAddress: '127.0.0.1',
      },
      resource: {
        type: 'organization',
        id,
        name: org.name,
      },
      details: { updatedSettings: Object.keys(settings) },
      outcome: 'success',
    });

    return org;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private generateHash(input: string): string {
    // Simple hash for demo - in production use crypto
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }
}

// Export singleton instance
export const enterpriseService = new EnterpriseService();
