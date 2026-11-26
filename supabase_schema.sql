-- ==============================================================================
-- HIREFLOW ATS - SCRIPT DE MIGRACIÓN Y ESQUEMA PARA SUPABASE (POSTGRESQL)
-- Desarrollado por WaveFrame Studio (https://waveframe.com.ar/)
-- ==============================================================================
--
-- INSTRUCCIONES DE USO EN SUPABASE:
-- 1. Inicia sesión en https://supabase.com y abre tu proyecto (o crea uno gratuito).
-- 2. En el menú lateral izquierdo, ve a "SQL Editor" (ícono de consola).
-- 3. Haz clic en "New query", pega la totalidad de este script y presiona "RUN" (o Ctrl + Enter).
-- 4. Ve a "Project Settings" (ícono de engranaje) > "API".
-- 5. Copia la "Project URL" y la clave "anon public".
-- 6. En tu proyecto local de HireFlow, crea o edita el archivo .env con:
--      VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
--      VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
-- 7. ¡Listo! HireFlow detectará automáticamente las credenciales y comenzará
--    a sincronizar todos los datos en tiempo real en la nube.
-- ==============================================================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLA DE VACANTES (jobs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.jobs (
    id TEXT PRIMARY KEY DEFAULT ('job-' || substr(gen_random_uuid()::text, 1, 8)),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    modality TEXT NOT NULL DEFAULT 'Full-time',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paused', 'closed')),
    description TEXT NOT NULL,
    required_skills TEXT[] NOT NULL DEFAULT '{}',
    nice_to_have_skills TEXT[] NOT NULL DEFAULT '{}',
    min_experience_years INTEGER NOT NULL DEFAULT 0,
    salary_range TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. TABLA DE CANDIDATOS (candidates)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.candidates (
    id TEXT PRIMARY KEY DEFAULT ('cand-' || substr(gen_random_uuid()::text, 1, 8)),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    linkedin_url TEXT,
    source TEXT NOT NULL DEFAULT 'Portal Propio',
    years_experience INTEGER NOT NULL DEFAULT 0,
    skills TEXT[] NOT NULL DEFAULT '{}',
    cv_text TEXT NOT NULL DEFAULT '',
    cv_url TEXT,
    cv_filename TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. TABLA DE POSTULACIONES AL PIPELINE (applications)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.applications (
    id TEXT PRIMARY KEY DEFAULT ('app-' || substr(gen_random_uuid()::text, 1, 8)),
    job_id TEXT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    candidate_id TEXT NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    stage TEXT NOT NULL DEFAULT 'applied' CHECK (stage IN ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')),
    ats_score INTEGER NOT NULL DEFAULT 0,
    matched_skills TEXT[] NOT NULL DEFAULT '{}',
    missing_skills TEXT[] NOT NULL DEFAULT '{}',
    rejection_reason TEXT,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. TABLA DE ENTREVISTAS (interviews)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.interviews (
    id TEXT PRIMARY KEY DEFAULT ('int-' || substr(gen_random_uuid()::text, 1, 8)),
    application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'screening' CHECK (type IN ('screening', 'technical', 'hr', 'final')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    interviewer TEXT NOT NULL,
    location_or_link TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    feedback TEXT,
    rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. TABLA DE AUDITORÍA Y ACTIVIDAD EN VIVO (activity_logs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY DEFAULT ('act-' || substr(gen_random_uuid()::text, 1, 8)),
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('stage_changed', 'interview_scheduled', 'interview_completed', 'candidate_created', 'candidate_rejected')),
    title TEXT NOT NULL,
    details TEXT,
    candidate_id TEXT,
    candidate_name TEXT,
    job_title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. BUCKET DE STORAGE PARA CURRÍCULUMS EN PDF (resumes)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Política de Storage para permitir subida y lectura de CVs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Access to resumes bucket' AND tablename = 'objects'
    ) THEN
        CREATE POLICY "Public Access to resumes bucket"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'resumes');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Upload to resumes bucket' AND tablename = 'objects'
    ) THEN
        CREATE POLICY "Public Upload to resumes bucket"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'resumes');
    END IF;
END $$;

-- ==============================================================================
-- 8. POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Habilitamos RLS en todas las tablas para producción
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso completo para la aplicación web
CREATE POLICY "Acceso total a jobs" ON public.jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a candidates" ON public.candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a applications" ON public.applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a interviews" ON public.interviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 9. DATOS DE PRUEBA INICIALES (SEMILLA / SEED DATA)
-- ==============================================================================

-- 9.1 Vacantes iniciales
INSERT INTO public.jobs (id, title, department, location, modality, status, description, required_skills, nice_to_have_skills, min_experience_years, salary_range, created_at)
VALUES
(
    'job-1',
    'Desarrollador Fullstack React',
    'Sistemas',
    'Híbrido - CABA',
    'Full-time',
    'open',
    'Buscamos un perfil con sólido dominio de React, TypeScript, APIs REST y PostgreSQL para liderar iniciativas de modernización de aplicaciones internas.',
    ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Git'],
    ARRAY['Docker', 'Tailwind CSS', 'Next.js'],
    3,
    '$ 1.800.000 - $ 2.400.000',
    '2026-11-01T10:00:00Z'
),
(
    'job-2',
    'Analista de Recursos Humanos Sr.',
    'Recursos Humanos',
    'Presencial - Casa Central',
    'Full-time',
    'open',
    'Responsable de ciclo completo de reclutamiento, onboarding, gestión de clima laboral y soporte a líderes en planes de carrera y desempeño.',
    ARRAY['Selección IT', 'Entrevistas por competencias', 'Legislación Laboral', 'Excel Avanzado'],
    ARRAY['LinkedIn Recruiter', 'Metodologías Ágiles'],
    4,
    '$ 1.500.000 - $ 1.900.000',
    '2026-11-03T11:30:00Z'
),
(
    'job-3',
    'Ejecutivo Comercial B2B',
    'Comercial',
    'Remoto - Argentina',
    'Full-time',
    'open',
    'Orientado a prospección activa, negociación con cuentas corporativas y cierre de acuerdos comerciales de software y servicios.',
    ARRAY['Negociación', 'Venta Consultiva B2B', 'CRM HubSpot o Salesforce', 'Prospección Outbound'],
    ARRAY['Inglés Avanzado', 'Manejo de Indicadores CAC y LTV'],
    2,
    '$ 1.200.000 + Comisiones',
    '2026-11-05T15:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- 9.2 Candidatos iniciales
INSERT INTO public.candidates (id, full_name, email, phone, location, linkedin_url, source, years_experience, skills, cv_text, cv_filename, created_at)
VALUES
(
    'cand-1',
    'Valentina Gómez',
    'valentina.gomez@gmail.com',
    '+54 11 4455-8899',
    'CABA, Argentina',
    'https://linkedin.com/in/valentina-gomez-dev',
    'LinkedIn Recruiter',
    4,
    ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Tailwind CSS', 'Git'],
    'Desarrolladora Web Fullstack con más de 4 años de experiencia construyendo plataformas SaaS con React, TypeScript y backend Node.js con base de datos PostgreSQL.',
    'CV_Valentina_Gomez.pdf',
    '2026-11-10T14:20:00Z'
),
(
    'cand-2',
    'Camila Fernández',
    'camila.fernandez@outlook.com',
    '+54 11 5566-7788',
    'Vicente López, Buenos Aires',
    'https://linkedin.com/in/camila-fernandez-rrhh',
    'Portal Propio',
    5,
    ARRAY['Selección IT', 'Entrevistas por competencias', 'Legislación Laboral', 'Excel Avanzado', 'LinkedIn Recruiter'],
    'Licenciada en Recursos Humanos con 5 años de trayectoria en atracción de talento IT y generalista, diseño de procesos de onboarding y clima organizacional.',
    'CV_Camila_Fernandez.pdf',
    '2026-11-12T09:10:00Z'
),
(
    'cand-3',
    'Lucas Pereyra',
    'lucas.pereyra@empresa.com',
    '+54 11 6677-1122',
    'Córdoba Capital',
    'https://linkedin.com/in/lucas-pereyra-sales',
    'Referido Interno',
    3,
    ARRAY['Negociación', 'Venta Consultiva B2B', 'CRM HubSpot o Salesforce', 'Prospección Outbound', 'Inglés Avanzado'],
    'Especialista en desarrollo comercial B2B con comprobado track record de cumplimiento de objetivos y venta consultiva en empresas de tecnología.',
    'CV_Lucas_Pereyra.pdf',
    '2026-11-14T16:45:00Z'
),
(
    'cand-4',
    'Martín Rodríguez',
    'martin.rodriguez@gmail.com',
    '+54 11 3322-9900',
    'La Plata, Buenos Aires',
    'https://linkedin.com/in/martin-rodriguez',
    'LinkedIn Jobs',
    2,
    ARRAY['React', 'JavaScript', 'HTML5', 'CSS3', 'Git'],
    'Desarrollador Frontend con 2 años desarrollando interfaces con React y Git. Buscando profundizar en TypeScript y Node.js.',
    'CV_Martin_Rodriguez.pdf',
    '2026-11-15T11:00:00Z'
),
(
    'cand-5',
    'Sofía Martínez',
    'sofia.martinez@gmail.com',
    '+54 11 7788-9900',
    'Rosario, Santa Fe',
    'https://linkedin.com/in/sofia-martinez-rrhh',
    'Zonajobs',
    1,
    ARRAY['Selección IT', 'Entrevistas por competencias'],
    'Estudiante avanzada de Recursos Humanos con 1 año de experiencia realizando filtrado de CVs y entrevistas iniciales.',
    'CV_Sofia_Martinez.pdf',
    '2026-11-16T18:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- 9.3 Postulaciones iniciales (Applications)
INSERT INTO public.applications (id, job_id, candidate_id, stage, ats_score, matched_skills, missing_skills, applied_at, updated_at)
VALUES
(
    'app-1',
    'job-1',
    'cand-1',
    'interview',
    100,
    ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Git'],
    ARRAY[]::TEXT[],
    '2026-11-10T14:30:00Z',
    '2026-11-17T10:00:00Z'
),
(
    'app-2',
    'job-2',
    'cand-2',
    'offer',
    100,
    ARRAY['Selección IT', 'Entrevistas por competencias', 'Legislación Laboral', 'Excel Avanzado'],
    ARRAY[]::TEXT[],
    '2026-11-12T09:30:00Z',
    '2026-11-19T16:00:00Z'
),
(
    'app-3',
    'job-3',
    'cand-3',
    'hired',
    93,
    ARRAY['Negociación', 'Venta Consultiva B2B', 'CRM HubSpot o Salesforce', 'Prospección Outbound'],
    ARRAY[]::TEXT[],
    '2026-11-14T17:00:00Z',
    '2026-11-22T18:00:00Z'
),
(
    'app-4',
    'job-1',
    'cand-4',
    'screening',
    58,
    ARRAY['React', 'Git'],
    ARRAY['TypeScript', 'Node.js', 'PostgreSQL'],
    '2026-11-15T11:15:00Z',
    '2026-11-16T10:00:00Z'
),
(
    'app-5',
    'job-2',
    'cand-5',
    'rejected',
    55,
    ARRAY['Selección IT', 'Entrevistas por competencias'],
    ARRAY['Legislación Laboral', 'Excel Avanzado'],
    '2026-11-16T18:15:00Z',
    '2026-11-18T14:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- 9.4 Entrevistas iniciales
INSERT INTO public.interviews (id, application_id, type, scheduled_at, interviewer, location_or_link, status, feedback, rating, created_at)
VALUES
(
    'int-1',
    'app-1',
    'technical',
    '2026-11-24T14:00:00Z',
    'Facundo (Sistemas)',
    'https://meet.google.com/abc-defg-hij',
    'scheduled',
    NULL,
    NULL,
    '2026-11-20T14:05:00Z'
),
(
    'int-2',
    'app-2',
    'screening',
    '2026-11-25T16:30:00Z',
    'Sofía Lilén Seal (RRHH)',
    'Llamada telefónica / Meet',
    'scheduled',
    NULL,
    NULL,
    '2026-11-18T11:15:00Z'
),
(
    'int-3',
    'app-3',
    'final',
    '2026-11-21T11:00:00Z',
    'Sofía Lilén Seal (RRHH)',
    'Sala de Reuniones 2 - Casa Central',
    'completed',
    'Excelente fit cultural y dominio técnico de liquidación e indicadores.',
    5,
    '2026-11-17T09:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- 9.5 Bitácora de actividad inicial
INSERT INTO public.activity_logs (id, user_name, user_role, action_type, title, details, candidate_id, candidate_name, job_title, created_at)
VALUES
(
    'act-1',
    'Sofía Seal',
    'Recruiter RRHH',
    'stage_changed',
    'Movió a Valentina Gómez a Entrevista Técnica',
    'Afinidad ATS 100%. Requisitos de React y TypeScript validados.',
    'cand-1',
    'Valentina Gómez',
    'Desarrollador Fullstack React',
    NOW() - INTERVAL '15 minutes'
),
(
    'act-2',
    'Lucas Gómez',
    'Hiring Manager',
    'interview_completed',
    'Completó y calificó la entrevista de Lucas Pereyra con 5★',
    'Fit cultural excelente, perfil comercial y sólidas referencias.',
    'cand-3',
    'Lucas Pereyra',
    'Ejecutivo Comercial B2B',
    NOW() - INTERVAL '2 hours'
),
(
    'act-3',
    'Sofía Seal',
    'Recruiter RRHH',
    'stage_changed',
    'Avanzó a Camila Fernández a etapa de Oferta',
    'Aprobación final por parte de Dirección.',
    'cand-2',
    'Camila Fernández',
    'Analista de Recursos Humanos Sr.',
    NOW() - INTERVAL '4 hours'
),
(
    'act-4',
    'Sofía Seal',
    'Recruiter RRHH',
    'candidate_created',
    'Cargó el CV de Martín Rodríguez con lectura de PDF',
    'Score ATS calculado automáticamente en 58%.',
    'cand-4',
    'Martín Rodríguez',
    'Desarrollador Fullstack React',
    NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- Fin del script de inicialización.
