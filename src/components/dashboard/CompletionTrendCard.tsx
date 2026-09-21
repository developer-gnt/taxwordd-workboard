import React, { useState } from 'react';
import { Task } from '../../types';
import { TrendingUp, CheckCircle, Clock, ShieldAlert, Target, Award } from 'lucide-react';

interface CompletionTrendCardProps {
  tasks: Task[];
}

export const CompletionTrendCard: React.FC<CompletionTrendCardProps> = ({ tasks }) => {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  const monthShort = now.toLocaleString('en-US', { month: 'short' });
  const todayStr = now.toISOString().split('T')[0];
  const lastDay = new Date(year, month + 1, 0).getDate();

  const pad = (n: number) => n.toString().padStart(2, '0');
  const ym = `${year}-${pad(month + 1)}`;

  // Derive weekly milestones dynamically for current month
  const weeks = [
    { label: `W1 (${monthShort} 1–7)`, start: `${ym}-01`, end: `${ym}-07` },
    { label: `W2 (${monthShort} 8–14)`, start: `${ym}-08`, end: `${ym}-14` },
    { label: `W3 (${monthShort} 15–21)`, start: `${ym}-15`, end: `${ym}-21` },
    { label: `W4 (${monthShort} 22–${lastDay})`, start: `${ym}-22`, end: `${ym}-${pad(lastDay)}` },
  ];

  const trendData = weeks.map((w) => {
    const dueInWeek = tasks.filter((t) => t.dueDate && t.dueDate >= w.start && t.dueDate <= w.end);
    const completed = dueInWeek.filter((t) => t.status === 'DONE').length;
    const total = dueInWeek.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isCurrent = todayStr >= w.start && todayStr <= w.end;
    const isPast = todayStr > w.end;
    return {
      label: w.label,
      total,
      completed,
      rate,
      isCurrent,
      isPast,
    };
  });

  const totalDone = tasks.filter((t) => t.status === 'DONE').length;
  const activeTasks = tasks.filter((t) => t.status !== 'DONE');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const reviewTasks = tasks.filter((t) => t.status === 'REVIEW').length;
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED').length;
  const overallRate = tasks.length > 0 ? Math.round((totalDone / tasks.length) * 100) : 0;

  // On-time delivery rate among completed
  const onTimeDone = tasks.filter((t) => {
    if (t.status !== 'DONE') return false;
    if (!t.dueDate) return true;
    const comp = t.completedAt ? t.completedAt.split('T')[0] : t.dueDate;
    return comp <= t.dueDate;
  }).length;
  const onTimeRate = totalDone > 0 ? Math.round((onTimeDone / totalDone) * 100) : 100;

  return (
    <div
      id="card-completion-trend"
      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4 stroke-[2]" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Task Completion Velocity</h3>
              <p className="text-xs text-slate-500">Real-time delivery progress against {monthName} {year} deadlines</p>
            </div>
          </div>

          <div className="text-right flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold text-slate-900">{overallRate}%</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Delivery</span>
          </div>
        </div>

        {/* Visual Chart Bars */}
        <div className="mt-3.5 space-y-2">
          {trendData.map((d, index) => {
            const isSelected = selectedPoint === index;
            return (
              <div
                key={d.label}
                onMouseEnter={() => setSelectedPoint(index)}
                onMouseLeave={() => setSelectedPoint(null)}
                className={`p-2 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-blue-50/60 border-blue-200 shadow-2xs'
                    : d.isCurrent
                    ? 'bg-slate-50/80 border-blue-200/80 ring-1 ring-blue-100'
                    : 'bg-slate-50/40 border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800 text-[11px]">{d.label}</span>
                    {d.isCurrent && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 uppercase tracking-wide">
                        Active
                      </span>
                    )}
                    {d.rate === 100 && d.total > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                        Complete
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-900 text-[11px]">
                    {d.completed} of {d.total} tasks ({d.rate}%)
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      d.rate === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${d.rate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Operational Velocity KPI Row */}
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold uppercase">
              <Award className="w-3 h-3 text-emerald-600" />
              <span>On-Time Rate</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900">{onTimeRate}%</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold uppercase">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>In Progress</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {inProgressTasks} <span className="text-[10px] font-normal text-slate-500">({reviewTasks} in review)</span>
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold uppercase">
              <ShieldAlert className="w-3 h-3 text-purple-600" />
              <span>Impediments</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {blockedTasks}{' '}
              <span className="text-[10px] font-normal text-slate-500">{blockedTasks === 1 ? 'task' : 'tasks'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>{totalDone} Completed deliverables</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>{activeTasks.length} Active in flight</span>
        </span>
      </div>
    </div>
  );
};

