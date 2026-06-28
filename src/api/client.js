import { supabase } from './supabase';

const FASTAPI_BASE_URL = import.meta.env.VITE_FASTAPI_BASE_URL || '/api/v1';

// Legacy token methods (Supabase manages its own session, but we keep these for compatibility if needed)
function getToken() {
  return null;
}

function setToken() {
  // Managed by Supabase
}

function clearToken() {
  supabase.auth.signOut();
}

async function getFastApiHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
  };
}

export const api = {
  getToken,
  setToken,
  clearToken,

  // --- Supabase Auth ---
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data.user;
  },
  
  register: async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (error) throw new Error(error.message);
    return data.user;
  },
  
  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");
    
    // Fetch profile data from public.users
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    return profile || user;
  },

  // --- Supabase DB (Scenarios & History) ---
  getScenarios: async () => {
    const { data, error } = await supabase.from('scenarios').select('*, rubrics(*)');
    if (error) throw new Error(error.message);
    return data;
  },
  
  updateScenarioStats: async (scenarioId, score) => {
    // Placeholder if needed
    return { success: true };
  },
  
  updateRubrics: async (scenarioId, rubrics) => {
    const { data, error } = await supabase.from('rubrics').update({ criteria: rubrics }).eq('scenario_id', scenarioId);
    if (error) throw new Error(error.message);
    return data;
  },
  
  getHistory: async () => {
    // History combines sessions and feedback_results
    const { data, error } = await supabase
      .from('sessions')
      .select('*, feedback_results(*)');
    if (error) throw new Error(error.message);
    return data;
  },
  
  createHistory: async () => {
    // Managed natively by FastAPI WebSocket logging now
    return { success: true };
  },
  
  deleteHistory: async () => {
    const { error } = await supabase.from('sessions').delete().neq('session_id', '00000000-0000-0000-0000-000000000000');
    if (error) throw new Error(error.message);
  },

  // --- FastAPI Integrations ---
  // triggerEvaluation is the new replacement for generating patient response locally
  triggerEvaluation: async (sessionId) => {
    const headers = await getFastApiHeaders();
    const response = await fetch(`${FASTAPI_BASE_URL}/feedback/${sessionId}/evaluate`, {
      method: 'POST',
      headers
    });
    if (!response.ok) throw new Error("Failed to trigger evaluation");
    return response.json();
  }
};
