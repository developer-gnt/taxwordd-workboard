import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, AlertCircle, Calendar, User as UserIcon, Building } from 'lucide-react';
import { getLocalDateString } from '../../utils/dateUtils';
import { UserCombobox } from '../ui/UserCombobox';
import { ProjectCombobox } from '../ui/ProjectCombobox';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({ isOpen, onClose }) => {
  const { users, projects, createTask } = useApp();

  const [title, setTitle] = useState('');
  const [party, setParty] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Active eligible users
  const assignees = users.filter((u) => u.active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task name is required.');
      return;
    }

    setLoading(true);
    const res = await createTask({
      title: title.trim(),
      projectId: party.trim(),
      dueDate: dueDate.trim(),
      assignedEmployeeId: assignedEmployeeId.trim(),
    });
    setLoading(false);

    if (res.success) {
      onClose();
      setTitle('');
      setParty('');
      setDueDate('');
      setAssignedEmployeeId('');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in overflow-x-hidden">
      <div
        id="modal-create-task"
        className="w-full max-w-lg min-w-0 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between min-w-0 bg-slate-50/50">
          <div className="min-w-0 pr-2">
            <h2 className="text-base font-bold text-slate-900 truncate">Create New Task</h2>
            <p className="text-xs text-slate-500 truncate">Enter task name, party, deadline, and assigned owner</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 shrink-0 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 sm:p-6 space-y-4 text-xs min-w-0">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Task Name */}
          <div>
            <label htmlFor="task-title-input" className="block font-bold text-slate-700 mb-1 text-xs">
              Task Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="task-title-input"
              type="text"
              required
              autoFocus
              placeholder="e.g. GST Return Filing & Reconciliation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-900 bg-white shadow-2xs"
            />
          </div>

          {/* 2. Party (Project / Client) */}
          <div>
            <label htmlFor="task-party-select" className="block font-bold text-slate-700 mb-1 text-xs flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Party Name</span>
              <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
            </label>
            <ProjectCombobox
              id="task-party-select"
              projects={projects}
              value={party}
              onChange={setParty}
              placeholder="Select or enter Party name (e.g. Sharma & Co)..."
            />
          </div>

          {/* 3. Deadline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="task-due-date-input" className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Deadline</span>
                <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
              </label>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  Clear Date
                </button>
              )}
            </div>
            <input
              id="task-due-date-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs bg-white text-slate-900 shadow-2xs"
            />
            <div className="flex items-center gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setDueDate(getLocalDateString())}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Set Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  setDueDate(getLocalDateString(d));
                }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Tomorrow
              </button>
              {!dueDate && (
                <span className="text-[11px] text-slate-400 italic ml-auto">No deadline set</span>
              )}
            </div>
          </div>

          {/* 4. To Whom (Assigned Owner) */}
          <div>
            <label htmlFor="task-assignee-select" className="block font-bold text-slate-700 mb-1 text-xs flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>To Whom (Assigned Owner)</span>
              <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
            </label>
            <UserCombobox
              id="task-assignee-select"
              users={assignees}
              value={assignedEmployeeId}
              onChange={setAssignedEmployeeId}
              placeholder="Select person (leave blank for unassigned)..."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-submit-create-task"
              type="submit"
              disabled={loading || !title.trim()}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors text-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? 'Creating Task...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
