import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus } from '../../types';
import { X, AlertCircle } from 'lucide-react';

interface ProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, isOpen, onClose }) => {
  const { createProject, updateProject } = useApp();

  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('ACTIVE');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!project;

  useEffect(() => {
    if (project) {
      setProjectName(project.projectName);
      setClientName(project.clientName);
      setStatus(project.status);
      setDescription(project.description || '');
      setError('');
    } else {
      setProjectName('');
      setClientName('');
      setStatus('ACTIVE');
      setDescription('');
      setError('');
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!projectName.trim()) return setError('Project name is required');
    if (!clientName.trim()) return setError('Client name is required');

    setLoading(true);
    let res;
    if (isEditing && project) {
      res = await updateProject(project.id, {
        projectName: projectName.trim(),
        clientName: clientName.trim(),
        status,
        description: description.trim(),
      });
    } else {
      res = await createProject({
        projectName: projectName.trim(),
        clientName: clientName.trim(),
        status,
        description: description.trim(),
      });
    }
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
        id="modal-project"
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEditing ? 'Edit Party Details' : 'Create New Party'}
            </h2>
            <p className="text-xs text-slate-500">Track initiatives and deliverables under structured party accounts</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="input-project-name" className="block font-bold text-slate-700 mb-1">
              Party Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-project-name"
              type="text"
              required
              placeholder="e.g. Reliance Industries / Sharma & Co"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
            />
          </div>

          <div>
            <label htmlFor="input-project-client" className="block font-bold text-slate-700 mb-1">
              Client / Group Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-project-client"
              type="text"
              required
              placeholder="e.g. Corporate Accounts / Group"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
            />
          </div>

          <div>
            <label htmlFor="select-project-status" className="block font-bold text-slate-700 mb-1">
              Party Operational Status <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-project-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs bg-white"
            >
              <option value="ACTIVE">Active (Ongoing operations)</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div>
            <label htmlFor="input-project-description" className="block font-medium text-slate-600 mb-1">
              Scope / Notes (Optional)
            </label>
            <textarea
              id="input-project-description"
              rows={2}
              placeholder="Strategic goals, compliance requirements, or client context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              id="btn-submit-project"
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors flex items-center gap-2"
            >
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Party'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
