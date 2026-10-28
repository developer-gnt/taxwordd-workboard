import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Sparkles,
  Check,
  CheckCircle2,
  CalendarDays,
  Layers,
} from 'lucide-react';
import { Task } from '../../types';

interface MonthPickerCalendarProps {
  value: string; // Format: "YYYY-MM" (e.g. "2026-09")
  onChange: (monthStr: string) => void;
  tasks?: Task[];
  className?: string;
  currentCycleMonth?: string; // Default '2026-09'
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const MonthPickerCalendar: React.FC<MonthPickerCalendarProps> = ({
  value,
  onChange,
  tasks = [],
  className = '',
  currentCycleMonth = '2026-09',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [calendarTab, setCalendarTab] = useState<'MONTHS' | 'DAYS'>('MONTHS');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const [selectedYear, selectedMonthIndex] = useMemo(() => {
    if (!value || !value.includes('-')) {
      const now = new Date();
      return [now.getFullYear(), now.getMonth()];
    }
    const [y, m] = value.split('-').map(Number);
    return [y, (m || 1) - 1];
  }, [value]);

  // Viewing year / month inside the calendar popup
  const [navYear, setNavYear] = useState<number>(selectedYear);
  const [navMonthIndex, setNavMonthIndex] = useState<number>(selectedMonthIndex);

  // Sync nav state when opened
  useEffect(() => {
    if (isOpen) {
      setNavYear(selectedYear);
      setNavMonthIndex(selectedMonthIndex);
    }
  }, [isOpen, selectedYear, selectedMonthIndex]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Today's actual date info
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  // Task count per month in the current viewing year
  const tasksCountByMonth = useMemo(() => {
    const counts: Record<number, number> = {};
    tasks.forEach((t) => {
      const dateStr = t.dueDate || t.createdAt;
      if (!dateStr) return;
      const [y, m] = dateStr.split('-').map(Number);
      if (y === navYear && m >= 1 && m <= 12) {
        counts[m - 1] = (counts[m - 1] || 0) + 1;
      }
    });
    return counts;
  }, [tasks, navYear]);

  // Days in month calculation for DAYS view
  const daysInNavMonth = useMemo(() => {
    const date = new Date(navYear, navMonthIndex + 1, 0);
    return date.getDate();
  }, [navYear, navMonthIndex]);

  const firstDayOfWeek = useMemo(() => {
    const date = new Date(navYear, navMonthIndex, 1);
    return date.getDay(); // 0 is Sunday
  }, [navYear, navMonthIndex]);

  // Task count per day in the nav month
  const tasksCountByDay = useMemo(() => {
    const counts: Record<number, number> = {};
    const monthStr = `${navYear}-${String(navMonthIndex + 1).padStart(2, '0')}`;
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      if (t.dueDate.startsWith(monthStr)) {
        const day = Number(t.dueDate.split('-')[2]);
        if (day) {
          counts[day] = (counts[day] || 0) + 1;
        }
      }
    });
    return counts;
  }, [tasks, navYear, navMonthIndex]);

  // Select month handler
  const handleSelectMonth = (monthIndex: number, year = navYear) => {
    const formatted = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  // Quick Preset Selection
  const applyPreset = (monthStr: string) => {
    onChange(monthStr);
    const [y, m] = monthStr.split('-').map(Number);
    setNavYear(y);
    setNavMonthIndex(m - 1);
    setIsOpen(false);
  };

  const formattedDisplayLabel = useMemo(() => {
    return `${MONTH_NAMES[selectedMonthIndex]} ${selectedYear}`;
  }, [selectedMonthIndex, selectedYear]);

  const isCurrentReviewCycle = value === currentCycleMonth;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* ========================================================= */}
      {/* TRIGGER BUTTON (High-end executive calendar button)      */}
      {/* ========================================================= */}
      <button
        id="btn-open-calendar-picker"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full sm:w-auto px-3.5 py-2 rounded-xl border transition-all duration-150 flex items-center justify-between sm:justify-start gap-2.5 text-xs font-bold shadow-2xs cursor-pointer ${
          isOpen
            ? 'bg-blue-50/80 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-extrabold tracking-tight text-slate-900 truncate">
            {formattedDisplayLabel}
          </span>
          {isCurrentReviewCycle && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200/60 leading-none shrink-0">
              Current Cycle
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* ========================================================= */}
      {/* CALENDAR POPOVER (Bottom Sheet on Mobile, Popover on Desktop) */}
      {/* ========================================================= */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />
          <div
            id="popover-calendar-dialog"
            role="dialog"
            aria-label="Select Review Month or Date"
            className="fixed inset-x-3 bottom-6 top-auto z-50 max-h-[88vh] overflow-y-auto sm:max-h-none sm:overflow-visible sm:absolute sm:top-full sm:bottom-auto sm:right-0 sm:left-auto sm:w-[380px] p-4 rounded-3xl bg-white border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-slate-900"
          >
          {/* Popover Header: View Tabs & Navigator */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
            {/* View Mode Switcher (Month Grid vs Day Calendar) */}
            <div className="flex p-0.5 rounded-xl bg-slate-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCalendarTab('MONTHS')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  calendarTab === 'MONTHS'
                    ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Month Cycle</span>
              </button>
              <button
                type="button"
                onClick={() => setCalendarTab('DAYS')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  calendarTab === 'DAYS'
                    ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Day View</span>
              </button>
            </div>

            {/* Quick Today / Current Jump */}
            <button
              type="button"
              onClick={() => {
                setNavYear(todayYear);
                setNavMonthIndex(todayMonth);
              }}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* ===================================================== */}
          {/* TAB 1: 12-MONTH GRID VIEW                             */}
          {/* ===================================================== */}
          {calendarTab === 'MONTHS' && (
            <div>
              {/* Year Navigation Bar */}
              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  type="button"
                  onClick={() => setNavYear(navYear - 1)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Previous Year"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-slate-900">{navYear}</span>
                  <span className="text-[11px] font-semibold text-slate-400">Review Calendar</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNavYear(navYear + 1)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Next Year"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 12-Month Interactive Grid */}
              <div className="grid grid-cols-3 gap-2">
                {MONTH_SHORT.map((shortName, index) => {
                  const isSelected = selectedYear === navYear && selectedMonthIndex === index;
                  const isTodayMonth = todayYear === navYear && todayMonth === index;
                  const isCurrentCycle =
                    currentCycleMonth === `${navYear}-${String(index + 1).padStart(2, '0')}`;
                  const taskCount = tasksCountByMonth[index] || 0;

                  return (
                    <button
                      key={shortName}
                      type="button"
                      onClick={() => handleSelectMonth(index, navYear)}
                      className={`relative p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-extrabold text-sm">{shortName}</span>
                        {isCurrentCycle && (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSelected ? 'bg-white' : 'bg-blue-600'
                            }`}
                            title="Current Organization Cycle"
                          />
                        )}
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span
                          className={`truncate ${
                            isSelected ? 'text-white/80' : 'text-slate-400 font-medium'
                          }`}
                        >
                          {MONTH_NAMES[index].slice(0, 4)}
                        </span>
                        {taskCount > 0 && (
                          <span
                            className={`px-1 rounded-sm font-bold text-[9px] ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {taskCount}t
                          </span>
                        )}
                      </div>

                      {isTodayMonth && !isSelected && (
                        <span className="absolute bottom-1 right-2 text-[8px] font-black text-blue-600 uppercase">
                          Now
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 2: INTERACTIVE DAY-BY-DAY CALENDAR VIEW           */}
          {/* ===================================================== */}
          {calendarTab === 'DAYS' && (
            <div>
              {/* Month & Year Stepper */}
              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  type="button"
                  onClick={() => {
                    if (navMonthIndex === 0) {
                      setNavMonthIndex(11);
                      setNavYear(navYear - 1);
                    } else {
                      setNavMonthIndex(navMonthIndex - 1);
                    }
                  }}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-center">
                  <span className="text-sm font-black text-slate-900">
                    {MONTH_NAMES[navMonthIndex]} {navYear}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (navMonthIndex === 11) {
                      setNavMonthIndex(0);
                      setNavYear(navYear + 1);
                    } else {
                      setNavMonthIndex(navMonthIndex + 1);
                    }
                  }}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty padding slots before 1st day */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-8" />
                ))}

                {/* Day Numbers */}
                {Array.from({ length: daysInNavMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isCurrentDay =
                    todayYear === navYear && todayMonth === navMonthIndex && todayDate === dayNum;
                  const hasTasks = Boolean(tasksCountByDay[dayNum]);

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => handleSelectMonth(navMonthIndex, navYear)}
                      className={`h-8 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                        isCurrentDay
                          ? 'bg-blue-600 text-white font-black shadow-xs'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{dayNum}</span>
                      {hasTasks && (
                        <span
                          className={`w-1 h-1 rounded-full absolute bottom-1 ${
                            isCurrentDay ? 'bg-white' : 'bg-blue-600'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Click to Select This Entire Month Button */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => handleSelectMonth(navMonthIndex, navYear)}
                  className="w-full py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Select {MONTH_NAMES[navMonthIndex]} {navYear} as Cycle</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* QUICK SHORTCUT PRESETS                                */}
          {/* ===================================================== */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Quick Shortcuts
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => applyPreset('2026-09')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  value === '2026-09'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Sep 2026 (Review Cycle)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('2026-10')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  value === '2026-10'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Oct 2026 (Current)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('2026-08')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  value === '2026-08'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Aug 2026
              </button>
              <button
                type="button"
                onClick={() => applyPreset('2026-11')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  value === '2026-11'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Nov 2026
              </button>
            </div>
          </div>

          {/* Footer Status */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              Active Scope: <strong className="text-slate-800">{formattedDisplayLabel}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

