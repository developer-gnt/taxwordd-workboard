import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { GntLogo } from '../common/GntLogo';
import { reportService, GeneratedMonthlyReport } from '../../services/reportService';
import { MonthlyReportFilter, TaskStatus, TaskPriority, User } from '../../types';
import { StatusBadge, PriorityBadge, ProjectStatusBadge } from '../ui/StatusBadge';
import {
  FileBarChart2,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  User as UserIcon,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Search,
  RotateCcw,
  Award,
  ChevronRight,
  ShieldCheck,
  Building2,
  Target,
  ArrowUpRight,
} from 'lucide-react';

type ReportViewMode = 'OVERALL' | 'INDIVIDUAL';

export const MonthlyReportView: React.FC = () => {
  const { users, projects, tasks, showToast, taskFilterState } = useApp();

  // Mode: Overall Organization vs Individual Employee Report
  const [viewMode, setViewMode] = useState<ReportViewMode>(
    taskFilterState?.employeeId ? 'INDIVIDUAL' : 'OVERALL'
  );

  // Selected Month (Default: '2026-09')
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    taskFilterState?.employeeId || (users.find((u) => u.active)?.id || '')
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'ALL'>('ALL');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Filter for Overall Report
  const overallFilter: MonthlyReportFilter = useMemo(
    () => ({
      month: selectedMonth,
      projectId: selectedProjectId || undefined,
      status: selectedStatus,
      priority: selectedPriority,
    }),
    [selectedMonth, selectedProjectId, selectedStatus, selectedPriority]
  );

  // Filter for Individual Employee Report
  const individualFilter: MonthlyReportFilter = useMemo(
    () => ({
      month: selectedMonth,
      employeeId: selectedEmployeeId || undefined,
      projectId: selectedProjectId || undefined,
      status: selectedStatus,
      priority: selectedPriority,
    }),
    [selectedMonth, selectedEmployeeId, selectedProjectId, selectedStatus, selectedPriority]
  );

  // Generate Reports
  const overallReport: GeneratedMonthlyReport = useMemo(() => {
    return reportService.generateMonthlyReport(overallFilter);
  }, [overallFilter, tasks, users, projects]);

  const individualReport: GeneratedMonthlyReport = useMemo(() => {
    return reportService.generateMonthlyReport(individualFilter);
  }, [individualFilter, tasks, users, projects]);

  // Currently active selected employee object
  const activeEmployee: User | undefined = useMemo(() => {
    return users.find((u) => u.id === selectedEmployeeId);
  }, [users, selectedEmployeeId]);

  // Active individual performance summary
  const activeEmployeePerf = useMemo(() => {
    return individualReport.employeePerformance[0] || null;
  }, [individualReport]);

  const handleExportCSV = () => {
    const targetReport = viewMode === 'INDIVIDUAL' ? individualReport : overallReport;
    reportService.exportReportToCSV(targetReport);
    showToast(
      'Report Exported Successfully',
      `${viewMode === 'INDIVIDUAL' ? `${activeEmployee?.name || 'Employee'} Monthly Report` : 'Overall Organization Report'} (${selectedMonth}) exported as CSV`,
      'success'
    );
  };

  const handlePrint = () => {
    showToast(
      'Print Preview Initialized',
      'Opening browser print preview dialog for executive PDF archiving',
      'info'
    );
    setTimeout(() => window.print(), 200);
  };

  const handleSelectEmployeeForReport = (empId: string) => {
    setSelectedEmployeeId(empId);
    setViewMode('INDIVIDUAL');
  };

  const monthOptions = [
    { value: '2026-07', label: 'July 2026' },
    { value: '2026-08', label: 'August 2026' },
    { value: '2026-09', label: 'September 2026 (Current Review Cycle)' },
    { value: '2026-10', label: 'October 2026' },
  ];

  const filteredEmployeesList = users.filter((u) => {
    if (!employeeSearch.trim()) return true;
    const q = employeeSearch.toLowerCase().trim();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.department && u.department.toLowerCase().includes(q));
  });

  return (
    <div id="monthly-report-view" className="space-y-6">
      {/* Top Header & Mode Toggle Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 no-print">
        {/* Left: Review Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              id="tab-report-overall"
              onClick={() => setViewMode('OVERALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'OVERALL'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Overall Organization</span>
            </button>
            <button
              id="tab-report-individual"
              onClick={() => setViewMode('INDIVIDUAL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'INDIVIDUAL'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Employee Monthly Reports</span>
            </button>
          </div>

          {/* Month Selector */}
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              id="select-report-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="font-bold text-slate-900 text-xs bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Month Select */}
          <div className="sm:hidden flex-1">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            id="btn-export-report-csv"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Print / Save PDF Button */}
          <button
            id="btn-print-report"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Print-Only Header */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <div className="flex justify-center mb-2">
          <GntLogo variant="full" size="md" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
          GNT Workboard — {viewMode === 'INDIVIDUAL' ? `Employee Performance Review (${activeEmployee?.name})` : 'Monthly Performance Review'}
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Review Cycle: {overallReport.monthLabel} • Generated: {new Date(overallReport.generatedAt).toLocaleString()}
        </p>
      </div>

      {/* ========================================================= */}
      {/* MODE 1: INDIVIDUAL EMPLOYEE MONTHLY REPORT                */}
      {/* ========================================================= */}
      {viewMode === 'INDIVIDUAL' && (
        <div className="space-y-6">
          {/* Employee Selection Bar */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Select Employee:</span>
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter employees..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Quick Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {filteredEmployeesList.slice(0, 5).map((u) => {
                const isSelected = u.id === selectedEmployeeId;
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedEmployeeId(u.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-700'}`}>
                      {u.initials}
                    </span>
                    <span>{u.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Employee Profile & Scorecard Header */}
          {activeEmployee ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-sm">
                    {activeEmployee.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-slate-900">{activeEmployee.name}</h2>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          activeEmployee.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700 border-purple-200'
                            : activeEmployee.role === 'MANAGER'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {activeEmployee.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeEmployee.email} • {activeEmployee.department || 'Operations'} Department
                    </p>
                  </div>
                </div>

                {/* Scorecard Rating */}
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Execution Rating
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {activeEmployeePerf && activeEmployeePerf.onTimeCompletionRate >= 85
                        ? '🌟 Exceptional Velocity (90%+ On-Time)'
                        : activeEmployeePerf && activeEmployeePerf.onTimeCompletionRate >= 70
                        ? '✅ Consistent Delivery (70%+ On-Time)'
                        : '⚠️ Needs Attention / Blockers Flagged'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bento KPIs for this Employee */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Assigned</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{activeEmployeePerf?.assigned || 0}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Deliverables</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Delivered</span>
                  <p className="text-2xl font-black text-emerald-700 mt-1">{activeEmployeePerf?.completed || 0}</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">{activeEmployeePerf?.completionRate || 0}% completed</p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/70">
                  <span className="text-[10px] uppercase font-bold text-blue-700">On-Time Accuracy</span>
                  <p className="text-2xl font-black text-blue-700 mt-1">{activeEmployeePerf?.onTimeCompletionRate || 0}%</p>
                  <p className="text-[10px] text-blue-600 mt-0.5">Within deadline</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-500">In Flight</span>
                  <p className="text-2xl font-black text-slate-800 mt-1">{activeEmployeePerf?.active || 0}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Active progress</p>
                </div>

                <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/70">
                  <span className="text-[10px] uppercase font-bold text-rose-700">Overdue</span>
                  <p className="text-2xl font-black text-rose-700 mt-1">{activeEmployeePerf?.overdue || 0}</p>
                  <p className="text-[10px] text-rose-600 mt-0.5">Past deadline</p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70">
                  <span className="text-[10px] uppercase font-bold text-amber-700">Blocked</span>
                  <p className="text-2xl font-black text-amber-700 mt-1">{activeEmployeePerf?.blocked || 0}</p>
                  <p className="text-[10px] text-amber-600 mt-0.5">Flagged impediments</p>
                </div>
              </div>

              {/* Employee's Detailed Tasks Table */}
              <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Deliverables Register for {activeEmployee.name} ({individualReport.detailedTasks.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Cycle: {individualReport.monthLabel}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table id="table-individual-employee-tasks" className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 uppercase font-semibold border-b border-slate-200 text-[10px] tracking-wider">
                        <th className="py-2.5 px-4">Deliverable Title</th>
                        <th className="py-2.5 px-3">Project & Client</th>
                        <th className="py-2.5 px-3">Deadline</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Outcome</th>
                        <th className="py-2.5 px-4 min-w-[200px]">Next Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {individualReport.detailedTasks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            No tasks assigned or active for {activeEmployee.name} in this review cycle.
                          </td>
                        </tr>
                      ) : (
                        individualReport.detailedTasks.map((t) => (
                          <tr key={t.taskId} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-slate-900">{t.title}</td>
                            <td className="py-2.5 px-3 text-slate-600 font-medium">
                              {t.projectName} ({t.clientName})
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">{t.dueDate || <span className="text-slate-400 font-sans italic">No deadline</span>}</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <StatusBadge status={t.status} size="sm" />
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {t.status === 'DONE' ? (
                                t.isOnTime ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>On-Time</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    <Clock className="w-3 h-3" />
                                    <span>Delayed</span>
                                  </span>
                                )
                              ) : t.isOverdue ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Overdue</span>
                                </span>
                              ) : t.status === 'BLOCKED' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                                  <span>Blocked</span>
                                </span>
                              ) : (
                                <span className="text-[11px] font-medium text-slate-500">In Progress</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-slate-700">{t.nextAction}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
              Please select an employee above to view their monthly report.
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: OVERALL ORGANIZATION REPORT                       */}
      {/* ========================================================= */}
      {viewMode === 'OVERALL' && (
        <div className="space-y-6">
          {/* Section 1: Summary Metrics Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Monthly Deliverables & Velocity Summary
              </h2>
              <span className="text-xs text-slate-400">
                {overallReport.summary.totalTasks} total planned & active deliverables in scope
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Deliverables</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{overallReport.summary.totalTasks}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Assigned scope</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-emerald-600">Completed</span>
                <p className="text-2xl font-extrabold text-emerald-700 mt-1">{overallReport.summary.completed}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">{overallReport.summary.completionRate}% completion rate</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-blue-600">On-Time Delivery</span>
                <p className="text-2xl font-extrabold text-blue-700 mt-1">{overallReport.summary.onTimeCompletion}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Delivered on/before due date</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500">Active in Flight</span>
                <p className="text-2xl font-extrabold text-slate-800 mt-1">{overallReport.summary.active}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Progressing</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-rose-600">Overdue</span>
                <p className="text-2xl font-extrabold text-rose-700 mt-1">{overallReport.summary.overdue}</p>
                <p className="text-[10px] text-rose-600 mt-0.5">Past deadline</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-rose-700">Blocked</span>
                <p className="text-2xl font-extrabold text-rose-800 mt-1">{overallReport.summary.blocked}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Requires manager action</p>
              </div>
            </div>
          </div>

          {/* Section 2: Employee Performance Summary Table with Deep Dive Buttons */}
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Employee Accountability & Performance Register
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Click "View Report" on any employee for their full individual monthly audit
              </span>
            </div>

            <div className="overflow-x-auto">
              <table id="table-report-employee-performance" className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-200/80 text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Team Member</th>
                    <th className="py-2.5 px-3">Role & Dept</th>
                    <th className="py-2.5 px-3 text-center">Assigned</th>
                    <th className="py-2.5 px-3 text-center">Completed</th>
                    <th className="py-2.5 px-3 text-center">Active</th>
                    <th className="py-2.5 px-3 text-center">Overdue</th>
                    <th className="py-2.5 px-3 text-center">Blocked</th>
                    <th className="py-2.5 px-3 text-center">Completion Rate</th>
                    <th className="py-2.5 px-3 text-center">On-Time Rate</th>
                    <th className="py-2.5 px-4 text-right">Individual Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overallReport.employeePerformance.map((emp) => (
                    <tr key={emp.employeeId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        <button
                          onClick={() => handleSelectEmployeeForReport(emp.employeeId)}
                          className="hover:text-blue-600 text-left font-bold"
                        >
                          {emp.employeeName}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <span className="font-semibold text-slate-800">{emp.role}</span>
                        <span className="text-slate-400"> • {emp.department}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">{emp.assigned}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{emp.completed}</td>
                      <td className="py-2.5 px-3 text-center text-slate-700">{emp.active}</td>
                      <td className="py-2.5 px-3 text-center">
                        {emp.overdue > 0 ? (
                          <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                            {emp.overdue}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {emp.blocked > 0 ? (
                          <span className="font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                            {emp.blocked}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">{emp.completionRate}%</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded ${
                            emp.onTimeCompletionRate >= 80
                              ? 'bg-emerald-50 text-emerald-700'
                              : emp.onTimeCompletionRate >= 50
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {emp.onTimeCompletionRate}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleSelectEmployeeForReport(emp.employeeId)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Monthly Report</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Project Summary Table */}
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Project Delivery & Client Health
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Aggregated milestone progress</span>
            </div>

            <div className="overflow-x-auto">
              <table id="table-report-project-summary" className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-200/80 text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Project</th>
                    <th className="py-2.5 px-3">Client</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Deliverables</th>
                    <th className="py-2.5 px-3 text-center">Completed</th>
                    <th className="py-2.5 px-3 text-center">Active</th>
                    <th className="py-2.5 px-3 text-center">Overdue</th>
                    <th className="py-2.5 px-3 text-center">Blocked</th>
                    <th className="py-2.5 px-4 text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overallReport.projectPerformance.map((p) => (
                    <tr key={p.projectId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{p.projectName}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{p.clientName}</td>
                      <td className="py-2.5 px-3">
                        <ProjectStatusBadge status={p.status} />
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">{p.totalTasks}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{p.completed}</td>
                      <td className="py-2.5 px-3 text-center text-slate-700">{p.active}</td>
                      <td className="py-2.5 px-3 text-center">
                        {p.overdue > 0 ? (
                          <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                            {p.overdue}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {p.blocked > 0 ? (
                          <span className="font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                            {p.blocked}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-blue-700">{p.completionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
