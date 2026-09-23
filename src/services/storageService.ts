import { User, Project, Task, TaskActivity, Notification, SystemStats } from '../types';
import { SEED_USERS, SEED_PROJECTS, SEED_TASKS, SEED_ACTIVITIES, SEED_NOTIFICATIONS } from '../data/seedData';
import { supabaseDb } from './supabaseDb';

const STORAGE_KEYS = {
  USERS: 'gnt_users',
  PROJECTS: 'gnt_projects',
  TASKS: 'gnt_tasks',
  ACTIVITIES: 'gnt_task_activity',
  NOTIFICATIONS: 'gnt_notifications',
  CLEARED_OVERDUE: 'gnt_cleared_overdue_notifs',
  SESSION: 'gnt_session',
  SETTINGS: 'gnt_settings',
  INITIALIZED: 'gnt_workboard_fresh_v1',
};

class StorageService {
  private listeners: Set<() => void> = new Set();
  private isInitialized = false;

  constructor() {
    this.ensureInitialized();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Storage listener error', e);
      }
    });
  }

  public ensureInitialized(): void {
    try {
      const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
      if (isInit !== 'true') {
        this.resetToSeedData();
      }
      this.isInitialized = true;
    } catch (e) {
      console.error('Failed checking initialization', e);
    }
  }

  public resetToSeedData(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS || []));
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS || []));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(SEED_TASKS || []));
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(SEED_ACTIVITIES || []));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS || []));
      localStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify({
          systemName: 'GNT Workboard',
          version: '1.0-FRESH',
          deployedEnvironment: 'Internal Operations',
          updatedAt: new Date().toISOString(),
        })
      );
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      this.notify();

      // Also push seed data to Supabase if tables are newly initialized
      supabaseDb.upsertUsers(SEED_USERS).catch(() => {});
      supabaseDb.upsertProjects(SEED_PROJECTS).catch(() => {});
      supabaseDb.upsertTasks(SEED_TASKS).catch(() => {});
    } catch (e) {
      console.error('Failed to reset to seed data', e);
    }
  }

  // Safe Generic Getters / Setters
  public getItem<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw || raw === 'undefined' || raw === 'null') return defaultValue;
      const parsed = JSON.parse(raw) as T;
      if (parsed === undefined || parsed === null) return defaultValue;
      return parsed;
    } catch (err) {
      console.warn(`Failed to parse storage key ${key}, falling back to default`, err);
      return defaultValue;
    }
  }

  public setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
    } catch (err: any) {
      console.warn(`Storage setItem warning for key "${key}":`, err);
      // QuotaExceededError recovery: if tasks collection exceeds quota due to attachments,
      // strip dataUrl binaries from local cache while preserving metadata
      if (key === STORAGE_KEYS.TASKS && Array.isArray(value)) {
        try {
          const sanitizedTasks = (value as Task[]).map((t) => ({
            ...t,
            attachments: (t.attachments || []).map((att) => ({
              ...att,
              dataUrl: undefined, // remove heavy base64 from local cache to prevent quota crash
            })),
          }));
          localStorage.setItem(key, JSON.stringify(sanitizedTasks));
          this.notify();
          return;
        } catch (recoveryErr) {
          console.error('Failed recovery storage setItem after quota error', recoveryErr);
        }
      }
    }
  }

  // ==================== USERS ====================
  public getUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS || []);
  }

  public async setUsers(users: User[], syncCloud = true): Promise<void> {
    this.setItem(STORAGE_KEYS.USERS, users);
    if (syncCloud) {
      try {
        await supabaseDb.upsertUsers(users);
      } catch (e) {
        console.warn('Supabase sync users error:', e);
      }
    }
  }

  public async saveUser(user: User): Promise<boolean> {
    // PRIMARY: Write to Supabase first (source of truth)
    let syncedToCloud = false;
    try {
      syncedToCloud = await supabaseDb.upsertUser(user);
    } catch (e) {
      console.error('[Storage] Supabase save user exception:', e);
    }

    if (syncedToCloud) {
      // CACHE: Update localStorage for instant reads
      const users = this.getUsers();
      const idx = users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
      if (idx >= 0) {
        users[idx] = user;
      } else {
        users.push(user);
      }
      this.setItem(STORAGE_KEYS.USERS, users);
    }
    return syncedToCloud;
  }

  public async deleteUser(userId: string): Promise<boolean> {
    // PRIMARY: Delete from Supabase first
    let deleted = false;
    try {
      deleted = await supabaseDb.deleteUser(userId);
    } catch (e) {
      console.warn('Supabase delete user error (removing locally):', e);
    }
    // CACHE: Remove from localStorage
    const users = this.getUsers().filter((u) => u.id !== userId);
    this.setItem(STORAGE_KEYS.USERS, users);
    return deleted;
  }

  // ==================== PROJECTS ====================
  public getProjects(): Project[] {
    return this.getItem<Project[]>(STORAGE_KEYS.PROJECTS, SEED_PROJECTS || []);
  }

  public setProjects(projects: Project[], syncCloud = true): void {
    this.setItem(STORAGE_KEYS.PROJECTS, projects);
    if (syncCloud) {
      supabaseDb.upsertProjects(projects).catch((e) => console.warn('Supabase sync projects error:', e));
    }
  }

  public async saveProject(project: Project): Promise<boolean> {
    // PRIMARY: Write to Supabase first (source of truth)
    let syncedToCloud = false;
    try {
      syncedToCloud = await supabaseDb.upsertProject(project);
    } catch (e) {
      console.error('[Storage] Supabase save project exception:', e);
    }

    if (syncedToCloud) {
      // CACHE: Update localStorage for instant reads
      const projects = this.getProjects();
      const idx = projects.findIndex((p) => p.id === project.id);
      if (idx >= 0) {
        projects[idx] = project;
      } else {
        projects.unshift(project);
      }
      this.setItem(STORAGE_KEYS.PROJECTS, projects);
    }
    return syncedToCloud;
  }

  public async deleteProject(projectId: string): Promise<boolean> {
    // PRIMARY: Delete from Supabase first
    let deleted = false;
    try {
      deleted = await supabaseDb.deleteProject(projectId);
    } catch (e) {
      console.warn('Supabase delete project error (removing locally):', e);
    }
    // CACHE: Remove from localStorage
    const projects = this.getProjects().filter((p) => p.id !== projectId);
    this.setItem(STORAGE_KEYS.PROJECTS, projects);
    return deleted;
  }

  // ==================== TASKS ====================
  public getTasks(): Task[] {
    return this.getItem<Task[]>(STORAGE_KEYS.TASKS, SEED_TASKS || []);
  }

  public setTasks(tasks: Task[], syncCloud = true): void {
    this.setItem(STORAGE_KEYS.TASKS, tasks);
    if (syncCloud) {
      supabaseDb.upsertTasks(tasks).catch((e) => console.warn('Supabase sync tasks error:', e));
    }
  }

  public async saveTask(task: Task): Promise<boolean> {
    // PRIMARY: Write to Supabase first (source of truth)
    let syncedToCloud = false;
    try {
      syncedToCloud = await supabaseDb.upsertTask(task);
    } catch (e) {
      console.error('[Storage] Supabase save task exception:', e);
    }

    if (!syncedToCloud) {
      console.error('[Storage] saveTask failed: Supabase rejected persistence for task', task.id);
      return false;
    }

    // CACHE: Update localStorage for instant UI reads only after successful DB persistence
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = task;
    } else {
      tasks.unshift(task);
    }
    this.setItem(STORAGE_KEYS.TASKS, tasks);
    return true;
  }

  public async deleteTask(taskId: string): Promise<boolean> {
    // PRIMARY: Delete from Supabase first
    let deleted = false;
    try {
      deleted = await supabaseDb.deleteTask(taskId);
    } catch (e) {
      console.warn('Supabase delete task error (removing locally):', e);
    }
    // CACHE: Remove from localStorage
    const tasks = this.getTasks().filter((t) => t.id !== taskId);
    this.setItem(STORAGE_KEYS.TASKS, tasks);
    return deleted;
  }

  // ==================== ACTIVITIES ====================
  public getActivities(): TaskActivity[] {
    return this.getItem<TaskActivity[]>(STORAGE_KEYS.ACTIVITIES, SEED_ACTIVITIES || []);
  }

  public setActivities(activities: TaskActivity[], syncCloud = true): void {
    this.setItem(STORAGE_KEYS.ACTIVITIES, activities);
    if (syncCloud) {
      supabaseDb.upsertActivities(activities).catch((e) => console.warn('Supabase sync activities error:', e));
    }
  }

  public saveActivity(activity: TaskActivity): void {
    const activities = this.getActivities();
    activities.unshift(activity);
    this.setItem(STORAGE_KEYS.ACTIVITIES, activities.slice(0, 200));
    supabaseDb.upsertActivity(activity).catch((e) => console.warn('Supabase save activity error:', e));
  }

  // ==================== NOTIFICATIONS ====================
  public getNotifications(): Notification[] {
    return this.getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS || []);
  }

  public setNotifications(notifications: Notification[], syncCloud = true): void {
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
    if (syncCloud) {
      supabaseDb.upsertNotifications(notifications).catch((e) => console.warn('Supabase sync notifications error:', e));
    }
  }

  public saveNotification(notification: Notification): void {
    const notifs = this.getNotifications();
    notifs.unshift(notification);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs.slice(0, 100));
    supabaseDb.upsertNotification(notification).catch((e) => console.warn('Supabase save notification error:', e));
  }

  // ==================== SESSION ====================
  public getSession(): { userId: string } | null {
    return this.getItem<{ userId: string } | null>(STORAGE_KEYS.SESSION, null);
  }

  public setSession(session: { userId: string } | null): void {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      this.notify();
    } else {
      this.setItem(STORAGE_KEYS.SESSION, session);
    }
  }

  // ==================== SUPABASE BIDIRECTIONAL SYNC ====================
  public async syncWithSupabase(): Promise<void> {
    const localData = {
      users: this.getUsers(),
      projects: this.getProjects(),
      tasks: this.getTasks(),
      activities: this.getActivities(),
      notifications: this.getNotifications(),
    };

    await supabaseDb.performFullSync(localData, (cloudData) => {
      this.setItem(STORAGE_KEYS.USERS, cloudData.users);
      this.setItem(STORAGE_KEYS.PROJECTS, cloudData.projects);
      this.setItem(STORAGE_KEYS.TASKS, cloudData.tasks);
      this.setItem(STORAGE_KEYS.ACTIVITIES, cloudData.activities);
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, cloudData.notifications);
      this.notify();
    });
  }

  // Backup / Export / Import / Stats
  public getSystemStats(): SystemStats {
    const users = this.getUsers();
    const projects = this.getProjects();
    const tasks = this.getTasks();
    const activities = this.getActivities();
    const notifications = this.getNotifications();

    let storageBytes = 0;
    try {
      for (const k in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, k) && k.startsWith('gnt_')) {
          storageBytes += (localStorage[k].length + k.length) * 2;
        }
      }
    } catch {
      storageBytes = 0;
    }

    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.active).length,
      totalProjects: projects.length,
      totalTasks: tasks.length,
      totalActivities: activities.length,
      totalNotifications: notifications.length,
      storageUsageBytes: storageBytes,
      lastBackupDate: new Date().toISOString(),
    };
  }

  public exportAllData(): string {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        users: this.getUsers(),
        projects: this.getProjects(),
        tasks: this.getTasks(),
        activities: this.getActivities(),
        notifications: this.getNotifications(),
      },
    };
    return JSON.stringify(payload, null, 2);
  }

  public exportFullBackup(): string {
    return this.exportAllData();
  }

  public importAllData(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.data) {
        return { success: false, message: 'Invalid backup file format: missing root data object.' };
      }
      const { users, projects, tasks, activities, notifications } = parsed.data;
      if (!Array.isArray(users) || !Array.isArray(tasks) || !Array.isArray(projects)) {
        return { success: false, message: 'Backup file missing essential collections (users, tasks, or projects).' };
      }

      this.setUsers(users);
      this.setProjects(projects);
      this.setTasks(tasks);
      if (Array.isArray(activities)) this.setActivities(activities);
      if (Array.isArray(notifications)) this.setNotifications(notifications);

      return { success: true, message: 'Application data restored successfully.' };
    } catch (err) {
      return { success: false, message: `Failed to import data: ${err instanceof Error ? err.message : 'Syntax error'}` };
    }
  }

  public importFullBackup(jsonString: string): boolean {
    const res = this.importAllData(jsonString);
    return res.success;
  }

  // ==================== CLEARED OVERDUE REGISTRY ====================
  public getClearedOverdueKeys(): string[] {
    return this.getItem<string[]>(STORAGE_KEYS.CLEARED_OVERDUE, []);
  }

  public addClearedOverdueKey(key: string): void {
    const keys = this.getClearedOverdueKeys();
    if (!keys.includes(key)) {
      keys.push(key);
      this.setItem(STORAGE_KEYS.CLEARED_OVERDUE, keys);
    }
  }

  public clearClearedOverdueKeys(): void {
    this.setItem(STORAGE_KEYS.CLEARED_OVERDUE, []);
  }
}

export const storageService = new StorageService();
