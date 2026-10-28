import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { getLocalDateString } from '../../utils/dateUtils';

interface DatePickerCalendarProps {
  id?: string;
  value: string; // Format: "YYYY-MM-DD"
  onChange: (dateStr: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  className?: string;
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

export const DatePickerCalendar: React.FC<DatePickerCalendarProps> = ({
  id,
  value,
  onChange,
  placeholder = 'Select deadline date...',
  allowClear = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Today reference
  const today = new Date();
  const todayStr = getLocalDateString(today);
  const [todayYear, todayMonth, todayDate] = todayStr.split('-').map(Number);

  // Parse current value
  const parsedValue = useMemo(() => {
    if (!value || !value.includes('-')) return null;
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return null;
    return { year: y, monthIndex: m - 1, day: d };
  }, [value]);

  // Calendar navigator view state
  const [navYear, setNavYear] = useState<number>(
    parsedValue ? parsedValue.year : todayYear
  );
  const [navMonthIndex, setNavMonthIndex] = useState<number>(
    parsedValue ? parsedValue.monthIndex : todayMonth - 1
  );

  // Sync nav state when opened
  useEffect(() => {
    if (isOpen) {
      if (parsedValue) {
        setNavYear(parsedValue.year);
        setNavMonthIndex(parsedValue.monthIndex);
      } else {
        setNavYear(todayYear);
        setNavMonthIndex(todayMonth - 1);
      }
    }
  }, [isOpen, parsedValue, todayYear, todayMonth]);

  // Close on click outside or Escape
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

  // Days in month calculation
  const daysInMonth = useMemo(() => {
    return new Date(navYear, navMonthIndex + 1, 0).getDate();
  }, [navYear, navMonthIndex]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(navYear, navMonthIndex, 1).getDay();
  }, [navYear, navMonthIndex]);

  // Month navigation
  const prevMonth = () => {
    if (navMonthIndex === 0) {
      setNavMonthIndex(11);
      setNavYear(navYear - 1);
    } else {
      setNavMonthIndex(navMonthIndex - 1);
    }
  };

  const nextMonth = () => {
    if (navMonthIndex === 11) {
      setNavMonthIndex(0);
      setNavYear(navYear + 1);
    } else {
      setNavMonthIndex(navMonthIndex + 1);
    }
  };

  // Day click handler
  const handleSelectDay = (day: number) => {
    const formatted = `${navYear}-${String(navMonthIndex + 1).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  // Quick preset buttons
  const setPresetDate = (daysFromToday: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const dateStr = getLocalDateString(d);
    onChange(dateStr);
    setIsOpen(false);
  };

  // Formatted display
  const displayLabel = useMemo(() => {
    if (!parsedValue) return '';
    const date = new Date(parsedValue.year, parsedValue.monthIndex, parsedValue.day);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [parsedValue]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Field */}
      <div
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl border transition-all duration-150 flex items-center justify-between text-xs cursor-pointer shadow-2xs ${
          isOpen
            ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20 text-slate-900'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
          {value ? (
            <span className="font-bold text-slate-900 truncate">{displayLabel}</span>
          ) : (
            <span className="text-slate-400 font-normal truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && allowClear && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Popover Calendar Grid */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Date Picker Calendar"
          className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 z-50 w-[310px] sm:w-[330px] p-4 rounded-3xl bg-white border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-slate-900"
        >
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <span className="text-xs font-black text-slate-900">
                {MONTH_NAMES[navMonthIndex]} {navYear}
              </span>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {/* Day Numbers */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${navYear}-${String(navMonthIndex + 1).padStart(2, '0')}-${String(
                day
              ).padStart(2, '0')}`;
              const isSelected = value === dateStr;
              const isToday = todayStr === dateStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center relative ${
                    isSelected
                      ? 'bg-blue-600 text-white font-black shadow-xs ring-2 ring-blue-500/20'
                      : isToday
                      ? 'border border-blue-500 text-blue-700 bg-blue-50/50 hover:bg-blue-100/50'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-blue-600 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Shortcuts */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setPresetDate(0)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPresetDate(1)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setPresetDate(7)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              +1 Week
            </button>
            {value && allowClear && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer ml-auto"
              >
                No Date
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

