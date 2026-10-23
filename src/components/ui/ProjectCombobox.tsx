import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../../types';
import { ChevronDown, Check, Folder } from 'lucide-react';

interface ProjectComboboxProps {
  id?: string;
  projects: Project[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

export const ProjectCombobox: React.FC<ProjectComboboxProps> = ({
  id = 'project-combobox-input',
  projects,
  value,
  onChange,
  required = false,
  placeholder = 'e.g. Reliance Industries / Sharma & Co',
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

  // Filter projects dynamically based on input value
  const filteredProjects = projects.filter((p) => {
    if (!value.trim()) return true;
    const query = value.toLowerCase().trim();
    const formatted = `${p.projectName} (${p.clientName})`.toLowerCase();
    return (
      p.projectName.toLowerCase().includes(query) ||
      p.clientName.toLowerCase().includes(query) ||
      formatted.includes(query)
    );
  });

  const handleSelectOption = (proj: Project) => {
    const selectedVal = `${proj.projectName} (${proj.clientName})`;
    onChange(selectedVal);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Field with Chevron Toggle */}
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs bg-white transition-colors"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-2.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded cursor-pointer"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Styled Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 max-h-56 overflow-y-auto pr-1">
          {filteredProjects.length === 0 ? (
            <div className="p-3 text-center text-slate-400 text-xs font-medium">
              No matching parties found. You can type to enter a custom party name.
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {filteredProjects.map((p) => {
                const optionString = `${p.projectName} (${p.clientName})`;
                const isSelected = value.trim().toLowerCase() === optionString.toLowerCase() || value.trim().toLowerCase() === p.id.toLowerCase();

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectOption(p)}
                    className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="font-bold text-slate-900 truncate">{p.projectName}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/50 shrink-0">
                        {p.clientName}
                      </span>
                    </div>

                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
