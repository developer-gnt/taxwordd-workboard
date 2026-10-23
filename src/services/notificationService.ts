import type { Notification } from '../types';
import { storageService } from './storageService';
import { supabaseDb } from './supabaseDb';
import { getLocalDateString } from '../utils/dateUtils';
import { generateId } from '../utils/idUtils';

class NotificationService {
  private lastOverdueSyncTimestamp = 0;
  private lastOverdueSyncDate = '';

  public async getNotifications(userId: string): Promise<Notification[]> {
    const list = storageService.getNotifications();
    return list
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getUnreadCount(userId: string): Promise<number> {
    const list = storageService.getNotifications();
    return list.filter((n) => n.userId === userId && !n.read).length;
  }

  public async markAsRead(notificationId: string): Promise<void> {
    const list = storageService.getNotifications();
    const target = list.find((n) => n.id === notificationId);
    if (target && !target.read) {
      target.read = true;
      storageService.setNotifications(list);
      // Supabase: persist read status directly
      supabaseDb.upsertNotification(target).catch(() => {});
    }
  }

  public async markAllAsRead(userId: string): Promise<void> {
    const list = storageService.getNotifications();
    let changed = false;
    const toSync: Notification[] = [];
    list.forEach((n) => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        changed = true;
        toSync.push(n);
      }
    });
    if (changed) {
      storageService.setNotifications(list);
      // Supabase: persist all read-status changes
      supabaseDb.upsertNotifications(toSync).catch(() => {});
    }
  }

  public async createNotification(
    data: Omit<Notification, 'id' | 'createdAt'>
  ): Promise<Notification> {
    const list = storageService.getNotifications();
    const newNotif: Notification = {
      id: generateId('notif'),
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      taskId: data.taskId,
      read: data.read ?? false,
      createdAt: new Date().toISOString(),
    };

    list.unshift(newNotif);
    storageService.setNotifications(list);
    this.sendBrowserNotification(newNotif.title, newNotif.message, newNotif.taskId);
    return newNotif;
  }

  public async deleteNotification(notificationId: string): Promise<void> {
    const list = storageService.getNotifications();
    const target = list.find((n) => n.id === notificationId);
    if (target && target.type === 'OVERDUE' && target.taskId) {
      storageService.addClearedOverdueKey(`${target.userId}_${target.taskId}`);
    }
    const filtered = list.filter((n) => n.id !== notificationId);
    if (filtered.length !== list.length) {
      storageService.setNotifications(filtered, false);
      supabaseDb.deleteNotification(notificationId).catch(() => {});
    }
  }

  public async clearNotifications(userId: string, readOnly: boolean = false): Promise<void> {
    const list = storageService.getNotifications();
    list.forEach((n) => {
      if (n.userId === userId && n.type === 'OVERDUE' && n.taskId) {
        if (!readOnly || n.read) {
          storageService.addClearedOverdueKey(`${n.userId}_${n.taskId}`);
        }
      }
    });

    const filtered = list.filter((n) => {
      if (n.userId !== userId) return true;
      if (readOnly) return !n.read;
      return false;
    });

    if (filtered.length !== list.length) {
      storageService.setNotifications(filtered, false);
      supabaseDb.deleteNotificationsForUser(userId, readOnly).catch(() => {});
    }
  }

  public async syncOverdueNotifications(force = false): Promise<void> {
    const now = Date.now();
    const todayStr = getLocalDateString();

    // 10-minute cooldown throttle unless forced or calendar date changed
    if (!force && this.lastOverdueSyncDate === todayStr && now - this.lastOverdueSyncTimestamp < 10 * 60 * 1000) {
      return;
    }
    this.lastOverdueSyncTimestamp = now;
    this.lastOverdueSyncDate = todayStr;

    const tasks = storageService.getTasks();
    const users = storageService.getUsers();
    let notifications = storageService.getNotifications();
    const clearedKeys = storageService.getClearedOverdueKeys();

    // Step 1: Purge any existing duplicate notifications and orphan notifications for deleted tasks
    const activeTaskIds = new Set(tasks.map((t) => t.id));
    const seenMap = new Set<string>();
    const validNotifs: Notification[] = [];
    let hadChanges = false;

    for (const n of notifications) {
      if (n.taskId && !activeTaskIds.has(n.taskId)) {
        hadChanges = true;
        continue;
      }
      const key = `${n.userId}_${n.taskId || 'general'}_${n.type}`;
      if (!seenMap.has(key)) {
        seenMap.add(key);
        validNotifs.push(n);
      } else {
        hadChanges = true;
      }
    }

    if (hadChanges) {
      notifications = validNotifs;
      storageService.setNotifications(notifications);
    }

    const overdueTasks = tasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'DONE');
    if (overdueTasks.length === 0) return;

    let changed = false;
    const newNotifs: Notification[] = [];

    for (const task of overdueTasks) {
      // Collect recipient user IDs: assigned employee + all admins/managers
      const recipientIds = new Set<string>();
      if (task.assignedEmployeeId) {
        recipientIds.add(task.assignedEmployeeId);
      }
      users.forEach((u) => {
        if (u.role === 'ADMIN' || u.role === 'MANAGER') {
          recipientIds.add(u.id);
        }
      });

      for (const userId of recipientIds) {
        const clearedKey = `${userId}_${task.id}`;
        if (clearedKeys.includes(clearedKey)) {
          // User has explicitly cleared/dismissed overdue alert for this task -> do not re-create
          continue;
        }

        const deterministicId = `notif-overdue-${userId}-${task.id}`;

        const existingInList = notifications.find(
          (n) => n.id === deterministicId || (n.taskId === task.id && n.userId === userId && n.type === 'OVERDUE')
        );
        const existingInNew = newNotifs.find(
          (n) => n.id === deterministicId || (n.taskId === task.id && n.userId === userId && n.type === 'OVERDUE')
        );

        if (!existingInList && !existingInNew) {
          newNotifs.push({
            id: deterministicId,
            userId,
            type: 'OVERDUE',
            title: 'Task Overdue Alert',
            message: `Deliverable "${task.title}" assigned to ${task.assignedEmployeeName} passed deadline (${task.dueDate}).`,
            taskId: task.id,
            read: false,
            createdAt: new Date().toISOString(),
          });
          changed = true;
        }
      }
    }

    if (changed && newNotifs.length > 0) {
      const updatedList = [...newNotifs, ...notifications];
      storageService.setNotifications(updatedList);
    }
  }

  public getBrowserPermission(): NotificationPermission | 'unsupported' {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return window.Notification.permission;
    }
    return 'unsupported';
  }

  public playNotificationSound(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      // High pleasant chime (A5 to C#6)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1108.73, now + 0.12);
      
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);
    } catch {
      // Audio autoplay policy or unavailable context ignored safely
    }
  }

  public async requestBrowserPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await window.Notification.requestPermission();
        if (perm === 'granted') {
          this.playNotificationSound();
          this.sendBrowserNotification(
            'TAX WORLDD Alerts Enabled',
            'You will now receive desktop notifications for task updates, assignments, and deadlines.'
          );
        }
        return perm;
      } catch (e) {
        console.warn('Browser notification permission error:', e);
      }
    }
    return 'unsupported';
  }

  public sendBrowserNotification(title: string, message: string, taskId?: string): void {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      try {
        const notif = new window.Notification(title, {
          body: message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: taskId ? `gnt-task-${taskId}` : `gnt-notif-${Date.now()}`,
        });

        notif.onclick = () => {
          try {
            window.focus();
            if (taskId) {
              window.location.hash = `#/tasks?taskId=${taskId}`;
            }
            notif.close();
          } catch {}
        };

        this.playNotificationSound();
      } catch (e) {
        console.warn('Failed to dispatch browser notification:', e);
      }
    }
  }

  public async sendTestNotification(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission !== 'granted') {
        const perm = await this.requestBrowserPermission();
        if (perm !== 'granted') return false;
      }
      this.sendBrowserNotification(
        '🔔 Test Alert: TAX WORLDD',
        'Site notifications are configured and active! You will receive real-time updates.'
      );
      return true;
    }
    return false;
  }
}

export const notificationService = new NotificationService();
