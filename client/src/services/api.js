// Always use relative /api path — Vite proxy forwards to backend both locally and via tunnel
const API_BASE = '/api';

let authToken = localStorage.getItem('padelmate_token');

export const api = {
  setToken(token) {
    authToken = token;
    localStorage.setItem('padelmate_token', token);
  },

  getToken() {
    return authToken;
  },

  clearToken() {
    authToken = null;
    localStorage.removeItem('padelmate_token');
  },

  async fetch(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    return res.json();
  },

  // Auth
  auth: {
    telegram: (initData) => api.fetch('/auth/telegram', { method: 'POST', body: JSON.stringify({ initData }) }),
  },

  // Users
  users: {
    me: () => api.fetch('/users/me'),
    onboard: (data) => api.fetch('/users/onboard', { method: 'POST', body: JSON.stringify(data) }),
    update: (data) => api.fetch('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
    updateRating: (data) => api.fetch('/users/me/rating', { method: 'PATCH', body: JSON.stringify(data) }),
    getById: (id) => api.fetch(`/users/${id}`),
    getStats: (id) => api.fetch(`/users/${id}/stats`),
  },

  // Matches
  matches: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.fetch(`/matches${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => api.fetch(`/matches/${id}`),
    create: (data) => api.fetch('/matches', { method: 'POST', body: JSON.stringify(data) }),
    join: (id) => api.fetch(`/matches/${id}/join`, { method: 'POST' }),
    leave: (id) => api.fetch(`/matches/${id}/leave`, { method: 'POST' }),
    delete: (id) => api.fetch(`/matches/${id}`, { method: 'DELETE' }),
    update: (id, data) => api.fetch(`/matches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    submitScore: (id, sets) => api.fetch(`/matches/${id}/score`, { method: 'POST', body: JSON.stringify({ sets }) }),
    confirmScore: (id) => api.fetch(`/matches/${id}/confirm`, { method: 'POST' }),
    approvePlayer: (matchId, userId) => api.fetch(`/matches/${matchId}/approve/${userId}`, { method: 'POST' }),
    rejectPlayer: (matchId, userId) => api.fetch(`/matches/${matchId}/reject/${userId}`, { method: 'POST' }),
  },

  // Leaderboard
  leaderboard: {
    get: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.fetch(`/leaderboard${qs ? `?${qs}` : ''}`);
    },
  },

  // Venues
  venues: {
    list: (city) => api.fetch(`/venues${city ? `?city=${city}` : ''}`),
  },

  // Tournaments
  tournaments: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.fetch(`/tournaments${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => api.fetch(`/tournaments/${id}`),
    register: (id, partnerId) => api.fetch(`/tournaments/${id}/register`, { method: 'POST', body: JSON.stringify({ partnerId }) }),
  },

  // Achievements
  achievements: {
    all: () => api.fetch('/achievements'),
    my: () => api.fetch('/achievements/my'),
  },

  // Admin
  admin: {
    stats: () => api.fetch('/admin/stats'),
    users: () => api.fetch('/admin/users'),
    editUser: (id, data) => api.fetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteUser: (id) => api.fetch(`/admin/users/${id}`, { method: 'DELETE' }),
    matches: () => api.fetch('/admin/matches'),
    deleteMatch: (id) => api.fetch(`/admin/matches/${id}`, { method: 'DELETE' }),
  },
};
