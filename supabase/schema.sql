-- ============================================================
-- HireFlow ATS — Esquema de Base de Datos para Supabase (PostgreSQL)
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- 1. Vacantes (Jobs)
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text not null,
  location text not null default 'Híbrido',
  modality text not null default 'Full-time',
  status text not null default 'open' check (status in ('open', 'paused', 'closed')),
  description text not null default '',
  required_skills text[] not null default '{}',
  nice_to_have_skills text[] not null default '{}',
  min_experience_years int not null default 0,
  salary_range text,
  created_at timestamptz not null default now()
);

-- 2. Base Histórica de Candidatos (Talent Pool)
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  location text,
  linkedin_url text,
  source text not null default 'Portal Propio',
  years_experience int not null default 0,
  skills text[] not null default '{}',
  cv_text text not null default '',
  cv_url text,
  cv_filename text,
  notes text default '',
  created_at timestamptz not null default now()
);

-- Índice Full-Text Search en español para búsqueda rápida de CVs históricos
create index if not exists idx_candidates_fts on public.candidates
  using gin (to_tsvector('spanish', coalesce(full_name, '') || ' ' || coalesce(cv_text, '') || ' ' || coalesce(notes, '')));

-- 3. Postulaciones y Pipeline ATS (Applications)
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  stage text not null default 'applied'
    check (stage in ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  ats_score int not null default 0 check (ats_score >= 0 and ats_score <= 100),
  matched_skills text[] not null default '{}',
  missing_skills text[] not null default '{}',
  rejection_reason text,
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, candidate_id)
);

-- 4. Gestión de Screening, Entrevistas y Citaciones (Interviews)
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  type text not null default 'screening' check (type in ('screening', 'technical', 'hr', 'final')),
  scheduled_at timestamptz not null,
  interviewer text not null,
  location_or_link text not null default '',
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  feedback text default '',
  rating int check (rating >= 1 and rating <= 5),
  created_at timestamptz not null default now()
);

-- 5. Storage Bucket para CVs (PDF / DOCX)
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- ============================================================
-- Row Level Security (RLS)
-- Para entorno interno inicial: permite lectura/escritura a usuarios autenticados
-- o anon durante pruebas. Ajustar según roles de RRHH en producción.
-- ============================================================
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;
alter table public.applications enable row level security;
alter table public.interviews enable row level security;

create policy "Allow all for jobs" on public.jobs for all using (true) with check (true);
create policy "Allow all for candidates" on public.candidates for all using (true) with check (true);
create policy "Allow all for applications" on public.applications for all using (true) with check (true);
create policy "Allow all for interviews" on public.interviews for all using (true) with check (true);
