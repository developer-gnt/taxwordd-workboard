import React from 'react';
import { useApp } from '../../context/AppContext';
import { GntLogo } from '../common/GntLogo';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  FolderKanban,
  FileBarChart2,
  Bell,
  Settings,
  UserCheck,
  LogOut,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  Users2,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  setMobileOpen,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { currentUser, activeRoute, navigateTo, logout, unreadNotificationCount } = useApp();

  if (!currentUser) return null;

  const role = currentUser.role;

  // Build navigation links according to role
  const navItems = [
    ...(role === 'ADMIN'
      ? [
          { label: 'Dashboard', route: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Tasks', route: '/admin/tasks', icon: CheckSquare },
          { label: 'Parties', route: '/admin/projects', icon: FolderKanban },
          { label: 'Employees', route: '/admin/team', icon: Users },
          { label: 'Teams', route: '/admin/teams', icon: Users2 },
          { label: 'Reports', fullLabel: 'Monthly Reports', route: '/admin/reports', icon: FileBarChart2 },
          { label: 'Notifications', route: '/notifications', icon: Bell, badge: unreadNotificationCount },
          { label: 'Settings', route: '/admin/settings', icon: Settings },
        ]
      : []),
    ...(role === 'MANAGER'
      ? [
          { label: 'Dashboard', route: '/manager/dashboard', icon: LayoutDashboard },
          { label: 'Tasks', route: '/manager/tasks', icon: CheckSquare },
          { label: 'Parties', route: '/manager/projects', icon: FolderKanban },
          { label: 'Employees', route: '/manager/team', icon: Users },
          { label: 'Teams', route: '/manager/teams', icon: Users2 },
          { label: 'Reports', fullLabel: 'Monthly Reports', route: '/manager/reports', icon: FileBarChart2 },
          { label: 'Notifications', route: '/notifications', icon: Bell, badge: unreadNotificationCount },
          { label: 'Profile', route: '/employee/profile', icon: UserCheck },
        ]
      : []),
    ...(role === 'EMPLOYEE'
      ? [
          { label: 'My Tasks', route: '/employee/tasks', icon: CheckSquare },
          { label: 'Summary', fullLabel: 'Monthly Summary', route: '/employee/monthly-summary', icon: FileBarChart2 },
          { label: 'Notifications', route: '/notifications', icon: Bell, badge: unreadNotificationCount },
          { label: 'Profile', route: '/employee/profile', icon: UserCheck },
        ]
      : []),
  ];

  const handleNavClick = (route: string) => {
    navigateTo(route);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200/80 transition-[width,transform] duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-64 lg:w-[72px]' : 'w-64'}`}
      >
        {/* Top Branding & Toggle Bar */}
        <div
          className={`border-b border-slate-100 flex items-center transition-all ${
            isCollapsed
              ? 'px-2.5 py-3.5 justify-between lg:justify-center'
              : 'px-4 py-3.5 justify-between'
          }`}
        >
          {/* Desktop Collapsed view */}
          {isCollapsed ? (
            <div className="hidden lg:flex flex-col items-center gap-2 w-full">
              {onToggleCollapse && (
                <button
                  id="btn-sidebar-expand-top"
                  onClick={onToggleCollapse}
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div title="TAX WORLDD">
                <GntLogo variant="icon" size="sm" className="w-8 h-8" />
              </div>
            </div>
          ) : null}

          {/* Desktop Expanded & Mobile View */}
          <div className={`flex items-center gap-2 min-w-0 ${isCollapsed ? 'lg:hidden' : 'flex'}`}>
            {onToggleCollapse && (
              <button
                id="btn-sidebar-collapse-top"
                onClick={onToggleCollapse}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="hidden lg:flex items-center justify-center w-9 h-9 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 overflow-hidden">
              <GntLogo variant="full" size="md" className="h-8" />
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Accountability Banner Pill (Hidden in mini mode) */}
        {!isCollapsed && (
          <div className="px-4 pt-3 pb-1 transition-all">
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                Core Principle
              </p>
              <p className="text-xs font-medium text-slate-700 mt-0.5">
                One owner • One deadline • Next action
              </p>
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <nav
          className={`flex-1 py-3 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
            isCollapsed ? 'px-1.5 space-y-0.5' : 'px-3 space-y-1'
          }`}
        >
          {/* Section Header (Expanded only) */}
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {role} WORKSPACE
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.route;
            const displayLabel = isCollapsed ? item.label : (item.fullLabel || item.label);

            if (isCollapsed) {
              // YouTube-style Mini Sidebar Item (Desktop)
              return (
                <button
                  key={item.route}
                  id={`nav-link-mini-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => handleNavClick(item.route)}
                  title={`${item.fullLabel || item.label}${item.badge ? ` (${item.badge} unread)` : ''}`}
                  className={`relative w-full flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-blue-50/90 text-blue-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-150 group-hover:scale-110 ${
                        isActive
                          ? 'text-blue-600 stroke-[2.25]'
                          : 'text-slate-500 group-hover:text-slate-800 stroke-[1.75]'
                      }`}
                    />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-blue-600 text-white leading-none shadow-2xs border border-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] tracking-tight mt-1 text-center truncate max-w-[62px] leading-tight select-none">
                    {item.label}
                  </span>
                </button>
              );
            }

            // Expanded Full Sidebar Item
            return (
              <button
                key={item.route}
                id={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleNavClick(item.route)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-50/90 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-blue-600 stroke-[2.25]' : 'text-slate-400 stroke-[1.75]'
                    }`}
                  />
                  <span className="truncate">{displayLabel}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-600 text-white leading-none shrink-0 ml-2">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Expand/Collapse Quick Toggle Bar (Desktop only) */}
        {onToggleCollapse && (
          <div className="hidden lg:block border-t border-slate-100 p-1.5 bg-slate-50/40">
            <button
              id="btn-sidebar-quick-toggle"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`w-full py-1.5 rounded-lg flex items-center justify-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer ${
                isCollapsed ? 'px-1' : 'px-3'
              }`}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-[11px] text-slate-500 font-medium">Collapse</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Current User Footprint */}
        <div className="border-t border-slate-100 bg-slate-50/50">
          {isCollapsed ? (
            // Collapsed Mini User Footprint
            <div className="p-2 flex flex-col items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs cursor-pointer"
                title={`${currentUser.name} (${currentUser.role} • ${currentUser.department || 'Ops'})`}
              >
                {currentUser.initials}
              </div>
              <button
                id="btn-sidebar-logout-mini"
                onClick={logout}
                title="Sign Out"
                className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            // Expanded Full User Footprint
            <div className="p-3">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200/60">
                    {currentUser.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          currentUser.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : currentUser.role === 'MANAGER'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {currentUser.role}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  id="btn-sidebar-logout"
                  onClick={logout}
                  title="Sign Out"
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  aria-label="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
