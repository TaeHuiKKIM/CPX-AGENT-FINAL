const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'medi-cpx-token';

function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const { method = 'GET', body, auth = true } = options;
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || '서버 요청 중 오류가 발생했습니다.';
    throw new Error(message);
  }

  return data;
}

export const api = {
  getToken,
  setToken,
  clearToken,
  login: (email, password) => request('/auth/login', { method: 'POST', auth: false, body: { email, password } }),
  register: (payload) => request('/auth/register', { method: 'POST', auth: false, body: payload }),
  me: () => request('/auth/me'),
  getScenarios: () => request('/scenarios'),
  updateScenarioStats: (scenarioId, score) => request(`/scenarios/${scenarioId}/stats`, { method: 'PATCH', body: { score } }),
  updateRubrics: (scenarioId, rubrics) => request(`/scenarios/${scenarioId}/rubrics`, { method: 'PUT', body: { rubrics } }),
  getHistory: () => request('/history'),
  createHistory: (record) => request('/history', { method: 'POST', body: record }),
  deleteHistory: () => request('/history', { method: 'DELETE' }),
  generatePatientResponse: (payload) => request('/ai/patient-response', { method: 'POST', body: payload })
};
