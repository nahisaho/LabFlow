/**
 * Lab Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LabService, DEFAULT_LAB_SETTINGS } from '../src/lab/lab-service.js';
import type { 
  Lab, 
  LabMember, 
  LabMemberWithUser, 
  LabWithStats,
  LabMemberRole 
} from '../src/lab/types.js';
import type { LabRepository } from '../src/lab/lab-service.js';

// Mock repository
function createMockRepository(): LabRepository {
  const labs = new Map<string, Lab>();
  const members = new Map<string, LabMember>();

  return {
    createLab: vi.fn(async (lab: Lab) => {
      labs.set(lab.id, lab);
      return lab;
    }),
    getLab: vi.fn(async (id: string) => labs.get(id) ?? null),
    updateLab: vi.fn(async (id: string, updates: Partial<Lab>) => {
      const lab = labs.get(id);
      if (!lab) return null;
      const updated = { ...lab, ...updates };
      labs.set(id, updated);
      return updated;
    }),
    deleteLab: vi.fn(async (id: string) => {
      return labs.delete(id);
    }),
    listLabsForUser: vi.fn(async (): Promise<LabWithStats[]> => {
      return Array.from(labs.values()).map((lab) => ({
        ...lab,
        memberCount: 1,
        datasetCount: 0,
        experimentCount: 0,
      }));
    }),
    addMember: vi.fn(async (member: LabMember) => {
      const key = `${member.labId}:${member.userId}`;
      members.set(key, member);
      return member;
    }),
    getMember: vi.fn(async (labId: string, userId: string) => {
      return members.get(`${labId}:${userId}`) ?? null;
    }),
    updateMemberRole: vi.fn(async (labId: string, userId: string, role: LabMemberRole) => {
      const key = `${labId}:${userId}`;
      const member = members.get(key);
      if (!member) return null;
      const updated = { ...member, role, updatedAt: new Date() };
      members.set(key, updated);
      return updated;
    }),
    removeMember: vi.fn(async (labId: string, userId: string) => {
      return members.delete(`${labId}:${userId}`);
    }),
    listMembers: vi.fn(async (): Promise<LabMemberWithUser[]> => {
      return Array.from(members.values()).map((member) => ({
        ...member,
        user: {
          id: member.userId,
          name: 'Test User',
          email: 'test@example.com',
          image: null,
        },
      }));
    }),
    createInvitation: vi.fn(async (invitation) => ({
      id: invitation.id,
      token: invitation.token,
    })),
    getInvitationByToken: vi.fn(async () => null),
    acceptInvitation: vi.fn(async () => null),
    deleteInvitation: vi.fn(async () => true),
    listPendingInvitations: vi.fn(async () => []),
  };
}

describe('LabService', () => {
  let service: LabService;
  let repository: LabRepository;

  beforeEach(() => {
    repository = createMockRepository();
    service = new LabService(repository);
  });

  describe('createLab', () => {
    it('should create a lab with default settings', async () => {
      const userId = 'user-1';
      const input = {
        name: 'Test Lab',
        description: 'A test laboratory',
      };

      const lab = await service.createLab(input, userId);

      expect(lab).toBeDefined();
      expect(lab.name).toBe('Test Lab');
      expect(lab.description).toBe('A test laboratory');
      expect(lab.settings).toEqual(DEFAULT_LAB_SETTINGS);
      expect(lab.createdById).toBe(userId);
      expect(repository.createLab).toHaveBeenCalled();
      expect(repository.addMember).toHaveBeenCalled();
    });

    it('should create a lab with custom settings', async () => {
      const userId = 'user-1';
      const input = {
        name: 'Custom Lab',
        settings: {
          maxStorageGb: 500,
          enableGraphRAG: false,
        },
      };

      const lab = await service.createLab(input, userId);

      expect(lab.settings.maxStorageGb).toBe(500);
      expect(lab.settings.enableGraphRAG).toBe(false);
      expect(lab.settings.allowDatasetExport).toBe(DEFAULT_LAB_SETTINGS.allowDatasetExport);
    });

    it('should add creator as owner', async () => {
      const userId = 'user-1';
      const lab = await service.createLab({ name: 'Test Lab' }, userId);

      expect(repository.addMember).toHaveBeenCalledWith(
        expect.objectContaining({
          labId: lab.id,
          userId,
          role: 'owner',
        })
      );
    });
  });

  describe('getLab', () => {
    it('should return lab when user is a member', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      const lab = await service.getLab(createdLab.id, userId);

      expect(lab).toBeDefined();
      expect(lab?.id).toBe(createdLab.id);
    });

    it('should return null when user is not a member', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      const lab = await service.getLab(createdLab.id, 'other-user');

      expect(lab).toBeNull();
    });
  });

  describe('updateLab', () => {
    it('should update lab when user has admin access', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      const updated = await service.updateLab(
        createdLab.id,
        { name: 'Updated Lab' },
        userId
      );

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Lab');
    });

    it('should throw when user lacks permission', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      // Add another user as viewer
      await repository.addMember({
        id: 'member-2',
        labId: createdLab.id,
        userId: 'user-2',
        role: 'viewer',
        invitedById: userId,
        joinedAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.updateLab(createdLab.id, { name: 'Updated' }, 'user-2')
      ).rejects.toThrow('Requires admin role or higher');
    });
  });

  describe('deleteLab', () => {
    it('should delete lab when user is owner', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      const result = await service.deleteLab(createdLab.id, userId);

      expect(result).toBe(true);
      expect(repository.deleteLab).toHaveBeenCalledWith(createdLab.id);
    });

    it('should throw when user is not owner', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      // Add another user as admin
      await repository.addMember({
        id: 'member-2',
        labId: createdLab.id,
        userId: 'user-2',
        role: 'admin',
        invitedById: userId,
        joinedAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.deleteLab(createdLab.id, 'user-2')
      ).rejects.toThrow('Requires owner role or higher');
    });
  });

  describe('inviteMember', () => {
    it('should create invitation when user has admin access', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      const result = await service.inviteMember(
        {
          labId: createdLab.id,
          email: 'new@example.com',
          role: 'member',
        },
        userId
      );

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(repository.createInvitation).toHaveBeenCalled();
    });

    it('should not allow inviting as owner', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      await expect(
        service.inviteMember(
          {
            labId: createdLab.id,
            email: 'new@example.com',
            role: 'owner',
          },
          userId
        )
      ).rejects.toThrow('Cannot invite as owner');
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role when owner', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      // Add another member
      await repository.addMember({
        id: 'member-2',
        labId: createdLab.id,
        userId: 'user-2',
        role: 'member',
        invitedById: userId,
        joinedAt: new Date(),
        updatedAt: new Date(),
      });

      const updated = await service.updateMemberRole(
        createdLab.id,
        'user-2',
        'admin',
        userId
      );

      expect(updated?.role).toBe('admin');
    });

    it('should not allow changing to owner role', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      // Add another member
      await repository.addMember({
        id: 'member-2',
        labId: createdLab.id,
        userId: 'user-2',
        role: 'member',
        invitedById: userId,
        joinedAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.updateMemberRole(createdLab.id, 'user-2', 'owner', userId)
      ).rejects.toThrow('Cannot change role to owner');
    });
  });

  describe('removeMember', () => {
    it('should allow member to leave', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      // Add another member
      await repository.addMember({
        id: 'member-2',
        labId: createdLab.id,
        userId: 'user-2',
        role: 'member',
        invitedById: userId,
        joinedAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.removeMember(createdLab.id, 'user-2', 'user-2');

      expect(result).toBe(true);
    });

    it('should not allow owner to leave', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      await expect(
        service.removeMember(createdLab.id, userId, userId)
      ).rejects.toThrow('Owner cannot leave the lab');
    });
  });

  describe('checkPermission', () => {
    it('should return allowed for sufficient role', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      const result = await service.checkPermission(createdLab.id, userId, 'admin');

      expect(result.allowed).toBe(true);
    });

    it('should return not allowed for insufficient role', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      // Add viewer
      await repository.addMember({
        id: 'member-2',
        labId: createdLab.id,
        userId: 'user-2',
        role: 'viewer',
        invitedById: userId,
        joinedAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.checkPermission(createdLab.id, 'user-2', 'admin');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Requires admin role');
    });

    it('should return not allowed for non-member', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      const result = await service.checkPermission(createdLab.id, 'unknown-user', 'viewer');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Not a member');
    });
  });

  describe('getUserRole', () => {
    it('should return role for member', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      const role = await service.getUserRole(createdLab.id, userId);

      expect(role).toBe('owner');
    });

    it('should return null for non-member', async () => {
      const userId = 'user-1';
      const createdLab = await service.createLab({ name: 'Test Lab' }, userId);

      const role = await service.getUserRole(createdLab.id, 'unknown-user');

      expect(role).toBeNull();
    });
  });
});
