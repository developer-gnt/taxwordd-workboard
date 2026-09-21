import React, { useState } from 'react';
import { Task } from '../../types';
import { useApp } from '../../context/AppContext';
import { StatusBadge, PriorityBadge } from '../ui/StatusBadge';
import { AlertCircle, Clock, ShieldAlert, ArrowRight, CheckCircle2, Eye } from 'lucide-react';
import { getLocalDateString } from '../../utils/dateUtils';

interface TasksAttentionCardProps {
  tasks: Task[];
}

type FilterCategory = 'ALL' | 'BLOCKED' | 'OVERDUE' | 'DUE_TODAY' | 'REVIEW';

export const TasksAttentionCard: React.FC<TasksAttentionCardProps> = ({ tasks }) => {
  const { openTaskDetail, navigateTo, currentUser } = useApp();
  const todayStr = getLocalDateString();
  const [activeTab, setActiveTab] = useState<FilterCategory>('ALL');

  // Categorize urgent tasks
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED');
  const overdueTasks = tasks.filter((t) => t.status !== 'DONE' && t.dueDate && t.dueDate < todayStr);
  const dueTodayTasks = tasks.filter((t) => t.status !== 'DONE' && t.dueDate && t.dueDate === todayStr);
  const reviewTasks = tasks.filter((t) => t.status === 'REVIEW');

  // Master list of all tasks requiring attention sorted by severity: BLOCKED (0), OVERDUE (1), DUE TODAY (2), REVIEW (3)
  const allAttentionTasks = tasks
    .filter((t) => {
      if (t.status === 'DONE') return false;
      const isOverdue = !!(t.dueDate && t.dueDate < todayStr);
      const isDueToday = !!(t.dueDate && t.dueDate === todayStr);
      const isBlocked = t.status === 'BLOCKED';
      const isReview = t.status === 'REVIEW';
      return isBlocked || isOverdue || isDueToday || isReview;
    })
    .sort((a, b) => {
      const rank = (t: Task) => {
        if (t.status === 'BLOCKED') return 0;
        if (t.dueDate && t.dueDate < todayStr) return 1;
        if (t.dueDate && t.dueDate === todayStr) return 2;
        return 3;
      };
      return rank(a) - rank(b);
    });

  // Filter based on active tab
  const filteredTasks = allAttentionTasks.filter((t) => {
    if (activeTab === 'BLOCKED') return t.status === 'BLOCKED';
    if (activeTab === 'OVERDUE') return t.status !== 'DONE' && !!(t.dueDate && t.dueDate < todayStr);
    if (activeTab === 'DUE_TODAY') return t.status !== 'DONE' && !!(t.dueDate && t.dueDate === todayStr);
    if (activeTab === 'REVIEW') return t.status === 'REVIEW';
    return true;
  });

  const displayedTasks = filteredTasks;

  return (
    <div
      id="card-tasks-requiring-attention"
      className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
              <ShieldAlert className="w-4 h-4 stroke-[2.2]" />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Tasks Requiring Attention</h3>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Blockers, overdue deadlines, and review requests at a glance
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200/70 text-rose-700">
            {allAttentionTasks.length} Action Item{allAttentionTasks.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Quick Filter Tabs for Admin */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            All ({allAttentionTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('BLOCKED')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === 'BLOCKED'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 border border-rose-200/60 hover:bg-rose-100'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            Blocked ({blockedTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('OVERDUE')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === 'OVERDUE'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200/60 hover:bg-rose-100'
            }`}
          >
            <Clock className="w-3 h-3" />
            Overdue ({overdueTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('DUE_TODAY')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'DUE_TODAY'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200/60 hover:bg-amber-100'
            }`}
          >
            Due Today ({dueTodayTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('REVIEW')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'REVIEW'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-800 border border-blue-200/60 hover:bg-blue-100'
            }`}
          >
            Needs Review ({reviewTasks.length})
          </button>
        </div>
      </div>

      {/* Vertically Scrollable Task List */}
      <div className="mt-3 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {displayedTasks.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-200/60">
              <CheckCircle2 className="w-4 h-4 stroke-[2]" />
            </div>
            <p className="text-xs font-bold text-slate-800">No tasks in this view</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activeTab === 'ALL' ? 'All deliverables are running smoothly' : `No ${activeTab.toLowerCase().replace('_', ' ')} tasks currently require attention`}
            </p>
          </div>
        ) : (
          displayedTasks.map((task) => {
            const isOverdue = task.status !== 'DONE' && !!(task.dueDate && task.dueDate < todayStr);
            const isBlocked = task.status === 'BLOCKED';
            const isDueToday = task.status !== 'DONE' && !!(task.dueDate && task.dueDate === todayStr);
            const isReview = task.status === 'REVIEW';

            // Distinct status banner per issue type
            let bannerBg = 'bg-slate-100 text-slate-700';
            let borderAccent = 'border-slate-200 hover:border-slate-300';
            let statusLabel = 'ATTENTION NEEDED';

            if (isBlocked) {
              bannerBg = 'bg-rose-600 text-white font-extrabold';
              borderAccent = 'border-rose-300/80 bg-rose-50/40 hover:bg-rose-50/80';
              statusLabel = 'BLOCKED TASK';
            } else if (isOverdue) {
              bannerBg = 'bg-rose-500 text-white font-extrabold';
              borderAccent = 'border-rose-200/70 bg-rose-50/20 hover:bg-rose-50/60';
              statusLabel = `OVERDUE (${task.dueDate})`;
            } else if (isDueToday) {
              bannerBg = 'bg-amber-500 text-white font-extrabold';
              borderAccent = 'border-amber-200/80 bg-amber-50/30 hover:bg-amber-50/70';
              statusLabel = 'DUE TODAY';
            } else if (isReview) {
              bannerBg = 'bg-blue-600 text-white font-extrabold';
              borderAccent = 'border-blue-200/80 bg-blue-50/30 hover:bg-blue-50/70';
              statusLabel = 'NEEDS REVIEW';
            }

            return (
              <div
                key={task.id}
                onClick={() => openTaskDetail(task.id)}
                className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer group shadow-2xs ${borderAccent}`}
              >
                {/* Top Row: Issue Banner & Priority */}
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded-md tracking-wider ${bannerBg}`}>
                      {statusLabel}
                    </span>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium group-hover:text-blue-600 transition-colors flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Details
                  </span>
                </div>

                {/* Task Title */}
                <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {task.title}
                </p>

                {/* Blocker Reason Highlight */}
                {isBlocked && task.blocker && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-100/80 border border-rose-200 text-[11px] text-rose-950 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <p className="line-clamp-2 leading-tight">
                      <span className="font-extrabold text-rose-900">Reason: </span>
                      {task.blocker}
                    </p>
                  </div>
                )}

                {/* Footer details: Owner & Next Action */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-1 text-slate-600 shrink-0">
                    <span className="text-slate-400">Owner:</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                      {task.assignedEmployeeName}
                    </span>
                  </div>
                  <div className="truncate text-slate-500 max-w-[200px] sm:max-w-[240px]">
                    <span className="font-semibold text-blue-600 mr-1">Next:</span>
                    <span className="truncate">{task.nextAction || 'None specified'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2 flex-wrap sm:flex-nowrap">
        <button
          onClick={() => {
            const targetRoute = currentUser?.role === 'ADMIN' ? '/admin/tasks' : '/manager/tasks';
            navigateTo(targetRoute, { quickFilter: 'blocked' });
          }}
          className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 font-bold text-xs transition-colors cursor-pointer text-center"
        >
          View all blocked ({blockedTasks.length})
        </button>
        <button
          onClick={() => {
            const targetRoute = currentUser?.role === 'ADMIN' ? '/admin/tasks' : '/manager/tasks';
            navigateTo(targetRoute, { quickFilter: 'overdue' });
          }}
          className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 font-bold text-xs transition-colors cursor-pointer text-center"
        >
          View all overdue ({overdueTasks.length})
        </button>
      </div>
    </div>
  );
};

