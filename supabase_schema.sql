-- ====================================================================
-- TAX WORLDD - Complete Supabase PostgreSQL Database Schema
-- Run this in your Supabase Dashboard: SQL Editor > New Query > Run
-- ====================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'EMPLOYEE')),
  pin TEXT NOT NULL DEFAULT '1234',
  active BOOLEAN NOT NULL DEFAULT true,
  avatar TEXT,
  initials TEXT NOT NULL,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Projects (Parties) Table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ON_HOLD', 'ARCHIVED')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  department TEXT,
  description TEXT,
  lead_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  lead_name TEXT,
  member_ids JSONB DEFAULT '[]'::jsonb,
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tasks Table
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

-- 5. Task Activity Audit Log Table
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

-- 6. Notifications Table
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

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Clean & Grant Permissive RLS Policies
DROP POLICY IF EXISTS "Allow all access users" ON public.users;
CREATE POLICY "Allow all access users" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access projects" ON public.projects;
CREATE POLICY "Allow all access projects" ON public.projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access teams" ON public.teams;
CREATE POLICY "Allow all access teams" ON public.teams FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access tasks" ON public.tasks;
CREATE POLICY "Allow all access tasks" ON public.tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access activities" ON public.activities;
CREATE POLICY "Allow all access activities" ON public.activities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access notifications" ON public.notifications;
CREATE POLICY "Allow all access notifications" ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Enable Realtime for all tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users, public.projects, public.teams, public.tasks, public.activities, public.notifications;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;

-- Insert Staff and Teams
INSERT INTO public.users (id, name, email, role, pin, active, initials, department)
VALUES 
  ('user-admin-taxworldd', 'Admin Taxworldd', 'admin@taxworldd.in', 'ADMIN', '1234', true, 'AT', 'Administration'),
  -- Group A
  ('user-anas', 'Anas', 'anas@taxworldd.in', 'EMPLOYEE', '1234', true, 'AN', 'Group A'),
  ('user-hasnian', 'Hasnian', 'hasnian@taxworldd.in', 'EMPLOYEE', '1234', true, 'HN', 'Group A'),
  ('user-huzaif', 'Huzaif', 'huzaif@taxworldd.in', 'EMPLOYEE', '1234', true, 'HZ', 'Group A'),
  -- Group B
  ('user-ameera', 'Ameera', 'ameera@taxworldd.in', 'EMPLOYEE', '1234', true, 'AM', 'Group B'),
  ('user-adnan', 'Adnan', 'adnan@taxworldd.in', 'EMPLOYEE', '1234', true, 'AD', 'Group B'),
  ('user-kaif', 'Kaif', 'kaif@taxworldd.in', 'EMPLOYEE', '1234', true, 'KF', 'Group B'),
  -- Group C
  ('user-asif', 'Asif', 'asif@taxworldd.in', 'EMPLOYEE', '1234', true, 'AS', 'Group C'),
  ('user-saud', 'Saud', 'saud@taxworldd.in', 'EMPLOYEE', '1234', true, 'SD', 'Group C'),
  ('user-ishaque', 'Ishaque', 'ishaque@taxworldd.in', 'EMPLOYEE', '1234', true, 'IQ', 'Group C'),
  -- Group D
  ('user-saqib', 'Saqib', 'saqib@taxworldd.in', 'EMPLOYEE', '1234', true, 'SQ', 'Group D'),
  ('user-kashana', 'Kashana', 'kashana@taxworldd.in', 'EMPLOYEE', '1234', true, 'KS', 'Group D'),
  ('user-anwar', 'Anwar', 'anwar@taxworldd.in', 'EMPLOYEE', '1234', true, 'AW', 'Group D')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  department = EXCLUDED.department,
  initials = EXCLUDED.initials;

INSERT INTO public.teams (id, name, department, description, lead_id, lead_name, member_ids, color)
VALUES
  ('team-group-a', 'Group A', 'Operations & Taxation', 'Functional delivery team consisting of Anas, Hasnian, and Huzaif.', 'user-anas', 'Anas', '["user-anas", "user-hasnian", "user-huzaif"]'::jsonb, 'blue'),
  ('team-group-b', 'Group B', 'Operations & Taxation', 'Functional delivery team consisting of Ameera, Adnan, and Kaif.', 'user-ameera', 'Ameera', '["user-ameera", "user-adnan", "user-kaif"]'::jsonb, 'emerald'),
  ('team-group-c', 'Group C', 'Operations & Taxation', 'Functional delivery team consisting of Asif, Saud, and Ishaque.', 'user-asif', 'Asif', '["user-asif", "user-saud", "user-ishaque"]'::jsonb, 'violet'),
  ('team-group-d', 'Group D', 'Operations & Taxation', 'Functional delivery team consisting of Saqib, Kashana, and Anwar.', 'user-saqib', 'Saqib', '["user-saqib", "user-kashana", "user-anwar"]'::jsonb, 'amber')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  description = EXCLUDED.description,
  lead_id = EXCLUDED.lead_id,
  lead_name = EXCLUDED.lead_name,
  member_ids = EXCLUDED.member_ids,
  color = EXCLUDED.color;

-- Insert 84 Client Accounts / Parties allocated across functional delivery groups
INSERT INTO public.projects (id, project_name, client_name, status, description)
VALUES
  -- Group A (22)
  ('party-a-01', 'LUCKY GAS SERVICES', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-02', 'NEW STAR TRADING', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-03', 'GANDHI GAS SERVICE', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-04', 'SUPER SALES SERVICE', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-05', 'HABIB METALS WORKS', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-06', 'NEW ROSHAN INDUSTRIES', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-07', 'UPKAR METAL WORKS', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-08', 'HUSSAIN TRADING CO', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-09', 'AG HOSPITALITY - ANIL GOPAL', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-10', 'BEYOND SIGNAGE', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-11', 'CUBOSQUARE PVT LTD', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-12', 'ARISTO TRADING', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-13', 'SHIVAM POWDER COATING', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-14', 'LUCKY BHARAT GAS', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-15', 'ASIAN ENGG WORKS', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-16', 'PROMETHEUS MARKETING', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-17', 'ARISTO TRADING ( KARNATAKA )', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-18', 'ARISTO TRADING ( HARYANA )', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-19', 'MARYAM ENTERPRISES', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-20', 'DIAMOND GLOBAL', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-21', 'ISHANVI ENGINEERING AND TECHNOSOLUTIONS', 'Group A', 'ACTIVE', 'Party allocated to Group A'),
  ('party-a-22', 'BALAJI ENTERPRISES', 'Group A', 'ACTIVE', 'Party allocated to Group A'),

  -- Group B (19)
  ('party-b-401', 'FABTECH INDUSTRIES', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 401)'),
  ('party-b-402', 'INDIA STEEL', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 402)'),
  ('party-b-403', 'WAHID TYRES', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 403)'),
  ('party-b-404', 'MUKHTAR TYRES', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 404)'),
  ('party-b-405', 'SHAH ENGINEERING WORKS', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 405)'),
  ('party-b-406', 'MANIKANDAN PALANI PERUMAL', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 406)'),
  ('party-b-407', 'PURAN TYRES', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 407)'),
  ('party-b-408', 'INTERGLOBE SYSTEMS', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 408)'),
  ('party-b-409', 'HELSA INC', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 409)'),
  ('party-b-410', 'SILITI CONSTRUCTION', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 410)'),
  ('party-b-411', 'BHANDUP GAS SUPPLIER', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 411)'),
  ('party-b-412', 'SP EXPORT', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 412)'),
  ('party-b-413', 'UK INDUSTRIES', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 413)'),
  ('party-b-414', 'KING CONSTRUCTION', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 414)'),
  ('party-b-415', 'INNOARCANAA LLP', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 415)'),
  ('party-b-416', 'JOYNEXUS PVT LTD', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 416)'),
  ('party-b-418a', 'D4D STUDIO', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 418)'),
  ('party-b-418b', 'SUN SHINE SCIENTIFIC COMPANY', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 418)'),
  ('party-b-419', 'WARNT ENTERPRISES', 'Group B', 'ACTIVE', 'Party allocated to Group B (Code: 419)'),

  -- Group C (13)
  ('party-c-501', 'CREATIVE INTERIORS', 'Group C', 'ACTIVE', 'Party allocated to Group C (Code: 501)'),
  ('party-c-502', 'NARAYAN SCIENTIFIC GLASS WORKS', 'Group C', 'ACTIVE', 'Party allocated to Group C (Code: 502)'),
  ('party-c-503', 'OVEN FABRICATOR', 'Group C', 'ACTIVE', 'Party allocated to Group C (Code: 503)'),
  ('party-c-505', 'V EXCELL ENGINEERING', 'Group C', 'ACTIVE', 'Party allocated to Group C (Code: 505)'),
  ('party-c-506', 'H.R.PIPES & FABRICATION WORKS', 'Group C', 'ACTIVE', 'Party allocated to Group C (Code: 506)'),
  ('party-c-507', 'ARTWORK', 'Group C', 'ACTIVE', 'Party allocated to Group C (Code: 507)'),
  ('party-c-508', 'DHANSE TYRE', 'Group C', 'ACTIVE', 'Party allocated to Group C (Code: 508)'),
  ('party-c-509', 'BHARAT DAIPER HOUSE', 'Group C', 'ACTIVE', 'Party allocated to Group C (Code: 509)'),
  ('party-c-510', 'BAHADUR ENGINEERING WORKS', 'Group C', 'ACTIVE', 'Party allocated to Group C (Code: 510)'),
  ('party-c-512', 'STARWOOD PACKERS', 'Group C', 'ACTIVE', 'Party allocated to Group C (Code: 512)'),
  ('party-c-515', 'S.ENTERPRISE AND SUSHMA TRAVELS', 'Group C', 'ACTIVE', 'Party allocated to Group C (Code: 515)'),
  ('party-c-519', 'SUBODH KITCHEN', 'Group C', 'ACTIVE', 'Party allocated to Group C (Code: 519)'),
  ('party-c-520', 'KHAF INDUSTRIES', 'Group C', 'ACTIVE', 'Party allocated to Group C (Code: 520)'),

  -- Group D (30)
  ('party-d-601', 'HINDUSTAN WASTE PAPER SUPPLY', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 601)'),
  ('party-d-602', 'COLOUR POWDER COAT', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 602)'),
  ('party-d-603', 'ARC METAL', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 603)'),
  ('party-d-604', 'HINDUSTAN PLASTER', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 604)'),
  ('party-d-605', 'SAWRAJ ENTERPRISES', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 605)'),
  ('party-d-606', 'IQRA RICE TRADER', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 606)'),
  ('party-d-607', 'WORLDD ENTERPRISE', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 607)'),
  ('party-d-608', 'AHAD ENTERPRISE', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 608)'),
  ('party-d-609', 'KOHINOOR RICE TRADERS', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 609)'),
  ('party-d-610', 'KMC CONSTRUCTION', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 610)'),
  ('party-d-611', 'MARUTI STEEL', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 611)'),
  ('party-d-612', 'ATTYAB PERFUMES', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 612)'),
  ('party-d-613', 'SK ENTERPRISES', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 613)'),
  ('party-d-614', 'AK TRADING', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 614)'),
  ('party-d-615', 'BABA WOOD CREATIVE', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 615)'),
  ('party-d-616', 'MUMBAI POWER', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 616)'),
  ('party-d-617', 'GIGA NEXUS TECHNOLOGIES LLP', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 617)'),
  ('party-d-618', 'ASHWIKA INFRA PLUMBING & CIVIL CO', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 618)'),
  ('party-d-619', 'NOOR PILE FOUNDATION', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 619)'),
  ('party-d-620', 'ADORE INTERIORS', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 620)'),
  ('party-d-621a', 'KR POLYMERS', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 621)'),
  ('party-d-621b', 'SIDDIQUI TRADING COMPANY', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 621)'),
  ('party-d-622', 'REEDA AIR LOWERS', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 622)'),
  ('party-d-625', 'MUSKAN PLY AGENCY', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 625)'),
  ('party-d-627', 'ANANYA ENTERPRISES', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 627)'),
  ('party-d-628', 'RIDA ENGINEERING WORKS', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 628)'),
  ('party-d-629', 'SPORTS WORLD', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 629)'),
  ('party-d-630', 'EXCELLENT TRADERS', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 630)'),
  ('party-d-631', 'NIRMAN INFRA CABINS', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 631)'),
  ('party-d-632', 'SB ENTERPRISES', 'Group D', 'ACTIVE', 'Party allocated to Group D (Code: 632)')
ON CONFLICT (id) DO UPDATE SET
  project_name = EXCLUDED.project_name,
  client_name = EXCLUDED.client_name,
  status = EXCLUDED.status,
  description = EXCLUDED.description;

