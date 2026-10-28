import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Project } from '../../types';
import { ChevronDown, Check, Folder, CheckSquare, Square } from 'lucide-react';

interface ProjectComboboxProps {
  id?: string;
  projects: Project[];
  value?: string;
  onChange?: (value: string) => void;
  multiple?: boolean;
  selectedValues?: string[];
  onSelectedValuesChange?: (values: string[]) => void;
  required?: boolean;
  placeholder?: string;
}

export const ProjectCombobox: React.FC<ProjectComboboxProps> = ({
  id = 'project-combobox-input',
  projects,
  value = '',
  onChange,
  multiple = false,
  selectedValues = [],
  onSelectedValuesChange,
  required = false,
  placeholder = 'Select party...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute distinct client groups (e.g. Group A, Group B, Group C, Group D)
  const distinctGroups = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.clientName).filter(Boolean))).sort();
  }, [projects]);

  // If in 'SELECTED' filter and everything was deselected, switch back to 'ALL'
  useEffect(() => {
    if (groupFilter === 'SELECTED' && selectedValues.length === 0) {
      setGroupFilter('ALL');
    }
  }, [groupFilter, selectedValues.length]);

  // Filter projects dynamically based on search & group
  const filteredProjects = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return projects.filter((p) => {
      if (groupFilter === 'SELECTED') {
        const optionString = `${p.projectName} (${p.clientName})`.toLowerCase();
        const isSel = selectedValues.some(
          (v) =>
            v.toLowerCase() === optionString ||
            v === p.id ||
            v.toLowerCase() === p.projectName.toLowerCase()
        );
        if (!isSel) return false;
      } else if (groupFilter !== 'ALL') {
        if (p.clientName !== groupFilter) return false;
      }

      if (!q) return true;
      const formatted = `${p.projectName} (${p.clientName})`.toLowerCase();
      return (
        p.projectName.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        formatted.includes(q)
      );
    });
  }, [projects, searchTerm, groupFilter, selectedValues]);

  // Check if all currently filtered projects are selected
  const allFilteredSelected = useMemo(() => {
    if (filteredProjects.length === 0) return false;
    return filteredProjects.every((p) => {
      const optionString = `${p.projectName} (${p.clientName})`.toLowerCase();
      return selectedValues.some(
        (v) =>
          v.toLowerCase() === optionString ||
          v === p.id ||
          v.toLowerCase() === p.projectName.toLowerCase()
      );
    });
  }, [filteredProjects, selectedValues]);

  const handleToggleOption = (proj: Project) => {
    const optionString = `${proj.projectName} (${proj.clientName})`;

    if (multiple) {
      if (!onSelectedValuesChange) return;
      const isAlreadySelected = selectedValues.some(
        (v) =>
          v.toLowerCase() === optionString.toLowerCase() ||
          v === proj.id ||
          v.toLowerCase() === proj.projectName.toLowerCase()
      );
      if (isAlreadySelected) {
        onSelectedValuesChange(
          selectedValues.filter(
            (v) =>
              v.toLowerCase() !== optionString.toLowerCase() &&
              v !== proj.id &&
              v.toLowerCase() !== proj.projectName.toLowerCase()
          )
        );
      } else {
        onSelectedValuesChange([...selectedValues, optionString]);
      }
    } else {
      if (onChange) onChange(optionString);
      setSearchTerm('');
      setIsOpen(false);
    }
  };

  const handleToggleAllFiltered = () => {
    if (!onSelectedValuesChange) return;
    if (allFilteredSelected) {
      // Deselect all matching the current filter
      const toRemove = new Set(
        filteredProjects.flatMap((p) => [
          p.id.toLowerCase(),
          p.projectName.toLowerCase(),
          `${p.projectName} (${p.clientName})`.toLowerCase(),
        ])
      );
      onSelectedValuesChange(selectedValues.filter((v) => !toRemove.has(v.toLowerCase())));
    } else {
      // Select all matching the current filter
      const toAdd = filteredProjects.map((p) => `${p.projectName} (${p.clientName})`);
      const merged = Array.from(new Set([...selectedValues, ...toAdd]));
      onSelectedValuesChange(merged);
    }
  };

  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onSelectedValuesChange) {
      onSelectedValuesChange([]);
    }
    if (groupFilter === 'SELECTED') {
      setGroupFilter('ALL');
    }
  };

  // Resolve single-select display label
  const singleDisplayLabel = useMemo(() => {
    if (multiple) return '';
    if (searchTerm) return searchTerm;
    if (!value) return '';
    const match = projects.find(
      (p) =>
        p.id === value ||
        p.projectName === value ||
        `${p.projectName} (${p.clientName})` === value
    );
    return match ? `${match.projectName} (${match.clientName})` : value;
  }, [multiple, searchTerm, value, projects]);

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      {/* Sleek Summary Badge (When multiple parties are selected) */}
      {multiple && selectedValues.length > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-blue-50/90 border border-blue-200/80 text-xs shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 animate-pulse" />
            <span className="font-bold text-blue-950 truncate">
              {selectedValues.length} {selectedValues.length === 1 ? 'Party' : 'Parties'} Selected
            </span>
            {groupFilter !== 'ALL' && groupFilter !== 'SELECTED' && (
              <span className="text-[10px] bg-blue-200/70 text-blue-900 font-semibold px-2 py-0.5 rounded-md">
                {groupFilter}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setGroupFilter('SELECTED');
                setIsOpen(true);
              }}
              className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
            >
              View list ({selectedValues.length})
            </button>
            <span className="text-blue-300">|</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Input Field with Dropdown Toggle */}
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          required={required && (!multiple || selectedValues.length === 0)}
          placeholder={
            multiple
              ? selectedValues.length > 0
                ? 'Search parties to add or remove...'
                : placeholder
              : placeholder
          }
          value={multiple ? searchTerm : singleDisplayLabel}
          onChange={(e) => {
            const nextVal = e.target.value;
            setSearchTerm(nextVal);
            if (!multiple && onChange) {
              onChange(nextVal);
            }
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs bg-white text-slate-900 transition-colors shadow-2xs"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-2.5 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded cursor-pointer"
          aria-label="Toggle parties dropdown"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
          />
        </button>
      </div>

      {/* Styled Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col max-h-64">
          {/* Quick Filter Bar for Groups */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-1 flex-wrap text-[10px] shrink-0">
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setGroupFilter('ALL')}
                className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-colors ${
                  groupFilter === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All ({projects.length})
              </button>
              {distinctGroups.map((g) => {
                const countInGroup = projects.filter((p) => p.clientName === g).length;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGroupFilter(g)}
                    className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-colors ${
                      groupFilter === g
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {g} ({countInGroup})
                  </button>
                );
              })}

              {multiple && selectedValues.length > 0 && (
                <button
                  type="button"
                  onClick={() => setGroupFilter('SELECTED')}
                  className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                    groupFilter === 'SELECTED'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  ✓ Selected ({selectedValues.length})
                </button>
              )}
            </div>

            {multiple && (
              <div>
                {groupFilter === 'SELECTED' ? (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="font-bold text-[10px] text-rose-600 hover:bg-rose-50 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                ) : filteredProjects.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleToggleAllFiltered}
                    className={`font-bold text-[10px] cursor-pointer px-1.5 py-0.5 rounded transition-colors ${
                      allFilteredSelected
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {allFilteredSelected
                      ? `– Deselect All (${filteredProjects.length})`
                      : `+ Select All (${filteredProjects.length})`}
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {/* List of Filtered Parties */}
          <div className="overflow-y-auto p-1.5 space-y-0.5 flex-1 max-h-44 min-h-0">
            {filteredProjects.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs font-medium">
                {groupFilter === 'SELECTED'
                  ? 'No parties currently selected.'
                  : 'No matching parties found.'}
              </div>
            ) : (
              filteredProjects.map((p) => {
                const optionString = `${p.projectName} (${p.clientName})`;
                const isSelected = multiple
                  ? selectedValues.some(
                      (v) =>
                        v.toLowerCase() === optionString.toLowerCase() ||
                        v === p.id ||
                        v.toLowerCase() === p.projectName.toLowerCase()
                    )
                  : value.trim().toLowerCase() === optionString.toLowerCase() ||
                    value.trim().toLowerCase() === p.id.toLowerCase() ||
                    value.trim().toLowerCase() === p.projectName.toLowerCase();

                return (
                  <div
                    key={p.id}
                    onClick={() => handleToggleOption(p)}
                    className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {multiple ? (
                        isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )
                      ) : (
                        <Folder
                          className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}
                        />
                      )}
                      <span className="font-bold text-slate-900 truncate">{p.projectName}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/50 shrink-0">
                        {p.clientName}
                      </span>
                    </div>

                    {!multiple && isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar with Done Button */}
          <div className="shrink-0 px-3 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {multiple
                ? `${selectedValues.length} selected of ${projects.length} parties`
                : `${filteredProjects.length} parties available`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs cursor-pointer transition-colors shadow-2xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
