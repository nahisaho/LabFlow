/**
 * Lab Service
 *
 * Requirements:
 * - LAB-CORE-001: Team collaboration
 * - LAB-CORE-002: Data sharing
 * - LAB-MEM-001: Member management
 * - LAB-INV-001: Invitation system
 */

import { randomUUID } from 'crypto';
import type {
  Lab,
  LabSettings,
  LabMember,
  LabMemberRole,
  LabMemberWithUser,
  LabWithStats,
  CreateLabInput,
  UpdateLabInput,
  InviteMemberInput,
  ListLabsOptions,
  PermissionCheck,
} from './types.js';

/**
 * Default lab settings
 */
export const DEFAULT_LAB_SETTINGS: LabSettings = {
  allowDatasetExport: true,
  requireApprovalForPublic: true,
  defaultVisibility: 'lab',
  maxStorageGb: 100,
  enableGraphRAG: true,
};

/**
 * Lab repository interface
 */
export interface LabRepository {
  // Lab operations
  createLab(lab: Lab): Promise<Lab>;
  getLab(id: string): Promise<Lab | null>;
  updateLab(id: string, lab: Partial<Lab>): Promise<Lab | null>;
  deleteLab(id: string): Promise<boolean>;
  listLabsForUser(options: ListLabsOptions): Promise<LabWithStats[]>;
  
  // Member operations
  addMember(member: LabMember): Promise<LabMember>;
  getMember(labId: string, userId: string): Promise<LabMember | null>;
  updateMemberRole(labId: string, userId: string, role: LabMemberRole): Promise<LabMember | null>;
  removeMember(labId: string, userId: string): Promise<boolean>;
  listMembers(labId: string): Promise<LabMemberWithUser[]>;
  
  // Invitation operations
  createInvitation(invitation: {
    id: string;
    labId: string;
    email: string;
    role: LabMemberRole;
    token: string;
    invitedById: string;
    expiresAt: Date;
  }): Promise<{ id: string; token: string }>;
  getInvitationByToken(token: string): Promise<{
    id: string;
    labId: string;
    email: string;
    role: LabMemberRole;
    invitedById: string;
    expiresAt: Date;
    acceptedAt: Date | null;
  } | null>;
  acceptInvitation(token: string, userId: string): Promise<LabMember | null>;
  deleteInvitation(id: string): Promise<boolean>;
  listPendingInvitations(labId: string): Promise<Array<{
    id: string;
    email: string;
    role: LabMemberRole;
    expiresAt: Date;
  }>>;
}

/**
 * Role permission levels (higher = more permissions)
 */
const ROLE_LEVELS: Record<LabMemberRole, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

/**
 * Lab service for managing research labs
 */
export class LabService {
  constructor(private readonly repository: LabRepository) {}

  /**
   * Create a new lab
   */
  async createLab(input: CreateLabInput, userId: string): Promise<Lab> {
    const now = new Date();
    const lab: Lab = {
      id: randomUUID(),
      name: input.name,
      description: input.description ?? null,
      iconUrl: input.iconUrl ?? null,
      settings: {
        ...DEFAULT_LAB_SETTINGS,
        ...input.settings,
      },
      createdById: userId,
      createdAt: now,
      updatedAt: now,
    };

    // Create the lab
    const createdLab = await this.repository.createLab(lab);

    // Add creator as owner
    await this.repository.addMember({
      id: randomUUID(),
      labId: createdLab.id,
      userId,
      role: 'owner',
      invitedById: null,
      joinedAt: now,
      updatedAt: now,
    });

    return createdLab;
  }

  /**
   * Get a lab by ID
   */
  async getLab(id: string, userId: string): Promise<Lab | null> {
    // Check if user has access
    const hasAccess = await this.checkPermission(id, userId, 'viewer');
    if (!hasAccess.allowed) {
      return null;
    }

    return this.repository.getLab(id);
  }

  /**
   * Update a lab
   */
  async updateLab(id: string, input: UpdateLabInput, userId: string): Promise<Lab | null> {
    // Check if user has admin access
    const hasAccess = await this.checkPermission(id, userId, 'admin');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    const updates: Partial<Lab> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.iconUrl !== undefined) updates.iconUrl = input.iconUrl;
    if (input.settings !== undefined) {
      const existingLab = await this.repository.getLab(id);
      if (existingLab) {
        updates.settings = {
          ...existingLab.settings,
          ...input.settings,
        };
      }
    }

    return this.repository.updateLab(id, updates);
  }

  /**
   * Delete a lab (owner only)
   */
  async deleteLab(id: string, userId: string): Promise<boolean> {
    const hasAccess = await this.checkPermission(id, userId, 'owner');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    return this.repository.deleteLab(id);
  }

  /**
   * List labs for a user
   */
  async listLabs(options: ListLabsOptions): Promise<LabWithStats[]> {
    return this.repository.listLabsForUser(options);
  }

  /**
   * Invite a member to a lab
   */
  async inviteMember(input: InviteMemberInput, inviterId: string): Promise<{ token: string }> {
    // Check if inviter has admin access
    const hasAccess = await this.checkPermission(input.labId, inviterId, 'admin');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    // Can't invite as owner
    if (input.role === 'owner') {
      throw new Error('Cannot invite as owner');
    }

    // Check inviter's role - can only invite with same or lower role
    const inviterMember = await this.repository.getMember(input.labId, inviterId);
    if (inviterMember && ROLE_LEVELS[input.role] > ROLE_LEVELS[inviterMember.role]) {
      throw new Error('Cannot invite with higher role than your own');
    }

    // Generate invitation token
    const token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    await this.repository.createInvitation({
      id: randomUUID(),
      labId: input.labId,
      email: input.email,
      role: input.role,
      token,
      invitedById: inviterId,
      expiresAt,
    });

    return { token };
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(token: string, userId: string, userEmail: string): Promise<LabMember | null> {
    const invitation = await this.repository.getInvitationByToken(token);
    
    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    if (invitation.acceptedAt) {
      throw new Error('Invitation already accepted');
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error('Invitation expired');
    }

    // Check if email matches
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new Error('Invitation email does not match');
    }

    // Check if user is already a member
    const existingMember = await this.repository.getMember(invitation.labId, userId);
    if (existingMember) {
      throw new Error('Already a member of this lab');
    }

    return this.repository.acceptInvitation(token, userId);
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    labId: string,
    targetUserId: string,
    newRole: LabMemberRole,
    requesterId: string
  ): Promise<LabMember | null> {
    // Can't change to owner role
    if (newRole === 'owner') {
      throw new Error('Cannot change role to owner');
    }

    // Check if requester has admin access
    const hasAccess = await this.checkPermission(labId, requesterId, 'admin');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    // Get requester's member record
    const requesterMember = await this.repository.getMember(labId, requesterId);
    if (!requesterMember) {
      throw new Error('Requester not a member');
    }

    // Get target member
    const targetMember = await this.repository.getMember(labId, targetUserId);
    if (!targetMember) {
      throw new Error('Target user is not a member');
    }

    // Can't change owner's role
    if (targetMember.role === 'owner') {
      throw new Error('Cannot change owner role');
    }

    // Can't promote above own role (except owner)
    if (
      requesterMember.role !== 'owner' &&
      ROLE_LEVELS[newRole] >= ROLE_LEVELS[requesterMember.role]
    ) {
      throw new Error('Cannot assign role equal to or higher than your own');
    }

    return this.repository.updateMemberRole(labId, targetUserId, newRole);
  }

  /**
   * Remove a member from a lab
   */
  async removeMember(labId: string, targetUserId: string, requesterId: string): Promise<boolean> {
    // Can remove yourself
    if (targetUserId === requesterId) {
      const member = await this.repository.getMember(labId, targetUserId);
      if (member?.role === 'owner') {
        throw new Error('Owner cannot leave the lab. Transfer ownership first.');
      }
      return this.repository.removeMember(labId, targetUserId);
    }

    // Check if requester has admin access
    const hasAccess = await this.checkPermission(labId, requesterId, 'admin');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    // Get requester's and target's member records
    const [requesterMember, targetMember] = await Promise.all([
      this.repository.getMember(labId, requesterId),
      this.repository.getMember(labId, targetUserId),
    ]);

    if (!targetMember) {
      throw new Error('Target user is not a member');
    }

    // Can't remove owner
    if (targetMember.role === 'owner') {
      throw new Error('Cannot remove owner');
    }

    // Can't remove someone with equal or higher role (except owner can remove anyone)
    if (
      requesterMember?.role !== 'owner' &&
      ROLE_LEVELS[targetMember.role] >= ROLE_LEVELS[requesterMember?.role || 'viewer']
    ) {
      throw new Error('Cannot remove member with equal or higher role');
    }

    return this.repository.removeMember(labId, targetUserId);
  }

  /**
   * List members of a lab
   */
  async listMembers(labId: string, userId: string): Promise<LabMemberWithUser[]> {
    const hasAccess = await this.checkPermission(labId, userId, 'viewer');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    return this.repository.listMembers(labId);
  }

  /**
   * List pending invitations
   */
  async listPendingInvitations(labId: string, userId: string) {
    const hasAccess = await this.checkPermission(labId, userId, 'admin');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    return this.repository.listPendingInvitations(labId);
  }

  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId: string, labId: string, userId: string): Promise<boolean> {
    const hasAccess = await this.checkPermission(labId, userId, 'admin');
    if (!hasAccess.allowed) {
      throw new Error(hasAccess.reason || 'Permission denied');
    }

    return this.repository.deleteInvitation(invitationId);
  }

  /**
   * Check if a user has permission for a specific action
   */
  async checkPermission(
    labId: string,
    userId: string,
    requiredRole: LabMemberRole
  ): Promise<PermissionCheck> {
    const member = await this.repository.getMember(labId, userId);

    if (!member) {
      return { allowed: false, reason: 'Not a member of this lab' };
    }

    const userLevel = ROLE_LEVELS[member.role];
    const requiredLevel = ROLE_LEVELS[requiredRole];

    if (userLevel < requiredLevel) {
      return {
        allowed: false,
        reason: `Requires ${requiredRole} role or higher`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get user's role in a lab
   */
  async getUserRole(labId: string, userId: string): Promise<LabMemberRole | null> {
    const member = await this.repository.getMember(labId, userId);
    return member?.role ?? null;
  }
}
