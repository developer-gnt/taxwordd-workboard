import { Task, TaskStatus, TaskPriority, User, TaskAttachment } from '../types';
import { storageService } from './storageService';
import { authService } from './authService';
import { activityService } from './activityService';
import { notificationService } from './notificationService';
import { getLocalDateString } from '../utils/dateUtils';
import { generateId } from '../utils/idUtils';

export interface TaskFilterOptions {
  search?: string;
  status?: TaskStatus | 'ALL';
  priority?: TaskPriority | 'ALL';
  employeeId?: string;
  projectId?: string;
  quickFilter?: 'all' | 'today' | 'upcoming' | 'overdue' | 'blocked' | 'completed';
}

class TaskService {
  public async getTasks(filter?: TaskFilterOptions): Promise<Task[]> {
    let tasks = storageService.getTasks();
    const todayStr = getLocalDateString();

    if (!filter) {
      return tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    // Search text across title, description, project, client, employee, next action
    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.projectName.toLowerCase().includes(q) ||
          t.clientName.toLowerCase().includes(q) ||
          t.assignedEmployeeName.toLowerCase().includes(q) ||
          t.nextAction.toLowerCase().includes(q)
      );
    }

    if (filter.status && filter.status !== 'ALL') {
      tasks = tasks.filter((t) => t.status === filter.status);
    }

    if (filter.priority && filter.priority !== 'ALL') {
      tasks = tasks.filter((t) => t.priority === filter.priority);
    }

    if (filter.employeeId) {
      tasks = tasks.filter((t) => t.assignedEmployeeId === filter.employeeId);
    }

    if (filter.projectId) {
      tasks = tasks.filter((t) => t.projectId === filter.projectId);
    }

    if (filter.quickFilter) {
      switch (filter.quickFilter) {
        case 'today':
          tasks = tasks.filter((t) => t.dueDate && t.dueDate === todayStr && t.status !== 'DONE');
          break;
        case 'overdue':
          tasks = tasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'DONE');
          break;
        case 'upcoming':
          tasks = tasks.filter((t) => t.dueDate && t.dueDate > todayStr && t.status !== 'DONE');
          break;
        case 'blocked':
          tasks = tasks.filter((t) => t.status === 'BLOCKED');
          break;
        case 'completed':
          tasks = tasks.filter((t) => t.status === 'DONE');
          break;
        default:
          break;
      }
    }

    return tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // Get single task by ID
  public async getTaskById(taskId: string): Promise<Task | null> {
    const tasks = storageService.getTasks();
    return tasks.find((t) => t.id === taskId) || null;
  }

  // Create new task (Admin & Manager role check)
  public async createTask(
    data: {
      title: string;
      description?: string;
      projectId: string;
      assignedEmployeeId?: string;
      priority: TaskPriority;
      dueDate?: string;
      nextAction?: string;
      notes?: string;
      referenceLink?: string;
      estimatedEffort?: string;
      expectedCompletionDate?: string;
      attachments?: TaskAttachment[];
    },
    actor: User
  ): Promise<{ success: boolean; message: string; task?: Task }> {
    if (!authService.canCreateTask(actor)) {
      return { success: false, message: 'Unauthorized: Only Admins and Managers can create tasks.' };
    }

    if (!data.title?.trim()) {
      return { success: false, message: 'Task title is required.' };
    }

    if (!data.projectId?.trim()) {
      return { success: false, message: 'Project selection is required.' };
    }

    const projects = storageService.getProjects();
    const cleanProjectInput = data.projectId.trim();
    let project = projects.find((p) => p.id === cleanProjectInput);
    if (!project) {
      project = projects.find(
        (p) =>
          p.projectName.toLowerCase() === cleanProjectInput.toLowerCase() ||
          `${p.projectName} (${p.clientName})`.toLowerCase() === cleanProjectInput.toLowerCase()
      );
    }
    if (!project && cleanProjectInput) {
      let pName = cleanProjectInput;
      let cName = 'Internal Ops';
      const match = cleanProjectInput.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        pName = match[1].trim();
        cName = match[2].trim();
      }
      project = {
        id: `proj-${Date.now()}`,
        projectName: pName,
        clientName: cName,
        status: 'ACTIVE',
        description: `Project for task: ${data.title.trim()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await storageService.saveProject(project);
    }

    const users = storageService.getUsers();
    let assignedUser: User | undefined = undefined;
    if (data.assignedEmployeeId && data.assignedEmployeeId.trim()) {
      const cleanAssigneeInput = data.assignedEmployeeId.trim();
      assignedUser = users.find(
        (u) =>
          u.id === cleanAssigneeInput ||
          u.email.toLowerCase() === cleanAssigneeInput.toLowerCase() ||
          u.name.toLowerCase() === cleanAssigneeInput.toLowerCase() ||
          cleanAssigneeInput.toLowerCase().startsWith(u.name.toLowerCase())
      );
    }

    const cleanDueDate = data.dueDate && data.dueDate.trim() ? data.dueDate.trim() : '';
    const cleanExpected = data.expectedCompletionDate && data.expectedCompletionDate.trim()
      ? data.expectedCompletionDate.trim()
      : (cleanDueDate || undefined);

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      projectId: project.id,
      projectName: project.projectName,
      clientName: project.clientName,
      assignedEmployeeId: assignedUser?.id || data.assignedEmployeeId?.trim() || '',
      assignedEmployeeName: assignedUser?.name || 'Unassigned',
      createdById: actor.id,
      createdByName: actor.name,
      priority: data.priority,
      dueDate: cleanDueDate,
      status: 'NOT_STARTED',
      progress: 0,
      nextAction: data.nextAction?.trim() || '',
      notes: data.notes?.trim() || '',
      referenceLink: data.referenceLink?.trim() || '',
      estimatedEffort: data.estimatedEffort?.trim() || '',
      expectedCompletionDate: cleanExpected,
      attachments: data.attachments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storageService.saveTask(newTask);

    // Record activity
    await activityService.recordActivity({
      taskId: newTask.id,
      taskTitle: newTask.title,
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: assignedUser ? `Task created and assigned to ${assignedUser.name}` : `Task created (Unassigned)`,
      newValue: assignedUser?.name || 'Unassigned',
    });

    // Notify assigned employee if assigned
    if (assignedUser) {
      await notificationService.createNotification({
        userId: assignedUser.id,
        type: 'NEW_TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `${actor.name} assigned you "${newTask.title}".${newTask.dueDate ? ` Deadline: ${newTask.dueDate}.` : ''}`,
        taskId: newTask.id,
        read: false,
      });
    }

    return { success: true, message: `Task "${newTask.title}" created successfully.`, task: newTask };
  }

  // Employee self-update workflow (status, progress, blocker, next action, expected completion date, notes)
  public async employeeUpdateTask(
    taskId: string,
    updates: {
      status?: TaskStatus;
      progress?: number;
      blocker?: string;
      nextAction?: string;
      notes?: string;
      expectedCompletionDate?: string;
    },
    actor: User
  ): Promise<{ success: boolean; message: string; task?: Task }> {
    const tasks = storageService.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return { success: false, message: 'Task not found.' };

    const currentTask = tasks[taskIndex];

    if (!authService.canEmployeeUpdate(actor, currentTask)) {
      return { success: false, message: 'Unauthorized: You can only update tasks assigned directly to you.' };
    }

    // Business Rule Check: Blocked status requires mandatory blocker reason
    const newStatus = updates.status || currentTask.status;
    if (newStatus === 'BLOCKED') {
      const blockerReason = updates.blocker !== undefined ? updates.blocker : currentTask.blocker;
      if (!blockerReason || !blockerReason.trim()) {
        return { success: false, message: 'A specific Blocker Reason is mandatory when marking a task as Blocked.' };
      }
    }

    // Progress validation
    let newProgress = updates.progress !== undefined ? updates.progress : currentTask.progress;
    if (newProgress < 0) newProgress = 0;
    if (newProgress > 100) newProgress = 100;

    let completedAt = currentTask.completedAt;
    let completedBy = currentTask.completedBy;

    let wasOverdue = currentTask.wasOverdue;

    // Done status handling
    if (newStatus === 'DONE') {
      newProgress = 100;
      if (!completedAt) {
        completedAt = new Date().toISOString();
        completedBy = actor.name;
      }
      const todayStr = getLocalDateString();
      if (currentTask.dueDate && currentTask.dueDate < todayStr) {
        wasOverdue = true;
      }
    } else if (currentTask.status === 'DONE') {
      // Reopening completed task
      completedAt = undefined;
      completedBy = undefined;
      wasOverdue = undefined;
    }

    const updatedTask: Task = {
      ...currentTask,
      status: newStatus,
      progress: newProgress,
      blocker: newStatus === 'BLOCKED' ? (updates.blocker ?? currentTask.blocker)?.trim() : undefined,
      nextAction: updates.nextAction !== undefined ? updates.nextAction.trim() : currentTask.nextAction,
      notes: updates.notes !== undefined ? updates.notes.trim() : currentTask.notes,
      expectedCompletionDate: updates.expectedCompletionDate ?? currentTask.expectedCompletionDate,
      completedAt,
      completedBy,
      wasOverdue,
      updatedAt: new Date().toISOString(),
    };

    tasks[taskIndex] = updatedTask;
    await storageService.saveTask(updatedTask);

    // Record specific activities
    if (updates.status && updates.status !== currentTask.status) {
      await activityService.recordActivity({
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role,
        action: `Status changed to ${updates.status.replace('_', ' ')}`,
        previousValue: currentTask.status,
        newValue: updates.status,
      });

      // Notify ALL admins and managers of every status change
      const allUsers = storageService.getUsers();
      const adminsAndManagers = allUsers.filter((u) => u.role === 'ADMIN' || u.role === 'MANAGER');

      for (const recipient of adminsAndManagers) {
        if (updates.status === 'DONE') {
          await notificationService.createNotification({
            userId: recipient.id,
            type: 'COMPLETED',
            title: '✅ Task Completed',
            message: `${actor.name} completed "${updatedTask.title}" (${updatedTask.projectName}).`,
            taskId: updatedTask.id,
            read: false,
          });
        } else if (updates.status === 'BLOCKED') {
          await notificationService.createNotification({
            userId: recipient.id,
            type: 'BLOCKED',
            title: '🚨 Task Blocked',
            message: `${actor.name} blocked "${updatedTask.title}": ${updatedTask.blocker}`,
            taskId: updatedTask.id,
            read: false,
          });
        } else if (updates.status === 'REVIEW') {
          await notificationService.createNotification({
            userId: recipient.id,
            type: 'RETURNED_FOR_REVIEW',
            title: '👀 Task Submitted for Review',
            message: `${actor.name} submitted "${updatedTask.title}" for your review.`,
            taskId: updatedTask.id,
            read: false,
          });
        } else {
          await notificationService.createNotification({
            userId: recipient.id,
            type: 'STATUS_CHANGE',
            title: '🔄 Task Status Updated',
            message: `${actor.name} updated "${updatedTask.title}" → ${updates.status!.replace('_', ' ')} (${updatedTask.projectName}).`,
            taskId: updatedTask.id,
            read: false,
          });
        }
      }
    }

    if (updates.progress !== undefined && updates.progress !== currentTask.progress) {
      await activityService.recordActivity({
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role,
        action: `Progress updated from ${currentTask.progress}% to ${newProgress}%`,
        previousValue: `${currentTask.progress}%`,
        newValue: `${newProgress}%`,
      });
    }

    if (updates.nextAction && updates.nextAction !== currentTask.nextAction) {
      await activityService.recordActivity({
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role,
        action: `Updated next action: "${updates.nextAction.trim()}"`,
        previousValue: currentTask.nextAction,
        newValue: updates.nextAction.trim(),
      });
    }

    return { success: true, message: 'Task updated successfully.', task: updatedTask };
  }

  // Full management update (Admin and Manager)
  public async updateTaskMetadata(
    taskId: string,
    updates: Partial<Omit<Task, 'id' | 'createdAt'>>,
    actor: User
  ): Promise<{ success: boolean; message: string; task?: Task }> {
    if (!authService.canEditTaskMetadata(actor)) {
      return { success: false, message: 'Unauthorized: Only Admins and Managers can edit core task configuration.' };
    }

    const tasks = storageService.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return { success: false, message: 'Task not found.' };

    const currentTask = tasks[taskIndex];

    // Reassignment check
    const isReassigned = updates.assignedEmployeeId !== undefined && updates.assignedEmployeeId !== currentTask.assignedEmployeeId;
    let newAssigneeName = currentTask.assignedEmployeeName;

    if (isReassigned) {
      if (updates.assignedEmployeeId && updates.assignedEmployeeId.trim()) {
        const users = storageService.getUsers();
        const cleanAssigneeInput = updates.assignedEmployeeId.trim();
        const newAssignee = users.find(
          (u) =>
            u.id === cleanAssigneeInput ||
            u.email.toLowerCase() === cleanAssigneeInput.toLowerCase() ||
            u.name.toLowerCase() === cleanAssigneeInput.toLowerCase() ||
            cleanAssigneeInput.toLowerCase().startsWith(u.name.toLowerCase())
        );
        if (newAssignee && !newAssignee.active) {
          return { success: false, message: 'Cannot assign task to an inactive user.' };
        }
        newAssigneeName = newAssignee?.name || 'Unassigned';
        updates.assignedEmployeeId = newAssignee?.id || cleanAssigneeInput;
      } else {
        newAssigneeName = 'Unassigned';
        updates.assignedEmployeeId = '';
      }
    }

    // Project change check
    let newProjectName = currentTask.projectName;
    let newClientName = currentTask.clientName;
    if (updates.projectId && updates.projectId !== currentTask.projectId) {
      const projects = storageService.getProjects();
      const cleanInput = updates.projectId.trim();
      let proj = projects.find((p) => p.id === cleanInput);
      if (!proj) {
        proj = projects.find(
          (p) =>
            p.projectName.toLowerCase() === cleanInput.toLowerCase() ||
            `${p.projectName} (${p.clientName})`.toLowerCase() === cleanInput.toLowerCase()
        );
      }
      if (proj) {
        newProjectName = proj.projectName;
        newClientName = proj.clientName;
        updates.projectId = proj.id;
      }
    }

    // Status / Done handling
    const newStatus = updates.status || currentTask.status;
    let newProgress = updates.progress !== undefined ? updates.progress : currentTask.progress;
    let completedAt = currentTask.completedAt;
    let completedBy = currentTask.completedBy;

    if (newStatus === 'BLOCKED') {
      const blockerText = updates.blocker !== undefined ? updates.blocker : currentTask.blocker;
      if (!blockerText || !blockerText.trim()) {
        return { success: false, message: 'A specific Blocker Reason is mandatory when marking a task as Blocked.' };
      }
    }

    let wasOverdue = currentTask.wasOverdue;

    if (newStatus === 'DONE') {
      newProgress = 100;
      if (!completedAt) {
        completedAt = new Date().toISOString();
        completedBy = actor.name;
      }
      const todayStr = getLocalDateString();
      const targetDueDate = updates.dueDate !== undefined ? updates.dueDate : currentTask.dueDate;
      if (targetDueDate && targetDueDate < todayStr) {
        wasOverdue = true;
      }
    } else if (currentTask.status === 'DONE') {
      completedAt = undefined;
      completedBy = undefined;
      wasOverdue = undefined;
    }

    const updatedDueDate = updates.dueDate !== undefined ? (updates.dueDate.trim() || '') : currentTask.dueDate;

    const updatedTask: Task = {
      ...currentTask,
      ...updates,
      dueDate: updatedDueDate,
      projectName: newProjectName,
      clientName: newClientName,
      assignedEmployeeName: newAssigneeName,
      status: newStatus,
      progress: newProgress,
      blocker: newStatus === 'BLOCKED' ? (updates.blocker ?? currentTask.blocker)?.trim() : undefined,
      completedAt,
      completedBy,
      wasOverdue,
      updatedAt: new Date().toISOString(),
    };

    tasks[taskIndex] = updatedTask;
    await storageService.saveTask(updatedTask);

    // Track activity for reassignment
    if (isReassigned) {
      await activityService.recordActivity({
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role,
        action: `Reassigned task from ${currentTask.assignedEmployeeName} to ${newAssigneeName}`,
        previousValue: currentTask.assignedEmployeeName,
        newValue: newAssigneeName,
      });

      await notificationService.createNotification({
        userId: updates.assignedEmployeeId!,
        type: 'NEW_TASK_ASSIGNED',
        title: 'Task Reassigned to You',
        message: `${actor.name} reassigned "${updatedTask.title}" to you. Deadline: ${updatedTask.dueDate}.`,
        taskId: updatedTask.id,
        read: false,
      });
    }

    // Track priority change
    if (updates.priority && updates.priority !== currentTask.priority) {
      await activityService.recordActivity({
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role,
        action: `Priority changed from ${currentTask.priority} to ${updates.priority}`,
        previousValue: currentTask.priority,
        newValue: updates.priority,
      });
    }

    // Track status change
    if (updates.status && updates.status !== currentTask.status) {
      await activityService.recordActivity({
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role,
        action: `Status changed to ${updates.status}`,
        previousValue: currentTask.status,
        newValue: updates.status,
      });
    }

    return { success: true, message: 'Task details updated successfully.', task: updatedTask };
  }

  public async deleteTask(taskId: string, actor: User): Promise<{ success: boolean; message: string }> {
    if (!authService.canDeleteTask(actor)) {
      return { success: false, message: 'Unauthorized: Only Admins can permanently delete tasks.' };
    }

    const tasks = storageService.getTasks();
    const taskToDelete = tasks.find((t) => t.id === taskId);
    if (!taskToDelete) return { success: false, message: 'Task not found.' };

    await storageService.deleteTask(taskId);
    await activityService.recordActivity({
      taskId,
      taskTitle: taskToDelete.title,
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: `Deleted task "${taskToDelete.title}"`,
    });

    return { success: true, message: 'Task deleted successfully.' };
  }
}

export const taskService = new TaskService();
