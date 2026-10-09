async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Pedido falhou (${response.status}).`)
  return data
}

export const gameApi = {
  health: () => request('/api/health'),
  me: () => request('/api/auth/me'),
  register: (username, password) => request('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  login: (username, password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST', body: '{}' }),
  state: () => request('/api/game/state'),
  exportData: () => request('/api/account/export'),
  deleteAccount: (password) => request('/api/auth/account', { method: 'DELETE', body: JSON.stringify({ password }) }),
  submitActivity: (activity) => request('/api/activities', {
    method: 'POST',
    body: JSON.stringify({
      clientActivityId: activity.id,
      activityType: activity.activityType || 'walking',
      trailId: activity.trailCode || null,
      elapsed: activity.elapsed,
      points: activity.points || [],
    }),
  }),
}
