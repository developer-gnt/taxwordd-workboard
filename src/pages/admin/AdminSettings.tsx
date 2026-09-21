import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storageService';
import { getLocalDateString } from '../../utils/dateUtils';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCode,
  RefreshCw,
  Bell,
  Volume2,
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';

export const AdminSettings: React.FC = () => {
  const { users, tasks, projects, activities, notifications, resetToDemoData, showToast } = useApp();
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission | 'unsupported'>(() =>
    notificationService.getBrowserPermission()
  );

  const handleEnableNotifications = async () => {
    const res = await notificationService.requestBrowserPermission();
    setBrowserPerm(res);
    if (res === 'granted') {
      showToast('Notifications Active', 'Site desktop notifications enabled!', 'success');
    } else if (res === 'denied') {
      showToast('Notifications Blocked', 'Allow notifications in your browser address bar site settings.', 'info');
    }
  };

  const handleSendTestNotification = async () => {
    const ok = await notificationService.sendTestNotification();
    if (ok) {
      showToast('Test Sent', 'Desktop test alert dispatched with audio chime.', 'success');
    }
  };

  const handleExportJson = () => {
    const backupStr = storageService.exportFullBackup();
    const blob = new Blob([backupStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GNT_Backup_${getLocalDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup Created', 'Full enterprise database JSON downloaded', 'success');
  };

  const handleImportJson = () => {
    setImportError('');
    if (!importJson.trim()) {
      setImportError('Please paste valid JSON backup data.');
      return;
    }

    const success = storageService.importFullBackup(importJson.trim());
    if (success) {
      setImportJson('');
      showToast('Database Restored', 'All records safely imported', 'success');
    } else {
      setImportError('Invalid backup structure. Verify JSON format.');
      showToast('Import Failed', 'JSON parsing failed or structure mismatch', 'error');
    }
  };

  return (
    <div id="admin-settings-view" className="space-y-6 max-w-4xl">
      {/* System Status Overview */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Enterprise Data Repository</h2>
            <p className="text-xs text-slate-500">
              Reactive storage engine with full migration abstraction
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[10px] uppercase font-bold text-slate-400">Team Accounts</span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{users.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Tasks</span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{tasks.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[10px] uppercase font-bold text-slate-400">Projects</span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{projects.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[10px] uppercase font-bold text-slate-400">Audit Events</span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{activities.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[10px] uppercase font-bold text-slate-400">Notifications</span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{notifications.length}</p>
          </div>
        </div>
      </div>

      {/* Browser & Site Notifications */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${browserPerm === 'granted' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Browser & Site Notifications</h3>
                {browserPerm === 'granted' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Granted & Active
                  </span>
                )}
                {browserPerm === 'default' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    Permission Needed
                  </span>
                )}
                {browserPerm === 'denied' && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                    Blocked by Browser
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Native OS notifications, tab badges, and Web Audio synthesizers for real-time task alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {browserPerm !== 'granted' ? (
              <button
                type="button"
                id="btn-admin-enable-notifs"
                onClick={handleEnableNotifications}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Notifications</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-admin-test-notifs"
                onClick={handleSendTestNotification}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Send Test Alert</span>
              </button>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
          <p className="font-semibold text-slate-800">Site Notification Features:</p>
          <ul className="list-disc list-inside text-slate-500 text-[11px] space-y-0.5">
            <li>Instant desktop banner when tasks are assigned to owners</li>
            <li>Critical escalation alerts when blockers are reported</li>
            <li>Automatic deadline and overdue deliverable warnings</li>
            <li>Notification clicking brings your browser window into focus directly at the relevant deliverable</li>
          </ul>
        </div>
      </div>

      {/* Backup and Restore */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Database Backup & Portability</h3>
            <p className="text-xs text-slate-500">Export or restore full JSON snapshot of all entities</p>
          </div>
          <button
            onClick={handleExportJson}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON Backup</span>
          </button>
        </div>

        {/* Restore Section */}
        <div className="space-y-2 pt-2">
          <label htmlFor="input-import-json" className="block text-xs font-bold text-slate-700">
            Restore from JSON String
          </label>
          {importError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}
          <textarea
            id="input-import-json"
            rows={3}
            placeholder="Paste raw backup JSON here..."
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <button
            onClick={handleImportJson}
            disabled={!importJson.trim()}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Apply Database Restore</span>
          </button>
        </div>
      </div>

      {/* Supabase Cloud Infrastructure */}
      <SupabaseSettingsCard />

      {/* Danger Zone: Factory Reset */}
      <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-xs space-y-3">
        <div>
          <h3 className="text-sm font-bold text-rose-700">Factory Demo Reset</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Restores all original seed users (David, Sarah, Alex, Elena, Marcus), demo projects, tasks, and historical activities.
          </p>
        </div>
        <button
          onClick={resetToDemoData}
          className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Workspace Data to Demo State</span>
        </button>
      </div>
    </div>
  );
};

const SupabaseSettingsCard: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    url: string;
    latencyMs?: number;
    error?: string;
  } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [showSchema, setShowSchema] = useState(false);

  const runSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const { storageService } = await import('../../services/storageService');
      await storageService.syncWithSupabase();
      setSyncResult('Synchronized all local and remote records with Supabase successfully.');
    } catch (e: any) {
      setSyncResult(`Sync warning: ${e.message || 'Error communicating with Supabase'}`);
    } finally {
      setSyncing(false);
    }
  };

  const runTest = async () => {
    setTesting(true);
    try {
      const { testSupabaseConnection } = await import('../../services/supabaseClient');
      const res = await testSupabaseConnection();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        connected: false,
        url: 'https://rshefuocexrhiklqqfkx.supabase.co',
        error: e.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const copySchema = async () => {
    const { SUPABASE_SQL_SCHEMA } = await import('../../services/supabaseClient');
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-emerald-200/80 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">Supabase Cloud Database</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                Active & Configured
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono break-all">https://rshefuocexrhiklqqfkx.supabase.co</p>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={runSync}
            disabled={syncing}
            className="flex-1 sm:flex-none justify-center px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {syncing ? (
              <span>Syncing Cloud...</span>
            ) : (
              <>
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </>
            )}
          </button>

          <button
            onClick={runTest}
            disabled={testing}
            className="flex-1 sm:flex-none justify-center px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {testing ? (
              <span>Testing Connection...</span>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Test Connection</span>
              </>
            )}
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="p-3 rounded-xl text-xs flex items-start gap-2 bg-blue-50 text-blue-900 border border-blue-200">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{syncResult}</p>
          </div>
        </div>
      )}

      {testResult && (
        <div
          className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
            testResult.connected
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          {testResult.connected ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-bold">
              {testResult.connected ? 'Successfully connected to Supabase Cloud' : 'Connection Check Failed'}
              {testResult.latencyMs !== undefined && (
                <span className="ml-2 font-normal text-[11px] opacity-80">({testResult.latencyMs}ms latency)</span>
              )}
            </p>
            {testResult.error && <p className="mt-0.5 text-[11px] opacity-90">{testResult.error}</p>}
          </div>
        </div>
      )}

      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-800">PostgreSQL Schema Migrations</p>
          <p className="text-[11px] text-slate-500">
            Includes SQL DDL for <code>users</code>, <code>projects</code>, <code>tasks</code>, <code>activities</code>, and <code>notifications</code>.
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setShowSchema(!showSchema)}
            className="flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors flex items-center"
          >
            {showSchema ? 'Hide SQL' : 'View SQL'}
          </button>
          <button
            onClick={copySchema}
            className="flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{copiedSchema ? 'Copied!' : 'Copy SQL Schema'}</span>
          </button>
        </div>
      </div>

      {showSchema && (
        <div className="p-3 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-60">
          <pre>{`-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'EMPLOYEE')),
  pin TEXT NOT NULL DEFAULT '123456',
  active BOOLEAN NOT NULL DEFAULT true,
  initials TEXT NOT NULL,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project_id TEXT REFERENCES public.projects(id),
  assigned_employee_id TEXT REFERENCES public.users(id),
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  next_action TEXT NOT NULL
);`}</pre>
        </div>
      )}
    </div>
  );
};

