import { Team, User } from '../types';
import { storageService } from './storageService';
import { generateId } from '../utils/idUtils';
import { activityService } from './activityService';

export interface CreateTeamPayload {
  name: string;
  description?: string;
  department?: string;
  leadId?: string;
  leadName?: string;
  memberIds?: string[];
  color?: string;
}

export interface TeamOperationResult {
  success: boolean;
  message: string;
  team?: Team;
}

class TeamService {
  public async createTeam(
    payload: CreateTeamPayload,
    actor: User | null
  ): Promise<TeamOperationResult> {
    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
      return { success: false, message: 'Unauthorized: Only Admins or Managers can create teams.' };
    }

    const cleanName = (payload.name || '').trim();
    if (!cleanName) {
      return { success: false, message: 'Team name is required.' };
    }

    const existing = storageService.getTeams();
    if (existing.some((t) => t.name.toLowerCase() === cleanName.toLowerCase())) {
      return { success: false, message: `A team named "${cleanName}" already exists.` };
    }

    const now = new Date().toISOString();
    const newTeam: Team = {
      id: generateId('team'),
      name: cleanName,
      description: payload.description?.trim() || '',
      department: payload.department?.trim() || 'General Operations',
      leadId: payload.leadId || undefined,
      leadName: payload.leadName || undefined,
      memberIds: Array.isArray(payload.memberIds) ? Array.from(new Set(payload.memberIds)) : [],
      color: payload.color || 'blue',
      createdAt: now,
      updatedAt: now,
    };

    await storageService.saveTeam(newTeam);

    // Audit log
    await activityService.recordActivity({
      taskId: 'SYSTEM',
      taskTitle: 'Team Management',
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: 'TEAM_CREATED',
      newValue: `Created team "${newTeam.name}" with ${newTeam.memberIds.length} members`,
    });

    return {
      success: true,
      message: `Team "${newTeam.name}" created successfully.`,
      team: newTeam,
    };
  }

  public async updateTeam(
    id: string,
    updates: Partial<Team>,
    actor: User | null
  ): Promise<TeamOperationResult> {
    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
      return { success: false, message: 'Unauthorized: Only Admins or Managers can update teams.' };
    }

    const teams = storageService.getTeams();
    const existing = teams.find((t) => t.id === id);
    if (!existing) {
      return { success: false, message: 'Team not found.' };
    }

    if (updates.name && updates.name.trim()) {
      const cleanName = updates.name.trim();
      const duplicate = teams.find(
        (t) => t.id !== id && t.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (duplicate) {
        return { success: false, message: `Another team named "${cleanName}" already exists.` };
      }
      existing.name = cleanName;
    }

    if (updates.description !== undefined) {
      existing.description = updates.description.trim();
    }
    if (updates.department !== undefined) {
      existing.department = updates.department.trim();
    }
    if (updates.leadId !== undefined) {
      existing.leadId = updates.leadId;
      existing.leadName = updates.leadName;
    }
    if (updates.memberIds !== undefined) {
      existing.memberIds = Array.from(new Set(updates.memberIds));
    }
    if (updates.color !== undefined) {
      existing.color = updates.color;
    }

    existing.updatedAt = new Date().toISOString();
    await storageService.saveTeam(existing);

    await activityService.recordActivity({
      taskId: 'SYSTEM',
      taskTitle: 'Team Management',
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: 'TEAM_UPDATED',
      newValue: `Updated team "${existing.name}"`,
    });

    return {
      success: true,
      message: `Team "${existing.name}" updated successfully.`,
      team: existing,
    };
  }

  public async deleteTeam(id: string, actor: User | null): Promise<TeamOperationResult> {
    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
      return { success: false, message: 'Unauthorized: Only Admins or Managers can remove teams.' };
    }

    const teams = storageService.getTeams();
    const target = teams.find((t) => t.id === id);
    if (!target) {
      return { success: false, message: 'Team not found.' };
    }

    await storageService.deleteTeam(id);

    await activityService.recordActivity({
      taskId: 'SYSTEM',
      taskTitle: 'Team Management',
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: 'TEAM_DELETED',
      previousValue: target.name,
      newValue: 'DELETED',
    });

    return {
      success: true,
      message: `Team "${target.name}" has been deleted.`,
    };
  }
}

export const teamService = new TeamService();
