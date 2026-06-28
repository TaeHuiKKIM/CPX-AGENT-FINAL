import { createClient } from '@supabase/supabase-js';

// VITE_ environment variables are injected by Vite at build time.
// In development, they should be set in a .env file.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
