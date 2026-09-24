const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function apiRequest(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'Something went wrong. Please try again.');
  }

  return payload;
}

export const authApi = {
  signUp: (payload) => apiRequest('/api/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/api/auth/login', { method: 'POST', body: payload }),
  requestPasswordReset: (payload) => apiRequest('/api/auth/password-reset', { method: 'POST', body: payload }),
};
