import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  AlertCircle,
  Calendar,
  User as UserIcon,
  Building,
  Layers,
  Sparkles,
  Flag,
  Users,
} from 'lucide-react';
import { TaskPriority } from '../../types';
import { getLocalDateString } from '../../utils/dateUtils';
import { UserCombobox } from '../ui/UserCombobox';
import { ProjectCombobox } from '../ui/ProjectCombobox';
import { DatePickerCalendar } from '../ui/DatePickerCalendar';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({ isOpen, onClose }) => {
  const { users, projects, teams, createTask } = useApp();

  const [title, setTitle] = useState('');
  const [selectedParties, setSelectedParties] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Infer group from selected parties (e.g. "Group B") to smartly preselect assignee group
  const inferredGroup = React.useMemo(() => {
    if (selectedParties.length === 0) return undefined;
    const matchedProjects = projects.filter((proj) => {
      const optionString = `${proj.projectName} (${proj.clientName})`;
      return selectedParties.some(
        (sp) => sp.toLowerCase() === optionString.toLowerCase() || sp === proj.id
      );
    });
    if (matchedProjects.length > 0) {
      const counts: Record<string, number> = {};
      matchedProjects.forEach((p) => {
        if (p.clientName) {
          counts[p.clientName] = (counts[p.clientName] || 0) + 1;
        }
      });
      const topGroup = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      return topGroup ? topGroup[0] : undefined;
    }
    return undefined;
  }, [selectedParties, projects]);

  // Active eligible users
  const assignees = users.filter((u) => u.active);

  // Resolve target assignees (can be 1 specific person OR all members of the selected group)
  const targetAssignees = React.useMemo(() => {
    if (assignedEmployeeId.startsWith('group:')) {
      const gName = assignedEmployeeId.replace('group:', '');
      const members = users.filter(
        (u) => u.active && u.department?.toLowerCase() === gName.toLowerCase()
      );
      return members.length > 0 ? members : [];
    }
    if (assignedEmployeeId.trim()) {
      const user = users.find((u) => u.id === assignedEmployeeId.trim());
      return user ? [user] : [];
    }
    return [];
  }, [assignedEmployeeId, users]);

  const isWholeGroup = assignedEmployeeId.startsWith('group:');
  const selectedGroupName = isWholeGroup ? assignedEmployeeId.replace('group:', '') : '';

  const partiesCount = selectedParties.length > 0 ? selectedParties.length : 1;
  const assigneesCount = targetAssignees.length > 0 ? targetAssignees.length : 1;
  const totalTasksCount = partiesCount * assigneesCount;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task deliverable name is required.');
      return;
    }

    setLoading(true);
    const partiesToProcess = selectedParties.length > 0 ? selectedParties : [''];
    const assigneesToProcess = targetAssignees.length > 0 ? targetAssignees.map((u) => u.id) : [''];
    let successCount = 0;
    let lastError = '';

    for (const p of partiesToProcess) {
      for (const aId of assigneesToProcess) {
        const res = await createTask({
          title: title.trim(),
          projectId: p.trim(),
          dueDate: dueDate.trim(), // Optional: empty string is valid and stored as null in DB
          assignedEmployeeId: aId.trim(),
          priority: priority,
        });
        if (res.success) {
          successCount++;
        } else {
          lastError = res.message;
        }
      }
    }

    setLoading(false);

    if (successCount > 0) {
      onClose();
      setTitle('');
      setSelectedParties([]);
      setDueDate('');
      setAssignedEmployeeId('');
      setPriority('MEDIUM');
    } else {
      setError(lastError || 'Failed to create task.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        id="modal-create-task"
        className="w-full max-w-4xl min-w-0 bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] my-auto overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Spacious Professional Header */}
        <div className="shrink-0 px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between min-w-0 bg-slate-50/70">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                Create New Task Deliverable
              </h2>
              <p className="text-xs text-slate-500 truncate">
                Assign accountability (specific person or whole group), allocate client parties, and set delivery timeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 shrink-0 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable Area */}
        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 min-h-0 text-xs">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5 text-xs shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* 1. Task Deliverable Title (Prominent Hero Input) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="task-title-input"
                  className="block font-bold text-slate-800 text-xs sm:text-sm"
                >
                  Task Deliverable Name <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-normal text-slate-400 hidden sm:inline">
                  e.g. GST 3B Monthly Return Filing & Reconciliation
                </span>
              </div>
              <input
                id="task-title-input"
                type="text"
                required
                autoFocus
                placeholder="e.g. GST Return Filing, TDS Reconciliation, or Quarterly Audit Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-slate-50/40 focus:bg-white transition-all shadow-2xs"
              />
            </div>

            {/* 2. Responsive Two-Column Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Client Party Allocation */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/50 border border-slate-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="task-party-select"
                    className="font-bold text-slate-800 text-xs flex items-center gap-2"
                  >
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>Party / Client Allocation</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
                    Single or Multiple
                  </span>
                </div>

                <ProjectCombobox
                  id="task-party-select"
                  projects={projects}
                  multiple={true}
                  selectedValues={selectedParties}
                  onSelectedValuesChange={setSelectedParties}
                  placeholder="Search parties or pick from groups..."
                />

                {/* Batch Information Callout */}
                {selectedParties.length > 1 ? (
                  <div className="p-3 rounded-xl bg-blue-50/90 border border-blue-200/70 text-blue-950 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-[11px]">
                        Batch Generation Active ({selectedParties.length} parties)
                      </p>
                      <p className="text-[11px] text-blue-700 leading-relaxed">
                        Individual deliverable tasks will be generated simultaneously for every
                        selected party with this owner and timeline.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Select a single party or batch-select an entire functional group to generate tasks
                    in parallel.
                  </p>
                )}
              </div>

              {/* Right Column: Ownership, Deadline & Priority */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/50 border border-slate-200/80 space-y-4">
                {/* A. Assigned Owner (Specific Person or Whole Group) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="task-assignee-select"
                      className="font-bold text-slate-800 text-xs flex items-center gap-2"
                    >
                      <UserIcon className="w-4 h-4 text-blue-600" />
                      <span>Assigned Owner</span>
                    </label>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                      Specific Person or Whole Group
                    </span>
                  </div>
                  <UserCombobox
                    id="task-assignee-select"
                    users={assignees}
                    teams={teams}
                    value={assignedEmployeeId}
                    onChange={setAssignedEmployeeId}
                    placeholder="Select specific person or whole group..."
                    dropdownPosition="bottom"
                    suggestedGroup={inferredGroup}
                    allowGroupSelection={true}
                  />

                  {/* Whole Group Active Indicator */}
                  {isWholeGroup && (
                    <div className="mt-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
                      <Users className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Whole Group Allocation: {selectedGroupName}</span>
                        <p className="text-blue-700 text-[10px] mt-0.5">
                          Tasks will be assigned to all {targetAssignees.length} members ({targetAssignees.map(m => m.name).join(', ')})
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* B. Deliverable Deadline (Explicitly Optional in UI & DB) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="task-due-date-input"
                      className="font-bold text-slate-800 text-xs flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Deliverable Deadline</span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded-md">
                        Optional
                      </span>
                    </label>
                    {dueDate ? (
                      <button
                        type="button"
                        onClick={() => setDueDate('')}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                      >
                        Clear Date
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No deadline set</span>
                    )}
                  </div>
                  <DatePickerCalendar
                    id="task-due-date-calendar"
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder="Choose deadline date from calendar..."
                  />
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setDueDate('')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer shadow-2xs ${
                        !dueDate
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                          : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      No Deadline
                    </button>
                    <button
                      type="button"
                      onClick={() => setDueDate(getLocalDateString())}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        setDueDate(getLocalDateString(d));
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 7);
                        setDueDate(getLocalDateString(d));
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      In 7 Days
                    </button>
                  </div>
                </div>

                {/* C. Priority Level */}
                <div>
                  <label className="block font-bold text-slate-800 text-xs mb-1.5 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-blue-600" />
                    <span>Priority Level</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/60">
                    {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[]).map((p) => {
                      const isSelected = priority === p;
                      const activeColor =
                        p === 'URGENT'
                          ? 'bg-rose-600 text-white shadow-xs font-bold'
                          : p === 'HIGH'
                          ? 'bg-amber-600 text-white shadow-xs font-bold'
                          : p === 'MEDIUM'
                          ? 'bg-blue-600 text-white shadow-xs font-bold'
                          : 'bg-slate-700 text-white shadow-xs font-bold';

                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer text-center ${
                            isSelected
                              ? activeColor
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Executive Action Footer */}
          <div className="shrink-0 px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-600 min-w-0 truncate">
              {isWholeGroup ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-blue-700 bg-blue-100/80 border border-blue-200/80 px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs shrink-0">
                    <Users className="w-3.5 h-3.5" />
                    Whole {selectedGroupName}: {totalTasksCount} Tasks
                  </span>
                  <span className="text-slate-500 text-xs truncate hidden sm:inline">
                    {selectedParties.length > 1 ? `${selectedParties.length} parties × ` : ''}
                    All {targetAssignees.length} members ({targetAssignees.map(m => m.name).join(', ')})
                  </span>
                </div>
              ) : selectedParties.length > 1 ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-blue-700 bg-blue-100/80 border border-blue-200/80 px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                    Batch: {selectedParties.length} Tasks
                  </span>
                  <span className="text-slate-500 text-xs truncate hidden sm:inline">
                    {targetAssignees[0] ? `Assigned to ${targetAssignees[0].name}` : 'Unassigned'}
                  </span>
                </div>
              ) : selectedParties.length === 1 ? (
                <span className="text-slate-700 font-medium truncate">
                  Ready to create 1 task for {targetAssignees[0]?.name || 'selected party'}
                </span>
              ) : (
                <span className="text-slate-400 italic">No party specified (General task)</span>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-colors text-xs cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                id="btn-submit-create-task"
                type="submit"
                disabled={loading || !title.trim()}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition-all text-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Tasks...</span>
                  </>
                ) : totalTasksCount > 1 ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create {totalTasksCount} Tasks</span>
                  </>
                ) : (
                  <span>Create Task</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
