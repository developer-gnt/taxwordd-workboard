import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { authService } from '../../services/authService';
import {
  Menu,
  Plus,
  Bell,
  Check,
  ChevronDown,
  UserCheck,
  Calendar,
  Cloud,
  CloudOff,
  AlertTriangle,
  RefreshCw,
  Volume2,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { notificationService } from '../../services/notificationService';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onOpenCreateTask: () => void;
  title: string;
  subtitle?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileMenu,
  onToggleSidebar,
  isSidebarCollapsed = false,
  onOpenCreateTask,
  title,
  subtitle,
}) => {
  const {
    currentUser,
    users,
    switchUser,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    navigateTo,
    openTaskDetail,
    dbStatus,
    refreshDbStatus,
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const canCreateTask = authService.canCreateTask(currentUser);

  // Relevant notifications for this user
  const userNotifs = currentUser
    ? notifications.filter((n) => n.userId === currentUser.id).slice(0, 6)
    : [];

  const handleNotifClick = (notifId: string, taskId?: string) => {
    markNotificationRead(notifId);
    setShowNotifMenu(false);
    if (taskId) {
      openTaskDetail(taskId);
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await storageService.syncWithSupabase();
      await refreshDbStatus();
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  const [browserPerm, setBrowserPerm] = useState<NotificationPermission | 'unsupported'>(() =>
    notificationService.getBrowserPermission()
  );

  useEffect(() => {
    setBrowserPerm(notificationService.getBrowserPermission());
  }, [showNotifMenu]);

  const handleEnableBrowserNotifications = async () => {
    const res = await notificationService.requestBrowserPermission();
    setBrowserPerm(res);
  };

  const handleTestBrowserNotification = async () => {
    await notificationService.sendTestNotification();
  };

  return (
    <header
      id="app-topbar"
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between no-print"
    >
      <div className="flex items-center gap-3">
        {/* Mobile-only toggle navigation drawer (desktop uses sidebar's YouTube-style toggle) */}
        <button
          id="btn-topbar-sidebar-toggle"
          onClick={onOpenMobileMenu}
          className="lg:hidden text-slate-500 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-xl border border-slate-200/80 cursor-pointer transition-colors shrink-0"
          title="Open navigation menu"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-lg md:text-xl font-bold text-slate-900 tracking-tight truncate max-w-[155px] xs:max-w-[210px] sm:max-w-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 hidden sm:block font-normal mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Cloud Sync Status Pill */}
        <button
          id="btn-topbar-cloud-sync"
          onClick={handleManualSync}
          disabled={isSyncing}
          title={
            dbStatus === 'SCHEMA_PENDING'
              ? 'Connected to Supabase, but database tables need to be created using supabase_schema.sql'
              : dbStatus === 'DISCONNECTED'
              ? 'Cannot connect to Supabase database. Click to retry.'
              : 'Synchronized with Supabase PostgreSQL cloud'
          }
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium shadow-2xs transition-colors cursor-pointer ${
            dbStatus === 'SCHEMA_PENDING'
              ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
              : dbStatus === 'DISCONNECTED'
              ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          ) : dbStatus === 'SCHEMA_PENDING' ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          ) : dbStatus === 'DISCONNECTED' ? (
            <CloudOff className="w-3.5 h-3.5 text-rose-600" />
          ) : (
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span className="hidden lg:inline">
            {isSyncing
              ? 'Syncing...'
              : dbStatus === 'SCHEMA_PENDING'
              ? 'DB: Tables Missing'
              : dbStatus === 'DISCONNECTED'
              ? 'DB: Offline'
              : 'Live Sync'}
          </span>
        </button>

        {/* Date context display */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
        </div>

        {/* Quick Account Switcher (Restricted: Not clickable / visible for regular employees) */}
        {currentUser?.role !== 'EMPLOYEE' ? (
          <div className="relative" ref={roleMenuRef}>
            <button
              id="btn-switch-account-menu"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">Active:</span>
              <span className="font-bold text-slate-900">{currentUser?.name?.split(' ')[0]}</span>
              <span className="text-[10px] px-1 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                {currentUser?.role}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">Switch Demo Account</p>
                  <p className="text-[11px] text-slate-500">Test different role workflows instantly</p>
                </div>
                <div className="max-h-72 overflow-y-auto p-1 space-y-0.5">
                  {users
                    .filter((u) => u.active)
                    .map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          currentUser?.id === u.id
                            ? 'bg-blue-50 text-blue-800 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {u.initials}
                          </span>
                          <div className="truncate">
                            <p className="truncate">{u.name}</p>
                            <p className="text-[10px] text-slate-400 font-normal truncate">{u.department}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                          {u.role}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            id="badge-employee-active-account"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs select-none pointer-events-none"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="hidden sm:inline">Active:</span>
            <span className="font-bold text-slate-900">{currentUser?.name?.split(' ')[0]}</span>
            <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold">
              EMPLOYEE
            </span>
          </div>
        )}

        {/* Notifications Popover */}
        <div className="relative" ref={notifMenuRef}>
          <button
            id="btn-notifications-toggle"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                  <p className="text-[11px] text-slate-400">
                    {unreadNotificationCount} unread update{unreadNotificationCount === 1 ? '' : 's'}
                  </p>
                </div>
                {unreadNotificationCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead()}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Desktop / Site Notification Permission Control Bar */}
              {browserPerm === 'granted' && (
                <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Site Alerts: Active
                  </span>
                  <button
                    type="button"
                    onClick={handleTestBrowserNotification}
                    className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Send Test Alert
                  </button>
                </div>
              )}
              {browserPerm === 'default' && (
                <div className="px-3 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-[11px]">
                  <span className="text-blue-900 font-medium flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                    Receive site desktop alerts
                  </span>
                  <button
                    type="button"
                    id="btn-popover-enable-notifs"
                    onClick={handleEnableBrowserNotifications}
                    className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-pointer"
                  >
                    Enable
                  </button>
                </div>
              )}
              {browserPerm === 'denied' && (
                <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-100 text-[10px] text-amber-800 flex items-center gap-1">
                  <span>⚠️ Site alerts blocked. Allow notifications in browser address bar settings.</span>
                </div>
              )}

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {userNotifs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No recent notifications</div>
                ) : (
                  userNotifs.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n.id, n.taskId)}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                        !n.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          !n.read ? 'bg-blue-600' : 'bg-transparent'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-900 truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setShowNotifMenu(false);
                    navigateTo('/notifications');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary "+ Create Task" Action (Admin/Manager Desktop) */}
        {canCreateTask && (
          <button
            id="btn-topbar-create-task"
            onClick={onOpenCreateTask}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Task</span>
          </button>
        )}
      </div>
    </header>
  );
};
