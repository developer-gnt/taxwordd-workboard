import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ⚠️ SECURITY: Never hardcode credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_ANON_KEY.includes('your-anon-key')
);

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Health check test for Supabase connection
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  url: string;
  latencyMs?: number;
  error?: string;
}> {
  const start = performance.now();
  try {
    // Attempt a lightweight ping query
    const { error } = await supabase.from('projects').select('id').limit(1);
    const latencyMs = Math.round(performance.now() - start);

    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, connection is still valid but schema is pending
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return {
          connected: true,
          url: SUPABASE_URL,
          latencyMs,
          error: 'Connected, but database tables need to be created using the SQL schema below.',
        };
      }
      return {
        connected: false,
        url: SUPABASE_URL,
        latencyMs,
        error: error.message,
      };
    }

    return {
      connected: true,
      url: SUPABASE_URL,
      latencyMs,
    };
  } catch (err: any) {
    return {
      connected: false,
      url: SUPABASE_URL,
      error: err.message || 'Network request failed',
    };
  }
}

/**
 * Full PostgreSQL schema script for GNT Workboard
 * Copy-pasteable into Supabase SQL Editor
 */
export const SUPABASE_SQL_SCHEMA = `-- GNT Workboard Database Schema for Supabase
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'EMPLOYEE')),
  pin TEXT NOT NULL DEFAULT '123456',
  active BOOLEAN NOT NULL DEFAULT true,
  avatar TEXT,
  initials TEXT NOT NULL,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ON_HOLD', 'ARCHIVED')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  assigned_employee_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_employee_name TEXT NOT NULL,
  created_by_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_by_name TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'DONE')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  blocker TEXT,
  next_action TEXT NOT NULL,
  notes TEXT,
  reference_link TEXT,
  estimated_effort TEXT,
  expected_completion_date DATE,
  attachments JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  was_overdue BOOLEAN DEFAULT false,
  carried_forward BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Task Activity Audit Log Table
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  task_title TEXT,
  user_id TEXT,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  task_id TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Support both PIN and Supabase Auth logins across devices
DROP POLICY IF EXISTS "Allow authenticated access users" ON public.users;
DROP POLICY IF EXISTS "Allow all access users" ON public.users;
CREATE POLICY "Allow all access users" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access projects" ON public.projects;
DROP POLICY IF EXISTS "Allow all access projects" ON public.projects;
CREATE POLICY "Allow all access projects" ON public.projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow all access tasks" ON public.tasks;
CREATE POLICY "Allow all access tasks" ON public.tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access activities" ON public.activities;
DROP POLICY IF EXISTS "Allow all access activities" ON public.activities;
CREATE POLICY "Allow all access activities" ON public.activities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow all access notifications" ON public.notifications;
CREATE POLICY "Allow all access notifications" ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Migration: Ensure optional due_date and was_overdue column exist
ALTER TABLE public.tasks ALTER COLUMN due_date DROP NOT NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS was_overdue BOOLEAN DEFAULT false;

-- Enable Realtime for all tables (Idempotent)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users, public.projects, public.tasks, public.activities, public.notifications;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;
`;
