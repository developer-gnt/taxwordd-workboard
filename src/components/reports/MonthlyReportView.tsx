import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { GntLogo } from '../common/GntLogo';
import { reportService, GeneratedMonthlyReport } from '../../services/reportService';
import { MonthlyReportFilter, TaskStatus, TaskPriority, User } from '../../types';
import { StatusBadge, PriorityBadge, ProjectStatusBadge } from '../ui/StatusBadge';
import { MonthPickerCalendar } from '../ui/MonthPickerCalendar';
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
  Sparkles,
  Layers,
  ArrowUpRight,
  Check,
  Briefcase,
} from 'lucide-react';

type ReportViewMode = 'OVERALL' | 'GROUP' | 'INDIVIDUAL';

export const MonthlyReportView: React.FC = () => {
  const { users, projects, tasks, teams, showToast, taskFilterState } = useApp();

  // Mode: Overall Organization vs Group Pods vs Individual Employee Report
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

  // Group filter states
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [overallGroupFilter, setOverallGroupFilter] = useState<string>('ALL');

  // Search & filter inside Pod Deliverables table
  const [podTaskSearch, setPodTaskSearch] = useState<string>('');
  const [podStatusFilter, setPodStatusFilter] = useState<string>('ALL');

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

  // Distinct groups ordered with operational groups (A, B, C, D) first, then administration
  const distinctGroups = useMemo(() => {
    const fromTeams = (teams || []).map((t) => t.name);
    const fromUsers = users.map((u) => u.department).filter(Boolean) as string[];
    const set = Array.from(new Set([...fromTeams, ...fromUsers]));
    return set.sort((a, b) => {
      const isGroupA = a.toLowerCase().startsWith('group');
      const isGroupB = b.toLowerCase().startsWith('group');
      if (isGroupA && !isGroupB) return -1;
      if (!isGroupA && isGroupB) return 1;
      return a.localeCompare(b);
    });
  }, [teams, users]);

  // Pod Brand Identity Theme Resolver
  const getPodTheme = (groupName: string) => {
    const g = groupName.toLowerCase();
    if (g.includes('a')) {
      return {
        key: 'A',
        label: 'Pod A',
        accentDot: 'bg-blue-600',
        topBorder: 'border-t-blue-600',
        badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
        bar: 'bg-blue-600',
        avatarBg: 'bg-blue-50 text-blue-700 border-blue-200',
        lightBg: 'bg-blue-50/30',
        ringActive: 'ring-2 ring-blue-600 bg-blue-50/20 shadow-md',
      };
    }
    if (g.includes('b')) {
      return {
        key: 'B',
        label: 'Pod B',
        accentDot: 'bg-emerald-600',
        topBorder: 'border-t-emerald-600',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        bar: 'bg-emerald-600',
        avatarBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        lightBg: 'bg-emerald-50/30',
        ringActive: 'ring-2 ring-emerald-600 bg-emerald-50/20 shadow-md',
      };
    }
    if (g.includes('c')) {
      return {
        key: 'C',
        label: 'Pod C',
        accentDot: 'bg-purple-600',
        topBorder: 'border-t-purple-600',
        badge: 'bg-purple-50 text-purple-700 border-purple-200/80',
        bar: 'bg-purple-600',
        avatarBg: 'bg-purple-50 text-purple-700 border-purple-200',
        lightBg: 'bg-purple-50/30',
        ringActive: 'ring-2 ring-purple-600 bg-purple-50/20 shadow-md',
      };
    }
    if (g.includes('d')) {
      return {
        key: 'D',
        label: 'Pod D',
        accentDot: 'bg-amber-500',
        topBorder: 'border-t-amber-500',
        badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
        bar: 'bg-amber-500',
        avatarBg: 'bg-amber-50 text-amber-700 border-amber-200',
        lightBg: 'bg-amber-50/30',
        ringActive: 'ring-2 ring-amber-500 bg-amber-50/20 shadow-md',
      };
    }
    return {
      key: 'Admin',
      label: 'Admin Pod',
      accentDot: 'bg-slate-700',
      topBorder: 'border-t-slate-700',
      badge: 'bg-slate-100 text-slate-700 border-slate-200/80',
      bar: 'bg-slate-700',
      avatarBg: 'bg-slate-100 text-slate-700 border-slate-300',
      lightBg: 'bg-slate-50/40',
      ringActive: 'ring-2 ring-slate-700 bg-slate-50/60 shadow-md',
    };
  };

  // Group-Wise Performance Aggregations
  const groupPerformance = useMemo(() => {
    return distinctGroups.map((gName) => {
      const teamObj = teams?.find((t) => t.name.toLowerCase() === gName.toLowerCase());
      const groupUsers = users.filter((u) => {
        const inDept = u.department?.toLowerCase() === gName.toLowerCase();
        const inTeam = teamObj?.memberIds.includes(u.id);
        return inDept || inTeam;
      });

      const memberIds = new Set(groupUsers.map((u) => u.id));
      const groupTasks = overallReport.detailedTasks.filter((t) => {
        const byMember = groupUsers.some((u) => u.name === t.ownerName);
        const byClient = t.clientName?.toLowerCase() === gName.toLowerCase();
        return byMember || byClient;
      });

      const empPerfs = overallReport.employeePerformance.filter(
        (ep) => memberIds.has(ep.employeeId) || ep.department?.toLowerCase() === gName.toLowerCase()
      );

      const totalTasks = empPerfs.reduce((sum, ep) => sum + ep.assigned, 0);
      const completed = empPerfs.reduce((sum, ep) => sum + ep.completed, 0);
      const active = empPerfs.reduce((sum, ep) => sum + ep.active, 0);
      const overdue = empPerfs.reduce((sum, ep) => sum + ep.overdue, 0);
      const blocked = empPerfs.reduce((sum, ep) => sum + ep.blocked, 0);

      const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

      let onTimeCount = 0;
      groupTasks.forEach((t) => {
        if (t.status === 'DONE' && t.isOnTime) onTimeCount++;
      });
      const onTimeRate = completed > 0 ? Math.round((onTimeCount / completed) * 100) : 100;

      const lead =
        groupUsers.find((u) => teamObj?.leadId === u.id) ||
        groupUsers.find((u) => u.name.toLowerCase() === teamObj?.leadName?.toLowerCase()) ||
        groupUsers[0];

      return {
        groupId: teamObj?.id || `group-${gName.toLowerCase().replace(/\s+/g, '-')}`,
        groupName: gName,
        department: teamObj?.department || 'Operations & Taxation',
        leadName: lead?.name || 'Unassigned',
        leadInitials: lead?.initials || 'TL',
        memberCount: groupUsers.length,
        members: groupUsers,
        totalTasks,
        completed,
        active,
        overdue,
        blocked,
        onTimeCount,
        completionRate,
        onTimeRate,
        tasks: groupTasks,
        theme: getPodTheme(gName),
      };
    });
  }, [distinctGroups, teams, users, overallReport]);

  // Overall Pod Summary Metrics
  const totalPodTasks = useMemo(() => {
    return groupPerformance.reduce((acc, g) => acc + g.totalTasks, 0);
  }, [groupPerformance]);

  const totalPodCompleted = useMemo(() => {
    return groupPerformance.reduce((acc, g) => acc + g.completed, 0);
  }, [groupPerformance]);

  const avgPodCompletion = totalPodTasks > 0 ? Math.round((totalPodCompleted / totalPodTasks) * 100) : 0;

  // Active individual employee object
  const activeEmployee: User | undefined = useMemo(() => {
    return users.find((u) => u.id === selectedEmployeeId);
  }, [users, selectedEmployeeId]);

  // Active individual performance summary
  const activeEmployeePerf = useMemo(() => {
    return individualReport.employeePerformance[0] || null;
  }, [individualReport]);

  const handleExportCSV = () => {
    if (viewMode === 'GROUP') {
      const lines: string[] = [];
      lines.push('"TAX WORLDD - GROUP / POD PERFORMANCE REPORT"');
      lines.push(`"Report Month","${selectedMonth}"`);
      lines.push(`"Generated At","${new Date().toLocaleString()}"`);
      lines.push('');
      lines.push(
        '"Group / Pod","Department","Team Lead","Staff Count","Assigned Deliverables","Completed","Active","Overdue","Blocked","Completion Rate %","On-Time Rate %"'
      );
      groupPerformance.forEach((g) => {
        lines.push(
          [
            g.groupName,
            g.department,
            g.leadName,
            g.memberCount,
            g.totalTasks,
            g.completed,
            g.active,
            g.overdue,
            g.blocked,
            `${g.completionRate}%`,
            `${g.onTimeRate}%`,
          ]
            .map((v) => `"${v}"`)
            .join(',')
        );
      });
      const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `TAXWORLDD_Group_Performance_${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(
        'Group Report Exported',
        `Group / Pod Monthly Report (${selectedMonth}) exported as CSV`,
        'success'
      );
      return;
    }

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

  // Filtered employees for Overall view based on overallGroupFilter
  const displayedOverallEmployees = useMemo(() => {
    return overallReport.employeePerformance.filter((emp) => {
      if (
        overallGroupFilter !== 'ALL' &&
        emp.department?.toLowerCase() !== overallGroupFilter.toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }, [overallReport.employeePerformance, overallGroupFilter]);

  // Tasks in scope for selected group in Group mode with search & status filters
  const displayedGroupTasks = useMemo(() => {
    let list = overallReport.detailedTasks;
    if (selectedGroup !== 'ALL') {
      const targetGroup = groupPerformance.find(
        (g) => g.groupName.toLowerCase() === selectedGroup.toLowerCase()
      );
      list = targetGroup ? targetGroup.tasks : [];
    }

    if (podTaskSearch.trim()) {
      const q = podTaskSearch.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.clientName.toLowerCase().includes(q) ||
          t.projectName.toLowerCase().includes(q) ||
          t.ownerName.toLowerCase().includes(q)
      );
    }

    if (podStatusFilter !== 'ALL') {
      if (podStatusFilter === 'OVERDUE') {
        list = list.filter((t) => t.isOverdue);
      } else {
        list = list.filter((t) => t.status === podStatusFilter);
      }
    }

    return list;
  }, [selectedGroup, overallReport.detailedTasks, groupPerformance, podTaskSearch, podStatusFilter]);

  return (
    <div id="monthly-report-view" className="space-y-6 pb-24 sm:pb-12">
      {/* ========================================================= */}
      {/* 1. EXECUTIVE TOP TOOLBAR (Fully Responsive for Mobile & Desktop) */}
      {/* ========================================================= */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5 sm:gap-4 no-print">
        {/* Left: Review Mode Switcher Segmented Control (3 Equal Columns on Mobile) */}
        <div className="w-full xl:w-auto">
          <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 w-full sm:flex sm:w-auto">
            <button
              id="tab-report-overall"
              onClick={() => setViewMode('OVERALL')}
              className={`w-full sm:w-auto justify-center px-2 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'OVERALL'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/70 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">Overall Organization</span>
              <span className="sm:hidden text-[11px] font-extrabold">Overall</span>
            </button>
            <button
              id="tab-report-group"
              onClick={() => setViewMode('GROUP')}
              className={`w-full sm:w-auto justify-center px-2 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'GROUP'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/70 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">Group-wise Performance</span>
              <span className="sm:hidden text-[11px] font-extrabold">Groups</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-bold shrink-0">
                {distinctGroups.length}
              </span>
            </button>
            <button
              id="tab-report-individual"
              onClick={() => setViewMode('INDIVIDUAL')}
              className={`w-full sm:w-auto justify-center px-2 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'INDIVIDUAL'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/70 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">Employee Monthly Reports</span>
              <span className="sm:hidden text-[11px] font-extrabold">Staff</span>
            </button>
          </div>
        </div>

        {/* Right: Review Cycle Calendar Popover & Export Actions (Full-width on Mobile) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full xl:w-auto justify-end">
          {/* Executive Proper Calendar Picker (Spans full width on mobile) */}
          <div className="w-full sm:w-auto">
            <MonthPickerCalendar
              value={selectedMonth}
              onChange={setSelectedMonth}
              tasks={tasks}
              className="w-full sm:w-auto"
            />
          </div>

          {/* Symmetrical 2-Column Action Buttons on Mobile, Inline on Desktop */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-export-report-csv"
              onClick={handleExportCSV}
              className="w-full sm:w-auto justify-center px-3.5 py-2 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Export CSV</span>
            </button>

            <button
              id="btn-print-report"
              onClick={handlePrint}
              className="w-full sm:w-auto justify-center px-4 py-2 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Print-Only Header */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          TAX WORLDD —{' '}
          {viewMode === 'INDIVIDUAL'
            ? `Employee Performance Review (${activeEmployee?.name})`
            : viewMode === 'GROUP'
            ? 'Group-wise Pod Performance Review'
            : 'Monthly Performance Review'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review Cycle: {selectedMonth} • Generated:{' '}
          {new Date(overallReport.generatedAt).toLocaleString()}
        </p>
      </div>

      {/* ========================================================= */}
      {/* MODE 2: GROUP-WISE POD PERFORMANCE REPORT (NEW & ENHANCED) */}
      {/* ========================================================= */}
      {viewMode === 'GROUP' && (
        <div className="space-y-6">
          {/* Pod Filter Navigation Ribbon with Live Summary */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 w-full md:w-auto sm:flex-wrap shrink-0">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1 shrink-0">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Filter Pod:</span>
              </span>

              {/* All Pods Pill */}
              <button
                type="button"
                onClick={() => setSelectedGroup('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  selectedGroup === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60'
                }`}
              >
                <span>All Pods</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedGroup === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {groupPerformance.length}
                </span>
              </button>

              {/* Individual Pod Pills */}
              {groupPerformance.map((g) => (
                <button
                  key={g.groupId}
                  type="button"
                  onClick={() => setSelectedGroup(g.groupName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    selectedGroup.toLowerCase() === g.groupName.toLowerCase()
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedGroup.toLowerCase() === g.groupName.toLowerCase()
                        ? 'bg-white'
                        : g.theme.accentDot
                    }`}
                  />
                  <span>{g.groupName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedGroup.toLowerCase() === g.groupName.toLowerCase()
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {g.totalTasks}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Summary Metadata */}
            <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold self-end md:self-auto">
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                <span>Scope: <strong className="text-slate-800">{totalPodTasks}</strong> tasks</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Completion: <strong className="text-emerald-700">{avgPodCompletion}%</strong></span>
              </span>
            </div>
          </div>

          {/* Section 1: Executive 5-Pod KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4.5">
            {groupPerformance.map((g) => {
              const isSelected =
                selectedGroup !== 'ALL' && selectedGroup.toLowerCase() === g.groupName.toLowerCase();

              return (
                <div
                  key={g.groupId}
                  onClick={() =>
                    setSelectedGroup(
                      selectedGroup.toLowerCase() === g.groupName.toLowerCase() ? 'ALL' : g.groupName
                    )
                  }
                  className={`p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer border-t-4 ${
                    g.theme.topBorder
                  } ${isSelected ? g.theme.ringActive : 'hover:-translate-y-0.5'}`}
                >
                  <div>
                    {/* Header: Pod Name & Department Badge */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${g.theme.accentDot}`} />
                        <h3 className="font-extrabold text-slate-900 text-sm">{g.groupName}</h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${g.theme.badge}`}>
                        {g.theme.label}
                      </span>
                    </div>

                    {/* Team Lead & Member Count */}
                    <div className="mb-3.5 pb-2.5 border-b border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-md font-bold text-[10px] flex items-center justify-center shrink-0 border ${g.theme.avatarBg}`}
                        >
                          {g.leadInitials}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-[11px] truncate leading-tight">
                            {g.leadName}
                          </p>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                            Team Lead
                          </span>
                        </div>
                      </div>
                      <span className="text-slate-500 font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        {g.memberCount} staff
                      </span>
                    </div>

                    {/* Stat Metrics Grid (Scope, Done, Overdue) */}
                    <div className="grid grid-cols-3 gap-1.5 mb-3.5 text-center">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Scope</span>
                        <p className="text-base font-black text-slate-900 mt-0.5">{g.totalTasks}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                        <span className="text-[9px] uppercase font-bold text-emerald-700 block">Done</span>
                        <p className="text-base font-black text-emerald-700 mt-0.5">{g.completed}</p>
                      </div>
                      <div
                        className={`p-2 rounded-xl border ${
                          g.overdue > 0
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : 'bg-slate-50/80 border-slate-100 text-slate-400'
                        }`}
                      >
                        <span
                          className={`text-[9px] uppercase font-bold block ${
                            g.overdue > 0 ? 'text-rose-700' : 'text-slate-400'
                          }`}
                        >
                          Overdue
                        </span>
                        <p
                          className={`text-base font-black mt-0.5 ${
                            g.overdue > 0 ? 'text-rose-700' : 'text-slate-400'
                          }`}
                        >
                          {g.overdue}
                        </p>
                      </div>
                    </div>

                    {/* Completion Progress Bar */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-500 text-[10px]">Completion</span>
                        <span className="font-black text-slate-900 text-[11px]">{g.completionRate}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${g.theme.bar}`}
                          style={{ width: `${Math.max(g.completionRate, 3)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Members Avatars Stack & On-Time Badge */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      {g.members.map((m) => (
                        <span
                          key={m.id}
                          title={`${m.name} (${m.role})`}
                          className="inline-block w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-extrabold ring-2 ring-white flex items-center justify-center shrink-0"
                        >
                          {m.initials}
                        </span>
                      ))}
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>{g.onTimeRate}% on-time</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section 2: Group Pods Comparison Table */}
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Group & Functional Pod Comparison Matrix
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Side-by-side deliverables velocity across all 5 operational units
              </span>
            </div>

            <div className="overflow-x-auto">
              <table id="table-report-group-comparison" className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-200/80 text-[10px] tracking-wider">
                    <th className="py-3 px-4">Group / Pod</th>
                    <th className="py-3 px-3">Team Lead</th>
                    <th className="py-3 px-3 text-center">Staff Count</th>
                    <th className="py-3 px-3 text-center">Assigned Scope</th>
                    <th className="py-3 px-3 text-center">Completed</th>
                    <th className="py-3 px-3 text-center">Active</th>
                    <th className="py-3 px-3 text-center">Overdue</th>
                    <th className="py-3 px-3 text-center">Blocked</th>
                    <th className="py-3 px-4 min-w-[140px]">Completion Velocity</th>
                    <th className="py-3 px-3 text-center">On-Time Rate</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupPerformance.map((g) => (
                    <tr key={g.groupId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${g.theme.accentDot} shrink-0`} />
                        <div>
                          <p className="font-extrabold text-slate-900 leading-tight">{g.groupName}</p>
                          <span className="text-[10px] text-slate-400 font-normal">{g.department}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-5 h-5 rounded-md text-[9px] font-bold flex items-center justify-center border ${g.theme.avatarBg}`}
                          >
                            {g.leadInitials}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">{g.leadName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">{g.memberCount}</td>
                      <td className="py-3 px-3 text-center font-extrabold text-slate-900">{g.totalTasks}</td>
                      <td className="py-3 px-3 text-center font-extrabold text-emerald-700">{g.completed}</td>
                      <td className="py-3 px-3 text-center text-slate-700 font-medium">{g.active}</td>
                      <td className="py-3 px-3 text-center">
                        {g.overdue > 0 ? (
                          <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {g.overdue}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {g.blocked > 0 ? (
                          <span className="font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                            {g.blocked}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-700">{g.completionRate}%</span>
                            <span className="text-slate-400">
                              {g.completed}/{g.totalTasks}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${g.theme.bar}`}
                              style={{ width: `${Math.max(g.completionRate, 2)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 ${
                            g.onTimeRate >= 80
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : g.onTimeRate >= 50
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{g.onTimeRate}%</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedGroup(g.groupName)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Audit Pod</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Group Deliverables Register with Search & Filter */}
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Deliverables Register — {selectedGroup === 'ALL' ? 'All Groups' : selectedGroup} (
                  {displayedGroupTasks.length})
                </h3>
              </div>

              {/* Search & Status Filters */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-60">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={podTaskSearch}
                    onChange={(e) => setPodTaskSearch(e.target.value)}
                    placeholder="Search by title, party, owner..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <select
                  value={podStatusFilter}
                  onChange={(e) => setPodStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="DONE">Completed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table id="table-report-group-tasks" className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-200/80 text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Deliverable Title</th>
                    <th className="py-2.5 px-3">Party & Client</th>
                    <th className="py-2.5 px-3">Assigned Owner</th>
                    <th className="py-2.5 px-3">Deadline</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-4">Next Action / Milestone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedGroupTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <FolderKanban className="w-8 h-8 text-slate-300" />
                          <p className="font-bold text-slate-700">No deliverables recorded for this pod</p>
                          <p className="text-slate-400 text-[11px] max-w-sm">
                            No tasks are currently assigned to {selectedGroup === 'ALL' ? 'these groups' : selectedGroup} in cycle {selectedMonth}. Create a new task deliverable and allocate it to this group or member.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedGroupTasks.map((t) => (
                      <tr key={t.taskId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{t.title}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t.projectName} ({t.clientName})</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 font-semibold">{t.ownerName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                          {t.dueDate || <span className="text-slate-400 font-sans italic">No deadline</span>}
                        </td>
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
                        <td className="py-2.5 px-4 text-slate-600 truncate max-w-[200px]">
                          {t.nextAction || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 1: INDIVIDUAL EMPLOYEE MONTHLY REPORT                */}
      {/* ========================================================= */}
      {viewMode === 'INDIVIDUAL' && (
        <div className="space-y-6">
          {/* Employee Selector Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-black text-sm flex items-center justify-center border border-blue-200">
                {activeEmployee?.initials || 'AT'}
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>{activeEmployee?.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {activeEmployee?.role}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  {activeEmployee?.email} • {activeEmployee?.department || 'Operations'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 whitespace-nowrap">Switch Employee:</span>
              <select
                id="select-employee-audit"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              >
                {users
                  .filter((u) => u.active)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}{u.department ? ` • ${u.department}` : ''})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {activeEmployee ? (
            <div className="space-y-6">
              {/* Individual Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Assigned Deliverables
                  </span>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {activeEmployeePerf?.assigned || 0}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Total scope this month</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Completed</span>
                  <p className="text-2xl font-black text-emerald-700 mt-1">
                    {activeEmployeePerf?.completed || 0}
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">
                    {activeEmployeePerf?.completionRate || 0}% Completion Rate
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/70">
                  <span className="text-[10px] uppercase font-bold text-blue-700">On-Time Rate</span>
                  <p className="text-2xl font-black text-blue-700 mt-1">
                    {activeEmployeePerf?.onTimeCompletionRate || 0}%
                  </p>
                  <p className="text-[10px] text-blue-600 mt-0.5">Delivered on/before deadline</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-600">Active</span>
                  <p className="text-2xl font-black text-slate-800 mt-1">
                    {activeEmployeePerf?.active || 0}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">In flight</p>
                </div>

                <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/70">
                  <span className="text-[10px] uppercase font-bold text-rose-700">Overdue</span>
                  <p className="text-2xl font-black text-rose-700 mt-1">
                    {activeEmployeePerf?.overdue || 0}
                  </p>
                  <p className="text-[10px] text-rose-600 mt-0.5">Past deadline</p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70">
                  <span className="text-[10px] uppercase font-bold text-amber-700">Blocked</span>
                  <p className="text-2xl font-black text-amber-700 mt-1">
                    {activeEmployeePerf?.blocked || 0}
                  </p>
                  <p className="text-[10px] text-amber-600 mt-0.5">Flagged impediments</p>
                </div>
              </div>

              {/* Employee's Detailed Tasks Table */}
              <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Deliverables Register for {activeEmployee.name} (
                      {individualReport.detailedTasks.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Cycle: {individualReport.monthLabel}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table
                    id="table-individual-employee-tasks"
                    className="w-full text-left text-xs border-collapse"
                  >
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 uppercase font-semibold border-b border-slate-200 text-[10px] tracking-wider">
                        <th className="py-2.5 px-4">Deliverable Title</th>
                        <th className="py-2.5 px-3">Party & Client</th>
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
                            No tasks assigned or active for {activeEmployee.name} in this review
                            cycle.
                          </td>
                        </tr>
                      ) : (
                        individualReport.detailedTasks.map((t) => (
                          <tr key={t.taskId} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-slate-900">{t.title}</td>
                            <td className="py-2.5 px-3 text-slate-600 font-medium">
                              {t.projectName} ({t.clientName})
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                              {t.dueDate || (
                                <span className="text-slate-400 font-sans italic">No deadline</span>
                              )}
                            </td>
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
                                <span className="text-[11px] font-medium text-slate-500">
                                  In Progress
                                </span>
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
      {/* MODE 3: OVERALL ORGANIZATION REPORT                       */}
      {/* ========================================================= */}
      {viewMode === 'OVERALL' && (
        <div className="space-y-6">
          {/* Section 1: Summary Metrics Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Monthly Deliverables & Velocity Summary
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {overallReport.summary.totalTasks} total planned & active deliverables in scope
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs border-t-3 border-t-slate-400">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Total Deliverables
                </span>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {overallReport.summary.totalTasks}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Assigned scope</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs border-t-3 border-t-emerald-500">
                <span className="text-[10px] uppercase font-bold text-emerald-600">Completed</span>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  {overallReport.summary.completed}
                </p>
                <p className="text-[10px] text-emerald-600 mt-0.5">
                  {overallReport.summary.completionRate}% completion rate
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs border-t-3 border-t-blue-500">
                <span className="text-[10px] uppercase font-bold text-blue-600">
                  On-Time Delivery
                </span>
                <p className="text-2xl font-black text-blue-700 mt-1">
                  {overallReport.summary.onTimeCompletion}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Delivered on/before due date</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs border-t-3 border-t-indigo-500">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Active in Flight
                </span>
                <p className="text-2xl font-black text-slate-800 mt-1">
                  {overallReport.summary.active}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Progressing</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs border-t-3 border-t-rose-500">
                <span className="text-[10px] uppercase font-bold text-rose-600">Overdue</span>
                <p className="text-2xl font-black text-rose-700 mt-1">
                  {overallReport.summary.overdue}
                </p>
                <p className="text-[10px] text-rose-600 mt-0.5">Past deadline</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs border-t-3 border-t-amber-500">
                <span className="text-[10px] uppercase font-bold text-amber-700">Blocked</span>
                <p className="text-2xl font-black text-amber-800 mt-1">
                  {overallReport.summary.blocked}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Requires manager action</p>
              </div>
            </div>
          </div>

          {/* Section 2: Employee Performance Summary Table with Group Filter Tabs */}
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Employee Accountability & Performance Register
                </h3>
              </div>

              {/* Quick Group-Wise Filter Tabs */}
              <div className="flex items-center gap-1 flex-wrap text-[11px]">
                <button
                  type="button"
                  onClick={() => setOverallGroupFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    overallGroupFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  All ({overallReport.employeePerformance.length})
                </button>
                {distinctGroups.map((g) => {
                  const countInGroup = overallReport.employeePerformance.filter(
                    (emp) => emp.department?.toLowerCase() === g.toLowerCase()
                  ).length;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setOverallGroupFilter(g)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        overallGroupFilter.toLowerCase() === g.toLowerCase()
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {g} ({countInGroup})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table
                id="table-report-employee-performance"
                className="w-full text-left text-xs border-collapse"
              >
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
                  {displayedOverallEmployees.map((emp) => (
                    <tr key={emp.employeeId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        <button
                          onClick={() => handleSelectEmployeeForReport(emp.employeeId)}
                          className="hover:text-blue-600 text-left font-bold cursor-pointer"
                        >
                          {emp.employeeName}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <span className="font-semibold text-slate-800">{emp.role}</span>
                        <span className="text-slate-400"> • {emp.department}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                        {emp.assigned}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                        {emp.completed}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700 font-medium">{emp.active}</td>
                      <td className="py-2.5 px-3 text-center">
                        {emp.overdue > 0 ? (
                          <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                            {emp.overdue}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {emp.blocked > 0 ? (
                          <span className="font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                            {emp.blocked}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-slate-900">
                        {emp.completionRate}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
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
                  Party Delivery & Client Health
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Aggregated milestone progress</span>
            </div>

            <div className="overflow-x-auto">
              <table
                id="table-report-project-summary"
                className="w-full text-left text-xs border-collapse"
              >
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-200/80 text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Party</th>
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
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                        {p.totalTasks}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                        {p.completed}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700 font-medium">{p.active}</td>
                      <td className="py-2.5 px-3 text-center">
                        {p.overdue > 0 ? (
                          <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                            {p.overdue}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {p.blocked > 0 ? (
                          <span className="font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                            {p.blocked}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-extrabold text-blue-700">
                        {p.completionRate}%
                      </td>
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
