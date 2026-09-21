import { supabase } from './supabaseClient';
import { User, Project, Task, TaskActivity, Notification } from '../types';

export class SupabaseDbService {
  private isSyncing = false;

  // ==================== USERS ====================
  public async fetchUsers(): Promise<User[] | null> {
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
      if (error) {
        console.warn('Supabase fetchUsers warning:', error.message);
        return null;
      }
      if (!data) return [];
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        pin: row.pin,
        active: row.active ?? true,
        avatar: row.avatar || undefined,
        initials: row.initials,
        department: row.department || 'Operations',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (e) {
      console.warn('Supabase fetchUsers exception:', e);
      return null;
    }
  }

  public async upsertUser(user: User): Promise<boolean> {
    try {
      const payload = {
        id: user.id,
        name: user.name,
        email: user.email.toLowerCase().trim(),
        role: user.role,
        pin: user.pin,
        active: user.active ?? true,
        avatar: user.avatar || null,
        initials: user.initials,
        department: user.department || 'Operations',
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      };
      const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.error('Supabase upsertUser error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase upsertUser exception:', e);
      return false;
    }
  }

  public async upsertUsers(users: User[]): Promise<boolean> {
    if (users.length === 0) return true;
    try {
      const payloads = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email.toLowerCase().trim(),
        role: u.role,
        pin: u.pin,
        active: u.active ?? true,
        avatar: u.avatar || null,
        initials: u.initials,
        department: u.department || 'Operations',
        created_at: u.createdAt,
        updated_at: u.updatedAt,
      }));
      const { error } = await supabase.from('users').upsert(payloads, { onConflict: 'id' });
      if (error) {
        console.error('Supabase upsertUsers error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase upsertUsers exception:', e);
      return false;
    }
  }

  public async deleteUser(userId: string): Promise<boolean> {
    try {
      // 1. Unassign user from tasks to avoid FK conflicts
      await supabase
        .from('tasks')
        .update({ assigned_employee_id: null, assigned_employee_name: 'Unassigned' })
        .eq('assigned_employee_id', userId);

      await supabase
        .from('tasks')
        .update({ created_by_id: null, created_by_name: 'Former Staff' })
        .eq('created_by_id', userId);

      // 2. Clean up notifications for user
      await supabase.from('notifications').delete().eq('user_id', userId);

      // 3. Delete user row
      const { data, error } = await supabase.from('users').delete().eq('id', userId).select();
      if (error) {
        console.error('Supabase deleteUser error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase deleteUser exception:', e);
      return false;
    }
  }

  // ==================== PROJECTS ====================
  public async fetchProjects(): Promise<Project[] | null> {
    try {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: true });
      if (error) {
        console.warn('Supabase fetchProjects warning:', error.message);
        return null;
      }
      if (!data) return [];
      return data.map((row: any) => ({
        id: row.id,
        projectName: row.project_name,
        clientName: row.client_name,
        status: row.status,
        description: row.description || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (e) {
      console.warn('Supabase fetchProjects exception:', e);
      return null;
    }
  }

  public async upsertProject(project: Project): Promise<boolean> {
    try {
      const payload = {
        id: project.id,
        project_name: project.projectName,
        client_name: project.clientName,
        status: project.status,
        description: project.description || '',
        created_at: project.createdAt,
        updated_at: project.updatedAt,
      };
      const { error } = await supabase.from('projects').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.error('Supabase upsertProject error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase upsertProject exception:', e);
      return false;
    }
  }

  public async upsertProjects(projects: Project[]): Promise<boolean> {
    if (projects.length === 0) return true;
    try {
      const payloads = projects.map((p) => ({
        id: p.id,
        project_name: p.projectName,
        client_name: p.clientName,
        status: p.status,
        description: p.description || '',
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      }));
      const { error } = await supabase.from('projects').upsert(payloads, { onConflict: 'id' });
      if (error) {
        console.error('Supabase upsertProjects error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase upsertProjects exception:', e);
      return false;
    }
  }

  public async deleteProject(projectId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) {
        console.error('Supabase deleteProject error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase deleteProject exception:', e);
      return false;
    }
  }

  // ==================== TASKS ====================
  public async fetchTasks(): Promise<Task[] | null> {
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (error) {
        console.warn('Supabase fetchTasks warning:', error.message);
        return null;
      }
      if (!data) return [];
      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        projectId: row.project_id || '',
        projectName: row.project_name || '',
        clientName: row.client_name || '',
        assignedEmployeeId: row.assigned_employee_id || '',
        assignedEmployeeName: row.assigned_employee_name || 'Unassigned',
        createdById: row.created_by_id || '',
        createdByName: row.created_by_name || 'Admin',
        priority: row.priority,
        dueDate: row.due_date || '',
        status: row.status,
        progress: row.progress || 0,
        blocker: row.blocker || undefined,
        nextAction: row.next_action || '',
        notes: row.notes || '',
        referenceLink: row.reference_link || '',
        estimatedEffort: row.estimated_effort || '',
        expectedCompletionDate: row.expected_completion_date || undefined,
        attachments: Array.isArray(row.attachments) ? row.attachments : [],
        completedAt: row.completed_at || undefined,
        completedBy: row.completed_by || undefined,
        wasOverdue: row.was_overdue || false,
        carriedForward: row.carried_forward || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (e) {
      console.warn('Supabase fetchTasks exception:', e);
      return null;
    }
  }

  public async upsertTask(task: Task): Promise<boolean> {
    try {
      const payload: any = {
        id: task.id,
        title: task.title,
        description: task.description || '',
        project_id: task.projectId || null,
        project_name: task.projectName,
        client_name: task.clientName,
        assigned_employee_id: task.assignedEmployeeId || null,
        assigned_employee_name: task.assignedEmployeeName,
        created_by_id: task.createdById || null,
        created_by_name: task.createdByName,
        priority: task.priority,
        due_date: task.dueDate || null,
        status: task.status,
        progress: task.progress ?? 0,
        blocker: task.blocker || null,
        next_action: task.nextAction || '',
        notes: task.notes || '',
        reference_link: task.referenceLink || '',
        estimated_effort: task.estimatedEffort || '',
        expected_completion_date: task.expectedCompletionDate || null,
        attachments: task.attachments || [],
        completed_at: task.completedAt || null,
        completed_by: task.completedBy || null,
        was_overdue: task.wasOverdue ?? false,
        carried_forward: task.carriedForward ?? false,
        created_at: task.createdAt || new Date().toISOString(),
        updated_at: task.updatedAt || new Date().toISOString(),
      };
      const { error } = await supabase.from('tasks').upsert(payload, { onConflict: 'id' });
      if (error) {
        // If FK violation (e.g. invalid user/project reference), nullify FK fields and retry
        if (error.code === '23503' || error.message?.includes('foreign key')) {
          payload.project_id = null;
          payload.assigned_employee_id = null;
          payload.created_by_id = null;
          const retry = await supabase.from('tasks').upsert(payload, { onConflict: 'id' });
          if (retry.error) {
            console.error('Supabase upsertTask retry error:', retry.error);
            return false;
          }
          return true;
        }
        console.error('Supabase upsertTask error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase upsertTask exception:', e);
      return false;
    }
  }

  public async upsertTasks(tasks: Task[]): Promise<boolean> {
    if (tasks.length === 0) return true;
    try {
      const payloads = tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        project_id: task.projectId || null,
        project_name: task.projectName,
        client_name: task.clientName,
        assigned_employee_id: task.assignedEmployeeId || null,
        assigned_employee_name: task.assignedEmployeeName,
        created_by_id: task.createdById || null,
        created_by_name: task.createdByName,
        priority: task.priority,
        due_date: task.dueDate || null,
        status: task.status,
        progress: task.progress ?? 0,
        blocker: task.blocker || null,
        next_action: task.nextAction || '',
        notes: task.notes || '',
        reference_link: task.referenceLink || '',
        estimated_effort: task.estimatedEffort || '',
        expected_completion_date: task.expectedCompletionDate || null,
        attachments: task.attachments || [],
        completed_at: task.completedAt || null,
        completed_by: task.completedBy || null,
        was_overdue: task.wasOverdue ?? false,
        carried_forward: task.carriedForward ?? false,
        created_at: task.createdAt || new Date().toISOString(),
        updated_at: task.updatedAt || new Date().toISOString(),
      }));
      const { error } = await supabase.from('tasks').upsert(payloads, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase upsertTasks batch failed, falling back to individual upserts:', error.message);
        let allSuccess = true;
        for (const task of tasks) {
          const ok = await this.upsertTask(task);
          if (!ok) allSuccess = false;
        }
        return allSuccess;
      }
      return true;
    } catch (e) {
      console.error('Supabase upsertTasks exception:', e);
      let allSuccess = true;
      for (const task of tasks) {
        const ok = await this.upsertTask(task);
        if (!ok) allSuccess = false;
      }
      return allSuccess;
    }
  }

  public async deleteTask(taskId: string): Promise<boolean> {
    try {
      // 1. Delete task from tasks table
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) {
        console.error('Supabase deleteTask error:', error);
        return false;
      }
      // 2. Cascade delete related notifications from notifications table
      await supabase.from('notifications').delete().eq('task_id', taskId);
      // 3. Cascade delete related activities from activities table
      await supabase.from('activities').delete().eq('task_id', taskId);

      return true;
    } catch (e) {
      console.error('Supabase deleteTask exception:', e);
      return false;
    }
  }

  // ==================== ACTIVITIES ====================
  public async fetchActivities(): Promise<TaskActivity[] | null> {
    try {
      const { data, error } = await supabase.from('activities').select('*').order('timestamp', { ascending: false }).limit(100);
      if (error) {
        console.warn('Supabase fetchActivities warning:', error.message);
        return null;
      }
      if (!data) return [];
      return data.map((row: any) => ({
        id: row.id,
        taskId: row.task_id,
        taskTitle: row.task_title || '',
        userId: row.user_id || '',
        userName: row.user_name,
        userRole: row.user_role,
        action: row.action,
        previousValue: row.previous_value || undefined,
        newValue: row.new_value || undefined,
        timestamp: row.timestamp,
      }));
    } catch (e) {
      console.warn('Supabase fetchActivities exception:', e);
      return null;
    }
  }

  public async upsertActivity(activity: TaskActivity): Promise<boolean> {
    try {
      const payload = {
        id: activity.id,
        task_id: activity.taskId,
        task_title: activity.taskTitle || '',
        user_id: activity.userId || null,
        user_name: activity.userName,
        user_role: activity.userRole,
        action: activity.action,
        previous_value: activity.previousValue || null,
        new_value: activity.newValue || null,
        timestamp: activity.timestamp,
      };
      const { error } = await supabase.from('activities').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.error('Supabase upsertActivity error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase upsertActivity exception:', e);
      return false;
    }
  }

  public async upsertActivities(activities: TaskActivity[]): Promise<boolean> {
    if (activities.length === 0) return true;
    try {
      const payloads = activities.map((a) => ({
        id: a.id,
        task_id: a.taskId,
        task_title: a.taskTitle || '',
        user_id: a.userId || null,
        user_name: a.userName,
        user_role: a.userRole,
        action: a.action,
        previous_value: a.previousValue || null,
        new_value: a.newValue || null,
        timestamp: a.timestamp,
      }));
      const { error } = await supabase.from('activities').upsert(payloads, { onConflict: 'id' });
      if (error) {
        console.error('Supabase upsertActivities error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase upsertActivities exception:', e);
      return false;
    }
  }

  // ==================== NOTIFICATIONS ====================
  public async fetchNotifications(): Promise<Notification[] | null> {
    try {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) {
        console.warn('Supabase fetchNotifications warning:', error.message);
        return null;
      }
      if (!data) return [];
      return data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        title: row.title,
        message: row.message,
        taskId: row.task_id || undefined,
        read: row.read || false,
        createdAt: row.created_at,
      }));
    } catch (e) {
      console.warn('Supabase fetchNotifications exception:', e);
      return null;
    }
  }

  public async upsertNotification(notification: Notification): Promise<boolean> {
    try {
      const payload = {
        id: notification.id,
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        task_id: notification.taskId || null,
        read: notification.read || false,
        created_at: notification.createdAt,
      };
      const { error } = await supabase.from('notifications').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.error('Supabase upsertNotification error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase upsertNotification exception:', e);
      return false;
    }
  }

  public async upsertNotifications(notifications: Notification[]): Promise<boolean> {
    if (notifications.length === 0) return true;
    try {
      const payloads = notifications.map((n) => ({
        id: n.id,
        user_id: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        task_id: n.taskId || null,
        read: n.read || false,
        created_at: n.createdAt,
      }));
      const { error } = await supabase.from('notifications').upsert(payloads, { onConflict: 'id' });
      if (error) {
        console.error('Supabase upsertNotifications error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase upsertNotifications exception:', e);
      return false;
    }
  }

  public async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
      if (error) {
        console.error('Supabase deleteNotification error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase deleteNotification exception:', e);
      return false;
    }
  }

  public async deleteNotificationsForUser(userId: string, readOnly = false): Promise<boolean> {
    try {
      let query = supabase.from('notifications').delete().eq('user_id', userId);
      if (readOnly) {
        query = query.eq('read', true);
      }
      const { error } = await query;
      if (error) {
        console.error('Supabase deleteNotificationsForUser error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase deleteNotificationsForUser exception:', e);
      return false;
    }
  }

  // ==================== FULL INITIAL SYNC ====================
  public async performFullSync(
    localData: {
      users: User[];
      projects: Project[];
      tasks: Task[];
      activities: TaskActivity[];
      notifications: Notification[];
    },
    onSynced: (cloudData: {
      users: User[];
      projects: Project[];
      tasks: Task[];
      activities: TaskActivity[];
      notifications: Notification[];
    }) => void
  ): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const [remoteUsers, remoteProjects, remoteTasks, remoteActivities, remoteNotifs] =
        await Promise.all([
          this.fetchUsers(),
          this.fetchProjects(),
          this.fetchTasks(),
          this.fetchActivities(),
          this.fetchNotifications(),
        ]);

      let finalUsers = localData.users;
      let finalProjects = localData.projects;
      let finalTasks = localData.tasks;
      let finalActivities = localData.activities;
      let finalNotifs = localData.notifications;

      // Timestamp-aware Last-Write-Wins merge for users
      if (remoteUsers !== null) {
        if (remoteUsers.length > 0) {
          const localMap = new Map(localData.users.map((u) => [u.id, u]));
          const merged: User[] = [];
          const toPush: User[] = [];

          for (const rUser of remoteUsers) {
            const lUser = localMap.get(rUser.id);
            if (!lUser) {
              merged.push(rUser);
            } else {
              const lTime = new Date(lUser.updatedAt || lUser.createdAt || 0).getTime();
              const rTime = new Date(rUser.updatedAt || rUser.createdAt || 0).getTime();
              if (lTime > rTime) {
                merged.push(lUser);
                toPush.push(lUser);
              } else {
                merged.push(rUser);
              }
            }
          }

          // Note: We do NOT push missing local users back to remote.
          // If a user was deleted on Supabase, local cache must accept the deletion, not revive it.
          finalUsers = merged;
          if (toPush.length > 0) {
            this.upsertUsers(toPush).catch(() => {});
          }
        } else if (localData.users.length > 0) {
          // If remote is completely empty on initial setup, we sync local
          await this.upsertUsers(localData.users);
        } else {
          finalUsers = [];
        }
      }

      // Timestamp-aware Last-Write-Wins merge for projects
      if (remoteProjects !== null) {
        if (remoteProjects.length > 0) {
          const localMap = new Map(localData.projects.map((p) => [p.id, p]));
          const merged: Project[] = [];
          const toPush: Project[] = [];

          for (const rProj of remoteProjects) {
            const lProj = localMap.get(rProj.id);
            if (!lProj) {
              merged.push(rProj);
            } else {
              const lTime = new Date(lProj.updatedAt || lProj.createdAt || 0).getTime();
              const rTime = new Date(rProj.updatedAt || rProj.createdAt || 0).getTime();
              if (lTime > rTime) {
                merged.push(lProj);
                toPush.push(lProj);
              } else {
                merged.push(rProj);
              }
            }
          }

          // Note: We do NOT push missing local projects back to remote.
          finalProjects = merged;
          if (toPush.length > 0) {
            this.upsertProjects(toPush).catch(() => {});
          }
        } else if (localData.projects.length > 0) {
          await this.upsertProjects(localData.projects);
        } else {
          finalProjects = [];
        }
      }

      // Supabase-authoritative merge for tasks:
      // - Supabase is the source of truth for all existing tasks
      // - Local-only tasks (offline / pre-.env) are pushed to Supabase immediately
      if (remoteTasks !== null) {
        if (remoteTasks.length > 0) {
          const remoteIds = new Set(remoteTasks.map((t) => t.id));
          const localOnlyTasks: Task[] = [];

          for (const lTask of localData.tasks) {
            if (!remoteIds.has(lTask.id)) {
              // Local-only task — push it to Supabase immediately
              localOnlyTasks.push(lTask);
            }
          }

          // Push all local-only tasks to Supabase
          if (localOnlyTasks.length > 0) {
            console.log(`[Sync] Pushing ${localOnlyTasks.length} local-only task(s) to Supabase:`,
              localOnlyTasks.map((t) => t.title));
            for (const t of localOnlyTasks) {
              this.upsertTask(t).catch(() => {});
            }
          }

          // Final state = Supabase tasks (authoritative) + local-only items
          finalTasks = [...localOnlyTasks, ...remoteTasks];
        } else if (localData.tasks.length > 0) {
          // Supabase is completely empty — push everything from local (initial setup)
          console.log(`[Sync] Supabase empty, pushing ${localData.tasks.length} local tasks on initial setup.`);
          await this.upsertTasks(localData.tasks);
          finalTasks = localData.tasks;
        } else {
          finalTasks = [];
        }
      }

      if (remoteActivities !== null) {
        if (remoteActivities.length > 0) {
          finalActivities = remoteActivities;
        } else if (localData.activities.length > 0) {
          await this.upsertActivities(localData.activities);
        }
      }

      if (remoteNotifs !== null) {
        if (remoteNotifs.length > 0) {
          finalNotifs = remoteNotifs;
        } else if (localData.notifications.length > 0) {
          await this.upsertNotifications(localData.notifications);
        }
      }

      onSynced({
        users: finalUsers,
        projects: finalProjects,
        tasks: finalTasks,
        activities: finalActivities,
        notifications: finalNotifs,
      });
    } catch (e) {
      console.warn('Full Supabase sync exception:', e);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const supabaseDb = new SupabaseDbService();
