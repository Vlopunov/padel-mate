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
    search: (q, { city, ratingMin, ratingMax } = {}) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (city) params.set('city', city);
      if (ratingMin) params.set('ratingMin', ratingMin);
      if (ratingMax) params.set('ratingMax', ratingMax);
      return api.fetch(`/users/search?${params.toString()}`);
    },
  },

  // Matches
  matches: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.fetch(`/matches${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => api.fetch(`/matches/${id}`),
    create: (data) => api.fetch('/matches', { method: 'POST', body: JSON.stringify(data) }),
    createPast: (data) => api.fetch('/matches/past', { method: 'POST', body: JSON.stringify(data) }),
    join: (id) => api.fetch(`/matches/${id}/join`, { method: 'POST' }),
    leave: (id) => api.fetch(`/matches/${id}/leave`, { method: 'POST' }),
    delete: (id) => api.fetch(`/matches/${id}`, { method: 'DELETE' }),
    update: (id, data) => api.fetch(`/matches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    submitScore: (id, sets, teams) => api.fetch(`/matches/${id}/score`, { method: 'POST', body: JSON.stringify({ sets, teams }) }),
    confirmScore: (id) => api.fetch(`/matches/${id}/confirm`, { method: 'POST' }),
    approvePlayer: (matchId, userId) => api.fetch(`/matches/${matchId}/approve/${userId}`, { method: 'POST' }),
    rejectPlayer: (matchId, userId) => api.fetch(`/matches/${matchId}/reject/${userId}`, { method: 'POST' }),
    addPlayer: (matchId, userId) => api.fetch(`/matches/${matchId}/add-player/${userId}`, { method: 'POST' }),
    acceptInvite: (matchId) => api.fetch(`/matches/${matchId}/accept-invite`, { method: 'POST' }),
    declineInvite: (matchId) => api.fetch(`/matches/${matchId}/decline-invite`, { method: 'POST' }),
    getComments: (matchId) => api.fetch(`/matches/${matchId}/comments`),
    addComment: (matchId, text) => api.fetch(`/matches/${matchId}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),
    downloadCalendar: (matchId) => {
      // Build full URL with token for external browser opening
      // Telegram WebView on iOS can't handle blob downloads — open in system browser instead
      const url = `${window.location.origin}${API_BASE}/matches/${matchId}/calendar?token=${encodeURIComponent(authToken)}`;
      const tg = window.Telegram?.WebApp;
      if (tg?.openLink) {
        tg.openLink(url);
      } else {
        window.open(url, '_blank');
      }
    },
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
    unregister: (id) => api.fetch(`/tournaments/${id}/unregister`, { method: 'DELETE' }),
  },

  // Achievements
  achievements: {
    all: () => api.fetch('/achievements'),
    my: () => api.fetch('/achievements/my'),
  },

  // Coach
  coach: {
    dashboard: () => api.fetch('/coach/dashboard'),
    students: () => api.fetch('/coach/students'),
    addStudent: (userId) => api.fetch('/coach/students', { method: 'POST', body: JSON.stringify({ userId }) }),
    removeStudent: (studentId) => api.fetch(`/coach/students/${studentId}`, { method: 'DELETE' }),
    studentDetail: (studentId) => api.fetch(`/coach/students/${studentId}`),
    cohortStats: () => api.fetch('/coach/cohort-stats'),
    // Sessions
    sessions: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.fetch(`/coach/sessions${qs ? `?${qs}` : ''}`);
    },
    sessionDetail: (id) => api.fetch(`/coach/sessions/${id}`),
    createSession: (data) => api.fetch('/coach/sessions', { method: 'POST', body: JSON.stringify(data) }),
    updateSession: (id, data) => api.fetch(`/coach/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteSession: (id) => api.fetch(`/coach/sessions/${id}`, { method: 'DELETE' }),
    cancelSession: (id) => api.fetch(`/coach/sessions/${id}/cancel`, { method: 'POST' }),
    completeSession: (id) => api.fetch(`/coach/sessions/${id}/complete`, { method: 'POST' }),
    // Notes
    getNotes: (studentId) => api.fetch(`/coach/students/${studentId}/notes`),
    addNote: (studentId, data) => api.fetch(`/coach/students/${studentId}/notes`, { method: 'POST', body: JSON.stringify(data) }),
    deleteNote: (noteId) => api.fetch(`/coach/notes/${noteId}`, { method: 'DELETE' }),
    // Payments
    payments: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.fetch(`/coach/payments${qs ? `?${qs}` : ''}`);
    },
    createPayment: (data) => api.fetch('/coach/payments', { method: 'POST', body: JSON.stringify(data) }),
    updatePayment: (id, data) => api.fetch(`/coach/payments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deletePayment: (id) => api.fetch(`/coach/payments/${id}`, { method: 'DELETE' }),
    studentBalance: (studentId) => api.fetch(`/coach/students/${studentId}/balance`),
    // Packages
    packages: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.fetch(`/coach/packages${qs ? `?${qs}` : ''}`);
    },
    createPackage: (data) => api.fetch('/coach/packages', { method: 'POST', body: JSON.stringify(data) }),
    updatePackage: (id, data) => api.fetch(`/coach/packages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    usePackageSession: (id) => api.fetch(`/coach/packages/${id}/use`, { method: 'POST' }),
    paymentSummary: () => api.fetch('/coach/payment-summary'),
    updateProfile: (data) => api.fetch('/coach/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  },

  // Coaches (public)
  coaches: {
    list: (city) => api.fetch(`/coaches${city ? `?city=${city}` : ''}`),
    getById: (id) => api.fetch(`/coaches/${id}`),
    reviews: (id) => api.fetch(`/coaches/${id}/reviews`),
    writeReview: (id, data) => api.fetch(`/coaches/${id}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
  },

  // Training (student-facing)
  training: {
    available: () => api.fetch('/training/available'),
    my: () => api.fetch('/training/my'),
    book: (sessionId) => api.fetch(`/training/book/${sessionId}`, { method: 'POST' }),
    cancelBooking: (sessionId) => api.fetch(`/training/book/${sessionId}`, { method: 'DELETE' }),
    homework: () => api.fetch('/training/homework'),
  },

  // Admin
  admin: {
    stats: () => api.fetch('/admin/stats'),
    users: () => api.fetch('/admin/users'),
    editUser: (id, data) => api.fetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteUser: (id) => api.fetch(`/admin/users/${id}`, { method: 'DELETE' }),
    matches: () => api.fetch('/admin/matches'),
    updateMatch: (id, data) => api.fetch(`/admin/matches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    removePlayer: (matchId, userId) => api.fetch(`/admin/matches/${matchId}/remove-player/${userId}`, { method: 'DELETE' }),
    deleteMatch: (id) => api.fetch(`/admin/matches/${id}`, { method: 'DELETE' }),
    tournaments: () => api.fetch('/admin/tournaments'),
    createTournament: (data) => api.fetch('/admin/tournaments', { method: 'POST', body: JSON.stringify(data) }),
    updateTournament: (id, data) => api.fetch(`/admin/tournaments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteTournament: (id) => api.fetch(`/admin/tournaments/${id}`, { method: 'DELETE' }),
    deleteRegistration: (tournamentId, regId) => api.fetch(`/admin/tournaments/${tournamentId}/registration/${regId}`, { method: 'DELETE' }),
    analytics: (days = 30) => api.fetch(`/admin/analytics?days=${days}`),
  },
};
