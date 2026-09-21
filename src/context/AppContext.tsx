import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Task, Project, TaskActivity, Notification, TaskStatus, TaskPriority, ProjectStatus, UserRole } from '../types';
import { formatLocalDateDisplay, getLocalDateString } from '../utils/dateUtils';
import { storageService } from '../services/storageService';
import { authService, LoginResult } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { projectService } from '../services/projectService';
import { notificationService } from '../services/notificationService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  tasks: Task[];
  activities: TaskActivity[];
  notifications: Notification[];
  unreadNotificationCount: number;
  toasts: ToastMessage[];
  activeRoute: string;
  selectedTaskId: string | null;
  taskFilterState: {
    status?: TaskStatus | 'ALL';
    priority?: TaskPriority | 'ALL';
    employeeId?: string;
    projectId?: string;
    quickFilter?: 'all' | 'today' | 'upcoming' | 'overdue' | 'blocked' | 'completed';
    search?: string;
    dueDate?: string;
  };

  // Actions
  login: (userId: string, pin: string) => Promise<LoginResult>;
  signInWithEmail: (email: string, password: string) => Promise<LoginResult>;
  signUpWithEmail: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    department?: string;
  }) => Promise<LoginResult>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  navigateTo: (route: string, filterParams?: Record<string, any>) => void;
  openTaskDetail: (taskId: string) => void;
  closeTaskDetail: () => void;
  setTaskFilterState: React.Dispatch<React.SetStateAction<any>>;
  showToast: (
    title: string,
    message?: string,
    type?: 'success' | 'error' | 'info' | 'warning',
    action?: { label: string; onClick: () => void },
    duration?: number
  ) => void;
  dismissToast: (id: string) => void;

  // Task Actions
  createTask: (data: {
    title: string;
    description: string;
    projectId: string;
    assignedEmployeeId: string;
    priority: TaskPriority;
    dueDate: string;
    nextAction: string;
    notes?: string;
    referenceLink?: string;
    estimatedEffort?: string;
    expectedCompletionDate?: string;
    attachments?: any[];
  }) => Promise<{ success: boolean; message: string; task?: Task }>;

  employeeUpdateTask: (
    taskId: string,
    updates: {
      status?: TaskStatus;
      progress?: number;
      blocker?: string;
      nextAction?: string;
      notes?: string;
      expectedCompletionDate?: string;
    }
  ) => Promise<{ success: boolean; message: string; task?: Task }>;

  updateTaskMetadata: (
    taskId: string,
    updates: Partial<Omit<Task, 'id' | 'createdAt'>>
  ) => Promise<{ success: boolean; message: string; task?: Task }>;

  deleteTask: (taskId: string) => Promise<{ success: boolean; message: string }>;

  // User Actions
  createUser: (data: {
    name: string;
    email: string;
    role: UserRole;
    pin: string;
    department?: string;
    active?: boolean;
  }) => Promise<{ success: boolean; message?: string }>;

  updateUser: (
    userId: string,
    updates: Partial<Omit<User, 'id' | 'createdAt'>>
  ) => Promise<{ success: boolean; message: string; user?: User }>;
  toggleUserActive: (userId: string) => Promise<{ success: boolean; message: string }>;
  resetUserPin: (userId: string, newPin: string) => Promise<{ success: boolean; message: string }>;
  changeUserRole: (userId: string, newRole: UserRole) => Promise<{ success: boolean; message: string; user?: User }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message: string }>;

  // Project Actions
  createProject: (data: {
    projectName: string;
    clientName: string;
    status: ProjectStatus;
    description?: string;
  }) => Promise<{ success: boolean; message: string; project?: Project }>;

  updateProject: (
    id: string,
    updates: Partial<Omit<Project, 'id' | 'createdAt'>>
  ) => Promise<{ success: boolean; message: string }>;

  deleteProject: (id: string) => Promise<{ success: boolean; message: string }>;

  // Notification Actions
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearNotifications: (readOnly?: boolean) => Promise<void>;

  // System Actions
  resetToDemoData: () => void;
}

const getInitialRoute = (): string => {
  try {
    if (typeof window !== 'undefined') {
      if (window.location.hash && window.location.hash.startsWith('#/')) {
        return window.location.hash.substring(1);
      }
      const saved = localStorage.getItem('gnt_active_route');
      if (saved && saved.startsWith('/')) {
        return saved;
      }
    }
  } catch (e) {
    console.warn('Failed reading initial route', e);
  }
  return '/login';
};

const getDefaultRouteForRole = (role: UserRole): string => {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'MANAGER') return '/manager/dashboard';
  return '/employee/tasks';
};

const getAuthorizedRoute = (route: string, user: User | null): string => {
  if (!user) return '/login';
  if (!route || route === '/login') return getDefaultRouteForRole(user.role);

  // Validate role-based routes
  if (user.role === 'EMPLOYEE') {
    if (route.startsWith('/admin') || route.startsWith('/manager')) {
      return '/employee/tasks';
    }
  } else if (user.role === 'MANAGER') {
    if (route.startsWith('/admin')) {
      return '/manager/dashboard';
    }
  }
  return route;
};

const AppContext = createContext<AppContextType | null>(null);

// Maps notification type → toast style
const getToastTypeForNotifType = (
  type: string
): 'success' | 'error' | 'info' | 'warning' => {
  if (type === 'COMPLETED') return 'success';
  if (type === 'BLOCKED') return 'error';
  if (type === 'OVERDUE' || type === 'DUE_TODAY' || type === 'PERIOD_CLOSING') return 'warning';
  return 'info';
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Initialize from localStorage cache for instant first render,
  // then immediately overridden by Supabase sync on mount.
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());
  const [projects, setProjects] = useState<Project[]>(() => storageService.getProjects());
  const [tasks, setTasks] = useState<Task[]>(() => storageService.getTasks());
  const [activities, setActivities] = useState<TaskActivity[]>(() => storageService.getActivities());
  const [notifications, setNotifications] = useState<Notification[]>(() => storageService.getNotifications());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeRoute, setActiveRoute] = useState<string>(() => getInitialRoute());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskFilterState, setTaskFilterState] = useState<any>(() => ({
    status: 'ALL',
    priority: 'ALL',
    quickFilter: 'all',
    search: '',
    dueDate: '',
  }));

  // Tracks notification IDs already seen by the current user to detect new ones
  const prevNotifIdsRef = useRef<Set<string>>(new Set());
  const prevUserIdRef = useRef<string | null>(null);

  const updateRoute = useCallback((newRoute: string) => {
    setActiveRoute(newRoute);
    try {
      localStorage.setItem('gnt_active_route', newRoute);
      if (typeof window !== 'undefined' && window.location.hash !== `#${newRoute}`) {
        window.history.replaceState(null, '', `#${newRoute}`);
      }
    } catch { }
  }, []);

  const refreshAllState = useCallback(async () => {
    await notificationService.syncOverdueNotifications();
    const allUsers = storageService.getUsers();
    const allProjects = storageService.getProjects();
    const allTasks = storageService.getTasks();
    const allActivities = storageService.getActivities();
    const allNotifs = storageService.getNotifications();
    const curr = await authService.getCurrentUser();

    setUsers(allUsers);
    setProjects(allProjects);
    setTasks(allTasks);
    setActivities(allActivities);
    setNotifications(allNotifs);
    setCurrentUser(curr);

    // ── Live popup toast for new notifications ──────────────────────────────
    if (curr) {
      const userNotifs = allNotifs.filter((n) => n.userId === curr.id && !n.read);
      const isSameUser = prevUserIdRef.current === curr.id;
      const prevIds = prevNotifIdsRef.current;

      if (isSameUser && prevIds.size > 0) {
        // Find notifications that weren't in the previous snapshot
        const newOnes = userNotifs.filter((n) => !prevIds.has(n.id));
        if (newOnes.length > 0) {
          setToasts((prev) => {
            const additions: ToastMessage[] = newOnes.map((n) => ({
              id: `toast-notif-${n.id}`,
              type: getToastTypeForNotifType(n.type),
              title: n.title,
              message: n.message,
              duration: 7000,
            }));
            // Deduplicate: skip if toast for this notif already queued
            const existingIds = new Set(prev.map((t) => t.id));
            return [...prev, ...additions.filter((a) => !existingIds.has(a.id))];
          });
        }
      }

      prevUserIdRef.current = curr.id;
      prevNotifIdsRef.current = new Set(userNotifs.map((n) => n.id));
    } else {
      prevUserIdRef.current = null;
      prevNotifIdsRef.current = new Set();
    }
    // ────────────────────────────────────────────────────────────────────────

    if (curr) {
      setActiveRoute((prev) => {
        const target = prev && prev !== '/login' ? prev : getInitialRoute();
        const authorized = getAuthorizedRoute(target, curr);
        try {
          localStorage.setItem('gnt_active_route', authorized);
          if (typeof window !== 'undefined' && window.location.hash !== `#${authorized}`) {
            window.history.replaceState(null, '', `#${authorized}`);
          }
        } catch { }
        return authorized;
      });
    } else {
      setActiveRoute('/login');
      try {
        localStorage.setItem('gnt_active_route', '/login');
        if (typeof window !== 'undefined' && window.location.hash !== '#/login') {
          window.history.replaceState(null, '', '#/login');
        }
      } catch { }
    }
  }, []);

  useEffect(() => {
    refreshAllState();

    // Trigger initial cloud sync with Supabase
    storageService.syncWithSupabase().then(() => {
      refreshAllState();
    });

    const unsubscribe = storageService.subscribe(() => {
      refreshAllState();
    });

    // Handle browser back/forward or hash changes
    const handleHashChange = () => {
      if (typeof window !== 'undefined' && window.location.hash && window.location.hash.startsWith('#/')) {
        const hashRoute = window.location.hash.substring(1);
        setActiveRoute((prev) => {
          if (prev !== hashRoute) {
            try {
              localStorage.setItem('gnt_active_route', hashRoute);
            } catch { }
            return hashRoute;
          }
          return prev;
        });
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    // Real-time Supabase postgres_changes listener with debouncing
    let syncTimeout: any = null;
    const triggerSync = () => {
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        storageService.syncWithSupabase();
      }, 300);
    };

    const channel = supabase
      .channel('public:db-sync-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, triggerSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, triggerSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, triggerSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, triggerSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, triggerSync)
      .subscribe();

    // Fast sync when window gains focus or tab becomes visible
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        storageService.syncWithSupabase();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    // Periodic polling heartbeat (every 4 seconds) to guarantee multi-device state consistency
    const pollInterval = setInterval(() => {
      storageService.syncWithSupabase();
    }, 4000);

    return () => {
      if (syncTimeout) clearTimeout(syncTimeout);
      clearInterval(pollInterval);
      unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      supabase.removeChannel(channel);
    };
  }, [refreshAllState]);

  const showToast = useCallback(
    (
      title: string,
      message?: string,
      type: 'success' | 'error' | 'info' | 'warning' = 'info',
      action?: { label: string; onClick: () => void },
      duration: number = 4500
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      setToasts((prev) => [...prev, { id, title, message, type, action, duration }]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const signInWithEmail = async (email: string, password: string): Promise<LoginResult> => {
    setToasts([]);
    const res = await authService.signInWithEmail(email, password);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      updateRoute(getDefaultRouteForRole(res.user.role));
    } else {
      showToast('Authentication Failed', res.errorMessage || 'Invalid email or password', 'error');
    }
    return res;
  };

  const signUpWithEmail = async (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    department?: string;
  }): Promise<LoginResult> => {
    setToasts([]);
    const res = await authService.signUpWithEmail(data);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      showToast(
        'Account Created Successfully',
        `Welcome to GNT Workboard, ${res.user.name}!`,
        'success'
      );
      updateRoute(getDefaultRouteForRole(res.user.role));
    } else {
      showToast('Registration Failed', res.errorMessage || 'Unable to create account', 'error');
    }
    return res;
  };

  const login = async (userId: string, pin: string): Promise<LoginResult> => {
    setToasts([]);
    const res = await authService.login(userId, pin);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      updateRoute(getDefaultRouteForRole(res.user.role));
    } else {
      showToast('Authentication Failed', res.errorMessage || 'Invalid credentials or PIN entered', 'error');
    }
    return res;
  };

  const logout = async () => {
    setToasts([]);
    await authService.logout();
    setCurrentUser(null);
    updateRoute('/login');
    showToast('Signed Out Successfully', 'Your secure session has ended', 'info');
  };

  const switchUser = async (userId: string) => {
    setToasts([]);
    const user = await authService.switchUser(userId);
    if (user) {
      setCurrentUser(user);
      showToast(
        'Workspace Role Switched',
        `Now operating as ${user.name} (${user.role})`,
        'info'
      );
      updateRoute(getDefaultRouteForRole(user.role));
    }
  };

  const navigateTo = (route: string, filterParams?: Record<string, any>) => {
    if (filterParams) {
      setTaskFilterState((prev: any) => ({ ...prev, ...filterParams }));
    }
    updateRoute(route);
  };

  const openTaskDetail = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (activeRoute === '/notifications') {
      const defaultTasksRoute = currentUser
        ? getDefaultRouteForRole(currentUser.role)
        : '/employee/tasks';
      updateRoute(defaultTasksRoute);
    }
  };

  const closeTaskDetail = () => {
    setSelectedTaskId(null);
  };

  // Task Actions
  const createTask = async (data: any) => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };
    const res = await taskService.createTask(data, currentUser);
    if (res.success && res.task) {
      const created = res.task;
      await refreshAllState();
      showToast(
        'Task Created Successfully',
        `"${created.title}" assigned to ${created.assignedEmployeeName}`,
        'success',
        {
          label: 'View Task',
          onClick: () => setSelectedTaskId(created.id),
        }
      );
    } else if (res.success) {
      await refreshAllState();
      showToast('Task Created Successfully', res.message, 'success');
    } else {
      showToast('Task Creation Failed', res.message, 'error');
    }
    return res;
  };

  const employeeUpdateTask = async (taskId: string, updates: any) => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };
    const res = await taskService.employeeUpdateTask(taskId, updates, currentUser);
    if (res.success && res.task) {
      const updated = res.task;
      // Immediately update local tasks state so UI reflects the change at once
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      await refreshAllState();
      showToast(
        'Task Progress Updated',
        `"${updated.title}" marked as ${updated.status.replace('_', ' ')} (${updated.progress}%)`,
        'success',
        {
          label: 'View Task',
          onClick: () => setSelectedTaskId(updated.id),
        }
      );
    } else if (res.success) {
      await refreshAllState();
      showToast('Task Updated', res.message, 'success');
    } else {
      showToast('Update Failed', res.message, 'error');
    }
    return res;
  };

  const updateTaskMetadata = async (taskId: string, updates: any) => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };
    const res = await taskService.updateTaskMetadata(taskId, updates, currentUser);
    if (res.success && res.task) {
      const updated = res.task;
      // Immediately update local tasks state so all roles see the change at once
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      await refreshAllState();
      showToast(
        'Task Updated Successfully',
        `Saved modifications to "${updated.title}"`,
        'success',
        {
          label: 'View Task',
          onClick: () => setSelectedTaskId(updated.id),
        }
      );
    } else if (res.success) {
      await refreshAllState();
      showToast('Task Configured', res.message, 'success');
    } else {
      showToast('Update Failed', res.message, 'error');
    }
    return res;
  };

  const deleteTask = async (taskId: string) => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };
    const targetTask = tasks.find((t) => t.id === taskId);
    const res = await taskService.deleteTask(taskId, currentUser);
    if (res.success) {
      await refreshAllState();
      showToast(
        'Task Deleted Successfully',
        targetTask ? `"${targetTask.title}" was permanently removed from project` : res.message,
        'info'
      );
      if (selectedTaskId === taskId) setSelectedTaskId(null);
    } else {
      showToast('Delete Failed', res.message, 'error');
    }
    return res;
  };

  // User Actions
  const createUser = async (data: any) => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };
    const res = await userService.createUser(data, currentUser);
    if (res.success && res.user) {
      showToast(
        'Team Member Added Successfully',
        `Account created for ${res.user.name} with ${res.user.role} role`,
        'success'
      );
    } else if (res.success) {
      showToast('Team Member Added', res.message, 'success');
    } else {
      showToast('Account Creation Failed', res.message, 'error');
    }
    return res;
  };

  const updateUser = async (
    userId: string,
    updates: Partial<Omit<User, 'id' | 'createdAt'>>
  ) => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };
    const res = await userService.updateUser(userId, updates, currentUser);
    if (res.success && res.user) {
      showToast('Employee Updated Successfully', res.message, 'success');
      if (currentUser.id === userId) {
        setCurrentUser(res.user);
      }
    } else {
      showToast('Update Failed', res.message, 'error');
    }
    return res;
  };

  const toggleUserActive = async (userId: string) => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };
    const targetUser = users.find((u) => u.id === userId);
    const res = await userService.toggleUserActive(userId, currentUser);
    if (res.success) {
      showToast(
        'Account Status Changed',
        targetUser ? `${targetUser.name} is now ${targetUser.active ? 'deactivated' : 'activated'}` : res.message,
        'info'
      );
    } else {
      showToast('Action Prohibited', res.message, 'error');
    }
    return res;
  };

  const resetUserPin = async (userId: string, newPin: string) => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };
    const targetUser = users.find((u) => u.id === userId);
    const res = await userService.resetPin(userId, newPin, currentUser);
    if (res.success) {
      await refreshAllState();
      showToast(
        'Security PIN Reset Successfully',
        targetUser ? `PIN updated for ${targetUser.name}` : res.message,
        'success'
      );
    } else {
      showToast('PIN Reset Failed', res.message, 'error');
    }
    return res;
  };

  const changeUserRole = async (userId: string, newRole: UserRole) => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };
    const res = await userService.changeUserRole(userId, newRole, currentUser);
    if (res.success) {
      showToast('Role Updated', res.message, 'success');
      // If current user modified their own role, update currentUser state
      if (currentUser.id === userId && res.user) {
        setCurrentUser(res.user);
      }
    } else {
      showToast('Action Prohibited', res.message, 'error');
    }
    return res;
  };

  const deleteUser = async (userId: string) => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };
    const res = await userService.deleteUser(userId, currentUser);
    if (res.success) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setTasks(storageService.getTasks());
      showToast('Employee Deleted', res.message, 'success');
      await refreshAllState();
    } else {
      showToast('Delete Failed', res.message, 'error');
    }
    return res;
  };

  // Project Actions
  const createProject = async (data: any) => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };
    const res = await projectService.createProject(data, currentUser);
    if (res.success) {
      showToast(
        'Project Created Successfully',
        `"${data.projectName}" registered for client "${data.clientName}"`,
        'success'
      );
    } else {
      showToast('Project Creation Failed', res.message, 'error');
    }
    return res;
  };

  const updateProject = async (id: string, updates: any) => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };
    const res = await projectService.updateProject(id, updates, currentUser);
    if (res.success) {
      showToast(
        'Project Updated Successfully',
        res.message || 'Project specifications and timeline saved',
        'success'
      );
    } else {
      showToast('Update Failed', res.message, 'error');
    }
    return res;
  };

  const deleteProject = async (id: string) => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };
    const proj = projects.find((p) => p.id === id);
    const res = await projectService.deleteProject(id, currentUser);
    if (res.success) {
      showToast(
        'Project Removed Successfully',
        proj ? `"${proj.projectName}" was deleted` : res.message,
        'info'
      );
    } else {
      showToast('Action Prohibited', res.message, 'warning');
    }
    return res;
  };

  // Notification Actions
  const markNotificationRead = async (id: string) => {
    await notificationService.markAsRead(id);
    refreshAllState();
  };

  const markAllNotificationsRead = async () => {
    if (currentUser) {
      const count = unreadNotificationCount;
      await notificationService.markAllAsRead(currentUser.id);
      showToast(
        'All Notifications Read',
        `${count} notice${count === 1 ? '' : 's'} marked as read`,
        'info'
      );
      refreshAllState();
    }
  };

  const deleteNotification = async (id: string) => {
    await notificationService.deleteNotification(id);
    refreshAllState();
  };

  const clearNotifications = async (readOnly: boolean = false) => {
    if (currentUser) {
      await notificationService.clearNotifications(currentUser.id, readOnly);
      showToast(
        'Notifications Cleared',
        readOnly ? 'Cleared read notifications' : 'Cleared all notifications',
        'info'
      );
      refreshAllState();
    }
  };

  const resetToDemoData = () => {
    storageService.resetToSeedData();
    showToast('Demo Environment Restored', 'All initial GNT enterprise demo data loaded', 'success');
    updateRoute('/login');
  };

  const unreadNotificationCount = currentUser
    ? notifications.filter((n) => n.userId === currentUser.id && !n.read).length
    : 0;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        projects,
        tasks,
        activities,
        notifications,
        unreadNotificationCount,
        toasts,
        activeRoute,
        selectedTaskId,
        taskFilterState,
        login,
        signInWithEmail,
        signUpWithEmail,
        logout,
        switchUser,
        navigateTo,
        openTaskDetail,
        closeTaskDetail,
        setTaskFilterState,
        showToast,
        dismissToast,
        createTask,
        employeeUpdateTask,
        updateTaskMetadata,
        deleteTask,
        createUser,
        updateUser,
        toggleUserActive,
        resetUserPin,
        changeUserRole,
        deleteUser,
        createProject,
        updateProject,
        deleteProject,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearNotifications,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
