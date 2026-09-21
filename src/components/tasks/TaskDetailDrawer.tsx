import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge, PriorityBadge } from '../ui/StatusBadge';
import { getLocalDateString } from '../../utils/dateUtils';
import {
  X,
  Calendar,
  User as UserIcon,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Edit2,
  Trash2,
  History,
  ShieldAlert,
  ArrowRight,
  Download,
  Paperclip,
  FileText,
  FileCheck,
} from 'lucide-react';

interface TaskDetailDrawerProps {
  onOpenEmployeeUpdate: (task: any) => void;
  onOpenEditTask: (task: any) => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  onOpenEmployeeUpdate,
  onOpenEditTask,
}) => {
  const {
    tasks,
    selectedTaskId,
    closeTaskDetail,
    activities,
    currentUser,
    deleteTask,
    showToast,
  } = useApp();

  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!selectedTaskId) return null;

  const task = tasks.find((t) => t.id === selectedTaskId);
  if (!task) return null;

  const taskActivities = activities
    .filter((a) => a.taskId === task.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const todayStr = getLocalDateString();
  const isOverdue = !!(task.dueDate && task.dueDate < todayStr && task.status !== 'DONE');
  const isDueToday = !!(task.dueDate && task.dueDate === todayStr && task.status !== 'DONE');
  const isBlocked = task.status === 'BLOCKED';

  const wasCompletedOverdue =
    task.status === 'DONE' &&
    (task.wasOverdue || (task.completedAt && task.dueDate && task.completedAt.split('T')[0] > task.dueDate));

  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  const canDelete = currentUser?.role === 'ADMIN';
  const isMine = currentUser?.id === task.assignedEmployeeId;

  const handleDelete = async () => {
    await deleteTask(task.id);
  };

  const ownerName = task.assignedEmployeeName || 'Unassigned';
  const ownerInitials = task.assignedEmployeeName
    ? task.assignedEmployeeName
        .split(' ')
        .filter(Boolean)
        .map((s) => s[0])
        .join('')
        .slice(0, 2)
    : '--';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div
        id="task-detail-drawer"
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              {task.id}
            </span>
            <StatusBadge status={task.status} wasOverdue={wasCompletedOverdue} />
            <PriorityBadge priority={task.priority} />
          </div>

          <button
            onClick={closeTaskDetail}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Header Title */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">{task.title}</h3>
            <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium">
              <span className="text-slate-800 font-semibold">{task.projectName}</span>
              <span>•</span>
              <span>Client: {task.clientName}</span>
            </div>
          </div>

          {/* Blocker Banner */}
          {isBlocked && task.blocker && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-700">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Active Blocker Escalation</span>
              </div>
              <p className="text-xs leading-relaxed font-medium">{task.blocker}</p>
            </div>
          )}

          {/* Next Action Box (High Visual Weight) */}
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200/90 shadow-2xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-800">
              Current Next Action (Operational Accountability)
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1 leading-relaxed">
              {task.nextAction}
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Owner */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Assigned Owner</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                  {ownerInitials}
                </span>
                <span className="font-bold text-slate-900 truncate">{ownerName}</span>
              </div>
            </div>

            {/* Deadline */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Due Date</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className={`font-bold ${isOverdue ? 'text-rose-600' : task.dueDate ? 'text-slate-900' : 'text-slate-400 font-normal italic'}`}>
                  {task.dueDate || 'No deadline specified'}
                </span>
                {isOverdue && (
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-rose-100 text-rose-700 uppercase">
                    Overdue
                  </span>
                )}
                {isDueToday && (
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-800 uppercase">
                    Today
                  </span>
                )}
                {wasCompletedOverdue && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 uppercase">
                    Delayed
                  </span>
                )}
              </div>
              {wasCompletedOverdue && task.dueDate && (() => {
                const completionDateStr = task.completedAt ? task.completedAt.split('T')[0] : todayStr;
                const dueMs = new Date(task.dueDate!).getTime();
                const compMs = new Date(completionDateStr).getTime();
                const delayDays = Math.max(1, Math.round((compMs - dueMs) / (1000 * 60 * 60 * 24)));
                return (
                  <div className="text-[10px] text-amber-700 font-semibold mt-1">
                    Delayed by {delayDays} {delayDays === 1 ? 'day' : 'days'}
                  </div>
                );
              })()}
              {task.completedAt && (
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                  Done: {task.completedAt.split('T')[0]} {task.completedBy ? `by ${task.completedBy}` : ''}
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Progress</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      task.status === 'DONE' ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <span className="font-bold text-slate-900">{task.progress}%</span>
              </div>
            </div>

            {/* Created By */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Created By</span>
              <p className="font-bold text-slate-900 mt-1">{task.createdByName}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1.5">
              Deliverable Scope & Criteria
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 text-slate-700 leading-relaxed whitespace-pre-line">
              {task.description}
            </div>
          </div>

          {/* Attached Requirements Documents (PRD / FRD / Specs) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                <span>Requirements Documents ({task.attachments?.length || 0})</span>
              </h4>
              {canManage && (
                <button
                  type="button"
                  onClick={() => onOpenEditTask(task)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  {task.attachments && task.attachments.length > 0 ? 'Manage Docs' : '+ Attach PRD/FRD'}
                </button>
              )}
            </div>

            {task.attachments && task.attachments.length > 0 ? (
              <div className="space-y-2">
                {task.attachments.map((doc) => {
                  const isPrd = doc.category === 'PRD';
                  const isFrd = doc.category === 'FRD';
                  const isSpec = doc.category === 'TECH_SPEC';
                  const badgeColor = isPrd
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : isFrd
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : isSpec
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200';

                  const formatDocSize = (bytes: number) => {
                    if (!bytes) return '0 KB';
                    return bytes > 1048576
                      ? `${(bytes / 1048576).toFixed(1)} MB`
                      : `${Math.round(bytes / 1024)} KB`;
                  };

                  return (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                          {isPrd ? (
                            <FileCheck className="w-4 h-4 text-purple-600" />
                          ) : (
                            <FileText className={`w-4 h-4 ${isFrd ? 'text-blue-600' : 'text-slate-600'}`} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 truncate" title={doc.name}>
                              {doc.name}
                            </span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border uppercase shrink-0 ${badgeColor}`}>
                              {doc.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {formatDocSize(doc.size)} • Uploaded by {doc.uploadedByName || 'Team'}
                          </p>
                        </div>
                      </div>

                      {doc.dataUrl ? (
                        <a
                          href={doc.dataUrl}
                          download={doc.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-700 font-semibold text-xs flex items-center gap-1 shrink-0 shadow-2xs transition-all"
                          title={`Download ${doc.name}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400">Attached</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-200/60 text-slate-400 text-xs flex items-center justify-between">
                <span>No PRD or FRD documents attached to this deliverable.</span>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => onOpenEditTask(task)}
                    className="text-blue-600 hover:underline font-semibold text-xs cursor-pointer"
                  >
                    + Attach PRD/FRD
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Secondary Details */}
          {(task.referenceLink || task.estimatedEffort || task.notes || task.completedAt) && (
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-50/50 border border-slate-200/60">
              {task.referenceLink && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Reference Link:</span>
                  <a
                    href={task.referenceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-semibold hover:underline flex items-center gap-1 max-w-xs truncate"
                  >
                    <span>{task.referenceLink}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
              {task.estimatedEffort && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Estimated Effort:</span>
                  <span className="font-bold text-slate-800">{task.estimatedEffort}</span>
                </div>
              )}
              {task.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Completed On:</span>
                  <span className="font-bold text-emerald-700">
                    {new Date(task.completedAt).toLocaleDateString()} by {task.completedBy}
                  </span>
                </div>
              )}
              {task.notes && (
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="font-semibold text-slate-500 block mb-1">Notes:</span>
                  <p className="text-slate-700 leading-relaxed">{task.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Task Activity History / Audit Trail */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                Task Activity History ({taskActivities.length})
              </h4>
            </div>

            <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {taskActivities.length === 0 ? (
                <p className="text-slate-400 pl-7">No history recorded yet.</p>
              ) : (
                taskActivities.map((act) => (
                  <div key={act.id} className="relative flex items-start gap-3 pl-1">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center shrink-0 z-10 text-[9px] font-bold text-blue-700">
                      {act.userName[0]}
                    </div>
                    <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{act.userName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(act.timestamp).toLocaleDateString()}{' '}
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-800 mt-1 font-medium">{act.action}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Drawer Action Footer */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-2">
          {canDelete && (
            <div>
              {confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-rose-600">Delete permanently?</span>
                  <button
                    onClick={handleDelete}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete Task</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {(isMine || canManage) && (
              <button
                id="btn-drawer-quick-update"
                onClick={() => {
                  closeTaskDetail();
                  onOpenEmployeeUpdate(task);
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Update Status & Progress</span>
              </button>
            )}

            {canManage && (
              <button
                id="btn-drawer-edit-task"
                onClick={() => {
                  closeTaskDetail();
                  onOpenEditTask(task);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Configure</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
