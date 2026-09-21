import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { useApp } from '../../context/AppContext';
import { authService } from '../../services/authService';
import {
  Users,
  Plus,
  KeyRound,
  UserCheck,
  UserX,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Trash2,
  FileBarChart2,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface TeamTableProps {
  onOpenAddUser: () => void;
  onOpenEditUser: (user: User) => void;
  onOpenResetPin: (user: User) => void;
  onOpenChangeRole: (user: User) => void;
}

export const TeamTable: React.FC<TeamTableProps> = ({
  onOpenAddUser,
  onOpenEditUser,
  onOpenResetPin,
  onOpenChangeRole,
}) => {
  const { users, tasks, currentUser, toggleUserActive, deleteUser, navigateTo } = useApp();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(25);

  const canManageUsers = authService.canManageUsers(currentUser);

  const filtered = users.filter((u) => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const match =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    return true;
  });

  const totalItems = filtered.length;
  const itemsPerPage = pageSize === 'ALL' ? totalItems || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (validPage - 1) * (pageSize === 'ALL' ? totalItems : pageSize);
  const paginatedUsers = pageSize === 'ALL' ? filtered : filtered.slice(startIndex, startIndex + pageSize);

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    await deleteUser(userToDelete.id);
    setDeleting(false);
    setUserToDelete(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Add Team Member */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-team-search"
            type="text"
            placeholder="Search employees by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="select-team-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admins</option>
            <option value="MANAGER">Managers</option>
            <option value="EMPLOYEE">Employees</option>
          </select>

          {canManageUsers && (
            <button
              id="btn-add-team-member"
              onClick={onOpenAddUser}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="table-team-members" className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-200/80 text-[11px] tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3 text-center">Active Tasks</th>
                <th className="py-3 px-3 text-center">Completed</th>
                <th className="py-3 px-3">Status</th>
                {canManageUsers && <th className="py-3 px-4 text-right">Admin Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.map((u) => {
                const userTasks = tasks.filter(
                  (t) =>
                    t.assignedEmployeeId === u.id ||
                    (u.email && t.assignedEmployeeId?.toLowerCase() === u.email.toLowerCase()) ||
                    (t.assignedEmployeeName && t.assignedEmployeeName !== 'Unassigned' && t.assignedEmployeeName.toLowerCase().trim() === u.name.toLowerCase().trim())
                );
                const activeCount = userTasks.filter((t) => t.status !== 'DONE').length;
                const completedCount = userTasks.filter((t) => t.status === 'DONE').length;
                const isCurrentSelf = currentUser?.id === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Member */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200/60">
                          {u.initials}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : u.role === 'MANAGER'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {u.department || 'Operations'}
                    </td>

                    {/* Active Tasks */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          const targetRoute = currentUser?.role === 'ADMIN' ? '/admin/tasks' : '/manager/tasks';
                          navigateTo(targetRoute, { employeeId: u.id, status: 'ALL' });
                        }}
                        className="font-bold text-blue-600 hover:underline px-2 py-0.5 rounded bg-blue-50"
                      >
                        {activeCount}
                      </button>
                    </td>

                    {/* Completed Tasks */}
                    <td className="py-3 px-3 text-center font-semibold text-emerald-700">
                      {completedCount}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <UserX className="w-3 h-3" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>

                    {/* Admin Actions */}
                    {canManageUsers && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-edit-user-${u.id}`}
                            onClick={() => onOpenEditUser(u)}
                            title="Edit Employee Information"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                            <span className="text-[11px] font-semibold">Edit</span>
                          </button>

                          <button
                            id={`btn-reset-pin-${u.id}`}
                            onClick={() => onOpenResetPin(u)}
                            title="Reset Security PIN"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-semibold">PIN</span>
                          </button>

                          <button
                            id={`btn-change-role-${u.id}`}
                            onClick={() => onOpenChangeRole(u)}
                            title="Change Employee Role"
                            className="p-1.5 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-purple-700 transition-colors flex items-center gap-1"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                            <span className="text-[11px] font-semibold">Role</span>
                          </button>

                          <button
                            id={`btn-employee-report-${u.id}`}
                            onClick={() => {
                              const targetRoute = currentUser?.role === 'ADMIN' ? '/admin/reports' : '/manager/reports';
                              navigateTo(targetRoute, { employeeId: u.id });
                            }}
                            title="View Employee Monthly Performance Report"
                            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-blue-700 transition-colors flex items-center gap-1"
                          >
                            <FileBarChart2 className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[11px] font-semibold">Report</span>
                          </button>

                          <button
                            id={`btn-toggle-active-${u.id}`}
                            onClick={() => toggleUserActive(u.id)}
                            title={u.active ? 'Deactivate Employee' : 'Reactivate Employee'}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                              u.active
                                ? 'text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-slate-200'
                                : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200 bg-emerald-50/50'
                            }`}
                          >
                            {u.active ? 'Deactivate' : 'Activate'}
                          </button>

                          {!isCurrentSelf && (
                            <button
                              id={`btn-delete-user-${u.id}`}
                              onClick={() => setUserToDelete(u)}
                              title="Delete Employee Permanently"
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-semibold">Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-bold text-slate-900">
              {totalItems === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + (pageSize === 'ALL' ? totalItems : pageSize), totalItems)}
            </span>
            <span>of</span>
            <span className="font-bold text-slate-900">{totalItems}</span>
            <span>team members</span>

            <div className="ml-2 flex items-center gap-1.5">
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  setPageSize(val);
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="ALL">All</option>
              </select>
            </div>
          </div>

          {pageSize !== 'ALL' && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={validPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
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
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Delete Employee Account?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently delete <strong>{userToDelete.name}</strong> ({userToDelete.email})?
                </p>
                <p className="text-[11px] text-rose-600 font-medium mt-2 bg-rose-50 p-2 rounded-lg border border-rose-200/60">
                  This action cannot be undone. Any active tasks assigned to this employee will be marked as unassigned.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting...' : 'Delete Employee'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
