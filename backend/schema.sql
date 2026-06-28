-- =================================================================================
-- SPAI-CPX-AGENT Supabase Schema (PostgreSQL)
-- Epic 1: Database Setup, Auth Triggers, and RLS Policies
-- =================================================================================
-- LEGACY REFERENCE ONLY.
-- The current React/FastAPI app uses text scenario IDs such as "scen-fever-5".
-- Do not apply this file to a new Supabase project for the current deployment.
-- Use ../supabase/schema.sql instead.

-- 1. Create Custom Types (Enums)
CREATE TYPE user_role AS ENUM ('STUDENT', 'PROFESSOR', 'ADMIN');
CREATE TYPE subscription_plan AS ENUM ('BASIC', 'PREMIUM', 'ENTERPRISE');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELED');
CREATE TYPE scenario_difficulty AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE session_mode AS ENUM ('LEARNING', 'EXAM');
CREATE TYPE session_status AS ENUM ('COMPLETED', 'INCOMPLETE', 'ERROR');
CREATE TYPE speaker_type AS ENUM ('USER', 'AI');

-- =================================================================================
-- 2. Create Tables
-- =================================================================================

-- 2.1 Organizations
CREATE TABLE public.organizations (
    organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 Users (Linked to auth.users via Trigger)
CREATE TABLE public.users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(organization_id) ON DELETE SET NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    grade INTEGER,
    role user_role DEFAULT 'STUDENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.3 Subscriptions
CREATE TABLE public.subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    plan_type subscription_plan NOT NULL DEFAULT 'BASIC',
    status subscription_status NOT NULL DEFAULT 'ACTIVE',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.4 Scenarios
CREATE TABLE public.scenarios (
    scenario_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT,
    difficulty scenario_difficulty DEFAULT 'MEDIUM',
    patient_info JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.5 Rubrics
CREATE TABLE public.rubrics (
    rubric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES public.scenarios(scenario_id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    criteria JSONB NOT NULL,
    updated_by UUID REFERENCES public.users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.6 Sessions
CREATE TABLE public.sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES public.scenarios(scenario_id) ON DELETE CASCADE,
    mode session_mode NOT NULL DEFAULT 'EXAM',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    status session_status DEFAULT 'INCOMPLETE'
);

-- 2.7 Transcripts
CREATE TABLE public.transcripts (
    transcript_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(session_id) ON DELETE CASCADE,
    speaker speaker_type NOT NULL,
    content TEXT NOT NULL,
    audio_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.8 Feedback Results
CREATE TABLE public.feedback_results (
    result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(session_id) ON DELETE CASCADE,
    rubric_id UUID REFERENCES public.rubrics(rubric_id) ON DELETE SET NULL,
    score_history_taking NUMERIC(5,2),
    score_communication NUMERIC(5,2),
    score_education NUMERIC(5,2),
    total_score NUMERIC(5,2),
    strengths JSONB,
    weaknesses JSONB,
    clinical_reasoning_flow JSONB,
    explainable_feedback JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================================
-- 3. Supabase Auth Trigger (Auto-create profile on sign-up)
-- =================================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (user_id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'STUDENT'::user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =================================================================================
-- 4. Row Level Security (RLS) Policies
-- =================================================================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_results ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile, Admins can read all.
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING ( auth.uid() = user_id );

-- Scenarios are public (or readable by all authenticated users)
CREATE POLICY "Scenarios are viewable by everyone" 
ON public.scenarios FOR SELECT 
USING ( true );

-- Sessions: Students can only see their own sessions.
CREATE POLICY "Students view own sessions" 
ON public.sessions FOR SELECT 
USING ( auth.uid() = user_id );

CREATE POLICY "Students insert own sessions" 
ON public.sessions FOR INSERT 
WITH CHECK ( auth.uid() = user_id );

-- Transcripts: Viewable/Insertable if the user owns the session
CREATE POLICY "Transcripts linked to user session" 
ON public.transcripts FOR ALL 
USING ( EXISTS (SELECT 1 FROM public.sessions WHERE session_id = transcripts.session_id AND user_id = auth.uid()) );

-- Feedback Results: Viewable if user owns the session
CREATE POLICY "Feedback linked to user session" 
ON public.feedback_results FOR SELECT 
USING ( EXISTS (SELECT 1 FROM public.sessions WHERE session_id = feedback_results.session_id AND user_id = auth.uid()) );

-- =================================================================================
-- 5. Storage Bucket (For Audio Recordings)
-- =================================================================================
-- Note: Run this from Supabase Dashboard -> Storage if the SQL interface restricts it,
-- but the RLS for the storage can be defined here.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio_records', 'audio_records', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload audio to their session folders" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'audio_records' AND auth.uid() = owner );
