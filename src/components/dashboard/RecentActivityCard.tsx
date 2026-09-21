import React from 'react';
import { TaskActivity } from '../../types';
import { useApp } from '../../context/AppContext';
import { History, ArrowRight } from 'lucide-react';

interface RecentActivityCardProps {
  activities: TaskActivity[];
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ activities }) => {
  const { openTaskDetail } = useApp();

  const recent = activities.slice(0, 6);

  return (
    <div
      id="card-recent-activity"
      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <History className="w-4 h-4 stroke-[2]" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Task Activity</h3>
            <p className="text-xs text-slate-500">Immutable operational audit trail of team actions</p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-slate-400">Live Log</span>
      </div>

      <div className="mt-3 divide-y divide-slate-100">
        {recent.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No activity recorded yet</div>
        ) : (
          recent.map((act) => {
            let timeFormatted = '';
            let hourFormatted = '';
            try {
              if (act.timestamp) {
                const d = new Date(act.timestamp);
                if (!isNaN(d.getTime())) {
                  timeFormatted = d.toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  });
                  hourFormatted = d.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                }
              }
            } catch {}

            const userInitials = act.userName
              ? act.userName
                  .split(' ')
                  .filter(Boolean)
                  .map((s) => s[0])
                  .join('')
                  .slice(0, 2)
              : '--';

            return (
              <div
                key={act.id}
                onClick={() => act.taskId && openTaskDetail(act.taskId)}
                className="py-2.5 px-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-blue-100 group-hover:text-blue-800 transition-colors">
                  {userInitials}
                </div>

                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex items-baseline justify-between gap-1">
                    <p className="font-semibold text-slate-900 truncate">
                      <span className="font-bold">{act.userName || 'System'}</span>
                      {act.userRole && <span className="text-slate-400 font-normal"> ({act.userRole})</span>}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {timeFormatted} {hourFormatted}
                    </span>
                  </div>

                  <p className="text-slate-600 mt-0.5 leading-relaxed">{act.action}</p>

                  {act.taskTitle && (
                    <p className="text-[11px] text-blue-600 font-medium truncate mt-0.5 group-hover:underline">
                      Task: {act.taskTitle}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
