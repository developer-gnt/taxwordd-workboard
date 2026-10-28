import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SUPABASE_URL, SUPABASE_SQL_SCHEMA } from '../../services/supabaseClient';
import { AlertTriangle, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';


export const DatabaseStatusBanner: React.FC = () => {
  const { dbStatus, refreshDbStatus } = useApp();
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  if (dbStatus !== 'SCHEMA_PENDING' && dbStatus !== 'DISCONNECTED') {
    return null;
  }

  const handleCopySchema = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleRecheck = async () => {
    setChecking(true);
    try {
      await refreshDbStatus();
    } finally {
      setTimeout(() => setChecking(false), 500);
    }
  };

  // Derive dashboard SQL Editor link from URL
  const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0] || 'judbulkapdiptuzkxhqx';
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  if (dbStatus === 'SCHEMA_PENDING') {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5 text-amber-900">
            <div className="p-1 rounded-md bg-amber-100 text-amber-700 shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-950">Database Connected — Tables Not Created Yet: </span>
              <span className="text-amber-800">
                Connected to Supabase (<code className="font-mono bg-amber-100/70 px-1 py-0.5 rounded text-[11px]">{SUPABASE_URL}</code>), but database tables (<code className="font-mono">projects</code>, <code className="font-mono">tasks</code>, etc.) do not exist in the database. The app is fetching from the database and showing 0 records until schema is executed.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={handleCopySchema}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied SQL!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-white" />
                  <span>Copy SQL Schema</span>
                </>
              )}
            </button>

            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span>Open Supabase SQL Editor</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
            </a>

            <button
              onClick={handleRecheck}
              disabled={checking}
              title="Re-check database tables"
              className="p-1.5 rounded-lg bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Disconnected state
  return (
    <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs text-rose-900">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong>Database Offline:</strong> Cannot reach Supabase database at <code className="font-mono">{SUPABASE_URL}</code>. Check your internet connection or verify credentials in <code className="font-mono">.env</code>.
          </span>
        </div>
        <button
          onClick={handleRecheck}
          disabled={checking}
          className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-1 shrink-0"
        >
          <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
          <span>Retry</span>
        </button>
      </div>
    </div>
  );
};

