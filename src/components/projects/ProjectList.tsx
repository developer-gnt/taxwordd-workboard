import React, { useState } from 'react';
import { Project, ProjectStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { ProjectStatusBadge } from '../ui/StatusBadge';
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Layers,
  ArrowRight,
  X,
} from 'lucide-react';
import { getLocalDateString } from '../../utils/dateUtils';

interface ProjectListProps {
  onOpenCreateProject: () => void;
  onOpenEditProject: (project: Project) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  onOpenCreateProject,
  onOpenEditProject,
}) => {
  const { projects, tasks, deleteProject, navigateTo, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(12);

  const todayStr = getLocalDateString();
  const canManageProjects = currentUser?.role === 'ADMIN';

  // Filtered projects
  const filtered = projects.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const match =
        p.projectName.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    return true;
  });

  // Calculate pagination
  const totalItems = filtered.length;
  const itemsPerPage = pageSize === 'ALL' ? totalItems || 1 : pageSize;
  const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * (pageSize === 'ALL' ? totalItems : pageSize);
  const paginatedProjects = pageSize === 'ALL' ? filtered : filtered.slice(startIndex, startIndex + pageSize);

  // Status counts for quick filters
  const counts = {
    ALL: projects.length,
    ACTIVE: projects.filter((p) => p.status === 'ACTIVE').length,
    COMPLETED: projects.filter((p) => p.status === 'COMPLETED').length,
    ON_HOLD: projects.filter((p) => p.status === 'ON_HOLD').length,
    ARCHIVED: projects.filter((p) => p.status === 'ARCHIVED').length,
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-project-search"
            type="text"
            placeholder="Search projects, clients, or descriptions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              id="select-project-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="ALL">All Statuses ({counts.ALL})</option>
              <option value="ACTIVE">Active ({counts.ACTIVE})</option>
              <option value="COMPLETED">Completed ({counts.COMPLETED})</option>
              <option value="ON_HOLD">On Hold ({counts.ON_HOLD})</option>
              <option value="ARCHIVED">Archived ({counts.ARCHIVED})</option>
            </select>
          </div>

          {canManageProjects && (
            <button
              id="btn-add-project"
              onClick={onOpenCreateProject}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid or Empty State */}
      {paginatedProjects.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200/80 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">No projects found</h3>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            {search || statusFilter !== 'ALL'
              ? 'No projects match your active search and status filters.'
              : 'Get started by creating your first client project or account.'}
          </p>
          {(search || statusFilter !== 'ALL') ? (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setCurrentPage(1);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Clear Filters
            </button>
          ) : canManageProjects ? (
            <button
              onClick={onOpenCreateProject}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Project</span>
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedProjects.map((proj) => {
            const projTasks = tasks.filter((t) => t.projectId === proj.id);
            const total = projTasks.length;
            const completed = projTasks.filter((t) => t.status === 'DONE').length;
            const overdue = projTasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'DONE').length;
            const dueToday = projTasks.filter((t) => t.dueDate && t.dueDate === todayStr && t.status !== 'DONE').length;
            const blocked = projTasks.filter((t) => t.status === 'BLOCKED').length;
            const activeDeliverables = total - completed;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div
                key={proj.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-blue-200/80 flex flex-col justify-between group transition-all duration-200 relative"
              >
                <div>
                  {/* Card Top: Title & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <FolderKanban className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {proj.projectName}
                        </h3>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Client: <strong className="text-slate-800 font-semibold">{proj.clientName}</strong></span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <ProjectStatusBadge status={proj.status} />
                    </div>
                  </div>

                  {/* Description */}
                  {proj.description ? (
                    <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                      {proj.description}
                    </p>
                  ) : (
                    <div className="mt-3 text-[11px] text-slate-400 italic">No description provided</div>
                  )}

                  {/* Progress Bar & Rate */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-600 flex items-center gap-1">
                        Completion Progress
                      </span>
                      <span className="font-bold text-slate-900">
                        {pct}% <span className="text-slate-400 font-normal">({completed}/{total})</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct === 100
                            ? 'bg-emerald-500'
                            : pct >= 50
                            ? 'bg-blue-600'
                            : pct > 0
                            ? 'bg-blue-500'
                            : 'bg-slate-200'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Deliverables Badges */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                      {activeDeliverables} active {activeDeliverables === 1 ? 'task' : 'tasks'}
                    </span>

                    {overdue > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200/80 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {overdue} overdue
                      </span>
                    )}

                    {dueToday > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200/80 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dueToday} due today
                      </span>
                    )}

                    {blocked > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-bold border border-orange-200/80 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {blocked} blocked
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      const targetRoute = currentUser?.role === 'ADMIN' ? '/admin/tasks' : '/manager/tasks';
                      navigateTo(targetRoute, { projectId: proj.id, status: 'ALL' });
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors group/btn py-1"
                  >
                    <span>View Deliverables ({total})</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>

                  {canManageProjects && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenEditProject(proj)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {confirmDeleteId === proj.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={async () => {
                              await deleteProject(proj.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition-colors shadow-xs"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(proj.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {filtered.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-bold text-slate-900">
              {totalItems === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + (pageSize === 'ALL' ? totalItems : pageSize), totalItems)}
            </span>
            <span>of</span>
            <span className="font-bold text-slate-900">{totalItems}</span>
            <span>projects</span>

            <div className="ml-2 flex items-center gap-1.5">
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-medium">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  setPageSize(val);
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value={6}>6</option>
                <option value={9}>9</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value="ALL">All</option>
              </select>
            </div>
          </div>

          {pageSize !== 'ALL' && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={validPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
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
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

