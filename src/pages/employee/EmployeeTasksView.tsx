import React from 'react';
import { useApp } from '../../context/AppContext';
import { TaskTable } from '../../components/tasks/TaskTable';
import { Task } from '../../types';
import { getLocalDateString } from '../../utils/dateUtils';
import { isTaskAssignedToUser } from '../../utils/identityUtils';
import {
  CheckSquare,
  Clock,
  Calendar,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface EmployeeTasksViewProps {
  onOpenEmployeeUpdate: (task: Task) => void;
}

export const EmployeeTasksView: React.FC<EmployeeTasksViewProps> = ({
  onOpenEmployeeUpdate,
}) => {
  const { tasks, currentUser, openTaskDetail, setTaskFilterState } = useApp();
  const todayStr = getLocalDateString();

  React.useEffect(() => {
    setTaskFilterState({
      status: 'ALL',
      priority: 'ALL',
      quickFilter: 'all',
      employeeId: '',
      projectId: '',
      search: '',
      dueDate: '',
    });
  }, [setTaskFilterState]);

  if (!currentUser) return null;

  // Filter tasks belonging strictly to current employee with canonical identity matching
  const myTasks = tasks.filter((t) => isTaskAssignedToUser(t, currentUser));

  const activeCount = myTasks.filter((t) => t.status !== 'DONE' && (t.progress ?? 0) < 100).length;
  const dueTodayCount = myTasks.filter((t) => t.dueDate && t.dueDate === todayStr && t.status !== 'DONE').length;
  const overdueCount = myTasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'DONE').length;
  const blockedCount = myTasks.filter((t) => t.status === 'BLOCKED').length;
  const completedCount = myTasks.filter((t) => t.status === 'DONE').length;

  const handleKpiFilter = (quickFilter: 'all' | 'active' | 'today' | 'overdue' | 'blocked' | 'completed') => {
    setTaskFilterState((prev: any) => ({
      ...prev,
      quickFilter,
      dueDate: quickFilter === 'today' ? todayStr : '',
      status: quickFilter === 'completed' ? 'DONE' : quickFilter === 'blocked' ? 'BLOCKED' : 'ALL',
    }));
  };

  return (
    <div id="employee-tasks-view" className="space-y-5">
      {/* Top Accountability Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              My Task Ownership & Execution
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliverables assigned exclusively to you • Maintain clear Next Actions and flag blockers early
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400">Accountability Score</span>
            <p className="text-base font-extrabold text-slate-900">
              {myTasks.length > 0
                ? Math.round((completedCount / myTasks.length) * 100)
                : 100}
              % Completed
            </p>
          </div>
        </div>
      </div>

      {/* Quick KPI Stat Strip (Clickable tabs) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => handleKpiFilter('all')}
          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-left hover:border-blue-400 transition-all cursor-pointer"
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">My Backlog</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{myTasks.length}</p>
        </button>

        <button
          type="button"
          onClick={() => handleKpiFilter('active')}
          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-left hover:border-blue-400 transition-all cursor-pointer"
        >
          <span className="text-[10px] uppercase font-bold text-blue-600">Active</span>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">{activeCount}</p>
        </button>

        <button
          type="button"
          onClick={() => handleKpiFilter('today')}
          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-left hover:border-amber-400 transition-all cursor-pointer"
        >
          <span className="text-[10px] uppercase font-bold text-amber-700">Due Today</span>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">{dueTodayCount}</p>
        </button>

        <button
          type="button"
          onClick={() => handleKpiFilter('overdue')}
          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-left hover:border-rose-400 transition-all cursor-pointer"
        >
          <span className="text-[10px] uppercase font-bold text-rose-600">Overdue</span>
          <p className="text-2xl font-extrabold text-rose-700 mt-1">{overdueCount}</p>
        </button>

        <button
          type="button"
          onClick={() => handleKpiFilter('completed')}
          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-left hover:border-emerald-400 transition-all cursor-pointer"
        >
          <span className="text-[10px] uppercase font-bold text-emerald-600">Delivered</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{completedCount}</p>
        </button>
      </div>

      {/* Interactive Task Table */}
      <TaskTable
        tasks={myTasks}
        onOpenEmployeeUpdate={onOpenEmployeeUpdate}
        onOpenEditTask={() => {}}
        isEmployeeView={true}
      />
    </div>
  );
};
