import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Team, User } from '../../types';
import { TeamModal } from './TeamModal';
import {
  Users2,
  Plus,
  Search,
  Edit2,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Layers,
  Briefcase,
  X,
  Users,
} from 'lucide-react';

interface TeamsViewProps {
  onSwitchToEmployees?: () => void;
}

const COLOR_CLASSES: Record<string, { badge: string; border: string; bg: string; dot: string }> = {
  blue: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
    border: 'hover:border-blue-300',
    bg: 'bg-blue-500',
    dot: 'bg-blue-500',
  },
  indigo: {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    border: 'hover:border-indigo-300',
    bg: 'bg-indigo-500',
    dot: 'bg-indigo-500',
  },
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    border: 'hover:border-emerald-300',
    bg: 'bg-emerald-500',
    dot: 'bg-emerald-500',
  },
  violet: {
    badge: 'bg-violet-50 text-violet-700 border-violet-200/80',
    border: 'hover:border-violet-300',
    bg: 'bg-violet-500',
    dot: 'bg-violet-500',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200/80',
    border: 'hover:border-amber-300',
    bg: 'bg-amber-500',
    dot: 'bg-amber-500',
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
    border: 'hover:border-rose-300',
    bg: 'bg-rose-500',
    dot: 'bg-rose-500',
  },
  cyan: {
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
    border: 'hover:border-cyan-300',
    bg: 'bg-cyan-500',
    dot: 'bg-cyan-500',
  },
};

export const TeamsView: React.FC<TeamsViewProps> = ({ onSwitchToEmployees }) => {
  const { teams, users, tasks, currentUser, deleteTeam, navigateTo } = useApp();

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  const targetTasksRoute = currentUser?.role === 'ADMIN' ? '/admin/tasks' : '/manager/tasks';
  const targetTeamRoute = currentUser?.role === 'ADMIN' ? '/admin/team' : '/manager/team';

  // Unique departments for filter
  const departments = Array.from(
    new Set(teams.map((t) => t.department).filter(Boolean) as string[])
  );

  // Filtered teams
  const filteredTeams = teams.filter((t) => {
    if (departmentFilter !== 'ALL' && t.department !== departmentFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = t.name.toLowerCase().includes(q);
      const matchDept = t.department && t.department.toLowerCase().includes(q);
      const matchLead = t.leadName && t.leadName.toLowerCase().includes(q);
      const matchDesc = t.description && t.description.toLowerCase().includes(q);
      // match member names
      const matchMembers = t.memberIds.some((mid) => {
        const u = users.find((user) => user.id === mid);
        return u && u.name.toLowerCase().includes(q);
      });
      if (!matchName && !matchDept && !matchLead && !matchDesc && !matchMembers) {
        return false;
      }
    }
    return true;
  });

  // Calculate summary metrics
  const totalTeams = teams.length;
  const uniqueMembersInTeams = new Set(teams.flatMap((t) => t.memberIds)).size;

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const handleDeleteTeam = async (id: string) => {
    await deleteTeam(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation: Employees vs Teams */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/60">
          <button
            onClick={() => {
              if (onSwitchToEmployees) {
                onSwitchToEmployees();
              } else {
                navigateTo(targetTeamRoute);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-all cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>All Staff ({users.length})</span>
          </button>

          <button
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-700 shadow-xs transition-all cursor-default"
          >
            <Users2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Teams & Pods ({totalTeams})</span>
          </button>
        </div>

        {canManage && (
          <button
            id="btn-create-team-top"
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        )}
      </div>

      {/* Search, Filter & Actions Toolbar */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-team-filter-search"
            type="text"
            placeholder="Search teams by name, lead, member, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {departments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="ALL">All Departments ({totalTeams})</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          <div className="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-50 rounded-xl border border-slate-100">
            <strong>{uniqueMembersInTeams}</strong> staff in teams
          </div>
        </div>
      </div>

      {/* Teams Grid or Empty State */}
      {filteredTeams.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200/80 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Users2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {teams.length === 0 ? 'No functional teams created yet' : 'No teams match your search'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-5 leading-relaxed">
            {teams.length === 0
              ? 'Organize your staff into specialized client pods or functional departments (e.g., GST Team, Direct Tax Pod, Audit & Assurance, Accounting) to streamline ownership and workloads.'
              : 'Try clearing your search keyword or department filter to see all teams.'}
          </p>

          {teams.length === 0 ? (
            canManage && (
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Team</span>
              </button>
            )
          ) : (
            <button
              onClick={() => {
                setSearch('');
                setDepartmentFilter('ALL');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => {
            const colorMeta = COLOR_CLASSES[team.color || 'blue'] || COLOR_CLASSES.blue;

            // Find members
            const memberUsers = team.memberIds
              .map((id) => users.find((u) => u.id === id))
              .filter(Boolean) as User[];

            const leadUser = team.leadId
              ? users.find((u) => u.id === team.leadId)
              : null;

            // Calculate task workload for members in this team
            const teamMemberIds = new Set(team.memberIds);
            const teamTasks = tasks.filter((t) => t.assignedEmployeeId && teamMemberIds.has(t.assignedEmployeeId));
            const activeTasks = teamTasks.filter((t) => t.status !== 'DONE').length;
            const completedTasks = teamTasks.filter((t) => t.status === 'DONE').length;
            const blockedTasks = teamTasks.filter((t) => t.status === 'BLOCKED').length;

            return (
              <div
                key={team.id}
                className={`p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md ${colorMeta.border} flex flex-col justify-between group transition-all duration-200 relative`}
              >
                <div>
                  {/* Top: Team Name & Department Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${colorMeta.dot} shrink-0`} />
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {team.name}
                        </h3>
                      </div>

                      {team.department && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${colorMeta.badge}`}
                          >
                            {team.department}
                          </span>
                        </div>
                      )}
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(team)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Team"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {confirmDeleteId === team.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteTeam(team.id)}
                              className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shadow-xs cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(team.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {team.description ? (
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                      {team.description}
                    </p>
                  ) : (
                    <div className="mt-2.5 text-[11px] text-slate-400 italic">
                      Specialized functional pod for client deliverables
                    </div>
                  )}

                  {/* Team Lead Indicator */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Team Lead:</span>
                    </span>
                    {leadUser ? (
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[9px] flex items-center justify-center">
                          {leadUser.initials || leadUser.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="truncate max-w-[130px]">{leadUser.name}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">No designated lead</span>
                    )}
                  </div>

                  {/* Member Avatar Stack */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Members ({memberUsers.length}):
                    </span>
                    <div className="flex items-center -space-x-1.5 overflow-hidden py-1">
                      {memberUsers.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">No members assigned</span>
                      ) : (
                        <>
                          {memberUsers.slice(0, 5).map((m) => (
                            <div
                              key={m.id}
                              title={`${m.name} (${m.role})`}
                              className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-2xs"
                            >
                              {m.initials || m.name.slice(0, 2).toUpperCase()}
                            </div>
                          ))}
                          {memberUsers.length > 5 && (
                            <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600 shadow-2xs">
                              +{memberUsers.length - 5}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Deliverables Metrics */}
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Active</span>
                      <p className="text-xs font-extrabold text-blue-600 mt-0.5">{activeTasks}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Blocked</span>
                      <p className={`text-xs font-extrabold mt-0.5 ${blockedTasks > 0 ? 'text-orange-600' : 'text-slate-700'}`}>
                        {blockedTasks}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Done</span>
                      <p className="text-xs font-extrabold text-emerald-600 mt-0.5">{completedTasks}</p>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      navigateTo(targetTasksRoute, { search: team.name });
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors group/btn py-1 cursor-pointer"
                  >
                    <span>View Team Tasks</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>

                  {canManage && (
                    <button
                      onClick={() => handleOpenEdit(team)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Manage Pod
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Team Create / Edit Modal */}
      <TeamModal
        isOpen={isModalOpen}
        team={editingTeam}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTeam(null);
        }}
      />
    </div>
  );
};
