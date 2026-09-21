import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../ui/StatusBadge';
import { X, AlertCircle, CheckCircle2, ShieldAlert, ArrowRight, Clock } from 'lucide-react';

interface EmployeeUpdateModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeUpdateModal: React.FC<EmployeeUpdateModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  const { employeeUpdateTask } = useApp();

  const [status, setStatus] = useState<TaskStatus>('IN_PROGRESS');
  const [progress, setProgress] = useState<number>(0);
  const [blocker, setBlocker] = useState<string>('');
  const [nextAction, setNextAction] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setStatus(task.status);
      setProgress(task.progress);
      setBlocker(task.blocker || '');
      setNextAction(task.nextAction || '');
      setNotes(task.notes || '');
      setExpectedCompletionDate(task.expectedCompletionDate || task.dueDate);
      setError('');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    if (newStatus === 'DONE') {
      setProgress(100);
    } else if (newStatus === 'NOT_STARTED') {
      setProgress(0);
    } else if (newStatus === 'IN_PROGRESS' && progress === 0) {
      setProgress(25);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation: Blocker reason is mandatory if status is BLOCKED
    if (status === 'BLOCKED' && (!blocker || !blocker.trim())) {
      setError('A specific Blocker Reason is mandatory when marking a task as Blocked.');
      return;
    }

    setLoading(true);
    const res = await employeeUpdateTask(task.id, {
      status,
      progress,
      blocker: status === 'BLOCKED' ? blocker.trim() : undefined,
      nextAction: nextAction.trim(),
      notes: notes.trim(),
      expectedCompletionDate,
    });
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div
        id="modal-employee-update-task"
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">
              Task Status & Progress Update
            </span>
            <h2 className="text-base font-bold text-slate-900 truncate max-w-sm mt-0.5">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Project & Due date banner */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">{task.projectName}</p>
              <p className="text-[11px] text-slate-500">Client: {task.clientName}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Deadline</span>
              <p className="font-bold text-slate-900">{task.dueDate || 'No deadline'}</p>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label htmlFor="update-status-select" className="block font-bold text-slate-700 mb-1.5">
              Current Status <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['NOT_STARTED', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'DONE'] as TaskStatus[]).map(
                (st) => {
                  const isCurrent = status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <StatusBadge status={st} size="sm" />
                      {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Blocker Reason (MANDATORY if status is BLOCKED) */}
          {status === 'BLOCKED' && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 space-y-1 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Blocker Reason (Mandatory)</span>
              </div>
              <p className="text-[11px] text-rose-700">
                Identify the specific impediment, missing dependency, API outage, or pending external review.
              </p>
              <textarea
                id="update-blocker-input"
                rows={2}
                required
                placeholder="Describe what is preventing progress so managers can intervene early..."
                value={blocker}
                onChange={(e) => setBlocker(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-xs text-rose-950 font-medium mt-1"
              />
            </div>
          )}

          {/* Progress Slider & Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="update-progress-slider" className="font-bold text-slate-700">
                Completion Progress: <span className="text-blue-600">{progress}%</span>
              </label>
              {status === 'DONE' && (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Automatically set to 100%
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                id="update-progress-slider"
                type="range"
                min="0"
                max="100"
                step="5"
                disabled={status === 'DONE'}
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value, 10))}
                className="flex-1 accent-blue-600"
              />
              <input
                id="update-progress-number"
                type="number"
                min="0"
                max="100"
                disabled={status === 'DONE'}
                value={progress}
                onChange={(e) => setProgress(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-center font-bold text-slate-900 text-xs"
              />
            </div>
          </div>

          {/* Next Action (Optional) */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1">
            <label htmlFor="update-next-action-input" className="block font-bold text-blue-950">
              Immediate Next Action <span className="text-slate-500 font-normal text-xs">(Optional)</span>
            </label>
            <p className="text-[11px] text-blue-700">
              State the clear next step to be taken (if applicable).
            </p>
            <input
              id="update-next-action-input"
              type="text"
              placeholder="e.g. Run migration test in staging and verify logs"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-blue-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-xs mt-1"
            />
          </div>

          {/* Expected Completion Date */}
          <div>
            <label htmlFor="update-expected-date-input" className="block font-bold text-slate-700 mb-1">
              Expected Completion Date
            </label>
            <input
              id="update-expected-date-input"
              type="date"
              value={expectedCompletionDate}
              onChange={(e) => setExpectedCompletionDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs bg-white"
            />
            {task.dueDate && expectedCompletionDate && expectedCompletionDate > task.dueDate && (
              <p className="text-[11px] text-amber-600 mt-1 font-medium">
                Note: Expected completion is past the original deadline ({task.dueDate}).
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="update-notes-input" className="block font-medium text-slate-600 mb-1">
              Progress Notes / Context (Optional)
            </label>
            <textarea
              id="update-notes-input"
              rows={2}
              placeholder="Recent breakthroughs, testing results, or context for review..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-employee-update"
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors flex items-center gap-2"
            >
              {loading ? 'Saving...' : 'Save & Publish Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
