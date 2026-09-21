import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { ChevronDown, Check, User as UserIcon } from 'lucide-react';

interface UserComboboxProps {
  id?: string;
  users: User[];
  value: string; // userId
  onChange: (userId: string) => void;
  required?: boolean;
  placeholder?: string;
}

export const UserCombobox: React.FC<UserComboboxProps> = ({
  id = 'user-combobox-input',
  users,
  value,
  onChange,
  required = false,
  placeholder = 'Select Owner...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedUser = users.find((u) => u.id === value);

  // Sync display text with selected user or search query
  useEffect(() => {
    if (selectedUser) {
      setQuery(`${selectedUser.name} (${selectedUser.role}${selectedUser.department ? ` • ${selectedUser.department}` : ''})`);
    } else if (!value) {
      setQuery('');
    }
  }, [value, selectedUser]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Reset query text to selected user's label if valid
        if (selectedUser) {
          setQuery(`${selectedUser.name} (${selectedUser.role}${selectedUser.department ? ` • ${selectedUser.department}` : ''})`);
        } else if (!value) {
          if (query.trim()) {
            const q = query.trim().toLowerCase();
            const matched = users.find(
              (u) =>
                u.name.toLowerCase() === q ||
                u.email.toLowerCase() === q ||
                u.name.toLowerCase().startsWith(q) ||
                q.startsWith(u.name.toLowerCase())
            );
            if (matched) {
              onChange(matched.id);
              setQuery(`${matched.name} (${matched.role}${matched.department ? ` • ${matched.department}` : ''})`);
              return;
            }
          }
          setQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedUser, value, query, users, onChange]);

  // Filter active users based on query
  const filteredUsers = users.filter((u) => {
    if (!query.trim() || (selectedUser && query === `${selectedUser.name} (${selectedUser.role}${selectedUser.department ? ` • ${selectedUser.department}` : ''})`)) {
      return true;
    }
    const q = query.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const handleSelect = (user: User) => {
    onChange(user.id);
    setQuery(`${user.name} (${user.role}${user.department ? ` • ${user.department}` : ''})`);
    setIsOpen(false);
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MANAGER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
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
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value && e.target.value !== `${selectedUser?.name} (${selectedUser?.role}${selectedUser?.department ? ` • ${selectedUser?.department}` : ''})`) {
              onChange(''); // clear selection if user edits text
            }
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

      {/* Popover Options List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 max-h-56 overflow-y-auto pr-1">
          {filteredUsers.length === 0 ? (
            <div className="p-3 text-center text-slate-400 text-xs font-medium">
              No matching team members found.
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {filteredUsers.map((u) => {
                const isSelected = u.id === value;
                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelect(u)}
                    className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-200/60">
                        {u.initials}
                      </span>
                      <span className="font-bold text-slate-900 truncate">{u.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${getRoleBadgeStyle(u.role)}`}>
                        {u.role}
                      </span>
                      {u.department && (
                        <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                          • {u.department}
                        </span>
                      )}
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
