import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { useApp } from '../../context/AppContext';
import { StatusBadge, PriorityBadge } from '../ui/StatusBadge';
import { EmptyState } from '../ui/EmptyState';
import { getLocalDateString } from '../../utils/dateUtils';
import { isTaskAssignedToUser, findUserByIdentifier } from '../../utils/identityUtils';
import {
  Search,
  Filter,
  CheckSquare,
  AlertCircle,
  Eye,
  Edit2,
  Calendar,
  User as UserIcon,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  onOpenCreateTask?: () => void;
  onOpenEmployeeUpdate: (task: Task) => void;
  onOpenEditTask: (task: Task) => void;
  isEmployeeView?: boolean;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  onOpenCreateTask,
  onOpenEmployeeUpdate,
  onOpenEditTask,
  isEmployeeView = false,
}) => {
  const {
    openTaskDetail,
    users,
    projects,
    currentUser,
    taskFilterState,
    setTaskFilterState,
    showToast,
  } = useApp();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(25);

  const todayStr = getLocalDateString();

  // Reset to page 1 whenever filters or tasks array change
  useEffect(() => {
    setCurrentPage(1);
  }, [taskFilterState, tasks]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskFilterState((prev: any) => ({ ...prev, search: e.target.value }));
  };

  const handleStatusFilterChange = (status: string) => {
    setTaskFilterState((prev: any) => ({ ...prev, status }));
  };

  const handlePriorityFilterChange = (priority: string) => {
    setTaskFilterState((prev: any) => ({ ...prev, priority }));
  };

  const handleEmployeeFilterChange = (employeeId: string) => {
    setTaskFilterState((prev: any) => ({ ...prev, employeeId }));
  };

  const handleProjectFilterChange = (projectId: string) => {
    setTaskFilterState((prev: any) => ({ ...prev, projectId }));
  };

  const handleQuickFilterChange = (quickFilter: string) => {
    setTaskFilterState((prev: any) => {
      if (quickFilter === 'today') {
        return { ...prev, quickFilter, dueDate: todayStr };
      }
      return { ...prev, quickFilter, dueDate: '' };
    });
  };

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskFilterState((prev: any) => ({ ...prev, dueDate: e.target.value }));
  };

  const handleClearDateFilter = () => {
    setTaskFilterState((prev: any) => ({ ...prev, dueDate: '' }));
  };

  const handleResetFilters = () => {
    setTaskFilterState({
      status: 'ALL',
      priority: 'ALL',
      quickFilter: 'all',
      employeeId: '',
      projectId: '',
      search: '',
      dueDate: '',
    });
    showToast('Filters Cleared', 'Task view reset to all deliverables', 'info');
  };

  // Filter tasks based on current filter state
  let filtered = tasks.filter((t) => {
    if (taskFilterState.search && taskFilterState.search.trim()) {
      const q = taskFilterState.search.toLowerCase().trim();
      const match =
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.projectName.toLowerCase().includes(q) ||
        t.clientName.toLowerCase().includes(q) ||
        (t.assignedEmployeeName && t.assignedEmployeeName.toLowerCase().includes(q)) ||
        t.nextAction.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (taskFilterState.dueDate && taskFilterState.dueDate.trim()) {
      const selectedDate = taskFilterState.dueDate.trim();
      const matchesDueDate = (t.dueDate || '') === selectedDate;
      const matchesCreated = t.createdAt && getLocalDateString(t.createdAt) === selectedDate;
      if (!matchesDueDate && !matchesCreated) return false;
    }

    if (taskFilterState.status && taskFilterState.status !== 'ALL') {
      if (t.status !== taskFilterState.status) return false;
    }

    if (taskFilterState.priority && taskFilterState.priority !== 'ALL') {
      if (t.priority !== taskFilterState.priority) return false;
    }

    if (!isEmployeeView && taskFilterState.employeeId) {
      const targetUser = users.find((u) => u.id === taskFilterState.employeeId) || findUserByIdentifier(users, taskFilterState.employeeId);
      if (targetUser) {
        if (!isTaskAssignedToUser(t, targetUser)) return false;
      } else if (t.assignedEmployeeId !== taskFilterState.employeeId) {
        return false;
      }
    }

    if (taskFilterState.projectId) {
      if (t.projectId !== taskFilterState.projectId) return false;
    }

    const currentQuickFilter = taskFilterState.quickFilter || 'all';
    if (currentQuickFilter === 'active') {
      if (t.status === 'DONE' || (t.progress ?? 0) >= 100) {
        return false;
      }
    } else if (currentQuickFilter === 'today') {
      if (!t.dueDate || t.dueDate !== todayStr || t.status === 'DONE') {
        return false;
      }
    } else if (currentQuickFilter === 'overdue') {
      if (!t.dueDate || t.dueDate >= todayStr || t.status === 'DONE') {
        return false;
      }
    } else if (currentQuickFilter === 'upcoming') {
      if (!t.dueDate || t.dueDate <= todayStr || t.status === 'DONE') {
        return false;
      }
    } else if (currentQuickFilter === 'blocked') {
      if (t.status !== 'BLOCKED') {
        return false;
      }
    } else if (currentQuickFilter === 'completed') {
      if (t.status !== 'DONE') {
        return false;
      }
    }

    return true;
  });

  const canManageTask = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  // Helper to test if a task matches current toolbar filters (with optional overrides)
  const matchesToolbarFilters = (t: Task, overrides?: { ignoreDueDate?: boolean; ignoreStatus?: boolean }) => {
    if (taskFilterState.search && taskFilterState.search.trim()) {
      const q = taskFilterState.search.toLowerCase().trim();
      const match =
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.projectName.toLowerCase().includes(q) ||
        t.clientName.toLowerCase().includes(q) ||
        (t.assignedEmployeeName && t.assignedEmployeeName.toLowerCase().includes(q)) ||
        t.nextAction.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (!isEmployeeView && taskFilterState.employeeId) {
      const targetUser = users.find((u) => u.id === taskFilterState.employeeId) || findUserByIdentifier(users, taskFilterState.employeeId);
      if (targetUser) {
        if (!isTaskAssignedToUser(t, targetUser)) return false;
      } else if (t.assignedEmployeeId !== taskFilterState.employeeId) {
        return false;
      }
    }
    if (taskFilterState.projectId && t.projectId !== taskFilterState.projectId) return false;
    if (taskFilterState.priority && taskFilterState.priority !== 'ALL' && t.priority !== taskFilterState.priority) return false;

    if (!overrides?.ignoreStatus && taskFilterState.status && taskFilterState.status !== 'ALL') {
      if (t.status !== taskFilterState.status) return false;
    }

    if (!overrides?.ignoreDueDate && taskFilterState.dueDate && taskFilterState.dueDate.trim()) {
      const selectedDate = taskFilterState.dueDate.trim();
      const matchesDueDate = (t.dueDate || '') === selectedDate;
      const matchesCreated = t.createdAt && getLocalDateString(t.createdAt) === selectedDate;
      if (!matchesDueDate && !matchesCreated) return false;
    }

    return true;
  };

  // Base tasks matching all currently active toolbar filters
  const contextFilteredTasks = tasks.filter((t) => matchesToolbarFilters(t));

  const quickFilterTabs = [
    {
      id: 'all',
      label: 'All',
      count: contextFilteredTasks.length,
    },
    {
      id: 'active',
      label: 'Active',
      count: tasks.filter(
        (t) =>
          matchesToolbarFilters(t, { ignoreStatus: true }) &&
          t.status !== 'DONE' &&
          (t.progress ?? 0) < 100
      ).length,
    },
    {
      id: 'today',
      label: 'Due Today',
      count: tasks.filter(
        (t) =>
          matchesToolbarFilters(t, { ignoreDueDate: true }) &&
          t.dueDate &&
          t.dueDate === todayStr &&
          t.status !== 'DONE'
      ).length,
    },
    {
      id: 'overdue',
      label: 'Overdue',
      count: tasks.filter(
        (t) =>
          matchesToolbarFilters(t, { ignoreDueDate: true }) &&
          t.dueDate &&
          t.dueDate < todayStr &&
          t.status !== 'DONE'
      ).length,
    },
    {
      id: 'blocked',
      label: 'Blocked',
      count: tasks.filter(
        (t) => matchesToolbarFilters(t, { ignoreStatus: true }) && t.status === 'BLOCKED'
      ).length,
    },
    {
      id: 'completed',
      label: 'Delivered',
      count: tasks.filter(
        (t) => matchesToolbarFilters(t, { ignoreStatus: true }) && t.status === 'DONE'
      ).length,
    },
  ];

  const totalItems = filtered.length;
  const itemsPerPage = pageSize === 'ALL' ? totalItems || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (validPage - 1) * (pageSize === 'ALL' ? totalItems : pageSize);
  const paginatedTasks = pageSize === 'ALL' ? filtered : filtered.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      {/* Quick Filter Pill Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/60 shrink-0">
          {quickFilterTabs.map((tab) => {
            const isActive = (taskFilterState.quickFilter || 'all') === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-filter-${tab.id}`}
                onClick={() => handleQuickFilterChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 hidden sm:block shrink-0">
          Showing <strong>{filtered.length}</strong> of <strong>{contextFilteredTasks.length}</strong> tasks
          {contextFilteredTasks.length !== tasks.length && (
            <span className="text-slate-400 text-[11px] ml-1">({tasks.length} total)</span>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-task-search"
            type="text"
            placeholder="Search by task title, client, owner, or next action..."
            value={taskFilterState.search || ''}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Dropdown & Date Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter */}
          <div className="relative flex items-center gap-1">
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 pointer-events-none" />
              <input
                id="input-filter-date"
                type="date"
                value={taskFilterState.dueDate || ''}
                onChange={handleDateFilterChange}
                title="Filter by deadline / date"
                className="pl-8 pr-2 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              />
              {taskFilterState.dueDate && (
                <button
                  type="button"
                  onClick={handleClearDateFilter}
                  title="Clear date filter (show all dates)"
                  className="ml-1 px-1.5 py-0.5 text-slate-400 hover:text-slate-700 text-xs font-bold rounded hover:bg-slate-100"
                >
                  ✕
                </button>
              )}
            </div>
            {taskFilterState.dueDate !== todayStr && (
              <button
                type="button"
                onClick={() => setTaskFilterState((prev: any) => ({ ...prev, dueDate: todayStr }))}
                title="Set to today's date"
                className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
              >
                Today
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            id="select-filter-status"
            value={taskFilterState.status || 'ALL'}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DONE">Done</option>
          </select>

          {/* Priority filter */}
          <select
            id="select-filter-priority"
            value={taskFilterState.priority || 'ALL'}
            onChange={(e) => handlePriorityFilterChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Party filter */}
          <select
            id="select-filter-project"
            value={taskFilterState.projectId || ''}
            onChange={(e) => handleProjectFilterChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 max-w-[140px] truncate"
          >
            <option value="">All Parties</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName}
              </option>
            ))}
          </select>

          {/* Employee filter (only visible for Admins and Managers) */}
          {!isEmployeeView && currentUser?.role !== 'EMPLOYEE' && (
            <select
              id="select-filter-employee"
              value={taskFilterState.employeeId || ''}
              onChange={(e) => handleEmployeeFilterChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 max-w-[140px] truncate"
            >
              <option value="">All Owners</option>
              {users
                .filter((u) => u.active)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          )}

          {/* Reset Filters button */}
          {(taskFilterState.search ||
            taskFilterState.dueDate ||
            taskFilterState.status !== 'ALL' ||
            taskFilterState.priority !== 'ALL' ||
            taskFilterState.employeeId ||
            taskFilterState.projectId ||
            taskFilterState.quickFilter !== 'all') && (
            <button
              onClick={handleResetFilters}
              title="Reset all filters"
              className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs flex items-center gap-1 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Task List / Table Card */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks match criteria"
          description="Adjust your search keywords, remove filters, or create a new task to get started."
          actionLabel={canManageTask ? '+ Create New Task' : undefined}
          onAction={onOpenCreateTask}
        />
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table id="table-tasks-list" className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-200/80 text-[11px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Task & Party</th>
                  <th className="py-3 px-3 font-semibold">Owner</th>
                  <th className="py-3 px-3 font-semibold">Priority</th>
                  <th className="py-3 px-3 font-semibold">Assigned Date & Time</th>
                  <th className="py-3 px-3 font-semibold">Deadline</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">Progress</th>
                  <th className="py-3 px-4 font-semibold min-w-[200px]">Next Action</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTasks.map((task) => {
                  const isOverdue = !!(task.dueDate && task.dueDate < todayStr && task.status !== 'DONE');
                  const isDueToday = !!(task.dueDate && task.dueDate === todayStr && task.status !== 'DONE');
                  const isBlocked = task.status === 'BLOCKED';
                  const isMine = currentUser?.id === task.assignedEmployeeId;
                  const wasCompletedOverdue =
                    task.status === 'DONE' &&
                    (task.wasOverdue || (task.completedAt && task.dueDate && task.completedAt.split('T')[0] > task.dueDate));

                  const ownerDisplayName = task.assignedEmployeeName || 'Unassigned';
                  const ownerInitials = task.assignedEmployeeName
                    ? task.assignedEmployeeName
                        .split(' ')
                        .filter(Boolean)
                        .map((s) => s[0])
                        .join('')
                        .slice(0, 2)
                    : '--';

                  let delayText = 'Delayed';
                  if (wasCompletedOverdue && task.completedAt && task.dueDate) {
                    const d1 = new Date(task.dueDate);
                    const d2 = new Date(task.completedAt.split('T')[0]);
                    const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays > 0) {
                      delayText = `Delayed by ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
                    }
                  }

                  let overdueText = 'Overdue';
                  if (isOverdue && task.dueDate) {
                    const d1 = new Date(task.dueDate);
                    const d2 = new Date(todayStr);
                    const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays > 0) {
                      overdueText = `Overdue by ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
                    }
                  }

                  return (
                    <tr
                      key={task.id}
                      id={`task-row-${task.id}`}
                      className={`hover:bg-slate-50/70 transition-colors group ${
                        isOverdue ? 'bg-rose-50/20' : isBlocked ? 'bg-amber-50/15' : ''
                      }`}
                    >
                      {/* Title & Project */}
                      <td className="py-3 px-4 max-w-[280px]">
                        <div
                          onClick={() => openTaskDetail(task.id)}
                          className="cursor-pointer"
                        >
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
                            <span className="font-semibold text-slate-700">{task.projectName}</span>
                            <span>•</span>
                            <span className="text-slate-400">{task.clientName}</span>
                          </div>
                        </div>

                        {/* Blocker alert if blocked */}
                        {isBlocked && task.blocker && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60 max-w-fit truncate">
                            <AlertCircle className="w-3 h-3 shrink-0 text-rose-600" />
                            <span className="truncate">Blocker: {task.blocker}</span>
                          </div>
                        )}
                      </td>

                      {/* Owner */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-200/70">
                            {ownerInitials}
                          </span>
                          <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                            {ownerDisplayName}
                          </span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3">
                        <PriorityBadge priority={task.priority} />
                      </td>

                      {/* Assigned Date & Time */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {task.createdAt ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-600">
                              {task.createdAt.split('T')[0]}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                              {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium text-slate-600">N/A</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          {task.dueDate ? (
                            <span
                              className={`font-semibold ${
                                isOverdue
                                  ? 'text-rose-600'
                                  : isDueToday
                                  ? 'text-amber-700'
                                  : 'text-slate-700'
                              }`}
                            >
                              {task.dueDate}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal text-xs italic">
                              No deadline
                            </span>
                          )}
                          {isOverdue && (
                            <span className="text-[10px] font-bold text-rose-600 uppercase">
                              {overdueText}
                            </span>
                          )}
                          {isDueToday && (
                            <span className="text-[10px] font-bold text-amber-700 uppercase">
                              Due Today
                            </span>
                          )}
                          {wasCompletedOverdue && (
                            <span className="text-[9px] font-bold text-amber-800 uppercase bg-amber-100/80 px-1 py-0.2 rounded border border-amber-200/70 max-w-fit mt-0.5" title="Task was completed past original deadline">
                              {delayText}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={task.status} wasOverdue={wasCompletedOverdue} />
                      </td>

                      {/* Progress */}
                      <td className="py-3 px-3 min-w-[100px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                task.status === 'DONE'
                                ? 'bg-emerald-500'
                                : task.progress > 50
                                ? 'bg-blue-600'
                                : 'bg-indigo-500'
                              }`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 w-8 text-right">
                            {task.progress}%
                          </span>
                        </div>
                      </td>

                      {/* Next Action (Crucial principle) */}
                      <td className="py-3 px-4 max-w-[240px]">
                        <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-800 text-[11px] leading-snug">
                          <span className="font-semibold text-blue-800 mr-1">Next:</span>
                          <span className="text-slate-700">{task.nextAction}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-view-task-${task.id}`}
                            onClick={() => openTaskDetail(task.id)}
                            title="View Detail & Audit Log"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Employee update button */}
                          {(isMine || canManageTask) && (
                            <button
                              id={`btn-update-task-${task.id}`}
                              onClick={() => onOpenEmployeeUpdate(task)}
                              title="Update Status / Progress / Next Action"
                              className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <span>Update</span>
                            </button>
                          )}

                          {/* Full Edit button (Admin/Manager) */}
                          {canManageTask && (
                            <button
                              id={`btn-edit-task-${task.id}`}
                              onClick={() => onOpenEditTask(task)}
                              title="Configure Assignment / Priority / Due Date"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Showing</span>
              <span className="font-bold text-slate-900">
                {totalItems === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + (pageSize === 'ALL' ? totalItems : pageSize), totalItems)}
              </span>
              <span>of</span>
              <span className="font-bold text-slate-900">{totalItems}</span>
              <span>deliverables</span>

              <div className="ml-2 flex items-center gap-1.5">
                <span className="text-slate-400">|</span>
                <span className="text-slate-500">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="ALL">All</option>
                </select>
              </div>
            </div>

            {pageSize !== 'ALL' && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  disabled={validPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2.5 font-semibold text-slate-700">
                  Page {validPage} of {totalPages}
                </span>
                <button
                  disabled={validPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
