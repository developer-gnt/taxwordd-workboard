import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Team, User } from '../../types';
import { X, AlertCircle, Users, Check, Search, ShieldCheck } from 'lucide-react';

interface TeamModalProps {
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  { id: 'blue', label: 'Blue', bg: 'bg-blue-500', ring: 'ring-blue-500' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-500' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { id: 'violet', label: 'Violet', bg: 'bg-violet-500', ring: 'ring-violet-500' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500', ring: 'ring-amber-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500', ring: 'ring-rose-500' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', ring: 'ring-cyan-500' },
];

const DEPARTMENT_PRESETS = [
  'Taxation & GST',
  'Direct Tax & ITR',
  'Statutory Audit & Assurance',
  'Corporate Advisory',
  'Bookkeeping & Accounts',
  'Legal & Compliance',
  'Operations',
];

export const TeamModal: React.FC<TeamModalProps> = ({ team, isOpen, onClose }) => {
  const { users, createTeam, updateTeam } = useApp();

  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Taxation & GST');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [color, setColor] = useState('blue');
  const [memberSearch, setMemberSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!team;

  useEffect(() => {
    if (team) {
      setName(team.name);
      setDepartment(team.department || 'Taxation & GST');
      setDescription(team.description || '');
      setLeadId(team.leadId || '');
      setSelectedMemberIds(team.memberIds || []);
      setColor(team.color || 'blue');
      setError('');
    } else {
      setName('');
      setDepartment('Taxation & GST');
      setDescription('');
      setLeadId('');
      setSelectedMemberIds([]);
      setColor('blue');
      setError('');
    }
    setMemberSearch('');
  }, [team, isOpen]);

  if (!isOpen) return null;

  const activeUsers = users.filter((u) => u.active !== false);

  const filteredMembers = activeUsers.filter((u) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAllMembers = () => {
    const allFilteredIds = filteredMembers.map((u) => u.id);
    setSelectedMemberIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
  };

  const clearAllMembers = () => {
    setSelectedMemberIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    if (!cleanName) {
      return setError('Team name is required');
    }

    setLoading(true);

    const leadUser = users.find((u) => u.id === leadId);

    // Make sure lead is also in memberIds if assigned
    const memberIdsWithLead = leadId && !selectedMemberIds.includes(leadId)
      ? [...selectedMemberIds, leadId]
      : selectedMemberIds;

    let res;
    if (isEditing && team) {
      res = await updateTeam(team.id, {
        name: cleanName,
        department: department.trim(),
        description: description.trim(),
        leadId: leadId || undefined,
        leadName: leadUser ? leadUser.name : undefined,
        memberIds: memberIdsWithLead,
        color,
      });
    } else {
      res = await createTeam({
        name: cleanName,
        department: department.trim(),
        description: description.trim(),
        leadId: leadId || undefined,
        leadName: leadUser ? leadUser.name : undefined,
        memberIds: memberIdsWithLead,
        color,
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
        id="modal-team"
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEditing ? 'Edit Team Details' : 'Create New Functional Team'}
            </h2>
            <p className="text-xs text-slate-500">
              Group employees into operational pods and assign a designated team leader
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Team Name */}
          <div>
            <label htmlFor="input-team-name" className="block font-bold text-slate-700 mb-1">
              Team Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-team-name"
              type="text"
              required
              placeholder="e.g. GST & Indirect Tax Pod, Audit Team, Advisory Pod"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
            />
          </div>

          {/* Department & Color Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="select-team-dept" className="block font-bold text-slate-700 mb-1">
                Department / Focus Area
              </label>
              <input
                id="select-team-dept"
                type="text"
                list="dept-presets"
                placeholder="e.g. Taxation & GST"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs bg-white"
              />
              <datalist id="dept-presets">
                {DEPARTMENT_PRESETS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Color Accent</label>
              <div className="flex items-center gap-2 pt-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`w-5 h-5 rounded-full ${c.bg} transition-transform ${
                      color === c.id ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-105'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Team Lead */}
          <div>
            <label htmlFor="select-team-lead" className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Designated Team Lead</span>
              <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
            </label>
            <select
              id="select-team-lead"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs bg-white cursor-pointer"
            >
              <option value="">-- No designated lead (Peer group) --</option>
              {activeUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role}) {u.department ? `• ${u.department}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Team Members Multi-Select */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Team Members ({selectedMemberIds.length} selected)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllMembers}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={clearAllMembers}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Member Search */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff to add..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Member Checkbox List */}
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/30 p-1">
              {filteredMembers.length === 0 ? (
                <div className="p-3 text-center text-slate-400 text-xs">No employees found</div>
              ) : (
                filteredMembers.map((u) => {
                  const isSelected = selectedMemberIds.includes(u.id);
                  const isLead = leadId === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleMember(u.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/70 text-blue-900' : 'hover:bg-slate-100/60 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {u.initials || u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate leading-tight flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isLead && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                Team Lead
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {u.role} {u.department ? `• ${u.department}` : ''}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="input-team-desc" className="block font-medium text-slate-600 mb-1">
              Scope / Responsibilities (Optional)
            </label>
            <textarea
              id="input-team-desc"
              rows={2}
              placeholder="e.g. Responsible for GST registrations, monthly returns (GSTR-1, 3B), and annual reconciliations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-submit-team"
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
