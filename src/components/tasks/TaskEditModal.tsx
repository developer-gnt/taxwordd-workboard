import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus, TaskAttachment } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, AlertCircle } from 'lucide-react';
import { DocumentUploadSection } from './DocumentUploadSection';
import { ProjectCombobox } from '../ui/ProjectCombobox';
import { UserCombobox } from '../ui/UserCombobox';
import { PriorityCombobox } from '../ui/PriorityCombobox';

interface TaskEditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, isOpen, onClose }) => {
  const { projects, users, updateTaskMetadata, currentUser } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('NOT_STARTED');
  const [dueDate, setDueDate] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [notes, setNotes] = useState('');
  const [referenceLink, setReferenceLink] = useState('');
  const [estimatedEffort, setEstimatedEffort] = useState('');
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setProjectId(task.projectId || '');
      setAssignedEmployeeId(task.assignedEmployeeId);
      setPriority(task.priority || 'MEDIUM');
      setStatus(task.status);
      setDueDate(task.dueDate);
      setNextAction(task.nextAction);
      setNotes(task.notes || '');
      setReferenceLink(task.referenceLink || '');
      setEstimatedEffort(task.estimatedEffort || '');
      setAttachments(task.attachments || []);
      setError('');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const assignees = users.filter((u) => u.active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (!projectId.trim()) {
      setError('Project selection is required.');
      return;
    }

    setLoading(true);
    const res = await updateTaskMetadata(task.id, {
      title: title.trim(),
      description: description.trim(),
      projectId: projectId.trim(),
      assignedEmployeeId,
      priority,
      status,
      dueDate,
      nextAction: nextAction.trim(),
      notes: notes.trim(),
      referenceLink: referenceLink.trim(),
      estimatedEffort: estimatedEffort.trim(),
      attachments,
    });
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div
        id="modal-edit-task-management"
        className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">
              Management Configuration
            </span>
            <h2 className="text-base font-bold text-slate-900">Edit Task Deliverable Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="edit-task-title" className="block font-bold text-slate-700 mb-1">
              Task Deliverable Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-task-title"
              type="text"
              required
              placeholder="e.g. Implement Multi-tenant Schema Architecture"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="edit-task-description" className="block font-bold text-slate-700 mb-1">
              Detailed Scope & Context <span className="text-slate-400 font-normal text-xs">(Optional)</span>
            </label>
            <textarea
              id="edit-task-description"
              rows={3}
              placeholder="Describe requirements, acceptance criteria, constraints..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-task-project-select" className="block font-bold text-slate-700 mb-1">
                Project or Client <span className="text-rose-500">*</span>
              </label>
              <ProjectCombobox
                id="edit-task-project-select"
                required
                projects={projects}
                value={projectId}
                onChange={setProjectId}
              />
            </div>

            <div>
              <label htmlFor="edit-task-assignee" className="block font-bold text-slate-700 mb-1">
                Assigned Owner <span className="text-slate-400 font-normal text-xs">(Optional)</span>
              </label>
              <UserCombobox
                id="edit-task-assignee"
                users={assignees}
                value={assignedEmployeeId}
                onChange={setAssignedEmployeeId}
                placeholder="Select Owner (Employee, Manager, Admin)..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="edit-task-priority" className="block font-bold text-slate-700 mb-1">
                Priority
              </label>
              <PriorityCombobox
                id="edit-task-priority"
                required
                value={priority}
                onChange={(p) => setPriority(p)}
              />
            </div>

            <div>
              <label htmlFor="edit-task-status" className="block font-bold text-slate-700 mb-1">
                Status
              </label>
              <select
                id="edit-task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs bg-white"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="BLOCKED">Blocked</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="edit-task-due-date" className="font-bold text-slate-700">
                  Due Date <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                </label>
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => setDueDate('')}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                id="edit-task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-task-next-action" className="block font-bold text-slate-700 mb-1">
              Next Action <span className="text-slate-400 font-normal text-xs">(Optional)</span>
            </label>
            <input
              id="edit-task-next-action"
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
            />
          </div>

          {/* Document Upload Section (PRD / FRD) */}
          <DocumentUploadSection
            attachments={attachments}
            onChange={setAttachments}
            currentUserName={currentUser?.name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-task-reference" className="block font-medium text-slate-600 mb-1">
                Reference Link (Optional)
              </label>
              <input
                id="edit-task-reference"
                type="url"
                value={referenceLink}
                onChange={(e) => setReferenceLink(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
              />
            </div>

            <div>
              <label htmlFor="edit-task-effort" className="block font-medium text-slate-600 mb-1">
                Estimated Effort (Optional)
              </label>
              <input
                id="edit-task-effort"
                type="text"
                value={estimatedEffort}
                onChange={(e) => setEstimatedEffort(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-task-notes" className="block font-medium text-slate-600 mb-1">
              Internal Notes (Optional)
            </label>
            <textarea
              id="edit-task-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-edit-task"
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors flex items-center gap-2"
            >
              {loading ? 'Saving Changes...' : 'Save Deliverable Updates'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
