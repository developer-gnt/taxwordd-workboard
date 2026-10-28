import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Team } from '../../types';
import { ChevronDown, Check, Users } from 'lucide-react';

interface UserComboboxProps {
  id?: string;
  users: User[];
  teams?: Team[];
  value: string; // userId or 'group:GroupName'
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  dropdownPosition?: 'auto' | 'top' | 'bottom';
  suggestedGroup?: string;
  allowGroupSelection?: boolean;
}

export const UserCombobox: React.FC<UserComboboxProps> = ({
  id = 'user-combobox-input',
  users,
  teams = [],
  value,
  onChange,
  required = false,
  placeholder = 'Select Owner...',
  dropdownPosition = 'bottom',
  suggestedGroup,
  allowGroupSelection = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedUser = users.find((u) => u.id === value);

  // Compute distinct groups (from teams or user departments)
  const distinctGroups = useMemo(() => {
    const fromUsers = users.map((u) => u.department).filter(Boolean) as string[];
    const fromTeams = (teams || []).map((t) => t.name);
    return Array.from(new Set([...fromTeams, ...fromUsers])).sort();
  }, [users, teams]);

  // Sync display text with selected value (user or group)
  useEffect(() => {
    if (value && value.startsWith('group:')) {
      const gName = value.replace('group:', '');
      const count = users.filter((u) => u.department?.toLowerCase() === gName.toLowerCase()).length;
      setQuery(`👥 Entire ${gName} (All ${count} Members)`);
    } else if (selectedUser) {
      setQuery(
        `${selectedUser.name} (${selectedUser.role}${selectedUser.department ? ` • ${selectedUser.department}` : ''})`
      );
    } else if (!value) {
      setQuery('');
    }
  }, [value, selectedUser, users]);

  // If suggestedGroup is passed, switch default group filter when opening
  useEffect(() => {
    if (suggestedGroup && distinctGroups.some((g) => g.toLowerCase() === suggestedGroup.toLowerCase())) {
      const match = distinctGroups.find((g) => g.toLowerCase() === suggestedGroup.toLowerCase());
      if (match) setGroupFilter(match);
    }
  }, [suggestedGroup, distinctGroups]);

  // Determine dropdown placement (upward vs downward)
  useEffect(() => {
    if (!isOpen) return;
    if (dropdownPosition === 'top') {
      setOpenUpward(true);
      return;
    }
    if (dropdownPosition === 'bottom') {
      setOpenUpward(false);
      return;
    }
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 180 && rect.top > 320) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen, dropdownPosition]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Reset query text to selected value's label if valid
        if (value && value.startsWith('group:')) {
          const gName = value.replace('group:', '');
          const count = users.filter((u) => u.department?.toLowerCase() === gName.toLowerCase()).length;
          setQuery(`👥 Entire ${gName} (All ${count} Members)`);
        } else if (selectedUser) {
          setQuery(
            `${selectedUser.name} (${selectedUser.role}${selectedUser.department ? ` • ${selectedUser.department}` : ''})`
          );
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
              setQuery(
                `${matched.name} (${matched.role}${matched.department ? ` • ${matched.department}` : ''})`
              );
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

  // Check if a user is a team lead
  const isTeamLead = (user: User) => {
    if (teams && teams.length > 0) {
      return teams.some(
        (t) => t.leadId === user.id || t.leadName?.toLowerCase() === user.name.toLowerCase()
      );
    }
    const knownLeads = ['user-anas', 'user-ameera', 'user-asif', 'user-saqib'];
    const knownLeadNames = ['anas', 'ameera', 'asif', 'saqib'];
    return knownLeads.includes(user.id) || knownLeadNames.includes(user.name.toLowerCase());
  };

  // Filter users based on group tab & search text
  const filteredUsers = useMemo(() => {
    const q = query.toLowerCase().trim();
    const isGroupLabel = value && value.startsWith('group:') && query.startsWith('👥');
    const isFullSelectedLabel =
      selectedUser &&
      query ===
        `${selectedUser.name} (${selectedUser.role}${selectedUser.department ? ` • ${selectedUser.department}` : ''})`;
    const effectiveQuery = isFullSelectedLabel || isGroupLabel ? '' : q;

    return users.filter((u) => {
      // Group filter
      if (groupFilter !== 'ALL') {
        const userDept = (u.department || '').toLowerCase();
        const targetGroup = groupFilter.toLowerCase();
        const inTeam = teams?.some(
          (t) => t.name.toLowerCase() === targetGroup && t.memberIds.includes(u.id)
        );
        if (userDept !== targetGroup && !inTeam) return false;
      }

      if (!effectiveQuery) return true;

      return (
        u.name.toLowerCase().includes(effectiveQuery) ||
        (u.department && u.department.toLowerCase().includes(effectiveQuery)) ||
        u.role.toLowerCase().includes(effectiveQuery) ||
        u.email.toLowerCase().includes(effectiveQuery)
      );
    });
  }, [users, teams, groupFilter, query, selectedUser, value]);

  const handleSelectUser = (user: User) => {
    onChange(user.id);
    setQuery(`${user.name} (${user.role}${user.department ? ` • ${user.department}` : ''})`);
    setIsOpen(false);
  };

  const handleSelectGroup = (gName: string) => {
    onChange(`group:${gName}`);
    const count = users.filter((u) => u.department?.toLowerCase() === gName.toLowerCase()).length;
    setQuery(`👥 Entire ${gName} (All ${count} Members)`);
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange('');
    setQuery('');
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
            if (value) {
              onChange('');
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
          aria-label="Toggle user dropdown"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
          />
        </button>
      </div>

      {/* Popover Options List (Upward or Downward) */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-150 flex flex-col max-h-68 ${
            openUpward
              ? 'bottom-full mb-1.5 slide-in-from-bottom-1'
              : 'top-full mt-1.5 slide-in-from-top-1'
          }`}
        >
          {/* Quick Group Tabs Bar */}
          {distinctGroups.length > 1 && (
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
                  All ({users.length})
                </button>
                {distinctGroups.map((g) => {
                  const countInGroup = users.filter((u) => {
                    const inDept = u.department?.toLowerCase() === g.toLowerCase();
                    const inTeam = teams?.some(
                      (t) => t.name.toLowerCase() === g.toLowerCase() && t.memberIds.includes(u.id)
                    );
                    return inDept || inTeam;
                  }).length;

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
              </div>

              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="font-bold text-[10px] text-rose-600 hover:bg-rose-50 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>
          )}

          {/* List of Options (Whole Group Option + Individual Staff Members) */}
          <div className="overflow-y-auto p-1.5 space-y-1 flex-1 max-h-52 min-h-0">
            {/* Whole Group Allocation Option (When allowGroupSelection is true and a group is active) */}
            {allowGroupSelection && groupFilter !== 'ALL' && (
              <div
                onClick={() => handleSelectGroup(groupFilter)}
                className={`p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition-all border ${
                  value === `group:${groupFilter}`
                    ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs'
                    : 'bg-blue-50/80 hover:bg-blue-100/90 text-blue-900 border-blue-200/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      value === `group:${groupFilter}`
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-600 text-white shadow-2xs'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-xs truncate">
                      Entire {groupFilter}
                    </div>
                    <div
                      className={`text-[10px] ${
                        value === `group:${groupFilter}` ? 'text-blue-100' : 'text-blue-700'
                      }`}
                    >
                      Assign to all {filteredUsers.length} members in this pod
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 shadow-2xs ${
                    value === `group:${groupFilter}`
                      ? 'bg-white text-blue-700'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  Select Whole Group
                </span>
              </div>
            )}

            {/* Section Heading */}
            {allowGroupSelection && groupFilter !== 'ALL' && filteredUsers.length > 0 && (
              <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Or Pick Specific Person
              </div>
            )}

            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs font-medium">
                No matching team members in this group.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = u.id === value;
                const lead = isTeamLead(u);

                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
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

                      {lead && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0">
                          Team Lead
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${getRoleBadgeStyle(u.role)}`}
                      >
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
              })
            )}
          </div>

          {/* Footer Bar with Done Button */}
          <div className="shrink-0 px-3 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
            <span className="truncate max-w-[240px]">
              {value?.startsWith('group:')
                ? `Group: ${value.replace('group:', '')}`
                : selectedUser
                ? `Owner: ${selectedUser.name}`
                : `${filteredUsers.length} staff available`}
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
