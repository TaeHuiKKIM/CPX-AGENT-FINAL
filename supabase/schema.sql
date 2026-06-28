-- Supabase Schema for SPAI-CPX-AGENT

-- 1. Profiles Table (Optional, for extending auth users)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  updated_at timestamp with time zone,
  username text,
  full_name text,
  avatar_url text
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Scenarios Table (Optional if scenarios are hardcoded in FE, but backend uses it)
CREATE TABLE public.scenarios (
  scenario_id text PRIMARY KEY,
  title text,
  department text,
  difficulty text,
  patient_info jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- 3. Sessions Table (Records each practice attempt)
CREATE TABLE public.sessions (
  session_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  scenario_id text NOT NULL,
  mode text NOT NULL,
  status text NOT NULL DEFAULT 'INCOMPLETE',
  start_time timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  end_time timestamp with time zone
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
-- Allow users to insert/update their own sessions
CREATE POLICY "Users can manage their own sessions" ON public.sessions
  FOR ALL USING (auth.uid() = user_id);

-- 4. Transcripts Table (Records conversation logs)
CREATE TABLE public.transcripts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.sessions NOT NULL,
  speaker text NOT NULL,
  content text NOT NULL,
  audio_url text,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
-- For simplicity, can restrict to user's sessions if needed

-- 5. Rubrics Table
CREATE TABLE public.rubrics (
  rubric_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id text NOT NULL,
  category text NOT NULL,
  item text NOT NULL,
  weight integer NOT NULL DEFAULT 20,
  keywords jsonb
);
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;

-- 6. Feedback Results Table
CREATE TABLE public.feedback_results (
  result_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.sessions UNIQUE NOT NULL,
  rubric_id uuid,
  score_history_taking numeric,
  score_communication numeric,
  score_education numeric,
  total_score numeric,
  strengths jsonb,
  weaknesses jsonb,
  clinical_reasoning_flow jsonb,
  explainable_feedback jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.feedback_results ENABLE ROW LEVEL SECURITY;
