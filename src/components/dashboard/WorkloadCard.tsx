import React from 'react';
import { User, Task } from '../../types';
import { useApp } from '../../context/AppContext';
import { Users, AlertCircle, ArrowRight } from 'lucide-react';
import { getLocalDateString } from '../../utils/dateUtils';

interface WorkloadCardProps {
  users: User[];
  tasks: Task[];
}

export const WorkloadCard: React.FC<WorkloadCardProps> = ({ users, tasks }) => {
  const { navigateTo, currentUser } = useApp();
  const todayStr = getLocalDateString();

  // Filter to employees and managers who can be assigned tasks
  const eligibleUsers = users.filter((u) => u.active && (u.role === 'EMPLOYEE' || u.role === 'MANAGER'));

  const workloadStats = eligibleUsers
    .map((u) => {
      const userTasks = tasks.filter((t) => t.assignedEmployeeId === u.id);
      const active = userTasks.filter((t) => t.status !== 'DONE').length;
      const dueToday = userTasks.filter((t) => t.dueDate && t.dueDate === todayStr && t.status !== 'DONE').length;
      const overdue = userTasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'DONE').length;
      const blocked = userTasks.filter((t) => t.status === 'BLOCKED').length;
      const completed = userTasks.filter((t) => t.status === 'DONE').length;

      return {
        user: u,
        total: userTasks.length,
        active,
        dueToday,
        overdue,
        blocked,
        completed,
      };
    })
    .sort((a, b) => {
      // Prioritize members with urgent items (blocked > overdue > today > active count)
      const urgencyA = a.blocked * 100 + a.overdue * 10 + a.dueToday * 5 + a.active;
      const urgencyB = b.blocked * 100 + b.overdue * 10 + b.dueToday * 5 + b.active;
      if (urgencyA !== urgencyB) return urgencyB - urgencyA;
      return (a.user?.name || '').localeCompare(b.user?.name || '');
    });

  const handleUserClick = (employeeId: string) => {
    const targetRoute = currentUser?.role === 'ADMIN' ? '/admin/tasks' : '/manager/tasks';
    navigateTo(targetRoute, { employeeId, status: 'ALL', quickFilter: 'all' });
  };

  return (
    <div
      id="card-team-workload"
      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
    >
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 shadow-2xs">
            <Users className="w-4 h-4 stroke-[2.2]" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Team Workload & Accountability</h3>
            <p className="text-[11px] text-slate-500">Live operational distribution across assignees</p>
          </div>
        </div>

        <button
          onClick={() => navigateTo(currentUser?.role === 'ADMIN' ? '/admin/team' : '/manager/team')}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Manage Team</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-3 space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {workloadStats.map(({ user, active, dueToday, overdue, blocked }) => (
          <div
            key={user.id}
            onClick={() => handleUserClick(user.id)}
            className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50/80 cursor-pointer transition-all duration-150 space-y-2 group"
            title={`View ${user.name}'s deliverables`}
          >
            {/* Top Row: Assignee Identity & Active Workload Pill */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200/70 group-hover:bg-blue-100 group-hover:text-blue-800 group-hover:border-blue-200 transition-colors">
                  {user.initials}
                </span>
                <div className="min-w-0 flex-1 pr-1">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {user.department || user.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors whitespace-nowrap ${
                    active > 0
                      ? 'bg-slate-100 text-slate-800 group-hover:bg-blue-50 group-hover:text-blue-700'
                      : 'bg-slate-50 text-slate-400 border border-slate-100'
                  }`}
                >
                  {active} active
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
              </div>
            </div>

            {/* Bottom Row: Urgent indicator tags (if any) */}
            {(blocked > 0 || overdue > 0 || dueToday > 0) && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-100/70 text-[10px]">
                {blocked > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-md font-bold bg-purple-50 text-purple-700 border border-purple-200/70 flex items-center gap-1.5 whitespace-nowrap"
                    title={`${blocked} blocked`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                    {blocked} blocked
                  </span>
                )}
                {overdue > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-md font-bold bg-rose-50 text-rose-700 border border-rose-200/70 flex items-center gap-1.5 whitespace-nowrap"
                    title={`${overdue} overdue`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    {overdue} overdue
                  </span>
                )}
                {dueToday > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-800 border border-amber-200/70 flex items-center gap-1.5 whitespace-nowrap"
                    title={`${dueToday} due today`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    {dueToday} due today
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2.5 text-[11px] text-slate-400 text-center border-t border-slate-100">
        Click any team member to filter their deliverables
      </div>
    </div>
  );
};
