import { User, UserRole } from '../types';
import { storageService } from './storageService';
import { authService } from './authService';
import { supabase } from './supabaseClient';
import { generateId } from '../utils/idUtils';

class UserService {
  public async getUsers(): Promise<User[]> {
    return storageService.getUsers();
  }

  public async getUserById(id: string): Promise<User | null> {
    const users = storageService.getUsers();
    return users.find((u) => u.id === id) || null;
  }

  public async getActiveUsers(): Promise<User[]> {
    const users = storageService.getUsers();
    return users.filter((u) => u.active);
  }

  public async getActiveEmployees(): Promise<User[]> {
    const users = storageService.getUsers();
    return users.filter((u) => u.active && (u.role === 'EMPLOYEE' || u.role === 'MANAGER'));
  }

  public async createUser(
    userData: {
      name: string;
      email: string;
      role: UserRole;
      pin: string;
      department?: string;
      active?: boolean;
    },
    actor: User
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    if (!authService.canManageUsers(actor)) {
      return { success: false, message: 'Unauthorized: Only Admins can add team members.' };
    }

    if (!userData.name.trim()) return { success: false, message: 'Name is required.' };
    if (!userData.email.trim() || !userData.email.includes('@')) {
      return { success: false, message: 'A valid work email is required.' };
    }
    const cleanPin = (userData.pin || '').trim();
    if (!cleanPin || cleanPin.length < 4 || cleanPin.length > 6 || !/^\d{4,6}$/.test(cleanPin)) {
      return { success: false, message: 'PIN must be 4 to 6 numeric digits.' };
    }

    const users = storageService.getUsers();
    if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase().trim())) {
      return { success: false, message: 'A user with this email address already exists.' };
    }

    const initials = userData.name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0].toUpperCase())
      .slice(0, 2)
      .join('');

    const newUser: User = {
      id: generateId('user'),
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      role: userData.role,
      pin: userData.pin,
      active: userData.active ?? true,
      initials: initials || 'U',
      department: userData.department?.trim() || 'Operations',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storageService.saveUser(newUser);

    return { success: true, user: newUser, message: 'Team member added successfully.' };
  }

  public async toggleUserActive(
    userId: string,
    actor: User
  ): Promise<{ success: boolean; message: string; user?: User }> {
    if (!authService.canManageUsers(actor)) {
      return { success: false, message: 'Unauthorized: Only Admins can change user activation status.' };
    }

    const users = storageService.getUsers();
    const targetIndex = users.findIndex((u) => u.id === userId);
    if (targetIndex === -1) return { success: false, message: 'User not found.' };

    const targetUser = users[targetIndex];

    // Safety check: Prevent deactivating the last active Admin
    if (targetUser.role === 'ADMIN' && targetUser.active) {
      const activeAdmins = users.filter((u) => u.role === 'ADMIN' && u.active);
      if (activeAdmins.length <= 1) {
        return {
          success: false,
          message: 'Action prohibited: Cannot deactivate the only active Administrator in the system.',
        };
      }
    }

    targetUser.active = !targetUser.active;
    targetUser.updatedAt = new Date().toISOString();
    users[targetIndex] = targetUser;
    // Supabase-first: persist active status change directly to cloud
    await storageService.saveUser(targetUser);

    const actionWord = targetUser.active ? 'activated' : 'deactivated';
    return {
      success: true,
      message: `User ${targetUser.name} has been ${actionWord}.`,
      user: targetUser,
    };
  }

  public async resetPin(
    userId: string,
    newPin: string,
    actor: User
  ): Promise<{ success: boolean; message: string }> {
    if (!authService.canManageUsers(actor) && actor.id !== userId) {
      return { success: false, message: 'Unauthorized: You do not have permission to reset this PIN.' };
    }

    const cleanPin = (newPin || '').trim();
    if (!cleanPin || cleanPin.length < 4 || cleanPin.length > 6 || !/^\d{4,6}$/.test(cleanPin)) {
      return { success: false, message: 'PIN must be 4 to 6 numeric digits.' };
    }

    const users = storageService.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };

    const targetEmail = target.email.toLowerCase().trim();

    // 1. Sync Supabase Auth Cloud Password (auth.users) for active user
    if (actor.id === userId || (targetEmail && actor.email.toLowerCase().trim() === targetEmail)) {
      try {
        const cloudPassword = cleanPin.length >= 6 ? cleanPin : `${cleanPin}00`;
        await supabase.auth.updateUser({ password: cloudPassword });
      } catch (e) {
        console.warn('Supabase auth updateUser password warning:', e);
      }
    }

    // 2. Sync public.users database record in Supabase
    try {
      await supabase.from('users').update({
        pin: cleanPin,
        updated_at: new Date().toISOString()
      }).eq('id', userId);
    } catch (e) {
      console.warn('Supabase public.users update pin warning:', e);
    }

    // 3. Update local storage user records
    users.forEach((u) => {
      if (u.id === userId || u.email.toLowerCase().trim() === targetEmail) {
        u.pin = cleanPin;
        u.updatedAt = new Date().toISOString();
      }
    });

    await storageService.setUsers(users);

    return { success: true, message: `PIN for ${target.name} reset successfully.` };
  }

  public async changeUserRole(
    userId: string,
    newRole: UserRole,
    actor: User
  ): Promise<{ success: boolean; message: string; user?: User }> {
    if (!authService.canManageUsers(actor)) {
      return { success: false, message: 'Unauthorized: Only Admins can change user roles.' };
    }
    return this.updateUser(userId, { role: newRole }, actor);
  }

  public async updateUser(
    userId: string,
    updates: Partial<Omit<User, 'id' | 'createdAt'>>,
    actor: User
  ): Promise<{ success: boolean; message: string; user?: User }> {
    if (!authService.canManageUsers(actor) && actor.id !== userId) {
      return { success: false, message: 'Unauthorized to edit user details.' };
    }

    const users = storageService.getUsers();
    const targetIndex = users.findIndex((u) => u.id === userId);
    if (targetIndex === -1) return { success: false, message: 'User not found.' };

    // Prevent changing the last admin role
    if (users[targetIndex].role === 'ADMIN' && updates.role && updates.role !== 'ADMIN') {
      const activeAdmins = users.filter((u) => u.role === 'ADMIN' && u.active);
      if (activeAdmins.length <= 1) {
        return { success: false, message: 'Action prohibited: Cannot demote the only remaining Administrator.' };
      }
    }

    const updatedUser: User = {
      ...users[targetIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.name && updates.name !== users[targetIndex].name) {
      updatedUser.initials = updates.name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0].toUpperCase())
        .slice(0, 2)
        .join('');

      // Also update tasks assigned to or created by this user
      const tasks = storageService.getTasks();
      let tasksChanged = false;
      const syncedTasks = tasks.map((t) => {
        let changed = false;
        let newT = { ...t };
        if (t.assignedEmployeeId === userId) {
          newT.assignedEmployeeName = updates.name!;
          changed = true;
        }
        if (t.createdById === userId) {
          newT.createdByName = updates.name!;
          changed = true;
        }
        if (changed) {
          tasksChanged = true;
          newT.updatedAt = new Date().toISOString();
        }
        return newT;
      });
      if (tasksChanged) {
        // Supabase-first: push each changed task individually
        for (const t of syncedTasks) {
          if (t.updatedAt > (users[targetIndex]?.updatedAt || '')) {
            storageService.saveTask(t).catch(() => {});
          }
        }
        storageService.setTasks(syncedTasks, false); // update localStorage cache without re-upsert
      }
    }

    users[targetIndex] = updatedUser;
    await storageService.saveUser(updatedUser);

    const message = updates.role
      ? `Role for ${updatedUser.name} changed to ${updates.role}.`
      : 'Employee details updated successfully.';

    return { success: true, message, user: updatedUser };
  }

  public async deleteUser(
    userId: string,
    actor: User
  ): Promise<{ success: boolean; message: string }> {
    if (!authService.canManageUsers(actor)) {
      return { success: false, message: 'Unauthorized: Only Admins can delete employees.' };
    }

    if (actor.id === userId) {
      return { success: false, message: 'Action prohibited: Cannot delete your own active administrator account.' };
    }

    const users = storageService.getUsers();
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return { success: false, message: 'Employee not found.' };

    if (targetUser.role === 'ADMIN') {
      const activeAdmins = users.filter((u) => u.role === 'ADMIN' && u.active);
      if (activeAdmins.length <= 1) {
        return { success: false, message: 'Action prohibited: Cannot delete the only remaining Administrator.' };
      }
    }

    // Also update any tasks assigned to this employee to 'Unassigned'
    const tasks = storageService.getTasks();
    let tasksModified = false;
    const updatedTasks = tasks.map((t) => {
      if (t.assignedEmployeeId === userId) {
        tasksModified = true;
        return {
          ...t,
          assignedEmployeeId: '',
          assignedEmployeeName: 'Unassigned',
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    if (tasksModified) {
      // Supabase-first: push each reassigned task directly
      for (const t of updatedTasks) {
        if (t.assignedEmployeeId === '' && t.updatedAt) {
          storageService.saveTask(t).catch(() => {});
        }
      }
      storageService.setTasks(updatedTasks, false); // update localStorage cache without re-upsert
    }

    // Delete user from local storage and Supabase cloud DB
    await storageService.deleteUser(userId);

    return { success: true, message: `Employee "${targetUser.name}" has been permanently deleted.` };
  }
}

export const userService = new UserService();
