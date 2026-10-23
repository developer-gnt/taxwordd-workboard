import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { reportService } from '../../services/reportService';
import { StatusBadge, PriorityBadge } from '../../components/ui/StatusBadge';
import {
  FileBarChart2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  Award,
} from 'lucide-react';

export const EmployeeMonthlySummaryView: React.FC = () => {
  const { currentUser } = useApp();

  // Build a dynamic list of months: last 12 months up to next 3
  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = -12; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  }, []);

  const currentMonthValue = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);

  const report = useMemo(() => {
    return reportService.generateMonthlyReport({
      month: selectedMonth,
      employeeId: currentUser?.id,
    });
  }, [selectedMonth, currentUser?.id]);

  if (!currentUser) return null;

  const myPerf = report.employeePerformance[0];

  const handleExportCSV = () => {
    reportService.exportReportToCSV(report);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="employee-monthly-summary-view" className="space-y-6 max-w-5xl">
      {/* Top Header Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">
            Personal Performance Review
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            {currentUser.name} • {report.monthLabel} Review Cycle
          </h2>
          <p className="text-xs text-slate-500">
            Objective delivery metrics compiled for monthly managerial assessment
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Deliverables</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{myPerf?.assigned || 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Assigned scope</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Delivered</span>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">{myPerf?.completed || 0}</p>
          <p className="text-xs text-emerald-600 mt-0.5">{myPerf?.completionRate || 0}% Completion Rate</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-blue-600">On-Time Accuracy</span>
          <p className="text-3xl font-extrabold text-blue-700 mt-1">
            {myPerf?.onTimeCompletionRate || 0}%
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Delivered on or before deadline</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-rose-600">Current Overdue</span>
          <p className="text-3xl font-extrabold text-rose-700 mt-1">{myPerf?.overdue || 0}</p>
          <p className="text-xs text-rose-600 mt-0.5">Requires immediate focus</p>
        </div>
      </div>

      {/* Detailed Tasks for this month */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Deliverables Log for Review Discussion ({report.detailedTasks.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-200/80 text-[10px]">
                <th className="py-2.5 px-4">Task</th>
                <th className="py-2.5 px-3">Party</th>
                <th className="py-2.5 px-3">Deadline</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Delivery Outcome</th>
                <th className="py-2.5 px-4">Next Action Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.detailedTasks.map((t) => (
                <tr key={t.taskId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-slate-900">{t.title}</td>
                  <td className="py-2.5 px-3 text-slate-600">{t.projectName}</td>
                  <td className="py-2.5 px-3 font-mono">{t.dueDate || <span className="text-slate-400 font-sans italic">No deadline</span>}</td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={t.status} size="sm" />
                  </td>
                  <td className="py-2.5 px-3">
                    {t.status === 'DONE' ? (
                      t.isOnTime ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          ✓ On-Time
                        </span>
                      ) : (
                        <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded" title={t.delayDays > 0 ? `Completed ${t.delayDays} day(s) after deadline` : ''}>
                          ⚠ Delayed{t.delayDays > 0 ? ` by ${t.delayDays}d` : ''}
                        </span>
                      )
                    ) : t.isOverdue ? (
                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded" title={`${t.delayDays} day(s) past deadline`}>
                        🔴 Overdue {t.delayDays > 0 ? `(${t.delayDays}d)` : ''}
                      </span>
                    ) : t.status === 'BLOCKED' ? (
                      <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                        🚫 Blocked
                      </span>
                    ) : t.status === 'REVIEW' ? (
                      <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        👀 In Review
                      </span>
                    ) : t.status === 'IN_PROGRESS' ? (
                      <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                        ⏳ In Progress
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        Not Started
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 max-w-[240px] truncate">{t.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
