import React from 'react';
import { Project, Task } from '../../types';
import { useApp } from '../../context/AppContext';
import { ProjectStatusBadge } from '../ui/StatusBadge';
import { FolderKanban, ArrowRight, ExternalLink } from 'lucide-react';
import { getLocalDateString } from '../../utils/dateUtils';

interface ProjectProgressCardProps {
  projects: Project[];
  tasks: Task[];
}

export const ProjectProgressCard: React.FC<ProjectProgressCardProps> = ({ projects, tasks }) => {
  const { navigateTo, currentUser } = useApp();
  const todayStr = getLocalDateString();
  const targetProjectsRoute = currentUser?.role === 'ADMIN' ? '/admin/projects' : '/manager/projects';
  const targetTasksRoute = currentUser?.role === 'ADMIN' ? '/admin/tasks' : '/manager/tasks';

  const projectStats = projects.map((proj) => {
    const projTasks = tasks.filter((t) => t.projectId === proj.id);
    const total = projTasks.length;
    const completed = projTasks.filter((t) => t.status === 'DONE').length;
    const dueToday = projTasks.filter((t) => t.dueDate && t.dueDate === todayStr && t.status !== 'DONE').length;
    const overdue = projTasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'DONE').length;
    const blocked = projTasks.filter((t) => t.status === 'BLOCKED').length;
    const active = total - completed;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      project: proj,
      total,
      completed,
      dueToday,
      overdue,
      blocked,
      active,
      completionPct,
    };
  });

  // Prioritize: Due Today > Blocked/Overdue > Active Projects with tasks > Others
  const sortedProjects = [...projectStats].sort((a, b) => {
    // 1. Projects with tasks due today
    if (a.dueToday !== b.dueToday) return b.dueToday - a.dueToday;
    // 2. Projects with overdue or blocked tasks
    const urgencyA = a.overdue + a.blocked;
    const urgencyB = b.overdue + b.blocked;
    if (urgencyA !== urgencyB) return urgencyB - urgencyA;
    // 3. Projects with active tasks
    if (a.active !== b.active) return b.active - a.active;
    // 4. Status active over archived
    if (a.project.status === 'ACTIVE' && b.project.status !== 'ACTIVE') return -1;
    if (b.project.status === 'ACTIVE' && a.project.status !== 'ACTIVE') return 1;
    return (a.project?.projectName || '').localeCompare(b.project?.projectName || '');
  });

  const MAX_DISPLAY = 10;
  const displayedProjects = sortedProjects.slice(0, MAX_DISPLAY);
  const remainingCount = Math.max(0, sortedProjects.length - MAX_DISPLAY);

  return (
    <div
      id="card-project-progress"
      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <FolderKanban className="w-4 h-4 stroke-[2]" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Project Delivery Progress</h3>
            <p className="text-xs text-slate-500">Client milestones & operational execution</p>
          </div>
        </div>

        <button
          onClick={() => navigateTo(targetProjectsRoute)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>All Projects</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Project items container (Scrollable with max-height to match Workload & Activity cards) */}
      <div className="mt-3 space-y-2 max-h-[360px] overflow-y-auto pr-0.5">
        {displayedProjects.length === 0 ? (
          <div className="py-8 text-center">
            <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No projects created yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Create your first client project to track deliverables</p>
          </div>
        ) : (
          displayedProjects.map(({ project, total, completed, dueToday, overdue, blocked, active, completionPct }) => (
            <div
              key={project.id}
              onClick={() => navigateTo(targetTasksRoute, { projectId: project.id, status: 'ALL' })}
              className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50/70 cursor-pointer transition-all group"
              title={`View ${project.projectName} tasks`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {project.projectName}
                    </h4>
                    <ProjectStatusBadge status={project.status} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">Client: {project.clientName}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-900">{completionPct}%</span>
                  <p className="text-[10px] text-slate-400">
                    {completed}/{total} Done
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    completionPct === 100
                      ? 'bg-emerald-500'
                      : completionPct > 50
                      ? 'bg-blue-600'
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${completionPct}%` }}
                />
              </div>

              {/* Sub stats with Today highlights */}
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500 font-medium flex-wrap">
                <span>{active} active</span>
                {dueToday > 0 && (
                  <span className="text-amber-700 font-bold bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                    • {dueToday} today
                  </span>
                )}
                {overdue > 0 && (
                  <span className="text-rose-600 font-bold bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                    • {overdue} overdue
                  </span>
                )}
                {blocked > 0 && (
                  <span className="text-purple-700 font-bold bg-purple-50 px-1 py-0.2 rounded border border-purple-200">
                    • {blocked} blocked
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer "Show More" / "View All" Action */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Showing {displayedProjects.length} of {projects.length} projects
        </span>
        <button
          id="btn-show-more-projects"
          onClick={() => navigateTo(targetProjectsRoute)}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50/60 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
        >
          <span>{remainingCount > 0 ? `Show More (${remainingCount}+)` : 'Manage Projects'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
